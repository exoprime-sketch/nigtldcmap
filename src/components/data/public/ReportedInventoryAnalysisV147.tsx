import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { burInventoryV147, BUR_GASES_V147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { EvidenceMatrixV125 } from "../semantic/SemanticContractRendererV125";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

const GAS_LABELS = { CO2: "이산화탄소(CO₂)", CH4: "메탄(CH₄)", N2O: "아산화질소(N₂O)", HFCs: "수소불화탄소(HFCs)" };
export default function ReportedInventoryAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  const inventory = useMemo(() => burInventoryV147(entities), [entities]);
  const [measure, setMeasure] = useState<"total" | typeof BUR_GASES_V147[number]>("total");
  const values = inventory.map((r) => ({ id: r.source, label: r.label, value: measure === "total" ? r.total : r.gases[measure] }));
  return <section className="detail146" data-testid="reported-inventory-v147">
    <h3><PublicTermTextV134 text="2016년 부문별 온실가스 배출량 · BUR3 수록 자료" /></h3>
    <p className="detail146-note"><PublicTermTextV134 text="보고서에 수록된 2016년 배출량입니다. 현재 배출량이나 NDC 감축 달성량은 아닙니다. 과거 BUR와 산정기준이 달라 하나의 추이로 연결하지 않습니다." /></p>
    <label className="detail146-select">비교 항목<select aria-label="인벤토리 비교 항목" value={measure} onChange={(e) => setMeasure(e.target.value as typeof measure)}><option value="total">부문별 합계</option>{BUR_GASES_V147.map((g) => <option value={g} key={g}>{GAS_LABELS[g]}</option>)}</select></label>
    <section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 title={measure === "total" ? "부문별 순배출량" : `${GAS_LABELS[measure]} · 부문별 CO₂ 환산 배출량`} unit="ktCO₂e" rows={values} /></section>
    <p className="detail146-note">음수는 순흡수량입니다. 총계·부문 합계·가스별 값을 중복해서 더하지 않습니다.</p>
    <div className="detail146-table" data-analysis-block="table"><table data-testid="inventory-matrix-v147"><caption>2016년 · BUR3 표 2.3·2.15 · 단위: ktCO₂e</caption><thead><tr><th scope="col">부문</th><th scope="col">부문 합계</th>{BUR_GASES_V147.map((g) => <th key={g} scope="col"><PublicTermTextV134 text={GAS_LABELS[g]} /></th>)}</tr></thead><tbody>{inventory.map((r) => <tr key={r.source}><th scope="row">{r.label}</th><td>{formatValueV121(r.total)}</td>{BUR_GASES_V147.map((g) => <td key={g}>{r.gases[g] === null ? "미기재" : formatValueV121(r.gases[g])}</td>)}</tr>)}</tbody></table></div>
    <p className="detail146-note">원문의 빈 셀은 ‘미기재’로 남겼습니다. 가스별 합계와 부문 합계에는 원문 반올림 차이가 있을 수 있습니다.</p>
    <details className="detail146-details"><summary>보고서의 다른 내용 · 제출 이력·재원·전망</summary><section className="d153-block" data-analysis-block="comparison-table"><EvidenceMatrixV125 rows={[]} entities={entities} /></section></details>
  </section>;
}
