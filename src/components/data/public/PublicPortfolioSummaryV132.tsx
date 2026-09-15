import { useMemo } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { isNumericCodeListV136_2 } from "../../../data/visualization/publicCategoryLabelV136_2";
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
  /**
   * What one row is.
   *
   * The summary called every row a 사업. E-018 delivers 24 Korean companies,
   * E-020 seven support programmes, and C-007 and C-008 statements about a
   * mechanism - "대상 분야(1)", "참여당사국 등재 NMA 건수" - none of which is a
   * project. Counting them under 총 사업 수 asserted a project count that the
   * source never stated. Unset keeps 사업, which is what the D-0xx portfolios
   * actually hold.
   */
  recordLabel?: string;
  /**
   * The heading over the summary and the list.
   *
   * "사업 규모와 구성" over seven support programmes described neither their
   * scale nor their composition, because neither is what E-020 states.
   */
  sectionTitle?: string;
  /** V138: the source's own status split, counted separately from the record count. */
  statusGroups?: {
    label: string;
    rules: Array<{ label: string; test: (attrs: Record<string, unknown>) => boolean }>;
  };
  /** V138: the attribute that identifies one real-world thing behind several rows. */
  identityKey?: string;
  identityNormalize?: (value: string) => string;
  identityLabel?: string;
};

/** What one row of this element is, for headings outside this module. */
export function publicPortfolioRecordLabelV138(elementId: string): string {
  return PORTFOLIO_CONFIG_V132[elementId]?.recordLabel || "사업";
}

/** The heading this element's portfolio block should carry. */
export function publicPortfolioSectionTitleV138(elementId: string): string {
  return PORTFOLIO_CONFIG_V132[elementId]?.sectionTitle || "사업 규모와 구성";
}

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
  "C-007": {
    amountKeys: [],
    // The sheet dates each statement, and says nothing about approval.
    yearKeys: ["statementDate"],
    yearLabel: "자료 시점",
    categoryKeys: ["scopeValue"],
    recordLabel: "확인 항목",
    sectionTitle: "확인 항목과 대상 범위",
  },
  "C-008": {
    amountKeys: [],
    yearKeys: ["statementDate"],
    yearLabel: "자료 시점",
    categoryKeys: ["actorType", "registry", "sectorName"],
    recordLabel: "확인 항목",
    sectionTitle: "확인 항목과 참여 주체",
  },
  // 24 Korean companies, not 24 projects.
  //
  // No year: the only column carrying one states two at once - "1999 설립 /
  // 2020 진출" - so reading a year off it published a company's founding date
  // as the year it entered the market. No reviewed column states the entry year
  // on its own, so none is claimed.
  //
  // No 진출_상태 either: its values are 존치 and the like, the retention verdict
  // from the source's own review, not whether the company operates there. The
  // entry status a reader wants ("미진출(확인)", "현지법인") sits in the mode
  // column, which is already grouped.
  "E-018": {
    amountKeys: [],
    yearKeys: [],
    categoryKeys: ["businessSector", "entryMode"],
    recordLabel: "수록 기업",
    sectionTitle: "진출 기업의 분야와 진출 형태",
    // The delivery's own verdicts: 진출_상태 says 존치 or 철수, and the mode
    // column says 미진출(확인) where a company was checked and found absent.
    // Counting all 24 as "진출" asserted an entry the source denies for some.
    statusGroups: {
      label: "진출 상태",
      rules: [
        { label: "미진출(확인)", test: (attrs) => /미진출/u.test(String(attrs.entryMode || "")) },
        { label: "철수", test: (attrs) => /철수/u.test(String(attrs.entryStatus || "")) },
        { label: "진출·활동 확인", test: () => true },
      ],
    },
    identityKey: "companyName",
    identityNormalize: (value) => value.replace(/\s*\(상태 변경\)\s*$/u, "").trim(),
    identityLabel: "고유 기업",
  },
  // Seven support programmes: an offer a reader can apply to, not a project.
  "E-020": {
    amountKeys: [],
    yearKeys: [],
    categoryKeys: ["supportType", "supportingOrganization", "eligibleRecipients"],
    // Each row is one use of a programme - "마스터플랜 수립지원(ODA) — 동나이성
    // 고형폐기물 조사" - so seven rows are seven cases under three programmes.
    recordLabel: "활용 사례",
    sectionTitle: "지원제도와 활용 사례",
    identityKey: "programName",
    identityNormalize: (value) => value.split(/\s+—\s+/u)[0].trim(),
    identityLabel: "지원제도",
  },
  "C-025": {
    // The reductions this element states are tCO2e, not money. Publishing them
    // under a currency total would put a tonnage in a funding figure.
    amountKeys: [],
    yearKeys: ["creditingPeriod", "vintageYear"],
    yearLabel: "크레딧 기간 시작연도",
    categoryKeys: ["standard", "technologyField", "status"],
  },
  "D-018": {
    amountKeys: [{ key: "approvedAmount", currency: "USD" }],
    amountLabel: "승인액 합계",
    yearKeys: ["approvalDate"],
    yearLabel: "승인연도",
    categoryKeys: ["sector", "status", "implementingEntity"],
  },
  "D-019": {
    amountKeys: [],
    yearKeys: ["submissionDate", "referenceYear"],
    yearLabel: "요청 제출연도",
    categoryKeys: ["technologyField", "sector", "status"],
  },
  "D-020": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    amountLabel: "승인액 합계",
    yearKeys: ["boardApprovalDate", "approvalDate"],
    yearLabel: "이사회 승인연도",
    categoryKeys: ["sector", "status", "accreditedEntity"],
  },
  "D-021": {
    amountKeys: [{ key: "financeAmountUsd", currency: "USD" }],
    amountLabel: "약정액 합계",
    // 사업기간 reads "2011-10-05~2014-12-31", so the first year in it is the
    // start of the activity, which is what this is labelled as.
    yearKeys: ["projectPeriod"],
    yearLabel: "사업 시작연도",
    categoryKeys: ["sector", "donor", "status", "implementingEntity"],
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
    // 대표금액 was checked against each fund's own approved amount: it equals
    // GEF 승인액, GCF 승인액, AF 승인금액 or CTF 배분액(x10^6) on 71 of 73 rows,
    // the remaining two being the 집계 rows now excluded. So this total is one
    // event type - approval - and does not mix 승인/약정/집행/공동재원.
    amountKeys: [{ key: "primaryFinanceAmount", currency: "USD" }],
    amountLabel: "승인액 합계",
    // GCF 이사회 승인일, GEF 승인 회계연도 and AF 승인일 are all the approval of
    // the respective fund, so a range over them compares one kind of event.
    // 착수일 is the start of work, a different event, and is deliberately not
    // mixed into the same range - it stays available on the record itself.
    yearKeys: ["boardApprovalDate", "approvalDate", "approvalFiscalYear"],
    yearLabel: "승인연도",
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
  const identity = useMemo(
    () => portfolioIdentityV138(elementId, entities, detailTemplate),
    [detailTemplate, elementId, entities]
  );
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
        <p>{`공개된 ${config?.recordLabel || "사업"}을 집계하며, 통화가 확인된 금액만 통화별로 합산합니다.`}</p>
        {analysis.aggregateCount > 0 && (
          <p data-portfolio-note="aggregate-excluded">
            {`원천이 집계·설명 행으로 표시한 ${analysis.aggregateCount.toLocaleString("ko-KR")}건은 개별 ${config?.recordLabel || "사업"}이 아니므로 합계와 건수에서 제외했습니다. 해당 행은 목록과 상세, 다운로드에서 그대로 확인할 수 있습니다.`}
          </p>
        )}
      </header>
      <div className="pps132-kpis">
        {identity.identityCount !== null && (
          <article data-portfolio-kpi="identity-count">
            <span>{`${config?.identityLabel || "고유 항목"} 수`}</span>
            <strong>{identity.identityCount.toLocaleString("ko-KR")}</strong>
            <small>{config?.identityLabel === "지원제도" ? "개" : "곳"}</small>
          </article>
        )}
        <article data-portfolio-kpi="record-count"><span>{`총 ${config?.recordLabel || "사업"} 수`}</span><strong>{analysis.individualCount.toLocaleString("ko-KR")}</strong><small>건</small></article>
        {identity.statusRows.map((row) => (
          <article data-portfolio-kpi="status-count" key={row.label}>
            <span>{`${config?.statusGroups?.label || "상태"} · ${row.label}`}</span>
            <strong>{row.value.toLocaleString("ko-KR")}</strong>
            <small>건</small>
          </article>
        ))}
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
            title={`연도별 ${config?.recordLabel || "사업"} 수`}
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

/** V138: distinct things and the source's status split, from reviewed attributes. */
function portfolioIdentityV138(
  elementId: string,
  entities: VietnamEntityV124[],
  detailTemplate?: string
): {
  identityCount: number | null;
  statusRows: CountRowV132[];
} {
  const config = PORTFOLIO_CONFIG_V132[elementId];
  if (!config) return { identityCount: null, statusRows: [] };
  const templates = detailTemplate ? [detailTemplate] : [];
  const identities = new Set<string>();
  const statusCounts = new Map<string, number>();
  entities.forEach((entity) => {
    const attrs = reviewedEntityAttributesV132(entity, templates) as Record<string, unknown>;
    if (publicTextV126(attrs.recordScope) === "집계") return;
    if (config.identityKey) {
      const raw =
        publicTextV126(attrs[config.identityKey]) ||
        publicTextV126(entity.name) ||
        "";
      const value = config.identityNormalize ? config.identityNormalize(raw) : raw;
      if (value) identities.add(value);
    }
    if (config.statusGroups) {
      const match = config.statusGroups.rules.find((rule) => rule.test(attrs));
      if (match) statusCounts.set(match.label, (statusCounts.get(match.label) || 0) + 1);
    }
  });
  return {
    identityCount: config.identityKey ? identities.size : null,
    statusRows: config.statusGroups
      ? config.statusGroups.rules
          .map((rule) => ({ label: rule.label, value: statusCounts.get(rule.label) || 0 }))
          .filter((row) => row.value > 0)
      : [],
  };
}

function portfolioAnalysisV132(
  elementId: string,
  entities: VietnamEntityV124[],
  detailTemplate?: string
) {
  const years = new Map<string, number>();
  const categories = new Map<string, number>();
  const amounts = new Map<string, { value: number; count: number }>();

  // Rows the source itself marks 집계 are totals or explanatory lines, not
  // individual records: D-020's single aggregate is the GCF approved total for
  // the very projects listed beside it, so adding it doubled the portfolio, and
  // one of D-023's holds a project count (149) in the amount column. They stay
  // in the list, the detail view and the download; they are only kept out of the
  // sums, the counts and the distributions.
  const individual = entities.filter(
    (entity) =>
      publicPortfolioFacetV132(elementId, entity, detailTemplate).recordScope !== "집계"
  );
  const aggregateCount = entities.length - individual.length;

  individual.forEach((entity) => {
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
    individualCount: individual.length,
    aggregateCount,
    years: yearRows,
    categories: categoryRowsV136_3(categories),
    amounts: Array.from(amounts, ([currency, value]) => ({ currency, ...value })),
    yearRange: parsedYears.length
      ? `${Math.min(...parsedYears)}–${Math.max(...parsedYears)}`
      : null,
  };
}

export type PublicPortfolioFacetV132 = {
  recordScope: string | null;
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
  // D-021 files its sector as a bare DAC purpose code ("21023", "74020"), and
  // grouping by it labelled every bar with a number no reader can read. A code
  // is not a name, so the next reviewed column is used; if every one of them is
  // a code, the first is still shown rather than nothing.
  const categoryCandidates = config.categoryKeys
    .map((key) => publicTextV126(attributes[key]))
    .filter((candidate): candidate is string => Boolean(candidate));
  const category =
    categoryCandidates.find((candidate) => !isNumericCodeListV136_2(candidate)) ||
    categoryCandidates[0] ||
    null;
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
  return {
    recordScope: publicTextV126(attributes.recordScope) || null,
    year,
    category,
    amount,
    searchText,
  };
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
