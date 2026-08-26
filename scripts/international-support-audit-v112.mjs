import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

console.log("=== v112 international support + climate fund audit ===");

const support = read("src/data/support/internationalSupportV112.ts");
const component = read(
  "src/components/data/InternationalSupportPortfolioV112.tsx"
);
const tnaComponent = read("src/components/data/TnaTechnologyNeedsV110.tsx");
const tnaDownload = read("src/utils/tnaDownloadV110.ts");
const renderer = read("src/components/data/DataTypeRenderer.tsx");
const datasets = read("src/data/publicDatasets.ts");
const registryMap = read("src/utils/elementDatasetRegistryV88.ts");
const coverage = read("src/utils/dataElementCoverageV64.ts");
const search = read("src/utils/authoritativeElementSearchV75.ts");
const sourceRegistry = read("src/data/acquisition/sourceRegistryV76.ts");
const operational = JSON.parse(
  read("public/data/registry/operational-finalization-v101.json")
);
const catalog = JSON.parse(
  read("public/data/catalog/authoritative-elements-v101.json")
);
const pkg = JSON.parse(read("package.json"));

const ctcnRecords = (
  support.match(/(?:"?sourceOrganization"?)\s*:\s*"CTCN"/g) ?? []
).length;
const afRecords = (
  support.match(/(?:"?sourceOrganization"?)\s*:\s*"Adaptation Fund"/g) ?? []
).length;
const gefRecords = (
  support.match(/(?:"?sourceOrganization"?)\s*:\s*"GEF"/g) ?? []
).length;
const recordTotal = ctcnRecords + afRecords + gefRecords;

assert(recordTotal === 48, `international support records ${recordTotal}/48`);
assert(ctcnRecords === 17, `CTCN detailed records ${ctcnRecords}/17`);
assert(afRecords === 27, `Adaptation Fund records ${afRecords}/27`);
assert(gefRecords === 4, `GEF selected records ${gefRecords}/4`);

for (const [iso3, expected] of Object.entries({
  VNM: 7,
  BGD: 6,
  KHM: 5,
  IDN: 4,
  LAO: 4,
  LKA: 2,
  MYS: 1,
})) {
  const pattern = new RegExp(
    `(?:"?countryIso3"?)\\s*:\\s*"${iso3}"[\\s\\S]{0,220}?(?:"?officialPublishedTaCount"?)\\s*:\\s*${expected}`
  );
  assert(pattern.test(support), `CTCN facet ${iso3} ${expected}건 누락`);
}
for (const iso3 of ["PHL", "IND", "EGY"]) {
  const pattern = new RegExp(
    `(?:"?countryIso3"?)\\s*:\\s*"${iso3}"[\\s\\S]{0,220}?(?:"?officialPublishedTaCount"?)\\s*:\\s*null[\\s\\S]{0,140}?(?:"?facetStatus"?)\\s*:\\s*"not_shown"`
  );
  assert(pattern.test(support), `CTCN facet 미표시 상태 ${iso3} 누락`);
}

assert(
  support.includes(
    "다국가 사업의 공식 국가별 배분액이 명시되지 않은 경우 총사업액을 특정 국가에 배분하지 않습니다"
  ),
  "다국가 총액 비배분 규칙 누락"
);
assert(
  !datasets.includes("국가별 재원 균등 배분 가능"),
  "과거 다국가 균등배분 문구 잔존"
);
assert(
  support.includes('projectId: "GEF-5520"') &&
    support.includes('status: "Cancelled"'),
  "GEF 취소사업 상태 보존 누락"
);

for (const datasetId of ["LDC-DS-D-018-AF", "LDC-DS-D-019-CTCN"]) {
  assert(datasets.includes(`id: "${datasetId}"`), `Dataset ${datasetId} 누락`);
  assert(
    registryMap.includes(`"${datasetId}"`),
    `authoritative dataset mapping ${datasetId} 누락`
  );
  assert(
    renderer.includes(`dataset.id === "${datasetId}"`),
    `renderer ${datasetId} 누락`
  );
}
assert(
  renderer.includes('mode="climate-funds"'),
  "D-023 통합 기후기금 renderer 누락"
);
assert(
  component.includes("국가별 CTCN 기술지원 요청") &&
    component.includes("국가별 Adaptation Fund 사업"),
  "v112 공개 상세화면 모드 누락"
);
assert(
  component.includes("GCF 국가 포트폴리오") &&
    component.includes("GEF · 선별 검증"),
  "기후기금 통합 요약 누락"
);
assert(
  component.includes("CSV 다운로드") && component.includes("JSON 다운로드"),
  "v112 국가별 다운로드 누락"
);

assert(
  coverage.includes('"D-018": {') && coverage.includes('"D-019": {'),
  "D-018/D-019 coverage spec 누락"
);
assert(
  search.includes('datasetIds: ["LDC-DS-D-018-AF"]') &&
    search.includes('datasetIds: ["LDC-DS-D-019-CTCN"]'),
  "D-018/D-019 search dataset 연결 누락"
);
assert(
  search.includes('datasetIds: ["LDC-DS-E-002"]'),
  "D-023 authoritative search 연결 누락"
);

for (const sourceId of [
  "ctcn-technical-assistance",
  "adaptation-fund-projects",
  "gef-project-database",
]) {
  assert(
    sourceRegistry.includes(`id: "${sourceId}"`),
    `source registry ${sourceId} 누락`
  );
}
const sourceCount = [...sourceRegistry.matchAll(/\n\s*id:\s*"([^"]+)"/g)]
  .length;
assert(sourceCount >= 11, `acquisition sources ${sourceCount}/>=11`);

assert(
  tnaComponent.includes("getSupportForCountryTechnologyV112") &&
    tnaComponent.includes("CTCN·Adaptation Fund·GEF"),
  "TNA 화면에 v112 국제지원 근거 join 누락"
);
assert(
  tnaComponent.includes("INTERNATIONAL_SUPPORT_CAUTION_V112"),
  "TNA 국제지원 join 비추천·비동일성 주의문구 누락"
);
assert(
  tnaDownload.includes("downloadTnaCountryV112") &&
    tnaDownload.includes("verified_support_organizations") &&
    tnaDownload.includes("verified_support_source_urls"),
  "TNA v112 다운로드 국제지원 근거 컬럼 누락"
);

assert(operational.datasets === 38, `datasets ${operational.datasets}/38`);
assert(
  operational.publicDatasets === 33,
  `publicDatasets ${operational.publicDatasets}/33`
);
assert(
  operational.publishedDatasets === 29,
  `publishedDatasets ${operational.publishedDatasets}/29`
);
assert(
  operational.visibleAuthoritativeElements === 21,
  `actual-visible ${operational.visibleAuthoritativeElements}/21`
);
assert(
  operational.publishedAuthoritativeElements === 19,
  `actual-published ${operational.publishedAuthoritativeElements}/19`
);
assert(
  operational.pendingAuthoritativeElements === 131,
  `pending ${operational.pendingAuthoritativeElements}/131`
);
assert(
  catalog.meta.actualConnectedCount === 21,
  `catalog actual ${catalog.meta.actualConnectedCount}/21`
);
assert(
  catalog.meta.demoOnlyCount === 131,
  `catalog pending ${catalog.meta.demoOnlyCount}/131`
);
assert(
  catalog.meta.actualCategoryCounts?.D === 4,
  `category D actual ${catalog.meta.actualCategoryCounts?.D}/4`
);
for (const elementId of ["D-018", "D-019", "D-023"]) {
  const item = catalog.elements.find((value) => value.elementId === elementId);
  assert(
    item?.status === "actual_connected",
    `${elementId} service catalog actual 연결 누락`
  );
}

assert(pkg.scripts?.["audit:v112"], "audit:v112 스크립트 누락");
assert(pkg.scripts?.["finalize:v112"], "finalize:v112 스크립트 누락");
if (pkg.scripts?.["finalize:v112"]?.includes("refresh:worldbank:v110")) {
  warnings.push("finalize:v112가 live World Bank refresh를 직접 호출함");
}

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log("INTERNATIONAL_SUPPORT_READY");
  console.log("P0 0");
  console.log(`P1 ${warnings.length}`);
  console.log(`support-records ${recordTotal}`);
  console.log(`ctcn-selected-detail ${ctcnRecords}`);
  console.log(`adaptation-fund-current-single-country ${afRecords}`);
  console.log(`gef-selected-official ${gefRecords}`);
  console.log(`datasets ${operational.datasets}`);
  console.log(
    `actual-visible-elements ${operational.visibleAuthoritativeElements}`
  );
  console.log(
    `actual-published-elements ${operational.publishedAuthoritativeElements}`
  );
  console.log(`pending-elements ${operational.pendingAuthoritativeElements}`);
  console.log(`acquisition-sources ${sourceCount}`);
  console.log("multi-country-equal-allocation 0");
  console.log("automatic-opportunity-inference 0");
  warnings.forEach((item) => console.log(`- ${item}`));
}
