#!/usr/bin/env node
/**
 * V158: the deployment before and after the per-element download ZIPs.
 *
 * Measures two production builds (the output Vercel uploads): total bytes and
 * files, each country's data tree and its downloads, and the largest file.
 * Read-only.
 *
 *   node scripts/v158/download-zip-size-v158.mjs --before <build> --after <build>
 *     [--out reports/v158/download-zip-size-v158]
 */
import { readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const OUT = resolve(ROOT, opt("out", "reports/v158/download-zip-size-v158"));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );
}

function measure(build) {
  const root = resolve(ROOT, build);
  const files = walk(root).map((file) => ({ rel: relative(root, file).split(sep).join("/"), bytes: statSync(file).size }));
  const sum = (rows) => rows.reduce((total, row) => total + row.bytes, 0);
  const countries = {};
  for (const row of files) {
    const match = row.rel.match(/^data\/([^/]+)\/v2\//u);
    if (!match) continue;
    const slot = (countries[match[1]] ??= { treeBytes: 0, treeFiles: 0, downloadBytes: 0, downloadFiles: 0 });
    slot.treeBytes += row.bytes;
    slot.treeFiles += 1;
    if (/\/downloads\/[a-e]-\d{3}\.(?:zip|json|csv)$/u.test(row.rel)) {
      slot.downloadBytes += row.bytes;
      slot.downloadFiles += 1;
    }
  }
  const largest = files.reduce((best, row) => (row.bytes > best.bytes ? row : best), { rel: null, bytes: 0 });
  return { build, totalBytes: sum(files), totalFiles: files.length, countries, largest };
}

const before = measure(opt("before", "tmp/build-before"));
const after = measure(opt("after", "tmp/build-after"));
const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`; // decimal MB, as in docs/DEPLOYMENT_CAPACITY_V158.md
const report = { schema: "download-zip-size-v158", before, after, ratio: Number((before.totalBytes / after.totalBytes).toFixed(2)) };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(`${OUT}.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const lines = [
  "# 배포 용량 전후 — 요소별 다운로드 ZIP (V158)",
  "",
  "| 항목 | 전 | 후 |",
  "|---|---|---|",
  `| 배포 전체 | ${mb(before.totalBytes)} · ${before.totalFiles}개 | ${mb(after.totalBytes)} · ${after.totalFiles}개 |`,
  ...Object.keys({ ...before.countries, ...after.countries }).sort().flatMap((code) => {
    const b = before.countries[code] || { treeBytes: 0, treeFiles: 0, downloadBytes: 0, downloadFiles: 0 };
    const a = after.countries[code] || { treeBytes: 0, treeFiles: 0, downloadBytes: 0, downloadFiles: 0 };
    return [
      `| ${code} 데이터 트리 | ${mb(b.treeBytes)} · ${b.treeFiles}개 | ${mb(a.treeBytes)} · ${a.treeFiles}개 |`,
      `| ${code} 다운로드 | ${mb(b.downloadBytes)} · ${b.downloadFiles}개 | ${mb(a.downloadBytes)} · ${a.downloadFiles}개 |`,
    ];
  }),
  `| 가장 큰 파일 | ${before.largest.rel} ${mb(before.largest.bytes)} | ${after.largest.rel} ${mb(after.largest.bytes)} |`,
  "",
  `전체 ${report.ratio}배 감소.`,
  "",
];
writeFileSync(`${OUT}.md`, lines.join("\n"), "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", beforeBytes: before.totalBytes, afterBytes: after.totalBytes, ratio: report.ratio })}\n`);
