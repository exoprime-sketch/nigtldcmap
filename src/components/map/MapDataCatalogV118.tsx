import { useMemo, useState } from "react";
import {
  DATA_DISPLAY_CONTRACTS_V118,
} from "../../data/map/dataDisplayContractV118";
import type {
  DataDisplayContractV118,
} from "../../data/map/dataDisplayContractV118";
import {
  PUBLIC_MAP_CATEGORIES_V118,
  getPublicMapCategoryV118,
} from "../../data/map/mapDisplayPlanV118";
import { SPATIAL_RESOLUTION_LABELS_V116 } from "../../types/spatialDataV116";

interface Props {
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  onOpenElement: (elementId: string) => void;
}

function normalizedText(row: DataDisplayContractV118): string {
  return [
    row.label,
    row.expectedSource,
    getPublicMapCategoryV118(row.elementId),
    row.recommendedMapUse,
  ]
    .join(" ")
    .toLowerCase();
}

function statusLabel(row: DataDisplayContractV118): string {
  if (row.actualDataStatus === "available") return "현재 제공";
  if (row.actualDataStatus === "partially-available") return "일부 제공";
  return row.displaySurface === "map-filter" ? "화면 구성 예시" : "제공 예정";
}

function publicUseLabel(row: DataDisplayContractV118): string {
  if (row.actualDataStatus === "planned")
    return `예정 출처 · ${row.expectedSource}`;
  if (row.displaySurface === "map-primary") return "국가·지역별 분포 확인";
  if (row.displaySurface === "map-overlay") {
    return row.dataShape === "project"
      ? "국가별 사업·지원 현황 확인"
      : "다른 공간정보와 함께 확인";
  }
  if (row.displaySurface === "evidence-panel")
    return "국가 선택 후 상세정보 확인";
  if (row.displaySurface === "map-filter") return "지도에서 조건 선택";
  return "데이터 상세에서 확인";
}
function surfaceLabel(row: DataDisplayContractV118): string {
  switch (row.displaySurface) {
    case "map-primary":
      return "지도 분포";
    case "map-overlay":
      return "함께 보기";
    case "map-filter":
      return "조건 선택";
    case "evidence-panel":
      return "국가 선택 후 확인";
    default:
      return "상세정보";
  }
}

export default function MapDataCatalogV118({
  selectedElementId,
  onSelectElement,
  onOpenElement,
}: Props) {
  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([
    "기후위험·적응",
    "에너지·인프라",
    "기술수요",
    "국제사업·지원",
  ]);
  const [showPlanned, setShowPlanned] = useState(false);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return DATA_DISPLAY_CONTRACTS_V118.filter(
      (row) => row.displaySurface !== "detail-only"
    )
      .filter((row) => showPlanned || row.actualDataStatus !== "planned")
      .filter((row) =>
        normalized ? normalizedText(row).includes(normalized) : true
      )
      .sort((a, b) => {
        if (a.actualDataStatus !== b.actualDataStatus) {
          return a.actualDataStatus === "available"
            ? -1
            : b.actualDataStatus === "available"
            ? 1
            : a.actualDataStatus === "partially-available"
            ? -1
            : 1;
        }
        return a.label.localeCompare(b.label, "ko");
      });
  }, [query, showPlanned]);

  function toggleCategory(category: string) {
    setOpenCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  return (
    <section className="v118-map-catalog" aria-label="지도 데이터">
      <div className="v118-map-catalog__header">
        <strong>지도 데이터</strong>
        <button
          type="button"
          className={showPlanned ? "active" : ""}
          onClick={() => setShowPlanned((value) => !value)}
        >
          {showPlanned ? "현재 제공 데이터만" : "제공 예정 데이터도 보기"}
        </button>
      </div>

      <label className="v118-map-search">
        <span className="sr-only">지도 데이터 검색</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="전력, 홍수, TNA, GCF, ODA 등 검색"
        />
      </label>

      {query.trim() && (
        <div className="v118-map-search-count">{rows.length}개 결과</div>
      )}

      <div className="v118-map-catalog__groups">
        {PUBLIC_MAP_CATEGORIES_V118.map((category) => {
          const categoryRows = rows.filter(
            (row) => getPublicMapCategoryV118(row.elementId) === category
          );
          if (!categoryRows.length) return null;
          const open = query.trim() ? true : openCategories.includes(category);
          return (
            <section key={category} className="v118-map-group">
              <button
                type="button"
                className="v118-map-group__toggle"
                onClick={() => toggleCategory(category)}
                aria-expanded={open}
              >
                <span>{category}</span>
                <small>{categoryRows.length}</small>
                <i>{open ? "−" : "+"}</i>
              </button>

              {open && (
                <div className="v118-map-group__rows">
                  {categoryRows.map((row) => {
                    const selected = row.elementId === selectedElementId;
                    const selectable = [
                      "map-primary",
                      "map-overlay",
                      "map-filter",
                    ].includes(row.displaySurface);
                    return (
                      <article
                        key={row.elementId}
                        className={`v118-map-row ${selected ? "selected" : ""}`}
                      >
                        <button
                          type="button"
                          className="v118-map-row__main"
                          onClick={() =>
                            selectable
                              ? onSelectElement(row.elementId)
                              : onOpenElement(row.elementId)
                          }
                        >
                          <strong>{row.label}</strong>
                          <span>
                            <em>{statusLabel(row)}</em>
                            <em>{surfaceLabel(row)}</em>
                            <em>
                              {
                                SPATIAL_RESOLUTION_LABELS_V116[
                                  row.actualSpatialResolution
                                ]
                              }
                            </em>
                          </span>
                          <small>{publicUseLabel(row)}</small>
                        </button>
                        <button
                          type="button"
                          className="v118-map-row__detail"
                          onClick={() => onOpenElement(row.elementId)}
                        >
                          데이터 상세
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
