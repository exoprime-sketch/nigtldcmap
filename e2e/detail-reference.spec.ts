import { expect, test } from "@playwright/test";
import { openDetail } from "./helpers";

/**
 * The screens whose completeness the rest are measured against, pinned to the
 * values the candidate data actually holds.
 *
 * Every number here was read out of `.staging/final/public/data/vietnam/v2`
 * (packs and semantic shards) and matched against the delivery before it was
 * written down, so a change in the ETL that quietly moves a value fails here
 * rather than passing as "the screen still renders".
 */

test("A-016 states the 2025 supply, its largest source, its unit and its period", async ({ page }) => {
  await openDetail(page, "A-016");
  const analysis = page.getByTestId("public-analysis-primary");
  // A-016_primary_energy_total_primary_energy, 2025 = 4.698950133602493 EJ
  await expect(analysis).toContainText("4.699");
  // A-016_primary_energy_coal, 2025 = 2.569399118423462 EJ
  await expect(analysis).toContainText("2.569");
  await expect(analysis).toContainText("EJ");
  await expect(analysis).toContainText("1965–2025");
  // V146: the 61 years are the options of the detail-year selector rather
  // than a sentence in the panel.
  await expect(analysis.locator('select[aria-label="상세 구성 기준연도"] option')).toHaveCount(61);
  // The share denominator has to be stated, not implied.
  await expect(analysis).toContainText("여섯 에너지원 합계를 100%");
  // The supply total is not one of the six sources and must not be added in.
  await expect(analysis).toContainText("공급 총계는 구성항목과 중복되므로");

  await page.getByTestId("detail-metadata-v135").evaluate((el: HTMLDetailsElement) => { el.open = true; });
  const source = page.getByTestId("public-source-panel");
  await expect(source).toContainText("Energy Institute");
  await expect(source).toContainText("1965~2025");
});

test("B-005 shows the province distribution rather than a national average", async ({ page }) => {
  await openDetail(page, "B-005");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("63개 성·시 분포");
  // The refusal to average provinces is the point of this screen.
  await expect(analysis).toContainText("성·시 값을 평균한 전국값은 만들지 않고");
  await expect(analysis).toContainText("연속 건조일수");
  // The historical run is CMIP6 model output, not observation; the screen
  // says so and no longer calls it "과거 관측".
  await expect(analysis).toContainText("과거 모형(historical)");
  await expect(analysis).toContainText("CMIP6 모형이 재현한 값");
  await expect(analysis).toContainText("SSP1-2.6");
  // 63 provinces per scenario-year, and the table says so.
  await expect(analysis).toContainText("63");
});

test("D-011 states constant prices, the period and the total it counted", async ({ page }) => {
  await openDetail(page, "D-011");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("2024년 불변가격");
  await expect(analysis).toContainText("USD");
  // V146: the period is the chart's x axis (2020 … 2024) and the hero line.
  await expect(analysis).toContainText("2020");
  await expect(analysis).toContainText("2024");
  await expect(page.getByTestId("public-analysis-root")).toContainText("자료기간 2020~2024년");

  await page.getByTestId("detail-metadata-v135").evaluate((el: HTMLDetailsElement) => { el.open = true; });
  const source = page.getByTestId("public-source-panel");
  await expect(source).toContainText("Creditor Reporting System");
  await expect(source).toContainText("2020~2024");
  await expect(source).toContainText("대베트남 ODA 총지출액");
});

test("A-017 states the year its costs are for, with the unit", async ({ page }) => {
  await openDetail(page, "A-017");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("USD/MWh");
  // V146: the comparison opens on the reported 2023 costs; 2030 and 2050 are
  // forecasts the reader selects. A-017_lcoe_solar_benchmark, 2050 = 21 and
  // A-017_lcoe_coal_benchmark, 2050 = 79 USD/MWh.
  const year = analysis.locator('select[aria-label="발전비용 비교 연도"]');
  await expect(year).toHaveValue("2023");
  await year.selectOption("2050");
  await expect(analysis).toContainText("2050년 발전원별 균등화 발전비용");
  const rows = analysis.locator(".detail146-range-chart li");
  await expect(rows.filter({ hasText: "태양광" }).first()).toContainText("21");
  await expect(rows.filter({ hasText: "석탄화력" }).first()).toContainText("79");
});

test("B-034 keeps one item per measure and names its provider", async ({ page }) => {
  await openDetail(page, "B-034");
  const measure = page.locator('[data-testid="v125-measure-select"]');
  const labels = await measure.locator("option").allInnerTexts();
  // "Mg CO2e/yr" and "Mg CO₂e/yr" are the same unit; the sheet writes both and
  // the screen used to offer the same series twice under each spelling.
  const normalised = labels.map((label) => label.replace(/[₀-₉]/gu, (d) => String("₀₁₂₃₄₅₆₇₈₉".indexOf(d))));
  expect(new Set(normalised).size).toBe(normalised.length);
  expect(labels.join(" ")).not.toContain("CO₂");

  await page.getByTestId("detail-metadata-v135").evaluate((el: HTMLDetailsElement) => { el.open = true; });
  await expect(page.getByTestId("public-source-panel")).toContainText("Global Forest Watch");
});

test("D-022 counts what it says it counts", async ({ page }) => {
  await openDetail(page, "D-022");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("사업 15건 / 전체 15건");
  await expect(analysis).toContainText("통화가 확인된 금액만 통화별로 합산합니다");
  // V146: the totals live in the inspectable summary table.
  const summary = analysis.getByTestId("analysis-summary-table-v146");
  await summary.evaluate((el: HTMLDetailsElement) => { el.open = true; });
  await expect(summary).toContainText("사업 수");
  await expect(summary).toContainText("1,876,471,402");
  await expect(summary).toContainText("금액이 기재된 15건");
});

test("D-025 separates the record count from the amounts it could total", async ({ page }) => {
  await openDetail(page, "D-025");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("사업 132건 / 전체 132건");
  // 132 projects, of which 125 carry an amount in a stated currency.
  const summary = analysis.getByTestId("analysis-summary-table-v146");
  await summary.evaluate((el: HTMLDetailsElement) => { el.open = true; });
  await expect(summary).toContainText("28,967,130,000");
  await expect(summary).toContainText("금액이 기재된 125건");
});
