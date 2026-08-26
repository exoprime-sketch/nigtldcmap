import { useMemo, useState } from "react";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  getSemanticCollectionKindV65,
  getSemanticColumnsV65,
  getSemanticFiltersV65,
  semanticExampleValueV65,
} from "../../utils/dataSemanticPresentationV65";
import "../../styles/semantic-collection-v65.css";

interface Props {
  element: VietnamDemoElement;
  countryName: string;
}

export default function SemanticCollectionPreviewV65({
  element,
  countryName,
}: Props) {
  const kind = getSemanticCollectionKindV65(element);
  const filters = getSemanticFiltersV65(element.elementId);

  if (!kind) return null;

  if (kind === "policy_matrix") {
    return (
      <PolicyMatrixPreviewV65
        element={element}
        countryName={countryName}
        filters={filters}
      />
    );
  }

  return (
    <RegistryPreviewV65
      element={element}
      countryName={countryName}
      filters={filters}
      kind={kind}
    />
  );
}

function RegistryPreviewV65({
  element,
  countryName,
  filters,
  kind,
}: {
  element: VietnamDemoElement;
  countryName: string;
  filters: ReturnType<typeof getSemanticFiltersV65>;
  kind: string;
}) {
  const columns = getSemanticColumnsV65(element);
  const [filterValues, setFilterValues] = useState(
    filters.map((filter) => filter.options[0] ?? "전체")
  );

  const rows = useMemo(
    () =>
      Array.from({ length: 3 }, (_, rowIndex) =>
        columns.map((column) => semanticExampleValueV65(column, rowIndex))
      ),
    [columns]
  );

  return (
    <section className="v65-semantic-registry">
      <header className="v65-registry-head">
        <div>
          <span>{countryName}</span>
          <h4>{getRegistryHeading(element.elementId, kind)}</h4>
        </div>
        <small>예시 화면 · 데이터 준비 중</small>
      </header>

      {filters.length > 0 && (
        <div className="v65-filter-row">
          {filters.map((filter, index) => (
            <label key={filter.label}>
              <span>{filter.label}</span>
              <select
                value={filterValues[index]}
                onChange={(event) => {
                  const next = [...filterValues];
                  next[index] = event.target.value;
                  setFilterValues(next);
                }}
              >
                {filter.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <div className="v65-table-wrap">
        <div
          className="v65-table-head"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <b key={column}>{column}</b>
          ))}
        </div>

        {rows.map((row, rowIndex) => (
          <div
            className="v65-table-row"
            key={rowIndex}
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))`,
            }}
          >
            {row.map((value, cellIndex) => (
              <span key={cellIndex}>{value}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function PolicyMatrixPreviewV65({
  element,
  countryName,
  filters,
}: {
  element: VietnamDemoElement;
  countryName: string;
  filters: ReturnType<typeof getSemanticFiltersV65>;
}) {
  const [filterValues, setFilterValues] = useState(
    filters.map((filter) => filter.options[0] ?? "전체")
  );

  return (
    <section className="v65-policy-matrix">
      <header>
        <div>
          <span>{countryName}</span>
          <h4>정책·제도 핵심정보</h4>
        </div>
        <small>예시 화면 · 데이터 준비 중</small>
      </header>

      {filters.length > 0 && (
        <div className="v65-filter-row">
          {filters.map((filter, index) => (
            <label key={filter.label}>
              <span>{filter.label}</span>
              <select
                value={filterValues[index]}
                onChange={(event) => {
                  const next = [...filterValues];
                  next[index] = event.target.value;
                  setFilterValues(next);
                }}
              >
                {filter.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <div className="v65-policy-rows">
        {element.presentation.headlineFields.map((field, index) => (
          <article key={field}>
            <div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{field}</b>
            </div>
            <strong>{semanticExampleValueV65(field, index)}</strong>
            <small>공식 출처와 함께 제공 예정</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function getRegistryHeading(elementId: string, kind: string): string {
  const labels: Record<string, string> = {
    "A-029": "협정별 체결·발효 현황",
    "B-015": "탄소가격 제도 현황",
    "C-007": "등록 활동·참여 현황",
    "C-008": "기후이니셔티브 참여 현황",
    "C-009": "법령·규제·인센티브 목록",
    "C-010": "환경 법령·규제 목록",
    "C-016": "재생에너지 목표·입찰 일정",
    "C-021": "VCM 프로젝트 파이프라인",
    "E-014": "양자협정 목록",
  };

  if (labels[elementId]) return labels[elementId];

  if (kind === "directory") return "기관별 상세정보";
  if (kind === "research") return "논문·특허 목록";
  if (kind === "portfolio") return "프로젝트·사업 목록";

  return "항목별 현황";
}
