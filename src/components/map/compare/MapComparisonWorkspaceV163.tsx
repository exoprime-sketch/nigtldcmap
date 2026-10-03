/**
 * V163: "비교해서 보기" - two maps side by side, each with its own country,
 * data, indicator and period, its own legend and its own information.
 *
 * Benchmarks (Esri Instant Apps Compare, NASA Worldview, Sentinel EO Browser,
 * Foursquare dual maps, maplibre-gl-compare) agree on the pattern used here:
 * side-by-side panes as the default for two variables or two countries, each
 * pane a complete map (selectors, legend, information), the two cameras moving
 * together by default inside one country, a shared colour range when the same
 * quantity is compared, and stacked panes on a phone.
 *
 * Each pane loads its own data with the big map's loaders and draws it with
 * the big map's renderers (comparePaneDataV163 / comparePaneEngineV163); the
 * rules - fallbacks, statistics, ranks, sync - live in compareModelV163.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../../data/countries/countryDataTypesV122";
import { publicCountryDataErrorMessageV122 } from "../../../data/countries/countryDataFacadeV122";
import { getCountryDataProviderV122 } from "../../../data/countries/countryDataProviderRegistryV122";
import { countryLevel1V158 } from "../../../data/countries/countryLevel1V158";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../../../data/countryContext";
import type { BoundarySystemV151 } from "../../../data/map/adminBoundaryV151";
import { policyKindForVariableV151 } from "../../../data/map/boundaryPolicyV151";
import { MAP_ICON_LAYER_IDS_V152, mapIconLegendEntriesV152 } from "../../../data/map/mapIconsV152";
import {
  DRAWING_LABEL_V161,
  formatRegionListV161,
  metaLineV161,
  rankLinesV161,
  selectionLineV161,
  type MapSelectionCardV161,
  type MapSelectionLineV161,
} from "../../../data/map/mapSelectionModelV161";
import { getPublicIndicatorVariablePresentationV129 } from "../../../data/interpretation/publicIndicatorInterpretationV129";
import { publicSourceOrganizationV136_1, publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { publicMapLayerTitleV126 } from "../../../data/visualization/publicMapWorkspaceV126";
import { powerPlantPeriodForSourceV142 } from "../../../data/visualization/mapSelectorBindingsV125";
import {
  LAYER_COLORS,
  prepareMapLayerV152,
  rendererOf,
  selectedFilterValueV141,
  TRANSMISSION_VOLTAGE_CLASSES_V152,
  type MapLayerPreparedV152,
} from "../../../map/layers";
import { choroplethFillColorV152 } from "../../../map/layers/choroplethLayer";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import MapIconLegendV152 from "../MapIconLegendV152";
import { createMapPointPopupV152 } from "../mapPointPopupV152";
import { boundaryPopupLineV151, createPublicMapPopupContentV129 } from "../mapPublicPopupV129";
import SelectionPanelV161 from "../SelectionPanelV161";
import {
  categoryCountsV163,
  featureBboxV163,
  filtersForSelectorV163,
  linkedRegionsV163,
  panesEqualV163,
  paneFitBboxV163,
  periodsForVariableV163,
  rankAmongV163,
  regionSummaryV163,
  regionValuesV163,
  resolveLayerForCountryV163,
  resolveSelectorV163,
  sameQuantityV163,
  sharedDomainV163,
  domainsEqualV163,
  sortByTitleV163,
  swapPanesV163,
  syncDefaultV163,
  type BboxV163,
  type ComparePaneSelectionV163,
  type ComparePanesV163,
  type CompareSideV163,
  type ValueDomainV163,
} from "./compareModelV163";
import {
  loadCompareMapIndexV163,
  loadComparePaneDataV163,
  paneBoundarySystemV163,
  type ComparePaneDataV163,
} from "./comparePaneDataV163";
import { createComparePaneEngineV163, type ComparePaneEngineV163 } from "./comparePaneEngineV163";
import "../../../styles/map-comparison-v163.css";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";

export interface CompareCountryOptionV163 {
  iso3: string;
  nameKo: string;
}

export interface MapComparisonWorkspaceV163Props {
  initialPanes: ComparePanesV163;
  countries: readonly CompareCountryOptionV163[];
  /** The big map's province outline (Viet Nam 34 or 63); a layer may declare its own. */
  boundarySystem: BoundarySystemV151;
  onClose: (panes: ComparePanesV163) => void;
  onStateChange: (panes: ComparePanesV163) => void;
}

interface PaneMetaV163 {
  renderer: string | null;
  elementId: string;
  variable: string;
  unit: string;
  domain: ValueDomainV163 | null;
}

const SIDE_LABEL_V163: Record<CompareSideV163, string> = { a: "A", b: "B" };
const SIDE_POSITION_V163: Record<CompareSideV163, string> = { a: "왼쪽", b: "오른쪽" };
const RAMP_START_V163 = "#e6f2ea";

function indexOfSideV163(side: CompareSideV163): 0 | 1 {
  return side === "a" ? 0 : 1;
}

function countryBboxV163(iso3: string): BboxV163 | null {
  const bounds = getCountryDataProviderV122(iso3)?.mapView.bounds;
  return bounds ? [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]] : null;
}

function layerTitleV163(layer: CountryMapLayerV122, iso3: string): string {
  return publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle, iso3);
}

/** The particle after a word: "을" after a final consonant, "를" otherwise (Latin: "을(를)"). */
function objectParticleV163(word: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "를" : "을";
  return "을(를)";
}

/* ------------------------------------------------------------------ data hooks */

type LoadStateV163<T> =
  | { status: "loading"; key: string }
  | { status: "ready"; key: string; value: T }
  | { status: "error"; key: string; message: string };

function useCompareIndexV163(iso3: string, nonce: number): LoadStateV163<CountryMapLayerV122[]> {
  const key = `${iso3}:${nonce}`;
  const [state, setState] = useState<LoadStateV163<CountryMapLayerV122[]>>({ status: "loading", key });
  useEffect(() => {
    let alive = true;
    setState({ status: "loading", key });
    loadCompareMapIndexV163(iso3)
      .then((layers) => {
        if (alive) setState({ status: "ready", key, value: layers });
      })
      .catch((reason: unknown) => {
        if (alive) {
          setState({
            status: "error",
            key,
            message: publicCountryDataErrorMessageV122(reason, "지도 데이터 목록을 불러오지 못했습니다"),
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [iso3, key]);
  return state.key === key ? state : { status: "loading", key };
}

function useComparePaneDataV163(
  iso3: string,
  layer: CountryMapLayerV122 | null,
  boundarySystem: BoundarySystemV151,
  nonce: number
): LoadStateV163<ComparePaneDataV163> | null {
  const key = layer ? `${iso3}:${layer.elementId}:${boundarySystem}:${nonce}` : "";
  const [state, setState] = useState<LoadStateV163<ComparePaneDataV163> | null>(null);
  useEffect(() => {
    if (!layer) {
      setState(null);
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading", key });
    loadComparePaneDataV163({ iso3, layer, boundarySystem, signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setState({ status: "ready", key, value });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || (reason instanceof DOMException && reason.name === "AbortError")) return;
        setState({
          status: "error",
          key,
          message: publicCountryDataErrorMessageV122(reason, "선택한 지도 데이터를 불러오지 못했습니다"),
        });
      });
    return () => controller.abort();
    // `layer` is identified by its element id inside `key`.
  }, [key]);
  if (!layer) return null;
  return state && state.key === key ? state : { status: "loading", key };
}

/* ------------------------------------------------------------------ presentation */

interface PanePresentationV163 {
  title: string;
  measureLabel: string;
  unit: string;
  period: string;
  readingNote: string;
  source: string;
  spatialUnit: string;
  unitWord: string;
  groupConstant: boolean;
}

function sourceLineV163(layer: CountryMapLayerV122): string {
  const named = Array.from(
    new Set(
      [layer.source, ...(((layer as { sourceOrganizations?: string[] }).sourceOrganizations) || [])]
        .map((value) => publicSourceOrganizationV136_1(value))
        .filter((value): value is string => Boolean(value))
    )
  );
  return named.slice(0, 2).join(" · ") || "출처 미표기";
}

function presentationV163(
  iso3: string,
  countryName: string,
  layer: CountryMapLayerV122,
  selector: { variable: string; period: string },
  filters: Record<string, string>,
  prepared: MapLayerPreparedV152 | null
): PanePresentationV163 {
  const renderer = rendererOf(layer);
  const option = layer.selectors.variables.find((row) => row.key === selector.variable);
  // The reviewed wording describes the default country's variables; another
  // country's layer reads its own variable label and unit.
  const reviewed = iso3 === DEFAULT_COUNTRY_ISO3_V158 ? getPublicIndicatorVariablePresentationV129(layer.elementId, selector.variable) : null;
  const firstValueUnit = prepared?.data.features.find((feature) => feature.properties?.hasValue)?.properties?.unit;
  // Units read with the same display spelling as the detail page (displayUnitV150).
  const unit = displayUnitV150(reviewed?.unit || publicTextV126(option?.unit) || publicTextV126(firstValueUnit) || publicTextV126(layer.unit) || "");
  const measureLabel =
    reviewed?.label || publicTextV126(option?.label) || publicTextV126(layer.legend?.title) || layerTitleV163(layer, iso3);
  const level1 = countryLevel1V158(iso3);
  const mode = prepared?.kind === "area" ? prepared.area.choropleth?.mode : undefined;
  let unitWord = level1?.label || "지역";
  let spatialUnit = "";
  if (renderer === "unit-choropleth") {
    unitWord = "평가구역";
    spatialUnit = `평가구역 ${prepared?.data.features.length ? `${prepared.data.features.length.toLocaleString()}개` : ""}`.trim();
  } else if (renderer === "admin1-choropleth" || renderer === "partial-choropleth") {
    if (iso3 === DEFAULT_COUNTRY_ISO3_V158) {
      unitWord = mode === "region-6" ? "권역" : "성·시";
      spatialUnit =
        mode === "region-6"
          ? `${countryName} 6대 사회경제 권역`
          : mode === "34"
            ? `${countryName} 성·시 34개(2025-07-01 시행)`
            : `${countryName} 성·시 63개(개편 전)`;
    } else {
      spatialUnit = `${countryName} ${level1?.label || "1급 행정구역"}${level1?.count ? ` ${level1.count}개` : ""}`;
    }
  } else if (renderer === "line") {
    spatialUnit = "선형 구간(송전선 등)";
  } else if (renderer === "regional-scope") {
    spatialUnit = "사업 참여국 범위와 세부 활동지역";
  } else {
    spatialUnit = "시설·지점 위치";
  }
  const sourceYear = publicTextV126(layer.sourceYear);
  // A layer drawn from two registries (Viet Nam's power plants) states the
  // year of the registry shown, as the big map does (V142).
  const registryFilter = layer.filters.find((filter) => filter.field === "sourceKey");
  const period = registryFilter
    ? powerPlantPeriodForSourceV142(selectedFilterValueV141(layer, registryFilter, filters))
    : selector.period && selector.period !== "미표기"
      ? selector.period
      : sourceYear || "";
  return {
    title: layerTitleV163(layer, iso3),
    measureLabel,
    unit,
    period,
    readingNote: reviewed?.directionLabel || reviewed?.aggregationNotice || "",
    source: sourceLineV163(layer),
    spatialUnit,
    unitWord,
    groupConstant: policyKindForVariableV151(layer.boundaryPolicy, selector.variable) === "group-constant",
  };
}

function regionNameV163(iso3: string, properties: Record<string, unknown>): string {
  if (iso3 === DEFAULT_COUNTRY_ISO3_V158) {
    const raw = String(properties.adm1Name || properties.name || "");
    return (
      formatRegionListV161(raw, {
        country: iso3,
        level: properties.boundarySystem === "post-2025-34" ? "adm1-34" : "adm1-63",
      }) ||
      publicTextV126(raw) ||
      "지역"
    );
  }
  const ko = publicTextV126(properties.nameKo);
  const local = publicTextV126(properties.nameEn) || publicTextV126(properties.adm1Name);
  if (ko) return local && local !== ko ? `${ko} (${local})` : ko;
  return formatRegionListV161(properties.adm1Name, { country: iso3 }) || publicTextV126(properties.adm1Name) || "지역";
}

function valueTextV163(value: unknown, unit: string): string {
  if (value === null || value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return "";
  return `${formatPublicNumberV126(number, unit)}${unit ? ` ${unit}` : ""}`;
}

/* ------------------------------------------------------------------ pane */

interface ComparePaneV163Props {
  side: CompareSideV163;
  selection: ComparePaneSelectionV163;
  countries: readonly CompareCountryOptionV163[];
  boundarySystem: BoundarySystemV151;
  notice: string;
  countryPending: string | null;
  domainOverride: ValueDomainV163 | null;
  selectedKey: string | null;
  selectedFromOther: boolean;
  hoverKey: string | null;
  onCountry: (side: CompareSideV163, iso3: string) => void;
  onElement: (side: CompareSideV163, elementId: string) => void;
  onVariable: (side: CompareSideV163, variable: string) => void;
  onPeriod: (side: CompareSideV163, period: string) => void;
  onSelect: (side: CompareSideV163, key: string | null) => void;
  onHover: (side: CompareSideV163, key: string | null) => void;
  onMeta: (side: CompareSideV163, meta: PaneMetaV163 | null) => void;
  onMap: (side: CompareSideV163, map: MapLibreMap | null) => void;
  onMove: (side: CompareSideV163, map: MapLibreMap) => void;
}

function ComparePaneV163({
  side,
  selection,
  countries,
  boundarySystem,
  notice,
  countryPending,
  domainOverride,
  selectedKey,
  selectedFromOther,
  hoverKey,
  onCountry,
  onElement,
  onVariable,
  onPeriod,
  onSelect,
  onHover,
  onMeta,
  onMap,
  onMove,
}: ComparePaneV163Props) {
  const label = SIDE_LABEL_V163[side];
  const iso3 = selection.country;
  const countryName = countries.find((row) => row.iso3 === iso3)?.nameKo || getCountryDataProviderV122(iso3)?.countryNameKo || iso3;
  const [dismissedNotice, setDismissedNotice] = useState("");
  const [indexNonce, setIndexNonce] = useState(0);
  const [dataNonce, setDataNonce] = useState(0);
  const [engineNonce, setEngineNonce] = useState(0);
  const index = useCompareIndexV163(iso3, indexNonce);
  const indexLayers = index.status === "ready" ? index.value : null;
  const layers = useMemo(() => indexLayers || [], [indexLayers]);
  const layer = layers.find((row) => row.elementId === selection.elementId && row.enabled !== false) || null;
  const options = useMemo(
    () =>
      sortByTitleV163(
        layers.filter((row) => row.enabled !== false).map((row) => ({ elementId: row.elementId, title: layerTitleV163(row, iso3) }))
      ),
    [iso3, layers]
  );
  const paneSystem = layer ? paneBoundarySystemV163(iso3, layer, boundarySystem) : boundarySystem;
  const data = useComparePaneDataV163(iso3, layer, paneSystem, dataNonce);
  const selector = useMemo(
    () => (layer ? resolveSelectorV163(layer, selection.variable, selection.period) : null),
    [layer, selection.period, selection.variable]
  );
  const filters = useMemo(() => (layer && selector ? filtersForSelectorV163(layer, selector.variable) : {}), [layer, selector]);
  const loaded = data?.status === "ready" ? data.value : null;
  const prepared = useMemo((): MapLayerPreparedV152 | null => {
    if (!layer || !selector || !loaded) return null;
    try {
      return prepareMapLayerV152(
        {
          countryIso3: iso3,
          layer,
          role: "primary",
          selected: selector,
          filters,
          boundary: loaded.boundary,
          spatial: loaded.spatial,
          records: loaded.records,
          locations: loaded.locations,
        },
        { icons: true }
      );
    } catch {
      return null;
    }
  }, [filters, iso3, layer, loaded, selector]);
  const renderer = layer ? rendererOf(layer) : null;
  const naturalDomain = useMemo((): ValueDomainV163 | null => {
    if (!prepared || prepared.kind !== "area") return null;
    const { choropleth, isRegionalScope, categories } = prepared.area;
    if (!choropleth || isRegionalScope || categories.length) return null;
    const values = regionValuesV163(prepared.data.features, () => "");
    return values.length ? { minimum: choropleth.minimum, maximum: choropleth.maximum } : null;
  }, [prepared]);
  // The same colour range as the other pane, when the reader asked for it.
  const displayed = useMemo((): MapLayerPreparedV152 | null => {
    if (!prepared || prepared.kind !== "area" || !domainOverride || !naturalDomain || !prepared.area.choropleth) return prepared;
    const choropleth = { ...prepared.area.choropleth, minimum: domainOverride.minimum, maximum: domainOverride.maximum };
    return {
      ...prepared,
      area: { ...prepared.area, choropleth, fillColor: choroplethFillColorV152(prepared.color, choropleth, false) },
    };
  }, [domainOverride, naturalDomain, prepared]);
  const presentation = useMemo(
    () => (layer && selector ? presentationV163(iso3, countryName, layer, selector, filters, prepared) : null),
    [countryName, filters, iso3, layer, prepared, selector]
  );

  // Report what the pane draws, for the workspace's cross-pane rules.
  useEffect(() => {
    onMeta(
      side,
      layer && selector
        ? { renderer, elementId: layer.elementId, variable: selector.variable, unit: presentation?.unit || "", domain: naturalDomain }
        : null
    );
  }, [layer, naturalDomain, onMeta, presentation?.unit, renderer, selector, side]);

  /* ---- the map ---- */
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ComparePaneEngineV163 | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState("");
  const [drawnCount, setDrawnCount] = useState<number | null>(null);
  const handlersRef = useRef({ onSelect, onHover, onMove, side });
  handlersRef.current = { onSelect, onHover, onMove, side };
  const popupRef = useRef<(properties: Record<string, unknown>, compact: boolean) => HTMLElement | null>(() => null);
  const fittedCountryRef = useRef<string>("");
  const fitTargetRef = useRef<BboxV163 | null>(null);
  const fitWidthRef = useRef(0);
  // A pane that changes size a lot (desktop <-> stacked phone layout) opens
  // its country again at the new size rather than keeping a cropped view.
  useEffect(() => {
    const container = canvasRef.current;
    if (!container || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      const previous = fitWidthRef.current;
      if (!previous || !fitTargetRef.current || !engineRef.current) return;
      if (Math.abs(width - previous) / previous < 0.25) return;
      fitWidthRef.current = width;
      engineRef.current.resize();
      engineRef.current.fitTo(fitTargetRef.current);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const initialBboxRef = useRef<BboxV163 | null>(countryBboxV163(iso3));

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return undefined;
    let alive = true;
    let created: ComparePaneEngineV163 | null = null;
    setEngineError("");
    setEngineReady(false);
    createComparePaneEngineV163({
      side,
      container,
      bbox: initialBboxRef.current,
      onClick: (properties) => {
        const key = properties ? String(properties.selectionKey ?? "") || null : null;
        handlersRef.current.onSelect(handlersRef.current.side, key);
      },
      onHover: (properties) => {
        const key = properties ? String(properties.selectionKey ?? "") || null : null;
        handlersRef.current.onHover(handlersRef.current.side, key);
      },
      onMove: (map) => handlersRef.current.onMove(handlersRef.current.side, map),
      onRuntimeError: (message) => {
        if (alive) setEngineError(message || "지도를 표시하지 못했습니다");
      },
    })
      .then((engine) => {
        if (!alive) {
          engine.destroy();
          return;
        }
        created = engine;
        engineRef.current = engine;
        fittedCountryRef.current = "";
        setEngineReady(true);
        onMap(side, engine.map);
      })
      .catch(() => {
        if (alive) setEngineError("지도를 표시하지 못했습니다");
      });
    return () => {
      alive = false;
      onMap(side, null);
      engineRef.current = null;
      created?.destroy();
    };
    // The engine is created once per pane (and again on 다시 시도).
  }, [engineNonce, side]);

  const entityById = useMemo(
    () => new Map<string, CountryEntityV122>((loaded?.records || []).map((record) => [record.recordId, record])),
    [loaded]
  );

  popupRef.current = (properties, compact) => {
    if (!layer || !presentation) return null;
    const kind = rendererOf(layer);
    if (kind === "point" || kind === "cluster") {
      return createMapPointPopupV152({
        layer,
        properties,
        primary: true,
        entity: entityById.get(String(properties.recordId ?? "")),
        compact,
      });
    }
    if (kind === "line") {
      const length = properties.lengthKm ?? properties.length;
      return createPublicMapPopupContentV129(presentation.title, [
        `${properties.voltageKv || properties.voltage || ""} kV · ${
          valueTextV163(length, "km") || "길이 미표기"
        }`,
      ]);
    }
    if (kind === "regional-scope") {
      return createPublicMapPopupContentV129(
        publicTextV126(properties.projectTitle || properties.name) || "지역 협력사업",
        [publicTextV126(properties.activitySiteLabel || properties.participatingCountries) || "참여국 범위"]
      );
    }
    if (kind === "point-and-polygon") {
      return createPublicMapPopupContentV129(
        publicTextV126(properties.name || properties.adm1Name) || presentation.title,
        [publicTextV126(properties.categoryLabel) || presentation.title]
      );
    }
    const unit = presentation.unit || String(properties.unit || "");
    const value = properties.hasValue === false ? "자료 없음" : valueTextV163(properties.value, unit) || "자료 없음";
    return createPublicMapPopupContentV129(
      kind === "unit-choropleth" ? publicTextV126(properties.unitLabel || properties.name || properties.adm1Name) || "평가구역" : regionNameV163(iso3, properties),
      [
        `${presentation.measureLabel} ${value}`,
        publicTextV126(properties.categoryLabel) || "",
        String(properties.period || presentation.period || ""),
        iso3 === DEFAULT_COUNTRY_ISO3_V158 ? boundaryPopupLineV151(properties, unit) : "",
      ]
    );
  };

  // Draw (or redraw) the layer; fit only when the pane's country changed.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engineReady || !engine) return;
    if (!displayed || !loaded) {
      engine.clear();
      setDrawnCount(null);
      return;
    }
    try {
      engine.show({
        iso3,
        prepared: displayed,
        reference: loaded.reference,
        popupFor: (properties, compact) => popupRef.current(properties, compact),
      });
      setEngineError("");
    } catch (reason) {
      setEngineError(reason instanceof Error ? reason.message : "지도를 표시하지 못했습니다");
      return;
    }
    if (fittedCountryRef.current !== iso3) {
      fittedCountryRef.current = iso3;
      const target = paneFitBboxV163(countryBboxV163(iso3), featureBboxV163(displayed.data.features as never));
      fitTargetRef.current = target;
      fitWidthRef.current = canvasRef.current?.clientWidth || 0;
      if (target) engine.fitTo(target);
    }
    setDrawnCount(displayed.data.features.length);
  }, [displayed, engineReady, iso3, loaded]);

  useEffect(() => {
    if (engineReady) engineRef.current?.setSelected(selectedKey);
  }, [displayed, engineReady, selectedKey]);
  useEffect(() => {
    if (engineReady) engineRef.current?.setHover(hoverKey);
  }, [displayed, engineReady, hoverKey]);

  /* ---- information ---- */
  const features = useMemo(
    () => (prepared?.data.features || []) as Array<GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>>,
    [prepared]
  );
  const isArea = prepared?.kind === "area";
  const hasRamp = Boolean(naturalDomain);
  const regionValues = useMemo(
    () => (hasRamp ? regionValuesV163(features, (properties) => (renderer === "unit-choropleth" ? publicTextV126(properties.unitLabel || properties.name || properties.adm1Name) || "평가구역" : regionNameV163(iso3, properties))) : []),
    [features, hasRamp, iso3, renderer]
  );
  const iconLegend = useMemo(() => {
    if (!layer || !prepared || prepared.kind !== "point") return [];
    if (!(MAP_ICON_LAYER_IDS_V152 as readonly string[]).includes(layer.elementId)) return [];
    return mapIconLegendEntriesV152(
      layer.elementId,
      prepared.data.features.map((feature) => (feature.properties || {}) as Record<string, unknown>),
      prepared.color,
      presentation?.title || ""
    );
  }, [layer, prepared, presentation?.title]);

  const summaryRows = useMemo((): Array<{ label: string; value: string }> => {
    if (!layer || !prepared || !presentation) return [];
    const rows: Array<{ label: string; value: string }> = [];
    const unit = presentation.unit;
    const kind = rendererOf(layer);
    if (hasRamp) {
      const summary = regionSummaryV163(regionValues, features.length);
      rows.push({ label: "값 있는 지역", value: `${summary.count.toLocaleString()} / ${summary.total.toLocaleString()}개 ${presentation.unitWord}` });
      if (summary.maximum) rows.push({ label: "최댓값", value: `${valueTextV163(summary.maximum.value, unit)} · ${summary.maximum.name}` });
      if (summary.minimum) rows.push({ label: "최솟값", value: `${valueTextV163(summary.minimum.value, unit)} · ${summary.minimum.name}` });
      if (summary.median !== null) rows.push({ label: "중앙값(파생)", value: valueTextV163(summary.median, unit) });
      if (summary.total > summary.count) {
        rows.push({ label: "자료 없음", value: `${(summary.total - summary.count).toLocaleString()}개 ${presentation.unitWord} · 0으로 대체하지 않음` });
      }
      if (presentation.groupConstant) rows.push({ label: "값의 단위", value: "그룹 전체 값 · 지역마다 다른 값이 아님" });
      return rows;
    }
    if (kind === "regional-scope") {
      const projects = new Set(features.map((feature) => String(feature.properties?.recordId || feature.id || "")));
      rows.push({ label: "지역 협력사업", value: `${projects.size.toLocaleString()}건` });
      rows.push({ label: "참여국 범위", value: `${features.filter((feature) => feature.properties?.geometryRole === "regional-scope").length.toLocaleString()}개` });
      rows.push({ label: "세부 활동지역", value: `${features.filter((feature) => feature.properties?.geometryRole === "activity-site").length.toLocaleString()}곳` });
      return rows;
    }
    if (kind === "line") {
      rows.push({ label: "표시 구간", value: `${features.length.toLocaleString()}개` });
      categoryCountsV163(features.map((feature) => {
        const kv = feature.properties?.voltageKv || feature.properties?.voltage;
        return kv ? `${kv} kV` : "";
      })).forEach((row) => rows.push({ label: row.label, value: `${row.count.toLocaleString()}개 구간` }));
      return rows;
    }
    const noun = layer.countNoun || "곳";
    const regionMap = kind === "admin1-choropleth" || kind === "partial-choropleth" || kind === "unit-choropleth";
    rows.push({
      label: regionMap ? `표시한 ${presentation.unitWord}` : "표시 대상",
      value: `${features.length.toLocaleString()}${kind === "point" || kind === "cluster" ? noun : "개"}`,
    });
    const breakdown = iconLegend.length
      ? iconLegend.map((entry) => ({ label: entry.label, count: entry.count }))
      : isArea && prepared.kind === "area" && prepared.area.categories.length
        ? prepared.area.categories.map((entry) => ({ label: entry.text || entry.label, count: entry.featureCount }))
        : categoryCountsV163(features.map((feature) => String(feature.properties?.categoryLabel || feature.properties?.kindLabel || "")));
    breakdown.slice(0, 8).forEach((row) => rows.push({ label: row.label, value: `${row.count.toLocaleString()}개` }));
    if (breakdown.length > 8) rows.push({ label: "그 밖의 분류", value: `${(breakdown.length - 8).toLocaleString()}개 분류` });
    return rows;
  }, [features, hasRamp, iconLegend, isArea, layer, prepared, presentation, regionValues]);

  const selectedFeature = useMemo(
    () => (selectedKey ? features.find((feature) => String(feature.properties?.selectionKey ?? "") === selectedKey) || null : null),
    [features, selectedKey]
  );

  const card = useMemo((): MapSelectionCardV161 | null => {
    if (!selectedKey || !layer || !presentation || !prepared) return null;
    const kind = rendererOf(layer);
    if (kind === "point" || kind === "cluster") return null;
    const detail = { key: "detail" as const, label: "데이터 상세보기", href: `/?view=data&country=${iso3}&element=${layer.elementId}#element-detail` };
    const meta = metaLineV161({
      period: presentation.period,
      source: presentation.source,
      drawing: (DRAWING_LABEL_V161[kind] || "").replace("성·시", presentation.unitWord),
    });
    if (!selectedFeature) {
      return {
        kind: "region",
        title: "같은 지역의 값 없음",
        subtitle: presentation.title,
        lines: [{ label: "안내", value: `${SIDE_POSITION_V163[side === "a" ? "b" : "a"]} 지도에서 고른 지역이 이 지도에는 없습니다.` }],
        comparison: [],
        actions: [],
        meta,
      };
    }
    const properties = (selectedFeature.properties || {}) as Record<string, unknown>;
    const unit = presentation.unit || String(properties.unit || "");
    const actions = [{ key: "zoom" as const, label: "이 위치로 확대" }, detail];
    if (hasRamp || kind === "admin1-choropleth" || kind === "partial-choropleth" || kind === "unit-choropleth") {
      const isUnit = kind === "unit-choropleth";
      const title = isUnit ? publicTextV126(properties.unitLabel || properties.name || properties.adm1Name) || "평가구역" : regionNameV163(iso3, properties);
      const value = properties.hasValue === false ? null : Number(properties.value);
      const lines: MapSelectionLineV161[] = [
        { label: presentation.measureLabel, value: valueTextV163(value, unit) || "자료 없음" },
        ...selectionLineV161("분류", publicTextV126(properties.categoryLabel)),
        ...selectionLineV161("기준 시점", presentation.period),
      ];
      if (presentation.groupConstant) {
        lines.push(...selectionLineV161("자료 설명", "소속 그룹 전체에 적용되는 값이며, 지역마다 다른 값이 아닙니다."));
      } else if (iso3 === DEFAULT_COUNTRY_ISO3_V158 && properties.boundarySystem === "gdl-six-region") {
        lines.push(...selectionLineV161("자료 설명", "권역 전체의 값이며 성·시별로 추정한 값이 아닙니다."));
      }
      const comparison: MapSelectionLineV161[] = [];
      if (!presentation.groupConstant && value !== null && Number.isFinite(value)) {
        const rank = rankAmongV163(value, regionValues.map((row) => row.value));
        if (rank) {
          comparison.push({ label: "순위(값이 큰 순)", value: `${rank.of.toLocaleString()}개 ${presentation.unitWord} 중 ${rank.rank}위` });
          const versusAverage = rankLinesV161({ value, peers: regionValues.map((row) => row.value), unit, peerLabel: presentation.unitWord })[1];
          if (versusAverage) comparison.push(versusAverage);
        }
      }
      return {
        kind: isUnit ? "unit" : "region",
        title,
        subtitle: `${presentation.title} · ${isUnit ? "평가구역" : presentation.unitWord}`,
        lines,
        comparison,
        actions,
        meta,
      };
    }
    // Lines, sites with polygons, regional projects: the feature's own facts.
    const lines: MapSelectionLineV161[] = [
      ...selectionLineV161("분류", publicTextV126(properties.categoryLabel || properties.kindLabel)),
      ...selectionLineV161("전압", properties.voltageKv ? `${properties.voltageKv} kV` : ""),
      ...selectionLineV161("구간 길이", valueTextV163(properties.lengthKm, "km")),
      ...selectionLineV161("운영 상태", publicTextV126(properties.status)),
      ...selectionLineV161("면적", valueTextV163(properties.areaKm2, "km²")),
      ...selectionLineV161("참여국", publicTextV126(properties.participatingCountries)),
      ...selectionLineV161("세부 활동지역", publicTextV126(properties.activitySiteLabel)),
    ];
    ((layer as { cardFactFields?: Array<{ key: string; label: string; unit?: string }> }).cardFactFields || []).forEach((field) => {
      const raw = properties[field.key];
      const text = raw === null || raw === undefined || raw === "" ? "" : `${raw}${field.unit ? ` ${field.unit}` : ""}`;
      lines.push(...selectionLineV161(field.label, publicTextV126(text)));
    });
    return {
      kind: kind === "line" ? "line" : kind === "regional-scope" ? "project-scope" : "asset-feature",
      title:
        publicTextV126(kind === "regional-scope" ? properties.projectTitle || properties.name : properties.name || properties.unitLabel) ||
        (kind === "line"
          ? `${properties.voltageKv || properties.voltage ? `${properties.voltageKv || properties.voltage} kV ` : ""}송전선 구간`
          : publicTextV126(properties.adm1Name) || "선택 항목"),
      subtitle: presentation.title,
      lines,
      comparison: [],
      actions,
      meta,
    };
  }, [hasRamp, iso3, layer, prepared, presentation, regionValues, selectedFeature, selectedKey, side]);

  // A site's card is the big map's own label-form card.
  const pointCardRef = useRef<HTMLDivElement | null>(null);
  const pointCardShown = Boolean(selectedKey && selectedFeature && layer && (rendererOf(layer) === "point" || rendererOf(layer) === "cluster"));
  useEffect(() => {
    const host = pointCardRef.current;
    if (!host) return;
    if (!pointCardShown || !layer || !selectedFeature) {
      host.replaceChildren();
      return;
    }
    const properties = (selectedFeature.properties || {}) as Record<string, unknown>;
    host.replaceChildren(
      createMapPointPopupV152({ layer, properties, primary: true, entity: entityById.get(String(properties.recordId ?? "")) })
    );
  }, [entityById, layer, pointCardShown, selectedFeature]);

  const zoomToSelection = useCallback(() => {
    if (!selectedFeature || !engineRef.current) return;
    const bbox = featureBboxV163([selectedFeature as never]);
    if (!bbox) return;
    const pad = 0.05;
    engineRef.current.fitTo([bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad], true);
  }, [selectedFeature]);

  /* ---- status ---- */
  let status: { kind: "loading" | "error" | "empty" | "ready"; message: string; retry?: () => void } = { kind: "ready", message: "" };
  if (index.status === "loading" || countryPending) status = { kind: "loading", message: "지도 데이터 목록을 불러오는 중입니다" };
  else if (index.status === "error") status = { kind: "error", message: index.message, retry: () => setIndexNonce((value) => value + 1) };
  else if (!layer) status = { kind: "empty", message: `${countryName}에는 이 데이터의 지도가 없습니다. 위에서 다른 데이터를 고르세요.` };
  else if (!data || data.status === "loading") status = { kind: "loading", message: "선택한 지도 데이터를 불러오는 중입니다" };
  else if (data.status === "error") status = { kind: "error", message: data.message, retry: () => setDataNonce((value) => value + 1) };
  else if (!prepared) status = { kind: "empty", message: "이 데이터는 지도에 표시할 위치자료가 없습니다" };
  else if (engineError) status = { kind: "error", message: "지도를 표시하지 못했습니다", retry: () => setEngineNonce((value) => value + 1) };
  else if (!engineReady) status = { kind: "loading", message: "지도를 준비하는 중입니다" };
  const ready = status.kind === "ready";
  const variables = layer?.selectors.variables || [];
  const periods = layer && selector ? periodsForVariableV163(layer, selector.variable) : [];
  const variableLabel = (key: string, fallback?: string) =>
    (iso3 === DEFAULT_COUNTRY_ISO3_V158 && layer ? getPublicIndicatorVariablePresentationV129(layer.elementId, key)?.label : null) ||
    publicTextV126(fallback) ||
    key;
  const missingCount = hasRamp ? features.filter((feature) => feature.properties?.hasValue === false).length : 0;

  return (
    <section
      className="cmp163-pane"
      aria-label={`비교 지도 ${label}`}
      data-testid={`map-compare-pane-${side}`}
      data-element-id={selection.elementId}
      data-country={iso3}
      data-renderer={renderer || "none"}
      data-map-ready={ready ? "true" : "false"}
      data-status={status.kind}
      data-feature-count={drawnCount ?? 0}
      data-runtime-error={engineError ? "true" : "none"}
    >
      <header className="cmp163-pane__controls">
        <div className="cmp163-pane__row">
          <span className="cmp163-pane__badge" aria-hidden="true">
            {label}
          </span>
          <label className="cmp163-field cmp163-field--data">
            <span>데이터</span>
            <select
              aria-label={`데이터 ${label} 선택`}
              value={layer ? selection.elementId : ""}
              disabled={!options.length}
              onChange={(event) => onElement(side, event.target.value)}
            >
              {!layer && <option value="">{options.length ? "데이터를 고르세요" : "불러오는 중"}</option>}
              {options.map((option) => (
                <option key={option.elementId} value={option.elementId}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
          <div
            className="cmp163-countries"
            role="radiogroup"
            aria-label={`데이터 ${label} 국가 선택`}
            data-country-picker="true"
            data-testid={`map-compare-country-${side}`}
          >
            {countries.map((country) => (
              <button
                key={country.iso3}
                type="button"
                role="radio"
                aria-checked={country.iso3 === iso3}
                aria-busy={countryPending === country.iso3 ? true : undefined}
                className={country.iso3 === iso3 ? "is-active" : ""}
                data-country={country.iso3}
                onClick={() => onCountry(side, country.iso3)}
              >
                {country.nameKo}
              </button>
            ))}
          </div>
        </div>
        {/* Always two rows, so the two maps start at the same height. A value
            the layer fixes is stated where its selector would be. */}
        <div className="cmp163-pane__row cmp163-pane__row--selectors">
            {layer && selector && variables.length > 1 ? (
              <label className="cmp163-field cmp163-field--variable">
                <span>지표</span>
                <select
                  aria-label={`데이터 ${label} 지표`}
                  value={selector.variable}
                  onChange={(event) => onVariable(side, event.target.value)}
                >
                  {variables.map((option) => (
                    <option key={option.key} value={option.key}>
                      {variableLabel(option.key, option.label)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="cmp163-field cmp163-field--variable cmp163-field--fixed">
                <span>항목</span>
                <strong>{presentation ? <PublicTermTextV134 text={presentation.measureLabel} /> : "—"}</strong>
              </div>
            )}
            {layer && selector && periods.length > 1 ? (
              <label className="cmp163-field cmp163-field--period">
                <span>기준 시점</span>
                <select aria-label={`데이터 ${label} 기준 시점`} value={selector.period} onChange={(event) => onPeriod(side, event.target.value)}>
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="cmp163-field cmp163-field--period cmp163-field--fixed">
                <span>기준 시점</span>
                <strong>{presentation?.period || "—"}</strong>
              </div>
            )}
        </div>
      </header>

      <div className="cmp163-pane__map">
        <div className="cmp163-pane__canvas" ref={canvasRef} />
        {notice && notice !== dismissedNotice && (
          <p className="cmp163-pane__notice" role="status">
            <span>{notice}</span>
            <button type="button" aria-label="안내 닫기" onClick={() => setDismissedNotice(notice)}>
              ×
            </button>
          </p>
        )}
        {!ready && (
          <div className={`cmp163-pane__status cmp163-pane__status--${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>
            <p>{status.message}</p>
            {status.retry && (
              <button type="button" onClick={status.retry}>
                다시 시도
              </button>
            )}
          </div>
        )}
        {ready && drawnCount === 0 && (
          <div className="cmp163-pane__status cmp163-pane__status--empty" role="status">
            <p>선택한 조건에 표시할 대상이 없습니다</p>
          </div>
        )}
        <div className="cmp163-legend" data-testid={`map-comparison-legend-${side}`} data-legend-kind={hasRamp ? "ramp" : prepared?.kind || "none"}>
          {presentation ? (
            <>
              <p className="cmp163-legend__title">
                <PublicTermTextV134 text={presentation.measureLabel} />
                {presentation.unit && <span> ({presentation.unit})</span>}
                {presentation.period && <span className="cmp163-legend__period"> · {presentation.period}</span>}
              </p>
              {prepared && (
                <CompareLegendBodyV163
                  prepared={prepared}
                  presentation={presentation}
                  domain={naturalDomain ? domainOverride || naturalDomain : null}
                  shared={Boolean(domainOverride && naturalDomain)}
                  missingCount={missingCount}
                  iconLegend={iconLegend}
                />
              )}
            </>
          ) : (
            <p className="cmp163-legend__title">범례 준비 중</p>
          )}
        </div>
      </div>

      <div className="cmp163-pane__info">
        {(card || pointCardShown) && (
          <section className="cmp163-card" data-testid={`map-compare-card-${side}`} aria-label={`데이터 ${label} 선택 정보`}>
            {selectedFromOther && (
              <p className="cmp163-card__linked">{SIDE_POSITION_V163[side === "a" ? "b" : "a"]} 지도에서 고른 위치를 이 지도의 값으로 보여 줍니다</p>
            )}
            {card && <SelectionPanelV161 card={card} compact onZoom={zoomToSelection} />}
            <div className="cmp163-card__point" ref={pointCardRef} hidden={!pointCardShown} />
            <button type="button" className="cmp163-card__close" onClick={() => onSelect(side, null)}>
              선택 해제
            </button>
          </section>
        )}
        {layer && presentation && (
          <div className="cmp163-info">
            <section className="cmp163-info__block" data-testid={`map-compare-info-${side}`}>
              <h3>자료정보</h3>
              <dl>
                <div>
                  <dt>데이터명</dt>
                  <dd>
                    <PublicTermTextV134 text={presentation.title} />
                  </dd>
                </div>
                <div>
                  <dt>{variables.length > 1 ? "선택 지표" : "항목"}</dt>
                  <dd>
                    <PublicTermTextV134 text={presentation.measureLabel} />
                  </dd>
                </div>
                {presentation.period && (
                  <div>
                    <dt>기준 시점</dt>
                    <dd>{presentation.period}</dd>
                  </div>
                )}
                {presentation.unit && (
                  <div>
                    <dt>단위</dt>
                    <dd>{presentation.unit}</dd>
                  </div>
                )}
                <div>
                  <dt>출처 기관</dt>
                  <dd>
                    <PublicTermTextV134 text={presentation.source} />
                  </dd>
                </div>
                <div>
                  <dt>공간 단위</dt>
                  <dd>{presentation.spatialUnit}</dd>
                </div>
                {presentation.readingNote && (
                  <div>
                    <dt>읽는 법</dt>
                    <dd>
                      <PublicTermTextV134 text={presentation.readingNote} />
                    </dd>
                  </div>
                )}
              </dl>
            </section>
            {summaryRows.length > 0 && (
              <section className="cmp163-info__block" data-testid={`map-compare-summary-${side}`}>
                <h3>요약</h3>
                <dl>
                  {summaryRows.map((row) => (
                    <div key={`${row.label}:${row.value}`}>
                      <dt>
                        <PublicTermTextV134 text={row.label} />
                      </dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {!card && !pointCardShown && <p className="cmp163-info__hint">지도에서 지역이나 지점을 누르면 값과 순위를 보여 줍니다.</p>}
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CompareLegendBodyV163({
  prepared,
  presentation,
  domain,
  shared,
  missingCount,
  iconLegend,
}: {
  prepared: MapLayerPreparedV152;
  presentation: PanePresentationV163;
  domain: ValueDomainV163 | null;
  shared: boolean;
  missingCount: number;
  iconLegend: ReturnType<typeof mapIconLegendEntriesV152>;
}) {
  const unit = presentation.unit;
  const color = prepared.color;
  if (prepared.kind === "area" && prepared.renderer === "line") {
    return (
      <ul className="cmp163-legend__chips">
        {TRANSMISSION_VOLTAGE_CLASSES_V152.map((row) => (
          <li key={row.kv}>
            <i className="cmp163-legend__line" style={{ background: row.color }} aria-hidden="true" />
            {row.kv} kV
          </li>
        ))}
        <li>
          <i className="cmp163-legend__line" style={{ background: color }} aria-hidden="true" />
          기타 전압
        </li>
      </ul>
    );
  }
  if (prepared.kind === "area" && prepared.area.isRegionalScope) {
    return (
      <ul className="cmp163-legend__chips">
        <li>
          <i className="cmp163-legend__swatch" style={{ background: color, opacity: 0.4, borderColor: color }} aria-hidden="true" />
          참여국 범위
        </li>
        <li>
          <i className="cmp163-legend__dot" style={{ background: color }} aria-hidden="true" />
          세부 활동지역
        </li>
      </ul>
    );
  }
  if (prepared.kind === "area" && prepared.area.categories.length) {
    return (
      <ul className="cmp163-legend__chips">
        {prepared.area.categories.map((entry) => (
          <li key={entry.label}>
            <i className="cmp163-legend__swatch" style={{ background: entry.color }} aria-hidden="true" />
            <PublicTermTextV134 text={entry.text || entry.label} />
            <span className="cmp163-legend__count">{entry.featureCount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (domain) {
    const single = domain.minimum === domain.maximum;
    return (
      <div className="cmp163-legend__ramp-wrap">
        {single ? (
          <ul className="cmp163-legend__chips">
            <li>
              <i className="cmp163-legend__swatch" style={{ background: color }} aria-hidden="true" />
              {valueTextV163(domain.minimum, unit)}
            </li>
          </ul>
        ) : (
          <>
            <i
              className="cmp163-legend__ramp"
              style={{ background: `linear-gradient(90deg, ${RAMP_START_V163}, ${color})` }}
              aria-hidden="true"
            />
            <div className="cmp163-legend__ends">
              <span data-legend-min="true">최소 {valueTextV163(domain.minimum, unit)}</span>
              <span data-legend-max="true">최대 {valueTextV163(domain.maximum, unit)}</span>
            </div>
          </>
        )}
        <ul className="cmp163-legend__chips">
          {missingCount > 0 && (
            <li>
              <i className="cmp163-legend__swatch cmp163-legend__swatch--none" aria-hidden="true" />
              색 없음: 자료 없음
            </li>
          )}
          {shared && <li className="cmp163-legend__shared">두 지도 같은 색 구간</li>}
        </ul>
      </div>
    );
  }
  if (iconLegend.length) return <MapIconLegendV152 entries={iconLegend} compact />;
  return (
    <ul className="cmp163-legend__chips">
      <li>
        <i className="cmp163-legend__dot" style={{ background: color || LAYER_COLORS[prepared.layer.elementId] }} aria-hidden="true" />
        <PublicTermTextV134 text={presentation.title} />
      </li>
    </ul>
  );
}

/* ------------------------------------------------------------------ workspace */

export default function MapComparisonWorkspaceV163({
  initialPanes,
  countries,
  boundarySystem,
  onClose,
  onStateChange,
}: MapComparisonWorkspaceV163Props) {
  const [panes, setPanes] = useState<ComparePanesV163>(initialPanes);
  const [notices, setNotices] = useState<[string, string]>(["", ""]);
  const [pendingCountries, setPendingCountries] = useState<[string | null, string | null]>([null, null]);
  const [sync, setSync] = useState(() => syncDefaultV163(initialPanes[0].country, initialPanes[1].country));
  const [sameColors, setSameColors] = useState(true);
  const [metas, setMetas] = useState<[PaneMetaV163 | null, PaneMetaV163 | null]>([null, null]);
  const [selectedKeys, setSelectedKeys] = useState<[string | null, string | null]>([null, null]);
  const [selectedOrigin, setSelectedOrigin] = useState<CompareSideV163 | null>(null);
  const [hover, setHover] = useState<{ side: CompareSideV163; key: string } | null>(null);
  const mapsRef = useRef<Record<CompareSideV163, MapLibreMap | null>>({ a: null, b: null });
  const syncLockRef = useRef(false);
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const [syncRevision, setSyncRevision] = useState(0);

  const countryOf = useCallback((iso3: string) => countries.find((row) => row.iso3 === iso3)?.nameKo || iso3, [countries]);

  // URL and page state follow the panes.
  const reportedRef = useRef<ComparePanesV163 | null>(null);
  useEffect(() => {
    if (reportedRef.current && panesEqualV163(reportedRef.current, panes)) return;
    reportedRef.current = panes;
    onStateChange(panes);
  }, [onStateChange, panes]);

  // Moving together is the default inside one country only.
  const countryPairKey = `${panes[0].country}|${panes[1].country}`;
  const previousPairRef = useRef(countryPairKey);
  useEffect(() => {
    if (previousPairRef.current === countryPairKey) return;
    previousPairRef.current = countryPairKey;
    setSync(syncDefaultV163(panes[0].country, panes[1].country));
    setSelectedKeys([null, null]);
    setSelectedOrigin(null);
    setHover(null);
  }, [countryPairKey, panes]);

  const alignBToA = useCallback(() => {
    const source = mapsRef.current.a;
    const target = mapsRef.current.b;
    if (!source || !target) return;
    syncLockRef.current = true;
    target.jumpTo({ center: source.getCenter(), zoom: source.getZoom(), bearing: 0, pitch: 0 });
    window.requestAnimationFrame(() => {
      syncLockRef.current = false;
    });
  }, []);

  const handleMap = useCallback((side: CompareSideV163, map: MapLibreMap | null) => {
    mapsRef.current[side] = map;
  }, []);
  const handleMove = useCallback((side: CompareSideV163, source: MapLibreMap) => {
    if (!syncRef.current || syncLockRef.current) return;
    const target = mapsRef.current[side === "a" ? "b" : "a"];
    if (!target) return;
    syncLockRef.current = true;
    target.jumpTo({ center: source.getCenter(), zoom: source.getZoom(), bearing: source.getBearing(), pitch: source.getPitch() });
    setSyncRevision((value) => (value + 1) % 1_000_000);
    window.requestAnimationFrame(() => {
      syncLockRef.current = false;
    });
  }, []);

  const toggleSync = () => {
    setSync((current) => {
      const next = !current;
      if (next) window.requestAnimationFrame(alignBToA);
      return next;
    });
  };

  const updatePane = useCallback((side: CompareSideV163, patch: Partial<ComparePaneSelectionV163>) => {
    const index = indexOfSideV163(side);
    setPanes((current) => {
      const next: ComparePanesV163 = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);
  const setNotice = useCallback((side: CompareSideV163, text: string) => {
    const index = indexOfSideV163(side);
    setNotices((current) => {
      if (current[index] === text) return current;
      const next: [string, string] = [current[0], current[1]];
      next[index] = text;
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedKeys([null, null]);
    setSelectedOrigin(null);
  }, []);

  const changeCountry = useCallback(
    (side: CompareSideV163, iso3: string) => {
      const index = indexOfSideV163(side);
      const current = panes[index];
      if (current.country === iso3) return;
      setPendingCountries((value) => {
        const next: [string | null, string | null] = [value[0], value[1]];
        next[index] = iso3;
        return next;
      });
      const finish = () =>
        setPendingCountries((value) => {
          const next: [string | null, string | null] = [value[0], value[1]];
          next[index] = null;
          return next;
        });
      void loadCompareMapIndexV163(iso3)
        .then((layers) => {
          const resolved = resolveLayerForCountryV163(layers, current.elementId, (layer) => layerTitleV163(layer, iso3));
          const target = layers.find((layer) => layer.elementId === resolved?.elementId) || null;
          const keepVariable = Boolean(
            resolved?.kept && current.variable && target?.selectors.variables.some((row) => row.key === current.variable)
          );
          updatePane(side, {
            country: iso3,
            elementId: resolved?.elementId || current.elementId,
            variable: keepVariable ? current.variable : null,
            period: keepVariable ? current.period : null,
          });
          if (resolved && !resolved.kept && target) {
            const title = layerTitleV163(target, iso3);
            setNotice(side, `${countryOf(iso3)}에는 이 데이터가 없어 '${title}'${objectParticleV163(title)} 표시합니다.`);
          } else {
            setNotice(side, "");
          }
        })
        .catch(() => {
          // The pane states the index error itself and offers 다시 시도.
          updatePane(side, { country: iso3 });
        })
        .finally(finish);
    },
    [countryOf, panes, setNotice, updatePane]
  );
  const changeElement = useCallback(
    (side: CompareSideV163, elementId: string) => {
      updatePane(side, { elementId, variable: null, period: null });
      setNotice(side, "");
      clearSelection();
    },
    [clearSelection, setNotice, updatePane]
  );
  const changeVariable = useCallback(
    (side: CompareSideV163, variable: string) => {
      updatePane(side, { variable });
      clearSelection();
    },
    [clearSelection, updatePane]
  );
  const changePeriod = useCallback((side: CompareSideV163, period: string) => updatePane(side, { period }), [updatePane]);

  const handleMeta = useCallback((side: CompareSideV163, meta: PaneMetaV163 | null) => {
    const index = indexOfSideV163(side);
    setMetas((current) => {
      const previous = current[index];
      if (
        previous === meta ||
        (previous &&
          meta &&
          previous.renderer === meta.renderer &&
          previous.elementId === meta.elementId &&
          previous.variable === meta.variable &&
          previous.unit === meta.unit &&
          domainsEqualV163(previous.domain, meta.domain))
      ) {
        return current;
      }
      const next: [PaneMetaV163 | null, PaneMetaV163 | null] = [current[0], current[1]];
      next[index] = meta;
      return next;
    });
  }, []);

  const linked = Boolean(
    metas[0] &&
      metas[1] &&
      linkedRegionsV163(
        { country: panes[0].country, elementId: metas[0].elementId, renderer: metas[0].renderer },
        { country: panes[1].country, elementId: metas[1].elementId, renderer: metas[1].renderer }
      )
  );
  const linkedRef = useRef(linked);
  linkedRef.current = linked;

  const handleSelect = useCallback((side: CompareSideV163, key: string | null) => {
    if (!key) {
      setSelectedKeys((current) => {
        if (linkedRef.current) return [null, null];
        const next: [string | null, string | null] = [current[0], current[1]];
        next[indexOfSideV163(side)] = null;
        return next;
      });
      setSelectedOrigin(null);
      return;
    }
    setSelectedOrigin(side);
    setSelectedKeys((current) => {
      if (linkedRef.current) return [key, key];
      const next: [string | null, string | null] = [current[0], current[1]];
      next[indexOfSideV163(side)] = key;
      return next;
    });
  }, []);
  const hoverRef = useRef<string>("");
  const handleHover = useCallback((side: CompareSideV163, key: string | null) => {
    const signature = key ? `${side}:${key}` : "";
    if (hoverRef.current === signature) return;
    hoverRef.current = signature;
    setHover(key ? { side, key } : null);
  }, []);

  const sameQuantity = Boolean(
    metas[0]?.domain &&
      metas[1]?.domain &&
      sameQuantityV163(
        { elementId: metas[0].elementId, variable: metas[0].variable, unit: metas[0].unit },
        { elementId: metas[1].elementId, variable: metas[1].variable, unit: metas[1].unit }
      )
  );
  const sharedDomain = useMemo(
    () => (sameQuantity && sameColors ? sharedDomainV163(metas[0]?.domain, metas[1]?.domain) : null),
    [metas, sameColors, sameQuantity]
  );

  const swap = () => {
    setPanes((current) => swapPanesV163(current));
    setNotices((current) => [current[1], current[0]]);
    setSelectedKeys((current) => [current[1], current[0]]);
    setSelectedOrigin((current) => (current === "a" ? "b" : current === "b" ? "a" : null));
    setHover(null);
  };

  const differentCountries = panes[0].country !== panes[1].country;

  return (
    <section
      className="cmp163"
      data-testid="map-comparison-workspace-v135"
      data-comparison-elements={`${panes[0].elementId},${panes[1].elementId}`}
      data-comparison-countries={`${panes[0].country},${panes[1].country}`}
      data-layout-desktop="side-by-side"
      data-layout-mobile="stacked"
      data-layout-mode="side-by-side"
      data-synchronized={sync ? "true" : "false"}
      data-sync-revision={syncRevision}
      data-linked-regions={linked ? "true" : "false"}
      data-shared-colors={sharedDomain ? "true" : "false"}
    >
      <header className="cmp163__header">
        <div className="cmp163__heading">
          <span>지도 비교</span>
          <h2>두 데이터를 같은 범위에서 비교</h2>
          <p>
            {sync
              ? "한쪽 지도를 이동하거나 확대하면 다른 지도도 같은 범위로 맞춰집니다."
              : differentCountries
                ? "두 지도가 서로 다른 국가를 보여 주므로 각 지도를 따로 움직입니다."
                : "두 지도를 따로 움직입니다. '위치 함께 이동'을 켜면 같은 범위로 맞춰집니다."}
          </p>
        </div>
        <div className="cmp163__tools">
          <label className="cmp163-toggle">
            <input type="checkbox" checked={sync} onChange={toggleSync} data-testid="map-compare-sync" />
            <span>위치 함께 이동</span>
          </label>
          {sameQuantity && (
            <label className="cmp163-toggle">
              <input
                type="checkbox"
                checked={sameColors}
                onChange={(event) => setSameColors(event.target.checked)}
                data-testid="map-compare-same-colors"
              />
              <span>같은 색 구간</span>
            </label>
          )}
          <button type="button" className="cmp163__tool" onClick={swap} data-testid="map-compare-swap">
            좌우 바꾸기
          </button>
          <button type="button" className="cmp163__close" onClick={() => onClose(panes)} data-testid="map-compare-close">
            비교 닫기
            <small>일반 지도로 돌아가기</small>
          </button>
        </div>
      </header>
      <div className="cmp163__panes">
        {(["a", "b"] as const).map((side) => {
          const index = indexOfSideV163(side);
          const selectedKey = selectedKeys[index];
          return (
            <ComparePaneV163
              key={side}
              side={side}
              selection={panes[index]}
              countries={countries}
              boundarySystem={boundarySystem}
              notice={notices[index]}
              countryPending={pendingCountries[index]}
              domainOverride={sharedDomain}
              selectedKey={selectedKey}
              selectedFromOther={Boolean(selectedKey && linked && selectedOrigin && selectedOrigin !== side)}
              hoverKey={hover && (hover.side === side || linked) ? hover.key : null}
              onCountry={changeCountry}
              onElement={changeElement}
              onVariable={changeVariable}
              onPeriod={changePeriod}
              onSelect={handleSelect}
              onHover={handleHover}
              onMeta={handleMeta}
              onMap={handleMap}
              onMove={handleMove}
            />
          );
        })}
      </div>
    </section>
  );
}
