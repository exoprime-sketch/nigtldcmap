/**
 * Card → detail analysis QA for the 152 public datasets (V140, second cut).
 *
 * For every dataset, against the local build (default) or a deployed origin
 * whose assets are first checked to be the same version as the local
 * contract:
 *
 *   cardClicked             the finder card (and, for the eight, the home
 *                           card) was really clicked and the detail opened
 *   selectionUrlPreserved   the URL still carries the card's selection
 *   screenLoaded            analysis root `ready`, no lazy placeholder, and
 *                           no console error / failed asset / HTML-for-JSON
 *                           across the whole session (controls and map too)
 *   cardValueVerified       the card's figure is on the detail *as the same
 *                           thing*: same number (integers exact, decimals to
 *                           the card's displayed precision, 억/만/10억/조
 *                           scales made explicit), the unit beside it, and
 *                           the card's year/period/region where it states
 *                           one; ranges by both bounds, compositions by
 *                           every shown part
 *   recomputed              the figure recomputed from the public download
 *                           file, independently of the card generator
 *   detailAnalysisFit       the selectors' displayed values, the analysis
 *                           heading and the KPI state the handed-over
 *                           selection (measure, year/period, region)
 *   controlsVerified        every analysis select, tried from a fresh page
 *                           with a real user selection, changes the numbers
 *                           or the stated subject of the primary analysis
 *   tableValuesVerified     the figure is in a table cell of the screen,
 *                           with failures classified (no table / no derived
 *                           row / mismatch / not applicable)
 *   mapHandoffVerified      for map datasets, 지도에서 보기 draws the layer and
 *                           the list names it as drawn
 *
 * Every required failure sets a non-zero exit code. Not-applicable cases are
 * recorded with their reason and never counted as passes.
 *
 * Usage: node scripts/v140/analysis-qa-v140.mjs [--base-url URL] [--label name]
 *        [--baseline reports/v150/analysis-qa-baseline-v150.json]
 *   --baseline: the known required failures (element id → failing checks)
 *   handed to PR-D. With it, the exit code fails only on a failure the
 *   baseline does not list (a new element, or a new check on a listed one);
 *   every failure is still reported and counted.
 *        [--only A-002,B-033] [--workers 3] [--allow-version-mismatch]
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { recordRoleOf } from "./card-model-v140.mjs";

const argv = process.argv.slice(2);
const opt = (flag, fallback = null) => {
  const index = argv.indexOf(flag);
  return index < 0 ? fallback : argv[index + 1];
};
const externalBase = opt("--base-url");
const label = opt("--label", externalBase ? "deployed" : "local-build");
const only = opt("--only") ? opt("--only").split(",").map((id) => id.trim()) : null;
const workers = Number(opt("--workers", 3));
const allowVersionMismatch = argv.includes("--allow-version-mismatch");
const bypassSecret = opt("--bypass-secret", process.env.VERCEL_AUTOMATION_BYPASS_SECRET || null);
const bypassHeaders = bypassSecret ? { "x-vercel-protection-bypass": bypassSecret, "x-vercel-set-bypass-cookie": "true" } : {};
const OUT = resolve(PROJECT_ROOT, "reports/v140");
mkdirSync(OUT, { recursive: true });

const DATA = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
const summariesFile = readFileSync(resolve(DATA, "home/card-summaries-v140.json"), "utf8");
const summariesAsset = JSON.parse(summariesFile);
const summaries = summariesAsset.cards;
// V159 ⓪ status elements (excluded or not yet delivered, decided 2026-09-23):
// they show one status notice instead of an analysis, so they are judged by
// statusNoticePresent · chartCount0 · cardShowsStatus instead of the card
// value and analysis-fit checks. Every other element is judged as before.
const STATUS_IDS_V159 = new Set(
  JSON.parse(readFileSync(resolve(PROJECT_ROOT, "src/data/spec/datasetTypologyV159.json"), "utf8")).rows
    .filter((row) => row.displayType === "U0")
    .map((row) => row.elementId)
);
const catalog = JSON.parse(readFileSync(resolve(DATA, "catalog.json"), "utf8")).elements;
const localManifest = JSON.parse(readFileSync(resolve(DATA, "manifest.json"), "utf8"));
const mapIndex = JSON.parse(readFileSync(resolve(DATA, "map-index.json"), "utf8")).layers;
const homePreview = JSON.parse(readFileSync(resolve(DATA, "home/home-preview-v139.json"), "utf8"));
const mapConnected = new Set(mapIndex.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));
const HOME_IDS = new Set(homePreview.cards.map((card) => card.elementId));
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

const server = externalBase ? null : await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const base = (externalBase || server.url).replace(/\/$/u, "");

// ---------------------------------------------------------------- version check
async function fetchText(path) {
  try {
    const response = await fetch(`${base}${path}`, { headers: bypassHeaders });
    return { status: response.status, text: await response.text() };
  } catch (error) {
    return { status: 0, text: "", error: String(error) };
  }
}
const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };
const remoteSummaries = await fetchText("/data/vietnam/v2/home/card-summaries-v140.json");
const remoteManifest = parse((await fetchText("/data/vietnam/v2/manifest.json")).text);
const version = {
  local: { cardSummaries: sha(summariesFile), cardGeneratedAt: summariesAsset.generatedAt, sourceHash: summariesAsset.sourceHash, manifestGeneratedAt: localManifest.generatedAt, mapLayerCount: localManifest.mapLayerCount },
  remote: {
    cardSummaries: remoteSummaries.status === 200 && parse(remoteSummaries.text) ? sha(remoteSummaries.text) : null,
    cardGeneratedAt: parse(remoteSummaries.text)?.generatedAt ?? null,
    manifestGeneratedAt: remoteManifest?.generatedAt ?? null,
    mapLayerCount: remoteManifest?.mapLayerCount ?? null,
  },
};
version.match = version.local.cardSummaries === version.remote.cardSummaries && version.local.manifestGeneratedAt === version.remote.manifestGeneratedAt && version.local.mapLayerCount === version.remote.mapLayerCount;
if (!version.match && !allowVersionMismatch) {
  console.error(JSON.stringify({ error: "deployment is not the version this contract describes", version }));
  writeFileSync(resolve(OUT, `analysis-qa-v140-${label}.json`), `${JSON.stringify({ summary: { label, base, aborted: "version mismatch" }, version, results: [] }, null, 2)}\n`);
  if (server) await server.close();
  process.exit(2);
}

// CI resolves Chrome into V125_BROWSER_EXECUTABLE (no bundled Playwright browser there).
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});

// ---------------------------------------------------------------- helpers
const clean = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
const SCALES = { 조: 1e12, 십억: 1e9, "10억": 1e9, 억: 1e8, 백만: 1e6, 만: 1e4, 천: 1e3, B: 1e9, M: 1e6, K: 1e3 };
const UNIT_ALIASES = {
  USD: ["USD", "미국달러", "달러", "US$"],
  "%": ["%"],
  MW: ["MW"],
  ha: ["ha"],
  km: ["km"],
  "km²": ["km²", "km2"],
  "Mt CO2eq": ["Mt CO2eq", "Mt CO₂eq", "MtCO2eq", "MtCO₂eq", "MtCO₂e"],
  "Mt CO₂eq": ["Mt CO2eq", "Mt CO₂eq", "MtCO₂e"],
  // V150 display spelling (unitDisplayV150); the source packs still say "Mt CO2eq".
  "MtCO₂e": ["MtCO₂e", "Mt CO2eq", "Mt CO₂eq", "MtCO2eq", "MtCO₂eq", "MtCO2e"],
  점: ["점"],
  지수: ["지수"],
  건: ["건"],
  곳: ["곳"],
  개: ["개"],
  명: ["명"],
  "°C": ["°C", "℃"],
  일: ["일"],
  mm: ["mm"],
  m: ["m"],
  년: ["년"],
  순위: ["위", "순위"],
  위: ["위", "순위"],
};

/** Numbers in a text, each with the 조/억/만/10억/백만/천 scale that follows it. */
function numbersIn(text) {
  const out = [];
  const re = /(-|−|\+)?(\d[\d,]*(?:\.\d+)?)\s*(조|십억|10억|억|백만|만|천|[BMK](?![A-Za-z]))?/gu;
  let match;
  while ((match = re.exec(text))) {
    const raw = Number(match[2].replace(/,/gu, ""));
    if (!Number.isFinite(raw)) continue;
    const sign = match[1] === "-" || match[1] === "−" ? -1 : 1;
    const scale = SCALES[match[3]] || 1;
    out.push({ raw: sign * raw, scaled: sign * raw * scale, factor: scale, decimals: (match[2].split(".")[1] || "").length });
  }
  return out;
}

/** Integers exact; decimals to half of the last displayed digit. */
function within(target, candidate, decimals) {
  if (decimals === 0) return Math.abs(candidate - target) < 0.5;
  return Math.abs(candidate - target) <= Math.pow(10, -decimals) / 2 + 1e-9;
}

/** The card's number formatter (FinderCardSummaryV140 `fmt`), so a raw part value is compared by the digits the card shows. */
function displayedNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1e8) return { value: Number((value / 1e8).toFixed(2)), factor: 1e8, decimals: (String(Number((value / 1e8).toFixed(2))).split(".")[1] || "").length };
  if (abs >= 1e6) return { value: Math.round(value / 1e4), factor: 1e4, decimals: 0 };
  const fraction = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
  const shown = Number(value.toFixed(fraction));
  return { value: shown, factor: 1, decimals: (String(shown).split(".")[1] || "").length };
}

/** The text after the number and its scale word: "443개 평가구역" → unit 개, qualifier 평가구역. */
function unitInValue(value) {
  const rest = clean(value).replace(/^[-−+]?\d[\d,]*(?:\.\d+)?\s*(?:조|십억|10억|억|백만|만|천)?\s*/u, "").replace(/\s*~.*$/u, "").trim();
  const counter = rest.match(/^(개소|개|건|곳|명|기|회|호|편|종|점|위|척|대|구역)(?:\s+(.+))?$/u);
  if (counter) return { unit: counter[1], qualifier: counter[2] || null };
  return { unit: rest, qualifier: null };
}

/** What the card claims: numbers, unit, year/period, region, parts. */
function claimOf(card, displayedHeadline = "") {
  const value = card.headline?.value || "";
  const nums = numbersIn(value);
  const inValue = unitInValue(value);
  // The measure's unit when the card prints it; otherwise the unit the card
  // prints (a facts card counts "1개 항목" of a text-valued measure).
  const unit = card.measure?.unit && value.includes(card.measure.unit) ? card.measure.unit : inValue.unit || card.measure?.unit || (card.preview?.unit ?? "");
  // The finder renders units through the public wording (십억 USD_2017/yr →
  // 2017년 구매력평가 기준 10억 미국달러/년); the detail uses the same wording.
  const displayedUnit = displayedHeadline ? unitInValue(displayedHeadline).unit : "";
  const claim = {
    numbers: nums.map((n) => ({ value: n.raw, scaled: n.scaled, factor: n.factor, decimals: n.decimals })),
    unit,
    unitAliases: [...new Set([...(UNIT_ALIASES[unit] || (unit ? [unit] : [])), ...(displayedUnit ? [displayedUnit] : [])])],
    // Only what the card's own selection states; a period in the label
    // ("2019–2021년") is the register's span, not a KPI year.
    year: card.selection?.year ?? null,
    period: card.selection?.period ?? null,
    region: Object.entries(card.selection?.dimensions || {}).filter(([key]) => /^(detail_2|region|province|regionName)$/u.test(key) || (key === "detail" && card.kind === "spatial")).map(([, v]) => v)[0] || null,
    parts: (card.preview?.parts || []).map((part) => ({ label: part.label, value: part.value })),
    isRange: /~/u.test(value),
  };
  // "514.7" with unit "10억 USD": the detail may print the USD amount. The
  // scale is kept so a recomputed amount is compared in the card's own
  // digits (514.7 ↔ 514,697,215,165 / 10억 = 514.697).
  // A home card prints the unit in its label ("514.7" / "10억 미국달러 · 2025년…").
  const labelHead = !inValue.unit ? clean((card.headline?.label || "").split(" · ")[0]) : "";
  const labelUnit = /^(조|십억|10억|억|백만|만|천)\s*\S+$/u.test(labelHead) || (labelHead.length <= 12 && !/\d/u.test(labelHead) && /^[A-Za-z가-힣%°²³/ ]+$/u.test(labelHead) && !/범위|합계|최대|추이/u.test(labelHead)) ? labelHead : "";
  const scaleWord = `${unit} ${labelUnit}`.match(/(?:^|\s)(조|십억|10억|억|백만|만|천)(?=\s|[A-Za-z명건달])/u)?.[1] || null;
  if (labelUnit) {
    const bare = labelUnit.replace(/^(조|십억|10억|억|백만|만|천)\s*/u, "").trim();
    if (bare && !claim.unitAliases.includes(bare)) claim.unitAliases.push(bare);
  }
  if (scaleWord && nums.length && nums[0].factor === 1) claim.numbers.push({ value: nums[0].raw * SCALES[scaleWord], scaled: nums[0].raw * SCALES[scaleWord], decimals: 0, derived: scaleWord, factor: SCALES[scaleWord], shown: nums[0] });
  return claim;
}

// The detail may print the amount in another scale ("165만 ha" ↔ "1,647,459 ha"
// ↔ "164.7만 ha"): compare in the card's displayed digits.
// When the detail prints fewer digits than the card ("USD 1.67B" for
// 16.65억), the comparison is at the detail's displayed precision.
const halfUnit = (n) => ((n.factor || 1) * Math.pow(10, -n.decimals)) / 2;
const numberMatches = (need, n) =>
  within(need.value, n.scaled / (need.factor || 1), need.decimals) ||
  within(need.value, n.raw, need.decimals) ||
  ((n.factor !== need.factor || n.decimals !== need.decimals) && Math.abs(need.scaled - n.scaled) <= Math.max(halfUnit(need), halfUnit(n)) * (1 + 1e-9) + 1e-9);
const derivedMatches = (alt, n) => Math.abs(n.scaled - alt.scaled) / Math.abs(alt.scaled || 1) < 5e-4;

/** One KPI-like block that states the claimed number with its unit and, when claimed, its year/period/region. */
function findClaimOnScreen(claim, candidates) {
  const needed = claim.isRange ? claim.numbers.filter((n) => !n.derived).slice(0, 2) : claim.numbers.filter((n) => !n.derived).slice(0, 1);
  const alternatives = claim.numbers.filter((n) => n.derived);
  let partial = null;
  for (const candidate of candidates) {
    const nums = numbersIn(candidate.text);
    const numberOk = needed.every((need) => nums.some((n) => numberMatches(need, n))) || (alternatives.length > 0 && alternatives.some((alt) => nums.some((n) => derivedMatches(alt, n))));
    if (!numberOk) continue;
    // The unit beside the number, in the table's header, or stated by the
    // selected measure ("이탄지 면적 합계 — km²") that the panel's values share.
    const unitOk = claim.unitAliases.length === 0 || claim.unitAliases.some((alias) => candidate.text.includes(alias) || candidate.selectorsText.includes(`— ${alias}`) || candidate.selectorsText.includes(`· ${alias}`)) || (/^(건|곳|개|명|기)$/u.test(claim.unit) && /\d\s*(건|곳|개|명|기)/u.test(candidate.text));
    const yearOk = !claim.year || candidate.text.includes(String(claim.year)) || candidate.selectorsText.includes(String(claim.year));
    const periodOk = !claim.period || candidate.text.includes(claim.period) || candidate.selectorsText.includes(claim.period);
    const regionOk = !claim.region || candidate.text.includes(claim.region) || candidate.selectorsText.includes(claim.region);
    if (unitOk && yearOk && periodOk && regionOk) return { where: candidate.where, text: candidate.text.slice(0, 160) };
    if (!partial) partial = { where: candidate.where, text: candidate.text.slice(0, 160), partial: !unitOk ? `number found without the unit "${claim.unit}"` : `number and unit found; ${!yearOk ? `year ${claim.year}` : !periodOk ? `period ${claim.period}` : `region ${claim.region}`} not stated with it` };
  }
  return partial;
}

/** The figure recomputed from the public download file, apart from the card generator. */
function recompute(card) {
  const path = resolve(DATA, `downloads/${card.elementId.toLowerCase()}.json`);
  if (!existsSync(path)) return { status: "no-download-file" };
  const claim = claimOf(card);
  const need = claim.numbers.filter((n) => !n.derived)[0];
  if (!need) return { status: "not-applicable", reason: "no number on the card" };
  const download = parse(readFileSync(path, "utf8"));
  if (!download) return { status: "unreadable" };
  const observations = download.observations || [];
  const entities = download.entities || [];
  const ids = new Set(card.provenance?.headlineIndicatorIds || card.provenance?.indicatorIds || []);
  const scaled = claim.numbers.filter((n) => n.derived && n.factor);
  const finish = (computed, rows, note) => {
    const match = within(need.value, computed / (need.factor || 1), need.decimals) || within(need.value, computed, need.decimals) || scaled.some((alt) => within(alt.shown.raw, computed / alt.factor, alt.shown.decimals));
    return { status: match ? "match" : "mismatch", computed, expected: need.value, expectedScale: need.factor && need.factor !== 1 ? need.factor : scaled[0]?.derived || null, rows, note };
  };
  const attr = (row, key) => row.normalizedAttributes?.[key];
  const isCountryRow = (row) => /^(전국|country)$/iu.test(clean(attr(row, "행정단위")));
  const numberOf = (value) => { if (typeof value === "number") return Number.isFinite(value) ? value : null; const n = Number(String(value ?? "").replace(/,/gu, "")); return String(value ?? "").trim() !== "" && Number.isFinite(n) ? n : null; };
  const basis = card.basis || {};
  const rule = basis.rule || "";

  if (card.elementId === "C-001" && entities.length) {
    const matches = entities.filter((row) => row.indicatorId === "C-001_mitigation_target" && clean(attr(row, "속성1_레코드명")) === "총량 감축률" && Number(attr(row, "속성4_시점")) === 2030 && numberOf(attr(row, "속성3_값")) === 15.8 && clean(attr(row, "속성19_원문URL")) === "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam_NDC_2022_Eng.pdf");
    return matches.length === 1 ? finish(numberOf(attr(matches[0], "속성3_값")), matches.length, "NDC 2022 Table 3, unconditional target") : { status: "mismatch", reason: "reviewed NDC target not uniquely identified" };
  }
  if (["C-019", "C-022"].includes(card.elementId) && entities.length) {
    const rows = entities.filter((row) => /^VN\d+$/u.test(clean(attr(row, "속성22_행정코드P_code"))) && /시설/u.test(row.name || "") && numberOf(attr(row, "속성3_값")) !== null);
    const date = [...new Set(rows.map((row) => clean(attr(row, "속성4_시점"))))].sort().at(-1);
    const selected = rows.filter((row) => clean(attr(row, "속성4_시점")) === date);
    const regionCode = card.selection?.dimensions?.registryRegion;
    const target = regionCode ? selected.filter((row) => clean(attr(row, "속성22_행정코드P_code")) === regionCode) : selected.sort((a, b) => numberOf(attr(b, "속성3_값")) - numberOf(attr(a, "속성3_값"))).slice(0, 1);
    return target.length === 1 ? finish(numberOf(attr(target[0], "속성3_값")), selected.length, `source region ${clean(attr(target[0], "속성20_지역_원문"))}, ${date}`) : { status: "mismatch", reason: "facility region not uniquely identified" };
  }

  // Observation-backed cards: the headline series at the card's year.
  if (["line", "level", "spatial", "bars", "composition"].includes(card.kind) && ids.size && observations.length) {
    let rows = observations.filter((row) => ids.has(row.indicatorId) && typeof row.value === "number");
    if (claim.year) rows = rows.filter((row) => Number(row.year) === Number(claim.year) || String(row.period) === String(claim.year));
    else if (claim.period) rows = rows.filter((row) => String(row.period) === claim.period);
    if (claim.region) rows = rows.filter((row) => clean(row.regionLabel) === clean(claim.region) || Object.values(row).some((v) => typeof v === "string" && clean(v) === clean(claim.region)));
    if (rows.length === 0) return { status: "no-matching-row", indicators: [...ids].slice(0, 4), year: claim.year, region: claim.region };
    if (card.leadCountry) {
      const lead = rows.find((row) => row.countryIso3 === card.leadCountry);
      return lead ? finish(lead.value, rows.length, `the ${card.leadCountry} row`) : { status: "no-matching-row", country: card.leadCountry };
    }
    // A stated total ("네 가스 합계", "63개 성·시 합계") is the sum of the rows.
    if (/합계/u.test(card.headline?.label || "") && !/부분 합계/u.test(card.headline?.label || "") && (card.kind === "composition" || card.kind === "bars" || card.kind === "spatial")) {
      return finish(rows.reduce((sum, row) => sum + row.value, 0), rows.length, "sum of the rows at the card's year");
    }
    if ((card.kind === "spatial" && !claim.region) || (["bars", "composition"].includes(card.kind) && ids.size > 1)) {
      return finish(Math.max(...rows.map((row) => row.value)), rows.length, card.kind === "spatial" ? "max across province rows" : "largest part at the card's year");
    }
    const values = [...new Set(rows.map((row) => row.value))];
    if (values.length === 1) return finish(values[0], rows.length);
    return { status: "ambiguous", candidates: values.slice(0, 5), rows: rows.length, indicators: [...new Set(rows.map((row) => row.indicatorId))].slice(0, 5) };
  }
  const mapVariable = card.selection?.dimensions?.regionMeasure || card.selection?.dimensions?.mapVariable;
  // Home-summarised registers (the home asset states its own rule; recount here).
  if (card.elementId === "A-023" && entities.length) {
    const wri = entities.filter((row) => row.indicatorId === "A-023_power_plant_registry");
    return finish(wri.reduce((sum, row) => sum + (numberOf(attr(row, "mw")) || 0), 0), wri.length, "sum of WRI capacity_mw");
  }
  if (card.elementId === "A-024" && entities.length) {
    const wb = entities.filter((row) => row.indicatorId === "A-024_transmission_line_wb2016");
    return finish(wb.reduce((sum, row) => sum + (numberOf(attr(row, "km")) || 0), 0), wb.length, "sum of 2016 line lengths (km)");
  }
  if (card.elementId === "D-023" && entities.length) {
    const individual = entities.filter((row) => clean(attr(row, "레코드구분")) === "개별");
    return finish(individual.length, entities.length, "rows with 레코드구분=개별");
  }
  if (card.elementId === "C-007" && entities.length) {
    const row = entities.find((entity) => /등재 NMA 건수/u.test(clean(attr(entity, "속성1_레코드명"))));
    const value = numberOf(attr(row, "속성3_값"));
    return value === null ? { status: "no-matching-row", note: "no 등재 NMA 건수 row" } : finish(value, entities.length, "the 참여당사국 등재 NMA 건수 row");
  }
  if (card.elementId === "C-018" && entities.length) {
    const rows = entities.filter((entity) => entity.indicatorId === "C-018_generation_capacity_plan" && Number(attr(entity, "속성4_시점")) === 2050 && !/배출|^총 설비/u.test(clean(attr(entity, "속성1_레코드명"))));
    const byTech = new Map();
    rows.forEach((entity) => { const name = clean(attr(entity, "속성1_레코드명")); const value = numberOf(attr(entity, "속성3_값")); if (value === null) return; const entry = byTech.get(name) || []; entry.push(value); byTech.set(name, entry); });
    const top = [...byTech.entries()].map(([name, values]) => ({ name, min: Math.min(...values), max: Math.max(...values) })).sort((a, b) => b.max - a.max)[0];
    if (!top) return { status: "no-matching-row" };
    const [low, high] = claim.numbers.filter((n) => !n.derived);
    const ok = low && high && within(low.value, top.min, low.decimals) && within(high.value, top.max, high.decimals);
    return { status: ok ? "match" : "mismatch", computed: [top.min, top.max], expected: [low?.value, high?.value], rows: rows.length, note: `2050 capacity bounds of ${top.name}` };
  }
  if (card.elementId === "A-002" && observations.length) {
    const measureKey = card.selection?.dimensions?.wgiMeasure || "est";
    const rows = observations.filter((row) => Number(row.year) === Number(claim.year) && new RegExp(`_${measureKey}$`, "u").test(row.indicatorId) && typeof row.value === "number");
    if (rows.length < 2) return { status: "no-matching-row", year: claim.year };
    const [low, high] = claim.numbers.filter((n) => !n.derived);
    const min = Math.min(...rows.map((row) => row.value));
    const max = Math.max(...rows.map((row) => row.value));
    const ok = low && high && within(low.value, min, low.decimals) && within(high.value, max, high.decimals);
    return { status: ok ? "match" : "mismatch", computed: [min, max], expected: [low?.value, high?.value], rows: rows.length, note: "min and max of the six WGI estimates" };
  }
  // Province × scenario × year layers: the median of the province values the card states.
  if (card.kind === "spatial-trend" && mapVariable && entities.length) {
    const scenario = card.selection?.dimensions?.scenario;
    const rows = entities.filter((row) => !isCountryRow(row) && (!scenario || clean(attr(row, "시나리오")) === scenario) && Number(attr(row, "연도")) === Number(claim.year));
    const values = rows.map((row) => numberOf(attr(row, mapVariable))).filter((v) => v !== null).sort((a, b) => a - b);
    if (!values.length) return { status: "no-matching-row", attribute: mapVariable, year: claim.year, scenario };
    const median = values.length % 2 ? values[(values.length - 1) / 2] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
    return finish(median, values.length, `median of ${values.length} province values (${scenario || "observed"}, ${claim.year})`);
  }
  if (card.elementId === "B-008" && entities.length) {
    const rows = entities.filter((row) => clean(attr(row, "시나리오")) === "SSP2-4.5" && Number(attr(row, "분위수")) === 50 && Number(attr(row, "연도")) === 2100 && clean(attr(row, "신뢰수준")) !== "low");
    const values = rows.map((row) => numberOf(attr(row, "상대해수면_상승_m_2005년_기준"))).filter((v) => v !== null);
    if (!values.length) return { status: "no-matching-row" };
    return finish(Math.max(...values), values.length, "max station value, SSP2-4.5 median, 2100");
  }
  if (card.elementId === "B-025" && entities.length) {
    const values = entities.filter((row) => row.indicatorId === "B-025_river_basin").map((row) => numberOf(attr(row, "베트남_내_면적_km_GIS_산출"))).filter((v) => v !== null);
    if (!values.length) return { status: "no-matching-row" };
    return finish(Math.max(...values), values.length, "largest basin area (km², GIS)");
  }
  // Regional map layers (B-029…B-042): one attribute per province entity, national rows apart.
  if (card.kind === "spatial" && mapVariable && entities.length) {
    const values = entities.filter((row) => !isCountryRow(row)).map((row) => numberOf(attr(row, mapVariable))).filter((v) => v !== null);
    if (!values.length) return { status: "no-matching-row", attribute: mapVariable };
    return finish(Math.max(...values), values.length, `max of ${mapVariable} across province entities`);
  }
  // Register cards: the same row base the detail lists (aggregate/explanatory rows out).
  if (entities.length && (basis.count || /1건 = 원천 1행|1행 = 1구역|문서명이 같은 행/u.test(rule))) {
    // The same row roles the card builder and the detail apply (V142): 집계
    // rows and per-element definitions (D-026's guarantee covers) stay out.
    let rows = entities.filter((row) => recordRoleOf(row).role === "individual" && ![row.name, attr(row, "속성1_레코드명")].some((name) => /^수집현황(?:\s*v[\d.]+)?(?:\s*분류)?$/u.test(clean(name)) || /^raw\s|OCR 재추출|스캔본/u.test(clean(name))));
    if (/레코드구분=개별/u.test(rule)) rows = rows.filter((row) => clean(attr(row, "레코드구분")) === "개별");
    if (/현행 행만/u.test(rule)) rows = rows.filter((row) => Object.values(row.normalizedAttributes || {}).some((v) => clean(v) === "현행"));
    if (/1행 = 1구역/u.test(rule)) {
      const zones = new Set(rows.filter((row) => !isCountryRow(row) && /basin_adm1/u.test(row.indicatorId || "")).map((row) => clean(attr(row, "레코드_키") || row.name)));
      return finish(zones.size, rows.length, "distinct 레코드_키 among basin×province rows");
    }
    if (/문서명이 같은 행/u.test(rule)) {
      const names = new Set(rows.map((row) => clean(attr(row, "속성1_레코드명")) || clean(row.name)).filter((name) => name && !/^[—–-]\s*/u.test(name)));
      return finish(names.size, rows.length, "distinct document names");
    }
    if (basis.count && typeof basis.count === "object" && ("installed" in basis.count || "identities" in basis.count)) {
      const base = basis.count.rows === rows.length;
      return { status: base ? "match" : "mismatch", computed: rows.length, expected: basis.count.rows, note: "row base recomputed; the installed/identity split follows the stated rule and is checked on screen" };
    }
    return finish(rows.length, entities.length, `entity rows${/레코드구분=개별/u.test(rule) ? " with 레코드구분=개별" : ""}${rows.length !== entities.length ? ` (${entities.length - rows.length} excluded as the rule states)` : ""}`);
  }
  return { status: "not-recomputed", reason: card.kind === "composition" ? "parts come from several indicators; verified on screen" : rule || card.kind };
}

function selectionParams(selection) {
  const params = new URLSearchParams();
  if (!selection) return params;
  if (selection.measure) params.set("measure", selection.measure);
  if (selection.sex) params.set("sex", selection.sex);
  if (selection.year !== null && selection.year !== undefined) params.set("year", String(selection.year));
  if (selection.period) params.set("period", selection.period);
  Object.entries(selection.dimensions || {}).forEach(([key, value]) => params.set(`dim.${key}`, value));
  return params;
}

const ROOT = '[data-testid="public-analysis-root"]';
const PRIMARY = '[data-testid="public-analysis-primary"]';

async function waitReady(page) {
  await page.waitForSelector(ROOT, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const state = root?.getAttribute("data-analysis-state");
    return (state === "ready" || state === "empty") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
  }, null, { timeout: 60_000 });
  await page.waitForTimeout(500);
}

/** The screen as the checks see it: chart labels, selected-value tables, selectors. */
async function readScreen(page) {
  return page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    // V153-D1: the small map sits inside the primary section beside the first
    // block; its own selectors (지도 표시 항목·지역·대상) belong to the map, not
    // to the analysis, exactly as before the move.
    const analysisSelects = (root) => [...(root?.querySelectorAll("select") || [])].filter((select) => !select.closest('[data-testid="detail-map-slot-v153"]'));
    // The analysis text without the map slot's own panel (V153-D1).
    const analysisText = (root) => {
      if (!root) return "";
      const slot = root.querySelector('[data-testid="detail-map-slot-v153"]');
      if (!slot) return root.innerText;
      const clone = root.cloneNode(true);
      clone.querySelector('[data-testid="detail-map-slot-v153"]')?.remove();
      clone.style.position = "absolute"; clone.style.left = "-100000px"; clone.style.width = `${root.clientWidth}px`;
      document.body.appendChild(clone);
      const text = clone.innerText;
      clone.remove();
      return text;
    };
    const selects = analysisSelects(primary).map((select) => ({
      label: tidy(select.getAttribute("aria-label") || select.closest("label")?.querySelector("span")?.textContent || [...(select.closest("label")?.childNodes || [])].filter((node) => node.nodeType === 3).map((node) => node.textContent).join(" ")),
      value: tidy(select.selectedOptions[0]?.textContent),
      options: select.options.length,
    }));
    const fixed = [...(primary?.querySelectorAll(".sv125-fixed-value, .psa140__controls label") || [])].map((node) => tidy(node.textContent));
    const selectorsText = [...selects.map((s) => `${s.label} ${s.value}`), ...fixed].join(" | ");
    const analysisNodes = [...(primary?.querySelectorAll('.sv125-contract-panel > header, h3, h4, h5, summary, figcaption, caption') || [])];
    const candidates = analysisNodes.map((node, index) => ({ where: `analysis-${index}:${node.getAttribute("data-testid") || node.tagName}`, text: tidy(node.innerText), selectorsText }));
    [...(primary?.querySelectorAll("strong, b, li, tr, p, dd, td") || [])].forEach((node, index) => {
      const text = tidy(node.innerText);
      if (!text || text.length > 260 || !/\d/u.test(text)) return;
      // The unit of a table cell is in its column header; the unit of a
      // "값" entry is the next entry of the same list.
      const row = node.closest("tr");
      const header = row ? tidy(`${row.closest("table")?.querySelector("caption")?.innerText || ""} ${row.closest("table")?.querySelector("thead")?.innerText || ""} ${row.closest("section, details")?.querySelector("h5, h4")?.innerText || ""}`) : "";
      const block = node.closest("dl, li, article") || node.parentElement;
      const figure = tidy(node.closest("figure")?.querySelector("figcaption")?.innerText || "");
      const around = `${tidy(block?.innerText || "").slice(0, 320)} ${header} ${figure}`.trim();
      candidates.push({ where: `text-${index}:${node.tagName}`, text: around.includes(text) ? around : `${text} ${around}`, selectorsText });
    });
    const heading = tidy(document.querySelector('[data-testid="public-analysis-heading-v134"] h3, .psa140__heading h3, .sv125-section-heading h3')?.textContent);
    return {
      state: document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") || null,
      pending: document.querySelectorAll('[data-testid="public-analysis-pending"]').length,
      headlineTiles: document.querySelectorAll('[data-testid="public-analysis-root"] [class*="kpi"], [data-testid="public-analysis-root"] [data-testid*="kpi"], [data-testid="public-metric-cards"]').length,
      // V153-D1: the small core-figures row under the hero (outside the analysis root):
      // at most four figures, each stating its unit; a status screen shows its status line instead.
      coreFigures: [...document.querySelectorAll('[data-testid="detail-kpi-tile-v153"]')].map((tile) => ({ unit: tile.getAttribute("data-kpi-unit") || "", text: tidy(tile.textContent) })),
      coreStatusLine: Boolean(document.querySelector('[data-testid="detail-kpi-status-v153"]')),
      title: tidy(document.querySelector("h1")?.textContent),
      heading,
      selects,
      selectorsText,
      candidates,
      primaryNumbers: (tidy(analysisText(primary)).match(/-?\d[\d,]*(?:\.\d+)?/gu) || []).slice(0, 400),
      primaryText: tidy(analysisText(primary)),
      url: location.search,
      hasMapButton: [...document.querySelectorAll("button, a")].some((node) => /지도에서 보기/u.test(node.textContent || "")),
    };
  });
}

/**
 * The analysis a data kind needs, and whether the primary shows it:
 *   line/level   a trend or comparison of the same measure with a table of
 *                the drawn rows, the unit stated
 *   composition  every card part named and a total kept apart from the parts
 *   spatial-trend variable, scenario and year selectors; observed/projected named
 *   spatial      region selector and a province distribution or ranking
 *   bars         the compared categories named (at least two card parts)
 *   facts        the register's count stated with a list, table, timeline or
 *                directory; policy registers show a time column
 *   status       the status wording only
 * Recorded for all 152; a missing expectation is a required failure.
 */
/** Words that address the compiler, not the reader, and must not appear on the primary analysis. */
const INTERNAL_WORDING = /원 wide파일|서술 재검증|검토의견|\braw:\s*\S+|[\w-]+\.(?:pdf|xlsx?|csv|md)\b|\[M\d{2}[·\]]|field_[0-9a-f]{6,}|속성\d+_|\battr_\d+|tech_id|레코드구분=/gu;

const COUNT_LIKE_UNIT = /(?:^|\s)수$|^(?:건|곳|개|명|기)$|(?:행|건|곳|개소|명)\)?$/u;
async function analysisFitOf(page, card, screen, claim) {
  if (!card) return { kind: null, pass: null, expected: [], missing: ["no card"] };
  // Home-copied cards keep their parts in the home asset.
  const homeCard = HOME_IDS.has(card.elementId) ? homePreview.cards.find((entry) => entry.elementId === card.elementId) : null;
  const cardParts = (card.preview?.parts || homeCard?.parts || homeCard?.bars || []).map((part) => clean(part.label));
  const dom = await page.evaluate(() => {
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    // Without the small map's own panel (V153-D1): the fit is about the analysis.
    const withoutMap = (() => {
      if (!primary || !primary.querySelector('[data-testid="detail-map-slot-v153"]')) return primary?.innerText;
      const clone = primary.cloneNode(true);
      clone.querySelector('[data-testid="detail-map-slot-v153"]')?.remove();
      clone.style.position = "absolute"; clone.style.left = "-100000px"; clone.style.width = `${primary.clientWidth}px`;
      document.body.appendChild(clone);
      const value = clone.innerText;
      clone.remove();
      return value;
    })();
    const text = tidy(withoutMap);
    return {
      text,
      hasChart: Boolean(primary?.querySelector("svg, canvas, [role='img'], [class*='chart'], [class*='bars'], [class*='stack'], [class*='distribution'], [class*='composition'], .sv125-group-counts")),
      hasTable: Boolean(primary?.querySelector("table")),
      hasChartTable: Boolean(primary?.querySelector('[data-testid="trend-chart-table-v141"], [data-testid*="table"], .psa140__table, table')) || [...(primary?.querySelectorAll("button, summary") || [])].some((node) => /표로 보기/u.test(node.textContent || "")),
      hasList: Boolean(primary?.querySelector("ol, ul, table, article, dl, .sv125-policy-timeline, [data-testid*='directory'], [data-testid*='list'], [data-testid*='grid']")),
      selectLabels: [...(primary?.querySelectorAll("select") || [])].filter((select) => !select.closest('[data-testid="detail-map-slot-v153"]')).map((select) => tidy(select.getAttribute("aria-label") || select.closest("label")?.querySelector("span")?.textContent || [...(select.closest("label")?.childNodes || [])].filter((node) => node.nodeType === 3).map((node) => node.textContent).join(" "))),
      headings: [...(primary?.querySelectorAll("h3, h4, h5") || [])].map((node) => tidy(node.textContent)),
    };
  });
  const expected = [];
  const found = [];
  const missing = [];
  const want = (label, ok) => { expected.push(label); (ok ? found : missing).push(label); };
  const rawUnit = clean(card.measure?.unit || card.preview?.unit || homeCard?.unit || "");
  // A scale description ("추정치(−2.5 약함 ~ +2.5 강함)") is stated by its
  // name; a count noun is verified by the count itself.
  const unit = COUNT_LIKE_UNIT.test(rawUnit) ? "" : rawUnit.includes("(") ? rawUnit.split("(")[0].trim() : rawUnit;
  const kind = card.kind;
  const unitStated = (value) => {
    const aliases = [value, ...(UNIT_ALIASES[value] || []), ...(claim?.unitAliases || [])];
    return aliases.some((alias) => alias && (dom.text.includes(alias) || screen.selectorsText.includes(alias)));
  };
  if (kind === "status") {
    want("status wording", /상태|미제공|수집|준비|없음|확보|공개된 값/u.test(dom.text));
  } else if ((kind === "line" || kind === "level") && COUNT_LIKE_UNIT.test(rawUnit) && dom.hasList) {
    // A count of register rows whose detail lists them (A-029: 19 agreements in a timeline).
    want("register count with its list", dom.hasList);
  } else if (kind === "line" || kind === "level") {
    want("trend or comparison drawn", dom.hasChart || dom.hasTable);
    want("table of the drawn rows", dom.hasChartTable);
    if (unit) want(`unit "${unit}" stated`, unitStated(unit));
    if (kind === "line") want("years shown on the axis or a period selector", dom.selectLabels.some((label) => /연도|기간/u.test(label)) || /(?:19|20|21)\d{2}/u.test(dom.text));
  } else if (kind === "composition") {
    const parts = cardParts;
    const shown = parts.filter((label) => dom.text.includes(label));
    want(`parts named (${shown.length}/${parts.length})`, parts.length > 0 && shown.length === parts.length);
    want("total kept apart from the parts", /합계|총|전체/u.test(dom.text));
    want("composition drawn", dom.hasChart);
  } else if (kind === "spatial-trend") {
    want("variable selector", dom.selectLabels.some((label) => /표시 항목|항목|변수/u.test(label)));
    want("scenario stated", /시나리오|SSP|관측/u.test(dom.text));
    want("years shown on the axis or table", /(?:19|20|21)\d{2}/u.test(dom.text));
    want("observed vs projected named", /과거|관측|전망|모의|historical/u.test(dom.text));
  } else if (kind === "spatial") {
    want("region selector", dom.selectLabels.some((label) => /지역|성·시|권역/u.test(label)));
    want("distribution or ranking of regions", /분포|순위|중앙값|성·시/u.test(dom.text) && (dom.hasChart || dom.hasTable || dom.hasList));
    if (unit) want(`unit "${unit}" stated`, unitStated(unit));
  } else if (kind === "bars" || kind === "signed-bars" || kind === "grouped-bars") {
    const parts = cardParts;
    const shown = parts.filter((label) => dom.text.includes(label));
    want(`compared categories named (${shown.length}/${parts.length})`, parts.length === 0 || shown.length >= Math.min(2, parts.length));
    want("comparison drawn or tabled", dom.hasChart || dom.hasTable || dom.hasList);
    if (unit) want(`unit "${unit}" stated`, unitStated(unit));
  } else if (kind === "map") {
    want("network or facility summary", dom.hasTable || dom.hasList);
  } else {
    // facts: a register
    const count = numbersIn(card.headline?.value || "")[0];
    want("register count stated", !count || dom.text.includes(String(count.raw).replace(/\B(?=(\d{3})+(?!\d))/gu, ",")) || dom.text.includes(String(count.raw)));
    want("list, table, timeline or directory", dom.hasList);
    if (/정책|법|제도|협정|문서/u.test(card.basis?.unit || "") || /policy/u.test(card.basis?.rule || "")) want("time column (시행/확인 시점)", /시점|시행|발효|확인|연도|일자/u.test(dom.text));
  }
  return { kind, expected, found, missing, pass: missing.length === 0, headings: dom.headings.slice(0, 4) };
}

/** Words each of the review's five map cases must state in the selection panel or 자료정보. */
const MAP_SEMANTIC_EXPECTATIONS = {
  "A-023": { pattern: /WRI|OSM|OpenStreetMap|World Resources/u, note: "the source registry of the selected plant" },
  "D-018": { pattern: /참여국|활동|범위|대표/u, note: "region-of-participation vs activity point" },
  "B-021": { pattern: /6\s*개?\s*권역|GDL|권역/u, note: "six GDL regions shown on provinces" },
  "C-019": { pattern: /34|신행정|기존 경계|단위/u, note: "34-unit values mapped onto the older boundaries" },
  "C-022": { pattern: /34|신행정|기존 경계|단위|시설/u, note: "same facility population as C-019" },
};

async function mapSymbolSemanticsOf(page, elementId) {
  const result = { selected: false, panel: null, checks: {}, pass: false };
  try {
    // The keyboard navigation is built once the drawn features can be queried,
    // which on a slow CI runner lands a moment after the layer row reads
    // "drawn" (B-031 missed it 2 of 5 runs on 2026-09-24). Wait for it rather
    // than looking once; what is checked afterwards is unchanged.
    const button = await page
      .waitForSelector('[data-testid="map-keyboard-feature-select"]', { state: "attached", timeout: 15_000 })
      .catch(() => null);
    if (!button) { result.reason = "no keyboard feature to select"; return result; }
    await button.click();
    await page.waitForSelector('[data-testid="map-selected-feature-panel"]', { timeout: 15_000 });
    await page.waitForTimeout(400);
    const panel = await page.evaluate(() => {
      const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
      const node = document.querySelector('[data-testid="map-selected-feature-panel"]');
      const rows = [...(node?.querySelectorAll(".cdp-evidence-row") || [])].map((row) => `${tidy(row.querySelector("span")?.textContent)}: ${tidy(row.querySelector("strong")?.textContent)}`);
      const info = tidy(document.querySelector(".cdp-map-layer-info, [data-testid='map-layer-info']")?.innerText || "");
      const coverage = tidy([...document.querySelectorAll("dt")].find((dt) => /지도 표시 범위|공간 단위|표시 단위/u.test(dt.textContent || ""))?.nextElementSibling?.textContent || "");
      return { elementId: node?.getAttribute("data-selected-element-id") || "", title: tidy(node?.querySelector("h3")?.textContent), rows, text: tidy(node?.innerText), info, coverage, body: tidy(document.body.innerText).slice(0, 20000) };
    });
    result.selected = panel.elementId === elementId;
    result.panel = { title: panel.title, rows: panel.rows.slice(0, 12), coverage: panel.coverage };
    const text = `${panel.text} ${panel.coverage}`;
    result.checks = {
      ownLayer: panel.elementId === elementId,
      valueOrFact: panel.rows.length > 0 && panel.rows.some((row) => /\d/u.test(row) || /:\s*\S/u.test(row)),
      unitOrMeasure: /단위|MW|km|ha|%|°C|mm|명|건|곳|개|USD|VND|지수|점|위|tCO|t\b|m³|kWh|GWh|kV/u.test(text),
      time: /기준연도|자료연도|연도|시점|기간|\b(?:19|20|21)\d{2}\b/u.test(text),
      source: /출처|제공기관|원천|자료 제공|WRI|OSM|World Bank|FAO|GFW|UNFCCC|Global|Atlas|EM-DAT|OECD|GADM|IRENA|PSMSL|MONRE|EVN|USGS|ESA|UMD|Aqueduct|GDL|IPCC|CCKP/u.test(text) || /출처|제공기관/u.test(panel.body),
      spatialMeaning: Boolean(panel.coverage) || /좌표|대표점|경계|성·시|권역|유역|지점|시설|위치|범위/u.test(text),
    };
    const expectation = MAP_SEMANTIC_EXPECTATIONS[elementId];
    if (expectation) result.checks.reviewCase = expectation.pattern.test(`${text} ${panel.body}`);
    result.pass = Object.values(result.checks).every(Boolean);
    result.missing = Object.entries(result.checks).filter(([, ok]) => !ok).map(([key]) => key);
  } catch (error) {
    result.reason = String(error?.message || error).split("\n")[0].slice(0, 120);
  }
  return result;
}

async function openTablesAndRead(page) {
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((details) => { details.open = true; });
    [...document.querySelectorAll("button")].filter((button) => /표로 보기/u.test(button.textContent || "")).forEach((button) => button.click());
  });
  await page.waitForTimeout(500);
  const tables = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    return [...document.querySelectorAll("table")].map((table) => ({
      caption: tidy(table.caption?.textContent) || tidy(table.closest("section, details")?.querySelector("h3, h4, h5, summary")?.textContent),
      header: tidy(table.querySelector("thead")?.innerText || ""),
      inPrimary: Boolean(table.closest('[data-testid="public-analysis-primary"]')),
      cells: [...table.querySelectorAll("td, th")].map((cell) => tidy(cell.textContent)).filter(Boolean),
      rows: [...table.querySelectorAll("tbody tr")].slice(0, 400).map((row) => [...row.querySelectorAll("th, td")].map((cell) => tidy(cell.textContent))),
      rowCount: table.querySelectorAll("tbody tr").length,
    }));
  });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].filter((button) => /차트로 보기/u.test(button.textContent || "")).forEach((button) => button.click());
  });
  return tables;
}

/**
 * The card's figure in a table row, identified by its keys — not by a number
 * that happens to be near. A row states the figure when the row (with its
 * table's caption and header) carries the number, the unit, the card's year
 * or period, its region, and the series/measure label. Register cards are
 * counted by rows. Derived figures (a sum, a median, a maximum over rows) are
 * expected in a derived-row table; when none exists the case is named, not
 * passed.
 */
function classifyTables(claim, tables, kind, card) {
  if (kind === "status") return { status: "not-applicable", reason: "status screen, no values" };
  const need = claim.numbers.filter((n) => !n.derived)[0];
  if (!need) return { status: "not-applicable", reason: "no number on the card" };
  if (!tables.length) return { status: "no-table", reason: "the screen has no table" };
  const isRowCount = /^(건|곳|개|명|기)$/u.test(claim.unit) && (card?.basis?.count || /1건 = 원천 1행|1행 = 1구역|문서명이 같은 행/u.test(card?.basis?.rule || ""));
  if (isRowCount) {
    const counted = tables.map((table) => ({ table, stated: numbersIn(table.caption || "").map((n) => n.raw), rows: table.rowCount }));
    const hit = counted.find((entry) => entry.stated.includes(need.value) || entry.rows === need.value);
    if (hit) return { status: "match", table: hit.table.caption || "(무제 표)", cell: `row count ${need.value}`, key: "row-count" };
    return { status: "row-count-differs", reason: `no table states or holds ${need.value} rows (${counted.map((entry) => `${entry.rows} rows`).join(", ")})`, note: "the detail groups rows (documents, organisations, zones); the count is verified on screen" };
  }
  const labels = [card?.measure?.label, (card?.headline?.label || "").split(" · ")[0].replace(/\s*(?:최대|최소|합계|중앙값)$/u, ""), ...(card?.preview?.seriesLabel ? [card.preview.seriesLabel] : [])].map((v) => clean(v || "")).filter((v) => v && !/^\d/u.test(v));
  const headlineLabel = clean(card?.headline?.label || "");
  const tokensOf = (label) => label.split(/[\s·()（）,]+/u).filter((token) => token.length >= 2 && !/^\d/u.test(token));
  const labelStated = (row, both) => {
    if (labels.length === 0) return true;
    if (labels.some((label) => both.includes(label))) return true;
    if (labels.some((label) => { const tokens = tokensOf(label); return tokens.length > 0 && tokens.filter((token) => both.includes(token)).length >= Math.min(2, tokens.length); })) return true;
    // The card's own label names the row's subject ("… · 전체 직군 · …").
    return row.some((cell) => cell && !/^[\d.,\s%-]+$/u.test(cell) && cell.length >= 2 && headlineLabel.includes(cell));
  };
  const alternatives = claim.numbers.filter((n) => n.derived);
  const numberInRow = (row) => row.some((cell) => numbersIn(cell).some((n) => numberMatches(need, n) || alternatives.some((alt) => derivedMatches(alt, n))));
  const keyCheck = (table, row) => {
    const rowText = row.join(" | ");
    const context = `${table.caption} ${table.header}`;
    const both = `${rowText} ${context}`;
    return {
      unit: claim.unitAliases.length === 0 || claim.unitAliases.some((alias) => both.includes(alias)),
      year: !claim.year || rowText.includes(String(claim.year)) || context.includes(String(claim.year)),
      period: !claim.period || both.includes(claim.period),
      region: !claim.region || rowText.includes(claim.region) || context.includes(claim.region),
      label: labelStated(row, both),
    };
  };
  let valueOnly = null;
  for (const table of tables) {
    for (const row of table.rows) {
      if (!numberInRow(row)) continue;
      const keys = keyCheck(table, row);
      const missing = Object.entries(keys).filter(([, ok]) => !ok).map(([key]) => key);
      if (!missing.length) return { status: "match", table: table.caption || "(무제 표)", cell: row.join(" | ").slice(0, 160), key: "indicator+region+time+unit" };
      if (!valueOnly) valueOnly = { table: table.caption || "(무제 표)", cell: row.join(" | ").slice(0, 160), missing };
    }
  }
  const derived = /합계|중앙값|최대|최소|중복 제거|범위|하한~상한/u.test(card?.basis?.rule || "") || ["spatial", "spatial-trend", "composition"].includes(kind) || /최대|합계|중앙값/u.test(card?.headline?.label || "");
  if (valueOnly) return { status: "value-without-keys", reason: `a row holds the number but not its keys (${valueOnly.missing.join(", ")} missing): ${valueOnly.cell}`, table: valueOnly.table };
  if (derived) return { status: "no-derived-row", reason: "the card's figure is derived (sum/median/max/range) and no table states the derived row; the figure is checked on screen and recomputed from the download" };
  return { status: "no-matching-row", reason: "no table row states the figure with its keys" };
}

async function checkElement(context, item) {
  const elementId = item.elementId;
  const card = summaries.find((entry) => entry.elementId === elementId) || null;
  const record = {
    elementId,
    title: item.elementLabel,
    kind: card?.kind || null,
    cardClicked: null,
    homeCardClicked: null,
    selectionUrlPreserved: null,
    screenLoaded: false,
    cardValueVerified: null,
    recomputed: null,
    detailAnalysisFit: null,
    analysisFit: null,
    controlsVerified: null,
    tableValuesVerified: null,
    mapHandoffVerified: null,
    mapSymbolVerified: null,
    remainingIssue: [],
    notApplicable: [],
    evidence: {},
  };
  const consoleErrors = [];
  const assetFailures = [];
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200)); });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${String(error?.message || error).slice(0, 200)}`));
  page.on("response", (response) => {
    const url = response.url();
    if (!/\/static\/(?:js|css)\/|\/data\/|\.(?:json|geojson)(?:\?|$)/u.test(url)) return;
    if (response.status() >= 400) assetFailures.push({ url: url.slice(-90), status: response.status() });
    else if (/\.(?:json|geojson)(?:\?|$)/u.test(url) && (response.headers()["content-type"] || "").includes("text/html")) assetFailures.push({ url: url.slice(-90), status: "html-for-json" });
  });
  let claim = card ? claimOf(card) : null;
  const detailUrl = () => {
    const params = selectionParams(card?.selection);
    params.set("view", "data");
    params.set("country", "VNM");
    params.set("element", elementId);
    return `${base}/?${params.toString()}#element-detail`;
  };
  try {
    // ---- 1. the real card click, from the finder
    await page.goto(`${base}/#explorer`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector('[data-testid="finder-results-v136"]', { timeout: 60_000 });
    const searchTerm = (card?.title || item.elementLabel).replace(/\[.*$/u, "").split(/[:;]/u)[0].trim().slice(0, 40);
    await page.fill(".cdp-input", searchTerm);
    const cardSelector = `[data-testid="public-finder-card-v135"][data-element-id="${elementId}"]`;
    const cardFound = await page.waitForSelector(cardSelector, { timeout: 30_000 }).then(() => true).catch(() => false);
    if (cardFound) {
      await page.waitForSelector(`${cardSelector} ${STATUS_IDS_V159.has(elementId) ? '[data-testid="finder-card-status-v159"]' : '[data-testid="finder-card-summary-v140"]'}`, { timeout: 20_000 }).catch(() => null);
      const finderHeadline = clean(await page.$eval(`${cardSelector} [data-testid="finder-card-headline-v140"] strong`, (node) => node.textContent).catch(() => ""));
      record.evidence.finderHeadline = finderHeadline;
      record.evidence.finderStatusBadge = clean(await page.$eval(`${cardSelector} [data-testid="finder-card-status-v159"]`, (node) => node.textContent).catch(() => ""));
      if (card) claim = claimOf(card, finderHeadline);
      await page.click(`${cardSelector} [data-testid="finder-card-open-v140"]`);
      await waitReady(page);
      record.cardClicked = page.url().includes("element-detail");
      // Same numbers and scale words; the unit may be reworded for readers.
      // The headline figure itself; the unit after it may be reworded for readers ("십억 USD_2017/yr" → "…10억 미국달러/년").
      const sameNumbers = numbersIn(finderHeadline)[0]?.raw === numbersIn(card?.headline?.value || "")[0]?.raw;
      if (card && card.kind !== "status" && !sameNumbers) record.remainingIssue.push(`finder card shows "${finderHeadline}" but the asset says "${card.headline?.value}"`);
    } else {
      record.cardClicked = false;
      record.remainingIssue.push(`finder card not found by searching "${searchTerm}"`);
      await page.goto(detailUrl(), { waitUntil: "networkidle", timeout: 90_000 });
      await waitReady(page);
    }
    if (HOME_IDS.has(elementId)) {
      const home = await context.newPage();
      try {
        await home.goto(`${base}/`, { waitUntil: "networkidle", timeout: 90_000 });
        await home.waitForSelector(`.home-featured-v139__card[data-element-id="${elementId}"] [data-testid="home-card-open-v140"]`, { timeout: 60_000 });
        await home.click(`.home-featured-v139__card[data-element-id="${elementId}"] [data-testid="home-card-open-v140"]`);
        await waitReady(home);
        const homeParams = new URLSearchParams(new URL(home.url()).search);
        record.homeCardClicked = home.url().includes("element-detail") && (!card?.selection?.measure || homeParams.get("measure") === card.selection.measure);
      } catch (error) {
        record.homeCardClicked = false;
        record.remainingIssue.push(`home card click: ${String(error.message).split("\n")[0].slice(0, 120)}`);
      } finally {
        await home.close();
      }
    }

    // ---- 2. URL preserved, screen read
    const screen = await readScreen(page);
    record.evidence.title = screen.title;
    record.evidence.heading = screen.heading;
    record.evidence.selectors = screen.selects.map((s) => `${s.label}=${s.value}`);
    record.evidence.url = decodeURIComponent(screen.url).slice(0, 240);
    if (card?.selection) {
      const want = card.selection;
      const got = new URLSearchParams(screen.url);
      const mismatches = [];
      if (want.measure && got.get("measure") !== want.measure) mismatches.push(`measure=${got.get("measure")}`);
      if (want.year !== null && want.year !== undefined && got.get("year") !== String(want.year)) mismatches.push(`year=${got.get("year")}`);
      if (want.period && got.get("period") !== want.period) mismatches.push(`period=${got.get("period")}`);
      Object.entries(want.dimensions || {}).forEach(([key, value]) => { if (got.get(`dim.${key}`) !== value) mismatches.push(`dim.${key}=${got.get(`dim.${key}`)}`); });
      const hasSelection = Boolean(want.measure || want.year !== null || want.period || Object.keys(want.dimensions || {}).length);
      record.selectionUrlPreserved = hasSelection ? mismatches.length === 0 : null;
      if (!hasSelection) record.notApplicable.push("selectionUrlPreserved: card carries no selection");
      if (mismatches.length) record.remainingIssue.push(`selection lost in URL: ${mismatches.join(", ")}`);
    }

    // ---- 3. the card's figure, as the same thing
    if (!card || card.kind === "status") {
      record.cardValueVerified = card ? /제공하지 않|입력 예정|입력 양식|미수집|아직/u.test(`${screen.primaryText} ${screen.title}`) : null;
      record.notApplicable.push("cardValueVerified: status screen (checked for the status wording only)");
      record.recomputed = { status: "not-applicable" };
    } else if (!claim.numbers.length) {
      record.cardValueVerified = null;
      record.notApplicable.push(`cardValueVerified: card headline "${card.headline.value}" has no number`);
      record.recomputed = { status: "not-applicable" };
    } else {
      const found = findClaimOnScreen(claim, screen.candidates);
      if (found && !found.partial) {
        record.cardValueVerified = true;
        record.evidence.cardValue = `${card.headline.value} = ${found.where}: ${found.text}`;
      } else if (found?.partial) {
        record.cardValueVerified = false;
        record.evidence.cardValue = `${found.where}: ${found.text}`;
        record.remainingIssue.push(`card value ${card.headline.value}: ${found.partial}`);
      } else {
        record.cardValueVerified = false;
        record.remainingIssue.push(`card value ${card.headline.value} (${claim.unit}${claim.year ? `, ${claim.year}` : ""}${claim.region ? `, ${claim.region}` : ""}) not stated as such on the detail`);
      }
      if (card.kind === "composition" && claim.parts.length) {
        const missing = claim.parts.filter((part) => { const shown = displayedNumber(part.value); return !numbersIn(screen.primaryText).some((n) => within(shown.value, n.scaled / shown.factor, shown.decimals) || within(shown.value, n.raw, shown.decimals)); });
        if (missing.length) {
          record.cardValueVerified = false;
          record.remainingIssue.push(`composition parts not on detail: ${missing.map((p) => `${p.label} ${p.value}`).join(", ")}`);
        }
        record.evidence.compositionParts = `${claim.parts.length - missing.length}/${claim.parts.length} parts found`;
      }
      record.recomputed = recompute(card);
      if (record.recomputed.status === "mismatch") record.remainingIssue.push(`recomputed from the download file: ${JSON.stringify(record.recomputed.computed)} vs card ${JSON.stringify(record.recomputed.expected)}`);
    }

    // ---- 4. selection fit on the screen (what the reader sees)
    if (card?.selection && (card.selection.measure || card.selection.year !== null || card.selection.period || Object.keys(card.selection.dimensions || {}).length)) {
      const problems = [];
      const shown = `${screen.selectorsText} ${screen.heading} ${screen.candidates.slice(0, 8).map((c) => c.text).join(" ")}`;
      if (card.selection.year !== null && card.selection.year !== undefined && !shown.includes(String(card.selection.year))) problems.push(`year ${card.selection.year} not shown`);
      if (card.selection.period && !shown.includes(card.selection.period)) problems.push(`period ${card.selection.period} not shown`);
      Object.entries(card.selection.dimensions || {}).forEach(([key, value]) => {
        // Internal keys (a map column, a scenario code) are stated on the
        // screen by their label, checked through the measure below.
        if (["mapVariable", "regionMeasure", "variable", "scenario", "wgiMeasure", "budgetBasis"].includes(key)) return;
        if (!/^[a-z0-9_-]+$/iu.test(value) && !shown.includes(value)) problems.push(`selection "${value}" not shown`);
      });
      if (card.measure?.label && card.selection.measure && !shown.includes(card.measure.label.split(/\s*[(·]/u)[0])) problems.push(`measure "${card.measure.label}" not named`);
      record.detailAnalysisFit = problems.length === 0;
      record.evidence.fit = problems.length ? problems.join("; ") : "selectors, heading and KPI state the selection";
      if (problems.length) record.remainingIssue.push(`detail does not show the card's selection: ${problems.join("; ")}`);
    } else {
      record.detailAnalysisFit = null;
      record.notApplicable.push("detailAnalysisFit: card carries no selection");
    }

    // ---- 4a. no compiler wording on the public screen (file names, review memos, raw keys)
    const internal = (screen.primaryText.match(INTERNAL_WORDING) || []).slice(0, 5);
    record.internalWording = internal.length ? internal : null;
    if (internal.length) record.remainingIssue.push(`internal wording on screen: ${internal.join(", ")}`);

    // ---- 4b. does the primary analysis fit the data kind? (every element)
    record.analysisFit = await analysisFitOf(page, card, screen, claim);
    record.evidence.analysisFit = record.analysisFit;

    // ---- 4c. ⓪ status elements: the notice, no chart, a status badge on the card
    if (STATUS_IDS_V159.has(elementId)) {
      const notice = await page.evaluate(() => {
        const primary = document.querySelector('[data-testid="public-analysis-primary"]');
        const notes = primary ? primary.querySelectorAll('[data-testid="status-note-v159"]') : [];
        const rows = notes.length === 1
          ? Array.from(notes[0].querySelectorAll("dt")).map((dt) => ({ label: (dt.textContent || "").trim(), value: (dt.nextElementSibling?.textContent || "").trim() }))
          : [];
        return { count: notes.length, rows, charts: primary ? primary.querySelectorAll("svg").length : -1 };
      });
      const shown = (label) => notice.rows.some((row) => row.label === label && row.value);
      record.statusChecks = {
        statusNoticePresent: notice.count === 1 && ["결정", "사유", "결정일"].every(shown),
        chartCount0: notice.charts === 0,
        cardShowsStatus: Boolean(record.evidence.finderStatusBadge) && !record.evidence.finderHeadline,
      };
      record.evidence.statusNotice = notice;
      record.cardValueVerified = null;
      record.detailAnalysisFit = null;
      record.analysisFit = { pass: null, kind: "status-v159", reason: "⓪ status element: judged by statusNoticePresent · chartCount0 · cardShowsStatus" };
      record.notApplicable.push("cardValueVerified · detailAnalysisFit · analysisFit: ⓪ status element (V159)");
      Object.entries(record.statusChecks).forEach(([key, ok]) => { if (!ok) record.remainingIssue.push(`${key} failed`); });
    }

    // ---- 5. tables
    const tables = await openTablesAndRead(page);
    const tableResult = claim ? classifyTables(claim, tables, card.kind, card) : { status: "not-applicable", reason: "no card" };
    record.tableValuesVerified = tableResult.status === "match" ? true : tableResult.status === "not-applicable" ? null : false;
    record.evidence.table = tableResult;
    if (tableResult.status === "not-applicable") record.notApplicable.push(`tableValuesVerified: ${tableResult.reason}`);

    // ---- 6. controls, each from a fresh page, by label, with a real selection
    const controls = screen.selects.filter((s) => s.options > 1);
    if (controls.length) {
      const results = [];
      for (const control of controls) {
        await page.goto(detailUrl(), { waitUntil: "networkidle", timeout: 90_000 });
        await waitReady(page);
        const before = await readScreen(page);
        const target = before.selects.find((s) => s.label === control.label);
        if (!target) { results.push({ control: control.label, tested: false, reason: "not present after reload" }); continue; }
        const chosen = await page.evaluate((labelText) => {
          const primary = document.querySelector('[data-testid="public-analysis-primary"]');
          const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
          primary.querySelectorAll("select[data-qa-target]").forEach((node) => node.removeAttribute("data-qa-target"));
          // Same label derivation as readScreen: aria-label, then the label's
          // span, then the label's own text nodes.
          const labelOf = (s) => tidy(s.getAttribute("aria-label") || s.closest("label")?.querySelector("span")?.textContent || [...(s.closest("label")?.childNodes || [])].filter((node) => node.nodeType === 3).map((node) => node.textContent).join(" "));
          const select = [...primary.querySelectorAll("select")].filter((s) => !s.closest('[data-testid="detail-map-slot-v153"]')).find((s) => labelOf(s) === labelText);
          if (!select) return null;
          const next = [...select.options].find((option, i) => i !== select.selectedIndex && option.value !== "");
          if (!next) return null;
          select.setAttribute("data-qa-target", "1");
          return next.value;
        }, control.label);
        if (chosen === null) { results.push({ control: control.label, tested: false, reason: "no alternative option" }); continue; }
        await page.selectOption(`${PRIMARY} select[data-qa-target="1"]`, chosen);
        await page.waitForTimeout(800);
        const after = await readScreen(page);
        const numbersChanged = before.primaryNumbers.join(",") !== after.primaryNumbers.join(",");
        const subjectChanged = after.candidates.slice(0, 6).map((c) => c.text).join(" ") !== before.candidates.slice(0, 6).map((c) => c.text).join(" ") || after.heading !== before.heading;
        results.push({ control: control.label, from: target.value.slice(0, 40), to: clean(after.selects.find((s) => s.label === control.label)?.value).slice(0, 40), changed: numbersChanged || subjectChanged, numbersChanged, subjectChanged });
      }
      const tested = results.filter((r) => r.tested !== false);
      record.controlsVerified = tested.length > 0 && tested.every((r) => r.changed);
      record.evidence.controls = results;
      const dead = tested.filter((r) => !r.changed);
      if (dead.length) record.remainingIssue.push(`control without effect on the primary analysis: ${dead.map((r) => `${r.control} (${r.from} → ${r.to})`).join(", ")}`);
    } else {
      record.controlsVerified = null;
      record.notApplicable.push("controlsVerified: no selectable control in the primary analysis");
    }

    // ---- 7. map hand-off, from the detail's button
    if (mapConnected.has(elementId)) {
      await page.goto(detailUrl(), { waitUntil: "networkidle", timeout: 90_000 });
      await waitReady(page);
      const clicked = await page.evaluate(() => {
        const button = [...document.querySelectorAll("button")].find((node) => /지도에서 보기/u.test(node.textContent || "") && !node.disabled);
        if (!button) return false;
        button.click();
        return true;
      });
      if (!clicked) {
        record.mapHandoffVerified = false;
        record.remainingIssue.push("no enabled 지도에서 보기 button on a map dataset");
      } else {
        const drawn = await page.waitForFunction((id) => {
          const row = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
          return row?.getAttribute("data-map-drawn") === "true" && row?.getAttribute("data-map-layer-role") === "primary";
        }, elementId, { timeout: 60_000 }).then(() => true).catch(() => false);
        // The map page re-initialises once after mounting (the row flips to
        // inactive for a frame), so the state counts only when it holds for
        // three consecutive reads.
        const readRow = () => page.evaluate((id) => {
          const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
          const row = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
          return { title: tidy(row?.querySelector("label strong")?.textContent), role: row?.getAttribute("data-map-layer-role"), checked: Boolean(row?.querySelector("input")?.checked), drawn: row?.getAttribute("data-map-drawn") === "true" };
        }, elementId);
        let named = null;
        let stable = 0;
        for (let i = 0; drawn && i < 25 && stable < 3; i++) {
          await page.waitForTimeout(400);
          named = await readRow();
          stable = named.drawn && named.checked && named.role === "primary" ? stable + 1 : 0;
        }
        record.mapHandoffVerified = drawn && stable >= 3;
        // The representative symbol: select it through the keyboard navigation
        // and read what the panel says it is (value·unit, time, source, space).
        if (record.mapHandoffVerified) record.mapSymbolVerified = await mapSymbolSemanticsOf(page, elementId);
        record.evidence.map = drawn ? `layer drawn as ${named?.role} (${named?.title})` : "layer not drawn within 60s";
        if (!record.mapHandoffVerified) record.remainingIssue.push(`map hand-off: ${record.evidence.map}`);
      }
    } else {
      record.mapHandoffVerified = null;
      record.notApplicable.push(screen.hasMapButton ? "mapHandoffVerified: NOT a map dataset but a map button is shown" : "mapHandoffVerified: not a map dataset");
      if (screen.hasMapButton) record.remainingIssue.push("map button on a dataset without a map layer");
    }

    // ---- 8. the whole session's runtime health
    record.screenLoaded = (screen.state === "ready" || screen.state === "empty") && screen.pending === 0 && consoleErrors.length === 0 && assetFailures.length === 0;
    // V153-D1 expectation change (reports/v153/ANALYSIS_QA_EXPECTATION_CHANGE_V153.md):
    // the V147 ban on large headline tiles inside the analysis stays; the small
    // core-figures row under the hero is required instead - 3-4 figures with a
    // unit each, or the status line on a status screen.
    const coreFiguresOk = screen.coreStatusLine
      ? screen.coreFigures.length === 0
      : screen.coreFigures.length >= 3 && screen.coreFigures.length <= 4 && screen.coreFigures.every((tile) => tile.unit && tile.text.length > tile.unit.length);
    record.detailTilesAbsent = screen.headlineTiles === 0;
    record.detailTilesBounded = record.detailTilesAbsent && coreFiguresOk;
    if (!record.detailTilesAbsent) record.remainingIssue.push(`detail headline tiles must not return: ${screen.headlineTiles}`);
    if (!coreFiguresOk) record.remainingIssue.push(`core figures row: ${screen.coreFigures.length} tile(s)${screen.coreStatusLine ? " with a status line" : ""} - expected 3-4 with units (0 on a status screen)`);
    if (consoleErrors.length) record.remainingIssue.push(`console: ${consoleErrors[0]}`);
    if (assetFailures.length) record.remainingIssue.push(`asset: ${JSON.stringify(assetFailures[0])}`);
  } catch (error) {
    record.remainingIssue.push(`runtime: ${(error instanceof Error ? error.message : String(error)).split("\n")[0].slice(0, 160)}`);
  } finally {
    await page.close().catch(() => null);
  }
  return record;
}

// ---------------------------------------------------------------- run
const targets = catalog.filter((item) => !only || only.includes(item.elementId)).sort((a, b) => a.elementId.localeCompare(b.elementId));
const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.max(1, workers) }, async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: bypassHeaders });
    while (queue.length) {
      const item = queue.shift();
      const record = await checkElement(context, item);
      results.push(record);
      process.stdout.write(`${record.elementId} ${record.screenLoaded ? "ok" : "FAIL"} click=${record.cardClicked} url=${record.selectionUrlPreserved} value=${record.cardValueVerified} recomp=${record.recomputed?.status} fit=${record.detailAnalysisFit} afit=${record.analysisFit?.pass} ctrl=${record.controlsVerified} table=${record.evidence.table?.status} map=${record.mapHandoffVerified} sym=${record.mapSymbolVerified ? record.mapSymbolVerified.pass : null}${record.remainingIssue.length ? ` | ${record.remainingIssue.join("; ").slice(0, 140)}` : ""}${record.analysisFit?.missing?.length ? ` | afit missing: ${record.analysisFit.missing.join(", ")}` : ""}${record.mapSymbolVerified && record.mapSymbolVerified.pass === false ? ` | map symbol: ${(record.mapSymbolVerified.missing || [record.mapSymbolVerified.reason]).join(", ")}` : ""}\n`);
    }
    await context.close();
  })
);
await browser.close();
if (server) await server.close();

results.sort((a, b) => a.elementId.localeCompare(b.elementId));
const tally = (key) => ({ pass: results.filter((r) => r[key] === true).length, fail: results.filter((r) => r[key] === false).length, notApplicable: results.filter((r) => r[key] === null).length });
const countBy = (pick) => results.reduce((acc, r) => { const key = pick(r) || "none"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
const requiredFailures = results.filter((r) => !r.screenLoaded || r.detailTilesBounded === false || r.cardClicked === false || r.homeCardClicked === false || r.selectionUrlPreserved === false || r.cardValueVerified === false || r.detailAnalysisFit === false || r.analysisFit?.pass === false || r.controlsVerified === false || r.mapHandoffVerified === false || (r.mapSymbolVerified && r.mapSymbolVerified.pass === false) || r.recomputed?.status === "mismatch" || r.evidence.table?.status === "value-without-keys" || Boolean(r.internalWording) || Boolean(r.statusChecks && Object.values(r.statusChecks).some((ok) => ok === false)));
const summary = {
  label,
  base,
  generatedAt: new Date().toISOString(),
  version,
  elements: results.length,
  valueBearing: results.filter((r) => r.kind && r.kind !== "status").length,
  statusOnly: results.filter((r) => r.kind === "status").length,
  cardClicked: tally("cardClicked"),
  homeCardClicked: tally("homeCardClicked"),
  selectionUrlPreserved: tally("selectionUrlPreserved"),
  screenLoaded: tally("screenLoaded"),
  detailTilesAbsent: tally("detailTilesAbsent"),
  detailTilesBounded: tally("detailTilesBounded"),
  cardValueVerified: tally("cardValueVerified"),
  recomputed: countBy((r) => r.recomputed?.status),
  detailAnalysisFit: tally("detailAnalysisFit"),
  analysisFit: { pass: results.filter((r) => r.analysisFit?.pass === true).length, fail: results.filter((r) => r.analysisFit?.pass === false).length, notApplicable: results.filter((r) => !r.analysisFit || r.analysisFit.pass === null).length, byKind: countBy((r) => `${r.analysisFit?.kind}:${r.analysisFit?.pass}`) },
  internalWording: results.filter((r) => r.internalWording).map((r) => r.elementId),
  mapSymbolVerified: { pass: results.filter((r) => r.mapSymbolVerified?.pass === true).length, fail: results.filter((r) => r.mapSymbolVerified && r.mapSymbolVerified.pass === false).length, notApplicable: results.filter((r) => !r.mapSymbolVerified).length },
  controlsVerified: tally("controlsVerified"),
  controlsTried: results.reduce((sum, r) => sum + (Array.isArray(r.evidence.controls) ? r.evidence.controls.filter((c) => c.tested !== false).length : 0), 0),
  tableValuesVerified: tally("tableValuesVerified"),
  tableClassification: countBy((r) => r.evidence.table?.status),
  mapHandoffVerified: tally("mapHandoffVerified"),
  withRemainingIssues: results.filter((r) => r.remainingIssue.length).length,
  requiredFailures: requiredFailures.length,
  requiredFailureIds: requiredFailures.map((r) => r.elementId),
};
writeFileSync(resolve(OUT, `analysis-qa-v140-${label}.json`), `${JSON.stringify({ summary, results }, null, 2)}\n`);
const mark = (value) => (value === true ? "✓" : value === false ? "✗" : "–");
const md = [
  `# 카드 → 상세 분석 QA (V140) · ${label}`,
  "",
  `실행 ${summary.generatedAt} · ${base} · ${summary.elements}개(값 보유 ${summary.valueBearing} · 상태 안내 ${summary.statusOnly}) · 배포 버전 일치 ${version.match ? "예" : "아니오"}`,
  "",
  "| 항목 | 통과 | 실패 | 해당 없음 |",
  "| --- | ---: | ---: | ---: |",
  ...["cardClicked", "homeCardClicked", "selectionUrlPreserved", "screenLoaded", "cardValueVerified", "detailAnalysisFit", "analysisFit", "controlsVerified", "tableValuesVerified", "mapHandoffVerified", "mapSymbolVerified"].map((key) => `| ${key} | ${summary[key].pass} | ${summary[key].fail} | ${summary[key].notApplicable} |`),
  "",
  "detailAnalysisFit = 넘긴 선택(측정항목·연도·차원)이 선택기·제목·KPI에 있는지 · analysisFit = 자료 유형에 맞는 주 분석(추세/비교/구성/분포/등록부 목록과 표·단위·시점)이 있는지(152개 전부) · mapSymbolVerified = 지도 대표 기호 선택 후 값·단위·시점·출처·공간 의미가 패널에 있는지(42개)",
  "",
  `독립 재계산(다운로드 파일): ${JSON.stringify(summary.recomputed)} · 컨트롤 시도 ${summary.controlsTried}회 · 표 분류(키: 지표+지역+연도/기간+단위) ${JSON.stringify(summary.tableClassification)} · 필수 실패 ${summary.requiredFailures}건`,
  "",
  "| 요소 | 종류 | click | url | loaded | value | recomp | fit | afit | controls | table | map | symbol | 잔여 문제 / 해당 없음 사유 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...results.map((r) => `| ${r.elementId} | ${r.kind || ""} | ${mark(r.cardClicked)} | ${mark(r.selectionUrlPreserved)} | ${mark(r.screenLoaded)} | ${mark(r.cardValueVerified)} | ${r.recomputed?.status || ""} | ${mark(r.detailAnalysisFit)} | ${mark(r.analysisFit?.pass ?? null)} | ${mark(r.controlsVerified)} | ${r.evidence.table?.status || ""} | ${mark(r.mapHandoffVerified)} | ${mark(r.mapSymbolVerified ? r.mapSymbolVerified.pass : null)} | ${[...r.remainingIssue, ...r.notApplicable, ...(r.analysisFit?.missing?.length ? [`analysisFit: ${r.analysisFit.missing.join(", ")}`] : []), ...(r.mapSymbolVerified && r.mapSymbolVerified.pass === false ? [`map symbol: ${(r.mapSymbolVerified.missing || [r.mapSymbolVerified.reason]).join(", ")}`] : [])].join("; ").replace(/\|/gu, "/")} |`),
  "",
].join("\n");
writeFileSync(resolve(OUT, `analysis-qa-v140-${label}.md`), md);
console.log(JSON.stringify(summary));
// Failure classification per element, for the baseline comparison.
function failureKeys(r) {
  const keys = [];
  if (!r.screenLoaded) keys.push("screenLoaded");
  if (r.detailTilesBounded === false) keys.push("detailTilesBounded");
  if (r.cardClicked === false) keys.push("cardClicked");
  if (r.homeCardClicked === false) keys.push("homeCardClicked");
  if (r.selectionUrlPreserved === false) keys.push("selectionUrlPreserved");
  if (r.cardValueVerified === false) keys.push("cardValueVerified");
  if (r.detailAnalysisFit === false) keys.push("detailAnalysisFit");
  if (r.analysisFit?.pass === false) keys.push("analysisFit");
  if (r.controlsVerified === false) keys.push("controlsVerified");
  if (r.mapHandoffVerified === false) keys.push("mapHandoffVerified");
  if (r.mapSymbolVerified && r.mapSymbolVerified.pass === false) keys.push("mapSymbolVerified");
  if (r.recomputed?.status === "mismatch") keys.push("recomputed");
  if (r.evidence.table?.status === "value-without-keys") keys.push("tableValueWithoutKeys");
  if (r.internalWording) keys.push("internalWording");
  if (r.statusChecks) Object.entries(r.statusChecks).forEach(([key, ok]) => { if (ok === false) keys.push(key); });
  return keys;
}
const baselinePath = opt("--baseline", null);
let baselineVerdict = null;
if (baselinePath) {
  const baseline = JSON.parse(readFileSync(resolve(PROJECT_ROOT, baselinePath), "utf8"));
  const known = new Map((baseline.failures || []).map((row) => [row.elementId, new Set(row.checks || [])]));
  const newFailures = [];
  for (const r of requiredFailures) {
    const keys = failureKeys(r);
    const listed = known.get(r.elementId);
    const unlisted = listed ? keys.filter((key) => !listed.has(key)) : keys;
    if (!listed || unlisted.length) newFailures.push({ elementId: r.elementId, checks: unlisted, listed: Boolean(listed) });
  }
  const resolved = [...known.keys()].filter((id) => !requiredFailures.some((r) => r.elementId === id));
  baselineVerdict = { baseline: baselinePath, baselineCount: known.size, requiredFailures: requiredFailures.length, newFailures, resolved, pass: newFailures.length === 0 };
  writeFileSync(resolve(OUT, `analysis-qa-v140-${label}-baseline.json`), `${JSON.stringify(baselineVerdict, null, 2)}\n`);
  console.log(JSON.stringify({ type: "baseline", ...baselineVerdict, newFailures: newFailures.map((row) => `${row.elementId}:${row.checks.join("+")}`), resolved }));
}
process.exitCode = baselineVerdict ? (baselineVerdict.pass ? 0 : 1) : requiredFailures.length ? 1 : 0;
