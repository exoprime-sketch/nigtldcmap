import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { benchmarks, reviewedElements } from "./element-review-plan-v144.mjs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const out = resolve("reports/v144");
mkdirSync(out, { recursive: true });
const cards = read("public/data/vietnam/v2/home/card-summaries-v140.json").cards;
const contracts = read("public/data/vietnam/v2/semantic/element-visualization-contracts-v125.json").contracts;
const previous = read("reports/v143/public-ux-runtime-v143.json");
const currentFile = resolve("output/public-review-20260917/v144/browser-review-v144.json");
const current = existsSync(currentFile) ? read(currentFile) : { routes: [], interactions: [] };
const ids = new Set(reviewedElements.map((row) => row.elementId));
if (ids.size !== 152 || reviewedElements.length !== 152 || cards.some((c) => !ids.has(c.elementId))) throw Error("Review coverage must be exactly the delivered 152 elements");
const reviewedCopy = read("src/data/visualization/publicIndicatorCopyV144.json");
const unresolved = {
  "A-023": "발전원별 시설 수·설비용량 및 원천 간 중복 처리의 최종 분석 적합성 검토 필요",
  "A-024": "2016 송전선 관측자료와 PDP8 계획 구간의 범위·전압·시점별 비교를 최종 검토해야 함",
  "C-001": "NDC 조건부/무조건부 감축목표와 재원은 표에 있으나, 조건별 비교를 주 분석으로 만드는 전용 구성이 필요",
  "C-019": "법제 연대기에 지역별 의무시설 수까지 함께 나열됨. 제도 일정과 34개 행정단위 시설 수 비교를 분리해야 함",
  "C-022": "업종·지역별 의무시설 구성과 제도 준비도 설명을 분리한 분석 검토 필요",
  "A-013": "목표 연결 건수와 총 행 수의 집계 기준을 독립 대조해야 함",
  "A-029": "협정 문서 수와 항목 행 수의 차이를 독립 대조해야 함"
};
const changedAnalysis = {
  "A-030": "교역 지표의 연도별 시계열을 주 분석으로 변경",
  "A-032": "중간재 무역 지표의 연도별 시계열을 주 분석으로 변경",
  "A-026": "좌표계·신뢰도·열 수 대신 실제 건물 수·면적 미제공을 명시",
  "B-010": "직접 진입 기본 항목을 사건 문장값에서 기후위험 순위로 변경",
  "D-006": "직접 진입 기본 항목을 %에서 세수 VND로 변경; 세율과 금액을 분리",
  "D-012": "사업 → 진출 사례; 진출국으로 오표시된 원천 국적 → 기업 국적",
  "D-019": "집계 단위를 기술지원 요청으로 변경",
  "D-024": "집계 단위를 투자 거래로 변경",
  "E-008": "빈 국가통계 시리즈 제거; 실제 144건 발행연도 분포·표, 협력국 분류 오류 수정, 긴 분류표 접기; 카드 기간·출처 일치; 다른 분류표에서 가져온 기술명과 단일분류 자료의 이중 집계 수정"
};
const rows = reviewedElements.map((decision) => {
  const card = cards.find((c) => c.elementId === decision.elementId);
  const contract = contracts.find((c) => c.elementId === decision.elementId);
  const old = previous.routes.find((r) => r.id === decision.elementId);
  const fresh = current.routes.find((r) => r.id === decision.elementId);
  const interactions = current.interactions.filter((r) => r.id === decision.elementId);
  const [platform, url, pattern] = benchmarks[decision.benchmark];
  const flags = [];
  if (unresolved[decision.elementId]) flags.push(unresolved[decision.elementId]);
  if (card.kind === "status") flags.push("실제 값 미제공: 분석 완료 판정 대상에서 분리");
  if (decision.elementId === "A-026") flags.push("건물 수·면적·경계 미제공. 파일 사양을 성과로 표시하던 오류 수정");
  if (decision.elementId === "B-017") flags.push("Aqueduct 평가구역 경계 미확보: 지도 미완료");
  if (["B-023", "B-025", "B-028"].includes(decision.elementId)) flags.push("유역 경계 미확보: 관측점/대표점과 유역 범위 구분 필요");
  if (["D-015", "D-016", "D-021"].includes(decision.elementId)) flags.push("보고행과 고유 사업 식별자 대조 필요: 단순 행 수를 고유 사업 수로 승인하지 않음");
  if (card.kind === "facts" && !["A-026", "B-023", "B-028", "B-044", "B-048", "C-009", "C-010", "C-011", "C-015", "D-007", "E-001", "E-002", "E-003", "E-014", "E-015", "E-019", "E-020"].includes(decision.elementId)) flags.push("대표 항목 나열만으로 완료 판정 금지: 조건 비교·분류 분석의 유용성 검토 필요");
  if (fresh?.longKpi?.length || fresh?.longLegend?.length) flags.push("긴 요약/범례 문구 재검토 필요");
  return { ...decision, title: old?.title || card.title, benchmarkReference: { platform, url, pattern, use: "분석 구조 참고; 데이터 추가·동일 출처 주장 아님" },
    actualData: { observations: contract.observationCount, entities: contract.entityCount, populated: contract.populatedRecordCount, missing: contract.missingRecordCount, yearRange: contract.yearRange, measures: contract.measures.map(({ labelKo, unit }) => ({ label: labelKo, unit })), dimensions: contract.dimensions.map(({ key, labelKo, valueCount }) => ({ key, label: labelKo, valueCount })) },
    card: { kind: card.kind, headline: card.headline, selection: card.selection, period: card.period, provider: card.provider },
    previousRuntime: { build: previous.mainBundle, status: old?.state, headings: old?.headings, qualification: "V143 경로/구조 증거. 이번 최종 수용 근거로 대체 사용하지 않음" },
    currentRuntime: fresh || null, currentInteractions: interactions,
    designReviewComplete: true, runtimeLoaded: fresh?.state === "ready", analysisAcceptance: "pending-evidence", runtimeVerified: false,
    implementedThisTurn: changedAnalysis[decision.elementId] || (Boolean(reviewedCopy[decision.elementId]) ? "검토된 반복 문구 간소화·단위 결합·같은 계열 직전연도 비교" : "분석 요구사항 개별 검토; 기존 구현은 별도 수용 판정 필요"),
    openIssues: flags
  };
});
const result = { generatedAt: new Date().toISOString(), schemaVersion: "v144-review-1", scope: "152개별 분석 설계 재검토와 현재 증거. PASS 일괄 승격 금지", sourceCardSha256: createHash("sha256").update(readFileSync("public/data/vietnam/v2/home/card-summaries-v140.json")).digest("hex"),
  summary: { elements: rows.length, designReviewed: 152, benchmarks: Object.keys(benchmarks).length, currentRuntimeLoaded: rows.filter((r) => r.runtimeLoaded).length, currentInteractionRecords: current.interactions.length, responsiveCases: current.responsive?.length || 0, fullAnalysisAccepted: 0 }, browserEvidence: { build: current.build, buildScope: current.buildScope, baseUrl: current.baseUrl, scenarioChecks: current.scenarioChecks || [], responsive: current.responsive || [], consoleErrors: current.consoleErrors ?? null, qualification: "118개 선택 검사는 각 화면의 첫 선택기 1회 변경. 전체 선택 조합·의미적 수용 검증을 뜻하지 않음" }, benchmarks, elements: rows };
writeFileSync(resolve(out, "element-benchmark-review-v144.json"), JSON.stringify(result, null, 2) + "\n");
const esc = (s) => String(s || "").replace(/\|/g, " / ").replace(/\n/g, " ");
writeFileSync(resolve(out, "ELEMENT_BENCHMARK_REVIEW_V144.md"), [
  "# 152개 데이터별 벤치마킹·분석 재검토", "", "판정: 개별 분석 설계 검토 152개. 화면 로딩과 분석 적합성 최종 수용을 구분한다. 아래 분석 요구사항은 구현 완료 선언이 아니다.", "",
  "## 데이터별 검토", "", "| 코드 | 데이터명 | 참고 사례 | 사용자가 확인할 내용 | 필요한 분석 | 반드시 지킬 해석 기준 | 남은 쟁점 |", "|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.elementId} | ${esc(r.title)} | [${r.benchmarkReference.platform}](${r.benchmarkReference.url}) | ${r.publicQuestion} | ${r.requiredAnalysis} | ${r.interpretationRule} | ${esc(r.openIssues.join("; ")) || "선택 조작·수치 대조·화면 판정 증거 필요"} |`),
  "", "## 수용 판정", "", "- 동일한 벤치마크가 여러 데이터에 적용될 수 있으나, 질문·비교 대상·단위·해석 기준은 각 행에서 따로 정했다.",
  "- 로딩 성공, 차트 존재, 선택 후 문자열 변경만으로 분석 적합성을 PASS 처리하지 않는다.",
  "- 최종 수용에는 실제 카드 클릭, 동일 조건 수치 대조, 의미 있는 선택 변경, 차트·표 검산, 정보 배치 확인이 모두 필요하다.",
  "- 실제 값 미제공 5개와 A-026의 메타데이터 전용 자료는 분석 가능 데이터 수에서 구분한다.",
  "- 외부 자료는 화면 구조의 벤치마크로만 사용했으며 신규 측정값을 추가하지 않았다.", ""
].join("\n"));
console.log(JSON.stringify(result.summary));
