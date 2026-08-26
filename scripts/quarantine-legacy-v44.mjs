import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const archiveRoot = path.join(root, "_archive", "legacy-v44");

const targets = [
  "src/components/local",
  "src/components/opportunity",
  "src/data/local",
  "src/data/opportunities",
  "src/types/local.ts",
  "src/types/opportunity.ts",

  // 현재 공개 화면에서 참조되지 않는 과거 스타일
  "src/styles/country-profile.css",
  "src/styles/country-compare.css",
  "src/styles/data-guide-final.css",
  "src/styles/technology-opportunity-v28.css",
  "src/styles/gcf-country-profile-v14.css",
  "src/styles/cooperation-insights-final.css",
  "src/styles/cooperation-insights.css",

  // 화면 검증용 예시·템플릿 — 삭제하지 않고 public 밖으로 이동
  "public/data/local",
  "public/data/platform/categorical/E-013__om-capability-example__20260806.json",
  "public/data/platform/geospatial/E-012__project-locations-example__20260806.json",
  "public/data/platform/text/C-014__permitting-example__20260806.json",
  "public/data/policy/policy-document-previews.template.json",

  // v101: 과거 시연값·example fallback이 들어 있는 정적 공개 산출물
  "public/vietnam-full-load-demo-v46.html",
  "public/data/demo/vietnam-full-load-v46.json",
  "public/data/demo/vietnam-full-load-v48.json",
  "public/data/registry/final-152-upload-manifest-v94.json",
  "public/data/registry/final-152-platform-completion-v95.json",
  "public/data/registry/release-candidate-v96.json",
];

function movePreservingPath(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(archiveRoot, relativePath);

  if (!fs.existsSync(source)) {
    console.log(`SKIP  ${relativePath} — 이미 이동되었거나 존재하지 않음`);
    return;
  }

  if (fs.existsSync(destination)) {
    console.log(`SKIP  ${relativePath} — archive에 동일 경로가 이미 존재`);
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  console.log(`MOVE  ${relativePath} -> ${path.relative(root, destination)}`);
}

console.log("=== v44 legacy/example quarantine ===");
console.log("파일을 삭제하지 않고 _archive/legacy-v44 아래로 이동함\n");

for (const target of targets) {
  movePreservingPath(target);
}

fs.mkdirSync(archiveRoot, { recursive: true });
fs.writeFileSync(
  path.join(archiveRoot, "README-KO.txt"),
  [
    "v44 공개판에서 제외한 과거 구현·화면검증용 파일 보관소",
    "",
    "- 삭제한 파일 없음",
    "- src 밖으로 이동하여 TypeScript 공개 빌드 대상에서 제외",
    "- public 밖으로 이동하여 예시 JSON 직접 공개를 방지",
    "- 실제 데이터로 교체가 필요한 경우 원본 구조 참고용으로만 사용",
    "",
    "공개 앱에서 이 폴더의 파일을 다시 import하거나 링크하지 말 것",
  ].join("\n"),
  "utf8"
);

console.log("\n완료: _archive/legacy-v44/");
