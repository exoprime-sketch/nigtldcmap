#!/usr/bin/env node
/**
 * V158-B2 WP2: which spec-text paragraphs and use cases get hidden on a
 * non-authoring country's screen, and why.
 *
 * `datasetSpecV159.json`, `useCasesV159.json` and `datasetCardSpecV159.json`
 * were authored for Viet Nam (`useCasesV159.json.registryCountries ===
 * ["VNM"]`). `countryTermsV158.ts`/`countryTextScopeV158.ts` decide, at
 * render time, which paragraphs and use cases mention a country other than the
 * one on screen and hide them (never rewrite them). This script runs the same
 * decision once for every framework element and use case and writes it out as
 * a report, so a reviewer can see the effect across all 152 elements before it
 * ships, without opening every screen.
 *
 *   node scripts/v158/spec-text-scope-report-v158.cjs --country bgd
 *
 * The registry is read straight from `public/data/countries.json` - the file
 * a real deployment ships, not the bundled placeholder `countryContext.ts`
 * falls back to before a fetch resolves - so the country names in this report
 * are the real ones.
 *
 * Field scope (exactly what the WP2 brief named, nothing added on a guess):
 *   - datasetSpecV159.json rows: shortDefinition, shortDefinitionCard,
 *     description, usage, definitionKo
 *   - useCasesV159.json cases: purpose, logic, storyline, caution,
 *     cautionDisplay (a case is hidden as a whole if any one of these matches)
 *   - datasetCardSpecV159.json rows: baseName, sourceLabel
 */
require("sucrase/register/ts");

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "../..");
const readJson = (relPath) => JSON.parse(fs.readFileSync(path.join(REPO, relPath), "utf8"));

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};

const countryArg = arg("--country");
if (!countryArg) throw new Error("--country is required, e.g. --country bgd");
const DISPLAYED_ISO3 = String(countryArg).trim().toUpperCase();

const {
  adminUnitsV158,
  buildOtherCountryTermsV158,
  unionRegistryCountriesV158,
  confirmedRegionEntriesV158,
  findCountryTermsV158,
} = require(path.join(REPO, "src/data/countries/countryTermsV158.ts"));
const {
  shouldScopeTextV158,
  scopeTextToCountryV158,
  scopeCasesToCountryV158,
} = require(path.join(REPO, "src/data/countries/countryTextScopeV158.ts"));

// ---------------------------------------------------------------- inputs
// The real shipped registry, read from disk - never the bundled placeholder
// (`countryContext.ts`'s `bundledCountryRegistryV158()` only exists for the
// browser's first render, before `countries.json` has been fetched).
const registry = readJson("public/data/countries.json");
const displayedEntry = registry.countries.find((row) => row.iso3 === DISPLAYED_ISO3);
if (!displayedEntry) throw new Error(`UNKNOWN_COUNTRY_IN_REGISTRY: ${DISPLAYED_ISO3}`);

const datasetSpec = readJson("src/data/spec/datasetSpecV159.json");
const useCases = readJson("src/data/spec/useCasesV159.json");
const datasetCardSpec = readJson("src/data/spec/datasetCardSpecV159.json");
const bgdCatalog = readJson("public/data/bgd/v2/catalog.json");
const vietnamCatalog = readJson("public/data/vietnam/v2/catalog.json");

const AUTHORED_ISO3 = useCases.registryCountries;
if (!Array.isArray(AUTHORED_ISO3) || AUTHORED_ISO3.length === 0) {
  throw new Error("useCasesV159.json.registryCountries is missing or empty");
}

const notProvidedIds = new Set(
  bgdCatalog.elements.filter((row) => row.publicStatus === "not-provided").map((row) => row.elementId)
);

// ---------------------------------------------------------------- terms
const terms = buildOtherCountryTermsV158({
  displayedIso3: DISPLAYED_ISO3,
  countries: unionRegistryCountriesV158(registry.countries),
  regionEntries: confirmedRegionEntriesV158(),
  adminUnits: adminUnitsV158(registry),
});

const scopingApplies = shouldScopeTextV158(DISPLAYED_ISO3, AUTHORED_ISO3);
if (!scopingApplies) {
  console.log(
    JSON.stringify({
      type: "summary",
      audit: `spec-text-scope:${countryArg}`,
      status: "SKIPPED",
      reason: `${DISPLAYED_ISO3} is an authoring country (${AUTHORED_ISO3.join(", ")}); nothing is scoped`,
    })
  );
  process.exit(0);
}

// ---------------------------------------------------------------- datasetSpecV159.json
const DATASET_SPEC_FIELDS = ["shortDefinition", "shortDefinitionCard", "description", "usage", "definitionKo"];
const specByElementId = new Map();
for (const row of datasetSpec.rows) {
  const hiddenFields = [];
  for (const field of DATASET_SPEC_FIELDS) {
    const value = row[field];
    if (typeof value !== "string" || !value) continue;
    const scoped = scopeTextToCountryV158(value, terms);
    if (scoped.hiddenParagraphs.length > 0) {
      hiddenFields.push({
        file: "datasetSpecV159",
        field,
        hiddenParagraphs: scoped.hiddenParagraphs,
        fieldFullyHidden: scoped.text === null,
      });
    }
  }
  specByElementId.set(row.elementId, hiddenFields);
}

// ---------------------------------------------------------------- datasetCardSpecV159.json
const DATASET_CARD_FIELDS = ["baseName", "sourceLabel"];
const cardByElementId = new Map();
for (const row of datasetCardSpec.rows) {
  const hiddenFields = [];
  for (const field of DATASET_CARD_FIELDS) {
    const value = row[field];
    if (typeof value !== "string" || !value) continue;
    const scoped = scopeTextToCountryV158(value, terms);
    if (scoped.hiddenParagraphs.length > 0) {
      hiddenFields.push({
        file: "datasetCardSpecV159",
        field,
        hiddenParagraphs: scoped.hiddenParagraphs,
        fieldFullyHidden: scoped.text === null,
      });
    }
  }
  cardByElementId.set(row.elementId, hiddenFields);
}

// ---------------------------------------------------------------- useCasesV159.json
const USE_CASE_FIELDS = ["purpose", "logic", "storyline", "caution", "cautionDisplay"];
const caseList = Object.values(useCases.cases);
const { hidden: hiddenCaseIndexes } = scopeCasesToCountryV158(caseList, terms, USE_CASE_FIELDS);
const hiddenCasesByElementId = new Map();
for (const { index, terms: matchedTerms } of hiddenCaseIndexes) {
  const item = caseList[index];
  const list = hiddenCasesByElementId.get(item.elementId) || [];
  list.push({ caseNo: item.caseNo, terms: matchedTerms });
  hiddenCasesByElementId.set(item.elementId, list);
}

// ---------------------------------------------------------------- per-element assembly (152 framework ids)
const elementIds = datasetSpec.rows.map((row) => row.elementId);
const elements = elementIds.map((elementId) => {
  const hiddenFields = [...(specByElementId.get(elementId) || []), ...(cardByElementId.get(elementId) || [])];
  const hiddenCases = hiddenCasesByElementId.get(elementId) || [];
  return {
    elementId,
    notProvided: notProvidedIds.has(elementId),
    hiddenFields,
    hiddenCases,
  };
});
const affected = elements.filter((e) => e.hiddenFields.length > 0 || e.hiddenCases.length > 0);

// ---------------------------------------------------------------- counts
const fieldsHiddenByField = {};
for (const element of elements) {
  for (const hidden of element.hiddenFields) {
    const key = `${hidden.file}.${hidden.field}`;
    fieldsHiddenByField[key] = (fieldsHiddenByField[key] || 0) + 1;
  }
}
const casesHiddenByField = {};
for (const { index } of hiddenCaseIndexes) {
  const item = caseList[index];
  for (const field of USE_CASE_FIELDS) {
    const value = item[field];
    if (typeof value === "string" && findCountryTermsV158(value, terms).length > 0) {
      casesHiddenByField[field] = (casesHiddenByField[field] || 0) + 1;
    }
  }
}

// ---------------------------------------------------------------- 검토 필요: acronyms left visible
// After scoping, what uppercase acronyms (3+ letters, no digits) remain in the
// BGD-facing text? If that same acronym names a Viet Nam-specific source (it is
// a substring of a Viet Nam catalog element's sourceOrganizations entry) and is
// not one of BGD's own source organisations, it is worth a human look - not
// because the acronym itself is hidden (only country/place names are), but
// because it may be shorthand for something Vietnam-specific that slipped
// through as an acronym rather than a name (e.g. "EVN" for Vietnam Electricity).
// Informational only: nothing here is hidden as a result.
const ACRONYM_PATTERN = /\b[A-Z]{3,}\b/g;
function acronymsIn(value) {
  if (typeof value !== "string") return [];
  return value.match(ACRONYM_PATTERN) || [];
}
const visibleAcronyms = new Set();
for (const row of datasetSpec.rows) {
  for (const field of DATASET_SPEC_FIELDS) {
    const scoped = scopeTextToCountryV158(row[field], terms).text;
    for (const acronym of acronymsIn(scoped)) visibleAcronyms.add(acronym);
  }
}
for (const row of datasetCardSpec.rows) {
  for (const field of DATASET_CARD_FIELDS) {
    const scoped = scopeTextToCountryV158(row[field], terms).text;
    for (const acronym of acronymsIn(scoped)) visibleAcronyms.add(acronym);
  }
}
for (const item of scopeCasesToCountryV158(caseList, terms, USE_CASE_FIELDS).kept) {
  for (const field of USE_CASE_FIELDS) {
    for (const acronym of acronymsIn(item[field])) visibleAcronyms.add(acronym);
  }
}

const vietnamSourceOrgs = vietnamCatalog.elements.flatMap((row) => row.sourceOrganizations || []);
const bgdSourceOrgs = bgdCatalog.elements.flatMap((row) => row.sourceOrganizations || []);
const reviewNeeded = Array.from(visibleAcronyms)
  .filter((acronym) => vietnamSourceOrgs.some((org) => org.includes(acronym)))
  .filter((acronym) => !bgdSourceOrgs.some((org) => org.includes(acronym)))
  .sort()
  .map((acronym) => ({
    acronym,
    matchedVietnamSourceOrganizations: vietnamSourceOrgs.filter((org) => org.includes(acronym)),
  }));

// ---------------------------------------------------------------- write reports
const generatedAt = new Date().toISOString().slice(0, 10);
const jsonReport = {
  schemaVersion: "spec-text-hidden-v158",
  generatedAt,
  displayedIso3: DISPLAYED_ISO3,
  authoredIso3: AUTHORED_ISO3,
  termCount: terms.length,
  summary: {
    frameworkElementCount: elements.length,
    notProvidedElementCount: notProvidedIds.size,
    elementsAffected: affected.length,
    elementsAffectedProvided: affected.filter((e) => !e.notProvided).length,
    elementsAffectedNotProvided: affected.filter((e) => e.notProvided).length,
    fieldsHiddenByField,
    casesTotal: caseList.length,
    casesHidden: hiddenCaseIndexes.length,
    casesHiddenByField,
    reviewNeededCount: reviewNeeded.length,
  },
  // Full 152-element list (not just the affected ones), so an element with
  // nothing hidden is visible in the report as a deliberate "nothing found"
  // rather than an absence a reader has to double check against the catalog.
  elements,
  reviewNeeded,
};
const jsonPath = `reports/v158/spec-text-hidden-${countryArg.toLowerCase()}-v158.json`;
fs.mkdirSync(path.join(REPO, "reports/v158"), { recursive: true });
fs.writeFileSync(path.join(REPO, jsonPath), `${JSON.stringify(jsonReport, null, 2)}\n`, "utf8");

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

const fieldRows = Object.entries(fieldsHiddenByField)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `| ${field} | ${count} |`)
  .join("\n");
const caseFieldRows = Object.entries(casesHiddenByField)
  .sort((a, b) => b[1] - a[1])
  .map(([field, count]) => `| ${field} | ${count} |`)
  .join("\n");
const elementRows = affected
  .map((element) => {
    const fieldList = element.hiddenFields.map((h) => `${h.file.replace("V159", "")}.${h.field}(${h.hiddenParagraphs.length})`).join(", ") || "-";
    const caseNoList = element.hiddenCases.map((c) => `#${c.caseNo}`).join(", ") || "-";
    return `| ${element.elementId} | ${element.notProvided ? "미제공" : ""} | ${mdEscape(fieldList)} | ${mdEscape(caseNoList)} |`;
  })
  .join("\n");
const reviewRows = reviewNeeded
  .map((row) => `| ${row.acronym} | ${mdEscape(row.matchedVietnamSourceOrganizations.join("; "))} |`)
  .join("\n");

const md = `# 명세 텍스트 국가 범위 제한 — ${DISPLAYED_ISO3} (V158-B2 WP2)

**${generatedAt}**

## 검토 결과

□ 대상: ${DISPLAYED_ISO3} 화면에 표시되는 명세 텍스트(datasetSpecV159 · useCasesV159 · datasetCardSpecV159). 원문은 ${AUTHORED_ISO3.join(
  ", "
)} 기준으로 작성됨. 다른 나라(원문 작성국 제외 대상국 전체) 이름·지명이 들어간 문단·사례만 숨김(원문 수정 없음).

ㅇ 프레임워크 152개 요소 중 영향받은 요소: **${affected.length}개** (제공 ${affected.filter((e) => !e.notProvided).length}개 · ${DISPLAYED_ISO3} 미제공 ${
  affected.filter((e) => e.notProvided).length
}개 / 전체 미제공 ${notProvidedIds.size}개)

ㅇ 사용 사례(useCasesV159) ${caseList.length}건 중 숨김: **${hiddenCaseIndexes.length}건**

ㅇ 적용한 다른 나라 용어 수(국가명 + 확정 지명): ${terms.length}개

## 필드별 숨김 문단 수 (datasetSpecV159 / datasetCardSpecV159)

| 필드 | 숨김 문단(요소) 수 |
|---|---|
${fieldRows || "| (없음) | 0 |"}

## 사용 사례 필드별 숨김 건수

| 필드 | 숨김 건수 |
|---|---|
${caseFieldRows || "| (없음) | 0 |"}

## 요소별 상세 (영향받은 ${affected.length}개)

| 요소ID | ${DISPLAYED_ISO3} 상태 | 숨김 필드(문단 수) | 숨김 사례 |
|---|---|---|---|
${elementRows || "| (없음) | | | |"}

## 검토 필요 (참고용 — 숨기지 않음)

□ ${DISPLAYED_ISO3} 화면에 남는 텍스트 중, 베트남 카탈로그 출처기관명에는 나오지만 ${DISPLAYED_ISO3} 카탈로그 출처기관명에는 없는 대문자 약어(3자 이상). 국가·지명 용어 매칭 대상이 아니므로 숨기지 않았고, 베트남 특정 출처(예: 현지 기관 약어)를 가리킬 가능성이 있어 사람이 확인할 목록으로만 남김.

| 약어 | 매칭된 베트남 출처기관명 |
|---|---|
${reviewRows || "| (없음) | |"}
`;
const mdPath = `reports/v158/spec-text-hidden-${countryArg.toLowerCase()}-v158.md`;
fs.writeFileSync(path.join(REPO, mdPath), md, "utf8");

console.log(
  JSON.stringify({
    type: "summary",
    audit: `spec-text-scope:${countryArg}`,
    status: "OK",
    displayedIso3: DISPLAYED_ISO3,
    authoredIso3: AUTHORED_ISO3,
    termCount: terms.length,
    frameworkElementCount: elements.length,
    elementsAffected: affected.length,
    elementsAffectedNotProvided: affected.filter((e) => e.notProvided).length,
    casesTotal: caseList.length,
    casesHidden: hiddenCaseIndexes.length,
    reviewNeededCount: reviewNeeded.length,
    jsonPath,
    mdPath,
  })
);
