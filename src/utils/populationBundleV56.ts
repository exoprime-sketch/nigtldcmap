import type { Country } from "../types/country";
import { downloadBlob } from "./browser";
import type { DownloadFormat } from "./datasetDownload";

export interface PopulationBundleObservation {
  countryIso3: string;
  indicatorCode: string;
  indicatorName: string;
  year: number;
  value: number;
  unit: string;
}

interface WbRow {
  countryiso3code?: string;
  date: string;
  value: number | null;
}

const METRICS = [
  {
    code: "SP.POP.TOTL",
    name: "총인구",
    unit: "명",
  },
  {
    code: "SP.URB.TOTL.IN.ZS",
    name: "도시인구 비율",
    unit: "%",
  },
  {
    code: "SP.POP.GROW",
    name: "연간 인구증가율",
    unit: "%",
  },
] as const;

export async function loadPopulationBundle(): Promise<
  PopulationBundleObservation[]
> {
  const results = await Promise.all(
    METRICS.map(async (metric) => {
      const url = `https://api.worldbank.org/v2/country/all/indicator/${encodeURIComponent(
        metric.code
      )}?format=json&per_page=20000`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`World Bank 응답 오류 ${response.status}`);
      }

      const payload = (await response.json()) as [unknown, WbRow[]];
      const rows = Array.isArray(payload?.[1]) ? payload[1] : [];

      return rows
        .filter(
          (row) =>
            typeof row.value === "number" &&
            Boolean(row.countryiso3code) &&
            row.countryiso3code!.length === 3
        )
        .map((row) => ({
          countryIso3: row.countryiso3code!.toUpperCase(),
          indicatorCode: metric.code,
          indicatorName: metric.name,
          year: Number(row.date),
          value: row.value as number,
          unit: metric.unit,
        }))
        .filter((row) => Number.isFinite(row.year));
    })
  );

  return results.flat();
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  return `"${protectSpreadsheetFormula(String(value)).replace(/"/g, '""')}"`;
}

function buildPopulationSelectionSlug(
  scope: "selected" | "full",
  selectedCountryIso3: string[]
): string {
  if (scope === "full") return "all-countries";
  const clean = Array.from(
    new Set(
      selectedCountryIso3
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^[A-Z]{3}$/.test(value))
    )
  );
  if (clean.length === 1) return clean[0];
  return clean.length > 1 ? `${clean.length}-countries` : "selected-countries";
}

export function downloadPopulationBundle({
  observations,
  countries,
  selectedCountryIso3,
  scope,
  format,
}: {
  observations: PopulationBundleObservation[];
  countries: Country[];
  selectedCountryIso3: string[];
  scope: "selected" | "full";
  format: DownloadFormat;
}): number {
  const selected = new Set(selectedCountryIso3);
  const countryIndex = new Map(
    countries.map((country) => [country.iso3, country])
  );
  const selectionSlug = buildPopulationSelectionSlug(
    scope,
    selectedCountryIso3
  );

  const rows = observations
    .filter((row) => scope === "full" || selected.has(row.countryIso3))
    .map((row) => ({
      ...row,
      countryNameKo:
        countryIndex.get(row.countryIso3)?.nameKo ?? row.countryIso3,
      countryNameEn:
        countryIndex.get(row.countryIso3)?.nameEn ?? row.countryIso3,
    }))
    .sort(
      (a, b) =>
        a.countryNameKo.localeCompare(b.countryNameKo, "ko") ||
        a.indicatorName.localeCompare(b.indicatorName, "ko") ||
        a.year - b.year
    );

  if (format === "JSON") {
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            {
              metadata: {
                title: "국가 기본통계: 인구·도시화",
                sourceOrganization: "World Bank",
                license: "CC BY 4.0",
                generatedAt: new Date().toISOString(),
              },
              selection: {
                scope: scope === "full" ? "전체 제공 국가" : "선택 국가",
                countries: scope === "full" ? "all" : selectedCountryIso3,
              },
              data: rows,
            },
            null,
            2
          ),
        ],
        { type: "application/json;charset=utf-8" }
      ),
      `population-urbanization-${selectionSlug}.json`
    );
    return rows.length;
  }

  const csvRows = [
    [
      "country_iso3",
      "country_name_ko",
      "country_name_en",
      "indicator_code",
      "indicator_name",
      "year",
      "value",
      "unit",
      "source_organization",
      "license",
    ],
    ...rows.map((row) => [
      row.countryIso3,
      row.countryNameKo,
      row.countryNameEn,
      row.indicatorCode,
      row.indicatorName,
      row.year,
      row.value,
      row.unit,
      "World Bank",
      "CC BY 4.0",
    ]),
  ];

  const csv =
    "\uFEFF" +
    csvRows
      .map((row) => row.map((value) => csvCell(value)).join(","))
      .join("\n");

  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `population-urbanization-${selectionSlug}.csv`
  );

  return rows.length;
}
