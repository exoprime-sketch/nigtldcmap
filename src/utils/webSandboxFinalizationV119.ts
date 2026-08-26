import {
  PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V119,
  PUBLIC_DETAIL_COMMON_UI_COPY_V119,
  PUBLIC_DETAIL_COPY_DEFINITIONS_V119,
  PUBLIC_DETAIL_COPY_SUMMARY_V119,
  PUBLIC_DETAIL_RUNTIME_POLICY_V119,
} from "../data/cooperation/publicDetailCopyV119";
import { DATA_DISPLAY_CONTRACT_INDEX_V118 } from "../data/map/dataDisplayContractV118";
import {
  runWebSandboxFinalizationV118,
} from "./webSandboxFinalizationV118";
import type {
  WebSandboxQaResultV118,
} from "./webSandboxFinalizationV118";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV119 {
  schemaVersion: "v119";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v118";
    baseline: WebSandboxQaResultV118["facts"];
    publicDetailCopy: typeof PUBLIC_DETAIL_COPY_SUMMARY_V119 & {
      uniqueIds: number;
      missingQuestions: number;
      unsupportedSpatialQuestions: number;
      invalidMapActions: number;
      plannedDownloadActions: number;
      bannedTermsInPublicCopy: number;
    };
    runtimePolicy: typeof PUBLIC_DETAIL_RUNTIME_POLICY_V119;
  };
}

const SPATIAL_LANGUAGE =
  /(어디에|어디서|어디이며|어디인가|입지|위치(?:\s*분포)?|분포|지역별|계통연계\s*지점|전환대상\s*위치)/;

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

function contractHasActualSpatialField(elementId: string): boolean {
  const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(elementId);
  if (!contract || contract.actualDataStatus === "planned") return false;
  return Boolean(
    contract.geographicFields.countryIso3 ||
      contract.geographicFields.admin1Code ||
      contract.geographicFields.admin2Code ||
      contract.geographicFields.latitude ||
      contract.geographicFields.longitude ||
      contract.geographicFields.geometry ||
      contract.geographicFields.gridId ||
      contract.geographicFields.basinId ||
      contract.geographicFields.corridorId
  );
}

function contractHasDetailedSpatialField(elementId: string): boolean {
  const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(elementId);
  if (!contract || contract.actualDataStatus === "planned") return false;
  return Boolean(
    contract.geographicFields.admin1Code ||
      contract.geographicFields.admin2Code ||
      contract.geographicFields.latitude ||
      contract.geographicFields.longitude ||
      contract.geographicFields.geometry ||
      contract.geographicFields.gridId ||
      contract.geographicFields.basinId ||
      contract.geographicFields.corridorId
  );
}

export async function runWebSandboxFinalizationV119(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV119> {
  onProgress?.("v118 기준선 확인");
  const baseline = await runWebSandboxFinalizationV118((message) =>
    onProgress?.(message)
  );
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("152개 공개 상세문구 확인");
  const ids = PUBLIC_DETAIL_COPY_DEFINITIONS_V119.map((item) => item.elementId);
  const uniqueIds = new Set(ids);
  const missingQuestions = PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => !item.publicQuestion.trim() || item.supportFields.length === 0
  );
  const unsupportedSpatialQuestions =
    PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
      (item) =>
        SPATIAL_LANGUAGE.test(item.publicQuestion) &&
        !contractHasDetailedSpatialField(item.elementId)
    );
  const invalidMapActions = PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => {
      if (!item.showMapAction) return false;
      const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(item.elementId);
      return (
        !contract ||
        contract.actualDataStatus === "planned" ||
        !contractHasActualSpatialField(item.elementId) ||
        !["map-primary", "map-overlay"].includes(contract.displaySurface)
      );
    }
  );
  const plannedDownloadActions = PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => {
      const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(item.elementId);
      return (
        item.showDownloadAction && contract?.actualDataStatus === "planned"
      );
    }
  );

  const visibleCopyText = [
    ...PUBLIC_DETAIL_COMMON_UI_COPY_V119,
    ...PUBLIC_DETAIL_COPY_DEFINITIONS_V119.flatMap((item) => [
      item.publicQuestion,
      item.compactUseNote ?? "",
      item.compactCaution ?? "",
      item.analysisTitle,
      item.expectedInformation,
    ]),
  ].join("\n");
  const bannedTermsInPublicCopy =
    PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V119.filter((term) =>
      visibleCopyText.includes(term)
    );

  addCheck(
    checks,
    "v119 공개 상세 UX",
    "V119_PUBLIC_COPY_152",
    "152개 공개 상세문구 정의",
    PUBLIC_DETAIL_COPY_DEFINITIONS_V119.length === 152 &&
      uniqueIds.size === 152,
    `${PUBLIC_DETAIL_COPY_DEFINITIONS_V119.length}/152 · 고유 ID ${uniqueIds.size}`,
    "152/152 · 고유 ID 152"
  );
  addCheck(
    checks,
    "v119 공개 상세 UX",
    "V119_PUBLIC_QUESTIONS",
    "질문·지원필드 누락 없음",
    missingQuestions.length === 0,
    `누락 ${missingQuestions.length}`,
    "0"
  );
  addCheck(
    checks,
    "v119 공간문구",
    "V119_SPATIAL_COPY_INTEGRITY",
    "실제 공간필드 없는 위치·분포 질문 없음",
    unsupportedSpatialQuestions.length === 0,
    `${unsupportedSpatialQuestions.length}건`,
    "0건",
    unsupportedSpatialQuestions.length
      ? unsupportedSpatialQuestions.map((item) => item.elementId).join(", ")
      : undefined
  );
  addCheck(
    checks,
    "v119 지도 CTA",
    "V119_MAP_ACTION_CONTRACT",
    "지도 버튼과 실제 지도계약 일치",
    invalidMapActions.length === 0,
    `${invalidMapActions.length}건`,
    "0건"
  );
  addCheck(
    checks,
    "v119 다운로드",
    "V119_NO_PLANNED_DOWNLOAD",
    "제공 예정 데이터 다운로드 버튼 없음",
    plannedDownloadActions.length === 0,
    `${plannedDownloadActions.length}건`,
    "0건"
  );
  addCheck(
    checks,
    "v119 공개문구",
    "V119_BANNED_COPY",
    "내부 기획·절차 문구 일반화면 비노출",
    bannedTermsInPublicCopy.length === 0,
    `${bannedTermsInPublicCopy.length}건`,
    "0건",
    bannedTermsInPublicCopy.join(" · ") || undefined
  );

  const auditPolicyPass = PUBLIC_DETAIL_COPY_DEFINITIONS_V119.every(
    (item) =>
      item.audit.roleBadges === "REMOVE" &&
      item.audit.decisionFlow === "INTERNAL_ONLY" &&
      item.audit.spatialCard !== "KEEP"
  );
  addCheck(
    checks,
    "v119 정보밀도",
    "V119_COMPACT_STRUCTURE",
    "대형 역할·흐름·공간카드 제거정책",
    auditPolicyPass &&
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.largeGenericGuidanceBeforeData ===
        false &&
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.independentSpatialCardPublic === false,
    `정책 ${String(auditPolicyPass)} · 대형안내 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.largeGenericGuidanceBeforeData
    )} · 공간카드 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.independentSpatialCardPublic
    )}`,
    "true · false · false"
  );
  addCheck(
    checks,
    "v119 데이터 상태",
    "V119_PENDING_SAFETY",
    "준비 중 화면의 가짜값·순위·직접 다운로드 차단",
    PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedSyntheticValuesPublic === false &&
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedSyntheticRankingPublic ===
        false &&
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedDirectDownloadPublic === false,
    `값 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedSyntheticValuesPublic
    )} · 순위 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedSyntheticRankingPublic
    )} · 다운로드 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.plannedDirectDownloadPublic
    )}`,
    "false · false · false"
  );
  addCheck(
    checks,
    "v119 IA",
    "V119_DETAIL_ACTIONS",
    "관련 데이터 route·다운로드 허브 유지",
    PUBLIC_DETAIL_RUNTIME_POLICY_V119.relatedDataUsesExistingElementRoute &&
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.downloadUsesDedicatedHub,
    `관련 route ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.relatedDataUsesExistingElementRoute
    )} · 다운로드 허브 ${String(
      PUBLIC_DETAIL_RUNTIME_POLICY_V119.downloadUsesDedicatedHub
    )}`,
    "true · true"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall: WebSandboxQaResultV119["overall"] =
    p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV119 = {
    schemaVersion: "v119",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v118",
      baseline: baseline.facts,
      publicDetailCopy: {
        ...PUBLIC_DETAIL_COPY_SUMMARY_V119,
        uniqueIds: uniqueIds.size,
        missingQuestions: missingQuestions.length,
        unsupportedSpatialQuestions: unsupportedSpatialQuestions.length,
        invalidMapActions: invalidMapActions.length,
        plannedDownloadActions: plannedDownloadActions.length,
        bannedTermsInPublicCopy: bannedTermsInPublicCopy.length,
      },
      runtimePolicy: PUBLIC_DETAIL_RUNTIME_POLICY_V119,
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V119__?: WebSandboxQaResultV119;
      }
    ).__LDC_WEB_SANDBOX_QA_V119__ = result;
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

function overallLabel(overall: WebSandboxQaResultV119["overall"]): string {
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
  result: WebSandboxQaResultV119 | null,
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
        <div class="qa-fact"><span>공개 상세문구</span><strong>${
          result.facts.publicDetailCopy.total
        }/152</strong></div>
        <div class="qa-fact"><span>지도 CTA</span><strong>${
          result.facts.publicDetailCopy.mapActions
        }</strong></div>
        <div class="qa-fact"><span>다운로드 CTA</span><strong>${
          result.facts.publicDetailCopy.downloadActions
        }</strong></div>
        <div class="qa-fact"><span>활용 참고</span><strong>${
          result.facts.publicDetailCopy.useNotes
        }</strong></div>
        <div class="qa-fact"><span>공간문구 오류</span><strong>${
          result.facts.publicDetailCopy.unsupportedSpatialQuestions
        }</strong></div>
        <div class="qa-fact"><span>금지문구</span><strong>${
          result.facts.publicDetailCopy.bannedTermsInPublicCopy
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
  return `<style>${qaStyle()}</style><div class="qa-shell"><div class="qa-top"><div><small>INTERNAL QA · WEB SANDBOX</small><h1 class="qa-title">개도국 전략지도 릴리스 점검 v119</h1><p class="qa-desc">152개 공개 상세문구, 공간문구와 지도·다운로드 CTA, 준비 중 화면의 데이터 안전성과 정보밀도를 확인합니다.</p></div><div class="qa-actions"><button id="qa-rerun" class="qa-button primary">검사 다시 실행</button><button id="qa-download" class="qa-button" ${
    result ? "" : "disabled"
  }>결과 JSON 저장</button><a class="qa-button" href="${escapeHtml(
    appUrl.toString()
  )}">플랫폼으로 돌아가기</a></div></div>${content}</div>`;
}

function downloadResult(result: WebSandboxQaResultV119): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ldc-web-sandbox-qa-v119-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV119(): boolean {
  return new URLSearchParams(window.location.search).get("qa") === "1";
}

export async function mountWebSandboxQaV119(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV119 | null = null;
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
    if (download && currentResult) {
      download.addEventListener("click", () => downloadResult(currentResult!));
    }
  };
  const execute = async () => {
    if (running) return;
    running = true;
    currentResult = null;
    render("검사를 시작합니다");
    try {
      currentResult = await runWebSandboxFinalizationV119((message) =>
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
