/**
 * Grouping the composition chart's bars.
 *
 * What gets counted together and what gets printed on the bar are two separate
 * decisions, and this module exists so they cannot quietly become one. D-022
 * files DAC sector 15110 under two different names - "공공행정 기타" and
 * "중앙정부 행정" - so a key taken from the code would add three unrelated
 * projects into a single bar, while a key taken from the label would merge any
 * two codes that happen to share a name.
 *
 * So the count is keyed by the source's own category value, and the label is
 * derived from it afterwards. Where two source values would print the same
 * label, both keep their full source value rather than being summed: merging
 * two codes is a claim about classification that needs an approved mapping
 * behind it, and this function has none to offer.
 */

import { publicCategoryLabelV136_2 } from "../data/visualization/publicCategoryLabelV136_2";

export interface PublicCategoryRowV136_3 {
  /** The source value the count is keyed by. */
  categoryKey: string;
  /** What the reader sees on the bar. */
  displayLabel: string;
  value: number;
}

/**
 * One row per distinct source category value, most frequent first.
 *
 * `shorten` is applied to the label only, never to the key.
 */
export function publicCategoryRowsV136_3(
  counts: Map<string, number>,
  shorten: (value: string) => string = (value) => value
): PublicCategoryRowV136_3[] {
  const labelUses = new Map<string, number>();
  for (const key of counts.keys()) {
    const label = publicCategoryLabelV136_2(key);
    labelUses.set(label, (labelUses.get(label) || 0) + 1);
  }
  return [...counts]
    .map(([categoryKey, value]) => {
      const label = publicCategoryLabelV136_2(categoryKey);
      // Two source values, one label: show what tells them apart instead of
      // printing the same name twice or adding them together.
      const distinct = (labelUses.get(label) || 0) > 1 ? categoryKey : label;
      return { categoryKey, displayLabel: shorten(distinct), value };
    })
    .sort(
      (left, right) =>
        right.value - left.value ||
        left.displayLabel.localeCompare(right.displayLabel, "ko")
    );
}
