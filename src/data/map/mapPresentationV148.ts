import type { CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import type { VietnamMapFactFieldV137 } from "../vietnam/vietnamTypesV121";
import { publicSourceOrganizationV136_1, publicTextV126 } from "../visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../visualization/publicNumberFormatV126";
import { hasPublicMapFactValueV143, isPublicMapFactV143, publicMapFactSourcesV143 } from "../visualization/publicMapCopyV143";
import sourceByIndicator from "./mapSourcesV148.json";
import { publicMapFactValueV163 } from "./mapFactValueLabelsV163";

/** Per-dataset reading order, informed by GIPT/WRI, CCKP, GFW, Aqueduct,
 * project registries and institutional directories. These are display rules,
 * not additional data: missing ownership, status or observations stay missing. */
const PRIORITY: Record<string, string[]> = {
  "A-023": ["fuelType", "capacityMw", "operator", "commissionedOn", "sourceLabel"],
  "A-025": ["facilityType", "stage"],
  "B-008": ["location", "stationNameVi"],
  "B-012": ["disasterType", "startDate", "endDate", "affectedRegions", "deaths", "affectedPeople", "damageUsd2024"],
  "B-023": ["locationNote", "referenceYear"],
  "B-025": ["totalBasinArea", "areaInVietnamLiterature", "areaInVietnamGis", "shareInVietnam", "transboundary", "riverSystem"],
  "B-028": ["locationNote", "referenceYear"],
  "B-048": ["mineral", "regionName", "climateTechBasis"],
  // V157-2: the mineral layers lead with the joined national figure.
  "B-044": ["nationalValue", "mineral", "regionName"],
  "B-046": ["nationalValue", "mineral", "regionName"],
  "B-047": ["nationalValue", "mineral", "regionName"],
  "C-025": ["standard", "projectId", "technologyField", "annualReduction", "creditingPeriod", "regionName"],
  "E-004": ["officeProgram", "city", "orgType", "officeAddress", "recordStatus"],
  "E-005": ["domain", "city", "orgType", "capability", "intlCoop"],
  "E-006": ["investSector", "city", "fundOrAffiliate", "hqCountry"],
  "E-018": ["sector", "entryStatus", "entryForm", "establishedYear"],
  "E-019": ["scope", "city", "address"],
};
const INTERNAL_KEYS = new Set(["osmObjectId", "psmslId", "coordinateBasis", "spatialUnit", "capacityBand"]);
export interface MapFactV148 { key: string; label: string; value: string }

export function publicMapFieldsV148(layer: CountryMapLayerV122): VietnamMapFactFieldV137[] {
  const order = PRIORITY[layer.elementId] || [];
  const fields = layer.factFields || (layer.elementId === "D-018" ? [
    { key: "sectorKo", label: "사업 분야", sources: ["sectorKo"] },
    { key: "approvedAmount", label: "사업 전체 승인액", sources: ["approvedAmount"] },
    { key: "implementingEntity", label: "이행기관", sources: ["implementingEntity"] },
    { key: "participatingCountries", label: "참여국", sources: ["participatingCountries"] },
    { key: "verifiedActivityAreas", label: "활동지역", sources: ["verifiedActivityAreas"] },
    { key: "projectPeriod", label: "사업기간", sources: ["projectPeriod"] },
  ] : []);
  const enriched = layer.elementId === "C-025" ? [
    { key: "standard", label: "등록제도", sources: ["standard"] },
    { key: "projectId", label: "등록번호", sources: ["projectId"] },
    { key: "issuedCredits", label: "발행 실적", sources: ["속성11_발행량_tCO2e"], unit: "tCO₂e" },
    { key: "retiredCredits", label: "소각 실적", sources: ["속성12_소각량_tCO2e"], unit: "tCO₂e" },
    ...fields,
  ] : fields;
  return enriched
    .filter((f) => !INTERNAL_KEYS.has(f.key) && isPublicMapFactV143(f.label))
    .map((f) => publicMapFactSourcesV143(layer.elementId, layer.elementId === "E-004" && f.key === "officeProgram" ? { ...f, label: "사무소·프로그램" } : f))
    .sort((a, b) => (order.includes(a.key) ? order.indexOf(a.key) : 100) - (order.includes(b.key) ? order.indexOf(b.key) : 100));
}

/**
 * V164: a source line is the organisations that published the data, said once.
 *
 * Two kinds of segment crept into the delivered strings and are dropped here
 * (the strings are generated, so the reader is where they are cleaned):
 *   - a processing remark ("좌표보정 GADM 4.1" on B-012), which says how the
 *     platform treated the coordinates, not who published them;
 *   - the same organisation written a second time ("Global Forest Watch (UMD/WRI,
 *     Hansen et al. 2013) · … · Global Forest Watch / Hansen et al.(2013), UMD" on
 *     B-031), recognised by the name before the first "(" or "/".
 * A boundary note ("경계 GADM 4.1 ADM1") is a different segment and stays.
 */
export function publicSourceLineV164(line: string): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const segment of line.split(/\s+·\s+/u)) {
    const text = segment.trim();
    if (!text || /^좌표\s*보정/u.test(text)) continue;
    // A citation ("기관 — 법령 번호") names a distinct document, so it is only
    // dropped when written out in full twice; a plain organisation is dropped
    // when its name was already given.
    const key = text.includes("—") ? text.toLowerCase() : text.split(/\s*[(/]/u)[0].trim().toLowerCase();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    kept.push(text);
  }
  return kept.join(" · ");
}

/**
 * The public source line for a record of `indicatorId`.
 *
 * V164-4: `mapSourcesV148.json` was compiled from the Viet Nam delivery, and
 * Bangladesh reuses the same indicator ids (B-048_mine_site, B-023_hydro_site,
 * E-004_*), so a Bangladesh record read "USGS Minerals Yearbook Vietnam" or
 * "MRC (2009)". The table answers for Viet Nam only; any other country reads
 * the record's own source (`fallback`).
 */
export function mapIndicatorSourceV148(
  indicatorId: string | null | undefined,
  fallback = "",
  countryIso3: string | null | undefined = "VNM"
): string {
  const registry =
    !countryIso3 || countryIso3.toUpperCase() === "VNM"
      ? (sourceByIndicator as Record<string, string>)[indicatorId || ""]
      : undefined;
  return publicSourceLineV164(publicSourceOrganizationV136_1(registry || fallback) || "");
}

export function mapFactValueV148(fact: VietnamMapFactFieldV137, attributes: Record<string, unknown>): unknown {
  for (const key of [...fact.sources, fact.key]) {
    const value = attributes[key];
    if (!hasPublicMapFactValueV143(value)) continue;
    if (typeof value === "string" && /^(미기재|미표기|미공개|미확인|unknown)$/iu.test(value.trim())) continue;
    const mapped = fact.valueMap?.[String(value).trim().toLowerCase()];
    if (mapped !== undefined) return mapped;
    // V163-T2: source classification values without a delivered value map.
    return typeof value === "string" ? publicMapFactValueV163(fact.key, value) : value;
  }
  return null;
}

export function mapFactsV148(layer: CountryMapLayerV122, attributes: Record<string, unknown>): MapFactV148[] {
  return publicMapFieldsV148(layer).flatMap((fact) => {
    const raw = mapFactValueV148(fact, attributes);
    if (raw === null || raw === undefined) return [];
    const numeric = typeof raw !== "boolean" && String(raw).trim() !== "" && Number.isFinite(Number(raw));
    const value = fact.unit && numeric
      ? `${formatPublicNumberV126(Number(raw), fact.unit)} ${fact.unit}`
      : publicTextV126(typeof raw === "number" ? String(raw) : raw) || "";
    if (!value) return [];
    return [{ key: fact.key, label: fact.label || layer.fieldLabels?.[fact.key] || fact.key, value }];
  });
}

export function mapSourceLineV148(properties: Record<string, unknown>): string {
  const source = publicSourceOrganizationV136_1(String(properties.sourceLabel || properties.sourceOrg || "")) || "";
  const year = String(properties.referenceYear || "").trim();
  // A registry label may already contain its year.
  return [source, year && !source.includes(year) ? `${year}년 자료` : ""].filter(Boolean).join(" · ");
}

/** Same location/record is not necessarily the same facility across publishers. */
export function powerCapacitySummaryV148(rows: Array<{ normalizedAttributes?: Record<string, unknown> }>) {
  const groups = new Map<string, { label: string; count: number; capacity: number; knownCapacity: number }>();
  for (const row of rows) {
    const a = row.normalizedAttributes || {};
    const fuel = String(a.fuelType || "발전원 미기재");
    const group = groups.get(fuel) || { label: fuel, count: 0, capacity: 0, knownCapacity: 0 };
    group.count++;
    const v = a.capacityMw;
    if (typeof v === "number" && Number.isFinite(v)) { group.capacity += v; group.knownCapacity++; }
    groups.set(fuel, group);
  }
  return [...groups.values()].sort((a, b) => b.capacity - a.capacity || b.count - a.count);
}
