#!/usr/bin/env node
/**
 * The map content contract: what each selected element shows on the map.
 *
 * The 2026-09-22 전수검토 settled *which* 71 elements belong on the map and what
 * a reader should see on each ("지도에서 확인할 내용"), and the user added A-027 on
 * 2026-09-23 - 72 rows. That table is transcribed in
 * `docs/plan/map-selection-20260922.json`; its `pdfContent` is copied here
 * verbatim, never paraphrased.
 *
 * What the PDF could not settle is the evidence: it lists no criterion code per
 * element, and it does not say which source column carries the region, the
 * coordinate or the description. So this script reads the published data and
 * decides the criteria from the columns that exist:
 *
 *   ① 지역별 비교        a spatial layer keyed by admin1/region/basin with
 *                        numeric values for two or more keys
 *   ② 시설·사업·기관 위치  entity rows carrying a coordinate or a place name, plus
 *                        at least one descriptive attribute besides the name
 *   ③ 지역별 계획·규정·지원 entity rows carrying a region reference together with a
 *                        plan / regulation / support text column
 *
 * The provisional codes from the PDF transcription are kept beside the computed
 * ones (`criteriaProvisional`) and every disagreement is listed in the report,
 * so a reviewer sees where the data and the table differ instead of the script
 * quietly choosing one.
 *
 *   node scripts/v157/build-map-content-contract-v157.mjs [--country vnm] [--check]
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
const CHECK_ONLY = argv.includes("--check");
const COUNTRY = resolveCountryIso3V158({ argv });
const DATA = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));
const SELECTION_PATH = resolve(ROOT, "docs/plan/map-selection-20260922.json");
const V138_CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json");
const PENDING_PATH = resolve(DATA, "spatial/pending-layers-v155.json");
const MAP_INDEX_PATH = resolve(DATA, "map-index.json");
const OUT_PATH = resolve(DATA, "map-content-contract-v157.json");
const REPORT_PATH = resolve(ROOT, "reports/v157/map-content-contract-build-v157.json");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const download = (elementId) => {
  const path = resolve(DATA, "downloads", `${elementId.toLowerCase()}.json`);
  return existsSync(path) ? readJson(path) : null;
};
const spatialLayer = (elementId) => {
  const path = resolve(DATA, "spatial/layers", `${elementId.toLowerCase()}.json`);
  return existsSync(path) ? readJson(path) : null;
};

/** A-027 is the user's 2026-09-23 addition, so its row is declared here. */
const USER_ADDITION_V157 = {
  elementId: "A-027",
  targetName: "교통 인프라(도로·철도)",
  pdfContent: "도로·철도 노선 위치",
  criteriaProvisional: "②",
  note: "사용자 결정 2026-09-23 — 지도 포함(72번째)",
};

/**
 * Attribute names that state a plan or a rule, and ones that only repeat an
 * identifier. The region is NOT looked for by column name: see evidenceFor().
 */
const PLAN_TEXT_KEYS =
  /(목표|규제|지원|계획|조치|내용|조건|인센티브|상한|설명|분류|요건|제도|정책|결의|조항|target|regulation|support|plan|measure|description)/iu;
/** Columns that describe where a point is, which is not plan or rule text. */
const LOCATION_DESCRIPTOR_KEYS = /(위치|좌표|경계|주소|address|coordinate|location)/iu;
/** Columns naming the kind of area a record stands for, and the unit values. */
const SPATIAL_UNIT_KEYS = /(공간_?단위|spatial_?unit|집계단위|단위구분)/iu;
const SPATIAL_UNIT_VALUES = /^(basin|region|province|adm1|unit|district|유역|성|지역|권역)$/iu;
/** Region words that name no boundary: a type of place, not a place. */
const GENERIC_REGION_WORDS =
  /(coastal|delta|midland|highland|mountainous|urban area|rural|삼각주|연안|해안|산간|도시지역|농촌)/iu;
/** Columns that belong in a citation line rather than in the popup body. */
const PROVENANCE_KEYS =
  /(근거문구|판단근거|레코드ID|레코드_키|등록표준|출처|수집_기준|provenance|citation|매핑_근거|기술매핑|연계_근거|원지표ID|사업번호|CRS번호|Rio_Marker|레코드구분|구분태그|38대_기후기술)/iu;
/**
 * What a popup should say, in reading order: what kind of thing it is, how big,
 * when, who runs it, and what the rule says. A column is offered only if the
 * delivery fills it; the order is the reader's, not the spreadsheet's.
 */
const PREFERRED_POPUP_KEYS = [
  /(분야|부문|업종|종류|유형|sector|category)/iu,
  /(용량|규모|출력|면적|금액|예산|약정|지출|대표금액|값$|value)/iu,
  /(기간|기준연도|연도|시점|공고일|약정일|period|year)/iu,
  /(상태|단계|status)/iu,
  /(기관|시행|발주|사업자|보고기관|운영|operator|agency)/iu,
  /(설명|내용|분류|description)/iu,
];
const SOURCE_URL_KEYS = /(원문url|url|링크|link)/iu;
/** Columns naming an organisation, which is not where a project happens. */
const INSTITUTION_KEYS =
  /(기관|시행|발주|사업자|보고기관|운영기관|실행|수행|소속|orgname|organization|agency|operator|institution)/iu;
/** Columns that say, in the delivery's own words, which area a record covers. */
const REGION_MEANING_KEYS =
  /(지역|대상지|소재|위치|행정|province|adm1|region|city|주소|address|체계)/iu;
/** Records that are themselves organisations, so their seat is their location. */
const ORGANISATION_RECORD_KEYS = /(기관명|orgname|organizationname|companyname|기업명|대학|연구소)/iu;

/** A named person's contact details stay off the map popup. */
const PERSONAL_CONTACT_KEYS =
  /(email|phone|fax|mobile|연락처|담당자|deputy|focalpoint|직함)/iu;
/** Values that say "the whole country", which the display rules keep off the map. */
const NATIONWIDE_VALUES = /(^전국|nation(wide)?$|whole country|all provinces)/iu;
/** A region code as the delivery writes it: "VN91" (GSO), not "VN-44" (ISO). */
const REGION_CODE_VALUE = /^VN-?\d{1,2}$/u;
/** Columns that promise a region, used only to report one delivered empty. */
const REGION_FIELD_KEYS = /(지역|행정|province|adm1|region|소재|위치|주소|p_code|pcode)/iu;
const IDENTITY_KEYS = /(recordid|elementid|indicatorid|기술코드|수집_기준|근거문구|판단근거)/iu;

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

const PROVINCES = provinceDictionaryV157(ROOT, DATA);

/**
 * What the published data can prove for one element.
 *
 * The region is read from values, not from column names. A delivery may keep the
 * province inside 명칭 ("꽝빈성 태양광 발전사업"), behind a hashed attribute key
 * ("field_7b638c0f"), or in an observation's indicator id - all three are the
 * same fact for a map, and only the value says which province it is.
 */
function evidenceFor(elementId) {
  const layer = spatialLayer(elementId);
  const payload = download(elementId);
  const entities = payload?.entities ?? [];
  const observations = payload?.observations ?? [];

  const layerValues = Array.isArray(layer?.values) ? layer.values : [];
  // A layer states its own join key; a basin layer compares eight basins by
  // stringId and has no adm1Code at all.
  const joinKey = layer?.joinKey ?? null;
  const regionKeys = new Set(
    layerValues
      .filter((row) => numeric(row.value))
      .map((row) =>
        String(
          (joinKey ? row[joinKey] : null) ??
            row.adm1Code ??
            row.regionCode ??
            row.unitCode ??
            row.stringId ??
            row.key ??
            ""
        )
      )
      .filter(Boolean)
  );

  let coordinateRows = 0;
  let provinceRows = 0;
  let regionScopedTextRows = 0;
  const provinceCodes = new Set();
  const provinceColumns = new Map();
  const descriptiveAttributes = new Set();
  const planAttributes = new Set();
  const regionFieldsSeen = new Set();
  const regionFieldsFilled = new Set();
  const regionCodeColumns = new Set();
  const spatialUnitValues = new Set();
  const organisationRecordColumns = new Set();
  const attributeStats = new Map();
  let nationwideRows = 0;
  const genericRegionRows = new Set();
  let unitScopedRecords = 0;
  let freeTextProvinceRows = 0;
  const freeTextProvinceCodes = new Set();
  const freeTextFields = new Set();
  for (const entity of entities) {
    const attributes = entity.normalizedAttributes ?? {};
    // The region may be stated only in the record's own name or note, which is
    // a mention in prose - enough to place a point, not to compare regions.
    for (const field of ["name", "note"]) {
      const value = String(entity[field] ?? "");
      if (GENERIC_REGION_WORDS.test(value)) genericRegionRows.add(entity.recordId ?? value);
      const hits = PROVINCES.codes(value);
      if (hits.length === 0) continue;
      const seen = provinceColumns.get(field) ?? { rows: 0, codes: new Set(), kind: "name" };
      seen.rows += 1;
      hits.forEach((code) => seen.codes.add(code));
      provinceColumns.set(field, seen);
      freeTextProvinceRows += 1;
      freeTextFields.add(field);
      hits.forEach((code) => freeTextProvinceCodes.add(code));
    }
    const lat = coordinateValueV157(attributes.latitude, attributes.lat, entity.latitude);
    const lon = coordinateValueV157(attributes.longitude, attributes.lon, entity.longitude);
    if (insideCountryV157(lat, lon)) coordinateRows += 1;
    const rowProvinces = new Set();
    let hasPlanText = false;
    let standsForUnit = false;
    let rowIsNationwide = false;
    Object.keys(attributes)
      .filter((key) => REGION_FIELD_KEYS.test(key))
      .forEach((key) => regionFieldsSeen.add(key));
    for (const [key, value] of Object.entries(attributes)) {
      const text = String(value ?? "").trim();
      if (!text) continue;
      if (IDENTITY_KEYS.test(key)) continue;
      descriptiveAttributes.add(key);
      const stat = attributeStats.get(key) ?? { filled: 0, maxLength: 0 };
      stat.filled += 1;
      stat.maxLength = Math.max(stat.maxLength, text.length);
      attributeStats.set(key, stat);
      if (REGION_FIELD_KEYS.test(key)) regionFieldsFilled.add(key);
      if (REGION_FIELD_KEYS.test(key) && NATIONWIDE_VALUES.test(text)) rowIsNationwide = true;
      if (REGION_CODE_VALUE.test(text)) regionCodeColumns.add(key);
      const hits = PROVINCES.codes(text);
      if (hits.length > 0) {
        const kind = SOURCE_URL_KEYS.test(key)
          ? "url"
          : REGION_MEANING_KEYS.test(key)
            ? "region"
            : INSTITUTION_KEYS.test(key)
              ? "institution"
              : "other";
        const seen = provinceColumns.get(key) ?? { rows: 0, codes: new Set(), kind };
        seen.rows += 1;
        hits.forEach((code) => seen.codes.add(code));
        provinceColumns.set(key, seen);
        // A URL that happens to contain a city name is not a region statement.
        if (kind !== "url") hits.forEach((code) => rowProvinces.add(code));
      }
      if (ORGANISATION_RECORD_KEYS.test(key)) organisationRecordColumns.add(key);
      if (SPATIAL_UNIT_KEYS.test(key) && SPATIAL_UNIT_VALUES.test(text)) {
        standsForUnit = true;
        spatialUnitValues.add(text.toLowerCase());
      }
      if (GENERIC_REGION_WORDS.test(text)) genericRegionRows.add(entity.recordId ?? text);
      if (
        PLAN_TEXT_KEYS.test(key) &&
        !LOCATION_DESCRIPTOR_KEYS.test(key) &&
        text.length >= 4
      ) {
        hasPlanText = true;
        planAttributes.add(key);
      }
    }
    if (standsForUnit) unitScopedRecords += 1;
    if (rowIsNationwide) nationwideRows += 1;
    if (rowProvinces.size > 0) {
      provinceRows += 1;
      rowProvinces.forEach((code) => provinceCodes.add(code));
      if (hasPlanText) regionScopedTextRows += 1;
    }
  }

  // Province-keyed observations state the region in the indicator id or the note
  // ("D-008_climate_budget_quang_nam"), with the measured value beside it.
  let observationProvinceRows = 0;
  const observationProvinceCodes = new Set();
  for (const row of observations) {
    if (!numeric(row.value)) continue;
    const hits = [
      ...PROVINCES.codes(String(row.indicatorId ?? "").replace(/[_-]/gu, " ")),
      ...PROVINCES.codes(String(row.regionLabel ?? row.note ?? "")),
    ];
    if (hits.length === 0) continue;
    observationProvinceRows += 1;
    hits.forEach((code) => observationProvinceCodes.add(code));
  }

  const columnCandidates = [...provinceColumns.entries()]
    .map(([column, seen]) => ({
      column,
      rows: seen.rows,
      codeCount: seen.codes.size,
      kind: seen.kind,
    }))
    .sort((left, right) => right.rows - left.rows);
  const recordsAreOrganisations = organisationRecordColumns.size > 0;
  const ORDER = recordsAreOrganisations
    ? ["region", "name", "institution", "other"]
    : ["region", "name", "other"];
  const chosenColumn =
    ORDER.map((kind) => columnCandidates.find((row) => row.kind === kind)).find(Boolean) ?? null;
  // Province codes that survive the column choice: a URL never counts, and an
  // organisation column counts only for records that are organisations.
  const allowedColumns = new Set(
    columnCandidates.filter((row) => ORDER.includes(row.kind)).map((row) => row.column)
  );
  return {
    spatialLayer: layer
      ? {
          joinKey: layer.joinKey ?? null,
          boundarySystem: layer.boundarySystem ?? null,
          coverageKind: layer.coverageKind ?? null,
          geometryUrl: layer.geometryUrl ?? null,
          regionKeyCount: regionKeys.size,
          valueRows: layerValues.length,
        }
      : null,
    entityRows: entities.length,
    observationRows: observations.length,
    coordinateRows,
    provinceRows,
    provinceCodeCount: chosenColumn ? chosenColumn.codeCount : 0,
    provinceColumn: chosenColumn,
    provinceColumnCandidates: columnCandidates,
    recordsAreOrganisations,
    rejectedRegionColumns: columnCandidates
      .filter((row) => !allowedColumns.has(row.column))
      .map((row) => ({ column: row.column, kind: row.kind, rows: row.rows })),
    observationProvinceRows,
    observationProvinceCodeCount: observationProvinceCodes.size,
    regionScopedTextRows,
    descriptiveAttributeCount: descriptiveAttributes.size,
    planAttributes: [...planAttributes].sort(),
    freeTextProvinceRows,
    freeTextProvinceCodeCount: freeTextProvinceCodes.size,
    freeTextFields: [...freeTextFields].sort(),
    // A column the delivery declares but never fills: a provider defect, not a
    // missing map asset, so it is reported as its own status.
    // Recorded, not joined on: the code system differs from the geometry's.
    regionCodeColumns: [...regionCodeColumns].sort(),
    // Records that stand for an area (a basin, a region) rather than for one site.
    unitScopedRecords,
    spatialUnitValues: [...spatialUnitValues].sort(),
    genericRegionRows: genericRegionRows.size,
    // Rows whose region is "전국": kept in the table, left off the map.
    nationwideRows,
    attributeStats: Object.fromEntries(
      [...attributeStats.entries()].map(([key, stat]) => [key, stat])
    ),
    emptyRegionFields: [...regionFieldsSeen]
      .filter((key) => !regionFieldsFilled.has(key))
      .sort(),
  };
}

/** Regions the element can be compared across, whichever source names them. */
function comparableRegionCount(evidence) {
  return Math.max(
    evidence.spatialLayer?.regionKeyCount ?? 0,
    evidence.observationProvinceCodeCount,
    evidence.provinceCodeCount,
    // A point layer whose points each stand for a basin compares those basins.
    evidence.unitScopedRecords
  );
}

/**
 * The three selection criteria, decided from the data rather than from the PDF:
 *   ① the same measure in two or more regions,
 *   ② a place plus something said about what is there,
 *   ③ a region and a plan/rule/support text on the same row.
 */
function criteriaFrom(evidence) {
  const criteria = [];
  if (comparableRegionCount(evidence) >= 2) criteria.push("①");
  if (
    (evidence.coordinateRows > 0 ||
      evidence.provinceRows > 0 ||
      evidence.freeTextProvinceRows > 0) &&
    evidence.descriptiveAttributeCount >= 2
  ) {
    criteria.push("②");
  }
  if (evidence.regionScopedTextRows > 0) criteria.push("③");
  return criteria;
}

/**
 * Where a target the data cannot map is shown instead (사용자 결정 2026-09-29).
 *
 * `form` follows the 기획표: A = 레이어 선택 시 우측 패널 카드, B = 지역 패널
 * '전국 기준값' 줄, C = 팝업 보강 1~2줄. `role` marks the layer a reader reaches
 * first. Nothing here draws the value on the map; that is the point.
 */
const COMPANION_PLACEMENTS_V157 = {
  "B-002": [{ elementId: "B-003", role: "primary", form: "A", note: "기후대 국가 면적 구성을 기후 레이어 옆 카드로" }],
  "B-024": [{ elementId: "B-017", role: "primary", form: "A", note: "농업용수 대리지표 국가값을 물 스트레스 레이어 옆 카드로" }],
  "B-035": [{ elementId: "B-037", role: "primary", form: "A", note: "토지이용 면적 국가값을 토지피복 레이어 옆 카드로" }],
  "B-036": [{ elementId: "B-037", role: "primary", form: "A", note: "토지이용 변화율 국가값을 토지피복 레이어 옆 카드로" }],
  "B-044": [
    {
      elementId: "B-048",
      role: "primary",
      form: "C",
      note: "광종이 일치하는 광산 팝업에 부존 1줄, 일치하지 않는 광종은 패널 카드",
      matchOn: "광종",
    },
  ],
  "B-046": [
    {
      elementId: "B-048",
      role: "primary",
      form: "C",
      note: "광종이 일치하는 광산 팝업에 매장량 1줄, 일치하지 않는 광종은 패널 카드",
      matchOn: "광종",
    },
  ],
  "B-047": [
    {
      elementId: "B-048",
      role: "primary",
      form: "C",
      note: "광종이 일치하는 광산 팝업에 생산량 1줄, 일치하지 않는 광종은 패널 카드",
      matchOn: "광종",
    },
  ],
  "A-013": [
    {
      elementId: "B-012",
      role: "primary",
      form: "A",
      note: "NDC 원문 인용 카드만 — 경계·좌표를 만들지 않음",
      quotationOnly: true,
    },
    {
      elementId: "B-008",
      role: "secondary",
      form: "A",
      note: "해수면 상승 관련 NDC 조치 인용 카드",
      quotationOnly: true,
    },
  ],
  "C-003": [{ elementId: "C-016", role: "primary", form: "A", note: "국가적응계획 지역과제를 지역계획 레이어 옆 카드로(지역 열 재납품 시 승격)" }],
  "C-017": [{ elementId: "C-016", role: "primary", form: "A", note: "지역 발전가격·지원을 지역계획 레이어 옆 카드로(지역 열 재납품 시 승격)" }],
  "C-006": [{ elementId: "C-025", role: "primary", form: "A", note: "JCM 사업 현황을 크레딧 레이어 옆 카드로(사업지역 확인 시 승격)" }],
  "A-022": [
    {
      elementId: "A-024",
      role: "primary",
      form: "A",
      note: "EVN 관할표 완성 전까지 송전망 레이어 옆 국가값 카드(MAIFI·SAIDI)",
    },
  ],
};

const selection = readJson(SELECTION_PATH);
const v138 = new Map(readJson(V138_CONTRACT_PATH).targets.map((row) => [row.elementId, row]));
const pending = new Map(
  (readJson(PENDING_PATH).layers ?? []).map((row) => [row.elementId, row])
);
const mapIndexLayers = new Map(
  readJson(MAP_INDEX_PATH).layers.map((row) => [row.elementId, row])
);
const registered = new Set(mapIndexLayers.keys());

/** The country's bbox, so a coordinate can be told from a placeholder zero. */
const COUNTRY_BBOX = (() => {
  const registry = readJson(resolve(ROOT, "public/data/countries.json"));
  const entry = registry.countries.find((row) => row.iso3 === COUNTRY);
  return entry?.bbox ?? null;
})();

function insideCountryV157(lat, lon) {
  if (!numeric(lat) || !numeric(lon)) return false;
  if (!COUNTRY_BBOX) return lat !== 0 || lon !== 0;
  const [west, south, east, north] = COUNTRY_BBOX;
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

/** A coordinate the delivery actually carries: null and "" are not zero. */
function coordinateValueV157(...candidates) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

const items = [...selection.items, USER_ADDITION_V157];

/**
 * The geometry a row is drawn with. Known assets decide it; where no asset is
 * published yet the row says what it needs instead of guessing a shape.
 */
function geometryFor(elementId, evidence) {
  const existing = v138.get(elementId);
  // A live layer keeps its published shape; a pending asset only decides the shape
  // of a row that has none yet (B-008 is registered as points AND has a pending
  // sea-level polygon - the registered shape is the one the contract states).
  if (existing?.representation && existing.representation !== "none") {
    return { geometry: existing.representation, source: "publicMapTargetsV138" };
  }
  if (pending.has(elementId)) {
    const layer = pending.get(elementId);
    return {
      geometry: layer.renderer ?? layer.representation ?? "pending-asset",
      source: "pending-layers-v155",
    };
  }
  if (evidence.spatialLayer?.boundarySystem === "six-region") {
    return { geometry: "six-region", source: "spatial-layer" };
  }
  if ((evidence.spatialLayer?.regionKeyCount ?? 0) >= 2) {
    return { geometry: "adm1-34", source: "spatial-layer" };
  }
  if (evidence.coordinateRows > 0) return { geometry: "point-facility", source: "entity-coordinates" };
  // No layer yet, but the values name enough provinces to paint the 34 units.
  if (evidence.observationProvinceCodeCount >= 2) {
    return { geometry: "adm1-34", source: "observation-province-values" };
  }
  if (evidence.provinceCodeCount >= 2) {
    return { geometry: "adm1-34", source: "entity-province-values" };
  }
  if (evidence.provinceRows > 0) {
    return { geometry: "adm1-34", source: "entity-province-values" };
  }
  if (evidence.freeTextProvinceCodeCount > 0) {
    return { geometry: "adm1-34", source: "record-text-province-mention" };
  }
  return { geometry: null, source: "undetermined" };
}

/** True when the only region evidence was a province named in prose. */
function geometrySourceIsFreeTextV157(geometry, evidence) {
  return (
    Boolean(geometry) &&
    evidence.spatialLayer === null &&
    evidence.coordinateRows === 0 &&
    evidence.provinceCodeCount === 0 &&
    evidence.observationProvinceCodeCount === 0 &&
    evidence.freeTextProvinceCodeCount > 0
  );
}

function statusFor(elementId, geometry, evidence) {
  if (registered.has(elementId)) return { status: "registered", reason: null };
  if (pending.has(elementId)) return { status: "pending-registration", reason: "P6b 이관 대상" };
  if (elementId === "A-028") {
    return { status: "held", reason: "원자료 공개 보류(사용자 결정) — OSM 참고 레이어만" };
  }
  if (elementId === "A-026") return { status: "asset-missing", reason: "건물 풋프린트 자산 미확보" };
  if (elementId === "A-022") {
    return {
      status: "reference-mapping-pending",
      reason:
        "EVN 그룹 전체 값만 존재 — 5개 총공사 관할표(tools/etl/countries/vnm/evn-jurisdiction.json, 성별 출처 URL 필수)를 만든 뒤 표출",
    };
  }
  if (elementId === "C-006") {
    return { status: "data-pending", reason: "사업지역 세분화 전 — 성 단위 가능하면 등록" };
  }
  if (!geometry) {
    // Three different facts used to share one status. Each says what would have
    // to change - a re-delivery, a new asset, or a citation - to map the row.
    if (evidence.entityRows === 0 && evidence.observationRows > 0) {
      return {
        status: "national-only",
        reason: "원자료가 국가 단위 값만 제공 — 성·시 분해 없음(제공자 재납품 필요)",
      };
    }
    if (evidence.emptyRegionFields.length > 0) {
      // The columns are named in criteriaEvidence.emptyRegionFields and in the
      // re-delivery request; the status says the fact without the internal keys.
      return {
        status: "region-fields-empty",
        reason: `지역 열은 있으나 값이 전무 — 지역 열 ${evidence.emptyRegionFields.length}개가 모두 비어 있음(제공자 재납품 필요)`,
      };
    }
    if (evidence.genericRegionRows > 0) {
      return {
        status: "region-text-generic",
        reason:
          "지역이 성·시 이름이 아니라 원문의 일반 지역어(coastal·delta 등)로만 등장 — 경계 지정 불가(임의 경계 생성 금지)",
      };
    }
    return { status: "asset-missing", reason: "지역 키·좌표·지명 중 어느 것도 원자료에서 확인되지 않음" };
  }
  if (geometrySourceIsFreeTextV157(geometry, evidence)) {
    return {
      status: "text-region-only",
      reason: "지역이 코드가 아니라 레코드 본문 지명으로만 등장 — 원문 인용과 함께만 표출",
    };
  }
  return { status: "candidate", reason: "V157에서 신규 등록 대상" };
}

/**
 * A pending element's map evidence lives in its V155 asset, not in the tabular
 * download: the download only records the shapefile's feature count and CRS.
 */
function pendingEvidenceV157(elementId, evidence) {
  const layer = pending.get(elementId);
  if (!layer) return evidence;
  return {
    ...evidence,
    pendingLayer: {
      layerId: layer.layerId,
      renderer: layer.renderer ?? null,
      joinKey: layer.joinKey ?? null,
      geometryUrl: layer.geometryUrl ?? null,
      geometryTypes: layer.geometryTypes ?? [],
      featureCount: layer.featureCount ?? null,
      boundaryPolicy: layer.boundaryPolicy ?? null,
    },
  };
}

/** The criteria a pending asset proves on its own. */
function pendingCriteriaV157(elementId, criteria) {
  const layer = pending.get(elementId);
  if (!layer) return criteria;
  const merged = new Set(criteria);
  // A choropleth over assessment units is a comparison between places; a line or
  // point layer is a located feature with a label beside it.
  if (layer.mapMode === "choropleth" && (layer.featureCount ?? 0) >= 2) merged.add("①");
  const types = (layer.geometryTypes ?? []).join(",");
  if (/Line|Point/iu.test(types) && (layer.featureCount ?? 0) >= 1) merged.add("②");
  return [...merged].sort();
}

/**
 * The popup's fields, in reading order: what it is, where it is, the value, when,
 * and where the value came from. Only columns the delivery fills for at least
 * half of its records are promised; a thinner column would leave the popup blank.
 */
/**
 * A label the screen may print, or none.
 *
 * The delivery's Korean column name is used as it stands, without its ordinal
 * prefix. An English or hashed key gets no label: publicFieldPolicyV126 must
 * gain one first, and the build report lists which.
 */
const PUBLIC_FIELD_LABELS_V126 = (() => {
  const source = readFileSync(
    resolve(ROOT, "src/data/visualization/publicFieldPolicyV126.ts"),
    "utf8"
  );
  const table = source.slice(source.indexOf("PUBLIC_ENTITY_ATTRIBUTE_LABELS_V126"));
  const body = table.slice(table.indexOf("{"), table.indexOf("};") + 1);
  return new Map(
    [...body.matchAll(/^\s*"?([A-Za-z0-9_]+)"?:\s*"([^"]+)",/gmu)].map((row) => [row[1], row[2]])
  );
})();

/** Keys whose meaning is fixed by the layer schema, not by a delivery column. */
const SCHEMA_FIELD_LABELS_V157 = {
  adm1Name: "지역",
  adm1Name34: "지역(34개 기준)",
  adm1Code63: "지역코드(개편 전 63)",
  value: "값",
  unit: "단위",
  period: "시점",
  variable: "지표",
  projectTitle: "사업명",
  participatingCountries: "참여국",
  officialSource: "공식 출처",
  publicSpatialNotice: "공간 정보 안내",
};

function fieldLabelV157(key) {
  const schema = SCHEMA_FIELD_LABELS_V157[key];
  if (schema) return { label: schema, labelSource: "layer-schema" };
  const published = PUBLIC_FIELD_LABELS_V126.get(key);
  if (published) return { label: published, labelSource: "publicFieldPolicyV126" };
  const ordinal = /^속성\d+_(.+)$/u.exec(key);
  if (ordinal) {
    return { label: ordinal[1].replace(/_/gu, " "), labelSource: "column-name-without-ordinal" };
  }
  if (/[가-힣]/u.test(key)) return { label: key.replace(/_/gu, " "), labelSource: "column-name" };
  return { label: null, labelSource: "pending-publicFieldPolicyV126" };
}

/**
 * The fields a published or pending layer already declares, with its own labels.
 * V157 does not re-label a live popup; it only fills the rows that have none.
 */
function declaredPopupFieldsV157(layer, origin) {
  const declared = Array.isArray(layer?.tooltipFields) ? layer.tooltipFields : [];
  if (declared.length === 0) return null;
  const labels = layer.fieldLabels ?? {};
  const fields = declared.map((key) => {
    if (labels[key]) return { key, label: labels[key], labelSource: origin, source: origin };
    if (key === "name") return { key, label: "명칭", labelSource: "contract", source: origin };
    return { key, ...fieldLabelV157(key), source: origin };
  });
  return [
    ...fields,
    { key: "provenance.sourceOrg", label: "출처", labelSource: "contract", source: "provenance" },
  ];
}

function popupFieldsV157(evidence, criteria, layers) {
  const declared =
    declaredPopupFieldsV157(layers.indexLayer, "map-index") ??
    declaredPopupFieldsV157(layers.pendingLayer, "pending-layers-v155");
  if (declared) return declared;
  if (evidence.entityRows === 0) return [];
  const stats = evidence.attributeStats ?? {};
  const half = Math.max(1, Math.ceil(evidence.entityRows / 2));
  const filled = (key) => (stats[key]?.filled ?? 0) >= half;
  const fields = [
    { key: "name", label: "명칭", labelSource: "contract", source: "entity.name" },
  ];
  const regionColumn = evidence.provinceColumn?.column ?? null;
  if (regionColumn && regionColumn !== "명칭" && regionColumn !== "name") {
    fields.push({
      key: regionColumn,
      label:
        evidence.provinceColumn?.kind === "institution"
          ? "기관 소재지"
          : LOCATION_DESCRIPTOR_KEYS.test(regionColumn)
            ? "위치"
            : "지역",
      labelSource: "contract",
      source: "normalizedAttributes",
      note: "기관 주소를 사업지역으로 전용하지 않음",
    });
  } else if (regionColumn || evidence.freeTextProvinceRows > 0) {
    // The province is inside the record's title ("꽝빈성 태양광 발전사업"), so the
    // popup shows the title and says the region was read from it.
    fields.push({
      key: regionColumn ?? "name",
      label: "지역(레코드명에서 추출)",
      labelSource: "contract",
      source: "normalizedAttributes",
      note: "성·시 이름이 사업명 안에만 있어 사업명을 함께 표시",
    });
  }
  const offered = Object.keys(stats).filter(
    (key) =>
      filled(key) &&
      !PROVENANCE_KEYS.test(key) &&
      !SOURCE_URL_KEYS.test(key) &&
      !LOCATION_DESCRIPTOR_KEYS.test(key) &&
      !PERSONAL_CONTACT_KEYS.test(key) &&
      key !== evidence.provinceColumn?.column
  );
  const chosen = [];
  for (const pattern of PREFERRED_POPUP_KEYS) {
    const match = offered.find((key) => pattern.test(key) && !chosen.includes(key));
    if (match) chosen.push(match);
    if (chosen.length === 4) break;
  }
  // Nothing recognisable: fall back to the columns the delivery fills most.
  if (chosen.length < 3) {
    offered
      .filter((key) => !chosen.includes(key))
      .sort((left, right) => (stats[right].filled ?? 0) - (stats[left].filled ?? 0))
      .slice(0, 3 - chosen.length)
      .forEach((key) => chosen.push(key));
  }
  const body = chosen.map((key) => ({
    key,
    ...fieldLabelV157(key),
    source: "normalizedAttributes",
  }));
  const planText = evidence.planAttributes.find((key) => filled(key));
  if (criteria.includes("③") && planText && !body.some((field) => field.key === planText)) {
    body.push({
      key: planText,
      label: "적용 내용",
      labelSource: "contract",
      source: "normalizedAttributes",
    });
  }
  const sourceUrl = Object.keys(stats).find((key) => SOURCE_URL_KEYS.test(key) && filled(key));
  return [
    ...fields,
    ...body,
    ...(sourceUrl
      ? [{ key: sourceUrl, label: "원문", labelSource: "contract", source: "normalizedAttributes" }]
      : []),
    { key: "provenance.sourceOrg", label: "출처", labelSource: "contract", source: "provenance" },
  ];
}

/**
 * The region panel's fields for a row that compares regions: which unit, which
 * measure, the value with its unit, the period, and how the value was obtained -
 * a measurement and a proxy must not read the same.
 */
const REGION_MAP_MODES_V157 = /(choropleth|polygon|region)/iu;

function regionPanelFieldsV157(evidence, criteriaPrimary, geometry, layers) {
  // A layer that paints areas states its own unit, join key and aggregation; the
  // panel follows that declaration rather than assuming adm1.
  const areaLayer =
    (REGION_MAP_MODES_V157.test(layers.indexLayer?.mapMode ?? "") && layers.indexLayer) ||
    (REGION_MAP_MODES_V157.test(layers.pendingLayer?.mapMode ?? "") && layers.pendingLayer) ||
    null;
  if (areaLayer) {
    const origin = areaLayer === layers.indexLayer ? "map-index" : "pending-layers-v155";
    const defaultVariable = (areaLayer.selectors?.variables ?? [])[0] ?? null;
    return [
      {
        key: areaLayer.joinKey ?? "adm1Code",
        label: areaLayer.aggregationLevel === "aqueduct40-unit" ? "평가구역" : "지역",
        labelSource: "contract",
        source: origin,
      },
      {
        key: "variable",
        label: "지표",
        labelSource: "contract",
        source: origin,
        note: defaultVariable ? `기본 선택: ${defaultVariable.label ?? defaultVariable.key}` : undefined,
      },
      { key: "value", label: "값", labelSource: "contract", source: origin },
      {
        key: "unit",
        label: "단위",
        labelSource: "contract",
        source: origin,
        note: areaLayer.unit ? `계약 단위: ${areaLayer.unit}` : undefined,
      },
      { key: "period", label: "시점", labelSource: "contract", source: origin },
      {
        key: "aggregation",
        label: "집계 방식",
        labelSource: "contract",
        source: origin,
        note:
          typeof areaLayer.boundaryPolicy === "object" && areaLayer.boundaryPolicy?.note
            ? areaLayer.boundaryPolicy.note
            : "모형·추정·대리지표를 구분해 표기",
      },
      { key: "provenance.sourceOrg", label: "출처", labelSource: "contract", source: "provenance" },
    ];
  }
  // Only a row that is drawn as a region comparison gets a region panel. A
  // project list whose province came from its title must not be summed per
  // province - "복수지역 총량·중복사업의 중복합산 금지".
  const drawsRegions =
    criteriaPrimary === "①" ||
    Boolean(evidence.spatialLayer) ||
    evidence.observationProvinceCodeCount >= 2;
  if (!drawsRegions) return [];
  if (geometry !== "adm1-34" && geometry !== "six-region" && !evidence.spatialLayer) {
    // A point layer can still be a comparison when each point stands for an
    // area: eight river basins, compared at their gauging stations.
    if (evidence.unitScopedRecords < 2) return [];
    return [
      {
        key: "지점_유역명",
        label: "단위(지점·유역)",
        labelSource: "contract",
        source: "normalizedAttributes",
      },
      { key: "지표명", label: "지표", labelSource: "contract", source: "normalizedAttributes" },
      { key: "값", label: "값", labelSource: "contract", source: "normalizedAttributes" },
      { key: "단위", label: "단위", labelSource: "contract", source: "normalizedAttributes" },
      { key: "기준연도", label: "시점", labelSource: "contract", source: "normalizedAttributes" },
      { key: "provenance.sourceOrg", label: "출처", labelSource: "contract", source: "provenance" },
    ];
  }
  const layer = evidence.spatialLayer;
  return [
    { key: "adm1Name", label: "지역", labelSource: "contract", source: layer ? "spatial-layer" : "alias-lookup" },
    { key: "variableLabel", label: "지표", labelSource: "contract", source: layer ? "spatial-layer" : "indicator" },
    { key: "value", label: "값", labelSource: "contract", source: layer ? "spatial-layer" : "observations" },
    { key: "unit", label: "단위", labelSource: "contract", source: layer ? "spatial-layer" : "observations" },
    { key: "period", label: "시점", labelSource: "contract", source: layer ? "spatial-layer" : "observations" },
    {
      key: "mappingMethod",
      label: "산출 방법",
      labelSource: "contract",
      source: layer ? "spatial-layer" : "contract",
      note: "모형·추정·대리지표를 구분해 표기",
    },
    { key: "provenance.sourceOrg", label: "출처", labelSource: "contract", source: "provenance" },
  ];
}

const rows = items
  .map((item) => {
    const evidence = pendingEvidenceV157(item.elementId, evidenceFor(item.elementId));
    const criteria = pendingCriteriaV157(item.elementId, criteriaFrom(evidence));
    const { geometry, source: geometrySource } = geometryFor(item.elementId, evidence);
    const { status, reason } = statusFor(item.elementId, geometry, evidence);
    const existing = v138.get(item.elementId);
    const indexLayer = mapIndexLayers.get(item.elementId) ?? null;
    const layers = { indexLayer, pendingLayer: pending.get(item.elementId) ?? null };
    // The criterion the row is drawn for: the 전수검토 code when the data supports
    // it, otherwise the strongest criterion the data does support.
    const criteriaPrimary = criteria.includes(item.criteriaProvisional)
      ? item.criteriaProvisional
      : (criteria[0] ?? null);
    return {
      elementId: item.elementId,
      targetName: item.targetName,
      // Copied from the 전수검토 table, word for word.
      pdfContent: item.pdfContent,
      criteria,
      criteriaProvisional: item.criteriaProvisional,
      criteriaEvidence: { ...evidence, attributeStats: undefined },
      criteriaAgreesWithPdf: criteria.includes(item.criteriaProvisional),
      // The criterion the row is drawn for: the 전수검토 code when the data
      // supports it, otherwise the strongest criterion the data does support.
      criteriaPrimary,
      geometry,
      geometrySource,
      // A registered layer's policy is whatever map-index already publishes; V157
      // must not quietly change how a live layer aggregates.
      boundaryPolicy:
        indexLayer?.boundaryPolicy ??
        pending.get(item.elementId)?.boundaryPolicy ??
        evidence.spatialLayer?.boundarySystem ??
        (geometry === "adm1-34" ? "post-2025-34" : geometry === "six-region" ? "six-region-only" : null),
      publishedLayer: indexLayer
        ? {
            layerId: indexLayer.layerId,
            mapMode: indexLayer.mapMode ?? null,
            renderer: indexLayer.renderer ?? null,
            coordinateMeaning: indexLayer.coordinateMeaning ?? null,
            spatialScopeType: indexLayer.spatialScopeType ?? null,
            aggregationLevel: indexLayer.aggregationLevel ?? null,
            unit: indexLayer.unit ?? null,
          }
        : null,
      sourceColumns: {
        region:
          evidence.spatialLayer?.joinKey ??
          evidence.provinceColumn?.column ??
          (evidence.observationProvinceRows > 0 ? "observations.indicatorId" : null),
        regionColumnKind: evidence.provinceColumn?.kind ?? null,
        regionRows:
          evidence.provinceColumn?.rows ??
          (evidence.observationProvinceRows > 0 ? evidence.observationProvinceRows : 0),
        // The delivery's own code column, kept for verification only: it is a GSO
        // number and the geometry is keyed by the ISO code, so the builder
        // resolves the region NAME through vnm-adm1-aliases.json.
        regionCodeColumns: evidence.regionCodeColumns,
        regionJoinMethod: evidence.spatialLayer?.joinKey
          ? "published-layer-join-key"
          : evidence.provinceColumn || evidence.freeTextProvinceRows > 0
            ? "alias-lookup(vnm-adm1-aliases.json)"
            : evidence.observationProvinceRows > 0
              ? "indicator-id-province-name"
              : null,
        planText: evidence.planAttributes,
        legacyFields: existing?.sourceFields ?? [],
      },
      popupFields: popupFieldsV157(evidence, criteria, layers),
      regionPanelFields: regionPanelFieldsV157(evidence, criteriaPrimary, geometry, layers),
      caveats: [
        ...(item.note ? [item.note] : []),
        ...(evidence.spatialLayer?.coverageKind === "partial"
          ? ["일부 지역만 값이 있어 부분 표출"]
          : []),
        ...(evidence.nationwideRows > 0
          ? [`전국 공통 ${evidence.nationwideRows}건은 지도에서 제외(표·목록에는 유지)`]
          : []),
        ...(indexLayer?.coordinateMeaning === "source-region-value" ||
        evidence.unitScopedRecords > 0
          ? ["좌표는 지역 대표점이므로 실제 시설·경로 위치와 구분해 표기"]
          : []),
        ...(evidence.regionCodeColumns.length > 0
          ? [
              `원자료 지역코드(${evidence.regionCodeColumns.join(", ")})는 GSO 번호 체계로, 경계 자산의 ISO 코드와 직접 대조하지 않고 지명 별칭표로 조인`,
            ]
          : []),
      ],
      status,
      statusReason: reason,
      // A target the data cannot map travels with the layer a reader would open.
      companionLayers: COMPANION_PLACEMENTS_V157[item.elementId] ?? [],
    };
  })
  .sort((left, right) => left.elementId.localeCompare(right.elementId));

const contract = {
  schemaVersion: "map-content-contract-v157",
  countryIso3: COUNTRY,
  generatedAt: new Date().toISOString(),
  generator: "scripts/v157/build-map-content-contract-v157.mjs",
  source: {
    selection: "docs/plan/map-selection-20260922.json",
    pdf: "output/pdf/베트남_데이터_지도표출_선정결과_전수검토_20260922.pdf",
    userAddition: "A-027 (2026-09-23)",
  },
  criteria: selection.criteria,
  displayRules: selection.displayRules,
  rowCount: rows.length,
  rows,
};

const previous = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
// The timestamp alone is not a change: --check has to pass on an unchanged tree,
// and a rebuild must not rewrite the file just to move the clock forward.
const previousDocument = previous ? JSON.parse(previous) : null;
const sameContent =
  previousDocument !== null &&
  JSON.stringify({ ...previousDocument, generatedAt: null }) ===
    JSON.stringify({ ...contract, generatedAt: null });
if (sameContent) contract.generatedAt = previousDocument.generatedAt;
const text = `${JSON.stringify(contract, null, 2)}\n`;
const changed = previous !== text;
if (!CHECK_ONLY) {
  mkdirSync(resolve(ROOT, "reports/v157"), { recursive: true });
  writeFileSync(OUT_PATH, text, "utf8");
}

const MAPPED_STATUSES_V157 = new Set(["registered", "pending-registration", "candidate"]);
const withoutCompanion = rows
  .filter((row) => !MAPPED_STATUSES_V157.has(row.status) && row.companionLayers.length === 0)
  .map((row) => row.elementId);
if (withoutCompanion.length > 0) {
  throw new Error(`UNMAPPED_TARGET_WITHOUT_COMPANION: ${withoutCompanion.join(", ")}`);
}

const byStatus = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});
const disagreements = rows
  .filter((row) => !row.criteriaAgreesWithPdf)
  .map((row) => ({
    elementId: row.elementId,
    targetName: row.targetName,
    pdf: row.criteriaProvisional,
    computed: row.criteria,
    status: row.status,
    statusReason: row.statusReason,
    evidence: {
      regionKeys: row.criteriaEvidence.spatialLayer?.regionKeyCount ?? 0,
      coordinateRows: row.criteriaEvidence.coordinateRows,
      observationProvinces: row.criteriaEvidence.observationProvinceCodeCount,
      entityProvinces: row.criteriaEvidence.provinceCodeCount,
      descriptiveAttributes: row.criteriaEvidence.descriptiveAttributeCount,
      regionScopedTextRows: row.criteriaEvidence.regionScopedTextRows,
    },
  }));
const report = {
  schema: "map-content-contract-build-v157",
  generatedAt: contract.generatedAt,
  country: COUNTRY,
  rowCount: rows.length,
  // The dictionary the region evidence was read with, and its self-checks.
  provinceDictionary: {
    spellings: PROVINCES.size,
    units: PROVINCES.unitCount,
    warnings: PROVINCES.warnings,
  },
  byStatus,
  criteriaCounts: rows.reduce((acc, row) => {
    row.criteria.forEach((code) => {
      acc[code] = (acc[code] || 0) + 1;
    });
    if (row.criteria.length === 0) acc.none = (acc.none || 0) + 1;
    return acc;
  }, {}),
  withoutGeometry: rows.filter((row) => !row.geometry).map((row) => row.elementId),
  // Fields the popup would print with no label yet: publicFieldPolicyV126 needs
  // an entry for each before the UI step can show them.
  companionPlacements: rows
    .filter((row) => row.companionLayers.length > 0)
    .map((row) => ({
      elementId: row.elementId,
      status: row.status,
      companions: row.companionLayers.map((companion) => `${companion.elementId}(${companion.form})`),
    })),
  labelsPending: [
    ...new Set(
      rows.flatMap((row) =>
        [...row.popupFields, ...row.regionPanelFields]
          .filter((field) => field.labelSource === "pending-publicFieldPolicyV126")
          .map((field) => field.key)
      )
    ),
  ].sort(),
  disagreementCount: disagreements.length,
  disagreements,
  changed,
};
if (!CHECK_ONLY) {
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(
  JSON.stringify({
    type: "summary",
    ...report,
    disagreements: undefined,
    out: changed ? "written" : "unchanged",
    mode: CHECK_ONLY ? "check" : "write",
  })
);
if (CHECK_ONLY && changed) {
  console.error(JSON.stringify({ type: "error", reason: "CONTRACT_OUT_OF_DATE" }));
  process.exitCode = 1;
}
