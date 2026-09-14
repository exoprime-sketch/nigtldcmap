import { expect, test } from "@playwright/test";
import {
  INTERNAL_TOKEN,
  candidateElementIds,
  collectPageErrors,
  openDetail,
  realPageErrors,
} from "./helpers";

/**
 * Every published detail screen, at 1440.
 *
 * What this checks is mechanical: the route loads, the analysis finishes, the
 * page throws nothing, the title is the element's own, no internal shape
 * reaches the text, and the first control changes the result. Passing here does
 * not mean the screen says the right thing about its data - that judgement is
 * the meaning review, and it is recorded separately.
 */
const ELEMENT_IDS = candidateElementIds();

test.describe("detail screens", () => {
  for (const elementId of ELEMENT_IDS) {
    test(`${elementId} loads, states its data and answers its controls`, async ({ page }) => {
      const errors = collectPageErrors(page);
      const root = await openDetail(page, elementId);

      await expect(page.getByTestId("public-data-title")).toBeVisible();
      const title = (await page.getByTestId("public-data-title").innerText()).trim();
      expect(title.length).toBeGreaterThan(1);

      const analysis = page.getByTestId("public-analysis-primary");
      await expect(analysis).toBeVisible();
      const text = await analysis.innerText();
      expect(text.trim().length, `${elementId} rendered no analysis`).toBeGreaterThan(0);
      expect(text, `${elementId} exposes an internal key`).not.toMatch(INTERNAL_TOKEN);

      // 제공기관 and 자료기간 are what a public dataset has to state.
      const source = page.getByTestId("detail-metadata-v135");
      await source.evaluate((element: HTMLDetailsElement) => { element.open = true; });
      const sourceText = await page.getByTestId("public-source-panel").innerText();
      expect(sourceText).toContain("제공기관");
      expect(sourceText).toContain("자료기간");

      const selects = page.locator('[data-testid="public-selector"] select');
      const count = await selects.count();
      if (count > 0) {
        const control = selects.first();
        const options = control.locator("option");
        const optionCount = await options.count();
        // A selector the screen offers has to have something to choose.
        expect(optionCount, `${elementId} offers a selector with one option`).toBeGreaterThan(1);
        const before = await analysis.innerText();
        const selectedIndex = await control.evaluate((el: HTMLSelectElement) => el.selectedIndex);
        const wanted = selectedIndex === 1 ? 0 : 1;
        // Real input: focus the control and walk the option list with the
        // keyboard, the way a reader without a mouse does.
        await control.focus();
        await control.selectOption({ index: wanted });
        await expect
          .poll(async () => (await analysis.innerText()) !== before, {
            timeout: 15_000,
            message: `${elementId}: the first selector changed nothing on screen`,
          })
          .toBe(true);
      }

      expect(realPageErrors(errors), `${elementId} threw at runtime`).toEqual([]);
      await expect(root).toHaveAttribute("data-analysis-state", /ready|empty/);
    });
  }
});
