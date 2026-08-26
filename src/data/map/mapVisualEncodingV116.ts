import type { EncodingRoleV116 } from "./mapElementDecisionV116";

export type ClassificationMethodV116 =
  | "none"
  | "fixed"
  | "fixed-0-100"
  | "quantile"
  | "equal-interval"
  | "domain-threshold";

export interface MapLegendItemV116 {
  label: string;
  meaning: string;
}

export interface MapVisualEncodingV116 {
  layerId: string;
  elementId: string;
  dataMeaning: string;
  encodingRole: EncodingRoleV116;
  colorMeaning: string;
  sizeMeaning: string;
  shapeMeaning: string;
  borderMeaning: string;
  opacityMeaning: string;
  lineMeaning: string;
  classification: {
    method: ClassificationMethodV116;
    breaks: number[];
    reason: string;
  };
  legendTitle: string;
  legendItems: MapLegendItemV116[];
  zeroTreatment: string;
  noDataTreatment: string;
  syntheticTreatment: string;
  hoverTemplate: string;
  clickAction: string;
  zIndex: number;
}

export const CHOROPLETH_PALETTE_V116 = [
  "#eef3f2",
  "#cfe1dd",
  "#9fc7bd",
  "#5e9e8d",
  "#1f6f5e",
] as const;

export const NO_DATA_COLOR_V116 = "#d7dcda";
export const SELECTED_OUTLINE_COLOR_V116 = "#102f29";

export const POLICY_CURRENTNESS_COLORS_V116 = {
  reconfirmed: "#18794e",
  partial: "#c77c11",
  historical: "#7b8794",
  caution: "#8c3b5d",
  none: "#9aa5a1",
} as const;

export const SUPPORT_SYMBOLS_V116 = {
  "D-019": {
    symbol: "⬢",
    shortLabel: "CTCN",
    color: "#0f7f80",
    offset: [-1.45, -1.3] as [number, number],
  },
  "D-020": {
    symbol: "●",
    shortLabel: "GCF",
    color: "#62508f",
    offset: [1.45, -1.3] as [number, number],
  },
  "D-018": {
    symbol: "▲",
    shortLabel: "Adaptation Fund",
    color: "#b96f19",
    offset: [-1.45, 1.25] as [number, number],
  },
  "D-021": {
    symbol: "◆",
    shortLabel: "World Bank·ADB",
    color: "#765039",
    offset: [1.45, 1.25] as [number, number],
  },
  "D-023": {
    symbol: "■",
    shortLabel: "GEF",
    color: "#3f795d",
    offset: [0, 2.2] as [number, number],
  },
} as const;

export const MAP_VISUAL_ENCODINGS_V116: MapVisualEncodingV116[] = [
  {
    layerId: "v116-element-a-001",
    elementId: "A-001",
    dataMeaning: "부패인식지수(CPI)",
    encodingRole: "base",
    colorMeaning: "부패인식지수(CPI)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "부패인식지수(CPI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-002",
    elementId: "A-002",
    dataMeaning: "CPIA 국가 정책·제도 역량",
    encodingRole: "base",
    colorMeaning: "CPIA 국가 정책·제도 역량의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "CPIA 국가 정책·제도 역량",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-003",
    elementId: "A-003",
    dataMeaning: "GDP·성장·1인당소득",
    encodingRole: "base",
    colorMeaning: "GDP·성장·1인당소득의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "GDP·성장·1인당소득",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-004",
    elementId: "A-004",
    dataMeaning: "빈곤율/극빈곤율",
    encodingRole: "base",
    colorMeaning: "빈곤율/극빈곤율의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "빈곤율/극빈곤율",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-005",
    elementId: "A-005",
    dataMeaning: "산업구조 (농업/제조/서비스 비중)",
    encodingRole: "base",
    colorMeaning: "산업구조 (농업/제조/서비스 비중)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "산업구조 (농업/제조/서비스 비중)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-006",
    elementId: "A-006",
    dataMeaning: "실업률/청년실업률",
    encodingRole: "base",
    colorMeaning: "실업률/청년실업률의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "실업률/청년실업률",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-007",
    elementId: "A-007",
    dataMeaning: "인구 (총인구, 도시화율)",
    encodingRole: "base",
    colorMeaning: "인구 (총인구, 도시화율)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "인구 (총인구, 도시화율)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-008",
    elementId: "A-008",
    dataMeaning: "지니계수",
    encodingRole: "base",
    colorMeaning: "지니계수의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "지니계수",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-009",
    elementId: "A-009",
    dataMeaning: "GHG 배출 강도 (GDP 대비, 1인당)",
    encodingRole: "base",
    colorMeaning: "GHG 배출 강도 (GDP 대비, 1인당)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "GHG 배출 강도 (GDP 대비, 1인당)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-010",
    elementId: "A-010",
    dataMeaning: "가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas)",
    encodingRole: "base",
    colorMeaning: "가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-011",
    elementId: "A-011",
    dataMeaning: "부문별 GHG 배출량 (에너지/산업공정/농업/폐기물)",
    encodingRole: "base",
    colorMeaning:
      "부문별 GHG 배출량 (에너지/산업공정/농업/폐기물)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "부문별 GHG 배출량 (에너지/산업공정/농업/폐기물)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-012",
    elementId: "A-012",
    dataMeaning: "총 GHG 배출량 (LULUCF 제외)",
    encodingRole: "base",
    colorMeaning: "총 GHG 배출량 (LULUCF 제외)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "총 GHG 배출량 (LULUCF 제외)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-013",
    elementId: "A-013",
    dataMeaning: "Climate Watch NDC-SDG linkage",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "Climate Watch NDC-SDG linkage",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-a-014",
    elementId: "A-014",
    dataMeaning: "UNDESA SDG Index Score",
    encodingRole: "base",
    colorMeaning: "UNDESA SDG Index Score의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "UNDESA SDG Index Score",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-015",
    elementId: "A-015",
    dataMeaning: "UNDESA SDG 세부목표별 달성도",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "UNDESA SDG 세부목표별 달성도",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-a-016",
    elementId: "A-016",
    dataMeaning: "1차 에너지 소비 구조",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "1차 에너지 소비 구조",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-a-017",
    elementId: "A-017",
    dataMeaning: "LCOE (균등화 발전비용)",
    encodingRole: "base",
    colorMeaning: "LCOE (균등화 발전비용)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "LCOE (균등화 발전비용)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-018",
    elementId: "A-018",
    dataMeaning: "기술별 발전 설비용량",
    encodingRole: "base",
    colorMeaning: "기술별 발전 설비용량의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기술별 발전 설비용량",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-019",
    elementId: "A-019",
    dataMeaning: "송배전 손실률 (T&D Loss)",
    encodingRole: "base",
    colorMeaning: "송배전 손실률 (T&D Loss)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed",
      breaks: [0, 5, 10, 15, 25, 100],
      reason: "송배전 손실률은 저손실과 고손실 구간을 구분하는 고정범위 사용",
    },
    legendTitle: "송배전 손실률 (T&D Loss)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-020",
    elementId: "A-020",
    dataMeaning: "재생에너지 비중",
    encodingRole: "base",
    colorMeaning: "재생에너지 비중의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed",
      breaks: [0, 10, 25, 50, 75, 100],
      reason: "재생에너지 비중은 0~100% 범위의 해석 가능한 고정구간 사용",
    },
    legendTitle: "재생에너지 비중",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-021",
    elementId: "A-021",
    dataMeaning: "전력 접근률",
    encodingRole: "base",
    colorMeaning: "전력 접근률의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed",
      breaks: [0, 40, 70, 90, 100],
      reason: "전력 접근률은 0~100% 고정 범위를 사용",
    },
    legendTitle: "전력 접근률",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-022",
    elementId: "A-022",
    dataMeaning: "정전빈도 (SAIDI/SAIFI)",
    encodingRole: "base",
    colorMeaning: "정전빈도 (SAIDI/SAIFI)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "정전빈도 (SAIDI/SAIFI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-023",
    elementId: "A-023",
    dataMeaning: "발전소 위치·용량",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "발전소 위치·용량",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-a-024",
    elementId: "A-024",
    dataMeaning: "전력망 위치·미공급 지역",
    encodingRole: "base",
    colorMeaning: "전력망 위치·미공급 지역의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "전력망 위치·미공급 지역",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-025",
    elementId: "A-025",
    dataMeaning: "CCS 시설",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "CCS 시설",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-a-026",
    elementId: "A-026",
    dataMeaning: "건물 풋프린트(Footprint)",
    encodingRole: "base",
    colorMeaning: "건물 풋프린트(Footprint)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "건물 풋프린트(Footprint)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-027",
    elementId: "A-027",
    dataMeaning: "교통 인프라(railway O, road)",
    encodingRole: "base",
    colorMeaning: "교통 인프라(railway O, road)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "교통 인프라(railway O, road)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-028",
    elementId: "A-028",
    dataMeaning: "해안·수자원 인프라",
    encodingRole: "base",
    colorMeaning: "해안·수자원 인프라의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "해안·수자원 인프라",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-029",
    elementId: "A-029",
    dataMeaning: "FTA 체결 현황",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "FTA 체결 현황",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-a-030",
    elementId: "A-030",
    dataMeaning: "한-개도국 교역액",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "한-개도국 교역액",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-a-031",
    elementId: "A-031",
    dataMeaning: "물류성과지수 (LPI)",
    encodingRole: "base",
    colorMeaning: "물류성과지수 (LPI)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "물류성과지수 (LPI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-a-032",
    elementId: "A-032",
    dataMeaning: "중간재 교역 규모",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "중간재 교역 규모",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-a-033",
    elementId: "A-033",
    dataMeaning: "해운 연결성 (LSCI)",
    encodingRole: "base",
    colorMeaning: "해운 연결성 (LSCI)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "해운 연결성 (LSCI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-001",
    elementId: "B-001",
    dataMeaning: "건기/우기",
    encodingRole: "base",
    colorMeaning: "건기/우기의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "건기/우기",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-002",
    elementId: "B-002",
    dataMeaning: "기후대(Climate zone),",
    encodingRole: "base",
    colorMeaning: "기후대(Climate zone),의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기후대(Climate zone),",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-003",
    elementId: "B-003",
    dataMeaning: "연평균 기온·강수",
    encodingRole: "base",
    colorMeaning: "연평균 기온·강수의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "연평균 기온·강수",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-004",
    elementId: "B-004",
    dataMeaning:
      "CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs)",
    encodingRole: "base",
    colorMeaning:
      "CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle:
      "CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-005",
    elementId: "B-005",
    dataMeaning: "가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분",
    encodingRole: "base",
    colorMeaning:
      "가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-006",
    elementId: "B-006",
    dataMeaning:
      "폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35))",
    encodingRole: "base",
    colorMeaning:
      "폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35))의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle:
      "폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35))",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-007",
    elementId: "B-007",
    dataMeaning:
      "홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD))",
    encodingRole: "base",
    colorMeaning:
      "홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD))의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle:
      "홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD))",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-008",
    elementId: "B-008",
    dataMeaning: "NASA 해수면 상승 전망 (SSP 1~5)",
    encodingRole: "base",
    colorMeaning: "NASA 해수면 상승 전망 (SSP 1~5)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "NASA 해수면 상승 전망 (SSP 1~5)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-009",
    elementId: "B-009",
    dataMeaning: "WWF 생물다양성·기후 리스크",
    encodingRole: "base",
    colorMeaning: "WWF 생물다양성·기후 리스크의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "WWF 생물다양성·기후 리스크",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-010",
    elementId: "B-010",
    dataMeaning: "기후 리스크 지수 (CRI)",
    encodingRole: "base",
    colorMeaning: "기후 리스크 지수 (CRI)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기후 리스크 지수 (CRI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-011",
    elementId: "B-011",
    dataMeaning: "기후 취약성 지수 (ND-GAIN)",
    encodingRole: "base",
    colorMeaning: "기후 취약성 지수 (ND-GAIN)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기후 취약성 지수 (ND-GAIN)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-012",
    elementId: "B-012",
    dataMeaning: "재해·재난 이력 (EM-DAT)",
    encodingRole: "base",
    colorMeaning: "재해·재난 이력 (EM-DAT)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "재해·재난 이력 (EM-DAT)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-013",
    elementId: "B-013",
    dataMeaning: "World Bank CBAM 영향 지수",
    encodingRole: "base",
    colorMeaning: "World Bank CBAM 영향 지수의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "World Bank CBAM 영향 지수",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-014",
    elementId: "B-014",
    dataMeaning: "World Bank CCDR(Country Climate and Development) 내 \\\\\\\\",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "World Bank CCDR(Country Climate and Development) 내 \\\\\\\\",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-b-015",
    elementId: "B-015",
    dataMeaning: "탄소 가격 수준 (ETS, Carbon Tax)",
    encodingRole: "base",
    colorMeaning: "탄소 가격 수준 (ETS, Carbon Tax)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "탄소 가격 수준 (ETS, Carbon Tax)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-016",
    elementId: "B-016",
    dataMeaning: "화석연료 의존도(Fossil fuel energy consumption (% of total))",
    encodingRole: "base",
    colorMeaning:
      "화석연료 의존도(Fossil fuel energy consumption (% of total))의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "화석연료 의존도(Fossil fuel energy consumption (% of total))",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-017",
    elementId: "B-017",
    dataMeaning: "WRI Aqueduct 물 스트레스 지수",
    encodingRole: "base",
    colorMeaning: "WRI Aqueduct 물 스트레스 지수의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "WRI Aqueduct 물 스트레스 지수",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-018",
    elementId: "B-018",
    dataMeaning: "SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5)",
    encodingRole: "base",
    colorMeaning: "SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-019",
    elementId: "B-019",
    dataMeaning: "SSP 인구 전망 (SSP 1~5)",
    encodingRole: "base",
    colorMeaning: "SSP 인구 전망 (SSP 1~5)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "SSP 인구 전망 (SSP 1~5)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-020",
    elementId: "B-020",
    dataMeaning: "EU/UN INFORM Risk Index (복합 리스크 지수)",
    encodingRole: "base",
    colorMeaning: "EU/UN INFORM Risk Index (복합 리스크 지수)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "EU/UN INFORM Risk Index (복합 리스크 지수)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-021",
    elementId: "B-021",
    dataMeaning: "Global Data Lab의 GVI, Vulnerability Index",
    encodingRole: "base",
    colorMeaning: "Global Data Lab의 GVI, Vulnerability Index의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "Global Data Lab의 GVI, Vulnerability Index",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-022",
    elementId: "B-022",
    dataMeaning:
      "World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %)",
    encodingRole: "base",
    colorMeaning:
      "World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle:
      "World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-023",
    elementId: "B-023",
    dataMeaning: "건기/우기 유량 차이",
    encodingRole: "base",
    colorMeaning: "건기/우기 유량 차이의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "건기/우기 유량 차이",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-024",
    elementId: "B-024",
    dataMeaning: "농업 용수 비중(%)",
    encodingRole: "base",
    colorMeaning: "농업 용수 비중(%)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "농업 용수 비중(%)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-025",
    elementId: "B-025",
    dataMeaning: "유역 면적(km²)",
    encodingRole: "base",
    colorMeaning: "유역 면적(km²)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "유역 면적(km²)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-026",
    elementId: "B-026",
    dataMeaning: "유향(flow direction)",
    encodingRole: "base",
    colorMeaning: "유향(flow direction)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "유향(flow direction)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-027",
    elementId: "B-027",
    dataMeaning: "지하수 잠재량(m³/yr)",
    encodingRole: "base",
    colorMeaning: "지하수 잠재량(m³/yr)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "지하수 잠재량(m³/yr)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-028",
    elementId: "B-028",
    dataMeaning: "하천 유량(m³/s)",
    encodingRole: "base",
    colorMeaning: "하천 유량(m³/s)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "하천 유량(m³/s)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-029",
    elementId: "B-029",
    dataMeaning: "산림 유형별 면적(열대우림/맹그로브/이탄지 등),",
    encodingRole: "base",
    colorMeaning:
      "산림 유형별 면적(열대우림/맹그로브/이탄지 등),의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "산림 유형별 면적(열대우림/맹그로브/이탄지 등),",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-030",
    elementId: "B-030",
    dataMeaning: "산림 이득(ha/yr)",
    encodingRole: "base",
    colorMeaning: "산림 이득(ha/yr)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "산림 이득(ha/yr)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-031",
    elementId: "B-031",
    dataMeaning: "산림 총 면적(ha)",
    encodingRole: "base",
    colorMeaning: "산림 총 면적(ha)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "산림 총 면적(ha)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-032",
    elementId: "B-032",
    dataMeaning: "수관 피복률(%)",
    encodingRole: "base",
    colorMeaning: "수관 피복률(%)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "수관 피복률(%)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-033",
    elementId: "B-033",
    dataMeaning: "연간 산림 손실(ha/yr)",
    encodingRole: "base",
    colorMeaning: "연간 산림 손실(ha/yr)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "연간 산림 손실(ha/yr)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-034",
    elementId: "B-034",
    dataMeaning: "탄소 저장량(tC/ha)",
    encodingRole: "base",
    colorMeaning: "탄소 저장량(tC/ha)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "탄소 저장량(tC/ha)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-035",
    elementId: "B-035",
    dataMeaning: "LULUCF 관련 면적 변화",
    encodingRole: "base",
    colorMeaning: "LULUCF 관련 면적 변화의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "LULUCF 관련 면적 변화",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-036",
    elementId: "B-036",
    dataMeaning: "토지이용 변화율(%/yr)",
    encodingRole: "base",
    colorMeaning: "토지이용 변화율(%/yr)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "토지이용 변화율(%/yr)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-037",
    elementId: "B-037",
    dataMeaning: "토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha)",
    encodingRole: "base",
    colorMeaning:
      "토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-038",
    elementId: "B-038",
    dataMeaning:
      "바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물)",
    encodingRole: "base",
    colorMeaning:
      "바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle:
      "바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-039",
    elementId: "B-039",
    dataMeaning: "수력 잠재량",
    encodingRole: "base",
    colorMeaning: "수력 잠재량의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "수력 잠재량",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-040",
    elementId: "B-040",
    dataMeaning: "지열 잠재량",
    encodingRole: "base",
    colorMeaning: "지열 잠재량의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "지열 잠재량",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-041",
    elementId: "B-041",
    dataMeaning: "태양광 관련 지표 (GHI, DNI)",
    encodingRole: "base",
    colorMeaning: "태양광 관련 지표 (GHI, DNI)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "태양광 관련 지표 (GHI, DNI)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-042",
    elementId: "B-042",
    dataMeaning: "풍력 자원 (풍속, 에너지밀도)",
    encodingRole: "base",
    colorMeaning: "풍력 자원 (풍속, 에너지밀도)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "풍력 자원 (풍속, 에너지밀도)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-043",
    elementId: "B-043",
    dataMeaning: "화석연료 자원량 (석탄, 석유, LNG 등)",
    encodingRole: "base",
    colorMeaning:
      "화석연료 자원량 (석탄, 석유, LNG 등)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "화석연료 자원량 (석탄, 석유, LNG 등)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-044",
    elementId: "B-044",
    dataMeaning: "광물명(리튬/코발트/니켈/구리/희토류/망간)",
    encodingRole: "base",
    colorMeaning:
      "광물명(리튬/코발트/니켈/구리/희토류/망간)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "광물명(리튬/코발트/니켈/구리/희토류/망간)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-045",
    elementId: "B-045",
    dataMeaning: "글로벌 순위",
    encodingRole: "base",
    colorMeaning: "글로벌 순위의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "글로벌 순위",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-046",
    elementId: "B-046",
    dataMeaning: "매장량(확인/추정, tonnes)",
    encodingRole: "base",
    colorMeaning: "매장량(확인/추정, tonnes)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "매장량(확인/추정, tonnes)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-047",
    elementId: "B-047",
    dataMeaning: "연간 생산량(tonnes/yr)",
    encodingRole: "base",
    colorMeaning: "연간 생산량(tonnes/yr)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "연간 생산량(tonnes/yr)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-b-048",
    elementId: "B-048",
    dataMeaning: "주요 광산 위치(가용 시 좌표)",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "주요 광산 위치(가용 시 좌표)",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-c-001",
    elementId: "C-001",
    dataMeaning: "제출 이력(제출년도/버전)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "제출 이력(제출년도/버전)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-002",
    elementId: "C-002",
    dataMeaning: "제출 이력(제출년도/문서 링크)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "제출 이력(제출년도/문서 링크)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-003",
    elementId: "C-003",
    dataMeaning: "제출 이력(제출년도/문서 링크)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "제출 이력(제출년도/문서 링크)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-004",
    elementId: "C-004",
    dataMeaning: "장기 배출 경로(2050, BAU/감축/넷제로 시나리오별 MtCO₂e)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "장기 배출 경로(2050, BAU/감축/넷제로 시나리오별 MtCO₂e)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-005",
    elementId: "C-005",
    dataMeaning: "TNA/TAP 우선기술·장벽·Project Idea",
    encodingRole: "bubble",
    colorMeaning: "기술수요 bubble 본체",
    sizeMeaning:
      "확인된 TNA/TAP 우선기술 수 · 원 면적이 건수에 비례하도록 sqrt scaling",
    shapeMeaning:
      "원형은 국가 단위 기술수요 집계를 의미하며 내부 숫자는 수요 건수, 기호는 정책 현재성을 보조표시",
    borderMeaning:
      "기술수요의 최신 정책 현재성 구성: 재확인 우세/부분 재확인/과거근거 우세/방향차이 포함",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "TNA/TAP 우선기술·장벽·Project Idea",
    legendItems: [
      {
        label: "원 크기",
        meaning: "확인된 우선기술 수",
      },
      {
        label: "녹색 테두리",
        meaning: "최신 정책 재확인 비중이 높음",
      },
      {
        label: "주황 테두리",
        meaning: "부분 재확인 포함",
      },
      {
        label: "회색 테두리",
        meaning: "과거 근거 비중이 높음",
      },
      {
        label: "자주색 테두리",
        meaning: "최신 정책과 방향 차이 항목 포함",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 30,
  },
  {
    layerId: "v116-element-c-006",
    elementId: "C-006",
    dataMeaning: "ITMO 양자 협정 체결국, 체결 일자, 대상 부문/기술",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "ITMO 양자 협정 체결국, 체결 일자, 대상 부문/기술",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-c-007",
    elementId: "C-007",
    dataMeaning:
      "참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 기관, 등록 일자, 원본 링크(URL)",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 기관, 등록 일자, 원본 링크(URL)",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-008",
    elementId: "C-008",
    dataMeaning:
      "이니셔티브 명, 참여 상태(Active/Completed), 참여 연도, 기후 분야(감축/적응), 주제(에너지/산림/수송/도시 등), 참여 국가·기관 목록",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "이니셔티브 명, 참여 상태(Active/Completed), 참여 연도, 기후 분야(감축/적응), 주제(에너지/산림/수송/도시 등), 참여 국가·기관 목록",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-009",
    elementId: "C-009",
    dataMeaning: "기후변화 법·규제·인센티브 현황",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "기후변화 법·규제·인센티브 현황",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-010",
    elementId: "C-010",
    dataMeaning:
      "법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처, 원본 링크(URL)",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처, 원본 링크(URL)",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-011",
    elementId: "C-011",
    dataMeaning:
      "치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계)",
    encodingRole: "base",
    colorMeaning:
      "치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계)의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle:
      "치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-012",
    elementId: "C-012",
    dataMeaning: "PPP 법률 유무/명칭",
    encodingRole: "base",
    colorMeaning: "PPP 법률 유무/명칭의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "PPP 법률 유무/명칭",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-013",
    elementId: "C-013",
    dataMeaning: "외국인 지분 제한",
    encodingRole: "base",
    colorMeaning: "외국인 지분 제한의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "외국인 지분 제한",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-014",
    elementId: "C-014",
    dataMeaning: "환경영향평가(EIA) 절차",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "환경영향평가(EIA) 절차",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-015",
    elementId: "C-015",
    dataMeaning: "상기 문서들의 원본 링크(URL)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "상기 문서들의 원본 링크(URL)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-016",
    elementId: "C-016",
    dataMeaning:
      "재생에너지 발주 및 확대 계획: 국가 RE 용량 목표(MW, 연도별), 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 방식(경쟁입찰/FIT), 발주 기관",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "재생에너지 발주 및 확대 계획: 국가 RE 용량 목표(MW, 연도별), 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 방식(경쟁입찰/FIT), 발주 기관",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-017",
    elementId: "C-017",
    dataMeaning:
      "재생에너지 투자 인센티브: 인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력/수력/바이오), 인센티브 조건(가격/기간/용량), 시행 기관, 시행 연도, 상태",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "재생에너지 투자 인센티브: 인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력/수력/바이오), 인센티브 조건(가격/기간/용량), 시행 기관, 시행 연도, 상태",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-018",
    elementId: "C-018",
    dataMeaning:
      "중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%)",
    encodingRole: "base",
    colorMeaning:
      "중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle:
      "중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-019",
    elementId: "C-019",
    dataMeaning: "탄소세 도입 여부 및 세율(USD/tCO₂)",
    encodingRole: "base",
    colorMeaning: "탄소세 도입 여부 및 세율(USD/tCO₂)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "탄소세 도입 여부 및 세율(USD/tCO₂)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-020",
    elementId: "C-020",
    dataMeaning: "GHG 감축 사업 타당성 기초 정보",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "GHG 감축 사업 타당성 기초 정보",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-c-021",
    elementId: "C-021",
    dataMeaning: "VCM 프로젝트 파이프라인",
    encodingRole: "bubble",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "VCM 프로젝트 파이프라인의 절대량·건수 · 원 면적 비례",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "VCM 프로젝트 파이프라인",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 30,
  },
  {
    layerId: "v116-element-c-022",
    elementId: "C-022",
    dataMeaning: "탄소시장 준비도",
    encodingRole: "base",
    colorMeaning: "탄소시장 준비도의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "탄소시장 준비도",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-023",
    elementId: "C-023",
    dataMeaning: "한계저감비용 (MAC)",
    encodingRole: "base",
    colorMeaning: "한계저감비용 (MAC)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "한계저감비용 (MAC)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-c-024",
    elementId: "C-024",
    dataMeaning:
      "REDD+ 현황: REDD+ 전략 수립 여부, FREL 제출 여부/제출년, 결과기반지불(RBP) 수혜 실적(tCO₂e/USD), 세이프가드 정보 시스템 구축 여부, 참여 기금(GCF/FCPF/BioCF)",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "REDD+ 현황: REDD+ 전략 수립 여부, FREL 제출 여부/제출년, 결과기반지불(RBP) 수혜 실적(tCO₂e/USD), 세이프가드 정보 시스템 구축 여부, 참여 기금(GCF/FCPF/BioCF)",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-c-025",
    elementId: "C-025",
    dataMeaning:
      "탄소크레딧 발행·소각 실적: 프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량(tCO₂e), 소각량(tCO₂e), 빈티지(연도), 발행일",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "탄소크레딧 발행·소각 실적: 프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량(tCO₂e), 소각량(tCO₂e), 빈티지(연도), 발행일",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-001",
    elementId: "D-001",
    dataMeaning: "단위 사업당 CAPEX",
    encodingRole: "base",
    colorMeaning: "단위 사업당 CAPEX의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "단위 사업당 CAPEX",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-002",
    elementId: "D-002",
    dataMeaning: "시장 성장률",
    encodingRole: "base",
    colorMeaning: "시장 성장률의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "시장 성장률",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-003",
    elementId: "D-003",
    dataMeaning: "예상 감축량",
    encodingRole: "base",
    colorMeaning: "예상 감축량의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "예상 감축량",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-004",
    elementId: "D-004",
    dataMeaning: "크레딧 가격 연동 수익성",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "크레딧 가격 연동 수익성",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-d-005",
    elementId: "D-005",
    dataMeaning: "감축/적응 구분별 예산 배분 비율",
    encodingRole: "base",
    colorMeaning: "감축/적응 구분별 예산 배분 비율의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "fixed-0-100",
      breaks: [0, 20, 40, 60, 80, 100],
      reason: "백분율 성격의 값은 국가 간 비교 가능한 0~100 고정범위를 우선",
    },
    legendTitle: "감축/적응 구분별 예산 배분 비율",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-006",
    elementId: "D-006",
    dataMeaning: "기후 관련 조세 수입",
    encodingRole: "base",
    colorMeaning: "기후 관련 조세 수입의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기후 관련 조세 수입",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-007",
    elementId: "D-007",
    dataMeaning: "기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준",
    encodingRole: "base",
    colorMeaning:
      "기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-008",
    elementId: "D-008",
    dataMeaning: "주관 부처별 기후 예산 규모",
    encodingRole: "base",
    colorMeaning: "주관 부처별 기후 예산 규모의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "주관 부처별 기후 예산 규모",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-009",
    elementId: "D-009",
    dataMeaning: "총 지출 규모, 연도별 추이",
    encodingRole: "base",
    colorMeaning: "총 지출 규모, 연도별 추이의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "총 지출 규모, 연도별 추이",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-010",
    elementId: "D-010",
    dataMeaning: "화석연료 보조금 규모",
    encodingRole: "base",
    colorMeaning: "화석연료 보조금 규모의 위험·부담 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "화석연료 보조금 규모",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-011",
    elementId: "D-011",
    dataMeaning: "국가별 ODA 규모·공여구조",
    encodingRole: "bubble",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning:
      "ODA 실제지출 규모 · 원 면적이 금액에 비례하도록 sqrt-capped scaling",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "국가별 ODA 규모·공여구조",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 30,
  },
  {
    layerId: "v116-element-d-012",
    elementId: "D-012",
    dataMeaning:
      "경쟁국 민간기업의 개도국 진출 현황: 기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명, 용량(MW), 투자액(USD), 진출 형태(EPC/투자/라이선스)",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "경쟁국 민간기업의 개도국 진출 현황: 기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명, 용량(MW), 투자액(USD), 진출 형태(EPC/투자/라이선스)",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-013",
    elementId: "D-013",
    dataMeaning: "GGGI Green Growth Index(녹색성장지수)",
    encodingRole: "base",
    colorMeaning: "GGGI Green Growth Index(녹색성장지수)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "GGGI Green Growth Index(녹색성장지수)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-d-014",
    elementId: "D-014",
    dataMeaning:
      "EDCF 프로젝트: 프로젝트명, 수원국, 섹터, 승인 금액(USD), 금리(%), 상환 기간(년), 거치 기간(년), 사업 기간, 시행기관, 상태(승인/집행/완료)",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "EDCF 프로젝트: 프로젝트명, 수원국, 섹터, 승인 금액(USD), 금리(%), 상환 기간(년), 거치 기간(년), 사업 기간, 시행기관, 상태(승인/집행/완료)",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-015",
    elementId: "D-015",
    dataMeaning:
      "ODA Korea 프로젝트: 사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협력/연수), 사업 기간, 사업비(USD/KRW), 분야(DAC 섹터코드), 상태",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "ODA Korea 프로젝트: 사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협력/연수), 사업 기간, 사업비(USD/KRW), 분야(DAC 섹터코드), 상태",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-016",
    elementId: "D-016",
    dataMeaning:
      "지자체·정부부처 프로젝트: 사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "지자체·정부부처 프로젝트: 사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-017",
    elementId: "D-017",
    dataMeaning:
      "한국 ODA 기관 PCP/입찰 현황: 사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모(USD), 입찰 유형(PCP/RFP/경쟁), 입찰 일정(공고일/마감일), 수행기관 자격 요건",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "한국 ODA 기관 PCP/입찰 현황: 사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모(USD), 입찰 유형(PCP/RFP/경쟁), 입찰 일정(공고일/마감일), 수행기관 자격 요건",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-018",
    elementId: "D-018",
    dataMeaning:
      "Adaptation Fund 프로젝트: 프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액(USD), 분야(수자원/농업/재난관리/해안/생태계), 상태(Under Implementation/Completed), 기간, 수혜자 수",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "Adaptation Fund 프로젝트: 프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액(USD), 분야(수자원/농업/재난관리/해안/생태계), 상태(Under Implementation/Completed), 기간, 수혜자 수",
    legendItems: [
      {
        label: "▲ Adaptation Fund",
        meaning: "국가 단위 사업·지원 건수",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-019",
    elementId: "D-019",
    dataMeaning:
      "CTCN 기술지원 요청: 요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Scoping/TA Delivery/Completed), 예산(USD), 기술 유형(Technologies), 기간, TA 결과 요약",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "CTCN 기술지원 요청: 요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Scoping/TA Delivery/Completed), 예산(USD), 기술 유형(Technologies), 기간, TA 결과 요약",
    legendItems: [
      {
        label: "⬢ CTCN",
        meaning: "국가 단위 사업·지원 건수",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-020",
    elementId: "D-020",
    dataMeaning: "GCF 프로젝트 현황",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "GCF 프로젝트 현황",
    legendItems: [
      {
        label: "● GCF",
        meaning: "국가 단위 사업·지원 건수",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-021",
    elementId: "D-021",
    dataMeaning: "주요 국제기구·MDB 프로젝트",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "주요 국제기구·MDB 프로젝트",
    legendItems: [
      {
        label: "◆ World Bank·ADB",
        meaning: "국가 단위 사업·지원 건수",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-022",
    elementId: "D-022",
    dataMeaning:
      "MDB/DFI/PPP 투자 프로젝트: 프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5자리 코드), 투자액(commitment/disbursement, USD), 프로젝트 상태, 기간(시작/종료), 실행기관, Rio Marker(기후 태깅), 투자 유형(grant/loan/equity), 공동투자 참여 가능 여부 및 형태",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "MDB/DFI/PPP 투자 프로젝트: 프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5자리 코드), 투자액(commitment/disbursement, USD), 프로젝트 상태, 기간(시작/종료), 실행기관, Rio Marker(기후 태깅), 투자 유형(grant/loan/equity), 공동투자 참여 가능 여부 및 형태",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-023",
    elementId: "D-023",
    dataMeaning: "ODA·기후기금 재원 현황",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "ODA·기후기금 재원 현황",
    legendItems: [
      {
        label: "■ GEF",
        meaning: "국가 단위 사업·지원 건수",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-024",
    elementId: "D-024",
    dataMeaning:
      "VC·임팩트 투자 현황: 투자 라운드(Seed/Series A-C), 투자자명, 투자 금액(USD), 대상 기업/기술, 국가, 투자 연도, 기후 분야(RE/효율/모빌리티/AgTech), 공동투자 참여 가능 여부 및 형태",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "VC·임팩트 투자 현황: 투자 라운드(Seed/Series A-C), 투자자명, 투자 금액(USD), 대상 기업/기술, 국가, 투자 연도, 기후 분야(RE/효율/모빌리티/AgTech), 공동투자 참여 가능 여부 및 형태",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-d-025",
    elementId: "D-025",
    dataMeaning:
      "민간 인프라 투자 (PPI): 프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/Concession/Divestiture), 총 투자액(USD), 민간 투자액(USD), 계약 기간(년), 상태(Active/Cancelled/Distressed), Financial Close 연도, 스폰서/개발사, IDA 지위, 공동투자 참여 가능 여부 및 형태",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "민간 인프라 투자 (PPI): 프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/Concession/Divestiture), 총 투자액(USD), 민간 투자액(USD), 계약 기간(년), 상태(Active/Cancelled/Distressed), Financial Close 연도, 스폰서/개발사, IDA 지위, 공동투자 참여 가능 여부 및 형태",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-d-026",
    elementId: "D-026",
    dataMeaning:
      "프로젝트명, 국가, 섹터, 보증 금액(USD), 보증 유형(수용/이전제한/계약위반/전쟁내란), 보증 기간, 투자자, 상태",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "프로젝트명, 국가, 섹터, 보증 금액(USD), 보증 유형(수용/이전제한/계약위반/전쟁내란), 보증 기간, 투자자, 상태",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-e-001",
    elementId: "E-001",
    dataMeaning:
      "CTCN NDE (국가지정기구): 국가, 기관명, 소속 부처, 담당자(Focal Point)명, 직함, 이메일, 전화번호",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "CTCN NDE (국가지정기구): 국가, 기관명, 소속 부처, 담당자(Focal Point)명, 직함, 이메일, 전화번호",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-e-002",
    elementId: "E-002",
    dataMeaning:
      "DNA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전환 상태",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "DNA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전환 상태",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-e-003",
    elementId: "E-003",
    dataMeaning: "GCF 국가 지정기관(NDA)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "GCF 국가 지정기관(NDA)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-e-004",
    elementId: "E-004",
    dataMeaning:
      "국제기구 현지사무소 담당자: 기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 등), 소재국, 도시, 사무소 주소, 기후·에너지 담당자 명, 직함, 이메일",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "국제기구 현지사무소 담당자: 기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 등), 소재국, 도시, 사무소 주소, 기후·에너지 담당자 명, 직함, 이메일",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-e-005",
    elementId: "E-005",
    dataMeaning:
      "대학·연구기관·NGO: 기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국/도시, 전문 분야(기후/에너지/환경/농업), 주요 연구역량 또는 활동 범위, 국제 협력 실적 유무, 연락처",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "대학·연구기관·NGO: 기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국/도시, 전문 분야(기후/에너지/환경/농업), 주요 연구역량 또는 활동 범위, 국제 협력 실적 유무, 연락처",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-e-006",
    elementId: "E-006",
    dataMeaning:
      "현지 투자자 네트워크: 기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너지/인프라/AgTech), 투자 규모(AUM, USD), 소재국/도시, 연락처, 기후기술 투자 실적 유무",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "현지 투자자 네트워크: 기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너지/인프라/AgTech), 투자 규모(AUM, USD), 소재국/도시, 연락처, 기후기술 투자 실적 유무",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-e-007",
    elementId: "E-007",
    dataMeaning: "GHG 인벤토리 작성 역량(Tier 1/2/3)",
    encodingRole: "outline",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "정책·제도 상태 또는 존재 여부",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "GHG 인벤토리 작성 역량(Tier 1/2/3)",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 20,
  },
  {
    layerId: "v116-element-e-008",
    elementId: "E-008",
    dataMeaning: "기후기술 논문·특허·국제협력",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "기후기술 논문·특허·국제협력",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-e-009",
    elementId: "E-009",
    dataMeaning: "STEM 졸업자·연구자 수",
    encodingRole: "base",
    colorMeaning: "STEM 졸업자·연구자 수의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "STEM 졸업자·연구자 수",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-e-010",
    elementId: "E-010",
    dataMeaning: "UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII)",
    encodingRole: "base",
    colorMeaning:
      "UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII)의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-e-011",
    elementId: "E-011",
    dataMeaning: "기술준비수준 (TRL)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "기술준비수준 (TRL)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-e-012",
    elementId: "E-012",
    dataMeaning: "직군별 종사자 수·임금",
    encodingRole: "base",
    colorMeaning: "직군별 종사자 수·임금의 시장·사업환경 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "직군별 종사자 수·임금",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-e-013",
    elementId: "E-013",
    dataMeaning: "숙련 기술인력 가용성(등급)",
    encodingRole: "base",
    colorMeaning: "숙련 기술인력 가용성(등급)의 자원·기술 적용여건 수준",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "quantile",
      breaks: [],
      reason: "범위가 지표마다 달라 5분위 기반 상대분포를 사용",
    },
    legendTitle: "숙련 기술인력 가용성(등급)",
    legendItems: [
      {
        label: "가장 연한색",
        meaning: "낮은 값",
      },
      {
        label: "가장 진한색",
        meaning: "높은 값",
      },
      {
        label: "회색",
        meaning: "자료 없음",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 10,
  },
  {
    layerId: "v116-element-e-014",
    elementId: "E-014",
    dataMeaning:
      "협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이행 상태(발효/만료/갱신), 원본 링크(URL)",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이행 상태(발효/만료/갱신), 원본 링크(URL)",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-e-015",
    elementId: "E-015",
    dataMeaning: "NDC partnership의 참여 여부(Y/N) 및 Country Page 링크(URL)",
    encodingRole: "symbol",
    colorMeaning: "기관별 심볼의 보조 구분",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "NDC partnership의 참여 여부(Y/N) 및 Country Page 링크(URL)",
    legendItems: [],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 40,
  },
  {
    layerId: "v116-element-e-016",
    elementId: "E-016",
    dataMeaning: "한국 기후기술 TRL",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "한국 기후기술 TRL",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
  {
    layerId: "v116-element-e-017",
    elementId: "E-017",
    dataMeaning: "한국-경쟁국 기후기술 비교우위",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle: "한국-경쟁국 기후기술 비교우위",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-e-018",
    elementId: "E-018",
    dataMeaning:
      "기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝트), 설립연도, 연락처, 38대 기후기술 매칭",
    encodingRole: "flow",
    colorMeaning: "흐름 유형 또는 출발주체 범주",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "관계·이동 방향; 공식 규모가 있을 때만 선 굵기로 양을 표현",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝트), 설립연도, 연락처, 38대 기후기술 매칭",
    legendItems: [
      {
        label: "연결선",
        meaning: "국가·기관·교역·협력의 방향 관계",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 35,
  },
  {
    layerId: "v116-element-e-019",
    elementId: "E-019",
    dataMeaning:
      "기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, 주소, 기후·에너지 담당자 유무, 연락처, 담당 업무 범위",
    encodingRole: "point",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "용량·규모가 공식 자료에 있을 때만 사용하며 없으면 고정 크기",
    shapeMeaning: "시설·기관·사업 유형",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, 주소, 기후·에너지 담당자 유무, 연락처, 담당 업무 범위",
    legendItems: [
      {
        label: "●",
        meaning: "실제 위치가 검증된 시설·사업·기관",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 50,
  },
  {
    layerId: "v116-element-e-020",
    elementId: "E-020",
    dataMeaning:
      "지원기관 명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램 명, 지원 유형(실증/FS/기술이전/금융), 지원 대상(기업/연구기관), 예산 규모, 신청 시기, 원본 링크(URL)",
    encodingRole: "panel",
    colorMeaning: "범주 또는 선택상태 보조표현",
    sizeMeaning: "사용하지 않음",
    shapeMeaning: "사용하지 않음",
    borderMeaning: "사용하지 않음",
    opacityMeaning:
      "비활성·hover·중첩 완화에만 사용하며 데이터 신뢰도 의미로 사용하지 않음",
    lineMeaning: "사용하지 않음",
    classification: {
      method: "none",
      breaks: [],
      reason: "연속형 배경색 분류를 사용하지 않음",
    },
    legendTitle:
      "지원기관 명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램 명, 지원 유형(실증/FS/기술이전/금융), 지원 대상(기업/연구기관), 예산 규모, 신청 시기, 원본 링크(URL)",
    legendItems: [
      {
        label: "상세정보",
        meaning: "지도에 값을 억지로 부여하지 않고 선택지역 패널에서 확인",
      },
    ],
    zeroTreatment: "0은 실제 관측값 0으로 표시하며 자료 없음과 구분",
    noDataTreatment: "자료 없음은 중립 회색 또는 무채색 패턴으로 표시",
    syntheticTreatment:
      "시각화 예시는 별도 badge와 안내문을 표시하고 실제 통계와 같은 범례로 해석하지 않음",
    hoverTemplate:
      "지역/국가명 · 값/건수 · 단위 · 실제 기준연도 · 공간단위 · 실제/예시 구분",
    clickAction: "선택 국가·지역 Evidence Panel 열기 및 관련 데이터 상세 연결",
    zIndex: 5,
  },
] as MapVisualEncodingV116[];

export const MAP_VISUAL_ENCODING_INDEX_V116 = new Map(
  MAP_VISUAL_ENCODINGS_V116.map((item) => [item.elementId, item] as const)
);

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function buildClassificationBreaksV116(
  elementId: string | null,
  values: number[]
): number[] {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return [];
  const spec = elementId ? MAP_VISUAL_ENCODING_INDEX_V116.get(elementId) : null;
  const method = spec?.classification.method ?? "quantile";
  if (
    (method === "fixed" || method === "fixed-0-100") &&
    spec?.classification.breaks.length
  ) {
    return spec.classification.breaks;
  }
  if (method === "equal-interval") {
    const min = clean[0];
    const max = clean[clean.length - 1];
    const step = (max - min) / 5 || 1;
    return [
      min,
      min + step,
      min + step * 2,
      min + step * 3,
      min + step * 4,
      max,
    ];
  }
  return [
    clean[0],
    quantile(clean, 0.2),
    quantile(clean, 0.4),
    quantile(clean, 0.6),
    quantile(clean, 0.8),
    clean[clean.length - 1],
  ];
}

export function classifyValueV116(value: number, breaks: number[]): number {
  if (!Number.isFinite(value) || breaks.length < 2) return 0;
  for (let index = 1; index < breaks.length; index += 1) {
    if (value <= breaks[index]) return Math.min(4, index - 1);
  }
  return 4;
}

export function sqrtAreaRadiusV116(
  value: number,
  maxValue: number,
  minRadius = 5,
  maxRadius = 24
): number {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) return 0;
  const ratio = Math.sqrt(value / maxValue);
  return minRadius + (maxRadius - minRadius) * ratio;
}

export const CORE_INTEGRATED_CHANNELS_V116 = {
  presetLabel: "핵심 협력기획 보기",
  baseElementId: "B-006",
  demandElementId: "C-005",
  supportElementIds: ["D-019", "D-020", "D-018", "D-023", "D-021"],
  financeElementId: "D-011",
  policyEncoding: "C-005 현재성 테두리",
  verifiedLocationPrepared: true,
  reviewOrder: [
    "문제·수요 확인",
    "정책 정합성 확인",
    "기존 사업 확인",
    "재원·공여환경 확인",
    "지역·파트너 확인",
  ],
} as const;
