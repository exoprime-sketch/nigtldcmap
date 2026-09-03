import { useId, useMemo, useState } from "react";

import type {
  E012MeasureKeyV125,
  E012SexV125,
  SemanticObservationV125,
} from "../../../data/visualization/semanticTypesV125";
import {
  publicMissingReasonLabelV126,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";

import "./occupation-employment-wage-v125.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

export type E012OccupationMeasureKeyV125 =
  | "occupation_employment_count"
  | "occupation_employment_share"
  | "occupation_female_share"
  | "occupation_wage";

export interface E012VisualizationSelectionV125 {
  measure: E012OccupationMeasureKeyV125;
  sex: E012SexV125;
  year: number;
}

export interface OccupationEmploymentWagePreviewV125Props {
  observations: SemanticObservationV125[];
  selection?: Partial<E012VisualizationSelectionV125>;
  onSelectionChange?: (selection: E012VisualizationSelectionV125) => void;
  countryNameKo?: string;
  className?: string;
  showRawTable?: boolean;
}

type OccupationKey =
  | "manager"
  | "professional"
  | "technician"
  | "clerk"
  | "service_sales"
  | "skilled_agriculture"
  | "craft"
  | "machine_operator"
  | "elementary"
  | "other";

type OccupationOption = {
  key: OccupationKey;
  label: string;
  shortLabel: string;
  order: number;
};

type MeasureOption = {
  key: E012OccupationMeasureKeyV125;
  label: string;
};

type RankedRow = {
  occupation: OccupationOption;
  observation?: SemanticObservationV125;
  value: number | null;
};

type ScatterPoint = {
  occupation: OccupationOption;
  employment: number;
  employmentUnit: string;
  wage: number;
  wageUnit: string;
};

type SexComparisonRow = {
  occupation: OccupationOption;
  male: number;
  female: number;
  unit: string;
};

export const E012_MEASURE_OPTIONS_V125: MeasureOption[] = [
  { key: "occupation_employment_count", label: "종사자 수" },
  { key: "occupation_employment_share", label: "고용 구성비" },
  { key: "occupation_female_share", label: "직군 내 여성 비중" },
  { key: "occupation_wage", label: "월평균 임금" },
];

export const E012_OCCUPATION_LABELS_V125: OccupationOption[] = [
  { key: "manager", label: "관리자", shortLabel: "관리자", order: 1 },
  { key: "professional", label: "전문가", shortLabel: "전문가", order: 2 },
  {
    key: "technician",
    label: "기술공·준전문가",
    shortLabel: "기술공",
    order: 3,
  },
  { key: "clerk", label: "사무직", shortLabel: "사무직", order: 4 },
  {
    key: "service_sales",
    label: "서비스·판매직",
    shortLabel: "서비스",
    order: 5,
  },
  {
    key: "skilled_agriculture",
    label: "농림어업 숙련직",
    shortLabel: "농림어업",
    order: 6,
  },
  {
    key: "craft",
    label: "기능원·관련직",
    shortLabel: "기능원",
    order: 7,
  },
  {
    key: "machine_operator",
    label: "장치·기계 조작·조립원",
    shortLabel: "기계조작",
    order: 8,
  },
  {
    key: "elementary",
    label: "단순노무직",
    shortLabel: "단순노무",
    order: 9,
  },
  {
    key: "other",
    label: "기타·미정의",
    shortLabel: "기타",
    order: 10,
  },
];

const MEASURE_LABELS: Record<E012MeasureKeyV125, string> = {
  employment_rate: "고용률",
  employed_persons: "총 취업자 수",
  average_monthly_wage: "평균 월임금",
  occupation_employment_count: "직군별 종사자 수",
  occupation_employment_share: "직군별 고용 구성비",
  occupation_female_share: "직군 내 여성 비중",
  occupation_wage: "직군별 월평균 임금",
};

const SEX_OPTIONS: Array<{ key: E012SexV125; label: string }> = [
  { key: "total", label: "전체" },
  { key: "male", label: "남성" },
  { key: "female", label: "여성" },
];

const SEX_LABELS: Record<E012SexV125, string> = {
  total: "전체",
  male: "남성",
  female: "여성",
};

const DEFAULT_SELECTION: E012VisualizationSelectionV125 = {
  measure: "occupation_employment_count",
  sex: "total",
  year: 2024,
};

export default function OccupationEmploymentWagePreviewV125({
  observations,
  selection,
  onSelectionChange,
  countryNameKo = "베트남",
  className = "",
  showRawTable = true,
}: OccupationEmploymentWagePreviewV125Props) {
  const measureId = useId();
  const sexId = useId();
  const yearId = useId();
  const [internalSelection, setInternalSelection] =
    useState<E012VisualizationSelectionV125>(DEFAULT_SELECTION);

  const years = useMemo(() => availableYears(observations), [observations]);
  const current = normalizeSelection(
    {
      measure: selection?.measure || internalSelection.measure,
      sex: selection?.sex || internalSelection.sex,
      year: selection?.year || internalSelection.year,
    },
    years
  );

  const rankedRows = useMemo(
    () => buildRankedRows(observations, current),
    [observations, current.measure, current.sex, current.year]
  );
  const scatter = useMemo(
    () => buildScatterPoints(observations, current.sex, current.year),
    [observations, current.sex, current.year]
  );
  const sexComparison = useMemo(
    () => buildSexComparison(observations, current.measure, current.year),
    [observations, current.measure, current.year]
  );
  const kpis = useMemo(() => buildKpis(observations), [observations]);

  const emitSelection = (
    patch: Partial<E012VisualizationSelectionV125>
  ) => {
    let next = normalizeSelection({ ...current, ...patch }, years);
    if (patch.measure) {
      const allowedSexes = availableSexesForMeasure(
        observations,
        patch.measure,
        next.year
      );
      if (!allowedSexes.includes(next.sex)) {
        next = {
          ...next,
          sex:
            allowedSexes.find((sex) => sex === "total") ||
            allowedSexes[0] ||
            "total",
        };
      }
    }
    setInternalSelection(next);
    onSelectionChange?.(next);
  };

  if (observations.length === 0) {
    return (
      <section
        className={`e012v125 e012v125--empty ${className}`.trim()}
        data-testid="e012-semantic-preview"
        aria-label="직군별 고용과 임금 시각화"
      >
        <strong>아직 공개된 값이 없습니다</strong>
        <p>확인되지 않은 값을 임의로 채우지 않습니다.</p>
      </section>
    );
  }

  return (
    <section
      className={`e012v125 ${className}`.trim()}
      data-testid="e012-semantic-preview"
      aria-labelledby="e012v125-title"
    >
      <header className="e012v125__heading">
        <div>
          <span className="e012v125__eyebrow">고용·임금 분석</span>
          <h3 id="e012v125-title">직군별 종사자 수와 월평균 임금</h3>
          <p>
            측정항목, 직군, 성별과 기준연도를 분리해 원자료의 분류를 그대로
            확인합니다.
          </p>
        </div>
        <span className="e012v125__record-count">
          원자료 {observations.length.toLocaleString("ko-KR")}건
        </span>
      </header>

      <KpiGrid kpis={kpis} countryNameKo={countryNameKo} />

      <section className="e012v125__panel" aria-labelledby="e012v125-rank-title">
        <div className="e012v125__panel-heading">
          <div>
            <span className="e012v125__eyebrow">직군별 비교</span>
            <h4 id="e012v125-rank-title">직군별 측정값</h4>
          </div>
          <span>{current.year}년</span>
        </div>

        <div
          className="e012v125__selectors"
          aria-label="직군별 차트 조건"
          data-testid="public-selector"
        >
          <label htmlFor={measureId}>
            측정항목
            <select
              id={measureId}
              data-testid="e012-measure-select"
              value={current.measure}
              onChange={(event) =>
                emitSelection({
                  measure: event.target.value as E012OccupationMeasureKeyV125,
                })
              }
              aria-label="E-012 측정항목 선택"
            >
              {E012_MEASURE_OPTIONS_V125.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor={sexId}>
            성별
            <select
              id={sexId}
              data-testid="e012-sex-select"
              value={current.sex}
              onChange={(event) =>
                emitSelection({ sex: event.target.value as E012SexV125 })
              }
              aria-label="E-012 성별 선택"
            >
              {SEX_OPTIONS.map((option) => {
                const available = hasMeasureSex(
                  observations,
                  current.measure,
                  option.key,
                  current.year
                );
                return (
                  <option
                    key={option.key}
                    value={option.key}
                    disabled={!available}
                  >
                    {option.label}
                    {!available ? " · 원자료 없음" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label htmlFor={yearId}>
            기준연도
            <select
              id={yearId}
              data-testid="e012-year-select"
              value={current.year}
              onChange={(event) =>
                emitSelection({ year: Number(event.target.value) })
              }
              aria-label="E-012 기준연도 선택"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </label>
        </div>

        <RankedOccupationBars rows={rankedRows} selection={current} />
      </section>

      <div className="e012v125__two-column">
        <EmploymentWageScatter
          points={scatter.points}
          invalidUnits={scatter.invalidUnits}
          selection={current}
        />
        <SexComparison
          rows={sexComparison.rows}
          invalidUnits={sexComparison.invalidUnits}
          measure={current.measure}
          year={current.year}
        />
      </div>

      <div
        className="e012v125__notice"
        data-testid="e012-wage-missing-notice"
        role="note"
      >
        <strong>결측 안내</strong>
        <span>기타·미정의 직군의 임금은 원천 미제공</span>
      </div>

      {showRawTable && <RawObservationTable observations={observations} />}
    </section>
  );
}

function KpiGrid({
  kpis,
  countryNameKo,
}: {
  kpis: ReturnType<typeof buildKpis>;
  countryNameKo: string;
}) {
  return (
    <section
      className="e012v125__kpis"
      data-testid="e012-kpis"
      aria-label={`${countryNameKo} 고용 핵심 지표`}
    >
      <KpiCard
        label="총 취업자 수"
        observation={kpis.employed}
        emptyReason="취업자 수 원자료 없음"
      />
      <KpiCard
        label="고용률"
        observation={kpis.employmentRate}
        emptyReason="고용률 원자료 없음"
      />
      <KpiCard
        label="최신 월평균 임금"
        observation={kpis.averageWage}
        emptyReason="월평균 임금 원자료 없음"
      />
      <article className="e012v125__kpi">
        <span>기준연도</span>
        <strong>{kpis.latestYear ? `${kpis.latestYear}년` : "미기재"}</strong>
        <small>화면에 포함된 최신 원자료</small>
      </article>
    </section>
  );
}

function KpiCard({
  label,
  observation,
  emptyReason,
}: {
  label: string;
  observation?: SemanticObservationV125;
  emptyReason: string;
}) {
  const value = numericValue(observation);
  const unit = observationUnit(observation);
  const year = observation ? observationYear(observation) : null;
  return (
    <article className="e012v125__kpi">
      <span>{label}</span>
      <strong>
        {value === null ? (
          "—"
        ) : (
          <PublicTermTextV134 text={formatValue(value, unit)} />
        )}
      </strong>
      <small>
        {value === null ? (
          emptyReason
        ) : (
          <PublicTermTextV134
            text={[year ? `${year}년` : null, unit || null]
              .filter(Boolean)
              .join(" · ")}
          />
        )}
      </small>
    </article>
  );
}

function RankedOccupationBars({
  rows,
  selection,
}: {
  rows: RankedRow[];
  selection: E012VisualizationSelectionV125;
}) {
  const numericRows = rows.filter(
    (row): row is RankedRow & { value: number } => row.value !== null
  );
  const maxValue = Math.max(...numericRows.map((row) => Math.abs(row.value)), 0);
  const units = new Set(
    numericRows.map((row) => observationUnit(row.observation)).filter(Boolean)
  );
  const unit = Array.from(units)[0] || "";
  const invalidUnits = units.size > 1;

  return (
    <div
      className="e012v125__ranked"
      data-testid="e012-ranked-bars"
      role="list"
      aria-label={`${E012_MEASURE_OPTIONS_V125.find((item) => item.key === selection.measure)?.label} · ${SEX_LABELS[selection.sex]} · ${selection.year}년`}
    >
      {invalidUnits && (
        <p className="e012v125__empty-reason" role="alert">
          서로 다른 단위가 감지되어 같은 축의 막대로 표시하지 않았습니다.
        </p>
      )}
      {!invalidUnits && rows.map((row) => {
        const rowUnit = observationUnit(row.observation) || unit;
        const year = row.observation
          ? observationYear(row.observation)
          : selection.year;
        const missing = row.value === null;
        const formattedValue =
          row.value === null ? "" : formatValue(row.value, rowUnit);
        return (
          <div
            className={`e012v125__bar-row ${missing ? "is-missing" : ""}`}
            key={row.occupation.key}
            role="listitem"
            data-occupation={row.occupation.key}
            aria-label={`${row.occupation.label}, ${
              missing ? "원자료 미제공" : formattedValue
            }, ${year}년`}
          >
            <div className="e012v125__bar-label">
              <strong>{row.occupation.label}</strong>
              <span>{year}년</span>
            </div>
            <div className="e012v125__bar-track" aria-hidden="true">
              {row.value !== null && (
                <i
                  style={{
                    width: `${maxValue > 0 ? (Math.abs(row.value) / maxValue) * 100 : 0}%`,
                  }}
                />
              )}
            </div>
            <div className="e012v125__bar-value">
              <strong>{missing ? "—" : formattedValue}</strong>
              {missing && (
                <span>
                  {[rowUnit || "단위 미기재", missingReason(row.observation)].join(
                    " · "
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {!invalidUnits && numericRows.length === 0 && (
        <p className="e012v125__empty-reason">
          선택한 측정항목·성별·연도 조합의 직군별 값이 원자료에 없습니다.
        </p>
      )}
      <details className="e012v125__table-fallback">
        <summary>직군별 막대 표로 보기</summary>
        <div className="e012v125__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">직군</th>
                <th scope="col">값</th>
                <th scope="col">단위</th>
                <th scope="col">성별</th>
                <th scope="col">연도</th>
                <th scope="col">결측 사유</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.occupation.key}>
                  <th scope="row">{row.occupation.label}</th>
                  <td>{row.value === null ? "—" : formatRawValue(row.value, row.value)}</td>
                  <td>{observationUnit(row.observation) || unit || "미기재"}</td>
                  <td>{SEX_LABELS[selection.sex]}</td>
                  <td>{row.observation ? observationYear(row.observation) : selection.year}</td>
                  <td>{row.value === null ? missingReason(row.observation) : "해당 없음"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function EmploymentWageScatter({
  points,
  invalidUnits,
  selection,
}: {
  points: ScatterPoint[];
  invalidUnits: boolean;
  selection: E012VisualizationSelectionV125;
}) {
  const width = 620;
  const height = 390;
  const margin = { top: 28, right: 88, bottom: 62, left: 78 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxEmployment = Math.max(...points.map((point) => point.employment), 0);
  const maxWage = Math.max(...points.map((point) => point.wage), 0);
  const employmentUnit = points[0]?.employmentUnit || "천명";
  const wageUnit = points[0]?.wageUnit || "천VND";

  return (
    <section
      className="e012v125__panel e012v125__chart-panel"
      data-testid="e012-employment-wage-scatter"
      aria-labelledby="e012v125-scatter-title"
    >
      <div className="e012v125__panel-heading">
        <div>
          <span className="e012v125__eyebrow">두 측정항목의 관계</span>
          <h4 id="e012v125-scatter-title">종사자 수–임금 관계</h4>
        </div>
        <span>
          {SEX_LABELS[selection.sex]} · {selection.year}년
        </span>
      </div>
      <p className="e012v125__chart-note" role="note">
        X축 종사자 수는 전체 취업자, Y축 임금은 임금근로자 기준이므로 두
        측정항목의 모집단이 다릅니다.
      </p>

      {invalidUnits ? (
        <p className="e012v125__empty-reason" role="alert">
          축마다 서로 다른 단위가 감지되어 차트를 표시하지 않았습니다.
        </p>
      ) : points.length === 0 ? (
        <p className="e012v125__empty-reason">
          동일 연도·성별에서 종사자 수와 임금이 함께 제공된 직군이 없습니다.
          다른 성별 값을 대신 사용하지 않았습니다.
        </p>
      ) : (
        <>
          <svg
            className="e012v125__scatter"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${selection.year}년 ${SEX_LABELS[selection.sex]} 직군별 종사자 수와 월평균 임금 산점도, ${points.length}개 직군`}
          >
            <line
              className="e012v125__axis"
              x1={margin.left}
              y1={height - margin.bottom}
              x2={width - margin.right}
              y2={height - margin.bottom}
            />
            <line
              className="e012v125__axis"
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={height - margin.bottom}
            />
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = margin.top + plotHeight * (1 - ratio);
              return (
                <g key={ratio} aria-hidden="true">
                  <line
                    className="e012v125__grid-line"
                    x1={margin.left}
                    y1={y}
                    x2={width - margin.right}
                    y2={y}
                  />
                  <text x={margin.left - 10} y={y + 4} textAnchor="end">
                    {formatAxis(maxWage * ratio)}
                  </text>
                </g>
              );
            })}
            {points.map((point) => {
              const x =
                margin.left +
                (maxEmployment > 0
                  ? (point.employment / maxEmployment) * plotWidth
                  : plotWidth / 2);
              const y =
                margin.top +
                (maxWage > 0
                  ? (1 - point.wage / maxWage) * plotHeight
                  : plotHeight / 2);
              const accessibleLabel = `${point.occupation.label}: 종사자 수 ${formatValue(
                point.employment,
                point.employmentUnit
              )}, 월평균 임금 ${formatValue(point.wage, point.wageUnit)}`;
              return (
                <g
                  className="e012v125__point"
                  key={point.occupation.key}
                  data-occupation={point.occupation.key}
                  tabIndex={0}
                  role="img"
                  aria-label={accessibleLabel}
                >
                  <title>{accessibleLabel}</title>
                  <circle cx={x} cy={y} r={7} />
                  <text x={x + 9} y={y - 9}>
                    {point.occupation.shortLabel}
                  </text>
                </g>
              );
            })}
            <text
              className="e012v125__axis-title"
              x={margin.left + plotWidth / 2}
              y={height - 16}
              textAnchor="middle"
            >
              직군별 종사자 수 ({employmentUnit})
            </text>
            <text
              className="e012v125__axis-title"
              transform={`translate(18 ${margin.top + plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              월평균 임금
            </text>
          </svg>
          <p className="e012v125__axis-unit-note">
            세로축 단위: <PublicTermTextV134 text={wageUnit} />
          </p>

          <details className="e012v125__table-fallback">
            <summary>산점도 표로 보기</summary>
            <div className="e012v125__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">직군</th>
                    <th scope="col">종사자 수</th>
                    <th scope="col">월평균 임금</th>
                    <th scope="col">성별</th>
                    <th scope="col">연도</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.occupation.key}>
                      <th scope="row">{point.occupation.label}</th>
                      <td>
                        <PublicTermTextV134
                          text={formatValue(point.employment, point.employmentUnit)}
                        />
                      </td>
                      <td>
                        <PublicTermTextV134
                          text={formatValue(point.wage, point.wageUnit)}
                        />
                      </td>
                      <td>{SEX_LABELS[selection.sex]}</td>
                      <td>{selection.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function SexComparison({
  rows,
  invalidUnits,
  measure,
  year,
}: {
  rows: SexComparisonRow[];
  invalidUnits: boolean;
  measure: E012OccupationMeasureKeyV125;
  year: number;
}) {
  const maxValue = Math.max(
    ...rows.flatMap((row) => [Math.abs(row.male), Math.abs(row.female)]),
    0
  );
  const measureLabel =
    E012_MEASURE_OPTIONS_V125.find((item) => item.key === measure)?.label ||
    measure;
  return (
    <section
      className="e012v125__panel e012v125__chart-panel"
      data-testid="e012-sex-comparison"
      aria-labelledby="e012v125-sex-title"
    >
      <div className="e012v125__panel-heading">
        <div>
          <span className="e012v125__eyebrow">동일 단위 성별 비교</span>
          <h4 id="e012v125-sex-title">남성·여성 나란히 보기</h4>
        </div>
        <span>{year}년</span>
      </div>
      <div className="e012v125__series-legend" aria-label="성별 범례">
        <span><i className="is-male" />남성</span>
        <span><i className="is-female" />여성</span>
      </div>
      {invalidUnits ? (
        <p className="e012v125__empty-reason" role="alert">
          서로 다른 단위가 감지되어 성별 비교를 표시하지 않았습니다.
        </p>
      ) : rows.length === 0 ? (
        <p className="e012v125__empty-reason">
          {measureLabel}에는 동일 직군의 남성·여성 값 쌍이 없습니다.
        </p>
      ) : (
        <>
          <div className="e012v125__paired-list" role="list">
            {rows.map((row) => (
              <div
                className="e012v125__paired-row"
                role="listitem"
                key={row.occupation.key}
                data-occupation={row.occupation.key}
                aria-label={`${row.occupation.label}, 남성 ${formatValue(
                  row.male,
                  row.unit
                )}, 여성 ${formatValue(row.female, row.unit)}`}
              >
                <strong>{row.occupation.label}</strong>
                <div>
                  <span>남</span>
                  <i
                    className="is-male"
                    style={{ width: percentWidth(row.male, maxValue) }}
                    aria-hidden="true"
                  />
                  <small>
                    <PublicTermTextV134 text={formatValue(row.male, row.unit)} />
                  </small>
                </div>
                <div>
                  <span>여</span>
                  <i
                    className="is-female"
                    style={{ width: percentWidth(row.female, maxValue) }}
                    aria-hidden="true"
                  />
                  <small>
                    <PublicTermTextV134 text={formatValue(row.female, row.unit)} />
                  </small>
                </div>
              </div>
            ))}
          </div>
          <details className="e012v125__table-fallback">
            <summary>성별 비교 표로 보기</summary>
            <div className="e012v125__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">직군</th>
                    <th scope="col">남성</th>
                    <th scope="col">여성</th>
                    <th scope="col">단위</th>
                    <th scope="col">연도</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.occupation.key}>
                      <th scope="row">{row.occupation.label}</th>
                      <td>{formatRawValue(row.male, row.male)}</td>
                      <td>{formatRawValue(row.female, row.female)}</td>
                      <td>{row.unit}</td>
                      <td>{year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function RawObservationTable({
  observations,
}: {
  observations: SemanticObservationV125[];
}) {
  return (
    <details className="e012v125__raw" data-testid="public-raw-table">
      <summary>원자료 보기 · {observations.length.toLocaleString("ko-KR")}건</summary>
      <section
        className="e012v125__panel"
        data-testid="e012-raw-table"
        aria-labelledby="e012v125-table-title"
      >
        <div className="e012v125__panel-heading">
          <div>
            <span className="e012v125__eyebrow">상세 레코드</span>
            <h4 id="e012v125-table-title">직군·성별 측정값</h4>
          </div>
          <span>{observations.length.toLocaleString("ko-KR")}건</span>
        </div>
        <p className="e012v125__table-description" id="e012v125-table-description">
          직군, 성별, 측정항목과 값을 공개 레코드 단위로 표시합니다. 결측값은
          0으로 바꾸지 않습니다.
        </p>
        <div className="e012v125__table-wrap">
          <table aria-describedby="e012v125-table-description">
            <thead>
              <tr>
                <th scope="col">직군</th>
                <th scope="col">성별</th>
                <th scope="col">측정항목</th>
                <th scope="col">값</th>
                <th scope="col">단위</th>
                <th scope="col">연도</th>
                <th scope="col">자료 제공기관</th>
                <th scope="col">결측 사유</th>
                <th scope="col">공식 원문</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((observation) => {
                const value = numericValue(observation);
                const occupation = dimensionValue(observation, "occupation");
                const sex = dimensionValue(observation, "sex");
                const unit = observationUnit(observation);
                const sourceUrl = publicSourceUrlV126(
                  observation.provenance.sourceUrl
                );
                return (
                  <tr key={observation.recordId}>
                    <td>{dimensionLabel(observation, "occupation", occupation)}</td>
                    <td>{dimensionLabel(observation, "sex", sex)}</td>
                    <th scope="row">
                      {publicTextV126(observation.semanticMeasure.labelKo) ||
                        measureLabel(observation.semanticMeasure.key)}
                    </th>
                    <td>
                      {value === null
                        ? "—"
                        : formatRawValue(value, observation.value)}
                    </td>
                    <td>{unit || "미기재"}</td>
                    <td>{observationYear(observation) || "미기재"}</td>
                    <td>
                      {publicTextV126(observation.provenance.sourceOrg) || ""}
                    </td>
                    <td>{missingReason(observation)}</td>
                    <td className="e012v125__evidence-cell">
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer">
                          원문 확인
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </details>
  );
}

function buildRankedRows(
  observations: SemanticObservationV125[],
  selection: E012VisualizationSelectionV125
): RankedRow[] {
  const rows = E012_OCCUPATION_LABELS_V125.map((occupation) => {
    const observation = observations.find(
      (row) =>
        row.semanticMeasure.key === selection.measure &&
        dimensionValue(row, "occupation") === occupation.key &&
        dimensionValue(row, "sex") === selection.sex &&
        observationYear(row) === selection.year
    );
    return { occupation, observation, value: numericValue(observation) };
  });
  return rows.sort((left, right) => {
    if (left.value === null && right.value !== null) return 1;
    if (left.value !== null && right.value === null) return -1;
    if (left.value !== null && right.value !== null && left.value !== right.value) {
      return right.value - left.value;
    }
    return left.occupation.order - right.occupation.order;
  });
}

function buildScatterPoints(
  observations: SemanticObservationV125[],
  sex: E012SexV125,
  year: number
): { points: ScatterPoint[]; invalidUnits: boolean } {
  const points = E012_OCCUPATION_LABELS_V125.flatMap((occupation) => {
    if (occupation.key === "other") return [];
    const employment = observations.find(
      (row) =>
        row.semanticMeasure.key === "occupation_employment_count" &&
        dimensionValue(row, "occupation") === occupation.key &&
        dimensionValue(row, "sex") === sex &&
        observationYear(row) === year
    );
    const wage = observations.find(
      (row) =>
        row.semanticMeasure.key === "occupation_wage" &&
        dimensionValue(row, "occupation") === occupation.key &&
        dimensionValue(row, "sex") === sex &&
        observationYear(row) === year
    );
    const employmentValue = numericValue(employment);
    const wageValue = numericValue(wage);
    if (employmentValue === null || wageValue === null) return [];
    return [
      {
        occupation,
        employment: employmentValue,
        employmentUnit: observationUnit(employment),
        wage: wageValue,
        wageUnit: observationUnit(wage),
      },
    ];
  });
  const employmentUnits = new Set(points.map((point) => point.employmentUnit));
  const wageUnits = new Set(points.map((point) => point.wageUnit));
  return {
    points,
    invalidUnits: employmentUnits.size > 1 || wageUnits.size > 1,
  };
}

function buildSexComparison(
  observations: SemanticObservationV125[],
  measure: E012OccupationMeasureKeyV125,
  year: number
): { rows: SexComparisonRow[]; invalidUnits: boolean } {
  const rows = E012_OCCUPATION_LABELS_V125.flatMap((occupation) => {
    const male = observations.find(
      (row) =>
        row.semanticMeasure.key === measure &&
        dimensionValue(row, "occupation") === occupation.key &&
        dimensionValue(row, "sex") === "male" &&
        observationYear(row) === year
    );
    const female = observations.find(
      (row) =>
        row.semanticMeasure.key === measure &&
        dimensionValue(row, "occupation") === occupation.key &&
        dimensionValue(row, "sex") === "female" &&
        observationYear(row) === year
    );
    const maleValue = numericValue(male);
    const femaleValue = numericValue(female);
    if (maleValue === null || femaleValue === null) return [];
    const maleUnit = observationUnit(male);
    const femaleUnit = observationUnit(female);
    if (maleUnit !== femaleUnit) {
      return [
        {
          occupation,
          male: maleValue,
          female: femaleValue,
          unit: `${maleUnit}\u0000${femaleUnit}`,
        },
      ];
    }
    return [
      {
        occupation,
        male: maleValue,
        female: femaleValue,
        unit: maleUnit,
      },
    ];
  });
  const invalidUnits =
    rows.some((row) => row.unit.includes("\u0000")) ||
    new Set(rows.map((row) => row.unit)).size > 1;
  return { rows, invalidUnits };
}

function buildKpis(observations: SemanticObservationV125[]) {
  const employed = latestObservation(
    observations.filter(
      (row) =>
        row.semanticMeasure.key === "occupation_employment_count" &&
        dimensionValue(row, "occupation") === "all" &&
        dimensionValue(row, "sex") === "total"
    )
  ) || latestObservation(
    observations.filter((row) => row.semanticMeasure.key === "employed_persons")
  );
  const employmentRate = latestObservation(
    observations.filter((row) => row.semanticMeasure.key === "employment_rate")
  );
  const averageWage = latestObservation(
    observations.filter(
      (row) => row.semanticMeasure.key === "average_monthly_wage"
    )
  );
  return {
    employed,
    employmentRate,
    averageWage,
    latestYear:
      availableYears(observations)[0] ||
      null,
  };
}

function latestObservation(
  observations: SemanticObservationV125[]
): SemanticObservationV125 | undefined {
  return [...observations]
    .filter((row) => numericValue(row) !== null)
    .sort((left, right) => observationYear(right) - observationYear(left))[0];
}

function availableYears(observations: SemanticObservationV125[]): number[] {
  const years = new Set(
    observations
      .map(observationYear)
      .filter((year): year is number => Number.isFinite(year) && year > 0)
  );
  if (years.size === 0) years.add(DEFAULT_SELECTION.year);
  return Array.from(years).sort((left, right) => right - left);
}

function normalizeSelection(
  requested: E012VisualizationSelectionV125,
  years: number[]
): E012VisualizationSelectionV125 {
  const measure = isOccupationMeasure(requested.measure)
    ? requested.measure
    : DEFAULT_SELECTION.measure;
  const sex = isSex(requested.sex) ? requested.sex : DEFAULT_SELECTION.sex;
  const year = years.includes(requested.year)
    ? requested.year
    : years[0] || DEFAULT_SELECTION.year;
  return { measure, sex, year };
}

function availableSexesForMeasure(
  observations: SemanticObservationV125[],
  measure: E012OccupationMeasureKeyV125,
  year: number
): E012SexV125[] {
  return SEX_OPTIONS.map((option) => option.key).filter((sex) =>
    hasMeasureSex(observations, measure, sex, year)
  );
}

function hasMeasureSex(
  observations: SemanticObservationV125[],
  measure: E012OccupationMeasureKeyV125,
  sex: E012SexV125,
  year: number
): boolean {
  return observations.some(
    (row) =>
      row.semanticMeasure.key === measure &&
      dimensionValue(row, "occupation") !== "all" &&
      dimensionValue(row, "sex") === sex &&
      observationYear(row) === year &&
      numericValue(row) !== null
  );
}

function observationYear(observation?: SemanticObservationV125): number {
  if (!observation) return 0;
  const dimensionYear = Number(dimensionValue(observation, "year"));
  if (Number.isFinite(dimensionYear) && dimensionYear > 0) return dimensionYear;
  return typeof observation.year === "number" && Number.isFinite(observation.year)
    ? observation.year
    : 0;
}

function dimensionValue(
  observation: SemanticObservationV125,
  key: string
): string {
  return String(observation.dimensions[key] || "").trim();
}

function dimensionLabel(
  observation: SemanticObservationV125,
  key: string,
  value: string
): string {
  const explicit = String(observation.dimensionLabels[key] || "").trim();
  if (explicit) return explicit;
  if (key === "occupation") {
    if (value === "all" || !value) return "합계";
    return (
      E012_OCCUPATION_LABELS_V125.find((item) => item.key === value)?.label ||
      value
    );
  }
  if (key === "sex") return SEX_LABELS[value as E012SexV125] || value || "전체";
  return value || "전체";
}

function observationUnit(observation?: SemanticObservationV125): string {
  if (!observation) return "";
  return String(observation.unit || observation.semanticMeasure.unit || "").trim();
}

function numericValue(observation?: SemanticObservationV125): number | null {
  if (!observation || typeof observation.value !== "number") return null;
  return Number.isFinite(observation.value) ? observation.value : null;
}

function missingReason(observation?: SemanticObservationV125): string {
  if (!observation) return "해당 선택 조합 원자료 없음";
  return (
    publicMissingReasonLabelV126(
      observation.missingReasonCode,
      observation.note
    ) || ""
  );
}

function measureLabel(key: string): string {
  return MEASURE_LABELS[key as E012MeasureKeyV125] || key;
}

function isOccupationMeasure(
  value: string
): value is E012OccupationMeasureKeyV125 {
  return E012_MEASURE_OPTIONS_V125.some((option) => option.key === value);
}

function isSex(value: string): value is E012SexV125 {
  return SEX_OPTIONS.some((option) => option.key === value);
}

function formatValue(value: number, unit: string): string {
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function formatRawValue(value: number, raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return formatNumber(value, 4);
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);
}

function formatAxis(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function percentWidth(value: number, maxValue: number): string {
  return `${maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0}%`;
}
