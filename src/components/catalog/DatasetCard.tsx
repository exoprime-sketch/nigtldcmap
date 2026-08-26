import { CATEGORIES } from "../../data/publicTaxonomy";
import type { Dataset } from "../../types/dataset";
import {
  getDatasetStatusDisplay,
  isDatasetDownloadable,
} from "../../utils/datasetAccess";
import {
  getDatasetSpecificTechnologyLinks,
  getTechnologyName,
  TECHNOLOGY_RELATION_LABELS,
} from "../../utils/technologyData";
import "../../styles/technology-filter-v32.css";

interface DatasetCardProps {
  dataset: Dataset;
  selectedTechnologyId?: string;
  selectedCountryIso3?: string;
  onOpen: (datasetId: string) => void;
}

export default function DatasetCard({
  dataset,
  selectedTechnologyId,
  selectedCountryIso3,
  onOpen,
}: DatasetCardProps) {
  const status = getDatasetStatusDisplay(dataset);
  const canDownload = isDatasetDownloadable(dataset);
  const topic = CATEGORIES.find((item) => item.code === dataset.category);
  const coverageLabel =
    dataset.geographicCoverage === "global"
      ? "전 세계"
      : dataset.countries.slice(0, 3).join(", ");

  const technologyLinks = getDatasetSpecificTechnologyLinks(
    dataset.id,
    selectedCountryIso3
  );
  const selectedLink = selectedTechnologyId
    ? technologyLinks.find((link) => link.technologyId === selectedTechnologyId)
    : undefined;

  const displayLinks = selectedLink
    ? [selectedLink]
    : technologyLinks.slice(0, 2);

  return (
    <article className="dataset-card dataset-card-user-v32">
      <div className="dataset-card-head">
        <div className="badge-row">
          <span className="user-topic-badge">
            {topic?.nameKo ?? dataset.group}
          </span>
          <span className={`rights-badge ${status.className}`}>
            {status.label}
          </span>
          {dataset.gis && <span className="neutral-badge">지도에서 보기</span>}
        </div>
      </div>

      <button
        type="button"
        className="dataset-title"
        onClick={() => onOpen(dataset.id)}
      >
        {dataset.titleKo}
      </button>
      <span className="dataset-title-en">{dataset.titleEn}</span>
      <p className="dataset-summary">{dataset.summary}</p>

      {displayLinks.length > 0 && (
        <div className="dataset-technology-links" aria-label="관련 기후기술">
          {displayLinks.map((link) => (
            <span
              key={`${link.datasetId}-${link.technologyId}`}
              className={`technology-link-chip relation-${link.relation}`}
              title={link.basisKo}
            >
              {getTechnologyName(link.technologyId)}
              <small>{TECHNOLOGY_RELATION_LABELS[link.relation]}</small>
            </span>
          ))}
          {!selectedLink && technologyLinks.length > displayLinks.length && (
            <span className="technology-link-more">
              관련 기술 {technologyLinks.length}개
            </span>
          )}
        </div>
      )}

      <dl className="dataset-meta dataset-meta-user-v32">
        <div>
          <dt>범위</dt>
          <dd>{coverageLabel}</dd>
        </div>
        <div>
          <dt>기준</dt>
          <dd>{dataset.referenceYear}</dd>
        </div>
        <div>
          <dt>출처</dt>
          <dd>{dataset.sourceOrganization}</dd>
        </div>
      </dl>

      <div className="dataset-card-footer dataset-card-footer-user-v32">
        <div className="user-card-cues">
          {canDownload && <span>다운로드 가능</span>}
          {dataset.sourceUrl && <span>원 데이터 확인</span>}
          {dataset.gis && <span>지도 연계</span>}
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => onOpen(dataset.id)}
        >
          상세 보기 →
        </button>
      </div>
    </article>
  );
}
