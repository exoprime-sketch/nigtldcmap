const { createHmac } = require('node:crypto');
const directory = require('../src/data/datasetDirectoryV149.json');
const ids = new Set(directory.map(x => x.elementId));
const mapIds = new Set(directory.filter(x => x.map).map(x => x.elementId));
const DAY = 86400;
const WRITE = `
local rate = redis.call('INCR', KEYS[1])
if rate == 1 then redis.call('EXPIRE', KEYS[1], 60) end
if rate > 120 then return -1 end
if not redis.call('SET', KEYS[2], '1', 'EX', 1800, 'NX') then return 0 end
redis.call('ZINCRBY', KEYS[3], 1, ARGV[1])
redis.call('EXPIRE', KEYS[3], 2678400)
return 1`;
const READ = `
local totals = {}
for _,key in ipairs(KEYS) do
  local rows = redis.call('ZRANGE', key, 0, -1, 'WITHSCORES')
  for i=1,#rows,2 do totals[rows[i]] = (totals[rows[i]] or 0) + tonumber(rows[i+1]) end
end
local result = {}
for id,count in pairs(totals) do table.insert(result,id); table.insert(result,count) end
return result`;
function dayKey(ms) { return new Date(ms + 9 * 3600000).toISOString().slice(0,10); }
function ranking(flat, allowed) {
  const result = [];
  for (let i=0;i<flat.length;i+=2) if (allowed.has(flat[i]) && Number.isSafeInteger(Number(flat[i+1])) && Number(flat[i+1]) > 0) result.push({elementId:flat[i], count:Number(flat[i+1])});
  return result.sort((a,b) => b.count-a.count || a.elementId.localeCompare(b.elementId));
}
function createUsageHandler({env = process.env, fetcher = fetch, now = Date.now} = {}) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  const secret = env.USAGE_HASH_SECRET;
  const configured = Boolean(url?.startsWith('https://') && token && secret?.length >= 32);
  const prefix = env.USAGE_KEY_PREFIX || 'nigtldcmap:usage:v1';
  async function command(args) {
    const response = await fetcher(url, {method:'POST', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify(args), signal:AbortSignal.timeout(4000)});
    if (!response.ok) throw new Error('storage unavailable');
    const body = await response.json();
    if (body.error || body.result === undefined) throw new Error('storage unavailable');
    return body.result;
  }
  return async function handler(req,res) {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-store');
    const send = (code, body) => { res.statusCode=code; res.end(JSON.stringify(body)); };
    if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return send(405,{status:'method-not-allowed'}); }
    if (!configured) return send(503,{status:'unavailable', reason:'not-configured'});
    try {
      const ms = now();
      if (req.method === 'GET') {
        const days = Array.from({length:30},(_,i) => dayKey(ms-i*DAY*1000));
        const [detail,map] = await Promise.all(['detail','map'].map(kind => command(['EVAL',READ,30,...days.map(d => `${prefix}:${kind}:${d}`)])));
        res.setHeader('Cache-Control','public, max-age=30, s-maxage=60, stale-while-revalidate=120');
        return send(200,{status:'ready', windowDays:30, from:days[29], through:days[0], timezone:'Asia/Seoul', generatedAt:new Date(ms).toISOString(), detail:ranking(detail,ids), map:ranking(map,mapIds)});
      }
      // Preview QA must not pollute production rankings. Local test servers
      // need explicit opt-in and a separate prefix/store.
      if (env.VERCEL_ENV !== 'production' && env.USAGE_ENABLE_WRITES !== 'true') return send(202,{status:'ignored',reason:'non-production'});
      if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') return send(202,{status:'ignored',reason:'privacy'});
      const host = req.headers.host;
      let origin;
      try { origin = new URL(req.headers.origin); } catch { return send(403,{status:'forbidden'}); }
      if (origin.host !== host || !['http:','https:'].includes(origin.protocol) || req.headers['sec-fetch-site'] === 'cross-site') return send(403,{status:'forbidden'});
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(415,{status:'unsupported-media-type'});
      if (Number(req.headers['content-length']) > 1024) return send(413,{status:'too-large'});
      let body = req.body;
      if (!body) { let raw=''; for await (const chunk of req) { raw+=chunk; if (Buffer.byteLength(raw)>1024) return send(413,{status:'too-large'}); } try { body=JSON.parse(raw); } catch { return send(400,{status:'invalid'}); } }
      if (typeof body === 'string') { try { body=JSON.parse(body); } catch { return send(400,{status:'invalid'}); } }
      if (!body || !['detail','map'].includes(body.kind) || !ids.has(body.elementId) || (body.kind === 'map' && !mapIds.has(body.elementId)) || !/^[a-f0-9-]{36}$/i.test(body.visitor || '')) return send(400,{status:'invalid'});
      if (/bot|crawler|spider|headless|playwright/i.test(req.headers['user-agent'] || '')) return send(202,{status:'ignored',reason:'automated'});
      const hash = value => createHmac('sha256',secret).update(value).digest('hex').slice(0,32);
      // IP is used transiently for abuse protection; never stored in raw form.
      // Daily rotation prevents this rate-limit key becoming a visitor history.
      const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
      const rate = `${prefix}:rate:${hash(`${dayKey(ms)}:${ip}`)}`;
      const dedup = `${prefix}:seen:${hash(body.visitor)}:${body.kind}:${body.elementId}`;
      const value = await command(['EVAL',WRITE,3,rate,dedup,`${prefix}:${body.kind}:${dayKey(ms)}`,body.elementId]);
      if (value === -1) { res.setHeader('Retry-After','60'); return send(429,{status:'rate-limited'}); }
      return send(200,{status:'ready', counted:value === 1});
    } catch { return send(503,{status:'unavailable',reason:'storage-unavailable'}); }
  };
}
module.exports = {createUsageHandler, dayKey, ranking, READ, WRITE};
