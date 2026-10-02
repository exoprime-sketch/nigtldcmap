import { useEffect, useMemo, useState } from "react";

import CountryCompareBlockV158 from "./CountryCompareBlockV158";
import type { CountryCompareSeriesV158 } from "./CountryCompareBlockV158";
import { publicAssetUrlV128 } from "../../../utils/publicAssetUrlV128";
import { isLiveCountryV158 } from "../../../data/countryContext";

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
    const title = liveEntries[0]?.labelKo || "국가 비교";
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
