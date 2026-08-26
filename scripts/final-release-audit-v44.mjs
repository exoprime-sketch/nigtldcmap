import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

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
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir, extensions = null) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const p = path.join(absolute, entry.name);
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

function relative(file) {
  return path.relative(root, file).replaceAll("\\\\", "/");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log("=== v44 final release audit ===");

for (const item of mustBeAbsent) {
  assert(
    !fs.existsSync(path.join(root, item)),
    `${item} 가 공개 build/public 경로에 남아 있음 — npm run quarantine:legacy 실행 필요`
  );
}

const access = read("src/utils/datasetAccess.ts");
assert(
  access.includes('dataset.id.startsWith("LDC-EXAMPLE")'),
  "datasetAccess 공개 게이트에 LDC-EXAMPLE ID 방어선이 없음"
);
assert(
  access.includes('dataset.titleKo.trim().startsWith("[예시]")'),
  "datasetAccess 공개 게이트에 [예시] 제목 방어선이 없음"
);

const registry = read("src/data/publicDatasets.ts");
for (const id of [
  "LDC-EXAMPLE-C-014-PERMITTING",
  "LDC-EXAMPLE-E-012-PROJECT-LOCATIONS",
  "LDC-EXAMPLE-E-013-OM-CAPABILITY",
]) {
  const at = registry.indexOf(`id: "${id}"`);
  assert(at >= 0, `예시 Dataset registry 누락: ${id}`);
  if (at >= 0) {
    const next = registry.indexOf("\n  {\n    id: ", at + 1);
    const end = next >= 0 ? next : registry.indexOf("\n];", at);
    const block = registry.slice(at, end);
    assert(
      block.includes('publicationStatus: "withdrawn"'),
      `${id} publicationStatus가 withdrawn이 아님`
    );
    assert(
      block.includes('downloadMode: "none"'),
      `${id} downloadMode가 none이 아님`
    );
    assert(
      block.includes('rightsStatus: "restricted"'),
      `${id} rightsStatus가 restricted가 아님`
    );
    assert(
      block.includes('accessLevel: "internal"'),
      `${id} accessLevel이 internal이 아님`
    );
  }
}

// 페이지 내부 fragment가 SPA route와 충돌하지 않는지 확인
for (const file of walk("src", [".ts", ".tsx"])) {
  const text = fs.readFileSync(file, "utf8");
  if (/href\s*=\s*["']#/.test(text)) {
    failures.push(`${relative(file)} 에 href="#..." 내부 fragment가 남아 있음`);
  }
}

// 상대 import 존재 여부
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
  return candidates.some((candidate) => fs.existsSync(candidate));
}

for (const file of walk("src", [".ts", ".tsx"])) {
  const text = fs.readFileSync(file, "utf8");
  const patterns = [/from\s+["']([^"']+)["']/g, /import\s+["']([^"']+)["']/g];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const specifier = match[1];
      if (
        specifier.startsWith(".") &&
        !resolveRelativeImport(file, specifier)
      ) {
        failures.push(`${relative(file)} 상대 import 누락: ${specifier}`);
      }
    }
  }
}

// public JSON 구문 검사
for (const file of walk("public", [".json", ".geojson"])) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${relative(file)} JSON 파싱 실패: ${error.message}`);
  }
}

// TypeScript/TSX 구문 검사 — typescript가 설치된 환경에서만
try {
  const ts = await import("typescript");
  for (const file of walk("src", [".ts", ".tsx"])) {
    const text = fs.readFileSync(file, "utf8");
    const source = ts.createSourceFile(
      relative(file),
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    for (const diag of source.parseDiagnostics) {
      const pos = diag.start ?? 0;
      const lc = source.getLineAndCharacterOfPosition(pos);
      const message = ts.flattenDiagnosticMessageText(diag.messageText, " ");
      failures.push(
        `${relative(file)}:${lc.line + 1}:${
          lc.character + 1
        } 구문 오류: ${message}`
      );
    }
  }
} catch {
  warnings.push("typescript 모듈을 찾지 못해 TS/TSX parser 검사는 생략됨");
}

const result = {
  generatedAt: new Date().toISOString(),
  failures,
  warnings,
  status: failures.length === 0 ? "PASS" : "FAIL",
};

const artifactDir = path.join(root, "artifacts", "release-v44");
fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, "audit.json"),
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(`status: ${result.status}`);
console.log(`failures: ${failures.length}`);
console.log(`warnings: ${warnings.length}`);

for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const failure of failures) console.error(`FAIL  ${failure}`);

if (failures.length > 0) {
  process.exitCode = 1;
} else {
  console.log("PASS  공개화면 release gate 기본조건 통과");
}
