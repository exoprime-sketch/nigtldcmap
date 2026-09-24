#!/usr/bin/env node
/**
 * Which country's published tree a builder or an audit works on.
 *
 * The scripts used to hard-code `public/data/vietnam/v2`. A second country
 * cannot be built by editing every default, so the path comes from the registry
 * (`public/data/countries.json`) instead:
 *
 *   node scripts/v139/build-home-preview-v139.mjs --country bgd
 *
 * `--data <path>` still wins when it is given, because the refresh runbook
 * points the builders at a staging tree. `--country` defaults to `vnm`, so every
 * existing command line keeps its meaning.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DEFAULT_COUNTRY_ISO3_V158 = "VNM";

export function repoRootV158(importMetaDirname) {
  // scripts/<version>/file.mjs -> repository root
  return resolve(importMetaDirname, "../..");
}

export function countryRegistryV158(root) {
  const path = resolve(root, "public/data/countries.json");
  const document = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(document?.countries) || document.countries.length === 0) {
    throw new Error(`COUNTRY_REGISTRY_EMPTY: ${path}`);
  }
  return document;
}

export function countryEntryV158(root, countryIso3) {
  const iso3 = String(countryIso3 || DEFAULT_COUNTRY_ISO3_V158).trim().toUpperCase();
  const entry = countryRegistryV158(root).countries.find((row) => row.iso3 === iso3);
  if (!entry) throw new Error(`UNKNOWN_COUNTRY: ${iso3}`);
  return entry;
}

/** The published directory in the repository, e.g. `public/data/vietnam/v2`. */
export function countryPublicDirV158(root, countryIso3) {
  return `public${countryEntryV158(root, countryIso3).dataRoot}`;
}

/**
 * The data root a script should read and write.
 *
 * Precedence: `--data` (explicit path, used by the staging runbook) →
 * the country's registered root → Vietnam. `env` lets a caller keep an existing
 * environment override (`VIETNAM_DATA_ROOT`) working.
 */
export function resolveDataRootV158({
  root,
  argv = process.argv.slice(2),
  env = null,
  defaultCountry = DEFAULT_COUNTRY_ISO3_V158,
} = {}) {
  const option = (name) => {
    const index = argv.indexOf(name);
    return index < 0 ? null : argv[index + 1] ?? null;
  };
  const data = option("--data") || env || null;
  if (data) return resolve(root, data);
  const country = option("--country") || defaultCountry;
  return resolve(root, countryPublicDirV158(root, country));
}

/** The country a script is working on, for reports and log lines. */
export function resolveCountryIso3V158({
  argv = process.argv.slice(2),
  defaultCountry = DEFAULT_COUNTRY_ISO3_V158,
} = {}) {
  const index = argv.indexOf("--country");
  const value = index < 0 ? null : argv[index + 1] ?? null;
  return String(value || defaultCountry).trim().toUpperCase();
}
