import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { ndcTargetsV146, NDC_SOURCE_V146 } from "../../../data/visualization/ndcTargetsV146";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v146.css";

const number = (value: number | null) => value === null ? "자료 확인 필요" : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });

export default function NdcTargetsAnalysisV146({ entities }: { entities: VietnamEntityV124[] }) {
  const model = useMemo(() => ndcTargetsV146(entities), [entities]);
  const [condition, setCondition] = useState<"own" | "supported">("own");
  const scale = Math.max(1, ...model.sectors.flatMap((row) => [row.own ?? 0, row.supported ?? 0]));
  const histories = model.rows.filter((row) => row.indicatorId === "C-001_submission_history");
  const adaptation = model.rows.filter((row) => row.indicatorId === "C-001_adaptation_target");
  const bau = model.rows.filter((row) => row.indicatorId === "C-001_bau_projection" && /^(19|20)\d{2}/.test(row.name));
  return <section className="detail146" data-testid="ndc-targets-v146">
    <p><PublicTermTextV134 text="2022년 제출 NDC 기준입니다. 국제지원 조건부 목표는 자체 이행분을 포함한 전체 목표이며, 두 목표를 더하지 않습니다." /></p>
    <div className="detail146-table" data-analysis-block="table"><table><caption>2030년 목표 · 2022년 NDC</caption>
      <thead><tr><th scope="col">항목</th><th scope="col">자체 이행</th><th scope="col">국제지원 시 전체</th><th scope="col">단위</th></tr></thead>
      <tbody>{model.totals.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{number(row.own)}</td><td>{number(row.supported)}</td><td><PublicTermTextV134 text={row.unit} /></td></tr>)}</tbody>
    </table></div>
    <p className="detail146-note"><PublicTermTextV134 text="감축률은 추가 감축정책이 없는 경우의 2030년 배출 전망(BAU) 대비입니다. 소요재원은 감축목표 이행 비용이며, 확보된 재원이 아닙니다." /></p>
    <label className="detail146-select">이행 조건 <select value={condition} onChange={(event) => setCondition(event.target.value as "own" | "supported")}><option value="own">자체 이행(무조건부)</option><option value="supported">국제지원 시 전체(조건부)</option></select></label>
    <ChartAxesV150 x="온실가스 감축량" y="부문" unit="백만 tCO₂e" />
    <figure className="detail146-chart" data-analysis-block="category-bar"><figcaption><PublicTermTextV134 text={`부문별 감축량 · ${condition === "own" ? "자체 이행" : "국제지원 시 전체"} · 2030년 · 백만 tCO₂e`} /></figcaption>
      <ol>{model.sectors.map((row) => <li key={row.label}><span>{row.label}</span><i aria-hidden="true"><b style={{ width: `${(row[condition] ?? 0) / scale * 100}%` }} /></i><strong>{number(row[condition])}</strong></li>)}</ol>
    </figure>
    <p className="detail146-note">토지이용·토지이용변화·산림 부문에는 탄소 흡수 증가분이 포함됩니다. 조건을 바꿔도 막대의 기준 축은 같습니다.</p>
    <details className="detail146-details" data-analysis-block="table"><summary>부문별 감축량 표</summary><div className="detail146-table"><table><caption>부문별 감축량 · 백만 tCO₂e · 2030년</caption><thead><tr><th scope="col">부문</th><th scope="col">자체 이행</th><th scope="col">국제지원 시 전체</th></tr></thead><tbody>{model.sectors.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{number(row.own)}</td><td>{number(row.supported)}</td></tr>)}</tbody></table></div></details>
    <details className="detail146-details" data-analysis-block="table"><summary>기준 배출량과 감축정책 미반영 전망</summary><div className="detail146-table"><table><caption>2014년 기준 배출량 및 BAU 전망 · 백만 tCO₂e</caption><thead><tr><th scope="col">연도</th><th scope="col">구분</th><th scope="col">배출량</th></tr></thead><tbody>{bau.map((row) => <tr key={row.recordId}><th scope="row">{row.year}년</th><td>{row.year === 2014 ? "기준 배출량" : "BAU 전망"}</td><td>{number(row.value)}</td></tr>)}</tbody></table></div></details>
    <details className="detail146-details" data-analysis-block="timeline"><summary>NDC 제출 이력과 적응목표</summary><div className="detail146-table"><table><caption>제출 이력 · 원자료 수록 기준</caption><thead><tr><th scope="col">문서</th><th scope="col">제출 시점</th><th scope="col">주요 내용</th></tr></thead><tbody>{histories.map((row) => <tr key={row.recordId}><th scope="row">{row.name.replace(/\(현행\)/g, "")}</th><td>{row.valueText}</td><td><PublicTermTextV134 text={row.note} /></td></tr>)}</tbody></table></div><ul>{adaptation.map((row) => <li key={row.recordId}><strong>{row.name}</strong> · <PublicTermTextV134 text={row.note} /></li>)}</ul></details>
    {model.unmatched.length > 0 && <p role="status">조건을 확인하지 못한 목표 {model.unmatched.length}건은 비교 차트에 포함하지 않았습니다. 원자료에서 확인해 주세요.</p>}
    <p className="detail146-note">출처: <a href={NDC_SOURCE_V146} target="_blank" rel="noreferrer">베트남 NDC 2022, 표 3·4 원문 보기</a></p>
  </section>;
}
