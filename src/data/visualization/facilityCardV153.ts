import { publicMapFactValueV163 } from "../map/mapFactValueLabelsV163";
import { formatRegionName, formatRegionTextV162 } from "../geo/regionNameV161";
import { publicTextV126 } from "./publicFieldPolicyV126";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { POWER_PLANT_SOURCES_V141, powerPlantCapacityMwV141, powerPlantFuelV141, powerPlantSourceKeyV141 } from "../map/powerPlantFactsV141";
import { formatPublicNumberV126 } from "./publicNumberFormatV126";
import { NUMBER_ONLY_NAME_V164, powerPlantStatedEntityV164 } from "../map/powerPlantStatedV164";
import { mapIndicatorSourceV148 } from "../map/mapPresentationV148";
import { countryNameKoV164 } from "../geo/countryNameKoV164";
import { regionNameEntryV161 } from "../geo/regionNameV161";
import { resolvePublicEntityTitleV131 } from "./publicEntityTitleV131";
import { publicRecordNoteV161, publicSourceUrlV126 } from "./publicFieldPolicyV126";

export { powerPlantStatedEntityV164 };

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

export type FacilityCardFormatV153 = "text" | "number" | "year" | "url" | "adm1" | "fuel" | "source" | "country";

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

const COUNTRY_KO_V163: Readonly<Record<string, string>> = { VNM: "베트남", BGD: "방글라데시" };
const COUNTRY: FacilityCardFieldV153 = { key: "country", label: "국가", sources: [], constant: "베트남" };
const NAME: FacilityCardFieldV153 = { key: "name", label: "명칭", sources: ["@name"] };
const ADM1: FacilityCardFieldV153 = { key: "location", label: "소재지", sources: ["adm1Name34"], format: "adm1" };

function orgFields(
  typeSources: string[],
  extra: FacilityCardFieldV153[] = [],
  // V164: where the Bangladesh delivery states these (its keys differ from Viet Nam's).
  more: { location?: string[]; source?: string[] } = {}
): FacilityCardFieldV153[] {
  return [
    COUNTRY,
    NAME,
    { key: "type", label: "유형", sources: typeSources },
    ...extra,
    { key: "location", label: "소재지", sources: ["adm1Name34", "city", ...(more.location || [])], format: "adm1" },
    { key: "source", label: "자료 출처", sources: ["sourceUrl", "recordSourceUrl", "field_efec870d", ...(more.source || []), "@sourceUrl"], format: "url" },
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
      { key: "hq", label: "본부 소재국", sources: ["hqCountryIso3", "실제_본사_소재국_hq_country_iso3"], format: "country" },
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
    fields: [COUNTRY, { key: "name", label: "명칭", sources: ["광산명", "@name"] }, { key: "type", label: "광종", sources: ["광종"] }, { key: "note", label: "기후기술 연계", sources: ["기후기술_연계_근거"] }, { key: "location", label: "소재지", sources: ["adm1Name34", "개편_후_소속_단위", "소재_행정구역_ADM1", "소재_행정구역_성"], format: "adm1" }, { key: "source", label: "자료 출처", sources: ["sourceUrl", "recordSourceUrl", "@sourceUrl"], format: "url" }],
  },
  // 2026-09-30 delivery: C-025 moved to the wide "[블록] 속성" template
  // (wideRecordsV162.ts), one row per project ("크레딧 사업") or per issuance
  // ("발행 기록"); the old "속성N_…" keys are kept as a fallback only, since a
  // few rows may still carry them.
  "C-025": {
    elementId: "C-025",
    noun: "탄소사업",
    fields: [COUNTRY, { key: "name", label: "명칭", sources: ["식별_프로젝트명", "속성1_레코드명", "@name"] }, { key: "type", label: "등록 제도", sources: ["식별_등록_표준", "standard"] }, { key: "owner", label: "사업자", sources: ["사업_사업자_기관", "proponent", "속성8_사업자_기관"] }, { key: "scale", label: "규모", sources: ["사업_연간_예상_감축량_tCO_e_년", "속성14_연간예상감축_tCO2e"], format: "number", unit: "tCO₂e/년" }, { key: "year", label: "시점", sources: ["실적_최초_빈티지_년", "발행기록_연도_년", "속성4_시점"] }, { key: "status", label: "상태", sources: ["status", "식별_등재_상태", "속성7_상태"] }, { key: "location", label: "소재지", sources: ["adm1Name34", "지역_지역명_현행", "속성21_지역_현행"], format: "adm1" }, { key: "source", label: "자료 출처", sources: ["출처_원문_URL", "속성19_원문URL"], format: "url" }],
  },
  "E-004": { elementId: "E-004", noun: "기관", fields: orgFields(["orgType"], [{ key: "program", label: "담당·프로그램", sources: ["officeProgram"] }, { key: "contact", label: "연락처", sources: ["email", "phone"] }]) },
  "E-005": { elementId: "E-005", noun: "기관", fields: orgFields(["orgType"], [{ key: "domain", label: "분야", sources: ["domain"] }, { key: "contact", label: "연락처", sources: ["contact"] }]) },
  "E-018": {
    elementId: "E-018",
    noun: "기업",
    // V164: the Bangladesh delivery names these columns (업종, 설립_사업연도, 연락처,
    // 현지_주소) where Viet Nam's carries hashed ones; both are read.
    fields: orgFields(
      ["진출_상태"],
      [{ key: "business", label: "사업 분야", sources: ["field_a2123512", "업종"] }, { key: "year", label: "설립·진출", sources: ["field_8440b85d", "설립_사업연도"] }, { key: "contact", label: "연락처", sources: ["contact", "연락처"] }],
      // 출처 is a sentence ("KOTRA, 「…」 … — https://…"), not an address; the
      // record's own link is its provenance (@sourceUrl) and the name comes from there too.
      { location: ["현지_주소"] }
    ),
  },
  "E-019": { elementId: "E-019", noun: "기관", fields: orgFields(["field_6b3e1e90"], [{ key: "address", label: "주소", sources: ["address"] }, { key: "contact", label: "연락처", sources: ["contact"] }]) },
};

/**
 * V164: the publisher a source address belongs to, for a record whose own
 * provenance names none (A-025's is the supplier's, not the publisher's).
 * Only addresses whose owner is the address itself are named.
 */
const PUBLISHER_BY_HOST_V164: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?:^|\.)globalccsinstitute\.com$/iu, "Global CCS Institute"],
  [/(?:^|\.)data\.go\.kr$/iu, "공공데이터포털(data.go.kr)"],
];

function publisherOfHostV164(href: string | undefined): string {
  if (!href) return "";
  try {
    const host = new URL(href).hostname;
    return PUBLISHER_BY_HOST_V164.find(([pattern]) => pattern.test(host))?.[1] || "";
  } catch {
    return "";
  }
}

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
  // V163-T3: the record's own country (a Bangladesh record never reads 베트남).
  if (field.key === "country" && entity.countryIso3 && COUNTRY_KO_V163[entity.countryIso3]) {
    return { key: field.key, label: field.label, value: COUNTRY_KO_V163[entity.countryIso3], missing: false };
  }
  if (field.constant) return { key: field.key, label: field.label, value: field.constant, missing: false };
  if (field.format === "fuel") {
    const fuel = powerPlantFuelV141(attributes);
    return fuel ? { key: field.key, label: field.label, value: fuel, missing: false } : missing;
  }
  if (field.format === "adm1") {
    const current = text(attributes.adm1Name34);
    const former = text(attributes.adm1Name63);
    if (current) {
      // V162 (P12-B): "한글명 (현지명)" from the region dictionary, the unit's
      // own vintage for each name (34 now, 63 before the 2025 reform).
      const named = formatRegionName({ country: entity.countryIso3 || "VNM", raw: current, level: "adm1-34" });
      const formerNamed = former ? formatRegionName({ country: entity.countryIso3 || "VNM", raw: former, level: "adm1-63" }) : "";
      const suffix = former && former !== current ? ` · 개편 후 34개 기준 · 구 ${formerNamed}` : " · 개편 후 34개 기준";
      return { key: field.key, label: field.label, value: `${named}${suffix}`, missing: false };
    }
    // V164-3: a record that states its level-1 unit in English (Bangladesh
    // "Dhaka Division", assigned by the delivery from the point's own
    // coordinates) reads "다카 (Dhaka Division)" like a Viet Nam province does.
    const statedUnit = text(attributes.admin1_name_en) || text(attributes.admin1NameEn);
    if (statedUnit) {
      return { key: field.key, label: field.label, value: formatRegionName({ country: entity.countryIso3 || "VNM", raw: statedUnit }), missing: false };
    }
    // V164: the 2025 unit the delivery states in its own column (B-048 "Quảng Trị")
    // when the sidecar-derived adm1Name34 is absent - the record does state it.
    const country = entity.countryIso3 || "VNM";
    const stated34 = text(attributes["개편_후_소속_단위"]);
    if (stated34 && !/해당\s*없음|국외/u.test(stated34) && field.sources.includes("개편_후_소속_단위")) {
      return { key: field.key, label: field.label, value: `${formatRegionTextV162({ country, raw: stated34, level: "adm1-34" })} · 개편 후 34개 기준`, missing: false };
    }
    const fallback = field.sources.map((source) => text(readSource(entity, source))).find(Boolean);
    if (!fallback) return missing;
    // V163-T3: an unknown location is 미기재, not asserted to be outside every
    // province (the map can place the same point inside one). A place the
    // region dictionary knows ("Chittagong") needs no "원문 표기" caveat.
    const known = regionNameEntryV161({ country, raw: fallback }) !== null;
    const named = formatRegionTextV162({ country, raw: fallback });
    return { key: field.key, label: field.label, value: known ? named : `${named} (원문 표기)`, missing: false };
  }
  if (field.format === "country") {
    const raw = field.sources.map((source) => text(readSource(entity, source))).find(Boolean);
    if (!raw) return missing;
    // The delivery stores ISO 3166-1 alpha-3 ("USA"); a reader says 미국.
    return { key: field.key, label: field.label, value: countryNameKoV164(raw) || raw, missing: false };
  }
  if (field.format === "source") {
    // A-023: the registry's own name and year, then the row's link.
    const key = powerPlantSourceKeyV141(entity.indicatorId || "");
    const registry = POWER_PLANT_SOURCES_V141[key]?.label || null;
    // V164-3: a record without its own link points at the registry it came from.
    const href = publicSourceUrlV126(text(attributes.sourceUrl)) || publicSourceUrlV126(text(entity.provenance?.sourceUrl)) || undefined;
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
    // V164: a source reads as who published it ("International Energy Agency
    // (IEA)"), with the link kept, not as a bare address ("www.data.go.kr/…").
    // A record with no link of its own still names its publisher.
    const organisation =
      mapIndicatorSourceV148(entity.indicatorId, text(entity.provenance?.sourceOrg) || "", entity.countryIso3) ||
      publisherOfHostV164(href);
    if (organisation) return { key: field.key, label: field.label, value: organisation, href, missing: false };
    return href ? { key: field.key, label: field.label, value: href.replace(/^https?:\/\//u, "").replace(/\/$/u, ""), href, missing: false } : missing;
  }
  // V162: a note field reads like any record note - the compiler's coding
  // memo ("tech_id 공란(별첨2 R4: 억지 매핑 금지)") is not the record's content.
  const plain = field.key === "note" ? text(publicRecordNoteV161(text(raw) || "")) : text(raw);
  // V163-T3: a status in the source's own English (Global CCS Institute
  // "Planned", GEM "pre-construction") reads in Korean; others as written.
  const value = plain && field.key === "status" ? publicMapFactValueV163("status", plain) : plain;
  return value ? { key: field.key, label: field.label, value, missing: false } : missing;
}

/** The card's rows for one entity, in the dataset's declared order. */
export function facilityCardRowsV153(elementId: string, entityIn: VietnamEntityV124): FacilityCardRowV153[] {
  const spec = FACILITY_CARD_SPECS_V153[elementId];
  if (!spec) return [];
  const entity = elementId === "A-023" ? powerPlantStatedEntityV164(entityIn) : entityIn;
  const rows = spec.fields.map((field) => formatField(field, entity));
  // V163-T3: a record whose name field repeats its type (A-025 "Power (coal)")
  // has no name of its own - the row reads 미기재 rather than the type twice.
  const type = rows.find((row) => row.key === "type" && !row.missing)?.value;
  return rows.map((row) => {
    if (!(row.key === "name" && type && row.value === type)) return row;
    // V164: the facility's own name is stated elsewhere in the record (A-025
    // "[시설명: VAPCO Vung Ang II …]" in its note) and is the card's title;
    // the row says that name, and is 미기재 only when the record has none.
    const title = resolvePublicEntityTitleV131(entity).title;
    return title && title !== type
      ? { ...row, value: title, missing: false }
      : { ...row, value: FACILITY_CARD_MISSING_V153, missing: true };
  });
}

export function facilityCardSpecV153(elementId: string): FacilityCardSpecV153 | null {
  return FACILITY_CARD_SPECS_V153[elementId] || null;
}

/** A spatial feature's list of the records it draws ("[\"bgd-…-00029\"]" or an array). */
export function featureRecordIdsV164(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [raw];
}

/**
 * V164-3: the record behind a facility drawn from a country's spatial asset
 * (Bangladesh A-023 plants come from the delivery's GeoJSON, Viet Nam's from
 * its records), so both countries' plants read with one label-form card -
 * 국가 · 명칭 · 발전원 · 소유·운영 · 설비용량 · 가동 연도 · 소재지 · 자료 출처.
 *
 * The drawn feature names the plant, its fuel and its capacity; the record
 * adds what the feature does not carry (its level-1 unit, owner, year, link).
 * A field neither states stays 미기재 - nothing is filled in.
 */
export function spatialFacilityEntityV164(input: {
  elementId: string;
  countryIso3: string;
  properties: Record<string, unknown>;
  entity?: VietnamEntityV124 | null;
}): VietnamEntityV124 | null {
  if (!FACILITY_CARD_SPECS_V153[input.elementId]) return null;
  const { properties, entity } = input;
  const featureName = publicTextV126(properties.name);
  const recordName = entity ? publicTextV126(entity.name) : null;
  // The delivery's record name can be a figure (BGD A-023 "54" is a capacity).
  const name =
    featureName && !NUMBER_ONLY_NAME_V164.test(featureName)
      ? featureName
      : recordName && !NUMBER_ONLY_NAME_V164.test(recordName)
      ? recordName
      : featureName || recordName || "";
  const stated = (value: unknown) => (value === null || value === undefined || value === "" ? undefined : value);
  const attributes: Record<string, unknown> = { ...(entity?.normalizedAttributes || {}) };
  const assign = (key: string, value: unknown) => {
    if (stated(attributes[key]) === undefined && stated(value) !== undefined) attributes[key] = value;
  };
  assign("capacityMw", properties.capacityMw ?? properties.mw);
  assign("primaryFuel", properties.primaryFuel);
  assign("fuelType", properties.fuelType ?? properties.kindLabel);
  assign("owner", properties.owner);
  assign("commissioningYear", properties.commissioningYear);
  assign("adm1Name34", properties.adm1Name34);
  return {
    ...(entity || {}),
    recordId: entity?.recordId || String(properties.selectionKey ?? properties.featureId ?? ""),
    elementId: input.elementId,
    countryIso3: entity?.countryIso3 || input.countryIso3,
    name,
    indicatorId: entity?.indicatorId ?? null,
    normalizedAttributes: attributes,
    provenance: entity?.provenance || ({} as VietnamEntityV124["provenance"]),
  } as VietnamEntityV124;
}
