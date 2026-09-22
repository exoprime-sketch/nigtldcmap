import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { facilityRegionsV146 } from "../../../data/visualization/facilityRegionsV146";
import { EvidenceMatrixV125 } from "../semantic/SemanticContractRendererV125";
import "./detail-analysis-v146.css";

export default function CarbonMarketRegionsV146({ elementId, entities, initialRegion }: { elementId: string; entities: VietnamEntityV124[]; initialRegion?: string }) {
  const model = useMemo(() => facilityRegionsV146(entities), [entities]);
  const [region, setRegion] = useState(initialRegion || "all");
  const [date, setDate] = useState(model.dates[0] || "");
  const rows = model.regions.filter((row) => row.date === date).sort((a, b) => b.count - a.count);
  const selected = rows.find((row) => row.code === region);
  const sameDate = rows.filter((row) => region === "all" || row.code === region);
  const isSector = elementId === "C-022";
  const chart = isSector && selected && selected.sectorTotalMatches ? selected.sectors : sameDate.map((row) => ({ label: row.region, value: row.count }));
  const scale = Math.max(1, ...chart.map((row) => row.value));
  return <section className="detail146" data-testid="carbon-market-regions-v146">
    <p>법령에 수록된 {rows.length}개 성·시의 집계입니다. 배출권 거래제 참여 시설 수와는 구분됩니다.{selected && ` ${selected.region}의 대상 시설은 ${selected.count.toLocaleString("ko-KR")}개소입니다.`}</p>
    <div className="detail146-select"><label>기준일 <select value={date} onChange={(event) => { setDate(event.target.value); setRegion("all"); }}>{model.dates.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>지역 <select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">전체 지역</option>{rows.map((row) => <option value={row.code} key={row.code}>{row.region}</option>)}</select></label></div>
    <ChartAxesV150 x="시설 수" y={isSector && selected?.sectorTotalMatches ? "부문" : "성·시"} unit="개소" />
    <figure className="detail146-chart" data-analysis-block={isSector && selected?.sectorTotalMatches ? "category-bar" : "region-bar"}><figcaption>{isSector && selected?.sectorTotalMatches ? `${selected.region} · 부문별 시설 수` : "성·시별 시설 수"} · {date} · 개소</figcaption><ol>{chart.map((row) => <li key={row.label}><span>{row.label}</span><i aria-hidden="true"><b style={{ width: `${row.value / scale * 100}%` }} /></i><strong>{row.value.toLocaleString("ko-KR")}</strong></li>)}</ol></figure>
    {isSector && selected && !selected.sectorTotalMatches && <p role="status">이 지역의 부문별 세부 수치는 원자료에서 확인해 주세요.</p>}
    <details className="detail146-details"><summary>지역별 시설 수 표</summary><div className="detail146-table" data-analysis-block="sorted-table"><table><caption>선택한 기준일·지역 · 개소</caption><thead><tr><th scope="col">지역</th><th scope="col">시설 수</th>{isSector && <th scope="col">부문별 구성</th>}</tr></thead><tbody>{sameDate.map((row) => <tr key={row.code}><th scope="row">{row.region}</th><td>{row.count.toLocaleString("ko-KR")}</td>{isSector && <td>{row.sectors.map((sector) => `${sector.label} ${sector.value}개소`).join(" · ") || "미기재"}</td>}</tr>)}</tbody></table></div></details>
    <details className="detail146-details"><summary>{isSector ? "탄소시장 준비도 평가·제도 근거" : "탄소시장 제도·세율·시행 일정"}</summary>
      <p className="detail146-note">아래 자료는 각 문서에 기재된 시점과 적용 조건을 기준으로 확인해 주세요.{isSector ? " 준비도 점수는 수록된 체크리스트 평가이며 국제 공인 순위가 아닙니다." : " 환경보호세 세율은 배출권 거래가격이 아닙니다."}</p>
      <section className="d153-block" data-analysis-block="comparison-table"><EvidenceMatrixV125 rows={[]} entities={model.other} /></section>
    </details>
  </section>;
}
