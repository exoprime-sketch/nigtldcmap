import type { CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import type { VietnamMapFactFieldV137 } from "../vietnam/vietnamTypesV121";
import { publicSourceOrganizationV136_1, publicTextV126 } from "../visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../visualization/publicNumberFormatV126";
import { hasPublicMapFactValueV143, isPublicMapFactV143, publicMapFactSourcesV143 } from "../visualization/publicMapCopyV143";
import sourceByIndicator from "./mapSourcesV148.json";

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

export function mapIndicatorSourceV148(indicatorId: string | null | undefined, fallback = ""): string {
  return publicSourceOrganizationV136_1((sourceByIndicator as Record<string, string>)[indicatorId || ""] || fallback) || "";
}

export function mapFactValueV148(fact: VietnamMapFactFieldV137, attributes: Record<string, unknown>): unknown {
  for (const key of [...fact.sources, fact.key]) {
    const value = attributes[key];
    if (!hasPublicMapFactValueV143(value)) continue;
    if (typeof value === "string" && /^(미기재|미표기|미공개|미확인|unknown)$/iu.test(value.trim())) continue;
    return fact.valueMap?.[String(value).trim().toLowerCase()] ?? value;
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
