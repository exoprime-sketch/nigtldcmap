import { useMemo } from "react";

import type { ElementIndicatorSemanticsV125 } from "../../../data/visualization/semanticTypesV125";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { parseCTemplateRowsV141, type CTemplateRowV141 } from "../../../data/visualization/cTemplateRowsV141";
import { classifyStatedValueV142, type StatedValueRoleV142 } from "../../../data/visualization/statedValueRoleV142";
import { publicMissingReasonLabelV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";

/**
 * C-011 (치안·안전 정보): the delivery's 값 column holds emergency numbers,
 * mission phone numbers, notice dates, alert grades, one homicide rate and a
 * set of links. The register comparison drew 113 · 114 · 115 · 2020 · 2023 on
 * one axis as if they were quantities (V141). Each row is classified by what
 * its value is, and each kind gets the table it needs: numbers to dial,
 * notices with their dates, the alert status, the crime statistics that exist
 * (with the reason the composite index does not), the OSAC narrative, and the
 * source links. No bar chart: nothing here is a set of comparable measurements.
 */
interface Props {
  entities: VietnamEntityV124[];
  semantics: ElementIndicatorSemanticsV125;
}

type SectionKey =
  | "emergency"
  | "missions"
  | "alert"
  | "notices"
  | "crime"
  | "provincial"
  | "narrative"
  | "links";

type ClassifiedRow = CTemplateRowV141 & { role: StatedValueRoleV142; missingReason: string | null; section: SectionKey };

const SECTION_TITLES: Record<SectionKey, string> = {
  emergency: "현지 긴급 신고 번호",
  missions: "재외공관 연락처",
  alert: "여행경보 현황과 등급 체계",
  notices: "최근 안전공지",
  crime: "범죄 통계",
  provincial: "성 단위 치안지표 공표 여부",
  narrative: "현지 치안 상황(OSAC·미 국무부 서술)",
  links: "참고 링크",
};

const SECTION_ORDER: SectionKey[] = ["emergency", "missions", "alert", "notices", "crime", "provincial", "narrative", "links"];

/** The compiler's bracketed tag ("[M08·정의 불일치] …", "[하한(min)] …") is not for the reader. */
function readerNote(note: string): string {
  return note.replace(/^\[[^\]]*\]\s*/u, "").trim();
}

function sectionOf(row: ClassifiedRow): SectionKey {
  const id = row.indicatorId;
  if (row.role === "url") return "links";
  if (row.role === "telephone") return /대사관|영사관|공관/u.test(row.name) ? "missions" : "emergency";
  if (/crime_statistics/u.test(id) || /살인율|범죄지수/u.test(row.name)) return "crime";
  if (row.role === "date" && /공지|안내|조정내용/u.test(row.name)) return "notices";
  if (/travel_alert/u.test(id) || /여행경보|등급|발령|차등|단계|특별경보/u.test(row.name)) return "alert";
  if (row.role === "date" || /공지|안내/u.test(row.name)) return "notices";
  if (/osac/u.test(id) || /위협|납치|범죄 유형|폭력범죄|구조적 이슈/u.test(row.name)) return "narrative";
  if (/bocongan/u.test(id) || /지표|판정|수집 경로|공간단위/u.test(row.name)) return "provincial";
  return "narrative";
}

function timeLabel(row: ClassifiedRow): string {
  // A date-valued row states its moment in the value itself; the period
  // column repeats it. A phone number's period is when it was checked.
  if (row.role === "date") return valueLabel(row);
  return row.timeText;
}

function valueLabel(row: ClassifiedRow): string {
  // "발령 개시 · 2020 · 2020-03": the number restates its period; the period
  // is the fuller statement of the same moment.
  if (row.role === "date") return /^\d+$/u.test(row.valueText) && row.timeText ? row.timeText : row.valueText;
  if (row.role === "measure" && row.value !== null) return row.valueText;
  if (!row.valueText) return row.missingReason || "자료 미제공";
  return row.valueText;
}

export default function SecuritySafetyInfoV142({ entities, semantics }: Props) {
  const sections = useMemo(() => {
    const units = new Map(
      semantics.indicators.map((indicator) => [indicator.indicatorId, { unit: indicator.measure.unit ?? null, unitFamily: indicator.measure.unitFamily ?? null }])
    );
    const rows: ClassifiedRow[] = parseCTemplateRowsV141(entities).map((row, index) => {
      const entity = entities[index];
      const indicator = units.get(row.indicatorId) || { unit: null, unitFamily: null };
      const classified = classifyStatedValueV142({
        raw: (entity.normalizedAttributes || {})["속성3_값"],
        unit: "",
        measureName: null,
        indicatorUnit: indicator.unit,
        indicatorUnitFamily: indicator.unitFamily,
        period: row.timeText,
        title: row.name,
        elementId: entity.elementId,
      });
      const missingReason = publicMissingReasonLabelV126(entity.missingReasonCode, entity.note);
      const base = { ...row, role: classified.role, missingReason, section: "narrative" as SectionKey, note: readerNote(row.note) };
      return { ...base, section: sectionOf(base) };
    });
    // Two bound rows of one dated event ("발령 개시" 2020 / 3 with period
    // 2020-03) are one moment; the period column already states it once.
    const seen = new Set<string>();
    const deduplicated = rows.filter((row) => {
      if (row.role !== "date" || !/^\d{4}(?:-\d{2})?$/u.test(row.timeText)) return true;
      const key = `${row.name}|${row.timeText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return SECTION_ORDER.map((key) => ({ key, title: SECTION_TITLES[key], rows: deduplicated.filter((row) => row.section === key) })).filter((section) => section.rows.length > 0);
  }, [entities, semantics]);

  const roleCounts = useMemo(() => {
    const counts = new Map<StatedValueRoleV142, number>();
    sections.forEach((section) => section.rows.forEach((row) => counts.set(row.role, (counts.get(row.role) || 0) + 1)));
    return counts;
  }, [sections]);

  const alertStatus = sections.find((section) => section.key === "alert")?.rows.find((row) => /현재 등급/u.test(row.name));
  const homicide = sections.find((section) => section.key === "crime")?.rows.find((row) => row.role === "measure");
  const emergencyCount = sections.find((section) => section.key === "emergency")?.rows.length || 0;
  const missionRows = sections.find((section) => section.key === "missions")?.rows || [];
  const missionNames = [...new Set(missionRows.map((row) => row.name))];
  const embassyCount = missionNames.filter((name) => /대사관/u.test(name)).length;
  const consulateCount = missionNames.filter((name) => /영사관/u.test(name)).length;

  if (!sections.length) return null;

  return (
    <section className="pps132 ssi142" data-testid="security-safety-info-v142" data-measure-rows={roleCounts.get("measure") || 0} data-telephone-rows={roleCounts.get("telephone") || 0} data-date-rows={roleCounts.get("date") || 0}>
      <header className="pps132-heading">
        <span>주 분석</span>
        <h4>여행경보·연락처·범죄 통계를 용도별로 정리한 표</h4>
        <p>
          긴급 신고 번호, 재외공관 연락처, 여행경보와 범죄 통계를 확인할 수 있습니다.
          연락처와 경보는 수록 시점의 정보입니다. 방문 전 공식 출처에서 최신 내용을 확인하세요.
        </p>
      </header>


      {sections.map((section) => (
        <section key={section.key} className="pps132-distribution pps132-distribution--table" data-testid={`security-section-${section.key}-v142`}>
          <h5>{section.title} · {section.rows.length.toLocaleString("ko-KR")}건</h5>
          <div className="pps132-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">{section.key === "emergency" || section.key === "missions" ? "번호" : section.key === "crime" ? "값" : section.key === "links" ? "주소" : "내용"}</th>
                  <th scope="col">{section.key === "notices" ? "공지일" : section.key === "emergency" || section.key === "missions" ? "확인 시점" : "시점"}</th>
                  <th scope="col">설명</th>
                  <th scope="col">원문</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.recordId} data-value-role={row.role}>
                    <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                    <td>
                      {row.role === "url" && row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer">{row.valueText}</a>
                      ) : (
                        <PublicTermTextV134 text={section.key === "crime" && row.role === "measure" ? `${valueLabel(row)} 건/10만명` : valueLabel(row)} />
                      )}
                    </td>
                    <td>{timeLabel(row) || "—"}</td>
                    <td><PublicTermTextV134 text={row.note || row.description || ""} /></td>
                    <td>{row.url && row.role !== "url" ? <a href={row.url} target="_blank" rel="noreferrer">원문</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="pps132-note">
        전화번호와 공지일은 수량이 아니므로 합계·평균·막대 비교를 만들지 않습니다. 경보 등급은 외교부 4단계 체계의 순서형 분류이며, 위협도는 OSAC의 미국 정부 활동 기준 상대평가입니다.
      </p>
    </section>
  );
}
