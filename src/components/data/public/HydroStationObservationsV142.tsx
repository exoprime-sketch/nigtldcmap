import { useMemo } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";
import "./hydro-station-observations-v142.css";

/**
 * B-023 (건기/우기 유량 차이) and B-028 (하천 유량): each delivered row is one
 * observation at one station — a measure name, a value, a unit, a year, and
 * for some a range bound. Nothing here is a series, and the values do not
 * share a measure: a dry-season minimum at Kratie in 2004 is not comparable
 * to an annual mean at Sơn Tây in 2010 even though both are m³/s.
 *
 * Values are compared only as pairs: the same station, the same unit, the
 * same year, one dry-season row and one wet-season row (Kratie 2004: 2,290 vs
 * 36,700 m³/s, with the delivered ratio 16 beside them). Everything else is
 * tabled per station with its year, and national aggregates sit apart (V142).
 */
interface Props {
  elementId: "B-023" | "B-028";
  entities: VietnamEntityV124[];
}

interface ObservationRow {
  recordId: string;
  site: string;
  siteDescription: string;
  measure: string;
  /** The measure with the range-bound suffix removed. */
  base: string;
  bound: "min" | "max" | null;
  value: number | null;
  unit: string;
  year: number | null;
  season: "dry" | "wet" | null;
  ratio: boolean;
  national: boolean;
  placeholder: boolean;
}

interface MergedRow {
  key: string;
  site: string;
  base: string;
  unit: string;
  year: number | null;
  min: number | null;
  max: number | null;
  central: number | null;
  season: "dry" | "wet" | null;
  ratio: boolean;
  recordIds: string[];
}

interface SeasonPair {
  site: string;
  unit: string;
  year: number;
  dry: MergedRow;
  wet: MergedRow;
  ratio: MergedRow | null;
}

const NATIONAL_SITE = /^(?:Việt Nam|Viet Nam|베트남|전국|National)/iu;
const RANGE_SUFFIX = /\s*\((?:범위\s*)?(하한|상한)\)\s*$/u;

function text(value: unknown): string {
  return publicTextV126(value) || "";
}

export function parseHydroRowV142(entity: VietnamEntityV124): ObservationRow {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const measure = text(attributes["지표명"]) || text(entity.name);
  const boundMatch = measure.match(RANGE_SUFFIX);
  const rawValue = attributes["값"];
  const value = typeof rawValue === "number" ? rawValue : Number(String(rawValue ?? "").replace(/,/gu, ""));
  const rawYear = attributes["기준연도"];
  const year = rawYear === null || rawYear === undefined || String(rawYear).trim() === "" ? NaN : Number(rawYear);
  const site = text(attributes["지점_유역명"]) || "지점 미기재";
  const placeholder = rawValue === null || rawValue === undefined || String(rawValue).trim() === "" || !Number.isFinite(value);
  return {
    recordId: entity.recordId,
    site,
    siteDescription: text(attributes["위치_설명"]),
    measure,
    base: measure.replace(RANGE_SUFFIX, "").trim(),
    bound: boundMatch ? (boundMatch[1] === "하한" ? "min" : "max") : null,
    value: placeholder || !Number.isFinite(value) ? null : value,
    unit: text(attributes["단위"]),
    year: Number.isFinite(year) ? year : null,
    season: /건기/u.test(measure) ? "dry" : /우기/u.test(measure) ? "wet" : null,
    ratio: /유량비|비율|배$/u.test(measure) || /^비/u.test(text(attributes["단위"])),
    national: NATIONAL_SITE.test(site),
    placeholder,
  };
}

/** Two bound rows of one measure at one station and year are one range. */
export function mergeHydroRowsV142(rows: ObservationRow[]): MergedRow[] {
  const merged = new Map<string, MergedRow>();
  rows.forEach((row) => {
    let key = `${row.site}|${row.base}|${row.unit}|${row.year ?? ""}`;
    const existing = merged.get(key);
    // Duplicate estimates/bounds are separate observations, never an invented range.
    if (existing && (row.bound ? existing[row.bound] !== null : existing.central !== null)) key += `|${row.recordId}`;
    const entry = merged.get(key) || { key, site: row.site, base: row.base, unit: row.unit, year: row.year, min: null, max: null, central: null, season: row.season, ratio: row.ratio, recordIds: [] };
    entry.recordIds.push(row.recordId);
    if (row.value !== null) {
      if (row.bound === "min") entry.min = row.value;
      else if (row.bound === "max") entry.max = row.value;
      else entry.central = row.value;
    }
    merged.set(key, entry);
  });
  return [...merged.values()];
}

function formatRange(row: MergedRow): string {
  const bounds = row.min !== null && row.max !== null
    ? `${formatValueV121(row.min)}~${formatValueV121(row.max)}`
    : row.min !== null ? `하한 ${formatValueV121(row.min)}` : row.max !== null ? `상한 ${formatValueV121(row.max)}` : "";
  if (row.central !== null) return `${formatValueV121(row.central)}${bounds ? ` (범위 ${bounds})` : ""}`;
  return bounds || "자료 미제공";
}

/** Dry/wet pairs: one station, one unit, one year, and both seasons stated. */
export function hydroSeasonPairsV142(rows: MergedRow[]): SeasonPair[] {
  const pairs: SeasonPair[] = [];
  const bySiteUnitYear = new Map<string, MergedRow[]>();
  rows.forEach((row) => {
    if (row.year === null || row.ratio) return;
    const key = `${row.site}|${row.unit}|${row.year}`;
    bySiteUnitYear.set(key, [...(bySiteUnitYear.get(key) || []), row]);
  });
  bySiteUnitYear.forEach((group) => {
    // Reviewed comparison: seasonal extremes, not arbitrary values whose unit matches.
    const dryRows = group.filter((row) => /^건기 최저유량\s*—/u.test(row.base) && row.central !== null);
    const wetRows = group.filter((row) => /^우기 최고유량\s*—/u.test(row.base) && row.central !== null);
    if (dryRows.length !== 1 || wetRows.length !== 1) return;
    const dry = dryRows[0];
    const wet = wetRows[0];
    if (!dry || !wet) return;
    const ratio = rows.find((row) => row.ratio && row.site === dry.site && row.year === dry.year) || null;
    pairs.push({ site: dry.site, unit: dry.unit, year: dry.year as number, dry, wet, ratio });
  });
  return pairs;
}

export default function HydroStationObservationsV142({ elementId, entities }: Props) {
  const model = useMemo(() => {
    const rows = entities.map(parseHydroRowV142);
    const placeholders = rows.filter((row) => row.placeholder);
    const observed = rows.filter((row) => !row.placeholder);
    const stationRows = mergeHydroRowsV142(observed.filter((row) => !row.national));
    const nationalRows = mergeHydroRowsV142(observed.filter((row) => row.national));
    const pairs = elementId === "B-023" ? hydroSeasonPairsV142(stationRows) : [];
    const sites = [...new Map(observed.filter((row) => !row.national).map((row) => [row.site, row.siteDescription])).entries()];
    return { rows, observed, placeholders, stationRows, nationalRows, pairs, sites };
  }, [elementId, entities]);

  if (!model.observed.length) return null;

  const pairedIds = new Set(model.pairs.flatMap((pair) => [...pair.dry.recordIds, ...pair.wet.recordIds, ...(pair.ratio?.recordIds || [])]));

  return (
    <section className="pps132 hso142" data-testid="hydro-station-observations-v142" data-station-count={model.sites.length} data-observation-count={model.observed.length} data-pair-count={model.pairs.length}>
      <header className="pps132-heading">
        <span>주 분석</span>
        <h4>
          {elementId === "B-023" ? "관측지점별 건기 최저·우기 최고유량" : "관측지점별 유량 관측값"}
        </h4>
        <p>
          {elementId === "B-023"
            ? "같은 지점·연도에서 관측한 건기 최저유량과 우기 최고유량을 비교합니다. 계절 평균값은 아닙니다. 나머지 관측값은 아래 표에서 확인할 수 있습니다."
            : "지점·관측 항목·단위·기준연도가 서로 달라 한 축에서 비교하지 않고, 지점별 관측값과 전국 집계를 나누어 표로 보여줍니다."}
        </p>
      </header>


      {model.pairs.length > 0 && (
        <section className="pps132-distribution" data-testid="hydro-season-pairs-v142">
          <h5>건기 최저·우기 최고유량 · {model.pairs.length}개 지점</h5>
          <ul className="hso142__pairs">
            {model.pairs.map((pair) => {
              const scale = Math.max(pair.wet.central as number, pair.dry.central as number, 1);
              return (
                <li key={`${pair.site}-${pair.year}`} data-pair-site={pair.site} data-pair-year={pair.year}>
                  <strong><PublicTermTextV134 text={`${pair.site} · ${pair.year}년 · ${pair.unit}`} /></strong>
                  {[{ row: pair.dry, label: "건기 최저", tone: "dry" }, { row: pair.wet, label: "우기 최고", tone: "wet" }].map(({ row, label, tone }) => (
                    <div className="hso142__bar-row" key={tone}>
                      <span>{label}</span>
                      <span className="hso142__track" aria-hidden="true"><i className={`hso142__fill--${tone}`} style={{ width: `${((row.central as number) / scale) * 100}%` }} /></span>
                      <span>{formatRange(row)}</span>
                    </div>
                  ))}
                  {pair.ratio && <small>원자료 유량비: {formatRange(pair.ratio)}배</small>}
                </li>
              );
            })}
          </ul>
          <p className="pps132-note">지점마다 막대의 축 범위가 다릅니다. 유량비는 원자료에 기재된 값으로, 위 두 값을 나눈 결과와 다를 수 있습니다.</p>
        </section>
      )}

      {model.sites.map(([site, description]) => {
        const rows = model.stationRows.filter((row) => row.site === site).sort((a, b) => a.base.localeCompare(b.base, "ko") || (a.year ?? 0) - (b.year ?? 0));
        return (
          <section key={site} className="pps132-distribution pps132-distribution--table" data-testid="hydro-station-table-v142" data-station={site}>
            <h5><PublicTermTextV134 text={site} /> · 관측값 {rows.length}건</h5>
            {description && <p className="pps132-note"><PublicTermTextV134 text={description} /></p>}
            <div className="pps132-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">관측 항목</th>
                    <th scope="col">값</th>
                    <th scope="col">단위</th>
                    <th scope="col">기준연도</th>
                    <th scope="col">비교</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row"><PublicTermTextV134 text={row.base} /></th>
                      <td>{formatRange(row)}</td>
                      <td><PublicTermTextV134 text={row.unit} /></td>
                      <td>{row.year ?? "미기재"}</td>
                      <td>{row.recordIds.some((id) => pairedIds.has(id)) ? "건기·우기 짝" : row.min !== null && row.max !== null && row.min !== row.max ? "범위(하한~상한)" : "단일 관측값"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {model.nationalRows.length > 0 && (
        <section className="pps132-distribution pps132-distribution--table" data-testid="hydro-national-table-v142">
          <h5>전국 집계 · {model.nationalRows.length}건</h5>
          <div className="pps132-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">값</th>
                  <th scope="col">단위</th>
                  <th scope="col">기준연도</th>
                </tr>
              </thead>
              <tbody>
                {model.nationalRows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row"><PublicTermTextV134 text={row.base} /></th>
                    <td>{formatRange(row)}</td>
                    <td><PublicTermTextV134 text={row.unit} /></td>
                    <td>{row.year ?? "미기재"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pps132-note">전국 집계는 지점 관측값과 단위·범위가 달라 지점 값과 비교하지 않습니다.</p>
        </section>
      )}

      <ul className="prs138__constraints" data-testid="hydro-station-limitations-v142">
        <li>계절별 극값 비교 외에는 지점·관측 항목·단위·연도가 다른 값을 합하거나 하나의 축에서 비교하지 않습니다.</li>
        <li>지도는 관측지점 대표점만 표시하며 유역 경계는 원천에 없습니다.</li>
        {model.placeholders.length > 0 && (
          <li><PublicTermTextV134 text={`격자·유역 단위(GIS) 산출값 ${model.placeholders.length}건은 원천이 값을 제공하지 않아 표에서 제외했습니다.`} /></li>
        )}
      </ul>
    </section>
  );
}
