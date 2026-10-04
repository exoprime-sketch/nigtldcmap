import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { RegionCountryContextV162 } from "../../../data/geo/regionDisplayV162";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import PublicEntityCardGridV131, { landCoverFactsV164, regionTitledV164, statedTitleValueV164 } from "./PublicEntityCardGridV131";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164 R2: entity cards whose title was a raw number or a Latin region name, and
 * whose card said nothing but the title (B-035 / B-036). The entities are test
 * inputs shaped like the delivered rows (the columns these cards read).
 */
function landCover(elementId: "B-035" | "B-036", id: string, attributes: Record<string, unknown>): VietnamEntityV124 {
  return {
    recordId: id,
    elementId,
    entityType: "entity",
    countryIso3: "VNM",
    // the delivery names these rows by their key ("VNM.1_1_lc_2022"), so the title is composed
    name: id,
    geometryType: "polygon",
    normalizedAttributes: attributes,
    rawAttributes: {},
    provenance: {},
  } as unknown as VietnamEntityV124;
}

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const cards = () => Array.from(host.querySelectorAll("[data-testid='public-entity-card-v131']"));
const factsOf = (card: Element) => card.querySelector("[data-testid='public-entity-card-facts']")?.textContent || "";

describe("statedTitleValueV164", () => {
  test("a bare number is read with its unit, or left out of the title", () => {
    expect(statedTitleValueV164("89540.384", "USD")).toBe("89,540 USD");
    expect(statedTitleValueV164("12.5", "USD")).toBe("12.5 USD");
    expect(statedTitleValueV164("89540.384")).toBeNull();
    expect(statedTitleValueV164(35710000)).toBeNull();
  });

  test("a year, a word and a value the source writes with its unit stay as they are", () => {
    expect(statedTitleValueV164(2022)).toBe("2022");
    expect(statedTitleValueV164("FIT")).toBe("FIT");
    expect(statedTitleValueV164("18.5 백만 USD")).toBe("18.5 백만 USD");
    expect(statedTitleValueV164("66 MW", "USD")).toBe("66 MW");
    expect(statedTitleValueV164(null)).toBeNull();
    expect(statedTitleValueV164("")).toBeNull();
  });
});

describe("regionTitledV164", () => {
  test("is true for the note a region-and-year row gets", () => {
    expect(regionTitledV164("원천이 개별 명칭 대신 지역·연도로 행을 구분합니다.")).toBe(true);
    expect(regionTitledV164("주 기술 32(물 부문)")).toBe(false);
    expect(regionTitledV164(null)).toBe(false);
    expect(regionTitledV164(undefined)).toBe(false);
  });
});

describe("landCoverFactsV164 (B-035 / B-036)", () => {
  test("B-035 states each class with the area the row gives, in the row's order", () => {
    const entity = landCover("B-035", "a1", { 산림_면적_km: 82.56, 농경지_면적_km: 3215.38, 초지_관목_면적_km: 62.65, 습지_면적_km: null, 나지_면적_km: 0 });
    expect(landCoverFactsV164(entity)).toEqual({ landCoverArea: "산림 82.56 · 농경지 3,215.38 · 초지·관목 62.65 · 나지 0" });
  });

  test("B-036 states each class with its yearly rate, signed, and skips a rate the source did not compute", () => {
    const entity = landCover("B-036", "a2", { 산림_CAGR_yr: 0.0925, 농경지_CAGR_yr: -0.0072, 도시_CAGR_yr: 6.4046, 수체_CAGR_yr: null });
    expect(landCoverFactsV164(entity)).toEqual({ landCoverTrend: "산림 +0.09 · 농경지 -0.01 · 도시 +6.4" });
  });

  test("a row with no class figure and another element have no facts", () => {
    expect(landCoverFactsV164(landCover("B-035", "a3", { 지역명: "AnGiang" }))).toEqual({});
    expect(landCoverFactsV164({ ...landCover("B-035", "a4", { 산림_면적_km: 1 }), elementId: "B-034" } as VietnamEntityV124)).toEqual({});
  });
});

describe("BGD B-002 card", () => {
  const division = (period: string) =>
    ({
      recordId: `b2-${period}`,
      elementId: "B-002",
      entityType: "entity",
      countryIso3: "BGD",
      name: `BGD.8_1_${period}`,
      geometryType: "polygon",
      normalizedAttributes: { 레코드_키: `BGD.8_1_${period}`, 지역명: "Mymensingh", 기간: period, 행정단위: "Division" },
      rawAttributes: {},
      provenance: {},
    }) as unknown as VietnamEntityV124;

  test("a division-and-period card reads the division as 한글명 (현지명), as B-003 and B-004 do", () => {
    act(() =>
      root.render(
        <RegionCountryContextV162.Provider value="BGD">
          <PublicEntityCardGridV131 entities={[division("1901-1930"), division("1991-2020")]} template="generic" detailTemplate="spatial" />
        </RegionCountryContextV162.Provider>
      )
    );
    expect(Array.from(host.querySelectorAll("[data-testid='public-entity-card-title']")).map((node) => node.textContent)).toEqual([
      "마이멘싱 (Mymensingh) · 1901-1930",
      "마이멘싱 (Mymensingh) · 1991-2020",
    ]);
  });
});

describe("D-014 commitment card", () => {
  test("the commitment of the reporting period is not labelled as the project's size", () => {
    const entity = {
      recordId: "d14-1",
      elementId: "D-014",
      entityType: "entity",
      countryIso3: "VNM",
      name: "Central grid solar power",
      normalizedAttributes: { 약정액_합계: 0, 집행액_합계: 3800000, 보고연도: 2013 },
      rawAttributes: {},
      provenance: {},
    } as unknown as VietnamEntityV124;
    act(() => root.render(<PublicEntityCardGridV131 entities={[entity]} template="portfolio" detailTemplate="portfolio" />));
    const facts = factsOf(cards()[0]);
    expect(facts).toContain("약정액(보고기간)");
    expect(facts).not.toContain("규모");
  });
});

describe("B-035 card", () => {
  test("a province-and-year card states its land-cover areas and reads the province in Korean", () => {
    const entities = [
      landCover("B-035", "VNM.1_1_lc_2022", { 지역명: "AnGiang", 연도: 2022, 산림_면적_km: 82.56, 농경지_면적_km: 3215.38 }),
      landCover("B-035", "VNM.1_1_lc_2021", { 지역명: "AnGiang", 연도: 2021, 산림_면적_km: 71.03, 농경지_면적_km: 3227.38 }),
    ];
    act(() => root.render(<PublicEntityCardGridV131 entities={entities} template="generic" detailTemplate="spatial" />));
    expect(cards()).toHaveLength(2);
    const first = factsOf(cards()[0]);
    expect(first).toContain("토지피복 면적(km²)");
    expect(first).toContain("산림 82.56");
    expect(first).toContain("농경지 3,215.38");
    expect(factsOf(cards()[1])).toContain("산림 71.03");
    expect(Array.from(host.querySelectorAll("[data-testid='public-entity-card-title']")).map((node) => node.textContent)).toEqual([
      "안장 (An Giang) · 2022년",
      "안장 (An Giang) · 2021년",
    ]);
  });
});
