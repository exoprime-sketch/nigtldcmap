import { createContext, useCallback, useContext } from "react";
import { formatRegionTextV162 } from "./regionNameV161";
import type { RegionLevelV161 } from "./regionNameV161";

/**
 * V162 (P12-B): region names that come from data values - card labels, chart
 * axes and legends, tables, 판단 포인트 - are shown as "한글명 (현지명)" through
 * the V161 dictionary. A name still under review, or one the dictionary does
 * not know, stays in the source spelling. Only the display changes: selector
 * values, map keys and download columns keep the source text.
 *
 * The vintage of a Vietnamese element's province names decides the lookup:
 * the B series and C-016 carry the 63 pre-2025 provinces, C-019/C-022 the 34
 * post-2025 units ("Thừa Thiên Huế" is 트어티엔후에 in the first and 후에 in
 * the second). Other elements, and other countries, are looked up in the
 * country's lists in order.
 */
const VNM_ELEMENT_LEVELS_V162: Record<string, RegionLevelV161> = {
  "C-016": "adm1-63",
  "C-019": "adm1-34",
  "C-022": "adm1-34",
};

export function regionLevelForElementV162(elementId: string | null | undefined, country = "VNM"): RegionLevelV161 | undefined {
  if (!elementId || country.toUpperCase() !== "VNM") return undefined;
  if (VNM_ELEMENT_LEVELS_V162[elementId]) return VNM_ELEMENT_LEVELS_V162[elementId];
  return elementId.startsWith("B-") ? "adm1-63" : undefined;
}

/** A region value or a " · " / ";" list of them, as the public screen shows it. */
export function publicRegionTextV162(text: string | null | undefined, elementId?: string | null, country = "VNM"): string {
  return formatRegionTextV162({ country, raw: text, level: regionLevelForElementV162(elementId, country) });
}

/** The data country of the detail screen being read (its provider's ISO3). */
export const RegionCountryContextV162 = createContext<string>("VNM");

/** `publicRegionTextV162` bound to the screen's country and an element. */
export function useRegionTextV162(elementId?: string | null): (text: string | null | undefined) => string {
  const country = useContext(RegionCountryContextV162);
  return useCallback((text: string | null | undefined) => publicRegionTextV162(text, elementId, country), [elementId, country]);
}
