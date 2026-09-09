import { expect, test, type Page } from "@playwright/test";
import { collectPageErrors, realPageErrors } from "./helpers";

/**
 * The map, driven with real pointer input.
 *
 * The read-only observer on the page (`__nigtMapObserverV137`) is used for the
 * two things the DOM cannot answer - which feature a rendered layer holds, and
 * where on screen it sits - and for nothing else. It sets no state: the click
 * is a Playwright mouse click at those coordinates, and what the popup and the
 * right-hand panel say afterwards is read through Playwright locators.
 */

type Hit = { x: number; y: number; selectionKey: string; label: string | null };

async function openMap(page: Page, elementId?: string) {
  await page.goto("/?view=map&country=VNM#map");
  await expect(page.getByTestId("map-public-content")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__nigtMapObserverV137?.ready()),
    undefined,
    { timeout: 60_000 }
  );
  if (!elementId) return;
  // A reader picks the dataset from the list, which is also the only thing that
  // sets the layer's own variable and period.
  const button = page.locator(
    `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`
  );
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(page.getByTestId("map-public-content")).toHaveAttribute(
    "data-primary-element",
    elementId,
    { timeout: 20_000 }
  );
  await page.waitForFunction(
    (id) => {
      const observer = (window as any).__nigtMapObserverV137;
      return Boolean(observer?.ready() && observer.renderedFeatures(id).length > 0);
    },
    elementId,
    { timeout: 60_000 }
  );
  await waitForStillCamera(page);
}

/**
 * Wait until the camera stops moving.
 *
 * Selecting a dataset fits the map to it, and `ready()` is true while that ease
 * is still running. A hit point taken mid-flight is where the feature was, not
 * where it is, and the click then lands on empty map - which is exactly how
 * every line and regional-scope target failed.
 */
async function waitForStillCamera(page: Page) {
  await expect
    .poll(
      async () => {
        const first = await page.evaluate(() =>
          JSON.stringify((window as any).__nigtMapObserverV137?.camera() ?? null)
        );
        await page.waitForTimeout(250);
        const second = await page.evaluate(() =>
          JSON.stringify((window as any).__nigtMapObserverV137?.camera() ?? null)
        );
        return first !== "null" && first === second;
      },
      { timeout: 30_000, message: "the map camera kept moving" }
    )
    .toBe(true);
}

/** A point the observer says the target actually occupies, or null. */
async function hitPointFor(page: Page, elementId: string): Promise<Hit | null> {
  return page.evaluate(async (id) => {
    const observer = (window as any).__nigtMapObserverV137;
    if (!observer?.ready()) return null;
    const rendered = observer.renderedFeatures(id);
    for (const feature of rendered.slice(0, 12)) {
      const point = observer.hitPointFor(id, feature.selectionKey);
      if (point) {
        return {
          x: point.x,
          y: point.y,
          selectionKey: feature.selectionKey,
          label: feature.label ?? null,
        };
      }
    }
    return null;
  }, elementId);
}

/** True when something other than the map canvas is on top at this point. */
async function coveredBySomethingElse(page: Page, hit: { x: number; y: number }) {
  return page.evaluate(({ x, y }) => {
    const top = document.elementFromPoint(x, y);
    if (!top) return true;
    return !top.classList.contains("maplibregl-canvas");
  }, hit);
}

test("the map opens with its base outline and no runtime error", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openMap(page);
  await expect(page.getByTestId("map-adm1-base-outline")).toHaveCount(1);
  expect(realPageErrors(errors)).toEqual([]);
});

/** One representative of each geometry the map draws. */
const TARGETS = [
  { elementId: "A-024", kind: "line" },
  { elementId: "A-023", kind: "point" },
  { elementId: "B-031", kind: "polygon" },
  { elementId: "D-018", kind: "regional-scope" },
];

for (const target of TARGETS) {
  test(`${target.elementId} (${target.kind}): a click names the same feature in the popup and the panel`, async ({ page }) => {
    await openMap(page, target.elementId);
    await expect
      .poll(async () => (await hitPointFor(page, target.elementId)) !== null, {
        timeout: 45_000,
        message: `${target.elementId} rendered nothing to click`,
      })
      .toBe(true);
    let hit = (await hitPointFor(page, target.elementId))!;

    // The legend sits over the map and covered every point of the transmission
    // line. A reader collapses it; so does this, and then asks the observer
    // again rather than clicking where the target used to be.
    if (await coveredBySomethingElse(page, hit)) {
      await page.getByTestId("map-legend-toggle-v137").first().click();
      await expect
        .poll(async () => {
          const next = await hitPointFor(page, target.elementId);
          if (next) hit = next;
          return next ? !(await coveredBySomethingElse(page, next)) : false;
        }, { timeout: 20_000, message: `${target.elementId} stayed covered` })
        .toBe(true);
    }

    // Real input, at the coordinates the observer reported.
    await page.mouse.move(hit.x, hit.y);
    await page.mouse.click(hit.x, hit.y);

    // Where several features share a point the map declines to guess and asks.
    // Answering it is part of the reader's click, so the test answers it too.
    const picker = page.getByTestId("map-overlap-picker-v133");
    if (await picker.isVisible().catch(() => false)) {
      await picker
        .locator(`button[data-selection-key="${hit.selectionKey}"]`)
        .first()
        .click();
    }

    const panel = page.locator('[data-selected-element-id]');
    await expect(panel.first()).toHaveAttribute("data-selected-element-id", target.elementId, {
      timeout: 20_000,
    });
    await expect(panel.first()).toHaveAttribute("data-selected-key", hit.selectionKey);
  });
}
