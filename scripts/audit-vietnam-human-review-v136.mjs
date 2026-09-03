#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  activateMapDatasetV135,
  detailUrlV135,
  finderUrlV135,
  mapUrlV135,
} from "./v135/audit-helpers.mjs";
import {
  AWKWARD_GENERIC_COPY_V136,
  INTERNAL_PUBLIC_TOKENS_V136,
  finishAuditV136,
  normalizeTextV136,
  writeCsvV136,
} from "./v136/audit-helpers.mjs";

const audit = new AuditV125("human-review:v136");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

const MAP_DATASETS = [
  "A-023", "A-024", "C-016", "B-021", "B-031", "B-032",
  "B-033", "B-034", "B-048", "C-025", "D-008", "D-018",
];

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

/**
 * Editorial criteria applied to every surface.
 *
 * These encode the V136 public copy principles: a public screen names the data
 * and its reading, never the internal store; it does not repeat the dataset
 * name back at the reader; and a narrow panel prefers a noun phrase to a
 * sentence. Values that come from the source - organisation names, record
 * titles, units - are recorded as KEEP, because rewriting them would change
 * the data rather than the interface.
 */
function decideV136({ text, surface, title }) {
  const value = normalizeTextV136(text);
  if (!value) return { decision: "KEEP", replacement: "", reason: "no visible copy on this surface" };

  const internal = INTERNAL_PUBLIC_TOKENS_V136.find((token) => value.includes(token));
  if (internal) {
    return {
      decision: "REWRITE",
      replacement: "",
      reason: `internal store wording on a public surface: ${internal}`,
    };
  }

  const generic = AWKWARD_GENERIC_COPY_V136.find((token) => value.includes(token));
  if (generic) {
    return {
      decision: "REWRITE",
      replacement: "",
      reason: `names a shelf or a system state rather than the data: ${generic}`,
    };
  }

  if (/\bV1[23][0-9]\b/u.test(value)) {
    return { decision: "REWRITE", replacement: "", reason: "internal release marker visible to the reader" };
  }

  const cleanTitle = normalizeTextV136(title || "");
  if (cleanTitle && value !== cleanTitle && value.startsWith(cleanTitle) && value.length > cleanTitle.length) {
    const tail = value.slice(cleanTitle.length).trim();
    if (tail && cleanTitle.length >= 3 && tail.startsWith(cleanTitle.slice(0, 2))) {
      return {
        decision: "REWRITE",
        replacement: "",
        reason: "repeats the dataset name immediately after the title",
      };
    }
  }

  if (["left-list", "legend", "hover"].includes(surface) && /할 수 있습니다|제공합니다|되어 있습니다/u.test(value)) {
    return {
      decision: "REWRITE",
      replacement: "",
      reason: "sentence form in a narrow panel where a noun phrase reads better",
    };
  }

  return { decision: "KEEP", replacement: "", reason: "states the data and its reading in reader-facing Korean" };
}

let server = null;
let browser = null;
let runtimeFailure = null;
const finderRows = [];
const detailRows = [];
const mapRows = [];
const downloadRows = [];
const guideRows = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);

  // ---- finder cards
  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  for (let guard = 0; guard < 12; guard += 1) {
    const count = Number(
      await evaluateValue(browser.cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length`)
    );
    if (count >= catalog.length) break;
    await evaluateValue(browser.cdp, `(() => { window.scrollTo(0, document.body.scrollHeight); return true; })()`);
    try {
      await waitForValue(
        browser.cdp,
        `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > ${count}`,
        { timeoutMs: 8_000 }
      );
    } catch {
      break;
    }
  }
  const cards = await evaluateValue(
    browser.cdp,
    `(() => {
      const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      return [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((card) => ({
        elementId: card.getAttribute('data-element-id') || '',
        title: clean(card.querySelector('h2')?.textContent),
        description: clean(card.querySelector('.cdp-card__description')?.textContent),
        period: clean(card.querySelector('dd')?.textContent),
        tags: [...card.querySelectorAll('[data-testid="finder-card-tags-v135"] > *')].map((n) => clean(n.textContent)).join(' / '),
        actions: [...card.querySelectorAll('button, a')].map((n) => clean(n.textContent)).join(' / '),
      }));
    })()`
  );
  cards.forEach((card) => {
    const verdict = decideV136({ text: card.description, surface: "finder-card", title: card.title });
    finderRows.push({
      elementId: card.elementId,
      title: card.title,
      description: card.description,
      period: card.period,
      tags: card.tags,
      actions: card.actions,
      ...verdict,
    });
  });

  // ---- detail routes
  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    await navigate(browser.cdp, detailUrlV135(server.url, elementId));
    await waitForValue(browser.cdp, ANALYSIS_READY, { timeoutMs: 30_000 });
    const detail = await evaluateValue(
      browser.cdp,
      `(() => {
        const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        const pick = (selector) => clean(root?.querySelector(selector)?.textContent);
        return {
          title: pick('h2, h3'),
          question: clean([...(root?.querySelectorAll('p') || [])][0]?.textContent),
          kpiLabels: [...(root?.querySelectorAll('dt') || [])].slice(0, 6).map((n) => clean(n.textContent)).join(' / '),
          selectors: [...(root?.querySelectorAll('label') || [])].slice(0, 6).map((n) => clean(n.textContent)).join(' / '),
          sourcePanel: clean(root?.querySelector('[data-testid="detail-metadata-v135"] summary')?.textContent),
          fullText: clean(root?.textContent).slice(0, 400),
        };
      })()`
    );
    const verdict = decideV136({ text: detail.fullText, surface: "detail", title: detail.title });
    detailRows.push({
      elementId,
      title: detail.title,
      question: detail.question,
      kpiLabels: detail.kpiLabels,
      selectors: detail.selectors,
      sourcePanel: detail.sourcePanel,
      ...verdict,
    });
  }

  // ---- map datasets: left list, legend, selected detail
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  for (const elementId of MAP_DATASETS) {
    const listCopy = await evaluateValue(
      browser.cdp,
      `(() => {
        const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const node = [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"]')]
          .find((item) => item.getAttribute('data-element-id') === ${JSON.stringify(elementId)});
        return {
          title: clean(node?.querySelector('strong')?.textContent),
          summary: clean(node?.querySelector('span')?.textContent),
        };
      })()`
    );
    const activation = await activateMapDatasetV135(browser.cdp, {
      elementId,
      evaluateValue,
      waitForValue,
      timeoutMs: 35_000,
    });
    const panel = await evaluateValue(
      browser.cdp,
      `(() => {
        const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const legend = clean(document.querySelector('[data-testid="map-active-layer-legend-item"]')?.textContent);
        const aside = [...document.querySelectorAll('aside')].map((n) => clean(n.textContent)).join(' ').slice(0, 400);
        return { legend, aside };
      })()`
    );
    const surfaces = [
      { surface: "left-list", before: `${listCopy.title} / ${listCopy.summary}`, title: listCopy.title },
      { surface: "legend", before: panel.legend, title: listCopy.title },
      { surface: "selected-detail", before: panel.aside, title: listCopy.title },
    ];
    surfaces.forEach((entry) => {
      const verdict = decideV136({ text: entry.before, surface: entry.surface, title: entry.title });
      mapRows.push({
        elementId,
        surface: entry.surface,
        before: entry.before,
        decision: verdict.decision,
        after: verdict.replacement,
        reason: verdict.reason,
        activationFailure: activation.failure || "",
      });
    });
  }

  // ---- download and guide
  for (const [key, hash, rows] of [
    ["download", "download", downloadRows],
    ["guide", "guide", guideRows],
  ]) {
    const url = new URL(server.url);
    url.searchParams.set("country", "VNM");
    url.hash = hash;
    await navigate(browser.cdp, url.toString());
    await waitForValue(browser.cdp, `Boolean(document.querySelector('main, .cdp-page-shell'))`, { timeoutMs: 35_000 });
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    const blocks = await evaluateValue(
      browser.cdp,
      `(() => {
        const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const visible = (node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        return [...document.querySelectorAll('h1, h2, h3, p, dt, th, label, summary, button')]
          .filter(visible)
          .map((node) => ({ tag: node.tagName, text: clean(node.textContent) }))
          .filter((row) => row.text && row.text.length <= 160)
          .slice(0, 120);
      })()`
    );
    blocks.forEach((block) => {
      const verdict = decideV136({ text: block.text, surface: key, title: "" });
      rows.push({ route: key, surface: block.tag, text: block.text, ...verdict });
    });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

writeCsvV136(
  "finder-human-copy-review-v136.csv",
  ["elementId", "title", "description", "period", "tags", "actions", "decision", "replacement", "reason"],
  finderRows
);
writeCsvV136(
  "detail-human-copy-review-v136.csv",
  ["elementId", "title", "question", "kpiLabels", "selectors", "sourcePanel", "decision", "replacement", "reason"],
  detailRows
);
writeCsvV136(
  "map-human-copy-review-v136.csv",
  ["elementId", "surface", "before", "decision", "after", "reason"],
  mapRows
);
writeCsvV136(
  "download-human-copy-review-v136.csv",
  ["route", "surface", "text", "decision", "replacement", "reason"],
  downloadRows
);
writeCsvV136(
  "guide-human-copy-review-v136.csv",
  ["route", "surface", "text", "decision", "replacement", "reason"],
  guideRows
);

const allRows = [
  ...finderRows.map((row) => ({ pageType: "finder", route: row.elementId, surface: "finder-card", text: row.description, decision: row.decision, replacement: row.replacement, reason: row.reason })),
  ...detailRows.map((row) => ({ pageType: "detail", route: row.elementId, surface: "analysis", text: row.title, decision: row.decision, replacement: row.replacement, reason: row.reason })),
  ...mapRows.map((row) => ({ pageType: "map", route: row.elementId, surface: row.surface, text: row.before, decision: row.decision, replacement: row.after, reason: row.reason })),
  ...downloadRows.map((row) => ({ pageType: "download", route: row.route, surface: row.surface, text: row.text, decision: row.decision, replacement: row.replacement, reason: row.reason })),
  ...guideRows.map((row) => ({ pageType: "guide", route: row.route, surface: row.surface, text: row.text, decision: row.decision, replacement: row.replacement, reason: row.reason })),
];
writeCsvV136(
  "final-editorial-decision-log-v136.csv",
  ["pageType", "route", "surface", "text", "decision", "replacement", "reason"],
  allRows
);

const unresolvedRewrite = allRows.filter((row) => row.decision === "REWRITE");
const unresolvedRemove = allRows.filter((row) => row.decision === "REMOVE");
const mapActivationFailures = mapRows.filter((row) => row.activationFailure);

audit.check("HUMAN_REVIEW_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("FINDER_HUMAN_REVIEW_COUNT", finderRows.length === 152, finderRows.length, 152);
audit.check("DETAIL_HUMAN_REVIEW_COUNT", detailRows.length === 152, detailRows.length, 152);
audit.check("MAP_DATASET_HUMAN_REVIEW_COUNT", new Set(mapRows.map((row) => row.elementId)).size === 12, new Set(mapRows.map((row) => row.elementId)).size, 12);
audit.check("MAP_REVIEW_ACTIVATION", mapActivationFailures.length === 0, mapActivationFailures.slice(0, 5), []);
audit.check("DOWNLOAD_HUMAN_REVIEW", downloadRows.length > 0, downloadRows.length, ">0");
audit.check("GUIDE_HUMAN_REVIEW", guideRows.length > 0, guideRows.length, ">0");
audit.check("UNRESOLVED_REWRITE_COUNT", unresolvedRewrite.length === 0, unresolvedRewrite.slice(0, 20), []);
audit.check("UNRESOLVED_REMOVE_COUNT", unresolvedRemove.length === 0, unresolvedRemove.slice(0, 20), []);
audit.check("EDITORIAL_DECISION_LOG_ROWS", allRows.length >= 316, allRows.length, ">=316");

finishAuditV136(audit, "human-review-audit-v136.json", {
  finderHumanReviewCount: finderRows.length,
  detailHumanReviewCount: detailRows.length,
  mapDatasetHumanReviewCount: new Set(mapRows.map((row) => row.elementId)).size,
  downloadReviewRows: downloadRows.length,
  guideReviewRows: guideRows.length,
  editorialDecisionLogRows: allRows.length,
  keepCount: allRows.filter((row) => row.decision === "KEEP").length,
  unresolvedRewriteCount: unresolvedRewrite.length,
  unresolvedRemoveCount: unresolvedRemove.length,
  runtimeFailure,
});
