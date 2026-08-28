import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import {
  approvedEntityAttributesV126,
  publicEntityAttributeKeysV126,
  publicEntityAttributeLabelV126,
  publicMissingReasonLabelV126,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import { publicMeasureLabelV126 } from "../../../data/visualization/publicCopyRegistryV126";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { formatValueV121 } from "../../../utils/vietnamActualV121";

interface Props {
  elementId: string;
  observations: SemanticObservationV125[];
  entities: VietnamEntityV124[];
  detailTemplate: string;
}

const CONTEXT_DIMENSION_KEYS_V126 = new Set([
  "region",
  "regionName",
  "province",
  "provinceName",
  "sex",
  "technology",
  "technologyName",
  "scenario",
]);

export default function PublicRawDataTablesV126({
  elementId,
  observations,
  entities,
  detailTemplate,
}: Props) {
  const entityColumns = publicEntityAttributeKeysV126(
    entities,
    detailTemplate
  );
  const total = observations.length + entities.length;
  if (total === 0) return null;

  return (
    <details
      className="pav126-raw-table"
      data-testid="public-raw-table"
    >
      <summary>원자료 보기 · {total.toLocaleString("ko-KR")}건</summary>

      {observations.length > 0 && (
        <div className="cdp-table-wrap">
          <table
            className="cdp-table"
            data-testid={elementId === "E-012" ? "e012-raw-table" : undefined}
          >
            <thead>
              <tr>
                <th>측정항목</th>
                <th>분류</th>
                <th>지역·성별·기술·시나리오</th>
                <th>값</th>
                <th>단위</th>
                <th>연도·기간</th>
                <th>자료 제공기관</th>
                <th>결측 사유</th>
                <th>공식 원문</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((row) => {
                const dimensions = Object.entries(row.dimensionLabels);
                const category = dimensions
                  .filter(
                    ([key]) =>
                      !["year", "period"].includes(key) &&
                      !CONTEXT_DIMENSION_KEYS_V126.has(key)
                  )
                  .map(([, value]) => publicTextV126(value))
                  .filter(Boolean)
                  .join(" · ");
                const context = dimensions
                  .filter(([key]) => CONTEXT_DIMENSION_KEYS_V126.has(key))
                  .map(([, value]) => publicTextV126(value))
                  .filter(Boolean)
                  .join(" · ");
                const sourceUrl = publicSourceUrlV126(
                  row.provenance.sourceUrl
                );
                return (
                  <tr key={row.recordId}>
                    <td>{publicMeasureLabelV126(row.semanticMeasure.labelKo)}</td>
                    <td>{category}</td>
                    <td>{context}</td>
                    <td>{publicObservationValueV126(row.value)}</td>
                    <td>{publicTextV126(row.unit || row.semanticMeasure.unit) || ""}</td>
                    <td>{row.year || publicTextV126(row.period) || ""}</td>
                    <td>{publicTextV126(row.provenance.sourceOrg) || ""}</td>
                    <td>
                      {publicMissingReasonLabelV126(
                        row.missingReasonCode,
                        row.note
                      ) || ""}
                    </td>
                    <td>
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer">
                          원문 확인
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {entities.length > 0 && (
        <div className="cdp-table-wrap" data-testid="v125-entity-table-fallback">
          <table className="cdp-table">
            <thead>
              <tr>
                <th>명칭</th>
                <th>유형</th>
                {entityColumns.map((column) => (
                  <th key={column}>{publicEntityAttributeLabelV126(column)}</th>
                ))}
                <th>자료 제공기관</th>
                <th>결측 사유</th>
                <th>공식 원문</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((row) => {
                const attributes = approvedEntityAttributesV126(
                  row,
                  detailTemplate
                );
                const sourceUrl = publicSourceUrlV126(
                  row.provenance.sourceUrl
                );
                return (
                  <tr key={row.recordId}>
                    <td>{publicEntityNameV126(row, attributes)}</td>
                    <td>{publicTextV126(row.entityType) || ""}</td>
                    {entityColumns.map((column) => (
                      <td key={column}>{publicAttributeValueV126(attributes[column])}</td>
                    ))}
                    <td>{publicTextV126(row.provenance.sourceOrg) || ""}</td>
                    <td>
                      {publicMissingReasonLabelV126(
                        row.missingReasonCode,
                        row.note
                      ) || ""}
                    </td>
                    <td>
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer">
                          원문 확인
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

function publicEntityNameV126(
  row: VietnamEntityV124,
  attributes: ReturnType<typeof approvedEntityAttributesV126>
): string {
  const candidates = [
    row.name,
    attributes.projectName,
    attributes.organizationName,
    attributes.orgName,
    attributes.companyName,
    attributes.programName,
    attributes.title,
    attributes.name,
  ];
  return (
    candidates
      .map((value) => publicTextV126(value))
      .find((value): value is string => Boolean(value)) || "명칭 미기재"
  );
}

function publicAttributeValueV126(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => publicTextV126(item) || String(item ?? ""))
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return publicTextV126(value) || "";
}

function publicObservationValueV126(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") {
    return formatValueV121(value);
  }
  return publicTextV126(value) || "";
}
