import { describe, expect, test } from "@jest/globals";
import { pointOutsideNoteV164, pointUnitNameV164 } from "./pointLocationV164";
import { pointLocationLabelV151 } from "../../map/layers/features";

describe("a point outside every province says what is true about it", () => {
  test("a station in Cambodia is an overseas point, not an unconfirmed one", () => {
    const note = pointOutsideNoteV164(
      { 개편_후_소속_단위: "해당없음(국외)", 소속_행정구역_ADM1_GADM_명칭: "캄보디아 Kratie(국외 지점)" },
      "VNM"
    );
    expect(note).toBe("국외 지점 (캄보디아 Kratie)");
  });

  test("an investor headquartered abroad names the head-office country", () => {
    expect(pointOutsideNoteV164({ 좌표_소재_구분_coord_location_type: "해외 본부 소재지", hqCountryIso3: "CHE" }, "VNM")).toBe("국외 지점 (스위스)");
    expect(pointOutsideNoteV164({ 좌표_소재_구분_coord_location_type: "해외 본부 소재지" }, "VNM")).toBe("국외 지점");
  });

  test("a typhoon track point at sea is a sea point with its distance to land", () => {
    const note = pointOutsideNoteV164({ 개편_후_소속_단위: null, 태풍_중심_국토_최근접거리_km: 147.3, 좌표_산출근거: "IBTrACS 최근접점 — 국토 최근접 147.3 km" }, "VNM");
    expect(note).toBe("해상 지점 (국토 최근접 147.3 km)");
    expect(pointOutsideNoteV164({ 좌표_산출근거: "IBTrACS 최근접점 — 국토 최근접 90.0 km" }, "VNM")).toBe("해상 지점 (국토 최근접 90 km)");
  });

  test("a record that states its unit is told by that unit, not as unknown", () => {
    const note = pointOutsideNoteV164({ 개편_후_소속_단위: "Quảng Trị", 소재_행정구역_ADM1: "QuangTri" }, "VNM");
    expect(note).toBe("소재 꽝찌 (Quảng Trị) · 개편 후 34개 기준");
    expect(note).not.toContain("미확정");
  });

  test("a centroid of several affected units is not named as one place", () => {
    const note = pointOutsideNoteV164({ 개편_후_소속_단위: "Nghệ An · Hà Tĩnh · Thanh Hóa · Hà Nội" }, "VNM");
    expect(note.startsWith("영향 지역 4곳의 중심 좌표 (")).toBe(true);
    expect(note.endsWith("외 2곳)")).toBe(true);
  });

  test("nothing stated: only the geometric fact, never 미확정 or 성·시", () => {
    const note = pointOutsideNoteV164({}, "VNM");
    expect(note).toBe("좌표가 행정경계 밖(해안·도서·해상)");
    expect(pointOutsideNoteV164(null, "BGD")).not.toMatch(/성·시|미확정|34개|63개/u);
  });

  test("a Bangladesh point never reads with Viet Nam's units or vintage words", () => {
    const note = pointOutsideNoteV164({ 개편_후_소속_단위: "Dhaka" }, "BGD");
    expect(note).not.toMatch(/성·시|34개|63개|개편/u);
  });
});

describe("pointUnitNameV164", () => {
  test("names the 2025 unit on the 34-unit outline, the province on the 63 one", () => {
    const hue = { adm1Code: "VN-26", adm1Name: "Thừa Thiên Huế", unitCode: "VN34-26" };
    expect(pointUnitNameV164(hue, "post-2025-34", "VNM")).toBe("후에 (Huế)");
    expect(pointUnitNameV164(hue, "pre-2025-63", "VNM")).toBe("트어티엔후에 (Thừa Thiên Huế)");
  });
});

describe("pointLocationLabelV151 returns the whole phrase", () => {
  test("no sidecar: no line; inside: 소재 + unit; outside: the derived note", () => {
    expect(pointLocationLabelV151(undefined, "post-2025-34")).toBeNull();
    expect(pointLocationLabelV151(null, "post-2025-34", { 개편_후_소속_단위: "해당없음(국외)", 소속_행정구역_ADM1_GADM_명칭: "캄보디아 Kratie(국외 지점)" })).toBe("국외 지점 (캄보디아 Kratie)");
    const inside = pointLocationLabelV151({ adm1Code: "VN-HN", adm1Name: "Hà Nội", unitCode: null } as never, "pre-2025-63");
    expect(inside).toBe("소재 하노이(개편 전 63개 기준)");
  });
});
