import type { Dataset } from "../../types/dataset";

interface PermittingProcessRendererProps {
  dataset: Dataset;
  payload: Record<string, unknown>;
}

type JsonRecord = Record<string, unknown>;

const APPLICABILITY_LABELS: Record<string, string> = {
  required: "필수",
  conditional: "조건부",
  not_applicable: "해당 없음",
  to_confirm: "적용 여부 확인 필요",
};

const CATEGORY_LABELS: Record<string, string> = {
  investment: "투자·사업 승인",
  land: "토지·부지",
  environment: "환경",
  construction: "건축·공사",
  grid: "계통연계",
  electricity: "전력사업",
  operation: "준공·운영",
};

export default function PermittingProcessRenderer({
  dataset,
  payload,
}: PermittingProcessRendererProps) {
  const procedures = asRecordArray(payload.procedures).sort(
    (a, b) => readNumber(a, ["sequence"]) - readNumber(b, ["sequence"])
  );
  const scenario = asRecord(payload.scenario);
  const requiredCount = procedures.filter(
    (item) => readString(item, ["applicability"]) === "required"
  ).length;
  const conditionalCount = procedures.filter(
    (item) => readString(item, ["applicability"]) === "conditional"
  ).length;
  const durationCount = procedures.filter((item) => {
    const duration = asRecord(item.statutoryDuration);
    return readNumber(duration, ["min", "max", "value"]) > 0;
  }).length;

  if (procedures.length === 0) {
    return (
      <div className="data-renderer-state">
        <strong>현재 제공되는 인허가 절차 정보가 없습니다</strong>
        <span>
          담당기관·적용조건·처리기간이 확인되는 대로 세부 절차를 제공합니다
        </span>
      </div>
    );
  }

  return (
    <div className="permit-renderer-shell">
      <section className="permit-scenario-card">
        <div>
          <span>검토 시나리오</span>
          <strong>
            {readString(scenario, ["technologyNameKo", "technologyId"]) ||
              "기술 미지정"}
            {" · "}
            {readString(scenario, ["projectTypeLabel", "projectType"]) ||
              "사업형태 미지정"}
          </strong>
        </div>
        <dl>
          <div>
            <dt>사업규모</dt>
            <dd>{readString(scenario, ["projectScale"]) || "확인 필요"}</dd>
          </div>
          <div>
            <dt>지역</dt>
            <dd>{readString(scenario, ["regionName"]) || "미정"}</dd>
          </div>
        </dl>
      </section>

      <section className="permit-summary-grid" aria-label="인허가 절차 요약">
        <article>
          <span>절차</span>
          <strong>{procedures.length}건</strong>
        </article>
        <article>
          <span>필수</span>
          <strong>{requiredCount}건</strong>
        </article>
        <article>
          <span>조건부</span>
          <strong>{conditionalCount}건</strong>
        </article>
        <article>
          <span>기간 확인</span>
          <strong>{durationCount}건</strong>
        </article>
      </section>

      <section className="permit-flow" aria-label="인허가 절차 흐름">
        {procedures.map((procedure, index) => {
          const applicability = readString(procedure, ["applicability"]);
          const authority = asRecord(procedure.authority);
          const duration = asRecord(procedure.statutoryDuration);
          const fee = asRecord(procedure.officialFee);
          const source = asRecord(procedure.source);
          const documents = readStringArray(procedure.requiredDocuments);
          const legalBases = readStringArray(procedure.legalBases);
          const methods = readStringArray(procedure.submissionMethods);
          const durationLabel = formatDuration(duration);

          return (
            <article key={readString(procedure, ["id"]) || String(index)}>
              <div className="permit-flow-rail" aria-hidden="true">
                <span>{readNumber(procedure, ["sequence"]) || index + 1}</span>
                {index < procedures.length - 1 && <i />}
              </div>

              <div className="permit-procedure-card">
                <header>
                  <div>
                    <span className="permit-category-badge">
                      {CATEGORY_LABELS[readString(procedure, ["category"])] ||
                        readString(procedure, ["category"]) ||
                        "절차"}
                    </span>
                    <h3>
                      {readString(procedure, ["nameKo", "title"]) ||
                        `절차 ${index + 1}`}
                    </h3>
                    {readString(procedure, ["nameLocal"]) && (
                      <p>{readString(procedure, ["nameLocal"])}</p>
                    )}
                  </div>
                  <span
                    className={`permit-applicability status-${applicability}`}
                  >
                    {APPLICABILITY_LABELS[applicability] || "상태 정보 없음"}
                  </span>
                </header>

                <div className="permit-core-grid">
                  <div>
                    <span>담당기관</span>
                    <strong>
                      {readString(authority, ["name"]) || "확인 필요"}
                    </strong>
                    <small>{readString(authority, ["level"])}</small>
                  </div>
                  <div>
                    <span>법정 처리기간</span>
                    <strong>{durationLabel}</strong>
                    <small>{readString(duration, ["startsFrom"])}</small>
                  </div>
                  <div>
                    <span>신청방법</span>
                    <strong>
                      {methods.length ? methods.join(" · ") : "확인 필요"}
                    </strong>
                  </div>
                  <div>
                    <span>공식 수수료</span>
                    <strong>{formatFee(fee)}</strong>
                  </div>
                </div>

                <p className="permit-condition">
                  <strong>적용조건</strong>
                  {readString(procedure, ["applicabilityCondition"]) ||
                    "확인 필요"}
                </p>

                <details>
                  <summary>필요서류·법적 근거·추가정보 보기</summary>
                  <div className="permit-detail-grid">
                    <section>
                      <strong>필요서류</strong>
                      {documents.length ? (
                        <ul>
                          {documents.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>자료 연결 필요</p>
                      )}
                    </section>
                    <section>
                      <strong>결과물</strong>
                      <p>{readString(procedure, ["output"]) || "확인 필요"}</p>
                    </section>
                    <section>
                      <strong>기간 제외사항</strong>
                      <p>
                        {readString(duration, ["excludedTime"]) || "확인 필요"}
                      </p>
                    </section>
                    <section>
                      <strong>법적 근거</strong>
                      {legalBases.length ? (
                        <ul>
                          {legalBases.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>자료 연결 필요</p>
                      )}
                    </section>
                  </div>
                  {readString(source, ["url"]) && (
                    <a
                      href={readString(source, ["url"])}
                      target="_blank"
                      rel="noreferrer"
                    >
                      공식 절차 확인 ↗
                    </a>
                  )}
                </details>
              </div>
            </article>
          );
        })}
      </section>

      <div className="permit-total-note">
        <strong>전체 기간 안내</strong>
        <span>
          모든 절차의 선후관계·병렬 진행 가능 여부·사업조건이 확인되기 전에는
          전체 인허가 기간을 합산하지 않습니다
        </span>
      </div>

      <small className="permit-dataset-note">{dataset.titleKo}</small>
    </div>
  );
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asRecordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item)
      )
    : [];
}

function readString(record: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(record: JsonRecord, keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim())
      )
    : [];
}

function formatDuration(duration: JsonRecord): string {
  const min = readNumber(duration, ["min"]);
  const max = readNumber(duration, ["max", "value"]);
  const unit = readString(duration, ["unit"]);
  const unitLabel =
    unit === "working_days"
      ? "영업일"
      : unit === "calendar_days"
      ? "일"
      : unit || "";

  if (min && max && min !== max) return `${min}~${max}${unitLabel}`;
  if (max) return `${max}${unitLabel}`;
  if (min) return `${min}${unitLabel}`;
  return "확인 필요";
}

function formatFee(fee: JsonRecord): string {
  const amount = readNumber(fee, ["amount"]);
  const currency = readString(fee, ["currency"]);
  const note = readString(fee, ["note"]);
  if (amount) return `${amount.toLocaleString("ko-KR")} ${currency}`.trim();
  return note || "확인 필요";
}
