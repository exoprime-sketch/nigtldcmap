import {
  MAP_ELEMENT_AUDIT_V115,
  MAP_ELEMENT_COVERAGE_V115,
} from "../data/map/mapElementAuditV115";
import {
  MAP_LAYER_REGISTRY_V115,
  MAP_PRESETS_V115,
  getMapCatalogRowsV115,
} from "../data/map/mapLayerRegistryV115";
import {
  SYNTHETIC_BADGE_V115,
  SYNTHETIC_DATA_MODE_V115,
  SYNTHETIC_NOTICE_V115,
} from "../data/map/syntheticMapDataV115";
import { MAP_RENDERER_DEFINITIONS_V115 } from "../components/map/GenericMapRenderersV115";
import {
  MAP_LAYER_IDS_RUNTIME_V115,
  MAP_SOURCE_IDS_RUNTIME_V115,
  MAP_RUNTIME_POLICY_V115,
} from "../data/map/mapRuntimeContractsV116";
import {
  runWebSandboxFinalizationV114,
} from "./webSandboxFinalizationV114";
import type {
  WebSandboxQaResultV114,
} from "./webSandboxFinalizationV114";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV115 {
  schemaVersion: "v115";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v114";
    baseline: WebSandboxQaResultV114["facts"];
    mapCoverage: {
      totalElements: number;
      audited: number;
      directLayers: number;
      countryAggregates: number;
      flows: number;
      filters: number;
      evidencePanel: number;
      notMapSuitable: number;
      actualLayers: number;
      syntheticPrototypeLayers: number;
    };
    mapCatalog: {
      entries: number;
      categories: number;
      presets: number;
      rendererTypes: number;
    };
    spatialIntegrity: {
      actualVerifiedPointElements: number;
      inventedActualCoordinatesAllowed: boolean;
      actualSyntheticMixingAllowed: boolean;
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

export async function runWebSandboxFinalizationV115(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV115> {
  onProgress?.("v114 기준선 확인");
  const baseline = await runWebSandboxFinalizationV114((message) =>
    onProgress?.(message)
  );
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("152개 데이터 요소 전수 지도감사 확인");
  const elementIds = MAP_ELEMENT_AUDIT_V115.map((row) => row.elementId);
  const uniqueElementIds = new Set(elementIds);
  const decisionTotal =
    MAP_ELEMENT_COVERAGE_V115.directLayers +
    MAP_ELEMENT_COVERAGE_V115.countryAggregates +
    MAP_ELEMENT_COVERAGE_V115.flows +
    MAP_ELEMENT_COVERAGE_V115.filters +
    MAP_ELEMENT_COVERAGE_V115.evidencePanel +
    MAP_ELEMENT_COVERAGE_V115.notMapSuitable;

  addCheck(
    checks,
    "v115 전체 데이터 감사",
    "V115_AUDIT_152",
    "152개 데이터 요소 전수 판정",
    MAP_ELEMENT_AUDIT_V115.length === 152 &&
      MAP_ELEMENT_COVERAGE_V115.audited === 152 &&
      decisionTotal === 152,
    `${MAP_ELEMENT_AUDIT_V115.length}/152 · 판정합계 ${decisionTotal}`,
    "152/152 · 미판정 0"
  );
  addCheck(
    checks,
    "v115 전체 데이터 감사",
    "V115_AUDIT_UNIQUE_IDS",
    "데이터 요소 ID 중복 없음",
    uniqueElementIds.size === elementIds.length,
    `${uniqueElementIds.size}/${elementIds.length}`,
    "중복 0"
  );
  addCheck(
    checks,
    "v115 전체 데이터 감사",
    "V115_AUDIT_REASON",
    "모든 요소에 지도 활용 판정사유 존재",
    MAP_ELEMENT_AUDIT_V115.every(
      (row) =>
        row.reason.trim().length > 0 && row.cooperationUse.trim().length > 0
    ),
    `${MAP_ELEMENT_AUDIT_V115.filter((row) => row.reason.trim()).length}/${
      MAP_ELEMENT_AUDIT_V115.length
    }`,
    "152/152"
  );
  const unsuitableWithoutReason = MAP_ELEMENT_AUDIT_V115.filter(
    (row) =>
      row.mapDecision === "not-map-suitable" && row.reason.trim().length === 0
  );
  addCheck(
    checks,
    "v115 전체 데이터 감사",
    "V115_NOT_MAP_SUITABLE_REASON",
    "지도 부적합 항목 제외사유",
    unsuitableWithoutReason.length === 0,
    `사유 누락 ${unsuitableWithoutReason.length}`,
    "0"
  );

  onProgress?.("지도 레이어 레지스트리 확인");
  const registryIds = new Set(
    MAP_LAYER_REGISTRY_V115.map((row) => row.elementId)
  );
  const suitable = MAP_ELEMENT_AUDIT_V115.filter(
    (row) => row.mapDecision !== "not-map-suitable"
  );
  const missingRegistry = suitable.filter(
    (row) => !registryIds.has(row.elementId)
  );
  const invalidRenderer = MAP_LAYER_REGISTRY_V115.filter(
    (row) =>
      row.role !== "none" &&
      !MAP_RENDERER_DEFINITIONS_V115.some(
        (renderer) => renderer.id === row.renderer
      )
  );
  addCheck(
    checks,
    "v115 지도 카탈로그",
    "V115_SUITABLE_CATALOG_COVERAGE",
    "지도 활용 데이터의 카탈로그 접근 누락 없음",
    missingRegistry.length === 0 &&
      getMapCatalogRowsV115().length === suitable.length,
    `카탈로그 ${getMapCatalogRowsV115().length}/${suitable.length} · 누락 ${
      missingRegistry.length
    }`,
    "누락 0"
  );
  addCheck(
    checks,
    "v115 지도 카탈로그",
    "V115_RENDERER_COVERAGE",
    "지도 활용 데이터 renderer 연결",
    invalidRenderer.length === 0,
    `미연결 ${invalidRenderer.length}`,
    "0"
  );

  const mapLayerIds = MAP_LAYER_REGISTRY_V115.map((row) => row.layerId);
  const uniqueRegistryLayerIds = new Set(mapLayerIds);
  const uniqueRuntimeLayerIds = new Set(MAP_LAYER_IDS_RUNTIME_V115);
  const uniqueRuntimeSourceIds = new Set(MAP_SOURCE_IDS_RUNTIME_V115);
  addCheck(
    checks,
    "v115 layer system",
    "V115_LAYER_ID_UNIQUE",
    "layer ID 중복 없음",
    uniqueRegistryLayerIds.size === mapLayerIds.length &&
      uniqueRuntimeLayerIds.size === MAP_LAYER_IDS_RUNTIME_V115.length,
    `registry ${uniqueRegistryLayerIds.size}/${mapLayerIds.length} · runtime ${uniqueRuntimeLayerIds.size}/${MAP_LAYER_IDS_RUNTIME_V115.length}`,
    "중복 0"
  );
  addCheck(
    checks,
    "v115 layer system",
    "V115_SOURCE_ID_UNIQUE",
    "source ID 중복 없음",
    uniqueRuntimeSourceIds.size === MAP_SOURCE_IDS_RUNTIME_V115.length,
    `${uniqueRuntimeSourceIds.size}/${MAP_SOURCE_IDS_RUNTIME_V115.length}`,
    "중복 0"
  );
  addCheck(
    checks,
    "v115 layer system",
    "V115_SINGLE_MAP_INSTANCE",
    "Map instance 단일 생성 정책",
    MAP_RUNTIME_POLICY_V115.mapInstance === "single-instance",
    MAP_RUNTIME_POLICY_V115.mapInstance,
    "single-instance"
  );
  addCheck(
    checks,
    "v115 layer system",
    "V115_BASE_RASTER_LIMIT",
    "base polygon·raster 동시활성 관리",
    MAP_RUNTIME_POLICY_V115.basePolygonMaxActive === 1 &&
      MAP_RUNTIME_POLICY_V115.rasterMaxActive === 1,
    `base ${MAP_RUNTIME_POLICY_V115.basePolygonMaxActive} · raster ${MAP_RUNTIME_POLICY_V115.rasterMaxActive}`,
    "각 1개"
  );

  onProgress?.("실제 위치·예시 데이터 안전성 확인");
  const actualVerifiedPoints = MAP_LAYER_REGISTRY_V115.filter(
    (row) =>
      row.actualDataAvailable &&
      (row.renderer === "verified-point" || row.renderer === "cluster-point")
  );
  const syntheticRows = MAP_LAYER_REGISTRY_V115.filter(
    (row) => row.syntheticAdapter !== "none"
  );
  const syntheticWithActual = syntheticRows.filter(
    (row) => row.actualDataAvailable
  );
  addCheck(
    checks,
    "v115 spatial integrity",
    "V115_NO_FAKE_ACTUAL_COORDINATES",
    "실제 데이터에 가짜 사업좌표 사용 금지",
    MAP_RUNTIME_POLICY_V115.inventedActualCoordinates === false &&
      actualVerifiedPoints.length === 0,
    `임의좌표 허용 ${
      MAP_RUNTIME_POLICY_V115.inventedActualCoordinates ? "예" : "아니오"
    } · 실제 위치 layer ${actualVerifiedPoints.length}`,
    "검증 좌표 없으면 실제 위치 layer 0"
  );
  addCheck(
    checks,
    "v115 synthetic safety",
    "V115_SYNTHETIC_SEPARATION",
    "실제 데이터와 시각화 예시 완전 분리",
    MAP_RUNTIME_POLICY_V115.actualAndSyntheticMixing === false &&
      MAP_RUNTIME_POLICY_V115.syntheticDefaultVisible === false &&
      MAP_RUNTIME_POLICY_V115.syntheticCatalogAvailableByDefault === false &&
      MAP_RUNTIME_POLICY_V115.syntheticActivation ===
        "disabled-on-vietnam-actual-route" &&
      MAP_RUNTIME_POLICY_V115.syntheticQueryRequired === false &&
      syntheticWithActual.length === 0 &&
      SYNTHETIC_DATA_MODE_V115 === "synthetic" &&
      SYNTHETIC_BADGE_V115 === "시각화 예시" &&
      SYNTHETIC_NOTICE_V115.length > 0,
    `자동활성 ${
      MAP_RUNTIME_POLICY_V115.syntheticDefaultVisible ? "예" : "아니오"
    } · 지도 카탈로그 기본제공 ${
      MAP_RUNTIME_POLICY_V115.syntheticCatalogAvailableByDefault
        ? "예"
        : "아니오"
    } · 실제와 혼합 ${syntheticWithActual.length}`,
    "지도 탭에서 예시 선택 가능 · 선택 전 자동표시 없음 · 실제 데이터와 혼합 없음"
  );

  onProgress?.("데이터 정합성 보호규칙 확인");
  addCheck(
    checks,
    "v115 data integrity",
    "V115_NO_NULL_TO_ZERO",
    "null을 0으로 변환하지 않음",
    MAP_RUNTIME_POLICY_V115.nullToZero === false,
    MAP_RUNTIME_POLICY_V115.nullToZero ? "허용" : "금지",
    "금지"
  );
  addCheck(
    checks,
    "v115 data integrity",
    "V115_NO_EQUAL_ALLOCATION",
    "다국가 금액 균등배분 금지",
    MAP_RUNTIME_POLICY_V115.multiCountryEqualAllocation === false,
    MAP_RUNTIME_POLICY_V115.multiCountryEqualAllocation ? "허용" : "금지",
    "금지"
  );
  addCheck(
    checks,
    "v115 data integrity",
    "V115_FINANCE_CONCEPT_SEPARATION",
    "금융개념 임의 합산 금지",
    MAP_RUNTIME_POLICY_V115.financeConceptAggregation === false,
    MAP_RUNTIME_POLICY_V115.financeConceptAggregation ? "합산" : "분리",
    "commitment · disbursement · 승인금액 분리"
  );
  addCheck(
    checks,
    "v115 data integrity",
    "V115_NO_TECH_INFERENCE",
    "사업명 기반 기술 임의추론 금지",
    MAP_RUNTIME_POLICY_V115.automaticTechnologyInference === false,
    MAP_RUNTIME_POLICY_V115.automaticTechnologyInference ? "허용" : "금지",
    "금지"
  );

  onProgress?.("preset·예시 renderer 확인");
  const rendererIds = new Set(
    MAP_LAYER_REGISTRY_V115.map((row) => row.renderer)
  );
  const requiredPrototypeRenderers = [
    "choropleth",
    "proportional-bubble",
    "aggregate-bubble",
    "verified-point",
    "raster",
    "flow",
    "categorical-outline",
    "line",
  ];
  const missingPrototypeRenderer = requiredPrototypeRenderers.filter(
    (renderer) => !rendererIds.has(renderer as any)
  );
  addCheck(
    checks,
    "v115 map demo",
    "V115_PROTOTYPE_RENDERERS",
    "주요 공간 시각화 유형 설계",
    missingPrototypeRenderer.length === 0 &&
      MAP_LAYER_IDS_RUNTIME_V115.includes("v115-point-clusters" as any) &&
      MAP_LAYER_IDS_RUNTIME_V115.includes("v115-point-cluster-count" as any),
    `renderer ${
      requiredPrototypeRenderers.length - missingPrototypeRenderer.length
    }/${requiredPrototypeRenderers.length} · cluster O`,
    "choropleth · bubble · point/cluster · raster · flow · categorical · line"
  );
  addCheck(
    checks,
    "v115 preset",
    "V115_PRESETS",
    "협력기획용 preset 구성",
    MAP_PRESETS_V115.length >= 8 &&
      MAP_PRESETS_V115.includes("핵심 통합 보기") &&
      MAP_PRESETS_V115.includes("기후위험·적응 보기") &&
      MAP_PRESETS_V115.includes("에너지·인프라 보기") &&
      MAP_PRESETS_V115.includes("기술·혁신 보기"),
    `${MAP_PRESETS_V115.length}개`,
    "8개 이상"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall = p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV115 = {
    schemaVersion: "v115",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v114",
      baseline: baseline.facts,
      mapCoverage: {
        totalElements: MAP_ELEMENT_COVERAGE_V115.totalElements,
        audited: MAP_ELEMENT_COVERAGE_V115.audited,
        directLayers: MAP_ELEMENT_COVERAGE_V115.directLayers,
        countryAggregates: MAP_ELEMENT_COVERAGE_V115.countryAggregates,
        flows: MAP_ELEMENT_COVERAGE_V115.flows,
        filters: MAP_ELEMENT_COVERAGE_V115.filters,
        evidencePanel: MAP_ELEMENT_COVERAGE_V115.evidencePanel,
        notMapSuitable: MAP_ELEMENT_COVERAGE_V115.notMapSuitable,
        actualLayers: MAP_LAYER_REGISTRY_V115.filter(
          (row) =>
            row.actualDataAvailable &&
            ["base", "aggregate", "verified-point", "raster", "flow"].includes(
              row.role
            )
        ).length,
        syntheticPrototypeLayers: syntheticRows.length,
      },
      mapCatalog: {
        entries: getMapCatalogRowsV115().length,
        categories: new Set(getMapCatalogRowsV115().map((row) => row.category))
          .size,
        presets: MAP_PRESETS_V115.length,
        rendererTypes: rendererIds.size,
      },
      spatialIntegrity: {
        actualVerifiedPointElements: actualVerifiedPoints.length,
        inventedActualCoordinatesAllowed:
          MAP_RUNTIME_POLICY_V115.inventedActualCoordinates,
        actualSyntheticMixingAllowed:
          MAP_RUNTIME_POLICY_V115.actualAndSyntheticMixing,
      },
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V115__?: WebSandboxQaResultV115;
      }
    ).__LDC_WEB_SANDBOX_QA_V115__ = result;
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

function overallLabel(overall: WebSandboxQaResultV115["overall"]): string {
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
    .qa-shell { max-width: 1380px; margin: 0 auto; padding: 28px 22px 56px; }
    .qa-top { display: flex; gap: 18px; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .qa-eyebrow { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #2f6b57; margin-bottom: 7px; }
    .qa-title { margin: 0; font-size: clamp(24px, 3vw, 36px); line-height: 1.2; }
    .qa-desc { margin: 8px 0 0; max-width: 920px; color: #52645f; line-height: 1.6; }
    .qa-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .qa-button { border: 1px solid #c8d6d1; background: #fff; color: #173d30; border-radius: 9px; padding: 10px 13px; font-weight: 700; cursor: pointer; text-decoration: none; }
    .qa-button.primary { background: #145d45; border-color: #145d45; color: white; }
    .qa-banner { border-radius: 14px; padding: 18px 20px; margin: 18px 0; border: 1px solid; }
    .qa-banner.ready { background: #edf8f2; border-color: #a9d3bd; }
    .qa-banner.warn { background: #fff8e8; border-color: #ead29a; }
    .qa-banner.fail { background: #fff0ef; border-color: #e5b5b0; }
    .qa-banner strong { display: block; font-size: 19px; margin-bottom: 4px; }
    .qa-progress { margin-top: 6px; color: #687a74; font-size: 13px; }
    .qa-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 18px 0 24px; }
    .qa-fact { background: white; border: 1px solid #dce5e1; border-radius: 12px; padding: 14px; }
    .qa-fact span { display: block; color: #687a74; font-size: 12px; margin-bottom: 5px; }
    .qa-fact strong { font-size: 20px; }
    .qa-table-wrap { background: #fff; border: 1px solid #dce5e1; border-radius: 14px; overflow: auto; }
    table { border-collapse: collapse; width: 100%; min-width: 980px; }
    th, td { text-align: left; padding: 11px 12px; border-bottom: 1px solid #edf1ef; vertical-align: top; font-size: 13px; }
    th { position: sticky; top: 0; background: #f9fbfa; color: #4d625b; z-index: 1; }
    .qa-status { display: inline-flex; min-width: 48px; justify-content: center; border-radius: 999px; padding: 4px 8px; font-weight: 800; font-size: 11px; }
    .qa-status.PASS { background: #e6f5ed; color: #16633f; }
    .qa-status.WARN { background: #fff2ce; color: #8a5b00; }
    .qa-status.FAIL { background: #ffe4e2; color: #a12c24; }
    .qa-note { color: #64756f; line-height: 1.45; max-width: 440px; }
    .qa-section { font-weight: 800; color: #284c40; white-space: nowrap; }
    .qa-footer-note { margin-top: 14px; color: #6a7c76; font-size: 12px; line-height: 1.55; }
    @media (max-width: 760px) { .qa-top { flex-direction: column; } .qa-actions { justify-content: flex-start; } }
  `;
}

function buildQaHtml(
  result: WebSandboxQaResultV115 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const mapUrl = new URL(appUrl.toString());
  mapUrl.searchParams.delete("mapdemo");
  mapUrl.hash = "map";

  const bannerClass = !result
    ? "warn"
    : result.overall === "READY"
    ? "ready"
    : result.overall === "CONDITIONALLY_READY"
    ? "warn"
    : "fail";

  const resultContent = result
    ? `
      <div class="qa-banner ${bannerClass}">
        <strong>${escapeHtml(overallLabel(result.overall))}</strong>
        <span>P0 ${result.p0} · P1 ${result.p1} · ${escapeHtml(
        new Date(result.generatedAt).toLocaleString("ko-KR")
      )}</span>
      </div>
      <div class="qa-facts">
        <div class="qa-fact"><span>전체 데이터 요소</span><strong>${
          result.facts.mapCoverage.totalElements
        }</strong></div>
        <div class="qa-fact"><span>판정 완료</span><strong>${
          result.facts.mapCoverage.audited
        }/152</strong></div>
        <div class="qa-fact"><span>지도 직접표현</span><strong>${
          result.facts.mapCoverage.directLayers
        }</strong></div>
        <div class="qa-fact"><span>국가 집계</span><strong>${
          result.facts.mapCoverage.countryAggregates
        }</strong></div>
        <div class="qa-fact"><span>흐름지도</span><strong>${
          result.facts.mapCoverage.flows
        }</strong></div>
        <div class="qa-fact"><span>지도 필터</span><strong>${
          result.facts.mapCoverage.filters
        }</strong></div>
        <div class="qa-fact"><span>국가 상세정보</span><strong>${
          result.facts.mapCoverage.evidencePanel
        }</strong></div>
        <div class="qa-fact"><span>지도 부적합</span><strong>${
          result.facts.mapCoverage.notMapSuitable
        }</strong></div>
        <div class="qa-fact"><span>실제 지도 layer</span><strong>${
          result.facts.mapCoverage.actualLayers
        }</strong></div>
        <div class="qa-fact"><span>예시 prototype</span><strong>${
          result.facts.mapCoverage.syntheticPrototypeLayers
        }</strong></div>
        <div class="qa-fact"><span>지도 카탈로그</span><strong>${
          result.facts.mapCatalog.entries
        }</strong></div>
        <div class="qa-fact"><span>Preset</span><strong>${
          result.facts.mapCatalog.presets
        }</strong></div>
      </div>
      <div class="qa-table-wrap">
        <table>
          <thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead>
          <tbody>
            ${result.checks
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
                  <td>${escapeHtml(check.actual)}</td>
                  <td>${escapeHtml(check.expected)}</td>
                  <td class="qa-note">${escapeHtml(check.note ?? "-")}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="qa-footer-note">v115 QA는 152개 전수 판정, 지도 카탈로그 누락, 지도 탭 내 실제·예시 분리, 가짜 좌표, 금융개념 보존, renderer·preset 구성을 검사합니다. 외부 기관의 일시적 응답 실패는 기존 기준과 같이 내부 코드 결함과 분리합니다.</p>
    `
    : `
      <div class="qa-banner ${bannerClass}">
        <strong>${error ? "검사 실행 중 오류" : "브라우저에서 검사 중"}</strong>
        <span>${escapeHtml(error ?? progress)}</span>
        <div class="qa-progress">${escapeHtml(progress)}</div>
      </div>`;

  return `
    <style>${qaStyle()}</style>
    <div class="qa-shell">
      <div class="qa-top">
        <div>
          <span class="qa-eyebrow">INTERNAL QA · WEB SANDBOX</span>
          <h1 class="qa-title">개도국 전략지도 릴리스 점검 v115</h1>
          <p class="qa-desc">152개 데이터 요소 전수 지도 적합성 감사와 지도 데이터 카탈로그, 실제·예시 공간정보 분리, generic renderer, preset 및 공간·금융 데이터 보호규칙을 Terminal 없이 확인합니다.</p>
        </div>
        <div class="qa-actions">
          <button id="qa-rerun" class="qa-button primary" type="button">검사 다시 실행</button>
          <button id="qa-download" class="qa-button" type="button" ${
            result ? "" : "disabled"
          }>결과 JSON 저장</button>
          <a class="qa-button" href="${escapeHtml(
            mapUrl.toString()
          )}">지도 바로 보기</a>
          <a class="qa-button" href="${escapeHtml(
            appUrl.toString()
          )}">플랫폼으로 돌아가기</a>
        </div>
      </div>
      ${resultContent}
    </div>`;
}

function downloadResult(result: WebSandboxQaResultV115): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ldc-web-sandbox-qa-v115-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV115(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("qa") === "1";
}

export async function mountWebSandboxQaV115(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV115 | null = null;
  let running = false;

  const render = (
    progress = "검사를 준비하고 있습니다",
    error: string | null = null
  ) => {
    root.innerHTML = buildQaHtml(currentResult, progress, error);
    const rerunButton = document.getElementById(
      "qa-rerun"
    ) as HTMLButtonElement | null;
    const downloadButton = document.getElementById(
      "qa-download"
    ) as HTMLButtonElement | null;
    if (rerunButton) {
      rerunButton.disabled = running;
      rerunButton.addEventListener("click", () => void execute());
    }
    if (downloadButton && currentResult) {
      downloadButton.addEventListener("click", () =>
        downloadResult(currentResult!)
      );
    }
  };

  const execute = async () => {
    if (running) return;
    running = true;
    currentResult = null;
    render("검사를 시작합니다");
    try {
      currentResult = await runWebSandboxFinalizationV115((message) => {
        render(message);
      });
      render("검사가 완료되었습니다");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 검사 오류";
      render("검사가 중단되었습니다", message);
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
