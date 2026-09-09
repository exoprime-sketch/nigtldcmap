#!/usr/bin/env node
/**
 * Order 152 screens for review, so the reading starts where the trouble is.
 *
 * This assigns no verdict. It reports, per element, a few facts that decide how
 * much attention a screen needs - how much the source holds, how much the screen
 * says, whether an empty notice is showing, whether a control changed anything -
 * and sorts by the gap between the first two. A screen carrying 31,688 source
 * rows and 291 characters of page text is where a reviewer should start; a
 * screen the source genuinely left empty is not a defect at all.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/screen-review"));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function latestRun() {
  if (RUN_ARG) return resolve(ROOT, RUN_ARG);
  const base = resolve(ROOT, "reports/final-data-integration/qa-verified");
  const runs = readdirSync(base).filter((name) => /^\d{4}-/.test(name)).sort();
  return resolve(base, runs[runs.length - 1]);
}

const snapshot = (run, id, variant) => {
  const path = resolve(run, "snapshots", `${id}-${variant}.json`);
  return existsSync(path) ? readJson(path) : null;
};

function main() {
  const facts = readJson(FACTS);
  const run = latestRun();
  const rows = [];

  for (const fact of facts.elements) {
    const before = snapshot(run, fact.elementId, "default");
    const after = snapshot(run, fact.elementId, "selected-0");
    const sourceRows = fact.observationRowCount + fact.entityRowCount;
    const analysisSections = (before?.headings || []).filter(
      (heading) => heading !== "데이터 분석" && heading !== "다운로드"
    ).length;
    rows.push({
      elementId: fact.elementId,
      label: fact.label,
      template: fact.detailTemplate,
      publicStatus: fact.publicStatus,
      sourceRows,
      observationRows: fact.observationRowCount,
      entityRows: fact.entityRowCount,
      indicatorCount: fact.indicators.length,
      collected: Boolean(before),
      bodyLength: before?.bodyLength ?? 0,
      analysisSections,
      chartTextCount: before?.chartTexts?.length ?? 0,
      kpiCount: before?.kpis?.length ?? 0,
      tableRowCount: before?.tableRows?.length ?? 0,
      selectCount: before?.selects?.length ?? 0,
      emptyNotice: (before?.emptyNotices || [])[0] || "",
      selectorChangedBody: after ? after.body !== before.body : null,
      horizontalOverflow: before?.horizontalOverflow ?? null,
      analysisState: before?.analysisState ?? null,
    });
  }

  // Screens the source fills but the page does not are read first.
  const priority = (row) => {
    if (!row.collected) return 0;
    if (row.sourceRows > 0 && row.analysisSections <= 1) return 1;
    if (row.sourceRows > 0 && row.emptyNotice) return 2;
    if (row.selectCount > 0 && row.selectorChangedBody === false) return 3;
    if (row.sourceRows > 0 && row.chartTextCount === 0 && row.tableRowCount === 0) return 4;
    return 9;
  };
  rows.sort(
    (a, b) => priority(a) - priority(b) || b.sourceRows - a.sourceRows || a.elementId.localeCompare(b.elementId)
  );
  rows.forEach((row) => {
    row.reviewBand = priority(row);
  });

  const bands = {};
  for (const row of rows) bands[row.reviewBand] = (bands[row.reviewBand] || 0) + 1;

  writeFileSync(
    resolve(OUT, "screen-review-triage-v137.json"),
    `${JSON.stringify({ schema: "nigt-screen-review-triage-1", run: run.split(/[\\/]/).pop(), bandMeaning: {
      0: "not collected",
      1: "source has rows, page has at most one analysis section",
      2: "source has rows, page shows an empty notice",
      3: "a control is present and changed nothing",
      4: "source has rows, page shows neither chart nor table",
      9: "nothing obviously missing - still needs reading",
    }, bands, elements: rows }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ bands, total: rows.length }, null, 2));
  for (const row of rows.filter((item) => item.reviewBand <= 4)) {
    console.log(
      `  band${row.reviewBand} ${row.elementId} ${String(row.label).slice(0, 34).padEnd(34)}` +
        ` src=${String(row.sourceRows).padStart(6)} body=${String(row.bodyLength).padStart(5)}` +
        ` sec=${row.analysisSections} chart=${row.chartTextCount} tbl=${row.tableRowCount}` +
        ` sel=${row.selectCount}/${row.selectorChangedBody === null ? "-" : row.selectorChangedBody ? "Y" : "N"}` +
        ` ${row.emptyNotice.slice(0, 40)}`
    );
  }
}

main();
