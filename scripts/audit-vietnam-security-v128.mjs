#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { extname, relative, resolve } from "node:path";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";

const audit = new AuditV125("security:v128");
const reportRoot = resolve(PROJECT_ROOT, "reports/v128");
const reportPath = resolve(reportRoot, "security-audit-v128.json");

const gitResult = spawnSync("git", ["ls-files", "-z"], {
  cwd: PROJECT_ROOT,
  encoding: "utf8",
  maxBuffer: 256 * 1024 * 1024,
  windowsHide: true,
});
const trackedFiles = String(gitResult.stdout || "")
  .split("\0")
  .map((value) => value.replace(/\\/gu, "/"))
  .filter(Boolean);
const candidateResult = spawnSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true,
  }
);
const candidateFiles = String(candidateResult.stdout || "")
  .split("\0")
  .map((value) => value.replace(/\\/gu, "/"))
  .filter(Boolean);

const trackedEnv = trackedFiles.filter((path) => /(?:^|\/)\.env(?:$|\.)/u.test(path));
const trackedRawSource = trackedFiles.filter(
  (path) =>
    /(?:^|\/)_source(?:\/|$)/u.test(path) ||
    /\.(?:zip|7z|rar|xlsx?|xlsm)$/iu.test(path)
);
const trackedNodeModules = trackedFiles.filter((path) =>
  /(?:^|\/)node_modules(?:\/|$)/u.test(path)
);
const trackedBuild = trackedFiles.filter((path) => /(?:^|\/)build(?:\/|$)/u.test(path));

function walk(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function rawSourceFiles(root) {
  return walk(root)
    .map((path) => relative(PROJECT_ROOT, path).replace(/\\/gu, "/"))
    .filter(
      (path) =>
        /(?:^|\/)_source(?:\/|$)/u.test(path) ||
        /\.(?:zip|7z|rar|xlsx?|xlsm)$/iu.test(path)
    );
}

const publicRawSource = rawSourceFiles(resolve(PROJECT_ROOT, "public"));
const buildRawSource = rawSourceFiles(resolve(PROJECT_ROOT, "build"));

const secretPatterns = [
  { name: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { name: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/u },
  { name: "github-token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/u },
  { name: "github-fine-grained-token", pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/u },
  { name: "openai-key", pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/u },
  { name: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/u },
  { name: "google-api-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/u },
  {
    name: "assigned-credential-literal",
    pattern:
      /\b(?:password|passphrase|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|credential|secret)\b["']?\s*[:=]\s*["'][A-Za-z0-9+/_=-]{16,}["']/iu,
  },
];
const scannableExtensions = new Set([
  ".cjs",
  ".csv",
  ".css",
  ".geojson",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const secretFindings = [];
const explicitlyPublishedFiles = [
  ...walk(resolve(PROJECT_ROOT, "public/data")),
  ...walk(reportRoot),
].map((path) => relative(PROJECT_ROOT, path).replace(/\\/gu, "/"));
const scannedFiles = Array.from(
  new Set([...candidateFiles, ...explicitlyPublishedFiles])
).sort();
for (const trackedPath of scannedFiles) {
  if (!scannableExtensions.has(extname(trackedPath).toLowerCase())) continue;
  const path = resolve(PROJECT_ROOT, trackedPath);
  if (!existsSync(path) || !statSync(path).isFile()) continue;
  const text = readFileSync(path, "utf8");
  for (const rule of secretPatterns) {
    if (rule.pattern.test(text)) secretFindings.push({ path: trackedPath, rule: rule.name });
  }
}

function collectKeys(value, keys, depth = 0) {
  if (depth > 12 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys, depth + 1);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    keys.add(key);
    collectKeys(item, keys, depth + 1);
  }
}

const credentialFieldPattern = /^(?:password|passphrase|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|credential|credentials|secret)$/iu;
const downloadRoot = resolve(PROJECT_ROOT, "public/data/vietnam/v2/downloads");
const credentialFields = [];
const malformedDownloads = [];
for (const path of walk(downloadRoot)) {
  const extension = extname(path).toLowerCase();
  const publicPath = relative(PROJECT_ROOT, path).replace(/\\/gu, "/");
  try {
    const keys = new Set();
    if (extension === ".csv") {
      const firstLine = readFileSync(path, "utf8").split(/\r?\n/u, 1)[0] || "";
      for (const header of firstLine.split(",")) keys.add(header.replace(/^"|"$/gu, "").trim());
    } else if (extension === ".json") {
      collectKeys(JSON.parse(readFileSync(path, "utf8")), keys);
    } else {
      continue;
    }
    for (const key of keys) {
      if (credentialFieldPattern.test(key)) credentialFields.push({ path: publicPath, field: key });
    }
  } catch (error) {
    malformedDownloads.push({
      path: publicPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const publicFieldPolicy = existsSync(
  resolve(PROJECT_ROOT, "src/data/visualization/publicFieldPolicyV126.ts")
);
const publicFieldPolicyText = publicFieldPolicy
  ? readFileSync(
      resolve(PROJECT_ROOT, "src/data/visualization/publicFieldPolicyV126.ts"),
      "utf8"
    )
  : "";
const downloadPageText = existsSync(resolve(PROJECT_ROOT, "src/pages/DownloadPage.tsx"))
  ? readFileSync(resolve(PROJECT_ROOT, "src/pages/DownloadPage.tsx"), "utf8")
  : "";
const safeDownloadProjection =
  /isDefaultPublicDownloadAssetV126\([^)]*\)[^{]*\{\s*return false;/su.test(
    publicFieldPolicyText
  ) &&
  /publicDownloadRowsHaveTechnicalFieldsV126\(publicRows\)/u.test(downloadPageText) &&
  /publicRowsToCsvV126\(publicRows\)/u.test(downloadPageText) &&
  /publicRowsToJsonV126\(publicRows\)/u.test(downloadPageText);
const ignoreText = existsSync(resolve(PROJECT_ROOT, ".gitignore"))
  ? readFileSync(resolve(PROJECT_ROOT, ".gitignore"), "utf8")
  : "";
const requiredIgnoreRules = ["node_modules/", "build/", "_source/", ".env"];
const missingIgnoreRules = requiredIgnoreRules.filter((rule) => !ignoreText.includes(rule));

const report = {
  schemaVersion: "v128-security-audit-1",
  generatedAt: new Date().toISOString(),
  trackedFileCount: trackedFiles.length,
  candidateFileCount: candidateFiles.length,
  scannedFileCount: scannedFiles.length,
  explicitlyPublishedFileCount: explicitlyPublishedFiles.length,
  trackedEnv,
  trackedRawSource,
  trackedNodeModules,
  trackedBuild,
  publicRawSource,
  buildRawSource,
  secretFindings,
  credentialFields,
  malformedDownloads,
  publicFieldWhitelistPresent: publicFieldPolicy,
  safeDownloadProjection,
  missingIgnoreRules,
};
mkdirSync(reportRoot, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

audit.check(
  "GIT_FILE_INVENTORY",
  gitResult.status === 0 && candidateResult.status === 0,
  { tracked: gitResult.status, candidate: candidateResult.status },
  { tracked: 0, candidate: 0 }
);
audit.check("TRACKED_ENV_FILE", trackedEnv.length === 0, trackedEnv, []);
audit.check("TRACKED_RAW_SOURCE", trackedRawSource.length === 0, trackedRawSource, []);
audit.check("TRACKED_NODE_MODULES", trackedNodeModules.length === 0, trackedNodeModules, []);
audit.check("TRACKED_BUILD", trackedBuild.length === 0, trackedBuild, []);
audit.check("PUBLIC_RAW_SOURCE", publicRawSource.length === 0, publicRawSource, []);
audit.check("BUILD_RAW_SOURCE", buildRawSource.length === 0, buildRawSource, []);
audit.check("TRACKED_SECRET", secretFindings.length === 0, secretFindings, []);
audit.check("DOWNLOAD_CREDENTIAL_FIELD", credentialFields.length === 0, credentialFields, []);
audit.check("MALFORMED_PUBLIC_DOWNLOAD", malformedDownloads.length === 0, malformedDownloads, []);
audit.check("PUBLIC_FIELD_WHITELIST", publicFieldPolicy, publicFieldPolicy, true);
audit.check("SAFE_DOWNLOAD_PROJECTION", safeDownloadProjection, safeDownloadProjection, true);
audit.check("SECURITY_IGNORE_RULES", missingIgnoreRules.length === 0, missingIgnoreRules, []);

audit.finish({
  trackedSecretCount: secretFindings.length,
  trackedRawSourceCount: trackedRawSource.length,
  trackedEnvCount: trackedEnv.length,
  trackedNodeModulesCount: trackedNodeModules.length,
  trackedBuildCount: trackedBuild.length,
  publicRawSourceCount: publicRawSource.length,
  buildRawSourceCount: buildRawSource.length,
  downloadCredentialFieldCount: credentialFields.length,
  securityReport: relative(PROJECT_ROOT, reportPath).replace(/\\/gu, "/"),
});
