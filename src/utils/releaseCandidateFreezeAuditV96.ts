import type { Final152CompletionAuditV95 } from "./final152CompletionAuditV95";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

export type RcFreezeSeverityV96 = "P0" | "P1" | "INFO";

export interface RcFreezeIssueV96 {
  severity: RcFreezeSeverityV96;
  code: string;
  subject: string;
  message: string;
}

interface RcElementRowV96 {
  elementId: string;
  serviceMode: "actual_full" | "actual_partial" | "example_fallback";
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

interface RcManifestV96 {
  metadata: {
    version: string;
    releaseCandidateId: string;
    status: string;
    authoritativeElementCount: number;
    presentationReadyCount: number;
    actualLinkedElementCount: number;
    actualFullCount: number;
    actualPartialCount: number;
    exampleFallbackCount: number;
    mapReadyActualElementCount: number;
    compareReadyActualElementCount: number;
    insightReadyActualElementCount: number;
    downloadReadyActualElementCount: number;
    exampleEvidenceLeakCount: number;
  };
  elements: RcElementRowV96[];
}

export interface ReleaseCandidateFreezeResultV96 {
  status: "RC_FROZEN" | "BLOCKED";
  p0: number;
  p1: number;
  info: number;
  releaseCandidateId: string | null;
  facts: {
    authoritativeElements: number;
    presentationReady: number;
    actualLinked: number;
    exampleFallback: number;
    mapReady: number;
    compareReady: number;
    insightReady: number;
    downloadReady: number;
    exampleEvidenceLeakCount: number;
  };
  issues: RcFreezeIssueV96[];
}

const RC_MANIFEST_URL = publicAssetUrlV128(
  "data/registry/release-candidate-v96.json"
);

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} · HTTP ${response.status}`);
  return (await response.json()) as T;
}

function addIssue(
  issues: RcFreezeIssueV96[],
  severity: RcFreezeSeverityV96,
  code: string,
  subject: string,
  message: string
) {
  issues.push({ severity, code, subject, message });
}

export async function runReleaseCandidateFreezeAuditV96(
  v95Result: Final152CompletionAuditV95
): Promise<ReleaseCandidateFreezeResultV96> {
  const issues: RcFreezeIssueV96[] = [];
  let manifest: RcManifestV96 | null = null;

  if (
    v95Result.status !== "READY_FOR_RC" ||
    v95Result.p0 !== 0 ||
    v95Result.p1 !== 0
  ) {
    addIssue(
      issues,
      v95Result.p0 > 0 ? "P0" : "P1",
      "UPSTREAM_V95_NOT_READY",
      "v95",
      `v95 ${v95Result.status} · P0 ${v95Result.p0} · P1 ${v95Result.p1}`
    );
  }

  try {
    manifest = await fetchJson<RcManifestV96>(RC_MANIFEST_URL);
  } catch (error) {
    addIssue(
      issues,
      "P0",
      "RC_MANIFEST_LOAD_FAILED",
      RC_MANIFEST_URL,
      error instanceof Error ? error.message : "v96 RC manifest 로딩 실패"
    );
  }

  if (manifest) {
    const m = manifest.metadata;
    const rows = manifest.elements;
    const actual = rows.filter((row) => row.serviceMode !== "example_fallback");
    const example = rows.filter(
      (row) => row.serviceMode === "example_fallback"
    );
    const actualFull = actual.filter(
      (row) => row.serviceMode === "actual_full"
    );
    const actualPartial = actual.filter(
      (row) => row.serviceMode === "actual_partial"
    );
    const leaks = example.filter(
      (row) =>
        row.evidenceEligible ||
        row.actualDatasetCount > 0 ||
        row.mapReady ||
        row.compareReady ||
        row.insightReady ||
        row.downloadReady
    ).length;

    const ids = rows.map((row) => row.elementId);
    const uniqueIds = new Set(ids);

    if (
      m.version !== "v96" ||
      m.status !== "READY_FOR_RC" ||
      m.authoritativeElementCount !== 152 ||
      m.presentationReadyCount !== 152 ||
      rows.length !== 152 ||
      uniqueIds.size !== 152
    ) {
      addIssue(
        issues,
        "P0",
        "RC_152_INTEGRITY_FAILED",
        m.releaseCandidateId,
        "RC manifest의 152개 기준 항목·고유 ID·화면 제공 상태가 일치하지 않음"
      );
    }

    if (rows.some((row) => !row.finalPresentationReady)) {
      addIssue(
        issues,
        "P0",
        "RC_PRESENTATION_GAP",
        m.releaseCandidateId,
        "최종 화면 제공이 준비되지 않은 element가 존재"
      );
    }

    if (leaks > 0 || m.exampleEvidenceLeakCount !== 0) {
      addIssue(
        issues,
        "P0",
        "RC_EXAMPLE_EVIDENCE_LEAK",
        String(leaks),
        "예시 fallback이 실제 지도·국가비교·협력인사이트·다운로드 근거로 연결됨"
      );
    }

    const factsMatchV95 =
      m.actualLinkedElementCount === v95Result.facts.actualLinkedElements &&
      m.actualFullCount === v95Result.facts.actualFullElements &&
      m.actualPartialCount === v95Result.facts.actualPartialElements &&
      m.exampleFallbackCount === v95Result.facts.exampleFallbackElements &&
      m.mapReadyActualElementCount === v95Result.facts.mapReadyActualElements &&
      m.compareReadyActualElementCount ===
        v95Result.facts.compareReadyActualElements &&
      m.insightReadyActualElementCount ===
        v95Result.facts.insightReadyActualElements &&
      m.downloadReadyActualElementCount ===
        v95Result.facts.downloadableActualElements;

    const factsMatchRows =
      actual.length === m.actualLinkedElementCount &&
      actualFull.length === m.actualFullCount &&
      actualPartial.length === m.actualPartialCount &&
      example.length === m.exampleFallbackCount &&
      actual.filter((row) => row.mapReady).length ===
        m.mapReadyActualElementCount &&
      actual.filter((row) => row.compareReady).length ===
        m.compareReadyActualElementCount &&
      actual.filter((row) => row.insightReady).length ===
        m.insightReadyActualElementCount &&
      actual.filter((row) => row.downloadReady).length ===
        m.downloadReadyActualElementCount;

    if (!factsMatchV95 || !factsMatchRows) {
      addIssue(
        issues,
        "P0",
        "RC_BASELINE_DRIFT",
        m.releaseCandidateId,
        "v95 완료 Gate · v96 manifest · 152개 행별 집계가 서로 일치하지 않음"
      );
    }

    addIssue(
      issues,
      "INFO",
      "RC_FREEZE_SCOPE",
      m.releaseCandidateId,
      "이후 변경은 실제 데이터/출처 갱신·기술/좌표 연결·검색 동의어·P0/P1 수정으로 제한"
    );
  }

  const p0 = issues.filter((issue) => issue.severity === "P0").length;
  const p1 = issues.filter((issue) => issue.severity === "P1").length;
  const info = issues.filter((issue) => issue.severity === "INFO").length;

  const result: ReleaseCandidateFreezeResultV96 = {
    status: p0 === 0 && p1 === 0 ? "RC_FROZEN" : "BLOCKED",
    p0,
    p1,
    info,
    releaseCandidateId: manifest?.metadata.releaseCandidateId ?? null,
    facts: {
      authoritativeElements: manifest?.metadata.authoritativeElementCount ?? 0,
      presentationReady: manifest?.metadata.presentationReadyCount ?? 0,
      actualLinked: manifest?.metadata.actualLinkedElementCount ?? 0,
      exampleFallback: manifest?.metadata.exampleFallbackCount ?? 0,
      mapReady: manifest?.metadata.mapReadyActualElementCount ?? 0,
      compareReady: manifest?.metadata.compareReadyActualElementCount ?? 0,
      insightReady: manifest?.metadata.insightReadyActualElementCount ?? 0,
      downloadReady: manifest?.metadata.downloadReadyActualElementCount ?? 0,
      exampleEvidenceLeakCount:
        manifest?.metadata.exampleEvidenceLeakCount ?? 0,
    },
    issues,
  };

  const logger = result.status === "RC_FROZEN" ? console.info : console.error;
  logger(
    `[Release Candidate freeze v96] ${result.status} · ${
      result.releaseCandidateId ?? "NO_ID"
    } · ` +
      `P0 ${p0} · P1 ${p1} · 화면 ${result.facts.presentationReady}/${result.facts.authoritativeElements} · ` +
      `실제 ${result.facts.actualLinked} · 예시 ${result.facts.exampleFallback} · ` +
      `예시→실제근거 누출 ${result.facts.exampleEvidenceLeakCount}`
  );

  if (issues.length > 0) {
    console.groupCollapsed(
      `[Release Candidate freeze v96] issues ${issues.length}`
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
        __LDC_RC_FREEZE_V96__?: ReleaseCandidateFreezeResultV96;
      }
    ).__LDC_RC_FREEZE_V96__ = result;
  }

  return result;
}
