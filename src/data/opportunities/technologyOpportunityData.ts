import type { TechnologyOpportunityRecord } from "../../types/opportunity";

export const TECHNOLOGY_OPPORTUNITY_RECORDS: TechnologyOpportunityRecord[] = [
  {
    iso3: "VNM",
    technologyId: "solar-pv",
    title: "태양광 발전사업·분산전원 협력 검토",
    recommendedStage: "타당성조사 우선",
    recommendedProjectTypes: [
      "타당성조사",
      "기술실증",
      "설비 구축",
      "ODA 사업",
    ],
    summary:
      "태양광 자원과 국가 정책 근거는 확인되며, 실제 사업기획 전 수요기관·부지·계통연계·조달계획을 구체화할 필요가 있음",
    problemStatement:
      "재생에너지 확대와 전력수요 증가에 대응하면서 사업부지·수요처·계통수용성을 함께 검토해야 함",
    targetSectors: ["전력", "산업단지", "건물", "농촌·도서지역"],
    targetRegions: ["국가 전체", "산업지역", "전력 접근 취약지역"],
    evidence: [
      {
        id: "vnm-solar-resource",
        area: "기술조건",
        title: "태양광 자원·발전 잠재량",
        summary:
          "PVOUT·GHI 국가자료가 플랫폼에 연결되어 자원 수준의 1차 검토 가능",
        status: "confirmed",
        sourceLabel: "Global Solar Atlas 국가별 연구자료",
        datasetId: "LDC-DS-B-002",
      },
      {
        id: "vnm-solar-ndc",
        area: "정책",
        title: "NDC 재생에너지 근거",
        summary: "공식 NDC에서 재생에너지 개발수단 확인",
        status: "confirmed",
        sourceLabel: "Vietnam NDC 2022",
        datasetId: "LDC-DS-C-001",
      },
      {
        id: "vnm-solar-demand",
        area: "수요",
        title: "전력·재생에너지 수요 신호",
        summary:
          "전력 접근성·재생에너지 비중·송배전 손실 자료를 함께 확인 가능",
        status: "related",
        sourceLabel: "World Bank 국가별 전력지표",
      },
      {
        id: "vnm-solar-finance",
        area: "재원",
        title: "기후재원 사업경험",
        summary:
          "GCF 국가 포트폴리오를 통해 기존 기후사업 경험의 1차 확인 가능",
        status: "related",
        sourceLabel: "Green Climate Fund 국가자료",
        datasetId: "LDC-DS-E-002",
      },
      {
        id: "vnm-solar-demand-org",
        area: "기관",
        title: "수요기관·발주기관",
        summary:
          "기술별 직접 수요와 사업계획을 보유한 기관명은 베트남 수집자료와 연결 필요",
        status: "needs-check",
        sourceLabel: "현지 자료 연결 필요",
      },
    ],
    organizations: [
      {
        id: "vnm-solar-public",
        organizationType: "공공 발주·정책기관",
        name: "기관명 연결 필요",
        role: "재생에너지 계획·사업 승인·발주",
        basis: "공식 계획·발주자료로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-solar-demand-org-2",
        organizationType: "수요기관",
        name: "산업단지·건물·지역 전력수요처 연결 필요",
        role: "자가소비·분산전원·전력공급 사업 수요 제시",
        basis: "기관계획·현지조사로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-solar-partner",
        organizationType: "현지 사업 파트너",
        name: "개발·시공·운영기관 연결 필요",
        role: "부지·설계·시공·운영·인허가 지원",
        basis: "유사사업 실적과 기술역량으로 확인",
        status: "needs-check",
      },
    ],
    permits: [
      {
        id: "vnm-solar-environment",
        permitName: "환경·입지 관련 절차",
        authority: "담당기관 연결 필요",
        applicability: "사업규모·부지유형에 따라 적용",
        expectedDuration: "법정기간·실제 소요기간 확인 필요",
        status: "needs-check",
      },
      {
        id: "vnm-solar-power",
        permitName: "전력사업·계통연계 절차",
        authority: "전력·에너지 담당기관 연결 필요",
        applicability: "발전용량·계통연계 방식에 따라 적용",
        expectedDuration: "사업조건별 범위 확인 필요",
        status: "needs-check",
      },
      {
        id: "vnm-solar-land",
        permitName: "토지사용·건축 관련 절차",
        authority: "지역·토지 담당기관 연결 필요",
        applicability: "신규 부지사업 시 적용",
        expectedDuration: "지역별 확인 필요",
        status: "needs-check",
      },
    ],
    finance: [
      {
        id: "vnm-solar-gcf",
        sourceType: "기후기금",
        name: "GCF 기존 포트폴리오",
        relevance:
          "국가 사업경험 확인 후 기술·지역이 맞는 기존사업의 후속 연계 여부 검토",
        status: "related",
      },
      {
        id: "vnm-solar-oda",
        sourceType: "ODA·개발금융",
        name: "한국·다자개발은행 재원",
        relevance: "타당성조사·실증·분산형 전원사업의 지원수단과 연결 필요",
        status: "needs-check",
      },
      {
        id: "vnm-solar-private",
        sourceType: "민간투자",
        name: "민간 전력구매·자가소비 사업",
        relevance: "수요처와 계약구조가 확인되는 경우 사업모델 검토",
        status: "needs-check",
      },
    ],
    missingInformation: [
      "기술별 직접 수요기관과 담당부서",
      "우선 사업지역·부지·전력수요 규모",
      "계통연계 가능용량과 필요한 보강공사",
      "사업유형별 인허가 절차와 실제 소요기간",
      "발주·조달계획과 예산 또는 전력구매 구조",
    ],
    nextActions: [
      "베트남 수집자료에서 태양광 관련 수요기관·지역·사업계획을 연결",
      "수요기관별 전력사용·부지·계통연계 조건을 확인",
      "기존 GCF·ODA·개발금융 사업 중 태양광·전력망 관련 사업을 선별",
      "타당성조사 대상 후보 1~2개를 정하고 현지기관 확인항목을 작성",
    ],
  },
  {
    iso3: "VNM",
    technologyId: "power-integration",
    title: "전력망 현대화·스마트그리드 협력 검토",
    recommendedStage: "실증사업 우선",
    recommendedProjectTypes: [
      "타당성조사",
      "기술실증",
      "설비 구축",
      "기술이전",
      "역량강화",
    ],
    summary:
      "전력망·재생에너지 연계 정책 근거와 전력지표는 확인되며, 실증 대상망·운영기관·데이터 제공조건을 특정하는 작업이 우선임",
    problemStatement:
      "재생에너지 확대와 전력수요 변화에 대응하기 위한 계통운영·손실관리·계량·유연성 개선 필요성을 기술별로 구체화해야 함",
    targetSectors: ["송전", "배전", "산업단지", "도시 전력망"],
    targetRegions: [
      "국가 전체",
      "재생에너지 연계지역",
      "산업·도시 부하집중지역",
    ],
    evidence: [
      {
        id: "vnm-grid-loss",
        area: "수요",
        title: "송배전 손실·전력접근 지표",
        summary: "World Bank 전력지표를 통해 국가 단위 수요 신호 확인 가능",
        status: "confirmed",
        sourceLabel: "World Bank 국가별 전력지표",
      },
      {
        id: "vnm-grid-ndc",
        area: "정책",
        title: "NDC 전력망 근거",
        summary: "공식 NDC에서 전력망·스마트그리드 현대화 관련 근거 확인",
        status: "confirmed",
        sourceLabel: "Vietnam NDC 2022",
        datasetId: "LDC-DS-C-001",
      },
      {
        id: "vnm-grid-renewable",
        area: "기술조건",
        title: "재생에너지 확대와 계통통합 필요성",
        summary:
          "재생에너지 비중·태양광 잠재량 자료를 계통통합 검토의 보조근거로 활용",
        status: "related",
        sourceLabel: "World Bank·Global Solar Atlas",
      },
      {
        id: "vnm-grid-finance",
        area: "재원",
        title: "기존 기후사업·재원",
        summary:
          "GCF 국가 포트폴리오는 국가 사업경험 참고용이며 기술별 사업 연결은 추가 확인 필요",
        status: "related",
        sourceLabel: "Green Climate Fund 국가자료",
      },
      {
        id: "vnm-grid-operator",
        area: "기관",
        title: "실증 대상 운영기관",
        summary:
          "전력망 운영·배전·계량 데이터를 제공할 기관과 대상망을 특정해야 함",
        status: "needs-check",
        sourceLabel: "현지 자료 연결 필요",
      },
    ],
    organizations: [
      {
        id: "vnm-grid-operator-org",
        organizationType: "전력망 운영기관",
        name: "기관명·담당부서 연결 필요",
        role: "실증 대상망 제공·운영자료 제공·성과검증",
        basis: "전력망 운영권한과 유사사업 경험으로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-grid-policy-org",
        organizationType: "정책·승인기관",
        name: "전력·에너지 담당기관 연결 필요",
        role: "사업승인·계통계획·제도 연계",
        basis: "공식 조직·절차 자료로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-grid-tech-partner",
        organizationType: "기술·현지화 파트너",
        name: "계량·통신·제어·O&M 기관 연결 필요",
        role: "현지 시스템 연계·설치·유지관리",
        basis: "기술실적·지역 서비스망으로 확인",
        status: "needs-check",
      },
    ],
    permits: [
      {
        id: "vnm-grid-project-approval",
        permitName: "전력망 사업·실증 승인",
        authority: "담당기관 연결 필요",
        applicability: "대상망과 실증범위에 따라 적용",
        expectedDuration: "기관 협의기간 확인 필요",
        status: "needs-check",
      },
      {
        id: "vnm-grid-data",
        permitName: "운영데이터 제공·보안 승인",
        authority: "운영기관·정보보안 담당",
        applicability: "계량·운영데이터 사용 시 적용",
        expectedDuration: "자료범위·보안등급별 확인 필요",
        status: "needs-check",
      },
      {
        id: "vnm-grid-install",
        permitName: "현장 설치·정전·안전 절차",
        authority: "운영기관·지역 담당기관",
        applicability: "현장설비 설치·시험 시 적용",
        expectedDuration: "공사·시험계획에 따라 확인",
        status: "needs-check",
      },
    ],
    finance: [
      {
        id: "vnm-grid-mdb",
        sourceType: "개발금융",
        name: "전력망·에너지전환 지원사업",
        relevance:
          "기존 다자개발은행·기후기금 사업의 후속·연계 가능성 선별 필요",
        status: "needs-check",
      },
      {
        id: "vnm-grid-oda",
        sourceType: "ODA",
        name: "타당성조사·실증·역량강화 지원",
        relevance: "초기 실증과 운영역량 강화 단계에 적용 가능성 검토",
        status: "needs-check",
      },
    ],
    missingInformation: [
      "실증 대상 송전·배전망과 운영기관",
      "운영데이터 제공 가능 범위와 보안조건",
      "현재 사용 중인 계량·통신·제어시스템",
      "실증 성과를 본사업으로 확장하는 발주계획",
      "현지 설치·유지관리 인력과 장비 조달조건",
    ],
    nextActions: [
      "베트남 자료에서 전력망 운영기관·계획·발주사업을 기술별로 연결",
      "실증 가능한 대상망과 필요한 운영데이터 목록을 작성",
      "한국 기술 적용 시 기존 시스템과의 연계조건을 확인",
      "타당성조사 또는 소규모 실증사업의 범위·성과지표를 정의",
    ],
  },
  {
    iso3: "VNM",
    technologyId: "water",
    title: "기후회복력 물관리 협력 검토",
    recommendedStage: "현지 수요확인 우선",
    recommendedProjectTypes: [
      "수요조사",
      "타당성조사",
      "기술실증",
      "설비 구축",
      "역량강화",
      "기후기금 사업",
    ],
    summary:
      "NDC 수자원 적응 근거는 확인되지만 지역·시설별 문제와 수요기관이 특정되지 않아 현지 수요확인이 우선임",
    problemStatement:
      "국가 정책상 수자원 적응 필요성은 확인되나 홍수·가뭄·상수도 손실·수질 등 구체 문제를 지역과 기관 단위로 구분해야 함",
    targetSectors: ["수자원", "상하수도", "도시", "농업", "연안"],
    targetRegions: ["유역·도시·농업지역 연결 필요"],
    evidence: [
      {
        id: "vnm-water-ndc",
        area: "정책",
        title: "NDC 수자원 적응 근거",
        summary: "공식 NDC에서 수자원 관련 적응수단 확인",
        status: "confirmed",
        sourceLabel: "Vietnam NDC 2022",
        datasetId: "LDC-DS-C-001",
      },
      {
        id: "vnm-water-climate",
        area: "수요",
        title: "기후위험 자료",
        summary:
          "현재 폭염 자료는 연결되어 있으나 물 부문 직접 위험자료는 추가 연결 필요",
        status: "related",
        sourceLabel: "World Bank CCKP",
        datasetId: "LDC-DS-B-001",
      },
      {
        id: "vnm-water-local-demand",
        area: "기관",
        title: "지역·시설별 직접 수요",
        summary:
          "상수도·관개·홍수·가뭄 중 우선 문제와 수요기관을 현지자료로 확인해야 함",
        status: "needs-check",
        sourceLabel: "현지 자료 연결 필요",
      },
      {
        id: "vnm-water-finance",
        area: "재원",
        title: "적응 재원·기존사업",
        summary:
          "국가 GCF 포트폴리오 중 물·적응 관련 사업을 별도로 선별해야 함",
        status: "needs-check",
        sourceLabel: "GCF·개발금융 사업자료 연결 필요",
      },
    ],
    organizations: [
      {
        id: "vnm-water-demand-org",
        organizationType: "수요기관",
        name: "상수도·관개·유역·지역정부 기관 연결 필요",
        role: "문제지역·시설·운영자료·사업수요 제시",
        basis: "현지기관 자료·인터뷰·사업계획으로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-water-policy-org",
        organizationType: "정책·관리기관",
        name: "수자원·환경·재난 담당기관 연결 필요",
        role: "정책·허가·유역관리·투자계획 연계",
        basis: "공식 조직·계획으로 확인",
        status: "needs-check",
      },
      {
        id: "vnm-water-tech-partner",
        organizationType: "현지 기술 파트너",
        name: "설계·시공·운영·수질분석 기관 연결 필요",
        role: "현지 조사·설치·운영·유지관리",
        basis: "관련 사업실적과 기술역량으로 확인",
        status: "needs-check",
      },
    ],
    permits: [
      {
        id: "vnm-water-environment",
        permitName: "환경·수자원 관련 승인",
        authority: "담당기관 연결 필요",
        applicability: "취수·방류·시설규모에 따라 적용",
        expectedDuration: "사업유형별 확인 필요",
        status: "needs-check",
      },
      {
        id: "vnm-water-land",
        permitName: "토지·건설·지역 승인",
        authority: "지역 담당기관 연결 필요",
        applicability: "신규 시설·관로·저류시설에 적용",
        expectedDuration: "지역·시설규모별 확인 필요",
        status: "needs-check",
      },
    ],
    finance: [
      {
        id: "vnm-water-climate-fund",
        sourceType: "기후기금",
        name: "적응·물 부문 기후재원",
        relevance: "위험·수혜자·적응효과가 구체화되는 경우 연계 가능성 검토",
        status: "needs-check",
      },
      {
        id: "vnm-water-oda",
        sourceType: "ODA·개발금융",
        name: "상하수도·재난·농업용수 사업",
        relevance: "기존 지역사업과 후속·보완사업 연결 가능성 확인",
        status: "needs-check",
      },
    ],
    missingInformation: [
      "홍수·가뭄·수질·상수도 손실 중 우선 문제",
      "우선 지역·유역·시설과 수혜자",
      "직접 수요기관과 사업예산·계획",
      "기후위험과 사업효과를 측정할 기준자료",
      "인허가·토지·운영주체와 유지관리 조건",
    ],
    nextActions: [
      "베트남 자료에서 물 부문 수요를 문제유형·지역·기관별로 나눔",
      "물 관련 NDC·계획과 기존 GCF·ODA 사업을 연결",
      "우선 수요기관에 확인할 현장자료·운영자료 목록을 작성",
      "수요확인 결과에 따라 타당성조사 또는 적응사업 후보를 선정",
    ],
  },
];

export function getTechnologyOpportunityRecord(
  iso3: string,
  technologyId: string
): TechnologyOpportunityRecord | null {
  return (
    TECHNOLOGY_OPPORTUNITY_RECORDS.find(
      (record) =>
        record.iso3 === iso3.toUpperCase() &&
        record.technologyId === technologyId
    ) ?? null
  );
}
