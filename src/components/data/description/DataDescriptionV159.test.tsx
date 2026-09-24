import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { DatasetSpecRowV159, UseCaseV159 } from "../../../data/spec/specTypesV159";
import DataDescriptionV159 from "./DataDescriptionV159";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SPEC: DatasetSpecRowV159 = {
  elementId: "A-001",
  platformName: "Test Org 테스트 지표",
  platformNameEn: "",
  sourceLabel: "Test Org",
  baseName: "테스트 지표",
  shortDefinition: "테스트 기관이 만드는 테스트 지표",
  shortDefinitionCard: "테스트 지표",
  description: "상세 설명 본문입니다.",
  usage: "활용 방법 본문입니다.",
  definitionKo: "A.1.a",
  sourceOrg: "Test Org",
  refLink: "https://example.com/data",
  refApa: "Test Org. (2026). Test dataset.",
  checkedAt: "2026-09-01",
  decision: null,
  decisionNote: null,
};

const CASES: UseCaseV159[] = [
  {
    elementId: "A-001",
    caseNo: 1,
    purpose: "테스트 목적 하나",
    purposeEn: "Test Purpose One",
    logic: "테스트 논리 구조",
    dataUsed: [
      { indicatorId: "A-001_score", label: "테스트 점수", mapped: "exact" },
      { indicatorId: "A-001_missing", label: "미탑재 지표", mapped: "unmapped" },
      { indicatorId: null, label: "라벨만 있는 항목", mapped: "label-only" },
    ],
    storyline: '"테스트 스토리라인"',
    users: ["기업", "공공기관"],
    caution: "원문 유의점 문구",
    cautionDisplay: "대체된 유의점 문구",
    verified: "verified",
    verificationResult: "통과",
  },
  {
    elementId: "A-001",
    caseNo: 2,
    purpose: "테스트 목적 둘",
    purposeEn: "Test Purpose Two",
    logic: "두 번째 논리 구조",
    dataUsed: [{ indicatorId: "A-001_score", label: "테스트 점수", mapped: "exact" }],
    storyline: '"두 번째 스토리라인"',
    users: ["금융기관"],
    caution: "동일 문구",
    cautionDisplay: "동일 문구",
    verified: "pending",
    verificationResult: "검토 중",
  },
];

const AVAILABLE = new Set(["A-001_score"]);

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

test("spec === null renders nothing", () => {
  act(() =>
    root.render(
      <DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={CASES} spec={null} />
    )
  );
  expect(container.innerHTML).toBe("");
});

test("활용 사례 disclosure starts collapsed and its aria-expanded toggles on click", () => {
  act(() =>
    root.render(
      <DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={CASES} spec={SPEC} />
    )
  );
  const toggle = container.querySelector(".dd159-cases-toggle") as HTMLButtonElement;
  const region = container.querySelector(".dd159-cases-region") as HTMLElement;
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(region.hidden).toBe(true);
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(region.hidden).toBe(false);
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(region.hidden).toBe(true);
});

test("활용 사례 disclosure is absent entirely when there are no cases", () => {
  act(() =>
    root.render(<DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={[]} spec={SPEC} />)
  );
  expect(container.querySelector('[data-dd159-part="cases"]')).toBeNull();
  expect(container.querySelector('[data-testid="data-description-v159"]')!.getAttribute("data-dd159-cases")).toBe(
    "0"
  );
});

test("a data-used chip is inert (aria-disabled, no click) when the first chart has no series for it", () => {
  const highlighted: string[][] = [];
  act(() =>
    root.render(
      <DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={CASES} spec={SPEC} onHighlightIndicators={(ids) => highlighted.push(ids)} />
    )
  );
  const enabled = container.querySelector('button[data-indicator-id="A-001_score"]') as HTMLButtonElement;
  const inert = container.querySelector('button[data-indicator-id="A-001_missing"]') as HTMLButtonElement;
  expect(enabled.getAttribute("aria-disabled")).toBeNull();
  expect(inert.getAttribute("aria-disabled")).toBe("true");
  expect(inert.title).toBe("이 화면에는 계열 강조가 없습니다");
  act(() => inert.click());
  expect(highlighted).toEqual([]);
  // A label-only reference (no indicatorId) is a plain chip, never a button.
  const labelOnly = container.querySelector(".dd159-chip--label")!;
  expect(labelOnly.tagName).toBe("SPAN");
});

test("clicking an enabled chip reports its indicator ids and sets aria-pressed, a second click clears it", () => {
  const highlighted: string[][] = [];
  act(() =>
    root.render(
      <DataDescriptionV159
        availableIndicatorIds={AVAILABLE}
        cases={CASES}
        onHighlightIndicators={(ids) => highlighted.push(ids)}
        spec={SPEC}
      />
    )
  );
  const chip = container.querySelector('button[data-indicator-id="A-001_score"]') as HTMLButtonElement;
  expect(chip.getAttribute("aria-pressed")).toBe("false");
  act(() => chip.click());
  expect(chip.getAttribute("aria-pressed")).toBe("true");
  expect(highlighted[highlighted.length - 1]).toEqual(["A-001_score"]);
  act(() => chip.click());
  expect(chip.getAttribute("aria-pressed")).toBe("false");
  expect(highlighted[highlighted.length - 1]).toEqual([]);
});

test("the pending badge only shows on a case whose verified status is 'pending'", () => {
  act(() =>
    root.render(
      <DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={CASES} spec={SPEC} />
    )
  );
  const cards = container.querySelectorAll('[data-testid="use-case-card-v159"]');
  expect(cards).toHaveLength(2);
  expect(cards[0].getAttribute("data-verified")).toBe("verified");
  expect(cards[0].textContent).not.toContain("검증 대기");
  expect(cards[1].getAttribute("data-verified")).toBe("pending");
  expect(cards[1].textContent).toContain("검증 대기");
});

test("the caution tooltip only appears when the displayed text differs from the source text", () => {
  act(() =>
    root.render(
      <DataDescriptionV159 availableIndicatorIds={AVAILABLE} cases={CASES} spec={SPEC} />
    )
  );
  const cards = container.querySelectorAll('[data-testid="use-case-card-v159"]');
  const diffCaution = cards[0].querySelector("[data-caution-original]");
  expect(diffCaution).not.toBeNull();
  expect(diffCaution!.getAttribute("title")).toBe("원문 유의점 문구");
  expect(diffCaution!.textContent).toContain("대체된 유의점 문구");
  const sameCaution = cards[1].querySelector(".dd159-caution")!;
  expect(sameCaution.querySelector("[data-caution-original]")).toBeNull();
});
