#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import { finishAuditV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("workflow:v136");

/**
 * The release gate can pass while the workflows still invoke a superseded gate,
 * which is exactly how a green GitHub check came to mean nothing about V136.
 * This reads the workflow files and pins "the current release" to V136 alone.
 */
const ci = readFileSync(resolve(PROJECT_ROOT, ".github/workflows/ci.yml"), "utf8");
const visualQa = readFileSync(
  resolve(PROJECT_ROOT, ".github/workflows/visual-qa.yml"),
  "utf8"
);

const CURRENT = "v136";
const SUPERSEDED_GATE = /npm\s+run\s+finalize:v1(?:2[0-9]|3[0-5])\b/gu;

// V150-1: ci.yml runs the same V136 gate split into a static job, four
// browser shards and a summary that judges the merged results
// (`audit-vietnam-release-v136.mjs --group/--shard/--results-dir`). Either the
// single-command form or the complete sharded form counts as the current gate.
const ciGateSingle = /\brun:\s*npm\s+run\s+finalize:v136\s*$/mu.test(ci);
const ciGateSharded =
  /audit-vietnam-release-v136\.mjs\s+--group\s+static\b/u.test(ci) &&
  /audit-vietnam-release-v136\.mjs\s+--group\s+browser\s+--shard\s+\$\{\{\s*matrix\.shard\s*\}\}\/4\b/u.test(ci) &&
  /audit-vietnam-release-v136\.mjs\s+--results-dir\b/u.test(ci);
const ciGate = ciGateSingle || ciGateSharded;
const visualCapture = /\brun:\s*npm\s+run\s+capture:screenshots:v136\s*$/mu.test(visualQa);

const ciReportPath = /^\s*reports\/v136\/\s*$/mu.test(ci);
const visualScreenshotPath = /path:\s*reports\/v136\/screenshots\//u.test(visualQa);

// Screenshot capture must never sit inside a blocking job.
const captureInBlockingJob = /capture:screenshots:v1[0-9]{2}/u.test(ci);

// V158 (user decision 2026-09-29): production is Vercel only and the GitHub
// Pages workflow was deleted. No workflow may publish to GitHub Pages again.
const WORKFLOW_DIR = resolve(PROJECT_ROOT, ".github/workflows");
const pagesDeployingWorkflows = readdirSync(WORKFLOW_DIR)
  .filter((name) => /\.ya?ml$/u.test(name))
  .filter((name) =>
    /actions\/(?:deploy-pages|upload-pages-artifact|configure-pages)@/u.test(
      readFileSync(resolve(WORKFLOW_DIR, name), "utf8")
    )
  );
const pagesWorkflowRetired =
  !existsSync(resolve(WORKFLOW_DIR, "pages.yml")) && pagesDeployingWorkflows.length === 0;


// The visual QA capture step has to stay tolerant of its own failure.
const captureStep =
  visualQa.match(
    /- name:\s*Capture V136 screenshots[\s\S]*?(?=\n\s{6}- name:|\n\s{4}\w|$)/u
  )?.[0] || "";
const captureContinuesOnError = /continue-on-error:\s*true/u.test(captureStep);
const visualQaHasNoGate = !/npm\s+run\s+finalize:v1[0-9]{2}/u.test(visualQa);

const supersededGateHits = [...ci.matchAll(SUPERSEDED_GATE)].map((match) => match[0]);

audit.check("CI_CURRENT_RELEASE_GATE", ciGate, { finalize: ciGate, single: ciGateSingle, sharded: ciGateSharded }, `finalize:${CURRENT}`);
audit.check("PAGES_WORKFLOW_RETIRED", pagesWorkflowRetired, { pagesWorkflowRetired, pagesDeployingWorkflows }, { pagesWorkflowRetired: true, pagesDeployingWorkflows: [] });
audit.check("VISUAL_QA_CURRENT_CAPTURE", visualCapture, { capture: visualCapture }, `capture:screenshots:${CURRENT}`);
audit.check("CI_REPORT_PATH", ciReportPath, { reportsV136: ciReportPath }, "reports/v136");
audit.check("VISUAL_QA_SCREENSHOT_PATH", visualScreenshotPath, { screenshotPath: visualScreenshotPath }, "reports/v136/screenshots");
audit.check("SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER", captureInBlockingJob === false, { captureInBlockingJob }, false);
audit.check("VISUAL_QA_NON_BLOCKING", captureContinuesOnError && visualQaHasNoGate, { captureContinuesOnError, visualQaHasNoGate }, { captureContinuesOnError: true, visualQaHasNoGate: true });
audit.check("OLD_V135_CURRENT_GATE_COUNT", supersededGateHits.length === 0, supersededGateHits, []);

finishAuditV136(audit, "workflow-audit-v136.json", {
  ciCurrentGate: ciGate ? `finalize:${CURRENT}` : "missing",
  pagesWorkflowRetired,
  visualQaCurrentCapture: visualCapture ? `capture:screenshots:${CURRENT}` : "missing",
  ciReportPath: ciReportPath ? "reports/v136" : "missing",
  visualQaScreenshotPath: visualScreenshotPath ? "reports/v136/screenshots" : "missing",
  screenshotCaptureIsReleaseBlocker: captureInBlockingJob,
  oldV135CurrentGateCount: supersededGateHits.length,
});
