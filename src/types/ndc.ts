export type NdcPriorityStatus = "explicit" | "related" | "not-confirmed";

export interface NdcTechnologyPriority {
  technologyId: string;
  status: NdcPriorityStatus;
  evidenceOriginal: string;
  translationKo: string;
  documentPage: string;
  documentSection: string;
  reviewStatus: string;
}

export type NdcPriorityReviewStatus = "reviewed" | "metadata-only";

export interface NdcCountryRecord {
  iso3: string;
  countryNameKo: string;
  ndcTitle: string;
  submissionDate: string;
  officialUrl: string;
  registryStatus?: string;
  language?: string;
  priorityReviewStatus?: NdcPriorityReviewStatus;
  priorities: NdcTechnologyPriority[];
}

export interface NdcTechnologyPriorityDataset {
  metadata: {
    datasetId: string;
    titleKo: string;
    sourceOrganization: string;
    referenceDate: string;
    fetchedAt: string;
    reviewedAt: string;
    reviewedBy: string;
    limitations: string[];
    technologyLabels: Record<string, string>;
  };
  data: NdcCountryRecord[];
}

export const NDC_PRIORITY_STATUS_LABELS: Record<NdcPriorityStatus, string> = {
  explicit: "NDC에 직접 명시",
  related: "직접 관련 수단 확인",
  "not-confirmed": "현재 NDC에서 직접 근거 미확인",
};

export const NDC_PRIORITY_STATUS_DESCRIPTIONS: Record<
  NdcPriorityStatus,
  string
> = {
  explicit: "선택 기술명·직접 동의어·구체적 실행수단이 공식 NDC 원문에 확인",
  related:
    "선택 기술명이 직접 적히지는 않았으나 기술과 직접 연결되는 정책·사업수단이 공식 NDC 원문에 확인",
  "not-confirmed":
    "현재 검토한 공식 NDC 범위에서 직접 근거 미확인 · 기술 미포함이나 수요 없음 의미 아님",
};

export const NDC_PRIORITY_STATUS_VALUES: Record<NdcPriorityStatus, number> = {
  explicit: 2,
  related: 1,
  "not-confirmed": 0,
};
