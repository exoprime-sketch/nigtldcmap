import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { uniqueNumericV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

export default function ScienceWorkforceAnalysisV147({ rows }: { rows: SemanticObservationV125[] }) {
  const own = (id: string) => rows.filter((r) => r.indicatorId === `E-009_${id}`);
  const value = (id: string) => uniqueNumericV147(own(id));
  const shares = [["stem_grad_share", "전체"], ["stem_grad_share_male", "남성"], ["stem_grad_share_female", "여성"]];
  const years = new Set(shares.flatMap(([id]) => own(id).map((r) => r.year)));
  const comparable = years.size === 1 && !years.has(null) && shares.every(([id]) => own(id).length === 1 && own(id)[0].unit === "%");
  const selectedYear = comparable ? [...years][0] : null;
  return <section className="detail146" data-testid="science-workforce-v147">
    <h3>성별 STEM 전공 졸업 비중</h3>
    <p className="detail146-note">각 성별 고등교육 졸업자 중 과학·기술·공학·수학 전공자가 차지하는 비율입니다. STEM 졸업자의 남녀 구성비가 아니므로 합계가 100%가 되지 않습니다.</p>
    {comparable && <AnalysisBarsV147 title={`${selectedYear}년 · 고등교육 졸업자 중 STEM 전공 비중`} unit="%" maximum={100} rows={shares.map(([id, label]) => ({ id, label, value: value(id) }))} />}
    <div className="detail146-table"><table><caption>STEM 졸업 비중 · UNESCO UIS</caption><thead><tr><th scope="col">구분</th><th scope="col">비중(%)</th><th scope="col">기준연도</th></tr></thead><tbody>{shares.map(([id, label]) => <tr key={id}><th scope="row">{label}</th><td>{formatValueV121(value(id))}</td><td>{own(id)[0]?.year || "미기재"}</td></tr>)}</tbody></table></div>
    <h3>연구자 규모</h3>
    <div className="detail146-table"><table><caption>절대수와 인구 대비 연구자 수를 구분합니다.</caption><thead><tr><th scope="col">항목</th><th scope="col">값</th><th scope="col">단위</th><th scope="col">연도</th></tr></thead><tbody>{[["researcher_count", "연구자 수(환산값)"], ["researchers_per_million", "인구 100만 명당 연구자 수"]].map(([id, label]) => <tr key={id}><th scope="row">{label}</th><td>{formatValueV121(value(id))}</td><td>{own(id)[0]?.unit}</td><td>{own(id)[0]?.year}</td></tr>)}</tbody></table></div>
    <p className="detail146-note">연구자 절대수는 원자료의 인구 100만 명당 연구자 수와 같은 연도 인구를 곱해 환산한 값입니다. STEM 졸업자 절대수는 제공되지 않습니다.</p>
  </section>;
}
