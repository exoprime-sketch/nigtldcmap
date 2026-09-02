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
const V2_ROOT = resolve(PUBLIC_ROOT, "data/vietnam/v2");
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

function publicUrl(path) {
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
