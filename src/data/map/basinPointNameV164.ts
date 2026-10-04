/**
 * V164: the name a basin point carries on the map.
 *
 * B-025 and B-028 draw a point per HydroBASINS basin. Where the source states no
 * river, station or place for it, the delivery's own label is the basin id with
 * the product's field name in it ("HydroBASINS MAIN_BAS 4080025450",
 * "유역(HydroBASINS 4080025470)", "HydroBASINS 유역 4080015560"): the product
 * and its column name, not something a reader can place. The point is named for
 * what it is - a basin's representative point (B-028: its outlet cell) - with
 * the basin number the source gives, and the raw key never reaches the screen.
 * A name the source does state (a station, a river) is returned untouched, and
 * text after the basin id ("· 국내 완결 · 자국 내 2,672.3 km²") is kept.
 */
const BASIN_LABEL_V164 = /(?:유역\s*\(\s*HydroBASINS\s+(\d+)\s*\)|HydroBASINS(?:\([^)]*\))?\s+(?:MAIN_BAS|유역)\s+(\d+))/u;

export interface BasinPointNameOptionsV164 {
  /** B-028's unnamed points are GloFAS outlet cells; B-025's are basin centres. */
  readonly outlet?: boolean;
}

export function basinPointNameV164(name: string, options: BasinPointNameOptionsV164 = {}): string {
  const match = BASIN_LABEL_V164.exec(name);
  if (!match) return name;
  const id = match[1] || match[2];
  return name.replace(BASIN_LABEL_V164, `${options.outlet ? "유역 출구 대표점" : "유역 대표점"} (번호 ${id})`);
}

/** True for the two layers whose unnamed points carry a basin id. */
export function isBasinPointLayerV164(elementId: string): boolean {
  return elementId === "B-025" || elementId === "B-028";
}

/** The element's name for a basin point: B-028 points are outlet cells, B-025's basin centres. */
export function basinPointNameForElementV164(elementId: string, name: string): string {
  return isBasinPointLayerV164(elementId) ? basinPointNameV164(name, { outlet: elementId === "B-028" }) : name;
}
