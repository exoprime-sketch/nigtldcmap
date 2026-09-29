import type { TypologyRowV159 } from "../../../data/spec/specTypesV159";
import "./templates-v159.css";

/**
 * V159 status notice, shown instead of the analysis when the typology row
 * has a `statusNotice` (spec v8: the element keeps its U1-U6 type; this
 * replaces the former ⓪ status type). One line - '데이터 준비 중' or the
 * exclusion - and nothing else: no chart, no table, and no internal decision
 * record (who decided, why, when). The page around it still states the
 * source, the short definition and the data description.
 */
export function statusDecisionV159(status: string): { decision: string; decidedAt: string | null } {
  const decision = status.replace(/\(.*\)$/u, "").trim() || status;
  const date = status.match(/(\d{2})(\d{2})\)?$/u);
  return { decision, decidedAt: date ? `2026-${date[1]}-${date[2]}` : null };
}

/** The words a card chip and the notice use for the state. */
export function statusNoticeLabelV159(typology: Pick<TypologyRowV159, "status" | "statusNotice">): string {
  return typology.statusNotice === "data-pending" ? "데이터 준비 중" : statusDecisionV159(typology.status).decision;
}

const NOTICE_LINE_V159: Record<string, string> = {
  "data-pending": "데이터 준비 중 — 자료가 입고되면 분석 화면을 제공합니다.",
  excluded: "금년도 공개 대상에서 제외된 데이터입니다.",
};

interface Props {
  typology: TypologyRowV159;
}

export default function StatusNoticeV159({ typology }: Props) {
  const kind = typology.statusNotice || "excluded";
  return (
    <section
      className="sv125-status tpl159-status"
      data-testid="public-status-only"
      data-public-empty-reason={kind === "data-pending" ? "data-pending" : "status-decision"}
      data-analysis-block="status-note"
    >
      {/* The wrapper keeps the testid earlier audits read for a status screen. */}
      <div data-testid="public-primary-visualization">
        <p data-testid="status-note-v159" data-status-notice={kind}>
          <strong>{NOTICE_LINE_V159[kind]}</strong>
        </p>
      </div>
    </section>
  );
}
