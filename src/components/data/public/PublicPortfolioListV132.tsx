import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import PublicEntityCardGridV131 from "./PublicEntityCardGridV131";
import { publicPortfolioFacetV132 } from "./PublicPortfolioSummaryV132";

import "./public-portfolio-list-v132.css";

interface Props {
  elementId: string;
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
}
const PAGE_SIZE_V132 = 12;

export default function PublicPortfolioListV132({
  elementId,
  entities,
  detailTemplate,
  elementTitle,
}: Props) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const records = useMemo(
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
        <div>
          <span>개별 목록</span>
          <h4>사업·재원 찾아보기</h4>
        </div>
        <strong aria-live="polite">{filtered.length.toLocaleString("ko-KR")}건</strong>
      </header>

      <div
        className="ppl132-filters"
        role="search"
        aria-label="사업·재원 목록 필터"
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
          <span>분야·기금</span>
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
      </div>

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
