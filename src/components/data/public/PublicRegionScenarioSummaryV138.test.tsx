import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import PublicRegionScenarioSummaryV138, {
  defaultComparisonYearV164,
  fallbackMeasureLabel,
  fallbackUnit,
  preferredMeasureByTitle,
  regionScenarioShapeV138,
  stationNameCountV164,
  stationRowsV164,
  summaryRowsV164,
} from "./PublicRegionScenarioSummaryV138";
import { DataCountryProviderV158 } from "../../../data/countries/DataCountryContextV158";
import { AnalysisContractContextV153 } from "./analysisContractContextV153";
import { loadCountryRegistryV158, resetCountryRegistryCacheV158 } from "../../../data/countryContext";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { VisualizationContractRowV153 } from "../../../data/visualization/publicVisualizationContractV153";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";

// The chart's own layout needs a browser; this suite is about what the summary says around it.
jest.mock("../../charts/InteractiveTimeSeriesChartV127", () => ({
  InteractiveTimeSeriesChartV127: ({ testId }: { testId?: string }) => <div data-testid={testId} />,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let n = 0;
function row(elementId: string, attributes: Record<string, unknown>): VietnamEntityV124 {
  n += 1;
  return {
    recordId: `${elementId}-${n}`,
    elementId,
    indicatorId: `${elementId}_indicator`,
    normalizedAttributes: attributes,
  } as unknown as VietnamEntityV124;
}

const DIVISIONS = ["Barisal", "Chittagong", "Dhaka", "Khulna"];

/** A BGD-like scenario delivery: divisions x scenarios x years, plus the national row. */
function scenarioRows(elementId: string, years: number[], scenarios = ["ssp126", "ssp245"], skip: (region: string, year: number) => boolean = () => false) {
  const rows: VietnamEntityV124[] = [];
  scenarios.forEach((scenario, s) => {
    years.forEach((year, y) => {
      DIVISIONS.forEach((region, r) => {
        if (skip(region, year)) return;
        rows.push(row(elementId, {
          지역명_로마자: region,
          행정단위: "Division",
          시나리오: scenario,
          연도: year,
          연평균_기온: 25 + r * 0.5 + y + s,
          연평균_최고기온: 30 + r * 0.5 + y + s,
        }));
      });
      rows.push(row(elementId, { 지역명_로마자: "Bangladesh", 행정단위: "Country", 시나리오: scenario, 연도: year, 연평균_기온: 26 + y + s, 연평균_최고기온: 31 + y + s }));
    });
  });
  return rows;
}

const state = (overrides: Partial<DataFinderSelectorStateV125> = {}): DataFinderSelectorStateV125 =>
  ({ dimensions: {}, year: null, period: null, ...overrides }) as unknown as DataFinderSelectorStateV125;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  resetCountryRegistryCacheV158();
});

async function makeBangladeshLive() {
  (globalThis as { fetch?: typeof fetch }).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      schemaVersion: "countries-v158",
      countries: [
        { iso3: "VNM", nameKo: "베트남", status: "live", adm: { level1: { count: 63, label: "", asset: "", keyScheme: "" } } },
        { iso3: "BGD", nameKo: "방글라데시", status: "live", adm: { level1: { count: 8, label: "주(Division)", asset: "", keyScheme: "" } } },
      ],
    }),
  })) as unknown as typeof fetch;
  await loadCountryRegistryV158((path) => path);
}

function draw(entities: VietnamEntityV124[], options: { elementId?: string; country?: string; primary?: string; selector?: DataFinderSelectorStateV125; title?: string } = {}) {
  const contract = options.primary ? ({ primary: { type: options.primary } } as unknown as VisualizationContractRowV153) : null;
  return act(async () => {
    root.render(
      <DataCountryProviderV158 country={options.country || "BGD"}>
        <AnalysisContractContextV153.Provider value={contract}>
          <PublicRegionScenarioSummaryV138
            elementId={options.elementId || "B-904"}
            entities={entities}
            elementTitle={options.title || "미래 기후"}
            selectorState={options.selector || state()}
            onSelectorStateChange={() => undefined}
          />
        </AnalysisContractContextV153.Provider>
      </DataCountryProviderV158>
    );
  });
}

const textOf = (selector: string) => container.querySelector(selector)?.textContent || "";

describe("measure labels and units read off a column key (V164)", () => {
  test("crown-cover keys: the unit is the unit column's, the year is a year", () => {
    expect(fallbackMeasureLabel("수관_면적_2010_ha")).toBe("수관 면적 · 2010년");
    expect(fallbackUnit("수관_면적_2010_ha")).toBe("ha");
    expect(fallbackMeasureLabel("수관_피복률_2000")).toBe("수관 피복률 · 2000년");
    expect(fallbackUnit("수관_피복률_2000")).toBe("%");
    expect(fallbackMeasureLabel("수관_피복률")).toBe("수관 피복률");
    expect(fallbackUnit("수관_피복률")).toBe("%");
  });

  test("a leading period is a period: '2000_2010_증감_ha' is not 'ha · 2000 2010'", () => {
    expect(fallbackMeasureLabel("2000_2010_증감_ha")).toBe("증감 · 2000–2010년");
    expect(fallbackUnit("2000_2010_증감_ha")).toBe("ha");
    expect(fallbackMeasureLabel("2000년_수관_면적_ha")).toBe("수관 면적 · 2000년");
  });

  test("a denominator keeps its name without the unit word glued to it", () => {
    expect(fallbackMeasureLabel("분석대상_면적_ha")).toBe("분석대상 면적");
    expect(fallbackUnit("분석대상_면적_ha")).toBe("ha");
  });

  test("carbon keys state their unit (the unit cell no longer reads '—')", () => {
    expect(fallbackUnit("산림탄소_순플럭스_Mg_CO2e")).toBe("Mg CO2e");
    expect(fallbackMeasureLabel("산림탄소_순플럭스_Mg_CO2e")).toBe("산림탄소 순플럭스");
    expect(fallbackUnit("산림탄소_총흡수_Mg_CO2")).toBe("Mg CO2");
    expect(fallbackUnit("지상부_탄소저장량_Mg_C")).toBe("Mg C");
    expect(fallbackMeasureLabel("지상부_탄소저장량_Mg_C")).toBe("지상부 탄소저장량");
    expect(fallbackUnit("지상부_탄소밀도_Mg_C_ha")).toBe("Mg C/ha");
    expect(fallbackUnit("지상부_바이오매스_밀도_Mg_ha_ESA_CCI")).toBe("Mg/ha");
    expect(fallbackMeasureLabel("지상부_바이오매스_밀도_Mg_ha_ESA_CCI")).toBe("지상부 바이오매스 밀도(ESA CCI)");
    expect(fallbackMeasureLabel("지상부_바이오매스_AGB_Mg_ESA_CCI")).toBe("지상부 바이오매스(AGB ESA CCI)");
  });

  test("keys that already read well keep their reading", () => {
    expect(fallbackMeasureLabel("연속_건조일수_CDD_일")).toBe("연속 건조일수(CDD)");
    expect(fallbackUnit("연속_건조일수_CDD_일")).toBe("일");
    expect(fallbackUnit("연평균_기온")).toBe("°C");
    expect(fallbackMeasureLabel("E_동_비율")).toBe("동 비율(E)");
    expect(fallbackMeasureLabel("W_서_비율")).toBe("서 비율(W)");
    expect(fallbackUnit("W_서_비율")).toBe("%");
    expect(fallbackMeasureLabel("상대해수면_상승_m_2005년_기준")).toBe("상대해수면 상승 · 2005년 기준");
    expect(fallbackUnit("상대해수면_상승_m_2005년_기준")).toBe("m");
    expect(fallbackMeasureLabel("총피해액_천USD_명목")).toBe("총피해액");
    expect(fallbackUnit("총피해액_천USD_명목")).toBe("천 USD(명목)");
    expect(fallbackUnit("기준_물스트레스_점수_0_5")).toBe("점(0~5)");
    expect(fallbackMeasureLabel("기준_물스트레스_점수_0_5")).toBe("기준 물스트레스 · 점수(0~5)");
  });
});

describe("the measure a screen opens on (V164)", () => {
  const keys31 = ["2000_2010_증감_ha", "분석대상_면적_ha", "수관_면적_2000_ha", "수관_면적_2010_ha", "수관_피복률_2000", "수관_피복률_2010"];

  test("'수관 피복률' opens on the cover rate, the newest year, not on the first crown column", () => {
    expect(preferredMeasureByTitle(["수관_면적_ha", "수관_피복률"], "수관 피복률")).toBe("수관_피복률");
    expect(preferredMeasureByTitle(["분석대상_면적_ha", "수관_면적_ha", "수관_피복률"], "수관 피복률")).toBe("수관_피복률");
  });

  test("a stock title opens on the stock, not on a flux that shares one word", () => {
    const keys = ["산림탄소_순플럭스_Mg_CO2e", "산림탄소_총배출_Mg_CO2e", "지상부_탄소저장량_Mg_C"];
    expect(preferredMeasureByTitle(keys, "산림 탄소 저장량")).toBe("지상부_탄소저장량_Mg_C");
  });

  test("a denominator is never the default, and a newer year beats an older one", () => {
    expect(preferredMeasureByTitle(keys31, "수목 피복 면적(산림 총 면적)")).toBe("수관_면적_2010_ha");
  });

  test("no matching word: the first column, as before", () => {
    expect(preferredMeasureByTitle(["가", "나"], "전혀 다른 제목")).toBe("가");
  });
});

describe("rows of the summary (V164)", () => {
  test("river-basin rows are not divisions: BGD B-026 had 8 divisions + 32 basins = '40개 주'", () => {
    const rows = [
      ...DIVISIONS.map((region, i) => row("B-026", { 지역명_로마자: region, 행정단위: "Division", 우세_유향_비율: 10 + i, E_동_비율: 20 + i })),
      ...[1, 2, 3, 4, 5].map((i) => row("B-026", { 지역명_로마자: `HydroBASINS lvl6 40600${i}`, 행정단위: "유역(HydroBASINS lvl6)", 우세_유향_비율: 30 + i, E_동_비율: 40 + i })),
      row("B-026", { 지역명_로마자: "Bangladesh", 행정단위: "Country", 우세_유향_비율: 50, E_동_비율: 51 }),
    ];
    expect(summaryRowsV164(rows)).toHaveLength(DIVISIONS.length + 1);
    const shape = regionScenarioShapeV138(rows);
    expect(shape?.regions.map((item) => item.key)).toEqual(["Barisal", "Chittagong", "Dhaka", "Khulna"]);
    expect(shape?.hasNationalRow).toBe(true);
  });

  test("id and quantile columns are not measures", () => {
    const rows = DIVISIONS.flatMap((region, i) => [
      row("B-026", { 지역명_로마자: region, 행정단위: "Division", PFAF_ID_lvl6: 4000 + i, 유역_ID_MAIN_BAS_lev08_B_025_연계: 5000 + i, 분위수: 50, 신뢰수준: 3, 우세_유향_비율: 10 + i }),
      row("B-026", { 지역명_로마자: region, 행정단위: "Division", PFAF_ID_lvl6: 4100 + i, 유역_ID_MAIN_BAS_lev08_B_025_연계: 5100 + i, 분위수: 50, 신뢰수준: 3, 우세_유향_비율: 20 + i }),
    ]);
    expect(regionScenarioShapeV138(rows)?.measures).toEqual(["우세_유향_비율"]);
  });

  test("a projection delivered at five quantiles reads its median only", () => {
    const stations = ["Hon Dau", "Vung Tau"];
    const rows = stations.flatMap((station, i) =>
      [5, 17, 50, 83, 95].map((q) => row("B-008", { 관측소명_로마자: station, 개편_후_소속_단위: `Unit ${i}`, 시나리오: "SSP2-4.5", 연도: 2100, 분위수: q, 상대해수면_상승_m_2005년_기준: q / 100 }))
    );
    const kept = summaryRowsV164(rows);
    expect(kept).toHaveLength(2);
    expect(kept.every((entity) => entity.normalizedAttributes?.["분위수"] === 50)).toBe(true);
    expect(stationRowsV164(kept)).toBe(true);
    expect(stationNameCountV164(kept)).toBe(2);
  });

  test("administrative rows are not stations", () => {
    expect(stationRowsV164(scenarioRows("B-004", [2030]))).toBe(false);
  });
});

describe("the default comparison year (V164)", () => {
  test("the newest year every reporting region has, not a trailing year few regions reached", () => {
    const byYear = new Map<number, Set<string>>([
      [2023, new Set(["a", "b", "c"])],
      [2024, new Set(["a", "b", "c"])],
      [2025, new Set(["a"])],
    ]);
    expect(defaultComparisonYearV164([2023, 2024, 2025], byYear)).toBe(2024);
  });

  test("complete years keep the last year; no data keeps the last year; no years is unstated", () => {
    const full = new Map<number, Set<string>>([[2090, new Set(["a", "b"])], [2100, new Set(["a", "b"])]]);
    expect(defaultComparisonYearV164([2090, 2100], full)).toBe(2100);
    expect(defaultComparisonYearV164([2090, 2100], new Map())).toBe(2100);
    expect(defaultComparisonYearV164([], new Map())).toBe(-1);
  });
});

describe("PublicRegionScenarioSummaryV138 screen text (V164)", () => {
  test("'모든 시나리오' says which scenario the regional comparison stands on", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100]));
    const scenarioSelect = container.querySelector('select[aria-label="시나리오 선택"]')!;
    expect(scenarioSelect.querySelector("option")?.textContent).toBe("모든 시나리오 (지역 비교는 SSP2-4.5)");
    expect(textOf('[data-testid="region-comparison-scenario-v164"]')).toContain("SSP2-4.5 기준으로 비교합니다");
    expect(textOf('[data-testid="region-comparison-v148"]')).toContain("SSP2-4.5");
  });

  test("a chosen scenario needs no such note", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100]), { selector: state({ dimensions: { scenario: "ssp126" } }) });
    expect(container.querySelector('[data-testid="region-comparison-scenario-v164"]')).toBeNull();
    // The "all" option still says what choosing it would compare on.
    expect(container.querySelector('select[aria-label="시나리오 선택"] option')?.textContent).toBe("모든 시나리오 (지역 비교는 SSP2-4.5)");
    expect(textOf('[data-testid="region-comparison-v148"]')).toContain("SSP1-2.6");
  });

  test("'표시 항목' and its help are separate items", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100]));
    const label = container.querySelector(".prs164__label")!;
    expect(label).not.toBeNull();
    expect(label.firstElementChild?.textContent).toBe("표시 항목");
  });

  test("the lede points to the folded year chart when the comparison opens the screen", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100]), { primary: "region-bar" });
    const lede = textOf('[data-testid="region-scenario-lede-v164"]');
    expect(lede).toContain("'차트 더 보기'");
    expect(lede).toContain("연도별 중앙값과 10~90 분위");
    expect(lede).toContain("먼저 비교합니다");
  });

  test("the lede promises the year chart only where the year chart is the first block", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100]), { primary: "line" });
    const lede = textOf('[data-testid="region-scenario-lede-v164"]');
    expect(lede).toContain("연도별 중앙값과 10~90 분위(지역 간 분포)를 보여줍니다");
    expect(lede).not.toContain("차트 더 보기");
    expect(container.querySelector('[data-testid="region-scenario-chart-v138"]')).not.toBeNull();
  });

  test("a division with no value for the measure is named, not counted (7 of 8, not '8개')", async () => {
    await makeBangladeshLive();
    const rows = scenarioRows("B-904", [2030, 2050, 2100], ["ssp245"]);
    rows.push(row("B-904", { 지역명_로마자: "Sylhet", 행정단위: "Division", 시나리오: "ssp245", 연도: 2030, 연평균_최고기온: 33 }));
    await draw(rows);
    expect(textOf(".pav126-section-heading h3")).toBe("4개 주(Division) 분포");
    expect(textOf('[data-testid="region-missing-v164"]')).toContain("5개 주(Division) 중 이 항목의 값이 없는 곳: 실렛 (Sylhet)");
    const options = [...container.querySelectorAll('select[aria-label="지역 선택"] option')].map((option) => option.textContent);
    expect(options).toContain("실렛 (Sylhet) — 값 없음");
    expect(options).toContain("바리살 (Barisal)");
  });

  test("the comparison opens on the newest complete year, and names the regions a later year lacks", async () => {
    await makeBangladeshLive();
    // 2025 is reported by Barisal only.
    const rows = scenarioRows("B-904", [2023, 2024, 2025], ["ssp245"], (region, year) => year === 2025 && region !== "Barisal");
    await draw(rows);
    const comparison = textOf('[data-testid="region-comparison-v148"]');
    expect(comparison).toContain("2024년");
    expect(comparison).not.toContain("이 시점(2024년)에 값이 없는");
    expect(container.querySelector('[data-testid="region-comparison-missing-v164"]')).toBeNull();
  });

  test("a year picked by the reader that lacks regions lists them", async () => {
    await makeBangladeshLive();
    const rows = scenarioRows("B-904", [2023, 2024, 2025], ["ssp245"], (region, year) => year === 2025 && (region === "Khulna" || region === "Dhaka"));
    await draw(rows, { selector: state({ year: 2025 }) });
    const gap = textOf('[data-testid="region-comparison-missing-v164"]');
    expect(gap).toContain("이 시점(2025년)에 값이 없는 주(Division) 2곳");
    expect(gap).toContain("쿨나 (Khulna)");
    expect(gap).toContain("다카 (Dhaka)");
  });

  test("a single reference year is a 기준연도, not a 기간", async () => {
    await makeBangladeshLive();
    const rows = scenarioRows("B-904", [2026], ["ssp245"]).map((entity) => ({ ...entity }));
    await draw(rows);
    const facts = textOf(".prs138__facts");
    expect(facts).toContain("기준연도2026년");
    expect(facts).not.toContain("기간2026년");
  });

  test("a year range stays a 기간", async () => {
    await makeBangladeshLive();
    await draw(scenarioRows("B-904", [2030, 2050, 2100], ["ssp245"]));
    expect(textOf(".prs138__facts")).toContain("기간2030~2100년");
  });

  test("tide-gauge rows are stations, counted and described as such (VNM B-008)", async () => {
    const stations = [["Hon Dau", "Hải Phòng"], ["Vung Tau", "Hồ Chí Minh"], ["Quy Nhon", "Gia Lai"]];
    const rows = stations.flatMap(([station, unit], i) =>
      [2020, 2050, 2100].flatMap((year, y) =>
        [5, 17, 50, 83, 95].map((q) => row("B-905", { 관측소명_로마자: station, 개편_후_소속_단위: unit, 시나리오: "SSP2-4.5", 연도: year, 분위수: q, 상대해수면_상승_m_2005년_기준: q / 100 + y / 10 + i / 100 }))
      )
    );
    await draw(rows, { country: "VNM", elementId: "B-905", title: "해수면 상승 전망" });
    expect(textOf(".pav126-section-heading h3")).toBe("3개 관측소 분포");
    expect(textOf('[data-testid="region-scenario-lede-v164"]')).toContain("3개 관측소가 가진 값의 분포입니다");
    expect(textOf(".prs138__facts")).toContain("조위관측소 3곳 (소재 성·시 기준으로 분류)");
    expect(textOf(".prs138__facts")).not.toContain("개편 전 63개");
    expect(textOf('[data-testid="region-scenario-constraints-v138"]')).toContain("5·17·50·83·95분위");
    // The median (50) rows alone: no 5th-percentile value reached the regional table.
    expect(textOf('[data-testid="region-scenario-table-v138"]')).not.toContain("0.05");
  });

  test("an administrative delivery keeps '성·시' wording for Viet Nam", async () => {
    const rows = ["Hà Nội", "Đà Nẵng", "Cần Thơ"].flatMap((region, i) =>
      [2030, 2050, 2100].map((year, y) => row("B-904", { 지역명_로마자: region, 행정단위: "Province", 시나리오: "ssp245", 연도: year, 연평균_기온: 24 + i + y, 연평균_최고기온: 29 + i + y }))
    );
    await draw(rows, { country: "VNM" });
    expect(textOf(".pav126-section-heading h3")).toBe("3개 성·시 분포");
    expect(textOf('[data-testid="region-scenario-lede-v164"]')).toContain("3개 성·시가 가진 값의 분포입니다");
    expect(textOf(".prs138__facts")).toContain("성·시(개편 전 63개)");
  });
});
