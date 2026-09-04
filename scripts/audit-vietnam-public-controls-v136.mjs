#!/usr/bin/env node

import { existsSync } from "node:fs";
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
import { finderUrlV135, mapUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("public-controls:v136");

/**
 * A browser default control on a public screen reads as an unfinished page:
 * a grey push button, an outset border, or a bulleted list where the design
 * expects cards. This inspects computed style rather than class names.
 */
function controlsExpression(scopeSelector) {
  return `(() => {
    const scope = document.querySelector(${JSON.stringify(scopeSelector)});
    if (!scope) return null;
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
    };
    const nativeButtons = [];
    scope.querySelectorAll('button').forEach((node) => {
      if (!visible(node)) return;
      const style = getComputedStyle(node);
      // A styled button still computes appearance:auto, so that alone proves
      // nothing. The genuine tells are the user-agent border and the default
      // button face colour, neither of which any styled control keeps.
      const nativeBorder = ['outset', 'inset'].includes(style.borderTopStyle);
      const untouchedBackground = style.backgroundColor === 'rgb(240, 240, 240)';
      // A borderless, transparent text action is a deliberate link-style
      // control, so centring alone is not a defect here. Dataset list items are
      // held to the stricter left-aligned card contract in map-list-ui:v136.
      if (nativeBorder || untouchedBackground) {
        nativeButtons.push({
          text: String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim().slice(0, 40),
          appearance: style.appearance,
          borderStyle: style.borderTopStyle,
          background: style.backgroundColor,
        });
      }
    });
    const bulletLists = [];
    scope.querySelectorAll('ul, ol').forEach((node) => {
      if (!visible(node)) return;
      const style = getComputedStyle(node);
      if (style.listStyleType !== 'none' || parseFloat(style.paddingLeft) > 4) {
        bulletLists.push({
          listStyleType: style.listStyleType,
          paddingLeft: style.paddingLeft,
          sample: String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim().slice(0, 40),
        });
      }
    });
    return { nativeButtons, bulletLists };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
let mapPanel = null;
let finder = null;

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
  mapPanel = await evaluateValue(browser.cdp, controlsExpression('[data-testid="map-layer-panel"]'));

  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  finder = await evaluateValue(browser.cdp, controlsExpression("main"));
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const mapNativeButtons = mapPanel?.nativeButtons || [];
const mapBullets = mapPanel?.bulletLists || [];
const finderNativeButtons = finder?.nativeButtons || [];

audit.check("PUBLIC_CONTROLS_RUNTIME", runtimeFailure === null && Boolean(mapPanel), { runtimeFailure, mapPanel: Boolean(mapPanel) }, { runtimeFailure: null, mapPanel: true });
audit.check("MAP_NATIVE_BUTTON_STYLE_COUNT", mapNativeButtons.length === 0, mapNativeButtons.slice(0, 10), []);
audit.check("MAP_NATIVE_BULLET_COUNT", mapBullets.length === 0, mapBullets.slice(0, 10), []);
audit.check("FINDER_NATIVE_BUTTON_STYLE_COUNT", finderNativeButtons.length === 0, finderNativeButtons.slice(0, 10), []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV136(audit, "public-controls-audit-v136.json", {
  mapNativeButtonStyleCount: mapNativeButtons.length,
  mapNativeBulletCount: mapBullets.length,
  finderNativeButtonStyleCount: finderNativeButtons.length,
  runtimeFailure,
});
