import { useMemo } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  formatDimensionValueV68,
  getDimensionDefinitionV68,
  getDimensionSelectionLabelV68,
  getSelectedDimensionMetricV68,
  sampleDimensionValueV68,
} from "../../utils/dataDimensionV68";
import "../../styles/dimension-aware-v68.css";

interface DimensionControlProps {
  element: VietnamDemoElement;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function DimensionControlsV68({
  element,
  values,
  onChange,
}: DimensionControlProps) {
  const definition = getDimensionDefinitionV68(element.elementId);
  if (!definition) return null;

  return (
    <section
      className={`v68-dimension-controls controls-${Math.min(
        definition.selectors.length,
        3
      )}`}
    >
      {definition.selectors.map((selector) => (
        <label key={selector.key}>
          <span>{selector.label}</span>
          <select
            value={values[selector.key] ?? ""}
            onChange={(event) => onChange(selector.key, event.target.value)}
          >
            {selector.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </section>
  );
}

interface OverviewProps {
  element: VietnamDemoElement;
  countryIso3: string;
  countryName: string;
  year: number;
  values: Record<string, string>;
}

export function DimensionAwareOverviewV68({
  element,
  countryIso3,
  countryName,
  year,
  values,
}: OverviewProps) {
  const definition = getDimensionDefinitionV68(element.elementId);
  if (!definition) return null;

  if (definition.kind === "budget_mix") {
    return (
      <BudgetMixViewV68
        element={element}
        countryIso3={countryIso3}
        countryName={countryName}
        year={year}
        values={values}
      />
    );
  }

  if (definition.kind === "scenario") {
    return (
      <ScenarioViewV68
        element={element}
        countryIso3={countryIso3}
        countryName={countryName}
        year={year}
        values={values}
      />
    );
  }

  if (definition.kind === "sensitivity") {
    return (
      <SensitivityViewV68
        element={element}
        countryIso3={countryIso3}
        countryName={countryName}
        year={year}
        values={values}
      />
    );
  }

  return (
    <MetricViewV68
      element={element}
      countryIso3={countryIso3}
      countryName={countryName}
      year={year}
      values={values}
    />
  );
}

function MetricViewV68({
  element,
  countryIso3,
  countryName,
  year,
  values,
}: OverviewProps) {
  const definition = getDimensionDefinitionV68(element.elementId)!;
  const metric = getSelectedDimensionMetricV68(definition, values);
  const selection = getDimensionSelectionLabelV68(definition, values);

  const current = sampleDimensionValueV68({
    elementId: element.elementId,
    countryIso3,
    year,
    metric,
    values,
  });

  const trend = Array.from({ length: 8 }, (_, index) => ({
    year: year - 7 + index,
    value: sampleDimensionValueV68({
      elementId: element.elementId,
      countryIso3,
      year: year - 7 + index,
      metric,
      values,
      salt: "trend",
    }),
  }));

  const comparison = PRIORITY_COUNTRIES.map((country) => ({
    ...country,
    value: sampleDimensionValueV68({
      elementId: element.elementId,
      countryIso3: country.iso3,
      year,
      metric,
      values,
      salt: "compare",
    }),
  })).sort((a, b) => b.value - a.value);

  return (
    <section className="v68-data-view">
      <div className="v68-kpis">
        <article className="primary">
          <span>{metric.label}</span>
          <strong>{formatDimensionValueV68(current, metric)}</strong>
          <small>{selection || countryName} · 예시값</small>
        </article>

        <article>
          <span>선택 조건</span>
          <strong>{selection || "전체"}</strong>
          <small>
            {countryName} · {year}년
          </small>
        </article>

        {definition.context?.slice(0, 2).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>비교 기준</small>
          </article>
        ))}
      </div>

      <div className="v68-grid">
        <article className="v68-panel">
          <header>
            <h4>
              {countryName} {definition.trendLabel ?? "최근 추세"}
            </h4>
            <p>{selection} · 예시값</p>
          </header>
          <SimpleLineV68 rows={trend} metric={metric} />
        </article>

        <article className="v68-panel">
          <header>
            <h4>{definition.comparisonLabel ?? "국가별 비교"}</h4>
            <p>{year}년 · 동일 선택조건</p>
          </header>
          <ComparisonBarsV68
            rows={comparison}
            selectedIso3={countryIso3}
            metric={metric}
          />
        </article>
      </div>

      <div className="v68-note">{definition.note}</div>
    </section>
  );
}

function ScenarioViewV68(props: OverviewProps) {
  const definition = getDimensionDefinitionV68(props.element.elementId)!;
  const metric = getSelectedDimensionMetricV68(definition, props.values);
  const selection = getDimensionSelectionLabelV68(definition, props.values);
  const horizons = [2030, 2050, 2100];

  const rows = horizons.map((horizon) => ({
    year: horizon,
    value: sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: props.countryIso3,
      year: horizon,
      metric,
      values: props.values,
      salt: "scenario",
    }),
  }));

  const comparison = PRIORITY_COUNTRIES.map((country) => ({
    ...country,
    value: sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: country.iso3,
      year: 2050,
      metric,
      values: props.values,
      salt: "scenario-compare",
    }),
  })).sort((a, b) => b.value - a.value);

  return (
    <section className="v68-data-view">
      <div className="v68-kpis">
        <article className="primary">
          <span>{metric.label} · 2050</span>
          <strong>{formatDimensionValueV68(rows[1].value, metric)}</strong>
          <small>{selection} · 예시값</small>
        </article>
        <article>
          <span>선택 조건</span>
          <strong>{selection}</strong>
          <small>{props.countryName}</small>
        </article>
        {definition.context?.slice(0, 2).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>전망 기준</small>
          </article>
        ))}
      </div>

      <div className="v68-grid">
        <article className="v68-panel">
          <header>
            <h4>
              {props.countryName} {definition.trendLabel ?? "전망"}
            </h4>
            <p>{selection} · 2030/2050/2100</p>
          </header>
          <SimpleLineV68 rows={rows} metric={metric} />
        </article>
        <article className="v68-panel">
          <header>
            <h4>{definition.comparisonLabel ?? "2050 국가 비교"}</h4>
            <p>2050 · 동일 시나리오·지표</p>
          </header>
          <ComparisonBarsV68
            rows={comparison}
            selectedIso3={props.countryIso3}
            metric={metric}
          />
        </article>
      </div>

      <div className="v68-note">{definition.note}</div>
    </section>
  );
}

function SensitivityViewV68(props: OverviewProps) {
  const definition = getDimensionDefinitionV68(props.element.elementId)!;
  const metric = getSelectedDimensionMetricV68(definition, props.values);
  const selection = getDimensionSelectionLabelV68(definition, props.values);

  const parameterSelector = definition.selectors.find(
    (selector) => selector.key === "price"
  );
  const parameterRows =
    parameterSelector?.options.map((option, index) => ({
      label: option.label,
      x: index,
      value: sampleDimensionValueV68({
        elementId: props.element.elementId,
        countryIso3: props.countryIso3,
        year: props.year,
        metric,
        values: {
          ...props.values,
          [parameterSelector.key]: option.value,
        },
        salt: "sensitivity",
      }),
    })) ?? [];

  const current = sampleDimensionValueV68({
    elementId: props.element.elementId,
    countryIso3: props.countryIso3,
    year: props.year,
    metric,
    values: props.values,
    salt: "current",
  });

  const comparison = PRIORITY_COUNTRIES.map((country) => ({
    ...country,
    value: sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: country.iso3,
      year: props.year,
      metric,
      values: props.values,
      salt: "compare",
    }),
  })).sort((a, b) => b.value - a.value);

  return (
    <section className="v68-data-view">
      <div className="v68-kpis">
        <article className="primary">
          <span>{metric.label}</span>
          <strong>{formatDimensionValueV68(current, metric)}</strong>
          <small>{selection} · 예시값</small>
        </article>
        <article>
          <span>선택 조건</span>
          <strong>{selection}</strong>
          <small>{props.countryName}</small>
        </article>
        {definition.context?.slice(0, 2).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>분석 조건</small>
          </article>
        ))}
      </div>

      <div className="v68-grid">
        <article className="v68-panel">
          <header>
            <h4>{definition.trendLabel ?? "민감도"}</h4>
            <p>{props.countryName} · 예시값</p>
          </header>
          <SensitivityBarsV68 rows={parameterRows} metric={metric} />
        </article>
        <article className="v68-panel">
          <header>
            <h4>{definition.comparisonLabel ?? "국가 비교"}</h4>
            <p>동일 조건</p>
          </header>
          <ComparisonBarsV68
            rows={comparison}
            selectedIso3={props.countryIso3}
            metric={metric}
          />
        </article>
      </div>

      <div className="v68-note">{definition.note}</div>
    </section>
  );
}

function BudgetMixViewV68(props: OverviewProps) {
  const definition = getDimensionDefinitionV68(props.element.elementId)!;
  const selection = props.values.budgetType ?? "전체 구성";
  const total = sampleDimensionValueV68({
    elementId: props.element.elementId,
    countryIso3: props.countryIso3,
    year: props.year,
    metric: definition.metric,
    values: props.values,
    salt: "total",
  });

  const raw = [
    sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: props.countryIso3,
      year: props.year,
      metric: { ...definition.metric, min: 20, max: 70 },
      values: props.values,
      salt: "mitigation-share",
    }),
    sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: props.countryIso3,
      year: props.year,
      metric: { ...definition.metric, min: 15, max: 55 },
      values: props.values,
      salt: "adaptation-share",
    }),
    sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: props.countryIso3,
      year: props.year,
      metric: { ...definition.metric, min: 5, max: 25 },
      values: props.values,
      salt: "cross-share",
    }),
  ];
  const sum = raw.reduce((acc, value) => acc + value, 0);
  const shares = raw.map((value) => (value / sum) * 100);
  const labels = ["감축", "적응", "교차·기타"];

  const selectedIndex =
    selection === "감축"
      ? 0
      : selection === "적응"
      ? 1
      : selection === "교차·기타"
      ? 2
      : -1;

  const comparisonMetric = {
    label:
      selectedIndex >= 0 ? `${labels[selectedIndex]} 예산 비중` : "총 기후예산",
    unit: selectedIndex >= 0 ? "%" : "USD M",
    min: selectedIndex >= 0 ? 5 : 25,
    max: selectedIndex >= 0 ? 80 : 9500,
    decimals: 1,
  };

  const comparison = PRIORITY_COUNTRIES.map((country) => ({
    ...country,
    value: sampleDimensionValueV68({
      elementId: props.element.elementId,
      countryIso3: country.iso3,
      year: props.year,
      metric: comparisonMetric,
      values: props.values,
      salt: "budget-compare",
    }),
  })).sort((a, b) => b.value - a.value);

  return (
    <section className="v68-data-view">
      <div className="v68-budget-kpis">
        <article className="primary">
          <span>총 기후예산</span>
          <strong>{formatDimensionValueV68(total, definition.metric)}</strong>
          <small>
            {props.countryName} · {props.year}년 · 예시값
          </small>
        </article>
        {labels.map((label, index) => (
          <article key={label}>
            <span>{label} 예산</span>
            <strong>
              {((total * shares[index]) / 100).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}{" "}
              USD M
            </strong>
            <small>{shares[index].toFixed(1)}%</small>
          </article>
        ))}
      </div>

      <div className="v68-grid">
        <article className="v68-panel">
          <header>
            <h4>{props.countryName} 감축·적응 예산 구성</h4>
            <p>{props.year}년 · 금액과 비중 동시 확인</p>
          </header>

          <div className="v68-budget-stack">
            {shares.map((share, index) => (
              <i key={labels[index]} style={{ width: `${share}%` }} />
            ))}
          </div>

          <div className="v68-budget-legend">
            {labels.map((label, index) => (
              <div key={label}>
                <span>{label}</span>
                <b>{shares[index].toFixed(1)}%</b>
              </div>
            ))}
          </div>
        </article>

        <article className="v68-panel">
          <header>
            <h4>{definition.comparisonLabel}</h4>
            <p>
              {selection} · {props.year}년
            </p>
          </header>
          <ComparisonBarsV68
            rows={comparison}
            selectedIso3={props.countryIso3}
            metric={comparisonMetric}
          />
        </article>
      </div>

      <div className="v68-note">{definition.note}</div>
    </section>
  );
}

function ComparisonBarsV68({
  rows,
  selectedIso3,
  metric,
}: {
  rows: { iso3: string; nameKo: string; value: number }[];
  selectedIso3: string;
  metric: {
    label: string;
    unit: string;
    min: number;
    max: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="v68-compare-bars">
      {rows.map((row) => (
        <div
          key={row.iso3}
          className={row.iso3 === selectedIso3 ? "selected" : ""}
        >
          <span>{row.nameKo}</span>
          <i>
            <b
              style={{
                width: `${Math.max(3, (Math.abs(row.value) / max) * 100)}%`,
              }}
            />
          </i>
          <strong>{formatDimensionValueV68(row.value, metric)}</strong>
        </div>
      ))}
    </div>
  );
}

function SimpleLineV68({
  rows,
  metric,
}: {
  rows: { year: number; value: number }[];
  metric: {
    label: string;
    unit: string;
    min: number;
    max: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}) {
  const width = 620;
  const height = 215;
  const pad = 16;
  const values = rows.map((row) => row.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);

  const path = rows
    .map((row, index) => {
      const x =
        pad + (index / Math.max(1, rows.length - 1)) * (width - pad * 2);
      const y = height - pad - ((row.value - min) / range) * (height - pad * 2);

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <>
      <svg className="v68-line" viewBox={`0 0 ${width} ${height}`}>
        <path d={path} />
      </svg>
      <div className="v68-line-labels">
        {rows.map((row) => (
          <span key={row.year}>{row.year}</span>
        ))}
      </div>
      <div className="v68-latest-value">
        최근/중앙값 ·{" "}
        <b>
          {formatDimensionValueV68(
            rows[Math.floor((rows.length - 1) / 2)]?.value ?? 0,
            metric
          )}
        </b>
      </div>
    </>
  );
}

function SensitivityBarsV68({
  rows,
  metric,
}: {
  rows: { label: string; value: number }[];
  metric: {
    label: string;
    unit: string;
    min: number;
    max: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="v68-sensitivity">
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <i>
            <b
              style={{
                width: `${Math.max(3, (Math.abs(row.value) / max) * 100)}%`,
              }}
            />
          </i>
          <strong>{formatDimensionValueV68(row.value, metric)}</strong>
        </div>
      ))}
    </div>
  );
}
