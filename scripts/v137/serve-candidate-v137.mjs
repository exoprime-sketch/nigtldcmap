#!/usr/bin/env node
/**
 * Serve the candidate build on a fixed port, for Playwright's webServer.
 *
 * The static server itself is the one every QA run in this repo already uses -
 * same MIME types, same SPA fallback, same no-store headers - so the E2E suite
 * and the CDP audits are looking at the same thing. This only pins the port and
 * keeps the process alive.
 */
import { resolve } from "node:path";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const buildRoot = resolve(ROOT, process.env.NIGT_E2E_BUILD || opt("--build", ".verify/candidate/build"));
const port = Number(process.env.NIGT_E2E_PORT || opt("--port", "4317"));

const server = await startStaticBuildServer(buildRoot, { port });
console.log(`serving ${buildRoot} at ${server.url}`);

const stop = async () => {
  await server.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
