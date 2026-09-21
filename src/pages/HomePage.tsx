import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { View } from "../app/navigation";
import { loadVietnamPublicOverviewV128, publicReferencePeriodV128 } from "../data/publicPlatformV128";
import type { VietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import { loadCardSummariesV140, type CardSummaryV140 } from "../data/cardSummariesV140";
import { datasetDatesV149, mapDatasetIdsV149, sortHomeItemsV149, usePublicUsageV149 } from "../data/publicUsageV149";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125, type DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import FinderCardSummaryV140 from "../components/catalog/FinderCardSummaryV140";
import { PublicTermTextV134 } from "../components/help/PublicTermV134";
import "../styles/home-final-v13.css";
const DetailLocationMapV148 = lazy(() => import("../components/data/public/DetailLocationMapV148"));

interface HomePageProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchExample: (query: string) => void;
  onOpenElement: (elementId: string, countryIso3: string, selection?: DataFinderSelectorStateV125) => void;
  onOpenMapElement: (elementId: string, countryIso3: string, selection?: DataFinderSelectorStateV125) => void;
  onNavigate: (view: View) => void;
}
const SEARCH_EXAMPLES_V139 = ["국내총생산", "가뭄", "산림손실", "송전망"];

export default function HomePage({ query, onQueryChange, onSubmit, onSearchExample, onOpenElement, onOpenMapElement, onNavigate }: HomePageProps) {
  const [overview, setOverview] = useState<VietnamPublicOverviewV128 | null>(null);
  const [summaries, setSummaries] = useState<Map<string, CardSummaryV140>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const [sort, setSort] = useState<"views" | "latest">("views");
  const usage = usePublicUsageV149();
  useEffect(() => {
    let cancelled = false;
    void loadVietnamPublicOverviewV128().then(value => { if (!cancelled) setOverview(value); }).catch(() => { if (!cancelled) setLoadError(true); });
    void loadCardSummariesV140().then(value => { if (!cancelled) setSummaries(value); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const hasViews = Boolean(usage?.detail.length);
  const items = useMemo(() => {
    if (!overview) return [];
    // Cold start uses the reviewed selection, never invented popularity.
    if (sort === "views" && !hasViews) return overview.featured;
    return sortHomeItemsV149(overview.catalog.filter(item => item.hasPublicData), sort, usage?.detail || []).slice(0,8);
  }, [overview, sort, hasViews, usage]);
  const topMap = usage?.map.find(item => mapDatasetIdsV149.has(item.elementId));
  const mapElement = topMap?.elementId || "A-024";
  const mapTitle = overview?.catalog.find(item => item.elementId === mapElement)?.publicTitle || "송전망";
  const mapSelection = summaries.get(mapElement)?.selection || EMPTY_DATA_FINDER_SELECTOR_STATE_V125;

  return <div className="home-v139" data-v128-home>
    <section className="home-final-v13 home-hero-v139" aria-labelledby="home-v128-title">
      <div className="home-hero-v139__inner">
        <div className="home-final-copy home-hero-v139__copy">
          <span className="home-final-eyebrow">국가별 기후기술 협력 데이터</span>
          <h1 id="home-v128-title">개도국 기후기술 협력 플랫폼</h1>
          <p>베트남의 정책·에너지·기후위험·사업·협력기관 정보를 검색하고, 지역별 분포와 변화를 확인하세요.</p>
          <p className="home-final-scope">현재 제공 국가 · 베트남</p>
          <form className="home-final-search" onSubmit={onSubmit} role="search">
            <label className="sr-only" htmlFor="home-search">데이터명·지역·기술·기관 검색</label>
            <input id="home-search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="데이터명·지역·기술·기관 검색" />
            <button type="submit" className="primary-button">검색</button>
          </form>
          <div className="home-final-suggestions" aria-label="검색 예시"><span>검색 예시</span>{SEARCH_EXAMPLES_V139.map(example => <button key={example} type="button" onClick={() => onSearchExample(example)} aria-label={example + " 검색 결과 보기"}>{example}</button>)}</div>
        </div>
        <aside className="home-regional-v149" aria-labelledby="home-regional-heading" data-testid="home-hero-map-v139">
          <h2 id="home-regional-heading">주요 지역 데이터</h2>
          {topMap && <p className="home-regional-v149__basis">최근 30일 지도 조회 1위</p>}
          <h3>{mapTitle}</h3>
          <Suspense fallback={<p role="status">지도를 불러오는 중입니다.</p>}>
            <DetailLocationMapV148 key={mapElement} compact elementId={mapElement} countryIso3="VNM" selection={mapSelection} onOpenMap={onOpenMapElement} />
          </Suspense>
        </aside>
      </div>
    </section>
    <section className="home-status-v139" aria-label="데이터 현황"><dl className="home-status-v139__inner home-v128-stats" aria-live="polite">
      <div><dt>전체 데이터 항목</dt><dd>{overview ? overview.frameworkElementCount + "개" : "—"}</dd></div>
      <div><dt>지도 제공 항목</dt><dd>{overview ? overview.mapLayerCount + "개" : "—"}</dd></div>
      <div><dt>다운로드 가능 항목</dt><dd>{overview ? overview.downloadableElementCount + "개" : "—"}</dd></div>
      <div><dt>데이터 기준일</dt><dd>{overview?.releaseDate ?? "—"}</dd></div>
    </dl></section>
    <section className="home-featured-v139" aria-labelledby="home-featured-title"><div className="home-featured-v139__inner">
      <div className="home-featured-heading home-featured-v139__heading">
        <h2 id="home-featured-title">주요 데이터</h2>
        <div className="home-sort-v149" role="group" aria-label="주요 데이터 정렬">
          <button type="button" aria-pressed={sort === "views"} onClick={() => setSort("views")}>조회순</button>
          <button type="button" aria-pressed={sort === "latest"} onClick={() => setSort("latest")}>최신순</button>
        </div>
        <button type="button" onClick={() => onNavigate("explorer")}>전체 데이터 보기 →</button>
      </div>
      <p className="home-sort-note-v149" role="status">{sort === "latest" ? "플랫폼에 자료가 갱신된 순서입니다. 갱신일이 같으면 데이터명 순으로 표시합니다." : hasViews ? "최근 30일 상세보기 조회순입니다. 같은 이용자의 30분 이내 반복 조회는 한 번만 집계합니다." : "조회 집계가 준비되면 조회순으로 표시합니다. 현재는 주요 자료를 안내합니다."}</p>
      {overview ? <div className="home-featured-list home-featured-v139__grid">
        {items.map(item => {
          const card = summaries.get(item.elementId);
          const date = datasetDatesV149.get(item.elementId);
          return <article key={item.elementId} className="home-featured-v139__card" data-element-id={item.elementId} aria-labelledby={"home-card-" + item.elementId}>
            <h3 id={"home-card-" + item.elementId}><PublicTermTextV134 text={item.publicTitle} /></h3>
            {card && <FinderCardSummaryV140 summary={card} />}
            <dl className="home-featured-v139__meta">
              <div><dt>자료기간</dt><dd><PublicTermTextV134 text={card?.period || publicReferencePeriodV128(item)} /></dd></div>
              <div><dt>제공기관</dt><dd><PublicTermTextV134 text={card?.provider || item.sourceOrganizations.join(" · ")} /></dd></div>
              {sort === "latest" && date && <div><dt>갱신일</dt><dd><time dateTime={date}>{new Date(date).toLocaleDateString("ko-KR", {timeZone:"Asia/Seoul"})}</time></dd></div>}
            </dl>
            <button type="button" className="home-featured-v139__open" data-testid="home-card-open-v140" onClick={() => onOpenElement(item.elementId, "VNM", card?.selection || undefined)} aria-label={item.publicTitle + " 상세보기"}>상세보기 →</button>
          </article>;
        })}
      </div> : <div className="home-v128-loading" role="status">{loadError ? "데이터를 불러오지 못했습니다. 데이터 찾기에서 다시 확인해 주세요." : "데이터를 불러오는 중입니다."}</div>}
    </div></section>
  </div>;
}
