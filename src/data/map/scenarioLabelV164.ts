/**
 * V164: how a climate scenario key reads on a public screen.
 *
 * A layer's `variableGroups` carries the scenario labels the delivery wrote
 * (Viet Nam B-004~B-007), but another country's layer can have none (Bangladesh
 * B-004~B-007 list `variableGroups: null`), and the chart legend then fell back to
 * the raw key - "ssp245". This is that fallback: the same labels the grouped
 * layers show, so a legend reads the same in both countries.
 *
 * Nothing is invented: a key that is not an SSP key or the historical run is
 * returned as it came.
 */
const HISTORICAL_LABEL_V164 = "과거 모형(historical)";

const SSP_KEY_V164 = /^ssp([1-5])([0-9])([0-9])$/u;

export function publicScenarioLabelV164(key: string | null | undefined): string {
  const raw = String(key ?? "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "historical") return HISTORICAL_LABEL_V164;
  const ssp = SSP_KEY_V164.exec(lower);
  // ssp245 -> SSP2-4.5: pathway digit, then the 2100 forcing in W/m².
  if (ssp) return `SSP${ssp[1]}-${ssp[2]}.${ssp[3]}`;
  return raw;
}
