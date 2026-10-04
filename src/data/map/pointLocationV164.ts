import { formatRegionName } from "../geo/regionNameV161";
import { countryNameKoV164 } from "../geo/countryNameKoV164";
import { ADM1_34_UNITS_V151, type BoundarySystemV151 } from "./adminBoundaryV151";

/**
 * V164: what a point's pop-up says about where it sits.
 *
 * The location sidecar answers one question - does the point fall inside a
 * province polygon? A point that does not got "소재 미확정(성·시 경계 밖 지점)"
 * whatever the reason, which was wrong for a Mekong station in Cambodia, a
 * typhoon track point at sea, a tide gauge whose province the record states
 * and a mine the record places in Quảng Trị. The record usually says which of
 * those it is, so the line is worded from the record's own attributes:
 *
 *   outside the country  -> "국외 지점 (캄보디아 Kratie)"
 *   at sea               -> "해상 지점 (국토 최근접 147.3 km)"
 *   a unit is stated     -> "소재 꽝찌 (Quảng Trị) · 개편 후 34개 기준"
 *   nothing is stated    -> "좌표가 행정경계 밖(해안·도서·해상)" - the geometric fact only
 *
 * No wording here is Viet Nam specific except the "34개" note, which is added
 * only for a unit read from the Vietnamese post-2025 column.
 */

type Attributes = Readonly<Record<string, unknown>>;

const UNIT_KEYS_V164 = ["개편_후_소속_단위", "지역_지역명_현행"] as const;
const UNIT_LIST_SEPARATOR_V164 = /\s+·\s+|\s*;\s*/u;
const NOT_A_UNIT_V164 = /해당\s*없음|국외|미기재|미표기|nan/iu;
const SEA_DISTANCE_KEYS_V164 = ["태풍_중심_국토_최근접거리_km", "국토_최근접거리_km"] as const;
const SHOWN_UNITS_V164 = 2;

function stated(attrs: Attributes, key: string): string {
  const value = attrs[key];
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text && text !== "nan" ? text : "";
}

function statedUnits(attrs: Attributes): { raw: string; units: string[] } {
  for (const key of UNIT_KEYS_V164) {
    const raw = stated(attrs, key);
    if (!raw || NOT_A_UNIT_V164.test(raw)) continue;
    const units = raw.split(UNIT_LIST_SEPARATOR_V164).map((part) => part.trim()).filter(Boolean);
    if (units.length) return { raw, units };
  }
  return { raw: "", units: [] };
}

function abroadPlace(attrs: Attributes): string | null {
  // "캄보디아 Kratie(국외 지점)" -> "캄보디아 Kratie"
  const gadm = stated(attrs, "소속_행정구역_ADM1_GADM_명칭").replace(/\s*\((?:국외\s*지점|국외)\)\s*$/u, "").trim();
  if (gadm) return gadm;
  return countryNameKoV164(stated(attrs, "hqCountryIso3"));
}

function statesAbroad(attrs: Attributes): boolean {
  const locationType = Object.entries(attrs).find(([key]) => /좌표_소재_구분/u.test(key));
  if (locationType && /해외|국외/u.test(String(locationType[1] ?? ""))) return true;
  return ["개편_후_소속_단위", "소속_행정구역_ADM1_GADM_명칭"].some((key) => /국외/u.test(stated(attrs, key)));
}

function seaDistanceKm(attrs: Attributes): number | null {
  for (const key of SEA_DISTANCE_KEYS_V164) {
    const value = Number(stated(attrs, key));
    if (stated(attrs, key) && Number.isFinite(value) && value > 0) return value;
  }
  const basis = /국토\s*최근접\s*([\d.]+)\s*km/u.exec(stated(attrs, "좌표_산출근거"));
  const parsed = basis ? Number(basis[1]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** One decimal at most, never a trailing ".0". */
function kmText(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * The note for a point the sidecar found outside every province polygon.
 * Never says "미확정" and never uses "성·시" (Bangladesh screens share it).
 */
export function pointOutsideNoteV164(attrs: Attributes | null | undefined, countryIso3: string): string {
  const record: Attributes = attrs || {};
  const iso3 = String(countryIso3 || "").toUpperCase();

  if (statesAbroad(record)) {
    const place = abroadPlace(record);
    return place ? `국외 지점 (${place})` : "국외 지점";
  }

  const { units } = statedUnits(record);
  if (units.length) {
    const names = units.slice(0, SHOWN_UNITS_V164).map((unit) => formatRegionName({ country: iso3, raw: unit, level: iso3 === "VNM" ? "adm1-34" : undefined }));
    const rest = units.length - names.length;
    if (units.length > 1) {
      // A centroid of several affected units: the line says so instead of
      // naming one place as if the event stood in it.
      return `영향 지역 ${units.length}곳의 중심 좌표 (${names.join(" · ")}${rest > 0 ? ` 외 ${rest}곳` : ""})`;
    }
    return `소재 ${names[0]}${iso3 === "VNM" ? " · 개편 후 34개 기준" : ""}`;
  }

  const distance = seaDistanceKm(record);
  if (distance !== null) return `해상 지점 (국토 최근접 ${kmText(distance)} km)`;

  return "좌표가 행정경계 밖(해안·도서·해상)";
}

/**
 * The unit a point sits in, as "한글 (현지명)" in the boundary vintage on screen.
 * The selection panel printed the sidecar's 63-province name under "소재 성·시"
 * even on the 34-unit outline (E-005 Huế read "트어티엔후에 (Thừa Thiên Huế)",
 * the pre-2025 name, while the unit is 후에): the post-2025 unit is named when
 * the outline is the 2025 one and the sidecar knows it.
 */
export function pointUnitNameV164(
  hit: { adm1Name: string; unitCode: string | null },
  system: BoundarySystemV151,
  countryIso3: string
): string {
  const unit = system === "post-2025-34" && hit.unitCode ? ADM1_34_UNITS_V151.find((candidate) => candidate.unitCode === hit.unitCode) : undefined;
  return unit
    ? formatRegionName({ country: countryIso3, raw: unit.name, level: "adm1-34" })
    : formatRegionName({ country: countryIso3, raw: hit.adm1Name, level: "adm1-63" });
}
