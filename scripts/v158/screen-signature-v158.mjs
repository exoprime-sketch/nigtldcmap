#!/usr/bin/env node
/**
 * A stable signature of every public screen, so "화면 변화 0" can be proved.
 *
 * The V158-A refactor moved 294 hand-written asset paths behind a helper. Nothing
 * on screen may move because of that, and reading the diff is not proof: the
 * screens have to be rendered and compared. This walks the home screen, the data
 * finder and every offered element's detail page in a production build, and
 * writes one sha256 per screen over its visible text and its data-testid tree.
 *
 * Usage:
 *   node scripts/v158/screen-signature-v158.mjs --build tmp/build-x --out reports/v158/signature-x.json
 *     [--screens home,finder,map,downloads,guide,detail:A-001]
 *   node scripts/v158/screen-signature-v158.mjs --compare a.json b.json
 *
 * The comparison is what the gate reads: it prints the screens whose signature
 * differs, or states that none do.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { countryPublicDirV158, repoRootV158, resolveCountryIso3V158 } from "./country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};

const COUNTRY = resolveCountryIso3V158({ argv });
const PORT = Number(opt("port", "4327"));
const CONCURRENCY = Number(opt("concurrency", "3"));

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Compare two signature files and report the screens that differ. */
function compare(leftPath, rightPath) {
  const left = JSON.parse(readFileSync(resolve(ROOT, leftPath), "utf8"));
  const right = JSON.parse(readFileSync(resolve(ROOT, rightPath), "utf8"));
  const leftByKey = new Map(left.screens.map((row) => [row.key, row]));
  const rightByKey = new Map(right.screens.map((row) => [row.key, row]));
  const keys = [...new Set([...leftByKey.keys(), ...rightByKey.keys()])].sort();
  const differences = [];
  for (const key of keys) {
    const before = leftByKey.get(key);
    const after = rightByKey.get(key);
    if (!before) differences.push({ key, kind: "added" });
    else if (!after) differences.push({ key, kind: "removed" });
    else if (before.signature !== after.signature) {
      differences.push({
        key,
        kind: "changed",
        textChanged: before.textSignature !== after.textSignature,
        structureChanged: before.structureSignature !== after.structureSignature,
      });
    }
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        type: "compare",
        left: leftPath,
        right: rightPath,
        screens: keys.length,
        differenceCount: differences.length,
        differences: differences.slice(0, 40),
      },
      null,
      2
    )}\n`
  );
  if (differences.length > 0) process.exitCode = 1;
}

if (argv.includes("--compare")) {
  const at = argv.indexOf("--compare");
  compare(argv[at + 1], argv[at + 2]);
} else {
  const BUILD = resolve(ROOT, opt("build", "build"));
  const OUT = resolve(ROOT, opt("out", "reports/v158/screen-signature-v158.json"));
  if (!existsSync(BUILD)) throw new Error(`BUILD_NOT_FOUND: ${BUILD}`);

  const catalog = JSON.parse(
    readFileSync(resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY), "catalog.json"), "utf8")
  );
  // Only screens a reader can reach: an excluded element has no detail page.
  const NON_PUBLIC = new Set(["excluded", "not-provided"]);
  const elements = catalog.elements
    .filter((item) => !NON_PUBLIC.has(item.publicStatus))
    .map((item) => item.elementId)
    .sort();

  // The view is read from the hash (src/app/navigation.ts); a `view=` query
  // parameter is not a route and opens the home screen.
  const allScreens = [
    { key: "home", url: "/" },
    { key: "finder", url: `/?country=${COUNTRY}#explorer` },
    { key: "map", url: `/?country=${COUNTRY}#map` },
    { key: "downloads", url: `/?country=${COUNTRY}#download` },
    { key: "guide", url: "/#guide" },
    ...elements.map((elementId) => ({
      key: `detail:${elementId}`,
      url: `/?country=${COUNTRY}&element=${elementId}#element-detail`,
      elementId,
    })),
  ];
  const onlyKeys = opt("screens", "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const screens = onlyKeys.length > 0 ? allScreens.filter((screen) => onlyKeys.includes(screen.key)) : allScreens;

  const server = await startStaticBuildServer(BUILD, { port: PORT });
  const base = server.url.replace(/\/$/u, "");
  const browser = await chromium.launch();

  /**
   * The signature deliberately drops what a rebuild is allowed to change: the
   * asset hashes in URLs, timestamps and the scroll position. What it keeps is
   * what a reader sees and what the audits key on.
   */
  async function signatureFor(page, screen) {
    await page.goto(`${base}${screen.url}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (screen.elementId) {
      await page
        .waitForFunction(
          () => {
            const root = document.querySelector('[data-testid="public-analysis-root"]');
            return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "");
          },
          null,
          { timeout: 45000 }
        )
        .catch(() => {});
    } else {
      await page.waitForSelector("main, [data-testid]", { timeout: 45000 }).catch(() => {});
    }
    await page.waitForTimeout(400);
    const captured = await page.evaluate(() => {
      const root = document.querySelector("main") ?? document.body;
      const text = (root.innerText || "").replace(/\s+/gu, " ").trim();
      const structure = [...root.querySelectorAll("[data-testid]")]
        .map((node) => {
          const attributes = [...node.attributes]
            .filter((attribute) => attribute.name.startsWith("data-"))
            .map((attribute) => `${attribute.name}=${attribute.value}`)
            .sort()
            .join(",");
          return `${node.tagName.toLowerCase()}[${attributes}]`;
        })
        .join("|");
      return { text, structure };
    });
    const textSignature = sha256(captured.text);
    const structureSignature = sha256(captured.structure);
    return {
      key: screen.key,
      textSignature,
      structureSignature,
      signature: sha256(`${textSignature}:${structureSignature}`),
      textLength: captured.text.length,
      testIdCount: captured.structure ? captured.structure.split("|").length : 0,
    };
  }

  const results = [];
  const queue = [...screens];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      for (;;) {
        const screen = queue.shift();
        if (!screen) break;
        results.push(await signatureFor(page, screen));
      }
      await page.close();
    })
  );
  await browser.close();
  await server.close();

  results.sort((left, right) => left.key.localeCompare(right.key));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        schema: "screen-signature-v158",
        countryIso3: COUNTRY,
        build: opt("build", "build"),
        screenCount: results.length,
        screens: results,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  process.stdout.write(
    `${JSON.stringify({ type: "summary", screens: results.length, out: OUT.replace(ROOT, "").replace(/\\/gu, "/") })}\n`
  );
}
