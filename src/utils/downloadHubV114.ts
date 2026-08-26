import {
  getIndicatorConfig,
  isIndicatorId,
  loadIndicatorData,
} from "../data/indicators/registry";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { Dataset } from "../types/dataset";
import type { VietnamDemoElement } from "../types/vietnamDemo";
import { COOPERATION_POLICY_EVIDENCE_V109 } from "../data/policy/cooperationPolicyEvidenceV109";
import { loadNdcTechnologyPriorities } from "../data/policy/ndcTechnologyPriorities";
import { TNA_COUNTRY_PROFILES_V110 } from "../data/policy/tnaTechnologyNeedsV110";
import { getInternationalSupportRecordsV112 } from "../data/support/internationalSupportV112";
import { loadGcfPriorityProjectsV80 } from "../data/gcf/gcfPriorityProjectsV80";
import { fetchOecdOdaCountryV113 } from "../services/oecdOdaApiV113";
import { fetchMdbCountryPortfolioV113 } from "../services/mdbProjectsApiV113";

export type DownloadHubFormatV114 = "CSV" | "JSON";
export type DownloadHubPeriodModeV114 = "latest" | "year" | "range" | "all";

export interface DownloadHubPeriodV114 {
  mode: DownloadHubPeriodModeV114;
  year: number | null;
  fromYear: number | null;
  toYear: number | null;
}

export interface DownloadHubRowV114 {
  dataset_id: string;
  element_id: string;
  element_name: string;
  country: string;
  iso3: string;
  year: number | null;
  date: string | null;
  value: number | string | null;
  unit: string | null;
  record_type: string;
  flow_type: string | null;
  organization: string | null;
  status: string | null;
  source: string;
  source_url: string;
  as_of: string | null;
  license: string | null;
  note: string | null;
  raw: unknown;
}

export interface DownloadHubElementResultV114 {
  elementId: string;
  elementName: string;
  datasets: Array<{
    id: string;
    titleKo: string;
    sourceOrganization: string;
    sourceUrl: string;
    license: string;
    referenceYear: string;
  }>;
  rows: DownloadHubRowV114[];
  rawRecords: unknown[];
  warnings: string[];
}

export interface DownloadHubBundleV114 {
  schemaVersion: "v114";
  generatedAt: string;
  countries: string[];
  period: DownloadHubPeriodV114;
  elements: DownloadHubElementResultV114[];
  rows: DownloadHubRowV114[];
  warnings: string[];
}

export const DOWNLOAD_HUB_CONFIG_V114 = {
  countryModes: ["single", "multiple", "all"],
  hierarchy: ["category", "section", "dataGroup", "element"],
  formats: ["CSV", "JSON"],
  periodModes: ["latest", "year", "range", "all"],
  emptyDownloadBlocked: true,
  csvLayout: "long-format",
  jsonPreservesSourceSchema: true,
  oldCompareRouteTarget: "download",
} as const;

const STRUCTURED_DOWNLOAD_ELEMENT_IDS = new Set([
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

const POLICY_KIND_BY_ELEMENT: Record<string, "btr" | "nap" | "lt-leds"> = {
  "C-002": "btr",
  "C-003": "nap",
  "C-004": "lt-leds",
};

function priorityCountryName(iso3: string): string {
  return PRIORITY_COUNTRIES.find((item) => item.iso3 === iso3)?.nameKo ?? iso3;
}

export function isDownloadHubElementSupportedV114(
  elementId: string,
  datasets: Dataset[]
): boolean {
  if (STRUCTURED_DOWNLOAD_ELEMENT_IDS.has(elementId)) return true;
  return datasets.some((dataset) => isIndicatorId(dataset.indicatorId));
}

export function isDownloadHubElementTimeSeriesV114(
  datasets: Dataset[]
): boolean {
  return datasets.some((dataset) => isIndicatorId(dataset.indicatorId));
}

function includeYear(year: number, period: DownloadHubPeriodV114): boolean {
  if (period.mode === "all" || period.mode === "latest") return true;
  if (period.mode === "year") return period.year === year;
  const from = period.fromYear ?? -Infinity;
  const to = period.toYear ?? Infinity;
  return year >= from && year <= to;
}

function latestByCountry<
  T extends { iso3: string; year: number; value: number | null }
>(records: T[]): T[] {
  const latest = new Map<string, T>();
  records.forEach((record) => {
    if (typeof record.value !== "number") return;
    const current = latest.get(record.iso3);
    if (!current || record.year > current.year) latest.set(record.iso3, record);
  });
  return Array.from(latest.values());
}

function datasetMeta(dataset: Dataset) {
  return {
    id: dataset.id,
    titleKo: dataset.titleKo,
    sourceOrganization: dataset.sourceOrganization,
    sourceUrl: dataset.sourceUrl,
    license: dataset.license,
    referenceYear: dataset.referenceYear,
  };
}

async function collectIndicatorElement(
  element: VietnamDemoElement,
  datasets: Dataset[],
  countrySet: Set<string>,
  period: DownloadHubPeriodV114
): Promise<DownloadHubElementResultV114> {
  const rows: DownloadHubRowV114[] = [];
  const rawRecords: unknown[] = [];
  const warnings: string[] = [];
  for (const dataset of datasets) {
    if (!isIndicatorId(dataset.indicatorId)) continue;
    const config = getIndicatorConfig(dataset.indicatorId);
    try {
      const result = await loadIndicatorData(config.id);
      if (result.warning)
        warnings.push(`${dataset.titleKo}: ${result.warning}`);
      let observations = result.observations.filter(
        (item) => countrySet.has(item.iso3) && typeof item.value === "number"
      );
      if (period.mode === "latest") {
        observations = latestByCountry(observations);
      } else {
        observations = observations.filter((item) =>
          includeYear(item.year, period)
        );
      }
      observations.forEach((item) => {
        const row = {
          dataset_id: dataset.id,
          element_id: element.elementId,
          element_name: element.title,
          country: priorityCountryName(item.iso3),
          iso3: item.iso3,
          year: item.year,
          date: null,
          value: item.value,
          unit: config.definition.unit,
          record_type: "indicator",
          flow_type: null,
          organization: config.definition.sourceOrganization,
          status: null,
          source: config.definition.sourceOrganization,
          source_url: config.definition.sourceUrl,
          as_of: result.lastUpdated,
          license: config.definition.license,
          note: result.referencePeriod ?? null,
          raw: item,
        } as DownloadHubRowV114;
        rows.push(row);
        rawRecords.push({ datasetId: dataset.id, observation: item });
      });
    } catch (error) {
      warnings.push(
        `${dataset.titleKo}: ${
          error instanceof Error ? error.message : "자료를 불러오지 못했습니다"
        }`
      );
    }
  }
  return {
    elementId: element.elementId,
    elementName: element.title,
    datasets: datasets.map(datasetMeta),
    rows,
    rawRecords,
    warnings,
  };
}

async function collectStructuredElement(
  element: VietnamDemoElement,
  datasets: Dataset[],
  countrySet: Set<string>
): Promise<DownloadHubElementResultV114> {
  const selectedCountries = PRIORITY_COUNTRIES.filter((item) =>
    countrySet.has(item.iso3)
  );
  const rows: DownloadHubRowV114[] = [];
  const rawRecords: unknown[] = [];
  const warnings: string[] = [];
  const primaryDataset = datasets[0];
  const baseSource =
    primaryDataset?.sourceOrganization ?? element.effectiveSource;
  const baseUrl = primaryDataset?.sourceUrl ?? element.sourceUrl ?? "";
  const baseLicense = primaryDataset?.license ?? null;

  if (element.elementId === "C-001") {
    try {
      const data = await loadNdcTechnologyPriorities();
      data.data
        .filter((record) => countrySet.has(record.iso3))
        .forEach((record) => {
          rows.push({
            dataset_id: primaryDataset?.id ?? data.metadata.datasetId,
            element_id: element.elementId,
            element_name: element.title,
            country: record.countryNameKo,
            iso3: record.iso3,
            year: Number(record.submissionDate.slice(0, 4)) || null,
            date: record.submissionDate,
            value: record.priorities.length,
            unit: "기술근거 건",
            record_type: "policy-document",
            flow_type: null,
            organization: "UNFCCC",
            status: record.priorityReviewStatus ?? null,
            source: data.metadata.sourceOrganization,
            source_url: record.officialUrl,
            as_of: data.metadata.referenceDate,
            license: baseLicense,
            note: record.ndcTitle,
            raw: record,
          });
          rawRecords.push(record);
        });
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : "NDC 자료를 불러오지 못했습니다"
      );
    }
  } else if (POLICY_KIND_BY_ELEMENT[element.elementId]) {
    const kind = POLICY_KIND_BY_ELEMENT[element.elementId];
    COOPERATION_POLICY_EVIDENCE_V109.filter(
      (record) => record.kind === kind && countrySet.has(record.countryIso3)
    ).forEach((record) => {
      rows.push({
        dataset_id: primaryDataset?.id ?? "",
        element_id: element.elementId,
        element_name: element.title,
        country: record.countryNameKo,
        iso3: record.countryIso3,
        year: record.documentYear ?? null,
        date: record.submissionDate ?? null,
        value: record.statusLabelKo,
        unit: null,
        record_type: "policy-document",
        flow_type: null,
        organization: "UNFCCC",
        status: record.status,
        source: baseSource,
        source_url: record.documentUrl ?? record.portalUrl,
        as_of: record.sourceAsOf,
        license: baseLicense,
        note: record.evidenceSummaryKo,
        raw: record,
      });
      rawRecords.push(record);
    });
  } else if (element.elementId === "C-005") {
    TNA_COUNTRY_PROFILES_V110.filter((profile) =>
      countrySet.has(profile.countryIso3)
    ).forEach((profile) => {
      profile.technologies.forEach((record) => {
        rows.push({
          dataset_id: primaryDataset?.id ?? "LDC-DS-C-005-TNA",
          element_id: element.elementId,
          element_name: element.title,
          country: profile.countryNameKo,
          iso3: profile.countryIso3,
          year: null,
          date: null,
          value: record.sourceTechnologyNameKo,
          unit: null,
          record_type: "technology-demand",
          flow_type: record.track,
          organization: "UNFCCC TT:CLEAR",
          status: record.selectedForTap ? "TAP 포함" : "TNA 우선기술",
          source: "UNFCCC TT:CLEAR",
          source_url: record.sourceUrl,
          as_of: profile.sourceReviewAsOf,
          license: baseLicense,
          note: record.mappedTechnologyId
            ? `관련 기후기술: ${record.mappedTechnologyId}`
            : null,
          raw: record,
        });
        rawRecords.push({ countryIso3: profile.countryIso3, ...record });
      });
    });
  } else if (["D-018", "D-019", "D-023"].includes(element.elementId)) {
    selectedCountries.forEach((country) => {
      const all = getInternationalSupportRecordsV112(country.iso3);
      const filtered =
        element.elementId === "D-018"
          ? all.filter((item) => item.sourceOrganization === "Adaptation Fund")
          : element.elementId === "D-019"
          ? all.filter((item) => item.sourceOrganization === "CTCN")
          : all;
      filtered.forEach((record) => {
        rows.push({
          dataset_id: primaryDataset?.id ?? "",
          element_id: element.elementId,
          element_name: element.title,
          country: country.nameKo,
          iso3: country.iso3,
          year: record.approvalDate
            ? Number(record.approvalDate.slice(0, 4)) || null
            : null,
          date: record.approvalDate,
          value: record.approvedAmountUsd,
          unit: record.approvedAmountUsd == null ? null : "USD",
          record_type: "international-support",
          flow_type: record.financingInstrument,
          organization: record.sourceOrganization,
          status: record.status,
          source: record.sourceOrganization,
          source_url: record.sourceUrl,
          as_of: record.verifiedAt,
          license: baseLicense,
          note: record.projectTitle,
          raw: record,
        });
        rawRecords.push(record);
      });
    });
  } else if (element.elementId === "D-020") {
    try {
      const data = await loadGcfPriorityProjectsV80();
      data.records
        .filter((record) => countrySet.has(record.countryIso3))
        .forEach((record) => {
          rows.push({
            dataset_id: primaryDataset?.id ?? data.metadata.datasetId,
            element_id: element.elementId,
            element_name: element.title,
            country: record.countryNameKo,
            iso3: record.countryIso3,
            year: null,
            date: null,
            value: record.title,
            unit: null,
            record_type: "gcf-project",
            flow_type: null,
            organization: record.entity,
            status: record.status,
            source: "Green Climate Fund",
            source_url: record.projectUrl,
            as_of: data.metadata.referenceDate,
            license: baseLicense,
            note: record.multiCountry ? "다국가 사업" : "단일국가 사업",
            raw: record,
          });
          rawRecords.push(record);
        });
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? error.message
          : "GCF 사업자료를 불러오지 못했습니다"
      );
    }
  } else if (element.elementId === "D-011") {
    const settled = await Promise.allSettled(
      selectedCountries.map((country) => fetchOecdOdaCountryV113(country.iso3))
    );
    settled.forEach((result, index) => {
      const country = selectedCountries[index];
      if (result.status === "rejected") {
        warnings.push(
          `${country.nameKo}: OECD ODA 자료를 일시적으로 불러오지 못했습니다`
        );
        return;
      }
      const data = result.value;
      [...data.disbursements, ...data.commitments].forEach((record) => {
        rows.push({
          dataset_id: primaryDataset?.id ?? "LDC-DS-D-011-OECD-ODA",
          element_id: element.elementId,
          element_name: element.title,
          country: country.nameKo,
          iso3: country.iso3,
          year: record.year,
          date: null,
          value: record.value,
          unit: record.unitLabel,
          record_type: "oda-flow",
          flow_type: record.flow,
          organization: record.donorName,
          status: null,
          source: "OECD",
          source_url:
            record.flow === "disbursement"
              ? data.sourceUrls.disbursement
              : data.sourceUrls.commitment,
          as_of: null,
          license: baseLicense,
          note: record.priceBaseLabel,
          raw: record,
        });
        rawRecords.push(record);
      });
    });
  } else if (element.elementId === "D-021") {
    const settled = await Promise.allSettled(
      selectedCountries.map((country) =>
        fetchMdbCountryPortfolioV113(country.iso3)
      )
    );
    settled.forEach((result, index) => {
      const country = selectedCountries[index];
      if (result.status === "rejected") {
        warnings.push(
          `${country.nameKo}: MDB 프로젝트 자료를 일시적으로 불러오지 못했습니다`
        );
        return;
      }
      const data = result.value;
      [...data.worldBank, ...data.adb].forEach((record) => {
        rows.push({
          dataset_id: primaryDataset?.id ?? "LDC-DS-D-002",
          element_id: element.elementId,
          element_name: element.title,
          country: country.nameKo,
          iso3: country.iso3,
          year: record.approvalDate
            ? Number(record.approvalDate.slice(0, 4)) || null
            : null,
          date: record.approvalDate,
          value: record.title,
          unit: null,
          record_type: "mdb-project",
          flow_type: null,
          organization: record.organization,
          status: record.status,
          source: record.organization,
          source_url: record.sourceUrl,
          as_of: null,
          license: baseLicense,
          note: `commitment_usd=${
            record.commitmentUsd ?? ""
          }; disbursement_usd=${record.disbursementUsd ?? ""}`,
          raw: record,
        });
        rawRecords.push(record);
      });
      if (data.adbCoverage === "not_applicable") {
        rawRecords.push({
          countryIso3: country.iso3,
          adbCoverage: "not_applicable",
        });
      }
    });
  }

  return {
    elementId: element.elementId,
    elementName: element.title,
    datasets: datasets.map(datasetMeta),
    rows,
    rawRecords,
    warnings,
  };
}

export async function collectDownloadHubBundleV114(
  selections: Array<{ element: VietnamDemoElement; datasets: Dataset[] }>,
  countryIso3: string[],
  period: DownloadHubPeriodV114
): Promise<DownloadHubBundleV114> {
  const countrySet = new Set(countryIso3);
  const settled = await Promise.allSettled(
    selections.map(({ element, datasets }) =>
      datasets.some((dataset) => isIndicatorId(dataset.indicatorId))
        ? collectIndicatorElement(element, datasets, countrySet, period)
        : collectStructuredElement(element, datasets, countrySet)
    )
  );
  const elements: DownloadHubElementResultV114[] = [];
  const warnings: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      elements.push(result.value);
      warnings.push(...result.value.warnings);
    } else {
      warnings.push(
        `${selections[index].element.title}: ${
          result.reason instanceof Error
            ? result.reason.message
            : "자료 생성 실패"
        }`
      );
    }
  });
  const rows = elements.flatMap((item) => item.rows);
  return {
    schemaVersion: "v114",
    generatedAt: new Date().toISOString(),
    countries: countryIso3,
    period,
    elements,
    rows,
    warnings: Array.from(new Set(warnings)),
  };
}

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toDownloadHubCsvV114(rows: DownloadHubRowV114[]): string {
  const headers: Array<keyof DownloadHubRowV114> = [
    "dataset_id",
    "element_id",
    "element_name",
    "country",
    "iso3",
    "year",
    "date",
    "value",
    "unit",
    "record_type",
    "flow_type",
    "organization",
    "status",
    "source",
    "source_url",
    "as_of",
    "license",
    "note",
    "raw",
  ];
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    ),
  ].join("\r\n");
}

function triggerFile(filename: string, body: string, mime: string): void {
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

export function downloadHubBundleV114(
  bundle: DownloadHubBundleV114,
  format: DownloadHubFormatV114
): void {
  if (!bundle.rows.length) return;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const countryPart =
    bundle.countries.length === PRIORITY_COUNTRIES.length
      ? "all-priority-countries"
      : bundle.countries.length <= 3
      ? bundle.countries.join("-").toLowerCase()
      : `${bundle.countries.length}-countries`;
  const elementPart =
    bundle.elements.length === 1
      ? bundle.elements[0].elementId.toLowerCase()
      : `${bundle.elements.length}-elements`;
  const base = `ldc-strategy-map-${countryPart}-${elementPart}-${date}`;
  if (format === "JSON") {
    triggerFile(
      `${base}.json`,
      `${JSON.stringify(bundle, null, 2)}\n`,
      "application/json"
    );
  } else {
    triggerFile(
      `${base}.csv`,
      `\uFEFF${toDownloadHubCsvV114(bundle.rows)}`,
      "text/csv"
    );
  }
}
