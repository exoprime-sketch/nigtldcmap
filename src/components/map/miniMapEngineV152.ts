/**
 * V152: the MapLibre half of the mini map, loaded with `import()` only when a
 * reader shows intent (see miniMapStateV152). It draws the layer with the big
 * map's own renderers (src/map/layers), the same base style, boundary outline,
 * backdrop and Korean labels, and the same popups.
 *
 * Errors never reach the console: a failed backdrop falls back to "none" as on
 * the big map, and anything else is reported to the caller, which keeps the
 * static map on screen.
 */
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature, type MapSourceDataEvent, type Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../styles/map-presentation-v148.css";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import {
  ADM1_34_GEOMETRY_PATH_V151,
  REGION_6_GEOMETRY_PATH_V151,
  boundaryGeometryPathV151,
  type BoundarySystemV151,
} from "../../data/map/adminBoundaryV151";
import {
  applyMapBackdropV151,
  BACKDROP_SOURCE_PREFIX_V151,
  backdropOwnsCityLabelsV151,
  readMapBackdropKindV151,
  removeMapBackdropV151,
  VIETNAM_CORE_BBOX_V151,
  type MapBackdropKindV151,
} from "../../data/map/mapBackdropV151";
import { addKoreanMapLabelsV151, KOREAN_LABEL_LAYER_IDS_V151 } from "../../data/map/mapLabelsV151";
import {
  attachMapIconMissingHandlerV152,
  mapLayerIconV152,
  registerMapIcons,
  type MaplibreMapLike,
} from "../../data/map/mapIconsV152";
import { loadVietnamLocationsV151, loadVietnamSpatialGeoJsonV124 } from "../../data/vietnam/vietnamDataLoaderV124";
import { formatPublicNumberV126 } from "../../data/visualization/publicNumberFormatV126";
import { publicTextV126 } from "../../data/visualization/publicFieldPolicyV126";
import { publicMapLayerTitleV126 } from "../../data/visualization/publicMapWorkspaceV126";
import { getPublicIndicatorVariablePresentationV129 } from "../../data/interpretation/publicIndicatorInterpretationV129";
import {
  applyBoundaryReferenceV152,
  isAreaRendererV152,
  MAP_STYLE,
  mountPreparedMapLayerV152,
  prepareMapLayerV152,
  rendererOf,
  TRANSMISSION_VOLTAGE_CLASSES_V152,
  type LayerSelectorState,
  type MapLayerRenderResultV152,
  type SpatialRuntimeAsset,
} from "../../map/layers";
import type { MapCameraV151 } from "../../types/map";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { createMapPointPopupV152 } from "./mapPointPopupV152";
import { boundaryPopupLineV151, createPublicMapPopupContentV129 } from "./mapPublicPopupV129";
import {
  featureBboxV152,
  MINIMAP_CLUSTER_MAX_ZOOM_V152,
  MINIMAP_FIT_PADDING_V152,
  miniMapBoundsV152,
  miniMapOptionsV152,
  type BboxV152,
} from "./miniMapStateV152";

export interface MiniMapEngineInputV152 {
  container: HTMLElement;
  countryIso3: string;
  layer: CountryMapLayerV122;
  selected: LayerSelectorState;
  /** Point filters in the big map's form: `${elementId}:${field}` -> value. */
  filters: Record<string, string>;
  boundarySystem: BoundarySystemV151;
  /** The mini map's backdrop switch; the kind drawn is the big map's saved one. */
  backdropOn: boolean;
  camera: MapCameraV151 | null;
  data: { spatial?: SpatialRuntimeAsset; records?: CountryEntityV122[] };
  icons?: boolean;
  /** `atFit`: the camera is (still) the initial fit to the layer, not a view the reader chose. */
  onCamera: (camera: MapCameraV151, atFit: boolean) => void;
  onSelect: (id: string | null) => void;
  onBackdropFallback?: () => void;
  /** The credit line of the backdrop drawn now ("" when none). */
  onBackdropCredit?: (credit: string) => void;
  /** A non-backdrop map error, for diagnostics (never logged to the console). */
  onRuntimeError?: (message: string) => void;
  /** The legend of what the engine drew, when it differs from the static map's. */
  onLegend?: (legend: MiniMapLegendV152 | null) => void;
  /** In-box card for a clicked site's full details (a small map cannot hold a wide popup). */
  cardHost?: HTMLElement | null;
}

/** One short credit line per backdrop kind (full wording: 이용안내 > 지도 이용 시 참고사항). */
const BACKDROP_CREDIT_V152: Record<MapBackdropKindV151, string> = {
  terrain: "배경: Mapzen·AWS 지형, Natural Earth, © OpenStreetMap 기여자, OpenFreeMap",
  satellite: "배경: Esri, Maxar, Earthstar Geographics, © OpenStreetMap 기여자, OpenFreeMap",
  streets: "배경: © OpenStreetMap 기여자, OpenFreeMap",
  none: "",
};

/** The kind to draw when the backdrop is on: the big map's saved kind, terrain when that is "none". */
function backdropKindWhenOnV152(): MapBackdropKindV151 {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  const saved = readMapBackdropKindV151(storage);
  return saved === "none" ? "terrain" : saved;
}

export type MiniMapLegendV152 =
  | { kind: "ramp"; minimum: number; maximum: number; from: string; to: string; boundaryMode: string }
  | { kind: "lines"; classes: ReadonlyArray<{ kv: number; color: string }> };

export interface MiniMapEngineV152 {
  map: MapLibreMap;
  zoomBy: (delta: 1 | -1) => void;
  reset: () => void;
  setBackdropOn: (on: boolean) => void;
  select: (id: string | null) => void;
  closePopup: () => void;
  destroy: () => void;
}

type QaWindowV152 = Window & {
  __cdpMiniMapV152?: MapLibreMap | null;
  __cdpMiniMapStatsV152?: { created: number; removed: number };
};

/** Localhost only, like the big map's observer: runners read the live instance. */
function qaWindowV152(): QaWindowV152 | null {
  if (typeof window === "undefined") return null;
  const host = String(window.location.hostname || "");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" ? (window as QaWindowV152) : null;
}

function featureIdV152(feature: MapGeoJSONFeature): string {
  const p = (feature.properties || {}) as Record<string, unknown>;
  return String(p.selectionKey ?? p.recordId ?? p.adm1Code ?? feature.id ?? "");
}

function areaPopupV152(layer: CountryMapLayerV122, selected: LayerSelectorState, properties: Record<string, unknown>): HTMLDivElement {
  const renderer = rendererOf(layer);
  const title = publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle);
  if (renderer === "line") {
    const raw = properties.lengthKm ?? properties.length;
    const length = raw === null || raw === undefined || raw === "" ? null : Number(raw);
    return createPublicMapPopupContentV129(title, [
      `${properties.voltageKv || properties.voltage || ""} kV · ${
        length !== null && Number.isFinite(length) ? `${formatPublicNumberV126(length, "km")} km` : "길이 미표기"
      }`,
    ], { attributes: { "element-id": layer.elementId, "selection-key": String(properties.selectionKey ?? "") }, testId: "map-hover-popup-v133" });
  }
  if (renderer === "regional-scope") {
    return createPublicMapPopupContentV129(
      publicTextV126(properties.projectTitle || properties.name) || "지역 협력사업",
      [publicTextV126(properties.activitySiteLabel || properties.participatingCountries) || "참여국 범위"],
      { attributes: { "element-id": layer.elementId, "selection-key": String(properties.selectionKey ?? "") }, testId: "map-hover-popup-v133" }
    );
  }
  const presentation = getPublicIndicatorVariablePresentationV129(layer.elementId, selected.variable);
  const unit = presentation?.unit || String(properties.unit || "");
  const value = properties.hasValue
    ? `${formatPublicNumberV126(Number(properties.value), unit)}${unit ? ` ${unit}` : ""}`
    : "결측";
  return createPublicMapPopupContentV129(
    publicTextV126(properties.adm1Name || properties.name) || "성·시",
    [
      `${presentation?.label || publicTextV126(properties.variableLabel) || title} ${value}`,
      String(properties.period || selected.period || ""),
      boundaryPopupLineV151(properties, unit),
    ],
    { attributes: { "element-id": layer.elementId, "selection-key": String(properties.selectionKey ?? properties.adm1Code ?? "") }, testId: "map-hover-popup-v133" }
  );
}

export async function createMiniMapEngineV152(input: MiniMapEngineInputV152): Promise<MiniMapEngineV152> {
  const { layer, countryIso3 } = input;
  const controller = new AbortController();
  const area = isAreaRendererV152(rendererOf(layer));
  const [reference, geometry34, region6, locations] = await Promise.all([
    loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(boundaryGeometryPathV151(input.boundarySystem))).catch(() => null),
    area ? loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(ADM1_34_GEOMETRY_PATH_V151)).catch(() => null) : Promise.resolve(null),
    area ? loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(REGION_6_GEOMETRY_PATH_V151)).catch(() => null) : Promise.resolve(null),
    !area && layer.locationsUrl
      ? loadVietnamLocationsV151(layer.locationsUrl, controller.signal).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);
  const prepared = prepareMapLayerV152({
    countryIso3,
    layer,
    role: "primary",
    selected: input.selected,
    filters: input.filters,
    boundary: { system: input.boundarySystem, geometry34, region6 },
    spatial: input.data.spatial,
    records: input.data.records,
    locations,
  }, { icons: input.icons !== false });
  if (!prepared) throw new Error("mini map data unavailable");
  const entityById = new Map((input.data.records || []).map((record) => [record.recordId, record]));
  const legend: MiniMapLegendV152 | null =
    prepared.kind === "area" && prepared.area.choropleth && !prepared.area.isRegionalScope
      ? {
          kind: "ramp",
          minimum: prepared.area.choropleth.minimum,
          maximum: prepared.area.choropleth.maximum,
          from: "#e6f2ea",
          to: prepared.color,
          boundaryMode: prepared.area.choropleth.mode,
        }
      : prepared.kind === "area" && prepared.renderer === "line"
      ? { kind: "lines", classes: TRANSMISSION_VOLTAGE_CLASSES_V152 }
      : null;
  const layerBbox: BboxV152 | null = featureBboxV152(prepared.data);
  const bounds = miniMapBoundsV152(layerBbox, VIETNAM_CORE_BBOX_V151);
  // MapLibre keeps a reference to the style it was given; never share the module object.
  const style = JSON.parse(JSON.stringify(MAP_STYLE));
  const map = new maplibregl.Map(miniMapOptionsV152(input.container, style, bounds, input.camera) as any);
  map.keyboard.disableRotation();
  map.touchZoomRotate.disableRotation();

  const qa = qaWindowV152();
  if (qa) {
    qa.__cdpMiniMapV152 = map;
    qa.__cdpMiniMapStatsV152 = qa.__cdpMiniMapStatsV152 || { created: 0, removed: 0 };
    qa.__cdpMiniMapStatsV152.created += 1;
  }

  let rendered: MapLayerRenderResultV152 | null = null;
  let popup: Popup | null = null;
  let pinned = false;
  let backdropKind: MapBackdropKindV151 = input.backdropOn ? backdropKindWhenOnV152() : "none";
  let backdropController: AbortController | null = null;
  let destroyed = false;

  const closeCard = () => {
    if (input.cardHost) input.cardHost.replaceChildren();
  };
  const closePopup = () => {
    popup?.remove();
    popup = null;
    pinned = false;
    closeCard();
  };
  const showPopup = (feature: MapGeoJSONFeature, lngLat: maplibregl.LngLatLike, pin: boolean) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const entity = entityById.get(String(properties.recordId ?? ""));
    if (pin && input.cardHost) {
      // Full label-form card inside the map box, scrollable, with its own close button.
      popup?.remove();
      popup = null;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "minimap152__card-close";
      close.setAttribute("aria-label", "정보 닫기");
      close.textContent = "×";
      close.addEventListener("click", () => {
        closeCard();
        pinned = false;
      });
      const card = area ? areaPopupV152(layer, input.selected, properties) : createMapPointPopupV152({ layer, properties, primary: true, entity });
      input.cardHost.replaceChildren(close, card);
      pinned = true;
      return;
    }
    const content = area
      ? areaPopupV152(layer, input.selected, properties)
      : createMapPointPopupV152({ layer, properties, primary: true, entity, compact: true });
    popup?.remove();
    const at = feature.geometry.type === "Point" ? ((feature.geometry as GeoJSON.Point).coordinates as [number, number]) : lngLat;
    const width = Math.max(160, Math.min(220, input.container.clientWidth - 64));
    // Open towards the middle of the small map so the card is never cut at an edge.
    const point = map.project(at as maplibregl.LngLatLike);
    const anchor = `${point.y < input.container.clientHeight / 2 ? "top" : "bottom"}-${point.x < input.container.clientWidth / 2 ? "left" : "right"}` as maplibregl.PositionAnchor;
    popup = new maplibregl.Popup({ closeButton: pin, closeOnClick: false, offset: 10, maxWidth: `${width}px`, anchor })
      .setLngLat(at)
      .setDOMContent(content)
      .addTo(map);
    pinned = pin;
    if (pin) popup.on("close", () => { if (popup) { popup = null; pinned = false; } });
  };
  const select = (id: string | null) => {
    if (!rendered) return;
    for (const layerId of [rendered.ids.selection, rendered.ids.pointSelection]) {
      if (map.getLayer(layerId)) map.setFilter(layerId, ["==", ["get", "selectionKey"], id || "__none__"]);
    }
  };
  const setHover = (id: string | null) => {
    if (rendered && map.getLayer(rendered.ids.pointHover)) {
      map.setFilter(rendered.ids.pointHover, ["==", ["get", "selectionKey"], id || "__none__"]);
    }
  };
  const hitLayers = () =>
    rendered ? [...rendered.interactiveLayerIds, rendered.clusterLayerId].filter((id): id is string => Boolean(id && map.getLayer(id))) : [];

  const applyBackdrop = (kind: MapBackdropKindV151) => {
    backdropController?.abort();
    removeMapBackdropV151(map);
    backdropKind = kind;
    input.onBackdropCredit?.(BACKDROP_CREDIT_V152[kind]);
    if (kind === "none") return;
    const controller = new AbortController();
    backdropController = controller;
    let errors = 0;
    let firstTile = false;
    const fallBack = () => {
      if (firstTile || controller.signal.aborted) return;
      controller.abort();
      removeMapBackdropV151(map);
      backdropKind = "none";
      input.onBackdropCredit?.("");
      input.onBackdropFallback?.();
    };
    const timer = window.setTimeout(() => { if (errors >= 3) fallBack(); }, 5000);
    controller.signal.addEventListener("abort", () => window.clearTimeout(timer));
    void applyMapBackdropV151(map, kind, {
      boundarySystem: input.boundarySystem,
      signal: controller.signal,
      startedAt: performance.now(),
      onFirstTile: () => { firstTile = true; },
      onError: () => { errors += 1; if (errors >= 3) fallBack(); },
    }).catch(() => fallBack());
    // City labels belong to the streets backdrop there; ours otherwise.
    for (const id of ["cdp-ko-city-marker", "cdp-ko-city"]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", backdropOwnsCityLabelsV151(kind) ? "none" : "visible");
    }
  };

  // The camera of the initial fit, so a view the reader never changed is not handed on as a choice.
  let fitCamera: { lng: number; lat: number; zoom: number } | null = null;
  const publishCamera = () => {
    const center = map.getCenter();
    const camera = { lng: center.lng, lat: center.lat, zoom: map.getZoom(), bearing: 0 };
    const atFit = Boolean(
      fitCamera &&
        Math.abs(camera.zoom - fitCamera.zoom) < 0.02 &&
        Math.abs(camera.lng - fitCamera.lng) < 1e-3 &&
        Math.abs(camera.lat - fitCamera.lat) < 1e-3
    );
    input.onCamera(camera, atFit);
  };

  const onError = (event: any) => {
    // Backdrop sources are optional and handled above; nothing is logged.
    if (String(event?.sourceId || "").startsWith(BACKDROP_SOURCE_PREFIX_V151)) return;
    input.onRuntimeError?.(String(event?.error?.message || "map error").slice(0, 120));
  };
  const onClick = (event: maplibregl.MapMouseEvent) => {
    const layers = hitLayers();
    const feature = layers.length ? map.queryRenderedFeatures(event.point, { layers })[0] : undefined;
    if (!feature) {
      closePopup();
      select(null);
      input.onSelect(null);
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
    const id = featureIdV152(feature);
    select(id);
    showPopup(feature, event.lngLat, true);
    input.onSelect(id || null);
  };
  const onMove = (event: maplibregl.MapMouseEvent) => {
    const layers = hitLayers();
    const feature = layers.length ? map.queryRenderedFeatures(event.point, { layers })[0] : undefined;
    map.getCanvas().style.cursor = feature ? "pointer" : "";
    setHover(feature && !(feature.properties as Record<string, unknown> | null)?.cluster ? featureIdV152(feature) : null);
    if (pinned) return;
    if (!feature || (feature.properties as Record<string, unknown> | null)?.cluster) {
      closePopup();
      return;
    }
    showPopup(feature, event.lngLat, false);
  };
  const onLeave = () => {
    map.getCanvas().style.cursor = "";
    setHover(null);
    if (!pinned) closePopup();
  };

  map.on("error", onError);
  map.on("moveend", publishCamera);

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("mini map load timeout")), 15000);
    map.once("load", () => {
      window.clearTimeout(timeout);
      resolve();
    });
  }).catch((reason) => {
    map.remove();
    if (qa?.__cdpMiniMapStatsV152) qa.__cdpMiniMapStatsV152.removed += 1;
    throw reason;
  });

  applyBoundaryReferenceV152(map, countryIso3, reference);
  // The same glyphs as the big map; a missing one is drawn on first request.
  const iconMap = map as unknown as MaplibreMapLike;
  registerMapIcons(iconMap);
  const representative = mapLayerIconV152(layer.elementId);
  if (representative) registerMapIcons(iconMap, [representative], "white");
  attachMapIconMissingHandlerV152(iconMap);
  // Every site must be reachable within the mini map's zoom range (max 12).
  rendered = mountPreparedMapLayerV152(map, prepared, {
    icons: input.icons !== false,
    interactive: true,
    clusterMaxZoom: MINIMAP_CLUSTER_MAX_ZOOM_V152,
  });
  addKoreanMapLabelsV151(map, reference, { showCities: !backdropOwnsCityLabelsV151(backdropKind) });
  // Korean place names only from zoom 6, so the overview stays about the data.
  for (const id of KOREAN_LABEL_LAYER_IDS_V151) {
    if (map.getLayer(id)) map.setLayerZoomRange(id, 6, id === "cdp-ko-country" ? 7 : 24);
  }
  applyBackdrop(backdropKind);
  input.onLegend?.(legend);
  map.on("click", onClick);
  map.on("mousemove", onMove);
  map.getCanvasContainer().addEventListener("mouseleave", onLeave);
  if (input.camera) {
    const fit = map.cameraForBounds([[bounds.fit[0], bounds.fit[1]], [bounds.fit[2], bounds.fit[3]]], { padding: MINIMAP_FIT_PADDING_V152 });
    const fitCenter = fit?.center ? maplibregl.LngLat.convert(fit.center) : null;
    fitCamera = fit && fitCenter ? { lng: fitCenter.lng, lat: fitCenter.lat, zoom: Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), fit.zoom ?? 0)) } : null;
  } else {
    const center = map.getCenter();
    fitCamera = { lng: center.lng, lat: center.lat, zoom: map.getZoom() };
  }
  publishCamera();

  // Hand over from the static picture once the layer's own data is drawn, not
  // just the base map (a slow backdrop never holds it up).
  await new Promise<void>((resolve) => {
    const sourceId = rendered?.ids.source;
    let timer = 0;
    const finish = () => {
      window.clearTimeout(timer);
      map.off("sourcedata", onData);
      resolve();
    };
    const onData = (event: MapSourceDataEvent) => {
      if (event.sourceId === sourceId && map.isSourceLoaded(sourceId)) finish();
    };
    if (!sourceId || !map.getSource(sourceId) || map.isSourceLoaded(sourceId)) {
      resolve();
      return;
    }
    timer = window.setTimeout(finish, 2500);
    map.on("sourcedata", onData);
  });

  const fitTarget = bounds.fit;
  return {
    map,
    zoomBy: (delta) => map.easeTo({ zoom: map.getZoom() + delta, duration: 250 }),
    reset: () => {
      closePopup();
      map.fitBounds([[fitTarget[0], fitTarget[1]], [fitTarget[2], fitTarget[3]]], { padding: MINIMAP_FIT_PADDING_V152, duration: 250 });
    },
    setBackdropOn: (on) => applyBackdrop(on ? backdropKindWhenOnV152() : "none"),
    select,
    closePopup,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      backdropController?.abort();
      controller.abort();
      closePopup();
      map.getCanvasContainer().removeEventListener("mouseleave", onLeave);
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.off("moveend", publishCamera);
      map.off("error", onError);
      map.remove();
      if (qa) {
        if (qa.__cdpMiniMapV152 === map) qa.__cdpMiniMapV152 = null;
        if (qa.__cdpMiniMapStatsV152) qa.__cdpMiniMapStatsV152.removed += 1;
      }
    },
  };
}
