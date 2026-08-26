import { useEffect, useMemo, useState } from "react";
import PageJumpNavV39 from "../components/common/PageJumpNavV39";
import CountryTechnologyEvidencePanel from "../components/country/CountryTechnologyEvidencePanel";
import NdcPolicyPanel from "../components/ndc/NdcPolicyPanel";
import { CLIMATE_TECHNOLOGY_BY_ID } from "../data/climateTechnologyCatalog";
import { loadCountries } from "../data/countries";
import {
  createGcfPortfolioIndex,
  formatUsd,
  loadGcfCountryPortfolio,
} from "../data/gcf/gcfCountryPortfolio";
import {
  INDICATOR_CONFIGS,
  formatIndicatorReferencePeriod,
  formatRawValue,
  getLatestObservationForCountry,
  loadIndicatorData,
} from "../data/indicators/registry";
import type { IndicatorId } from "../data/indicators/registry";
import { DATASETS } from "../data/publicDatasets";
import { CATEGORIES } from "../data/publicTaxonomy";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import type { Country } from "../types/country";
import type {
  GcfCountryPortfolio,
  GcfCountryPortfolioRecord,
} from "../types/gcf";
import type {
  IndicatorDataResult,
  IndicatorObservation,
} from "../types/indicator";
import {
  datasetCoversCountry,
  isDatasetPubliclyVisible,
} from "../utils/datasetAccess";
import {
  getTechnologyDatasetCount,
  getTechnologyFilterGroups,
} from "../utils/technologyData";
import "../styles/country-profile-v16.css";
import "../styles/country-profile-v34.css";
import "../styles/climate-risk-v25.css";
import "../styles/solar-potential-v26.css";
import "../styles/data-types-v27.css";
import "../styles/benchmark-ux-v39.css";

interface CountryProfilePageProps {
  iso3: string | null;
  technologyId: string;
  onTechnologyChange: (technologyId: string) => void;
  onBack: () => void;
  onOpenDataset: (datasetId: string) => void;
  onExploreDatasets: (countryIso3: string, technologyId: string) => void;
  onOpenCompare: (iso3: string) => void;
  onOpenMap: (iso3: string) => void;
}

type ResultMap = Partial<Record<IndicatorId, IndicatorDataResult>>;

interface IndicatorFact {
  id: IndicatorId;
  datasetId: string;
  title: string;
  value: string;
  reference: string;
  source: string;
  sourceUrl?: string;
  description: string;
  limitations?: string;
  available: boolean;
}

const CATEGORY_NAME_BY_CODE = new Map(
  CATEGORIES.map((category) => [category.code, category.nameKo])
);

function createIndicatorFact(
  config: (typeof INDICATOR_CONFIGS)[number],
  latest: IndicatorObservation | null
): IndicatorFact {
  return {
    id: config.id,
    datasetId: config.datasetId,
    title: config.definition.titleKo,
    value: formatRawValue(config, latest?.value ?? null),
    reference: latest
      ? formatIndicatorReferencePeriod(config, latest.year)
      : "자료 없음",
    source: config.definition.sourceOrganization,
    sourceUrl: config.definition.sourceUrl,
    description: config.definition.description,
    limitations: config.definition.limitations,
    available: latest?.value !== null && latest?.value !== undefined,
  };
}

export default function CountryProfilePage({
  iso3,
  technologyId,
  onTechnologyChange,
  onBack,
  onOpenDataset,
  onExploreDatasets,
  onOpenCompare,
  onOpenMap,
}: CountryProfilePageProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [indicatorResults, setIndicatorResults] = useState<ResultMap>({});
  const [gcfPortfolio, setGcfPortfolio] = useState<GcfCountryPortfolio | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [countryResult, gcfResult, ...indicatorData] = await Promise.all([
        loadCountries(),
        loadGcfCountryPortfolio().catch(() => null),
        ...INDICATOR_CONFIGS.map((config) => loadIndicatorData(config.id)),
      ]);

      if (cancelled) return;

      const nextResults: ResultMap = {};
      INDICATOR_CONFIGS.forEach((config, index) => {
        nextResults[config.id] = indicatorData[index];
      });

      setCountries(countryResult.countries);
      setGcfPortfolio(gcfResult);
      setIndicatorResults(nextResults);
      setWarning(
        [
          countryResult.warning,
          gcfResult ? null : "GCF 국가 포트폴리오 연결 실패 · 관련 값 제외",
          ...indicatorData.map((result) => result.warning),
        ]
          .filter(Boolean)
          .join(" · ") || null
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const country = useMemo(
    () => countries.find((item) => item.iso3 === iso3) ?? null,
    [countries, iso3]
  );

  const relatedDatasets = useMemo(() => {
    if (!country) return [];
    return DATASETS.filter(
      (dataset) =>
        isDatasetPubliclyVisible(dataset) &&
        datasetCoversCountry(dataset, country.nameKo, country.nameEn)
    );
  }, [country]);

  const indicatorFacts = useMemo<IndicatorFact[]>(() => {
    if (!iso3) return [];
    return INDICATOR_CONFIGS.map((config) => {
      const result = indicatorResults[config.id];
      const latest = result
        ? getLatestObservationForCountry(result.observations, iso3)
        : null;
      return createIndicatorFact(config, latest);
    });
  }, [indicatorResults, iso3]);

  const indicatorMetrics = useMemo(
    () =>
      Object.fromEntries(
        indicatorFacts.map((fact) => [
          fact.datasetId,
          {
            datasetId: fact.datasetId,
            title: fact.title,
            value: fact.value,
            reference: fact.reference,
            source: fact.source,
            available: fact.available,
          },
        ])
      ),
    [indicatorFacts]
  );

  const selectedTechnology =
    technologyId === "all"
      ? null
      : CLIMATE_TECHNOLOGY_BY_ID.get(technologyId) ?? null;

  const selectedTechnologyDatasetIds = useMemo(() => {
    if (!country || !selectedTechnology) return new Set<string>();

    return new Set(
      DATASET_TECHNOLOGY_LINKS.filter(
        (link) =>
          link.discoverable &&
          link.technologyId === selectedTechnology.id &&
          link.relation !== "cross_cutting" &&
          (!link.countryIso3 || link.countryIso3 === country.iso3)
      )
        .map((link) => link.datasetId)
        .filter((datasetId) =>
          relatedDatasets.some((dataset) => dataset.id === datasetId)
        )
    );
  }, [country, relatedDatasets, selectedTechnology]);

  const countryWideIndicatorFacts = useMemo(() => {
    if (!selectedTechnology) return indicatorFacts;
    return indicatorFacts.filter(
      (fact) => !selectedTechnologyDatasetIds.has(fact.datasetId)
    );
  }, [indicatorFacts, selectedTechnology, selectedTechnologyDatasetIds]);

  const energyFacts = countryWideIndicatorFacts.filter((fact) =>
    [
      "electricity-access",
      "clean-cooking-access",
      "renewable-electricity-share",
      "grid-losses",
    ].includes(fact.id)
  );

  const climateTechnologyFacts = countryWideIndicatorFacts.filter((fact) =>
    ["heat-index-hi35", "solar-pvout", "solar-ghi"].includes(fact.id)
  );

  const otherRelatedDatasets = useMemo(() => {
    if (!selectedTechnology) return relatedDatasets;
    return relatedDatasets.filter(
      (dataset) => !selectedTechnologyDatasetIds.has(dataset.id)
    );
  }, [relatedDatasets, selectedTechnology, selectedTechnologyDatasetIds]);

  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);

  const gcfIndex = useMemo(
    () =>
      gcfPortfolio
        ? createGcfPortfolioIndex(gcfPortfolio)
        : new Map<string, GcfCountryPortfolioRecord>(),
    [gcfPortfolio]
  );
  const gcfRecord = iso3 ? gcfIndex.get(iso3) : undefined;

  const mapSupported = Boolean(
    country && country.longitude !== null && country.latitude !== null
  );

  if (loading) {
    return (
      <div className="page-shell country-v16-state" role="status">
        국가 정보·기후기술 데이터 로딩 중
      </div>
    );
  }

  if (!country) {
    return (
      <div className="page-shell country-v16-state">
        <h1>국가 정보 확인 불가</h1>
        <button type="button" className="primary-button" onClick={onBack}>
          이전 화면으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="country-profile-v16 country-profile-v34">
      <section className="country-v16-hero">
        <div className="page-shell country-v16-hero-inner">
          <button type="button" className="country-v16-back" onClick={onBack}>
            ← 이전 화면
          </button>

          <div className="country-v16-hero-content">
            <div>
              <span className="country-v16-kicker">국가 프로필</span>
              <h1>{country.nameKo}</h1>
              <div className="country-v16-meta" aria-label="국가 기본정보">
                <span>{country.iso3}</span>
                <span>{country.region}</span>
                <span>{country.incomeLevel}</span>
                <span>수도 {country.capitalCity || "자료 없음"}</span>
              </div>
            </div>

            <div className="country-v16-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => onExploreDatasets(country.iso3, technologyId)}
              >
                {selectedTechnology
                  ? "이 기술 관련 데이터 찾기"
                  : "이 국가의 데이터 찾기"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenCompare(country.iso3)}
              >
                데이터 다운로드
              </button>
              {mapSupported && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onOpenMap(country.iso3)}
                >
                  지도에서 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell country-v16-content country-v34-content">
        {warning && <div className="country-v16-warning">{warning}</div>}

        <PageJumpNavV39
          label={`${country.nameKo} 국가 프로필 빠른 이동`}
          items={[
            ...(selectedTechnology
              ? [{ id: "country-technology-evidence", label: "기술 근거" }]
              : []),
            ...(energyFacts.length > 0
              ? [{ id: "country-energy-section", label: "기후·에너지" }]
              : []),
            ...(climateTechnologyFacts.length > 0
              ? [{ id: "country-climate-section", label: "기후위험·잠재력" }]
              : []),
            { id: "country-finance", label: "사업·재원" },
            { id: "country-policy", label: "정책·NDC" },
            { id: "country-datasets", label: "근거 데이터" },
          ]}
        />

        <section
          id="country-technology-selector"
          className="country-v34-technology-switcher"
          aria-labelledby="country-tech-switcher-title"
        >
          <div className="country-v34-switcher-copy">
            <span>기후기술 기준으로 보기</span>
            <h2 id="country-tech-switcher-title">
              {selectedTechnology
                ? `${selectedTechnology.nameKo} 관련 근거 우선 확인`
                : `${country.nameKo} 국가 전체 현황`}
            </h2>
            <p>
              기술 선택 시 해당 기술과 직접 연결된 자료와 사업 검토 관련 자료를
              우선 표시
            </p>
          </div>

          <label className="country-v34-technology-select">
            <span>기후기술</span>
            <select
              value={technologyId}
              onChange={(event) => onTechnologyChange(event.target.value)}
            >
              <option value="all">전체 국가 현황</option>
              {technologyGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.technologies.map((technology) => {
                    const count = getTechnologyDatasetCount(
                      relatedDatasets,
                      technology.id,
                      country.iso3
                    );
                    return (
                      <option key={technology.id} value={technology.id}>
                        {technology.nameKo} · {count}건
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </label>

          {selectedTechnology && (
            <div
              className="country-v34-tech-tags"
              aria-label="선택 기술 기본정보"
            >
              <span>{selectedTechnology.category}</span>
              {selectedTechnology.relatedSectors.slice(0, 4).map((sector) => (
                <span key={sector}>{sector}</span>
              ))}
            </div>
          )}
        </section>

        {selectedTechnology && (
          <div id="country-technology-evidence">
            <CountryTechnologyEvidencePanel
              countryIso3={country.iso3}
              countryNameKo={country.nameKo}
              countryNameEn={country.nameEn}
              technologyId={selectedTechnology.id}
              indicatorMetrics={indicatorMetrics}
              onOpenDataset={onOpenDataset}
              onExploreDatasets={onExploreDatasets}
            />
          </div>
        )}

        {energyFacts.length > 0 && (
          <section
            id="country-energy-section"
            className="country-v16-section"
            aria-labelledby="country-energy"
          >
            <header className="country-v16-section-heading">
              <div>
                <span>
                  {selectedTechnology ? "국가 공통 현황" : "주요 현황"}
                </span>
                <h2 id="country-energy">기후·에너지 지표</h2>
              </div>
              <p>
                국가별 최신 가용값 · 선택 기술에 이미 사용된 지표는 중복
                표시하지 않음
              </p>
            </header>

            <div className="country-v16-indicator-grid">
              {energyFacts.map((fact) => (
                <IndicatorFactCard key={fact.id} fact={fact} />
              ))}
            </div>
          </section>
        )}

        {climateTechnologyFacts.length > 0 && (
          <section
            id="country-climate-section"
            className="country-v16-section"
            aria-labelledby="country-climate-technology"
          >
            <header className="country-v16-section-heading">
              <div>
                <span>
                  {selectedTechnology ? "국가 공통 현황" : "기후·기술 여건"}
                </span>
                <h2 id="country-climate-technology">기후위험·기술 잠재력</h2>
              </div>
              <p>
                국가 평균 또는 국가 영역 평균 · 세부 입지조건은 별도 확인 필요
              </p>
            </header>

            <div className="country-v16-indicator-grid">
              {climateTechnologyFacts.map((fact) => (
                <IndicatorFactCard key={fact.id} fact={fact} />
              ))}
            </div>
          </section>
        )}

        <section
          id="country-finance"
          className="country-v16-panel country-v16-gcf-panel country-v34-common-panel"
        >
          <header className="country-v16-panel-heading">
            <div>
              <span>
                {selectedTechnology ? "국가 공통 기후재원" : "사업·재원"}
              </span>
              <h2>GCF 국가 포트폴리오</h2>
            </div>
            {gcfPortfolio?.metadata.sourceUrl && (
              <a
                href={gcfPortfolio.metadata.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                원자료 확인 ↗
              </a>
            )}
          </header>

          <div className="country-v16-gcf-grid">
            <article>
              <span>GCF 사업 수</span>
              <strong>
                {gcfRecord ? `${gcfRecord.fundedActivityCount}건` : "자료 없음"}
              </strong>
            </article>
            <article>
              <span>GCF 승인재원</span>
              <strong>
                {gcfRecord
                  ? formatUsd(gcfRecord.fundedActivityFinancingUsd)
                  : "자료 없음"}
              </strong>
            </article>
            <article>
              <span>Readiness 지원 수</span>
              <strong>
                {gcfRecord
                  ? `${gcfRecord.readinessProjectCount}건`
                  : "자료 없음"}
              </strong>
            </article>
            <article>
              <span>Readiness 승인재원</span>
              <strong>
                {gcfRecord
                  ? formatUsd(gcfRecord.readinessFinancingUsd)
                  : "자료 없음"}
              </strong>
            </article>
          </div>

          <p className="country-v16-gcf-note">
            {gcfPortfolio?.metadata.snapshotDate ?? "기준일 확인 필요"} 기준 ·
            국가 단위 집계
            {selectedTechnology
              ? " · 특정 기술에 귀속되는 재원이 아니라 국가 전체 GCF 현황"
              : " · 다국가 사업의 전체 승인재원은 해당 국가 배분액과 다를 수 있음"}
          </p>
        </section>

        <div id="country-policy">
          <NdcPolicyPanel
            iso3={country.iso3}
            mode="profile"
            technologyId={selectedTechnology?.id ?? null}
          />
        </div>

        <section
          id="country-datasets"
          className="country-v16-panel country-v16-datasets country-v34-datasets"
        >
          <header className="country-v16-panel-heading">
            <div>
              <span>
                {selectedTechnology ? "다른 근거 데이터" : "근거 데이터"}
              </span>
              <h2>
                {selectedTechnology
                  ? `${country.nameKo}의 다른 공개자료`
                  : `${country.nameKo} 관련 데이터`}
              </h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => onExploreDatasets(country.iso3, technologyId)}
            >
              전체 보기 →
            </button>
          </header>

          {otherRelatedDatasets.length > 0 ? (
            <div className="country-v16-dataset-list country-v34-dataset-list">
              {otherRelatedDatasets
                .slice(0, selectedTechnology ? 6 : 8)
                .map((dataset) => (
                  <button
                    type="button"
                    key={dataset.id}
                    onClick={() => onOpenDataset(dataset.id)}
                  >
                    <span>
                      {CATEGORY_NAME_BY_CODE.get(dataset.category) ??
                        dataset.group}
                    </span>
                    <strong>{dataset.titleKo}</strong>
                    <small>
                      {dataset.referenceYear || dataset.period} ·{" "}
                      {dataset.sourceOrganization}
                    </small>
                    <b>상세 보기 →</b>
                  </button>
                ))}
            </div>
          ) : (
            <div className="country-v16-empty">
              <strong>현재 조건에서 추가 공개자료 없음</strong>
              <span>선택 기술 관련 자료는 상단 근거영역에서 확인</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function IndicatorFactCard({ fact }: { fact: IndicatorFact }) {
  return (
    <article className="country-v16-indicator tone-reference">
      <header>
        <span>{fact.title}</span>
      </header>
      <strong>{fact.value}</strong>
      <small>
        {fact.available ? `${fact.reference} · ${fact.source}` : "자료 없음"}
      </small>
      <p>{fact.description}</p>
      {(fact.limitations || fact.sourceUrl) && (
        <details>
          <summary>해석 시 유의사항</summary>
          {fact.limitations && <p>{fact.limitations}</p>}
          {fact.sourceUrl && (
            <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
              원자료 확인 ↗
            </a>
          )}
        </details>
      )}
    </article>
  );
}
