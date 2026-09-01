#!/usr/bin/env node

import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
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

const audit = new AuditV125("limitations:v127");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("DETAIL_ROUTE_TARGET_COUNT", catalog.length === 152, catalog.length, 152);

const GENERIC_ZERO_COPY = "원천에 제공되지 않은 값은 0으로 바꾸지 않습니다";
const GENERIC_NO_REASON_COPY =
  "현재 선택한 공개 레코드에 별도로 기재된 결측 사유가 없습니다";
const CPIA_GENERIC_SCALE_COPY =
  "World Bank CPIA의 1~6점 공식 척도를 고정해 표시합니다";
const TECHNICAL_PROVENANCE_TOKENS = [
  ".xlsx",
  "sourceFile",
  "sourceSheet",
  "sourceRow",
  "recordId",
  "indicatorId",
  "apiParams",
  "rawAttributes",
  "packUrl",
  "shardId",
  "sha256",
  "publicationDecisionId",
  "DATABASE_ID=",
  "OBS_STATUS=",
  "[원본 버전]",
  "[값 검증]",
  "[원문 모순]",
];
const A002_LIMITATIONS = [
  "공개된 CPIA 값은 2005~2015년까지 제공됩니다",
  "2016~2024년은 원천자료에서 값이 제공되지 않았습니다",
  "2014년 공공부문 관리 클러스터 값은 원천 기재값과 하위항목 평균이 일치하지 않아 플랫폼에서는 원천 기재값을 표시합니다",
];

function normalized(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/[–—−]/gu, "~")
    .replace(/\s+/gu, " ")
    .trim();
}

function rawSemanticText(elementId) {
  const result = readJson(
    resolve(SEMANTIC_ROOT, "elements", `${elementId.toLocaleLowerCase("en-US")}.json`)
  );
  if (result.error) return { caveats: [], notes: [], error: result.error };
  const indicators = Array.isArray(result.value?.indicators)
    ? result.value.indicators
    : [];
  return {
    caveats: [
      ...new Set(
        indicators
          .map((item) => normalized(item?.sourceCaveat))
          .filter((value) => value.length >= 80)
      ),
    ],
    notes: [
      ...new Set(
        indicators
          .map((item) => normalized(item?.sourceNote))
          .filter((value) => value.length >= 80)
      ),
    ],
    error: null,
  };
}

const routeFailures = [];
const zeroCopyHits = [];
const noReasonCopyHits = [];
const cpiaGenericScaleCopyHits = [];
const emptyLimitationPanels = [];
const rawCaveatHits = [];
const rawNoteHits = [];
const provenanceHits = [];
let renderedRouteCount = 0;
let a002 = null;
let server = null;
let browser = null;
let runtimeFailure = null;

async function navigateLimitationsDetail(cdp, url) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await navigate(cdp, url);
      await waitForValue(
        cdp,
        `(() => {
          if (document.querySelector('[role="alert"]')) return true;
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          return Boolean(
            root &&
            root.getAttribute('data-analysis-state') === 'ready' &&
            root.querySelector('[data-testid="public-data-title"]')
          );
        })()`,
        { timeoutMs: 20_000 }
      );
      const alertText = await evaluateValue(
        cdp,
        `document.querySelector('[role="alert"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || null`
      );
      if (alertText) throw new Error(alertText);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < 2) await new Promise((resolveWait) => setTimeout(resolveWait, 150));
    }
  }
  throw new Error(lastError || "public limitation route unavailable");
}

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1050);

  for (const element of catalog) {
    const semanticText = rawSemanticText(element.elementId);
    if (semanticText.error) {
      routeFailures.push({
        elementId: element.elementId,
        error: `semantic document: ${semanticText.error}`,
      });
      continue;
    }
    const url = new URL(server.url);
    url.searchParams.set("view", "data");
    url.searchParams.set("country", "VNM");
    url.searchParams.set("element", element.elementId);
    url.hash = "element-detail";
    try {
      await navigateLimitationsDetail(browser.cdp, url.toString());
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          if (!root) return { mounted: false };
          const normalize = (value) => String(value || '')
            .normalize('NFC')
            .replace(/[–—−]/gu, '~')
            .replace(/\\s+/gu, ' ')
            .trim();
          const text = normalize(root.textContent);
          const visibleText = normalize(root.innerText);
          const panels = [...root.querySelectorAll('[data-testid="public-limitations-panel"]')];
          const panelResults = panels.map((panel) => {
            const items = [...panel.querySelectorAll(
              '[data-testid="public-limitation-item"], li'
            )].filter((item) => normalize(item.textContent).length > 0);
            return {
              itemCount: items.length,
              itemTexts: items.map((item) => normalize(item.textContent)),
              isDetails: panel.tagName.toLocaleLowerCase('en-US') === 'details',
              open: panel instanceof HTMLDetailsElement ? panel.open : null,
              text: normalize(panel.textContent),
            };
          });
          const chartGap = root.querySelector('[data-testid="a002-coverage-gap-note"]');
          const html = normalize(root.outerHTML);
          const tokenHits = ${JSON.stringify(TECHNICAL_PROVENANCE_TOKENS)}.filter(
            (token) => html.toLocaleLowerCase('en-US').includes(
              normalize(token).toLocaleLowerCase('en-US')
            )
          );
          return {
            mounted: true,
            text,
            visibleText,
            zeroCopy: text.includes(normalize(${JSON.stringify(GENERIC_ZERO_COPY)})),
            noReasonCopy: text.includes(normalize(${JSON.stringify(GENERIC_NO_REASON_COPY)})),
            cpiaGenericScaleCopy: text.includes(normalize(${JSON.stringify(CPIA_GENERIC_SCALE_COPY)})),
            panelResults,
            chartGapVisible: Boolean(
              chartGap &&
              chartGap.getClientRects().length > 0 &&
              normalize(chartGap.innerText).includes('2016~2024')
            ),
            tokenHits,
          };
        })()`
      );
      if (!result?.mounted) {
        routeFailures.push({ elementId: element.elementId, error: "public root missing" });
        continue;
      }
      renderedRouteCount += 1;
      if (result.zeroCopy) zeroCopyHits.push(element.elementId);
      if (result.noReasonCopy) noReasonCopyHits.push(element.elementId);
      if (result.cpiaGenericScaleCopy) cpiaGenericScaleCopyHits.push(element.elementId);
      for (const panel of result.panelResults || []) {
        if (panel.itemCount === 0) {
          emptyLimitationPanels.push({ elementId: element.elementId, panel });
        }
      }
      for (const token of result.tokenHits || []) {
        provenanceHits.push({ elementId: element.elementId, token });
      }
      const routeText = normalized(result.text);
      for (const caveat of semanticText.caveats) {
        if (routeText.includes(caveat)) {
          rawCaveatHits.push({ elementId: element.elementId, sample: caveat.slice(0, 160) });
        }
      }
      for (const note of semanticText.notes) {
        if (routeText.includes(note)) {
          rawNoteHits.push({ elementId: element.elementId, sample: note.slice(0, 160) });
        }
      }
      if (element.elementId === "A-002") {
        a002 = {
          text: result.text,
          visibleText: result.visibleText,
          panelResults: result.panelResults,
          chartGapVisible: result.chartGapVisible,
        };
      }
    } catch (error) {
      routeFailures.push({
        elementId: element.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check(
  "PUBLIC_DETAIL_ROUTES_RENDERED",
  runtimeFailure === null && renderedRouteCount === 152 && routeFailures.length === 0,
  { rendered: renderedRouteCount, failed: routeFailures.length, runtimeFailure },
  { rendered: 152, failed: 0, runtimeFailure: null },
  routeFailures.slice(0, 152)
);
audit.check(
  "GENERIC_ZERO_IMPUTATION_SENTENCE_IN_DETAIL_DOM",
  zeroCopyHits.length === 0,
  zeroCopyHits.length,
  0,
  zeroCopyHits
);
audit.check(
  "GENERIC_NO_MISSING_REASON_SENTENCE_IN_DETAIL_DOM",
  noReasonCopyHits.length === 0,
  noReasonCopyHits.length,
  0,
  noReasonCopyHits
);
audit.check(
  "CPIA_GENERIC_SCALE_SENTENCE_IN_DETAIL_DOM",
  cpiaGenericScaleCopyHits.length === 0,
  cpiaGenericScaleCopyHits.length,
  0,
  cpiaGenericScaleCopyHits
);
audit.check(
  "LIMITATION_PANEL_WITH_ZERO_ITEMS",
  emptyLimitationPanels.length === 0,
  emptyLimitationPanels.length,
  0,
  emptyLimitationPanels
);

const a002Text = normalized(a002?.text);
const a002Expected = A002_LIMITATIONS.map(normalized);
audit.check(
  "A002_COVERAGE_GAP_VISIBLE",
  a002 !== null &&
    a002Text.includes(a002Expected[0]) &&
    a002Text.includes(a002Expected[1]) &&
    a002?.chartGapVisible === true,
  {
    publishedRange: a002Text.includes(a002Expected[0]),
    unavailableRange: a002Text.includes(a002Expected[1]),
    chartSummaryVisible: a002?.chartGapVisible ?? false,
  },
  { publishedRange: true, unavailableRange: true, chartSummaryVisible: true }
);
audit.check(
  "A002_SOURCE_INCONSISTENCY_NOTE_VISIBLE",
  a002 !== null && a002Text.includes(a002Expected[2]),
  a002Text.includes(a002Expected[2]),
  true
);
const a002Panels = a002?.panelResults || [];
audit.check(
  "A002_LIMITATIONS_COLLAPSED_BY_DEFAULT",
  a002Panels.length === 1 &&
    a002Panels[0].isDetails === true &&
    a002Panels[0].open === false &&
    a002Panels[0].itemCount === 3,
  a002Panels.map((panel) => ({
    itemCount: panel.itemCount,
    isDetails: panel.isDetails,
    open: panel.open,
  })),
  [{ itemCount: 3, isDetails: true, open: false }]
);
audit.check("RAW_SOURCE_CAVEAT_EXPOSED", rawCaveatHits.length === 0, rawCaveatHits.length, 0, rawCaveatHits);
audit.check("RAW_SOURCE_NOTE_EXPOSED", rawNoteHits.length === 0, rawNoteHits.length, 0, rawNoteHits);
audit.check(
  "TECHNICAL_PROVENANCE_EXPOSED",
  provenanceHits.length === 0,
  provenanceHits.length,
  0,
  provenanceHits.slice(0, 100)
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  browser?.runtimeErrors?.length === 0,
  browser?.runtimeErrors?.length ?? null,
  0,
  browser?.runtimeErrors?.slice(0, 50)
);

audit.finish({
  inspectedRoutes: renderedRouteCount,
  genericZeroImputationSentenceCount: zeroCopyHits.length,
  genericNoMissingReasonSentenceCount: noReasonCopyHits.length,
  cpiaGenericScaleSentenceCount: cpiaGenericScaleCopyHits.length,
  emptyLimitationPanelCount: emptyLimitationPanels.length,
  a002CoverageGapVisible:
    a002Text.includes(a002Expected[0]) &&
    a002Text.includes(a002Expected[1]) &&
    a002?.chartGapVisible === true,
  a002SourceInconsistencyVisible: a002Text.includes(a002Expected[2]),
  rawSourceCaveatExposed: rawCaveatHits.length,
  rawSourceNoteExposed: rawNoteHits.length,
  technicalProvenanceExposed: provenanceHits.length,
  uncaughtRuntimeError: browser?.runtimeErrors?.length ?? null,
});
