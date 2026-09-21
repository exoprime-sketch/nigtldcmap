import type { CountryEntityV122, CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import { publicTextV126 } from "../visualization/publicFieldPolicyV126";
import { normalisedPowerPlantAttributesV141 } from "./powerPlantFactsV141";

export interface PreparedLayerRecordsV138 {
  records: CountryEntityV122[];
  membersByRecordId: Map<string, CountryEntityV122[]>;
  approximateRecordIds: Set<string>;
  excludedCount: number;
}
const PREPARED_RECORDS_CACHE_V138 = new WeakMap<
  CountryEntityV122[],
  Map<string, PreparedLayerRecordsV138>
>();

export function attributeText(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return publicTextV126(value) || "";
}

export function prepareLayerRecordsV138(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122
): PreparedLayerRecordsV138 {
  let perLayer = PREPARED_RECORDS_CACHE_V138.get(records);
  if (!perLayer) {
    perLayer = new Map();
    PREPARED_RECORDS_CACHE_V138.set(records, perLayer);
  }
  const cached = perLayer.get(layer.layerId);
  if (cached) return cached;

  const bbox = layer.displayScope?.withinCountryOnly ? layer.displayScope.bbox : null;
  const exclusions = Object.entries(layer.excludeWhere || {}).map(
    ([key, pattern]) => [key, new RegExp(pattern, "u")] as const
  );
  const approximateRule = layer.approximateLocation;
  const approximatePattern =
    approximateRule?.pattern && !approximateRule.always
      ? new RegExp(approximateRule.pattern, "u")
      : null;
  const identitySources = layer.featureIdentity?.sources || [];

  const kept: CountryEntityV122[] = [];
  let excludedCount = 0;
  records.forEach((source) => {
    // A-023: both registries read through one normaliser, so the map's
    // filters, symbols, tooltips and counts see 수력 · 1 MW for a WRI row.
    const record: CountryEntityV122 =
      layer.elementId === "A-023"
        ? {
            ...source,
            normalizedAttributes: normalisedPowerPlantAttributesV141(
              source.normalizedAttributes || {},
              source.indicatorId,
              source.provenance?.referenceYear
            ) as CountryEntityV122["normalizedAttributes"],
          }
        : source;
    const attributes = record.normalizedAttributes || {};
    if (
      bbox &&
      typeof record.latitude === "number" &&
      typeof record.longitude === "number" &&
      (record.longitude < bbox.west ||
        record.longitude > bbox.east ||
        record.latitude < bbox.south ||
        record.latitude > bbox.north)
    ) {
      excludedCount += 1;
      return;
    }
    if (exclusions.some(([key, pattern]) => pattern.test(attributeText(attributes[key])))) {
      excludedCount += 1;
      return;
    }
    kept.push(record);
  });

  const groups = new Map<string, CountryEntityV122[]>();
  kept.forEach((record) => {
    const attributes = record.normalizedAttributes || {};
    const identity = identitySources
      .map((key) => attributeText(attributes[key]))
      .filter(Boolean)
      .join("|");
    const groupKey = identity || record.recordId;
    const group = groups.get(groupKey);
    if (group) group.push(record);
    else groups.set(groupKey, [record]);
  });
  const membersByRecordId = new Map<string, CountryEntityV122[]>();
  const representatives: CountryEntityV122[] = [];
  groups.forEach((group) => {
    // The representative is the first row with a coordinate; the others are
    // its members and never become features of their own.
    const representative =
      group.find(
        (record) =>
          typeof record.latitude === "number" && typeof record.longitude === "number"
      ) || group[0];
    representatives.push(representative);
    membersByRecordId.set(representative.recordId, group);
  });
  const approximateRecordIds = new Set<string>();
  representatives.forEach((record) => {
    if (!approximateRule) return;
    if (approximateRule.always) {
      approximateRecordIds.add(record.recordId);
      return;
    }
    const value = attributeText(
      (record.normalizedAttributes || {})[approximateRule.sourceKey || ""]
    );
    if (approximatePattern && approximatePattern.test(value)) {
      approximateRecordIds.add(record.recordId);
    }
  });
  const prepared = {
    records: representatives,
    membersByRecordId,
    approximateRecordIds,
    excludedCount,
  };
  perLayer.set(layer.layerId, prepared);
  return prepared;
}

