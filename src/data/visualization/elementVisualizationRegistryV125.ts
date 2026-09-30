import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  ElementVisualizationContractsAssetV125,
  ElementVisualizationSummaryV125,
  IndicatorSemanticsIndexV125,
} from "./semanticTypesV125";
import { ELEMENT_VISUALIZATION_SUMMARIES_V125 } from "./generatedVisualizationContractsV125";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import {
  DEFAULT_COUNTRY_ISO3_V158,
  countryAssetPathV158,
  normalizeCountryIso3V158,
} from "../countryContext";

/**
 * V158: every loader takes the country whose semantic assets to read
 * (`<dataRoot>/semantic/`); the default country is the default, so callers
 * that pass none read exactly what they read before. The default country's
 * summaries stay bundled; another country's are fetched from its
 * `semantic/element-visualization-summaries-v125.json` on first use.
 */
function countryKeyV158(country: string | null | undefined): string {
  return normalizeCountryIso3V158(country) || DEFAULT_COUNTRY_ISO3_V158;
}

function semanticBaseV158(country: string): string {
  return publicAssetUrlV128(countryAssetPathV158(country, "semantic"));
}

async function readJsonV125<T>(url: string, signal?: AbortSignal): Promise<T> {
  const requestUrl = publicAssetUrlV128(url);
  const response = await fetch(requestUrl, { signal });
  if (!response.ok) {
    throw new Error(
      `V125 semantic asset request failed (${response.status}): ${requestUrl}`
    );
  }
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("text/html") || /^\s*</.test(text)) {
    throw new Error(`V125 semantic asset returned HTML: ${requestUrl}`);
  }
  return JSON.parse(text) as T;
}

const contractsPromises = new Map<string, Promise<ElementVisualizationContractsAssetV125>>();
const indexPromises = new Map<string, Promise<IndicatorSemanticsIndexV125>>();
const elementSemanticPromises = new Map<string, Promise<ElementIndicatorSemanticsV125>>();
const summariesByCountry = new Map<string, Map<string, ElementVisualizationSummaryV125>>([
  [
    DEFAULT_COUNTRY_ISO3_V158,
    new Map(ELEMENT_VISUALIZATION_SUMMARIES_V125.map((summary) => [summary.elementId, summary])),
  ],
]);
const summaryRequests = new Map<string, Promise<Map<string, ElementVisualizationSummaryV125>>>();

/** The summary for an element, if its country's summaries are in memory. */
export function getElementVisualizationSummaryV125(
  elementId: string,
  country?: string | null
): ElementVisualizationSummaryV125 | null {
  return summariesByCountry.get(countryKeyV158(country))?.get(elementId) || null;
}

/** Loads a country's summaries once (the default country's are bundled). */
export function ensureElementVisualizationSummariesV158(
  country?: string | null
): Promise<Map<string, ElementVisualizationSummaryV125>> {
  const iso3 = countryKeyV158(country);
  const loaded = summariesByCountry.get(iso3);
  if (loaded) return Promise.resolve(loaded);
  let request = summaryRequests.get(iso3);
  if (!request) {
    request = readJsonV125<{ elements: ElementVisualizationSummaryV125[] }>(
      `${semanticBaseV158(iso3)}/element-visualization-summaries-v125.json`
    ).then((document) => {
      const map = new Map(
        (Array.isArray(document.elements) ? document.elements : []).map((summary) => [summary.elementId, summary])
      );
      summariesByCountry.set(iso3, map);
      return map;
    });
    summaryRequests.set(iso3, request);
    request.catch(() => summaryRequests.delete(iso3));
  }
  return request;
}

/** The summary for an element, loading its country's summaries if needed. */
export async function loadElementVisualizationSummaryV158(
  elementId: string,
  country?: string | null
): Promise<ElementVisualizationSummaryV125 | null> {
  const summaries = await ensureElementVisualizationSummariesV158(country);
  return summaries.get(elementId) || null;
}

export function loadElementVisualizationContractsV125(
  signal?: AbortSignal,
  country?: string | null
): Promise<ElementVisualizationContractsAssetV125> {
  const iso3 = countryKeyV158(country);
  const url = `${semanticBaseV158(iso3)}/element-visualization-contracts-v125.json`;
  if (signal) return readJsonV125<ElementVisualizationContractsAssetV125>(url, signal);
  let cached = contractsPromises.get(iso3);
  if (!cached) {
    cached = readJsonV125<ElementVisualizationContractsAssetV125>(url);
    contractsPromises.set(iso3, cached);
  }
  return cached;
}

export async function loadElementVisualizationContractV125(
  elementId: string,
  signal?: AbortSignal,
  country?: string | null
): Promise<ElementVisualizationContractV125> {
  const asset = await loadElementVisualizationContractsV125(signal, country);
  const contract = asset.contracts.find((item) => item.elementId === elementId);
  if (!contract) throw new Error(`Missing V125 visualization contract: ${elementId}`);
  return contract;
}

export function loadIndicatorSemanticsIndexV125(
  signal?: AbortSignal,
  country?: string | null
): Promise<IndicatorSemanticsIndexV125> {
  const iso3 = countryKeyV158(country);
  const url = `${semanticBaseV158(iso3)}/indicator-semantics-v125.json`;
  if (signal) return readJsonV125<IndicatorSemanticsIndexV125>(url, signal);
  let cached = indexPromises.get(iso3);
  if (!cached) {
    cached = readJsonV125<IndicatorSemanticsIndexV125>(url);
    indexPromises.set(iso3, cached);
  }
  return cached;
}

/** Only the selected element shard is loaded; Data Finder entry stays light. */
export async function loadElementIndicatorSemanticsV125(
  elementId: string,
  signal?: AbortSignal,
  country?: string | null
): Promise<ElementIndicatorSemanticsV125> {
  if (signal) {
    const index = await loadIndicatorSemanticsIndexV125(signal, country);
    const entry = index.elements[elementId];
    if (!entry) throw new Error(`Missing V125 semantic index entry: ${elementId}`);
    return readJsonV125<ElementIndicatorSemanticsV125>(entry.assetUrl, signal);
  }
  const key = `${countryKeyV158(country)}:${elementId}`;
  const cached = elementSemanticPromises.get(key);
  if (cached) return cached;
  const promise = loadIndicatorSemanticsIndexV125(undefined, country).then((index) => {
    const entry = index.elements[elementId];
    if (!entry) throw new Error(`Missing V125 semantic index entry: ${elementId}`);
    return readJsonV125<ElementIndicatorSemanticsV125>(entry.assetUrl);
  });
  elementSemanticPromises.set(key, promise);
  return promise;
}
