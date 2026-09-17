import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Checks captured browser evidence against downloads. This deliberately does
// not certify all controls, all arithmetic or the full analytical adequacy.
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const browserPath = "output/public-review-20260917/v144/browser-review-v144.json";
const browser = read(browserPath);
const checks = [];
function check(name, work) {
  try { work(); checks.push({ name, status: "PASS" }); }
  catch (error) { checks.push({ name, status: "FAIL", message: error.message }); }
}
check("152 distinct routes ready", () => {
  assert.equal(new Set(browser.routes.map((row) => row.id)).size, 152);
  assert.equal(browser.routes.length, 152);
  assert(browser.routes.every((row) => row.state === "ready" && !row.overflow));
});
check("118 first-selector smoke checks changed the displayed content", () => {
  assert.equal(browser.interactions.length, 118);
  assert(browser.interactions.every((row) => row.result === "content-changed"));
});
check("30 responsive smoke cases have no horizontal page overflow", () => {
  assert.equal(browser.responsive.length, 30);
  assert(browser.responsive.every((row) => row.state === "ready" && !row.overflow));
});
const unemployment = read("public/data/vietnam/v2/downloads/a-006.json");
const unemploymentEvidence = browser.scenarioChecks.find((row) => row.id === "A-006");
check("A006 four displayed selections match exact downloaded observations", () => {
  const expected = [["A-006_unemp_total_ilo", 2025], ["A-006_unemp_total_ilo", 2024], ["A-006_unemp_total_national", 2024], ["A-006_unemp_youth_national", 2024]];
  assert.equal(unemploymentEvidence.cases.length, expected.length);
  expected.forEach(([indicatorId, year], index) => {
    const rows = unemployment.observations.filter((row) => row.indicatorId === indicatorId && row.year === year);
    assert.equal(rows.length, 1);
    assert.equal(Number(unemploymentEvidence.cases[index].exact), rows[0].value);
  });
  assert.equal(unemploymentEvidence.redundantDetailSelector, 0);
  assert(unemploymentEvidence.table.includes("2024\t1.529\t%"));
});
const research = read("public/data/vietnam/v2/downloads/e-008.json");
const researchEvidence = browser.scenarioChecks.find((row) => row.id === "E-008");
check("E008 actual card preserves document count, period and source scope", () => {
  assert(researchEvidence.cardText.includes("144건"));
  assert(researchEvidence.cardText.includes("2021–2026년"));
  assert(researchEvidence.cardText.includes("각 논문 출판사·특허 공개 원문"));
  assert(!/Scimago|WIPO/.test(researchEvidence.cardText));
  assert.equal(research.observations.length, 0);
  assert.equal(researchEvidence.emptyNationalCharts, 0);
});
check("E008 both annual browser tables reconcile to downloaded document years", () => {
  for (const [kind, key] of [["논문", "paperRows"], ["특허", "patentRows"]]) {
    const byYear = new Map();
    // Use the delivered raw columns, independently of the detail's reviewed aliases.
    for (const row of research.entities.filter((row) => row.rawAttributes.attr_1 === kind)) {
      const year = String(row.rawAttributes.attr_9);
      byYear.set(year, (byYear.get(year) || 0) + 1);
    }
    assert.deepEqual(researchEvidence[key], [...byYear.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([year, count]) => [year, String(count)]));
  }
});
check("E008 actual patent/year and source-field list filters agree with source rows", () => {
  assert.equal(researchEvidence.patent2024Count, research.entities.filter((row) => row.rawAttributes.attr_1 === "특허" && row.rawAttributes.attr_9 === 2024).length);
  assert(researchEvidence.firstRecordField.includes("기후변화 취약성·위험성 평가"));
  assert(!researchEvidence.firstRecordField.includes("건강"));
  const sourceSingleField = research.entities.filter((row) => /CTIS-30/.test(row.rawAttributes.attr_14) && !/34\s*로\s*단일\s*부여/.test(row.rawAttributes.attr_14));
  assert.equal(researchEvidence.vulnerabilityCount, sourceSingleField.length);
});
const output = {
  generatedAt: new Date().toISOString(), status: checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL",
  scope: "Browser smoke evidence plus A006/E008 independent source checks; NOT 152-element analytical acceptance",
  buildScope: browser.buildScope, browserEvidenceSha256: createHash("sha256").update(readFileSync(browserPath)).digest("hex"),
  passed: checks.filter((check) => check.status === "PASS").length, total: checks.length, checks,
};
writeFileSync("reports/v144/review-evidence-audit-v144.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
if (output.status === "FAIL") process.exitCode = 1;
