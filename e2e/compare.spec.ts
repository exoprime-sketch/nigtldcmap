import { expect, test } from "@playwright/test";

/**
 * The side-by-side comparison.
 *
 * Two datasets, two panes, one camera. What matters to a reader is that the
 * panes really hold different data, that each says what it is showing, and that
 * moving one moves the other - the page promises exactly that in its own words.
 */

test("the comparison opens two panes with two datasets and a shared view", async ({ page }) => {
  await page.goto("/?view=map&country=VNM#map");
  await expect(page.getByTestId("map-public-content")).toBeVisible();
  await page.waitForFunction(
    () => Boolean((window as any).__nigtMapObserverV137?.ready()),
    undefined,
    { timeout: 60_000 }
  );

  await page.getByTestId("map-compare-open-v135").first().click();
  const workspace = page.getByTestId("map-comparison-workspace-v135");
  await expect(workspace).toBeVisible();
  await expect(workspace).toContainText("두 데이터를 같은 범위에서 비교");
  await expect(workspace).toContainText("한쪽 지도를 이동하거나 확대하면 다른 지도도 같은 범위로 맞춰집니다");

  const paneA = page.getByTestId("map-compare-pane-a");
  const paneB = page.getByTestId("map-compare-pane-b");
  await expect(paneA).toBeVisible();
  await expect(paneB).toBeVisible();

  const elementA = await paneA.getAttribute("data-element-id");
  const elementB = await paneB.getAttribute("data-element-id");
  expect(elementA).toBeTruthy();
  expect(elementB).toBeTruthy();
  // Comparing a dataset with itself is not a comparison.
  expect(elementA).not.toBe(elementB);

  // Each pane names its own dataset, indicator and year.
  for (const pane of [paneA, paneB]) {
    await expect(pane).toContainText("지표");
    await expect(pane).toContainText("자료연도");
  }
  await expect(page.getByTestId("map-comparison-legend-a")).toBeVisible();
  await expect(page.getByTestId("map-comparison-legend-b")).toBeVisible();

  // Choosing another dataset in pane A changes pane A and leaves B alone.
  const select = paneA.locator('select[aria-label="데이터 A 선택"]');
  const options = await select.locator("option").evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLOptionElement).value)
  );
  const next = options.find((value) => value !== elementA && value !== elementB);
  expect(next, "the comparison offers no third dataset").toBeTruthy();
  await select.selectOption(next!);
  await expect(paneA).toHaveAttribute("data-element-id", next!, { timeout: 20_000 });
  await expect(paneB).toHaveAttribute("data-element-id", elementB!);

  await expect(page.getByTestId("map-comparison-workspace-v135")).toContainText(
    "일반 지도로 돌아가기"
  );
});
