import type { VietnamDemoElement } from "../types/vietnamDemo";
import { sampleNumber } from "./dataPreviewV53";

export type DimensionViewKind =
  | "metric"
  | "scenario"
  | "sensitivity"
  | "budget_mix";

export interface DimensionMetric {
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface DimensionOption {
  value: string;
  label: string;
  metric?: DimensionMetric;
}

export interface DimensionSelector {
  key: string;
  label: string;
  options: DimensionOption[];
}

export interface DimensionDefinition {
  publicTitle: string;
  primaryLabel?: string;
  kind: DimensionViewKind;
  selectors: DimensionSelector[];
  metric: DimensionMetric;
  context?: { label: string; value: string }[];
  comparisonLabel?: string;
  trendLabel?: string;
  note: string;
}

const TECH_OPTIONS = [
  "태양광",
  "육상풍력",
  "해상풍력",
  "수력",
  "에너지저장",
  "에너지효율",
  "CCUS",
].map((label) => ({ value: label, label }));

const MINERAL_OPTIONS = [
  "리튬",
  "코발트",
  "니켈",
  "구리",
  "희토류",
  "망간",
].map((label) => ({ value: label, label }));

const SSP_OPTIONS = ["SSP1-2.6", "SSP2-4.5", "SSP3-7.0", "SSP5-8.5"].map(
  (label) => ({ value: label, label })
);

const DEFINITIONS: Record<string, DimensionDefinition> = {
  "A-017": {
    publicTitle: "기술별 균등화 발전비용(LCOE)",
    primaryLabel: "기술별 LCOE",
    kind: "metric",
    selectors: [{ key: "technology", label: "기술", options: TECH_OPTIONS }],
    metric: {
      label: "LCOE",
      unit: "USD/MWh",
      min: 35,
      max: 165,
      decimals: 1,
    },
    context: [
      { label: "비용 범위", value: "발전단가" },
      { label: "가격 기준", value: "실질가격 기준" },
    ],
    comparisonLabel: "선택 기술 LCOE 국가 비교",
    trendLabel: "선택 기술 LCOE 추세",
    note: "동일 기술·비용범위·가격연도 기준으로 비교",
  },

  "A-018": {
    publicTitle: "기술별 발전 설비용량",
    primaryLabel: "기술별 설비용량",
    kind: "metric",
    selectors: [
      {
        key: "technology",
        label: "기술",
        options: ["석탄", "가스", "수력", "태양광", "풍력", "기타"].map(
          (label) => ({ value: label, label })
        ),
      },
    ],
    metric: {
      label: "설비용량",
      unit: "MW",
      min: 250,
      max: 65000,
      decimals: 0,
    },
    context: [
      { label: "보조 지표", value: "전원별 비중" },
      { label: "자료 형태", value: "기술별 설치용량" },
    ],
    comparisonLabel: "선택 기술 설비용량 국가 비교",
    trendLabel: "선택 기술 설비용량 추세",
    note: "전원구성 전체와 선택 기술의 절대용량을 구분하여 제공",
  },

  "A-030": {
    publicTitle: "한국-대상국 교역 현황",
    primaryLabel: "교역 데이터",
    kind: "metric",
    selectors: [
      {
        key: "flow",
        label: "교역 구분",
        options: ["총 교역", "한국 수출", "한국 수입"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
    metric: {
      label: "교역액",
      unit: "USD M",
      min: 250,
      max: 45000,
      decimals: 1,
    },
    context: [
      { label: "상세", value: "주요 품목·HS 코드" },
      { label: "관계", value: "한국-대상국 양자교역" },
    ],
    comparisonLabel: "교역 구분별 국가 비교",
    trendLabel: "한국-대상국 교역 추세",
    note: "총교역·수출·수입을 혼합하지 않고 같은 흐름 기준으로 비교",
  },

  "B-004": {
    publicTitle: "기후변수 전망",
    primaryLabel: "기후 전망",
    kind: "scenario",
    selectors: [
      {
        key: "metric",
        label: "기후변수",
        options: [
          {
            value: "tas",
            label: "평균기온",
            metric: {
              label: "평균기온",
              unit: "°C",
              min: 20,
              max: 34,
              decimals: 1,
            },
          },
          {
            value: "tasmax",
            label: "최고기온",
            metric: {
              label: "최고기온",
              unit: "°C",
              min: 25,
              max: 42,
              decimals: 1,
            },
          },
          {
            value: "tasmin",
            label: "최저기온",
            metric: {
              label: "최저기온",
              unit: "°C",
              min: 10,
              max: 28,
              decimals: 1,
            },
          },
          {
            value: "pr",
            label: "강수량",
            metric: {
              label: "강수량",
              unit: "mm/yr",
              min: 600,
              max: 3500,
              decimals: 0,
            },
          },
          {
            value: "wind",
            label: "풍속",
            metric: { label: "풍속", unit: "m/s", min: 2, max: 9, decimals: 1 },
          },
          {
            value: "rsds",
            label: "일사량",
            metric: {
              label: "일사량",
              unit: "W/m²",
              min: 120,
              max: 280,
              decimals: 0,
            },
          },
          {
            value: "hurs",
            label: "상대습도",
            metric: {
              label: "상대습도",
              unit: "%",
              min: 45,
              max: 95,
              decimals: 1,
            },
          },
        ],
      },
      { key: "scenario", label: "시나리오", options: SSP_OPTIONS },
    ],
    metric: { label: "기후변수", unit: "", min: 0, max: 100, decimals: 1 },
    context: [{ label: "자료", value: "CMIP6" }],
    comparisonLabel: "선택 변수·시나리오 국가 비교",
    trendLabel: "미래 전망",
    note: "단위가 다른 기온·강수·풍속·일사·습도를 하나의 값으로 합치지 않음",
  },

  "B-005": {
    publicTitle: "가뭄 지표",
    primaryLabel: "가뭄 데이터",
    kind: "scenario",
    selectors: [
      {
        key: "metric",
        label: "가뭄 지표",
        options: [
          {
            value: "CDD",
            label: "연속 건조일수(CDD)",
            metric: {
              label: "CDD",
              unit: "일",
              min: 10,
              max: 180,
              decimals: 0,
            },
          },
          {
            value: "SPEI12",
            label: "SPEI12",
            metric: {
              label: "SPEI12",
              unit: "index",
              min: -2.5,
              max: 2.5,
              decimals: 2,
            },
          },
          {
            value: "soil",
            label: "토양수분",
            metric: {
              label: "토양수분",
              unit: "%",
              min: 8,
              max: 55,
              decimals: 1,
            },
          },
        ],
      },
      { key: "scenario", label: "시나리오", options: SSP_OPTIONS },
    ],
    metric: { label: "가뭄 지표", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "선택 가뭄지표 국가 비교",
    trendLabel: "가뭄지표 전망",
    note: "CDD·SPEI12·토양수분은 단위와 해석이 달라 지표별로 조회",
  },

  "B-008": {
    publicTitle: "해수면 상승 전망",
    primaryLabel: "해수면 전망",
    kind: "scenario",
    selectors: [
      { key: "scenario", label: "SSP 시나리오", options: SSP_OPTIONS },
    ],
    metric: {
      label: "해수면 상승",
      unit: "m",
      min: 0.05,
      max: 1.15,
      decimals: 2,
    },
    context: [{ label: "전망시점", value: "2030·2050·2100" }],
    comparisonLabel: "선택 시나리오 국가 비교",
    trendLabel: "해수면 상승 전망",
    note: "SSP별 중앙값과 불확실성 범위를 구분하여 제공",
  },

  "B-013": {
    publicTitle: "CBAM 산업·품목 노출도",
    primaryLabel: "CBAM 노출",
    kind: "metric",
    selectors: [
      {
        key: "sector",
        label: "산업·품목",
        options: ["철강", "알루미늄", "시멘트", "비료", "수소", "전력"].map(
          (label) => ({ value: label, label })
        ),
      },
    ],
    metric: {
      label: "CBAM 노출지수",
      unit: "index",
      min: 0,
      max: 100,
      decimals: 1,
    },
    context: [
      { label: "보조 지표", value: "대EU 수출액" },
      { label: "범위", value: "CBAM 대상품목" },
    ],
    comparisonLabel: "선택 산업 CBAM 노출도 국가 비교",
    trendLabel: "CBAM 노출 변화",
    note: "산업별 노출도를 분리해 비교",
  },

  "B-014": {
    publicTitle: "탄소가격 시나리오의 경제·배출 영향",
    primaryLabel: "탄소가격 영향",
    kind: "sensitivity",
    selectors: [
      {
        key: "metric",
        label: "영향 지표",
        options: [
          {
            value: "emission",
            label: "배출감소율",
            metric: {
              label: "배출감소율",
              unit: "%",
              min: 0,
              max: 45,
              decimals: 1,
            },
          },
          {
            value: "gdp",
            label: "GDP 영향",
            metric: {
              label: "GDP 영향",
              unit: "%",
              min: -5,
              max: 2,
              decimals: 2,
            },
          },
          {
            value: "revenue",
            label: "세수 효과",
            metric: {
              label: "세수 효과",
              unit: "USD M",
              min: 50,
              max: 6500,
              decimals: 0,
            },
          },
        ],
      },
      {
        key: "price",
        label: "탄소가격",
        options: [
          "USD 10/tCO₂",
          "USD 25/tCO₂",
          "USD 50/tCO₂",
          "USD 100/tCO₂",
        ].map((label) => ({ value: label, label })),
      },
    ],
    metric: { label: "영향", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 탄소가격 국가 비교",
    trendLabel: "탄소가격 민감도",
    note: "배출·GDP·세수는 단위가 달라 출력지표를 선택해 해석",
  },

  "B-018": {
    publicTitle: "SSP 경제 전망",
    primaryLabel: "경제 전망",
    kind: "scenario",
    selectors: [
      {
        key: "metric",
        label: "경제 지표",
        options: [
          {
            value: "GDP",
            label: "GDP(PPP)",
            metric: {
              label: "GDP(PPP)",
              unit: "USD B",
              min: 50,
              max: 12000,
              decimals: 1,
            },
          },
          {
            value: "pc",
            label: "1인당 GDP(PPP)",
            metric: {
              label: "1인당 GDP(PPP)",
              unit: "USD/person",
              min: 1500,
              max: 75000,
              decimals: 0,
            },
          },
        ],
      },
      { key: "scenario", label: "SSP 시나리오", options: SSP_OPTIONS },
    ],
    metric: { label: "경제 전망", unit: "", min: 0, max: 100, decimals: 1 },
    context: [{ label: "전망시점", value: "2030·2050·2100" }],
    comparisonLabel: "동일 SSP·지표 국가 비교",
    trendLabel: "SSP 경제 전망",
    note: "GDP 총량과 1인당 GDP를 분리하여 조회",
  },

  "B-019": {
    publicTitle: "SSP 인구 전망",
    primaryLabel: "인구 전망",
    kind: "scenario",
    selectors: [
      { key: "scenario", label: "SSP 시나리오", options: SSP_OPTIONS },
    ],
    metric: {
      label: "인구",
      unit: "백만 명",
      min: 2,
      max: 1650,
      decimals: 1,
    },
    context: [{ label: "전망시점", value: "2030·2050·2100" }],
    comparisonLabel: "동일 SSP 국가 비교",
    trendLabel: "SSP 인구 전망",
    note: "시나리오별 인구 전망을 분리하여 조회",
  },

  "B-044": {
    publicTitle: "핵심광물 현황",
    primaryLabel: "광물별 현황",
    kind: "metric",
    selectors: [{ key: "mineral", label: "광물", options: MINERAL_OPTIONS }],
    metric: {
      label: "확인 지표",
      unit: "index",
      min: 10,
      max: 100,
      decimals: 1,
    },
    context: [{ label: "후속 데이터", value: "순위·매장량·생산량·광산" }],
    comparisonLabel: "선택 광물 국가 비교",
    trendLabel: "선택 광물 현황",
    note: "광물별 데이터는 리튬·코발트·니켈 등 광물을 먼저 선택",
  },

  "B-045": {
    publicTitle: "핵심광물 글로벌 순위",
    primaryLabel: "광물별 순위",
    kind: "metric",
    selectors: [{ key: "mineral", label: "광물", options: MINERAL_OPTIONS }],
    metric: {
      label: "글로벌 순위",
      unit: "위",
      min: 1,
      max: 60,
      decimals: 0,
    },
    comparisonLabel: "선택 광물 국가 순위 비교",
    trendLabel: "순위 변화",
    note: "광물별 생산·매장 기준과 순위 정의를 함께 표시",
  },

  "B-046": {
    publicTitle: "핵심광물 매장량",
    primaryLabel: "광물별 매장량",
    kind: "metric",
    selectors: [
      { key: "mineral", label: "광물", options: MINERAL_OPTIONS },
      {
        key: "reserveType",
        label: "매장량 구분",
        options: ["확인 매장량", "추정 매장량"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
    metric: {
      label: "매장량",
      unit: "tonnes",
      min: 5000,
      max: 85000000,
      decimals: 0,
    },
    comparisonLabel: "선택 광물 매장량 국가 비교",
    trendLabel: "매장량 변화",
    note: "광물·매장량 구분별로 단위와 기준연도를 함께 제공",
  },

  "B-047": {
    publicTitle: "핵심광물 연간 생산량",
    primaryLabel: "광물별 생산량",
    kind: "metric",
    selectors: [{ key: "mineral", label: "광물", options: MINERAL_OPTIONS }],
    metric: {
      label: "연간 생산량",
      unit: "tonnes/yr",
      min: 200,
      max: 6500000,
      decimals: 0,
    },
    context: [{ label: "보조 지표", value: "글로벌 생산 비중" }],
    comparisonLabel: "선택 광물 생산량 국가 비교",
    trendLabel: "생산량 추세",
    note: "광물별 생산량과 세계 생산비중을 함께 제공",
  },

  "C-018": {
    publicTitle: "중장기 에너지·전력 전망",
    primaryLabel: "에너지 전망",
    kind: "scenario",
    selectors: [
      {
        key: "metric",
        label: "전망 지표",
        options: [
          {
            value: "demand",
            label: "전력수요",
            metric: {
              label: "전력수요",
              unit: "TWh",
              min: 15,
              max: 5500,
              decimals: 1,
            },
          },
          {
            value: "capacity",
            label: "설비계획",
            metric: {
              label: "설비계획",
              unit: "MW",
              min: 500,
              max: 250000,
              decimals: 0,
            },
          },
          {
            value: "re",
            label: "재생에너지 비중",
            metric: {
              label: "재생에너지 비중",
              unit: "%",
              min: 5,
              max: 95,
              decimals: 1,
            },
          },
          {
            value: "growth",
            label: "수요성장률",
            metric: {
              label: "수요성장률",
              unit: "%/yr",
              min: -1,
              max: 12,
              decimals: 1,
            },
          },
        ],
      },
      {
        key: "scenario",
        label: "전망 시나리오",
        options: ["정부 기준", "가속 전환", "넷제로"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
    metric: { label: "전망", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 전망지표 국가 비교",
    trendLabel: "중장기 전망",
    note: "수요·설비·비중·성장률은 단위가 달라 지표를 선택해 조회",
  },

  "C-023": {
    publicTitle: "기술·조치별 한계저감비용(MAC)",
    primaryLabel: "MAC 데이터",
    kind: "metric",
    selectors: [
      { key: "technology", label: "기술·조치", options: TECH_OPTIONS },
    ],
    metric: {
      label: "MAC",
      unit: "USD/tCO₂e",
      min: -80,
      max: 260,
      decimals: 1,
    },
    context: [{ label: "보조 지표", value: "감축잠재량·가정" }],
    comparisonLabel: "선택 기술 MAC 국가 비교",
    trendLabel: "MAC 변화",
    note: "기술·조치별 비용과 감축잠재량을 함께 확인",
  },

  "D-001": {
    publicTitle: "기술별 단위 CAPEX",
    primaryLabel: "CAPEX 데이터",
    kind: "metric",
    selectors: [
      { key: "technology", label: "기후기술", options: TECH_OPTIONS },
    ],
    metric: {
      label: "CAPEX",
      unit: "USD/kW",
      min: 350,
      max: 4200,
      decimals: 0,
    },
    context: [
      { label: "비용 범위", value: "설비·EPC 기준" },
      { label: "가격 기준", value: "2025 USD" },
    ],
    comparisonLabel: "선택 기술 CAPEX 국가 비교",
    trendLabel: "선택 기술 CAPEX 추세",
    note: "기술별로 비용 단위·포함범위·가격연도를 맞춰 비교",
  },

  "D-002": {
    publicTitle: "기후기술 시장 규모·성장률",
    primaryLabel: "시장 데이터",
    kind: "metric",
    selectors: [
      { key: "technology", label: "기후기술", options: TECH_OPTIONS },
      {
        key: "metric",
        label: "시장 지표",
        options: [
          {
            value: "size",
            label: "시장규모",
            metric: {
              label: "시장규모",
              unit: "USD M",
              min: 50,
              max: 25000,
              decimals: 1,
            },
          },
          {
            value: "growth",
            label: "성장률",
            metric: {
              label: "성장률",
              unit: "%/yr",
              min: -2,
              max: 28,
              decimals: 1,
            },
          },
        ],
      },
    ],
    metric: { label: "시장", unit: "", min: 0, max: 100, decimals: 1 },
    context: [{ label: "기간", value: "실적·전망 구분" }],
    comparisonLabel: "선택 기술 시장 국가 비교",
    trendLabel: "시장 추세",
    note: "시장규모와 성장률을 같은 숫자축으로 혼합하지 않음",
  },

  "D-003": {
    publicTitle: "기술별 예상 온실가스 감축량",
    primaryLabel: "감축량 데이터",
    kind: "metric",
    selectors: [
      { key: "technology", label: "기후기술", options: TECH_OPTIONS },
    ],
    metric: {
      label: "연간 예상 감축량",
      unit: "tCO₂e/yr",
      min: 1000,
      max: 5500000,
      decimals: 0,
    },
    context: [
      { label: "기준", value: "단위사업" },
      { label: "필수 확인", value: "기준선·사업기간" },
    ],
    comparisonLabel: "선택 기술 감축량 국가 비교",
    trendLabel: "예상 감축량 변화",
    note: "기술·사업규모·기준선이 같을 때만 감축량을 비교",
  },

  "D-004": {
    publicTitle: "탄소크레딧 가격별 사업 수익성",
    primaryLabel: "수익성 데이터",
    kind: "sensitivity",
    selectors: [
      { key: "technology", label: "기후기술", options: TECH_OPTIONS },
      {
        key: "price",
        label: "크레딧 가격",
        options: [
          "USD 5/tCO₂e",
          "USD 10/tCO₂e",
          "USD 20/tCO₂e",
          "USD 30/tCO₂e",
          "USD 50/tCO₂e",
        ].map((label) => ({ value: label, label })),
      },
    ],
    metric: {
      label: "예상 크레딧 수익",
      unit: "USD M",
      min: 0.1,
      max: 85,
      decimals: 1,
    },
    context: [{ label: "보조 지표", value: "발행가능량·손익분기" }],
    comparisonLabel: "동일 가격·기술 국가 비교",
    trendLabel: "가격 민감도",
    note: "크레딧 가격을 변경해 예상수익과 손익분기 변화를 확인",
  },

  "D-005": {
    publicTitle: "감축·적응별 기후예산 배분",
    primaryLabel: "예산 구성",
    kind: "budget_mix",
    selectors: [
      {
        key: "budgetType",
        label: "비교 구분",
        options: ["전체 구성", "감축", "적응", "교차·기타"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
    metric: {
      label: "기후예산",
      unit: "USD M",
      min: 25,
      max: 9500,
      decimals: 1,
    },
    comparisonLabel: "선택 구분 국가 비교",
    trendLabel: "예산 배분 추세",
    note: "감축·적응·교차/기타의 금액과 비중을 분리하여 제공",
  },

  "D-006": {
    publicTitle: "기후 관련 조세수입",
    primaryLabel: "조세수입",
    kind: "metric",
    selectors: [
      {
        key: "taxType",
        label: "조세 유형",
        options: ["탄소세", "연료세", "에너지세", "차량·기타 환경세"].map(
          (label) => ({ value: label, label })
        ),
      },
    ],
    metric: {
      label: "조세수입",
      unit: "USD M",
      min: 5,
      max: 8500,
      decimals: 1,
    },
    context: [{ label: "함께 확인", value: "세율·용도·총세수 대비" }],
    comparisonLabel: "선택 조세 국가 비교",
    trendLabel: "조세수입 추세",
    note: "조세유형별 수입규모와 세율·용도를 분리하여 제공",
  },

  "D-008": {
    publicTitle: "부처별 기후예산",
    primaryLabel: "부처별 예산",
    kind: "metric",
    selectors: [
      {
        key: "ministry",
        label: "주관 부처",
        options: ["환경부", "에너지부", "농업부", "교통부", "재무부"].map(
          (label) => ({ value: label, label })
        ),
      },
      {
        key: "budgetType",
        label: "기후 구분",
        options: ["전체", "감축", "적응", "교차"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
    metric: {
      label: "기후예산",
      unit: "USD M",
      min: 5,
      max: 5500,
      decimals: 1,
    },
    context: [{ label: "보조 지표", value: "부처 총예산 대비 비중" }],
    comparisonLabel: "동일 부처·구분 국가 비교",
    trendLabel: "부처 기후예산 추세",
    note: "부처와 감축·적응 구분을 동시에 선택해 조회",
  },

  "D-009": {
    publicTitle: "총 기후지출",
    primaryLabel: "기후지출 데이터",
    kind: "metric",
    selectors: [
      {
        key: "metric",
        label: "지출 지표",
        options: [
          {
            value: "total",
            label: "총 기후지출",
            metric: {
              label: "총 기후지출",
              unit: "USD M",
              min: 25,
              max: 12000,
              decimals: 1,
            },
          },
          {
            value: "gdp",
            label: "GDP 대비",
            metric: {
              label: "GDP 대비 기후지출",
              unit: "% GDP",
              min: 0.1,
              max: 7.5,
              decimals: 2,
            },
          },
          {
            value: "budget",
            label: "정부예산 대비",
            metric: {
              label: "예산 대비 비중",
              unit: "%",
              min: 0.5,
              max: 25,
              decimals: 1,
            },
          },
          {
            value: "execution",
            label: "집행률",
            metric: {
              label: "집행률",
              unit: "%",
              min: 45,
              max: 100,
              decimals: 1,
            },
          },
        ],
      },
    ],
    metric: { label: "기후지출", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 지출지표 국가 비교",
    trendLabel: "기후지출 추세",
    note: "금액·GDP비중·예산비중·집행률의 단위를 분리해 조회",
  },

  "D-010": {
    publicTitle: "화석연료 보조금",
    primaryLabel: "보조금 데이터",
    kind: "metric",
    selectors: [
      {
        key: "fuel",
        label: "에너지원",
        options: ["석탄", "석유", "가스", "전력", "전체"].map((label) => ({
          value: label,
          label,
        })),
      },
      {
        key: "metric",
        label: "지표",
        options: [
          {
            value: "amount",
            label: "보조금 규모",
            metric: {
              label: "보조금 규모",
              unit: "USD M",
              min: 25,
              max: 30000,
              decimals: 1,
            },
          },
          {
            value: "gdp",
            label: "GDP 대비",
            metric: {
              label: "GDP 대비 보조금",
              unit: "% GDP",
              min: 0.05,
              max: 8,
              decimals: 2,
            },
          },
        ],
      },
    ],
    metric: { label: "보조금", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 에너지원 국가 비교",
    trendLabel: "보조금 추세",
    note: "에너지원별 보조금과 GDP 대비 비중을 구분하여 제공",
  },

  "E-009": {
    publicTitle: "STEM 인력·연구자 현황",
    primaryLabel: "인력 데이터",
    kind: "metric",
    selectors: [
      {
        key: "metric",
        label: "인력 지표",
        options: [
          {
            value: "graduates",
            label: "STEM 졸업자",
            metric: {
              label: "STEM 졸업자",
              unit: "명/yr",
              min: 10000,
              max: 3500000,
              decimals: 0,
            },
          },
          {
            value: "researchers",
            label: "연구자",
            metric: {
              label: "연구자",
              unit: "명",
              min: 5000,
              max: 2500000,
              decimals: 0,
            },
          },
          {
            value: "density",
            label: "인구·취업자 대비",
            metric: {
              label: "인력 밀도",
              unit: "명/백만명",
              min: 100,
              max: 9000,
              decimals: 0,
            },
          },
        ],
      },
    ],
    metric: { label: "STEM 인력", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 인력지표 국가 비교",
    trendLabel: "STEM 인력 추세",
    note: "졸업자·연구자·밀도는 단위가 달라 개별 지표로 조회",
  },

  "E-010": {
    publicTitle: "R&D 투자·혁신역량",
    primaryLabel: "R&D·혁신 데이터",
    kind: "metric",
    selectors: [
      {
        key: "metric",
        label: "지표",
        options: [
          {
            value: "gerd",
            label: "R&D 지출",
            metric: {
              label: "R&D 지출",
              unit: "USD M",
              min: 50,
              max: 250000,
              decimals: 1,
            },
          },
          {
            value: "gdp",
            label: "GDP 대비 R&D",
            metric: {
              label: "GDP 대비 R&D",
              unit: "% GDP",
              min: 0.05,
              max: 5.5,
              decimals: 2,
            },
          },
          {
            value: "gii",
            label: "GII 점수",
            metric: {
              label: "GII 점수",
              unit: "점",
              min: 15,
              max: 75,
              decimals: 1,
            },
          },
          {
            value: "rank",
            label: "GII 순위",
            metric: {
              label: "GII 순위",
              unit: "위",
              min: 1,
              max: 140,
              decimals: 0,
            },
          },
        ],
      },
    ],
    metric: { label: "R&D·혁신", unit: "", min: 0, max: 100, decimals: 1 },
    comparisonLabel: "동일 혁신지표 국가 비교",
    trendLabel: "R&D·혁신 추세",
    note: "R&D 금액·GDP비중·GII 점수·순위를 같은 축에 혼합하지 않음",
  },

  "E-012": {
    publicTitle: "기후·에너지 직군 인력·임금",
    primaryLabel: "직군 데이터",
    kind: "metric",
    selectors: [
      {
        key: "occupation",
        label: "직군",
        options: [
          "전기기술자",
          "재생에너지 엔지니어",
          "환경기술자",
          "용접·정비",
          "데이터·제어",
        ].map((label) => ({ value: label, label })),
      },
      {
        key: "metric",
        label: "인력 지표",
        options: [
          {
            value: "employment",
            label: "종사자 수",
            metric: {
              label: "종사자 수",
              unit: "명",
              min: 1000,
              max: 1800000,
              decimals: 0,
            },
          },
          {
            value: "wage",
            label: "월 임금",
            metric: {
              label: "월 임금",
              unit: "USD/month",
              min: 150,
              max: 4500,
              decimals: 0,
            },
          },
        ],
      },
    ],
    metric: { label: "직군", unit: "", min: 0, max: 100, decimals: 1 },
    context: [{ label: "추가 차원", value: "지역·기간" }],
    comparisonLabel: "동일 직군·지표 국가 비교",
    trendLabel: "직군 인력·임금 추세",
    note: "직군과 종사자 수·임금을 각각 선택하여 비교",
  },
};

export function getDimensionDefinitionV68(
  elementId: string
): DimensionDefinition | null {
  return DEFINITIONS[elementId] ?? null;
}

export function isDimensionAwareElementV68(
  element: VietnamDemoElement
): boolean {
  return Boolean(DEFINITIONS[element.elementId]);
}

export function getDimensionPublicTitleV68(elementId: string): string | null {
  return DEFINITIONS[elementId]?.publicTitle ?? null;
}

export function getDimensionPrimaryLabelV68(elementId: string): string | null {
  return DEFINITIONS[elementId]?.primaryLabel ?? null;
}

export function getDefaultDimensionValuesV68(
  elementId: string
): Record<string, string> {
  const definition = DEFINITIONS[elementId];
  if (!definition) return {};

  return Object.fromEntries(
    definition.selectors.map((selector) => [
      selector.key,
      selector.options[0]?.value ?? "",
    ])
  );
}

export function getSelectedDimensionMetricV68(
  definition: DimensionDefinition,
  values: Record<string, string>
): DimensionMetric {
  for (const selector of definition.selectors) {
    const selected = selector.options.find(
      (option) => option.value === values[selector.key]
    );
    if (selected?.metric) return selected.metric;
  }

  return definition.metric;
}

export function getDimensionSelectionLabelV68(
  definition: DimensionDefinition,
  values: Record<string, string>
): string {
  return definition.selectors
    .map((selector) => {
      const selected = selector.options.find(
        (option) => option.value === values[selector.key]
      );
      return selected?.label ?? values[selector.key] ?? "";
    })
    .filter(Boolean)
    .join(" · ");
}

export function sampleDimensionValueV68({
  elementId,
  countryIso3,
  year,
  metric,
  values,
  salt = "value",
}: {
  elementId: string;
  countryIso3: string;
  year: number;
  metric: DimensionMetric;
  values: Record<string, string>;
  salt?: string;
}): number {
  const dimensionKey = Object.entries(values)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return sampleNumber(
    `${elementId}:${countryIso3}:${year}:${dimensionKey}:${salt}`,
    metric.min,
    metric.max
  );
}

export function formatDimensionValueV68(
  value: number,
  metric: DimensionMetric
): string {
  const decimals = metric.decimals ?? 1;
  const formatted = value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${metric.prefix ?? ""}${formatted}${
    metric.unit ? ` ${metric.unit}` : metric.suffix ?? ""
  }`.trim();
}
