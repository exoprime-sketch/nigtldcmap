import { ELEMENT_PRESENTATION_SPECS_V100 } from "../elementPresentationRegistryV100";
import type { ElementPresentationSpecV100 } from "../elementPresentationRegistryV100";
import { publicDatasetTitleV122 } from "../countries/publicLabelsV122";

export type PublicAnalysisHeadingsV134 = {
  elementId: string;
  publicAnalysisTitle: string;
  primaryChartTitle: string;
  secondaryChartTitle: string;
  publicQuestion: string;
};

const SPECIALIZED_HEADINGS_V134: Readonly<
  Record<string, Omit<PublicAnalysisHeadingsV134, "elementId">>
> = Object.freeze({
  "A-002": {
    publicAnalysisTitle: "정책·제도 역량의 수준과 장기 변화",
    primaryChartTitle: "정책·제도 역량의 장기 변화",
    secondaryChartTitle: "최신연도 부문별 역량",
    publicQuestion: "경제관리·구조정책·사회적 포용·공공부문 관리 역량이 어떻게 변했는지 확인할 수 있습니다.",
  },
  "B-005": {
    publicAnalysisTitle: "가뭄 위험의 시나리오별 장기 전망",
    primaryChartTitle: "시나리오별 SPEI-12 전망",
    secondaryChartTitle: "선택연도 시나리오 비교",
    publicQuestion: "기후 시나리오에 따라 장기적인 건조·습윤 상태가 어떻게 달라지는지 확인할 수 있습니다.",
  },
  "D-005": {
    publicAnalysisTitle: "기후예산의 적응·감축 배분 구조",
    primaryChartTitle: "대표 예산 배분 구조",
    secondaryChartTitle: "예산 기준별 공개 비율",
    publicQuestion: "기후변화 대응 지출이 적응·감축·동시기여에 어떻게 배분됐는지 확인할 수 있습니다.",
  },
  "D-011": {
    publicAnalysisTitle: "ODA 유입 규모와 공여자 구성",
    primaryChartTitle: "연도별 총 ODA",
    secondaryChartTitle: "최신연도 공여자별 ODA",
    publicQuestion: "베트남에 유입된 공적개발원조의 장기 변화와 주요 공여자를 확인할 수 있습니다.",
  },
  "C-020": {
    publicAnalysisTitle: "온실가스 감축사업 기초정보 수집 상태",
    primaryChartTitle: "원자료 수집 상태",
    secondaryChartTitle: "향후 수집 항목",
    publicQuestion: "현재 수집된 원자료가 없으며, 향후 사업 타당성 검토에 필요한 기초정보의 수집 상태를 안내합니다.",
  },
  "C-021": {
    publicAnalysisTitle: "자발적 탄소시장 사업목록 수집 상태",
    primaryChartTitle: "원자료 수집 상태",
    secondaryChartTitle: "향후 수집 대상",
    publicQuestion: "현재 수집된 사업목록이 없으며, 향후 공식 사업등록부를 기준으로 수집할 대상과 상태를 안내합니다.",
  },
  "C-023": {
    publicAnalysisTitle: "한계저감비용 자료 수집 상태",
    primaryChartTitle: "원자료 수집 상태",
    secondaryChartTitle: "향후 비교 기준",
    publicQuestion: "현재 공개된 한계저감비용 값이 없으며, 향후 동일 가격연도와 산정가정으로 수집해야 할 상태를 안내합니다.",
  },
  "E-011": {
    publicAnalysisTitle: "기술준비수준 입력 준비 상태",
    primaryChartTitle: "입력 예정 항목",
    secondaryChartTitle: "평가·조사 계획",
    publicQuestion: "현재 공개된 평가값은 없으며, 전문가 평가와 현장조사 후 입력할 예정인 항목을 안내합니다.",
  },
  "E-013": {
    publicAnalysisTitle: "운영·유지보수 역량 입력 양식",
    primaryChartTitle: "입력 양식 항목",
    secondaryChartTitle: "향후 입력 범위",
    publicQuestion: "숙련인력, 부품조달, 예방정비, 서비스 인프라와 유사시설 실적을 수집하기 위한 입력 양식이며, 현재 실제 입력값은 없습니다.",
  },
  "E-012": {
    publicAnalysisTitle: "직군·성별에 따른 고용과 임금",
    primaryChartTitle: "직군별 고용·임금 비교",
    secondaryChartTitle: "직군별 종사자 수–임금 관계",
    publicQuestion: "직군과 성별에 따른 고용 규모, 구성비, 여성 비중과 임금 차이를 확인할 수 있습니다.",
  },
});

function titleForSpecV134(spec: ElementPresentationSpecV100): string {
  return publicDatasetTitleV122(spec.elementId, spec.titleKo);
}

function primaryTitleForSpecV134(spec: ElementPresentationSpecV100): string {
  const title = titleForSpecV134(spec);
  switch (spec.layoutFamily) {
    case "benchmark":
    case "scorecard":
      return `${title} 수준과 변화`;
    case "metric_trend":
    case "seasonality":
      return `${title} 연도별 변화`;
    case "composition":
      return `${title} 연도별 구성 변화`;
    case "scenario":
      return `${title} 시나리오별 전망`;
    case "portfolio":
    case "finance":
    case "support":
      return `${title} 규모와 분포`;
    case "directory":
      return `${title} 기관별 현황`;
    case "policy_timeline":
    case "event_timeline":
      return `${title} 주요 변화`;
    case "spatial":
    case "forest":
    case "hazard":
    case "landcover":
    case "resource_map":
      return `${title} 지역별 현황`;
    case "research":
      return `${title} 연도별 성과`;
    default:
      return `${title} 항목별 현황`;
  }
}

function analysisTitleForSpecV134(spec: ElementPresentationSpecV100): string {
  const title = titleForSpecV134(spec);
  switch (spec.layoutFamily) {
    case "benchmark":
    case "scorecard":
      return `${title}의 수준과 장기 변화`;
    case "metric_trend":
    case "seasonality":
      return `${title}의 추세와 최근 수준`;
    case "composition":
      return `${title}의 항목별 비중과 연도별 흐름`;
    case "scenario":
      return `${title}의 시나리오·기간별 변화`;
    case "portfolio":
    case "finance":
    case "support":
      return `${title}의 규모와 분야별 분포`;
    case "directory":
      return `${title}의 기관별 공개 정보`;
    case "policy_timeline":
    case "event_timeline":
      return `${title}의 주요 제도 변화`;
    case "spatial":
    case "forest":
    case "hazard":
    case "landcover":
    case "resource_map":
      return `${title}의 지역별 차이와 범위`;
    case "research":
      return `${title}의 연도별 성과와 구성`;
    default:
      return `${title}의 항목별 공개 현황`;
  }
}

function secondaryTitleForSpecV134(spec: ElementPresentationSpecV100): string {
  const title = titleForSpecV134(spec);
  switch (spec.layoutFamily) {
    case "benchmark":
    case "metric_trend":
    case "seasonality":
      return `${title} 시점별 상세`;
    case "composition":
      return `${title} 선택연도 상세`;
    case "scenario":
      return `${title} 시나리오 비교`;
    case "portfolio":
    case "finance":
    case "support":
      return `${title} 필터와 개별 목록`;
    case "directory":
      return `${title} 연락처와 상세 정보`;
    case "spatial":
    case "forest":
    case "hazard":
    case "landcover":
    case "resource_map":
      return `${title} 지역 비교`;
    default:
      return `${title} 세부 항목`;
  }
}

function publicQuestionForSpecV134(spec: ElementPresentationSpecV100): string {
  const title = titleForSpecV134(spec);
  switch (spec.layoutFamily) {
    case "metric_trend":
    case "benchmark":
    case "seasonality":
      return `${title}의 현재 수준과 기준시점별 변화를 확인할 수 있습니다.`;
    case "composition":
      return `${title}의 구성과 연도별 변화를 확인할 수 있습니다.`;
    case "scenario":
      return `${title}이 시나리오와 기간에 따라 어떻게 달라지는지 확인할 수 있습니다.`;
    case "portfolio":
    case "finance":
    case "support":
      return `${title}의 규모와 분야·기관별 분포를 확인할 수 있습니다.`;
    case "directory":
      return `${title}의 기관별 정보와 공개 연락처를 확인할 수 있습니다.`;
    case "spatial":
    case "forest":
    case "hazard":
    case "landcover":
    case "resource_map":
      return `${title}의 지역 차이와 공개된 공간 범위를 확인할 수 있습니다.`;
    default:
      return `${title}의 공개 값과 항목별 차이를 확인할 수 있습니다.`;
  }
}

/**
 * V135. These elements are laid out as metric trends, but their published data
 * holds a single comparable year per measure, so the generated "…의 추세와 최근
 * 수준" heading would promise a trend the screen cannot draw. The heading is
 * corrected here, in the registry, so the stored contract and the rendered
 * screen stay the same string.
 */
const DEPTH_CORRECTED_ANALYSIS_TITLES_V135: Readonly<Record<string, string>> =
  Object.freeze({
    "B-001": "건기와 우기의 최근 수준과 항목별 차이",
    "B-023": "건기/우기 유량 차이의 최근 수준과 항목별 차이",
    "E-009": "과학기술 인력의 최근 수준과 항목별 차이",
  });

/** Elements whose public copy was authored and verified individually. */
export const SPECIALIZED_PUBLIC_HEADING_ELEMENT_IDS_V134: ReadonlySet<string> =
  new Set(Object.keys(SPECIALIZED_HEADINGS_V134));

export const PUBLIC_ANALYSIS_HEADINGS_V134: readonly PublicAnalysisHeadingsV134[] =
  Object.freeze(
    ELEMENT_PRESENTATION_SPECS_V100.map((spec) => {
      const base = SPECIALIZED_HEADINGS_V134[spec.elementId] || {
        publicAnalysisTitle: analysisTitleForSpecV134(spec),
        primaryChartTitle: primaryTitleForSpecV134(spec),
        secondaryChartTitle: secondaryTitleForSpecV134(spec),
        publicQuestion: publicQuestionForSpecV134(spec),
      };
      const corrected = DEPTH_CORRECTED_ANALYSIS_TITLES_V135[spec.elementId];
      return {
        elementId: spec.elementId,
        ...base,
        ...(corrected ? { publicAnalysisTitle: corrected } : {}),
      };
    })
  );

const PUBLIC_ANALYSIS_HEADING_BY_ELEMENT_V134 = new Map(
  PUBLIC_ANALYSIS_HEADINGS_V134.map((item) => [item.elementId, item])
);

export function getPublicAnalysisHeadingsV134(
  elementId: string
): PublicAnalysisHeadingsV134 | null {
  return PUBLIC_ANALYSIS_HEADING_BY_ELEMENT_V134.get(elementId) || null;
}

export const PUBLIC_ANALYSIS_HEADING_COVERAGE_V134 = Object.freeze({
  elementCount: PUBLIC_ANALYSIS_HEADINGS_V134.length,
  uniqueElementCount: new Set(
    PUBLIC_ANALYSIS_HEADINGS_V134.map((item) => item.elementId)
  ).size,
});

