import { describe, expect, it } from "@jest/globals";

import { dedupeIdenticalRowsV164, evidenceColumnsV164, type EvidenceRowCellsV164 } from "./evidenceRowsV164";

/** V164-3: the evidence table keeps every distinct row and only the columns that say something. */
function row(key: string, cells: Partial<EvidenceRowCellsV164> = {}): EvidenceRowCellsV164 & { key: string } {
  return { key, group: "NDC–SDG 연계", area: "NDC–SDG 연계 · SDG 1.2 · 행동", result: "SDG1 · 세부목표 1.2 · 부문: Agriculture", unit: null, basis: "—", ...cells };
}

describe("dedupeIdenticalRowsV164", () => {
  it("shows a row once when every cell equals a row already shown, and keeps the first one", () => {
    const first = row("a");
    const { items, hiddenCount } = dedupeIdenticalRowsV164([first, row("b"), row("c")]);
    expect(items).toEqual([first]);
    expect(hiddenCount).toBe(2);
  });

  it("keeps rows that differ in any one cell: the sector, the value, the unit, the basis or the group", () => {
    const rows = [
      row("base"),
      row("sector", { result: "SDG1 · 세부목표 1.2 · 부문: Rural Development" }),
      row("area", { area: "NDC–SDG 연계 · SDG 1.5 · 행동" }),
      row("unit", { unit: "건" }),
      row("basis", { basis: "2016" }),
      row("group", { group: "기타 자료" }),
    ];
    const { items, hiddenCount } = dedupeIdenticalRowsV164(rows);
    expect(items.map((item) => item.key)).toEqual(["base", "sector", "area", "unit", "basis", "group"]);
    expect(hiddenCount).toBe(0);
  });

  it("compares the text, not its spacing, and never rewrites a cell", () => {
    const spaced = row("spaced", { result: "SDG1  ·  세부목표 1.2 ·\n부문: Agriculture" });
    const { items } = dedupeIdenticalRowsV164([row("a"), spaced]);
    expect(items).toHaveLength(1);
    expect(items[0].result).toBe("SDG1 · 세부목표 1.2 · 부문: Agriculture");
  });

  it("keeps the delivered order and every date or figure of the shown rows", () => {
    const rows = [row("1", { result: "2030년까지 2%/년 감축" }), row("2", { result: "2025년 시행" }), row("3", { result: "2030년까지 2%/년 감축" })];
    const { items } = dedupeIdenticalRowsV164(rows);
    expect(items.map((item) => item.result)).toEqual(["2030년까지 2%/년 감축", "2025년 시행"]);
  });

  it("compares the cells as the reader sees them: a row serial the page does not print is not a difference", () => {
    const withSerial = (serial: number) => row(`s${serial}`, { result: `[연계 일련번호: ${serial}] SDG1 · 세부목표 1.2 · 부문: Agriculture` });
    const rows = [withSerial(155), withSerial(346), row("other", { result: "[연계 일련번호: 156] SDG1 · 세부목표 1.2 · 부문: Waste" })];
    const stripSerial = (cell: string) => cell.replace(/^\[[^\]]*일련번호[^\]]*\]\s*/u, "");
    expect(dedupeIdenticalRowsV164(rows).items).toHaveLength(3);
    const { items, hiddenCount } = dedupeIdenticalRowsV164(rows, stripSerial);
    expect(items.map((item) => item.key)).toEqual(["s155", "other"]);
    expect(hiddenCount).toBe(1);
  });

  it("returns an empty list for an empty table", () => {
    expect(dedupeIdenticalRowsV164([])).toEqual({ items: [], hiddenCount: 0 });
  });
});

describe("evidenceColumnsV164", () => {
  it("drops the basis column when no row fills it (A-013, E-015)", () => {
    expect(evidenceColumnsV164([row("a"), row("b", { area: "x" })]).hasBasis).toBe(false);
    expect(evidenceColumnsV164([row("a"), row("b", { area: "x", basis: "2016" })]).hasBasis).toBe(true);
  });

  it("drops the unit column the same way", () => {
    expect(evidenceColumnsV164([row("a")]).hasUnits).toBe(false);
    expect(evidenceColumnsV164([row("a"), row("b", { unit: "MtCO₂e" })]).hasUnits).toBe(true);
  });

  it("names the group column only when there are groups to tell apart", () => {
    expect(evidenceColumnsV164([row("a"), row("b", { area: "x" })]).hasGroups).toBe(false);
    expect(evidenceColumnsV164([row("a"), row("b", { group: "기타 자료" })]).hasGroups).toBe(true);
    expect(evidenceColumnsV164([row("a", { group: null })]).hasGroups).toBe(false);
  });
});
