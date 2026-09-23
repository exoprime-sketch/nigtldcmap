import { useMemo } from "react";
import type { VietnamEntityV124, VietnamIndicatorMetaV124 } from "../../../data/vietnam/vietnamTypesV124";
import { pppModelV153 } from "../../../data/visualization/pppProcurementV153";
import { publicSourceUrlV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v146.css";
import "./detail-analysis-v153.css";

interface Props {
  entities: VietnamEntityV124[];
  indicators: VietnamIndicatorMetaV124[];
}

/**
 * C-012 PPP law and procurement, as label-form facts with Korean first and
 * the source wording in parentheses (V153). Province project counts from the
 * World Bank PPI database are a table; the 34-province map is a later step.
 */
export default function PppProcurementSummaryV153({ entities, indicators }: Props) {
  const model = useMemo(() => pppModelV153(entities, indicators), [entities, indicators]);
  const provinceTotal = model.provinces.reduce((sum, row) => sum + (row.count || 0), 0);
  return (
    <section className="detail146 d153-section" data-testid="ppp-procurement-v153">
      <p>
        PPP 법률·시행령, 전담 기관, 계약 유형, 조달 방식과 사업 이력을 항목별로 정리했습니다. 영문·베트남어 용어는 한글을 먼저 쓰고 원문을 괄호에 두었습니다.
      </p>
      <ul className="d153-summary" aria-label="요약">
        <li><span>항목</span><strong>{model.total}건</strong></li>
        <li><span>성·시별 PPP 사업(세계은행 PPI)</span><strong>{model.provinces.length}개 지역 · {provinceTotal.toLocaleString("ko-KR")}건</strong></li>
        <li><span>계약 유형</span><strong>{model.groups.find((group) => group.key === "contract")?.facts.length ?? 0}종</strong></li>
      </ul>
      {model.groups.map((group) => (
        <section key={group.key} className="d153-section" data-analysis-block="comparison-table" data-testid={`ppp-group-${group.key}-v153`}>
          <h4>{group.title} · {group.facts.length}건</h4>
          <ul className="d153-facts">
            {group.facts.map((fact) => {
              const href = publicSourceUrlV126(fact.href);
              return (
                <li key={fact.recordId}>
                  <span><PublicTermTextV134 text={fact.item} /></span>
                  <span>
                    {fact.value ? <PublicTermTextV134 text={fact.value} /> : fact.note ? "원자료 결측" : "값 미기재"}
                    {fact.time ? ` (${fact.time})` : ""}
                    {href ? <> · <a href={href} target="_blank" rel="noreferrer">출처</a></> : null}
                    {fact.description ? <small><PublicTermTextV134 text={fact.description} /></small> : null}
                    {fact.note ? <small><PublicTermTextV134 text={fact.note} /></small> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {model.provinces.length ? (
        <section className="d153-section" data-analysis-block="sorted-table" data-testid="ppp-provinces-v153">
          <h4>성·시별 PPP 사업 건수 · {model.provinceSource ? `${model.provinceSource} 등재 사업` : "세계은행 PPI"} · {model.provinces.length}개 지역</h4>
          <div className="d153-table-wrap">
            <table className="d153-table">
              <caption>원자료가 집계한 성 단위(개편 전 표기) 건수입니다. 34개 성·시로 합산하지 않습니다.</caption>
              <thead>
                <tr><th scope="col">지역</th><th scope="col" className="num">사업 수</th><th scope="col">기간</th><th scope="col">부문</th><th scope="col">상태</th></tr>
              </thead>
              <tbody>
                {model.provinces.map((row) => (
                  <tr key={row.recordId}>
                    <th scope="row">{row.region}{row.region !== row.regionSource ? `(${row.regionSource})` : ""}</th>
                    <td className="num">{row.count === null ? "—" : row.count.toLocaleString("ko-KR")}</td>
                    <td>{row.period || "—"}</td>
                    <td><PublicTermTextV134 text={row.sectors || "—"} /></td>
                    <td>{row.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <p className="detail146-note">낙찰방식별 건수 5행은 원자료에 방식 열이 없어 값만 표시합니다(원천 결함, 데이터 확보 항목으로 기록).</p>
    </section>
  );
}
