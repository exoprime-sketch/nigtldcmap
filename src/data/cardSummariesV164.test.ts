import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { loadCardSummariesV140 } from "./cardSummariesV140";
import { countryPublicDirV158, loadCountryRegistryV158, resetCountryRegistryCacheV158 } from "./countryContext";
import { getCardSpecV159 } from "./spec/datasetSpecV159";
import { publicSourceOrganizationV136_1 } from "./visualization/publicFieldPolicyV126";

const ROOT = path.resolve(__dirname, "../..");
const readPublic = (relative: string) => fs.readFileSync(path.join(ROOT, "public", relative), "utf8");

/** Serves the repository's own generated files to the loaders, as the browser would fetch them. */
function serveFiles(): void {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string) => {
    const target = String(url).split("?")[0].replace(/^\/+/u, "");
    const file = path.join(ROOT, "public", target);
    if (!target.startsWith("data/") || !fs.existsSync(file)) return { ok: false, status: 404, text: async () => "", json: async () => ({}) };
    const body = fs.readFileSync(file, "utf8");
    return { ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) };
  });
}

const realFetch = (globalThis as unknown as { fetch: unknown }).fetch;
beforeEach(async () => {
  serveFiles();
  await loadCountryRegistryV158((relPath: string) => relPath);
});
afterEach(() => {
  resetCountryRegistryCacheV158();
  (globalThis as unknown as { fetch: unknown }).fetch = realFetch;
});

const summariesFile = (iso3: string) => `${countryPublicDirV158(iso3).replace(/^public\//u, "")}/home/card-summaries-v140.json`;

describe("card summaries as the public screens read them (V164-4)", () => {
  it("reads Bangladesh's source lines as organisation names, without the compiler's separators", async () => {
    const cards = await loadCardSummariesV140("BGD");
    expect(cards.get("E-002")?.provider).toBe("UNFCCC");
    expect(cards.get("B-033")?.provider).toBe("Global Forest Watch (UMD/WRI, Hansen et al. 2013)");
    for (const card of cards.values()) {
      expect(card.provider).not.toMatch(/ \| |GADM|좌표\(/u);
    }
  });

  it("leaves the default country's reviewed source lines alone", async () => {
    const cards = await loadCardSummariesV140("VNM");
    const raw = JSON.parse(readPublic(summariesFile("VNM"))) as { cards: Array<{ elementId: string; provider: string }> };
    expect(raw.cards.length).toBeGreaterThan(100);
    for (const row of raw.cards) {
      // Only the V161 judgement (working notes) applies - never the V164 reduction to names.
      const judged =
        publicSourceOrganizationV136_1(row.provider) ||
        publicSourceOrganizationV136_1(getCardSpecV159(row.elementId)?.sourceLabel) ||
        "";
      expect(cards.get(row.elementId)?.provider).toBe(judged);
    }
  });

  it("writes a count and its unit together, and unit spellings as printed", async () => {
    const cards = await loadCardSummariesV140("BGD");
    for (const card of cards.values()) {
      expect(card.headline.value).not.toMatch(/\d\s+(?:건|곳|개소|개)(?:$|\s)/u);
      expect(card.headline.value).not.toMatch(/(?:^|[^A-Za-z0-9])k?m2(?![A-Za-z0-9])/u);
    }
    expect(cards.get("A-026")?.headline.value).toMatch(/m²$/u);
    const gases = cards.get("A-010")?.preview.parts?.map((part) => part.label) ?? [];
    expect(gases).toContain("CO₂");
  });
});
