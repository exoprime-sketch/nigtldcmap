#!/usr/bin/env node
/**
 * The whole data pipeline, in the order its outputs depend on each other.
 *
 * Running these by hand is how public/data/vietnam/v2 came to be published with
 * 157 semantic and interpretation assets missing from asset-integrity.json: the
 * ETL writes that file before those generators have run, so it has to be
 * rewritten afterwards, and a recipe in a note does not enforce an order.
 *
 * Every step targets the same staging tree, so the promotion that follows moves
 * one consistent snapshot.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const STAGING = opt("--staging", ".staging/final");
const SOURCE_DIR = process.env.VIETNAM_SOURCE_DIR || opt("--source", "베트남데이터/file");
const DATA = `${STAGING}/public/data/vietnam/v2`;

const env = {
  ...process.env,
  PYTHONIOENCODING: "utf-8",
  VIETNAM_SOURCE_DIR: SOURCE_DIR,
  VIETNAM_STAGING_ROOT: STAGING,
  VIETNAM_DATA_ROOT: DATA,
};

/** [label, command, args] - each one reads what the previous one wrote. */
const STEPS = [
  ["etl", "python", ["-m", "tools.vietnam_etl.build_public_v2"]],
  ["semantic", "python", ["tools/vietnam_semantic/build_semantic_v125.py"]],
  ["interpretation", process.execPath, ["scripts/build-vietnam-interpretation-v129.mjs"]],
  ["temporal", process.execPath, ["scripts/build-public-temporal-contract-v135.mjs"]],
  // Last: it hashes everything the steps above produced.
  ["asset-integrity", process.execPath, [
    "scripts/generate-vietnam-asset-integrity-v133.mjs",
    "--data",
    DATA,
  ]],
];

// The ETL prints the only statement of promotionBlockers there is, and it was
// being read off a terminal and then lost. Keep each step's report beside the
// tree it describes, so a promotion decision can be checked afterwards.
const REPORTS = resolve(ROOT, "reports/final-data-integration/pipeline-v137");
mkdirSync(REPORTS, { recursive: true });
for (const [label, command, args] of STEPS) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const output = execFileSync(command, args, {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 64 * 1024 * 1024,
  });
  writeFileSync(resolve(REPORTS, `${label}.json`), output);
  process.stdout.write(`${label}: ok\n`);
}
process.stdout.write(`\nfinal data tree: ${DATA}\n`);
