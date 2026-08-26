import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import {
  OPERATIONAL_BATCH_V98,
  OPERATIONAL_BUGS_V98,
  SOURCE_REFRESH_ACTIONS_V98,
  VERIFIED_LOCATIONS_V98,
} from "../data/operations/operationalBatchV98";

export interface OperationalBatchAuditV98 {
  status: "READY_FOR_REFRESH" | "BLOCKED";
  p0: number;
  p1: number;
  datasets: number;
  refreshNow: number;
  verifyNow: number;
  techLinks: number;
  verifiedLocations: number;
  projectRelations: number;
  issues: string[];
}

export async function runOperationalBatchAuditV98(): Promise<OperationalBatchAuditV98> {
  const issues: string[] = [];
  const open = OPERATIONAL_BUGS_V98.filter((item) => item.status === "open");
  const p0 = open.filter((item) => item.severity === "P0").length;
  const p1 = open.filter((item) => item.severity === "P1").length;

  SOURCE_REFRESH_ACTIONS_V98.forEach((item) => {
    if (
      (item.action === "refresh_now" || item.action === "verify_now") &&
      !item.sourceUrl
    ) {
      issues.push(`MISSING_SOURCE_URL:${item.datasetId}`);
    }
  });

  VERIFIED_LOCATIONS_V98.forEach((item) => {
    if (
      !Number.isFinite(item.latitude) ||
      !Number.isFinite(item.longitude) ||
      item.latitude < -90 ||
      item.latitude > 90 ||
      item.longitude < -180 ||
      item.longitude > 180 ||
      !item.evidenceUrl ||
      !item.verifiedAt
    ) {
      issues.push(`INVALID_VERIFIED_LOCATION:${item.recordId}`);
    }
  });

  try {
    const response = await fetch(
      "/data/gcf/gcf-priority-country-projects-2026-08-11.json",
      { cache: "no-store" }
    );
    if (!response.ok) {
      issues.push(`GCF_PROJECT_FILE_HTTP_${response.status}`);
    } else {
      const data = await response.json();
      const count = Array.isArray(data?.records) ? data.records.length : -1;
      if (count !== OPERATIONAL_BATCH_V98.gcfProjectRelationCount) {
        issues.push(`GCF_PROJECT_RELATION_COUNT:${count}`);
      }
    }
  } catch (error) {
    issues.push(`GCF_PROJECT_FILE_FETCH:${String(error)}`);
  }

  const blockingIssues = issues.filter(
    (item) =>
      item.startsWith("INVALID_VERIFIED_LOCATION") ||
      item.startsWith("MISSING_SOURCE_URL")
  );
  const status =
    p0 === 0 && p1 === 0 && blockingIssues.length === 0
      ? "READY_FOR_REFRESH"
      : "BLOCKED";

  const result: OperationalBatchAuditV98 = {
    status,
    p0,
    p1,
    datasets: DATASETS.length,
    refreshNow: SOURCE_REFRESH_ACTIONS_V98.filter(
      (item) => item.action === "refresh_now"
    ).length,
    verifyNow: SOURCE_REFRESH_ACTIONS_V98.filter(
      (item) => item.action === "verify_now"
    ).length,
    techLinks: DATASET_TECHNOLOGY_LINKS.length,
    verifiedLocations: VERIFIED_LOCATIONS_V98.length,
    projectRelations: OPERATIONAL_BATCH_V98.gcfProjectRelationCount,
    issues,
  };

  console.info(
    `[Operational batch audit v98] ${result.status} · P0 ${result.p0} · P1 ${result.p1} · datasets ${result.datasets} · refresh-now ${result.refreshNow} · verify-now ${result.verifyNow} · tech-links ${result.techLinks} · verified-locations ${result.verifiedLocations} · GCF project relations ${result.projectRelations}`
  );
  if (issues.length)
    console.info("[Operational batch audit v98] issues", issues);
  return result;
}
