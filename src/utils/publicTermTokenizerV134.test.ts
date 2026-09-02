import { describe, expect, test } from "@jest/globals";
import { PUBLIC_GLOSSARY_V134 } from "../data/glossary/publicGlossaryV134";
import {
  resolvePublicTermV134,
  tokenizePublicTermsV134,
} from "./publicTermTokenizerV134";

function terms(text: string): string[] {
  return tokenizePublicTermsV134(text)
    .filter((token) => token.type === "term")
    .map((token) => (token.type === "term" ? token.entry.id : ""));
}

describe("public glossary v134", () => {
  test("contains every required seed and catalog additions", () => {
    const registered = new Set(PUBLIC_GLOSSARY_V134.map((entry) => entry.term));
    [
      "ODA",
      "OECD",
      "DAC",
      "CRS",
      "OOF",
      "CPI",
      "CPIA",
      "GDP",
      "GNI",
      "GHG",
      "NDC",
      "SDG",
      "BTR",
      "NAP",
      "MRV",
      "CBAM",
      "LULUCF",
      "REDD+",
      "GVI",
      "SPEI",
      "SPI",
      "CMIP6",
      "SSP",
      "LCOE",
      "CCS",
      "CCUS",
      "TRL",
      "GCF",
      "CTCN",
      "ADB",
      "EDCF",
      "KOICA",
      "IATI",
      "PPP",
      "FTA",
      "VCM",
      "MAC",
      "RE",
      "FIT",
      "R&D",
      "O&M",
      "USD",
      "VND",
      "MW",
      "GW",
      "kV",
      "GWh",
      "TWh",
      "ha",
      "ha/yr",
      "tCO₂e",
      "MtCO₂e",
      "°C",
      "CSV",
      "JSON",
    ].forEach((term) => expect(registered.has(term)).toBe(true));
  });

  test("derives SPEI accumulation periods", () => {
    expect(resolvePublicTermV134("SPEI12")?.id).toBe("spei-12");
    expect(resolvePublicTermV134("SPEI-6")?.koreanName).toContain("6개월");
    expect(resolvePublicTermV134("SPEI3")?.definition).toContain(
      "3개월 누적기간"
    );
  });

  test("derives SSP forcing scenarios", () => {
    const middle = resolvePublicTermV134("SSP2-4.5");
    const high = resolvePublicTermV134("SSP5–8.5");
    expect(middle?.id).toBe("ssp2-4-5");
    expect(middle?.definition).toContain("4.5 W/m²");
    expect(high?.definition).toContain("화석연료");
  });

  test("derives numbered SDG goals", () => {
    expect(resolvePublicTermV134("SDG1")?.id).toBe("sdg-1");
    expect(resolvePublicTermV134("SDG13")?.koreanName).toContain("기후행동");
    expect(resolvePublicTermV134("SDG17")?.definition).toContain("파트너십");
  });

  test("disambiguates PPP from the surrounding visible sentence", () => {
    expect(resolvePublicTermV134("PPP", "GDP(PPP) 전망")?.id).toBe(
      "ppp-economy"
    );
    expect(resolvePublicTermV134("PPP", "PPP 조달 제도")?.id).toBe(
      "ppp-project"
    );
    expect(resolvePublicTermV134("PPP", "PPP 사업 (2021~2024)")?.id).toBe(
      "ppp-project"
    );
  });

  test("disambiguates MPI index and ministry contexts", () => {
    expect(
      resolvePublicTermV134("MPI", "베트남 기획투자부(MPI) CPEIR")?.id
    ).toBe("mpi-ministry");
    expect(
      resolvePublicTermV134("MPI", "INFORM Multidimensional Poverty Index (MPI)")
        ?.id
    ).toBe("mpi-index");
    expect(resolvePublicTermV134("MPI", "MPI")).toBeNull();
  });

  test("disambiguates PMC literature and project-management contexts", () => {
    expect(resolvePublicTermV134("PMC", "MDPI 논문 원문(PMC)")?.id).toBe(
      "pmc-literature"
    );
    expect(resolvePublicTermV134("PMC", "하수처리시설 건립사업 PMC 용역")?.id).toBe(
      "pmc-project"
    );
  });

  test("disambiguates IP industry and intellectual-property contexts", () => {
    expect(resolvePublicTermV134("IP", "산업공정(IP) 온실가스 배출")?.id).toBe(
      "ip-industry"
    );
    expect(resolvePublicTermV134("IP", "WIPO 지식재산(IP) 통계")?.id).toBe(
      "ip-intellectual-property"
    );
  });
});

describe("safe public term tokenizer v134", () => {
  test("wraps visible terms and unicode unit variants", () => {
    expect(terms("ODA 사업 120 MW · 1.5 MtCO₂e")).toEqual([
      "oda",
      "mw",
      "mtco2e",
    ]);
  });

  test("recognizes hydrofluorocarbon family and named gases", () => {
    expect(terms("HFCs 및 HFC-23")).toEqual(["hfc"]);
  });

  test("recognizes kilotonne carbon-dioxide-equivalent units without a partial tonne match", () => {
    expect(terms("부문별 GHG 배출량 · ktCO2e")).toEqual(["ghg", "ktco2e"]);
    expect(resolvePublicTermV134("ktCO₂e")?.koreanName).toContain("천 톤");
  });

  test("does not tokenize URL, email, or file path spans", () => {
    expect(
      terms(
        "ODA https://example.test/ODA contact.ODA@example.test C:\\ODA\\data.csv /ODA/data.csv"
      )
    ).toEqual(["oda"]);
  });

  test("does not mistake slash units and compound labels for file paths", () => {
    expect(terms("산림손실 ha/yr · 가격 USD/tCO2e · FREL/FRL")).toEqual([
      "hectare-per-year",
      "usd",
      "tco2e",
      "catalog-frel",
      "frl",
    ]);
  });

  test("recognizes a glossary term after a Korean slash-delimited category", () => {
    expect(terms("기술이전/역량강화/FS")).toEqual(["fs"]);
  });

  test("recognizes an organisation acronym after a source separator", () => {
    expect(terms("Mekong River Commission (MRC)/VNMC")).toEqual([
      "mrc",
      "vnmc",
    ]);
  });

  test("wraps only the first repeated occurrence by default", () => {
    expect(terms("ODA 지출과 ODA 약정, ODA 총액")).toEqual(["oda"]);
    const all = tokenizePublicTermsV134("ODA·ODA", {
      firstOccurrenceOnly: false,
    }).filter((token) => token.type === "term");
    expect(all).toHaveLength(2);
  });

  test("uses word boundaries and leaves internal identifiers untouched", () => {
    expect(terms("RE는 재생에너지이지만 RENEWABLE과 D-011은 다릅니다")).toEqual([
      "re",
    ]);
  });
});
