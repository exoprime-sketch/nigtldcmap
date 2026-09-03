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
import { finishAuditV135, mapUrlV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("map-guide:v135");
const requiredFunctions = [
  "발전소 입지·설비 분포 비교",
  "송전망 연결구조·전압별 분포 확인",
  "성·시별 재생에너지 계획용량 비교",
  "권역별 취약성 수준 비교",
  "성·시별 산림면적 비교",
  "성·시별 수관피복률 비교",
  "지역별 산림손실·연도 변화 확인",
  "지역별 탄소저장·배출·흡수 비교",
  "주요 광산 위치·광종 분포 확인",
  "탄소사업 위치·사업유형 확인",
  "성·시별 기후예산 규모 비교",
  "적응사업 참여지역·활동지역 확인",
];

let server = null;
let browser = null;
let runtimeFailure = null;
let snapshot = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before map guide audit");
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
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-data-guide-v130"] tbody tr').length === 12`,
    { timeoutMs: 35_000 }
  );
  snapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const guide = document.querySelector('[data-testid="map-data-guide-v130"]');
      const details = guide?.querySelector('details');
      const text = String(guide?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const headings = [...(guide?.querySelectorAll('thead th') || [])]
        .map((node) => String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim());
      const rows = [...(guide?.querySelectorAll('tbody tr') || [])].map((row) =>
        String(row.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim()
      );
      const countryActions = [...document.querySelectorAll('a, button')]
        .filter((node) => /국가정보\\s*보기/u.test(String(node.textContent || ''))).length;
      return {
        defaultOpen: Boolean(details?.open || details?.hasAttribute('open')),
        headings,
        rows,
        text,
        countryActions,
        presetCount: document.querySelectorAll('[data-testid="map-analysis-preset"]').length,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const missingFunctions = requiredFunctions.filter(
  (text) => !snapshot?.rows?.some((row) => row.includes(text))
);
const policyParagraphs = snapshot?.text?.match(/좌표가\s*있다는\s*이유만으로|공간\s*의미가\s*검증된\s*자료만|지도에\s*표시할\s*수\s*있는\s*자료만/gu) || [];
const verboseFunctionCopy = snapshot?.rows?.filter((row) => /할\s*수\s*있습니다|제공합니다/u.test(row)) || [];

audit.check("MAP_GUIDE_RUNTIME", runtimeFailure === null && Boolean(snapshot), { runtimeFailure, snapshotPresent: Boolean(snapshot) }, { snapshotPresent: true });
audit.check("MAP_GUIDE_DEFAULT_OPEN", snapshot?.defaultOpen === false, snapshot?.defaultOpen ?? null, false);
audit.check("MAP_GUIDE_ROW_COUNT", snapshot?.rows?.length === 12, snapshot?.rows?.length ?? 0, 12);
audit.check("MAP_GUIDE_COLUMN_DATA_FUNCTION", snapshot?.headings?.includes("데이터 기능") === true, snapshot?.headings || [], "데이터 기능");
audit.check("MAP_GUIDE_COLUMN_REFERENCE", snapshot?.headings?.includes("참고사항") === true, snapshot?.headings || [], "참고사항");
audit.check("MAP_GUIDE_LEGACY_COLUMNS", !snapshot?.headings?.some((heading) => /지도 표시 이유|공간 한계/u.test(heading)), snapshot?.headings || [], "legacy columns absent");
audit.check("MAP_GUIDE_FUNCTION_COVERAGE", missingFunctions.length === 0, missingFunctions, []);
audit.check("MAP_GUIDE_FUNCTION_COPY_STYLE", verboseFunctionCopy.length === 0, verboseFunctionCopy, []);
audit.check("MAP_POLICY_PARAGRAPH_COUNT", policyParagraphs.length === 0, policyParagraphs, []);
audit.check("MAP_PRESET_COUNT", snapshot?.presetCount === 5, snapshot?.presetCount ?? 0, 5);
audit.check("MAP_COUNTRY_INFO_BUTTON_COUNT", snapshot?.countryActions === 0, snapshot?.countryActions ?? null, 0);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "map-guide-audit-v135.json", {
  mapGuideDefaultOpen: snapshot?.defaultOpen ?? null,
  mapGuideRowCount: snapshot?.rows?.length || 0,
  mapPolicyParagraphCount: policyParagraphs.length,
  mapCountryInfoButtonCount: snapshot?.countryActions ?? null,
  runtimeFailure,
});
