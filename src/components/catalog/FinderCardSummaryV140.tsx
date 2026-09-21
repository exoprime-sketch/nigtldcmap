import { useEffect, useState } from "react";
import type { CardSummaryV140, CardPartV140 } from "../../data/cardSummariesV140";
import { loadHomePreviewV139 } from "../../data/homePreviewV139";
import type { HomePreviewCardV139 } from "../../data/homePreviewV139";
import HomePreviewChartV139 from "../home/HomePreviewChartV139";
import ChartAxesV150 from "../charts/ChartAxesV150";
import { PublicTermTextV134 } from "../help/PublicTermV134";
import "./finder-card-summary-v140.css";

/**
 * The analysis summary on a finder card (V140).
 *
 * Every card reads in the same order - the figure it leads with, then a small
 * analysis - but the analysis is whatever the data can honestly carry: a
 * trend, a comparison, a composition, a distribution across provinces, or
 * the facts of a register. Text sizes are the card's own, never the chart's
 * tick size, so a value can be read at a glance.
 */
const W = 320;
const INK = "#173a4d";
const MUTED = "#6b8394";
const SERIES = ["#0f766e", "#c2410c", "#2563eb", "#7c3aed", "#b45309", "#0e7490"];

const fmt = (value: number, digits?: number) => {
  const abs = Math.abs(value);
  const fraction = digits ?? (abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3);
  if (abs >= 1e8) return `${(value / 1e8).toLocaleString("en-US", { maximumFractionDigits: 2 })}억`;
  if (abs >= 1e6) return `${(value / 1e4).toLocaleString("en-US", { maximumFractionDigits: 0 })}만`;
  return value.toLocaleString("en-US", { maximumFractionDigits: fraction, minimumFractionDigits: 0 });
};

function Line({ points, unit, seriesLabel, historicalUntil }: { points: Array<{ year: number; value: number }>; unit?: string; seriesLabel?: string; historicalUntil?: number | null }) {
  const H = 96;
  const x0 = 40;
  const x1 = W - 8;
  const y0 = 8;
  const y1 = H - 20;
  const years = points.map((p) => p.year);
  const values = points.map((p) => p.value);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const sx = (year: number) => x0 + ((year - minYear) / Math.max(1, maxYear - minYear)) * (x1 - x0);
  const sy = (value: number) => y1 - ((value - minValue) / Math.max(1e-9, maxValue - minValue)) * (y1 - y0);
  const path = (subset: typeof points) =>
    subset.map((p, i) => `${i ? "L" : "M"}${sx(p.year).toFixed(1)} ${sy(p.value).toFixed(1)}`).join("");
  const first = points[0];
  const last = points[points.length - 1];
  const split = historicalUntil ? points.filter((p) => p.year <= historicalUntil) : points;
  const rest = historicalUntil ? points.filter((p) => p.year > historicalUntil) : [];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="fcs140-chart" aria-label={`${seriesLabel ? `${seriesLabel}. ` : ""}${first.year}년 ${fmt(first.value)}에서 ${last.year}년 ${fmt(last.value)} (${unit || ""})`}>
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke="#c9d6df" />
      <text x={x0 - 4} y={y0 + 4} textAnchor="end" fontSize={10} fill={MUTED}>{fmt(maxValue, 0)}</text>
      <text x={x0 - 4} y={y1} textAnchor="end" fontSize={10} fill={MUTED}>{fmt(minValue, 0)}</text>
      <path d={path(split)} fill="none" stroke={SERIES[0]} strokeWidth={2} strokeLinejoin="round" />
      {rest.length > 0 && <path d={path(rest)} fill="none" stroke={SERIES[1]} strokeWidth={2} strokeDasharray="4 3" strokeLinejoin="round" />}
      <circle cx={sx(last.year)} cy={sy(last.value)} r={3.2} fill={rest.length ? SERIES[1] : SERIES[0]} />
      <text x={x0} y={H - 6} fontSize={10} fill={MUTED}>{first.year}</text>
      <text x={x1} y={H - 6} textAnchor="end" fontSize={10} fill={MUTED}>{last.year}</text>
    </svg>
  );
}

function Bars({ parts, unit, signedColour }: { parts: CardPartV140[]; unit?: string; signedColour?: boolean }) {
  const max = Math.max(...parts.map((p) => Math.abs(p.value)), 1e-9);
  return (
    <ul className="fcs140-bars" aria-label={`${unit || ""} 비교`}>
      {parts.map((part, index) => (
        <li key={`${part.label}-${index}`}>
          <span className="fcs140-bars__label"><PublicTermTextV134 text={part.label} /></span>
          <span className="fcs140-bars__track" aria-hidden="true">
            <i style={{ width: `${Math.max(2, (Math.abs(part.value) / max) * 100)}%`, background: signedColour && part.value < 0 ? SERIES[1] : SERIES[0] }} />
          </span>
          <span className="fcs140-bars__value">{fmt(part.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Composition({ parts, total, unit }: { parts: CardPartV140[]; total?: number | null; unit?: string }) {
  const sum = total || parts.reduce((acc, part) => acc + part.value, 0) || 1;
  let offset = 0;
  return (
    <div className="fcs140-composition">
      <svg viewBox={`0 0 ${W} 18`} role="img" className="fcs140-chart fcs140-chart--strip" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / sum) * 100)}%`).join(", ")}>
        {parts.map((part, index) => {
          const width = (part.value / sum) * W;
          const x = offset;
          offset += width;
          return <rect key={part.label} x={x} y={2} width={Math.max(width, 0.5)} height={14} fill={SERIES[index % SERIES.length]} />;
        })}
      </svg>
      <ul className="fcs140-legend">
        {parts.map((part, index) => (
          <li key={part.label}>
            <i style={{ background: SERIES[index % SERIES.length] }} aria-hidden="true" />
            <span><PublicTermTextV134 text={part.label} /></span>
            <strong>{fmt(part.value)}</strong>
            <small>{Math.round((part.value / sum) * 100)}%</small>
          </li>
        ))}
      </ul>
      {unit && <p className="fcs140-note">단위 {unit}</p>}
    </div>
  );
}

function HomeCardPreview({ elementId }: { elementId: string }) {
  const [card, setCard] = useState<HomePreviewCardV139 | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadHomePreviewV139()
      .then((preview) => {
        if (!cancelled) setCard(preview.cards.find((entry) => entry.elementId === elementId) || null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [elementId]);
  if (!card) return <div className="fcs140-pending" role="status">미리보기를 불러오는 중</div>;
  return <HomePreviewChartV139 card={card} />;
}

export default function FinderCardSummaryV140({ summary }: { summary: CardSummaryV140 }) {
  const { kind, headline, preview } = summary;
  return (
    <div className="fcs140" data-testid="finder-card-summary-v140" data-card-kind={kind}>
      <p className="fcs140-headline" data-testid="finder-card-headline-v140">
        <strong><PublicTermTextV134 text={headline.value} /></strong>
        <span><PublicTermTextV134 text={headline.label} /></span>
      </p>
      <div className="fcs140-preview">
        {!preview.home && ["line", "spatial-trend", "bars", "spatial", "composition"].includes(kind) && <ChartAxesV150
          x={kind === "line" || kind === "spatial-trend" ? "연도" : kind === "composition" ? undefined : summary.measure?.label || "값"}
          y={kind === "line" || kind === "spatial-trend" ? summary.measure?.label || "값" : kind === "composition" ? undefined : kind === "spatial" ? "성·시" : "항목"}
          unit={preview.unit || summary.measure?.unit || ""} composition={kind === "composition"} />}
        {preview.home ? (
          <HomeCardPreview elementId={summary.elementId} />
        ) : kind === "line" && preview.points ? (
          <>
            {preview.seriesLabel && <p className="fcs140-caption"><PublicTermTextV134 text={preview.seriesLabel} /></p>}
            <Line points={preview.points} unit={preview.unit} seriesLabel={preview.seriesLabel} />
          </>
        ) : kind === "spatial-trend" && preview.points ? (
          <>
            <p className="fcs140-caption"><PublicTermTextV134 text={preview.seriesLabel || ""} /></p>
            <Line points={preview.points} unit={preview.unit} seriesLabel={preview.seriesLabel} historicalUntil={preview.historicalUntil} />
            {preview.range && preview.range.p10 !== null && preview.range.p10 !== undefined && (
              <p className="fcs140-note">
                성·시 간 분포 10~90분위 {fmt(preview.range.p10)}–{fmt(preview.range.p90 ?? preview.range.p10)} {preview.unit} · 시나리오 {preview.scenarios}개는 상세에서 선택
              </p>
            )}
          </>
        ) : (kind === "bars" || kind === "spatial") && preview.parts && preview.parts.length > 0 ? (
          <>
            {preview.scope && <p className="fcs140-caption"><PublicTermTextV134 text={preview.scope} /></p>}
            <Bars parts={preview.parts} unit={preview.unit} signedColour />
            {(preview.omitted || 0) > 0 && <p className="fcs140-note">외 {preview.omitted}개 항목은 상세에서</p>}
            {kind === "spatial" && preview.median !== null && preview.median !== undefined && (
              <p className="fcs140-note">{preview.provinces}개 성·시 중앙값 {fmt(preview.median)} {preview.unit}</p>
            )}
            {(preview.unlabelled || 0) > 0 && <p className="fcs140-note">분류 미기재 {preview.unlabelled}건</p>}
          </>
        ) : kind === "composition" && preview.parts ? (
          <Composition parts={preview.parts} total={preview.total} unit={preview.unit} />
        ) : kind === "level" ? (
          <dl className="fcs140-level">
            {preview.seriesLabel && <div><dt>계열</dt><dd><PublicTermTextV134 text={preview.seriesLabel} /></dd></div>}
            {(preview.others || []).map((other) => (
              <div key={other.label}><dt>{other.label}</dt><dd>{fmt(other.value)} {preview.unit}</dd></div>
            ))}
            {preview.note && <div><dt>비고</dt><dd>{preview.note}</dd></div>}
          </dl>
        ) : kind === "facts" ? (
          <ul className="fcs140-facts">
            {(preview.facts || []).map((fact, index) => (
              <li key={`${fact.label}-${index}`}>
                <span><PublicTermTextV134 text={fact.label} /></span>
                {fact.value && <strong><PublicTermTextV134 text={fact.value} /></strong>}
              </li>
            ))}
            {(preview.more || 0) > 0 && <li className="fcs140-facts__more">외 {preview.more}건은 상세에서</li>}
          </ul>
        ) : kind === "status" ? (
          <p className="fcs140-status" role="status"><PublicTermTextV134 text={preview.note || "현재 제공하지 않음"} /></p>
        ) : null}
      </div>
    </div>
  );
}
