/**
 * V164-3: which selectors a screen offers when two of them would read the same.
 *
 * VNM E-002 offered "상태" twice: the delivery's own English status
 * ("Waiting for HP approval") and its Korean reading ("유치국 승인 대기") are
 * two columns of the sheet, and both reached the page. Picking in either one
 * selects the same rows, so a reader saw one choice written twice. When two
 * selectors carry the same name and one of them reads in Korean while the other
 * is the raw delivery, the raw one is the twin and is not offered. Nothing is
 * dropped between selectors with different names, and two Korean selectors of the
 * same name are both kept: telling those apart needs a better name, not a choice.
 */

export interface SelectorDimensionV164 {
  key: string;
  values: readonly string[];
}

const HANGUL_V164 = /[가-힣]/u;

/** The share of values that contain Korean text. */
function koreanShareV164(values: readonly string[]): number {
  if (values.length === 0) return 0;
  return values.filter((value) => HANGUL_V164.test(value)).length / values.length;
}

export function withoutRawTwinSelectorsV164<T extends SelectorDimensionV164>(dimensions: readonly T[], labelOf: (dimension: T) => string): T[] {
  const byLabel = new Map<string, T[]>();
  for (const dimension of dimensions) {
    const label = labelOf(dimension);
    byLabel.set(label, [...(byLabel.get(label) ?? []), dimension]);
  }
  const dropped = new Set<T>();
  for (const group of byLabel.values()) {
    if (group.length < 2) continue;
    const readable = group.filter((dimension) => koreanShareV164(dimension.values) >= 0.5);
    if (readable.length === 0 || readable.length === group.length) continue;
    for (const dimension of group) if (!readable.includes(dimension)) dropped.add(dimension);
  }
  return dropped.size === 0 ? [...dimensions] : dimensions.filter((dimension) => !dropped.has(dimension));
}
