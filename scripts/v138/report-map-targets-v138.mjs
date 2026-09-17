#!/usr/bin/env node
/**
 * The 43-row map target table, from the contract, the map index and the build
 * report - never from a hand-typed list.
 *
 * One row per target: code, public name, source fields, source spatial unit,
 * representation, selectable variables, unit, period, representative item,
 * evidence, limitation, and the implementation status the build actually
 * reached (feature counts included). Written as Markdown for reading and JSON
 * for checking.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));

const contract = read("src/data/visualization/publicMapTargetsV138.json");
const mapIndex = read("public/data/vietnam/v2/map-index.json");
const build = read("reports/v138/map-targets-build-v138.json");
const runtime = (() => {
  try {
    return read("reports/v138/map-runtime-qa-v138.json");
  } catch {
    return null;
  }
})();

const layerByElement = new Map(mapIndex.layers.map((layer) => [layer.elementId, layer]));
const buildByElement = new Map(build.targets.map((row) => [row.elementId, row]));
const runtimeByElement = new Map((runtime?.layers || []).map((row) => [row.elementId, row]));

const STATUS_LABEL = {
  implemented: "구현 완료(지도 표시)",
  partial: "부분 구현(제한 명시)",
  "not-connected": "미연결(사유·필요자료 명시)",
};

const rows = contract.targets.map((target) => {
  const layer = layerByElement.get(target.elementId);
  const built = buildByElement.get(target.elementId) || {};
  const checked = runtimeByElement.get(target.elementId);
  const featureCount = layer?.featureCount ?? null;
  const status = built.status || "not-connected";
  const statusText = [
    STATUS_LABEL[status] || status,
    featureCount !== null ? `객체 ${featureCount.toLocaleString("ko-KR")}` : null,
    built.publishedValueCount ? `값 ${built.publishedValueCount.toLocaleString("ko-KR")}` : null,
    built.variableCount ? `변수 ${built.variableCount}` : null,
    built.periodCount ? `기간 ${built.periodCount}` : null,
    built.approximateCount ? `근사위치 ${built.approximateCount}` : null,
    built.excludedCount ? `미표시 ${built.excludedCount}` : null,
    checked
      ? `브라우저 확인: ${checked.rendered ? "표시됨" : "표시 실패"}${checked.featureSelected ? " · 대표 객체 선택 확인" : ""}${checked.consoleErrors ? ` · 콘솔 오류 ${checked.consoleErrors}` : ""}`
      : "브라우저 확인: 미수행",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    code: target.elementId,
    publicName: target.publicName,
    category: target.category,
    sourceFields: target.sourceFields.join(", "),
    sourceSpatialUnit: target.sourceSpatialUnit,
    representation: target.representation,
    selectableVariables: target.selectableVariables,
    unit: target.unit,
    period: target.period,
    representativeItem: target.representativeItem,
    evidence: target.evidence,
    limitation: target.limitation,
    status,
    statusText,
    featureCount,
    reason: target.build.reason || null,
    requiredAsset: target.build.requiredAsset || null,
  };
});

const escape = (value) => String(value ?? "").replace(/\|/gu, "\\|").replace(/\n/gu, " ");
const header = [
  "코드", "공개명", "분류", "원자료 필드", "원자료 공간단위", "표현", "선택변수", "단위", "기간", "대표 항목", "근거", "제한", "실제 구현상태",
];
const lines = [
  "# 지도 표출 대상 43개 — 구현 상태표 (V138)",
  "",
  `생성: ${new Date().toISOString()} · 자료: src/data/visualization/publicMapTargetsV138.json, public/data/vietnam/v2/map-index.json, reports/v138/map-targets-build-v138.json${runtime ? ", reports/v138/map-runtime-qa-v138.json" : ""}`,
  "",
  `- 구현 완료 ${rows.filter((row) => row.status === "implemented").length} · 부분 구현 ${rows.filter((row) => row.status === "partial").length} · 미연결 ${rows.filter((row) => row.status === "not-connected").length} · 합계 ${rows.length}`,
  `- 활성 지도 레이어 ${mapIndex.activeMapLayerCount}개 · 지도 객체·값 합계 ${mapIndex.mapFeatureCount.toLocaleString("ko-KR")}`,
  "- '부분 구현'은 위치가 확인된 레코드만 표시하고 제외·근사 위치·경계 미확보를 표에 명시한 경우입니다. '미연결'은 필요한 공간 원천을 함께 적었습니다.",
  "",
  `| ${header.join(" | ")} |`,
  `| ${header.map(() => "---").join(" | ")} |`,
  ...rows.map((row) =>
    `| ${[
      row.code, row.publicName, row.category, row.sourceFields, row.sourceSpatialUnit, row.representation,
      row.selectableVariables, row.unit, row.period, row.representativeItem, row.evidence, row.limitation, row.statusText,
    ].map(escape).join(" | ")} |`
  ),
  "",
  "## 미연결 대상과 필요한 자료",
  "",
  ...rows
    .filter((row) => row.status === "not-connected")
    .map((row) => `- ${row.code} ${row.publicName}: ${row.reason} 필요한 자료: ${row.requiredAsset || "미기재"}`),
  "",
  "## 34개 체계 → 63개 경계 대응표(원자료 '2025_개편_후_소속_34개_체계' 열에서 도출)",
  "",
  ...build.crosswalk34.map((item) => `- ${item.region}: ${item.memberAdm1Codes.join(", ")}`),
  "",
];
mkdirSync(resolve(ROOT, "reports/v138"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/v138/map-targets-v138.md"), `${lines.join("\n")}\n`);
writeFileSync(
  resolve(ROOT, "reports/v138/map-targets-v138.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), counts: { implemented: rows.filter((r) => r.status === "implemented").length, partial: rows.filter((r) => r.status === "partial").length, notConnected: rows.filter((r) => r.status === "not-connected").length }, rows }, null, 2)}\n`
);
process.stdout.write(`map targets report: ${rows.length} rows\n`);
