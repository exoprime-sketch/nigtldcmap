import {
  formatIndicatorReferencePeriod,
  getIndicatorConfig,
} from "../data/indicators/registry";
import type { IndicatorId } from "../data/indicators/registry";
import type { Country } from "../types/country";
import type { Dataset } from "../types/dataset";
import type { IndicatorObservation } from "../types/indicator";
import { downloadBlob } from "./browser";

export type DownloadFormat = "CSV" | "JSON";

export interface IndicatorDownloadRequest {
  dataset: Dataset;
  indicatorId: IndicatorId;
  countries: Country[];
  observations: IndicatorObservation[];
  year: number;
  scope: "selected" | "full";
  selectedCountryIso3: string[];
  format: DownloadFormat;
  sourceLastUpdated: string | null;
}

export interface DownloadResult {
  rowCount: number;
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: string | number | boolean): string {
  const safeValue = protectSpreadsheetFormula(String(value));
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function buildCountrySelectionSlug(
  scope: IndicatorDownloadRequest["scope"],
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

function selectRows(request: IndicatorDownloadRequest) {
  const config = getIndicatorConfig(request.indicatorId);
  const selectedSet = new Set(request.selectedCountryIso3);
  const countryIndex = new Map(
    request.countries.map((country) => [country.iso3, country])
  );

  return request.observations
    .filter(
      (item) =>
        item.indicatorId === config.id &&
        item.year === request.year &&
        typeof item.value === "number" &&
        (request.scope === "full" || selectedSet.has(item.iso3))
    )
    .map((item) => {
      const country = countryIndex.get(item.iso3);
      return {
        countryIso3: item.iso3,
        countryNameKo: country?.nameKo ?? item.iso3,
        countryNameEn: country?.nameEn ?? item.iso3,
        region: country?.region ?? "",
        incomeLevel: country?.incomeLevel ?? "",
        referencePeriod: formatIndicatorReferencePeriod(config, item.year),
        year: item.year,
        value: item.value as number,
        unit: config.definition.unit,
      };
    })
    .sort((a, b) => a.countryNameKo.localeCompare(b.countryNameKo, "ko"));
}

export function downloadIndicatorData(
  request: IndicatorDownloadRequest
): DownloadResult {
  const config = getIndicatorConfig(request.indicatorId);
  const rows = selectRows(request);
  const selectionSlug = buildCountrySelectionSlug(
    request.scope,
    request.selectedCountryIso3
  );

  if (request.format === "JSON") {
    const payload = {
      metadata: {
        title: request.dataset.titleKo,
        indicator: config.definition.titleKo,
        unit: config.definition.unit,
        referencePeriod: formatIndicatorReferencePeriod(config, request.year),
        scenario: config.scenarioLabel ?? null,
        sourceOrganization: config.definition.sourceOrganization,
        sourceUrl: config.definition.sourceUrl,
        license: config.definition.license,
        sourceLastUpdated: request.sourceLastUpdated,
        limitations: request.dataset.limitations,
        generatedAt: new Date().toISOString(),
      },
      selection: {
        scope: request.scope === "full" ? "전체 제공 국가" : "선택 국가",
        countries:
          request.scope === "full" ? "all" : request.selectedCountryIso3,
      },
      data: rows,
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      `${config.id}-${selectionSlug}-${request.year}.json`
    );

    return { rowCount: rows.length };
  }

  const csvRows: Array<Array<string | number | boolean>> = [
    [
      "country_iso3",
      "country_name_ko",
      "country_name_en",
      "region",
      "income_level",
      "reference_period",
      "value",
      "unit",
      "source_organization",
      "source_url",
      "license",
    ],
    ...rows.map((row) => [
      row.countryIso3,
      row.countryNameKo,
      row.countryNameEn,
      row.region,
      row.incomeLevel,
      row.referencePeriod,
      row.value,
      row.unit,
      config.definition.sourceOrganization,
      config.definition.sourceUrl,
      config.definition.license,
    ]),
  ];

  const csv =
    "\uFEFF" +
    csvRows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");

  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${config.id}-${selectionSlug}-${request.year}.csv`
  );

  return { rowCount: rows.length };
}
