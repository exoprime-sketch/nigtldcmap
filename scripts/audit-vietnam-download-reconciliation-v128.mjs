#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  DOWNLOAD_CSV_PATH_V128,
  DOWNLOAD_JSON_PATH_V128,
  buildVietnamReleaseAcceptanceV128,
} from "./build-vietnam-release-acceptance-v128.mjs";
import { AuditV125, parseCsv } from "./v125/audit-utils.mjs";

const audit = new AuditV125("download-reconciliation:v128");
let generated;
let stored;
let csvRows = [];
let generationError = null;

try {
  generated = buildVietnamReleaseAcceptanceV128({ write: false });
  stored = JSON.parse(readFileSync(DOWNLOAD_JSON_PATH_V128, "utf8"));
  csvRows = parseCsv(
    readFileSync(DOWNLOAD_CSV_PATH_V128, "utf8").replace(/^\uFEFF/u, "")
  );
} catch (error) {
  generationError = error instanceof Error ? error.message : String(error);
}

audit.check("DOWNLOAD_RECONCILIATION_GENERATOR", generationError === null, generationError, null);
const summary = generated?.downloadDocument?.summary || {};
const elements = generated?.downloadDocument?.elements || [];
audit.check("CATALOG_DOWNLOADABLE_ELEMENT_COUNT", summary.catalogDownloadableElementCount >= 114, summary.catalogDownloadableElementCount, ">=114");
audit.check("DATA_BEARING_ELEMENT_COUNT", summary.dataBearingElementCount === 147, summary.dataBearingElementCount, 147);
audit.check("POPULATED_DOWNLOADABLE_ELEMENT_COUNT", summary.populatedDownloadableElementCount === 112, summary.populatedDownloadableElementCount, 112);
audit.check("DISPLAY_ONLY_DATA_BEARING_COUNT", summary.displayOnlyDataBearingElementCount === 35, summary.displayOnlyDataBearingElementCount, 35);
audit.check("NO_POPULATED_DOWNLOAD_RECORD_COUNT", summary.noPopulatedDownloadRecordCount === 5, summary.noPopulatedDownloadRecordCount, 5);
audit.check(
  "DOWNLOAD_CLASSIFICATION_COVERAGE",
  elements.length === 152 &&
    elements.every((row) =>
      [
        "downloadable",
        "display-only-by-source-license",
        "display-only-by-publication-policy",
        "no-populated-download-record",
        "download-generation-error",
      ].includes(row.availabilityClass)
    ),
  elements.length,
  152
);
audit.check("DOWNLOAD_GENERATION_ERROR", summary.downloadGenerationErrorCount === 0, summary.downloadGenerationErrorCount, 0);
audit.check("EMPTY_DOWNLOAD", summary.emptyDownloadCount === 0, summary.emptyDownloadCount, 0);
audit.check("TECHNICAL_FIELD", summary.technicalFieldCount === 0, summary.technicalFieldCount, 0);
audit.check("DISPLAYED_DOWNLOADED_ROW_RECONCILIATION", summary.reconciliationPass === true && elements.every((row) => row.reconciliationResult === "PASS"), elements.filter((row) => row.reconciliationResult !== "PASS").map((row) => row.elementId), []);
audit.check("DISPLAY_ONLY_REASON_COVERAGE", summary.unexplainedDownloadDisabledCount === 0 && elements.filter((row) => row.availabilityClass.startsWith("display-only")).every((row) => row.userFacingReason.length > 0), summary.unexplainedDownloadDisabledCount, 0);
audit.check("DOWNLOAD_ASSET_REFERENCES", elements.every((row) => row.assetReferenceStatus === "valid"), elements.filter((row) => row.assetReferenceStatus !== "valid").map((row) => row.elementId), []);
audit.check("NO_POPULATED_DOWNLOAD_PREVENTION", ["C-020", "C-021", "C-023", "E-011", "E-013"].every((elementId) => {
  const row = elements.find((item) => item.elementId === elementId);
  return row?.availabilityClass === "no-populated-download-record" && row?.standardDownloadOffered === false && row?.safeProjectedRecordCount === 0;
}), elements.filter((row) => row.availabilityClass === "no-populated-download-record").map((row) => row.elementId), ["C-020", "C-021", "C-023", "E-011", "E-013"]);
audit.check("REPORT_JSON_REPRODUCIBLE", JSON.stringify(stored?.elements || []) === JSON.stringify(elements), stored?.elements?.length || 0, elements.length);
audit.check("REPORT_CSV_ROW_COUNT", csvRows.length === 152, csvRows.length, 152);

audit.finish({
  catalogDownloadableElementCount: summary.catalogDownloadableElementCount,
  populatedDownloadableElementCount: summary.populatedDownloadableElementCount,
  displayOnlyDataBearingElementCount: summary.displayOnlyDataBearingElementCount,
  noPopulatedDownloadRecordCount: summary.noPopulatedDownloadRecordCount,
  arithmeticExplanation: summary.arithmeticExplanation,
});
