import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import type { VietnamMapGeoJsonV124 } from "../vietnam/vietnamDataLoaderV124";
import { polygonLabelPointV150 } from "./mapBackdropV150";
import { pointInGeometryV151, pointInPolygonV151, polygonLabelAnchorV151, polylabelV151 } from "./labelAnchorV151";
import { buildLabelFeaturesV151, tilePlaceLabelFilterV151 } from "./mapLabelsV151";

// Concave "U": a thin base (y 0..1) joining two tall arms (x 0..2 and x 5..7,
// y 1..10). The notch between the arms (x 2..5, y 1..10) is outside the
// polygon, and the shoelace area centroid lands right in that notch.
const CONCAVE_U_RING = [
  [0, 0],
  [0, 10],
  [2, 10],
  [2, 1],
  [5, 1],
  [5, 10],
  [7, 10],
  [7, 0],
];

test("polylabel anchors inside a concave polygon where the area centroid does not", () => {
  const centroid = polygonLabelPointV150({ type: "Polygon", coordinates: [CONCAVE_U_RING] });
  expect(centroid).not.toBeNull();
  expect(pointInPolygonV151(centroid as [number, number], [CONCAVE_U_RING])).toBe(false);

  const { point } = polylabelV151([CONCAVE_U_RING]);
  expect(pointInPolygonV151(point, [CONCAVE_U_RING])).toBe(true);
});

// Read at test time, like adminBoundaryV151.test.ts: compares against the
// bytes the site actually serves rather than a second copy of the same data.
const adm1_34 = JSON.parse(
  readFileSync(join(__dirname, "../../../public/data/vietnam/v2/geometry/vnm-adm1-34.geojson"), "utf8")
) as VietnamMapGeoJsonV124;
const adm1_63 = JSON.parse(
  readFileSync(join(__dirname, "../../../public/data/vietnam/v2/geometry/vnm-adm1-63.geojson"), "utf8")
) as VietnamMapGeoJsonV124;

test("every 34-unit and 63-unit polylabel anchor lies inside its own polygon", () => {
  let centroidOutsideCount = 0;

  for (const feature of adm1_34.features) {
    const anchor = polygonLabelAnchorV151(feature.geometry);
    expect(anchor).not.toBeNull();
    expect(pointInGeometryV151(anchor as [number, number], feature.geometry)).toBe(true);

    const centroid = polygonLabelPointV150(feature.geometry);
    if (centroid && !pointInGeometryV151(centroid, feature.geometry)) centroidOutsideCount++;
  }

  for (const feature of adm1_63.features) {
    const anchor = polygonLabelAnchorV151(feature.geometry);
    expect(anchor).not.toBeNull();
    expect(pointInGeometryV151(anchor as [number, number], feature.geometry)).toBe(true);

    const centroid = polygonLabelPointV150(feature.geometry);
    if (centroid && !pointInGeometryV151(centroid, feature.geometry)) centroidOutsideCount++;
  }

  // For the record: how many of the 97 (34 + 63) old area-centroid anchors
  // would have fallen outside their own polygon. Not an assertion — polylabel
  // anchors above are what the map now draws.
  // eslint-disable-next-line no-console
  console.log(`[mapLabelsV151.test] centroid anchors outside their polygon: ${centroidOutsideCount} / 97`);
});

const CITY_NAMES = ["다낭", "하노이", "호찌민", "하이퐁", "껀터", "후에"];

test("34-unit labels: each city name appears exactly once, as a city, and 28 provinces remain", () => {
  const features = buildLabelFeaturesV151(adm1_34);
  for (const name of CITY_NAMES) {
    const matches = features.filter((feature) => feature.name === name);
    expect(matches).toHaveLength(1);
    expect(matches[0].kind).toBe("city");
  }
  const provinces = features.filter((feature) => feature.kind === "province");
  expect(provinces).toHaveLength(34 - 6);
});

test("63-unit labels: 다낭 appears once as a city, 꽝남/트어티엔후에 remain as provinces, 58 provinces total", () => {
  const features = buildLabelFeaturesV151(adm1_63);
  const daNang = features.filter((feature) => feature.name === "다낭");
  expect(daNang).toHaveLength(1);
  expect(daNang[0].kind).toBe("city");

  const provinces = features.filter((feature) => feature.kind === "province");
  expect(provinces.map((feature) => feature.name)).toEqual(expect.arrayContaining(["꽝남", "트어티엔후에"]));
  expect(provinces).toHaveLength(63 - 5);
});

test("tilePlaceLabelFilterV151 is a valid filter expression that names Da Nang", () => {
  const filterExpression = tilePlaceLabelFilterV151();
  expect(Array.isArray(filterExpression)).toBe(true);
  expect(filterExpression[0]).toBe("!");
  expect(JSON.stringify(filterExpression)).toContain("Da Nang");
});
