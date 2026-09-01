import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { ELEMENT_PRESENTATION_SPECS_V100 } from "../data/elementPresentationRegistryV100";
import { GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99 } from "../data/gcf/gcfProjectTechnologyMappingV99";
import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { DATASETS } from "../data/publicDatasets";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import { isDatasetPubliclyVisible } from "./datasetAccess";
import {
  getAuthoritativeElementIdV88,
  isSupportElementIdV88,
} from "./elementDatasetRegistryV88";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

export async function runOperationalFinalizationAuditV101() {
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);
  const actualElements = new Set(
    publicDatasets
      .map(getAuthoritativeElementIdV88)
      .filter((id) => !isSupportElementIdV88(id))
  );
  const required = [
    publicAssetUrlV128("data/catalog/authoritative-elements-v101.json"),
    publicAssetUrlV128("data/gcf/gcf-priority-country-projects-2026-08-13.json"),
    publicAssetUrlV128("data/gcf/gcf-priority-country-current-check-2026-08-13.json"),
    publicAssetUrlV128("data/gcf/gcf-project-technology-mapping-2026-08-13.json"),
    publicAssetUrlV128("data/gcf/gcf-location-verification-2026-08-13.json"),
    publicAssetUrlV128(
      "data/platform/organizations/E-003__gcf-vnm-organizations__20260813.json"
    ),
  ];
  const fetched = await Promise.all(
    required.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        return {
          url,
          ok: response.ok,
          json: response.ok ? await response.json() : null,
        };
      } catch {
        return { url, ok: false, json: null };
      }
    })
  );

  const catalog: any = fetched[0]?.json;
  const projects: any = fetched[1]?.json;
  const check: any = fetched[2]?.json;
  const mapping: any = fetched[3]?.json;
  const locations: any = fetched[4]?.json;
  const techIds = new Set(CLIMATE_TECHNOLOGIES.map((item) => item.id));
  const issues: string[] = [];

  if (AUTHORITATIVE_ELEMENT_SEARCH_V75.length !== 152)
    issues.push(`authoritative ${AUTHORITATIVE_ELEMENT_SEARCH_V75.length}/152`);
  if (ELEMENT_PRESENTATION_SPECS_V100.length !== 152)
    issues.push(`presentation ${ELEMENT_PRESENTATION_SPECS_V100.length}/152`);
  if (DATASETS.length !== 39) issues.push(`datasets ${DATASETS.length}/39`);
  if (publicDatasets.length !== 35)
    issues.push(`public datasets ${publicDatasets.length}/35`);
  if (actualElements.size !== 23)
    issues.push(`visible authoritative elements ${actualElements.size}/23`);
  if (MAP_DATA_CATALOG.length !== 31)
    issues.push(`map catalog ${MAP_DATA_CATALOG.length}/31`);
  if (fetched.some((item) => !item.ok))
    issues.push("required v101 public payload load failure");
  if (catalog?.elements?.length !== 152)
    issues.push(`service catalog ${catalog?.elements?.length ?? 0}/152`);
  if (catalog?.meta?.demoOnlyCount !== 129)
    issues.push(
      `service catalog pending ${catalog?.meta?.demoOnlyCount ?? 0}/129`
    );
  if (
    JSON.stringify(catalog ?? {}).includes("시연값 · 실제") ||
    JSON.stringify(catalog ?? {}).includes("예: 핵심값")
  )
    issues.push("service catalog contains synthetic sample values");
  if (projects?.metadata?.relationRecordCount !== 109)
    issues.push("GCF relations != 109");
  if (check?.countries?.length !== 10) issues.push("GCF current checks != 10");
  if (mapping?.mappings?.length !== 28)
    issues.push(`GCF tech mappings ${mapping?.mappings?.length ?? 0}/28`);
  if (
    new Set(
      (mapping?.mappings ?? []).map(
        (item: any) => `${item.countryIso3}:${item.projectId}`
      )
    ).size !== 18
  )
    issues.push("mapped project relations != 18");
  if (
    (mapping?.mappings ?? []).some(
      (item: any) => !techIds.has(item.technologyId)
    )
  )
    issues.push("unknown technology id in GCF mapping");
  if (GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99.length !== 28)
    issues.push("TS/JSON mapping count mismatch");
  if (
    locations?.metadata?.reviewedCandidateCount !== 5 ||
    locations?.metadata?.verifiedPointCount !== 0
  )
    issues.push("location verification invariant failed");

  const status = issues.length === 0 ? "OPERATIONAL_FINALIZED" : "BLOCKED";
  console.info(
    `[Operational finalization audit v101] ${status} · P0 ${
      issues.length ? 1 : 0
    } · P1 0 · ` +
      `datasets ${DATASETS.length} · public-datasets ${publicDatasets.length} · ` +
      `actual-elements ${actualElements.size} · presentation 152/152 · map-catalog ${MAP_DATA_CATALOG.length} · ` +
      `GCF-project-relations ${
        projects?.metadata?.relationRecordCount ?? 0
      } · ` +
      `verified-tech-mappings ${mapping?.mappings?.length ?? 0}/28 · ` +
      `verified-exact-project-points ${
        locations?.metadata?.verifiedPointCount ?? 0
      }`
  );
  if (issues.length)
    console.warn("[Operational finalization audit v101] issues", issues);
  return { status, issues };
}
