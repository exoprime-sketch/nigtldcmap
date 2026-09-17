import { expect, test, type Page } from "@playwright/test";

/**
 * The five recommended analyses, opened the way the page offers them.
 *
 * A preset names a primary dataset and one or two context layers, applies the
 * variable and period each one publishes, and (V138) draws the combination the
 * card names. All of that is checked here: what it draws, and what it says it
 * drew.
 */

const PRESETS = [
  { id: "POWER_INFRASTRUCTURE", label: "전력 인프라", primary: "A-024", context: "A-023" },
  { id: "RENEWABLE_PLANNING", label: "재생에너지 계획", primary: "C-016", context: "A-024" },
  { id: "FOREST_CHANGE", label: "산림 변화", primary: "B-033", context: "B-031" },
  { id: "CLIMATE_VULNERABILITY", label: "기후 취약성", primary: "B-021", context: "D-008" },
  { id: "CLIMATE_FINANCE_PROJECTS", label: "기후재원 사업", primary: "D-018", context: "C-025" },
];

async function openMap(page: Page) {
  await page.goto("/?view=map&country=VNM#map");
  await expect(page.getByTestId("map-public-content")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__nigtMapObserverV137?.ready()),
    undefined,
    { timeout: 60_000 }
  );
}

test("the page offers exactly the five recommended analyses", async ({ page }) => {
  await openMap(page);
  await expect(page.getByTestId("map-analysis-preset")).toHaveCount(5);
});

for (const preset of PRESETS) {
  test(`${preset.id} draws the combination its card names`, async ({ page }) => {
    await openMap(page);
    await page.locator(`[data-testid="map-analysis-preset"][data-preset-id="${preset.id}"]`).click();

    const content = page.getByTestId("map-public-content");
    await expect(content).toHaveAttribute("data-map-preset", preset.id);
    await expect(content).toHaveAttribute("data-primary-element", preset.primary);

    // Something is actually on the map, not just selected in the list.
    await page.waitForFunction(
      (id) => {
        const observer = (window as any).__nigtMapObserverV137;
        return Boolean(observer?.ready() && observer.renderedFeatures(id).length > 0);
      },
      preset.primary,
      { timeout: 60_000 }
    );

    // The panel states the dataset, its variable, its year and its unit.
    const analysis = page.getByTestId("map-analysis-panel");
    await expect(analysis).toContainText("데이터명");
    await expect(analysis).toContainText("자료연도");
    await expect(analysis).toContainText("단위");

    // V138: the card names a combination and the preset draws it. The notice
    // names what was drawn, and the companion is on the map without a second
    // press.
    const notice = page.locator('[role="status"]').filter({ hasText: preset.label });
    await expect(notice.first()).toBeVisible();
    await expect(content).toHaveAttribute(
      "data-rendered-map-elements",
      new RegExp(preset.context),
      { timeout: 30_000 }
    );
    await expect(content).toHaveAttribute(
      "data-context-elements",
      new RegExp(preset.context)
    );
  });
}
