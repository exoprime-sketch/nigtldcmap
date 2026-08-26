import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import { isDatasetPubliclyVisible } from "./datasetAccess";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import { getAuthoritativeElementIdV88 } from "./elementDatasetRegistryV88";
import {
  buildFinal152ElementServiceRegistryV93,
} from "./final152ElementServiceRegistryV93";
import type {
  Final152ElementServiceRowV93,
} from "./final152ElementServiceRegistryV93";

export type Final152UploadSeverityV93 = "P0" | "P1" | "INFO";

export interface Final152UploadIssueV93 {
  severity: Final152UploadSeverityV93;
  code: string;
  subject: string;
  message: string;
}

export interface Final152UploadAuditV93 {
  status: "PASS" | "CONDITIONALLY_READY" | "FAIL";
  p0: number;
  p1: number;
  info: number;
  facts: {
    authoritativeElements: number;
    actualFull: number;
    actualPartial: number;
    exampleFallback: number;
    publicDatasets: number;
    mapReadyElements: number;
    compareReadyElements: number;
    insightReadyElements: number;
    downloadableElements: number;
    technologyCatalogCount: number;
    technologyLinkCount: number;
  };
  issues: Final152UploadIssueV93[];
  rows: Final152ElementServiceRowV93[];
}

function pushIssue(
  issues: Final152UploadIssueV93[],
  severity: Final152UploadSeverityV93,
  code: string,
  subject: string,
  message: string
) {
  issues.push({ severity, code, subject, message });
}

export function getFinal152UploadAuditV93(): Final152UploadAuditV93 {
  const issues: Final152UploadIssueV93[] = [];
  const rows = buildFinal152ElementServiceRegistryV93();
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);

  const elementIds = AUTHORITATIVE_ELEMENT_SEARCH_V75.map(
    (element) => element.elementId
  );
  const duplicateElements = elementIds.filter(
    (id, index) => elementIds.indexOf(id) !== index
  );

  if (AUTHORITATIVE_ELEMENT_SEARCH_V75.length !== 152) {
    pushIssue(
      issues,
      "P0",
      "AUTHORITATIVE_ELEMENT_COUNT",
      String(AUTHORITATIVE_ELEMENT_SEARCH_V75.length),
      "최종 기준 데이터 항목 수가 152개와 일치하지 않음"
    );
  }

  if (duplicateElements.length > 0) {
    pushIssue(
      issues,
      "P0",
      "DUPLICATE_ELEMENT_ID",
      Array.from(new Set(duplicateElements)).join(", "),
      "152개 기준 목록에 중복 elementId가 존재함"
    );
  }

  publicDatasets.forEach((dataset) => {
    const authoritativeId = getAuthoritativeElementIdV88(dataset);

    if (
      !authoritativeId.startsWith("SUPPORT-") &&
      !elementIds.includes(authoritativeId)
    ) {
      pushIssue(
        issues,
        "P0",
        "PUBLIC_DATASET_ELEMENT_UNKNOWN",
        dataset.id,
        `공개 Dataset이 존재하지 않는 elementId ${authoritativeId}에 연결됨`
      );
    }

    if (!dataset.sourceOrganization.trim() || !dataset.sourceUrl.trim()) {
      pushIssue(
        issues,
        "P0",
        "PUBLIC_SOURCE_MISSING",
        dataset.id,
        "실제 공개 Dataset의 출처기관 또는 원 데이터 URL이 비어 있음"
      );
    }

    if (!dataset.period.trim() && !dataset.referenceYear.trim()) {
      pushIssue(
        issues,
        "P1",
        "REFERENCE_PERIOD_MISSING",
        dataset.id,
        "실제 공개 Dataset의 기준기간·기준연도가 모두 비어 있음"
      );
    }

    const hasDeliveryPath = Boolean(
      dataset.indicatorId ||
        dataset.dataPayloadUrl ||
        dataset.resourceUrl ||
        dataset.api ||
        dataset.downloadMode === "source_link" ||
        dataset.resources.some((resource) => Boolean(resource.url))
    );

    if (!hasDeliveryPath) {
      pushIssue(
        issues,
        "P1",
        "DATA_DELIVERY_PATH_MISSING",
        dataset.id,
        "공개 Dataset이 등록되어 있으나 값/API/payload/원문 링크의 전달경로가 확인되지 않음"
      );
    }
  });

  const publicDatasetIds = new Set(publicDatasets.map((dataset) => dataset.id));

  MAP_DATA_CATALOG.forEach((layer) => {
    if (layer.datasetId && !publicDatasetIds.has(layer.datasetId)) {
      pushIssue(
        issues,
        "P0",
        "MAP_LAYER_NONPUBLIC_DATASET",
        layer.key,
        `지도 레이어가 공개 Dataset이 아닌 ${layer.datasetId}를 참조함`
      );
    }
  });

  const technologyIds = new Set(CLIMATE_TECHNOLOGIES.map((item) => item.id));
  DATASET_TECHNOLOGY_LINKS.forEach((link) => {
    if (!DATASETS.some((dataset) => dataset.id === link.datasetId)) {
      pushIssue(
        issues,
        "P0",
        "TECH_LINK_DATASET_MISSING",
        link.datasetId,
        "기후기술 연결이 존재하지 않는 Dataset을 참조함"
      );
    }
    if (link.technologyId !== "all" && !technologyIds.has(link.technologyId)) {
      pushIssue(
        issues,
        "P0",
        "TECH_LINK_UNKNOWN_TECHNOLOGY",
        link.technologyId,
        `38대 기후기술 catalog에 없는 기술 ID가 연결됨 · Dataset ${link.datasetId}`
      );
    }
  });

  const exampleRows = rows.filter(
    (row) => row.serviceMode === "example_fallback"
  );
  if (exampleRows.length > 0) {
    pushIssue(
      issues,
      "INFO",
      "EXAMPLE_FALLBACK_ACTIVE",
      `${exampleRows.length} / 152`,
      "실제 공개 Dataset 직접 연결 전 항목은 이용자 상세화면의 예시 표시로 유지 · 이는 오류가 아니며 실제 판단 근거에서는 제외"
    );
  }

  const partialRows = rows.filter(
    (row) => row.serviceMode === "actual_partial"
  );
  if (partialRows.length > 0) {
    pushIssue(
      issues,
      "INFO",
      "PARTIAL_ACTUAL_DATA",
      `${partialRows.length} / 152`,
      "일부 실제자료만 연결된 항목이 존재함 · 제공된 값과 미연결 세부항목을 화면에서 구분"
    );
  }

  const p0 = issues.filter((issue) => issue.severity === "P0").length;
  const p1 = issues.filter((issue) => issue.severity === "P1").length;
  const info = issues.filter((issue) => issue.severity === "INFO").length;

  return {
    status: p0 > 0 ? "FAIL" : p1 > 0 ? "CONDITIONALLY_READY" : "PASS",
    p0,
    p1,
    info,
    facts: {
      authoritativeElements: rows.length,
      actualFull: rows.filter((row) => row.serviceMode === "actual_full")
        .length,
      actualPartial: partialRows.length,
      exampleFallback: exampleRows.length,
      publicDatasets: publicDatasets.length,
      mapReadyElements: rows.filter((row) => row.mapReady).length,
      compareReadyElements: rows.filter((row) => row.compareReady).length,
      insightReadyElements: rows.filter((row) => row.insightReady).length,
      downloadableElements: rows.filter((row) => row.downloadReady).length,
      technologyCatalogCount: CLIMATE_TECHNOLOGIES.length,
      technologyLinkCount: DATASET_TECHNOLOGY_LINKS.length,
    },
    issues,
    rows,
  };
}

export function runFinal152UploadAuditV93(): Final152UploadAuditV93 {
  const result = getFinal152UploadAuditV93();
  const method = result.status === "FAIL" ? console.error : console.info;

  method(
    `[Final 152 upload audit v93] ${result.status} · P0 ${result.p0} · P1 ${result.p1} · ` +
      `실제완료 ${result.facts.actualFull} · 일부실제 ${result.facts.actualPartial} · ` +
      `예시 fallback ${result.facts.exampleFallback} / ${result.facts.authoritativeElements}`
  );

  console.info(
    `[Final 152 upload audit v93] 지도 ${result.facts.mapReadyElements} · ` +
      `국가비교 ${result.facts.compareReadyElements} · 협력인사이트 ${result.facts.insightReadyElements} · ` +
      `다운로드 ${result.facts.downloadableElements}`
  );

  if (result.issues.length > 0) {
    console.groupCollapsed(
      `[Final 152 upload audit v93] issues ${result.issues.length}`
    );
    result.issues.forEach((issue) => {
      const logger =
        issue.severity === "P0"
          ? console.error
          : issue.severity === "P1"
          ? console.warn
          : console.info;
      logger(
        `[${issue.severity}] ${issue.code} · ${issue.subject} · ${issue.message}`
      );
    });
    console.groupEnd();
  }

  // 개발 Preview에서만 수동 확인할 수 있도록 window에 결과를 노출한다.
  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_FINAL_152_V93__?: Final152UploadAuditV93;
      }
    ).__LDC_FINAL_152_V93__ = result;
  }

  return result;
}
