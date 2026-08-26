import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import {
  datasetCoversCountry,
  isDatasetPubliclyVisible,
} from "./datasetAccess";
import { getElementCoverageStatus } from "./dataElementCoverageV64";
import { getAuthoritativeElementIdV88 } from "./elementDatasetRegistryV88";

export type FinalLinkageSeverityV91 = "P0" | "P1" | "INFO";

export interface FinalLinkageIssueV91 {
  severity: FinalLinkageSeverityV91;
  code: string;
  subject: string;
  message: string;
}

export interface FinalDataLinkageAuditV91 {
  status: "PASS" | "CONDITIONALLY_READY" | "FAIL";
  p0: number;
  p1: number;
  info: number;
  issues: FinalLinkageIssueV91[];
  facts: {
    authoritativeElementCount: number;
    publicDatasetCount: number;
    fullElementCount: number;
    partialElementCount: number;
    pendingElementCount: number;
    mapCatalogCount: number;
    technologyLinkCount: number;
    countryCoverage: Record<
      string,
      { full: number; partial: number; pending: number }
    >;
  };
  pendingElementIds: string[];
}

function getCoverageForCountry(
  iso3: string,
  countryNameKo: string,
  countryNameEn: string
) {
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible).filter(
    (dataset) =>
      iso3 === "ALL" ||
      datasetCoversCountry(dataset, countryNameKo, countryNameEn)
  );

  let full = 0;
  let partial = 0;
  let pending = 0;
  const pendingElementIds: string[] = [];

  AUTHORITATIVE_ELEMENT_SEARCH_V75.forEach((element) => {
    const datasets = publicDatasets.filter(
      (dataset) => getAuthoritativeElementIdV88(dataset) === element.elementId
    );
    const status = getElementCoverageStatus(element.elementId, datasets);
    if (status === "full") full += 1;
    else if (status === "partial") partial += 1;
    else {
      pending += 1;
      pendingElementIds.push(element.elementId);
    }
  });

  return { iso3, full, partial, pending, pendingElementIds };
}

export function getFinalDataLinkageAuditV91(): FinalDataLinkageAuditV91 {
  const issues: FinalLinkageIssueV91[] = [];
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);

  const allCoverage = getCoverageForCountry("ALL", "전체", "All");
  const countryCoverage: FinalDataLinkageAuditV91["facts"]["countryCoverage"] =
    {};

  PRIORITY_COUNTRIES.forEach((country) => {
    const coverage = getCoverageForCountry(
      country.iso3,
      country.nameKo,
      "nameEn" in country && typeof country.nameEn === "string"
        ? country.nameEn
        : country.nameKo
    );
    countryCoverage[country.iso3] = {
      full: coverage.full,
      partial: coverage.partial,
      pending: coverage.pending,
    };
  });

  if (allCoverage.pending > 0) {
    issues.push({
      severity: "P1",
      code: "AUTHORITATIVE_ELEMENT_LINKAGE_INCOMPLETE",
      subject: `${allCoverage.pending} / ${AUTHORITATIVE_ELEMENT_SEARCH_V75.length}`,
      message:
        "현재 프로젝트 registry에서 공개 Dataset과 직접 연결되지 않은 authoritative element가 남아 있음 · 원천파일 업로드 완료와 화면 연결 완료는 별도 상태이므로 Release Candidate 전에 실제 payload/registry 연결 여부를 확인",
    });
  }

  publicDatasets.forEach((dataset) => {
    if (!dataset.sourceOrganization.trim() || !dataset.sourceUrl.trim()) {
      issues.push({
        severity: "P0",
        code: "PUBLIC_SOURCE_MISSING",
        subject: dataset.id,
        message: "공개 Dataset의 출처기관 또는 원 데이터 URL이 비어 있음",
      });
    }
    if (!dataset.period.trim() && !dataset.referenceYear.trim()) {
      issues.push({
        severity: "P1",
        code: "PUBLIC_REFERENCE_PERIOD_MISSING",
        subject: dataset.id,
        message: "공개 Dataset의 기준기간·기준연도가 모두 비어 있음",
      });
    }
  });

  const publicIds = new Set(publicDatasets.map((dataset) => dataset.id));
  MAP_DATA_CATALOG.forEach((item) => {
    if (item.datasetId && !publicIds.has(item.datasetId)) {
      issues.push({
        severity: "P0",
        code: "MAP_LAYER_NONPUBLIC_DATASET",
        subject: item.key,
        message: `지도 레이어가 공개되지 않은 Dataset ${item.datasetId}를 참조함`,
      });
    }
  });

  DATASET_TECHNOLOGY_LINKS.forEach((link) => {
    if (!DATASETS.some((dataset) => dataset.id === link.datasetId)) {
      issues.push({
        severity: "P0",
        code: "TECHNOLOGY_LINK_DATASET_MISSING",
        subject: link.datasetId,
        message: "기후기술 연결이 존재하지 않는 Dataset을 참조함",
      });
    }
  });

  const p0 = issues.filter((item) => item.severity === "P0").length;
  const p1 = issues.filter((item) => item.severity === "P1").length;
  const info = issues.filter((item) => item.severity === "INFO").length;

  return {
    status: p0 > 0 ? "FAIL" : p1 > 0 ? "CONDITIONALLY_READY" : "PASS",
    p0,
    p1,
    info,
    issues,
    facts: {
      authoritativeElementCount: AUTHORITATIVE_ELEMENT_SEARCH_V75.length,
      publicDatasetCount: publicDatasets.length,
      fullElementCount: allCoverage.full,
      partialElementCount: allCoverage.partial,
      pendingElementCount: allCoverage.pending,
      mapCatalogCount: MAP_DATA_CATALOG.length,
      technologyLinkCount: DATASET_TECHNOLOGY_LINKS.length,
      countryCoverage,
    },
    pendingElementIds: allCoverage.pendingElementIds,
  };
}

export function runFinalDataLinkageAuditV91(): FinalDataLinkageAuditV91 {
  const result = getFinalDataLinkageAuditV91();
  const logger = result.status === "FAIL" ? console.error : console.info;
  logger(
    `[Final data-linkage audit v91] ${result.status} · P0 ${result.p0} · P1 ${result.p1} · ` +
      `제공 ${result.facts.fullElementCount} · 일부 ${result.facts.partialElementCount} · ` +
      `미연결 ${result.facts.pendingElementCount} / ${result.facts.authoritativeElementCount}`
  );

  if (result.issues.length > 0) {
    console.groupCollapsed(
      `[Final data-linkage audit v91] issues ${result.issues.length}`
    );
    result.issues.forEach((issue) => {
      const method = issue.severity === "P0" ? console.error : console.warn;
      method(
        `[${issue.severity}] ${issue.code} · ${issue.subject} · ${issue.message}`
      );
    });
    console.groupEnd();
  }

  if (result.pendingElementIds.length > 0) {
    console.groupCollapsed(
      `[Final data-linkage audit v91] 미연결 authoritative elements ${result.pendingElementIds.length}`
    );
    console.info(result.pendingElementIds.join(", "));
    console.groupEnd();
  }

  return result;
}
