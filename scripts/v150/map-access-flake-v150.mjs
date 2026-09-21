// Runs the V135 map-access audit repeatedly against the current build/ and
// records the left-panel drag result of every run, so a flaky resizer is
// measured rather than retried away.
//
//   node scripts/v150/map-access-flake-v150.mjs --label fixed [--runs 10]
//
// Appends one phase to reports/v150/map-access-flake-v150.json.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "reports/v150/map-access-flake-v150.json");
const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1]; };
const RUNS = Number(arg("--runs", "10"));
const LABEL = arg("--label", "current");
const AUDIT_REPORT = resolve(ROOT, "reports/v135/map-access-audit-v135.json");
// CI runners are slower than this workstation; a CPU throttle (Emulation
// API, honoured by scripts/v125/browser-runtime.mjs) reproduces the
// input-before-effect race that a fast machine hides.
const CPU_THROTTLE = Number(arg("--cpu", "0"));

const buildJs = (() => {
  try { return readFileSync(resolve(ROOT, "build/index.html"), "utf8").match(/main\.[a-f0-9]+\.js/u)?.[0] || null; } catch { return null; }
})();
const runs = [];
for (let i = 1; i <= RUNS; i += 1) {
  const started = Date.now();
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "audit:map-access:v135"], { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 50e6, env: { ...process.env, ...(CPU_THROTTLE > 1 ? { V135_THROTTLE_CPU: String(CPU_THROTTLE) } : {}) } });
  let report = null;
  try { report = JSON.parse(readFileSync(AUDIT_REPORT, "utf8")); } catch { report = null; }
  const resize = report?.checks?.find((c) => c.name === "LEFT_PANEL_POINTER_RESIZE_PASS");
  const summary = report?.checks?.find((c) => c.type === "summary") || null;
  runs.push({
    run: i,
    exitCode: result.status,
    elapsedMs: Date.now() - started,
    resize: resize ? { status: resize.status, before: resize.actual?.before?.left?.width ?? null, after: resize.actual?.after?.left?.width ?? null, restored: resize.actual?.restored?.left?.width ?? null, storedAfter: resize.actual?.after?.stored ?? null } : null,
    failedChecks: summary?.failedChecks || (report?.checks || []).filter((c) => c.status === "FAIL").map((c) => c.name),
  });
  console.log(`${LABEL} run ${i}/${RUNS}: exit ${result.status}, resize ${resize?.status ?? "n/a"} (${resize?.actual?.before?.left?.width ?? "?"} → ${resize?.actual?.after?.left?.width ?? "?"} → restored ${resize?.actual?.restored?.left?.width ?? "?"})`);
}
const phase = {
  label: LABEL,
  generatedAt: new Date().toISOString(),
  platform: `${process.platform} node ${process.version}`,
  cpuThrottle: CPU_THROTTLE,
  buildJs,
  runs: runs.length,
  resizePassed: runs.filter((r) => r.resize?.status === "PASS").length,
  auditPassed: runs.filter((r) => r.exitCode === 0).length,
  results: runs,
};
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { schema: "nigt-map-access-flake-v150", phases: [] };
existing.phases = existing.phases.filter((p) => p.label !== LABEL).concat(phase);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`);
console.log(`${LABEL}: resize ${phase.resizePassed}/${phase.runs}, audit ${phase.auditPassed}/${phase.runs} -> ${OUT}`);
process.exitCode = phase.resizePassed === phase.runs ? 0 : 1;
