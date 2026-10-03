import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { A022_JURISDICTION_DATE_V162, getPublicLimitationsV127 } from "./publicLimitationsRegistryV127";

describe("A-022 jurisdiction reference point (V162 PR-D)", () => {
  test("the date is the jurisdiction table's own", () => {
    const table = JSON.parse(readFileSync(resolve(process.cwd(), "tools/etl/countries/vnm/evn-jurisdiction.json"), "utf8"));
    expect(A022_JURISDICTION_DATE_V162).toBe(table.hcmcChange.effectiveDate);
  });

  test("A-022 states it in one limitation line", () => {
    const lines = getPublicLimitationsV127("A-022").map((item) => item.message);
    expect(lines.filter((line) => line.startsWith("관할 기준 시점:"))).toHaveLength(1);
    expect(lines[0]).toContain(A022_JURISDICTION_DATE_V162);
  });
});
