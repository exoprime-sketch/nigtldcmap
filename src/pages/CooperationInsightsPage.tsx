import { useMemo } from "react";
import CooperationInsightEvidenceV36 from "../components/insights/CooperationInsightEvidenceV36";
import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import { copyCurrentUrl } from "../utils/browser";
import { getTechnologyFilterGroups } from "../utils/technologyData";
import "../styles/cooperation-insights-v36.css";
import "../styles/user-facing-v37.css";
import "../styles/cooperation-planning-v38.css";
import "../styles/benchmark-ux-v39.css";

interface CooperationInsightsPageProps {
  countryIso3: string | null;
  technologyId: string;
  onCountryChange: (iso3: string | null) => void;
  onTechnologyChange: (technologyId: string) => void;
  onOpenCountry: (iso3: string) => void;
  onOpenMap: (iso3: string) => void;
  onOpenDataset: (datasetId: string) => void;
  onExploreDatasets: (countryIso3: string, technologyId: string) => void;
}

export default function CooperationInsightsPage({
  countryIso3,
  technologyId,
  onCountryChange,
  onTechnologyChange,
  onOpenCountry,
  onOpenMap,
  onOpenDataset,
  onExploreDatasets,
}: CooperationInsightsPageProps) {
  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);
  const selectedCountry =
    PRIORITY_COUNTRIES.find((country) => country.iso3 === countryIso3) ?? null;
  const selectedTechnology =
    CLIMATE_TECHNOLOGIES.find((technology) => technology.id === technologyId) ??
    null;

  const ready = Boolean(selectedCountry && selectedTechnology);

  return (
    <div className="page-shell insight-v36-page insight-user-v37">
      <header className="insight-v36-hero">
        <div>
          <span className="eyebrow dark">기후기술 협력 사업기획</span>
          <h1>협력 인사이트</h1>
          <p>
            국가와 기후기술을 선택해 확인된 근거·정보공백·다음 확인항목을
            사업기획 순서로 검토
          </p>
        </div>

        <div className="insight-v36-principle">
          <strong>확인 기준</strong>
          <span>플랫폼에 연결된 공개 근거만 사용</span>
          <span>확인된 정보와 추가 확인사항 구분</span>
          <span>검토 요약을 복사·인쇄해 회의·사업기획 메모로 활용</span>
        </div>
      </header>

      <section className="insight-v36-selector" aria-label="협력 검토 조건">
        <div className="insight-v36-selector-copy">
          <span>검토 조건</span>
          <strong>
            {ready
              ? `${selectedCountry?.nameKo} × ${selectedTechnology?.nameKo}`
              : "국가와 기후기술 선택 필요"}
          </strong>
          <small>
            {ready
              ? `${
                  selectedTechnology?.category
                } · ${selectedTechnology?.relatedSectors
                  .slice(0, 4)
                  .join(" · ")}`
              : "두 조건을 선택하면 관련 근거와 추가 확인사항을 자동 구성"}
          </small>
        </div>

        <div className="insight-v36-selector-controls">
          <label>
            <span>협력대상국</span>
            <select
              value={selectedCountry?.iso3 ?? ""}
              onChange={(event) => onCountryChange(event.target.value || null)}
            >
              <option value="">국가 선택</option>
              {PRIORITY_COUNTRIES.map((country) => (
                <option key={country.iso3} value={country.iso3}>
                  {country.nameKo}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>기후기술</span>
            <select
              value={selectedTechnology?.id ?? ""}
              onChange={(event) =>
                onTechnologyChange(event.target.value || "all")
              }
            >
              <option value="">기후기술 선택</option>
              {technologyGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.technologies.map((technology) => (
                    <option key={technology.id} value={technology.id}>
                      {technology.nameKo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="insight-v36-selector-actions">
          <button
            type="button"
            className="secondary-button insight-v39-share"
            disabled={!ready}
            onClick={copyCurrentUrl}
          >
            현재 검토조건 공유
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!selectedCountry}
            onClick={() =>
              selectedCountry && onOpenCountry(selectedCountry.iso3)
            }
          >
            국가 프로필 보기
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!ready}
            onClick={() =>
              ready &&
              onExploreDatasets(selectedCountry!.iso3, selectedTechnology!.id)
            }
          >
            관련 데이터 전체 보기
          </button>
        </div>
      </section>

      {ready ? (
        <CooperationInsightEvidenceV36
          countryIso3={selectedCountry!.iso3}
          technologyId={selectedTechnology!.id}
          onOpenDataset={onOpenDataset}
          onOpenMap={onOpenMap}
          onExploreDatasets={onExploreDatasets}
        />
      ) : (
        <section className="insight-v37-start" aria-live="polite">
          <div>
            <span>협력 검토 시작</span>
            <h2>국가와 기후기술을 선택</h2>
            <p>
              선택 후 현지 수요 근거 · 기술 적용여건 · NDC·정책 · 기존 사업·재원
              · 관련 기관·지역 · 추가 확인사항 · 사용 근거를 한 흐름으로 확인
            </p>
          </div>
          <ol>
            <li>협력대상국 선택</li>
            <li>검토할 기후기술 선택</li>
            <li>확인된 근거와 현재 정보공백 검토</li>
            <li>필요한 상세 데이터와 원 데이터 확인</li>
          </ol>
        </section>
      )}
    </div>
  );
}
