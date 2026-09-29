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
import { resolveDataRootV158, resolveCountryIso3V158, countryEntryV158, DEFAULT_COUNTRY_ISO3_V158 } from "./v158/country-context-v158.mjs";

const argv = process.argv.slice(2);
const dataOption = (() => {
  const index = argv.indexOf("--data");
  return index < 0 ? null : argv[index + 1];
})();
// V158: --data still wins (the refresh runbook points at a staging tree);
// otherwise the country registry says where the tree is.
const V2_ROOT = resolveDataRootV158({
  root: PROJECT_ROOT,
  argv,
  env: dataOption,
});
const COUNTRY_ISO3 = resolveCountryIso3V158({ argv });
const IS_DEFAULT_COUNTRY = COUNTRY_ISO3 === DEFAULT_COUNTRY_ISO3_V158;
// The registry's own dataRoot, e.g. "/data/bgd/v2" - the published prefix for
// this country regardless of whether V2_ROOT above is the real public/ tree or
// a staging copy of it.
const PUBLISHED_DATA_PREFIX = countryEntryV158(PROJECT_ROOT, COUNTRY_ISO3).dataRoot.replace(/\/$/u, "");
const outOverrideIndex = argv.indexOf("--out");
const INTEGRITY_PATH = outOverrideIndex < 0 ? resolve(V2_ROOT, "asset-integrity.json") : resolve(PROJECT_ROOT, argv[outOverrideIndex + 1]);
const WORLD_COUNTRIES_PATH = resolve(PUBLIC_ROOT, "data/world-countries.geojson");
// A byte-identity/schema-diff check (--out) never touches the committed
// reports/v133 tree; a non-default country gets its own report file so it
// never overwrites Viet Nam's.
const REPORT_PATH =
  outOverrideIndex >= 0
    ? resolve(dirname(INTEGRITY_PATH), "asset-integrity-generation-v133.json")
    : resolve(PROJECT_ROOT, `reports/v133/asset-integrity-generation-v133${IS_DEFAULT_COUNTRY ? "" : `-${COUNTRY_ISO3.toLowerCase()}`}.json`);

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
    return `${PUBLISHED_DATA_PREFIX}/${fromData.split(sep).join("/")}`;
  }
  return `/${relative(PUBLIC_ROOT, path).split(sep).join("/")}`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Always exclude the tree's own asset-integrity.json, whether or not --out
// moved where a fresh one gets written (a byte-identity check must describe
// the tree exactly as build/verify see it, not add its own output as a file).
const NATURAL_INTEGRITY_PATH = resolve(V2_ROOT, "asset-integrity.json");
const paths = walkFiles(V2_ROOT)
  .filter((path) => resolve(path) !== INTEGRITY_PATH && resolve(path) !== NATURAL_INTEGRITY_PATH)
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
