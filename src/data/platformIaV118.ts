export const PLATFORM_IA_V118 = {
  primaryNavigation: [
    {
      view: "explorer",
      label: "데이터 찾기",
      purpose: "데이터를 찾고 의미를 이해·분석·비교",
    },
    {
      view: "map",
      label: "지도",
      purpose: "공간적으로 문제·수요·사업·여건을 탐색",
    },
    {
      view: "download",
      label: "데이터 다운로드",
      purpose: "국가·데이터·기간·형식을 선택해 내보내기",
    },
  ],
  downloadPolicy: {
    officialSurface: "download",
    detailGeneratesFiles: false,
    mapGeneratesFiles: false,
    searchGeneratesFiles: false,
    detailPrefillsContext: true,
    mapPrefillsContext: true,
    sourceLinkIsExternalEvidence: true,
  },
  mapPolicy: {
    contractsBeforeRenderers: true,
    primarySpatialLayerLimit: 1,
    actualProjectPointRequiresCoordinates: true,
    fakeRegionalizationAllowed: false,
    syntheticDefaultActive: false,
    syntheticRankingAllowed: false,
    financeConceptAggregationAllowed: false,
  },
} as const;

export const IA_DECISIONS_V118 = [
  {
    surface: "데이터 찾기",
    previous: "탐색·상세·비교·직접 다운로드",
    next: "탐색·이해·분석·국가 비교",
    decision: "move",
  },
  {
    surface: "데이터 상세",
    previous: "분석과 직접 파일 생성",
    next: "분석·원자료·지도 연결·다운로드 설정",
    decision: "move",
  },
  {
    surface: "지도",
    previous: "다수 시각기호와 설명문 중심",
    next: "실제 필드가 지원하는 공간분포와 관련 근거 탐색",
    decision: "rewrite",
  },
  {
    surface: "데이터 다운로드",
    previous: "별도 다운로드 기능",
    next: "플랫폼의 유일한 구조화 데이터 내보내기 허브",
    decision: "keep",
  },
] as const;
