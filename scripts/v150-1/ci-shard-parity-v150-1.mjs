// Compares two V136 release-audit reports check by check: the single-run
// report and the sharded summary must name the same checks with the same
// verdicts, or the sharding changed the judgement.
//
//   node scripts/v150-1/ci-shard-parity-v150-1.mjs --single tmp/release-single-main.json --sharded reports/v136/release-audit-v136.json
//   [--out reports/v150-1/ci-shard-parity-v150-1.json]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1]; };
const single = JSON.parse(readFileSync(resolve(ROOT, arg("--single", "tmp/release-single-main.json")), "utf8"));
const sharded = JSON.parse(readFileSync(resolve(ROOT, arg("--sharded", "reports/v136/release-audit-v136.json")), "utf8"));
const OUT = resolve(ROOT, arg("--out", "reports/v150-1/ci-shard-parity-v150-1.json"));

const map = (report) => new Map((report.checks || []).map((check) => [check.name, check.status]));
const a = map(single), b = map(sharded);
const names = [...new Set([...a.keys(), ...b.keys()])];
const rows = names.map((name) => ({ name, single: a.get(name) ?? "absent", sharded: b.get(name) ?? "absent", same: a.get(name) === b.get(name) }));
const timings = (report) => Object.fromEntries((report.commandResults || []).map((row) => [row.name, row.elapsedMs]));
const result = {
  schema: "nigt-ci-shard-parity-v150-1",
  generatedAt: new Date().toISOString(),
  single: { generatedAt: single.generatedAt, status: single.status, checks: a.size, passed: single.summary?.passed, failed: single.summary?.failed },
  sharded: { generatedAt: sharded.generatedAt, status: sharded.status, checks: b.size, passed: sharded.summary?.passed, failed: sharded.summary?.failed },
  identicalCheckSet: names.length === a.size && names.length === b.size,
  differingChecks: rows.filter((row) => !row.same),
  parity: names.length === a.size && names.length === b.size && rows.every((row) => row.same),
  commandElapsedMs: { single: timings(single), sharded: timings(sharded) },
  checks: rows,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ parity: result.parity, checks: names.length, single: result.single, sharded: result.sharded, differing: result.differingChecks.map((row) => `${row.name}: ${row.single} vs ${row.sharded}`) }));
process.exitCode = result.parity ? 0 : 1;
