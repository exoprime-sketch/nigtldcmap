import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { searchGlobalV41 } from "../../utils/globalSearchV41";
import "../../styles/global-search-v41.css";

interface GlobalQuickSearchV41Props {
  open: boolean;
  onClose: () => void;
  onOpenCountry: (iso3: string) => void;
  onOpenDataset: (datasetId: string) => void;
  onExploreSearch: (
    query: string,
    countryIso3: string | null,
    technologyId: string | null
  ) => void;
}

export default function GlobalQuickSearchV41({
  open,
  onClose,
  onOpenCountry,
  onOpenDataset,
  onExploreSearch,
}: GlobalQuickSearchV41Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchGlobalV41(query), [query]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  const hasQuery = Boolean(query.trim());
  const hasPlanningCombination = Boolean(
    results.detectedCountry && results.detectedTechnology
  );

  function closeAnd(run: () => void) {
    onClose();
    run();
  }

  return (
    <div
      className="global-search-v41-backdrop"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="global-search-v41-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-v41-title"
      >
        <div className="global-search-v41-head">
          <div>
            <span className="global-search-v41-kicker">통합 검색</span>
            <h2 id="global-search-v41-title">
              국가·기후기술·데이터 빠르게 찾기
            </h2>
          </div>
          <button
            type="button"
            className="global-search-v41-close"
            onClick={onClose}
            aria-label="검색 닫기"
          >
            ×
          </button>
        </div>

        <label className="global-search-v41-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 베트남 태양광, 산업효율, NDC, GCF, World Bank"
            aria-label="통합 검색어"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
            >
              지우기
            </button>
          )}
        </label>

        {!hasQuery ? (
          <div className="global-search-v41-empty">
            <strong>한 번에 검색</strong>
            <p>
              국가명·ISO 코드·기후기술 분야·데이터 항목명·출처기관 입력 · 검색
              결과에서 국가 프로필, 관련 데이터 또는 협력 검토로 바로 이동
            </p>
            <button
              type="button"
              className="global-search-v41-all-button"
              onClick={() => closeAnd(() => onExploreSearch("", null, null))}
            >
              데이터 찾기 전체 보기 →
            </button>
          </div>
        ) : (
          <div className="global-search-v41-results" aria-live="polite">
            {hasPlanningCombination &&
              results.detectedCountry &&
              results.detectedTechnology && (
                <section className="global-search-v41-group global-search-v41-planning">
                  <div className="global-search-v41-group-title">
                    <strong>국가 × 기후기술 데이터</strong>
                    <span>
                      검색어에서 인식한 조건으로 데이터 찾기 필터 적용
                    </span>
                  </div>
                  <button
                    type="button"
                    className="global-search-v41-planning-card"
                    onClick={() =>
                      closeAnd(() =>
                        onExploreSearch(
                          "",
                          results.detectedCountry!.iso3,
                          results.detectedTechnology!.id
                        )
                      )
                    }
                  >
                    <span
                      className="global-search-v41-result-icon"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                    <span>
                      <strong>
                        {results.detectedCountry.nameKo} ×{" "}
                        {results.detectedTechnology.nameKo}
                      </strong>
                      <small>해당 조건의 공개 데이터와 출처를 바로 확인</small>
                    </span>
                  </button>
                </section>
              )}

            {results.countryMatches.length > 0 && (
              <section className="global-search-v41-group">
                <div className="global-search-v41-group-title">
                  <strong>국가</strong>
                </div>
                <div className="global-search-v41-list">
                  {results.countryMatches.map((country) => (
                    <button
                      type="button"
                      key={country.iso3}
                      className="global-search-v41-result"
                      onClick={() =>
                        closeAnd(() => onOpenCountry(country.iso3))
                      }
                    >
                      <span
                        className="global-search-v41-result-icon"
                        aria-hidden="true"
                      >
                        ◉
                      </span>
                      <span className="global-search-v41-result-copy">
                        <strong>{country.nameKo}</strong>
                        <small>
                          {country.nameEn} · {country.iso3} · 국가 프로필
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.technologyMatches.length > 0 && (
              <section className="global-search-v41-group">
                <div className="global-search-v41-group-title">
                  <strong>기후기술</strong>
                </div>
                <div className="global-search-v41-list">
                  {results.technologyMatches.map((technology) => (
                    <button
                      type="button"
                      key={technology.id}
                      className="global-search-v41-result"
                      onClick={() =>
                        closeAnd(() => onExploreSearch("", null, technology.id))
                      }
                    >
                      <span
                        className="global-search-v41-result-icon"
                        aria-hidden="true"
                      >
                        ◇
                      </span>
                      <span className="global-search-v41-result-copy">
                        <strong>{technology.nameKo}</strong>
                        <small>
                          {technology.category} · 관련 공개 데이터{" "}
                          {technology.datasetCount}건
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.elementMatches.length > 0 && (
              <section className="global-search-v41-group">
                <div className="global-search-v41-group-title">
                  <strong>데이터 항목</strong>
                  <span>152개 상위 카탈로그 기준</span>
                </div>
                <div className="global-search-v41-list">
                  {results.elementMatches.map(({ element }) => (
                    <button
                      type="button"
                      key={element.elementId}
                      className="global-search-v41-result"
                      onClick={() =>
                        closeAnd(() =>
                          onExploreSearch(
                            element.displayTitle,
                            results.detectedCountry?.iso3 ?? null,
                            results.detectedTechnology?.id ?? null
                          )
                        )
                      }
                    >
                      <span
                        className="global-search-v41-result-icon"
                        aria-hidden="true"
                      >
                        ▤
                      </span>
                      <span className="global-search-v41-result-copy">
                        <strong>{element.displayTitle}</strong>
                        <small>
                          {element.categoryLabel}
                          {element.source ? ` · ${element.source}` : ""}
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {results.totalCount === 0 && !hasPlanningCombination && (
              <div className="global-search-v41-empty global-search-v41-no-result">
                <strong>바로 일치하는 결과 없음</strong>
                <p>
                  검색어를 줄이거나 데이터 찾기에서 국가·기후기술·출처 조건을
                  직접 선택
                </p>
              </div>
            )}

            <div className="global-search-v41-footer">
              <button
                type="button"
                className="global-search-v41-all-button"
                onClick={() =>
                  closeAnd(() =>
                    onExploreSearch(
                      results.residualQuery,
                      results.detectedCountry?.iso3 ?? null,
                      results.detectedTechnology?.id ?? null
                    )
                  )
                }
              >
                데이터 찾기에서 전체 결과 보기 →
              </button>
              <span>Esc 닫기</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
