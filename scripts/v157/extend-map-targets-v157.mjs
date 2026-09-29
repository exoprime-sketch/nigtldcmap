#!/usr/bin/env node
/**
 * The map target contract, extended from 43 rows to the 72 the 전수검토 decided.
 *
 * `publicMapTargetsV138.json` is what the builder builds from and what the map
 * screens read to say which datasets are still waiting. It held the 43 rows of
 * the V138 round. V157 replaces that list with the 72 rows of the 2026-09-22
 * review (71 + A-027), which means:
 *   - the 40 rows the two lists share keep their V138 text and build directives
 *     **verbatim** (asserted here, so a live layer cannot change by accident);
 *   - 32 rows are added, with build directives derived from what the delivery
 *     actually carries (region sidecar, observation dimension, coordinates,
 *     or a prepared V155 asset);
 *   - C-009 · C-010 · C-019 are dropped as map targets, because the review put
 *     them among the 74 non-map datasets. They stay in the catalog and become
 *     companions of the policy layers (V157 3단계).
 *
 * Nothing here invents a value: every row's evidence and period come from the
 * catalog, the download or the region extraction report.
 *
 * Usage: node scripts/v157/extend-map-targets-v157.mjs [--check]
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

const TARGETS_PATH = resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json");
const CONTENT_PATH = resolve(DATA, "map-content-contract-v157.json");
const PENDING_PATH = resolve(DATA, "spatial/pending-layers-v155.json");
const REGION_REPORT = resolve(ROOT, "reports/v157/record-regions-v157.json");
const REPORT_PATH = resolve(ROOT, "reports/v157/map-targets-extend-v157.json");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const targets = readJson(TARGETS_PATH);
const content = readJson(CONTENT_PATH);
const catalog = readJson(resolve(DATA, "catalog.json"));
const pending = new Map((readJson(PENDING_PATH).layers ?? []).map((row) => [row.elementId, row]));
const regionReport = existsSync(REGION_REPORT) ? readJson(REGION_REPORT) : { elements: [] };
const regionByElement = new Map(regionReport.elements.map((row) => [row.elementId, row]));
const catalogByElement = new Map(catalog.elements.map((row) => [row.elementId, row]));
const existingByElement = new Map(targets.targets.map((row) => [row.elementId, row]));

/**
 * Spellings a source uses for a province the boundary asset names differently.
 *
 * WWF's Biodiversity Risk Filter writes "Bac Can", the pre-2003 spelling of the
 * province the asset calls "Bắc Kạn". This is one province under two spellings,
 * declared here so the join is a stated equivalence rather than a silent guess.
 */
const SOURCE_SPELLING_VARIANTS_V157 = {
  "B-009": { "Bac Can": "Bắc Kạn" },
};

/**
 * What the 63->34 note should say for a layer whose unit is not administrative.
 *
 * The shared notes describe administrative aggregation, and the layer's own
 * rendererNote names the renderer and the join key - neither belongs on a public
 * panel. These say, in the reader's terms, why the boundary change does not apply.
 */
const NON_ADMIN_UNIT_NOTES_V157 = {
  "aqueduct40-unit":
    "값이 Aqueduct 평가구역 단위이므로 성·시 경계 개편(63→34)의 영향을 받지 않습니다.",
};

/**
 * Which of the map's seven groups a new layer belongs to.
 *
 * The map screen groups by these labels, so a layer filed under a catalog label
 * ("시장·산업 및 재원") would not appear in any group. Per element, because the
 * catalog's categories are broader than the map's: D-012 is a company list and
 * belongs with the other 협력기관·기업 layers, while the D-01x~D-02x financing
 * rows belong with 국제사업·재원.
 */
const MAP_CATEGORY_V157 = {
  "A-013": "기후·위험",
  "A-022": "에너지·인프라",
  "A-027": "에너지·인프라",
  "A-028": "물·자원",
  "B-002": "기후·위험",
  "B-009": "기후·위험",
  "B-024": "물·자원",
  "B-026": "물·자원",
  "B-035": "산림·토지",
  "B-036": "산림·토지",
  "B-044": "물·자원",
  "B-046": "물·자원",
  "B-047": "물·자원",
  "C-003": "정책·사업여건",
  "C-006": "정책·사업여건",
  "C-008": "정책·사업여건",
  "C-017": "정책·사업여건",
  "D-012": "협력기관·기업",
  "D-014": "국제사업·재원",
  "D-015": "국제사업·재원",
  "D-016": "국제사업·재원",
  "D-017": "국제사업·재원",
  "D-019": "국제사업·재원",
  "D-020": "국제사업·재원",
  "D-021": "국제사업·재원",
  "D-022": "국제사업·재원",
  "D-023": "국제사업·재원",
  "D-025": "국제사업·재원",
  "D-026": "국제사업·재원",
  "E-001": "협력기관·기업",
  "E-002": "협력기관·기업",
  "E-020": "협력기관·기업",
};

/** The group a new row is filed under, and the assertion that it is a real one. */
function mapCategoryFor(elementId, declaredCategory) {
  const category = MAP_CATEGORY_V157[elementId] ?? declaredCategory ?? null;
  if (!targets.categories.includes(category)) {
    throw new Error(
      `${elementId}: "${category}" is not one of the map's categories (${targets.categories.join(", ")})`
    );
  }
  return category;
}

/** The review's 74 non-map datasets keep these three off the map (V157 3단계). */
const DROPPED_V157 = ["C-009", "C-010", "C-019"];

const download = (elementId) => {
  const path = resolve(DATA, `downloads/${elementId}.json`);
  return existsSync(path) ? readJson(path) : { entities: [], observations: [] };
};

/** Column preferences for a project/institution list's popup and member list. */
const PREFERENCES = {
  label: [/^명칭$/u, /^속성1_레코드명$/u, /사업명|프로젝트명|기관명|프로그램/u],
  value: [
    /약정액_합계|대표금액|승인금액|보증금액|투자액|총투자액|사업비|예산|금액/u,
    /^속성3_값$/u,
  ],
  url: [/원문url|^링크$|출처url|recordsourceurl|^url$/iu],
  date: [/공고일|약정일|승인일|financial_?close|^속성4_시점$|기준연도|보고연도|사업기간|기간/iu],
  status: [/^상태$|진행|단계|status/iu],
};

function filledColumns(elementId) {
  const records = download(elementId).entities ?? [];
  const counts = new Map();
  for (const record of records) {
    for (const [key, value] of Object.entries(record.normalizedAttributes ?? {})) {
      if (String(value ?? "").trim()) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function pickColumn(counts, patterns) {
  const keys = [...counts.keys()];
  for (const pattern of patterns) {
    const match = keys
      .filter((key) => pattern.test(key))
      .sort((left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0))[0];
    if (match) return match;
  }
  return null;
}

function periodTextFor(entry) {
  const years = (entry?.referenceYears ?? []).filter((year) => /^\d{4}$/u.test(String(year)));
  if (years.length === 0) return entry?.latestYear ? `${entry.latestYear}년 기준` : "기준연도 미기재";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? `${first}년 기준` : `${first}~${last}년`;
}

function representativeItemFor(elementId, labelKey) {
  const records = download(elementId).entities ?? [];
  const region = regionByElement.get(elementId);
  const located = new Set(Object.keys(readRegionSidecar(elementId)?.byRecordId ?? {}));
  const first =
    records.find((record) => located.has(record.recordId)) ?? records[0] ?? null;
  if (!first) return "(레코드 없음)";
  const label =
    (labelKey ? String(first.normalizedAttributes?.[labelKey] ?? "").trim() : "") ||
    String(first.name ?? "").trim();
  const unit = readRegionSidecar(elementId)?.byRecordId?.[first.recordId]?.[0]?.name ?? null;
  const shortened = label.length > 60 ? `${label.slice(0, 57)}…` : label;
  return unit ? `${shortened} (${unit})` : shortened || `${region?.elementId ?? elementId} 레코드`;
}

const sidecarCache = new Map();
function readRegionSidecar(elementId) {
  if (sidecarCache.has(elementId)) return sidecarCache.get(elementId);
  const path = resolve(ROOT, `reports/v157/record-regions/${elementId.toLowerCase()}.json`);
  const document = existsSync(path) ? readJson(path) : null;
  sidecarCache.set(elementId, document);
  return document;
}

/** A row for an element whose region was extracted from its values. */
function sidecarTarget(row, entry) {
  const sidecar = readRegionSidecar(row.elementId);
  const counts = filledColumns(row.elementId);
  const labelKey = pickColumn(counts, PREFERENCES.label);
  const valueKey = pickColumn(counts, PREFERENCES.value);
  const urlKey = pickColumn(counts, PREFERENCES.url);
  const dateKey = pickColumn(counts, PREFERENCES.date);
  const statusKey = pickColumn(counts, PREFERENCES.status);
  const isInstitution = entry?.detailTemplate === "partner";
  const measureLabel = isInstitution ? "지역이 확인된 기관 수" : "지역이 확인된 사업 수";
  const columnsUsed = (sidecar?.columnsUsed ?? []).map((item) => item.column);
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId),
    publicName: row.targetName,
    sourceFields: [
      ...columnsUsed,
      ...[labelKey, valueKey, dateKey, statusKey, urlKey].filter(Boolean),
    ].filter((value, index, all) => all.indexOf(value) === index),
    sourceSpatialUnit: `원자료 값에 성·시가 적힌 ${sidecar?.counts.located ?? 0}건(개편 후 34개 체계) · 추출 열 ${columnsUsed.join("·") || "없음"}`,
    displaySpatialUnit: "34개 성·시 값을 소속 63개 경계에 동일 표시",
    representation: "region-choropleth",
    build: {
      kind: "region-membership",
      regionSidecar: `reports/v157/record-regions/${row.elementId.toLowerCase()}.json`,
      periodFixed: periodTextFor(entry),
      measures: [
        {
          key: `${row.elementId.toLowerCase()}-located-count`,
          aggregate: "count",
          label: measureLabel,
          unit: "건",
          measureId: `${row.elementId.toLowerCase()}-located-count`,
        },
      ],
      defaultMeasure: `${row.elementId.toLowerCase()}-located-count`,
      coverageKind: "partial",
      memberRecords: {
        labelKey,
        valueKey,
        dateKey,
        statusKey,
        urlKey,
      },
      boundaryPolicy34: { kind: "native-34" },
    },
    selectableVariables: `성·시 클릭 → ${isInstitution ? "기관" : "사업"} 목록(${[labelKey, valueKey, dateKey, statusKey].filter(Boolean).join("·") || "명칭"})`,
    unit: "건",
    period: periodTextFor(entry),
    representativeItem: representativeItemFor(row.elementId, labelKey),
    evidence: `개체 ${sidecar?.counts.records ?? 0}건 중 성·시 확인 ${sidecar?.counts.located ?? 0}건 · 성·시 ${sidecar?.counts.units ?? 0}개 · 복수 성 ${sidecar?.counts.multiUnit ?? 0}건`,
    limitation:
      "건수는 성·시가 확인된 레코드 수이며 금액·규모의 합이 아닙니다. 복수 성 레코드는 각 성에 1건으로 세고 금액은 합산하지 않습니다. 성·시 표기가 없는 레코드는 지도에 올리지 않고 목록·다운로드에만 남습니다.",
  };
}

/** B-009: the province is a dimension of the observation's indicator. */
function observationDimensionTarget(row, entry) {
  const semantic = readJson(resolve(DATA, `semantic/elements/${row.elementId.toLowerCase()}.json`));
  const provinceIndicators = (semantic.indicators ?? []).filter(
    (indicator) => indicator.dimensionLabels?.detail_2 && indicator.dimensionLabels?.detail
  );
  const measures = [...new Map(
    provinceIndicators.map((indicator) => [
      indicator.measure.key,
      {
        key: indicator.measure.key,
        label: indicator.measure.labelKo,
        unit: indicator.measure.unit,
        measureId: indicator.measure.key,
        aggregate: "value",
      },
    ])
  ).values()];
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId),
    publicName: row.targetName,
    sourceFields: ["indicatorId(성 단위)", "dimensionLabels.detail_2(성·시명)", "value", "unit"],
    sourceSpatialUnit: `원천 워크북 Adm1 시트의 개편 전 63개 성 단위 값 · 지표 ${measures.length}종`,
    displaySpatialUnit: "63개 성 경계에 그대로 표시(34개 체계 전환 시 구성 성 값 유지)",
    representation: "admin1-choropleth",
    build: {
      kind: "observation-dimension",
      regionDimension: "detail_2",
      regionAliases: SOURCE_SPELLING_VARIANTS_V157[row.elementId] ?? {},
      scopeDimension: "detail",
      measures,
      defaultMeasure: measures[0]?.key ?? null,
      coverageKind: "complete",
      boundaryPolicy34: { kind: "area-weighted-mean" },
    },
    selectableVariables: `지표 ${measures.length}종 선택 → 성별 값 비교`,
    unit: measures[0]?.unit ?? "점",
    period: periodTextFor(entry),
    representativeItem: provinceIndicators[0]
      ? `${provinceIndicators[0].dimensionLabels.detail_2} ${provinceIndicators[0].measure.labelKo}`
      : "(지표 없음)",
    evidence: `성 단위 관측값 ${provinceIndicators.length}건 · 지표 ${measures.length}종`,
    limitation:
      "성 단위 값은 원천이 제공한 값이며 국가값(면적가중 평균)과 다릅니다. 성 값을 합산해 국가값을 만들지 않습니다.",
  };
}

/**
 * Elements whose records are province rows, with the value each one states.
 *
 * Declared rather than guessed: the choice of which column is the map's value is
 * an editorial one, and it is written here so a reviewer can see it.
 */
const PROVINCE_ATTRIBUTE_MEASURES_V157 = {
  "B-026": {
    measure: {
      key: "dominant-flow-direction-share",
      sourceKey: "우세_유향_비율",
      label: "우세 유향 격자 비율",
      unit: "%",
      measureId: "b026-dominant-flow-share",
    },
    categoryKey: "우세_유향",
    gridCountKey: "유효_격자_수",
    boundaryPolicy34: { kind: "range-only" },
  },
};

/** A province table: the record is the province, not a site inside it. */
function provinceAttributeTarget(row, entry) {
  const declared = PROVINCE_ATTRIBUTE_MEASURES_V157[row.elementId];
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId),
    publicName: row.targetName,
    sourceFields: [
      "지역명_베트남어",
      "지역명_로마자",
      declared.measure.sourceKey,
      declared.categoryKey,
      declared.gridCountKey,
    ].filter(Boolean),
    sourceSpatialUnit: "원자료가 성 단위로 집계한 행(행정단위=Province)",
    displaySpatialUnit: "개편 전 63개 성 경계에 성 단위 값 표시",
    representation: "admin1-choropleth",
    build: {
      kind: "admin1-attributes",
      regionKeys: ["지역명_베트남어", "지역명_로마자"],
      // The map colours by this column's value (범주형 단계구분도) and keeps the
      // measure for the popup.
      categoryKey: declared.categoryKey,
      periodFixed: periodTextFor(entry),
      measures: [{ ...declared.measure, aggregate: "value" }],
      defaultMeasure: declared.measure.key,
      coverageKind: "complete",
      memberRecords: {
        labelKey: declared.categoryKey,
        valueKey: declared.measure.sourceKey,
      },
      boundaryPolicy34: declared.boundaryPolicy34,
    },
    selectableVariables: `성 클릭 → 8방향 비율·우세 유향(${declared.categoryKey})`,
    unit: declared.measure.unit,
    period: periodTextFor(entry),
    representativeItem: representativeItemFor(row.elementId, declared.categoryKey),
    evidence: `성 단위 행 ${row.criteriaEvidence.entityRows}건 · 성·시 ${row.criteriaEvidence.provinceCodeCount}개`,
    limitation:
      "값은 우세 유향이 차지하는 격자 비율이며 유량이 아닙니다. 통합된 성·시는 구성 성의 우세 유향이 다를 수 있어 단일값을 만들지 않고 범위만 표시합니다.",
  };
}

/** B-026: the delivery carries the observation point's own coordinates. */
function entityPointTarget(row, entry) {
  const counts = filledColumns(row.elementId);
  const labelKey = pickColumn(counts, [/지점|관측소|^명칭$/u]) ?? null;
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId),
    publicName: row.targetName,
    sourceFields: [
      "위도",
      "경도",
      ...[labelKey].filter(Boolean),
      "2025_개편_후_소속_34개_체계",
    ],
    sourceSpatialUnit: `원자료 좌표가 있는 격자·지점 ${row.criteriaEvidence.coordinateRows}건`,
    displaySpatialUnit: "원자료 좌표 그대로(이동·보정 없음)",
    representation: "point",
    build: {
      kind: "entities",
      requireCoordinates: true,
      boundaryPolicy34: { kind: "none" },
    },
    selectableVariables: "지점 클릭 → 8방향 비율·우세 유향",
    unit: entry?.spatialUnits?.includes("raster") ? "격자 지점" : "지점",
    period: periodTextFor(entry),
    representativeItem: representativeItemFor(row.elementId, labelKey),
    evidence: `좌표 있는 레코드 ${row.criteriaEvidence.coordinateRows}건 · 소속 성·시 ${row.criteriaEvidence.provinceCodeCount}개`,
    limitation:
      "격자 지점은 관측소가 아니며 격자 중심입니다. 지점 값을 성·시 평균으로 합치지 않습니다.",
  };
}

/** A V155 asset that P6b moves into map-index as it was prepared. */
function pendingTarget(row, entry) {
  const layer = pending.get(row.elementId);
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId, layer.category),
    publicName: row.targetName,
    sourceFields: layer.tooltipFields ?? [],
    sourceSpatialUnit: layer.spatialCoverage ?? layer.aggregationLevel ?? "V155 준비 자산",
    displaySpatialUnit: layer.rendererNote ?? layer.aggregationLevel ?? "준비된 경계 자산 그대로",
    representation: layer.renderer,
    build: {
      kind: "pending-v155",
      layerId: layer.layerId,
      source: "spatial/pending-layers-v155.json",
      // The V155 declaration already states its 63->34 policy; it is repeated
      // here because the boundary audit reads the policy from the contract.
      boundaryPolicy34: {
        kind: typeof layer.boundaryPolicy === "string" ? layer.boundaryPolicy : layer.boundaryPolicy?.kind ?? "none",
        ...(typeof layer.boundaryPolicy === "object" && layer.boundaryPolicy?.note
          ? { note: layer.boundaryPolicy.note }
          : NON_ADMIN_UNIT_NOTES_V157[layer.aggregationLevel]
            ? { note: NON_ADMIN_UNIT_NOTES_V157[layer.aggregationLevel] }
            : {}),
      },
    },
    selectableVariables:
      (layer.selectors?.variables ?? []).map((variable) => variable.label).join(" · ") || "단일 변수",
    unit: layer.unit ?? "",
    period: periodTextFor(entry),
    representativeItem: layer.publicShortTitle ?? row.targetName,
    evidence: `자산 피처 ${layer.featureCount ?? 0}개 · ${(layer.geometryTypes ?? []).join("·")}`,
    limitation: layer.spatialLimitation ?? layer.accuracyNotice ?? "",
  };
}

/** A row the data cannot place on a map yet: the reason is the row's content. */
function unmappedTarget(row, entry) {
  const REQUIRED_ASSET = {
    "national-only": "성·시 단위로 분해된 값(제공자 재납품) 또는 해당 경계 자산",
    "region-fields-empty": "지역 열(속성20·21·22)이 채워진 재납품",
    "region-text-generic": "원문 지역어에 대응하는 공식 경계 정의",
    "reference-mapping-pending": "EVN 5개 총공사 관할표(성별 출처 URL 포함)",
    "data-pending": "사업별 실시 지역(성·시)이 채워진 재납품",
    "asset-missing": "해당 공간 자산",
  };
  return {
    elementId: row.elementId,
    category: mapCategoryFor(row.elementId),
    publicName: row.targetName,
    sourceFields: row.popupFields.map((field) => field.key),
    sourceSpatialUnit: row.criteriaEvidence.entityRows > 0 ? "레코드 단위(지역 미확인)" : "국가 단위",
    displaySpatialUnit: "미정(경계·좌표 미확보)",
    representation: "none",
    build: {
      kind: "none",
      reason: row.statusReason,
      requiredAsset: REQUIRED_ASSET[row.status] ?? "해당 공간 자산",
      forbidden: "지역 정보가 없는 값을 성·시에 배치하거나 경계·좌표를 생성하는 표현",
    },
    selectableVariables: `(상세 화면) ${row.pdfContent}`,
    unit: "",
    period: periodTextFor(entry),
    representativeItem: row.pdfContent,
    evidence:
      row.criteriaEvidence.entityRows > 0
        ? `개체 ${row.criteriaEvidence.entityRows}건 · 성·시 확인 0건`
        : `관측값 ${row.criteriaEvidence.observationRows}건(국가 단위)`,
    limitation: `${row.statusReason} 연관 레이어와 함께 국가값 카드로만 표시합니다.`,
  };
}

const GENERATOR_V157 = "scripts/v157/extend-map-targets-v157.mjs";

/**
 * The row V157 would write for an element, chosen from the evidence rather than
 * from the element's current status: once a layer is registered the content
 * contract calls it "registered", and a rerun must still produce the same row
 * (the gate runs this with --check).
 */
function generateTarget(row, entry) {
  const target = pending.has(row.elementId)
    ? pendingTarget(row, entry)
    : // A declared province table wins: B-026's records are provinces, so it is
      // built from the province name even though its values also mention one.
      PROVINCE_ATTRIBUTE_MEASURES_V157[row.elementId]
      ? provinceAttributeTarget(row, entry)
      : readRegionSidecar(row.elementId)?.counts.located > 0
        ? sidecarTarget(row, entry)
        : row.criteriaEvidence.observationProvinceCodeCount >= 2
          ? observationDimensionTarget(row, entry)
          : row.criteriaEvidence.coordinateRows > 0
            ? entityPointTarget(row, entry)
            : unmappedTarget(row, entry);
  return { ...target, generatedBy: GENERATOR_V157 };
}

const report = { kept: [], added: [], dropped: [], changed: [] };
const nextTargets = [];
for (const row of content.rows) {
  const entry = catalogByElement.get(row.elementId);
  const existing = existingByElement.get(row.elementId);
  if (existing) {
    // B-017 was declared "none" in V138 because its boundary asset did not exist.
    // It does now (PR #24), so the row keeps its text and gains the V155 build.
    if (pending.has(row.elementId) && existing.build.kind === "none") {
      const prepared = pendingTarget(row, entry);
      nextTargets.push({
        ...existing,
        representation: prepared.representation,
        build: prepared.build,
        sourceSpatialUnit: prepared.sourceSpatialUnit,
        displaySpatialUnit: prepared.displaySpatialUnit,
        selectableVariables: prepared.selectableVariables,
        unit: prepared.unit || existing.unit,
        evidence: prepared.evidence,
        limitation: prepared.limitation || existing.limitation,
      });
      report.changed.push({
        elementId: row.elementId,
        from: "none",
        to: "pending-v155",
        reason: "V155 경계 자산 확보(PR #24) — P6b 등록",
      });
      continue;
    }
    // A row V157 generated is regenerated on every run: its text states measured
    // counts and its build directive is derived, so the file must not drift from
    // the data. The 40 rows V138 wrote by hand are kept exactly as they are.
    if (existing.generatedBy === GENERATOR_V157) {
      const refreshed = generateTarget(row, entry);
      if (refreshed && JSON.stringify(refreshed) !== JSON.stringify(existing)) {
        report.changed.push({
          elementId: row.elementId,
          from: `${existing.build?.kind} row`,
          to: "regenerated from the current data",
          reason: "측정값·빌드 지시 갱신",
        });
        nextTargets.push(refreshed);
        continue;
      }
    }
    nextTargets.push(existing);
    report.kept.push(row.elementId);
    continue;
  }
  const target = generateTarget(row, entry);
  nextTargets.push(target);
  report.added.push({ elementId: row.elementId, kind: target.build.kind });
}
for (const target of targets.targets) {
  if (!content.rows.some((row) => row.elementId === target.elementId)) {
    report.dropped.push({
      elementId: target.elementId,
      reason: "2026-09-22 전수검토에서 지도 비표출(74개)로 분류 — 연관 데이터로 표출",
    });
  }
}
// A rerun sees a file that already dropped them, so the check is on the union: the
// three are out, whether this run took them out or an earlier one did.
const droppedNow = new Set([
  ...report.dropped.map((row) => row.elementId),
  ...(targets.droppedElementIds ?? []),
]);
if ([...droppedNow].sort().join(",") !== DROPPED_V157.join(",")) {
  throw new Error(
    `unexpected dropped targets: ${[...droppedNow].join(",")}`
  );
}

const nextDocument = {
  ...targets,
  schemaVersion: "public-map-targets-v157",
  contentContract: "public/data/vietnam/v2/map-content-contract-v157.json",
  // Targets the review moved off the map; the builder must not carry their old
  // layers over, and the map list must not show them as pending.
  droppedElementIds: [...droppedNow].sort(),
  droppedReason: "2026-09-22 전수검토에서 지도 비표출(74개)로 분류 — 연관 데이터로 표출",
  generator: "scripts/v157/extend-map-targets-v157.mjs",
  targets: nextTargets.sort((left, right) => left.elementId.localeCompare(right.elementId)),
};
const text = `${JSON.stringify(nextDocument, null, 2)}\n`;
const previous = readFileSync(TARGETS_PATH, "utf8");
const changed = previous !== text;
if (changed && !CHECK_ONLY) writeFileSync(TARGETS_PATH, text, "utf8");

const summary = {
  schema: "map-targets-extend-v157",
  generatedAt: new Date().toISOString(),
  targetCount: nextTargets.length,
  keptCount: report.kept.length,
  changedCount: report.changed.length,
  changed: report.changed,
  addedCount: report.added.length,
  droppedCount: report.dropped.length,
  addedByKind: report.added.reduce((acc, row) => {
    acc[row.kind] = (acc[row.kind] ?? 0) + 1;
    return acc;
  }, {}),
  added: report.added,
  dropped: report.dropped,
  changed,
};
if (!CHECK_ONLY) writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", ...summary, added: undefined })}\n`);
if (CHECK_ONLY && changed) {
  process.stderr.write(`${JSON.stringify({ type: "error", reason: "TARGETS_OUT_OF_DATE" })}\n`);
  process.exitCode = 1;
}
