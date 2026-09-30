#!/usr/bin/env node
/**
 * P5 추적표: 요소별 VNM·BGD 열을 catalog·map-index·typology에서 그대로 뽑는다.
 *
 * `docs/FINALIZATION_TRACKER_V153.md`는 152개 요소마다 사람이 채운 서사(사용자
 * 지적·조치·담당·증빙)가 있는 문서다. 이 스크립트는 그것을 대신하지 않는다 — 국가별
 * 공개 상태·유형(S/U)·지도 표출·데이터 기준일·미입고 여부처럼 **파일에서 읽으면
 * 바로 나오는 값**만 자동으로 표로 만든다. 수작업 입력은 0이지만, 사람이 쓴 서사도
 * 0(그 부분은 이 표가 다루지 않는다).
 *
 * 기본은 미리보기(reports/p5/tracker-preview.md)만 쓴다 — 실제 트래커 파일은 P5
 * 실행 시점에 검토 후 `--write-tracker`로 반영한다(사람이 쓴 서사를 자동 생성으로
 * 조용히 덮어쓰지 않기 위함).
 *
 * 읽는 파일:
 *   public/data/<country>/v2/catalog.json   — publicStatus·dataPresenceStatus·
 *                                              latestYear·referenceYears·mapMode
 *   public/data/<country>/v2/map-index.json — 활성 레이어(실제 지도 표출)
 *   src/data/spec/datasetTypologyV159.json  — displayType·structure·coverage(VNM/BGD)
 *   public/data/countries.json              — 국가 레지스트리(live/preparing)
 *
 * Usage:
 *   node scripts/p5/build-tracker-p5.mjs                 (미리보기만, reports/p5/)
 *   node scripts/p5/build-tracker-p5.mjs --write-tracker  (docs/FINALIZATION_TRACKER_V153.md 표까지 갱신)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const WRITE_TRACKER = process.argv.includes("--write-tracker");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const countries = readJson(resolve(ROOT, "public/data/countries.json")).countries;
const typology = readJson(resolve(ROOT, "src/data/spec/datasetTypologyV159.json"));
const typologyById = new Map(typology.rows.map((row) => [row.elementId, row]));

/** 미입고를 뜻하는 값들. 원자료에 없는 것과 아직 안 온 것을 같은 말로 섞지 않는다. */
const NOT_PROVIDED_STATUSES = new Set(["not-provided"]);

function countryColumn(iso3) {
  const entry = countries.find((row) => row.iso3 === iso3);
  if (!entry) return null;
  const dataRoot = resolve(ROOT, "public", entry.dataRoot.replace(/^\//u, ""));
  const catalog = readJson(resolve(dataRoot, "catalog.json"));
  const mapIndex = readJson(resolve(dataRoot, "map-index.json"));
  const activeMapElements = new Set(
    (mapIndex.layers || []).filter((layer) => layer.enabled !== false).map((layer) => layer.elementId)
  );
  const byElement = new Map(catalog.elements.map((element) => [element.elementId, element]));
  return { iso3, status: entry.status, byElement, activeMapElements };
}

const VNM = countryColumn("VNM");
const BGD = countryColumn("BGD");
if (!VNM) throw new Error("VNM: public/data/countries.json에 없음");

/** 한 요소·한 나라의 5가지 사실을 한 칸에 압축한다. */
function cellFor(country, elementId) {
  if (!country) return "–(국가 미등록)";
  const element = country.byElement.get(elementId);
  if (!element) return "–(요소 미등록)";
  const typologyRow = typologyById.get(elementId);
  const coverage = typologyRow?.coverage?.[country.iso3] ?? "?";
  const su = typologyRow ? `${typologyRow.structure}·${typologyRow.displayType}(${coverage})` : "?";
  const onMap = country.activeMapElements.has(elementId) ? "지도○" : "지도✕";
  const asOf = element.latestYear ?? (element.referenceYears || [])[0] ?? "–";
  const notProvided = NOT_PROVIDED_STATUSES.has(element.publicStatus) || NOT_PROVIDED_STATUSES.has(element.dataPresenceStatus);
  const status = notProvided ? "미입고" : element.publicStatus;
  return `${status} · ${su} · ${onMap} · 기준 ${asOf}`;
}

const rows = VNM.byElement.size
  ? [...VNM.byElement.keys()].sort()
  : [...typologyById.keys()].sort();

const header = ["ID", "요소명", "유형(S/U)", "VNM(공개상태·유형(충족)·지도·기준일)", "BGD(공개상태·유형(충족)·지도·기준일)"];
const lines = [];
lines.push(`# P5 추적표 미리보기 — VNM·BGD 자동 생성(${new Date().toISOString().slice(0, 10)})`);
lines.push("");
lines.push(
  "이 표는 `catalog.json`·`map-index.json`·`src/data/spec/datasetTypologyV159.json`에서 읽은 값만 담는다. " +
  "사람이 쓴 서사(사용자 지적·조치·담당·증빙)는 `docs/FINALIZATION_TRACKER_V153.md`의 해당 열에 그대로 있다 — " +
  "이 표는 그 열을 대신하지 않는다."
);
lines.push("");
lines.push("범례: `공개상태`=catalog의 publicStatus(미입고=publicStatus 또는 dataPresenceStatus가 not-provided) · " +
  "`유형(충족)`=datasetTypologyV159의 구조·표출유형과 그 나라의 충족 여부(○ 충족/✕ 미달/–미수집/·대상외) · " +
  "`지도`=map-index.json의 활성 레이어 여부(대응표·계약상 목표가 아니라 지금 실제로 그려지는지) · " +
  "`기준일`=catalog의 latestYear(없으면 referenceYears 첫 값).");
lines.push("");
const tableHeadLine = `| ${header.join(" | ")} |`;
const tableRuleLine = `|${header.map(() => "---").join("|")}|`;
const tableRows = [];
let notProvidedVnm = 0, notProvidedBgd = 0, onMapVnm = 0, onMapBgd = 0;
let excludedVnm = 0, excludedBgd = 0;
const preparingVnm = [], preparingBgd = [];
for (const elementId of rows) {
  const typologyRow = typologyById.get(elementId);
  const name = VNM.byElement.get(elementId)?.elementLabel || BGD?.byElement.get(elementId)?.elementLabel || "";
  const su = typologyRow ? `${typologyRow.structure}·${typologyRow.displayType}` : "?";
  const vnmCell = cellFor(VNM, elementId);
  const bgdCell = cellFor(BGD, elementId);
  if (vnmCell.startsWith("미입고")) { notProvidedVnm += 1; preparingVnm.push(elementId); }
  if (bgdCell.startsWith("미입고")) { notProvidedBgd += 1; preparingBgd.push(elementId); }
  if (vnmCell.includes("지도○")) onMapVnm += 1;
  if (bgdCell.includes("지도○")) onMapBgd += 1;
  if (VNM.byElement.get(elementId)?.publicStatus === "excluded") excludedVnm += 1;
  if (BGD?.byElement.get(elementId)?.publicStatus === "excluded") excludedBgd += 1;
  tableRows.push(`| ${elementId} | ${String(name).replace(/\|/gu, "/")} | ${su} | ${vnmCell} | ${bgdCell} |`);
}
lines.push(tableHeadLine, tableRuleLine, ...tableRows);
lines.push("");
lines.push("## 집계");
lines.push("");
lines.push(`- 요소 수(프레임워크 전체): ${rows.length}`);
// 공개 = 전체 - 제외(publicStatus "excluded", 목록·집계에서 완전히 빠짐). '데이터
// 준비 중'(not-provided)은 공개 목록에는 있고 값만 없는 상태라 따로 뺀다.
lines.push(`- VNM 공개: ${rows.length - excludedVnm}(전체 ${rows.length} - 제외 ${excludedVnm}) · 그중 데이터 준비 중: ${notProvidedVnm}${preparingVnm.length ? `(${preparingVnm.join("·")})` : ""}`);
lines.push(`- BGD 공개: ${BGD ? rows.length - excludedBgd : "–"}${BGD ? `(전체 ${rows.length} - 제외 ${excludedBgd})` : "(국가 미등록)"} · 그중 데이터 준비 중: ${notProvidedBgd}${preparingBgd.length ? `(${preparingBgd.slice(0, 10).join("·")}${preparingBgd.length > 10 ? ` 외 ${preparingBgd.length - 10}건` : ""})` : ""}`);
lines.push(`- VNM 지도 표출(활성 레이어): ${onMapVnm}`);
lines.push(`- BGD 지도 표출(활성 레이어): ${onMapBgd}${BGD ? "" : "(국가 미등록)"}`);

mkdirSync(resolve(ROOT, "reports/p5"), { recursive: true });
const previewPath = resolve(ROOT, "reports/p5/tracker-preview.md");
writeFileSync(previewPath, `${lines.join("\n")}\n`, "utf8");

let trackerWritten = false;
if (WRITE_TRACKER) {
  const trackerPath = resolve(ROOT, "docs/FINALIZATION_TRACKER_V153.md");
  const existing = readFileSync(trackerPath, "utf8");
  const marker = "## 4. 152개 배정표";
  const idx = existing.indexOf(marker);
  const head = idx >= 0 ? existing.slice(0, idx) : existing;
  const rebuilt =
    `${head}${marker}(P5 자동 생성 — VNM·BGD, scripts/p5/build-tracker-p5.mjs, ${new Date().toISOString().slice(0, 10)})\n\n` +
    `${[tableHeadLine, tableRuleLine, ...tableRows].join("\n")}\n`;
  writeFileSync(trackerPath, rebuilt, "utf8");
  trackerWritten = true;
}

process.stdout.write(
  `${JSON.stringify({
    type: "summary", schema: "p5-tracker-preview", elements: rows.length,
    vnm: { published: rows.length - excludedVnm, excluded: excludedVnm, onMap: onMapVnm, notProvided: notProvidedVnm },
    bgd: BGD ? { published: rows.length - excludedBgd, excluded: excludedBgd, onMap: onMapBgd, notProvided: notProvidedBgd } : "국가 미등록",
    preview: previewPath.replace(ROOT, "").replace(/\\/gu, "/"),
    trackerWritten,
  })}\n`
);
