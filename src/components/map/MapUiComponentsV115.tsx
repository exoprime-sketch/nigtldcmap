import type { MapElementAuditRowV115 } from "../../data/map/mapElementAuditV115";
import type { MapLayerRegistryRowV115 } from "../../data/map/mapLayerRegistryV115";
import {
  SYNTHETIC_BADGE_V115,
  SYNTHETIC_NOTICE_V115,
} from "../../data/map/syntheticMapDataV115";
import { getRendererDefinitionV115 } from "./GenericMapRenderersV115";

export function SyntheticMapBannerV115() {
  return (
    <div className="v115-synthetic-banner" role="status">
      <strong>{SYNTHETIC_BADGE_V115}</strong>
      <span>{SYNTHETIC_NOTICE_V115}</span>
    </div>
  );
}

interface TimelineControlProps {
  minYear: number;
  maxYear: number;
  value: number;
  onChange: (year: number) => void;
  synthetic?: boolean;
}

export function TimelineControl({
  minYear,
  maxYear,
  value,
  onChange,
  synthetic = false,
}: TimelineControlProps) {
  return (
    <div className="v115-timeline">
      <div>
        <strong>기준연도</strong>
        <span>{value}</span>
        {synthetic && <em>{SYNTHETIC_BADGE_V115}</em>}
      </div>
      <input
        aria-label="기준연도"
        type="range"
        min={minYear}
        max={maxYear}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="v115-timeline__ticks">
        <span>{minYear}</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}

interface MapLegendV115Props {
  selectedAudit: MapElementAuditRowV115 | null;
  selectedRegistry: MapLayerRegistryRowV115 | null;
  synthetic: boolean;
  aggregateLabels: string[];
}

export function MapLegend({
  selectedAudit,
  selectedRegistry,
  synthetic,
  aggregateLabels,
}: MapLegendV115Props) {
  const renderer = selectedRegistry
    ? getRendererDefinitionV115(selectedRegistry.renderer)
    : null;

  return (
    <div className="v115-map-legend">
      {selectedAudit && renderer && (
        <div className="v115-map-legend__primary">
          <i
            className={`renderer renderer-${
              selectedRegistry?.renderer ?? "none"
            }`}
          />
          <span>
            <b>{selectedAudit.label}</b>
            <small>{renderer.publicMeaning}</small>
          </span>
          {synthetic && <em>{SYNTHETIC_BADGE_V115}</em>}
        </div>
      )}

      {aggregateLabels.map((label) => (
        <div className="v115-map-legend__item" key={label}>
          <i className="aggregate-dot" />
          <span>{label} · 국가 단위 집계</span>
        </div>
      ))}

      <div className="v115-map-legend__rules">
        <span>
          <i className="missing-swatch" /> 자료 없음
        </span>
        <span>
          <i className="zero-swatch" /> 실제 값 0
        </span>
      </div>

      <small>
        국가 집계 원형은 실제 사업 위치가 아닙니다. 실제 위치가 확인된 자료는
        별도 위치점으로 구분합니다.
      </small>
    </div>
  );
}

interface LayerInfoPanelProps {
  audit: MapElementAuditRowV115;
  registry: MapLayerRegistryRowV115 | null;
  synthetic: boolean;
  onOpenElement: () => void;
  onClose: () => void;
}

export function LayerInfoPanel({
  audit,
  registry,
  synthetic,
  onOpenElement,
  onClose,
}: LayerInfoPanelProps) {
  const renderer = registry
    ? getRendererDefinitionV115(registry.renderer)
    : null;

  return (
    <aside className="v115-layer-info">
      <header>
        <div>
          <span>지도 데이터 상세정보</span>
          <h3>{audit.label}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="레이어 정보 닫기">
          ×
        </button>
      </header>

      {synthetic && (
        <div className="v115-layer-info__synthetic">
          <b>{SYNTHETIC_BADGE_V115}</b>
          <span>{SYNTHETIC_NOTICE_V115}</span>
        </div>
      )}

      <dl>
        <div>
          <dt>활용 목적</dt>
          <dd>{audit.cooperationUse}</dd>
        </div>
        <div>
          <dt>지도 표현</dt>
          <dd>{renderer?.label ?? "국가 상세정보"}</dd>
        </div>
        <div>
          <dt>공간단위</dt>
          <dd>{audit.spatialUnit}</dd>
        </div>
        <div>
          <dt>단위</dt>
          <dd>{registry?.unit ?? "자료별 상이"}</dd>
        </div>
        <div>
          <dt>기준시점</dt>
          <dd>{synthetic ? "시각화 예시" : audit.asOf}</dd>
        </div>
        <div>
          <dt>자료 제공기관</dt>
          <dd>{synthetic ? "시각화 예시" : audit.source}</dd>
        </div>
        <div>
          <dt>제공상태</dt>
          <dd>
            {synthetic
              ? "시각화 예시"
              : audit.actualDataAvailable
              ? "실제 데이터"
              : audit.dataStatus === "preparing"
              ? "데이터 준비 중"
              : "국가 상세정보에서 확인"}
          </dd>
        </div>
      </dl>

      <p>{audit.reason}</p>

      <button type="button" className="primary" onClick={onOpenElement}>
        데이터 상세보기
      </button>
    </aside>
  );
}
