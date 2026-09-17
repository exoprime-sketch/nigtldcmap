import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import type { SemanticObservationV125 } from "./semanticTypesV125";

export const finiteV147 = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** No record-order selection, zero imputation, or averaging conflicting values. */
export function uniqueNumericV147(rows: Array<{ value: unknown }>): number | null {
  return rows.length === 1 && finiteV147(rows[0].value) ? rows[0].value : null;
}

export function monthlyClimateV147(rows: SemanticObservationV125[]) {
  const keys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return keys.map((key, index) => {
    const own = (prefix: string) => rows.filter((r) => r.indicatorId === `B-001_${prefix}_${key}`);
    const season = own("season_class_national");
    return {
      month: index + 1,
      precipitation: uniqueNumericV147(own("pr_month_norm")),
      temperature: uniqueNumericV147(own("tas_month_norm")),
      season: season.length === 1 && ["건기", "우기"].includes(String(season[0].value)) ? String(season[0].value) : "자료 없음",
    };
  });
}

export interface NationalSeriesV147 {
  key: string;
  label: string;
  unit: string;
  unitConflict?: boolean;
  points: Array<{ year: number; value: number | null; id: string; note: string; conflict: boolean }>;
}
/** The national column is a separate population from the 63 province rows.
 * Keep delivered dataset/measure names intact: MODIS, CCI and WorldCover must
 * never be joined into one longer, apparently comparable series. */
export function nationalSeriesV147(entities: VietnamEntityV124[]): NationalSeriesV147[] {
  const groups = new Map<string, NationalSeriesV147>();
  for (const row of entities) {
    const a = row.normalizedAttributes || {};
    const label = String(a["전국_지표명"] || "").trim();
    const unit = String(a["전국_단위"] || "").trim();
    const year = a["연도"] ?? a["기준연도"];
    if (!label || !unit || !finiteV147(year) || !Number.isInteger(year)) continue;
    const key = JSON.stringify([label, unit]);
    // A delivered hydropower count has an MW unit. Do not chart it as capacity
    // or silently correct the delivered unit without source confirmation.
    const unitConflict = /개소수\(개\)/u.test(label) && unit !== "개";
    const group = groups.get(key) || { key, label, unit, unitConflict, points: [] };
    const duplicate = group.points.find((p) => p.year === year);
    if (duplicate) { duplicate.value = null; duplicate.conflict = true; }
    else group.points.push({ year, value: finiteV147(a["전국_값"]) ? a["전국_값"] : null, id: row.recordId, note: row.note || "", conflict: false });
    groups.set(key, group);
  }
  return Array.from(groups.values()).map((g) => ({ ...g, points: g.points.sort((a, b) => a.year - b.year) }));
}

const BUR_SECTORS_V147 = [
  ["Energy(에너지)", "에너지", "BUR3(2016) — 1 Energy(에너지)"],
  ["IPPU(산업공정 제품사용)", "산업공정·제품사용", "BUR3(2016) — 2 IPPU(산업공정·제품사용)"],
  ["AFOLU(농업 임업 기타토지이용)", "농업·임업·기타토지이용", "BUR3(2016) — 3 AFOLU(농업·임업·기타토지이용)"],
  ["Waste(폐기물)", "폐기물", "BUR3(2016) — 4 Waste(폐기물)"],
] as const;
export const BUR_GASES_V147 = ["CO2", "CH4", "N2O", "HFCs"] as const;
export function burInventoryV147(entities: VietnamEntityV124[]) {
  const rows = entities.filter((r) => r.indicatorId === "C-002_ghg_sector_emission" && String(r.normalizedAttributes?.["속성4_시점"]) === "2016");
  const value = (name: string) => uniqueNumericV147(rows.filter((r) => r.name === name).map((r) => ({ value: r.normalizedAttributes?.["속성3_값"] })));
  return BUR_SECTORS_V147.map(([source, label, total]) => ({
    source, label, total: value(total),
    gases: Object.fromEntries(BUR_GASES_V147.map((gas) => [gas, value(`${source} - ${gas}`)])) as Record<typeof BUR_GASES_V147[number], number | null>,
  }));
}

/** A change in a ranking/index is not a relative growth rate. */
export function changeUnitV147(unit: string): string {
  return unit.replace(/^\s*(%|퍼센트|percent)/iu, "%p");
}
export function allowsRelativeChangeV147(unit: string): boolean {
  return !/(%|퍼센트|percent|순위|지수|점|^위$|^rank$|score|index|°C|℃)/iu.test(unit);
}
