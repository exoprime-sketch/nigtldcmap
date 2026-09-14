import { expect, test } from "@playwright/test";

/**
 * Visual baselines for the screens a reader actually starts from.
 *
 * Deliberately five, not 152: a golden image per screen would fail on every
 * data refresh and teach everyone to update baselines without looking. These
 * five are the layouts, and the map is excluded because a rendered tile is not
 * stable enough to be a pass/fail signal.
 */

const SCREENS = [
  { id: "home", url: "/" },
  { id: "finder", url: "/?country=VNM#explorer" },
  { id: "detail-a016", url: "/?country=VNM&element=A-016#element-detail" },
  { id: "detail-d011", url: "/?country=VNM&element=D-011#element-detail" },
  { id: "download", url: "/?country=VNM#download" },
];

for (const screen of SCREENS) {
  test(`${screen.id} matches its baseline`, async ({ page }) => {
    await page.goto(screen.url);
    if (screen.url.includes("element-detail")) {
      await expect(page.getByTestId("public-analysis-root")).toHaveAttribute(
        "data-analysis-state",
        /ready|empty/,
        { timeout: 60_000 }
      );
    } else {
      await expect(page.locator("main").first()).toBeVisible();
    }
    // Charts animate in; the baseline is the settled screen.
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot(`${screen.id}.png`, {
      fullPage: false,
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });
}
