import osmClassLabelsJson from "./osmClassLabelsV162.json";

/**
 * V162 (P12-B e): OpenStreetMap's classification values (A-027 `fclass`) as a
 * reader sees them - "협궤 철도 (narrow_gauge)": the Korean name of the class
 * with the source value kept in brackets, so the screen and the download (which
 * keeps the source value) can be matched. A value this table does not name is
 * shown as delivered. Names follow the OSM tag definitions
 * (wiki.openstreetmap.org, highway=* and railway=*). The same table is what
 * the public-wording scan accepts as a citation (scripts/v157).
 */
export const OSM_CLASS_KO_V162: Readonly<Record<string, string>> = osmClassLabelsJson.labels;

/** "협궤 철도 (narrow_gauge)"; an unknown value stays as written. */
export function osmClassLabelV162(value: string): string {
  const ko = OSM_CLASS_KO_V162[value];
  return ko ? `${ko} (${value})` : value;
}

/**
 * A-027's indicator wording names the class by its source value and the
 * column by its field name - "분류별 피처 수(narrow_gauge) — fclass 분류값별 지물
 * 건수" (the raw-data table joins the two parts with " · "). Rewritten as
 * "분류별 지물 수 · 협궤 철도 (narrow_gauge)"; "피처" (GIS feature) reads 지물,
 * and the field name 'fclass' does not reach the screen. Other text unchanged.
 */
export function publicOsmIndicatorLabelV162(text: string): string {
  return String(text ?? "")
    .replace(
      /분류별 피처 수\(([a-z_]+)\)(?:\s*[—·-]\s*(?:fclass|분류) 분류값별 지물 건수)?/gu,
      (_, value: string) => `분류별 지물 수 · ${osmClassLabelV162(value)}`
    )
    .replace(/\s*[—·-]\s*(?:fclass|분류) 분류값별 지물 건수/gu, "")
    .replace(/피처 수/gu, "지물 수")
    .replace(/\bfclass\b/gu, "분류");
}
