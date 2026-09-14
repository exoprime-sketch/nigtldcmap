import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { resolve } from "node:path";

// CRA resolves plugins from the candidate's appNodeModules, so resolving only
// the CLI from the repository is insufficient. Reuse npm ci's installation.
export function ensureCandidateDependencies(root, candidate) {
  const modules = resolve(candidate, "node_modules");
  const cli = resolve(modules, "react-scripts/bin/react-scripts.js");
  if (existsSync(cli)) return cli;
  if (lstatSync(modules, { throwIfNoEntry: false })) {
    throw new Error(`CANDIDATE_DEPENDENCIES_INCOMPLETE: ${modules}`);
  }
  const installed = resolve(root, "node_modules");
  if (!existsSync(resolve(installed, "react-scripts/bin/react-scripts.js"))) {
    throw new Error("REACT_SCRIPTS_MISSING: run npm ci in the repository before building the candidate");
  }
  symlinkSync(installed, modules, process.platform === "win32" ? "junction" : "dir");
  return cli;
}
