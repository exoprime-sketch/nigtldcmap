import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";

/**
 * The home page's pre-built preview asset (scripts/v139/build-home-preview-v139.mjs).
 *
 * Eight small series and one static map, computed once from the public packs
 * at build time. The home never opens a pack or the map engine; it reads this
 * file and draws what it says, with the rule that produced each number
 * carried in `period`, `unit` and `note`.
 */
export interface HomePreviewLegendV139 {
  kv: number;
  color: string;
  segments: number;
  lengthKm: number;
}

export interface HomePreviewMapV139 {
  elementId: string;
  svgUrl: string;
  title: string;
  subtitle: string;
  provider: string;
  attribution: string;
  segments: number;
  totalLengthKm: number;
  legend: HomePreviewLegendV139[];
  accuracy: string;
  plannedNote: string;
}

interface HomePreviewCardBaseV139 {
  elementId: string;
  lead: string;
  unit: string;
  period: string;
  provider: string;
  note: string;
}

export interface HomePreviewSignedBarsV139 extends HomePreviewCardBaseV139 {
  kind: "signed-bars";
  domain: [number, number];
  bars: Array<{ label: string; value: number }>;
}

export interface HomePreviewLineV139 extends HomePreviewCardBaseV139 {
  kind: "line";
  series: Array<{ year: number; value: number }>;
  latest: { year: number; value: number };
  seriesLabel?: string;
}

export interface HomePreviewCompositionV139 extends HomePreviewCardBaseV139 {
  kind: "composition";
  parts: Array<{ label: string; value: number }>;
  total: number;
}

export interface HomePreviewGroupedBarsV139 extends HomePreviewCardBaseV139 {
  kind: "grouped-bars";
  seriesLabels: string[];
  groups: Array<{ label: string; values: number[] }>;
  rowsBySource: Record<string, number>;
}

export interface HomePreviewBarsV139 extends HomePreviewCardBaseV139 {
  kind: "bars";
  bars: Array<{ label: string; value: number }>;
  scope: string;
}

export interface HomePreviewMapCardV139 extends HomePreviewCardBaseV139 {
  kind: "map";
  svgUrl: string;
  legend: HomePreviewLegendV139[];
}

export type HomePreviewCardV139 =
  | HomePreviewSignedBarsV139
  | HomePreviewLineV139
  | HomePreviewCompositionV139
  | HomePreviewGroupedBarsV139
  | HomePreviewBarsV139
  | HomePreviewMapCardV139;

export interface HomePreviewV139 {
  schemaVersion: string;
  dataSnapshot: string;
  map: HomePreviewMapV139;
  cards: HomePreviewCardV139[];
}

const PREVIEW_URL = publicAssetUrlV128("data/vietnam/v2/home/home-preview-v139.json");

let cache: Promise<HomePreviewV139> | null = null;

export function loadHomePreviewV139(): Promise<HomePreviewV139> {
  if (!cache) {
    cache = fetch(PREVIEW_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`home preview ${response.status}`);
        return response.json() as Promise<HomePreviewV139>;
      })
      .then((value) => {
        if (value.schemaVersion !== "v139-home-preview-1" || !Array.isArray(value.cards)) {
          throw new Error("home preview schema mismatch");
        }
        return value;
      })
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
}

/** The SVG's public URL, resolved for the deployment prefix. */
export function homePreviewSvgUrlV139(svgUrl: string): string {
  return publicAssetUrlV128(svgUrl);
}
