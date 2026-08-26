import {
  DATA_DISPLAY_CONTRACTS_V118,
  DATA_DISPLAY_CONTRACT_SUMMARY_V118,
} from "../data/map/dataDisplayContractV118";
import { PLATFORM_IA_V118 } from "../data/platformIaV118";
import {
  PUBLIC_COPY_BANNED_VISIBLE_TERMS_V118,
  PUBLIC_COPY_DECISIONS_V118,
} from "../data/publicCopyPolicyV118";
import {
  runWebSandboxFinalizationV117,
} from "./webSandboxFinalizationV117";
import type {
  WebSandboxQaResultV117,
} from "./webSandboxFinalizationV117";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV118 {
  schemaVersion: "v118";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v117";
    baseline: WebSandboxQaResultV117["facts"];
    dataContracts: typeof DATA_DISPLAY_CONTRACT_SUMMARY_V118;
    spatialIntegrity: {
      projectPointWithoutCoordinates: number;
      actualAdminWithoutAdminField: number;
      plannedDefaultActive: boolean;
      financeAggregationAllowed: boolean;
    };
    ia: typeof PLATFORM_IA_V118;
    publicCopy: {
      bannedVisibleTerms: number;
      decisions: number;
    };
  };
}

function addCheck(
  checks: WebSandboxQaCheckV1122[],
  section: string,
  code: string,
  label: string,
  pass: boolean,
  actual: string,
  expected: string,
  note?: string,
  warnOnly = false
): void {
  checks.push({
    section,
    status: pass ? "PASS" : warnOnly ? "WARN" : "FAIL",
    code,
    label,
    actual,
    expected,
    note,
  });
}

function countStatus(
  checks: WebSandboxQaCheckV1122[],
  status: WebSandboxQaStatusV1122
): number {
  return checks.filter((item) => item.status === status).length;
}

export async function runWebSandboxFinalizationV118(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV118> {
  onProgress?.("v117 기준선 확인");
  const baseline = await runWebSandboxFinalizationV117((message) =>
    onProgress?.(message)
  );
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("152개 데이터 표시 계약 확인");
  const ids = DATA_DISPLAY_CONTRACTS_V118.map((item) => item.elementId);
  const uniqueIds = new Set(ids);
  const missingContractFields = DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) =>
      !item.expectedSource.trim() ||
      item.expectedFields.length === 0 ||
      !item.actualSpatialResolution ||
      !item.expectedSpatialResolution ||
      !item.displaySurface
  );

  addCheck(
    checks,
    "v118 데이터 계약",
    "V118_CONTRACT_152",
    "152개 Data Display Contract",
    DATA_DISPLAY_CONTRACTS_V118.length === 152 && uniqueIds.size === 152,
    `${DATA_DISPLAY_CONTRACTS_V118.length}/152 · 고유 ID ${uniqueIds.size}`,
    "152/152 · 고유 ID 152"
  );
  addCheck(
    checks,
    "v118 데이터 계약",
    "V118_CONTRACT_FIELDS",
    "출처·필드·공간단위·표시면 정의",
    missingContractFields.length === 0,
    `누락 ${missingContractFields.length}`,
    "0"
  );

  const projectPointWithoutCoordinates = DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) =>
      item.actualDataStatus !== "planned" &&
      item.dataShape === "project" &&
      /실제 위치|point/i.test(item.recommendedMapUse) &&
      (!item.geographicFields.latitude || !item.geographicFields.longitude)
  ).length;
  const actualAdminWithoutAdminField = DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) =>
      item.actualDataStatus !== "planned" &&
      item.actualSpatialResolution === "admin1" &&
      !item.geographicFields.admin1Code
  ).length;

  addCheck(
    checks,
    "v118 공간 무결성",
    "V118_NO_FAKE_POINT",
    "위치필드 없는 사업의 point 표현 없음",
    projectPointWithoutCoordinates === 0,
    `${projectPointWithoutCoordinates}건`,
    "0건"
  );
  addCheck(
    checks,
    "v118 공간 무결성",
    "V118_NO_FAKE_ADMIN",
    "국가자료의 임의 지역화 없음",
    actualAdminWithoutAdminField === 0 &&
      PLATFORM_IA_V118.mapPolicy.fakeRegionalizationAllowed === false,
    `불일치 ${actualAdminWithoutAdminField} · 가짜 지역화 ${String(
      PLATFORM_IA_V118.mapPolicy.fakeRegionalizationAllowed
    )}`,
    "0 · false"
  );
  addCheck(
    checks,
    "v118 데이터 무결성",
    "V118_TRANSFORM_RULES",
    "null·금융개념·기술분류 보존",
    DATA_DISPLAY_CONTRACTS_V118.every(
      (item) =>
        item.prohibitedTransformations.some((rule) => rule.includes("null")) &&
        item.prohibitedTransformations.some((rule) =>
          rule.includes("금융개념")
        ) &&
        item.prohibitedTransformations.some((rule) => rule.includes("기후기술"))
    ),
    "152개 금지규칙 정의",
    "152/152"
  );

  onProgress?.("데이터 찾기·지도·다운로드 역할 분리 확인");
  const ia = PLATFORM_IA_V118.downloadPolicy;
  addCheck(
    checks,
    "v118 IA",
    "V118_DOWNLOAD_HUB",
    "구조화 데이터 다운로드 단일 허브",
    ia.officialSurface === "download" &&
      ia.detailGeneratesFiles === false &&
      ia.mapGeneratesFiles === false &&
      ia.searchGeneratesFiles === false,
    `허브 ${ia.officialSurface} · 상세 ${String(
      ia.detailGeneratesFiles
    )} · 지도 ${String(ia.mapGeneratesFiles)} · 검색 ${String(
      ia.searchGeneratesFiles
    )}`,
    "download · false · false · false"
  );
  addCheck(
    checks,
    "v118 IA",
    "V118_DOWNLOAD_CONTEXT",
    "상세·지도 선택상태 다운로드 허브 전달",
    ia.detailPrefillsContext && ia.mapPrefillsContext,
    `상세 ${String(ia.detailPrefillsContext)} · 지도 ${String(
      ia.mapPrefillsContext
    )}`,
    "true · true"
  );

  addCheck(
    checks,
    "v118 공개 UX",
    "V118_PUBLIC_COPY_POLICY",
    "설계·개발자식 설명문 일반화면 비노출 정책",
    PUBLIC_COPY_BANNED_VISIBLE_TERMS_V118.length >= 10 &&
      PUBLIC_COPY_DECISIONS_V118.length > 0,
    `금지표현 ${PUBLIC_COPY_BANNED_VISIBLE_TERMS_V118.length} · 판정 ${PUBLIC_COPY_DECISIONS_V118.length}`,
    "금지표현 정책 및 판정표 존재"
  );
  addCheck(
    checks,
    "v118 지도",
    "V118_PLANNED_OPT_IN",
    "제공 예정·예시 데이터 기본 비활성",
    PLATFORM_IA_V118.mapPolicy.syntheticDefaultActive === false &&
      PLATFORM_IA_V118.mapPolicy.syntheticRankingAllowed === false,
    `기본활성 ${String(
      PLATFORM_IA_V118.mapPolicy.syntheticDefaultActive
    )} · 예시순위 ${String(
      PLATFORM_IA_V118.mapPolicy.syntheticRankingAllowed
    )}`,
    "false · false"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall: WebSandboxQaResultV118["overall"] =
    p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV118 = {
    schemaVersion: "v118",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v117",
      baseline: baseline.facts,
      dataContracts: DATA_DISPLAY_CONTRACT_SUMMARY_V118,
      spatialIntegrity: {
        projectPointWithoutCoordinates,
        actualAdminWithoutAdminField,
        plannedDefaultActive: PLATFORM_IA_V118.mapPolicy.syntheticDefaultActive,
        financeAggregationAllowed:
          PLATFORM_IA_V118.mapPolicy.financeConceptAggregationAllowed,
      },
      ia: PLATFORM_IA_V118,
      publicCopy: {
        bannedVisibleTerms: PUBLIC_COPY_BANNED_VISIBLE_TERMS_V118.length,
        decisions: PUBLIC_COPY_DECISIONS_V118.length,
      },
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V118__?: WebSandboxQaResultV118;
      }
    ).__LDC_WEB_SANDBOX_QA_V118__ = result;
  }
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(status: WebSandboxQaStatusV1122): string {
  return status === "PASS" ? "통과" : status === "WARN" ? "확인" : "차단";
}

function overallLabel(overall: WebSandboxQaResultV118["overall"]): string {
  if (overall === "READY") return "릴리스 기준 통과";
  if (overall === "CONDITIONALLY_READY")
    return "핵심 기준 통과 · 확인항목 있음";
  return "수정 후 재검사 필요";
}

function qaStyle(): string {
  return `
      :root { color-scheme:light; font-family:Inter,Pretendard,"Noto Sans KR",Arial,sans-serif; }
      * { box-sizing:border-box; }
      body { margin:0; background:#f4f7f6; color:#10231d; }
      .qa-shell { max-width:1440px; margin:0 auto; padding:28px 22px 56px; }
      .qa-top { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
      .qa-title { margin:4px 0 6px; font-size:32px; }
      .qa-desc { margin:0; color:#62736d; line-height:1.55; max-width:850px; }
      .qa-actions { display:flex; flex-wrap:wrap; gap:8px; }
      .qa-button { border:1px solid #cbd8d3; background:#fff; color:#173d30; border-radius:9px; padding:9px 12px; font-weight:800; cursor:pointer; text-decoration:none; }
      .qa-button.primary { background:#145d45; border-color:#145d45; color:#fff; }
      .qa-banner { margin:18px 0; padding:16px 18px; border:1px solid; border-radius:13px; }
      .qa-banner.ready { background:#edf8f2; border-color:#abd4bf; }
      .qa-banner.warn { background:#fff8e8; border-color:#ead29a; }
      .qa-banner.fail { background:#fff0ef; border-color:#e5b5b0; }
      .qa-banner strong { display:block; font-size:18px; margin-bottom:4px; }
      .qa-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:9px; margin:18px 0; }
      .qa-fact { background:#fff; border:1px solid #dce5e1; border-radius:11px; padding:12px; }
      .qa-fact span { display:block; color:#697a74; font-size:10px; margin-bottom:4px; }
      .qa-fact strong { font-size:18px; }
      .qa-table { overflow:auto; background:#fff; border:1px solid #dce5e1; border-radius:13px; }
      table { border-collapse:collapse; width:100%; min-width:980px; }
      th,td { padding:10px 11px; border-bottom:1px solid #edf1ef; text-align:left; vertical-align:top; font-size:12px; }
      th { background:#f9fbfa; color:#52655e; }
      .qa-status { display:inline-flex; min-width:46px; justify-content:center; border-radius:999px; padding:3px 7px; font-weight:800; font-size:10px; }
      .qa-status.PASS { background:#e6f5ed; color:#16633f; }
      .qa-status.WARN { background:#fff2ce; color:#8a5b00; }
      .qa-status.FAIL { background:#ffe4e2; color:#a12c24; }
      @media(max-width:760px){ .qa-top{flex-direction:column} }
    `;
}

function buildQaHtml(
  result: WebSandboxQaResultV118 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const bannerClass = !result
    ? "warn"
    : result.overall === "READY"
    ? "ready"
    : result.overall === "CONDITIONALLY_READY"
    ? "warn"
    : "fail";
  const content = result
    ? `
      <div class="qa-banner ${bannerClass}"><strong>${escapeHtml(
        overallLabel(result.overall)
      )}</strong><span>P0 ${result.p0} · P1 ${result.p1}</span></div>
      <div class="qa-facts">
        <div class="qa-fact"><span>Data Display Contract</span><strong>${
          result.facts.dataContracts.total
        }/152</strong></div>
        <div class="qa-fact"><span>현재 제공</span><strong>${
          result.facts.dataContracts.available
        }</strong></div>
        <div class="qa-fact"><span>일부 제공</span><strong>${
          result.facts.dataContracts.partial
        }</strong></div>
        <div class="qa-fact"><span>제공 예정</span><strong>${
          result.facts.dataContracts.planned
        }</strong></div>
        <div class="qa-fact"><span>위치 없는 사업 point</span><strong>${
          result.facts.spatialIntegrity.projectPointWithoutCoordinates
        }</strong></div>
        <div class="qa-fact"><span>가짜 지역화</span><strong>${
          result.facts.spatialIntegrity.actualAdminWithoutAdminField
        }</strong></div>
      </div>
      <div class="qa-table"><table><thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead><tbody>${result.checks
        .map(
          (check) =>
            `<tr><td>${escapeHtml(
              check.section
            )}</td><td><span class="qa-status ${check.status}">${escapeHtml(
              statusLabel(check.status)
            )}</span></td><td><strong>${escapeHtml(
              check.label
            )}</strong><br><small>${escapeHtml(
              check.code
            )}</small></td><td>${escapeHtml(check.actual)}</td><td>${escapeHtml(
              check.expected
            )}</td><td>${escapeHtml(check.note ?? "-")}</td></tr>`
        )
        .join("")}</tbody></table></div>`
    : `<div class="qa-banner ${bannerClass}"><strong>${
        error ? "검사 실행 중 오류" : "브라우저에서 검사 중"
      }</strong><span>${escapeHtml(error ?? progress)}</span></div>`;
  return `<style>${qaStyle()}</style><div class="qa-shell"><div class="qa-top"><div><small>INTERNAL QA · WEB SANDBOX</small><h1 class="qa-title">개도국 전략지도 릴리스 점검 v118</h1><p class="qa-desc">152개 데이터 표시 계약, 지도 공간 무결성, 데이터 찾기·지도·다운로드 역할 분리와 공개 UX 정책을 확인합니다.</p></div><div class="qa-actions"><button id="qa-rerun" class="qa-button primary">검사 다시 실행</button><button id="qa-download" class="qa-button" ${
    result ? "" : "disabled"
  }>결과 JSON 저장</button><a class="qa-button" href="${escapeHtml(
    appUrl.toString()
  )}">플랫폼으로 돌아가기</a></div></div>${content}</div>`;
}

function downloadResult(result: WebSandboxQaResultV118): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ldc-web-sandbox-qa-v118-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV118(): boolean {
  return new URLSearchParams(window.location.search).get("qa") === "1";
}

export async function mountWebSandboxQaV118(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV118 | null = null;
  let running = false;
  const render = (
    progress = "검사를 준비하고 있습니다",
    error: string | null = null
  ) => {
    root.innerHTML = buildQaHtml(currentResult, progress, error);
    const rerun = document.getElementById(
      "qa-rerun"
    ) as HTMLButtonElement | null;
    const download = document.getElementById(
      "qa-download"
    ) as HTMLButtonElement | null;
    if (rerun) {
      rerun.disabled = running;
      rerun.addEventListener("click", () => void execute());
    }
    if (download && currentResult)
      download.addEventListener("click", () => downloadResult(currentResult!));
  };
  const execute = async () => {
    if (running) return;
    running = true;
    currentResult = null;
    render("검사를 시작합니다");
    try {
      currentResult = await runWebSandboxFinalizationV118((message) =>
        render(message)
      );
    } catch (error) {
      render(
        "검사가 중단되었습니다",
        error instanceof Error ? error.message : "알 수 없는 검사 오류"
      );
    } finally {
      running = false;
      render(
        currentResult ? "검사가 완료되었습니다" : "검사 결과를 확인하세요"
      );
    }
  };
  render();
  await execute();
}
