import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureCandidateDependencies } from "./candidate-dependencies.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "candidate-dependencies-"));
  const candidate = join(root, "candidate");
  mkdirSync(candidate);
  return { root, candidate };
}
function install(root) {
  const dir = join(root, "node_modules/react-scripts/bin");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "react-scripts.js"), "// fixture");
}
test("fresh candidate reuses root npm ci install and is idempotent", () => {
  const { root, candidate } = fixture();
  install(root);
  const cli = ensureCandidateDependencies(root, candidate);
  assert.equal(realpathSync(cli), realpathSync(join(root, "node_modules/react-scripts/bin/react-scripts.js")));
  assert.equal(ensureCandidateDependencies(root, candidate), cli);
});
test("existing candidate installation is preserved", () => {
  const { root, candidate } = fixture();
  install(candidate);
  assert.equal(ensureCandidateDependencies(root, candidate), join(candidate, "node_modules/react-scripts/bin/react-scripts.js"));
});
test("missing root install fails explicitly", () => {
  const { root, candidate } = fixture();
  assert.throws(() => ensureCandidateDependencies(root, candidate), /REACT_SCRIPTS_MISSING/);
});
test("incomplete existing installation is not overwritten", () => {
  const { root, candidate } = fixture();
  install(root);
  mkdirSync(join(candidate, "node_modules"));
  assert.throws(() => ensureCandidateDependencies(root, candidate), /CANDIDATE_DEPENDENCIES_INCOMPLETE/);
});
