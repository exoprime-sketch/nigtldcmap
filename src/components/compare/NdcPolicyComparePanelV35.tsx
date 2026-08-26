import { useEffect, useMemo, useState } from "react";
import {
  getNdcRegistryMetadataStatusLabel,
  getNdcStatusDescription,
  getNdcStatusLabel,
  getNdcTechnologyPriority,
  hasReviewedNdcTechnologyEvidence,
  loadNdcTechnologyPriorities,
} from "../../data/policy/ndcTechnologyPriorities";
import type { Country } from "../../types/country";
import type {
  NdcCountryRecord,
  NdcTechnologyPriorityDataset,
  NdcTechnologyPriority,
} from "../../types/ndc";
import { downloadBlob } from "../../utils/browser";

interface Props {
  countries: Country[];
  initialTechnologyId?: string;
  onTechnologyChange?: (technologyId: string) => void;
  onOpenCountry?: (iso3: string) => void;
}

export default function NdcPolicyComparePanelV35({
  countries,
  initialTechnologyId = "renewable-energy",
  onTechnologyChange,
  onOpenCountry,
}: Props) {
  const [dataset, setDataset] = useState<NdcTechnologyPriorityDataset | null>(
    null
  );
  const [technologyId, setTechnologyId] = useState(initialTechnologyId);

  useEffect(() => {
    setTechnologyId(initialTechnologyId);
  }, [initialTechnologyId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadNdcTechnologyPriorities(reloadKey > 0);
      if (cancelled) return;
      setDataset(result);
      const ids = Object.keys(result.metadata.technologyLabels);
      setTechnologyId((current: string) => {
        if (ids.includes(current) || ids.length === 0) return current;
        const fallback = ids[0];
        onTechnologyChange?.(fallback);
        return fallback;
      });
      setLoading(false);
    }

    void load().catch((loadError: unknown) => {
      if (cancelled) return;
      setLoading(false);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "NDC 정책자료를 불러오지 못했습니다"
      );
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const countryIndex = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country])),
    [countries]
  );

  const technologyOptions = useMemo(
    () =>
      Object.entries(dataset?.metadata.technologyLabels ?? {}).sort((a, b) =>
        a[1].localeCompare(b[1], "ko")
      ),
    [dataset]
  );

  const rows = useMemo(() => {
    if (!dataset) return [];
    return dataset.data.map((record) => ({
      record,
      priority: getNdcTechnologyPriority(record, technologyId),
    }));
  }, [dataset, technologyId]);

  const counts = rows.reduce(
    (acc, row) => {
      const status = row.priority?.status;
      if (status === "explicit") acc.explicit += 1;
      else if (status === "related") acc.related += 1;
      else if (status === "not-confirmed") acc.notConfirmed += 1;
      else acc.noData += 1;
      return acc;
    },
    { explicit: 0, related: 0, notConfirmed: 0, noData: 0 }
  );

  function downloadCurrentView() {
    if (!dataset) return;
    const header = [
      "country_iso3",
      "country_name_ko",
      "technology",
      "status",
      "document_title",
      "submission_date",
      "document_page",
      "document_section",
      "translation_ko",
      "evidence_original",
      "official_url",
    ];
    const dataRows = rows.map(({ record, priority }) => [
      record.iso3,
      countryIndex.get(record.iso3)?.nameKo ?? record.countryNameKo,
      dataset.metadata.technologyLabels[technologyId] ?? technologyId,
      priority ? getNdcStatusLabel(priority.status) : "검토자료 없음",
      record.ndcTitle,
      record.submissionDate,
      priority?.documentPage ?? "",
      priority?.documentSection ?? "",
      priority?.translationKo ?? "",
      priority?.evidenceOriginal ?? "",
      record.officialUrl,
    ]);
    const csv =
      "\uFEFF" +
      [header, ...dataRows]
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
        .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `ndc-${technologyId}-country-comparison.csv`
    );
  }

  if (loading)
    return <div className="compare-v35-state">NDC 정책자료 불러오는 중</div>;

  if (error) {
    return (
      <div className="compare-v35-state compare-v35-state--error">
        <h2>NDC 정책근거를 불러올 수 없음</h2>
        <p>{error}</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!dataset) return null;

  const technologyLabel =
    dataset.metadata.technologyLabels[technologyId] ?? technologyId;

  return (
    <section className="compare-v35-panel">
      <div className="compare-v35-controls compare-v35-controls--ndc">
        <label>
          <span>정책 비교 항목</span>
          <select
            value={technologyId}
            onChange={(event) => {
              const nextTechnologyId = event.target.value;
              setTechnologyId(nextTechnologyId);
              onTechnologyChange?.(nextTechnologyId);
            }}
          >
            {technologyOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-v35-source">
        <div>
          <strong>{technologyLabel} · 최신 NDC</strong>
          <span>
            공식 NDC에서 직접 확인된 내용, 관련 정책수단과 현재 확인되지 않은
            항목을 구분해 비교합니다
          </span>
        </div>
        <div>
          <span>
            NDC 자료 · {rows.length}개국 · 기술별 상세근거 확인 ·{" "}
            {
              rows.filter(({ record }) =>
                hasReviewedNdcTechnologyEvidence(record)
              ).length
            }
            개국
          </span>
          <span>출처 · {dataset.metadata.sourceOrganization}</span>
          <span>기준 · {dataset.metadata.referenceDate}</span>
          <button
            type="button"
            className="text-link-button"
            onClick={downloadCurrentView}
          >
            현재 비교 CSV 다운로드
          </button>
        </div>
      </div>

      <div className="compare-v35-summary compare-v35-summary--4">
        <article>
          <span>원문에서 직접 확인</span>
          <strong>{counts.explicit}개국</strong>
        </article>
        <article>
          <span>관련 정책수단 확인</span>
          <strong>{counts.related}개국</strong>
        </article>
        <article>
          <span>현재 직접 근거 미확인</span>
          <strong>{counts.notConfirmed}개국</strong>
        </article>
        <article>
          <span>세부 근거 준비 중</span>
          <strong>{counts.noData}개국</strong>
        </article>
      </div>

      <div className="compare-v35-note">
        ‘현재 직접 근거 미확인’은 해당 기술이 NDC에 없거나 수요가 없다는 의미가
        아니라, 현재 검토한 공식 NDC 범위에서 직접 인용 가능한 근거를 확인하지
        못했다는 의미
      </div>

      <div className="compare-v35-ndc-grid">
        {rows.map(({ record, priority }) => (
          <NdcCountryCard
            key={record.iso3}
            record={record}
            priority={priority}
            countryName={
              countryIndex.get(record.iso3)?.nameKo ?? record.countryNameKo
            }
            onOpenCountry={onOpenCountry}
          />
        ))}
      </div>
    </section>
  );
}

function NdcCountryCard({
  record,
  priority,
  countryName,
  onOpenCountry,
}: {
  record: NdcCountryRecord;
  priority: NdcTechnologyPriority | null;
  countryName: string;
  onOpenCountry?: (iso3: string) => void;
}) {
  return (
    <article className="compare-v35-ndc-card">
      <header>
        <button type="button" onClick={() => onOpenCountry?.(record.iso3)}>
          <strong>{countryName}</strong>
          <small>{record.iso3}</small>
        </button>
        <span
          className={`ndc-status ndc-status--${priority?.status ?? "none"}`}
        >
          {priority
            ? getNdcStatusLabel(priority.status)
            : hasReviewedNdcTechnologyEvidence(record)
            ? "해당 기술의 세부 근거 없음"
            : "세부 근거 준비 중"}
        </span>
      </header>

      <dl>
        <div>
          <dt>NDC</dt>
          <dd>{record.ndcTitle}</dd>
        </div>
        <div>
          <dt>제출일</dt>
          <dd>{record.submissionDate}</dd>
        </div>
        <div>
          <dt>UNFCCC 등록 상태</dt>
          <dd>{record.registryStatus ?? "Active"}</dd>
        </div>
        <div>
          <dt>기술근거</dt>
          <dd>{getNdcRegistryMetadataStatusLabel(record)}</dd>
        </div>
      </dl>

      {priority ? (
        <>
          <div className="compare-v35-evidence-block">
            <span>한국어 의미</span>
            <p>{priority.translationKo || "한국어 참고내용 없음"}</p>
          </div>
          <div className="compare-v35-evidence-block compare-v35-evidence-block--original">
            <span>공식 문서 근거</span>
            <p>{priority.evidenceOriginal || "직접 인용문 없음"}</p>
          </div>
          <div className="compare-v35-evidence-meta">
            <span>{priority.documentPage || "페이지 정보 없음"}</span>
            <span>{priority.documentSection || "절 정보 없음"}</span>
          </div>
          <small className="compare-v35-status-description">
            {getNdcStatusDescription(priority.status)}
          </small>
        </>
      ) : (
        <div className="compare-v35-empty compare-v35-empty--compact">
          {hasReviewedNdcTechnologyEvidence(record)
            ? "현재 해당 기술에 대한 NDC 세부 근거가 없습니다"
            : "최신 NDC 기본정보 제공 · 기술별 세부 근거 준비 중"}
        </div>
      )}

      <a href={record.officialUrl} target="_blank" rel="noreferrer">
        공식 NDC 확인 ↗
      </a>
    </article>
  );
}

function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
