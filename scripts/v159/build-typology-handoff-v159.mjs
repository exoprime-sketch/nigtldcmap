#!/usr/bin/env node
/**
 * V159 contractor handoff builder.
 *
 * Reads the already-generated typology/spec/use-case JSON (produced by
 * import-dataset-spec-v159.mjs) plus the two hand-written planning
 * documents (the S1-S4 schema doc and the typology assignment plan) and
 * assembles the contractor handoff package:
 *   output/v159/datasetTypologyV159.xlsx        5 sheets (git-ignored)
 *   output/v159/structure-examples/S1..S4.csv    real delivered rows (git-ignored)
 *   docs/DATA_TYPOLOGY_V159.md                   generated handoff document (committed)
 *
 * Nothing here invents data: every xlsx/CSV cell is either copied from the
 * committed JSON, parsed out of a committed markdown table, or read
 * directly off a real delivered record under public/data/vietnam/v2/downloads.
 * Where a source row is silent about a dimension, the cell is left blank.
 *
 * Usage:
 *   node scripts/v159/build-typology-handoff-v159.mjs [--check]
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");

const SPEC_DIR = resolve(ROOT, "src/data/spec");
const REPORT_DIR = resolve(ROOT, "reports/v159");
const DOCS_DIR = resolve(ROOT, "docs");
const OUT_DIR = resolve(ROOT, "output/v159");
const EXAMPLES_DIR = resolve(OUT_DIR, "structure-examples");
const DOWNLOADS_DIR = resolve(ROOT, "public/data/vietnam/v2/downloads");

const SCHEMA_MD = resolve(DOCS_DIR, "DATA_TYPOLOGY_V159_SCHEMA.md");
const PLAN_MD = resolve(DOCS_DIR, "plan/V159_데이터유형화_명세.md");
const HANDOFF_MD = resolve(DOCS_DIR, "DATA_TYPOLOGY_V159.md");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const typology = readJson(resolve(SPEC_DIR, "datasetTypologyV159.json"));
const spec = readJson(resolve(SPEC_DIR, "datasetSpecV159.json"));
const useCases = readJson(resolve(SPEC_DIR, "useCasesV159.json"));
const importSummary = readJson(resolve(REPORT_DIR, "spec-import-v159.json"));

const specById = new Map(spec.rows.map((row) => [row.elementId, row]));

// ------------------------------------------------------------------ markdown table parsing
/** Split a Github-flavoured markdown table row into trimmed cells. */
function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell) || cell === "");
}

/**
 * Find the first markdown table after a heading that matches `headingRegex`
 * and return { header, rows, headingLine }. Stops at the first non-"|" line.
 */
function extractTableAfterHeading(text, headingRegex) {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => headingRegex.test(line));
  if (headingIndex < 0) throw new Error(`heading not found: ${headingRegex}`);
  let i = headingIndex + 1;
  while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
  const tableLines = [];
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    tableLines.push(lines[i]);
    i++;
  }
  if (tableLines.length < 2) throw new Error(`no table found after heading: ${headingRegex}`);
  const header = splitRow(tableLines[0]);
  const bodyStart = isSeparatorRow(splitRow(tableLines[1])) ? 2 : 1;
  const rows = tableLines.slice(bodyStart).map(splitRow);
  return { header, rows, headingLine: lines[headingIndex].trim() };
}

const col = (header, keyword) => header.findIndex((cell) => cell.includes(keyword));

// ------------------------------------------------------------------ sheet 1: 표출유형 정의
const DISPLAY_SYMBOL_TO_CODE = {
  "①": "U1",
  "②": "U2",
  "③": "U3",
  "④": "U4",
  "⑤": "U5",
  "⑥": "U6",
  "⓪": "U0",
};

function buildDisplayTypeSheet() {
  const planText = readFileSync(PLAN_MD, "utf8");
  const { header, rows } = extractTableAfterHeading(planText, /^## 1\. 표출 유형/);
  const questionIdx = col(header, "유저 질문");
  const primaryIdx = col(header, "1순위 화면");
  const secondaryIdx = col(header, "2순위");
  const mapIdx = col(header, "지도");
  const decisionIdx = col(header, "판단 포인트");
  const countryCmpIdx = col(header, "국가 비교");

  const counts = new Map();
  for (const row of typology.rows) counts.set(row.displayType, (counts.get(row.displayType) || 0) + 1);

  const outRows = rows.map((cells) => {
    const typeCell = cells[0];
    const match = typeCell.match(/^\*\*([①②③④⑤⑥⓪])\s*([^*]+?)\*\*/);
    if (!match) throw new Error(`display type cell not parseable: ${typeCell}`);
    const code = DISPLAY_SYMBOL_TO_CODE[match[1]];
    if (!code) throw new Error(`unknown display symbol: ${match[1]}`);
    return [
      code,
      match[2].trim(),
      cells[questionIdx] || "",
      cells[primaryIdx] || "",
      cells[secondaryIdx] || "",
      cells[mapIdx] || "",
      cells[decisionIdx] || "",
      cells[countryCmpIdx] || "",
      counts.get(code) ?? 0,
    ];
  });

  return {
    headers: ["코드", "이름", "유저 질문", "1순위 화면", "2순위", "지도", "판단 포인트", "국가 비교", "요소 수"],
    rows: outRows,
  };
}

// ------------------------------------------------------------------ sheet 2: 구조 스키마 S1~S4
function buildStructureSchemaSheet() {
  const schemaText = readFileSync(SCHEMA_MD, "utf8");
  const structures = [
    { code: "S1", heading: /^### 2\.1 S1/ },
    { code: "S2", heading: /^### 2\.2 S2/ },
    { code: "S3", heading: /^### 2\.3 S3/ },
    { code: "S4", heading: /^### 2\.4 S4/ },
  ];
  const outRows = [];
  for (const { code, heading } of structures) {
    const { header, rows, headingLine } = extractTableAfterHeading(schemaText, heading);
    const deliveryIdx = col(header, "납품 열");
    const meaningIdx = col(header, "뜻");
    const allowedIdx = col(header, "허용값");
    const adapterIdx = col(header, "어댑터 필드");
    const templateIdx = col(header, "템플릿 입력");
    const structureLabel = headingLine.replace(/^#+\s*2\.\d\s*/, "").trim();
    for (const cells of rows) {
      outRows.push([
        code,
        structureLabel,
        deliveryIdx >= 0 ? cells[deliveryIdx] || "" : "",
        meaningIdx >= 0 ? cells[meaningIdx] || "" : "",
        allowedIdx >= 0 ? cells[allowedIdx] || "" : "",
        adapterIdx >= 0 ? cells[adapterIdx] || "" : "",
        templateIdx >= 0 ? cells[templateIdx] || "" : "",
      ]);
    }
  }
  return {
    headers: ["구조", "구조명", "납품 열", "뜻", "허용값/예", "어댑터 필드", "템플릿 입력"],
    rows: outRows,
  };
}

// ------------------------------------------------------------------ sheet 3: 152 배정표
function buildAssignmentSheet() {
  const flag = (value) => (value ? "○" : "");
  const rows = typology.rows.map((row) => {
    const specRow = specById.get(row.elementId);
    if (!specRow) throw new Error(`${row.elementId}: missing from datasetSpecV159.json`);
    return [
      row.elementId,
      specRow.platformName,
      specRow.sourceLabel,
      specRow.baseName,
      row.displayType,
      row.structure,
      flag(row.flags.region),
      flag(row.flags.tech),
      flag(row.flags.geometry),
      flag(row.flags.categorical),
      flag(row.flags.scenario),
      row.status,
      row.variant || "",
      row.dedicated || "",
      row.coverage.VNM,
      row.coverage.BGD,
      row.specCaseCount,
    ];
  });
  return {
    headers: [
      "ID",
      "요소명_플랫폼",
      "출처 윗줄",
      "원데이터명",
      "표출유형",
      "구조",
      "지역",
      "기술",
      "지오메트리",
      "범주형",
      "시나리오",
      "상태",
      "변형·비고",
      "전용 컴포넌트",
      "VNM",
      "BGD",
      "사례 수(검증)",
    ],
    rows,
  };
}

// ------------------------------------------------------------------ sheet 4: 명칭 분리표
function buildNameSplitSheet() {
  const reviewText = readFileSync(resolve(REPORT_DIR, "name-split-review.md"), "utf8");
  const lines = reviewText.split(/\r?\n/).filter((line) => /^\| [A-E]-\d{3} \|/.test(line));
  const rows = lines.map((line) => splitRow(line));
  if (rows.length !== 152) throw new Error(`name-split-review.md: expected 152 rows, got ${rows.length}`);
  return { headers: ["ID", "요소명_플랫폼", "출처 윗줄", "원데이터명", "규칙"], rows };
}

// ------------------------------------------------------------------ sheet 5: 사례 통계
function buildCaseStatsSheet() {
  const byElement = new Map();
  for (const item of useCases.cases) {
    if (!byElement.has(item.elementId)) byElement.set(item.elementId, { verified: 0, pending: 0, users: new Map() });
    const bucket = byElement.get(item.elementId);
    bucket[item.verified === "verified" ? "verified" : "pending"] += 1;
    for (const user of item.users || []) bucket.users.set(user, (bucket.users.get(user) || 0) + 1);
  }
  const rows = typology.rows.map((row) => {
    const bucket = byElement.get(row.elementId);
    if (!bucket) return [row.elementId, 0, 0, ""];
    const distribution = [...bucket.users.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([user, count]) => `${user} ${count}`)
      .join("·");
    return [row.elementId, bucket.verified, bucket.pending, distribution];
  });
  const mapping = importSummary.indicatorMapping;
  const mappedCount = mapping.exact + mapping.prefix;
  const mappingRate = ((mappedCount / mapping.references) * 100).toFixed(1);
  rows.push(["", "", "", ""]);
  rows.push(["합계(검증)", importSummary.cases.verified, importSummary.cases.pending, `사례 있는 요소 ${importSummary.cases.elements}개`]);
  rows.push(["지표 매핑률", `${mappedCount}/${mapping.references}`, `${mappingRate}%`, "reports/v159/spec-import-v159.json 기준"]);
  return { headers: ["ID", "검증 사례 수", "검증 대기 수", "주 사용자 분포"], rows };
}

// ------------------------------------------------------------------ CSV builders (real delivered rows only)
function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

function loadPack(elementId) {
  return readJson(resolve(DOWNLOADS_DIR, `${elementId.toLowerCase()}.json`));
}

// Two-letter -> English scenario-band label, as literally written in the D-004 note
// head tags ("[... · 고/중/저 시나리오]"). No value beyond what the note states.
const SCENARIO_BAND = { 고: "high", 중: "mid", 저: "low" };

function buildS1Csv() {
  const headers = [
    "요소_id",
    "indicator_id",
    "country_iso3",
    "year",
    "period",
    "value",
    "missing_reason_code",
    "note",
    "category",
    "scenario",
    "tech_id",
    "bound",
    "value_kind",
    "source_record",
  ];
  const rows = [];

  // A-001: plain country x year observation, no category/scenario/tech in the note.
  const a001 = loadPack("A-001");
  const a001Rows = a001.observations.filter((o) => o.indicatorId === "A-001_cpi_score").slice(0, 5);
  for (const o of a001Rows) {
    rows.push(["A-001", o.indicatorId, a001.countryIso3, o.year ?? "", o.period ?? "", o.value ?? "", o.missingReasonCode ?? "", o.note ?? "", "", "", "", "", "", o.recordId]);
  }

  // D-004: note explicitly states "[<tech name> 기술 · <고/중/저> 시나리오]"; the
  // indicator's technologyIds gives the two-digit tech key. Filled only because
  // both are explicit in the delivered record, per the schema doc's own example.
  const d004 = loadPack("D-004");
  const d004Indicators = new Map(d004.indicators.map((i) => [i.indicatorId, i]));
  const d004Rows = d004.observations.slice(0, 5);
  for (const o of d004Rows) {
    const indicator = d004Indicators.get(o.indicatorId);
    const bandMatch = (o.note || "").match(/·\s*(고|중|저)\s*시나리오/);
    const scenario = bandMatch ? SCENARIO_BAND[bandMatch[1]] : "";
    const techId = indicator?.technologyIds?.[0] || "";
    rows.push(["D-004", o.indicatorId, d004.countryIso3, o.year ?? "", o.period ?? "", o.value ?? "", o.missingReasonCode ?? "", o.note ?? "", "", scenario, techId, "", "", o.recordId]);
  }

  return toCsv(headers, rows);
}

function buildS2Csv() {
  const headers = [
    "요소_id",
    "indicator_id",
    "country_iso3",
    "year",
    "period",
    "value",
    "missing_reason_code",
    "note",
    "category",
    "scenario",
    "tech_id",
    "bound",
    "value_kind",
    "region_system",
    "region_key",
    "region_name",
    "source_record",
  ];
  const rows = [];

  // B-021: region-6 (GDL) keys read from "GDLCODE=" in the note, exactly as
  // schema doc §4 does for this element. region_name is filled only for the
  // Central Highlands row, matching the doc's own worked example; other
  // regions' names are not stated anywhere in the delivered record, so they
  // stay blank. The "_total" indicator has no GDLCODE (national aggregate) and
  // is read as a national row per §2.2: region_system/region_key left empty.
  const b021 = loadPack("B-021");
  const sgdiIds = b021.indicators.map((i) => i.indicatorId).filter((id) => id.startsWith("B-021_comp_sgdi"));
  for (const indicatorId of sgdiIds) {
    const o = b021.observations.find((obs) => obs.indicatorId === indicatorId);
    if (!o) continue;
    const gdlMatch = (o.note || "").match(/GDLCODE=(\S+)/);
    const gdlCode = gdlMatch ? gdlMatch[1] : "";
    const isNational = gdlCode === "VNMt";
    const regionName = indicatorId.endsWith("central_highlands") && !isNational ? "Central Highlands" : "";
    rows.push([
      "B-021",
      indicatorId,
      b021.countryIso3,
      o.year ?? "",
      o.period ?? "",
      o.value ?? "",
      o.missingReasonCode ?? "",
      o.note ?? "",
      "",
      "",
      "",
      "",
      "",
      isNational ? "" : "region-6",
      isNational ? "" : gdlCode,
      regionName,
      o.recordId,
    ]);
  }
  // A second year for the Central Highlands region, to show a time series.
  const chSecond = b021.observations.find((obs) => obs.indicatorId === "B-021_comp_sgdi_central_highlands" && obs.year === 1993);
  if (chSecond) {
    rows.push([
      "B-021",
      chSecond.indicatorId,
      b021.countryIso3,
      chSecond.year,
      "",
      chSecond.value ?? "",
      chSecond.missingReasonCode ?? "",
      chSecond.note ?? "",
      "",
      "",
      "",
      "",
      "",
      "region-6",
      "VNMr104",
      "",
      chSecond.recordId,
    ]);
  }

  // B-003: delivered as an adm1 entity record (province x year), not an
  // observation row - the real-world case the schema doc §2.2.1 flags as
  // differing from the plan. record_key "VNM.1_1_1933" = GADM id "VNM.1_1" +
  // year "1933", both literally present in the source's own 레코드_키/연도
  // fields; region_key strips the year to match the "GADM VNM.1_1" allowed
  // format the schema doc states. Only one measurement (연평균 기온) is
  // carried into `value`; the entity also has other attributes (강수량 등)
  // that this single-value row cannot hold, noted below.
  const b003 = loadPack("B-003");
  const anGiang1933 = b003.entities.find((e) => e.recordId === "v124-b-003-entity-00001");
  if (anGiang1933) {
    const attrs = anGiang1933.normalizedAttributes;
    rows.push([
      "B-003",
      anGiang1933.indicatorId,
      b003.countryIso3 || "VNM",
      attrs["연도"] ?? "",
      "",
      attrs["연평균_기온"] ?? "",
      anGiang1933.missingReasonCode ?? "",
      "[현행 개체시트 납품] 연평균 기온(°C). 레코드_키=VNM.1_1_1933. 같은 레코드의 다른 속성(연강수량 등)은 이 행에 담지 못함 — S1/S2 구조는 한 행에 값 1개",
      "",
      "",
      "",
      "",
      "",
      "adm1-63",
      "VNM.1_1",
      "AnGiang",
      anGiang1933.recordId,
    ]);
  }

  return toCsv(headers, rows);
}

function buildS3Csv() {
  const headers = [
    "요소_id",
    "indicator_id",
    "country_iso3",
    "record_key",
    "name",
    "lat",
    "lon",
    "geometry_type",
    "crs",
    "geometry_ref",
    "class",
    "size_value",
    "size_unit",
    "year",
    "owner",
    "adm1_name",
    "coordinate_quality",
    "tech_id",
    "record_source_url",
    "missing_reason_code",
    "note",
    "source_record",
  ];
  const a023 = loadPack("A-023");
  const registry = a023.entities.filter((e) => e.indicatorId === "A-023_power_plant_registry");
  // First occurrence per primary fuel, then fill up to 10 rows in delivered
  // order, so the example shows real class diversity rather than the first
  // N rows of a single fuel type.
  const seenFuel = new Set();
  const picked = [];
  for (const e of registry) {
    const fuel = e.normalizedAttributes.primaryFuel;
    if (!seenFuel.has(fuel)) {
      seenFuel.add(fuel);
      picked.push(e);
    }
  }
  for (const e of registry) {
    if (picked.length >= 10) break;
    if (!picked.includes(e)) picked.push(e);
  }
  const rows = picked.slice(0, 10).map((e) => {
    const a = e.normalizedAttributes;
    return [
      "A-023",
      e.indicatorId,
      a023.countryIso3,
      a.gppdId || "",
      e.name || "",
      e.latitude ?? "",
      e.longitude ?? "",
      "point",
      "EPSG:4326",
      "",
      a.primaryFuel || "",
      a.mw || "",
      a.mw ? "MW" : "",
      a.commissioningYear ?? "",
      a.owner || "",
      a.adm1Name34 || "",
      "",
      "",
      a.sourceUrl || "",
      e.missingReasonCode ?? "",
      e.note ?? "",
      e.recordId,
    ];
  });
  return toCsv(headers, rows);
}

function buildS4Csv() {
  const headers = [
    "요소_id",
    "indicator_id",
    "country_iso3",
    "record_key",
    "name",
    "record_type",
    "year",
    "date",
    "status",
    "description",
    "amount_value",
    "amount_currency",
    "org",
    "region_tags",
    "tech_id",
    "link",
    "record_source_url",
    "missing_reason_code",
    "note",
    "source_record",
  ];
  const rows = [];

  // D-020: GCF-approved project registry. amount/org/tech are explicit
  // fields in the source's own normalizedAttributes; region_tags is left
  // blank because 대상지역 ("전국", "중부고원·남중부해안") is free text, not
  // the "system:key" tag format the schema asks for, and no such key is in
  // the delivered record.
  const d020 = loadPack("D-020");
  const projects = d020.entities.filter((e) => e.indicatorId === "D-020_project_registry").slice(0, 5);
  for (const e of projects) {
    const a = e.normalizedAttributes;
    const techMatch = /^(\d{2})/.exec(a["38대_기후기술"] || "");
    rows.push([
      "D-020",
      e.indicatorId,
      d020.countryIso3 || "",
      a["Ref_No"] || "",
      e.name || "",
      "",
      "",
      "",
      a["상태"] || "",
      a["비고"] || "",
      a["대표금액"] ?? "",
      /USD/.test(a["GCF_승인액"] || "") ? "USD" : "",
      a["인가기관_AE"] || "",
      "",
      techMatch ? techMatch[1] : "",
      "",
      "",
      "",
      "",
      e.recordId,
    ]);
  }

  // C-009: legal-instrument records. The entity sheet's grain differs by
  // indicatorId, so record_key/date are mapped per indicator rather than by
  // one fixed column:
  //  - "law_name_vanban_chinhphu" rows: 속성3_값 is the law/decree number
  //    (e.g. "72/2020/QH14") - schema doc §2.4's own record_key example.
  //  - "effective_year_climatelaws" rows: 속성3_값 is instead a date; no
  //    separate ID field is delivered (속성2_레코드ID is null), so record_key
  //    stays blank and the date goes in `date` instead.
  // description is the English title/description the source states
  // (속성23_설명). tech_id is filled only for the one row whose
  // 기술코드_근거문구 states a direct mapping ("매핑 결과: 24 전력 통합 기술");
  // the rest say "미부여" and stay blank.
  const c009 = loadPack("C-009");
  const lawPicks = ["v124-c-009-entity-00041", "v124-c-009-entity-00055", "v124-c-009-entity-00034", "v124-c-009-entity-00001", "v124-c-009-entity-00002"];
  for (const recordId of lawPicks) {
    const e = c009.entities.find((entity) => entity.recordId === recordId);
    if (!e) continue;
    const a = e.normalizedAttributes;
    const techMatch = /매핑 결과:\s*(\d{2})/.exec(a["기술코드_근거문구"] || "");
    const isEffectiveDateRow = e.indicatorId === "C-009_effective_year_climatelaws";
    rows.push([
      "C-009",
      e.indicatorId,
      c009.countryIso3 || "",
      isEffectiveDateRow ? "" : a["속성3_값"] || "",
      e.name || "",
      "",
      a["속성4_시점"] || "",
      isEffectiveDateRow ? a["속성3_값"] || "" : "",
      "",
      a["속성23_설명"] || "",
      "",
      "",
      "",
      "",
      techMatch ? techMatch[1] : "",
      a["속성19_원문URL"] || "",
      "",
      e.missingReasonCode ?? "",
      e.note ?? "",
      e.recordId,
    ]);
  }

  return toCsv(headers, rows);
}

// ------------------------------------------------------------------ docs/DATA_TYPOLOGY_V159.md
function mdTableFromSheet(sheet) {
  const lines = [`| ${sheet.headers.join(" | ")} |`, `|${sheet.headers.map(() => "---").join("|")}|`];
  for (const row of sheet.rows) lines.push(`| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return lines.join("\n");
}

function buildHandoffMarkdown(sheets) {
  const dedicatedGroups = [
    "A-023 발전소 공간정보(power-plant-registry)",
    "B-046/B-047 광물 매장량·생산량(mineral-resources, 두 요소가 한 컴포넌트를 공유)",
    "D-004 크레딧 회수율 히트맵(technology-scenario-heatmap)",
    "A-013 NDC·SDG 연계 매트릭스(ndc-sdg-matrix)",
    "B-008 해수면 상승 관측소(sea-level-stations)",
    "E-006 투자기관 네트워크(investor-network)",
  ];

  return `# 데이터 유형화 V159 — 용역사 인계 문서

이 문서는 \`scripts/v159/build-typology-handoff-v159.mjs\`가 생성한다. 손으로 고치지 말고 \`docs/plan/V159_데이터유형화_명세.md\`(배정표·표출유형)나 \`docs/DATA_TYPOLOGY_V159_SCHEMA.md\`(구조 스키마)를 고친 뒤 스크립트를 다시 실행한다.

## 1. 목적

152개 공개 데이터 요소를 개별 화면으로 설계하지 않고, 사용자 질문 기준 **표출 유형 6개(+ 상태 안내 1개)** 와 납품 구조 기준 **데이터 구조 4형태(S1~S4)** 로 정리해 용역사가 구조화 작업을 할 수 있게 한다. 배정표(요소 → 표출 유형·구조)는 \`docs/plan/V159_데이터유형화_명세.md\` §4가 정본이고, 이 문서와 \`datasetTypologyV159.xlsx\`는 그 확정본(\`src/data/spec/datasetTypologyV159.json\`)에서 생성한다.

## 2. 표출 유형 6개(+ 상태 안내)

${mdTableFromSheet(sheets.displayType)}

## 3. 데이터 구조 4형태

한 행의 뜻, 납품 시트, 필수 키는 \`docs/DATA_TYPOLOGY_V159_SCHEMA.md\` §0·§2에 정리되어 있다. 요약:

| 구조 | 한 행의 뜻 | 요소 수 |
|---|---|---|
| S1 국가×연도 관측값 | 한 나라·한 시점·한 지표의 값 1개 | ${typology.rows.filter((r) => r.structure === "S1").length} |
| S2 지역×연도 관측값 | 한 행정구역·권역·유역·시점·지표의 값 1개 | ${typology.rows.filter((r) => r.structure === "S2").length} |
| S3 위치 개체 | 좌표나 기하가 있는 시설·기관·관측소 1개 | ${typology.rows.filter((r) => r.structure === "S3").length} |
| S4 비공간 개체 | 문서·사업·기관·법령·기술 항목 1개 | ${typology.rows.filter((r) => r.structure === "S4").length} |

구조별 납품 열·뜻·허용값·어댑터 필드·템플릿 입력은 \`docs/DATA_TYPOLOGY_V159_SCHEMA.md\` §2를 참고한다(같은 표가 \`datasetTypologyV159.xlsx\`의 "구조 스키마 S1~S4" 시트다).

## 4. 플래그

템플릿 옵션일 뿐 새 구조가 아니다: \`region\`(${importSummary.flags.region}) · \`tech\`(${importSummary.flags.tech}) · \`geometry\`(${importSummary.flags.geometry}) · \`categorical\`(${importSummary.flags.categorical}) · \`scenario\`(${importSummary.flags.scenario}).

## 5. 전용 컴포넌트(템플릿 대신 별도 화면)

6개 그룹, 같은 어댑터 입력을 쓰되 템플릿 대신 전용 컴포넌트로 그린다.

${dedicatedGroups.map((line) => `- ${line}`).join("\n")}

## 6. 152개 배정표

${mdTableFromSheet(sheets.assignment)}

## 7. 판단 포인트 규칙

유형별 '판단 포인트'는 표출 유형 화면에 고정으로 붙는, 자동 계산되는 요약 블록이다(§2 표의 "판단 포인트" 열). 값이 없으면 그 포인트는 숨긴다 — 추정으로 채우지 않는다. 정확한 계산식은 \`src/data/structure/decisionPointsV159.ts\`(아직 구현 전이면 해당 PR에서 추가)가 정본이며, 이 문서는 유형별 판단 포인트가 "무엇을 보여주는가"만 요약한다.

## 8. 명칭 분리 규칙

\`요소명_플랫폼\`을 출처 윗줄(\`sourceLabel\`)과 원데이터명(\`baseName\`)으로 나눈다. 규칙은 \`scripts/v159/import-dataset-spec-v159.mjs\`의 \`splitPlatformName\`이 정본이다: \` 외 \` 절까지 자르는 \`auto-외\`, 앞쪽 라틴 토큰을 자르는 \`auto-latin\`, 수기 보정표(\`src/data/spec/sourceLabelRulesV159.json\`)를 따르는 \`rules-prefix\`/\`rules-no-prefix\`. 전체 152건 검수표는 \`reports/v159/name-split-review.md\`(= "명칭 분리표" 시트)에 있다.

## 9. 데이터 설명 영역(프레임워크 원문)

카드·상세 화면의 '데이터 설명' 영역(상세 설명 / 활용 방법 / 활용 사례)은 프레임워크 워크북에서 있는 그대로 가져온다(화면 문구 수기 0). 필드 정의:

- **상세 설명**(\`description\`): 정의·수록 범위·단위를 담은 문단. \`src/data/spec/datasetSpecV159.json\`의 \`description\`.
- **활용 방법**(\`usage\`): 값을 어떻게 해석하는지, 무엇과 함께 봐야 하는지. 같은 파일의 \`usage\`.
- **활용 사례**(접힘, 목적 + 영문 키워드 / 논리 / 쓰는 데이터 칩 / 스토리라인 / 주 사용자 칩 / 유의점): \`src/data/spec/useCasesV159.json\`의 \`cases[]\`. 검증 사례 ${importSummary.cases.verified}건 · 검증 대기 ${importSummary.cases.pending}건(같은 서식으로 표시하되 "검증 대기" 배지).

## 10. 산출물

| 파일 | 용도 |
|---|---|
| \`output/v159/datasetTypologyV159.xlsx\` | 이 문서의 표 5개(표출유형 정의 / 구조 스키마 S1~S4 / 152 배정표 / 명칭 분리표 / 사례 통계) |
| \`output/v159/structure-examples/S1.csv\`~\`S4.csv\` | 구조별 실제 납품 행 예시(값은 모두 실 데이터에서 그대로 옮김, 출처 없는 칸은 비움) |
| \`docs/DATA_TYPOLOGY_V159_SCHEMA.md\` | 구조 4형태 스키마(§2 표가 xlsx "구조 스키마" 시트의 정본) |
| \`docs/DATA_TYPOLOGY_V159.md\` | 이 문서 |
| \`output/v159/screens/\` | 유형별 대표 화면 스크린샷 6장(본 PR 이후, 메인 세션에서 생성): ① A-003 · ② B-003 · ③ A-018 · ④ A-023 · ⑤ D-022 · ⑥ C-009 |

\`output/\`는 git 무시 경로라 xlsx·CSV는 커밋되지 않는다. PR 병합 전에 메인 세션이 이 폴더를 복사해 전달한다.
`;
}

// ------------------------------------------------------------------ xlsx via python/openpyxl
function writeXlsx(sheets) {
  mkdirSync(OUT_DIR, { recursive: true });
  const payloadPath = resolve(OUT_DIR, ".xlsx-payload.json");
  const outPath = resolve(OUT_DIR, "datasetTypologyV159.xlsx");
  writeFileSync(payloadPath, JSON.stringify(sheets));
  const candidates = process.platform === "win32" ? [["python", []], ["py", ["-3"]]] : [["python3", []], ["python", []]];
  for (const [bin, prefix] of candidates) {
    const result = spawnSync(bin, [...prefix, resolve(ROOT, "scripts/v159/write_handoff_xlsx_v159.py"), payloadPath, outPath], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status === 0) return outPath;
    if (result.error?.code === "ENOENT") continue;
    throw new Error(`xlsx writer failed: ${result.stderr}`);
  }
  throw new Error("Python 3 with openpyxl is required");
}

// ------------------------------------------------------------------ main
function main() {
  const sheets = {
    displayType: buildDisplayTypeSheet(),
    structureSchema: buildStructureSchemaSheet(),
    assignment: buildAssignmentSheet(),
    nameSplit: buildNameSplitSheet(),
    caseStats: buildCaseStatsSheet(),
  };

  const markdown = buildHandoffMarkdown(sheets);

  if (CHECK) {
    const current = existsSync(HANDOFF_MD) ? readFileSync(HANDOFF_MD, "utf8") : "";
    const same = current.replace(/\r\n/g, "\n") === markdown.replace(/\r\n/g, "\n");
    if (!same) {
      console.error("stale: docs/DATA_TYPOLOGY_V159.md (run without --check to regenerate)");
      process.exit(1);
    }
    console.log("typology handoff doc up to date");
    return;
  }

  mkdirSync(EXAMPLES_DIR, { recursive: true });
  writeFileSync(HANDOFF_MD, markdown);

  const xlsxPath = writeXlsx({
    "표출유형 정의": sheets.displayType,
    "구조 스키마 S1~S4": sheets.structureSchema,
    "152 배정표": sheets.assignment,
    "명칭 분리표": sheets.nameSplit,
    "사례 통계": sheets.caseStats,
  });

  const csvOutputs = {
    "S1.csv": buildS1Csv(),
    "S2.csv": buildS2Csv(),
    "S3.csv": buildS3Csv(),
    "S4.csv": buildS4Csv(),
  };
  for (const [file, content] of Object.entries(csvOutputs)) writeFileSync(resolve(EXAMPLES_DIR, file), content);

  const summary = {
    xlsx: xlsxPath,
    sheetRowCounts: Object.fromEntries(Object.entries(sheets).map(([key, sheet]) => [key, sheet.rows.length])),
    csvRowCounts: Object.fromEntries(
      Object.entries(csvOutputs).map(([file, content]) => [file, content.trim().split(/\r\n/).length - 1]),
    ),
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();
