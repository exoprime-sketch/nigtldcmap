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
 *                   the point), a matrix, a status note, or no stated unit
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

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");
const COUNTRY = resolveCountryIso3V158({ argv });
const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json");
const DATA_DIR = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));

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
  const path = resolve(DATA_DIR, "downloads", `${elementId.toLowerCase()}.json`);
  let payload;
  try {
    payload = readJson(path);
  } catch {
    return null;
  }
  const indicators = Array.isArray(payload?.indicators) ? payload.indicators : [];
  const observations = Array.isArray(payload?.observations) ? payload.observations : [];
  const withValues = new Set(
    observations
      .filter((row) => typeof row?.value === "number" && Number.isFinite(row.value))
      .map((row) => String(row.indicatorId))
  );
  // The headline is the first indicator the delivery lists that actually carries
  // values and a year; an indicator kept for the record is not a compare key.
  const candidate = indicators.find((row) => withValues.has(String(row.indicatorId)));
  if (!candidate) return null;
  const years = observations
    .filter((row) => String(row.indicatorId) === String(candidate.indicatorId))
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year));
  if (years.length === 0) return null;
  return {
    indicatorId: String(candidate.indicatorId),
    unit: String(candidate.unit ?? "").trim(),
    years: [...new Set(years)].sort((left, right) => left - right),
  };
}

const contract = readJson(CONTRACT_PATH);
let comparable = 0;
const reasons = {};
const rows = contract.rows.map((row) => {
  const archetype = String(row.archetype || "");
  const unit = String(row.primary?.unit ?? "").trim();
  const headline = COMPARABLE_ARCHETYPES.has(archetype) ? headlineIndicator(row.elementId) : null;
  let decision;
  if (!COMPARABLE_ARCHETYPES.has(archetype)) {
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
