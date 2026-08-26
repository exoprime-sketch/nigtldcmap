import { getSearchAliasesV99 } from "../data/operations/operationalFinalizationV99";
import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { FALLBACK_COUNTRIES } from "../data/countries";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import { DATASETS } from "../data/publicDatasets";
import type { Dataset } from "../types/dataset";
import {
  datasetCoversCountry,
  isDatasetPubliclyVisible,
} from "./datasetAccess";
import {
  datasetMatchesTechnology,
  getTechnologyDatasetCount,
} from "./technologyData";
import {
  AUTHORITATIVE_ELEMENT_SEARCH_V75,
} from "./authoritativeElementSearchV75";
import type {
  AuthoritativeElementSearchItemV75,
} from "./authoritativeElementSearchV75";
import { getOperationalSearchAliasesV97 } from "../data/operations/operationalUpdateRegistryV97";
import { getSearchAliasesV98 } from "../data/operations/operationalBatchV98";
import {
  buildElementDatasetIndexV88,
  getDatasetIdsForAuthoritativeElementV88,
} from "./elementDatasetRegistryV88";

export interface GlobalCountryMatch {
  kind: "country";
  iso3: string;
  iso2: string;
  nameKo: string;
  nameEn: string;
  score: number;
}

export interface GlobalTechnologyMatch {
  kind: "technology";
  id: string;
  nameKo: string;
  category: string;
  relatedSectors: string[];
  datasetCount: number;
  score: number;
}

export interface GlobalDatasetMatch {
  kind: "dataset";
  dataset: Dataset;
  score: number;
}

export interface GlobalElementMatch {
  kind: "element";
  element: AuthoritativeElementSearchItemV75;
  score: number;
}

export interface GlobalSearchResultSet {
  countryMatches: GlobalCountryMatch[];
  technologyMatches: GlobalTechnologyMatch[];
  elementMatches: GlobalElementMatch[];
  detectedCountry: GlobalCountryMatch | null;
  detectedTechnology: GlobalTechnologyMatch | null;
  residualQuery: string;
  totalCount: number;
}

const PUBLIC_DATASETS = DATASETS.filter(isDatasetPubliclyVisible);
const PUBLIC_DATASETS_BY_ELEMENT = buildElementDatasetIndexV88(PUBLIC_DATASETS);

function resolvedElementDatasetIds(
  element: AuthoritativeElementSearchItemV75
): string[] {
  return (
    PUBLIC_DATASETS_BY_ELEMENT.get(element.elementId)?.map(
      (dataset) => dataset.id
    ) ??
    getDatasetIdsForAuthoritativeElementV88(PUBLIC_DATASETS, element.elementId)
  );
}

function resolvedElement(
  element: AuthoritativeElementSearchItemV75
): AuthoritativeElementSearchItemV75 {
  return {
    ...element,
    // v88: 과거 snapshot의 datasetIds를 실제 공개 Dataset registry 기준으로 교체
    datasetIds: resolvedElementDatasetIds(element),
  };
}

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[\s·._/()\-–—,:;]+/g, "")
    .trim();
}

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .split(/[^0-9a-z가-힣]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );
}

function countryAliases(country: GlobalCountryMatch): string[] {
  return unique([
    country.nameKo,
    country.nameEn,
    country.iso3,
    country.iso2,
    ...getOperationalSearchAliasesV97("country", country.iso3),
    ...getSearchAliasesV98("country", country.iso3),
    ...getSearchAliasesV99("country", country.iso3),
  ]);
}

function technologyAliases(technology: GlobalTechnologyMatch): string[] {
  return unique([
    technology.nameKo,
    technology.nameKo.replace(/\s*기술$/, ""),
    technology.id,
    technology.id.replace(/-/g, " "),
    ...getOperationalSearchAliasesV97("technology", technology.id),
    ...getSearchAliasesV98("technology", technology.id),
    ...getSearchAliasesV99("technology", technology.id),
  ]);
}

function aliasScore(query: string, aliases: string[]): number {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenize(query).map(normalizeSearchText);
  let best = 0;

  aliases.forEach((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    if (!normalizedAlias) return;

    if (normalizedQuery === normalizedAlias) {
      best = Math.max(best, 120 + normalizedAlias.length);
      return;
    }

    if (tokens.includes(normalizedAlias)) {
      best = Math.max(best, 100 + normalizedAlias.length);
      return;
    }

    if (normalizedQuery.startsWith(normalizedAlias)) {
      best = Math.max(best, 80 + normalizedAlias.length);
      return;
    }

    if (normalizedQuery.includes(normalizedAlias)) {
      best = Math.max(best, 50 + normalizedAlias.length);
    }
  });

  return best;
}

const COUNTRY_SEARCH_ITEMS: GlobalCountryMatch[] = PRIORITY_COUNTRIES.map(
  (country) => {
    const detail = FALLBACK_COUNTRIES.find(
      (item) => item.iso3 === country.iso3
    );
    return {
      kind: "country",
      iso3: country.iso3,
      iso2: detail?.iso2 ?? country.iso3.slice(0, 2),
      nameKo: country.nameKo,
      nameEn: detail?.nameEn ?? country.nameKo,
      score: 0,
    };
  }
);

const TECHNOLOGY_SEARCH_ITEMS: GlobalTechnologyMatch[] =
  CLIMATE_TECHNOLOGIES.map((technology) => ({
    kind: "technology",
    id: technology.id,
    nameKo: technology.nameKo,
    category: technology.category,
    relatedSectors: technology.relatedSectors,
    datasetCount: getTechnologyDatasetCount(PUBLIC_DATASETS, technology.id),
    score: 0,
  }));

function detectCountry(query: string): GlobalCountryMatch | null {
  const ranked = COUNTRY_SEARCH_ITEMS.map((country) => ({
    ...country,
    score: aliasScore(query, countryAliases(country)),
  }))
    .filter((country) => country.score > 0)
    .sort((a, b) => b.score - a.score || b.nameKo.length - a.nameKo.length);

  return ranked[0] ?? null;
}

function detectTechnology(query: string): GlobalTechnologyMatch | null {
  const ranked = TECHNOLOGY_SEARCH_ITEMS.map((technology) => ({
    ...technology,
    score: aliasScore(query, technologyAliases(technology)),
  }))
    .filter((technology) => technology.score > 0)
    .sort((a, b) => b.score - a.score || b.nameKo.length - a.nameKo.length);

  return ranked[0] ?? null;
}

function tokenMatchesAnyAlias(token: string, aliases: string[]): boolean {
  const normalizedToken = normalizeSearchText(token);
  return aliases.some((alias) => {
    const normalizedAlias = normalizeSearchText(alias);
    return (
      normalizedAlias === normalizedToken ||
      normalizedAlias.startsWith(normalizedToken) ||
      normalizedToken.startsWith(normalizedAlias)
    );
  });
}

function buildResidualQuery(
  query: string,
  country: GlobalCountryMatch | null,
  technology: GlobalTechnologyMatch | null
): string {
  const countryAliasList = country ? countryAliases(country) : [];
  const technologyAliasList = technology ? technologyAliases(technology) : [];

  return tokenize(query)
    .filter(
      (token) =>
        !(technology && normalizeSearchText(token) === "기술") &&
        !tokenMatchesAnyAlias(token, countryAliasList) &&
        !tokenMatchesAnyAlias(token, technologyAliasList)
    )
    .join(" ")
    .trim();
}

function elementSearchText(element: AuthoritativeElementSearchItemV75): string {
  const linkedDatasets =
    PUBLIC_DATASETS_BY_ELEMENT.get(element.elementId) ?? [];

  return normalizeSearchText(
    [
      element.elementId,
      element.displayTitle,
      element.categoryLabel,
      element.dataGroup,
      element.source,
      element.question,
      element.searchText,
      ...getOperationalSearchAliasesV97("element", element.elementId),
      ...getSearchAliasesV98("element", element.elementId),
      ...getSearchAliasesV99("element", element.elementId),
      ...linkedDatasets.flatMap((dataset) => [
        dataset.titleKo,
        dataset.titleEn,
        dataset.summary,
        dataset.sourceOrganization,
        dataset.indicatorId ?? "",
        ...getOperationalSearchAliasesV97("dataset", dataset.id),
        ...getSearchAliasesV98("dataset", dataset.id),
        ...getSearchAliasesV99("dataset", dataset.id),
      ]),
    ].join(" ")
  );
}

function elementMatchesTechnology(
  element: AuthoritativeElementSearchItemV75,
  technology: GlobalTechnologyMatch | null,
  country: GlobalCountryMatch | null
): boolean {
  if (!technology) return true;

  return resolvedElementDatasetIds(element).some((datasetId) =>
    datasetMatchesTechnology(datasetId, technology.id, country?.iso3)
  );
}

function elementMatchesQuery(
  element: AuthoritativeElementSearchItemV75,
  query: string,
  country: GlobalCountryMatch | null,
  technology: GlobalTechnologyMatch | null
): boolean {
  const residual = buildResidualQuery(query, country, technology);
  const tokens = tokenize(residual);
  const text = elementSearchText(element);

  const matchesResidual =
    tokens.length === 0 ||
    tokens.every((token) => text.includes(normalizeSearchText(token)));

  const matchesTechnology =
    !technology ||
    elementMatchesTechnology(element, technology, country) ||
    technologyAliases(technology).some((alias) =>
      text.includes(normalizeSearchText(alias))
    );

  return matchesResidual && matchesTechnology;
}

function elementScore(
  element: AuthoritativeElementSearchItemV75,
  query: string,
  country: GlobalCountryMatch | null,
  technology: GlobalTechnologyMatch | null
): number {
  const residual = buildResidualQuery(query, country, technology);
  const normalizedResidual = normalizeSearchText(residual);
  const title = normalizeSearchText(element.displayTitle);
  const source = normalizeSearchText(element.source);
  const text = elementSearchText(element);
  let score = 0;

  if (normalizedResidual) {
    if (title === normalizedResidual) score += 130;
    else if (title.startsWith(normalizedResidual)) score += 90;
    else if (title.includes(normalizedResidual)) score += 65;
    else if (text.includes(normalizedResidual)) score += 35;
  } else {
    score += 20;
  }

  if (technology && elementMatchesTechnology(element, technology, country)) {
    score += 35;
  }

  if (normalizedResidual && source.includes(normalizedResidual)) {
    score += 20;
  }

  return score;
}

export function searchGlobalV41(
  query: string,
  limit = 5
): GlobalSearchResultSet {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      countryMatches: [],
      technologyMatches: [],
      elementMatches: [],
      detectedCountry: null,
      detectedTechnology: null,
      residualQuery: "",
      totalCount: 0,
    };
  }

  const detectedCountry = detectCountry(trimmed);
  const detectedTechnology = detectTechnology(trimmed);

  const countryMatches = COUNTRY_SEARCH_ITEMS.map((country) => ({
    ...country,
    score: aliasScore(trimmed, countryAliases(country)),
  }))
    .filter((country) => country.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const technologyMatches = TECHNOLOGY_SEARCH_ITEMS.map((technology) => ({
    ...technology,
    score: aliasScore(trimmed, technologyAliases(technology)),
  }))
    .filter((technology) => technology.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const elementMatches = AUTHORITATIVE_ELEMENT_SEARCH_V75.filter((element) =>
    elementMatchesQuery(element, trimmed, detectedCountry, detectedTechnology)
  )
    .map((element) => ({
      kind: "element" as const,
      element: resolvedElement(element),
      score: elementScore(
        element,
        trimmed,
        detectedCountry,
        detectedTechnology
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.element.displayTitle.localeCompare(b.element.displayTitle, "ko")
    )
    .slice(0, limit);

  return {
    countryMatches,
    technologyMatches,
    elementMatches,
    detectedCountry,
    detectedTechnology,
    residualQuery: buildResidualQuery(
      trimmed,
      detectedCountry,
      detectedTechnology
    ),
    totalCount:
      countryMatches.length + technologyMatches.length + elementMatches.length,
  };
}
