#!/usr/bin/env node

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";

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
  V134_REPORT_ROOT,
  detailUrlV134,
  finishAuditV134,
  mapUrlV134,
  normalizeTextV134,
  writeCsvV134,
} from "./v134/audit-helpers.mjs";
import { getPublicNonGlossaryAllowanceV134 } from "./v134/public-non-glossary-allowlist-v134.mjs";

const audit = new AuditV125("glossary:v134");
const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, fileName) => {
  const output = ts.transpileModule(readFileSync(fileName, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName,
  }).outputText;
  module._compile(output, fileName);
};

const glossaryModule = require(resolve(PROJECT_ROOT, "src/data/glossary/publicGlossaryV134.ts"));
const tokenizerModule = require(resolve(PROJECT_ROOT, "src/utils/publicTermTokenizerV134.ts"));
const glossary = glossaryModule.PUBLIC_GLOSSARY_V134;
const requiredTerms = [
  "ODA", "OECD", "DAC", "CRS", "OOF", "CPI", "CPIA", "GDP", "GNI",
  "GHG", "NDC", "SDG", "BTR", "NAP", "MRV", "CBAM", "LULUCF", "REDD+",
  "GVI", "SPEI", "SPI", "CMIP6", "SSP", "LCOE", "CCS", "CCUS", "TRL",
  "GCF", "CTCN", "ADB", "EDCF", "KOICA", "IATI", "PPP", "FTA", "VCM",
  "MAC", "RE", "FIT", "R&D", "O&M", "USD", "VND", "MW", "GW", "kV",
  "GWh", "TWh", "ha", "ha/yr", "tCO₂e", "MtCO₂e", "°C",
];
const glossaryTerms = new Set(glossary.map((entry) => entry.term));
const missingSeed = requiredTerms.filter((term) => !glossaryTerms.has(term));
const invalidEntries = glossary.filter(
  (entry) =>
    !normalizeTextV134(entry.term) ||
    !normalizeTextV134(entry.englishName) ||
    !normalizeTextV134(entry.koreanName) ||
    !normalizeTextV134(entry.definition)
);
const duplicateIds = glossary
  .map((entry) => entry.id)
  .filter((id, index, values) => values.indexOf(id) !== index);

audit.check("GLOSSARY_REQUIRED_SEED", missingSeed.length === 0, missingSeed, []);
audit.check("GLOSSARY_ENTRY_COMPLETENESS", invalidEntries.length === 0, invalidEntries, []);
audit.check("GLOSSARY_UNIQUE_ID", duplicateIds.length === 0, duplicateIds, []);
audit.check("SPEI12_PATTERN", tokenizerModule.resolvePublicTermV134("SPEI12")?.derivedFrom === "SPEI", tokenizerModule.resolvePublicTermV134("SPEI12"), "SPEI-derived");
audit.check("SSP245_PATTERN", /4\.5 W\/m²/u.test(tokenizerModule.resolvePublicTermV134("SSP2-4.5")?.definition || ""), tokenizerModule.resolvePublicTermV134("SSP2-4.5")?.definition, "scenario forcing explanation");

const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);

// Visible public tokens that are formats, route/UI vocabulary or ISO country codes
// rather than domain terms. Every exception is recorded in the inventory.
const allowlist = new Map([
  ["CSV", "public download format"],
  ["JSON", "public download format"],
  ["GEOJSON", "public spatial download format"],
  ["VNM", "ISO 3166-1 country code"],
  ["KHM", "ISO 3166-1 country code"],
  ["LAO", "ISO 3166-1 country code"],
  ["THA", "ISO 3166-1 country code"],
  ["URL", "web address vocabulary"],
  ["PDF", "public document format"],
  ["HTML", "web format vocabulary"],
  ["SVG", "web chart format vocabulary"],
  ["ISO", "standards identifier"],
  ["KPI", "common interface label"],
  ["ID", "public identifier label where explicitly shown"],
  ["RCP", "legacy climate scenario code shown only with source context"],
]);

function classifyNonGlossaryToken(token) {
  const explicitAllowance = getPublicNonGlossaryAllowanceV134(token);
  if (explicitAllowance) {
    return { ...explicitAllowance, approved: true };
  }
  return { category: "unclassified", reason: "not registered or explicitly allowlisted", approved: false };
}

const aliases = glossary.flatMap((entry) => [entry.term, ...(entry.aliases || [])]);
const aliasByNormalized = new Map(
  aliases.map((alias) => [glossaryModule.normalizePublicTermAliasV134(alias).toLocaleUpperCase("en-US"), alias])
);
const aliasIdsByNormalized = {};
for (const entry of glossary) {
  for (const alias of [entry.term, ...(entry.aliases || [])]) {
    const normalized = glossaryModule
      .normalizePublicTermAliasV134(alias)
      .toLocaleUpperCase("en-US");
    aliasIdsByNormalized[normalized] ||= [];
    if (!aliasIdsByNormalized[normalized].includes(entry.id)) {
      aliasIdsByNormalized[normalized].push(entry.id);
    }
  }
}
const inventory = new Map();
const selectedOptionFailures = [];
const registeredVisiblePatternSource = [...new Set(aliases)]
  .sort((left, right) => right.length - left.length)
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
  .join("|");
function recordCandidates(location, snapshot) {
  for (const occurrence of snapshot.occurrences || []) {
    const token = occurrence.token;
    const normalized = glossaryModule.normalizePublicTermAliasV134(token).toLocaleUpperCase("en-US");
    // A rendered glossary carrier is authoritative for ambiguous aliases such
    // as IP, MPI and PMC. Re-inferring those entries from a long parent node can
    // make a correctly rendered term appear unresolved in the audit report.
    const carrierEntry = occurrence.entryId
      ? glossary.find((entry) => entry.id === occurrence.entryId) || null
      : null;
    const resolved = carrierEntry || tokenizerModule.resolvePublicTermV134(token, occurrence.context || token) ||
      (aliasByNormalized.has(normalized) ? tokenizerModule.resolvePublicTermV134(aliasByNormalized.get(normalized)) : null);
    const allowReason = allowlist.get(normalized) || null;
    const nonGlossary = resolved ? null : classifyNonGlossaryToken(token);
    const wrappedHere = Boolean(occurrence.wrapped);
    // Keep one inventory row per resolved meaning. Ambiguous public acronyms
    // (PPP, MPI, PMC and IP) must not overwrite one another merely because
    // their visible token is identical.
    const key = resolved ? `${normalized}::${resolved.id}` : normalized;
    const existing = inventory.get(key) || {
      token,
      locations: new Set(),
      wrappedLocations: new Set(),
      unwrappedLocations: new Set(),
      unwrappedExamples: new Set(),
      glossaryMatched: false,
      category: allowReason ? "allowlist" : resolved?.category || nonGlossary?.category || "unclassified",
      englishName: resolved?.englishName || "",
      koreanName: resolved?.koreanName || "",
      tooltipRendered: false,
      approved: Boolean(resolved || allowReason || nonGlossary?.approved),
      approvalReason: allowReason || nonGlossary?.reason || "",
    };
    existing.locations.add(location);
    if (!resolved && !existing.approved && existing.unwrappedExamples.size < 12) {
      existing.unwrappedExamples.add(
        `${location}: ${String(occurrence.context || token).replace(/\s+/gu, " ").slice(0, 180)}`
      );
    }
    if (resolved && location !== "guide") {
      if (wrappedHere) {
        existing.wrappedLocations.add(location);
      } else {
        existing.unwrappedLocations.add(location);
        if (existing.unwrappedExamples.size < 12) {
          existing.unwrappedExamples.add(
            `${location}: ${String(occurrence.context || token).replace(/\s+/gu, " ").slice(0, 180)}`
          );
        }
      }
    }
    existing.glossaryMatched ||= Boolean(resolved);
    existing.tooltipRendered ||= wrappedHere;
    existing.approved ||= Boolean(resolved || allowReason || nonGlossary?.approved);
    if (resolved) {
      existing.category = resolved.category;
      existing.englishName = resolved.englishName;
      existing.koreanName = resolved.koreanName;
      existing.approvalReason = "registered public glossary term";
    }
    inventory.set(key, existing);
  }
  for (const issue of snapshot.selectedOptionFailures || []) {
    selectedOptionFailures.push({ location, ...issue });
  }
}

const snapshotExpression = `(() => {
  const root = document.querySelector('main') || document.body;
  const visibleText = [];
  const occurrences = [];
  const candidatePattern = new RegExp(
    '(?<![\\\\p{Script=Latin}\\\\p{N}_])(?:SPEI(?:-?(?:3|6|12))|SSP[1-5](?:[-‐-―−][0-9](?:\\\\.[0-9])?)?|SDG(?:1[0-7]|[1-9])|' + ${JSON.stringify(registeredVisiblePatternSource)} + '|[A-Z]{2,}[A-Z0-9_+.&/-]*|[A-Z][A-Z0-9]*\\\\d[A-Za-z0-9_+./-]*)(?![\\\\p{Script=Latin}\\\\p{N}_])',
    'gu'
  );
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const parent = current.parentElement;
    if (parent) {
      const excluded = parent.closest('script, style, noscript, option, svg title, .sr-only, .cdp-sr-only, [hidden], [aria-hidden="true"]');
      const closedDetails = parent.closest('details:not([open])');
      const insideVisibleSummary = Boolean(parent.closest('summary'));
      const style = window.getComputedStyle(parent);
      if (
        !excluded &&
        (!closedDetails || insideVisibleSummary) &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      ) {
        const value = String(current.nodeValue || '').normalize('NFC').trim();
        if (value) {
          visibleText.push(value);
          const context = String(parent.textContent || value).normalize('NFC').trim().slice(0, 500);
          const carrier = parent.closest('[data-public-term-v134]');
          const glossaryCarrier = parent.closest('[data-glossary-id]');
          const mode = carrier?.getAttribute('data-public-term-mode') || '';
          const visibleExpansion = carrier?.querySelector(
            '[data-public-term-expansion-v134="true"]'
          );
          const wrapped = Boolean(
            carrier &&
            ((mode === 'tooltip' && carrier.tagName === 'BUTTON' && carrier.getAttribute('aria-label')) ||
              (mode === 'visible-expansion' &&
                visibleExpansion &&
                (visibleExpansion.textContent || '').trim().length > 2))
          );
          const matches = value.match(candidatePattern) || [];
          matches.forEach((token) => {
            const canonicalToken = token.replace(/[.-]+$/u, '');
            if (canonicalToken && !/^\\d+$/u.test(canonicalToken)) {
              occurrences.push({
                token: canonicalToken,
                context,
                wrapped,
                entryId:
                  carrier?.getAttribute('data-public-term-v134') ||
                  glossaryCarrier?.getAttribute('data-glossary-id') || '',
              });
            }
          });
        }
      }
    }
    current = walker.nextNode();
  }
  const text = visibleText.join(' ');
  const selectedOptionFailures = [];
  const selectedPattern = new RegExp('(?<![\\\\p{Script=Latin}\\\\p{N}_])(?:SPEI(?:-?(?:3|6|12))|SSP[1-5](?:[-‐-―−][0-9](?:\\\\.[0-9])?)?|SDG(?:1[0-7]|[1-9])|' + ${JSON.stringify(registeredVisiblePatternSource)} + ')(?![\\\\p{Script=Latin}\\\\p{N}_])', 'gu');
  const aliasIds = ${JSON.stringify(aliasIdsByNormalized)};
  [...root.querySelectorAll('select')].forEach((select) => {
    const optionText = String(select.selectedOptions?.[0]?.textContent || '').normalize('NFC').trim();
    if (!optionText) return;
    const matches = optionText.match(selectedPattern) || [];
    matches.forEach((token) => {
      const normalized = token.normalize('NFKC').toLocaleUpperCase('en-US').replace(/\s+/gu, ' ').trim();
      // Native <option> cannot contain an interactive help button. Require an
      // exact-term carrier inside the control group, never merely elsewhere
      // on the route where an unrelated chart/table could mask the omission.
      const scope =
        select.closest('.sv125-controls, .cdp-map-selector-panel, .osa134__heading, .cdp-advanced-filters, [data-public-selector-scope-v134]') ||
        select.closest('section, header, details, form') ||
        select.parentElement;
      const labelClone = select.labels?.[0]?.cloneNode(true);
      labelClone?.querySelectorAll?.('select, option').forEach((node) => node.remove());
      const labelText = String(labelClone?.textContent || select.getAttribute('aria-label') || '').trim();
      const context = String(optionText + ' ' + labelText).normalize('NFC');
      let resolvedIds = aliasIds[normalized] || [];
      const sspMatch = normalized.match(/^SSP([1-5])(?:-([0-9](?:\.[0-9])?))?$/u);
      const speiMatch = normalized.match(/^SPEI-?(3|6|12)$/u);
      const sdgMatch = normalized.match(/^SDG(1[0-7]|[1-9])$/u);
      if (sspMatch) {
        resolvedIds = [sspMatch[2]
          ? 'ssp' + sspMatch[1] + '-' + sspMatch[2].replace('.', '-')
          : 'ssp' + sspMatch[1]];
      } else if (speiMatch) {
        resolvedIds = ['spei-' + speiMatch[1]];
      } else if (sdgMatch) {
        resolvedIds = ['sdg-' + sdgMatch[1]];
      } else if (normalized === 'PPP') {
        resolvedIds = [/(?:GDP|GNI|소득|빈곤|물가|구매력|per\\s*cap|USD_2017|PPP\\s*기준)/iu.test(context)
          ? 'ppp-economy'
          : 'ppp-project'];
      } else if (normalized === 'MPI') {
        const ministry = /(?:기획투자부|Ministry\\s+of\\s+Planning(?:\\s+and|\\s*&)?\\s+Investment|CPEIR|공공조달청|재무부로\\s*통합|정부부처)/iu.test(context);
        const index = /(?:다차원\\s*빈곤|Multidimensional\\s+Poverty|poverty\\s+index|빈곤\\s*지수|INFORM)/iu.test(context);
        resolvedIds = ministry === index ? [] : [ministry ? 'mpi-ministry' : 'mpi-index'];
      }
      if (resolvedIds.length === 0) return;
      const carrier = resolvedIds.some((expectedId) =>
        Boolean(scope?.querySelector('[data-public-term-v134="' + CSS.escape(expectedId) + '"]'))
      );
      if (!carrier) {
        selectedOptionFailures.push({
          token,
          value: optionText,
          label: labelText || select.getAttribute('aria-label') || 'select',
        });
      }
    });
  });
  return { text, occurrences, selectedOptionFailures };
})()`;

let server = null;
let browser = null;
let runtimeFailure = null;
const routeFailures = [];
let inspectedRoutes = 0;
let hoverPass = false;
let keyboardPass = false;
let mobilePass = false;
let mapInteractionPass = false;
const brokenAssets = [];

async function exerciseActiveGviMapV134(cdp) {
  const target = await evaluateValue(cdp, `(() => {
    const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
    const node = features.find((item) => /Quảng Bình/u.test(item.getAttribute('aria-label') || '')) || features[0];
    const canvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
    if (!(node instanceof SVGElement) || !(canvas instanceof HTMLCanvasElement)) return null;
    const rect = node.getBoundingClientRect();
    const surface = canvas.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      x, y,
      fallbackTopmost: node.contains(document.elementFromPoint(x, y)),
      surface: { left: surface.left, right: surface.right, top: surface.top, bottom: surface.bottom },
    };
  })()`);
  if (!target) throw new Error("active GVI map target unavailable");

  const popupVisibleExpression = `(() => [...document.querySelectorAll('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"], .maplibregl-popup')].some((node) => {
    const text = String(node.textContent || '').normalize('NFC');
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return /GVI|지역 취약성/u.test(text) && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  }))()`;

  if (target.fallbackTopmost) {
    await evaluateValue(cdp, `(() => {
      const node = document.querySelector('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]');
      if (!(node instanceof SVGElement)) return false;
      node.focus();
      node.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
      node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    })()`);
  } else {
    let found = null;
    for (let radius = 0; radius <= 56 && !found; radius += 8) {
      const offsets = radius === 0
        ? [[0, 0]]
        : [[radius, 0], [-radius, 0], [0, radius], [0, -radius], [radius, radius], [-radius, radius], [radius, -radius], [-radius, -radius]];
      for (const [dx, dy] of offsets) {
        const x = target.x + dx;
        const y = target.y + dy;
        if (x <= target.surface.left || x >= target.surface.right || y <= target.surface.top || y >= target.surface.bottom) continue;
        await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none", buttons: 0 });
        if (await evaluateValue(cdp, popupVisibleExpression)) {
          found = { x, y };
          break;
        }
      }
    }
    if (!found) throw new Error("active GVI canvas hover popup was not pixel-visible");
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: found.x, y: found.y, button: "left", buttons: 1, clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: found.x, y: found.y, button: "left", buttons: 0, clickCount: 1 });
  }
  await waitForValue(cdp, popupVisibleExpression, { timeoutMs: 10_000 });
  await waitForValue(cdp, `Boolean(document.querySelector('[data-testid="map-feature-detail"], [data-testid="map-selected-detail-v133"]'))`, { timeoutMs: 10_000 });
  return true;
}

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before glossary audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  await setViewport(browser.cdp, 1440, 1000);

  const staticRoutes = [
    ["home", `${server.url}/#home`, "document.querySelectorAll('.home-featured-list button').length >= 4"],
    ["finder", `${server.url}/?country=VNM#explorer`, "document.querySelectorAll('.cdp-dataset-card').length > 0"],
    ["map", mapUrlV134(server.url), "document.querySelectorAll('[data-map-element]').length >= 12"],
    ["download", `${server.url}/?country=VNM#download`, "document.querySelectorAll('.cdp-download-item').length > 0"],
    ["guide", `${server.url}/?guide=glossary#guide`, "Boolean(document.querySelector('[data-v134-glossary-directory]'))"],
  ];
  for (const [name, url, readyExpression] of staticRoutes) {
    await navigate(browser.cdp, url);
    await waitForValue(browser.cdp, readyExpression, { timeoutMs: 30_000 });
    recordCandidates(name, await evaluateValue(browser.cdp, snapshotExpression));
    inspectedRoutes += 1;
  }

  // The map must be audited in an active analysis state as well as its empty
  // first-entry state. Trigger the GVI preset, then exercise hover and click on
  // a real selectable region so popup and selected-panel copy are included.
  await navigate(browser.cdp, mapUrlV134(server.url));
  await waitForValue(browser.cdp, `document.querySelectorAll('.cdp-layer-card[data-map-element]').length >= 12`, { timeoutMs: 30_000 });
  await evaluateValue(browser.cdp, `document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_VULNERABILITY"]')?.click()`);
  await waitForValue(browser.cdp, `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-021' && Boolean(document.querySelector('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]'))`, { timeoutMs: 35_000 });
  mapInteractionPass = await exerciseActiveGviMapV134(browser.cdp);
  recordCandidates("map:active-gvi", await evaluateValue(browser.cdp, snapshotExpression));

  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    try {
      await navigate(browser.cdp, detailUrlV134(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      recordCandidates(`detail:${elementId}`, await evaluateValue(browser.cdp, snapshotExpression));
      inspectedRoutes += 1;
    } catch (error) {
      routeFailures.push({ elementId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  await navigate(browser.cdp, detailUrlV134(server.url, "D-011"));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-public-term-v134="oda"]'))`, { timeoutMs: 25_000 });
  await evaluateValue(browser.cdp, `(() => { const node = document.querySelector('[data-public-term-v134="oda"]'); node?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); node?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return Boolean(node); })()`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-public-term-tooltip-v134="oda"]'))`, { timeoutMs: 5_000 });
  hoverPass = Boolean(await evaluateValue(browser.cdp, `document.querySelector('[data-public-term-tooltip-v134="oda"]')?.textContent.includes('공적개발원조')`));
  await evaluateValue(browser.cdp, `document.querySelector('[data-public-term-v134="oda"]')?.focus()`);
  keyboardPass = Boolean(await evaluateValue(browser.cdp, `document.activeElement?.getAttribute('data-public-term-v134') === 'oda' && Boolean(document.querySelector('[data-public-term-tooltip-v134="oda"]'))`));
  await setViewport(browser.cdp, 390, 900);
  await evaluateValue(browser.cdp, `document.querySelector('[data-public-term-v134="oda"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  mobilePass = Boolean(await evaluateValue(browser.cdp, `document.querySelector('[data-public-term-v134="oda"]')?.getAttribute('aria-expanded') === 'true' && Boolean(document.querySelector('[data-public-term-tooltip-v134="oda"]'))`));
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const inventoryRows = [...inventory.values()]
  .map((row) => {
    // Repetition inside a chart/table must not create dozens of underlined
    // controls. A term is covered when that same public screen provides at
    // least one real help trigger or a visible expansion for the term.
    const unwrappedLocations = [...row.unwrappedLocations]
      .filter((location) => !row.wrappedLocations.has(location))
      .sort();
    const approved = row.glossaryMatched
      ? unwrappedLocations.length === 0
      : row.approved;
    return {
      ...row,
      locations: [...row.locations].sort().join(" | "),
      unwrappedLocations: unwrappedLocations.join(" | "),
      unwrappedExamples: [...row.unwrappedExamples].join(" | "),
      glossaryMatched: row.glossaryMatched ? "true" : "false",
      tooltipRendered:
        row.glossaryMatched && unwrappedLocations.length === 0 ? "true" : "false",
      approved: approved ? "true" : "false",
      approvalReason:
        row.glossaryMatched && unwrappedLocations.length > 0
          ? `registered term lacks a help trigger at: ${unwrappedLocations.join(" | ")}`
          : row.approvalReason,
    };
  })
  .sort((left, right) => left.token.localeCompare(right.token, "en"));
writeCsvV134(
  resolve(V134_REPORT_ROOT, "public-acronym-inventory-v134.csv"),
  inventoryRows,
  ["token", "locations", "glossaryMatched", "category", "englishName", "koreanName", "tooltipRendered", "approved", "approvalReason", "unwrappedLocations", "unwrappedExamples"]
);
const unmatched = inventoryRows.filter((row) => row.approved !== "true");

audit.check("PRODUCTION_DOM_ROUTE_COVERAGE", runtimeFailure === null && inspectedRoutes === 157 && routeFailures.length === 0, { inspectedRoutes, routeFailures, runtimeFailure }, { inspectedRoutes: 157, routeFailures: [] });
audit.check("VISIBLE_ACRONYM_WITHOUT_GLOSSARY", unmatched.length === 0, unmatched, []);
audit.check("SELECTED_OPTION_GLOSSARY_HELP", selectedOptionFailures.length === 0, selectedOptionFailures, []);
audit.check("GLOSSARY_HOVER_PASS", hoverPass, hoverPass, true);
audit.check("GLOSSARY_KEYBOARD_PASS", keyboardPass, keyboardPass, true);
audit.check("GLOSSARY_MOBILE_PASS", mobilePass, mobilePass, true);
audit.check("MAP_GLOSSARY_INTERACTION_PASS", mapInteractionPass, mapInteractionPass, true);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV134(audit, "glossary-audit-v134.json", {
  frameworkElements: catalog.length,
  accountedElements: catalog.length,
  glossaryTermCount: glossary.length,
  visibleAcronymWithoutGlossaryCount: unmatched.length,
  acronymInventoryCount: inventoryRows.length,
  selectedOptionGlossaryFailureCount: selectedOptionFailures.length,
  mapInteractionPass,
  inspectedRoutes,
  runtimeFailure,
});
