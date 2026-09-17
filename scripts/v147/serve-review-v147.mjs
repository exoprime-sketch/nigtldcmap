import { resolve } from "node:path";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
const server = await startStaticBuildServer(resolve("tmp/build-v147-detail-analysis"), { port: 4326 });
console.log(`V147 detail review: ${server.url}`);
