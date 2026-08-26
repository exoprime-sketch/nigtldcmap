import type { IndicatorId } from "../data/indicators/registry";
import type { GcfMetricId } from "./gcf";

export type CompareTab = "indicator" | "trend" | "ndc" | "gcf";

export interface CompareViewState {
  tab: CompareTab;
  indicatorId: IndicatorId;
  indicatorYear: number | null;
  ndcTechnologyId: string;
  gcfMetricId: GcfMetricId;
}

/**
 * 다른 화면에서 국가 비교로 이동할 때의 문맥.
 * v86부터 지도 지표 레이어는 해당 레이어의 기준연도까지 함께 전달한다.
 */
export interface CompareNavigationTarget {
  tab: Exclude<CompareTab, "trend">;
  indicatorId?: IndicatorId;
  indicatorYear?: number | null;
  ndcTechnologyId?: string;
  gcfMetricId?: GcfMetricId;
}

export const DEFAULT_COMPARE_VIEW_STATE: CompareViewState = {
  tab: "indicator",
  indicatorId: "electricity-access",
  indicatorYear: null,
  ndcTechnologyId: "renewable-energy",
  gcfMetricId: "gcfFundedActivityCount",
};
