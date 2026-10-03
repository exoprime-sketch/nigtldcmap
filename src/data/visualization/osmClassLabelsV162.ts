import osmClassLabelsJson from "./osmClassLabelsV162.json";

/**
 * V162 (P12-B e): OpenStreetMap's classification values (A-027 `fclass`) as a
 * reader sees them - "협궤 철도": the Korean name of the class. A value this
 * table does not name is shown as delivered. Names follow the OSM tag
 * definitions (wiki.openstreetmap.org, highway=* and railway=*).
 *
 * V163: the source value used to be kept in brackets next to the Korean name
 * ("협궤 철도 (narrow_gauge)") so a reader could match the screen to the
 * download; CLAUDE.md's rule against exposing a raw key on a public screen
 * applies here too, so the bracket is dropped and only the Korean name
 * shows. `scripts/v157/public-wording-scan-v157.mjs`'s `DICTIONARY_CITATIONS_V162`
 * whitelist, written for the old "ko (value)" form, is now unused and can be
 * dropped in a follow-up (that script is out of this change's scope).
 */
export const OSM_CLASS_KO_V162: Readonly<Record<string, string>> = osmClassLabelsJson.labels;

/** "협궤 철도"; an unknown value stays as written. */
export function osmClassLabelV162(value: string): string {
  return OSM_CLASS_KO_V162[value] || value;
}

/**
 * A-027's indicator wording names the class by its source value and the
 * column by its field name - "분류별 피처 수(narrow_gauge) — fclass 분류값별 지물
 * 건수" (the raw-data table joins the two parts with " · "). Rewritten as
 * "분류별 지물 수 · 협궤 철도"; "피처" (GIS feature) reads 지물, and the field name
 * 'fclass' does not reach the screen. Other text unchanged.
 */
export function publicOsmIndicatorLabelV162(text: string): string {
  return String(text ?? "")
    .replace(
      /분류별 피처 수\(([a-z_]+)\)(?:\s*[—·-]\s*(?:fclass|highway|railway|분류) 분류값별 지물 건수)?/gu,
      (_, value: string) => `분류별 지물 수 · ${osmClassLabelV162(value)}`
    )
    .replace(/\s*[—·-]\s*(?:fclass|highway|railway|분류) 분류값별 지물 건수/gu, "")
    .replace(/피처 수/gu, "지물 수")
    .replace(/\bfclass\b/gu, "분류");
}
