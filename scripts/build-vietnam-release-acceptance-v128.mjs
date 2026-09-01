#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import {
  loadPackPayloads,
  payloadRecords,
  publicUrlToPath,
} from "./v125/audit-utils.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT_V128 = resolve(SCRIPT_DIR, "..");
export const V2_ROOT_V128 = resolve(
  PROJECT_ROOT_V128,
  "public/data/vietnam/v2"
);
export const REPORT_ROOT_V128 = resolve(PROJECT_ROOT_V128, "reports/v128");
export const ACCEPTANCE_JSON_PATH_V128 = resolve(
  REPORT_ROOT_V128,
  "vietnam-data-release-acceptance-v128.json"
);
export const ACCEPTANCE_CSV_PATH_V128 = resolve(
  REPORT_ROOT_V128,
  "vietnam-data-release-acceptance-v128.csv"
);
export const DOWNLOAD_JSON_PATH_V128 = resolve(
  REPORT_ROOT_V128,
  "vietnam-download-reconciliation-v128.json"
);
export const DOWNLOAD_CSV_PATH_V128 = resolve(
  REPORT_ROOT_V128,
  "vietnam-download-availability-v128.csv"
);
export const GAP_DISPOSITION_PATH_V128 = resolve(
  PROJECT_ROOT_V128,
  "config/data-publication/vietnam-v128-gap-disposition.json"
);
export const ACQUISITION_BACKLOG_PATH_V128 = resolve(
  REPORT_ROOT_V128,
  "vietnam-source-acquisition-backlog-v128.json"
);

const GENERATED_AT_V128 = "2026-08-31T00:00:00Z";
const ACCESSED_AT_V128 = "2026-08-31";
const DATA_BEARING_STATUSES_V128 = new Set([
  "actual",
  "partial",
  "public-authorized",
]);
const STATUS_LABELS_V128 = Object.freeze({
  actual: "데이터 제공",
  "public-authorized": "데이터 제공",
  partial: "일부 데이터 제공",
  "schema-only": "입력 양식",
  "data-entry-planned": "입력 예정",
  "not-collected": "원자료 미수집",
});
const FINAL_DISPOSITIONS_V128 = Object.freeze({
  actual: "populated-and-released",
  "public-authorized": "populated-and-released",
  partial: "partial-and-released",
  "schema-only": "schema-only-accepted",
  "data-entry-planned": "data-entry-planned-accepted",
  "not-collected": "not-collected-accepted",
});
const REQUIRED_ACCEPTANCE_COLUMNS_V128 = Object.freeze([
  "elementId",
  "publicTitle",
  "category",
  "group",
  "sourceWorkbookExists",
  "packageStatus",
  "dataPresenceStatus",
  "publicStatus",
  "observationRows",
  "populatedObservationRows",
  "missingObservationRows",
  "entityRows",
  "populatedEntityRows",
  "publicPopulatedRows",
  "displayAllowed",
  "downloadAllowed",
  "downloadableRecordCount",
  "downloadRestrictionReason",
  "visualizationRenderer",
  "visualizationStatus",
  "mapMode",
  "mapFeatureCount",
  "sourceOrganizations",
  "sourceReferencePeriod",
  "lastPopulatedYear",
  "limitationCount",
  "userFacingStatus",
  "finalDisposition",
  "acceptanceResult",
]);

const GAP_RECORDS_V128 = Object.freeze([
  {
    elementId: "C-020",
    expectedStatus: "not-collected",
    finalDisposition: "not-collected-accepted",
    sourceWorkbookExists: false,
    populatedObservationRows: 0,
    populatedEntityRows: 0,
    decision:
      "공식 후보의 범위와 재배포 조건을 이번 릴리스에서 검증하지 못했으므로 원자료 미수집으로 수용",
  },
  {
    elementId: "C-021",
    expectedStatus: "not-collected",
    finalDisposition: "not-collected-accepted",
    sourceWorkbookExists: false,
    populatedObservationRows: 0,
    populatedEntityRows: 0,
    decision:
      "공식 registry의 공개 열람과 플랫폼 재배포 권한은 별개이므로 원자료 미수집으로 수용",
  },
  {
    elementId: "C-023",
    expectedStatus: "not-collected",
    finalDisposition: "not-collected-accepted",
    sourceWorkbookExists: false,
    populatedObservationRows: 0,
    populatedEntityRows: 0,
    decision:
      "공식 보고서에는 관련 분석이 있으나 요소 단위 구조화 자료와 재배포 조건을 확정하지 못해 원자료 미수집으로 수용",
  },
  {
    elementId: "E-011",
    expectedStatus: "data-entry-planned",
    finalDisposition: "data-entry-planned-accepted",
    sourceWorkbookExists: true,
    populatedObservationRows: 0,
    missingObservationRows: 1,
    populatedEntityRows: 0,
    normalizationResult: "explicit-placeholder-only",
    decision:
      "workbook에는 값이 없는 명시적 placeholder 1행만 존재하며 향후 현장조사 입력 대상으로 수용",
  },
  {
    elementId: "E-013",
    expectedStatus: "schema-only",
    finalDisposition: "schema-only-accepted",
    sourceWorkbookExists: true,
    populatedObservationRows: 0,
    missingObservationRows: 5,
    populatedEntityRows: 0,
    normalizationResult: "schema-only",
    decision:
      "workbook에는 값이 없는 운영·유지보수 평가항목 5행과 입력 양식만 존재하므로 입력 양식으로 수용",
  },
]);

const ACQUISITION_CANDIDATES_V128 = Object.freeze({
  "C-020": [
    {
      publisher: "베트남 천연자원환경부(MONRE)",
      title: "온실가스 감축사업 등록 행정절차",
      url: "https://dichvucong.monre.gov.vn/pages/ChiTietDichVuTrucTuyen.aspx?dv=398",
      sourceType: "정부 공식 행정절차·서식",
      sourceOriginal: "MONRE online public-service procedure dv=398",
      terms: "공개 행정절차 페이지; project-level 구조화 dataset 및 재배포 조건 없음",
      rightsReviewStatus: "not-applicable-unless-dataset-published",
      elementFitReviewStatus: "procedure-only-not-project-data",
      collectionMethodIfApproved:
        "향후 공식 project register/export가 게시될 경우 원본 URL·조회일을 보존하여 별도 수집",
    },
    {
      publisher: "Joint Crediting Mechanism (Japan–Viet Nam Joint Committee)",
      title: "JCM Viet Nam project cycle and project data",
      url: "https://www.jcm.go.jp/jc/vn-projects/",
      structuredSourceUrl: "https://www.jcm.go.jp/jc/link-page",
      sourceType: "공식 양자 메커니즘 project registry 및 CSV 안내",
      sourceOriginal: "JCM Projects data (CSV) / Viet Nam project cycle pages",
      terms: "공개 열람 가능; 플랫폼 재배포 조건 별도 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "pending-feasibility-field-mapping",
      collectionMethodIfApproved:
        "공식 CSV를 원본 그대로 보존하고 베트남 project rows만 deterministic filter",
    },
  ],
  "C-021": [
    {
      publisher: "UNFCCC",
      title: "Paris Agreement Article 6.4 Mechanism Registry",
      url: "https://unfccc.int/process-and-meetings/the-paris-agreement/article-6/article-64-pacm/registry",
      sourceType: "공식 국제기구 mechanism registry",
      sourceOriginal: "UNFCCC Article 6.4 registry information",
      terms: "공식 공개 페이지; 베트남 VCM 정의에 맞는 현재 export와 재사용 조건 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "candidate-not-yet-vietnam-vcm-export",
      collectionMethodIfApproved:
        "UNFCCC가 제공하는 공식 export/API만 사용하고 host country와 activity status를 검증",
    },
    {
      publisher: "Joint Crediting Mechanism (Japan–Viet Nam Joint Committee)",
      title: "JCM Viet Nam project cycle search",
      url: "https://www.jcm.go.jp/jc/vn-projects/",
      structuredSourceUrl: "https://www.jcm.go.jp/jc/link-page",
      sourceType: "공식 project registry 및 CSV 안내",
      sourceOriginal: "JCM Projects data (CSV)",
      terms: "공개 열람 가능; 플랫폼 재배포 조건 별도 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "partial-fit-bilateral-not-full-vcm",
      collectionMethodIfApproved:
        "공식 CSV의 country/reference/status를 사용하고 VCM 범위 정의를 별도 문서화",
    },
    {
      publisher: "Verra",
      title: "Verra Registry",
      url: "https://verra.org/registry/overview/",
      sourceType: "공식 표준기관 registry",
      sourceOriginal: "Verra Registry public view",
      terms: "Verra Registry Terms of Use 적용; 재배포와 API 사용권 별도 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "candidate",
      collectionMethodIfApproved:
        "공식 승인 API 또는 export만 사용하고 country=Viet Nam 조건과 project status를 기록",
    },
  ],
  "C-023": [
    {
      publisher: "World Bank",
      title: "Exploring a Low-Carbon Development Path for Vietnam",
      url: "https://documents1.worldbank.org/curated/en/773061467995893930/pdf/102363-PUB-VN-Low-cost-carbon-date-Jan-20-2016-9781464807190-Box-394380B-PUBLIC.pdf",
      sourceType: "공식 국제기구 보고서",
      sourceOriginal: "World Bank report 102363-PUB (MACC figures and tables)",
      terms: "문서 이용조건 및 표·도표 데이터 재배포 범위 별도 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "report-only-not-normalized-dataset",
      collectionMethodIfApproved:
        "공식 표의 감축수단·비용·잠재량을 이중 검수하여 구조화하고 페이지 locator 보존",
    },
    {
      publisher: "World Bank",
      title: "Pathway to Low-Carbon Transport",
      url: "https://documents1.worldbank.org/curated/en/581131568121810607/pdf/Volume-1-Pathway-to-Low-Carbon-Transport.pdf",
      sourceType: "공식 국제기구 부문 보고서",
      sourceOriginal: "World Bank low-carbon transport MAC tables",
      terms: "문서 이용조건 및 표 데이터 재배포 범위 별도 확인 필요",
      rightsReviewStatus: "pending",
      elementFitReviewStatus: "sector-only",
      collectionMethodIfApproved:
        "공식 표의 transport measure별 MAC를 페이지 단위 검증 후 supplemental source로 생성",
    },
  ],
});

function readJsonV128(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256V128(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function csvCellV128(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(" | ") : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
}

function toCsvV128(rows, columns) {
  return `\uFEFF${[
    columns.map(csvCellV128).join(","),
    ...rows.map((row) => columns.map((key) => csvCellV128(row[key])).join(",")),
  ].join("\r\n")}\r\n`;
}

function compactTitleV128(value) {
  return String(value || "")
    .replace(/\[[\s\S]*$/u, "")
    .replace(/;[\s\S]*$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function curatedTitlesV128() {
  const source = readFileSync(
    resolve(PROJECT_ROOT_V128, "src/data/countries/publicLabelsV122.ts"),
    "utf8"
  );
  const titles = new Map();
  const pattern = /^\s*"([A-E]-\d{3})":\s*\{\s*title:\s*"([^"]+)"/gmu;
  for (const match of source.matchAll(pattern)) titles.set(match[1], match[2]);
  titles.set("A-024", "베트남 송전망");
  return titles;
}

function compilePolicyV128() {
  const path = resolve(
    PROJECT_ROOT_V128,
    "src/data/visualization/publicFieldPolicyV126.ts"
  );
  const result = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: path,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length > 0) {
    throw new Error(
      errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")
        )
        .join("; ")
    );
  }
  const moduleRecord = { exports: {} };
  new Function("exports", "module", "require", result.outputText)(
    moduleRecord.exports,
    moduleRecord,
    (specifier) => {
      throw new Error(`unexpected runtime import: ${specifier}`);
    }
  );
  return moduleRecord.exports;
}

function normalizedKeyV128(value) {
  return String(value).replace(/[^a-z0-9]/giu, "").toLowerCase();
}

function technicalPathsV128(value, technicalKeys, path = "$") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      technicalPathsV128(item, technicalKeys, `${path}[${index}]`)
    );
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const next = `${path}.${key}`;
    return [
      ...(technicalKeys.has(normalizedKeyV128(key)) ? [next] : []),
      ...technicalPathsV128(child, technicalKeys, next),
    ];
  });
}

function isPopulatedValueV128(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function populatedYearV128(payload, fallback) {
  const years = [
    ...payloadRecords(payload?.observations)
      .filter(
        (row) =>
          isPopulatedValueV128(row.value) || isPopulatedValueV128(row.rawValue)
      )
      .map((row) => Number(row.year)),
    ...payloadRecords(payload?.entities)
      .filter((row) => row.missingReasonCode == null)
      .map((row) => Number(row.year || row.referenceYear)),
  ].filter(Number.isFinite);
  return years.length > 0 ? Math.max(...years) : fallback ?? null;
}

function referencePeriodV128(element, lastPopulatedYear) {
  const values = (element.referenceYears || [])
    .map((value) => String(value).trim())
    .filter(Boolean);
  const numeric = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (numeric.length > 0) {
    return numeric[0] === numeric[numeric.length - 1]
      ? String(numeric[0])
      : `${numeric[0]}~${numeric[numeric.length - 1]}`;
  }
  return lastPopulatedYear == null ? "" : String(lastPopulatedYear);
}

function downloadReasonV128(element) {
  const populated = Number(element.rowAccounting?.publicPopulatedRows || 0);
  if (populated === 0) {
    return "실제 입력값이 없어 다운로드 자료를 제공하지 않음";
  }
  if (element.downloadAllowed === true) return "";
  return "원자료 이용조건에 따라 화면 열람만 제공";
}

function availabilityClassV128(element) {
  const populated = Number(element.rowAccounting?.publicPopulatedRows || 0);
  if (populated === 0) return "no-populated-download-record";
  if (element.downloadAllowed === true) return "downloadable";
  const sourceStatus = element.rights?.status;
  if (sourceStatus === "limited" || sourceStatus === "mixed-or-restricted") {
    return "display-only-by-source-license";
  }
  return "display-only-by-publication-policy";
}

function publicProjectionForElementV128({ element, payload, policyApi, semantics }) {
  const observations = payloadRecords(payload?.observations).filter(
    (row) => row.downloadEligible === true
  );
  const entities = payloadRecords(payload?.entities).filter(
    (row) => row.downloadEligible === true
  );
  const metadata = Array.isArray(payload?.meta?.indicators)
    ? payload.meta.indicators
    : [];
  const common = {
    element: {
      countryIso3: "VNM",
      publicTitle: element.publicTitle,
      publicStatus: element.publicStatus,
      downloadAllowed: element.downloadAllowed,
      raw: element,
    },
    metadataById: new Map(metadata.map((meta) => [meta.indicatorId, meta])),
    indicatorSemantics: Array.isArray(semantics?.indicators)
      ? semantics.indicators
      : [],
    recordSemantics: Array.isArray(semantics?.records) ? semantics.records : [],
  };
  return {
    eligibleRecordCount: observations.length + entities.length,
    rows: [
      ...policyApi.toPublicObservationRowsV126({ ...common, observations }),
      ...policyApi.toPublicEntityRowsV126({ ...common, entities }),
    ],
  };
}

function verifyIntegrityV128(assetIntegrity) {
  const failures = [];
  for (const asset of assetIntegrity.assets || []) {
    const path = publicUrlToPath(asset.url);
    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      failures.push({ url: asset.url, reason: "missing" });
      continue;
    }
    const bytes = readFileSync(path);
    if (bytes.byteLength !== asset.bytes || sha256V128(bytes) !== asset.sha256) {
      failures.push({ url: asset.url, reason: "size-or-sha256-mismatch" });
    }
  }
  return failures;
}

function verifyLocalSourcePackageV128(manifest) {
  const sourcePath = resolve(
    PROJECT_ROOT_V128,
    "_source/vietnam/v124/vietnam-data(4).zip"
  );
  const analysisPath = resolve(
    PROJECT_ROOT_V128,
    "_source/vietnam/v124/source-analysis-v124.json"
  );
  let tracked = [];
  try {
    tracked = execFileSync(
      "git",
      ["ls-files", "--", "_source/vietnam/v124/vietnam-data(4).zip"],
      { cwd: PROJECT_ROOT_V128, encoding: "utf8" }
    )
      .split(/\r?\n/u)
      .filter(Boolean);
  } catch {
    tracked = ["git-check-failed"];
  }
  if (!existsSync(sourcePath)) {
    return {
      present: false,
      tracked,
      hashMatchesManifest: null,
      workbookCountMatchesManifest: null,
      accepted: tracked.length === 0,
    };
  }
  const sourceHash = sha256V128(readFileSync(sourcePath));
  const sourceAnalysis = existsSync(analysisPath)
    ? readJsonV128(analysisPath)
    : null;
  return {
    present: true,
    tracked,
    sourceHash,
    hashMatchesManifest: sourceHash === manifest.sourcePackageSha256,
    workbookCount: sourceAnalysis?.workbooks?.length ?? null,
    workbookCountMatchesManifest:
      sourceAnalysis?.workbooks?.length === manifest.workbookFiles,
    accepted:
      tracked.length === 0 &&
      sourceHash === manifest.sourcePackageSha256 &&
      sourceAnalysis?.workbooks?.length === manifest.workbookFiles,
  };
}

export function buildVietnamReleaseAcceptanceV128({ write = true } = {}) {
  const manifest = readJsonV128(resolve(V2_ROOT_V128, "manifest.json"));
  const catalogDocument = readJsonV128(resolve(V2_ROOT_V128, "catalog.json"));
  const coverageDocument = readJsonV128(
    resolve(V2_ROOT_V128, "framework-coverage.json")
  );
  const quality = readJsonV128(resolve(V2_ROOT_V128, "quality-report.json"));
  const rights = readJsonV128(resolve(V2_ROOT_V128, "rights-matrix.json"));
  const assetIntegrity = readJsonV128(
    resolve(V2_ROOT_V128, "asset-integrity.json")
  );
  const mapIndex = readJsonV128(resolve(V2_ROOT_V128, "map-index.json"));
  const contractsDocument = readJsonV128(
    resolve(
      V2_ROOT_V128,
      "semantic/element-visualization-contracts-v125.json"
    )
  );
  const catalog = [...(catalogDocument.elements || [])].sort((left, right) =>
    left.elementId.localeCompare(right.elementId, "en")
  );
  const coverageById = new Map(
    (coverageDocument.elements || []).map((row) => [row.elementId, row])
  );
  const qualityById = new Map(
    (quality.workbooks || []).map((row) => [row.elementId, row])
  );
  const rightsById = new Map(
    (rights.elements || []).map((row) => [row.elementId, row])
  );
  const contractById = new Map(
    (contractsDocument.contracts || []).map((row) => [row.elementId, row])
  );
  const mapLayerById = new Map(
    (mapIndex.layers || []).map((row) => [row.elementId, row])
  );
  const titleById = curatedTitlesV128();
  const packs = loadPackPayloads();
  if (packs.errors.length > 0) {
    throw new Error(`pack validation failed: ${JSON.stringify(packs.errors)}`);
  }
  const policyApi = compilePolicyV128();
  const limitationCountById = new Map([["A-002", 3]]);
  const acceptanceRows = catalog.map((catalogElement) => {
    const element = {
      ...catalogElement,
      publicTitle:
        titleById.get(catalogElement.elementId) ||
        compactTitleV128(catalogElement.elementLabel) ||
        "데이터",
    };
    const coverage = coverageById.get(element.elementId);
    const workbook = qualityById.get(element.elementId);
    const right = rightsById.get(element.elementId);
    const contract = contractById.get(element.elementId);
    const layer = mapLayerById.get(element.elementId);
    const payload = packs.elements.get(element.elementId);
    const publicPopulatedRows = Number(
      element.rowAccounting?.publicPopulatedRows || 0
    );
    const fallbackYear =
      publicPopulatedRows > 0 ? workbook?.latestYear ?? element.latestYear : null;
    const lastPopulatedYear = populatedYearV128(payload, fallbackYear);
    const finalDisposition =
      FINAL_DISPOSITIONS_V128[element.publicStatus] || "blocked-by-error";
    const failures = [];
    if (!coverage?.accounted) failures.push("element-not-accounted");
    if (publicPopulatedRows > 0 && element.displayAllowed === false) {
      failures.push("populated-data-hidden");
    }
    if (
      publicPopulatedRows === 0 &&
      !["schema-only", "data-entry-planned", "not-collected"].includes(
        element.publicStatus
      )
    ) {
      failures.push("unexplained-empty");
    }
    if (element.downloadAllowed !== true && !downloadReasonV128(element)) {
      failures.push("unexplained-download-disabled");
    }
    if (publicPopulatedRows > 0 && !contract?.primaryRenderer) {
      failures.push("missing-renderer");
    }
    if (publicPopulatedRows > 0 && element.sourceOrganizations.length === 0) {
      failures.push("missing-source-organization");
    }
    if (!right) failures.push("missing-rights-record");
    if (finalDisposition === "blocked-by-error") {
      failures.push("unknown-final-disposition");
    }
    return {
      elementId: element.elementId,
      publicTitle: element.publicTitle,
      category: `${element.categoryCode} · ${element.categoryLabel}`,
      group: `${element.groupCode} · ${element.groupLabel}`,
      sourceWorkbookExists: Boolean(coverage?.workbookExists),
      packageStatus: element.packageStatus,
      dataPresenceStatus: element.dataPresenceStatus,
      publicStatus: element.publicStatus,
      observationRows: Number(workbook?.observationRowCount || 0),
      populatedObservationRows: Number(
        workbook?.observationPopulatedRowCount || 0
      ),
      missingObservationRows: Number(workbook?.observationMissingRowCount || 0),
      entityRows: Number(workbook?.entityRowCount || 0),
      populatedEntityRows: Number(workbook?.entityPopulatedRowCount || 0),
      publicPopulatedRows,
      displayAllowed: element.displayAllowed !== false,
      downloadAllowed: element.downloadAllowed === true,
      downloadableRecordCount: Number(element.downloadableRecordCount || 0),
      downloadRestrictionReason: downloadReasonV128(element),
      visualizationRenderer: contract?.primaryRenderer || "",
      visualizationStatus: contract?.contractStatus || "unassigned",
      mapMode: layer?.mapMode || element.mapMode || "not-applicable",
      mapFeatureCount: Number(layer?.featureCount || element.mapFeatureCount || 0),
      sourceOrganizations: [...element.sourceOrganizations],
      sourceReferencePeriod: referencePeriodV128(element, lastPopulatedYear),
      lastPopulatedYear,
      limitationCount: Number(limitationCountById.get(element.elementId) || 0),
      userFacingStatus: STATUS_LABELS_V128[element.publicStatus] || "상태 확인 필요",
      finalDisposition,
      acceptanceResult: failures.length === 0 ? "PASS" : "FAIL",
      _failures: failures,
      _sourceLicenses: [...(element.rights?.licenses || [])],
      _sourceAttributions: [...(element.rights?.attributionTexts || [])],
      _sourceRightsStatus: element.rights?.status || "unknown",
      _raw: element,
    };
  });

  const technicalKeySet = new Set(
    [
      ...(policyApi.TECHNICAL_PROVENANCE_FIELDS_V126 || []),
      "source_file",
      "source_sheet",
      "source_row",
      "attributes_json",
      "publication_decision_id",
      "indicator_id",
      "record_id",
      "api_params",
      "raw_attributes",
      "pack_url",
      "shard_id",
      "sha256",
    ].map(normalizedKeyV128)
  );
  const downloadRows = acceptanceRows.map((acceptance) => {
    const element = acceptance._raw;
    const semanticsPath = resolve(
      V2_ROOT_V128,
      `semantic/elements/${element.elementId.toLowerCase()}.json`
    );
    const semantics = existsSync(semanticsPath)
      ? readJsonV128(semanticsPath)
      : { indicators: [], records: [] };
    const projection = publicProjectionForElementV128({
      element,
      payload: packs.elements.get(element.elementId),
      policyApi,
      semantics,
    });
    const technicalPaths = technicalPathsV128(
      projection.rows,
      technicalKeySet
    );
    const availabilityClass = availabilityClassV128(element);
    const assetFailures = (element.downloadAssets || []).flatMap((asset) => {
      const path = publicUrlToPath(asset.url);
      if (!path || !existsSync(path) || !statSync(path).isFile()) {
        return [`${asset.format}:missing`];
      }
      return statSync(path).size > 0 ? [] : [`${asset.format}:empty`];
    });
    const standardDownloadOffered = availabilityClass === "downloadable";
    const expectedSafeRows = standardDownloadOffered
      ? projection.eligibleRecordCount
      : 0;
    const projectedSafeRows = standardDownloadOffered ? projection.rows.length : 0;
    const reconciliationResult =
      assetFailures.length === 0 &&
      technicalPaths.length === 0 &&
      expectedSafeRows === projectedSafeRows &&
      (!standardDownloadOffered || projectedSafeRows > 0)
        ? "PASS"
        : "FAIL";
    return {
      elementId: element.elementId,
      publicTitle: acceptance.publicTitle,
      userFacingStatus: acceptance.userFacingStatus,
      publicPopulatedRows: acceptance.publicPopulatedRows,
      catalogDownloadAllowed: acceptance.downloadAllowed,
      catalogDownloadableRecordCount: acceptance.downloadableRecordCount,
      availabilityClass,
      standardDownloadOffered,
      userFacingReason: acceptance.downloadRestrictionReason,
      safeProjectedRecordCount: projectedSafeRows,
      sourceLicenses: acceptance._sourceLicenses,
      sourceAttributions: acceptance._sourceAttributions,
      assetReferenceStatus: assetFailures.length === 0 ? "valid" : "invalid",
      technicalFieldCount: technicalPaths.length,
      reconciliationResult,
      _assetFailures: assetFailures,
      _technicalPaths: technicalPaths,
    };
  });

  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_LABELS_V128).map((status) => [
      status,
      acceptanceRows.filter((row) => row.publicStatus === status).length,
    ])
  );
  const dataBearingRows = acceptanceRows.filter((row) =>
    DATA_BEARING_STATUSES_V128.has(row.publicStatus)
  );
  const catalogDownloadable = acceptanceRows.filter(
    (row) => row.downloadAllowed && row.downloadableRecordCount > 0
  );
  const populatedDownloadable = downloadRows.filter(
    (row) => row.availabilityClass === "downloadable"
  );
  const displayOnly = downloadRows.filter((row) =>
    row.availabilityClass.startsWith("display-only")
  );
  const noPopulatedDownloads = downloadRows.filter(
    (row) => row.availabilityClass === "no-populated-download-record"
  );
  const integrityFailures = verifyIntegrityV128(assetIntegrity);
  const localSourcePackage = verifyLocalSourcePackageV128(manifest);
  const rowBalancePass =
    manifest.rowBalance?.matches === true && quality.summary?.rowBalancePass === true;
  const acceptanceDocument = {
    schemaVersion: "v128",
    generatedAt: GENERATED_AT_V128,
    sourceOfTruth: [
      "/data/vietnam/v2/manifest.json",
      "/data/vietnam/v2/catalog.json",
      "/data/vietnam/v2/framework-coverage.json",
      "/data/vietnam/v2/quality-report.json",
      "/data/vietnam/v2/rights-matrix.json",
      "/data/vietnam/v2/asset-integrity.json",
      "/data/vietnam/v2/map-index.json",
    ],
    summary: {
      frameworkElementCount: coverageDocument.frameworkElementCount,
      accountedElementCount: coverageDocument.accountedElementCount,
      unexplainedElementCount: coverageDocument.unexplainedElementCount,
      sourceWorkbookCount: coverageDocument.sourceWorkbookCount,
      dataBearingElementCount: dataBearingRows.length,
      statusOnlyElementCount: acceptanceRows.length - dataBearingRows.length,
      publicPopulatedRowCount: acceptanceRows.reduce(
        (sum, row) => sum + row.publicPopulatedRows,
        0
      ),
      statusCounts,
      finalDispositionCount: acceptanceRows.filter(
        (row) => row.finalDisposition !== "blocked-by-error"
      ).length,
      blockedByErrorCount: acceptanceRows.filter(
        (row) => row.finalDisposition === "blocked-by-error"
      ).length,
      acceptancePassCount: acceptanceRows.filter(
        (row) => row.acceptanceResult === "PASS"
      ).length,
      acceptanceFailureCount: acceptanceRows.filter(
        (row) => row.acceptanceResult === "FAIL"
      ).length,
      rowBalancePass,
      assetIntegrityPass: integrityFailures.length === 0,
    },
    elements: acceptanceRows.map(({ _failures, _sourceLicenses, _sourceAttributions, _sourceRightsStatus, _raw, ...row }) => row),
  };
  const downloadDocument = {
    schemaVersion: "v128",
    generatedAt: GENERATED_AT_V128,
    summary: {
      catalogDownloadableElementCount: catalogDownloadable.length,
      dataBearingElementCount: dataBearingRows.length,
      populatedDownloadableElementCount: populatedDownloadable.length,
      displayOnlyDataBearingElementCount: displayOnly.length,
      noPopulatedDownloadRecordCount: noPopulatedDownloads.length,
      expectedDifferenceFromSimpleArithmetic: 33,
      reconciledDisplayOnlyDifference: displayOnly.length,
      arithmeticExplanation:
        "catalog의 다운로드 허용 114개에는 populated value가 없는 E-011·E-013이 포함되므로, 데이터 보유 147개 중 실제 populated-downloadable은 112개이고 display-only는 35개입니다.",
      downloadGenerationErrorCount: downloadRows.filter(
        (row) => row.reconciliationResult === "FAIL"
      ).length,
      unexplainedDownloadDisabledCount: downloadRows.filter(
        (row) =>
          row.availabilityClass.startsWith("display-only") &&
          !row.userFacingReason
      ).length,
      technicalFieldCount: downloadRows.reduce(
        (sum, row) => sum + row.technicalFieldCount,
        0
      ),
      emptyDownloadCount: downloadRows.filter(
        (row) => row.standardDownloadOffered && row.safeProjectedRecordCount === 0
      ).length,
      reconciliationPass:
        downloadRows.every((row) => row.reconciliationResult === "PASS") &&
        displayOnly.every((row) => row.userFacingReason.length > 0),
    },
    elements: downloadRows.map(({ _assetFailures, _technicalPaths, ...row }) => row),
  };
  const gapDispositionDocument = {
    schemaVersion: "v128",
    generatedAt: GENERATED_AT_V128,
    countryIso3: "VNM",
    decision: "accepted-gap-disposition",
    records: GAP_RECORDS_V128.map((gap) => {
      const acceptance = acceptanceRows.find((row) => row.elementId === gap.elementId);
      return {
        ...gap,
        publicTitle: acceptance?.publicTitle || gap.elementId,
        catalogStatus: acceptance?.publicStatus || null,
        observationRows: acceptance?.observationRows || 0,
        entityRows: acceptance?.entityRows || 0,
        publicPopulatedRows: acceptance?.publicPopulatedRows || 0,
        acceptanceResult:
          acceptance?.publicStatus === gap.expectedStatus &&
          acceptance?.finalDisposition === gap.finalDisposition &&
          acceptance?.publicPopulatedRows === 0
            ? "PASS"
            : "FAIL",
      };
    }),
  };
  const backlogDocument = {
    schemaVersion: "v128",
    generatedAt: GENERATED_AT_V128,
    accessedAt: ACCESSED_AT_V128,
    countryIso3: "VNM",
    policy:
      "공식 또는 1차 출처만 후보로 기록하며, 요소 적합성과 재배포 권한이 모두 확인되기 전에는 public data asset으로 포함하지 않습니다.",
    acquisitionRequiredForCurrentRelease: false,
    acceptedGapCount: 3,
    items: ["C-020", "C-021", "C-023"].map((elementId) => {
      const acceptance = acceptanceRows.find((row) => row.elementId === elementId);
      return {
        elementId,
        publicTitle: acceptance?.publicTitle || elementId,
        currentDisposition: "not-collected-accepted",
        releaseBlocking: false,
        selectedForSupplementalRelease: false,
        officialSourceCandidates: ACQUISITION_CANDIDATES_V128[elementId].map(
          (candidate) => ({ ...candidate, accessedAt: ACCESSED_AT_V128 })
        ),
        nextAction:
          "source owner의 재배포 조건과 요소별 필드 적합성을 문서화한 뒤 별도 supplemental ETL로 검토",
      };
    }),
  };

  if (write) {
    mkdirSync(REPORT_ROOT_V128, { recursive: true });
    mkdirSync(dirname(GAP_DISPOSITION_PATH_V128), { recursive: true });
    writeFileSync(
      ACCEPTANCE_JSON_PATH_V128,
      `${JSON.stringify(acceptanceDocument, null, 2)}\n`,
      "utf8"
    );
    writeFileSync(
      ACCEPTANCE_CSV_PATH_V128,
      toCsvV128(
        acceptanceDocument.elements,
        REQUIRED_ACCEPTANCE_COLUMNS_V128
      ),
      "utf8"
    );
    const downloadColumns = [
      "elementId",
      "publicTitle",
      "userFacingStatus",
      "publicPopulatedRows",
      "catalogDownloadAllowed",
      "catalogDownloadableRecordCount",
      "availabilityClass",
      "standardDownloadOffered",
      "userFacingReason",
      "safeProjectedRecordCount",
      "sourceLicenses",
      "sourceAttributions",
      "assetReferenceStatus",
      "technicalFieldCount",
      "reconciliationResult",
    ];
    writeFileSync(
      DOWNLOAD_CSV_PATH_V128,
      toCsvV128(downloadDocument.elements, downloadColumns),
      "utf8"
    );
    writeFileSync(
      DOWNLOAD_JSON_PATH_V128,
      `${JSON.stringify(downloadDocument, null, 2)}\n`,
      "utf8"
    );
    writeFileSync(
      GAP_DISPOSITION_PATH_V128,
      `${JSON.stringify(gapDispositionDocument, null, 2)}\n`,
      "utf8"
    );
    writeFileSync(
      ACQUISITION_BACKLOG_PATH_V128,
      `${JSON.stringify(backlogDocument, null, 2)}\n`,
      "utf8"
    );
  }

  return {
    acceptanceDocument,
    downloadDocument,
    gapDispositionDocument,
    backlogDocument,
    diagnostics: {
      integrityFailures,
      localSourcePackage,
      packErrors: packs.errors,
      acceptanceFailures: acceptanceRows
        .filter((row) => row._failures.length > 0)
        .map((row) => ({ elementId: row.elementId, failures: row._failures })),
    },
  };
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const result = buildVietnamReleaseAcceptanceV128({ write: true });
  console.log(
    JSON.stringify({
      type: "summary",
      build: "vietnam-release-acceptance:v128",
      status:
        result.acceptanceDocument.summary.acceptanceFailureCount === 0 &&
        result.downloadDocument.summary.reconciliationPass &&
        result.diagnostics.integrityFailures.length === 0
          ? "PASS"
          : "FAIL",
      acceptance: result.acceptanceDocument.summary,
      downloads: result.downloadDocument.summary,
      gapDispositionCount: result.gapDispositionDocument.records.length,
      acquisitionBacklogCount: result.backlogDocument.items.length,
    })
  );
}
