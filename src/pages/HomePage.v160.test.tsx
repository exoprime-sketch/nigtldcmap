import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import HomePage from "./HomePage";
import { HOME_QUESTIONS_V160 } from "../data/spec/coreFirstV160";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The map preview (DetailLocationMapV148) pulls in the real map renderer via
// React.lazy; this test only exercises the six question cards, so it stands
// in a plain stub rather than loading maplibre in jsdom.
jest.mock("../components/data/public/DetailLocationMapV148", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-detail-location-map-v148" />,
}));

type MockResponse = {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
  json: () => Promise<unknown>;
  body: { cancel: () => Promise<void> };
};

function jsonResponse(body: unknown): MockResponse {
  return {
    ok: true,
    status: 200,
    headers: { get: (name) => (name.toLowerCase() === "content-type" ? "application/json" : null) },
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
    body: { cancel: () => Promise.resolve() },
  };
}

function notFoundResponse(): MockResponse {
  return {
    ok: false,
    status: 404,
    headers: { get: () => null },
    text: () => Promise.resolve(""),
    json: () => Promise.resolve(null),
    body: { cancel: () => Promise.resolve() },
  };
}

// A minimal, real-shaped card-summaries fixture (schema v140-card-summaries-1).
// A-003 (U1's heroIndicator) has a real headline; C-001 (U6's heroIndicator)
// is deliberately left out to exercise "no KPI when the card summary lacks
// one" - the contract forbids a placeholder number.
const CARD_SUMMARIES_FIXTURE = {
  schemaVersion: "v140-card-summaries-1",
  dataSnapshot: "test",
  generatedAt: "2026-09-24T00:00:00.000Z",
  sourceHash: "test",
  cards: [
    {
      elementId: "A-003",
      title: "국내총생산(GDP)",
      kind: "line",
      headline: { value: "514.7 10억 미국달러", label: "2025년 명목 국내총생산" },
      preview: {},
      period: "2015-2025",
      provider: "World Bank",
      selection: null,
      basis: { unit: "10억 미국달러", rule: "latest" },
      measure: null,
      mapConnected: false,
      downloadable: true,
    },
  ],
};

let originalFetch: typeof global.fetch;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("card-summaries-v140.json")) return Promise.resolve(jsonResponse(CARD_SUMMARIES_FIXTURE) as unknown as Response);
    return Promise.resolve(notFoundResponse() as unknown as Response);
  }) as unknown as typeof fetch;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

// Two macrotask turns drain the fetch -> text -> JSON.parse -> setState
// microtask chain reliably, whatever its exact depth.
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const NOOP_PROPS = {
  query: "",
  onQueryChange: () => undefined,
  onSubmit: (event: { preventDefault: () => void }) => event.preventDefault(),
  onSearchExample: () => undefined,
  onOpenElement: () => undefined,
  onOpenMapElement: () => undefined,
};

test("shows exactly the six V160 question cards, in U1..U6 order, marked and labelled from HOME_QUESTIONS_V160", async () => {
  act(() => root.render(<HomePage {...NOOP_PROPS} onNavigate={() => undefined} onOpenQuestion={() => undefined} />));
  await flush();

  const section = container.querySelector('[data-testid="home-questions-v160"]');
  expect(section).not.toBeNull();
  const cards = Array.from(container.querySelectorAll('[data-testid="home-question-v160"]'));
  expect(cards).toHaveLength(6);
  expect(cards.map((card) => card.getAttribute("data-display-type"))).toEqual(["U1", "U2", "U3", "U4", "U5", "U6"]);

  cards.forEach((card, index) => {
    const question = HOME_QUESTIONS_V160[index];
    expect(card.querySelector("h3")!.textContent).toBe(question.title);
    expect(card.querySelector(".home-questions-v160__description")!.textContent).toBe(question.description);
    const button = card.querySelector('[data-testid="home-question-open-v160"]')!;
    expect(button.textContent).toBe(`핵심 데이터 ${question.coreElementIds.length}개 보기`);
  });
});

test("shows a KPI only when the question's heroIndicator has a card-summary headline, never a placeholder", async () => {
  act(() => root.render(<HomePage {...NOOP_PROPS} onNavigate={() => undefined} onOpenQuestion={() => undefined} />));
  await flush();

  const u1Card = container.querySelector('[data-display-type="U1"]')!;
  const u1Kpi = u1Card.querySelector('[data-testid="home-question-kpi-v160"]');
  expect(u1Kpi).not.toBeNull();
  expect(u1Kpi!.querySelector("strong")!.textContent).toBe("514.7 10억 미국달러");
  expect(u1Kpi!.querySelector("span")!.textContent).toBe("2025년 명목 국내총생산");

  // U4's heroIndicator is null in the plan data (no accepted KPI) - no KPI element at all.
  const u4Card = container.querySelector('[data-display-type="U4"]')!;
  expect(u4Card.querySelector('[data-testid="home-question-kpi-v160"]')).toBeNull();

  // U6's heroIndicator (C-001) is non-null but absent from the mocked card
  // summaries here - the missing headline must not be papered over.
  const u6Card = container.querySelector('[data-display-type="U6"]')!;
  expect(u6Card.querySelector('[data-testid="home-question-kpi-v160"]')).toBeNull();
});

test("opening a question card's button calls onOpenQuestion with that question's display type", async () => {
  const onOpenQuestion = jest.fn();
  act(() => root.render(<HomePage {...NOOP_PROPS} onNavigate={() => undefined} onOpenQuestion={onOpenQuestion} />));
  await flush();

  const u3Button = container.querySelector('[data-display-type="U3"] [data-testid="home-question-open-v160"]') as HTMLButtonElement;
  act(() => u3Button.click());
  expect(onOpenQuestion).toHaveBeenCalledWith("U3");
});

test("the featured-8 grid and its sort controls are gone; a single 'see all' control remains", async () => {
  const onNavigate = jest.fn();
  act(() => root.render(<HomePage {...NOOP_PROPS} onNavigate={onNavigate} onOpenQuestion={() => undefined} />));
  await flush();

  expect(container.querySelector(".home-featured-v139__grid")).toBeNull();
  expect(container.querySelector('[data-testid="home-card-open-v140"]')).toBeNull();

  const allButton = container.querySelector(".home-questions-v160__all") as HTMLButtonElement;
  expect(allButton).not.toBeNull();
  expect(allButton.textContent).toBe("전체 데이터 보기 →");
  act(() => allButton.click());
  expect(onNavigate).toHaveBeenCalledWith("explorer");
});

test("headings stay in order (h1 once, then h2s, then one h3 per question)", async () => {
  act(() => root.render(<HomePage {...NOOP_PROPS} onNavigate={() => undefined} onOpenQuestion={() => undefined} />));
  await flush();

  expect(container.querySelectorAll("h1")).toHaveLength(1);
  const questionH3s = container.querySelectorAll('[data-testid="home-question-v160"] h3');
  expect(questionH3s).toHaveLength(6);
  Array.from(questionH3s).forEach((heading) => expect(heading.tagName).toBe("H3"));
});
