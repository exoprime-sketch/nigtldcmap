import type { OecdOdaCountryResultV113 } from "../services/oecdOdaApiV113";
import type { MdbProjectRecordV113 } from "../services/mdbProjectsApiV113";

export type CooperationFinanceDownloadFormatV113 = "csv" | "json";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function saveBlob(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadOecdOdaV113(
  data: OecdOdaCountryResultV113,
  format: CooperationFinanceDownloadFormatV113
): void {
  const rows = [...data.disbursements, ...data.commitments].map((row) => ({
    country_iso3: data.countryIso3,
    flow_type: row.flow,
    donor_code: row.donorCode,
    donor_name: row.donorName,
    recipient_code: row.recipientCode,
    recipient_name: row.recipientName,
    year: row.year,
    value: row.value,
    unit: row.unitLabel,
    price_base: row.priceBaseLabel,
  }));
  const filename = `${data.countryIso3}-oecd-oda-v113.${format}`;

  if (format === "json") {
    saveBlob(
      JSON.stringify(
        {
          schemaVersion: "v113",
          source: "OECD DAC2A / DAC3A",
          generatedAt: new Date().toISOString(),
          rows,
        },
        null,
        2
      ),
      "application/json;charset=utf-8",
      filename
    );
    return;
  }

  const headers = Object.keys(
    rows[0] ?? {
      country_iso3: "",
      flow_type: "",
      donor_code: "",
      donor_name: "",
      recipient_code: "",
      recipient_name: "",
      year: "",
      value: "",
      unit: "",
      price_base: "",
    }
  );
  const body = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvCell(row[header as keyof typeof row]))
        .join(",")
    ),
  ].join("\n");
  saveBlob(`\uFEFF${body}`, "text/csv;charset=utf-8", filename);
}

export function downloadMdbProjectsV113(
  countryIso3: string,
  records: MdbProjectRecordV113[],
  format: CooperationFinanceDownloadFormatV113
): void {
  const rows = records.map((row) => ({
    country_iso3: countryIso3,
    organization: row.organization,
    project_id: row.projectId,
    project_title: row.title,
    status: row.status,
    approval_date: row.approvalDate,
    closing_date: row.closingDate,
    commitment_usd: row.commitmentUsd,
    disbursement_usd: row.disbursementUsd,
    sectors: row.sectors.join(" | "),
    implementing_agency: row.implementingAgency,
    source_url: row.sourceUrl,
  }));
  const filename = `${countryIso3}-mdb-projects-v113.${format}`;

  if (format === "json") {
    saveBlob(
      JSON.stringify(
        {
          schemaVersion: "v113",
          generatedAt: new Date().toISOString(),
          records: rows,
        },
        null,
        2
      ),
      "application/json;charset=utf-8",
      filename
    );
    return;
  }

  const headers = Object.keys(
    rows[0] ?? {
      country_iso3: "",
      organization: "",
      project_id: "",
      project_title: "",
      status: "",
      approval_date: "",
      closing_date: "",
      commitment_usd: "",
      disbursement_usd: "",
      sectors: "",
      implementing_agency: "",
      source_url: "",
    }
  );
  const body = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvCell(row[header as keyof typeof row]))
        .join(",")
    ),
  ].join("\n");
  saveBlob(`\uFEFF${body}`, "text/csv;charset=utf-8", filename);
}
