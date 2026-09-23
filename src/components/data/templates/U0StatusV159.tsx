import { useEffect, useState } from "react";
import { loadDatasetSpecV159 } from "../../../data/spec/datasetSpecV159";
import type { TypologyRowV159 } from "../../../data/spec/specTypesV159";
import "./templates-v159.css";

/**
 * V159 ⓪ 상태 안내: one statement - the decision, its date and, when the
 * framework workbook states one, the reason. No chart, no table.
 *
 * The status line is the spec v2 status column ("제외(사용자 0923)",
 * "미입고(상태안내)"); the date is the MMDD it carries in 2026. The reason
 * is the workbook's 처리방향 line verbatim, or nothing.
 */
export function statusDecisionV159(status: string): { decision: string; decidedAt: string | null } {
  const decision = status.replace(/\(.*\)$/u, "").trim() || status;
  const date = status.match(/(\d{2})(\d{2})\)?$/u);
  return { decision, decidedAt: date ? `2026-${date[1]}-${date[2]}` : null };
}

const HEADLINE_V159: Record<string, string> = {
  제외: "금년도 공개 대상에서 제외된 데이터입니다",
  미입고: "자료가 아직 입고되지 않았습니다",
  대체: "다른 지표로 대체하기로 한 데이터입니다",
};

interface Props {
  typology: TypologyRowV159;
}

export default function U0StatusV159({ typology }: Props) {
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
      data-public-empty-reason="status-decision"
      data-analysis-block="status-note"
      data-status-decision={decision}
    >
      {/* The wrapper keeps the testid earlier audits read for a status screen. */}
      <div data-testid="public-primary-visualization">
        <strong>{HEADLINE_V159[decision] || "공개 상태 안내"}</strong>
        <dl data-testid="status-note-v159">
          <dt>결정</dt>
          <dd>{decision}</dd>
          {decidedAt ? (
            <>
              <dt>결정일</dt>
              <dd>{decidedAt}</dd>
            </>
          ) : null}
          {reason ? (
            <>
              <dt>사유</dt>
              <dd>{reason}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
