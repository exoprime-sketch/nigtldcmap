import type { MapElementAuditRowV115 } from "../../data/map/mapElementAuditV115";
import {
  COOPERATION_DECISION_ROLE_LABELS_V116,
  MAP_ELEMENT_DECISION_INDEX_V116,
} from "../../data/map/mapElementDecisionV116";
import type { MapLayerRegistryRowV116 } from "../../data/map/mapLayerRegistryV116";
import { MAP_VISUAL_ENCODING_INDEX_V116 } from "../../data/map/mapVisualEncodingV116";
import { SPATIAL_RESOLUTION_LABELS_V116 } from "../../types/spatialDataV116";
import { getRendererDefinitionV115 } from "./GenericMapRenderersV115";

interface Props {
  audit: MapElementAuditRowV115;
  registry: MapLayerRegistryRowV116 | null;
  synthetic: boolean;
  regionalSynthetic?: boolean;
  onOpenElement: () => void;
  onClose: () => void;
}

function MeaningRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "사용하지 않음") return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function MapLayerInfoPanelV116({
  audit,
  registry,
  synthetic,
  regionalSynthetic = false,
  onOpenElement,
  onClose,
}: Props) {
  const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(audit.elementId);
  const encoding = MAP_VISUAL_ENCODING_INDEX_V116.get(audit.elementId);
  const renderer = registry
    ? getRendererDefinitionV115(registry.renderer)
    : null;

  return (
    <aside className="v115-layer-info v116-layer-info">
      <header>
        <div>
          <span>지도 데이터 상세정보</span>
          <h3>{audit.label}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="레이어 정보 닫기">
          ×
        </button>
      </header>

      {(synthetic || regionalSynthetic) && (
        <div className="v115-layer-info__synthetic">
          <b>시각화 예시</b>
          <span>
            {regionalSynthetic
              ? "실제 지역 통계가 아닌 지역단위 화면 구성 예시입니다"
              : "실제 통계·사업위치가 아닌 화면 구성 예시입니다"}
          </span>
        </div>
      )}

      <dl>
        <div>
          <dt>활용 목적</dt>
          <dd>{audit.cooperationUse}</dd>
        </div>
        <div>
          <dt>지도 표현</dt>
          <dd>{renderer?.label ?? "선택지역 상세정보"}</dd>
        </div>
        <div>
          <dt>현재 공간단위</dt>
          <dd>
            {decision
              ? SPATIAL_RESOLUTION_LABELS_V116[decision.actualResolution]
              : audit.spatialUnit}
          </dd>
        </div>
        {decision &&
          decision.actualResolution !== decision.preferredResolution && (
            <div>
              <dt>권장 공간단위</dt>
              <dd>
                {SPATIAL_RESOLUTION_LABELS_V116[decision.preferredResolution]}
              </dd>
            </div>
          )}
        <div>
          <dt>단위</dt>
          <dd>
            {regionalSynthetic ? "예시 단계" : registry?.unit ?? "자료별 상이"}
          </dd>
        </div>
        <div>
          <dt>기준시점</dt>
          <dd>{synthetic || regionalSynthetic ? "시각화 예시" : audit.asOf}</dd>
        </div>
        <div>
          <dt>자료 제공기관</dt>
          <dd>
            {synthetic || regionalSynthetic ? "시각화 예시" : audit.source}
          </dd>
        </div>
        <div>
          <dt>제공상태</dt>
          <dd>
            {synthetic || regionalSynthetic
              ? "시각화 예시"
              : audit.actualDataAvailable
              ? "실제 데이터"
              : "데이터 준비 중"}
          </dd>
        </div>
        {decision && (
          <div>
            <dt>협력 검토 단계</dt>
            <dd>
              {decision.cooperationDecisionRoles
                .map((role) => COOPERATION_DECISION_ROLE_LABELS_V116[role])
                .join(" · ")}
            </dd>
          </div>
        )}
      </dl>

      {encoding && (
        <section className="v116-layer-info__encoding">
          <h4>지도에서 읽는 방법</h4>
          <dl>
            <MeaningRow label="색" value={encoding.colorMeaning} />
            <MeaningRow label="크기" value={encoding.sizeMeaning} />
            <MeaningRow label="모양" value={encoding.shapeMeaning} />
            <MeaningRow label="테두리" value={encoding.borderMeaning} />
            <MeaningRow label="선" value={encoding.lineMeaning} />
            <div>
              <dt>자료 없음</dt>
              <dd>{encoding.noDataTreatment}</dd>
            </div>
          </dl>
        </section>
      )}

      <p>{decision?.spatialRationale ?? audit.reason}</p>

      <button type="button" className="primary" onClick={onOpenElement}>
        데이터 상세보기
      </button>
    </aside>
  );
}
