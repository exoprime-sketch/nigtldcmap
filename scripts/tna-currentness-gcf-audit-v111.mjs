import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

console.log("=== v111 TNA currentness + verified GCF join audit ===");

const tna = read("src/data/policy/tnaTechnologyNeedsV110.ts");
const currentness = read("src/data/policy/tnaCurrentnessV111.ts");
const gcf = read("src/data/gcf/gcfProjectTechnologyMappingV99.ts");
const component = read("src/components/data/TnaTechnologyNeedsV110.tsx");
const download = read("src/utils/tnaDownloadV110.ts");
const pkg = JSON.parse(read("package.json"));

function parseTnaTechnologies(source) {
  const rows = [];
  const sectionPattern =
    /technologies:\s*\[([\s\S]*?)\r?\n    \],\r?\n    barriers:/g;
  for (const sectionMatch of source.matchAll(sectionPattern)) {
    const block = sectionMatch[1];
    const recordPattern =
      /\bid:\s*"([^"]+)"[\s\S]*?sourceTechnologyName:\s*"([^"]+)"[\s\S]*?mappedTechnologyId:\s*(null|"([^"]+)")/g;
    for (const match of block.matchAll(recordPattern)) {
      rows.push({
        id: match[1],
        technologyId: match[4] ?? null,
        countryIso3: match[1].slice(0, 3),
      });
    }
  }
  return rows;
}

function parseCurrentnessGroups(source) {
  const byRecord = new Map();
  const statusCounts = new Map();
  const groupPattern =
    /\bids:\s*\[([\s\S]*?)\],\s*status:\s*"(reconfirmed|partially_reconfirmed|historical_only|possible_conflict)"/g;

  for (const match of source.matchAll(groupPattern)) {
    const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
    const status = match[2];
    for (const id of ids) {
      if (byRecord.has(id)) {
        failures.push(`현재성 중복 recordId: ${id}`);
      }
      byRecord.set(id, status);
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }
  }

  return { byRecord, statusCounts };
}

function parseGcfMappings(source) {
  const rows = [];
  const pattern =
    /countryIso3:\s*"([^"]+)"[\s\S]*?projectId:\s*"([^"]+)"[\s\S]*?technologyId:\s*"([^"]+)"[\s\S]*?verificationStatus:\s*"confirmed_official_project_page"/g;

  for (const match of source.matchAll(pattern)) {
    rows.push({
      countryIso3: match[1],
      projectId: match[2],
      technologyId: match[3],
    });
  }
  return rows;
}

const tnaRecords = parseTnaTechnologies(tna);
const { byRecord: currentnessByRecord, statusCounts } =
  parseCurrentnessGroups(currentness);
const gcfMappings = parseGcfMappings(gcf);

assert(tnaRecords.length === 82, `TNA 기술 레코드 ${tnaRecords.length}/82`);
assert(
  currentnessByRecord.size === 82,
  `현재성 판정 ${currentnessByRecord.size}/82`
);

for (const record of tnaRecords) {
  assert(currentnessByRecord.has(record.id), `현재성 판정 누락: ${record.id}`);
}
for (const recordId of currentnessByRecord.keys()) {
  assert(
    tnaRecords.some((record) => record.id === recordId),
    `TNA에 없는 현재성 recordId: ${recordId}`
  );
}

const expectedStatus = {
  reconfirmed: 44,
  partially_reconfirmed: 27,
  historical_only: 9,
  possible_conflict: 2,
};
for (const [status, expected] of Object.entries(expectedStatus)) {
  const actual = statusCounts.get(status) ?? 0;
  assert(actual === expected, `${status} ${actual}/${expected}`);
}

const officialUrls = [
  ...currentness.matchAll(/\burl:\s*"(https:\/\/unfccc\.int\/[^"]+)"/g),
].map((match) => match[1]);
assert(officialUrls.length > 0, "최신 정책 공식 원문 URL 0건");
assert(
  !currentness.includes("example.com") &&
    !currentness.includes("TODO") &&
    !currentness.includes("미확인 URL"),
  "현재성 데이터에 placeholder URL/표현 존재"
);
assert(
  currentness.includes('TNA_CURRENTNESS_REVIEWED_AT_V111 = "2026-08-18"'),
  "현재성 검토 기준일 누락"
);

const gcfLinks = [];
const matchedRecordIds = new Set();
const uniqueProjects = new Set();
for (const record of tnaRecords) {
  if (!record.technologyId) continue;
  for (const project of gcfMappings) {
    if (
      project.countryIso3 === record.countryIso3 &&
      project.technologyId === record.technologyId
    ) {
      gcfLinks.push(`${record.id}|${project.projectId}`);
      matchedRecordIds.add(record.id);
      uniqueProjects.add(`${project.countryIso3}|${project.projectId}`);
    }
  }
}

assert(
  matchedRecordIds.size === 17,
  `GCF 연결 TNA 레코드 ${matchedRecordIds.size}/17`
);
assert(gcfLinks.length === 19, `TNA-GCF 레코드 링크 ${gcfLinks.length}/19`);
assert(
  uniqueProjects.size === 7,
  `연결 GCF 고유 프로젝트 ${uniqueProjects.size}/7`
);

assert(
  component.includes("getTnaCurrentnessEvidenceV111") &&
    component.includes("getVerifiedGcfMatchesForTnaV111"),
  "TNA 화면에 v111 현재성/GCF 연결 로직 미연결"
);
assert(
  component.includes("최신 정책 현재성") && component.includes("기존 GCF 사업"),
  "TNA 화면에 이용자용 현재성/GCF 블록 누락"
);
assert(
  component.includes("협력 우선순위 점수나 사업 추천 결과가 아닙니다"),
  "현재성 판정 비점수·비추천 주의문구 누락"
);
assert(
  currentness.includes("신규 협력기회 추천도 아닙니다"),
  "GCF 연결 비추천·비동일성 경계문구 누락"
);

assert(
  download.includes("currentness_status") &&
    download.includes("current_policy_source_urls") &&
    download.includes("verified_gcf_project_ids") &&
    download.includes("verified_gcf_project_urls"),
  "CSV에 현재성/GCF 근거 컬럼 누락"
);
assert(
  download.includes("downloadTnaCountryV111") &&
    download.includes("currentness-gcf-v111"),
  "v111 다운로드 함수/파일명 누락"
);

assert(pkg.scripts?.["audit:v111"], "audit:v111 스크립트 누락");
assert(pkg.scripts?.["finalize:v111"], "finalize:v111 스크립트 누락");
if (pkg.scripts?.["finalize:v111"]?.includes("refresh:worldbank:v110")) {
  warnings.push(
    "finalize:v111이 외부 World Bank refresh를 직접 호출함: release audit와 upstream refresh는 분리 권장"
  );
}

if (failures.length) {
  console.log("BLOCKED");
  console.log(`P0 ${failures.length}`);
  failures.forEach((item) => console.log(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log("TNA_CURRENTNESS_GCF_READY");
  console.log("P0 0");
  console.log(`P1 ${warnings.length}`);
  console.log(`tna-records ${tnaRecords.length}`);
  console.log(`currentness ${currentnessByRecord.size}/${tnaRecords.length}`);
  console.log(`reconfirmed ${statusCounts.get("reconfirmed") ?? 0}`);
  console.log(
    `partially-reconfirmed ${statusCounts.get("partially_reconfirmed") ?? 0}`
  );
  console.log(`historical-only ${statusCounts.get("historical_only") ?? 0}`);
  console.log(
    `possible-conflict ${statusCounts.get("possible_conflict") ?? 0}`
  );
  console.log(`official-current-policy-source-links ${officialUrls.length}`);
  console.log(`gcf-matched-tna-records ${matchedRecordIds.size}`);
  console.log(`gcf-record-project-links ${gcfLinks.length}`);
  console.log(`unique-gcf-projects ${uniqueProjects.size}`);
  console.log("automatic-opportunity-inference 0");
  warnings.forEach((item) => console.log(`- ${item}`));
}
