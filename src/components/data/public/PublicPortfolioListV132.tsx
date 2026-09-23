import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import PublicEntityCardGridV131 from "./PublicEntityCardGridV131";
import {
  publicPortfolioFacetV132,
  publicPortfolioRecordLabelV138,
} from "./PublicPortfolioSummaryV132";

import "./public-portfolio-list-v132.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

interface Props {
  elementId: string;
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
  hideFilters?: boolean;
}
const PAGE_SIZE_V132 = 12;

/**
 * What the category filter actually filters on, per register (V140). The
 * one label "분야·기금" was wrong for a company register (E-018 files a
 * sector and an entry mode) and for a support-scheme register (E-020 files
 * a support type); it stays for the fund portfolios it was written for.
 */
const CATEGORY_LABELS_V140: Record<string, string> = {
  "C-025": "등록 표준·분야",
  "D-012": "기술분야",
  "D-014": "분야·원조유형",
  "D-015": "분야·원조유형",
  "D-016": "분야·원조유형",
  "D-017": "분야·입찰유형",
  "D-019": "기술분야",
  "D-021": "분야·공여기관",
  "D-022": "분야·투자유형",
  "D-023": "기금·분야",
  "D-024": "기후 분야·투자 라운드",
  "D-025": "섹터·투자유형",
  "D-026": "섹터·보증유형",
  "E-018": "업종·진출형태",
  "E-020": "지원유형·지원기관",
};

export function publicPortfolioCategoryLabelV140(elementId: string): string {
  return CATEGORY_LABELS_V140[elementId] || "분야·기금";
}

export default function PublicPortfolioListV132({
  elementId,
  entities,
  detailTemplate,
  elementTitle,
  hideFilters = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const allRecords = useMemo(
    () =>
      entities.map((entity) => {
        const facet = publicPortfolioFacetV132(elementId, entity, detailTemplate);
        const title = resolvePublicEntityTitleV131(entity, {
          template: detailTemplate,
          elementTitle,
        }).title;
        return { entity, facet, title };
      }),
    [detailTemplate, elementId, elementTitle, entities]
  );
  // Rows the source marks 집계 are totals or explanations of the register,
  // not members of it (D-023: 71 projects and 2 such rows). They are listed
  // apart so the list's count is the register's count (V140).
  const records = useMemo(() => allRecords.filter(({ facet }) => facet.recordRole === "individual"), [allRecords]);
  const aggregateRecords = useMemo(() => allRecords.filter(({ facet }) => facet.recordRole === "aggregate"), [allRecords]);
  // Rows that describe a category the register uses (D-026's five guarantee
  // covers) are kept as that explanation, with what they say (V142).
  const definitionRecords = useMemo(() => allRecords.filter(({ facet }) => facet.recordRole === "definition"), [allRecords]);
  const definitionLabel = definitionRecords[0]?.facet.recordRoleLabel || "분류 안내";
  const years = useMemo(
    () =>
      Array.from(
        new Set(records.flatMap(({ facet }) => (facet.year ? [String(facet.year)] : [])))
      ).sort((left, right) => Number(right) - Number(left)),
    [records]
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(records.flatMap(({ facet }) => (facet.category ? [facet.category] : [])))
      ).sort((left, right) => left.localeCompare(right, "ko")),
    [records]
  );
  const filtered = useMemo(() => {
    const needle = query.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
    return records.filter(({ facet, title }) => {
      if (year !== "all" && String(facet.year || "") !== year) return false;
      if (category !== "all" && facet.category !== category) return false;
      if (!needle) return true;
      return `${title} ${facet.searchText}`
        .normalize("NFC")
        .toLocaleLowerCase("ko-KR")
        .includes(needle);
    });
  }, [category, query, records, year]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_V132));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered
    .slice((currentPage - 1) * PAGE_SIZE_V132, currentPage * PAGE_SIZE_V132)
    .map(({ entity }) => entity);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <section
      className="ppl132"
      data-testid="portfolio-entity-list-v132"
      data-filtered-entity-count={filtered.length}
    >
      <header className="ppl132-heading">
        {/* One heading, naming what the list holds. "개별 목록" over
            "사업·재원 찾아보기" was two labels for the same thing, under a
            section already called the same again. */}
        <div>
          <h4>{`${publicPortfolioRecordLabelV138(elementId)} 목록`}</h4>
        </div>
        <strong aria-live="polite">{filtered.length.toLocaleString("ko-KR")}건</strong>
      </header>

      {!hideFilters && <div
        className="ppl132-filters"
        role="search"
        aria-label={`${publicPortfolioRecordLabelV138(elementId)} 목록 필터`}
        data-testid="portfolio-list-filters-v132"
      >
        <label>
          <span>검색</span>
          <input
            type="search"
            value={query}
            onChange={(event) => updateFilter(setQuery, event.target.value)}
            placeholder="사업명·기관·분야 검색"
          />
        </label>
        <label>
          <span>연도</span>
          <select
            value={year}
            onChange={(event) => updateFilter(setYear, event.target.value)}
          >
            <option value="all">전체</option>
            {years.map((option) => (
              <option key={option} value={option}>{option}년</option>
            ))}
          </select>
        </label>
        <label>
          <span>{publicPortfolioCategoryLabelV140(elementId)}</span>
          <select
            value={category}
            onChange={(event) => updateFilter(setCategory, event.target.value)}
          >
            <option value="all">전체</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>}

      {shown.length > 0 ? (
        <PublicEntityCardGridV131
          entities={shown}
          template="portfolio"
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
          limit={PAGE_SIZE_V132}
        />
      ) : (
        <p className="ppl132-empty" role="status">선택한 조건에 맞는 공개 목록이 없습니다.</p>
      )}

      {definitionRecords.length > 0 && (
        <section className="ppl132-definitions" data-analysis-block="comparison-table" data-testid="portfolio-definition-rows-v142" data-definition-count={definitionRecords.length}>
          <h5>{definitionLabel} · {definitionRecords.length}건 ({publicPortfolioRecordLabelV138(elementId)} 수에서 제외)</h5>
          <dl>
            {definitionRecords.map(({ entity, title, facet }) => (
              <div key={entity.recordId || title}>
                <dt>{title}</dt>
                <dd><PublicTermTextV134 text={publicTextV126(facet.attributes.portfolioCategory) || publicTextV126(facet.attributes.sector) || ""} /></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {aggregateRecords.length > 0 && (
        <details className="ppl132-aggregates" data-analysis-block="cards-list" data-testid="portfolio-aggregate-rows-v140">
          <summary>원천의 집계·설명 행 {aggregateRecords.length}건 (목록 건수에서 제외)</summary>
          <ul>
            {aggregateRecords.map(({ entity, title }) => (
              <li key={entity.recordId || title}>{title}</li>
            ))}
          </ul>
        </details>
      )}

      {pageCount > 1 && (
        <nav className="ppl132-pagination" aria-label="사업·재원 목록 페이지">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >이전</button>
          <span>{currentPage} / {pageCount}</span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >다음</button>
        </nav>
      )}
    </section>
  );
}
