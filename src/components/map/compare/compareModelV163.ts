/**
 * V163: the comparison workspace's rules, as pure functions.
 *
 * Two panes, each its own country, data layer, variable and period. Nothing
 * here touches MapLibre or React, so every rule the workspace keeps - which
 * layer a country falls back to, when the two maps move together, which
 * colour range two panes share, how a region ranks - is unit-tested.
 *
 * Data rules kept here as everywhere on the platform: a region without a value
 * stays without one (never 0), a rank is taken only among the values drawn
 * for the same layer, variable and period, and nothing is invented to fill a
 * gap.
 */

export type CompareSideV163 = "a" | "b";

export const COMPARE_SIDES_V163: readonly CompareSideV163[] = ["a", "b"];

export interface CompareSelectorV163 {
  variable: string;
  period: string;
}

export interface ComparePaneSelectionV163 {
  /** ISO3 of the pane's country. */
  country: string;
  elementId: string;
  /** The reader's choice; null keeps the layer's default. */
  variable: string | null;
  period: string | null;
}

export type ComparePanesV163 = [ComparePaneSelectionV163, ComparePaneSelectionV163];

/** The part of a map layer these rules read (a `CountryMapLayerV122` satisfies it). */
export interface CompareLayerLikeV163 {
  elementId: string;
  enabled?: boolean;
  renderer?: string;
  mapMode?: string;
  filters?: ReadonlyArray<{ field: string; values: readonly string[] }>;
  selectors?: {
    defaultVariable?: string;
    defaultPeriod?: string;
    periods?: readonly string[];
    variables: ReadonlyArray<{ key: string; label?: string; periods?: readonly string[]; unit?: string }>;
  };
}

const COLLATOR_V163 = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

/** Korean reading order (가나다순), numbers in numeric order. */
export function sortByTitleV163<T extends { title: string }>(options: readonly T[]): T[] {
  return [...options].sort((left, right) => COLLATOR_V163.compare(left.title, right.title));
}

/** The layers a pane may offer: the country's enabled map layers. */
export function offeredLayersV163<T extends CompareLayerLikeV163>(layers: readonly T[]): T[] {
  return layers.filter((layer) => layer.enabled !== false);
}

/**
 * The layer a pane shows in a country: the same element when the country has
 * it, otherwise the first layer in reading order. `kept` says which happened,
 * so the pane can say so in one line.
 */
export function resolveLayerForCountryV163<T extends CompareLayerLikeV163>(
  layers: readonly T[],
  elementId: string,
  titleOf: (layer: T) => string
): { elementId: string; kept: boolean } | null {
  const offered = offeredLayersV163(layers);
  if (offered.some((layer) => layer.elementId === elementId)) return { elementId, kept: true };
  const first = sortByTitleV163(offered.map((layer) => ({ layer, title: titleOf(layer) })))[0];
  return first ? { elementId: first.layer.elementId, kept: false } : null;
}

/**
 * The variable and period a pane draws. A choice the layer does not offer
 * (another country's variable key, a period the variable lacks) falls back to
 * the layer's own default rather than drawing nothing.
 */
export function resolveSelectorV163(
  layer: CompareLayerLikeV163,
  variable: string | null | undefined,
  period: string | null | undefined
): CompareSelectorV163 {
  const variables = layer.selectors?.variables || [];
  const fallbackVariable =
    (layer.selectors?.defaultVariable &&
      variables.some((row) => row.key === layer.selectors?.defaultVariable) &&
      layer.selectors.defaultVariable) ||
    variables[0]?.key ||
    layer.selectors?.defaultVariable ||
    "locations";
  const chosenVariable = variable && variables.some((row) => row.key === variable) ? variable : fallbackVariable;
  const option = variables.find((row) => row.key === chosenVariable);
  const periods = (option?.periods && option.periods.length ? option.periods : layer.selectors?.periods) || [];
  const defaultPeriod = layer.selectors?.defaultPeriod;
  const chosenPeriod =
    period && periods.includes(period)
      ? period
      : defaultPeriod && periods.includes(defaultPeriod)
        ? defaultPeriod
        : periods[periods.length - 1] || "";
  return { variable: chosenVariable, period: chosenPeriod };
}

/** The periods the chosen variable offers. */
export function periodsForVariableV163(layer: CompareLayerLikeV163, variable: string): string[] {
  const option = layer.selectors?.variables.find((row) => row.key === variable);
  return [...((option?.periods && option.periods.length ? option.periods : layer.selectors?.periods) || [])];
}

/**
 * A site layer's "variable" is one of its kinds (`all`, `gas`, `port` ...): the
 * same key as a value of one of its filters. Choosing it draws that kind, as
 * the filter would; `all` draws every kind.
 */
export function filtersForSelectorV163(
  layer: CompareLayerLikeV163,
  variable: string | null | undefined
): Record<string, string> {
  if (!variable || variable === "all") return {};
  const renderer = layer.renderer || layer.mapMode || "";
  if (renderer !== "point-and-polygon" && renderer !== "point" && renderer !== "cluster") return {};
  const filter = (layer.filters || []).find((row) => row.values.includes(variable));
  return filter ? { [`${layer.elementId}:${filter.field}`]: variable } : {};
}

/** The two maps move together by default only when they show the same country. */
export function syncDefaultV163(countryA: string, countryB: string): boolean {
  return countryA === countryB;
}

/** Renderers whose features are level-1 regions keyed the same way across layers. */
const REGION_RENDERERS_V163 = new Set(["admin1-choropleth", "partial-choropleth"]);

export function isRegionRendererV163(renderer: string | null | undefined): boolean {
  return REGION_RENDERERS_V163.has(String(renderer || ""));
}

/**
 * Linked highlight: a region picked in one pane is the same region in the
 * other only inside one country, and only when both panes draw regions (or the
 * same assessment-unit layer).
 */
export function linkedRegionsV163(
  a: { country: string; elementId: string; renderer: string | null | undefined },
  b: { country: string; elementId: string; renderer: string | null | undefined }
): boolean {
  if (a.country !== b.country) return false;
  if (isRegionRendererV163(a.renderer) && isRegionRendererV163(b.renderer)) return true;
  return a.elementId === b.elementId && a.renderer === "unit-choropleth" && b.renderer === "unit-choropleth";
}

/**
 * "같은 색 구간" is offered only when the two panes draw the same quantity: the
 * same data element and the same variable (two periods, or two countries with
 * the same variable). Two different quantities never share a colour scale.
 */
export function sameQuantityV163(
  a: { elementId: string; variable: string; unit: string },
  b: { elementId: string; variable: string; unit: string }
): boolean {
  return a.elementId === b.elementId && a.variable === b.variable && a.unit === b.unit;
}

export interface ValueDomainV163 {
  minimum: number;
  maximum: number;
}

/** One range spanning both panes' drawn values; null when either has none. */
export function sharedDomainV163(
  a: ValueDomainV163 | null | undefined,
  b: ValueDomainV163 | null | undefined
): ValueDomainV163 | null {
  if (!a || !b) return null;
  if (![a.minimum, a.maximum, b.minimum, b.maximum].every(Number.isFinite)) return null;
  return { minimum: Math.min(a.minimum, b.minimum), maximum: Math.max(a.maximum, b.maximum) };
}

export function domainsEqualV163(a: ValueDomainV163 | null, b: ValueDomainV163 | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.minimum === b.minimum && a.maximum === b.maximum;
}

export interface RegionValueV163 {
  key: string;
  name: string;
  value: number;
}

/**
 * The values a region map draws: features that carry a value, one per key.
 * A feature without a value is left out - it is not a zero.
 */
export function regionValuesV163(
  features: ReadonlyArray<{ properties?: Record<string, unknown> | null }>,
  nameOf: (properties: Record<string, unknown>) => string
): RegionValueV163[] {
  const seen = new Set<string>();
  const rows: RegionValueV163[] = [];
  for (const feature of features) {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    if (properties.hasValue === false) continue;
    const raw = properties.value;
    if (raw === null || raw === undefined || raw === "") continue;
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value)) continue;
    const key = String(properties.selectionKey ?? properties.adm1Code ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, name: nameOf(properties), value });
  }
  return rows;
}

export interface RegionSummaryV163 {
  count: number;
  total: number;
  minimum: RegionValueV163 | null;
  maximum: RegionValueV163 | null;
  median: number | null;
}

/** Median of the drawn values: the middle value, or the mean of the two middle ones. */
export function medianV163(values: readonly number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function regionSummaryV163(values: readonly RegionValueV163[], total: number): RegionSummaryV163 {
  if (!values.length) return { count: 0, total, minimum: null, maximum: null, median: null };
  const ordered = [...values].sort((left, right) => left.value - right.value);
  return {
    count: values.length,
    total: Math.max(total, values.length),
    minimum: ordered[0],
    maximum: ordered[ordered.length - 1],
    median: medianV163(ordered.map((row) => row.value)),
  };
}

/**
 * Where a value sits among the drawn values, largest first. Equal values share
 * a rank (the same rule as the map's selection card). Null when the value is
 * missing or there is nothing to compare it with.
 */
export function rankAmongV163(
  value: number | null | undefined,
  peers: readonly number[]
): { rank: number; of: number } | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const usable = peers.filter((peer) => typeof peer === "number" && Number.isFinite(peer));
  if (usable.length < 2) return null;
  const sorted = [...usable].sort((left, right) => right - left);
  const index = sorted.findIndex((peer) => peer <= value);
  return { rank: (index === -1 ? sorted.length : index) + 1, of: usable.length };
}

/** Category counts, largest first, then in reading order. Empty labels are not a category. */
export function categoryCountsV163(labels: ReadonlyArray<string | null | undefined>): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const raw of labels) {
    const label = String(raw ?? "").trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || COLLATOR_V163.compare(left.label, right.label));
}

export type BboxV163 = [west: number, south: number, east: number, north: number];

function visitCoordinatesV163(coordinates: unknown, visit: (lng: number, lat: number) => void): void {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length >= 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    visit(coordinates[0], coordinates[1]);
    return;
  }
  for (const child of coordinates) visitCoordinatesV163(child, visit);
}

/** The extent of a feature collection's geometry, or null when it has none. */
export function featureBboxV163(
  features: ReadonlyArray<{ geometry?: { type: string; coordinates?: unknown; geometries?: unknown[] } | null }>
): BboxV163 | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  const visit = (lng: number, lat: number) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  };
  for (const feature of features) {
    const geometry = feature.geometry as { coordinates?: unknown; geometries?: Array<{ coordinates?: unknown }> } | null | undefined;
    if (!geometry) continue;
    if (Array.isArray(geometry.geometries)) geometry.geometries.forEach((child) => visitCoordinatesV163(child.coordinates, visit));
    else visitCoordinatesV163(geometry.coordinates, visit);
  }
  return Number.isFinite(west) ? [west, south, east, north] : null;
}

/**
 * Where a pane opens: the country's own extent; a layer reaching well beyond
 * it (a regional project's partner countries) opens on the layer instead.
 */
export function paneFitBboxV163(countryBbox: BboxV163 | null, layerBbox: BboxV163 | null): BboxV163 | null {
  if (!countryBbox) return layerBbox;
  if (!layerBbox) return countryBbox;
  const width = countryBbox[2] - countryBbox[0];
  const height = countryBbox[3] - countryBbox[1];
  const beyond =
    countryBbox[0] - layerBbox[0] > width * 0.5 ||
    layerBbox[2] - countryBbox[2] > width * 0.5 ||
    countryBbox[1] - layerBbox[1] > height * 0.5 ||
    layerBbox[3] - countryBbox[3] > height * 0.5;
  return beyond
    ? [
        Math.min(countryBbox[0], layerBbox[0]),
        Math.min(countryBbox[1], layerBbox[1]),
        Math.max(countryBbox[2], layerBbox[2]),
        Math.max(countryBbox[3], layerBbox[3]),
      ]
    : countryBbox;
}

/* ---------- URL ---------- */

const ISO3_PATTERN_V163 = /^[A-Z]{3}$/u;

/** `compareCountries=VNM,BGD` -> ["VNM", "BGD"]; anything malformed is dropped. */
export function parseCompareCountriesV163(raw: string | null | undefined): string[] {
  return String(raw || "")
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part) => ISO3_PATTERN_V163.test(part))
    .slice(0, 2);
}

export function serializeCompareCountriesV163(countries: readonly string[]): string {
  return countries.map((country) => country.toUpperCase()).join(",");
}

/**
 * `compareSelectors=[{"variable":"x","period":"2020"},null]`. A pane without a
 * stored choice is null and keeps its layer's default.
 */
export function parseCompareSelectorsV163(raw: string | null | undefined): Array<CompareSelectorV163 | null> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 2).map((entry) => {
      const row = entry as { variable?: unknown; period?: unknown } | null;
      return row && typeof row.variable === "string" && typeof row.period === "string"
        ? { variable: row.variable, period: row.period }
        : null;
    });
  } catch {
    return [];
  }
}

export function serializeCompareSelectorsV163(selectors: ReadonlyArray<CompareSelectorV163 | null>): string {
  return JSON.stringify(selectors.map((row) => (row ? { variable: row.variable, period: row.period } : null)));
}

/**
 * The two panes from what the URL or an entry button names. A missing country
 * is the page's country; the two element ids may be the same (two periods of
 * one dataset, or one dataset in two countries).
 */
export function initialPanesV163({
  layerIds,
  countries,
  selectors,
  fallbackCountry,
}: {
  layerIds: readonly string[];
  countries?: readonly string[];
  selectors?: ReadonlyArray<CompareSelectorV163 | null>;
  fallbackCountry: string;
}): ComparePanesV163 {
  const pane = (index: 0 | 1): ComparePaneSelectionV163 => ({
    country: (countries?.[index] || fallbackCountry).toUpperCase(),
    elementId: layerIds[index] || layerIds[0] || "",
    variable: selectors?.[index]?.variable ?? null,
    period: selectors?.[index]?.period ?? null,
  });
  return [pane(0), pane(1)];
}

/** Swap the two panes (left <-> right). */
export function swapPanesV163(panes: ComparePanesV163): ComparePanesV163 {
  return [{ ...panes[1] }, { ...panes[0] }];
}

export function panesEqualV163(a: ComparePanesV163, b: ComparePanesV163): boolean {
  return a.every(
    (pane, index) =>
      pane.country === b[index].country &&
      pane.elementId === b[index].elementId &&
      pane.variable === b[index].variable &&
      pane.period === b[index].period
  );
}
