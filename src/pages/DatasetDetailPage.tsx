import { useEffect, useMemo, useState } from "react";
import MetadataItem from "../components/common/MetadataItem";
import DataTypeRenderer from "../components/data/DataTypeRenderer";
import { CATEGORIES } from "../data/publicTaxonomy";
import type { Dataset } from "../types/dataset";
import { copyCurrentUrl, copyText, openExternalUrl } from "../utils/browser";
import {
  getDatasetStatusDisplay,
  isDatasetDownloadable,
  isDatasetPubliclyVisible,
  isDatasetSourceLinkAvailable,
} from "../utils/datasetAccess";
import {
  getDatasetSpecificTechnologyLinks,
  getTechnologyName,
  TECHNOLOGY_RELATION_LABELS,
} from "../utils/technologyData";
import { formatDate } from "../utils/text";
import { getPublicDataGroupLabel } from "../utils/publicLabelsV56";
import "../styles/dataset-detail-v8.css";
import "../styles/dataset-detail-v13.css";
import "../styles/adaptive-preview-v14.css";
import "../styles/climate-risk-v25.css";
import "../styles/solar-potential-v26.css";
import "../styles/data-type-renderer.css";
import "../styles/user-facing-v30.css";
import "../styles/data-detail-v33.css";
import "../styles/benchmark-ux-v39.css";

type DetailTab = "data" | "source";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "data", label: "데이터 보기" },
  { id: "source", label: "출처·유의사항" },
];

interface DatasetDetailPageProps {
  dataset: Dataset | null;
  onBack: () => void;
  backLabel?: string;
  onOpenDownload: () => void;
  countryIso3?: string | null;
  countryName?: string | null;
}

export default function DatasetDetailPage({
  dataset,
  onBack,
  backLabel = "검색 결과로 돌아가기",
  onOpenDownload,
  countryIso3 = null,
  countryName = null,
}: DatasetDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("data");

  useEffect(() => {
    setActiveTab("data");
  }, [dataset?.id]);

  if (!dataset || !isDatasetPubliclyVisible(dataset)) {
    return (
      <div className="page-shell not-found">
        <h1>공개된 데이터를 확인할 수 없음</h1>
        <p>현재 공개된 데이터 검색 결과에서 다시 확인 필요</p>
        <button type="button" className="primary-button" onClick={onBack}>
          {backLabel}
        </button>
      </div>
    );
  }

  const status = getDatasetStatusDisplay(dataset);
  const canDownload = isDatasetDownloadable(dataset);
  const canOpenSource = isDatasetSourceLinkAvailable(dataset);
  const category = CATEGORIES.find((item) => item.code === dataset.category);
  const sourceUrl = dataset.sourceUrl;
  const primaryLabel = canDownload
    ? "다운로드 설정"
    : canOpenSource
    ? "원자료 확인"
    : status.label;
  const technologyLinks = useMemo(() => {
    const seen = new Set<string>();
    return getDatasetSpecificTechnologyLinks(dataset.id).filter((link) => {
      const key = `${link.technologyId}:${link.relation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dataset.id]);

  function runPrimaryAction() {
    if (canDownload) {
      onOpenDownload();
      return;
    }
    if (canOpenSource && sourceUrl) openExternalUrl(sourceUrl);
  }

  return (
    <div className="page-shell detail-page detail-page-v8 detail-page-v13 detail-user-v30 detail-user-v33">
      <button type="button" className="back-button" onClick={onBack}>
        ← {backLabel}
      </button>

      <div className="breadcrumb">
        데이터 찾기 /{" "}
        {category?.nameKo ?? getPublicDataGroupLabel(dataset.group)} /{" "}
        {getPublicDataGroupLabel(dataset.group)}
      </div>

      <header className="detail-header">
        <div>
          <div className="badge-row">
            <span className="user-topic-badge">
              {category?.nameKo ?? dataset.group}
            </span>
            <span className={`rights-badge ${status.className}`}>
              {status.label}
            </span>
            {dataset.gis && <span className="neutral-badge">지도 연계</span>}
          </div>
          <h1>{dataset.titleKo}</h1>
          <span className="detail-title-en">{dataset.titleEn}</span>
          <p>{dataset.summary}</p>

          {technologyLinks.length > 0 && (
            <div className="v33-related-techs" aria-label="관련 기후기술">
              <strong>관련 기후기술</strong>
              <div>
                {technologyLinks.slice(0, 8).map((link) => (
                  <span key={`${link.technologyId}-${link.relation}`}>
                    {getTechnologyName(link.technologyId)}
                    <small>{TECHNOLOGY_RELATION_LABELS[link.relation]}</small>
                  </span>
                ))}
                {technologyLinks.length > 8 && (
                  <span className="more">+{technologyLinks.length - 8}개</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={copyCurrentUrl}
          >
            공유 링크 복사
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canDownload && !canOpenSource}
            onClick={runPrimaryAction}
          >
            {primaryLabel}
          </button>
        </div>
      </header>

      <section className="detail-key-facts" aria-label="핵심 정보">
        <MetadataItem label="출처기관" value={dataset.sourceOrganization} />
        <MetadataItem label="기준" value={dataset.referenceYear} />
        <MetadataItem label="기간" value={dataset.period} />
        <MetadataItem label="단위" value={dataset.unit} />
        {dataset.updatedAtVerified && dataset.updatedAt ? (
          <MetadataItem label="확인일" value={formatDate(dataset.updatedAt)} />
        ) : null}
        <MetadataItem label="이용조건" value={dataset.license} />
      </section>

      <div
        className="dataset-detail-tabs"
        role="tablist"
        aria-label="데이터 상세 정보"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="dataset-detail-tab-panel" role="tabpanel">
        {activeTab === "data" && (
          <DataTab
            dataset={dataset}
            countryIso3={countryIso3}
            countryName={countryName}
          />
        )}
        {activeTab === "source" && <SourceQualityTab dataset={dataset} />}
      </section>
    </div>
  );
}

function DataTab({
  dataset,
  countryIso3,
  countryName,
}: {
  dataset: Dataset;
  countryIso3: string | null;
  countryName: string | null;
}) {
  return (
    <div className="dataset-data-tab">
      <DataTypeRenderer
        dataset={dataset}
        countryIso3={countryIso3}
        countryName={countryName}
      />
      {dataset.variables.length > 0 && (
        <details className="dataset-advanced-details">
          <summary>포함 항목 보기</summary>
          <section className="detail-section variables-compact-section">
            <div className="variable-list variable-list-user-v30">
              {dataset.variables.map((variable) => (
                <div key={variable} className="variable-item">
                  <strong>{variable}</strong>
                  {dataset.unit && dataset.unit !== "-" && (
                    <small>{dataset.unit}</small>
                  )}
                </div>
              ))}
            </div>
          </section>
        </details>
      )}
    </div>
  );
}

function AccessTab({
  dataset,
  onOpenDownload,
}: {
  dataset: Dataset;
  onOpenDownload: () => void;
  countryIso3?: string | null;
  countryName?: string | null;
}) {
  return (
    <div>
      <div className="detail-access-intro">
        <div>
          <h2>이용 가능한 자료</h2>
          <p>다운로드 설정 또는 원천기관의 공식 자료 확인</p>
        </div>
      </div>
      <ResourcesTab dataset={dataset} onOpenDownload={onOpenDownload} />
    </div>
  );
}

function ResourcesTab({
  dataset,
  onOpenDownload,
}: {
  dataset: Dataset;
  onOpenDownload: () => void;
  countryIso3?: string | null;
  countryName?: string | null;
}) {
  return (
    <div className="resource-table-wrapper">
      <table className="resource-table">
        <thead>
          <tr>
            <th>자료</th>
            <th>형식</th>
            <th>이용방법</th>
            <th>열기</th>
          </tr>
        </thead>
        <tbody>
          {dataset.resources.length > 0 ? (
            dataset.resources.map((resource) => (
              <tr key={resource.id}>
                <td>
                  <strong>{resource.title}</strong>
                </td>
                <td>{resource.format}</td>
                <td>{getResourceAccessLabel(resource.access)}</td>
                <td>
                  {resource.access === "download" ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={onOpenDownload}
                    >
                      다운로드 설정
                    </button>
                  ) : resource.access === "source" && resource.url ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={() => openExternalUrl(resource.url!)}
                    >
                      원자료 확인 ↗
                    </button>
                  ) : (
                    <span>이용 제한</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>현재 제공 가능한 자료 없음</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getResourceAccessLabel(
  access: Dataset["resources"][number]["access"]
): string {
  switch (access) {
    case "download":
      return "다운로드 허브";
    case "source":
      return "원자료 확인";
    case "restricted":
      return "접근 제한";
    default:
      return "준비 중";
  }
}

function SourceQualityTab({ dataset }: { dataset: Dataset }) {
  const [copied, setCopied] = useState(false);
  async function copyCitation() {
    if (!dataset.citation) return;
    const success = await copyText(dataset.citation);
    setCopied(success);
  }
  return (
    <div className="source-quality-layout">
      <section className="detail-section">
        <h2>출처·산정방법</h2>
        <dl className="version-detail-list">
          <MetadataItem label="출처기관" value={dataset.sourceOrganization} />
          <MetadataItem
            label="버전"
            value={dataset.version ?? "별도 버전 없음"}
          />
          {dataset.updatedAtVerified && dataset.updatedAt ? (
            <MetadataItem
              label="확인일"
              value={formatDate(dataset.updatedAt)}
            />
          ) : null}
        </dl>
        <p className="source-methodology-copy">{dataset.methodology}</p>
        {dataset.sourceUrl && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => openExternalUrl(dataset.sourceUrl)}
          >
            원자료 확인 ↗
          </button>
        )}
      </section>
      <section className="detail-section">
        <h2>이용 시 유의사항</h2>
        <ul className="detail-limitations">
          {dataset.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="detail-section citation-section-v13">
        <h2>출처 표기</h2>
        {dataset.citation ? (
          <>
            <blockquote className="citation-block">
              {dataset.citation}
            </blockquote>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyCitation()}
            >
              {copied ? "복사 완료" : "출처 표기 복사"}
            </button>
          </>
        ) : (
          <p>공식 출처 표기 확인 중</p>
        )}
      </section>
    </div>
  );
}
