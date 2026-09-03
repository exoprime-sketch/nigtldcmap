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
  const fields = useMemo(
    () => uniqueSortedV132(records.map((record) => record.field).filter(Boolean)),
    [records]
  );
  const filtered = useMemo(() => {
    const needle = query.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
    return records.filter((record) => {
      if (type !== "all" && record.type !== type) return false;
      if (year !== "all" && String(record.year || "") !== year) return false;
      if (field !== "all" && record.field !== field) return false;
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
  const technologyBreakdown = countByV132(records, (record) => record.field);
  const collaborationBreakdown = countByV132(records, (record) =>
    !record.collaboration
      ? "협력구조 미제공"
      : /^(?:Y|국제|대한민국|독일|미국|이탈리아)/iu.test(record.collaboration)
      ? "국제 협력"
      : "국내 중심"
  );
  const collaborationCountryBreakdown = countValuesV132(
    records.flatMap((record) =>
      /^(?:국내|단독)/u.test(record.collaboration)
        ? []
        : splitPublicListV132(record.collaboration)
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
        <KpiV132
          label="목록 최신연도"
          value={Number.isFinite(latestYear) ? latestYear : "—"}
          unit={Number.isFinite(latestYear) ? "년" : ""}
        />
        <KpiV132 label="확인된 기관 범위" value={institutions.size} unit="개" />
      </div>

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
                if (!first || !last || first.x === last.x) return null;
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

      <div className="rpa132-analysis-grid">
        <BreakdownV132
          title="기술·연구분야 구성"
          description={`아래 공개 목록 ${records.length.toLocaleString("ko-KR")}건을 분야별로 집계한 값입니다.`}
          rows={technologyBreakdown}
          testId="e008-breakdown"
        />
        <BreakdownV132
          title="협력구조"
          description="원자료의 공저·공동출원 구분을 공개 목록 단위로 집계합니다."
          rows={collaborationBreakdown}
          testId="e008-collaboration"
        />
        {collaborationCountryBreakdown.length > 0 && (
          <BreakdownV132
            title="협력국 표기"
            description="국제 공저로 분류된 공개 목록의 협력국 표기 빈도입니다."
            rows={collaborationCountryBreakdown}
            testId="e008-collaboration-countries"
          />
        )}
        {institutionBreakdown.length > 0 && (
          <BreakdownV132
            title="기관 표기 빈도"
            description="저자 소속 또는 출원기관으로 공개된 기관을 집계합니다."
            rows={institutionBreakdown.slice(0, 8)}
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

function nationalPublicationTrendV132(rows: SemanticObservationV125[]): TimeSeriesV127[] {
  const definitions = [
    { id: "E-008_scimago_publications", label: "논문 발행 건수", color: "#146c5a" },
    { id: "E-008_wipo_patent_total", label: "특허 출원 건수", color: "#9c4f17" },
  ];
  return definitions.map((definition, index) => ({
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
  }));
}

function researchRecordV132(
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
    year: Number.isFinite(numericYear) ? numericYear : null,
    field: publicTextV126(attributes[ENTITY_FIELDS_V132.field]) || "분야 미분류",
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

function splitPublicListV132(value: string): string[] {
  return value
    .split(/\s*[;,]\s*/u)
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && !/^(?:Y|N)$/iu.test(item));
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
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="rpa132-breakdown" data-testid={testId}>
      <header><h3>{title}</h3><p>{description}</p></header>
      <ul>
        {rows.map((row) => (
          <li key={row.label} tabIndex={0} aria-label={`${row.label} ${row.value}건`}>
            <span><PublicTermTextV134 text={row.label} /></span>
            <i aria-hidden="true"><b style={{ width: `${(row.value / maximum) * 100}%` }} /></i>
            <strong>{row.value}건</strong>
          </li>
        ))}
      </ul>
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
