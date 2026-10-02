import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { wideRecordsOfEntitiesV162 } from "./wideRecordsV162";

export interface FacilityRegionRowV146 {
  entity: VietnamEntityV124;
  code: string;
  region: string;
  count: number;
  date: string;
  sectors: { label: string; value: number }[];
  sectorTotalMatches: boolean;
}

export interface FacilityRegionModelV146 {
  regions: FacilityRegionRowV146[];
  dates: string[];
  other: VietnamEntityV124[];
}

/**
 * C-022's inventory-facility count by province, from the 2026-09-30 wide
 * delivery: one entity per province under the "의무 인벤토리 시설 집계" record
 * type, with the count in `[인벤토리] 의무 인벤토리 시설 수 (개)` and the four
 * annex categories (industry/transport/construction/agriculture) as separate
 * fields that already sum to the total (verified per row, never assumed).
 * The delivery states one document for every row, so unlike the old
 * multi-vintage template there is a single date; it is read from the row's
 * own "근거" text rather than invented, since the field definitions carry no
 * dedicated date column for this block.
 */
const INVENTORY_DATE_V162 = /(\d{4}-\d{2}-\d{2})/gu;

function facilityRegionsFromWideV162(entities: VietnamEntityV124[]): FacilityRegionModelV146 | null {
  const records = wideRecordsOfEntitiesV162(entities);
  if (!records.length) return null;
  const regions: FacilityRegionRowV146[] = [];
  records.forEach((record) => {
    const countText = record.get("인벤토리", "의무 인벤토리 시설 수 (개)");
    const regionName = record.get("지역", "지역명 (현행)") || record.get("지역", "지역명 (개편 전)");
    if (!countText || !/^\d+$/u.test(countText) || !regionName) return;
    const count = Number(countText);
    const basis = record.get("인벤토리", "근거") || "";
    const dateMatches = [...basis.matchAll(INVENTORY_DATE_V162)].map((match) => match[1]);
    const date = dateMatches[dateMatches.length - 1] || "";
    const sectorBlock = record.blocks.find((block) => block.block === "인벤토리");
    const sectors = (sectorBlock?.values || [])
      .filter((value) => /^부속서/u.test(value.attribute))
      .flatMap((value) => {
        const parsed = Number(value.value);
        if (!Number.isFinite(parsed)) return [];
        return [{ label: value.attribute.replace(/\s*\(개\)\s*$/u, ""), value: parsed }];
      });
    regions.push({
      entity: record.entity,
      // Not shown on screen: only used as a stable selector/React key, the
      // same way every list in this screen keys on a record's own id.
      code: record.entity.recordId,
      region: regionName,
      count,
      date,
      sectors,
      sectorTotalMatches: sectors.length > 0 && sectors.reduce((sum, sector) => sum + sector.value, 0) === count,
    });
  });
  if (!regions.length) return null;
  const dates = [...new Set(regions.map((row) => row.date))].sort().reverse();
  return { regions, dates, other: entities.filter((entity) => !regions.some((row) => row.entity.recordId === entity.recordId)) };
}

function facilityRegionsFromLegacyV146(entities: VietnamEntityV124[]): FacilityRegionModelV146 {
  const regions = entities.flatMap((entity) => {
    const a = entity.normalizedAttributes || {};
    const code = String(a["속성22_행정코드P_code"] || "");
    const region = String(a["속성20_지역_원문"] || a["속성21_지역_현행"] || "");
    const rawCount = String(a["속성3_값"] ?? "").trim();
    if (!/^VN\d+$/.test(code) || !region || !/^\d+$/.test(rawCount) || !/시설/.test(entity.name || "")) return [];
    const parts = String(a["속성6_분류"] || "").split(/\s*\/\s*/).flatMap((part) => {
      const match = part.match(/^(.+?)\s+(\d+)$/);
      return match ? [{ label: match[1].replace("공상(Công Thương)", "산업·통상"), value: Number(match[2]) }] : [];
    });
    return [{ entity, code, region, count: Number(rawCount), date: String(a["속성4_시점"] || ""), sectors: parts, sectorTotalMatches: parts.length > 0 && parts.reduce((sum, part) => sum + part.value, 0) === Number(rawCount) }];
  });
  // Preserve date-specific observations. Do not sum repeated geography versions.
  const dates = [...new Set(regions.map((row) => row.date))].sort().reverse();
  return { regions, dates, other: entities.filter((entity) => !regions.some((row) => row.entity.recordId === entity.recordId)) };
}

export function facilityRegionsV146(entities: VietnamEntityV124[]): FacilityRegionModelV146 {
  return facilityRegionsFromWideV162(entities) || facilityRegionsFromLegacyV146(entities);
}
