import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import {
  PUBLIC_MAP_TARGET_CATEGORIES_V138,
  PUBLIC_MAP_TARGETS_V138,
  publicMapDataFunctionV135,
  publicMapLayerTitleV126,
} from "../../data/visualization/publicMapWorkspaceV126";
import { PublicTermTextV134 } from "../help/PublicTermV134";

// V138: the seven categories the catalogue uses, in the same order.
const GROUP_ORDER = PUBLIC_MAP_TARGET_CATEGORIES_V138;

function representation(layer: CountryMapLayerV122): string {
  if (layer.renderer === "regional-scope") return "참여국 범위·검증 활동지점";
  if (layer.renderer === "line") return "선형 네트워크";
  if (layer.renderer === "admin1-choropleth") {
    return layer.spatialScopeType === "region"
      ? layer.aggregationLevel === "post-2025-34-unit"
        ? "개편 후 34개 성·시 값을 소속 63개 경계에 표시"
        : "권역값을 연결한 성·시 경계"
      : "성·시 색상지도";
  }
  if (layer.renderer === "partial-choropleth") return "일부 성·시 색상지도";
  if (layer.spatialScopeType === "facility-site") return "검증된 시설 지점";
  return "검증된 사업 지점";
}

interface MapDataGuideV130Props {
  layers: CountryMapLayerV122[];
  onOpenDataFinder: () => void;
}

export default function MapDataGuideV130({
  layers,
  onOpenDataFinder,
}: MapDataGuideV130Props) {
  const groups = GROUP_ORDER.map((group) => ({
    group,
    layers: layers.filter((layer) => layer.category === group),
    // Targets the contract names but no layer carries: listed with the reason.
    missing: PUBLIC_MAP_TARGETS_V138.filter(
      (target) =>
        target.category === group &&
        !layers.some((layer) => layer.elementId === target.elementId && layer.enabled !== false)
    ),
  }));
  const targetCount = PUBLIC_MAP_TARGETS_V138.length;
  const connectedCount = layers.filter((layer) =>
    PUBLIC_MAP_TARGETS_V138.some((target) => target.elementId === layer.elementId)
  ).length;

  return (
    <section className="cdp-map-data-guide-v130" data-testid="map-data-guide-v130">
      <details data-testid="map-data-guide-details-v135">
        <summary>지도 데이터 안내</summary>
        <div className="cdp-map-data-guide-v130__summary">
          <div>
            <strong>전체 데이터</strong>
            <span>152개</span>
          </div>
          <div>
            <strong>지도</strong>
            <span>
              지도 대상 {targetCount}개 중 위치·경계가 확인되어 연결된 {connectedCount}개 데이터
            </span>
          </div>
        </div>
        <div className="cdp-map-data-guide-v130__tables">
          {groups.map(({ group, layers: groupLayers, missing }) => (
            <section key={group} data-map-guide-group={group}>
              <h3>{group}</h3>
              {missing.length > 0 && (
                <p className="cdp-muted" data-testid="map-data-guide-missing-v138">
                  지도 미연결:{" "}
                  {missing
                    .map(
                      (target) =>
                        `${publicMapLayerTitleV126(target.elementId, target.publicName)} — ${
                          target.build.reason || "위치·경계 자료 미확인"
                        }`
                    )
                    .join(" / ")}
                </p>
              )}
              {groupLayers.length ? (
                <div className="cdp-map-data-guide-v130__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>데이터명</th>
                        <th>지도 표시</th>
                        <th>기준기간</th>
                        <th>데이터 기능</th>
                        <th>참고사항</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupLayers.map((layer) => (
                        <tr key={layer.elementId}>
                          <th scope="row">
                            <PublicTermTextV134 text={layer.publicShortTitle} />
                          </th>
                          <td data-label="지도 표시">{representation(layer)}</td>
                          <td data-label="기준기간">
                            {layer.latestYear || layer.sourceYear || "미표기"}
                          </td>
                          <td data-label="데이터 기능">
                            <PublicTermTextV134
                              text={publicMapDataFunctionV135(
                                layer.elementId,
                                layer.mapBenefit
                              )}
                            />
                          </td>
                          <td data-label="참고사항">
                            {layer.spatialLimitation ||
                            layer.publicSpatialNotice ? (
                              <PublicTermTextV134
                                text={
                                  layer.spatialLimitation ||
                                  layer.publicSpatialNotice
                                }
                              />
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="cdp-muted">현재 검증된 지도 데이터 없음</p>
              )}
            </section>
          ))}
        </div>
        <button
          type="button"
          className="cdp-map-data-guide-v130__link"
          onClick={onOpenDataFinder}
        >
          전체 152개 데이터는 데이터 찾기에서 확인 →
        </button>
      </details>
    </section>
  );
}
