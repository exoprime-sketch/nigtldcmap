import { useEffect, useMemo, useState } from "react";

import CountryCompareBlockV158 from "./CountryCompareBlockV158";
import { publicGasTextV163 } from "../../../data/visualization/seriesLabelV163";
import type { CountryCompareSeriesV158 } from "./CountryCompareBlockV158";
import { publicAssetUrlV128 } from "../../../utils/publicAssetUrlV128";
import { isLiveCountryV158 } from "../../../data/countryContext";
import { observationYearTextV164 } from "../../../data/visualization/barRowsV164";

/** One country's slice of a comparable element, as the builder writes it. */
interface CountryCompareEntryV158 {
  countryIso3: string;
  countryNameKo: string;
  present: boolean;
  unit: string | null;
  labelKo: string | null;
  sourceOrg: string | null;
  points: { year: number; value: number }[];
}

interface CountryCompareElementV158 {
  elementId: string;
  compareKey: { indicatorId: string; unit: string; yearRule: string };
  countries: Record<string, CountryCompareEntryV158>;
}

interface CountryCompareDocumentV158 {
  schemaVersion: string;
  elements: Record<string, CountryCompareElementV158>;
}

const COMPARE_ASSET_PATH_V158 = "data/compare/country-compare-v158.json";

function isCountryCompareDocumentV158(value: unknown): value is CountryCompareDocumentV158 {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as CountryCompareDocumentV158).elements === "object"
  );
}

let documentRequestV158: Promise<CountryCompareDocumentV158 | null> | null = null;

/**
 * Reads `public/data/compare/country-compare-v158.json` once per session.
 *
 * A failed or missing fetch resolves to null rather than throwing: the block
 * this feeds already renders nothing when it has no data, so a country whose
 * compare file has not been published yet (or a network hiccup) just leaves
 * the page as it was.
 */
function loadCountryCompareDocumentV158(): Promise<CountryCompareDocumentV158 | null> {
  if (!documentRequestV158) {
    documentRequestV158 = fetch(publicAssetUrlV128(COMPARE_ASSET_PATH_V158))
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => (isCountryCompareDocumentV158(payload) ? payload : null))
      .catch(() => null);
  }
  return documentRequestV158;
}

/** For tests: forget the cached fetch so the next render reads again. */
export function resetCountryCompareDocumentCacheV158(): void {
  documentRequestV158 = null;
}

export interface DetailCountryCompareV158Props {
  elementId: string;
  /** The country the detail page is currently showing; drawn first when comparable. */
  countryIso3: string;
}

/**
 * Fetches the pre-built country-compare series for one element and renders
 * `CountryCompareBlockV158`, or nothing.
 *
 * Two filters happen here that the builder script does not apply, because
 * they depend on which country is being viewed and which countries are
 * public right now rather than on the data itself:
 *
 *   - only LIVE countries are drawn. A `preparing` country's series is real
 *     (the builder already extracted it from its published packs) but not
 *     yet approved for a reader to see next to Vietnam, so it stays in the
 *     JSON for later and out of the render until `public/data/countries.json`
 *     flips its status.
 *   - the page's own country is drawn first, so its own colour and chip lead
 *     the comparison rather than whichever country happens to sort first.
 */
/**
 * V164: the block compares the countries, so its title names the measure, not
 * the page's own country ("CPI 점수 · 방글라데시", "대방글라데시 ODA"), and the
 * few delivered labels left in English read in Korean. The delivered label is
 * unchanged in the data and in the page's own charts.
 */
const COMPARE_TITLE_TERMS_V164: Array<[RegExp, string]> = [
  [/Coal\(계통연계\)/gu, "석탄(계통연계)"],
  [/\s*—\s*Trade in Value Added:.*$/u, ""],
  [/Official donors/gu, "공적 공여자 전체"],
];

export function publicCompareTitleV164(title: string, countryNames: string[]): string {
  let text = String(title || "");
  for (const [pattern, replacement] of COMPARE_TITLE_TERMS_V164) text = text.replace(pattern, replacement);
  for (const name of countryNames.filter(Boolean)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    text = text
      // "한-방글라데시 교역" is Korea's trade with that one country; the block draws both partners.
      .replace(new RegExp(`한-${escaped}\\s*교역`, "u"), "한국과의 교역")
      .replace(new RegExp(`\\s·\\s${escaped}(?=\\s—|\\s·|$)`, "u"), "")
      .replace(new RegExp(`대${escaped}\\s*`, "u"), "");
  }
  return text.replace(/\s{2,}/gu, " ").trim();
}

/**
 * V164: how a compared bar's time reads. A climatology (B-001's "연 평년강수
 * (1991-2020 평년)") is delivered with the first year of its span as the point's
 * year, so the caption "1991년" dated a 30-year normal to one year; its label
 * names the span. Any other series keeps "YYYY년".
 */
export function comparePeriodTextV164(labelKo: string | null | undefined, year: number): string {
  return observationYearTextV164({ year, semanticMeasure: { labelKo } });
}

export default function DetailCountryCompareV158({
  elementId,
  countryIso3,
}: DetailCountryCompareV158Props) {
  const [doc, setDoc] = useState<CountryCompareDocumentV158 | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadCountryCompareDocumentV158().then((payload) => {
      if (!cancelled) setDoc(payload);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const model = useMemo(() => {
    const element = doc?.elements?.[elementId];
    if (!element) return null;
    const liveEntries = Object.values(element.countries).filter(
      (entry) => entry.present && isLiveCountryV158(entry.countryIso3)
    );
    // A page only compares its own country with the others: a country the
    // compare file has no series for gets no block, not someone else's pair.
    if (liveEntries.length < 2 || !liveEntries.some((entry) => entry.countryIso3 === countryIso3)) return null;
    liveEntries.sort((left, right) => {
      if (left.countryIso3 === countryIso3) return -1;
      if (right.countryIso3 === countryIso3) return 1;
      return left.countryIso3.localeCompare(right.countryIso3);
    });
    const series: CountryCompareSeriesV158[] = liveEntries.map((entry) => ({
      countryIso3: entry.countryIso3,
      countryNameKo: entry.countryNameKo,
      unit: entry.unit ?? "",
      points: entry.points,
      sourceOrg: entry.sourceOrg ?? undefined,
    }));
    // V163-T2: gas formulas in the delivered label read as words (A-010).
    const title = publicCompareTitleV164(
      publicGasTextV163(liveEntries[0]?.labelKo || ""),
      liveEntries.map((entry) => entry.countryNameKo)
    ) || "국가 비교";
    return { compareKey: element.compareKey, series, title };
  }, [doc, elementId, countryIso3]);

  if (!model) return null;
  return (
    <CountryCompareBlockV158
      elementId={elementId}
      title={model.title}
      compareKey={model.compareKey}
      series={model.series}
    />
  );
}
