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
    // V142 renders station observations and safety records as typed tables,
    // not interchangeable entity cards. Require actual named, populated tables
    // with the relevant context columns; a container alone is not sufficient.
    const specializedSelector = {
      'B-023': '[data-testid="hydro-station-observations-v142"]',
      'B-028': '[data-testid="hydro-station-observations-v142"]',
      'C-011': '[data-testid="security-safety-info-v142"]',
      'B-025': '[data-testid="basin-area-v147"]',
      'B-026': '[data-testid="flow-direction-v147"]',
      'C-002': '[data-testid="reported-inventory-v147"]',
    }[${JSON.stringify(elementId)}];
    const specializedRoot = specializedSelector ? document.querySelector(specializedSelector) : null;
    const tableSelector = ${JSON.stringify(elementId)} === 'C-002' ? '[data-testid="inventory-matrix-v147"]' : 'table';
    const tables = specializedRoot ? [...specializedRoot.querySelectorAll(tableSelector)].map((table) => ({
      headers: [...table.querySelectorAll('thead th')].map((node) => normalize(node.textContent)),
      rows: [...table.querySelectorAll('tbody tr')].map((row) => [...row.querySelectorAll('th, td')].map((node) => normalize(node.textContent))),
    })) : [];
    const requiredHeaders = ({
      'C-011': ['항목', '설명', '원문'],
      'B-025': ['유역', '전체 유역 면적(문헌)', '베트남 내 면적(문헌)', '베트남 내 면적(GIS 산출)', '국경 공유'],
      'B-026': ['방향', '비율(%)'],
      'C-002': ['부문', '부문 합계', '이산화탄소(CO₂)', '메탄(CH₄)', '아산화질소(N₂O)', '수소불화탄소(HFCs)'],
    })[${JSON.stringify(elementId)}] || ['값', '단위', '기준연도'];
    const specializedTable = specializedSelector ? {
      heading: normalize(specializedRoot?.querySelector('h3, h4, h5')?.textContent),
      tableCount: tables.length,
      rowCount: tables.reduce((sum, table) => sum + table.rows.length, 0),
      valid: Boolean(specializedRoot?.querySelector('h3, h4, h5')?.textContent.trim()) && tables.length > 0 && tables.every((table) =>
        requiredHeaders.every((header) => table.headers.includes(header)) && table.rows.length > 0 &&
        table.rows.every((cells) => cells.length === table.headers.length && cells[0] && cells[1])
      ),
    } : null;
    return {
      elementId: ${JSON.stringify(elementId)},
      specializedTable,
      // Some elements show their records as a province distribution instead of
      // a card grid: 63 values per scenario-year is a table, not 33,000 cards.
      // A province distribution (V137/V138) or a station analysis (B-008, V138)
      // reads the rows as what they are instead of printing record cards.
      // The province-series analysis (V140: B-031..B-034, C-016) reads the
      // rows as one value per province and year, with the province's own
      // series, the comparison and a table - not as record cards.
      // V148: A-023 reads its plants as a searchable list under the fuel
      // distribution and A-024 its lines as voltage/plan tables - the records
      // are shown, but not as cards. V153: E-006 lists its investors in two
      // located groups (Viet Nam office / abroad) with the facility card on
      // selection - records shown as a list, not a card grid.
      distributionSummary: Boolean(document.querySelector('[data-testid="region-scenario-summary-v137"], [data-testid="sea-level-station-analysis-v138"], [data-testid="province-series-analysis-v140"], [data-testid="cooperation-checklist-v141"], [data-testid="energy-outlook-plan-v141"], [data-testid="power-plant-list-v148"], [data-testid="transmission-voltage-table-v140"], [data-testid="investor-network-v153"]')) || specializedTable?.valid === true,
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
    console.log(JSON.stringify({ type: "progress", audit: "entity-cards:v131", elementId, phase: "start" }));
    try {
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(browser.cdp, cardSnapshotExpression(elementId));
      console.log(JSON.stringify({ type: "progress", audit: "entity-cards:v131", elementId, phase: "complete" }));
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
      console.error(JSON.stringify({ type: "route-error", elementId, error: String(error), browserStderr: browser.stderr() }));
      if (/DevTools command timeout|DevTools socket closed/.test(String(error))) throw error;
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
// An element that holds entities has to show them. Cards are one way; the
// province distribution is the other, and it is the right one where the records
// are 63 province values per scenario-year rather than 63 things to list.
const missingCardRoutes = routeResults.filter(
  (row) => Number(row?.cardCount || 0) === 0 && row?.distributionSummary !== true
);
const duplicateCardTitleCount = routeResults.reduce(
  (sum, row) => sum + (row?.duplicates || []).length,
  0
);

audit.check("ENTITY_CARD_ROUTE_COVERAGE", runtimeFailure === null && routeResults.length === entityElementIds.length, routeResults.length, entityElementIds.length, { runtimeFailure, routeFailures });
audit.check("ENTITY_CARD_WITHOUT_MEANINGFUL_PRIMARY_TITLE", routeFailures.flatMap((row) => row?.invalid || []).length === 0, routeFailures.flatMap((row) => row?.invalid || []).length, 0, routeFailures.slice(0, 30));
audit.check("ENTITY_CARD_LONG_UNSTRUCTURED_TEXT_COUNT", longTextCount === 0, longTextCount, 0);
audit.check("ENTITY_CARD_RESPONSIVE", responsiveFailures.length === 0, responsiveFailures.length, 0, responsiveFailures.slice(0, 20));
audit.check("ENTITY_CARD_COLUMNS_MAX", routeResults.every((row) => Number(row?.columns || 0) <= 4), Math.max(0, ...routeResults.map((row) => Number(row?.columns || 0))), "<= 4");
audit.check("ENTITY_CARD_FACT_LIMIT", routeResults.every((row) => (row?.invalid || []).every((item) => Number(item.factCount || 0) <= 6)), routeResults.flatMap((row) => row?.invalid || []).filter((item) => Number(item.factCount || 0) > 6).length, 0);
audit.check("ENTITY_CARD_ROUTE_RENDERING", missingCardRoutes.length === 0, missingCardRoutes.length, 0, missingCardRoutes);
audit.check("SPECIALIZED_ENTITY_TABLES", ["B-023", "B-028", "C-011"].every((id) => routeResults.find((row) => row.elementId === id)?.specializedTable?.valid === true), routeResults.filter((row) => row.specializedTable).map((row) => ({ elementId: row.elementId, ...row.specializedTable })), "three populated, titled tables with value/context columns");
audit.check(
  "ENTITY_RECORDS_SHOWN_SOMEHOW",
  routeResults.every(
    (row) => Number(row?.cardCount || 0) > 0 || row?.distributionSummary === true
  ),
  routeResults.filter(
    (row) => !(Number(row?.cardCount || 0) > 0 || row?.distributionSummary === true)
  ).map((row) => row?.elementId),
  []
);
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
