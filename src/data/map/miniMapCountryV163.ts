/**
 * V163: what the small map (detail page and home hero) needs to know about a
 * country, so it is drawn for every live country of `public/data/countries.json`
 * and not for Viet Nam alone.
 *
 * Everything here is pure: the caller hands in the registry rows and the loaded
 * boundary file, and gets back plain values. Viet Nam
 * keeps its own assets and wording (the static 63-province base, the 34-unit
 * caption); another country uses its registry level-1 asset, its own level-1
 * word ("주(Division)") and the bbox the registry states. Nothing is invented:
 * a country without a level-1 asset or a bbox simply gets less (no base, a
 * layer-extent fit); the coast stroke is Viet Nam's own outline only.
 */
import { publicRegionTextV162 } from "../geo/regionDisplayV162";
import { DEFAULT_COUNTRY_ISO3_V158, normalizeCountryIso3V158 } from "../countryContext";

export function isDefaultCountryV163(iso3: string | null | undefined): boolean {
  return normalizeCountryIso3V158(iso3) === DEFAULT_COUNTRY_ISO3_V158;
}

type FeatureLikeV163 = { properties?: Record<string, unknown> | null };
type CollectionLikeV163 = { features: ReadonlyArray<FeatureLikeV163> };

/**
 * A boundary key is an identifier, not a name: GADM "BGD.8_1", ISO 3166-2
 * "BD-H", the platform's own "VN34-HN". It must never reach the screen.
 */
const RAW_REGION_KEY_V163 = /^[A-Z]{2,3}\d{0,2}[._-][A-Za-z0-9]{1,4}(?:[._-][A-Za-z0-9]+)*$/u;

export function isRawRegionKeyV163(text: string | null | undefined): boolean {
  return RAW_REGION_KEY_V163.test(String(text ?? "").trim());
}

/**
 * The key a value row and a boundary feature share. Viet Nam's static map has
 * always joined on `adm1Code` and keeps doing so; another country's rows are
 * keyed by whatever its spatial asset names (`joinKey`, "divisionKey" for
 * Bangladesh), with `adm1Code` as the fallback.
 */
export function staticUnitKeyV163(
  properties: Record<string, unknown> | null | undefined,
  joinKey: string | null | undefined,
  iso3: string | null | undefined
): string {
  const props = properties || {};
  if (isDefaultCountryV163(iso3)) return String(props.adm1Code || "");
  return String(props[joinKey || "adm1Code"] || props.adm1Code || "");
}

export interface Level1NameV163 {
  nameEn: string;
  nameKo: string;
}

/** The level-1 boundary file's own names, by the key the value rows use. */
export function level1NamesByKeyV163(
  collection: CollectionLikeV163 | null | undefined,
  joinKey: string | null | undefined
): Map<string, Level1NameV163> {
  const names = new Map<string, Level1NameV163>();
  for (const feature of collection?.features || []) {
    const properties = feature.properties || {};
    const key = String(properties[joinKey || "adm1Code"] ?? properties.adm1Code ?? "").trim();
    if (!key) continue;
    names.set(key, {
      nameEn: String(properties.nameEn ?? properties.name ?? "").trim(),
      nameKo: String(properties.nameKo ?? "").trim(),
    });
  }
  return names;
}

/**
 * A level-1 unit as the reader reads it: the dictionary form "한글명 (현지명)"
 * when the dictionary knows the place, else the boundary file's own Korean
 * name beside its English one, else the English name as written.
 */
export function level1DisplayNameV163(
  name: Level1NameV163 | undefined,
  elementId: string | null | undefined,
  iso3: string
): string {
  if (!name) return "";
  const formatted = name.nameEn ? publicRegionTextV162(name.nameEn, elementId, iso3) : "";
  if (formatted && formatted !== name.nameEn) return formatted;
  if (name.nameKo) return name.nameEn ? `${name.nameKo} (${name.nameEn})` : name.nameKo;
  return formatted;
}

/**
 * The label of one value row of another country's layer. The row's own name
 * goes through the region dictionary; a row without a usable name takes the
 * name of the same key in the level-1 file. Returns "" when nothing readable is
 * found - never the key. (Viet Nam's wording stays in the component.)
 */
export function regionLabelV163(input: {
  row: { adm1Code: string; adm1Name?: string | null; label?: string | null };
  iso3: string;
  elementId?: string | null;
  level1Names?: Map<string, Level1NameV163>;
}): string {
  const { row, iso3, elementId, level1Names } = input;
  const named = row.adm1Name ? publicRegionTextV162(row.adm1Name, elementId, iso3) : "";
  if (named && !isRawRegionKeyV163(named)) return named;
  const stated = String(row.label ?? "").trim();
  if (stated && !isRawRegionKeyV163(stated)) return stated;
  const fromBoundary = level1DisplayNameV163(level1Names?.get(row.adm1Code), elementId, iso3);
  return fromBoundary && !isRawRegionKeyV163(fromBoundary) ? fromBoundary : "";
}

/** "8개 주(Division) 기준" from the registry's level-1 word and count; "" without a word. */
export function level1BasisCaptionV163(level1: { label?: string | null; count?: number | null } | null | undefined): string {
  const label = String(level1?.label ?? "").trim();
  if (!label) return "";
  const count = Number(level1?.count) || 0;
  return `${count > 0 ? `${count}개 ` : ""}${label} 기준`;
}

/** The boundary credit of another country, as the big map words it: "방글라데시 주(Division) 8개 · CC BY 4.0". */
export function boundaryCreditPhraseV163(
  countryNameKo: string | null | undefined,
  level1: { label?: string | null; count?: number | null } | null | undefined
): string {
  const label = String(level1?.label ?? "").trim();
  const count = Number(level1?.count) || 0;
  const phrase = [String(countryNameKo ?? "").trim(), label, label && count > 0 ? `${count}개` : ""].filter(Boolean).join(" ");
  return phrase ? `${phrase} · CC BY 4.0` : "CC BY 4.0";
}

export interface CoreBoxV163 {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * The country's mainland box for the mini map's first fit and pan limit. Viet
 * Nam keeps the backdrop module's box (passed in, so the static map does not
 * load that module); another country's is the registry bbox. Null when the
 * registry has none, and the caller then fits the layer's own extent.
 */
export function countryCoreBoxV163(
  iso3: string | null | undefined,
  defaultBox: CoreBoxV163,
  registry: { countries: ReadonlyArray<{ iso3: string; bbox?: ReadonlyArray<number> | null }> } | null | undefined
): CoreBoxV163 | null {
  if (isDefaultCountryV163(iso3)) return defaultBox;
  const bbox = registry?.countries.find((row) => row.iso3 === normalizeCountryIso3V158(iso3))?.bbox;
  if (!bbox || bbox.length < 4 || !bbox.slice(0, 4).every((value) => Number.isFinite(value))) return null;
  const [west, south, east, north] = bbox as number[];
  return west < east && south < north ? { west, south, east, north } : null;
}

/**
 * The latitude the static overview scales longitude at (cosine of the middle of
 * the drawn extent), so another country is not squeezed at Viet Nam's 17 degrees.
 */
export function projectionCenterLatV163(coordinates: ReadonlyArray<readonly [number, number]>): number | undefined {
  let south = Infinity;
  let north = -Infinity;
  for (const [, lat] of coordinates) {
    if (!Number.isFinite(lat)) continue;
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return Number.isFinite(south) && Number.isFinite(north) ? (south + north) / 2 : undefined;
}
