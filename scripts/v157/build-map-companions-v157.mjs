#!/usr/bin/env node
/**
 * Where a target the data cannot map is shown instead (V157 4단계).
 *
 * The 2026-09-22 review put 72 datasets on the map; twelve of them cannot be
 * placed, because the delivery states no region for them (see REVIEW_V157 §1.4).
 * Dropping them would hide real data, so each travels with the layer a reader
 * would open anyway - the pairing is the user's decision of 2026-09-29 and is
 * already recorded in the content contract's `companionLayers`.
 *
 * This builder turns that into what the screen reads: per map layer, the
 * companions it carries, each with the card's own values read from the published
 * download (never hardcoded) - the headline number, its unit, its period and its
 * source. A companion whose value cannot be read is written with
 * `value: null` and a reason, so the panel says "원천 미제공" instead of a zero.
 *
 * Usage: node scripts/v157/build-map-companions-v157.mjs [--check]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  countryPublicDirV158,
  repoRootV158,
  resolveCountryIso3V158,
} from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");
const COUNTRY = resolveCountryIso3V158({ argv });
const DATA = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));

const OUT_PATH = resolve(ROOT, "src/data/map/mapCompanionsV157.json");
const REPORT_PATH = resolve(ROOT, "reports/v157/map-companions-build-v157.json");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const contract = readJson(resolve(DATA, "map-content-contract-v157.json"));
const catalog = readJson(resolve(DATA, "catalog.json"));
const mapIndex = readJson(resolve(DATA, "map-index.json"));
const catalogByElement = new Map(catalog.elements.map((row) => [row.elementId, row]));
const registered = new Set(
  mapIndex.layers.filter((row) => row.active !== false && row.enabled !== false).map((row) => row.elementId)
);

/**
 * The label the source gives an indicator, so a card says what its number is.
 *
 * An element's workbook can carry several indicators (B-035 states both land area
 * and carbon stock), and the element's name alone would mislabel whichever one the
 * headline picked. The label comes from the element's semantic asset, never from
 * this script.
 */
function indicatorLabelsFor(elementId) {
  const path = resolve(DATA, `semantic/elements/${elementId.toLowerCase()}.json`);
  if (!existsSync(path)) return new Map();
  return new Map(
    (readJson(path).indicators ?? []).map((indicator) => [
      indicator.indicatorId,
      { label: indicator.measure?.labelKo ?? "", unit: indicator.measure?.unit ?? "" },
    ])
  );
}

/** The download's observations, or an empty list when the element has none. */
function observationsFor(elementId) {
  const path = resolve(DATA, `downloads/${elementId}.json`);
  if (!existsSync(path)) return [];
  return readJson(path).observations ?? [];
}

/**
 * The card's headline: the element's most recent national value, with the unit
 * and period the source states. Picked by year, and only from rows that carry a
 * finite number - no averaging, no filling.
 */
function headlineFor(elementId) {
  const rows = observationsFor(elementId).filter(
    (row) => typeof row.value === "number" && Number.isFinite(row.value)
  );
  if (rows.length === 0) {
    return { value: null, reason: "원천에 수치 관측값이 없습니다(문서·목록형 자료)" };
  }
  const withYear = rows.filter((row) => Number.isFinite(Number(row.year)));
  const latestYear = withYear.length
    ? Math.max(...withYear.map((row) => Number(row.year)))
    : null;
  const candidates = latestYear === null ? rows : withYear.filter((row) => Number(row.year) === latestYear);
  // Several indicators can share the latest year; the card shows the first as its
  // headline and counts the rest, rather than adding numbers of different meaning.
  const first = candidates[0];
  const labels = indicatorLabelsFor(elementId);
  const indicator = labels.get(first.indicatorId);
  return {
    // What the number is, in the source's own words.
    indicatorLabel: indicator?.label ?? "",
    value: first.value,
    unit: first.unit ?? "",
    period: latestYear === null ? (first.period ?? "") : String(latestYear),
    indicatorId: first.indicatorId,
    source: first.provenance?.sourceOrg ?? "",
    sourceUrl: first.provenance?.sourceUrl ?? "",
    otherIndicatorCount: candidates.length - 1,
    reason: null,
  };
}

const companionsByLayer = new Map();
const rows = [];
for (const row of contract.rows) {
  for (const companion of row.companionLayers ?? []) {
    const entry = catalogByElement.get(row.elementId);
    const headline = headlineFor(row.elementId);
    const record = {
      elementId: row.elementId,
      publicName: row.targetName,
      role: companion.role,
      form: companion.form,
      note: companion.note,
      ...(companion.matchOn ? { matchOn: companion.matchOn } : {}),
      ...(companion.quotationOnly ? { quotationOnly: true } : {}),
      status: row.status,
      statusReason: row.statusReason,
      headline,
      detailUrl: `/?view=data&country=${COUNTRY}&element=${row.elementId}#element-detail`,
      recordCount: entry?.entityCount ?? 0,
      observationCount: entry?.observationCount ?? 0,
    };
    const list = companionsByLayer.get(companion.elementId) ?? [];
    list.push(record);
    companionsByLayer.set(companion.elementId, list);
    rows.push({ layer: companion.elementId, companion: row.elementId, form: companion.form, role: companion.role });
  }
}

const unregisteredHosts = [...companionsByLayer.keys()].filter((elementId) => !registered.has(elementId));
if (unregisteredHosts.length > 0) {
  throw new Error(`COMPANION_HOST_NOT_ON_MAP: ${unregisteredHosts.join(", ")}`);
}

const document = {
  schemaVersion: "map-companions-v157",
  countryIso3: COUNTRY,
  generatedAt: new Date().toISOString(),
  generator: "scripts/v157/build-map-companions-v157.mjs",
  source: "public/data/vietnam/v2/map-content-contract-v157.json (companionLayers)",
  note: "지도에 올릴 수 없는 요소를 연관 레이어와 함께 보여 주기 위한 계약입니다. 카드 값은 공개 다운로드에서 읽은 값이며 화면에 숫자를 직접 적지 않습니다.",
  layers: [...companionsByLayer.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([elementId, companions]) => ({
      elementId,
      companions: companions.sort((left, right) =>
        left.role === right.role ? left.elementId.localeCompare(right.elementId) : left.role === "primary" ? -1 : 1
      ),
    })),
};

const text = `${JSON.stringify(document, null, 2)}\n`;
const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
const previousDocument = previous ? JSON.parse(previous) : null;
const sameContent =
  previousDocument !== null &&
  JSON.stringify({ ...previousDocument, generatedAt: null }) ===
    JSON.stringify({ ...document, generatedAt: null });
if (sameContent) document.generatedAt = previousDocument.generatedAt;
const finalText = `${JSON.stringify(document, null, 2)}\n`;
const changed = previous !== finalText;
if (changed && !CHECK_ONLY) writeFileSync(OUT_PATH, finalText, "utf8");

const summary = {
  schema: "map-companions-build-v157",
  generatedAt: document.generatedAt,
  hostLayerCount: document.layers.length,
  companionCount: rows.length,
  withoutHeadline: rows
    .map((row) => row.companion)
    .filter((elementId) => {
      const headline = headlineFor(elementId);
      return headline.value === null;
    }),
  byForm: rows.reduce((acc, row) => {
    acc[row.form] = (acc[row.form] ?? 0) + 1;
    return acc;
  }, {}),
  rows,
  changed,
};
if (!CHECK_ONLY) writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", ...summary, rows: undefined })}\n`);
if (CHECK_ONLY && changed) {
  process.stderr.write(`${JSON.stringify({ type: "error", reason: "COMPANIONS_OUT_OF_DATE" })}\n`);
  process.exitCode = 1;
}
