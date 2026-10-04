/**
 * V164: the name a delivered asset feature is shown under, when the delivery's
 * own name is a template with its value left out.
 *
 *  - B-025 / B-028 basin points: see basinPointNameV164.
 *  - A-024 line segments (Bangladesh): the delivery names a segment
 *    "${voltage} kV 전력선 구간"; where the source states no voltage the number is
 *    empty and 144 of 946 segments read "kV 전력선 구간". They read as what the
 *    source gave, "전압 미기재 전력선 구간" (the legend's own wording), and no
 *    voltage is invented.
 */
import { basinPointNameForElementV164 } from "./basinPointNameV164";

const VOLTAGE_LESS_NAME_V164 = /^\s*kV\s+(.+)$/u;

export function assetNameV164(elementId: string, name: string): string {
  const basin = basinPointNameForElementV164(elementId, name);
  if (basin !== name) return basin;
  if (elementId === "A-024") {
    const bare = VOLTAGE_LESS_NAME_V164.exec(name);
    if (bare) return `전압 미기재 ${bare[1].trim()}`;
  }
  return name;
}
