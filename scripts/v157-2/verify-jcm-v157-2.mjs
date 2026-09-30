#!/usr/bin/env node
/**
 * Does each JCM project's province list come from its own page?
 *
 * The handed-over table (map12/jcm-projects.json) names provinces per project. This
 * re-derives that list from the text quoted off each project's page
 * (map12/jcm-location-evidence-v157-2.json) and compares the two, so a code that no
 * page supports cannot survive into the map.
 *
 * A province is counted only where the page prints its name. A district, a commune, an
 * industrial park or a company name is never resolved to the province that contains it
 * - the page has to say it.
 *
 * Writes:
 *   tools/etl/countries/vnm/map12/jcm-projects.json   (verified, when --write)
 *   reports/v157-2/jcm-verification-v157-2.json       (always)
 *
 * Usage: node scripts/v157-2/verify-jcm-v157-2.mjs [--write]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const DATA = resolve(ROOT, "public/data/vietnam/v2");
const ETL = resolve(ROOT, "tools/etl/countries/vnm/map12");
const WRITE = process.argv.includes("--write");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/**
 * The 63 provinces as the boundary asset names them: code <-> normalised name.
 *
 * Separators become "|" so the text keeps the boundary between a name and what
 * follows it: "Ho Chi Minh City / Ward 12" is a city then an address, while
 * "Thu Dau Mot City, Phu Tho Ward" ends in a ward.
 */
const normalize = (value) =>
  String(value || "")
    .replace(/[,;:/[\]()]+/gu, " | ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/đ/giu, "d")
    .toLowerCase()
    .replace(/[^a-z0-9|]+/gu, " ")
    .replace(/\s*\|\s*/gu, " | ")
    .trim();

const provinces63 = readJson(resolve(DATA, "geometry/vnm-adm1-63.geojson")).features.map(
  (feature) => ({
    code: String(feature.properties.adm1Code),
    name: String(feature.properties.name),
    key: normalize(feature.properties.name),
  })
);

/**
 * Spellings the JCM pages use that the boundary asset writes differently. Each one is
 * the same place under another romanisation - never a guess about which province a
 * district belongs to.
 */
const PAGE_SPELLINGS_V157_2 = {
  hanoi: "VN-HN",
  "ha noi": "VN-HN",
  "hanoi city": "VN-HN",
  "ho chi minh city": "VN-SG",
  "ho chi minh": "VN-SG",
  hcmc: "VN-SG",
  "da nang city": "VN-DN",
  "da nang": "VN-DN",
  "can tho city": "VN-CT",
  "can tho": "VN-CT",
  "hai phong": "VN-HP",
  "ba ria vung tau": "VN-43",
  "ba ria-vung tau": "VN-43",
  "dak lak": "VN-33",
  "dak nong": "VN-72",
  "thua thien hue": "VN-26",
  "khanh hoa": "VN-34",
};

const codeByKey = new Map(provinces63.map((row) => [row.key, row.code]));
for (const [spelling, code] of Object.entries(PAGE_SPELLINGS_V157_2)) {
  codeByKey.set(normalize(spelling), code);
}
const nameByCode = new Map(provinces63.map((row) => [row.code, row.name]));

/**
 * A place name that the next word turns into something smaller than a province:
 * "Phu Tho Ward" is a ward, "[Ho Chi Minh City Operations]" is a branch of the
 * operator. The province field of another project may still name them.
 */
const NOT_A_PROVINCE_AFTER_V157_2 = /^(ward|commune|operations|street|road|park|zone)\b/u;
/** A span already read, filled so the words around it do not run together. */
const CONSUMED_V157_2 = (length) => "x".repeat(length);

/** Every province the text names, longest spelling first so "Ba Ria" never wins. */
function provincesIn(text) {
  const haystack = ` ${normalize(text)} `;
  const found = new Map();
  const spellings = [...codeByKey.entries()].sort(
    (left, right) => right[0].length - left[0].length
  );
  let remaining = haystack;
  for (const [key, code] of spellings) {
    const needle = ` ${key} `;
    let at = remaining.indexOf(needle);
    while (at >= 0) {
      const after = remaining.slice(at + needle.length).trimStart();
      if (NOT_A_PROVINCE_AFTER_V157_2.test(after)) {
        remaining = `${remaining.slice(0, at + 1)}${CONSUMED_V157_2(key.length)}${remaining.slice(at + 1 + key.length)}`;
        at = remaining.indexOf(needle);
        continue;
      }
      found.set(code, key);
      remaining = `${remaining.slice(0, at + 1)}${CONSUMED_V157_2(key.length)}${remaining.slice(at + 1 + key.length)}`;
      at = remaining.indexOf(needle);
    }
  }
  return found;
}

const evidence = readJson(resolve(ETL, "jcm-location-evidence-v157-2.json"));
const table = readJson(resolve(ETL, "jcm-projects.json"));
const evidenceById = new Map(evidence.projects.map((row) => [row.id, row]));

const report = {
  schema: "jcm-verification-v157-2",
  generatedAt: new Date().toISOString(),
  evidence: "tools/etl/countries/vnm/map12/jcm-location-evidence-v157-2.json",
  projects: [],
  removedCodes: [],
  addedCodes: [],
  projectsWithoutEvidence: [],
};

const verified = table.projects.map((project) => {
  const source = evidenceById.get(project.id);
  if (!source) {
    report.projectsWithoutEvidence.push(project.id);
    return { ...project, provinces63: [], status: "no-evidence" };
  }
  // The page's province field is the claim; the address is read only when it names
  // none, so a district or a ward never stands in for a province.
  const fromProvinceField = provincesIn(source.province);
  const stated = fromProvinceField.size > 0 ? fromProvinceField : provincesIn(source.city);
  const claimed = new Set(project.provinces63 || []);
  const supported = [...claimed].filter((code) => stated.has(code));
  const unsupported = [...claimed].filter((code) => !stated.has(code));
  const missed = [...stated.keys()].filter((code) => !claimed.has(code));

  unsupported.forEach((code) =>
    report.removedCodes.push({ id: project.id, code, name: nameByCode.get(code) ?? code })
  );
  missed.forEach((code) =>
    report.addedCodes.push({ id: project.id, code, name: nameByCode.get(code) ?? code, spelling: stated.get(code) })
  );

  const codes = [...stated.keys()].sort();
  report.projects.push({
    id: project.id,
    claimed: [...claimed].sort(),
    verified: codes,
    unsupported,
    added: missed,
    statedAs: source.statedAs ?? "project site",
    sourceUrl: source.sourceUrl,
  });

  return {
    ...project,
    provinces63: codes,
    locationText: [source.province, source.city].filter(Boolean).join(" | "),
    locationStatedAs: source.statedAs ?? "project site",
    sourceUrl: source.sourceUrl,
    status: codes.length ? "province-verified" : "no-province-stated",
    verifiedAt: evidence.retrievedAt,
  };
});

report.projectCount = verified.length;
report.withProvince = verified.filter((row) => row.provinces63.length > 0).length;
report.withoutProvince = verified.filter((row) => row.provinces63.length === 0).map((row) => row.id);
report.headquartersOnly = verified.filter((row) => row.locationStatedAs === "headquarters").map((row) => row.id);

mkdirSync(resolve(ROOT, "reports/v157-2"), { recursive: true });
writeFileSync(
  resolve(ROOT, "reports/v157-2/jcm-verification-v157-2.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

if (WRITE) {
  const next = {
    ...table,
    verifiedAgainst: "each project's own page (map12/jcm-location-evidence-v157-2.json)",
    verifiedAt: evidence.retrievedAt,
    projects: verified,
  };
  writeFileSync(resolve(ETL, "jcm-projects.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    schema: report.schema,
    projects: report.projectCount,
    withProvince: report.withProvince,
    withoutProvince: report.withoutProvince,
    removed: report.removedCodes.length,
    added: report.addedCodes.length,
    headquartersOnly: report.headquartersOnly,
    wrote: WRITE,
  })}\n`
);
