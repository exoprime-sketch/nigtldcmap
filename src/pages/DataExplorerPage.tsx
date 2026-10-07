import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  countryCatalogKeyV122,
  loadCatalogForCountrySelectionV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  expandQueryV170,
  matchDatasetV170,
  TIER_NOTES_V170,
  tierLabelV170,
} from "../data/search/searchMatchV170";
import type { DatasetMatchV170, MatchFieldV170, MatchTierV170, RecordTextsV170 } from "../data/search/searchMatchV170";
import { loadSearchRecordsV170, loadSearchTopicsV170, topicForQueryV170 } from "../data/search/searchAssetsV170";
import type { TopicV170 } from "../data/search/searchAssetsV170";
import TopicPanelV170 from "../components/search/TopicPanelV170";
import MatchEvidenceV170 from "../components/search/MatchEvidenceV170";
import { loadAllDatasetSpecsV159 } from "../data/spec/datasetSpecV159";
import type { DatasetSpecRowV159 } from "../data/spec/specTypesV159";
import { useCountryDataProvidersV158 } from "../data/countries/useCountryDataProvidersV158";
import CountryOptionsV165 from "../components/country/CountryOptionsV165";
import type { CountryCatalogItemV122 } from "../data/countries/countryDataTypesV122";
import { publicDownloadStatusV128 } from "../data/publicPlatformV128";
import { loadCardSummariesV140 } from "../data/cardSummariesV140";
import type { CardSummaryV140 } from "../data/cardSummariesV140";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import FinderCardSummaryV140 from "../components/catalog/FinderCardSummaryV140";
import {
  ensureElementVisualizationSummariesV158,
  getElementVisualizationSummaryV125,
} from "../data/visualization/elementVisualizationRegistryV125";
import type { CategoryCode } from "../data/publicTaxonomy";
import { categoryOptionsV164, finderResetValuesV164 } from "../data/finderFiltersV164";
import { itemHasProviderV164, providerFilterOptionsV164, providerLineV164 } from "../data/providerNamesV164";
import { publicItemNameV164 } from "../data/spec/publicItemNameV164";
import {
  PublicTermHelpV134,
  PublicTermTextV134,
} from "../components/help/PublicTermV134";
import {
  normalizedSearchV121,
  technologyLabelV121,
} from "../utils/vietnamActualV121";
import { matchesTechnologyV153, normalizeTechnologyIdV153, normalizeTechnologyIdsV153, technologyOptionsV153 } from "../utils/technologyIdV153";
import { getCardSpecForCountryV158, getTypologyForCountryV158, isCountrySpecificElementV158 } from "../data/spec/countrySpecV158";
import { statusNoticeLabelV159 } from "../components/data/templates/StatusNoticeV159";
import { DISPLAY_TYPE_LABELS_V159, DISPLAY_TYPE_MARKS_V159, PRIMARY_USERS_V159 } from "../data/spec/specTypesV159";
import type { DisplayTypeV159 } from "../data/spec/specTypesV159";
import DatasetCardTitleV159 from "../components/data/description/DatasetCardTitleV159";
import { USAGE_API_AVAILABLE_V149, usePublicUsageV149 } from "../data/publicUsageV149";
import { compareFinderItemsV160, finderSortNoteV164, isPreparingStatusV160 } from "../data/finderSortV160";
import "../styles/country-data-platform-v122.css";
import "../styles/search-v170.css";

interface DataExplorerPageProps {
  query: string;
  countryIso3: string;
  sourceOrganization: string;
  category: CategoryCode | "all";
  technologyId: string;
  selectedGroup: string | null;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSourceOrganizationChange: (value: string) => void;
  onCategoryChange: (value: CategoryCode | "all") => void;
  onTechnologyChange: (value: string) => void;
  onGroupChange: (value: string | null) => void;
  onOpenDownload: (elementId: string, countryIso3: string) => void;
  onOpenElement: (
    elementId: string,
    countryIso3: string,
    selection?: DataFinderSelectorStateV125
  ) => void;
  onOpenMapElement?: (elementId: string, countryIso3: string) => void;
  /** V160-R (R-10): list order - by name (default) or by detail views. */
  sort?: "name" | "views";
  onSortChange?: (value: "name" | "views") => void;
}

const INITIAL_VISIBLE_COUNT = 24;
const VISIBLE_BATCH_SIZE_V136 = 24;

/**
 * V136 finder restoration.
 *
 * Returning from a dataset should put the reader back where they were, not at
 * the top of a 24-item list they already scrolled past. The revealed count and
 * scroll offset live in sessionStorage keyed by the active filter state, so a
 * new search starts clean while a back navigation resumes.
 */
const FINDER_RESTORE_KEY_V136 = "cdp-finder-restore-v136";

type FinderRestoreStateV136 = {
  filterKey: string;
  baseKey?: string;
  yearFilter?: string;
  sortMode?: FinderSortModeV128;
  deliveryFilter?: FinderDeliveryFilterV140;
  filtersExpanded?: boolean;
  /** V170: the relevance group shown, the folded group, and 관련도순 off. */
  tierFilter?: TierFilterV170;
  tier3Open?: boolean;
  relevanceOff?: boolean;
  visibleCount: number;
  scrollY: number;
};
let finderMemoryV149: FinderRestoreStateV136 | null = null;

function readFinderRestoreV136(): FinderRestoreStateV136 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FINDER_RESTORE_KEY_V136);
    if (!raw) return finderMemoryV149;
    const parsed = JSON.parse(raw) as FinderRestoreStateV136;
    if (typeof parsed?.filterKey !== "string") return null;
    if (!Number.isFinite(parsed.visibleCount)) return null;
    return parsed;
  } catch {
    return finderMemoryV149;
  }
}

function writeFinderRestoreV136(state: FinderRestoreStateV136): void {
  finderMemoryV149 = state;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FINDER_RESTORE_KEY_V136, JSON.stringify(state));
  } catch {
    // A full or blocked session store only costs the restore, never the list.
  }
}

/**
 * The lifecycle of putting a reader back where they were.
 *
 * `idle`    nothing to restore, so the list is already where it belongs.
 * `pending` the remembered rows and offset are still being reinstated.
 * `settled` the rows are rendered and the offset is actually held.
 *
 * The finder publishes this on its results root because "restored" is a state
 * of the product, not of a timer: a reader on a slow connection is still being
 * moved back long after a fixed delay would have declared success.
 */
type FinderRestoreLifecycleV136 = "idle" | "pending" | "settled";

/** Sub-pixel layout rounding moves the offset by a fraction, not by a row. */
const RESTORE_SCROLL_TOLERANCE_PX_V136 = 4;
/** Held across consecutive frames, so a value read mid-relayout cannot settle. */
const RESTORE_STABLE_FRAMES_V136 = 3;
/** A backstop against a list that never grows tall enough, not a completion rule. */
const RESTORE_TIMEOUT_MS_V136 = 15_000;

/**
 * `html` carries `scroll-behavior: smooth`, and `behavior: "auto"` defers to
 * it, so an offset restored the ordinary way rides an easing curve for a
 * second or more and reports whatever position the curve has reached. Coming
 * back to a list is not a journey, so ask for the one behaviour that overrides
 * the stylesheet. The DOM types in this toolchain predate `"instant"`.
 */
type ScrollBehaviorV136 = ScrollBehavior | "instant";

function scrollToInstantV136(top: number): void {
  const options: { top: number; behavior: ScrollBehaviorV136 } = {
    top,
    behavior: "instant",
  };
  window.scrollTo(options as ScrollToOptions);
}

/** How far the document can actually be scrolled right now. */
function maxScrollYV136(): number {
  const scroller = document.scrollingElement || document.documentElement;
  return Math.max(0, scroller.scrollHeight - window.innerHeight);
}
type FinderSortModeV128 = "name" | "views";
/** V170: with a query the list is ordered by relevance unless the reader picks another order. */
type FinderSortModeV170 = FinderSortModeV128 | "relevance";
type TierFilterV170 = "all" | MatchTierV170;

/** The name the card shows (V159 base name, else the catalogue title) - the key of 가나다순. */
function finderDisplayTitleV160(item: CountryCatalogItemV122): string {
  return publicItemNameV164(item);
}
/** A dataset not yet delivered is listed last, marked '데이터 준비 중'. */
function isPreparingV160(item: CountryCatalogItemV122): boolean {
  return isPreparingStatusV160(item.publicStatus);
}

/**
 * V140: the finder is where a reader finds the datasets the map draws and the
 * files they can take away; the home only points here. The filter reads the
 * same catalogue flags the card buttons read, so "지도 제공" lists exactly the
 * cards with a 지도에서 보기 button.
 */
type FinderDeliveryFilterV140 = "all" | "map" | "download";

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim())))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function latestYearLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "";
  }
  return String(value);
}

function referenceYearRangeV125(item: CountryCatalogItemV122): string {
  const years = item.raw.referenceYears
    .flatMap((value) => String(value).match(/\b(?:19|20)\d{2}\b/g) || [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  // V161: no stated period - the card leaves the row out, no placeholder.
  if (years.length === 0) return latestYearLabel(item.latestYear) || "";
  return years[0] === years[years.length - 1]
    ? String(years[0])
    : `${years[0]}–${years[years.length - 1]}`;
}

export default function DataExplorerPage({
  query,
  countryIso3,
  sourceOrganization,
  category,
  technologyId,
  selectedGroup,
  onQueryChange,
  onCountryChange,
  onSourceOrganizationChange,
  onCategoryChange,
  onTechnologyChange,
  onGroupChange,
  onOpenDownload,
  onOpenElement,
  onOpenMapElement,
  sort = "name",
  onSortChange,
}: DataExplorerPageProps) {
  const baseKey = JSON.stringify([countryIso3, normalizedSearchV121(query), category, selectedGroup, sourceOrganization, technologyId]);
  const [initialRestore] = useState(() => {
    const saved = readFinderRestoreV136();
    return saved?.baseKey === baseKey ? saved : null;
  });
  const [catalog, setCatalog] = useState<CountryCatalogItemV122[]>([]);
  // V170: public record text per dataset (search assets v170), keyed
  // `${iso3}::${elementId}`; the old full-text index (with working notes) is
  // no longer read by the finder.
  const [searchIndex, setSearchIndex] = useState(new Map<string, RecordTextsV170>());
  const [specRows, setSpecRows] = useState<Map<string, DatasetSpecRowV159> | null>(null);
  const [topics, setTopics] = useState<TopicV170[]>([]);
  const [relevanceOff, setRelevanceOff] = useState(initialRestore?.relevanceOff || false);
  const [tierFilter, setTierFilter] = useState<TierFilterV170>(initialRestore?.tierFilter || "all");
  const [tier3Open, setTier3Open] = useState(initialRestore?.tier3Open || false);
  const [loading, setLoading] = useState(true);
  const [searchIndexLoading, setSearchIndexLoading] = useState(false);
  const [searchIndexLoadedFor, setSearchIndexLoadedFor] = useState("");
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState(initialRestore?.yearFilter || "all");
  // 조회순 reads the usage counts the home already uses; without that service
  // (a static host) the option is disabled and the list stays in name order.
  const usage = usePublicUsageV149(countryIso3 || "all");
  const viewsAvailable = USAGE_API_AVAILABLE_V149 && usage !== null;
  const sortMode: FinderSortModeV128 = sort === "views" && viewsAvailable ? "views" : "name";
  const viewCounts = useMemo(
    () => new Map((usage?.detail || []).map((row) => [row.elementId, row.count])),
    [usage]
  );
  // V164-4: 조회순 with no counted views lists in 가나다순 - the page says so
  // (the home says the same) instead of reordering silently.
  const sortNote = finderSortNoteV164(sortMode, viewCounts);
  // V159: who the dataset serves (from its use cases) and its display type.
  const [userFilter, setUserFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<DisplayTypeV159 | "all">("all");
  const [deliveryFilter, setDeliveryFilter] =
    useState<FinderDeliveryFilterV140>(initialRestore?.deliveryFilter || "all");
  const [filtersExpanded, setFiltersExpanded] = useState(initialRestore?.filtersExpanded || false);
  const leavingRef = useRef(false);
  const [summariesReady, setSummariesReady] = useState(false);
  // V140: one pre-built file summarises all 152 datasets; a card never opens
  // its pack. Without the file the cards still list, without a summary.
  const [cardSummaries, setCardSummaries] = useState<Map<string, CardSummaryV140> | null>(null);
  // V158: the offered countries, again once the registry has been read.
  const providers = useCountryDataProvidersV158();
  const providerCountriesV158 = Array.from(new Set(providers.map((provider) => provider.countryIso3))).join(",");
  // V158: each live country has its own summaries file; the cards read them
  // under `${country}::${elementId}`.
  useEffect(() => {
    let cancelled = false;
    const countries = providerCountriesV158.split(",").filter(Boolean);
    // Year ranges read each country's semantic summaries (the default
    // country's are bundled); they are in memory before the cards re-render.
    void Promise.allSettled(countries.map((iso3) => ensureElementVisualizationSummariesV158(iso3)))
      .then(() =>
        Promise.allSettled(
          countries.map((iso3) => loadCardSummariesV140(iso3).then((value) => [iso3, value] as const))
        )
      )
      .then((results) => {
        if (cancelled) return;
        const merged = new Map<string, CardSummaryV140>();
        results.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const [iso3, value] = result.value;
          value.forEach((card, elementId) => merged.set(`${iso3}::${elementId}`, card));
        });
        if (merged.size > 0) setCardSummaries(merged);
      })
      .finally(() => { if (!cancelled) setSummariesReady(true); });
    return () => {
      cancelled = true;
    };
  }, [providerCountriesV158]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [autoLoading, setAutoLoading] = useState(false);
  const sentinelRefV136 = useRef<HTMLDivElement | null>(null);
  const restoreAppliedRefV136 = useRef(false);
  const restoreScrollRefV136 = useRef<number | null>(null);
  const restoreCountRefV136 = useRef(0);
  const [restoreStateV136, setRestoreStateV136] =
    useState<FinderRestoreLifecycleV136>("idle");
  // Read from the persist cleanup, which closes over stale render values.
  const restorePendingRefV136 = useRef(false);
  restorePendingRefV136.current = restoreStateV136 === "pending";

  const normalizedCountry = countryIso3 === "all" ? "all" : countryIso3;
  const normalizedQuery = normalizedSearchV121(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setCatalog([]);
    setSearchIndex(new Map());
    setSearchIndexLoadedFor("");
    void loadCatalogForCountrySelectionV122(normalizedCountry)
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          console.error("Country catalog load failed", reason);
          setError(publicCountryDataErrorMessageV122(reason));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedCountry]);

  // The index covers the selected country, or every offered country for
  // "전체" - so it is reloaded when the offered list itself arrives.
  const searchScopeV170 = normalizedCountry === "all" ? `all|${providerCountriesV158}` : normalizedCountry;
  useEffect(() => {
    if (
      !normalizedQuery ||
      searchIndexLoadedFor === searchScopeV170
    ) {
      return;
    }
    let cancelled = false;
    setSearchIndexLoading(true);
    const countries =
      normalizedCountry === "all" ? providerCountriesV158.split(",").filter(Boolean) : [normalizedCountry];
    void Promise.all([
      Promise.all(countries.map((iso3) => loadSearchRecordsV170(iso3).then((records) => [iso3, records] as const))),
      loadAllDatasetSpecsV159().catch(() => new Map<string, DatasetSpecRowV159>()),
    ])
      .then(([perCountry, spec]) => {
        if (cancelled) return;
        const next = new Map<string, RecordTextsV170>();
        perCountry.forEach(([iso3, records]) =>
          records.forEach((entry, elementId) => next.set(`${iso3.toUpperCase()}::${elementId}`, entry))
        );
        setSearchIndex(next);
        setSpecRows(spec);
        setSearchIndexLoadedFor(searchScopeV170);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          console.error("Country search index load failed", reason);
          setError(
            publicCountryDataErrorMessageV122(
              reason,
              "검색 데이터를 불러오지 못했습니다"
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSearchIndexLoading(false);
      });
    return () => {
      cancelled = true;
      // A run that is replaced never reports back; the next one, if it goes
      // ahead, says it is loading again (a cleared query must not keep the note).
      setSearchIndexLoading(false);
    };
  }, [
    normalizedCountry,
    normalizedQuery,
    providerCountriesV158,
    searchIndexLoadedFor,
    searchScopeV170,
  ]);

  // V170 ①: the topic panel's rows for the selected country.
  useEffect(() => {
    if (normalizedCountry === "all") {
      setTopics([]);
      return;
    }
    let cancelled = false;
    void loadSearchTopicsV170(normalizedCountry).then((list) => {
      if (!cancelled) setTopics(list);
    });
    return () => {
      cancelled = true;
    };
  }, [normalizedCountry]);

  // A new query starts with every group shown and the last one folded (a
  // return trip keeps the groups it left with).
  const queryScopeV170 = `${normalizedCountry}|${normalizedQuery}`;
  const queryScopeRefV170 = useRef(queryScopeV170);
  useEffect(() => {
    if (queryScopeRefV170.current === queryScopeV170) return;
    queryScopeRefV170.current = queryScopeV170;
    setTierFilter("all");
    setTier3Open(false);
  }, [queryScopeV170]);

  const expandedQuery = useMemo(() => expandQueryV170(query), [query]);
  const sortModeV170: FinderSortModeV170 = normalizedQuery && !relevanceOff ? "relevance" : sortMode;

  const availableCatalog = useMemo(
    () => catalog.filter((item) => item.isDiscoverable),
    [catalog]
  );

  const groups = useMemo(
    () =>
      unique(
        availableCatalog
          .filter(
            (item) => category === "all" || item.categoryCode === category
          )
          .map((item) => item.groupCode)
      ).map((code) => ({
        code,
        label:
          availableCatalog.find((item) => item.groupCode === code)
            ?.groupLabel || code,
      })),
    [availableCatalog, category]
  );

  const years = useMemo(
    () =>
      unique(availableCatalog.map((item) => latestYearLabel(item.latestYear)))
        .filter(Boolean)
        .sort((a, b) => Number(b) - Number(a)),
    [availableCatalog]
  );
  // V164-4: organisation names, not the source strings as compiled (boundary
  // clauses, '|' lists, one organisation under several spellings).
  const sources = useMemo(
    () => providerFilterOptionsV164(availableCatalog),
    [availableCatalog]
  );
  // V164-4: the 대분류 names the cards, the detail and the download list print.
  const categoryOptions = useMemo(() => categoryOptionsV164(availableCatalog), [availableCatalog]);
  // V153: one option per technology whatever spelling the elements carry.
  const technologies = useMemo(
    () => technologyOptionsV153(availableCatalog),
    [availableCatalog]
  );
  const selectedTechnology = normalizeTechnologyIdV153(technologyId) ?? "all";

  // V170: what a dataset's own text says, for the relevance groups.
  const fieldsForV170 = (item: CountryCatalogItemV122): MatchFieldV170[] => {
    const card = getCardSpecForCountryV158(item.elementId, item.countryIso3, item);
    // The shared spec describes the element; a country-specific element uses its own card text only.
    const spec = item.countryIso3 === "VNM" || !isCountrySpecificElementV158(item.elementId)
      ? specRows?.get(item.elementId.toUpperCase()) ?? null
      : null;
    return [
      { label: "이름", text: card?.baseName || publicItemNameV164(item), weight: 400 },
      { label: "자료명", text: item.publicTitle, weight: 380 },
      { label: "정의", text: card?.shortDefinitionCard || "", weight: 300 },
      { label: "설명", text: item.publicDescription, weight: 260 },
      { label: "설명", text: spec?.description || "", weight: 250 },
      { label: "활용 방법", text: spec?.usage || "", weight: 200 },
      { label: "분류", text: [item.categoryLabel, item.sectionLabel, item.groupLabel].filter(Boolean).join(" · "), weight: 150 },
      { label: "제공기관", text: [card?.sourceLabel, ...item.sourceOrganizations].filter(Boolean).join(" · "), weight: 120, exact: true },
      { label: "국가", text: item.countryNameKo, weight: 50, exact: true },
    ];
  };

  const searchResultV170 = useMemo(() => {
    const matches = new Map<string, DatasetMatchV170>();
    const matching = availableCatalog.filter((item) => {
      if (category !== "all" && item.categoryCode !== category) return false;
      if (selectedGroup && item.groupCode !== selectedGroup) return false;
      if (
        yearFilter !== "all" &&
        latestYearLabel(item.latestYear) !== yearFilter
      ) {
        return false;
      }
      if (sourceOrganization !== "all" && !itemHasProviderV164(item, sourceOrganization)) {
        return false;
      }
      if (!matchesTechnologyV153(item.technologyIds, selectedTechnology)) {
        return false;
      }
      if (deliveryFilter === "map" && !item.hasMapData) return false;
      if (userFilter !== "all" || typeFilter !== "all") {
        const card = getCardSpecForCountryV158(item.elementId, item.countryIso3, item);
        if (userFilter !== "all" && !card?.users.includes(userFilter)) return false;
        if (typeFilter !== "all" && card?.displayType !== typeFilter) return false;
      }
      if (
        deliveryFilter === "download" &&
        publicDownloadStatusV128(item).key !== "downloadable"
      ) {
        return false;
      }
      if (normalizedQuery) {
        const match = matchDatasetV170(
          expandedQuery,
          fieldsForV170(item),
          searchIndex.get(`${item.countryIso3.toUpperCase()}::${item.elementId}`),
          normalizeTechnologyIdsV153(item.technologyIds).map(technologyLabelV121)
        );
        if (!match) return false;
        matches.set(countryCatalogKeyV122(item.providerId, item.elementId), match);
      }
      return true;
    });

    const key = (item: CountryCatalogItemV122) => ({ elementId: item.elementId, title: finderDisplayTitleV160(item), publicStatus: item.publicStatus });
    if (sortModeV170 === "relevance") {
      const matchOf = (item: CountryCatalogItemV122) => matches.get(countryCatalogKeyV122(item.providerId, item.elementId));
      // Group by tier first so each group is one block on screen; inside a
      // group a dataset still being prepared goes last, as in 가나다순.
      matching.sort((left, right) => {
        const a = matchOf(left);
        const b = matchOf(right);
        const tier = (a?.tier ?? 3) - (b?.tier ?? 3);
        if (tier !== 0) return tier;
        const preparing = Number(isPreparingV160(left)) - Number(isPreparingV160(right));
        if (preparing !== 0) return preparing;
        const score = (b?.score ?? 0) - (a?.score ?? 0);
        if (score !== 0) return score;
        return compareFinderItemsV160(key(left), key(right), "name", viewCounts);
      });
    } else {
      matching.sort((left, right) => compareFinderItemsV160(key(left), key(right), sortMode, viewCounts));
    }
    return { list: matching, matches };
    // fieldsForV170 reads specRows, listed below.
  }, [
    expandedQuery,
    specRows,
    sortModeV170,
    availableCatalog,
    category,
    deliveryFilter,
    normalizedQuery,
    searchIndex,
    selectedGroup,
    sortMode,
    sourceOrganization,
    selectedTechnology,
    viewCounts,
    typeFilter,
    userFilter,
    yearFilter,
  ]);
  const filtered = searchResultV170.list;
  const matchesV170 = searchResultV170.matches;
  const matchOfV170 = (item: CountryCatalogItemV122) => matchesV170.get(countryCatalogKeyV122(item.providerId, item.elementId)) ?? null;
  const relevanceView = sortModeV170 === "relevance" && Boolean(normalizedQuery);
  const tierCountsV170 = useMemo(() => {
    const counts: Record<MatchTierV170, number> = { 1: 0, 2: 0, 3: 0 };
    matchesV170.forEach((match) => {
      counts[match.tier] += 1;
    });
    return counts;
  }, [matchesV170]);
  // V170 ②: one group at a time, or all with the technology-label group folded.
  const displayed = useMemo(() => {
    if (!normalizedQuery) return filtered;
    return filtered.filter((item) => {
      const tier = matchesV170.get(countryCatalogKeyV122(item.providerId, item.elementId))?.tier ?? 3;
      if (tierFilter !== "all") return tier === tierFilter;
      return !(relevanceView && tier === 3 && !tier3Open);
    });
  }, [filtered, matchesV170, normalizedQuery, relevanceView, tier3Open, tierFilter]);
  // V170 ①: the panel answers a plain topic search for one country; once the
  // reader narrows the list with another filter, the list alone is shown.
  const noOtherFiltersV170 =
    category === "all" &&
    !selectedGroup &&
    sourceOrganization === "all" &&
    selectedTechnology === "all" &&
    yearFilter === "all" &&
    deliveryFilter === "all" &&
    userFilter === "all" &&
    typeFilter === "all";
  const topicV170 =
    normalizedQuery && normalizedCountry !== "all" && noOtherFiltersV170
      ? topicForQueryV170(topics, expandedQuery.groupIds)
      : null;
  // The panel's rows are the topic's datasets offered for the country; a
  // related one need not hold the query word (송배전 손실률 for 전력망).
  const topicItemsV170 = useMemo(() => {
    const items = new Map<string, CountryCatalogItemV122>();
    if (!topicV170) return items;
    availableCatalog.forEach((item) => {
      if (item.countryIso3 === normalizedCountry) items.set(item.elementId, item);
    });
    return items;
  }, [availableCatalog, normalizedCountry, topicV170]);
  const topicCountryNameV170 =
    availableCatalog.find((item) => item.countryIso3 === normalizedCountry)?.countryNameKo || "";
  const sectionedV170 = relevanceView && tierFilter === "all";

  const filterKeyV136 = [
    normalizedCountry,
    normalizedQuery,
    category,
    selectedGroup,
    sourceOrganization,
    sortMode,
    technologyId,
    yearFilter,
    deliveryFilter,
    sortModeV170,
    tierFilter,
  ].join("|");

  useEffect(() => {
    // The first pass after mount may be a back navigation. Restore only when
    // the reader is looking at the same filtered list they left.
    if (!restoreAppliedRefV136.current) {
      restoreAppliedRefV136.current = true;
      const restored = readFinderRestoreV136();
      if (restored && restored.filterKey === filterKeyV136) {
        const rows = Math.max(INITIAL_VISIBLE_COUNT, restored.visibleCount);
        setVisibleCount(rows);
        restoreCountRefV136.current = rows;
        restoreScrollRefV136.current = Number.isFinite(restored.scrollY)
          ? Math.max(0, restored.scrollY)
          : 0;
        setRestoreStateV136("pending");
        return;
      }
    }
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    restoreScrollRefV136.current = null;
    restoreCountRefV136.current = 0;
    setRestoreStateV136("idle");
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [filterKeyV136]);

  const visibleItems = displayed.slice(0, visibleCount);
  const hasMoreV136 = visibleCount < displayed.length;

  function rememberFinder(): void {
    if (restorePendingRefV136.current || leavingRef.current) return;
    writeFinderRestoreV136({ filterKey: filterKeyV136, baseKey, yearFilter, sortMode, deliveryFilter,
      filtersExpanded, tierFilter, tier3Open, relevanceOff, visibleCount, scrollY: Math.round(window.scrollY) });
  }

  // Record where the reader is so a return trip can resume there.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const persist = () => {
      // Mid-restore the list is briefly short and the offset briefly zero.
      // Writing that back would spend the reader's remembered place to record
      // the act of returning to it.
      if (restorePendingRefV136.current || leavingRef.current || loading) return;
      writeFinderRestoreV136({
        filterKey: filterKeyV136,
        baseKey, yearFilter, sortMode, deliveryFilter, filtersExpanded,
        tierFilter, tier3Open, relevanceOff,
        visibleCount,
        scrollY: Math.round(window.scrollY),
      });
    };
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(persist); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      // Never save on unmount: the next route has already changed page height.
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [filterKeyV136, baseKey, yearFilter, sortMode, deliveryFilter, filtersExpanded, tierFilter, tier3Open, relevanceOff, visibleCount, loading]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Reveal the next batch as the end of the list approaches. An observer keeps
  // this off the scroll event loop, so no layout is measured per frame.
  useEffect(() => {
    const sentinel = sentinelRefV136.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    if (!hasMoreV136) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setAutoLoading(true);
        setVisibleCount((current) =>
          current >= displayed.length
            ? current
            : Math.min(displayed.length, current + VISIBLE_BATCH_SIZE_V136)
        );
      },
      { rootMargin: "700px 0px 900px 0px" }
    );
    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [displayed.length, hasMoreV136, visibleCount]);

  useEffect(() => {
    setAutoLoading(false);
  }, [visibleCount]);

  // Put the reader back at the offset they left from.
  //
  // The offset only exists once the document is tall enough to hold it. Until
  // the restored rows have laid out, `scrollTo` silently clamps to the current
  // bottom of a shorter page and the reader lands a row short — which is what a
  // slow machine reliably produces and a fast one hides. So this waits for the
  // document to actually reach the offset, then confirms it is being held,
  // rather than scrolling hopefully for a fixed span of time.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoreStateV136 !== "pending") return;

    const target = restoreScrollRefV136.current;
    if (target === null || target <= 0) {
      setRestoreStateV136("settled");
      return;
    }

    // A searched list keeps changing until its index arrives, so an empty
    // result mid-load is not yet an answer about how tall the page will be.
    const listReady =
      !loading && summariesReady &&
      (!normalizedQuery || searchIndexLoadedFor === searchScopeV170);
    if (!listReady) return;
    if (displayed.length === 0) {
      setRestoreStateV136("settled");
      return;
    }

    // The remembered rows are what give the document its height, so there is
    // nothing to measure until they are rendered. Waiting out here rather than
    // inside the loop also keeps the backstop below measuring the restore
    // itself, not however long the catalog took to arrive.
    const rowsWanted = Math.min(restoreCountRefV136.current, displayed.length);
    if (visibleItems.length < rowsWanted) return;

    let frame = 0;
    let stableFrames = 0;
    const startedAt = Date.now();

    const step = (): void => {
      if (maxScrollYV136() + RESTORE_SCROLL_TOLERANCE_PX_V136 < target) {
        // Still shorter than the offset. Scrolling now would clamp, so wait for
        // the remaining layout instead of recording a position we cannot hold.
        stableFrames = 0;
      } else if (
        Math.abs(window.scrollY - target) > RESTORE_SCROLL_TOLERANCE_PX_V136
      ) {
        stableFrames = 0;
        scrollToInstantV136(target);
      } else if (++stableFrames >= RESTORE_STABLE_FRAMES_V136) {
        restoreScrollRefV136.current = null;
        setRestoreStateV136("settled");
        return;
      }

      if (Date.now() - startedAt >= RESTORE_TIMEOUT_MS_V136) {
        // The list never grew to the remembered offset. End the lifecycle
        // honestly at wherever the reader actually is rather than waiting out
        // a page that is not coming.
        restoreScrollRefV136.current = null;
        setRestoreStateV136("settled");
        return;
      }
      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [
    displayed.length,
    loading,
    summariesReady,
    normalizedCountry,
    normalizedQuery,
    restoreStateV136,
    searchIndexLoadedFor,
    searchScopeV170,
    visibleItems.length,
  ]);
  const showCountryContext =
    providers.length > 1 || normalizedCountry === "all";

  function resetFilters(): void {
    // V164-4: the country is the page's scope and stays; "전체" would mix in
    // the other country's datasets.
    const values = finderResetValuesV164(countryIso3);
    onQueryChange(values.query);
    if (values.countryIso3 !== countryIso3) onCountryChange(values.countryIso3);
    onCategoryChange(values.category);
    onGroupChange(values.group);
    onSourceOrganizationChange(values.sourceOrganization);
    onTechnologyChange(values.technologyId);
    setYearFilter(values.year);
    setDeliveryFilter(values.delivery);
    setUserFilter(values.user);
    setTypeFilter(values.type);
  }

  return (
    <div className="page-shell cdp-page" onClickCapture={(event) => {
      if ((event.target as HTMLElement).closest(".cdp-card__actions button, .tp170__actions button")) {
        rememberFinder();
        leavingRef.current = true;
      }
    }}>
      <section className="cdp-hero">
        <h1>데이터 찾기</h1>
        <p>주제, 기관, 기술, 지역으로 데이터를 검색할 수 있습니다</p>
      </section>

      <section className="cdp-panel cdp-filter-panel" aria-label="검색조건">
        <label className="cdp-field cdp-field--wide">
          <span className="cdp-field__label">검색</span>
          <input
            className="cdp-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="어떤 데이터를 찾으시나요?"
          />
        </label>
        {/* V170 ④: the words searched along with the query (same meaning). */}
        {expandedQuery.addedTerms.length > 0 && (
          <p className="sr170-synonyms" data-testid="search-synonyms-v170">
            <span className="sr170-synonyms__label">함께 찾은 말</span>
            {expandedQuery.addedTerms.map((term) => (
              <span key={term} className="sr170-synonyms__term">{term}</span>
            ))}
          </p>
        )}

        <div className="cdp-filter-grid cdp-filter-grid--primary">
          <label className="cdp-field">
            <span className="cdp-field__label">국가</span>
            <select
              className="cdp-select"
              data-country-selector="v162"
              value={countryIso3}
              onChange={(event) => onCountryChange(event.target.value)}
            >
              <option value="all">전체</option>
              <CountryOptionsV165 providers={providers} />
            </select>
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">정렬</span>
            <select
              className="cdp-select"
              value={sortModeV170}
              data-testid="finder-sort-v160"
              onChange={(event) => {
                // V170 ②: 관련도순 is the order while a query is typed; the
                // reader can still pick 가나다순 or 조회순.
                const value = event.target.value as FinderSortModeV170;
                if (value === "relevance") {
                  setRelevanceOff(false);
                  return;
                }
                setRelevanceOff(true);
                onSortChange?.(value);
              }}
            >
              <option value="relevance" disabled={!normalizedQuery}>관련도순</option>
              <option value="name">가나다순</option>
              <option value="views" disabled={!viewsAvailable}>조회순</option>
            </select>
            {sortNote && sortModeV170 !== "relevance" ? (
              <small className="cdp-field__hint" role="status" data-testid="finder-sort-note-v164">{sortNote}</small>
            ) : null}
          </label>

          <label className="cdp-field">
            <span className="cdp-field__label">대분류</span>
            <select
              className="cdp-select"
              value={category}
              onChange={(event) => {
                onCategoryChange(event.target.value as CategoryCode | "all");
                onGroupChange(null);
              }}
            >
              <option value="all">전체</option>
              {categoryOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="cdp-field">
            <span className="cdp-field__label">데이터 그룹</span>
            <select
              className="cdp-select"
              value={selectedGroup || "all"}
              onChange={(event) =>
                onGroupChange(
                  event.target.value === "all" ? null : event.target.value
                )
              }
            >
              <option value="all">전체</option>
              {groups.map((group) => (
                <option key={group.code} value={group.code}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <details className="cdp-advanced-filters" open={filtersExpanded} onToggle={(event) => setFiltersExpanded(event.currentTarget.open)}>
          <summary>상세검색</summary>
          <div className="cdp-filter-grid cdp-filter-grid--secondary">
            <label className="cdp-field">
              <span className="cdp-field__label">자료연도</span>
              <select
                className="cdp-select"
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
              >
                <option value="all">전체</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">제공기관</span>
              <select
                className="cdp-select"
                value={sourceOrganization}
                onChange={(event) =>
                  onSourceOrganizationChange(event.target.value)
                }
              >
                <option value="all">전체</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">제공 형태</span>
              <select
                className="cdp-select"
                data-testid="finder-delivery-filter-v140"
                value={deliveryFilter}
                onChange={(event) =>
                  setDeliveryFilter(
                    event.target.value as FinderDeliveryFilterV140
                  )
                }
              >
                <option value="all">전체</option>
                <option value="map">지도 제공</option>
                <option value="download">다운로드 가능</option>
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">기후기술</span>
              <select
                className="cdp-select"
                value={selectedTechnology}
                onChange={(event) => onTechnologyChange(event.target.value)}
              >
                <option value="all">전체</option>
                {technologies.map((id) => (
                  <option key={id} value={id}>
                    {technologyLabelV121(id)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">주 사용자</span>
              <select
                className="cdp-select"
                data-testid="finder-user-filter-v159"
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
              >
                <option value="all">전체</option>
                {PRIMARY_USERS_V159.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">유형</span>
              <select
                className="cdp-select"
                data-testid="finder-type-filter-v159"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as DisplayTypeV159 | "all")}
              >
                <option value="all">전체</option>
                {(["U1", "U2", "U3", "U4", "U5", "U6"] as const).map((type) => (
                  <option key={type} value={type}>
                    {`${DISPLAY_TYPE_MARKS_V159[type]} ${DISPLAY_TYPE_LABELS_V159[type]}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <PublicTermHelpV134
            text={[
              sourceOrganization === "all" ? "" : sourceOrganization,
              selectedTechnology === "all" ? "" : technologyLabelV121(selectedTechnology),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </details>

        <div className="cdp-filter-actions">
          <button
            type="button"
            className="cdp-button cdp-button--secondary"
            onClick={resetFilters}
          >
            검색조건 초기화
          </button>
          <span className="cdp-result-count" aria-live="polite">
            {loading
              ? "불러오는 중"
              : `현재 ${filtered.length.toLocaleString("ko-KR")}개의 데이터가 있습니다`}
          </span>
          {searchIndexLoading && (
            <span className="cdp-muted">검색 범위를 확장하는 중</span>
          )}
        </div>
      </section>

      {error && (
        <div className="cdp-alert cdp-alert--error" role="alert">
          <strong>{error}</strong>
          <span>잠시 후 다시 시도해 주세요</span>
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <section className="cdp-panel cdp-empty">
          <h2>조건에 맞는 데이터가 없습니다</h2>
          <p>검색어 또는 필터를 조정해 주세요</p>
        </section>
      )}

      {/* V170 ①: the topic's datasets with their figures, before the list. */}
      {topicV170 && !loading && searchIndexLoadedFor === searchScopeV170 && (
        <TopicPanelV170
          topic={topicV170}
          countryIso3={normalizedCountry}
          countryNameKo={topicCountryNameV170}
          describe={(elementId) => {
            const item = topicItemsV170.get(elementId);
            if (!item) return null;
            const card = getCardSpecForCountryV158(item.elementId, item.countryIso3, item);
            const summary = cardSummaries?.get(`${item.countryIso3}::${item.elementId}`) ?? null;
            return {
              name: card?.baseName || publicItemNameV164(item),
              source: card?.sourceLabel || summary?.provider || providerLineV164(item.sourceOrganizations, 2),
            };
          }}
          hasMap={(elementId) => Boolean(topicItemsV170.get(elementId)?.hasMapData)}
          onOpenElement={(elementId) => {
            onOpenElement(
              elementId,
              normalizedCountry,
              cardSummaries?.get(`${normalizedCountry}::${elementId}`)?.selection ?? undefined
            );
          }}
          onOpenMapElement={
            onOpenMapElement
              ? (elementId) => onOpenMapElement(elementId, normalizedCountry)
              : undefined
          }
        />
      )}

      {/* V170 ②: the result in three groups, by where the query was found. */}
      {normalizedQuery && !loading && filtered.length > 0 && (
        <div className="sr170-tiers" data-testid="search-tiers-v170">
          <h2 className="sr170-tiers__title">
            ‘{query.trim()}’ 관련 데이터 {filtered.length.toLocaleString("ko-KR")}개
          </h2>
          {(["all", 1, 2, 3] as const).map((value) => {
            const count = value === "all" ? filtered.length : tierCountsV170[value];
            return (
              <button
                key={value}
                type="button"
                className="sr170-tier"
                aria-pressed={tierFilter === value}
                disabled={value !== "all" && count === 0}
                data-tier={value}
                onClick={() => setTierFilter(value)}
              >
                {value === "all" ? "전체" : tierLabelV170(value, query)} {count.toLocaleString("ko-KR")}
              </button>
            );
          })}
        </div>
      )}

      <section
        className="cdp-card-grid"
        aria-label="데이터 검색결과"
        aria-busy={autoLoading ? "true" : "false"}
        data-testid="finder-results-v136"
        data-visible-count={visibleItems.length}
        data-total-count={displayed.length}
        data-finder-restore-state={restoreStateV136}
      >
        {visibleItems.map((item, index) => {
          const match = normalizedQuery ? matchOfV170(item) : null;
          const tier = match?.tier ?? 3;
          const previousTier = index > 0 ? matchOfV170(visibleItems[index - 1])?.tier ?? 3 : null;
          const sectionStart = sectionedV170 && tier !== previousTier;
          const contract = getElementVisualizationSummaryV125(item.elementId, item.countryIso3);
          const downloadStatus = publicDownloadStatusV128(item);
          const semanticYearRange = contract
            ? contract.yearRange.start === null
              ? referenceYearRangeV125(item)
              : contract.yearRange.start === contract.yearRange.end
              ? String(contract.yearRange.start)
                : `${contract.yearRange.start}–${contract.yearRange.end}`
            : referenceYearRangeV125(item);
          const summary = cardSummaries?.get(`${item.countryIso3}::${item.elementId}`) ?? null;
          return (
          <Fragment key={countryCatalogKeyV122(item.providerId, item.elementId)}>
          {sectionStart && (
            <div className="sr170-section" data-testid="search-section-v170" data-tier={tier}>
              <h3>
                {tierLabelV170(tier, query)} {tierCountsV170[tier].toLocaleString("ko-KR")}개
              </h3>
              <p>{TIER_NOTES_V170[tier]}</p>
              {tier === 3 && tier3Open && (
                <button type="button" className="cdp-button cdp-button--secondary" onClick={() => setTier3Open(false)}>
                  접기
                </button>
              )}
            </div>
          )}
          <article
            className="cdp-dataset-card"
            data-element-id={item.elementId}
            data-match-tier={match ? match.tier : undefined}
            data-testid="public-finder-card-v135"
            data-card-kind={summary?.kind ?? "pending"}
          >
            <div className="cdp-card__path">
              <span>
                <PublicTermTextV134 text={item.categoryLabel} />
              </span>
              <span aria-hidden="true">›</span>
              <span>
                <PublicTermTextV134 text={item.groupLabel} />
              </span>
            </div>
            {showCountryContext && (
              <span className="cdp-country-chip">{item.countryNameKo}</span>
            )}
            {/* V159: source line, the dataset's own name and the spec's short
                definition; the catalogue's title stays the fallback. */}
            {getCardSpecForCountryV158(item.elementId, item.countryIso3, item) ? (
              <DatasetCardTitleV159 card={getCardSpecForCountryV158(item.elementId, item.countryIso3, item)!} titleAs="h2" />
            ) : (
              <>
                <h2><PublicTermTextV134 text={item.publicTitle} /></h2>
                <p className="cdp-card__description">
                  <PublicTermTextV134 text={item.publicDescription} />
                </p>
              </>
            )}
            {/* V159: an excluded or not-yet-delivered dataset shows its
                status on the card ('데이터 준비 중'), not a figure. */}
            {getCardSpecForCountryV158(item.elementId, item.countryIso3, item)?.statusNotice ? (
              <p className="cdp-card__status-v159" data-testid="finder-card-status-v159">
                <span className="cdp-chip">{statusNoticeLabelV159(getTypologyForCountryV158(item.elementId, item.countryIso3, item) || { status: "", statusNotice: null })}</span>
              </p>
            ) : (
              summary && <FinderCardSummaryV140 summary={summary} country={item.countryIso3} />
            )}
            {getCardSpecForCountryV158(item.elementId, item.countryIso3, item)?.statusNotice === "data-pending" ? (
              // V159 data-pending (spec v8): no stand-in text ("미기재",
              // "제공기관 확인"). The period line is left out - nothing has
              // been delivered - and the provider is the spec's source field,
              // or no line at all.
              getCardSpecForCountryV158(item.elementId, item.countryIso3, item)?.sourceLabel ? (
                <dl className="cdp-card__facts cdp-card__facts--public-v135" data-testid="finder-card-facts-pending-v159">
                  <div>
                    <dt>제공기관</dt>
                    <dd><PublicTermTextV134 text={getCardSpecForCountryV158(item.elementId, item.countryIso3, item)?.sourceLabel || ""} /></dd>
                  </div>
                </dl>
              ) : null
            ) : (
            <dl className="cdp-card__facts cdp-card__facts--public-v135">
              {(summary?.period && summary.kind !== "status") || semanticYearRange ? (
                <div>
                  <dt>{(summary?.period && summary.kind !== "status" && summary.periodLabel) || "자료기간"}</dt>
                  <dd>{summary?.period && summary.kind !== "status" ? <PublicTermTextV134 text={summary.period} /> : semanticYearRange}</dd>
                </div>
              ) : null}
              {/* V161: provider and organisations arrive judged (working notes
                  removed, spec source name as fallback); with nothing real left
                  the row is not shown rather than filled with a placeholder. */}
              {(summary?.provider || item.sourceOrganizations.length > 0) && (
                <div>
                  <dt>제공기관</dt>
                  <dd>
                    <PublicTermTextV134
                      text={summary?.provider || providerLineV164(item.sourceOrganizations, 2)}
                    />
                  </dd>
                </div>
              )}
            </dl>
            )}
            {match && <MatchEvidenceV170 match={match} query={query} />}
            <div className="cdp-card__actions">
              <button
                type="button"
                className="cdp-button cdp-button--primary"
                data-testid="finder-card-open-v140"
                onClick={() =>
                  onOpenElement(
                    item.elementId,
                    item.countryIso3,
                    summary?.selection ?? undefined
                  )
                }
              >
                상세보기
              </button>
              {item.hasMapData && onOpenMapElement && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() =>
                    onOpenMapElement(item.elementId, item.countryIso3)
                  }
                >
                  지도에서 보기
                </button>
              )}
              {downloadStatus.key === "downloadable" && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() =>
                    onOpenDownload(item.elementId, item.countryIso3)
                  }
                >
                  다운로드
                </button>
              )}
            </div>
          </article>
          </Fragment>
          );
        })}
        {/* V170 ②: the technology-label group stays folded until asked for. */}
        {sectionedV170 && !tier3Open && tierCountsV170[3] > 0 && !hasMoreV136 && (
          <div className="sr170-collapsed" data-testid="search-collapsed-v170">
            <div>
              <strong>
                {tierLabelV170(3, query)} {tierCountsV170[3].toLocaleString("ko-KR")}개
              </strong>
              <span>{TIER_NOTES_V170[3]}</span>
            </div>
            <button type="button" className="cdp-button cdp-button--secondary" onClick={() => setTier3Open(true)}>
              펼치기
            </button>
          </div>
        )}
      </section>

      {hasMoreV136 && (
        <div
          ref={sentinelRefV136}
          className="cdp-finder-sentinel-v136"
          data-testid="finder-scroll-sentinel-v136"
          data-remaining={displayed.length - visibleCount}
          aria-hidden="true"
        />
      )}
      {hasMoreV136 && autoLoading && (
        <p className="cdp-finder-autoload-v136" role="status" data-testid="finder-autoload-status-v136">
          데이터를 불러오는 중
        </p>
      )}
    </div>
  );
}
