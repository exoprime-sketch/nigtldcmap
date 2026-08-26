import { useMemo, useState } from "react";
import {
  MAP_ELEMENT_AUDIT_V115,
  MAP_ELEMENT_COVERAGE_V115,
} from "../../data/map/mapElementAuditV115";
import type {
  MapElementAuditRowV115,
} from "../../data/map/mapElementAuditV115";
import {
  MAP_CATALOG_CATEGORIES_V115,
  MAP_LAYER_REGISTRY_INDEX_V115,
} from "../../data/map/mapLayerRegistryV115";
import { getRendererDefinitionV115 } from "./GenericMapRenderersV115";

interface MapDataCatalogV115Props {
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  onOpenElement: (elementId: string) => void;
  mapDemoEnabled: boolean;
}

const DECISION_LABEL: Record<MapElementAuditRowV115["mapDecision"], string> = {
  "direct-layer": "지도 레이어",
  "country-aggregate": "국가 집계",
  flow: "흐름 지도",
  filter: "지도 필터",
  "evidence-panel": "국가 상세정보",
  "not-map-suitable": "데이터 상세에서 확인",
};

function normalizedText(row: MapElementAuditRowV115): string {
  return [
    row.label,
    row.mapCategory,
    row.dataGroup,
    row.source,
    row.cooperationUse,
    row.elementId,
  ]
    .join(" ")
    .toLowerCase();
}

export default function MapDataCatalogV115({
  selectedElementId,
  onSelectElement,
  onOpenElement,
  mapDemoEnabled,
}: MapDataCatalogV115Props) {
  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([
    "협력수요",
    "사업·재원",
    "에너지·인프라",
  ]);

  const normalizedQuery = query.trim().toLowerCase();

  const rows = useMemo(
    () =>
      MAP_ELEMENT_AUDIT_V115.filter((row) =>
        normalizedQuery ? normalizedText(row).includes(normalizedQuery) : true
      ),
    [normalizedQuery]
  );

  function toggleCategory(category: string) {
    setOpenCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  return (
    <section className="v115-map-catalog" aria-label="지도 데이터 카탈로그">
      <div className="v115-map-catalog__header">
        <div>
          <span>지도 데이터 카탈로그</span>
          <strong>
            지도에서 확인할 수 있는 데이터{" "}
            {MAP_ELEMENT_COVERAGE_V115.totalElements -
              MAP_ELEMENT_COVERAGE_V115.notMapSuitable}
            개
          </strong>
        </div>
        <small>
          전체 {MAP_ELEMENT_COVERAGE_V115.totalElements}개 요소를 지도 활용성
          기준으로 전수 검토
        </small>
      </div>

      <label className="v115-map-search">
        <span className="sr-only">지도에서 데이터 찾기</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="지도에서 데이터 찾기 · 전력, 홍수, ODA, GCF, TNA"
        />
      </label>

      {normalizedQuery && (
        <div className="v115-map-search-summary">
          <b>{rows.length}개</b> 검색결과
        </div>
      )}

      <div className="v115-map-catalog__groups">
        {MAP_CATALOG_CATEGORIES_V115.map((category) => {
          const categoryRows = rows.filter(
            (row) => row.mapCategory === category
          );
          if (!categoryRows.length) return null;
          const isOpen = normalizedQuery
            ? true
            : openCategories.includes(category);
          return (
            <div className="v115-map-catalog__group" key={category}>
              <button
                type="button"
                className="v115-map-catalog__group-toggle"
                onClick={() => toggleCategory(category)}
                aria-expanded={isOpen}
              >
                <span>{category}</span>
                <small>{categoryRows.length}</small>
                <i>{isOpen ? "−" : "+"}</i>
              </button>

              {isOpen && (
                <div className="v115-map-catalog__rows">
                  {categoryRows.map((row) => {
                    const registry = MAP_LAYER_REGISTRY_INDEX_V115.get(
                      row.elementId
                    );
                    const renderer = registry
                      ? getRendererDefinitionV115(registry.renderer)
                      : null;
                    const selected = row.elementId === selectedElementId;
                    const canShowActual =
                      row.actualDataAvailable &&
                      row.mapDecision !== "evidence-panel" &&
                      row.mapDecision !== "filter" &&
                      row.mapDecision !== "not-map-suitable";
                    const canShowSynthetic =
                      mapDemoEnabled &&
                      row.mockAllowed &&
                      !row.actualDataAvailable;
                    const selectable = row.mapDecision !== "not-map-suitable";

                    return (
                      <article
                        className={`v115-map-catalog-row ${
                          selected ? "selected" : ""
                        }`}
                        key={row.elementId}
                      >
                        <button
                          type="button"
                          className="v115-map-catalog-row__main"
                          onClick={() =>
                            selectable
                              ? onSelectElement(row.elementId)
                              : onOpenElement(row.elementId)
                          }
                        >
                          <span className="v115-map-catalog-row__title">
                            {row.label}
                          </span>
                          <span className="v115-map-catalog-row__meta">
                            <em>{DECISION_LABEL[row.mapDecision]}</em>
                            {renderer && <em>{renderer.label}</em>}
                            {row.actualDataAvailable ? (
                              <em className="actual">실제 데이터</em>
                            ) : row.mockAllowed ? (
                              <em
                                className={
                                  mapDemoEnabled ? "synthetic" : "pending"
                                }
                              >
                                {mapDemoEnabled
                                  ? "시각화 예시"
                                  : "데이터 준비 중"}
                              </em>
                            ) : (
                              <em>상세정보</em>
                            )}
                          </span>
                        </button>

                        <div className="v115-map-catalog-row__footer">
                          <small>
                            {row.mapDecision === "not-map-suitable"
                              ? row.reason
                              : row.cooperationUse}
                          </small>
                          <button
                            type="button"
                            onClick={() => onOpenElement(row.elementId)}
                          >
                            데이터 상세보기
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="v115-map-catalog__coverage">
        <span>
          직접표현 <b>{MAP_ELEMENT_COVERAGE_V115.directLayers}</b>
        </span>
        <span>
          국가집계 <b>{MAP_ELEMENT_COVERAGE_V115.countryAggregates}</b>
        </span>
        <span>
          흐름 <b>{MAP_ELEMENT_COVERAGE_V115.flows}</b>
        </span>
        <span>
          필터 <b>{MAP_ELEMENT_COVERAGE_V115.filters}</b>
        </span>
        <span>
          국가 상세 <b>{MAP_ELEMENT_COVERAGE_V115.evidencePanel}</b>
        </span>
      </div>
    </section>
  );
}
