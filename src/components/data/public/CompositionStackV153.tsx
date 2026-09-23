import { useMemo, useState } from "react";
import ChartAxesV150 from "../../charts/ChartAxesV150";
import { STACKED_AREA_PATTERNS_V153, StackedAreaChartV153 } from "../../charts/StackedAreaChartV153";
import type { StackedAreaSeriesV153, StackedAreaYearV153 } from "../../charts/StackedAreaChartV153";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./composition-stack-v153.css";

/**
 * V153-D1: the first block of a composition dataset - the absolute stacked
 * area over the years every component is delivered, with the share view as a
 * toggle. Series that hold a negative value (removals) cannot be stacked and
 * are named beside the chart instead of being dropped silently.
 */
export interface CompositionStackSeriesV153 {
  key: string;
  label: string;
  color?: string;
  points: Array<{ year: number; value: number }>;
}

interface Props {
  elementId: string;
  headingId: string;
  title: string;
  series: CompositionStackSeriesV153[];
  unit: string;
  /** Words for the chart: the subject ("가스"), the quantity ("배출량"). */
  subject: string;
  quantity: string;
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  /** The panel class of the host component, so the block reads like its siblings. */
  panelClassName: string;
  headingClassName: string;
}

const STACK_COLORS_V153 = ["#176b57", "#d97706", "#2563a6", "#a23e63", "#6d5aa8", "#4f7d20", "#b45309", "#0f766e", "#68737d"];

export function compositionStackModelV153(series: CompositionStackSeriesV153[]): {
  stackable: StackedAreaSeriesV153[];
  excluded: string[];
  years: StackedAreaYearV153[];
} {
  const excluded = series.filter((item) => item.points.some((point) => point.value < 0)).map((item) => item.label);
  const stackableSource = series.filter((item) => !item.points.some((point) => point.value < 0));
  const stackable = stackableSource.map<StackedAreaSeriesV153>((item, index) => ({
    key: item.key,
    label: item.label,
    color: item.color || STACK_COLORS_V153[index % STACK_COLORS_V153.length],
    pattern: STACKED_AREA_PATTERNS_V153[index % STACKED_AREA_PATTERNS_V153.length],
  }));
  const yearSet = new Set(stackableSource.flatMap((item) => item.points.map((point) => point.year)));
  const years = Array.from(yearSet)
    .sort((left, right) => left - right)
    .flatMap<StackedAreaYearV153>((year) => {
      const values: Record<string, number> = {};
      for (const item of stackableSource) {
        const point = item.points.find((candidate) => candidate.year === year);
        if (!point) return [];
        values[item.key] = point.value;
      }
      return [{ year, values, total: null }];
    });
  return { stackable, excluded, years };
}

export default function CompositionStackV153({
  elementId,
  headingId,
  title,
  series,
  unit,
  subject,
  quantity,
  selectedYear,
  onSelectYear,
  panelClassName,
  headingClassName,
}: Props) {
  const [mode, setMode] = useState<"absolute" | "share">("absolute");
  const model = useMemo(() => compositionStackModelV153(series), [series]);
  const visible = useMemo(() => new Set(model.stackable.map((item) => item.key)), [model.stackable]);
  if (model.stackable.length < 2 || model.years.length < 2) return null;
  const firstYear = model.years[0].year;
  const lastYear = model.years[model.years.length - 1].year;
  return (
    <section
      className={`${panelClassName} cs153`}
      aria-labelledby={`${headingId}-stack`}
      data-analysis-block="stacked-area"
      data-testid="composition-stack-v153"
      data-element-id={elementId}
      data-stack-mode={mode}
      data-stack-years={model.years.length}
      data-stack-excluded={model.excluded.length}
    >
      <header className={headingClassName}>
        <div>
          <span>주 분석</span>
          <h3 id={`${headingId}-stack`}>{title}</h3>
          <p>
            {firstYear}–{lastYear}년 · 모든 {model.stackable.length}개 {subject}이(가) 제공된 연도만 쌓았습니다. 비중은 같은 단위의 {subject}별 합계를 분모로 합니다.
            {selectedYear ? ` 차트를 누르면 ${selectedYear}년 상세가 바뀝니다.` : ""}
          </p>
        </div>
        <div className="cs153__mode" role="group" aria-label="표시 방식">
          <button type="button" aria-pressed={mode === "absolute"} onClick={() => setMode("absolute")}>절대량</button>
          <button type="button" aria-pressed={mode === "share"} onClick={() => setMode("share")}>비중</button>
        </div>
      </header>
      <ChartAxesV150
        x="연도"
        y={mode === "share" ? `${subject}별 구성비(누적 면적)` : `${subject}별 ${quantity}(누적 면적)`}
        unit={mode === "share" ? "%" : unit}
        composition={mode === "share"}
      />
      <StackedAreaChartV153
        mode={mode}
        series={model.stackable}
        years={model.years}
        unit={mode === "share" ? "%" : unit}
        visibleSeries={visible}
        onSelectYear={onSelectYear}
        labels={{ subject, quantity, total: "합계" }}
        totalLineTestId={`${elementId.toLowerCase()}-stack-total-line-v153`}
        tooltipTestId={`${elementId.toLowerCase()}-stack-tooltip-v153`}
      />
      {model.excluded.length > 0 && (
        <p className="cs153__excluded" role="note" data-testid="composition-stack-excluded-v153">
          누적에서 제외: <PublicTermTextV134 text={model.excluded.join(" · ")} /> — 음수(흡수) 값을 포함하는 {subject}은(는) 면적으로 쌓지 않고 아래 계열별 변화에서 확인합니다.
        </p>
      )}
    </section>
  );
}
