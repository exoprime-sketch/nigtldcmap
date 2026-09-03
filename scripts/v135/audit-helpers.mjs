import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT, pngDimensions } from "../v125/audit-utils.mjs";

export const V135_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v135");
export const V135_SCREENSHOT_ROOT = resolve(V135_REPORT_ROOT, "screenshots");

export const REQUIRED_SCREENSHOTS_V135 = Object.freeze([
  "finder-energy.png",
  "finder-drought.png",
  "detail-ghg-sector-gas.png",
  "detail-portfolio.png",
  "detail-single-year-kpi.png",
  "map-guide-closed.png",
  "map-guide-open.png",
  "map-left-expanded.png",
  "map-all-data.png",
  "map-mine-hover.png",
  "map-compare-finance.png",
  "map-compare-vulnerability-budget.png",
  "map-compare-mobile.png",
]);

export function normalizeTextV135(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
}

export function writeJsonV135(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function finishAuditV135(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeJsonV135(resolve(V135_REPORT_ROOT, fileName), {
    schemaVersion: "v135-final-public-screen-audit-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
  return summary;
}

export function finderUrlV135(baseUrl, query = "") {
  const url = new URL(baseUrl);
  url.searchParams.set("country", "VNM");
  if (query) url.searchParams.set("q", query);
  url.hash = "explorer";
  return url.toString();
}

export function detailUrlV135(baseUrl, elementId) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  return url.toString();
}

export function mapUrlV135(baseUrl, parameters = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("country", "VNM");
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  }
  url.hash = "map";
  return url.toString();
}

export function reportStatusV135(result) {
  if (!result || result.error) return "missing";
  return result.value?.status || result.value?.summary?.status || "missing";
}

export function screenshotEvidenceV135(name) {
  const path = resolve(V135_SCREENSHOT_ROOT, name);
  const dimensions = pngDimensions(path);
  let sha256 = null;
  if (dimensions.error === null && existsSync(path) && statSync(path).isFile()) {
    sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
  return { name, ...dimensions, sha256 };
}

export function visibleExpressionV135(selector) {
  return `(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
      style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  })()`;
}

/**
 * V135 map feature hover.
 *
 * `[data-element-id="X"][data-layer-role="primary"]` is not a hover target: the
 * active-layer legend item carries the same two attributes, so a first-match
 * query can resolve to the legend, which has no tooltip handler. Hovering it
 * leaves the tooltip empty, which is how MAP_MINE_TOOLTIP failed in CI while
 * passing locally — purely an ordering accident between the legend and the
 * fallback feature layer.
 *
 * Real CDP pointer events are not usable here either: the MapLibre canvas sits
 * above the fallback SVG, so a pointer at the feature's coordinates lands on the
 * canvas. The fallback layer is driven by React mouse handlers, so the hover is
 * dispatched onto the resolved feature node itself.
 */
export const MAP_FEATURE_CONTROL_SELECTOR_V135 =
  '.cdp-map-fallback__feature-control[data-element-id="%ELEMENT_ID%"]';

export function mapFeatureControlSelectorV135(elementId) {
  return MAP_FEATURE_CONTROL_SELECTOR_V135.replace("%ELEMENT_ID%", elementId);
}

export function mapFeatureTooltipTextExpressionV135() {
  return `(() => {
    const node = document.querySelector('[data-testid="map-feature-tooltip"]');
    return String(node?.textContent || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  })()`;
}

/**
 * Hovers one deterministic feature of a map layer and waits until the tooltip
 * actually carries that feature's content. Returns diagnostics either way so a
 * failure reports what was targeted rather than only an empty string.
 */
export async function hoverMapFeatureForTooltipV135(
  cdp,
  { elementId, contentPattern, evaluateValue, waitForValue, timeoutMs = 15_000 }
) {
  const selector = mapFeatureControlSelectorV135(elementId);
  const diagnostics = {
    elementId,
    targetSelector: selector,
    targetFound: false,
    targetLabel: "",
    targetName: "",
    targetRect: null,
    eventDispatched: false,
    tooltipNodeExists: false,
    tooltipText: "",
    primaryElement: "",
    renderedMapSymbols: "",
    failure: null,
  };

  const readContext = async () => {
    const context = await evaluateValue(
      cdp,
      `(() => {
        const root = document.querySelector('[data-testid="map-public-content"]');
        const tooltip = document.querySelector('[data-testid="map-feature-tooltip"]');
        return {
          primaryElement: root?.getAttribute('data-primary-element') || '',
          renderedMapSymbols: root?.getAttribute('data-rendered-map-symbols') || '',
          tooltipNodeExists: Boolean(tooltip),
          tooltipText: String(tooltip?.textContent || '').normalize('NFC').replace(/\s+/gu, ' ').trim(),
        };
      })()`
    );
    Object.assign(diagnostics, context || {});
  };

  try {
    // Wait for interactive features of this layer, never for the legend.
    await waitForValue(
      cdp,
      `document.querySelectorAll(${JSON.stringify(selector)}).length > 0`,
      { timeoutMs }
    );

    // Deterministic pick: order by the feature's own public label, not by DOM
    // position, so the same mine is hovered on every run and environment.
    const target = await evaluateValue(
      cdp,
      `(() => {
        document.querySelectorAll('[data-v135-hover-target]').forEach((node) => {
          node.removeAttribute('data-v135-hover-target');
        });
        const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})].filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (nodes.length === 0) return null;
        nodes.sort((left, right) => String(left.getAttribute('aria-label') || '')
          .localeCompare(String(right.getAttribute('aria-label') || ''), 'en'));
        const chosen = nodes[0];
        chosen.setAttribute('data-v135-hover-target', 'true');
        const rect = chosen.getBoundingClientRect();
        const label = String(chosen.getAttribute('aria-label') || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
        return {
          label,
          name: label.split('·').map((part) => part.trim()).filter(Boolean).pop() || '',
          rect: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          count: nodes.length,
        };
      })()`
    );
    if (!target) throw new Error(`no interactive feature for ${elementId}`);
    diagnostics.targetFound = true;
    diagnostics.targetLabel = target.label;
    diagnostics.targetName = target.name;
    diagnostics.targetRect = target.rect;
    diagnostics.targetCount = target.count;

    diagnostics.eventDispatched = Boolean(
      await evaluateValue(
        cdp,
        `(() => {
          const node = document.querySelector('[data-v135-hover-target="true"]');
          if (!(node instanceof Element)) return false;
          node.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
          node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          return true;
        })()`
      )
    );

    // Wait for tooltip content, not for the tooltip node.
    const namePart = JSON.stringify(target.name || "");
    await waitForValue(
      cdp,
      `(() => {
        const node = document.querySelector('[data-testid="map-feature-tooltip"]');
        const text = String(node?.textContent || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
        if (!node || text.length === 0) return false;
        if (!${contentPattern}.test(text)) return false;
        const name = ${namePart};
        return name.length === 0 || text.includes(name);
      })()`,
      { timeoutMs }
    );
  } catch (error) {
    diagnostics.failure = error instanceof Error ? error.message : String(error);
  }

  await readContext();
  return diagnostics;
}

/**
 * Source form of the mine tooltip content test, shared by the release audit and
 * the screenshot capture so both wait on the same semantics. Kept as a source
 * string because it is injected into a page-side expression.
 */
export const MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135 =
  "/광산|광종|석탄|금|구리|보크사이트|철/u";

/**
 * V135 map dataset activation.
 *
 * The all-map-data card is itself the product's activation control: a real
 * <button> carrying data-element-id, so it is keyboard reachable and needs no
 * test-only affordance. Selecting it by matching UI wording ("분석", "지도",
 * "보기") coupled the release gate to public copy, and the audit's readiness
 * signal after a re-navigation was the panel separator, which mounts before the
 * dataset list. On a slow runner the card is therefore absent at click time and
 * the activation silently does nothing, which surfaces much later as an
 * unrelated timeout. This helper waits for the control, clicks it, and confirms
 * the effect the product is supposed to produce.
 */
export function mapDatasetControlSelectorV135(elementId) {
  return `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`;
}

export async function activateMapDatasetV135(
  cdp,
  {
    elementId,
    evaluateValue,
    waitForValue,
    timeoutMs = 35_000,
    requireFeatureControls = false,
  }
) {
  const selector = mapDatasetControlSelectorV135(elementId);
  const diagnostics = {
    elementId,
    controlSelector: selector,
    controlFound: false,
    controlTag: "",
    controlRole: "",
    controlText: "",
    controlDisabled: null,
    clickDispatched: false,
    clickAttempts: 0,
    primaryBefore: "",
    primaryAfter: "",
    renderedMapSymbols: "",
    featureControlCount: 0,
    url: "",
    failure: null,
  };

  const readContext = async () => {
    const context = await evaluateValue(
      cdp,
      `(() => {
        const root = document.querySelector('[data-testid="map-public-content"]');
        return {
          primaryAfter: root?.getAttribute('data-primary-element') || '',
          renderedMapSymbols: root?.getAttribute('data-rendered-map-symbols') || '',
          featureControlCount: document.querySelectorAll(${JSON.stringify(
            `.cdp-map-fallback__feature-control[data-element-id="${elementId}"]`
          )}).length,
          url: location.href,
        };
      })()`
    );
    Object.assign(diagnostics, context || {});
  };

  try {
    // The dataset list, not the panel shell, is what makes activation possible.
    await waitForValue(
      cdp,
      `(() => {
        const node = document.querySelector(${JSON.stringify(selector)});
        if (!node) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && node.disabled !== true;
      })()`,
      { timeoutMs }
    );

    const before = await evaluateValue(
      cdp,
      `(() => {
        const node = document.querySelector(${JSON.stringify(selector)});
        const root = document.querySelector('[data-testid="map-public-content"]');
        return {
          controlFound: Boolean(node),
          controlTag: node?.tagName || '',
          controlRole: node?.getAttribute('role') || node?.tagName?.toLowerCase() || '',
          controlText: String(node?.textContent || '').normalize('NFC').replace(/\s+/gu, ' ').trim().slice(0, 120),
          controlDisabled: node?.disabled === true,
          primaryBefore: root?.getAttribute('data-primary-element') || '',
        };
      })()`
    );
    Object.assign(diagnostics, before || {});

    // Click, then confirm the product actually made this the primary analysis.
    // A single retry covers a click landing on the frame the list re-rendered.
    let activated = false;
    for (let attempt = 1; attempt <= 2 && !activated; attempt += 1) {
      diagnostics.clickAttempts = attempt;
      diagnostics.clickDispatched = Boolean(
        await evaluateValue(
          cdp,
          `(() => {
            const node = document.querySelector(${JSON.stringify(selector)});
            if (!(node instanceof HTMLElement) || node.disabled === true) return false;
            node.click();
            return true;
          })()`
        )
      );
      try {
        await waitForValue(
          cdp,
          `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(
            elementId
          )}`,
          { timeoutMs: attempt === 1 ? Math.min(timeoutMs, 15_000) : timeoutMs }
        );
        activated = true;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }

    // The layer's renderer has to be on the map, not merely selected.
    await waitForValue(
      cdp,
      `(document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-rendered-map-symbols') || '')
        .split(',').some((entry) => entry.startsWith(${JSON.stringify(`${elementId}|primary|`)}))`,
      { timeoutMs }
    );

    if (requireFeatureControls) {
      await waitForValue(
        cdp,
        `document.querySelectorAll(${JSON.stringify(
          `.cdp-map-fallback__feature-control[data-element-id="${elementId}"]`
        )}).length > 0`,
        { timeoutMs }
      );
    }
  } catch (error) {
    diagnostics.failure = error instanceof Error ? error.message : String(error);
  }

  await readContext();
  return diagnostics;
}
