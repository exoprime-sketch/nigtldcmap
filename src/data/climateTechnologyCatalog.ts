export type ClimateTechnologyCategory = "감축" | "적응" | "융복합";

export type ProjectType =
  | "수요조사"
  | "타당성조사"
  | "기술실증"
  | "설비 구축"
  | "기술이전"
  | "정책·제도 지원"
  | "역량강화"
  | "ODA 사업"
  | "기후기금 사업"
  | "민관협력"
  | "탄소감축 사업";

export interface ClimateTechnologyDefinition {
  id: string;
  nameKo: string;
  category: ClimateTechnologyCategory;
  relatedSectors: string[];
  defaultProjectTypes: ProjectType[];
}

const MITIGATION_PROJECTS: ProjectType[] = [
  "타당성조사",
  "기술실증",
  "설비 구축",
  "기술이전",
  "ODA 사업",
  "기후기금 사업",
  "민관협력",
];

const ADAPTATION_PROJECTS: ProjectType[] = [
  "수요조사",
  "타당성조사",
  "기술실증",
  "설비 구축",
  "정책·제도 지원",
  "역량강화",
  "ODA 사업",
  "기후기금 사업",
];

export const CLIMATE_TECHNOLOGIES: ClimateTechnologyDefinition[] = [
  {
    id: "solar-pv",
    nameKo: "태양광 기술",
    category: "감축",
    relatedSectors: ["전력", "건물", "산업", "농촌"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "solar-thermal",
    nameKo: "태양열 기술",
    category: "감축",
    relatedSectors: ["건물", "산업", "열"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "wind",
    nameKo: "풍력 기술",
    category: "감축",
    relatedSectors: ["전력", "해상", "지역개발"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "ocean-energy",
    nameKo: "해양에너지 기술",
    category: "감축",
    relatedSectors: ["전력", "해양", "연안"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "hydropower",
    nameKo: "수력 기술",
    category: "감축",
    relatedSectors: ["전력", "수자원", "유역"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "water-thermal",
    nameKo: "수열 기술",
    category: "감축",
    relatedSectors: ["건물", "도시", "열"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "geothermal",
    nameKo: "지열 기술",
    category: "감축",
    relatedSectors: ["전력", "건물", "산업"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "bioenergy",
    nameKo: "바이오에너지 기술",
    category: "감축",
    relatedSectors: ["전력", "열", "농업", "폐기물"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "hydrogen-ammonia-power",
    nameKo: "수소·암모니아 발전 기술",
    category: "감축",
    relatedSectors: ["전력", "산업", "연료"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "coal-liquefaction-gasification",
    nameKo: "석탄액화·가스화 기술",
    category: "감축",
    relatedSectors: ["전력", "산업", "연료"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "nuclear",
    nameKo: "원자력 기술",
    category: "감축",
    relatedSectors: ["전력", "산업"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "fusion",
    nameKo: "핵융합에너지 기술",
    category: "감축",
    relatedSectors: ["전력", "연구개발"],
    defaultProjectTypes: ["기술이전", "역량강화", "ODA 사업"],
  },
  {
    id: "hydrogen",
    nameKo: "수소 기술",
    category: "감축",
    relatedSectors: ["산업", "수송", "전력", "연료"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "biomass",
    nameKo: "바이오매스 기술",
    category: "감축",
    relatedSectors: ["농업", "산림", "전력", "열"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "waste-resource",
    nameKo: "폐자원 기술",
    category: "감축",
    relatedSectors: ["폐기물", "도시", "산업", "에너지"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "power-generation-efficiency",
    nameKo: "발전효율 기술",
    category: "감축",
    relatedSectors: ["전력", "산업"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "industrial-efficiency",
    nameKo: "산업효율 기술",
    category: "감축",
    relatedSectors: ["산업", "제조", "열", "전력"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "transport-efficiency",
    nameKo: "수송효율 기술",
    category: "감축",
    relatedSectors: ["수송", "도시", "물류"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "building-efficiency",
    nameKo: "건물효율 기술",
    category: "감축",
    relatedSectors: ["건물", "도시", "냉방"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "power-integration",
    nameKo: "전력 통합 기술",
    category: "융복합",
    relatedSectors: ["송전", "배전", "전력시장", "산업단지"],
    defaultProjectTypes: [
      "수요조사",
      "타당성조사",
      "기술실증",
      "설비 구축",
      "기술이전",
      "역량강화",
      "ODA 사업",
      "기후기금 사업",
    ],
  },
  {
    id: "heat-integration",
    nameKo: "열 통합 기술",
    category: "융복합",
    relatedSectors: ["산업", "도시", "건물", "열"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "sector-coupling",
    nameKo: "전력-비전력 부문 간 결합 기술",
    category: "융복합",
    relatedSectors: ["전력", "산업", "수송", "열"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "methane-treatment",
    nameKo: "메탄 처리 기술",
    category: "감축",
    relatedSectors: ["농업", "폐기물", "에너지", "산업"],
    defaultProjectTypes: [...MITIGATION_PROJECTS, "탄소감축 사업"],
  },
  {
    id: "other-ghg-treatment",
    nameKo: "기타 온실가스 처리 및 대체 기술",
    category: "감축",
    relatedSectors: ["산업", "냉매", "폐기물"],
    defaultProjectTypes: [...MITIGATION_PROJECTS, "탄소감축 사업"],
  },
  {
    id: "carbon-sink",
    nameKo: "탄소 흡수원 기술",
    category: "융복합",
    relatedSectors: ["산림", "토지", "연안", "농업"],
    defaultProjectTypes: [...ADAPTATION_PROJECTS, "탄소감축 사업"],
  },
  {
    id: "industry-energy",
    nameKo: "산업·에너지 부문 기술",
    category: "융복합",
    relatedSectors: ["산업", "에너지", "제조"],
    defaultProjectTypes: MITIGATION_PROJECTS,
  },
  {
    id: "agriculture-livestock-fisheries",
    nameKo: "농축수산 부문 기술",
    category: "적응",
    relatedSectors: ["농업", "축산", "수산", "식량"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "forest-ecosystem",
    nameKo: "산림·생태계 부문 기술",
    category: "적응",
    relatedSectors: ["산림", "생태계", "생물다양성"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "water",
    nameKo: "물 부문 기술",
    category: "적응",
    relatedSectors: ["수자원", "상하수도", "농업", "도시"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "health",
    nameKo: "건강 부문 기술",
    category: "적응",
    relatedSectors: ["보건", "도시", "재난"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "land-coastal",
    nameKo: "국토·연안 부문 기술",
    category: "적응",
    relatedSectors: ["연안", "도시", "국토", "재난"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "climate-monitoring-diagnosis",
    nameKo: "기후변화 감시 및 진단 기술",
    category: "적응",
    relatedSectors: ["관측", "데이터", "기상", "환경"],
    defaultProjectTypes: [
      "수요조사",
      "기술실증",
      "설비 구축",
      "기술이전",
      "역량강화",
      "ODA 사업",
    ],
  },
  {
    id: "climate-projection",
    nameKo: "기후변화 예측 기술",
    category: "적응",
    relatedSectors: ["기상", "데이터", "모델링", "정책"],
    defaultProjectTypes: [
      "수요조사",
      "기술이전",
      "정책·제도 지원",
      "역량강화",
      "ODA 사업",
    ],
  },
  {
    id: "climate-impact-assessment",
    nameKo: "기후변화 영향 평가 기술",
    category: "적응",
    relatedSectors: ["정책", "산업", "지역", "인프라"],
    defaultProjectTypes: [
      "수요조사",
      "타당성조사",
      "정책·제도 지원",
      "역량강화",
      "ODA 사업",
    ],
  },
  {
    id: "climate-vulnerability-risk",
    nameKo: "기후변화 취약성 및 위험성 평가 기술",
    category: "적응",
    relatedSectors: ["재난", "지역", "인프라", "정책"],
    defaultProjectTypes: [
      "수요조사",
      "타당성조사",
      "정책·제도 지원",
      "역량강화",
      "ODA 사업",
    ],
  },
  {
    id: "adaptation-effectiveness",
    nameKo: "적응조치의 효과평가 기술",
    category: "적응",
    relatedSectors: ["정책", "사업관리", "성과평가"],
    defaultProjectTypes: [
      "수요조사",
      "정책·제도 지원",
      "역량강화",
      "ODA 사업",
      "기후기금 사업",
    ],
  },
  {
    id: "adaptation-foundation",
    nameKo: "기후변화 적응기반 기술",
    category: "적응",
    relatedSectors: ["정책", "정보", "역량", "지역"],
    defaultProjectTypes: ADAPTATION_PROJECTS,
  },
  {
    id: "ccus",
    nameKo: "이산화탄소 포집·저장·활용 기술",
    category: "감축",
    relatedSectors: ["산업", "전력", "저장", "탄소"],
    defaultProjectTypes: [...MITIGATION_PROJECTS, "탄소감축 사업"],
  },
];

export const CLIMATE_TECHNOLOGY_BY_ID = new Map(
  CLIMATE_TECHNOLOGIES.map((technology) => [technology.id, technology])
);

export const ALL_PROJECT_TYPES: ProjectType[] = [
  "수요조사",
  "타당성조사",
  "기술실증",
  "설비 구축",
  "기술이전",
  "정책·제도 지원",
  "역량강화",
  "ODA 사업",
  "기후기금 사업",
  "민관협력",
  "탄소감축 사업",
];
