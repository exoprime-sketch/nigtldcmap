import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";

export function facilityRegionsV146(entities: VietnamEntityV124[]) {
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
