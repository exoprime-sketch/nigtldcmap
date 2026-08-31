import {
  loadVietnamBundleIndexV121,
  loadVietnamCatalogV121,
  loadVietnamElementBundleV121,
  loadVietnamManifestV121,
  loadVietnamMapIndexV121,
  loadVietnamQualityReportV121,
  loadVietnamSearchIndexV121,
  loadVietnamSourceRegistryV121,
} from "../data/vietnam/vietnamDataLoaderV121";
import { VIETNAM_DATA_RUNTIME_VERSION_V121 } from "../data/vietnam/vietnamTypesV121";
import {
  availableDataCountryIso3V122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import {
  COUNTRY_DATA_RUNTIME_VERSION_V122,
  PLATFORM_RELEASE_V122,
} from "../data/countries/countryDataTypesV122";
import type {
  VietnamBundleIndexV121,
  VietnamManifestV121,
  VietnamQualityReportV121,
} from "../data/vietnam/vietnamTypesV121";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

interface AssetIntegrityV121R2 {
  schemaVersion: "v121";
  runtimeVersion: "v121r2-json-envelope";
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  bundleIndexPresent: boolean;
  bundleIndexElementCount: number;
  packCount: number;
  packFiles: number;
  searchIndexPackCount: number;
  sourceRegistryPackCount: number;
  missingPackFiles: number;
  unreferencedPacks: number;
  missingElementAssignments: number;
  duplicatedElementAssignments: number;
  zeroByteAssets: number;
  htmlFallbackResponses: number;
  malformedJsonFiles: number;
  emptyJsonFiles: number;
  oldShardUrlReferences: number;
  legacyVnb64References: number;
  publicInternalCodeExposures: number;
  publicTechnicalErrorExposures: number;
  unresolvedRelativeImports: number;
  dotPrefixedPaths: number;
  finalProjectFileCount: number;
  codesandboxLimit: number;
  codesandboxFileHeadroom: number;
  d015StaticLoadReady: boolean;
  platformRelease?: "v122";
  dataSchemaVersion?: "v121";
  countryRuntimeVersion?: "country-data-runtime-v1";
  registeredCountryProviders?: number;
  assetContractMismatches?: number;
  missingAssets?: number;
  usedButUndefinedCssClasses?: number;
  publicCountryHardcodes?: number;
  hardcodedVnmPublicActions?: number;
  mapBaseConfigured?: boolean;
  mapDefaultActiveLayers?: number;
}

export type WebSandboxQaStatusV121 = "PASS" | "WARN" | "FAIL";

export interface WebSandboxQaCheckV121 {
  section: string;
  code: string;
  label: string;
  status: WebSandboxQaStatusV121;
  actual: string;
  expected: string;
  note?: string;
}

export interface WebSandboxQaResultV121 {
  schemaVersion: "v121";
  platformRelease: "v122";
  dataSchemaVersion: "v121";
  countryRuntimeVersion: "country-data-runtime-v1";
  runtimeVersion: "v121r2-json-envelope";
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  htmlFallbackResponses: number;
  zeroByteAssets: number;
  publicInternalCodeExposures: number;
  publicTechnicalErrorExposures: number;
  elementsTested: number;
  elementsFailed: number;
  registeredCountryProviders: number;
  availableDataCountries: string[];
  assetContractMismatches: number;
  missingAssets: number;
  usedButUndefinedCssClasses: number;
  publicCountryHardcodes: number;
  mapBaseReady: boolean;
  mapDefaultActiveLayers: number;
  p0Failures: number;
  checks: WebSandboxQaCheckV121[];
  facts: {
    manifest: VietnamManifestV121;
    quality: VietnamQualityReportV121["summary"];
    bundleIndexElements: number;
    packCount: number;
    catalogElements: number;
    searchIndexElements: number;
    mapLayers: number;
    mapFeatures: number;
    metadata: number;
    observations: number;
    entities: number;
    finalProjectFileCount: number;
    codesandboxFileHeadroom: number;
    assetIntegrity: AssetIntegrityV121R2;
  };
}

function addCheck(
  checks: WebSandboxQaCheckV121[],
  section: string,
  code: string,
  label: string,
  pass: boolean,
  actual: string | number,
  expected: string | number,
  note?: string,
  warnOnly = false
): void {
  checks.push({
    section,
    code,
    label,
    status: pass ? "PASS" : warnOnly ? "WARN" : "FAIL",
    actual: String(actual),
    expected: String(expected),
    note,
  });
}

async function loadAssetIntegrity(): Promise<AssetIntegrityV121R2> {
  const response = await fetch(
    publicAssetUrlV128("data/vietnam/v1/asset-integrity.json"),
    {
      cache: "no-store",
    }
  );
  const text = await response.text();
  if (!response.ok || /^(?:\s*<!doctype html|\s*<html)/i.test(text)) {
    throw new Error("asset-integrity.json을 불러오지 못했습니다");
  }
  return JSON.parse(text) as AssetIntegrityV121R2;
}

export async function runWebSandboxFinalizationV121(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV121> {
  const checks: WebSandboxQaCheckV121[] = [];
  onProgress?.("manifest와 정적 자산 index를 확인하고 있습니다");

  const [manifest, quality, index, catalog, layers, integrity] =
    await Promise.all([
      loadVietnamManifestV121(),
      loadVietnamQualityReportV121(),
      loadVietnamBundleIndexV121(),
      loadVietnamCatalogV121(),
      loadVietnamMapIndexV121(),
      loadAssetIntegrity(),
    ]);

  addCheck(
    checks,
    "P0 · 자산",
    "RUNTIME_VERSION",
    "정적 자산 runtime",
    manifest.runtimeVersion === VIETNAM_DATA_RUNTIME_VERSION_V121,
    manifest.runtimeVersion,
    VIETNAM_DATA_RUNTIME_VERSION_V121
  );
  addCheck(
    checks,
    "P0 · 자산",
    "ELEMENT_ASSIGNMENT",
    "데이터 요소 배정",
    index.elementCount === 152 && Object.keys(index.elements).length === 152,
    Object.keys(index.elements).length,
    152
  );
  addCheck(
    checks,
    "P0 · 자산",
    "PACK_COUNT",
    "정적 데이터 pack",
    index.packs.length === index.packCount &&
      index.packCount === manifest.packCount,
    index.packs.length,
    manifest.packCount
  );
  const providers = listCountryDataProvidersV122();
  const availableDataCountries = availableDataCountryIso3V122();
  addCheck(
    checks,
    "P0 · 플랫폼",
    "PLATFORM_RELEASE",
    "플랫폼 릴리스",
    manifest.platformRelease === PLATFORM_RELEASE_V122,
    manifest.platformRelease || "미표기",
    PLATFORM_RELEASE_V122
  );
  addCheck(
    checks,
    "P0 · 플랫폼",
    "COUNTRY_PROVIDER",
    "국가 데이터 provider",
    providers.length >= 1 && availableDataCountries.length >= 1,
    `${providers.length}개 / ${availableDataCountries.join(", ")}`,
    "1개 이상"
  );

  onProgress?.("검색색인과 출처정보를 확인하고 있습니다");
  const [searchIndex, sourceRegistry] = await Promise.all([
    loadVietnamSearchIndexV121(),
    loadVietnamSourceRegistryV121<{
      schemaVersion: "v121";
      sources: unknown[];
    }>(),
  ]);
  addCheck(
    checks,
    "P0 · 자산",
    "SEARCH_INDEX",
    "검색색인 요소",
    searchIndex.size === 152,
    searchIndex.size,
    152
  );
  addCheck(
    checks,
    "P0 · 자산",
    "SOURCE_REGISTRY",
    "출처정보 자산",
    sourceRegistry?.schemaVersion === "v121" &&
      Array.isArray(sourceRegistry.sources) &&
      sourceRegistry.sources.length > 0,
    Array.isArray(sourceRegistry?.sources) ? sourceRegistry.sources.length : 0,
    "1개 이상"
  );

  let tested = 0;
  let failed = 0;
  let metadata = 0;
  let observations = 0;
  let entities = 0;
  const elementIds = Object.keys(index.elements).sort();
  for (const elementId of elementIds) {
    try {
      const bundle = await loadVietnamElementBundleV121(elementId);
      tested += 1;
      metadata += bundle.meta.indicators.length;
      observations += bundle.observations.recordCount;
      entities += bundle.entities.recordCount;
      if (
        bundle.meta.element.elementId !== elementId ||
        bundle.observations.elementId !== elementId ||
        bundle.entities.elementId !== elementId
      ) {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("v121 QA element load failed", elementId, error);
    }
    if ((tested + failed) % 10 === 0) {
      onProgress?.(`데이터 요소를 확인하고 있습니다 · ${tested + failed}/152`);
    }
  }

  addCheck(
    checks,
    "P0 · 데이터",
    "ELEMENT_LOAD",
    "152개 요소 불러오기",
    tested === 152 && failed === 0,
    `${tested} 성공 / ${failed} 실패`,
    "152 성공 / 0 실패"
  );
  addCheck(
    checks,
    "P0 · 데이터",
    "ROW_TOTALS",
    "공개 데이터 행수",
    metadata === index.totals.metadata &&
      observations === index.totals.observations &&
      entities === index.totals.entities,
    `${metadata}/${observations}/${entities}`,
    `${index.totals.metadata}/${index.totals.observations}/${index.totals.entities}`
  );
  const d015 = await loadVietnamElementBundleV121("D-015").catch(
    (reason: unknown) => {
      console.error("v121 QA D-015 load failed", reason);
      return null;
    }
  );
  const d015Counts = d015
    ? `${d015.meta.indicators.length}/${d015.observations.recordCount}/${d015.entities.recordCount}`
    : "load failed";
  addCheck(
    checks,
    "P0 · 데이터",
    "D015_LOAD",
    "대량 사업자료 불러오기",
    Boolean(
      d015 &&
        d015.meta.indicators.length === 10 &&
        d015.observations.recordCount === 9 &&
        d015.entities.recordCount === 650
    ),
    d015Counts,
    "10/9/650"
  );

  const mapFeatures = layers.reduce(
    (sum, layer) => sum + layer.featureCount,
    0
  );
  addCheck(
    checks,
    "P0 · 지도",
    "MAP_INDEX",
    "지도 레이어",
    layers.length === manifest.mapLayerCount &&
      mapFeatures === manifest.mapFeatureCount,
    `${layers.length} / ${mapFeatures}`,
    `${manifest.mapLayerCount} / ${manifest.mapFeatureCount}`
  );

  const integrityChecks: Array<[string, string, number, number]> = [
    ["ZERO_BYTE", "빈 정적 자산", integrity.zeroByteAssets, 0],
    ["HTML_FALLBACK", "HTML fallback 응답", integrity.htmlFallbackResponses, 0],
    ["MISSING_PACK", "누락 pack", integrity.missingPackFiles, 0],
    ["UNASSIGNED", "미배정 요소", integrity.missingElementAssignments, 0],
    ["DUPLICATED", "중복 배정 요소", integrity.duplicatedElementAssignments, 0],
    ["MALFORMED_JSON", "JSON 형식 오류", integrity.malformedJsonFiles, 0],
    ["OLD_SHARD", "구형 shard 경로", integrity.oldShardUrlReferences, 0],
    ["VNB64", "구형 사용자 정의 자산", integrity.legacyVnb64References, 0],
    ["IMPORTS", "상대경로 import 누락", integrity.unresolvedRelativeImports, 0],
    [
      "PUBLIC_CODES",
      "공개화면 내부코드",
      integrity.publicInternalCodeExposures,
      0,
    ],
    [
      "PUBLIC_ERRORS",
      "공개화면 기술오류",
      integrity.publicTechnicalErrorExposures,
      0,
    ],
  ];
  integrityChecks.forEach(([code, label, actual, expected]) =>
    addCheck(
      checks,
      "P0 · 무결성",
      code,
      label,
      actual === expected,
      actual,
      expected
    )
  );
  addCheck(
    checks,
    "P0 · 플랫폼",
    "ASSET_CONTRACT",
    "자산 경로 계약",
    (integrity.assetContractMismatches || 0) === 0 &&
      (integrity.missingAssets || 0) === 0,
    `${integrity.assetContractMismatches || 0}건 / ${
      integrity.missingAssets || 0
    }건`,
    "0건 / 0건"
  );
  addCheck(
    checks,
    "P0 · UI",
    "CSS_CONTRACT",
    "공개화면 CSS 계약",
    (integrity.usedButUndefinedCssClasses || 0) === 0,
    integrity.usedButUndefinedCssClasses || 0,
    0
  );
  addCheck(
    checks,
    "P0 · UI",
    "COUNTRY_HARDCODE",
    "공통화면 국가 고정문구",
    (integrity.publicCountryHardcodes || 0) === 0 &&
      (integrity.hardcodedVnmPublicActions || 0) === 0,
    `${integrity.publicCountryHardcodes || 0}건 / ${
      integrity.hardcodedVnmPublicActions || 0
    }건`,
    "0건 / 0건"
  );
  addCheck(
    checks,
    "P0 · 지도",
    "MAP_BASE",
    "배경지도 구성",
    integrity.mapBaseConfigured === true,
    integrity.mapBaseConfigured ? "구성됨" : "미구성",
    "구성됨"
  );
  addCheck(
    checks,
    "P0 · 지도",
    "MAP_DEFAULT_LAYER",
    "지도 최초 활성 레이어",
    (integrity.mapDefaultActiveLayers || 0) === 0,
    integrity.mapDefaultActiveLayers || 0,
    0
  );

  addCheck(
    checks,
    "P0 · 배포",
    "FILE_LIMIT",
    "CodeSandbox 파일 수",
    integrity.finalProjectFileCount <= 450 &&
      integrity.codesandboxFileHeadroom >= 50,
    `${integrity.finalProjectFileCount}개 / 여유 ${integrity.codesandboxFileHeadroom}개`,
    "450개 이하 / 여유 50개 이상"
  );

  const p0 = checks.filter((item) => item.status === "FAIL").length;
  const p1 = checks.filter((item) => item.status === "WARN").length;
  const overall: WebSandboxQaResultV121["overall"] =
    p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV121 = {
    schemaVersion: "v121",
    platformRelease: PLATFORM_RELEASE_V122,
    dataSchemaVersion: "v121",
    countryRuntimeVersion: COUNTRY_DATA_RUNTIME_VERSION_V122,
    runtimeVersion: VIETNAM_DATA_RUNTIME_VERSION_V121,
    assetLayoutVersion: "gzip-base64-json-envelope-v2",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    htmlFallbackResponses: integrity.htmlFallbackResponses,
    zeroByteAssets: integrity.zeroByteAssets,
    publicInternalCodeExposures: integrity.publicInternalCodeExposures,
    publicTechnicalErrorExposures: integrity.publicTechnicalErrorExposures,
    elementsTested: tested,
    elementsFailed: failed,
    registeredCountryProviders: providers.length,
    availableDataCountries,
    assetContractMismatches: integrity.assetContractMismatches || 0,
    missingAssets: integrity.missingAssets || 0,
    usedButUndefinedCssClasses: integrity.usedButUndefinedCssClasses || 0,
    publicCountryHardcodes: integrity.publicCountryHardcodes || 0,
    mapBaseReady: integrity.mapBaseConfigured === true,
    mapDefaultActiveLayers: integrity.mapDefaultActiveLayers || 0,
    p0Failures: p0,
    checks,
    facts: {
      manifest,
      quality: quality.summary,
      bundleIndexElements: Object.keys(index.elements).length,
      packCount: index.packCount,
      catalogElements: catalog.length,
      searchIndexElements: searchIndex.size,
      mapLayers: layers.length,
      mapFeatures,
      metadata,
      observations,
      entities,
      finalProjectFileCount: integrity.finalProjectFileCount,
      codesandboxFileHeadroom: integrity.codesandboxFileHeadroom,
      assetIntegrity: integrity,
    },
  };

  (
    window as Window & { __LDC_WEB_SANDBOX_QA_V121__?: WebSandboxQaResultV121 }
  ).__LDC_WEB_SANDBOX_QA_V121__ = result;
  return result;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function qaStyle(): string {
  return `
    *{box-sizing:border-box}body{margin:0;background:#f3f7f5;color:#17372d;font-family:Arial,"Noto Sans KR",sans-serif}
    .qa-shell{width:min(1500px,calc(100% - 28px));margin:0 auto;padding:28px 0 50px}.qa-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.qa-title{margin:4px 0 8px}.qa-actions{display:flex;gap:8px;flex-wrap:wrap}.qa-button{border:1px solid #a9beb5;background:#fff;border-radius:8px;padding:9px 12px;color:#17372d;text-decoration:none;cursor:pointer}.qa-button.primary{background:#176a4b;color:#fff;border-color:#176a4b}.qa-banner{margin:20px 0;padding:16px;border-radius:10px;background:#fff;border:1px solid #cfddd7;display:flex;gap:12px}.qa-banner.ready{border-color:#7fc29f}.qa-banner.blocked{border-color:#e59a90;background:#fff4f2}.qa-facts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0}.qa-fact{background:#fff;border:1px solid #dbe5e1;padding:12px;border-radius:9px}.qa-fact span,.qa-fact strong{display:block}.qa-table{overflow:auto;background:#fff;border:1px solid #dbe5e1;border-radius:10px}.qa-table table{width:100%;border-collapse:collapse}.qa-table th,.qa-table td{padding:10px;border-bottom:1px solid #e7eeeb;text-align:left;vertical-align:top}.qa-status{font-weight:700}.qa-status.PASS{color:#147144}.qa-status.WARN{color:#936200}.qa-status.FAIL{color:#b33a2f}@media(max-width:800px){.qa-top{display:block}.qa-facts{grid-template-columns:1fr 1fr}}
  `;
}

function buildQaHtml(
  result: WebSandboxQaResultV121 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const content = result
    ? `<div class="qa-banner ${
        result.overall === "READY" ? "ready" : "blocked"
      }"><strong>${escapeHtml(result.overall)}</strong><span>P0 ${
        result.p0
      } · P1 ${result.p1}</span></div>
        <div class="qa-facts">
          <div class="qa-fact"><span>요소</span><strong>${
            result.elementsTested
          }</strong></div>
          <div class="qa-fact"><span>pack</span><strong>${
            result.facts.packCount
          }</strong></div>
          <div class="qa-fact"><span>관측값</span><strong>${
            result.facts.observations
          }</strong></div>
          <div class="qa-fact"><span>개체자료</span><strong>${
            result.facts.entities
          }</strong></div>
          <div class="qa-fact"><span>파일 수</span><strong>${
            result.facts.finalProjectFileCount
          }</strong></div>
        </div>
        <div class="qa-table"><table><thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead><tbody>${result.checks
          .map(
            (check) =>
              `<tr><td>${escapeHtml(
                check.section
              )}</td><td><span class="qa-status ${check.status}">${
                check.status
              }</span></td><td><strong>${escapeHtml(
                check.label
              )}</strong><br><small>${escapeHtml(
                check.code
              )}</small></td><td>${escapeHtml(
                check.actual
              )}</td><td>${escapeHtml(check.expected)}</td><td>${escapeHtml(
                check.note || "-"
              )}</td></tr>`
          )
          .join("")}</tbody></table></div>`
    : `<div class="qa-banner blocked"><strong>${
        error ? "검사 오류" : "검사 중"
      }</strong><span>${escapeHtml(error || progress)}</span></div>`;
  return `<style>${qaStyle()}</style><div class="qa-shell"><div class="qa-top"><div><small>INTERNAL QA</small><h1 class="qa-title">Web Sandbox 점검</h1><p>정적 자산, 데이터 전수성, 공개화면 분리와 파일 수를 확인합니다</p></div><div class="qa-actions"><button id="qa-rerun" class="qa-button primary">검사 다시 실행</button><button id="qa-download" class="qa-button" ${
    result ? "" : "disabled"
  }>결과 JSON 저장</button><a class="qa-button" href="${escapeHtml(
    appUrl.toString()
  )}">플랫폼으로 돌아가기</a></div></div>${content}</div>`;
}

function downloadResult(result: WebSandboxQaResultV121): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `web-sandbox-qa-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV121(): boolean {
  return new URLSearchParams(window.location.search).get("qa") === "1";
}

export async function mountWebSandboxQaV121(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV121 | null = null;
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
      currentResult = await runWebSandboxFinalizationV121((message) =>
        render(message)
      );
    } catch (reason) {
      console.error("v121 QA failed", reason);
      render(
        "검사가 중단되었습니다",
        reason instanceof Error ? reason.message : "알 수 없는 검사 오류"
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
