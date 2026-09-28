import { parseNoteTechIdV159 } from "./S1CountryObservationV159";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import type { GeometryTypeV159, S3LocatedEntityV159 } from "./structureTypesV159";
import { countryPublicDirV158 } from "../countryContext";

/**
 * S3 adapter (docs/DATA_TYPOLOGY_V159_SCHEMA.md §2.3).
 *
 * Verified against ${countryPublicDirV158("VNM")} downloads for A-023 (power
 * plants), E-006 (investor offices) and B-008 (sea-level stations, one of
 * the six dedicated elements - same adapter input, own render component).
 * Field lookups use a normalized key (lower-cased, spaces/underscores
 * stripped) so both Korean and English deliveries match the same rule.
 *
 * | field | rule | example |
 * |---|---|---|
 * | recordKey | first normalizedAttributes key that normalizes to one of `recordkey`/`recordid`/`refno`/`gppdid`/`레코드키`/`레코드id`/`관측소id`; else `entity.name`; else `entity.recordId` | A-023 `gppdId`, B-008 `레코드_키` |
 * | name | `entity.name` | all |
 * | classKey/classLabel | first attribute matching `primaryFuel`/`class`/`classification`/`분류`/`유형` (exact, not a substring of a longer key) | A-023 `primaryFuel` |
 * | size | a numeric attribute whose key, split on `_`, has a segment exactly matching a known unit token (mw, kw, kv, km, ha, m, mm, cm, t, kg, 건, 개; displayed in its canonical case, e.g. `mw`→`MW`) | A-023 `mw`, B-008 `상대해수면_상승_m_2005년_기준` |
 * | year | first attribute matching `year`/`commissioningyear`/`연도`/`준공연도`/`기준연도` | A-023 `commissioningYear` |
 * | owner | first attribute matching `owner`/`소유자`/`운영기관` | A-023 `owner` |
 * | techIds | `note` starting with `[<정확한 CLIMATE_TECHNOLOGIES nameKo>...]` (catalog exact match only, never a guess) | A-023 `[수력 기술 (Hydropower)]` → `05` |
 * | sourceUrl | first attribute matching `sourceurl`/`record_source_url`/`원문url` | A-023 `sourceUrl` |
 *
 * Known gaps (no rule implemented - values stay null rather than guessed):
 * - `adm1Source` is defined by the schema as the **source's own** stated
 *   province, never the platform's point-in-polygon result. A-023/E-004/
 *   E-005/E-006/E-018 deliveries only carry `adm1Code63`/`adm1Name63`/
 *   `adm1Code34`/`adm1Name34`, which the V151 pipeline computes from
 *   coordinates - not something the source stated. This adapter leaves
 *   `adm1Source` null for all current samples; it activates only once a
 *   delivery adds a field that is documented as source-stated.
 * - `techIds` for E-006 stays empty: its technologies are listed in a prose
 *   explanation field ("기술코드_근거문구") that names several CTIS codes at
 *   once with no single row-level code, and its own note says the codes
 *   live at `meta_info.tech_ids` (indicator level), which this per-entity
 *   adapter does not read.
 * - `geometryRef` has no observed source field yet (schema reserves it for
 *   line/polygon deliveries); stays null.
 */

const ID_KEY_CANDIDATES = ["recordkey", "recordid", "refno", "gppdid", "레코드키", "레코드id", "관측소id"];
const CLASS_KEY_CANDIDATES = ["primaryfuel", "class", "classification", "분류", "유형"];
const YEAR_KEY_CANDIDATES = ["year", "commissioningyear", "연도", "준공연도", "기준연도"];
const OWNER_KEY_CANDIDATES = ["owner", "소유자", "운영기관"];
const SOURCE_URL_KEY_CANDIDATES = ["sourceurl", "recordsourceurl", "원문url"];
const UNIT_DISPLAY: Record<string, string> = {
  mw: "MW",
  kw: "kW",
  kv: "kV",
  km: "km",
  ha: "ha",
  m: "m",
  mm: "mm",
  cm: "cm",
  t: "t",
  kg: "kg",
  건: "건",
  개: "개",
};
const UNIT_TOKENS = new Set(Object.keys(UNIT_DISPLAY));

/** See S4EntityV159.ts normalizeKey: strips the shared `속성N_` numbered-slot prefix some S4-style templates reuse. */
function normalizeKey(key: string): string {
  return key
    .replace(/^속성\d+_?/u, "")
    .toLowerCase()
    .replace(/[_\s]/gu, "");
}

function findAttribute(
  attrs: Record<string, unknown>,
  candidates: readonly string[]
): { key: string; value: unknown } | null {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === "") continue;
    if (candidates.includes(normalizeKey(key))) return { key, value };
  }
  return null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/gu, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function findSize(attrs: Record<string, unknown>): { value: number; unit: string | null } | null {
  for (const [key, value] of Object.entries(attrs)) {
    const numeric = toFiniteNumber(value);
    if (numeric === null) continue;
    const segments = key.toLowerCase().split("_");
    const unit = segments.find((segment) => UNIT_TOKENS.has(segment));
    if (unit) return { value: numeric, unit: UNIT_DISPLAY[unit] };
  }
  return null;
}

function validGeometryType(value: unknown): GeometryTypeV159 {
  return value === "point" || value === "line" || value === "polygon" ? value : null;
}

export function adaptS3V159(entities: readonly VietnamEntityV124[]): S3LocatedEntityV159[] {
  return entities.map((entity) => {
    const attrs = entity.normalizedAttributes || {};
    const idAttr = findAttribute(attrs, ID_KEY_CANDIDATES);
    const classAttr = findAttribute(attrs, CLASS_KEY_CANDIDATES);
    const yearAttr = findAttribute(attrs, YEAR_KEY_CANDIDATES);
    const ownerAttr = findAttribute(attrs, OWNER_KEY_CANDIDATES);
    const sourceUrlAttr = findAttribute(attrs, SOURCE_URL_KEY_CANDIDATES);
    const recordKey =
      (idAttr && String(idAttr.value)) || (entity.name && String(entity.name)) || entity.recordId;
    const classLabel = classAttr ? String(classAttr.value) : null;
    const noteTechId = parseNoteTechIdV159(entity.note);
    return {
      elementId: entity.elementId,
      indicatorId: entity.indicatorId ?? null,
      recordKey,
      name: entity.name ?? null,
      latitude: entity.latitude ?? null,
      longitude: entity.longitude ?? null,
      geometryType: validGeometryType(entity.geometryType),
      crs: entity.crs ?? null,
      geometryRef: null,
      classKey: classLabel,
      classLabel,
      size: findSize(attrs),
      year: yearAttr ? toFiniteNumber(yearAttr.value) : null,
      owner: ownerAttr ? String(ownerAttr.value) : null,
      adm1Source: null,
      techIds: noteTechId ? [noteTechId] : [],
      sourceUrl: sourceUrlAttr ? String(sourceUrlAttr.value) : null,
      coordinateQuality: (entity.coordinateQuality as S3LocatedEntityV159["coordinateQuality"]) ?? null,
    };
  });
}
