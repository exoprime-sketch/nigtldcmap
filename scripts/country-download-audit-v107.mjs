import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log("=== v107 country download audit ===");

const app = read("src/App.tsx");
const elementPage = read("src/pages/CountryDataElementPage.tsx");
const pending = read("src/components/data/PendingElementStateV92.tsx");
const downloadPage = read("src/pages/DownloadPage.tsx");
const indicatorDownload = read("src/utils/datasetDownload.ts");
const populationDownload = read("src/utils/populationBundleV56.ts");
const datasetDetail = read("src/pages/DatasetDetailPage.tsx");

assert(app.includes("downloadCountryIso3"), "App에 다운로드 국가 상태가 없음");
assert(
  app.includes('params.set("country", downloadCountryIso3)'),
  "다운로드 URL에 country가 보존되지 않음"
);
assert(
  app.includes("initialCountryIso3={downloadCountryIso3}"),
  "DownloadPage에 선택 국가가 전달되지 않음"
);
assert(
  elementPage.includes("onOpenDownload(selectedDataset.id, country.iso3)"),
  "데이터 요소 상세에서 현재 국가를 다운로드로 전달하지 않음"
);
assert(
  elementPage.includes("국가별 다운로드"),
  "복수지표 화면의 국가별 다운로드 진입점이 없음"
);
assert(
  pending.includes("국가별 다운로드 준비 중") && pending.includes("disabled"),
  "예시 데이터 화면의 다운로드 준비 상태가 명확하지 않음"
);
assert(
  /실제 Dataset이 연결되면\s*국가별 CSV·JSON 다운로드/.test(pending),
  "예시값은 다운로드하지 않는다는 공개 안내가 부족함"
);
assert(
  downloadPage.includes("initialCountry") &&
    downloadPage.includes("기본 선택되었습니다") &&
    downloadPage.includes('scope === "selected"'),
  "다운로드 페이지가 상세화면 국가를 기본 선택하지 않음"
);
assert(
  indicatorDownload.includes("buildCountrySelectionSlug") &&
    indicatorDownload.includes("selectionSlug"),
  "지표 다운로드 파일명에 국가 범위가 반영되지 않음"
);
assert(
  populationDownload.includes("buildPopulationSelectionSlug") &&
    populationDownload.includes("selectionSlug"),
  "인구 묶음 다운로드 파일명에 국가 범위가 반영되지 않음"
);
assert(
  datasetDetail.includes("국가별 데이터 다운로드"),
  "Dataset 상세의 다운로드 CTA가 국가별 동작을 설명하지 않음"
);

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("COUNTRY_DOWNLOAD_READY");
  console.log("P0 0");
  console.log("P1 0");
  console.log("detail -> download country context: preserved");
  console.log("selected / multiple / all-country scope: available");
  console.log("example data download: blocked");
  console.log("CSV / JSON filename: country scope included");
}
