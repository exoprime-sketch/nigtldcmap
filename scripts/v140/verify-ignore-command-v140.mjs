#!/usr/bin/env node
/**
 * Replays vercel.json's `ignoreCommand` over real commits and checks that it
 * only skips a Preview build when nothing the build reads has changed.
 *
 * Vercel runs the command in the build container with HEAD at the deployed
 * commit; exit 0 cancels the build, any other exit code builds. The replay
 * runs the exact command string, under `sh`, in a detached worktree whose HEAD
 * is each commit (no checkout - `git diff <a> <b>` reads trees, not files), so
 * what is verified is the command as Vercel will execute it.
 *
 * Independently of the command, each commit's changed paths are classified
 * against BUILD_INPUTS - the files `react-scripts build` reads. A skip on a
 * commit that touched a build input is a defect; a build on a commit that
 * touched none is only waste. The report fails on the former.
 *
 *   node scripts/v140/verify-ignore-command-v140.mjs [--count 30] [--ref HEAD]
 *
 * Writes reports/v140/ignore-command-verification-v140.json.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPORT = resolve(ROOT, "reports/v140/ignore-command-verification-v140.json");

// Everything `react-scripts build` reads from the checkout. `.gitattributes` is
// in because it decides the bytes public/ checks out with; vercel.json because a
// change to this very rule must build. reports/, docs/, scripts/, e2e/ and
// .github/ are not read by the build, so a commit that only touches them
// produces byte-identical output.
const BUILD_INPUTS = [
  "public/",
  "src/",
  "api/",
  "server/",
  "scripts/v149/",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".eslintrc.json",
  ".gitattributes",
  "vercel.json",
  ".env",
];

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const COUNT = Number(opt("--count", "30"));
const REF = opt("--ref", "HEAD");

const git = (cmdArgs, cwd = ROOT) =>
  execFileSync("git", cmdArgs, { cwd, encoding: "utf8" }).trim();

const vercelConfig = JSON.parse(readFileSync(resolve(ROOT, "vercel.json"), "utf8"));
const ignoreCommand = vercelConfig.ignoreCommand;
if (typeof ignoreCommand !== "string" || !ignoreCommand.trim()) {
  console.error("vercel.json has no ignoreCommand");
  process.exit(2);
}

const shellPath = (() => {
  if (process.platform !== "win32") return "sh";
  const candidates = [
    process.env.GIT_BASH_PATH,
    process.env.ProgramFiles ? join(process.env.ProgramFiles, "Git", "bin", "bash.exe") : null,
    process.env["ProgramW6432"] ? join(process.env["ProgramW6432"], "Git", "bin", "bash.exe") : null,
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? "sh";
})();
const shellArgs = process.platform === "win32" ? ["-lc", ignoreCommand] : ["-c", ignoreCommand];

const touchesBuildInput = (paths) =>
  paths.some((p) =>
    BUILD_INPUTS.some((input) =>
      input.endsWith("/") ? p.startsWith(input) : p === input || p.startsWith(`${input}.`)
    )
  );

/** Runs the ignore command exactly as Vercel would, with HEAD at `sha`. */
function replay(sha, env, previousSha = "") {
  const dir = mkdtempSync(join(tmpdir(), "ignore-cmd-"));
  rmSync(dir, { recursive: true, force: true });
  git(["worktree", "add", "--detach", "--no-checkout", dir, sha]);
  try {
    // The command's git pathspecs are relative to the worktree; without a
    // checkout the pathspecs still resolve because diff reads the trees.
    const result = spawnSync(shellPath, shellArgs, {
      cwd: dir,
      env: { ...process.env, VERCEL_ENV: env, VERCEL: "1", VERCEL_GIT_PREVIOUS_SHA: previousSha },
      encoding: "utf8",
    });
    return {
      exitCode: result.error ? 127 : result.status,
      stderr: result.error?.message ?? (result.stderr ?? "").trim(),
    };
  } finally {
    git(["worktree", "remove", "--force", dir]);
  }
}

const shas = git(["rev-list", "-n", String(COUNT), REF]).split("\n").filter(Boolean);
const rootSha = git(["rev-list", "--max-parents=0", REF]).split("\n")[0];

const rows = [];
let defects = 0;
let skipped = 0;

for (const sha of shas) {
  const subject = git(["log", "-1", "--format=%s", sha]);
  const parents = git(["log", "-1", "--format=%P", sha]).split(" ").filter(Boolean);
  const changed = parents.length
    ? git(["diff", "--name-only", `${sha}^`, sha]).split("\n").filter(Boolean)
    : git(["ls-tree", "-r", "--name-only", sha]).split("\n").filter(Boolean);
  const affectsBuild = touchesBuildInput(changed);

  const preview = replay(sha, "preview", parents[0] ?? "");
  const production = replay(sha, "production", parents[0] ?? "");
  const previewDecision = preview.exitCode === 0 ? "skip" : "build";

  // A skip is only correct when no build input changed. Production must build.
  const previewOk = previewDecision === "build" || !affectsBuild;
  const productionOk = production.exitCode !== 0;
  const expectedPreview = affectsBuild ? "build" : "skip";
  const wasteful = previewDecision === "build" && !affectsBuild;
  if (!previewOk || !productionOk) defects += 1;
  if (previewDecision === "skip") skipped += 1;

  const topLevel = [...new Set(changed.map((p) => p.split("/")[0]))].sort();
  rows.push({
    sha: sha.slice(0, 7),
    subject,
    changedFiles: changed.length,
    changedTopLevel: topLevel,
    affectsBuild,
    preview: { exitCode: preview.exitCode, decision: previewDecision, expected: expectedPreview },
    production: { exitCode: production.exitCode, decision: production.exitCode === 0 ? "skip" : "build" },
    verdict: !previewOk ? "DEFECT_SKIPPED_BUILD_INPUT" : !productionOk ? "DEFECT_SKIPPED_PRODUCTION" : wasteful ? "BUILD_NOT_NEEDED" : "OK",
  });
}

// A branch without a successful prior deployment must build.
const rootPreview = replay(rootSha, "preview");
const rootOk = rootPreview.exitCode !== 0;
if (!rootOk) defects += 1;

// Real multi-commit pushes: the last commit may only update a report while
// earlier, not-yet-deployed commits changed public assets or source code.
const multiCommitCases = [];
for (const sha of shas.filter((_, index) => index < 8)) {
  const history = git(["rev-list", "--first-parent", "-n", "6", sha]).split("\n").filter(Boolean);
  for (const distance of [2, 5]) {
    const previousSha = history[distance];
    if (!previousSha) continue;
    const changed = git(["diff", "--name-only", previousSha, sha]).split("\n").filter(Boolean);
    const affectsBuild = touchesBuildInput(changed);
    const result = replay(sha, "preview", previousSha);
    const decision = result.exitCode === 0 ? "skip" : "build";
    const ok = decision === (affectsBuild ? "build" : "skip");
    if (!ok) defects += 1;
    multiCommitCases.push({ sha: sha.slice(0, 7), previousSha: previousSha.slice(0, 7), distance, affectsBuild, decision, ok });
  }
}
const failSafeCases = [
  { name: "missing-previous-deployment", environment: "preview", previousSha: "" },
  { name: "previous-sha-unavailable-in-shallow-clone", environment: "preview", previousSha: "f".repeat(40) },
  { name: "unknown-environment", environment: "", previousSha: shas[1] ?? "" },
].map((test) => {
  const result = replay(shas[0], test.environment, test.previousSha);
  const ok = result.exitCode !== 0;
  if (!ok) defects += 1;
  return { name: test.name, exitCode: result.exitCode, ok };
});

const report = {
  schema: "nigt-ignore-command-verification-1",
  generatedAt: new Date().toISOString(),
  ref: REF,
  headSha: git(["rev-parse", REF]),
  ignoreCommand,
  buildInputs: BUILD_INPUTS,
  semantics: "exit 0 = skip only an unchanged Preview since its last successful deployment. Production, missing baseline and unknown environment always build.",
  commitsReplayed: rows.length,
  previewSkipped: skipped,
  previewBuilt: rows.length - skipped,
  defects,
  multiCommitCases,
  failSafeCases,
  rootCommit: { sha: rootSha.slice(0, 7), previewExitCode: rootPreview.exitCode, decision: rootOk ? "build" : "skip", ok: rootOk, stderr: rootPreview.stderr },
  status: defects === 0 ? "PASS" : "FAIL",
  commits: rows,
};

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);

const pad = (s, n) => String(s).padEnd(n);
console.log(`ignoreCommand: ${ignoreCommand}\n`);
console.log(`${pad("sha", 8)} ${pad("preview", 8)} ${pad("prod", 6)} ${pad("verdict", 27)} changed   subject`);
for (const r of rows) {
  console.log(
    `${pad(r.sha, 8)} ${pad(r.preview.decision, 8)} ${pad(r.production.decision, 6)} ${pad(r.verdict, 27)} ${pad(r.changedTopLevel.join(","), 40)} ${r.subject.slice(0, 60)}`
  );
}
console.log(`\nroot commit ${report.rootCommit.sha}: exit ${rootPreview.exitCode} -> ${report.rootCommit.decision}${rootPreview.stderr ? ` (${rootPreview.stderr.split("\n")[0]})` : ""}`);
console.log(`\n${rows.length} commits: ${skipped} preview skips, ${rows.length - skipped} builds, ${defects} defects -> ${report.status}`);
console.log(`Multi-commit cases: ${multiCommitCases.length}; fail-safe cases: ${failSafeCases.length}`);
console.log(`report: ${REPORT}`);
process.exit(defects === 0 ? 0 : 1);
