import type { VietnamEntityV124, VietnamObservationV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { DecisionPointV159 } from "../../../data/structure/decisionPointsV159";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import "./detail-analysis-v146.css";
import "./detail-analysis-v147.css";

/**
 * Spec v8 (2026-09-29): the two Korea-reference elements. Their values
 * describe Korea (typology referenceCountryIso3), so every country screen
 * shows the same rows and nothing is compared across countries.
 *
 * - E-016: the delivered 1.2_entity rows as they are - one populated row
 *   (기후기술 전체, 2025 전망) and three sector rows the source marks missing
 *   (M06). No TRL 1-9 bars: the delivery has no TRL values.
 * - E-017: the 2020 technology level against the frontier for the five
 *   delivered subjects, Korea highlighted, the delivered rank beside it.
 */

/** Subject codes as delivered; EUU is the World Bank code the source used for the EU. */
const SUBJECT_LABELS_V159: Record<string, string> = {
  CHN: "중국",
  EUU: "유럽연합(EU)",
  JPN: "일본",
  KOR: "한국",
  USA: "미국",
};

export function referenceSubjectLabelV159(iso3: string): string {
  return SUBJECT_LABELS_V159[iso3] || iso3;
}

// E-016 1.2_entity attributes, in the delivery's column order (attr_2..attr_4):
// 기술수준(최고국 대비) · 기술격차 · 최고국(점수).
const E016_FIELDS = {
  level: "field_8c8721a1",
  gap: "field_a1c8da40",
  leader: "field_edf04a1a",
} as const;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const out = String(value).trim();
  return out ? out : null;
}

/** "기후기술:전체 - 5년 후 전망(2025)" → "기후기술 전체 · 5년 후 전망(2025)". */
function sectorLabel(entity: VietnamEntityV124): string {
  const raw = text(entity.normalizedAttributes?.sector) || text(entity.name) || entity.recordId;
  return raw.replace(/^기후기술\s*:\s*/u, "").replace(/\s+-\s+/u, " · ");
}

function readinessRowsV159(entities: readonly VietnamEntityV124[]) {
  return entities.map((entity) => {
    const attrs = entity.normalizedAttributes || {};
    return {
      id: entity.recordId,
      sector: sectorLabel(entity),
      level: text(attrs[E016_FIELDS.level]),
      gap: text(attrs[E016_FIELDS.gap]),
      leader: text(attrs[E016_FIELDS.leader]),
      year: text(attrs.referenceYear),
    };
  });
}

/** The '전체' (all climate technologies) sector record - the one the headline figures read. */
function overallRowV159(rows: ReturnType<typeof readinessRowsV159>) {
  return rows.find((row) => /^전체/u.test(row.sector) && (row.level || row.gap || row.leader)) || null;
}

/**
 * E-016 decision points (spec v11): 기술수준 · 기술격차 · 최고국 from the
 * '전체' sector record as delivered; a figure the record lacks is left out.
 */
export function koreaTechReadinessPointsV159(entities: readonly VietnamEntityV124[]): DecisionPointV159[] {
  const overall = overallRowV159(readinessRowsV159(entities));
  if (!overall) return [];
  const points: DecisionPointV159[] = [];
  if (overall.level) points.push({ key: "reference-level", label: "기술수준", value: overall.level });
  if (overall.gap) points.push({ key: "reference-gap", label: "기술격차", value: overall.gap });
  if (overall.leader) points.push({ key: "reference-leader", label: "최고국", value: overall.leader });
  return points;
}

export function KoreaTechReadinessV159({ entities }: { entities: VietnamEntityV124[] }) {
  const rows = readinessRowsV159(entities);
  const headline = overallRowV159(rows);
  return (
    <section className="detail146" data-testid="korea-tech-readiness-v159">
      <div className="detail146-table" data-analysis-block="comparison-table">
        <h3>한국 기후기술 수준 · {headline ? headline.sector : "원자료 수록 분야"}</h3>
        {headline ? (
          <dl className="kr159-figures" data-testid="korea-tech-readiness-figures-v159">
            <div>
              <dt>최고국 대비 수준</dt>
              <dd>{headline.level || "자료 없음"}</dd>
            </div>
            <div>
              <dt>기술격차</dt>
              <dd>{headline.gap || "자료 없음"}</dd>
            </div>
            <div>
              <dt>최고국(점수)</dt>
              <dd>{headline.leader || "자료 없음"}</dd>
            </div>
          </dl>
        ) : null}
        <table>
          <caption>원자료 수록 분야 {rows.length}건 · 값이 없는 분야는 원자료에 '미확보'로 기재</caption>
          <thead>
            <tr>
              <th scope="col">분야</th>
              <th scope="col">최고국 대비 수준</th>
              <th scope="col">기술격차</th>
              <th scope="col">최고국(점수)</th>
              <th scope="col">기준</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row"><PublicTermTextV134 text={row.sector} /></th>
                <td>{row.level || "자료 없음"}</td>
                <td>{row.gap || "자료 없음"}</td>
                <td>{row.leader || "자료 없음"}</td>
                <td>{row.year || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="detail146-note">한국 기준 자료라 어느 나라 화면에서나 같은 내용을 보여 줍니다. 기술수준을 1~9단계(TRL)로 나눈 값은 원자료에 없습니다.</p>
    </section>
  );
}

const E017_LEVEL = "E-017_tech_level";
const E017_RANK = "E-017_tech_rank";

export function KoreaTechLevelV159({ rows }: { rows: VietnamObservationV124[] }) {
  const numeric = (row: VietnamObservationV124) => (typeof row.value === "number" && Number.isFinite(row.value) ? row.value : null);
  const levels = rows.filter((row) => row.indicatorId === E017_LEVEL && numeric(row) !== null);
  const year = levels.length ? Math.max(...levels.map((row) => row.year ?? -Infinity)) : null;
  const atYear = levels.filter((row) => row.year === year);
  const rankOf = (iso3: string) =>
    numeric(rows.find((row) => row.indicatorId === E017_RANK && row.countryIso3 === iso3 && row.year === year) || ({} as VietnamObservationV124));
  const bars = atYear
    .map((row) => ({ iso3: row.countryIso3, value: numeric(row) as number, rank: rankOf(row.countryIso3) }))
    .sort((a, b) => b.value - a.value);
  return (
    <section className="detail146" data-testid="korea-tech-level-v159">
      <h3>국가별 기후기술 수준 · {year ?? "연도 미상"}년 자료</h3>
      <section className="d153-block kr159-bars" data-analysis-block="category-bar">
        <AnalysisBarsV147
          title="최고국 대비 기후기술 수준"
          unit="%"
          xAxis="최고국 대비 기후기술 수준"
          yAxis="국가"
          maximum={100}
          highlightId="KOR"
          rows={bars.map((bar) => ({
            id: bar.iso3,
            label: `${referenceSubjectLabelV159(bar.iso3)}${bar.rank === null ? "" : ` · ${formatValueV121(bar.rank)}위`}`,
            value: bar.value,
          }))}
        />
      </section>
      <div className="detail146-table" data-analysis-block="table">
        <table>
          <caption>{year ?? ""}년 · 최고국 대비 수준(%)과 원자료의 기후기술 수준 순위(값이 작을수록 우수)</caption>
          <thead>
            <tr>
              <th scope="col">국가</th>
              <th scope="col">최고국 대비 기후기술 수준</th>
              <th scope="col">기후기술 수준 순위</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.iso3} data-subject={bar.iso3 === "KOR" ? "true" : undefined}>
                <th scope="row">{referenceSubjectLabelV159(bar.iso3)}</th>
                <td>{formatValueV121(bar.value)}%</td>
                <td>{bar.rank === null ? "자료 없음" : `${formatValueV121(bar.rank)}위`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="detail146-note">한국 기준 자료라 어느 나라 화면에서나 같은 내용을 보여 줍니다. 유럽연합은 원자료가 지역 코드로 수록한 값입니다.</p>
    </section>
  );
}
