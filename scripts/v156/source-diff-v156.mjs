#!/usr/bin/env node
/**
 * Element-by-element diff between the published data tree and a candidate one.
 *
 * A delivery refresh changes values, indicators, units, spatial units and
 * sometimes the element's own title. None of that is visible in a build log, so
 * this reads the two trees the way a reader would - the catalog row and the
 * download payload per element - and states what changed before anything under
 * public/ is replaced.
 *
 * Inputs are trees, not sources: it works for any pair (v2 vs staging, staging
 * vs staging), which is what makes the refresh runbook re-runnable.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const CURRENT = resolve(ROOT, opt("--current", "public/data/vietnam/v2"));
const CANDIDATE = resolve(ROOT, opt("--candidate", ".staging/v156/public/data/vietnam/v2"));
const OUT_DIR = resolve(ROOT, opt("--out", "reports/v156"));
const DELIVERED_AT = opt("--delivered-at", "2026-09-22");

/**
 * Elements whose detail screen is a bespoke renderer or a declared contract, so
 * a schema change there breaks a screen rather than shifting a number.
 */
const BESPOKE_RENDERER_IDS = [
  "A-013", "A-016", "A-023", "A-024", "B-008", "B-046", "B-047",
  "C-012", "C-018", "D-005", "D-011", "D-022", "E-012",
];

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function catalogRows(tree) {
  const catalog = readJson(resolve(tree, "catalog.json"));
  return new Map(catalog.elements.map((row) => [row.elementId, row]));
}

function downloadPayload(tree, elementId) {
  const path = resolve(tree, "downloads", `${elementId.toLowerCase()}.json`);
  return existsSync(path) ? readJson(path) : null;
}

/** One comparable value per (indicator, year, period) - the reader's grain. */
function observationMap(payload) {
  const map = new Map();
  for (const row of payload?.observations || []) {
    const key = [row.indicatorId, row.year ?? "", row.period ?? "", row.recordId ?? ""].join("|");
    map.set(key, { value: row.value ?? null, unit: row.unit ?? null });
  }
  return map;
}

function indicatorMap(payload) {
  const map = new Map();
  for (const row of payload?.indicators || []) {
    map.set(row.indicatorId, {
      labelKo: row.labelKo ?? row.label ?? null,
      unit: row.unit ?? null,
      spatialScope: row.spatialScope ?? row.spatialUnit ?? null,
    });
  }
  return map;
}

function entityShape(payload) {
  const rows = payload?.entities || [];
  const keys = new Set();
  for (const row of rows) {
    for (const key of Object.keys(row.normalizedAttributes || {})) keys.add(key);
  }
  return { count: rows.length, attributeKeys: [...keys].sort() };
}

function latestYearOf(payload) {
  let latest = null;
  for (const row of payload?.observations || []) {
    const year = num(row.year);
    if (year !== null && (latest === null || year > latest)) latest = year;
  }
  return latest;
}

function missingRate(payload) {
  const rows = payload?.observations || [];
  if (rows.length === 0) return null;
  const missing = rows.filter((row) => row.value === null || row.value === undefined || row.value === "").length;
  return Math.round((missing / rows.length) * 1000) / 10;
}

const currentRows = catalogRows(CURRENT);
const candidateRows = catalogRows(CANDIDATE);
const elementIds = [...new Set([...currentRows.keys(), ...candidateRows.keys()])].sort();

const elements = [];
for (const elementId of elementIds) {
  const before = currentRows.get(elementId) || null;
  const after = candidateRows.get(elementId) || null;
  const beforePayload = before ? downloadPayload(CURRENT, elementId) : null;
  const afterPayload = after ? downloadPayload(CANDIDATE, elementId) : null;

  const beforeIndicators = indicatorMap(beforePayload);
  const afterIndicators = indicatorMap(afterPayload);
  const indicatorsAdded = [...afterIndicators.keys()].filter((id) => !beforeIndicators.has(id));
  const indicatorsRemoved = [...beforeIndicators.keys()].filter((id) => !afterIndicators.has(id));
  const indicatorsChanged = [];
  for (const [id, afterRow] of afterIndicators) {
    const beforeRow = beforeIndicators.get(id);
    if (!beforeRow) continue;
    const changes = {};
    for (const field of ["labelKo", "unit", "spatialScope"]) {
      if (beforeRow[field] !== afterRow[field]) changes[field] = { before: beforeRow[field], after: afterRow[field] };
    }
    if (Object.keys(changes).length > 0) indicatorsChanged.push({ indicatorId: id, changes });
  }

  const beforeObs = observationMap(beforePayload);
  const afterObs = observationMap(afterPayload);
  let matched = 0;
  let valueChanged = 0;
  let unitChanged = 0;
  const valueSamples = [];
  for (const [key, afterValue] of afterObs) {
    const beforeValue = beforeObs.get(key);
    if (!beforeValue) continue;
    matched += 1;
    if (beforeValue.unit !== afterValue.unit) unitChanged += 1;
    if (JSON.stringify(beforeValue.value) !== JSON.stringify(afterValue.value)) {
      valueChanged += 1;
      if (valueSamples.length < 5) {
        valueSamples.push({ key, before: beforeValue.value, after: afterValue.value });
      }
    }
  }
  const observationsAdded = [...afterObs.keys()].filter((key) => !beforeObs.has(key)).length;
  const observationsRemoved = [...beforeObs.keys()].filter((key) => !afterObs.has(key)).length;

  const beforeEntities = entityShape(beforePayload);
  const afterEntities = entityShape(afterPayload);
  const attributeKeysAdded = afterEntities.attributeKeys.filter((key) => !beforeEntities.attributeKeys.includes(key));
  const attributeKeysRemoved = beforeEntities.attributeKeys.filter((key) => !afterEntities.attributeKeys.includes(key));

  const beforeLatest = latestYearOf(beforePayload);
  const afterLatest = latestYearOf(afterPayload);
  const titleChanged = (before?.elementLabel ?? null) !== (after?.elementLabel ?? null);
  const statusChanges = {};
  for (const field of ["publicStatus", "dataPresenceStatus", "downloadAllowed", "displayAllowed", "detailTemplate"]) {
    if ((before?.[field] ?? null) !== (after?.[field] ?? null)) {
      statusChanges[field] = { before: before?.[field] ?? null, after: after?.[field] ?? null };
    }
  }
  const schemaBreaking =
    indicatorsRemoved.length > 0 ||
    attributeKeysRemoved.length > 0 ||
    unitChanged > 0 ||
    indicatorsChanged.some((row) => row.changes.unit || row.changes.spatialScope) ||
    (beforeLatest !== null && afterLatest !== null && afterLatest < beforeLatest) ||
    Boolean(statusChanges.dataPresenceStatus) ||
    Boolean(statusChanges.detailTemplate) ||
    !after ||
    !before;

  elements.push({
    elementId,
    present: { current: Boolean(before), candidate: Boolean(after) },
    label: { before: before?.elementLabel ?? null, after: after?.elementLabel ?? null, changed: titleChanged },
    statusChanges,
    counts: {
      indicators: { before: beforeIndicators.size, after: afterIndicators.size },
      observations: { before: beforeObs.size, after: afterObs.size },
      entities: { before: beforeEntities.count, after: afterEntities.count },
      latestYear: { before: beforeLatest, after: afterLatest },
      missingRatePercent: { before: missingRate(beforePayload), after: missingRate(afterPayload) },
    },
    indicators: { added: indicatorsAdded, removed: indicatorsRemoved, changed: indicatorsChanged },
    observations: {
      matched,
      valueChanged,
      valueChangeRatePercent: matched > 0 ? Math.round((valueChanged / matched) * 1000) / 10 : null,
      unitChanged,
      added: observationsAdded,
      removed: observationsRemoved,
      samples: valueSamples,
    },
    entities: { attributeKeysAdded, attributeKeysRemoved },
    flags: {
      titleChanged,
      schemaBreaking,
      bespokeRenderer: BESPOKE_RENDERER_IDS.includes(elementId),
      unchanged:
        !titleChanged &&
        Object.keys(statusChanges).length === 0 &&
        indicatorsAdded.length === 0 &&
        indicatorsRemoved.length === 0 &&
        indicatorsChanged.length === 0 &&
        valueChanged === 0 &&
        observationsAdded === 0 &&
        observationsRemoved === 0 &&
        attributeKeysAdded.length === 0 &&
        attributeKeysRemoved.length === 0 &&
        beforeEntities.count === afterEntities.count,
    },
  });
}

const report = {
  schemaVersion: "v156",
  generator: "scripts/v156/source-diff-v156.mjs",
  generatedAt: new Date().toISOString(),
  trees: { current: opt("--current", "public/data/vietnam/v2"), candidate: opt("--candidate", ".staging/v156/public/data/vietnam/v2") },
  deliveredAt: DELIVERED_AT,
  totals: {
    elements: elements.length,
    unchanged: elements.filter((row) => row.flags.unchanged).length,
    titleChanged: elements.filter((row) => row.flags.titleChanged).length,
    schemaBreaking: elements.filter((row) => row.flags.schemaBreaking).length,
    bespokeRendererAffected: elements.filter((row) => row.flags.bespokeRenderer && !row.flags.unchanged).length,
    valueChanged: elements.filter((row) => row.observations.valueChanged > 0).length,
    observationsAdded: elements.reduce((sum, row) => sum + row.observations.added, 0),
    observationsRemoved: elements.reduce((sum, row) => sum + row.observations.removed, 0),
    indicatorsAdded: elements.reduce((sum, row) => sum + row.indicators.added.length, 0),
    indicatorsRemoved: elements.reduce((sum, row) => sum + row.indicators.removed.length, 0),
  },
  elements,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "source-diff-v156.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

/** The Markdown is what a reviewer reads; it states counts, never opinions. */
const line = (row) =>
  `| ${row.elementId} | ${row.counts.observations.before}→${row.counts.observations.after} | ` +
  `${row.counts.entities.before}→${row.counts.entities.after} | ` +
  `${row.counts.indicators.before}→${row.counts.indicators.after} | ` +
  `${row.observations.valueChanged}${row.observations.valueChangeRatePercent === null ? "" : ` (${row.observations.valueChangeRatePercent}%)`} | ` +
  `${row.counts.latestYear.before ?? "—"}→${row.counts.latestYear.after ?? "—"} | ` +
  `${row.flags.titleChanged ? "제목" : ""}${row.flags.schemaBreaking ? " 스키마" : ""} |`;

const changed = elements.filter((row) => !row.flags.unchanged);
const md = [
  `# V156 원자료 갱신 diff — ${DELIVERED_AT} 입고분`,
  "",
  `- 대조: \`${report.trees.current}\` → \`${report.trees.candidate}\``,
  `- 요소 ${report.totals.elements}개 중 변화 없음 ${report.totals.unchanged}개, 변화 ${changed.length}개`,
  `- 제목 변경 ${report.totals.titleChanged}개 · 스키마 영향 ${report.totals.schemaBreaking}개 · 전용 렌더러 영향 ${report.totals.bespokeRendererAffected}개`,
  `- 지표 추가 ${report.totals.indicatorsAdded} · 지표 삭제 ${report.totals.indicatorsRemoved} · 관측 추가 ${report.totals.observationsAdded} · 관측 삭제 ${report.totals.observationsRemoved}`,
  "",
  "## 1. 변화 요소 일람",
  "",
  "| 요소 | 관측 | 엔티티 | 지표 | 값 변경 | 최신연도 | 영향 |",
  "|---|---|---|---|---|---|---|",
  ...changed.map(line),
  "",
  "## 2. 스키마 파괴 변경(전용 렌더러·계약 영향)",
  "",
  ...(() => {
    const rows = changed.filter((row) => row.flags.schemaBreaking);
    if (rows.length === 0) return ["없음."];
    return rows.flatMap((row) => [
      `### ${row.elementId}${row.flags.bespokeRenderer ? " · 전용 렌더러" : ""}`,
      "",
      ...(row.indicators.removed.length ? [`- 지표 삭제: ${row.indicators.removed.join(", ")}`] : []),
      ...(row.indicators.added.length ? [`- 지표 추가: ${row.indicators.added.join(", ")}`] : []),
      ...(row.indicators.changed.length
        ? [`- 지표 속성 변경: ${row.indicators.changed.map((item) => `${item.indicatorId}(${Object.keys(item.changes).join("·")})`).join(", ")}`]
        : []),
      ...(row.entities.attributeKeysRemoved.length ? [`- 엔티티 속성 삭제: ${row.entities.attributeKeysRemoved.join(", ")}`] : []),
      ...(row.entities.attributeKeysAdded.length ? [`- 엔티티 속성 추가: ${row.entities.attributeKeysAdded.join(", ")}`] : []),
      ...(row.observations.unitChanged ? [`- 단위 변경 관측 ${row.observations.unitChanged}건`] : []),
      ...(Object.keys(row.statusChanges).length
        ? [`- 상태 변경: ${Object.entries(row.statusChanges).map(([key, value]) => `${key} ${value.before}→${value.after}`).join(", ")}`]
        : []),
      ...(row.present.current && row.present.candidate ? [] : [`- 존재 여부: 현행 ${row.present.current}, 후보 ${row.present.candidate}`]),
      "",
    ]);
  })(),
  "## 3. 제목 변경",
  "",
  ...(() => {
    const rows = elements.filter((row) => row.flags.titleChanged);
    if (rows.length === 0) return ["없음."];
    return rows.flatMap((row) => [
      `- **${row.elementId}**`,
      `  - 현행: ${row.label.before ?? "—"}`,
      `  - 후보: ${row.label.after ?? "—"}`,
    ]);
  })(),
  "",
  "## 4. 값 변경률 상위 20",
  "",
  "| 요소 | 대조 관측 | 값 변경 | 변경률 | 표본(키: 현행→후보) |",
  "|---|---|---|---|---|",
  ...changed
    .filter((row) => row.observations.valueChanged > 0)
    .sort((left, right) => (right.observations.valueChangeRatePercent ?? 0) - (left.observations.valueChangeRatePercent ?? 0))
    .slice(0, 20)
    .map(
      (row) =>
        `| ${row.elementId} | ${row.observations.matched} | ${row.observations.valueChanged} | ${row.observations.valueChangeRatePercent}% | ` +
        `${row.observations.samples.slice(0, 2).map((s) => `${s.key}: ${s.before}→${s.after}`).join(" / ")} |`
    ),
  "",
].join("\n");
writeFileSync(resolve(OUT_DIR, "source-diff-v156.md"), `${md}\n`, "utf8");

console.log(JSON.stringify({ type: "summary", schemaVersion: "v156", ...report.totals, out: `${opt("--out", "reports/v156")}/source-diff-v156.{json,md}` }));
