import { useMemo, useState } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import {
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import { reviewedEntityAttributesV132 } from "../../../data/visualization/publicEntityFieldPolicyV132";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

import "./research-patent-analysis-v132.css";

interface Props {
  rows: SemanticObservationV125[];
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
}

type ResearchTypeV132 = "all" | "논문" | "특허";

type ResearchRecordV132 = {
  entity: VietnamEntityV124;
  type: Exclude<ResearchTypeV132, "all">;
  title: string;
  year: number | null;
  field: string;
  /** V138: the CTIS technology classes the source itself assigned, by code. */
  technologyClasses: string[];
  institution: string;
  collaboration: string;
  sourceUrl: string | null;
};

const ENTITY_FIELDS_V132 = {
  type: "documentType",
  field: "technologyField",
  institution: "institution",
  collaboration: "collaboration",
  year: "publicationYear",
  sourceUrl: "documentUrl",
} as const;

const PAGE_SIZE_V132 = 6;

export default function ResearchPatentAnalysisV132({
  rows,
  entities,
  detailTemplate,
  elementTitle,
}: Props) {
  const records = useMemo(
    () =>
      entities
        .map((entity) => researchRecordV132(entity, detailTemplate, elementTitle))
        .filter((record): record is ResearchRecordV132 => Boolean(record)),
    [detailTemplate, elementTitle, entities]
  );
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResearchTypeV132>("all");
  const [year, setYear] = useState("all");
  const [field, setField] = useState("all");
  const [page, setPage] = useState(1);

  const years = useMemo(
    () => uniqueSortedV132(records.flatMap((record) => record.year ? [String(record.year)] : []), true),
    [records]
  );
  // One option per class the source assigned; a document with two classes
  // is listed under each, the same way the breakdown above counts it.
  const fields = useMemo(
    () =>
      uniqueSortedV132(
        records.flatMap((record) =>
          record.technologyClasses.length ? record.technologyClasses : [record.field]
        ).filter(Boolean)
      ),
    [records]
  );
  const filtered = useMemo(() => {
    const needle = query.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
    return records.filter((record) => {
      if (type !== "all" && record.type !== type) return false;
      if (year !== "all" && String(record.year || "") !== year) return false;
      if (
        field !== "all" &&
        !(record.technologyClasses.length ? record.technologyClasses.includes(field) : record.field === field)
      ) {
        return false;
      }
      if (!needle) return true;
      return [record.title, record.field, record.institution, record.collaboration]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(needle);
    });
  }, [field, query, records, type, year]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_V132));
  const currentPage = Math.min(page, pageCount);
  const shown = filtered.slice(
    (currentPage - 1) * PAGE_SIZE_V132,
    currentPage * PAGE_SIZE_V132
  );

  const paperCount = records.filter((record) => record.type === "논문").length;
  const patentCount = records.filter((record) => record.type === "특허").length;
  const latestYear = Math.max(...records.flatMap((record) => record.year ? [record.year] : []));
  const institutionLabels = records.flatMap((record) =>
    splitPublicListV132(record.institution)
  );
  const institutions = new Set(institutionLabels);
  const nationalTrend = nationalPublicationTrendV132(rows);
  // V135: two published years cannot carry a trend line, so the section falls
  // back to an explicit before/after change instead of a two-point series.
  const nationalTrendDepthV135 = nationalTrend.reduce(
    (maximum, series) =>
      Math.max(maximum, new Set(series.points.map((point) => point.x)).size),
    0
  );
  // V138: the delivery classifies every row into the 38 CTIS technologies in
  // its own evidence column ("(CTIS-30 취약성·위험성 평가)"), with the basis
  // stated beside it. That is the source's classification, not an estimate
  // made here; a row assigned two classes counts once in each. The
  // technologyField alias pointed at a column the delivery does not carry, so
  // all 144 rows read "분야 미분류".
  const technologyBreakdown = countValuesV132(
    records.flatMap((record) =>
      record.technologyClasses.length ? record.technologyClasses : ["분야 미분류"]
    )
  );
  const collaborationBreakdown = countByV132(records, (record) => researchCollaborationLabelV144(record.collaboration));
  const collaborationCountryBreakdown = countValuesV132(
    records.flatMap((record) =>
      researchCollaborationLabelV144(record.collaboration) !== "해외 협력국 포함"
        ? [] : [...new Set(splitPublicListV132(record.collaboration).filter((country) => !/^(?:베트남|Vietnam)$/iu.test(country)))]
    )
  );
  const institutionBreakdown = countValuesV132(institutionLabels);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <section
      className="rpa132"
      data-testid="e008-research-analysis-v132"
      data-analysis-before-list="true"
    >
      <div className="rpa132-kpis" data-testid="e008-kpis" aria-label="논문·특허 핵심현황">
        <KpiV132 label="공개 논문 목록" value={paperCount} unit="건" />
        <KpiV132 label="공개 특허 목록" value={patentCount} unit="건" />
        {/* A year is not a quantity: grouping printed 2026 as "2,026". */}
        <KpiV132
          label="목록 최신연도"
          value={Number.isFinite(latestYear) ? String(latestYear) : "—"}
          unit={Number.isFinite(latestYear) ? "년" : ""}
        />
        <KpiV132 label="수록 기관명 표기" value={institutions.size} unit="종" />
      </div>

      {nationalTrend.length === 0 && (
        <p className="rpa132-note" data-testid="e008-no-national-statistics">
          아래 분석은 수록된 논문·특허 {records.length.toLocaleString("ko-KR")}건을 대상으로 합니다. 베트남 전체 논문·특허 통계가 아니며, 연도별 건수 차이가 국가 전체의 증가·감소를 뜻하지는 않습니다.
        </p>
      )}
      {nationalTrend.length > 0 && (
      <section className="rpa132-panel" data-testid="e008-trend">
        {nationalTrendDepthV135 < 3 ? (
          <div
            className="rpa132-two-year-change-v135"
            data-testid="e008-national-change"
          >
            <h4>논문·특허 공개 통계 변화</h4>
            <p>
              <PublicTermTextV134 text="논문은 Scimago의 연간 문헌 수, 특허는 WIPO의 연간 출원 총계입니다. 출처와 집계 범위가 달라 합산하지 않습니다." />
            </p>
            <ul>
              {nationalTrend.map((series) => {
                const points = [...series.points].sort((left, right) => left.x - right.x);
                const first = points[0];
                const last = points[points.length - 1];
                if (!first || !last) return null;
                if (first.x === last.x) return <li key={series.id}><strong>{series.label}</strong><span>{first.x}년 {first.value.toLocaleString("ko-KR")}건 · 단일 시점</span></li>;
                const delta = last.value - first.value;
                const percent =
                  first.value === 0 ? null : (delta / Math.abs(first.value)) * 100;
                return (
                  <li key={series.id}>
                    <strong>{series.label}</strong>
                    <span>
                      {first.x}년 {Math.round(first.value).toLocaleString("ko-KR")}건 →{" "}
                      {last.x}년 {Math.round(last.value).toLocaleString("ko-KR")}건
                    </span>
                    <b>
                      {delta > 0 ? "+" : ""}
                      {Math.round(delta).toLocaleString("ko-KR")}건
                      {percent === null
                        ? ""
                        : " (" + (percent > 0 ? "+" : "") + percent.toFixed(1) + "%)"}
                    </b>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
        <InteractiveTimeSeriesChartV127
          series={nationalTrend}
          title="논문·특허 공개 통계 추이"
          description="논문은 Scimago의 연간 문헌 수, 특허는 WIPO의 연간 출원 총계를 각각 표시합니다. 출처와 집계 범위가 달라 합산하지 않습니다."
          ariaLabel="베트남 논문 발행 건수와 특허 출원 건수의 연도별 공개 통계"
          xAxisTitle="연도"
          yAxisTitle="공개 통계(건)"
          unit="건"
          formatValue={(value) => Math.round(value).toLocaleString("ko-KR")}
          showDelta={false}
          zoom={{ enabled: nationalTrend.some((series) => series.points.length >= 4) }}
          height={340}
          testId="e008-national-trend-chart"
        />
        )}
      </section>
      )}

      <div className="rpa132-analysis-grid" data-testid="e008-publication-years-v144">
        {(["논문", "특허"] as const).map((kind) => <BreakdownV132
          key={kind}
          title={`${kind} 목록의 발행연도별 건수`}
          description={`수록 ${kind}의 발행연도를 집계했습니다. 자료가 없는 연도를 0으로 채우지 않습니다.`}
          rows={countByV132(records.filter((record) => record.type === kind && Boolean(record.year)), (record) => String(record.year)).sort((a, b) => Number(a.label) - Number(b.label))}
          testId={`e008-list-years-${kind === "논문" ? "paper" : "patent"}`}
        />)}
      </div>
      <div className="rpa132-analysis-grid">
        <BreakdownV132
          title="기술분야별 수록 건수"
          description="원자료에 지정된 기술분야로 집계합니다. 분류번호가 같아도 다른 분류표의 분야명으로 바꾸지 않습니다. 여러 분야가 실제 지정된 자료는 분야별로 각각 집계합니다."
          rows={technologyBreakdown}
          testId="e008-breakdown"
        />
        <BreakdownV132
          title="공개 목록의 협력국 구분"
          description="협력국에 해외 국가가 적힌 자료와 국내만 적힌 자료를 구분합니다. 국가 전체의 국제공저 비율은 아닙니다."
          rows={collaborationBreakdown}
          testId="e008-collaboration"
        />
        {collaborationCountryBreakdown.length > 0 && (
          <BreakdownV132
            title="해외 협력국별 수록 건수"
            description="베트남을 제외한 협력국별 수록 건수입니다. 여러 국가가 참여한 자료는 각 국가에 한 번씩 집계하므로 합계를 자료 수로 읽지 않습니다."
            rows={collaborationCountryBreakdown}
            testId="e008-collaboration-countries"
          />
        )}
        {institutionBreakdown.length > 0 && (
          <BreakdownV132
            title="기관 표기 빈도"
            description="저자 소속·출원기관의 이름이 등장한 횟수입니다. 이름 표기가 다른 동일 기관은 합치지 않았습니다."
            rows={institutionBreakdown}
            testId="e008-institution-breakdown"
          />
        )}
      </div>

      <section className="rpa132-list" data-testid="e008-list">
        <header>
          <div>
            <span>개별 목록</span>
            <h3>논문·특허 찾아보기</h3>
          </div>
          <strong aria-live="polite">{filtered.length.toLocaleString("ko-KR")}건</strong>
        </header>
        <div className="rpa132-filters" role="search" aria-label="논문·특허 목록 필터">
          <label>
            <span>검색</span>
            <input
              type="search"
              value={query}
              onChange={(event) => updateFilter(setQuery, event.target.value)}
              placeholder="제목·분야·기관 검색"
            />
          </label>
          <label>
            <span>유형</span>
            <select value={type} onChange={(event) => updateFilter((value) => setType(value as ResearchTypeV132), event.target.value)}>
              <option value="all">전체</option>
              <option value="논문">논문</option>
              <option value="특허">특허</option>
            </select>
          </label>
          <label>
            <span>연도</span>
            <select value={year} onChange={(event) => updateFilter(setYear, event.target.value)}>
              <option value="all">전체</option>
              {years.map((option) => <option key={option} value={option}>{option}년</option>)}
            </select>
          </label>
          <label>
            <span>분야</span>
            <select value={field} onChange={(event) => updateFilter(setField, event.target.value)}>
              <option value="all">전체</option>
              {fields.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        {shown.length > 0 ? (
          <div className="rpa132-records" role="list">
            {shown.map((record) => <ResearchCardV132 key={record.entity.recordId} record={record} />)}
          </div>
        ) : (
          <p className="rpa132-empty" role="status">선택한 조건에 맞는 공개 목록이 없습니다.</p>
        )}

        {pageCount > 1 && (
          <nav className="rpa132-pagination" aria-label="논문·특허 목록 페이지">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>이전</button>
            <span>{currentPage} / {pageCount}</span>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>다음</button>
          </nav>
        )}
      </section>
    </section>
  );
}

function KpiV132({ label, value, unit }: { label: string; value: number | string; unit: string }) {
  return <article><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</strong><small>{unit}</small></article>;
}

export function nationalPublicationTrendV132(rows: SemanticObservationV125[]): TimeSeriesV127[] {
  const definitions = [
    { id: "E-008_scimago_publications", label: "논문 발행 건수", color: "#146c5a" },
    { id: "E-008_wipo_patent_total", label: "특허 출원 건수", color: "#9c4f17" },
  ];
  return definitions.map<TimeSeriesV127>((definition, index) => ({
    id: definition.id,
    label: definition.label,
    unit: "건",
    color: definition.color,
    marker: index === 0 ? "circle" : "diamond",
    linePattern: index === 0 ? "solid" : "dash",
    defaultVisible: true,
    points: rows
      .filter((row) => row.indicatorId === definition.id && typeof row.value === "number" && typeof row.year === "number")
      .map((row) => ({ x: row.year as number, value: row.value as number, xLabel: `${row.year}년` })),
  })).filter((series) => series.points.length > 0);
}

export function researchRecordV132(
  entity: VietnamEntityV124,
  detailTemplate?: string,
  elementTitle?: string
): ResearchRecordV132 | null {
  const attributes = reviewedEntityAttributesV132(entity, [
    detailTemplate || "entity",
    "entity",
  ]);
  const rawType = publicTextV126(attributes[ENTITY_FIELDS_V132.type]) || publicTextV126(entity.name);
  const type = rawType === "특허" ? "특허" : rawType === "논문" ? "논문" : null;
  if (!type) return null;
  const titleResult = resolvePublicEntityTitleV131(entity, { template: detailTemplate, elementTitle });
  const numericYear = Number(attributes[ENTITY_FIELDS_V132.year]);
  return {
    entity,
    type,
    title: titleResult.title,
    year: Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100 ? numericYear : null,
    field:
      publicTextV126(attributes[ENTITY_FIELDS_V132.field]) ||
      sourceTechnologyClassesV138(entity, attributes).join(" · ") ||
      "분야 미분류",
    technologyClasses: sourceTechnologyClassesV138(entity, attributes),
    institution: publicTextV126(attributes[ENTITY_FIELDS_V132.institution]) || "",
    collaboration: publicTextV126(attributes[ENTITY_FIELDS_V132.collaboration]) || "",
    sourceUrl: publicSourceUrlV126(attributes[ENTITY_FIELDS_V132.sourceUrl]) || publicSourceUrlV126(entity.provenance.sourceUrl),
  };
}

function countByV132(
  records: ResearchRecordV132[],
  select: (record: ResearchRecordV132) => string
): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const label = select(record) || "기타";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts, ([label, value]) => ({ label, value })).sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label, "ko")
  );
}

function countValuesV132(values: string[]): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts, ([label, value]) => ({ label, value })).sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label, "ko")
  );
}

/**
 * Institutions are separated by ";" or " / " in the delivery; a comma is part
 * of a name ("Institute of Meteorology, Hydrology and Climate Change"), and
 * splitting on it turned "Ho Chi Minh City" and "Hanoi" into institutions.
 */
function splitPublicListV132(value: string): string[] {
  return value
    .split(/\s*(?:;|\s\/\s)\s*/u)
    .map((item) => item.replace(/\s*\([A-Z]{2}\)\s*$/u, "").trim())
    .filter((item) => Boolean(item) && !/^(?:Y|N)$/iu.test(item));
}

/** The delivered column states countries or an explicit domestic-only status.
 * Never infer international collaboration from a whitelist of country prefixes.
 * These are labels about the supplied country field, not a national statistic. */
export function researchCollaborationLabelV144(value: string): string {
  if (!value || /^(?:Y|N|미제공|미상|-)$/iu.test(value.trim())) return "협력국 미제공";
  if (/^(?:국내|단독)/u.test(value) || /^(?:베트남|Vietnam)$/iu.test(value.trim())) return "국내만 표기";
  return "해외 협력국 포함";
}

const CTIS_CODE_PATTERN = /CTIS-(\d{2})/gu;

/** Names reviewed against the delivered E-008 classification evidence.
 * Its ordering differs from climateTechnologyCatalog, notably codes 20–38.
 * This is a source-specific label map, NOT a new classification/crosswalk. */
const RESEARCH_SOURCE_FIELDS_V144: Record<string, string> = {
  "01": "태양광", "02": "태양열", "03": "풍력", "04": "해양에너지", "05": "수력", "06": "수열",
  "07": "지열", "08": "바이오에너지", "09": "수소·암모니아 발전", "11": "원자력", "13": "수소",
  "14": "바이오매스", "15": "폐자원", "16": "발전효율", "17": "산업효율", "18": "수송효율", "19": "건물효율",
  "20": "CO2 포집·저장·활용", "21": "메탄 처리", "22": "기타 온실가스 처리", "23": "탄소흡수원",
  "24": "전력 통합", "25": "열 통합", "27": "기후변화 감시·진단", "28": "기후변화 예측",
  "29": "기후변화 영향 평가", "30": "기후변화 취약성·위험성 평가", "31": "건강", "32": "물",
  "33": "국토·연안", "34": "농축수산", "35": "산림·생태계", "37": "적응조치 효과평가", "38": "기후변화 적응기반",
};

/** Keep source classifications; a code mentioned as an alternative is not assigned. */
function sourceTechnologyClassesV138(
  entity: VietnamEntityV124,
  attributes: Record<string, unknown> = reviewedEntityAttributesV132(entity)
): string[] {
  const projected = attributes.technologyCodes;
  const codes = new Set<string>(
    Array.isArray(projected) ? projected.map((code) => String(code)) : []
  );
  // Older projections carried the prose only; read any code still in it.
  const basis = publicTextV126(attributes.technologyBasis) || "";
  for (const match of basis.matchAll(CTIS_CODE_PATTERN)) codes.add(match[1]);
  const singleAssignment = basis.match(/(\d{2})\s*로\s*단일\s*부여/u);
  const assigned = singleAssignment ? [singleAssignment[1]] : [...codes];
  return assigned
    .sort()
    .map((code) => RESEARCH_SOURCE_FIELDS_V144[code] || `원자료 분류 CTIS-${code}`);
}

function BreakdownV132({
  title,
  description,
  rows,
  testId,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number }>;
  testId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [table, setTable] = useState(false);
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  const shown = expanded ? rows : rows.slice(0, 8);
  return (
    <section className="rpa132-breakdown" data-testid={testId}>
      <header><h3><PublicTermTextV134 text={title} /></h3><p><PublicTermTextV134 text={description} /></p></header>
      <div className="rpa144-actions"><button type="button" aria-pressed={table} onClick={() => setTable((value) => !value)}>{table ? "차트로 보기" : "표로 보기"}</button>
        {!table && rows.length > 8 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "상위 8개만 보기" : `전체 ${rows.length}개 항목 보기`}</button>}
      </div>
      {table ? <div className="rpa144-table"><table><caption>{title}</caption><thead><tr><th scope="col">항목</th><th scope="col">건수</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value.toLocaleString("ko-KR")}</td></tr>)}</tbody></table></div> : <ul>
        {shown.map((row) => (
          <li key={row.label} tabIndex={0} aria-label={`${row.label} ${row.value}건`}>
            <span><PublicTermTextV134 text={row.label} /></span>
            <i aria-hidden="true"><b style={{ width: `${(row.value / maximum) * 100}%` }} /></i>
            <strong>{row.value}건</strong>
          </li>
        ))}
      </ul>}
    </section>
  );
}

function ResearchCardV132({ record }: { record: ResearchRecordV132 }) {
  return (
    <article className="rpa132-record" data-testid="public-entity-card-v131" role="listitem">
      <div data-testid="e008-public-record">
        <div className="rpa132-record__badges">
          <span><PublicTermTextV134 text={record.type} /></span>
          <span><PublicTermTextV134 text={record.field} /></span>
          {record.year && <span>{record.year}년</span>}
        </div>
        <h4 data-testid="public-entity-card-title"><PublicTermTextV134 text={record.title} /></h4>
        <dl data-testid="public-entity-card-facts">
          {record.institution && <div><dt>기관</dt><dd><PublicTermTextV134 text={record.institution} /></dd></div>}
          {record.collaboration && <div><dt>협력구조</dt><dd><PublicTermTextV134 text={record.collaboration} /></dd></div>}
        </dl>
        {record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noreferrer">공식 원문</a>}
      </div>
    </article>
  );
}

function uniqueSortedV132(values: string[], reverse = false): string[] {
  const sorted = Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "ko", { numeric: true }));
  return reverse ? sorted.reverse() : sorted;
}
