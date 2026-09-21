import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { lcoeRangesV146 } from "../../../data/visualization/lcoeRangesV146";
import "./detail-analysis-v146.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}
const fmt = (value: number | null) => value === null ? "—" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });

export default function LcoeRangeAnalysisV146({ rows, selectorState, onSelectorStateChange }: Props) {
  const ranges = useMemo(() => lcoeRangesV146(rows), [rows]);
  const years = [...new Set(ranges.map((row) => row.year))].sort((a, b) => a - b);
  const year = years.includes(selectorState.year || 0) ? selectorState.year! : years[0];
  const selected = ranges.filter((row) => row.year === year).sort((a, b) => (a.benchmark ?? Infinity) - (b.benchmark ?? Infinity));
  const scale = Math.ceil(Math.max(1, ...ranges.map((row) => row.max || 0)) / 50) * 50;
  const cardTechnology = (selectorState.dimensions.category || "").replace(/\((기준값|하한|상한)\)$/u, "");
  return <section className="detail146" aria-label="발전원별 발전비용 범위 분석">
    <label className="detail146-select">비교 연도
      <select aria-label="발전비용 비교 연도" value={year} onChange={(event) => onSelectorStateChange({ ...selectorState, year: Number(event.target.value) })}>
        {years.map((value) => <option key={value} value={value}>{value}년{value > 2023 ? " 전망" : " 기준"}</option>)}
      </select>
    </label>
    <h3>{year}년 발전원별 균등화 발전비용</h3>
    <p className="detail146-note">발전소의 건설·운영 비용을 생산 전력량으로 나눈 비용입니다. 선은 원자료의 하한~상한, 점은 기준값입니다. 전기요금이나 실제 거래가격이 아니며, 2030·2050년은 2023년 보고서의 전망입니다.</p>
    <ChartAxesV150 x="균등화 발전비용" y="발전원" unit="USD/MWh" />
    <figure className="detail146-range-chart" aria-label={`${year}년 발전원별 비용 범위, 단위 USD/MWh`}>
      <figcaption>비용 범위와 기준값 · USD/MWh · 2022년 불변가격 <span>0 ~ {scale} · 모든 연도에 같은 눈금 적용</span></figcaption>
      <ol>{selected.map((row) => <li key={row.technology} data-selected={row.technology === cardTechnology || undefined}>
        <span><PublicTermTextV134 text={row.technology} />{row.technology === cardTechnology && <small>목록에서 선택한 발전원</small>}</span>
        <span className="detail146-range-track" aria-hidden="true">{row.valid && <><i style={{ left: `${row.min! / scale * 100}%`, width: `${(row.max! - row.min!) / scale * 100}%` }} /><b style={{ left: `${row.benchmark! / scale * 100}%` }} /></>}</span>
        <span className="detail146-range-value">{fmt(row.benchmark)}<small>{fmt(row.min)} ~ {fmt(row.max)}</small></span>
      </li>)}</ol>
    </figure>
    {selected.some((row) => !row.valid) && <p role="status">일부 발전원의 기준값 또는 범위를 확인할 수 없어 해당 구간은 그리지 않았습니다. 아래 표에서 제공된 값을 확인하세요.</p>}
    <details className="detail146-details"><summary>표로 보기 · 발전원별 비용과 전망</summary>
      <div className="detail146-table"><table><caption>단위: USD/MWh · {year}년 기준 또는 전망</caption><thead><tr><th scope="col">발전원</th><th scope="col">하한</th><th scope="col">기준값</th><th scope="col">상한</th></tr></thead><tbody>{selected.map((row) => <tr key={row.technology}><th scope="row">{row.technology}</th><td>{fmt(row.min)}</td><td>{fmt(row.benchmark)}</td><td>{fmt(row.max)}</td></tr>)}</tbody></table></div>
      <div className="detail146-table"><table><caption>연도별 기준값 비교 · 2030·2050년은 전망</caption><thead><tr><th scope="col">발전원</th>{years.map((value) => <th scope="col" key={value}>{value}년</th>)}</tr></thead><tbody>{selected.map((row) => <tr key={row.technology}><th scope="row">{row.technology}</th>{years.map((value) => <td key={value}>{fmt(ranges.find((r) => r.year === value && r.technology === row.technology)?.benchmark ?? null)}</td>)}</tr>)}</tbody></table></div>
    </details>
    <p className="detail146-note">BloombergNEF · 2023년 10월 · <a href="https://assets.bbhub.io/professional/sites/24/20231020_Vietnam-TCF-report-with-factsheets-EN.pdf" target="_blank" rel="noreferrer">원문 보고서</a> 그림 6~8. 배터리 결합 발전원은 4시간 저장 조건입니다.</p>
  </section>;
}
