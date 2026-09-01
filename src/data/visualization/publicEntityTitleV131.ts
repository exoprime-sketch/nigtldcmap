import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";

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

export interface PublicEntityTitleResolutionV131 {
  title: string;
  strategy: PublicEntityTitleStrategyV131;
  nameAvailability: PublicEntityNameAvailabilityV131;
  secondaryNote: string | null;
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
    case "A-024": {
      const voltage = publicDecimalV131(
        entity.normalizedAttributes?.voltageKv ?? entity.normalizedAttributes?.kv,
        1
      );
      const length = publicDecimalV131(
        entity.normalizedAttributes?.lengthKm ?? entity.normalizedAttributes?.km,
        3
      );
      const sequence = normalizedFieldV131(entity, "lineSequence");
      return {
        title: factualPartsV131([
          "송전망 구간",
          voltage ? `${voltage} kV` : null,
          length ? `${length} km` : null,
          !voltage && !length && sequence ? `구간 ${sequence}` : null,
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
      return {
        title: factualPartsV131([
          donor ? `${donor} 투자사업` : "개발금융 투자사업",
          activityId,
          sector,
        ]).join(" · "),
        nameAvailability: activityId ? "identifier-only" : "not-provided",
        secondaryNote: activityId
          ? "원천의 IATI 활동번호와 공여기관·분야로 식별합니다."
          : "원문 사업명이 없어 공개된 공여기관과 분야로 구분합니다.",
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
    };
  }

  const directTitle = titleTextV131(entity.name);
  if (directTitle) {
    return {
      title: directTitle,
      strategy: "source-name",
      nameAvailability: "available",
      secondaryNote: null,
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
    };
  }

  const factualComposite = factualCompositeV131(entity);
  if (factualComposite) {
    return {
      title: factualComposite.title,
      strategy: "factual-composite",
      nameAvailability: factualComposite.nameAvailability,
      secondaryNote: factualComposite.secondaryNote,
    };
  }

  const sourceIdentifier = publicSourceIdentifierV131(entity);
  if (sourceIdentifier) {
    return {
      title: sourceIdentifier,
      strategy: "source-identifier",
      nameAvailability: "identifier-only",
      secondaryNote: "원천의 등록번호로 식별합니다.",
    };
  }

  return {
    title: publicRecordTypeV131(entity, options),
    strategy: "record-type",
    nameAvailability: "not-provided",
    secondaryNote: elementTitle
      ? "원문에 개별 명칭이 없어 데이터 유형으로 표시합니다."
      : "원문에 개별 명칭이 없어 항목 유형으로 표시합니다.",
  };
}

export function publicEntityTitleV131(
  entity: VietnamEntityV124,
  options: PublicEntityTitleOptionsV131 = {}
): string {
  return resolvePublicEntityTitleV131(entity, options).title;
}
