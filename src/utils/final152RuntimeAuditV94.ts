import { getFinal152UploadAuditV93 } from "./final152UploadAuditV93";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

interface V94ManifestRow {
  elementId: string;
  serviceMode: "actual_full" | "actual_partial" | "example_fallback";
  expectedDemoStatus: "actual_connected" | "demo_only";
  actualDatasetIds: string[];
}

interface V94Manifest {
  metadata: {
    version: string;
    authoritativeElementCount: number;
    actualConnectedElementCount: number;
    exampleFallbackElementCount: number;
  };
  elements: V94ManifestRow[];
}

interface DemoElementV94 {
  elementId: string;
  status: "actual_connected" | "demo_only";
}

interface DemoPayloadV94 {
  meta: {
    registryElementCount: number;
    actualConnectedCount: number;
    demoOnlyCount: number;
  };
  elements: DemoElementV94[];
}

export interface Final152RuntimeIssueV94 {
  severity: "P0" | "P1" | "INFO";
  code: string;
  subject: string;
  message: string;
}

export interface Final152RuntimeAuditV94 {
  status: "PASS" | "CONDITIONALLY_READY" | "FAIL";
  p0: number;
  p1: number;
  info: number;
  facts: {
    authoritativeElements: number;
    manifestElements: number;
    actualConnectedElements: number;
    exampleFallbackElements: number;
    verifiedLocalFiles: number;
  };
  issues: Final152RuntimeIssueV94[];
}

const MANIFEST_URL = publicAssetUrlV128(
  "data/registry/final-152-upload-manifest-v94.json"
);
const DEMO_URL = publicAssetUrlV128("data/demo/vietnam-full-load-v48.json");

const REQUIRED_LOCAL_DATA_FILES = [
  publicAssetUrlV128("data/world-countries.geojson"),
  publicAssetUrlV128("data/cckp/heat-index-hi35-country.json"),
  publicAssetUrlV128("data/solar/country-solar-potential.json"),
  publicAssetUrlV128("data/ndc/ndc-technology-priorities.json"),
  publicAssetUrlV128("data/gcf/gcf-country-portfolio-2026-07-31.json"),
  publicAssetUrlV128("data/gcf/gcf-priority-country-projects-2026-08-11.json"),
  publicAssetUrlV128(
    "data/platform/organizations/E-003__gcf-vnm-organizations__20260806.json"
  ),
  publicAssetUrlV128("data/policy/policy-document-previews.json"),
  DEMO_URL,
  MANIFEST_URL,
] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} · HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function runFinal152RuntimeAuditV94(): Promise<Final152RuntimeAuditV94> {
  const issues: Final152RuntimeIssueV94[] = [];
  const base = getFinal152UploadAuditV93();

  base.issues.forEach((issue) => {
    if (issue.severity === "P0" || issue.severity === "P1") {
      issues.push({ ...issue });
    }
  });

  let manifest: V94Manifest | null = null;
  let demo: DemoPayloadV94 | null = null;

  try {
    manifest = await fetchJson<V94Manifest>(MANIFEST_URL);
  } catch (error) {
    issues.push({
      severity: "P0",
      code: "V94_MANIFEST_LOAD_FAILED",
      subject: MANIFEST_URL,
      message:
        error instanceof Error ? error.message : "152개 manifest 로딩 실패",
    });
  }

  try {
    demo = await fetchJson<DemoPayloadV94>(DEMO_URL);
  } catch (error) {
    issues.push({
      severity: "P0",
      code: "V94_DEMO_LOAD_FAILED",
      subject: DEMO_URL,
      message:
        error instanceof Error ? error.message : "예시 payload 로딩 실패",
    });
  }

  if (manifest) {
    if (manifest.elements.length !== 152) {
      issues.push({
        severity: "P0",
        code: "V94_MANIFEST_COUNT",
        subject: String(manifest.elements.length),
        message: "최종 152개 manifest 행 수가 152와 일치하지 않음",
      });
    }

    const ids = manifest.elements.map((row) => row.elementId);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      issues.push({
        severity: "P0",
        code: "V94_MANIFEST_DUPLICATE",
        subject: Array.from(new Set(duplicates)).join(", "),
        message: "최종 manifest에 중복 elementId 존재",
      });
    }
  }

  if (manifest && demo) {
    const demoById = new Map(demo.elements.map((row) => [row.elementId, row]));
    manifest.elements.forEach((row) => {
      const demoRow = demoById.get(row.elementId);
      if (!demoRow) {
        issues.push({
          severity: "P0",
          code: "V94_DEMO_ELEMENT_MISSING",
          subject: row.elementId,
          message: "152개 상세 예시 payload에 해당 element가 없음",
        });
        return;
      }
      if (demoRow.status !== row.expectedDemoStatus) {
        issues.push({
          severity: "P1",
          code: "V94_DEMO_STATUS_STALE",
          subject: row.elementId,
          message: `manifest ${row.expectedDemoStatus} / demo ${demoRow.status}`,
        });
      }
    });

    const actual = manifest.elements.filter(
      (row) => row.serviceMode !== "example_fallback"
    ).length;
    const example = manifest.elements.length - actual;

    if (
      demo.meta.registryElementCount !== manifest.elements.length ||
      demo.meta.actualConnectedCount !== actual ||
      demo.meta.demoOnlyCount !== example
    ) {
      issues.push({
        severity: "P1",
        code: "V94_DEMO_META_STALE",
        subject: "vietnam-full-load-v48.json",
        message:
          "예시 payload의 actual/demo 집계가 현재 서비스 manifest와 일치하지 않음",
      });
    }
  }

  let verifiedLocalFiles = 0;
  const localChecks = await Promise.allSettled(
    REQUIRED_LOCAL_DATA_FILES.map(async (url) => {
      await fetchJson<unknown>(url);
      return url;
    })
  );
  localChecks.forEach((result, index) => {
    if (result.status === "fulfilled") {
      verifiedLocalFiles += 1;
    } else {
      issues.push({
        severity: "P0",
        code: "V94_LOCAL_DATA_FILE_FAILED",
        subject: REQUIRED_LOCAL_DATA_FILES[index],
        message:
          result.reason instanceof Error
            ? result.reason.message
            : "필수 로컬 데이터 파일 확인 실패",
      });
    }
  });

  // optional snapshot: 없는 경우에도 World Bank API → 코드 내 최소 fallback 경로가 있어 차단하지 않음.
  try {
    const countriesUrl = publicAssetUrlV128("data/worldbank/countries.json");
    const response = await fetch(countriesUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      issues.push({
        severity: "INFO",
        code: "OPTIONAL_COUNTRY_SNAPSHOT_MISSING",
        subject: countriesUrl,
        message:
          "선택적 국가목록 로컬 snapshot 없음 · World Bank API 실패 시 코드 내 우선국 fallback 사용",
      });
    }
  } catch {
    issues.push({
      severity: "INFO",
      code: "OPTIONAL_COUNTRY_SNAPSHOT_MISSING",
      subject: publicAssetUrlV128("data/worldbank/countries.json"),
      message:
        "선택적 국가목록 로컬 snapshot 없음 · World Bank API 실패 시 코드 내 우선국 fallback 사용",
    });
  }

  const p0 = issues.filter((issue) => issue.severity === "P0").length;
  const p1 = issues.filter((issue) => issue.severity === "P1").length;
  const info = issues.filter((issue) => issue.severity === "INFO").length;
  const manifestCount = manifest?.elements.length ?? 0;
  const actualCount =
    manifest?.elements.filter((row) => row.serviceMode !== "example_fallback")
      .length ?? 0;

  const result: Final152RuntimeAuditV94 = {
    status: p0 > 0 ? "FAIL" : p1 > 0 ? "CONDITIONALLY_READY" : "PASS",
    p0,
    p1,
    info,
    facts: {
      authoritativeElements: base.facts.authoritativeElements,
      manifestElements: manifestCount,
      actualConnectedElements: actualCount,
      exampleFallbackElements: Math.max(0, manifestCount - actualCount),
      verifiedLocalFiles,
    },
    issues,
  };

  const logger = result.status === "FAIL" ? console.error : console.info;
  logger(
    `[Final 152 runtime audit v94] ${result.status} · P0 ${p0} · P1 ${p1} · ` +
      `실제연결 ${actualCount} · 예시 fallback ${result.facts.exampleFallbackElements} · ` +
      `필수 로컬파일 ${verifiedLocalFiles}/${REQUIRED_LOCAL_DATA_FILES.length}`
  );

  if (issues.length > 0) {
    console.groupCollapsed(
      `[Final 152 runtime audit v94] issues ${issues.length}`
    );
    issues.forEach((issue) => {
      const fn =
        issue.severity === "P0"
          ? console.error
          : issue.severity === "P1"
          ? console.warn
          : console.info;
      fn(
        `[${issue.severity}] ${issue.code} · ${issue.subject} · ${issue.message}`
      );
    });
    console.groupEnd();
  }

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_FINAL_152_V94__?: Final152RuntimeAuditV94;
      }
    ).__LDC_FINAL_152_V94__ = result;
  }

  return result;
}
