#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  AuditV125,
  PROJECT_ROOT,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("deployment:v128");
const reportRoot = resolve(PROJECT_ROOT, "reports/v128");
const reportPath = resolve(reportRoot, "deployment-audit-v128.json");
const rootBuild = resolve(PROJECT_ROOT, "build");
const subpath = "/nigtldcmap";

function npmCommand() {
  const candidates = [
    process.env.npm_execpath,
    resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    process.env.APPDATA
      ? resolve(process.env.APPDATA, "npm/node_modules/npm/bin/npm-cli.js")
      : null,
  ].filter((value) => typeof value === "string" && value.length > 0);
  const npmCli = candidates.find(existsSync) || null;
  return npmCli
    ? { executable: process.execPath, prefix: [npmCli], shell: false }
    : {
        executable: process.platform === "win32" ? "npm.cmd" : "npm",
        prefix: [],
        shell: process.platform === "win32",
      };
}

function walk(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function normalizeAssetPath(value) {
  return String(value || "").replace(/^\/+/, "");
}

async function verifyAssets(serverUrl, paths) {
  const results = [];
  for (const path of paths) {
    const url = `${serverUrl.replace(/\/+$/u, "")}/${normalizeAssetPath(path)}`;
    const startedAt = Date.now();
    try {
      const response = await fetch(url, { cache: "no-store" });
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();
      let parsed = null;
      let parseError = null;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
      }
      results.push({
        path,
        url,
        status: response.status,
        contentType,
        bytes: Buffer.byteLength(text),
        json: parsed !== null,
        parseError,
        html: /text\/html/iu.test(contentType) || /^\s*<!doctype\s+html/iu.test(text),
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      results.push({
        path,
        url,
        status: 0,
        contentType: "",
        bytes: 0,
        json: false,
        parseError: error instanceof Error ? error.message : String(error),
        html: false,
        durationMs: Date.now() - startedAt,
      });
    }
  }
  return results;
}

const manifestResult = readJson(resolve(PROJECT_ROOT, "public/data/vietnam/v2/manifest.json"));
const manifest = manifestResult.value || {};
const searchIndex = Array.isArray(manifest.assets?.searchIndex)
  ? manifest.assets.searchIndex[0]
  : null;
const requiredAssets = [
  "/data/vietnam/v2/manifest.json",
  "/data/vietnam/v2/catalog.json",
  "/data/vietnam/v2/packs/bundle-index-v124.json",
  "/data/vietnam/v2/semantic/indicator-semantics-v125.json",
  "/data/vietnam/v2/semantic/element-visualization-contracts-v125.json",
  "/data/vietnam/v2/downloads/a-002.json",
  "/data/vietnam/v2/map-index.json",
  "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
  ...(manifest.assets?.regionalProjectGeometry
    ? [manifest.assets.regionalProjectGeometry]
    : []),
  ...(searchIndex ? [searchIndex] : []),
  ...(Array.isArray(manifest.assets?.spatialLayers)
    ? manifest.assets.spatialLayers
    : []),
];

const srcRoot = resolve(PROJECT_ROOT, "src");
const resolverPath = resolve(srcRoot, "utils/publicAssetUrlV128.ts");
const rootRelativeRuntimeUses = [];
for (const path of walk(srcRoot)) {
  if (!/\.(?:ts|tsx|js|jsx)$/u.test(path) || path === resolverPath) continue;
  const lines = readFileSync(path, "utf8").split(/\r?\n/u);
  lines.forEach((line, index) => {
    if (/(["'`])\/(?:data|assets)\//u.test(line)) {
      rootRelativeRuntimeUses.push({
        path: relative(PROJECT_ROOT, path).replace(/\\/gu, "/"),
        line: index + 1,
        text: line.trim().slice(0, 240),
      });
    }
  });
}
const resolverSource = existsSync(resolverPath) ? readFileSync(resolverPath, "utf8") : "";
const resolverContract =
  /process\.env\.PUBLIC_URL/u.test(resolverSource) &&
  /publicAssetUrlV128/u.test(resolverSource) &&
  /replace\(/u.test(resolverSource);
const indexTemplatePath = resolve(PROJECT_ROOT, "public/index.html");
const indexTemplate = existsSync(indexTemplatePath)
  ? readFileSync(indexTemplatePath, "utf8")
  : "";
const templateRootRelativeAssets = [
  ...indexTemplate.matchAll(/(?:src|href)=["'](\/(?!\/)[^"']+)["']/gu),
].map((match) => match[1]);

let rootServer = null;
let subpathServer = null;
let browser = null;
let tempBuildRoot = null;
let buildResult = null;
let subpathSourceMapCount = null;
let rootAssets = [];
let subpathAssets = [];
let browserResult = null;
let runtimeError = null;
const networkAssets = [];
const httpFailures = [];

try {
  rootServer = await startStaticBuildServer(rootBuild);
  rootAssets = await verifyAssets(rootServer.url, requiredAssets);

  tempBuildRoot = mkdtempSync(join(tmpdir(), "nigtldcmap-v128-subpath-"));
  const command = npmCommand();
  const result = spawnSync(command.executable, [...command.prefix, "run", "build"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      BUILD_PATH: tempBuildRoot,
      PUBLIC_URL: subpath,
      GENERATE_SOURCEMAP: "false",
    },
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: command.shell,
    timeout: 30 * 60 * 1000,
    windowsHide: true,
  });
  buildResult = {
    status: result.status,
    signal: result.signal,
    error: result.error instanceof Error ? result.error.message : null,
    stdoutTail: String(result.stdout || "").split(/\r?\n/u).filter(Boolean).slice(-30),
    stderrTail: String(result.stderr || "").split(/\r?\n/u).filter(Boolean).slice(-30),
  };
  if (result.status !== 0 || result.error) {
    throw new Error(`subpath build failed: ${result.error || result.status}`);
  }
  subpathSourceMapCount = walk(tempBuildRoot).filter((path) =>
    path.endsWith(".map")
  ).length;

  const subpathIndex = readFileSync(resolve(tempBuildRoot, "index.html"), "utf8");
  const ownReferences = [
    ...subpathIndex.matchAll(/(?:src|href)=["']([^"']+)["']/gu),
  ]
    .map((match) => match[1])
    .filter((value) => !/^(?:https?:|data:|#)/iu.test(value));
  const invalidReferences = ownReferences.filter(
    (value) => !value.startsWith(`${subpath}/`)
  );
  const missingReferences = ownReferences
    .filter((value) => value.startsWith(`${subpath}/`))
    .map((value) => ({
      url: value,
      path: resolve(tempBuildRoot, value.slice(subpath.length).replace(/^\/+/, "")),
    }))
    .filter((entry) => !existsSync(entry.path));

  subpathServer = await startStaticBuildServer(tempBuildRoot, { basePath: subpath });
  subpathAssets = await verifyAssets(subpathServer.url, requiredAssets);
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = String(response.url || "");
    if (Number(response.status || 0) >= 400) {
      httpFailures.push({
        url,
        status: Number(response.status || 0),
        contentType: String(response.mimeType || response.headers?.["content-type"] || ""),
      });
    }
    if (!url.includes("/data/")) return;
    networkAssets.push({
      url,
      status: Number(response.status || 0),
      contentType: String(response.mimeType || response.headers?.["content-type"] || ""),
    });
  });
  await navigate(browser.cdp, `${subpathServer.url}/#home`);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v128-home]') && !document.querySelector('[role="alert"]'))`,
    { timeoutMs: 30_000 }
  );
  await navigate(
    browser.cdp,
    `${subpathServer.url}/?country=VNM&element=A-002#element-detail`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-element-id="A-002"]'))`,
    { timeoutMs: 30_000 }
  );
  await navigate(browser.cdp, `${subpathServer.url}/?country=VNM#map`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('.cdp-map-page'))`, {
    timeoutMs: 30_000,
  });
  browserResult = await evaluateValue(
    browser.cdp,
    `(() => ({
      pathname: location.pathname,
      mapMounted: Boolean(document.querySelector('.cdp-map-page')),
      mapWidth: Math.round(document.querySelector('.cdp-map-canvas-wrap')?.getBoundingClientRect().width || 0),
      mapHeight: Math.round(document.querySelector('.cdp-map-canvas-wrap')?.getBoundingClientRect().height || 0),
      resolverFetches: performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => url.includes('/data/'))
    }))()`
  );
  browserResult.invalidIndexReferences = invalidReferences;
  browserResult.missingIndexReferences = missingReferences.map((entry) => entry.url);
} catch (error) {
  runtimeError = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (subpathServer) await subpathServer.close();
  if (rootServer) await rootServer.close();
  if (tempBuildRoot) {
    const safeTempRoot = resolve(tmpdir());
    const safeBuildRoot = resolve(tempBuildRoot);
    if (
      safeBuildRoot !== safeTempRoot &&
      (safeBuildRoot.startsWith(`${safeTempRoot}\\`) ||
        safeBuildRoot.startsWith(`${safeTempRoot}/`))
    ) {
      rmSync(safeBuildRoot, { recursive: true, force: true });
    }
  }
}

function failedAssets(entries) {
  return entries.filter(
    (entry) => entry.status !== 200 || !entry.json || entry.html || entry.bytes <= 0
  );
}
const rootAssetFailures = failedAssets(rootAssets);
const subpathAssetFailures = failedAssets(subpathAssets);
const networkFailures = networkAssets.filter(
  (entry) => entry.status !== 200 || /text\/html/iu.test(entry.contentType)
);
const subpathNetworkResolved =
  networkAssets.length > 0 &&
  networkAssets.every((entry) => new URL(entry.url).pathname.startsWith(`${subpath}/data/`));

const report = {
  schemaVersion: "v128-deployment-audit-1",
  generatedAt: new Date().toISOString(),
  requiredAssetCount: requiredAssets.length,
  resolver: {
    path: relative(PROJECT_ROOT, resolverPath).replace(/\\/gu, "/"),
    contract: resolverContract,
    rootRelativeRuntimeUses,
    templateRootRelativeAssets,
  },
  root: { assets: rootAssets, failures: rootAssetFailures },
  subpath: {
    basePath: subpath,
    build: buildResult,
    sourceMapCount: subpathSourceMapCount,
    assets: subpathAssets,
    failures: subpathAssetFailures,
    browser: browserResult,
    networkAssets,
    networkFailures,
    httpFailures,
    networkResolved: subpathNetworkResolved,
  },
  customRootDomain: {
    contractCompatible: rootAssetFailures.length === 0,
    dnsTlsVerified: false,
    note: "host-neutral root artifact verified locally; DNS, TLS and hosting settings require deployment-time smoke",
  },
  runtimeError,
};
mkdirSync(reportRoot, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

audit.check("PUBLIC_ASSET_RESOLVER", resolverContract, resolverContract, true);
audit.check(
  "ROOT_RELATIVE_RUNTIME_ASSET_LITERAL",
  rootRelativeRuntimeUses.length === 0,
  rootRelativeRuntimeUses,
  []
);
audit.check(
  "INDEX_TEMPLATE_BASE_PATH",
  templateRootRelativeAssets.length === 0,
  templateRootRelativeAssets,
  []
);
audit.check("ROOT_BUILD_ASSETS", rootAssetFailures.length === 0, rootAssetFailures, []);
audit.check(
  "SUBPATH_PRODUCTION_BUILD",
  buildResult?.status === 0 && buildResult?.error === null,
  buildResult,
  { status: 0, error: null }
);
audit.check(
  "SUBPATH_SOURCE_MAP_COUNT",
  subpathSourceMapCount === 0,
  subpathSourceMapCount,
  0
);
audit.check("SUBPATH_BUILD_ASSETS", subpathAssetFailures.length === 0, subpathAssetFailures, []);
audit.check(
  "SUBPATH_RUNTIME_RESOLUTION",
  runtimeError === null &&
    browserResult?.pathname === `${subpath}/` &&
    browserResult?.mapMounted === true &&
    browserResult?.mapWidth > 300 &&
    browserResult?.mapHeight > 400 &&
    subpathNetworkResolved &&
    networkFailures.length === 0 &&
    (browser?.runtimeErrors?.length || 0) === 0,
  {
    runtimeError,
    browserResult,
    networkResolved: subpathNetworkResolved,
    networkFailures,
    httpFailures,
    runtimeErrors: browser?.runtimeErrors || [],
  },
  {
    runtimeError: null,
    pathname: `${subpath}/`,
    mapMounted: true,
    mapWidth: ">300",
    mapHeight: ">400",
    networkResolved: true,
    networkFailures: [],
    runtimeErrors: [],
  }
);
audit.check(
  "CUSTOM_ROOT_DOMAIN_CONTRACT",
  rootAssetFailures.length === 0,
  rootAssetFailures,
  []
);

audit.finish({
  publicAssetBasePath: audit.checks.every((check) => check.status === "PASS")
    ? "PASS"
    : "FAIL",
  rootAssetCount: rootAssets.length,
  subpathAssetCount: subpathAssets.length,
  brokenAssetCount: rootAssetFailures.length + subpathAssetFailures.length,
  htmlForJsonCount: [...rootAssets, ...subpathAssets].filter((entry) => entry.html).length,
  deploymentReport: relative(PROJECT_ROOT, reportPath).replace(/\\/gu, "/"),
});
