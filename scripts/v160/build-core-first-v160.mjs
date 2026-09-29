#!/usr/bin/env node
/**
 * V160 core-first data: information tiers and the six home questions.
 *
 *   docs/plan/V160_핵심정보_단순화_기획.md §3  -> src/data/spec/informationTiersV160.json
 *   §1 questions + card-summaries-v140.json    -> src/data/spec/homeQuestionsV160.json
 *
 * Tiers are read from the plan's table, never typed into code. A question's
 * representative KPI is taken from the card summary only when the summary's
 * headline states the quantity asked for (the `accept` rule below, checked
 * against the headline text and unit); otherwise the KPI is null and the home
 * card shows none - nothing is estimated.
 *
 * Usage: node scripts/v160/build-core-first-v160.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const PLAN = resolve(ROOT, "docs/plan/V160_핵심정보_단순화_기획.md");
const TYPOLOGY = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const CARDS = resolve(ROOT, "public/data/vietnam/v2/home/card-summaries-v140.json");
const OUT_TIERS = resolve(ROOT, "src/data/spec/informationTiersV160.json");
const OUT_QUESTIONS = resolve(ROOT, "src/data/spec/homeQuestionsV160.json");
const MAP_INDEX = resolve(ROOT, "public/data/vietnam/v2/map-index.json");
const OUT_MAP_DEFAULTS = resolve(ROOT, "src/data/map/mapDefaultLayersV160.json");
// Plan §1.4: the map opens on the core ② ④ ⑤ datasets that have a layer.
const MAP_DEFAULT_TYPES = new Set(["U2", "U4", "U5"]);

const TIER_BY_LABEL = { 핵심: "core", 보조: "support", 참고: "reference", "—(비공개)": "hidden" };
const TYPE_BY_MARK = { "①": "U1", "②": "U2", "③": "U3", "④": "U4", "⑤": "U5", "⑥": "U6", "⓪": "U0" };

// The six questions (plan §1) with their home copy and the KPI the user
// chose (2026-09-24). `accept` must match the card headline for the KPI to
// be shown; `fallback` is tried when the first element's card does not.
const QUESTIONS = [
  { type: "U1", title: "이 나라 수준은?", description: "경제·배출·에너지·거버넌스 수준과 추세", kpi: [{ elementId: "A-003", requested: "GDP", accept: { label: /국내총생산|GDP/u, unit: /미국달러|USD/u } }] },
  {
    type: "U2",
    title: "어디가 유리한가?",
    description: "성·시별 기후 위험과 재생에너지 자원",
    kpi: [
      { elementId: "B-041", requested: "태양광 자원(GHI) 최고 성", accept: { label: /GHI/u, unit: /kWh/u } },
      { elementId: "B-003", requested: "연평균 기온", accept: { label: /연평균 기온/u, unit: /°C/u } },
    ],
  },
  { type: "U3", title: "어떤 기술이?", description: "기술별 설비·비용·감축 효과 비교", kpi: [{ elementId: "A-018", requested: "기술별 설비용량(최대 기술)", accept: { label: /설비용량 최대/u, unit: /MW/u } }] },
  { type: "U4", title: "무엇이 어디에·누구에게?", description: "발전소·송전망과 협력 기관의 위치", kpi: [{ elementId: "A-023", requested: "발전소 수", accept: { label: /발전소 수|개소/u, unit: /개소|곳|기/u } }] },
  { type: "U5", title: "누가 어디에 얼마나?", description: "국제 기후 재원과 개발협력 사업", kpi: [{ elementId: "D-020", requested: "GCF 승인액", accept: { label: /승인액|승인 금액/u, unit: /달러|USD/u } }] },
  { type: "U6", title: "규정·지원·리스크는?", description: "NDC·법제도·인센티브·탄소시장", kpi: [{ elementId: "C-001", requested: "NDC 감축목표", accept: { label: /감축목표/u, unit: /%/u } }] },
];

function readTiers() {
  const text = readFileSync(PLAN, "utf8");
  const rows = [];
  let section = null;
  for (const line of text.split(/\r?\n/u)) {
    const heading = line.match(/^### ([①②③④⑤⑥⓪]) (.+)$/u);
    if (heading) section = { mark: heading[1], label: heading[2].trim() };
    const list = line.match(/^- \*\*(핵심|보조|참고|—\(비공개\))\*\*\((\d+)\): (.*)$/u);
    if (!list || !section) continue;
    const ids = [...list[3].matchAll(/\b([A-E]-\d{3})\b/gu)].map((match) => match[1]);
    if (ids.length !== Number(list[2])) throw new Error(`${section.label} ${list[1]}: ${ids.length} ids, heading says ${list[2]}`);
    for (const elementId of ids) {
      rows.push({
        elementId,
        tier: TIER_BY_LABEL[list[1]],
        displayType: TYPE_BY_MARK[section.mark],
        reason: `기획 V160 §3 ${section.mark} ${section.label} — ${list[1].replace(/[—()]/gu, "")}`,
      });
    }
  }
  return rows.sort((a, b) => a.elementId.localeCompare(b.elementId));
}

function pickKpi(question, cards) {
  const tried = [];
  for (const option of question.kpi) {
    const card = cards.get(option.elementId);
    const headline = card?.headline;
    const text = headline ? `${headline.value} ${headline.label}` : "";
    const ok = Boolean(headline && option.accept.label.test(text) && option.accept.unit.test(text));
    tried.push({ elementId: option.elementId, requested: option.requested, found: headline ? text : null, accepted: ok });
    if (ok) return { heroIndicator: { elementId: option.elementId, requested: option.requested, source: "card-summaries-v140 headline" }, tried };
  }
  return { heroIndicator: null, tried };
}

const tiers = readTiers();
const failures = [];
if (tiers.length !== 152) failures.push(`tiers ${tiers.length} != 152`);
const typology = new Map(JSON.parse(readFileSync(TYPOLOGY, "utf8")).rows.map((row) => [row.elementId, row]));
for (const row of tiers) {
  const type = typology.get(row.elementId);
  if (!type) failures.push(`${row.elementId}: not in typology`);
  // The plan groups by the spec's own type; ⓪ elements stay hidden.
  if (type && row.tier === "hidden" && type.displayType !== "U0") failures.push(`${row.elementId}: hidden but not ⓪`);
  if (type && type.displayType === "U0" && row.tier !== "hidden") failures.push(`${row.elementId}: ⓪ but tier ${row.tier}`);
}
const cards = new Map(JSON.parse(readFileSync(CARDS, "utf8")).cards.map((card) => [card.elementId, card]));
const questions = QUESTIONS.map((question) => {
  const coreElementIds = tiers.filter((row) => row.tier === "core" && row.displayType === question.type).map((row) => row.elementId);
  if (coreElementIds.length < 5) failures.push(`${question.type}: ${coreElementIds.length} core < 5`);
  if ([...question.description].length > 40) failures.push(`${question.type}: description over 40 chars`);
  const { heroIndicator, tried } = pickKpi(question, cards);
  return { displayType: question.type, title: question.title, description: question.description, coreElementIds, heroIndicator, kpiReview: tried };
});

const activeLayers = new Set(JSON.parse(readFileSync(MAP_INDEX, "utf8")).layers.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));
const mapDefaults = tiers.filter((row) => row.tier === "core" && MAP_DEFAULT_TYPES.has(row.displayType) && activeLayers.has(row.elementId)).map((row) => row.elementId);

const outputs = [
  [OUT_TIERS, { schemaVersion: "v160-information-tiers-1", source: "docs/plan/V160_핵심정보_단순화_기획.md §3", rows: tiers }],
  [OUT_QUESTIONS, { schemaVersion: "v160-home-questions-1", source: "docs/plan/V160_핵심정보_단순화_기획.md §1 · KPI 선택 2026-09-24", questions }],
  [OUT_MAP_DEFAULTS, { schemaVersion: "v160-map-default-layers-1", rule: "core tier · display type ② ④ ⑤ · active layer in map-index.json (map-index unchanged)", defaultElementIds: mapDefaults }],
];
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
if (CHECK) {
  const stale = outputs.filter(([path, value]) => readFileSync(path, "utf8").replace(/\r\n/gu, "\n") !== `${JSON.stringify(value, null, 2)}\n`);
  if (stale.length) {
    console.error(`stale: ${stale.map(([path]) => path).join(", ")}`);
    process.exit(1);
  }
  console.log("core-first v160 data up to date");
} else {
  for (const [path, value] of outputs) writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  const count = (tier) => tiers.filter((row) => row.tier === tier).length;
  console.log(JSON.stringify({ core: count("core"), support: count("support"), reference: count("reference"), hidden: count("hidden"), mapDefaults: mapDefaults.length, kpi: questions.map((q) => `${q.displayType}:${q.heroIndicator ? q.heroIndicator.elementId : "hidden"}`) }));
}
