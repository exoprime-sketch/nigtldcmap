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

/** Runtime errors the page threw while the test was driving it. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error?.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
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
