import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { WideRecordV162 } from "../../../data/visualization/wideRecordsV162";
import WideRecordCardsV162, { rowLabelV164, unevenCardsV164, wideCardWeightV164 } from "./WideRecordCardsV162";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** V164 R2: the wide record cards - a shared note told once, a long value folded, an English sentence named, a list laid out by its tallest card. */
function record(name: string, rows: Array<[string, string, string]>): WideRecordV162 {
  const blocks = new Map<string, { block: string; title: string; values: Array<{ attribute: string; value: string }> }>();
  for (const [block, attribute, value] of rows) {
    const current = blocks.get(block) || { block, title: block, values: [] };
    current.values.push({ attribute, value });
    blocks.set(block, current);
  }
  return { entity: {} as unknown as VietnamEntityV124, name, type: null, blocks: [...blocks.values()], source: { document: null, url: null, pageUrl: null, citation: null }, get: () => null };
}

const NOTE = "근거: 재생에너지 소득세 면제는 전국 동일 적용. 일반 산업 tax holiday의 지역 구분은 만료. 낙후지역 목록을 확정하는 별도 제도 없음";
const LONG = `제30조 (1): PPP 계약에서 상호 합의한 절차에 따라 계약당사자 간 상호 합의, 미해결 시 중립 전문가 조정, 그래도 미해결 시 당사자 간 중재의 단계로 해결. ${"국내외 규칙을 PPP 계약에 정할 수 있고 중재지는 다카. ".repeat(6)}`.trim();

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

const render = (records: WideRecordV162[]) => act(() => root.render(<WideRecordCardsV162 records={records} />));
const cards = () => Array.from(container.querySelectorAll("[data-testid='wide-record-card-v162']"));

describe("a note most records state in the same words", () => {
  const records = ["가", "나", "다", "라", "마"].map((name) => record(`설비 ${name}`, [["지역", "지역 요건 판정", NOTE], ["지역", "권역", "전국"]]));

  test("is told once above the list and left off every card", () => {
    render(records);
    const shared = container.querySelector("[data-testid='wide-shared-notes-v164']")!;
    expect(shared).not.toBeNull();
    expect(shared.textContent).toContain("지역 요건 판정");
    expect(shared.textContent).toContain(NOTE);
    expect(shared.textContent).toContain("모든 기록(5건)에 공통");
    expect(cards()).toHaveLength(5);
    for (const card of cards()) {
      expect(card.textContent).not.toContain(NOTE);
      // the card keeps what is its own
      expect(card.textContent).toContain("권역");
    }
  });

  test("a list with no repeated value has no note", () => {
    render([record("가", [["지역", "권역", "전국"]]), record("나", [["지역", "권역", "전국"]])]);
    expect(container.querySelector("[data-testid='wide-shared-notes-v164']")).toBeNull();
  });

  test("a card left with no row of a block does not show the block's title", () => {
    render(["가", "나", "다", "라"].map((name) => record(`설비 ${name}`, [["근거", "근거", NOTE], ["지역", "권역", "전국"]])));
    for (const card of cards()) {
      expect(card.textContent).not.toContain("근거");
      expect(card.querySelectorAll(".wide162-block")).toHaveLength(1);
    }
  });
});

describe("a long value", () => {
  test("is folded, keeps its whole text in the page, and opens with the button", () => {
    render([record("PPP 법", [["제도", "분쟁해결", LONG]])]);
    const fold = container.querySelector(".wide162-fold")!;
    expect(fold.getAttribute("data-folded")).toBe("true");
    expect(fold.textContent).toBe(LONG);
    const button = container.querySelector<HTMLButtonElement>(".wide162-fold-toggle")!;
    expect(button.textContent).toBe("더 보기");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => button.click());
    expect(container.querySelector(".wide162-fold")!.getAttribute("data-folded")).toBe("false");
    expect(container.querySelector(".wide162-fold-toggle")!.textContent).toBe("접기");
    expect(container.querySelector(".wide162-fold-toggle")!.getAttribute("aria-expanded")).toBe("true");
  });

  test("a short value has no fold and no button", () => {
    render([record("가", [["제도", "분쟁해결", "제30조 (1): 상호 합의, 조정, 중재의 순서"]])]);
    expect(container.querySelector(".wide162-fold")).toBeNull();
    expect(container.querySelector(".wide162-fold-toggle")).toBeNull();
  });
});

describe("a sentence the source wrote in English", () => {
  const sentence = "Hire electrical contracting firm to purchase substation equipment, get it tested and carry out installation";

  test("says so on its label", () => {
    expect(rowLabelV164("절차 내용", sentence)).toBe("절차 내용 (영어 원문)");
    render([record("전기 절차 2", [["절차", "절차 내용", sentence]])]);
    expect(container.querySelector(".wide162-row dt")!.textContent).toBe("절차 내용 (영어 원문)");
  });

  test("a label that already says it is the source's wording, a name and a Korean value are left as they are", () => {
    expect(rowLabelV164("평가 대상 (원문)", sentence)).toBe("평가 대상 (원문)");
    expect(rowLabelV164("기술명 (영문)", sentence)).toBe("기술명 (영문)");
    expect(rowLabelV164("발급 기관", "Power Grid Bangladesh (PGB)")).toBe("발급 기관");
    expect(rowLabelV164("절차 내용", "전력 계통에 연결하기 위한 승인 절차를 거쳐 설치한다 그리고 검사를 받는다")).toBe("절차 내용");
  });
});

describe("the layout of the list", () => {
  const short = (name: string) => record(name, [["지역", "권역", "전국"], ["제도", "유형", "법률"]]);
  const tall = record("PPP 법", Array.from({ length: 8 }, (_, index) => ["제도", `항목 ${index}`, LONG] as [string, string, string]));

  test("weighs a card by its rows and the (folded) text of each", () => {
    expect(wideCardWeightV164(short("가"))).toBeLessThan(200);
    expect(wideCardWeightV164(tall)).toBeGreaterThan(2000);
  });

  test("is uneven when one card is far taller than the usual one, and not otherwise", () => {
    expect(unevenCardsV164([300, 320, 310, 2900])).toBe(true);
    expect(unevenCardsV164([300, 320, 310, 450])).toBe(false);
    expect(unevenCardsV164([300, 2900])).toBe(false);
    expect(unevenCardsV164([900, 1000, 1100, 1300])).toBe(false);
  });

  test("a list with a very tall card is laid out in columns, an even list in rows", () => {
    render([tall, short("가"), short("나"), short("다"), short("라")]);
    expect(container.querySelector(".wide162-grid")!.getAttribute("data-layout")).toBe("columns");
    render([short("가"), short("나"), short("다"), short("라")]);
    expect(container.querySelector(".wide162-grid")!.getAttribute("data-layout")).toBe("rows");
  });
});
