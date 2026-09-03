#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV135, finderUrlV135, finishAuditV135, mapUrlV135, normalizeTextV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("public-screen:v135");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

// S. The public information architecture is fixed. Each route owns one job and
// V135 introduces no additional public page.
const ROUTE_CONTRACT_V135 = [
  { key: "home", hash: "home", job: "발견" },
  { key: "finder", hash: "explorer", job: "검색·선택" },
  { key: "map", hash: "map", job: "공간 비교" },
  { key: "download", hash: "download", job: "데이터 획득" },
  { key: "guide", hash: "guide", job: "용어·이용방법" },
];

// T. Generic system copy that describes the internal store rather than the data.
const BANNED_PUBLIC_COPY_V135 = [
  "주요 분류 차원",
  "분류 레코드",
  "범주 비교",
  "측정항목 1종",
  "실제 레코드",
  "공간표현 미확보",
  "화면에서만 제공",
  "분류별 근거 매트릭스",
];

const appSource = readFileSync(resolve(PROJECT_ROOT, "src/App.tsx"), "utf8");
const declaredViews = Array.from(
  appSource.matchAll(/type\s+PublicViewV\d+\s*=\s*([^;]+);/gu)
).map((match) => match[1]);

let server = null;
let browser = null;
let runtimeFailure = null;
const routeSnapshots = [];
const copyViolations = [];
const brokenAssets = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before public screen audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });

  for (const route of ROUTE_CONTRACT_V135) {
    const url = new URL(server.url);
    url.searchParams.set("country", "VNM");
    url.hash = route.hash;
    await navigate(browser.cdp, url.toString());
    await waitForValue(browser.cdp, `Boolean(document.querySelector('main, [data-testid$="-content"], .cdp-page-shell'))`, { timeoutMs: 35_000 });
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    const snapshot = await evaluateValue(
      browser.cdp,
      `(() => {
        const cards = [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')];
        return {
          h1: [...document.querySelectorAll('h1')].map((node) => String(node.textContent || '').trim()),
          cardText: cards
            .map((node) => String(node.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())
            .join(' | '),
          horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        };
      })()`
    );
    routeSnapshots.push({ ...route, ...snapshot });
    for (const phrase of BANNED_PUBLIC_COPY_V135) {
      if (normalizeTextV135(snapshot.cardText || "").includes(phrase)) {
        copyViolations.push({ route: route.key, phrase, scope: "finder-card" });
      }
    }
  }

  // Q. Every detail route must lead with an analysis a reader can act on, not
  // with a raw table or a metadata block.
  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    await navigate(browser.cdp, detailUrlV135(server.url, elementId));
    await waitForValue(
      browser.cdp,
      `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
      { timeoutMs: 20_000 }
    );
    const snapshot = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        const text = String(root?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        return {
          text,
          depth: root?.getAttribute('data-temporal-depth-v135') || '',
        };
      })()`
    );
    for (const phrase of BANNED_PUBLIC_COPY_V135) {
      if (normalizeTextV135(snapshot.text).includes(phrase)) {
        copyViolations.push({ route: elementId, phrase, scope: "detail-analysis" });
      }
    }
  }

  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(browser.cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`, { timeoutMs: 35_000 });
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-public-content"]'))`, { timeoutMs: 35_000 });
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const missingRoutes = ROUTE_CONTRACT_V135.filter(
  (route) => !routeSnapshots.some((row) => row.key === route.key && row.h1.length > 0)
);
const overflowingRoutes = routeSnapshots.filter((row) => Number(row.horizontalOverflow || 0) > 1);
const newPublicPages = declaredViews.filter((declaration) => /v135|comparisonPage|compare-page/iu.test(declaration));

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("PUBLIC_SCREEN_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("PUBLIC_ROUTE_CONTRACT", missingRoutes.length === 0, missingRoutes.map((row) => row.key), []);
audit.check("NO_NEW_PUBLIC_PAGE", newPublicPages.length === 0, newPublicPages, []);
audit.check("PUBLIC_GENERIC_COPY_COUNT", copyViolations.length === 0, copyViolations.slice(0, 40), []);
audit.check("PUBLIC_HORIZONTAL_OVERFLOW", overflowingRoutes.length === 0, overflowingRoutes.map((row) => ({ route: row.key, overflow: row.horizontalOverflow })), []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "public-screen-audit-v135.json", {
  inspectedRoutes: routeSnapshots.length,
  inspectedDetailRoutes: catalog.length,
  publicGenericCopyCount: copyViolations.length,
  runtimeFailure,
});
