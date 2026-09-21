import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import PublicEntityCardGridV131 from "./PublicEntityCardGridV131";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

export default function CcsStatusAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  return <section className="detail146" data-testid="ccs-status-v147">
    <h3>대상별 추진 단계</h3>
    <p className="detail146-note">수록된 항목은 운영 중인 상용 CCS 시설 목록이 아닙니다. 실증, 저장 후보지역, 연구·타당성 검토를 구분해 확인하세요.</p>
    <div className="detail146-table"><table><caption>원자료에 수록된 대상과 추진 단계</caption><thead><tr><th scope="col">대상</th><th scope="col">유형</th><th scope="col">진행상황·참여 주체(원자료)</th></tr></thead><tbody>{entities.map((r) => <tr key={r.recordId}><th scope="row"><PublicTermTextV134 text={publicEntityTitleV131(r)} /></th><td><PublicTermTextV134 text={String(r.normalizedAttributes?.type || r.name)} /></td><td><PublicTermTextV134 text={String(r.normalizedAttributes?.field_b25998a0 || "미기재")} /></td></tr>)}</tbody></table></div>
    <details className="detail146-details"><summary>대상별 설명과 근거</summary><PublicEntityCardGridV131 entities={entities} template="generic" /></details>
  </section>;
}
