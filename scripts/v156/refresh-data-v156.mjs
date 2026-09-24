#!/usr/bin/env node
/**
 * One command for a delivery refresh: stage, redact, build, diff, apply.
 *
 * The 2026-09-22 round showed why each step exists and why the order matters:
 * a lock file read as a workbook, an API key in a metadata sheet, a staging root
 * the ETL refuses, a spatial builder that stops on a new grain, three download
 * payloads over GitHub's per-file limit, and map layers whose declared variables
 * vanished with an indicator rename. Every one of those is caught before
 * `public/` changes - but only if the steps run in this order, every time.
 *
 * Usage:
 *   node scripts/v156/refresh-data-v156.mjs --source 베트남데이터/<YYYYMMDD>
 *   node scripts/v156/refresh-data-v156.mjs --source … --apply
 *
 * Without `--apply` it stops after the diff: the report is what a reviewer reads
 * before deciding. `--hold` carries the named elements forward from the previous
 * delivery instead of adopting them; the reason belongs in the round's REVIEW.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const SOURCE = opt("--source", "베트남데이터/20260922");
const VERSION = opt("--version", "v156");
const HOLD = opt("--hold", "");
const CARRY_FROM = opt("--carry-from", "베트남데이터/file");
const DELIVERED_AT = opt("--delivered-at", basename(SOURCE).replace(/^(\d{4})(\d{2})(\d{2})$/u, "$1-$2-$3"));
/** The ETL asserts this count AFTER carry-over, so it is the framework total. */
const EXPECTED_WORKBOOKS = opt("--expected-workbooks", "149");
const STAGING = opt("--staging", `.staging/${VERSION}`);
const OUT = opt("--out", `reports/${VERSION}`);
const APPLY = argv.includes("--apply");

// Without this, `--help` looked like an unknown flag and the whole pipeline ran.
if (argv.includes("--help") || argv.includes("-h")) {
  process.stdout.write(
    [
      "node scripts/v156/refresh-data-v156.mjs --source 베트남데이터/<YYYYMMDD> [--apply]",
      "",
      "  --source              워크북이 바로 들어 있는 디렉터리 (필수에 가까움)",
      "  --version <vNNN>      스테이징·보고서 접두 (기본 v156)",
      "  --hold A-023,B-033    채택하지 않을 요소 코드 (이전 입고분 유지)",
      "  --carry-from <dir>    보류 요소를 가져올 이전 입고분 (기본 베트남데이터/file)",
      "  --expected-workbooks  carry-over 후 워크북 수 (기본 149)",
      "  --staging <dir>       .staging/ 하위여야 함 (기본 .staging/<version>)",
      "  --out <dir>           보고서 디렉터리 (기본 reports/<version>)",
      "  --apply               공개 트리에 반영 (없으면 diff까지만)",
      "",
      "자세한 절차·게이트: docs/DATA_REFRESH_RUNBOOK_V156.md",
      "",
    ].join("\n")
  );
  process.exit(0);
}

if (!existsSync(resolve(ROOT, SOURCE))) {
  console.error(JSON.stringify({ type: "error", reason: "SOURCE_NOT_FOUND", source: SOURCE }));
  process.exit(1);
}

const env = { ...process.env, PYTHONIOENCODING: "utf-8", VIETNAM_EXPECTED_WORKBOOKS: EXPECTED_WORKBOOKS };
const node = process.execPath;
const python = process.env.PYTHON || "python";

/** [label, command, args] - each step reads what the previous one wrote. */
const STEPS = [
  [
    "stage",
    node,
    [
      "scripts/v156/stage-source-v156.mjs",
      "--source", SOURCE,
      "--version", VERSION,
      "--delivered-at", DELIVERED_AT,
      "--carry-from", CARRY_FROM,
      ...(HOLD ? ["--hold", HOLD] : []),
    ],
  ],
  // A delivery may document its collection method with a live key in it. The
  // ETL refuses to build until someone has looked; this removes the value from
  // the staged copy and records hashes, never values.
  ["redact", python, ["-m", "tools.vietnam_etl.redact_source_credentials_v156", "--workbooks", `_source/vietnam/${VERSION}/workbooks`]],
  // Shape first: it answers "what changed in the delivery" even when the build
  // cannot finish, which is exactly when the question matters most.
  ["structure", python, ["scripts/v156/source-structure-v156.py", "--workbooks", `_source/vietnam/${VERSION}/workbooks`, "--out", `${OUT}/source-structure-${VERSION}.json`]],
  ["build", node, ["scripts/v137/build-final-data-v137.mjs", "--source", `_source/vietnam/${VERSION}/workbooks`, "--staging", STAGING]],
  ["diff", node, ["scripts/v156/source-diff-v156.mjs", "--current", "public/data/vietnam/v2", "--candidate", `${STAGING}/public/data/vietnam/v2`, "--out", OUT, "--delivered-at", DELIVERED_AT]],
];
const APPLY_STEPS = [
  ["apply", node, ["scripts/v156/apply-staged-data-v156.mjs", "--from", `${STAGING}/public/data/vietnam/v2`, "--apply", "--report", `${OUT}/apply-staged-data-${VERSION}.json`]],
  // The chain does not write these two, so they are rebuilt on the applied tree.
  // Each one rewrites asset-integrity afterwards.
  ["dataset-directory", node, ["scripts/v150-1/dataset-directory-v150-1.mjs", "build"]],
  ["asset-integrity", node, ["scripts/generate-vietnam-asset-integrity-v133.mjs", "--data", "public/data/vietnam/v2"]],
  ["card-summaries", node, ["scripts/v140/build-card-summaries-v140.mjs"]],
  ["asset-integrity-final", node, ["scripts/generate-vietnam-asset-integrity-v133.mjs", "--data", "public/data/vietnam/v2"]],
];

const reportsDir = resolve(ROOT, OUT);
mkdirSync(reportsDir, { recursive: true });
const log = [];
for (const [label, command, args] of [...STEPS, ...(APPLY ? APPLY_STEPS : [])]) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const startedAt = Date.now();
  try {
    const output = execFileSync(command, args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "inherit"], maxBuffer: 256 * 1024 * 1024 });
    const text = output.toString("utf8");
    process.stdout.write(`${text.split("\n").slice(-3).join("\n")}\n${label}: ok\n`);
    log.push({ step: label, status: "ok", elapsedMs: Date.now() - startedAt });
  } catch (error) {
    log.push({ step: label, status: "failed", elapsedMs: Date.now() - startedAt, exitCode: error.status ?? null });
    writeFileSync(resolve(reportsDir, `refresh-${VERSION}.json`), `${JSON.stringify({ source: SOURCE, applied: APPLY, steps: log }, null, 2)}\n`, "utf8");
    process.stdout.write(`${label}: FAILED\n`);
    throw error;
  }
}
writeFileSync(
  resolve(reportsDir, `refresh-${VERSION}.json`),
  `${JSON.stringify({ source: SOURCE, deliveredAt: DELIVERED_AT, held: HOLD ? HOLD.split(",") : [], applied: APPLY, steps: log }, null, 2)}\n`,
  "utf8"
);
process.stdout.write(
  APPLY
    ? `\napplied: public/data/vietnam/v2 · 검증은 docs/DATA_REFRESH_RUNBOOK_V156.md의 게이트 목록\n`
    : `\ndiff only: ${OUT}/source-diff-${VERSION}.md 를 검토한 뒤 --apply 로 다시 실행\n`
);
