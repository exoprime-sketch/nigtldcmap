#!/usr/bin/env node
/**
 * Declares which elements can be compared across countries, and on what key.
 *
 * Comparing two countries only means something when both sides state the same
 * measure in the same unit. That is a property of the element, so it belongs in
 * the visualization contract rather than in a screen: the compare block reads
 * `countryCompare` and renders nothing when the element is not comparable.
 *
 * The judgment is derived from what the contract and the published data already
 * state, never guessed:
 *
 *   comparable      national-series or composition, a single stated unit, and a
 *                   country-level indicator whose values carry a year
 *   not comparable  a registry or policy document (records, not a measure), a
 *                   province distribution or station series (the geography is
 *                   the point), a matrix, a status note, or no stated unit;
 *                   also any element whose values describe a fixed reference
 *                   country (typology referenceCountryIso3, spec v8: E-016,
 *                   E-017 - Korea), whatever its archetype
 *
 * `compareKey.indicatorId` is the element's headline indicator - the one the
 * primary chart draws - taken from the published download payload. `yearRule`
 * is `latest-common`: the most recent year both countries have, so a country
 * that stops earlier is not made to look like a drop.
 *
 *   node scripts/v158/build-country-compare-contract-v158.mjs [--country vnm] [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  countryPublicDirV158,
  repoRootV158,
  resolveCountryIso3V158,
} from "./country-context-v158.mjs";
import { readDownloadJsonV158 } from "./download-zip-v158.mjs";
import { statedRecordIndicatorsV162, statedRecordSeriesV162 } from "./compare-stated-records-v162.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");
const COUNTRY = resolveCountryIso3V158({ argv });
const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json");
const TYPOLOGY_PATH = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const DATA_DIR = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));
// V158 fix-forward (user decision 2026-09-30): elements kept out of the country
// comparison whatever their archetype (contractor standard v1.1: 54 compared).
const COMPARE_EXCLUSIONS = new Map(
  JSON.parse(readFileSync(resolve(ROOT, "config/data-publication/country-compare-exclusions-v158.json"), "utf8")).excluded.map(
    (row) => [row.elementId, row.reason]
  )
);
// V158 fix-forward: the representative indicator is the one the element's card
// states (its reviewed headline), not the first indicator a delivery lists.
const CARD_HEADLINES = (() => {
  try {
    const document = JSON.parse(readFileSync(resolve(DATA_DIR, "home/card-summaries-v140.json"), "utf8"));
    const cards = Array.isArray(document.cards) ? document.cards : Object.values(document.cards || {});
    return new Map(cards.map((card) => [card.elementId, (card.provenance?.headlineIndicatorIds || [])[0]]).filter(([, id]) => id));
  } catch {
    return new Map();
  }
})();

/** Archetypes whose primary chart states one measure per year for the country. */
const COMPARABLE_ARCHETYPES = new Set(["national-series", "composition"]);
/** Why the others are not compared, in the reader's terms. */
const ARCHETYPE_REASON = {
  registry: "레코드 목록이라 국가 간 같은 값으로 견줄 수 없음",
  "policy-document": "정책 문서 상태라 수치 비교 대상이 아님",
  "province-distribution": "성·시 분포가 내용이라 국가 단위로 합치지 않음",
  station: "관측지점 시계열이라 국가 단위로 합치지 않음",
  matrix: "행렬 표라 단일 비교 키가 없음",
  "status-note": "상태 안내만 있어 비교할 값이 없음",
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function headlineIndicator(elementId) {
  // V158: the download JSON ships inside downloads/<id>.zip.
  let payload;
  try {
    payload = readDownloadJsonV158(DATA_DIR, elementId);
  } catch {
    return null;
  }
  let indicators = Array.isArray(payload?.indicators) ? payload.indicators : [];
  let observations = Array.isArray(payload?.observations) ? payload.observations : [];
  // V162: a delivery that states the series in record rows (B-046).
  if (!observations.length) {
    observations = statedRecordSeriesV162(payload?.entities);
    if (observations.length) indicators = statedRecordIndicatorsV162(observations);
  }
  const withValues = new Set(
    observations
      .filter((row) => typeof row?.value === "number" && Number.isFinite(row.value))
      .map((row) => String(row.indicatorId))
  );
  // The card's headline indicator when it carries values; otherwise the first
  // indicator the delivery lists that does (an indicator kept for the record is
  // not a compare key).
  const cardHeadline = CARD_HEADLINES.get(elementId);
  const fromCard = cardHeadline ? indicators.find((row) => String(row.indicatorId) === cardHeadline && withValues.has(cardHeadline)) : null;
  const candidate = fromCard || indicators.find((row) => withValues.has(String(row.indicatorId)));
  if (!candidate) return null;
  const years = observations
    .filter((row) => String(row.indicatorId) === String(candidate.indicatorId))
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year));
  if (years.length === 0) return null;
  return {
    source: fromCard ? "card-headline" : "first-with-values",
    indicatorId: String(candidate.indicatorId),
    unit: String(candidate.unit ?? "").trim(),
    years: [...new Set(years)].sort((left, right) => left - right),
  };
}

const contract = readJson(CONTRACT_PATH);
const referenceCountry = new Map(
  readJson(TYPOLOGY_PATH).rows.filter((row) => row.referenceCountryIso3).map((row) => [row.elementId, row.referenceCountryIso3])
);
let comparable = 0;
const reasons = {};
const headlineSources = {};
const uncardedHeadlines = [];
const rows = contract.rows.map((row) => {
  const archetype = String(row.archetype || "");
  const unit = String(row.primary?.unit ?? "").trim();
  const headline = COMPARABLE_ARCHETYPES.has(archetype) ? headlineIndicator(row.elementId) : null;
  let decision;
  if (COMPARE_EXCLUSIONS.has(row.elementId)) {
    decision = { comparable: false, reason: COMPARE_EXCLUSIONS.get(row.elementId) };
  } else if (referenceCountry.has(row.elementId)) {
    decision = { comparable: false, reason: "기준국(한국) 값이라 국가 간 비교 대상이 아님" };
  } else if (!COMPARABLE_ARCHETYPES.has(archetype)) {
    decision = {
      comparable: false,
      reason: ARCHETYPE_REASON[archetype] || `유형 ${archetype}는 비교 대상이 아님`,
    };
  } else if (!unit) {
    decision = { comparable: false, reason: "1순위 단위가 선언되지 않아 단위 일치를 확인할 수 없음" };
  } else if (!headline) {
    decision = { comparable: false, reason: "값과 연도를 가진 지표가 없어 비교 키를 만들 수 없음" };
  } else {
    comparable += 1;
    headlineSources[headline.source] = (headlineSources[headline.source] || 0) + 1;
    if (headline.source !== "card-headline") uncardedHeadlines.push(row.elementId);
    decision = {
      comparable: true,
      compareKey: {
        indicatorId: headline.indicatorId,
        unit: headline.unit || unit,
        yearRule: "latest-common",
      },
    };
  }
  if (!decision.comparable) {
    reasons[decision.reason] = (reasons[decision.reason] || 0) + 1;
  }
  return { ...row, countryCompare: decision };
});

const next = { ...contract, rows };
const nextText = `${JSON.stringify(next, null, 2)}\n`;
const currentText = readFileSync(CONTRACT_PATH, "utf8");
const changed = nextText !== currentText;
if (!CHECK_ONLY && changed) writeFileSync(CONTRACT_PATH, nextText, "utf8");

console.log(
  JSON.stringify({
    type: "summary",
    schemaVersion: "v158",
    country: COUNTRY,
    elements: rows.length,
    comparable,
    notComparable: rows.length - comparable,
    reasons,
    headlineSources,
    uncardedHeadlines,
    changed,
    mode: CHECK_ONLY ? "check" : "write",
  })
);
if (CHECK_ONLY && changed) {
  console.error(
    JSON.stringify({ type: "error", reason: "CONTRACT_OUT_OF_DATE", regenerate: "npm run build:country-compare:v158" })
  );
  process.exitCode = 1;
}
