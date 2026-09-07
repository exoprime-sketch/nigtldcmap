import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { View } from "../app/navigation";
import { CATEGORIES } from "../data/publicTaxonomy";
import {
  loadVietnamPublicOverviewV128,
  publicReferencePeriodV128,
} from "../data/publicPlatformV128";
import type { VietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import type { CategoryCode } from "../data/publicTaxonomy";
import {
  PublicTermExpandedTextV134,
  PublicTermTextV134,
} from "../components/help/PublicTermV134";
import "../styles/home-final-v13.css";
import "../styles/user-facing-v37.css";
import "../styles/benchmark-ux-v39.css";

interface HomePageProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectCategory: (category: CategoryCode) => void;
  onOpenElement: (elementId: string, countryIso3: string) => void;
  onNavigate: (view: View) => void;
}

export default function HomePage({
  query,
  onQueryChange,
  onSubmit,
  onSelectCategory,
  onOpenElement,
  onNavigate,
}: HomePageProps) {
  const [overview, setOverview] = useState<VietnamPublicOverviewV128 | null>(
    null
  );
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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-user-v37 home-public-v128" data-v128-home>
      <section className="home-final-v13" aria-labelledby="home-v128-title">
        <div className="home-final-grid">
          <div className="home-final-copy">
            <span className="home-final-eyebrow">기후기술 협력 데이터</span>
            <h1 id="home-v128-title">개도국 기후기술 협력 플랫폼</h1>
            <p>
              기후기술 협력에 필요한 정책·에너지·기후·사업·재원 데이터를
              검색하고 지도와 차트로 확인하세요.
            </p>
            <p className="home-final-scope">현재 제공 국가 · 베트남</p>

            <form
              className="home-final-search"
              onSubmit={onSubmit}
              role="search"
            >
              <label className="sr-only" htmlFor="home-search">
                데이터명, 항목, 기술, 기관, 사업 또는 지역 검색
              </label>
              <input
                id="home-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="어떤 데이터를 찾으시나요?"
              />
              <button type="submit" className="primary-button">
                데이터 찾기
              </button>
            </form>

            <div className="home-final-suggestions" aria-label="빠른 검색">
              <span>빠른 검색</span>
              {["GDP", "송전망", "산림손실", "재생에너지", "기후재원"].map(
                (example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => onQueryChange(example)}
                  >
                    <PublicTermExpandedTextV134 text={example} />
                  </button>
                )
              )}
            </div>

            <div
              className="home-final-actions home-actions-v37"
              aria-label="주요 기능"
            >
              <button type="button" onClick={() => onNavigate("explorer")}>
                <strong>데이터 찾기</strong>
                <span>주제·기관·기술별 데이터 검색</span>
              </button>
              <button type="button" onClick={() => onNavigate("map")}>
                <strong>데이터 지도</strong>
                <span>지역·시설·사업 위치와 분포 비교</span>
              </button>
              <button type="button" onClick={() => onNavigate("download")}>
                <strong>데이터 다운로드</strong>
                <span>
                  <PublicTermTextV134 text="필요한 데이터를 CSV·JSON으로 다운로드" />
                </span>
              </button>
            </div>

            <div
              className="home-category-chips home-category-chips-v37"
              aria-label="주제별 데이터"
            >
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

          <aside className="home-featured-panel" aria-label="주요 데이터">
            <div className="home-featured-heading">
              <div>
                <strong>주요 데이터</strong>
              </div>
              <button type="button" onClick={() => onNavigate("explorer")}>
                데이터 목록 →
              </button>
            </div>

            {overview ? (
              <div className="home-featured-list">
                {overview.featured.map((item, index) => (
                  <button
                    key={item.elementId}
                    type="button"
                    data-element-id={item.elementId}
                    onClick={() => onOpenElement(item.elementId, "VNM")}
                  >
                    <span className="home-featured-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="home-featured-copy">
                      <strong><PublicTermExpandedTextV134 text={item.publicTitle} /></strong>
                      <small>
                        <PublicTermExpandedTextV134 text={item.sourceOrganizations[0] || "제공기관 확인"} /> ·{" "}
                        {publicReferencePeriodV128(item)}
                      </small>
                    </span>
                    <span className="home-featured-open" aria-hidden="true">
                      데이터 보기 →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="home-v128-loading" role="status">
                {loadError
                  ? "데이터 현황을 불러오지 못했습니다. 데이터 찾기에서 다시 확인해 주세요."
                  : "베트남 데이터 현황을 불러오는 중입니다"}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section
        className="home-v128-overview"
        aria-labelledby="home-v128-status"
      >
        <div className="home-v128-overview__inner">
          <div className="home-v128-overview__heading">
            <div>
              <h2 id="home-v128-status">데이터 현황</h2>
            </div>
            <button type="button" onClick={() => onNavigate("guide")}>
              데이터 이용안내 →
            </button>
          </div>
          <dl className="home-v128-stats" aria-live="polite">
            <div>
              <dt>데이터</dt>
              <dd>{overview ? `${overview.frameworkElementCount}개` : "—"}</dd>
            </div>
            <div>
              <dt>지도 데이터</dt>
              <dd>{overview ? `${overview.mapLayerCount}개` : "—"}</dd>
            </div>
            <div>
              <dt>다운로드 가능</dt>
              <dd>
                {overview ? `${overview.downloadableElementCount}개` : "—"}
              </dd>
            </div>
            <div>
              <dt>최근 업데이트</dt>
              <dd>{overview?.releaseDate ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
