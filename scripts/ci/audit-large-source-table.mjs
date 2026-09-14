import assert from "node:assert/strict";
import { resolve } from "node:path";
import { PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "../v125/audit-utils.mjs";
import { launchHeadlessBrowser, startStaticBuildServer, navigate, waitForValue, evaluateValue } from "../v125/browser-runtime.mjs";
import { detailUrlV129 } from "../v129/audit-helpers.mjs";

const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
let browser;
try {
  browser = await launchHeadlessBrowser();
  for (const elementId of ["B-005", "B-006", "B-007"]) {
    const entry = catalog.find(row => row.elementId === elementId);
    const total = Number(entry.observationCount) + Number(entry.entityCount);
    assert.ok(total > 500, "representative large delivery must remain populated");
    await navigate(browser.cdp, detailUrlV129(server.url, elementId));
    await waitForValue(browser.cdp, `document.querySelector('[data-testid="public-analysis-root"][data-element-id="${elementId}"]')?.getAttribute('data-analysis-state') === 'ready'`);
    const snapshot = () => evaluateValue(browser.cdp, `(() => {
      const root = document.querySelector('[data-testid="public-raw-table"]');
      const select = root?.querySelector('select');
      return { open: root?.open, rows: root?.querySelectorAll('tbody tr').length,
        pages: select?.options.length, nodes: document.querySelectorAll('*').length,
        heap: performance.memory?.usedJSHeapSize };
    })()`);
    const closed = await snapshot();
    assert.equal(closed.open, false); assert.equal(closed.rows, 0);
    await evaluateValue(browser.cdp, `document.querySelector('[data-testid="public-raw-table"] summary').click()`);
    await waitForValue(browser.cdp, `document.querySelectorAll('[data-testid="public-raw-table"] tbody tr').length === 200`);
    const first = await snapshot();
    assert.equal(first.pages, Math.ceil(total / 200));
    await evaluateValue(browser.cdp, `(() => { const select = document.querySelector('[data-testid="public-raw-table"] select'); select.value = String(select.options.length - 1); select.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    const lastCount = total % 200 || 200;
    await waitForValue(browser.cdp, `document.querySelectorAll('[data-testid="public-raw-table"] tbody tr').length === ${lastCount}`);
    const last = await snapshot();
    await evaluateValue(browser.cdp, `document.querySelector('[data-testid="public-raw-table"] summary').click()`);
    await waitForValue(browser.cdp, `document.querySelectorAll('[data-testid="public-raw-table"] tbody tr').length === 0`);
    console.log(JSON.stringify({ type: "large-table-check", elementId, total, closed, first, last, status: "PASS" }));
  }
  assert.deepEqual(browser.runtimeErrors, []);
} finally {
  if (browser) await browser.close();
  await server.close();
}
