import { useEffect, useMemo, useState } from "react";
import { loadCountries } from "../../data/countries";
import {
  getIndicatorConfig,
  isIndicatorId,
  loadIndicatorData,
} from "../../data/indicators/registry";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { getDataDetailPresentationV117 } from "../../data/cooperation/dataDetailPresentationV117";
import type { Dataset } from "../../types/dataset";
import { COOPERATION_POLICY_EVIDENCE_V109 } from "../../data/policy/cooperationPolicyEvidenceV109";
import {
  createNdcCountryIndex,
  getNdcSubmissionYear,
  getVerifiedNdcPriorities,
  loadNdcTechnologyPriorities,
} from "../../data/policy/ndcTechnologyPriorities";
import { TNA_COUNTRY_PROFILES_V110 } from "../../data/policy/tnaTechnologyNeedsV110";
import { summarizeTnaCurrentnessV111 } from "../../data/policy/tnaCurrentnessV111";
import {
  getInternationalSupportRecordsV112,
  summarizeInternationalSupportV112,
} from "../../data/support/internationalSupportV112";
import {
  getGcfProjectsForCountryV80,
  getGcfProjectStatusLabelV80,
  loadGcfPriorityProjectsV80,
} from "../../data/gcf/gcfPriorityProjectsV80";
import { fetchOecdOdaCountryV113 } from "../../services/oecdOdaApiV113";
import { fetchMdbCountryPortfolioV113 } from "../../services/mdbProjectsApiV113";
import { formatUsdV114 } from "../../utils/dataElementComparisonV114";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import IndicatorCountryComparisonV114 from "./IndicatorCountryComparisonV114";
import "../../styles/data-element-compare-v114.css";

interface Props {
  elementId: string;
  elementName: string;
  currentCountryIso3: string;
  datasets: Dataset[];
}

type Scope = "selected" | "all";

type StructuredRow = {
  iso3: string;
  country: string;
  metric1Label: string;
  metric1: string;
  metric2Label: string;
  metric2: string;
  metric3Label?: string;
  metric3?: string;
  note?: string;
  source: string;
  sourceUrl: string;
  raw: unknown;
};

const POLICY_KIND_BY_ELEMENT: Record<string, "btr" | "nap" | "lt-leds"> = {
  "C-002": "btr",
  "C-003": "nap",
  "C-004": "lt-leds",
};

function countryName(iso3: string): string {
  return PRIORITY_COUNTRIES.find((item) => item.iso3 === iso3)?.nameKo ?? iso3;
}

function uniqueTechnologyCount(
  records: Array<{ mappedTechnologyIds: string[] }>
): number {
  return new Set(records.flatMap((item) => item.mappedTechnologyIds)).size;
}

function statusSummary(records: Array<{ status: string | null }>): string {
  const counts = new Map<string, number>();
  records.forEach((item) => {
    const key = item.status?.trim() || "상태 정보 없음";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return (
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => `${label} ${count}건`)
      .join(" · ") || "자료 없음"
  );
}

function CommonCountryControls({
  currentCountryIso3,
  selected,
  onSelectedChange,
  scope,
  onScopeChange,
}: {
  currentCountryIso3: string;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  scope: Scope;
  onScopeChange: (next: Scope) => void;
}) {
  function toggle(iso3: string) {
    if (selected.includes(iso3)) {
      if (selected.length <= 1 && iso3 === currentCountryIso3) return;
      onSelectedChange(selected.filter((item) => item !== iso3));
      return;
    }
    if (selected.length >= 4) return;
    onSelectedChange([...selected, iso3]);
  }

  return (
    <>
      <div className="v114-compare__segmented v114-compare__scope">
        <button
          type="button"
          className={scope === "selected" ? "active" : ""}
          onClick={() => onScopeChange("selected")}
        >
          선택 국가만
        </button>
        <button
          type="button"
          className={scope === "all" ? "active" : ""}
          onClick={() => onScopeChange("all")}
        >
          전체 국가 보기
        </button>
      </div>
      <div className="v114-compare__country-picker">
        <div>
          <strong>비교 국가 선택</strong>
          <small>최대 4개 · {selected.length}/4</small>
        </div>
        <div className="v114-compare__chips">
          {PRIORITY_COUNTRIES.map((item) => {
            const active = selected.includes(item.iso3);
            return (
              <button
                key={item.iso3}
                type="button"
                className={active ? "active" : ""}
                disabled={!active && selected.length >= 4}
                onClick={() => toggle(item.iso3)}
              >
                {item.nameKo}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function StructuredTable({ rows }: { rows: StructuredRow[] }) {
  if (!rows.length) {
    return (
      <div className="v114-compare__empty">
        선택 조건에서 비교할 자료가 없습니다.
      </div>
    );
  }
  return (
    <div className="v114-compare__table-wrap">
      <table>
        <thead>
          <tr>
            <th>국가</th>
            <th>핵심 비교 1</th>
            <th>핵심 비교 2</th>
            <th>핵심 비교 3</th>
            <th>자료 제공기관</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.iso3}>
              <td>
                <strong>{row.country}</strong>
                <small>{row.iso3}</small>
              </td>
              <td>
                <span>{row.metric1Label}</span>
                <b>{row.metric1}</b>
              </td>
              <td>
                <span>{row.metric2Label}</span>
                <b>{row.metric2}</b>
              </td>
              <td>
                <span>{row.metric3Label ?? "비고"}</span>
                <b>{row.metric3 ?? row.note ?? "-"}</b>
              </td>
              <td>
                <span>{row.source}</span>
                <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                  원자료 ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataElementComparisonV114({
  elementId,
  elementName,
  currentCountryIso3,
  datasets,
}: Props) {
  const detailPresentation = getDataDetailPresentationV117(elementId);
  const comparisonTitle = detailPresentation?.comparisonTitle ?? elementName;
  const indicatorDatasets = datasets.filter((dataset) =>
    isIndicatorId(dataset.indicatorId)
  );
  const [indicatorDatasetId, setIndicatorDatasetId] = useState(
    indicatorDatasets[0]?.id ?? ""
  );
  const [indicatorData, setIndicatorData] = useState<{
    observations: Awaited<ReturnType<typeof loadIndicatorData>>["observations"];
    countries: Awaited<ReturnType<typeof loadCountries>>["countries"];
  } | null>(null);
  const [selectedIso3, setSelectedIso3] = useState<string[]>([
    currentCountryIso3,
  ]);
  const [scope, setScope] = useState<Scope>("selected");
  const [rows, setRows] = useState<StructuredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIso3((current) =>
      current.includes(currentCountryIso3)
        ? current
        : Array.from(new Set([currentCountryIso3, ...current])).slice(0, 4)
    );
  }, [currentCountryIso3]);

  useEffect(() => {
    if (!indicatorDatasets.length) return;
    setIndicatorDatasetId((current) =>
      indicatorDatasets.some((dataset) => dataset.id === current)
        ? current
        : indicatorDatasets[0]?.id ?? ""
    );
  }, [datasets]);

  useEffect(() => {
    const dataset = indicatorDatasets.find(
      (item) => item.id === indicatorDatasetId
    );
    if (!dataset || !isIndicatorId(dataset.indicatorId)) {
      setIndicatorData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setWarning(null);
    Promise.all([loadIndicatorData(dataset.indicatorId), loadCountries()])
      .then(([data, countries]) => {
        if (cancelled) return;
        setIndicatorData({
          observations: data.observations,
          countries: countries.countries,
        });
        setWarning(
          [data.warning, countries.warning].filter(Boolean).join(" · ") || null
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWarning(
          error instanceof Error
            ? error.message
            : "비교 자료를 불러오지 못했습니다"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [indicatorDatasetId]);

  useEffect(() => {
    if (indicatorDatasets.length) return;
    let cancelled = false;
    setLoading(true);
    setWarning(null);
    const countryScope =
      scope === "all"
        ? PRIORITY_COUNTRIES.map((item) => item.iso3)
        : selectedIso3;

    async function build(): Promise<StructuredRow[]> {
      if (elementId === "C-001") {
        const data = await loadNdcTechnologyPriorities();
        const index = createNdcCountryIndex(data);
        return countryScope.map((iso3) => {
          const record = index.get(iso3);
          const priorities = getVerifiedNdcPriorities(record);
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "공식 NDC",
            metric1: record
              ? `${getNdcSubmissionYear(record) ?? "연도 미상"}년`
              : "자료 없음",
            metric2Label: "확인된 기술근거",
            metric2: `${priorities.length}건`,
            metric3Label: "검토상태",
            metric3:
              record?.priorityReviewStatus === "reviewed"
                ? "기술근거 검토"
                : "제출정보 확인",
            source: data.metadata.sourceOrganization,
            sourceUrl:
              record?.officialUrl ??
              "https://www4.unfccc.int/sites/NDCStaging/Pages/All.aspx",
            raw: record ?? null,
          };
        });
      }

      const policyKind = POLICY_KIND_BY_ELEMENT[elementId];
      if (policyKind) {
        return countryScope.map((iso3) => {
          const record = COOPERATION_POLICY_EVIDENCE_V109.find(
            (item) => item.countryIso3 === iso3 && item.kind === policyKind
          );
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "공식 제출현황",
            metric1: record?.statusLabelKo ?? "자료 없음",
            metric2Label: "문서연도",
            metric2: record?.documentYear ? `${record.documentYear}년` : "-",
            metric3Label: "제출일",
            metric3: record?.submissionDate ?? "-",
            source: "UNFCCC",
            sourceUrl:
              record?.documentUrl ?? record?.portalUrl ?? "https://unfccc.int/",
            raw: record ?? null,
          };
        });
      }

      if (elementId === "C-005") {
        return countryScope.map((iso3) => {
          const profile = TNA_COUNTRY_PROFILES_V110.find(
            (item) => item.countryIso3 === iso3
          );
          const technologies = profile?.technologies ?? [];
          const currentness = summarizeTnaCurrentnessV111(
            technologies.map((item) => item.id)
          );
          const mapped = technologies.filter((item) =>
            Boolean(item.mappedTechnologyId)
          );
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "TNA/TAP 우선기술",
            metric1: profile ? `${technologies.length}건` : "상세자료 미제공",
            metric2Label: "감축 · 적응",
            metric2: profile
              ? `${
                  technologies.filter((item) => item.track === "mitigation")
                    .length
                } · ${
                  technologies.filter((item) => item.track === "adaptation")
                    .length
                }`
              : "-",
            metric3Label: "최신 정책 재확인",
            metric3: profile
              ? `${currentness.reconfirmed}건 · 관련 기후기술 ${
                  new Set(mapped.map((item) => item.mappedTechnologyId)).size
                }개`
              : "-",
            source: "UNFCCC TT:CLEAR",
            sourceUrl:
              profile?.officialDocuments[0]?.url ??
              "https://unfccc.int/ttclear/tna/reports.html",
            raw: profile ?? null,
          };
        });
      }

      if (["D-018", "D-019", "D-023"].includes(elementId)) {
        return countryScope.map((iso3) => {
          const all = getInternationalSupportRecordsV112(iso3);
          const selected =
            elementId === "D-018"
              ? all.filter(
                  (item) => item.sourceOrganization === "Adaptation Fund"
                )
              : elementId === "D-019"
              ? all.filter((item) => item.sourceOrganization === "CTCN")
              : all;
          const summary = summarizeInternationalSupportV112(iso3);
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "사업·지원 건수",
            metric1: `${selected.length}건`,
            metric2Label: "관련 기후기술",
            metric2: `${uniqueTechnologyCount(selected)}개 분야`,
            metric3Label: "상태",
            metric3: statusSummary(selected),
            note:
              elementId === "D-023"
                ? `AF 승인액 ${formatUsdV114(summary.afApproved)}`
                : undefined,
            source:
              elementId === "D-018"
                ? "Adaptation Fund"
                : elementId === "D-019"
                ? "CTCN"
                : "CTCN · Adaptation Fund · GEF",
            sourceUrl:
              selected[0]?.sourceUrl ??
              "https://www.ctc-n.org/technical-assistance/projects",
            raw: selected,
          };
        });
      }

      if (elementId === "D-020") {
        const data = await loadGcfPriorityProjectsV80();
        return countryScope.map((iso3) => {
          const records = getGcfProjectsForCountryV80(data, iso3);
          const current = records.filter(
            (item) => item.countsTowardCurrentCountryPortfolio
          );
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "GCF 사업",
            metric1: `${current.length}건`,
            metric2Label: "상태",
            metric2:
              Array.from(
                new Set(
                  current.map((item) =>
                    getGcfProjectStatusLabelV80(item.status)
                  )
                )
              ).join(" · ") || "자료 없음",
            metric3Label: "수행기관",
            metric3:
              Array.from(new Set(current.map((item) => item.entity)))
                .slice(0, 3)
                .join(" · ") || "자료 없음",
            source: "Green Climate Fund",
            sourceUrl:
              records[0]?.countryPortfolioUrl ??
              "https://www.greenclimate.fund/projects",
            raw: records,
          };
        });
      }

      if (elementId === "D-011") {
        const settled = await Promise.allSettled(
          countryScope.map((iso3) => fetchOecdOdaCountryV113(iso3))
        );
        return countryScope.map((iso3, index) => {
          const result = settled[index];
          if (result.status === "rejected") {
            return {
              iso3,
              country: countryName(iso3),
              metric1Label: "ODA 실제 지출",
              metric1: "일시적으로 불러오지 못함",
              metric2Label: "ODA 약정",
              metric2: "일시적으로 불러오지 못함",
              metric3Label: "주요 공여기관",
              metric3: "-",
              source: "OECD",
              sourceUrl: "https://data-explorer.oecd.org/",
              raw: null,
            };
          }
          const data = result.value;
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: `실제 지출 · ${data.latestDisbursementYear ?? "-"}`,
            metric1: formatUsdV114(data.latestDisbursement),
            metric2Label: `약정 · ${data.latestCommitmentYear ?? "-"}`,
            metric2: formatUsdV114(data.latestCommitment),
            metric3Label: "주요 공여기관",
            metric3:
              data.topProviders
                .slice(0, 3)
                .map((item) => item.name)
                .join(" · ") || "자료 없음",
            source: "OECD",
            sourceUrl: data.sourceUrls.disbursement,
            raw: data,
          };
        });
      }

      if (elementId === "D-021") {
        const settled = await Promise.allSettled(
          countryScope.map((iso3) => fetchMdbCountryPortfolioV113(iso3))
        );
        return countryScope.map((iso3, index) => {
          const result = settled[index];
          if (result.status === "rejected") {
            return {
              iso3,
              country: countryName(iso3),
              metric1Label: "World Bank",
              metric1: "일시적으로 불러오지 못함",
              metric2Label: "ADB",
              metric2:
                iso3 === "EGY"
                  ? "ADB 대상지역 아님"
                  : "일시적으로 불러오지 못함",
              metric3Label: "금융정보",
              metric3: "기관별 원자료 확인",
              source: "World Bank · ADB",
              sourceUrl: "https://projects.worldbank.org/",
              raw: null,
            };
          }
          const data = result.value;
          return {
            iso3,
            country: countryName(iso3),
            metric1Label: "World Bank 진행·준비 사업",
            metric1: `${data.worldBank.length}건`,
            metric2Label: "ADB 진행·준비 사업",
            metric2:
              data.adbCoverage === "not_applicable"
                ? "ADB 대상지역 아님"
                : `${data.adb.length}건`,
            metric3Label: "상태",
            metric3: `WB ${statusSummary(data.worldBank)} · ADB ${
              data.adbCoverage === "not_applicable"
                ? "해당 없음"
                : statusSummary(data.adb)
            }`,
            source: "World Bank · ADB",
            sourceUrl:
              data.worldBank[0]?.sourceUrl ??
              data.adb[0]?.sourceUrl ??
              "https://projects.worldbank.org/",
            raw: data,
          };
        });
      }

      return [];
    }

    void build()
      .then((next) => {
        if (!cancelled) setRows(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRows([]);
          setWarning(
            error instanceof Error
              ? error.message
              : "비교 자료를 불러오지 못했습니다"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [elementId, scope, selectedIso3.join("|")]);

  if (indicatorDatasets.length) {
    const dataset =
      indicatorDatasets.find((item) => item.id === indicatorDatasetId) ??
      indicatorDatasets[0];
    const config =
      dataset && isIndicatorId(dataset.indicatorId)
        ? getIndicatorConfig(dataset.indicatorId)
        : null;
    return (
      <section className="v114-structured-comparison" aria-label="국가 비교">
        <div className="v114-structured-comparison__dataset">
          <div>
            <span>국가 비교</span>
            <h2>비교할 세부 데이터를 선택하세요</h2>
          </div>
          <select
            value={indicatorDatasetId}
            onChange={(event) => setIndicatorDatasetId(event.target.value)}
          >
            {indicatorDatasets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.titleKo}
              </option>
            ))}
          </select>
        </div>
        {warning && <div className="v114-compare__warning">{warning}</div>}
        {loading && (
          <div className="v114-compare__empty">
            비교 데이터를 불러오는 중입니다.
          </div>
        )}
        {!loading && indicatorData && config && dataset && (
          <IndicatorCountryComparisonV114
            config={config}
            observations={indicatorData.observations}
            countries={indicatorData.countries}
            currentCountryIso3={currentCountryIso3}
            elementId={elementId}
            elementName={dataset.titleKo}
            datasetId={dataset.id}
          />
        )}
      </section>
    );
  }

  function openDownloadSettings() {
    openDownloadHubV118({
      countryIso3: currentCountryIso3,
      elementId,
      datasetId: datasets[0]?.id ?? null,
    });
  }

  return (
    <section className="v114-structured-comparison" aria-label="국가 비교">
      <header className="v114-compare__header">
        <div>
          <span className="v114-compare__eyebrow">국가 비교</span>
          <h2>{comparisonTitle}</h2>
          <p>
            이 데이터의 성격에 맞는 항목으로 국가를 비교합니다. 정책·사업·재원
            자료는 수치형 지표처럼 임의 순위를 만들지 않습니다.
          </p>
        </div>
        <div className="v114-compare__download">
          <button
            type="button"
            onClick={openDownloadSettings}
            disabled={!rows.length}
          >
            다운로드 설정
          </button>
        </div>
      </header>

      <CommonCountryControls
        currentCountryIso3={currentCountryIso3}
        selected={selectedIso3}
        onSelectedChange={setSelectedIso3}
        scope={scope}
        onScopeChange={setScope}
      />
      {warning && <div className="v114-compare__warning">{warning}</div>}
      {loading ? (
        <div className="v114-compare__empty">
          국가 비교자료를 불러오는 중입니다.
        </div>
      ) : (
        <StructuredTable rows={rows} />
      )}
    </section>
  );
}
