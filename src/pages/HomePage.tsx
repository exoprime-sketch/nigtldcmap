import type { FormEvent } from "react";
import type { View } from "../app/navigation";
import { DATASETS } from "../data/publicDatasets";
import { CATEGORIES } from "../data/publicTaxonomy";
import type { CategoryCode } from "../data/publicTaxonomy";
import {
  getDatasetStatusDisplay,
  isDatasetPubliclyVisible,
} from "../utils/datasetAccess";
import "../styles/home-final-v13.css";
import "../styles/user-facing-v37.css";
import "../styles/benchmark-ux-v39.css";

interface HomePageProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectCategory: (category: CategoryCode) => void;
  onOpenDataset: (datasetId: string) => void;
  onNavigate: (view: View) => void;
}

export default function HomePage({
  query,
  onQueryChange,
  onSubmit,
  onSelectCategory,
  onOpenDataset,
  onNavigate,
}: HomePageProps) {
  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);
  const preferredDatasets = publicDatasets.filter(
    (dataset) => dataset.featured && dataset.publicationStatus === "published"
  );
  const secondaryDatasets = publicDatasets.filter(
    (dataset) =>
      !preferredDatasets.some((preferred) => preferred.id === dataset.id)
  );
  const featuredDatasets = [...preferredDatasets, ...secondaryDatasets].slice(
    0,
    2
  );

  return (
    <section className="home-final-v13 home-user-v37">
      <div className="home-final-grid">
        <div className="home-final-copy">
          <span className="home-final-eyebrow">기후기술 협력 데이터</span>
          <h1>개도국 기후기술 협력 플랫폼</h1>
          <p>
            국가와 기후기술을 기준으로
            수요·적용여건·정책·기존사업·기관·지역·인허가 근거를 검색하고
            협력사업 검토에 활용
          </p>

          <form className="home-final-search" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="home-search">
              데이터 검색
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="국가, 기후기술, 지표, 정책, 사업 또는 기관 검색"
            />
            <button type="submit" className="primary-button">
              데이터 찾기
            </button>
          </form>

          <div className="home-final-suggestions" aria-label="빠른 검색">
            <span>빠른 검색</span>
            {["베트남", "태양광", "전력망", "NDC", "GCF"].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onQueryChange(example)}
              >
                {example}
              </button>
            ))}
          </div>

          <div
            className="home-final-actions home-actions-v37"
            aria-label="주요 기능"
          >
            <button type="button" onClick={() => onNavigate("explorer")}>
              <strong>근거 데이터 찾기</strong>
              <span>국가·기후기술·주제·출처 기준 탐색 →</span>
            </button>
            <button type="button" onClick={() => onNavigate("map")}>
              <strong>지도에서 확인</strong>
              <span>국가·지역별 데이터 확인 →</span>
            </button>
            <button type="button" onClick={() => onNavigate("download")}>
              <strong>데이터 다운로드</strong>
              <span>국가·데이터·기간을 선택하여 내려받기 →</span>
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
              전체 보기 →
            </button>
          </div>

          <div className="home-featured-list">
            {featuredDatasets.map((dataset, index) => {
              const status = getDatasetStatusDisplay(dataset);
              return (
                <button
                  key={dataset.id}
                  type="button"
                  onClick={() => onOpenDataset(dataset.id)}
                >
                  <span className="home-featured-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="home-featured-copy">
                    <strong>{dataset.titleKo}</strong>
                    <small>
                      {dataset.sourceOrganization} · {dataset.referenceYear}
                    </small>
                  </span>
                  <span className={`home-featured-status ${status.className}`}>
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="home-featured-note">
            출처·기준시점·단위·이용조건까지 상세 확인
          </p>
        </aside>
      </div>
    </section>
  );
}
