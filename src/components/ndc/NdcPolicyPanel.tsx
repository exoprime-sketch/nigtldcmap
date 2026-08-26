import { useEffect, useMemo, useState } from "react";
import {
  getNdcCountryRecord,
  getNdcRegistryMetadataStatusLabel,
  getNdcTechnologyLabel,
  getVerifiedNdcPriorities,
  hasReviewedNdcTechnologyEvidence,
  loadNdcTechnologyPriorities,
} from "../../data/policy/ndcTechnologyPriorities";
import type {
  NdcCountryRecord,
  NdcTechnologyPriorityDataset,
} from "../../types/ndc";
import { getTechnologyName } from "../../utils/technologyData";
import "../../styles/ndc-policy-v24.css";
import "../../styles/ndc-policy-v33.css";

interface NdcPolicyPanelProps {
  iso3?: string | null;
  mode?: "profile" | "compact" | "dataset";
  technologyId?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  explicit: "원문에서 직접 확인",
  related: "관련 정책수단 확인",
  "not-confirmed": "현재 직접 근거 미확인",
};

const STATUS_EXPLANATIONS: Record<string, string> = {
  explicit: "기술명·직접 동의어·구체적 기술수단을 공식 NDC 원문에서 확인",
  related: "기술명이 직접 명시되지는 않으나 직접 관련 정책·사업수단을 확인",
  "not-confirmed":
    "현재 검토한 공식 NDC 범위에서 직접 인용 가능한 근거를 확인하지 못함",
};

const PROFILE_TECH_TO_NDC_PRIORITY_IDS: Record<string, string[]> = {
  "solar-pv": ["renewable-energy"],
  wind: ["renewable-energy"],
  hydropower: ["renewable-energy"],
  geothermal: ["renewable-energy"],
  bioenergy: ["renewable-energy"],
  biomass: ["renewable-energy"],
  "power-integration": ["power-grid"],
  "power-generation-efficiency": ["energy-efficiency"],
  "industrial-efficiency": ["energy-efficiency", "industrial-decarbonization"],
  "building-efficiency": ["energy-efficiency"],
  "transport-efficiency": ["energy-efficiency"],
  "industry-energy": ["industrial-decarbonization"],
  water: ["water"],
  "agriculture-livestock-fisheries": ["agriculture"],
  "land-coastal": ["coastal-adaptation"],
  "climate-monitoring-diagnosis": ["early-warning"],
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`ndc-status ndc-status-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function EvidenceCard({
  dataset,
  priority,
}: {
  dataset: NdcTechnologyPriorityDataset;
  priority: NdcCountryRecord["priorities"][number];
}) {
  return (
    <article className="ndc-evidence-card v33-ndc-card">
      <header>
        <strong>{getNdcTechnologyLabel(dataset, priority.technologyId)}</strong>
        <StatusBadge status={priority.status} />
      </header>

      <p className="ndc-status-description">
        {STATUS_EXPLANATIONS[priority.status] || "공식 문서 근거 확인 필요"}
      </p>

      {priority.translationKo && (
        <div className="ndc-evidence-text translation">
          <span>NDC 내용·한국어 의미</span>
          <p>{priority.translationKo}</p>
        </div>
      )}

      {priority.evidenceOriginal ? (
        <>
          <div className="ndc-evidence-text original">
            <span>공식 원문 발췌</span>
            <p lang="en">{priority.evidenceOriginal}</p>
          </div>
          <small>
            근거 위치 · {priority.documentPage}
            {priority.documentSection ? ` · ${priority.documentSection}` : ""}
          </small>
        </>
      ) : (
        <div className="ndc-evidence-empty">
          현재 수록 자료에서 직접 인용 가능한 근거를 확인하지 못했습니다
        </div>
      )}
    </article>
  );
}

export default function NdcPolicyPanel({
  iso3 = null,
  mode = "profile",
  technologyId = null,
}: NdcPolicyPanelProps) {
  const [dataset, setDataset] = useState<NdcTechnologyPriorityDataset | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [datasetIso3, setDatasetIso3] = useState("VNM");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "explicit" | "related" | "not-confirmed"
  >("all");

  useEffect(() => {
    let cancelled = false;
    void loadNdcTechnologyPriorities()
      .then((result) => {
        if (cancelled) return;
        setDataset(result);
        if (!result.data.some((record) => record.iso3 === datasetIso3)) {
          setDatasetIso3(
            result.data.some((record) => record.iso3 === "VNM")
              ? "VNM"
              : result.data[0]?.iso3 ?? ""
          );
        }
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWarning(
          error instanceof Error
            ? error.message
            : "NDC 정책자료를 불러오지 못했습니다"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIso3 = mode === "dataset" ? datasetIso3 : iso3;
  const countryRecord = useMemo(
    () => getNdcCountryRecord(dataset, activeIso3),
    [dataset, activeIso3]
  );

  if (loading) {
    return (
      <div className="ndc-panel-state" role="status">
        NDC 정책 근거 로딩 중
      </div>
    );
  }
  if (!dataset || warning) {
    return (
      <div className="ndc-panel-state warning">
        {warning ?? "NDC 정책 데이터 없음"}
      </div>
    );
  }

  if (mode === "compact") {
    if (!countryRecord) {
      return (
        <div className="ndc-policy-compact">
          <strong>현재 플랫폼에 수록된 NDC 상세자료가 없습니다</strong>
        </div>
      );
    }
    const priorities = getVerifiedNdcPriorities(countryRecord).slice(0, 6);
    const evidenceReviewed = hasReviewedNdcTechnologyEvidence(countryRecord);

    return (
      <div className="ndc-policy-compact">
        <div className="ndc-compact-heading">
          <span>최신 활성 NDC</span>
          <strong>{countryRecord.ndcTitle}</strong>
        </div>

        <div className="ndc-meta-status-v78">
          {getNdcRegistryMetadataStatusLabel(countryRecord)}
        </div>

        {evidenceReviewed && priorities.length > 0 ? (
          <div className="ndc-tag-list">
            {priorities.map((priority) => (
              <span
                key={priority.technologyId}
                className={`status-${priority.status}`}
              >
                {getNdcTechnologyLabel(dataset, priority.technologyId)}
              </span>
            ))}
          </div>
        ) : (
          <div className="ndc-panel-state v78-metadata-only">
            최신 NDC 기본정보 제공 · 기술별 세부 근거 준비 중
          </div>
        )}

        <small>
          제출일 {countryRecord.submissionDate}
          {countryRecord.registryStatus
            ? ` · ${countryRecord.registryStatus}`
            : ""}
        </small>
        <a href={countryRecord.officialUrl} target="_blank" rel="noreferrer">
          공식 문서 확인 ↗
        </a>
      </div>
    );
  }

  if (!countryRecord) {
    return (
      <section className="ndc-policy-panel mode-profile">
        <header className="ndc-panel-heading">
          <div>
            <span>최신 NDC</span>
            <h2>기술 관련 공식 근거</h2>
          </div>
        </header>
        <div className="ndc-panel-state">
          현재 플랫폼에 해당 국가의 NDC 상세자료가 수록되지 않았습니다
        </div>
      </section>
    );
  }

  const evidenceReviewed = hasReviewedNdcTechnologyEvidence(countryRecord);

  const selectedPriorityIds =
    mode === "profile" && technologyId
      ? PROFILE_TECH_TO_NDC_PRIORITY_IDS[technologyId] ?? []
      : [];
  const technologyFiltered =
    mode === "profile" && technologyId
      ? countryRecord.priorities.filter((priority) =>
          selectedPriorityIds.includes(priority.technologyId)
        )
      : countryRecord.priorities;
  const filteredPriorities = technologyFiltered.filter(
    (priority) => statusFilter === "all" || priority.status === statusFilter
  );

  const counts = {
    explicit: countryRecord.priorities.filter(
      (item) => item.status === "explicit"
    ).length,
    related: countryRecord.priorities.filter(
      (item) => item.status === "related"
    ).length,
    unconfirmed: countryRecord.priorities.filter(
      (item) => item.status === "not-confirmed"
    ).length,
  };

  const targetedProfile = mode === "profile" && Boolean(technologyId);

  return (
    <section
      className={`ndc-policy-panel ${
        mode === "dataset" ? "mode-dataset-v33" : "mode-profile"
      } ${targetedProfile ? "mode-profile-targeted" : ""}`}
    >
      <header className="ndc-panel-heading v33-ndc-heading">
        <div>
          <span>
            {mode === "dataset"
              ? "국가별 NDC 근거"
              : targetedProfile
              ? "선택 기술의 정책 근거"
              : "최신 NDC"}
          </span>
          <h2>
            {targetedProfile && technologyId
              ? `${getTechnologyName(technologyId)} · 최신 NDC`
              : countryRecord.ndcTitle}
          </h2>
          <p>
            {countryRecord.countryNameKo} · 제출일{" "}
            {countryRecord.submissionDate}
            {countryRecord.registryStatus
              ? ` · ${countryRecord.registryStatus}`
              : ""}
          </p>
          <small className="v78-ndc-review-state">
            {getNdcRegistryMetadataStatusLabel(countryRecord)}
          </small>
        </div>
        <a href={countryRecord.officialUrl} target="_blank" rel="noreferrer">
          공식 문서 확인 ↗
        </a>
      </header>

      {mode === "dataset" && (
        <div className="v33-ndc-controls">
          <label>
            <span>국가</span>
            <select
              value={datasetIso3}
              onChange={(event) => setDatasetIso3(event.target.value)}
            >
              {dataset.data.map((record) => (
                <option key={record.iso3} value={record.iso3}>
                  {record.countryNameKo} · {record.iso3}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>근거 상태</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              <option value="all">전체</option>
              <option value="explicit">원문에서 직접 확인</option>
              <option value="related">관련 정책수단 확인</option>
              <option value="not-confirmed">현재 직접 근거 미확인</option>
            </select>
          </label>
        </div>
      )}

      {!evidenceReviewed && (
        <div className="ndc-panel-state v78-metadata-only">
          <strong>최신 NDC 기본정보 제공</strong>
          <span>기술별 세부 근거는 준비 중입니다</span>
        </div>
      )}

      {!targetedProfile && evidenceReviewed && (
        <div className="ndc-summary-strip v33-ndc-summary">
          <span>
            <strong>{counts.explicit}</strong>원문에서 직접 확인
          </span>
          <span>
            <strong>{counts.related}</strong>관련 정책수단 확인
          </span>
          <span>
            <strong>{counts.unconfirmed}</strong>현재 직접 근거 미확인
          </span>
        </div>
      )}

      {!evidenceReviewed ? null : targetedProfile &&
        selectedPriorityIds.length === 0 ? (
        <div className="ndc-panel-state">
          현재 선택 기술에 해당하는 NDC 세부 근거가 없습니다 · 전체 NDC 자료는
          데이터 상세에서 확인할 수 있습니다
        </div>
      ) : (
        <div className="ndc-evidence-grid">
          {filteredPriorities.map((priority) => (
            <EvidenceCard
              key={priority.technologyId}
              dataset={dataset}
              priority={priority}
            />
          ))}
        </div>
      )}

      {selectedPriorityIds.length > 0 && filteredPriorities.length === 0 && (
        <div className="ndc-panel-state">현재 조건에 맞는 근거 없음</div>
      )}

      <p className="ndc-translation-note">
        한국어 내용 · 이해 지원용 참고 · 정책적·법적 해석은 공식 NDC 원문 기준
      </p>
    </section>
  );
}
