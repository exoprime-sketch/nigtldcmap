import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { View } from "../app/navigation";
import { CATEGORIES } from "../data/publicTaxonomy";
import {
  loadVietnamPublicOverviewV128,
  publicReferencePeriodV128,
} from "../data/publicPlatformV128";
import type { VietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import { loadHomePreviewV139, homePreviewSvgUrlV139 } from "../data/homePreviewV139";
import type { HomePreviewCardV139, HomePreviewV139 } from "../data/homePreviewV139";
import type { CategoryCode } from "../data/publicTaxonomy";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import HomePreviewChartV139 from "../components/home/HomePreviewChartV139";
import { PublicTermTextV134 } from "../components/help/PublicTermV134";
import "../styles/home-final-v13.css";

interface HomePageProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Runs a search for the given words and opens the results. */
  onSearchExample: (query: string) => void;
  onSelectCategory: (category: CategoryCode) => void;
  onOpenElement: (
    elementId: string,
    countryIso3: string,
    selection?: DataFinderSelectorStateV125
  ) => void;
  onOpenMapElement: (elementId: string, countryIso3: string) => void;
  onNavigate: (view: View) => void;
}

/**
 * Words a visitor can start with. Each opens the real search results for
 * that word; none of them merely fills the box.
 */
const SEARCH_EXAMPLES_V139 = ["국내총생산", "가뭄", "산림손실", "송전망"];

export default function HomePage({
  query,
  onQueryChange,
  onSubmit,
  onSearchExample,
  onSelectCategory,
  onOpenElement,
  onOpenMapElement,
  onNavigate,
}: HomePageProps) {
  const [overview, setOverview] = useState<VietnamPublicOverviewV128 | null>(
    null
  );
  const [preview, setPreview] = useState<HomePreviewV139 | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadVietnamPublicOverviewV128()
      .then((value) => {
        if (!cancelled) setOverview(value);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    // The preview asset is optional: without it the cards still list the
    // datasets, with no chart.
    void loadHomePreviewV139()
      .then((value) => {
        if (!cancelled) setPreview(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const cardById = new Map<string, HomePreviewCardV139>(
    (preview?.cards || []).map((card) => [card.elementId, card])
  );
  const heroMap = preview?.map ?? null;

  return (
    <div className="home-v139" data-v128-home>
      <section className="home-final-v13 home-hero-v139" aria-labelledby="home-v128-title">
        <div className="home-hero-v139__inner">
          <div className="home-final-copy home-hero-v139__copy">
            <span className="home-final-eyebrow">국가별 기후기술 협력 데이터</span>
            <h1 id="home-v128-title">개도국 기후기술 협력 플랫폼</h1>
            <p>
              베트남의 정책·에너지·기후위험·사업·협력기관 정보를 검색하고,
              지역별 분포와 변화를 확인하세요.
            </p>
            <p className="home-final-scope">현재 제공 국가 · 베트남</p>

            <form
              className="home-final-search"
              onSubmit={onSubmit}
              role="search"
            >
              <label className="sr-only" htmlFor="home-search">
                데이터명·지역·기술·기관 검색
              </label>
              <input
                id="home-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="데이터명·지역·기술·기관 검색"
              />
              <button type="submit" className="primary-button">
                검색
              </button>
            </form>

            <div className="home-final-suggestions" aria-label="검색 예시">
              <span>검색 예시</span>
              {SEARCH_EXAMPLES_V139.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => onSearchExample(example)}
                  aria-label={`${example} 검색 결과 보기`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* One verified map, pre-rendered from the delivered 2016 line
              geometry on the 63 boundaries. The map engine is not loaded
              here; the link opens the same dataset in the data map. */}
          <figure className="home-hero-v139__map" data-testid="home-hero-map-v139">
            {heroMap ? (
              <>
                <img
                  className="home-hero-v139__map-image"
                  src={homePreviewSvgUrlV139(heroMap.svgUrl)}
                  alt={`베트남 63개 성·시 경계 위에 2016년 송전선 ${heroMap.segments.toLocaleString("ko-KR")}개 구간을 전압별 색으로 그린 지도`}
                  width={340}
                  height={640}
                  decoding="async"
                />
                <figcaption>
                  <strong>{heroMap.title}</strong>
                  <span>{heroMap.subtitle}</span>
                  <ul className="home-hero-v139__legend" aria-label="전압별 구간 수">
                    {heroMap.legend.map((item) => (
                      <li key={item.kv}>
                        <i style={{ background: item.color }} aria-hidden="true" />
                        <PublicTermTextV134 text={`${item.kv} kV · ${item.segments.toLocaleString("ko-KR")}구간`} />
                      </li>
                    ))}
                  </ul>
                  <small>출처 {heroMap.provider}</small>
                  <button
                    type="button"
                    className="home-hero-v139__map-link"
                    data-testid="home-hero-map-link-v139"
                    onClick={() => onOpenMapElement(heroMap.elementId, "VNM")}
                  >
                    이 자료 지도에서 보기 →
                  </button>
                </figcaption>
              </>
            ) : (
              <div className="home-hero-v139__map-placeholder" role="status">
                지도 미리보기를 불러오는 중입니다
              </div>
            )}
          </figure>
        </div>
      </section>

      {/* Four facts derived from the manifest, catalogue and map index, in one
          line: how many items the framework has, how many the map draws, how
          many can be downloaded, and the day the data copy was taken (not the
          day the code was deployed). */}
      <section className="home-status-v139" aria-label="데이터 현황">
        <dl className="home-status-v139__inner home-v128-stats" aria-live="polite">
          <div>
            <dt>전체 데이터 항목</dt>
            <dd>{overview ? `${overview.frameworkElementCount}개` : "—"}</dd>
          </div>
          <div>
            <dt>지도 제공 항목</dt>
            <dd>{overview ? `${overview.mapLayerCount}개` : "—"}</dd>
          </div>
          <div>
            <dt>다운로드 가능 항목</dt>
            <dd>{overview ? `${overview.downloadableElementCount}개` : "—"}</dd>
          </div>
          <div>
            <dt>데이터 기준일</dt>
            <dd>{overview?.releaseDate ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="home-featured-v139" aria-labelledby="home-featured-title">
        <div className="home-featured-v139__inner">
          <div className="home-featured-heading home-featured-v139__heading">
            <h2 id="home-featured-title">주요 데이터</h2>
            <button type="button" onClick={() => onNavigate("explorer")}>
              전체 데이터 보기 →
            </button>
          </div>

          {overview ? (
            <div className="home-featured-list home-featured-v139__grid">
              {overview.featured.map((item) => {
                const card = cardById.get(item.elementId) ?? null;
                return (
                  <article
                    key={item.elementId}
                    className="home-featured-v139__card"
                    data-element-id={item.elementId}
                    data-preview-kind={card?.kind ?? "none"}
                    aria-labelledby={`home-card-${item.elementId}`}
                  >
                    {/* V140: the same title, from the same catalogue field and
                        the same component, as the finder card - so a reader
                        who leaves the home finds the dataset under the name
                        they saw. */}
                    <h3 id={`home-card-${item.elementId}`}>
                      <PublicTermTextV134 text={item.publicTitle} />
                    </h3>
                    {card ? (
                      <>
                        <p className="home-featured-v139__question">
                          <PublicTermTextV134 text={card.question} />
                        </p>
                        <p className="home-featured-v139__headline" data-testid="home-card-headline-v140">
                          <strong><PublicTermTextV134 text={card.headline.value} /></strong>
                          <span><PublicTermTextV134 text={card.headline.label} /></span>
                        </p>
                        <div className="home-featured-v139__chart">
                          <HomePreviewChartV139 card={card} />
                        </div>
                        <dl className="home-featured-v139__meta">
                          <div>
                            <dt>기간</dt>
                            <dd><PublicTermTextV134 text={card.period} /></dd>
                          </div>
                          <div>
                            <dt>제공</dt>
                            <dd>
                              <PublicTermTextV134 text={card.provider} />
                            </dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <dl className="home-featured-v139__meta">
                        <div>
                          <dt>기간</dt>
                          <dd>{publicReferencePeriodV128(item)}</dd>
                        </div>
                        <div>
                          <dt>제공</dt>
                          <dd>
                            <PublicTermTextV134
                              text={item.sourceOrganizations.slice(0, 2).join(" · ") || "제공기관 확인"}
                            />
                          </dd>
                        </div>
                      </dl>
                    )}
                    <button
                      type="button"
                      className="home-featured-v139__open"
                      data-testid="home-card-open-v140"
                      onClick={() => onOpenElement(item.elementId, "VNM", card?.selection)}
                      aria-label={`${item.publicTitle} 상세보기`}
                    >
                      상세보기 →
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="home-v128-loading" role="status">
              {loadError
                ? "데이터 현황을 불러오지 못했습니다. 데이터 찾기에서 다시 확인해 주세요."
                : "베트남 데이터 현황을 불러오는 중입니다"}
            </div>
          )}
        </div>
      </section>

      <section className="home-topics-v139" aria-labelledby="home-topics-title">
        <div className="home-topics-v139__inner">
          <h2 id="home-topics-title">주제별 데이터</h2>
          <p>주제를 고르면 데이터 찾기에 그 분류 필터가 적용됩니다.</p>
          <div className="home-category-chips home-topics-v139__chips">
            {CATEGORIES.map((category) => (
              <button
                key={category.code}
                type="button"
                onClick={() => onSelectCategory(category.code)}
              >
                {category.nameKo}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
