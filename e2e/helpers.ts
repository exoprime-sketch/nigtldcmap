import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const BUILD = resolve(ROOT, process.env.NIGT_E2E_BUILD || ".verify/candidate/build");

/** Every element the candidate publishes, read from the build it serves. */
export function candidateElementIds(): string[] {
  const catalog = JSON.parse(
    readFileSync(resolve(BUILD, "data/vietnam/v2/catalog.json"), "utf8")
  ) as { elements: Array<{ elementId: string }> };
  return catalog.elements.map((row) => row.elementId).sort();
}

export const detailUrl = (elementId: string) =>
  `/?view=data&country=VNM&element=${elementId}#element-detail`;

/**
 * Wait for the analysis to finish rather than for a fixed delay.
 *
 * The route reports its own state, so a slow shard fails as a timeout with the
 * state it reached rather than as a flake.
 */
export async function openDetail(page: Page, elementId: string) {
  await page.goto(detailUrl(elementId));
  const root = page.getByTestId("public-analysis-root");
  await expect(root).toHaveAttribute("data-analysis-state", /ready|empty/, {
    timeout: 60_000,
  });
  await expect(page.getByTestId("public-analysis-pending")).toHaveCount(0);
  return root;
}

/** Assets the application cannot run without: its bundles and its data. */
const REQUIRED_ASSET = /\/static\/(?:js|css)\/|\/data\/|\.(?:json|geojson)(?:\?|$)/u;

/**
 * Runtime errors the page threw while the test was driving it, and every
 * required asset that did not arrive.
 *
 * The console's own "Failed to load resource … 404" line carries no URL, so
 * it used to be filtered out wholesale and a missing shard, geometry or
 * summary file passed unnoticed (V140). Required assets are now watched on
 * the response itself: a 4xx/5xx, or an HTML page answered where JSON was
 * asked for, is recorded with its URL and is never ignored.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error?.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    const url = response.url();
    if (!REQUIRED_ASSET.test(url)) return;
    if (response.status() >= 400) {
      errors.push(`asset ${response.status()}: ${url}`);
      return;
    }
    const contentType = response.headers()["content-type"] || "";
    if (/\.(?:json|geojson)(?:\?|$)/u.test(url) && contentType.includes("text/html")) {
      errors.push(`html-for-json: ${url}`);
    }
  });
  return errors;
}

/**
 * Console noise that is not the application failing.
 *
 * A missing favicon and a font that the offline runner cannot fetch say nothing
 * about whether the screen works, and failing on them would train the suite to
 * be ignored.
 */
const IGNORED_ERROR = /favicon|net::ERR_(?:INTERNET_DISCONNECTED|NAME_NOT_RESOLVED)|Failed to load resource: the server responded with a status of 404/i;

export const realPageErrors = (errors: string[]) =>
  errors.filter((error) => !IGNORED_ERROR.test(error));

/** Internal shapes that must never reach a public screen. */
export const INTERNAL_TOKEN =
  /\battr_\d+\b|\bfield_[0-9a-f]{8}\b|\bmeasure-[0-9a-f]{12}\b|속성\d+_|VNM\.\d+_\d+/u;

/**
 * V138 map catalogue: bring a dataset's checkbox into reach. The list is a
 * drawer at phone widths and its seven categories fold, so the row may be
 * hidden twice over before a reader can tick it.
 */
export async function revealMapDataset(page: Page, elementId: string) {
  const panel = page.getByTestId("map-layer-panel");
  const collapsed = await panel.evaluate((el) => el.classList.contains("is-collapsed"));
  if (collapsed) await page.locator('[data-testid="map-layer-panel"] .cdp-map-panel-toggle').click();
  const input = page.locator(
    `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`
  );
  await expect(input).toHaveCount(1);
  const toggle = input
    .locator("xpath=ancestor::*[@data-map-group-v135]")
    .locator('[data-testid="map-catalog-group-toggle-v138"]');
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await input.scrollIntoViewIfNeeded();
  return input;
}

/**
 * The layer combinations the removed recommended-analysis buttons used to
 * draw (V150). Same fixture as scripts/v150/map-combinations.mjs, kept in TS
 * because Playwright transpiles specs as CommonJS.
 */
export const MAP_COMBINATIONS_V150: Record<string, string[]> = {
  POWER_INFRASTRUCTURE: ["A-024", "A-023"],
  RENEWABLE_PLANNING: ["C-016", "A-024", "A-023"],
  FOREST_CHANGE: ["B-033", "B-031", "B-034"],
  CLIMATE_VULNERABILITY: ["B-021", "D-008", "D-018"],
  CLIMATE_FINANCE_PROJECTS: ["D-018", "C-025"],
};

/** The shared URL that opens a combination with each layer's published variable and period. */
export function combinationUrl(id: string): string {
  const ids = MAP_COMBINATIONS_V150[id];
  if (!ids) throw new Error(`Unknown combination ${id}`);
  const index = JSON.parse(readFileSync(resolve(BUILD, "data/vietnam/v2/map-index.json"), "utf8")) as {
    layers: Array<{ elementId: string; selectors: { defaultVariable: string; defaultPeriod: string } }>;
  };
  const selectors: Record<string, { variable: string; period: string }> = {};
  for (const elementId of ids) {
    const layer = index.layers.find((item) => item.elementId === elementId);
    if (!layer) throw new Error(`Missing layer ${elementId}`);
    selectors[elementId] = { variable: layer.selectors.defaultVariable, period: layer.selectors.defaultPeriod };
  }
  const params = new URLSearchParams({
    country: "VNM",
    layers: ids.join(","),
    primaryLayer: ids[0],
    focusLayer: ids[0],
    contextLayers: ids.slice(1).join(","),
    mapPreset: id,
    mapSelectors: JSON.stringify(selectors),
  });
  return `/?${params.toString()}#map`;
}
