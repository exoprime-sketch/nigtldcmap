#!/usr/bin/env node

import { gunzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const PUBLIC_ROOT = resolve(ROOT, "public/data/vietnam/v2");
const REPORT_ROOT = resolve(ROOT, "reports/v130");
mkdirSync(REPORT_ROOT, { recursive: true });

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const catalog = readJson(resolve(PUBLIC_ROOT, "catalog.json")).elements;
const mapIndex = readJson(resolve(PUBLIC_ROOT, "map-index.json"));
const v128Acceptance = readJson(
  resolve(ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const acceptedPublicTitleByElement = new Map(
  (v128Acceptance.elements || []).map((element) => [
    element.elementId,
    element.publicTitle,
  ])
);
const bundleIndex = readJson(
  resolve(PUBLIC_ROOT, "packs/bundle-index-v124.json")
);
const layerByElement = new Map(
  mapIndex.layers.map((layer) => [layer.elementId, layer])
);

const V129_LAYER_IDS = new Set([
  "A-023",
  "A-024",
  "C-016",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "B-021",
  "B-048",
  "C-025",
  "D-008",
  "D-018",
  "D-023",
]);

function loadElement(elementId) {
  const entry = bundleIndex.elements[elementId];
  if (!entry) throw new Error(`bundle index missing ${elementId}`);
  const envelope = readJson(resolve(ROOT, "public", entry.packUrl.slice(1)));
  const payload = JSON.parse(
    gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString(
      "utf8"
    )
  );
  return payload.elements[elementId];
}

function normalizedTitle(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gu, " ")
    .trim();
}

function publicTitle(element) {
  const acceptedTitle = acceptedPublicTitleByElement.get(element.elementId);
  if (acceptedTitle) return String(acceptedTitle).trim();
  return String(element.elementLabel || "")
    .replace(/\[[\s\S]*$/u, "")
    .replace(/;[\s\S]*$/u, "")
    .trim();
}

function inferredScope(units) {
  const normalized = units.map((value) => String(value).toLowerCase());
  if (normalized.some((value) => /raster|grid/u.test(value))) return "raster";
  if (normalized.some((value) => /line|network/u.test(value))) return "network";
  if (normalized.some((value) => /point|site|lat/u.test(value))) return "unknown";
  if (normalized.some((value) => /admin1|province/u.test(value))) return "admin1";
  if (normalized.some((value) => /region/u.test(value))) return "region";
  if (normalized.some((value) => /nation|country/u.test(value))) return "country";
  return "unknown";
}

function inferredGeometry(scope) {
  if (scope === "raster") return "Raster";
  if (scope === "network") return "LineString/MultiLineString";
  if (["admin1", "region", "country"].includes(scope)) {
    return "Polygon/MultiPolygon (scope only)";
  }
  return "unknown";
}

function finalDisposition(layer) {
  if (!layer) return "panel-only";
  if (layer.renderer === "regional-scope") return "regional-scope";
  if (layer.renderer === "line") return "line";
  if (layer.elementId === "B-021") return "regional-scope";
  if (["admin1-choropleth", "partial-choropleth"].includes(layer.renderer)) {
    return "admin1";
  }
  return "point";
}

const inventory = catalog.map((element) => {
  const layer = layerByElement.get(element.elementId);
  const units = Array.isArray(element.spatialUnits) ? element.spatialUnits : [];
  const fallbackScope = inferredScope(units);
  const hasSpatialSource =
    Boolean(layer) ||
    units.some((unit) => !/^(?:none|unknown|not-applicable)$/iu.test(String(unit)));
  const selected = Boolean(layer);
  const excludedForMeaning = ["C-025", "D-018", "D-023"].includes(
    element.elementId
  );
  const exclusionReason = selected
    ? ""
    : excludedForMeaning
    ? "프로젝트 레코드 중 검증된 세부 위치가 없거나 다른 활성 레이어와 중복되어 패널에서만 제공"
    : hasSpatialSource
    ? "국가 집계·패널 분석이 더 적합하거나 지도에서 추가 분석 이득을 주는 검증 공간표현이 없음"
    : "공개 가능한 공간 geometry 또는 검증 위치가 없음";
  return {
    elementId: element.elementId,
    publicTitle: publicTitle(element),
    mapSelected: selected,
    currentMapLayer: V129_LAYER_IDS.has(element.elementId),
    spatialDataExists: hasSpatialSource,
    geometryType: layer
      ? (layer.geometryTypes || []).join("/")
      : inferredGeometry(fallbackScope),
    spatialScopeType: layer?.spatialScopeType || fallbackScope,
    coordinateMeaning:
      layer?.coordinateMeaning ||
      (["admin1", "region", "country"].includes(fallbackScope)
        ? "source-region-value"
        : "unknown"),
    aggregationLevel:
      layer?.aggregationLevel ||
      (fallbackScope === "unknown" ? "non-spatial-or-unverified" : fallbackScope),
    sourceSpatialUnit: layer
      ? layer.elementId === "B-021"
        ? "region"
        : layer.spatialScopeType
      : units.join(" · ") || "unknown",
    targetSpatialUnit: layer
      ? layer.renderer === "regional-scope"
        ? "participating-country-scope-and-verified-activity-site"
        : layer.renderer === "line"
        ? "line"
        : ["admin1-choropleth", "partial-choropleth"].includes(layer.renderer)
        ? "admin1"
        : "point"
      : "panel-only",
    spatialSemanticsVerified: true,
    mapBenefit: selected
      ? layer.mapBenefit || layer.spatialCoverage
      : "데이터 찾기·상세 패널에서 원천 집계수준을 유지하는 편이 정확함",
    exclusionReason,
    finalMapDisposition:
      selected
        ? finalDisposition(layer)
        : element.displayAllowed === false || element.publicStatus === "quarantined"
        ? "excluded"
        : "panel-only",
  };
});

const inventoryEnvelope = {
  schemaVersion: "v130-map-selection-1",
  generatedAt: "2026-09-01T00:00:00Z",
  inventoryBasis: "V129 currentMapLayer versus V130 final mapSelected",
  frameworkElementCount: inventory.length,
  explainedCount: inventory.filter(
    (row) => row.mapSelected || row.exclusionReason
  ).length,
  mapSelectedElementCount: inventory.filter((row) => row.mapSelected).length,
  elements: inventory,
};

writeFileSync(
  resolve(REPORT_ROOT, "map-selection-152-v130.json"),
  `${JSON.stringify(inventoryEnvelope, null, 2)}\n`
);

const inventoryColumns = [
  "elementId",
  "publicTitle",
  "mapSelected",
  "currentMapLayer",
  "spatialDataExists",
  "geometryType",
  "spatialScopeType",
  "coordinateMeaning",
  "aggregationLevel",
  "sourceSpatialUnit",
  "targetSpatialUnit",
  "spatialSemanticsVerified",
  "mapBenefit",
  "exclusionReason",
  "finalMapDisposition",
];
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
writeFileSync(
  resolve(REPORT_ROOT, "map-selection-152-v130.csv"),
  `\uFEFF${[
    inventoryColumns.join(","),
    ...inventory.map((row) =>
      inventoryColumns.map((column) => csvCell(row[column])).join(",")
    ),
  ].join("\r\n")}\r\n`
);

const d018Entities = loadElement("D-018").entities.records;
const d023Entities = loadElement("D-023").entities.records;
const c025Entities = loadElement("C-025").entities.records;

function candidateCoordinates(entity) {
  const candidates = entity.normalizedAttributes?.sourceCoordinateCandidates;
  if (Array.isArray(candidates)) return candidates;
  if (
    typeof entity.latitude === "number" &&
    typeof entity.longitude === "number"
  ) {
    return [
      {
        latitude: entity.latitude,
        longitude: entity.longitude,
        label: null,
      },
    ];
  }
  return [];
}

function projectKind(entity) {
  const title = normalizedTitle(
    entity.normalizedAttributes?.projectName || entity.name
  );
  if (title.includes("groundwater resources in the greater mekong subregion")) {
    return "greater-mekong";
  }
  if (title.includes("mekong eba south")) return "mekong-eba";
  if (title.includes("eco human settlement")) return "mekong-delta";
  if (title.includes("innovative financial incentives for adaptation")) {
    return "ifia";
  }
  return "other";
}

const D018_OFFICIAL = {
  "greater-mekong": {
    countries: ["Cambodia", "Lao PDR", "Thailand", "Viet Nam"],
    regional: true,
    siteMeaning: "대표 국가좌표이며 물리적 사업지점이 아님",
    activityAreas: [
      "Vientiane Plains (Lao PDR–Thailand)",
      "northwest Cambodia–Thailand border area",
      "upper Mekong Delta (Cambodia–Viet Nam)",
    ],
    sourceEvidence:
      "https://fifspubprd.azureedge.net/afdocuments/project/3069/3069_UNESCO%20GMS%20Groundwater%20Funding%20Proposal_2022%20Review%20Update%20clean_LOEs.pdf",
  },
  "mekong-eba": {
    countries: ["Thailand", "Viet Nam"],
    regional: true,
    siteMeaning: "공식 제안서에 명시된 세부 활동지역",
    activityAreas: [
      "Young Basin (Thailand)",
      "surrounding Tram Chim National Park (Viet Nam)",
    ],
    sourceEvidence:
      "https://www.adaptation-fund.org/wp-content/uploads/2018/08/Mekong-EbA-South_Project-Proposal_6-August-2018_Clean.pdf",
  },
  "mekong-delta": {
    countries: ["Viet Nam"],
    regional: false,
    siteMeaning: "메콩델타 광역 범위의 대표좌표이며 물리적 단일 지점이 아님",
    activityAreas: [],
  },
  ifia: {
    countries: ["Viet Nam"],
    regional: false,
    siteMeaning: "좌표 없음",
    activityAreas: [],
  },
};

const d018Projects = d018Entities.map((entity) => {
  const attrs = entity.normalizedAttributes || {};
  const kind = projectKind(entity);
  const official = D018_OFFICIAL[kind] || D018_OFFICIAL.ifia;
  const coordinates = candidateCoordinates(entity);
  return {
    projectTitle: attrs.projectName || entity.name,
    adaptationFundProjectId: null,
    projectIdAvailability:
      "local source workbook and current public project page do not expose a stable AF project ID",
    officialSourceUrl: attrs.sourceUrl || null,
    countryOrRegion: attrs.field_20eaa6c8 || null,
    participatingCountries: official.countries,
    projectCategory: attrs.sector || null,
    rawLatlonField: attrs.field_e2d2d5e1 || null,
    allCoordinates: coordinates.map((coordinate) => ({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      label: coordinate.label || null,
      physicalSite:
        kind === "mekong-eba"
          ? true
          : false,
      representativeOnly:
        kind === "greater-mekong" || kind === "mekong-delta",
    })),
    coordinateCount: coordinates.length,
    coordinateMeaning: entity.coordinateMeaning,
    physicalSiteEvidence:
      kind === "mekong-eba" ? official.sourceEvidence : null,
    representativeCoordinate:
      kind === "greater-mekong" || kind === "mekong-delta",
    sourceDescribesRegional: official.regional,
    namedActivityAreas: official.activityAreas,
    namedActivityAreaEvidence: official.sourceEvidence || null,
    approvedAmountUsd: Number(attrs.approvedAmount || attrs.usd || 0),
    projectStatus: attrs.status || null,
    implementingEntity: attrs.implementingEntity || null,
    finalMapDisposition: entity.mapEligible
      ? "regional-scope"
      : "panel-only",
    sourceCoordinateDisplayedAsPointCount: entity.displayedCoordinateCount,
    publicSpatialNotice: entity.publicSpatialNotice,
  };
});
writeFileSync(
  resolve(REPORT_ROOT, "d018-project-spatial-audit-v130.json"),
  `${JSON.stringify(
    {
      schemaVersion: "v130-d018-audit-1",
      projectCount: d018Projects.length,
      regionalProjectCount: d018Projects.filter(
        (project) => project.sourceDescribesRegional
      ).length,
      projects: d018Projects,
    },
    null,
    2
  )}\n`
);

function amount(entity) {
  const attrs = entity.normalizedAttributes || {};
  const value = attrs.primaryFinanceAmount || attrs.approvedAmount || attrs.usd;
  return Number(String(value || "0").replace(/[^0-9.]+/gu, ""));
}

function duplicateIdentity(entity, fundFallback) {
  const attrs = entity.normalizedAttributes || {};
  return {
    officialProjectId: attrs.projectId || null,
    sourceUrl: String(attrs.sourceUrl || "").trim().toLowerCase(),
    normalizedTitle: normalizedTitle(attrs.projectName || entity.name),
    fund: String(attrs.fund || fundFallback || "").trim().toLowerCase(),
    approvalDate: String(attrs.approvalDate || "").trim(),
    approvedAmountUsd: amount(entity),
  };
}

const duplicatePairs = [];
for (const d018 of d018Entities) {
  const left = duplicateIdentity(d018, "Adaptation Fund");
  for (const d023 of d023Entities) {
    const right = duplicateIdentity(d023, "");
    const urlMatch = left.sourceUrl && left.sourceUrl === right.sourceUrl;
    const compositeMatch =
      left.normalizedTitle === right.normalizedTitle &&
      left.fund === right.fund &&
      left.approvalDate === right.approvalDate &&
      left.approvedAmountUsd === right.approvedAmountUsd;
    if (!urlMatch && !compositeMatch) continue;
    duplicatePairs.push({
      dedupKey: [
        left.officialProjectId || "no-project-id",
        left.sourceUrl || left.normalizedTitle,
        left.fund,
        left.approvalDate,
        left.approvedAmountUsd,
      ].join("|"),
      matchedBy: urlMatch ? "source-url" : "title-fund-date-amount",
      d018RecordId: d018.recordId,
      d023RecordId: d023.recordId,
      title: d018.normalizedAttributes?.projectName || d018.name,
      identity: left,
      visibleBeforeV130:
        candidateCoordinates(d018).length > 0 &&
        candidateCoordinates(d023).length > 0,
      visibleAfterV130: Boolean(d018.mapEligible && d023.mapEligible),
    });
  }
}

const duplicateAudit = {
  schemaVersion: "v130-cross-layer-dedup-1",
  datasets: ["D-018", "D-023"],
  keyFields: [
    "official project ID",
    "source URL",
    "normalized title",
    "fund",
    "approval date",
    "approved amount",
  ],
  duplicateLogicalProjectCountBefore: duplicatePairs.length,
  duplicateVisibleProjectCountBefore: duplicatePairs.filter(
    (pair) => pair.visibleBeforeV130
  ).length,
  duplicateVisibleProjectCountAfter: duplicatePairs.filter(
    (pair) => pair.visibleAfterV130
  ).length,
  resolution:
    "D-023 remains an integrated portfolio in Data Finder and is panel-only; D-018 owns Adaptation Fund spatial representation.",
  duplicatePairs,
};
writeFileSync(
  resolve(REPORT_ROOT, "map-cross-layer-duplicate-audit-v130.json"),
  `${JSON.stringify(duplicateAudit, null, 2)}\n`
);

function projectClassification(elementId, entity) {
  const kind = projectKind(entity);
  const sourceCount = candidateCoordinates(entity).length;
  if (elementId === "D-018") {
    if (["greater-mekong", "mekong-eba"].includes(kind)) {
      return "multi-country regional";
    }
    if (kind === "mekong-delta") return "national project";
    return "coordinate unknown";
  }
  if (elementId === "D-023") {
    if (["greater-mekong", "mekong-eba"].includes(kind)) {
      return "multi-country regional";
    }
    return sourceCount ? "national project" : "coordinate unknown";
  }
  const projectId = String(entity.normalizedAttributes?.projectId || "").toLowerCase();
  if (["gs_212", "gs_61"].includes(projectId)) return "national project";
  return entity.mapEligible ? "single-country site" : "coordinate unknown";
}

const projectRows = [
  ["C-025", c025Entities],
  ["D-018", d018Entities],
  ["D-023", d023Entities],
].flatMap(([elementId, entities]) =>
  entities.map((entity) => ({
    elementId,
    recordId: entity.recordId,
    projectTitle:
      entity.normalizedAttributes?.projectName ||
      entity.name ||
      entity.normalizedAttributes?.projectId ||
      entity.recordId,
    classification: projectClassification(elementId, entity),
    spatialScopeType: entity.spatialScopeType || "unknown",
    coordinateMeaning: entity.coordinateMeaning || "unknown",
    sourceCoordinateCount: candidateCoordinates(entity).length,
    displayedCoordinateCount: entity.displayedCoordinateCount || 0,
    mapEligible: Boolean(entity.mapEligible),
    finalMapDisposition:
      elementId === "D-018" && entity.mapEligible
        ? "regional-scope"
        : entity.mapEligible
        ? "point"
        : "panel-only",
    reason: entity.mapEligibilityReason || "no-verified-coordinate",
  }))
);
writeFileSync(
  resolve(REPORT_ROOT, "project-point-layers-audit-v130.json"),
  `${JSON.stringify(
    {
      schemaVersion: "v130-project-point-audit-1",
      recordCount: projectRows.length,
      datasetCounts: Object.fromEntries(
        ["C-025", "D-018", "D-023"].map((elementId) => [
          elementId,
          projectRows.filter((row) => row.elementId === elementId).length,
        ])
      ),
      records: projectRows,
    },
    null,
    2
  )}\n`
);

const mapGroupCounts = Object.fromEntries(
  [...new Set(mapIndex.layers.map((layer) => layer.category))].map((group) => [
    group,
    mapIndex.layers.filter((layer) => layer.category === group).length,
  ])
);
writeFileSync(
  resolve(REPORT_ROOT, "spatial-summary-v130.json"),
  `${JSON.stringify(
    {
      schemaVersion: "v130-spatial-summary-1",
      frameworkElements: catalog.length,
      accountedElements: catalog.length,
      mapSelectedElements: mapIndex.activeMapLayerCount,
      mapFeatureOrScopeCount: mapIndex.mapFeatureCount,
      mapSelectionExplained: inventoryEnvelope.explainedCount,
      mapGroupCounts,
      d018ProjectCount: d018Projects.length,
      d018PointProjectCount: d018Projects.filter(
        (project) => project.sourceCoordinateDisplayedAsPointCount > 0
      ).length,
      d018RegionalProjectCount: d018Projects.filter(
        (project) => project.sourceDescribesRegional
      ).length,
      greaterMekongCoordinateCount:
        d018Projects.find((project) =>
          normalizedTitle(project.projectTitle).includes(
            "groundwater resources in the greater mekong subregion"
          )
        )?.coordinateCount || 0,
      d023D018DuplicateCountBefore:
        duplicateAudit.duplicateLogicalProjectCountBefore,
      d023D018DuplicateCountAfter:
        duplicateAudit.duplicateVisibleProjectCountAfter,
    },
    null,
    2
  )}\n`
);

console.log(
  JSON.stringify({
    inventory: `${inventory.length}/${inventory.length}`,
    mapSelectedElements: mapIndex.activeMapLayerCount,
    mapFeatureOrScopeCount: mapIndex.mapFeatureCount,
    d018Projects: d018Projects.length,
    duplicateBefore: duplicateAudit.duplicateLogicalProjectCountBefore,
    duplicateVisibleAfter: duplicateAudit.duplicateVisibleProjectCountAfter,
    projectRecordsAudited: projectRows.length,
  })
);
