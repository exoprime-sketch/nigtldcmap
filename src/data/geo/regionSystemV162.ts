/**
 * V162: one row, one administrative system.
 *
 * The 2026-09-30 delivery files the 63 pre-2025 provinces and the 34 post-2025
 * units in the same sheet (and renamed the region columns). A summary, chart or
 * card that reads both would count a province twice, so every consumer takes
 * the rows of one system through this module:
 *
 * - 63-unit views, maps and cards: `adm1-prev` rows only.
 * - the 34-unit map: the source's own `adm1` rows where they exist for the
 *   selected variable and period; the V151-2 aggregation of the 63-unit values
 *   only where they do not.
 *
 * The ETL stamps `regionSystem` on each row; trees published before it are
 * read from the row's own 행정단위 and indicator id. Pure functions, no DOM.
 */
import type {
  VietnamSpatialLayerAssetV124,
  VietnamSpatialValue34V162,
} from "../vietnam/vietnamTypesV124";

export type RegionSystemV162 = "adm1" | "adm1-prev" | "adm2" | "country";

/** The region name columns, common names first, then the pre-V162 names. */
// "지역명" is the column B-002, B-024, B-035 and B-036 use for the province itself.
export const REGION_NAME_KEYS_V162 = ["지역명_현지어", "지역명_베트남어", "지역명", "지역명_로마자"] as const;
/** The column naming the post-reform unit a row belongs to. */
export const REORGANISED_UNIT_KEYS_V162 = ["개편_후_소속_단위", "2025_개편_후_소속_34개_체계"] as const;

interface RegionRowV162 {
  regionSystem?: string | null;
  indicatorId?: string | null;
  normalizedAttributes?: Record<string, unknown> | null;
}

function textV162(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function regionSystemOfV162(row: RegionRowV162 | null | undefined): RegionSystemV162 | null {
  if (!row) return null;
  const stamped = textV162(row.regionSystem);
  if (stamped === "adm1" || stamped === "adm1-prev" || stamped === "adm2" || stamped === "country") return stamped;
  const unit = textV162(row.normalizedAttributes?.["행정단위"]);
  if (/_adm34$/u.test(textV162(row.indicatorId)) || /개편 후|체계/u.test(unit)) return "adm1";
  if (/^(country|전국|국가)$/iu.test(unit)) return "country";
  if (/^(district|군|구)$/iu.test(unit)) return "adm2";
  if (/^(province|city|province\/city)$/iu.test(unit)) return "adm1-prev";
  return null;
}

/** The first non-empty value among `keys` (common name first). */
export function firstAttributeV162(
  attributes: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string {
  for (const key of keys) {
    const value = textV162(attributes?.[key]);
    if (value) return value;
  }
  return "";
}

/**
 * The rows a 63-unit (pre-reform) view may read: in a sheet that carries
 * pre-reform rows, those rows and the country rows only - its post-reform
 * rows and rows of another unit (B-026's river basins) are not provinces of
 * this system. A sheet with no pre-reform rows (every other country, trees
 * published before the marker) is returned unchanged.
 */
export function rowsForPreReformViewV162<T extends RegionRowV162>(rows: readonly T[]): T[] {
  if (!rows.some((row) => regionSystemOfV162(row) === "adm1-prev")) return [...rows];
  return rows.filter((row) => {
    const system = regionSystemOfV162(row);
    return system === "adm1-prev" || system === "country";
  });
}

export class MixedRegionSystemErrorV162 extends Error {}

/**
 * Throws when one aggregation, chart or card would combine rows of both
 * level-1 systems. Country and unmarked rows are not a system of their own.
 */
export function assertSingleRegionSystemV162(rows: readonly RegionRowV162[], context: string): void {
  const systems = new Set(
    rows.map((row) => regionSystemOfV162(row)).filter((system) => system === "adm1" || system === "adm1-prev")
  );
  if (systems.size > 1) {
    throw new MixedRegionSystemErrorV162(`${context}: rows of both adm1 and adm1-prev systems in one view`);
  }
}

/** The source's own 34-unit values for one variable and period, if any. */
export function source34ValuesForSelectorV162(
  asset: Pick<VietnamSpatialLayerAssetV124, "values34"> | null | undefined,
  variable: string | null | undefined,
  period: string | null | undefined
): VietnamSpatialValue34V162[] {
  if (!asset?.values34?.length || !variable || !period) return [];
  return asset.values34.filter((row) => row.variable === variable && row.period === period);
}
