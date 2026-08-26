import type { VietnamDemoElement } from "../types/vietnamDemo";

export type ResearchRecordType = "all" | "paper" | "patent" | "cooperation";

export function isResearchInnovationElementV70(
  element: VietnamDemoElement
): boolean {
  return element.elementId === "E-008";
}

export function getResearchPrimaryLabelV70(): string {
  return "연구·혁신 데이터";
}

export const RESEARCH_RECORD_TYPE_OPTIONS: Array<{
  value: ResearchRecordType;
  label: string;
}> = [
  { value: "all", label: "전체 자료" },
  { value: "paper", label: "논문" },
  { value: "patent", label: "특허" },
  { value: "cooperation", label: "국제협력" },
];

export function getResearchRecordTypeLabelV70(
  value: ResearchRecordType
): string {
  return (
    RESEARCH_RECORD_TYPE_OPTIONS.find((item) => item.value === value)?.label ??
    value
  );
}
