import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import { countryAssetPathV158 } from "./countryContext";

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

const SUMMARIES_URL = publicAssetUrlV128(countryAssetPathV158("VNM", "home/card-summaries-v140.json"));

let cache: Promise<Map<string, CardSummaryV140>> | null = null;

export function loadCardSummariesV140(): Promise<Map<string, CardSummaryV140>> {
  if (!cache) {
    cache = fetch(SUMMARIES_URL)
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
        return new Map(value.cards.map((card) => [card.elementId, card]));
      })
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}
