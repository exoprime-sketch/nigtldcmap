import typologyJson from "./datasetTypologyV159.json";
import cardSpecJson from "./datasetCardSpecV159.json";
import type {
  DatasetCardSpecV159,
  DatasetSpecRowV159,
  TypologyRowV159,
  UseCaseV159,
} from "./specTypesV159";

const TYPOLOGY_V159 = new Map<string, TypologyRowV159>(
  (typologyJson.rows as TypologyRowV159[]).map((row) => [row.elementId, row])
);
const CARD_SPEC_V159 = new Map<string, DatasetCardSpecV159>(
  (cardSpecJson.rows as DatasetCardSpecV159[]).map((row) => [row.elementId, row])
);

export function getTypologyV159(elementId: string): TypologyRowV159 | null {
  return TYPOLOGY_V159.get(elementId.toUpperCase()) || null;
}

export function allTypologyV159(): TypologyRowV159[] {
  return [...TYPOLOGY_V159.values()];
}

export function getCardSpecV159(elementId: string): DatasetCardSpecV159 | null {
  return CARD_SPEC_V159.get(elementId.toUpperCase()) || null;
}

export interface DatasetSpecBundleV159 {
  spec: DatasetSpecRowV159 | null;
  cases: UseCaseV159[];
}

let specChunkV159: Promise<{ spec: Map<string, DatasetSpecRowV159>; cases: Map<string, UseCaseV159[]> }> | null = null;

/**
 * The spec text and the use cases (about 1 MB of JSON) load as their own
 * chunk with the first detail page, not with the finder.
 */
function loadSpecChunkV159() {
  if (!specChunkV159) {
    specChunkV159 = Promise.all([import("./datasetSpecV159.json"), import("./useCasesV159.json")]).then(
      ([specModule, casesModule]) => {
        const spec = new Map<string, DatasetSpecRowV159>(
          ((specModule.default || specModule).rows as DatasetSpecRowV159[]).map((row) => [row.elementId, row])
        );
        const cases = new Map<string, UseCaseV159[]>();
        for (const item of (casesModule.default || casesModule).cases as UseCaseV159[]) {
          const list = cases.get(item.elementId) || [];
          list.push(item);
          cases.set(item.elementId, list);
        }
        return { spec, cases };
      }
    );
  }
  return specChunkV159;
}

export async function loadDatasetSpecV159(elementId: string): Promise<DatasetSpecBundleV159> {
  const { spec, cases } = await loadSpecChunkV159();
  const key = elementId.toUpperCase();
  return { spec: spec.get(key) || null, cases: cases.get(key) || [] };
}
