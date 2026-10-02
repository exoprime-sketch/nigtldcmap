/**
 * V162: a series that a delivery states in record rows instead of observations.
 *
 * The 2026-09-30 delivery moved B-046 (mineral reserves) from observations
 * (one indicator per mineral, one value per year) to records - one row per
 * mineral and USGS edition that still names its own indicator (원_지표_ID),
 * year (연도), value (값) and unit (단위). The country comparison reads those
 * four stated columns as the same series; nothing is derived or converted, and
 * an indicator whose rows state more than one unit is left out.
 */
const text = (value) => (value === null || value === undefined ? "" : String(value).trim());

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = text(value).replace(/,/gu, "");
  if (!cleaned || !/^-?\d+(\.\d+)?$/u.test(cleaned)) return null;
  return Number(cleaned);
}

function recordsOf(entities) {
  if (Array.isArray(entities)) return entities;
  return Array.isArray(entities?.records) ? entities.records : [];
}

/** [{ indicatorId, year, value, unit }] from rows that state all four. */
export function statedRecordSeriesV162(entities) {
  const rows = [];
  for (const record of recordsOf(entities)) {
    const attributes = record?.normalizedAttributes || {};
    const indicatorId = text(attributes["원_지표_ID"]);
    const year = Number(text(attributes["연도"]));
    const value = numeric(attributes["값"]);
    const unit = text(attributes["단위"]);
    if (!indicatorId || !Number.isInteger(year) || value === null || !unit) continue;
    rows.push({ indicatorId, year, value, unit });
  }
  const unitsById = new Map();
  for (const row of rows) {
    const units = unitsById.get(row.indicatorId) || new Set();
    units.add(row.unit);
    unitsById.set(row.indicatorId, units);
  }
  return rows.filter((row) => unitsById.get(row.indicatorId).size === 1);
}

/** The indicators those rows state, in first-seen order: [{ indicatorId, unit }]. */
export function statedRecordIndicatorsV162(series) {
  const seen = new Map();
  for (const row of series) if (!seen.has(row.indicatorId)) seen.set(row.indicatorId, { indicatorId: row.indicatorId, unit: row.unit });
  return [...seen.values()];
}
