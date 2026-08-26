import { useMemo, useState } from "react";
import { CLIMATE_TECHNOLOGY_BY_ID } from "../../data/climateTechnologyCatalog";
import type { DataRepresentationType, Dataset } from "../../types/dataset";
import { openExternalUrl } from "../../utils/browser";
import GeospatialPayloadMap from "./GeospatialPayloadMap";
import PermittingProcessRenderer from "./PermittingProcessRenderer";

type JsonRecord = Record<string, unknown>;

export type V33LoadedPayload = JsonRecord & {
  type?: string;
  title?: string;
  unit?: string;
  referencePeriod?: string;
  status?: string;
  accessLevel?: string;
  limitations?: unknown;
  rows?: unknown;
  series?: unknown;
  categories?: unknown;
  documents?: unknown;
  organizations?: unknown;
  projects?: unknown;
  features?: unknown;
  source?: unknown;
  sourceUrl?: string;
  scenario?: unknown;
  procedures?: unknown;
};

interface Props {
  dataset: Dataset;
  payload: V33LoadedPayload;
  primaryType: DataRepresentationType;
}

const VERIFICATION_LABELS: Record<string, string> = {
  confirmed: "근거 확인",
  explicit: "원문에서 직접 확인",
  related: "관련 내용 확인",
  partial: "일부 근거 확인",
  under_review: "추가 검토 중",
  underReview: "추가 검토 중",
  not_confirmed: "현재 직접 근거 미확인",
  "not-confirmed": "현재 직접 근거 미확인",
  notFound: "현재 자료 미확인",
  not_found: "현재 자료 미확인",
  not_applicable: "해당 없음",
  notApplicable: "해당 없음",
};

export default function UserPayloadRendererV33({
  dataset,
  payload,
  primaryType,
}: Props) {
  const normalizedType =
    normalizeRepresentationType(payload.type) ?? primaryType;
  const isPermittingProcess =
    typeof payload.type === "string" &&
    payload.type.replace(/-/g, "_") === "permitting_process";

  return (
    <div className="v33-data-view">
      <DataScopeBar dataset={dataset} payload={payload} />

      {(dataset.isSynthetic ||
        dataset.dataStatus === "synthetic_example" ||
        payload.status === "synthetic_example" ||
        payload.accessLevel === "example") && (
        <div className="v33-example-warning" role="note">
          <strong>화면 예시자료</strong>
          <span>
            실제 국가 현황으로 사용하지 않으며 공개 분석·비교·협력 인사이트에서
            제외
          </span>
        </div>
      )}

      {isPermittingProcess ? (
        <PermittingProcessRenderer dataset={dataset} payload={payload} />
      ) : (
        <>
          {normalizedType === "numeric" && (
            <NumericView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "time_series" && (
            <TimeSeriesView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "categorical" && (
            <CategoricalView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "verification" && (
            <VerificationView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "text" && (
            <TextEvidenceView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "document" && (
            <DocumentEvidenceView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "organization" && (
            <OrganizationDirectoryView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "project_finance" && (
            <ProjectPortfolioView dataset={dataset} payload={payload} />
          )}
          {normalizedType === "geospatial" && (
            <GeospatialView dataset={dataset} payload={payload} />
          )}
        </>
      )}

      <Limitations dataset={dataset} payload={payload} />
    </div>
  );
}

function DataScopeBar({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const source = asRecord(payload.source);
  const sourceName =
    readString(source, ["organization", "name", "label"]) ||
    dataset.sourceOrganization;
  const sourceUrl =
    readString(source, ["url", "sourceUrl"]) ||
    payload.sourceUrl ||
    dataset.sourceUrl;
  const recordCount = getPayloadRecordCount(payload);

  return (
    <div className="v33-scope-bar">
      <div>
        <span>기준</span>
        <strong>
          {payload.referencePeriod || dataset.referenceYear || dataset.period}
        </strong>
      </div>
      <div>
        <span>출처</span>
        <strong>{sourceName}</strong>
      </div>
      {recordCount !== null && (
        <div>
          <span>확인 가능 항목</span>
          <strong>{recordCount.toLocaleString("ko-KR")}건</strong>
        </div>
      )}
      {sourceUrl && (
        <button
          type="button"
          className="v33-source-button"
          onClick={() => openExternalUrl(sourceUrl)}
        >
          원자료 확인 ↗
        </button>
      )}
    </div>
  );
}

function NumericView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const rows = asRecordArray(payload.rows);
  const unit = payload.unit || dataset.unit;
  const [selectedKey, setSelectedKey] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  if (rows.length === 0)
    return <EmptyState label="현재 표시 가능한 수치 없음" />;

  const selectedRow =
    rows.find((row) => getStableKey(row) === selectedKey) ||
    rows.find((row) => readString(row, ["iso3"]) === "VNM") ||
    rows[0];
  const selectedStableKey = getStableKey(selectedRow);

  const numericRows = rows
    .map((row, index) => ({
      row,
      label: getRowLabel(row, index),
      value: readNumber(row, ["value"]),
      period:
        readString(row, ["referencePeriod", "year", "period"]) ||
        payload.referencePeriod ||
        dataset.referenceYear,
    }))
    .filter((item) => item.value !== null);
  const sortedRows = [...numericRows].sort(
    (a, b) => (b.value || 0) - (a.value || 0)
  );
  const chartRows = sortedRows.slice(0, 10);
  const maxValue = Math.max(
    1,
    ...chartRows.map((item) => Math.abs(item.value || 0))
  );
  const selectedValue = readNumber(selectedRow, ["value"]);
  const selectedPeriod =
    readString(selectedRow, ["referencePeriod", "year", "period"]) ||
    payload.referencePeriod ||
    dataset.referenceYear;

  return (
    <div className="v33-stack">
      <section className="v33-control-row">
        {rows.length > 1 ? (
          <label className="v33-field">
            <span>대상</span>
            <select
              value={selectedStableKey}
              onChange={(event) => setSelectedKey(event.target.value)}
            >
              {rows.map((row, index) => (
                <option
                  key={getStableKey(row) || String(index)}
                  value={getStableKey(row)}
                >
                  {getRowLabel(row, index)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div />
        )}
        {rows.length > 4 && (
          <ViewToggle value={viewMode} onChange={setViewMode} />
        )}
      </section>

      <section className="v33-summary-grid compact">
        <article className="primary">
          <span>{getRowLabel(selectedRow, 0)}</span>
          <strong>{formatValue(selectedValue, unit)}</strong>
          <small>{selectedPeriod || "기준시점 미확인"}</small>
        </article>
        <article>
          <span>단위</span>
          <strong>{unit || "-"}</strong>
          <small>원자료 정의 기준</small>
        </article>
        <article>
          <span>비교 가능 대상</span>
          <strong>{numericRows.length.toLocaleString("ko-KR")}개</strong>
          <small>동일 데이터셋 내 값 보유 대상</small>
        </article>
      </section>

      {rows.length > 4 && viewMode === "chart" && (
        <section className="v33-panel">
          <PanelHeading
            title="값 높은 대상 10개"
            note="동일 데이터셋의 원값 기준 정렬"
          />
          <div className="v33-bar-list">
            {chartRows.map((item) => (
              <div className="v33-bar-row" key={getStableKey(item.row)}>
                <span>{item.label}</span>
                <div className="v33-bar-track">
                  <i
                    style={{
                      width: `${Math.max(
                        2,
                        (Math.abs(item.value || 0) / maxValue) * 100
                      )}%`,
                    }}
                  />
                </div>
                <strong>{formatValue(item.value, unit)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {(rows.length <= 4 || viewMode === "table") && (
        <SimpleTable
          columns={["대상", "값", "기준"]}
          rows={rows.map((row, index) => [
            getRowLabel(row, index),
            formatValue(readNumber(row, ["value"]), unit),
            readString(row, ["referencePeriod", "year", "period"]) ||
              payload.referencePeriod ||
              dataset.referenceYear ||
              "-",
          ])}
        />
      )}
    </div>
  );
}

function TimeSeriesView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const series = asRecordArray(payload.series);
  const unit = payload.unit || dataset.unit;
  const [selectedGroup, setSelectedGroup] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, JsonRecord[]>();
    series.forEach((row) => {
      const key =
        readString(row, ["iso3", "regionId", "organizationId", "seriesId"]) ||
        "전체";
      const current = map.get(key) || [];
      current.push(row);
      map.set(key, current);
    });
    return map;
  }, [series]);

  if (series.length === 0)
    return <EmptyState label="현재 표시 가능한 시계열 없음" />;

  const groupKeys = Array.from(groups.keys());
  const activeKey = groups.has(selectedGroup)
    ? selectedGroup
    : groupKeys[0] ?? "";
  const activeRows = [...(groups.get(activeKey) || [])].sort((a, b) =>
    getPeriod(a).localeCompare(getPeriod(b), "ko")
  );
  const first = activeRows[0];
  const latest = activeRows[activeRows.length - 1];
  const firstValue = first ? readNumber(first, ["value"]) : null;
  const latestValue = latest ? readNumber(latest, ["value"]) : null;
  const change =
    firstValue !== null && latestValue !== null
      ? latestValue - firstValue
      : null;

  return (
    <div className="v33-stack">
      {groupKeys.length > 1 && (
        <label className="v33-field v33-field-medium">
          <span>대상</span>
          <select
            value={activeKey}
            onChange={(event) => setSelectedGroup(event.target.value)}
          >
            {groupKeys.map((key) => (
              <option key={key} value={key}>
                {getGroupLabel(groups.get(key)?.[0], key)}
              </option>
            ))}
          </select>
        </label>
      )}

      <section className="v33-summary-grid">
        <article className="primary">
          <span>최근 값</span>
          <strong>{formatValue(latestValue, unit)}</strong>
          <small>{latest ? getPeriod(latest) : "-"}</small>
        </article>
        <article>
          <span>최초 값</span>
          <strong>{formatValue(firstValue, unit)}</strong>
          <small>{first ? getPeriod(first) : "-"}</small>
        </article>
        <article>
          <span>기간 변화</span>
          <strong>{formatSignedValue(change, unit)}</strong>
          <small>최초값 대비 단순 차이</small>
        </article>
        <article>
          <span>관측 시점</span>
          <strong>{activeRows.length.toLocaleString("ko-KR")}개</strong>
          <small>결측 시점은 값이 없는 상태로 표시</small>
        </article>
      </section>

      <V33LineChart rows={activeRows} unit={unit} />

      <SimpleTable
        columns={["기간", `값${unit ? ` · ${unit}` : ""}`]}
        rows={activeRows.map((row) => [
          getPeriod(row),
          formatValue(readNumber(row, ["value"]), ""),
        ])}
      />
    </div>
  );
}

function CategoricalView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const rows = asRecordArray(payload.rows);
  const categoryDefinitions = asRecordArray(payload.categories);
  if (rows.length === 0)
    return <EmptyState label="현재 표시 가능한 분류 결과 없음" />;

  const definitions = new Map(
    categoryDefinitions.map((item) => [
      readString(item, ["code", "id", "value"]),
      item,
    ])
  );
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const code =
      readString(row, ["category", "grade", "status", "value"]) || "미분류";
    counts.set(code, (counts.get(code) || 0) + 1);
  });
  const maxCount = Math.max(1, ...Array.from(counts.values()));

  return (
    <div className="v33-stack">
      <section className="v33-summary-grid compact">
        <article>
          <span>평가 항목</span>
          <strong>{rows.length.toLocaleString("ko-KR")}개</strong>
          <small>현재 제공자료 기준</small>
        </article>
        <article>
          <span>분류 구간</span>
          <strong>{counts.size.toLocaleString("ko-KR")}개</strong>
          <small>판정기준과 함께 해석</small>
        </article>
      </section>

      <section className="v33-panel">
        <PanelHeading title="분류 결과 분포" note="항목 수 기준" />
        <div className="v33-bar-list category-bars">
          {Array.from(counts.entries()).map(([code, count]) => {
            const definition = definitions.get(code);
            return (
              <div className="v33-bar-row" key={code}>
                <span>{readString(definition, ["label", "name"]) || code}</span>
                <div className="v33-bar-track">
                  <i style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <strong>{count}건</strong>
              </div>
            );
          })}
        </div>
      </section>

      <div className="v33-evidence-list">
        {rows.map((row, index) => {
          const code =
            readString(row, ["category", "grade", "status", "value"]) ||
            "미분류";
          const definition = definitions.get(code);
          return (
            <article key={getStableKey(row) || String(index)}>
              <header>
                <strong>{getRowLabel(row, index)}</strong>
                <span className="v33-pill">
                  {readString(definition, ["label", "name"]) || code}
                </span>
              </header>
              <p>
                {readString(row, ["reason", "note", "summary"]) ||
                  readString(definition, ["definition", "description"]) ||
                  dataset.summary}
              </p>
              {readString(definition, ["definition", "description"]) && (
                <small>
                  판정기준 ·{" "}
                  {readString(definition, ["definition", "description"])}
                </small>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function VerificationView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const rows = asRecordArray(payload.rows);
  if (rows.length === 0)
    return <EmptyState label="현재 표시 가능한 확인 결과 없음" />;

  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const status =
      readString(row, ["status", "verificationStatus"]) || "unknown";
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return (
    <div className="v33-stack">
      <div className="v33-verification-summary">
        {Array.from(counts.entries()).map(([status, count]) => (
          <span key={status}>
            <strong>{VERIFICATION_LABELS[status] || status}</strong>
            {count}건
          </span>
        ))}
      </div>

      <div className="v33-evidence-list">
        {rows.map((row, index) => {
          const status = readString(row, ["status", "verificationStatus"]);
          const sourceUrl = readString(row, ["sourceUrl", "url"]);
          const original = readString(row, [
            "originalText",
            "evidenceOriginal",
            "excerpt",
          ]);
          const translation = readString(row, ["translationKo", "summaryKo"]);
          return (
            <article key={getStableKey(row) || String(index)}>
              <header>
                <strong>{getRowLabel(row, index)}</strong>
                <span className={`v33-pill status-${statusClass(status)}`}>
                  {VERIFICATION_LABELS[status] ||
                    status ||
                    "확인 상태 정보 없음"}
                </span>
              </header>
              <p>
                {readString(row, ["evidence", "summary", "reason"]) ||
                  dataset.summary}
              </p>
              {(original || translation) && (
                <div className="v33-bilingual-grid">
                  <section>
                    <span>원문 근거</span>
                    <p>{original || "직접 인용문 없음"}</p>
                  </section>
                  <section>
                    <span>한국어 의미</span>
                    <p>{translation || "한국어 참고내용 없음"}</p>
                  </section>
                </div>
              )}
              <footer>
                <small>
                  {readString(row, ["documentPage", "page", "sourcePage"])
                    ? `근거 위치 · ${readString(row, [
                        "documentPage",
                        "page",
                        "sourcePage",
                      ])}`
                    : ""}
                </small>
                {sourceUrl && (
                  <button
                    type="button"
                    onClick={() => openExternalUrl(sourceUrl)}
                  >
                    근거 확인 ↗
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TextEvidenceView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const rows = asRecordArray(payload.rows);
  if (rows.length === 0)
    return <EmptyState label="현재 표시 가능한 조사 결과 없음" />;

  return (
    <div className="v33-evidence-list text-evidence">
      {rows.map((row, index) => {
        const sourceUrl = readString(row, ["sourceUrl", "url"]);
        return (
          <article key={getStableKey(row) || String(index)}>
            <header>
              <strong>
                {readString(row, ["heading", "title", "topic"]) ||
                  getRowLabel(row, index)}
              </strong>
            </header>
            <p className="v33-key-copy">
              {readString(row, ["content", "summary", "text"]) ||
                "확인 내용 없음"}
            </p>
            <dl className="v33-mini-dl">
              {readString(row, ["regionName", "location"]) && (
                <div>
                  <dt>대상지역</dt>
                  <dd>{readString(row, ["regionName", "location"])}</dd>
                </div>
              )}
              {readString(row, ["referencePeriod", "date"]) && (
                <div>
                  <dt>기준</dt>
                  <dd>{readString(row, ["referencePeriod", "date"])}</dd>
                </div>
              )}
              {Array.isArray(row.technologyIds) && (
                <div>
                  <dt>관련 기술</dt>
                  <dd>{formatTechnologyIds(row.technologyIds)}</dd>
                </div>
              )}
            </dl>
            {readString(row, ["followUp", "nextCheck", "gap"]) && (
              <div className="v33-follow-up">
                <strong>추가 확인</strong>
                <span>{readString(row, ["followUp", "nextCheck", "gap"])}</span>
              </div>
            )}
            {sourceUrl && (
              <button
                type="button"
                className="v33-inline-button"
                onClick={() => openExternalUrl(sourceUrl)}
              >
                근거 확인 ↗
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

function DocumentEvidenceView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const documents = asRecordArray(payload.documents);
  if (documents.length === 0)
    return <EmptyState label="현재 표시 가능한 문서 근거 없음" />;

  return (
    <div className="v33-evidence-list document-evidence">
      {documents.map((document, index) => {
        const sourceUrl = readString(document, ["sourceUrl", "url"]);
        return (
          <article key={getStableKey(document) || String(index)}>
            <header>
              <div>
                <span className="v33-eyebrow">
                  {readString(document, ["documentType", "type"]) ||
                    "공식 문서"}
                </span>
                <strong>
                  {readString(document, ["title", "documentTitle"]) ||
                    dataset.titleKo}
                </strong>
                <small>
                  {[
                    readString(document, ["publisher", "sourceOrganization"]),
                    readString(document, ["publicationDate", "date"]),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              {sourceUrl && (
                <button
                  type="button"
                  onClick={() => openExternalUrl(sourceUrl)}
                >
                  공식 문서 확인 ↗
                </button>
              )}
            </header>
            <div className="v33-bilingual-grid">
              <section>
                <span>원문</span>
                <p>
                  {readString(document, ["originalText", "excerpt"]) ||
                    "공식 문서 발췌 없음"}
                </p>
              </section>
              <section>
                <span>한국어 의미</span>
                <p>
                  {readString(document, [
                    "translationKo",
                    "summaryKo",
                    "summary",
                  ]) || "한국어 참고내용 없음"}
                </p>
              </section>
            </div>
            <footer>
              <small>
                {[
                  readString(document, ["page", "documentPage"]),
                  readString(document, ["section", "documentSection"]),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function OrganizationDirectoryView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const organizations = asRecordArray(payload.organizations);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  if (organizations.length === 0)
    return <EmptyState label="현재 표시 가능한 기관정보 없음" />;

  const types = Array.from(
    new Set(
      organizations.map(
        (item) => readString(item, ["organizationType", "type"]) || "기관"
      )
    )
  ).sort((a, b) => a.localeCompare(b, "ko"));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = organizations.filter((item) => {
    const type = readString(item, ["organizationType", "type"]) || "기관";
    const search = [
      readString(item, ["name", "organizationName"]),
      type,
      readString(item, ["confirmedRole", "role"]),
      readString(item, ["regionName", "location"]),
      formatTechnologyIds(item.technologyIds),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (typeFilter === "all" || typeFilter === type) &&
      (!normalizedQuery || search.includes(normalizedQuery))
    );
  });

  return (
    <div className="v33-stack">
      <section className="v33-summary-grid compact">
        <article className="primary">
          <span>확인된 기관</span>
          <strong>{organizations.length}개</strong>
          <small>공식 근거가 연결된 기관정보</small>
        </article>
        <article>
          <span>기관 유형</span>
          <strong>{types.length}개</strong>
          <small>역할별 구분</small>
        </article>
      </section>
      <section className="v33-filter-row">
        <label className="v33-field">
          <span>기관 검색</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기관명·역할 검색"
          />
        </label>
        <label className="v33-field">
          <span>기관 유형</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">전체</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="v33-card-grid">
        {filtered.map((organization, index) => {
          const sourceUrl = readString(organization, ["sourceUrl", "url"]);
          return (
            <article key={getStableKey(organization) || String(index)}>
              <span className="v33-eyebrow">
                {readString(organization, ["organizationType", "type"]) ||
                  "기관"}
              </span>
              <h3>
                {readString(organization, ["name", "organizationName"]) ||
                  "기관명 정보 없음"}
              </h3>
              <dl className="v33-mini-dl">
                <div>
                  <dt>확인된 역할</dt>
                  <dd>
                    {readString(organization, ["confirmedRole", "role"]) ||
                      "역할 근거 정보 없음"}
                  </dd>
                </div>
                <div>
                  <dt>대상지역</dt>
                  <dd>
                    {readString(organization, ["regionName", "location"]) ||
                      "미확인"}
                  </dd>
                </div>
                <div>
                  <dt>관련 기술</dt>
                  <dd>{formatTechnologyIds(organization.technologyIds)}</dd>
                </div>
              </dl>
              <div className="v33-neutral-note">
                확인된 기관 역할 기준 · 협력 의향과 신규 사업 참여 가능성은 별도
                확인 필요
              </div>
              {sourceUrl && (
                <button
                  type="button"
                  className="v33-inline-button"
                  onClick={() => openExternalUrl(sourceUrl)}
                >
                  기관 근거 확인 ↗
                </button>
              )}
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <EmptyState label="현재 조건에 맞는 기관 없음" />
      )}
    </div>
  );
}

function ProjectPortfolioView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const projects = asRecordArray(payload.projects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  if (projects.length === 0)
    return <EmptyState label="현재 표시 가능한 사업·재원정보 없음" />;

  const statuses = Array.from(
    new Set(
      projects.map(
        (item) => readString(item, ["projectStatus", "status"]) || "정보 없음"
      )
    )
  );
  const technologyIds = Array.from(
    new Set(
      projects.flatMap((item) =>
        readStringArray(item.technologyIds).filter((id) => id !== "all")
      )
    )
  ).sort((a, b) =>
    getTechnologyLabel(a).localeCompare(getTechnologyLabel(b), "ko")
  );
  const queryLower = query.trim().toLowerCase();
  const filtered = projects.filter((item) => {
    const status = readString(item, ["projectStatus", "status"]) || "정보 없음";
    const techs = readStringArray(item.technologyIds);
    const text = [
      readString(item, ["id"]),
      readString(item, ["title", "projectName"]),
      readString(item, ["implementingOrganization", "implementer"]),
      readString(item, ["regionName", "location"]),
      techs.map(getTechnologyLabel).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (statusFilter === "all" || statusFilter === status) &&
      (techFilter === "all" || techs.includes(techFilter)) &&
      (!queryLower || text.includes(queryLower))
    );
  });
  const implementingCount = new Set(
    projects
      .map((item) =>
        readString(item, ["implementingOrganization", "implementer"])
      )
      .filter(Boolean)
  ).size;
  const summaryStatuses = ["이행 중", "승인", "완료"].filter((status) =>
    statuses.includes(status)
  );

  return (
    <div className="v33-stack">
      <section className="v33-summary-grid">
        <article className="primary">
          <span>관련 사업</span>
          <strong>{projects.length}건</strong>
          <small>현재 제공자료 기준</small>
        </article>
        {summaryStatuses.slice(0, 3).map((status) => (
          <article key={status}>
            <span>{status}</span>
            <strong>
              {
                projects.filter(
                  (item) =>
                    (readString(item, ["projectStatus", "status"]) ||
                      "정보 없음") === status
                ).length
              }
              건
            </strong>
            <small>사업 상태 기준</small>
          </article>
        ))}
        {summaryStatuses.length < 3 && (
          <article>
            <span>시행기관</span>
            <strong>{implementingCount}개</strong>
            <small>중복 제외</small>
          </article>
        )}
      </section>
      <section className="v33-filter-row project-filters">
        <label className="v33-field">
          <span>사업 검색</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="사업명·기관·지역 검색"
          />
        </label>
        <label className="v33-field">
          <span>사업 상태</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">전체</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="v33-field">
          <span>관련 기술</span>
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          >
            <option value="all">전체</option>
            {technologyIds.map((id) => (
              <option key={id} value={id}>
                {getTechnologyLabel(id)}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="v33-project-list">
        {filtered.map((project, index) => {
          const amount = readNumber(project, ["amount", "financing", "budget"]);
          const currency = readString(project, ["currency"]);
          const sourceUrl = readString(project, ["sourceUrl", "url"]);
          return (
            <article key={getStableKey(project) || String(index)}>
              <header>
                <div>
                  <span className="v33-eyebrow">
                    {readString(project, ["id"]) ||
                      readString(project, ["projectStatus", "status"])}
                  </span>
                  <h3>
                    {readString(project, ["title", "projectName"]) ||
                      dataset.titleKo}
                  </h3>
                </div>
                <div className="v33-project-amount">
                  <strong>
                    {amount === null
                      ? "금액 미확인"
                      : formatMoney(amount, currency)}
                  </strong>
                  <small>공개자료 기준 · 세부 금액은 사업 문서에서 확인</small>
                </div>
              </header>
              <div className="v33-tech-tags">
                {readStringArray(project.technologyIds).map((id) => (
                  <span key={id}>
                    {id === "all" ? "기후기술 전반" : getTechnologyLabel(id)}
                  </span>
                ))}
              </div>
              <dl className="v33-mini-dl two-column">
                <div>
                  <dt>사업 상태</dt>
                  <dd>
                    {readString(project, ["projectStatus", "status"]) ||
                      "미확인"}
                  </dd>
                </div>
                <div>
                  <dt>시행기관</dt>
                  <dd>
                    {readString(project, [
                      "implementingOrganization",
                      "implementer",
                    ]) || "미확인"}
                  </dd>
                </div>
                <div>
                  <dt>대상지역</dt>
                  <dd>
                    {readString(project, ["regionName", "location"]) ||
                      "국가 전체 또는 미확인"}
                  </dd>
                </div>
                <div>
                  <dt>사업기간</dt>
                  <dd>{formatPeriodRange(project)}</dd>
                </div>
              </dl>
              {sourceUrl && (
                <button
                  type="button"
                  className="v33-inline-button"
                  onClick={() => openExternalUrl(sourceUrl)}
                >
                  사업 원문 확인 ↗
                </button>
              )}
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <EmptyState label="현재 조건에 맞는 사업 없음" />
      )}
    </div>
  );
}

function GeospatialView({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const features = asRecordArray(payload.features);
  if (features.length === 0)
    return <EmptyState label="현재 표시 가능한 위치자료 없음" />;
  const located = features.filter(
    (feature) =>
      readNumber(feature, ["latitude", "lat"]) !== null &&
      readNumber(feature, ["longitude", "lng", "lon"]) !== null
  ).length;
  return (
    <div className="v33-stack">
      <section className="v33-summary-grid compact">
        <article className="primary">
          <span>공간 객체</span>
          <strong>{features.length}개</strong>
          <small>현재 제공자료 기준</small>
        </article>
        <article>
          <span>좌표 확인</span>
          <strong>{located}개</strong>
          <small>위치가 확인된 자료만 지도 표시</small>
        </article>
      </section>
      <GeospatialPayloadMap
        features={features}
        sourceUrl={payload.sourceUrl || dataset.sourceUrl}
        onOpenSource={() =>
          openExternalUrl(payload.sourceUrl || dataset.sourceUrl)
        }
      />
      <div className="v33-neutral-note">
        공식 위치정보가 있는 기관·사업만 지도에 표시
      </div>
    </div>
  );
}

function Limitations({
  dataset,
  payload,
}: {
  dataset: Dataset;
  payload: V33LoadedPayload;
}) {
  const payloadLimitations = readStringArray(payload.limitations);
  const items =
    payloadLimitations.length > 0 ? payloadLimitations : dataset.limitations;
  if (!items || items.length === 0) return null;
  return (
    <details className="v33-limitations">
      <summary>해석 시 유의사항</summary>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

function V33LineChart({ rows, unit }: { rows: JsonRecord[]; unit: string }) {
  const points = rows
    .map((row, index) => ({
      index,
      period: getPeriod(row),
      value: readNumber(row, ["value"]),
    }))
    .filter(
      (item): item is { index: number; period: string; value: number } =>
        item.value !== null
    );
  if (points.length < 2)
    return <EmptyState label="그래프를 표시하려면 2개 이상의 값 필요" />;
  const width = 860;
  const height = 270;
  const padX = 54;
  const padY = 34;
  const values = points.map((item) => item.value);
  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);
  if (minValue === maxValue) {
    minValue -= 1;
    maxValue += 1;
  }
  const x = (index: number) =>
    padX + (index / Math.max(1, points.length - 1)) * (width - padX * 2);
  const y = (value: number) =>
    height -
    padY -
    ((value - minValue) / (maxValue - minValue)) * (height - padY * 2);
  const polyline = points
    .map((item, index) => `${x(index)},${y(item.value)}`)
    .join(" ");
  return (
    <section className="v33-panel v33-line-chart">
      <PanelHeading
        title="기간별 변화"
        note={`원값 기준${unit ? ` · ${unit}` : ""}`}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="시계열 그래프"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = maxValue - (maxValue - minValue) * ratio;
          const yy = padY + (height - padY * 2) * ratio;
          return (
            <g key={ratio}>
              <line x1={padX} y1={yy} x2={width - padX} y2={yy} />
              <text x={6} y={yy + 4}>
                {formatCompactNumber(value)}
              </text>
            </g>
          );
        })}
        <polyline points={polyline} />
        {points.map((item, index) => (
          <circle
            key={`${item.period}-${index}`}
            cx={x(index)}
            cy={y(item.value)}
            r="4"
          />
        ))}
        <text x={padX} y={height - 8}>
          {points[0].period}
        </text>
        <text x={width - padX} y={height - 8} textAnchor="end">
          {points[points.length - 1].period}
        </text>
      </svg>
    </section>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "chart" | "table";
  onChange: (value: "chart" | "table") => void;
}) {
  return (
    <div className="v33-view-toggle" role="group" aria-label="주요 정보">
      <button
        type="button"
        className={value === "chart" ? "active" : ""}
        onClick={() => onChange("chart")}
      >
        차트
      </button>
      <button
        type="button"
        className={value === "table" ? "active" : ""}
        onClick={() => onChange("table")}
      >
        표
      </button>
    </div>
  );
}

function PanelHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="v33-panel-heading">
      <div>
        <h3>{title}</h3>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="v33-table-wrap">
      <table className="v33-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, cellIndex) => (
                <td key={cellIndex}>{value || "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="v33-empty-state">
      <strong>{label}</strong>
      <span>자료 없음은 숫자 0과 다른 의미</span>
    </div>
  );
}

function normalizeRepresentationType(
  value: unknown
): DataRepresentationType | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/-/g, "_");
  const allowed: DataRepresentationType[] = [
    "numeric",
    "time_series",
    "categorical",
    "verification",
    "text",
    "document",
    "organization",
    "project_finance",
    "geospatial",
  ];
  return allowed.includes(normalized as DataRepresentationType)
    ? (normalized as DataRepresentationType)
    : null;
}

function getPayloadRecordCount(payload: V33LoadedPayload): number | null {
  const candidates = [
    payload.rows,
    payload.series,
    payload.documents,
    payload.organizations,
    payload.projects,
    payload.features,
  ];
  for (const candidate of candidates)
    if (Array.isArray(candidate)) return candidate.length;
  if (Array.isArray(payload.procedures)) return payload.procedures.length;
  return null;
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
function readString(record: JsonRecord | undefined, keys: string[]): string {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }
  return "";
}
function readNumber(
  record: JsonRecord | undefined,
  keys: string[]
): number | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    )
      return Number(value);
  }
  return null;
}
function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string" && Boolean(item.trim())
        )
        .map((item) => item.trim())
    : [];
}
function getStableKey(row: JsonRecord): string {
  return readString(row, [
    "recordId",
    "id",
    "iso3",
    "countryIso3",
    "regionId",
    "name",
    "title",
  ]);
}
function getRowLabel(row: JsonRecord, index: number): string {
  return (
    readString(row, [
      "label",
      "countryNameKo",
      "countryName",
      "name",
      "title",
      "iso3",
      "regionName",
    ]) || `항목 ${index + 1}`
  );
}
function getGroupLabel(row: JsonRecord | undefined, fallback: string): string {
  return (
    readString(row, [
      "countryNameKo",
      "countryName",
      "regionName",
      "organizationName",
      "label",
      "name",
    ]) || fallback
  );
}
function getPeriod(row: JsonRecord): string {
  return readString(row, ["period", "year", "date", "referencePeriod"]) || "-";
}
function formatValue(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return "자료 없음";
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(
    value
  )}${unit ? ` ${unit}` : ""}`;
}
function formatSignedValue(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return "자료 없음";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value)}${unit ? ` ${unit}` : ""}`;
}
function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
function formatMoney(amount: number, currency: string): string {
  if (!currency)
    return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
      amount
    );
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("ko-KR").format(
      amount
    )} ${currency}`.trim();
  }
}
function getTechnologyLabel(id: string): string {
  return id === "all"
    ? "기후기술 전반"
    : CLIMATE_TECHNOLOGY_BY_ID.get(id)?.nameKo || id;
}
function formatTechnologyIds(value: unknown): string {
  const ids = readStringArray(value);
  return ids.length
    ? ids.map(getTechnologyLabel).join(" · ")
    : "특정 기술 미지정";
}
function statusClass(status: string): string {
  return status
    .replace(/_/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase();
}
function formatPeriodRange(project: JsonRecord): string {
  const start = readString(project, ["startDate", "startYear"]);
  const end = readString(project, ["endDate", "endYear"]);
  if (start && end) return `${start} ~ ${end}`;
  return start || end || "미확인";
}
