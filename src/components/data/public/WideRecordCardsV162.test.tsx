import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { WideRecordV162 } from "../../../data/visualization/wideRecordsV162";
import { readWideRecordsV162 } from "../../../data/visualization/wideRecordsV162";
import WideRecordCardsV162 from "./WideRecordCardsV162";
import c017Fixture from "../../../data/visualization/__fixtures__/wideRecordC017V162.json";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DUMMY_ENTITY = {} as unknown as VietnamEntityV124;

/** A minimal WideRecordV162, the component's own contract rather than the reader's. */
function wideRecord(overrides: Partial<WideRecordV162> & { name: string }): WideRecordV162 {
  return {
    entity: DUMMY_ENTITY,
    type: null,
    blocks: [],
    source: { document: null, url: null, pageUrl: null, citation: null },
    get: () => null,
    ...overrides,
  };
}

function priceBlock(value: string) {
  return [{ block: "가격", title: "가격", values: [{ attribute: "단가 (VND/kWh)", value }] }];
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

test("renders one card per record, with its blocks and source line", () => {
  const records = [
    wideRecord({
      name: "태양광 FIT(2017)",
      type: "지원 요율",
      blocks: [
        { block: "인센티브", title: "인센티브", values: [{ attribute: "유형", value: "FIT" }] },
        ...priceBlock("2086"),
      ],
      source: { document: "결정문", url: "https://example.org/a.pdf", pageUrl: null, citation: "제3조" },
    }),
    wideRecord({ name: "풍력 FIT(2018)", type: "지원 요율", blocks: priceBlock("1928") }),
  ];
  act(() => root.render(<WideRecordCardsV162 records={records} />));

  const section = container.querySelector('[data-testid="wide-record-cards-v162"]')!;
  expect(section).not.toBeNull();
  expect(section.querySelector(".wide162-count")!.textContent).toBe("2건");
  const cards = section.querySelectorAll('[data-testid="wide-record-card-v162"]');
  expect(cards).toHaveLength(2);
  expect(cards[0].querySelector(".wide162-card-title")!.textContent).toBe("태양광 FIT(2017)");
  expect(cards[0].querySelector(".wide162-row dd")!.textContent).toBe("FIT");
  const sourceLine = cards[0].querySelector(".wide162-source")!;
  expect(sourceLine.textContent).toContain("결정문");
  expect(sourceLine.textContent).toContain("제3조");
  const link = sourceLine.querySelector("a")!;
  expect(link.getAttribute("href")).toBe("https://example.org/a.pdf");
  expect(link.textContent).toBe("원문");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  // No source stated for the second record: no source line at all.
  expect(cards[1].querySelector(".wide162-source")).toBeNull();
});

test("2+ distinct types show filter chips; picking one narrows the cards", () => {
  const records = [
    wideRecord({ name: "A", type: "국가 목표" }),
    wideRecord({ name: "B", type: "지역 배분" }),
    wideRecord({ name: "C", type: "지역 배분" }),
  ];
  act(() => root.render(<WideRecordCardsV162 records={records} />));

  const chips = [...container.querySelectorAll(".wide162-chip")] as HTMLButtonElement[];
  expect(chips.map((chip) => chip.textContent)).toEqual(["전체 (3)", "국가 목표 (1)", "지역 배분 (2)"]);
  expect(chips[0].getAttribute("aria-pressed")).toBe("true");

  act(() => chips[2].click());
  expect(chips[2].getAttribute("aria-pressed")).toBe("true");
  expect(chips[0].getAttribute("aria-pressed")).toBe("false");
  const titles = [...container.querySelectorAll(".wide162-card-title")].map((el) => el.textContent);
  expect(titles).toEqual(["B", "C"]);

  act(() => chips[0].click());
  expect([...container.querySelectorAll(".wide162-card-title")].map((el) => el.textContent)).toEqual(["A", "B", "C"]);
});

test("a single distinct type shows no filter chips", () => {
  const records = [wideRecord({ name: "A", type: "국가 목표" }), wideRecord({ name: "B", type: "국가 목표" })];
  act(() => root.render(<WideRecordCardsV162 records={records} />));
  expect(container.querySelector(".wide162-chips")).toBeNull();
});

test("the search box matches a record's name or a block value, and 더 보기 reveals the rest", () => {
  // "항목" rather than "레코드": publicTextV126 rewrites 레코드 to 자료 for a
  // public screen (the store's own row name, not the reader's word for it),
  // which would make the name assertion below fight that substitution.
  const records = Array.from({ length: 25 }, (_, index) =>
    wideRecord({ name: `항목 ${index + 1}`, blocks: priceBlock(index === 24 ? "찾는값" : String(index)) })
  );
  act(() => root.render(<WideRecordCardsV162 records={records} />));

  expect(container.querySelectorAll('[data-testid="wide-record-card-v162"]')).toHaveLength(20);
  const moreButton = container.querySelector(".wide162-more") as HTMLButtonElement;
  expect(moreButton).not.toBeNull();
  expect(moreButton.textContent).toBe("더 보기 (남은 5건)");

  act(() => moreButton.click());
  expect(container.querySelectorAll('[data-testid="wide-record-card-v162"]')).toHaveLength(25);
  expect(container.querySelector(".wide162-more")).toBeNull();

  const input = container.querySelector('input[aria-label="기록 검색"]') as HTMLInputElement;
  typeInto(input, "찾는값");
  const cards = container.querySelectorAll('[data-testid="wide-record-card-v162"]');
  expect(cards).toHaveLength(1);
  expect(cards[0].querySelector(".wide162-card-title")!.textContent).toBe("항목 25");

  typeInto(input, "항목 없음");
  expect(container.querySelectorAll('[data-testid="wide-record-card-v162"]')).toHaveLength(0);
  expect(container.querySelector(".wide162-empty")!.textContent).toBe("검색 결과가 없습니다.");
});

test("a real C-017 record renders with no record id anywhere in the DOM text", () => {
  const fixtureEntity = {
    elementId: "C-017",
    entityType: "entity",
    recordId: String((c017Fixture.normalizedAttributes as Record<string, unknown>)["식별_레코드ID"]),
    normalizedAttributes: c017Fixture.normalizedAttributes,
    rawAttributes: {},
    loadStatus: "published",
    warnings: [],
    rightsStatus: "public-release-approved",
    rightsNote: "",
    downloadEligible: true,
    mapEligible: false,
  } as unknown as VietnamEntityV124;
  const recordId = String((c017Fixture.normalizedAttributes as Record<string, unknown>)["식별_레코드ID"]);
  const records = readWideRecordsV162(
    [fixtureEntity],
    c017Fixture.fieldDefinitions as VietnamElementMetaBundleV124["fieldDefinitions"]
  );
  act(() => root.render(<WideRecordCardsV162 records={records} />));
  expect(container.querySelectorAll('[data-testid="wide-record-card-v162"]')).toHaveLength(1);
  expect(container.textContent).not.toContain(recordId);
});
