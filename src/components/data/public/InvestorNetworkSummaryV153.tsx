import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { PROVINCE_KO_34_V151 } from "../../../data/map/adminBoundaryV151";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import FacilityCardV153 from "./FacilityCardV153";
import { PublicTermExpandedTextV134, PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v146.css";
import "./detail-analysis-v153.css";

interface Props {
  entities: VietnamEntityV124[];
}

const IN_VIETNAM = "베트남 소재";
/**
 * Head-office country in Korean (V153).
 *
 * The source stores ISO 3166-1 alpha-3, which the screen printed verbatim
 * ("본부 CHE"). Only the codes this dataset carries are named here; an unknown
 * code is printed as the source has it rather than guessed.
 */
const HQ_COUNTRY_KO_V153: Record<string, string> = {
  CHE: "스위스",
  FRA: "프랑스",
  GBR: "영국",
  PHL: "필리핀",
  SGP: "싱가포르",
  USA: "미국",
  VNM: "베트남",
};
const ABROAD = "해외 소재(베트남 투자 실적)";

function locationOf(entity: VietnamEntityV124): string {
  const stated = String(entity.normalizedAttributes?.locationClass || "");
  return stated === IN_VIETNAM || stated === ABROAD ? stated : ABROAD;
}

/**
 * E-006 investors by where they sit (V153).
 *
 * Fifteen organisations: eight with a Vietnam office (the ones the map
 * shows, by city) and seven whose only address is a head office abroad,
 * listed apart as "해외 소재(베트남 투자 실적)". The class is an ETL
 * attribute decided from each row's own coordinate, not a runtime guess.
 */
export default function InvestorNetworkSummaryV153({ entities }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const groups = useMemo(() => {
    const titled = entities.map((entity) => ({ entity, title: resolvePublicEntityTitleV131(entity, { elementTitle: "투자기관" }).title, location: locationOf(entity) }));
    const sortByTitle = (rows: typeof titled) => [...rows].sort((a, b) => a.title.localeCompare(b.title, "en"));
    return {
      inVietnam: sortByTitle(titled.filter((row) => row.location === IN_VIETNAM)),
      abroad: sortByTitle(titled.filter((row) => row.location === ABROAD)),
    };
  }, [entities]);
  const cityRows = useMemo(() => {
    const counts = new Map<string, number>();
    entities.forEach((entity) => {
      const city = String(entity.normalizedAttributes?.city || "도시 미기재");
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return [...counts].sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ id: city, label: city, value: count }));
  }, [entities]);
  const selectedRow = [...groups.inVietnam, ...groups.abroad].find((row) => row.entity.recordId === selected) || null;

  const list = (rows: typeof groups.inVietnam, testId: string) => (
    <ol className="d153-facts" data-testid={testId}>
      {rows.map(({ entity, title }) => {
        const attributes = entity.normalizedAttributes || {};
        const provinceName = attributes.adm1Name34 ? String(attributes.adm1Name34) : null;
        const provinceKo = PROVINCE_KO_34_V151[String(attributes.adm1Code34 || "")];
        const province = provinceName ? (provinceKo ? `${provinceKo}(${provinceName})` : provinceName) : null;
        const hqIso3 = String(attributes.hqCountryIso3 || "");
        const place = [province || attributes.city, hqIso3 ? `본부 ${HQ_COUNTRY_KO_V153[hqIso3] || hqIso3}` : null].filter(Boolean).join(" · ");
        return (
          <li key={entity.recordId}>
            <span>
              <button type="button" className="d153-list-button" aria-pressed={selected === entity.recordId} onClick={() => setSelected(selected === entity.recordId ? null : entity.recordId)}>
                {/* A help trigger cannot sit inside this select button, so the
                    title states the meaning in place instead (V153). */}
                <PublicTermExpandedTextV134 text={title} />
              </button>
            </span>
            <span>
              {/* The source joins two types with a semicolon ("PE;VC"); the screen reads them as one list. */}
              <PublicTermTextV134 text={String(attributes.field_75295a6c || attributes.field_a76779ad || "유형 미기재").split(";").map((part) => part.trim()).filter(Boolean).join(" · ")} /> · {place}
              {attributes.investSector ? <small><PublicTermTextV134 text={String(attributes.investSector)} /></small> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <section className="detail146 d153-section" data-testid="investor-network-v153">
      <p>
        기관 수 {entities.length}곳 가운데 베트남에 사무소를 둔 {groups.inVietnam.length}곳은 도시 단위로 지도에 표시하고, 본부만 확인되는 {groups.abroad.length}곳은 베트남 투자 실적이 있는 해외 소재 기관으로 따로 둡니다. 기관을 누르면 카드가 열립니다.
      </p>
      <ul className="d153-summary" aria-label="요약">
        <li><span>기관 수</span><strong>{entities.length}곳</strong></li>
        <li><span>베트남 소재 · 지도 표시</span><strong>{groups.inVietnam.length}곳</strong></li>
        <li><span>해외 소재(베트남 투자 실적)</span><strong>{groups.abroad.length}곳</strong></li>
      </ul>
      {/* Where the investors are opens the screen (V153 contract: bars per city); the lists follow. */}
      <section className="d153-block" data-analysis-block="region-bar"><AnalysisBarsV147 rows={cityRows} title="도시별 기관 수 · 원문 표기 기준" unit="곳" xAxis="기관 수" yAxis="도시" /></section>
      <div className="d153-grid">
        <section className="d153-section" data-analysis-block="cards-list">
          <h4>베트남 소재 기관 · {groups.inVietnam.length}곳 · 도시 단위</h4>
          {list(groups.inVietnam, "investor-list-vietnam-v153")}
        </section>
        <section className="d153-section" data-analysis-block="cards-list">
          <h4>해외 소재(베트남 투자 실적) · {groups.abroad.length}곳</h4>
          {list(groups.abroad, "investor-list-abroad-v153")}
          <p className="detail146-note">본부 도시 좌표만 확인된 기관은 베트남 지도에 표시하지 않습니다.</p>
        </section>
      </div>
      {selectedRow ? (
        <div className="d153-selected" data-testid="investor-selected-v153">
          <FacilityCardV153 elementId="E-006" entity={selectedRow.entity} title={selectedRow.title} />
        </div>
      ) : null}
    </section>
  );
}
