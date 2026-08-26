import { DATA_DISPLAY_CONTRACT_INDEX_V118 } from "./dataDisplayContractV118";

export type PublicMapCategoryV118 =
  | "기후위험·적응"
  | "에너지·인프라"
  | "산업·시장"
  | "기술수요"
  | "국제사업·지원"
  | "재원"
  | "정책·제도";

export const PUBLIC_MAP_CATEGORIES_V118: PublicMapCategoryV118[] = [
  "기후위험·적응",
  "에너지·인프라",
  "산업·시장",
  "기술수요",
  "국제사업·지원",
  "재원",
  "정책·제도",
];

const CATEGORY_BY_PREFIX: Array<[RegExp, PublicMapCategoryV118]> = [
  [/^(B-)/, "기후위험·적응"],
  [/^(A-01[6-9]|A-02[0-9]|A-03[0-3])$/, "에너지·인프라"],
  [/^(A-|E-00[4-9]|E-01[0-9]|E-02[0-9])/, "산업·시장"],
  [/^C-005$/, "기술수요"],
  [/^(D-018|D-019|D-020|D-021|D-023)$/, "국제사업·지원"],
  [/^(D-011|D-022|D-023)$/, "재원"],
  [/^C-/, "정책·제도"],
  [/^D-/, "국제사업·지원"],
];

export function getPublicMapCategoryV118(
  elementId: string
): PublicMapCategoryV118 {
  for (const [pattern, category] of CATEGORY_BY_PREFIX) {
    if (pattern.test(elementId)) return category;
  }
  return "산업·시장";
}

/**
 * 공개 기본지도는 현재 실제 데이터로 공간적으로 읽을 수 있는 정보만 활성화한다.
 * - primary: B-006 고온체감 위험(실제 국가단위 전망)
 * - overlay: C-005 공식 TNA/TAP 기술수요(국가집계)
 * - 정책/사업/ODA는 선택 국가의 Evidence Panel에서 우선 제공
 */
export const DEFAULT_MAP_VIEW_V118 = {
  primaryElementId: "B-006",
  overlayElementIds: ["C-005"],
  panelElementIds: [
    "C-001",
    "C-003",
    "D-019",
    "D-020",
    "D-018",
    "D-023",
    "D-021",
    "D-011",
  ],
} as const;

export const PUBLIC_PRESET_LABELS_V118: Record<string, string> = {
  "핵심 협력기획 보기": "협력 현황",
  "기술수요 보기": "기술수요",
  "정책·제도 보기": "정책·제도",
  "사업·재원 보기": "국제사업·재원",
  "ODA·공여환경 보기": "ODA·공여환경",
  "기후위험·적응 보기": "기후위험·적응",
  "에너지·인프라 보기": "에너지·인프라",
  "시장·산업 보기": "산업·시장",
  "기술·혁신 보기": "기술·혁신",
  "파트너·실행기반 보기": "파트너·기관",
};

export function isActualMapPrimaryV118(elementId: string): boolean {
  const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(elementId);
  return Boolean(
    contract &&
      contract.actualDataStatus !== "planned" &&
      contract.displaySurface === "map-primary"
  );
}

export function isActualMapOverlayV118(elementId: string): boolean {
  const contract = DATA_DISPLAY_CONTRACT_INDEX_V118.get(elementId);
  return Boolean(
    contract &&
      contract.actualDataStatus !== "planned" &&
      contract.displaySurface === "map-overlay"
  );
}
