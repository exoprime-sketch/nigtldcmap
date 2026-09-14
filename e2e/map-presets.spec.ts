import { expect, test, type Page } from "@playwright/test";

/**
 * The five recommended analyses, opened the way the page offers them.
 *
 * A preset names a primary dataset and one or two context layers, applies the
 * variable and period each one publishes, and leaves the context behind a
 * 함께 보기 toggle. All of that is checked here: what it draws, what it says it
 * drew, and that pressing 함께 보기 adds the layer the card promised.
 */

const PRESETS = [
  { id: "POWER_INFRASTRUCTURE", primary: "A-024", context: "A-023" },
  { id: "RENEWABLE_PLANNING", primary: "C-016", context: "A-024" },
  { id: "FOREST_CHANGE", primary: "B-033", context: "B-031" },
  { id: "CLIMATE_VULNERABILITY", primary: "B-021", context: "D-008" },
  { id: "CLIMATE_FINANCE_PROJECTS", primary: "D-018", context: "C-025" },
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
  test(`${preset.id} draws its own data and says what it left off`, async ({ page }) => {
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

    // The card promises more than one layer; the notice says where the rest is.
    const notice = page.locator('[role="status"]').filter({ hasText: "함께 보기" });
    await expect(notice.first()).toBeVisible();

    // And pressing it adds the layer the card named.
    const toggle = page
      .locator('[data-testid="map-context-toggle-v133"][aria-pressed="false"]')
      .first();
    await toggle.click();
    await expect(content).toHaveAttribute(
      "data-rendered-map-elements",
      new RegExp(preset.context),
      { timeout: 20_000 }
    );
  });
}
