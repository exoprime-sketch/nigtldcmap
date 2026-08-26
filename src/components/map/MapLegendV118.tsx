import {
  CHOROPLETH_PALETTE_V116,
  POLICY_CURRENTNESS_COLORS_V116,
} from "../../data/map/mapVisualEncodingV116";
import { MAP_ELEMENT_AUDIT_INDEX_V115 } from "../../data/map/mapElementAuditV115";

interface Props {
  baseElementId: string | null;
  activeElementIds: string[];
  baseBreaks?: number[];
  baseUnit?: string;
  demandMax?: number;
  synthetic?: boolean;
}

export default function MapLegendV118({
  baseElementId,
  activeElementIds,
  baseBreaks = [],
  baseUnit = "",
  demandMax = 0,
  synthetic = false,
}: Props) {
  const base = baseElementId
    ? MAP_ELEMENT_AUDIT_INDEX_V115.get(baseElementId)
    : null;
  const demandActive = activeElementIds.includes("C-005");

  return (
    <aside className="v118-map-legend" aria-label="범례">
      {base && (
        <section>
          <h3>{base.label}</h3>
          <div className="v118-color-ramp">
            {CHOROPLETH_PALETTE_V116.map((color) => (
              <i key={color} style={{ background: color }} />
            ))}
          </div>
          {baseBreaks.length >= 2 ? (
            <div className="v118-ramp-breaks">
              {CHOROPLETH_PALETTE_V116.map((_, index) => {
                const left = baseBreaks[index] ?? baseBreaks[0];
                const right =
                  baseBreaks[index + 1] ?? baseBreaks[baseBreaks.length - 1];
                return (
                  <span key={`${left}-${right}-${index}`}>
                    {Number(left).toLocaleString("ko-KR", {
                      maximumFractionDigits: 1,
                    })}
                    –
                    {Number(right).toLocaleString("ko-KR", {
                      maximumFractionDigits: 1,
                    })}
                    {baseUnit ? ` ${baseUnit}` : ""}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="v118-ramp-labels">
              <span>낮음</span>
              <span>높음</span>
            </div>
          )}
          <small>회색: 자료 없음</small>
        </section>
      )}

      {demandActive && (
        <section>
          <h3>TNA/TAP 기술수요</h3>
          <div
            className="v118-demand-legend"
            title="원이 클수록 확인된 우선기술이 많습니다"
          >
            <span className="v118-demand-dot small" />
            <span className="v118-demand-dot medium" />
            <span className="v118-demand-dot large" />
            {demandMax > 0 && <small>현재 범위 최대 {demandMax}건</small>}
          </div>
          <ul>
            <li>
              <i
                style={{
                  borderColor: POLICY_CURRENTNESS_COLORS_V116.reconfirmed,
                }}
              />
              최신 정책에서 재확인
            </li>
            <li>
              <i
                style={{ borderColor: POLICY_CURRENTNESS_COLORS_V116.partial }}
              />
              일부 재확인
            </li>
            <li>
              <i
                style={{
                  borderColor: POLICY_CURRENTNESS_COLORS_V116.historical,
                }}
              />
              과거 자료 중심
            </li>
            <li>
              <i
                style={{ borderColor: POLICY_CURRENTNESS_COLORS_V116.caution }}
              />
              정책방향 확인 필요
            </li>
          </ul>
        </section>
      )}

      {activeElementIds.some((id) =>
        ["D-019", "D-020", "D-018", "D-023", "D-021"].includes(id)
      ) && (
        <section>
          <h3>국제사업·지원</h3>
          <ul className="v118-institution-legend">
            {activeElementIds.includes("D-019") && (
              <li>
                <b>⬢</b> CTCN 기술지원
              </li>
            )}
            {activeElementIds.includes("D-020") && (
              <li>
                <b>●</b> GCF 사업
              </li>
            )}
            {activeElementIds.includes("D-018") && (
              <li>
                <b>▲</b> Adaptation Fund 사업
              </li>
            )}
            {activeElementIds.includes("D-023") && (
              <li>
                <b>■</b> GEF 사업
              </li>
            )}
            {activeElementIds.includes("D-021") && (
              <li>
                <b>◆</b> World Bank·ADB 사업
              </li>
            )}
          </ul>
        </section>
      )}

      {synthetic && (
        <section className="v118-example-legend">
          <h3>화면 구성 예시</h3>
          <small>실제 통계가 아닙니다</small>
        </section>
      )}
    </aside>
  );
}
