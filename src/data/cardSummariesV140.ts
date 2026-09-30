import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import { countryAssetPathV158 } from "./countryContext";
import { publicSourceOrganizationV136_1, publicUnstatedWordingV161 } from "./visualization/publicFieldPolicyV126";
import { getCardSpecV159 } from "./spec/datasetSpecV159";
import { publicRegionTextV162 } from "./geo/regionDisplayV162";

/**
 * The finder's pre-built card summaries (scripts/v140/build-card-summaries-v140.mjs).
 *
 * One small file for all 152 datasets: the figure each card leads with, in
 * the detail screen's own selector keys, and the small analysis that fits the
 * data's shape. The finder reads this instead of opening 152 packs, and hands
 * a card's `selection` to the detail so the screen opens on what the card
 * showed.
 */
export interface CardHeadlineV140 {
  value: string;
  label: string;
}

export interface CardPartV140 {
  label: string;
  value: number;
}

export interface CardPointV140 {
  year: number;
  value: number;
}

export interface CardFactV140 {
  label: string;
  value: string;
}

export interface CardRangeV140 {
  min?: number | null;
  p10?: number | null;
  p90?: number | null;
  max?: number | null;
}

export interface CardPreviewV140 {
  home?: boolean;
  points?: CardPointV140[];
  unit?: string;
  seriesLabel?: string;
  first?: CardPointV140;
  latest?: CardPointV140;
  parts?: CardPartV140[];
  scope?: string;
  omitted?: number;
  unlabelled?: number;
  total?: number | null;
  others?: Array<{ label: string; value: number }>;
  note?: string;
  facts?: CardFactV140[];
  more?: number;
  median?: number | null;
  range?: CardRangeV140;
  provinces?: number;
  scenarios?: number;
  historicalUntil?: number | null;
}

export type CardKindV140 =
  | "line"
  | "level"
  | "composition"
  | "bars"
  | "spatial"
  | "spatial-trend"
  | "facts"
  | "status"
  | "signed-bars"
  | "grouped-bars"
  | "map";

export interface CardSummaryV140 {
  elementId: string;
  title: string;
  kind: CardKindV140;
  headline: CardHeadlineV140;
  preview: CardPreviewV140;
  period: string;
  /**
   * V162: what `period` is when it is not an observed span - '기준 시점' (the
   * point a list was collected) or '계획기간' (a plan's span). Absent = 자료기간.
   */
  periodLabel?: string;
  provider: string;
  selection: DataFinderSelectorStateV125 | null;
  basis: { unit: string; rule: string };
  measure: { key: string; label: string; unit: string } | null;
  mapConnected: boolean;
  downloadable: boolean;
  fromHome?: boolean;
}

export interface CardSummariesV140 {
  schemaVersion: string;
  dataSnapshot: string;
  generatedAt: string;
  sourceHash: string;
  cards: CardSummaryV140[];
}

/**
 * A card summary as every public screen reads it (V161). The provider line was
 * compiled with the project's working notes - "현지 컨설턴트 현지조사(Field Survey
 * Items_…_v2.0)", "…(용역사 취합)" - and each card, the home, the source panel
 * and the KPI strip printed it as is. It is judged here, once, by the same
 * function as every other source display; when nothing real is left it falls
 * back to the framework spec's (v5.38) source name, and to nothing (the line is
 * hidden) when that is a working note too. A category the source left unstated
 * ("원천 미기재") reads 미기재.
 */
function publicCardSummaryV161(card: CardSummaryV140, countryIso3 = "VNM"): CardSummaryV140 {
  const provider =
    publicSourceOrganizationV136_1(card.provider) ||
    publicSourceOrganizationV136_1(getCardSpecV159(card.elementId)?.sourceLabel) ||
    "";
  // V162 (P12-B): a place named by the data reads "한글명 (현지명)" - a
  // reviewed name only; anything else keeps its source spelling.
  const region = (text: string) => publicRegionTextV162(text, card.elementId, countryIso3);
  const preview = card.preview as CardPreviewV140 | undefined;
  const nextPreview: CardPreviewV140 | undefined = preview
    ? {
        ...preview,
        ...(Array.isArray(preview.parts) ? { parts: preview.parts.map((part) => ({ ...part, label: region(publicUnstatedWordingV161(String(part.label ?? ""))) })) } : {}),
        ...(Array.isArray(preview.facts) ? { facts: preview.facts.map((fact) => ({ ...fact, label: region(String(fact.label ?? "")) })) } : {}),
        ...(Array.isArray(preview.others) ? { others: preview.others.map((other) => ({ ...other, label: region(String(other.label ?? "")) })) } : {}),
        ...(typeof preview.scope === "string" ? { scope: region(preview.scope) } : {}),
        ...(typeof preview.seriesLabel === "string" ? { seriesLabel: region(preview.seriesLabel) } : {}),
      }
    : preview;
  return {
    ...card,
    provider,
    headline: card.headline ? { ...card.headline, label: region(card.headline.label) } : card.headline,
    preview: nextPreview as CardSummaryV140["preview"],
  };
}

const cacheByCountry = new Map<string, Promise<Map<string, CardSummaryV140>>>();

/**
 * The card summaries of a country's data tree (countries.json data root;
 * Vietnam by default, as every caller before V161 assumed). A country whose
 * tree has no summaries rejects, and the caller shows "데이터 준비 중".
 */
export function loadCardSummariesV140(countryIso3: string = "VNM"): Promise<Map<string, CardSummaryV140>> {
  const iso3 = countryIso3.trim().toUpperCase();
  let cache = cacheByCountry.get(iso3);
  if (!cache) {
    cache = fetch(publicAssetUrlV128(countryAssetPathV158(iso3, "home/card-summaries-v140.json")))
      .then((response) => {
        if (!response.ok) throw new Error(`card summaries ${response.status}`);
        return response.text();
      })
      .then((body) => {
        if (/^\s*</u.test(body)) throw new Error("card summaries returned HTML");
        const value = JSON.parse(body) as CardSummariesV140;
        if (value.schemaVersion !== "v140-card-summaries-1" || !Array.isArray(value.cards)) {
          throw new Error("card summaries schema mismatch");
        }
        return new Map(value.cards.map((card) => [card.elementId, publicCardSummaryV161(card, iso3)]));
      });
    cacheByCountry.set(iso3, cache);
    cache.catch(() => cacheByCountry.delete(iso3));
  }
  return cache;
}
