export type CooperationPolicyKindV109 = "btr" | "nap" | "lt-leds" | "tna";

export type CooperationPolicyStatusV109 =
  | "available"
  | "not_found_official_list"
  | "related_record_only";

export interface CooperationPolicyKindMetaV109 {
  datasetId: string;
  labelKo: string;
  titleKo: string;
  sourceOrganization: string;
  portalUrl: string;
  sourceAsOf: string;
  cooperationUseKo: string[];
  nextExtractionKo: string[];
}

export interface CooperationPolicyEvidenceRecordV109 {
  countryIso3: string;
  countryNameKo: string;
  kind: CooperationPolicyKindV109;
  status: CooperationPolicyStatusV109;
  statusLabelKo: string;
  documentTitle?: string;
  submissionDate?: string;
  documentYear?: number;
  documentUrl?: string;
  portalUrl: string;
  sourceAsOf: string;
  evidenceSummaryKo: string;
  notes: string[];
}

export const COOPERATION_POLICY_KIND_META_V109: Record<
  CooperationPolicyKindV109,
  CooperationPolicyKindMetaV109
> = {
  btr: {
    datasetId: "LDC-DS-C-002-BTR",
    labelKo: "BTR",
    titleKo: "격년투명성보고서(BTR) 공식 제출현황",
    sourceOrganization: "UNFCCC · First Biennial Transparency Reports",
    portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
    sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
    cooperationUseKo: [
      "최근 GHG 인벤토리와 NDC 이행상황을 확인하는 출발점",
      "재정·기술·역량개발 지원 필요·수혜 정보의 후속 추출 대상",
      "NDC 목표와 실제 보고된 이행 사이의 간극을 검토",
    ],
    nextExtractionKo: [
      "GHG 총배출·부문별 배출 시계열",
      "NDC 진척·감축성과",
      "재정·기술·역량개발 지원 필요 및 수혜",
    ],
  },
  nap: {
    datasetId: "LDC-DS-C-003-NAP",
    labelKo: "NAP",
    titleKo: "국가적응계획(NAP) 공식 제출현황",
    sourceOrganization: "UNFCCC · National Adaptation Plans",
    portalUrl: "https://unfccc.int/national-adaptation-plans",
    sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
    cooperationUseKo: [
      "국가가 우선하는 취약부문과 적응조치를 확인",
      "적응기술·인프라·역량개발 수요의 공식 정책근거를 확보",
      "적응재원·거버넌스·모니터링 체계의 후속 확인 대상 선정",
    ],
    nextExtractionKo: [
      "취약부문·위험",
      "우선 적응조치·기술",
      "투자수요·거버넌스·M&E",
    ],
  },
  "lt-leds": {
    datasetId: "LDC-DS-C-004-LTLEDS",
    labelKo: "LT-LEDS",
    titleKo: "장기 저탄소발전전략(LT-LEDS) 공식 제출현황",
    sourceOrganization: "UNFCCC · Long-term strategies portal",
    portalUrl:
      "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
    sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
    cooperationUseKo: [
      "중장기 탈탄소 경로와 기술시장 방향을 확인",
      "넷제로·부문전환 계획과 국제협력 사업기간의 정합성을 검토",
      "NDC·TNA와 함께 단기수요와 장기전략의 일관성을 교차검증",
    ],
    nextExtractionKo: [
      "넷제로 목표·장기 배출경로",
      "부문별 전환경로·핵심기술",
      "에너지믹스·장기 투자수요",
    ],
  },
  tna: {
    datasetId: "LDC-DS-C-005-TNA",
    labelKo: "TNA/TAP",
    titleKo: "기술수요평가(TNA/TAP) 공식 문서현황",
    sourceOrganization: "UNFCCC TT:CLEAR · Technology Needs Assessments",
    portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
    sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
    cooperationUseKo: [
      "현지 정부가 직접 우선순위화한 감축·적응 기술후보를 확인",
      "기술이전 장벽과 enabling framework를 협력사업 설계조건으로 확인",
      "TAP·Project Idea가 있는 경우 구체적 사업후보 발굴의 출발점으로 활용",
    ],
    nextExtractionKo: [
      "감축·적응 우선기술과 순위",
      "기술이전 장벽·enabling framework",
      "TAP·Project Idea·이행주체·재원수요",
    ],
  },
};

export const COOPERATION_POLICY_EVIDENCE_V109: CooperationPolicyEvidenceRecordV109[] =
  [
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      kind: "btr",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "2026-08-11 갱신 UNFCCC First BTR 제출표에서 BTR1 제출 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 제출목록 미확인은 기후정책·보고 활동이 없다는 의미가 아님",
        "후속 제출·갱신 여부는 UNFCCC 공식표에서 재확인 필요",
      ],
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2025-12-31",
      documentYear: 2025,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 방글라데시의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "PHL",
      countryNameKo: "필리핀",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2025-03-31",
      documentYear: 2025,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 필리핀의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2024-12-31",
      documentYear: 2024,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 캄보디아의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2024-12-24",
      documentYear: 2024,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 인도네시아의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2025-12-24",
      documentYear: 2025,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 라오스의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2024-12-31",
      documentYear: 2024,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 스리랑카의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2026-04-30",
      documentYear: 2026,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 인도의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "MYS",
      countryNameKo: "말레이시아",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2024-12-31",
      documentYear: 2024,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 말레이시아의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "EGY",
      countryNameKo: "이집트",
      kind: "btr",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "First Biennial Transparency Report (BTR1)",
      submissionDate: "2024-12-30",
      documentYear: 2024,
      portalUrl: "https://unfccc.int/first-biennial-transparency-reports",
      sourceAsOf: "UNFCCC BTR1 제출표 · 2026-08-11 갱신본",
      evidenceSummaryKo:
        "UNFCCC First BTR 제출표에서 이집트의 BTR1 제출을 확인했습니다.",
      notes: [
        "v109에서는 제출여부·제출일·공식목록 근거만 연결",
        "GHG·NDC 이행·지원 수치와 문장·페이지 근거는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan – Vietnam - English",
      documentUrl: "https://unfccc.int/documents/649602",
      submissionDate: "2025-09-04",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 베트남의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan - Bangladesh",
      submissionDate: "2023-03-23",
      documentUrl: "https://unfccc.int/documents/637588",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 방글라데시의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "PHL",
      countryNameKo: "필리핀",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan - Philippines",
      submissionDate: "2024-05-30",
      documentUrl: "https://unfccc.int/documents/638996",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 필리핀의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan - Cambodia",
      submissionDate: "2021-07-07",
      documentUrl: "https://unfccc.int/documents/638457",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 캄보디아의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan – Republic of Indonesia",
      submissionDate: "2025-11-13",
      documentUrl: "https://unfccc.int/documents/653857",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 인도네시아의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle:
        "National Adaptation Plan – Lao People's Democratic Republic",
      documentUrl: "https://unfccc.int/documents/650497",
      submissionDate: "2025-10-16",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 라오스의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      kind: "nap",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "National Adaptation Plan - Sri Lanka",
      submissionDate: "2016-11-01",
      documentUrl: "https://unfccc.int/documents/638476",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC 공식 문서에서 스리랑카의 국가적응계획(NAP) 제출본을 확인했습니다.",
      notes: [
        "v109에서는 문서 존재·제출 메타데이터·원문 경로를 우선 연결",
        "취약부문·우선조치·투자수요의 문장·페이지 단위 추출은 후속 단계",
      ],
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      kind: "nap",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 확인한 UNFCCC NAP 공식 제출자료에서 국가 NAP 원문 레코드를 확인하지 못했습니다.",
      notes: [
        "이는 해당 국가가 적응계획 수립·이행 활동을 하지 않는다는 의미가 아님",
        "UNFCCC는 제출된 NAP과 관련 산출물을 NAP Central에 유지하므로 최신 제출상태를 계속 확인해야 함",
      ],
    },
    {
      countryIso3: "MYS",
      countryNameKo: "말레이시아",
      kind: "nap",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 확인한 UNFCCC NAP 공식 제출자료에서 국가 NAP 원문 레코드를 확인하지 못했습니다.",
      notes: [
        "이는 해당 국가가 적응계획 수립·이행 활동을 하지 않는다는 의미가 아님",
        "UNFCCC는 제출된 NAP과 관련 산출물을 NAP Central에 유지하므로 최신 제출상태를 계속 확인해야 함",
      ],
    },
    {
      countryIso3: "EGY",
      countryNameKo: "이집트",
      kind: "nap",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/national-adaptation-plans",
      sourceAsOf: "UNFCCC NAP Central/공식 문서 · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 확인한 UNFCCC NAP 공식 제출자료에서 국가 NAP 원문 레코드를 확인하지 못했습니다.",
      notes: [
        "이는 해당 국가가 적응계획 수립·이행 활동을 하지 않는다는 의미가 아님",
        "UNFCCC는 제출된 NAP과 관련 산출물을 NAP Central에 유지하므로 최신 제출상태를 계속 확인해야 함",
      ],
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "PHL",
      countryNameKo: "필리핀",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      kind: "lt-leds",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "Long-term strategy for Carbon Neutrality (LTS4CN)",
      submissionDate: "2021-12-30",
      documentYear: 2021,
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC Long-term strategies portal의 현재 제출표에서 캄보디아의 LT-LEDS를 확인했습니다.",
      notes: [
        "공식 포털은 최신 current submission을 기준으로 표시",
        "v109에서는 제출메타데이터만 연결하며 장기 경로·기술·투자수요는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      kind: "lt-leds",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle:
        "Long-Term Strategy for Low Carbon and Climate Resilience 2050 (Indonesia LTS-LCCR 2050)",
      submissionDate: "2021-07-22",
      documentYear: 2021,
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC Long-term strategies portal의 현재 제출표에서 인도네시아의 LT-LEDS를 확인했습니다.",
      notes: [
        "공식 포털은 최신 current submission을 기준으로 표시",
        "v109에서는 제출메타데이터만 연결하며 장기 경로·기술·투자수요는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      kind: "lt-leds",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "Sri Lanka Climate Prosperity Plan",
      submissionDate: "2023-06-03",
      documentYear: 2023,
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC Long-term strategies portal의 현재 제출표에서 스리랑카의 LT-LEDS를 확인했습니다.",
      notes: [
        "공식 포털은 최신 current submission을 기준으로 표시",
        "v109에서는 제출메타데이터만 연결하며 장기 경로·기술·투자수요는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      kind: "lt-leds",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "India's Long-Term Low-Carbon Development Strategy",
      submissionDate: "2022-11-14",
      documentYear: 2022,
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "UNFCCC Long-term strategies portal의 현재 제출표에서 인도의 LT-LEDS를 확인했습니다.",
      notes: [
        "공식 포털은 최신 current submission을 기준으로 표시",
        "v109에서는 제출메타데이터만 연결하며 장기 경로·기술·투자수요는 후속 원문 추출 대상",
      ],
    },
    {
      countryIso3: "MYS",
      countryNameKo: "말레이시아",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "EGY",
      countryNameKo: "이집트",
      kind: "lt-leds",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl:
        "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
      sourceAsOf: "UNFCCC Long-term strategies portal · 2026-08-18 확인",
      evidenceSummaryKo:
        "현재 UNFCCC Long-term strategies portal의 current submission 표에서 해당 국가 레코드를 확인하지 못했습니다.",
      notes: [
        "공식 포털 미등재를 국내 장기전략 부재로 단정하지 않음",
        "국내 전략문서와 UNFCCC 제출 LT-LEDS를 구분하여 후속 조사",
      ],
    },
    {
      countryIso3: "VNM",
      countryNameKo: "베트남",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle:
        "TNA Summary / TNA TAP and Project Ideas Adaptation & Mitigation",
      documentYear: 2012,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 베트남의 TNA·TAP·Project Ideas 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "BGD",
      countryNameKo: "방글라데시",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA Adaptation/Mitigation 및 TAP Adaptation/Mitigation",
      documentYear: 2012,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 방글라데시의 TNA·TAP 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "PHL",
      countryNameKo: "필리핀",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA Mitigation 2018 / TNA 2004",
      documentYear: 2018,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 필리핀의 TNA 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "KHM",
      countryNameKo: "캄보디아",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA and TAP Adaptation / Mitigation",
      documentYear: 2013,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 캄보디아의 TNA·TAP 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "IDN",
      countryNameKo: "인도네시아",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA and TAP Adaptation / Mitigation",
      documentYear: 2012,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 인도네시아의 TNA·TAP 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "LAO",
      countryNameKo: "라오스",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA Adaptation/Mitigation 및 TAP Adaptation/Mitigation",
      documentYear: 2018,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 라오스의 TNA·TAP 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "LKA",
      countryNameKo: "스리랑카",
      kind: "tna",
      status: "available",
      statusLabelKo: "공식 제출·원문 확인",
      documentTitle: "TNA Mitigation/Adaptation 및 TAP Adaptation/Mitigation",
      documentYear: 2012,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR Country Reports에서 스리랑카의 TNA·TAP 관련 공식 제출자료를 확인했습니다.",
      notes: [
        "TT:CLEAR는 TNA/TAP 및 관련 문서를 통해 기술 우선순위·장벽·실행방안 정보를 제공",
        "v109에서는 문서목록·연도까지만 연결하고 38대 기후기술 매핑은 후속 원문 검증 후 수행",
      ],
    },
    {
      countryIso3: "IND",
      countryNameKo: "인도",
      kind: "tna",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "2026년 6월 기준 UNFCCC TT:CLEAR Country Reports에서 독립 TNA/TAP 원문 항목을 확인하지 못했습니다.",
      notes: [
        "공식 Country Reports 미확인을 기술수요 부재로 해석하지 않음",
        "국가별 TNA 진행이력·국내문서·후속 제출을 별도 확인해야 함",
      ],
    },
    {
      countryIso3: "MYS",
      countryNameKo: "말레이시아",
      kind: "tna",
      status: "not_found_official_list",
      statusLabelKo: "현재 공식 목록에서 제출원문 미확인",
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "2026년 6월 기준 UNFCCC TT:CLEAR Country Reports에서 독립 TNA/TAP 원문 항목을 확인하지 못했습니다.",
      notes: [
        "공식 Country Reports 미확인을 기술수요 부재로 해석하지 않음",
        "국가별 TNA 진행이력·국내문서·후속 제출을 별도 확인해야 함",
      ],
    },
    {
      countryIso3: "EGY",
      countryNameKo: "이집트",
      kind: "tna",
      status: "related_record_only",
      statusLabelKo: "관련 공식 기록만 확인",
      documentTitle:
        "Building Egypts capacity to respond to UNFCCC including TNA 2001",
      documentYear: 2001,
      portalUrl: "https://unfccc.int/ttclear/tna/reports.html",
      sourceAsOf: "UNFCCC TT:CLEAR Country Reports · 2026-06 기준자료",
      evidenceSummaryKo:
        "UNFCCC TT:CLEAR에서 독립 TNA/TAP 항목 대신 TNA 2001을 포함하는 관련 공식 문서를 확인했습니다.",
      notes: [
        "독립 TNA/TAP 제출본과 동일하게 취급하지 않음",
        "기술 우선순위·장벽을 직접 판정하려면 관련 문서 원문 검토가 필요",
      ],
    },
  ];

const DATASET_ID_TO_KIND_V109: Record<string, CooperationPolicyKindV109> =
  Object.fromEntries(
    Object.entries(COOPERATION_POLICY_KIND_META_V109).map(([kind, meta]) => [
      meta.datasetId,
      kind as CooperationPolicyKindV109,
    ])
  );

export function isCooperationPolicyDatasetV109(datasetId: string): boolean {
  return Boolean(DATASET_ID_TO_KIND_V109[datasetId]);
}

export function getCooperationPolicyKindV109(
  datasetId: string
): CooperationPolicyKindV109 | null {
  return DATASET_ID_TO_KIND_V109[datasetId] ?? null;
}

export function getCooperationPolicyEvidenceV109(
  datasetId: string,
  countryIso3: string
): CooperationPolicyEvidenceRecordV109 | null {
  const kind = getCooperationPolicyKindV109(datasetId);
  if (!kind) return null;
  return (
    COOPERATION_POLICY_EVIDENCE_V109.find(
      (record) => record.kind === kind && record.countryIso3 === countryIso3
    ) ?? null
  );
}
