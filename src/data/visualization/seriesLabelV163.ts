/**
 * V163-T2: reader-facing names for a delivered series label.
 *
 * Delivered indicator labels read "<measure> · <series> — <definition>"
 * (A-010: "가스별 배출량 · CH4(CO2 환산) — GWP-100 AR5 적용 CO2 환산 배출량").
 * Screens that name one series (a headline value, a comparison title) print
 * the series part, and gas formulas read as words with proper subscripts -
 * the same names the A-010 charts already use (PublicEmissionsAnalysisV132).
 */
const GAS_NAMES_V163: Array<[string, string]> = [
  ["CH4(CO2 환산)", "메탄(CH₄ 환산)"],
  ["CO2(CO2 환산)", "이산화탄소(CO₂ 환산)"],
  ["N2O(CO2 환산)", "아산화질소(N₂O 환산)"],
  ["F-gas(CO2 환산)", "불소계 온실가스(CO₂ 환산)"],
  ["CH4", "메탄(CH₄)"],
  ["CO2", "이산화탄소(CO₂)"],
  ["N2O", "아산화질소(N₂O)"],
  ["F-gas", "불소계 온실가스"],
];

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** A bare gas token ("CH4(CO2 환산)") as its public name; other text unchanged. */
export function publicGasNameV163(token: string): string {
  const trimmed = String(token || "").trim();
  const hit = GAS_NAMES_V163.find(([raw]) => raw === trimmed);
  return hit ? hit[1] : trimmed;
}

/**
 * Gas tokens inside a longer sentence, longest first so "CH4(CO2 환산)" is not
 * read as "CH4". Only whole tokens are replaced (not "CO2eq" or "tCO2e").
 */
export function publicGasTextV163(text: string): string {
  let out = String(text || "");
  for (const [raw, name] of GAS_NAMES_V163) {
    const re = new RegExp(`(^|[\\s·(:,/])${escapeRe(raw)}(?=$|\\s?[·—),/])`, "gu");
    out = out.replace(re, (_m, lead: string) => `${lead}${name}`);
  }
  // Definition clauses keep the unit wording but with a subscript.
  return out.replace(/\bCO2 환산/gu, "CO₂ 환산");
}

/** The series part of "<measure> · <series> — <definition>", in public wording. */
export function publicSeriesNameV163(label: string | null | undefined): string {
  const text = String(label || "").trim();
  if (!text) return "";
  const head = text.split(" — ")[0];
  const parts = head.split(" · ");
  const series = (parts.length > 1 ? parts[parts.length - 1] : head).trim();
  return publicGasNameV163(series);
}
