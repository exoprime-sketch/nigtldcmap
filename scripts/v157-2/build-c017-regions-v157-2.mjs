#!/usr/bin/env node
/**
 * C-017's three price regions — the criteria the circular actually gives, in order.
 *
 * REVISED 2026-09-30 16:15 (사용자 정정): the "6대 권역을 둘씩 묶는" rule this file
 * used until now is withdrawn. It filled six border provinces by a rule the price
 * circular never states. The replacement follows the circular's own text, in the
 * order it can actually be read:
 *
 *   (1) Thông tư 09/2025/TT-BCT Điều 3 khoản 7-8 (quoted below, in full) is applied
 *       literally. Read closely, khoản 8 does not enumerate provinces itself - it
 *       names three criteria a miền boundary must follow (socio-economic zoning,
 *       the National Power Development Plan, and provincial-merger decisions) and
 *       gives no appendix or crosswalk. So step (1) resolves a province only when
 *       the quoted text names it outright; it names none by province, so it
 *       resolves none directly - this is recorded, not glossed over.
 *   (2) Every province therefore falls to the second criterion the circular itself
 *       cites: the national power grid's own miền split, which the industry (and
 *       the pre-2025 EVN corporation boundaries) has used exactly this way for
 *       decades - miền Bắc = EVNNPC + EVNHANOI, miền Trung = EVNCPC,
 *       miền Nam = EVNSPC + EVNHCMC. This reuses the EVN jurisdiction table
 *       already verified against its own official pages (evn-jurisdiction.json),
 *       not a fresh assumption.
 *
 * The public panel states which of the two bases decided a given province:
 * "가격 규정의 권역 기준" if the circular's text named it, "EVN 관할 기준" otherwise.
 * In practice every one of the 63 provinces is decided by (2), because (1) never
 * names one - that fact is itself worth showing on screen, not hiding.
 *
 * Usage: node scripts/v157-2/build-c017-regions-v157-2.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const ETL = resolve(ROOT, "tools/etl/countries/vnm");
const CHECK_ONLY = process.argv.includes("--check");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** miền ← EVN corporation, exactly as the user specified (2026-09-30 16:15). */
const PRICE_REGION_FROM_CORPORATION_V157_2 = {
  evnnpc: "north",
  evnhanoi: "north",
  evncpc: "central",
  evnspc: "south",
  evnhcmc: "south",
};

const PUBLIC_BASIS_LABEL_V157_2 = {
  circular: "가격 규정의 권역 기준",
  evn: "EVN 관할 기준",
};

const evn = readJson(resolve(ETL, "evn-jurisdiction.json"));
const table = readJson(resolve(ETL, "map12/c017-price-regions.json"));
const crosswalk34 = readJson(resolve(ROOT, "reports/v138/map-targets-build-v138.json")).crosswalk34;

const corporationByProvince = new Map(evn.provinces63.map((row) => [row.adm1Code, row.corporation]));

/**
 * Step (1): does the circular's own quoted text name this province directly?
 * It does not - Điều 3 khoản 7-8 cites three criteria documents, no appendix.
 * The function exists so that if a future amendment DOES enumerate provinces,
 * this is the one place to add that reading; today it always returns null.
 */
function fromCircularTextV157_2(_adm1Code) {
  return null;
}

const changes = [];
const provinces63 = table.provinces63.map((row) => {
  const fromText = fromCircularTextV157_2(row.adm1Code);
  const corporation = corporationByProvince.get(row.adm1Code);
  if (!corporation) throw new Error(`EVN_CORPORATION_MISSING: ${row.adm1Code} ${row.name}`);
  const fromEvn = PRICE_REGION_FROM_CORPORATION_V157_2[corporation];
  if (!fromEvn) throw new Error(`UNKNOWN_CORPORATION: ${corporation}`);
  const region = fromText ?? fromEvn;
  const basis = fromText ? "circular" : "evn";
  if (row.region !== region) {
    changes.push({ adm1Code: row.adm1Code, name: row.name, from: row.region ?? null, to: region, basis });
  }
  // regionByZones / regionByEvnPre2025 were the withdrawn six-region-grouping and an
  // unverified pre-2025 approximation; dropped in favour of the sourced fields below.
  return {
    adm1Code: row.adm1Code,
    name: row.name,
    region,
    regionBasis: basis,
    regionBasisLabel: PUBLIC_BASIS_LABEL_V157_2[basis],
    corporation,
    status: "decided",
  };
});

const counts = { north: 0, central: 0, south: 0 };
provinces63.forEach((row) => {
  counts[row.region] += 1;
});

// The 34-unit view is derived from the fresh 63-province assignment, never asserted.
const regionByCode = new Map(provinces63.map((row) => [row.adm1Code, row.region]));
const units34 = crosswalk34.map((unit) => {
  const regions = [...new Set(unit.memberAdm1Codes.map((code) => regionByCode.get(code)))];
  return { unitCode: unit.key, name: unit.region, regions, status: regions.length > 1 ? "mixed" : "single" };
});
const mixedUnits34 = units34.filter((unit) => unit.status === "mixed");

const next = {
  schema: table.schema,
  retrievedAt: table.retrievedAt,
  priceDecisions: table.priceDecisions,
  regionDefinition: table.regionDefinition,
  offshoreAreas: table.offshoreAreas,
  ninhThuanSpecialCase: table.ninhThuanSpecialCase,
  unconfirmed: table.unconfirmed,
  decision: table.decision,
  regionGrouping: {
    basis: "circular-text-then-evn-jurisdiction",
    circularQuote: table.regionDefinition?.quote ?? null,
    circularReadingNote:
      "Điều 3 khoản 8은 미엔 경계를 정할 때 따를 기준 3가지(사회경제 권역 구분·전력개발계획·성·시 통합 결정)를 지정할 뿐, 성을 직접 나열하지 않는다(원문 확인, 부록·대응표 없음). 그래서 63개 성 전부가 2단계(EVN 관할 기준)로 결정된다.",
    fallback: "EVN jurisdiction (verified, evn-jurisdiction.json): 북=NPC+HANOI, 중=CPC, 남=SPC+HCMC",
    publicNote: "이 성의 권역은 {basisLabel}으로 정해졌습니다.",
    sourceUrl: table.regionDefinition?.url ?? null,
    reason:
      "가격 규정 원문이 성을 나열하지 않아, 원문이 인용하는 전력계통 권역(EVN 관할)으로 정한다(사용자 결정 2026-09-30 16:15 — 6대 권역 묶음 규칙 철회).",
    withdrawn: {
      rule: "6대 권역을 둘씩 묶는 방식(2026-09-30 최초 결정)",
      withdrawnAt: "2026-09-30 16:15",
      reason: "가격 규정과 무관한 별도 문서(국가 종합계획)에 의존해 근거가 약함",
    },
  },
  provinces63,
  provinces63RegionCounts: counts,
  units34,
  mixedUnits34,
  generatedBy: "scripts/v157-2/build-c017-regions-v157-2.mjs",
};

if (!CHECK_ONLY) {
  writeFileSync(resolve(ETL, "map12/c017-price-regions.json"), `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    schema: "c017-price-regions-v157-2",
    counts,
    total: provinces63.length,
    decidedByCircularText: provinces63.filter((row) => row.regionBasis === "circular").length,
    decidedByEvn: provinces63.filter((row) => row.regionBasis === "evn").length,
    changed: changes.length,
    changes,
    wrote: !CHECK_ONLY,
  })}\n`
);
