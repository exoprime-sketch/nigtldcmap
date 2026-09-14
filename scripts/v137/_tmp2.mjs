import { resolve } from "node:path";
import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "../v125/browser-runtime.mjs";

const ROOT = "C:/Users/user/Documents/20260827_개도국전략지도플랫폼";
const server = await startStaticBuildServer(resolve(ROOT, ".verify/candidate/build"));
const browser = await launchHeadlessBrowser();
const cdp = browser.cdp;
await setViewport(cdp, 1440, 1000);
const id = process.argv[2] || "B-004";
await navigate(cdp, `${server.url.replace(/\/$/, "")}/?view=data&country=VNM&element=${id}#element-detail`);
await new Promise((r) => setTimeout(r, 6000));

const out = await evaluateValue(
  cdp,
  `(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    return {
      state: root && root.getAttribute('data-analysis-state'),
      hasSummary: Boolean(document.querySelector('[data-testid="region-scenario-summary-v137"]')),
      cardGrid: Boolean(document.querySelector('[data-testid="public-entity-card-grid-v131"]')),
      testIds: [...document.querySelectorAll('[data-testid]')].map(e => e.getAttribute('data-testid')).slice(0, 40),
      rawTableRows: document.querySelectorAll('[data-testid="public-raw-table"] tbody tr').length,
      preview: Boolean(document.querySelector('[data-testid="semantic-archetype-preview"]')),
      analysisTestIds: [...(document.querySelector('[data-testid="public-analysis-root"]')||document.body).querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')).filter((v,i,a)=>a.indexOf(v)===i).slice(0,25)
    };
  })()`
);
console.log(JSON.stringify(out, null, 2));
await browser.close();
await server.close();
