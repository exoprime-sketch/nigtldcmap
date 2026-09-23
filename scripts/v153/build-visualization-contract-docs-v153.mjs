#!/usr/bin/env node
/**
 * V153-D1: writes docs/VISUALIZATION_CONTRACT_V153.md from the contract JSON,
 * so the 152-row table in the docs never drifts from what the router, the
 * renderers and the QA read.
 *
 *   node scripts/v153/build-visualization-contract-docs-v153.mjs [--check]
 *   --check: exit 1 when the committed document differs from the JSON.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const JSON_PATH = resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json");
const DOC_PATH = resolve(ROOT, "docs/VISUALIZATION_CONTRACT_V153.md");
const check = process.argv.includes("--check");
const contract = JSON.parse(readFileSync(JSON_PATH, "utf8"));
const rows = [...contract.rows].sort((a, b) => a.elementId.localeCompare(b.elementId));

const ARCHETYPE_KO = {
  "national-series": "국가 시계열",
  composition: "구성비",
  "province-distribution": "성·시 분포",
  registry: "등록부",
  station: "관측소",
  "policy-document": "정책·문서",
  matrix: "매트릭스",
  "status-note": "상태 안내",
};
const STATUS_KO = { standard: "표준", preserved: "보존", exception: "예외" };
const MAP_KO = { "beside-primary": "1순위 옆", none: "없음", pending: "보류" };
const esc = (value) => String(value ?? "").replace(/\|/gu, "／").replace(/\n/gu, " ");
const count = (key, value) => rows.filter((row) => row[key] === value).length;

const lines = [
  "# 공개 상세 시각화 계약 V153 (152행)",
  "",
  `- 정본: \`src/data/visualization/publicVisualizationContractV153.json\` (schema ${contract.schemaVersion}, ${contract.generatedAt}). 이 문서는 \`scripts/v153/build-visualization-contract-docs-v153.mjs\`로 생성한다. 손으로 고치지 않는다.`,
  "- 화면이 계약을 따르는지는 `npm run qa:detail-contract:v153`(production 빌드·Chromium)이 152개 화면의 첫 `[data-analysis-block]`·축·단위로 판정한다. 계약을 화면에 맞춰 역작성하지 않는다.",
  "",
  "## 유형별 1순위 표준",
  "",
  "| 유형 | 1순위 | 비고 |",
  "|---|---|---|",
  "| 국가 시계열 | 라인(`line`) + 최신값(핵심 수치 행) | 단일 시점·2개년만 있는 자료는 예외(막대) |",
  "| 구성비(A-010·A-011·A-016·A-018·B-037) | 누적영역 절대량(`stacked-area`) + 비중 토글 | B-037은 단일 연도라 예외 |",
  "| 성·시 분포 | 지역 막대(`region-bar`, 상위·하위) + 지도 자리 | 선택 지역 추이는 2순위 |",
  "| 등록부(시설·기관·사업) | 분류별 수·규모 막대(`category-bar`) + 목록(카드) | 원자료에 분류 속성이 없으면 예외 |",
  "| 관측소 | 덤벨(`dumbbell`, 지점별 두 값 한 축) | 지점별 단위가 다르면 정렬표 예외 |",
  "| 정책·문서 | 타임라인(`timeline`) 또는 비교표(`comparison-table`) | 숫자 차트 금지 |",
  "| 매트릭스(A-013·C-005·B-044) | 히트맵·정렬표 | 이번 라운드는 문장값 비교표/카드로 열림(예외, 히트맵 후속 P4) |",
  "| 상태 안내(C-020·C-021·C-023·E-011·E-013) | 문구만(`status-note`) | 차트 0 |",
  "",
  `## 집계: 표준 ${count("status", "standard")} · 보존 ${count("status", "preserved")} · 예외 ${count("status", "exception")} · 지도 옆 ${count("mapRole", "beside-primary")} · 지도 보류 ${count("mapRole", "pending")}`,
  "",
  "| ID | 유형 | 1순위 | 제목 | 가로축 | 세로축 | 단위 | 2순위 | 지도 | 상태 | 참고 사례 | 사유·비고 |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map((row) =>
    [
      row.elementId,
      ARCHETYPE_KO[row.archetype] || row.archetype,
      `\`${row.primary.type}\``,
      esc(row.primary.title),
      esc(row.primary.xAxis ?? "—"),
      esc(row.primary.yAxis ?? "—"),
      esc(row.primary.unit ?? "—"),
      row.secondary.map((block) => `\`${block.type}\``).join(" · ") || "—",
      MAP_KO[row.mapRole] || row.mapRole,
      STATUS_KO[row.status] || row.status,
      row.benchmarks.map((benchmark) => `[${esc(benchmark.name)}](${benchmark.url})`).join(" · "),
      esc(row.note || ""),
    ].join(" | ")
  ).map((line) => `| ${line} |`),
  "",
];
const next = `${lines.join("\n")}\n`;
if (check) {
  const current = existsSync(DOC_PATH) ? readFileSync(DOC_PATH, "utf8") : "";
  if (current.replace(/\r\n/gu, "\n") !== next) {
    console.error("docs/VISUALIZATION_CONTRACT_V153.md is out of date; run the script without --check");
    process.exit(1);
  }
  console.log("docs/VISUALIZATION_CONTRACT_V153.md matches the contract JSON");
} else {
  writeFileSync(DOC_PATH, next);
  console.log(`wrote ${DOC_PATH} (${rows.length} rows)`);
}
