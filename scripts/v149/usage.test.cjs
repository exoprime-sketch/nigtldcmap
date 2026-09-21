const test = require('node:test');
const assert = require('node:assert/strict');
const {createUsageHandler, dayKey, ranking, READ, WRITE} = require('../../server/usage.cjs');
const env = {UPSTASH_REDIS_REST_URL:'https://test.invalid', UPSTASH_REDIS_REST_TOKEN:'test-only', USAGE_HASH_SECRET:'test-only-secret-not-a-credential-123456', VERCEL_ENV:'production'};
const body = {kind:'detail',elementId:'A-003',visitor:'abcdefab-abcd-abcd-abcd-abcdefabcdef'};
const headers = {host:'example.test',origin:'https://example.test','content-type':'application/json','user-agent':'Browser'};
async function call(handler, method='POST', changes={}) {
  const req = {method, headers:{...headers}, body:{...body}, socket:{remoteAddress:'192.0.2.1'}, ...changes};
  const res = {headers:{},setHeader(k,v){this.headers[k]=v;},end(text){this.body=JSON.parse(text);}};
  await handler(req,res); return res;
}
test('unconfigured does not invent counts or expose credentials', async () => {
  const r=await call(createUsageHandler({env:{}}),'GET'); assert.equal(r.statusCode,503); assert.equal(r.body.reason,'not-configured'); assert.equal(r.body.detail,undefined);
});
test('Korea midnight boundary', () => {
  assert.equal(dayKey(Date.parse('2026-09-17T14:59:59Z')),'2026-09-17');
  assert.equal(dayKey(Date.parse('2026-09-17T15:00:00Z')),'2026-09-18');
});
test('stable ranking excludes unknown and invalid counts', () => {
  assert.deepEqual(ranking(['A-003',2,'A-001',2,'bad',99,'A-002',-1],new Set(['A-001','A-002','A-003'])),[{elementId:'A-001',count:2},{elementId:'A-003',count:2}]);
});
test('shared counts read 30 dated buckets and sorted public results', async () => {
  const calls=[]; const h=createUsageHandler({env, now:()=>Date.parse('2026-09-18T01:00:00Z'),fetcher:async (_,o)=>{const cmd=JSON.parse(o.body); calls.push(cmd); assert.equal(o.headers.Authorization,'Bearer test-only'); return {ok:true,json:async()=>({result:cmd[3].includes(':detail:') ? ['A-003','12','A-002','30'] : ['A-023',9]})};}});
  const r=await call(h,'GET'); assert.equal(r.statusCode,200); assert.equal(r.body.detail[0].elementId,'A-002'); assert.equal(r.body.map[0].elementId,'A-023'); assert.equal(r.body.from,'2026-08-20');
  assert.equal(calls.length,2); assert.equal(calls[0].length,33); assert.equal(calls[0][1],READ); assert.match(r.headers['Cache-Control'],/s-maxage=60/);
});
test('writes use atomic deduplication and hashed rate keys', async () => {
  let command; const h=createUsageHandler({env,fetcher:async (_,o)=>{command=JSON.parse(o.body); return {ok:true,json:async()=>({result:1})};}});
  const r=await call(h); assert.equal(r.body.counted,true); assert.equal(command[1],WRITE); assert.equal(command[2],3); assert.equal(command.at(-1),'A-003');
  assert.ok(!JSON.stringify(command).includes('192.0.2.1')); assert.ok(!JSON.stringify(command).includes(body.visitor));
  assert.match(WRITE,/'EX', 1800, 'NX'/); assert.match(WRITE,/2678400/);
});
test('dedup and rate-limit results not counted', async () => {
  for(const value of [0,-1]) { const r=await call(createUsageHandler({env,fetcher:async()=>({ok:true,json:async()=>({result:value})})})); assert.equal(r.statusCode,value ? 429 : 200); assert.notEqual(r.body.counted,true); }
});
test('rejects foreign origins, missing origin, invalid kind/id/map/visitor, oversized and malformed bodies', async () => {
  const h=createUsageHandler({env,fetcher:async()=>{throw new Error('must not call');}});
  for(const [changes,code] of [
    [{headers:{...headers,origin:'https://evil.test'}},403],
    [{headers:{...headers,origin:undefined}},403],
    [{headers:{...headers,'content-type':'text/plain'}},415],
    [{body:{...body,kind:'hover'}},400],
    [{body:{...body,elementId:'B-999'}},400],
    [{body:{...body,kind:'map',elementId:'A-003'}},400],
    [{body:{...body,visitor:'x'}},400],
    [{body:'{'},400],
    [{headers:{...headers,'content-length':2048}},413]]) assert.equal((await call(h,'POST',changes)).statusCode,code);
});
test('preview, privacy, bot traffic ignored', async () => {
  const fetcher=async()=>{throw new Error('must not call');};
  assert.equal((await call(createUsageHandler({env:{...env,VERCEL_ENV:'preview'},fetcher}))).body.reason,'non-production');
  for(const additions of [{dnt:'1'},{'sec-gpc':'1'},{'user-agent':'HeadlessChrome'}]) assert.equal((await call(createUsageHandler({env,fetcher}),'POST',{headers:{...headers,...additions}})).statusCode,202);
});
test('storage errors fail closed, secrets never returned', async () => {
  for(const fetcher of [async()=>{throw new Error(env.UPSTASH_REDIS_REST_TOKEN);},async()=>({ok:false}),async()=>({ok:true,json:async()=>({error:'broken'})})]) {
    const r=await call(createUsageHandler({env,fetcher}),'GET'); assert.equal(r.statusCode,503); assert.ok(!JSON.stringify(r.body).includes('test-only'));
  }
});
test('only read and count methods', async () => { const r=await call(createUsageHandler({env}),'DELETE'); assert.equal(r.statusCode,405); });
