import { chromium } from "playwright";
const [url, out, w = "1440", h = "1000", full = "0"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: full === "1" });
console.log("innerWidth", await page.evaluate(() => window.innerWidth));
await browser.close();
