import { chromium } from "playwright";
const [elementId, extra=""] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`http://127.0.0.1:4318/?view=data&country=VNM&element=${elementId}${extra}#element-detail`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);
const text = await page.evaluate(() => document.body.innerText);
console.log(text);
await browser.close();
