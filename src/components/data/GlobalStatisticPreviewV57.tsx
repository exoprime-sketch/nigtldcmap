import { useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  getCompositionShares,
  getGlobalComparisonRows,
  getGlobalStatisticFieldValue,
  getGlobalStatisticYears,
  getGlobalTrend,
  getPreviewCountryName,
  getPreviewCountryOptions,
} from "../../utils/globalStatisticV57";
import { getFinalPreviewMode } from "../../utils/dataPreviewV53";
import "../../styles/global-statistic-v57.css";

interface ControlsProps {
  element: VietnamDemoElement;
  countryIso3: string;
  year: number;
  onCountryChange: (iso3: string) => void;
  onYearChange: (year: number) => void;
}

export function GlobalStatisticControlsV57({
  element,
  countryIso3,
  year,
  onCountryChange,
  onYearChange,
}: ControlsProps) {
  return (
    <section className="v57-global-controls">
      <label>
        <span>국가</span>
        <select
          value={countryIso3}
          onChange={(event) => onCountryChange(event.target.value)}
        >
          {getPreviewCountryOptions().map((country) => (
            <option key={country.iso3} value={country.iso3}>
              {country.nameKo} · {country.iso3}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>기준연도</span>
        <select
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {getGlobalStatisticYears(element).map((item) => (
            <option key={item} value={item}>
              {item}년
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

interface PreviewProps {
  element: VietnamDemoElement;
  countryIso3: string;
  year: number;
}

export function GlobalStatisticOverviewV57({
  element,
  countryIso3,
  year,
}: PreviewProps) {
  const [compareView, setCompareView] = useState<"chart" | "table">("chart");
  const mode = getFinalPreviewMode(element);
  const fields = element.presentation.headlineFields.slice(0, 4);
  const countryName = getPreviewCountryName(countryIso3);
  const trend = getGlobalTrend({
    elementId: element.elementId,
    countryIso3,
    year,
  });

  const comparisonRows = useMemo(
    () =>
      getGlobalComparisonRows({
        element,
        year,
        field: fields[0] ?? "값",
      }),
    [element, fields, year]
  );

  if (mode === "composition") {
    return (
      <CompositionGlobalView
        element={element}
        countryIso3={countryIso3}
        year={year}
        comparisonRows={comparisonRows}
        compareView={compareView}
        setCompareView={setCompareView}
      />
    );
  }

  const kpiFields = fields.slice(0, 3);

  return (
    <>
      <section className="v57-global-kpis">
        {kpiFields.map((field, index) => (
          <article key={field}>
            <span>{field}</span>
            <strong>
              {getGlobalStatisticFieldValue({
                element,
                field,
                countryIso3,
                year,
                index,
              })}
            </strong>
            <small>예시값 · {year}년</small>
          </article>
        ))}
      </section>

      <section className="v57-global-grid">
        <article className="v57-global-panel">
          <header>
            <div>
              <h4>{countryName} 최근 추세</h4>
              <p>최근 8개 기준연도 · 예시값</p>
            </div>
          </header>

          <GlobalLineChart values={trend} year={year} />

          <div className="v57-trend-values">
            {trend.slice(-5).map((value, index) => (
              <div key={index}>
                <span>{year - 4 + index}</span>
                <b>{value.toFixed(1)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="v57-global-panel">
          <header className="with-actions">
            <div>
              <h4>국가별 값 비교</h4>
              <p>{year}년 · 최종 공개 시 원천 DB 제공국가 전체 비교</p>
            </div>
            <div className="v57-view-toggle">
              <button
                type="button"
                className={compareView === "chart" ? "active" : ""}
                onClick={() => setCompareView("chart")}
              >
                차트
              </button>
              <button
                type="button"
                className={compareView === "table" ? "active" : ""}
                onClick={() => setCompareView("table")}
              >
                표
              </button>
            </div>
          </header>

          {compareView === "chart" ? (
            <ComparisonBars rows={comparisonRows} selectedIso3={countryIso3} />
          ) : (
            <ComparisonTable
              rows={comparisonRows}
              selectedIso3={countryIso3}
              year={year}
            />
          )}
        </article>
      </section>
    </>
  );
}

export function GlobalStatisticDetailV57({
  element,
  countryIso3,
  year,
}: PreviewProps) {
  const fields = element.presentation.headlineFields.slice(0, 6);
  const countryName = getPreviewCountryName(countryIso3);
  const comparisonRows = getGlobalComparisonRows({
    element,
    year,
    field: fields[0] ?? "값",
  });

  return (
    <section className="v57-detail-layout">
      <div className="v57-detail-selected">
        <header>
          <span>선택 범위</span>
          <h4>
            {countryName} · {year}년
          </h4>
        </header>

        <div className="v57-detail-fields">
          {fields.map((field, index) => (
            <div key={field}>
              <b>{field}</b>
              <span>
                {getGlobalStatisticFieldValue({
                  element,
                  field,
                  countryIso3,
                  year,
                  index,
                })}
              </span>
              <small>예시값</small>
            </div>
          ))}
        </div>
      </div>

      <div className="v57-detail-world">
        <header>
          <span>국가 비교</span>
          <h4>{year}년 비교표</h4>
        </header>

        <ComparisonTable
          rows={comparisonRows}
          selectedIso3={countryIso3}
          year={year}
        />
      </div>
    </section>
  );
}

function CompositionGlobalView({
  element,
  countryIso3,
  year,
  comparisonRows,
  compareView,
  setCompareView,
}: {
  element: VietnamDemoElement;
  countryIso3: string;
  year: number;
  comparisonRows: ReturnType<typeof getGlobalComparisonRows>;
  compareView: "chart" | "table";
  setCompareView: (value: "chart" | "table") => void;
}) {
  const fields = element.presentation.headlineFields.slice(0, 5);
  const countryName = getPreviewCountryName(countryIso3);
  const shares = getCompositionShares(
    element.elementId,
    countryIso3,
    year,
    fields.length
  );

  return (
    <section className="v57-global-grid">
      <article className="v57-global-panel">
        <header>
          <div>
            <h4>{countryName} 구성</h4>
            <p>{year}년 · 예시값</p>
          </div>
        </header>

        <div className="v57-composition-bar">
          {shares.map((share, index) => (
            <i key={fields[index]} style={{ width: `${share}%` }} />
          ))}
        </div>

        <div className="v57-composition-legend">
          {fields.map((field, index) => (
            <div key={field}>
              <span>{field}</span>
              <b>{shares[index].toFixed(1)}%</b>
            </div>
          ))}
        </div>

        <GlobalLineChart
          values={getGlobalTrend({
            elementId: `${element.elementId}:composition`,
            countryIso3,
            year,
          })}
          year={year}
        />
      </article>

      <article className="v57-global-panel">
        <header className="with-actions">
          <div>
            <h4>국가별 비교</h4>
            <p>
              {fields[0] ?? "주요 항목"} · {year}년
            </p>
          </div>
          <div className="v57-view-toggle">
            <button
              type="button"
              className={compareView === "chart" ? "active" : ""}
              onClick={() => setCompareView("chart")}
            >
              차트
            </button>
            <button
              type="button"
              className={compareView === "table" ? "active" : ""}
              onClick={() => setCompareView("table")}
            >
              표
            </button>
          </div>
        </header>

        {compareView === "chart" ? (
          <ComparisonBars rows={comparisonRows} selectedIso3={countryIso3} />
        ) : (
          <ComparisonTable
            rows={comparisonRows}
            selectedIso3={countryIso3}
            year={year}
          />
        )}
      </article>
    </section>
  );
}

function ComparisonBars({
  rows,
  selectedIso3,
}: {
  rows: ReturnType<typeof getGlobalComparisonRows>;
  selectedIso3: string;
}) {
  const max = Math.max(...rows.map((row) => row.score), 1);

  return (
    <div className="v57-compare-bars">
      {rows.map((row) => (
        <div
          key={row.iso3}
          className={row.iso3 === selectedIso3 ? "selected" : ""}
        >
          <span>{row.nameKo}</span>
          <div>
            <i style={{ width: `${(row.score / max) * 100}%` }} />
          </div>
          <b>{row.displayValue}</b>
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({
  rows,
  selectedIso3,
  year,
}: {
  rows: ReturnType<typeof getGlobalComparisonRows>;
  selectedIso3: string;
  year: number;
}) {
  return (
    <div className="v57-comparison-table">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            <th>값</th>
            <th>기준</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.iso3}
              className={row.iso3 === selectedIso3 ? "selected" : ""}
            >
              <td>{row.nameKo}</td>
              <td>{row.displayValue}</td>
              <td>{year}년</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GlobalLineChart({ values, year }: { values: number[]; year: number }) {
  const width = 620;
  const height = 210;
  const padding = 14;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const path = values
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="v57-line">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={path} />
      </svg>
      <div>
        <span>{year - values.length + 1}</span>
        <span>{year - Math.floor(values.length / 2)}</span>
        <span>{year}</span>
      </div>
    </div>
  );
}
