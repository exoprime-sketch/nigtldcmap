import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function abs(rel) {
  return path.join(root, rel);
}
function read(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}
function assert(condition, message) {
  if (!condition) failures.push(message);
}
function countFiles(rel) {
  const target = abs(rel);
  if (!fs.existsSync(target)) return 0;
  let count = 0;
  const stack = [target];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else count += 1;
    }
  }
  return count;
}

console.log("=== v108 cooperation data readiness audit ===");

const explorer = read("src/pages/DataExplorerPage.tsx");
const hierarchyCss = read("src/styles/data-hierarchy-v105.css");
const packageJson = JSON.parse(read("package.json"));
const registry = JSON.parse(
  read("public/data/registry/operational-finalization-v101.json")
);
const sourceRegistry = read("src/data/acquisition/sourceRegistryV76.ts");

// Public UX: examples remain available, but actual-data-only discovery must be one click.
assert(
  explorer.includes('id="availability-filter"'),
  "데이터 찾기에 제공상태 필터가 없음"
);
assert(
  explorer.includes("실제 데이터 제공") &&
    explorer.includes("일부 실제 데이터 제공") &&
    explorer.includes("예시 제공·실데이터 준비 중"),
  "제공상태 필터의 공개 문구가 불완전함"
);
assert(
  explorer.includes('useState<AvailabilityFilter>("all")'),
  "예시 데이터를 유지하는 전체 제공상태 기본값이 아님"
);
assert(
  explorer.includes("visibleVietnamItems") &&
    explorer.includes("items={visibleVietnamItems}"),
  "제공상태 필터가 계층 탐색 결과에 연결되지 않음"
);
assert(
  explorer.includes("{visibleVietnamItems.map((item) => ("),
  "제공상태 필터가 검색 결과에 연결되지 않음"
);

// Internal taxonomy code remains internal only.
assert(
  !hierarchyCss.includes(".v105-code-badge"),
  "사용하지 않는 내부 분류코드 badge 스타일이 공개 CSS에 남아 있음"
);

// Release chain must include latest audit.
for (const key of [
  "audit:v107",
  "finalize:v107",
  "audit:v108",
  "finalize:v108",
]) {
  assert(Boolean(packageJson.scripts?.[key]), `package.json에 ${key}가 없음`);
}

// Current platform coverage facts: protect against accidental optimistic counts.
assert(
  registry.authoritativeElements === 152,
  "authoritativeElements가 152가 아님"
);
assert(
  registry.visibleAuthoritativeElements === 21,
  "실데이터 연결 요소 기준값이 21과 다름"
);
assert(
  registry.publishedAuthoritativeElements === 19,
  "published authoritative 요소 기준값이 19와 다름"
);
assert(
  registry.pendingAuthoritativeElements === 131,
  "준비 중 요소 기준값이 131과 다름"
);
assert(registry.mapCatalog === 30, "지도 catalog 기준값이 30과 다름");

const acquisitionSourceCount = (
  sourceRegistry.match(/\nid:\s*"[^"]+"/g) ??
  sourceRegistry.match(/\n\s*id:\s*"[^"]+"/g) ??
  []
).length;
const worldBankSnapshotFiles = countFiles("public/data/worldbank");

if (worldBankSnapshotFiles === 0) {
  warnings.push(
    "World Bank 검증 snapshot 0건: published WDI 지표의 오프라인/장애 대응력을 다음 단계에서 보강 필요"
  );
}
if (acquisitionSourceCount < 11) {
  warnings.push(
    `수집 source registry ${acquisitionSourceCount}개: v109 정책원천 4종 포함 v112 기준 최소 11개 source registry 필요 · 다음은 ODA/기후재원·MDB 사업/조달 확장`
  );
}

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("COOPERATION_DATA_READY");
  console.log("P0 0");
  console.log("P1 0");
  console.log(`authoritative-elements ${registry.authoritativeElements}`);
  console.log(
    `actual-visible-elements ${registry.visibleAuthoritativeElements}`
  );
  console.log(
    `actual-published-elements ${registry.publishedAuthoritativeElements}`
  );
  console.log(`pending-elements ${registry.pendingAuthoritativeElements}`);
  console.log(`map-catalog ${registry.mapCatalog}`);
  console.log(`acquisition-sources ${acquisitionSourceCount}`);
  console.log(`worldbank-snapshot-files ${worldBankSnapshotFiles}`);
  console.log("availability-filter actual / partial / pending: wired");
  if (warnings.length) {
    console.log("NEXT_PRIORITY");
    for (const warning of warnings) console.log(`- ${warning}`);
  }
}
