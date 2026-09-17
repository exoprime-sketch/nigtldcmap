import { resolve } from "node:path";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
const server = await startStaticBuildServer(resolve(process.argv[2] || "tmp/build-v144-review-final"), { port: 4323 });
console.log(`V144 review: ${server.url}`);
