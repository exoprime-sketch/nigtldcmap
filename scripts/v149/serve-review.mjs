// Loopback-only review server. Static build remains untouched. Optional
// deterministic ranking fixture is for UI verification, never production.
import { createServer, request } from 'node:http';
import { resolve } from 'node:path';
import { startStaticBuildServer } from '../v125/browser-runtime.mjs';
import usage from '../../server/usage.cjs';
const fixture = process.argv.includes('--ranking-fixture');
const staticServer = await startStaticBuildServer(resolve('tmp/build-v149-review'));
const handler = usage.createUsageHandler({env: fixture ? {UPSTASH_REDIS_REST_URL:'https://fixture.invalid',UPSTASH_REDIS_REST_TOKEN:'fixture-only',USAGE_HASH_SECRET:'fixture-only-123456789012345678901234',VERCEL_ENV:'preview'} : {},
  fetcher: async (_,o) => ({ok:true,json:async()=>({result:JSON.parse(o.body)[3].includes(':detail:') ? ['B-005',120,'A-023',95,'A-003',80] : ['A-023',45,'A-024',21]})})});
const port = fixture ? 4329 : 4328;
createServer((req,res) => {
  if (req.url?.split('?')[0] === '/api/usage') { void handler(req,res); return; }
  const proxy=request(staticServer.origin+req.url,{method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  proxy.on('error',()=>{res.statusCode=502;res.end();});req.pipe(proxy);
}).listen(port,'127.0.0.1',()=>console.log('review http://127.0.0.1:'+port+' ranking fixture='+fixture));
