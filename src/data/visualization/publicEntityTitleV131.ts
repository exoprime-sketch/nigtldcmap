import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { publicCategoryLabelV136_2 } from "./publicCategoryLabelV136_2";
import {
  publicProjectNumberV136_3,
  publicProjectTitleEntryV136_3,
} from "./publicProjectTitleRegistryV136_3";

export type PublicEntityTitleStrategyV131 =
  | "element-title-field"
  | "template-title-field"
  | "source-name"
  | "source-identifier"
  | "factual-composite"
  | "record-type";

export type PublicEntityNameAvailabilityV131 =
  | "available"
  | "identifier-only"
  | "not-provided";

export interface PublicEntityTitleOptionsV131 {
  template?: string | null;
  elementTitle?: string | null;
}

/** A detail row that identifies the record without naming it. */
export interface PublicEntityIdentifierFactV131 {
  label: string;
  value: string;
}

export interface PublicEntityTitleResolutionV131 {
  title: string;
  strategy: PublicEntityTitleStrategyV131;
  nameAvailability: PublicEntityNameAvailabilityV131;
  secondaryNote: string | null;
  /** Numbers and official names, shown with the card's other detail rows. */
  identifierFacts: PublicEntityIdentifierFactV131[];
}

type EntityTitleFieldSourceV131 = "normalized" | "raw";

interface EntityTitleFieldV131 {
  key: string;
  source?: EntityTitleFieldSourceV131;
}

const UNAVAILABLE_ENTITY_TITLE_V131 = /^(?:\(?\s*(?:명칭|이름)?\s*(?:미기재|미표기|미공개|미확인|미상)\s*\)?|\(?\s*원천\s*(?:미기재|미표기|미공개|미확인|미제공|미게재)(?:\s*\([^)]*\))?\s*\)?|해당\s*없음|미상|unknown|unnamed|not\s+(?:available|provided)|n\/?a|none|null|undefined|[-—–])$/iu;

const TECHNICAL_PUBLIC_TITLE_V131 = [
  /\.xlsx\b/iu,
  /\bSDMX\s+flat\b/iu,
  /\b(?:INDICATOR|COMP_BREAKDOWN|REF_AREA)\s*=/iu,
  /\bsource(?:File|Sheet|Row)\b/iu,
  /\b(?:recordId|indicatorId|apiParams|packUrl|shardId|sha256|publicationDecisionId)\b/iu,
  /\b(?:MultiLineString|geometry|MapLibre|renderer)\b/iu,
];

/**
 * Source columns that have been reviewed as the public entity title for a
 * specific element. Hashed normalized keys are never scanned generically.
 */
const ELEMENT_TITLE_FIELDS_V131: Record<string, EntityTitleFieldV131[]> = {
  "A-029": [{ key: "field_09972978" }],
  "E-008": [{ key: "field_98c97d76" }],
  "E-001": [{ key: "field_7b638c0f" }],
  "D-014": [{ key: "attr_1", source: "raw" }],
  "D-015": [{ key: "attr_1", source: "raw" }],
  "D-016": [{ key: "attr_1", source: "raw" }],
  "D-017": [{ key: "attr_1", source: "raw" }],
  "D-024": [{ key: "field_cb69d1ce" }],
  "E-020": [{ key: "field_01856451" }, { key: "attr_2", source: "raw" }],
};

const ELEMENT_RECORD_TYPE_V131: Record<string, string> = {
  "A-013": "NDC–SDG 연계 항목",
  "A-023": "발전시설",
  "A-024": "송전망 구간",
  "A-029": "무역협정",
  "C-008": "기후행동 참여 항목",
  "C-025": "탄소크레딧 사업",
  "D-012": "기업 진출 사례",
  "D-014": "EDCF 사업",
  "D-015": "ODA 사업",
  "D-016": "정부·지자체 사업",
  "D-017": "ODA 입찰",
  "D-019": "CTCN 기술지원",
  "D-022": "개발금융 투자사업",
  "D-024": "임팩트 투자",
  "E-020": "지원 프로그램",
};

const TEMPLATE_RECORD_TYPE_V131: Record<string, string> = {
  spatial: "공간 데이터 항목",
  project: "사업 항목",
  finance: "재원·투자 항목",
  partner: "기관·지원 항목",
  policy: "정책·제도 항목",
  entity: "데이터 항목",
  "technology-demand": "기술수요 항목",
  indicator: "지표 항목",
  composition: "구성 항목",
};

const TEMPLATE_TITLE_FIELDS_V131: Record<string, string[]> = {
  spatial: ["plantName", "mineName", "facilityName", "siteName", "name"],
  project: ["projectName", "programName", "initiativeName", "title", "name"],
  finance: ["projectName", "programName", "companyName", "title", "name"],
  partner: [
    "organizationName",
    "orgName",
    "companyName",
    "supportingOrganization",
    "institutionName",
    "title",
    "name",
  ],
  policy: ["policyName", "agreementName", "documentTitle", "title", "name"],
  entity: [
    "organizationName",
    "orgName",
    "companyName",
    "projectName",
    "programName",
    "title",
    "name",
  ],
  "technology-demand": ["technologyName", "requestTitle", "title", "name"],
  indicator: ["title", "name"],
  composition: ["title", "name"],
};

const GENERAL_TITLE_FIELDS_V131 = [
  "projectName",
  "programName",
  "plantName",
  "mineName",
  "facilityName",
  "organizationName",
  "orgName",
  "companyName",
  "supportingOrganization",
  "policyName",
  "agreementName",
  "documentTitle",
  "paperTitle",
  "technologyName",
  "title",
  "name",
];

function titleTextV131(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const title = String(value).normalize("NFC").replace(/\s+/gu, " ").trim();
  if (
    !title ||
    UNAVAILABLE_ENTITY_TITLE_V131.test(title) ||
    TECHNICAL_PUBLIC_TITLE_V131.some((pattern) => pattern.test(title))
  ) {
    return null;
  }
  return title;
}

function fieldValueV131(
  entity: VietnamEntityV124,
  field: EntityTitleFieldV131
): string | null {
  const attributes =
    field.source === "raw" ? entity.rawAttributes : entity.normalizedAttributes;
  return titleTextV131(attributes?.[field.key]);
}

function titleFromFieldsV131(
  entity: VietnamEntityV124,
  fields: EntityTitleFieldV131[]
): string | null {
  for (const field of fields) {
    const value = fieldValueV131(entity, field);
    if (value) return value;
  }
  return null;
}

/**
 * A GADM record key is an identifier, not a name.
 *
 * The province-year deliveries (CMIP6 climate, heat, flood, drought, forest,
 * resource potential) key each row as ``VNM.1_1_ssp370_2096``. That string was
 * reaching the screen as the card title, so nineteen detail screens listed
 * twelve of them as headings - the reader saw the internal key and learned
 * nothing. The delivery states the three things that key encodes in columns of
 * their own, so the card is titled with those instead.
 */
/** A column that holds a row key rather than a name. */
const IDENTIFIER_COLUMN_V137 = /레코드[_\s]*키|번호|코드|ID|_id/iu;

const NON_NAME_TITLE_V137 = /^(?:[\d]+(?:[.,]\d+)*|\d{4}-\d{2}-\d{2})$/u;

const RECORD_KEY_TITLE_V137 = /^[A-Z]{3}\.\d+_\d+(?:_[A-Za-z0-9]+)*$/u;

/**
 * A composed key rather than a name. B-017's rows are keyed
 * "<HydroBASINS>-<GADM GID_1>-<aquifer>", and where the source has no value
 * the key carries a literal "None": the screen listed twelve cards titled
 * "None-VNM.33_1-None".
 */
const COMPOSED_RECORD_KEY_V137 = /(?:^|[-_])[A-Z]{3}\.\d+_\d+(?:[-_]|$)/u;

const SCENARIO_LABELS_V137: Record<string, string> = {
  historical: "과거 관측",
  ssp119: "SSP1-1.9",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp370: "SSP3-7.0",
  ssp460: "SSP4-6.0",
  ssp585: "SSP5-8.5",
};

/** "지역으로" / "연도로" - the instrumental particle follows the final jamo. */
function koreanInstrumentalV137(text: string): string {
  const last = text.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return "로";
  const finalJamo = (code - 0xac00) % 28;
  // ㄹ takes the bare 로, like a syllable with no final consonant at all.
  return finalJamo === 0 || finalJamo === 8 ? "로" : "으로";
}

function regionYearCompositeV137(
  entity: VietnamEntityV124
): FactualTitleV131 | null {
  const attributes = entity.normalizedAttributes || {};
  const region =
    titleTextV131(attributes["지역명_로마자"]) ||
    titleTextV131(attributes["지역명_베트남어"]) ||
    titleTextV131(attributes["2025_개편_후_소속_34개_체계"]) ||
    // B-008's rows are tide-gauge stations, not provinces.
    titleTextV131(attributes["관측소명_PSMSL"]) ||
    titleTextV131(attributes["관측소명"]);
  // Several deliveries carry a national series alongside the province rows and
  // name what each row measures in its own column. Without it B-029 listed six
  // different forest and mangrove areas for 2001 as six cards reading
  // "Viet Nam · 2001년".
  const nationalMeasure = titleTextV131(attributes["전국_지표명"]);
  const rawScenario = titleTextV131(attributes["시나리오"]);
  const scenario = rawScenario
    ? SCENARIO_LABELS_V137[rawScenario.toLowerCase()] || rawScenario
    : null;
  const year = titleTextV131(attributes["연도"]) || titleTextV131(attributes["기준연도"]);
  const quantile = titleTextV131(attributes["분위수"]);
  const parts = factualPartsV131([
    nationalMeasure || region,
    nationalMeasure ? null : scenario,
    quantile ? `${quantile}분위` : null,
    year ? `${year}년` : null,
  ]);
  // The region alone is enough. B-017, B-026, B-030, B-031, B-032, B-041 and
  // B-042 deliver one row per province with no scenario and no year column, and
  // requiring a second part left every card titled "VNM.1_1".
  if (!region && !nationalMeasure) return null;
  // Names the dimensions, not this row's values, so the sentence is the same on
  // every card of the element and an element without a scenario column does not
  // claim one.
  const dimensions = [
    nationalMeasure ? "지표" : "지역",
    !nationalMeasure && scenario ? "시나리오" : null,
    quantile ? "분위수" : null,
    year ? "연도" : null,
  ].filter(Boolean);
  const dimensionText = dimensions.join("·");
  return {
    title: parts.join(" · "),
    nameAvailability: "not-provided",
    secondaryNote: `원천이 개별 명칭 대신 ${dimensionText}${koreanInstrumentalV137(
      dimensionText
    )} 행을 구분합니다.`,
  };
}

function publicSourceIdentifierV131(entity: VietnamEntityV124): string | null {
  const attributes = entity.normalizedAttributes || {};
  const projectId = titleTextV131(attributes.projectId);
  if (!projectId) return null;
  const standard = titleTextV131(attributes.standard);
  const displayId = projectId
    .replace(/^gs[_\s-]*/iu, "GS ")
    .replace(/^vcs[_\s-]*/iu, "VCS ")
    .replace(/_/gu, " ");
  return standard ? `${standard} 등록사업 · ${displayId}` : displayId;
}

interface FactualTitleV131 {
  title: string;
  nameAvailability: PublicEntityNameAvailabilityV131;
  secondaryNote: string;
  identifierFacts?: PublicEntityIdentifierFactV131[];
}

/** Keeps the identifier rows that actually carry a value. */
function factualIdentifierRowsV131(
  rows: Array<[string, string | null]>
): PublicEntityIdentifierFactV131[] {
  return rows.flatMap(([label, value]) => {
    const text = titleTextV131(value);
    return text ? [{ label, value: text }] : [];
  });
}

function normalizedFieldV131(
  entity: VietnamEntityV124,
  key: string
): string | null {
  return titleTextV131(entity.normalizedAttributes?.[key]);
}

function factualPartsV131(parts: Array<string | null>): string[] {
  return parts.filter((part): part is string => Boolean(part));
}

function publicDecimalV131(value: unknown, maximumFractionDigits = 3): string | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return titleTextV131(value);
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits }).format(numeric);
}

function publicTechnologyV131(value: string | null): string | null {
  if (!value) return null;
  const renewable = value.match(/^RE\s*\(([^)]+)\)/iu);
  return renewable?.[1]?.trim() || value;
}

function publicIatiActivityIdV131(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/[?&#]aid=([^&#]+)/iu);
  if (!match?.[1]) return null;
  try {
    return titleTextV131(decodeURIComponent(match[1]));
  } catch {
    return titleTextV131(match[1]);
  }
}

function factualCompositeV131(
  entity: VietnamEntityV124
): FactualTitleV131 | null {
  switch (entity.elementId) {
    case "A-013": {
      const sector = normalizedFieldV131(entity, "field_a16123c4");
      const target = normalizedFieldV131(entity, "field_890a80ed");
      const informationType = normalizedFieldV131(entity, "typeOfInformation");
      const localizedType =
        informationType === "Action"
          ? "행동"
          : informationType === "Indicator"
          ? "지표"
          : informationType;
      const details = factualPartsV131([
        sector,
        target ? `SDG ${target}` : null,
        localizedType,
      ]);
      if (!details.length) return null;
      return {
        title: `NDC–SDG 연계 · ${details.join(" · ")}`,
        nameAvailability: "not-provided",
        secondaryNote: "원문 개별 명칭이 없어 공개된 부문과 SDG 세부목표로 구분합니다.",
      };
    }
    case "A-023": {
      const fuel = normalizedFieldV131(entity, "fuelType");
      const capacity = publicDecimalV131(
        entity.normalizedAttributes?.capacityMw ?? entity.normalizedAttributes?.mw,
        2
      );
      if (!fuel && !capacity) return null;
      return {
        title: factualPartsV131([
          fuel ? `${fuel} 발전시설` : "발전시설",
          capacity ? `${capacity} MW` : null,
        ]).join(" · "),
        nameAvailability: "not-provided",
        secondaryNote: "원문 시설명이 없어 공개된 발전원과 용량으로 구분합니다.",
      };
    }
    case "B-012": {
      // EM-DAT names each row by its disaster number. What it is, and when, are
      // in columns of their own.
      const kind =
        normalizedFieldV131(entity, "재해세부유형") ||
        normalizedFieldV131(entity, "재해유형");
      const started = normalizedFieldV131(entity, "시작일");
      const place =
        normalizedFieldV131(entity, "발생지역_원문") ||
        normalizedFieldV131(entity, "IBTrACS_태풍명_SID");
      const parts = factualPartsV131([kind, started, place]);
      if (!parts.length) return null;
      return {
        title: parts.join(" · "),
        nameAvailability: "identifier-only",
        secondaryNote: "원천의 재해번호(EM-DAT DisNo)로 식별합니다.",
        identifierFacts: factualIdentifierRowsV131([
          ["EM-DAT 재해번호", normalizedFieldV131(entity, "EM_DAT_재해번호_DisNo")],
        ]),
      };
    }
    case "B-017": {
      // The delivery's unit is a HydroBASINS level-6 basin crossed with a
      // province, and it says both in columns of its own.
      const region =
        normalizedFieldV131(entity, "2025_개편_후_소속_34개_체계") ||
        normalizedFieldV131(entity, "지역명_로마자");
      const basin = normalizedFieldV131(entity, "HydroBASINS_lvl6_코드_pfaf_id");
      // -9999 is Aqueduct's no-data code, not a basin. Those rows are told
      // apart by the area of the polygon the delivery measured for them.
      const unitArea = publicDecimalV131(
        entity.normalizedAttributes?.["Aqueduct_단위면적_km"],
        3
      );
      // The delivery's unit is basin × province × aquifer, and it ships no
      // aquifer name, so one basin can appear several times in a province. The
      // area it measured for each is what separates them.
      const parts = factualPartsV131([
        region,
        basin && basin !== "-9999" ? `HydroBASINS ${basin}` : "유역 코드 미기재",
        unitArea ? `${unitArea} km²` : null,
      ]);
      if (!parts.length) return null;
      return {
        title: parts.join(" · "),
        nameAvailability: "not-provided",
        secondaryNote:
          "원천이 개별 명칭 대신 성(省)과 HydroBASINS 유역 코드로 행을 구분합니다.",
      };
    }
    case "A-024": {
      const voltage = publicDecimalV131(
        entity.normalizedAttributes?.voltageKv ?? entity.normalizedAttributes?.kv,
        1
      );
      const length = publicDecimalV131(
        entity.normalizedAttributes?.lengthKm ?? entity.normalizedAttributes?.km,
        3
      );
      // The delivery numbers each segment in its own note. Without it every
      // 220 kV segment with no stated length reads as the same card.
      const sequence =
        normalizedFieldV131(entity, "lineSequence") ||
        (String(entity.note || "").match(/구간\s*일련번호\s*[:：]\s*(\d+)/u) || [])[1] ||
        null;
      return {
        title: factualPartsV131([
          "송전망 구간",
          sequence ? `구간 ${sequence}` : null,
          voltage ? `${voltage} kV` : null,
          length ? `${length} km` : null,
        ]).join(" · "),
        nameAvailability: "not-provided",
        secondaryNote: "원문 선로명이 없어 공개된 전압과 연장으로 구분합니다.",
      };
    }
    case "C-008": {
      const registryId = normalizedFieldV131(entity, "field_1a9fdace");
      const actorType = titleTextV131(entity.rawAttributes?.attr_2);
      if (!registryId && !actorType) return null;
      return {
        title: factualPartsV131([registryId, actorType]).join(" · "),
        nameAvailability: "identifier-only",
        secondaryNote: "원천의 공식 등록번호와 참여자 유형으로 식별합니다.",
      };
    }
    case "D-012": {
      const country = normalizedFieldV131(entity, "field_8084d610");
      const technology = publicTechnologyV131(
        normalizedFieldV131(entity, "technologyField")
      );
      const capacity = titleTextV131(
        entity.normalizedAttributes?.field_d8d97f43 ??
          entity.normalizedAttributes?.capacity
      );
      const year = normalizedFieldV131(entity, "field_6e227ae6");
      const subject = factualPartsV131([country, technology]).join(" ");
      return {
        title: factualPartsV131([
          subject ? `${subject} 진출 사례` : "기업 진출 사례",
          capacity,
          year,
        ]).join(" · "),
        nameAvailability: "not-provided",
        secondaryNote: "원문 기업·사업명이 없어 공개된 국가·기술·규모로 구분합니다.",
      };
    }
    case "D-019": {
      const reference = normalizedFieldV131(entity, "field_19951543");
      const sector = normalizedFieldV131(entity, "sectors");
      const objective = normalizedFieldV131(entity, "objective");
      if (!reference && !sector && !objective) return null;
      return {
        title: factualPartsV131([
          "CTCN 기술지원",
          reference,
          sector,
          objective,
        ]).join(" · "),
        nameAvailability: reference ? "identifier-only" : "not-provided",
        secondaryNote: reference
          ? "원천의 공식 참조번호와 지원 분야로 식별합니다."
          : "원문 요청명이 없어 공개된 지원 분야로 구분합니다.",
      };
    }
    case "D-022": {
      const donor = normalizedFieldV131(entity, "donorOrganization");
      const activityId = publicIatiActivityIdV131(
        normalizedFieldV131(entity, "field_87a4b6ef")
      );
      const sector = normalizedFieldV131(entity, "field_a9a17396");
      if (!donor && !activityId && !sector) return null;

      // The identifiers move out of the heading and into the card's detail
      // rows, where they still identify the record without being read as its
      // name. The source keeps them either way; this only decides where a
      // reader meets them.
      const projectNumber = publicProjectNumberV136_3(activityId);
      const identifierFacts = factualIdentifierRowsV131([
        ["사업번호", projectNumber],
        ["IATI 활동번호", activityId],
      ]);

      const verified = publicProjectTitleEntryV136_3(activityId);
      if (verified) {
        return {
          title: verified.displayTitleKo,
          nameAvailability: "available",
          secondaryNote: donor ? `${donor} 투자사업` : "개발금융 투자사업",
          identifierFacts: [
            { label: "공식 영문명", value: verified.officialTitle },
            ...identifierFacts,
          ],
        };
      }

      // No verified name for this number. The donor and the sector are both
      // confirmed values, so they name the card; inventing a purpose or a
      // facility for it would be worse than a plain description.
      const sectorLabel = publicCategoryLabelV136_2(sector || "");
      return {
        title: factualPartsV131([
          donor ? `${donor} 투자사업` : "개발금융 투자사업",
          sectorLabel || null,
        ]).join(" · "),
        nameAvailability: activityId ? "identifier-only" : "not-provided",
        secondaryNote: activityId
          ? "원문 사업명이 없어 공여기관과 분야로 구분하며, 사업번호로 식별합니다."
          : "원문 사업명이 없어 공개된 공여기관과 분야로 구분합니다.",
        identifierFacts,
      };
    }
    default:
      return null;
  }
}

function publicRecordTypeV131(
  entity: VietnamEntityV124,
  options: PublicEntityTitleOptionsV131
): string {
  const elementType = ELEMENT_RECORD_TYPE_V131[entity.elementId];
  if (elementType) return elementType;

  const publicEntityType = titleTextV131(entity.entityType);
  if (publicEntityType && !/^(?:entity|record|row|item|개체)$/iu.test(publicEntityType)) {
    return `${publicEntityType} 항목`;
  }

  const templateType = options.template
    ? TEMPLATE_RECORD_TYPE_V131[options.template]
    : null;
  return templateType || "공개 데이터 항목";
}

export function resolvePublicEntityTitleV131(
  entity: VietnamEntityV124,
  options: PublicEntityTitleOptionsV131 = {}
): PublicEntityTitleResolutionV131 {
  const elementTitle = titleTextV131(options.elementTitle);
  const elementFields = ELEMENT_TITLE_FIELDS_V131[entity.elementId] || [];
  const elementFieldTitle = titleFromFieldsV131(entity, elementFields);
  if (elementFieldTitle) {
    return {
      title: elementFieldTitle,
      strategy: "element-title-field",
      nameAvailability: "available",
      secondaryNote: null,
      identifierFacts: [],
    };
  }

  const templateFields = options.template
    ? TEMPLATE_TITLE_FIELDS_V131[options.template] || []
    : [];
  const templateTitle = titleFromFieldsV131(
    entity,
    templateFields.map((key) => ({ key }))
  );
  if (templateTitle) {
    return {
      title: templateTitle,
      strategy: "template-title-field",
      nameAvailability: "available",
      secondaryNote: null,
      identifierFacts: [],
    };
  }

  const directTitle = titleTextV131(entity.name);
  // A bare number or a bare date is a measurement, not a name. The ETL falls
  // back to the row's first stated attribute when the delivery gives no name
  // column, which titled A-024's 722 line segments "220" and A-013's 365 NDC
  // rows "1.2". Where the element has a reviewed composite, it says more.
  if (directTitle && NON_NAME_TITLE_V137.test(directTitle)) {
    const composite = factualCompositeV131(entity);
    if (composite) {
      return {
        title: composite.title,
        strategy: "factual-composite",
        nameAvailability: composite.nameAvailability,
        secondaryNote: composite.secondaryNote,
        identifierFacts: composite.identifierFacts || [],
      };
    }
  }
  // A name that is really the row's own key tells a reader nothing. Where the
  // delivery separates the dimensions that key encodes, use those.
  // A name that is literally the value of the row's own identifier column is an
  // identifier. B-008 names its rows "1475_low_ssp126_q17_2020" (레코드_키) and
  // B-012 names them "1952-0008-VNM" (EM-DAT 재해번호).
  const recordKeyValue = Object.entries(entity.normalizedAttributes || {}).some(
    ([key, value]) =>
      IDENTIFIER_COLUMN_V137.test(key) && titleTextV131(value) === directTitle
  );
  if (
    !directTitle ||
    recordKeyValue ||
    RECORD_KEY_TITLE_V137.test(directTitle) ||
    COMPOSED_RECORD_KEY_V137.test(directTitle)
  ) {
    const elementComposite = factualCompositeV131(entity);
    if (elementComposite) {
      return {
        title: elementComposite.title,
        strategy: "factual-composite",
        nameAvailability: elementComposite.nameAvailability,
        secondaryNote: elementComposite.secondaryNote,
        identifierFacts: elementComposite.identifierFacts || [],
      };
    }
    const composite = regionYearCompositeV137(entity);
    if (composite) {
      return {
        title: composite.title,
        strategy: "factual-composite",
        nameAvailability: composite.nameAvailability,
        secondaryNote: composite.secondaryNote,
        identifierFacts: [],
      };
    }
  }
  if (directTitle) {
    return {
      title: directTitle,
      strategy: "source-name",
      nameAvailability: "available",
      secondaryNote: null,
      identifierFacts: [],
    };
  }

  const generalTitle = titleFromFieldsV131(
    entity,
    GENERAL_TITLE_FIELDS_V131.map((key) => ({ key }))
  );
  if (generalTitle) {
    return {
      title: generalTitle,
      strategy: "template-title-field",
      nameAvailability: "available",
      secondaryNote: null,
      identifierFacts: [],
    };
  }

  const factualComposite = factualCompositeV131(entity);
  if (factualComposite) {
    return {
      title: factualComposite.title,
      strategy: "factual-composite",
      nameAvailability: factualComposite.nameAvailability,
      secondaryNote: factualComposite.secondaryNote,
      identifierFacts: factualComposite.identifierFacts || [],
    };
  }

  const sourceIdentifier = publicSourceIdentifierV131(entity);
  if (sourceIdentifier) {
    return {
      title: sourceIdentifier,
      strategy: "source-identifier",
      nameAvailability: "identifier-only",
      secondaryNote: "원천의 등록번호로 식별합니다.",
      identifierFacts: [],
    };
  }

  return {
    title: publicRecordTypeV131(entity, options),
    strategy: "record-type",
    nameAvailability: "not-provided",
    secondaryNote: elementTitle
      ? "원문에 개별 명칭이 없어 데이터 유형으로 표시합니다."
      : "원문에 개별 명칭이 없어 항목 유형으로 표시합니다.",
    identifierFacts: [],
  };
}

export function publicEntityTitleV131(
  entity: VietnamEntityV124,
  options: PublicEntityTitleOptionsV131 = {}
): string {
  return resolvePublicEntityTitleV131(entity, options).title;
}
