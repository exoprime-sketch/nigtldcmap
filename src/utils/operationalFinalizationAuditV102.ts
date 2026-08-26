import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { runOperationalFinalizationAuditV101 } from "./operationalFinalizationAuditV101";

export async function runOperationalFinalizationAuditV102() {
  const base = await runOperationalFinalizationAuditV101();
  const issues = [...base.issues];

  if (MAP_DATA_CATALOG.length !== 31) {
    issues.push(`map catalog ${MAP_DATA_CATALOG.length}/31`);
  }

  const status = issues.length === 0 ? "MAP_UI_FINALIZED" : "BLOCKED";
  console.info(
    `[Operational finalization audit v102] ${status} · P0 ${
      issues.length ? 1 : 0
    } · P1 0 · example-preview ON · insights-nav OFF · stable-map-layer-cache ON`
  );

  if (issues.length) {
    console.warn("[Operational finalization audit v102] issues", issues);
  }

  return { status, issues };
}
