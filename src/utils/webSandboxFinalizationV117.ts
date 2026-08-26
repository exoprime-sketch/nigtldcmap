import {
  DATA_DETAIL_PRESENTATIONS_V117,
  DETAIL_TEMPLATE_LABELS_V117,
} from "../data/cooperation/dataDetailPresentationV117";
import type {
  DetailTemplateV117,
} from "../data/cooperation/dataDetailPresentationV117";
import {
  COOPERATION_RELEVANCE_LABELS_V117,
  DATA_ELEMENT_RELATIONS_V117,
} from "../data/cooperation/dataElementRelationsV117";
import type {
  CooperationRelevanceV117,
  RelatedEvidenceAxisV117,
} from "../data/cooperation/dataElementRelationsV117";
import { DATA_DETAIL_RUNTIME_POLICY_V117 } from "../data/cooperation/dataDetailRuntimeV117";
import { MAP_ELEMENT_AUDIT_V115 } from "../data/map/mapElementAuditV115";
import {
  runWebSandboxFinalizationV116,
} from "./webSandboxFinalizationV116";
import type {
  WebSandboxQaResultV116,
} from "./webSandboxFinalizationV116";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV117 {
  schemaVersion: "v117";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v116";
    baseline: WebSandboxQaResultV116["facts"];
    detailUx: {
      totalElements: number;
      relations: number;
      presentations: number;
      missingRelations: number;
      missingPresentations: number;
    };
    relevanceCounts: Record<CooperationRelevanceV117, number>;
    templateCounts: Record<DetailTemplateV117, number>;
    relationships: {
      invalidIds: number;
      selfRelations: number;
      duplicateRelations: number;
    };
    interpretation: {
      answersQuestion: number;
      cooperationUse: number;
      caution: number;
    };
    runtimePolicy: typeof DATA_DETAIL_RUNTIME_POLICY_V117;
  };
}

const AXES: RelatedEvidenceAxisV117[] = [
  "demand",
  "policy",
  "risk",
  "enabling",
  "projects",
  "finance",
  "partners",
  "koreaSupply",
];

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

function relevanceCounts(): Record<CooperationRelevanceV117, number> {
  return Object.fromEntries(
    (
      Object.keys(
        COOPERATION_RELEVANCE_LABELS_V117
      ) as CooperationRelevanceV117[]
    ).map((key) => [
      key,
      DATA_ELEMENT_RELATIONS_V117.filter(
        (item) => item.cooperationRelevance === key
      ).length,
    ])
  ) as Record<CooperationRelevanceV117, number>;
}

function templateCounts(): Record<DetailTemplateV117, number> {
  return Object.fromEntries(
    (Object.keys(DETAIL_TEMPLATE_LABELS_V117) as DetailTemplateV117[]).map(
      (key) => [
        key,
        DATA_DETAIL_PRESENTATIONS_V117.filter((item) => item.template === key)
          .length,
      ]
    )
  ) as Record<DetailTemplateV117, number>;
}

function relationshipAudit() {
  const validIds = new Set(
    MAP_ELEMENT_AUDIT_V115.map((item) => item.elementId)
  );
  let invalidIds = 0;
  let selfRelations = 0;
  let duplicateRelations = 0;

  DATA_ELEMENT_RELATIONS_V117.forEach((relation) => {
    AXES.forEach((axis) => {
      const ids = relation.relatedElements[axis];
      invalidIds += ids.filter((id) => !validIds.has(id)).length;
      selfRelations += ids.filter((id) => id === relation.elementId).length;
      duplicateRelations += ids.length - new Set(ids).size;
    });
  });

  return { invalidIds, selfRelations, duplicateRelations };
}

export async function runWebSandboxFinalizationV117(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV117> {
  onProgress?.("v116 기준선 확인");
  const baseline = await runWebSandboxFinalizationV116((message) =>
    onProgress?.(message)
  );
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("152개 데이터 상세 UX·관계 정의 확인");
  const elementIds = new Set(
    MAP_ELEMENT_AUDIT_V115.map((item) => item.elementId)
  );
  const relationIds = new Set(
    DATA_ELEMENT_RELATIONS_V117.map((item) => item.elementId)
  );
  const presentationIds = new Set(
    DATA_DETAIL_PRESENTATIONS_V117.map((item) => item.elementId)
  );
  const missingRelations = MAP_ELEMENT_AUDIT_V115.filter(
    (item) => !relationIds.has(item.elementId)
  );
  const missingPresentations = MAP_ELEMENT_AUDIT_V115.filter(
    (item) => !presentationIds.has(item.elementId)
  );
  const extraRelations = DATA_ELEMENT_RELATIONS_V117.filter(
    (item) => !elementIds.has(item.elementId)
  );
  const extraPresentations = DATA_DETAIL_PRESENTATIONS_V117.filter(
    (item) => !elementIds.has(item.elementId)
  );

  addCheck(
    checks,
    "v117 상세 UX",
    "V117_DETAIL_152",
    "152개 요소 상세 UX 정의",
    DATA_DETAIL_PRESENTATIONS_V117.length === 152 &&
      presentationIds.size === 152 &&
      missingPresentations.length === 0 &&
      extraPresentations.length === 0,
    `${DATA_DETAIL_PRESENTATIONS_V117.length}/152 · 누락 ${missingPresentations.length} · 초과 ${extraPresentations.length}`,
    "152/152 · 누락 0"
  );
  addCheck(
    checks,
    "v117 상세 UX",
    "V117_RELATION_152",
    "152개 요소 협력근거 관계 정의",
    DATA_ELEMENT_RELATIONS_V117.length === 152 &&
      relationIds.size === 152 &&
      missingRelations.length === 0 &&
      extraRelations.length === 0,
    `${DATA_ELEMENT_RELATIONS_V117.length}/152 · 누락 ${missingRelations.length} · 초과 ${extraRelations.length}`,
    "152/152 · 누락 0"
  );

  const relationById = new Map(
    DATA_ELEMENT_RELATIONS_V117.map((item) => [item.elementId, item] as const)
  );
  const relevanceMismatch = DATA_DETAIL_PRESENTATIONS_V117.filter(
    (item) =>
      relationById.get(item.elementId)?.cooperationRelevance !==
      item.cooperationRelevance
  );
  addCheck(
    checks,
    "v117 상세 UX",
    "V117_RELEVANCE",
    "협력기획 관련도 정의 일치",
    relevanceMismatch.length === 0 &&
      new Set(
        DATA_ELEMENT_RELATIONS_V117.map((item) => item.cooperationRelevance)
      ).size === 3,
    `불일치 ${relevanceMismatch.length} · 관련도 유형 ${
      new Set(
        DATA_ELEMENT_RELATIONS_V117.map((item) => item.cooperationRelevance)
      ).size
    }/3`,
    "불일치 0 · core/supporting/context 모두 사용"
  );

  const validTemplates = new Set(Object.keys(DETAIL_TEMPLATE_LABELS_V117));
  const invalidTemplates = DATA_DETAIL_PRESENTATIONS_V117.filter(
    (item) => !validTemplates.has(item.template)
  );
  addCheck(
    checks,
    "v117 상세 UX",
    "V117_TEMPLATE",
    "152개 primary 상세 템플릿",
    invalidTemplates.length === 0 &&
      DATA_DETAIL_PRESENTATIONS_V117.length === 152,
    `유효 ${
      DATA_DETAIL_PRESENTATIONS_V117.length - invalidTemplates.length
    }/152 · 오류 ${invalidTemplates.length}`,
    "152/152"
  );

  onProgress?.("관련 데이터 ID·해석 문구 확인");
  const relAudit = relationshipAudit();
  addCheck(
    checks,
    "v117 관계형 근거",
    "V117_REL_IDS",
    "관련 데이터 ID 무결성",
    relAudit.invalidIds === 0,
    `잘못된 ID ${relAudit.invalidIds}`,
    "0"
  );
  addCheck(
    checks,
    "v117 관계형 근거",
    "V117_REL_SELF_DUP",
    "자기참조·중복 관계 없음",
    relAudit.selfRelations === 0 && relAudit.duplicateRelations === 0,
    `자기참조 ${relAudit.selfRelations} · 동일 축 중복 ${relAudit.duplicateRelations}`,
    "0 · 0"
  );

  const answersCount = DATA_ELEMENT_RELATIONS_V117.filter(
    (item) => item.answersQuestion.trim().length > 0
  ).length;
  const useCount = DATA_ELEMENT_RELATIONS_V117.filter(
    (item) => item.cooperationUse.trim().length > 0
  ).length;
  const cautionCount = DATA_ELEMENT_RELATIONS_V117.filter(
    (item) => item.caution.trim().length > 0
  ).length;
  addCheck(
    checks,
    "v117 해석",
    "V117_INTERPRETATION",
    "질문·협력활용·해석주의 152개 정의",
    answersCount === 152 && useCount === 152 && cautionCount === 152,
    `질문 ${answersCount}/152 · 활용 ${useCount}/152 · 주의 ${cautionCount}/152`,
    "152/152 · 152/152 · 152/152"
  );

  onProgress?.("실제/예시·연도·공간·금융 무결성 정책 확인");
  addCheck(
    checks,
    "v117 실제·예시",
    "V117_SYNTHETIC_DOWNLOAD",
    "예시 데이터 다운로드 차단",
    DATA_DETAIL_RUNTIME_POLICY_V117.syntheticDownloadAllowed === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.actualSyntheticMixed === false,
    `예시 다운로드 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.syntheticDownloadAllowed
    )} · 실제/예시 혼합 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.actualSyntheticMixed
    )}`,
    "false · false"
  );
  addCheck(
    checks,
    "v117 시간 무결성",
    "V117_TEMPORAL",
    "조회 기준연도와 실제 자료연도 분리",
    DATA_DETAIL_RUNTIME_POLICY_V117.queryYearCanMasqueradeAsActual === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.latestComparisonPreservesActualYear ===
        true,
    `연도 가장 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.queryYearCanMasqueradeAsActual
    )} · 실제연도 보존 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.latestComparisonPreservesActualYear
    )}`,
    "false · true"
  );
  addCheck(
    checks,
    "v117 공간 무결성",
    "V117_SPATIAL",
    "국가자료의 가짜 지역분해 금지",
    DATA_DETAIL_RUNTIME_POLICY_V117.nationalToRegionalFabrication === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.regionalActualPreferredWhenAvailable ===
        true,
    `가짜 지역분해 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.nationalToRegionalFabrication
    )} · 실제 지역자료 우선 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.regionalActualPreferredWhenAvailable
    )}`,
    "false · true"
  );
  addCheck(
    checks,
    "v117 금융 무결성",
    "V117_FINANCE",
    "금융개념 임의 합산 없음",
    DATA_DETAIL_RUNTIME_POLICY_V117.financeConceptAggregation === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.commitmentDisbursementCombined === false,
    `금융개념 합산 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.financeConceptAggregation
    )} · 약정/지출 합산 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.commitmentDisbursementCombined
    )}`,
    "false · false"
  );
  addCheck(
    checks,
    "v117 공개 UX",
    "V117_PUBLIC_LANGUAGE",
    "협력점수·내부코드 공개 사용 없음",
    DATA_DETAIL_RUNTIME_POLICY_V117.cooperationScoreGenerated === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.internalRoleCodesPublic === false &&
      DATA_DETAIL_RUNTIME_POLICY_V117.internalQaTermsPublic === false,
    `협력점수 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.cooperationScoreGenerated
    )} · 역할코드 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.internalRoleCodesPublic
    )} · QA용어 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.internalQaTermsPublic
    )}`,
    "false · false · false"
  );
  addCheck(
    checks,
    "v117 지도 연계",
    "V117_MAP_ROUNDTRIP",
    "상세↔지도 양방향 연결 정책",
    DATA_DETAIL_RUNTIME_POLICY_V117.mapDeepLinkEnabled === true &&
      DATA_DETAIL_RUNTIME_POLICY_V117.mapDetailRoundTripEnabled === true,
    `상세→지도 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.mapDeepLinkEnabled
    )} · 지도→상세 ${String(
      DATA_DETAIL_RUNTIME_POLICY_V117.mapDetailRoundTripEnabled
    )}`,
    "true · true"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall: WebSandboxQaResultV117["overall"] =
    p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV117 = {
    schemaVersion: "v117",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v116",
      baseline: baseline.facts,
      detailUx: {
        totalElements: MAP_ELEMENT_AUDIT_V115.length,
        relations: DATA_ELEMENT_RELATIONS_V117.length,
        presentations: DATA_DETAIL_PRESENTATIONS_V117.length,
        missingRelations: missingRelations.length,
        missingPresentations: missingPresentations.length,
      },
      relevanceCounts: relevanceCounts(),
      templateCounts: templateCounts(),
      relationships: relAudit,
      interpretation: {
        answersQuestion: answersCount,
        cooperationUse: useCount,
        caution: cautionCount,
      },
      runtimePolicy: DATA_DETAIL_RUNTIME_POLICY_V117,
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V117__?: WebSandboxQaResultV117;
      }
    ).__LDC_WEB_SANDBOX_QA_V117__ = result;
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
  if (status === "PASS") return "통과";
  if (status === "WARN") return "확인";
  return "차단";
}

function overallLabel(overall: WebSandboxQaResultV117["overall"]): string {
  if (overall === "READY") return "릴리스 기준 통과";
  if (overall === "CONDITIONALLY_READY")
    return "핵심 기준 통과 · 확인항목 있음";
  return "수정 후 재검사 필요";
}

function qaStyle(): string {
  return `
      :root { color-scheme: light; font-family: Inter, Pretendard, "Noto Sans KR", Arial, sans-serif; }
      * { box-sizing: border-box; }
      body { margin:0; background:#f4f7f6; color:#10231d; }
      .qa-shell { max-width:1440px; margin:0 auto; padding:28px 22px 56px; }
      .qa-top { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
      .qa-eyebrow { font-size:12px; font-weight:800; letter-spacing:.08em; color:#2f6b57; }
      .qa-title { margin:5px 0 6px; font-size:clamp(25px,3vw,36px); }
      .qa-desc { margin:0; max-width:900px; color:#60716b; line-height:1.6; }
      .qa-actions { display:flex; flex-wrap:wrap; gap:8px; }
      .qa-button { border:1px solid #c8d6d1; background:#fff; color:#173d30; border-radius:9px; padding:10px 13px; font-weight:800; cursor:pointer; text-decoration:none; }
      .qa-button.primary { background:#145d45; border-color:#145d45; color:white; }
      .qa-banner { border:1px solid; border-radius:14px; padding:17px 19px; margin:18px 0; }
      .qa-banner.ready { background:#edf8f2; border-color:#a9d3bd; }
      .qa-banner.warn { background:#fff8e8; border-color:#ead29a; }
      .qa-banner.fail { background:#fff0ef; border-color:#e5b5b0; }
      .qa-banner strong { display:block; font-size:19px; margin-bottom:4px; }
      .qa-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:10px; margin:18px 0 24px; }
      .qa-fact { background:#fff; border:1px solid #dce5e1; border-radius:12px; padding:13px; }
      .qa-fact span { display:block; color:#687a74; font-size:11px; margin-bottom:5px; }
      .qa-fact strong { font-size:19px; }
      .qa-subtitle { margin:24px 0 8px; font-size:16px; color:#294f42; }
      .qa-table-wrap { background:#fff; border:1px solid #dce5e1; border-radius:14px; overflow:auto; }
      table { border-collapse:collapse; width:100%; min-width:1000px; }
      th,td { text-align:left; padding:11px 12px; border-bottom:1px solid #edf1ef; vertical-align:top; font-size:13px; }
      th { position:sticky; top:0; background:#f9fbfa; color:#4d625b; z-index:1; }
      .qa-status { display:inline-flex; min-width:48px; justify-content:center; border-radius:999px; padding:4px 8px; font-weight:800; font-size:11px; }
      .qa-status.PASS { background:#e6f5ed; color:#16633f; }
      .qa-status.WARN { background:#fff2ce; color:#8a5b00; }
      .qa-status.FAIL { background:#ffe4e2; color:#a12c24; }
      .qa-section { font-weight:800; color:#284c40; white-space:nowrap; }
      .qa-note { color:#64756f; line-height:1.45; max-width:470px; }
      @media(max-width:760px){ .qa-top{flex-direction:column}.qa-actions{justify-content:flex-start} }
    `;
}

function buildQaHtml(
  result: WebSandboxQaResultV117 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const dataUrl = new URL(appUrl.toString());
  dataUrl.hash = "explorer";
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
      )}</strong><span>P0 ${result.p0} · P1 ${result.p1} · ${escapeHtml(
        new Date(result.generatedAt).toLocaleString("ko-KR")
      )}</span></div>
        <h2 class="qa-subtitle">v117 데이터 상세 UX</h2>
        <div class="qa-facts">
          <div class="qa-fact"><span>상세 UX 정의</span><strong>${
            result.facts.detailUx.presentations
          }/152</strong></div>
          <div class="qa-fact"><span>관계 정의</span><strong>${
            result.facts.detailUx.relations
          }/152</strong></div>
          <div class="qa-fact"><span>협력기획 핵심</span><strong>${
            result.facts.relevanceCounts.core
          }</strong></div>
          <div class="qa-fact"><span>협력 검토자료</span><strong>${
            result.facts.relevanceCounts.supporting
          }</strong></div>
          <div class="qa-fact"><span>국가여건 참고</span><strong>${
            result.facts.relevanceCounts.context
          }</strong></div>
          <div class="qa-fact"><span>질문 정의</span><strong>${
            result.facts.interpretation.answersQuestion
          }/152</strong></div>
          <div class="qa-fact"><span>활용 정의</span><strong>${
            result.facts.interpretation.cooperationUse
          }/152</strong></div>
          <div class="qa-fact"><span>해석 주의</span><strong>${
            result.facts.interpretation.caution
          }/152</strong></div>
        </div>
        <h2 class="qa-subtitle">상세 템플릿</h2>
        <div class="qa-facts">${(
          Object.keys(DETAIL_TEMPLATE_LABELS_V117) as DetailTemplateV117[]
        )
          .map(
            (key) =>
              `<div class="qa-fact"><span>${escapeHtml(
                DETAIL_TEMPLATE_LABELS_V117[key]
              )}</span><strong>${
                result.facts.templateCounts[key]
              }</strong></div>`
          )
          .join("")}</div>
        <div class="qa-table-wrap"><table><thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead><tbody>${result.checks
          .map(
            (check) =>
              `<tr><td class="qa-section">${escapeHtml(
                check.section
              )}</td><td><span class="qa-status ${check.status}">${escapeHtml(
                statusLabel(check.status)
              )}</span></td><td><strong>${escapeHtml(
                check.label
              )}</strong><br><small>${escapeHtml(
                check.code
              )}</small></td><td>${escapeHtml(
                check.actual
              )}</td><td>${escapeHtml(
                check.expected
              )}</td><td class="qa-note">${escapeHtml(
                check.note ?? "-"
              )}</td></tr>`
          )
          .join("")}</tbody></table></div>`
    : `<div class="qa-banner ${bannerClass}"><strong>${
        error ? "검사 실행 중 오류" : "브라우저에서 검사 중"
      }</strong><span>${escapeHtml(error ?? progress)}</span></div>`;

  return `<style>${qaStyle()}</style><div class="qa-shell"><div class="qa-top"><div><span class="qa-eyebrow">INTERNAL QA · WEB SANDBOX</span><h1 class="qa-title">개도국 전략지도 릴리스 점검 v117</h1><p class="qa-desc">152개 데이터 상세 UX, 협력 활용 설명, 근거 연결, 템플릿, 실제연도·예시·공간·금융 무결성과 지도 양방향 연결 정책을 Terminal 없이 확인합니다.</p></div><div class="qa-actions"><button id="qa-rerun" class="qa-button primary" type="button">검사 다시 실행</button><button id="qa-download" class="qa-button" type="button" ${
    result ? "" : "disabled"
  }>결과 JSON 저장</button><a class="qa-button" href="${escapeHtml(
    dataUrl.toString()
  )}">데이터 찾기</a><a class="qa-button" href="${escapeHtml(
    appUrl.toString()
  )}">플랫폼으로 돌아가기</a></div></div>${content}</div>`;
}

function downloadResult(result: WebSandboxQaResultV117): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ldc-web-sandbox-qa-v117-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV117(): boolean {
  return new URLSearchParams(window.location.search).get("qa") === "1";
}

export async function mountWebSandboxQaV117(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV117 | null = null;
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
      currentResult = await runWebSandboxFinalizationV117((message) =>
        render(message)
      );
      render("검사가 완료되었습니다");
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
