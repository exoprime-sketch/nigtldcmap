import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { ElementVisualizationContractV125 } from "../../../data/visualization/semanticTypesV125";
import SemanticContractRendererV125 from "./SemanticContractRendererV125";

/**
 * V153-D3 adds a platform-edited description under the timeline entries of
 * C-009 and C-010. The document timeline is shared with C-016, whose entries
 * carry no description key, so its markup must not move by a byte. The hash
 * below was taken from the renderer before the V153 line was added.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROOT = resolve(__dirname, "../../../..");
const DATA = resolve(ROOT, "public/data/vietnam/v2");
const contracts = JSON.parse(readFileSync(resolve(DATA, "semantic/element-visualization-contracts-v125.json"), "utf8")).contracts as ElementVisualizationContractV125[];
const entitiesOf = (elementId: string): VietnamEntityV124[] =>
  JSON.parse(readFileSync(resolve(DATA, `downloads/${elementId.toLowerCase()}.json`), "utf8")).entities;

/** sha256 of the timeline and of each entry, captured before the V153 line was added. */
const BASELINE: Record<string, { timeline: string; entries: string[] }> = JSON.parse(
  readFileSync(resolve(__dirname, "documentTimelineBaselineV153.json"), "utf8")
);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function renderTimeline(elementId: string): HTMLElement {
  const contract = contracts.find((candidate) => candidate.elementId === elementId)!;
  act(() => root.render(
    <SemanticContractRendererV125 contract={contract} rows={[]} contextRows={[]} entities={entitiesOf(elementId)} countryNameKo="베트남" showRawTable={false} />
  ));
  return container.querySelector<HTMLElement>('[data-testid="document-timeline-v140"]')!;
}

/** The entry with the V153 card removed: what the pre-V153 renderer produced. */
function withoutDescription(entry: Element): string {
  const clone = entry.cloneNode(true) as Element;
  clone.querySelectorAll('[data-testid="policy-description-v153"]').forEach((node) => node.remove());
  return clone.outerHTML;
}

describe("document timeline around the V153 description line", () => {
  test("C-016 has no description keys and its markup is byte-identical to the pre-V153 renderer", () => {
    const timeline = renderTimeline("C-016");
    expect(timeline.querySelectorAll('[data-testid="policy-description-v153"]')).toHaveLength(0);
    expect(sha256(timeline.outerHTML)).toBe(BASELINE["C-016"].timeline);
  });

  test.each(["C-009", "C-010"])("%s entries are byte-identical to the pre-V153 renderer apart from the appended card", (elementId) => {
    const timeline = renderTimeline(elementId);
    const entries = [...timeline.children];
    expect(entries).toHaveLength(BASELINE[elementId].entries.length);
    entries.forEach((entry, index) => {
      expect(sha256(withoutDescription(entry))).toBe(BASELINE[elementId].entries[index]);
      // At most one card per entry, and always the last child of the entry's body.
      const cards = entry.querySelectorAll('[data-testid="policy-description-v153"]');
      expect(cards.length).toBeLessThanOrEqual(1);
      if (cards.length === 1) expect(cards[0].parentElement!.lastElementChild).toBe(cards[0]);
    });
    // The delivery's documents get a card (C-009 names the 2050 strategy twice,
    // by number and by title); attribute rows such as "현행 여부" do not.
    const described = entries.filter((entry) => entry.querySelector('[data-testid="policy-description-v153"]'));
    expect(described.length).toBe(elementId === "C-009" ? 20 : 19);
    expect(entries.find((entry) => entry.querySelector("strong")?.textContent === "현행 여부")?.querySelector('[data-testid="policy-description-v153"]') ?? null).toBeNull();
  });
});
