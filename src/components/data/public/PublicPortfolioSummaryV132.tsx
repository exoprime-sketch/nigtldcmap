import { useMemo } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { reviewedEntityAttributesV132 } from "../../../data/visualization/publicEntityFieldPolicyV132";

import "./public-portfolio-summary-v132.css";

interface Props {
  elementId: string;
  entities: VietnamEntityV124[];
  detailTemplate?: string;
}

type CountRowV132 = { label: string; value: number };

type PortfolioConfigV132 = {
  amountKeys: Array<{ key: string; currency: string }>;
  yearKeys: string[];
  categoryKeys: string[];
};

const COMMON_AMOUNT_KEYS_V132 = [
  { key: "primaryFinanceAmount", currency: "USD" },
  { key: "approvedAmountNumeric", currency: "USD" },
  { key: "approvedAmount", currency: "USD" },
  { key: "commitmentAmount", currency: "USD" },
  { key: "commitment", currency: "USD" },
  { key: "usd", currency: "USD" },
] as const;

/**
 * Source columns below are reviewed amount/year/category fields for the named
 * public datasets. The internal keys are never rendered into the public DOM.
 */
const PORTFOLIO_CONFIG_V132: Record<string, PortfolioConfigV132> = {
  "D-012": {
    amountKeys: [],
    yearKeys: ["entryYear", "entryTiming"],
    categoryKeys: ["technologyField", "entryCountry", "entryMode"],
  },
  "D-014": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["approvalDate", "projectPeriod"],
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-015": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["projectPeriod", "periodSummary"],
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-016": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["projectPeriod", "periodSummary", "referenceYear"],
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-017": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["approvalDate", "projectPeriod", "referenceYear"],
    categoryKeys: ["sector", "status", "supportType"],
  },
  "D-018": {
    amountKeys: [{ key: "approvedAmount", currency: "USD" }],
    yearKeys: ["approvalDate"],
    categoryKeys: ["sector", "status", "implementingEntity"],
  },
  "D-019": {
    amountKeys: [],
    yearKeys: ["approvalDate", "referenceYear"],
    categoryKeys: ["technologyField", "sector", "status"],
  },
  "D-020": {
    amountKeys: [{ key: "usd", currency: "USD" }],
    yearKeys: ["boardApprovalDate", "approvalDate"],
    categoryKeys: ["sector", "status", "accreditedEntity"],
  },
  "D-021": {
    amountKeys: [],
    yearKeys: ["year", "referenceYear"],
    categoryKeys: ["sector", "fund", "implementingEntity"],
  },
  "D-022": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["approvalDate", "projectPeriod"],
    categoryKeys: ["portfolioCategory", "financeType", "rioMarker"],
  },
  "D-023": {
    amountKeys: [{ key: "primaryFinanceAmount", currency: "USD" }],
    yearKeys: ["approvalDate", "boardApprovalDate", "field_92700393"],
    categoryKeys: ["fund", "sector", "status"],
  },
  "D-024": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["referenceYear"],
    categoryKeys: ["portfolioCategory", "fundingRound", "status"],
  },
  "D-025": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["approvalDate"],
    categoryKeys: ["portfolioCategory", "technologyField", "status"],
  },
  "D-026": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    yearKeys: ["fiscalYear", "approvalDate"],
    categoryKeys: ["portfolioCategory", "guaranteeType", "status"],
  },
};

export default function PublicPortfolioSummaryV132({
  elementId,
  entities,
  detailTemplate,
}: Props) {
  const analysis = useMemo(
    () => portfolioAnalysisV132(elementId, entities, detailTemplate),
    [detailTemplate, elementId, entities]
  );
  return (
    <section
      className="pps132"
      data-testid="portfolio-analysis-summary-v132"
      data-summary-before-list="true"
    >
      <header className="pps132-heading">
        <span>포트폴리오 핵심현황</span>
        <h4>사업·재원 분포</h4>
        <p>공개된 개별 레코드를 집계하며, 통화가 확인된 금액만 통화별로 합산합니다.</p>
      </header>
      <div className="pps132-kpis">
        <article data-portfolio-kpi="record-count"><span>공개 레코드</span><strong>{entities.length.toLocaleString("ko-KR")}</strong><small>건</small></article>
        {analysis.amounts.map((amount) => (
          <article data-portfolio-kpi="funding-total" key={amount.currency}>
            <span>확인 금액 합계</span>
            <strong>{formatAmountV132(amount.value)}</strong>
            <small>{amount.currency} · {amount.count.toLocaleString("ko-KR")}건</small>
          </article>
        ))}
        {analysis.yearRange && (
          <article data-portfolio-kpi="year-range"><span>확인 기간</span><strong>{analysis.yearRange}</strong><small>년</small></article>
        )}
      </div>
      <div className="pps132-distributions">
        {analysis.years.length > 0 && (
          <DistributionV132
            title="연도별 공개 레코드"
            rows={analysis.years}
            testId="portfolio-year-trend-v132"
          />
        )}
        {analysis.categories.length > 0 && (
          <DistributionV132 title="주요 분야·기금 구성" rows={analysis.categories.slice(0, 8)} />
        )}
      </div>
    </section>
  );
}

function portfolioAnalysisV132(
  elementId: string,
  entities: VietnamEntityV124[],
  detailTemplate?: string
) {
  const years = new Map<string, number>();
  const categories = new Map<string, number>();
  const amounts = new Map<string, { value: number; count: number }>();

  entities.forEach((entity) => {
    const facet = publicPortfolioFacetV132(elementId, entity, detailTemplate);
    const year = facet.year;
    if (year) years.set(String(year), (years.get(String(year)) || 0) + 1);

    const category = facet.category;
    if (category) {
      const compact = compactCategoryV132(category);
      categories.set(compact, (categories.get(compact) || 0) + 1);
    }

    const amountCandidate = facet.amount;
    if (amountCandidate?.amount !== null && amountCandidate?.amount !== undefined) {
      const current = amounts.get(amountCandidate.currency) || { value: 0, count: 0 };
      current.value += amountCandidate.amount;
      current.count += 1;
      amounts.set(amountCandidate.currency, current);
    }
  });

  const yearRows = mapToRowsV132(years, true);
  const parsedYears = yearRows.map((row) => Number(row.label)).filter(Number.isFinite);
  return {
    years: yearRows,
    categories: mapToRowsV132(categories, false),
    amounts: Array.from(amounts, ([currency, value]) => ({ currency, ...value })),
    yearRange: parsedYears.length
      ? `${Math.min(...parsedYears)}–${Math.max(...parsedYears)}`
      : null,
  };
}

export type PublicPortfolioFacetV132 = {
  year: number | null;
  category: string | null;
  amount: { currency: string; amount: number } | null;
  searchText: string;
};

export function publicPortfolioFacetV132(
  elementId: string,
  entity: VietnamEntityV124,
  detailTemplate?: string
): PublicPortfolioFacetV132 {
  const config = PORTFOLIO_CONFIG_V132[elementId] || {
    amountKeys: [...COMMON_AMOUNT_KEYS_V132],
    yearKeys: ["approvalDate", "year", "referenceYear", "projectPeriod"],
    categoryKeys: ["fund", "sector", "status", "supportType"],
  };
  const attributes = reviewedEntityAttributesV132(entity, [
    detailTemplate || "project",
    "project",
    "finance",
  ]);
  const year =
    config.yearKeys
      .map((key) => extractYearV132(attributes[key]))
      .find((candidate): candidate is number => candidate !== null) ||
    extractYearV132(entity.provenance.referenceYear);
  const category =
    config.categoryKeys
      .map((key) => publicTextV126(attributes[key]))
      .find((candidate): candidate is string => Boolean(candidate)) || null;
  const amount =
    config.amountKeys
      .map(({ key, currency }) => ({
        currency,
        amount: numericAmountV132(attributes[key]),
      }))
      .find(
        (candidate): candidate is { currency: string; amount: number } =>
          candidate.amount !== null
      ) || null;
  const searchText = Object.values(attributes)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => publicTextV126(value))
    .filter((value): value is string => Boolean(value))
    .join(" ");
  return { year, category, amount, searchText };
}

function numericAmountV132(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/,/gu, "").replace(/\s+/gu, " ").trim();
  if (!normalized || /(?:미확인|미공개|미기재|not available|n\/a)/iu.test(normalized)) return null;
  const match = normalized.match(/-?\d+(?:\.\d+)?/u);
  if (!match) return null;
  const amount = Number(match[0]);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function extractYearV132(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const match = String(value).match(/(?:19|20)\d{2}/u);
  if (!match) return null;
  const year = Number(match[0]);
  return year >= 1950 && year <= 2100 ? year : null;
}

function compactCategoryV132(value: string): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length > 54 ? `${normalized.slice(0, 52).trim()}…` : normalized;
}

function mapToRowsV132(values: Map<string, number>, chronological: boolean): CountRowV132[] {
  return Array.from(values, ([label, value]) => ({ label, value })).sort((left, right) =>
    chronological
      ? Number(left.label) - Number(right.label)
      : right.value - left.value || left.label.localeCompare(right.label, "ko")
  );
}

function formatAmountV132(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    notation: value >= 1_000_000_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

function DistributionV132({
  title,
  rows,
  testId,
}: {
  title: string;
  rows: CountRowV132[];
  testId?: string;
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section
      className="pps132-distribution"
      data-portfolio-distribution="true"
      data-testid={testId}
    >
      <h5>{title}</h5>
      <ul>
        {rows.map((row) => (
          <li key={row.label} tabIndex={0} aria-label={`${row.label} ${row.value}건`}>
            <span title={row.label}>{row.label}</span>
            <i aria-hidden="true"><b style={{ width: `${Math.max(4, (row.value / maximum) * 100)}%` }} /></i>
            <strong>{row.value.toLocaleString("ko-KR")}건</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
