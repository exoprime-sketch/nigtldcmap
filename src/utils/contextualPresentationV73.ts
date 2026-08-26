import type { VietnamDemoElement } from "../types/vietnamDemo";

export type ContextualElementKind =
  | "season"
  | "climatology"
  | "disaster"
  | "ndc"
  | "safety"
  | "permitting"
  | "partnership";

const PUBLIC_TITLES: Record<string, string> = {
  "B-001": "건기·우기 계절성",
  "B-003": "기온·강수 계절분포",
  "B-012": "재해·재난 발생 이력",
  "C-001": "NDC 제출·목표·이행 근거",
  "C-011": "치안·여행안전 현황",
  "C-014": "환경영향평가(EIA)·인허가 요건",
  "E-015": "NDC Partnership 참여·지원 현황",
};

const PRIMARY_LABELS: Record<string, string> = {
  "B-001": "계절성",
  "B-003": "기후 평년값",
  "B-012": "재해 이력",
  "C-001": "NDC 핵심정보",
  "C-011": "안전 현황",
  "C-014": "인허가 요건",
  "E-015": "참여·지원",
};

const KINDS: Record<string, ContextualElementKind> = {
  "B-001": "season",
  "B-003": "climatology",
  "B-012": "disaster",
  "C-001": "ndc",
  "C-011": "safety",
  "C-014": "permitting",
  "E-015": "partnership",
};

export function isContextualElementV73(element: VietnamDemoElement): boolean {
  return Boolean(KINDS[element.elementId]);
}

export function getContextualKindV73(
  elementId: string
): ContextualElementKind | null {
  return KINDS[elementId] ?? null;
}

export function getContextualPublicTitleV73(elementId: string): string | null {
  return PUBLIC_TITLES[elementId] ?? null;
}

export function getContextualPrimaryLabelV73(elementId: string): string | null {
  return PRIMARY_LABELS[elementId] ?? null;
}
