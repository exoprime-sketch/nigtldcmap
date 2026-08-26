import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

console.log("=== v109 official policy evidence audit ===");

const policy = read("src/data/policy/cooperationPolicyEvidenceV109.ts");
const datasets = read("src/data/publicDatasets.ts");
const renderer = read("src/components/data/DataTypeRenderer.tsx");
const coverage = read("src/utils/dataElementCoverageV64.ts");
const sources = read("src/data/acquisition/sourceRegistryV76.ts");
const catalog = JSON.parse(
  read("public/data/catalog/authoritative-elements-v101.json")
);
const registry = JSON.parse(
  read("public/data/registry/operational-finalization-v101.json")
);
const pkg = JSON.parse(read("package.json"));

const datasetIds = [
  "LDC-DS-C-002-BTR",
  "LDC-DS-C-003-NAP",
  "LDC-DS-C-004-LTLEDS",
  "LDC-DS-C-005-TNA",
];
for (const id of datasetIds) {
  assert(datasets.includes(`id: "${id}"`), `${id} Dataset 미등록`);
  assert(
    renderer.includes("isCooperationPolicyDatasetV109"),
    "정책 근거 전용 renderer 미연결"
  );
}

const recordPattern =
  /\{\s*countryIso3:\s*"([A-Z]{3})"[\s\S]*?kind:\s*"(btr|nap|lt-leds|tna)"[\s\S]*?status:\s*"(available|not_found_official_list|related_record_only)"[\s\S]*?notes:\s*\[[\s\S]*?\]\s*,?\s*\}/g;
const policyRecords = [...policy.matchAll(recordPattern)].map((match) => ({
  countryIso3: match[1],
  kind: match[2],
  status: match[3],
}));
assert(
  policyRecords.length === 40,
  `정책근거 국가×문서 레코드 ${policyRecords.length}/40`
);
for (const kind of ["btr", "nap", "lt-leds", "tna"]) {
  assert(
    policyRecords.filter((row) => row.kind === kind).length === 10,
    `${kind} 10개국 레코드 아님`
  );
}

const statusCounts = (kind, status) =>
  policyRecords.filter((row) => row.kind === kind && row.status === status)
    .length;

assert(
  statusCounts("btr", "available") === 9,
  "BTR 공식 제출 9/10 상태 불일치"
);
assert(
  statusCounts("nap", "available") === 7,
  "NAP 공식 원문 7/10 상태 불일치"
);
assert(
  statusCounts("lt-leds", "available") === 4,
  "LT-LEDS current submission 4/10 상태 불일치"
);
assert(
  statusCounts("tna", "available") === 7,
  "TNA 직접 원문항목 7/10 상태 불일치"
);
assert(
  statusCounts("tna", "related_record_only") === 1,
  "TNA 관련기록 1/10 상태 불일치"
);

for (const forbidden of [
  "prioritizedTechnologies:",
  "financeUsd:",
  "ghgValue:",
  "emissionValue:",
]) {
  assert(
    !policy.includes(forbidden),
    `원문검증 전 상세값 필드 금지: ${forbidden}`
  );
}

for (const elementId of ["C-002", "C-003", "C-004", "C-005"]) {
  const element = catalog.elements.find((item) => item.elementId === elementId);
  assert(
    element?.status === "actual_connected",
    `${elementId} service catalog actual_connected 아님`
  );
  assert(
    coverage.includes(`"${elementId}"`),
    `${elementId} partial coverage 정의 누락`
  );
}

assert(registry.datasets === 38, `datasets ${registry.datasets}/38`);
assert(
  registry.publicDatasets === 33,
  `publicDatasets ${registry.publicDatasets}/33`
);
assert(
  registry.publishedDatasets === 29,
  `publishedDatasets ${registry.publishedDatasets}/29`
);
assert(
  registry.visibleAuthoritativeElements === 21,
  `actual-visible ${registry.visibleAuthoritativeElements}/21`
);
assert(
  registry.publishedAuthoritativeElements === 19,
  `actual-published ${registry.publishedAuthoritativeElements}/19`
);
assert(
  registry.pendingAuthoritativeElements === 131,
  `pending ${registry.pendingAuthoritativeElements}/131`
);
assert(
  catalog.meta.actualConnectedCount === 21,
  `catalog actual ${catalog.meta.actualConnectedCount}/21`
);
assert(
  catalog.meta.demoOnlyCount === 131,
  `catalog pending ${catalog.meta.demoOnlyCount}/131`
);

const sourceIds = [...sources.matchAll(/\n\s*id:\s*"([^"]+)"/g)].map(
  (m) => m[1]
);
for (const id of [
  "unfccc-btr",
  "unfccc-nap",
  "unfccc-lt-leds",
  "unfccc-tna-ttclear",
]) {
  assert(sourceIds.includes(id), `source registry ${id} 누락`);
}
assert(sourceIds.length >= 11, `acquisition sources ${sourceIds.length}/>=11`);
assert(pkg.scripts?.["audit:v109"], "package.json audit:v109 누락");
assert(pkg.scripts?.["finalize:v109"], "package.json finalize:v109 누락");

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log("POLICY_EVIDENCE_READY");
  console.log("P0 0");
  console.log("P1 0");
  console.log("records 40");
  console.log("BTR official submission 9/10");
  console.log("NAP official document 7/10");
  console.log("LT-LEDS current submission 4/10");
  console.log(
    "TNA direct 7/10 · related 1/10 · official-list-unconfirmed 2/10"
  );
  console.log(
    `actual-visible-elements ${registry.visibleAuthoritativeElements}`
  );
  console.log(`pending-elements ${registry.pendingAuthoritativeElements}`);
  console.log(`acquisition-sources ${sourceIds.length}`);
  console.log(
    "detail metrics / technology mappings: intentionally not fabricated"
  );
}
