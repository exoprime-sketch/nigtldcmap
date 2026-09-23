#!/usr/bin/env node
/**
 * V159: align the V153 visualization contract with the dataset typology.
 *
 * - Writes `displayType` and `structure` into every contract row from
 *   src/data/spec/datasetTypologyV159.json (the typology is the source; the
 *   contract carries a copy so the QA and the router read one row).
 * - Judges each row's V153 archetype against the display type with the
 *   compatibility table below and writes reports/v159/contract-typology-alignment.md.
 * - Applies only the contract changes the spec states outright: a ⓪ (U0)
 *   element opens on the status statement and draws no chart. Everything
 *   else that does not fit is listed for a decision, never rewritten to
 *   match a screen.
 *
 * Usage: node scripts/v159/align-contract-typology-v159.mjs [--check]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json");
const TYPOLOGY_PATH = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const REPORT_PATH = resolve(ROOT, "reports/v159/contract-typology-alignment.md");

// Archetypes each display type can open on. Anything else is a mismatch.
const COMPATIBLE = {
  U0: ["status-note"],
  U1: ["national-series", "composition", "matrix"],
  U2: ["province-distribution", "station", "registry"],
  U3: ["national-series", "composition", "matrix"],
  U4: ["registry", "station"],
  U5: ["registry", "policy-document", "province-distribution", "national-series"],
  U6: ["policy-document", "matrix"],
};
// Numeric first blocks a ⑥ screen may open on: index-type S1 rows and the
// C-022 checklist score (spec v2 §1, ⑥ 2순위).
const U6_NUMERIC_ALLOWED = new Set(["B-013", "B-014", "B-015", "C-022"]);
const NUMERIC = new Set(["line", "stacked-area", "region-bar", "category-bar", "dumbbell", "heatmap"]);

const contractRaw = readFileSync(CONTRACT_PATH, "utf8");
const contract = JSON.parse(contractRaw);
const typology = new Map(JSON.parse(readFileSync(TYPOLOGY_PATH, "utf8")).rows.map((row) => [row.elementId, row]));

const findings = [];
const applied = [];
const rows = contract.rows.map((row) => {
  const type = typology.get(row.elementId);
  if (!type) throw new Error(`${row.elementId}: not in typology`);
  let next = { ...row };
  // Keep the key order stable: elementId, displayType, structure, archetype, ...
  const { elementId, displayType: _d, structure: _s, ...rest } = next;
  next = { elementId, displayType: type.displayType, structure: type.structure, ...rest };

  if (type.displayType === "U0" && next.archetype !== "status-note") {
    applied.push({ elementId, from: `${next.archetype} / ${next.primary.type}`, to: "status-note / status-note", reason: `명세 v2 ⓪ 상태 안내(${type.status})` });
    next = {
      ...next,
      archetype: "status-note",
      primary: { type: "status-note", title: "공개 상태 안내", xAxis: null, yAxis: null, unit: null },
      secondary: [],
      mapRole: "none",
      status: "standard",
      note: `V159: ${type.status} — 결정·사유·결정일 안내만 표시`,
    };
  }

  const compatible = COMPATIBLE[type.displayType].includes(next.archetype);
  let verdict = compatible ? "consistent" : "mismatch";
  let comment = "";
  if (!compatible && type.displayType === "U2" && ["national-series", "composition"].includes(next.archetype)) {
    verdict = "data-limited";
    comment = type.structure === "S3"
      ? "관측소 지점 계열이 1순위(전용 컴포넌트) — 지역 면 값 없음"
      : "지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시";
  } else if (!compatible && type.displayType === "U1" && next.archetype === "registry") {
    verdict = "review";
    comment = "국가 수준 유형인데 계약은 레코드 목록 — 요소 상태(" + type.status + ") 확인";
  } else if (!compatible && type.displayType === "U6" && next.archetype === "national-series") {
    verdict = U6_NUMERIC_ALLOWED.has(elementId) ? "consistent" : "review";
    comment = U6_NUMERIC_ALLOWED.has(elementId) ? "⑥ 지수형(S1) — 숫자 1순위 허용" : "⑥은 숫자 차트 금지 — 1순위 교체 여부 결정 필요";
  } else if (!compatible && type.displayType === "U6" && next.archetype === "province-distribution") {
    verdict = U6_NUMERIC_ALLOWED.has(elementId) ? "consistent" : "review";
    comment = U6_NUMERIC_ALLOWED.has(elementId) ? "⑥ 체크리스트 점수(C-022) — 허용" : "⑥은 숫자 차트 금지 — 적용지역 강조로 바꿀지 결정 필요";
  } else if (!compatible) {
    comment = "호환표 밖 조합";
  }
  if (compatible && type.displayType === "U6" && NUMERIC.has(next.primary.type) && !U6_NUMERIC_ALLOWED.has(elementId)) {
    verdict = "review";
    comment = "⑥인데 1순위가 숫자 차트(" + next.primary.type + ") — 결정 필요";
  }
  if (/표 전환/.test(type.variant) && next.primary.type !== "table" && next.primary.type !== "sorted-table") {
    verdict = "review";
    comment = `명세 변형 '${type.variant}'인데 계약 1순위는 ${next.primary.type} — 결정 필요`;
  }
  findings.push({ elementId, displayType: type.displayType, structure: type.structure, archetype: next.archetype, primary: next.primary.type, verdict, comment });
  // Changes applied on an earlier run stay listed: the row's note records them.
  if (!applied.some((item) => item.elementId === elementId) && String(next.note).startsWith("V159:")) {
    applied.push({ elementId, from: "(V153 계약)", to: `${next.archetype} / ${next.primary.type}`, reason: `명세 v2 ⓪ 상태 안내(${type.status})` });
  }
  return next;
});

const output = `${JSON.stringify({ ...contract, rows }, null, 2)}\n`;
if (CHECK) {
  if (contractRaw.replace(/\r\n/g, "\n") !== output) {
    console.error("contract is not aligned with the typology; run node scripts/v159/align-contract-typology-v159.mjs");
    process.exit(1);
  }
  console.log("contract aligned with typology v159");
  process.exit(0);
}
writeFileSync(CONTRACT_PATH, output);

const count = (verdict) => findings.filter((item) => item.verdict === verdict).length;
const lines = [
  "# 계약(V153) ↔ 유형(V159) 정합 보고",
  "",
  "`scripts/v159/align-contract-typology-v159.mjs`가 생성. 계약 행에 `displayType`·`structure`를 유형 JSON에서 복사하고, V153 `archetype`을 표출 유형 호환표로 판정한다. 계약은 화면에 맞춰 고치지 않으며, 명세가 명시한 변경(⓪ 상태 안내)만 적용한다.",
  "",
  `- 일치 ${count("consistent")} · 자료 한계(전국값 대체) ${count("data-limited")} · 결정 필요 ${count("review")} · 불일치 ${count("mismatch")} / 152`,
  `- 적용한 계약 변경 ${applied.length}건`,
  "",
  "## 적용한 계약 변경",
  "",
  "| ID | 이전(archetype / 1순위) | 이후 | 근거 |",
  "|---|---|---|---|",
  ...applied.map((item) => `| ${item.elementId} | ${item.from} | ${item.to} | ${item.reason} |`),
  "",
  "## 결정 필요·자료 한계·불일치",
  "",
  "| ID | 유형 | 구조 | archetype | 1순위 | 판정 | 설명 |",
  "|---|---|---|---|---|---|---|",
  ...findings.filter((item) => item.verdict !== "consistent").map((item) => `| ${item.elementId} | ${item.displayType} | ${item.structure} | ${item.archetype} | ${item.primary} | ${item.verdict} | ${item.comment} |`),
  "",
  "## 호환표",
  "",
  "| 표출 유형 | 허용 archetype |",
  "|---|---|",
  ...Object.entries(COMPATIBLE).map(([type, list]) => `| ${type} | ${list.join(" · ")} |`),
  "",
];
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, lines.join("\n"));
console.log(JSON.stringify({ consistent: count("consistent"), dataLimited: count("data-limited"), review: count("review"), mismatch: count("mismatch"), applied: applied.map((item) => item.elementId) }));
