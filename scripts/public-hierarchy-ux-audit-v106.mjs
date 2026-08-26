import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log("=== v106 public hierarchy UX audit ===");

const hierarchyBrowser = read(
  "src/components/catalog/DataHierarchyBrowserV105.tsx"
);
const explorer = read("src/pages/DataExplorerPage.tsx");
const labels = read("src/utils/publicLabelsV56.ts");
const detail = read("src/pages/CountryDataElementPage.tsx");
const css = read("src/styles/data-hierarchy-v105.css");

// 내부 분류코드는 data model / URL stable id로 유지할 수 있지만 화면 JSX에 직접 렌더링하지 않는다.
assert(
  !hierarchyBrowser.includes("{item.code}"),
  "계층 카드에서 내부 section/group 코드가 직접 렌더링됨"
);
assert(
  !hierarchyBrowser.includes("v105-code-badge"),
  "내부 분류코드 badge가 계층 UI에 남아 있음"
);
assert(
  !css.includes(".v105-code-badge"),
  "내부 분류코드 badge CSS가 공개 스타일에 남아 있음"
);

assert(
  hierarchyBrowser.includes("데이터 분야 선택") &&
    hierarchyBrowser.includes("데이터 그룹 선택") &&
    hierarchyBrowser.includes("데이터 선택"),
  "외부 이용자용 탐색 단계 명칭이 적용되지 않음"
);
assert(
  !hierarchyBrowser.includes("1단계 · 세부 항목") &&
    !hierarchyBrowser.includes("2단계 · 데이터 그룹") &&
    !hierarchyBrowser.includes("3단계 · 데이터 요소"),
  "내부 단계형 용어가 공개 계층 UI에 남아 있음"
);
assert(
  explorer.includes("데이터 분야 → 데이터 그룹 → 데이터 순서로 탐색"),
  "DataExplorer 안내문이 외부 이용자 용어로 교체되지 않음"
);
assert(
  labels.includes("stripInternalTaxonomyCode"),
  "공개 label에서 내부 taxonomy code 제거 함수가 누락됨"
);
assert(
  detail.includes("getPublicDataGroupLabel(element.section)") &&
    detail.includes("groupLabel"),
  "상세 breadcrumb가 공개 label 변환을 사용하지 않음"
);

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("PUBLIC_HIERARCHY_UX_READY");
  console.log("P0 0");
  console.log("P1 0");
  console.log("internal taxonomy codes: hidden from hierarchy UI");
  console.log("public flow: 데이터 분야 → 데이터 그룹 → 데이터");
}
