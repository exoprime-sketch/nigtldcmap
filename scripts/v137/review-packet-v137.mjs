#!/usr/bin/env node
/**
 * One reviewable page per element: what the source holds beside what the screen
 * shows.
 *
 * Prints, for each requested element, the source's indicators and entity columns
 * next to the screen's headings, KPIs, chart text, selectors and notices. That
 * is the material a person needs to answer the review questions - is the core
 * information there, does the chart suit the data, do the controls change the
 * result - and it deliberately reaches no verdict of its own.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const FACTS = resolve(
  ROOT,
  opt("--facts", "reports/final-data-integration/screen-review/element-source-facts-v137.json")
);
const RUN_ARG = opt("--run", "");
const IDS = (opt("--ids", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const BODY_CHARS = Number(opt("--body", "900"));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function latestRun() {
  if (RUN_ARG) return resolve(ROOT, RUN_ARG);
  const base = resolve(ROOT, "reports/final-data-integration/qa-verified");
  const runs = readdirSync(base).filter((name) => /^\d{4}-/.test(name)).sort();
  return resolve(base, runs[runs.length - 1]);
}

function snapshotFor(run, elementId, variant) {
  const path = resolve(run, "snapshots", `${elementId}-${variant}.json`);
  return existsSync(path) ? readJson(path) : null;
}

const list = (values, limit) =>
  (values || []).slice(0, limit).map((value) => `      - ${String(value).slice(0, 160)}`).join("\n");

function main() {
  const facts = readJson(FACTS);
  const byId = new Map(facts.elements.map((row) => [row.elementId, row]));
  const run = latestRun();
  const ids = IDS.length ? IDS : facts.elements.map((row) => row.elementId);

  for (const elementId of ids) {
    const fact = byId.get(elementId);
    if (!fact) {
      console.log(`\n===== ${elementId}  (not in catalog)`);
      continue;
    }
    const before = snapshotFor(run, elementId, "default");
    const after = snapshotFor(run, elementId, "selected-0");

    console.log(`\n===== ${elementId} · ${fact.label}`);
    console.log(`  분류: ${fact.category} | 템플릿: ${fact.detailTemplate} | 상태: ${fact.publicStatus}/${fact.dataPresenceStatus}${fact.emptyReason ? ` (${fact.emptyReason})` : ""}`);
    console.log(`  원천: obs ${fact.observationRowCount} · entity ${fact.entityRowCount} · 지도 ${fact.mapFeatureCount} · 다운로드 ${fact.downloadableRecordCount}`);

    if (fact.indicators.length) {
      console.log(`  지표 (${fact.indicators.length}):`);
      for (const indicator of fact.indicators.slice(0, 8)) {
        console.log(
          `      · ${indicator.label || indicator.indicatorId} | ${indicator.unit || "단위없음"}` +
            ` | ${indicator.rowsWithValue}/${indicator.rows}행 | 기간 ${indicator.periodCount}개 ${indicator.periodRange || ""}`
        );
      }
      if (fact.indicators.length > 8) console.log(`      … ${fact.indicators.length - 8} more`);
    }
    if (fact.entities) {
      console.log(`  개체 ${fact.entities.recordCount}행 (좌표 ${fact.entities.withCoordinates}):`);
      for (const column of fact.entities.columns.slice(0, 10)) {
        console.log(`      · ${column.name} [${column.filled}/${column.of}] ${column.distinctSample.join(" | ").slice(0, 130)}`);
      }
      if (fact.entities.columns.length > 10) console.log(`      … ${fact.entities.columns.length - 10} more columns`);
    }

    if (!before) {
      console.log("  화면: NOT_COLLECTED");
      continue;
    }
    console.log(`  화면 title: ${before.title}`);
    console.log(`  analysisState: ${before.analysisState} | canvas ${before.canvasCount} | overflow ${before.horizontalOverflow} | body ${before.bodyLength}자`);
    if (before.headings?.length) console.log(`  headings:\n${list(before.headings, 14)}`);
    if (before.kpis?.length) console.log(`  KPI:\n${list(before.kpis, 10)}`);
    if (before.chartTexts?.length) console.log(`  chart text (${before.chartTexts.length}):\n${list(before.chartTexts, 12)}`);
    if (before.tableRows?.length) console.log(`  table rows (${before.tableRows.length}):\n${list(before.tableRows, 5)}`);
    if (before.emptyNotices?.length) console.log(`  notices:\n${list(before.emptyNotices, 6)}`);
    if (before.selects?.length) {
      console.log(`  selects (${before.selects.length}):`);
      for (const select of before.selects.slice(0, 6)) {
        console.log(
          `      · ${select.label || select.testId || select.id || "(라벨없음)"} = ${select.shown}` +
            ` [${select.options.length}개: ${select.options.slice(0, 4).map((o) => o.label).join(" / ")}]`
        );
      }
    }
    if (after) {
      const changed = after.body !== before.body;
      console.log(`  선택조건 변경 후 본문 변화: ${changed ? "YES" : "NO"}${changed ? "" : "  <-- 결과가 바뀌지 않음"}`);
      if (changed) {
        const beforeKpi = (before.kpis || []).join(" | ");
        const afterKpi = (after.kpis || []).join(" | ");
        if (beforeKpi !== afterKpi) console.log(`      KPI 변화: ${afterKpi.slice(0, 200)}`);
      }
    }
    console.log(`  본문 발췌: ${String(before.body || "").slice(0, BODY_CHARS)}`);
  }
}

main();
