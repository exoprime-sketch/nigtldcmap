import type {
  VietnamEntityV124,
  VietnamObservationV124,
} from "../../../data/vietnam/vietnamTypesV124";
import { publicMissingReasonLabelV126 } from "../../../data/visualization/publicFieldPolicyV126";

interface Props {
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
}

export default function PublicDataLimitationsV126({ observations, entities }: Props) {
  const missing = [
    ...observations
      .filter((row) => row.value === null || row.value === undefined || row.value === "")
      .map((row) =>
        publicMissingReasonLabelV126(row.missingReasonCode, row.note)
      ),
    ...entities.map((row) =>
      publicMissingReasonLabelV126(row.missingReasonCode, row.note)
    ),
  ].filter(Boolean);
  const reasons = Array.from(new Set(missing));

  return (
    <section className="pav126-limitations" data-testid="public-limitations-panel">
      <div className="pav126-section-heading">
        <span>해석 유의사항</span>
        <h3>데이터 한계·결측</h3>
      </div>
      <p>원천에 제공되지 않은 값은 0으로 바꾸지 않습니다.</p>
      {reasons.length > 0 ? (
        <ul>
          {reasons.slice(0, 4).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>현재 선택한 공개 레코드에 별도로 기재된 결측 사유가 없습니다.</p>
      )}
    </section>
  );
}
