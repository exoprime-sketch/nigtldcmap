import type { Dataset } from "../types/dataset";

export type ComparisonModeV114 = "same-year" | "latest-by-country";
export type ComparisonViewV114 = "chart" | "table" | "trend";
export type ComparisonDownloadFormatV114 = "CSV" | "JSON";

export interface ComparisonExportRowV114 {
  dataset_id: string;
  element_id: string;
  element_name: string;
  country: string;
  country_iso3: string;
  year: number | null;
  date: string | null;
  value: number | string | null;
  unit: string | null;
  source: string;
  source_url: string;
  as_of: string | null;
  comparison_mode: string;
  record_type: string;
  organization?: string | null;
  status?: string | null;
  flow_type?: string | null;
  note?: string | null;
  record_json?: unknown;
}

export const COMPARISON_CAPABILITIES_V114 = {
  scalarComparison: true,
  timeSeriesComparison: true,
  policyMatrix: true,
  projectPortfolioComparison: true,
  tnaStructuredComparison: true,
  sameYearModePreservesActualYear: true,
  latestModePreservesActualYear: true,
  csvDownload: true,
  jsonDownload: true,
  maxPinnedCountries: 4,
} as const;

export const STRUCTURED_COMPARISON_ELEMENT_IDS_V114 = new Set([
  "C-001",
  "C-002",
  "C-003",
  "C-004",
  "C-005",
  "D-011",
  "D-018",
  "D-019",
  "D-020",
  "D-021",
  "D-023",
]);

export function supportsStructuredComparisonV114(
  elementId: string,
  datasets: Dataset[]
): boolean {
  if (STRUCTURED_COMPARISON_ELEMENT_IDS_V114.has(elementId)) return true;
  return datasets.filter((dataset) => Boolean(dataset.indicatorId)).length > 1;
}

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toComparisonCsvV114(rows: ComparisonExportRowV114[]): string {
  const headers: Array<keyof ComparisonExportRowV114> = [
    "dataset_id",
    "element_id",
    "element_name",
    "country",
    "country_iso3",
    "year",
    "date",
    "value",
    "unit",
    "source",
    "source_url",
    "as_of",
    "comparison_mode",
    "record_type",
    "organization",
    "status",
    "flow_type",
    "note",
    "record_json",
  ];
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    ),
  ].join("\r\n");
}

function triggerDownload(filename: string, body: string, mime: string): void {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadComparisonRowsV114(
  rows: ComparisonExportRowV114[],
  format: ComparisonDownloadFormatV114,
  filenameBase: string,
  metadata?: Record<string, unknown>
): void {
  if (!rows.length) return;
  const safeBase =
    filenameBase
      .trim()
      .replace(/[^0-9A-Za-z가-힣._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "comparison";

  if (format === "JSON") {
    triggerDownload(
      `${safeBase}.json`,
      `${JSON.stringify(
        {
          schema_version: "v114",
          generated_at: new Date().toISOString(),
          metadata: metadata ?? {},
          records: rows,
        },
        null,
        2
      )}\n`,
      "application/json"
    );
    return;
  }

  triggerDownload(
    `${safeBase}.csv`,
    `\uFEFF${toComparisonCsvV114(rows)}`,
    "text/csv"
  );
}

export function formatCompactNumberV114(
  value: number | null,
  unit = ""
): string {
  if (value == null || !Number.isFinite(value)) return "자료 없음";
  const formatted = new Intl.NumberFormat("ko-KR", {
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 2,
  }).format(value);
  return `${formatted}${unit}`;
}

export function formatUsdV114(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "금액 미공개";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
