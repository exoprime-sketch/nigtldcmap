import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import "./climate-budget-allocation-v129.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type BudgetBasisKeyV129 =
  | "total-climate"
  | "recurrent"
  | "capital"
  | "ministry"
  | "province";

type PublicBudgetCategoryV129 = "adaptation" | "mitigation" | "dual";

type BudgetBasisV129 = {
  key: BudgetBasisKeyV129;
  label: string;
  reportEdition: string;
  referencePeriod: string;
  denominator: string;
  indicators: Partial<Record<PublicBudgetCategoryV129, string>>;
  lowerBoundCategories?: PublicBudgetCategoryV129[];
  approximateCategories?: PublicBudgetCategoryV129[];
};

const BUDGET_CATEGORIES_V129: Array<{
  key: PublicBudgetCategoryV129;
  label: string;
  color: string;
}> = [
  { key: "adaptation", label: "적응", color: "#17856a" },
  { key: "mitigation", label: "감축", color: "#2463a8" },
  { key: "dual", label: "동시기여", color: "#d48b2a" },
];

const BUDGET_BASES_V129: BudgetBasisV129[] = [
  {
    key: "total-climate",
    label: "총 기후변화 지출",
    reportEdition: "CPEIR 2015",
    referencePeriod: "2010–2013",
    denominator: "총 기후변화 대응 지출",
    indicators: {
      adaptation: "D-005_adaptation_share_total_cc",
      mitigation: "D-005_mitigation_share_total_cc",
      dual: "D-005_dual_benefit_share_total_cc",
    },
  },
  {
    key: "recurrent",
    label: "경상예산",
    reportEdition: "CPEIR 2015",
    referencePeriod: "2010–2013",
    denominator: "경상예산",
    indicators: {
      mitigation: "D-005_mitigation_share_recurrent_budget",
    },
  },
  {
    key: "capital",
    label: "공공 자본지출",
    reportEdition: "World Bank CCDR 2022",
    referencePeriod: "2020 기준",
    denominator: "공공 자본지출",
    indicators: {
      adaptation: "D-005_adaptation_share_capital_expenditure",
    },
    approximateCategories: ["adaptation"],
  },
  {
    key: "ministry",
    label: "부처 기후예산",
    reportEdition: "CPEIR 2022",
    referencePeriod: "2016–2020",
    denominator: "6개 중앙부처의 기후예산",
    indicators: {
      adaptation: "D-005_adaptation_share_ministry_budget",
      mitigation: "D-005_mitigation_share_ministry_budget",
    },
    lowerBoundCategories: ["adaptation"],
  },
  {
    key: "province",
    label: "성 단위 기후예산",
    reportEdition: "CPEIR 2022",
    referencePeriod: "2016–2020",
    denominator: "28개 성과 껀터시의 기후예산",
    indicators: {
      adaptation: "D-005_adaptation_share_province_budget",
      mitigation: "D-005_mitigation_share_province_budget",
    },
    lowerBoundCategories: ["adaptation"],
  },
];

const REPRESENTATIVE_INDICATORS_V129 = {
  adaptation: "D-005_adaptation_share_total_cc",
  mitigation: "D-005_mitigation_share_total_cc",
  dual: "D-005_dual_benefit_share_total_cc",
} as const;

export default function ClimateBudgetAllocationAnalysisV129({
  rows,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const selectedBasis =
    BUDGET_BASES_V129.find(
      (basis) => basis.key === selectorState.dimensions.budgetBasis
    ) || BUDGET_BASES_V129[0];
  const numericRows = useMemo(
    () =>
      rows.filter(
        (row): row is SemanticObservationV125 & { value: number } =>
          typeof row.value === "number" && Number.isFinite(row.value)
      ),
    [rows]
  );
  const representative = BUDGET_CATEGORIES_V129.map((category) => ({
    ...category,
    value:
      numericRows.find(
        (row) => row.indicatorId === REPRESENTATIVE_INDICATORS_V129[category.key]
      )?.value ?? null,
  }));

  return (
    <div
      className="cab129"
      data-testid="d005-specialized-renderer"
      data-zero-imputation="false"
      data-zoom-controls="false"
    >
      <section className="cab129__purpose" aria-labelledby="cab129-purpose-title">
        <h3 id="cab129-purpose-title">이 데이터로 확인할 수 있는 내용</h3>
        <ul>
          <li>기후변화 대응 지출이 적응·감축·동시기여에 어떻게 배분됐는지 확인할 수 있습니다.</li>
          <li>각 비율은 화면에 적힌 예산범위를 분모로 사용합니다.</li>
          <li>서로 다른 분모와 보고서의 값은 직접 비교하지 않습니다.</li>
        </ul>
      </section>

      <section
        className="cab129__representative"
        aria-labelledby="cab129-representative-title"
        data-testid="d005-representative-allocation"
      >
        <header>
          <div>
            <span>주 분석</span>
            <h3 id="cab129-representative-title">대표 예산 배분 구조</h3>
          </div>
          <p>2010–2013년 총 기후변화 대응 지출 기준</p>
        </header>

        <div
          className="cab129__stack"
          role="img"
          aria-label={representative
            .map((item) => `${item.label} ${displayPercentV129(item.value)}`)
            .join(", ")}
        >
          {representative.map((item) => (
            <span
              key={item.key}
              aria-label={`${item.label} ${displayPercentV129(item.value)}`}
              data-testid="d005-representative-share"
              data-budget-category={item.key}
              data-budget-value={item.value ?? ""}
              data-budget-value-state={item.value === null ? "missing" : "reported"}
              style={
                {
                  "--cab129-share": `${item.value ?? 0}`,
                  "--cab129-color": item.color,
                } as CSSProperties
              }
            >
              <b>
                <small>{item.label}</small>
                <strong>{displayPercentV129(item.value)}</strong>
              </b>
            </span>
          ))}
        </div>
        <div className="cab129__share-labels">
          {representative.map((item) => (
            <div
              key={item.key}
              data-share-category={item.key}
            >
              <i style={{ backgroundColor: item.color }} aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{displayPercentV129(item.value)}</strong>
            </div>
          ))}
        </div>
        <p className="cab129__source-note">
          <PublicTermTextV134 text="CPEIR 2015의 동일한 총 기후변화 대응 지출 분모에서 세 구분의 합이 100%가 되는 공개값입니다." />
        </p>
      </section>

      <section className="cab129__alternatives" aria-labelledby="cab129-alternative-title">
        <header>
          <div>
            <span>보조 분석</span>
            <h3 id="cab129-alternative-title">다른 예산 기준의 공개값</h3>
          </div>
          <label>
            예산 기준
            <select
              data-testid="d005-budget-basis-selector"
              value={selectedBasis.key}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  dimensions: {
                    ...selectorState.dimensions,
                    budgetBasis: event.target.value,
                  },
                })
              }
            >
              {BUDGET_BASES_V129.map((basis) => (
                <option key={basis.key} value={basis.key}>
                  {basis.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <dl className="cab129__basis-meta">
          <div>
            <dt>보고서</dt>
            <dd>{selectedBasis.reportEdition}</dd>
          </div>
          <div>
            <dt>기준기간</dt>
            <dd>{selectedBasis.referencePeriod}</dd>
          </div>
          <div>
            <dt>분모</dt>
            <dd>{selectedBasis.denominator}</dd>
          </div>
        </dl>

        <div className="cab129__basis-values">
          {BUDGET_CATEGORIES_V129.map((category) => {
            const indicator = selectedBasis.indicators[category.key];
            const categoryRows = indicator
              ? rows
                  .filter((row) => row.indicatorId === indicator)
                  .sort((left, right) => (left.year ?? 0) - (right.year ?? 0))
              : [];
            const populated = categoryRows.filter(
              (row): row is SemanticObservationV125 & { value: number } =>
                typeof row.value === "number" && Number.isFinite(row.value)
            );
            const lowerBound = selectedBasis.lowerBoundCategories?.includes(
              category.key
            );
            const approximate = selectedBasis.approximateCategories?.includes(
              category.key
            );
            return (
              <article key={category.key}>
                <span>
                  <i style={{ backgroundColor: category.color }} aria-hidden="true" />
                  {category.label}
                </span>
                <strong>
                  {populated.length > 0
                    ? populated
                        .map(
                          (row) =>
                            `${populated.length > 1 && row.year ? `${row.year}년 ` : ""}${displayPercentV129(row.value, lowerBound, approximate)}`
                        )
                        .join(" · ")
                    : "미공개"}
                </strong>
              </article>
            );
          })}
        </div>
        <p className="cab129__missing-note">
          보고서에 공개되지 않은 구분은 <strong>미공개</strong>로 표시하며 임의 값으로 바꾸지 않습니다.
        </p>
      </section>
    </div>
  );
}

function displayPercentV129(
  value: number | null,
  lowerBound = false,
  approximate = false
): string {
  if (value === null) return "미공개";
  const formatted = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(value);
  if (lowerBound) return `${formatted}% 이상`;
  return approximate ? `약 ${formatted}%` : `${formatted}%`;
}
