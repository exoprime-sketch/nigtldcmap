import { resolve } from "node:path";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
const server = await startStaticBuildServer(resolve(process.argv[2] || "tmp/build-v146-detail-analysis"), { port: 4325 });
console.log(`V146 detail review: ${server.url}`);
