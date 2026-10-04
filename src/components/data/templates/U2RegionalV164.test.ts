import { describe, expect, it } from "@jest/globals";
import { nationalOnlyNoticeV164 } from "./U2RegionalV159";

describe("nationalOnlyNoticeV164", () => {
  it("points to the map when the page draws region values", () => {
    expect(nationalOnlyNoticeV164("성·시", true)).toBe("이 차트는 전국 기준값입니다. 성·시별 값은 지도에서 볼 수 있습니다.");
  });
  it("states the national fallback without delivery wording", () => {
    const text = nationalOnlyNoticeV164("주(Division)", false);
    expect(text).toBe("주(Division)별 값이 없어 전국 기준값을 보여 줍니다.");
    expect(text).not.toMatch(/납품/);
  });
});
