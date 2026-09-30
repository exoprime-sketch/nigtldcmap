#!/usr/bin/env node
/**
 * P5(PR-E) 최종 검증을 한 번에 실행하고 결과를 reports/p5/P5_RESULT.md로 정리한다.
 *
 * 실행 시점: V162(데이터 갱신)·P8-2(지도 12 등록)·PR-D(상세보기 최종화)가 모두
 * origin/main에 병합된 뒤. 이 스크립트 자체는 그 병합을 기다리지 않고, 병합 전에
 * 돌리면 (2) qa:acceptance는 "미병합"으로 건너뛰고 (6) smoke는 운영 URL이 없으면
 * 건너뛴다 — 실패가 아니라 "아직 실행할 수 없음"으로 구분해 기록한다.
 *
 * 순서(고정):
 *   (1) build            — GENERATE_SOURCEMAP=false production build
 *   (2) qa:acceptance    — npm script가 있을 때만, --country VNM,BGD
 *   (3) e2e 기준 이미지   — home·finder·detail-a016·detail-d011 4개만 --update-snapshots
 *                          (download은 제외 — 이번 라운드가 건드리지 않은 화면)
 *   (4) e2e 전체          — npx playwright test
 *   (5) finalize:v151     — 차단 게이트
 *   (6) smoke:production  — PRODUCTION_URL이 설정돼 있을 때만
 *
 * 한 단계가 실패하면 이후 단계는 건너뛰고(설정 게이트 결과를 흐리지 않기 위해)
 * "실행 성공"과 "내용 완성"을 분리해 보고서에 남긴다 — "빌드가 끝났다" ≠ "검증을
 * 통과했다".
 *
 * Usage:
 *   node scripts/p5/run-p5.mjs [--dry-run] [--country VNM,BGD]
 *   npm run p5:final                 (동일, 인자 없이)
 *
 * --dry-run: 각 단계를 실행하지 않고 계획(명령·건너뛰기 사유)만 보고서로 남긴다.
 * 이 스크립트를 새로 만들거나 고친 뒤 배관을 확인할 때 쓴다.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const countryArg = (() => {
  const at = argv.indexOf("--country");
  return at >= 0 && argv[at + 1] ? argv[at + 1] : "VNM,BGD";
})();
const REPORT_DIR = resolve(ROOT, "reports/p5");
const REPORT_PATH = resolve(REPORT_DIR, "P5_RESULT.md");
const REPORT_JSON_PATH = resolve(REPORT_DIR, "p5-result.json");

const npmPackage = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

/** Runs one shell step (npm run … or npx …) and captures what happened, without printing the whole log to the report. */
function runStep(name, command, args, { cwd = ROOT, env = process.env, timeoutMs } = {}) {
  const startedAt = new Date();
  if (DRY_RUN) {
    return {
      name, command: `${command} ${args.join(" ")}`.trim(), status: "dry-run",
      startedAt: startedAt.toISOString(), finishedAt: startedAt.toISOString(), durationMs: 0,
      exitCode: null, tail: [], note: "실행하지 않음(--dry-run)",
    };
  }
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: timeoutMs, shell: false });
  const finishedAt = new Date();
  const stdout = String(result.stdout || "");
  const stderr = String(result.stderr || "");
  // A full log is too long for a report a person reads; the last lines carry
  // the summary line most of this repo's scripts print (a JSON {"type":"summary",…}).
  const tail = [...stdout.split(/\r?\n/), ...stderr.split(/\r?\n/)].filter(Boolean).slice(-12);
  return {
    name, command: `${command} ${args.join(" ")}`.trim(),
    status: result.status === 0 ? "pass" : result.error ? "error" : "fail",
    startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt, exitCode: result.status,
    tail, note: result.error ? String(result.error.message || result.error) : null,
  };
}

function skipStep(name, command, reason) {
  return {
    name, command, status: "skipped", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
    durationMs: 0, exitCode: null, tail: [], note: reason,
  };
}

const steps = [];
let stopped = false;

function step(name, fn) {
  if (stopped) {
    steps.push(skipStep(name, "", "앞 단계 실패로 건너뜀(순서 고정 — 뒤 단계는 앞 단계가 성립해야 의미가 있다)"));
    return;
  }
  const result = fn();
  steps.push(result);
  if (result.status === "fail" || result.status === "error") stopped = true;
}

// ---------------------------------------------------------------- (1) build
step("(1) build", () =>
  runStep(
    "(1) build",
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build"],
    { env: { ...process.env, GENERATE_SOURCEMAP: "false" }, timeoutMs: 10 * 60_000 }
  )
);

// ---------------------------------------------------------------- (2) qa:acceptance
// The gate landed as qa:acceptance:v162; the bare name is kept as a fallback.
const acceptanceScript = ["qa:acceptance:v162", "qa:acceptance"].find((name) => npmPackage.scripts?.[name]);
const hasAcceptanceScript = Boolean(acceptanceScript);
step("(2) qa:acceptance", () => {
  if (!hasAcceptanceScript) {
    return skipStep(
      "(2) qa:acceptance",
      `npm run qa:acceptance -- --country ${countryArg}`,
      "미병합 — package.json에 qa:acceptance 스크립트가 없음(세션4 PR 병합 대기)"
    );
  }
  return runStep(
    "(2) qa:acceptance",
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", acceptanceScript, "--", "--country", countryArg],
    // a full run (map, wording scan over every detail page, six widths) takes 40+ min
    { timeoutMs: 120 * 60_000 }
  );
});

// ---------------------------------------------------------------- (3) e2e baseline update (4 screens only)
const BASELINE_SCREENS = ["home", "finder", "detail-a016", "detail-d011"];
const BASELINE_GREP = `^(${BASELINE_SCREENS.join("|")}) matches its baseline$`;
step("(3) e2e 기준 이미지 갱신(4개)", () =>
  runStep(
    "(3) e2e 기준 이미지 갱신(4개)",
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "test", "e2e/visual.spec.ts", "--grep", BASELINE_GREP, "--update-snapshots"],
    { timeoutMs: 5 * 60_000 }
  )
);

// ---------------------------------------------------------------- (4) e2e full
step("(4) e2e 전체", () =>
  runStep(
    "(4) e2e 전체",
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["playwright", "test"],
    { timeoutMs: 20 * 60_000 }
  )
);

// ---------------------------------------------------------------- (5) finalize:v151
step("(5) finalize:v151", () =>
  runStep(
    "(5) finalize:v151",
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "finalize:v151"],
    { timeoutMs: 60 * 60_000 }
  )
);

// ---------------------------------------------------------------- (6) smoke:production
const productionUrl = String(process.env.PRODUCTION_URL || process.env.V128_PRODUCTION_URL || "").trim();
step("(6) smoke:production:v128", () => {
  if (!productionUrl) {
    return skipStep(
      "(6) smoke:production:v128",
      "npm run smoke:production:v128",
      "PRODUCTION_URL 미설정 — 배포 전이거나 이 실행에서 배포를 확인하지 않음"
    );
  }
  return runStep(
    "(6) smoke:production:v128",
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "smoke:production:v128"],
    { timeoutMs: 5 * 60_000 }
  );
});

// ---------------------------------------------------------------- report
mkdirSync(REPORT_DIR, { recursive: true });

const STATUS_LABEL = {
  pass: "통과", fail: "실패", error: "오류(실행 자체 실패)", skipped: "건너뜀", "dry-run": "미실행(dry-run)",
};

const lines = [];
lines.push(`# P5 최종 검증 결과`);
lines.push("");
lines.push(`생성: ${new Date().toISOString()} · 모드: ${DRY_RUN ? "dry-run(계획만)" : "실행"} · country=${countryArg}`);
lines.push("");
lines.push(
  "**\"실행 성공\"과 \"내용 완성\"은 다르다.** 아래 표의 '결과'는 명령이 0으로 끝났는지만 말한다 — " +
  "게이트를 통과했다는 뜻이지, 화면 내용이 다 채워졌다는 뜻이 아니다. 각 단계의 판정은 그 게이트 " +
  "자신의 산출물(마지막 요약 줄)을 읽는다."
);
lines.push("");
lines.push("| 단계 | 결과 | 소요 | 비고 |");
lines.push("| --- | --- | --- | --- |");
for (const result of steps) {
  const duration = result.durationMs ? `${Math.round(result.durationMs / 1000)}s` : "–";
  const note = result.note ? result.note.replace(/\|/gu, "/").slice(0, 200) : "";
  lines.push(`| ${result.name} | **${STATUS_LABEL[result.status] || result.status}** | ${duration} | ${note} |`);
}
lines.push("");
lines.push("## 단계별 명령·마지막 출력");
lines.push("");
for (const result of steps) {
  lines.push(`### ${result.name}`);
  lines.push("");
  lines.push(`- 명령: \`${result.command || "(없음)"}\``);
  lines.push(`- 결과: ${STATUS_LABEL[result.status] || result.status}${result.exitCode !== null ? `(exit ${result.exitCode})` : ""}`);
  if (result.note) lines.push(`- 비고: ${result.note}`);
  if (result.tail.length) {
    lines.push("- 마지막 출력:");
    lines.push("```");
    lines.push(...result.tail);
    lines.push("```");
  }
  lines.push("");
}

const overall = steps.every((result) => result.status === "pass" || result.status === "skipped" || result.status === "dry-run")
  ? (steps.some((result) => result.status === "skipped") ? "부분 완료(건너뜀 있음)" : "전체 통과")
  : "실패";
lines.unshift("");
lines.unshift(`**전체 판정: ${overall}**`);

writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
writeFileSync(
  REPORT_JSON_PATH,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), dryRun: DRY_RUN, country: countryArg, overall, steps }, null, 2)}\n`,
  "utf8"
);

process.stdout.write(
  `${JSON.stringify({
    type: "summary", schema: "p5-run-result", overall,
    steps: steps.map((result) => ({ name: result.name, status: result.status })),
    report: REPORT_PATH.replace(ROOT, "").replace(/\\/gu, "/"),
  })}\n`
);
process.exitCode = overall === "실패" ? 1 : 0;
