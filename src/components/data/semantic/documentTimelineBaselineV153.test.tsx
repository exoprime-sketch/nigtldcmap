import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { ElementVisualizationContractV125 } from "../../../data/visualization/semanticTypesV125";
import SemanticContractRendererV125 from "./SemanticContractRendererV125";
import { countryPublicDirV158 } from "../../../data/countryContext";
import { readDownloadJsonV158 } from "../../../data/testing/downloadZipV158";
import { RegionCountryContextV162 } from "../../../data/geo/regionDisplayV162";
import { registerFieldDefinitionsV162 } from "../../../data/visualization/wideRecordsV162";
import { policyDocumentDescriptionV153 } from "../../../data/visualization/policyDescriptionsV153";
import wideFieldDefinitionsFixture from "./__fixtures__/documentTimelineFieldDefinitionsV162.json";
import legacyC009 from "./__fixtures__/documentTimelineLegacyC009V162.json";
import legacyC010 from "./__fixtures__/documentTimelineLegacyC010V162.json";
import legacyC016 from "./__fixtures__/documentTimelineLegacyC016V162.json";

/**
 * V153-D3 adds a platform-edited description under the timeline entries of
 * C-009 and C-010. The document timeline is shared with C-016, whose entries
 * carry no description key, so its markup must not move by a byte. The hash
 * below was taken from the renderer before the V153 line was added.
 *
 * V162 (2026-09-30 delivery): C-008/C-009/C-010/C-016 moved to the wide
 * one-row-per-record template ('[블록] 속성' columns; SemanticContractRendererV125
 * routes a wide element's policy-timeline renderer to WideRecordCardsV162
 * instead of this document timeline - see wideRecordsTopV162 near the top of
 * that file). The live delivery's C-009/C-010/C-016 entities no longer carry
 * the pre-refresh 속성1_레코드명 attribute row scheme this timeline reads, so
 * the byte-identity checks below now render fixed, pre-refresh entities
 * (git show bbbab1f, the element download ZIPs c-0XX.zip, the commit
 * immediately before the delivery refresh) instead of the live download -
 * real historical data, not invented - so this file keeps testing the
 * DocumentTimelineV140 renderer's own byte-for-byte behaviour, which is
 * still reachable by any other still-old-template provider. What the live
 * 2026-09-30 delivery actually renders for these elements is covered by the
 * "wide delivery" describe block below.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROOT = resolve(__dirname, "../../../..");
const DATA = resolve(ROOT, `${countryPublicDirV158("VNM")}`);
const contracts = JSON.parse(readFileSync(resolve(DATA, "semantic/element-visualization-contracts-v125.json"), "utf8")).contracts as ElementVisualizationContractV125[];

// V162: countryDataLoaderV158 registers a pack's field definitions on every
// load (registerFieldDefinitionsV162), which is how the live renderer knows
// C-009/C-010/C-016 are the wide template. This test renders the contract
// component directly (not through the loader), so it registers the same
// three elements' field definitions itself, read from the real pack.
(Object.entries(wideFieldDefinitionsFixture) as [string, VietnamElementMetaBundleV124["fieldDefinitions"]][]).forEach(
  ([elementId, fieldDefinitions]) => registerFieldDefinitionsV162("VNM", elementId, fieldDefinitions)
);

/**
 * The download JSON's entities carry no per-entity countryIso3 (only the
 * document's top-level one) - a static-export detail the live pack payload
 * does not share (its entities carry countryIso3 per record, which is what
 * wideRecordsOfEntitiesV162 keys its field-definition lookup on). Stamping
 * it here makes this harness's entities match the live pack's shape.
 */
const entitiesOf = (elementId: string): VietnamEntityV124[] =>
  readDownloadJsonV158(elementId).entities.map((entity: VietnamEntityV124) => ({ ...entity, countryIso3: "VNM" }));

/** sha256 of the timeline and of each entry, captured before the V153 line was added. */
const BASELINE: Record<string, { timeline: string; entries: string[] }> = JSON.parse(
  readFileSync(resolve(__dirname, "documentTimelineBaselineV153.json"), "utf8")
);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

/**
 * V162 (P12-B) shows a document's 지역 as "한글명 (현지명)" through the region
 * dictionary. The baseline measures the renderer, so it is taken with a
 * country that has no dictionary (the value stays as delivered, as before);
 * the region display itself is checked by its own test below.
 */
const NO_REGION_DICTIONARY_V162 = "ZZZ";

function renderPrimary(elementId: string, entities: VietnamEntityV124[], regionCountry = NO_REGION_DICTIONARY_V162): HTMLElement {
  const contract = contracts.find((candidate) => candidate.elementId === elementId)!;
  act(() => root.render(
    <RegionCountryContextV162.Provider value={regionCountry}>
      <SemanticContractRendererV125 contract={contract} rows={[]} contextRows={[]} entities={entities} countryNameKo="베트남" showRawTable={false} />
    </RegionCountryContextV162.Provider>
  ));
  return container.querySelector<HTMLElement>('[data-testid="public-primary-visualization"]')!;
}

/** The document timeline (old-template entities only - null on the live wide delivery). */
function renderTimeline(elementId: string, entities: VietnamEntityV124[], regionCountry = NO_REGION_DICTIONARY_V162): HTMLElement {
  return renderPrimary(elementId, entities, regionCountry).querySelector<HTMLElement>('[data-testid="document-timeline-v140"]')!;
}

/**
 * Glossary terms defined in V151-2, unwrapped before hashing. The document
 * numbers printed by this timeline (896/QD-TTg, 06/2022/ND-CP, 61/2024/QH15)
 * gained a term button then; the baseline measures the renderer, so the button
 * is peeled back to its text. Terms that already carried help when the baseline
 * was taken (MONRE, MAE, FIT ...) stay wrapped and are still compared.
 */
const TERMS_ADDED_AFTER_BASELINE_V151_2 = ["qd-ttg", "nd-cp", "qh15", "moej", "cru-ts", "hydrosheds-dir"];

/**
 * V160 lists the documents most recent first (decision 2026-09-29); the
 * baseline was taken in the renderer's earlier ascending order, so the entries
 * are compared in that order. The entries' own markup is still compared byte
 * for byte (the fold that shows the first ten sits outside the list).
 */
function inBaselineOrder(timeline: HTMLElement): HTMLElement {
  const clone = timeline.cloneNode(true) as HTMLElement;
  [...clone.children].reverse().forEach((entry) => clone.appendChild(entry));
  return clone;
}

/** The entry with the V153 card removed: what the pre-V153 renderer produced. */
function withoutDescription(entry: Element): string {
  const clone = entry.cloneNode(true) as Element;
  clone.querySelectorAll('[data-testid="policy-description-v153"]').forEach((node) => node.remove());
  clone
    .querySelectorAll(TERMS_ADDED_AFTER_BASELINE_V151_2.map((id) => `[data-public-term-v134="${id}"]`).join(","))
    .forEach((node) => node.replaceWith(document.createTextNode(node.textContent ?? "")));
  clone.normalize();
  return clone.outerHTML;
}

/** A rendered entry's own document name (the <strong> under its date). */
const entryDocumentName = (entry: Element): string => entry.querySelector("strong")?.textContent?.trim() || "";

describe("document timeline region names (V162 P12-B)", () => {
  test("a document's 지역 reads 한글명 (현지명) for Viet Nam", () => {
    const timeline = renderTimeline("C-009", legacyC009 as unknown as VietnamEntityV124[], "VNM");
    const regions = [...timeline.querySelectorAll("dt")]
      .filter((dt) => dt.textContent === "지역")
      .map((dt) => dt.nextElementSibling?.textContent || "");
    expect(regions).toContain("다낭 (Da Nang city)");
    expect(regions).toContain("잘라이 (Gia Lai)");
    expect(regions.every((value) => !/^(Da Nang city|Gia Lai|Quang Ninh|Nghe An|Ha Noi)$/u.test(value))).toBe(true);
  });

  /**
   * V162 (P12-B) on the live wide delivery: C-009's own [지역] block carries
   * the same reading, through WideRecordCardsV162 rather than this timeline
   * (P12-B's 지역 dictionary lookup is elementId-scoped, not renderer-scoped).
   */
  test("a wide C-009 record's 지역 reads 한글명 (현지명) for Viet Nam", () => {
    const view = renderPrimary("C-009", entitiesOf("C-009"), "VNM");
    const cards = [...view.querySelectorAll('[data-testid="wide-record-card-v162"]')];
    const regionValues = cards.flatMap((card) =>
      [...card.querySelectorAll("dt")]
        .filter((dt) => /지역명/u.test(dt.textContent || ""))
        .map((dt) => dt.nextElementSibling?.textContent || "")
    );
    expect(regionValues).toContain("다낭 (Đà Nẵng)");
    expect(regionValues).toContain("잘라이 (Gia Lai)");
  });
});

describe("document timeline around the V153 description line (pre-refresh delivery fixture)", () => {
  test("C-016 has no description keys and its markup is byte-identical to the pre-V153 renderer", () => {
    const timeline = renderTimeline("C-016", legacyC016 as unknown as VietnamEntityV124[]);
    expect(timeline.querySelectorAll('[data-testid="policy-description-v153"]')).toHaveLength(0);
    expect(sha256(inBaselineOrder(timeline).outerHTML)).toBe(BASELINE["C-016"].timeline);
  });

  test.each([
    ["C-009", legacyC009],
    ["C-010", legacyC010],
  ] as const)("%s entries are byte-identical to the pre-V153 renderer apart from the appended card", (elementId, fixture) => {
    const timeline = renderTimeline(elementId, fixture as unknown as VietnamEntityV124[]);
    const entries = [...inBaselineOrder(timeline).children];
    expect(entries).toHaveLength(BASELINE[elementId].entries.length);
    entries.forEach((entry, index) => {
      expect(sha256(withoutDescription(entry))).toBe(BASELINE[elementId].entries[index]);
      // At most one card per entry, and always the last child of the entry's body.
      const cards = entry.querySelectorAll('[data-testid="policy-description-v153"]');
      expect(cards.length).toBeLessThanOrEqual(1);
      if (cards.length === 1) expect(cards[0].parentElement!.lastElementChild).toBe(cards[0]);
    });
    // A card appears exactly where policyDocumentDescriptionV153 resolves the
    // entry's own document name, and nowhere else (e.g. an attribute row such
    // as "현행 여부"). This is computed against the live policyDescriptionsV153
    // contract rather than a fixed count, so it does not go stale when that
    // contract is rebuilt from a newer delivery (policyDescriptionsV153.test.ts
    // is what pins its content).
    entries.forEach((entry) => {
      const hasCard = Boolean(entry.querySelector('[data-testid="policy-description-v153"]'));
      const shouldHaveCard = Boolean(policyDocumentDescriptionV153(elementId, entryDocumentName(entry)));
      expect(`${entryDocumentName(entry)}:${hasCard}`).toBe(`${entryDocumentName(entry)}:${shouldHaveCard}`);
    });
    expect(entries.some((entry) => entry.querySelector('[data-testid="policy-description-v153"]'))).toBe(true);
    expect(entries.find((entry) => entryDocumentName(entry) === "현행 여부")?.querySelector('[data-testid="policy-description-v153"]') ?? null).toBeNull();
  });
});

describe("document timeline on the wide 2026-09-30 delivery", () => {
  test.each(["C-009", "C-010", "C-016"])(
    "%s's live entities read as WideRecordCardsV162, not the document timeline",
    (elementId) => {
      const view = renderPrimary(elementId, entitiesOf(elementId));
      expect(view.querySelector('[data-testid="document-timeline-v140"]')).toBeNull();
      const wide = view.querySelector('[data-testid="wide-record-cards-v162"]');
      expect(wide).not.toBeNull();
      // No record id, raw file name or "raw 보유 여부" bookkeeping column ever
      // reaches the card (wideRecordsV162's own policy).
      expect(wide!.textContent).not.toMatch(/v124-c-0\d\d-entity-\d+/u);
      expect(wide!.textContent).not.toMatch(/\.(?:pdf|csv|xlsx?|docx?)\b/iu);
    }
  );
});
