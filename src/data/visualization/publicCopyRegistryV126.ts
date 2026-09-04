import type { PublicAnalyticalRendererV126 } from "./publicVisualizationRegistryV126";
import { getPublicAnalysisHeadingsV134 } from "./publicAnalysisHeadingsV134";
import { technologyLabelV121 } from "../../utils/vietnamActualV121";
import { publicTextV126 } from "./publicFieldPolicyV126";

type PublicElementCopyV126 = {
  title: string;
  description: string;
};

const ELEMENT_COPY_V126: Record<string, PublicElementCopyV126> = {
  "A-001": {
    title: "부패인식지수와 장기 추이",
    description: "베트남의 부패인식지수 점수와 순위가 장기간 어떻게 변했는지 확인할 수 있습니다.",
  },
  "A-002": {
    title: "정책·제도 역량(CPIA)",
    description:
      "베트남의 경제관리, 구조정책, 사회적 포용, 공공부문 관리 역량과 장기 변화를 확인할 수 있습니다",
  },
  "A-003": {
    title: "경제 규모와 성장 추이",
    description: "GDP, GNI, 1인당 지표를 단위별로 나누어 장기 변화를 비교할 수 있습니다.",
  },
  "A-005": {
    title: "산업구조와 구성 변화",
    description: "산업별 부가가치 비중과 연도별 구성 변화를 확인할 수 있습니다.",
  },
  "A-010": {
    title: "온실가스별 배출량",
    description: "가스별 배출량과 전체 배출구성의 변화를 확인할 수 있습니다.",
  },
  "A-011": {
    title: "부문별 온실가스 배출량",
    description: "에너지·산업·농업·토지·폐기물 부문의 배출구성 변화를 확인할 수 있습니다.",
  },
  "A-017": {
    title: "기술별 균등화발전비용",
    description: "발전기술별 비용 수준을 동일 단위에서 비교할 수 있습니다.",
  },
  "A-018": {
    title: "발전설비 구성 변화",
    description: "발전기술별 설비용량과 구성비가 연도별로 어떻게 변했는지 확인할 수 있습니다.",
  },
  "B-033": {
    title: "연간 산림손실",
    description: "연도별 산림손실 추이와 성·시별 공간 분포를 함께 확인할 수 있습니다.",
  },
  "B-034": {
    title: "산림 탄소지표",
    description: "탄소 항목을 선택해 성·시별 값과 지역 차이를 비교할 수 있습니다.",
  },
  "C-016": {
    title: "재생에너지 지역계획",
    description: "기술과 기간을 선택해 실제 계획값이 있는 지역을 확인할 수 있습니다.",
  },
  "C-019": {
    title: "탄소시장 정책",
    description: "탄소시장 제도와 정책 변화의 주요 시점을 시간 순서로 확인할 수 있습니다.",
  },
  "D-005": {
    title: "기후예산의 적응·감축 배분",
    description:
      "예산 범위와 보고서 기준을 구분해 적응·감축·동시기여 지출 비율을 확인할 수 있습니다.",
  },
  "E-007": {
    title: "MRV 운영 현황과 근거",
    description: "측정·보고·검증 체계의 운영 상태와 공개 근거를 항목별로 확인할 수 있습니다.",
  },
  "E-008": {
    title: "연구·특허 성과",
    description: "연구와 특허 성과의 추이와 기술 분야별 구성을 확인할 수 있습니다.",
  },
  "E-012": {
    title: "직군별 종사자 수·임금",
    description: "직군과 성별에 따른 고용 규모, 구성비, 여성 비중과 임금 차이를 확인할 수 있습니다.",
  },
  "E-018": {
    title: "기업 진출 포트폴리오",
    description: "진출 기업과 사업 분야, 진행 상태를 포트폴리오 형태로 탐색할 수 있습니다.",
  },
  "E-019": {
    title: "한국기관 현지 사무소",
    description: "베트남 현지 한국기관의 사무소와 공개 연락처를 확인할 수 있습니다.",
  },
  "E-020": {
    title: "기업 지원 프로그램",
    description: "이용 가능한 지원 프로그램을 기관, 지원유형과 대상에 따라 탐색할 수 있습니다.",
  },
};

const RENDERER_TITLES_V126: Record<PublicAnalyticalRendererV126, string> = {
  "score-trend": "점수와 장기 추이",
  "kpi-trend": "핵심지표와 장기 추이",
  "multi-metric-trend": "복수 지표 추이",
  "composition-trend": "연도별 구성",
  "stacked-emissions": "연도별 배출 구성",
  "technology-comparison": "기술·분류 비교",
  "scenario-comparison": "시나리오 비교",
  seasonality: "시기별 변화",
  "policy-timeline": "정책 변화",
  "portfolio-dashboard": "사업 포트폴리오",
  directory: "기관·연락망",
  "evidence-matrix": "현황과 공개 근거",
  "capability-scorecard": "역량 현황",
  "spatial-analysis": "지역별 현황",
  "structured-table": "항목별 현황",
  "status-only": "데이터 제공 현황",
};

const CPIA_LABELS_V126: Record<string, string> = {
  "A-002_cpia_irai_overall": "IRAI 종합",
  "A-002_cpia_economic_management": "경제관리",
  "A-002_cpia_structural_policies": "구조정책",
  "A-002_cpia_social_inclusion": "사회적 포용",
  "A-002_cpia_public_sector": "공공부문 관리",
  "A-002_cpia_macr": "통화·환율 정책",
  "A-002_cpia_fisp": "재정 정책",
  "A-002_cpia_debt": "부채 정책·관리",
  "A-002_cpia_trad": "무역",
  "A-002_cpia_fins": "금융부문",
  "A-002_cpia_breg": "기업규제 환경",
  "A-002_cpia_gndr": "성평등",
  "A-002_cpia_equi": "공공재원 배분의 형평성",
  "A-002_cpia_pres": "공공재원 배분의 형평성",
  "A-002_cpia_hres": "인적자원 형성",
  "A-002_cpia_prot": "사회보호·노동",
  "A-002_cpia_envr": "환경지속가능성 정책",
  "A-002_cpia_prop": "재산권과 규칙 기반 거버넌스",
  "A-002_cpia_revn": "세입동원 효율성",
  "A-002_cpia_finq": "예산·재정관리의 질",
  "A-002_cpia_padm": "공공행정의 질",
  "A-002_cpia_tran": "공공부문 투명성·책임성·부패",
};

const PUBLIC_FORBIDDEN_COPY_V126 =
  /\.xlsx|SDMX\s*flat|INDICATOR=|COMP_BREAKDOWN|REF_AREA=|sourceFile|sourceSheet|sourceRow|recordId|indicatorId|apiParams|packUrl|shardId|sha256|publicationDecisionId|MultiLineString|MapLibre|technical provenance/iu;

export function publicElementCopyV126(
  elementId: string,
  renderer: PublicAnalyticalRendererV126
): PublicElementCopyV126 {
  const headings = getPublicAnalysisHeadingsV134(elementId);
  return (
    ELEMENT_COPY_V126[elementId] ||
    (headings
      ? {
          title: headings.publicAnalysisTitle,
          description: headings.publicQuestion,
        }
      : renderer === "status-only"
      ? {
          title: RENDERER_TITLES_V126[renderer],
          description:
            "현재 공개된 실제 값이 없어 자료 확보 또는 입력 진행 상태를 안내합니다.",
        }
      : {
          title: RENDERER_TITLES_V126[renderer],
          description:
            "공개된 측정값과 분류를 선택해 시점별 변화와 항목 간 차이를 확인할 수 있습니다.",
        })
  );
}

export function publicCpiaLabelV126(
  indicatorId: string,
  fallback: string
): string {
  return CPIA_LABELS_V126[indicatorId] || publicMeasureLabelV126(fallback);
}

export function publicMeasureLabelV126(labelValue: string): string {
  const label = labelValue
    // A few measures are named after the store they came out of - "원본 레코드
    // 수". The quantity is real; the word for a row is not one a reader uses.
    .replace(/레코드/gu, "자료")
    .replace(/^CPIA\s+[A-D]\.\s*/iu, "")
    .replace(/\s*\u00b7\s*베트남(?:\s*[—–-].*)?$/u, "")
    .replace(/\s*[—–]\s*1\(낮음\)~6\(높음\).*$/u, "")
    .replace(/\s+클러스터\s*평균$/u, "")
    .trim();
  return label || "항목";
}

export function publicDimensionLabelV126(
  keyValue: string,
  labelValue?: string
): string {
  const key = keyValue.trim().toLocaleLowerCase("en-US");
  const labels: Record<string, string> = {
    // Keys the generic renderer offers as selectors. Each is a translation of a
    // column that exists in the source, not a name invented for it: without
    // these the selector printed the key itself - "financingType", "dacSectorCode".
    a64status: "상태",
    agreementtype: "협정 유형",
    amountstatus: "금액 구분",
    amounttype: "금액 유형",
    capacity: "설비용량",
    capacityband: "용량 구간",
    collectionstatus: "자료 상태",
    commissioningyear: "준공연도",
    contacttype: "연락 유형",
    facilitytype: "시설 유형",
    financingtype: "재원 유형",
    fueltype: "연료 유형",
    fueltyperaw: "연료 유형",
    fund: "기금",
    fundoraffiliate: "기금·소속기관",
    gcfprojecttype: "사업 유형",
    hqcountryiso3: "본부 소재국",
    investsector: "투자 분야",
    orgcategory: "기관 구분",
    orgtype: "기관 유형",
    recordsourcetype: "출처 유형",
    recordstatus: "상태",
    referenceyear: "기준연도",
    role: "역할",
    sectors: "부문",
    targetcountry: "대상국",
    targetregion: "대상 지역",
    technologyfield: "기술 분야",
    type: "유형",
    typeofinformation: "정보 유형",

    category: "분류",
    city: "도시",
    cluster: "부문",
    country: "국가",
    dacsectorcode: "분야",
    entitytype: "자료 유형",
    gas: "온실가스",
    industry: "산업",
    measure: "항목",
    occupation: "직군",
    organization: "기관",
    organizationtype: "기관 유형",
    period: "기간",
    programtype: "프로그램 유형",
    province: "성·시",
    region: "지역",
    regionname: "지역",
    scenario: "시나리오",
    sector: "부문",
    sex: "성별",
    status: "상태",
    supporttype: "지원 유형",
    target: "지원 대상",
    targetgroup: "지원 대상",
    technology: "기술",
    year: "연도",
  };
  const mapped = labels[key.replace(/[_\s-]/g, "")];
  if (mapped) return mapped;

  const label = publicCopyOrEmptyV126(labelValue);
  if (label && !isIdentifierLikeV136_2(label)) return label;
  // The label is still the stored column key - "dacSectorCode" reached a
  // selector on the public screen this way. A reader cannot use a key, and
  // prettifying it only produces "dac Sector Code", so name the role instead.
  return "분류";
}

/**
 * True for text that is an ASCII identifier rather than a name: camelCase,
 * snake_case or a bare lowercase token. Korean labels never match.
 */
function isIdentifierLikeV136_2(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9]*(?:[_-][A-Za-z0-9]+)*$/u.test(value.trim());
}

const PUBLIC_DIMENSION_VALUE_LABELS_V134: Record<string, string> = {
  GOLD_STANDARD_CERTIFIED_DESIGN: "Gold Standard 설계 인증",
  GOLD_STANDARD_CERTIFIED_PROJECT: "Gold Standard 사업 인증",
  "Late to verify": "검증 지연",
  LISTED: "목록 등재",
  Registered: "등록",
  "Registration requested": "등록 요청",
  "Under development": "개발 중",
  "Under validation": "타당성 검토 중",
  "Units Transferred from Approved GHG Program":
    "승인된 온실가스 프로그램에서 이전",
  "Verification approval requested": "검증 승인 요청",
  Withdrawn: "철회",
};

/**
 * The dimensions a KPI support line may name.
 *
 * The line used to join every dimension the winning row happened to be keyed
 * by, which on the investment portfolio meant "1 · 2 · 3 … 38" - the sector
 * codes, printed raw because no label exists for them. A dimension earns its
 * place only if it resolves to something a reader recognises, and two of them
 * is already as much context as a three-line card can carry.
 */
export function publicDimensionContextV136_2(
  dimensionLabels: Record<string, string>,
  limit = 2
): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const [key, rawValue] of Object.entries(dimensionLabels || {})) {
    if (["year", "period"].includes(key)) continue;
    const value = publicDimensionValueV134(key, String(rawValue ?? ""));
    if (!value) continue;
    // A bare number is a category code, and so is a list of them: the sector
    // dimension arrives as one value reading "1 · 2 · 3 … 38". No label exists
    // for those codes, and inventing one would misreport the data.
    if (isNumericCodeListV136_2(value)) continue;
    if (isIdentifierLikeV136_2(value)) continue;
    if (value === "분류 미기재") continue;
    // How the figure was totalled belongs with the source notes, not in the
    // three lines under it.
    if (AGGREGATION_BASIS_PATTERN_V136_2.test(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    kept.push(value);
    if (kept.length >= limit) break;
  }
  return kept;
}

/**
 * True when the value is a number, or a separator-joined run of numbers.
 *
 * Category codes reach the renderer either one per dimension or already joined
 * into a single value, and both forms read the same to a person: a sequence of
 * bare integers standing where a name should be.
 */
function isNumericCodeListV136_2(value: string): boolean {
  const parts = value
    .split(/[·,/|;、]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => /^-?\d+(?:\.\d+)?$/u.test(part));
}

/** Phrases that describe how a figure was computed rather than what it is. */
const AGGREGATION_BASIS_PATTERN_V136_2 =
  /단순\s*합|합계|총계|집계|누계|가중\s*평균|평균값 산출/u;

/**
 * The basis on which a total was reached, for the source panel.
 *
 * The investment portfolio's headline used to read "… 투자 약정액 합계 · 기후
 * 태깅 프로젝트 단순합 · 1 · 2 · 3 …". The first part is a real statement about
 * what was counted and belongs with the other source notes; the rest was never
 * fit to show.
 */
export function publicAggregationBasisV136_2(
  dimensionLabelSets: ReadonlyArray<Record<string, string>>
): string[] {
  const seen = new Set<string>();
  for (const labels of dimensionLabelSets) {
    for (const [key, rawValue] of Object.entries(labels || {})) {
      if (["year", "period"].includes(key)) continue;
      const value = publicTextV126(String(rawValue ?? ""));
      if (!value || !AGGREGATION_BASIS_PATTERN_V136_2.test(value)) continue;
      if (isNumericCodeListV136_2(value)) continue;
      // "…단순합" names the arithmetic we performed, which explains nothing a
      // reader needs. What was counted does belong here.
      if (IMPLEMENTATION_ONLY_BASIS_V136_2.test(value)) continue;
      seen.add(value);
    }
  }
  return [...seen].slice(0, 3);
}

/**
 * A metric label with the trailing methodology clause removed.
 *
 * The portfolio metrics are labelled "투자 약정액 합계 - 기후 태깅 프로젝트
 * 단순합". What was counted is worth saying; that we added the rows up is not,
 * and it was the widest thing on the card.
 */
export function publicMetricLabelV136_2(labelValue: string): string {
  const label = publicMeasureLabelV126(String(labelValue ?? ""));
  const parts = label.split(/\s*[—–]\s*|\s+-\s+/u);
  const kept = parts.filter(
    (part, index) => index === 0 || !IMPLEMENTATION_ONLY_BASIS_V136_2.test(part)
  );
  return kept.join(" — ").trim() || label;
}

/** Wording that describes the computation itself rather than its subject. */
const IMPLEMENTATION_ONLY_BASIS_V136_2 =
  /단순\s*합|집계\s*방식|가중\s*평균\s*미적용|합계\s*산출/u;

/** Converts stored dimension codes into stable public selector/chart labels. */
export function publicDimensionValueV134(
  keyValue: string,
  value: string
): string {
  const mapped = PUBLIC_DIMENSION_VALUE_LABELS_V134[value.trim()];
  if (mapped) return mapped;

  const key = keyValue.replace(/[_\s-]/gu, "").toLocaleLowerCase("en-US");
  if (key.includes("technology")) {
    const technologyIds = Array.from(
      new Set(value.match(/\bCTIS-\d{2}\b/giu) || [])
    );
    if (technologyIds.length > 0) {
      const remainder = value
        .replace(/\bCTIS-\d{2}\b/giu, "")
        .replace(/^[\s,·|:;-]+|[\s,·|:;-]+$/gu, "")
        .trim();
      if (remainder) {
        const safeRemainder = publicTextV126(remainder);
        if (safeRemainder) return safeRemainder;
      }
      if (technologyIds.length <= 4) {
        return technologyIds.map(technologyLabelV121).join(" · ");
      }
      return `기후기술 ${technologyIds.length}개 분야`;
    }
  }

  // A stored value may still name a row rather than a thing ("원본 레코드 수").
  return publicTextV126(value)?.replace(/레코드/gu, "자료") || "분류 미기재";
}

export function publicCopyOrEmptyV126(value: unknown): string {
  if (typeof value !== "string") return "";
  const copy = value.trim();
  if (!copy || PUBLIC_FORBIDDEN_COPY_V126.test(copy)) return "";
  return copy;
}
