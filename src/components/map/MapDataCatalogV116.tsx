import { useMemo, useState } from "react";
import {
  MAP_ELEMENT_AUDIT_V115,
} from "../../data/map/mapElementAuditV115";
import type {
  MapElementAuditRowV115,
} from "../../data/map/mapElementAuditV115";
import {
  COOPERATION_DECISION_ROLE_LABELS_V116,
  MAP_ELEMENT_DECISION_INDEX_V116,
} from "../../data/map/mapElementDecisionV116";
import type {
  VisualPriorityV116,
} from "../../data/map/mapElementDecisionV116";
import {
  MAP_CATALOG_CATEGORIES_V116,
  MAP_LAYER_REGISTRY_INDEX_V116,
} from "../../data/map/mapLayerRegistryV116";
import { SPATIAL_RESOLUTION_LABELS_V116 } from "../../types/spatialDataV116";
import { getRendererDefinitionV115 } from "./GenericMapRenderersV115";

interface MapDataCatalogV116Props {
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  onOpenElement: (elementId: string) => void;
}

const DECISION_LABEL: Record<MapElementAuditRowV115["mapDecision"], string> = {
  "direct-layer": "지도 레이어",
  "country-aggregate": "국가 집계",
  flow: "흐름 지도",
  filter: "지도 필터",
  "evidence-panel": "선택지역 상세",
  "not-map-suitable": "데이터 상세에서 확인",
};

const PRIORITY_WEIGHT: Record<VisualPriorityV116, number> = {
  core: 0,
  supporting: 1,
  "on-demand": 2,
};

function normalizedText(row: MapElementAuditRowV115): string {
  const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(row.elementId);
  return [
    row.label,
    row.mapCategory,
    row.dataGroup,
    row.source,
    row.cooperationUse,
    row.elementId,
    ...(decision?.cooperationDecisionRoles.map(
      (role) => COOPERATION_DECISION_ROLE_LABELS_V116[role]
    ) ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export default function MapDataCatalogV116({
  selectedElementId,
  onSelectElement,
  onOpenElement,
}: MapDataCatalogV116Props) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"priority" | "all">("priority");
  const [openCategories, setOpenCategories] = useState<string[]>([
    "협력수요",
    "사업·재원",
    "에너지·인프라",
  ]);

  const normalizedQuery = query.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = MAP_ELEMENT_AUDIT_V115.filter((row) =>
      normalizedQuery ? normalizedText(row).includes(normalizedQuery) : true
    );
    return [...filtered].sort((left, right) => {
      if (viewMode === "all")
        return left.label.localeCompare(right.label, "ko");
      const leftDecision = MAP_ELEMENT_DECISION_INDEX_V116.get(left.elementId);
      const rightDecision = MAP_ELEMENT_DECISION_INDEX_V116.get(
        right.elementId
      );
      const leftPriority =
        PRIORITY_WEIGHT[leftDecision?.visualPriority ?? "on-demand"];
      const rightPriority =
        PRIORITY_WEIGHT[rightDecision?.visualPriority ?? "on-demand"];
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      if (left.actualDataAvailable !== right.actualDataAvailable) {
        return left.actualDataAvailable ? -1 : 1;
      }
      return left.label.localeCompare(right.label, "ko");
    });
  }, [normalizedQuery, viewMode]);

  function toggleCategory(category: string) {
    setOpenCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  return (
    <section className="v116-map-catalog" aria-label="지도 데이터 카탈로그">
      <div className="v116-map-catalog__header">
        <div>
          <span>지도 데이터 카탈로그</span>
          <strong>협력기획에 활용 가능한 공간정보를 한곳에서 탐색</strong>
        </div>
        <small>
          152개 요소를 사업기획 역할·공간단위·시각화 방식까지 다시 판정
        </small>
      </div>

      <label className="v116-map-search">
        <span className="sr-only">지도에서 데이터 찾기</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="지도에서 데이터 찾기 · 전력, 홍수, ODA, GCF, TNA, 시멘트"
        />
      </label>

      <div className="v116-map-catalog__sort">
        <button
          type="button"
          className={viewMode === "priority" ? "active" : ""}
          onClick={() => setViewMode("priority")}
        >
          국제협력 활용도 높은 순
        </button>
        <button
          type="button"
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          모든 데이터
        </button>
      </div>

      {normalizedQuery && (
        <div className="v116-map-search-summary">
          <b>{rows.length}개</b> 검색결과
        </div>
      )}

      <div className="v116-map-catalog__groups">
        {MAP_CATALOG_CATEGORIES_V116.map((category) => {
          const categoryRows = rows.filter(
            (row) => row.mapCategory === category
          );
          if (!categoryRows.length) return null;
          const isOpen = normalizedQuery
            ? true
            : openCategories.includes(category);
          return (
            <div className="v116-map-catalog__group" key={category}>
              <button
                type="button"
                className="v116-map-catalog__group-toggle"
                onClick={() => toggleCategory(category)}
                aria-expanded={isOpen}
              >
                <span>{category}</span>
                <small>{categoryRows.length}</small>
                <i>{isOpen ? "−" : "+"}</i>
              </button>

              {isOpen && (
                <div className="v116-map-catalog__rows">
                  {categoryRows.map((row) => {
                    const registry = MAP_LAYER_REGISTRY_INDEX_V116.get(
                      row.elementId
                    );
                    const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(
                      row.elementId
                    );
                    const renderer = registry
                      ? getRendererDefinitionV115(registry.renderer)
                      : null;
                    const selected = row.elementId === selectedElementId;
                    const selectable = row.mapDecision !== "not-map-suitable";
                    const actualLabel = row.actualDataAvailable
                      ? "실제 데이터"
                      : row.mockAllowed
                      ? "시각화 예시"
                      : "상세정보";

                    return (
                      <article
                        className={`v116-map-catalog-row ${
                          selected ? "selected" : ""
                        }`}
                        key={row.elementId}
                      >
                        <button
                          type="button"
                          className="v116-map-catalog-row__main"
                          onClick={() =>
                            selectable
                              ? onSelectElement(row.elementId)
                              : onOpenElement(row.elementId)
                          }
                        >
                          <span className="v116-map-catalog-row__title">
                            {row.label}
                            {decision?.visualPriority === "core" && (
                              <em className="core">협력기획 핵심</em>
                            )}
                          </span>
                          <span className="v116-map-catalog-row__meta">
                            <em>{DECISION_LABEL[row.mapDecision]}</em>
                            {renderer && <em>{renderer.label}</em>}
                            <em
                              className={
                                row.actualDataAvailable
                                  ? "actual"
                                  : row.mockAllowed
                                  ? "synthetic"
                                  : ""
                              }
                            >
                              {actualLabel}
                            </em>
                          </span>
                          {decision && (
                            <span className="v116-map-catalog-row__spatial">
                              <em>
                                현재{" "}
                                {
                                  SPATIAL_RESOLUTION_LABELS_V116[
                                    decision.actualResolution
                                  ]
                                }
                              </em>
                              {decision.preferredResolution !==
                                decision.actualResolution && (
                                <em>
                                  권장{" "}
                                  {
                                    SPATIAL_RESOLUTION_LABELS_V116[
                                      decision.preferredResolution
                                    ]
                                  }
                                </em>
                              )}
                            </span>
                          )}
                          {decision && (
                            <span className="v116-map-catalog-row__roles">
                              {decision.cooperationDecisionRoles
                                .slice(0, 3)
                                .map((role) => (
                                  <em key={role}>
                                    {
                                      COOPERATION_DECISION_ROLE_LABELS_V116[
                                        role
                                      ]
                                    }
                                  </em>
                                ))}
                            </span>
                          )}
                        </button>

                        <div className="v116-map-catalog-row__footer">
                          <small>
                            {row.mapDecision === "not-map-suitable"
                              ? row.reason
                              : decision?.spatialRationale ??
                                row.cooperationUse}
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
    </section>
  );
}
