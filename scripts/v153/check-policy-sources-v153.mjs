/**
 * V153-D3: request every source URL of policyDescriptionsV153.json once and
 * record the HTTP status, so the report can say which links answered.
 *
 *   node scripts/v153/check-policy-sources-v153.mjs [--out reports/v153/d3-source-links.json] [--timeout 20000]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const OUT = resolve(ROOT, opt("--out", "reports/v153/d3-source-links.json"));
const TIMEOUT = Number(opt("--timeout", "20000"));
const SOURCE = resolve(ROOT, "src/data/visualization/policyDescriptionsV153.json");

const entries = JSON.parse(readFileSync(SOURCE, "utf8")).entries;
const urls = new Map();
entries.forEach((entry) => entry.sourceUrl.forEach((url) => {
  const keys = urls.get(url) || [];
  keys.push(entry.key);
  urls.set(url, keys);
}));

const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) nigtldcmap-link-check/1.0",
  accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
  "accept-language": "vi,en;q=0.8,ko;q=0.7",
};

async function probe(url) {
  const started = Date.now();
  for (const method of ["HEAD", "GET"]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, { method, headers: HEADERS, redirect: "follow", signal: controller.signal });
      clearTimeout(timer);
      // Some portals reject HEAD; a GET then decides.
      if (method === "HEAD" && (response.status === 405 || response.status === 403 || response.status >= 500)) continue;
      return { status: response.status, method, finalUrl: response.url, contentType: response.headers.get("content-type") || "", ms: Date.now() - started };
    } catch (error) {
      clearTimeout(timer);
      if (method === "GET") return { status: 0, method, error: String(error?.cause?.code || error?.name || error), ms: Date.now() - started };
    }
  }
  return { status: 0, method: "GET", error: "unreachable", ms: Date.now() - started };
}

const results = [];
for (const [url, keys] of urls) {
  const result = await probe(url);
  results.push({ url, host: new URL(url).hostname, keys, ...result });
  console.log(`${String(result.status).padStart(3)} ${result.method.padEnd(4)} ${url}`);
}

const byStatus = results.reduce((acc, row) => {
  const bucket = row.status === 0 ? "unreachable" : String(row.status);
  acc[bucket] = (acc[bucket] || 0) + 1;
  return acc;
}, {});
const output = { checkedAt: new Date().toISOString(), timeoutMs: TIMEOUT, urlCount: results.length, byStatus, results };
writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ urlCount: results.length, byStatus }));
