/**
 * V163: one comparison pane's MapLibre map.
 *
 * The map is created once per pane and keeps its camera; `show()` swaps what
 * it draws. The data layer is drawn by the big map's own renderer pipeline
 * (`prepareMapLayerV152` + `mountPreparedMapLayerV152`), so every renderer -
 * province and partial choropleths, assessment units and group values, sites
 * with polygons, regional scope, lines, clusters and icon points - looks
 * exactly as on the big map. Under it: the base style, the country's level-1
 * outline (Viet Nam's 34/63 provinces, another country's registry boundary)
 * and Korean place labels.
 *
 * Errors never reach the console: the caller hears about them and keeps a
 * readable message on screen.
 */
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../../styles/map-presentation-v148.css";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../../../data/countryContext";
import { polygonLabelAnchorV151 } from "../../../data/map/labelAnchorV151";
import {
  addKoreanMapLabelsV151,
  buildLabelFeaturesV151,
  KOREAN_LABEL_LAYER_IDS_V151,
} from "../../../data/map/mapLabelsV151";
import {
  attachMapIconMissingHandlerV152,
  mapLayerIconV152,
  registerMapIcons,
  type MaplibreMapLike,
} from "../../../data/map/mapIconsV152";
import type { VietnamMapGeoJsonV124 } from "../../../data/vietnam/vietnamDataLoaderV124";
import {
  applyBoundaryReferenceV152,
  MAP_STYLE,
  mountPreparedMapLayerV152,
  type MapLayerPreparedV152,
  type MapLayerRenderResultV152,
} from "../../../map/layers";
import type { BboxV163, CompareSideV163 } from "./compareModelV163";

/** Map words in Korean (gesture hints, the canvas name). */
const COMPARE_LOCALE_V163: Record<string, string> = {
  "Map.Title": "비교 지도",
  "Popup.Close": "팝업 닫기",
  "NavigationControl.ZoomIn": "확대",
  "NavigationControl.ZoomOut": "축소",
  "NavigationControl.ResetBearing": "북쪽 방향으로",
  "AttributionControl.ToggleAttribution": "출처 보기",
};

const FIT_PADDING_V163 = 28;
const CLUSTER_MAX_ZOOM_V163 = 11;
const REFERENCE_SOURCE_V163 = "cmp163-adm1-reference";
const REFERENCE_LINE_V163 = "cmp163-adm1-reference-line";
const HOVER_LINE_V163 = "cmp163-hover-line";
const LABEL_SOURCE_V151 = "cdp-ko-labels-v151";

export interface CompareShowInputV163 {
  iso3: string;
  prepared: MapLayerPreparedV152;
  reference: VietnamMapGeoJsonV124 | null;
  /** The hover card for a feature, or null for none. */
  popupFor: (properties: Record<string, unknown>, compact: boolean) => HTMLElement | null;
}

export interface ComparePaneEngineV163 {
  map: MapLibreMap;
  show: (input: CompareShowInputV163) => MapLayerRenderResultV152;
  clear: () => void;
  setSelected: (key: string | null) => void;
  setHover: (key: string | null) => void;
  fitTo: (bbox: BboxV163, animate?: boolean) => void;
  resize: () => void;
  /** Rendered features of the data layer (QA and the summary's "drawn" check). */
  renderedCount: () => number;
  destroy: () => void;
}

export interface ComparePaneEngineInputV163 {
  side: CompareSideV163;
  container: HTMLElement;
  bbox: BboxV163 | null;
  onClick: (properties: Record<string, unknown> | null) => void;
  onHover: (properties: Record<string, unknown> | null) => void;
  onMove: (map: MapLibreMap) => void;
  onRuntimeError?: (message: string) => void;
}

type QaWindowV163 = Window & { __cdpCompareMapsV163?: Partial<Record<CompareSideV163, MapLibreMap | null>> };

/** Localhost only: QA runners read the live maps, as with the big map's observer. */
function qaWindowV163(): QaWindowV163 | null {
  if (typeof window === "undefined") return null;
  const host = String(window.location.hostname || "");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" ? (window as QaWindowV163) : null;
}

function featureKeyV163(feature: MapGeoJSONFeature): string {
  const p = (feature.properties || {}) as Record<string, unknown>;
  return String(p.selectionKey ?? p.recordId ?? p.adm1Code ?? feature.id ?? "");
}

/**
 * Province labels for a country whose boundary file carries its own Korean
 * names (`nameKo`): Viet Nam's dictionary-based labels are left as they are.
 */
function countryProvinceLabelsV163(reference: VietnamMapGeoJsonV124 | null): GeoJSON.Feature<GeoJSON.Point>[] {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const feature of reference?.features || []) {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const name = typeof properties.nameKo === "string" ? properties.nameKo.trim() : "";
    if (!name) continue;
    const point = polygonLabelAnchorV151(feature.geometry as never);
    if (!point) continue;
    features.push({
      type: "Feature",
      properties: { name, kind: "province", code: null },
      geometry: { type: "Point", coordinates: point },
    });
  }
  return features;
}

export async function createComparePaneEngineV163(input: ComparePaneEngineInputV163): Promise<ComparePaneEngineV163> {
  const style = JSON.parse(JSON.stringify(MAP_STYLE));
  const bbox = input.bbox || [102.14, 8.18, 109.46, 23.39];
  const map = new maplibregl.Map({
    container: input.container,
    style,
    bounds: [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ],
    fitBoundsOptions: { padding: FIT_PADDING_V163 },
    minZoom: 2,
    maxZoom: 14,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: { compact: true },
    locale: COMPARE_LOCALE_V163,
  } as any);
  map.keyboard.disableRotation();
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

  const qa = qaWindowV163();
  if (qa) {
    qa.__cdpCompareMapsV163 = qa.__cdpCompareMapsV163 || {};
    qa.__cdpCompareMapsV163[input.side] = map;
  }

  let rendered: MapLayerRenderResultV152 | null = null;
  let popupFor: CompareShowInputV163["popupFor"] | null = null;
  let popup: Popup | null = null;
  let destroyed = false;

  const onError = (event: any) => {
    // Tiles, glyphs and icons are optional; the data layer is not.
    const message = String(event?.error?.message || "");
    if (/glyph|sprite|image|font|pbf|tile/iu.test(message)) return;
    input.onRuntimeError?.(message.slice(0, 120) || "map error");
  };
  map.on("error", onError);

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("compare map load timeout")), 20000);
    map.once("load", () => {
      window.clearTimeout(timeout);
      resolve();
    });
  }).catch((reason) => {
    map.off("error", onError);
    map.remove();
    if (qa?.__cdpCompareMapsV163?.[input.side] === map) qa.__cdpCompareMapsV163[input.side] = null;
    throw reason;
  });

  const iconMap = map as unknown as MaplibreMapLike;
  registerMapIcons(iconMap);
  attachMapIconMissingHandlerV152(iconMap);

  const hitLayers = () =>
    rendered
      ? [...rendered.interactiveLayerIds, rendered.clusterLayerId].filter((id): id is string => Boolean(id && map.getLayer(id)))
      : [];

  const closePopup = () => {
    popup?.remove();
    popup = null;
  };

  const removeDataLayers = () => {
    closePopup();
    if (!rendered) return;
    const sourceId = rendered.ids.source;
    const layers = map.getStyle()?.layers || [];
    for (const layer of layers) {
      if ((layer as { source?: string }).source === sourceId && map.getLayer(layer.id)) map.removeLayer(layer.id);
    }
    if (map.getLayer(HOVER_LINE_V163)) map.removeLayer(HOVER_LINE_V163);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    rendered = null;
  };

  const applyReference = (iso3: string, reference: VietnamMapGeoJsonV124 | null) => {
    const isDefault = iso3 === DEFAULT_COUNTRY_ISO3_V158;
    // Viet Nam: the big map's own province outline (34 heavy, 63 light).
    applyBoundaryReferenceV152(map, isDefault ? iso3 : "", isDefault ? reference : null);
    const existing = map.getSource(REFERENCE_SOURCE_V163) as GeoJSONSource | undefined;
    if (isDefault || !reference) {
      if (map.getLayer(REFERENCE_LINE_V163)) map.removeLayer(REFERENCE_LINE_V163);
      if (existing) map.removeSource(REFERENCE_SOURCE_V163);
    } else if (existing) {
      existing.setData(reference as GeoJSON.FeatureCollection);
    } else {
      map.addSource(REFERENCE_SOURCE_V163, {
        type: "geojson",
        data: reference as GeoJSON.FeatureCollection,
        attribution: "행정경계: geoBoundaries ADM1 · CC BY 4.0",
      });
      map.addLayer({
        id: REFERENCE_LINE_V163,
        type: "line",
        source: REFERENCE_SOURCE_V163,
        paint: { "line-color": "#2f6f59", "line-width": 1.4, "line-opacity": 0.7 },
      });
    }
    // Korean labels: countries and Viet Nam's cities always; provinces from
    // Viet Nam's dictionary or the other country's own Korean names.
    addKoreanMapLabelsV151(map, isDefault ? reference : null);
    // Viet Nam's 34 province names wait for zoom 6.3 (the big map's rule); a
    // country with a handful of level-1 units names them at its opening view.
    if (map.getLayer("cdp-ko-province")) map.setLayerZoomRange("cdp-ko-province", isDefault ? 6.3 : 4.5, 24);
    if (!isDefault) {
      const source = map.getSource(LABEL_SOURCE_V151) as GeoJSONSource | undefined;
      const base: GeoJSON.Feature<GeoJSON.Point>[] = buildLabelFeaturesV151(null).map((feature) => ({
        type: "Feature",
        properties: { name: feature.name, kind: feature.kind, code: feature.code ?? null },
        geometry: { type: "Point", coordinates: feature.point },
      }));
      source?.setData({ type: "FeatureCollection", features: [...base, ...countryProvinceLabelsV163(reference)] });
    }
  };

  // The credits start folded behind their (i) button: expanded they cover the
  // legend on a pane this size. One click opens them, as MapLibre does.
  const foldAttribution = () => {
    const attribution = input.container.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
    attribution?.classList.remove("maplibregl-compact-show");
  };
  map.once("idle", foldAttribution);

  const keepLabelsOnTop = () => {
    for (const id of KOREAN_LABEL_LAYER_IDS_V151) if (map.getLayer(id)) map.moveLayer(id);
  };

  const showPopup = (feature: MapGeoJSONFeature, lngLat: maplibregl.LngLat) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const content = popupFor ? popupFor(properties, true) : null;
    if (!content) {
      closePopup();
      return;
    }
    const at = feature.geometry.type === "Point" ? ((feature.geometry as GeoJSON.Point).coordinates as [number, number]) : lngLat;
    const width = Math.max(170, Math.min(260, input.container.clientWidth - 64));
    const point = map.project(at as maplibregl.LngLatLike);
    const anchor = `${point.y < input.container.clientHeight / 2 ? "top" : "bottom"}-${
      point.x < input.container.clientWidth / 2 ? "left" : "right"
    }` as maplibregl.PositionAnchor;
    popup?.remove();
    popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, maxWidth: `${width}px`, anchor })
      .setLngLat(at)
      .setDOMContent(content)
      .addTo(map);
  };

  const setLayerFilter = (layerId: string | undefined, key: string | null) => {
    if (layerId && map.getLayer(layerId)) map.setFilter(layerId, ["==", ["get", "selectionKey"], key || "__none__"]);
  };

  const onClick = (event: maplibregl.MapMouseEvent) => {
    const layers = hitLayers();
    const feature = layers.length ? map.queryRenderedFeatures(event.point, { layers })[0] : undefined;
    if (!feature) {
      input.onClick(null);
      return;
    }
    const properties = (feature.properties || {}) as Record<string, unknown>;
    if (properties.cluster) {
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      const source = rendered ? (map.getSource(rendered.ids.source) as GeoJSONSource | undefined) : undefined;
      const fallbackZoom = Math.min(map.getZoom() + 2, map.getMaxZoom());
      if (!source) {
        map.easeTo({ center: [lng, lat], zoom: fallbackZoom });
        return;
      }
      void source
        .getClusterExpansionZoom(Number(properties.cluster_id))
        .then((zoom) => map.easeTo({ center: [lng, lat], zoom: Math.min(Math.max(zoom, map.getZoom() + 1), map.getMaxZoom()) }))
        .catch(() => map.easeTo({ center: [lng, lat], zoom: fallbackZoom }));
      return;
    }
    closePopup();
    input.onClick({ ...properties, selectionKey: featureKeyV163(feature) });
  };
  const onMouseMove = (event: maplibregl.MapMouseEvent) => {
    const layers = hitLayers();
    const feature = layers.length ? map.queryRenderedFeatures(event.point, { layers })[0] : undefined;
    const properties = (feature?.properties || null) as Record<string, unknown> | null;
    map.getCanvas().style.cursor = feature ? "pointer" : "";
    if (!feature || properties?.cluster) {
      closePopup();
      input.onHover(null);
      return;
    }
    showPopup(feature, event.lngLat);
    input.onHover({ ...properties, selectionKey: featureKeyV163(feature) });
  };
  const onLeave = () => {
    map.getCanvas().style.cursor = "";
    closePopup();
    input.onHover(null);
  };
  const onMove = () => input.onMove(map);

  map.on("click", onClick);
  map.on("mousemove", onMouseMove);
  map.on("move", onMove);
  map.getCanvasContainer().addEventListener("mouseleave", onLeave);

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => map.resize());
  observer?.observe(input.container);

  return {
    map,
    show: (showInput) => {
      removeDataLayers();
      popupFor = showInput.popupFor;
      applyReference(showInput.iso3, showInput.reference);
      const representative = mapLayerIconV152(showInput.prepared.layer.elementId);
      if (representative) registerMapIcons(iconMap, [representative], "white");
      rendered = mountPreparedMapLayerV152(map, showInput.prepared, {
        icons: true,
        interactive: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM_V163,
      });
      // A hover outline for region and unit fills, so the region a reader
      // points at in one pane can be shown in the other.
      if (map.getLayer(rendered.ids.fill)) {
        map.addLayer({
          id: HOVER_LINE_V163,
          type: "line",
          source: rendered.ids.source,
          filter: ["==", ["get", "selectionKey"], "__none__"],
          paint: { "line-color": "#1d3f8f", "line-width": 2.6, "line-opacity": 0.95 },
        });
      }
      keepLabelsOnTop();
      map.once("idle", foldAttribution);
      return rendered;
    },
    clear: () => removeDataLayers(),
    setSelected: (key) => {
      if (!rendered) return;
      setLayerFilter(rendered.ids.selection, key);
      setLayerFilter(rendered.ids.pointSelection, key);
    },
    setHover: (key) => {
      if (!rendered) return;
      setLayerFilter(HOVER_LINE_V163, key);
      setLayerFilter(rendered.ids.pointHover, key);
    },
    fitTo: (target, animate = false) => {
      map.fitBounds(
        [
          [target[0], target[1]],
          [target[2], target[3]],
        ],
        { padding: FIT_PADDING_V163, duration: animate ? 300 : 0 }
      );
    },
    resize: () => map.resize(),
    renderedCount: () => {
      const layers = hitLayers();
      return layers.length ? map.queryRenderedFeatures({ layers }).length : 0;
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      closePopup();
      map.getCanvasContainer().removeEventListener("mouseleave", onLeave);
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("move", onMove);
      map.off("error", onError);
      map.remove();
      if (qa?.__cdpCompareMapsV163?.[input.side] === map) qa.__cdpCompareMapsV163[input.side] = null;
    },
  };
}
