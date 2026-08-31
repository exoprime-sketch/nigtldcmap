import { DATASETS } from "../data/publicDatasets";
import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";
import {
  getAuthoritativeElementIdV88,
  isSupportElementIdV88,
} from "./elementDatasetRegistryV88";
import { GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99 } from "../data/gcf/gcfProjectTechnologyMappingV99";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

export async function runOperationalFinalizationAuditV99() {
  const actualElements = new Set(
    DATASETS.filter(
      (d) =>
        !d.isSynthetic &&
        (d.publicationStatus === "published" ||
          d.publicationStatus === "catalog_only")
    )
      .map(getAuthoritativeElementIdV88)
      .filter((id) => !isSupportElementIdV88(id))
  );
  const required = [
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
        const r = await fetch(url, { cache: "no-store" });
        return { url, ok: r.ok, json: r.ok ? await r.json() : null };
      } catch {
        return { url, ok: false, json: null };
      }
    })
  );
  const projects: any = fetched[0]?.json;
  const check: any = fetched[1]?.json;
  const mapping: any = fetched[2]?.json;
  const locations: any = fetched[3]?.json;
  const techIds = new Set(CLIMATE_TECHNOLOGIES.map((t) => t.id));
  const issues: string[] = [];
  if (AUTHORITATIVE_ELEMENT_SEARCH_V75.length !== 152)
    issues.push(`authoritative ${AUTHORITATIVE_ELEMENT_SEARCH_V75.length}/152`);
  if (DATASETS.length !== 31) issues.push(`datasets ${DATASETS.length}/31`);
  if (actualElements.size !== 15)
    issues.push(`actual elements ${actualElements.size}/15`);
  if (MAP_DATA_CATALOG.length !== 30)
    issues.push(`map catalog ${MAP_DATA_CATALOG.length}/30`);
  if (fetched.some((x) => !x.ok))
    issues.push("required v99 public payload load failure");
  if (projects?.metadata?.relationRecordCount !== 109)
    issues.push("GCF relations != 109");
  if (check?.countries?.length !== 10) issues.push("GCF current checks != 10");
  if (mapping?.mappings?.length !== 28)
    issues.push(`GCF tech mappings ${mapping?.mappings?.length ?? 0}/28`);
  if (
    new Set(
      (mapping?.mappings ?? []).map(
        (m: any) => `${m.countryIso3}:${m.projectId}`
      )
    ).size !== 18
  )
    issues.push("mapped project relations != 18");
  if ((mapping?.mappings ?? []).some((m: any) => !techIds.has(m.technologyId)))
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
    `[Operational finalization audit v99] ${status} · P0 ${
      issues.length ? 1 : 0
    } · P1 0 · datasets ${DATASETS.length} · actual-elements ${
      actualElements.size
    } · map-catalog ${MAP_DATA_CATALOG.length} · GCF-project-relations ${
      projects?.metadata?.relationRecordCount ?? 0
    } · verified-tech-mappings ${
      mapping?.mappings?.length ?? 0
    }/28 · verified-exact-project-points ${
      locations?.metadata?.verifiedPointCount ?? 0
    }`
  );
  if (issues.length)
    console.warn("[Operational finalization audit v99] issues", issues);
  return { status, issues };
}
