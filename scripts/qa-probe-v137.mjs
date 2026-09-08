#!/usr/bin/env node
/** One-screen probe: how long the detail view needs before it has content. */

import { resolve } from "node:path";
import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";

const BUILD_ROOT = resolve(import.meta.dirname, "..", ".verify/candidate/build");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(() => {
  const t = (el) => (el && el.textContent || "").replace(/\\s+/g, " ").trim();
  const main = document.querySelector("main");
  return {
    hasMain: Boolean(main),
    mainLen: t(main).length,
    bodyLen: t(document.body).length,
    selectsInMain: main ? main.querySelectorAll("select").length : 0,
    selectsInDoc: document.querySelectorAll("select").length,
    h1: t(document.querySelector("h1")).slice(0, 60),
    h5count: document.querySelectorAll("h5").length,
    barDivs: document.querySelectorAll('[class*="contract-bars"] > div').length,
    sample: t(document.body).slice(0, 200),
  };
})()`;

const server = await startStaticBuildServer(BUILD_ROOT);
const browser = await launchHeadlessBrowser();
const cdp = browser.cdp;
const failures = [];
await cdp.send("Network.enable", {});
cdp.on("Network.loadingFailed", (p) => failures.push(`FAILED ${p.errorText}`));
cdp.on("Network.responseReceived", (p) => {
  if (p.response.status >= 400) failures.push(`HTTP ${p.response.status} ${p.response.url}`);
});
await setViewport(cdp, 1440, 1000);
const base = server.url.replace(/\/$/, "");

for (const id of ["A-017", "B-034"]) {
  await navigate(cdp, `${base}/?view=data&country=VNM&element=${id}#element-detail`);
  for (const wait of [700, 1500, 3000, 6000]) {
    await sleep(wait === 700 ? 700 : wait - 0);
    const probe = await evaluateValue(cdp, PROBE);
    console.log(id, `t≈${wait}ms`, JSON.stringify(probe).slice(0, 320));
    if (probe.selectsInDoc > 0 && probe.mainLen > 500) break;
  }
  console.log("network:", JSON.stringify(failures.slice(0, 6)));
  console.log("runtimeErrors:", JSON.stringify((browser.runtimeErrors || []).slice(0, 4)).slice(0, 500));
  failures.length = 0;
  console.log("---");
}

await browser.close();
await server.close();
