import { startStaticBuildServer } from '../v125/browser-runtime.mjs';
import { resolve } from 'node:path';
const server = await startStaticBuildServer(resolve('tmp/build-v150-review'), { port: 4330 });
console.log(server);
