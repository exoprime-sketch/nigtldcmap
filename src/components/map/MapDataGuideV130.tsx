import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { PublicTermTextV134 } from "../help/PublicTermV134";

const GROUP_ORDER = [
  "에너지·인프라",
  "산림·토지",
  "기후·위험",
  "물·자원",
  "국제사업·재원",
] as const;

function representation(layer: CountryMapLayerV122): string {
  if (layer.renderer === "regional-scope") return "참여국 범위·검증 활동지점";
  if (layer.renderer === "line") return "선형 네트워크";
  if (layer.renderer === "admin1-choropleth") {
    return layer.spatialScopeType === "region"
      ? "권역값을 연결한 성·시 경계"
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
  }));

  return (
    <section className="cdp-map-data-guide-v130" data-testid="map-data-guide-v130">
      <details open>
        <summary>지도 데이터 안내</summary>
        <div className="cdp-map-data-guide-v130__summary">
          <div>
            <strong>전체 데이터</strong>
            <span>152개</span>
          </div>
          <div>
            <strong>지도</strong>
            <span>공간 의미와 표현 범위가 검증된 {layers.length}개 데이터</span>
          </div>
        </div>
        <p>
          좌표가 있다는 이유만으로 표시하지 않습니다. 원천의 공간 단위보다
          정밀한 위치를 암시하지 않고, 분석에 유용한 데이터만 지도에
          제공합니다.
        </p>
        <div className="cdp-map-data-guide-v130__tables">
          {groups.map(({ group, layers: groupLayers }) => (
            <section key={group} data-map-guide-group={group}>
              <h3>{group}</h3>
              {groupLayers.length ? (
                <div className="cdp-map-data-guide-v130__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>데이터명</th>
                        <th>공간 표현</th>
                        <th>기준기간</th>
                        <th>지도 표시 이유</th>
                        <th>공간 한계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupLayers.map((layer) => (
                        <tr key={layer.elementId}>
                          <th scope="row">
                            <PublicTermTextV134 text={layer.publicShortTitle} />
                          </th>
                          <td data-label="공간 표현">{representation(layer)}</td>
                          <td data-label="기준기간">
                            {layer.latestYear || layer.sourceYear || "미표기"}
                          </td>
                          <td data-label="지도 표시 이유">
                            <PublicTermTextV134
                              text={layer.mapBenefit || layer.spatialCoverage}
                            />
                          </td>
                          <td data-label="공간 한계">
                            <PublicTermTextV134
                              text={
                                layer.spatialLimitation ||
                                layer.publicSpatialNotice
                              }
                            />
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
