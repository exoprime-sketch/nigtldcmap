import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { assetNameV164 } from "./assetNameV164";

// The data root comes from the country registry (no hand-written data path).
const REPO_ROOT_V164 = resolve(__dirname, "../../..");
const BGD_DIR_V164 = resolve(
  REPO_ROOT_V164,
  `public${(JSON.parse(readFileSync(resolve(REPO_ROOT_V164, "public/data/countries.json"), "utf8")) as { countries: { iso3: string; dataRoot: string }[] }).countries.find((row) => row.iso3 === "BGD")!.dataRoot}`
);

describe("an asset name whose template lost its value is read as what the source gave", () => {
  test("A-024 segment without a stated voltage", () => {
    expect(assetNameV164("A-024", "kV 전력선 구간")).toBe("전압 미기재 전력선 구간");
    expect(assetNameV164("A-024", "132 kV 전력선 구간")).toBe("132 kV 전력선 구간");
  });

  test("the same text on another layer is left alone; basin points still follow their own rule", () => {
    expect(assetNameV164("A-023", "kV 전력선 구간")).toBe("kV 전력선 구간");
    expect(assetNameV164("B-028", "HydroBASINS MAIN_BAS 4080025450")).toBe("유역 출구 대표점 (번호 4080025450)");
  });

  test("Bangladesh A-024 delivery: every voltage-less segment is renamed, none gets a voltage", () => {
    const geo = JSON.parse(readFileSync(resolve(BGD_DIR_V164, "spatial/points/a-024.geojson"), "utf8"));
    const names: string[] = geo.features.map((feature: { properties: { name: string } }) => assetNameV164("A-024", feature.properties.name));
    expect(names.filter((name) => /^kV\b/u.test(name))).toHaveLength(0);
    expect(names.filter((name) => name.startsWith("전압 미기재"))).toHaveLength(144);
  });
});
