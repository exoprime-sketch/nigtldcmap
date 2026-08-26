import { useEffect, useMemo, useState } from "react";

interface WbRecord {
  date: string;
  value: number | null;
}

interface SeriesPoint {
  year: number;
  value: number;
}

interface MetricSeries {
  label: string;
  unit: string;
  points: SeriesPoint[];
}

const METRICS = [
  { key: "population", code: "SP.POP.TOTL", label: "총인구", unit: "명" },
  {
    key: "urbanShare",
    code: "SP.URB.TOTL.IN.ZS",
    label: "도시인구 비율",
    unit: "%",
  },
  { key: "growth", code: "SP.POP.GROW", label: "연간 인구증가율", unit: "%" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

async function fetchSeries(
  countryIso3: string,
  code: string,
  label: string,
  unit: string
): Promise<MetricSeries> {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(
    countryIso3
  )}/indicator/${encodeURIComponent(code)}?format=json&per_page=80`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`World Bank 응답 오류 ${response.status}`);
  const payload = (await response.json()) as [unknown, WbRecord[]];
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];
  const points = rows
    .filter(
      (row) => typeof row.value === "number" && Number.isFinite(row.value)
    )
    .map((row) => ({ year: Number(row.date), value: row.value as number }))
    .filter((row) => Number.isFinite(row.year))
    .sort((a, b) => a.year - b.year);
  return { label, unit, points };
}

function latest(series: MetricSeries | undefined): SeriesPoint | null {
  return series?.points.length ? series.points[series.points.length - 1] : null;
}

function formatMetric(key: MetricKey, point: SeriesPoint | null): string {
  if (!point) return "자료 없음";
  if (key === "population")
    return `${new Intl.NumberFormat("ko-KR").format(
      Math.round(point.value)
    )}명`;
  return `${point.value.toFixed(1)}%`;
}

function pathFor(points: SeriesPoint[], width = 420, height = 116): string {
  if (points.length < 2) return "";
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);
  const pad = 8;
  return points
    .map((point, index) => {
      const x =
        pad + (index / Math.max(1, points.length - 1)) * (width - pad * 2);
      const y =
        height - pad - ((point.value - min) / range) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function MiniTrend({
  title,
  series,
  formatter,
}: {
  title: string;
  series: MetricSeries;
  formatter: (value: number) => string;
}) {
  const points = series.points.slice(-15);
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <article className="v48-pop-trend">
      <div className="v48-pop-trend-head">
        <div>
          <strong>{title}</strong>
          <span>
            {first?.year ?? "—"}–{last?.year ?? "—"}
          </span>
        </div>
        <b>{last ? formatter(last.value) : "자료 없음"}</b>
      </div>
      {points.length > 1 ? (
        <svg viewBox="0 0 420 116" role="img" aria-label={`${title} 추세`}>
          <path
            d={pathFor(points)}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      ) : (
        <div className="v48-no-series">추세 자료 없음</div>
      )}
    </article>
  );
}

export default function WorldBankPopulationUrbanizationV48({
  countryIso3 = "VNM",
  countryName = "베트남",
}: {
  countryIso3?: string;
  countryName?: string;
}) {
  const [series, setSeries] = useState<Record<MetricKey, MetricSeries> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      METRICS.map((metric) =>
        fetchSeries(countryIso3, metric.code, metric.label, metric.unit)
      )
    )
      .then((results) => {
        if (cancelled) return;
        const next = {} as Record<MetricKey, MetricSeries>;
        METRICS.forEach((metric, index) => {
          next[metric.key] = results[index];
        });
        setSeries(next);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "World Bank 자료를 불러오지 못했습니다"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  const latestValues = useMemo(
    () =>
      series
        ? {
            population: latest(series.population),
            urbanShare: latest(series.urbanShare),
            growth: latest(series.growth),
          }
        : null,
    [series]
  );

  if (loading)
    return (
      <div className="v48-preview-loading">
        {countryName} 인구·도시화 자료 불러오는 중
      </div>
    );
  if (error || !series || !latestValues)
    return (
      <div className="v48-preview-error">
        <strong>World Bank 데이터를 불러오지 못했습니다</strong>
        <span>{error || "잠시 후 다시 시도해 주세요"}</span>
        <p>
          총인구·도시화율·인구증가율은 World Bank 원자료에서도 확인할 수
          있습니다
        </p>
      </div>
    );

  return (
    <section className="v48-population-view">
      <div className="v48-answer-heading">
        <span>대상국 · {countryName} · 제공 중</span>
        <h3>인구 규모와 도시화는 어떻게 변화하고 있는가?</h3>
        <p>
          시장·수요 규모와 도시형 인프라·건물·수송·상하수도 수요가 집중되는 기초
          맥락을 확인
        </p>
      </div>
      <div className="v48-kpi-grid v48-pop-kpis">
        {METRICS.map((metric) => {
          const point = latestValues[metric.key];
          return (
            <article key={metric.key}>
              <span>{metric.label}</span>
              <strong>{formatMetric(metric.key, point)}</strong>
              <small>{point ? `${point.year}년` : "자료 없음"}</small>
            </article>
          );
        })}
      </div>
      <div className="v48-pop-trends">
        <MiniTrend
          title="총인구 추세"
          series={series.population}
          formatter={(value) =>
            `${new Intl.NumberFormat("ko-KR", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(value)}명`
          }
        />
        <MiniTrend
          title="도시인구 비율 추세"
          series={series.urbanShare}
          formatter={(value) => `${value.toFixed(1)}%`}
        />
      </div>
      <div className="v48-use-note">
        <div>
          <b>함께 볼 정보</b>
          <span>연도별 값 · 단위 · 출처 · 국가별 정의 차이</span>
        </div>
        <div>
          <b>해석 시 유의</b>
          <span>
            도시화율은 국가별 정의 차이가 있으며 특정 기후기술 수요를 직접
            의미하지 않음
          </span>
        </div>
      </div>
    </section>
  );
}
