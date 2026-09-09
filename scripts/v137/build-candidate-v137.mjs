#!/usr/bin/env node
/**
 * Assemble and build the candidate, and record exactly what went into it.
 *
 * The candidate tree was previously put together by hand, which is why its
 * manifest, its resume note and its QA findings each named a different code
 * commit and a different bundle: nothing tied the evidence to the build it came
 * from. This script does the assembly in one place and writes a fingerprint
 * covering the working tree it copied, the generated data it carried, and the
 * bundle that came out, so a later reading of a screenshot can be matched to
 * the build that produced it.
 *
 * It never touches the repository's own public/data. The candidate lives under
 * .verify/candidate and its data comes from a staging tree built by the ETL.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const CANDIDATE = resolve(ROOT, opt("--candidate", ".verify/candidate"));
const DATA_SOURCE = resolve(ROOT, opt("--data", ".staging/candidate/public/data/vietnam/v2"));
const SKIP_BUILD = argv.includes("--no-build");

/** Everything the app is built from. node_modules is left where it already is. */
const COPY = [
  "src",
  "config",
  "tools",
  "scripts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];

const EXCLUDED_PUBLIC = new Set(["data"]);

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/**
 * Mirror a directory.
 *
 * fs.cpSync crashes the Node process on this tree (an access violation part way
 * through src/), so Windows uses robocopy - which is what it is for - and every
 * other platform gets an explicit walk. Neither follows a link out of the tree.
 */
function mirrorDirectory(from, to) {
  if (process.platform === "win32") {
    const result = spawnSync(
      "robocopy",
      [from, to, "/MIR", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/R:1", "/W:1", "/XJ"],
      { encoding: "utf8" }
    );
    // Robocopy exit codes below 8 are success; 8 and above are real failures.
    if ((result.status ?? 16) >= 8) {
      throw new Error(`ROBOCOPY_FAILED ${result.status}: ${from} -> ${to} :: ${(result.stdout || "") + (result.stderr || "")}`);
    }
    return;
  }
  rmSync(to, { recursive: true, force: true });
  const walk = (sourceDir, targetDir) => {
    mkdirSync(targetDir, { recursive: true });
    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
      const source = join(sourceDir, entry.name);
      const target = join(targetDir, entry.name);
      if (entry.isDirectory()) walk(source, target);
      else if (entry.isFile()) copyFileSync(source, target);
    }
  };
  walk(from, to);
}

function copyEntry(from, to) {
  if (statSync(from).isDirectory()) {
    mirrorDirectory(from, to);
    return;
  }
  mkdirSync(resolve(to, ".."), { recursive: true });
  copyFileSync(from, to);
}

function fileDigests(root, { skip = () => false } = {}) {
  const digests = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const full = join(dir, entry.name);
      const rel = relative(root, full).split(sep).join("/");
      if (skip(rel, entry)) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) digests.set(rel, sha256(readFileSync(full)));
    }
  };
  walk(root);
  return digests;
}

function treeFingerprint(digests) {
  const hash = createHash("sha256");
  for (const key of [...digests.keys()].sort()) {
    hash.update(key);
    hash.update(digests.get(key));
  }
  return hash.digest("hex");
}

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function main() {
  if (!existsSync(DATA_SOURCE)) {
    throw new Error(`CANDIDATE_DATA_NOT_BUILT: ${DATA_SOURCE}`);
  }
  mkdirSync(CANDIDATE, { recursive: true });

  for (const entry of COPY) {
    const from = resolve(ROOT, entry);
    if (!existsSync(from)) continue;
    copyEntry(from, resolve(CANDIDATE, entry));
  }

  // public/, but the data tree comes from staging rather than from the repo.
  const publicTo = resolve(CANDIDATE, "public");
  rmSync(publicTo, { recursive: true, force: true });
  mkdirSync(publicTo, { recursive: true });
  for (const entry of readdirSync(resolve(ROOT, "public"), { withFileTypes: true })) {
    if (EXCLUDED_PUBLIC.has(entry.name)) continue;
    copyEntry(resolve(ROOT, "public", entry.name), join(publicTo, entry.name));
  }
  // Everything else the app fetches from public/data. Excluding the whole
  // directory dropped public/data/world-countries.geojson from every candidate,
  // so the map's world outline requested a file that was not there, the static
  // server answered with index.html, and MapLibre logged a parse error on every
  // run - which no CDP audit was reading.
  for (const entry of readdirSync(resolve(ROOT, "public/data"), { withFileTypes: true })) {
    if (entry.name === "vietnam") continue;
    copyEntry(resolve(ROOT, "public/data", entry.name), join(publicTo, "data", entry.name));
  }
  // v1 stays as the repository ships it: the ETL reads it as the previous
  // projection, and the app never fetches it.
  mirrorDirectory(resolve(ROOT, "public/data/vietnam/v1"), join(publicTo, "data/vietnam/v1"));
  mirrorDirectory(DATA_SOURCE, join(publicTo, "data/vietnam/v2"));

  const sourceDigests = fileDigests(resolve(CANDIDATE, "src"));
  const dataDigests = fileDigests(join(publicTo, "data/vietnam/v2"));

  let bundle = null;
  if (!SKIP_BUILD) {
    rmSync(resolve(CANDIDATE, "build"), { recursive: true, force: true });
    // Call the CLI's entry script with this Node rather than going through
    // npx.cmd, which spawnSync cannot launch without a shell on Windows.
    const reactScripts = resolve(CANDIDATE, "node_modules/react-scripts/bin/react-scripts.js");
    if (!existsSync(reactScripts)) {
      throw new Error(`REACT_SCRIPTS_MISSING: ${reactScripts}`);
    }
    execFileSync(process.execPath, [reactScripts, "build"], {
      cwd: CANDIDATE,
      stdio: "inherit",
      env: { ...process.env, CI: "", GENERATE_SOURCEMAP: "false", INLINE_RUNTIME_CHUNK: "false" },
    });
    const jsDir = resolve(CANDIDATE, "build/static/js");
    const mainFile = readdirSync(jsDir).find((name) => /^main\.[0-9a-f]+\.js$/u.test(name));
    if (mainFile) {
      bundle = { file: `static/js/${mainFile}`, sha256: sha256(readFileSync(join(jsDir, mainFile))) };
    }
  }

  const fingerprint = {
    schema: "nigt-candidate-fingerprint-1",
    generatedAt: new Date().toISOString(),
    candidateRoot: relative(ROOT, CANDIDATE).split(sep).join("/"),
    dataSource: relative(ROOT, DATA_SOURCE).split(sep).join("/"),
    code: {
      commit: git("rev-parse", "HEAD"),
      branch: git("rev-parse", "--abbrev-ref", "HEAD"),
      dirty: Boolean(git("status", "--porcelain")),
      dirtyPaths: git("status", "--porcelain")
        .split("\n")
        .map((line) => line.slice(3).trim())
        .filter(Boolean)
        .sort(),
      srcTreeSha256: treeFingerprint(sourceDigests),
      srcFileCount: sourceDigests.size,
    },
    data: {
      fileCount: dataDigests.size,
      treeSha256: treeFingerprint(dataDigests),
      manifestSha256: dataDigests.get("manifest.json") || null,
      mapIndexSha256: dataDigests.get("map-index.json") || null,
    },
    appBundle: bundle,
  };
  const outPath = resolve(ROOT, "reports/final-data-integration/CANDIDATE_FINGERPRINT_V137.json");
  mkdirSync(resolve(ROOT, "reports/final-data-integration"), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(fingerprint, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(fingerprint, null, 2));
}

main();
