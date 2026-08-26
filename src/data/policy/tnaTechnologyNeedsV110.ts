import { CLIMATE_TECHNOLOGY_BY_ID } from "../climateTechnologyCatalog";

export type TnaTrackV110 = "adaptation" | "mitigation";
export type TnaMappingConfidenceV110 = "high" | "medium" | "not-mapped";

export interface TnaOfficialDocumentV110 {
  title: string;
  year: number;
  track: TnaTrackV110;
  url: string;
}
export interface TnaTechnologyRecordV110 {
  id: string;
  track: TnaTrackV110;
  sectorKo: string;
  sourceTechnologyName: string;
  sourceTechnologyNameKo: string;
  priorityRank: number | null;
  selectedForTap: boolean;
  mappedTechnologyId: string | null;
  mappingConfidence: TnaMappingConfidenceV110;
  sourcePages: string;
  sourceUrl: string;
  evidenceAnchorKo: string;
  noteKo: string;
}
export interface TnaBarrierRecordV110 {
  track: TnaTrackV110;
  sectorKo: string;
  categoriesKo: string[];
  barriersKo: string[];
  sourcePages: string;
  sourceUrl: string;
  evidenceAnchorKo: string;
}
export interface TnaProjectIdeaV110 {
  id: string;
  track: TnaTrackV110;
  sectorKo: string;
  titleKo: string;
  linkedTechnologyRecordIds: string[];
  sourcePages: string;
  sourceUrl: string;
  timeframe: string | null;
  budgetUsd: number | null;
  implementingOrganizationsKo: string[];
  evidenceAnchorKo: string;
}
export interface TnaCountryProfileV110 {
  countryIso3: string;
  countryNameKo: string;
  coverageLabelKo: string;
  sourceReviewAsOf: string;
  officialDocuments: TnaOfficialDocumentV110[];
  technologies: TnaTechnologyRecordV110[];
  barriers: TnaBarrierRecordV110[];
  projectIdeas: TnaProjectIdeaV110[];
}

export const TNA_COUNTRY_PROFILES_V110: TnaCountryProfileV110[] = [
  {
    countryIso3: "VNM",
    countryNameKo: "베트남",
    coverageLabelKo: "TNA/TAP 상세자료 · 적응·감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "TNA, TAP and Project Ideas – Adaptation",
        year: 2012,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
      },
      {
        title: "TNA, TAP and Project Ideas – Mitigation",
        year: 2012,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
      },
    ],
    technologies: [
      {
        id: "VNM-A-AGR-01",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Plant genetics/Plant breeding",
        sourceTechnologyNameKo: "식물 유전·육종",
        priorityRank: 1,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF p.39",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 우선기술 Table 12에서 1순위로 제시",
        noteKo: "",
      },
      {
        id: "VNM-A-AGR-02",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Rice to upland grains",
        sourceTechnologyNameKo: "벼 재배지의 밭작물 전환",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF p.39",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 우선기술 Table 12에서 2순위로 제시",
        noteKo: "",
      },
      {
        id: "VNM-A-AGR-03",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Triple cropping to double cropping plus shrimp/fish/poultry farming",
        sourceTechnologyNameKo: "3모작→2모작 및 수산·가금 복합전환",
        priorityRank: 3,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF p.39",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 우선기술 Table 12에서 3순위로 제시",
        noteKo: "",
      },
      {
        id: "VNM-A-FOR-01",
        track: "adaptation",
        sectorKo: "산림·토지",
        sourceTechnologyName:
          "Plant science / plant genetics for drought, flood and disease resistance",
        sourceTechnologyNameKo: "가뭄·홍수·병해 저항성 산림 육종",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "forest-ecosystem",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 79",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "산림 적응 우선기술로 plant science/plant genetics를 제시",
        noteKo: "",
      },
      {
        id: "VNM-A-FOR-02",
        track: "adaptation",
        sectorKo: "산림·토지",
        sourceTechnologyName: "Agro-forestry",
        sourceTechnologyNameKo: "혼농임업",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "forest-ecosystem",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 88-90",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "산림 적응 우선기술이며 TAP에서 즉시 추진 필요성이 제시됨",
        noteKo: "",
      },
      {
        id: "VNM-A-COAST-01",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Integrated Coastal Zone Management (ICZM)",
        sourceTechnologyNameKo: "통합연안관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 46-47",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안관리 우선 적응기술 목록과 MCDA 결과에 포함",
        noteKo: "",
      },
      {
        id: "VNM-A-COAST-02",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Sea dykes",
        sourceTechnologyNameKo: "해안 제방",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 46-47",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안관리 우선 적응기술이며 높은 MCDA 점수로 제시",
        noteKo: "",
      },
      {
        id: "VNM-A-COAST-03",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Coastal wetland rehabilitation",
        sourceTechnologyNameKo: "연안 습지 복원",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 46-47",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안관리 우선 적응기술 목록에 포함",
        noteKo: "",
      },
      {
        id: "VNM-A-COAST-04",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Flood warning system",
        sourceTechnologyNameKo: "홍수 경보시스템",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "climate-monitoring-diagnosis",
        mappingConfidence: "high",
        sourcePages: "PDF pp.12, 46-47",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "연안관리 우선 적응기술 목록에 flood warning system 포함",
        noteKo: "",
      },
      {
        id: "VNM-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Rooftop rainfall collection for household usage",
        sourceTechnologyNameKo: "가정용 지붕 빗물집수",
        priorityRank: 1,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.52",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 적응기술 우선순위 Table 20의 1번 항목",
        noteKo: "",
      },
      {
        id: "VNM-A-WAT-02",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Harvesting runoff water",
        sourceTechnologyNameKo: "유출수 집수",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.52, 104",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 적응기술 우선순위 및 TAP에 포함",
        noteKo: "",
      },
      {
        id: "VNM-A-WAT-03",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Integrated River Basin Management (IRBM)",
        sourceTechnologyNameKo: "통합 유역관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.51, 104-106, 184",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "수자원 우선기술·TAP 및 국제지원 Project Idea가 확인됨",
        noteKo: "",
      },
      {
        id: "VNM-M-AGR-01",
        track: "mitigation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Anaerobic manure digestion to produce biogas fuels",
        sourceTechnologyNameKo: "가축분뇨 혐기소화·바이오가스",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "methane-treatment",
        mappingConfidence: "high",
        sourcePages: "PDF pp.47-48, 85",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        evidenceAnchorKo: "농업 감축 3대 우선기술 중 biogas technology",
        noteKo: "",
      },
      {
        id: "VNM-M-AGR-02",
        track: "mitigation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Nutrition improvement through controlled fodder supplements",
        sourceTechnologyNameKo: "사료 보충을 통한 가축 영양개선",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: null,
        mappingConfidence: "not-mapped",
        sourcePages: "PDF pp.47-48",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "농업 감축 우선기술이나 38대 체계에 동일한 사료관리 기술이 없어 강제 매핑하지 않음",
        noteKo: "",
      },
      {
        id: "VNM-M-AGR-03",
        track: "mitigation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Wet and dry irrigation in certain rice growth stages",
        sourceTechnologyNameKo: "벼 생육단계 간단관개(AWD 계열)",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "methane-treatment",
        mappingConfidence: "medium",
        sourcePages: "PDF pp.47-48, 85",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "메탄배출 저감이 명시되어 기능 기준으로 메탄 처리 기술에 근접 매핑",
        noteKo:
          "38대 체계와 원문 기술의 범주가 완전히 동일하지 않아 중간 신뢰도로 표시",
      },
      {
        id: "VNM-M-ENE-01",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Wind power",
        sourceTechnologyNameKo: "풍력 발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "wind",
        mappingConfidence: "high",
        sourcePages: "PDF p.161",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "Project Idea에서 wind power가 GHG mitigation 우선기술임을 명시",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "mitigation",
        sectorKo: "농업",
        categoriesKo: ["재정·경제", "기술", "정보·인식"],
        barriersKo: [
          "바이오가스 설비의 높은 투자비·운영유지비",
          "농가의 정보·기술 이해 부족",
          "간단관개용 관개·배수시스템의 높은 투자·O&M 비용과 전통적 담수재배 관행",
        ],
        sourcePages: "PDF pp.85, 151",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 농업 감축기술의 이전·확산 장벽을 원문에서 확인",
      },
      {
        track: "adaptation",
        sectorKo: "연안",
        categoriesKo: ["재정·경제", "기술·설계", "사회·환경"],
        barriersKo: [
          "해안제방의 대규모 투자·유지관리 비용",
          "적절한 설계 선택의 어려움",
          "토지점유·경관·사회환경영향 문제",
        ],
        sourcePages: "PDF p.152",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        evidenceAnchorKo: "Sea dykes 장벽 기술 부분에서 확인",
      },
    ],
    projectIdeas: [
      {
        id: "VNM-PI-M-WIND",
        track: "mitigation",
        sectorKo: "전력",
        titleKo: "풍력발전 재정지원·보조 메커니즘 설계",
        linkedTechnologyRecordIds: ["VNM-M-ENE-01"],
        sourcePages: "PDF p.161",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Mitigation_2012.pdf",
        timeframe: "2012-2015",
        budgetUsd: 50000,
        implementingOrganizationsKo: [
          "산업무역부(MOIT)",
          "재정부(MOF)",
          "천연자원환경부(MONRE)",
          "EVN",
        ],
        evidenceAnchorKo:
          "풍력 시장 활성화를 위한 금융지원 메커니즘 Project Idea",
      },
      {
        id: "VNM-PI-A-IRBM",
        track: "adaptation",
        sectorKo: "수자원",
        titleKo:
          "Climate change and integrated management of river basins in Vietnam",
        linkedTechnologyRecordIds: ["VNM-A-WAT-03"],
        sourcePages: "PDF p.184",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/VNM-TNA-TNA_TAP_and_Project_Ideas_Adaptation_2012.pdf",
        timeframe: null,
        budgetUsd: null,
        implementingOrganizationsKo: [],
        evidenceAnchorKo: "IRBM 국제지원 Project Idea가 명시됨",
      },
    ],
  },
  {
    countryIso3: "BGD",
    countryNameKo: "방글라데시",
    coverageLabelKo: "TNA/TAP 상세자료 · 적응·감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "Technology Action Plans – Adaptation",
        year: 2012,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
      },
      {
        title: "Technology Action Plans – Mitigation",
        year: 2012,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
      },
    ],
    technologies: [
      {
        id: "BGD-A-AGR-01",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Salinity tolerant rice variety",
        sourceTechnologyNameKo: "염분내성 벼 품종",
        priorityRank: 1,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF pp.56-71",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 적응 우선기술 1순위 및 상세 TAP 확인",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-02",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Drought tolerant rice variety",
        sourceTechnologyNameKo: "가뭄내성 벼 품종",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF pp.56-77",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 적응 우선기술 2순위 및 TAP 확인",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-03",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Short maturing rice variety",
        sourceTechnologyNameKo: "단기숙성 벼 품종",
        priorityRank: 3,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF p.56",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "농업 적응 우선기술 3순위",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-04",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Training on improved farming, irrigation, water and soil management",
        sourceTechnologyNameKo: "개선 영농·관개·물·토양관리 교육",
        priorityRank: 4,
        selectedForTap: true,
        mappedTechnologyId: "adaptation-foundation",
        mappingConfidence: "medium",
        sourcePages: "PDF p.56",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "기술 보급을 위한 교육·역량 요소로 적응기반 기술에 기능 매핑",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-05",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName:
          "Climate-smart agriculture technology dissemination center",
        sourceTechnologyNameKo: "기후스마트농업 기술보급센터",
        priorityRank: 5,
        selectedForTap: true,
        mappedTechnologyId: "adaptation-foundation",
        mappingConfidence: "high",
        sourcePages: "PDF p.56",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "기후스마트농업 기술확산 기반을 우선항목으로 제시",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-06",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Special agricultural R&D centre",
        sourceTechnologyNameKo: "기후적응 농업 R&D 센터",
        priorityRank: 6,
        selectedForTap: true,
        mappedTechnologyId: "adaptation-foundation",
        mappingConfidence: "high",
        sourcePages: "PDF p.56",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "전문 농업 R&D 기반 구축을 우선항목으로 제시",
        noteKo: "",
      },
      {
        id: "BGD-A-AGR-07",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Land use planning",
        sourceTechnologyNameKo: "토지이용계획",
        priorityRank: 7,
        selectedForTap: true,
        mappedTechnologyId: "adaptation-foundation",
        mappingConfidence: "medium",
        sourcePages: "PDF p.56",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "적응 실행을 위한 계획수단으로 적응기반 기술에 기능 매핑",
        noteKo: "",
      },
      {
        id: "BGD-A-DIS-01",
        track: "adaptation",
        sectorKo: "재난관리",
        sourceTechnologyName:
          "Comprehensive disaster management including early warning",
        sourceTechnologyNameKo: "조기경보를 포함한 종합재난관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "climate-monitoring-diagnosis",
        mappingConfidence: "medium",
        sourcePages: "PDF pp.34-35",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "조기경보·예측·지역참여·데이터 도구를 포함하는 적응 TAP",
        noteKo: "",
      },
      {
        id: "BGD-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Tidal River Management",
        sourceTechnologyNameKo: "조석하천관리(TRM)",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.42-43",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "조석흐름 시뮬레이션·수자원관리를 포함한 TAP",
        noteKo: "",
      },
      {
        id: "BGD-M-ENE-01",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Advanced Gas Combustion Turbine",
        sourceTechnologyNameKo: "고효율 가스터빈",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "power-generation-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 감축기술 목록에 포함",
        noteKo: "",
      },
      {
        id: "BGD-M-ENE-02",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Natural Gas Combined Cycle",
        sourceTechnologyNameKo: "천연가스 복합발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "power-generation-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 감축기술 목록에 포함",
        noteKo: "",
      },
      {
        id: "BGD-M-ENE-03",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Advanced Generation NGCC",
        sourceTechnologyNameKo: "고도화 천연가스 복합발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "power-generation-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 감축기술 목록에 포함",
        noteKo: "",
      },
      {
        id: "BGD-M-ENE-04",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Advanced Pulverized Coal (single/double unit)",
        sourceTechnologyNameKo: "고효율 미분탄 발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "power-generation-efficiency",
        mappingConfidence: "medium",
        sourcePages: "PDF pp.10-12",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "2012 TNA의 역사적 우선기술로 발전효율에 기능 매핑",
        noteKo: "현재 협력 권고가 아니라 당시 TNA 기록임",
      },
      {
        id: "BGD-M-ENE-05",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Integrated Gasification Combined Cycle (IGCC)",
        sourceTechnologyNameKo: "석탄가스화복합발전(IGCC)",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "coal-liquefaction-gasification",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 감축기술 목록의 IGCC를 직접 매핑",
        noteKo: "",
      },
      {
        id: "BGD-M-ENE-06",
        track: "mitigation",
        sectorKo: "전력",
        sourceTechnologyName: "Solar PV",
        sourceTechnologyNameKo: "태양광 발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "solar-pv",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "우선 감축기술 목록에 Solar PV 포함",
        noteKo: "",
      },
      {
        id: "BGD-M-BLD-01",
        track: "mitigation",
        sectorKo: "건물·조명",
        sourceTechnologyName: "Linear Fluorescent Lamp",
        sourceTechnologyNameKo: "고효율 선형 형광등",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "building-efficiency",
        mappingConfidence: "medium",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "수요측 조명 효율기술로 건물효율에 기능 매핑",
        noteKo: "",
      },
      {
        id: "BGD-M-BLD-02",
        track: "mitigation",
        sectorKo: "건물·조명",
        sourceTechnologyName: "Compact Fluorescent Lamp (CFL)",
        sourceTechnologyNameKo: "고효율 CFL 조명",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "building-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "수요측 조명 효율기술로 건물효율에 매핑",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "adaptation",
        sectorKo: "농업",
        categoriesKo: [
          "재정·경제",
          "실증·보급",
          "역량",
          "정책·제도",
          "지식재산",
        ],
        barriersKo: [
          "장기 투자와 공공 연구재원 부족",
          "현장 실증·extension 체계 필요",
          "기술·기관 역량 부족",
          "정책·제도 및 IPR 관련 장벽",
        ],
        sourcePages: "PDF pp.58-64",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo:
          "농업 적응 우선기술의 이전·확산 장벽과 대응조치를 TAP에서 확인",
      },
      {
        track: "mitigation",
        sectorKo: "전력",
        categoriesKo: ["기술·역량", "재정·투자", "정책·제도", "조달·관리"],
        barriersKo: [
          "고도기술·운영역량 부족",
          "재원·PPP·국제협력·IPR 이슈",
          "정책 이행을 위한 재원·훈련인력 부족",
          "공공조달·관리 역량 이슈",
        ],
        sourcePages: "PDF pp.11-12",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "전력 감축 우선기술 실행 장벽을 원문에서 확인",
      },
    ],
    projectIdeas: [
      {
        id: "BGD-PI-M-APC",
        track: "mitigation",
        sectorKo: "전력",
        titleKo: "1,300 MW Advanced Pulverized Coal (Double Unit) plant",
        linkedTechnologyRecordIds: ["BGD-M-ENE-04"],
        sourcePages: "PDF p.11",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/BGD-TAP-TAP_Mitigation_2012.pdf",
        timeframe: null,
        budgetUsd: null,
        implementingOrganizationsKo: [],
        evidenceAnchorKo: "2012 TAP의 Project Idea로 제시된 역사적 사업안",
      },
    ],
  },
  {
    countryIso3: "PHL",
    countryNameKo: "필리핀",
    coverageLabelKo: "TNA 상세자료 · 감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "Technology Needs Assessment for Climate Change Mitigation",
        year: 2018,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
      },
    ],
    technologies: [
      {
        id: "PHL-M-ENE-01",
        track: "mitigation",
        sectorKo: "에너지",
        sourceTechnologyName: "Next Generation Vehicle Testing Laboratory",
        sourceTechnologyNameKo: "차세대차 시험연구소",
        priorityRank: 1,
        selectedForTap: false,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "medium",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo:
          "에너지 부문 1순위 기술로 전기·하이브리드차 시험기반을 제시",
        noteKo: "시험 인프라이므로 수송효율 기술에 기능 매핑",
      },
      {
        id: "PHL-M-ENE-02",
        track: "mitigation",
        sectorKo: "에너지",
        sourceTechnologyName: "Solar Thermal System",
        sourceTechnologyNameKo: "태양열 시스템",
        priorityRank: 2,
        selectedForTap: false,
        mappedTechnologyId: "solar-thermal",
        mappingConfidence: "high",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "에너지 부문 2순위 기술",
        noteKo: "",
      },
      {
        id: "PHL-M-ENE-03",
        track: "mitigation",
        sectorKo: "에너지",
        sourceTechnologyName: "Waste Heat Recovery System",
        sourceTechnologyNameKo: "폐열회수 시스템",
        priorityRank: 3,
        selectedForTap: false,
        mappedTechnologyId: "heat-integration",
        mappingConfidence: "high",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "에너지 부문 3순위 기술",
        noteKo: "",
      },
      {
        id: "PHL-M-WST-01",
        track: "mitigation",
        sectorKo: "폐기물",
        sourceTechnologyName: "Eco-efficient Soil Cover Using Composts",
        sourceTechnologyNameKo: "퇴비 활용 친환경 복토",
        priorityRank: 1,
        selectedForTap: false,
        mappedTechnologyId: "waste-resource",
        mappingConfidence: "medium",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "폐기물 부문 1순위 기술",
        noteKo: "",
      },
      {
        id: "PHL-M-WST-02",
        track: "mitigation",
        sectorKo: "폐기물",
        sourceTechnologyName: "Anaerobic Digester",
        sourceTechnologyNameKo: "혐기성 소화조",
        priorityRank: 2,
        selectedForTap: false,
        mappedTechnologyId: "methane-treatment",
        mappingConfidence: "high",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "폐기물 부문 2순위 기술",
        noteKo: "",
      },
      {
        id: "PHL-M-TRN-01",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Motor Vehicle Inspection System (MVIS)",
        sourceTechnologyNameKo: "자동차 검사시스템",
        priorityRank: 1,
        selectedForTap: false,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "수송 부문 1순위 기술",
        noteKo: "",
      },
      {
        id: "PHL-M-TRN-02",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Biogas for Transport",
        sourceTechnologyNameKo: "수송용 바이오가스",
        priorityRank: 2,
        selectedForTap: false,
        mappedTechnologyId: "bioenergy",
        mappingConfidence: "high",
        sourcePages: "PDF p.70",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/PHL-TNA-TNA_Mitigation_2018.pdf",
        evidenceAnchorKo: "수송 부문 2순위 기술",
        noteKo: "",
      },
    ],
    barriers: [],
    projectIdeas: [],
  },
  {
    countryIso3: "KHM",
    countryNameKo: "캄보디아",
    coverageLabelKo: "TNA/TAP 상세자료 · 적응·감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "TNA and TAP – Adaptation",
        year: 2013,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
      },
      {
        title: "TNA and TAP – Mitigation",
        year: 2013,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
      },
    ],
    technologies: [
      {
        id: "KHM-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Rainwater harvesting and wells",
        sourceTechnologyNameKo: "빗물집수 및 우물",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.10, 88, 96-97",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
        evidenceAnchorKo:
          "가정용 안전한 물 공급 우선기술과 Project Idea에 포함",
        noteKo: "",
      },
      {
        id: "KHM-A-WAT-02",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName:
          "Small reservoirs, small dams and micro-catchments",
        sourceTechnologyNameKo: "소규모 저수지·댐·미소유역 집수",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
        evidenceAnchorKo: "지역사회 물 공급 우선기술로 제시",
        noteKo: "",
      },
      {
        id: "KHM-A-COA-01",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Mangrove Management",
        sourceTechnologyNameKo: "맹그로브 관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF p.10",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
        evidenceAnchorKo: "연안 부문 TAP 우선기술",
        noteKo: "",
      },
      {
        id: "KHM-M-TRN-01",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Energy Efficient Urban Mass Transport",
        sourceTechnologyNameKo: "에너지효율 도시 대중교통",
        priorityRank: 1,
        selectedForTap: true,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF pp.30, 37",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
        evidenceAnchorKo: "수송 부문 1순위이며 TAP 대상 우선기술",
        noteKo: "",
      },
      {
        id: "KHM-M-TRN-02",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Vehicle Emission Standards",
        sourceTechnologyNameKo: "차량 배출기준",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "medium",
        sourcePages: "PDF pp.30, 37",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
        evidenceAnchorKo: "수송 부문 2순위이며 TAP 대상 우선기술",
        noteKo: "규제·검사 수단을 포함하므로 기능 매핑",
      },
      {
        id: "KHM-M-EE-01",
        track: "mitigation",
        sectorKo: "에너지효율",
        sourceTechnologyName: "Energy Efficient Lighting",
        sourceTechnologyNameKo: "고효율 조명",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: "building-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF pp.33, 37-40",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
        evidenceAnchorKo: "에너지효율 부문 순위표와 최종 TAP 선택기술에 포함",
        noteKo: "",
      },
      {
        id: "KHM-M-EE-02",
        track: "mitigation",
        sectorKo: "에너지효율",
        sourceTechnologyName: "Energy Efficient Household Appliances",
        sourceTechnologyNameKo: "고효율 가전제품",
        priorityRank: 3,
        selectedForTap: true,
        mappedTechnologyId: "building-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF pp.33, 37-40",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
        evidenceAnchorKo: "에너지효율 부문 순위표와 최종 TAP 선택기술에 포함",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "adaptation",
        sectorKo: "수자원",
        categoriesKo: ["재정·경제", "표준·제도", "정보·역량"],
        barriersKo: [
          "빗물집수 시스템의 설치비와 제한된 금융자원",
          "표준·법규·인센티브 부족",
          "지식 보급 및 전문가·extension officer 부족",
        ],
        sourcePages: "PDF pp.86-88",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
        evidenceAnchorKo:
          "Rainwater harvesting 장벽트리와 Project Idea에서 확인",
      },
      {
        track: "mitigation",
        sectorKo: "에너지효율",
        categoriesKo: ["비용·시장", "정보·인식", "규제·표준"],
        barriersKo: [
          "품질 CFL의 높은 가격과 낮은 인식",
          "가전 효율 라벨링 필요",
          "에너지효율 가이드라인·규정 부족",
        ],
        sourcePages: "PDF pp.39-40",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Mitigation_2013.pdf",
        evidenceAnchorKo: "에너지효율 우선기술의 장벽·해결방안에서 확인",
      },
    ],
    projectIdeas: [
      {
        id: "KHM-PI-A-RWH",
        track: "adaptation",
        sectorKo: "수자원",
        titleKo:
          "농촌 물공급 전략에 기후변화 고려를 통합하고 지방 역량을 강화하는 빗물집수 사업",
        linkedTechnologyRecordIds: ["KHM-A-WAT-01"],
        sourcePages: "PDF pp.88, 96-97",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/KHM-TNA-TNA_and_TAP_Adaptation_2013.pdf",
        timeframe: null,
        budgetUsd: null,
        implementingOrganizationsKo: [
          "Ministry of Rural Development",
          "Provincial Departments of Rural Development",
        ],
        evidenceAnchorKo:
          "개선된 빗물집수 시스템과 기후정보 기반 계획역량을 결합한 Project Idea",
      },
    ],
  },
  {
    countryIso3: "IDN",
    countryNameKo: "인도네시아",
    coverageLabelKo: "TNA/TAP 상세자료 · 적응·감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "TNA and TAP – Adaptation",
        year: 2012,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Adaptation_2012.pdf",
      },
      {
        title: "TNA and TAP – Mitigation",
        year: 2012,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
      },
    ],
    technologies: [
      {
        id: "IDN-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Rain harvesting",
        sourceTechnologyNameKo: "빗물집수",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.26",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 적응 우선기술 결론에 포함",
        noteKo: "",
      },
      {
        id: "IDN-A-WAT-02",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Domestic water recycling",
        sourceTechnologyNameKo: "생활용수 재이용",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.26",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 적응 우선기술 결론에 포함",
        noteKo: "",
      },
      {
        id: "IDN-A-WAT-03",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Modeling water resources projection",
        sourceTechnologyNameKo: "수자원 전망 모델링",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "climate-projection",
        mappingConfidence: "high",
        sourcePages: "PDF p.26",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 적응 우선기술 결론에 포함",
        noteKo: "",
      },
      {
        id: "IDN-A-AGR-01",
        track: "adaptation",
        sectorKo: "농축산",
        sourceTechnologyName:
          "Climate-resilient beef cattle / disease resistance",
        sourceTechnologyNameKo: "기후회복력 축우·질병저항성",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "medium",
        sourcePages: "PDF pp.25-26",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "식량안보·축산 적응기술로 제시",
        noteKo: "원문 기술 범주가 넓어 중간 신뢰도",
      },
      {
        id: "IDN-M-FOR-01",
        track: "mitigation",
        sectorKo: "산림·이탄",
        sourceTechnologyName:
          "Measurement and monitoring of carbon sequestration and emissions",
        sourceTechnologyNameKo: "탄소흡수·배출 측정 및 모니터링",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "carbon-sink",
        mappingConfidence: "high",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산림 부문 최종 우선기술군으로 선정",
        noteKo: "",
      },
      {
        id: "IDN-M-FOR-02",
        track: "mitigation",
        sectorKo: "산림·이탄",
        sourceTechnologyName: "Peat remapping",
        sourceTechnologyNameKo: "이탄지 재매핑",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "carbon-sink",
        mappingConfidence: "medium",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산림·이탄 부문 우선기술군에 포함",
        noteKo: "공간정보 수단이므로 탄소흡수원 관리에 기능 매핑",
      },
      {
        id: "IDN-M-FOR-03",
        track: "mitigation",
        sectorKo: "산림·이탄",
        sourceTechnologyName: "Water management in peat areas",
        sourceTechnologyNameKo: "이탄지 수위·물관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "carbon-sink",
        mappingConfidence: "medium",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산림·이탄 부문 우선기술군에 포함",
        noteKo: "이탄 탄소보전을 위한 관리기술로 기능 매핑",
      },
      {
        id: "IDN-M-ENE-01",
        track: "mitigation",
        sectorKo: "에너지",
        sourceTechnologyName: "Solar PV",
        sourceTechnologyNameKo: "태양광 발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "solar-pv",
        mappingConfidence: "high",
        sourcePages: "PDF pp.93, 155-158",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "에너지 부문 최종 우선기술로 PV 유지",
        noteKo: "",
      },
      {
        id: "IDN-M-IND-01",
        track: "mitigation",
        sectorKo: "산업",
        sourceTechnologyName: "Regenerative Burner Combustion System (RBCS)",
        sourceTechnologyNameKo: "축열식 버너 연소시스템",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "industrial-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF pp.97, 112-113",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "에너지/산업 우선기술에서 효율 모터를 대체하여 RBCS가 최종 선택",
        noteKo: "",
      },
      {
        id: "IDN-M-WST-01",
        track: "mitigation",
        sectorKo: "폐기물",
        sourceTechnologyName: "Mechanical-biological treatment",
        sourceTechnologyNameKo: "기계·생물학적 폐기물처리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "waste-resource",
        mappingConfidence: "high",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "폐기물 부문 우선기술",
        noteKo: "",
      },
      {
        id: "IDN-M-WST-02",
        track: "mitigation",
        sectorKo: "폐기물",
        sourceTechnologyName: "In-vessel composting",
        sourceTechnologyNameKo: "밀폐형 퇴비화",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "waste-resource",
        mappingConfidence: "high",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "폐기물 부문 우선기술",
        noteKo: "",
      },
      {
        id: "IDN-M-WST-03",
        track: "mitigation",
        sectorKo: "폐기물",
        sourceTechnologyName: "Low-solid anaerobic digestion",
        sourceTechnologyNameKo: "저고형물 혐기소화",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "methane-treatment",
        mappingConfidence: "high",
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "폐기물 부문 우선기술",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "mitigation",
        sectorKo: "전 부문",
        categoriesKo: [
          "규제",
          "재정",
          "제도·기관",
          "역량",
          "지식재산",
          "사회·문화",
        ],
        barriersKo: [
          "우선기술 이전을 위해 regulatory, financial, institutional, capacity building, IPR, socio-cultural 장벽을 분석하도록 TNA가 구성됨",
        ],
        sourcePages: "PDF Executive Summary",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/IDN-TNA-TNA_and_TAP_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "최종 우선기술 선정 후 장벽 분석 범주를 공식 보고서가 명시",
      },
    ],
    projectIdeas: [],
  },
  {
    countryIso3: "LAO",
    countryNameKo: "라오스",
    coverageLabelKo: "TAP 상세자료 · 적응",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "Technology Action Plan for Climate Change Adaptation",
        year: 2018,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
      },
    ],
    technologies: [
      {
        id: "LAO-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원·재난",
        sourceTechnologyName: "End-to-end Early Warning System",
        sourceTechnologyNameKo: "종단간 조기경보시스템",
        priorityRank: 1,
        selectedForTap: true,
        mappedTechnologyId: "climate-monitoring-diagnosis",
        mappingConfidence: "high",
        sourcePages: "PDF pp.14-28, 148-149",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo:
          "8개 우선 적응기술·실행계획 1순위이며 Project Idea 확인",
        noteKo: "",
      },
      {
        id: "LAO-A-WAT-02",
        track: "adaptation",
        sectorKo: "수자원·재난",
        sourceTechnologyName: "Disaster Impact Reduction Fund",
        sourceTechnologyNameKo: "재난영향저감기금",
        priorityRank: 2,
        selectedForTap: true,
        mappedTechnologyId: null,
        mappingConfidence: "not-mapped",
        sourcePages: "PDF p.14",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo:
          "우선순위 2번이나 재원·제도수단으로 38대 기술에 강제 매핑하지 않음",
        noteKo: "",
      },
      {
        id: "LAO-A-WAT-03",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "River basin management",
        sourceTechnologyNameKo: "유역관리",
        priorityRank: 3,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.14",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo: "우선 적응기술 3순위",
        noteKo: "",
      },
      {
        id: "LAO-A-WAT-04",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Climate resilient water supply system",
        sourceTechnologyNameKo: "기후회복력 물공급 시스템",
        priorityRank: 4,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF p.14",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo: "우선 적응기술 4순위",
        noteKo: "",
      },
      {
        id: "LAO-A-AGR-01",
        track: "adaptation",
        sectorKo: "농축산",
        sourceTechnologyName: "Livestock disease prevention and control",
        sourceTechnologyNameKo: "가축 질병 예방·통제",
        priorityRank: 5,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "TAP priority list",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo: "우선 적응기술 5순위",
        noteKo: "",
      },
      {
        id: "LAO-A-AGR-02",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Agricultural development subsidy mechanism",
        sourceTechnologyNameKo: "농업개발 보조금 메커니즘",
        priorityRank: 6,
        selectedForTap: true,
        mappedTechnologyId: null,
        mappingConfidence: "not-mapped",
        sourcePages: "TAP priority list",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo:
          "우선순위 6번이나 정책·재정수단으로 38대 기술에 강제 매핑하지 않음",
        noteKo: "",
      },
      {
        id: "LAO-A-INF-01",
        track: "adaptation",
        sectorKo: "농촌인프라",
        sourceTechnologyName: "Climate resilient rural infrastructure",
        sourceTechnologyNameKo: "기후회복력 농촌 인프라",
        priorityRank: 7,
        selectedForTap: true,
        mappedTechnologyId: "adaptation-foundation",
        mappingConfidence: "medium",
        sourcePages: "TAP priority list",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo:
          "우선 적응기술·관행 7순위로 적응기반 기술에 기능 매핑",
        noteKo: "",
      },
      {
        id: "LAO-A-AGR-03",
        track: "adaptation",
        sectorKo: "농업",
        sourceTechnologyName: "Crop diversification",
        sourceTechnologyNameKo: "작물 다변화",
        priorityRank: 8,
        selectedForTap: true,
        mappedTechnologyId: "agriculture-livestock-fisheries",
        mappingConfidence: "high",
        sourcePages: "PDF p.148 and project ideas section",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo:
          "우선 적응기술 8순위이며 Project Idea가 별도로 제시됨",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "adaptation",
        sectorKo: "수자원·재난",
        categoriesKo: [
          "재정·경제",
          "기관·인적역량",
          "정보·인식",
          "기술",
          "법·제도",
        ],
        barriersKo: [
          "EWS 개발·지속운영을 가로막는 주요 장벽을 6개 영역으로 분류",
          "재원동원, 기관역량, 정보·인식, 기술, 법적 프레임워크 등의 개선조치를 TAP에 연결",
        ],
        sourcePages: "PDF pp.15-16",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        evidenceAnchorKo: "End-to-end EWS의 BAEF/TAP에서 장벽영역을 확인",
      },
    ],
    projectIdeas: [
      {
        id: "LAO-PI-A-EWS",
        track: "adaptation",
        sectorKo: "수자원·재난",
        titleKo: "Piloting the end-to-end multi-hazards early warning system",
        linkedTechnologyRecordIds: ["LAO-A-WAT-01"],
        sourcePages: "PDF pp.148-149",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        timeframe: "2018-2022",
        budgetUsd: 13500000,
        implementingOrganizationsKo: [
          "Ministry of Natural Resources and Environment (MONRE)",
          "Department of Climate Change (DCC)",
          "Meteorology and Hydrology (DMH)",
        ],
        evidenceAnchorKo:
          "다중위험 조기경보 pilot Project Idea · 예산 US$13.5m",
      },
      {
        id: "LAO-PI-A-RBM",
        track: "adaptation",
        sectorKo: "수자원",
        titleKo:
          "Piloting water demand and supply including floods and drought mapping for climate resilient river basin development and management",
        linkedTechnologyRecordIds: ["LAO-A-WAT-03"],
        sourcePages: "PDF p.148",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        timeframe: null,
        budgetUsd: null,
        implementingOrganizationsKo: [],
        evidenceAnchorKo:
          "기후회복력 유역개발을 위한 수요·공급·홍수·가뭄 매핑 Project Idea",
      },
      {
        id: "LAO-PI-A-CROP",
        track: "adaptation",
        sectorKo: "농업",
        titleKo: "Crop diversification",
        linkedTechnologyRecordIds: ["LAO-A-AGR-03"],
        sourcePages: "Project Ideas section",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LAO-TAP-TAP_Adaptation_2018.pdf",
        timeframe: null,
        budgetUsd: null,
        implementingOrganizationsKo: [],
        evidenceAnchorKo: "농업부문 Project Idea 중 작물 다변화가 명시됨",
      },
    ],
  },
  {
    countryIso3: "LKA",
    countryNameKo: "스리랑카",
    coverageLabelKo: "TAP 상세자료 · 적응·감축",
    sourceReviewAsOf: "2026-08-18",
    officialDocuments: [
      {
        title: "Technology Action Plan – Adaptation",
        year: 2012,
        track: "adaptation",
        url: "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
      },
      {
        title: "Technology Action Plan – Mitigation",
        year: 2012,
        track: "mitigation",
        url: "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
      },
    ],
    technologies: [
      {
        id: "LKA-A-HEA-01",
        track: "adaptation",
        sectorKo: "보건",
        sourceTechnologyName: "Early warning systems and networking for health",
        sourceTechnologyNameKo: "보건 조기경보·네트워킹",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "climate-monitoring-diagnosis",
        mappingConfidence: "high",
        sourcePages: "PDF health sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "보건부문 3개 우선기술 중 조기경보·네트워킹",
        noteKo: "",
      },
      {
        id: "LKA-A-HEA-02",
        track: "adaptation",
        sectorKo: "보건",
        sourceTechnologyName:
          "Knowledge and skills transfer to health personnel",
        sourceTechnologyNameKo: "보건인력 지식·기술 이전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "health",
        mappingConfidence: "high",
        sourcePages: "PDF health sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "보건부문 우선기술로 역량·지식 이전을 제시",
        noteKo: "",
      },
      {
        id: "LKA-A-HEA-03",
        track: "adaptation",
        sectorKo: "보건",
        sourceTechnologyName: "Health care waste management",
        sourceTechnologyNameKo: "보건의료 폐기물 관리",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "health",
        mappingConfidence: "medium",
        sourcePages: "PDF health sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "보건부문 적응 우선기술로 제시",
        noteKo: "적응 맥락을 보존하기 위해 health에 기능 매핑",
      },
      {
        id: "LKA-A-WAT-01",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Restoration of minor tank networks",
        sourceTechnologyNameKo: "소규모 저수지 네트워크 복원",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.101-104",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 부문 3대 우선기술 중 하나",
        noteKo: "",
      },
      {
        id: "LKA-A-WAT-02",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Rooftop rainwater harvesting",
        sourceTechnologyNameKo: "지붕 빗물집수",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.101-104",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 부문 우선기술 및 O&M 개선 필요성 제시",
        noteKo: "",
      },
      {
        id: "LKA-A-WAT-03",
        track: "adaptation",
        sectorKo: "수자원",
        sourceTechnologyName: "Boreholes / tube wells",
        sourceTechnologyNameKo: "관정·튜브웰",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "water",
        mappingConfidence: "high",
        sourcePages: "PDF pp.101-104",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 부문 우선기술",
        noteKo: "",
      },
      {
        id: "LKA-A-COA-01",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Sand dune rehabilitation",
        sourceTechnologyNameKo: "사구 복원",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF coastal sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안부문 우선기술",
        noteKo: "",
      },
      {
        id: "LKA-A-COA-02",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Mangrove restoration",
        sourceTechnologyNameKo: "맹그로브 복원",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF coastal sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안부문 우선기술",
        noteKo: "",
      },
      {
        id: "LKA-A-COA-03",
        track: "adaptation",
        sectorKo: "연안",
        sourceTechnologyName: "Coral reef restoration",
        sourceTechnologyNameKo: "산호초 복원",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "land-coastal",
        mappingConfidence: "high",
        sourcePages: "PDF coastal sector TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "연안부문 우선기술",
        noteKo: "",
      },
      {
        id: "LKA-M-TRN-01",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Non-motorized transport and public transit",
        sourceTechnologyNameKo: "비동력교통·대중교통",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF transport TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "수송부문 우선기술군",
        noteKo: "",
      },
      {
        id: "LKA-M-TRN-02",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Carpooling and park-and-ride",
        sourceTechnologyNameKo: "카풀·Park-and-Ride",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF transport TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "수송부문 우선기술군",
        noteKo: "",
      },
      {
        id: "LKA-M-TRN-03",
        track: "mitigation",
        sectorKo: "수송",
        sourceTechnologyName: "Electrification of the existing railway system",
        sourceTechnologyNameKo: "기존 철도 전철화",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "transport-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF p.69",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "철도 전철화 Action Plan과 PPP 재원조달 조치가 제시됨",
        noteKo: "",
      },
      {
        id: "LKA-M-IND-01",
        track: "mitigation",
        sectorKo: "산업",
        sourceTechnologyName: "Energy Efficient Motors",
        sourceTechnologyNameKo: "고효율 모터",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "industrial-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF industry TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산업부문 우선기술 및 상세 장벽·Action Plan 확인",
        noteKo: "",
      },
      {
        id: "LKA-M-IND-02",
        track: "mitigation",
        sectorKo: "산업",
        sourceTechnologyName: "Variable Speed Drives",
        sourceTechnologyNameKo: "가변속 드라이브(VSD)",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "industrial-efficiency",
        mappingConfidence: "high",
        sourcePages: "PDF industry TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산업부문 우선기술",
        noteKo: "",
      },
      {
        id: "LKA-M-IND-03",
        track: "mitigation",
        sectorKo: "산업",
        sourceTechnologyName: "Biomass residue based cogeneration / CHP",
        sourceTechnologyNameKo: "바이오매스 잔재 기반 열병합발전",
        priorityRank: null,
        selectedForTap: true,
        mappedTechnologyId: "biomass",
        mappingConfidence: "high",
        sourcePages: "PDF industry TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo: "산업부문 우선기술",
        noteKo: "",
      },
    ],
    barriers: [
      {
        track: "adaptation",
        sectorKo: "보건",
        categoriesKo: [
          "재정·경제",
          "기관역량",
          "네트워크",
          "인적역량",
          "정보·인식",
        ],
        barriersKo: [
          "3개 보건 우선기술 공통장벽으로 재정, 기관·조직역량, 네트워크, 인적기술, 정보·인식을 제시",
        ],
        sourcePages: "PDF p.71",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "보건부문 공통 장벽 5개 범주",
      },
      {
        track: "adaptation",
        sectorKo: "수자원",
        categoriesKo: [
          "자본비",
          "지속가능성",
          "정책·법 집행",
          "정보·인식",
          "공간 우선순위",
          "수질",
          "R&D",
        ],
        barriersKo: [
          "높은 초기자본비",
          "정책·법 집행 부족",
          "정보·인식 부족",
          "우선 설치지역 정보 부족",
          "수질과 R&D 제약",
        ],
        sourcePages: "PDF pp.101-104",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Adaptation_2012.pdf",
        evidenceAnchorKo: "수자원 3개 우선기술의 공통 장벽",
      },
      {
        track: "mitigation",
        sectorKo: "산업",
        categoriesKo: [
          "자본·금융",
          "규제·표준",
          "기관·역량",
          "운영·유지관리",
          "정보",
        ],
        barriersKo: [
          "고효율 모터 도입의 초기투자·금융 문제",
          "효율기준·규제 집행과 기관역량 부족",
          "기술인력·O&M·정보 부족",
        ],
        sourcePages: "PDF industry TAP",
        sourceUrl:
          "https://unfccc.int/ttclear/TNA/LKA-TAP-TAP_Mitigation_2012.pdf",
        evidenceAnchorKo:
          "Energy Efficient Motors 장벽분석과 Action Plan에서 확인",
      },
    ],
    projectIdeas: [],
  },
];

export const TNA_COUNTRY_PROFILE_BY_ISO3_V110 = new Map(
  TNA_COUNTRY_PROFILES_V110.map((item) => [item.countryIso3, item])
);

export function getTnaCountryProfileV110(
  iso3: string
): TnaCountryProfileV110 | null {
  return TNA_COUNTRY_PROFILE_BY_ISO3_V110.get(iso3) ?? null;
}
export function getMappedClimateTechnologyNameV110(
  technologyId: string | null
): string | null {
  if (!technologyId) return null;
  return CLIMATE_TECHNOLOGY_BY_ID.get(technologyId)?.nameKo ?? null;
}
export function countTnaTechnologyRecordsV110(): number {
  return TNA_COUNTRY_PROFILES_V110.reduce(
    (sum, profile) => sum + profile.technologies.length,
    0
  );
}
export function countTnaMappedRecordsV110(): number {
  return TNA_COUNTRY_PROFILES_V110.reduce(
    (sum, profile) =>
      sum +
      profile.technologies.filter((item) => Boolean(item.mappedTechnologyId))
        .length,
    0
  );
}
