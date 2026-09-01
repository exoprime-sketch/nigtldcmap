import type {
  NdcCountryRecord,
  NdcPriorityStatus,
  NdcTechnologyPriority,
  NdcTechnologyPriorityDataset,
} from "../../types/ndc";
import {
  NDC_PRIORITY_STATUS_DESCRIPTIONS,
  NDC_PRIORITY_STATUS_LABELS,
  NDC_PRIORITY_STATUS_VALUES,
} from "../../types/ndc";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

const NDC_DATA_URL = publicAssetUrlV128(
  "data/ndc/ndc-technology-priorities.json"
);

let cachedDataset: NdcTechnologyPriorityDataset | null = null;

export async function loadNdcTechnologyPriorities(
  force = false
): Promise<NdcTechnologyPriorityDataset> {
  if (cachedDataset && !force) {
    return cachedDataset;
  }

  const response = await fetch(NDC_DATA_URL, {
    cache: force ? "reload" : "default",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`NDC 정책 데이터 연결 실패 · HTTP ${response.status}`);
  }

  const result = (await response.json()) as NdcTechnologyPriorityDataset;

  if (!Array.isArray(result.data)) {
    throw new Error("NDC 정책 데이터 형식 오류");
  }

  cachedDataset = result;
  return result;
}

export function createNdcCountryIndex(
  dataset: NdcTechnologyPriorityDataset
): Map<string, NdcCountryRecord> {
  return new Map(dataset.data.map((record) => [record.iso3, record]));
}

export function getNdcCountryRecord(
  dataset: NdcTechnologyPriorityDataset | null,
  iso3: string | null
): NdcCountryRecord | null {
  if (!dataset || !iso3) return null;
  return dataset.data.find((record) => record.iso3 === iso3) ?? null;
}

export function getNdcTechnologyPriority(
  record: NdcCountryRecord | null | undefined,
  technologyId: string
): NdcTechnologyPriority | null {
  return (
    record?.priorities.find(
      (priority) => priority.technologyId === technologyId
    ) ?? null
  );
}

export function getNdcStatusValue(
  status: NdcPriorityStatus | null | undefined
): number | null {
  return status ? NDC_PRIORITY_STATUS_VALUES[status] : null;
}

export function getNdcStatusLabel(
  status: NdcPriorityStatus | null | undefined
): string {
  return status ? NDC_PRIORITY_STATUS_LABELS[status] : "자료 없음";
}

export function getNdcStatusDescription(
  status: NdcPriorityStatus | null | undefined
): string {
  return status
    ? NDC_PRIORITY_STATUS_DESCRIPTIONS[status]
    : "공식 NDC 원문 검토 자료 없음";
}

export function getNdcTechnologyLabel(
  dataset: NdcTechnologyPriorityDataset | null,
  technologyId: string
): string {
  return dataset?.metadata.technologyLabels[technologyId] ?? technologyId;
}

export function getVerifiedNdcPriorities(
  record: NdcCountryRecord | null | undefined
): NdcTechnologyPriority[] {
  return (
    record?.priorities.filter(
      (priority) =>
        priority.status === "explicit" || priority.status === "related"
    ) ?? []
  );
}

export function hasReviewedNdcTechnologyEvidence(
  record: NdcCountryRecord | null | undefined
): boolean {
  return (
    record?.priorityReviewStatus === "reviewed" ||
    Boolean(record?.priorities.length)
  );
}

export function getNdcSubmissionYear(
  record: NdcCountryRecord | null | undefined
): number | null {
  if (!record?.submissionDate) return null;
  const year = Number(record.submissionDate.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function getNdcRegistryMetadataStatusLabel(
  record: NdcCountryRecord | null | undefined
): string {
  if (!record) return "NDC 메타데이터 없음";
  return hasReviewedNdcTechnologyEvidence(record)
    ? "NDC 메타데이터·기술근거 확보"
    : "NDC 메타데이터 확보 · 기술원문 검토 대기";
}
