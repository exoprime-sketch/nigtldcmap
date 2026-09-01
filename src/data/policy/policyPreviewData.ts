import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

export interface PolicyPreviewSection {
  id: string;
  headingKo: string;
  originalLanguage: string;
  originalText: string;
  translationKo: string;
  sourcePage?: string;
  verificationStatus: "verified" | "review-required";
}

export interface PolicyDocumentPreview {
  datasetId: string;
  documentTitle: string;
  documentType: string;
  countryNameKo: string;
  documentDate?: string;
  sourceOrganization: string;
  sourceUrl: string;
  sections: PolicyPreviewSection[];
}

interface PolicyPreviewPayload {
  metadata?: {
    titleKo?: string;
    reviewRule?: string;
  };
  documents: PolicyDocumentPreview[];
}

const POLICY_PREVIEW_URL = publicAssetUrlV128(
  "data/policy/policy-document-previews.json"
);

let cachedPayload: PolicyPreviewPayload | null = null;

const FALLBACK_PAYLOAD: PolicyPreviewPayload = {
  metadata: {
    titleKo: "정책·법령 원문 및 번역 미리보기",
    reviewRule: "원문 위치와 번역 검토자가 확인된 발췌문만 공개",
  },
  documents: [
    {
      datasetId: "LDC-DS-C-001",
      documentTitle: "국가별 최신 NDC",
      documentType: "국가결정기여(NDC)",
      countryNameKo: "국가별",
      sourceOrganization: "Climate Watch / UNFCCC 공식 원문",
      sourceUrl: "https://www.climatewatchdata.org/ndcs-explore",
      sections: [],
    },
  ],
};

export async function loadPolicyDocumentPreviews(
  force = false
): Promise<PolicyPreviewPayload> {
  if (cachedPayload && !force) return cachedPayload;

  try {
    const response = await fetch(POLICY_PREVIEW_URL, {
      cache: force ? "reload" : "default",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      cachedPayload = FALLBACK_PAYLOAD;
      return cachedPayload;
    }

    const result = (await response.json()) as PolicyPreviewPayload;
    if (!Array.isArray(result.documents)) {
      cachedPayload = FALLBACK_PAYLOAD;
      return cachedPayload;
    }

    cachedPayload = result;
    return result;
  } catch {
    cachedPayload = FALLBACK_PAYLOAD;
    return cachedPayload;
  }
}

export async function loadPolicyPreviewForDataset(
  datasetId: string
): Promise<PolicyDocumentPreview | null> {
  const payload = await loadPolicyDocumentPreviews();
  return payload.documents.find((item) => item.datasetId === datasetId) ?? null;
}
