/**
 * V158 (user decision 2026-09-30): the elements a country does not offer - the
 * decision common to every country plus the country's own. Same rule as the
 * ETL's `load_exclusion_decisions` (tools/etl/build_public_v2.py): rows are kept
 * as written, and an element declared twice is refused.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const COMMON_EXCLUSIONS_PATH_V158 = "config/data-publication/common-exclusions-v158.json";

export function exclusionDecisionsV158(root, countryIso3 = "VNM") {
  const sources = [COMMON_EXCLUSIONS_PATH_V158];
  const countryConfig = resolve(root, "tools/etl/countries", String(countryIso3).toLowerCase(), "country.json");
  if (existsSync(countryConfig)) {
    const own = JSON.parse(readFileSync(countryConfig, "utf8")).publicationDecisions?.exclusions;
    if (own) sources.push(own);
  }
  const exclusions = [];
  const lifted = [];
  for (const source of sources) {
    const path = resolve(root, source);
    if (!existsSync(path)) {
      if (source === COMMON_EXCLUSIONS_PATH_V158) throw new Error(`COMMON_EXCLUSIONS_MISSING: ${path}`);
      continue;
    }
    const document = JSON.parse(readFileSync(path, "utf8"));
    for (const row of document.exclusions || []) {
      if (exclusions.some((existing) => existing.elementId === row.elementId)) {
        throw new Error(`EXCLUSION_DECLARED_TWICE: ${row.elementId} (${source})`);
      }
      exclusions.push(row);
    }
    lifted.push(...(document.lifted || []));
  }
  return { exclusions, exclusionCount: exclusions.length, lifted, sources };
}
