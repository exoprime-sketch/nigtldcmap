/**
 * V151: the two Vietnamese province vintages the map can draw.
 *
 * Resolution 202/2025/QH15 merged the 63 provinces and centrally-run cities
 * into 34 units on 2025-07-01. Whole provinces were merged and none was split,
 * so each 34-unit boundary is the exact union of its members.
 *
 * The published indicator values are still keyed to the 63-unit system their
 * sources used. Switching the boundary vintage therefore changes the reference
 * outline, the Korean place labels and the copy — never a value. Nothing here
 * sums, averages or splits a value across the reform.
 */

export type BoundarySystemV151 = "post-2025-34" | "pre-2025-63";

export const DEFAULT_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "post-2025-34";

/** Values keep the vintage their source published; only the outline switches. */
export const VALUE_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "pre-2025-63";

export const BOUNDARY_SYSTEM_STORAGE_KEY_V151 = "cdp-map-boundary-system-v151";

export const BOUNDARY_EFFECTIVE_DATE_V151 = "2025-07-01";
export const BOUNDARY_LEGAL_BASIS_V151 = "결의 202/2025/QH15";

export const ADM1_34_GEOMETRY_PATH_V151 = "data/vietnam/v2/geometry/vnm-adm1-34.geojson";
export const ADM1_63_GEOMETRY_PATH_V151 = "data/vietnam/v2/geometry/vnm-adm1-63.geojson";

export interface Adm1Unit34V151 {
  /** Deliberately not an `adm1Code`: a 63-keyed value must never join to it. */
  readonly unitCode: string;
  readonly name: string;
  readonly nameKo: string;
  /** The member whose name the merged unit kept, used for stable codes. */
  readonly successorAdm1Code: string;
  readonly memberAdm1Codes: readonly string[];
}

/** Derived from `reports/v138/map-targets-build-v138.json#crosswalk34`. */
export const ADM1_34_UNITS_V151: readonly Adm1Unit34V151[] = [
  { unitCode: "VN34-01", name: "Lai Châu", nameKo: "라이쩌우", successorAdm1Code: "VN-01", memberAdm1Codes: ["VN-01"] },
  { unitCode: "VN34-02", name: "Lào Cai", nameKo: "라오까이", successorAdm1Code: "VN-02", memberAdm1Codes: ["VN-02", "VN-06"] },
  { unitCode: "VN34-04", name: "Cao Bằng", nameKo: "까오방", successorAdm1Code: "VN-04", memberAdm1Codes: ["VN-04"] },
  { unitCode: "VN34-05", name: "Sơn La", nameKo: "선라", successorAdm1Code: "VN-05", memberAdm1Codes: ["VN-05"] },
  { unitCode: "VN34-07", name: "Tuyên Quang", nameKo: "뚜옌꽝", successorAdm1Code: "VN-07", memberAdm1Codes: ["VN-03", "VN-07"] },
  { unitCode: "VN34-09", name: "Lạng Sơn", nameKo: "랑선", successorAdm1Code: "VN-09", memberAdm1Codes: ["VN-09"] },
  { unitCode: "VN34-13", name: "Quảng Ninh", nameKo: "꽝닌", successorAdm1Code: "VN-13", memberAdm1Codes: ["VN-13"] },
  { unitCode: "VN34-18", name: "Ninh Bình", nameKo: "닌빈", successorAdm1Code: "VN-18", memberAdm1Codes: ["VN-18", "VN-63", "VN-67"] },
  { unitCode: "VN34-21", name: "Thanh Hóa", nameKo: "타인호아", successorAdm1Code: "VN-21", memberAdm1Codes: ["VN-21"] },
  { unitCode: "VN34-22", name: "Nghệ An", nameKo: "응에안", successorAdm1Code: "VN-22", memberAdm1Codes: ["VN-22"] },
  { unitCode: "VN34-23", name: "Hà Tĩnh", nameKo: "하띤", successorAdm1Code: "VN-23", memberAdm1Codes: ["VN-23"] },
  { unitCode: "VN34-25", name: "Quảng Trị", nameKo: "꽝찌", successorAdm1Code: "VN-25", memberAdm1Codes: ["VN-24", "VN-25"] },
  { unitCode: "VN34-26", name: "Huế", nameKo: "후에", successorAdm1Code: "VN-26", memberAdm1Codes: ["VN-26"] },
  { unitCode: "VN34-29", name: "Quảng Ngãi", nameKo: "꽝응아이", successorAdm1Code: "VN-29", memberAdm1Codes: ["VN-28", "VN-29"] },
  { unitCode: "VN34-30", name: "Gia Lai", nameKo: "잘라이", successorAdm1Code: "VN-30", memberAdm1Codes: ["VN-30", "VN-31"] },
  { unitCode: "VN34-33", name: "Đắk Lắk", nameKo: "닥락", successorAdm1Code: "VN-33", memberAdm1Codes: ["VN-32", "VN-33"] },
  { unitCode: "VN34-34", name: "Khánh Hòa", nameKo: "카인호아", successorAdm1Code: "VN-34", memberAdm1Codes: ["VN-34", "VN-36"] },
  { unitCode: "VN34-35", name: "Lâm Đồng", nameKo: "럼동", successorAdm1Code: "VN-35", memberAdm1Codes: ["VN-35", "VN-40", "VN-72"] },
  { unitCode: "VN34-37", name: "Tây Ninh", nameKo: "떠이닌", successorAdm1Code: "VN-37", memberAdm1Codes: ["VN-37", "VN-41"] },
  { unitCode: "VN34-39", name: "Đồng Nai", nameKo: "동나이", successorAdm1Code: "VN-39", memberAdm1Codes: ["VN-39", "VN-58"] },
  { unitCode: "VN34-44", name: "An Giang", nameKo: "안장", successorAdm1Code: "VN-44", memberAdm1Codes: ["VN-44", "VN-47"] },
  { unitCode: "VN34-45", name: "Đồng Tháp", nameKo: "동탑", successorAdm1Code: "VN-45", memberAdm1Codes: ["VN-45", "VN-46"] },
  { unitCode: "VN34-49", name: "Vĩnh Long", nameKo: "빈롱", successorAdm1Code: "VN-49", memberAdm1Codes: ["VN-49", "VN-50", "VN-51"] },
  { unitCode: "VN34-56", name: "Bắc Ninh", nameKo: "박닌", successorAdm1Code: "VN-56", memberAdm1Codes: ["VN-54", "VN-56"] },
  { unitCode: "VN34-59", name: "Cà Mau", nameKo: "까마우", successorAdm1Code: "VN-59", memberAdm1Codes: ["VN-55", "VN-59"] },
  { unitCode: "VN34-66", name: "Hưng Yên", nameKo: "흥옌", successorAdm1Code: "VN-66", memberAdm1Codes: ["VN-20", "VN-66"] },
  { unitCode: "VN34-68", name: "Phú Thọ", nameKo: "푸토", successorAdm1Code: "VN-68", memberAdm1Codes: ["VN-14", "VN-68", "VN-70"] },
  { unitCode: "VN34-69", name: "Thái Nguyên", nameKo: "타이응우옌", successorAdm1Code: "VN-69", memberAdm1Codes: ["VN-53", "VN-69"] },
  { unitCode: "VN34-71", name: "Điện Biên", nameKo: "디엔비엔", successorAdm1Code: "VN-71", memberAdm1Codes: ["VN-71"] },
  { unitCode: "VN34-CT", name: "Cần Thơ", nameKo: "껀터", successorAdm1Code: "VN-CT", memberAdm1Codes: ["VN-52", "VN-73", "VN-CT"] },
  { unitCode: "VN34-DN", name: "Đà Nẵng", nameKo: "다낭", successorAdm1Code: "VN-DN", memberAdm1Codes: ["VN-27", "VN-DN"] },
  { unitCode: "VN34-HN", name: "Hà Nội", nameKo: "하노이", successorAdm1Code: "VN-HN", memberAdm1Codes: ["VN-HN"] },
  { unitCode: "VN34-HP", name: "Hải Phòng", nameKo: "하이퐁", successorAdm1Code: "VN-HP", memberAdm1Codes: ["VN-61", "VN-HP"] },
  { unitCode: "VN34-SG", name: "Hồ Chí Minh", nameKo: "호찌민", successorAdm1Code: "VN-SG", memberAdm1Codes: ["VN-43", "VN-57", "VN-SG"] },
];

export const PROVINCE_KO_34_V151: Record<string, string> = Object.fromEntries(
  ADM1_34_UNITS_V151.map((unit) => [unit.unitCode, unit.nameKo])
);

/** Which 34-unit a pre-2025 province was folded into. Membership, not a value. */
export const ADM1_34_UNIT_BY_MEMBER_V151: Record<string, string> = Object.fromEntries(
  ADM1_34_UNITS_V151.flatMap((unit) =>
    unit.memberAdm1Codes.map((code) => [code, unit.unitCode])
  )
);

export const BOUNDARY_UNIT_COUNT_V151: Record<BoundarySystemV151, number> = {
  "post-2025-34": ADM1_34_UNITS_V151.length,
  "pre-2025-63": 63,
};

export function isBoundarySystemV151(value: unknown): value is BoundarySystemV151 {
  return value === "post-2025-34" || value === "pre-2025-63";
}

export function boundarySystemV151(value: unknown): BoundarySystemV151 {
  return isBoundarySystemV151(value) ? value : DEFAULT_BOUNDARY_SYSTEM_V151;
}

export function boundaryGeometryPathV151(system: BoundarySystemV151): string {
  return system === "post-2025-34"
    ? ADM1_34_GEOMETRY_PATH_V151
    : ADM1_63_GEOMETRY_PATH_V151;
}

/** "34개 성·시(2025-07-01 시행)" — the phrase every screen shares. */
export function boundarySystemLabelV151(system: BoundarySystemV151): string {
  return system === "post-2025-34"
    ? `34개 성·시(${BOUNDARY_EFFECTIVE_DATE_V151} 시행)`
    : "63개 성·시(개편 전)";
}

export function boundarySystemShortLabelV151(system: BoundarySystemV151): string {
  return system === "post-2025-34" ? "개편 후 34개" : "개편 전 63개";
}

/**
 * The one sentence that keeps the outline and the values apart. Shown wherever
 * the 34-unit outline sits on top of values their source published per province.
 */
export function boundaryValueNoticeV151(system: BoundarySystemV151): string {
  return system === "post-2025-34"
    ? "경계선은 2025-07-01 시행 34개 성·시입니다. 값은 원자료가 발표한 개편 전 63개 성·시 기준이며 34개로 합산하지 않습니다."
    : "경계선과 값 모두 개편 전 63개 성·시 기준입니다.";
}

export const BOUNDARY_ATTRIBUTION_V151 =
  "행정경계: geoBoundaries VNM ADM1(CC BY 4.0) · 34개 단위는 결의 202/2025/QH15 통합 대응표로 위상 병합";
