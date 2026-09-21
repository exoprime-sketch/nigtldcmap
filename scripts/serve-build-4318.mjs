// Serve the existing build/ read-only on a fixed port for browser inspection.
import { resolve } from "node:path";
import { PROJECT_ROOT } from "./v125/audit-utils.mjs";
import { startStaticBuildServer } from "./v125/browser-runtime.mjs";
const port = Number(process.argv[2] || 4318);
const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"), { port });
console.log("serving", server.url);
setInterval(() => {}, 1 << 30);
