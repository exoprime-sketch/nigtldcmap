import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  ElementVisualizationContractsAssetV125,
  ElementVisualizationSummaryV125,
  IndicatorSemanticsIndexV125,
} from "./semanticTypesV125";
import { ELEMENT_VISUALIZATION_SUMMARIES_V125 } from "./generatedVisualizationContractsV125";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

const SEMANTIC_BASE_V125 = publicAssetUrlV128("data/vietnam/v2/semantic");

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

let contractsPromise: Promise<ElementVisualizationContractsAssetV125> | null = null;
let indexPromise: Promise<IndicatorSemanticsIndexV125> | null = null;
const elementSemanticPromises = new Map<
  string,
  Promise<ElementIndicatorSemanticsV125>
>();
const summaryByElementId = new Map(
  ELEMENT_VISUALIZATION_SUMMARIES_V125.map((summary) => [summary.elementId, summary])
);

export function getElementVisualizationSummaryV125(
  elementId: string
): ElementVisualizationSummaryV125 | null {
  return summaryByElementId.get(elementId) || null;
}

export function loadElementVisualizationContractsV125(
  signal?: AbortSignal
): Promise<ElementVisualizationContractsAssetV125> {
  if (signal) {
    return readJsonV125<ElementVisualizationContractsAssetV125>(
      `${SEMANTIC_BASE_V125}/element-visualization-contracts-v125.json`,
      signal
    );
  }
  if (!contractsPromise) {
    contractsPromise = readJsonV125<ElementVisualizationContractsAssetV125>(
      `${SEMANTIC_BASE_V125}/element-visualization-contracts-v125.json`
    );
  }
  return contractsPromise;
}

export async function loadElementVisualizationContractV125(
  elementId: string,
  signal?: AbortSignal
): Promise<ElementVisualizationContractV125> {
  const asset = await loadElementVisualizationContractsV125(signal);
  const contract = asset.contracts.find((item) => item.elementId === elementId);
  if (!contract) throw new Error(`Missing V125 visualization contract: ${elementId}`);
  return contract;
}

export function loadIndicatorSemanticsIndexV125(
  signal?: AbortSignal
): Promise<IndicatorSemanticsIndexV125> {
  if (signal) {
    return readJsonV125<IndicatorSemanticsIndexV125>(
      `${SEMANTIC_BASE_V125}/indicator-semantics-v125.json`,
      signal
    );
  }
  if (!indexPromise) {
    indexPromise = readJsonV125<IndicatorSemanticsIndexV125>(
      `${SEMANTIC_BASE_V125}/indicator-semantics-v125.json`
    );
  }
  return indexPromise;
}

/** Only the selected element shard is loaded; Data Finder entry stays light. */
export async function loadElementIndicatorSemanticsV125(
  elementId: string,
  signal?: AbortSignal
): Promise<ElementIndicatorSemanticsV125> {
  if (signal) {
    const index = await loadIndicatorSemanticsIndexV125(signal);
    const entry = index.elements[elementId];
    if (!entry) throw new Error(`Missing V125 semantic index entry: ${elementId}`);
    return readJsonV125<ElementIndicatorSemanticsV125>(entry.assetUrl, signal);
  }
  const cached = elementSemanticPromises.get(elementId);
  if (cached) return cached;
  const promise = loadIndicatorSemanticsIndexV125().then((index) => {
    const entry = index.elements[elementId];
    if (!entry) throw new Error(`Missing V125 semantic index entry: ${elementId}`);
    return readJsonV125<ElementIndicatorSemanticsV125>(entry.assetUrl);
  });
  elementSemanticPromises.set(elementId, promise);
  return promise;
}
