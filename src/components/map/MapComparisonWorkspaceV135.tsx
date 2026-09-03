import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import type { VietnamMapRendererV124 } from "../../data/vietnam/vietnamTypesV124";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { PublicTermTextV134 } from "../help/PublicTermV134";

export type MapComparisonSideV135 = "a" | "b";

export interface MapComparisonLayerOptionV135 {
  elementId: string;
  title: string;
}

export interface MapComparisonVariableOptionV135 {
  key: string;
  label: string;
  periods: string[];
  unit: string;
}

export interface MapComparisonDatasetV135 {
  color: string;
  coverage: string;
  elementId: string;
  geoJson: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  renderer: VietnamMapRendererV124;
  selector: { period: string; variable: string };
  source: string;
  title: string;
  unit: string;
  valueDomain?: { maximum: number; minimum: number };
  variableLabel: string;
  variableOptions: MapComparisonVariableOptionV135[];
}

interface MapComparisonWorkspaceV135Props {
  bounds: [[number, number], [number, number]];
  datasets: [MapComparisonDatasetV135 | null, MapComparisonDatasetV135 | null];
  layerOptions: MapComparisonLayerOptionV135[];
  onClose: () => void;
  onDatasetChange: (side: MapComparisonSideV135, elementId: string) => void;
  onPeriodChange: (side: MapComparisonSideV135, period: string) => void;
  onVariableChange: (side: MapComparisonSideV135, variable: string) => void;
  selectedElementIds: [string, string];
}

interface PaneProps {
  bounds: [[number, number], [number, number]];
  dataset: MapComparisonDatasetV135 | null;
  layerOptions: MapComparisonLayerOptionV135[];
  onDatasetChange: (elementId: string) => void;
  onMapMove: (side: MapComparisonSideV135, map: MapLibreMap) => void;
  onMapReady: (side: MapComparisonSideV135, map: MapLibreMap | null) => void;
  onPeriodChange: (period: string) => void;
  onVariableChange: (variable: string) => void;
  otherElementId: string;
  selectedElementId: string;
  side: MapComparisonSideV135;
}

const createComparisonStyleV135 = (): any => ({
  version: 8,
  sources: {
    "comparison-country-boundaries": {
      type: "geojson",
      data: publicAssetUrlV128("data/world-countries.geojson"),
      attribution: "Natural Earth",
    },
  },
  layers: [
    {
      id: "comparison-background",
      type: "background",
      paint: { "background-color": "#e7efeb" },
    },
    {
      id: "comparison-country-fill",
      type: "fill",
      source: "comparison-country-boundaries",
      paint: { "fill-color": "#ffffff", "fill-opacity": 0.9 },
    },
    {
      id: "comparison-country-outline",
      type: "line",
      source: "comparison-country-boundaries",
      paint: {
        "line-color": "#587168",
        "line-opacity": 0.82,
        "line-width": 1.1,
      },
    },
  ],
});

function removeThematicLayersV135(map: MapLibreMap, prefix: string): void {
  [
    "cluster-count",
    "cluster",
    "point",
    "activity-point",
    "outline",
    "line",
    "fill",
  ].forEach((suffix) => {
    const id = `${prefix}-${suffix}`;
    if (map.getLayer(id)) map.removeLayer(id);
  });
  const sourceId = `${prefix}-source`;
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

function mountThematicDatasetV135(
  map: MapLibreMap,
  prefix: string,
  dataset: MapComparisonDatasetV135
): void {
  removeThematicLayersV135(map, prefix);
  const sourceId = `${prefix}-source`;
  const isCluster = dataset.renderer === "cluster";
  map.addSource(sourceId, {
    type: "geojson",
    data: dataset.geoJson,
    ...(isCluster
      ? { cluster: true, clusterMaxZoom: 10, clusterRadius: 34 }
      : {}),
  });

  if (
    dataset.renderer === "admin1-choropleth" ||
    dataset.renderer === "partial-choropleth"
  ) {
    const minimum = dataset.valueDomain?.minimum ?? 0;
    const maximum = dataset.valueDomain?.maximum ?? 1;
    map.addLayer({
      id: `${prefix}-fill`,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "hasValue"], false],
          "rgba(0,0,0,0)",
          minimum === maximum
            ? dataset.color
            : [
                "interpolate",
                ["linear"],
                ["to-number", ["get", "value"]],
                minimum,
                "#e6f2ea",
                maximum,
                dataset.color,
              ],
        ] as any,
        "fill-opacity": 0.82,
      },
    });
    map.addLayer({
      id: `${prefix}-outline`,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.9,
        "line-width": 0.9,
      },
    });
    return;
  }

  if (dataset.renderer === "regional-scope") {
    const scopeFilter = ["==", ["get", "geometryRole"], "regional-scope"] as any;
    const activityFilter = ["==", ["get", "geometryRole"], "activity-site"] as any;
    map.addLayer({
      id: `${prefix}-fill`,
      type: "fill",
      source: sourceId,
      filter: scopeFilter,
      paint: { "fill-color": dataset.color, "fill-opacity": 0.22 },
    });
    map.addLayer({
      id: `${prefix}-outline`,
      type: "line",
      source: sourceId,
      filter: scopeFilter,
      paint: {
        "line-color": dataset.color,
        "line-dasharray": [3, 2],
        "line-opacity": 0.94,
        "line-width": 2.4,
      },
    });
    map.addLayer({
      id: `${prefix}-activity-point`,
      type: "circle",
      source: sourceId,
      filter: activityFilter,
      paint: {
        "circle-color": dataset.color,
        "circle-radius": 6,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    return;
  }

  if (dataset.renderer === "line") {
    map.addLayer({
      id: `${prefix}-line`,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": dataset.color,
        "line-opacity": 0.9,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.8, 9, 4.5],
      },
    });
    return;
  }

  if (isCluster) {
    map.addLayer({
      id: `${prefix}-cluster`,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": dataset.color,
        "circle-opacity": 0.78,
        "circle-radius": ["step", ["get", "point_count"], 12, 50, 17, 250, 23],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: `${prefix}-cluster-count`,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 10,
      },
      paint: { "text-color": "#ffffff" },
    });
  }
  map.addLayer({
    id: `${prefix}-point`,
    type: "circle",
    source: sourceId,
    filter: isCluster ? ["!", ["has", "point_count"]] : undefined,
    paint: {
      "circle-color": dataset.color,
      "circle-opacity": 0.88,
      "circle-radius": 5.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
    },
  });
}

function MapComparisonPaneV135({
  bounds,
  dataset,
  layerOptions,
  onDatasetChange,
  onMapMove,
  onMapReady,
  onPeriodChange,
  onVariableChange,
  otherElementId,
  selectedElementId,
  side,
}: PaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const prefix = `cdp-map-compare-${side}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    const map = new maplibregl.Map({
      attributionControl: false,
      bounds,
      container,
      fitBoundsOptions: { padding: 26 },
      style: createComparisonStyleV135(),
    });
    mapRef.current = map;
    const handleLoad = () => {
      setReady(true);
      onMapReady(side, map);
    };
    const handleMove = () => onMapMove(side, map);
    const handleError = (event: { error?: Error }) => {
      const message = event.error?.message || "비교 지도를 불러오지 못했습니다";
      if (/image|glyph|sprite/iu.test(message)) return;
      setRuntimeError(message);
    };
    map.on("load", handleLoad);
    map.on("move", handleMove);
    map.on("error", handleError as any);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => map.resize());
    observer?.observe(container);
    return () => {
      observer?.disconnect();
      onMapReady(side, null);
      map.remove();
      mapRef.current = null;
    };
  }, [bounds, onMapMove, onMapReady, side]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    // The style can still be parsing when a pane switches datasets. Bailing out
    // here used to leave the previous dataset painted under the new legend, so
    // the update is retried once the style settles instead of being dropped.
    const apply = () => {
      if (cancelled || !mapRef.current) return;
      if (!map.isStyleLoaded()) {
        map.once("idle", apply);
        return;
      }
      try {
        if (dataset) {
          mountThematicDatasetV135(map, prefix, dataset);
        } else {
          removeThematicLayersV135(map, prefix);
        }
        setRuntimeError("");
      } catch (error) {
        setRuntimeError(error instanceof Error ? error.message : String(error));
      }
    };

    apply();
    return () => {
      cancelled = true;
      map.off("idle", apply);
    };
  }, [dataset, prefix, ready]);

  const selectedVariable = dataset?.variableOptions.find(
    (option) => option.key === dataset.selector.variable
  );
  const periods = selectedVariable?.periods || [];

  return (
    <section
      className="cdp-map-compare-pane-v135"
      data-map-ready={ready && dataset && !runtimeError ? "true" : "false"}
      data-element-id={selectedElementId}
      data-primary-element={selectedElementId}
      data-runtime-error={runtimeError || "none"}
      data-testid={`map-compare-pane-${side}`}
    >
      <header>
        <span>데이터 {side.toUpperCase()}</span>
        <label>
          <span className="cdp-sr-only">데이터 {side.toUpperCase()} 선택</span>
          <select
            aria-label={`데이터 ${side.toUpperCase()} 선택`}
            onChange={(event) => onDatasetChange(event.target.value)}
            value={selectedElementId}
          >
            {layerOptions.map((option) => (
              <option
                disabled={option.elementId === otherElementId}
                key={option.elementId}
                value={option.elementId}
              >
                {option.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="cdp-map-compare-pane-v135__selectors">
        <label>
          <span>측정항목</span>
          <select
            disabled={!dataset}
            onChange={(event) => onVariableChange(event.target.value)}
            value={dataset?.selector.variable || ""}
          >
            {(dataset?.variableOptions || []).map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>기준연도·기간</span>
          <select
            disabled={!dataset}
            onChange={(event) => onPeriodChange(event.target.value)}
            value={dataset?.selector.period || ""}
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="cdp-map-compare-pane-v135__canvas-wrap">
        <div className="cdp-map-compare-pane-v135__canvas" ref={containerRef} />
        {!dataset && <p>선택한 지도 데이터를 불러오는 중입니다</p>}
        {runtimeError && <p role="alert">{runtimeError}</p>}
      </div>
      <div
        className="cdp-map-compare-pane-v135__legend"
        data-testid={`map-comparison-legend-${side}`}
      >
        <i
          aria-hidden="true"
          style={{ background: dataset?.color || "#91a79e" }}
        />
        <div>
          <strong>
            <PublicTermTextV134 text={dataset?.title || "지도 데이터 준비 중"} />
          </strong>
          <span>
            <PublicTermTextV134
              text={
                dataset
                  ? `${dataset.variableLabel} · ${dataset.unit} · ${dataset.selector.period}`
                  : ""
              }
            />
          </span>
          {dataset?.coverage && <small>{dataset.coverage}</small>}
        </div>
      </div>
    </section>
  );
}

export default function MapComparisonWorkspaceV135({
  bounds,
  datasets,
  layerOptions,
  onClose,
  onDatasetChange,
  onPeriodChange,
  onVariableChange,
  selectedElementIds,
}: MapComparisonWorkspaceV135Props) {
  const mapsRef = useRef<Record<MapComparisonSideV135, MapLibreMap | null>>({
    a: null,
    b: null,
  });
  const syncLockRef = useRef(false);
  const [syncRevision, setSyncRevision] = useState(0);

  const handleMapReady = useCallback(
    (side: MapComparisonSideV135, map: MapLibreMap | null) => {
      mapsRef.current[side] = map;
    },
    []
  );
  const handleMapMove = useCallback(
    (side: MapComparisonSideV135, source: MapLibreMap) => {
      if (syncLockRef.current) return;
      const target = mapsRef.current[side === "a" ? "b" : "a"];
      if (!target) return;
      syncLockRef.current = true;
      target.jumpTo({
        bearing: source.getBearing(),
        center: source.getCenter(),
        pitch: source.getPitch(),
        zoom: source.getZoom(),
      });
      setSyncRevision((current) => current + 1);
      window.requestAnimationFrame(() => {
        syncLockRef.current = false;
      });
    },
    []
  );

  return (
    <section
      className="cdp-map-comparison-v135"
      data-comparison-elements={selectedElementIds.join(",")}
      data-layout-desktop="side-by-side"
      data-layout-mobile="stacked"
      data-layout-mode="side-by-side"
      data-sync-revision={syncRevision}
      data-synchronized="true"
      data-testid="map-comparison-workspace-v135"
    >
      <header className="cdp-map-comparison-v135__header">
        <div>
          <span>지도 비교</span>
          <h2>두 데이터를 같은 범위에서 비교</h2>
          <p>한쪽 지도를 이동하거나 확대하면 다른 지도도 같은 범위로 맞춰집니다.</p>
        </div>
        <button type="button" onClick={onClose}>
          일반 지도로 돌아가기
        </button>
      </header>
      <div className="cdp-map-comparison-v135__panes">
        <MapComparisonPaneV135
          bounds={bounds}
          dataset={datasets[0]}
          layerOptions={layerOptions}
          onDatasetChange={(elementId) => onDatasetChange("a", elementId)}
          onMapMove={handleMapMove}
          onMapReady={handleMapReady}
          onPeriodChange={(period) => onPeriodChange("a", period)}
          onVariableChange={(variable) => onVariableChange("a", variable)}
          otherElementId={selectedElementIds[1]}
          selectedElementId={selectedElementIds[0]}
          side="a"
        />
        <MapComparisonPaneV135
          bounds={bounds}
          dataset={datasets[1]}
          layerOptions={layerOptions}
          onDatasetChange={(elementId) => onDatasetChange("b", elementId)}
          onMapMove={handleMapMove}
          onMapReady={handleMapReady}
          onPeriodChange={(period) => onPeriodChange("b", period)}
          onVariableChange={(variable) => onVariableChange("b", variable)}
          otherElementId={selectedElementIds[0]}
          selectedElementId={selectedElementIds[1]}
          side="b"
        />
      </div>
    </section>
  );
}
