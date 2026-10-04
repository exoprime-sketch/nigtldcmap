import { describe, expect, it } from "@jest/globals";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { EMPTY_PORTFOLIO_SELECTION_V143, portfolioSelectionModelV143 } from "./PublicPortfolioWorkspaceV143";
import { addCategoryCountV164, categoryCountValueV164, publicPortfolioFacetV132 } from "./PublicPortfolioSummaryV132";
import { categoryVariantKeyV164 } from "../../../data/visualization/publicCategoryLabelV164";
import { isPublicMapFactV143, publicMapFactSourcesV143, hasPublicMapFactValueV143 } from "../../../data/visualization/publicMapCopyV143";
import { readDownloadJsonV158 } from "../../../data/testing/downloadZipV158";

const entities: VietnamEntityV124[] = readDownloadJsonV158("d-026").entities;
const props = { elementId: "D-026", entities, detailTemplate: "portfolio" };

// 2026-09-30 재적재: D-026이 13행 전부 MIGA 보증사업으로 전면 교체됨(과거 5건의 '보증
// 유형 설명' 행은 이번 납품에 없음), 컬럼명도 회계연도_FY→회계연도, 섹터(전력 등 한글)→
// 섹터_원문(Power 등 영문 원어), Project_ID→프로젝트ID로 바뀌었다. 1999년 행(Vung Tau
// Energy Company Limited)은 이번 납품에 없고, Hoi Xuan Hydropower Project는 서로 다른
// 공시 시점(2015/2016)의 두 행으로 갈라져 왔다.
describe("shared portfolio selection", () => {
  it("retains all 13 guarantee rows now that the source ships no separate cover-type rows", () => {
    const result = portfolioSelectionModelV143(props, EMPTY_PORTFOLIO_SELECTION_V143);
    expect(result.filtered).toHaveLength(13);
    expect(result.noteEntities).toHaveLength(0);
    expect(result.total).toBe(13);
    expect(result.years).toContain("1995");
    expect(result.years).toContain("2018");
  });
  it("uses the actual fiscal year, not the dataset stamp or approval date", () => {
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year: "2013" });
    const source = entities.filter((entity) => entity.normalizedAttributes["회계연도"] === "2013");
    expect(result.filtered.map((entity) => entity.recordId)).toEqual(source.map((entity) => entity.recordId));
    expect(result.filtered).toHaveLength(4);
  });
  it("combines year and category conditions without changing the source", () => {
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year: "2016", category: "Power" });
    expect(result.filtered).toHaveLength(1);
    expect(result.filtered[0].normalizedAttributes["프로젝트ID"]).toBe("12869");
    expect(entities).toHaveLength(13);
  });
  it("applies a title query and returns a genuine empty selection", () => {
    // Hoi Xuan Hydropower Project now ships as two rows (2015 ESRS disclosure,
    // 2016 Project Brief disclosure of the same guarantee), both matching.
    expect(portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, query: "Hoi Xuan" }).filtered).toHaveLength(2);
    expect(portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, query: "존재하지 않는 검색어" }).filtered).toHaveLength(0);
  });
});

// V164-3: year and category each offer only what the other one's choice leaves, so
// no pair the reader can pick ends in "조건에 맞는 자료가 없습니다" (D-017).
describe("cross-conditioned selectors", () => {
  const allOffered = portfolioSelectionModelV143(props, EMPTY_PORTFOLIO_SELECTION_V143);

  it("offers every year and every category while nothing is chosen", () => {
    expect(allOffered.years.length).toBeGreaterThan(1);
    expect(allOffered.categories.length).toBeGreaterThan(1);
  });

  it("narrows the categories to the chosen year, and the years to the chosen category", () => {
    const narrowedByYear = allOffered.years.some(
      (year) => portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year }).categories.length < allOffered.categories.length
    );
    const narrowedByCategory = allOffered.categories.some(
      (category) => portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, category }).years.length < allOffered.years.length
    );
    expect(narrowedByYear).toBe(true);
    expect(narrowedByCategory).toBe(true);
  });

  it("every year x category pair that is offered leads to a record", () => {
    for (const year of allOffered.years) {
      const categories = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year }).categories;
      for (const category of categories) {
        const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year, category });
        expect(result.filtered.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the reader's current choice in its own list", () => {
    const year = allOffered.years[0];
    const category = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year }).categories[0];
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year, category });
    expect(result.years).toContain(year);
    expect(result.categories).toContain(category);
  });

  it("does not change the totals or the source rows", () => {
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year: allOffered.years[0] });
    expect(result.total).toBe(allOffered.total);
    expect(entities).toHaveLength(13);
  });
});

// V164 R2: C-025 delivered one status in two spellings (GOLD_STANDARD_CERTIFIED_DESIGN
// and "Gold Standard Certified Design"); the status selector offered it twice and a
// chart counted two bars with one Korean name.
describe("one choice per classification (R2)", () => {
  const registry = readDownloadJsonV158("c-025").entities as VietnamEntityV124[];
  const registryProps = { elementId: "C-025", entities: registry, detailTemplate: "portfolio" };

  it("offers one entry for every spelling-insensitive category", () => {
    const { categories } = portfolioSelectionModelV143(registryProps, EMPTY_PORTFOLIO_SELECTION_V143);
    const keys = categories.map((category) => categoryVariantKeyV164(category));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("selecting a category finds the records of every spelling of it", () => {
    const all = portfolioSelectionModelV143(registryProps, EMPTY_PORTFOLIO_SELECTION_V143);
    const counted = all.categories.reduce(
      (sum, category) => sum + portfolioSelectionModelV143(registryProps, { ...EMPTY_PORTFOLIO_SELECTION_V143, category }).filtered.length,
      0
    );
    // every record that has a category is reachable through exactly one entry
    const withCategory = registry.filter((entity) => publicPortfolioFacetV132("C-025", entity, "portfolio").category).length;
    expect(counted).toBeLessThanOrEqual(withCategory);
    expect(counted).toBeGreaterThan(0);
  });
});

describe("category counting (R2)", () => {
  it("counts two spellings of one status as one bar, under the first spelling", () => {
    const counts = new Map<string, number>();
    ["Gold Standard Certified Design", "GOLD_STANDARD_CERTIFIED_DESIGN", "Listed", "LISTED", "Listed"].forEach((value) => addCategoryCountV164(counts, value));
    expect([...counts.entries()]).toEqual([["Gold Standard Certified Design", 2], ["Listed", 3]]);
  });

  it("counts a nationality without the ownership share and a round without the new-round note", () => {
    expect(categoryCountValueV164("D-012", "entryCountry", "Vietnam(100%)")).toBe("베트남");
    expect(categoryCountValueV164("D-012", "entryCountry", "베트남")).toBe("베트남");
    expect(categoryCountValueV164("D-024", "fundingRound", "Series B(신규 라운드)")).toBe("Series B");
    expect(categoryCountValueV164("D-024", "sector", "Finance")).toBe("Finance");
  });
});

describe("public map copy", () => {
  it("aligns E-018 map facts with the reviewed detail columns", () => {
    // 2026-09-30 재적재: E-018이 KOTRA 해외진출기업 디렉토리 기준으로 24행→36행으로
    // 재구성되며 순서가 바뀌어, 더 이상 entities[0]이 SK E&S가 아니다(현재는 한화솔루션).
    // SK E&S 행을 회사명으로 찾으면, 사업 분야 원문에는 KOTRA 업종 분류가 " | KOTRA 업종: "
    // 형태로 실제로 붙어서 온다(원자료 그대로). 옛 서술(지분 M&A 상세, 설립연도)은 KOTRA
    // 디렉토리 원천에 없어 이번 납품에 오지 않는다(설립연도는 null).
    const entities = readDownloadJsonV158("e-018").entities as { normalizedAttributes: Record<string, unknown> }[];
    const source = entities.find((entity) => String(entity.normalizedAttributes.companyName || "").includes("SK E&S"))!
      .normalizedAttributes;
    const fact = (key: string) => publicMapFactSourcesV143("E-018", { key, sources: ["wrong"] });
    expect(source[fact("sector").sources[0]]).toBe("RE(C&I 옥상태양광)·LNG 터미널·그린수소 | KOTRA 업종: D. 전기, 가스, 증기 및 공기 조절 공급업");
    expect(source[fact("entryForm").sources[0]]).toContain("지사");
    expect(source[fact("establishedYear").sources[0]]).toBeNull();
  });
  it("omits missing boilerplate but preserves zero and a meaningful negative status", () => {
    [null, undefined, "", "-", "무(공개된 정보 없음)"].forEach((value) => expect(hasPublicMapFactValueV143(value)).toBe(false));
    [0, "0", "사무소 미설치", "미진출(확인)"].forEach((value) => expect(hasPublicMapFactValueV143(value)).toBe(true));
  });
  it("removes technical quality labels while retaining real values and sources", () => {
    ["위치 정밀도", "공간 정확도", "지도 표시 범위", "값 제공 여부", "정확도 한계"].forEach((label) => expect(isPublicMapFactV143(label)).toBe(false));
    ["발전원", "용량", "자료연도", "출처", "지역", "사업유형"].forEach((label) => expect(isPublicMapFactV143(label)).toBe(true));
  });
});
