import {
  MAP_ELEMENT_AUDIT_V115,
  MAP_ELEMENT_COVERAGE_V115,
} from "../data/map/mapElementAuditV115";
import {
  COOPERATION_DECISION_ROLE_LABELS_V116,
  MAP_ELEMENT_DECISIONS_V116,
  MAP_ELEMENT_DECISION_INDEX_V116,
} from "../data/map/mapElementDecisionV116";
import type {
  CooperationDecisionRoleV116,
} from "../data/map/mapElementDecisionV116";
import {
  MAP_LAYER_REGISTRY_V116,
  MAP_PRESET_DEFAULTS_V116,
  MAP_PRESETS_V116,
  getMapCatalogRowsV116,
} from "../data/map/mapLayerRegistryV116";
import {
  MAP_VISUAL_ENCODINGS_V116,
  MAP_VISUAL_ENCODING_INDEX_V116,
  SUPPORT_SYMBOLS_V116,
} from "../data/map/mapVisualEncodingV116";
import {
  MAP_LAYER_IDS_RUNTIME_V116,
  MAP_RUNTIME_POLICY_V116,
  MAP_SOURCE_IDS_RUNTIME_V116,
} from "../data/map/mapRuntimeContractsV116";
import { isRegionalResolutionV116 } from "../types/spatialDataV116";
import {
  runWebSandboxFinalizationV115,
} from "./webSandboxFinalizationV115";
import type {
  WebSandboxQaResultV115,
} from "./webSandboxFinalizationV115";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV116 {
  schemaVersion: "v116";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v115";
    baseline: WebSandboxQaResultV115["facts"];
    decisionRoles: Record<CooperationDecisionRoleV116, number>;
    visualEncoding: {
      elements: number;
      coreElements: number;
      defaultIntegratedElements: number;
      legendSpecs: number;
    };
    spatialCoverage: {
      country: number;
      admin1: number;
      admin2: number;
      facility: number;
      grid: number;
      basin: number;
      corridor: number;
      nonSpatial: number;
      regionalPreferred: number;
      regionalActual: number;
      regionalSyntheticPrototype: number;
    };
    integratedView: {
      preset: string;
      baseElementId: string | null;
      activeElements: string[];
      supportSymbols: number;
      policyStateViaDemandBorder: boolean;
      financeViaOdaHalo: boolean;
    };
    runtime: {
      layers: number;
      sources: number;
      subnationalBoundaryProvider: string;
      actualLocationElements: number;
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

function roleCounts(): Record<CooperationDecisionRoleV116, number> {
  const result = Object.fromEntries(
    (
      Object.keys(
        COOPERATION_DECISION_ROLE_LABELS_V116
      ) as CooperationDecisionRoleV116[]
    ).map((role) => [role, 0])
  ) as Record<CooperationDecisionRoleV116, number>;
  MAP_ELEMENT_DECISIONS_V116.forEach((row) => {
    row.cooperationDecisionRoles.forEach((role) => {
      result[role] += 1;
    });
  });
  return result;
}

function spatialCounts() {
  const counts = {
    country: 0,
    admin1: 0,
    admin2: 0,
    facility: 0,
    grid: 0,
    basin: 0,
    corridor: 0,
    nonSpatial: 0,
    regionalPreferred: 0,
    regionalActual: 0,
    regionalSyntheticPrototype: 0,
  };
  MAP_ELEMENT_DECISIONS_V116.forEach((row) => {
    if (row.actualResolution === "non-spatial") counts.nonSpatial += 1;
    else if (row.actualResolution === "country") counts.country += 1;
    else if (row.actualResolution === "admin1") counts.admin1 += 1;
    else if (row.actualResolution === "admin2") counts.admin2 += 1;
    else if (row.actualResolution === "facility") counts.facility += 1;
    else if (row.actualResolution === "grid") counts.grid += 1;
    else if (row.actualResolution === "basin") counts.basin += 1;
    else if (row.actualResolution === "corridor") counts.corridor += 1;

    if (isRegionalResolutionV116(row.preferredResolution)) {
      counts.regionalPreferred += 1;
      if (!isRegionalResolutionV116(row.actualResolution)) {
        const audit = MAP_ELEMENT_AUDIT_V115.find(
          (item) => item.elementId === row.elementId
        );
        if (audit?.mockAllowed) counts.regionalSyntheticPrototype += 1;
      }
    }
    if (isRegionalResolutionV116(row.actualResolution))
      counts.regionalActual += 1;
  });
  return counts;
}

export async function runWebSandboxFinalizationV116(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV116> {
  onProgress?.("v115 기준선 확인");
  const baseline = await runWebSandboxFinalizationV115((message) =>
    onProgress?.(message)
  );
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("152개 협력 의사결정 역할·공간해상도 확인");
  const auditIds = new Set(MAP_ELEMENT_AUDIT_V115.map((row) => row.elementId));
  const decisionIds = new Set(
    MAP_ELEMENT_DECISIONS_V116.map((row) => row.elementId)
  );
  const missingDecision = MAP_ELEMENT_AUDIT_V115.filter(
    (row) => !decisionIds.has(row.elementId)
  );
  const extraDecision = MAP_ELEMENT_DECISIONS_V116.filter(
    (row) => !auditIds.has(row.elementId)
  );
  const emptyRoles = MAP_ELEMENT_DECISIONS_V116.filter(
    (row) => row.cooperationDecisionRoles.length === 0
  );
  const emptyRationale = MAP_ELEMENT_DECISIONS_V116.filter(
    (row) => !row.spatialRationale.trim() || !row.curatedReason.trim()
  );

  addCheck(
    checks,
    "v116 152개 재분류",
    "V116_DECISION_152",
    "152개 요소 협력 의사결정 역할 판정",
    MAP_ELEMENT_DECISIONS_V116.length === 152 &&
      decisionIds.size === 152 &&
      missingDecision.length === 0 &&
      extraDecision.length === 0,
    `${MAP_ELEMENT_DECISIONS_V116.length}/152 · 누락 ${missingDecision.length} · 초과 ${extraDecision.length}`,
    "152/152 · 미판정 0"
  );
  addCheck(
    checks,
    "v116 152개 재분류",
    "V116_DECISION_ROLES",
    "모든 요소에 협력 의사결정 역할 존재",
    emptyRoles.length === 0,
    `역할 누락 ${emptyRoles.length}`,
    "0"
  );
  addCheck(
    checks,
    "v116 152개 재분류",
    "V116_SPATIAL_RATIONALE",
    "모든 요소에 공간해상도·선정사유 존재",
    emptyRationale.length === 0 &&
      MAP_ELEMENT_DECISIONS_V116.every(
        (row) =>
          Boolean(row.actualResolution) && Boolean(row.preferredResolution)
      ),
    `사유 누락 ${emptyRationale.length}`,
    "0"
  );

  onProgress?.("Visual Encoding Specification 확인");
  const encodingIds = new Set(
    MAP_VISUAL_ENCODINGS_V116.map((row) => row.elementId)
  );
  const missingEncoding = MAP_ELEMENT_DECISIONS_V116.filter(
    (row) => !encodingIds.has(row.elementId)
  );
  const incompleteEncoding = MAP_VISUAL_ENCODINGS_V116.filter(
    (row) =>
      !row.colorMeaning.trim() ||
      !row.opacityMeaning.trim() ||
      !row.noDataTreatment.trim() ||
      !row.zeroTreatment.trim() ||
      !row.syntheticTreatment.trim() ||
      !row.hoverTemplate.trim() ||
      !row.clickAction.trim()
  );
  const sizeRoleMissing = MAP_VISUAL_ENCODINGS_V116.filter(
    (row) =>
      row.encodingRole === "bubble" && /사용하지 않음/.test(row.sizeMeaning)
  );
  const shapeRoleMissing = MAP_VISUAL_ENCODINGS_V116.filter(
    (row) =>
      ["symbol", "point"].includes(row.encodingRole) &&
      /사용하지 않음/.test(row.shapeMeaning)
  );
  const flowRoleMissing = MAP_VISUAL_ENCODINGS_V116.filter(
    (row) =>
      row.encodingRole === "flow" && /사용하지 않음/.test(row.lineMeaning)
  );
  const demandEncoding = MAP_VISUAL_ENCODING_INDEX_V116.get("C-005");

  addCheck(
    checks,
    "v116 시각문법",
    "V116_ENCODING_152",
    "152개 요소 Visual Encoding Specification",
    MAP_VISUAL_ENCODINGS_V116.length === 152 &&
      encodingIds.size === 152 &&
      missingEncoding.length === 0,
    `${MAP_VISUAL_ENCODINGS_V116.length}/152 · 누락 ${missingEncoding.length}`,
    "152/152"
  );
  addCheck(
    checks,
    "v116 시각문법",
    "V116_ENCODING_COMPLETE",
    "색·크기·형태·선·no data·예시 처리 의미 정의",
    incompleteEncoding.length === 0 &&
      sizeRoleMissing.length === 0 &&
      shapeRoleMissing.length === 0 &&
      flowRoleMissing.length === 0,
    `기본필드 ${incompleteEncoding.length} · 크기 ${sizeRoleMissing.length} · 형태 ${shapeRoleMissing.length} · 흐름 ${flowRoleMissing.length}`,
    "누락 0"
  );
  addCheck(
    checks,
    "v116 시각문법",
    "V116_DEMAND_ENCODING",
    "기술수요 크기와 정책현재성 테두리 의미 분리",
    Boolean(demandEncoding) &&
      /면적/.test(demandEncoding?.sizeMeaning ?? "") &&
      !/사용하지 않음/.test(demandEncoding?.borderMeaning ?? ""),
    demandEncoding
      ? `크기: ${demandEncoding.sizeMeaning} · 테두리: ${demandEncoding.borderMeaning}`
      : "정의 없음",
    "크기=수요량 · 테두리=정책현재성"
  );

  onProgress?.("핵심 협력기획 통합뷰 확인");
  const integrated = MAP_PRESET_DEFAULTS_V116["핵심 협력기획 보기"];
  const integratedSet = new Set(integrated.elementIds);
  const expectedIntegrated = [
    "C-005",
    "D-019",
    "D-020",
    "D-018",
    "D-023",
    "D-021",
    "D-011",
  ];
  const missingIntegrated = expectedIntegrated.filter(
    (elementId) => !integratedSet.has(elementId)
  );
  const coreRows = MAP_ELEMENT_DECISIONS_V116.filter(
    (row) => row.visualPriority === "core"
  );

  addCheck(
    checks,
    "v116 핵심 통합뷰",
    "V116_INTEGRATED_CHANNELS",
    "문제·수요·정책·사업·ODA 채널 동시 구성",
    integrated.baseElementId === "B-006" && missingIntegrated.length === 0,
    `base ${integrated.baseElementId ?? "없음"} · 핵심 누락 ${
      missingIntegrated.join(", ") || "0"
    }`,
    "base 1 · 수요 · 정책현재성 · 국제사업 · MDB · ODA"
  );
  addCheck(
    checks,
    "v116 핵심 통합뷰",
    "V116_SINGLE_VISUAL_MEANING",
    "시각채널 단일 의미 원칙",
    MAP_RUNTIME_POLICY_V116.visualEncodingSingleMeaning === true &&
      MAP_RUNTIME_POLICY_V116.bubbleAreaProportional === true,
    `단일의미 ${
      MAP_RUNTIME_POLICY_V116.visualEncodingSingleMeaning ? "예" : "아니오"
    } · 면적비례 ${
      MAP_RUNTIME_POLICY_V116.bubbleAreaProportional ? "예" : "아니오"
    }`,
    "색=기초여건 · 크기=수요량 · 형태=기관 · 테두리=정책현재성"
  );
  addCheck(
    checks,
    "v116 핵심 통합뷰",
    "V116_SUPPORT_SYMBOLS",
    "국제지원 기관·사업군 shape 구분",
    Object.keys(SUPPORT_SYMBOLS_V116).length >= 4,
    `${Object.keys(SUPPORT_SYMBOLS_V116).length}개 shape 정의`,
    "CTCN · GCF · AF · MDB 등 색+shape 병용"
  );

  onProgress?.("지역화·공간무결성 확인");
  const spatial = spatialCounts();
  addCheck(
    checks,
    "v116 공간해상도",
    "V116_SPATIAL_152",
    "152개 actual/preferred 공간해상도 판정",
    Object.values(spatial)
      .slice(0, 8)
      .reduce((sum, value) => sum + value, 0) === 152,
    `actual 해상도 합계 ${
      spatial.country +
      spatial.admin1 +
      spatial.admin2 +
      spatial.facility +
      spatial.grid +
      spatial.basin +
      spatial.corridor +
      spatial.nonSpatial
    }`,
    "152"
  );
  addCheck(
    checks,
    "v116 공간해상도",
    "V116_NO_NATIONAL_FABRICATION",
    "국가값을 지역값으로 임의 분해하지 않음",
    MAP_RUNTIME_POLICY_V116.nationalToRegionalFabrication === false &&
      MAP_RUNTIME_POLICY_V116.syntheticRegionalValuesNeverActual === true,
    `임의분해 ${
      MAP_RUNTIME_POLICY_V116.nationalToRegionalFabrication ? "허용" : "금지"
    } · 지역예시 실제값 취급 ${
      MAP_RUNTIME_POLICY_V116.syntheticRegionalValuesNeverActual
        ? "금지"
        : "허용"
    }`,
    "금지"
  );
  addCheck(
    checks,
    "v116 공간해상도",
    "V116_REGIONAL_PRIORITY",
    "지역단위 우선표현 구조",
    spatial.regionalPreferred > 0 &&
      MAP_RUNTIME_POLICY_V116.regionalActualOverridesCountry === true,
    `지역화 권장 ${spatial.regionalPreferred} · 실제 지역값 우선 ${
      MAP_RUNTIME_POLICY_V116.regionalActualOverridesCountry ? "예" : "아니오"
    }`,
    "지역자료 존재 시 국가자료보다 우선"
  );
  addCheck(
    checks,
    "v116 공간해상도",
    "V116_ACTUAL_POINT_SAFETY",
    "실제 사업·시설 가짜 좌표 금지",
    MAP_RUNTIME_POLICY_V116.inventedActualCoordinates === false &&
      MAP_RUNTIME_POLICY_V116.actualAndSyntheticMixing === false,
    `가짜 실제좌표 ${
      MAP_RUNTIME_POLICY_V116.inventedActualCoordinates ? "허용" : "금지"
    } · 실제/예시 혼합 ${
      MAP_RUNTIME_POLICY_V116.actualAndSyntheticMixing ? "허용" : "금지"
    }`,
    "둘 다 금지"
  );
  addCheck(
    checks,
    "v116 공간해상도",
    "V116_ZOOM_POLICY",
    "zoom-dependent drill-down은 실제 지역자료에만 자동 적용",
    MAP_RUNTIME_POLICY_V116.zoomDependentAutomaticDrilldown === "actual-only",
    MAP_RUNTIME_POLICY_V116.zoomDependentAutomaticDrilldown,
    "actual-only",
    "현재 실제 지역자료가 없으므로 synthetic Admin-1·Admin-2는 사용자가 명시적으로 선택"
  );

  onProgress?.("데이터 무결성·runtime layer 확인");
  const runtimeLayerUnique = new Set(MAP_LAYER_IDS_RUNTIME_V116);
  const runtimeSourceUnique = new Set(MAP_SOURCE_IDS_RUNTIME_V116);
  addCheck(
    checks,
    "v116 runtime",
    "V116_RUNTIME_IDS",
    "MapLibre source/layer ID 중복 없음",
    runtimeLayerUnique.size === MAP_LAYER_IDS_RUNTIME_V116.length &&
      runtimeSourceUnique.size === MAP_SOURCE_IDS_RUNTIME_V116.length,
    `layer ${runtimeLayerUnique.size}/${MAP_LAYER_IDS_RUNTIME_V116.length} · source ${runtimeSourceUnique.size}/${MAP_SOURCE_IDS_RUNTIME_V116.length}`,
    "중복 0"
  );
  addCheck(
    checks,
    "v116 data integrity",
    "V116_DATA_PROTECTION",
    "null·다국가 금액·금융개념·기술추론 보호",
    MAP_RUNTIME_POLICY_V116.nullToZero === false &&
      MAP_RUNTIME_POLICY_V116.multiCountryEqualAllocation === false &&
      MAP_RUNTIME_POLICY_V116.financeConceptAggregation === false &&
      MAP_RUNTIME_POLICY_V116.automaticTechnologyInference === false,
    `null→0 ${
      MAP_RUNTIME_POLICY_V116.nullToZero ? "허용" : "금지"
    } · 균등배분 ${
      MAP_RUNTIME_POLICY_V116.multiCountryEqualAllocation ? "허용" : "금지"
    } · 금융합산 ${
      MAP_RUNTIME_POLICY_V116.financeConceptAggregation ? "허용" : "금지"
    } · 기술추론 ${
      MAP_RUNTIME_POLICY_V116.automaticTechnologyInference ? "허용" : "금지"
    }`,
    "모두 금지"
  );

  const registryIds = new Set(
    MAP_LAYER_REGISTRY_V116.map((row) => row.elementId)
  );
  const suitable = MAP_ELEMENT_AUDIT_V115.filter(
    (row) => row.mapDecision !== "not-map-suitable"
  );
  const catalogMissing = suitable.filter(
    (row) => !registryIds.has(row.elementId)
  );
  addCheck(
    checks,
    "v116 지도 카탈로그",
    "V116_CATALOG_COVERAGE",
    "지도 활용 데이터 150개 접근 누락 없음",
    catalogMissing.length === 0 &&
      getMapCatalogRowsV116().length === suitable.length,
    `카탈로그 ${getMapCatalogRowsV116().length}/${suitable.length} · 누락 ${
      catalogMissing.length
    }`,
    "지도 적합 데이터 접근 누락 0"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall = p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";
  const roles = roleCounts();
  const actualLocationElements = MAP_LAYER_REGISTRY_V116.filter(
    (row) =>
      row.actualDataAvailable &&
      ["verified-point", "cluster-point"].includes(row.renderer)
  ).length;

  const result: WebSandboxQaResultV116 = {
    schemaVersion: "v116",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v115",
      baseline: baseline.facts,
      decisionRoles: roles,
      visualEncoding: {
        elements: MAP_VISUAL_ENCODINGS_V116.length,
        coreElements: coreRows.length,
        defaultIntegratedElements:
          integrated.elementIds.length + (integrated.baseElementId ? 1 : 0),
        legendSpecs: MAP_VISUAL_ENCODINGS_V116.filter((row) =>
          row.legendTitle.trim()
        ).length,
      },
      spatialCoverage: spatial,
      integratedView: {
        preset: "핵심 협력기획 보기",
        baseElementId: integrated.baseElementId,
        activeElements: integrated.elementIds,
        supportSymbols: Object.keys(SUPPORT_SYMBOLS_V116).length,
        policyStateViaDemandBorder: true,
        financeViaOdaHalo: true,
      },
      runtime: {
        layers: MAP_LAYER_IDS_RUNTIME_V116.length,
        sources: MAP_SOURCE_IDS_RUNTIME_V116.length,
        subnationalBoundaryProvider:
          MAP_RUNTIME_POLICY_V116.subnationalBoundaryProvider,
        actualLocationElements,
      },
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V116__?: WebSandboxQaResultV116;
      }
    ).__LDC_WEB_SANDBOX_QA_V116__ = result;
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

function overallLabel(overall: WebSandboxQaResultV116["overall"]): string {
  if (overall === "READY") return "릴리스 기준 통과";
  if (overall === "CONDITIONALLY_READY")
    return "핵심 기준 통과 · 확인항목 있음";
  return "수정 후 재검사 필요";
}

function qaStyle(): string {
  return `
      :root { color-scheme: light; font-family: Inter, Pretendard, "Noto Sans KR", Arial, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f4f7f6; color: #10231d; }
      .qa-shell { max-width: 1440px; margin: 0 auto; padding: 28px 22px 56px; }
      .qa-top { display:flex; gap:18px; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
      .qa-eyebrow { display:inline-block; font-size:12px; font-weight:800; letter-spacing:.08em; color:#2f6b57; margin-bottom:7px; }
      .qa-title { margin:0; font-size:clamp(24px,3vw,36px); line-height:1.2; }
      .qa-desc { margin:8px 0 0; max-width:940px; color:#52645f; line-height:1.6; }
      .qa-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
      .qa-button { border:1px solid #c8d6d1; background:#fff; color:#173d30; border-radius:9px; padding:10px 13px; font-weight:700; cursor:pointer; text-decoration:none; }
      .qa-button.primary { background:#145d45; border-color:#145d45; color:white; }
      .qa-banner { border-radius:14px; padding:18px 20px; margin:18px 0; border:1px solid; }
      .qa-banner.ready { background:#edf8f2; border-color:#a9d3bd; }
      .qa-banner.warn { background:#fff8e8; border-color:#ead29a; }
      .qa-banner.fail { background:#fff0ef; border-color:#e5b5b0; }
      .qa-banner strong { display:block; font-size:19px; margin-bottom:4px; }
      .qa-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:10px; margin:18px 0 24px; }
      .qa-fact { background:white; border:1px solid #dce5e1; border-radius:12px; padding:13px; }
      .qa-fact span { display:block; color:#687a74; font-size:11px; margin-bottom:5px; }
      .qa-fact strong { font-size:19px; }
      .qa-table-wrap { background:#fff; border:1px solid #dce5e1; border-radius:14px; overflow:auto; }
      table { border-collapse:collapse; width:100%; min-width:1000px; }
      th,td { text-align:left; padding:11px 12px; border-bottom:1px solid #edf1ef; vertical-align:top; font-size:13px; }
      th { position:sticky; top:0; background:#f9fbfa; color:#4d625b; z-index:1; }
      .qa-status { display:inline-flex; min-width:48px; justify-content:center; border-radius:999px; padding:4px 8px; font-weight:800; font-size:11px; }
      .qa-status.PASS { background:#e6f5ed; color:#16633f; }
      .qa-status.WARN { background:#fff2ce; color:#8a5b00; }
      .qa-status.FAIL { background:#ffe4e2; color:#a12c24; }
      .qa-note { color:#64756f; line-height:1.45; max-width:470px; }
      .qa-section { font-weight:800; color:#284c40; white-space:nowrap; }
      .qa-subtitle { margin:24px 0 8px; color:#294f42; font-size:16px; }
      @media (max-width:760px){ .qa-top{flex-direction:column}.qa-actions{justify-content:flex-start} }
    `;
}

function buildQaHtml(
  result: WebSandboxQaResultV116 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const mapUrl = new URL(appUrl.toString());
  mapUrl.hash = "map";
  const bannerClass = !result
    ? "warn"
    : result.overall === "READY"
    ? "ready"
    : result.overall === "CONDITIONALLY_READY"
    ? "warn"
    : "fail";

  const content = result
    ? `
        <div class="qa-banner ${bannerClass}">
          <strong>${escapeHtml(overallLabel(result.overall))}</strong>
          <span>P0 ${result.p0} · P1 ${result.p1} · ${escapeHtml(
        new Date(result.generatedAt).toLocaleString("ko-KR")
      )}</span>
        </div>
        <h2 class="qa-subtitle">v116 핵심 사실</h2>
        <div class="qa-facts">
          <div class="qa-fact"><span>재분류 완료</span><strong>${
            MAP_ELEMENT_DECISIONS_V116.length
          }/152</strong></div>
          <div class="qa-fact"><span>Visual Encoding</span><strong>${
            result.facts.visualEncoding.elements
          }/152</strong></div>
          <div class="qa-fact"><span>협력기획 핵심 요소</span><strong>${
            result.facts.visualEncoding.coreElements
          }</strong></div>
          <div class="qa-fact"><span>기본 통합채널 요소</span><strong>${
            result.facts.visualEncoding.defaultIntegratedElements
          }</strong></div>
          <div class="qa-fact"><span>지역화 권장</span><strong>${
            result.facts.spatialCoverage.regionalPreferred
          }</strong></div>
          <div class="qa-fact"><span>실제 지역자료</span><strong>${
            result.facts.spatialCoverage.regionalActual
          }</strong></div>
          <div class="qa-fact"><span>지역 시각화 예시 가능</span><strong>${
            result.facts.spatialCoverage.regionalSyntheticPrototype
          }</strong></div>
          <div class="qa-fact"><span>Runtime layer</span><strong>${
            result.facts.runtime.layers
          }</strong></div>
          <div class="qa-fact"><span>R1 협력수요</span><strong>${
            result.facts.decisionRoles.R1
          }</strong></div>
          <div class="qa-fact"><span>R2 정책</span><strong>${
            result.facts.decisionRoles.R2
          }</strong></div>
          <div class="qa-fact"><span>R3 문제·위험</span><strong>${
            result.facts.decisionRoles.R3
          }</strong></div>
          <div class="qa-fact"><span>R4 적용여건</span><strong>${
            result.facts.decisionRoles.R4
          }</strong></div>
          <div class="qa-fact"><span>R5 시장환경</span><strong>${
            result.facts.decisionRoles.R5
          }</strong></div>
          <div class="qa-fact"><span>R6 국제지원</span><strong>${
            result.facts.decisionRoles.R6
          }</strong></div>
          <div class="qa-fact"><span>R7 재원</span><strong>${
            result.facts.decisionRoles.R7
          }</strong></div>
          <div class="qa-fact"><span>R8 파트너</span><strong>${
            result.facts.decisionRoles.R8
          }</strong></div>
          <div class="qa-fact"><span>R9 한국 공급연계</span><strong>${
            result.facts.decisionRoles.R9
          }</strong></div>
        </div>
        <h2 class="qa-subtitle">공간해상도</h2>
        <div class="qa-facts">
          <div class="qa-fact"><span>국가</span><strong>${
            result.facts.spatialCoverage.country
          }</strong></div>
          <div class="qa-fact"><span>Admin-1</span><strong>${
            result.facts.spatialCoverage.admin1
          }</strong></div>
          <div class="qa-fact"><span>Admin-2</span><strong>${
            result.facts.spatialCoverage.admin2
          }</strong></div>
          <div class="qa-fact"><span>시설</span><strong>${
            result.facts.spatialCoverage.facility
          }</strong></div>
          <div class="qa-fact"><span>격자</span><strong>${
            result.facts.spatialCoverage.grid
          }</strong></div>
          <div class="qa-fact"><span>유역</span><strong>${
            result.facts.spatialCoverage.basin
          }</strong></div>
          <div class="qa-fact"><span>회랑</span><strong>${
            result.facts.spatialCoverage.corridor
          }</strong></div>
          <div class="qa-fact"><span>현재 비공간</span><strong>${
            result.facts.spatialCoverage.nonSpatial
          }</strong></div>
        </div>
        <div class="qa-table-wrap"><table>
          <thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead>
          <tbody>${result.checks
            .map(
              (check) => `
            <tr>
              <td class="qa-section">${escapeHtml(check.section)}</td>
              <td><span class="qa-status ${check.status}">${escapeHtml(
                statusLabel(check.status)
              )}</span></td>
              <td><strong>${escapeHtml(
                check.label
              )}</strong><br><small>${escapeHtml(check.code)}</small></td>
              <td>${escapeHtml(check.actual)}</td><td>${escapeHtml(
                check.expected
              )}</td>
              <td class="qa-note">${escapeHtml(check.note ?? "-")}</td>
            </tr>`
            )
            .join("")}</tbody>
        </table></div>`
    : `<div class="qa-banner ${bannerClass}"><strong>${
        error ? "검사 실행 중 오류" : "브라우저에서 검사 중"
      }</strong><span>${escapeHtml(error ?? progress)}</span></div>`;

  return `<style>${qaStyle()}</style><div class="qa-shell">
      <div class="qa-top"><div><span class="qa-eyebrow">INTERNAL QA · WEB SANDBOX</span><h1 class="qa-title">개도국 전략지도 릴리스 점검 v116</h1><p class="qa-desc">152개 협력 의사결정 역할, 시각문법, 핵심 통합뷰, 공간해상도·지역화, 실제/예시 분리 및 데이터 무결성을 Terminal 없이 확인합니다.</p></div>
      <div class="qa-actions"><button id="qa-rerun" class="qa-button primary" type="button">검사 다시 실행</button><button id="qa-download" class="qa-button" type="button" ${
        result ? "" : "disabled"
      }>결과 JSON 저장</button><a class="qa-button" href="${escapeHtml(
    mapUrl.toString()
  )}">지도 바로 보기</a><a class="qa-button" href="${escapeHtml(
    appUrl.toString()
  )}">플랫폼으로 돌아가기</a></div></div>${content}</div>`;
}

function downloadResult(result: WebSandboxQaResultV116): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ldc-web-sandbox-qa-v116-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV116(): boolean {
  return new URLSearchParams(window.location.search).get("qa") === "1";
}

export async function mountWebSandboxQaV116(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV116 | null = null;
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
      currentResult = await runWebSandboxFinalizationV116((message) =>
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
