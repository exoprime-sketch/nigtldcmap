import { useMemo, useState } from "react";
import { LOCAL_EXAMPLE_DATASET } from "../../data/local/localDataExamples";
import "../../styles/data-types-v27.css";

type LocalSort = "permit" | "partners" | "demand" | "country";

export default function PriorityCountryComparePanel() {
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState<LocalSort>("permit");
  const rows = useMemo(() => {
    const next = [...LOCAL_EXAMPLE_DATASET.data];
    if (sort === "country")
      return next.sort((a, b) =>
        a.countryNameKo.localeCompare(b.countryNameKo, "ko")
      );
    if (sort === "partners")
      return next.sort(
        (a, b) => b.partnerCandidateCount - a.partnerCandidateCount
      );
    if (sort === "demand")
      return next.sort(
        (a, b) =>
          b.candidateDemandOrganizationCount -
          a.candidateDemandOrganizationCount
      );
    return next.sort((a, b) => a.permitMonths - b.permitMonths);
  }, [sort]);

  return (
    <section className="priority-compare-v27">
      <header>
        <div>
          <span>우선 구축국 10개국</span>
          <h2>현지정보 데이터 유형 비교</h2>
          <p>숫자·범주·문자 자료를 국가 비교 화면에서 보여주는 구조</p>
        </div>
        <div>
          <b>예시 데이터</b>
          <button type="button" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "접기" : "비교표 보기"}
          </button>
        </div>
      </header>
      <p className="priority-compare-v27-notice">
        {LOCAL_EXAMPLE_DATASET.metadata.notice}
      </p>
      {expanded && (
        <>
          <label className="priority-compare-v27-sort">
            <span>정렬</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as LocalSort)}
            >
              <option value="permit">인허가 기간 짧은 순</option>
              <option value="partners">파트너 후보 많은 순</option>
              <option value="demand">수요기관 후보 많은 순</option>
              <option value="country">국가명</option>
            </select>
          </label>
          <div className="resource-table-wrapper">
            <table className="resource-table priority-local-table">
              <thead>
                <tr>
                  <th>국가</th>
                  <th>인허가 기간</th>
                  <th>파트너 후보</th>
                  <th>수요기관 후보</th>
                  <th>협력의향</th>
                  <th>공급망</th>
                  <th>주요 수요</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.iso3}>
                    <td>
                      <strong>{row.countryNameKo}</strong>
                      <small>{row.iso3}</small>
                    </td>
                    <td>{row.permitMonths}개월</td>
                    <td>{row.partnerCandidateCount}개</td>
                    <td>{row.candidateDemandOrganizationCount}개</td>
                    <td>{row.cooperationWillingness}</td>
                    <td>{row.supplyChainReadiness}</td>
                    <td>{row.mainDemand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
