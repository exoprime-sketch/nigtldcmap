import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import PublicPortfolioSummaryV132, { publicPortfolioFacetV132, publicPortfolioRecordLabelV138 } from "./PublicPortfolioSummaryV132";
import PublicPortfolioListV132, { publicPortfolioCategoryLabelV140 } from "./PublicPortfolioListV132";
import "./public-analysis-workspace-v143.css";

type Props = { elementId: string; entities: VietnamEntityV124[]; detailTemplate?: string; elementTitle?: string };
export type PortfolioSelectionV143 = { query: string; year: string; category: string };
export const EMPTY_PORTFOLIO_SELECTION_V143: PortfolioSelectionV143 = { query: "", year: "all", category: "all" };

export function portfolioSelectionModelV143(props: Props, selection: PortfolioSelectionV143) {
  const records = props.entities.map((entity) => ({
    entity,
    facet: publicPortfolioFacetV132(props.elementId, entity, props.detailTemplate),
    title: resolvePublicEntityTitleV131(entity, { template: props.detailTemplate, elementTitle: props.elementTitle }).title,
  }));
  const individual = records.filter(({ facet }) => facet.recordRole === "individual");
  const noteEntities = records.filter(({ facet }) => facet.recordRole !== "individual").map(({ entity }) => entity);
  const needle = selection.query.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
  const filtered = individual.filter(({ facet, title }) =>
    (selection.year === "all" || String(facet.year) === selection.year) &&
    (selection.category === "all" || facet.category === selection.category) &&
    (!needle || `${title} ${facet.searchText}`.normalize("NFC").toLocaleLowerCase("ko-KR").includes(needle))
  ).map(({ entity }) => entity);
  return {
    filtered, noteEntities, total: individual.length,
    years: [...new Set(individual.flatMap(({ facet }) => facet.year ? [String(facet.year)] : []))].sort((a, b) => Number(b) - Number(a)),
    categories: [...new Set(individual.flatMap(({ facet }) => facet.category ? [facet.category] : []))].sort((a, b) => a.localeCompare(b, "ko")),
  };
}

/** One selection governs the summary, charts and paginated list. */
export default function PublicPortfolioWorkspaceV143(props: Props) {
  const { elementId, entities, detailTemplate, elementTitle } = props;
  const [selection, setSelection] = useState(EMPTY_PORTFOLIO_SELECTION_V143);
  const model = useMemo(() => portfolioSelectionModelV143({ elementId, entities, detailTemplate, elementTitle }, selection), [elementId, entities, detailTemplate, elementTitle, selection]);
  const active = Boolean(selection.query.trim() || selection.year !== "all" || selection.category !== "all");
  const update = (key: keyof PortfolioSelectionV143, value: string) => setSelection((previous) => ({ ...previous, [key]: value }));
  const noun = publicPortfolioRecordLabelV138(props.elementId);
  return <section className="paw143" data-testid="portfolio-workspace-v143">
    <div className="paw143-filters" role="search" aria-label={`${noun} 분석 조건`}>
      <label><span>검색어</span><input type="search" placeholder="제목·기관·분야 검색" value={selection.query} onChange={(event) => update("query", event.target.value)} /></label>
      {model.years.length > 0 && <label><span>연도</span><select value={selection.year} onChange={(event) => update("year", event.target.value)}><option value="all">전체 기간</option>{model.years.map((year) => <option key={year} value={year}>{year}년</option>)}</select></label>}
      {model.categories.length > 0 && <label><span>{publicPortfolioCategoryLabelV140(props.elementId)}</span><select value={selection.category} onChange={(event) => update("category", event.target.value)}><option value="all">전체</option>{model.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
      <button type="button" onClick={() => setSelection(EMPTY_PORTFOLIO_SELECTION_V143)} disabled={!active}>선택 초기화</button>
    </div>
    <p className="paw143-selection" role="status" data-testid="portfolio-selection-count-v143">{active ? "선택한 조건" : "전체 자료"} · {noun} {model.filtered.length.toLocaleString("ko-KR")}건 / 전체 {model.total.toLocaleString("ko-KR")}건<span>아래 현황·차트·목록에 같은 조건이 적용됩니다.</span></p>
    {["D-015", "D-016", "D-021"].includes(elementId) && <p className="detail146-note">{elementId === "D-021" ? "국제원조투명성이니셔티브(IATI)에 보고된 활동 단위입니다. 같은 사업에 여러 지원 활동이 포함될 수 있습니다." : "보고기관의 사업 기록 단위입니다. 같은 사업이 다른 사업번호나 보고 기간으로 나뉘어 수록될 수 있어, 서로 다른 사업의 총수와는 구분됩니다."}</p>}
    {model.filtered.length > 0 ? <PublicPortfolioSummaryV132 elementId={props.elementId} entities={active ? model.filtered : props.entities} detailTemplate={props.detailTemplate} /> : <p className="ppl132-empty">조건에 맞는 자료가 없습니다. 검색어 또는 선택 조건을 변경해 주세요.</p>}
    <PublicPortfolioListV132 key={JSON.stringify(selection)} {...props} entities={[...model.filtered, ...model.noteEntities]} hideFilters />
  </section>;
}
