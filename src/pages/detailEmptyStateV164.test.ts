import { describe, expect, it } from "@jest/globals";
import { showsEmptyStateBlockV164 } from "./detailEmptyStateV164";

const empty = { observationCount: 0, entityCount: 0, preparing: false, hasStatusNotice: false };

describe("showsEmptyStateBlockV164", () => {
  it("shows the box for an empty page that states nothing else", () => {
    expect(showsEmptyStateBlockV164(empty)).toBe(true);
  });

  it("does not add a second statement under the data-pending notice (BGD C-023, D-001, D-002, D-004, E-013)", () => {
    expect(showsEmptyStateBlockV164({ ...empty, hasStatusNotice: true })).toBe(false);
  });

  it("does not add the box for a dataset the catalogue says is not delivered yet", () => {
    expect(showsEmptyStateBlockV164({ ...empty, preparing: true })).toBe(false);
  });

  it("never shows the box for a page that has rows or records", () => {
    expect(showsEmptyStateBlockV164({ ...empty, observationCount: 3 })).toBe(false);
    expect(showsEmptyStateBlockV164({ ...empty, entityCount: 1 })).toBe(false);
  });
});
