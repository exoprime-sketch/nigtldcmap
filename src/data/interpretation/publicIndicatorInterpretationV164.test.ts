import { describe, expect, test } from "@jest/globals";
import {
  PUBLIC_INDICATOR_INTERPRETATIONS_V129,
  PUBLIC_INDICATOR_INTERPRETATION_OVERRIDES_V164,
  getPublicIndicatorInterpretationV129,
  getPublicIndicatorVariablePresentationV129,
} from "./publicIndicatorInterpretationV129";

const text = (elementId: string, variableKey?: string) => {
  const entry = getPublicIndicatorInterpretationV129(elementId, variableKey);
  return [entry?.publicName, entry?.directionLabel, ...(entry?.meaningBullets || [])].join(" ");
};

describe("'지표 읽는 법' follows the variable the map draws", () => {
  test("B-041 GHI/DNI/PVOUT/최적 경사각 each read as themselves, never as a seasonal index", () => {
    for (const key of ["ghi-mean", "dni-mean", "pvout-mean", "opta-mean"]) {
      const entry = getPublicIndicatorInterpretationV129("B-041", key);
      expect(entry?.variableKey).toBe(key);
      expect(entry?.explanationRequired).toBe(true);
      expect(entry?.meaningBullets.length).toBeGreaterThanOrEqual(2);
      expect(entry?.meaningBullets.length).toBeLessThanOrEqual(4);
      expect(text("B-041", key)).not.toMatch(/계절|변동/u);
    }
    expect(text("B-041", "ghi-mean")).toContain("수평면");
    expect(text("B-041", "dni-mean")).toContain("직달");
    expect(text("B-041", "pvout-mean")).toContain("1kWp");
    expect(text("B-041", "opta-mean")).toContain("각도");
    // An angle is not a "higher is better" value.
    expect(getPublicIndicatorInterpretationV129("B-041", "opta-mean")?.direction).toBe("neutral");
  });

  test("B-041 element default (a key this module does not know) is the generic solar text", () => {
    const entry = getPublicIndicatorInterpretationV129("B-041", "m-3f9a1c");
    expect(entry?.variableKey).toBeUndefined();
    expect(text("B-041", "m-3f9a1c")).not.toMatch(/계절|변동/u);
    expect(getPublicIndicatorInterpretationV129("B-041")?.publicName).toBe("태양 일사량·발전 잠재량");
  });

  test("the layer's own label and unit stay in charge: no publicUnit, so no presentation override", () => {
    expect(getPublicIndicatorVariablePresentationV129("B-041", "ghi-mean")).toBeNull();
    expect(getPublicIndicatorVariablePresentationV129("C-013", "special-incentive-provision-count")).toBeNull();
  });

  test("C-013 incentive-provision count is a count of provision rows, not an investor-protection index", () => {
    const body = text("C-013", "special-incentive-provision-count");
    expect(body).not.toMatch(/소액투자자|공시|주주|이사책임|보호가 강/u);
    expect(body).toContain("근거");
    expect(body).toContain("0건이 아닙니다");
    expect(body).toContain("금액이나 지원 건수가 아닙니다");
    expect(getPublicIndicatorInterpretationV129("C-013", "special-incentive-provision-count")?.direction).toBe("neutral");
    expect(text("C-013")).not.toMatch(/소액투자자|공시|주주|이사책임/u);
  });

  test("C-022 facility counts are not described as a readiness score", () => {
    for (const key of ["facilities-industry-trade", "facilities-transport", "facilities-construction", "facilities-agri-environment"]) {
      const entry = getPublicIndicatorInterpretationV129("C-022", key);
      expect(entry?.publicName).toBe("탄소시장 대상시설 수");
      expect(entry?.direction).toBe("neutral");
    }
    // The element-level readiness text stays for a key this module does not know.
    expect(getPublicIndicatorInterpretationV129("C-022", "unknown")?.publicName).toBe("탄소시장 준비도");
  });

  test("other elements and the B-021 variable presentation are untouched", () => {
    expect(getPublicIndicatorInterpretationV129("A-001")?.publicName).toBe("부패인식지수(CPI)");
    expect(getPublicIndicatorVariablePresentationV129("B-021", "gvi-6")?.unit).toBeTruthy();
    expect(getPublicIndicatorInterpretationV129("Z-999")).toBeNull();
  });

  test("overrides stay out of the mirrored registry array (the JSON parity script reads only that array)", () => {
    for (const entry of PUBLIC_INDICATOR_INTERPRETATION_OVERRIDES_V164) {
      expect(PUBLIC_INDICATOR_INTERPRETATIONS_V129).not.toContain(entry);
    }
  });
});
