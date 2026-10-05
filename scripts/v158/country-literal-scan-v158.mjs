#!/usr/bin/env node
/**
 * V158: where the app's code still names a registry country.
 *
 * The country layer reads every value that differs by country (data root,
 * region key, boundary, place names, copy) from public/data/countries.json.
 * This lists every string literal in src (tests excluded, comments ignored)
 * that holds a registry country's ISO3, Korean or English name or data root,
 * so what remains can be judged file by file.
 *
 *   node scripts/v158/country-literal-scan-v158.mjs [--out reports/v158/country-literal-scan-v158]
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const at = argv.indexOf("--out");
const OUT = resolve(ROOT, at >= 0 ? argv[at + 1] : "reports/v158/country-literal-scan-v158");
const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8")).countries;
// V166: a country only named so far has no data root - no term for it.
const terms = registry
  .flatMap((row) => [
    { iso3: row.iso3, term: row.iso3, kind: "iso3" },
    { iso3: row.iso3, term: row.nameKo, kind: "nameKo" },
    { iso3: row.iso3, term: row.nameEn, kind: "nameEn" },
    { iso3: row.iso3, term: row.dataRoot, kind: "dataRoot" },
  ])
  .filter(({ term }) => typeof term === "string" && term.length > 0);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/u.test(name) && !/\.test\.tsx?$/u.test(name) ? [path] : [];
  });

// Drops comments; keeps string, template and JSX text so a literal on screen still counts.
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//gu, (block) => block.replace(/[^\n]/gu, " ")).replace(/(^|[^:"'`\\])\/\/[^\n]*/gu, "$1");

const files = [];
for (const path of walk(resolve(ROOT, "src"))) {
  const lines = stripComments(readFileSync(path, "utf8")).split("\n");
  const hits = [];
  lines.forEach((line, index) => {
    for (const { iso3, term, kind } of terms) {
      const pattern = kind === "iso3" ? new RegExp(`["'\`]${term}["'\`]|\\b${term}\\b(?=[:\\]])`, "u") : null;
      if (kind === "iso3" ? pattern.test(line) : line.includes(term)) hits.push({ line: index + 1, iso3, kind, text: line.trim().slice(0, 140) });
    }
  });
  if (hits.length) files.push({ file: relative(ROOT, path).split(sep).join("/"), count: hits.length, hits });
}
files.sort((left, right) => right.count - left.count);
const report = { schema: "country-literal-scan-v158", countries: registry.map((row) => row.iso3), fileCount: files.length, hitCount: files.reduce((sum, row) => sum + row.count, 0), files };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(`${OUT}.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", fileCount: report.fileCount, hitCount: report.hitCount, top: files.slice(0, 40).map((row) => `${row.file}:${row.count}`) })}\n`);
