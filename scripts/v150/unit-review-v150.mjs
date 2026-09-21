// V150 unit review: one row per dataset (152) with the unit the reader sees on
// the card headline, plus an appendix over every semantic measure (label ·
// unit) judged against the quantity it names. The judgement is a display
// review only — values, precision and download files are never touched here.
//
//   node scripts/v150/unit-review-v150.mjs [--out reports/v150/UNIT_REVIEW_V150.md]
//
// Rules (from the V150 brief): energy consumption EJ/PJ/ktoe(Mtoe,TJ),
// capacity MW/GW, generation GWh/TWh, voltage kV, emissions MtCO₂e (tCO₂e
// scale variants accepted), money in the source currency and scale, shares %.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const outArg = args.indexOf("--out");
const OUT = resolve(ROOT, outArg >= 0 ? args[outArg + 1] : "reports/v150/UNIT_REVIEW_V150.md");
const DATA = resolve(ROOT, "public/data/vietnam/v2");

const catalog = JSON.parse(readFileSync(resolve(DATA, "catalog.json"), "utf8")).elements;
const cards = new Map(JSON.parse(readFileSync(resolve(DATA, "home/card-summaries-v140.json"), "utf8")).cards.map((card) => [card.elementId, card]));
const mapTargets = new Map(JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json"), "utf8")).targets.map((target) => [target.elementId, target]));
const semanticDir = resolve(DATA, "semantic/elements");
const semantic = new Map();
for (const file of readdirSync(semanticDir)) {
  if (!file.endsWith(".json")) continue;
  const element = JSON.parse(readFileSync(resolve(semanticDir, file), "utf8"));
  semantic.set(element.elementId, element);
}

const norm = (unit) => String(unit || "").replace(/\s+/gu, "").replace(/₂/gu, "2").replace(/eq$/iu, "e").replace(/톤/gu, "t").toLowerCase();

// The review is unit-driven: the unit string tells which quantity family the
// source publishes, and the label is only consulted to catch a family clash
// (an energy amount labelled with a capacity unit, or the reverse). Money stays
// in the source currency and scale by rule, so any currency unit is accepted.
const U = {
  share: /^(%|%p|퍼센트|%ofgdp|%\(.*\)|%중량|.*비중.*)$/u,
  neutral: /^(건|곳|개|개소|명|점|지수|순위|위|년|월|일|영업일|시간|회|건\(.*\)|상태|분야|구분|계획|제도|조항|절차|법령번호|업종.*|여부|해당여부|회원여부.*|유형|등급|단계|원값|score|index|°|—|-|(백만|천|억)?명(당)?|명\/백만명)$/u,
  money: /(usd|vnd|đồng|dong|원|eur|krw|jpy|sdr|\$|달러|국제달러|ppp)/u,
  energy: /^(ej|pj|tj|ktoe|mtoe|toe|kwh|mwh|gwh|twh|십억kwh|억kwh|gwh\/년|twh\/년|gwh\/yr|twh\/yr|십억kwh\/yr)$/u,
  capacity: /^(kw|mw|gw|mwp|gwp|mwac|mwdc|mwt|백만kw|gw\(.*\)|mw\(.*\))$/u,
  voltage: /^kv$/u,
  emissions: /^(mtco2e|mtco2|ktco2e|ktco2|tco2e|tco2|gtco2e|mtco2e\(.*\)|백만tco2e|백만tco2|gg|ggco2e|mgco2e\/yr|mgco2\/yr|tco2e\/년|tco2e\/yr|tco2e\/년이상|mt\/yr)$/u,
};
const ALIASES = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/unitDisplayV150.json"), "utf8")).aliases;
const ENERGY_LABEL = /(소비|수요|발전량|생산량|전력량|공급량|사용량)/u;
const CAPACITY_LABEL = /(설비용량|설비 용량|계획용량|계획 용량|발전용량|발전 용량)/u;
const CONSUMPTION_LABEL = /(에너지 소비|에너지 공급|1차 에너지|최종 에너지|연료 소비|에너지 사용)/u;

function judgeMeasure(labelKo, unit) {
  const label = String(labelKo || "");
  const raw = String(unit || "").trim();
  const u = norm(raw);
  if (!u || u === "—" || u === "-") return { family: "—", verdict: "대상 외", reason: "원자료 단위 없음(화면 '원자료 미기재')" };
  if (U.share.test(u)) return { family: "비율", verdict: "OK", reason: `비율(${raw})` };
  if (U.neutral.test(u)) return { family: "—", verdict: "대상 외", reason: `건수·점수·기간·속성(${raw})` };
  if (U.voltage.test(u)) return { family: "전압", verdict: "OK", reason: "kV" };
  if (U.emissions.test(u)) {
    if (ALIASES[raw]) return { family: "배출", verdict: "표기", reason: `${raw} → 표시 ${ALIASES[raw]}(같은 크기, 값 불변; unitDisplayV150)` };
    if (/^(mtco2e?\(.*\))$/u.test(u) && ALIASES[raw.replace(/\s*\(.*\)$/u, "")]) return { family: "배출", verdict: "표기", reason: `${raw} → 표시 ${ALIASES[raw.replace(/\s*\(.*\)$/u, "")]} + 한정어(값 불변)` };
    if (u === "gg") return { family: "배출", verdict: "검토", reason: "Gg(=kt) 가스별 원단위 — CO₂eq 환산 아님, 라벨에 가스 명시 확인" };
    if (u === "mt/yr") return { family: "—", verdict: "대상 외", reason: "질량(자원량) Mt/yr — 배출 아님" };
    return { family: "배출", verdict: "OK", reason: `배출 단위(${raw})` };
  }
  if (U.money.test(u)) return { family: "금액", verdict: "OK", reason: `원자료 통화·단위 유지(${raw})` };
  if (U.capacity.test(u)) {
    if (ENERGY_LABEL.test(label) && !CAPACITY_LABEL.test(label) && !/확충|계획\b|목표/u.test(label)) return { family: "설비용량", verdict: "위반 후보", reason: `지표명은 에너지·발전량(${label})인데 단위 ${raw}` };
    if (ALIASES[raw]) return { family: "설비용량", verdict: "표기", reason: `${raw} = ${ALIASES[raw]}, 표시만 ${ALIASES[raw]}(값 불변; unitDisplayV150)` };
    return { family: "설비용량", verdict: "OK", reason: `설비용량·잠재량 단위(${raw})` };
  }
  if (U.energy.test(u)) {
    if (CAPACITY_LABEL.test(label)) return { family: "에너지·발전량", verdict: "위반 후보", reason: `지표명은 설비용량인데 단위 ${raw}` };
    if (ALIASES[raw]) return { family: "에너지·발전량", verdict: "표기", reason: `${raw} = ${ALIASES[raw]}, 표시만 ${ALIASES[raw]}(값 불변; unitDisplayV150)` };
    if (CONSUMPTION_LABEL.test(label) && /wh/u.test(u)) return { family: "에너지 소비", verdict: "OK", reason: `전력 단위(${raw}) — 전력 소비·공급 지표` };
    return { family: "에너지·발전량", verdict: "OK", reason: `에너지·발전량 단위(${raw})` };
  }
  if (/\//u.test(raw)) return { family: "원단위", verdict: "OK", reason: `원단위·비율(${raw}) 원자료 표기 유지` };
  if (/[·]/u.test(raw) || /\s\/\s/u.test(raw)) return { family: "복합", verdict: "검토", reason: `복합 단위(${raw}) — 지표별 분리 표시 확인` };
  return { family: "—", verdict: "대상 외", reason: `규칙 밖 수량(${raw}: 면적·길이·기온·강수·질량 등)` };
}

const STATUS_KINDS = new Set(["status"]);
const REGISTER_KINDS = new Set(["facts", "map"]);

const rows = [];
const appendix = [];
for (const element of catalog) {
  const id = element.elementId;
  const card = cards.get(id);
  const sem = semantic.get(id);
  const measures = sem?.measures || [];
  const judged = measures.map((measure) => ({ ...measure, ...judgeMeasure(measure.labelKo, measure.unit) }));
  for (const measure of judged) {
    if (measure.verdict !== "OK" && measure.verdict !== "대상 외") appendix.push({ id, ...measure });
  }
  const headlineUnit = card?.measure?.unit || card?.preview?.unit || (card?.headline?.value || "").replace(/^[\d.,\-–~\s]+/u, "").trim() || card?.basis?.unit || "—";
  const indicator = card?.measure?.label || card?.headline?.label || element.elementLabel;
  let verdict;
  let reason;
  if (!card || STATUS_KINDS.has(card.kind)) {
    verdict = "해당 없음";
    reason = "상태 안내 자료(값 제공 전)";
  } else if (REGISTER_KINDS.has(card.kind) || /^(건|곳|개|명|항목|기관|사업|프로젝트|문서|법령·문서|협정|관측값|홈과 동일)$/u.test(headlineUnit)) {
    const bad = judged.filter((measure) => measure.verdict === "위반 후보");
    verdict = bad.length ? "검토" : "해당 없음";
    reason = bad.length ? `등록부형 요약(건수) · 측정단위 위반 후보 ${bad.length}건(부록)` : `등록부·시설 자료(건수 명사 '${headlineUnit}')`;
  } else {
    const head = judgeMeasure(indicator, headlineUnit);
    const bad = judged.filter((measure) => measure.verdict === "위반 후보");
    const review = judged.filter((measure) => measure.verdict === "검토" || measure.verdict === "표기");
    verdict = head.verdict === "위반 후보" || bad.length ? "위반 후보" : head.verdict === "검토" || review.length ? "검토" : "OK";
    reason = [head.verdict === "대상 외" ? `대표 지표 '${indicator}'는 규칙 밖 수량(현재 단위 ${headlineUnit})` : head.reason, bad.length ? `측정단위 위반 후보 ${bad.length}` : "", review.length ? `검토 ${review.length}` : ""].filter(Boolean).join(" · ");
  }
  const mapUnit = mapTargets.get(id)?.unit || "";
  rows.push({ id, title: element.elementLabel, indicator, unit: headlineUnit, mapUnit, kind: card?.kind || "—", verdict, reason, measureCount: measures.length });
}

const counts = rows.reduce((acc, row) => ({ ...acc, [row.verdict]: (acc[row.verdict] || 0) + 1 }), {});
const appendixCounts = appendix.reduce((acc, row) => ({ ...acc, [row.verdict]: (acc[row.verdict] || 0) + 1 }), {});
const totalMeasures = [...semantic.values()].reduce((sum, element) => sum + (element.measures || []).length, 0);

const lines = [];
lines.push("# 단위 전수 표 V150 (152개 항목)");
lines.push("");
lines.push(`- 생성: ${new Date().toISOString()} · 스크립트 \`scripts/v150/unit-review-v150.mjs\``);
lines.push("- 판정 기준: 에너지 소비량 EJ/PJ/ktoe · 설비용량 MW/GW · 발전량 GWh/TWh · 전압 kV · 배출 MtCO₂e · 금액 원자료 통화·단위 · 비율 %. 건수·점수·지수·면적·기간은 규칙 밖(대상 외).");
lines.push("- '현재 단위'는 홈·찾기 카드 요약(card-summaries-v140)의 대표 지표 단위. '지도 단위'는 지도 대상 계약(publicMapTargetsV138)의 표기.");
lines.push("- 원칙: 표시 라벨만 검토·정정한다. 원자료 값·정밀도·다운로드 파일은 바꾸지 않는다. 원자료 단위가 없는 지표는 화면에 '원자료 미기재'로 두며 임의 단위를 채우지 않는다.");
lines.push(`- 항목 판정: ${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(" · ")} (합 ${rows.length})`);
lines.push(`- 측정단위(semantic measures) ${totalMeasures}개 중 부록 대상 ${appendix.length}개: ${Object.entries(appendixCounts).map(([key, value]) => `${key} ${value}`).join(" · ")}`);
lines.push("");
lines.push("## 조치(V150)");
lines.push("");
lines.push("- 표기: `src/data/visualization/unitDisplayV150.ts`(+ `.json` 별칭표)로 같은 크기의 단위만 표시 철자를 통일한다(Mt CO2eq·MtCO2e·백만 tCO₂e → MtCO₂e, 백만 kW → GW, 십억 kWh → TWh). 적용 위치: ChartAxesV150, SemanticContractRendererV125.observationUnitV125, 상세 분석 컴포넌트(배출·구성·지역·비교·요약표·원자료표·작은 지도·지역 시나리오), 카드 요약 빌드(card-summaries-v140)·홈 요약 빌드(home-preview-v139). CO₂-only 단위(MtCO₂)는 CO₂e로 넓히지 않는다.");
lines.push("- 위반 후보(C-018 '에너지 수요 전망 | MW'): 레코드 0건으로 화면에 값이 표시되지 않는 원자료 구조상의 라벨·단위 조합이다. 원자료가 부하(MW)인지 수요(TWh)인지 확인 전에는 라벨을 바꾸지 않는다 → '원자료 확인 필요'.");
lines.push("- 검토(A-010 'Gg'): 가스별 원단위(CO₂eq 미환산)이므로 그대로 두고, 화면은 가스 이름과 함께 표시한다. C-005·C-009 복합 표기는 문장형 정책자료의 원자료 표기이며 레코드 0건.");
lines.push("- 원자료 값·정밀도·다운로드 파일은 변경하지 않았다.");
lines.push("");
lines.push("## 152개 항목");
lines.push("");
lines.push("| 항목 | 데이터명 | 대표 지표 | 현재 단위 | 지도 단위 | 카드 유형 | 판정 | 근거 |");
lines.push("|---|---|---|---|---|---|---|---|");
for (const row of rows) {
  lines.push(`| ${row.id} | ${row.title.replace(/\|/gu, "／")} | ${String(row.indicator).replace(/\|/gu, "／")} | ${row.unit} | ${row.mapUnit} | ${row.kind} | ${row.verdict} | ${row.reason.replace(/\|/gu, "／")} |`);
}
lines.push("");
lines.push("## 부록 — 측정단위 검토·위반 후보·표기 통일 대상");
lines.push("");
lines.push("| 항목 | 지표(measure) | 단위 | 레코드 수 | 유형 | 판정 | 근거 |");
lines.push("|---|---|---|---|---|---|---|");
for (const row of appendix.sort((a, b) => (a.verdict === b.verdict ? a.id.localeCompare(b.id) : a.verdict.localeCompare(b.verdict)))) {
  lines.push(`| ${row.id} | ${String(row.labelKo).replace(/\|/gu, "／")} | ${row.unit || "—"} | ${row.recordCount ?? ""} | ${row.family} | ${row.verdict} | ${row.reason.replace(/\|/gu, "／")} |`);
}
lines.push("");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(JSON.stringify({ rows: rows.length, counts, totalMeasures, appendix: appendix.length, appendixCounts }));
for (const row of appendix.filter((item) => item.verdict === "위반 후보")) console.log(`${row.id}\t${row.labelKo}\t${row.unit}\t${row.recordCount}\t${row.reason}`);
