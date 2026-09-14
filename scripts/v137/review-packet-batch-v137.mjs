#!/usr/bin/env node
/**
 * One readable page per screen, for the meaning review.
 *
 * Pairs what the screen renders with what the source states, so the two can be
 * read side by side. This prepares the reading; it does not perform it.
 */
import { resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ROOT = resolve(import.meta.dirname, "../..");
const DIR = resolve(ROOT, "reports/final-data-integration/screen-review");
const census = JSON.parse(readFileSync(resolve(DIR, "screen-census-v137-1440.json"), "utf8"));
const facts = JSON.parse(readFileSync(resolve(DIR, "element-source-facts-v137.json"), "utf8"));
const factsById = new Map(facts.elements.map((row) => [row.elementId, row]));
const argv = process.argv.slice(2);
const from = Number(argv[0] || 0);
const to = Number(argv[1] || census.rows.length);
const limit = Number(argv[2] || 1800);

const out = [];
for (const row of census.rows.slice(from, to)) {
  const fact = factsById.get(row.elementId) || {};
  out.push(`### ${row.elementId} · ${fact.label || ""}`);
  out.push(
    `renderer=${fact.detailTemplate || "-"} status=${fact.publicStatus || "-"} ` +
      `obs=${fact.observationRowCount ?? 0} ent=${fact.entityRowCount ?? 0} ` +
      `map=${fact.mapFeatureCount ?? 0} org=${(fact.sourceOrganizations || []).join("/")}`
  );
  const indicators = (fact.indicators || []).slice(0, 6).map(
    (item) =>
      `  - ${item.label} | ${item.unit || "단위없음"} | ${item.rowsWithValue}/${item.rows}행 | ${item.periodRange || "-"}`
  );
  if (indicators.length) out.push("지표(최대6):", ...indicators);
  if ((fact.indicators || []).length > 6) out.push(`  … 총 ${fact.indicators.length}개 지표`);
  out.push("--- 화면 ---");
  out.push(String(row.primaryText || "(없음)").slice(0, limit));
  if (row.sourcePanel) out.push(`--- 자료정보 --- ${String(row.sourcePanel).slice(0, 500)}`);
  out.push("");
}
mkdirSync(DIR, { recursive: true });
const path = resolve(DIR, `_packet-${from}-${to}.md`);
writeFileSync(path, `${out.join("\n")}\n`, "utf8");
console.log(path, out.length, "lines");
