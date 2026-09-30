#!/usr/bin/env node
/**
 * Extracts the cross-country series behind `countryCompare` (see
 * `build-country-compare-contract-v158.mjs`), so a detail page can compare a
 * comparable element without fetching every country's full data tree.
 *
 * The contract only states *that* two countries can be compared and on which
 * indicator; the actual points live in each country's packs
 * (`public/data/<country>/v2/packs/…`, the same gzip-base64 envelope format
 * Vietnam's runtime reads - see `src/data/vietnam/vietnamDataLoaderV124.ts`).
 * This script decodes those packs once, per comparable element and per
 * registry country that has a published data tree, and writes the flattened
 * result so the browser can fetch one small JSON file instead.
 *
 * Nothing here invents a value: an indicator a country never published stays
 * absent (`present: false`), and a country whose stated unit differs is kept
 * apart rather than plotted on the same axis - the same discipline the
 * contract builder and `CountryCompareBlockV158` already follow.
 *
 *   node scripts/v158/build-country-compare-series-v158.mjs [--check]
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { countryRegistryV158 } from "./country-context-v158.mjs";

/** Same rule as sameUnitV158 (CountryCompareBlockV158): spacing and superscript powers only. */
const sameUnit = (left, right) => {
  const fold = (unit) => String(unit ?? "").trim().replace(/²/gu, "2").replace(/³/gu, "3").replace(/ +/gu, " ");
  return fold(left) === fold(right);
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../..");
const CHECK_ONLY = process.argv.slice(2).includes("--check");

const REGISTRY_PATH = resolve(ROOT, "public/data/countries.json");
const CONTRACT_RELATIVE_PATH = "src/data/visualization/publicVisualizationContractV153.json";
const CONTRACT_PATH = resolve(ROOT, CONTRACT_RELATIVE_PATH);
const OUTPUT_PATH = resolve(ROOT, "public/data/compare/country-compare-v158.json");
const REPORT_PATH = resolve(ROOT, "reports/v158/country-compare-review-v158.md");

const STATUS_ORDER = ["missing-in-country", "unit-mismatch", "latest-each", "common-year"];

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** A country's published packs, decoded once per pack and kept for reuse. */
function openCountryTree(country) {
  const publicDir = resolve(ROOT, `public${country.dataRoot}`);
  const bundleIndexPath = resolve(publicDir, "packs/bundle-index-v124.json");
  if (!existsSync(bundleIndexPath)) return null;
  const index = readJson(bundleIndexPath);
  const shardCache = new Map();

  function shardFor(packUrl) {
    const packPath = resolve(ROOT, `public${packUrl}`);
    if (!existsSync(packPath)) return null;
    if (!shardCache.has(packPath)) {
      const envelope = readJson(packPath);
      if (!Array.isArray(envelope.payloadChunks) || envelope.payloadChunks.length === 0) {
        throw new Error(`INVALID_ENVELOPE: ${packPath}`);
      }
      const compressed = Buffer.from(envelope.payloadChunks.join(""), "base64");
      const compressedHash = createHash("sha256").update(compressed).digest("hex");
      if (compressedHash !== envelope.compressedSha256) {
        throw new Error(`COMPRESSED_HASH_MISMATCH: ${packPath}`);
      }
      const content = gunzipSync(compressed);
      const contentHash = createHash("sha256").update(content).digest("hex");
      if (contentHash !== envelope.contentSha256) {
        throw new Error(`CONTENT_HASH_MISMATCH: ${packPath}`);
      }
      shardCache.set(packPath, JSON.parse(content.toString("utf8")));
    }
    return shardCache.get(packPath);
  }

  return {
    iso3: country.iso3,
    element(elementId) {
      const entry = index.elements?.[elementId];
      if (!entry) return null;
      const shard = shardFor(entry.packUrl);
      return shard?.elements?.[elementId] || null;
    },
  };
}

/**
 * One indicator's series out of an element payload - the same
 * `meta.indicators` / `observations.records` shape every country's packs use.
 * Returns null when the country never published this indicator at all.
 */
function indicatorSeries(payload, indicatorId) {
  if (!payload) return null;
  const indicator = (payload.meta?.indicators || []).find(
    (row) => String(row.indicatorId) === indicatorId
  );
  if (!indicator) return null;
  const points = (payload.observations?.records || [])
    .filter((row) => String(row.indicatorId) === indicatorId)
    .map((row) => ({ year: Number(row.year), value: row.value }))
    .filter(
      (point) =>
        Number.isFinite(point.year) &&
        typeof point.value === "number" &&
        Number.isFinite(point.value)
    )
    .sort((left, right) => left.year - right.year);
  // A year the source repeats would otherwise draw twice; keep the first row.
  // The published records are already one row per year, so this guards a
  // delivery defect rather than something expected to fire.
  const seen = new Set();
  const uniquePoints = [];
  for (const point of points) {
    if (seen.has(point.year)) continue;
    seen.add(point.year);
    uniquePoints.push(point);
  }
  return {
    unit: String(indicator.unit ?? "").trim(),
    labelKo: String(indicator.labelKo ?? "").trim() || null,
    sourceOrg:
      String(indicator.sourceOrg ?? indicator.provenance?.sourceOrg ?? "").trim() || null,
    points: uniquePoints,
  };
}

/** How one pair of countries compares on this element. */
function pairStatus(countryA, countryB) {
  const [left, right] = [countryA, countryB].sort((a, b) =>
    a.countryIso3.localeCompare(b.countryIso3)
  );
  if (!left.present || !right.present) {
    return { countries: [left.countryIso3, right.countryIso3], status: "missing-in-country" };
  }
  if (!sameUnit(left.unit, right.unit)) {
    return { countries: [left.countryIso3, right.countryIso3], status: "unit-mismatch" };
  }
  const leftYears = new Set(left.points.map((point) => point.year));
  const commonYears = right.points
    .map((point) => point.year)
    .filter((year) => leftYears.has(year));
  if (commonYears.length > 0) {
    return {
      countries: [left.countryIso3, right.countryIso3],
      status: "common-year",
      commonYear: Math.max(...commonYears),
    };
  }
  return { countries: [left.countryIso3, right.countryIso3], status: "latest-each" };
}

function worstStatus(pairs) {
  for (const status of STATUS_ORDER) {
    if (pairs.some((pair) => pair.status === status)) return status;
  }
  return pairs[0]?.status ?? "missing-in-country";
}

/**
 * Admin-1 place names, used only to flag a compare key that names one place.
 * Every registry country's own level-1 boundary (`adm.level1.asset`) is read;
 * no country is named here.
 */
function placeNameGazetteer() {
  const entries = [];
  for (const country of countryRegistryV158(ROOT).countries) {
    const asset = country.adm?.level1?.asset;
    if (!asset) continue;
    try {
      const geometry = readJson(resolve(ROOT, `public${asset}`));
      for (const feature of geometry.features || []) {
        const props = feature.properties || {};
        const latin = [props.name, props.nameEn, ...(Array.isArray(props.memberNames) ? props.memberNames : [])].filter(Boolean);
        for (const name of new Set(latin)) {
          const idToken = String(name === props.name && props.normalizedName ? props.normalizedName : name)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_");
          entries.push({ display: name, idToken, textToken: name });
        }
        if (props.nameKo) entries.push({ display: props.nameKo, idToken: null, textToken: props.nameKo });
      }
    } catch {
      // Geometry not published yet: the gazetteer just stays smaller.
    }
  }
  // A short token matches too much by accident to be worth carrying.
  return entries.filter((entry) => (entry.idToken?.length ?? 0) >= 4 || entry.textToken.length >= 3);
}

const BOUND_ID_PATTERN = /(ci_lower|ci_upper|_lower$|_upper$)/;
const BOUND_TEXT_PATTERN = /(신뢰구간\s*하한|신뢰구간\s*상한|하한|상한)/;
const SUBCATEGORY_TEXT_PATTERN = /(부문별|가스별|품목별|국가별|기술별|구성요소|시나리오|세부지표|목표별|지역별)/;
const SUBCATEGORY_ID_PATTERN = /ssp\d/;

/** Why a compare key might not be the element's true headline, for a human to judge. */
function headlineReasons(compareKey, countries, gazetteer) {
  const reasons = [];
  const idLower = compareKey.indicatorId.toLowerCase();
  const labels = Object.values(countries)
    .map((country) => country.labelKo)
    .filter((label) => Boolean(label));
  const allText = labels.join(" ");

  if (BOUND_ID_PATTERN.test(idLower) || BOUND_TEXT_PATTERN.test(allText)) {
    reasons.push("신뢰구간/상하한값으로 보임");
  }
  if (SUBCATEGORY_TEXT_PATTERN.test(allText) || SUBCATEGORY_ID_PATTERN.test(idLower)) {
    reasons.push("부문·가스·시나리오 등 세부 하위분류로 보임");
  }
  for (const entry of gazetteer) {
    const idHit = entry.idToken && idLower.includes(entry.idToken);
    const textHit = allText.includes(entry.textToken);
    if (idHit || textHit) {
      reasons.push(`한 나라의 지명("${entry.display}")이 포함됨`);
      break;
    }
  }
  for (const country of Object.values(countries)) {
    if (country.present && country.unit && !sameUnit(country.unit, compareKey.unit)) {
      reasons.push(
        `${country.countryNameKo} 단위(${country.unit})가 계약 단위(${compareKey.unit})와 다름`
      );
    }
  }
  return reasons;
}

function buildReport({ generatedAt, countriesWithTree, statusCounts, rows }) {
  const flagged = rows.filter((row) => row.reasons.length > 0);
  const isoLine = countriesWithTree.map((country) => country.iso3).join(", ");
  const lines = [];
  lines.push("# 국가 비교 지표 검토 (V158)");
  lines.push("");
  lines.push(
    `생성 기준 계약: \`${CONTRACT_RELATIVE_PATH}\`(${generatedAt}) · 데이터 트리 보유 국가: ${isoLine}`
  );
  lines.push(
    `비교 가능 요소 ${rows.length}개 · 쌍 상태: common-year ${statusCounts["common-year"]} · latest-each ${statusCounts["latest-each"]} · unit-mismatch ${statusCounts["unit-mismatch"]} · missing-in-country ${statusCounts["missing-in-country"]}`
  );
  lines.push("");
  lines.push(
    "이 표는 자동 판정 결과이며 키를 바꾸지 않는다. 대표지표로 보이지 않는 항목은 아래 별도 절에 모아 사용자 승인을 기다린다."
  );
  lines.push("");
  lines.push("## 요소별 목록");
  lines.push("");
  lines.push("| elementId | indicatorId | 상태 | " + countriesWithTree.map((c) => `${c.nameKo} 라벨`).join(" | ") + " | 비고 |");
  lines.push("|---|---|---|" + countriesWithTree.map(() => "---").join("|") + "|---|");
  for (const row of rows) {
    const labelCells = countriesWithTree.map((country) => {
      const entry = row.countries[country.iso3];
      if (!entry) return "-";
      if (!entry.present) return "(데이터 없음)";
      return (entry.labelKo || "-").replace(/\|/g, "\\|");
    });
    const note = row.reasons.length > 0 ? row.reasons.join("; ") : "-";
    lines.push(
      `| ${row.elementId} | ${row.compareKey.indicatorId} | ${row.status} | ${labelCells.join(" | ")} | ${note} |`
    );
  }
  lines.push("");
  lines.push(`## 대표지표로 보이지 않아 확인이 필요한 항목 (${flagged.length}건)`);
  lines.push("");
  if (flagged.length === 0) {
    lines.push("해당 없음.");
  } else {
    for (const row of flagged) {
      lines.push(`- ${row.elementId} (\`${row.compareKey.indicatorId}\`): ${row.reasons.join("; ")}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}`;
}

function main() {
  const registry = readJson(REGISTRY_PATH);
  const contractText = readFileSync(CONTRACT_PATH, "utf8");
  const contract = JSON.parse(contractText);
  const contractSha256 = createHash("sha256").update(contractText).digest("hex");

  const registryIso3 = registry.countries
    .map((country) => country.iso3)
    .sort((left, right) => left.localeCompare(right));
  const nameByIso3 = new Map(registry.countries.map((country) => [country.iso3, country.nameKo]));

  const countriesWithTree = registry.countries
    .filter((country) =>
      existsSync(resolve(ROOT, `public${country.dataRoot}/packs/bundle-index-v124.json`))
    )
    .slice()
    .sort((left, right) => left.iso3.localeCompare(right.iso3));

  const trees = new Map(
    countriesWithTree.map((country) => [country.iso3, openCountryTree(country)])
  );

  const comparableRows = contract.rows
    .filter((row) => row.countryCompare?.comparable)
    .slice()
    .sort((left, right) => left.elementId.localeCompare(right.elementId));

  const gazetteer = placeNameGazetteer();
  const elements = {};
  const statusCounts = {
    "common-year": 0,
    "latest-each": 0,
    "unit-mismatch": 0,
    "missing-in-country": 0,
  };
  const reportRows = [];

  for (const row of comparableRows) {
    const compareKey = row.countryCompare.compareKey;
    const countries = {};
    for (const country of countriesWithTree) {
      const tree = trees.get(country.iso3);
      const payload = tree ? tree.element(row.elementId) : null;
      const series = indicatorSeries(payload, compareKey.indicatorId);
      countries[country.iso3] = {
        countryIso3: country.iso3,
        countryNameKo: nameByIso3.get(country.iso3) || country.iso3,
        present: Boolean(series && series.points.length > 0),
        unit: series ? series.unit : null,
        labelKo: series ? series.labelKo : null,
        sourceOrg: series ? series.sourceOrg : null,
        points: series ? series.points : [],
      };
    }

    const iso3List = countriesWithTree.map((country) => country.iso3);
    const pairs = [];
    for (let i = 0; i < iso3List.length; i += 1) {
      for (let j = i + 1; j < iso3List.length; j += 1) {
        const pair = pairStatus(countries[iso3List[i]], countries[iso3List[j]]);
        pairs.push(pair);
        statusCounts[pair.status] += 1;
      }
    }
    const status = pairs.length > 0 ? worstStatus(pairs) : "missing-in-country";

    elements[row.elementId] = {
      elementId: row.elementId,
      compareKey,
      countries,
      pairs,
      status,
    };
    reportRows.push({
      elementId: row.elementId,
      compareKey,
      countries,
      status,
      reasons: headlineReasons(compareKey, countries, gazetteer),
    });
  }

  const output = {
    schemaVersion: "country-compare-v158-1",
    generatedAt: contract.generatedAt,
    generatedFrom: {
      registryIso3,
      countriesWithDataTree: countriesWithTree.map((country) => country.iso3),
      contractPath: CONTRACT_RELATIVE_PATH,
      contractSha256,
    },
    elementCount: comparableRows.length,
    statusCounts,
    elements,
  };
  const nextText = `${JSON.stringify(output, null, 2)}\n`;
  const currentText = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : null;
  const changed = currentText !== nextText;

  if (!CHECK_ONLY) {
    if (changed) {
      mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
      writeFileSync(OUTPUT_PATH, nextText, "utf8");
    }
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(
      REPORT_PATH,
      buildReport({
        generatedAt: contract.generatedAt,
        countriesWithTree,
        statusCounts,
        rows: reportRows,
      }),
      "utf8"
    );
  }

  console.log(
    JSON.stringify({
      type: "summary",
      schemaVersion: "v158",
      elements: comparableRows.length,
      countries: countriesWithTree.map((country) => country.iso3),
      statusCounts,
      flagged: reportRows.filter((row) => row.reasons.length > 0).length,
      changed,
      mode: CHECK_ONLY ? "check" : "write",
      outputPath: "public/data/compare/country-compare-v158.json",
    })
  );
  if (CHECK_ONLY && changed) {
    console.error(
      JSON.stringify({
        type: "error",
        reason: "COMPARE_SERIES_OUT_OF_DATE",
        regenerate: "node scripts/v158/build-country-compare-series-v158.mjs",
      })
    );
    process.exitCode = 1;
  }
}

main();
