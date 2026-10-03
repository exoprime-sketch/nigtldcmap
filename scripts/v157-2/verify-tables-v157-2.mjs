#!/usr/bin/env node
/**
 * Do the three mapping tables agree with the one document each of them cites?
 *
 * Each table (EVN jurisdiction, the six socio-economic regions, the C-017 price
 * regions) names one official document in its head, with the article the assignment
 * comes from. This checks the whole table against that claim instead of chasing a
 * separate article per row:
 *
 *   - the head states a document, the article/clause, and a URL;
 *   - every one of the 63 provinces is assigned exactly once - no gap, no duplicate;
 *   - the groups are the ones the document defines (5 corporations, 6 regions,
 *     3 price regions);
 *   - the 34-unit view is derived, not asserted: a merged unit belongs to the groups
 *     its member provinces belong to, and is "mixed" exactly when that is more than
 *     one. Values are never split between groups.
 *
 * Writes reports/v157-2/tables-verification-v157-2.json and exits non-zero on any
 * failure, so a table that drifts from its document cannot reach the map.
 *
 * Usage: node scripts/v157-2/verify-tables-v157-2.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const DATA = resolve(ROOT, "public/data/vietnam/v2");
const ETL = resolve(ROOT, "tools/etl/countries/vnm");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const provinces63 = readJson(resolve(DATA, "geometry/vnm-adm1-63.geojson")).features.map(
  (feature) => String(feature.properties.adm1Code)
);
const crosswalk34 = readJson(resolve(ROOT, "reports/v138/map-targets-build-v138.json")).crosswalk34;

const report = { schema: "tables-verification-v157-2", generatedAt: new Date().toISOString(), checks: [] };
const check = (table, name, pass, actual, expected, detail) => {
  report.checks.push({ table, name, status: pass ? "PASS" : "FAIL", actual, expected, ...(detail ? { detail } : {}) });
};

/** The head has to say which document, which article, and where to read it. */
function checkHead(table, head, label) {
  check(table, `${label}_DOCUMENT`, Boolean(head?.document), head?.document ?? null, "a named official document");
  check(table, `${label}_ARTICLE`, Boolean(head?.article || head?.quote), head?.article ?? null, "the article or the quoted clause");
  check(table, `${label}_URL`, /^https?:\/\//u.test(String(head?.url || "")), head?.url ?? null, "a URL");
}

/** Every province assigned once, and only to the groups the document defines. */
function checkCoverage(table, assignments, groups) {
  const seen = new Map();
  for (const row of assignments) {
    seen.set(row.code, (seen.get(row.code) ?? 0) + 1);
  }
  const missing = provinces63.filter((code) => !seen.has(code));
  const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([code]) => code);
  const unknown = assignments.filter((row) => !provinces63.includes(row.code)).map((row) => row.code);
  const strayGroups = [...new Set(assignments.map((row) => row.group))].filter((group) => !groups.includes(group));

  check(table, "COVERS_63_PROVINCES", missing.length === 0 && duplicated.length === 0 && unknown.length === 0,
    { assigned: seen.size, missing, duplicated, unknown }, { assigned: 63, missing: [], duplicated: [], unknown: [] });
  check(table, "GROUPS_FROM_DOCUMENT", strayGroups.length === 0, strayGroups, []);
  return seen;
}

/** The 34-unit view, derived from the member provinces of each merged unit. */
function derive34(assignments) {
  const groupByCode = new Map(assignments.map((row) => [row.code, row.group]));
  return crosswalk34.map((unit) => {
    const groups = [...new Set(unit.memberAdm1Codes.map((code) => groupByCode.get(code)).filter(Boolean))].sort();
    return { unitCode: unit.unitCode ?? unit.key, name: unit.region, groups, status: groups.length > 1 ? "mixed" : "single" };
  });
}

// ---------------------------------------------------------------- EVN (A-022)
{
  const table = "evn-jurisdiction";
  const evn = readJson(resolve(ETL, "evn-jurisdiction.json"));
  checkHead(table, { document: evn.note, article: evn.schema, url: evn.corporations?.[0]?.sourceUrls?.[0] }, "HEAD");
  const corporations = evn.corporations.map((row) => row.id);
  check(table, "FIVE_CORPORATIONS", corporations.length === 5, corporations, "5 retail corporations");
  const assignments = evn.provinces63.map((row) => ({ code: row.adm1Code, group: row.corporation }));
  const seen = checkCoverage(table, assignments, corporations);
  check(table, "EVERY_ROW_CITES_A_SOURCE",
    evn.provinces63.every((row) => /^https?:\/\//u.test(String(row.sourceUrl || ""))),
    evn.provinces63.filter((row) => !/^https?:\/\//u.test(String(row.sourceUrl || ""))).map((row) => row.adm1Code), []);
  report.evn = {
    perCorporation: Object.fromEntries(corporations.map((id) => [id, assignments.filter((row) => row.group === id).length])),
    assigned: seen.size,
    units34: derive34(assignments),
  };
  report.evnMixedUnits34 = report.evn.units34.filter((unit) => unit.status === "mixed");
}

// ------------------------------------------------- six regions (A-013, C-003)
{
  const table = "six-regions";
  const six = readJson(resolve(ETL, "map12/six-regions.json"));
  checkHead(table, six.definition63, "DEF63");
  check(table, "SIX_REGIONS", six.regions.length === 6, six.regions.length, 6);
  const assignments = six.regions.flatMap((region) =>
    (region.provinces63 ?? []).map((code) => ({ code, group: region.key }))
  );
  checkCoverage(table, assignments, six.regions.map((region) => region.key));

  // The table's own 34-unit rows must equal what the 63-province lists imply.
  const derived = new Map(derive34(assignments).map((unit) => [unit.name, unit]));
  const mismatched = (six.units34 ?? []).filter((unit) => {
    const own = derived.get(unit.name);
    if (!own) return true;
    return JSON.stringify([...(unit.regions ?? [])].sort()) !== JSON.stringify(own.groups) || unit.status !== own.status;
  });
  check(table, "UNITS34_DERIVED_FROM_63", mismatched.length === 0,
    mismatched.map((unit) => ({ name: unit.name, stated: unit.regions, status: unit.status, derived: derived.get(unit.name)?.groups })), []);
  check(table, "UNITS34_COUNT", (six.units34 ?? []).length === 34, (six.units34 ?? []).length, 34);
  report.sixRegions = {
    perRegion: Object.fromEntries(six.regions.map((region) => [region.key, (region.provinces63 ?? []).length])),
    mixedUnits34: (six.units34 ?? []).filter((unit) => unit.status === "mixed").map((unit) => unit.name),
    officialDefinition34: six.definition34?.document ?? null,
  };
}

// ------------------------------------------------------- price regions (C-017)
{
  const table = "c017-price-regions";
  const c017 = readJson(resolve(ETL, "map12/c017-price-regions.json"));
  checkHead(table, c017.regionDefinition, "REGION_DEFINITION");
  const groups = ["north", "central", "south"];
  const assignments = c017.provinces63.map((row) => ({ code: row.adm1Code, group: row.region }));
  checkCoverage(table, assignments, groups);
  const counts = Object.fromEntries(groups.map((group) => [group, assignments.filter((row) => row.group === group).length]));
  check(table, "COUNTS_MATCH_TABLE", JSON.stringify(counts) === JSON.stringify(c017.provinces63RegionCounts), counts, c017.provinces63RegionCounts);
  const derived = derive34(assignments);
  report.c017 = { counts, mixedUnits34: derived.filter((unit) => unit.status === "mixed").map((unit) => unit.name) };
}

report.failed = report.checks.filter((row) => row.status === "FAIL");
report.status = report.failed.length === 0 ? "PASS" : "FAIL";
mkdirSync(resolve(ROOT, "reports/v157-2"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/v157-2/tables-verification-v157-2.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    schema: report.schema,
    status: report.status,
    passed: report.checks.length - report.failed.length,
    failed: report.failed.length,
    failedChecks: report.failed.map((row) => `${row.table}:${row.name}`),
    evn: report.evn?.perCorporation,
    sixRegions: report.sixRegions?.perRegion,
    c017: report.c017?.counts,
    mixedUnits34: {
      evn: report.evnMixedUnits34?.map((unit) => unit.name) ?? [],
      sixRegions: report.sixRegions?.mixedUnits34 ?? [],
      c017: report.c017?.mixedUnits34 ?? [],
    },
  })}\n`
);
process.exitCode = report.status === "PASS" ? 0 : 1;
