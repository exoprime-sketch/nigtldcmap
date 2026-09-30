/**
 * V162 (P12-B e): OpenStreetMap's classification values (A-027 `fclass`) as a
 * reader sees them - "협궤 철도 (narrow_gauge)": the Korean name of the class
 * with the source value kept in brackets, so the screen and the download (which
 * keeps the source value) can be matched. A value this table does not name is
 * shown as delivered. Names follow the OSM tag definitions
 * (wiki.openstreetmap.org, highway=* and railway=*).
 */
export const OSM_CLASS_KO_V162: Readonly<Record<string, string>> = {
  // roads (highway=*)
  motorway: "고속도로",
  trunk: "간선도로",
  primary: "주요 도로",
  secondary: "2차 도로",
  tertiary: "3차 도로",
  unclassified: "기타 일반도로",
  residential: "주거지역 도로",
  service: "시설 진입·내부 도로",
  track: "농로·임도",
  path: "소로",
  footway: "보행로",
  construction: "공사 중 도로",
  // railways (railway=*)
  rail: "일반 철도",
  subway: "지하철",
  light_rail: "경전철",
  narrow_gauge: "협궤 철도",
  monorail: "모노레일",
  funicular: "강삭철도",
  miniature_railway: "소형 관광 철도",
};

/** "협궤 철도 (narrow_gauge)"; an unknown value stays as written. */
export function osmClassLabelV162(value: string): string {
  const ko = OSM_CLASS_KO_V162[value];
  return ko ? `${ko} (${value})` : value;
}

/**
 * A-027's indicator wording "분류별 피처 수(narrow_gauge) — fclass 분류값별 지물
 * 건수" names the class by its source value and the column by its field name.
 * Rewritten as "분류별 지물 수 · 협궤 철도 (narrow_gauge)"; other text unchanged.
 */
export function publicOsmIndicatorLabelV162(text: string): string {
  return String(text ?? "")
    .replace(/분류별 피처 수\(([a-z_]+)\)\s*[—-]\s*fclass 분류값별 지물 건수/gu, (_, value: string) => `분류별 지물 수 · ${osmClassLabelV162(value)}`)
    .replace(/\bfclass\b/gu, "분류");
}
