/**
 * V164: energy categories as delivered by IRENA/EI ("Coal(계통연계)",
 * "Total renewable energy(독립형)") read in Korean, and the categories that are
 * sums of other delivered categories, so a stack or a "largest" list never
 * counts the same capacity twice. Display only: the delivered rows are unchanged.
 */

const TRANSLATIONS_V164: Array<[RegExp, string]> = [
  [/^Total non-renewable energy/iu, "비재생에너지 합계"],
  [/^Total renewable energy/iu, "재생에너지 합계"],
  [/^Other non-renewable energy/iu, "기타 비재생에너지"],
  [/^Renewable hydropower/iu, "재생 수력"],
  [/^Renewable waste/iu, "폐기물에너지"],
  [/^Solar photovoltaic/iu, "태양광"],
  [/^Solar energy/iu, "태양에너지"],
  [/^Offshore wind energy/iu, "해상풍력"],
  [/^Onshore wind energy/iu, "육상풍력"],
  [/^Wind energy/iu, "풍력"],
  [/^Natural gas/iu, "천연가스"],
  [/^Gas biofuels/iu, "바이오가스"],
  [/^Solid biofuels/iu, "고체 바이오연료"],
  [/^Bioenergy/iu, "바이오에너지"],
  [/^Fossil fuels/iu, "화석연료"],
  [/^Coal/iu, "석탄"],
  [/^Oil/iu, "석유"],
];

export function localizedEnergyCategoryV164(value: string): string {
  const translated = TRANSLATIONS_V164.find(([pattern]) => pattern.test(value));
  return translated ? value.replace(translated[0], translated[1]) : value;
}

/** A delivered total ("Total ...", "전체", "합계", "총계"). */
export function isTotalCategoryV164(text: string): boolean {
  return /(?:^|[_\s(])(?:total|전체|총계|합계)(?:[_\s)]|$)/iu.test(String(text || "").toLocaleLowerCase("en-US"));
}

/** A source subtotal and the categories it sums. */
const SUBTOTAL_PARTS_V164: Array<[RegExp, RegExp]> = [
  [/^Fossil fuels(?!\s*n\.?e\.?s)/iu, /^(Coal|Natural gas|Oil|Fossil fuels\s*n\.?e\.?s)/iu],
  [/^Solar energy/iu, /^(Solar photovoltaic|Solar thermal|Concentrated solar)/iu],
  [/^Wind energy/iu, /^(Onshore wind|Offshore wind)/iu],
  [/^Bioenergy/iu, /^(Solid biofuels|Gas biofuels|Liquid biofuels|Biogas|Renewable (municipal )?waste)/iu],
];

function gridSuffixV164(category: string): string {
  const match = category.match(/\(([^()]*)\)\s*$/u);
  return match ? match[1] : "";
}

/**
 * True when `category` is a subtotal whose parts are also among `categories`
 * for the same grid connection ("(계통연계)"/"(독립형)").
 */
export function isSourceSubtotalV164(category: string, categories: readonly string[]): boolean {
  const rule = SUBTOTAL_PARTS_V164.find(([parent]) => parent.test(category));
  if (!rule) return false;
  const suffix = gridSuffixV164(category);
  return categories.some((other) => other !== category && rule[1].test(other) && gridSuffixV164(other) === suffix);
}
