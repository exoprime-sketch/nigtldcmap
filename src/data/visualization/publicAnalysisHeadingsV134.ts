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
  "B-001": {
    publicAnalysisTitle: "월별 강수량·기온과 건기·우기",
    primaryChartTitle: "1991~2020년 월별 평년값",
    secondaryChartTitle: "월별 강수·기온 비교표",
    publicQuestion: "어느 달에 비가 많이 오고 적게 오는지, 월별 기온이 어떻게 다른지 확인할 수 있습니다.",
  },
  "B-025": {
    publicAnalysisTitle: "전체 유역과 베트남 내 면적 비교",
    primaryChartTitle: "유역별 면적 비교",
    secondaryChartTitle: "문헌·GIS 산출 면적표",
    publicQuestion: "8대 유역의 전체 면적과 베트남에 속한 면적을 구분해 확인할 수 있습니다.",
  },
  "B-026": {
    publicAnalysisTitle: "성·시별 물이 흐르는 방향",
    primaryChartTitle: "8방향별 격자 비율",
    secondaryChartTitle: "방향별 비율표",
    publicQuestion: "지역을 선택해 지형 격자의 물 흐름 방향을 비교할 수 있습니다. 하천 유량과는 다른 자료입니다.",
  },
  "E-009": {
    publicAnalysisTitle: "STEM 졸업 비중과 연구자 규모",
    primaryChartTitle: "성별 STEM 졸업 비중 비교",
    secondaryChartTitle: "연구자 수와 인구 대비 규모",
    publicQuestion: "성별 고등교육 졸업자 중 STEM 전공 비중과 연구자 규모를 기준연도별로 확인할 수 있습니다.",
  },
  "C-002": {
    publicAnalysisTitle: "보고서에 수록된 배출량과 이행 정보",
    primaryChartTitle: "2016년 부문·가스별 배출량",
    secondaryChartTitle: "보고서 제출 이력·재원·전망",
    publicQuestion: "BUR3에 수록된 배출량과 흡수량을 부문·가스별로 비교하고, 다른 보고 내용을 찾아볼 수 있습니다.",
  },
  "A-025": {
    publicAnalysisTitle: "CCS 실증·후보·연구 현황",
    primaryChartTitle: "대상별 유형과 진행상황",
    secondaryChartTitle: "설명과 원문 근거",
    publicQuestion: "CCS 실증, 저장 후보지역, 연구·타당성 검토의 대상과 추진 단계를 구분해 확인할 수 있습니다.",
  },
  "A-017": {
    publicAnalysisTitle: "발전원별 비용 범위와 미래 전망",
    primaryChartTitle: "발전원별 기준값·하한·상한 비교",
    secondaryChartTitle: "연도별 발전비용 비교표",
    publicQuestion: "발전원별 비용 범위를 비교하고 2030·2050년 전망을 확인할 수 있습니다. 실제 전기요금과는 다른 지표입니다.",
  },
  "C-001": {
    publicAnalysisTitle: "NDC 이행 조건별 감축목표",
    primaryChartTitle: "자체 이행·국제지원 조건별 목표 비교",
    secondaryChartTitle: "부문별 감축량과 기준 배출량",
    publicQuestion: "자체적으로 이행할 목표와 국제지원이 있을 때의 전체 목표를 구분하고, 부문별 감축량을 비교할 수 있습니다.",
  },
  "C-019": {
    publicAnalysisTitle: "지역별 온실가스 인벤토리 의무 대상 시설",
    primaryChartTitle: "기준일별 성·시의 대상 시설 수",
    secondaryChartTitle: "관련 제도·세율·시행 일정",
    publicQuestion: "지역별 온실가스 인벤토리 의무 대상 시설 수와 제도 근거를 확인할 수 있습니다. 배출권 거래제 참여 시설 수와는 구분됩니다.",
  },
  "C-022": {
    publicAnalysisTitle: "인벤토리 대상 시설의 지역·부문별 구성",
    primaryChartTitle: "선택한 지역의 부문별 시설 수",
    secondaryChartTitle: "탄소시장 준비도 평가와 제도 근거",
    publicQuestion: "지역별 대상 시설의 부문 구성을 비교하고 탄소시장 준비도 평가의 근거를 확인할 수 있습니다.",
  },
  "B-027": {
    publicAnalysisTitle: "전국 지하수 자원량의 연도별 변화",
    primaryChartTitle: "선택한 지하수 지표의 추이",
    secondaryChartTitle: "연도별 값과 자료 기준",
    publicQuestion: "전국 재생가능 지하수 자원량과 이용가능량을 구분해 확인할 수 있습니다. 전국 값을 지역별 매장량으로 해석하지 않습니다.",
  },
  "B-035": {
    publicAnalysisTitle: "전국 토지이용과 농지 지표의 변화",
    primaryChartTitle: "선택한 토지이용 지표의 연도별 변화",
    secondaryChartTitle: "연도별 값과 단위",
    publicQuestion: "농지·산림 등의 면적과 비율, 1인당 경작지 면적을 지표별로 확인할 수 있습니다. 비율은 분모를 구분해 비교합니다.",
  },
  "B-038": {
    publicAnalysisTitle: "바이오매스·폐기물 자원과 발전설비 현황",
    primaryChartTitle: "선택한 자원·설비 지표의 변화",
    secondaryChartTitle: "기준연도별 값과 전망",
    publicQuestion: "바이오매스·폐기물 자원량과 발전설비 용량을 구분해 확인할 수 있습니다. 미래 전망은 실제 발생량과 구분합니다.",
  },
  "C-016": {
    publicAnalysisTitle: "성·시별 재생에너지 계획용량",
    primaryChartTitle: "발전원·계획기간별 지역 비교",
    secondaryChartTitle: "선택 지역의 계획용량과 비교표",
    publicQuestion: "발전원과 계획기간을 선택해 성·시별 계획용량을 비교할 수 있습니다. 계획용량은 현재 운영 중인 설비용량이 아닙니다.",
  },
  "D-006": {
    publicAnalysisTitle: "환경보호세 수입과 연료별 세율",
    primaryChartTitle: "선택한 조세 지표의 연도별 변화",
    secondaryChartTitle: "세수·세율·계획 대비 실적 표",
    publicQuestion: "환경보호세의 계획액·결산액과 연료별 세율을 구분해 확인할 수 있습니다. 세수 금액과 세율은 단위가 다르므로 따로 비교합니다.",
  },
  "A-013": {
    publicAnalysisTitle: "기후목표와 지속가능발전목표의 연결",
    primaryChartTitle: "목표별 연결 항목",
    secondaryChartTitle: "연결 근거표",
    publicQuestion: "국가 기후목표가 어떤 지속가능발전목표와 연결되는지 확인할 수 있습니다. 연결 건수는 목표 달성률이 아닙니다.",
  },
  "A-015": {
    publicAnalysisTitle: "목표별 세부지표 달성도",
    primaryChartTitle: "선택 목표의 세부지표 비교",
    secondaryChartTitle: "세부지표 값과 기준연도",
    publicQuestion: "지속가능발전목표를 선택해 세부지표의 달성도와 기준연도를 확인할 수 있습니다.",
  },
  "A-030": {
    publicAnalysisTitle: "한국과의 수출·수입 및 교역 변화",
    primaryChartTitle: "선택한 교역 지표의 연도별 변화",
    secondaryChartTitle: "연도별 교역액 표",
    publicQuestion: "한국 기준 대베트남 수출·수입·총교역·수지를 구분해 연도별 변화를 확인할 수 있습니다.",
  },
  "A-032": {
    publicAnalysisTitle: "중간재 무역 지표의 연도별 변화",
    primaryChartTitle: "선택한 중간재 지표의 추이",
    secondaryChartTitle: "연도별 값과 단위",
    publicQuestion: "중간재 교역의 금액과 비중을 구분해 각 지표의 연도별 변화를 확인할 수 있습니다.",
  },
  "A-006": {
    publicAnalysisTitle: "전체·청년 실업률과 연도별 변화",
    primaryChartTitle: "선택한 실업률의 연도별 변화",
    secondaryChartTitle: "연도별 실업률 표",
    publicQuestion: "전체와 청년의 실업률을 선택하고, 자료 기준별 추이와 전년 대비 변화를 확인할 수 있습니다.",
  },
  "A-026": {
    publicAnalysisTitle: "건물 공간자료 제공 현황",
    primaryChartTitle: "건물 수·면적 자료 제공 여부",
    secondaryChartTitle: "파일 구성 정보",
    publicQuestion: "현재 제공되는 파일 정보와 건물 수·면적 자료의 제공 여부를 확인할 수 있습니다.",
  },
  "A-002": {
    publicAnalysisTitle: "거버넌스 여섯 부문의 수준과 장기 변화",
    primaryChartTitle: "부문별 백분위의 장기 변화",
    secondaryChartTitle: "최신연도 부문별 비교",
    publicQuestion:
      "시민 자유·참여, 정치안정, 정부 효과성, 규제의 질, 법치, 부패 통제가 어떻게 변했는지 확인할 수 있습니다.",
  },
  "B-005": {
    publicAnalysisTitle: "가뭄 위험의 시나리오별 장기 전망",
    primaryChartTitle: "시나리오별 SPEI-12 전망",
    secondaryChartTitle: "선택연도 시나리오 비교",
    publicQuestion: "기후 시나리오에 따라 장기적인 건조·습윤 상태가 어떻게 달라지는지 확인할 수 있습니다.",
  },
  // V141: the shared C template's attribute rows read as what a reader asks
  // (participation, initiatives, the plan), not as a project portfolio.
  "C-007": {
    publicAnalysisTitle: "파리협정 6.8조 비시장접근법(NMA) 참여 현황",
    primaryChartTitle: "베트남 참여 지위·등록 현황",
    secondaryChartTitle: "확인된 접근법·담당기관·협력 분야",
    publicQuestion: "베트남이 UNFCCC 비시장접근법(NMA) 플랫폼에 어떤 지위로 참여하고 어떤 접근법이 등록됐는지 확인할 수 있습니다.",
  },
  "C-008": {
    publicAnalysisTitle: "국제 기후협력 이니셔티브의 베트남 참여",
    primaryChartTitle: "이니셔티브별 베트남 참여 비교",
    secondaryChartTitle: "NAZCA 등재 행위자의 유형·업종",
    publicQuestion: "베트남이 어떤 국제 기후협력 이니셔티브에 어떤 형태로 참여하고, 어떤 기업·기관·도시가 기후행동 포털에 등재됐는지 확인할 수 있습니다.",
  },
  "C-018": {
    publicAnalysisTitle: "개정 PDP8의 전력 계획·전망과 전력가격 규정",
    primaryChartTitle: "전원별 설비용량 계획(2030·2050 하한~상한)",
    secondaryChartTitle: "수요 전망·목표와 전력가격 규정",
    publicQuestion: "개정 전력개발계획(PDP8)의 2030·2050년 전원 구성과 수요 전망, 재생에너지 비중 목표, 현행 전력가격 규정을 확인할 수 있습니다.",
  },
  // V142: station observations, compared only where the same station, measure,
  // unit and year hold a dry/wet pair; otherwise an observation table.
  "B-023": {
    publicAnalysisTitle: "관측지점별 건기·우기 유량과 그 비율",
    primaryChartTitle: "관측지점별 건기·우기 유량 짝 비교",
    secondaryChartTitle: "지점별 관측값 표와 제한사항",
    publicQuestion: "메콩(Kratie)·홍강(Sơn Tây) 관측지점과 메콩델타에서 건기·우기 유량이 얼마나 다른지, 같은 지점·단위·연도의 짝이 있는 경우에만 비교하여 확인할 수 있습니다.",
  },
  "B-028": {
    publicAnalysisTitle: "관측지점별 하천 유량과 전국 수자원 총량",
    primaryChartTitle: "관측지점별 유량 관측값",
    secondaryChartTitle: "전국 재생가능 수자원 집계",
    publicQuestion: "홍강(Sơn Tây)·메콩(Kratie)·홍–타이빈 수계의 유량 관측값과 전국 재생가능 수자원 총량을, 지점·단위·연도를 구분한 표로 확인할 수 있습니다.",
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
  "D-013": {
    publicAnalysisTitle: "녹색성장지수의 종합·부문·세부항목별 점수",
    primaryChartTitle: "2024년 녹색성장 점수 비교",
    secondaryChartTitle: "평가항목별 점수표",
    publicQuestion: "2024년 녹색성장지수의 종합 점수와 부문·세부항목별 점수를 구분하여 확인할 수 있습니다.",
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
      return `${title} 주요 변화`;
    // Disasters are events, not institutions: a timeline of what happened
    // and when, never "제도 변화" (V142).
    case "event_timeline":
      return `${title} 사건별 기록`;
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
      return `${title}의 주요 제도 변화`;
    case "event_timeline":
      return `${title}의 사건 유형과 발생 시기`;
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
    // B-036 is filed as spatial, but its rows are land-use types at two
    // years, not provinces (V140).
    "B-036": "토지 유형별 이용·피복 변화율과 두 시점 변화",
    "E-009": "과학기술 인력의 최근 수준과 항목별 차이",
  });

/** Primary chart titles that name the dimension the chart actually compares (V140). */
const PRIMARY_TITLE_CORRECTIONS_V140: Readonly<Record<string, string>> = Object.freeze({
  "B-036": "선택연도 토지 유형별 변화율 비교",
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
      const corrected = ["A-025", "B-001", "B-025", "B-026", "C-002", "E-009"].includes(spec.elementId) ? null : DEPTH_CORRECTED_ANALYSIS_TITLES_V135[spec.elementId];
      const primaryCorrected = PRIMARY_TITLE_CORRECTIONS_V140[spec.elementId];
      return {
        elementId: spec.elementId,
        ...base,
        ...(corrected ? { publicAnalysisTitle: corrected } : {}),
        ...(primaryCorrected ? { primaryChartTitle: primaryCorrected } : {}),
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
