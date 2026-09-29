import { useEffect, useState } from "react";
import { loadDatasetSpecV159 } from "../../../data/spec/datasetSpecV159";
import type { TypologyRowV159 } from "../../../data/spec/specTypesV159";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./templates-v159.css";

/**
 * V159 status notice, shown instead of the analysis when the typology row
 * has a `statusNotice` (spec v8: the element keeps its U1-U6 type; this
 * replaces the former ⓪ status type). One statement - the state, its date
 * and, when the framework workbook states one, the reason. No chart, no table.
 *
 * The state is the spec status column ("미입고(데이터 준비 중)",
 * "제외(사용자 0923)"); the date is the MMDD it carries in 2026. The reason
 * is the workbook's 처리방향 line verbatim, or nothing.
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

const HEADLINE_V159: Record<string, string> = {
  제외: "금년도 공개 대상에서 제외된 데이터입니다",
  미입고: "데이터 준비 중입니다 — 자료가 입고되면 분석 화면을 제공합니다",
  대체: "다른 지표로 대체하기로 한 데이터입니다",
};

interface Props {
  typology: TypologyRowV159;
}

export default function StatusNoticeV159({ typology }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setReason(null);
    void loadDatasetSpecV159(typology.elementId).then(({ spec }) => {
      if (alive) setReason(spec?.decisionNote || null);
    });
    return () => {
      alive = false;
    };
  }, [typology.elementId]);
  const { decision, decidedAt } = statusDecisionV159(typology.status);
  return (
    <section
      className="sv125-status tpl159-status"
      data-testid="public-status-only"
      data-public-empty-reason={typology.statusNotice === "data-pending" ? "data-pending" : "status-decision"}
      data-analysis-block="status-note"
      data-status-decision={decision}
    >
      {/* The wrapper keeps the testid earlier audits read for a status screen. */}
      <div data-testid="public-primary-visualization">
        <strong>{HEADLINE_V159[decision] || "공개 상태 안내"}</strong>
        <dl data-testid="status-note-v159">
          <dt>결정</dt>
          <dd>{statusNoticeLabelV159(typology)}</dd>
          {/* All three lines always show; what the sources do not state is
              said as such rather than left out. */}
          <dt>사유</dt>
          <dd>{reason ? <PublicTermTextV134 text={reason} /> : "기재된 사유 없음"}</dd>
          <dt>결정일</dt>
          <dd>{decidedAt || "기재된 결정일 없음"}</dd>
        </dl>
      </div>
    </section>
  );
}
