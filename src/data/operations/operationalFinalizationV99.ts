export type OperationalAliasTargetTypeV99 =
  | "country"
  | "technology"
  | "element"
  | "dataset";
const ALIASES_V99: Record<string, string[]> = {
  "element:A-004": [
    "빈곤율",
    "국가빈곤선",
    "national poverty line",
    "poverty",
    "극빈곤",
    "extreme poverty",
    "3 dollar poverty",
    "PIP",
  ],
  "element:A-005": [
    "산업구조",
    "농업비중",
    "제조업비중",
    "서비스비중",
    "agriculture value added",
    "manufacturing value added",
    "services value added",
  ],
  "element:A-006": [
    "실업",
    "실업률",
    "청년실업",
    "youth unemployment",
    "ILOEST",
  ],
  "element:A-008": [
    "지니",
    "지니계수",
    "Gini",
    "income inequality",
    "소득불평등",
  ],
  "dataset:LDC-PILOT-D-020-GCF-PROJECTS": [
    "GCF funded activity",
    "GCF 승인사업",
    "GCF project",
  ],
  "dataset:LDC-PILOT-E-003-GCF-ORGS": [
    "Accredited Entity",
    "Direct Access Entity",
    "NDA",
    "DAE",
  ],
  "technology:industrial-efficiency": [
    "FP071",
    "산업에너지효율",
    "industrial energy efficiency",
  ],
  "technology:geothermal": ["FP083", "지열", "geothermal"],
  "technology:solar-pv": ["FP081", "rooftop solar", "태양광"],
  "technology:transport-efficiency": ["FP186", "FP225", "e-mobility", "전기차"],
  "technology:climate-monitoring-diagnosis": [
    "SAP010",
    "FP258",
    "조기경보",
    "early warning",
    "EW4All",
  ],
  "technology:agriculture-livestock-fisheries": [
    "FP125",
    "FP270",
    "기후스마트농업",
    "climate smart agriculture",
  ],
  "technology:forest-ecosystem": [
    "FP294",
    "FP250",
    "FP130",
    "FP282",
    "REDD+",
    "REDD-plus",
  ],
  "technology:building-efficiency": [
    "FP194",
    "FP177",
    "sustainable cooling",
    "건물효율",
    "냉방효율",
  ],
};
export function getSearchAliasesV99(
  targetType: OperationalAliasTargetTypeV99,
  targetId: string
): string[] {
  return ALIASES_V99[`${targetType}:${targetId}`] ?? [];
}
export const SEARCH_ALIASES_V99 = ALIASES_V99;
