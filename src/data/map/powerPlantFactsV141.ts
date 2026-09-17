/**
 * One reading of a power plant row (A-023) for the card, the detail summary,
 * the map's symbols, filters, tooltips and summary counts.
 *
 * The two registries name the same facts differently: WRI GPPD rows carry
 * `primaryFuel` (English) and `mw`, OpenStreetMap rows carry `fuelType`
 * (Korean) and `capacityMw` with a pre-computed `capacityBand`. The map used to
 * read `fuelType` and `capacityBand` alone, so every WRI plant counted as
 * "발전원 미표기" and the 1,650 rows without a band read as "용량 미표기" even
 * when the capacity itself was stated (V141).
 *
 * Nothing here estimates a missing value: a plant without a stated fuel or
 * capacity stays without one.
 */

export const WRI_POWER_PLANT_INDICATOR_V141 = "A-023_power_plant_registry";

export type PowerPlantSourceKeyV141 = "wri" | "osm";

export const POWER_PLANT_SOURCES_V141: Record<
  PowerPlantSourceKeyV141,
  { label: string; shortLabel: string; referenceYear: string; organisation: string }
> = {
  wri: {
    label: "WRI GPPD (2021)",
    shortLabel: "WRI 2021",
    referenceYear: "2021",
    organisation: "World Resources Institute",
  },
  osm: {
    label: "OSM 추출 (2026)",
    shortLabel: "OSM 2026",
    referenceYear: "2026",
    organisation: "OpenStreetMap 기여자",
  },
};

/** The option that shows both registries at once; never a unique-plant count. */
export const POWER_PLANT_BOTH_SOURCES_LABEL_V141 = "두 출처 함께 · 같은 시설 중복 미통합";

const FUEL_LABELS_V141: Record<string, string> = {
  hydro: "수력",
  solar: "태양광",
  wind: "풍력",
  coal: "석탄",
  gas: "가스",
  "gas;oil": "가스·석유",
  oil: "석유",
  biomass: "바이오매스",
  waste: "폐기물",
  nuclear: "원자력",
  geothermal: "지열",
};

const UNSTATED_V141 =
  /^(?:\(?\s*(?:미기재|미표기|미공개|미확인|미상)\s*\)?|해당\s*없음|unknown|n\/?a|null|undefined|[-—–])$/iu;

function textOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const trimmed = String(value).trim();
  return UNSTATED_V141.test(trimmed) ? "" : trimmed;
}

/** The public fuel label, or null when neither registry states one. */
export function powerPlantFuelV141(attributes: Record<string, unknown>): string | null {
  const typed = textOf(attributes.fuelType);
  if (typed) return FUEL_LABELS_V141[typed.toLowerCase()] || typed;
  const primary = textOf(attributes.primaryFuel);
  if (primary) return FUEL_LABELS_V141[primary.toLowerCase()] || primary;
  return null;
}

/** The stated capacity in MW, or null when the row states none. */
export function powerPlantCapacityMwV141(attributes: Record<string, unknown>): number | null {
  for (const key of ["capacityMw", "mw"]) {
    const raw = textOf(attributes[key]);
    if (!raw) continue;
    const value = Number(raw.replace(/,/gu, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export const POWER_PLANT_CAPACITY_BANDS_V141 = ["10MW 미만", "10~99MW", "100~499MW", "500MW 이상"] as const;

/** The capacity band a stated capacity falls in; null when no capacity is stated. */
export function powerPlantCapacityBandV141(capacityMw: number | null): string | null {
  if (capacityMw === null) return null;
  if (capacityMw < 10) return "10MW 미만";
  if (capacityMw < 100) return "10~99MW";
  if (capacityMw < 500) return "100~499MW";
  return "500MW 이상";
}

export function powerPlantSourceKeyV141(indicatorId: string | null | undefined): PowerPlantSourceKeyV141 {
  return indicatorId === WRI_POWER_PLANT_INDICATOR_V141 ? "wri" : "osm";
}

export interface PowerPlantFactsV141 {
  fuelType: string | null;
  capacityMw: number | null;
  capacityBand: string | null;
  sourceKey: PowerPlantSourceKeyV141;
  sourceLabel: string;
  referenceYear: string;
}

export function powerPlantFactsV141(
  attributes: Record<string, unknown>,
  indicatorId: string | null | undefined,
  statedReferenceYear?: string | null
): PowerPlantFactsV141 {
  const capacityMw = powerPlantCapacityMwV141(attributes);
  const sourceKey = powerPlantSourceKeyV141(indicatorId);
  return {
    fuelType: powerPlantFuelV141(attributes),
    capacityMw,
    capacityBand: powerPlantCapacityBandV141(capacityMw),
    sourceKey,
    sourceLabel: POWER_PLANT_SOURCES_V141[sourceKey].label,
    referenceYear: textOf(statedReferenceYear) || POWER_PLANT_SOURCES_V141[sourceKey].referenceYear,
  };
}

/**
 * The row's attributes with the shared reading written under the keys the map
 * contract names (`fuelType`, `capacityMw`, `capacityBand`, `sourceKey`), so
 * filters, symbols, tooltips and counts all read one value.
 */
export function normalisedPowerPlantAttributesV141(
  attributes: Record<string, unknown>,
  indicatorId: string | null | undefined,
  statedReferenceYear?: string | null
): Record<string, unknown> {
  const facts = powerPlantFactsV141(attributes, indicatorId, statedReferenceYear);
  const next: Record<string, unknown> = { ...attributes };
  if (facts.fuelType) next.fuelType = facts.fuelType;
  else delete next.fuelType;
  if (facts.capacityMw !== null) {
    next.capacityMw = facts.capacityMw;
    next.capacityBand = facts.capacityBand;
  } else {
    delete next.capacityMw;
    delete next.capacityBand;
  }
  next.sourceKey = facts.sourceKey;
  next.sourceLabel = facts.sourceLabel;
  next.referenceYear = facts.referenceYear;
  return next;
}
