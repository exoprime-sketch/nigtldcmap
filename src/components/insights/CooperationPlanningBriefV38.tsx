import { useMemo, useState } from "react";
import type { PlanningBriefInput } from "../../types/cooperationPlanning";
import { buildPlanningBrief } from "../../utils/cooperationPlanning";
import {
  downloadEvidenceCsv,
  downloadPlanningBriefMarkdown,
} from "../../utils/planningExportV43";
import { scrollToPageSection } from "../../utils/browser";
import "../../styles/evidence-navigation-v40.css";
import "../../styles/final-reuse-v43.css";

interface CooperationPlanningBriefV38Props extends PlanningBriefInput {}

function statusClass(status: "confirmed" | "partial" | "needs_check") {
  return `planning-v38-status ${status}`;
}

export default function CooperationPlanningBriefV38(
  props: CooperationPlanningBriefV38Props
) {
  const [copied, setCopied] = useState(false);
  const brief = useMemo(() => buildPlanningBrief(props), [props]);

  async function copyMemo() {
    try {
      await navigator.clipboard.writeText(brief.memoText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = brief.memoText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <section className="planning-v38" aria-labelledby="planning-v38-title">
      <header className="planning-v38-header">
        <div>
          <span>사업기획 검토 요약</span>
          <h2 id="planning-v38-title">
            {props.countryName} × {props.technologyName}
          </h2>
          <p>
            한국 측 사업기획자가 현재 확인된 근거와 다음 확인항목을 한눈에
            검토할 수 있도록 정리
          </p>
        </div>
        <div className="planning-v38-actions planning-v43-actions">
          <button type="button" className="secondary-button" onClick={copyMemo}>
            {copied ? "검토 메모 복사 완료" : "검토 메모 복사"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => downloadPlanningBriefMarkdown(props, brief)}
          >
            검토자료 다운로드
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => downloadEvidenceCsv(props, props.sources)}
            disabled={props.sources.length === 0}
          >
            근거목록 CSV
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => window.print()}
          >
            인쇄
          </button>
        </div>
      </header>

      <div className="planning-v38-overview" aria-label="현재 확인수준">
        <article>
          <span>근거 확인</span>
          <strong>{brief.confirmedCount}</strong>
          <small>직접 확인 가능한 근거 존재</small>
        </article>
        <article>
          <span>일부 확인</span>
          <strong>{brief.partialCount}</strong>
          <small>국가 공통·간접 근거만 확인</small>
        </article>
        <article>
          <span>추가 확인 필요</span>
          <strong>{brief.needsCheckCount}</strong>
          <small>현재 확인 가능한 근거 없음</small>
        </article>
      </div>

      <p className="planning-v38-disclaimer">
        확인수준은 협력 우선순위·사업성·성공 가능성 점수가 아니라 현재 확인된
        공개자료에 연결된 공개근거의 범위
      </p>

      <div className="planning-v38-grid">
        {brief.items.map((item, index) => (
          <article key={item.id} className="planning-v38-card">
            <div className="planning-v38-card-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <em className={statusClass(item.status)}>{item.statusLabel}</em>
            </div>
            <dl>
              <div>
                <dt>현재 확인</dt>
                <dd>{item.confirmedText}</dd>
              </div>
              <div>
                <dt>한국 측 다음 확인</dt>
                <dd>{item.nextAction}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="planning-v40-evidence-jump"
              onClick={() => scrollToPageSection(item.anchor)}
            >
              관련 근거 보기 ↓
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
