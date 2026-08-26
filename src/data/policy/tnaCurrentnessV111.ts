import { GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99 } from "../gcf/gcfProjectTechnologyMappingV99";
import type { GcfProjectTechnologyMappingV99 } from "../gcf/gcfProjectTechnologyMappingV99";

export type TnaCurrentnessStatusV111 =
  | "reconfirmed"
  | "partially_reconfirmed"
  | "historical_only"
  | "possible_conflict";

export interface TnaCurrentPolicySourceV111 {
  type: "NDC" | "NAP" | "BTR";
  title: string;
  publishedAt: string;
  pages: string;
  url: string;
}

interface TnaCurrentnessGroupV111 {
  ids: string[];
  status: TnaCurrentnessStatusV111;
  sources: TnaCurrentPolicySourceV111[];
  anchor: string;
  interp: string;
}

export interface TnaCurrentnessEvidenceV111 {
  recordId: string;
  status: TnaCurrentnessStatusV111;
  statusLabelKo: string;
  sources: TnaCurrentPolicySourceV111[];
  evidenceAnchorKo: string;
  interpretationKo: string;
  reviewedAt: string;
}

export interface TnaCurrentnessSummaryV111 {
  total: number;
  reconfirmed: number;
  partiallyReconfirmed: number;
  historicalOnly: number;
  possibleConflict: number;
}

export const TNA_CURRENTNESS_REVIEWED_AT_V111 = "2026-08-18";

export const TNA_CURRENTNESS_STATUS_LABELS_V111: Record<
  TnaCurrentnessStatusV111,
  string
> = {
  reconfirmed: "최신 정책에서 재확인",
  partially_reconfirmed: "최신 정책에서 일부 내용 재확인",
  historical_only: "과거 TNA 근거만 확인",
  possible_conflict: "최신 정책과 방향 차이",
};

const TNA_CURRENTNESS_GROUPS_V111: TnaCurrentnessGroupV111[] = [
  {
    ids: ["VNM-A-AGR-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.92",
      },
    ],
    anchor:
      "기후변화·염수침입에 회복력 있는 작물·가축 품종의 개발·보급을 NAP 이행과제로 제시",
    interp:
      "TNA의 식물 육종 수요가 최신 적응계획의 회복력 품종 개발 방향에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-AGR-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF p.12",
      },
    ],
    anchor:
      "비효율적 벼 재배지를 밭작물 또는 shrimp-rice land로 전환하는 농업 감축수단을 제시",
    interp:
      "벼 재배지의 밭작물 전환이라는 TNA 기술방향이 최신 NDC 감축수단에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-AGR-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF p.12",
      },
    ],
    anchor:
      "비효율적 벼 재배지를 밭작물 또는 shrimp-rice land로 전환하는 수단은 유지되나 3모작→2모작·수산·가금 복합전환 전체 조합은 재명시되지 않음",
    interp:
      "토지이용·영농 전환 방향은 현재 정책과 정합하나 TNA의 구체적 복합영농 조합까지 동일하게 재확인되지는 않음",
  },
  {
    ids: ["VNM-A-FOR-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.17",
      },
    ],
    anchor:
      "자연림 보호, 해안림·맹그로브 복원, 산림경관 복원과 산림 생태계 회복력을 현행 적응과제로 제시",
    interp:
      "산림 회복력 강화는 현재 정책에 남아 있으나 TNA의 가뭄·홍수·병해 저항성 산림 육종 자체는 직접 재명시되지 않음",
  },
  {
    ids: ["VNM-A-FOR-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.117",
      },
    ],
    anchor: "지역별 적응형 생산모델 이행수단으로 agroforestry를 명시",
    interp: "혼농임업 수요가 최신 NAP 이행조치에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-COAST-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF pp.17, 23",
      },
    ],
    anchor:
      "연안 보호구역 확대, 연안지역 회복력 강화, 연안 침식·침수 대응을 제시",
    interp:
      "통합 연안관리의 기능적 방향은 최신 NAP에서 유지되지만 ICZM 자체 표현은 직접 재확인되지 않음",
  },
  {
    ids: ["VNM-A-COAST-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.23",
      },
    ],
    anchor:
      "기후재해 증가에 대비해 저수지·제방·하천 및 해안 제방 시스템을 보강·안전화하도록 제시",
    interp: "해안 제방 기술수요가 최신 NAP에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-COAST-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF pp.17, 23",
      },
    ],
    anchor: "해안 맹그로브 복원·개발과 해양·연안 보호구역 확대를 제시",
    interp:
      "연안 생태계 복원 방향은 재확인되지만 TNA의 포괄적 연안 습지 복원 범위와 완전히 동일하지는 않음",
  },
  {
    ids: ["VNM-A-COAST-04"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF pp.17, 63",
      },
    ],
    anchor:
      "기후영향 모니터링과 조기경보 시스템 강화 및 재해 조기경보 역량 향상을 제시",
    interp: "홍수·기후위험 조기경보 수요가 최신 NAP에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-WAT-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.16",
      },
    ],
    anchor: "물 부족 대응수단으로 빗물 수집·이용을 명시",
    interp: "빗물집수 수요가 최신 NAP에서 직접 재확인됨",
  },
  {
    ids: ["VNM-A-WAT-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.16",
      },
    ],
    anchor: "빗물 수집·이용과 수자원의 효율적 이용·복원을 제시",
    interp:
      "물 수집·저장 방향은 재확인되나 TNA의 runoff harvesting을 직접 특정하지는 않음",
  },
  {
    ids: ["VNM-A-WAT-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title:
          "Report on the National Adaptation Plan for the Period 2021–2030, with a vision to 2050 (Updated)",
        publishedAt: "2025-09-04",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf",
        pages: "PDF p.16",
      },
    ],
    anchor:
      "통합 유역계획을 수립·이행하고 보호가 필요한 유역을 관리하도록 제시",
    interp: "통합 유역관리 수요가 최신 NAP에서 직접 재확인됨",
  },
  {
    ids: ["VNM-M-AGR-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF pp.10–12",
      },
    ],
    anchor:
      "축산폐기물 처리와 바이오가스 이용 확대를 농업·농촌 감축수단으로 제시",
    interp:
      "가축분뇨 처리와 바이오가스 활용의 기능적 기술수요가 최신 NDC에서 재확인됨",
  },
  {
    ids: ["VNM-M-AGR-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF p.10",
      },
    ],
    anchor: "반추가축 사료배합 개선을 메탄 감축 관련 농업조치로 제시",
    interp: "가축 영양·사료 개선 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["VNM-M-AGR-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF pp.10–12",
      },
    ],
    anchor:
      "벼 재배에서 생육 중간 물빼기(mid-crop water withdrawal)를 메탄 감축수단으로 제시",
    interp:
      "TNA의 간단관개/AWD 계열 수요가 최신 NDC의 벼 물관리 조치에서 재확인됨",
  },
  {
    ids: ["VNM-M-ENE-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Viet Nam NDC 2022 Update",
        publishedAt: "2022-11-08",
        url: "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam%20NDC%202022%20Update.pdf",
        pages: "PDF pp.12, 32, 35",
      },
    ],
    anchor: "풍력 확대와 해상풍력 개발을 재생에너지 전환수단으로 제시",
    interp: "풍력 발전 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["BGD-A-AGR-01", "BGD-A-AGR-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF p.39",
      },
    ],
    anchor:
      "염해·가뭄 등 기후스트레스에 강한 벼·비벼작물 품종 확대를 적응조치로 제시",
    interp: "TNA의 염분·가뭄 내성 벼 품종 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["BGD-A-AGR-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.4, 23",
      },
    ],
    anchor: "short-duration rice varieties 확대를 농업 감축·회복력 조치로 명시",
    interp: "단기숙성 벼 품종이 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["BGD-A-AGR-04"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.34, 39",
      },
    ],
    anchor:
      "농업 extension, farmer–research linkage, 기후스마트 농업기술과 관개·수자원 효율 향상을 제시",
    interp:
      "교육·보급·영농관리 방향은 유지되지만 TNA의 하나의 통합 교육기술 패키지와 동일하게 재명시되지는 않음",
  },
  {
    ids: ["BGD-A-AGR-05"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.4, 34, 40",
      },
    ],
    anchor:
      "기후스마트농업을 국가 적응 우선분야로 두고 기술 보급·extension을 강화",
    interp:
      "기후스마트농업 보급 방향은 현재 정책에서 재확인되나 TNA의 전용 기술보급센터 설치는 직접 재명시되지 않음",
  },
  {
    ids: ["BGD-A-AGR-06"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.34, 41",
      },
    ],
    anchor:
      "농업 연구, farmer–research linkage, 기후스트레스 내성 품종 연구·확산을 제시",
    interp:
      "농업 적응 R&D 기능은 유지되지만 TNA의 별도 R&D 센터 설치는 직접 재명시되지 않음",
  },
  {
    ids: ["BGD-A-AGR-07"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF p.34",
      },
    ],
    anchor:
      "최신 NDC는 농업·AFOLU 정책과 기후스마트 영농을 강화하지만 TNA의 토지이용계획 기술을 직접 재명시하지 않음",
    interp:
      "현행 정책문서에서 동일 기술의 직접 근거가 확인되지 않아 TNA의 역사적 수요근거로만 유지",
  },
  {
    ids: ["BGD-A-DIS-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.38–39",
      },
    ],
    anchor:
      "ICT·AI를 활용한 기후위험 조기경보와 농업 영향기반 조기경보 시스템 강화를 제시",
    interp: "종합재난관리의 핵심인 조기경보 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["BGD-A-WAT-01"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF p.39",
      },
    ],
    anchor:
      "최신 NDC는 관개효율과 지표수 확충 등 수자원 조치를 제시하지만 Tidal River Management를 직접 재명시하지 않음",
    interp: "TRM은 현행 NDC에서 직접 재확인되지 않아 TNA 역사근거로 유지",
  },
  {
    ids: ["BGD-M-ENE-01", "BGD-M-ENE-02", "BGD-M-ENE-03"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.18, 28, 56",
      },
    ],
    anchor:
      "최신 NDC는 재생에너지 확대·효율향상과 unabated fossil fuel에서의 전환을 중심축으로 제시하며 해당 가스발전 고도화 기술을 직접 재명시하지 않음",
    interp:
      "특정 가스터빈·복합화력 효율기술은 최신 NDC에서 재확인되지 않아 TNA 역사근거로만 유지",
  },
  {
    ids: ["BGD-M-ENE-04", "BGD-M-ENE-05"],
    status: "possible_conflict",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.18, 56",
      },
    ],
    anchor:
      "NDC 3.0은 재생에너지 확대와 unabated fossil fuels로부터의 질서 있는 전환 및 신규 lock-in 회피를 명시",
    interp:
      "고효율 미분탄·IGCC라는 과거 TNA 기술은 최신 전환방향과 긴장이 있으므로 현재 협력수요로 사용할 때 별도 정책검증이 필요",
  },
  {
    ids: ["BGD-M-ENE-06"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF pp.18–19",
      },
    ],
    anchor:
      "rooftop solar, solar park, solar irrigation 등 태양광 확대를 2035 전력전환 조치로 제시",
    interp: "태양광 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["BGD-M-BLD-01", "BGD-M-BLD-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Bangladesh NDC 3.0",
        publishedAt: "2025-09-29",
        url: "https://unfccc.int/sites/default/files/2025-09/Bangladesh%20Third%20Nationally%20Determined%20Contribution%20%28NDC%203.0%29.pdf",
        pages: "PDF p.21",
      },
    ],
    anchor: "에너지효율 조명·가전 확산을 감축수단으로 유지",
    interp:
      "고효율 조명이라는 기능은 재확인되나 선형 형광등·CFL이라는 특정 구형 제품기술은 직접 재명시되지 않음",
  },
  {
    ids: ["PHL-M-ENE-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF pp.67, 71",
      },
    ],
    anchor: "EV 인프라·에너지 성능기준·차량 현대화 및 검사체계를 추진",
    interp:
      "차세대 차량 시험·검증 기능의 정책수요는 유지되지만 TNA의 전용 시험연구소 자체는 직접 재명시되지 않음",
  },
  {
    ids: ["PHL-M-ENE-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF pp.59–62",
      },
    ],
    anchor:
      "태양광을 포함한 재생에너지 확대가 현행 전환정책에 포함되지만 solar thermal은 직접 특정되지 않음",
    interp:
      "태양에너지 확대 방향은 현재 정책과 정합하나 TNA의 태양열 시스템은 부분 재확인으로 처리",
  },
  {
    ids: ["PHL-M-ENE-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF p.72",
      },
    ],
    anchor:
      "시멘트 산업의 low-carbon waste heat recovery 기술 확산을 주요 감축조치로 명시",
    interp: "폐열회수 시스템 수요가 최신 BTR에서 직접 재확인됨",
  },
  {
    ids: ["PHL-M-WST-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF p.74",
      },
    ],
    anchor: "유기성 폐기물 composting을 주요 폐기물 감축조치로 명시",
    interp: "퇴비화 기반 자원화 수요가 최신 BTR에서 직접 재확인됨",
  },
  {
    ids: ["PHL-M-WST-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF p.74",
      },
    ],
    anchor: "매립지 메탄 포집·활용 및 하·폐수 처리시설 개선을 주요 조치로 제시",
    interp:
      "메탄회수·유기성 폐기물 처리 방향은 재확인되지만 anaerobic digester가 직접 재명시되지는 않음",
  },
  {
    ids: ["PHL-M-TRN-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF p.71",
      },
    ],
    anchor:
      "Motor Vehicle Inspection System (MVIS) Phase 1을 현행 수송 감축사업으로 명시",
    interp: "자동차 검사시스템이 최신 BTR에서 직접 재확인됨",
  },
  {
    ids: ["PHL-M-TRN-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Philippines First Biennial Transparency Report",
        publishedAt: "2025-03-31",
        url: "https://unfccc.int/sites/default/files/resource/%5BFinal%5D%20Philippine%20Biennial%20Transparency%20Report.pdf",
        pages: "PDF pp.61–64",
      },
    ],
    anchor:
      "바이오연료 정책과 biogas를 포함한 재생에너지 사용은 유지되지만 수송용 바이오가스의 직접 재확인 근거는 제한적",
    interp:
      "연료전환 방향은 현재 정책과 정합하나 TNA의 수송용 바이오가스 세부기술은 부분 재확인으로 처리",
  },
  {
    ids: ["KHM-A-WAT-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF p.117",
      },
    ],
    anchor: "green building 적응조치에 rainwater harvesting을 명시",
    interp:
      "빗물집수는 직접 재확인되지만 TNA 레코드에 함께 포함된 우물(wells)까지 동일하게 재확인되지는 않음",
  },
  {
    ids: ["KHM-A-WAT-02"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF pp.83, 103",
      },
    ],
    anchor:
      "최신 NDC에는 저수지·수자원 인프라가 언급되지만 TNA의 소규모 저수지·댐·미소유역 집수 패키지를 직접 적응기술로 재명시하지 않음",
    interp: "세부 기술조합은 TNA 역사근거로 유지",
  },
  {
    ids: ["KHM-A-COA-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF pp.21, 76",
      },
    ],
    anchor:
      "맹그로브 복원과 자연기반 홍수관리·연안생태계 회복을 적응조치로 제시",
    interp: "맹그로브 관리 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["KHM-M-TRN-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF pp.12, 31",
      },
    ],
    anchor: "도시 통합 대중교통 및 저탄소 이동 확대를 감축수단으로 제시",
    interp: "에너지효율 도시 대중교통 방향이 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["KHM-M-TRN-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF pp.20, 31",
      },
    ],
    anchor: "ICE 차량 연비·배출기준 강화와 검사센터의 배출 모니터링을 명시",
    interp: "차량 배출기준 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["KHM-M-EE-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF pp.20, 30",
      },
    ],
    anchor: "공공조명 및 LED를 포함한 의무 에너지성능기준·라벨링을 제시",
    interp: "고효율 조명 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["KHM-M-EE-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Cambodia's NDC 3.0",
        publishedAt: "2025-08-08",
        url: "https://unfccc.int/sites/default/files/2025-08/Cambodia-NDC%203.0_0.pdf",
        pages: "PDF p.30",
      },
    ],
    anchor:
      "에어컨·냉장고·팬·LED·밥솥 등 고소비 가전의 MEPS와 에너지라벨링을 의무화하는 조치를 제시",
    interp: "고효율 가전제품 수요가 최신 NDC에서 직접 재확인됨",
  },
  {
    ids: ["IDN-A-WAT-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Republic of Indonesia",
        publishedAt: "2025-11-13",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Indonesia__2025__.pdf",
        pages: "PDF p.83",
      },
    ],
    anchor:
      "community-based rainwater harvesting systems와 household storage tanks를 2026–2030 물안보 적응조치로 제시",
    interp: "빗물집수 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["IDN-A-WAT-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Republic of Indonesia",
        publishedAt: "2025-11-13",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Indonesia__2025__.pdf",
        pages: "PDF p.83",
      },
    ],
    anchor: "도시 물효율 조치로 grey-water reuse를 명시",
    interp: "생활용수 재이용 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["IDN-A-WAT-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Republic of Indonesia",
        publishedAt: "2025-11-13",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Indonesia__2025__.pdf",
        pages: "PDF p.83",
      },
    ],
    anchor:
      "hydro-climatic data를 활용한 통합유역계획, 실시간 저수지 관리, 디지털 물정보 시스템을 제시",
    interp:
      "수자원 예측·모델링의 데이터·의사결정 기능은 재확인되나 TNA의 projection modelling 자체와 동일 표현은 아님",
  },
  {
    ids: ["IDN-A-AGR-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Republic of Indonesia",
        publishedAt: "2025-11-13",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Indonesia__2025__.pdf",
        pages: "Food Security adaptation table",
      },
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF p.45",
      },
    ],
    anchor:
      "최신 NAP은 기후회복력 식량체계·다양화·기후적응 생산을, Second NDC는 축산 사료개선 등 축산조치를 유지",
    interp:
      "축산 회복력 정책은 유지되지만 TNA의 기후회복력 축우·질병저항성 기술이 직접 재명시되지는 않음",
  },
  {
    ids: ["IDN-M-FOR-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF pp.5, 16",
      },
    ],
    anchor:
      "산림·토지의 탄소흡수 역량 확대와 국가 MRV·REDD+ 정보체계를 NDC 이행기반으로 유지",
    interp: "탄소흡수·배출 측정 및 모니터링 기능이 최신 NDC에서 재확인됨",
  },
  {
    ids: ["IDN-M-FOR-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF pp.15–16, 45",
      },
    ],
    anchor:
      "peat decomposition·peat fires·peatland 보전이 토지부문 감축의 핵심으로 유지",
    interp:
      "이탄지 관리 수요는 현재 정책에 남아 있으나 TNA의 재매핑(remapping) 작업 자체는 직접 재명시되지 않음",
  },
  {
    ids: ["IDN-M-FOR-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF pp.15–16, 45",
      },
    ],
    anchor: "이탄지 분해·화재 감축과 이탄지 보전정책을 유지",
    interp:
      "이탄지 수문관리 방향은 정책과 정합하지만 수위·물관리라는 TNA 세부기술이 직접 재명시되지는 않음",
  },
  {
    ids: ["IDN-M-ENE-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF p.43",
      },
    ],
    anchor:
      "재생에너지 발전원으로 geothermal, hydro, solar, wind, bioenergy를 명시",
    interp: "태양광 발전 수요가 Second NDC에서 직접 재확인됨",
  },
  {
    ids: ["IDN-M-IND-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF pp.18, 43",
      },
    ],
    anchor: "산업부문 에너지효율·에너지관리·저탄소 산업전환을 유지",
    interp:
      "산업 연소효율 향상 방향은 재확인되지만 축열식 버너 연소시스템(RBCS) 자체는 직접 재명시되지 않음",
  },
  {
    ids: ["IDN-M-WST-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF p.44",
      },
    ],
    anchor:
      "3R, waste-to-energy, SRF, sanitary landfill, 다양한 폐기물 처리·가공을 추진",
    interp:
      "기계·생물학적 폐기물처리의 기능은 현행 폐기물 전환방향과 정합하지만 MBT가 직접 재명시되지는 않음",
  },
  {
    ids: ["IDN-M-WST-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF pp.18, 44",
      },
    ],
    anchor: "산업 고형폐기물 composting과 3R를 감축조치로 명시",
    interp: "퇴비화 수요가 Second NDC에서 직접 재확인됨",
  },
  {
    ids: ["IDN-M-WST-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Republic of Indonesia Second NDC",
        publishedAt: "2025-10-27",
        url: "https://unfccc.int/sites/default/files/2025-10/Indonesia_Second%20NDC_2025.10.24.pdf",
        pages: "PDF p.44",
      },
    ],
    anchor:
      "생활계 액상폐기물 biodigester와 methane capture/utilization을 명시",
    interp:
      "혐기소화·메탄회수의 기능적 기술수요가 Second NDC에서 직접 재확인됨",
  },
  {
    ids: ["LAO-A-WAT-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "PDF p.82",
      },
    ],
    anchor:
      "농업기상시스템 확대, 동식물 질병 모니터링, 사전 경보계획과 지역사회 경보장비를 포함한 early warning system 강화를 제시",
    interp: "종단간 조기경보 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["LAO-A-WAT-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "BTR",
        title: "Lao PDR First Biennial Transparency Report",
        publishedAt: "2025-12-24",
        url: "https://unfccc.int/sites/default/files/resource/2.%20BTR1%20of%20the%20Lao%20PDR.pdf",
        pages: "PDF p.132",
      },
    ],
    anchor:
      "2023년 정부령에 따라 Disaster Management Fund가 국가 각 수준에 설치되었다고 보고",
    interp:
      "재난대응 재원 메커니즘은 현재 존재하지만 TNA의 'Disaster Impact Reduction Fund'와 동일 명칭·설계인지는 확인되지 않아 부분 재확인으로 처리",
  },
  {
    ids: ["LAO-A-WAT-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "PDF p.131",
      },
    ],
    anchor:
      "통합 수자원관리 및 주요 하천의 river basin management plan 수립·이행을 제시",
    interp: "유역관리 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["LAO-A-WAT-04"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "Public Works & Water Resources chapters, PDF pp.101, 131",
      },
    ],
    anchor:
      "물공급·위생을 포함한 공공인프라의 기후회복력 설계와 수자원 보호·복원을 제시",
    interp:
      "기후회복력 물공급 방향은 현행 NAP에 포함되지만 TNA의 특정 시스템 사양까지 직접 재확인되지는 않음",
  },
  {
    ids: ["LAO-A-AGR-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "PDF p.82",
      },
    ],
    anchor:
      "가축 전염병 발생 모니터링·사전경보 계획과 동물·수생질병 데이터베이스 구축을 제시",
    interp: "가축 질병 예방·통제 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["LAO-A-AGR-02"],
    status: "historical_only",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "Agriculture chapter, PDF pp.69, 82",
      },
    ],
    anchor:
      "현행 NAP은 기후회복력 농업기술·연구·질병관리·기상정보를 확대하지만 TNA의 농업개발 보조금 메커니즘을 직접 재명시하지 않음",
    interp: "동일 재정수단의 현재 근거가 확인되지 않아 TNA 역사근거로 유지",
  },
  {
    ids: ["LAO-A-INF-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "PDF p.101",
      },
    ],
    anchor:
      "농촌개발·주거지의 기후위험평가와 기후재해에 강한 인프라·도시설계 및 적응형 투자기준을 제시",
    interp: "기후회복력 농촌·공공 인프라 수요가 2025 NAP에서 직접 재확인됨",
  },
  {
    ids: ["LAO-A-AGR-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NAP",
        title: "National Adaptation Plan – Lao People's Democratic Republic",
        publishedAt: "2025-10-16",
        url: "https://unfccc.int/sites/default/files/resource/NAP_Lao_P.D.R_2025.pdf",
        pages: "Agriculture/Food Security chapter, PDF around p.69",
      },
    ],
    anchor:
      "기후회복력 품종, 통합 토지관리, 농업 생산체계 적응과 농가 소득 다변화 필요성을 다룸",
    interp:
      "생산·소득 다변화 방향은 현재 정책과 정합하나 TNA의 작물 다변화를 독립 우선기술로 직접 재명시한 근거는 제한적",
  },
  {
    ids: ["LKA-A-HEA-01"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF pp.22, 70",
      },
    ],
    anchor:
      "기후유발 질병 예측을 위한 surveillance system과 기후위험 조기경보·디지털 위험정보를 제시",
    interp: "보건 조기경보·네트워킹 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-A-HEA-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.70",
      },
    ],
    anchor:
      "기후관련 보건문제 대응을 위한 health officials capacity-building을 명시",
    interp: "보건인력 지식·기술 역량강화 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-A-HEA-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.70",
      },
    ],
    anchor:
      "environmentally-friendly technologies for health care waste management를 보건 NDC 조치로 명시",
    interp: "보건의료 폐기물 관리 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-A-WAT-01"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.60",
      },
    ],
    anchor:
      "현행 NDC는 기존 minor tanks 현황을 기술하지만 TNA의 소규모 저수지 네트워크 복원을 신규 적응조치로 직접 재명시하지 않음",
    interp:
      "자산의 현재 존재는 확인되나 동일 복원기술의 현재 정책수요로 볼 직접 근거가 없어 TNA 역사근거로 유지",
  },
  {
    ids: ["LKA-A-WAT-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.61",
      },
    ],
    anchor: "2035년까지 총 62,000개 rainwater harvesting systems를 목표로 제시",
    interp: "지붕 빗물집수 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-A-WAT-03"],
    status: "historical_only",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.60",
      },
    ],
    anchor:
      "tube wells는 현재 식수원 현황으로 언급되나 신규 적응기술 목표로 직접 제시되지 않음",
    interp:
      "관정·튜브웰의 현재 수요는 최신 NDC에서 직접 재확인되지 않아 TNA 역사근거로 유지",
  },
  {
    ids: ["LKA-A-COA-01", "LKA-A-COA-02", "LKA-A-COA-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.67",
      },
    ],
    anchor:
      "coral reefs, mangrove, sand dunes 등 연안생태계 복원을 NDC 적응조치로 명시",
    interp: "사구·맹그로브·산호초 복원 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-M-TRN-01"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.31",
      },
    ],
    anchor:
      "버스·철도 중심의 대중교통 강화와 이용률 확대를 명시하지만 non-motorized transport는 직접 특정하지 않음",
    interp:
      "대중교통 전환은 재확인되나 TNA의 비동력교통까지 포함한 전체 조합은 부분 재확인",
  },
  {
    ids: ["LKA-M-TRN-02"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF pp.31, 95",
      },
    ],
    anchor:
      "Park & Ride 시스템 도입을 NDC 수송조치로 명시하지만 carpooling은 직접 재명시되지 않음",
    interp:
      "복합 TNA 기술 중 Park & Ride만 직접 재확인되어 부분 재확인으로 처리",
  },
  {
    ids: ["LKA-M-TRN-03"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.32",
      },
    ],
    anchor: "철도 현대화·전철화 및 전기이동성 확대를 수송 감축조치로 제시",
    interp: "기존 철도 전철화 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-M-IND-01", "LKA-M-IND-02"],
    status: "reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF p.34",
      },
    ],
    anchor:
      "산업 에너지절감 기술로 highly efficient motors와 variable frequency drives를 명시",
    interp: "고효율 모터와 VSD 수요가 NDC 3.0에서 직접 재확인됨",
  },
  {
    ids: ["LKA-M-IND-03"],
    status: "partially_reconfirmed",
    sources: [
      {
        type: "NDC",
        title: "Sri Lanka NDC 3.0 (2026–2035)",
        publishedAt: "2025-09-25",
        url: "https://unfccc.int/sites/default/files/2025-09/Sri%20Lankas%20Nationally%20Determined%20Contributions%203.0%20%282026-2035%29%20submitted%2022.09.2025%20%281%29.pdf",
        pages: "PDF pp.34–35",
      },
    ],
    anchor:
      "tri-generation·district energy pilot과 지속가능 biomass·biofuel 활용을 제시",
    interp:
      "열병합·바이오매스 이용 방향은 재확인되나 TNA의 바이오매스 잔재 기반 CHP 자체는 직접 재명시되지 않음",
  },
];

export const TNA_CURRENTNESS_EVIDENCE_V111: TnaCurrentnessEvidenceV111[] =
  TNA_CURRENTNESS_GROUPS_V111.reduce<TnaCurrentnessEvidenceV111[]>(
    (acc, group) => {
      group.ids.forEach((recordId) => {
        acc.push({
          recordId,
          status: group.status,
          statusLabelKo: TNA_CURRENTNESS_STATUS_LABELS_V111[group.status],
          sources: group.sources,
          evidenceAnchorKo: group.anchor,
          interpretationKo: group.interp,
          reviewedAt: TNA_CURRENTNESS_REVIEWED_AT_V111,
        });
      });
      return acc;
    },
    []
  );

export function getTnaCurrentnessEvidenceV111(
  recordId: string
): TnaCurrentnessEvidenceV111 | null {
  return (
    TNA_CURRENTNESS_EVIDENCE_V111.find((item) => item.recordId === recordId) ??
    null
  );
}

export function summarizeTnaCurrentnessV111(
  recordIds: string[]
): TnaCurrentnessSummaryV111 {
  const selected = TNA_CURRENTNESS_EVIDENCE_V111.filter((item) =>
    recordIds.includes(item.recordId)
  );
  return {
    total: selected.length,
    reconfirmed: selected.filter((item) => item.status === "reconfirmed")
      .length,
    partiallyReconfirmed: selected.filter(
      (item) => item.status === "partially_reconfirmed"
    ).length,
    historicalOnly: selected.filter((item) => item.status === "historical_only")
      .length,
    possibleConflict: selected.filter(
      (item) => item.status === "possible_conflict"
    ).length,
  };
}

export function getVerifiedGcfMatchesForTnaV111(
  countryIso3: string,
  technologyId: string | null
): GcfProjectTechnologyMappingV99[] {
  if (!technologyId) return [];
  return GCF_PROJECT_TECHNOLOGY_MAPPINGS_V99.filter(
    (item) =>
      item.countryIso3 === countryIso3 &&
      item.technologyId === technologyId &&
      item.verificationStatus === "confirmed_official_project_page"
  ).sort((a, b) => {
    if (a.relation === b.relation)
      return a.projectId.localeCompare(b.projectId);
    if (a.relation === "direct") return -1;
    if (b.relation === "direct") return 1;
    return a.relation.localeCompare(b.relation);
  });
}

export const TNA_CURRENTNESS_METHOD_NOTE_KO_V111 =
  "TNA/TAP 우선기술이 최신 NDC·NAP·BTR에서도 확인되는지를 비교한 결과입니다. 사업 우선순위나 신규 협력사업 추천을 의미하지 않습니다.";

export const TNA_GCF_JOIN_NOTE_KO_V111 =
  "GCF 사업은 같은 국가와 관련 기후기술 분야에 속하는 기존 사업을 참고용으로 함께 표시합니다. TNA 세부기술과 동일한 사업이거나 신규 협력기회라는 의미는 아닙니다.";
