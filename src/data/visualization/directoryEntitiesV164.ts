import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";

/**
 * V164-3: directory rows from deliveries that name their columns in Korean.
 *
 * The directory cards, their title and the heading's count read a row's
 * organisation, person and contact by the English-style keys the first delivery
 * used (`orgName`, `focalPointName`, `email`). The Bangladesh deliveries name the
 * same columns "기관명_org_name", "담당자명_person_name" and so on, so a card
 * found no organisation, fell back to the row's role ("네트워크 회원") and the
 * heading counted roles as if they were institutions. Each key below is read
 * only when the canonical one is empty; nothing is renamed or invented.
 */
const DIRECTORY_COLUMN_ALIASES_V164: Record<string, string[]> = {
  orgName: ["기관명_org_name", "기관명_org_name_공식_영문명", "소속기관_org_name", "org_name", "기관명"],
  organizationName: ["기관명_org_name", "기관명_org_name_공식_영문명", "소속기관_org_name", "org_name", "기관명"],
  orgType: ["기관_유형_org_type", "기관_유형_framework_분류", "org_type"],
  orgCategory: ["기관_유형_org_category"],
  organizationType: ["기관_유형_원본_표기"],
  role: ["역할_role"],
  recordStatus: ["현행여부_record_status"],
  city: ["도시_city", "도시"],
  officeAddress: ["사무소_주소_office_address", "현지_사무소_주소", "사무소_주소", "주소"],
  officeProgram: ["사무소_프로그램_office_program", "담당업무"],
  focalPointName: ["담당자명_focal_point_name", "담당자명_person_name", "담당자명_person_name_원본_표기_경칭_제거", "주담당자명"],
  focalPointTitle: ["직함_focal_point_title", "직함_title", "주담당_직함"],
  email: ["이메일_email", "주담당_이메일"],
  emailAlt: ["이메일_2_email_alt"],
  phone: ["전화번호_phone", "주담당_전화"],
  telephone: ["전화번호_2_phone_alt"],
  fax: ["팩스_fax"],
  websiteUrl: ["웹사이트_website_url"],
  recordSourceUrl: ["레코드별_출처_URL_record_source_url", "레코드별_출처_URL"],
  hqCountryIso3: ["실제_본사_소재국_hq_country_iso3"],
  investSector: ["투자_분야_invest_sector"],
  fundOrAffiliate: ["펀드_소속그룹_fund_or_affiliate"],
};

function hasValueV164(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * The row with the keys the directory cards read, filled from the delivery's own
 * columns. A row that already has them, or has none of the aliases, is returned
 * as it is.
 */
export function withDirectoryKeysV164(entity: VietnamEntityV124): VietnamEntityV124 {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const added: Record<string, unknown> = {};
  for (const [key, sources] of Object.entries(DIRECTORY_COLUMN_ALIASES_V164)) {
    if (hasValueV164(attributes[key])) continue;
    const source = sources.find((candidate) => hasValueV164(attributes[candidate]));
    if (source) added[key] = attributes[source];
  }
  if (Object.keys(added).length === 0) return entity;
  return { ...entity, normalizedAttributes: { ...attributes, ...added } } as VietnamEntityV124;
}

/**
 * A CDM activity filed in the register of Article 6.4 designated authorities.
 * E-002 lists the authority (one row) and the CDM activities it is processing
 * (11 for Bangladesh, 45 for Viet Nam) in the same sheet; the activities are
 * projects, not institutions, and used to be counted and carded as institutions.
 */
export function isCdmActivityRowV164(entity: VietnamEntityV124): boolean {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  return /cdm[_\s-]*transition/iu.test(String(entity.indicatorId || "")) || /^\s*CDM\s*전환\s*활동/u.test(String(attributes["대상_분야"] ?? ""));
}

export function splitCdmActivitiesV164(entities: VietnamEntityV124[]): {
  institutions: VietnamEntityV124[];
  activities: VietnamEntityV124[];
} {
  const activities = entities.filter(isCdmActivityRowV164);
  // A sheet that is only activities has no institution to split from.
  if (activities.length === 0 || activities.length === entities.length) return { institutions: entities, activities: [] };
  return { institutions: entities.filter((entity) => !isCdmActivityRowV164(entity)), activities };
}

export interface CdmActivityRowV164 {
  recordId: string;
  name: string;
  kind: string | null;
  status: string | null;
  procedure: string | null;
}

function textOfV164(attributes: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = attributes[key];
    if (hasValueV164(value) && typeof value !== "object") return String(value).replace(/\s+/gu, " ").trim();
  }
  return null;
}

/** A CDM activity as the table lists it: the project's name, its kind and where it stands. */
export function cdmActivityRowV164(entity: VietnamEntityV124): CdmActivityRowV164 {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const kind = textOfV164(attributes, ["대상_분야"]);
  return {
    recordId: entity.recordId,
    name: textOfV164(attributes, ["orgName", "기관명"]) || String(entity.name || "").trim(),
    kind: kind ? kind.replace(/^CDM\s*전환\s*활동\s*[—-]\s*/u, "") : null,
    status: textOfV164(attributes, ["recordStatus", "현행여부"]),
    procedure: textOfV164(attributes, ["approvalProcedure", "승인_절차_개요"]),
  };
}
