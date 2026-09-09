import { describe, expect, it } from "@jest/globals";

import { publicTextV126 } from "./publicFieldPolicyV126";

describe("publicTextV126 separator trimming", () => {
  // The trimming rule exists to remove separators left dangling by the
  // substitutions above it. It used to take the minus sign with them, so every
  // negative number rendered through the public text path lost its sign: a
  // province that is a net carbon sink (-822,213 Mg CO2e/yr) read as an equally
  // large source, and the map popup and the detail panel disagreed about the
  // same value.
  it("keeps the sign on a negative number", () => {
    expect(publicTextV126("-822,213")).toBe("-822,213");
    expect(publicTextV126("-0.5")).toBe("-0.5");
    expect(publicTextV126("− 4,361,423")).toBe("− 4,361,423");
  });

  it("still trims a leading or trailing separator", () => {
    expect(publicTextV126("· 앞머리 구분자")).toBe("앞머리 구분자");
    expect(publicTextV126("값 · ")).toBe("값");
    expect(publicTextV126("- 항목")).toBe("항목");
  });

  it("treats a bare dash as no value", () => {
    expect(publicTextV126("-")).toBeNull();
    expect(publicTextV126("--")).toBeNull();
  });
});
