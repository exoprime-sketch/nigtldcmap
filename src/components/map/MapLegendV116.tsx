import {
  CHOROPLETH_PALETTE_V116,
  MAP_VISUAL_ENCODING_INDEX_V116,
  POLICY_CURRENTNESS_COLORS_V116,
  SUPPORT_SYMBOLS_V116,
} from "../../data/map/mapVisualEncodingV116";
import { MAP_ELEMENT_AUDIT_INDEX_V115 } from "../../data/map/mapElementAuditV115";
import { MAP_ELEMENT_DECISION_INDEX_V116 } from "../../data/map/mapElementDecisionV116";
import { SPATIAL_RESOLUTION_LABELS_V116 } from "../../types/spatialDataV116";

interface MapLegendV116Props {
  baseElementId: string | null;
  activeElementIds: string[];
  selectedElementId: string | null;
  regionalSyntheticActive: boolean;
  regionLevelLabel?: string | null;
  baseBreaks?: number[];
  baseUnit?: string;
  demandMax?: number;
  odaMax?: number;
}

function SupportLegend({
  elementId,
}: {
  elementId: keyof typeof SUPPORT_SYMBOLS_V116;
}) {
  const item = SUPPORT_SYMBOLS_V116[elementId];
  return (
    <li>
      <span className="v116-legend-symbol" style={{ color: item.color }}>
        {item.symbol}
      </span>
      <span>{item.shortLabel}</span>
      <small>국가 단위 사업·지원 건수</small>
    </li>
  );
}

export default function MapLegendV116({
  baseElementId,
  activeElementIds,
  selectedElementId,
  regionalSyntheticActive,
  regionLevelLabel,
  baseBreaks = [],
  baseUnit = "",
  demandMax = 0,
  odaMax = 0,
}: MapLegendV116Props) {
  const baseAudit = baseElementId
    ? MAP_ELEMENT_AUDIT_INDEX_V115.get(baseElementId)
    : null;
  const baseEncoding = baseElementId
    ? MAP_VISUAL_ENCODING_INDEX_V116.get(baseElementId)
    : null;
  const selectedDecision = selectedElementId
    ? MAP_ELEMENT_DECISION_INDEX_V116.get(selectedElementId)
    : null;
  const supportIds = (
    Object.keys(SUPPORT_SYMBOLS_V116) as Array<
      keyof typeof SUPPORT_SYMBOLS_V116
    >
  ).filter((elementId) => activeElementIds.includes(elementId));
  const demandActive = activeElementIds.includes("C-005");
  const odaActive = activeElementIds.includes("D-011");

  return (
    <aside className="v116-dynamic-legend" aria-label="지도 읽는 법">
      <header>
        <span>지도 읽는 법</span>
        <strong></strong>
      </header>

      {baseAudit && baseEncoding && (
        <section>
          <h3>국가·지역 색</h3>
          <p>
            <b>{baseAudit.label}</b>
            <span>{baseEncoding.colorMeaning}</span>
          </p>
          <div className="v116-color-ramp" aria-label="낮은 값에서 높은 값">
            {CHOROPLETH_PALETTE_V116.map((color) => (
              <i key={color} style={{ background: color }} />
            ))}
          </div>
          {baseBreaks.length >= 2 ? (
            <div className="v116-ramp-breaks">
              {CHOROPLETH_PALETTE_V116.map((_, index) => {
                const left = baseBreaks[index] ?? baseBreaks[0];
                const right =
                  baseBreaks[index + 1] ?? baseBreaks[baseBreaks.length - 1];
                return (
                  <span key={`${left}-${right}`}>
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
            <div className="v116-ramp-labels">
              <span>낮음</span>
              <span>높음</span>
            </div>
          )}
          <small>
            분류: {baseEncoding.classification.reason} · 회색은 자료 없음 · 0은
            실제 값 0
          </small>
        </section>
      )}

      {regionalSyntheticActive && (
        <section className="synthetic">
          <h3>지역 시각화 예시</h3>
          <p>
            <b>{regionLevelLabel ?? "지역"}</b>
            <span>실제 지역 통계가 아닌 1~5단계 화면 구성 예시</span>
          </p>
        </section>
      )}

      {demandActive && (
        <section>
          <h3>기후기술 수요</h3>
          <ul className="v116-legend-list">
            <li>
              <span className="v116-bubble-size small" />
              <span className="v116-bubble-size large" />
              <small>
                원 면적 ∝ 확인된 TNA/TAP 우선기술 수 · 반지름은 √건수 기반
              </small>
            </li>
            <li>
              <span
                className="v116-border-chip"
                style={{
                  borderColor: POLICY_CURRENTNESS_COLORS_V116.reconfirmed,
                }}
              />
              <span>✓ 재확인 우세</span>
            </li>
            <li>
              <span
                className="v116-border-chip"
                style={{ borderColor: POLICY_CURRENTNESS_COLORS_V116.partial }}
              />
              <span>~ 부분 재확인 포함</span>
            </li>
            <li>
              <span
                className="v116-border-chip"
                style={{
                  borderColor: POLICY_CURRENTNESS_COLORS_V116.historical,
                }}
              />
              <span>H 과거 근거 우세</span>
            </li>
            <li>
              <span
                className="v116-border-chip"
                style={{ borderColor: POLICY_CURRENTNESS_COLORS_V116.caution }}
              />
              <span>! 방향 차이 항목 포함</span>
            </li>
          </ul>
          <small>
            버블 내부 숫자는 수요 건수, 기호(✓ / ~ / H / !)는 정책 현재성을 함께
            표시합니다.
          </small>
          {demandMax > 0 && <small>현재 화면 범위: 1건 ~ {demandMax}건</small>}
        </section>
      )}

      {supportIds.length > 0 && (
        <section>
          <h3>기존 국제지원·사업</h3>
          <ul className="v116-legend-list institutions">
            {supportIds.map((elementId) => (
              <SupportLegend key={elementId} elementId={elementId} />
            ))}
          </ul>
          <small>
            심볼 모양은 기관·사업군, 뒤 숫자는 해당 국가의 건수를 의미
          </small>
        </section>
      )}

      {odaActive && (
        <section>
          <h3>ODA·공여환경</h3>
          <p className="v116-oda-legend">
            <span className="v116-oda-ring small" />
            <span className="v116-oda-ring large" />
            <span>얇은 고리 크기 = OECD ODA 최근 실제지출 규모</span>
          </p>
          <small>
            원 면적이 실제지출 규모에 비례하도록 √스케일 · 약정과 실제지출은
            합산하지 않음
            {odaMax > 0
              ? ` · 현재 최대 ${odaMax.toLocaleString("ko-KR", {
                  maximumFractionDigits: 0,
                })}`
              : ""}
          </small>
        </section>
      )}

      <section>
        <h3>공간단위</h3>
        <ul className="v116-legend-list">
          <li>
            <span>●</span>
            <span>실제 위치 확인</span>
          </li>
          <li>
            <span>◉</span>
            <span>국가·지역 단위 집계</span>
          </li>
          {selectedDecision && (
            <li>
              <span>현재</span>
              <span>
                {
                  SPATIAL_RESOLUTION_LABELS_V116[
                    selectedDecision.actualResolution
                  ]
                }
              </span>
              <small>
                권장{" "}
                {
                  SPATIAL_RESOLUTION_LABELS_V116[
                    selectedDecision.preferredResolution
                  ]
                }
              </small>
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
}

export function MapReviewGuideV116() {
  return (
    <div className="v116-review-guide" aria-label="협력사업 검토 순서">
      <strong>협력사업 검토 순서</strong>
      <ol>
        <li>문제·수요</li>
        <li>정책 정합성</li>
        <li>기존 사업</li>
        <li>재원·공여환경</li>
        <li>지역·파트너</li>
      </ol>
    </div>
  );
}
