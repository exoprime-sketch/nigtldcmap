#!/usr/bin/env node
/**
 * V153: how full the facility card is, per dataset.
 *
 * For each element with a card spec, reads the published download file and
 * reports, over the whole population and over a deterministic sample, the
 * share of records with an owner/operator, a commissioning year, a source
 * URL and a province - and why the rest are "미기재" (the source states
 * nothing, the coordinate falls outside every province, or the GPPD join
 * found no row).
 *
 *   node scripts/v153/facility-card-fill-v153.mjs [--ids A-023,E-006] [--sample 20]
 *       [--out reports/v153/facility-card-fill-v153.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const IDS = (opt("--ids", "A-023,E-006") || "").split(",").map((s) => s.trim()).filter(Boolean);
const SAMPLE = Number(opt("--sample", "20"));
const OUT = resolve(ROOT, opt("--out", "reports/v153/facility-card-fill-v153.json"));

const FIELDS = {
  "A-023": {
    owner: ["owner", "operator"],
    commissioningYear: ["commissioningYear"],
    sourceUrl: ["sourceUrl"],
    province: ["adm1Name34"],
  },
  "E-006": {
    owner: ["fundOrAffiliate"],
    sector: ["investSector"],
    sourceUrl: ["field_efec870d"],
    province: ["adm1Name34"],
    locationClass: ["locationClass"],
  },
};

const filled = (value) => value !== null && value !== undefined && String(value).trim() !== "" && String(value) !== "(미표기)";

function load(id) {
  const bundle = JSON.parse(readFileSync(resolve(ROOT, `public/data/vietnam/v2/downloads/${id.toLowerCase()}.json`), "utf8"));
  const defaults = bundle.recordDefaults?.entities || {};
  return bundle.entities.map((row) => ({ ...defaults, ...row }));
}

function rates(rows, fields) {
  const out = {};
  for (const [field, keys] of Object.entries(fields)) {
    const count = rows.filter((row) => keys.some((key) => filled(row.normalizedAttributes?.[key]))).length;
    out[field] = { filled: count, total: rows.length, percent: rows.length ? Math.round((count / rows.length) * 1000) / 10 : null };
  }
  return out;
}

function missingReasons(rows) {
  // A-023 only: why each card row is empty.
  const reasons = { owner: {}, commissioningYear: {}, sourceUrl: {}, province: {} };
  const bump = (bucket, reason) => { bucket[reason] = (bucket[reason] || 0) + 1; };
  for (const row of rows) {
    const a = row.normalizedAttributes || {};
    const wri = row.indicatorId === "A-023_power_plant_registry";
    if (!filled(a.owner) && !filled(a.operator)) bump(reasons.owner, wri ? (a.gppdId ? "GPPD owner 열 공란" : "GPPD 조인 실패") : "OSM operator 태그 없음");
    if (!filled(a.commissioningYear)) bump(reasons.commissioningYear, wri ? (a.gppdId ? "GPPD commissioning_year 공란" : "GPPD 조인 실패") : (filled(a.startDate) ? "OSM start_date 연도 해석 불가" : "OSM start_date 없음"));
    if (!filled(a.sourceUrl)) bump(reasons.sourceUrl, wri ? "GPPD url 공란·조인 실패" : "OSM 객체 ID 없음");
    if (!filled(a.adm1Name34)) bump(reasons.province, "좌표가 34개 성·시 경계 밖(해안·도서·국외)");
  }
  return reasons;
}

const report = { schema: "v153-facility-card-fill-1", generatedAt: new Date().toISOString(), sampleSize: SAMPLE, elements: {} };
for (const id of IDS) {
  const fields = FIELDS[id];
  if (!fields) continue;
  const rows = load(id);
  const byName = [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));
  let sample;
  if (id === "A-023") {
    // Half WRI, half OSM, first by name: reproducible and covers both registries.
    const wri = byName.filter((row) => row.indicatorId === "A-023_power_plant_registry").slice(0, Math.ceil(SAMPLE / 2));
    const osm = byName.filter((row) => row.indicatorId !== "A-023_power_plant_registry").slice(0, Math.floor(SAMPLE / 2));
    sample = [...wri, ...osm];
  } else {
    sample = byName.slice(0, SAMPLE);
  }
  const groups = {};
  for (const row of rows) {
    const key = row.indicatorId || "unknown";
    (groups[key] = groups[key] || []).push(row);
  }
  report.elements[id] = {
    records: rows.length,
    population: rates(rows, fields),
    byIndicator: Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, { records: list.length, ...rates(list, fields) }])),
    sample: {
      size: sample.length,
      rates: rates(sample, fields),
      rows: sample.map((row) => ({
        recordId: row.recordId,
        name: row.name,
        indicatorId: row.indicatorId,
        ...Object.fromEntries(Object.entries(fields).map(([field, keys]) => [field, keys.map((key) => row.normalizedAttributes?.[key]).find(filled) ?? null])),
      })),
    },
    missingReasons: id === "A-023" ? missingReasons(rows) : null,
  };
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
for (const [id, item] of Object.entries(report.elements)) {
  console.log(id, "population", JSON.stringify(item.population));
  console.log(id, `sample(${item.sample.size})`, JSON.stringify(item.sample.rates));
  if (item.missingReasons) console.log(id, "missing", JSON.stringify(item.missingReasons));
}
