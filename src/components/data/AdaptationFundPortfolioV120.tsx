import { useMemo } from "react";

type AnyRecord = Record<string, unknown>;
const numberValue = (record: AnyRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};
const textValue = (record: AnyRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};
const flattenRecords = (value: unknown, depth = 0): AnyRecord[] => {
  if (depth > 3 || value == null) return [];
  if (Array.isArray(value))
    return value.flatMap((item) => flattenRecords(item, depth + 1));
  if (typeof value === "object") {
    const object = value as AnyRecord;
    const appearsRecord = [
      "title",
      "projectName",
      "project_name",
      "sourceOrganization",
      "fund",
    ].some((key) => key in object);
    if (appearsRecord) return [object];
    return Object.values(object).flatMap((item) =>
      flattenRecords(item, depth + 1)
    );
  }
  return [];
};

export default function AdaptationFundPortfolioV120({
  data,
  records,
}: {
  data?: unknown;
  records?: unknown;
}) {
  const projects = useMemo(() => {
    const all = flattenRecords(records ?? data);
    return all.filter((record) => {
      const source = `${textValue(record, [
        "sourceOrganization",
        "fund",
        "institution",
        "source",
      ])} ${textValue(record, [
        "title",
        "projectName",
        "project_name",
      ])}`.toLowerCase();
      return source.includes("adaptation fund");
    });
  }, [data, records]);
  if (!projects.length) return null;

  const approved = projects.reduce(
    (sum, record) =>
      sum +
      (numberValue(record, [
        "approvedAmountUsd",
        "approved_amount",
        "approvedAmount",
        "amountUsd",
      ]) ?? 0),
    0
  );
  const transferred = projects.reduce(
    (sum, record) =>
      sum +
      (numberValue(record, [
        "transferredAmountUsd",
        "transferred_amount",
        "transferredAmount",
      ]) ?? 0),
    0
  );
  const statuses = new Map<string, number>();
  projects.forEach((record) => {
    const status =
      textValue(record, ["status", "projectStatus", "phase"]) || "상태 미공개";
    statuses.set(status, (statuses.get(status) ?? 0) + 1);
  });

  return (
    <section className="adaptation-fund-portfolio-v120">
      <header>
        <h3>Adaptation Fund 사업 현황</h3>
        <span>공식 공개사업</span>
      </header>
      <div className="adaptation-fund-portfolio-v120__kpis">
        <article>
          <span>사업</span>
          <strong>{projects.length}건</strong>
        </article>
        <article>
          <span>승인액</span>
          <strong>
            {approved ? `USD ${approved.toLocaleString()}` : "금액 미공개"}
          </strong>
        </article>
        <article>
          <span>이전액</span>
          <strong>
            {transferred
              ? `USD ${transferred.toLocaleString()}`
              : "금액 미공개"}
          </strong>
        </article>
        <article>
          <span>상태</span>
          <strong>
            {Array.from(statuses.entries())
              .map(([name, count]) => `${name} ${count}`)
              .join(" · ")}
          </strong>
        </article>
      </div>
      <p>승인액과 이전액은 서로 다른 항목으로 합산하지 않습니다.</p>
    </section>
  );
}
