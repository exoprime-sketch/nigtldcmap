import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { POWER_PLANT_SOURCES_V141, powerPlantCapacityMwV141, powerPlantFuelV141, powerPlantSourceKeyV141 } from "../map/powerPlantFactsV141";
import { PROVINCE_KO_34_V151 } from "../map/adminBoundaryV151";
import { formatPublicNumberV126 } from "./publicNumberFormatV126";
import { publicSourceUrlV126 } from "./publicFieldPolicyV126";

/**
 * V153: one label-form card for every facility, organisation and project.
 *
 * The user asked for the same reading everywhere a single site is shown -
 * detail list, selected-site panel, later the map pop-ups:
 *
 *   국가: 베트남 · 명칭: … · 발전원: 수력 · 소유·운영: … · 설비용량: 520 MW
 *   · 가동 연도: 2016 · 소재지: 선라성 (34개 기준 · 구 …) · 자료 출처: … · 링크
 *
 * Each dataset declares its fields in this order with the attribute keys
 * that supply them; a field with no value prints "미기재" and is never hidden,
 * so an empty owner is visibly empty rather than silently absent.
 */
export const FACILITY_CARD_MISSING_V153 = "미기재";

export type FacilityCardFormatV153 = "text" | "number" | "year" | "url" | "adm1" | "fuel" | "source";

export interface FacilityCardFieldV153 {
  key: string;
  label: string;
  /** Attribute keys tried in order; "@name" reads the entity name. */
  sources: string[];
  format?: FacilityCardFormatV153;
  unit?: string;
  /** A fixed value (e.g. country) - no attribute is read. */
  constant?: string;
}

export interface FacilityCardSpecV153 {
  elementId: string;
  noun: string;
  fields: FacilityCardFieldV153[];
}

export interface FacilityCardRowV153 {
  key: string;
  label: string;
  value: string;
  href?: string;
  missing: boolean;
}

const COUNTRY: FacilityCardFieldV153 = { key: "country", label: "국가", sources: [], constant: "베트남" };
const NAME: FacilityCardFieldV153 = { key: "name", label: "명칭", sources: ["@name"] };
const ADM1: FacilityCardFieldV153 = { key: "location", label: "소재지", sources: ["adm1Name34"], format: "adm1" };

function orgFields(typeSources: string[], extra: FacilityCardFieldV153[] = []): FacilityCardFieldV153[] {
  return [
    COUNTRY,
    NAME,
    { key: "type", label: "유형", sources: typeSources },
    ...extra,
    { key: "location", label: "소재지", sources: ["adm1Name34", "city"], format: "adm1" },
    { key: "source", label: "자료 출처", sources: ["sourceUrl", "recordSourceUrl", "field_efec870d", "@sourceUrl"], format: "url" },
  ];
}

export const FACILITY_CARD_SPECS_V153: Record<string, FacilityCardSpecV153> = {
  "A-023": {
    elementId: "A-023",
    noun: "발전소",
    fields: [
      COUNTRY,
      NAME,
      { key: "fuel", label: "발전원", sources: ["fuelType", "primaryFuel"], format: "fuel" },
      { key: "owner", label: "소유·운영", sources: ["owner", "operator", "field_4cf75655"] },
      { key: "capacity", label: "설비용량", sources: ["capacityMw", "mw"], format: "number", unit: "MW" },
      { key: "year", label: "가동 연도", sources: ["commissioningYear"], format: "year" },
      ADM1,
      { key: "source", label: "자료 출처", sources: ["sourceUrl"], format: "source" },
    ],
  },
  "E-006": {
    elementId: "E-006",
    noun: "투자기관",
    fields: [
      COUNTRY,
      NAME,
      { key: "type", label: "기관 유형", sources: ["field_75295a6c", "field_a76779ad"] },
      { key: "owner", label: "펀드·소속", sources: ["fundOrAffiliate"] },
      { key: "sector", label: "투자 분야", sources: ["investSector"] },
      { key: "scale", label: "규모", sources: ["amountValue"], format: "number", unit: "amountCurrency" },
      { key: "hq", label: "본부 소재국", sources: ["hqCountryIso3"] },
      { key: "location", label: "소재지", sources: ["adm1Name34", "city"], format: "adm1" },
      { key: "source", label: "자료 출처", sources: ["field_efec870d"], format: "url" },
    ],
  },
  "A-025": {
    elementId: "A-025",
    noun: "CCS 사업",
    fields: [COUNTRY, NAME, { key: "type", label: "유형", sources: ["type"] }, { key: "status", label: "추진 상태", sources: ["field_b25998a0"] }, ADM1, { key: "source", label: "자료 출처", sources: ["sourceUrl", "@sourceUrl"], format: "url" }],
  },
  "B-048": {
    elementId: "B-048",
    noun: "광산",
    fields: [COUNTRY, { key: "name", label: "명칭", sources: ["광산명", "@name"] }, { key: "type", label: "광종", sources: ["광종"] }, { key: "note", label: "기후기술 연계", sources: ["기후기술_연계_근거"] }, { key: "location", label: "소재지", sources: ["adm1Name34", "소재_행정구역_성"], format: "adm1" }, { key: "source", label: "자료 출처", sources: ["좌표_산출근거", "@sourceUrl"], format: "url" }],
  },
  "C-025": {
    elementId: "C-025",
    noun: "탄소사업",
    fields: [COUNTRY, { key: "name", label: "명칭", sources: ["속성1_레코드명", "@name"] }, { key: "type", label: "등록 제도", sources: ["standard"] }, { key: "owner", label: "사업자", sources: ["proponent", "속성8_사업자_기관"] }, { key: "scale", label: "규모", sources: ["속성14_연간예상감축_tCO2e"], format: "number", unit: "tCO₂e/년" }, { key: "year", label: "시점", sources: ["속성4_시점"] }, { key: "status", label: "상태", sources: ["status", "속성7_상태"] }, { key: "location", label: "소재지", sources: ["adm1Name34", "속성21_지역_현행"], format: "adm1" }, { key: "source", label: "자료 출처", sources: ["속성19_원문URL"], format: "url" }],
  },
  "E-004": { elementId: "E-004", noun: "기관", fields: orgFields(["orgType"], [{ key: "program", label: "담당·프로그램", sources: ["officeProgram"] }, { key: "contact", label: "연락처", sources: ["email", "phone"] }]) },
  "E-005": { elementId: "E-005", noun: "기관", fields: orgFields(["orgType"], [{ key: "domain", label: "분야", sources: ["domain"] }, { key: "contact", label: "연락처", sources: ["contact"] }]) },
  "E-018": { elementId: "E-018", noun: "기업", fields: orgFields(["진출_상태"], [{ key: "business", label: "사업 분야", sources: ["field_a2123512"] }, { key: "year", label: "설립·진출", sources: ["field_8440b85d"] }, { key: "contact", label: "연락처", sources: ["contact"] }]) },
  "E-019": { elementId: "E-019", noun: "기관", fields: orgFields(["field_6b3e1e90"], [{ key: "address", label: "주소", sources: ["address"] }, { key: "contact", label: "연락처", sources: ["contact"] }]) },
};

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const out = String(value).trim();
  if (!out || out === "(미표기)" || out === "미기재" || out === "nan") return null;
  return out;
}

function readSource(entity: VietnamEntityV124, source: string): unknown {
  if (source === "@name") return entity.name;
  if (source === "@sourceUrl") return entity.provenance?.sourceUrl;
  return (entity.normalizedAttributes || {})[source];
}

function formatField(field: FacilityCardFieldV153, entity: VietnamEntityV124): FacilityCardRowV153 {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const missing = { key: field.key, label: field.label, value: FACILITY_CARD_MISSING_V153, missing: true };
  if (field.constant) return { key: field.key, label: field.label, value: field.constant, missing: false };
  if (field.format === "fuel") {
    const fuel = powerPlantFuelV141(attributes);
    return fuel ? { key: field.key, label: field.label, value: fuel, missing: false } : missing;
  }
  if (field.format === "adm1") {
    const current = text(attributes.adm1Name34);
    const former = text(attributes.adm1Name63);
    if (current) {
      const korean = PROVINCE_KO_34_V151[String(attributes.adm1Code34 || "")];
      const named = korean ? `${korean}(${current})` : current;
      const suffix = former && former !== current ? ` · 개편 후 34개 기준 · 구 ${former}` : " · 개편 후 34개 기준";
      return { key: field.key, label: field.label, value: `${named}${suffix}`, missing: false };
    }
    const fallback = field.sources.map((source) => text(readSource(entity, source))).find(Boolean);
    return fallback ? { key: field.key, label: field.label, value: `${fallback} (성·시 경계 밖 · 원문 표기)`, missing: false } : { ...missing, value: `${FACILITY_CARD_MISSING_V153}(성·시 경계 밖)` };
  }
  if (field.format === "source") {
    // A-023: the registry's own name and year, then the row's link.
    const key = powerPlantSourceKeyV141(entity.indicatorId || "");
    const registry = POWER_PLANT_SOURCES_V141[key]?.label || null;
    const href = publicSourceUrlV126(text(attributes.sourceUrl)) || undefined;
    const sourceName = text(attributes.sourceName);
    const parts = [registry, sourceName && sourceName !== registry ? sourceName : null].filter(Boolean);
    if (!parts.length && !href) return missing;
    return { key: field.key, label: field.label, value: parts.join(" · ") || "링크", href, missing: false };
  }
  const raw = field.sources.map((source) => readSource(entity, source)).find((value) => text(value) !== null);
  if (field.format === "number") {
    // No stated value is 미기재, never 0 (Number("") would be 0).
    const number = field.sources[0] === "capacityMw" || field.sources[0] === "mw" ? powerPlantCapacityMwV141(attributes) : raw === undefined ? null : Number(String(raw).replace(/,/g, ""));
    if (number === null || !Number.isFinite(number)) return missing;
    // The unit follows the number; E-006 amounts carry their currency and kind.
    const unit = field.unit === "amountCurrency" ? text(attributes.currency) || "" : field.unit || "";
    const kind = field.unit === "amountCurrency" ? text(attributes.amountType) : null;
    const formatted = `${formatPublicNumberV126(number, unit)}${unit ? ` ${unit}` : ""}${kind ? ` · ${kind}` : ""}`;
    return { key: field.key, label: field.label, value: formatted, missing: false };
  }
  if (field.format === "year") {
    const year = Number(raw);
    return Number.isInteger(year) && year > 1800 ? { key: field.key, label: field.label, value: String(year), missing: false } : missing;
  }
  if (field.format === "url") {
    const href = publicSourceUrlV126(text(raw)) || undefined;
    return href ? { key: field.key, label: field.label, value: href.replace(/^https?:\/\//u, "").replace(/\/$/u, ""), href, missing: false } : missing;
  }
  const value = text(raw);
  return value ? { key: field.key, label: field.label, value, missing: false } : missing;
}

/** The card's rows for one entity, in the dataset's declared order. */
export function facilityCardRowsV153(elementId: string, entity: VietnamEntityV124): FacilityCardRowV153[] {
  const spec = FACILITY_CARD_SPECS_V153[elementId];
  if (!spec) return [];
  return spec.fields.map((field) => formatField(field, entity));
}

export function facilityCardSpecV153(elementId: string): FacilityCardSpecV153 | null {
  return FACILITY_CARD_SPECS_V153[elementId] || null;
}
