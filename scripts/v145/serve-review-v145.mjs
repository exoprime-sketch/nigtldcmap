import { resolve } from "node:path";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
const server = await startStaticBuildServer(resolve(process.argv[2] || "tmp/build-v145-map-overlap"), { port: 4324 });
console.log(`V145 review: ${server.url}`);
