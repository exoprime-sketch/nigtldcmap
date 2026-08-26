import { useEffect, useMemo, useState } from "react";
import NdcPolicyPanel from "../../components/ndc/NdcPolicyPanel";
import { loadCountries } from "../../data/countries";
import { PRIORITY_COUNTRY_SET } from "../../data/priorityCountries";
import {
  getSolarPotentialRecord,
  loadSolarPotentialDataset,
} from "../../data/potential/solarPotential";
import {
  formatUsd,
  loadGcfCountryPortfolio,
  percentileRank,
} from "../../data/gcf/gcfCountryPortfolio";
import {
  createObservationIndex,
  formatIndicatorReferencePeriod,
  getIndicatorConfig,
  getIndicatorTimeLabel,
  getIndicatorYears,
  loadIndicatorData,
} from "../../data/indicators/registry";
import type { IndicatorId } from "../../data/indicators/registry";
import type { Country } from "../../types/country";
import type {
  GcfCountryPortfolio,
  GcfCountryPortfolioRecord,
} from "../../types/gcf";
import type { IndicatorObservation } from "../../types/indicator";
import type { SolarPotentialDataset } from "../../types/solar";
import "../../styles/cooperation-insights.css";
import "../../styles/climate-risk-v25.css";
import "../../styles/solar-potential-v26.css";
import "../../styles/data-types-v27.css";

interface CooperationInsightsPageProps {
  onOpenCountry: (iso3: string) => void;
}

type SupportMetric = "fundedActivityFinancingUsd" | "fundedActivityCount";
type MatrixQuadrant = "reference" | "scale" | "monitor" | "gap";
type SecondaryFocus = "all" | "transition" | "no-portfolio";

interface InsightRow {
  country: Country;
  gcf: GcfCountryPortfolioRecord;
  rawValue: number;
  demandValue: number;
  demandPosition: number;
  supportValue: number;
  supportPosition: number;
  matrixQuadrant: MatrixQuadrant;
}

interface MatrixRow extends InsightRow {
  matrixX: number;
  matrixY: number;
}

interface AdditionalSignal {
  id: "transition" | "no-portfolio";
  title: string;
  reason: string;
  action: string;
}

const DEMAND_INDICATORS: IndicatorId[] = [
  "electricity-access",
  "clean-cooking-access",
  "grid-losses",
  "heat-index-hi35",
];

const SUPPORT_METRIC_LABELS: Record<SupportMetric, string> = {
  fundedActivityFinancingUsd: "GCF 본사업 승인재원",
  fundedActivityCount: "GCF 본사업 수",
};

const MATRIX_QUADRANT_CONFIG: Record<
  MatrixQuadrant,
  {
    title: string;
    condition: string;
    meaning: string;
    action: string;
  }
> = {
  reference: {
    title: "기존 지원 사례 참고",
    condition: "수요 상대 위치 50 미만 · GCF 본사업 지원 상대 위치 50 이상",
    meaning: "수요는 비교적 낮고 기존 지원은 많은 국가군",
    action: "기존 사업 성과·확산 사례·한국 기술 적용 경로 확인",
  },
  scale: {
    title: "기존사업 연계 검토",
    condition: "수요 상대 위치 50 이상 · GCF 본사업 지원 상대 위치 50 이상",
    meaning: "수요와 기존 지원 기반이 함께 높은 국가군",
    action: "기존 사업 후속·공동사업·한국 기술 연계 검토",
  },
  monitor: {
    title: "추가 자료 확인",
    condition: "수요 상대 위치 50 미만 · GCF 본사업 지원 상대 위치 50 미만",
    meaning: "현재 지표 기준 수요와 기존 지원이 모두 낮은 국가군",
    action: "정책 변화·현지 요청·데이터 갱신 여부 확인",
  },
  gap: {
    title: "신규 협력 후보",
    condition: "수요 상대 위치 50 이상 · GCF 본사업 지원 상대 위치 50 미만",
    meaning: "수요에 비해 기존 GCF 본사업 지원이 낮은 국가군",
    action: "신규 양자협력·기술실증·재원 연계 가능성 확인",
  },
};

const SECONDARY_FOCUS_CONFIG: Record<
  Exclude<SecondaryFocus, "all">,
  {
    title: string;
    condition: string;
    meaning: string;
    action: string;
  }
> = {
  transition: {
    title: "사업화 전환 필요",
    condition: "Readiness 10건 이상 · Funded Activity 2건 이하",
    meaning: "준비지원은 누적됐으나 본사업 연결이 제한된 국가군",
    action: "Readiness 성과·본사업 전환 장애요인 확인",
  },
  "no-portfolio": {
    title: "GCF 포트폴리오 부재",
    condition: "Readiness 0건 · Funded Activity 0건",
    meaning: "GCF Readiness·본사업 지원 이력이 확인되지 않는 국가군",
    action: "미지원 사유·타 재원·현지 수요 확인",
  },
};

function demandValueForIndicator(
  indicatorId: IndicatorId,
  rawValue: number
): number {
  if (
    indicatorId === "electricity-access" ||
    indicatorId === "clean-cooking-access"
  ) {
    return Math.max(0, 100 - rawValue);
  }

  return rawValue;
}

function classifyMatrixQuadrant(
  demandPosition: number,
  supportPosition: number
): MatrixQuadrant {
  if (demandPosition >= 50 && supportPosition >= 50) {
    return "scale";
  }

  if (demandPosition >= 50 && supportPosition < 50) {
    return "gap";
  }

  if (demandPosition < 50 && supportPosition >= 50) {
    return "reference";
  }

  return "monitor";
}

function isPortfolioAbsent(row: InsightRow): boolean {
  return (
    row.gcf.readinessProjectCount === 0 && row.gcf.fundedActivityCount === 0
  );
}

function hasTransitionSignal(row: InsightRow): boolean {
  return (
    row.gcf.readinessProjectCount >= 10 && row.gcf.fundedActivityCount <= 2
  );
}

function isRowInSecondaryFocus(
  row: InsightRow,
  focus: SecondaryFocus
): boolean {
  if (focus === "transition") {
    return hasTransitionSignal(row);
  }

  if (focus === "no-portfolio") {
    return isPortfolioAbsent(row);
  }

  return true;
}

function getDemandBasisLabel(indicatorId: IndicatorId): string {
  if (indicatorId === "electricity-access") {
    return "전력 미접근 격차 · 100 − 전력 접근률";
  }

  if (indicatorId === "clean-cooking-access") {
    return "청정조리 미접근 격차 · 100 − 청정조리 접근률";
  }

  if (indicatorId === "grid-losses") {
    return "송배전 손실률 원값";
  }

  return "CCKP 고온체감 35°C 이상 연간 일수";
}

function getDemandCalculationLabel(
  indicatorId: IndicatorId,
  rawValue: number,
  demandValue: number
): string {
  if (indicatorId === "electricity-access") {
    return `100 − 전력 접근률 ${rawValue.toFixed(
      1
    )}% = 전력 미접근 격차 ${demandValue.toFixed(1)}%p`;
  }

  if (indicatorId === "clean-cooking-access") {
    return `100 − 청정조리 접근률 ${rawValue.toFixed(
      1
    )}% = 청정조리 미접근 격차 ${demandValue.toFixed(1)}%p`;
  }

  if (indicatorId === "grid-losses") {
    return `송배전 손실률 ${rawValue.toFixed(
      1
    )}% = 기후기술 수요값 ${demandValue.toFixed(1)}%`;
  }

  return `고온체감 35°C 이상 ${rawValue.toFixed(
    1
  )}일 = 적응 협력 수요값 ${demandValue.toFixed(1)}일`;
}

function getDemandDirectionLabel(indicatorId: IndicatorId): string {
  if (indicatorId === "electricity-access") {
    return "미접근 격차가 클수록 분산형 전원·미니그리드 협력 수요 증가";
  }

  if (indicatorId === "clean-cooking-access") {
    return "미접근 격차가 클수록 청정연료·조리기술 협력 수요 증가";
  }

  if (indicatorId === "grid-losses") {
    return "손실률이 높을수록 전력망 효율화·계량·손실관리 협력 수요 증가";
  }

  return "고온체감일수가 많을수록 고효율 냉방·도시열·보건·노동환경 적응 수요 증가";
}

function getSupportBasisLabel(metric: SupportMetric): string {
  return metric === "fundedActivityFinancingUsd"
    ? "GCF Countries 국가별 Funded Activity 승인재원 집계"
    : "GCF Countries 국가별 Funded Activity 건수 집계";
}

function getSupportCalculationLabel(
  metric: SupportMetric,
  value: number
): string {
  return metric === "fundedActivityFinancingUsd"
    ? `${formatUsd(value)} · 국가별 본사업 승인재원 집계`
    : `${Math.round(value).toLocaleString("ko-KR")}건 · 국가별 본사업 수 집계`;
}

const FLAG_ASSET_BASE =
  "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/1x1";

function getFlagAssetUrl(country: Country): string | null {
  const iso2 = (country.iso2 ?? "").trim().toLowerCase();

  return /^[a-z]{2}$/.test(iso2) ? `${FLAG_ASSET_BASE}/${iso2}.svg` : null;
}

function CountryFlag({
  country,
  className = "",
}: {
  country: Country;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const flagUrl = getFlagAssetUrl(country);

  useEffect(() => {
    setImageFailed(false);
  }, [country.iso2, country.iso3]);

  return (
    <span
      className={["country-flag-circle", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      {flagUrl && !imageFailed ? (
        <img
          className="country-flag-image"
          src={flagUrl}
          alt=""
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="country-flag-fallback">
          {country.iso3.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

function getRelativeLevel(value: number): "높음" | "낮음" {
  return value >= 50 ? "높음" : "낮음";
}

function getSelectionBasis(row: InsightRow): string {
  return [
    `수요 상대 위치 ${row.demandPosition}/100 → ${getRelativeLevel(
      row.demandPosition
    )}`,
    `GCF 본사업 지원 상대 위치 ${row.supportPosition}/100 → ${getRelativeLevel(
      row.supportPosition
    )}`,
  ].join(" · ");
}

function getAdditionalSignals(row: InsightRow): AdditionalSignal[] {
  const signals: AdditionalSignal[] = [];

  if (hasTransitionSignal(row)) {
    signals.push({
      id: "transition",
      title: "사업화 전환 필요",
      reason: `Readiness ${row.gcf.readinessProjectCount}건 · Funded Activity ${row.gcf.fundedActivityCount}건`,
      action: "Readiness 성과·본사업 전환 장애요인 확인",
    });
  }

  if (isPortfolioAbsent(row)) {
    signals.push({
      id: "no-portfolio",
      title: "GCF 포트폴리오 부재",
      reason: "Readiness 0건 · Funded Activity 0건",
      action: "미지원 사유·타 재원·현지 수요 확인",
    });
  }

  return signals;
}

function getCheckItems(row: InsightRow): string {
  const baseAction = MATRIX_QUADRANT_CONFIG[row.matrixQuadrant].action;
  const signals = getAdditionalSignals(row);

  if (signals.length === 0) {
    return baseAction;
  }

  return [baseAction, ...signals.map((signal) => signal.action)].join(" · ");
}

function formatDemandValue(indicatorId: IndicatorId, value: number): string {
  if (
    indicatorId === "electricity-access" ||
    indicatorId === "clean-cooking-access"
  ) {
    return `${value.toFixed(1)}%p`;
  }

  if (indicatorId === "heat-index-hi35") {
    return `${value.toFixed(1)}일`;
  }

  return `${value.toFixed(1)}%`;
}

function formatSupportValue(metric: SupportMetric, value: number): string {
  return metric === "fundedActivityFinancingUsd"
    ? formatUsd(value)
    : `${Math.round(value).toLocaleString("ko-KR")}건`;
}

function clampPercent(value: number): number {
  return Math.max(2, Math.min(98, value));
}

function createMatrixRows(rows: InsightRow[]): MatrixRow[] {
  const groups = new Map<string, InsightRow[]>();

  rows.forEach((row) => {
    const key = `${row.demandPosition}:${row.supportPosition}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  });

  const result: MatrixRow[] = [];

  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) =>
      a.country.iso3.localeCompare(b.country.iso3)
    );

    ordered.forEach((row, index) => {
      if (ordered.length === 1) {
        result.push({
          ...row,
          matrixX: clampPercent(row.demandPosition),
          matrixY: clampPercent(row.supportPosition),
        });
        return;
      }

      const angle = index * 2.399963229728653;
      const radius = Math.min(3.4, 0.8 + Math.sqrt(index) * 0.85);

      result.push({
        ...row,
        matrixX: clampPercent(row.demandPosition + Math.cos(angle) * radius),
        matrixY: clampPercent(row.supportPosition + Math.sin(angle) * radius),
      });
    });
  });

  return result;
}

function sortRowsByQuadrant(
  rows: InsightRow[],
  quadrant: MatrixQuadrant
): InsightRow[] {
  const sorted = [...rows];

  if (quadrant === "scale") {
    return sorted.sort(
      (a, b) =>
        b.demandPosition - a.demandPosition ||
        b.supportPosition - a.supportPosition
    );
  }

  if (quadrant === "reference") {
    return sorted.sort(
      (a, b) =>
        b.supportPosition - a.supportPosition ||
        a.demandPosition - b.demandPosition
    );
  }

  if (quadrant === "monitor") {
    return sorted.sort(
      (a, b) =>
        b.demandPosition - a.demandPosition ||
        b.supportPosition - a.supportPosition
    );
  }

  return sorted.sort(
    (a, b) =>
      b.demandPosition - a.demandPosition ||
      a.supportPosition - b.supportPosition
  );
}

function sortRowsBySecondaryFocus(
  rows: InsightRow[],
  focus: Exclude<SecondaryFocus, "all">
): InsightRow[] {
  if (focus === "transition") {
    return [...rows].sort(
      (a, b) =>
        b.gcf.readinessProjectCount - a.gcf.readinessProjectCount ||
        a.gcf.fundedActivityCount - b.gcf.fundedActivityCount
    );
  }

  return [...rows].sort((a, b) => b.demandPosition - a.demandPosition);
}

export default function CountryCandidateMatrix({
  onOpenCountry,
}: CooperationInsightsPageProps) {
  const [indicatorId, setIndicatorId] =
    useState<IndicatorId>("electricity-access");
  const [supportMetric, setSupportMetric] = useState<SupportMetric>(
    "fundedActivityFinancingUsd"
  );
  const [region, setRegion] = useState("all");
  const [priorityOnly, setPriorityOnly] = useState(true);
  const [ldcOnly, setLdcOnly] = useState(false);
  const [sidsOnly, setSidsOnly] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [secondaryFocus, setSecondaryFocus] = useState<SecondaryFocus>("all");
  const [selectedQuadrant, setSelectedQuadrant] =
    useState<MatrixQuadrant | null>("gap");
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [observations, setObservations] = useState<IndicatorObservation[]>([]);
  const [portfolio, setPortfolio] = useState<GcfCountryPortfolio | null>(null);
  const [solarDataset, setSolarDataset] =
    useState<SolarPotentialDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const demandConfig = getIndicatorConfig(indicatorId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const [countryResult, indicatorResult, gcfResult, solarResult] =
        await Promise.all([
          loadCountries(),
          loadIndicatorData(indicatorId),
          loadGcfCountryPortfolio(),
          loadSolarPotentialDataset().catch(() => null),
        ]);

      if (cancelled) return;

      setCountries(countryResult.countries);
      setObservations(indicatorResult.observations);
      setPortfolio(gcfResult);
      setSolarDataset(solarResult);
      setWarning(
        [
          countryResult.warning,
          indicatorResult.warning,
          solarResult
            ? null
            : "태양광 잠재력 저장본 연결 실패 · 기술 잠재력 제외",
        ]
          .filter(Boolean)
          .join(" ") || null
      );
      setLoading(false);
    }

    void load().catch((error: unknown) => {
      if (cancelled) return;
      setWarning(
        error instanceof Error
          ? error.message
          : "협력 인사이트 데이터 로딩 실패"
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [indicatorId]);

  const availableYears = useMemo(
    () => getIndicatorYears(observations),
    [observations]
  );

  useEffect(() => {
    if (availableYears.length === 0) {
      setSelectedYear(null);
      return;
    }

    if (selectedYear === null || !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const countryIndex = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country])),
    [countries]
  );

  const observationIndex = useMemo(
    () => createObservationIndex(observations),
    [observations]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          countries
            .map((country) => country.region)
            .filter((item) => Boolean(item))
        )
      ).sort((a, b) => a.localeCompare(b, "ko")),
    [countries]
  );

  const rows = useMemo<InsightRow[]>(() => {
    if (selectedYear === null || !portfolio) return [];

    const base = portfolio.data.flatMap((gcfRecord) => {
      const country = countryIndex.get(gcfRecord.iso3);
      const rawValue = observationIndex.get(
        `${gcfRecord.iso3}:${selectedYear}`
      );

      if (!country || rawValue === undefined) return [];
      if (priorityOnly && !PRIORITY_COUNTRY_SET.has(country.iso3)) return [];
      if (region !== "all" && country.region !== region) return [];
      if (ldcOnly && !gcfRecord.ldc) return [];
      if (sidsOnly && !gcfRecord.sids) return [];

      return [
        {
          country,
          gcf: gcfRecord,
          rawValue,
          demandValue: demandValueForIndicator(indicatorId, rawValue),
          supportValue: gcfRecord[supportMetric],
        },
      ];
    });

    const demandValues = base.map((item) => item.demandValue);
    const supportValues = base.map((item) => item.supportValue);

    return base.map((item) => {
      const demandPosition = percentileRank(demandValues, item.demandValue);
      const supportPosition = percentileRank(supportValues, item.supportValue);

      return {
        ...item,
        demandPosition,
        supportPosition,
        matrixQuadrant: classifyMatrixQuadrant(demandPosition, supportPosition),
      };
    });
  }, [
    countryIndex,
    indicatorId,
    ldcOnly,
    observationIndex,
    portfolio,
    priorityOnly,
    region,
    selectedYear,
    sidsOnly,
    supportMetric,
  ]);

  const quadrantRows = useMemo<Record<MatrixQuadrant, InsightRow[]>>(
    () => ({
      reference: rows.filter((row) => row.matrixQuadrant === "reference"),
      scale: rows.filter((row) => row.matrixQuadrant === "scale"),
      monitor: rows.filter((row) => row.matrixQuadrant === "monitor"),
      gap: rows.filter((row) => row.matrixQuadrant === "gap"),
    }),
    [rows]
  );

  const transitionRows = useMemo(
    () => rows.filter(hasTransitionSignal),
    [rows]
  );

  const noPortfolioRows = useMemo(() => rows.filter(isPortfolioAbsent), [rows]);

  const focusedRows = useMemo(() => {
    if (selectedQuadrant !== null) {
      return sortRowsByQuadrant(
        quadrantRows[selectedQuadrant],
        selectedQuadrant
      );
    }

    if (secondaryFocus === "transition") {
      return sortRowsBySecondaryFocus(transitionRows, "transition");
    }

    if (secondaryFocus === "no-portfolio") {
      return sortRowsBySecondaryFocus(noPortfolioRows, "no-portfolio");
    }

    return [...rows].sort(
      (a, b) =>
        b.demandPosition - a.demandPosition ||
        a.supportPosition - b.supportPosition
    );
  }, [
    noPortfolioRows,
    quadrantRows,
    rows,
    secondaryFocus,
    selectedQuadrant,
    transitionRows,
  ]);

  const matrixRows = useMemo(() => createMatrixRows(rows), [rows]);

  useEffect(() => {
    if (focusedRows.length === 0) {
      setSelectedIso3(null);
      return;
    }

    if (
      selectedIso3 === null ||
      !focusedRows.some((row) => row.country.iso3 === selectedIso3)
    ) {
      setSelectedIso3(focusedRows[0].country.iso3);
    }
  }, [focusedRows, selectedIso3]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.country.iso3 === selectedIso3) ?? null,
    [rows, selectedIso3]
  );

  const selectedSolarRecord = useMemo(
    () => getSolarPotentialRecord(solarDataset, selectedIso3),
    [selectedIso3, solarDataset]
  );

  const quadrantSummaryItems: Array<{
    id: MatrixQuadrant;
    count: number;
  }> = (["reference", "scale", "monitor", "gap"] as MatrixQuadrant[]).map(
    (id) => ({
      id,
      count: quadrantRows[id].length,
    })
  );

  const secondaryItems: Array<{
    id: Exclude<SecondaryFocus, "all">;
    count: number;
  }> = [
    { id: "transition", count: transitionRows.length },
    { id: "no-portfolio", count: noPortfolioRows.length },
  ];

  const selectedGroupTitle = selectedQuadrant
    ? MATRIX_QUADRANT_CONFIG[selectedQuadrant].title
    : secondaryFocus === "all"
    ? "전체 국가"
    : SECONDARY_FOCUS_CONFIG[secondaryFocus].title;

  const selectedGroupDescription = selectedQuadrant
    ? `${MATRIX_QUADRANT_CONFIG[selectedQuadrant].condition} · ${MATRIX_QUADRANT_CONFIG[selectedQuadrant].meaning}`
    : secondaryFocus === "all"
    ? "현재 필터 내 유효값 국가 전체"
    : `${SECONDARY_FOCUS_CONFIG[secondaryFocus].condition} · ${SECONDARY_FOCUS_CONFIG[secondaryFocus].meaning}`;

  if (loading) {
    return (
      <div className="page-shell cooperation-insights-page">
        <div className="cooperation-insights-state" role="status">
          기후기술 수요·GCF 지원 데이터 결합 중
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell cooperation-insights-page">
      <header className="cooperation-insights-header">
        <div>
          <span className="eyebrow dark">의사결정 지원</span>
          <h1>국가 후보 비교</h1>
          <p>
            국가 평균 수요지표와 기존 GCF 본사업 지원을 비교해 후속 검토 국가를
            찾는 1차 탐색
          </p>
        </div>
        <div className="cooperation-insights-source">
          <strong>GCF 국가 포트폴리오</strong>
          <span>기준일 {portfolio?.metadata.snapshotDate}</span>
          <a
            href={portfolio?.metadata.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            원 데이터 확인 ↗
          </a>
        </div>
      </header>

      {warning && <div className="cooperation-insights-warning">{warning}</div>}

      <section
        className="cooperation-insights-controls"
        aria-label="인사이트 조건"
      >
        <label>
          <span>수요 지표</span>
          <select
            value={indicatorId}
            onChange={(event) =>
              setIndicatorId(event.target.value as IndicatorId)
            }
          >
            {DEMAND_INDICATORS.map((id) => {
              const config = getIndicatorConfig(id);
              return (
                <option key={id} value={id}>
                  {config.mapTitleKo}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          <span>{getIndicatorTimeLabel(demandConfig)}</span>
          <select
            value={selectedYear ?? ""}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            disabled={Boolean(demandConfig.referencePeriodLabel)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {formatIndicatorReferencePeriod(demandConfig, year)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>GCF 본사업 기준</span>
          <select
            value={supportMetric}
            onChange={(event) =>
              setSupportMetric(event.target.value as SupportMetric)
            }
          >
            {Object.entries(SUPPORT_METRIC_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>지역</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="all">전체 지역</option>
            {regionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="cooperation-insights-check">
          <input
            type="checkbox"
            checked={priorityOnly}
            onChange={(event) => setPriorityOnly(event.target.checked)}
          />
          <span>우선 구축국 10개국</span>
        </label>
        <label className="cooperation-insights-check">
          <input
            type="checkbox"
            checked={ldcOnly}
            onChange={(event) => setLdcOnly(event.target.checked)}
          />
          <span>LDC만</span>
        </label>
        <label className="cooperation-insights-check">
          <input
            type="checkbox"
            checked={sidsOnly}
            onChange={(event) => setSidsOnly(event.target.checked)}
          />
          <span>SIDS만</span>
        </label>
      </section>

      <section className="cooperation-summary-section">
        <div className="cooperation-section-heading">
          <div>
            <h2>4개 협력 유형</h2>
            <p>수요·기존 GCF 본사업 지원의 높은 절반·낮은 절반 조합</p>
          </div>
          <button
            type="button"
            className={
              secondaryFocus === "all" && selectedQuadrant === null
                ? "summary-reset active"
                : "summary-reset"
            }
            onClick={() => {
              setSecondaryFocus("all");
              setSelectedQuadrant(null);
            }}
          >
            전체 국가 보기
          </button>
        </div>

        <div className="cooperation-summary-grid">
          {quadrantSummaryItems.map((item) => {
            const config = MATRIX_QUADRANT_CONFIG[item.id];

            return (
              <button
                key={item.id}
                type="button"
                className={
                  selectedQuadrant === item.id
                    ? `cooperation-summary-card ${item.id} active`
                    : `cooperation-summary-card ${item.id}`
                }
                onClick={() => {
                  setSelectedQuadrant(item.id);
                  setSecondaryFocus("all");
                }}
              >
                <span className="summary-card-kicker">{config.title}</span>
                <strong>{item.count.toLocaleString("ko-KR")}개국</strong>
                <small>{config.condition}</small>
                <b>{config.action}</b>
              </button>
            );
          })}
        </div>

        <div className="cooperation-secondary-section">
          <div>
            <h3>추가 검토 유형</h3>
            <p>4개 협력 유형과 별도 확인 · Readiness·Funded Activity 이력</p>
          </div>
          <div className="cooperation-secondary-grid">
            {secondaryItems.map((item) => {
              const config = SECONDARY_FOCUS_CONFIG[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selectedQuadrant === null && secondaryFocus === item.id
                      ? `cooperation-secondary-card ${item.id} active`
                      : `cooperation-secondary-card ${item.id}`
                  }
                  onClick={() => {
                    setSelectedQuadrant(null);
                    setSecondaryFocus(item.id);
                  }}
                >
                  <span>{config.title}</span>
                  <strong>{item.count.toLocaleString("ko-KR")}개국</strong>
                  <small>{config.condition}</small>
                  <b>{config.action}</b>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cooperation-matrix-section">
        <div className="cooperation-section-heading">
          <div>
            <h2>국가별 수요 신호와 기존 GCF 본사업 지원 비교</h2>
            <p>국기 선택 시 사용한 지표·지원자료·추가 확인사항 확인</p>
          </div>
          <span>{rows.length}개 국가·경제</span>
        </div>

        <div className="cooperation-calculation-flow" aria-label="분석 구성">
          <article>
            <span>1</span>
            <div>
              <strong>기후기술 수요 도출</strong>
              <b>{getDemandBasisLabel(indicatorId)}</b>
              <small>{getDemandDirectionLabel(indicatorId)}</small>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <strong>기존 GCF 본사업 지원</strong>
              <b>{getSupportBasisLabel(supportMetric)}</b>
              <small>
                GCF Countries · 기준일 {portfolio?.metadata.snapshotDate}
              </small>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <strong>국가 간 상대 비교</strong>
              <b>현재 필터 국가를 낮은 값부터 0–100으로 배열</b>
              <small>필터 변경 시 수요·지원 상대 위치 재계산</small>
            </div>
          </article>
          <article>
            <span>4</span>
            <div>
              <strong>국가 후보 구분</strong>
              <b>50 이상 높은 절반 · 50 미만 낮은 절반</b>
              <small>종합점수 없음 · 수요와 지원 두 축 개별 비교</small>
            </div>
          </article>
        </div>

        <div
          className="cooperation-reading-guide"
          aria-label="매트릭스 읽는 법"
        >
          <span>
            <b>오른쪽</b> 기후기술 수요 증가
          </span>
          <span>
            <b>위쪽</b> 기존 GCF 본사업 지원 증가
          </span>
          <span>
            <b>국기</b> 국가 선택
          </span>
          <span>
            <b>테두리 색</b> 협력 유형
          </span>
          <span>
            <b>유형 선택</b> 해당 국가 전체 확인
          </span>
        </div>

        <div className="cooperation-matrix-layout">
          <div className="cooperation-matrix-wrap">
            <div
              className="cooperation-matrix"
              aria-label="기후기술 수요와 기존 GCF 본사업 지원 매트릭스"
            >
              <div className="matrix-zone matrix-zone-reference" />
              <div className="matrix-zone matrix-zone-scale" />
              <div className="matrix-zone matrix-zone-monitor" />
              <div className="matrix-zone matrix-zone-gap" />

              {(
                ["reference", "scale", "monitor", "gap"] as MatrixQuadrant[]
              ).map((quadrant) => {
                const config = MATRIX_QUADRANT_CONFIG[quadrant];
                const count = quadrantRows[quadrant].length;

                return (
                  <button
                    key={quadrant}
                    type="button"
                    className={[
                      "matrix-quadrant",
                      `matrix-${quadrant}`,
                      selectedQuadrant === quadrant ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={selectedQuadrant === quadrant}
                    aria-label={`${config.title} · ${config.condition} · ${config.meaning} · ${count}개국`}
                    onClick={() => {
                      setSelectedQuadrant(quadrant);
                      setSecondaryFocus("all");
                    }}
                  >
                    <span className="matrix-quadrant-title">
                      {config.title}
                    </span>
                    <small>{count.toLocaleString("ko-KR")}개국 · 선택</small>
                    <span className="matrix-quadrant-tooltip" role="tooltip">
                      <b>{config.condition}</b>
                      <span>{config.meaning}</span>
                      <span>{config.action}</span>
                    </span>
                  </button>
                );
              })}

              <span className="matrix-axis-y">
                기존 GCF 본사업 지원 낮음 → 높음
              </span>
              <span className="matrix-axis-x">기후기술 수요 낮음 → 높음</span>

              {matrixRows.map((row) => {
                const inFocus = selectedQuadrant
                  ? row.matrixQuadrant === selectedQuadrant
                  : isRowInSecondaryFocus(row, secondaryFocus);
                const selected = row.country.iso3 === selectedIso3;
                const quadrantTitle =
                  MATRIX_QUADRANT_CONFIG[row.matrixQuadrant].title;

                return (
                  <button
                    key={row.country.iso3}
                    type="button"
                    className={[
                      "matrix-point",
                      `point-${row.matrixQuadrant}`,
                      (selectedQuadrant !== null || secondaryFocus !== "all") &&
                      !inFocus
                        ? "is-muted"
                        : "",
                      inFocus ? "is-focus" : "",
                      selected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      left: `${row.matrixX}%`,
                      bottom: `${row.matrixY}%`,
                    }}
                    title={`${row.country.nameKo} · ${quadrantTitle} · 수요 상대 위치 ${row.demandPosition}/100 · 본사업 지원 상대 위치 ${row.supportPosition}/100`}
                    onClick={() => setSelectedIso3(row.country.iso3)}
                  >
                    <CountryFlag
                      country={row.country}
                      className="matrix-country-flag"
                    />
                    <span className="sr-only">{row.country.nameKo}</span>
                  </button>
                );
              })}
            </div>

            <p className="cooperation-matrix-note">
              현재 필터 국가 내 상대 비교 · 동일 위치 국기 분산 표시 · 개별
              기술·사업의 타당성 판단 아님
            </p>
          </div>

          <aside className="cooperation-selected-card" aria-live="polite">
            {selectedRow ? (
              <>
                <span
                  className={`selected-classification quadrant-${selectedRow.matrixQuadrant}`}
                >
                  {MATRIX_QUADRANT_CONFIG[selectedRow.matrixQuadrant].title}
                </span>
                <div className="selected-country-heading">
                  <CountryFlag
                    country={selectedRow.country}
                    className="selected-country-flag"
                  />
                  <div>
                    <h3>{selectedRow.country.nameKo}</h3>
                    <p className="selected-country-meta">
                      {selectedRow.country.region} · {selectedRow.country.iso3}
                    </p>
                  </div>
                </div>

                <dl className="selected-metric-grid">
                  <div>
                    <dt>수요 원값</dt>
                    <dd>
                      {formatDemandValue(indicatorId, selectedRow.demandValue)}
                    </dd>
                  </div>
                  <div>
                    <dt>수요 상대 위치</dt>
                    <dd>{selectedRow.demandPosition}/100</dd>
                  </div>
                  <div>
                    <dt>{SUPPORT_METRIC_LABELS[supportMetric]}</dt>
                    <dd>
                      {formatSupportValue(
                        supportMetric,
                        selectedRow.supportValue
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>본사업 지원 상대 위치</dt>
                    <dd>{selectedRow.supportPosition}/100</dd>
                  </div>
                </dl>

                <div className="selected-calculation-grid">
                  <article>
                    <span>수요 산식</span>
                    <b>
                      {getDemandCalculationLabel(
                        indicatorId,
                        selectedRow.rawValue,
                        selectedRow.demandValue
                      )}
                    </b>
                    <small>{getDemandDirectionLabel(indicatorId)}</small>
                  </article>
                  <article>
                    <span>GCF 지원 구성</span>
                    <b>
                      {getSupportCalculationLabel(
                        supportMetric,
                        selectedRow.supportValue
                      )}
                    </b>
                    <small>
                      Funded Activity 국가별 집계 · Readiness는 추가 신호에만
                      사용
                    </small>
                  </article>
                </div>

                <div className="selected-decision-block selected-type">
                  <span>국가 후보 유형</span>
                  <p>
                    {MATRIX_QUADRANT_CONFIG[selectedRow.matrixQuadrant].title}
                  </p>
                </div>

                <div className="selected-decision-block selected-basis">
                  <span>후보 유형 산정</span>
                  <p>{getSelectionBasis(selectedRow)}</p>
                </div>

                {getAdditionalSignals(selectedRow).length > 0 && (
                  <div className="selected-signal-area">
                    <span>추가 신호</span>
                    <div className="selected-signal-list">
                      {getAdditionalSignals(selectedRow).map((signal) => (
                        <article key={signal.id}>
                          <b>{signal.title}</b>
                          <small>{signal.reason}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <div className="selected-decision-block selected-action">
                  <span>확인 항목</span>
                  <p>{getCheckItems(selectedRow)}</p>
                </div>

                <div className="selected-solar-evidence">
                  <span>기술 잠재력</span>
                  {selectedSolarRecord ? (
                    <>
                      <dl>
                        <div>
                          <dt>태양광 발전 잠재량(PVOUT)</dt>
                          <dd>
                            {selectedSolarRecord.pvoutLevel1DailyKwhKwp === null
                              ? "자료 없음"
                              : `${selectedSolarRecord.pvoutLevel1DailyKwhKwp.toFixed(
                                  2
                                )} kWh/kWp/day`}
                          </dd>
                        </div>
                        <div>
                          <dt>수평면 전일사량(GHI)</dt>
                          <dd>
                            {selectedSolarRecord.ghiDailyKwhM2 === null
                              ? "자료 없음"
                              : `${selectedSolarRecord.ghiDailyKwhM2.toFixed(
                                  2
                                )} kWh/m²/day`}
                          </dd>
                        </div>
                      </dl>
                      <small>
                        국가 평균 장기값 · 태양광 사업 검토 시
                        부지·계통·인허가·비용 추가 확인
                      </small>
                    </>
                  ) : (
                    <p>태양광 잠재력 자료 없음</p>
                  )}
                </div>

                <NdcPolicyPanel
                  iso3={selectedRow.country.iso3}
                  mode="compact"
                />

                <button
                  type="button"
                  className="primary-button selected-country-cta"
                  onClick={() => onOpenCountry(selectedRow.country.iso3)}
                >
                  국가 프로필 확인
                </button>
              </>
            ) : (
              <div className="cooperation-insight-empty">
                선택 조건에 해당하는 국가 없음
              </div>
            )}
          </aside>
        </div>

        <div className="cooperation-country-browser">
          <div className="cooperation-country-browser-heading">
            <div>
              <h3>{selectedGroupTitle} 국가</h3>
              <p>{selectedGroupDescription}</p>
            </div>
            <span>{focusedRows.length.toLocaleString("ko-KR")}개국</span>
          </div>

          {focusedRows.length > 0 ? (
            <div className="cooperation-country-grid">
              {focusedRows.map((row) => (
                <button
                  key={row.country.iso3}
                  type="button"
                  className={
                    row.country.iso3 === selectedIso3
                      ? "cooperation-country-option active"
                      : "cooperation-country-option"
                  }
                  aria-pressed={row.country.iso3 === selectedIso3}
                  onClick={() => setSelectedIso3(row.country.iso3)}
                >
                  <div className="country-option-identity">
                    <CountryFlag country={row.country} />
                    <strong>
                      {row.country.nameKo} <small>{row.country.iso3}</small>
                    </strong>
                  </div>
                  <span>{row.country.region}</span>
                  <em>
                    수요 {row.demandPosition}/100 · 본사업 지원{" "}
                    {row.supportPosition}/100
                  </em>
                </button>
              ))}
            </div>
          ) : (
            <div className="cooperation-insight-empty">
              선택 조건에 해당하는 국가 없음
            </div>
          )}
        </div>
      </section>

      <section className="cooperation-evidence-table-section">
        <div className="cooperation-section-heading">
          <div>
            <h2>{selectedGroupTitle} 국가별 근거</h2>
            <p>원값·상대 위치·협력 유형·추가 신호·확인 항목</p>
          </div>
          <span>{focusedRows.length}개 국가·경제</span>
        </div>

        {focusedRows.length > 0 ? (
          <div className="resource-table-wrapper cooperation-evidence-table-wrap">
            <table className="resource-table cooperation-evidence-table">
              <thead>
                <tr>
                  <th>국가</th>
                  <th>수요 근거</th>
                  <th>{SUPPORT_METRIC_LABELS[supportMetric]}</th>
                  <th>협력 유형</th>
                  <th>확인 항목</th>
                </tr>
              </thead>
              <tbody>
                {focusedRows.map((row) => {
                  const signals = getAdditionalSignals(row);

                  return (
                    <tr key={row.country.iso3}>
                      <td>
                        <div className="evidence-country-identity">
                          <CountryFlag country={row.country} />
                          <button
                            type="button"
                            className="text-button"
                            aria-pressed={row.country.iso3 === selectedIso3}
                            onClick={() => setSelectedIso3(row.country.iso3)}
                          >
                            {row.country.nameKo} ({row.country.iso3})
                          </button>
                        </div>
                        <small className="table-country-meta">
                          {row.country.region}
                          {row.gcf.ldc ? " · LDC" : ""}
                          {row.gcf.sids ? " · SIDS" : ""}
                        </small>
                      </td>
                      <td>
                        <strong>
                          {formatDemandValue(indicatorId, row.demandValue)}
                        </strong>
                        <small>상대 위치 {row.demandPosition}/100</small>
                      </td>
                      <td>
                        <strong>
                          {formatSupportValue(supportMetric, row.supportValue)}
                        </strong>
                        <small>상대 위치 {row.supportPosition}/100</small>
                      </td>
                      <td>
                        <strong>
                          {MATRIX_QUADRANT_CONFIG[row.matrixQuadrant].title}
                        </strong>
                        <small>{getSelectionBasis(row)}</small>
                        {signals.map((signal) => (
                          <small key={signal.id}>
                            추가 신호 · {signal.title} · {signal.reason}
                          </small>
                        ))}
                      </td>
                      <td>{getCheckItems(row)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cooperation-insight-empty">
            선택 조건에 해당하는 국가 없음
          </div>
        )}
      </section>

      <details className="cooperation-limitations">
        <summary>해석 시 유의사항</summary>
        <ul>
          {portfolio?.metadata.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>국가 평균 지표 · 지역 내부 격차·개별 사업 타당성 별도 확인</li>
          <li>상대 위치 · 현재 필터 국가를 낮은 값부터 정렬한 0–100 위치</li>
          <li>4개 협력 유형 · 수요·본사업 지원 상대 위치 50 기준</li>
          <li>
            사업화 전환·포트폴리오 부재 · Readiness·Funded Activity 이력 기반
            추가 신호
          </li>
          <li>최종 정책판정 아닌 1차 스크리닝</li>
        </ul>
      </details>
    </div>
  );
}
