#!/usr/bin/env node
/**
 * The 152-screen review record, taken from the production build in a browser.
 *
 * For every element: the public title and the question the screen states, the
 * analysis it actually rendered (component test ids), the selectors it offers,
 * a representative value and unit read off the screen, the source panel text,
 * the V138 change applied to it (from the change register below), and the
 * browser result - analysis state, console errors, failed responses, retries,
 * document overflow. Written as JSON, CSV and Markdown under reports/v138.
 *
 *   node scripts/v138/screen-review-v138.mjs [--build build] [--port 4332] [--only B-017,B-033]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4332"));
const ONLY = (opt("--only", "") || "").split(",").map((item) => item.trim()).filter(Boolean);
const OUT = resolve(ROOT, "reports/v138");
const SHOTS = resolve(OUT, "screenshots/detail");
mkdirSync(SHOTS, { recursive: true });

const catalog = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8"));
const review = JSON.parse(readFileSync(resolve(ROOT, "output/public-review-20260915/152-element-review.json"), "utf8"));
const reviewById = new Map(review.map((row) => [row.elementId, row]));

/**
 * What V138 changed, per screen. Screens not named here received only the
 * shared changes (policy table units and groups, indicator-family counts,
 * newest-period default, hidden raw-vocabulary filters) or none, and say so.
 */
const CHANGES = {
  "A-023": "발전소 요약을 원천 수록 행(WRI+OSM)·위치 보유·원천별 용량 합계로 분리, 연료 필터를 하나로 통합, '자료 유형' 필터 제거",
  "A-024": "지도 설명에서 '연결구조' 표현 제거(선로 경로·전압별 분포)",
  "B-003": "전체 연도(1901~2025) 추이 차트, 지역·항목 선택, 처음·마지막 연도 변화, 제약 명시; 지도 연결",
  "B-004": "기후변수 5종 × 시나리오 6종 전체 연도 추이 차트, 지역·시나리오 선택; 지도 연결",
  "B-005": "CDD·SPEI-12 전체 연도 추이 차트(방향·단위 분리), 시나리오 선택; 지도 연결",
  "B-006": "임계온도별 지표 6종 전체 연도 추이, 시나리오 선택; 지도 연결",
  "B-007": "극한강수 지표 5종 전체 연도 추이, 시나리오 선택; 지도 연결",
  "B-008": "관측소·분위 선택과 시나리오별 해수면 전망 차트(2020~2100), 처음·마지막 변화표; 지도 관측소 연결",
  "B-012": "지도 재해 사건 연결(상륙점·대표점 구분, 유형 필터)",
  "B-017": "평가구역(443)·성·시 분리, 기본 항목을 물 스트레스 원값으로 명시 계약, 단위·읽는 법, 등급별 평가구역 수, 평가구역 순위; 지도 미연결 사유 명시",
  "B-023": "지도 관측지점·유역 대표점 연결(Kratie는 캄보디아 위치 유지), 지표값 목록",
  "B-025": "지도 유역 대표점 연결(경계 미제공 명시), 면적 항목 표시",
  "B-028": "지도 관측지점 연결, m³/s·km³/년 분리",
  "B-029": "이탄지 면적 성·시 비교(순위표)와 제약; 지도 연결",
  "B-030": "누적(2000–2020) 기간 명시, 기본 항목 이득, 순위 비교; 지도 연결",
  "B-031": "지표 수를 성·시 단위로 정정(지표 63종 → 3종 · 성·시 단위)",
  "B-032": "지표 수 정정",
  "B-033": "최신연도 기본 선택, 지역 선택 시 2001~2024 전체 추이, 지표 수 정정; 지도 지역 선택 추이 유지",
  "B-034": "지표 수 정정(77종 → 지표군), 단위별 항목 분리 유지",
  "B-037": "토지피복 9개 분류 성·시 비교(순위표); 지도 연결",
  "B-039": "이론 잠재량 기본 항목·제약; 지도 연결",
  "B-040": "심도별 지온·지온경사 항목; 지도 연결",
  "B-041": "GHI·DNI·PVOUT 항목·단위; 지도 연결",
  "B-042": "고도 100m 풍속·풍력밀도 항목; 지도 연결",
  "B-048": "지도 항목 '광산 위치·광종'·단위 '곳'으로 정정(경도→1개 제거)",
  "C-001": "정책표에 구분(지표군)·단위 열 추가, 내부 검토문구 제거",
  "C-002": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-003": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-004": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-005": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-006": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-009": "지방 문서 4건 지도 연결(성·시 경계), 전국 법령은 지도 객체 없음",
  "C-010": "지방 문서 지도 연결(C-009와 동일 문서 공유)",
  "C-012": "지역별 PPP 사업 수 지도 연결(개편 후 34개 체계 → 소속 63개 경계)",
  "C-013": "지역 특별 인센티브 근거 행 지도 연결",
  "C-015": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-017": "정책표 구분·단위 열, 내부 검토문구 제거",
  "C-019": "지역별 인벤토리 대상 시설 수 지도 연결(34개 체계)",
  "C-022": "업종별 대상시설 수 지도 연결, 국가 준비도 점수는 지도화하지 않음, 내부 검토문구 제거",
  "C-024": "FCPF ERPA 참여 성 지도 연결",
  "C-025": "지도 항목 '사업 위치·유형'·단위 '건'으로 정정(소각량→1개 제거)",
  "E-004": "현지사무소 지도 연결(미설치·종료 기관 제외, 근사 위치 구분), 디렉터리에서 미설치 분리",
  "E-005": "기관 지도 연결(기관명 기준 통합)",
  "E-006": "베트남 내 거점만 지도 연결(해외 본부 제외)",
  "E-007": "정책표 내부 검토문구(CF/M02 유지 등) 제거, 구분·단위 열",
  "E-008": "원천이 부여한 CTIS 기후기술 분류로 분야 집계, 기관명 분리(도시명 제외), 국가통계 부재 명시",
  "E-018": "고유 기업 수·진출 상태(진출 확인/미진출/철수) 분리, 사업지 지도 연결",
  "E-019": "설치 사무소 우선·미설치 기관 분리, 사무소 지도 연결",
  "E-020": "지원제도(3)와 활용 사례(7) 분리",
  "E-017": "순위 행의 비교대상(국가) 라벨 유지",
};

const SHARED_CHANGE = "공통 변경만 적용(정책표 단위·구분, 지표군 수 정정, 최신연도 기본값, 원문 어휘 중복 필터 제거) 또는 변경 없음";

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();

const elements = catalog.elements
  .map((item) => item.elementId)
  .filter((id) => !ONLY.length || ONLY.includes(id))
  .sort();

const results = [];
const CONCURRENCY = 3;
const queue = [...elements];

async function reviewElement(page, elementId, attempt) {
  const errors = [];
  const failures = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 240));
  };
  const onPageError = (error) => errors.push(`pageerror: ${String(error).slice(0, 240)}`);
  const onResponse = (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  const started = Date.now();
  let state = null;
  try {
    await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForFunction(
      () => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "");
      },
      null,
      { timeout: 45000 }
    );
    // Lazy analysis components settle after the root is ready.
    await page.waitForTimeout(1500);
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="public-analysis-pending"]'),
      null,
      { timeout: 20000 }
    ).catch(() => {});
    await page.waitForTimeout(500);
    state = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      const text = (node) => (node?.innerText || "").replace(/\s+/g, " ").trim();
      const testIds = [...main.querySelectorAll("[data-testid]")]
        .map((node) => node.getAttribute("data-testid"))
        .filter(Boolean);
      const analysisIds = [...new Set(testIds.filter((id) => /analysis|summary|chart|matrix|portfolio|trend|composition|directory|station|region-scenario|registry/u.test(id)))];
      const selectors = [...main.querySelectorAll("select")].map((select) => ({
        label: (select.getAttribute("aria-label") || select.labels?.[0]?.innerText || "").replace(/\s+/g, " ").slice(0, 40),
        value: select.value,
        options: select.options.length,
      }));
      const kpi = main.querySelector('[data-portfolio-kpi], .sv125-kpi, .pav126-kpi, .rpa132-kpi, .prs138__facts');
      const firstValueCell = main.querySelector('table tbody td');
      const representative =
        text(kpi).slice(0, 160) ||
        (firstValueCell ? text(firstValueCell.parentElement).slice(0, 160) : "");
      const source = text(main.querySelector('[data-testid="public-source-panel"], .psp126, .pav126-source')).slice(0, 240);
      const heading = text(main.querySelector('[data-testid="public-data-title"]'));
      const question = text(main.querySelector('[data-testid="public-data-title"] + p'));
      const chartCount = main.querySelectorAll('svg[role="img"], [data-testid$="chart"], [data-testid$="chart-v138"], [data-testid$="chart-v132"]').length;
      return {
        analysisState: root?.getAttribute("data-analysis-state") || null,
        heading,
        question,
        analysisIds,
        selectors,
        representative,
        source,
        chartCount,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        internalPhrases: (main.innerText.match(/검토의견|CF\/M0\d|M0\d 유지|신규 수집 대신|발주처 확인 필요|재산출 가능|폴리곤 재사용|attr_\d+|1\.2_entity/gu) || []).slice(0, 5),
      };
    });
  } catch (error) {
    state = { failure: String(error).slice(0, 300) };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
  return { ...state, attempt, elapsedMs: Date.now() - started, consoleErrors: errors, httpFailures: failures };
}

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    while (queue.length) {
      const elementId = queue.shift();
      let result = await reviewElement(page, elementId, 1);
      const retries = [];
      if (result.failure) {
        retries.push({ attempt: 1, failure: result.failure });
        result = await reviewElement(page, elementId, 2);
      }
      try {
        await page.screenshot({ path: resolve(SHOTS, `${elementId}.png`), fullPage: false });
      } catch {}
      const item = catalog.elements.find((entry) => entry.elementId === elementId);
      const prior = reviewById.get(elementId);
      results.push({
        elementId,
        publicTitle: result.heading || prior?.publicTitle || item?.elementLabel,
        catalogTitle: item?.elementLabel,
        publicStatus: item?.publicStatus,
        question: result.question || "",
        analysis: result.analysisIds || [],
        selectors: result.selectors || [],
        representative: result.representative || "",
        source: result.source || "",
        chartCount: result.chartCount ?? 0,
        change: CHANGES[elementId] || SHARED_CHANGE,
        priorAction: prior?.action || "",
        browser: {
          analysisState: result.analysisState || null,
          failure: result.failure || null,
          retries,
          consoleErrors: result.consoleErrors,
          httpFailures: result.httpFailures,
          overflow: result.overflow ?? null,
          internalPhrases: result.internalPhrases || [],
          elapsedMs: result.elapsedMs,
        },
      });
      process.stdout.write(`${elementId} ${result.failure ? "FAIL" : result.analysisState} ${result.consoleErrors.length ? `console=${result.consoleErrors.length}` : ""}\n`);
    }
    await context.close();
  })
);

await browser.close();
await server.close();

results.sort((a, b) => a.elementId.localeCompare(b.elementId));
const summary = {
  screens: results.length,
  ready: results.filter((row) => row.browser.analysisState === "ready").length,
  empty: results.filter((row) => row.browser.analysisState === "empty").length,
  failed: results.filter((row) => row.browser.failure).length,
  retried: results.filter((row) => row.browser.retries.length).length,
  consoleErrorScreens: results.filter((row) => row.browser.consoleErrors.length).length,
  httpFailureScreens: results.filter((row) => row.browser.httpFailures.length).length,
  overflowScreens: results.filter((row) => row.browser.overflow).length,
  internalPhraseScreens: results.filter((row) => row.browser.internalPhrases.length).map((row) => row.elementId),
  changedScreens: results.filter((row) => CHANGES[row.elementId]).length,
};
writeFileSync(resolve(OUT, "screen-review-v138.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), build: BUILD.replace(ROOT, "."), summary, rows: results }, null, 2)}\n`);

const csvEscape = (value) => `"${String(value ?? "").replace(/"/gu, '""').replace(/\r?\n/gu, " ")}"`;
const csvHeader = ["코드", "공개명", "핵심 질문", "실제 분석(컴포넌트)", "선택항목", "대표 값·단위", "출처", "수정사항", "브라우저 확인결과"];
const csv = [
  csvHeader.map(csvEscape).join(","),
  ...results.map((row) =>
    [
      row.elementId,
      row.publicTitle,
      row.question,
      row.analysis.join(" · "),
      row.selectors.map((select) => `${select.label}(${select.options})`).join(" · "),
      row.representative,
      row.source,
      row.change,
      `${row.browser.analysisState || row.browser.failure}${row.browser.retries.length ? ` · 재시도 ${row.browser.retries.length}` : ""}${row.browser.consoleErrors.length ? ` · 콘솔 오류 ${row.browser.consoleErrors.length}` : ""}${row.browser.httpFailures.length ? ` · HTTP 실패 ${row.browser.httpFailures.length}` : ""}${row.browser.overflow ? " · 가로 넘침" : ""}${row.browser.internalPhrases.length ? ` · 내부 문구 ${row.browser.internalPhrases.join("/")}` : ""}`,
    ]
      .map(csvEscape)
      .join(",")
  ),
].join("\n");
writeFileSync(resolve(OUT, "screen-review-v138.csv"), `﻿${csv}\n`);

const md = [
  "# 152개 상세 화면 검토표 (V138, 로컬 production build)",
  "",
  `생성: ${new Date().toISOString()} · 빌드: ${BUILD.replace(ROOT, ".")} · 화면 ${summary.screens} · ready ${summary.ready} · empty ${summary.empty} · 실패 ${summary.failed} · 재시도 ${summary.retried} · 콘솔 오류 화면 ${summary.consoleErrorScreens} · HTTP 실패 화면 ${summary.httpFailureScreens} · 가로 넘침 ${summary.overflowScreens} · 내부 문구 잔존 ${summary.internalPhraseScreens.length}`,
  "",
  "초기 진입과 기본 선택 상태를 확인했으며, 모든 선택 조합을 검사한 것은 아닙니다. '브라우저 확인결과'의 ready는 분석 루트와 지연 로딩 컴포넌트가 준비된 상태를 뜻하고 내용의 의미 적합성 합격이 아닙니다.",
  "",
  "| 코드 | 공개명 | 핵심 질문 | 실제 분석 | 선택항목 | 대표 값·단위 | 출처 | 수정사항 | 브라우저 확인결과 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...results.map((row) => {
    const escape = (value) => String(value ?? "").replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
    return `| ${[
      row.elementId,
      row.publicTitle,
      row.question,
      row.analysis.join(" · "),
      row.selectors.map((select) => `${select.label}(${select.options})`).join(" · "),
      row.representative,
      row.source,
      row.change,
      `${row.browser.analysisState || row.browser.failure}${row.browser.retries.length ? ` · 재시도 ${row.browser.retries.length}` : ""}${row.browser.consoleErrors.length ? ` · 콘솔 오류 ${row.browser.consoleErrors.length}` : ""}${row.browser.httpFailures.length ? ` · HTTP 실패 ${row.browser.httpFailures.length}` : ""}${row.browser.overflow ? " · 가로 넘침" : ""}${row.browser.internalPhrases.length ? ` · 내부 문구 ${row.browser.internalPhrases.join("/")}` : ""}`,
    ].map(escape).join(" | ")} |`;
  }),
  "",
];
writeFileSync(resolve(OUT, "screen-review-v138.md"), `${md.join("\n")}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
