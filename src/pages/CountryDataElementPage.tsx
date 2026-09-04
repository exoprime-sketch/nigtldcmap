import { useEffect, useMemo, useState } from "react";
import {
  loadCatalogForCountrySelectionV122,
  loadCountryElementBundleV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import type { CountryCatalogItemV122 } from "../data/countries/countryDataTypesV122";
import {
  publicDataStatusLabelV128,
  publicDataStatusKeyV128,
  publicDownloadStatusV128,
} from "../data/publicPlatformV128";
import type {
  VietnamElementMetaBundleV124,
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import {
  formatValueV121,
} from "../utils/vietnamActualV121";
import { A024_LINE_MEASURE_V125 } from "../data/visualization/mapSelectorBindingsV125";
import CountryElementVisualizationV123 from "../components/data/CountryDataFullPreviewV52";
import { PublicTermTextV134 } from "../components/help/PublicTermV134";
import "../styles/country-data-platform-v122.css";

interface Props {
  elementId: string | null;
  countryIso3: string | null;
  onBack: () => void;
  backLabel?: string;
  onOpenDownload: (
    elementId: string,
    countryIso3: string,
    datasetId?: string | null
  ) => void;
  onCountryChange: (iso3: string) => void;
  onOpenElement: (elementId: string, countryIso3: string) => void;
  onOpenMapElement: (
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) => void;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

interface ElementBundle {
  meta: VietnamElementMetaBundleV124;
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
}

function cleanPublicIndicatorLabelV122(label: string): string {
  // Source labels carry meaningful dimensions after dashes (occupation, sex,
  // technology, region, scenario, and similar qualifiers). Keep the complete
  // published label instead of treating its suffix as decoration.
  return label.trim() || "항목";
}

const CHART_SERIES_COLORS_V122 = [
  "#0f766e",
  "#2563eb",
  "#c2410c",
  "#7c3aed",
  "#be123c",
  "#4d7c0f",
  "#0369a1",
  "#a16207",
  "#0e7490",
  "#6d28d9",
  "#b91c1c",
  "#3f6212",
] as const;

type NumericObservationV122 = VietnamObservationV124 & {
  year: number;
  value: number;
};

type ChartSeriesV122 = {
  indicatorId: string;
  label: string;
  unit: string;
  color: string;
  rows: NumericObservationV122[];
};

type ChartGroupV122 = {
  key: string;
  label: string;
  series: ChartSeriesV122[];
  omittedCount: number;
};

type ChartPointV122 = {
  x: number;
  y: number;
  row: NumericObservationV122;
};

type ChartTooltipV122 = {
  x: number;
  y: number;
  color: string;
  label: string;
  year: number;
  value: number;
  unit: string;
};

function chartGroupForIndicatorV122(
  meta: VietnamIndicatorMetaV124 | undefined,
  fallbackUnit: string
): { key: string; label: string } {
  const unit = (meta?.unit || fallbackUnit || "값").trim() || "값";
  const source = `${meta?.indicatorId || ""} ${meta?.labelKo || ""}`;
  const isLegacySeries = /scale10|구\s*척도|2011년\s*이전/i.test(source);
  if (isLegacySeries) {
    return {
      key: `${unit}::legacy`,
      label: `${unit} · 2011년 이전 계열`,
    };
  }
  return { key: `${unit}::current`, label: unit };
}

function smoothMonotonePathV122(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return (next.y - point.y) / Math.max(1e-9, next.x - point.x);
  });
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) {
      return 0;
    }
    return (before + after) / 2;
  });

  slopes.forEach((slope, index) => {
    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      return;
    }
    const left = tangents[index] / slope;
    const right = tangents[index + 1] / slope;
    const magnitude = Math.hypot(left, right);
    if (magnitude > 3) {
      const scale = 3 / magnitude;
      tangents[index] = scale * left * slope;
      tangents[index + 1] = scale * right * slope;
    }
  });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const dx = next.x - current.x;
    path += [
      " C",
      current.x + dx / 3,
      current.y + (tangents[index] * dx) / 3,
      next.x - dx / 3,
      next.y - (tangents[index + 1] * dx) / 3,
      next.x,
      next.y,
    ].join(" ");
  }
  return path;
}

function buildChartGroupsV122(
  rows: VietnamObservationV124[],
  metadataById: Map<string, VietnamIndicatorMetaV124>,
  selectedIndicatorId: string
): ChartGroupV122[] {
  const byIndicator = new Map<string, NumericObservationV122[]>();
  rows.forEach((row) => {
    if (
      typeof row.year !== "number" ||
      typeof row.value !== "number" ||
      (selectedIndicatorId !== "all" && row.indicatorId !== selectedIndicatorId)
    ) {
      return;
    }
    const bucket = byIndicator.get(row.indicatorId) || [];
    bucket.push(row as NumericObservationV122);
    byIndicator.set(row.indicatorId, bucket);
  });

  const indicatorOrder = Array.from(metadataById.keys());
  const orderedIds = Array.from(byIndicator.keys()).sort((left, right) => {
    const leftIndex = indicatorOrder.indexOf(left);
    const rightIndex = indicatorOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

  const groups = new Map<string, ChartGroupV122>();
  orderedIds.forEach((indicatorId, colorIndex) => {
    const rowsByYear = new Map<number, NumericObservationV122[]>();
    (byIndicator.get(indicatorId) || []).forEach((row) => {
      const yearRows = rowsByYear.get(row.year) || [];
      yearRows.push(row);
      rowsByYear.set(row.year, yearRows);
    });

    const seriesRows = Array.from(rowsByYear.entries())
      .sort(([left], [right]) => left - right)
      .flatMap(([, yearRows]) => {
        const distinctValues = new Set(yearRows.map((row) => row.value));
        return distinctValues.size === 1 ? [yearRows[yearRows.length - 1]] : [];
      });
    if (seriesRows.length < 2) return;

    const meta = metadataById.get(indicatorId);
    const fallbackUnit = seriesRows.find((row) => row.unit)?.unit || "값";
    const group = chartGroupForIndicatorV122(meta, fallbackUnit);
    if (!groups.has(group.key)) {
      groups.set(group.key, {
        key: group.key,
        label: group.label,
        series: [],
        omittedCount: 0,
      });
    }
    groups.get(group.key)?.series.push({
      indicatorId,
      label: cleanPublicIndicatorLabelV122(meta?.labelKo || indicatorId),
      unit: meta?.unit || fallbackUnit,
      color:
        CHART_SERIES_COLORS_V122[colorIndex % CHART_SERIES_COLORS_V122.length],
      rows: seriesRows,
    });
  });

  return Array.from(groups.values())
    .filter((group) => group.series.length > 0)
    .map((group) => {
      if (selectedIndicatorId !== "all" || group.series.length <= 8) {
        return group;
      }
      const ranked = [...group.series].sort((left, right) => {
        if (right.rows.length !== left.rows.length)
          return right.rows.length - left.rows.length;
        const leftLatest = Math.max(...left.rows.map((row) => row.year));
        const rightLatest = Math.max(...right.rows.map((row) => row.year));
        if (rightLatest !== leftLatest) return rightLatest - leftLatest;
        return left.label.localeCompare(right.label, "ko");
      });
      return {
        ...group,
        series: ranked.slice(0, 8),
        omittedCount: Math.max(0, ranked.length - 8),
      };
    });
}

function TimeSeriesGroupChartV122({
  group,
  showGroupTitle,
}: {
  group: ChartGroupV122;
  showGroupTitle: boolean;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipV122 | null>(null);
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const allRows = group.series.flatMap((series) => series.rows);
  const width = 900;
  const height = 310;
  const padding = { left: 66, right: 30, top: 28, bottom: 50 };
  const minYear = Math.min(...allRows.map((row) => row.year));
  const maxYear = Math.max(...allRows.map((row) => row.year));
  const rawMinValue = Math.min(...allRows.map((row) => row.value));
  const rawMaxValue = Math.max(...allRows.map((row) => row.value));
  const rawRange = Math.max(1e-9, rawMaxValue - rawMinValue);
  const valuePadding = rawRange * 0.08;
  const minValue =
    rawMinValue >= 0
      ? Math.max(0, rawMinValue - valuePadding)
      : rawMinValue - valuePadding;
  const maxValue =
    rawMinValue === rawMaxValue
      ? rawMaxValue + Math.max(1, Math.abs(rawMaxValue) * 0.08)
      : rawMaxValue + valuePadding;
  const normalizedMinValue =
    rawMinValue === rawMaxValue
      ? rawMinValue - Math.max(1, Math.abs(rawMinValue) * 0.08)
      : minValue;
  const yearRange = Math.max(1, maxYear - minYear);
  const valueRange = Math.max(1e-9, maxValue - normalizedMinValue);
  const x = (year: number) =>
    padding.left +
    ((year - minYear) / yearRange) * (width - padding.left - padding.right);
  const y = (value: number) =>
    height -
    padding.bottom -
    ((value - normalizedMinValue) / valueRange) *
      (height - padding.top - padding.bottom);
  const uniqueYears = Array.from(new Set(allRows.map((row) => row.year))).sort(
    (left, right) => left - right
  );
  const tickCount = Math.min(6, uniqueYears.length);
  const yearTicks = Array.from({ length: tickCount }, (_, index) => {
    if (tickCount === 1) return uniqueYears[0];
    const yearIndex = Math.round(
      (index * (uniqueYears.length - 1)) / (tickCount - 1)
    );
    return uniqueYears[yearIndex];
  }).filter((year, index, values) => index === 0 || year !== values[index - 1]);

  const plottedSeries = group.series.map((series) => ({
    ...series,
    points: series.rows.map(
      (row): ChartPointV122 => ({ x: x(row.year), y: y(row.value), row })
    ),
  }));
  const tooltipWidth = 310;
  const tooltipHeight = 68;
  const tooltipX = tooltip
    ? Math.min(
        width - padding.right - tooltipWidth,
        Math.max(padding.left, tooltip.x + 14)
      )
    : 0;
  const tooltipY = tooltip
    ? Math.min(
        height - padding.bottom - tooltipHeight,
        Math.max(padding.top, tooltip.y - tooltipHeight - 12)
      )
    : 0;

  return (
    <div className="cdp-chart-group">
      {showGroupTitle && (
        <h4 className="cdp-chart-group__title">단위: {group.label}</h4>
      )}
      <div className="cdp-chart-legend" aria-label={`${group.label} 범례`}>
        {group.series.map((series) => (
          <span
            className="cdp-chart-legend__item"
            key={series.indicatorId}
            title={series.label}
            onPointerEnter={() => setHoveredSeriesId(series.indicatorId)}
            onPointerLeave={() => setHoveredSeriesId(null)}
          >
            <i aria-hidden="true" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </span>
        ))}
      </div>
      {group.omittedCount > 0 && (
        <p className="cdp-chart-limit-note">
          전체 선택에서는 시계열 가독성을 위해 대표 8개 계열만 표시합니다 ·{" "}
          {group.omittedCount}개 계열은 위 항목 필터에서 개별 선택할 수 있습니다
        </p>
      )}
      <div className="cdp-chart-wrap">
        <div className="cdp-chart-stage">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            className="cdp-chart"
            aria-label={`${group.series
              .map((series) => series.label)
              .join(", ")} 연도별 변화`}
            onPointerLeave={() => {
              setTooltip(null);
              setHoveredSeriesId(null);
            }}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = maxValue - valueRange * ratio;
              const yy =
                padding.top + ratio * (height - padding.top - padding.bottom);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={yy}
                    x2={width - padding.right}
                    y2={yy}
                    className="cdp-chart__grid"
                  />
                  <text
                    x={padding.left - 10}
                    y={yy + 4}
                    textAnchor="end"
                    className="cdp-chart__label"
                  >
                    {formatValueV121(value)}
                  </text>
                </g>
              );
            })}

            {yearTicks.map((year) => (
              <g key={year}>
                <line
                  x1={x(year)}
                  y1={padding.top}
                  x2={x(year)}
                  y2={height - padding.bottom}
                  className="cdp-chart__grid cdp-chart__grid--vertical"
                />
                <text
                  x={x(year)}
                  y={height - 15}
                  textAnchor="middle"
                  className="cdp-chart__label"
                >
                  {year}
                </text>
              </g>
            ))}

            {plottedSeries.map((series) => {
              const path = smoothMonotonePathV122(series.points);
              const representativePoint =
                series.points[Math.floor(series.points.length / 2)];
              const showSeriesTooltip = () => {
                setHoveredSeriesId(series.indicatorId);
                if (!representativePoint) return;
                setTooltip({
                  x: representativePoint.x,
                  y: representativePoint.y,
                  color: series.color,
                  label: series.label,
                  year: representativePoint.row.year,
                  value: representativePoint.row.value,
                  unit: representativePoint.row.unit || series.unit,
                });
              };
              const muted =
                Boolean(hoveredSeriesId) &&
                hoveredSeriesId !== series.indicatorId;
              return (
                <g
                  key={series.indicatorId}
                  className={`cdp-chart__series${muted ? " is-muted" : ""}`}
                >
                  <path
                    d={path}
                    className="cdp-chart__hit-line"
                    onPointerEnter={showSeriesTooltip}
                  >
                    <title>{series.label}</title>
                  </path>
                  <path
                    d={path}
                    className="cdp-chart__line"
                    stroke={series.color}
                    onPointerEnter={showSeriesTooltip}
                  >
                    <title>{series.label}</title>
                  </path>
                  {series.points.map((point) => (
                    <circle
                      key={point.row.recordId}
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      className="cdp-chart__point"
                      fill="#fff"
                      stroke={series.color}
                      tabIndex={0}
                      aria-label={`${series.label}, ${
                        point.row.year
                      }년, ${formatValueV121(point.row.value)}${
                        point.row.unit || series.unit
                          ? ` ${point.row.unit || series.unit}`
                          : ""
                      }`}
                      onPointerEnter={() => {
                        setHoveredSeriesId(series.indicatorId);
                        setTooltip({
                          x: point.x,
                          y: point.y,
                          color: series.color,
                          label: series.label,
                          year: point.row.year,
                          value: point.row.value,
                          unit: point.row.unit || series.unit,
                        });
                      }}
                      onPointerLeave={() => setTooltip(null)}
                      onFocus={() => {
                        setHoveredSeriesId(series.indicatorId);
                        setTooltip({
                          x: point.x,
                          y: point.y,
                          color: series.color,
                          label: series.label,
                          year: point.row.year,
                          value: point.row.value,
                          unit: point.row.unit || series.unit,
                        });
                      }}
                      onBlur={() => {
                        setTooltip(null);
                        setHoveredSeriesId(null);
                      }}
                    >
                      <title>{`${series.label} · ${
                        point.row.year
                      }년 · ${formatValueV121(point.row.value)}${
                        point.row.unit || series.unit
                          ? ` ${point.row.unit || series.unit}`
                          : ""
                      }`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}

            {tooltip && (
              <g
                className="cdp-chart-tooltip"
                transform={`translate(${tooltipX} ${tooltipY})`}
                pointerEvents="none"
              >
                <rect width={tooltipWidth} height={tooltipHeight} rx="10" />
                <circle cx="16" cy="19" r="5" fill={tooltip.color} />
                <text x="29" y="23" className="cdp-chart-tooltip__title">
                  {tooltip.label.length > 44
                    ? `${tooltip.label.slice(0, 44)}…`
                    : tooltip.label}
                </text>
                <text x="16" y="50" className="cdp-chart-tooltip__value">
                  {`${tooltip.year}년 · ${formatValueV121(tooltip.value)}${
                    tooltip.unit ? ` ${tooltip.unit}` : ""
                  }`}
                </text>
                <title>{tooltip.label}</title>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

function TimeSeriesChart({
  rows,
  metadataById,
  selectedIndicatorId,
}: {
  rows: VietnamObservationV124[];
  metadataById: Map<string, VietnamIndicatorMetaV124>;
  selectedIndicatorId: string;
}) {
  const groups = useMemo(
    () =>
      buildChartGroupsV122(
        rows,
        metadataById,
        selectedIndicatorId
      ),
    [metadataById, rows, selectedIndicatorId]
  );
  if (groups.length === 0) return null;

  return (
    <section className="cdp-section" aria-label="연도별 변화">
      <div className="cdp-section-heading">
        <div>
          <h3>연도별 변화</h3>
          {selectedIndicatorId === "all" && (
            <p>항목별 추이를 색상으로 구분했습니다</p>
          )}
        </div>
      </div>
      <div className="cdp-chart-groups">
        {groups.map((group) => (
          <TimeSeriesGroupChartV122
            key={group.key}
            group={group}
            showGroupTitle={groups.length > 1}
          />
        ))}
      </div>
    </section>
  );
}

function emptyStateCopyV124(item: CountryCatalogItemV122 | null): {
  title: string;
  description: string;
} {
  switch (item?.publicStatus) {
    case "schema-only":
      return {
        title: "입력 양식만 제공된 데이터입니다",
        description: "공개 자료에는 입력 항목만 있고 실제 값은 아직 없습니다",
      };
    case "data-entry-planned":
      return {
        title: "데이터 입력 예정입니다",
        description: "현장조사와 검증을 거쳐 실제 값을 입력할 예정입니다",
      };
    case "not-collected":
      return {
        title: "자료가 아직 수집되지 않았습니다",
        description: "공식 자료를 확보하고 확인한 뒤 데이터를 제공합니다",
      };
    case "quarantined":
      return {
        title: "형식 검토가 필요한 데이터입니다",
        description: "자료 형식을 확인한 뒤 공개 가능한 데이터를 제공합니다",
      };
    default:
      return {
        title: "표시할 자료가 없습니다",
        description: "출처·이용조건에서 공식 원문을 확인할 수 있습니다",
      };
  }
}

export default function CountryDataElementPage({
  elementId,
  countryIso3,
  onBack,
  backLabel = "검색 결과로 돌아가기",
  onOpenDownload,
  onCountryChange,
  onOpenElement: _onOpenElement,
  onOpenMapElement,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const providers = useMemo(() => listCountryDataProvidersV122(), []);
  const provider = getCountryDataProviderV122(countryIso3);
  const [catalogItem, setCatalogItem] = useState<CountryCatalogItemV122 | null>(
    null
  );
  const [bundle, setBundle] = useState<ElementBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !elementId ||
      !countryIso3 ||
      !getCountryDataProviderV122(countryIso3)
    ) {
      setBundle(null);
      setCatalogItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setBundle(null);
    setCatalogItem(null);
    void Promise.all([
      loadCountryElementBundleV122(countryIso3, elementId),
      loadCatalogForCountrySelectionV122(countryIso3),
    ])
      .then(([payload, catalog]) => {
        if (cancelled) return;
        setCatalogItem(
          catalog.find((item) => item.elementId === elementId) || null
        );
        setBundle({
          meta: payload.meta,
          observations: payload.observations.records,
          entities: payload.entities.records,
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Country element load failed", reason);
        setError(publicCountryDataErrorMessageV122(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3, elementId]);

  const hasPopulatedRows =
    catalogItem?.dataPresenceStatus === "actual-records" ||
    catalogItem?.dataPresenceStatus === "partial-records";

  const observations = hasPopulatedRows ? bundle?.observations || [] : [];
  const entities = hasPopulatedRows ? bundle?.entities || [] : [];
  const mapSelectionUnavailableReason =
    elementId === "A-024" && selectorState.measure !== A024_LINE_MEASURE_V125
      ? "선택한 전력 접근성 지표에는 공개 공간자료가 없어 지도에 연결하지 않습니다. 데이터 지도에서 베트남 송전망을 별도로 분석할 수 있습니다."
      : "";

  if (!elementId) {
    return (
      <div className="page-shell cdp-page">
        <button
          type="button"
          className="cdp-button cdp-button--secondary"
          onClick={onBack}
        >
          {backLabel}
        </button>
        <div className="cdp-panel cdp-empty">데이터를 선택해 주세요</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="page-shell cdp-page">
        <button
          type="button"
          className="cdp-button cdp-button--secondary"
          onClick={onBack}
        >
          {backLabel}
        </button>
        <div className="cdp-panel cdp-empty">
          <h1>현재 제공되는 데이터가 없습니다</h1>
          {providers.length > 0 && (
            <label className="cdp-field cdp-field--narrow">
              <span className="cdp-field__label">국가</span>
              <select
                className="cdp-select"
                value={providers[0].countryIso3}
                onChange={(event) => onCountryChange(event.target.value)}
              >
                {providers.map((item) => (
                  <option key={item.countryIso3} value={item.countryIso3}>
                    {item.countryNameKo}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    );
  }

  const meta = bundle?.meta;
  const emptyStateCopy = emptyStateCopyV124(catalogItem);
  const downloadStatus = catalogItem
    ? publicDownloadStatusV128(catalogItem)
    : null;
  return (
    <div className="page-shell cdp-page">
      <button
        type="button"
        className="cdp-button cdp-button--secondary"
        onClick={onBack}
      >
        {backLabel}
      </button>

      {error && (
        <div className="cdp-alert cdp-alert--error" role="alert">
          <strong>{error}</strong>
          <span>잠시 후 다시 시도해 주세요</span>
        </div>
      )}
      {loading && (
        <div className="cdp-panel cdp-empty">데이터를 불러오는 중입니다</div>
      )}

      {meta && (
        <>
          <section className="cdp-detail-hero">
            <div>
              <div className="cdp-card__path">
                <span>
                  <PublicTermTextV134
                    text={catalogItem?.categoryLabel || meta.element.categoryLabel}
                  />
                </span>
                <span aria-hidden="true">›</span>
                <span>
                  <PublicTermTextV134
                    text={catalogItem?.groupLabel || meta.element.groupLabel}
                  />
                </span>
              </div>
              {catalogItem && (
                <div className="cdp-chip-row" aria-label="데이터 공개 상태">
                  <span
                    className="cdp-chip"
                    data-public-status={publicDataStatusKeyV128(
                      catalogItem.publicStatus
                    )}
                  >
                    {publicDataStatusLabelV128(catalogItem.publicStatus)}
                  </span>
                  {downloadStatus && (
                    <span
                      className="cdp-chip"
                      data-download-status={downloadStatus.key}
                    >
                      {downloadStatus.label}
                    </span>
                  )}
                </div>
              )}
              <h1>
                <PublicTermTextV134
                  text={catalogItem?.publicTitle || meta.element.elementLabel}
                />
              </h1>
              <p>
                <PublicTermTextV134
                  text={`${provider.countryNameKo}${
                    catalogItem?.publicDescription
                      ? ` · ${catalogItem.publicDescription}`
                      : ""
                  }`}
                />
              </p>
            </div>
            <div className="cdp-detail-hero__actions">
              {providers.length > 1 && (
                <label className="cdp-field cdp-field--narrow">
                  <span className="cdp-field__label">국가</span>
                  <select
                    className="cdp-select"
                    value={countryIso3 || provider.countryIso3}
                    onChange={(event) => onCountryChange(event.target.value)}
                  >
                    {providers.map((item) => (
                      <option key={item.countryIso3} value={item.countryIso3}>
                        {item.countryNameKo}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {meta.element.mapFeatureCount > 0 && (
                <div className="cdp-detail-map-action">
                  <button
                    type="button"
                    className="cdp-button cdp-button--secondary"
                    disabled={Boolean(mapSelectionUnavailableReason)}
                    onClick={() =>
                      onOpenMapElement(
                        elementId,
                        provider.countryIso3,
                        selectorState
                      )
                    }
                  >
                    지도에서 보기
                  </button>
                  {mapSelectionUnavailableReason && (
                    <span role="note">{mapSelectionUnavailableReason}</span>
                  )}
                </div>
              )}
              {downloadStatus?.key === "downloadable" && (
                <button
                  type="button"
                  className="cdp-button cdp-button--primary"
                  onClick={() =>
                    onOpenDownload(elementId, provider.countryIso3, null)
                  }
                >
                  다운로드
                </button>
              )}
            </div>
          </section>

          <section className="cdp-panel cdp-detail-panel">
              <CountryElementVisualizationV123
                elementId={elementId}
                countryNameKo={provider.countryNameKo}
                observations={hasPopulatedRows ? bundle?.observations || [] : []}
                entities={hasPopulatedRows ? bundle?.entities || [] : []}
                indicators={meta.indicators}
                detailTemplate={meta.element.detailTemplate}
                selectedIndicatorId="all"
                selectorState={selectorState}
                onSelectorStateChange={onSelectorStateChange}
                spatialUnit={meta.element.spatialUnits[0]}
              />

              {observations.length === 0 && entities.length === 0 && (
                <div className="cdp-empty">
                  <h3>{emptyStateCopy.title}</h3>
                  <p>{emptyStateCopy.description}</p>
                </div>
              )}

              <section className="cdp-section cdp-v125-download">
                <h3>다운로드</h3>
                {downloadStatus?.key === "downloadable" ? (
                  <button
                    type="button"
                    className="cdp-button cdp-button--primary"
                    data-testid="public-download-link"
                    onClick={() => onOpenDownload(elementId, provider.countryIso3, null)}
                  >
                    전체 데이터 다운로드
                  </button>
                ) : (
                  <div data-download-status={downloadStatus?.key}>
                    <strong>{downloadStatus?.label || "다운로드 자료 없음"}</strong>
                    {downloadStatus?.reason && <p>{downloadStatus.reason}</p>}
                  </div>
                )}
              </section>
          </section>
        </>
      )}
    </div>
  );
}
