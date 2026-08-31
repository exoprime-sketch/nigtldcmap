#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  loadPackPayloads,
  payloadRecords,
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
  detailUrlV129,
  finishAuditV129,
  sourceTextV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("specialized:v129");
const componentPath = resolve(
  PROJECT_ROOT,
  "src/components/data/public/ClimateBudgetAllocationAnalysisV129.tsx"
);
const registryPath = resolve(
  PROJECT_ROOT,
  "src/data/visualization/publicVisualizationRegistryV126.ts"
);
const routerPath = resolve(
  PROJECT_ROOT,
  "src/components/data/public/PublicDataAnalysisRouterV126.tsx"
);
const homePath = resolve(PROJECT_ROOT, "src/pages/HomePage.tsx");
const sourcePaths = [componentPath, registryPath, routerPath, homePath];
const missingSources = sourcePaths.filter((path) => !existsSync(path));
const source = sourceTextV129(sourcePaths);
const publicCopyExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".ts",
  ".tsx",
  ".txt",
]);
function publicPilotCopyMatches(root) {
  const matches = [];
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || !existsSync(current)) continue;
    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(current)) pending.push(resolve(current, entry));
      continue;
    }
    const extension = current.slice(current.lastIndexOf(".")).toLowerCase();
    if (!publicCopyExtensions.has(extension)) continue;
    const text = readFileSync(current, "utf8");
    if (/베트남\s*파일럿/u.test(text)) {
      matches.push(current.replace(`${PROJECT_ROOT}\\`, ""));
    }
  }
  return matches;
}
const publicPilotCopyMatchesV129 = [
  ...publicPilotCopyMatches(resolve(PROJECT_ROOT, "src")),
  ...publicPilotCopyMatches(resolve(PROJECT_ROOT, "public")),
];
const packs = loadPackPayloads();
const rows = payloadRecords(packs.elements.get("D-005")?.observations);
const populatedRows = rows.filter(
  (row) => row?.value !== null && row?.value !== undefined && Number.isFinite(Number(row.value))
);
const missingRows = rows.filter(
  (row) => row?.value === null || row?.value === undefined
);
const representative = Object.fromEntries(
  [
    ["adaptation", "D-005_adaptation_share_total_cc"],
    ["mitigation", "D-005_mitigation_share_total_cc"],
    ["dual", "D-005_dual_benefit_share_total_cc"],
  ].map(([key, indicatorId]) => [
    key,
    Number(rows.find((row) => row.indicatorId === indicatorId)?.value),
  ])
);
const representativeSum = Object.values(representative).reduce(
  (sum, value) => sum + Number(value || 0),
  0
);

audit.check("SPECIALIZED_SOURCES", missingSources.length === 0, missingSources, []);
audit.check("D005_PACK_AVAILABLE", packs.errors.length === 0 && rows.length === 10, { packErrors: packs.errors, rows: rows.length }, { packErrors: [], rows: 10 });
audit.check(
  "D005_REPRESENTATIVE_SOURCE_VALUES",
  representative.adaptation === 88 &&
    representative.mitigation === 2 &&
    representative.dual === 10 &&
    representativeSum === 100,
  { ...representative, sum: representativeSum },
  { adaptation: 88, mitigation: 2, dual: 10, sum: 100 }
);
audit.check(
  "D005_MISSING_SOURCE_VALUES",
  populatedRows.length === 8 && missingRows.length === 2 &&
    missingRows.every((row) => row.missingReasonCode === "M01"),
  { populated: populatedRows.length, missing: missingRows.length, missingCodes: missingRows.map((row) => row.missingReasonCode) },
  { populated: 8, missing: 2, missingCodes: ["M01", "M01"] }
);
audit.check(
  "D005_SPECIALIZED_SOURCE_CONTRACT",
  /D-005/gu.test(source) &&
    /ClimateBudgetAllocationAnalysisV129/gu.test(source) &&
    /d005-specialized-renderer/gu.test(source) &&
    /d005-representative-allocation/gu.test(source) &&
    /d005-budget-basis-selector/gu.test(source),
  {
    registry: /D-005/gu.test(source),
    component: /ClimateBudgetAllocationAnalysisV129/gu.test(source),
    root: /d005-specialized-renderer/gu.test(source),
    representative: /d005-representative-allocation/gu.test(source),
    selector: /d005-budget-basis-selector/gu.test(source),
  },
  "all specialized source contracts"
);

function d005SnapshotExpression() {
  return `(() => {
    const root = document.querySelector('[data-testid="d005-specialized-renderer"]');
    const representative = root?.querySelector('[data-testid="d005-representative-allocation"]');
    const selector = root?.querySelector('[data-testid="d005-budget-basis-selector"]');
    const segments = [...(root?.querySelectorAll('[data-testid="d005-representative-share"]') || [])];
    const text = root?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
    return {
      mounted: Boolean(root),
      zeroImputation: root?.getAttribute('data-zero-imputation'),
      zoomControls: root?.getAttribute('data-zoom-controls'),
      representative: Boolean(representative),
      segmentCount: segments.length,
      segmentText: segments.map((node) => node.textContent?.replace(/\\s+/gu, ' ').trim() || ''),
      selector: selector instanceof HTMLSelectElement ? {
        value: selector.value,
        options: [...selector.options].map((option) => ({ value: option.value, text: option.textContent?.trim() || '' })),
      } : null,
      text,
      toolbarCount: root?.querySelectorAll('[data-testid="chart-viewport-controls"]').length || 0,
      interactiveLineCount: root?.querySelectorAll('[data-chart-interaction-v127="true"], polyline[data-chart-series], path[data-chart-series]').length || 0,
      missingPublic: /미공개/u.test(text),
      zeroMissingClaim: /미공개[^0-9]{0,8}0(?:\\.0+)?\\s*%/u.test(text),
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
let d005Initial = null;
const selectorSnapshots = [];
let home = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, detailUrlV129(server.url, "D-005"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="d005-specialized-renderer"]'))`,
    { timeoutMs: 30_000 }
  );
  d005Initial = await evaluateValue(browser.cdp, d005SnapshotExpression());
  for (const option of d005Initial?.selector?.options || []) {
    const changed = await evaluateValue(
      browser.cdp,
      `(() => {
        const select = document.querySelector('[data-testid="d005-budget-basis-selector"]');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = ${JSON.stringify(option.value)};
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`
    );
    if (!changed) throw new Error(`D-005 selector option unavailable: ${option.value}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 80));
    selectorSnapshots.push(await evaluateValue(browser.cdp, d005SnapshotExpression()));
  }

  await navigate(browser.cdp, `${server.url}/#home`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-v128-home]'))`, {
    timeoutMs: 20_000,
  });
  home = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-v128-home]');
      const h1 = root?.querySelector('h1')?.textContent?.replace(/\\s+/gu, ' ').trim() || '';
      const text = root?.textContent?.replace(/\\s+/gu, ' ').trim() || '';
      return {
        h1,
        text,
        pilotH1: /베트남\\s*파일럿/u.test(h1),
        eyebrow: /국가별\\s*기후기술\\s*협력\\s*데이터/u.test(text),
        scope: /현재\\s*제공\\s*국가\\s*[·ㆍ]?\\s*베트남/u.test(text),
        description: /정책·제도/u.test(text) && /에너지·인프라/u.test(text) && /지도와\\s*차트/u.test(text),
        featured: /베트남\\s*주요\\s*분석\\s*데이터/u.test(text),
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const expectedSelectorLabels = [
  "총 기후변화 지출",
  "경상예산",
  "공공 자본지출",
  "부처 기후예산",
  "성 단위 기후예산",
];
const selectorLabels = d005Initial?.selector?.options?.map((option) => option.text) || [];
const selectorPass =
  selectorLabels.length === 5 &&
  expectedSelectorLabels.every((label) => selectorLabels.includes(label)) &&
  selectorSnapshots.length === 5 &&
  selectorSnapshots.every((snapshot) => snapshot.mounted && snapshot.text);
const representativeRuntimePass =
  d005Initial?.representative === true &&
  d005Initial?.segmentCount === 3 &&
  ["88%", "2%", "10%"].every((value) =>
    d005Initial.segmentText.some((text) => text.includes(value))
  );
const noMixedLinePass =
  d005Initial?.interactiveLineCount === 0 &&
  selectorSnapshots.every((snapshot) => snapshot.interactiveLineCount === 0);
const noZeroImputationPass =
  d005Initial?.zeroImputation === "false" &&
  d005Initial?.missingPublic === true &&
  d005Initial?.zeroMissingClaim === false &&
  selectorSnapshots.every((snapshot) => snapshot.zeroMissingClaim === false);
const noZoomPass =
  d005Initial?.zoomControls === "false" &&
  d005Initial?.toolbarCount === 0 &&
  selectorSnapshots.every((snapshot) => snapshot.toolbarCount === 0);
const capitalSnapshot = selectorSnapshots.find(
  (snapshot) => snapshot.selector?.value === "capital"
);
const capitalMetadataPass =
  /2020\s*기준/u.test(capitalSnapshot?.text || "") &&
  /약\s*25\s*%/u.test(capitalSnapshot?.text || "");
const homePass =
  home?.h1 === "개도국 기후기술 협력 플랫폼" &&
  home?.pilotH1 === false &&
  home?.eyebrow === true &&
  home?.scope === true &&
  home?.description === true &&
  home?.featured === true;

audit.check("D005_SPECIALIZED_RENDERER", runtimeFailure === null && d005Initial?.mounted === true, { runtimeFailure, d005Initial }, { mounted: true });
audit.check("D005_REPRESENTATIVE_SHARES", runtimeFailure === null && representativeRuntimePass, d005Initial?.segmentText || runtimeFailure, ["88%", "2%", "10%"]);
audit.check("D005_SHARE_SUM", representativeSum === 100, representativeSum, 100);
audit.check("D005_DENOMINATOR_SELECTOR", runtimeFailure === null && selectorPass, { labels: selectorLabels, snapshots: selectorSnapshots.length }, { labels: expectedSelectorLabels, snapshots: 5 });
audit.check("D005_MIXED_DENOMINATOR_LINE", runtimeFailure === null && noMixedLinePass, { initial: d005Initial?.interactiveLineCount, selections: selectorSnapshots.map((item) => item.interactiveLineCount) }, { all: 0 });
audit.check("D005_ZERO_IMPUTATION", runtimeFailure === null && noZeroImputationPass, { initial: d005Initial, selections: selectorSnapshots.map((item) => ({ value: item.selector?.value, zeroMissingClaim: item.zeroMissingClaim })) }, { dataZeroImputation: false, missingLabel: "미공개", missingAsZero: 0 });
audit.check("D005_ZOOM_CONTROL", runtimeFailure === null && noZoomPass, { initial: d005Initial?.toolbarCount, selections: selectorSnapshots.map((item) => item.toolbarCount) }, { all: 0 });
audit.check(
  "D005_CAPITAL_PUBLIC_METADATA",
  runtimeFailure === null && capitalMetadataPass,
  {
    selector: capitalSnapshot?.selector?.value || null,
    text: capitalSnapshot?.text || runtimeFailure,
  },
  { selector: "capital", referencePeriod: "2020 기준", adaptation: "약 25%" }
);
audit.check("HOME_CANONICAL_TITLE", runtimeFailure === null && homePass, { runtimeFailure, home }, { h1: "개도국 기후기술 협력 플랫폼", pilotH1: false, canonicalCopy: true });
audit.check(
  "PUBLIC_VIETNAM_PILOT_PRIMARY_COPY",
  publicPilotCopyMatchesV129.length === 0,
  publicPilotCopyMatchesV129,
  []
);
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

finishAuditV129(audit, "specialized-audit-v129.json", {
  d005Renderer: runtimeFailure === null && representativeRuntimePass && selectorPass && noMixedLinePass && noZeroImputationPass && noZoomPass ? "PASS" : "FAIL",
  d005RepresentativeShares: representative,
  d005RepresentativeShareSum: representativeSum,
  homeBrand: homePass ? "PASS" : "FAIL",
});
