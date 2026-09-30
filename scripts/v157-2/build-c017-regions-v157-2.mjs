#!/usr/bin/env node
/**
 * C-017's three price regions, derived from the six socio-economic regions.
 *
 * The electricity price framework writes its brackets per miền (north / central /
 * south) but no MOIT text lists which province sits in which miền. Rather than
 * guessing province by province, the three regions are folded out of the six regions
 * the National Master Plan defines - the grouping the reader is told about on screen:
 *
 *   북부 = 북부 산악·중산간 + 홍강 삼각주
 *   중부 = 북중부·중부 해안 + 중부 고원
 *   남부 = 동남부 + 메콩강 삼각주
 *
 * Six provinces had been left unassigned because a second, older grouping (EVN's
 * pre-2025 corporations) put them elsewhere; the rule above decides them, and the
 * screen says the grouping it used. Nothing here reads a value or splits one.
 *
 * Usage: node scripts/v157-2/build-c017-regions-v157-2.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const ETL = resolve(ROOT, "tools/etl/countries/vnm/map12");
const CHECK_ONLY = process.argv.includes("--check");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Which two of the six regions make up each price region. */
const PRICE_REGION_FROM_SIX_V157_2 = {
  north: ["northern-midlands-mountains", "red-river-delta"],
  central: ["north-central-central-coast", "central-highlands"],
  south: ["southeast", "mekong-river-delta"],
};

/** What the screen says about where the grouping comes from. */
const PUBLIC_BASIS_V157_2 =
  "국가 종합계획의 6대 권역을 둘씩 묶은 기준입니다(북부=북부 산악·중산간+홍강 삼각주, 중부=북중부·중부 해안+중부 고원, 남부=동남부+메콩강 삼각주).";

const six = readJson(resolve(ETL, "six-regions.json"));
const table = readJson(resolve(ETL, "c017-price-regions.json"));

const regionByProvince = new Map();
for (const [price, sixKeys] of Object.entries(PRICE_REGION_FROM_SIX_V157_2)) {
  for (const key of sixKeys) {
    const region = six.regions.find((row) => row.key === key);
    if (!region) throw new Error(`SIX_REGION_MISSING: ${key}`);
    for (const code of region.provinces63 ?? []) regionByProvince.set(code, price);
  }
}

const changes = [];
const provinces63 = table.provinces63.map((row) => {
  const region = regionByProvince.get(row.adm1Code) ?? null;
  if (!region) throw new Error(`PROVINCE_NOT_IN_SIX_REGIONS: ${row.adm1Code} ${row.name}`);
  if (row.region !== region) {
    changes.push({ adm1Code: row.adm1Code, name: row.name, from: row.region, to: region, was: row.status });
  }
  return { ...row, region, regionBasis: "six-region-grouping", status: "six-region-grouping" };
});

const counts = { north: 0, central: 0, south: 0 };
provinces63.forEach((row) => {
  counts[row.region] += 1;
});

const next = {
  ...table,
  regionGrouping: {
    basis: "six-region-grouping",
    rule: PRICE_REGION_FROM_SIX_V157_2,
    publicNote: PUBLIC_BASIS_V157_2,
    sourceOfSixRegions: six.definition63?.document ?? null,
    sourceUrl: six.definition63?.url ?? null,
    reason:
      "MOIT의 가격 문서가 miền별 성 목록을 싣지 않아, 성별 추정 대신 국가 종합계획의 6대 권역을 둘씩 묶어 정의한다(사용자 결정 2026-09-30).",
  },
  provinces63,
  provinces63RegionCounts: counts,
  generatedBy: "scripts/v157-2/build-c017-regions-v157-2.mjs",
};

if (!CHECK_ONLY) {
  writeFileSync(resolve(ETL, "c017-price-regions.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    schema: "c017-price-regions-v157-2",
    counts,
    total: provinces63.length,
    changed: changes.length,
    changes,
    wrote: !CHECK_ONLY,
  })}\n`
);
