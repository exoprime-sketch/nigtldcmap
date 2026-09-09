#!/usr/bin/env node
/**
 * What the source actually holds for each element, in a form a person can read.
 *
 * This is review material, not a verdict. Judging whether a screen shows the
 * right thing needs the other side of the comparison in front of you: which
 * indicators exist, in what unit, over what period, how many rows carry a
 * value, and which attribute columns the entity rows actually fill. Reading
 * that out of gzipped packs one element at a time is what makes a 152-screen
 * review impractical, so it is extracted once here.
 *
 * Nothing in the output says whether a screen is right. It says what the screen
 * would have to account for.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", ".verify/candidate/build/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/screen-review"));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const filled = (value) =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "" &&
  String(value).trim() !== "(미표기)";

function loadPacks() {
  const dir = resolve(DATA, "packs");
  const byElement = new Map();
  for (const file of readdirSync(dir).filter((n) => n.startsWith("vnm-v124-pack-"))) {
    const envelope = readJson(resolve(dir, file));
    const payload = JSON.parse(
      gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8")
    );
    for (const elementId of payload.elementIds || []) {
      byElement.set(elementId, payload.elements[elementId] || {});
    }
  }
  return byElement;
}

/** Distinct values, most common first, with how many rows carry each. */
function topValues(values, limit = 6) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => `${value.slice(0, 60)} (${count})`);
}

function summariseObservations(records, indicators) {
  const byIndicator = new Map();
  for (const row of records) {
    const key = String(row.indicatorId || "");
    const entry = byIndicator.get(key) || { rows: 0, valued: 0, periods: new Set(), units: new Set() };
    entry.rows += 1;
    if (filled(row.value)) entry.valued += 1;
    if (filled(row.period)) entry.periods.add(String(row.period));
    else if (filled(row.year)) entry.periods.add(String(row.year));
    if (filled(row.unit)) entry.units.add(String(row.unit));
    byIndicator.set(key, entry);
  }
  const labels = new Map((indicators || []).map((row) => [row.indicatorId, row]));
  return [...byIndicator]
    .sort((a, b) => b[1].valued - a[1].valued)
    .map(([indicatorId, entry]) => {
      const periods = [...entry.periods].sort();
      const meta = labels.get(indicatorId) || {};
      return {
        indicatorId,
        label: meta.labelKo || null,
        unit: [...entry.units].join(" · ") || meta.unit || null,
        statisticType: meta.statisticType || null,
        rows: entry.rows,
        rowsWithValue: entry.valued,
        periodCount: periods.length,
        periodRange:
          periods.length === 0
            ? null
            : periods.length === 1
              ? periods[0]
              : `${periods[0]} … ${periods[periods.length - 1]}`,
      };
    });
}

function summariseEntities(records) {
  if (!records.length) return null;
  const columns = new Map();
  for (const record of records) {
    for (const [key, value] of Object.entries(record.normalizedAttributes || {})) {
      const entry = columns.get(key) || { filled: 0, samples: [] };
      if (filled(value)) {
        entry.filled += 1;
        if (entry.samples.length < 400) entry.samples.push(value);
      }
      columns.set(key, entry);
    }
  }
  return {
    recordCount: records.length,
    withCoordinates: records.filter((r) => Number.isFinite(r.latitude)).length,
    columns: [...columns]
      .filter(([, entry]) => entry.filled > 0)
      .sort((a, b) => b[1].filled - a[1].filled)
      .map(([name, entry]) => ({
        name,
        filled: entry.filled,
        of: records.length,
        distinctSample: topValues(entry.samples, 5),
      })),
  };
}

function main() {
  const catalog = readJson(resolve(DATA, "catalog.json"));
  const packs = loadPacks();
  const rows = [];

  for (const element of catalog.elements || []) {
    const elementId = element.elementId;
    const payload = packs.get(elementId) || {};
    const observations = (payload.observations || {}).records || [];
    const entities = (payload.entities || {}).records || [];
    const indicators = (payload.meta || {}).indicators || [];
    rows.push({
      elementId,
      label: element.elementLabel,
      category: `${element.categoryLabel} · ${element.groupLabel}`,
      publicStatus: element.publicStatus,
      dataPresenceStatus: element.dataPresenceStatus,
      emptyReason: element.emptyReason || null,
      detailTemplate: element.detailTemplate,
      sourceOrganizations: element.sourceOrganizations || element.rights?.sourceOrganizations || null,
      downloadAllowed: Boolean(element.downloadAllowed),
      downloadableRecordCount: element.downloadableRecordCount ?? null,
      mapFeatureCount: element.mapFeatureCount ?? 0,
      observationRowCount: observations.length,
      entityRowCount: entities.length,
      indicators: summariseObservations(observations, indicators),
      entities: summariseEntities(entities),
    });
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "element-source-facts-v137.json"),
    `${JSON.stringify({ schema: "nigt-element-source-facts-1", dataRoot: relative(ROOT, DATA).split(sep).join("/"), elementCount: rows.length, elements: rows }, null, 2)}\n`,
    "utf8"
  );
  console.log(
    JSON.stringify(
      {
        elementCount: rows.length,
        withObservations: rows.filter((r) => r.observationRowCount > 0).length,
        withEntities: rows.filter((r) => r.entityRowCount > 0).length,
        withNeither: rows.filter((r) => !r.observationRowCount && !r.entityRowCount).length,
      },
      null,
      2
    )
  );
}

main();
