import publicMapTargetsContractV138 from "./publicMapTargetsV138.json";

/**
 * What the province-by-scenario-by-year screens measure, stated explicitly.
 *
 * V137 chose the default measure by matching words of the screen title against
 * column names and read units off column suffixes. That put B-017 on a
 * drought-risk column, called Aqueduct's 443 assessment zones "성·시", and could
 * not say what a water-stress raw value is a ratio of. The important defaults
 * are bound here to the delivered column, with the unit the source defines;
 * the title-similarity rule stays only as the fallback for screens no one has
 * reviewed yet.
 */
export interface RegionScenarioMeasureV138 {
  /** Delivered attribute column. */
  key: string;
  label: string;
  unit: string;
  /** How to read the number, in one phrase. */
  direction?: string;
  /** Companion column holding the publisher's banding of this value. */
  gradeKey?: string;
}

export interface RegionScenarioContractV138 {
  measures: RegionScenarioMeasureV138[];
  defaultMeasure?: string;
  /** What one delivered row describes, when finer than a province. */
  rowUnit?: {
    label: string;
    idKeys: string[];
    /**
     * Reader-facing name of one row, from its delivered fields. Without it
     * the row is named by its first id key, which for a composite source key
     * such as Aqueduct's `pfaf-GID_1-aqid` shows a code, not a place.
     */
    describe?: (attributes: Record<string, unknown>) => string;
  };
  /** The period the source states, where the rows carry none. */
  periodLabel?: string;
  /** Interpretation constraints a reader needs before comparing values. */
  constraints: string[];
  /** Copy for the scenario axis, where the source's scenarios need a word. */
  scenarioNote?: string;
}

const MAP_TARGET_MEASURES = new Map<string, RegionScenarioMeasureV138[]>(
  publicMapTargetsContractV138.targets
    .filter((target) => Array.isArray((target.build as { measures?: unknown[] }).measures))
    .map((target) => [
      target.elementId,
      ((target.build as { measures: Array<{ sourceKey?: string; label: string; unit: string }> }).measures)
        .filter((measure) => Boolean(measure.sourceKey))
        .map((measure) => ({
          key: measure.sourceKey as string,
          label: measure.label,
          unit: measure.unit,
        })),
    ])
);

const CLIMATE_CONSTRAINTS = [
  "성·시 값은 GADM 4.1 ADM1(개편 전 63개) 경계로 집계한 CCKP 격자 통계이며 관측소 값이 아닙니다.",
  "전국 평균은 원천이 제공하지 않으므로 만들지 않습니다. 전체 분포는 개편 전 63개 성·시 값의 중앙값과 10~90 분위(지역 간 분포)입니다.",
];

const PROJECTION_CONSTRAINTS = [
  ...CLIMATE_CONSTRAINTS,
  "과거 모형(historical)은 관측이 아니라 CMIP6 모형이 재현한 값이며, SSP 계열은 시나리오별 전망입니다. 두 구간은 서로 잇지 않습니다.",
  "10~90 분위는 성·시 간 분포이며 모형 앙상블의 불확실성 범위가 아닙니다. 원천은 앙상블 중앙값 한 계열만 제공합니다.",
];

const CONTRACTS: Record<string, RegionScenarioContractV138> = {
  "B-003": {
    measures: MAP_TARGET_MEASURES.get("B-003") || [],
    defaultMeasure: "연평균_기온",
    constraints: [
      "관측 기반(CRU TS 4.09) 연평균값입니다. 성·시 값은 1901년부터, 전국 값은 원천 계열 그대로 제공합니다.",
      ...CLIMATE_CONSTRAINTS,
    ],
  },
  "B-004": {
    measures: MAP_TARGET_MEASURES.get("B-004") || [],
    defaultMeasure: "연평균_기온",
    constraints: PROJECTION_CONSTRAINTS,
    scenarioNote: "SSP1-1.9(강한 감축)부터 SSP5-8.5(고배출)까지의 공통사회경제경로입니다.",
  },
  "B-005": {
    measures: [
      {
        key: "연속_건조일수_CDD_일",
        label: "연속 건조일수(CDD)",
        unit: "일",
        direction: "클수록 건조 기간이 김",
      },
      {
        key: "표준강수증발산지수_SPEI12",
        label: "표준강수증발산지수(SPEI-12)",
        unit: "지수",
        direction: "음수일수록 건조, 양수일수록 습윤",
      },
    ],
    defaultMeasure: "연속_건조일수_CDD_일",
    constraints: [
      "CDD는 한 해의 최장 연속 무강수 일수(일)이고 SPEI-12는 12개월 누적 물수지 지수입니다. 단위와 방향이 달라 같은 축에 두지 않습니다.",
      ...PROJECTION_CONSTRAINTS,
    ],
  },
  "B-006": {
    measures: MAP_TARGET_MEASURES.get("B-006") || [],
    defaultMeasure: "폭염일수_TX_35_일",
    constraints: [
      "임계온도(35°C·40°C, 23·26·29°C, Heat Index 35°C)마다 별도 지표이며 서로 더하지 않습니다.",
      ...PROJECTION_CONSTRAINTS,
    ],
  },
  "B-007": {
    measures: MAP_TARGET_MEASURES.get("B-007") || [],
    defaultMeasure: "최대_1일_강수_mm",
    constraints: [
      "강수 극값 지표(mm·일수)이며 침수 면적이나 홍수 발생확률이 아닙니다.",
      ...PROJECTION_CONSTRAINTS,
    ],
  },
  "B-017": {
    measures: [
      {
        key: "기준_물스트레스_Baseline_Water_Stress_원값",
        label: "기준 물 스트레스(Baseline Water Stress) · 원값",
        unit: "비율(총 취수량 ÷ 가용 재생수자원)",
        direction: "높을수록 물 스트레스가 큼 · 0.1=10%",
        gradeKey: "기준_물스트레스_Baseline_Water_Stress_등급",
      },
      {
        key: "기준_물스트레스_Baseline_Water_Stress_점수_0_5",
        label: "기준 물 스트레스 · 점수(0~5)",
        unit: "점(0~5)",
        direction: "높을수록 물 스트레스가 큼",
        gradeKey: "기준_물스트레스_Baseline_Water_Stress_등급",
      },
      {
        key: "기준_물고갈_Baseline_Water_Depletion_원값",
        label: "기준 물 고갈(Baseline Water Depletion) · 원값",
        unit: "비율(소비적 이용 ÷ 가용 재생수자원)",
        direction: "높을수록 고갈 압력이 큼",
        gradeKey: "기준_물고갈_Baseline_Water_Depletion_등급",
      },
      {
        key: "기준_물고갈_Baseline_Water_Depletion_점수_0_5",
        label: "기준 물 고갈 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "기준_물고갈_Baseline_Water_Depletion_등급",
      },
      {
        key: "종합_물리스크_Overall_Water_Risk_기본가중_점수_0_5",
        label: "종합 물 리스크(Overall Water Risk, 기본 가중) · 점수(0~5)",
        unit: "점(0~5)",
        direction: "높을수록 리스크가 큼",
        gradeKey: "종합_물리스크_Overall_Water_Risk_기본가중_등급",
      },
      {
        key: "종합_물리스크_Overall_Water_Risk_기본가중_원값",
        label: "종합 물 리스크(기본 가중) · 원값",
        unit: "가중 평균 점수(0~5)",
        direction: "높을수록 리스크가 큼",
        gradeKey: "종합_물리스크_Overall_Water_Risk_기본가중_등급",
      },
      {
        key: "가뭄위험_Drought_Risk_원값",
        label: "가뭄 위험(Drought Risk) · 원값",
        unit: "지수(0~1)",
        direction: "높을수록 가뭄 위험이 큼",
        gradeKey: "가뭄위험_Drought_Risk_등급",
      },
      {
        key: "가뭄위험_Drought_Risk_점수_0_5",
        label: "가뭄 위험 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "가뭄위험_Drought_Risk_등급",
      },
      {
        key: "하천_홍수위험_Riverine_Flood_Risk_원값",
        label: "하천 홍수 위험(Riverine Flood Risk) · 원값",
        unit: "연간 홍수 피해 예상 인구 비율",
        direction: "높을수록 위험이 큼",
        gradeKey: "하천_홍수위험_Riverine_Flood_Risk_등급",
      },
      {
        key: "하천_홍수위험_Riverine_Flood_Risk_점수_0_5",
        label: "하천 홍수 위험 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "하천_홍수위험_Riverine_Flood_Risk_등급",
      },
      {
        key: "연안_홍수위험_Coastal_Flood_Risk_원값",
        label: "연안 홍수 위험(Coastal Flood Risk) · 원값",
        unit: "연간 홍수 피해 예상 인구 비율",
        direction: "높을수록 위험이 큼",
        gradeKey: "연안_홍수위험_Coastal_Flood_Risk_등급",
      },
      {
        key: "연안_홍수위험_Coastal_Flood_Risk_점수_0_5",
        label: "연안 홍수 위험 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "연안_홍수위험_Coastal_Flood_Risk_등급",
      },
      {
        key: "지하수위_하강_Groundwater_Table_Decline_원값",
        label: "지하수위 하강(Groundwater Table Decline) · 원값",
        unit: "cm/년",
        direction: "높을수록 하강 속도가 빠름",
        gradeKey: "지하수위_하강_Groundwater_Table_Decline_등급",
      },
      {
        key: "지하수위_하강_Groundwater_Table_Decline_점수_0_5",
        label: "지하수위 하강 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "지하수위_하강_Groundwater_Table_Decline_등급",
      },
      {
        key: "연간_변동성_Interannual_Variability_원값",
        label: "연간 변동성(Interannual Variability) · 원값",
        unit: "변동계수",
        direction: "높을수록 해마다 공급 변동이 큼",
        gradeKey: "연간_변동성_Interannual_Variability_등급",
      },
      {
        key: "연간_변동성_Interannual_Variability_점수_0_5",
        label: "연간 변동성 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "연간_변동성_Interannual_Variability_등급",
      },
      {
        key: "계절_변동성_Seasonal_Variability_원값",
        label: "계절 변동성(Seasonal Variability) · 원값",
        unit: "변동계수",
        direction: "높을수록 계절 간 공급 변동이 큼",
        gradeKey: "계절_변동성_Seasonal_Variability_등급",
      },
      {
        key: "계절_변동성_Seasonal_Variability_점수_0_5",
        label: "계절 변동성 · 점수(0~5)",
        unit: "점(0~5)",
        gradeKey: "계절_변동성_Seasonal_Variability_등급",
      },
    ],
    defaultMeasure: "기준_물스트레스_Baseline_Water_Stress_원값",
    rowUnit: {
      label: "평가구역",
      idKeys: ["레코드_키_string_id"],
      // string_id is `HydroBASINS pfaf_id - GADM GID_1 - aquifer aqid`; the
      // source writes None / -9999 where a zone has no basin or aquifer part.
      describe: (attributes) => {
        const code = (key: string) => {
          const value = String(attributes[key] ?? "").trim();
          return value && value !== "-9999" && value !== "None" ? value : "";
        };
        const basin = code("HydroBASINS_lvl6_코드_pfaf_id");
        const aquifer = code("대수층_코드_aqid");
        return `${basin ? `유역 ${basin}` : "유역 구분 없음"} · ${
          aquifer ? `대수층 ${aquifer}` : "대수층 없음"
        }`;
      },
    },
    periodLabel: "Aqueduct 4.0 기준선(2023년판)",
    constraints: [
      "값의 단위는 Aqueduct 4.0 평가구역(HydroBASINS 6단계 유역 × 성 × 대수층 교차 구역)이며, 각 구역은 소속 성·시로만 분류됩니다. 성·시 값으로 합치거나 평균하지 않습니다.",
      "원값은 원천의 실제 비율·지수이고, 점수(0~5)와 등급은 WRI가 원값을 구간으로 나눈 것입니다. 원값과 점수를 같은 축에 두지 않습니다.",
      "평가구역 경계 폴리곤은 원천 지오데이터베이스 파일에만 있어 이 플랫폼에 포함되지 않았고, 지도에는 연결하지 않았습니다.",
    ],
  },
  "B-029": {
    measures: MAP_TARGET_MEASURES.get("B-029") || [],
    defaultMeasure: "이탄지_면적_합계_km",
    constraints: [
      "성·시 단위로 제공된 산림 유형은 이탄지(Global Peatland Map 2022)뿐이며, 열대우림·맹그로브 등 다른 유형은 전국 계열로만 제공됩니다.",
    ],
  },
  "B-030": {
    measures: MAP_TARGET_MEASURES.get("B-030") || [],
    defaultMeasure: "이득_ha",
    // The rows carry 기간 = "2000–2020" and no year; the table used to read
    // "기준연도 미기재" under a 20-year cumulative value (V142).
    periodLabel: "2000–2020년 누적",
    constraints: [
      "이득·손실·순변화는 2000–2020년 20년 누적값입니다. 연간 증가량으로 읽지 않습니다.",
      "2000년 수관 면적과 분석대상 면적은 분모 정보이며 산림 변화량이 아닙니다.",
    ],
  },
  "B-037": {
    measures: MAP_TARGET_MEASURES.get("B-037") || [],
    defaultMeasure: "경작지_면적_km",
    constraints: [
      "같은 분류체계(ESA WorldCover 2021)의 배타적 항목이므로 합계_km 대비 구성비를 계산할 수 있습니다. 다른 연도·분류체계의 값과 직접 비교하지 않습니다.",
    ],
  },
  "B-039": {
    measures: MAP_TARGET_MEASURES.get("B-039") || [],
    defaultMeasure: "이론_총잠재량_GWh_yr",
    constraints: [
      "이론 잠재량(gross theoretical)이며 기술적·경제적 개발가능량이나 실제 발전설비 용량이 아닙니다.",
    ],
  },
  "B-040": {
    measures: MAP_TARGET_MEASURES.get("B-040") || [],
    defaultMeasure: "심도_2km_지온_평균",
    constraints: [
      "심도별 지온(°C)과 지온경사(°C/km)이며 확인 매장량이나 발전 잠재량이 아닙니다. 심도를 바꾸면 다른 지표입니다.",
    ],
  },
  "B-041": {
    measures: MAP_TARGET_MEASURES.get("B-041") || [],
    defaultMeasure: "수평면_전일사량_GHI_평균",
    periodLabel: "1999–2018년 장기평균",
    constraints: [
      "Global Solar Atlas 2.0의 1999–2018 장기평균을 성·시 격자 평균으로 집계한 값입니다. 지점별 일사량이 아닙니다.",
    ],
  },
  "B-042": {
    measures: MAP_TARGET_MEASURES.get("B-042") || [],
    defaultMeasure: "풍속_평균_m_s",
    periodLabel: "2008–2017년 장기평균 · 고도 100m",
    constraints: [
      "Global Wind Atlas 고도 100m 값(2008–2017 장기평균)입니다. 다른 고도의 풍속과 직접 비교하지 않습니다.",
    ],
  },
};

export function publicRegionScenarioContractV138(
  elementId: string
): RegionScenarioContractV138 | null {
  return CONTRACTS[elementId] || null;
}
