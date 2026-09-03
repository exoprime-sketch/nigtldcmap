#!/usr/bin/env node

import { readFileSync } from "node:fs";
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
const pages = readFileSync(resolve(PROJECT_ROOT, ".github/workflows/pages.yml"), "utf8");
const visualQa = readFileSync(
  resolve(PROJECT_ROOT, ".github/workflows/visual-qa.yml"),
  "utf8"
);

const CURRENT = "v136";
const SUPERSEDED_GATE = /npm\s+run\s+finalize:v1(?:2[0-9]|3[0-5])\b/gu;

const ciGate = /\brun:\s*npm\s+run\s+finalize:v136\s*$/mu.test(ci);
const pagesGate = /\brun:\s*npm\s+run\s+finalize:v136\s*$/mu.test(pages);
const visualCapture = /\brun:\s*npm\s+run\s+capture:screenshots:v136\s*$/mu.test(visualQa);

const ciReportPath = /^\s*reports\/v136\/\s*$/mu.test(ci);
const pagesSmokePath = /path:\s*reports\/v136\/production-smoke-v136\.json/u.test(pages);
const visualScreenshotPath = /path:\s*reports\/v136\/screenshots\//u.test(visualQa);

// Screenshot capture must never sit inside a blocking job.
const captureInBlockingJob =
  /capture:screenshots:v1[0-9]{2}/u.test(ci) ||
  /capture:screenshots:v1[0-9]{2}/u.test(pages);

// The visual QA capture step has to stay tolerant of its own failure.
const captureStep =
  visualQa.match(
    /- name:\s*Capture V136 screenshots[\s\S]*?(?=\n\s{6}- name:|\n\s{4}\w|$)/u
  )?.[0] || "";
const captureContinuesOnError = /continue-on-error:\s*true/u.test(captureStep);
const visualQaHasNoGate = !/npm\s+run\s+finalize:v1[0-9]{2}/u.test(visualQa);

const supersededGateHits = [
  ...ci.matchAll(SUPERSEDED_GATE),
  ...pages.matchAll(SUPERSEDED_GATE),
].map((match) => match[0]);

audit.check("CI_CURRENT_RELEASE_GATE", ciGate, { finalize: ciGate }, `finalize:${CURRENT}`);
audit.check("PAGES_CURRENT_RELEASE_GATE", pagesGate, { finalize: pagesGate }, `finalize:${CURRENT}`);
audit.check("VISUAL_QA_CURRENT_CAPTURE", visualCapture, { capture: visualCapture }, `capture:screenshots:${CURRENT}`);
audit.check("CI_REPORT_PATH", ciReportPath, { reportsV136: ciReportPath }, "reports/v136");
audit.check("PAGES_SMOKE_REPORT_PATH", pagesSmokePath, { smokePath: pagesSmokePath }, "reports/v136/production-smoke-v136.json");
audit.check("VISUAL_QA_SCREENSHOT_PATH", visualScreenshotPath, { screenshotPath: visualScreenshotPath }, "reports/v136/screenshots");
audit.check("SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER", captureInBlockingJob === false, { captureInBlockingJob }, false);
audit.check("VISUAL_QA_NON_BLOCKING", captureContinuesOnError && visualQaHasNoGate, { captureContinuesOnError, visualQaHasNoGate }, { captureContinuesOnError: true, visualQaHasNoGate: true });
audit.check("OLD_V135_CURRENT_GATE_COUNT", supersededGateHits.length === 0, supersededGateHits, []);

finishAuditV136(audit, "workflow-audit-v136.json", {
  ciCurrentGate: ciGate ? `finalize:${CURRENT}` : "missing",
  pagesCurrentGate: pagesGate ? `finalize:${CURRENT}` : "missing",
  visualQaCurrentCapture: visualCapture ? `capture:screenshots:${CURRENT}` : "missing",
  ciReportPath: ciReportPath ? "reports/v136" : "missing",
  pagesSmokeReportPath: pagesSmokePath ? "reports/v136/production-smoke-v136.json" : "missing",
  visualQaScreenshotPath: visualScreenshotPath ? "reports/v136/screenshots" : "missing",
  screenshotCaptureIsReleaseBlocker: captureInBlockingJob,
  oldV135CurrentGateCount: supersededGateHits.length,
});
