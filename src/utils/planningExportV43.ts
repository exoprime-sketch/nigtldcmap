import type {
  PlanningBriefInput,
  PlanningBriefResult,
  PlanningEvidenceSource,
} from "../types/cooperationPlanning";

function sanitizeFileToken(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvCell(value: string): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function currentContextUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function downloadPlanningBriefMarkdown(
  input: PlanningBriefInput,
  brief: PlanningBriefResult
) {
  const generatedAt = new Date().toISOString();
  const markdown = [
    "# 기후기술 협력 사업기획 검토자료",
    "",
    `- 대상국: ${input.countryName}`,
    `- 기후기술: ${input.technologyName}`,
    `- 생성시각: ${generatedAt}`,
    `- 검토화면: ${currentContextUrl() || "-"}`,
    "",
    "## 검토 메모",
    "",
    brief.memoText,
    "",
    "## 근거자료 목록",
    "",
    ...(input.sources.length > 0
      ? input.sources.map(
          (source, index) =>
            `${index + 1}. **${source.title}** · ${source.relationLabel} · ${
              source.reference
            } · ${source.source}${
              source.sourceUrl ? ` · ${source.sourceUrl}` : ""
            }`
        )
      : ["현재 표시할 공개 근거자료 없음"]),
    "",
    "## 이용 유의사항",
    "",
    "- 플랫폼에 연결된 공개근거를 사업기획 초기 검토용으로 재구성한 자료",
    "- 협력 우선순위·사업성·성공 가능성 점수가 아님",
    "- 최종 투자·법률·조달·파트너 선정 판단 전 원 데이터와 최신 공식자료 재확인 필요",
  ].join("\n");

  const filename = `기후기술협력_검토자료_${sanitizeFileToken(
    input.countryName
  )}_${sanitizeFileToken(input.technologyName)}.md`;
  downloadBlob(filename, markdown, "text/markdown;charset=utf-8");
}

export function downloadEvidenceCsv(
  input: PlanningBriefInput,
  sources: PlanningEvidenceSource[]
) {
  const headers = [
    "대상국",
    "기후기술",
    "자료ID",
    "자료명",
    "연결구분",
    "기준시점",
    "출처기관",
    "원데이터URL",
    "검토화면URL",
  ];

  const rows = sources.map((source) => [
    input.countryName,
    input.technologyName,
    source.id,
    source.title,
    source.relationLabel,
    source.reference,
    source.source,
    source.sourceUrl || "",
    currentContextUrl(),
  ]);

  const csv =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map((value) => csvCell(String(value))).join(","))
      .join("\r\n");

  const filename = `기후기술협력_근거목록_${sanitizeFileToken(
    input.countryName
  )}_${sanitizeFileToken(input.technologyName)}.csv`;
  downloadBlob(filename, csv, "text/csv;charset=utf-8");
}
