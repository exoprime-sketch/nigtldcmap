/**
 * V152: readings of a layer contract shared by the renderers and the page -
 * renderer kind, selected slice, filters and facts (moved from RealMapExplorerPage).
 */
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import type { VietnamMapFactFieldV137, VietnamMapFilterV121 } from "../../data/vietnam/vietnamTypesV121";
import { prepareLayerRecordsV138 } from "../../data/map/prepareLayerRecordsV148";
import { publicMapFieldsV148 } from "../../data/map/mapPresentationV148";
import { isPublicMapFactV143, hasPublicMapFactValueV143 } from "../../data/visualization/publicMapCopyV143";
import { fieldLabelV121 } from "../../utils/vietnamActualV121";
import { publicMapLayerTitleV126 } from "../../data/visualization/publicMapWorkspaceV126";
import { resolvePublicEntityTitleV131 } from "../../data/visualization/publicEntityTitleV131";
import type { LayerSelectorState } from "./types";

export function rendererOf(layer: CountryMapLayerV122) {
  return layer.renderer || (layer.cluster ? "cluster" : "point");
}

export function selectorForLayer(
  layer: CountryMapLayerV122,
  selected: LayerSelectorState | undefined
): LayerSelectorState {
  const variable =
    selected?.variable || layer.selectors?.defaultVariable || "locations";
  const option = layer.selectors?.variables.find((row) => row.key === variable);
  const periods = option?.periods || layer.selectors?.periods || [];
  const requestedPeriod = selected?.period || layer.selectors?.defaultPeriod;
  return {
    variable,
    period:
      requestedPeriod && periods.includes(requestedPeriod)
        ? requestedPeriod
        : periods[periods.length - 1] || "미표기",
  };
}

/**
 * The facts a layer publishes, and where each one lives in the source.
 *
 * The map index carries this contract per element because the delivery names
 * its columns differently for every one of them. Layers built before the
 * contract existed fall back to their tooltipFields, so nothing regresses while
 * the rest of the tree catches up.
 */
export function layerFactFieldsV137(
  layer: CountryMapLayerV122
): VietnamMapFactFieldV137[] {
  const declared = layer.factFields;
  if (declared && declared.length) return publicMapFieldsV148(layer);
  return layer.tooltipFields
    .filter((field) => field !== "name" && isPublicMapFactV143(fieldLabelV121(field)))
    .map((field) => ({ key: field, label: fieldLabelV121(field), sources: [field] }));
}

/** The first value the source actually delivers for this fact. */
export function factValueV137(
  fact: VietnamMapFactFieldV137,
  attributes: Record<string, unknown>
): unknown {
  for (const key of fact.sources) {
    const value = attributes[key];
    if (!hasPublicMapFactValueV143(value)) continue;
    const mapped = fact.valueMap?.[String(value).trim().toLowerCase()];
    return mapped ?? value;
  }
  return null;
}

/** The filter's current value: the reader's choice, else the contract's default, else all. */
export function selectedFilterValueV141(
  layer: CountryMapLayerV122,
  filter: VietnamMapFilterV121,
  filters: Record<string, string>
): string {
  return filters[`${layer.elementId}:${filter.field}`] || filter.defaultValue || "all";
}

export function filterRecords(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): CountryEntityV122[] {
  return prepareLayerRecordsV138(records, layer).records.filter((record) =>
    layer.filters.every((filter) => {
      const selected = selectedFilterValueV141(layer, filter, filters);
      if (selected === "all") return true;
      const value = record.normalizedAttributes?.[filter.field];
      return String(value ?? "") === selected;
    })
  );
}

export function selectedFilterDimensionsV125(
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    layer.filters.flatMap((filter) => {
      if (filter.field === "voltageKv") return [];
      const selected = selectedFilterValueV141(layer, filter, filters);
      // A filter with a default keeps an explicit "all" (A-023's both-source
      // view), otherwise restoring the state would fall back to the default.
      if (selected === "all") return filter.defaultValue ? [[filter.field, "all"]] : [];
      return [[filter.field, selected]];
    })
  );
}

export function resolvePublicMapEntityTitleV131(
  entity: CountryEntityV122,
  layer: CountryMapLayerV122
) {
  const elementTitle = publicMapLayerTitleV126(
    layer.elementId,
    layer.publicShortTitle
  );
  return resolvePublicEntityTitleV131(entity, { elementTitle });
}
