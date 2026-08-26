import { DATASETS } from "../data/publicDatasets";
import {
  EVIDENCE_DATASET_IDS_V114,
  MAP_DATA_SELECTION_V114,
  MAP_GEOMETRY_POLICY_V114,
  MAP_FILTERS_V114,
  MAP_INSTANCE_POLICY_V114,
  MAP_LAYER_IDS_V114,
  MAP_RESET_POLICY_V114,
  PRESET_CONFIG_V114,
  WORLD_BANK_INDICATOR_MAP_REVIEW_V114,
} from "../data/map/cooperationMapV114";
import { VERIFIED_LOCATIONS_V97 } from "../data/operations/operationalUpdateRegistryV97";
import { VERIFIED_LOCATIONS_V98 } from "../data/operations/operationalBatchV98";
import {
  LEGACY_COMPARE_ROUTE_TARGET_V114,
  PUBLIC_NAVIGATION_V114,
} from "../app/navigation";
import { COMPARISON_CAPABILITIES_V114 } from "./dataElementComparisonV114";
import { DOWNLOAD_HUB_CONFIG_V114 } from "./downloadHubV114";
import {
  runWebSandboxFinalizationV1122,
} from "./webSandboxFinalizationV1122";
import type {
  WebSandboxQaCheckV1122,
  WebSandboxQaStatusV1122,
} from "./webSandboxFinalizationV1122";

export interface WebSandboxQaResultV114 {
  schemaVersion: "v114";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    baselineSchemaVersion: "v113";
    datasets: number;
    publicNavigation: string[];
    comparison: {
      scalar: boolean;
      timeSeries: boolean;
      policyMatrix: boolean;
      projectPortfolio: boolean;
      tnaStructured: boolean;
      csv: boolean;
      json: boolean;
      maxPinnedCountries: number;
    };
    downloadHub: {
      countryModes: number;
      hierarchyLevels: number;
      formats: string[];
      periodModes: number;
      emptyDownloadBlocked: boolean;
      jsonPreservesSourceSchema: boolean;
    };
    map: {
      defaultPreset: string;
      defaultBaseIndicator: string;
      defaultAggregateLayers: number;
      layerIds: number;
      uniqueLayerIds: number;
      selectedDataGroups: number;
      verifiedLocationsV97: number;
      verifiedLocationsV98: number;
      inventedCoordinatesAllowed: boolean;
      evidenceDatasetsAvailable: number;
      evidenceDatasetsExpected: number;
    };
    baseline: unknown;
  };
}

function addBooleanCheck(
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
  return checks.filter((check) => check.status === status).length;
}

export async function runWebSandboxFinalizationV114(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV114> {
  onProgress?.("v113 기준선 확인");
  const baseline = await runWebSandboxFinalizationV1122((message) => {
    onProgress?.(message);
  });
  const checks: WebSandboxQaCheckV1122[] = [...baseline.checks];

  onProgress?.("국가 비교 기능 확인");
  addBooleanCheck(
    checks,
    "v114 국가 비교",
    "V114_COMPARE_RENDERERS",
    "데이터 유형별 비교 기능",
    COMPARISON_CAPABILITIES_V114.scalarComparison &&
      COMPARISON_CAPABILITIES_V114.timeSeriesComparison &&
      COMPARISON_CAPABILITIES_V114.policyMatrix &&
      COMPARISON_CAPABILITIES_V114.projectPortfolioComparison &&
      COMPARISON_CAPABILITIES_V114.tnaStructuredComparison,
    `수치 ${
      COMPARISON_CAPABILITIES_V114.scalarComparison ? "O" : "X"
    } · 시계열 ${
      COMPARISON_CAPABILITIES_V114.timeSeriesComparison ? "O" : "X"
    } · 정책 ${COMPARISON_CAPABILITIES_V114.policyMatrix ? "O" : "X"} · 사업 ${
      COMPARISON_CAPABILITIES_V114.projectPortfolioComparison ? "O" : "X"
    } · TNA ${
      COMPARISON_CAPABILITIES_V114.tnaStructuredComparison ? "O" : "X"
    }`,
    "수치·시계열·정책·사업·기술수요 비교 지원"
  );
  addBooleanCheck(
    checks,
    "v114 국가 비교",
    "V114_COMPARE_YEAR_INTEGRITY",
    "비교연도 보존",
    COMPARISON_CAPABILITIES_V114.sameYearModePreservesActualYear &&
      COMPARISON_CAPABILITIES_V114.latestModePreservesActualYear,
    "동일연도·국가별 최신값 모두 실제 연도 보존",
    "다른 연도의 값을 선택연도 값으로 표시하지 않음"
  );
  addBooleanCheck(
    checks,
    "v114 국가 비교",
    "V114_COMPARE_DOWNLOAD",
    "비교 CSV·JSON 다운로드",
    COMPARISON_CAPABILITIES_V114.csvDownload &&
      COMPARISON_CAPABILITIES_V114.jsonDownload,
    `CSV ${COMPARISON_CAPABILITIES_V114.csvDownload ? "O" : "X"} · JSON ${
      COMPARISON_CAPABILITIES_V114.jsonDownload ? "O" : "X"
    }`,
    "CSV·JSON 모두 지원"
  );
  addBooleanCheck(
    checks,
    "v114 국가 비교",
    "V114_COMPARE_PIN_LIMIT",
    "선택 비교국 가독성 제한",
    COMPARISON_CAPABILITIES_V114.maxPinnedCountries === 4,
    `${COMPARISON_CAPABILITIES_V114.maxPinnedCountries}개`,
    "기본 최대 4개"
  );

  onProgress?.("데이터 다운로드 허브 확인");
  const publicNavHasDownload = PUBLIC_NAVIGATION_V114.some(
    (item) => item.view === "download" && item.label === "데이터 다운로드"
  );
  const publicNavHasCompare = PUBLIC_NAVIGATION_V114.some(
    (item) => item.view === "compare"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_PUBLIC_NAVIGATION",
    "공개 Navigation 전환",
    publicNavHasDownload && !publicNavHasCompare,
    PUBLIC_NAVIGATION_V114.map((item) => item.label).join(" · "),
    "데이터 찾기 · 지도 · 데이터 다운로드"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_COMPARE_ROUTE_ALIAS",
    "과거 국가 비교 링크 처리",
    LEGACY_COMPARE_ROUTE_TARGET_V114 === "download" &&
      DOWNLOAD_HUB_CONFIG_V114.oldCompareRouteTarget === "download",
    `#compare → ${LEGACY_COMPARE_ROUTE_TARGET_V114}`,
    "#compare → 데이터 다운로드"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_DOWNLOAD_COUNTRY_MODES",
    "국가 선택 범위",
    DOWNLOAD_HUB_CONFIG_V114.countryModes.join(",") === "single,multiple,all",
    DOWNLOAD_HUB_CONFIG_V114.countryModes.join(" · "),
    "단일 · 여러 국가 · 전체 대상국"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_DOWNLOAD_HIERARCHY",
    "152개 데이터 hierarchy 선택",
    DOWNLOAD_HUB_CONFIG_V114.hierarchy.join(",") ===
      "category,section,dataGroup,element",
    DOWNLOAD_HUB_CONFIG_V114.hierarchy.join(" → "),
    "대분류 → 세부항목 → 데이터 그룹 → 데이터 요소"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_DOWNLOAD_FORMATS",
    "다운로드 형식",
    DOWNLOAD_HUB_CONFIG_V114.formats.includes("CSV") &&
      DOWNLOAD_HUB_CONFIG_V114.formats.includes("JSON"),
    DOWNLOAD_HUB_CONFIG_V114.formats.join(" · "),
    "CSV · JSON"
  );
  addBooleanCheck(
    checks,
    "v114 다운로드 허브",
    "V114_DOWNLOAD_DATA_INTEGRITY",
    "다운로드 데이터 보존 규칙",
    DOWNLOAD_HUB_CONFIG_V114.emptyDownloadBlocked &&
      DOWNLOAD_HUB_CONFIG_V114.csvLayout === "long-format" &&
      DOWNLOAD_HUB_CONFIG_V114.jsonPreservesSourceSchema,
    `빈 파일 차단 ${
      DOWNLOAD_HUB_CONFIG_V114.emptyDownloadBlocked ? "O" : "X"
    } · CSV ${DOWNLOAD_HUB_CONFIG_V114.csvLayout} · JSON 원구조 ${
      DOWNLOAD_HUB_CONFIG_V114.jsonPreservesSourceSchema ? "O" : "X"
    }`,
    "빈 파일 금지 · long-format CSV · JSON 원자료 구조 보존"
  );

  onProgress?.("통합 협력지도 확인");
  const corePreset = PRESET_CONFIG_V114["core-evidence"];
  const uniqueLayerIds = new Set(MAP_LAYER_IDS_V114);
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_DEFAULT_PRESET",
    "핵심 통합 보기 기본 활성화",
    Boolean(corePreset) && corePreset.layers.length > 0,
    `${corePreset.label} · ${corePreset.layers.length}개 국가 집계 레이어`,
    "지도 진입 즉시 핵심 통합 보기"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_GEOMETRY",
    "실제 위치와 국가 집계 구분",
    MAP_GEOMETRY_POLICY_V114.countryAggregateLabel === "국가 단위 집계" &&
      MAP_GEOMETRY_POLICY_V114.verifiedPointLabel === "실제 위치 확인" &&
      MAP_GEOMETRY_POLICY_V114.inventedProjectCoordinatesAllowed === false,
    `${MAP_GEOMETRY_POLICY_V114.countryAggregateLabel} / ${MAP_GEOMETRY_POLICY_V114.verifiedPointLabel}`,
    "국가 집계와 실제 위치를 다른 공간 의미로 표시"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_NO_FAKE_POINTS",
    "가짜 프로젝트 좌표 없음",
    MAP_GEOMETRY_POLICY_V114.inventedProjectCoordinatesAllowed === false &&
      VERIFIED_LOCATIONS_V97.length === 0 &&
      VERIFIED_LOCATIONS_V98.length === 0,
    `임의좌표 허용 ${
      MAP_GEOMETRY_POLICY_V114.inventedProjectCoordinatesAllowed
        ? "예"
        : "아니오"
    } · 실제 위치자료 ${
      VERIFIED_LOCATIONS_V97.length + VERIFIED_LOCATIONS_V98.length
    }건`,
    "검증된 좌표가 없으면 실제 위치 점을 만들지 않음"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_LAYER_IDS",
    "지도 layer ID 중복 없음",
    uniqueLayerIds.size === MAP_LAYER_IDS_V114.length,
    `${uniqueLayerIds.size}/${MAP_LAYER_IDS_V114.length}`,
    "모든 layer ID 고유"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_SINGLE_INSTANCE",
    "지도 재생성 없는 layer 갱신 정책",
    MAP_INSTANCE_POLICY_V114 === "single-instance",
    MAP_INSTANCE_POLICY_V114,
    "Map 인스턴스 1회 생성 · source/layer 단위 갱신"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_FILTERS",
    "협력지도 공통 필터",
    MAP_FILTERS_V114.length === 5 &&
      MAP_FILTERS_V114.includes("country") &&
      MAP_FILTERS_V114.includes("organization") &&
      MAP_FILTERS_V114.includes("technology") &&
      MAP_FILTERS_V114.includes("project-status"),
    MAP_FILTERS_V114.join(" · "),
    "국가 · 기후기술 · 감축/적응 · 기관 · 사업상태"
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_RESET_CLEAR",
    "초기화·모두 지우기 동작 구분",
    MAP_RESET_POLICY_V114.reset === "core-evidence" &&
      MAP_RESET_POLICY_V114.clear === "optional-aggregates-only",
    `초기화 ${MAP_RESET_POLICY_V114.reset} · 모두 지우기 ${MAP_RESET_POLICY_V114.clear}`,
    "초기화는 핵심 통합 보기 · 모두 지우기는 선택 레이어 제거"
  );
  const evidenceDatasetIds = new Set(DATASETS.map((dataset) => dataset.id));
  const availableEvidenceDatasetIds = EVIDENCE_DATASET_IDS_V114.filter((id) =>
    evidenceDatasetIds.has(id)
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_EVIDENCE_LINKS",
    "국가 Evidence 패널 데이터 연결",
    availableEvidenceDatasetIds.length === EVIDENCE_DATASET_IDS_V114.length,
    `${availableEvidenceDatasetIds.length}/${EVIDENCE_DATASET_IDS_V114.length}`,
    "TNA/TAP · CTCN · GCF · AF · GEF · MDB · ODA 연결"
  );
  const selectedMapDataGroups = MAP_DATA_SELECTION_V114.filter(
    (item) => item.selected
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_CURATED_DATA",
    "협력사업 검토용 지도 데이터 선별",
    selectedMapDataGroups.length >= 8 &&
      selectedMapDataGroups.some((item) => item.role === "base-fill") &&
      selectedMapDataGroups.some((item) => item.role === "country-aggregate") &&
      selectedMapDataGroups.some((item) => item.role === "side-panel"),
    `${selectedMapDataGroups.length}개 데이터군`,
    "기초여건 · 국가집계 · 상세 패널 역할을 구분해 선별"
  );
  const worldBankMapSelected = WORLD_BANK_INDICATOR_MAP_REVIEW_V114.filter(
    (item) => item.selectedForMap
  );
  addBooleanCheck(
    checks,
    "v114 통합 지도",
    "V114_MAP_WB19_REVIEW",
    "World Bank 19개 지표 전수 선별",
    WORLD_BANK_INDICATOR_MAP_REVIEW_V114.length === 19 &&
      worldBankMapSelected.length > 0 &&
      WORLD_BANK_INDICATOR_MAP_REVIEW_V114.every((item) =>
        Boolean(item.reason)
      ),
    `검토 ${WORLD_BANK_INDICATOR_MAP_REVIEW_V114.length}/19 · 지도선정 ${worldBankMapSelected.length}`,
    "19개 전수 검토 · 지도 기본값과 데이터 상세 역할 구분"
  );

  const p0 = countStatus(checks, "FAIL");
  const p1 = countStatus(checks, "WARN");
  const overall = p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV114 = {
    schemaVersion: "v114",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      baselineSchemaVersion: "v113",
      datasets: DATASETS.length,
      publicNavigation: PUBLIC_NAVIGATION_V114.map((item) => item.label),
      comparison: {
        scalar: COMPARISON_CAPABILITIES_V114.scalarComparison,
        timeSeries: COMPARISON_CAPABILITIES_V114.timeSeriesComparison,
        policyMatrix: COMPARISON_CAPABILITIES_V114.policyMatrix,
        projectPortfolio:
          COMPARISON_CAPABILITIES_V114.projectPortfolioComparison,
        tnaStructured: COMPARISON_CAPABILITIES_V114.tnaStructuredComparison,
        csv: COMPARISON_CAPABILITIES_V114.csvDownload,
        json: COMPARISON_CAPABILITIES_V114.jsonDownload,
        maxPinnedCountries: COMPARISON_CAPABILITIES_V114.maxPinnedCountries,
      },
      downloadHub: {
        countryModes: DOWNLOAD_HUB_CONFIG_V114.countryModes.length,
        hierarchyLevels: DOWNLOAD_HUB_CONFIG_V114.hierarchy.length,
        formats: [...DOWNLOAD_HUB_CONFIG_V114.formats],
        periodModes: DOWNLOAD_HUB_CONFIG_V114.periodModes.length,
        emptyDownloadBlocked: DOWNLOAD_HUB_CONFIG_V114.emptyDownloadBlocked,
        jsonPreservesSourceSchema:
          DOWNLOAD_HUB_CONFIG_V114.jsonPreservesSourceSchema,
      },
      map: {
        defaultPreset: corePreset.label,
        defaultBaseIndicator: corePreset.baseIndicator,
        defaultAggregateLayers: corePreset.layers.length,
        layerIds: MAP_LAYER_IDS_V114.length,
        uniqueLayerIds: uniqueLayerIds.size,
        selectedDataGroups: selectedMapDataGroups.length,
        verifiedLocationsV97: VERIFIED_LOCATIONS_V97.length,
        verifiedLocationsV98: VERIFIED_LOCATIONS_V98.length,
        inventedCoordinatesAllowed:
          MAP_GEOMETRY_POLICY_V114.inventedProjectCoordinatesAllowed,
        evidenceDatasetsAvailable: availableEvidenceDatasetIds.length,
        evidenceDatasetsExpected: EVIDENCE_DATASET_IDS_V114.length,
      },
      baseline: baseline.facts,
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V114__?: WebSandboxQaResultV114;
      }
    ).__LDC_WEB_SANDBOX_QA_V114__ = result;
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

function overallLabel(overall: WebSandboxQaResultV114["overall"]): string {
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
    .qa-shell { max-width: 1360px; margin: 0 auto; padding: 28px 22px 56px; }
    .qa-top { display: flex; gap: 18px; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .qa-eyebrow { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #2f6b57; margin-bottom: 7px; }
    .qa-title { margin: 0; font-size: clamp(24px, 3vw, 36px); line-height: 1.2; }
    .qa-desc { margin: 8px 0 0; max-width: 900px; color: #52645f; line-height: 1.6; }
    .qa-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .qa-button { border: 1px solid #c8d6d1; background: #fff; color: #173d30; border-radius: 9px; padding: 10px 13px; font-weight: 700; cursor: pointer; text-decoration: none; }
    .qa-button.primary { background: #145d45; border-color: #145d45; color: white; }
    .qa-banner { border-radius: 14px; padding: 18px 20px; margin: 18px 0; border: 1px solid; }
    .qa-banner.ready { background: #edf8f2; border-color: #a9d3bd; }
    .qa-banner.warn { background: #fff8e8; border-color: #ead29a; }
    .qa-banner.fail { background: #fff0ef; border-color: #e5b5b0; }
    .qa-banner strong { display: block; font-size: 19px; margin-bottom: 4px; }
    .qa-progress { margin-top: 6px; color: #687a74; font-size: 13px; }
    .qa-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 18px 0 24px; }
    .qa-fact { background: white; border: 1px solid #dce5e1; border-radius: 12px; padding: 14px; }
    .qa-fact span { display: block; color: #687a74; font-size: 12px; margin-bottom: 5px; }
    .qa-fact strong { font-size: 21px; }
    .qa-table-wrap { background: #fff; border: 1px solid #dce5e1; border-radius: 14px; overflow: auto; }
    table { border-collapse: collapse; width: 100%; min-width: 960px; }
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
  result: WebSandboxQaResultV114 | null,
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

  const resultContent = result
    ? `
      <div class="qa-banner ${bannerClass}">
        <strong>${escapeHtml(overallLabel(result.overall))}</strong>
        <span>P0 ${result.p0} · P1 ${result.p1} · ${escapeHtml(
        new Date(result.generatedAt).toLocaleString("ko-KR")
      )}</span>
      </div>
      <div class="qa-facts">
        <div class="qa-fact"><span>Dataset</span><strong>${
          result.facts.datasets
        }</strong></div>
        <div class="qa-fact"><span>공개 메뉴</span><strong>${escapeHtml(
          result.facts.publicNavigation.join(" · ")
        )}</strong></div>
        <div class="qa-fact"><span>비교 형식</span><strong>수치·시계열·구조형</strong></div>
        <div class="qa-fact"><span>비교 고정국</span><strong>최대 ${
          result.facts.comparison.maxPinnedCountries
        }</strong></div>
        <div class="qa-fact"><span>다운로드 형식</span><strong>${escapeHtml(
          result.facts.downloadHub.formats.join(" · ")
        )}</strong></div>
        <div class="qa-fact"><span>지도 기본 보기</span><strong>${escapeHtml(
          result.facts.map.defaultPreset
        )}</strong></div>
        <div class="qa-fact"><span>지도 기본 레이어</span><strong>${
          result.facts.map.defaultAggregateLayers
        }</strong></div>
        <div class="qa-fact"><span>가짜 좌표</span><strong>${
          result.facts.map.inventedCoordinatesAllowed ? "허용" : "0건"
        }</strong></div>
        <div class="qa-fact"><span>Evidence 연결</span><strong>${
          result.facts.map.evidenceDatasetsAvailable
        }/${result.facts.map.evidenceDatasetsExpected}</strong></div>
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
      <p class="qa-footer-note">이 화면은 Web Sandbox의 내부 QA입니다. 공개 메뉴에는 노출하지 않으며 <strong>?qa=1</strong>로만 접근합니다. 외부 OECD·World Bank·ADB의 일시 장애는 내부 코드 결함과 분리해 WARN으로 기록합니다.</p>
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
          <h1 class="qa-title">개도국 전략지도 릴리스 점검 v114</h1>
          <p class="qa-desc">기존 v113 기준선과 함께 데이터 상세의 국가 비교, 단계형 데이터 다운로드, 통합 협력지도 및 좌표·금융 데이터 보존 규칙을 Terminal 없이 확인합니다.</p>
        </div>
        <div class="qa-actions">
          <button id="qa-rerun" class="qa-button primary" type="button">검사 다시 실행</button>
          <button id="qa-download" class="qa-button" type="button" ${
            result ? "" : "disabled"
          }>결과 JSON 저장</button>
          <a class="qa-button" href="${escapeHtml(
            appUrl.toString()
          )}">플랫폼으로 돌아가기</a>
        </div>
      </div>
      ${resultContent}
    </div>`;
}

function downloadResult(result: WebSandboxQaResultV114): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ldc-web-sandbox-qa-v114-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV114(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("qa") === "1";
}

export async function mountWebSandboxQaV114(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV114 | null = null;
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
      currentResult = await runWebSandboxFinalizationV114((message) => {
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
