import type { MapElementAuditRowV115 } from "../../data/map/mapElementAuditV115";
import type { MapLayerRegistryRowV116 } from "../../data/map/mapLayerRegistryV116";
import { DATA_DISPLAY_CONTRACT_INDEX_V118 } from "../../data/map/dataDisplayContractV118";
import { SPATIAL_RESOLUTION_LABELS_V116 } from "../../types/spatialDataV116";

interface Props {
  audit: MapElementAuditRowV115;
  registry: MapLayerRegistryRowV116 | null;
  synthetic: boolean;
  regionalSynthetic?: boolean;
  onOpenElement: () => void;
  onClose: () => void;
}

export default function MapLayerInfoPanelV118({
  audit,
  registry,
  synthetic,
  regionalSynthetic = false,
  onOpenElement,
  onClose,
}: Props) {
  const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(audit.elementId);
  const example = synthetic || regionalSynthetic;

  return (
    <aside className="v115-layer-info v118-layer-info">
      <header>
        <div>
          <span>데이터 정보</span>
          <h3>{audit.label}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="데이터 정보 닫기">
          ×
        </button>
      </header>

      {example && (
        <div className="v118-example-note">
          <b>화면 구성 예시</b>
          <span>실제 통계가 아닙니다</span>
        </div>
      )}

      <dl>
        <div>
          <dt>자료 제공기관</dt>
          <dd>
            {example ? "제공 예정" : contract?.expectedSource || audit.source}
          </dd>
        </div>
        <div>
          <dt>공간단위</dt>
          <dd>
            {contract
              ? SPATIAL_RESOLUTION_LABELS_V116[contract.actualSpatialResolution]
              : audit.spatialUnit}
          </dd>
        </div>
        <div>
          <dt>기준시점</dt>
          <dd>{example ? "실제 데이터 제공 시 표시" : audit.asOf}</dd>
        </div>
        <div>
          <dt>단위</dt>
          <dd>
            {example ? "자료 제공 시 확정" : registry?.unit ?? "자료별 상이"}
          </dd>
        </div>
      </dl>

      {!example &&
        contract &&
        contract.actualSpatialResolution !==
          contract.expectedSpatialResolution && (
          <p className="v118-layer-resolution-note">
            현재는{" "}
            {SPATIAL_RESOLUTION_LABELS_V116[contract.actualSpatialResolution]}{" "}
            자료를 제공합니다. 더 세밀한 지역자료가 확보되면 지역 단위로 우선
            표시합니다.
          </p>
        )}

      <button type="button" className="primary" onClick={onOpenElement}>
        데이터 상세보기
      </button>
    </aside>
  );
}
