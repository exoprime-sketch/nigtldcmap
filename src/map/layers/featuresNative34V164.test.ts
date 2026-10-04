import { describe, expect, it } from "@jest/globals";
import { choroplethFeatureCollectionV151 } from "./features";

const square = (x: number) => ({ type: "Polygon", coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] });

describe("rows keyed by the 2025 unit (V164-4, VNM D-022)", () => {
  it("draws adm1Code34-keyed rows on the 34-unit outline", () => {
    const layer = {
      elementId: "D-022",
      publicShortTitle: "MDB·DFI 금융",
      boundaryPolicy: { schema: "boundary-policy-v151-2", kind: "native-34", valueSystem: "post-2025-34" },
      selectors: { variables: [{ key: "project-count", label: "사업 수", unit: "건", periods: ["1997–2025"] }] },
    } as never;
    const asset = {
      geometry: { type: "FeatureCollection", features: [] },
      data: {
        joinKey: "adm1Code34",
        values: [
          { adm1Code34: "VN34-22", adm1Name34: "Nghệ An", variable: "project-count", period: "1997–2025", value: 3, unit: "건" },
        ],
      },
    } as never;
    const geometry34 = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { unitCode: "VN34-22", name: "Nghệ An" }, geometry: square(0) },
        { type: "Feature", properties: { unitCode: "VN34-23", name: "Hà Tĩnh" }, geometry: square(2) },
      ],
    } as never;
    const result = choroplethFeatureCollectionV151(layer, asset, { variable: "project-count", period: "1997–2025" } as never, {
      system: "post-2025-34",
      geometry34,
      region6: null,
    });
    const byUnit = Object.fromEntries(result.collection.features.map((f) => [f.properties?.unitCode, f.properties]));
    expect(byUnit["VN34-22"]?.hasValue).toBe(true);
    expect(byUnit["VN34-22"]?.value).toBe(3);
    expect(byUnit["VN34-23"]?.hasValue).toBe(false);
  });
});
