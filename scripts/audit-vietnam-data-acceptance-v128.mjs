#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  ACCEPTANCE_CSV_PATH_V128,
  ACCEPTANCE_JSON_PATH_V128,
  ACQUISITION_BACKLOG_PATH_V128,
  GAP_DISPOSITION_PATH_V128,
  buildVietnamReleaseAcceptanceV128,
} from "./build-vietnam-release-acceptance-v128.mjs";
import { AuditV125, parseCsv } from "./v125/audit-utils.mjs";

const audit = new AuditV125("data-acceptance:v128");
let generated;
let storedAcceptance;
let storedGap;
let storedBacklog;
let csvRows = [];
let generationError = null;

try {
  generated = buildVietnamReleaseAcceptanceV128({ write: false });
  storedAcceptance = JSON.parse(readFileSync(ACCEPTANCE_JSON_PATH_V128, "utf8"));
  storedGap = JSON.parse(readFileSync(GAP_DISPOSITION_PATH_V128, "utf8"));
  storedBacklog = JSON.parse(readFileSync(ACQUISITION_BACKLOG_PATH_V128, "utf8"));
  csvRows = parseCsv(
    readFileSync(ACCEPTANCE_CSV_PATH_V128, "utf8").replace(/^\uFEFF/u, "")
  );
} catch (error) {
  generationError = error instanceof Error ? error.message : String(error);
}

audit.check("ACCEPTANCE_GENERATOR", generationError === null, generationError, null);
const summary = generated?.acceptanceDocument?.summary || {};
const elements = generated?.acceptanceDocument?.elements || [];
const storedElements = storedAcceptance?.elements || [];
const finalDispositions = new Set([
  "populated-and-released",
  "partial-and-released",
  "schema-only-accepted",
  "data-entry-planned-accepted",
  "not-collected-accepted",
  "acquisition-required",
  "blocked-by-error",
]);

audit.check("FRAMEWORK_ELEMENT_COUNT", summary.frameworkElementCount === 152, summary.frameworkElementCount, 152);
audit.check("ACCOUNTED_ELEMENT_COUNT", summary.accountedElementCount === 152, summary.accountedElementCount, 152);
audit.check("UNEXPLAINED_ELEMENT_COUNT", summary.unexplainedElementCount === 0, summary.unexplainedElementCount, 0);
audit.check("SOURCE_WORKBOOK_COUNT", summary.sourceWorkbookCount === 149, summary.sourceWorkbookCount, 149);
audit.check("DATA_BEARING_ELEMENT_COUNT", summary.dataBearingElementCount >= 147, summary.dataBearingElementCount, ">=147");
audit.check("STATUS_ONLY_ELEMENT_COUNT", summary.statusOnlyElementCount === 5, summary.statusOnlyElementCount, 5);
audit.check("PUBLIC_POPULATED_ROW_COUNT", summary.publicPopulatedRowCount === 37375, summary.publicPopulatedRowCount, 37375);
audit.check(
  "PUBLIC_STATUS_COUNTS",
  JSON.stringify(summary.statusCounts) ===
    JSON.stringify({
      actual: 126,
      "public-authorized": 18,
      partial: 3,
      "schema-only": 1,
      "data-entry-planned": 1,
      "not-collected": 3,
    }),
  summary.statusCounts,
  {
    actual: 126,
    "public-authorized": 18,
    partial: 3,
    "schema-only": 1,
    "data-entry-planned": 1,
    "not-collected": 3,
  }
);
audit.check("FINAL_DISPOSITION_COVERAGE", summary.finalDispositionCount === 152 && elements.every((row) => finalDispositions.has(row.finalDisposition)), summary.finalDispositionCount, 152);
audit.check("BLOCKED_BY_ERROR_COUNT", summary.blockedByErrorCount === 0, summary.blockedByErrorCount, 0);
audit.check("PROVIDED_BUT_UNEXPLAINED_EMPTY", elements.filter((row) => row.publicPopulatedRows === 0 && !["schema-only-accepted", "data-entry-planned-accepted", "not-collected-accepted"].includes(row.finalDisposition)).length === 0, elements.filter((row) => row.publicPopulatedRows === 0 && !["schema-only-accepted", "data-entry-planned-accepted", "not-collected-accepted"].includes(row.finalDisposition)).map((row) => row.elementId), []);
audit.check("UNEXPLAINED_DOWNLOAD_DISABLED", generated?.downloadDocument?.summary?.unexplainedDownloadDisabledCount === 0, generated?.downloadDocument?.summary?.unexplainedDownloadDisabledCount, 0);
audit.check("ROW_BALANCE", summary.rowBalancePass === true, summary.rowBalancePass, true);
audit.check("ASSET_INTEGRITY", summary.assetIntegrityPass === true && generated?.diagnostics?.integrityFailures?.length === 0, generated?.diagnostics?.integrityFailures || [], []);
audit.check("ACCEPTANCE_RESULT", summary.acceptanceFailureCount === 0 && summary.acceptancePassCount === 152, { pass: summary.acceptancePassCount, fail: summary.acceptanceFailureCount }, { pass: 152, fail: 0 });
audit.check("REPORT_JSON_REPRODUCIBLE", JSON.stringify(storedElements) === JSON.stringify(elements), storedElements.length, elements.length);
audit.check("REPORT_CSV_ROW_COUNT", csvRows.length === 152, csvRows.length, 152);

const expectedGaps = new Map([
  ["C-020", "not-collected-accepted"],
  ["C-021", "not-collected-accepted"],
  ["C-023", "not-collected-accepted"],
  ["E-011", "data-entry-planned-accepted"],
  ["E-013", "schema-only-accepted"],
]);
const gapFailures = [...expectedGaps].flatMap(([elementId, disposition]) => {
  const row = storedGap?.records?.find((item) => item.elementId === elementId);
  return row?.finalDisposition === disposition &&
    row?.publicPopulatedRows === 0 &&
    row?.acceptanceResult === "PASS"
    ? []
    : [{ elementId, expected: disposition, actual: row || null }];
});
audit.check("GAP_DISPOSITION", gapFailures.length === 0, gapFailures, []);
audit.check("SOURCE_ACQUISITION_BACKLOG", storedBacklog?.items?.length === 3 && storedBacklog.items.every((item) => item.currentDisposition === "not-collected-accepted" && item.releaseBlocking === false && item.selectedForSupplementalRelease === false && item.officialSourceCandidates?.every((candidate) => /^https:\/\//u.test(candidate.url) && candidate.rightsReviewStatus)), storedBacklog?.items?.map((item) => item.elementId) || [], ["C-020", "C-021", "C-023"]);
audit.check(
  "SOURCE_PACKAGE_UNTRACKED_AND_VALIDATED_WHEN_PRESENT",
  generated?.diagnostics?.localSourcePackage?.accepted === true &&
    generated?.diagnostics?.packErrors?.length === 0,
  {
    localSourcePackage: generated?.diagnostics?.localSourcePackage,
    packErrors: generated?.diagnostics?.packErrors || [],
  },
  {
    tracked: [],
    localHash: "manifest SHA-256 when present",
    workbookCount: "149 when present",
    packErrors: [],
  }
);

audit.finish({
  frameworkElementCount: summary.frameworkElementCount,
  accountedElementCount: summary.accountedElementCount,
  dataBearingElementCount: summary.dataBearingElementCount,
  statusOnlyElementCount: summary.statusOnlyElementCount,
  publicPopulatedRowCount: summary.publicPopulatedRowCount,
  acceptedGapCount: storedGap?.records?.length || 0,
});
