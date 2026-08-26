import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import { isDatasetPubliclyVisible } from "./datasetAccess";
import {
  buildElementDatasetIndexV88,
  getAuthoritativeElementIdV88,
  isSupportElementIdV88,
} from "./elementDatasetRegistryV88";

export type ReleaseAuditSeverityV88 = "P0" | "P1" | "INFO";

export interface ReleaseAuditIssueV88 {
  severity: ReleaseAuditSeverityV88;
  code: string;
  subject: string;
  message: string;
}

export interface ReleaseAuditSummaryV88 {
  status: "PASS" | "FAIL";
  p0: number;
  p1: number;
  info: number;
  issues: ReleaseAuditIssueV88[];
  facts: {
    authoritativeElementCount: number;
    datasetCount: number;
    publicDatasetCount: number;
    mappedAuthoritativeElementCount: number;
    mapCatalogCount: number;
    technologyLinkCount: number;
    legacySearchLinkMismatchCount: number;
  };
}

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function sameSet(a: string[], b: string[]): boolean {
  const aa = Array.from(new Set(a)).sort();
  const bb = Array.from(new Set(b)).sort();
  return JSON.stringify(aa) === JSON.stringify(bb);
}

export function getReleaseAuditSummaryV88(): ReleaseAuditSummaryV88 {
  const issues: ReleaseAuditIssueV88[] = [];
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);
  const datasetIds = new Set(DATASETS.map((dataset) => dataset.id));
  const publicDatasetIds = new Set(publicDatasets.map((dataset) => dataset.id));
  const technologyIds = new Set(CLIMATE_TECHNOLOGIES.map((item) => item.id));
  const authoritativeIds = new Set(
    AUTHORITATIVE_ELEMENT_SEARCH_V75.map((item) => item.elementId)
  );
  const dynamicIndex = buildElementDatasetIndexV88(publicDatasets);

  duplicateValues(
    AUTHORITATIVE_ELEMENT_SEARCH_V75.map((item) => item.elementId)
  ).forEach((elementId) => {
    issues.push({
      severity: "P0",
      code: "DUPLICATE_ELEMENT_ID",
      subject: elementId,
      message: "152개 authoritative registry에서 elementId가 중복됨",
    });
  });

  duplicateValues(DATASETS.map((dataset) => dataset.id)).forEach(
    (datasetId) => {
      issues.push({
        severity: "P0",
        code: "DUPLICATE_DATASET_ID",
        subject: datasetId,
        message: "Dataset ID가 중복됨",
      });
    }
  );

  duplicateValues(MAP_DATA_CATALOG.map((item) => item.key)).forEach((key) => {
    issues.push({
      severity: "P0",
      code: "DUPLICATE_MAP_LAYER_KEY",
      subject: key,
      message: "지도 레이어 key가 중복됨",
    });
  });

  DATASETS.forEach((dataset) => {
    const authoritativeId = getAuthoritativeElementIdV88(dataset);
    if (
      !isSupportElementIdV88(authoritativeId) &&
      !authoritativeIds.has(authoritativeId)
    ) {
      issues.push({
        severity: "P0",
        code: "UNKNOWN_AUTHORITATIVE_ELEMENT",
        subject: dataset.id,
        message: `authoritative element ${authoritativeId}가 152개 registry에 없음`,
      });
    }
  });

  publicDatasets.forEach((dataset) => {
    if (
      dataset.id.startsWith("LDC-EXAMPLE") ||
      dataset.isSynthetic === true ||
      dataset.sourceType === "synthetic_example" ||
      dataset.accessLevel === "example" ||
      dataset.accessLevel === "internal"
    ) {
      issues.push({
        severity: "P0",
        code: "PUBLIC_EXAMPLE_DATA",
        subject: dataset.id,
        message: "예시·synthetic·internal Dataset이 공개 게이트를 통과함",
      });
    }

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

  MAP_DATA_CATALOG.forEach((item) => {
    if (!item.datasetId) return;
    if (!datasetIds.has(item.datasetId)) {
      issues.push({
        severity: "P0",
        code: "MAP_DATASET_MISSING",
        subject: item.key,
        message: `지도 레이어가 존재하지 않는 Dataset ${item.datasetId}를 참조함`,
      });
      return;
    }

    if (!publicDatasetIds.has(item.datasetId)) {
      issues.push({
        severity: "P0",
        code: "MAP_NONPUBLIC_DATASET",
        subject: item.key,
        message: `지도 레이어가 공개 대상이 아닌 Dataset ${item.datasetId}를 참조함`,
      });
    }
  });

  DATASET_TECHNOLOGY_LINKS.forEach((link) => {
    if (!datasetIds.has(link.datasetId)) {
      issues.push({
        severity: "P0",
        code: "TECH_LINK_DATASET_MISSING",
        subject: link.datasetId,
        message: "38대 기후기술 연결표가 존재하지 않는 Dataset을 참조함",
      });
    }

    if (link.technologyId !== "all" && !technologyIds.has(link.technologyId)) {
      issues.push({
        severity: "P0",
        code: "TECH_LINK_TECHNOLOGY_MISSING",
        subject: link.technologyId,
        message: "기후기술 연결표가 존재하지 않는 기술 ID를 참조함",
      });
    }
  });

  let legacySearchLinkMismatchCount = 0;
  AUTHORITATIVE_ELEMENT_SEARCH_V75.forEach((element) => {
    const dynamicIds =
      dynamicIndex.get(element.elementId)?.map((dataset) => dataset.id) ?? [];
    if (!sameSet(element.datasetIds, dynamicIds)) {
      legacySearchLinkMismatchCount += 1;
    }
  });

  if (legacySearchLinkMismatchCount > 0) {
    issues.push({
      severity: "INFO",
      code: "LEGACY_SEARCH_LINKS_IGNORED",
      subject: `${legacySearchLinkMismatchCount} elements`,
      message:
        "authoritativeElementSearchV75의 과거 datasetIds snapshot과 현재 Dataset registry가 다름 · v88 전역검색은 현재 registry를 동적으로 사용하므로 공개 기능에는 사용하지 않음",
    });
  }

  const p0 = issues.filter((issue) => issue.severity === "P0").length;
  const p1 = issues.filter((issue) => issue.severity === "P1").length;
  const info = issues.filter((issue) => issue.severity === "INFO").length;

  return {
    status: p0 === 0 ? "PASS" : "FAIL",
    p0,
    p1,
    info,
    issues,
    facts: {
      authoritativeElementCount: AUTHORITATIVE_ELEMENT_SEARCH_V75.length,
      datasetCount: DATASETS.length,
      publicDatasetCount: publicDatasets.length,
      mappedAuthoritativeElementCount: dynamicIndex.size,
      mapCatalogCount: MAP_DATA_CATALOG.length,
      technologyLinkCount: DATASET_TECHNOLOGY_LINKS.length,
      legacySearchLinkMismatchCount,
    },
  };
}

export function runReleaseAuditV88(): ReleaseAuditSummaryV88 {
  const summary = getReleaseAuditSummaryV88();
  const log = summary.status === "PASS" ? console.info : console.error;

  log(
    `[RC audit v88] ${summary.status} · P0 ${summary.p0} · P1 ${summary.p1} · ` +
      `authoritative ${summary.facts.authoritativeElementCount} · ` +
      `public datasets ${summary.facts.publicDatasetCount} · ` +
      `map layers ${summary.facts.mapCatalogCount}`
  );

  if (summary.issues.length > 0) {
    console.groupCollapsed(
      `[RC audit v88] issues ${summary.issues.length} · legacy search-link mismatch ` +
        summary.facts.legacySearchLinkMismatchCount
    );
    summary.issues.forEach((issue) => {
      const method = issue.severity === "P0" ? console.error : console.warn;
      method(
        `[${issue.severity}] ${issue.code} · ${issue.subject} · ${issue.message}`
      );
    });
    console.groupEnd();
  }

  return summary;
}
