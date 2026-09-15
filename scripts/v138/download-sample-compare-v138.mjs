/**
 * Download sample comparison (V138).
 *
 * For a sample of elements, the same headline numbers are computed from the
 * public download files (`downloads/<id>.json`) with the rules the screens
 * state, and compared with what the browser actually showed in the last
 * screen review (`reports/v138/screen-review-v138.json`) and map QA
 * (`reports/v138/map-runtime-qa-v138.json`). A number that is not on the
 * screen text is reported as "not shown", never as a match.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const V2 = resolve(ROOT, "public/data/vietnam/v2");
const OUT = resolve(ROOT, "reports/v138");
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const download = (id) => read(resolve(V2, "downloads", `${id.toLowerCase()}.json`));
const screens = read(resolve(OUT, "screen-review-v138.json")).rows;
const mapQa = read(resolve(OUT, "map-runtime-qa-v138.json"));
const mapIndex = read(resolve(V2, "map-index.json"));

const screenText = (id) => {
  const row = screens.find((item) => item.elementId === id);
  return row ? [row.representative, row.question, row.source].filter(Boolean).join(" ") : "";
};
const mapText = (id) => {
  const row = mapQa.layers.find((item) => item.elementId === id);
  return row ? [row.summary, row.analysis, row.selectedPanel].filter(Boolean).join(" ") : "";
};
const number = (value) => Number(value).toLocaleString("en-US");
const shows = (text, needle) => text.replace(/\s+/g, " ").includes(needle);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const inBox = (row, box) =>
  finite(row.latitude) && finite(row.longitude) &&
  row.latitude >= box.south && row.latitude <= box.north && row.longitude >= box.west && row.longitude <= box.east;

const rows = [];
function compare(id, label, computed, needle, surface) {
  const text = surface === "map" ? mapText(id) : screenText(id);
  const shown = shows(text, needle);
  rows.push({ elementId: id, surface, figure: label, download: computed, screenNeedle: needle, result: shown ? "match" : text ? "not shown" : "screen text missing" });
}

// B-017: assessment zones with a water-stress value, and delivered rows.
{
  const d = download("B-017");
  const zones = d.entities.filter((row) => row.indicatorId === "B-017_aqueduct40_basin_adm1");
  compare("B-017", "평가구역 수", zones.length, `평가구역 ${number(zones.length)}개`, "detail");
  const provinces = new Set(zones.map((row) => row.normalizedAttributes?.["지역명_로마자"]).filter(Boolean));
  compare("B-017", "성·시 수", provinces.size, `${provinces.size}개 성·시`, "detail");
}
// A-023: rows per registry and rows with a coordinate.
{
  const d = download("A-023");
  const wri = d.entities.filter((row) => row.indicatorId === "A-023_power_plant_registry").length;
  const osm = d.entities.filter((row) => row.indicatorId === "A-023_power_plant_registry_osm2026").length;
  const located = d.entities.filter((row) => finite(row.latitude) && finite(row.longitude)).length;
  compare("A-023", "원천 수록 행", d.entities.length, `${number(d.entities.length)} 행`, "detail");
  compare("A-023", "원천 수록 행(지도)", d.entities.length, `${number(d.entities.length)}행`, "map");
  compare("A-023", "WRI 행", wri, `WRI GPPD 수록 ${number(wri)}행`, "map");
  compare("A-023", "OSM 행", osm, `OSM 추출 ${number(osm)}행`, "map");
  compare("A-023", "위치자료 보유", located, `위치자료 보유(지도 표시) ${number(located)}곳`, "map");
}
// B-003: observed provinces and year span.
{
  const d = download("B-003");
  const years = d.entities.map((row) => Number(row.normalizedAttributes?.["연도"] ?? row.normalizedAttributes?.["기준연도"])).filter(Number.isFinite);
  const provinces = new Set(d.entities.map((row) => row.normalizedAttributes?.["지역명_로마자"]).filter((v) => v && !/전국|Viet ?Nam/iu.test(String(v))));
  const span = years.length ? `${Math.min(...years)}~${Math.max(...years)}년` : "";
  compare("B-003", "연도 범위", span, span, "detail");
  compare("B-003", "성·시 수(지도)", provinces.size, `${provinces.size}/63개 성·시`, "map");
}
// B-008: stations and projection rows.
{
  const d = download("B-008");
  const stations = new Set(d.entities.map((row) => row.normalizedAttributes?.["PSMSL_관측소_ID"]).filter(Boolean));
  compare("B-008", "관측소 수", stations.size, `관측소 수 ${stations.size}곳`, "detail");
  compare("B-008", "관측소 수(지도)", stations.size, `관측소 수(지도 표시) ${stations.size}곳`, "map");
  compare("B-008", "전망값 행(지도)", d.entities.length, `${number(d.entities.length)}행`, "map");
}
// E-018: unique companies, withdrawn rows, and rows the map can place.
{
  const d = download("E-018");
  const layer = mapIndex.layers.find((item) => item.elementId === "E-018");
  const box = layer?.displayScope?.bbox;
  const excluded = new RegExp(layer?.excludeWhere?.["진출_상태"] || "^$", "u");
  const companies = new Set(d.entities.map((row) => row.normalizedAttributes?.["기업명"] || row.name));
  const active = d.entities.filter((row) => !excluded.test(String(row.normalizedAttributes?.["진출_상태"] || "")));
  const placed = active.filter((row) => box && inBox(row, box)).length;
  compare("E-018", "고유 기업 수", companies.size, `고유 기업 수 ${companies.size} 곳`, "detail");
  compare("E-018", "지도 표시 사업지(진출 상태·국내 좌표)", placed, `한국 기업 진출 수(지도 표시) ${placed}곳`, "map");
  compare("E-018", "좌표 없는 활동 기업", active.length - placed, `위치자료 없음(지도 미표시) ${active.length - placed}곳`, "map");
}
// C-025: projects, and projects with a coordinate in Vietnam.
{
  const d = download("C-025");
  const layer = mapIndex.layers.find((item) => item.elementId === "C-025");
  const located = d.entities.filter((row) => finite(row.latitude) && finite(row.longitude)).length;
  compare("C-025", "총 사업 수", d.entities.length, `총 사업 수 ${d.entities.length} 건`, "detail");
  compare("C-025", "지도 표시 사업 수", located, `탄소크레딧 사업 수(지도 표시) ${located}건`, "map");
  compare("C-025", "지도 레이어 피처 수", layer?.featureCount ?? null, `${layer?.featureCount}건`, "map");
}
// B-048: mines with a coordinate.
{
  const d = download("B-048");
  const located = d.entities.filter((row) => finite(row.latitude) && finite(row.longitude)).length;
  compare("B-048", "위치 있는 광산", located, `주요 광산 수(지도 표시) ${located}곳`, "map");
  compare("B-048", "위치 없는 광산", d.entities.length - located, `위치자료 없음(지도 미표시) ${d.entities.length - located}곳`, "map");
}

const summary = {
  compared: rows.length,
  match: rows.filter((row) => row.result === "match").length,
  notShown: rows.filter((row) => row.result !== "match").map((row) => `${row.elementId}:${row.figure}`),
};
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, "download-sample-compare-v138.json"), JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2));
writeFileSync(
  resolve(OUT, "download-sample-compare-v138.md"),
  [
    "# 다운로드 표본 대조 (V138)",
    "",
    `생성: ${new Date().toISOString()} · 대조 ${summary.compared}건 · 일치 ${summary.match}건 · 불일치/미표시 ${summary.notShown.length}건`,
    "",
    "다운로드 파일(`downloads/<id>.json`)에서 화면이 말하는 규칙대로 다시 센 값과, 브라우저 검토(`screen-review-v138.json`, `map-runtime-qa-v138.json`)가 실제로 캡처한 화면 문구를 대조한다.",
    "",
    "| 요소 | 화면 | 수치 | 다운로드 재계산 | 화면에서 찾은 문구 | 결과 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.elementId} | ${row.surface} | ${row.figure} | ${row.download} | ${row.screenNeedle} | ${row.result} |`),
    "",
  ].join("\n")
);
console.log(JSON.stringify(summary));
process.exit(summary.notShown.length ? 1 : 0);
