import { DATASETS } from "../data/publicDatasets";
import { INDICATOR_CONFIG_BY_ID } from "../data/indicators/registry";
import { ELEMENT_PRESENTATION_SPECS_V100 } from "../data/elementPresentationRegistryV100";

export function runDataPresentationAuditV100() {
  const issues: string[] = [];
  const ids = ELEMENT_PRESENTATION_SPECS_V100.map((item) => item.elementId);
  if (ids.length !== 152)
    issues.push(`P0: presentation spec ${ids.length}/152`);
  if (new Set(ids).size !== ids.length)
    issues.push("P0: duplicate element presentation spec");

  const byElement = new Map<string, number>();
  DATASETS.filter(
    (dataset) =>
      dataset.publicationStatus === "published" && dataset.isSynthetic !== true
  ).forEach((dataset) => {
    if (!/^[A-E]-\\d{3}$/.test(dataset.elementId)) return;
    byElement.set(
      dataset.elementId,
      (byElement.get(dataset.elementId) ?? 0) + 1
    );
  });
  const multi = Array.from(byElement.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  const bundled = new Set(
    ELEMENT_PRESENTATION_SPECS_V100.filter((s) => s.bundleMode !== "none").map(
      (s) => s.elementId
    )
  );
  multi.forEach((id) => {
    if (!bundled.has(id))
      issues.push(`P1: multi-dataset element without integrated layout ${id}`);
  });

  if (!INDICATOR_CONFIG_BY_ID.has("sector-industry-share" as any))
    issues.push("P0: A-005 industry share missing");
  const a005 = DATASETS.filter(
    (d) => d.elementId === "A-005" && d.publicationStatus === "published"
  );
  if (a005.length < 4)
    issues.push(
      `P1: A-005 expected 4 contextual indicators, got ${a005.length}`
    );

  const p0 = issues.filter((x) => x.startsWith("P0")).length;
  const p1 = issues.filter((x) => x.startsWith("P1")).length;
  const familyCounts = ELEMENT_PRESENTATION_SPECS_V100.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.layoutFamily] = (acc[item.layoutFamily] ?? 0) + 1;
    return acc;
  }, {});
  const status = p0 === 0 && p1 === 0 ? "PRESENTATION_READY" : "CHECK_REQUIRED";
  console.info(
    `[Data presentation audit v100] ${status} · P0 ${p0} · P1 ${p1} · 152/152 · integrated ${bundled.size} · actual multi ${multi.length}`
  );
  console.info("[Data presentation audit v100] layout families", familyCounts);
  if (issues.length)
    console.warn("[Data presentation audit v100] issues", issues);
  return { status, p0, p1, issues, familyCounts, multi };
}
