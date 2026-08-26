import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

console.log("=== v110 TNA deep evidence + World Bank snapshot audit ===");

const tna = read("src/data/policy/tnaTechnologyNeedsV110.ts");
const renderer = read("src/components/data/DataTypeRenderer.tsx");
const component = read("src/components/data/TnaTechnologyNeedsV110.tsx");
const datasets = read("src/data/publicDatasets.ts");
const coverage = read("src/utils/dataElementCoverageV64.ts");
const catalog = read("src/data/climateTechnologyCatalog.ts");
const pkg = JSON.parse(read("package.json"));

const profileCount = (tna.match(/\bcountryIso3:\s*"[A-Z]{3}"/g) || []).length;
const techCount = (tna.match(/\bsourceTechnologyName:\s*"/g) || []).length;
const mappedCount = (tna.match(/\bmappedTechnologyId:\s*"[^"]+"/g) || [])
  .length;
const projectCount = (tna.match(/\blinkedTechnologyRecordIds:\s*\[/g) || [])
  .length;

assert(profileCount === 7, `TNA deep profile ${profileCount}/7`);
assert(techCount >= 60, `TNA technology records ${techCount}/>=60`);
assert(mappedCount >= 55, `38-tech mapped ${mappedCount}/>=55`);
assert(
  renderer.includes('dataset.id === "LDC-DS-C-005-TNA"') &&
    renderer.includes("TnaTechnologyNeedsV110"),
  "C-005 v110 renderer 미연결"
);
assert(
  datasets.includes('version: "v110 source-verified TNA/TAP technology needs"'),
  "C-005 v110 Dataset metadata 미반영"
);
assert(
  coverage.includes('label: "38대 기후기술 검증 매핑"'),
  "C-005 coverage 매핑 필드 미반영"
);

const mappedIds = [...tna.matchAll(/\bmappedTechnologyId:\s*"([^"]+)"/g)].map(
  (match) => match[1]
);
const catalogIds = new Set(
  [...catalog.matchAll(/\n    id: "([^"]+)"/g)].map((match) => match[1])
);
for (const id of mappedIds) {
  assert(catalogIds.has(id), `38대 기술 catalog에 없는 매핑 ID: ${id}`);
}

assert(
  tna.includes('mappingConfidence: "not-mapped"') ||
    tna.includes('"mappingConfidence": "not-mapped"'),
  "강제매핑 방지용 not-mapped 사례 없음"
);
assert(
  component.includes("현재성") &&
    (component.includes("최신 NDC·NAP·BTR·현행 정책") ||
      component.includes("최신 정책")),
  "TNA 역사자료 현재성 경고 없음"
);
assert(
  pkg.scripts?.["refresh:worldbank:v110"],
  "refresh:worldbank:v110 스크립트 누락"
);
assert(pkg.scripts?.["audit:v110"], "audit:v110 누락");
assert(pkg.scripts?.["finalize:v110"], "finalize:v110 누락");

const requiredSnapshots = [
  "population-total",
  "urbanization-share",
  "population-growth",
  "gdp-current",
  "gdp-growth",
  "gdp-per-capita",
  "electricity-access",
  "clean-cooking-access",
  "renewable-electricity-share",
  "grid-losses",
  "poverty-national",
  "poverty-extreme",
  "sector-agriculture-share",
  "sector-industry-share",
  "sector-manufacturing-share",
  "sector-services-share",
  "unemployment-total",
  "unemployment-youth",
  "gini-index",
];
const wbDir = path.join(root, "public/data/worldbank");
let validSnapshots = 0;
for (const indicatorId of requiredSnapshots) {
  const target = path.join(wbDir, `${indicatorId}.json`);
  if (!fs.existsSync(target)) continue;
  try {
    const obj = JSON.parse(fs.readFileSync(target, "utf8"));
    assert(
      obj.schemaVersion === "v110",
      `${indicatorId}.json schemaVersion v110 아님`
    );
    assert(
      obj.indicatorId === indicatorId,
      `${indicatorId}.json indicatorId 불일치`
    );
    assert(
      Array.isArray(obj.observations) && obj.observations.length > 0,
      `${indicatorId}.json observations 0`
    );
    if (
      obj.schemaVersion === "v110" &&
      obj.indicatorId === indicatorId &&
      Array.isArray(obj.observations) &&
      obj.observations.length > 0
    ) {
      validSnapshots += 1;
    }
  } catch (error) {
    failures.push(`${indicatorId}.json JSON 검증 실패: ${error.message}`);
  }
}

if (validSnapshots === 0) {
  warnings.push(
    "World Bank snapshot 0건: npm run refresh:worldbank:v110 실행 후 full v110 gate 완료 필요"
  );
} else {
  assert(
    validSnapshots === requiredSnapshots.length,
    `World Bank snapshot ${validSnapshots}/${requiredSnapshots.length}`
  );
  const manifestPath = path.join(wbDir, "snapshot-manifest-v110.json");
  assert(fs.existsSync(manifestPath), "World Bank snapshot manifest 누락");
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      assert(
        manifest.schemaVersion === "v110",
        "snapshot manifest schemaVersion 불일치"
      );
      assert(
        manifest.indicatorCount === requiredSnapshots.length,
        `snapshot manifest indicatorCount ${manifest.indicatorCount}/${requiredSnapshots.length}`
      );
    } catch (error) {
      failures.push(`snapshot manifest JSON 검증 실패: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log("TNA_EVIDENCE_READY");
  console.log("P0 0");
  console.log(`P1 ${warnings.length}`);
  console.log(`deep-profiles ${profileCount}/7`);
  console.log(`technology-records ${techCount}`);
  console.log(`mapped-records ${mappedCount}`);
  console.log(`project-ideas ${projectCount}`);
  console.log(
    `worldbank-snapshots ${validSnapshots}/${requiredSnapshots.length}`
  );
  warnings.forEach((item) => console.log(`- ${item}`));
}
