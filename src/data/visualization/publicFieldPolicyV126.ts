import { publicProcessWordingV162 } from "./processWordingV162";
import { publicWorkMemoV164 } from "./publicWorkMemoV164";
import { publicDownloadTextV163 } from "./publicDownloadNoteV163";
import type { CountryCatalogItemV122 } from "../countries/countryDataTypesV122";
import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../vietnam/vietnamTypesV124";
import type {
  IndicatorSemanticV125,
  RecordSemanticV125,
} from "./semanticTypesV125";
import { publicEntityTitleV131 } from "./publicEntityTitleV131";

export const PUBLIC_ANALYSIS_FIELDS_V126 = [
  "country",
  "element",
  "measure",
  "category",
  "region",
  "sex",
  "technology",
  "scenario",
  "value",
  "unit",
  "year",
  "period",
  "entityName",
  "entityType",
  "approvedEntityAttributes",
  "missingReason",
] as const;

export const PUBLIC_SOURCE_FIELDS_V126 = [
  "sourceOrganization",
  "sourceTitle",
  "sourceUrl",
  "referenceYear",
  "license",
  "attribution",
  "caveat",
  "citation",
] as const;

export const TECHNICAL_PROVENANCE_FIELDS_V126 = [
  "sourceFileOriginal",
  "sourceFileDecoded",
  "sourceFile",
  "sourceSheet",
  "sourceRow",
  "sourceSeriesId",
  "indicatorId",
  "recordId",
  "elementId",
  "apiEndpoint",
  "apiParams",
  "rawAttributes",
  "rawAttributesJson",
  "normalizedAttributes",
  "attributesJson",
  "provenance",
  "packUrl",
  "shardId",
  "sha256",
  "publicationDecisionId",
  "sourcePackage",
  "extraMeta",
  "schemaVersion",
  "generatorVersion",
  "etlVersion",
  "internalPath",
] as const;

export const PUBLIC_ANALYSIS_FIELDS = PUBLIC_ANALYSIS_FIELDS_V126;
export const PUBLIC_SOURCE_FIELDS = PUBLIC_SOURCE_FIELDS_V126;
export const TECHNICAL_PROVENANCE_FIELDS =
  TECHNICAL_PROVENANCE_FIELDS_V126;

export type PublicPrimitiveV126 = string | number | boolean | null;
export type PublicAttributeValueV126 =
  | PublicPrimitiveV126
  | PublicPrimitiveV126[];

export type PublicSourceViewV126 = {
  organization: string | null;
  datasetTitle: string;
  url: string | null;
  referenceYear: string | null;
  license: string | null;
  attribution: string | null;
  caveat: string | null;
  citation: string | null;
};

export type PublicDownloadRowV126 = {
  country: string;
  element: string;
  record_type: "observation" | "entity";
  measure: string;
  category: string | null;
  region: string | null;
  sex: string | null;
  technology: string | null;
  scenario: string | null;
  value: number | string | boolean | null;
  unit: string | null;
  year: number | null;
  period: string | null;
  entity_name: string | null;
  entity_type: string | null;
  source_organization: string | null;
  source_title: string;
  source_url: string | null;
  license: string | null;
  attribution: string | null;
  missing_reason: string | null;
  public_note: string | null;
  official_citation: string | null;
  entityAttributes: Record<string, PublicAttributeValueV126>;
};

export type PublicProjectionInputV126 = {
  element: CountryCatalogItemV122;
  metadataById: Map<string, VietnamIndicatorMetaV124>;
  indicatorSemantics?: IndicatorSemanticV125[];
  recordSemantics?: RecordSemanticV125[];
};

export type PublicObservationProjectionInputV126 =
  PublicProjectionInputV126 & {
    observations: VietnamObservationV124[];
  };

export type PublicEntityProjectionInputV126 = PublicProjectionInputV126 & {
  entities: VietnamEntityV124[];
};

const PUBLIC_DOM_FORBIDDEN_VALUE_PATTERNS_V126: RegExp[] = [
  /\.xlsx\b/i,
  /\bSDMX\s+flat\b/i,
  /\bINDICATOR\s*=/i,
  /\bCOMP_BREAKDOWN\b/i,
  /\bREF_AREA\s*=/i,
  /\bsourceFile(?:Original|Decoded)?\b/i,
  /\bsourceSheet\b/i,
  /\bsourceRow\b/i,
  /\brecordId\b/i,
  /\bindicatorId\b/i,
  /\bapiParams\b/i,
  /\bpackUrl\b/i,
  /\bshardId\b/i,
  /\bsha256\b/i,
  /\bpublicationDecisionId\b/i,
  /(?:워크시트|시트).{0,80}?\d+(?:\s*[–—~\-]\s*\d+)?\s*행/u,
  /\[?\s*원본\s+\d+(?:(?:\s*[–—~\-·]\s*)\d+)*\s*행\s*\]?/u,
  /원본\s*(?:파일|시트|행|위치)/u,
  /\bMultiLineString\b/i,
  /\bgeometry\b/i,
  /\bMapLibre\b/i,
  /\brenderer\b/i,
];

const TECHNICAL_FIELD_KEYS_NORMALIZED_V126 = new Set(
  TECHNICAL_PROVENANCE_FIELDS_V126.map((key) => normalizeKeyV126(key))
);

const MISSING_REASON_LABELS_V126: Record<string, string> = {
  M01: "출처에서 값을 제공하지 않음",
  M02: "원천 기관이 공개하지 않음",
  M03: "해당 제도·현상이 존재하지 않음",
  M04: "유료 자료로 공개 범위에서 제외",
  M05: "원천 이용조건에 따라 제공하지 않음",
  M06: "일부 세부항목은 아직 수집되지 않음",
  M07: "현지조사가 필요함",
  M08: "정의 또는 범위가 달라 비교할 수 없음",
  M09: "기준시점이 달라 비교할 수 없음",
  M10: "원천 확인 중",
};

const PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_TEMPLATE_V126: Record<string, string[]> = {
  spatial: [
    "name",
    "plantName",
    "mineName",
    "fuelType",
    "capacityMw",
    "capacityBand",
    "mineral",
    "regionName",
    "status",
    "commissioningYear",
    "owner",
  ],
  entity: [
    "name",
    "title",
    "organizationName",
    "orgName",
    "orgType",
    "orgCategory",
    "companyName",
    "technologyField",
    "sector",
    "status",
    "regionName",
    "city",
    "websiteUrl",
    "website",
  ],
  project: [
    "projectName",
    "fund",
    "implementingEntity",
    "accreditedEntity",
    "sector",
    "status",
    "projectPeriod",
    "approvalDate",
    "approvedAmount",
    "approvedAmountNumeric",
    "disbursedAmount",
    "commitmentAmount",
    "vietnamAllocation",
  ],
  finance: [
    "projectName",
    "fund",
    "implementingEntity",
    "accreditedEntity",
    "sector",
    "status",
    "approvalDate",
    "approvedAmount",
    "approvedAmountNumeric",
    "disbursedAmount",
    "commitmentAmount",
    "primaryFinanceAmount",
    "vietnamAllocation",
  ],
  partner: [
    "organizationName",
    "orgName",
    "name",
    "companyName",
    "supportingOrganization",
    "orgType",
    "orgCategory",
    "organizationType",
    "role",
    "city",
    "address",
    "officeAddress",
    "officeProgram",
    "focalPointName",
    "personName",
    "contactName",
    "focalPointTitle",
    "title",
    "email",
    "emailAlt",
    "phone",
    "telephone",
    "fax",
    "contact",
    "technologyField",
    "sector",
    "supportType",
    "eligibleRecipients",
    "budgetScale",
    "supportLimit",
    "applicationPeriod",
    "websiteUrl",
    "website",
    // V153: E-006 investors - head office country, sector, fund and the
    // ETL's location class/province are public facts of the organisation.
    "hqCountryIso3",
    "investSector",
    "fundOrAffiliate",
    "locationClass",
    "adm1Name34",
  ],
  policy: [
    "title",
    "name",
    "documentName",
    "version",
    "publicationDate",
    "agreementType",
    "signedDate",
    "scope",
    "sector",
    "status",
  ],
  "technology-demand": [
    "name",
    "technologyName",
    "technologyField",
    "track",
    "sector",
    "rank",
    "barrier",
    "projectIdea",
  ],
  indicator: [
    "name",
    "title",
    "regionName",
    "sector",
    "status",
    "referenceYear",
  ],
  composition: [
    "name",
    "title",
    "regionName",
    "sector",
    "status",
    "referenceYear",
  ],
};

/**
 * The ODA project sheets label their columns in Korean, so none of them matched
 * the template key lists and D-014, D-015, D-016 and D-017 printed a project
 * title, a link, and nothing else - no reporting body, no amount, no period,
 * for 1,056 records. These are the delivery's own column names, read as they
 * are printed. The internal columns it also carries (기술매핑_근거, 원지표ID,
 * 레코드구분, 구분태그) stay out.
 */
const ODA_PROJECT_COLUMNS_V137 = [
  "보고기관",
  "시행기관",
  "분야_DAC",
  "약정액_합계",
  "지출액_합계",
  "사업기간",
  "보고연도",
  "사업번호",
  "상태",
  "원조유형",
  "자금형태",
  "38대_기후기술",
];

/**
 * C-001 to C-025 are delivered on one shared template whose columns are named
 * 속성1(레코드명), 속성3(값), 속성4(시점) and so on. None of those matched a
 * template key list, so twenty-two policy screens showed a card title, a link,
 * and nothing else. These are the delivery's own columns; the record id, the
 * P-code and the two 기술코드 reasoning columns are left out.
 */
const SHARED_C_TEMPLATE_COLUMNS_V137 = [
  "속성3_값",
  "속성4_시점",
  "속성5_등록표준_출처",
  "속성6_분류",
  "속성7_상태",
  "속성8_사업자_기관",
  "속성9_방법론",
  "속성10_건수",
  "속성11_발행량_tCO2e",
  "속성12_소각량_tCO2e",
  "속성13_배분량_tCO2e",
  "속성14_연간예상감축_tCO2e",
  "속성15_빈티지_연도",
  "속성16_발행일",
  "속성17_크레딧기간",
  "속성18_업종",
  "속성20_지역_원문",
  "속성23_설명",
];

/**
 * B-017, B-029, B-037, B-039 and B-040 carry a national series in three columns
 * of their own - what was measured, the value and its unit - and none of them
 * reached the card, which showed a region and a year and nothing else.
 */
const NATIONAL_SERIES_COLUMNS_V137 = [
  "전국_지표명",
  "전국_값",
  "전국_단위",
  // Both spellings appear across the deliveries.
  "연도",
  "기준연도",
];

/**
 * B-023 and B-028 state a measured value, its unit and where it was taken in
 * columns of their own; the cards showed a record key and nothing else.
 */
const POINT_MEASUREMENT_COLUMNS_V137 = [
  "지표명",
  "값",
  "단위",
  "기준연도",
  "지점_유역명",
  "위치_설명",
  "공간_단위",
];

const PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_ELEMENT_V126: Record<string, string[]> = {
  // E-016 states Korea's technology level, the gap in years and the leading
  // country in columns of its own; every one of its four rows read "세부 내용은
  // 상세 데이터에서 확인".
  "E-016": ["field_8c8721a1", "field_a1c8da40", "field_edf04a1a"],
  "B-017": NATIONAL_SERIES_COLUMNS_V137,
  "B-023": POINT_MEASUREMENT_COLUMNS_V137,
  "B-028": POINT_MEASUREMENT_COLUMNS_V137,
  "B-029": NATIONAL_SERIES_COLUMNS_V137,
  "B-037": NATIONAL_SERIES_COLUMNS_V137,
  "B-039": NATIONAL_SERIES_COLUMNS_V137,
  "B-040": NATIONAL_SERIES_COLUMNS_V137,
  "C-001": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-002": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-003": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-004": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-005": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-006": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-007": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-008": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-009": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-010": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-011": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-012": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-013": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-014": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-015": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-016": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-017": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-018": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-019": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-022": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-024": SHARED_C_TEMPLATE_COLUMNS_V137,
  "C-025": SHARED_C_TEMPLATE_COLUMNS_V137,
  "D-014": ODA_PROJECT_COLUMNS_V137,
  "D-015": ODA_PROJECT_COLUMNS_V137,
  "D-016": [...ODA_PROJECT_COLUMNS_V137, "기관유형"],
  "D-017": [
    "발주기관",
    "분야",
    "예산",
    "예산유형",
    "사업기간",
    "상태",
    "입찰유형",
    "공고일",
    "마감일",
    "수행기관_자격요건",
  ],
  // The venture and impact investment sheet names its columns in Korean; three
  // "Stride" cards were three funding rounds with nothing on them to say so.
  "D-024": [
    "투자_라운드",
    "투자_연도",
    "투자_금액",
    "투자자명",
    "기후_분야",
    "기술_사업_내용",
    "공동투자_형태",
    "공동투자_가능여부",
    "국가",
    "출처",
  ],
  "E-018": [
    "field_2004eb5a",
    "field_8440b85d",
    "field_a2123512",
    "field_aea118f0",
    "진출_상태",
  ],
  "E-019": ["field_6b3e1e90", "field_8d39bebf"],
  "E-020": ["field_01856451"],
};

const PUBLIC_ENTITY_ATTRIBUTE_OUTPUT_KEYS_V126: Record<string, string> = {
  field_8c8721a1: "koreaTechnologyLevel",
  field_a1c8da40: "technologyGapYears",
  field_edf04a1a: "leadingCountry",
  지표명: "measureName",
  값: "statedValue",
  단위: "statedUnit",
  기준연도: "referenceYear",
  지점_유역명: "siteName",
  위치_설명: "siteDescription",
  전국_지표명: "nationalMeasureName",
  전국_값: "nationalMeasureValue",
  전국_단위: "nationalMeasureUnit",
  연도: "referenceYear",
  투자_라운드: "investmentRound",
  투자_연도: "investmentYear",
  투자_금액: "investmentAmount",
  투자자명: "investorName",
  기후_분야: "technologyField",
  기술_사업_내용: "businessSector",
  공동투자_형태: "coInvestmentForm",
  공동투자_가능여부: "coInvestmentAvailability",
  국가: "regionName",
  속성3_값: "statedValue",
  속성4_시점: "statedPeriod",
  속성5_등록표준_출처: "registryStandard",
  속성6_분류: "recordCategory",
  속성7_상태: "status",
  속성8_사업자_기관: "supportingOrganization",
  속성9_방법론: "methodology",
  속성10_건수: "recordCount",
  속성11_발행량_tCO2e: "issuedVolume",
  속성12_소각량_tCO2e: "retiredVolume",
  속성13_배분량_tCO2e: "allocatedVolume",
  속성14_연간예상감축_tCO2e: "expectedAnnualReduction",
  속성15_빈티지_연도: "vintageYear",
  속성16_발행일: "issuanceDate",
  속성17_크레딧기간: "creditingPeriod",
  속성18_업종: "businessSector",
  속성20_지역_원문: "regionName",
  속성23_설명: "recordDescription",
  보고기관: "supportingOrganization",
  시행기관: "implementingEntity",
  발주기관: "supportingOrganization",
  분야_DAC: "sector",
  분야: "sector",
  약정액_합계: "commitmentAmount",
  지출액_합계: "disbursedAmount",
  예산: "budgetScale",
  예산유형: "budgetType",
  사업기간: "projectPeriod",
  보고연도: "reportingPeriod",
  사업번호: "projectNumber",
  상태: "status",
  원조유형: "aidType",
  자금형태: "financeType",
  입찰유형: "supportType",
  공고일: "announcementDate",
  마감일: "applicationDeadline",
  수행기관_자격요건: "eligibleRecipients",
  기관유형: "organizationType",
  "38대_기후기술": "technologyField",
  field_2004eb5a: "technologyRelevance",
  field_8440b85d: "entryTiming",
  field_a2123512: "businessSector",
  field_aea118f0: "entryMode",
  진출_상태: "entryStatus",
  field_6b3e1e90: "primaryResponsibilities",
  field_8d39bebf: "additionalContact",
  field_01856451: "programName",
};

const PUBLIC_ENTITY_ATTRIBUTE_LABELS_V126: Record<string, string> = {
  // V162: E-006 investor register columns (the detail's raw-data table headed
  // them with the field names).
  hqCountryIso3: "본부 국가",
  investSector: "투자 분야",
  fundOrAffiliate: "펀드·계열사",
  locationClass: "소재 구분",
  adm1Name34: "성·시(개편 후 34개)",
  koreaTechnologyLevel: "한국 기술수준",
  technologyGapYears: "기술격차(년)",
  leadingCountry: "최고(선도)국",
  measureName: "지표",
  statedUnit: "단위",
  siteName: "지점·유역",
  siteDescription: "위치",
  nationalMeasureName: "전국 지표",
  nationalMeasureValue: "전국 값",
  nationalMeasureUnit: "단위",
  investmentRound: "투자 라운드",
  investmentYear: "투자 연도",
  investmentAmount: "투자 금액",
  investorName: "투자자",
  coInvestmentForm: "공동투자 형태",
  coInvestmentAvailability: "공동투자 가능 여부",
  statedValue: "값",
  statedPeriod: "시점",
  registryStandard: "등록표준·출처",
  recordCategory: "분류",
  methodology: "방법론",
  recordCount: "건수",
  issuedVolume: "발행량(tCO2e)",
  retiredVolume: "소각량(tCO2e)",
  allocatedVolume: "배분량(tCO2e)",
  expectedAnnualReduction: "연간 예상감축(tCO2e)",
  vintageYear: "빈티지 연도",
  issuanceDate: "발행일",
  creditingPeriod: "크레딧 기간",
  recordDescription: "설명",
  reportingPeriod: "보고연도",
  projectNumber: "사업번호",
  aidType: "원조유형",
  financeType: "자금형태",
  budgetType: "예산유형",
  announcementDate: "공고일",
  applicationDeadline: "마감일",
  name: "명칭",
  title: "제목",
  projectName: "사업명",
  plantName: "발전소명",
  mineName: "광산명",
  organizationName: "기관명",
  orgName: "기관명",
  companyName: "기업명",
  supportingOrganization: "지원기관",
  orgType: "기관 유형",
  orgCategory: "기관 유형",
  organizationType: "기관 유형",
  role: "역할",
  city: "도시",
  address: "주소",
  officeAddress: "사무소 주소",
  officeProgram: "담당 업무",
  focalPointName: "담당자명",
  personName: "담당자명",
  contactName: "담당자명",
  focalPointTitle: "직함",
  email: "이메일",
  emailAlt: "보조 이메일",
  phone: "전화번호",
  telephone: "전화번호",
  fax: "팩스",
  contact: "연락처",
  websiteUrl: "웹사이트",
  website: "웹사이트",
  fuelType: "발전원",
  capacityMw: "설비용량(MW)",
  capacityBand: "용량 구간",
  mineral: "광종",
  regionName: "지역",
  status: "상태",
  commissioningYear: "준공연도",
  owner: "소유자",
  technologyName: "기술명",
  technologyField: "기술 분야",
  technologyRelevance: "기술 분야·연관성",
  entryTiming: "진출 시점",
  businessSector: "사업 분야",
  entryMode: "진출 형태",
  entryStatus: "진출 상태",
  primaryResponsibilities: "주요 업무",
  additionalContact: "추가 연락 정보",
  programName: "지원 프로그램명",
  supportType: "지원 유형",
  eligibleRecipients: "지원 대상",
  budgetScale: "예산 규모",
  supportLimit: "지원 한도",
  applicationPeriod: "신청 시기",
  track: "유형",
  sector: "분야",
  rank: "순위",
  barrier: "장애요인",
  projectIdea: "사업 아이디어",
  fund: "기금",
  implementingEntity: "실행기관",
  accreditedEntity: "인가기관",
  projectPeriod: "사업 기간",
  approvalDate: "승인일",
  approvedAmount: "승인액",
  approvedAmountNumeric: "승인액",
  disbursedAmount: "집행액",
  commitmentAmount: "약정액",
  primaryFinanceAmount: "대표 금융값",
  vietnamAllocation: "베트남 귀속액",
  documentName: "문서명",
  version: "버전",
  publicationDate: "공개일",
  agreementType: "협정 유형",
  signedDate: "체결일",
  scope: "대상 분야",
  referenceYear: "기준연도",
};

const DIMENSION_KEY_GROUPS_V126: Record<
  "region" | "sex" | "technology" | "scenario",
  string[]
> = {
  region: [
    "region",
    "regionName",
    "targetRegion",
    "province",
    "provinceName",
    "adm1",
    "adm1Name",
    "city",
    "targetCountry",
  ],
  sex: ["sex", "gender"],
  technology: [
    "technology",
    "technologyName",
    "technologyField",
    "fuelType",
  ],
  scenario: ["scenario", "pathway", "projection", "case"],
};

const RESERVED_DIMENSION_KEYS_V126 = new Set(
  [
    "year",
    "period",
    "referenceYear",
    "currency",
    ...DIMENSION_KEY_GROUPS_V126.region,
    ...DIMENSION_KEY_GROUPS_V126.sex,
    ...DIMENSION_KEY_GROUPS_V126.technology,
    ...DIMENSION_KEY_GROUPS_V126.scenario,
  ].map((key) => normalizeKeyV126(key))
);

export const PUBLIC_DOWNLOAD_HEADERS_V126 = [
  "country",
  "element",
  "record_type",
  "measure",
  "category",
  "region",
  "sex",
  "technology",
  "scenario",
  "value",
  "unit",
  "year",
  "period",
  "entity_name",
  "entity_type",
  "source_organization",
  "source_title",
  "source_url",
  "license",
  "attribution",
  "missing_reason",
  "public_note",
  "official_citation",
] as const;

function normalizeKeyV126(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * A row identifier the compiler put at the head of a note.
 *
 * A-013's 365 rows begin "[연계 일련번호: 139] SDG1 · …" and A-024's 722 begin
 * "[구간 일련번호: 10] …". The number addresses whoever maintains the sheet; the
 * sentence after it is what a reader came for. The identifier is still carried
 * on the record and in the download.
 */
/**
 * A series id the builder appended to tell two identical labels apart.
 *
 * B-010's two 2024 events carry the same printed label, so the semantic
 * builder disambiguated them with the indicator id - "· cri_event_2024_01".
 * The value beside the label already tells the reader which event it is.
 */
const TRAILING_SERIES_ID_V137 = /\s*·\s*[a-z0-9]+(?:_[a-z0-9]+)+\s*$/u;

/**
 * A closing bracket the delivery left without its opener. C-019 ships every
 * row name as "FIT / FIP / RPS 도입 여부] 풍력 FIT 종료일".
 */
/**
 * Notes the compilers wrote to each other.
 *
 * The licence field carried an internal review flag on seventeen screens
 * ("[DoD S-07 잠정] NIGT 비영리 해당여부 확정 후 재판정(라이선스 전수확인 v1.0)"),
 * five carried a correction-log entry and a working file name ("raw:
 * C-024_참여기금_모순해소_원문확인_2026-08-18.md"), and the unit field on the
 * climate projections read "지표별 상이(속성 열 참조)" - a pointer to a column of
 * the source workbook. The licence, the correction and the unit all stay; the
 * internal reference to how they were recorded does not.
 */
const INTERNAL_REVIEW_NOTES_V137: readonly RegExp[] = [
  // the licensing review flag and the sentence it opens
  /\s*\[\s*DoD\s+S-\d+[^\]]*\][^·/]*/gu,
  // a working file the compiler cited, however it referenced it. A file
  // name can hold a middle dot ('C-019_환경보호세·탄소거래소_...md'), so the
  // no-space form is tried before the separator-bounded one.
  /\s*raw\s*[:：/]\s*(?:\S+|[^·]+?)\.(?:md|pdf)(?:\s*로컬\s*보관)?/gu,
  // a correction-log entry
  /\s*\[\s*\d+차\s*정정\s*\][^·/]*/gu,
  // a pointer to a source-workbook column
  /\s*\(\s*속성\s*열\s*참조\s*\)/gu,
  // the collection sheet's own version
  /수집현황\s*v[\d.]+/gu,
  // the sentence that records the transcription rather than the data
  /\s*수집현황의?\s*요소\s*[A-E]-\d{3}\s*행에[^.]*\.\s*/gu,
  // the internal sheet name
  /\s*1\.2_entity\s*/gu,
  // which element's boundary file a location was drawn from ("8대 하천유역 —
  // B-025 폴리곤 재사용"): a note to the compiler, the place name stays
  /\s*[-—–]\s*[A-E]-\d{3}\s*폴리곤\s*재사용\s*/gu,
];

const KEPT_SOURCE_FILE_V162 = /보관\s*원자료\s+(?!https?:)[^\s()（）]+\.pdf\b/gu;

const OWN_FILE_ROW_POINTER_V162 = [/\s*\(\s*본\s*파일\s*r\d+[^)]*\)/gu, /\s*,\s*본\s*파일\s*r\d+/gu] as const;

const UNMATCHED_CLOSING_BRACKET_V137 = /^([^[\]]*)\]\s*/u;

const LEADING_ROW_IDENTIFIER_V137 =
  /^\s*[[(]\s*(?:OSM\s*ID|[^\][()]*?일련번호|레코드\s*ID|행\s*번호)\s*[:：][^\])]*[\])]\s*/u;

function normalizeTextV126(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const chained = value
    .replace(LEADING_ROW_IDENTIFIER_V137, "")
    .replace(TRAILING_SERIES_ID_V137, "")
    .replace(UNMATCHED_CLOSING_BRACKET_V137, "$1 ")
    .replace(INTERNAL_REVIEW_NOTES_V137[0], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[1], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[2], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[3], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[4], "수집현황")
    .replace(INTERNAL_REVIEW_NOTES_V137[5], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[6], "")
    .replace(INTERNAL_REVIEW_NOTES_V137[7], "")
    // V162: a kept source file named by its file name ("보관 원자료
    // Germanwatch_CRI2026_full_report.pdf 판권면") - the report is named instead.
    .replace(KEPT_SOURCE_FILE_V162, "원문 보고서")
    // V162: a pointer to a row of the compiler's own file ("(본 파일 r5 Decree
    // 119/2025/ND-CP, r23 …)", ", 본 파일 r23"); the cited law stays elsewhere.
    .replace(OWN_FILE_ROW_POINTER_V162[0], "")
    .replace(OWN_FILE_ROW_POINTER_V162[1], "")
    // "[M01·원자료 결측]" - the code addresses the compiler, the phrase after it
    // is the reason a reader needs.
    .replace(/\[\s*M\d{2}\s*·\s*/gu, "[")
    .replace(/\bEDGAR_2025_GHG\b/gu, "EDGAR 온실가스 데이터베이스 2025판")
    .replace(/\bCCI_LC\b/gu, "CCI-LC")
    .replace(/\blog\(USD_2017\s+PPP\)/giu, "2017년 구매력평가 기준 미국달러(로그)")
    .replace(/십억\s+USD_2017\/yr\b/giu, "2017년 구매력평가 기준 10억 미국달러/년")
    .replace(/\bUSD_2017\/인/giu, "2017년 구매력평가 기준 미국달러/인")
    .replace(/\bUSD_PPP\/ha\b/giu, "구매력평가 기준 미국달러/ha")
    .replace(/\bUSD_2017\b/giu, "2017년 기준 미국달러")
    .replace(/\bUSD_PPP\b/giu, "구매력평가 기준 미국달러")
    // "레코드" is how the store names one of its rows, and the same decision
    // publicNoticeWordingV136_1 already made for the map notices applies to
    // every public string: the licence memos on E-001 and E-004 ("자료는
    // 기관명·소재지·연락처 ... 사실 정보로 구성되며"), C-012's "원본 자료 수",
    // and the record-type dimension all reach a reader.
    .replace(/레코드/gu, "자료")
    .replace(/\bIP\s+not\s+published\b/giu, "세부 이행정보 미공개")
    .replace(/\bGOLD_STANDARD_CERTIFIED_DESIGN\b/gu, "Gold Standard 설계 인증")
    .replace(/\bGOLD_STANDARD_CERTIFIED_PROJECT\b/gu, "Gold Standard 사업 인증")
    .replace(/\bUnits Transferred from Approved GHG Program\b/giu, "승인된 온실가스 프로그램에서 이전")
    .replace(/\bVerification approval requested\b/giu, "검증 승인 요청")
    .replace(/\bRegistration requested\b/giu, "등록 요청")
    .replace(/\bUnder development\b/giu, "개발 중")
    .replace(/\bUnder validation\b/giu, "타당성 검토 중")
    .replace(/\bLate to verify\b/giu, "검증 지연")
    .replace(/\bLISTED\b/gu, "목록 등재")
    .replace(/\bRegistered\b/gu, "등록")
    .replace(/\bWithdrawn\b/gu, "철회")
    .replace(/\bCTIS-\d{2}\b/gi, "")
    .replace(/(?:\s*[,·|]\s*){2,}/gu, " · ")
    .replace(/\s+/g, " ")
    // Trim dangling separators left behind by the substitutions above - but not
    // a minus sign. The ASCII hyphen is in that character class, so "-822,213"
    // came out as "822,213" and every negative number this text passes through
    // lost its sign: a province that is a net carbon sink read as an equally
    // large source, and the popup and the panel disagreed about the same value.
    .replace(/^\s*(?![-−]\s*[\d.])[·|—–-]+\s*/u, "")
    .replace(/\s*[·|—–-]+\s*$/u, "")
    .trim();
  // V164-3: the delivery's working memos (구서식 이관, raw 대조, 확인 필요,
  // HTTP 403 …) are cut here, so every public text policy shares the cut.
  const normalized = publicWorkMemoV164(chained);
  if (!normalized) return null;
  if (
    PUBLIC_DOM_FORBIDDEN_VALUE_PATTERNS_V126.some((pattern) =>
      pattern.test(normalized)
    )
  ) {
    return null;
  }
  return normalized;
}

export function publicTextV126(value: unknown): string | null {
  // V162: the supplier's process word reads as the block titles name it.
  const text = normalizeTextV126(value);
  return text === null ? null : publicProcessWordingV162(text);
}

/**
 * Compiler notes that travelled with a source organisation name.
 *
 * Several entity datasets cite a different organisation per row, and the
 * spreadsheet recorded that by appending a note to the organisation field -
 * "(레코드별 상이 - attr_19 참조)", "1.2_entity 시트 attr_14 열 참조". Those
 * notes address whoever maintains the sheet, not a reader picking a source
 * filter, and they surfaced verbatim on the finder, the download list and the
 * source panel. The organisation name in front of the note is real and stays.
 *
 * A second kind of note is the project team's own working text (2026-09-29):
 * a status placeholder ("확인필요", "…(발주처 협의 예정)"), the contractor that
 * compiled a list ("…(용역사 취합)", the contractor's name STADT), a field
 * survey working file ("현지 컨설턴트 현지조사(Field Survey Items_…_v2.0)"),
 * a working-file name or version, or a placeholder for a missing source
 * ("원천 미기재"). There is no real name inside such a part to keep, so the part
 * goes as a whole - a source line is judged part by part (" / " and " | "
 * separate the parts), and only the parts that name a real source remain.
 */
// V163-BTN: the same note after the public wording turned 레코드 into 자료
// ("(자료별 상이 — 1.2_entity 참조)" reached the BGD source filter).
const SOURCE_NOTE_MARKER_V136_1 = /레코드별|자료별\s*상이|attr_|시트|열\s*참조/u;
// V162: the 2026-09-30 attribution lines add the compiler's correction and
// review memos - "[원천 정정] 종전 source_series_id …", "[DoD S-07 잠정] …
// 재판정", "(근거: source_url …)" - written with the sheet's column names.
const SOURCE_WORKING_NOTE_V161 =
  /\[원천\s*정정\]|\[DoD\b|\b(?:source|license)_[a-z_]+\b|확인필요|제공기관\s*확인|출처\s*기관\s*미확인|해당\s*없음|공개\s*원천\s*부재|(?:생성|기재)\s*예정|발주처|용역사|STADT|현지조사|현지\s*컨설턴트|원천\s*미기재|Items_|_v\d+(?:\.\d+)*\b|\.(?:xlsx?|csv|docx?|hwpx?|pptx?)\b/iu;
/** Parts of one source line: "A / B", "공개 원천: A | 현지조사: B". */
const SOURCE_PART_SEPARATOR_V161 = /(\s+[|/]\s+)/u;
/** The compiler's label in front of a part ("공개 원천: CTCN"). */
const SOURCE_PART_LABEL_V161 = /^공개\s*원천\s*:\s*/u;

const SOURCE_NOTE_PATTERNS_V136_1: readonly RegExp[] = [
  // a bracketed aside about the sheet: "(레코드별 상이 - attr_19 참조)"
  /\s*[([][^()[\]]*(?:레코드별|자료별\s*상이|attr_|시트|열\s*참조)[^()[\]]*[)\]]/gu,
  // everything from a dash or arrow onwards, once the tail turns into a note
  /\s*[-—–→]\s*[^-—–→]*(?:레코드별|자료별\s*상이|attr_|시트|열\s*참조)[\s\S]*$/u,
  // V163-BTN: the compiler's own check after a cited document ("… 원문 자체 검산")
  /\s*원문\s*자체\s*검산\s*$/u,
  // the file the provider shipped it in: "(projectsLocationAll.xml)"
  /\s*[([][^()[\]]*\.(?:xml|csv|json|xlsx?|geojson|zip|pdf)\s*[)\]]/giu,
];

/**
 * Store words that reached generated notices.
 *
 * The map's accuracy notices are compiled with the data and describe rows as
 * "레코드". On the screen the same sentence is about the reader's data, so it
 * says 자료. The meaning is unchanged; only the word the reader sees is.
 */
const PUBLIC_NOTICE_WORDING_V136_1: ReadonlyArray<readonly [RegExp, string]> = [
  [/레코드/gu, "자료"],
];

/** A generated notice, worded for a reader rather than for the store. */
export function publicNoticeWordingV136_1(value: unknown): string | null {
  const normalized = normalizeTextV126(value);
  if (normalized === null) return null;
  let text = normalized;
  for (const [pattern, replacement] of PUBLIC_NOTICE_WORDING_V136_1) {
    text = text.replace(pattern, replacement);
  }
  return text === "" ? null : text;
}

/** A sentence boundary inside a licence or attribution line. */
const SOURCE_SENTENCE_BOUNDARY_V161 = /(?<=[.。])\s+/u;

/** One part of a source line, or null when the part is a note. */
const SOURCE_FILE_NAME_BRACKET_V162 = /\s*\((?:[^()]*\s)?[\w.-]+\.(?:pdf|xlsx?|csv|docx?|hwpx?|pptx?|zip|json|txt)\)/giu;

function publicSourcePartV161(part: string): string | null {
  // A licence line can carry a working note as one of its sentences ("…출처표시
  // 조건. 다운로드 제공 대상은 … 용역사가 재편집한 표준서식 자료임."): only that
  // sentence goes, the terms stay.
  const sentences = part.split(SOURCE_SENTENCE_BOUNDARY_V161);
  if (sentences.length > 1 && sentences.some((sentence) => SOURCE_WORKING_NOTE_V161.test(sentence))) {
    const kept = sentences.filter((sentence) => !SOURCE_WORKING_NOTE_V161.test(sentence));
    return kept.length === 0 ? null : publicSourcePartV161(kept.join(" "));
  }
  // V162: a file name in brackets after the cited source ("U.S. EIA
  // International Energy Statistics (Bulk File INTL.txt)") is the file the
  // team downloaded, not the source - the source stays, the file goes.
  let text = part.replace(SOURCE_FILE_NAME_BRACKET_V162, "");
  for (const pattern of SOURCE_NOTE_PATTERNS_V136_1) {
    text = text.replace(pattern, "");
  }
  text = text.replace(/\s*[-—–,·]\s*$/u, "").replace(SOURCE_PART_LABEL_V161, "").trim();
  // A part that is a note through and through names no source at all.
  if (text === "" || SOURCE_NOTE_MARKER_V136_1.test(text) || SOURCE_WORKING_NOTE_V161.test(text)) return null;
  return text;
}

/**
 * The public form of a source organisation or attribution line: the cited
 * names, with the sheet-keeping notes and the project's working notes removed
 * part by part. Returns null when nothing but notes was there, so a caller can
 * fall back to the spec's source name or hide the line.
 *
 * Every public source display - finder and home cards, the detail's source
 * lines and source panel, the download page, the map legend and popups - reads
 * its source text through this one function (V161).
 */
export function publicSourceOrganizationV136_1(value: unknown): string | null {
  const normalized = normalizeTextV126(value);
  if (normalized === null) return null;
  // split() with a capture group interleaves parts (even) and separators (odd).
  const pieces = normalized.split(SOURCE_PART_SEPARATOR_V161);
  let text = "";
  for (let index = 0; index < pieces.length; index += 2) {
    const part = publicSourcePartV161(pieces[index]);
    if (part === null) continue;
    // A kept part after the first keeps the separator written before it.
    text += text === "" ? part : `${pieces[index - 1]}${part}`;
  }
  return text === "" ? null : text;
}

/**
 * V164: a licence line as a reader reads it. The delivery wrote its own licence
 * review after each licence name - "[사실/표현 분리] 자료는 … 판단(출처표시 조건부
 * 표출).", "[라이선스 X] 원천이 … 표출 '불가'로 판정한다." - and the checking it
 * did ("(사이트맵·푸터 전수 확인)"). The licence names stay; each review runs to
 * the next licence (" · ") and goes, and so does the checking aside. A quoted
 * original ("[GDL 이용조건 원문] \"…\"") keeps the quote under a plain label.
 */
const LICENCE_REVIEW_V164 =
  /\s*\[(?:사실\s*\/\s*표현\s*분리|라이선스\s*[XO×○]|라이선스\s*(?:근거|판정|확인)[^\]]*|처리규칙[^\]]*)\][^]*?(?=\s·\s|$)/gu;
const LICENCE_CHECK_ASIDE_V164 = /\s*\([^()]*(?:전수\s*확인|확인\s*결과)[^()]*\)/gu;
// The KOGL attribution template copied with its blanks unfilled
// ("본 저작물은 한국국제협력단에서 OOOO년 작성하여 공공누리 제O유형으로 …").
const KOGL_TEMPLATE_V164 = /본\s*저작물은\s*(\S+?)에서\s*O{2,4}년\s*작성하여\s*공공누리\s*제O유형으로\s*개방한\s*저작물명\s*\(\s*작성자\s*:\s*O+\s*\)을\s*이용하였으며,\s*해당\s*저작물은\s*\S+\s*홈페이지에서\s*무료로\s*다운받을\s*수\s*있습니다\.?/gu;
const LICENCE_VERDICT_V164 = /\s*출처표시\s*외\s*추가\s*제약이\s*없어\s*표출\s*·\s*다운로드\s*모두\s*(?:허용|가능)\s*\.?/gu;
const LICENCE_QUOTE_LABEL_V164 = /\[[^\[\]]{1,20}이용조건\s*원문\]\s*/gu;

export function publicLicenseTextV164(value: unknown): string | null {
  const text = publicSourceOrganizationV136_1(value);
  if (text === null) return null;
  const cleaned = text
    .replace(LICENCE_REVIEW_V164, "")
    .replace(LICENCE_CHECK_ASIDE_V164, "")
    .replace(LICENCE_VERDICT_V164, "")
    .replace(KOGL_TEMPLATE_V164, "출처: $1(공공누리 개방 저작물)")
    .replace(LICENCE_QUOTE_LABEL_V164, "이용조건 원문: ")
    .replace(/(?:\s·\s){2,}/gu, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/gu, "")
    .replace(/\s{2,}/gu, " ")
    .trim();
  return cleaned === "" ? null : cleaned;
}

/** A source citation inside a record note: "출처: …". */
const RECORD_NOTE_SOURCE_V161 = /^\s*출처\s*:\s*/u;
/**
 * The compiler's pointer to the delivered file a note was written from
 * ("raw: C-006_…_2026-08-19.csv"), up to the file's extension, and a part that
 * is only such a file name (a second file after " · ").
 */
const RECORD_NOTE_FILE_POINTER_V158 = /\s*\braw\s*:\s*.+?\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|pptx?|zip)\b/giu;
const RECORD_NOTE_FILE_NAME_V158 = /^[A-E]-\d{3}_.+\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|pptx?|zip)$/iu;
/**
 * A sentence explaining why the compiler gave the record no climate-technology
 * code ("해당 없음 — 본 레코드에는 38대 기후기술을 지목할 근거가 없어 코드를
 * 부여하지 않음(억지 매핑 금지 원칙).") - a note on the coding, not on the record.
 */
const RECORD_NOTE_CODING_MEMO_V158 = /억지\s*매핑|코드를\s*부여하지\s*않|tech_ids?\b/u;
/**
 * V162: memo sentences the 2026-09-30 delivery added to record notes - a
 * sentence that cites a delivered working file (`C-013_…_2026-07-28.csv`의 …
 * 행 기준) or a correction of the field survey's own sheet (현지조사 원본 …
 * 반영 / … 오기). The note's other sentences stay.
 */
const RECORD_NOTE_MEMO_SENTENCE_V162 =
  /`[^`]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)`|(?:^|[\s(])[A-E]-\d{3}_[^\s]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)\b|현지조사\s*원본/iu;
/** A field-survey citation written inside a sentence: "출처: 현지조사(Field Survey Items_…, 현지 컨설턴트)". */
const RECORD_NOTE_SURVEY_CITATION_V162 = /\s*출처\s*:\s*현지조사\s*\([^)]*(?:Items_|컨설턴트|_v\d)[^)]*\)/gu;
/** "(현지조사 결과)" appended to a statement: the supplier's attribution tag. */
const RECORD_NOTE_SURVEY_TAG_V162 = /\s*\(현지조사\s*결과\)/gu;
const RECORD_NOTE_SENTENCE_V158 = /(?<=[.。])\s+/u;

/**
 * A record's note as a reader sees it (V161). A note can cite the record's
 * source ("출처: 현지조사(Field Survey Items_…, 현지 컨설턴트)"); that citation is
 * judged like any other source line, and dropped when nothing but a working
 * note is left. The rest of a note is the record's own content and stays.
 */
/**
 * V162: the 2026-09-30 delivery's own migration log, written into the record
 * note when rows moved to the wide template: "[구분자 통일] 구서식 구분자
 * 「C-002_report_submission」 [열→행 전개] 구서식 열 「[재원] …」 (레코드ID
 * VNM-C002-BTR1)", "· 구서식 「[기후] 관측·전망 기간」 1958-2018" and "…은
 * C-002_inventory_timeseries 행에 수록." It records how the sheet was rebuilt,
 * not what the data says; the note's own sentences stay.
 */
const RECORD_NOTE_MIGRATION_LOG_V162: readonly RegExp[] = [
  // the tag and what follows it, a quoted 「…」 (which may hold brackets) included
  /\s*\[\s*(?:구분자\s*통일|열\s*→\s*행\s*전개)\s*\][^[「]*(?:「[^」]*」[^[「]*)*/gu,
  /\s*\(\s*(?:레코드|자료)\s*ID\s+[^)]*\)/gu,
  /\s*·?\s*구서식\s*「[^」]*」[^·.[]*/gu,
  /[^.。]*\b[A-E]-\d{3}_[a-z0-9_]+\s*행에\s*수록\.?/gu,
];
/** A file name outside a URL ("보관 원자료 Germanwatch_CRI2026_full_report.pdf"). */
const RECORD_NOTE_BARE_FILE_V162 = /(^|[\s(（])(?!https?:)[^\s()（）]+\.(?:pdf|md|xlsx?|csv|docx?|hwpx?)\b/giu;

/** V163-T3: NDC document types a record note writes as source codes (A-013 "문서유형: first_ndc"). */
const NDC_DOCUMENT_TYPES_V163: Readonly<Record<string, string>> = {
  revised_first_ndc: "1차 NDC(개정)",
  first_ndc: "1차 NDC",
  second_ndc: "2차 NDC",
  updated_ndc: "갱신 NDC",
  indc: "INDC",
};

export function publicRecordNoteV161(value: unknown): string | null {
  const normalizedRaw = normalizeTextV126(value);
  if (normalizedRaw === null) return null;
  const normalized = normalizedRaw.replace(
    /\b(revised_first_ndc|first_ndc|second_ndc|updated_ndc|indc)\b/gu,
    (code) => NDC_DOCUMENT_TYPES_V163[code] || code
  );
  const withoutLog = RECORD_NOTE_MIGRATION_LOG_V162.reduce((text, pattern) => text.replace(pattern, ""), normalized)
    .replace(/\s{2,}/gu, " ")
    .trim();
  const withoutPointer = withoutLog
    .replace(RECORD_NOTE_FILE_POINTER_V158, "")
    .replace(RECORD_NOTE_SURVEY_CITATION_V162, "")
    .replace(RECORD_NOTE_SURVEY_TAG_V162, "")
    // A removed citation can leave its " · " separator at either end.
    .replace(/^\s*·\s*|\s*·\s*$/gu, "");
  // A note without a coding memo keeps its own spacing.
  const isMemo = (sentence: string) => RECORD_NOTE_CODING_MEMO_V158.test(sentence) || RECORD_NOTE_MEMO_SENTENCE_V162.test(sentence);
  const withoutMemo = isMemo(withoutPointer)
    ? withoutPointer
        .split(RECORD_NOTE_SENTENCE_V158)
        .filter((sentence) => !isMemo(sentence))
        .join(" ")
        .trim()
    : withoutPointer;
  const parts = withoutMemo.split(/\s+·\s+/u).flatMap((part) => {
    if (RECORD_NOTE_FILE_NAME_V158.test(part.trim())) return [];
    if (!RECORD_NOTE_SOURCE_V161.test(part)) return [part];
    const source = publicSourceOrganizationV136_1(part.replace(RECORD_NOTE_SOURCE_V161, ""));
    return source ? [`출처: ${source}`] : [];
  });
  // A file name the rules above did not already take out with its sentence.
  const text = parts
    .join(" · ")
    .replace(RECORD_NOTE_BARE_FILE_V162, "$1")
    .replace(/\(\s*\)/gu, "")
    .replace(/\s{2,}/gu, " ")
    .trim();
  return text === "" ? null : publicProcessWordingV162(text);
}

/**
 * A data value the source left empty is written "원천 미기재" in the delivery -
 * the compiler's phrasing for "the source does not state it". On the screen it
 * reads 미기재 (V161); the delivered value and the download keep the original.
 */
const SOURCE_UNSTATED_WORDING_V161 = /원천\s*미기재/gu;
export function publicUnstatedWordingV161(value: string): string {
  return value.replace(SOURCE_UNSTATED_WORDING_V161, "미기재");
}

export function publicSourceUrlV126(value: unknown): string | null {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    Array.from(url.searchParams.keys()).forEach((key) => {
      if (
        /^(?:indicator|comp_breakdown|ref_area|api_params?)$/i.test(key)
      ) {
        url.searchParams.delete(key);
      }
    });
    url.hash = "";
    const normalized = url.toString();
    return normalizeTextV126(normalized);
  } catch (_reason) {
    return null;
  }
}

function safeAttributeValueV126(
  value: unknown
): PublicAttributeValueV126 | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return normalizeTextV126(value) || undefined;
  if (Array.isArray(value)) {
    const values = value
      .map((item) => safeAttributeValueV126(item))
      .filter(
        (item): item is PublicPrimitiveV126 =>
          item === null ||
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      );
    return values.length > 0 ? values : undefined;
  }
  return undefined;
}

function safeObservationValueV126(
  value: VietnamObservationV124["value"]
): VietnamObservationV124["value"] {
  if (typeof value === "string") return normalizeTextV126(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return value;
}

export function toPublicSourceViewV126(
  row: VietnamObservationV124 | VietnamEntityV124,
  meta: VietnamIndicatorMetaV124 | undefined,
  element: CountryCatalogItemV122
): PublicSourceViewV126 {
  const entityAttributes =
    "normalizedAttributes" in row ? row.normalizedAttributes : {};
  return {
    organization:
      normalizeTextV126(row.provenance.sourceOrg) ||
      normalizeTextV126(meta?.sourceOrg),
    datasetTitle: element.publicTitle,
    url:
      publicSourceUrlV126(row.provenance.sourceUrl) ||
      publicSourceUrlV126(entityAttributes.sourceUrl) ||
      publicSourceUrlV126(entityAttributes.recordSourceUrl) ||
      publicSourceUrlV126(entityAttributes.websiteUrl) ||
      publicSourceUrlV126(entityAttributes.website) ||
      publicSourceUrlV126(meta?.sourceUrl),
    referenceYear:
      normalizeTextV126(row.provenance.referenceYear) ||
      normalizeTextV126(meta?.referenceYear),
    license:
      publicLicenseTextV164(row.provenance.licenseCode) ||
      publicLicenseTextV164(meta?.licenseCode),
    // V163-DL: the download carries the source text the screens show - the
    // delivery team's working notes (client review, raw folder, old sheet)
    // are not part of it (publicDownloadNoteV163).
    attribution: publicSourceOrganizationV136_1(meta?.attributionText),
    caveat:
      normalizeTextV126(publicDownloadTextV163(meta?.caveat, element.countryIso3)) ||
      normalizeTextV126(publicDownloadTextV163(meta?.missingNote, element.countryIso3)),
    citation:
      normalizeTextV126(publicDownloadTextV163(row.provenance.citationLocator, element.countryIso3)) ||
      normalizeTextV126(publicDownloadTextV163(meta?.citationLocator, element.countryIso3)),
  };
}

export function publicMissingReasonLabelV126(
  codeValue: string | null | undefined,
  noteValue: string | null | undefined
): string | null {
  const codes = (codeValue || "")
    .split(";")
    .map((code) => code.trim())
    .filter(Boolean);
  const labels = codes
    .map((code) => MISSING_REASON_LABELS_V126[code])
    .filter((label): label is string => Boolean(label));
  if (labels.length > 0) return Array.from(new Set(labels)).join(" · ");
  if (codes.length > 0) return "값이 제공되지 않음";
  if (noteValue && /결측|미제공|미수집|공란|확인\s*중/.test(noteValue)) {
    return "값이 제공되지 않음";
  }
  return null;
}

function entityYearV126(row: VietnamEntityV124): number | null {
  for (const key of [
    "referenceYear",
    "eventYear",
    "year",
    "approvalYear",
    "commissioningYear",
  ]) {
    const value = Number(row.normalizedAttributes?.[key]);
    if (Number.isInteger(value)) return value;
  }
  for (const key of ["approvalDate", "publicationDate", "signedDate"]) {
    const value = String(row.normalizedAttributes?.[key] || "");
    const match = value.match(/\b(19|20)\d{2}\b/);
    if (match) return Number(match[0]);
  }
  return null;
}

function semanticMapsV126(input: PublicProjectionInputV126): {
  indicator: Map<string, IndicatorSemanticV125>;
  record: Map<string, RecordSemanticV125>;
} {
  return {
    indicator: new Map(
      (input.indicatorSemantics || []).map((semantic) => [
        semantic.indicatorId,
        semantic,
      ])
    ),
    record: new Map(
      (input.recordSemantics || []).map((semantic) => [
        semantic.recordId,
        semantic,
      ])
    ),
  };
}

function semanticDimensionsV126(
  indicatorSemantic: IndicatorSemanticV125 | undefined,
  recordSemantic: RecordSemanticV125 | undefined
): Record<string, string> {
  return {
    ...(indicatorSemantic?.dimensionLabels || {}),
    ...(recordSemantic?.dimensionLabels || {}),
  };
}

function dimensionValueV126(
  dimensions: Record<string, string>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const candidate = Object.entries(dimensions).find(
      ([dimensionKey]) => normalizeKeyV126(dimensionKey) === normalizeKeyV126(key)
    );
    const value = normalizeTextV126(candidate?.[1]);
    if (value) return value;
  }
  return null;
}

function categoryValueV126(dimensions: Record<string, string>): string | null {
  const values = Object.entries(dimensions)
    .filter(
      ([key]) => !RESERVED_DIMENSION_KEYS_V126.has(normalizeKeyV126(key))
    )
    .map(([, value]) => normalizeTextV126(value))
    .filter((value): value is string => Boolean(value));
  return values.length > 0 ? Array.from(new Set(values)).join(" · ") : null;
}

function sourceFieldsV126(source: PublicSourceViewV126) {
  return {
    source_organization: source.organization,
    source_title: source.datasetTitle,
    source_url: source.url,
    license: source.license,
    attribution: source.attribution,
    official_citation: source.citation,
  };
}

export function approvedEntityAttributesV126(
  row: VietnamEntityV124,
  template: string
): Record<string, PublicAttributeValueV126> {
  const templateKeys =
    PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_TEMPLATE_V126[template] ||
    PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_TEMPLATE_V126.entity;
  const elementKeys =
    PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_ELEMENT_V126[row.elementId] || [];
  const keys = [...templateKeys, ...elementKeys];
  const attributes: Record<string, PublicAttributeValueV126> = {};
  keys.forEach((key) => {
    if (TECHNICAL_FIELD_KEYS_NORMALIZED_V126.has(normalizeKeyV126(key))) return;
    const value = safeAttributeValueV126(row.normalizedAttributes?.[key]);
    const outputKey = PUBLIC_ENTITY_ATTRIBUTE_OUTPUT_KEYS_V126[key] || key;
    if (value !== undefined) attributes[outputKey] = value;
  });
  return attributes;
}

export function publicEntityAttributeLabelV126(key: string): string {
  return PUBLIC_ENTITY_ATTRIBUTE_LABELS_V126[key] || key;
}

export function publicEntityAttributeKeysV126(
  rows: VietnamEntityV124[],
  template: string
): string[] {
  const allowed = Array.from(
    new Set(
      rows.flatMap((row) => [
        ...(PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_TEMPLATE_V126[template] ||
          PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_TEMPLATE_V126.entity),
        ...(PUBLIC_ENTITY_ATTRIBUTE_KEYS_BY_ELEMENT_V126[row.elementId] || []),
      ])
    )
  ).map((key) => PUBLIC_ENTITY_ATTRIBUTE_OUTPUT_KEYS_V126[key] || key);
  return allowed.filter((key) =>
    rows.some((row) => approvedEntityAttributesV126(row, template)[key] !== undefined)
  );
}

// V163-DL: a download repeats one note on many rows (B-004 has 100k+), so a
// distinct note is projected once - same rules as the screens' record notes.
const DOWNLOAD_NOTE_CACHE_V163 = new Map<string, string | null>();
function downloadRecordNoteV163(note: unknown, countryIso3: string | null | undefined): string | null {
  if (note === null || note === undefined || note === "") return null;
  const key = `${countryIso3 || ""}|${String(note)}`;
  const cached = DOWNLOAD_NOTE_CACHE_V163.get(key);
  if (cached !== undefined) return cached;
  const result = normalizeTextV126(publicDownloadTextV163(publicRecordNoteV161(note), countryIso3));
  if (DOWNLOAD_NOTE_CACHE_V163.size >= 20000) DOWNLOAD_NOTE_CACHE_V163.clear();
  DOWNLOAD_NOTE_CACHE_V163.set(key, result);
  return result;
}

export function toPublicObservationRowsV126(
  input: PublicObservationProjectionInputV126
): PublicDownloadRowV126[] {
  const semantics = semanticMapsV126(input);
  return input.observations.map((row) => {
    const meta = input.metadataById.get(row.indicatorId);
    const indicatorSemantic = semantics.indicator.get(row.indicatorId);
    const recordSemantic = semantics.record.get(row.recordId);
    const dimensions = semanticDimensionsV126(
      indicatorSemantic,
      recordSemantic
    );
    const source = toPublicSourceViewV126(row, meta, input.element);
    return {
      country: row.countryIso3 || input.element.countryIso3,
      element: input.element.publicTitle,
      record_type: "observation",
      measure:
        normalizeTextV126(indicatorSemantic?.measure.labelKo) ||
        normalizeTextV126(meta?.labelKo) ||
        input.element.publicTitle,
      category: categoryValueV126(dimensions),
      region: dimensionValueV126(dimensions, DIMENSION_KEY_GROUPS_V126.region),
      sex: dimensionValueV126(dimensions, DIMENSION_KEY_GROUPS_V126.sex),
      technology: dimensionValueV126(
        dimensions,
        DIMENSION_KEY_GROUPS_V126.technology
      ),
      scenario: dimensionValueV126(
        dimensions,
        DIMENSION_KEY_GROUPS_V126.scenario
      ),
      value: safeObservationValueV126(row.value),
      unit:
        normalizeTextV126(row.unit) ||
        normalizeTextV126(indicatorSemantic?.measure.unit) ||
        normalizeTextV126(meta?.unit),
      year: Number.isInteger(row.year) ? (row.year as number) : null,
      period: normalizeTextV126(row.period),
      entity_name: null,
      entity_type: null,
      ...sourceFieldsV126(source),
      missing_reason: publicMissingReasonLabelV126(
        row.missingReasonCode,
        row.note
      ),
      public_note: downloadRecordNoteV163(row.note, row.countryIso3 || input.element.countryIso3) || source.caveat,
      entityAttributes: {},
    };
  });
}

export function toPublicEntityRowsV126(
  input: PublicEntityProjectionInputV126
): PublicDownloadRowV126[] {
  const semantics = semanticMapsV126(input);
  return input.entities.map((row) => {
    const meta = row.indicatorId
      ? input.metadataById.get(row.indicatorId)
      : undefined;
    const indicatorSemantic = row.indicatorId
      ? semantics.indicator.get(row.indicatorId)
      : undefined;
    const recordSemantic = semantics.record.get(row.recordId);
    const dimensions = semanticDimensionsV126(
      indicatorSemantic,
      recordSemantic
    );
    const source = toPublicSourceViewV126(row, meta, input.element);
    // V163-DL: an attribute holding a working note (where the delivery's
    // geocoding ledger sits, a client review) loses that sentence in the file.
    const attributes = Object.fromEntries(
      Object.entries(approvedEntityAttributesV126(row, input.element.raw.detailTemplate)).flatMap(
        ([key, value]): Array<[string, PublicAttributeValueV126]> => {
          if (typeof value !== "string") return [[key, value]];
          const cleaned = normalizeTextV126(publicDownloadTextV163(value, row.countryIso3 || input.element.countryIso3));
          return cleaned === null ? [] : [[key, cleaned as PublicAttributeValueV126]];
        }
      )
    ) as Record<string, PublicAttributeValueV126>;
    const attributeCategory = Object.entries(attributes)
      .filter(
        ([key]) =>
          ![
            "name",
            "title",
            "projectName",
            "plantName",
            "mineName",
            "organizationName",
            "orgName",
            "companyName",
          ].includes(key)
      )
      .slice(0, 4)
      .map(([key, value]) => {
        const formatted = Array.isArray(value) ? value.join(" · ") : String(value);
        return `${publicEntityAttributeLabelV126(key)}: ${formatted}`;
      })
      .join(" · ");
    return {
      country: row.countryIso3 || input.element.countryIso3,
      element: input.element.publicTitle,
      record_type: "entity",
      measure:
        normalizeTextV126(indicatorSemantic?.measure.labelKo) ||
        normalizeTextV126(meta?.labelKo) ||
        input.element.publicTitle,
      category:
        categoryValueV126(dimensions) ||
        normalizeTextV126(attributeCategory),
      region:
        dimensionValueV126(dimensions, DIMENSION_KEY_GROUPS_V126.region) ||
        normalizeTextV126(attributes.regionName) ||
        normalizeTextV126(attributes.city),
      sex: dimensionValueV126(dimensions, DIMENSION_KEY_GROUPS_V126.sex),
      technology:
        dimensionValueV126(
          dimensions,
          DIMENSION_KEY_GROUPS_V126.technology
        ) || normalizeTextV126(attributes.technologyField),
      scenario: dimensionValueV126(
        dimensions,
        DIMENSION_KEY_GROUPS_V126.scenario
      ),
      value: null,
      unit:
        normalizeTextV126(indicatorSemantic?.measure.unit) ||
        normalizeTextV126(meta?.unit),
      year: entityYearV126(row),
      period:
        normalizeTextV126(attributes.projectPeriod) ||
        normalizeTextV126(attributes.applicationPeriod),
      entity_name: publicEntityTitleV131(row, {
        template: input.element.raw.detailTemplate,
        elementTitle: input.element.publicTitle,
      }),
      entity_type: normalizeTextV126(row.entityType),
      ...sourceFieldsV126(source),
      missing_reason: publicMissingReasonLabelV126(
        row.missingReasonCode,
        row.note
      ),
      public_note: downloadRecordNoteV163(row.note, row.countryIso3 || input.element.countryIso3) || source.caveat,
      entityAttributes: attributes,
    };
  });
}

function snakeCaseV126(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function csvEscapeV126(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(" | ") : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function publicRowsToCsvV126(rows: PublicDownloadRowV126[]): string {
  const entityKeys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row.entityAttributes)))
  ).sort();
  const attributeHeaders = entityKeys.map(
    (key) => `entity_${snakeCaseV126(key)}`
  );
  const headers = [...PUBLIC_DOWNLOAD_HEADERS_V126, ...attributeHeaders];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const core = PUBLIC_DOWNLOAD_HEADERS_V126.map((header) => row[header]);
    const attributes = entityKeys.map((key) => row.entityAttributes[key]);
    lines.push([...core, ...attributes].map(csvEscapeV126).join(","));
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

export function publicRowsToJsonV126(rows: PublicDownloadRowV126[]): string {
  const records = rows.map((row) => {
    const publicRecord: Record<string, unknown> = {};
    PUBLIC_DOWNLOAD_HEADERS_V126.forEach((header) => {
      publicRecord[header] = row[header];
    });
    if (Object.keys(row.entityAttributes).length > 0) {
      publicRecord.entity_attributes = row.entityAttributes;
    }
    return publicRecord;
  });
  return JSON.stringify({ records }, null, 2);
}

export function publicDownloadRowCountV126(
  rows: PublicDownloadRowV126[]
): number {
  return rows.length;
}

export function publicDownloadRowsHaveTechnicalFieldsV126(
  rows: PublicDownloadRowV126[]
): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (typeof value === "string") {
      return PUBLIC_DOM_FORBIDDEN_VALUE_PATTERNS_V126.some((pattern) =>
        pattern.test(value)
      );
    }
    if (!value || typeof value !== "object") return false;
    return Object.entries(value as Record<string, unknown>).some(
      ([key, nestedValue]) =>
        TECHNICAL_FIELD_KEYS_NORMALIZED_V126.has(normalizeKeyV126(key)) ||
        visit(nestedValue)
    );
  };
  return rows.some(visit);
}

/** Legacy static exports retain internal lineage and are never public defaults. */
export function isDefaultPublicDownloadAssetV126(_url: string): boolean {
  return false;
}
