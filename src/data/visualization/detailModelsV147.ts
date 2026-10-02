import type { VietnamEntityV124, VietnamIndicatorMetaV124 } from "../vietnam/vietnamTypesV124";
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

/**
 * The 2026-09-30 delivery reshaped C-002 into one wide "entity(레코드형)" row
 * per report/record (`normalizedAttributes["인벤토리_*"]` for the BUR/BTR
 * rows) and moved the by-sector gas split out of row-level records entirely:
 * it is now descriptive text on a dedicated "부문별 배출량" indicator per
 * sector ("CO₂ 46,047.20·N₂O 24.12·HFCs 23.32 / 14.6%" as its `caveat`, one
 * indicator per report vintage × sector). `totalKey` reads the sector total
 * from the wide row; `sector` finds that report vintage's matching indicator
 * for the gas split.
 */
const BUR_SECTORS_V147 = [
  { source: "Energy(에너지)", label: "에너지", totalKey: "인벤토리_에너지", sector: /에너지/u },
  { source: "IPPU(산업공정 제품사용)", label: "산업공정·제품사용", totalKey: "인벤토리_IPPU", sector: /산업공정/u },
  { source: "AFOLU(농업 임업 기타토지이용)", label: "농업·임업·기타토지이용", totalKey: "인벤토리_AFOLU_합계", sector: /AFOLU/u },
  { source: "Waste(폐기물)", label: "폐기물", totalKey: "인벤토리_폐기물", sector: /폐기물/u },
] as const;
export const BUR_GASES_V147 = ["CO2", "CH4", "N2O", "HFCs"] as const;
type BurGasesV147 = Record<typeof BUR_GASES_V147[number], number | null>;
const EMPTY_BUR_GASES_V147: BurGasesV147 = { CO2: null, CH4: null, N2O: null, HFCs: null };

/** The single most recent BUR ("격년갱신보고서(BUR)") record, or null when
 * none exist or the year is ambiguous (a duplicate source row is never
 * silently deduplicated into a guess). */
function latestBurEntityV147(entities: VietnamEntityV124[]): VietnamEntityV124 | null {
  const reports = entities.filter((r) => r.normalizedAttributes?.["식별_레코드_유형"] === "격년갱신보고서(BUR)");
  let latestYear: number | null = null;
  for (const r of reports) {
    const year = r.normalizedAttributes?.["인벤토리_연도_년"];
    if (typeof year === "number" && (latestYear === null || year > latestYear)) latestYear = year;
  }
  if (latestYear === null) return null;
  const candidates = reports.filter((r) => r.normalizedAttributes?.["인벤토리_연도_년"] === latestYear);
  return candidates.length === 1 ? candidates[0] : null;
}

const GAS_LABEL_MAP_V147: Record<string, typeof BUR_GASES_V147[number]> = { "CO₂": "CO2", "CH₄": "CH4", "N₂O": "N2O", HFCs: "HFCs" };
const GAS_TOKEN_V147 = /(CO₂|CH₄|N₂O|HFCs)\s*(−?[\d,]+(?:\.\d+)?)/gu;

/** A gas the source note does not name is a structural zero-source cell
 * (e.g. IPPU has no CH₄ source), never a fabricated 0 or a stale value. */
function parseBurGasesV147(caveat: string | null | undefined): BurGasesV147 {
  const out: BurGasesV147 = { ...EMPTY_BUR_GASES_V147 };
  if (!caveat) return out;
  for (const match of caveat.matchAll(GAS_TOKEN_V147)) {
    const key = GAS_LABEL_MAP_V147[match[1]];
    if (key) out[key] = Number(match[2].replace(/,/gu, "").replace(/−/gu, "-"));
  }
  return out;
}

function burSectorGasesV147(indicators: VietnamIndicatorMetaV124[], reviewedYear: number, sectorPattern: RegExp): BurGasesV147 {
  const yearTag = `(${reviewedYear} 인벤토리)`;
  const matches = indicators.filter((ind) => {
    if (!ind.indicatorId.startsWith("C-002_by_sector_emission") || !ind.labelKo.includes(yearTag)) return false;
    const suffix = ind.labelKo.slice(ind.labelKo.lastIndexOf(" — ") + 3);
    return sectorPattern.test(suffix);
  });
  // More than one sector-indicator match for the same report year is
  // ambiguous and fails closed, the same as a duplicate source row.
  return matches.length === 1 ? parseBurGasesV147(matches[0].caveat) : { ...EMPTY_BUR_GASES_V147 };
}

export function burInventoryV147(entities: VietnamEntityV124[], indicators: VietnamIndicatorMetaV124[] = []) {
  const entity = latestBurEntityV147(entities);
  const reviewedYear = entity ? (entity.normalizedAttributes?.["인벤토리_연도_년"] as number) : null;
  return BUR_SECTORS_V147.map(({ source, label, totalKey, sector }) => {
    const raw = entity?.normalizedAttributes?.[totalKey];
    return {
      source,
      label,
      total: typeof raw === "number" ? raw : null,
      gases: reviewedYear !== null ? burSectorGasesV147(indicators, reviewedYear, sector) : { ...EMPTY_BUR_GASES_V147 },
    };
  });
}

/** A change in a ranking/index is not a relative growth rate. */
export function changeUnitV147(unit: string): string {
  return unit.replace(/^\s*(%|퍼센트|percent)/iu, "%p");
}
export function allowsRelativeChangeV147(unit: string): boolean {
  return !/(%|퍼센트|percent|순위|지수|점|^위$|^rank$|score|index|°C|℃)/iu.test(unit);
}
