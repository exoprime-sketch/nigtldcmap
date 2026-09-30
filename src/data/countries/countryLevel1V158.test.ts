import { describe, expect, it } from "@jest/globals";

import { DEFAULT_COUNTRY_ISO3_V158 } from "../countryContext";
import { regionWordV158, subjectParticleV158 } from "./countryLevel1V158";

describe("regionWordV158 (V158-B2b)", () => {
  it("keeps the default country's reviewed word and marks no other-country level", () => {
    const { word, level1 } = regionWordV158(DEFAULT_COUNTRY_ISO3_V158);
    expect(word.length).toBeGreaterThan(0);
    expect(level1).toBeNull();
    expect(regionWordV158(null)).toEqual({ word, level1: null });
  });
});

describe("subjectParticleV158", () => {
  it("follows the word's last sound", () => {
    expect(subjectParticleV158("성·시")).toBe("가");
    expect(subjectParticleV158("주")).toBe("가");
    expect(subjectParticleV158("도시권")).toBe("이");
    expect(subjectParticleV158("Division")).toBe("이");
    expect(subjectParticleV158("Province")).toBe("가");
  });
});

