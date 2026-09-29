#!/usr/bin/env node
/**
 * Which 2025 unit each record belongs to, and from which value that was read.
 *
 * Thirteen of the seventeen elements V157 registers state the province inside a
 * value rather than in a column of its own: a project title ("꽝빈성 태양광 발전사업"),
 * a 위치 field, a 대상지역 list. The map builder must not guess that at build
 * time, so the extraction is done here, once, and written out record by record
 * with the column and the exact spelling that matched. The builder then joins on
 * a stated fact, and the QA step can check every row against the source.
 *
 * Column order follows the contract's rule: a column the delivery calls a region
 * wins over the record's own title, which wins over any other descriptive column.
 * An organisation column counts only for records that are organisations, and a URL
 * never counts - "기관 주소를 사업지역으로 전용하지 않음".
 *
 * Usage: node scripts/v157/extract-record-regions-v157.mjs [--ids D-014,D-015]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  countryPublicDirV158,
  repoRootV158,
  resolveCountryIso3V158,
} from "../v158/country-context-v158.mjs";
import { provinceDictionaryV157 } from "./province-dictionary-v157.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const COUNTRY = resolveCountryIso3V158({ argv });
const DATA = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));
const CONTRACT_PATH = resolve(DATA, "map-content-contract-v157.json");
const OUT_DIR = resolve(ROOT, "reports/v157/record-regions");
const REPORT_PATH = resolve(ROOT, "reports/v157/record-regions-v157.json");

const idsArgument = (() => {
  const at = argv.indexOf("--ids");
  return at >= 0 && argv[at + 1] ? argv[at + 1].split(",").map((value) => value.trim()) : null;
})();

const PROVINCES = provinceDictionaryV157(ROOT, DATA);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const contract = readJson(CONTRACT_PATH);

/** Same classification the contract uses, kept in one place per file on purpose. */
const SOURCE_URL_KEYS = /(원문url|url|링크|link)/iu;
const REGION_MEANING_KEYS =
  /(지역|대상지|소재|위치|행정|province|adm1|region|city|주소|address|체계)/iu;
const INSTITUTION_KEYS =
  /(기관|시행|발주|사업자|보고기관|운영기관|실행|수행|소속|orgname|organization|agency|operator|institution)/iu;
const ORGANISATION_RECORD_KEYS =
  /(기관명|orgname|organizationname|companyname|기업명|대학|연구소)/iu;
const IDENTITY_KEYS = /(recordid|elementid|indicatorid|기술코드|수집_기준|근거문구|판단근거)/iu;

function columnKind(key) {
  if (SOURCE_URL_KEYS.test(key)) return "url";
  if (REGION_MEANING_KEYS.test(key)) return "region";
  if (INSTITUTION_KEYS.test(key)) return "institution";
  return "other";
}

/**
 * The units a record states, in the order the columns are trusted. Only the
 * first column that yields a unit is used, so one record is never filed under
 * both its 위치 and the province that happens to appear in its description.
 */
function unitsForRecord(record, recordsAreOrganisations) {
  const attributes = record.normalizedAttributes ?? {};
  const columns = [
    ...Object.keys(attributes)
      .filter((key) => !IDENTITY_KEYS.test(key))
      .map((key) => ({ key, kind: columnKind(key), value: String(attributes[key] ?? "") })),
    { key: "name", kind: "name", value: String(record.name ?? "") },
    { key: "note", kind: "name", value: String(record.note ?? "") },
  ];
  const order = recordsAreOrganisations
    ? ["region", "name", "institution", "other"]
    : ["region", "name", "other"];
  for (const kind of order) {
    const hits = [];
    for (const column of columns.filter((row) => row.kind === kind && row.value.trim())) {
      for (const unit of PROVINCES.matches(column.value)) {
        if (hits.some((row) => row.unitCode34 === unit.unitCode34)) continue;
        hits.push({
          unitCode34: unit.unitCode34,
          name: unit.canonical,
          adm1Codes63: unit.adm1Codes63,
          spelling: unit.spelling,
          column: column.key,
          columnKind: kind,
        });
      }
    }
    if (hits.length > 0) return hits;
  }
  return [];
}

/**
 * The elements V157 registers from an extracted region (사용자 결정 2026-09-29).
 *
 * Declared rather than derived, because the derivation would be circular: the
 * evidence in the contract changes once these layers are published (they gain a
 * spatial layer), so a rule based on it would stop writing the very sidecars the
 * layers are built from. The report below lists any other element whose values
 * mention a province, so a future addition is visible rather than hidden.
 */
const SIDECAR_ELEMENTS_V157 = [
  "C-008",
  "D-012",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-019",
  "D-020",
  "D-021",
  "D-023",
  "D-025",
  "D-026",
  "E-001",
  "E-002",
  "E-020",
];

const rows = contract.rows.filter((row) =>
  idsArgument ? idsArgument.includes(row.elementId) : SIDECAR_ELEMENTS_V157.includes(row.elementId)
);

/** Elements that mention a province in a value but are not registered from one. */
const undeclaredCandidates = contract.rows
  .filter(
    (row) =>
      !SIDECAR_ELEMENTS_V157.includes(row.elementId) &&
      row.criteriaEvidence.entityRows > 0 &&
      row.criteriaEvidence.coordinateRows === 0 &&
      !row.criteriaEvidence.spatialLayer &&
      (Boolean(row.criteriaEvidence.provinceColumn) ||
        row.criteriaEvidence.freeTextProvinceRows > 0)
  )
  .map((row) => ({
    elementId: row.elementId,
    status: row.status,
    column: row.criteriaEvidence.provinceColumn?.column ?? "name/note",
  }));

mkdirSync(OUT_DIR, { recursive: true });
const summary = [];
for (const row of rows) {
  const downloadPath = resolve(DATA, `downloads/${row.elementId}.json`);
  if (!existsSync(downloadPath)) {
    summary.push({ elementId: row.elementId, status: "download-missing" });
    continue;
  }
  const payload = readJson(downloadPath);
  const records = payload.entities ?? [];
  const recordsAreOrganisations = records.some((record) =>
    Object.keys(record.normalizedAttributes ?? {}).some((key) => ORGANISATION_RECORD_KEYS.test(key))
  );
  const byRecordId = {};
  const columnsUsed = new Map();
  const unitsSeen = new Set();
  let located = 0;
  let multiUnit = 0;
  for (const record of records) {
    const units = unitsForRecord(record, recordsAreOrganisations);
    if (units.length === 0) continue;
    located += 1;
    if (units.length > 1) multiUnit += 1;
    units.forEach((unit) => {
      unitsSeen.add(unit.unitCode34);
      columnsUsed.set(unit.column, (columnsUsed.get(unit.column) ?? 0) + 1);
    });
    byRecordId[record.recordId] = units;
  }
  const document = {
    schemaVersion: "record-regions-v157",
    elementId: row.elementId,
    countryIso3: COUNTRY,
    method: "province-dictionary-v157 value match (region column > record title > other; URL never; organisation column only for organisation records)",
    notice:
      "성·시는 원자료 값에 적힌 표기를 사전으로 대응한 결과이며, 표기가 없는 레코드는 지도에 올리지 않습니다. 복수 성 레코드는 각 성에 1건으로 세고 금액·규모는 합산하지 않습니다.",
    recordsAreOrganisations,
    counts: {
      records: records.length,
      located,
      withoutRegion: records.length - located,
      multiUnit,
      units: unitsSeen.size,
    },
    columnsUsed: [...columnsUsed.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([column, count]) => ({ column, records: count })),
    byRecordId,
  };
  const outPath = resolve(OUT_DIR, `${row.elementId.toLowerCase()}.json`);
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  summary.push({
    elementId: row.elementId,
    status: located > 0 ? "extracted" : "no-region-found",
    ...document.counts,
    columnsUsed: document.columnsUsed,
  });
}

const report = {
  schema: "record-regions-v157",
  generatedAt: new Date().toISOString(),
  countryIso3: COUNTRY,
  provinceDictionary: { spellings: PROVINCES.size, units: PROVINCES.unitCount, warnings: PROVINCES.warnings },
  elementCount: summary.length,
  elements: summary,
  undeclaredCandidates,
};
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    elements: summary.length,
    located: summary.reduce((sum, row) => sum + (row.located ?? 0), 0),
    withoutRegion: summary.reduce((sum, row) => sum + (row.withoutRegion ?? 0), 0),
    noRegionFound: summary.filter((row) => row.status !== "extracted").map((row) => row.elementId),
  })}\n`
);
