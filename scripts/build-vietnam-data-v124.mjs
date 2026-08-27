#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");

const candidates = process.env.VIETNAM_V124_PYTHON
  ? [[process.env.VIETNAM_V124_PYTHON, []]]
  : process.platform === "win32"
    ? [["python", []], ["py", ["-3"]]]
    : [["python3", []], ["python", []]];

let selected = null;
for (const [command, prefix] of candidates) {
  const probe = spawnSync(
    command,
    [...prefix, "-c", "import openpyxl; print(openpyxl.__version__)"],
    { cwd: PROJECT_ROOT, encoding: "utf8", windowsHide: true }
  );
  if (probe.status === 0) {
    selected = { command, prefix };
    break;
  }
}

if (!selected) {
  console.error(
    "Python 3 with openpyxl is required. Install tools/vietnam_etl/requirements.txt or set VIETNAM_V124_PYTHON."
  );
  process.exit(1);
}

const result = spawnSync(
  selected.command,
  [...selected.prefix, "-m", "tools.vietnam_etl.build_public_v2"],
  {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    stdio: "inherit",
    windowsHide: true,
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
