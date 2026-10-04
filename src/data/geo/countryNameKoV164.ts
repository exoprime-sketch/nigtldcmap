/**
 * V164: a country's Korean name from its ISO 3166-1 alpha-3 code.
 *
 * Cards and fact lines printed the code as the source stores it ("VNM",
 * "USA"). Only the codes the platform's data carries (the two pilot
 * countries and the head-office countries of the investor networks) are
 * named here; any other code is returned as null so the caller can print the
 * source's own value instead of a guess.
 */
const COUNTRY_NAME_KO_V164: Readonly<Record<string, string>> = {
  VNM: "베트남",
  BGD: "방글라데시",
  KHM: "캄보디아",
  LAO: "라오스",
  CHN: "중국",
  THA: "태국",
  KOR: "대한민국",
  CHE: "스위스",
  FRA: "프랑스",
  GBR: "영국",
  PHL: "필리핀",
  SGP: "싱가포르",
  USA: "미국",
};

export function countryNameKoV164(iso3: unknown): string | null {
  const code = String(iso3 ?? "").trim().toUpperCase();
  return COUNTRY_NAME_KO_V164[code] ?? null;
}
