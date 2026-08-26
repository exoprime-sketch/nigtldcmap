import { useMemo } from "react";
import type {
  VietnamEntityV121,
  VietnamIndicatorMetaV121,
  VietnamObservationV121,
} from "../../data/vietnam/vietnamTypesV121";
import {
  entityDisplayNameV121,
  fieldLabelV121,
  formatValueV121,
} from "../../utils/vietnamActualV121";
import "../../styles/data-full-preview-v52.css";

interface Props {
  elementId: string;
  countryNameKo?: string;
  observations?: VietnamObservationV121[];
  entities?: VietnamEntityV121[];
  indicators?: VietnamIndicatorMetaV121[];
  selectedIndicatorId?: string;
}

type LatestItem = {
  indicatorId: string;
  label: string;
  unit: string;
  value: number | string | boolean;
  year: number | null;
  period: string | null;
  note: string | null;
};

const ENTITY_FACT_KEYS = [
  "fund",
  "sector",
  "status",
  "fuelType",
  "capacityMw",
  "capacityBand",
  "regionName",
  "technologyField",
  "organizationType",
  "implementingEntity",
  "accreditedEntity",
  "owner",
] as const;

/**
 * v123 actual-data visualization.
 *
 * 파일명은 기존 import 경로 호환을 위해 V52를 유지하지만,
 * Props 계약은 CountryDataElementPage의 실제 v122/v123 호출 방식에 맞춘다.
 */
export default function CountryDataFullPreviewV52({
  elementId: _elementId,
  countryNameKo = "대상국",
  observations = [],
  entities = [],
  indicators = [],
  selectedIndicatorId = "all",
}: Props) {
  const indicatorById = useMemo(
    () => new Map(indicators.map((item) => [item.indicatorId, item])),
    [indicators]
  );

  const visibleObservations = useMemo(
    () =>
      selectedIndicatorId === "all"
        ? observations
        : observations.filter((row) => row.indicatorId === selectedIndicatorId),
    [observations, selectedIndicatorId]
  );

  const visibleEntities = useMemo(
    () =>
      selectedIndicatorId === "all"
        ? entities
        : entities.filter((row) => row.indicatorId === selectedIndicatorId),
    [entities, selectedIndicatorId]
  );

  const latestItems = useMemo(
    () => buildLatestItems(visibleObservations, indicatorById, countryNameKo),
    [visibleObservations, indicatorById, countryNameKo]
  );

  const numericItems = latestItems.filter(
    (item): item is LatestItem & { value: number } =>
      typeof item.value === "number" && Number.isFinite(item.value)
  );
  const evidenceItems = latestItems.filter(
    (item) => typeof item.value !== "number"
  );

  if (visibleObservations.length === 0 && visibleEntities.length === 0) {
    return (
      <section className="cev123-shell" aria-label="데이터 시각화">
        <header className="cev123-heading">
          <div>
            <span>데이터 시각화</span>
            <h3>현재 선택한 항목의 공개 데이터가 없습니다</h3>
          </div>
          <small>{countryNameKo}</small>
        </header>
        <div className="cev123-empty">
          <strong>표시 가능한 레코드 없음</strong>
          <p>다른 항목을 선택하거나 출처·이용조건 탭을 확인해 주세요</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cev123-shell" aria-label="데이터 시각화">
      <header className="cev123-heading">
        <div>
          <span>실제 데이터 시각화</span>
          <h3>선택 데이터 핵심값 요약</h3>
        </div>
        <small>
          {countryNameKo} · 수치{" "}
          {visibleObservations.length.toLocaleString("ko-KR")}건 · 개체{" "}
          {visibleEntities.length.toLocaleString("ko-KR")}건
        </small>
      </header>

      <div className="cev123-layout">
        {numericItems.length > 0 && <NumericOverview items={numericItems} />}

        {evidenceItems.length > 0 && <EvidenceOverview items={evidenceItems} />}

        {visibleEntities.length > 0 && (
          <EntityOverview
            entities={visibleEntities}
            indicatorById={indicatorById}
            countryNameKo={countryNameKo}
          />
        )}
      </div>
    </section>
  );
}

function NumericOverview({
  items,
}: {
  items: Array<LatestItem & { value: number }>;
}) {
  const unitGroups = useMemo(() => {
    const groups = new Map<string, Array<LatestItem & { value: number }>>();
    items.forEach((item) => {
      const unit = item.unit.trim() || "단위 미기재";
      const bucket = groups.get(unit) || [];
      bucket.push(item);
      groups.set(unit, bucket);
    });
    return Array.from(groups.entries())
      .map(([unit, rows]) => ({ unit, rows }))
      .sort((a, b) => b.rows.length - a.rows.length)
      .slice(0, 5);
  }, [items]);

  return (
    <section className="cev123-card">
      <div className="cev123-card__header">
        <div>
          <span className="cev123-eyebrow">최신 핵심값</span>
          <h4>세부 항목별 최신 공개값</h4>
          <p>단위가 다른 값은 서로 다른 묶음으로 구분합니다</p>
        </div>
        <strong className="cev123-total-badge">{items.length}개 지표</strong>
      </div>

      <div className="cev123-unit-groups">
        {unitGroups.map(({ unit, rows }) => {
          const shown = rows.slice(0, 8);
          const maxAbs = Math.max(
            ...shown.map((item) => Math.abs(item.value)),
            1e-9
          );
          return (
            <div className="cev123-unit-group" key={unit}>
              <div className="cev123-unit-group__title">
                <strong>{unit}</strong>
                <span>{rows.length}개 항목</span>
              </div>
              <div className="cev123-bars">
                {shown.map((item) => (
                  <div className="cev123-bar-row" key={item.indicatorId}>
                    <div className="cev123-bar-row__label" title={item.label}>
                      <span>{item.label}</span>
                      {item.year !== null && <small>{item.year}</small>}
                    </div>
                    <div className="cev123-bar-track" aria-hidden="true">
                      <i
                        className={item.value < 0 ? "is-negative" : ""}
                        style={{
                          width: `${Math.max(
                            3,
                            Math.min(100, (Math.abs(item.value) / maxAbs) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <strong className="cev123-bar-value">
                      {formatMeasure(item.value, item.unit)}
                    </strong>
                  </div>
                ))}
              </div>
              {rows.length > shown.length && (
                <div className="cev123-inline-note">
                  나머지 {rows.length - shown.length}개 항목은 아래 수치 자료
                  표에서 확인할 수 있습니다
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EvidenceOverview({ items }: { items: LatestItem[] }) {
  const shown = items.slice(0, 8);
  return (
    <section className="cev123-card">
      <div className="cev123-card__header">
        <div>
          <span className="cev123-eyebrow">텍스트·정책 값</span>
          <h4>항목별 최신 확인 내용</h4>
          <p>원자료의 텍스트 값을 축약하여 빠르게 확인할 수 있습니다</p>
        </div>
        <strong className="cev123-total-badge">{items.length}개 항목</strong>
      </div>

      <div className="cev123-evidence-grid">
        {shown.map((item) => (
          <article key={item.indicatorId}>
            <span>{item.label}</span>
            <strong>{clipText(formatValueV121(item.value), 170)}</strong>
            <small>
              {[
                item.year,
                item.period,
                item.note ? clipText(item.note, 80) : null,
              ]
                .filter(Boolean)
                .join(" · ") || "기준정보 미기재"}
            </small>
          </article>
        ))}
      </div>

      {items.length > shown.length && (
        <div className="cev123-inline-note">
          나머지 {items.length - shown.length}개 항목은 아래 표에서 확인할 수
          있습니다
        </div>
      )}
    </section>
  );
}

function EntityOverview({
  entities,
  indicatorById,
  countryNameKo,
}: {
  entities: VietnamEntityV121[];
  indicatorById: Map<string, VietnamIndicatorMetaV121>;
  countryNameKo: string;
}) {
  const shown = entities.slice(0, 6);
  const coordinateCount = entities.filter(hasValidCoordinate).length;

  return (
    <section className="cev123-card">
      <div className="cev123-card__header">
        <div>
          <span className="cev123-eyebrow">개체·사업 목록</span>
          <h4>주요 개체 요약</h4>
          <p>기관·사업·시설 등 개체형 자료의 주요 속성을 표시합니다</p>
        </div>
        <strong className="cev123-total-badge">
          {entities.length.toLocaleString("ko-KR")}건
        </strong>
      </div>

      {coordinateCount > 0 && (
        <div className="cev123-inline-note">
          유효 좌표 {coordinateCount.toLocaleString("ko-KR")}건 확인 · 실제
          위치는 상단의 ‘지도에서 보기’에서 확인할 수 있습니다
        </div>
      )}

      <div className="cev123-evidence-grid">
        {shown.map((entity) => {
          const meta = entity.indicatorId
            ? indicatorById.get(entity.indicatorId)
            : undefined;
          return (
            <article key={entity.recordId}>
              <span>
                {meta
                  ? publicIndicatorLabel(meta.labelKo, countryNameKo)
                  : entity.entityType || "개체"}
              </span>
              <strong>{entityDisplayNameV121(entity)}</strong>
              <small>
                {entityFacts(entity).join(" · ") || "세부 속성 확인"}
              </small>
            </article>
          );
        })}
      </div>

      {entities.length > shown.length && (
        <div className="cev123-inline-note">
          대표 {shown.length}건만 표시합니다 · 전체
          {` ${entities.length.toLocaleString("ko-KR")}건`}은 아래 표에서 검색할
          수 있습니다
        </div>
      )}
    </section>
  );
}

function buildLatestItems(
  rows: VietnamObservationV121[],
  indicatorById: Map<string, VietnamIndicatorMetaV121>,
  countryNameKo: string
): LatestItem[] {
  const grouped = new Map<string, VietnamObservationV121[]>();
  rows.forEach((row) => {
    const bucket = grouped.get(row.indicatorId) || [];
    bucket.push(row);
    grouped.set(row.indicatorId, bucket);
  });

  return Array.from(grouped.entries())
    .map(([indicatorId, values]): LatestItem | null => {
      const usable = values.filter(
        (row) =>
          row.value !== null && row.value !== undefined && row.value !== ""
      );
      if (usable.length === 0) return null;
      const latest = [...usable].sort(compareRecency)[0];
      const meta = indicatorById.get(indicatorId);
      return {
        indicatorId,
        label: publicIndicatorLabel(
          meta?.labelKo || indicatorId,
          countryNameKo
        ),
        unit: meta?.unit || latest.unit || "",
        value: latest.value as number | string | boolean,
        year: typeof latest.year === "number" ? latest.year : null,
        period: latest.period || null,
        note: latest.note || null,
      };
    })
    .filter((item): item is LatestItem => item !== null);
}

function compareRecency(
  left: VietnamObservationV121,
  right: VietnamObservationV121
): number {
  const leftYear = typeof left.year === "number" ? left.year : -Infinity;
  const rightYear = typeof right.year === "number" ? right.year : -Infinity;
  if (rightYear !== leftYear) return rightYear - leftYear;
  return (right.period || "").localeCompare(left.period || "", "ko");
}

function entityFacts(entity: VietnamEntityV121): string[] {
  const facts: string[] = [];
  for (const key of ENTITY_FACT_KEYS) {
    const value = scalarText(entity.normalizedAttributes?.[key]);
    if (!value) continue;
    facts.push(`${fieldLabelV121(key)} ${clipText(value, 45)}`);
    if (facts.length === 2) break;
  }
  return facts;
}

function hasValidCoordinate(entity: VietnamEntityV121): boolean {
  return (
    typeof entity.latitude === "number" &&
    Number.isFinite(entity.latitude) &&
    entity.latitude >= -90 &&
    entity.latitude <= 90 &&
    typeof entity.longitude === "number" &&
    Number.isFinite(entity.longitude) &&
    entity.longitude >= -180 &&
    entity.longitude <= 180
  );
}

function publicIndicatorLabel(label: string, countryNameKo: string): string {
  let cleaned = label.replace(/\s+[–—]\s+.*$/, "").trim();
  if (countryNameKo.trim()) {
    const suffix = new RegExp(
      `\\s*[·•]\\s*${escapeRegExp(countryNameKo.trim())}\\s*$`,
      "i"
    );
    cleaned = cleaned.replace(suffix, "").trim();
  }
  return cleaned || "항목";
}

function scalarText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return formatValueV121(value);
  }
  return "";
}

function formatMeasure(value: number, unit: string): string {
  const formatted = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
  }).format(value);
  return unit.trim() ? `${formatted} ${unit.trim()}` : formatted;
}

function clipText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
