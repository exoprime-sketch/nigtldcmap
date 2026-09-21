// V150 dataset descriptions: 152 concise phrases shown on the finder card and
// the detail hero. This review lists every violation of the V150 copy rules so
// the JSON can be corrected by hand — it never rewrites the strings itself.
//
//   node scripts/v150/description-review-v150.mjs [--out reports/v150/DESCRIPTION_REVIEW_V150.md]
//
// Rules: (a) no sentence-final verb forms, (b) at most 40 characters,
// (c) the dataset name is not repeated verbatim, (d) one string per element,
// consumed by finder card, detail hero and analysis heading alike (the code
// path is asserted here; the rendered screens are compared by
// review-runtime-v150.mjs).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const outArg = args.indexOf("--out");
const OUT = resolve(ROOT, outArg >= 0 ? args[outArg + 1] : "reports/v150/DESCRIPTION_REVIEW_V150.md");

const descriptions = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/datasetDescriptionsV150.json"), "utf8"));
const catalog = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8"));
const labels = new Map(catalog.elements.map((element) => [element.elementId, element.elementLabel]));
// The finder card shows the public title, not the catalogue label; the V135
// finder-card audit treats a description that adds fewer than six characters
// beyond that title as generic.
const publicTitles = new Map(JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/home/card-summaries-v140.json"), "utf8")).cards.map((card) => [card.elementId, card.title]));
function restatesPublicTitle(title, text) {
  if (!title) return false;
  if (text === title) return true;
  return text.replace(title, "").replace(/[의·\s]/gu, "").length < 6;
}

const SENTENCE_ENDING = /(습니다|입니다|합니다|됩니다|할 수 있|볼 수 있|확인할 수|제공합니다|보여줍니다)\.?$/u;
const SENTENCE_ANYWHERE = /(습니다|입니다|합니다|됩니다|할 수 있|볼 수 있)/u;
const MAX_LENGTH = 40;

// "Repeating the dataset name" means restating the title itself: the whole
// name (brackets and parentheses removed) appears verbatim, or the description
// opens with the name. Domain nouns shared with the title (실업률, 배출량 …) are
// the vocabulary of the dataset, not a repetition.
function nameForms(label) {
  const base = String(label || "")
    .replace(/\[[^\]]*\]/gu, " ")
    .replace(/\([^)]*\)/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const compact = base.replace(/[\s·,/]+/gu, "");
  return [...new Set([base, compact].filter((form) => form.length >= 4))];
}
function repeatsName(label, text) {
  const compactText = text.replace(/[\s·,/]+/gu, "");
  return nameForms(label).filter((form) => text.includes(form) || compactText.includes(form.replace(/[\s·,/]+/gu, "")) || text.startsWith(form));
}

const rows = [];
const violations = [];
for (const [elementId, label] of labels) {
  const text = descriptions[elementId];
  const issues = [];
  if (typeof text !== "string" || !text.trim()) {
    issues.push("설명 없음");
  } else {
    if (SENTENCE_ENDING.test(text) || SENTENCE_ANYWHERE.test(text)) issues.push("문장형 종결");
    if ([...text].length > MAX_LENGTH) issues.push(`${[...text].length}자 (> ${MAX_LENGTH})`);
    const repeated = repeatsName(label, text);
    if (repeated.length) issues.push(`데이터명 반복: ${repeated.join(", ")}`);
    if (restatesPublicTitle(publicTitles.get(elementId), text)) issues.push(`공개 제목 재진술: ${publicTitles.get(elementId)}`);
  }
  rows.push({ elementId, label, text: text ?? "", length: text ? [...text].length : 0, issues });
  if (issues.length) violations.push(rows[rows.length - 1]);
}
const extraKeys = Object.keys(descriptions).filter((key) => !labels.has(key));

// (d) code path: every consumer reads descriptionsV150[elementId] first.
const consumers = [
  ["src/data/visualization/publicDatasetDescriptionV135.ts", /descriptionsV150 as Record<string, string>\)\[input\.elementId\]/u],
  ["src/data/visualization/publicCopyRegistryV126.ts", /descriptionsV150 as Record<string, string>\)\[elementId\]/u],
  ["src/data/visualization/publicAnalysisHeadingsV134.ts", /descriptionsV150 as Record<string, string>\)\[spec\.elementId\]/u],
];
const consumerRows = consumers.map(([file, pattern]) => ({
  file,
  ok: pattern.test(readFileSync(resolve(ROOT, file), "utf8")),
}));

const lengths = rows.map((row) => row.length);
const summary = {
  count: rows.length,
  violations: violations.length,
  extraKeys: extraKeys.length,
  maxLength: Math.max(...lengths),
  minLength: Math.min(...lengths),
  consumersOk: consumerRows.every((row) => row.ok),
};

const lines = [];
lines.push("# 설명 152개 개조식 점검 V150");
lines.push("");
lines.push(`- 생성: ${new Date().toISOString()} · 스크립트 \`scripts/v150/description-review-v150.mjs\``);
lines.push(`- 항목 ${summary.count}개 · 위반 ${summary.violations}건 · 카탈로그 외 키 ${summary.extraKeys}개 · 길이 ${summary.minLength}~${summary.maxLength}자`);
lines.push("- 규칙: (a) 문장형 종결 0건 (b) 40자 이하 (c) 데이터명(괄호 제외 전체 명칭) 반복 없음, 공개 제목에 6자 이상을 더함 — 공통 도메인 명사는 반복으로 보지 않음 (d) 찾기 카드·상세 히어로·분석 제목이 같은 문자열을 사용");
lines.push("- 홈 카드는 제목·요약값만 표시하고 설명 문자열을 렌더하지 않는다(HomePage.tsx). 따라서 (d)는 찾기 카드와 상세 히어로의 일치로 판정한다.");
lines.push("");
lines.push("## (d) 소비 경로");
lines.push("");
lines.push("| 파일 | V150 문자열 우선 사용 |");
lines.push("|---|---|");
for (const row of consumerRows) lines.push(`| \`${row.file}\` | ${row.ok ? "예" : "**아니오**"} |`);
lines.push("");
lines.push("## 위반 목록");
lines.push("");
if (violations.length === 0) {
  lines.push("위반 없음.");
} else {
  lines.push("| 항목 | 데이터명 | 설명 | 위반 |");
  lines.push("|---|---|---|---|");
  for (const row of violations) lines.push(`| ${row.elementId} | ${row.label} | ${row.text} | ${row.issues.join("; ")} |`);
}
if (extraKeys.length) {
  lines.push("");
  lines.push(`카탈로그에 없는 키: ${extraKeys.join(", ")}`);
}
lines.push("");
lines.push("## 전체 152개");
lines.push("");
lines.push("| 항목 | 데이터명 | 설명 | 길이 |");
lines.push("|---|---|---|---|");
for (const row of rows) lines.push(`| ${row.elementId} | ${row.label} | ${row.text} | ${row.length} |`);
lines.push("");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(JSON.stringify(summary));
for (const row of violations) console.log(`${row.elementId}\t${row.issues.join("; ")}\t${row.text}`);
process.exitCode = violations.length || extraKeys.length || !summary.consumersOk ? 1 : 0;
