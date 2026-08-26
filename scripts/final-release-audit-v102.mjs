import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const failures = [];
const warnings = [];
const facts = {};

const mustBeAbsent = [
  "src/components/local",
  "src/components/opportunity",
  "src/data/local",
  "src/data/opportunities",
  "src/types/local.ts",
  "src/types/opportunity.ts",
  "public/data/local",
  "public/data/platform/categorical/E-013__om-capability-example__20260806.json",
  "public/data/platform/geospatial/E-012__project-locations-example__20260806.json",
  "public/data/platform/text/C-014__permitting-example__20260806.json",
  "public/data/policy/policy-document-previews.template.json",
  "public/vietnam-full-load-demo-v46.html",
  "public/data/demo/vietnam-full-load-v46.json",
  "public/data/demo/vietnam-full-load-v48.json",
  "public/data/registry/final-152-upload-manifest-v94.json",
  "public/data/registry/final-152-platform-completion-v95.json",
  "public/data/registry/release-candidate-v96.json",
];

function abs(relativePath) {
  return path.join(root, relativePath);
}
function read(relativePath) {
  return fs.readFileSync(abs(relativePath), "utf8");
}
function walk(relativeDir, extensions = null) {
  const start = abs(relativeDir);
  if (!fs.existsSync(start)) return [];
  const out = [];
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    const p = path.join(start, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(path.relative(root, p), extensions));
    } else if (
      !extensions ||
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      out.push(p);
    }
  }
  return out;
}
function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}
function assert(condition, message) {
  if (!condition) failures.push(message);
}

function resolveRelativeImport(file, specifier) {
  const base = path.resolve(path.dirname(file), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    `${base}.css`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function parseImports(text) {
  const out = [];
  for (const pattern of [
    /from\s+["']([^"']+)["']/g,
    /import\s+["']([^"']+)["']/g,
  ]) {
    for (const match of text.matchAll(pattern)) out.push(match[1]);
  }
  return out;
}

function reachableFrom(entryRelativePath) {
  const entry = abs(entryRelativePath);
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop();
    if (!file || seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    if (!/[.](ts|tsx|js|jsx)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const specifier of parseImports(text)) {
      if (!specifier.startsWith(".")) continue;
      const resolved = resolveRelativeImport(file, specifier);
      if (resolved && /[.](ts|tsx|js|jsx)$/.test(resolved))
        stack.push(resolved);
    }
  }
  return seen;
}

function loadTypeScript() {
  const require = createRequire(import.meta.url);
  try {
    return require("typescript");
  } catch {
    try {
      const globalRoot = execFileSync("npm", ["root", "-g"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      return require(path.join(
        globalRoot,
        "typescript",
        "lib",
        "typescript.js"
      ));
    } catch {
      return null;
    }
  }
}

console.log("=== v102 map/UI finalization audit ===");

// 1. 공개 경로에서 레거시/예시 파일 격리
for (const item of mustBeAbsent) {
  assert(
    !fs.existsSync(abs(item)),
    `${item} 가 공개 build/public 경로에 남아 있음`
  );
}

// 2. 152개 presentation source of truth
const presentationJson = JSON.parse(
  read("public/data/registry/element-presentation-v100.json")
);
const specs = Array.isArray(presentationJson.specs)
  ? presentationJson.specs
  : [];
const specIds = specs.map((item) => item.elementId);
facts.presentationSpecs = specs.length;
facts.presentationFamilies = new Set(
  specs.map((item) => item.layoutFamily)
).size;
facts.integratedElements = specs.filter(
  (item) => item.bundleMode && item.bundleMode !== "none"
).length;
assert(specs.length === 152, `presentation spec ${specs.length}/152`);
assert(
  new Set(specIds).size === 152,
  "presentation spec elementId 중복 또는 누락"
);
assert(
  presentationJson.elementCount === 152,
  `registry elementCount=${presentationJson.elementCount}`
);
const serviceCatalog = JSON.parse(
  read("public/data/catalog/authoritative-elements-v101.json")
);
facts.serviceCatalogElements = serviceCatalog?.elements?.length ?? 0;
assert(
  serviceCatalog?.elements?.length === 152,
  `service catalog ${serviceCatalog?.elements?.length ?? 0}/152`
);
assert(
  serviceCatalog?.meta?.demoOnlyCount === 131,
  `service catalog pending ${serviceCatalog?.meta?.demoOnlyCount ?? 0}/131`
);
assert(
  !JSON.stringify(serviceCatalog).includes("시연값 · 실제") &&
    !JSON.stringify(serviceCatalog).includes("예: 핵심값"),
  "v101 service catalog에 synthetic sample value가 남아 있음"
);
const cpi = serviceCatalog.elements.find((item) => item.elementId === "A-001");
assert(
  String(cpi?.sourceDatabase ?? "").includes("Transparency International"),
  "A-001 CPI 출처 정정이 service catalog에 반영되지 않음"
);

// 3. 공개 Dataset registry 현황
const registry = read("src/data/publicDatasets.ts");
const starts = [...registry.matchAll(/\r?\n  \{\r?\n    id: "LDC-/g)].map(
  (m) => m.index ?? 0
);
const registryEnd = Math.max(
  registry.lastIndexOf("\n];"),
  registry.lastIndexOf("\r\n];")
);
const blocks = starts.map((start, index) =>
  registry.slice(
    start,
    index + 1 < starts.length ? starts[index + 1] : registryEnd
  )
);
const field = (block, key) =>
  block.match(new RegExp(`${key}: \\"([^\\"]+)\\"`))?.[1] ?? null;
const boolField = (block, key) =>
  block.match(new RegExp(`${key}: (true|false)`))?.[1] ?? null;
const datasetRows = blocks.map((block) => ({
  id: field(block, "id"),
  elementId: field(block, "elementId"),
  publicationStatus: field(block, "publicationStatus"),
  accessLevel: field(block, "accessLevel"),
  isSynthetic: boolField(block, "isSynthetic"),
}));
const visibleRows = datasetRows.filter(
  (row) =>
    (row.publicationStatus === "published" ||
      row.publicationStatus === "catalog_only") &&
    row.isSynthetic !== "true" &&
    row.accessLevel !== "internal" &&
    row.accessLevel !== "example" &&
    !String(row.id).startsWith("LDC-EXAMPLE")
);
const publishedRows = datasetRows.filter(
  (row) => row.publicationStatus === "published"
);
const authoritativePattern = /^[A-E]-\d{3}$/;
facts.datasets = datasetRows.length;
facts.publicDatasets = visibleRows.length;
facts.publishedDatasets = publishedRows.length;
facts.visibleAuthoritativeElements = new Set(
  visibleRows
    .map((row) => row.elementId)
    .filter((id) => authoritativePattern.test(id ?? ""))
).size;
facts.publishedAuthoritativeElements = new Set(
  publishedRows
    .map((row) => row.elementId)
    .filter((id) => authoritativePattern.test(id ?? ""))
).size;
assert(
  datasetRows.length >= 32,
  `Dataset registry가 예상보다 작음: ${datasetRows.length}`
);

// 4. 실제 Dataset 미연결 항목은 명확히 구분된 예시 preview 제공
const countryPage = read("src/pages/CountryDataElementPage.tsx");
const renderer = read("src/components/data/DataTypeRenderer.tsx");
assert(
  countryPage.includes("PendingElementStateV92"),
  "미연결 항목이 public-trust pending state를 사용하지 않음"
);
assert(
  countryPage.includes("CountryDataFinalPreviewV53"),
  "미연결 항목의 예시 preview가 복원되지 않음"
);
assert(
  countryPage.includes("exampleMode"),
  "미연결 항목 예시 preview에 명시적 exampleMode가 없음"
);
assert(
  !countryPage.includes("pendingDownloadOpen"),
  "미연결 자료에 가상 다운로드 dialog가 남아 있음"
);
assert(
  renderer.includes("DatasetMetadataFallbackV101"),
  "Dataset metadata-only fallback 누락"
);
assert(
  renderer.includes("DatasetExamplePreviewV102"),
  "catalog-only Dataset 예시 preview v102 누락"
);
const examplePreview = read(
  "src/components/data/CountryDataFinalPreviewV53.tsx"
);
assert(
  examplePreview.includes("예시 화면 · 실제값 아님"),
  "예시 화면의 실제값 아님 경고 누락"
);
assert(
  examplePreview.includes("지도·국가 비교·다운로드의"),
  "예시 데이터의 활용 제한 안내 누락"
);
const indexSource = read("src/index.tsx");
assert(
  indexSource.includes("runOperationalFinalizationAuditV102"),
  "개발 Preview가 v102 runtime audit를 실행하지 않음"
);
assert(
  !indexSource.includes("runOperationalFinalizationAuditV99"),
  "개발 Preview에 v99 고정 Dataset count audit가 남아 있음"
);

// 5. v100 의미 기반 통합화의 핵심 의미 검증
const bundle = read("src/components/data/ElementIndicatorBundleV100.tsx");
assert(
  bundle.includes('"sector-industry-share"'),
  "A-005 산업(건설 포함) 지표 누락"
);
assert(
  bundle.includes("제조업은 산업의 하위범주"),
  "A-005 제조업 하위범주 안내 누락"
);
const a004Start = bundle.indexOf('"A-004"');
const a006Start = bundle.indexOf('"A-006"');
const a004Block = bundle.slice(a004Start, a006Start);
assert(
  !a004Block.includes("differenceKpi"),
  "A-004 정의가 다른 빈곤율에 격차 KPI가 다시 추가됨"
);
const a006End = bundle.indexOf('"A-007"', a006Start);
const a006Block = bundle.slice(a006Start, a006End);
assert(
  a006Block.includes("청년-전체 실업률 격차"),
  "A-006 청년-전체 격차 KPI 누락"
);

// 6. 지도 누적 선택/전체 해제 계약
const selection = read("src/utils/mapLayerSelectionV90.ts");
const mapTypes = read("src/types/map.ts");
const mapCatalog = read("src/data/mapLayerCatalog.ts");
assert(
  selection.includes("activeKeys: [...state.activeKeys, key]"),
  "지도 레이어 누적 선택 계약 누락"
);
assert(
  selection.includes("activeKeys: []") && selection.includes("focusKey: null"),
  "지도 모두 지우기 empty state 계약 누락"
);
assert(
  mapTypes.includes('const explicitEmptyLayers = layersParam === "none"'),
  "지도 공유 URL explicit empty state 누락"
);
assert(
  mapCatalog.includes('renderMode: "bubble"') &&
    mapCatalog.includes('renderMode: "point"'),
  "지도 의미별 표현전략 누락"
);
const mapPage = read("src/pages/RealMapExplorerPage.tsx");
assert(
  mapPage.includes("runtimeLayerCacheKeysRef"),
  "지도 runtime layer cache 누락"
);
assert(
  mapPage.includes('map.setLayoutProperty(layerId, "visibility", "none")'),
  "지도 deselect 시 visibility hide 처리 누락"
);
assert(
  !/map\.removeSource\(sourceId\)/.test(mapPage),
  "지도 deselect 시 source 제거가 남아 있어 깜빡임 위험"
);
assert(
  mapPage.includes("clearAllCatalogLayers"),
  "지도 모두 지우기 안정화 handler 누락"
);

// 7. 전체 앱 상대 import 및 public JSON
for (const file of walk("src", [".ts", ".tsx"])) {
  const text = fs.readFileSync(file, "utf8");
  for (const specifier of parseImports(text)) {
    if (specifier.startsWith(".") && !resolveRelativeImport(file, specifier)) {
      failures.push(`${rel(file)} 상대 import 누락: ${specifier}`);
    }
  }
}
for (const file of walk("public", [".json", ".geojson"])) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${rel(file)} JSON 파싱 실패: ${error.message}`);
  }
}

// 8. 공개 내비게이션에서 협력 인사이트/빠른 협력검토 제거
const headerSource = read("src/components/layout/Header.tsx");
const footerSource = read("src/components/layout/Footer.tsx");
const homeSource = read("src/pages/HomePage.tsx");
const navigationSource = read("src/app/navigation.ts");
assert(
  !headerSource.includes("협력 인사이트"),
  "상단 탭에 협력 인사이트가 남아 있음"
);
assert(
  !footerSource.includes("협력 인사이트"),
  "하단 메뉴에 협력 인사이트가 남아 있음"
);
assert(
  !homeSource.includes("PlanningQuickStartV39"),
  "홈의 협력 검토 바로 시작 블록이 남아 있음"
);
assert(
  navigationSource.includes('hash === "insights"'),
  "과거 insights 링크의 안전한 redirect 누락"
);
const reachable = reachableFrom("src/index.tsx");
facts.reachableSourceFiles = reachable.size;

// 9. TS/TSX parser syntax check
const ts = loadTypeScript();
if (!ts) {
  warnings.push("typescript 모듈을 찾지 못해 TS/TSX parser 검사를 생략함");
} else {
  let syntaxCount = 0;
  for (const file of walk("src", [".ts", ".tsx"])) {
    const text = fs.readFileSync(file, "utf8");
    const source = ts.createSourceFile(
      rel(file),
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    syntaxCount += 1;
    for (const diag of source.parseDiagnostics) {
      const pos = diag.start ?? 0;
      const lc = source.getLineAndCharacterOfPosition(pos);
      failures.push(
        `${rel(file)}:${lc.line + 1}:${
          lc.character + 1
        } 구문 오류: ${ts.flattenDiagnosticMessageText(diag.messageText, " ")}`
      );
    }
  }
  facts.typescriptSyntaxFiles = syntaxCount;
}

const result = {
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "OPERATIONAL_FINALIZED" : "CHECK_REQUIRED",
  p0: failures.length,
  p1: warnings.length,
  facts,
  failures,
  warnings,
};

const artifactDir = abs("artifacts/release-v102");
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, "audit.json"),
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(result.status);
console.log(`P0 ${result.p0}`);
console.log(`P1 ${result.p1}`);
for (const [key, value] of Object.entries(facts))
  console.log(`${key} ${value}`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const failure of failures) console.error(`FAIL  ${failure}`);
if (failures.length > 0) process.exitCode = 1;
