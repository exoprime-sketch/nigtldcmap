#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { mapUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136, normalizeTextV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("map-copy:v136");
const mapSource = readFileSync(
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  "utf8"
);

// V136 map vocabulary: the panel names what the reader chose and what the data
// shows, never the system's role for a layer.
const REQUIRED_PANEL_COPY_V136 = ["추천 분석", "지도 데이터", "지도에서 확인할 데이터를 선택하세요"];
const RETIRED_PANEL_COPY_V136 = ["분석 프리셋", "전체 지도 데이터", "주 분석 데이터", "기준연도·기간", "공간표현"];

let server = null;
let browser = null;
let runtimeFailure = null;
let panel = null;
let guide = null;

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1920, 1100);
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  panel = await evaluateValue(
    browser.cdp,
    `(() => {
      const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const left = document.querySelector('[data-testid="map-layer-panel"]');
      const order = [...(left?.querySelectorAll('h1, h2') || [])].map((node) => clean(node.textContent));
      return {
        text: clean(left?.textContent),
        headingOrder: order,
        presetCount: document.querySelectorAll('[data-testid="map-analysis-preset"]').length,
        itemCount: document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length,
      };
    })()`
  );
  guide = await evaluateValue(
    browser.cdp,
    `(() => {
      const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const node = document.querySelector('[data-testid="map-data-guide-v130"]');
      const details = node?.querySelector('details');
      return {
        defaultOpen: Boolean(details?.open),
        headings: [...(node?.querySelectorAll('thead th') || [])].map((th) => clean(th.textContent)),
        rowCount: (node?.querySelectorAll('tbody tr') || []).length,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const panelText = normalizeTextV136(panel?.text || "");
const missingCopy = REQUIRED_PANEL_COPY_V136.filter((token) => !panelText.includes(token));
const retiredCopy = RETIRED_PANEL_COPY_V136.filter((token) => panelText.includes(token));
const retiredInSource = ["주 분석 데이터", "분석 프리셋", "전체 지도 데이터"].filter((token) =>
  mapSource.includes(token)
);
// 국가 -> 추천 분석 -> 지도 데이터 -> 지도 데이터 안내
const order = panel?.headingOrder || [];
const presetIndex = order.findIndex((text) => text === "추천 분석");
const dataIndex = order.findIndex((text) => text === "지도 데이터");
const orderCorrect = presetIndex >= 0 && dataIndex > presetIndex;

audit.check("MAP_COPY_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("MAP_PANEL_REQUIRED_COPY", missingCopy.length === 0, missingCopy, []);
audit.check("MAP_PANEL_RETIRED_COPY", retiredCopy.length === 0, retiredCopy, []);
audit.check("MAP_SOURCE_RETIRED_COPY", retiredInSource.length === 0, retiredInSource, []);
audit.check("MAP_PANEL_SECTION_ORDER", orderCorrect, order, "추천 분석 before 지도 데이터");
audit.check("MAP_PRESET_COUNT", panel?.presetCount === 5, panel?.presetCount ?? null, 5);
audit.check("MAP_DATA_ITEM_COUNT", panel?.itemCount === 12, panel?.itemCount ?? null, 12);
audit.check("MAP_GUIDE_DEFAULT_OPEN", guide?.defaultOpen === false, guide?.defaultOpen ?? null, false);
audit.check("MAP_GUIDE_ROW_COUNT", guide?.rowCount === 12, guide?.rowCount ?? null, 12);
audit.check("MAP_GUIDE_READER_COLUMNS", (guide?.headings || []).includes("지도 표시") && !(guide?.headings || []).includes("공간 표현"), guide?.headings || [], "지도 표시 replaces 공간 표현");
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV136(audit, "map-copy-audit-v136.json", {
  panelHeadingOrder: order,
  guideHeadings: guide?.headings || [],
  missingCopy,
  retiredCopy,
  runtimeFailure,
});
