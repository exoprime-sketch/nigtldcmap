#!/usr/bin/env node
/**
 * Records one row of the Vercel Deployment Storage ledger.
 *
 * Vercel bills Deployment Storage per retained deployment output (GB-month),
 * and the Usage page gives only a team total per project - no per-deployment
 * size, and no API. So the ledger measures what can be measured from here and
 * leaves one column for the dashboard figure:
 *
 *   - every Vercel deployment of the repository, from the GitHub Deployments
 *     API (Vercel writes one record per deployment; public repo, no token)
 *   - the static output each one carried, from the size of `public/` at the
 *     deployed SHA (CRA copies public/ verbatim into build/) plus the measured
 *     size of static/ (bundle, with or without source maps)
 *   - which of them the retention policy would still be holding today, with
 *     the documented exceptions (last 10 overall, last 20 per environment,
 *     latest per open branch) applied
 *
 * The dashboard number goes in by hand: Usage -> Deployment Storage -> Projects,
 * last 30 days. `--dashboard-gb <n>` records it on the same row.
 *
 *   node scripts/v140/deployment-storage-ledger-v140.mjs \
 *     [--retention-preview-days 30] [--retention-production-days 30] \
 *     [--static-mb 3.1] [--dashboard-gb 17.2] [--note "..."]
 *
 * Appends to reports/v140/deployment-storage-ledger-v140.json.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEDGER = resolve(ROOT, "reports/v140/deployment-storage-ledger-v140.json");
const REPO = "exoprime-sketch/nigtldcmap";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const previewDays = Number(opt("--retention-preview-days", "30"));
const productionDays = Number(opt("--retention-production-days", "30"));
// static/ measured on this tree: 12.0 MB with source maps, 3.1 MB without.
const staticMb = Number(opt("--static-mb", "12.0"));
const dashboardGb = opt("--dashboard-gb", null);
const note = opt("--note", "");

const git = (a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });

async function fetchDeployments() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/deployments?per_page=100&page=${page}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "nigt-storage-ledger" },
    });
    if (!res.ok) throw new Error(`GitHub Deployments API ${res.status}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

/** Bytes of tracked public/ at a commit; null when the commit is not local. */
function publicBytesAt(sha) {
  try {
    const out = git(["ls-tree", "-r", "-l", sha, "--", "public"]);
    let bytes = 0;
    for (const line of out.split("\n")) {
      const m = line.match(/^\S+ \S+ \S+\s+(\d+)\t/);
      if (m) bytes += Number(m[1]);
    }
    return bytes;
  } catch {
    return null;
  }
}

const deployments = await fetchDeployments();
const now = Date.now();
const MB = 1048576;

const rows = deployments
  .map((d) => {
    const publicBytes = publicBytesAt(d.sha);
    return {
      id: d.id,
      environment: d.environment,
      createdAt: d.created_at,
      ageDays: (now - Date.parse(d.created_at)) / 86400000,
      sha: d.sha.slice(0, 7),
      ref: d.ref,
      outputMb: publicBytes === null ? null : publicBytes / MB + staticMb,
    };
  })
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

// Retention: a deployment past its period is deleted unless an exception holds.
// Deployment states are not in the GitHub record, so every deployment is taken
// as Ready - the conservative reading (more retained, not less).
const retainedByPolicy = (() => {
  const keep = new Set();
  rows.slice(0, 10).forEach((r) => keep.add(r.id));
  for (const env of ["Production", "Preview"]) {
    rows.filter((r) => r.environment === env).slice(0, 20).forEach((r) => keep.add(r.id));
  }
  const latestPerRef = new Map();
  for (const r of rows) if (!latestPerRef.has(r.ref)) latestPerRef.set(r.ref, r.id);
  const openRefs = new Set(
    git(["branch", "-r", "--format=%(refname:short)"]).split("\n").map((s) => s.replace(/^origin\//, "").trim()).filter(Boolean)
  );
  for (const [ref, id] of latestPerRef) if (openRefs.has(ref)) keep.add(id);
  return rows.filter((r) => {
    const limit = r.environment === "Production" ? productionDays : previewDays;
    return r.ageDays <= limit || keep.has(r.id);
  });
})();

const sum = (list) => list.reduce((s, r) => s + (r.outputMb ?? 0), 0);
const unknown = rows.filter((r) => r.outputMb === null).length;

const entry = {
  recordedAt: new Date().toISOString(),
  note,
  policy: { previewDays, productionDays, staticMbPerDeployment: staticMb },
  deployments: {
    total: rows.length,
    byEnvironment: rows.reduce((acc, r) => ({ ...acc, [r.environment]: (acc[r.environment] || 0) + 1 }), {}),
    oldest: rows[rows.length - 1]?.createdAt ?? null,
    newest: rows[0]?.createdAt ?? null,
    last7Days: rows.filter((r) => r.ageDays <= 7).length,
    last30Days: rows.filter((r) => r.ageDays <= 30).length,
    shaNotLocal: unknown,
  },
  outputMbPerDeployment: {
    latest: rows[0]?.outputMb ?? null,
    min: Math.min(...rows.map((r) => r.outputMb ?? Infinity)),
    max: Math.max(...rows.map((r) => r.outputMb ?? 0)),
  },
  estimatedRetainedGb: {
    allRecorded: sum(rows) / 1024,
    underPolicy: sum(retainedByPolicy) / 1024,
    underPolicyCount: retainedByPolicy.length,
    proListPriceUsdPerMonth: (sum(retainedByPolicy) / 1024) * 0.1,
  },
  dashboardDeploymentStorageGb: dashboardGb === null ? null : Number(dashboardGb),
  perDay: Object.entries(
    rows.reduce((acc, r) => {
      const day = r.createdAt.slice(0, 10);
      acc[day] = acc[day] || { deployments: 0, outputMb: 0 };
      acc[day].deployments += 1;
      acc[day].outputMb += r.outputMb ?? 0;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v, outputMb: Math.round(v.outputMb) })),
};

const ledger = existsSync(LEDGER)
  ? JSON.parse(readFileSync(LEDGER, "utf8"))
  : { schema: "nigt-deployment-storage-ledger-1", repository: REPO, unit: "GB = 1024 MB of retained static output; the dashboard figure is Vercel's own", entries: [] };
ledger.entries.push(entry);
mkdirSync(dirname(LEDGER), { recursive: true });
writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);

const gb = (n) => `${n.toFixed(2)} GB`;
console.log(`deployments recorded by Vercel: ${entry.deployments.total} (${JSON.stringify(entry.deployments.byEnvironment)}), ${entry.deployments.oldest?.slice(0, 10)} .. ${entry.deployments.newest?.slice(0, 10)}`);
console.log(`output per deployment: latest ${entry.outputMbPerDeployment.latest?.toFixed(0)} MB, range ${entry.outputMbPerDeployment.min.toFixed(0)}..${entry.outputMbPerDeployment.max.toFixed(0)} MB (static ${staticMb} MB)`);
console.log(`estimated retained: all ${gb(entry.estimatedRetainedGb.allRecorded)}; under policy preview ${previewDays}d / production ${productionDays}d: ${entry.estimatedRetainedGb.underPolicyCount} deployments, ${gb(entry.estimatedRetainedGb.underPolicy)} (~$${entry.estimatedRetainedGb.proListPriceUsdPerMonth.toFixed(2)}/month at Pro list price)`);
if (unknown) console.log(`${unknown} deployed SHAs are not in the local clone; their output counted as 0 - run git fetch --all first`);
console.log(`dashboard figure: ${entry.dashboardDeploymentStorageGb ?? "(not recorded - pass --dashboard-gb)"}`);
console.log(`ledger: ${LEDGER} (${ledger.entries.length} entries)`);
