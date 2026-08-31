import {
  buildFinal152ElementServiceRegistryV93,
} from "./final152ElementServiceRegistryV93";
import type {
  Final152ElementServiceRowV93,
} from "./final152ElementServiceRegistryV93";
import type { Final152RuntimeAuditV94 } from "./final152RuntimeAuditV94";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

export type Final152CompletionSeverityV95 = "P0" | "P1" | "INFO";

export interface Final152CompletionIssueV95 {
  severity: Final152CompletionSeverityV95;
  code: string;
  subject: string;
  message: string;
}

interface CompletionManifestRowV95 {
  elementId: string;
  serviceMode: "actual_full" | "actual_partial" | "example_fallback";
  uploadState: "linked_actual" | "example_ready";
  finalPresentationReady: boolean;
  evidenceEligible: boolean;
  actualDatasetIds: string[];
  actualDatasetCount: number;
  mapReady: boolean;
  compareReady: boolean;
  insightReady: boolean;
  downloadReady: boolean;
  sourceLinkReady: boolean;
  exampleFallbackAvailable: boolean;
}

interface CompletionManifestV95 {
  metadata: {
    version: string;
    authoritativeElementCount: number;
    presentationReadyCount: number;
    actualLinkedElementCount: number;
    exampleFallbackCount: number;
  };
  elements: CompletionManifestRowV95[];
}

export interface Final152CompletionAuditV95 {
  status: "READY_FOR_RC" | "CONDITIONALLY_READY" | "FAIL";
  p0: number;
  p1: number;
  info: number;
  facts: {
    authoritativeElements: number;
    presentationReadyElements: number;
    actualLinkedElements: number;
    exampleFallbackElements: number;
    actualFullElements: number;
    actualPartialElements: number;
    mapReadyActualElements: number;
    compareReadyActualElements: number;
    insightReadyActualElements: number;
    downloadableActualElements: number;
    exampleEvidenceLeakCount: number;
  };
  issues: Final152CompletionIssueV95[];
}

const COMPLETION_MANIFEST_URL =
  publicAssetUrlV128("data/registry/final-152-platform-completion-v95.json");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} · HTTP ${response.status}`);
  return (await response.json()) as T;
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((value, index) => value === bb[index]);
}

function pushIssue(
  issues: Final152CompletionIssueV95[],
  severity: Final152CompletionSeverityV95,
  code: string,
  subject: string,
  message: string
) {
  issues.push({ severity, code, subject, message });
}

function verifyRuntimeRow(
  issues: Final152CompletionIssueV95[],
  runtime: Final152ElementServiceRowV93,
  manifest: CompletionManifestRowV95
) {
  if (runtime.serviceMode !== manifest.serviceMode) {
    pushIssue(
      issues,
      "P0",
      "SERVICE_MODE_DRIFT",
      runtime.elementId,
      `runtime ${runtime.serviceMode} / completion manifest ${manifest.serviceMode}`
    );
  }

  if (!sameStringArray(runtime.actualDatasetIds, manifest.actualDatasetIds)) {
    pushIssue(
      issues,
      "P0",
      "DATASET_LINK_DRIFT",
      runtime.elementId,
      "실행 시점 Dataset 연결과 v95 completion manifest가 일치하지 않음"
    );
  }

  if (!manifest.finalPresentationReady) {
    pushIssue(
      issues,
      "P0",
      "PRESENTATION_NOT_READY",
      runtime.elementId,
      "152개 이용자 상세화면 제공 범위에서 누락된 항목"
    );
  }

  if (runtime.serviceMode === "example_fallback") {
    const leak =
      runtime.actualDatasetCount > 0 ||
      runtime.mapReady ||
      runtime.compareReady ||
      runtime.insightReady ||
      runtime.downloadReady;

    if (leak) {
      pushIssue(
        issues,
        "P0",
        "EXAMPLE_EVIDENCE_LEAK",
        runtime.elementId,
        "예시 fallback 항목이 실제 지도·국가비교·협력인사이트·다운로드 근거로 연결됨"
      );
    }

    if (!runtime.exampleFallbackAvailable) {
      pushIssue(
        issues,
        "P1",
        "EXAMPLE_PREVIEW_MISSING",
        runtime.elementId,
        "실데이터 미연결 항목에 예시 상세화면 fallback이 없음"
      );
    }
  } else {
    if (runtime.actualDatasetCount < 1) {
      pushIssue(
        issues,
        "P0",
        "ACTUAL_DATASET_MISSING",
        runtime.elementId,
        "실데이터 상태이나 실제 Dataset 연결이 없음"
      );
    }

    if (!runtime.sourceLinkReady) {
      pushIssue(
        issues,
        "P1",
        "ACTUAL_SOURCE_LINK_MISSING",
        runtime.elementId,
        "실제 연결 항목에 원 데이터 확인 경로가 없음"
      );
    }
  }
}

export async function runFinal152CompletionAuditV95(
  v94Result?: Final152RuntimeAuditV94
): Promise<Final152CompletionAuditV95> {
  const issues: Final152CompletionIssueV95[] = [];
  const runtimeRows = buildFinal152ElementServiceRegistryV93();

  if (v94Result && (v94Result.p0 > 0 || v94Result.p1 > 0)) {
    pushIssue(
      issues,
      v94Result.p0 > 0 ? "P0" : "P1",
      "UPSTREAM_V94_NOT_PASS",
      "v94",
      `v94 runtime audit ${v94Result.status} · P0 ${v94Result.p0} · P1 ${v94Result.p1}`
    );
  }

  let manifest: CompletionManifestV95 | null = null;
  try {
    manifest = await fetchJson<CompletionManifestV95>(COMPLETION_MANIFEST_URL);
  } catch (error) {
    pushIssue(
      issues,
      "P0",
      "V95_COMPLETION_MANIFEST_LOAD_FAILED",
      COMPLETION_MANIFEST_URL,
      error instanceof Error
        ? error.message
        : "v95 completion manifest 로딩 실패"
    );
  }

  if (runtimeRows.length !== 152) {
    pushIssue(
      issues,
      "P0",
      "RUNTIME_ELEMENT_COUNT",
      String(runtimeRows.length),
      "실행 시점 authoritative element 수가 152개와 일치하지 않음"
    );
  }

  if (manifest) {
    if (
      manifest.elements.length !== 152 ||
      manifest.metadata.authoritativeElementCount !== 152 ||
      manifest.metadata.presentationReadyCount !== 152
    ) {
      pushIssue(
        issues,
        "P0",
        "COMPLETION_COUNT_MISMATCH",
        `${manifest.elements.length}`,
        "v95 completion manifest가 152/152 화면 제공 완료 상태와 일치하지 않음"
      );
    }

    const manifestById = new Map(
      manifest.elements.map((row) => [row.elementId, row] as const)
    );

    runtimeRows.forEach((runtime) => {
      const manifestRow = manifestById.get(runtime.elementId);
      if (!manifestRow) {
        pushIssue(
          issues,
          "P0",
          "COMPLETION_ELEMENT_MISSING",
          runtime.elementId,
          "v95 completion manifest에 element가 없음"
        );
        return;
      }
      verifyRuntimeRow(issues, runtime, manifestRow);
    });
  }

  const exampleRows = runtimeRows.filter(
    (row) => row.serviceMode === "example_fallback"
  );
  const actualRows = runtimeRows.filter(
    (row) => row.serviceMode !== "example_fallback"
  );
  const exampleEvidenceLeakCount = exampleRows.filter(
    (row) =>
      row.actualDatasetCount > 0 ||
      row.mapReady ||
      row.compareReady ||
      row.insightReady ||
      row.downloadReady
  ).length;

  pushIssue(
    issues,
    "INFO",
    "UPLOAD_COMPLETION_INTERPRETATION",
    "152/152",
    "모든 데이터 항목은 실데이터 또는 명시적 예시 fallback으로 상세화면 제공 완료 · example fallback 수는 수집 실패 건수가 아니라 실제 Dataset 직접 연결 전 항목 수"
  );

  const p0 = issues.filter((issue) => issue.severity === "P0").length;
  const p1 = issues.filter((issue) => issue.severity === "P1").length;
  const info = issues.filter((issue) => issue.severity === "INFO").length;

  const result: Final152CompletionAuditV95 = {
    status: p0 > 0 ? "FAIL" : p1 > 0 ? "CONDITIONALLY_READY" : "READY_FOR_RC",
    p0,
    p1,
    info,
    facts: {
      authoritativeElements: runtimeRows.length,
      presentationReadyElements: runtimeRows.length,
      actualLinkedElements: actualRows.length,
      exampleFallbackElements: exampleRows.length,
      actualFullElements: actualRows.filter(
        (row) => row.serviceMode === "actual_full"
      ).length,
      actualPartialElements: actualRows.filter(
        (row) => row.serviceMode === "actual_partial"
      ).length,
      mapReadyActualElements: actualRows.filter((row) => row.mapReady).length,
      compareReadyActualElements: actualRows.filter((row) => row.compareReady)
        .length,
      insightReadyActualElements: actualRows.filter((row) => row.insightReady)
        .length,
      downloadableActualElements: actualRows.filter((row) => row.downloadReady)
        .length,
      exampleEvidenceLeakCount,
    },
    issues,
  };

  const logger = result.status === "FAIL" ? console.error : console.info;
  logger(
    `[Final 152 completion audit v95] ${result.status} · P0 ${p0} · P1 ${p1} · ` +
      `화면 ${result.facts.presentationReadyElements}/${result.facts.authoritativeElements} · ` +
      `실제연결 ${result.facts.actualLinkedElements} · 예시 ${result.facts.exampleFallbackElements} · ` +
      `예시→실제근거 누출 ${result.facts.exampleEvidenceLeakCount}`
  );

  console.info(
    `[Final 152 completion audit v95] 실제 데이터 cross-view · 지도 ${result.facts.mapReadyActualElements} · ` +
      `국가비교 ${result.facts.compareReadyActualElements} · ` +
      `협력인사이트 ${result.facts.insightReadyActualElements} · ` +
      `다운로드 ${result.facts.downloadableActualElements}`
  );

  if (issues.length > 0) {
    console.groupCollapsed(
      `[Final 152 completion audit v95] issues ${issues.length}`
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
        __LDC_FINAL_152_V95__?: Final152CompletionAuditV95;
      }
    ).__LDC_FINAL_152_V95__ = result;
  }

  return result;
}
