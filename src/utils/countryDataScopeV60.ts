import type { VietnamDemoElement } from "../types/vietnamDemo";

export type CountryDataScope = "target_country" | "bilateral" | "korea_common";

export type SecondarySelectorType =
  | "year"
  | "document_version"
  | "reporting_period"
  | "standard_vintage"
  | "status_sector"
  | "organization_type"
  | "technology"
  | "none";

const KOREA_COMMON = new Set(["E-016", "E-017", "E-020"]);

const BILATERAL = new Set([
  "A-029",
  "A-030",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "E-014",
  "E-018",
  "E-019",
]);

const DOCUMENT_VERSION = new Set([
  "C-001",
  "C-002",
  "C-003",
  "C-004",
  "C-005",
  "C-015",
]);

const REPORTING_PERIOD = new Set(["C-024"]);

const STANDARD_VINTAGE = new Set(["C-025"]);

const STATUS_SECTOR = new Set([
  "C-007",
  "C-008",
  "C-021",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-018",
  "D-019",
  "D-020",
  "D-021",
  "D-022",
  "D-023",
  "D-024",
  "D-025",
  "D-026",
  "E-018",
]);

const ORGANIZATION_TYPE = new Set([
  "E-001",
  "E-002",
  "E-003",
  "E-004",
  "E-005",
  "E-006",
  "E-019",
]);

const TECHNOLOGY = new Set(["C-020", "C-023", "E-011", "E-013", "E-017"]);

export function getCountryDataScope(elementId: string): CountryDataScope {
  if (KOREA_COMMON.has(elementId)) return "korea_common";
  if (BILATERAL.has(elementId)) return "bilateral";
  return "target_country";
}

export function needsCountrySelector(elementId: string): boolean {
  return getCountryDataScope(elementId) !== "korea_common";
}

export function getCountrySelectorLabel(elementId: string): string {
  return getCountryDataScope(elementId) === "bilateral"
    ? "협력 대상국"
    : "국가";
}

export function getSecondarySelectorType(
  element: VietnamDemoElement
): SecondarySelectorType {
  const { elementId } = element;

  if (DOCUMENT_VERSION.has(elementId)) return "document_version";
  if (REPORTING_PERIOD.has(elementId)) return "reporting_period";
  if (STANDARD_VINTAGE.has(elementId)) return "standard_vintage";
  if (STATUS_SECTOR.has(elementId)) return "status_sector";
  if (ORGANIZATION_TYPE.has(elementId)) return "organization_type";
  if (TECHNOLOGY.has(elementId)) return "technology";

  if (
    element.spatialLevel === "국가" &&
    ["numeric", "time_series", "categorical"].includes(element.displayType)
  ) {
    return "year";
  }

  return "none";
}

export function getCountryScopeDescription(elementId: string): string {
  switch (getCountryDataScope(elementId)) {
    case "bilateral":
      return "한국과 선택 대상국 간 자료";
    case "korea_common":
      return "한국 공급·지원 공통자료";
    default:
      return "선택 국가 기준 자료";
  }
}
