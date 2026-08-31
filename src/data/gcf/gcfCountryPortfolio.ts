import type {
  GcfCountryPortfolio,
  GcfCountryPortfolioRecord,
  GcfMetricDefinition,
  GcfMetricId,
} from "../../types/gcf";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

const GCF_PORTFOLIO_URL = publicAssetUrlV128(
  "data/gcf/gcf-country-portfolio-2026-07-31.json"
);

let cachedPortfolio: GcfCountryPortfolio | null = null;

export const GCF_METRIC_DEFINITIONS: GcfMetricDefinition[] = [
  {
    id: "gcfFundedActivityFinancing",
    titleKo: "GCF 승인재원",
    shortTitleKo: "GCF 승인재원",
    descriptionKo: "국가별 GCF Funded Activity 승인재원 집계",
    unit: "USD",
    decisionQuestionKo:
      "GCF 본사업 재원이 어느 국가에 집중되어 있으며 협력 공백은 어디인가?",
    legend: [
      { color: "#edf8fb", label: "0", min: 0 },
      { color: "#b3cde3", label: "1천만 USD 미만", min: 1 },
      { color: "#8c96c6", label: "1천만–1억 USD", min: 10_000_000 },
      { color: "#8856a7", label: "1억–5억 USD", min: 100_000_000 },
      { color: "#810f7c", label: "5억 USD 이상", min: 500_000_000 },
    ],
  },
  {
    id: "gcfFundedActivityCount",
    titleKo: "GCF 사업 수",
    shortTitleKo: "GCF 사업 수",
    descriptionKo: "국가별 GCF Funded Activity 수",
    unit: "건",
    decisionQuestionKo:
      "어느 국가에 GCF 본사업이 집중되어 있고 어느 국가가 비어 있는가?",
    legend: [
      { color: "#f7fcf5", label: "0건", min: 0 },
      { color: "#c7e9c0", label: "1–3건", min: 1 },
      { color: "#74c476", label: "4–10건", min: 4 },
      { color: "#31a354", label: "11–20건", min: 11 },
      { color: "#006d2c", label: "21건 이상", min: 21 },
    ],
  },
  {
    id: "gcfReadinessFinancing",
    titleKo: "Readiness 승인재원",
    shortTitleKo: "Readiness 재원",
    descriptionKo: "국가별 GCF Readiness 승인재원 집계",
    unit: "USD",
    decisionQuestionKo:
      "사업 준비·역량강화 지원이 집중된 국가와 후속 본사업 연계 필요 국가는 어디인가?",
    legend: [
      { color: "#fff7fb", label: "0", min: 0 },
      { color: "#ece2f0", label: "200만 USD 미만", min: 1 },
      { color: "#a6bddb", label: "200만–500만 USD", min: 2_000_000 },
      { color: "#67a9cf", label: "500만–800만 USD", min: 5_000_000 },
      { color: "#1c9099", label: "800만 USD 이상", min: 8_000_000 },
    ],
  },
  {
    id: "gcfReadinessCount",
    titleKo: "Readiness 지원 수",
    shortTitleKo: "Readiness 지원",
    descriptionKo: "국가별 GCF Readiness 지원 수",
    unit: "건",
    decisionQuestionKo:
      "Readiness 지원은 누적됐지만 본사업으로 이어지지 않은 국가는 어디인가?",
    legend: [
      { color: "#fff7ec", label: "0건", min: 0 },
      { color: "#fee8c8", label: "1–3건", min: 1 },
      { color: "#fdbb84", label: "4–7건", min: 4 },
      { color: "#e34a33", label: "8–12건", min: 8 },
      { color: "#b30000", label: "13건 이상", min: 13 },
    ],
  },
];

export const GCF_METRIC_DEFINITION_BY_ID = new Map(
  GCF_METRIC_DEFINITIONS.map((item) => [item.id, item])
);

export async function loadGcfCountryPortfolio(
  force = false
): Promise<GcfCountryPortfolio> {
  if (cachedPortfolio && !force) {
    return cachedPortfolio;
  }

  const response = await fetch(GCF_PORTFOLIO_URL, {
    cache: force ? "reload" : "default",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GCF 국가 포트폴리오를 로딩 실패: ${response.status}`);
  }

  const result = (await response.json()) as GcfCountryPortfolio;

  if (!result.metadata || !Array.isArray(result.data)) {
    throw new Error("GCF 국가 포트폴리오 형식이 형식 오류");
  }

  cachedPortfolio = result;
  return result;
}

export function createGcfPortfolioIndex(
  portfolio: GcfCountryPortfolio
): Map<string, GcfCountryPortfolioRecord> {
  return new Map(portfolio.data.map((record) => [record.iso3, record]));
}

export function getGcfMetricValue(
  record: GcfCountryPortfolioRecord | undefined,
  metricId: GcfMetricId
): number | null {
  if (!record) return null;

  switch (metricId) {
    case "gcfFundedActivityFinancing":
      return record.fundedActivityFinancingUsd;
    case "gcfFundedActivityCount":
      return record.fundedActivityCount;
    case "gcfReadinessFinancing":
      return record.readinessFinancingUsd;
    case "gcfReadinessCount":
      return record.readinessProjectCount;
    default:
      return null;
  }
}

export function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "자료 없음";
  if (value === 0) return "USD 0";

  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatGcfMetricValue(
  metricId: GcfMetricId,
  value: number | null
): string {
  if (value === null || !Number.isFinite(value)) return "자료 없음";
  const definition = GCF_METRIC_DEFINITION_BY_ID.get(metricId);
  return definition?.unit === "USD"
    ? formatUsd(value)
    : `${Math.round(value).toLocaleString("ko-KR")}건`;
}

export function percentileRank(values: number[], value: number): number {
  const valid = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (valid.length <= 1) return 100;
  const belowOrEqual = valid.filter((item) => item <= value).length;
  return Math.round(((belowOrEqual - 1) / (valid.length - 1)) * 100);
}
