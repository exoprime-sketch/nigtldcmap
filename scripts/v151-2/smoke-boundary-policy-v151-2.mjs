// V151-2 smoke: open the map on a production build, tick representative
// layers under the 34-unit outline, and record what the renderer actually
// produced (feature counts per boundary mode, popup lines, console errors).
//
//   node scripts/v151-2/smoke-boundary-policy-v151-2.mjs --build tmp/build-v151-2-review
//   [--ids B-033,B-041,C-019,B-021,B-042,A-023] [--out reports/v151-2/smoke-boundary-policy.json]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, arg("--build", "tmp/build-v151-2-review"));
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/smoke-boundary-policy.json"));
const IDS = arg("--ids", "B-033,B-041,C-019,B-021,B-042,A-023").split(",");
const SHOTS = resolve(ROOT, "reports/v151-2/shots");
mkdirSync(SHOTS, { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: 0 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() !== "error") return;
  if (/net::ERR_|Failed to load resource/u.test(message.text())) return;
  consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

const tick = async (elementId) => {
  await page.evaluate(() => {
    const toggle = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
    if (toggle && toggle.getAttribute("aria-expanded") === "false") toggle.click();
  });
  await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    const group = input?.closest("[data-map-group-v135]");
    const groupToggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (groupToggle && groupToggle.getAttribute("aria-expanded") !== "true") groupToggle.click();
  }, elementId);
  await page.locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`).click();
};
const rendered = async () =>
  (await page.locator('[data-testid="map-public-content"]').getAttribute("data-rendered-map-elements")) || "";
const waitRendered = async (elementId, timeout = 40000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await rendered()).split(/[,\s]+/u).includes(elementId)) return true;
    await page.waitForTimeout(500);
  }
  return false;
};
// What the renderer holds for the primary layer's fill source.
const sourceSummary = async (elementId) =>
  page.evaluate((id) => {
    const map = window.__cdpMapV151;
    if (!map) return { error: "no map handle" };
    const suffix = `vnm-${id}`.toLowerCase();
    if (!map.getSource(`v122-source-${suffix}`)) return { error: "no source" };
    // Rendered source features, one per feature id (tiles repeat features).
    const seen = new Set();
    const features = map.querySourceFeatures(`v122-source-${suffix}`).filter((f) => {
      const key = String(f.id ?? f.properties.selectionKey);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!features.length) return { error: "no rendered source features" };
    const withValue = features.filter((f) => f.properties.hasValue);
    const sample = withValue.find((f) => f.properties.memberSummary) || withValue[0];
    return {
      featureCount: features.length,
      withValue: withValue.length,
      boundarySystem: features[0]?.properties.boundarySystem || "pre-2025-63",
      policyKind: features[0]?.properties.policyKind || null,
      sampleName: sample?.properties.adm1Name,
      sampleValue: sample?.properties.value,
      sampleMemberSummary: sample?.properties.memberSummary || null,
      sampleParent: sample?.properties.parentUnitName || null,
      layerIds: (map.getStyle().layers || []).map((l) => l.id).filter((l) => l.includes(suffix)),
    };
  }, elementId);

const report = { build: BUILD.replace(ROOT, ""), layers: {}, notice: {}, consoleErrors };
await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".cdp-map-boundary-system-v151", { timeout: 60000 });
await page.waitForSelector('[data-testid="map-public-content"]', { timeout: 60000 });
await page.waitForTimeout(3000);

for (const id of IDS) {
  await tick(id);
  const ok = await waitRendered(id);
  await page.waitForTimeout(1500);
  const notice = await page.getByTestId("map-boundary-value-notice-v151").innerText().catch(() => "");
  const policyAttr = await page.getByTestId("map-boundary-value-notice-v151").getAttribute("data-boundary-policy").catch(() => null);
  report.layers[id] = { rendered: ok, mode34: await sourceSummary(id), noticeOn34: notice, policyAttr };
  await page.screenshot({ path: resolve(SHOTS, `smoke-${id}-34.png`) });
  // 63 toggle: original values, original outline.
  await page.locator('input[name="cdp-map-boundary-system-v151"][value="pre-2025-63"]').check();
  await page.waitForTimeout(2500);
  report.layers[id].mode63 = await sourceSummary(id);
  report.layers[id].noticeOn63 = await page.getByTestId("map-boundary-value-notice-v151").innerText().catch(() => "");
  await page.screenshot({ path: resolve(SHOTS, `smoke-${id}-63.png`) });
  await page.locator('input[name="cdp-map-boundary-system-v151"][value="post-2025-34"]').check();
  await page.waitForTimeout(2000);
  // untick so the next layer becomes primary
  await tick(id);
  await page.waitForTimeout(800);
  process.stdout.write(`${id} rendered=${ok} 34=${JSON.stringify(report.layers[id].mode34).slice(0, 220)}\n`);
}
report.labelLayers = await page.evaluate(() => {
  const map = window.__cdpMapV151;
  const names = map?.getSource("cdp-ko-labels-v151")
    ? [...new Set(map.querySourceFeatures("cdp-ko-labels-v151").map((f) => `${f.properties.kind}:${f.properties.name}`))]
    : [];
  return { count: names.length, danang: names.filter((n) => n.endsWith(":다낭")), sample: names.slice(0, 12) };
});
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ type: "summary", audit: "smoke-boundary-policy:v151-2", consoleErrors: consoleErrors.length, labels: report.labelLayers })}\n`);
await browser.close();
await server.close();
process.exit(consoleErrors.length ? 1 : 0);
