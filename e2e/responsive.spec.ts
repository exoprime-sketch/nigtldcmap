import { expect, test, type Page } from "@playwright/test";

/**
 * The five widths the service has to work at.
 *
 * Not every screen at every width - that would be a slow way to learn the same
 * thing five times. One representative of each kind of screen, and A-024 at all
 * five, because its line geometry is the one whose usable map area collapsed at
 * 1024 and 958.
 */

const WIDTHS = [390, 768, 958, 1024, 1440];

/** Nothing may stick out sideways: a public page does not scroll horizontally. */
async function expectNoHorizontalOverflow(page: Page, width: number, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    widest: [...document.querySelectorAll("body *")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        if (style.overflowX === "auto" || style.overflowX === "scroll") return false;
        return rect.right > window.innerWidth + 1;
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`),
  }));
  expect(
    overflow.scrollWidth,
    `${label} at ${width}px scrolls sideways (${overflow.widest.join(", ")})`
  ).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

const SCREENS = [
  { id: "home", url: "/", ready: "main" },
  { id: "finder", url: "/?country=VNM#explorer", ready: "main" },
  { id: "detail", url: "/?country=VNM&element=A-016#element-detail", ready: '[data-testid="public-analysis-root"]' },
  { id: "download", url: "/?country=VNM#download", ready: "main" },
];

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const screen of SCREENS) {
      test(`${screen.id} fits the window`, async ({ page }) => {
        await page.goto(screen.url);
        await expect(page.locator(screen.ready).first()).toBeVisible();
        await expectNoHorizontalOverflow(page, width, screen.id);
      });
    }

    test("the map keeps a usable area and its dataset list is reachable", async ({ page }) => {
      await page.goto("/?view=map&country=VNM#map");
      await expect(page.getByTestId("map-public-content")).toBeVisible();
      await page.waitForFunction(
        () => Boolean((window as any).__nigtMapObserverV137?.ready()),
        undefined,
        { timeout: 60_000 }
      );
      await expectNoHorizontalOverflow(page, width, "map");

      const rect = await page.evaluate(() =>
        (window as any).__nigtMapObserverV137.canvasRect()
      );
      // Below 769px the panels stack and the map takes the window; above it the
      // map still has to be the larger half of what is left.
      const minimumShare = width <= 768 ? 0.9 : 0.45;
      expect(
        rect.width / width,
        `the map got ${Math.round(rect.width)}px of ${width}px`
      ).toBeGreaterThan(minimumShare);

      // The dataset list may start closed, but a reader has to be able to open
      // it and reach the layers.
      const panel = page.getByTestId("map-layer-panel");
      const collapsed = await panel.evaluate((el) => el.classList.contains("is-collapsed"));
      if (collapsed) await page.locator('[data-testid="map-layer-panel"] .cdp-map-panel-toggle').click();
      const layer = page.locator('[data-testid="map-all-data-layer-v135"]').first();
      await expect(layer).toBeVisible();
      // The list scrolls; a reader scrolls it. What matters is that the button
      // can be brought into view and pressed, not where it starts.
      await layer.scrollIntoViewIfNeeded();
      await expect(layer).toBeInViewport();
    });

    // A-024 at every width: the transmission line is the geometry that lost its
    // reachable area when the panels grew.
    test("A-024 stays selectable", async ({ page }) => {
      await page.goto("/?view=map&country=VNM#map");
      await page.waitForFunction(
        () => Boolean((window as any).__nigtMapObserverV137?.ready()),
        undefined,
        { timeout: 60_000 }
      );
      const panel = page.getByTestId("map-layer-panel");
      const collapsed = await panel.evaluate((el) => el.classList.contains("is-collapsed"));
      if (collapsed) await page.locator('[data-testid="map-layer-panel"] .cdp-map-panel-toggle').click();
      const button = page.locator(
        '[data-testid="map-all-data-layer-v135"][data-element-id="A-024"]'
      );
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect(page.getByTestId("map-public-content")).toHaveAttribute(
        "data-primary-element",
        "A-024",
        { timeout: 20_000 }
      );
      await page.waitForFunction(
        () => {
          const observer = (window as any).__nigtMapObserverV137;
          return Boolean(observer?.ready() && observer.renderedFeatures("A-024").length > 0);
        },
        undefined,
        { timeout: 60_000 }
      );
      const reachable = await page.evaluate(() => {
        const observer = (window as any).__nigtMapObserverV137;
        return observer
          .renderedFeatures("A-024")
          .slice(0, 20)
          .some((feature: any) => Boolean(observer.hitPointFor("A-024", feature.selectionKey)));
      });
      expect(reachable, `no A-024 segment was reachable at ${width}px`).toBe(true);
    });
  });
}
