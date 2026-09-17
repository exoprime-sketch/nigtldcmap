/**
 * Shared card model for the 152 public datasets (V140).
 *
 * One rule decides what a finder card summarises, so the finder card, the
 * detail screen's opening selection and the QA that compares them read the
 * same contract:
 *
 *   representative  which measure / series / year the card leads with, in the
 *                   same keys the detail screen's selector state uses
 *   headline        that value, its unit and the year·region it belongs to
 *   preview         a small analysis that fits the data's shape: a trend when
 *                   there are years to compare, a composition when parts share
 *                   a denominator, a comparison across a category, a spatial
 *                   summary across provinces, or the facts a register carries
 *   basis           what one counted thing is (facility, project, office,
 *                   document, observation) and the rule applied
 *
 * Nothing is invented for a dataset that has no values: the five status-only
 * elements get a status card and nothing else.
 */
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TOTAL_LIKE = /(^|[\s·(])(총액|총계|합계|전체|전국|총량|total|all|overall)([\s·()]|$)/iu;
export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/**
 * What a delivered row is: individual / aggregate / definition (V142). The
 * same JSON rules the detail screen reads (src/data/visualization/
 * publicRecordRoleV142.ts), so the card, the summary, the list and the QA
 * exclude the same rows. D-026's five guarantee-cover descriptions are
 * definitions, not guarantees.
 */
const RECORD_ROLE_RULES = readJson(resolve(fileURLToPath(new URL("../../src/data/visualization/publicRecordRoleRulesV142.json", import.meta.url)))).rules;
const isEmptyValue = (value) => value === null || value === undefined || String(value).trim() === "";
export function recordRoleOf(row) {
  const attributes = row.normalizedAttributes || {};
  if (text(attributes["레코드구분"]) === "집계") return { role: "aggregate", label: "집계·설명 행" };
  const rule = RECORD_ROLE_RULES.find((candidate) => candidate.elementId === row.elementId);
  if (rule) {
    const { fieldIn, allEmpty } = rule.when;
    const inSet = !fieldIn || fieldIn.values.includes(text(attributes[fieldIn.field]));
    const empty = !allEmpty || allEmpty.every((field) => isEmptyValue(attributes[field]));
    if (inSet && empty) return { role: rule.role, label: rule.label };
  }
  return { role: "individual", label: null };
}

export function loadPacks(dataRoot) {
  const index = readJson(resolve(dataRoot, "packs/bundle-index-v124.json"));
  const cache = new Map();
  const elements = new Map();
  for (const [elementId, entry] of Object.entries(index.elements)) {
    const path = resolve(dataRoot, entry.packUrl.replace(/^\/data\/vietnam\/v2\//u, ""));
    let shard = cache.get(path);
    if (!shard) {
      const envelope = readJson(path);
      shard = JSON.parse(gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8"));
      cache.set(path, shard);
    }
    elements.set(elementId, { ...shard.elements[elementId], packUrl: entry.packUrl, packSha256: entry.sha256 || entry.packSha256 || null });
  }
  return elements;
}

export function loadSemantics(dataRoot) {
  const dir = resolve(dataRoot, "semantic/elements");
  const byElement = new Map();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const semantic = readJson(resolve(dir, file));
    byElement.set(semantic.elementId, semantic);
  }
  const contracts = readJson(resolve(dataRoot, "semantic/element-visualization-contracts-v125.json")).contracts;
  return { byElement, contractByElement: new Map(contracts.map((contract) => [contract.elementId, contract])) };
}

/** The detail screen's own row model: an observation joined to its measure and dimensions. */
export function semanticRows(observations, semantic) {
  const indicatorList = Array.isArray(semantic?.indicators) ? semantic.indicators : Object.values(semantic?.indicators || {});
  const indicators = new Map(indicatorList.map((indicator) => [indicator.indicatorId, indicator]));
  const records = semantic?.records || {};
  const recordList = Array.isArray(records) ? records : Object.values(records);
  const byRecord = new Map(recordList.map((record) => [record.recordId, record]));
  return observations.flatMap((observation) => {
    const indicator = indicators.get(observation.indicatorId);
    if (!indicator) return [];
    const override = byRecord.get(observation.recordId);
    const dimensions = { ...(indicator.dimensions || {}), ...(override?.dimensions || {}) };
    const dimensionLabels = { ...(indicator.dimensionLabels || {}), ...(override?.dimensionLabels || {}) };
    if (observation.year !== null && observation.year !== undefined) {
      dimensions.year = String(observation.year);
      dimensionLabels.year = String(observation.year);
    }
    if (observation.period) {
      dimensions.period = observation.period;
      dimensionLabels.period = observation.period;
    }
    return [{
      ...observation,
      measure: indicator.measure,
      dimensions,
      dimensionLabels,
      displayLabel: override?.displayLabel || indicator.displayLabel,
      seriesKey: override?.seriesKey || indicator.seriesKey,
    }];
  });
}

export const isPopulated = (row) =>
  row.value !== null && row.value !== undefined && row.value !== "" && (typeof row.value !== "number" || Number.isFinite(row.value));
export const isNumeric = (row) => typeof row.value === "number" && Number.isFinite(row.value);

const LAYER_METADATA_UNITS = new Set(["EPSG 코드", "개", "score"]);
export function isLayerMetadataMeasure(measure, rows) {
  if (LAYER_METADATA_UNITS.has((measure.unit || "").trim())) return true;
  const own = rows.filter((row) => row.measure.key === measure.key);
  return own.length > 0 && own.every((row) => /결측\s*(?:률|비율)/u.test(row.displayLabel || ""));
}

/** The archetype's default measure, in its order: reviewed default first, else the first populated measure that is not layer metadata. */
export function defaultMeasureKey(contract, rows, reviewedDefault) {
  const available = new Set(rows.map((row) => row.measure.key));
  const options = contract.measures.filter((measure) => measure.recordCount > 0 && available.has(measure.key));
  const populated = (measure) => rows.some((row) => row.measure.key === measure.key && isPopulated(row));
  if (reviewedDefault && options.some((measure) => measure.key === reviewedDefault && populated(measure))) return reviewedDefault;
  const first = options.find((measure) => populated(measure) && !isLayerMetadataMeasure(measure, rows)) || options.find(populated) || options[0];
  return first?.key || null;
}

/** Series within a measure: rows grouped by every dimension except year/period. */
export function seriesOf(rows) {
  const groups = new Map();
  for (const row of rows) {
    const keyDims = Object.entries(row.dimensions)
      .filter(([key]) => !["year", "period"].includes(key))
      .sort(([a], [b]) => a.localeCompare(b));
    const key = keyDims.map(([k, v]) => `${k}=${v}`).join("|");
    let group = groups.get(key);
    if (!group) {
      group = { key, dimensions: Object.fromEntries(keyDims), labels: Object.fromEntries(keyDims.map(([k]) => [k, row.dimensionLabels[k] ?? row.dimensions[k]])), rows: [] };
      groups.set(key, group);
    }
    group.rows.push(row);
  }
  return [...groups.values()];
}

export function yearsOf(rows) {
  return [...new Set(rows.filter(isNumeric).map((row) => row.year).filter((year) => Number.isFinite(year)))].sort((a, b) => a - b);
}

export function latestPoint(rows) {
  const numeric = rows.filter((row) => isNumeric(row) && Number.isFinite(row.year));
  if (!numeric.length) return null;
  return numeric.reduce((best, row) => (row.year > best.year ? row : best));
}

export function formatNumber(value, digits) {
  const abs = Math.abs(value);
  // Large plain numbers read as Korean units; a unit that already carries a
  // scale (10억, 백만, 천) never reaches here with such magnitudes.
  if (digits === undefined && abs >= 1e8) return `${(value / 1e8).toLocaleString("en-US", { maximumFractionDigits: 2 })}억`;
  if (digits === undefined && abs >= 1e6) return `${(value / 1e4).toLocaleString("en-US", { maximumFractionDigits: 0 })}만`;
  const fraction = digits ?? (abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3);
  return value.toLocaleString("en-US", { maximumFractionDigits: fraction, minimumFractionDigits: 0 });
}

export function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function quantile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

export const text = (value) => String(value ?? "").normalize("NFC").trim();

/** A number the source actually states: null, "" and non-numeric text are not zero. */
export function numberOf(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value.replace(/,/gu, "")))) return Number(value.replace(/,/gu, ""));
  return null;
}
