import type { FormEvent } from "react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { getViewFromLocation } from "./app/navigation";
import type { View } from "./app/navigation";
import { applyDocumentMeta, getPageMeta } from "./app/pageMeta";
import PlanningContextBarV42 from "./components/common/PlanningContextBarV42";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { CLIMATE_TECHNOLOGY_BY_ID } from "./data/climateTechnologyCatalog";
import { PRIORITY_COUNTRIES } from "./data/priorityCountries";
import { DATASETS } from "./data/publicDatasets";
import { INDICATOR_CONFIGS } from "./data/indicators/registry";
import { GCF_METRIC_DEFINITIONS } from "./data/gcf/gcfCountryPortfolio";
import {
  hasCountryDataProviderV122,
  publicCountryElementTokenV122,
  resolveCountryElementIdV122,
} from "./data/countries/countryDataFacadeV122";
import type { CategoryCode } from "./data/publicTaxonomy";
import CountryDataElementPage from "./pages/CountryDataElementPage";
import DataGuidePage from "./pages/DataGuidePage";
import DataExplorerPage from "./pages/DataExplorerPage";
import DownloadPage from "./pages/DownloadPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { getAuthoritativeElementIdV88 } from "./utils/elementDatasetRegistryV88";
import type {
  CompareNavigationTarget,
  CompareTab,
  CompareViewState,
} from "./types/compare";
import { DEFAULT_COMPARE_VIEW_STATE } from "./types/compare";
import { parseMapViewState } from "./types/map";
import type { MapViewState } from "./types/map";
import {
  appendDataFinderSelectorParamsV125,
  dataFinderSelectorStatesEqualV125,
  EMPTY_DATA_FINDER_SELECTOR_STATE_V125,
  parseDataFinderSelectorStateV125,
} from "./types/dataFinderV125";
import type { DataFinderSelectorStateV125 } from "./types/dataFinderV125";

const RealMapExplorerPage = lazy(() => import("./pages/RealMapExplorerPage"));

function DeferredPageFallback({ label }: { label: string }) {
  return (
    <div className="cdp-page-shell" role="status" aria-live="polite">
      <p className="cdp-muted">{label}</p>
    </div>
  );
}

type HistoryMode = "push" | "replace";
type DatasetReturnView =
  | "home"
  | "explorer"
  | "element-detail"
  | "map"
  | "country"
  | "compare"
  | "insights";

const DATASET_RETURN_VIEWS: DatasetReturnView[] = [
  "home",
  "explorer",
  "element-detail",
  "map",
  "country",
  "compare",
  "insights",
];

function parseDatasetReturnView(value: string | null): DatasetReturnView {
  return DATASET_RETURN_VIEWS.includes(value as DatasetReturnView)
    ? (value as DatasetReturnView)
    : "explorer";
}

function isValidPriorityCountry(value: string | null): boolean {
  return Boolean(
    value && PRIORITY_COUNTRIES.some((country) => country.iso3 === value)
  );
}

function normalizeDownloadCountryIso3(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return hasCountryDataProviderV122(normalized) ? normalized : null;
}

const COMPARE_TABS = new Set<CompareTab>(["indicator", "trend", "ndc", "gcf"]);

const NDC_COMPARE_TECHNOLOGY_IDS = new Set([
  "renewable-energy",
  "power-grid",
  "energy-efficiency",
  "clean-cooking",
  "water",
  "agriculture",
  "coastal-adaptation",
  "early-warning",
  "industrial-decarbonization",
  "mrv-carbon-market",
]);

function parseCompareViewState(params: URLSearchParams): CompareViewState {
  const tabValue = params.get("compareTab") as CompareTab | null;
  const indicatorValue = params.get("compareIndicator");
  const ndcValue = params.get("comparePolicy");
  const gcfValue = params.get("compareGcf");
  const yearValue = params.get("compareYear");
  const parsedCompareYear = yearValue ? Number(yearValue) : null;

  const indicatorId = INDICATOR_CONFIGS.some(
    (config) => config.id === indicatorValue
  )
    ? (indicatorValue as CompareViewState["indicatorId"])
    : DEFAULT_COMPARE_VIEW_STATE.indicatorId;

  const gcfMetricId = GCF_METRIC_DEFINITIONS.some(
    (definition) => definition.id === gcfValue
  )
    ? (gcfValue as CompareViewState["gcfMetricId"])
    : DEFAULT_COMPARE_VIEW_STATE.gcfMetricId;

  return {
    tab:
      tabValue && COMPARE_TABS.has(tabValue)
        ? tabValue
        : DEFAULT_COMPARE_VIEW_STATE.tab,
    indicatorId,
    indicatorYear:
      parsedCompareYear !== null && Number.isInteger(parsedCompareYear)
        ? parsedCompareYear
        : DEFAULT_COMPARE_VIEW_STATE.indicatorYear,
    ndcTechnologyId:
      ndcValue && NDC_COMPARE_TECHNOLOGY_IDS.has(ndcValue)
        ? ndcValue
        : DEFAULT_COMPARE_VIEW_STATE.ndcTechnologyId,
    gcfMetricId,
  };
}

function applyCompareNavigationTarget(
  current: CompareViewState,
  target?: CompareNavigationTarget
): CompareViewState {
  if (!target) return current;
  return {
    ...current,
    tab: target.tab,
    indicatorId: target.indicatorId ?? current.indicatorId,
    indicatorYear:
      target.indicatorYear !== undefined
        ? target.indicatorYear
        : target.indicatorId && target.indicatorId !== current.indicatorId
        ? null
        : current.indicatorYear,
    ndcTechnologyId: target.ndcTechnologyId ?? current.ndcTechnologyId,
    gcfMetricId: target.gcfMetricId ?? current.gcfMetricId,
  };
}

function mapViewStatesEqual(a: MapViewState, b: MapViewState): boolean {
  if (
    a.layer !== b.layer ||
    a.overlay !== b.overlay ||
    a.policyOverlay !== b.policyOverlay ||
    a.scope !== b.scope ||
    a.region !== b.region ||
    a.year !== b.year ||
    a.countryIso3 !== b.countryIso3 ||
    a.baseOpacity !== b.baseOpacity ||
    a.overlayOpacity !== b.overlayOpacity ||
    a.policyOpacity !== b.policyOpacity ||
    a.focusLayerKey !== b.focusLayerKey ||
    a.primaryLayerId !== b.primaryLayerId ||
    a.mapPresetId !== b.mapPresetId ||
    a.comparisonMode !== b.comparisonMode ||
    a.comparisonLayerIds.length !== b.comparisonLayerIds.length ||
    a.contextLayerIds.length !== b.contextLayerIds.length ||
    a.activeLayerKeys.length !== b.activeLayerKeys.length
  ) {
    return false;
  }

  for (let index = 0; index < a.activeLayerKeys.length; index += 1) {
    const key = a.activeLayerKeys[index];
    if (key !== b.activeLayerKeys[index]) return false;
    if ((a.layerOpacities[key] ?? null) !== (b.layerOpacities[key] ?? null)) {
      return false;
    }
    if ((a.layerYears[key] ?? null) !== (b.layerYears[key] ?? null)) {
      return false;
    }
  }

  for (let index = 0; index < a.contextLayerIds.length; index += 1) {
    if (a.contextLayerIds[index] !== b.contextLayerIds[index]) return false;
  }

  for (let index = 0; index < a.comparisonLayerIds.length; index += 1) {
    if (a.comparisonLayerIds[index] !== b.comparisonLayerIds[index]) return false;
  }

  if (JSON.stringify(a.layerSelectors) !== JSON.stringify(b.layerSelectors)) {
    return false;
  }

  return true;
}

function publicMapStateKeyV122(
  key: string,
  countryIso3: string | null
): string {
  return /^[A-E]-\d{3}$/.test(key)
    ? publicCountryElementTokenV122(countryIso3, key)
    : key;
}

function appendMapViewParams(
  params: URLSearchParams,
  state: MapViewState
): void {
  // v85: 실제 지도 상태는 누적 레이어 배열로 저장하고, 아래 legacy 필드는 과거 공유 URL 호환용으로 유지
  params.set("layer", state.layer);
  if (state.overlay !== "none") params.set("overlay", state.overlay);
  if (state.policyOverlay !== "none") {
    params.set("policyOverlay", state.policyOverlay);
  }
  params.set(
    "layers",
    state.activeLayerKeys.length
      ? state.activeLayerKeys
          .map((key) => publicMapStateKeyV122(key, state.countryIso3))
          .join(",")
      : "none"
  );
  if (state.activeLayerKeys.length) {
    params.set(
      "layerOpacities",
      state.activeLayerKeys
        .map((key) => (state.layerOpacities[key] ?? 0.58).toFixed(2))
        .join(",")
    );
  }
  if (state.focusLayerKey) {
    params.set(
      "focusLayer",
      publicMapStateKeyV122(state.focusLayerKey, state.countryIso3)
    );
  }
  if (state.primaryLayerId) {
    params.set(
      "primaryLayer",
      publicMapStateKeyV122(state.primaryLayerId, state.countryIso3)
    );
  }
  params.set(
    "contextLayers",
    state.contextLayerIds.length
      ? state.contextLayerIds
          .map((key) => publicMapStateKeyV122(key, state.countryIso3))
          .join(",")
      : "none"
  );
  if (state.mapPresetId) params.set("mapPreset", state.mapPresetId);
  if (state.comparisonMode && state.comparisonLayerIds.length === 2) {
    params.set("mapMode", "compare");
    params.set(
      "compareLayers",
      state.comparisonLayerIds
        .map((key) => publicMapStateKeyV122(key, state.countryIso3))
        .join(",")
    );
  }
  if (Object.keys(state.layerSelectors).length > 0) {
    params.set(
      "mapSelectors",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(state.layerSelectors).map(([key, value]) => [
            publicMapStateKeyV122(key, state.countryIso3),
            value,
          ])
        )
      )
    );
  }
  if (state.activeLayerKeys.length) {
    params.set(
      "layerYears",
      state.activeLayerKeys
        .map((key) => {
          const year = state.layerYears[key];
          return year === null || year === undefined ? "none" : String(year);
        })
        .join(",")
    );
  }
  params.set("scope", state.scope);
  if (state.region !== "all") params.set("region", state.region);
  if (state.year !== null) params.set("year", String(state.year));
  if (state.countryIso3) params.set("country", state.countryIso3);
  params.set("baseOpacity", state.baseOpacity.toFixed(2));
  if (state.overlay !== "none") {
    params.set("overlayOpacity", state.overlayOpacity.toFixed(2));
  }
  if (state.policyOverlay !== "none") {
    params.set("policyOpacity", state.policyOpacity.toFixed(2));
  }
}

function appendCompareViewParams(
  params: URLSearchParams,
  state: CompareViewState,
  countryIso3: string | null
): void {
  if (countryIso3) params.set("country", countryIso3);
  params.set("compareTab", state.tab);
  if (state.tab === "indicator" || state.tab === "trend") {
    params.set("compareIndicator", state.indicatorId);
    if (state.indicatorYear !== null) {
      params.set("compareYear", String(state.indicatorYear));
    }
  }
  if (state.tab === "ndc") {
    params.set("comparePolicy", state.ndcTechnologyId);
  }
  if (state.tab === "gcf") {
    params.set("compareGcf", state.gcfMetricId);
  }
}

function resolveLegacyDatasetElementV128(
  params: URLSearchParams
): string | null {
  const datasetId = params.get("dataset");
  const dataset = DATASETS.find((item) => item.id === datasetId);
  if (!dataset) return null;
  return resolveCountryElementIdV122(
    "VNM",
    getAuthoritativeElementIdV88(dataset)
  );
}

export default function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const initialRawHash = window.location.hash.replace(/^#/, "").trim();
  const initialMapState = parseMapViewState(initialParams);
  const initialCompareState = parseCompareViewState(initialParams);
  const initialDataFinderSelectorState =
    parseDataFinderSelectorStateV125(initialParams);
  const initialLocationView = getViewFromLocation();
  const initialLegacyElementId =
    initialLocationView === "dataset-detail"
      ? resolveLegacyDatasetElementV128(initialParams)
      : null;
  const initialView: View =
    initialLocationView === "dataset-detail"
      ? initialLegacyElementId
        ? "element-detail"
        : "explorer"
      : initialLocationView;
  const initialDatasetReturnView = parseDatasetReturnView(
    initialParams.get("from")
  );
  const initialCountryParam = initialLegacyElementId
    ? "VNM"
    : initialParams.get("country")?.toUpperCase() ?? null;
  const initialDataCountryIso3 = hasCountryDataProviderV122(initialCountryParam)
    ? initialCountryParam
    : null;
  const initialElementId =
    initialLegacyElementId ||
    resolveCountryElementIdV122(
      initialDataCountryIso3,
      initialParams.get("element")
    );

  const [view, setView] = useState<View>(initialView);
  const [mapViewState, setMapViewState] =
    useState<MapViewState>(initialMapState);
  const [compareViewState, setCompareViewState] =
    useState<CompareViewState>(initialCompareState);
  const [dataFinderSelectorState, setDataFinderSelectorState] =
    useState<DataFinderSelectorStateV125>(initialDataFinderSelectorState);
  const [query, setQuery] = useState(initialParams.get("q") ?? "");
  const [sourceOrganization, setSourceOrganization] = useState(
    initialParams.get("source") ?? "all"
  );
  const [explorerCountryIso3, setExplorerCountryIso3] = useState(
    initialView === "explorer" &&
      hasCountryDataProviderV122(initialCountryParam)
      ? (initialCountryParam as string)
      : "all"
  );
  const [category, setCategory] = useState<CategoryCode | "all">(
    (initialParams.get("category") as CategoryCode | null) ?? "all"
  );
  const initialTechnologyParam = initialParams.get("technology");
  const [technologyId, setTechnologyId] = useState<string>(
    initialTechnologyParam &&
      CLIMATE_TECHNOLOGY_BY_ID.has(initialTechnologyParam)
      ? initialTechnologyParam
      : "all"
  );
  const [explorerGroup, setExplorerGroup] = useState<string | null>(
    initialParams.get("group")
  );
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    initialLocationView === "dataset-detail" ? null : initialParams.get("dataset")
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    initialView === "element-detail" ? initialElementId : null
  );
  const [selectedElementCountryIso3, setSelectedElementCountryIso3] = useState<
    string | null
  >(
    initialView === "element-detail" ? initialDataCountryIso3 : null
  );
  const [downloadCountryIso3, setDownloadCountryIso3] = useState<string | null>(
    initialView === "download"
      ? normalizeDownloadCountryIso3(initialCountryParam)
      : null
  );
  const [downloadElementId, setDownloadElementId] = useState<string | null>(
    initialView === "download" ? initialElementId : null
  );
  const [datasetReturnView, setDatasetReturnView] = useState<DatasetReturnView>(
    initialDatasetReturnView
  );
  const [selectedCountryIso3, setSelectedCountryIso3] = useState<string | null>(
    initialView === "map"
      ? initialMapState.countryIso3
      : initialView === "country" || initialView === "compare"
      ? initialCountryParam
      : initialView === "insights" &&
        isValidPriorityCountry(initialCountryParam)
      ? initialCountryParam
      : null
  );

  const historyModeRef = useRef<HistoryMode>("replace");
  const restoringHistoryRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const startsWithLegacyRoute =
      initialRawHash === "dataset-detail" ||
      initialRawHash === "compare" ||
      initialRawHash === "country" ||
      initialRawHash.startsWith("country-") ||
      initialRawHash === "insights" ||
      initialRawHash.startsWith("insight-");
    if (!startsWithLegacyRoute || window.location.hash === `#${initialView}`) {
      return;
    }
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${initialView}`
    );
  }, [initialRawHash, initialView]);

  const handleMapStateChange = useCallback((nextState: MapViewState) => {
    setMapViewState((current) =>
      mapViewStatesEqual(current, nextState) ? current : nextState
    );
    setSelectedCountryIso3((current) =>
      current === nextState.countryIso3 ? current : nextState.countryIso3
    );
  }, []);

  const selectedDataset =
    DATASETS.find((dataset) => dataset.id === selectedDatasetId) ?? null;

  useEffect(() => {
    const restoreFromLocation = () => {
      restoringHistoryRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const restoredMapState = parseMapViewState(params);
      const restoredCompareState = parseCompareViewState(params);
      const restoredDataFinderSelectorState =
        parseDataFinderSelectorStateV125(params);
      const locationView = getViewFromLocation();
      const legacyElementId =
        locationView === "dataset-detail"
          ? resolveLegacyDatasetElementV128(params)
          : null;
      const nextView: View =
        locationView === "dataset-detail"
          ? legacyElementId
            ? "element-detail"
            : "explorer"
          : locationView;
      const countryParam = legacyElementId
        ? "VNM"
        : params.get("country")?.toUpperCase() ?? null;

      setView(nextView);
      setQuery(params.get("q") ?? "");
      setSourceOrganization(params.get("source") ?? "all");
      setExplorerCountryIso3(
        nextView === "explorer" && hasCountryDataProviderV122(countryParam)
          ? (countryParam as string)
          : "all"
      );
      setCategory((params.get("category") as CategoryCode | null) ?? "all");

      const restoredTechnology = params.get("technology");
      setTechnologyId(
        restoredTechnology && CLIMATE_TECHNOLOGY_BY_ID.has(restoredTechnology)
          ? restoredTechnology
          : "all"
      );

      const restoredDataCountryIso3 = hasCountryDataProviderV122(countryParam)
        ? countryParam
        : null;
      const restoredElementId =
        legacyElementId ||
        resolveCountryElementIdV122(
          restoredDataCountryIso3,
          params.get("element")
        );

      setExplorerGroup(params.get("group"));
      setSelectedDatasetId(
        locationView === "dataset-detail" ? null : params.get("dataset")
      );
      setSelectedElementId(
        nextView === "element-detail" ? restoredElementId : null
      );
      setSelectedElementCountryIso3(
        nextView === "element-detail" ? restoredDataCountryIso3 : null
      );
      setDownloadCountryIso3(
        nextView === "download" ? restoredDataCountryIso3 : null
      );
      setDownloadElementId(nextView === "download" ? restoredElementId : null);
      const restoredReturnView = parseDatasetReturnView(params.get("from"));
      setDatasetReturnView(restoredReturnView);
      setMapViewState(restoredMapState);
      setCompareViewState(restoredCompareState);
      setDataFinderSelectorState(restoredDataFinderSelectorState);
      setSelectedCountryIso3(
        nextView === "map"
          ? restoredMapState.countryIso3
          : nextView === "element-detail"
          ? restoredDataCountryIso3
          : nextView === "country" || nextView === "compare"
          ? countryParam
          : nextView === "insights" && isValidPriorityCountry(countryParam)
          ? countryParam
          : null
      );
    };

    window.addEventListener("popstate", restoreFromLocation);

    return () => {
      window.removeEventListener("popstate", restoreFromLocation);
    };
  }, []);

  useEffect(() => {
    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      historyModeRef.current = "replace";
      return;
    }

    const params = new URLSearchParams();

    if (view === "explorer") {
      if (query.trim()) params.set("q", query.trim());
      if (sourceOrganization !== "all") {
        params.set("source", sourceOrganization);
      }
      if (explorerCountryIso3 !== "all") {
        params.set("country", explorerCountryIso3);
      }
      if (category !== "all") params.set("category", category);
      if (technologyId !== "all") params.set("technology", technologyId);
      if (explorerGroup) params.set("group", explorerGroup);
    }

    if (
      view === "element-detail" &&
      selectedElementId &&
      selectedElementCountryIso3
    ) {
      params.set("view", "data");
      params.set(
        "element",
        publicCountryElementTokenV122(
          selectedElementCountryIso3,
          selectedElementId
        )
      );
      params.set("country", selectedElementCountryIso3);
      params.set("from", "explorer");
      if (explorerGroup) params.set("group", explorerGroup);
      appendDataFinderSelectorParamsV125(params, dataFinderSelectorState);
    }

    if (view === "dataset-detail" && selectedDatasetId) {
      params.set("dataset", selectedDatasetId);
      params.set("from", datasetReturnView);

      if (datasetReturnView === "element-detail") {
        if (selectedElementId && selectedElementCountryIso3) {
          params.set(
            "element",
            publicCountryElementTokenV122(
              selectedElementCountryIso3,
              selectedElementId
            )
          );
          params.set("country", selectedElementCountryIso3);
        }
        if (explorerGroup) params.set("group", explorerGroup);
      } else if (
        selectedCountryIso3 &&
        (datasetReturnView === "insights" || datasetReturnView === "country")
      ) {
        params.set("country", selectedCountryIso3);
      } else if (datasetReturnView === "map") {
        appendMapViewParams(params, mapViewState);
      } else if (datasetReturnView === "compare") {
        appendCompareViewParams(params, compareViewState, selectedCountryIso3);
      }

      if (
        technologyId !== "all" &&
        CLIMATE_TECHNOLOGY_BY_ID.has(technologyId) &&
        (datasetReturnView === "insights" || datasetReturnView === "country")
      ) {
        params.set("technology", technologyId);
      }
    }

    if (view === "download") {
      if (selectedDatasetId) params.set("dataset", selectedDatasetId);
      if (downloadElementId && downloadCountryIso3) {
        params.set(
          "element",
          publicCountryElementTokenV122(downloadCountryIso3, downloadElementId)
        );
      }
      if (downloadCountryIso3) params.set("country", downloadCountryIso3);
    }

    if (view === "map") {
      appendMapViewParams(params, mapViewState);
      if (mapViewState.focusLayerKey && mapViewState.countryIso3) {
        params.set(
          "element",
          publicCountryElementTokenV122(
            mapViewState.countryIso3,
            mapViewState.focusLayerKey
          )
        );
      }
      appendDataFinderSelectorParamsV125(params, dataFinderSelectorState);
    }

    if (view === "country" && selectedCountryIso3) {
      params.set("country", selectedCountryIso3);
      if (technologyId !== "all") params.set("technology", technologyId);
    }

    if (view === "compare") {
      appendCompareViewParams(params, compareViewState, selectedCountryIso3);
    }

    if (view === "insights") {
      if (selectedCountryIso3 && isValidPriorityCountry(selectedCountryIso3)) {
        params.set("country", selectedCountryIso3);
      }
      if (
        technologyId !== "all" &&
        CLIMATE_TECHNOLOGY_BY_ID.has(technologyId)
      ) {
        params.set("technology", technologyId);
      }
    }

    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${
      queryString ? `?${queryString}` : ""
    }#${view}`;

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      const method =
        historyModeRef.current === "push" ? "pushState" : "replaceState";
      window.history[method](null, "", nextUrl);
    }

    historyModeRef.current = "replace";
  }, [
    view,
    query,
    sourceOrganization,
    explorerCountryIso3,
    category,
    technologyId,
    explorerGroup,
    selectedElementId,
    selectedElementCountryIso3,
    selectedDatasetId,
    downloadCountryIso3,
    downloadElementId,
    datasetReturnView,
    selectedCountryIso3,
    mapViewState,
    compareViewState,
    dataFinderSelectorState,
  ]);

  useEffect(() => {
    applyDocumentMeta(
      getPageMeta({
        view,
        datasetTitle: selectedDataset?.titleKo ?? null,
        countryIso3: selectedCountryIso3,
      })
    );

    mainRef.current?.focus({ preventScroll: true });
  }, [view, selectedDataset?.titleKo, selectedCountryIso3]);

  function markNextNavigationAsPush() {
    historyModeRef.current = "push";
  }

  function navigate(nextView: View) {
    if (nextView === "dataset-detail" || nextView === "country" || nextView === "insights") {
      nextView = "explorer";
    } else if (nextView === "compare") {
      nextView = "download";
    }
    if (nextView !== view) {
      markNextNavigationAsPush();
    }

    const currentContextCountry =
      view === "explorer" && explorerCountryIso3 !== "all"
        ? explorerCountryIso3
        : selectedCountryIso3;

    if (nextView === "explorer") {
      setExplorerCountryIso3(
        currentContextCountry &&
          hasCountryDataProviderV122(currentContextCountry)
          ? currentContextCountry
          : "all"
      );
      if (view !== "explorer" && view !== "element-detail") {
        setExplorerGroup(null);
      }
    }

    if (nextView === "map" && view !== "map") {
      const nextCountry =
        currentContextCountry &&
        hasCountryDataProviderV122(currentContextCountry)
          ? currentContextCountry
          : mapViewState.countryIso3 &&
            hasCountryDataProviderV122(mapViewState.countryIso3)
          ? mapViewState.countryIso3
          : null;
      setSelectedCountryIso3(nextCountry);
      setMapViewState((current) => ({
        ...current,
        countryIso3: nextCountry,
        activeLayerKeys: [],
        layerOpacities: {},
        layerYears: {},
        focusLayerKey: null,
        primaryLayerId: null,
        contextLayerIds: [],
        mapPresetId: null,
        comparisonMode: false,
        comparisonLayerIds: [],
        layerSelectors: {},
      }));
    }

    if (nextView === "download") {
      const contextElement =
        view === "element-detail"
          ? selectedElementId
          : view === "map"
          ? mapViewState.focusLayerKey
          : null;
      setDownloadElementId(contextElement);
      setDownloadCountryIso3(
        currentContextCountry &&
          hasCountryDataProviderV122(currentContextCountry)
          ? currentContextCountry
          : null
      );
    }

    setView(nextView);

    if (!["dataset-detail", "download"].includes(nextView)) {
      setSelectedDatasetId(null);
    }

    if (nextView !== "download") {
      setDownloadCountryIso3(null);
      setDownloadElementId(null);
    }

    if (
      !["country", "compare", "map", "insights", "element-detail"].includes(
        nextView
      )
    ) {
      setSelectedCountryIso3(null);
    }

    if (nextView === "home") {
      setQuery("");
      setSourceOrganization("all");
      setExplorerCountryIso3("all");
      setCategory("all");
      setTechnologyId("all");
      setExplorerGroup(null);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openElement(
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) {
    if (!hasCountryDataProviderV122(countryIso3)) return;

    markNextNavigationAsPush();
    setSelectedElementId(elementId);
    setSelectedElementCountryIso3(countryIso3);
    setSelectedCountryIso3(countryIso3);
    setDataFinderSelectorState(
      selectorState ?? EMPTY_DATA_FINDER_SELECTOR_STATE_V125
    );
    // 상세 화면의 국가 선택은 데이터 찾기 필터 상태와 분리합니다.
    setSelectedDatasetId(null);
    setView("element-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openElementOnMap(
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) {
    if (!hasCountryDataProviderV122(countryIso3)) return;

    const nextSelectorState =
      selectorState ?? EMPTY_DATA_FINDER_SELECTOR_STATE_V125;
    markNextNavigationAsPush();
    setSelectedCountryIso3(countryIso3);
    setDataFinderSelectorState(nextSelectorState);
    setMapViewState((current) => ({
      ...current,
      countryIso3,
      year: nextSelectorState.year ?? current.year,
      activeLayerKeys: [elementId],
      layerOpacities: {
        [elementId]: current.layerOpacities[elementId] ?? 0.78,
      },
      layerYears: {
        [elementId]: nextSelectorState.year ?? current.layerYears[elementId] ?? null,
      },
      focusLayerKey: elementId,
      primaryLayerId: elementId,
      contextLayerIds: [],
      mapPresetId: null,
      comparisonMode: false,
      comparisonLayerIds: [],
      layerSelectors: {},
    }));
    setView("map");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnFromElement() {
    markNextNavigationAsPush();
    // 데이터 찾기에서 사용자가 선택했던 국가·기술·주제·출처 조건을 그대로 복원합니다.
    // 상세 화면에서 선택한 국가는 상세 문맥일 뿐 Explorer 필터를 변경하지 않습니다.
    setSelectedCountryIso3(null);
    setSelectedDatasetId(null);
    setView("explorer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openElementDownload(
    elementId: string,
    countryIso3?: string | null,
    datasetId?: string | null
  ) {
    markNextNavigationAsPush();
    setDownloadElementId(elementId);
    setSelectedDatasetId(datasetId ?? null);
    setDownloadCountryIso3(normalizeDownloadCountryIso3(countryIso3 ?? null));
    setView("download");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSourceOrganization("all");
    setExplorerCountryIso3("all");
    setCategory("all");
    setTechnologyId("all");
    setExplorerGroup(null);
    navigate("explorer");
  }

  function selectCategory(categoryCode: CategoryCode) {
    setQuery("");
    setSourceOrganization("all");
    setExplorerCountryIso3("all");
    setCategory(categoryCode);
    setTechnologyId("all");
    setExplorerGroup(null);
    navigate("explorer");
  }

  function openExplorerFromGlobalSearch(
    nextQuery: string,
    countryIso3: string | null,
    nextTechnologyId: string | null
  ) {
    markNextNavigationAsPush();
    setQuery(nextQuery);
    setSourceOrganization("all");
    setExplorerCountryIso3(
      countryIso3 && hasCountryDataProviderV122(countryIso3)
        ? countryIso3
        : "all"
    );
    setCategory("all");
    setTechnologyId(
      nextTechnologyId && CLIMATE_TECHNOLOGY_BY_ID.has(nextTechnologyId)
        ? nextTechnologyId
        : "all"
    );
    setExplorerGroup(null);
    setSelectedDatasetId(null);
    setSelectedCountryIso3(null);
    setView("explorer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const planningContextCountryIso3 = (() => {
    if (view === "explorer") {
      return explorerCountryIso3 !== "all" ? explorerCountryIso3 : null;
    }

    if (view === "dataset-detail") {
      if (datasetReturnView === "explorer") {
        return explorerCountryIso3 !== "all" ? explorerCountryIso3 : null;
      }
      if (datasetReturnView === "element-detail") {
        return selectedElementCountryIso3;
      }
      if (datasetReturnView === "map") {
        return mapViewState.countryIso3;
      }
      if (
        datasetReturnView === "country" ||
        datasetReturnView === "compare" ||
        datasetReturnView === "insights"
      ) {
        return selectedCountryIso3;
      }
      return null;
    }

    if (view === "element-detail") {
      return selectedElementCountryIso3;
    }

    if (view === "country" || view === "insights") {
      return selectedCountryIso3;
    }

    return null;
  })();

  const planningContextTechnologyId =
    (view === "explorer" ||
      view === "element-detail" ||
      view === "country" ||
      view === "insights" ||
      (view === "dataset-detail" &&
        ["explorer", "country", "insights"].includes(datasetReturnView))) &&
    technologyId !== "all" &&
    CLIMATE_TECHNOLOGY_BY_ID.has(technologyId)
      ? technologyId
      : null;

  const showPlanningContext = Boolean(
    planningContextCountryIso3 || planningContextTechnologyId
  );

  function openExplorerFromPlanningContext() {
    markNextNavigationAsPush();
    setQuery("");
    setSourceOrganization("all");
    setExplorerCountryIso3(
      planningContextCountryIso3 &&
        hasCountryDataProviderV122(planningContextCountryIso3)
        ? planningContextCountryIso3
        : "all"
    );
    setCategory("all");
    setTechnologyId(planningContextTechnologyId ?? "all");
    setExplorerGroup(null);
    setSelectedDatasetId(null);
    setSelectedCountryIso3(null);
    setView("explorer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCountryFromPlanningContext() {
    if (
      !planningContextCountryIso3 ||
      !isValidPriorityCountry(planningContextCountryIso3)
    ) {
      return;
    }

    openExplorerFromGlobalSearch(
      "",
      planningContextCountryIso3,
      planningContextTechnologyId
    );
  }

  const isMapView = view === "map";

  return (
    <div className={isMapView ? "app app--map" : "app"}>
      <Header
        currentView={view}
        onNavigate={navigate}
        onOpenElement={openElement}
        onOpenMapElement={openElementOnMap}
        onOpenDownload={(elementId, countryIso3) =>
          openElementDownload(elementId, countryIso3, null)
        }
        onExploreSearch={openExplorerFromGlobalSearch}
      />

      {showPlanningContext && (
        <PlanningContextBarV42
          currentView={view}
          countryIso3={planningContextCountryIso3}
          technologyId={planningContextTechnologyId}
          onOpenExplorer={openExplorerFromPlanningContext}
          onOpenCountry={openCountryFromPlanningContext}
        />
      )}

      <main
        ref={mainRef}
        tabIndex={-1}
        className={isMapView ? "app-main app-main--map" : "app-main"}
      >
        {view === "home" && (
          <HomePage
            query={query}
            onQueryChange={setQuery}
            onSubmit={submitSearch}
            onSelectCategory={selectCategory}
            onOpenElement={openElement}
            onNavigate={navigate}
          />
        )}

        {view === "explorer" && (
          <DataExplorerPage
            query={query}
            countryIso3={explorerCountryIso3}
            sourceOrganization={sourceOrganization}
            category={category}
            technologyId={technologyId}
            selectedGroup={explorerGroup}
            onQueryChange={setQuery}
            onCountryChange={setExplorerCountryIso3}
            onSourceOrganizationChange={setSourceOrganization}
            onCategoryChange={setCategory}
            onTechnologyChange={setTechnologyId}
            onGroupChange={setExplorerGroup}
            onOpenDownload={(elementId, itemCountryIso3) =>
              openElementDownload(elementId, itemCountryIso3, null)
            }
            onOpenElement={openElement}
            onOpenMapElement={openElementOnMap}
          />
        )}

        {view === "element-detail" && (
          <CountryDataElementPage
            elementId={selectedElementId}
            countryIso3={selectedElementCountryIso3}
            onBack={returnFromElement}
            backLabel={
              explorerGroup
                ? "데이터 그룹으로 돌아가기"
                : "검색 결과로 돌아가기"
            }
            onOpenDownload={(elementId, countryIso3, datasetId) =>
              openElementDownload(elementId, countryIso3, datasetId)
            }
            onOpenElement={openElement}
            onOpenMapElement={openElementOnMap}
            selectorState={dataFinderSelectorState}
            onSelectorStateChange={(nextState) =>
              setDataFinderSelectorState((current) =>
                dataFinderSelectorStatesEqualV125(current, nextState)
                  ? current
                  : nextState
              )
            }
            onCountryChange={(iso3) => {
              if (!hasCountryDataProviderV122(iso3)) return;

              setSelectedElementCountryIso3(iso3);
              setSelectedCountryIso3(iso3);
            }}
          />
        )}

        {view === "map" && (
          <Suspense fallback={<DeferredPageFallback label="데이터 지도를 준비하고 있습니다" />}>
            <RealMapExplorerPage
              onOpenElement={openElement}
              onOpenDataFinder={() =>
                openExplorerFromGlobalSearch("", "VNM", null)
              }
              onOpenDownload={(elementId, iso3) => {
                if (iso3) setSelectedCountryIso3(iso3);
                setDownloadCountryIso3(iso3);
                setDownloadElementId(elementId);
                setSelectedDatasetId(null);
                setView("download");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              initialState={{
                ...mapViewState,
                countryIso3: mapViewState.countryIso3 ?? selectedCountryIso3,
              }}
              onStateChange={handleMapStateChange}
              selectorState={dataFinderSelectorState}
              onSelectorStateChange={setDataFinderSelectorState}
            />
          </Suspense>
        )}

        {view === "download" && (
          <DownloadPage
            initialDatasetId={selectedDatasetId}
            initialElementId={downloadElementId}
            initialCountryIso3={downloadCountryIso3}
          />
        )}

        {view === "guide" && <DataGuidePage onNavigate={navigate} />}

        {view === "not-found" && <NotFoundPage onNavigate={navigate} />}
      </main>

      {!isMapView && <Footer onNavigate={navigate} />}
    </div>
  );
}
