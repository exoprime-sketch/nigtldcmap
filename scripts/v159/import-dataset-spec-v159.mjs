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
 *
 * Usage:
 *   node scripts/v159/import-dataset-spec-v159.mjs [--xlsx <path>] [--check]
 */
import { spawnSync } from "node:child_process";
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

const DISPLAY_TYPES = {
  "①": { code: "U1", label: "국가 수준·추세" },
  "②": { code: "U2", label: "지역·입지" },
  "③": { code: "U3", label: "기술별 비교" },
  "④": { code: "U4", label: "시설·기관·인프라 위치" },
  "⑤": { code: "U5", label: "사업·재원" },
  "⑥": { code: "U6", label: "제도·규제·리스크" },
  "⓪": { code: "U0", label: "상태 안내" },
};
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

// ---------------------------------------------------------------- caution countries
function registryCountries() {
  const dataRoot = resolve(ROOT, "public/data");
  const iso3 = new Set();
  for (const entry of readdirSync(dataRoot, { withFileTypes: true })) {
    const manifest = resolve(dataRoot, entry.name, "v2/manifest.json");
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const parsed = JSON.parse(readFileSync(manifest, "utf8"));
    const code = parsed.countryIso3 || parsed.country?.iso3;
    if (code) iso3.add(String(code).toUpperCase());
  }
  return iso3;
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
  // A count next to a shortened list ("베트남·방글라데시 2개국", "나머지 9개국",
  // "방글라데시 3개소") would become false after the swap; keep the source text.
  if (/\d+\s?(개국|개소|곳)|두 (곳|나라)|세 나라|나머지/.test(replaced)) return { value: caution, replacements, rule: "keep-original(count)" };
  // Two placeholders, or a placeholder joined to another name, read as noise.
  if ((replaced.match(/일부 나라/g) || []).length > 1 || /·일부 나라|일부 나라·|나라[은는] 일부 나라/.test(replaced)) {
    return { value: caution, replacements, rule: "keep-original(list)" };
  }
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
function catalogIndicators() {
  const dir = resolve(ROOT, "public/data/vietnam/v2/downloads");
  const ids = new Set();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const parsed = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
    for (const indicator of parsed.indicators || []) if (indicator.indicatorId) ids.add(indicator.indicatorId);
  }
  return ids;
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
    const shortDefinition = text(row[c("간략 정의")]);
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
      description: text(row[c("상세 설명")]),
      usage: text(row[c("활용 방법")]),
      definitionKo: text(row[c("정의(국문)")]),
      sourceOrg: text(row[c("출처기관")]),
      refLink: text(row[c("참고문헌 링크")]),
      refApa: text(row[c("참고문헌(APA)")]),
      checkedAt: text(row[c("확인일자")]).slice(0, 10),
      decision: text(row[c("금년도 최종 결정")]) || null,
    });
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
      const caution = text(row[u("유의점")]);
      const display = cautionForRegistry(caution, countries, registry);
      if (display.replacements.length) cautionReview.push({ elementId, caseNo: Number(text(row[u("사례 번호")])), caution, cautionDisplay: display.value, rule: display.rule, replacements: display.replacements });
      return {
        elementId,
        caseNo: Number(text(row[u("사례 번호")])),
        purpose: en ? purposeRaw.slice(0, en.index).trim() : purposeRaw,
        purposeEn: en ? en[1].trim() : "",
        logic: text(row[u("논리 구조")]),
        dataUsed: parseDataUsed(text(row[u("쓰는 데이터")]), catalog),
        storyline: text(row[u("스토리라인 예시")]),
        users: text(row[u("주 사용자")]).split(/\s*·\s*/).filter(Boolean),
        caution,
        cautionDisplay: display.value,
        verified: "verified",
        verificationResult: text(row[u("검증 결과")]),
      };
    });
  const pending = existsSync(PENDING_CASES_PATH) ? JSON.parse(readFileSync(PENDING_CASES_PATH, "utf8")).cases || [] : [];
  for (const item of pending) {
    cases.push({ ...item, dataUsed: parseDataUsed(item.dataUsedText || "", catalog), cautionDisplay: item.caution, verified: "pending", verificationResult: "검증 대기" });
  }
  for (const item of cases) delete item.dataUsedText;
  cases.sort((a, b) => a.elementId.localeCompare(b.elementId) || a.caseNo - b.caseNo);

  // typology
  const specById = new Map(specRows.map((row) => [row.elementId, row]));
  const typology = typologyRows.map((row) => {
    const specRow = specById.get(row.elementId);
    if (!specRow) throw new Error(`${row.elementId}: not in spec sheet`);
    const type = DISPLAY_TYPES[row.displayKey];
    const scenario = [...catalog].some((id) => id.startsWith(`${row.elementId}_`) && /(^|_)(ssp\d|rcp\d|scenario)/i.test(id));
    return {
      elementId: row.elementId,
      displayType: type.code,
      displayTypeLabel: type.label,
      structure: row.structure,
      structureLabel: STRUCTURES[row.structure],
      flags: {
        region: row.region,
        tech: row.tech,
        geometry: mapElements.has(row.elementId),
        categorical: /범주형/.test(row.variant),
        scenario,
      },
      status: row.status,
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
  const outputs = {
    "datasetSpecV159.json": { schemaVersion: "v159-dataset-spec-1", generatedFrom, rows: specRows },
    "useCasesV159.json": { schemaVersion: "v159-use-cases-1", generatedFrom, registryCountries: [...registry], cases },
    "datasetTypologyV159.json": { schemaVersion: "v159-typology-1", generatedFrom, displayTypes: Object.values(DISPLAY_TYPES), structures: STRUCTURES, rows: typology },
  };

  if (CHECK) {
    let stale = 0;
    for (const [file, value] of Object.entries(outputs)) {
      const current = existsSync(resolve(OUT_DIR, file)) ? readFileSync(resolve(OUT_DIR, file), "utf8") : "";
      if (current !== `${JSON.stringify(value, null, 2)}\n`) { stale += 1; console.error(`stale: ${file}`); }
    }
    if (failures.length || stale) { console.error(failures.join("\n")); process.exit(1); }
    console.log("dataset spec v159 up to date");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(REPORT_DIR, { recursive: true });
  for (const [file, value] of Object.entries(outputs)) writeFileSync(resolve(OUT_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
  writeReviews({ nameReview, cardReview, cautionReview, mapping, typology, cases });

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

function mdCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
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
