import { useEffect, useMemo, useState } from "react";
import { loadCountries } from "../../data/countries";
import {
  formatRawValue,
  getIndicatorConfig,
  getLatestObservationForCountry,
  loadIndicatorData,
} from "../../data/indicators/registry";
import type {
  IndicatorId,
} from "../../data/indicators/registry";
import { loadSolarPotentialDataset } from "../../data/potential/solarPotential";
import type { Country } from "../../types/country";
import type {
  IndicatorDataResult,
  IndicatorObservation,
} from "../../types/indicator";
import "../../styles/data-element-layout-v100.css";

interface Props {
  elementId: string;
  initialCountryIso3?: string | null;
}

type BundleKind =
  | "multi_metric"
  | "paired_metric"
  | "composition_bundle"
  | "solar_bundle";

interface BundleDefinition {
  kind: BundleKind;
  indicatorIds: IndicatorId[];
  coreIndicatorIds?: IndicatorId[];
  titleKo: string;
  noteKo: string;
  differenceKpi?: {
    labelKo: string;
    noteKo: string;
  };
}

const BUNDLES: Record<string, BundleDefinition> = {
  "A-003": {
    kind: "multi_metric",
    indicatorIds: ["gdp-current", "gdp-growth", "gdp-per-capita"],
    titleKo: "경제 규모·성장·소득을 한 화면에서 확인",
    noteKo:
      "GDP·성장률·1인당 GDP는 단위가 달라 하나의 축에 겹치지 않고, 핵심값을 함께 본 뒤 선택한 지표의 추세와 국가비교를 확인합니다.",
  },
  "A-004": {
    kind: "paired_metric",
    indicatorIds: ["poverty-national", "poverty-extreme"],
    titleKo: "빈곤 지표를 정의별로 함께 확인",
    noteKo:
      "국가빈곤선과 국제 극빈곤선은 정의가 다르므로 값을 합치거나 단순 순위화하지 않고 각각의 기준연도를 표시합니다.",
  },
  "A-005": {
    kind: "composition_bundle",
    indicatorIds: [
      "sector-agriculture-share",
      "sector-industry-share",
      "sector-services-share",
      "sector-manufacturing-share",
    ],
    coreIndicatorIds: [
      "sector-agriculture-share",
      "sector-industry-share",
      "sector-services-share",
    ],
    titleKo: "경제구조 구성과 제조업 비중을 함께 확인",
    noteKo:
      "농림어업·산업(건설 포함)·서비스는 경제구조의 주 구성입니다. 제조업은 산업의 하위범주이므로 100% 구성 막대에는 중복 포함하지 않고 별도 참고지표로 표시합니다.",
  },
  "A-006": {
    kind: "paired_metric",
    indicatorIds: ["unemployment-total", "unemployment-youth"],
    titleKo: "전체·청년 노동시장 지표를 함께 확인",
    noteKo:
      "두 실업률을 같은 화면에서 비교하되, 기후기술 전문인력 가용성을 직접 의미하지는 않습니다.",
    differenceKpi: {
      labelKo: "청년-전체 실업률 격차",
      noteKo: "청년 실업률 - 전체 실업률",
    },
  },
  "A-007": {
    kind: "multi_metric",
    indicatorIds: [
      "population-total",
      "urbanization-share",
      "population-growth",
    ],
    titleKo: "인구 규모·도시화·증가속도를 함께 확인",
    noteKo:
      "총인구·도시화율·증가율은 단위와 의미가 달라 핵심값을 함께 제시하고 선택한 지표의 추세를 분리해 보여줍니다.",
  },
  "B-041": {
    kind: "solar_bundle",
    indicatorIds: ["solar-pvout", "solar-ghi"],
    titleKo: "태양광 자원 프로필",
    noteKo:
      "PVOUT와 GHI는 서로 다른 단위의 보완지표입니다. 국가 평균 장기값을 함께 확인하고 실제 사업성은 부지·계통·인허가·비용을 추가 검토합니다.",
  },
};

export function supportsElementIndicatorBundleV100(elementId: string): boolean {
  return Boolean(BUNDLES[elementId]);
}

export default function ElementIndicatorBundleV100({
  elementId,
  initialCountryIso3 = null,
}: Props) {
  const definition = BUNDLES[elementId];
  if (!definition) return null;
  if (definition.kind === "solar_bundle") {
    return (
      <SolarBundle
        definition={definition}
        initialCountryIso3={initialCountryIso3}
      />
    );
  }
  return (
    <IndicatorBundle
      definition={definition}
      initialCountryIso3={initialCountryIso3}
    />
  );
}

function IndicatorBundle({
  definition,
  initialCountryIso3,
}: {
  definition: BundleDefinition;
  initialCountryIso3: string | null;
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [results, setResults] = useState<Record<string, IndicatorDataResult>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [selectedIso3, setSelectedIso3] = useState(initialCountryIso3 ?? "VNM");
  const [focusId, setFocusId] = useState<IndicatorId>(
    definition.indicatorIds[0]
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIso3(initialCountryIso3 ?? "VNM");
  }, [initialCountryIso3]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      loadCountries(),
      ...definition.indicatorIds.map((id) => loadIndicatorData(id)),
    ])
      .then(([countryResult, ...indicatorResults]) => {
        if (cancelled) return;
        setCountries(countryResult.countries);
        const next: Record<string, IndicatorDataResult> = {};
        definition.indicatorIds.forEach((id, index) => {
          next[id] = indicatorResults[index] as IndicatorDataResult;
        });
        setResults(next);
        setWarning(
          [
            countryResult.warning,
            ...indicatorResults.map((r) => (r as IndicatorDataResult).warning),
          ]
            .filter(Boolean)
            .join(" ")
        );
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setWarning(
          reason instanceof Error
            ? reason.message
            : "복합 지표 데이터를 불러오지 못했습니다"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [definition]);

  const countryIndex = useMemo(
    () => new Map(countries.map((c) => [c.iso3, c])),
    [countries]
  );
  const availableIso3 = useMemo(() => {
    const s = new Set<string>();
    Object.values(results).forEach((r) =>
      r.observations.forEach((o) => {
        if (typeof o.value === "number") s.add(o.iso3);
      })
    );
    return Array.from(s).sort((a, b) =>
      (countryIndex.get(a)?.nameKo ?? a).localeCompare(
        countryIndex.get(b)?.nameKo ?? b,
        "ko"
      )
    );
  }, [results, countryIndex]);

  useEffect(() => {
    if (!availableIso3.length) return;
    if (!availableIso3.includes(selectedIso3))
      setSelectedIso3(availableIso3.includes("VNM") ? "VNM" : availableIso3[0]);
  }, [availableIso3, selectedIso3]);

  const comparisonIds = definition.coreIndicatorIds ?? definition.indicatorIds;
  const commonYears = useMemo(
    () => getCommonYearsForCountry(comparisonIds, results, selectedIso3),
    [comparisonIds, results, selectedIso3]
  );
  useEffect(() => {
    if (
      definition.kind === "paired_metric" ||
      definition.kind === "composition_bundle"
    ) {
      setSelectedYear((current) =>
        current && commonYears.includes(current)
          ? current
          : commonYears[0] ?? null
      );
    }
  }, [definition.kind, commonYears]);

  if (loading)
    return <div className="v100-loading">통합 데이터를 불러오는 중</div>;
  if (!Object.keys(results).length)
    return <div className="v100-empty">표시 가능한 실제 데이터가 없습니다</div>;

  const countryName = countryIndex.get(selectedIso3)?.nameKo ?? selectedIso3;

  return (
    <div className="v100-bundle">
      {warning && <div className="detail-preview-warning">{warning}</div>}
      <header className="v100-bundle-head">
        <div>
          <span>데이터 항목 통합 보기</span>
          <h2>{definition.titleKo}</h2>
          <p>{definition.noteKo}</p>
        </div>
        <label>
          <span>국가</span>
          <select
            value={selectedIso3}
            onChange={(e) => setSelectedIso3(e.target.value)}
          >
            {availableIso3.map((iso3) => (
              <option key={iso3} value={iso3}>
                {countryIndex.get(iso3)?.nameKo ?? iso3} · {iso3}
              </option>
            ))}
          </select>
        </label>
      </header>

      {definition.kind === "composition_bundle" ? (
        <CompositionBundleView
          definition={definition}
          results={results}
          selectedIso3={selectedIso3}
          countryName={countryName}
          selectedYear={selectedYear}
          commonYears={commonYears}
          onYearChange={setSelectedYear}
          countryIndex={countryIndex}
        />
      ) : definition.kind === "paired_metric" ? (
        <PairedBundleView
          definition={definition}
          results={results}
          selectedIso3={selectedIso3}
          countryName={countryName}
          selectedYear={selectedYear}
          commonYears={commonYears}
          onYearChange={setSelectedYear}
          countryIndex={countryIndex}
        />
      ) : (
        <MultiMetricBundleView
          definition={definition}
          results={results}
          selectedIso3={selectedIso3}
          countryName={countryName}
          focusId={focusId}
          onFocusChange={setFocusId}
          countryIndex={countryIndex}
        />
      )}
    </div>
  );
}

function MultiMetricBundleView({
  definition,
  results,
  selectedIso3,
  countryName,
  focusId,
  onFocusChange,
  countryIndex,
}: {
  definition: BundleDefinition;
  results: Record<string, IndicatorDataResult>;
  selectedIso3: string;
  countryName: string;
  focusId: IndicatorId;
  onFocusChange: (id: IndicatorId) => void;
  countryIndex: Map<string, Country>;
}) {
  const latest = definition.indicatorIds.map((id) => ({
    id,
    config: getIndicatorConfig(id),
    obs: getLatestObservationForCountry(
      results[id]?.observations ?? [],
      selectedIso3
    ),
  }));
  const focusConfig = getIndicatorConfig(focusId);
  const series = (results[focusId]?.observations ?? [])
    .filter((o) => o.iso3 === selectedIso3 && typeof o.value === "number")
    .sort((a, b) => a.year - b.year)
    .slice(-10);
  const focusYear = series[series.length - 1]?.year ?? null;
  const rows =
    focusYear === null
      ? []
      : (results[focusId]?.observations ?? [])
          .filter((o) => o.year === focusYear && typeof o.value === "number")
          .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
          .slice(0, 12);
  return (
    <>
      <section className="v100-kpi-grid">
        {latest.map(({ id, config, obs }) => (
          <article key={id}>
            <span>{config.definition.titleKo}</span>
            <strong>{formatRawValue(config, obs?.value ?? null)}</strong>
            <small>{obs ? `${obs.year}년` : "자료 없음"}</small>
          </article>
        ))}
      </section>
      <div className="v100-two-col">
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>{countryName} 최근 추세</h3>
              <p>단위가 다른 지표는 겹치지 않고 하나씩 선택해 확인</p>
            </div>
            <select
              value={focusId}
              onChange={(e) => onFocusChange(e.target.value as IndicatorId)}
            >
              {definition.indicatorIds.map((id) => (
                <option value={id} key={id}>
                  {getIndicatorConfig(id).definition.titleKo}
                </option>
              ))}
            </select>
          </header>
          <SingleLineChart rows={series} configId={focusId} />
        </section>
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>국가별 비교</h3>
              <p>
                {focusYear
                  ? `${focusYear}년 · ${focusConfig.definition.titleKo}`
                  : "비교 가능한 값 없음"}
              </p>
            </div>
          </header>
          <SimpleCountryTable
            rows={rows}
            configId={focusId}
            countryIndex={countryIndex}
            selectedIso3={selectedIso3}
          />
        </section>
      </div>
    </>
  );
}

function PairedBundleView({
  definition,
  results,
  selectedIso3,
  countryName,
  selectedYear,
  commonYears,
  onYearChange,
  countryIndex,
}: {
  definition: BundleDefinition;
  results: Record<string, IndicatorDataResult>;
  selectedIso3: string;
  countryName: string;
  selectedYear: number | null;
  commonYears: number[];
  onYearChange: (y: number | null) => void;
  countryIndex: Map<string, Country>;
}) {
  const [aId, bId] = definition.indicatorIds;
  const a = getIndicatorConfig(aId),
    b = getIndicatorConfig(bId);
  const aLatest = getLatestObservationForCountry(
    results[aId]?.observations ?? [],
    selectedIso3
  );
  const bLatest = getLatestObservationForCountry(
    results[bId]?.observations ?? [],
    selectedIso3
  );
  const aSeries = (results[aId]?.observations ?? [])
    .filter((o) => o.iso3 === selectedIso3 && typeof o.value === "number")
    .sort((x, y) => x.year - y.year);
  const bSeries = (results[bId]?.observations ?? [])
    .filter((o) => o.iso3 === selectedIso3 && typeof o.value === "number")
    .sort((x, y) => x.year - y.year);
  const rows =
    selectedYear === null
      ? []
      : buildMultiCountryRows(
          [aId, bId],
          results,
          selectedYear,
          countryIndex
        ).slice(0, 50);
  const diff =
    definition.differenceKpi && aLatest?.value != null && bLatest?.value != null
      ? bLatest.value - aLatest.value
      : null;
  const showDifference = Boolean(definition.differenceKpi);
  return (
    <>
      <section className={`v100-kpi-grid ${showDifference ? "three" : "two"}`}>
        <article>
          <span>{a.definition.titleKo}</span>
          <strong>{formatRawValue(a, aLatest?.value ?? null)}</strong>
          <small>{aLatest ? `${aLatest.year}년` : "자료 없음"}</small>
        </article>
        <article>
          <span>{b.definition.titleKo}</span>
          <strong>{formatRawValue(b, bLatest?.value ?? null)}</strong>
          <small>{bLatest ? `${bLatest.year}년` : "자료 없음"}</small>
        </article>
        {showDifference && definition.differenceKpi && (
          <article className="muted">
            <span>{definition.differenceKpi.labelKo}</span>
            <strong>
              {diff === null
                ? "자료 없음"
                : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%p`}
            </strong>
            <small>{definition.differenceKpi.noteKo}</small>
          </article>
        )}
      </section>
      <div className="v100-two-col">
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>{countryName} 최근 추세</h3>
              <p>동일 단위 지표를 병렬 비교</p>
            </div>
          </header>
          <DualLineChart
            aRows={aSeries.slice(-10)}
            bRows={bSeries.slice(-10)}
            aLabel={a.definition.titleKo}
            bLabel={b.definition.titleKo}
          />
        </section>
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>국가별 동시 비교</h3>
              <p>두 지표가 모두 있는 동일 연도만 비교</p>
            </div>
            {commonYears.length > 0 && (
              <select
                value={selectedYear ?? ""}
                onChange={(e) => onYearChange(Number(e.target.value))}
              >
                {commonYears.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            )}
          </header>
          <MultiCountryTable
            rows={rows}
            ids={[aId, bId]}
            selectedIso3={selectedIso3}
          />
        </section>
      </div>
    </>
  );
}

function CompositionBundleView({
  definition,
  results,
  selectedIso3,
  countryName,
  selectedYear,
  commonYears,
  onYearChange,
  countryIndex,
}: {
  definition: BundleDefinition;
  results: Record<string, IndicatorDataResult>;
  selectedIso3: string;
  countryName: string;
  selectedYear: number | null;
  commonYears: number[];
  onYearChange: (y: number | null) => void;
  countryIndex: Map<string, Country>;
}) {
  const core =
    definition.coreIndicatorIds ?? definition.indicatorIds.slice(0, 3);
  const manufacturingId = "sector-manufacturing-share" as IndicatorId;
  const year = selectedYear;
  const values = core.map((id) => ({
    id,
    config: getIndicatorConfig(id),
    value: getValueAt(results[id]?.observations ?? [], selectedIso3, year),
  }));
  const manufacturing = getValueAt(
    results[manufacturingId]?.observations ?? [],
    selectedIso3,
    year
  );
  const sum = values.reduce((acc, x) => acc + (x.value ?? 0), 0);
  const residual = Math.max(0, 100 - sum);
  const usable =
    year !== null && values.every((x) => x.value !== null) && sum <= 103;
  const rows =
    year === null
      ? []
      : buildMultiCountryRows(
          [...core, manufacturingId],
          results,
          year,
          countryIndex
        ).slice(0, 80);
  return (
    <>
      <div className="v100-composition-control">
        <div>
          <b>{countryName} 경제구조</b>
          <span>농림어업·산업·서비스는 주 구성 · 제조업은 산업 하위범주</span>
        </div>
        {commonYears.length > 0 && (
          <label>
            <span>공통 기준연도</span>
            <select
              value={year ?? ""}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {commonYears.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <section className="v100-kpi-grid four">
        {values.map((x) => (
          <article key={x.id}>
            <span>{x.config.definition.titleKo}</span>
            <strong>
              {x.value === null ? "자료 없음" : `${x.value.toFixed(1)}%`}
            </strong>
            <small>{year ? `${year}년 · GDP 대비` : "공통연도 없음"}</small>
          </article>
        ))}
        <article className="reference">
          <span>제조업 비중 · 참고</span>
          <strong>
            {manufacturing === null
              ? "자료 없음"
              : `${manufacturing.toFixed(1)}%`}
          </strong>
          <small>산업(건설 포함)의 하위부문 · 합계에 중복 포함하지 않음</small>
        </article>
      </section>
      <div className="v100-two-col">
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>경제구조 구성</h3>
              <p>같은 연도의 농림어업·산업·서비스 비중</p>
            </div>
          </header>
          {usable ? (
            <>
              <div className="v100-composition-bar">
                {values.map((x) => (
                  <span
                    key={x.id}
                    className={`series-${x.id}`}
                    style={{ width: `${Math.max(0, x.value ?? 0)}%` }}
                    title={`${x.config.definition.titleKo} ${x.value?.toFixed(
                      1
                    )}%`}
                  />
                ))}
                {residual > 0.2 && (
                  <span
                    className="residual"
                    style={{ width: `${residual}%` }}
                    title={`기타·통계차이 ${residual.toFixed(1)}%`}
                  />
                )}
              </div>
              <div className="v100-composition-legend">
                {values.map((x) => (
                  <span key={x.id}>
                    <i className={`series-${x.id}`} />
                    {x.config.definition.titleKo}
                    <b>{x.value?.toFixed(1)}%</b>
                  </span>
                ))}
                {residual > 0.2 && (
                  <span>
                    <i className="residual" />
                    기타·통계차이<b>{residual.toFixed(1)}%</b>
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="v100-empty">
              세 주 구성지표의 동일 연도 값이 모두 있어야 구성비 막대를
              표시합니다
            </div>
          )}
          <div className="v100-definition-note">
            <b>왜 제조업을 막대에 넣지 않나요?</b>
            <span>
              제조업은 ‘산업(건설 포함)’의 일부이므로 농림어업·산업·서비스와
              함께 더하면 중복계산됩니다. 제조업은 산업구조를 해석하는 별도 참고
              KPI로 제공합니다.
            </span>
          </div>
        </section>
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>국가별 경제구조 비교</h3>
              <p>{year ? `${year}년 공통값` : "공통 기준연도 없음"}</p>
            </div>
          </header>
          <MultiCountryTable
            rows={rows}
            ids={[...core, manufacturingId]}
            selectedIso3={selectedIso3}
          />
        </section>
      </div>
      <section className="v100-panel">
        <header className="v100-panel-head">
          <div>
            <h3>{countryName} 최근 구성 변화</h3>
            <p>주 구성 3개와 제조업 참고지표를 분리해 추적</p>
          </div>
        </header>
        <div className="v100-small-multiples">
          {[...core, manufacturingId].map((id) => (
            <SmallTrend
              key={id}
              id={id}
              rows={(results[id]?.observations ?? [])
                .filter(
                  (o) => o.iso3 === selectedIso3 && typeof o.value === "number"
                )
                .sort((a, b) => a.year - b.year)
                .slice(-10)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function SolarBundle({
  definition,
  initialCountryIso3,
}: {
  definition: BundleDefinition;
  initialCountryIso3: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<any>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedIso3, setSelectedIso3] = useState(initialCountryIso3 ?? "VNM");
  const [warning, setWarning] = useState("");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadSolarPotentialDataset(), loadCountries()])
      .then(([solar, countryResult]) => {
        if (cancelled) return;
        setDataset(solar);
        setCountries(countryResult.countries);
        setWarning(countryResult.warning ?? "");
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setWarning(e instanceof Error ? e.message : "태양광 자료 로딩 실패");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const countryIndex = useMemo(
    () => new Map(countries.map((c) => [c.iso3, c])),
    [countries]
  );
  const records = dataset?.data ?? [];
  useEffect(() => {
    if (!records.length) return;
    if (!records.some((r: any) => r.iso3 === selectedIso3))
      setSelectedIso3(
        records.some((r: any) => r.iso3 === "VNM") ? "VNM" : records[0].iso3
      );
  }, [records, selectedIso3]);
  const record = records.find((r: any) => r.iso3 === selectedIso3);
  if (loading)
    return <div className="v100-loading">태양광 통합 자료를 불러오는 중</div>;
  if (!record)
    return <div className="v100-empty">표시 가능한 태양광 자료 없음</div>;
  const pv = record.pvoutLevel1DailyKwhKwp as number | null,
    ghi = record.ghiDailyKwhM2 as number | null;
  const monthly = Object.entries(record.monthlyPvoutDailyKwhKwp ?? {}).map(
    ([m, v]) => ({ m, v: v as number | null })
  );
  const max = Math.max(1, ...monthly.map((x) => x.v ?? 0));
  const top = [...records]
    .filter(
      (r: any) => r.pvoutLevel1DailyKwhKwp != null && r.ghiDailyKwhM2 != null
    )
    .sort(
      (a: any, b: any) => b.pvoutLevel1DailyKwhKwp - a.pvoutLevel1DailyKwhKwp
    )
    .slice(0, 20);
  return (
    <div className="v100-bundle">
      {warning && <div className="detail-preview-warning">{warning}</div>}
      <header className="v100-bundle-head">
        <div>
          <span>기술 잠재력 통합 보기</span>
          <h2>{definition.titleKo}</h2>
          <p>{definition.noteKo}</p>
        </div>
        <label>
          <span>국가</span>
          <select
            value={selectedIso3}
            onChange={(e) => setSelectedIso3(e.target.value)}
          >
            {records.map((r: any) => (
              <option key={r.iso3} value={r.iso3}>
                {countryIndex.get(r.iso3)?.nameKo ?? r.countryName} · {r.iso3}
              </option>
            ))}
          </select>
        </label>
      </header>
      <section className="v100-kpi-grid four">
        <article>
          <span>PVOUT</span>
          <strong>
            {pv == null ? "자료 없음" : `${pv.toFixed(2)} kWh/kWp/day`}
          </strong>
          <small>발전 잠재량</small>
        </article>
        <article>
          <span>GHI</span>
          <strong>
            {ghi == null ? "자료 없음" : `${ghi.toFixed(2)} kWh/m²/day`}
          </strong>
          <small>수평면 전일사량</small>
        </article>
        <article>
          <span>PVOUT 국가 중간값</span>
          <strong>
            {record.pvoutDistributionDailyKwhKwp?.median?.toFixed?.(2) ??
              "자료 없음"}
          </strong>
          <small>국가 내부 분포</small>
        </article>
        <article>
          <span>계절성 지수</span>
          <strong>
            {record.seasonalityIndex?.toFixed?.(2) ?? "자료 없음"}
          </strong>
          <small>월별 PVOUT 변동</small>
        </article>
      </section>
      <div className="v100-two-col">
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>월별 PVOUT</h3>
              <p>장기 월평균 · 계절 변동</p>
            </div>
          </header>
          <div className="v100-monthly-bars">
            {monthly.map((x: any) => (
              <div key={x.m}>
                <span>{x.v == null ? "-" : x.v.toFixed(2)}</span>
                <i
                  style={{
                    height: `${Math.max(3, ((x.v ?? 0) / max) * 100)}%`,
                  }}
                />
                <small>{monthLabel(x.m)}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="v100-panel">
          <header className="v100-panel-head">
            <div>
              <h3>국가별 태양광 자원 비교</h3>
              <p>PVOUT·GHI를 같은 행에서 확인</p>
            </div>
          </header>
          <div className="v100-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>국가</th>
                  <th>PVOUT</th>
                  <th>GHI</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r: any) => (
                  <tr
                    key={r.iso3}
                    className={r.iso3 === selectedIso3 ? "selected" : ""}
                  >
                    <td>{countryIndex.get(r.iso3)?.nameKo ?? r.countryName}</td>
                    <td>{r.pvoutLevel1DailyKwhKwp.toFixed(2)}</td>
                    <td>{r.ghiDailyKwhM2.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function getCommonYearsForCountry(
  ids: IndicatorId[],
  results: Record<string, IndicatorDataResult>,
  iso3: string
): number[] {
  const sets = ids.map(
    (id) =>
      new Set(
        (results[id]?.observations ?? [])
          .filter((o) => o.iso3 === iso3 && typeof o.value === "number")
          .map((o) => o.year)
      )
  );
  if (!sets.length) return [];
  return Array.from(sets[0])
    .filter((y) => sets.every((s) => s.has(y)))
    .sort((a, b) => b - a);
}
function getValueAt(
  rows: IndicatorObservation[],
  iso3: string,
  year: number | null
): number | null {
  if (year === null) return null;
  const o = rows.find(
    (x) => x.iso3 === iso3 && x.year === year && typeof x.value === "number"
  );
  return typeof o?.value === "number" ? o.value : null;
}
function buildMultiCountryRows(
  ids: IndicatorId[],
  results: Record<string, IndicatorDataResult>,
  year: number,
  countryIndex: Map<string, Country>
) {
  const isoSet = new Set<string>();
  ids.forEach((id) =>
    (results[id]?.observations ?? [])
      .filter((o) => o.year === year && typeof o.value === "number")
      .forEach((o) => isoSet.add(o.iso3))
  );
  return Array.from(isoSet)
    .map((iso3) => ({
      iso3,
      country: countryIndex.get(iso3)?.nameKo ?? iso3,
      values: Object.fromEntries(
        ids.map((id) => [
          id,
          getValueAt(results[id]?.observations ?? [], iso3, year),
        ])
      ),
    }))
    .filter((r) => ids.every((id) => r.values[id] !== null))
    .sort((a, b) => a.country.localeCompare(b.country, "ko"));
}
function SimpleCountryTable({
  rows,
  configId,
  countryIndex,
  selectedIso3,
}: {
  rows: IndicatorObservation[];
  configId: IndicatorId;
  countryIndex: Map<string, Country>;
  selectedIso3: string;
}) {
  const c = getIndicatorConfig(configId);
  return (
    <div className="v100-table-wrap">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            <th>{c.definition.titleKo}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.iso3}
              className={r.iso3 === selectedIso3 ? "selected" : ""}
            >
              <td>{countryIndex.get(r.iso3)?.nameKo ?? r.iso3}</td>
              <td>{formatRawValue(c, r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function MultiCountryTable({
  rows,
  ids,
  selectedIso3,
}: {
  rows: Array<{
    iso3: string;
    country: string;
    values: Record<string, number | null>;
  }>;
  ids: IndicatorId[];
  selectedIso3: string;
}) {
  return (
    <div className="v100-table-wrap">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            {ids.map((id) => (
              <th key={id}>{getIndicatorConfig(id).definition.titleKo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.iso3}
              className={r.iso3 === selectedIso3 ? "selected" : ""}
            >
              <td>{r.country}</td>
              {ids.map((id) => (
                <td key={id}>
                  {formatRawValue(getIndicatorConfig(id), r.values[id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function SingleLineChart({
  rows,
  configId,
}: {
  rows: IndicatorObservation[];
  configId: IndicatorId;
}) {
  if (rows.length < 2)
    return (
      <div className="v100-empty">
        추세를 표시할 연도별 값이 충분하지 않습니다
      </div>
    );
  const values = rows.map((r) => r.value as number);
  const path = makePath(values, 520, 180);
  const c = getIndicatorConfig(configId);
  return (
    <div className="v100-line">
      <svg
        viewBox="0 0 520 190"
        role="img"
        aria-label={`${c.definition.titleKo} 추세`}
      >
        <path d={path} />
      </svg>
      <div className="v100-axis">
        <span>{rows[0].year}</span>
        <span>{rows[rows.length - 1].year}</span>
      </div>
    </div>
  );
}
function DualLineChart({
  aRows,
  bRows,
  aLabel,
  bLabel,
}: {
  aRows: IndicatorObservation[];
  bRows: IndicatorObservation[];
  aLabel: string;
  bLabel: string;
}) {
  const years = Array.from(
    new Set([...aRows, ...bRows].map((r) => r.year))
  ).sort((a, b) => a - b);
  if (years.length < 2)
    return (
      <div className="v100-empty">
        동시 추세를 표시할 값이 충분하지 않습니다
      </div>
    );
  const all = [...aRows, ...bRows].map((r) => r.value as number);
  const min = Math.min(...all),
    max = Math.max(...all),
    range = Math.max(1e-9, max - min);
  const point = (rows: IndicatorObservation[]) =>
    rows
      .map((r) => {
        const x =
          18 + (years.indexOf(r.year) / Math.max(1, years.length - 1)) * 484;
        const y = 170 - (((r.value as number) - min) / range) * 145;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <div className="v100-line dual">
      <div className="v100-series-legend">
        <span>
          <i className="a" />
          {aLabel}
        </span>
        <span>
          <i className="b" />
          {bLabel}
        </span>
      </div>
      <svg viewBox="0 0 520 190">
        <polyline className="a" points={point(aRows)} />
        <polyline className="b" points={point(bRows)} />
      </svg>
      <div className="v100-axis">
        <span>{years[0]}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </div>
  );
}
function SmallTrend({
  id,
  rows,
}: {
  id: IndicatorId;
  rows: IndicatorObservation[];
}) {
  const c = getIndicatorConfig(id);
  return (
    <article>
      <span>{c.definition.titleKo}</span>
      {rows.length >= 2 ? (
        <svg viewBox="0 0 180 64">
          <path
            d={makePath(
              rows.map((r) => r.value as number),
              180,
              64,
              6
            )}
          />
        </svg>
      ) : (
        <small>추세 자료 부족</small>
      )}
      <b>{formatRawValue(c, rows[rows.length - 1]?.value ?? null)}</b>
    </article>
  );
}
function makePath(
  values: number[],
  width: number,
  height: number,
  padding = 12
) {
  if (values.length < 2) return "";
  const min = Math.min(...values),
    max = Math.max(...values),
    range = Math.max(1e-9, max - min);
  return values
    .map((v, i) => {
      const x =
        padding + (i / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
function monthLabel(key: string) {
  const map: Record<string, string> = {
    jan: "1월",
    feb: "2월",
    mar: "3월",
    apr: "4월",
    may: "5월",
    jun: "6월",
    jul: "7월",
    aug: "8월",
    sep: "9월",
    oct: "10월",
    nov: "11월",
    dec: "12월",
  };
  return map[key] ?? key;
}
