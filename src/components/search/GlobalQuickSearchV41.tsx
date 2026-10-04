import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  loadPublicSearchItemsV128,
  publicDataStatusLabelV128,
  publicDataStatusKeyV128,
  publicDownloadStatusV128,
  publicReferencePeriodV128,
  searchPublicDataV128,
} from "../../data/publicPlatformV128";
import type { PublicSearchItemV128 } from "../../data/publicPlatformV128";
import { resolveHomeCountryV161 } from "../../data/homeCountryV161";
import { publicItemNameV164 } from "../../data/spec/publicItemNameV164";
import { searchResultLineV164 } from "../../data/searchResultLineV164";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../../data/countryContext";
import "../../styles/global-search-v41.css";

interface GlobalQuickSearchV41Props {
  open: boolean;
  onClose: () => void;
  onOpenElement: (elementId: string, countryIso3: string) => void;
  onOpenMapElement: (elementId: string, countryIso3: string) => void;
  onOpenDownload: (elementId: string, countryIso3: string) => void;
  onExploreSearch: (
    query: string,
    countryIso3: string | null,
    technologyId: string | null
  ) => void;
}

export default function GlobalQuickSearchV41({
  open,
  onClose,
  onOpenElement,
  onOpenMapElement,
  onOpenDownload,
  onExploreSearch,
}: GlobalQuickSearchV41Props) {
  const [query, setQuery] = useState("");
  // V163-BTN: the search covers the page's own country (`?country=`, else the
  // default public country), read each time it opens; it was Viet Nam only.
  const scope = useMemo(
    () => (open ? resolveHomeCountryV161(window.location.search) : null),
    [open]
  );
  const countryIso3 = scope?.iso3 || DEFAULT_COUNTRY_ISO3_V158;
  const [loaded, setLoaded] = useState<{ iso3: string; items: PublicSearchItemV128[] } | null>(null);
  const items = useMemo(
    () => (loaded && loaded.iso3 === countryIso3 ? loaded.items : []),
    [countryIso3, loaded]
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(
    () => searchPublicDataV128(query, items),
    [items, query]
  );

  useEffect(() => {
    if (!open || items.length > 0) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void loadPublicSearchItemsV128(countryIso3)
      .then((value) => {
        if (!cancelled) setLoaded({ iso3: countryIso3, items: value });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3, items.length, open]);

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
            <h2 id="global-search-v41-title">{scope ? `${scope.nameKo} ` : ""}공개 데이터 찾기</h2>
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
            placeholder="어떤 데이터를 찾으시나요?"
            aria-label="데이터명, 항목, 기술, 기관, 사업 또는 지역 검색"
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
            <strong>데이터 통합 검색</strong>
            <p>
              데이터명과 항목·분류·기술·기관·정책·사업·지역·제공기관을 함께
              검색합니다.
            </p>
            <button
              type="button"
              className="global-search-v41-all-button"
              onClick={() => closeAnd(() => onExploreSearch("", countryIso3, null))}
            >
              전체 데이터 보기 →
            </button>
          </div>
        ) : (
          <div className="global-search-v41-results" aria-live="polite">
            {loading && (
              <div className="global-search-v41-empty" role="status">
                <strong>검색 데이터를 불러오는 중입니다</strong>
              </div>
            )}
            {loadError && (
              <div className="global-search-v41-empty" role="alert">
                <strong>검색 데이터를 불러오지 못했습니다</strong>
                <p>데이터 찾기에서 다시 검색해 주세요.</p>
              </div>
            )}
            {!loading && !loadError && results.length > 0 && (
              <section className="global-search-v41-group">
                <div className="global-search-v41-group-title">
                  <strong>데이터 항목</strong>
                  <span>{results.length}개 우선 결과</span>
                </div>
                <div className="global-search-v41-list">
                  {results.map(({ catalogItem, measureLabels }) => {
                    const downloadStatus = publicDownloadStatusV128(catalogItem);
                    return (
                      <article
                        className="global-search-v128-result"
                        key={catalogItem.elementId}
                        data-element-id={catalogItem.elementId}
                      >
                        <button
                          type="button"
                          className="global-search-v41-result"
                          onClick={() =>
                            closeAnd(() =>
                              onOpenElement(catalogItem.elementId, countryIso3)
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
                            <strong>{publicItemNameV164(catalogItem)}</strong>
                            <small>
                              {searchResultLineV164(measureLabels, catalogItem.groupLabel)}
                              {` · ${publicReferencePeriodV128(catalogItem)}`}
                            </small>
                          </span>
                          <span aria-hidden="true">→</span>
                        </button>
                        <div className="global-search-v128-result__meta">
                          <span
                            data-public-status={publicDataStatusKeyV128(
                              catalogItem.publicStatus
                            )}
                          >
                            {publicDataStatusLabelV128(
                              catalogItem.publicStatus
                            )}
                          </span>
                          <span data-download-status={downloadStatus.key}>
                            {downloadStatus.label}
                          </span>
                          {catalogItem.hasMapData && (
                            <button
                              type="button"
                              onClick={() =>
                                closeAnd(() =>
                                  onOpenMapElement(catalogItem.elementId, countryIso3)
                                )
                              }
                            >
                              지도에서 보기
                            </button>
                          )}
                          {downloadStatus.key === "downloadable" && (
                            <button
                              type="button"
                              onClick={() =>
                                closeAnd(() =>
                                  onOpenDownload(catalogItem.elementId, countryIso3)
                                )
                              }
                            >
                              다운로드
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            {!loading && !loadError && results.length === 0 && (
              <div className="global-search-v41-empty global-search-v41-no-result">
                <strong>바로 일치하는 데이터가 없습니다</strong>
                <p>검색어를 줄이거나 데이터 찾기에서 필터를 조정해 주세요.</p>
              </div>
            )}

            <div className="global-search-v41-footer">
              <button
                type="button"
                className="global-search-v41-all-button"
                onClick={() =>
                  closeAnd(() => onExploreSearch(query.trim(), countryIso3, null))
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
