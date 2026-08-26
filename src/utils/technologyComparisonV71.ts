import type { VietnamDemoElement } from "../types/vietnamDemo";
import { sampleNumber } from "./dataPreviewV53";

export type CompetitorId = "all" | "CHN" | "JPN" | "USA" | "DEU" | "DNK";

export type RelativePosition = "우위" | "동등" | "열위";

export interface ComparisonAxis {
  key: string;
  label: string;
  evidenceType: string;
}

export const COMPETITOR_OPTIONS: Array<{
  value: CompetitorId;
  label: string;
}> = [
  { value: "all", label: "주요 경쟁국 전체" },
  { value: "CHN", label: "중국" },
  { value: "JPN", label: "일본" },
  { value: "USA", label: "미국" },
  { value: "DEU", label: "독일" },
  { value: "DNK", label: "덴마크" },
];

export const TECHNOLOGY_COMPARISON_AXES: ComparisonAxis[] = [
  {
    key: "trl",
    label: "기술성숙도·실증",
    evidenceType: "TRL · 실증단계 · 상용운영 실적",
  },
  {
    key: "export",
    label: "수출·해외실적",
    evidenceType: "수출액 · 해외 프로젝트 · 수주실적",
  },
  {
    key: "cost",
    label: "비용경쟁력",
    evidenceType: "CAPEX · LCOE · 단가 · 가격조건",
  },
  {
    key: "supply",
    label: "공급망·제조역량",
    evidenceType: "생산능력 · 핵심부품 · 조달망",
  },
  {
    key: "execution",
    label: "EPC·O&M 수행역량",
    evidenceType: "EPC · 시공 · O&M · 현장 수행실적",
  },
  {
    key: "innovation",
    label: "특허·R&D 역량",
    evidenceType: "특허 · 논문 · R&D · 국제협력",
  },
];

export function isTechnologyComparisonElementV71(
  element: VietnamDemoElement
): boolean {
  return element.elementId === "E-017";
}

export function getCompetitorLabelV71(competitorId: CompetitorId): string {
  return (
    COMPETITOR_OPTIONS.find((item) => item.value === competitorId)?.label ??
    competitorId
  );
}

export function getRelativePositionV71({
  technologyId,
  competitorId,
  axisKey,
  year,
}: {
  technologyId: string;
  competitorId: CompetitorId;
  axisKey: string;
  year: number;
}): RelativePosition {
  const value = sampleNumber(
    `E-017:${technologyId}:${competitorId}:${axisKey}:${year}`,
    -1,
    1
  );

  if (value > 0.23) return "우위";
  if (value < -0.23) return "열위";
  return "동등";
}

export function getPositionReasonV71(
  axisKey: string,
  position: RelativePosition
): string {
  const reasons: Record<string, Record<RelativePosition, string>> = {
    trl: {
      우위: "상용화·실증 단계와 운영 레퍼런스에서 상대 강점",
      동등: "기술성숙도와 실증단계가 유사한 수준",
      열위: "대규모 실증·상용 레퍼런스 추가 확보 필요",
    },
    export: {
      우위: "해외 프로젝트·수출·수주실적에서 상대 강점",
      동등: "해외 실적 규모가 유사한 수준",
      열위: "수출시장·해외 레퍼런스 확대 필요",
    },
    cost: {
      우위: "설비·EPC·운영비 조건에서 상대 경쟁력",
      동등: "비용조건이 유사한 수준",
      열위: "가격·조달비용 경쟁력 보완 필요",
    },
    supply: {
      우위: "제조·부품·조달망 기반에서 상대 강점",
      동등: "공급망 기반이 유사한 수준",
      열위: "핵심부품·제조 공급망 보완 필요",
    },
    execution: {
      우위: "EPC·시공·O&M 현장수행 실적에서 상대 강점",
      동등: "수행경험이 유사한 수준",
      열위: "현지 수행·O&M 레퍼런스 보완 필요",
    },
    innovation: {
      우위: "특허·R&D·공동연구 기반에서 상대 강점",
      동등: "혁신역량 지표가 유사한 수준",
      열위: "IP·R&D·국제공동연구 기반 보완 필요",
    },
  };

  return reasons[axisKey]?.[position] ?? "실제 공개자료 연결 후 근거 기반 판정";
}
