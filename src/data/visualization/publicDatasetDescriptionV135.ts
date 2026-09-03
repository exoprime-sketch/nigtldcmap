import {
  ELEMENT_PRESENTATION_SPECS_V100,
  type ElementLayoutFamilyV100,
} from "../elementPresentationRegistryV100";
import { publicDatasetTitleV122 } from "../countries/publicLabelsV122";
import {
  SPECIALIZED_PUBLIC_HEADING_ELEMENT_IDS_V134,
  getPublicAnalysisHeadingsV134,
} from "./publicAnalysisHeadingsV134";
import { publicComparableYearCountV135 } from "./publicTemporalContractV135";

/**
 * V135 public dataset description.
 *
 * A finder card has one sentence to tell a reader what they can find out. The
 * previous copy fell back to "{분류} 관련 자료", which names a shelf rather than
 * a dataset. This resolver derives the sentence deterministically from facts
 * the element already carries: its verified public title, its presentation
 * archetype, how many years a single measure can actually compare, whether it
 * is placed on the map, and whether it currently publishes values.
 *
 * Nothing here invents a value, a comparison target or a claim about recent
 * movement. A year-over-year reading is only promised when the element has at
 * least three comparable years, matching the V135 temporal depth policy.
 */

const TREND_YEAR_MINIMUM_V135 = 3;
const PERIOD_YEAR_MINIMUM_V135 = 2;

export type PublicDescriptionShapeV135 =
  | "status-only"
  | "directory"
  | "portfolio"
  | "policy"
  | "spatial"
  | "scenario"
  | "composition"
  | "trend"
  | "level";

interface PublicDescriptionInputV135 {
  elementId: string;
  elementLabel?: string | null;
  categoryLabel?: string | null;
  dataPresenceStatus?: string | null;
  detailTemplate?: string | null;
  groupLabel?: string | null;
  mapFeatureCount?: number | null;
  mapMode?: string | null;
  publicStatus?: string | null;
  sectionLabel?: string | null;
}

const LAYOUT_FAMILY_BY_ELEMENT_V135: Readonly<
  Record<string, ElementLayoutFamilyV100>
> = Object.freeze(
  Object.fromEntries(
    ELEMENT_PRESENTATION_SPECS_V100.map((spec) => [
      spec.elementId,
      spec.layoutFamily,
    ])
  )
);

const STATUS_ONLY_PUBLIC_STATUS_V135 = new Set([
  "schema-only",
  "data-entry-planned",
  "not-collected",
]);

const STATUS_ONLY_PRESENCE_V135 = new Set([
  "not-collected",
  "no-populated-record",
]);

const DIRECTORY_FAMILIES_V135 = new Set<ElementLayoutFamilyV100>(["directory"]);

const PORTFOLIO_FAMILIES_V135 = new Set<ElementLayoutFamilyV100>([
  "budget",
  "competitor",
  "cost",
  "finance",
  "market",
  "opportunity",
  "portfolio",
  "support",
  "trade",
]);

const POLICY_FAMILIES_V135 = new Set<ElementLayoutFamilyV100>([
  "agreement",
  "document_library",
  "event_timeline",
  "policy_evidence",
  "policy_timeline",
  "process",
  "requirements",
]);

const SPATIAL_MAP_MODES_V135 = new Set([
  "choropleth",
  "cluster",
  "line",
  "point",
  "region-choropleth",
  "regional-scope",
]);

const COMPOSITION_FAMILIES_V135 = new Set<ElementLayoutFamilyV100>([
  "composition",
  "crosswalk",
]);

const SCENARIO_FAMILIES_V135 = new Set<ElementLayoutFamilyV100>(["scenario"]);

const PORTFOLIO_TEMPLATES_V135 = new Set(["finance", "project"]);
const POLICY_TEMPLATES_V135 = new Set(["policy"]);
const DIRECTORY_TEMPLATES_V135 = new Set(["partner"]);

export function publicDescriptionShapeV135(
  input: PublicDescriptionInputV135
): PublicDescriptionShapeV135 {
  if (
    STATUS_ONLY_PUBLIC_STATUS_V135.has(String(input.publicStatus || "")) ||
    STATUS_ONLY_PRESENCE_V135.has(String(input.dataPresenceStatus || ""))
  ) {
    return "status-only";
  }

  const family = LAYOUT_FAMILY_BY_ELEMENT_V135[input.elementId];
  const template = String(input.detailTemplate || "");
  const comparableYears = publicComparableYearCountV135(input.elementId);

  if (family && DIRECTORY_FAMILIES_V135.has(family)) return "directory";
  if (DIRECTORY_TEMPLATES_V135.has(template)) return "directory";

  if (family && PORTFOLIO_FAMILIES_V135.has(family)) return "portfolio";
  if (PORTFOLIO_TEMPLATES_V135.has(template)) return "portfolio";

  if (family && POLICY_FAMILIES_V135.has(family)) return "policy";
  if (POLICY_TEMPLATES_V135.has(template)) return "policy";

  if (family && SCENARIO_FAMILIES_V135.has(family)) {
    return comparableYears >= PERIOD_YEAR_MINIMUM_V135 ? "scenario" : "level";
  }

  // Spatial placement is a verified property of the element, so a regional
  // reading is only offered where the element actually carries mapped features
  // or publishes through a spatial map mode.
  if (
    Number(input.mapFeatureCount || 0) > 0 ||
    SPATIAL_MAP_MODES_V135.has(String(input.mapMode || ""))
  ) {
    return "spatial";
  }

  if (family && COMPOSITION_FAMILIES_V135.has(family)) return "composition";
  if (template === "composition") {
    return comparableYears >= TREND_YEAR_MINIMUM_V135 ? "composition" : "level";
  }

  return comparableYears >= TREND_YEAR_MINIMUM_V135 ? "trend" : "level";
}

function describeV135(
  shape: PublicDescriptionShapeV135,
  title: string,
  comparableYears: number
): string {
  const overTime = comparableYears >= TREND_YEAR_MINIMUM_V135;
  switch (shape) {
    case "status-only":
      return `${title}의 현재 데이터 제공 상태를 확인할 수 있습니다`;
    case "directory":
      return `${title}의 기관별 역할·전문분야·지원내용을 확인할 수 있습니다`;
    case "portfolio":
      return `${title}의 사업 규모와 분야·기관별 구성을 확인할 수 있습니다`;
    case "policy":
      return `${title}의 제도 현황과 시행시점·주요 내용을 확인할 수 있습니다`;
    case "spatial":
      return `${title}의 지역별 분포와 지역 간 차이를 확인할 수 있습니다`;
    case "scenario":
      return `${title}의 시나리오별 전망과 기간별 차이를 확인할 수 있습니다`;
    case "composition":
      return overTime
        ? `${title}의 항목별 구성과 연도별 변화를 확인할 수 있습니다`
        : `${title}의 항목별 구성과 항목 간 차이를 확인할 수 있습니다`;
    case "trend":
      return `${title}의 최근 수준과 연도별 변화를 확인할 수 있습니다`;
    case "level":
    default:
      return `${title}의 최근 수준과 항목별 차이를 확인할 수 있습니다`;
  }
}

export function publicDatasetDescriptionV135(
  input: PublicDescriptionInputV135
): string {
  // The ten separately verified element descriptions are more specific than any
  // template, so they win where they exist.
  if (SPECIALIZED_PUBLIC_HEADING_ELEMENT_IDS_V134.has(input.elementId)) {
    const verified = getPublicAnalysisHeadingsV134(input.elementId)
      ?.publicQuestion;
    if (verified) return verified;
  }

  const title = publicDatasetTitleV122(
    input.elementId,
    String(input.elementLabel || "")
  );

  const shape = publicDescriptionShapeV135(input);
  const comparableYears = publicComparableYearCountV135(input.elementId);
  return describeV135(shape, title, comparableYears);
}
