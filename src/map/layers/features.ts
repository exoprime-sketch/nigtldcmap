/**
 * V152: GeoJSON the map layers draw - choropleth (63/34/six-region), line,
 * statistical representative points and entity points (moved from
 * RealMapExplorerPage so the mini map builds exactly the same features).
 */
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import type { VietnamLocationSidecarV151, VietnamSpatialLayerAssetV124 } from "../../data/vietnam/vietnamTypesV124";
import type { VietnamMapGeoJsonV124 } from "../../data/vietnam/vietnamDataLoaderV124";
import type { BoundarySystemV151 } from "../../data/map/adminBoundaryV151";
import { PROVINCE_KO_34_V151 } from "../../data/map/adminBoundaryV151";
import {
  aggregateTo34V151,
  formerProvinceLabelV151,
  isAggregatingKindV151,
  memberRangeByUnitV151,
  memberSummaryV151,
  parentUnitForV151,
  policyKindForVariableV151,
} from "../../data/map/boundaryPolicyV151";
import { PROVINCE_KO_V150 } from "../../data/map/mapBackdropV150";
import { prepareLayerRecordsV138, type PreparedLayerRecordsV138 } from "../../data/map/prepareLayerRecordsV148";
import { mapIndicatorSourceV148 } from "../../data/map/mapPresentationV148";
import {
  factValueV137,
  layerFactFieldsV137,
  resolvePublicMapEntityTitleV131,
  selectedFilterValueV141,
} from "./contract";
import type {
  BoundaryRenderContextV151,
  ChoroplethCollectionV151,
  LayerSelectorState,
  SpatialRuntimeAsset,
} from "./types";

export const SPATIAL_VALUE_SERIES_CACHE_V125 = new WeakMap<
  VietnamSpatialLayerAssetV124,
  Map<string, VietnamSpatialLayerAssetV124["values"]>
>();

export function representativeCoordinateV133(
  geometry: GeoJSON.Geometry
): [number, number] | null {
  const coordinates: Array<[number, number]> = [];
  const collect = (value: unknown): void => {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      typeof value[0] === "number" &&
      Number.isFinite(value[0]) &&
      typeof value[1] === "number" &&
      Number.isFinite(value[1])
    ) {
      coordinates.push([value[0], value[1]]);
      return;
    }
    if (Array.isArray(value)) value.forEach(collect);
  };
  collect((geometry as { coordinates?: unknown }).coordinates);
  if (!coordinates.length) return null;
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];
}

export function statisticalRepresentativePointsV133(
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: collection.features.flatMap((feature, index) => {
      if (!feature.properties?.hasValue) return [];
      const coordinate = representativeCoordinateV133(feature.geometry);
      if (!coordinate) return [];
      const selectionKey = String(
        feature.properties?.selectionKey || feature.properties?.adm1Code || index
      );
      return [
        {
          type: "Feature" as const,
          id: feature.id ?? selectionKey,
          geometry: { type: "Point" as const, coordinates: coordinate },
          properties: {
            ...feature.properties,
            selectionKey,
            coordinateMeaning: "statistical-representative-point",
            publicSpatialNotice:
              "성·시 단위 통계를 구분하기 위한 대표점이며 실제 사업 위치가 아닙니다.",
          },
        },
      ];
    }),
  };
}

export function choroplethFeatureCollection(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState
): {
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  minimum: number;
  maximum: number;
} {
  const values = asset.data
    ? spatialValuesForSelectorV125(asset.data, selector)
    : [];
  const valueByCode = new Map(values.map((row) => [row.adm1Code, row]));
  const numericValues = values.map((row) => row.value).filter(Number.isFinite);
  const minimum = numericValues.length ? Math.min(...numericValues) : 0;
  const maximum = numericValues.length ? Math.max(...numericValues) : 1;
  return {
    minimum,
    maximum,
    collection: {
      type: "FeatureCollection",
      features: asset.geometry.features.map((feature) => {
        const adm1Code = String(feature.properties?.adm1Code || "");
        const value = valueByCode.get(adm1Code);
        return {
          type: "Feature" as const,
          id: adm1Code,
          geometry: feature.geometry as GeoJSON.Geometry,
          properties: {
            ...feature.properties,
            elementId: layer.elementId,
            adm1Code,
            adm1Name: value?.adm1Name || feature.properties?.name || adm1Code,
            value: value?.value ?? null,
            hasValue: Boolean(value),
            unit: value?.unit || "",
            period: selector.period,
            variable: selector.variable,
            variableLabel:
              value?.variableLabel ||
              layer.selectors.variables.find((row) => row.key === selector.variable)
                ?.label ||
              layer.publicShortTitle,
            sourceRegion: value?.sourceRegion || "",
            sourceIndicatorId: value?.sourceIndicatorId || "",
            sourceSpatialUnit: value?.sourceSpatialUnit || "admin1",
            selectionKey: adm1Code,
          },
        };
      }),
    },
  };
}

export function areaKm2ByAdm1CodeV151(geometry34: VietnamMapGeoJsonV124 | null): Record<string, number> | null {
  if (!geometry34) return null;
  const areas: Record<string, number> = {};
  for (const feature of geometry34.features) {
    const members = feature.properties?.memberAreaKm2;
    if (!members || typeof members !== "object") continue;
    for (const [code, km2] of Object.entries(members as Record<string, unknown>)) {
      if (typeof km2 === "number" && Number.isFinite(km2)) areas[code] = km2;
    }
  }
  return Object.keys(areas).length ? areas : null;
}

export function variableLabelForSelectorV151(layer: CountryMapLayerV122, selector: LayerSelectorState, fallback?: string): string {
  return (
    fallback ||
    layer.selectors.variables.find((row) => row.key === selector.variable)?.label ||
    layer.publicShortTitle
  );
}

/**
 * The choropleth collection the map draws, after the boundary policy.
 *
 * - 63-unit outline: the source rows as published (unchanged behaviour).
 * - 34-unit outline + aggregating policy: one feature per 34-unit carrying the
 *   aggregated value and a `memberSummary` for the popup and the panel.
 * - 34-unit outline + range-only: still the 63 features, each decorated with
 *   its parent unit and the member range - no single 34 value is invented.
 * - six-region-only (B-021): the six GDL regions, whatever the toggle says.
 */
export function choroplethFeatureCollectionV151(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState,
  context: BoundaryRenderContextV151
): ChoroplethCollectionV151 {
  const kind = policyKindForVariableV151(layer.boundaryPolicy, selector.variable);
  const values = asset.data ? spatialValuesForSelectorV125(asset.data, selector) : [];
  const variableLabel = variableLabelForSelectorV151(layer, selector, values[0]?.variableLabel);
  const unit = values[0]?.unit || "";

  if (kind === "six-region-only" && context.region6) {
    const byRegion = new Map<string, VietnamSpatialLayerAssetV124["values"][number]>();
    for (const row of values) {
      if (row.sourceRegion && !byRegion.has(row.sourceRegion)) byRegion.set(row.sourceRegion, row);
    }
    const numeric = [...byRegion.values()].map((row) => row.value).filter(Number.isFinite);
    return {
      mode: "region-6",
      kind,
      minimum: numeric.length ? Math.min(...numeric) : 0,
      maximum: numeric.length ? Math.max(...numeric) : 1,
      collection: {
        type: "FeatureCollection",
        features: context.region6.features.map((feature) => {
          const regionKey = String(feature.properties?.regionKey || feature.properties?.name || "");
          const row = byRegion.get(regionKey);
          return {
            type: "Feature" as const,
            id: regionKey,
            geometry: feature.geometry as GeoJSON.Geometry,
            properties: {
              ...feature.properties,
              elementId: layer.elementId,
              adm1Code: regionKey,
              adm1Name: String(feature.properties?.nameKo || regionKey),
              value: row?.value ?? null,
              hasValue: Boolean(row),
              unit: row?.unit || unit,
              period: selector.period,
              variable: selector.variable,
              variableLabel: row?.variableLabel || variableLabel,
              sourceRegion: regionKey,
              sourceIndicatorId: row?.sourceIndicatorId || "",
              sourceSpatialUnit: "region",
              selectionKey: regionKey,
              boundarySystem: "gdl-six-region",
              policyKind: kind,
            },
          };
        }),
      },
    };
  }

  const areas = areaKm2ByAdm1CodeV151(context.geometry34);
  const canAggregate =
    context.system === "post-2025-34" &&
    isAggregatingKindV151(kind) &&
    context.geometry34 !== null &&
    (kind !== "area-weighted-mean" || areas !== null);
  if (canAggregate && context.geometry34) {
    const adm1NameByCode: Record<string, string> = {};
    for (const feature of asset.geometry.features) {
      const code = String(feature.properties?.adm1Code || "");
      if (code) adm1NameByCode[code] = String(feature.properties?.name || code);
    }
    const rows = aggregateTo34V151(values, kind, {
      areaKm2ByAdm1Code: areas || undefined,
      adm1NameByCode,
    });
    const byUnit = new Map(rows.map((row) => [row.unitCode, row]));
    const numeric = rows.map((row) => row.value).filter((value): value is number => typeof value === "number");
    return {
      mode: "34",
      kind,
      minimum: numeric.length ? Math.min(...numeric) : 0,
      maximum: numeric.length ? Math.max(...numeric) : 1,
      collection: {
        type: "FeatureCollection",
        features: context.geometry34.features.map((feature) => {
          const unitCode = String(feature.properties?.unitCode || "");
          const row = byUnit.get(unitCode);
          const value = row?.value ?? null;
          return {
            type: "Feature" as const,
            id: unitCode,
            geometry: feature.geometry as GeoJSON.Geometry,
            properties: {
              ...feature.properties,
              elementId: layer.elementId,
              unitCode,
              // Compatibility key: every selection and panel path keys on adm1Code.
              adm1Code: unitCode,
              adm1Name: row?.unitName || String(feature.properties?.name || unitCode),
              value,
              hasValue: value !== null,
              unit: row?.unit || unit,
              period: selector.period,
              variable: selector.variable,
              variableLabel,
              sourceRegion: "",
              sourceIndicatorId: row?.sourceIndicatorId || "",
              sourceSpatialUnit: "post-2025-34-unit",
              selectionKey: unitCode,
              boundarySystem: "post-2025-34",
              policyKind: kind,
              memberSummary: row ? memberSummaryV151(row) : "",
              partial: row?.partial ?? false,
            },
          };
        }),
      },
    };
  }

  const base = choroplethFeatureCollection(layer, asset, selector);
  if (context.system !== "post-2025-34" || kind !== "range-only") {
    return { ...base, mode: "63", kind };
  }
  // Range-only under the 34 outline: keep every province, name its parent
  // unit and the spread of its siblings so the popup can say "구성 범위".
  const rangeByUnit = memberRangeByUnitV151(values);
  return {
    ...base,
    mode: "63",
    kind,
    collection: {
      type: "FeatureCollection",
      features: base.collection.features.map((feature) => {
        const adm1Code = String(feature.properties?.adm1Code || "");
        const parent = parentUnitForV151(adm1Code);
        const range = parent ? rangeByUnit.get(parent.unitCode) : undefined;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            policyKind: kind,
            parentUnitCode: parent?.unitCode || "",
            parentUnitName: parent?.nameKo || "",
            parentMin: range?.min ?? null,
            parentMax: range?.max ?? null,
            parentValueCount: range?.valueCount ?? 0,
            parentMemberCount: range?.memberCount ?? (parent?.memberAdm1Codes.length || 0),
          },
        };
      }),
    },
  };
}

export function spatialValuesForSelectorV125(
  data: VietnamSpatialLayerAssetV124,
  selector: LayerSelectorState
): VietnamSpatialLayerAssetV124["values"] {
  let index = SPATIAL_VALUE_SERIES_CACHE_V125.get(data);
  if (!index) {
    index = new Map();
    data.values.forEach((row) => {
      const key = `${row.variable}\u0000${row.period}`;
      const records = index!.get(key);
      if (records) records.push(row);
      else index!.set(key, [row]);
    });
    SPATIAL_VALUE_SERIES_CACHE_V125.set(data, index);
  }
  return index.get(`${selector.variable}\u0000${selector.period}`) || [];
}

export function lineFeatureCollection(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState,
  filters: Record<string, string>
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  const features = asset.geometry.features.filter((feature) => {
    if (
      selector.variable !== "all" &&
      String(feature.properties?.voltageKv || feature.properties?.voltage) !==
        selector.variable
    ) {
      return false;
    }
    return layer.filters.every((filter) => {
      if (filter.field === "voltageKv") return true;
      const selected = selectedFilterValueV141(layer, filter, filters);
      return (
        selected === "all" ||
        String(feature.properties?.[filter.field] ?? "") === selected
      );
    });
  });
  return {
    type: "FeatureCollection",
    features: features.map((feature, index) => ({
      type: "Feature" as const,
      id: feature.id ?? index,
      properties: {
        ...feature.properties,
        elementId: layer.elementId,
        selectionKey: String(feature.id ?? index),
      },
      geometry: feature.geometry as GeoJSON.Geometry,
    })),
  };
}

/** V151-2: where a point sits, worded for the outline on screen. */
export function pointLocationLabelV151(
  hit: VietnamLocationSidecarV151["byRecordId"][string] | undefined,
  system: BoundarySystemV151
): string | null {
  if (hit === undefined) return null;
  if (hit === null) return "소재지 미확정(성·시 경계 밖)";
  if (system === "post-2025-34" && hit.unitCode) {
    const unitName = PROVINCE_KO_34_V151[hit.unitCode] || hit.adm1Name;
    return `${unitName} ${formerProvinceLabelV151(hit.adm1Code)}`.trim();
  }
  return `${PROVINCE_KO_V150[hit.adm1Code] || hit.adm1Name}(개편 전 63개 기준)`;
}

export function featureCollection(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  prepared: PreparedLayerRecordsV138 = prepareLayerRecordsV138(records, layer),
  location?: { sidecar: VietnamLocationSidecarV151 | undefined; system: BoundarySystemV151 }
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: records
      .filter(
        (
          record
        ): record is CountryEntityV122 & {
          latitude: number;
          longitude: number;
        } =>
          record.mapEligible &&
          typeof record.latitude === "number" &&
          typeof record.longitude === "number"
      )
      .map((record) => {
        const attrs = record.normalizedAttributes || {};
        const titleResolution = resolvePublicMapEntityTitleV131(record, layer);
        const properties: Record<string, string | number | boolean | null> = {
          recordId: record.recordId,
          elementId: record.elementId,
          countryIso3: layer.countryIso3,
          name: titleResolution.title,
          nameNote: titleResolution.secondaryNote,
          entityType: record.entityType,
          referenceYear:
            record.provenance.referenceYear || null,
          sourceOrg: mapIndicatorSourceV148(record.indicatorId, record.provenance.sourceOrg || "") || null,
          selectionKey: record.recordId,
          approximate: prepared.approximateRecordIds.has(record.recordId),
          memberCount: prepared.membersByRecordId.get(record.recordId)?.length || 1,
        };
        if (location?.sidecar) {
          const hit = location.sidecar.byRecordId[record.recordId];
          properties.adm1Code = hit?.adm1Code ?? null;
          properties.unitCode = hit?.unitCode ?? null;
          properties.locationLabelV151 = pointLocationLabelV151(hit, location.system);
        }
        // Facts come from the layer's own contract, which names the source key
        // each one lives under. Reading a fixed field name instead is what left
        // Ban Phuc's popup with no 광종: the mineral is in attrs["광종"], while
        // the layer asked for attrs["mineral"].
        layerFactFieldsV137(layer).forEach((fact) => {
          const value = factValueV137(fact, attrs);
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[fact.key] = value as string | number | boolean;
          }
        });
        layer.tooltipFields.forEach((field) => {
          const value = field === "name" ? properties.name : attrs[field];
          if (properties[field] !== undefined) return;
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[field] = value as string | number | boolean;
          }
        });
        layer.filters.forEach((filter) => {
          if (properties[filter.field] !== undefined) return;
          const value = attrs[filter.field];
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[filter.field] = value as string | number | boolean;
          }
        });
        return {
          type: "Feature" as const,
          id: record.recordId,
          geometry: {
            type: "Point" as const,
            coordinates: [record.longitude, record.latitude],
          },
          properties,
        };
      }),
  };
}
