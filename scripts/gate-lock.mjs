#!/usr/bin/env node
/**
 * One heavy gate at a time on this machine.
 *
 * Several sessions share one computer, and two browser-driven gates at once
 * (finalize:v151, qa:acceptance:v162, the full e2e run) ran it out of memory.
 * This wraps such a command in a lock file in the user's home directory:
 *
 *   node scripts/gate-lock.mjs [--name <label>] -- <command ...>
 *
 * - The lock `~/.nigt-gate.lock` records the session, branch, command and start
 *   time of the holder. It is created atomically (exclusive create).
 * - While another holder has it, this waits and checks again every 30 seconds,
 *   printing who holds it. A lock older than 2 hours is treated as abandoned,
 *   reported and removed.
 * - The lock is released when the command ends, fails or is interrupted.
 * - A command already running inside a lock (a gate that calls another gate,
 *   e.g. finalize:v151 -> qa:acceptance:v162) inherits it through
 *   NIGT_GATE_LOCK_HELD and does not wait for itself.
 */
import { spawn, execSync } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const LOCK_PATH = resolve(homedir(), ".nigt-gate.lock");
const WAIT_MS = 30_000;
const STALE_MS = 2 * 60 * 60 * 1000;

const argv = process.argv.slice(2);
const split = argv.indexOf("--");
const own = split >= 0 ? argv.slice(0, split) : [];
const command = split >= 0 ? argv.slice(split + 1) : argv;
const nameIndex = own.indexOf("--name");
const name = nameIndex >= 0 ? own[nameIndex + 1] : command.join(" ");
if (command.length === 0) {
  console.error("usage: node scripts/gate-lock.mjs [--name <label>] -- <command ...>");
  process.exit(2);
}

function branch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
}

function readLock() {
  try {
    return JSON.parse(readFileSync(LOCK_PATH, "utf8"));
  } catch {
    return null;
  }
}

const token = randomUUID();
let held = false;

function tryAcquire() {
  try {
    const fd = openSync(LOCK_PATH, "wx");
    const record = {
      token,
      name,
      command: command.join(" "),
      session: process.env.CLAUDE_CODE_SESSION_ID || process.env.NIGT_SESSION || `${hostname()}:${process.pid}`,
      branch: branch(),
      cwd: process.cwd(),
      pid: process.pid,
      startedAt: new Date().toISOString(),
    };
    writeSync(fd, `${JSON.stringify(record, null, 2)}\n`);
    closeSync(fd);
    held = true;
    return true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return false;
  }
}

function release() {
  if (!held) return;
  const current = readLock();
  if (current?.token === token && existsSync(LOCK_PATH)) unlinkSync(LOCK_PATH);
  held = false;
}

async function acquire() {
  for (;;) {
    if (tryAcquire()) return;
    const holder = readLock();
    const startedAt = holder?.startedAt ? Date.parse(holder.startedAt) : NaN;
    if (!holder || !Number.isFinite(startedAt) || Date.now() - startedAt > STALE_MS) {
      console.log(`[gate-lock] removing an abandoned lock (${holder ? `${holder.name} · ${holder.branch} · ${holder.startedAt}` : "unreadable"})`);
      try {
        unlinkSync(LOCK_PATH);
      } catch {
        // another waiter removed it first
      }
      continue;
    }
    const minutes = Math.round((Date.now() - startedAt) / 60000);
    console.log(`[gate-lock] waiting: "${holder.name}" on ${holder.branch} (session ${holder.session}) has run for ${minutes} min`);
    await new Promise((done) => setTimeout(done, WAIT_MS));
  }
}

const inherited = Boolean(process.env.NIGT_GATE_LOCK_HELD);
if (!inherited) {
  await acquire();
  console.log(`[gate-lock] acquired for "${name}" (${LOCK_PATH})`);
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    release();
    process.exit(130);
  });
}
process.on("exit", release);

// The command runs through the shell (npm, npx and .cmd shims on Windows);
// an argument with spaces or shell characters is quoted so it arrives whole.
const quote = (arg) => (/^[\w@%+=:,./\\-]+$/u.test(arg) ? arg : `"${arg.replace(/"/gu, '\\"')}"`);
const child = spawn(command.map(quote).join(" "), {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, NIGT_GATE_LOCK_HELD: inherited ? process.env.NIGT_GATE_LOCK_HELD : token },
});
child.on("exit", (code, signal) => {
  release();
  if (!inherited) console.log(`[gate-lock] released "${name}" (exit ${code ?? signal})`);
  process.exit(code ?? 1);
});
child.on("error", (error) => {
  console.error(`[gate-lock] ${error.message}`);
  release();
  process.exit(1);
});
