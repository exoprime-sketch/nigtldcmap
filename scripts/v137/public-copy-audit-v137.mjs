#!/usr/bin/env node
/**
 * Does the public text read like a public-institution service?
 *
 * Two questions, both answered from what the screens actually rendered:
 *
 * 1. Is anything internal showing - a source column key, a collection-log
 *    entry, a working note, a file name, a hashed field id?
 * 2. Does each screen still state the things a reader needs: the providing
 *    body, the period the data covers, and a way to the official source?
 *
 * Reads the census this session already collected rather than opening the
 * screens again, so the two always describe the same build.
 */
import { resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ROOT = resolve(import.meta.dirname, "../..");
const DIR = resolve(ROOT, "reports/final-data-integration/screen-review");
const census = JSON.parse(readFileSync(resolve(DIR, `screen-census-v137-1440.json`), "utf8"));

/** Text that addresses whoever maintains the sheet, not a reader. */
const INTERNAL_PATTERNS = [
  { id: "source-column-key", re: /\battr_\d+\b|\bfield_[0-9a-f]{8}\b|\bmeasure-[0-9a-f]{12}\b|속성\d+_/u },
  { id: "record-key", re: /\bVNM\.\d+_\d+\b|\bv1(?:24|37)-[a-z0-9-]{6,}/u },
  { id: "collection-log", re: /수집현황\s*v?\d|raw:\s*[A-Z]-\d{3}|\[\d차\s*정정\]|이슈로그|발주처\s*지시/u },
  // 재판정 only where it stands alone; 중재판정 is an arbitral award.
  { id: "working-note", re: /DoD\s*S-\d{2}|잠정\]|(?<![가-힣])재판정|TODO|FIXME/u },
  { id: "file-or-sheet", re: /\.xlsx\b|\.md\b|1\.2_entity|시트\s*attr|열\s*참조/u },
  { id: "internal-tech-note", re: /tech_id|기술매핑_근거|원지표ID|기술코드_판단근거/u },
];

/** What a reader has to be able to find on any data screen. */
const REQUIRED_SOURCE_TERMS = ["제공기관", "자료기간"];

/**
 * Labels a screen is expected to repeat: one per card, one per legend entry,
 * one per table row. A series name shown in the legend, in the chart and in
 * the selected-year detail is the same screen saying the same true thing
 * three times, not a duplicated heading.
 */
const REPEATABLE_LABELS =
  /^(?:공식 원문|문서 원문|원문 보기|값|단위|기준연도|시점|건|년|개|자료 없음|숨기기|표시 중|꺼짐|전체|접기|축소|확대|표시기간)$/u;

function duplicateHeadings(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line.length > 12 && line.length < 60 && !REPEATABLE_LABELS.test(line)
    );
  const counts = new Map();
  for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);
  return [...counts]
    .filter(([, count]) => count > 3)
    .map(([line, count]) => `${line} ×${count}`)
    .slice(0, 3);
}

const rows = [];
for (const row of census.rows) {
  const screen = `${row.primaryText || ""}\n${row.sourcePanel || ""}`;
  const internal = INTERNAL_PATTERNS.filter((pattern) => pattern.re.test(screen)).map(
    (pattern) => ({
      id: pattern.id,
      sample: (screen.match(new RegExp(pattern.re, "u")) || [""])[0].slice(0, 60),
    })
  );
  const missingTerms = REQUIRED_SOURCE_TERMS.filter(
    (term) => !String(row.sourcePanel || "").includes(term)
  );
  const repeats = duplicateHeadings(row.primaryText);
  const problems = internal.length + missingTerms.length + (repeats.length ? 1 : 0);
  rows.push({
    elementId: row.elementId,
    internal,
    missingSourceTerms: missingTerms,
    repeatedLines: repeats,
    status: problems ? "REVIEW" : "OK",
  });
}

const flagged = rows.filter((row) => row.status === "REVIEW");
const result = {
  schema: "nigt-public-copy-audit-1",
  generatedAt: new Date().toISOString(),
  screens: rows.length,
  flagged: flagged.length,
  byPattern: Object.fromEntries(
    INTERNAL_PATTERNS.map((pattern) => [
      pattern.id,
      rows.filter((row) => row.internal.some((item) => item.id === pattern.id)).map((row) => row.elementId),
    ])
  ),
  missingSourceTerms: rows.filter((row) => row.missingSourceTerms.length).map((row) => row.elementId),
  rows: flagged,
};
mkdirSync(DIR, { recursive: true });
writeFileSync(resolve(DIR, "public-copy-audit-v137.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify({ screens: result.screens, flagged: result.flagged, byPattern: result.byPattern, missingSourceTerms: result.missingSourceTerms }, null, 2)
);
process.exit(flagged.length ? 1 : 0);
