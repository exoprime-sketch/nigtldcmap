import { lazy, Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { View } from "../app/navigation";
import { loadVietnamPublicOverviewV128, publicDownloadStatusV128 } from "../data/publicPlatformV128";
import type { VietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import { loadCardSummariesV140, type CardSummaryV140 } from "../data/cardSummariesV140";
import { mapDatasetIdsV149, usePublicUsageV149 } from "../data/publicUsageV149";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125, type DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import { PublicTermTextV134 } from "../components/help/PublicTermV134";
import { getCardSpecV159 } from "../data/spec/datasetSpecV159";
import { DISPLAY_TYPE_MARKS_V159, type DisplayTypeV159 } from "../data/spec/specTypesV159";
import { getTierV160, HOME_QUESTIONS_V160 } from "../data/spec/coreFirstV160";
import "../styles/home-final-v13.css";
import "../styles/home-questions-v160.css";
const DetailLocationMapV148 = lazy(() => import("../components/data/public/DetailLocationMapV148"));

interface HomePageProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchExample: (query: string) => void;
  onOpenElement: (elementId: string, countryIso3: string, selection?: DataFinderSelectorStateV125) => void;
  onOpenMapElement: (elementId: string, countryIso3: string, selection?: DataFinderSelectorStateV125) => void;
  onNavigate: (view: View) => void;
  /** V160: open the finder on a question's core datasets. */
  onOpenQuestion: (displayType: DisplayTypeV159) => void;
}
const SEARCH_EXAMPLES_V139 = ["국내총생산", "가뭄", "산림손실", "송전망"];

export default function HomePage({ query, onQueryChange, onSubmit, onSearchExample, onOpenMapElement, onNavigate, onOpenQuestion }: HomePageProps) {
  const [overview, setOverview] = useState<VietnamPublicOverviewV128 | null>(null);
  const [summaries, setSummaries] = useState<Map<string, CardSummaryV140>>(new Map());
  const [loadError, setLoadError] = useState(false);
  const publicCatalogV160 = (overview?.catalog || []).filter(item => getTierV160(item.elementId) !== "hidden");
  const usage = usePublicUsageV149();
  useEffect(() => {
    let cancelled = false;
    void loadVietnamPublicOverviewV128().then(value => { if (!cancelled) setOverview(value); }).catch(() => { if (!cancelled) setLoadError(true); });
    void loadCardSummariesV140().then(value => { if (!cancelled) setSummaries(value); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const topMap = usage?.map.find(item => mapDatasetIdsV149.has(item.elementId));
  const mapElement = topMap?.elementId || "A-024";
  // V159 naming: the dataset's own name (source line apart), as on the finder and detail.
  const mapTitle = getCardSpecV159(mapElement)?.baseName || overview?.catalog.find(item => item.elementId === mapElement)?.publicTitle || "송전망";
  const mapSelection = summaries.get(mapElement)?.selection || EMPTY_DATA_FINDER_SELECTOR_STATE_V125;

  return <div className="home-v139" data-v128-home>
    <section className="home-final-v13 home-hero-v139" aria-labelledby="home-v128-title">
      <div className="home-hero-v139__inner home-hero-v160__inner">
        <div className="home-final-copy">
          <span className="home-final-eyebrow">국가별 기후기술 협력 데이터</span>
          <h1 id="home-v128-title">개도국 기후기술 협력 플랫폼</h1>
          <p>베트남의 정책·에너지·기후위험·사업·협력기관 정보를 검색하세요.</p>
          <p className="home-final-scope">현재 제공 국가 · 베트남</p>
          <form className="home-final-search" onSubmit={onSubmit} role="search">
            <label className="sr-only" htmlFor="home-search">데이터명·지역·기술·기관 검색</label>
            <input id="home-search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="데이터명·지역·기술·기관 검색" />
            <button type="submit" className="primary-button">검색</button>
          </form>
          <div className="home-final-suggestions" aria-label="검색 예시"><span>검색 예시</span>{SEARCH_EXAMPLES_V139.map(example => <button key={example} type="button" onClick={() => onSearchExample(example)} aria-label={example + " 검색 결과 보기"}>{example}</button>)}</div>
        </div>
      </div>
    </section>
    <section className="home-questions-v160" aria-labelledby="home-questions-v160-title" data-testid="home-questions-v160">
      <div className="home-questions-v160__inner">
        <h2 id="home-questions-v160-title">무엇을 알고 싶으신가요?</h2>
        <div className="home-questions-v160__grid">
          {HOME_QUESTIONS_V160.map(question => {
            const kpi = question.heroIndicator ? summaries.get(question.heroIndicator.elementId)?.headline ?? null : null;
            const openLabel = "핵심 데이터 " + question.coreElementIds.length + "개 보기";
            return <article key={question.displayType} className="home-questions-v160__card" data-testid="home-question-v160" data-display-type={question.displayType} aria-labelledby={"home-question-" + question.displayType}>
              <span className="home-questions-v160__mark" aria-hidden="true">{DISPLAY_TYPE_MARKS_V159[question.displayType]}</span>
              <h3 id={"home-question-" + question.displayType}>{question.title}</h3>
              <p className="home-questions-v160__description"><PublicTermTextV134 text={question.description} /></p>
              {kpi && <p className="home-questions-v160__kpi" data-testid="home-question-kpi-v160">
                <strong><PublicTermTextV134 text={kpi.value} /></strong>
                <span><PublicTermTextV134 text={kpi.label} /></span>
              </p>}
              <button type="button" className="home-questions-v160__open" data-testid="home-question-open-v160" onClick={() => onOpenQuestion(question.displayType)} aria-label={question.title + " · " + openLabel}>{openLabel}</button>
            </article>;
          })}
        </div>
        <button type="button" className="home-questions-v160__all" onClick={() => onNavigate("explorer")}>전체 데이터 보기 →</button>
      </div>
    </section>
    <section className="home-status-v139" aria-label="데이터 현황"><dl className="home-status-v139__inner home-v128-stats" aria-live="polite">
      {/* V160: the same counts the finder shows with tier=all - ⓪ (hidden) datasets are not listed. */}
      <div><dt>전체 데이터 항목</dt><dd>{overview ? publicCatalogV160.length + "개" : "—"}</dd></div>
      <div><dt>지도 제공 항목</dt><dd>{overview ? overview.mapLayerCount + "개" : "—"}</dd></div>
      <div><dt>다운로드 가능 항목</dt><dd>{overview ? publicCatalogV160.filter(item => publicDownloadStatusV128(item).key === "downloadable").length + "개" : "—"}</dd></div>
      <div><dt>데이터 기준일</dt><dd>{overview?.releaseDate ?? "—"}</dd></div>
    </dl></section>
    <section className="home-final-v13 home-regional-v160" aria-labelledby="home-regional-heading" data-testid="home-hero-map-v139">
      <div className="home-regional-v160__inner">
        <aside className="home-regional-v149">
          <h2 id="home-regional-heading">주요 지역 데이터</h2>
          {topMap && <p className="home-regional-v149__basis">최근 30일 지도 조회 1위</p>}
          <h3>{mapTitle}</h3>
          <Suspense fallback={<p role="status">지도를 불러오는 중입니다.</p>}>
            <DetailLocationMapV148 key={mapElement} compact elementId={mapElement} countryIso3="VNM" selection={mapSelection} onOpenMap={onOpenMapElement} />
          </Suspense>
        </aside>
      </div>
    </section>
    {loadError && <p role="status" className="home-questions-v160__load-error">데이터를 불러오지 못했습니다. 데이터 찾기에서 다시 확인해 주세요.</p>}
  </div>;
}
