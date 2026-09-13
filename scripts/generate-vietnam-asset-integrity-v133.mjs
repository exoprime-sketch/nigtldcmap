#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const PUBLIC_ROOT = resolve(PROJECT_ROOT, "public");
// The tree to describe. It defaults to the published one; a staging tree can be
// named so its integrity file is complete before it is promoted. Writing this
// file only after promotion left the semantic and interpretation assets - 157 of
// them - undeclared in whatever was published in between.
const argv = process.argv.slice(2);
const dataOption = (() => {
  const index = argv.indexOf("--data");
  return index < 0 ? null : argv[index + 1];
})();
const V2_ROOT = resolve(PROJECT_ROOT, dataOption || "public/data/vietnam/v2");
const INTEGRITY_PATH = resolve(V2_ROOT, "asset-integrity.json");
const WORLD_COUNTRIES_PATH = resolve(PUBLIC_ROOT, "data/world-countries.geojson");
const REPORT_PATH = resolve(
  PROJECT_ROOT,
  "reports/v133/asset-integrity-generation-v133.json"
);

function walkFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  visit(root);
  return files;
}

/**
 * The URL this file will be served at once published.
 *
 * A staging tree lives outside public/, so a plain relative path produced
 * "/../.staging/..." and the integrity file described URLs no deployment would
 * ever request. The published prefix is what the manifest and the runtime use,
 * so it is what gets recorded whichever tree is being described.
 */
function publicUrl(path) {
  const fromData = relative(V2_ROOT, path);
  if (!fromData.startsWith("..")) {
    return `/data/vietnam/v2/${fromData.split(sep).join("/")}`;
  }
  return `/${relative(PUBLIC_ROOT, path).split(sep).join("/")}`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const paths = walkFiles(V2_ROOT)
  .filter((path) => resolve(path) !== INTEGRITY_PATH)
  .concat(WORLD_COUNTRIES_PATH)
  .sort((left, right) => publicUrl(left).localeCompare(publicUrl(right), "en"));

const assets = paths.map((path) => {
  const bytes = readFileSync(path);
  return {
    bytes: statSync(path).size,
    sha256: sha256(bytes),
    url: publicUrl(path),
  };
});

const integrity = {
  algorithm: "SHA-256",
  assetCount: assets.length,
  assets,
  schemaVersion: "v133",
};

mkdirSync(dirname(INTEGRITY_PATH), { recursive: true });
writeFileSync(INTEGRITY_PATH, `${JSON.stringify(integrity, null, 2)}\n`, "utf8");

const world = assets.find((asset) => asset.url === "/data/world-countries.geojson");
const summary = {
  schemaVersion: "v133",
  generator: "actual-public-asset-bytes",
  status: "PASS",
  assetCount: assets.length,
  output: relative(PROJECT_ROOT, INTEGRITY_PATH).split(sep).join("/"),
  worldCountries: world,
};
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ type: "summary", ...summary }));
