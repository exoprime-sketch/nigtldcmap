import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  Popup as MapLibrePopup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  loadCountryElementEntitiesV122,
  loadCountryMapIndexV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  getCountryDataProviderV122,
  hasCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import type {
  CountryEntityV122,
  CountryMapLayerV122,
} from "../data/countries/countryDataTypesV122";
import { loadWorldCountryBoundaries } from "../data/map/worldCountryBoundaries";
import type { WorldCountryBoundaryGeometry } from "../data/map/worldCountryBoundaries";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { MapViewState } from "../types/map";
import {
  entityDisplayNameV121,
  fieldLabelV121,
  formatValueV121,
  isHttpUrlV121,
} from "../utils/vietnamActualV121";
import "../styles/country-data-platform-v122.css";

interface RealMapExplorerPageProps {
  onOpenElement: (elementId: string, countryIso3: string) => void;
  onOpenCountry: (iso3: string) => void;
  onOpenDownload: (
    elementId: string | null,
    countryIso3: string | null
  ) => void;
  initialState: MapViewState;
  onStateChange: (state: MapViewState) => void;
}

type LoadStatus = "idle" | "loading" | "ready" | "error";

const MAP_STYLE: any = {
  version: 8,
  sources: {
    "country-boundaries": {
      type: "geojson",
      data: "/data/world-countries.geojson",
      attribution: "Natural Earth · 로컬 국가 경계",
    },
  },
  layers: [
    {
      id: "cdp-base-background",
      type: "background",
      paint: { "background-color": "#e7efeb" },
    },
    {
      id: "cdp-country-fill",
      type: "fill",
      source: "country-boundaries",
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-country-outline",
      type: "line",
      source: "country-boundaries",
      paint: {
        "line-color": "#587168",
        "line-width": 1.1,
        "line-opacity": 0.82,
      },
    },
  ],
};

const LAYER_COLORS: Record<string, string> = {
  "A-023": "#176a4b",
  "B-048": "#855b20",
  "C-025": "#7053a3",
  "D-018": "#226f96",
  "D-023": "#b05e2e",
};

const FALLBACK_VIEWBOX_WIDTH = 1000;
const FALLBACK_VIEWBOX_HEIGHT = 700;

type FallbackBounds = readonly [
  readonly [number, number],
  readonly [number, number]
];

function isLngLatCoordinate(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function projectFallbackCoordinate(
  coordinate: readonly [number, number],
  bounds: FallbackBounds
): { x: number; y: number } {
  const [[west, south], [east, north]] = bounds;
  const width = Math.max(east - west, Number.EPSILON);
  const height = Math.max(north - south, Number.EPSILON);
  return {
    x: ((coordinate[0] - west) / width) * FALLBACK_VIEWBOX_WIDTH,
    y: ((north - coordinate[1]) / height) * FALLBACK_VIEWBOX_HEIGHT,
  };
}

function fallbackRingToPath(
  ring: unknown,
  bounds: FallbackBounds
): string {
  if (!Array.isArray(ring)) return "";
  const coordinates = ring.filter(isLngLatCoordinate);
  if (coordinates.length < 3) return "";
  return `${coordinates
    .map((coordinate, index) => {
      const { x, y } = projectFallbackCoordinate(coordinate, bounds);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ")} Z`;
}

function geometryToFallbackPath(
  geometry: WorldCountryBoundaryGeometry,
  bounds: FallbackBounds
): string {
  if (!Array.isArray(geometry.coordinates)) return "";
  const polygons: unknown[] =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;
  return polygons
    .flatMap((polygon) => (Array.isArray(polygon) ? polygon : []))
    .map((ring) => fallbackRingToPath(ring, bounds))
    .filter(Boolean)
    .join(" ");
}

/**
 * Legacy QA modules v115/v116 still import these named exports. The current
 * runtime keeps them only as audit contracts and never mounts synthetic data.
 */
export const MAP_LAYER_IDS_RUNTIME_V115 = [
  "v115-country-fill",
  "v115-country-outline",
  "v115-country-selected",
  "v115-focus-fill",
  "v115-focus-bubble",
  "v115-focus-line",
  "v115-focus-raster",
  "v115-focus-outline",
  "v115-point-clusters",
  "v115-point-cluster-count",
  "v115-point-unclustered",
  "v115-tna-bubbles",
  "v115-ctcn-bubbles",
  "v115-gcf-bubbles",
  "v115-af-bubbles",
  "v115-climate-fund-bubbles",
  "v115-mdb-bubbles",
] as const;

export const MAP_SOURCE_IDS_RUNTIME_V115 = [
  "v115-country-source",
  "v115-aggregate-source",
  "v115-focus-source",
  "v115-point-source",
] as const;

export const MAP_RUNTIME_POLICY_V115 = {
  mapInstance: "single-instance",
  syntheticDefaultVisible: false,
  syntheticCatalogAvailableByDefault: false,
  syntheticActivation: "disabled-on-vietnam-actual-route",
  syntheticQueryRequired: false,
  inventedActualCoordinates: false,
  actualAndSyntheticMixing: false,
  basePolygonMaxActive: 1,
  rasterMaxActive: 1,
  nullToZero: false,
  multiCountryEqualAllocation: false,
  financeConceptAggregation: false,
  automaticTechnologyInference: false,
} as const;

export const MAP_LAYER_IDS_RUNTIME_V116 = [
  ...MAP_LAYER_IDS_RUNTIME_V115,
  "v116-demand-bubble",
  "v116-demand-label",
  "v116-oda-halo",
  "v116-regional-fill",
  "v116-regional-outline",
  "v116-regional-selected",
] as const;

export const MAP_SOURCE_IDS_RUNTIME_V116 = [
  ...MAP_SOURCE_IDS_RUNTIME_V115,
  "v116-regional-source",
] as const;

export const MAP_RUNTIME_POLICY_V116 = {
  mapInstance: "single-instance",
  visualEncodingSingleMeaning: true,
  bubbleAreaProportional: true,
  syntheticRegionalValuesNeverActual: true,
  nationalToRegionalFabrication: false,
  subnationalBoundaryProvider: "actual-source-only",
  basePolygonMaxActive: 1,
  rasterMaxActive: 1,
  regionalActualOverridesCountry: true,
  zoomDependentAutomaticDrilldown: "actual-only",
  nullToZero: false,
  multiCountryEqualAllocation: false,
  financeConceptAggregation: false,
  automaticTechnologyInference: false,
  inventedActualCoordinates: false,
  actualAndSyntheticMixing: false,
} as const;

interface LayerHandlers {
  pointLayerId: string;
  clusterLayerId?: string;
  onPointClick: (event: MapLayerMouseEvent) => void;
  onPointEnter: (event: MapLayerMouseEvent) => void;
  onPointLeave: () => void;
  onClusterClick?: (event: MapLayerMouseEvent) => void;
}

function runtimeKey(countryIso3: string, elementId: string): string {
  return `${countryIso3}:${elementId}`;
}

function layerRuntimeIds(countryIso3: string, elementId: string) {
  const suffix = `${countryIso3}-${elementId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return {
    source: `v122-source-${suffix}`,
    point: `v122-point-${suffix}`,
    cluster: `v122-cluster-${suffix}`,
  };
}

function featureCollection(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122
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
        const properties: Record<string, string | number | boolean | null> = {
          recordId: record.recordId,
          elementId: record.elementId,
          countryIso3: layer.countryIso3,
          name: entityDisplayNameV121(record),
          entityType: record.entityType,
          referenceYear:
            record.provenance.referenceYear || layer.latestYear || null,
          sourceOrg: record.provenance.sourceOrg || null,
        };
        layer.tooltipFields.forEach((field) => {
          const value = field === "name" ? properties.name : attrs[field];
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[field] = value as string | number | boolean;
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

function filterRecords(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): CountryEntityV122[] {
  return records.filter((record) =>
    layer.filters.every((filter) => {
      const selected = filters[`${layer.elementId}:${filter.field}`] || "all";
      if (selected === "all") return true;
      const value = record.normalizedAttributes?.[filter.field];
      return String(value ?? "") === selected;
    })
  );
}

function resolveInitialCountry(initialCountryIso3: string | null): string {
  const requested = initialCountryIso3?.toUpperCase() || "";
  if (requested) return requested;
  return listCountryDataProvidersV122()[0]?.countryIso3 || "";
}

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export default function RealMapExplorerPage({
  onOpenElement,
  onOpenCountry,
  onOpenDownload,
  initialState,
  onStateChange,
}: RealMapExplorerPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const handlersRef = useRef<Record<string, LayerHandlers>>({});
  const mountedKeysRef = useRef<Set<string>>(new Set());
  const recordIndexRef = useRef<Map<string, CountryEntityV122>>(new Map());
  const [countryIso3, setCountryIso3] = useState(() =>
    resolveInitialCountry(initialState.countryIso3)
  );
  const [baseMapStatus, setBaseMapStatus] = useState<LoadStatus>("loading");
  const [fallbackBoundaryStatus, setFallbackBoundaryStatus] =
    useState<LoadStatus>("loading");
  const [fallbackBoundaryPath, setFallbackBoundaryPath] = useState("");
  const [mapIndexStatus, setMapIndexStatus] = useState<LoadStatus>("idle");
  const [mapIndexError, setMapIndexError] = useState("");
  const [mapIndexReloadNonce, setMapIndexReloadNonce] = useState(0);
  const [layers, setLayers] = useState<CountryMapLayerV122[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [recordsByElement, setRecordsByElement] = useState<
    Record<string, CountryEntityV122[]>
  >({});
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<CountryEntityV122 | null>(null);

  const provider = getCountryDataProviderV122(countryIso3);
  const fallbackBounds: FallbackBounds = provider?.mapView.bounds || [
    [-180, -85],
    [180, 85],
  ];

  const fallbackPoints = useMemo(() => {
    const points: Array<{
      color: string;
      elementId: string;
      record: CountryEntityV122;
      x: number;
      y: number;
    }> = [];
    activeIds.forEach((elementId) => {
      (recordsByElement[elementId] || []).forEach((record) => {
        if (
          !record.mapEligible ||
          typeof record.longitude !== "number" ||
          typeof record.latitude !== "number"
        ) {
          return;
        }
        const position = projectFallbackCoordinate(
          [record.longitude, record.latitude],
          fallbackBounds
        );
        points.push({
          color: LAYER_COLORS[elementId] || "#176a4b",
          elementId,
          record,
          ...position,
        });
      });
    });
    return points;
  }, [activeIds, fallbackBounds, recordsByElement]);

  useEffect(() => {
    const requested = initialState.countryIso3?.toUpperCase() || "";
    if (!requested) return;
    setCountryIso3((current) => (current === requested ? current : requested));
  }, [initialState.countryIso3]);

  useEffect(() => {
    let cancelled = false;
    const current = getCountryDataProviderV122(countryIso3);
    setFallbackBoundaryStatus("loading");
    setFallbackBoundaryPath("");

    if (!current?.mapView.bounds) {
      setFallbackBoundaryStatus("error");
      return () => {
        cancelled = true;
      };
    }

    void loadWorldCountryBoundaries()
      .then((collection) => {
        if (cancelled) return;
        const feature = collection.features.find(
          (candidate) => candidate.properties.iso3 === countryIso3
        );
        const path = feature
          ? geometryToFallbackPath(feature.geometry, current.mapView.bounds!)
          : "";
        if (!path) throw new Error(`로컬 국가 경계 누락: ${countryIso3}`);
        setFallbackBoundaryPath(path);
        setFallbackBoundaryStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.warn("Local map fallback boundary unavailable", reason);
        setFallbackBoundaryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  useEffect(() => {
    let cancelled = false;
    setLayers([]);
    setRecordsByElement({});
    setLoadingIds([]);
    setLayerErrors({});
    setFilters({});
    setSelected(null);
    setActiveIds([]);
    setFocusId(null);

    if (!hasCountryDataProviderV122(countryIso3)) {
      setMapIndexStatus("error");
      setMapIndexError("현재 지도 데이터가 없습니다");
      return () => {
        cancelled = true;
      };
    }

    setMapIndexStatus("loading");
    setMapIndexError("");
    void loadCountryMapIndexV122(countryIso3)
      .then((nextLayers) => {
        if (cancelled) return;
        setLayers(nextLayers);
        setMapIndexStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Country map index load failed", reason);
        setMapIndexStatus("error");
        setMapIndexError(
          publicCountryDataErrorMessageV122(
            reason,
            "지도 데이터 목록을 불러오지 못했습니다"
          )
        );
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso3, mapIndexReloadNonce]);

  const externalActiveLayerKey = initialState.activeLayerKeys.join("|");

  useEffect(() => {
    if (mapIndexStatus !== "ready") return;
    const requestedCountry = initialState.countryIso3?.toUpperCase() || "";
    if (requestedCountry && requestedCountry !== countryIso3) return;

    const available = new Set(layers.map((layer) => layer.elementId));
    const nextActive = initialState.activeLayerKeys.filter((id) =>
      available.has(id)
    );
    const nextFocus =
      initialState.focusLayerKey && available.has(initialState.focusLayerKey)
        ? initialState.focusLayerKey
        : nextActive[nextActive.length - 1] || null;

    setActiveIds((current) =>
      sameStringArray(current, nextActive) ? current : nextActive
    );
    setFocusId((current) => (current === nextFocus ? current : nextFocus));
  }, [
    countryIso3,
    externalActiveLayerKey,
    initialState.countryIso3,
    initialState.focusLayerKey,
    layers,
    mapIndexStatus,
  ]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setBaseMapStatus("loading");
    let pendingMap: MapLibreMap | null = null;
    try {
      pendingMap = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: provider?.mapView.center || [20, 15],
        zoom: provider?.mapView.zoom || 1.5,
      });
      pendingMap.addControl(new maplibregl.NavigationControl(), "top-right");
      pendingMap.addControl(
        new maplibregl.ScaleControl({ unit: "metric" }),
        "bottom-right"
      );
    } catch (reason) {
      console.error("MapLibre initialization failed", reason);
      try {
        pendingMap?.remove();
      } catch {
        // The partially initialized renderer has no remaining user state.
      }
      setBaseMapStatus("error");
      mapRef.current = null;
      return;
    }
    if (!pendingMap) return;
    const map = pendingMap;
    mapRef.current = map;

    let ready = false;
    const markReady = () => {
      ready = true;
      setBaseMapStatus("ready");
      const current = getCountryDataProviderV122(countryIso3);
      if (current?.mapView.bounds) {
        map.fitBounds(current.mapView.bounds, {
          padding: 44,
          duration: 0,
        });
      }
      window.setTimeout(() => map.resize(), 0);
    };
    const handleError = (event: any) => {
      console.error("MapLibre runtime error", event.error || event);
      if (!ready && !map.isStyleLoaded()) setBaseMapStatus("error");
    };
    const handleStyleLoad = () => {
      if (!ready) markReady();
    };
    map.on("load", markReady);
    map.on("style.load", handleStyleLoad);
    map.on("error", handleError);

    const timeout = window.setTimeout(() => {
      if (!ready) setBaseMapStatus("error");
    }, 12000);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.resize())
        : null;
    if (containerRef.current) resizeObserver?.observe(containerRef.current);

    return () => {
      window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      popupRef.current?.remove();
      map.off("load", markReady);
      map.off("style.load", handleStyleLoad);
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
    };
  }, []); // one MapLibre instance

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready" || !provider) return;
    if (provider.mapView.bounds) {
      map.fitBounds(provider.mapView.bounds, { padding: 44, duration: 350 });
    } else {
      map.easeTo({
        center: provider.mapView.center,
        zoom: provider.mapView.zoom,
      });
    }
  }, [baseMapStatus, provider]);

  useEffect(() => {
    activeIds.forEach((elementId) => {
      if (recordsByElement[elementId] || loadingIds.includes(elementId)) return;
      setLoadingIds((current) => [...current, elementId]);
      setLayerErrors((current) => {
        const next = { ...current };
        delete next[elementId];
        return next;
      });
      void loadCountryElementEntitiesV122(countryIso3, elementId)
        .then((payload) => {
          setRecordsByElement((current) => ({
            ...current,
            [elementId]: payload.records,
          }));
        })
        .catch((reason: unknown) => {
          console.error("Country map layer load failed", reason);
          setLayerErrors((current) => ({
            ...current,
            [elementId]: publicCountryDataErrorMessageV122(
              reason,
              "선택한 데이터 레이어를 불러오지 못했습니다"
            ),
          }));
        })
        .finally(() => {
          setLoadingIds((current) => current.filter((id) => id !== elementId));
        });
    });
  }, [activeIds, countryIso3, loadingIds, recordsByElement]);

  useEffect(() => {
    const index = new Map<string, CountryEntityV122>();
    (Object.values(recordsByElement) as CountryEntityV122[][]).forEach((rows) =>
      rows.forEach((row) => index.set(row.recordId, row))
    );
    recordIndexRef.current = index;
  }, [recordsByElement]);

  useEffect(() => {
    const nextOpacities = Object.fromEntries(
      activeIds.map((id) => [id, initialState.layerOpacities[id] ?? 0.78])
    );
    const nextYears = Object.fromEntries(
      activeIds.map((id) => [id, initialState.layerYears[id] ?? null])
    );
    onStateChange({
      ...initialState,
      countryIso3: countryIso3 || null,
      activeLayerKeys: activeIds,
      focusLayerKey: focusId,
      layerOpacities: nextOpacities,
      layerYears: nextYears,
    });
  }, [activeIds, countryIso3, focusId, onStateChange]); // initialState is intentionally reconciled through explicit fields

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;

    (Array.from(mountedKeysRef.current) as string[]).forEach((key) => {
      const [mountedCountry, ...elementParts] = key.split(":");
      const elementId = elementParts.join(":");
      if (mountedCountry === countryIso3 && activeIds.includes(elementId))
        return;
      removeLayerFromMap(map, mountedCountry, elementId, handlersRef.current);
      mountedKeysRef.current.delete(key);
    });

    activeIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      const records = recordsByElement[elementId];
      if (!layer || !records) return;
      const filteredRecords = filterRecords(records, layer, filters);
      const data = featureCollection(filteredRecords, layer);
      const ids = layerRuntimeIds(countryIso3, elementId);
      const existing = map.getSource(ids.source) as GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
        return;
      }

      map.addSource(ids.source, {
        type: "geojson",
        data,
        cluster: layer.cluster,
        clusterMaxZoom: 13,
        clusterRadius: 46,
      });
      const color = LAYER_COLORS[elementId] || "#176a4b";
      if (layer.cluster) {
        map.addLayer({
          id: ids.cluster,
          type: "circle",
          source: ids.source,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": color,
            "circle-opacity": 0.84,
            "circle-radius": [
              "step",
              ["get", "point_count"],
              17,
              100,
              22,
              750,
              29,
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
      }
      map.addLayer({
        id: ids.point,
        type: "circle",
        source: ids.source,
        ...(layer.cluster
          ? { filter: ["!", ["has", "point_count"]] as any }
          : {}),
        paint: {
          "circle-color": color,
          "circle-radius": elementId === "A-023" ? 5.5 : 7,
          "circle-opacity": 0.86,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      const onPointClick = (event: MapLayerMouseEvent) => {
        const recordId = String(
          event.features?.[0]?.properties?.recordId || ""
        );
        const record = recordIndexRef.current.get(recordId) || null;
        setSelected(record);
        setFocusId(elementId);
      };
      const onPointEnter = (event: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const coordinates = [...feature.geometry.coordinates] as [
          number,
          number
        ];
        const name = String(feature.properties?.name || layer.publicShortTitle);
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(coordinates)
          .setText(name)
          .addTo(map);
      };
      const onPointLeave = () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      };
      const onClusterClick = layer.cluster
        ? (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            map.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: Math.min(map.getZoom() + 2, 14),
            });
          }
        : undefined;
      map.on("click", ids.point, onPointClick);
      map.on("mouseenter", ids.point, onPointEnter);
      map.on("mouseleave", ids.point, onPointLeave);
      if (onClusterClick) map.on("click", ids.cluster, onClusterClick);
      const key = runtimeKey(countryIso3, elementId);
      handlersRef.current[key] = {
        pointLayerId: ids.point,
        clusterLayerId: layer.cluster ? ids.cluster : undefined,
        onPointClick,
        onPointEnter,
        onPointLeave,
        onClusterClick,
      };
      mountedKeysRef.current.add(key);
    });
  }, [
    activeIds,
    baseMapStatus,
    countryIso3,
    filters,
    layers,
    recordsByElement,
  ]);

  const groupedLayers = useMemo(() => {
    const groups = new Map<string, CountryMapLayerV122[]>();
    layers.forEach((layer) =>
      groups.set(layer.category, [...(groups.get(layer.category) || []), layer])
    );
    return Array.from(groups.entries());
  }, [layers]);

  const focusedLayer =
    layers.find((layer) => layer.elementId === focusId) || null;
  const selectedLayer = selected
    ? layers.find((layer) => layer.elementId === selected.elementId) || null
    : null;

  function changeCountry(nextCountryIso3: string) {
    if (nextCountryIso3 === countryIso3) return;
    setCountryIso3(nextCountryIso3);
    setActiveIds([]);
    setFocusId(null);
    setSelected(null);
  }

  function toggleLayer(elementId: string) {
    setActiveIds((current) => {
      if (current.includes(elementId)) {
        const next = current.filter((id) => id !== elementId);
        if (focusId === elementId) setFocusId(next[next.length - 1] || null);
        return next;
      }
      setFocusId(elementId);
      return [...current, elementId];
    });
    setSelected(null);
  }

  function retryLayer(elementId: string) {
    setLayerErrors((current) => {
      const next = { ...current };
      delete next[elementId];
      return next;
    });
    setRecordsByElement((current) => {
      const next = { ...current };
      delete next[elementId];
      return next;
    });
    if (!activeIds.includes(elementId))
      setActiveIds((current) => [...current, elementId]);
  }

  function fitSelectedCountry() {
    const current = getCountryDataProviderV122(countryIso3);
    const map = mapRef.current;
    if (!current || !map) return;
    if (current.mapView.bounds) {
      map.fitBounds(current.mapView.bounds, { padding: 44, duration: 350 });
    } else {
      map.easeTo({
        center: current.mapView.center,
        zoom: current.mapView.zoom,
      });
    }
  }

  return (
    <div className="cdp-map-page">
      <div className="cdp-map-layout">
        <aside className="cdp-map-sidebar">
          <h1>데이터 지도</h1>
          <p>국가와 데이터 레이어를 선택해 지도에서 확인할 수 있습니다</p>

          <label className="cdp-field">
            <span className="cdp-field__label">국가</span>
            <select
              className="cdp-select"
              value={countryIso3}
              onChange={(event) => changeCountry(event.target.value)}
            >
              {PRIORITY_COUNTRIES.map((country) => (
                <option
                  key={country.iso3}
                  value={country.iso3}
                  disabled={!hasCountryDataProviderV122(country.iso3)}
                >
                  {country.nameKo}
                  {!hasCountryDataProviderV122(country.iso3)
                    ? " · 준비 중"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="cdp-action-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="cdp-button cdp-button--secondary"
              onClick={fitSelectedCountry}
              disabled={!provider}
            >
              전체 범위 보기
            </button>
            <button
              type="button"
              className="cdp-button cdp-button--secondary"
              onClick={() => {
                setActiveIds([]);
                setFocusId(null);
                setSelected(null);
              }}
            >
              모두 지우기
            </button>
          </div>

          {baseMapStatus === "error" && (
            <div className="cdp-alert cdp-alert--error" role="alert">
              <strong>배경지도를 불러오지 못했습니다</strong>
              <span>네트워크 상태를 확인한 뒤 새로고침해 주세요</span>
            </div>
          )}
          {mapIndexError && (
            <div className="cdp-alert cdp-alert--error" role="alert">
              <strong>{mapIndexError}</strong>
              {provider && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  onClick={() =>
                    setMapIndexReloadNonce((current) => current + 1)
                  }
                >
                  다시 시도
                </button>
              )}
            </div>
          )}
          {mapIndexStatus === "loading" && (
            <p className="cdp-muted">지도 데이터 목록을 불러오는 중입니다</p>
          )}

          {groupedLayers.map(([category, items]) => (
            <section key={category} className="cdp-map-layer-group">
              <h2>{category}</h2>
              {items.map((layer) => (
                <label
                  key={layer.elementId}
                  className={`cdp-layer-card ${
                    activeIds.includes(layer.elementId) ? "is-active" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeIds.includes(layer.elementId)}
                    onChange={() => toggleLayer(layer.elementId)}
                  />
                  <span>
                    <strong>{layer.publicShortTitle}</strong>
                    {layer.latestYear && (
                      <small>자료연도 {layer.latestYear}</small>
                    )}
                  </span>
                  <button
                    type="button"
                    className="cdp-button cdp-button--secondary cdp-button--compact"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setFocusId(layer.elementId);
                      if (!activeIds.includes(layer.elementId))
                        toggleLayer(layer.elementId);
                    }}
                  >
                    보기
                  </button>
                  {layerErrors[layer.elementId] && (
                    <span className="cdp-layer-error">
                      {layerErrors[layer.elementId]}
                      {" · "}
                      <button
                        type="button"
                        onClick={() => retryLayer(layer.elementId)}
                      >
                        다시 시도
                      </button>
                    </span>
                  )}
                </label>
              ))}
            </section>
          ))}

          {focusedLayer && focusedLayer.filters.length > 0 && (
            <section className="cdp-map-layer-group">
              <h2>{focusedLayer.publicShortTitle} 필터</h2>
              {focusedLayer.filters.map((filter) => (
                <label
                  key={filter.field}
                  className="cdp-field"
                  style={{ marginBottom: 9 }}
                >
                  <span className="cdp-field__label">{filter.label}</span>
                  <select
                    className="cdp-select"
                    value={
                      filters[`${focusedLayer.elementId}:${filter.field}`] ||
                      "all"
                    }
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        [`${focusedLayer.elementId}:${filter.field}`]:
                          event.target.value,
                      }))
                    }
                  >
                    <option value="all">전체</option>
                    {filter.values.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
          )}
        </aside>

        <main className="cdp-map-canvas-wrap" aria-label="데이터 지도">
          <div
            className="cdp-map-fallback"
            data-status={fallbackBoundaryStatus}
          >
            <svg
              className="cdp-map-fallback__svg"
              viewBox={`0 0 ${FALLBACK_VIEWBOX_WIDTH} ${FALLBACK_VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="베트남 로컬 경계 대체 지도"
            >
              <g className="cdp-map-fallback__grid" aria-hidden="true">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                  (value) => (
                    <line
                      key={`vertical-${value}`}
                      x1={value}
                      y1="0"
                      x2={value}
                      y2={FALLBACK_VIEWBOX_HEIGHT}
                    />
                  )
                )}
                {[100, 200, 300, 400, 500, 600].map((value) => (
                  <line
                    key={`horizontal-${value}`}
                    x1="0"
                    y1={value}
                    x2={FALLBACK_VIEWBOX_WIDTH}
                    y2={value}
                  />
                ))}
              </g>
              {fallbackBoundaryPath ? (
                <path
                  className="cdp-map-fallback__country"
                  d={fallbackBoundaryPath}
                  fillRule="evenodd"
                />
              ) : (
                <path
                  className="cdp-map-fallback__country-placeholder"
                  d="M365 80 L640 110 L720 260 L650 555 L470 625 L300 470 L285 225 Z"
                />
              )}
              {fallbackPoints.map((point) => (
                <circle
                  key={`${point.elementId}:${point.record.recordId}`}
                  className={`cdp-map-fallback__point ${
                    selected?.recordId === point.record.recordId
                      ? "is-selected"
                      : ""
                  }`}
                  cx={point.x}
                  cy={point.y}
                  r={selected?.recordId === point.record.recordId ? 6 : 4}
                  fill={point.color}
                  opacity="0.82"
                  onClick={() => {
                    setSelected(point.record);
                    setFocusId(point.elementId);
                  }}
                >
                  <title>{entityDisplayNameV121(point.record)}</title>
                </circle>
              ))}
            </svg>
            <span className="cdp-map-fallback__attribution">
              로컬 경계 데이터 · 네트워크 없이 표시
            </span>
          </div>
          <div
            ref={containerRef}
            className={`cdp-map-canvas ${
              baseMapStatus === "ready" ? "is-visible" : "is-suspended"
            }`}
          />
          <div className="cdp-map-renderer-badge">
            {baseMapStatus === "ready"
              ? "MapLibre · 로컬 벡터 배경지도"
              : fallbackBoundaryStatus === "ready"
              ? "SVG 대체 지도"
              : "지도 준비 중"}
          </div>
          <div className="cdp-map-overlay-card">
            <strong>
              {focusedLayer
                ? focusedLayer.publicShortTitle
                : "선택된 레이어 없음"}
            </strong>
            <div>
              {focusedLayer
                ? loadingIds.includes(focusedLayer.elementId)
                  ? "불러오는 중입니다"
                  : "지도에서 항목을 선택하세요"
                : "왼쪽에서 데이터 레이어를 선택하세요"}
            </div>
          </div>
          {focusedLayer && (
            <div className="cdp-map-legend">
              <strong>{focusedLayer.publicShortTitle}</strong>
              <span>자료연도 {focusedLayer.latestYear || "미표기"}</span>
            </div>
          )}
        </main>

        <aside className="cdp-map-evidence">
          {selected ? (
            <>
              <h2>{entityDisplayNameV121(selected)}</h2>
              <div className="cdp-evidence-grid">
                <Evidence
                  label="자료연도"
                  value={selected.provenance.referenceYear || "미표기"}
                />
                {focusedLayer?.tooltipFields.map((field) => {
                  if (field === "name") return null;
                  const value = selected.normalizedAttributes?.[field];
                  if (value === null || value === undefined || value === "")
                    return null;
                  return (
                    <Evidence
                      key={field}
                      label={fieldLabelV121(field)}
                      value={formatValueV121(value)}
                    />
                  );
                })}
                <Evidence
                  label="자료 제공기관"
                  value={selected.provenance.sourceOrg || "미표기"}
                />
              </div>
              <div className="cdp-action-row" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="cdp-button cdp-button--primary"
                  onClick={() => onOpenElement(selected.elementId, countryIso3)}
                >
                  데이터 상세
                </button>
                {selectedLayer &&
                  (selectedLayer.downloadableRecordCount || 0) > 0 && (
                    <button
                      type="button"
                      className="cdp-button cdp-button--secondary"
                      onClick={() =>
                        onOpenDownload(selected.elementId, countryIso3)
                      }
                    >
                      다운로드
                    </button>
                  )}
                {selected.provenance.sourceUrl &&
                  isHttpUrlV121(selected.provenance.sourceUrl) && (
                    <a
                      className="cdp-button cdp-button--secondary"
                      href={selected.provenance.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      공식 출처
                    </a>
                  )}
              </div>
            </>
          ) : focusedLayer ? (
            <>
              <h2>{focusedLayer.publicTitle}</h2>
              <div className="cdp-evidence-grid">
                <Evidence
                  label="자료연도"
                  value={String(focusedLayer.latestYear || "미표기")}
                />
                <Evidence
                  label="자료 제공기관"
                  value={focusedLayer.sourceOrganizations.join(" · ")}
                />
              </div>
              <p className="cdp-evidence-empty">지도에서 항목을 선택하세요</p>
              <div className="cdp-action-row">
                <button
                  type="button"
                  className="cdp-button cdp-button--primary"
                  onClick={() =>
                    onOpenElement(focusedLayer.elementId, countryIso3)
                  }
                >
                  데이터 상세
                </button>
              </div>
            </>
          ) : (
            <div className="cdp-evidence-empty">
              <h2>지도에서 항목을 선택하세요</h2>
              {provider && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() => onOpenCountry(countryIso3)}
                >
                  국가정보 보기
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="cdp-evidence-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function removeLayerFromMap(
  map: MapLibreMap,
  countryIso3: string,
  elementId: string,
  handlers: Record<string, LayerHandlers>
) {
  const ids = layerRuntimeIds(countryIso3, elementId);
  const key = runtimeKey(countryIso3, elementId);
  const handler = handlers[key];
  if (handler) {
    if (map.getLayer(handler.pointLayerId)) {
      map.off("click", handler.pointLayerId, handler.onPointClick);
      map.off("mouseenter", handler.pointLayerId, handler.onPointEnter);
      map.off("mouseleave", handler.pointLayerId, handler.onPointLeave);
    }
    if (
      handler.clusterLayerId &&
      handler.onClusterClick &&
      map.getLayer(handler.clusterLayerId)
    ) {
      map.off("click", handler.clusterLayerId, handler.onClusterClick);
    }
    delete handlers[key];
  }
  [ids.point, ids.cluster].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(ids.source)) map.removeSource(ids.source);
}
