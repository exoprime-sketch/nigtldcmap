import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import {
  BUG_REGISTER_V97,
  SEARCH_SYNONYMS_V97,
  SOURCE_REFRESH_RULES_V97,
  TECHNOLOGY_LINK_CANDIDATES_V97,
  TECHNOLOGY_MAPPING_REVIEW_V97,
  VERIFIED_LOCATIONS_V97,
} from "../data/operations/operationalUpdateRegistryV97";

export interface OperationalAuditV97 {
  status: "OPERATIONAL_READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  warnings: string[];
  info: string[];
  summary: {
    datasets: number;
    refreshRules: number;
    technologyLinks: number;
    candidateTechnologyLinks: number;
    verifiedLocations: number;
    synonyms: number;
    openBugs: number;
  };
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const httpUrl = /^https?:\/\//i;

export function runOperationalUpdateAuditV97(): OperationalAuditV97 {
  const warnings: string[] = [];
  const info: string[] = [];
  const datasetIds = new Set(DATASETS.map((dataset) => dataset.id));
  const techIds = new Set(
    CLIMATE_TECHNOLOGIES.map((technology) => technology.id)
  );
  const countryIds = new Set<string>(
    PRIORITY_COUNTRIES.map((country) => country.iso3)
  );
  const elementIds = new Set(
    AUTHORITATIVE_ELEMENT_SEARCH_V75.map((element) => element.elementId)
  );

  for (const rule of SOURCE_REFRESH_RULES_V97) {
    if (!datasetIds.has(rule.datasetId)) {
      warnings.push(`SOURCE_REFRESH_UNKNOWN_DATASET:${rule.datasetId}`);
    }
    if (rule.sourceUrl && !httpUrl.test(rule.sourceUrl)) {
      warnings.push(`SOURCE_REFRESH_BAD_URL:${rule.datasetId}`);
    }
  }

  for (const rule of SEARCH_SYNONYMS_V97) {
    if (rule.aliases.length === 0) {
      warnings.push(`SEARCH_ALIAS_EMPTY:${rule.targetType}:${rule.targetId}`);
      continue;
    }
    const exists =
      rule.targetType === "dataset"
        ? datasetIds.has(rule.targetId)
        : rule.targetType === "technology"
        ? techIds.has(rule.targetId)
        : rule.targetType === "country"
        ? countryIds.has(rule.targetId)
        : rule.targetType === "element"
        ? elementIds.has(rule.targetId)
        : false;
    if (!exists)
      warnings.push(
        `SEARCH_ALIAS_UNKNOWN_TARGET:${rule.targetType}:${rule.targetId}`
      );
  }

  for (const link of TECHNOLOGY_LINK_CANDIDATES_V97) {
    if (!datasetIds.has(link.datasetId))
      warnings.push(`TECH_LINK_UNKNOWN_DATASET:${link.datasetId}`);
    if (link.technologyId !== "all" && !techIds.has(link.technologyId)) {
      warnings.push(
        `TECH_LINK_UNKNOWN_TECH:${link.datasetId}:${link.technologyId}`
      );
    }
    if (!link.basisKo.trim())
      warnings.push(
        `TECH_LINK_NO_BASIS:${link.datasetId}:${link.technologyId}`
      );
  }

  for (const review of TECHNOLOGY_MAPPING_REVIEW_V97) {
    if (!datasetIds.has(review.datasetId))
      warnings.push(`TECH_REVIEW_UNKNOWN_DATASET:${review.datasetId}`);
    const existing = DATASET_TECHNOLOGY_LINKS.filter(
      (link) => link.datasetId === review.datasetId
    );
    if (review.status === "confirmed" && existing.length === 0) {
      warnings.push(`TECH_REVIEW_CONFIRMED_WITHOUT_LINK:${review.datasetId}`);
    }
  }

  for (const location of VERIFIED_LOCATIONS_V97) {
    if (!datasetIds.has(location.datasetId))
      warnings.push(`LOCATION_UNKNOWN_DATASET:${location.recordId}`);
    if (
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      warnings.push(`LOCATION_RANGE:${location.recordId}`);
    }
    if (!httpUrl.test(location.evidenceUrl))
      warnings.push(`LOCATION_NO_EVIDENCE_URL:${location.recordId}`);
    if (!isoDate.test(location.verifiedAt))
      warnings.push(`LOCATION_BAD_VERIFIED_AT:${location.recordId}`);
    if (location.accuracy === "approximate" && location.publicVisible) {
      warnings.push(`LOCATION_APPROXIMATE_PUBLIC:${location.recordId}`);
    }
  }

  const openP0 = BUG_REGISTER_V97.filter(
    (bug) => bug.status === "open" && bug.severity === "P0"
  );
  const openP1 = BUG_REGISTER_V97.filter(
    (bug) => bug.status === "open" && bug.severity === "P1"
  );
  const openBugs = BUG_REGISTER_V97.filter((bug) => bug.status === "open");

  const refreshMissing = DATASETS.filter(
    (dataset) =>
      !dataset.isSynthetic &&
      !SOURCE_REFRESH_RULES_V97.some((rule) => rule.datasetId === dataset.id)
  );
  if (refreshMissing.length) {
    info.push(
      `SOURCE_REFRESH_RULE_MISSING:${refreshMissing.map((d) => d.id).join(",")}`
    );
  }

  const status: OperationalAuditV97["status"] =
    openP0.length > 0 ||
    warnings.some(
      (w) => w.startsWith("LOCATION_RANGE") || w.startsWith("TECH_LINK_UNKNOWN")
    )
      ? "BLOCKED"
      : openP1.length > 0 || warnings.length > 0
      ? "CONDITIONALLY_READY"
      : "OPERATIONAL_READY";

  const result: OperationalAuditV97 = {
    status,
    p0: openP0.length,
    p1: openP1.length,
    warnings,
    info,
    summary: {
      datasets: DATASETS.length,
      refreshRules: SOURCE_REFRESH_RULES_V97.length,
      technologyLinks: DATASET_TECHNOLOGY_LINKS.length,
      candidateTechnologyLinks: TECHNOLOGY_LINK_CANDIDATES_V97.length,
      verifiedLocations: VERIFIED_LOCATIONS_V97.length,
      synonyms: SEARCH_SYNONYMS_V97.reduce(
        (sum, rule) => sum + rule.aliases.length,
        0
      ),
      openBugs: openBugs.length,
    },
  };

  console.info(
    `[Operational update audit v97] ${result.status} · P0 ${result.p0} · P1 ${result.p1} · datasets ${result.summary.datasets} · tech links ${result.summary.technologyLinks} · aliases ${result.summary.synonyms} · verified locations ${result.summary.verifiedLocations}`
  );
  if (warnings.length)
    console.warn("[Operational update audit v97] warnings", warnings);
  if (info.length) console.info("[Operational update audit v97] info", info);
  return result;
}
