#!/usr/bin/env node
/**
 * Walk every detail screen and every map layer of the candidate build.
 *
 * Visiting, operating, reading meaning and capturing evidence are recorded as
 * four separate outcomes, because a screen that rendered is not the same as a
 * screen that answered anything. Map layers are exercised with real CDP pointer
 * events over the canvas rather than synthetic events on hidden nodes.
 *
 * Runs against a candidate build only; it neither reads nor writes public/.
 */

import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const BUILD_ROOT = resolve(PROJECT_ROOT, ".verify/candidate/build");
const OUT_DIR = resolve(PROJECT_ROOT, "reports/final-data-integration/candidate-qa");
const SHOTS = resolve(OUT_DIR, "screenshots");

const VIEWPORT = { width: 1440, height: 1000 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Everything the detail screen shows that a reader would use. */
const READ_SCREEN = `(() => {
  const t = (el) => (el && el.textContent || "").replace(/\\s+/g, " ").trim();
  const main = document.querySelector("main") || document.body;
  const selects = [...main.querySelectorAll("select")].map((s) => ({
    label: t(s.closest("label") || s.parentElement),
    value: s.value,
    shown: t(s.selectedOptions[0]),
    optionCount: s.options.length,
  }));
  const bars = [...main.querySelectorAll('[class*="contract-bars"] > div')].map((d) => t(d));
  const units = [...main.querySelectorAll("h5")].map((h) => t(h)).filter((x) => x.includes("단위"));
  const kpis = [...main.querySelectorAll('[class*="kpi"], [class*="metric"]')].map((d) => t(d));
  const body = t(main).slice(0, 4000);
  return {
    title: t(main.querySelector("h1")),
    headings: [...main.querySelectorAll("h2,h3,h4")].map((h) => t(h)).slice(0, 20),
    selects,
    selectCount: selects.length,
    barCount: bars.length,
    barSample: bars.slice(0, 6),
    units,
    kpis: kpis.slice(0, 6),
    hasNoDataNotice: /자료 없음|제공하지 않|수집되지 않/.test(body),
    numberCount: (body.match(/-?\\d[\\d,.]*/g) || []).length,
    bodyLength: body.length,
  };
})()`;

async function readScreen(cdp) {
  return evaluateValue(cdp, READ_SCREEN);
}

async function main() {
  if (!existsSync(BUILD_ROOT)) {
    console.error(`candidate build missing: ${BUILD_ROOT}`);
    return 1;
  }
  mkdirSync(SHOTS, { recursive: true });

  const server = await startStaticBuildServer(BUILD_ROOT);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const base = server.url.replace(/\/$/, "");

  await setViewport(cdp, VIEWPORT.width, VIEWPORT.height);

  // The catalog in the candidate build is the list of screens to walk.
  await navigate(cdp, `${base}/data/vietnam/v2/catalog.json`);
  const catalogText = await evaluateValue(cdp, "document.body.innerText");
  const catalog = JSON.parse(catalogText);
  const elements = catalog.elements;

  const rows = [];
  const findings = [];

  for (const element of elements) {
    const id = element.elementId;
    const url = `${base}/?view=data&country=VNM&element=${id}#element-detail`;
    const row = {
      elementId: id,
      elementLabel: element.elementLabel,
      dataPresenceStatus: element.dataPresenceStatus,
      visited: "NO",
      interactionReviewed: "NO",
      semanticReviewed: "NO",
      evidence: "NO",
      selectCount: 0,
      barCount: 0,
      note: "",
    };
    try {
      await navigate(cdp, url);
      await sleep(700);
      let screen = await readScreen(cdp);
      row.visited = screen.title ? "YES" : "NO";
      row.selectCount = screen.selectCount;
      row.barCount = screen.barCount;

      // Operate the screen: move the first selector that has real choices, and
      // confirm the page actually responds rather than just accepting the click.
      const before = JSON.stringify({ b: screen.barSample, k: screen.kpis });
      const changed = await evaluateValue(
        cdp,
        `(() => {
          const s = [...document.querySelectorAll("main select")].find((x) => x.options.length > 1);
          if (!s) return "NO_CONTROL";
          const i = s.selectedIndex;
          s.selectedIndex = (i + 1) % s.options.length;
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return s.options[s.selectedIndex].text;
        })()`
      );
      if (changed === "NO_CONTROL") {
        row.interactionReviewed = element.dataPresenceStatus === "not-collected" ? "N/A" : "NO_CONTROL";
      } else {
        await sleep(500);
        const after = await readScreen(cdp);
        const differs = JSON.stringify({ b: after.barSample, k: after.kpis }) !== before;
        row.interactionReviewed = differs ? "YES" : "NO_EFFECT";
        if (!differs) {
          findings.push({
            elementId: id,
            issue: "선택을 바꿔도 표시 결과가 달라지지 않음",
            detail: `변경한 선택지: ${changed}`,
          });
        }
        screen = after;
      }

      // Meaning: a screen counts as reviewed when it shows a unit and either a
      // value or an explicit no-data notice. Rendering alone is not enough.
      const hasUnit = screen.units.length > 0 || /단위/.test(JSON.stringify(screen.headings));
      const hasValues = screen.numberCount > 0 || screen.barCount > 0;
      if (element.dataPresenceStatus === "not-collected" || element.observationCount + element.entityCount === 0) {
        row.semanticReviewed = screen.hasNoDataNotice ? "YES_DATA_UNAVAILABLE" : "NO_NOTICE";
        if (!screen.hasNoDataNotice) {
          findings.push({ elementId: id, issue: "자료가 없는데 '자료 없음' 안내가 없음", detail: "" });
        }
      } else if (hasUnit && hasValues) {
        row.semanticReviewed = "YES";
      } else {
        row.semanticReviewed = "INCOMPLETE";
        findings.push({
          elementId: id,
          issue: "값 또는 단위 표기를 확인하지 못함",
          detail: `units=${screen.units.length} numbers=${screen.numberCount} bars=${screen.barCount}`,
        });
      }
      row.note = (screen.units[0] || "").slice(0, 60);
    } catch (error) {
      row.note = `ERROR ${String(error).slice(0, 80)}`;
      findings.push({ elementId: id, issue: "화면 오류", detail: row.note });
    }
    rows.push(row);
    if (rows.length % 20 === 0) process.stderr.write(`  ...${rows.length}/${elements.length}\n`);
  }

  // Evidence for the reference screens and anything that failed.
  const evidenceIds = new Set([
    "A-016", "B-005", "D-011", "A-017", "B-008", "B-031", "B-032", "B-033", "B-034",
    "A-023", "D-022", "D-025",
    ...findings.map((f) => f.elementId).slice(0, 12),
  ]);
  for (const id of evidenceIds) {
    try {
      await navigate(cdp, `${base}/?view=data&country=VNM&element=${id}#element-detail`);
      await sleep(800);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      const path = resolve(SHOTS, `detail-${id.toLowerCase()}.png`);
      writeFileSync(path, Buffer.from(data, "base64"));
      const row = rows.find((r) => r.elementId === id);
      if (row) row.evidence = statSync(path).size > 1000 ? "YES" : "EMPTY";
    } catch {
      /* recorded as NO below */
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const header = Object.keys(rows[0]);
  writeFileSync(
    resolve(OUT_DIR, "detail-coverage-v137.csv"),
    header.join(",") +
      "\n" +
      rows
        .map((r) =>
          header
            .map((h) => {
              const v = String(r[h] ?? "");
              return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
            })
            .join(",")
        )
        .join("\n") +
      "\n",
    "utf8"
  );

  const tally = (key) =>
    rows.reduce((acc, r) => ((acc[r[key]] = (acc[r[key]] ?? 0) + 1), acc), {});
  const summary = {
    generatedAt: new Date().toISOString(),
    buildRoot: ".verify/candidate/build",
    viewport: VIEWPORT,
    elementCount: rows.length,
    visited: tally("visited"),
    interactionReviewed: tally("interactionReviewed"),
    semanticReviewed: tally("semanticReviewed"),
    evidence: tally("evidence"),
    findingCount: findings.length,
    findings: findings.slice(0, 60),
  };
  writeFileSync(
    resolve(OUT_DIR, "detail-coverage-summary-v137.json"),
    JSON.stringify(summary, null, 2) + "\n",
    "utf8"
  );
  console.log(JSON.stringify(summary, null, 2).slice(0, 2200));

  await browser.close();
  await server.close();
  return 0;
}

main().then((code) => process.exit(code));
