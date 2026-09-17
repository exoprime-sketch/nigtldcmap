import { useMemo, useState } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { parseCTemplateRowsV141, type CTemplateRowV141 } from "../../../data/visualization/cTemplateRowsV141";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";
import "./energy-outlook-plan-v141.css";

/**
 * C-007 (Article 6.8 non-market approaches) and C-008 (international climate
 * cooperation initiatives): the delivery's attribute rows read as what a
 * reader asks about them, not as a portfolio of projects.
 *
 * The rows are statements ("베트남 참여 지위 — 참여당사국(host Party)"),
 * initiative attributes ("JETP — 공식 참여 여부"), NAZCA-listed actors
 * (companies, organisations, cities) and source documents. The portfolio
 * renderer counted every row as one "확인 항목", put dates and file names
 * into a "분야·기금" chart and titled a list with the compiler's own
 * verification memo (V141). Here each row is classified once, initiatives
 * are compared in one table, actors are counted by type and sector, and the
 * sources and compiler memos sit apart under 검토 근거.
 */
interface Props {
  elementId: "C-007" | "C-008";
  entities: VietnamEntityV124[];
}

type RowKind = "attribute" | "initiative" | "actor" | "source" | "fact";

const SOURCE_NAME = /^(?:기관 목록|UNFCCC .*(?:플랫폼|Portal|포털)|NAZCA 국가 API|Grantham|.*정치선언문|baochinhphu|.*\(PDF\)|.*파트너 페이지|원 wide파일)/u;
const URL_LIKE = /^(?:https?:\/\/|[a-z0-9.-]+\.(?:org|int|vn|gov|com)\b)/iu;
const ACTOR_CATEGORY = /기관\(|기업\(|도시\(|국가\(|지역\(|투자자\(|Organization|Company|City|Country|Region|Investor/iu;

function kindOf(row: CTemplateRowV141): RowKind {
  if (row.attribute) return "attribute";
  if (SOURCE_NAME.test(row.name) || URL_LIKE.test(row.valueText)) return "source";
  if (ACTOR_CATEGORY.test(row.category)) return "actor";
  if (row.description === "협력 이니셔티브" || (row.valueText && row.valueText === row.name && !row.description)) return "initiative";
  return "fact";
}

/** C-007's statements grouped by the question they answer. */
const C007_SECTIONS: Array<{ title: string; pattern: RegExp }> = [
  { title: "베트남 참여 지위·등록 현황", pattern: /참여 지위|host 여부|등록 여부|등재 NMA 건수|제출 NMA 건수|NFP 지정/u },
  { title: "확인된 비시장접근법(NMA)", pattern: /^NMA 명칭|^SUBARU$|Recorded NMAs|플랫폼 등록/u },
  { title: "제출·담당 기관", pattern: /제출당사국/u },
  { title: "협력 대상·분야와 참여 실적", pattern: /대상 분야|참여 실적/u },
  { title: "플랫폼 활동(베트남 참여 여부는 원문 미제시)", pattern: /워크숍|웨비나|National Focal Points|Support Providers|RCC/u },
  { title: "참여 상태 코드의 뜻", pattern: /^(?:미등록|보류|종료|참여)$/u },
];

const C008_ATTRIBUTE_COLUMNS: Array<{ title: string; patterns: RegExp[] }> = [
  { title: "정식 명칭", patterns: [/정식 명칭/u] },
  { title: "구분·기후분야", patterns: [/감축·적응 구분/u, /NAZCA 표기 기후분야/u] },
  { title: "베트남 참여", patterns: [/공식 참여 여부/u, /NAZCA 등재 상태/u] },
  { title: "참여·서명 시점", patterns: [/참여·서명 시점/u, /참여\(가입\) 연도/u] },
  { title: "주제 분야", patterns: [/이니셔티브 주제 분야/u] },
];

function countBy(rows: CTemplateRowV141[], key: (row: CTemplateRowV141) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = key(row) || "미기재";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
}

function Bars({ items, unit }: { items: Array<[string, number]>; unit: string }) {
  const max = Math.max(...items.map(([, count]) => count), 1);
  return (
    <ol className="eop141__bars" aria-label={`${unit} 비교`}>
      {items.map(([label, count]) => (
        <li key={label}>
          <span className="eop141__label"><PublicTermTextV134 text={label} /></span>
          <span className="eop141__track" aria-hidden="true">
            <i style={{ left: 0, width: `${(count / max) * 100}%` }} />
          </span>
          <span className="eop141__value">{count.toLocaleString("ko-KR")}{unit}</span>
        </li>
      ))}
    </ol>
  );
}

function SourcesV141({ rows }: { rows: CTemplateRowV141[] }) {
  if (!rows.length) return null;
  return (
    <details className="pps132-distribution" data-testid="cooperation-sources-v141">
      <summary>검토 근거·자료 출처 · {rows.length}건</summary>
      <ul className="cca141__sources">
        {rows.map((row) => (
          <li key={row.recordId}>
            <strong><PublicTermTextV134 text={row.name} /></strong>
            {row.valueText && !URL_LIKE.test(row.valueText) && <span> · <PublicTermTextV134 text={row.valueText} /></span>}
            {row.timeText && <span> · {row.timeText}</span>}
            {row.url && (
              <span>
                {" · "}
                <a href={row.url} target="_blank" rel="noreferrer">원문</a>
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function CooperationChecklistAnalysisV141({ elementId, entities }: Props) {
  const [query, setQuery] = useState("");
  const [showAllActors, setShowAllActors] = useState(false);
  const model = useMemo(() => {
    const rows = parseCTemplateRowsV141(entities).map((row) => ({ row, kind: kindOf(row) }));
    const of = (kind: RowKind) => rows.filter((item) => item.kind === kind).map((item) => item.row);
    return { rows, attributes: of("attribute"), initiatives: of("initiative"), actors: of("actor"), sources: of("source"), facts: of("fact") };
  }, [entities]);

  if (!model.rows.length) return null;

  if (elementId === "C-007") {
    const remaining = new Set(model.facts.map((row) => row.recordId));
    const sections = C007_SECTIONS.map((section) => {
      const rows = model.facts.filter((row) => section.pattern.test(row.name));
      rows.forEach((row) => remaining.delete(row.recordId));
      return { ...section, rows };
    }).filter((section) => section.rows.length);
    const leftover = model.facts.filter((row) => remaining.has(row.recordId));
    if (leftover.length) sections.push({ title: "기타 확인 사항", pattern: /./u, rows: leftover });
    const fact = (pattern: RegExp) => model.facts.find((row) => pattern.test(row.name));
    const status = fact(/참여 지위\(2\)/u) || fact(/참여 지위/u);
    const registered = fact(/등재 NMA 건수/u);
    const platformTotal = fact(/Recorded NMAs|플랫폼 등록/u);
    const submitter = fact(/제출당사국.*\(1\)/u);
    const focalPoint = fact(/NFP 지정/u);
    const fields = model.facts.filter((row) => /대상 분야/u.test(row.name));
    return (
      <section className="pps132 cca141" data-testid="cooperation-checklist-v141" data-element-id={elementId} data-source-rows={model.rows.length}>
        <header className="pps132-heading">
          <span>주 분석</span>
          <h4><PublicTermTextV134 text="파리협정 6.8조 비시장접근법(NMA)에서 베트남의 참여 현황" /></h4>
          <p><PublicTermTextV134 text={`UNFCCC NMA 플랫폼과 SB61 제출문서에서 확인한 항목별 현황입니다. 사업 건수나 금액이 아닌 확인 사항 ${model.facts.length}건을 질문별로 묶었고, 자료 출처와 검토 메모 ${model.sources.length}건은 아래에 따로 둡니다.`} /></p>
        </header>
        {sections.map((section) => (
          <section key={section.title} className="pps132-distribution pps132-distribution--table">
            <h5>{section.title} · {section.rows.length}건</h5>
            <div className="pps132-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">확인 결과</th>
                    <th scope="col">확인 시점</th>
                    <th scope="col">설명</th>
                    <th scope="col">원문</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.recordId}>
                      <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                      <td><PublicTermTextV134 text={row.valueText || "—"} /></td>
                      <td>{row.timeText || "—"}</td>
                      <td><PublicTermTextV134 text={row.note || row.description || ""} /></td>
                      <td>{row.url ? <a href={row.url} target="_blank" rel="noreferrer">원문</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <SourcesV141 rows={model.sources} />
      </section>
    );
  }

  // C-008: initiatives compared in one table, actors counted, sources apart.
  const subjects = new Map<string, { name: string; cells: Map<string, string[]>; time: string; url: string }>();
  const subjectOf = (name: string) => {
    const key = name.trim();
    const existing = subjects.get(key);
    if (existing) return existing;
    const created = { name: key, cells: new Map<string, string[]>(), time: "", url: "" };
    subjects.set(key, created);
    return created;
  };
  model.initiatives.forEach((row) => {
    const subject = subjectOf(row.name);
    subject.time = subject.time || row.timeText;
    subject.url = subject.url || row.url;
  });
  model.attributes.forEach((row) => {
    const subject = subjectOf(row.subject);
    subject.url = subject.url || row.url;
    const column = C008_ATTRIBUTE_COLUMNS.find((entry) => entry.patterns.some((pattern) => pattern.test(row.attribute || "")));
    const key = column ? column.title : row.attribute || "기타";
    const values = subject.cells.get(key) || [];
    if (row.valueText && !values.includes(row.valueText)) values.push(row.valueText);
    subject.cells.set(key, values);
  });
  const initiativeRows = [...subjects.values()];
  const actorsByType = countBy(model.actors, (row) => row.category);
  const companies = model.actors.filter((row) => /기업\(|Company/iu.test(row.category));
  const companiesBySector = countBy(companies, (row) => row.sector).slice(0, 8);
  const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
  const actorList = model.actors.filter((row) => !normalizedQuery || `${row.name} ${row.category} ${row.sector} ${row.registry}`.toLocaleLowerCase("en-US").includes(normalizedQuery));

  return (
    <section className="pps132 cca141" data-testid="cooperation-checklist-v141" data-element-id={elementId} data-source-rows={model.rows.length}>
      <header className="pps132-heading">
        <span>주 분석</span>
        <h4>국제 기후협력 이니셔티브의 베트남 참여와 참여 주체</h4>
        <p><PublicTermTextV134 text={`이니셔티브 ${initiativeRows.length}개의 참여 형태·시점·분야를 한 표에서 비교하고, UNFCCC 기후행동 포털(NAZCA)에 등재된 베트남 행위자 ${model.actors.length}곳을 유형·업종별로 셉니다. 원천 행 ${model.rows.length}행은 이니셔티브 속성·참여 주체·자료 출처로 나누어 읽으며 사업 수로 세지 않습니다.`} /></p>
      </header>

      <section className="pps132-distribution pps132-distribution--table" data-testid="cooperation-initiatives-v141">
        <h5>이니셔티브별 베트남 참여 비교 · {initiativeRows.length}개</h5>
        <div className="pps132-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">이니셔티브</th>
                {C008_ATTRIBUTE_COLUMNS.map((column) => (
                  <th key={column.title} scope="col">{column.title}</th>
                ))}
                <th scope="col">원문</th>
              </tr>
            </thead>
            <tbody>
              {initiativeRows.map((subject) => (
                <tr key={subject.name}>
                  <th scope="row"><PublicTermTextV134 text={subject.name} /></th>
                  {C008_ATTRIBUTE_COLUMNS.map((column) => (
                    <td key={column.title}><PublicTermTextV134 text={(subject.cells.get(column.title) || []).join(" · ") || "—"} /></td>
                  ))}
                  <td>{subject.url ? <a href={subject.url} target="_blank" rel="noreferrer">원문</a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pps132-note">참여 형태는 원천이 적은 표현(서명국·파트너국·NAZCA 등재 등)을 그대로 두며, 서로 다른 성격의 참여를 하나로 합산하지 않습니다.</p>
      </section>

      {model.actors.length > 0 && (
        <section className="pps132-distribution" data-testid="cooperation-actors-v141">
          <h5><PublicTermTextV134 text={`NAZCA 등재 베트남 행위자 · 유형별 ${model.actors.length}곳`} /></h5>
          <Bars items={actorsByType} unit="곳" />
          {companiesBySector.length > 0 && (
            <>
              <h5>기업의 업종 · 상위 {companiesBySector.length}개</h5>
              <Bars items={companiesBySector} unit="곳" />
            </>
          )}
          <label className="cdp-field cca141__search">
            <span className="cdp-field__label">행위자 검색</span>
            <input className="cdp-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·유형·업종" data-testid="cooperation-actor-search-v141" />
          </label>
          <div className="pps132-table-wrap">
            <table>
              <caption>행위자 목록 · {actorList.length.toLocaleString("ko-KR")}곳</caption>
              <thead>
                <tr>
                  <th scope="col">행위자</th>
                  <th scope="col">유형</th>
                  <th scope="col">업종</th>
                  <th scope="col">등재 출처</th>
                </tr>
              </thead>
              <tbody>
                {(showAllActors || normalizedQuery ? actorList : actorList.slice(0, 30)).map((row) => (
                  <tr key={row.recordId}>
                    <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                    <td><PublicTermTextV134 text={row.category || "—"} /></td>
                    <td><PublicTermTextV134 text={row.sector || "—"} /></td>
                    <td><PublicTermTextV134 text={row.registry || "—"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAllActors && !normalizedQuery && actorList.length > 30 && (
            <button type="button" className="cdp-button cdp-button--secondary" onClick={() => setShowAllActors(true)} data-testid="cooperation-actors-more-v141">
              나머지 {(actorList.length - 30).toLocaleString("ko-KR")}곳 모두 보기
            </button>
          )}
        </section>
      )}
      {model.facts.length > 0 && (
        <section className="pps132-distribution pps132-distribution--table">
          <h5>기타 확인 사항 · {model.facts.length}건</h5>
          <div className="pps132-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">확인 결과</th>
                  <th scope="col">시점</th>
                </tr>
              </thead>
              <tbody>
                {model.facts.map((row) => (
                  <tr key={row.recordId}>
                    <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                    <td><PublicTermTextV134 text={row.valueText || row.note || "—"} /></td>
                    <td>{row.timeText || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <SourcesV141 rows={model.sources} />
    </section>
  );
}
