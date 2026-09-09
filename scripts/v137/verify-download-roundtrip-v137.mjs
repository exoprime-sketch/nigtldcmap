#!/usr/bin/env node
/**
 * Every download file reconstructs the records the pack holds. All of them.
 *
 * The download JSON now states fields that are constant across a file once, in
 * recordDefaults, instead of repeating them on every record - 17 MiB of
 * verbatim repetition on B-004 alone. That is a change to the JSON's
 * representation, not to the data, and the only way to say so honestly is to
 * check it: merge the defaults back and compare field by field against the
 * pack the download was built from.
 *
 * The CSV is checked too, because its flat one-row-per-record schema is
 * explicitly unchanged and a row count is the cheapest way to catch a drift.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", ".staging/final/public/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration"));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

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

/** Row count of a CSV, honouring quoted fields that contain newlines. */
function csvDataRowCount(text) {
  let rows = 0;
  let inQuotes = false;
  let sawContent = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') index += 1;
      else inQuotes = !inQuotes;
      sawContent = true;
      continue;
    }
    if (char === "\n" && !inQuotes) {
      if (sawContent) rows += 1;
      sawContent = false;
      continue;
    }
    if (char !== "\r") sawContent = true;
  }
  if (sawContent) rows += 1;
  return Math.max(0, rows - 1); // minus the header
}

function main() {
  const packs = loadPacks();
  const catalog = readJson(resolve(DATA, "catalog.json"));
  const problems = [];
  let checkedElements = 0;
  let checkedRecords = 0;
  let elementsWithDefaults = 0;

  for (const element of catalog.elements || []) {
    if (!element.downloadAssets) continue;
    const elementId = element.elementId;
    const token = elementId.toLowerCase();
    const document = readJson(resolve(DATA, "downloads", `${token}.json`));
    const payload = packs.get(elementId) || {};
    checkedElements += 1;

    if (document.downloadSchemaVersion !== 2) {
      problems.push({ elementId, kind: "DOWNLOAD_SCHEMA_VERSION_MISSING", got: document.downloadSchemaVersion ?? null });
    }
    const defaults = document.recordDefaults || null;
    if (defaults) elementsWithDefaults += 1;

    for (const section of ["observations", "entities"]) {
      const stored = document[section] || [];
      const sectionDefaults = (defaults && defaults[section]) || {};
      const source = (payload[section] || {}).records || [];

      // The download is the *published* projection, which can legitimately hold
      // fewer fields than the pack record. Every field the download carries has
      // to match the pack, and every field the pack has that the download names
      // has to survive the merge.
      if (stored.length !== source.length) {
        problems.push({
          elementId,
          section,
          kind: "RECORD_COUNT_CHANGED",
          download: stored.length,
          pack: source.length,
        });
        continue;
      }
      const byRecordId = new Map(source.map((row) => [row.recordId, row]));
      for (const record of stored) {
        const merged = { ...sectionDefaults, ...record };
        checkedRecords += 1;
        const packRecord = byRecordId.get(merged.recordId);
        if (!packRecord) {
          problems.push({ elementId, section, kind: "RECORD_NOT_IN_PACK", recordId: merged.recordId });
          continue;
        }
        // Nothing the defaults hold may already differ on the record, or the
        // merge would silently pick one of two values.
        for (const key of Object.keys(sectionDefaults)) {
          if (key in record && JSON.stringify(record[key]) !== JSON.stringify(sectionDefaults[key])) {
            problems.push({ elementId, section, kind: "RECORD_OVERRIDES_DEFAULT", recordId: merged.recordId, key });
          }
        }
        for (const [key, value] of Object.entries(merged)) {
          if (!(key in packRecord)) continue;
          if (JSON.stringify(value) !== JSON.stringify(packRecord[key])) {
            problems.push({
              elementId,
              section,
              kind: "FIELD_VALUE_CHANGED",
              recordId: merged.recordId,
              key,
            });
          }
        }
      }
    }

    // The CSV schema is unchanged, so its row count must still equal the
    // published record count.
    const csv = readFileSync(resolve(DATA, "downloads", `${token}.csv`), "utf8").replace(/^﻿/u, "");
    const csvRows = csvDataRowCount(csv);
    const published =
      (document.observations || []).length + (document.entities || []).length;
    if (csvRows !== published) {
      problems.push({ elementId, kind: "CSV_ROW_COUNT_MISMATCH", csv: csvRows, json: published });
    }
  }

  const result = {
    schema: "nigt-download-roundtrip-1",
    generatedAt: new Date().toISOString(),
    dataRoot: relative(ROOT, DATA).split(sep).join("/"),
    downloadSchemaVersion: 2,
    checkedElements,
    elementsWithRecordDefaults: elementsWithDefaults,
    checkedRecords,
    status: problems.length ? "FAIL" : "PASS",
    problemCount: problems.length,
    problems: problems.slice(0, 50),
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "download-roundtrip-v137.json"),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ...result, problems: undefined }, null, 2));
  return problems.length ? 1 : 0;
}

process.exit(main());
