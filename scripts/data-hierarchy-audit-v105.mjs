import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const facts = {};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log("=== v105 data hierarchy audit ===");

const catalog = JSON.parse(
  read("public/data/catalog/authoritative-elements-v101.json")
);
const elements = Array.isArray(catalog.elements) ? catalog.elements : [];
const sectionIds = new Set();
const groupIds = new Set();
const groupToSection = new Map();

for (const element of elements) {
  assert(Boolean(element.section), `${element.elementId}: section 누락`);
  assert(Boolean(element.dataGroup), `${element.elementId}: dataGroup 누락`);
  assert(
    String(element.section ?? "").startsWith(`${element.category}.`),
    `${element.elementId}: category/section 불일치`
  );

  sectionIds.add(element.section);
  groupIds.add(element.dataGroup);

  const previousSection = groupToSection.get(element.dataGroup);
  if (previousSection && previousSection !== element.section) {
    failures.push(
      `${element.dataGroup}: 둘 이상의 세부 항목에 연결됨 (${previousSection} / ${element.section})`
    );
  } else {
    groupToSection.set(element.dataGroup, element.section);
  }
}

facts.elements = elements.length;
facts.sections = sectionIds.size;
facts.groups = groupIds.size;

assert(elements.length === 152, `데이터 요소 ${elements.length}/152`);
assert(sectionIds.size === 19, `세부 항목 ${sectionIds.size}/19`);
assert(groupIds.size === 60, `데이터 그룹 ${groupIds.size}/60`);

const explorer = read("src/pages/DataExplorerPage.tsx");
const hierarchyBrowser = read(
  "src/components/catalog/DataHierarchyBrowserV105.tsx"
);
const hierarchyUtil = read("src/utils/dataHierarchyV105.ts");
const app = read("src/App.tsx");
const detail = read("src/pages/CountryDataElementPage.tsx");

assert(
  explorer.includes("DataHierarchyBrowserV105"),
  "DataExplorerPage에 계층 브라우저가 연결되지 않음"
);
assert(
  hierarchyBrowser.includes('data-level="section"') &&
    hierarchyBrowser.includes('data-level="group"') &&
    hierarchyBrowser.includes('data-level="element"'),
  "세부 항목→데이터 그룹→데이터 요소 3단계 구조 계약 누락"
);
assert(
  hierarchyUtil.includes("buildDataHierarchyV105"),
  "hierarchy builder 누락"
);
assert(
  app.includes('params.set("section", explorerSection)') &&
    app.includes('params.set("group", explorerGroup)'),
  "세부 항목/데이터 그룹 URL 상태 보존 누락"
);
assert(
  detail.includes("getPublicDataGroupLabel(element.section)") &&
    detail.includes("groupLabel"),
  "데이터 요소 상세 breadcrumb에 세부 항목/데이터 그룹이 모두 표시되지 않음"
);
assert(
  explorer.includes("searchMode") &&
    explorer.includes("검색어를 입력한 경우에는 탐색 단계를 건너뛰고"),
  "검색 시 데이터 요소 직접 결과 UX 누락"
);

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("HIERARCHY_READY");
  console.log("P0 0");
  console.log("P1 0");
  for (const [key, value] of Object.entries(facts)) {
    console.log(`${key} ${value}`);
  }
}
