import type { InternationalSupportRecordV112 } from "../data/support/internationalSupportV112";
import { getTechnologyNameKoV112 } from "../data/support/internationalSupportV112";
import { downloadBlob } from "./browser";

export type InternationalSupportDownloadFormatV112 = "CSV" | "JSON";

function safe(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const protectedValue = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function downloadInternationalSupportV112(
  records: InternationalSupportRecordV112[],
  format: InternationalSupportDownloadFormatV112,
  scopeName: string
): number {
  const rows = records.map((item) => ({
    source_organization: item.sourceOrganization,
    project_id: item.projectId,
    source_reference: item.sourceReference ?? "",
    project_title: item.projectTitle,
    country_iso3: item.countryIso3,
    country_name_ko: item.countryNameKo,
    sector: item.sector ?? "",
    mapped_38_technology_ids: item.mappedTechnologyIds.join(" | "),
    mapped_38_technology_names_ko: item.mappedTechnologyIds
      .map(getTechnologyNameKoV112)
      .join(" | "),
    technology_mapping_evidence_ko: item.technologyMappingEvidenceKo ?? "",
    support_type: item.supportType ?? "",
    financing_instrument: item.financingInstrument,
    approved_amount_usd: item.approvedAmountUsd ?? "",
    cofinancing_usd: item.cofinancingUsd ?? "",
    country_allocated_amount_usd: item.countryAllocatedAmountUsd ?? "",
    amount_scope: item.amountScope,
    status: item.status ?? "",
    implementing_entity: item.implementingEntity ?? "",
    source_url: item.sourceUrl,
    technology_evidence_url: item.evidenceUrl ?? "",
    source_fields: item.sourcePagesOrFields ?? "",
    verified_at: item.verifiedAt,
  }));
  const base = `international-support-${scopeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-v112`;
  if (format === "JSON") {
    downloadBlob(
      new Blob(
        [
          JSON.stringify(
            {
              metadata: {
                version: "v112",
                generatedFromVerifiedRecords: true,
                caution:
                  "공식 근거 레코드만 포함하며 협력기회·추천 점수를 생성하지 않음",
              },
              records,
            },
            null,
            2
          ),
        ],
        { type: "application/json;charset=utf-8" }
      ),
      `${base}.json`
    );
    return records.length;
  }
  const headers = Object.keys(rows[0] ?? { source_organization: "" });
  const csv =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((key) => safe((row as Record<string, unknown>)[key]))
          .join(",")
      ),
    ].join("\n");
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${base}.csv`
  );
  return records.length;
}
