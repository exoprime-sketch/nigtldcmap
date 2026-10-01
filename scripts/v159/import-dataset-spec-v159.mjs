#!/usr/bin/env node
/**
 * V159 dataset spec importer.
 *
 * Framework workbook (_source/spec, not committed) + typology assignment
 * table (docs/plan/V159_데이터유형화_명세.md §4) ->
 *   src/data/spec/datasetSpecV159.json    names, definitions, description, usage, references
 *   src/data/spec/useCasesV159.json       366 verified use cases (+ pending ones for D-001/D-002/D-004)
 *   src/data/spec/datasetTypologyV159.json 152 rows: displayType, structure, flags, status, variant
 * and review tables under reports/v159/.
 *
 * Screen copy is read verbatim from the workbook. The only rewrites are
 * the rule-based ones below, each logged in a review table:
 *   - platform name split into source line + dataset name (sourceLabelRulesV159.json)
 *   - card short definition without the leading "기관명(영문)이/가 " clause
 *   - caution countries outside the platform's country registry replaced (original kept for the tooltip)
 *   - minimal corrections recorded in specTextOverridesV159.json (text a public
 *     screen check rejects), returned to the workbook owner as
 *     docs/handoff/v159/SPEC_TEXT_CORRECTIONS.md
 *
 * Usage:
 *   node scripts/v159/import-dataset-spec-v159.mjs [--xlsx <path>] [--check]
 */
import { spawnSync } from "node:child_process";
import { exclusionDecisionsV158 } from "../v158/exclusion-decisions-v158.mjs";
import { readZipMembersV158 } from "../v158/download-zip-v158.mjs";
import { loadCountryNamesV162, makeCountryViewsV162 } from "../v162/country-neutral-v162.mjs";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const CHECK = args.includes("--check");
const XLSX = resolve(
  ROOT,
  opt("--xlsx", "../20260827_개도국전략지도플랫폼/_source/spec/db_status_framework_v5.38_260922.xlsx"),
);
const SPEC_MD = resolve(ROOT, "docs/plan/V159_데이터유형화_명세.md");
const OUT_DIR = resolve(ROOT, "src/data/spec");
const REPORT_DIR = resolve(ROOT, "reports/v159");
const RULES = JSON.parse(readFileSync(resolve(OUT_DIR, "sourceLabelRulesV159.json"), "utf8"));
const PENDING_CASES_PATH = resolve(OUT_DIR, "useCasesPendingV159.json");
// V162: the country-keyed wording of sentences that carry several platform
// countries' own content (country-neutral-v162.mjs rule 3).
const COUNTRY_SPLIT = JSON.parse(readFileSync(resolve(OUT_DIR, "countryTextSplitV162.json"), "utf8")).entries;
const COUNTRY_VIEWS_DOC = resolve(ROOT, "docs/handoff/v162/COUNTRY_TEXT_VIEWS_V162.md");
const DEFAULT_COUNTRY = "VNM";
const OVERRIDES = JSON.parse(readFileSync(resolve(OUT_DIR, "specTextOverridesV159.json"), "utf8")).overrides;
const CORRECTIONS_DOC = resolve(ROOT, "docs/handoff/v159/SPEC_TEXT_CORRECTIONS.md");
const appliedOverrides = new Set();
// V156-E: whether an element is excluded is a publication decision, kept in
// the decision file the ETL reads. The spec sheet's status column records the
// decision as it stood (제외 0918/0923); the decision file says whether it still
// stands, and for a lifted one whether there is data and which screen it gets.
// V158: the decision common to every country plus the default country's own.
const EXCLUSION_DECISION = exclusionDecisionsV158(ROOT, "VNM");
const ACTIVE_EXCLUSIONS = new Map(EXCLUSION_DECISION.exclusions.map((row) => [row.elementId, row]));
const CATALOG_V162 = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8"));
const PENDING_PUBLIC_STATUSES_V162 = new Set(["not-provided", "not-collected", "schema-only", "data-entry-planned"]);
const DELIVERED_IN_CATALOG_V162 = new Set(
  CATALOG_V162.elements.filter((element) => !PENDING_PUBLIC_STATUSES_V162.has(String(element.publicStatus || ""))).map((element) => element.elementId)
);
const DELIVERED_AT_V162 = String(
  JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/manifest.json"), "utf8")).provenance?.sourceDeliveredAt || ""
).slice(0, 10);
const LIFTED_EXCLUSIONS = new Map((EXCLUSION_DECISION.lifted || []).map((row) => [row.elementId, row]));

// A recorded minimal correction replaces the workbook text only where its
// `from` occurs exactly once in that field; anything else stops the import.
// Use-case fields (caution, dataUsed, logic, storyline) name the case: `caseNo` in the override.
function applyOverride(elementId, field, value, caseNo = null) {
  let out = value;
  OVERRIDES.forEach((item, index) => {
    if (item.elementId !== elementId || item.field !== field) return;
    if (item.caseNo !== undefined && item.caseNo !== caseNo) return;
    const count = out.split(item.from).length - 1;
    if (count !== 1) throw new Error(`${elementId}.${field}: override 'from' found ${count} times`);
    out = out.replace(item.from, item.to);
    appliedOverrides.add(index);
  });
  return out;
}

const DISPLAY_TYPES = {
  "①": { code: "U1", label: "국가 수준·추세" },
  "②": { code: "U2", label: "지역·입지" },
  "③": { code: "U3", label: "기술별 비교" },
  "④": { code: "U4", label: "시설·기관·인프라 위치" },
  "⑤": { code: "U5", label: "사업·재원" },
  "⑥": { code: "U6", label: "제도·규제·리스크" },
};
// Spec v8 (2026-09-29): options the assignment table has no column for.
// D-004 compares technologies across price scenarios.
const SCENARIO_V8 = new Set(["D-004"]);
// Elements whose values describe a fixed reference country rather than the
// page's country: every country screen shows the same rows and they are never
// compared across countries (E-016 Korea's own TRL records, E-017 Korea
// against four competitors).
const REFERENCE_COUNTRY_V8 = { "E-016": "KOR", "E-017": "KOR" };
const STRUCTURES = {
  S1: "국가×연도 관측값",
  S2: "지역×연도 관측값",
  S3: "위치 개체",
  S4: "비공간 개체",
};
// Elements drawn by their own component instead of a template (spec v2 §0).
// B-046/B-047 share one component and count as one.
const DEDICATED = {
  "A-023": "power-plant-registry",
  "B-046": "mineral-resources",
  "B-047": "mineral-resources",
  "D-004": "technology-scenario-heatmap",
  "A-013": "ndc-sdg-matrix",
  "B-008": "sea-level-stations",
  "E-006": "investor-network",
};

// ---------------------------------------------------------------- workbook
function readWorkbook() {
  if (!existsSync(XLSX)) throw new Error(`framework workbook not found: ${XLSX}`);
  const candidates = process.platform === "win32" ? [["python", []], ["py", ["-3"]]] : [["python3", []], ["python", []]];
  for (const [bin, prefix] of candidates) {
    const result = spawnSync(bin, [...prefix, resolve(ROOT, "scripts/v159/read_spec_xlsx_v159.py"), XLSX], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    if (result.status === 0) return JSON.parse(result.stdout);
    if (result.error?.code === "ENOENT") continue;
    throw new Error(`workbook reader failed: ${result.stderr}`);
  }
  throw new Error("Python 3 with openpyxl is required");
}

const text = (value) => (value === null || value === undefined ? "" : String(value).trim());

function rowsWithHeader(rows, headerCell) {
  const headerIndex = rows.findIndex((row) => row.some((cell) => text(cell) === headerCell));
  if (headerIndex < 0) throw new Error(`header not found: ${headerCell}`);
  const header = rows[headerIndex].map(text);
  const col = (name) => {
    const index = header.indexOf(name);
    if (index < 0) throw new Error(`column not found: ${name}`);
    return index;
  };
  return { header, col, body: rows.slice(headerIndex + 1) };
}

// ---------------------------------------------------------------- name split
const LATIN_TOKEN = /^[A-Za-z0-9.&\-·()']+$/;

function splitPlatformName(elementId, platformName, sourceColumn) {
  const override = RULES.prefix.find((rule) => rule.elementId === elementId);
  if (override) {
    if (`${override.sourceLabel} ${override.baseName}` !== platformName) {
      throw new Error(`${elementId}: prefix rule does not rebuild the platform name`);
    }
    return { sourceLabel: override.sourceLabel, baseName: override.baseName, rule: "rules-prefix" };
  }
  const noPrefix = RULES.noPrefix.find((rule) => rule.elementId === elementId);
  if (noPrefix) {
    if (!sourceColumn.includes(noPrefix.sourceLabel)) {
      throw new Error(`${elementId}: noPrefix sourceLabel is not in the 출처 column`);
    }
    return { sourceLabel: noPrefix.sourceLabel, baseName: platformName, rule: "rules-no-prefix" };
  }
  const outside = platformName.indexOf(" 외 ");
  if (outside > 0) {
    return { sourceLabel: platformName.slice(0, outside + 2), baseName: platformName.slice(outside + 3), rule: "auto-외" };
  }
  const tokens = platformName.split(" ");
  let count = 0;
  while (count < tokens.length && LATIN_TOKEN.test(tokens[count]) && /[A-Za-z]/.test(tokens[count])) count += 1;
  if (count === 0 || count === tokens.length) return { sourceLabel: "", baseName: platformName, rule: "unsplit" };
  return { sourceLabel: tokens.slice(0, count).join(" "), baseName: tokens.slice(count).join(" "), rule: "auto-latin" };
}

// ---------------------------------------------------------------- card definition
// Token endings that mean the text before the first 이/가 is already a clause,
// not just the organisation's name.
const CLAUSE_ENDING = /(을|를|는|은|에|에서|로|으로|한|된|고|며|서|,)$/;

function cardDefinition(elementId, definition) {
  if (RULES.shortDefinitionCardKeepOriginal.includes(elementId)) {
    return { value: definition, removed: "", rule: "keep-original(rules)" };
  }
  const match = definition.match(/^(.{2,60}?)(이|가) /);
  if (!match) return { value: definition, removed: "", rule: "no-subject" };
  const subject = match[1];
  if (!subject.includes("(") || !subject.includes(")")) return { value: definition, removed: "", rule: "no-org-name" };
  const tokens = subject.split(" ");
  if (tokens.some((token) => CLAUSE_ENDING.test(token))) return { value: definition, removed: "", rule: "clause-before-subject" };
  return { value: definition.slice(match[0].length), removed: match[0], rule: "removed" };
}

// ---------------------------------------------------------------- decision note
// The first "- <ID> 제외|대체: …" line of 처리방향 is the stated reason for an
// excluded or replaced element; only the ID prefix is dropped.
function decisionNote(direction) {
  const pattern = /^-\s*(?:[A-E]-\d{3}\s*)?(제외|대체)(\s*사유)?\s*:\s*/;
  const line = direction.split(/\r?\n/).find((item) => pattern.test(item.trim()));
  return line ? line.trim().replace(pattern, "") : null;
}

// ---------------------------------------------------------------- caution countries
// Countries the platform publishes (status "live" in the country registry).
// A country whose data tree is being prepared (BGD since V158) is not one of
// them: until it goes live the use-case cautions, shared by every country
// screen, keep "일부 나라" for it instead of its name.
function registryCountries() {
  const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8"));
  return new Set((registry.countries || []).filter((country) => country.status === "live").map((country) => String(country.iso3).toUpperCase()));
}

function priorityCountries() {
  const source = readFileSync(resolve(ROOT, "src/data/priorityCountries.ts"), "utf8");
  return [...source.matchAll(/iso3: "([A-Z]{3})", nameKo: "([^"]+)"/g)].map((match) => ({ iso3: match[1], nameKo: match[2] }));
}

function cautionForRegistry(caution, countries, registry) {
  const names = countries.map((country) => country.nameKo).sort((a, b) => b.length - a.length);
  const nameGroup = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const listPattern = new RegExp(`(?:${nameGroup})(?:·(?:${nameGroup}))*`, "g");
  const inRegistry = (name) => registry.has(countries.find((country) => country.nameKo === name)?.iso3 || "");
  const replacements = [];
  const replaced = caution.replace(new RegExp(`(${listPattern.source})(은|는|이|가|을|를|과|와)?`, "g"), (whole, list, particle) => {
    const members = list.split("·");
    const kept = members.filter(inRegistry);
    if (kept.length === members.length) return whole;
    const next = kept.length ? kept.join("·") : "일부 나라";
    replacements.push({ from: list, to: next });
    return `${next}${particle ? particleFor(next, particle) : ""}`;
  });
  if (!replacements.length) return { value: caution, replacements, rule: "unchanged" };
  // V162: the platform countries are handled before this (country views), so no
  // list of them is left to keep; the source text is no longer kept for a count
  // or a list ("국명 남기기" rule removed).
  return { value: replaced, replacements, rule: "replaced" };
}

// Korean particle agreeing with the final syllable of the new word.
function particleFor(word, particle) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  const pairs = { 은: ["은", "는"], 는: ["은", "는"], 이: ["이", "가"], 가: ["이", "가"], 을: ["을", "를"], 를: ["을", "를"], 과: ["과", "와"], 와: ["과", "와"] };
  const [withFinal, withoutFinal] = pairs[particle];
  return hasFinal ? withFinal : withoutFinal;
}

// ---------------------------------------------------------------- indicators
// The indicator ids the downloads carry. Since V158 each element's download is
// a ZIP holding `<id>.json` (read through the V158 reader); a loose `<id>.json`
// from before V158 is still read.
function catalogIndicators() {
  const dir = resolve(ROOT, "public/data/vietnam/v2/downloads");
  const ids = new Set();
  const collect = (parsed) => {
    for (const indicator of parsed?.indicators || []) if (indicator.indicatorId) ids.add(indicator.indicatorId);
  };
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".zip")) {
      const member = readZipMembersV158(resolve(dir, file)).get(file.replace(/\.zip$/, ".json"));
      if (member) collect(JSON.parse(member.toString("utf8")));
    } else if (file.endsWith(".json")) {
      collect(JSON.parse(readFileSync(resolve(dir, file), "utf8")));
    }
  }
  if (!ids.size) throw new Error(`no indicator ids under ${dir} - the download format changed?`);
  return ids;
}

// A re-import must not lose use-case data mappings: every indicator that was
// mapped (exact or prefix) in the committed useCasesV159.json has to stay mapped.
function lostMappings(cases) {
  const path = resolve(OUT_DIR, "useCasesV159.json");
  if (!existsSync(path)) return { previous: 0, next: 0, lost: [] };
  const isMapped = (item) => item.mapped === "exact" || item.mapped === "prefix";
  const key = (item, entry) => `${item.elementId}#${item.caseNo}#${entry.indicatorId}`;
  const nextMapped = new Set();
  let next = 0;
  for (const item of cases) {
    for (const entry of item.dataUsed || []) {
      if (!isMapped(entry)) continue;
      next += 1;
      nextMapped.add(key(item, entry));
    }
  }
  const lost = [];
  let previous = 0;
  for (const item of JSON.parse(readFileSync(path, "utf8")).cases || []) {
    for (const entry of item.dataUsed || []) {
      if (!isMapped(entry)) continue;
      previous += 1;
      if (!nextMapped.has(key(item, entry))) lost.push(`${item.elementId} 사례 ${item.caseNo}: ${entry.indicatorId} (${entry.mapped})`);
    }
  }
  return { previous, next, lost };
}

function parseDataUsed(source, catalog) {
  const items = [];
  const segment = /([^,()—]+?)\s*\(([^()]*)\)/g;
  for (const match of source.matchAll(segment)) {
    const label = match[1].trim().replace(/^[-·\s]+/, "");
    const ids = match[2].match(/[A-E]-\d{3}_[A-Za-z0-9_]+/g) || [];
    for (const id of ids) {
      const exact = catalog.has(id);
      const prefixMatches = exact ? [] : [...catalog].filter((candidate) => candidate.startsWith(id.endsWith("_") ? id : `${id}_`));
      items.push({
        indicatorId: id,
        label,
        mapped: exact ? "exact" : prefixMatches.length ? "prefix" : "unmapped",
        ...(prefixMatches.length ? { catalogIndicatorIds: prefixMatches } : {}),
      });
    }
  }
  if (!items.length && source) items.push({ indicatorId: null, label: source, mapped: "label-only" });
  return items;
}

// ---------------------------------------------------------------- typology table
function readTypologyTable() {
  const lines = readFileSync(SPEC_MD, "utf8").split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!/^\| [A-E]-\d{3} \|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const [elementId, platformName, displayRaw, structureRaw, region, tech, vnm, bgd, caseCount, status, variant] = cells;
    const displayKey = displayRaw.slice(0, 1);
    const structure = structureRaw.slice(0, 2);
    if (!DISPLAY_TYPES[displayKey]) throw new Error(`${elementId}: unknown display type ${displayRaw}`);
    if (!STRUCTURES[structure]) throw new Error(`${elementId}: unknown structure ${structureRaw}`);
    rows.push({ elementId, platformName, displayKey, structure, region: region === "지역", tech: tech === "기술", vnm, bgd, caseCount: Number(caseCount), status, variant });
  }
  return rows;
}

function mapLayerElements() {
  const index = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
  return new Set((index.layers || []).filter((layer) => layer.active !== false).map((layer) => layer.elementId));
}

// ---------------------------------------------------------------- main
function main() {
  const workbook = readWorkbook();
  const catalog = catalogIndicators();
  const registry = registryCountries();
  const countries = priorityCountries();
  const mapElements = mapLayerElements();
  // V162: every public text is what the viewing country's screens show.
  const countryNames = loadCountryNamesV162(ROOT);
  const countryViews = makeCountryViewsV162(countryNames);
  const platformIso3 = countryNames.platform.map((row) => row.iso3);
  const platformSet = new Set(platformIso3);
  const otherViewers = platformIso3.filter((iso3) => iso3 !== DEFAULT_COUNTRY);
  const usedSplit = new Set();
  const viewLog = [];
  const ownLookup = (elementId, field, caseNo) => (sentence) => {
    const key = sentence.trim();
    const index = COUNTRY_SPLIT.findIndex((entry) => entry.elementId === elementId && entry.field === field && (entry.caseNo ?? null) === (caseNo ?? null) && entry.from === key);
    if (index < 0) return null;
    usedSplit.add(index);
    return COUNTRY_SPLIT[index].byCountry;
  };
  const viewOf = (value, viewer, elementId, field, caseNo = null) => {
    const result = countryViews.viewText(value, viewer, ownLookup(elementId, field, caseNo));
    for (const change of result.changes) viewLog.push({ elementId, field, caseNo, viewer, ...change });
    return result.text;
  };
  const viewsOut = { schemaVersion: "v162-country-text-views-1", defaultCountry: DEFAULT_COUNTRY, countries: otherViewers, spec: {}, cases: {} };
  const typologyRows = readTypologyTable();

  // spec sheet
  const spec = rowsWithHeader(workbook.spec, "요소명_플랫폼");
  const c = spec.col;
  const elements = spec.body.filter((row) => text(row[c("층위")]) === "요소");
  const specRows = [];
  const nameReview = [];
  const cardReview = [];
  for (const row of elements) {
    const elementId = text(row[c("코드")]);
    const platformName = text(row[c("요소명_플랫폼")]);
    const sourceColumn = text(row[c("출처")]);
    const split = splitPlatformName(elementId, platformName, sourceColumn);
    const shortDefinition = applyOverride(elementId, "shortDefinition", text(row[c("간략 정의")]));
    const card = cardDefinition(elementId, shortDefinition);
    nameReview.push({ elementId, platformName, ...split });
    cardReview.push({ elementId, shortDefinition, shortDefinitionCard: card.value, removed: card.removed, rule: card.rule });
    specRows.push({
      elementId,
      platformName,
      platformNameEn: text(row[c("요소명_플랫폼_영문")]),
      sourceLabel: split.sourceLabel,
      baseName: split.baseName,
      shortDefinition,
      shortDefinitionCard: card.value,
      description: applyOverride(elementId, "description", text(row[c("상세 설명")])),
      usage: applyOverride(elementId, "usage", text(row[c("활용 방법")])),
      definitionKo: text(row[c("정의(국문)")]),
      sourceOrg: applyOverride(elementId, "sourceOrg", text(row[c("출처기관")])),
      refLink: applyOverride(elementId, "refLink", text(row[c("참고문헌 링크")])),
      refApa: applyOverride(elementId, "refApa", text(row[c("참고문헌(APA)")])),
      checkedAt: text(row[c("확인일자")]).slice(0, 10),
      decision: text(row[c("금년도 최종 결정")]) || null,
      decisionNote: decisionNote(text(row[c("처리방향")])),
    });
    const specRow = specRows[specRows.length - 1];
    for (const field of ["description", "usage"]) {
      const source = specRow[field];
      specRow[field] = viewOf(source, DEFAULT_COUNTRY, elementId, field);
      for (const viewer of otherViewers) {
        const view = viewOf(source, viewer, elementId, field);
        if (view !== specRow[field]) ((viewsOut.spec[elementId] ??= {})[viewer] ??= {})[field] = view;
      }
    }
  }

  // use cases
  const uc = rowsWithHeader(workbook.useCases, "사례 번호");
  const u = uc.col;
  const cautionReview = [];
  const cases = uc.body
    .filter((row) => text(row[u("층위")]) === "요소")
    .map((row) => {
      const elementId = text(row[u("코드")]);
      const purposeRaw = text(row[u("활용 목적")]);
      const en = purposeRaw.match(/\s*\(([A-Za-z][^()]*)\)\s*$/);
      const caseNo = Number(text(row[u("사례 번호")]));
      const caution = applyOverride(elementId, "caution", text(row[u("유의점")]), caseNo);
      return {
        elementId,
        caseNo: Number(text(row[u("사례 번호")])),
        purpose: en ? purposeRaw.slice(0, en.index).trim() : purposeRaw,
        purposeEn: en ? en[1].trim() : "",
        logic: applyOverride(elementId, "logic", text(row[u("논리 구조")]), caseNo),
        dataUsed: parseDataUsed(applyOverride(elementId, "dataUsed", text(row[u("쓰는 데이터")]), caseNo), catalog),
        storyline: applyOverride(elementId, "storyline", text(row[u("스토리라인 예시")]), caseNo),
        users: text(row[u("주 사용자")]).split(/\s*·\s*/).filter(Boolean),
        caution,
        verified: "verified",
        verificationResult: text(row[u("검증 결과")]),
      };
    });
  const pending = existsSync(PENDING_CASES_PATH) ? JSON.parse(readFileSync(PENDING_CASES_PATH, "utf8")).cases || [] : [];
  for (const item of pending) {
    cases.push({ ...item, dataUsed: parseDataUsed(item.dataUsedText || "", catalog), verified: "pending", verificationResult: "검증 대기" });
  }
  for (const item of cases) delete item.dataUsedText;
  cases.sort((a, b) => a.elementId.localeCompare(b.elementId) || a.caseNo - b.caseNo);

  // V162: each case as each platform country's screens show it. A case whose
  // purpose is another country's own is shown only to the countries that keep
  // it (`countries`); the stored text is the default country's view, the
  // others' differences go to countryTextViewsV162.json.
  const caseView = (item, viewer) => {
    const at = (field) => viewOf(item[field], viewer, item.elementId, field, item.caseNo);
    const purpose = at("purpose");
    if (!purpose) return null;
    const cautionView = at("caution");
    const display = cautionForRegistry(cautionView, countries, new Set([...platformSet]));
    if (viewer === DEFAULT_COUNTRY && display.replacements.length) cautionReview.push({ elementId: item.elementId, caseNo: item.caseNo, caution: item.caution, cautionDisplay: display.value, rule: display.rule, replacements: display.replacements });
    const dataUsed = [];
    for (const entry of item.dataUsed || []) {
      const label = viewOf(entry.label, viewer, item.elementId, "dataUsed", item.caseNo);
      // A chip is dropped only when its label is another country's own; an empty label stays.
      if (label || !entry.label) dataUsed.push(label === entry.label ? entry : { ...entry, label });
    }
    return { purpose, purposeEn: purpose === item.purpose ? item.purposeEn : at("purposeEn"), logic: at("logic"), storyline: at("storyline"), cautionDisplay: display.value, dataUsed };
  };
  for (let index = 0; index < cases.length; index += 1) {
    const item = cases[index];
    const views = Object.fromEntries(platformIso3.map((viewer) => [viewer, caseView(item, viewer)]));
    const shownTo = platformIso3.filter((viewer) => views[viewer]);
    const baseViewer = views[DEFAULT_COUNTRY] ? DEFAULT_COUNTRY : shownTo[0];
    const merged = { ...item, ...(baseViewer ? views[baseViewer] : { cautionDisplay: item.caution }) };
    // Same key order as before V162 (cautionDisplay right after caution).
    const base = {};
    for (const key of Object.keys(item)) {
      base[key] = merged[key];
      if (key === "caution") base.cautionDisplay = merged.cautionDisplay;
    }
    if (shownTo.length !== platformIso3.length) base.countries = shownTo;
    for (const viewer of otherViewers) {
      if (!views[viewer] || viewer === baseViewer) continue;
      const diff = {};
      for (const [field, value] of Object.entries(views[viewer])) {
        if (JSON.stringify(value) !== JSON.stringify(base[field])) diff[field] = value;
      }
      if (Object.keys(diff).length) (viewsOut.cases[`${item.elementId}#${item.caseNo}`] ??= {})[viewer] = diff;
    }
    cases[index] = base;
  }
  const staleSplit = COUNTRY_SPLIT.filter((entry, index) => !usedSplit.has(index));
  if (staleSplit.length) throw new Error(`countryTextSplitV162.json entries match no sentence: ${staleSplit.map((entry) => `${entry.elementId}${entry.caseNo ? `#${entry.caseNo}` : ""}.${entry.field}`).join(", ")}`);

  // typology
  const specById = new Map(specRows.map((row) => [row.elementId, row]));
  const typology = typologyRows.map((row) => {
    const specRow = specById.get(row.elementId);
    if (!specRow) throw new Error(`${row.elementId}: not in spec sheet`);
    // Spec v8 (2026-09-29): every element keeps its assigned type (U1-U6);
    // the ⓪ status type is gone. Whether the screen is a notice instead of
    // the analysis is `statusNotice`: "data-pending" when the data has not
    // been delivered (status 미입고, or an exclusion the decision file lifted
    // without data), "excluded" for an exclusion that still stands.
    const type = DISPLAY_TYPES[row.displayKey];
    let status = row.status;
    let statusNotice = /^미입고/u.test(row.status) ? "data-pending" : null;
    const lift = LIFTED_EXCLUSIONS.get(row.elementId);
    const active = ACTIVE_EXCLUSIONS.get(row.elementId);
    if (active) {
      // An exclusion the decision file holds now wins over the table's status
      // (2026-09-29: six re-excluded for 2026, C-021 among them though the
      // table says 미입고). The element keeps its type, structure and contract
      // so the design is reused when it is published.
      status = `제외(${active.basis} ${active.decidedAt.slice(5).replace("-", "")})`;
      statusNotice = "excluded";
    } else if (/^제외/u.test(row.status)) {
      if (!lift) {
        statusNotice = "excluded";
      } else if (!lift.dataPresent) {
        status = "미입고(데이터 준비 중)";
        statusNotice = "data-pending";
      } else {
        const liftType = lift.displayTypeAfterLift ? DISPLAY_TYPES[lift.displayTypeAfterLift] : type;
        if (liftType?.code !== type.code) throw new Error(`${row.elementId}: lift decision type differs from the assignment table`);
        status = `공개(제외 해제 ${lift.liftedAt.slice(5).replace("-", "")})`;
      }
    }
    // V162 (user decision 2026-09-30): whether data is pending is the
    // catalog's call alone. A row the spec table still lists as 미입고 but
    // the default country's catalog publishes (E-011, delivered 2026-09-30)
    // is no longer a notice screen.
    if (statusNotice === "data-pending" && DELIVERED_IN_CATALOG_V162.has(row.elementId)) {
      status = `공개(${DELIVERED_AT_V162} 입고)`;
      statusNotice = null;
    }
    const scenario = SCENARIO_V8.has(row.elementId) || [...catalog].some((id) => id.startsWith(`${row.elementId}_`) && /(^|_)(ssp\d|rcp\d|scenario)/i.test(id));
    return {
      elementId: row.elementId,
      displayType: type.code,
      displayTypeLabel: type.label,
      specDisplayType: type.code,
      structure: row.structure,
      structureLabel: STRUCTURES[row.structure],
      flags: {
        region: row.region,
        tech: row.tech,
        geometry: mapElements.has(row.elementId),
        categorical: /범주형/.test(row.variant),
        scenario,
      },
      status,
      statusNotice,
      referenceCountryIso3: REFERENCE_COUNTRY_V8[row.elementId] || null,
      variant: row.variant,
      dedicated: DEDICATED[row.elementId] || null,
      coverage: { VNM: row.vnm, BGD: row.bgd },
      specCaseCount: row.caseCount,
    };
  });

  // checks
  const failures = [];
  if (specRows.length !== 152) failures.push(`spec rows ${specRows.length} != 152`);
  if (typology.length !== 152) failures.push(`typology rows ${typology.length} != 152`);
  for (const row of specRows) {
    if (!row.sourceLabel || !row.baseName) failures.push(`${row.elementId}: name split failed`);
    const length = [...row.shortDefinition].length;
    if (length < 50 || length > 90) failures.push(`${row.elementId}: short definition length ${length}`);
  }
  const dedicatedGroups = new Set(Object.values(DEDICATED));
  if (dedicatedGroups.size > 6) failures.push(`dedicated groups ${dedicatedGroups.size} > 6`);
  for (const row of typology) if (row.specCaseCount !== cases.filter((item) => item.elementId === row.elementId && item.verified === "verified").length) failures.push(`${row.elementId}: case count ${row.specCaseCount} differs from sheet`);

  const mappedIds = cases.flatMap((item) => item.dataUsed).filter((item) => item.indicatorId);
  const mapping = {
    references: mappedIds.length,
    exact: mappedIds.filter((item) => item.mapped === "exact").length,
    prefix: mappedIds.filter((item) => item.mapped === "prefix").length,
    unmapped: mappedIds.filter((item) => item.mapped === "unmapped").map((item) => item.indicatorId),
    labelOnlyCases: cases.filter((item) => item.dataUsed.every((d) => d.mapped === "label-only")).map((item) => `${item.elementId}#${item.caseNo}`),
  };

  const generatedFrom = { workbook: "_source/spec/db_status_framework_v5.38_260922.xlsx", assignment: "docs/plan/V159_데이터유형화_명세.md §4" };
  // The finder renders 152 cards at once, so it gets only what a card shows;
  // the full spec and the cases load with the detail page.
  const typologyById = new Map(typology.map((row) => [row.elementId, row]));
  const cardRows = specRows.map((row) => {
    const users = new Map();
    for (const item of cases) if (item.elementId === row.elementId) for (const user of item.users) users.set(user, (users.get(user) || 0) + 1);
    return {
      elementId: row.elementId,
      sourceLabel: row.sourceLabel,
      baseName: row.baseName,
      shortDefinitionCard: row.shortDefinitionCard,
      displayType: typologyById.get(row.elementId).displayType,
      statusNotice: typologyById.get(row.elementId).statusNotice,
      users: [...users.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([user]) => user),
    };
  });
  const outputs = {
    "datasetCardSpecV159.json": { schemaVersion: "v159-card-spec-1", generatedFrom, rows: cardRows },
    "datasetSpecV159.json": { schemaVersion: "v159-dataset-spec-1", generatedFrom, rows: specRows },
    "useCasesV159.json": { schemaVersion: "v159-use-cases-1", generatedFrom, registryCountries: [...registry], cases },
    "countryTextViewsV162.json": viewsOut,
    "datasetTypologyV159.json": { schemaVersion: "v159-typology-1", generatedFrom, displayTypes: Object.values(DISPLAY_TYPES), structures: STRUCTURES, rows: typology },
  };

  const mappingGuard = lostMappings(cases);
  if (mappingGuard.lost.length || mappingGuard.next < mappingGuard.previous) {
    console.error(`use-case data mappings dropped: ${mappingGuard.previous} -> ${mappingGuard.next} (nothing written)`);
    for (const line of mappingGuard.lost) console.error(`  lost: ${line}`);
    process.exit(1);
  }

  if (CHECK) {
    let stale = 0;
    for (const [file, value] of Object.entries(outputs)) {
      const current = existsSync(resolve(OUT_DIR, file)) ? readFileSync(resolve(OUT_DIR, file), "utf8") : "";
      if (current.replace(/\r\n/g, "\n") !== `${JSON.stringify(value, null, 2)}\n`) { stale += 1; console.error(`stale: ${file}`); }
    }
    if (failures.length || stale) { console.error(failures.join("\n")); process.exit(1); }
    console.log("dataset spec v159 up to date");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(REPORT_DIR, { recursive: true });
  for (const [file, value] of Object.entries(outputs)) writeFileSync(resolve(OUT_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
  if (appliedOverrides.size !== OVERRIDES.length) {
    throw new Error(`overrides applied ${appliedOverrides.size}/${OVERRIDES.length} - a field or element does not match`);
  }
  writeReviews({ nameReview, cardReview, cautionReview, mapping, typology, cases });
  writeCorrections();
  writeCountryViews(viewLog, platformIso3);

  const summary = {
    spec: specRows.length,
    nameSplit: `${specRows.filter((row) => row.sourceLabel && row.baseName).length}/152`,
    cardDefinitionRemoved: cardReview.filter((row) => row.rule === "removed").length,
    cases: cases.length,
    pendingCases: pending.length,
    cautionReplaced: cautionReview.filter((row) => row.rule === "replaced").length,
    cautionKeptForCount: cautionReview.filter((row) => row.rule !== "replaced").length,
    indicatorMapping: `${mapping.exact + mapping.prefix}/${mapping.references}`,
    failures,
  };
  console.log(JSON.stringify(summary));
  if (failures.length) process.exit(1);
}

function writeCorrections() {
  const lines = [
    "# 명세서 문구 정정 요청 (V159)",
    "",
    "프레임워크 명세서(`db_status_framework_v5.38_260922.xlsx`)의 화면 문구 가운데 공개 화면 점검에서 걸린 표현입니다. 플랫폼은 아래 최소 수정을 `src/data/spec/specTextOverridesV159.json`으로 적용해 표시하고 있습니다. 명세서 원본을 고쳐 주시면 다음 적재에서 override를 지웁니다.",
    "",
    "`scripts/v159/import-dataset-spec-v159.mjs`가 생성합니다.",
    "",
    "| 요소 | 명세서 열 | 원문 | 플랫폼 표시 | 사유 | 기록일 |",
    "|---|---|---|---|---|---|",
    ...OVERRIDES.map((item) => `| ${item.elementId} | ${FIELD_COLUMN[item.field] || item.field} | ${mdCell(item.from)} | ${mdCell(item.to) || "(삭제)"} | ${mdCell(item.reason)} | ${item.date} |`),
    "",
  ];
  mkdirSync(dirname(CORRECTIONS_DOC), { recursive: true });
  writeFileSync(CORRECTIONS_DOC, lines.join("\n"));
}

const FIELD_COLUMN = { shortDefinition: "간략 정의", description: "상세 설명", usage: "활용 방법", caution: "활용 사례 · 유의점", dataUsed: "활용 사례 · 쓰는 데이터", logic: "활용 사례 · 논리 구조", storyline: "활용 사례 · 스토리라인 예시", purpose: "활용 사례 · 활용 목적", purposeEn: "활용 사례 · 활용 목적(영문)", refLink: "참고문헌 링크", refApa: "참고문헌(APA)", sourceOrg: "출처기관" };

const VIEW_RULE_V162 = {
  count: "나라 수 문장 → 국가 중립 문구",
  aside: "다른 나라 괄호 설명 제외",
  "count+aside": "나라 수 문장 + 괄호 제외",
  own: "다른 나라 고유 문장 → 이 나라 화면 비표시",
  "own-table": "국가별 문구(countryTextSplitV162.json)",
};

/**
 * V162: every sentence the country views changed, per viewing country - the
 * before/after the workbook owner needs for the v1.2 correction table.
 * Written to docs/handoff/v162/COUNTRY_TEXT_VIEWS_V162.md and summarised in
 * the V159 correction request.
 */
function writeCountryViews(viewLog, viewers) {
  const groups = new Map();
  for (const entry of viewLog) {
    const key = `${entry.elementId}|${entry.field}|${entry.caseNo ?? ""}|${entry.from}`;
    if (!groups.has(key)) groups.set(key, { elementId: entry.elementId, field: entry.field, caseNo: entry.caseNo, from: entry.from, views: {} });
    groups.get(key).views[entry.viewer] = { to: entry.to, rule: entry.rule };
  }
  const rows = [...groups.values()].sort((a, b) => a.elementId.localeCompare(b.elementId) || String(a.field).localeCompare(String(b.field)) || (a.caseNo ?? 0) - (b.caseNo ?? 0));
  const shown = (view) => (!view ? "(원문 그대로)" : view.to === null ? "(표시 안 함)" : mdCell(view.to));
  const rule = (group) => [...new Set(Object.values(group.views).map((view) => VIEW_RULE_V162[view.rule] || view.rule))].join(" · ");
  const ruleCounts = {};
  for (const entry of viewLog) ruleCounts[`${entry.viewer}:${entry.rule}`] = (ruleCounts[`${entry.viewer}:${entry.rule}`] || 0) + 1;
  const lines = [
    "# 국가별 문구 화면 (V162)",
    "",
    "명세서의 설명·활용 방법·활용 사례·유의점은 모든 나라 화면에 함께 쓰는 문구입니다. 그래서 특정 나라 이름을 담을 수 없습니다. 적재기는 `scripts/v162/country-neutral-v162.mjs`의 규칙으로 문장마다 나라별 화면 문구를 만들고, 원문은 고치지 않습니다.",
    "",
    "- **나라 수 문장**: '베트남·방글라데시 2개국에만 있다'처럼 나라 목록으로 수만 말하는 문장은, 목록을 나라 수로 만든 국가 중립 문구('대상 국가 중 2개국에만 있다')로 바꿉니다.",
    "- **괄호 설명**: 다른 나라를 다룬 괄호 설명('(방글라데시는 타카)')은 그 나라가 아닌 화면에서 뺍니다.",
    "- **다른 나라 고유 문장**: 괄호를 빼고도 다른 나라가 남는 문장은 그 나라의 고유 문장입니다. 여러 나라 내용이 한 문장에 섞인 경우에는 나라별 문구(`src/data/spec/countryTextSplitV162.json`)가 그 나라 문장을 줍니다. 없으면 표시하지 않습니다.",
    "- 대상 나라는 국가 레지스트리(`public/data/countries.json`)에서 읽습니다. 나라가 추가되면 다음 적재에서 규칙이 그대로 적용됩니다.",
    "",
    `적용 건수(화면 국가:규칙): ${Object.entries(ruleCounts).sort().map(([key, count]) => `${key} ${count}`).join(" · ")}`,
    "",
    "`scripts/v159/import-dataset-spec-v159.mjs`가 생성합니다. 명세서 v1.2 정정표를 만들 때 원천으로 씁니다.",
    "",
    `| 요소 | 명세서 열 | 사례 | 원문 | ${viewers.map((iso3) => `${iso3} 화면`).join(" | ")} | 규칙 |`,
    `|---|---|---|---|${viewers.map(() => "---").join("|")}|---|`,
    ...rows.map((group) => `| ${group.elementId} | ${FIELD_COLUMN[group.field] || group.field} | ${group.caseNo ?? ""} | ${mdCell(group.from)} | ${viewers.map((iso3) => shown(group.views[iso3])).join(" | ")} | ${rule(group)} |`),
    "",
  ];
  mkdirSync(dirname(COUNTRY_VIEWS_DOC), { recursive: true });
  writeFileSync(COUNTRY_VIEWS_DOC, lines.join("\n"));
  writeFileSync(resolve(ROOT, "reports/v162/country-text-views-v162.json"), `${JSON.stringify({ viewers, ruleCounts, rows }, null, 2)}\n`);
  // The V159 request points the workbook owner at the country table.
  const request = readFileSync(CORRECTIONS_DOC, "utf8");
  const defaultRows = rows.filter((group) => group.views[DEFAULT_COUNTRY]);
  writeFileSync(
    CORRECTIONS_DOC,
    `${request.replace(/\n+$/u, "")}\n\n## 국가 공통 문구의 나라 이름 (V162)\n\n설명·활용 사례·유의점은 모든 나라 화면에 함께 쓰는 문구라 특정 나라 이름을 담을 수 없습니다. 플랫폼은 규칙으로 나라별 화면 문구를 만들어 표시하고 있습니다. 기본 국가(${DEFAULT_COUNTRY}) 화면에서 바뀐 문장은 ${defaultRows.length}건이고, 나라별 전후 전체는 \`docs/handoff/v162/COUNTRY_TEXT_VIEWS_V162.md\`에 있습니다. 명세서에서 나라 공통 문장과 나라별 문장을 나눠 주시면 규칙 적용이 필요 없어집니다.\n`
  );
}

function mdCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function writeReviews({ nameReview, cardReview, cautionReview, mapping, typology, cases }) {
  const name = [
    "# 명칭 분리 검수표 (V159)",
    "",
    "`요소명_플랫폼` → 출처 윗줄(`sourceLabel`) + 원데이터명(`baseName`). 규칙: `auto-외`(' 외 ' 절까지) · `auto-latin`(앞쪽 라틴 토큰) · `rules-prefix`/`rules-no-prefix`(`src/data/spec/sourceLabelRulesV159.json`).",
    "",
    `- 분리 ${nameReview.filter((row) => row.sourceLabel && row.baseName).length}/152 · 규칙 보정 ${nameReview.filter((row) => row.rule.startsWith("rules")).length}건`,
    "",
    "| ID | 요소명_플랫폼 | 출처 윗줄 | 원데이터명 | 규칙 |",
    "|---|---|---|---|---|",
    ...nameReview.map((row) => `| ${row.elementId} | ${mdCell(row.platformName)} | ${mdCell(row.sourceLabel)} | ${mdCell(row.baseName)} | ${row.rule} |`),
    "",
  ];
  writeFileSync(resolve(REPORT_DIR, "name-split-review.md"), name.join("\n"));

  const card = [
    "# 카드용 간략 정의 검수표 (V159)",
    "",
    "규칙: 문두 `기관명(영문)이/가 ` 절만 제거한다. 괄호 속 기관명이 없거나(`no-org-name`), 이/가 앞에 이미 절이 있거나(`clause-before-subject`), 주어가 없으면(`no-subject`) 원문을 유지한다. 눈검토 뒤 문법이 깨지는 건은 `sourceLabelRulesV159.json`의 `shortDefinitionCardKeepOriginal`에 넣어 원문으로 되돌린다.",
    "",
    `- 제거 ${cardReview.filter((row) => row.rule === "removed").length}건 · 원문 유지 ${cardReview.filter((row) => row.rule !== "removed").length}건`,
    "",
    "| ID | 규칙 | 제거한 절 | 카드 문구 |",
    "|---|---|---|---|",
    ...cardReview.map((row) => `| ${row.elementId} | ${row.rule} | ${mdCell(row.removed)} | ${mdCell(row.shortDefinitionCard)} |`),
    "",
  ];
  writeFileSync(resolve(REPORT_DIR, "short-definition-card-review.md"), card.join("\n"));

  const caution = [
    "# 유의점 타국 문구 치환 목록 (V159)",
    "",
    "기준: 플랫폼 국가 레지스트리(`public/data/*/v2/manifest.json`의 국가). 레지스트리 밖 국가명은 목록에서 빼고, 남는 나라가 없으면 '일부 나라'로 바꾼다. 치환 뒤 문장에 국가 수 표현(`n개국`·`나머지` 등)이 남아 뜻이 틀어지면 원문을 유지한다(`keep-original(count)`). 화면은 치환문을 보이고 원문은 툴팁으로 둔다.",
    "",
    `- 치환 ${cautionReview.filter((row) => row.rule === "replaced").length}건 · 수 표현으로 원문 유지 ${cautionReview.filter((row) => row.rule !== "replaced").length}건`,
    "",
    "| 사례 | 규칙 | 바꾼 부분 | 화면 문구 |",
    "|---|---|---|---|",
    ...cautionReview.map((row) => `| ${row.elementId}#${row.caseNo} | ${row.rule} | ${mdCell(row.replacements.map((item) => `${item.from}→${item.to}`).join(", "))} | ${mdCell(row.cautionDisplay)} |`),
    "",
  ];
  writeFileSync(resolve(REPORT_DIR, "caution-substitutions.md"), caution.join("\n"));

  const byType = {};
  for (const row of typology) byType[row.displayType] = (byType[row.displayType] || 0) + 1;
  const byStructure = {};
  for (const row of typology) byStructure[row.structure] = (byStructure[row.structure] || 0) + 1;
  writeFileSync(
    resolve(REPORT_DIR, "spec-import-v159.json"),
    `${JSON.stringify({ byType, byStructure, flags: Object.fromEntries(["region", "tech", "geometry", "categorical", "scenario"].map((flag) => [flag, typology.filter((row) => row.flags[flag]).length])), dedicated: typology.filter((row) => row.dedicated).map((row) => row.elementId), cases: { total: cases.length, verified: cases.filter((item) => item.verified === "verified").length, pending: cases.filter((item) => item.verified === "pending").length, elements: new Set(cases.map((item) => item.elementId)).size }, indicatorMapping: mapping }, null, 2)}\n`,
  );
}

main();
