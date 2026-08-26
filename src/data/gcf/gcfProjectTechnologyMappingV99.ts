import type { GcfPriorityProjectRecordV80 } from "./gcfPriorityProjectsV80";

export type GcfProjectTechnologyRelationV99 =
  | "direct"
  | "supporting"
  | "cross_cutting";
export interface GcfProjectTechnologyMappingV99 {
  countryIso3: string;
  countryNameKo: string;
  projectId: string;
  projectTitle: string;
  technologyId: string;
  relation: GcfProjectTechnologyRelationV99;
  evidenceBasis: string;
  sourceUrl: string;
  verifiedAt: string;
  verificationStatus: "confirmed_official_project_page";
}

export const GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99: GcfProjectTechnologyMappingV99[] =
  [
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP071",
      projectTitle:
        "Scaling Up Energy Efficiency for Industrial Enterprises in Vietnam",
      technologyId: "industrial-efficiency",
      relation: "direct",
      evidenceBasis: "산업기업 에너지효율 확대",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp071",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP196",
      projectTitle:
        "Supporting Innovative Mechanisms for Industrial Energy Efficiency Financing in Indonesia with Lessons for Replication in other ASEAN Member States",
      technologyId: "industrial-efficiency",
      relation: "direct",
      evidenceBasis: "산업 에너지효율 금융 메커니즘",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp196",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP083",
      projectTitle: "Indonesia Geothermal Resource Risk Mitigation Project",
      technologyId: "geothermal",
      relation: "direct",
      evidenceBasis: "지열 자원 위험완화",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp083",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      projectId: "FP081",
      projectTitle:
        "Line of Credit for Solar rooftop segment for commercial, industrial and residential housing sectors",
      technologyId: "solar-pv",
      relation: "direct",
      evidenceBasis: "상업·산업·주거용 rooftop solar 신용공여",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp081",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      projectId: "FP186",
      projectTitle: "India E-Mobility Financing Program",
      technologyId: "transport-efficiency",
      relation: "direct",
      evidenceBasis: "E-Mobility 금융 프로그램",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp186",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP225",
      projectTitle: "E-Mobility Program",
      technologyId: "transport-efficiency",
      relation: "direct",
      evidenceBasis: "E-Mobility 프로그램",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp225",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "PHL",
      countryNameKo: "필리핀",
      projectId: "SAP010",
      projectTitle:
        "Multi-Hazard Impact-Based Forecasting and Early Warning System for the Philippines",
      technologyId: "climate-monitoring-diagnosis",
      relation: "direct",
      evidenceBasis: "다중재해 영향기반 예보·조기경보",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/sap010",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP125",
      projectTitle:
        "Strengthening the resilience of smallholder agriculture to climate change-induced water insecurity in the Central Highlands and South-Central Coast regions of Vietnam",
      technologyId: "agriculture-livestock-fisheries",
      relation: "direct",
      evidenceBasis: "소농 기후회복력 농업",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp125",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP125",
      projectTitle:
        "Strengthening the resilience of smallholder agriculture to climate change-induced water insecurity in the Central Highlands and South-Central Coast regions of Vietnam",
      technologyId: "water",
      relation: "direct",
      evidenceBasis: "기후변화 유발 물 불안정성 대응",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp125",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP125",
      projectTitle:
        "Strengthening the resilience of smallholder agriculture to climate change-induced water insecurity in the Central Highlands and South-Central Coast regions of Vietnam",
      technologyId: "climate-monitoring-diagnosis",
      relation: "supporting",
      evidenceBasis: "기후정보·위험 관리 지원",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp125",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP294",
      projectTitle:
        "Vietnam REDD-plus results-based payments for results period of 2014",
      technologyId: "carbon-sink",
      relation: "direct",
      evidenceBasis: "REDD+ 결과기반 감축",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp294",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP294",
      projectTitle:
        "Vietnam REDD-plus results-based payments for results period of 2014",
      technologyId: "forest-ecosystem",
      relation: "direct",
      evidenceBasis: "산림·토지이용 REDD+",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp294",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP250",
      projectTitle:
        "Achieving emission reduction in the Central Highlands and South Central Coast of Viet Nam to support National REDD+ Action Programme goals (RECAF)",
      technologyId: "carbon-sink",
      relation: "direct",
      evidenceBasis: "REDD+ 감축",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp250",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      projectId: "FP250",
      projectTitle:
        "Achieving emission reduction in the Central Highlands and South Central Coast of Viet Nam to support National REDD+ Action Programme goals (RECAF)",
      technologyId: "forest-ecosystem",
      relation: "direct",
      evidenceBasis: "산림경관·REDD+",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp250",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP130",
      projectTitle: "Indonesia REDD-plus RBP for results period 2014–2016",
      technologyId: "carbon-sink",
      relation: "direct",
      evidenceBasis: "REDD+ 결과기반 지급",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp130",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP130",
      projectTitle: "Indonesia REDD-plus RBP for results period 2014–2016",
      technologyId: "forest-ecosystem",
      relation: "direct",
      evidenceBasis: "산림·토지이용 REDD+",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp130",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      projectId: "FP282",
      projectTitle:
        "Lao People’s Democratic Republic: REDD+ Results-based Payments for results period [2015–2018] – Governance, Forest Landscapes and Livelihoods – Southern Laos Project (GFLL-SL)",
      technologyId: "carbon-sink",
      relation: "direct",
      evidenceBasis: "REDD+ 결과기반 지급",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp282",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      projectId: "FP282",
      projectTitle:
        "Lao People’s Democratic Republic: REDD+ Results-based Payments for results period [2015–2018] – Governance, Forest Landscapes and Livelihoods – Southern Laos Project (GFLL-SL)",
      technologyId: "forest-ecosystem",
      relation: "direct",
      evidenceBasis: "산림경관·생계",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp282",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      projectId: "FP258",
      projectTitle:
        "Multi-country Project Advancing Early Warnings for All (EW4All)",
      technologyId: "climate-monitoring-diagnosis",
      relation: "direct",
      evidenceBasis: "Early Warnings for All",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp258",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      projectId: "FP270",
      projectTitle:
        "Climate Adaptive Irrigation and Sustainable Agriculture for Resilience (CAISAR) in Cambodia",
      technologyId: "agriculture-livestock-fisheries",
      relation: "direct",
      evidenceBasis: "기후적응형 지속가능 농업",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp270",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      projectId: "FP270",
      projectTitle:
        "Climate Adaptive Irrigation and Sustainable Agriculture for Resilience (CAISAR) in Cambodia",
      technologyId: "water",
      relation: "direct",
      evidenceBasis: "기후적응형 관개",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp270",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      projectId: "FP270",
      projectTitle:
        "Climate Adaptive Irrigation and Sustainable Agriculture for Resilience (CAISAR) in Cambodia",
      technologyId: "climate-monitoring-diagnosis",
      relation: "direct",
      evidenceBasis: "기후정보·의사결정 지원",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp270",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      projectId: "FP194",
      projectTitle: "Programme for Energy Efficiency in Buildings (PEEB) Cool",
      technologyId: "building-efficiency",
      relation: "direct",
      evidenceBasis: "건물 에너지효율·냉방",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp194",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      projectId: "FP194",
      projectTitle: "Programme for Energy Efficiency in Buildings (PEEB) Cool",
      technologyId: "building-efficiency",
      relation: "direct",
      evidenceBasis: "건물 에너지효율·냉방",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp194",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      projectId: "FP177",
      projectTitle: "Cooling Facility",
      technologyId: "building-efficiency",
      relation: "direct",
      evidenceBasis: "고효율·저탄소 냉방",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp177",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      projectId: "FP177",
      projectTitle: "Cooling Facility",
      technologyId: "other-ghg-treatment",
      relation: "supporting",
      evidenceBasis: "냉매·비CO2 온실가스 감축 관련",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp177",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      projectId: "FP177",
      projectTitle: "Cooling Facility",
      technologyId: "building-efficiency",
      relation: "direct",
      evidenceBasis: "고효율·저탄소 냉방",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp177",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      projectId: "FP177",
      projectTitle: "Cooling Facility",
      technologyId: "other-ghg-treatment",
      relation: "supporting",
      evidenceBasis: "냉매·비CO2 온실가스 감축 관련",
      sourceUrl: "https://www.greenclimate.fund/portfolio/projects/fp177",
      verifiedAt: "2026-08-13",
      verificationStatus: "confirmed_official_project_page",
    },
  ];

export function getVerifiedGcfProjectTechnologyMatchesV99(
  projects: GcfPriorityProjectRecordV80[],
  countryIso3: string,
  technologyId: string
): Array<{
  project: GcfPriorityProjectRecordV80;
  mapping: GcfProjectTechnologyMappingV99;
}> {
  const projectById = new Map(
    projects
      .filter((p) => p.countryIso3 === countryIso3)
      .map((p) => [p.projectId, p])
  );
  return GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99.filter(
    (m) => m.countryIso3 === countryIso3 && m.technologyId === technologyId
  ).flatMap((mapping) => {
    const project = projectById.get(mapping.projectId);
    return project ? [{ project, mapping }] : [];
  });
}
