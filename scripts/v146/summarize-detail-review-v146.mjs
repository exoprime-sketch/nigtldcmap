import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { benchmarks, reviewedElements } from "../v144/element-review-plan-v144.mjs";
import { loadPacks, loadSemantics, semanticRows } from "../v140/card-model-v140.mjs";

// Summarises actual CUA observations. Does not launch a browser or turn a design
// requirement into an acceptance result merely because a route loaded.
const root = process.cwd();
const evidencePath = resolve(root, "output/public-review-20260917/v146/browser-review-v146.json");
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
const cardsPath = resolve(root, "public/data/vietnam/v2/home/card-summaries-v140.json");
const cards = JSON.parse(readFileSync(cardsPath, "utf8")).cards;
const byId = new Map(evidence.routes.map((row) => [row.id, row]));
const rows = cards.map((card) => {
  const route = byId.get(card.elementId);
  const design = reviewedElements.find((row) => row.elementId === card.elementId);
  const interactions = evidence.interactions.filter((row) => row.id === card.elementId);
  return {
    elementId: card.elementId, title: route?.title || card.title,
    actualCardOpened: route?.clicked === true,
    ready: route?.state === "ready" || route?.state === "empty",
    headlineTileCount: route?.kpis?.length ?? null,
    horizontalOverflow: route?.overflow ?? null,
    interactionAttempts: interactions.length,
    changedAfterSelection: interactions.filter((row) => row.changed).length,
    inspectedAnalysisHeadings: route?.headings || [],
    tablesPresent: route?.tables?.length || 0,
    build: route?.build || null,
    cardClickBuild: route?.cardClickBuild || route?.build || null,
    finalRecheck: route?.finalRecheck === true,
    reviewDesign: design,
    benchmark: design ? benchmarks[design.benchmark] : null,
    limitation: "카드 진입·레이아웃·시험한 선택 조작의 증거이며, 모든 필터 조합과 원자료 전체 수치의 재검산 결과가 아님",
  };
});
const failures = rows.filter((row) => !row.actualCardOpened || !row.ready || row.headlineTileCount !== 0 || row.horizontalOverflow !== false);
const interactionsFailed = evidence.interactions.filter((row) => !row.changed || row.kpis > 0 || row.overflow);
const responsiveFailed = evidence.responsive.filter((row) => row.kpis > 0 || row.overflow);
const packs = loadPacks(resolve(root, "public/data/vietnam/v2"));
const semantics = loadSemantics(resolve(root, "public/data/vietnam/v2"));
const numeric = (value) => Number(String(value).replace(/,/g, ""));
const lcoeSource = semanticRows(packs.get("A-017").observations.records, semantics.byElement.get("A-017"));
const lcoeComparisons = (evidence.lcoeTableChecks || []).flatMap((period) => period.rows.flatMap((row) => ["하한", "기준값", "상한"].map((kind, i) => {
  const source = lcoeSource.filter((r) => r.year === period.year && r.dimensions.category === `${row[0]}(${kind})` && r.unit === "USD/MWh");
  return { technology: row[0], year: period.year, kind, shown: numeric(row[i + 1]), source: source[0]?.value, pass: source.length === 1 && source[0].value === numeric(row[i + 1]) };
})));
// Reviewed independently against UNFCCC NDC 2022, Table 3. Do not read the
// component's constants: a transposed condition must fail this check.
const ndcExpected = [[15.8,43.5],[146.3,403.7],[21741.2,86834.7],[64.8,227],[12.4,50.9],[32.5,46.6],[8.7,29.4],[27.9,49.8]];
const ndcShown = (evidence.ndcTableChecks || []).flat();
const ndcComparisons = ndcExpected.map((values, i) => ({ row: ndcShown[i]?.[0], expected: values, shown: ndcShown[i]?.slice(1,3).map(numeric), pass: values.every((v, j) => v === numeric(ndcShown[i]?.[j + 1])) }));
const facilitySource = packs.get("C-019").entities.records.filter((r) => /^VN\d+$/.test(String(r.normalizedAttributes?.["속성22_행정코드P_code"])) && /시설/.test(r.name) && r.normalizedAttributes?.["속성4_시점"] === "2026-08-10");
const facilityComparisons = (evidence.facilityTableChecks || []).map(([region, value]) => {
  const source = facilitySource.filter((r) => r.normalizedAttributes["속성20_지역_원문"] === region);
  return { region, shown: numeric(value), source: numeric(source[0]?.normalizedAttributes["속성3_값"]), pass: source.length === 1 && numeric(value) === numeric(source[0].normalizedAttributes["속성3_값"]) };
});
const numericalChecks = {
  lcoe: { checked: lcoeComparisons.length, pass: lcoeComparisons.length === 72 && lcoeComparisons.every((r) => r.pass), rows: lcoeComparisons },
  ndc: { checked: ndcComparisons.length * 2, pass: ndcComparisons.every((r) => r.pass), rows: ndcComparisons },
  facilities: { checked: facilityComparisons.length, pass: facilityComparisons.length === 34 && facilityComparisons.every((r) => r.pass), rows: facilityComparisons },
};
const checks = {
  expectedElements: 152, inspected: rows.length,
  finalBuild: evidence.buildScope?.finalBuild || null,
  finalBuildRechecks: rows.filter((row) => row.finalRecheck && row.build === evidence.buildScope?.finalBuild).length,
  layoutFailures: failures.map((row) => row.elementId),
  interactionAttempts: evidence.interactions.length,
  elementsWithInteraction: new Set(evidence.interactions.map((row) => row.id)).size,
  interactionFailures: interactionsFailed,
  responsiveCases: evidence.responsive.length,
  responsiveFailures: responsiveFailed,
  targetedChecks: evidence.targetedChecks || [],
  consoleErrors: evidence.consoleErrors || [],
  numericalChecks: Object.fromEntries(Object.entries(numericalChecks).map(([key, value]) => [key, { checked: value.checked, pass: value.pass }])),
};
const failed = rows.length !== 152 || checks.finalBuildRechecks !== 152 || failures.length || interactionsFailed.length || responsiveFailed.length || checks.targetedChecks.some((row) => row.pass === false) || checks.consoleErrors.length || Object.values(numericalChecks).some((value) => !value.pass);
const report = {
  generatedAt: new Date().toISOString(), status: failed ? "FAIL" : "PASS",
  scope: "V146 대표값 카드 제거·상세 분석 UI 검사. 전체 데이터 의미 검토 완료 또는 배포 완료를 뜻하지 않음",
  evidencePath, evidenceSha256: createHash("sha256").update(readFileSync(evidencePath)).digest("hex"),
  cardAssetSha256: createHash("sha256").update(readFileSync(cardsPath)).digest("hex"),
  buildScope: evidence.buildScope, checks, numericalChecks, rows,
};
const out = resolve(root, "reports/v146");
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, "detail-review-v146.json"), JSON.stringify(report, null, 2) + "\n");
const safe = (value) => String(value || "").replace(/\|/g, "/").replace(/\n/g, " ");
writeFileSync(resolve(out, "detail-review-152-v146.md"), [
  "# V146 상세 화면 152개 검사", "",
  `- 판정: ${report.status} — 상세 숫자 카드 제거·기본 동작·레이아웃 범위`,
  `- 실제 카드 클릭: ${rows.filter((row) => row.actualCardOpened).length}/152`,
  `- 최종 빌드 상세 화면 재검사: ${checks.finalBuildRechecks}/152 (${checks.finalBuild})`,
  `- 선택 조작: ${checks.interactionAttempts}회 / ${checks.elementsWithInteraction}개 데이터`,
  `- 모바일 등 반응형: ${checks.responsiveCases}개 사례`,
  "- 모든 자료의 내용 적합성, 모든 조합, 원자료 전체 수치 검산을 완료했다는 판정이 아닙니다.",
  "- 벤치마크는 기존 데이터별 설계 근거를 연결한 것으로, 이번 작업에서 152개별 외부 사이트를 새로 실사했다는 뜻이 아닙니다.", "",
  "| 코드 | 데이터 | 카드 제거·넘침 | 선택 조작 | 분석 제목(일부) | 검토 기준 |", "|---|---|---|---|---|---|",
  ...rows.map((row) => `| ${row.elementId} | ${safe(row.title)} | ${row.headlineTileCount === 0 && row.horizontalOverflow === false ? "확인" : "확인 필요"} | ${row.interactionAttempts ? `${row.changedAfterSelection}/${row.interactionAttempts}` : "선택 시험 없음"} | ${safe(row.inspectedAnalysisHeadings.slice(0, 2).join(" / "))} | ${safe(row.reviewDesign?.interpretationRule)} |`), "",
  "## 사용한 비교 사례", "", ...Object.entries(benchmarks).map(([key, value]) => `- ${key}: [${value[0]}](${value[1]}) — ${value[2]}`), "",
].join("\n"));
console.log(JSON.stringify({ status: report.status, ...checks, targetedChecks: checks.targetedChecks.length, rows: rows.length }, null, 2));
process.exitCode = failed ? 1 : 0;
