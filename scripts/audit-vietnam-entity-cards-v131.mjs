#!/usr/bin/env node

import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  loadPackPayloads,
  payloadRecords,
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
import { detailUrlV129 } from "./v129/audit-helpers.mjs";
import {
  finishAuditV131,
  sourceTextV131,
} from "./v131/audit-helpers.mjs";

const audit = new AuditV125("entity-cards:v131");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const packs = loadPackPayloads();
const semanticFitResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json")
);
const rendererByElement = new Map(
  (Array.isArray(semanticFitResult.value?.elements)
    ? semanticFitResult.value.elements
    : []
  ).map((row) => [row.elementId, row.primaryRenderer])
);
const nonCardRenderers = new Set([
  "policy-timeline",
  "evidence-matrix",
  "capability-scorecard",
  "status-only",
]);
const entityElementIds = catalog
  .filter(
    (element) =>
      payloadRecords(packs.elements.get(element.elementId)?.entities).length > 0 &&
      !nonCardRenderers.has(rendererByElement.get(element.elementId))
  )
  .map((element) => element.elementId);
const cardSource = sourceTextV131([
  resolve(PROJECT_ROOT, "src/components/data/public/PublicEntityCardGridV131.tsx"),
  resolve(PROJECT_ROOT, "src/components/data/public/public-entity-cards-v131.css"),
  resolve(PROJECT_ROOT, "src/components/data/semantic/SemanticContractRendererV125.tsx"),
]);

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("PACK_PAYLOADS", packs.errors.length === 0, packs.errors.length, 0, packs.errors);
audit.check("CARD_COMPONENT_CONTRACT", [
  "public-entity-card-v131",
  "public-entity-card-title",
  "public-entity-card-facts",
  "resolvePublicEntityTitleV131",
  "grid-template-columns: repeat(4",
  "-webkit-line-clamp: 2",
].every((token) => cardSource.includes(token)), true, true);

function cardSnapshotExpression(elementId) {
  return `(() => {
    const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const cards = [...document.querySelectorAll('[data-testid="public-entity-card-v131"]')];
    const titles = cards.map((card) => normalize(card.querySelector('[data-testid="public-entity-card-title"]')?.textContent));
    const duplicates = [...new Set(titles.filter((title, index) => title && titles.indexOf(title) !== index))];
    const rows = cards.map((card, index) => {
      const titleNode = card.querySelector('[data-testid="public-entity-card-title"]');
      const title = normalize(titleNode?.textContent);
      const facts = card.querySelectorAll('[data-testid="public-entity-card-facts"] > div');
      const badges = card.querySelectorAll('.pec131-card__badges li');
      const paragraphs = [...card.querySelectorAll('p')].map((node) => normalize(node.textContent));
      const style = titleNode ? getComputedStyle(titleNode) : null;
      return {
        index,
        title,
        strategy: card.getAttribute('data-title-strategy'),
        availability: card.getAttribute('data-name-availability'),
        factCount: facts.length,
        badgeCount: badges.length,
        longParagraphs: paragraphs.filter((value) => value.length > 180),
        pipeText: /(?:\\s[|]\\s.*){2,}/u.test(normalize(card.textContent)),
        textLength: normalize(card.textContent).length,
        titleClamp: style?.getPropertyValue('-webkit-line-clamp') || null,
      };
    });
    const grid = document.querySelector('[data-testid="public-entity-card-grid-v131"]');
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0;
    return {
      elementId: ${JSON.stringify(elementId)},
      cardCount: cards.length,
      contextTitleCount: rows.filter((row) => ['source-identifier', 'factual-composite', 'record-type'].includes(row.strategy)).length,
      invalid: rows.filter((row) => !row.title || row.title === '명칭 미기재' || row.title === '자료 없음' || row.factCount > 6 || row.badgeCount > 4 || row.longParagraphs.length > 0 || row.pipeText || row.textLength > 760 || row.titleClamp !== '2'),
      duplicates,
      columns,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const routeFailures = [];
const routeResults = [];
const responsiveFailures = [];
let entityCardCount = 0;
let entityContextTitleCount = 0;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);

  for (const elementId of entityElementIds) {
    try {
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(browser.cdp, cardSnapshotExpression(elementId));
      routeResults.push(result);
      entityCardCount += Number(result?.cardCount || 0);
      entityContextTitleCount += Number(result?.contextTitleCount || 0);
      if (
        (result?.invalid || []).length > 0 ||
        (result?.duplicates || []).length > 0 ||
        Number(result?.overflow || 0) > 1 ||
        Number(result?.columns || 0) > 4
      ) {
        routeFailures.push(result);
      }
    } catch (error) {
      routeFailures.push({ elementId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const width of [390, 768, 1024, 1280, 1440, 1920]) {
    for (const elementId of ["E-018", "D-023", "E-019"]) {
      await setViewport(browser.cdp, width, width === 390 ? 1000 : 1100);
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `Boolean(document.querySelector('[data-testid="public-entity-card-grid-v131"]'))`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(browser.cdp, cardSnapshotExpression(elementId));
      const expectedMaxColumns = width < 620 ? 1 : width < 960 ? 2 : width < 1240 ? 3 : 4;
      if (
        Number(result?.overflow || 0) > 1 ||
        Number(result?.columns || 0) > expectedMaxColumns ||
        (result?.invalid || []).length > 0 ||
        (result?.duplicates || []).length > 0
      ) {
        responsiveFailures.push({ width, ...result, expectedMaxColumns });
      }
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const longTextCount = routeResults.reduce(
  (sum, row) => sum + (row?.invalid || []).filter((item) => item.pipeText || item.longParagraphs?.length > 0 || item.textLength > 760).length,
  0
);
const missingCardRoutes = routeResults.filter((row) => Number(row?.cardCount || 0) === 0);
const duplicateCardTitleCount = routeResults.reduce(
  (sum, row) => sum + (row?.duplicates || []).length,
  0
);

audit.check("ENTITY_CARD_ROUTE_COVERAGE", runtimeFailure === null && routeResults.length === entityElementIds.length, routeResults.length, entityElementIds.length, { runtimeFailure });
audit.check("ENTITY_CARD_WITHOUT_MEANINGFUL_PRIMARY_TITLE", routeFailures.flatMap((row) => row?.invalid || []).length === 0, routeFailures.flatMap((row) => row?.invalid || []).length, 0, routeFailures.slice(0, 30));
audit.check("ENTITY_CARD_LONG_UNSTRUCTURED_TEXT_COUNT", longTextCount === 0, longTextCount, 0);
audit.check("ENTITY_CARD_RESPONSIVE", responsiveFailures.length === 0, responsiveFailures.length, 0, responsiveFailures.slice(0, 20));
audit.check("ENTITY_CARD_COLUMNS_MAX", routeResults.every((row) => Number(row?.columns || 0) <= 4), Math.max(0, ...routeResults.map((row) => Number(row?.columns || 0))), "<= 4");
audit.check("ENTITY_CARD_FACT_LIMIT", routeResults.every((row) => (row?.invalid || []).every((item) => Number(item.factCount || 0) <= 6)), routeResults.flatMap((row) => row?.invalid || []).filter((item) => Number(item.factCount || 0) > 6).length, 0);
audit.check("ENTITY_CARD_ROUTE_RENDERING", missingCardRoutes.length === 0, missingCardRoutes.length, 0, missingCardRoutes);
audit.check("ENTITY_CARD_DUPLICATE_PRIMARY_TITLE_COUNT", duplicateCardTitleCount === 0, duplicateCardTitleCount, 0, routeResults.filter((row) => row?.duplicates?.length));
audit.check("ENTITY_CARD_PUBLIC_TITLE_RESOLVER", cardSource.includes("resolvePublicEntityTitleV131") && !cardSource.includes('|| "명칭 미기재"'), true, true);
audit.check("ENTITY_CARD_PUBLIC_DOM_POLICY", !cardSource.includes("data-title-strategy") && !cardSource.includes("data-name-availability"), true, true);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV131(audit, "entity-card-audit-v131.json", {
  entityElementRouteCount: entityElementIds.length,
  entityCardCount,
  entityContextTitleCount,
  entityCardLongTextCount: longTextCount,
  entityCardDuplicatePrimaryTitleCount: duplicateCardTitleCount,
  responsiveWidthCount: 6,
  runtimeFailure,
});
