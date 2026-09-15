import { useMemo, useState } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import { InteractiveTimeSeriesChartV127 } from "../../charts/InteractiveTimeSeriesChartV127";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

/**
 * B-008: station-by-scenario-by-quantile-by-year sea-level projections.
 *
 * The delivery is 1,575 rows keyed "1003_medium_ssp126_q5_2060". The screen
 * used to list twelve of those keys under a heading promising an outlook. What
 * a reader wants is one station, its scenarios as lines over 2020-2100, and the
 * model's uncertainty as the quantile they chose - exactly the AR6 tool's own
 * presentation. Nothing is interpolated: the rows carry nine years and those
 * nine are what is drawn.
 */

interface Props {
  entities: VietnamEntityV124[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

const STATION_ID_KEY = "PSMSL_관측소_ID";
const STATION_NAME_KEYS = ["관측소명_베트남어", "관측소명_PSMSL"];
const LOCATION_KEY = "소재";
const SCENARIO_KEY = "시나리오";
const QUANTILE_KEY = "분위수";
const CONFIDENCE_KEY = "신뢰수준";
const YEAR_KEY = "연도";
const VALUE_KEY = "상대해수면_상승_m_2005년_기준";
const UNIT = "m";

const text = (value: unknown): string => {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return publicTextV126(value) || "";
};

function numberOf(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(text(value));
  return Number.isFinite(parsed) && text(value) !== "" ? parsed : null;
}

export function isSeaLevelStationDeliveryV138(entities: VietnamEntityV124[]): boolean {
  return (
    entities.length > 0 &&
    entities.some((entity) => {
      const attributes = entity.normalizedAttributes || {};
      return (
        text(attributes[STATION_ID_KEY]) !== "" &&
        numberOf(attributes[VALUE_KEY]) !== null
      );
    })
  );
}

export default function SeaLevelStationAnalysisV138({
  entities,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const stations = useMemo(() => {
    const byId = new Map<string, { id: string; label: string; location: string; rows: VietnamEntityV124[] }>();
    for (const entity of entities) {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const id = text(attributes[STATION_ID_KEY]);
      if (!id) continue;
      const current = byId.get(id) || {
        id,
        label:
          STATION_NAME_KEYS.map((key) => text(attributes[key])).find(Boolean) || `관측소 ${id}`,
        location: text(attributes[LOCATION_KEY]),
        rows: [],
      };
      current.rows.push(entity);
      byId.set(id, current);
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [entities]);

  const requestedStation = selectorState.dimensions.station || "";
  const station =
    stations.find((item) => item.id === requestedStation) || stations[0] || null;
  const quantiles = useMemo(
    () =>
      [...new Set((station?.rows || []).map((row) => text((row.normalizedAttributes || {})[QUANTILE_KEY])))]
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b)),
    [station]
  );
  const [quantileChoice, setQuantileChoice] = useState("50");
  const quantile = quantiles.includes(quantileChoice) ? quantileChoice : quantiles.includes("50") ? "50" : quantiles[0] || "";

  const { series, confidence, years, table } = useMemo(() => {
    const byScenario = new Map<string, Array<{ year: number; value: number }>>();
    const levels = new Set<string>();
    const yearSet = new Set<number>();
    for (const row of station?.rows || []) {
      const attributes = (row.normalizedAttributes || {}) as Record<string, unknown>;
      if (text(attributes[QUANTILE_KEY]) !== quantile) continue;
      const year = numberOf(attributes[YEAR_KEY]);
      const value = numberOf(attributes[VALUE_KEY]);
      if (year === null || value === null) continue;
      const scenario = text(attributes[SCENARIO_KEY]) || "전체";
      const level = text(attributes[CONFIDENCE_KEY]);
      if (level) levels.add(level);
      yearSet.add(year);
      const list = byScenario.get(scenario) || [];
      list.push({ year, value });
      byScenario.set(scenario, list);
    }
    const markers = ["circle", "square", "diamond", "triangle", "cross"] as const;
    const ordered = [...byScenario].sort((a, b) => a[0].localeCompare(b[0], "en"));
    const chart: TimeSeriesV127[] = ordered.map(([scenario, points], index) => ({
      id: scenario,
      label: scenario,
      unit: UNIT,
      marker: markers[index % markers.length],
      linePattern: "solid",
      points: points
        .sort((a, b) => a.year - b.year)
        .map((point) => ({
          id: `${scenario}:${point.year}`,
          x: point.year,
          xLabel: `${point.year}년`,
          value: point.value,
        })),
    }));
    const sortedYears = [...yearSet].sort((a, b) => a - b);
    const tableRows = ordered.map(([scenario, points]) => {
      const sorted = [...points].sort((a, b) => a.year - b.year);
      return {
        scenario,
        first: sorted[0],
        last: sorted[sorted.length - 1],
      };
    });
    return { series: chart, confidence: [...levels], years: sortedYears, table: tableRows };
  }, [quantile, station]);

  if (!station) return null;

  const update = (key: string, value: string) =>
    onSelectorStateChange({
      ...selectorState,
      dimensions: { ...selectorState.dimensions, [key]: value },
    });

  return (
    <div
      className="prs137 prs138"
      data-testid="sea-level-station-analysis-v138"
      data-station-id={station.id}
      data-quantile={quantile}
      data-public-selector-scope-v134="true"
    >
      <div className="pav126-section-heading">
        <span>주 분석</span>
        <h3>
          {station.label}
          {station.location ? ` · ${station.location}` : ""}
        </h3>
      </div>
      <p className="prs137__lede">
        관측소별 상대해수면 상승 전망입니다. 시나리오마다 한 선으로 잇고, 분위를 바꾸면 모형 불확실성 범위의 다른 위치를 봅니다. 기준면은 1995–2014년 평균(2005년 기준)이며, 값은 침수 범위가 아니라 조위 관측소 위치의 해수면 변화입니다.
      </p>
      <div className="prs137__controls" data-testid="public-selector">
        <label>
          <span>관측소</span>
          <select
            aria-label="관측소 선택"
            value={station.id}
            onChange={(event) => update("station", event.target.value)}
          >
            {stations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
                {item.location ? ` · ${item.location}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>분위(불확실성 범위)</span>
          <select
            aria-label="분위 선택"
            value={quantile}
            onChange={(event) => setQuantileChoice(event.target.value)}
          >
            {quantiles.map((item) => (
              <option key={item} value={item}>
                {item === "50" ? "중앙값(50분위)" : `${item}분위`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <dl className="prs138__facts">
        <div>
          <dt>항목</dt>
          <dd>상대해수면 상승(2005년 기준)</dd>
        </div>
        <div>
          <dt>단위</dt>
          <dd>{UNIT}</dd>
        </div>
        <div>
          <dt>기간</dt>
          <dd>{years.length ? `${years[0]}~${years[years.length - 1]}년 (${years.length}개 연도)` : "미기재"}</dd>
        </div>
        <div>
          <dt>관측소 수</dt>
          <dd><PublicTermTextV134 text={`${stations.length}곳 (PSMSL ID ${station.id})`} /></dd>
        </div>
        {confidence.length > 0 && (
          <div>
            <dt>신뢰수준</dt>
            <dd>{confidence.join(" · ")}</dd>
          </div>
        )}
      </dl>
      {series.length > 0 && (
        <InteractiveTimeSeriesChartV127
          ariaLabel={`${station.label} 시나리오별 상대해수면 전망`}
          className="prs138__chart"
          formatValue={(value) => formatPublicNumberV126(value, UNIT)}
          height={300}
          series={series}
          sharedYearTooltip
          showDelta={false}
          testId="sea-level-station-chart-v138"
          title={`${station.label} · 시나리오별 상대해수면 상승 · ${quantile === "50" ? "중앙값" : `${quantile}분위`}`}
          unit={UNIT}
          xAxisTitle="연도"
          yAxisTitle={`상대해수면 상승 (${UNIT})`}
          zoom={{ enabled: false }}
        />
      )}
      <div className="cdp-table-wrap">
        <table className="cdp-table prs137__table" data-testid="sea-level-station-table-v138">
          <caption>
            {station.label} · {quantile === "50" ? "중앙값" : `${quantile}분위`} · 처음·마지막 연도와 변화 ({UNIT})
          </caption>
          <thead>
            <tr>
              <th scope="col">시나리오</th>
              <th scope="col">첫 연도</th>
              <th scope="col">값</th>
              <th scope="col">마지막 연도</th>
              <th scope="col">값</th>
              <th scope="col">변화</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.scenario}>
                <th scope="row">{row.scenario}</th>
                <td>{row.first.year}년</td>
                <td>{formatPublicNumberV126(row.first.value, UNIT)}</td>
                <td>{row.last.year}년</td>
                <td>{formatPublicNumberV126(row.last.value, UNIT)}</td>
                <td>
                  {row.last.value - row.first.value > 0 ? "+" : ""}
                  {formatPublicNumberV126(row.last.value - row.first.value, UNIT)} {UNIT}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="prs138__constraints">
        <li><PublicTermTextV134 text="원천: IPCC AR6 Sea Level Projection Tool(NASA) · 좌표: PSMSL 관측소 원장. 관측소 5곳의 전망이며 해안선 전체를 대표하지 않습니다." /></li>
        <li>분위(5·17·50·83·95)는 모형 앙상블의 불확실성 범위이며, 신뢰수준(medium·low)은 원천이 각 시나리오에 부여한 값입니다.</li>
      </ul>
    </div>
  );
}
