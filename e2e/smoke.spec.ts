import { expect, test } from "@playwright/test";
import { collectPageErrors, realPageErrors } from "./helpers";

/** The four entry points a reader starts from. */
const ENTRIES = [
  { id: "home", url: "/", ready: "main" },
  { id: "finder", url: "/?country=VNM#explorer", ready: "main" },
  { id: "map", url: "/?view=map&country=VNM#map", ready: '[data-testid="map-public-content"]' },
  { id: "download", url: "/?country=VNM#download", ready: "main" },
];

for (const entry of ENTRIES) {
  test(`${entry.id} loads without a runtime error`, async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(entry.url);
    await expect(page.locator(entry.ready).first()).toBeVisible();
    // The service is Korean-language and says so on every entry point.
    await expect(page.locator("html")).toHaveAttribute("lang", /ko/);
    expect(realPageErrors(errors)).toEqual([]);
  });
}

test("the map draws its base layer and its dataset list", async ({ page }) => {
  await page.goto("/?view=map&country=VNM#map");
  await expect(page.getByTestId("map-public-content")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__nigtMapObserverV137?.ready()),
    undefined,
    { timeout: 60_000 }
  );
  await expect(page.getByTestId("map-adm1-base-outline")).toHaveCount(1);
  expect(await page.getByTestId("map-analysis-preset").count()).toBe(5);
});
