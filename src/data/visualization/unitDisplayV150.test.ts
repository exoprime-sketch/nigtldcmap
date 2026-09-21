import { test, expect } from "@jest/globals";
import { displayUnitV150 } from "./unitDisplayV150";

test("exact equivalents are respelled, qualifiers kept, CO₂ never widened to CO₂e", () => {
  expect(displayUnitV150("Mt CO2eq")).toBe("MtCO₂e");
  expect(displayUnitV150("백만 tCO₂e")).toBe("MtCO₂e");
  expect(displayUnitV150("MtCO2e(순)")).toBe("MtCO₂e(순)");
  expect(displayUnitV150("MtCO₂e(2030)")).toBe("MtCO₂e(2030)");
  expect(displayUnitV150("백만톤CO₂")).toBe("MtCO₂");
  expect(displayUnitV150("백만 kW")).toBe("GW");
  expect(displayUnitV150("십억 kWh/yr")).toBe("TWh/yr");
});

test("unknown, empty and already-canonical units pass through unchanged", () => {
  expect(displayUnitV150("EJ")).toBe("EJ");
  expect(displayUnitV150("MtCO₂e")).toBe("MtCO₂e");
  expect(displayUnitV150("USD/MWh")).toBe("USD/MWh");
  expect(displayUnitV150("")).toBe("");
  expect(displayUnitV150(null)).toBe("");
});
