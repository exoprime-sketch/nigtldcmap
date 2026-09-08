import { useMemo } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { publicCategoryRowsV136_3 } from "../../../utils/publicCategoryGroupingV136_3";
import { reviewedEntityAttributesV132 } from "../../../data/visualization/publicEntityFieldPolicyV132";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

import { publicScaledNumberV136_2 } from "../../../utils/publicNumberScaleV136_2";
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
  /**
   * What the money and the years are, where the source column says plainly
   * which one it is. Left unset elsewhere: several of these elements reach
   * their amount through an opaque column, and naming it a commitment or an
   * approval without having checked would be a guess in the reader's favour.
   */
  amountLabel?: string;
  yearLabel?: string;
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
/**
 * Reviewed amount/year/category fields, named in the vocabulary the alias table
 * publishes. Raw source column names are deliberately absent: they are filtered
 * out by reviewedEntityAttributesV132 before this config is consulted, so
 * listing them here has no effect and only suggests a mapping that is not there.
 */
const PORTFOLIO_CONFIG_V132: Record<string, PortfolioConfigV132> = {
  "D-012": {
    amountKeys: [],
    yearKeys: ["entryYear", "entryTiming"],
    yearLabel: "진출 확인연도",
    categoryKeys: ["technologyField", "entryCountry", "entryMode"],
  },
  "D-014": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "약정액 합계",
    yearKeys: ["approvalDate", "projectPeriod"],
    yearLabel: "약정연도",
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-015": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "약정액 합계",
    yearKeys: ["projectPeriod", "periodSummary"],
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-016": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "약정액 합계",
    yearKeys: ["projectPeriod", "periodSummary", "referenceYear"],
    categoryKeys: ["portfolioCategory", "aidType", "status"],
  },
  "D-017": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "공고 예산 합계",
    yearKeys: ["noticeDate", "projectPeriod", "referenceYear"],
    yearLabel: "공고연도",
    categoryKeys: ["sector", "status", "supportType"],
  },
  "D-018": {
    amountKeys: [{ key: "approvedAmount", currency: "USD" }],
    yearKeys: ["approvalDate"],
    categoryKeys: ["sector", "status", "implementingEntity"],
  },
  "D-019": {
    amountKeys: [],
    yearKeys: ["submissionDate", "referenceYear"],
    yearLabel: "요청 제출연도",
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
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "투자 약정액 합계",
    // 기간_시작 is where this year comes from, so it is labelled as the project's
    // start and not as an approval.
    yearKeys: ["periodStart"],
    yearLabel: "사업 시작연도",
    categoryKeys: ["portfolioCategory", "financeType", "rioMarker", "donor"],
  },
  "D-023": {
    amountKeys: [{ key: "primaryFinanceAmount", currency: "USD" }],
    // Four funds, four different dating conventions. The range stays labelled
    // generically because collapsing them into one named event would misstate
    // every row that did not supply that event.
    yearKeys: ["boardApprovalDate", "approvalDate", "approvalFiscalYear", "startDate"],
    categoryKeys: ["fund", "sector", "status", "implementingEntity"],
  },
  "D-024": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "투자액 합계",
    yearKeys: ["referenceYear"],
    yearLabel: "투자연도",
    categoryKeys: ["portfolioCategory", "fundingRound", "status"],
  },
  "D-025": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    amountLabel: "총 투자액 합계",
    yearKeys: ["financialCloseDate"],
    yearLabel: "재무종결 연도",
    categoryKeys: ["portfolioCategory", "technologyField", "status", "entryMode"],
  },
  "D-026": {
    amountKeys: [
      { key: "financeAmountUsd", currency: "USD" },
      { key: "financeAmountText", currency: "USD" },
    ],
    amountLabel: "보증금액 합계",
    yearKeys: ["fiscalYear", "approvalDate"],
    yearLabel: "회계연도",
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
  const config = PORTFOLIO_CONFIG_V132[elementId];
  return (
    <section
      className="pps132"
      data-testid="portfolio-analysis-summary-v132"
      data-summary-before-list="true"
    >
      {/* The section around this one is already titled, and it was saying the
          same thing: "포트폴리오 분석" over "포트폴리오 핵심현황" over
          "사업·재원 분포", three headings deep before a single number. Only the
          note survives, because how the totals were reached is something the
          reader cannot infer from the figures. */}
      <header className="pps132-heading">
        <p>공개된 사업을 집계하며, 통화가 확인된 금액만 통화별로 합산합니다.</p>
      </header>
      <div className="pps132-kpis">
        <article data-portfolio-kpi="record-count"><span>총 사업 수</span><strong>{entities.length.toLocaleString("ko-KR")}</strong><small>건</small></article>
        {analysis.amounts.map((amount) => (
          <article data-portfolio-kpi="funding-total" key={amount.currency}>
            <span>{config?.amountLabel || "확인 금액 합계"}</span>
            <strong
              title={`${publicScaledNumberV136_2(amount.value, amount.currency).exact} ${amount.currency}`}
            >
              {publicScaledNumberV136_2(amount.value, amount.currency).display}
            </strong>
            <small><PublicTermTextV134 text={`${amount.currency} · ${amount.count.toLocaleString("ko-KR")}건`} /></small>
          </article>
        ))}
        {analysis.yearRange && (
          <article data-portfolio-kpi="year-range"><span>{config?.yearLabel || "확인 기간"}</span><strong>{analysis.yearRange}</strong><small>년</small></article>
        )}
      </div>
      <div className="pps132-distributions">
        {analysis.years.length > 0 && (
          <DistributionV132
            title="연도별 사업 수"
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
      // Counted under the source's own value. Turning that into something a
      // reader recognises happens later, on the way to the screen.
      categories.set(category, (categories.get(category) || 0) + 1);
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
    categories: categoryRowsV136_3(categories),
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
  // No fallback to provenance.referenceYear. That field is the dataset's own
  // reference stamp (2026 for most of these), not an observation date, and using
  // it gave every undated record that year: D-012's 14 "미상" rows were being
  // counted as 2019-2026 when the source only ever states 2019-2021. A record
  // that does not say when it happened now contributes no year.
  const year =
    config.yearKeys
      .map((key) => extractYearV132(attributes[key]))
      .find((candidate): candidate is number => candidate !== null) ?? null;
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

/** Composition bars, keyed by source value and labelled for the reader. */
function categoryRowsV136_3(counts: Map<string, number>): CountRowV132[] {
  return publicCategoryRowsV136_3(counts, compactCategoryV132).map((row) => ({
    label: row.displayLabel,
    value: row.value,
  }));
}

function mapToRowsV132(values: Map<string, number>, chronological: boolean): CountRowV132[] {
  return Array.from(values, ([label, value]) => ({ label, value })).sort((left, right) =>
    chronological
      ? Number(left.label) - Number(right.label)
      : right.value - left.value || left.label.localeCompare(right.label, "ko")
  );
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
            <span title={row.label}><PublicTermTextV134 text={row.label} /></span>
            <i aria-hidden="true"><b style={{ width: `${Math.max(4, (row.value / maximum) * 100)}%` }} /></i>
            <strong>{row.value.toLocaleString("ko-KR")}건</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
