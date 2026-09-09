import { expect, test } from "@playwright/test";

/**
 * The download screen, taken as far as a file.
 *
 * A public dataset that cannot be taken away is not published, so the test
 * chooses a dataset, asks for CSV and for JSON, and reads what actually
 * arrives: the CSV's header row and the JSON's record contract.
 */

test("the page states what a download will contain before it is asked for", async ({ page }) => {
  await page.goto("/?country=VNM#download");
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.getByTestId("public-download-csv")).toBeVisible();
  await expect(page.getByTestId("public-download-json")).toBeVisible();
  // Nothing chosen yet, so the page says so rather than offering an empty file.
  await expect(page.getByRole("button", { name: "다운로드", exact: true })).toBeDisabled();
  await expect(page.locator(".cdp-download-summary")).toContainText(
    "다운로드할 데이터를 선택해 주세요"
  );
});

test("a chosen dataset downloads as CSV with a header and rows", async ({ page }) => {
  await page.goto("/?country=VNM#download");
  const firstDataset = page.locator('input[type="checkbox"]').first();
  await firstDataset.scrollIntoViewIfNeeded();
  await firstDataset.check();
  await page.getByTestId("public-download-csv").check();

  const summary = page.locator(".cdp-download-summary");
  await expect(summary).toContainText("선택한 데이터");

  const button = page.getByRole("button", { name: "다운로드", exact: true });
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    button.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(path!, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  expect(lines.length, "the CSV has no rows").toBeGreaterThan(1);
  // The flat one-row-per-record schema the download contract fixes.
  expect(lines[0]).toContain("country");
  expect(lines[0]).toContain("element");
  expect(lines[0]).toContain("record_type");
});

test("the same dataset downloads as JSON carrying its record contract", async ({ page }) => {
  await page.goto("/?country=VNM#download");
  const firstDataset = page.locator('input[type="checkbox"]').first();
  await firstDataset.scrollIntoViewIfNeeded();
  await firstDataset.check();
  await page.getByTestId("public-download-json").check();

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    page.getByRole("button", { name: "다운로드", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/i);
  const path = await download.path();
  const { readFileSync } = await import("node:fs");
  const payload = JSON.parse(readFileSync(path!, "utf8"));
  expect(payload).toBeTruthy();
  const rows = Array.isArray(payload) ? payload : payload.rows || payload.records;
  expect(Array.isArray(rows), "the JSON download has no record array").toBe(true);
  expect(rows.length).toBeGreaterThan(0);
});
