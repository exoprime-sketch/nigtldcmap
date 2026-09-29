// Dataset directory: one committed file that says, per dataset, when its
// download files last changed. It is generated explicitly and committed with
// the data, so a build reads it from the source tree and never asks git.
//
//   node scripts/v150-1/dataset-directory-v150-1.mjs build    # regenerate + commit
//   node scripts/v150-1/dataset-directory-v150-1.mjs verify   # prebuild / gate
//   [--country <iso3>] [--out <path>]  # V158: another country's tree; --out
//                                         redirects the public file only, for
//                                         a byte-identity check that must not
//                                         touch the committed tree
//
// build: `updatedAt` is the author date of the last commit that changed a
// dataset's download files (git history present), else the previously
// committed value, else the data snapshot time in manifest.json - the V149
// meaning, unchanged. A date is never the build time.
// verify: without git, checks that the committed directory names every
// catalogue dataset, that each recorded file SHA-256 equals the file on disk,
// that fingerprints match, and that the src copy the app bundles equals the
// public file. Any drift fails with the command to run.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative as relativePath, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveDataRootV158, resolveCountryIso3V158, DEFAULT_COUNTRY_ISO3_V158 } from "../v158/country-context-v158.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// V158: the published tree comes from the country registry (--country vnm by default).
const DATA = resolveDataRootV158({ root: ROOT });
const COUNTRY_ISO3 = resolveCountryIso3V158({});
const IS_DEFAULT_COUNTRY = COUNTRY_ISO3 === DEFAULT_COUNTRY_ISO3_V158;
// A pack/download URL is always /data/<slug>/v2/...; only Viet Nam's own
// bundle imports a src/ copy (CRA cannot import from public/).
const DATA_URL_PREFIX = /^\/data\/[^/]+\/v2\//u;
const outOverrideIndex = process.argv.indexOf("--out");
const OUT_OVERRIDE = outOverrideIndex < 0 ? null : resolve(ROOT, process.argv[outOverrideIndex + 1]);
const PUBLIC_FILE = OUT_OVERRIDE || resolve(DATA, "dataset-directory.json");
const SRC_FILE = resolve(ROOT, "src/data/datasetDirectoryV149.json");
const DOWNLOADS_GIT_PATH = relativePath(ROOT, resolve(DATA, "downloads")).split(sep).join("/");
const REGENERATE = "npm run build:dataset-directory:v150 실행 후 커밋";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

function currentItems() {
  const catalog = readJson(resolve(DATA, "catalog.json")).elements;
  const index = readJson(resolve(DATA, "map-index.json"));
  const mapIds = new Set(index.layers.filter((layer) => layer.enabled !== false).map((layer) => layer.elementId));
  return catalog.map((item) => {
    const files = (item.downloadAssets || []).map((asset) => {
      const relative = String(asset.url || "").replace(DATA_URL_PREFIX, "");
      const path = resolve(DATA, relative);
      return { path: relative, sha256: existsSync(path) ? sha256(readFileSync(path)) : null };
    });
    // Same fingerprint rule as V149: the catalogue's asset SHA list.
    const fingerprint = sha256(JSON.stringify(item.downloadAssets?.map((asset) => asset.sha256) || item));
    return { elementId: item.elementId, map: mapIds.has(item.elementId), fingerprint, files };
  });
}

function gitDates() {
  const dates = new Map();
  let history = "";
  try {
    history = execFileSync("git", ["log", "--format=@%aI", "--name-only", "--", DOWNLOADS_GIT_PATH], { cwd: ROOT, encoding: "utf8", maxBuffer: 20e6 });
  } catch {
    return { dates, available: false };
  }
  let date = null;
  for (const line of history.split(/\r?\n/u)) {
    if (line.startsWith("@")) date = line.slice(1);
    const id = line.match(/downloads\/([a-e]-\d{3})\.(?:json|csv)$/iu)?.[1]?.toUpperCase();
    if (id && date && !dates.has(id)) dates.set(id, date);
  }
  return { dates, available: true };
}

function build() {
  const manifest = readJson(resolve(DATA, "manifest.json"));
  const previous = existsSync(PUBLIC_FILE) ? readJson(PUBLIC_FILE).items || [] : [];
  const { dates, available } = gitDates();
  let sourceCommit = null;
  try { sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { sourceCommit = null; }
  const items = currentItems().map((item) => {
    const before = previous.find((row) => row.elementId === item.elementId);
    const updatedAt = dates.get(item.elementId) || before?.updatedAt || manifest.generatedAt || null;
    return { elementId: item.elementId, updatedAt, map: item.map, fingerprint: item.fingerprint, files: item.files };
  });
  const directory = {
    schema: "nigt-dataset-directory-v150-1",
    generatedAt: new Date().toISOString(),
    sourceCommit,
    dateSource: available ? "git author date of the last change to each dataset's download files; manifest snapshot when a dataset has no history" : "previous directory / manifest snapshot (no git history available)",
    itemCount: items.length,
    items,
  };
  writeFileSync(PUBLIC_FILE, `${JSON.stringify(directory, null, 2)}\n`);
  if (IS_DEFAULT_COUNTRY && !OUT_OVERRIDE) {
    // The bundle imports a compact copy (CRA cannot import from public/). A
    // second country has no bundled copy - src/ stays Viet Nam-only.
    writeFileSync(SRC_FILE, `${JSON.stringify(items.map(({ elementId, updatedAt, map, fingerprint }) => ({ elementId, updatedAt, map, fingerprint })), null, 2)}\n`);
  }
  console.log(`dataset directory (${COUNTRY_ISO3}): ${items.length} items, ${items.filter((item) => item.map).length} map items, ${new Set(items.map((item) => item.updatedAt)).size} distinct dates, git ${available ? "history" : "unavailable"} -> ${PUBLIC_FILE}`);
  const integrityDataArg = relativePath(ROOT, DATA).split(sep).join("/");
  console.log(`정리: node scripts/generate-vietnam-asset-integrity-v133.mjs ${IS_DEFAULT_COUNTRY ? "" : `--country ${COUNTRY_ISO3.toLowerCase()} `}--data ${integrityDataArg} 로 integrity를 갱신한 뒤 ${IS_DEFAULT_COUNTRY ? "두 파일을" : "파일을"} 함께 커밋`);
}

function verify() {
  const problems = [];
  if (!existsSync(PUBLIC_FILE)) problems.push(`missing ${PUBLIC_FILE}`);
  if (IS_DEFAULT_COUNTRY && !existsSync(SRC_FILE)) problems.push(`missing ${SRC_FILE}`);
  if (problems.length) return fail(problems);
  const directory = readJson(PUBLIC_FILE);
  const current = currentItems();
  const recorded = new Map((directory.items || []).map((item) => [item.elementId, item]));
  for (const item of current) {
    const row = recorded.get(item.elementId);
    if (!row) { problems.push(`${item.elementId}: not in directory`); continue; }
    if (row.fingerprint !== item.fingerprint) problems.push(`${item.elementId}: fingerprint differs (catalogue assets changed)`);
    if (row.map !== item.map) problems.push(`${item.elementId}: map flag differs`);
    if (!row.updatedAt) problems.push(`${item.elementId}: updatedAt missing`);
    const recordedFiles = new Map((row.files || []).map((file) => [file.path, file.sha256]));
    for (const file of item.files) {
      if (!recordedFiles.has(file.path)) problems.push(`${item.elementId}: ${file.path} not recorded`);
      else if (recordedFiles.get(file.path) !== file.sha256) problems.push(`${item.elementId}: ${file.path} SHA-256 differs from the committed file`);
    }
  }
  for (const id of recorded.keys()) if (!current.some((item) => item.elementId === id)) problems.push(`${id}: in directory but not in catalogue`);
  if (IS_DEFAULT_COUNTRY) {
    // Only Viet Nam has a bundled src/ copy to keep in sync.
    const srcCopy = readJson(SRC_FILE);
    const expectedSrc = JSON.stringify((directory.items || []).map(({ elementId, updatedAt, map, fingerprint }) => ({ elementId, updatedAt, map, fingerprint })));
    if (JSON.stringify(srcCopy) !== expectedSrc) problems.push("src/data/datasetDirectoryV149.json differs from public/data/vietnam/v2/dataset-directory.json");
  }
  if (problems.length) return fail(problems);
  console.log(`dataset directory verified: ${current.length} items, ${current.reduce((sum, item) => sum + item.files.length, 0)} files, generated ${directory.generatedAt} from ${directory.sourceCommit || "unknown commit"}`);
  return 0;
}

function fail(problems) {
  console.error(`dataset directory out of date (${problems.length}):`);
  for (const problem of problems.slice(0, 20)) console.error(`  - ${problem}`);
  if (problems.length > 20) console.error(`  … ${problems.length - 20} more`);
  console.error(REGENERATE);
  return 1;
}

const mode = process.argv[2];
if (mode === "build") build();
else if (mode === "verify") process.exitCode = verify();
else { console.error("usage: dataset-directory-v150-1.mjs build|verify"); process.exitCode = 2; }
