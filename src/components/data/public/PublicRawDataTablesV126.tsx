import { publicDimensionValueV134 } from "../../../data/visualization/publicCopyRegistryV126";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import {
  approvedEntityAttributesV126,
  publicEntityAttributeKeysV126,
  publicEntityAttributeLabelV126,
  publicMissingReasonLabelV126,
  publicSourceOrganizationV136_1,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import { publicMeasureLabelV126 } from "../../../data/visualization/publicCopyRegistryV126";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

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
  const populatedObservationCount = observations.filter(
    (row) =>
      row.value !== null &&
      row.value !== undefined &&
      row.value !== "" &&
      (typeof row.value !== "number" || Number.isFinite(row.value))
  ).length;
  const missingObservationCount = observations.length - populatedObservationCount;
  if (total === 0) return null;

  const rawTableSummary =
    observations.length > 0
      ? [
          `상세 데이터 · 전체 ${total.toLocaleString("ko-KR")}행`,
          `값 있음 ${populatedObservationCount.toLocaleString("ko-KR")}행`,
          `결측 ${missingObservationCount.toLocaleString("ko-KR")}행`,
          entities.length > 0
            ? `목록 ${entities.length.toLocaleString("ko-KR")}건`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : `상세 데이터 · 목록 ${entities.length.toLocaleString("ko-KR")}건`;

  return (
    <details
      className="pav126-raw-table"
      data-testid="public-raw-table"
    >
      <summary data-testid="public-raw-table-summary">{rawTableSummary}</summary>

      {observations.length > 0 && (
        <div className="cdp-table-wrap">
          <table
            className="cdp-table"
            data-testid={elementId === "E-012" ? "e012-raw-table" : undefined}
          >
            <thead>
              <tr>
                <th>항목</th>
                <th>분류</th>
                <th>지역·성별·기술·시나리오</th>
                <th>값</th>
                <th>단위</th>
                <th>연도·기간</th>
                <th>제공기관</th>
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
                  .map(([key, value]) => publicDimensionValueV134(key, value))
                  .filter(Boolean)
                  .join(" · ");
                const context = dimensions
                  .filter(([key]) => CONTEXT_DIMENSION_KEYS_V126.has(key))
                  .map(([key, value]) => publicDimensionValueV134(key, value))
                  .filter(Boolean)
                  .join(" · ");
                const sourceUrl = publicSourceUrlV126(
                  row.provenance.sourceUrl
                );
                return (
                  <tr key={row.recordId}>
                    <td><PublicTermTextV134 text={publicMeasureLabelV126(row.semanticMeasure.labelKo)} /></td>
                    <td><PublicTermTextV134 text={category} /></td>
                    <td><PublicTermTextV134 text={context} /></td>
                    <td><PublicTermTextV134 text={publicObservationValueV126(row.value)} /></td>
                    <td><PublicTermTextV134 text={publicTextV126(row.unit || row.semanticMeasure.unit) || ""} /></td>
                    <td>{row.year || publicTextV126(row.period) || ""}</td>
                    <td><PublicTermTextV134 text={publicSourceOrganizationV136_1(row.provenance.sourceOrg) || ""} /></td>
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
                const titleResolution = resolvePublicEntityTitleV131(row, {
                  template: detailTemplate,
                });
                const sourceUrl = publicSourceUrlV126(
                  row.provenance.sourceUrl
                );
                return (
                  <tr key={row.recordId}>
                    <td><PublicTermTextV134 text={titleResolution.title} /></td>
                    <td><PublicTermTextV134 text={publicTextV126(row.entityType) || ""} /></td>
                    {entityColumns.map((column) => (
                      <td key={column}><PublicTermTextV134 text={publicAttributeValueV126(attributes[column])} /></td>
                    ))}
                    <td><PublicTermTextV134 text={publicSourceOrganizationV136_1(row.provenance.sourceOrg) || ""} /></td>
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
