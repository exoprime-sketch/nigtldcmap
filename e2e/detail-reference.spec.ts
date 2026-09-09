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
  await expect(analysis).toContainText("61개 연도");
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
  await expect(analysis).toContainText("과거 관측");
  await expect(analysis).toContainText("SSP1-2.6");
  // 63 provinces per scenario-year, and the table says so.
  await expect(analysis).toContainText("63");
});

test("D-011 states constant prices, the period and the total it counted", async ({ page }) => {
  await openDetail(page, "D-011");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("2024년 불변가격");
  await expect(analysis).toContainText("USD");
  await expect(analysis).toContainText("2020–2024");

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
  // A-017_lcoe_solar_benchmark, 2050 = 21 USD/MWh; the year selector opens on
  // the last published year and the screen says which one it is.
  const year = page.locator('[data-testid="public-selector"] select[aria-label="연도 선택"]');
  await expect(year).toHaveValue("2050");
  await expect(analysis).toContainText("21 USD/MWh");
  // A-017_lcoe_coal_benchmark, 2050
  await expect(analysis).toContainText("79 USD/MWh");
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
  await expect(analysis).toContainText("총 사업 수");
  await expect(analysis).toContainText("15");
  await expect(analysis).toContainText("18.76억");
  await expect(analysis).toContainText("USD · 15건");
  await expect(analysis).toContainText("통화가 확인된 금액만 통화별로 합산합니다");
});

test("D-025 separates the record count from the amounts it could total", async ({ page }) => {
  await openDetail(page, "D-025");
  const analysis = page.getByTestId("public-analysis-primary");
  await expect(analysis).toContainText("총 사업 수");
  await expect(analysis).toContainText("132");
  // 132 projects, of which 125 carry an amount in a stated currency.
  await expect(analysis).toContainText("289.67억");
  await expect(analysis).toContainText("USD · 125건");
});
