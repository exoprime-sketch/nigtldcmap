export const PRIORITY_COUNTRIES = [
  { iso3: "VNM", nameKo: "베트남" },
  { iso3: "BGD", nameKo: "방글라데시" },
  { iso3: "PHL", nameKo: "필리핀" },
  { iso3: "KHM", nameKo: "캄보디아" },
  { iso3: "IDN", nameKo: "인도네시아" },
  { iso3: "LAO", nameKo: "라오스" },
  { iso3: "LKA", nameKo: "스리랑카" },
  { iso3: "IND", nameKo: "인도" },
  { iso3: "MYS", nameKo: "말레이시아" },
  { iso3: "EGY", nameKo: "이집트" },
] as const;

export const PRIORITY_COUNTRY_ISO3 = PRIORITY_COUNTRIES.map(
  (item) => item.iso3
);
export const PRIORITY_COUNTRY_SET = new Set<string>(PRIORITY_COUNTRY_ISO3);

export function isPriorityCountry(iso3: string | null | undefined): boolean {
  return Boolean(iso3 && PRIORITY_COUNTRY_SET.has(iso3.toUpperCase()));
}
