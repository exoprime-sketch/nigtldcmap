import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { parseCTemplateRowsV141 } from "./cTemplateRowsV141";

export const NDC_SOURCE_V146 = "https://unfccc.int/sites/default/files/NDC/2022-11/Viet%20Nam_NDC_2022_Eng.pdf";
/** Reviewed against NDC 2022, printed p.10, Table 3 (PDF p.15).
 * The delivery lost the condition column. Match subject + value + year + source,
 * never row order or min/max. Unknown future versions fail closed.
 */
const REVIEWED_TARGETS: Array<[string, string, string, number, number]> = [
  ["총량 감축률", "감축률", "%", 15.8, 43.5],
  ["총량 감축량", "감축량", "백만 tCO₂e", 146.3, 403.7],
  ["총량 소요재원", "소요재원", "백만 USD", 21741.2, 86834.7],
  ["에너지", "에너지", "백만 tCO₂e", 64.8, 227],
  ["농업", "농업", "백만 tCO₂e", 12.4, 50.9],
  ["LULUCF", "토지이용·토지이용변화·산림", "백만 tCO₂e", 32.5, 46.6],
  ["폐기물", "폐기물", "백만 tCO₂e", 8.7, 29.4],
  ["산업공정(IP)", "산업공정", "백만 tCO₂e", 27.9, 49.8],
];

export function ndcTargetsV146(entities: VietnamEntityV124[]) {
  const rows = parseCTemplateRowsV141(entities);
  const matched = new Set<string>();
  const targets = REVIEWED_TARGETS.map(([sourceName, label, unit, own, supported]) => {
    const find = (value: number) => {
      const candidates = rows.filter((row) => row.indicatorId === "C-001_mitigation_target" && row.name === sourceName && row.year === 2030 && row.value === value && row.url === NDC_SOURCE_V146);
      if (candidates.length !== 1) return null;
      matched.add(candidates[0].recordId);
      return candidates[0].value;
    };
    return { label, unit, own: find(own), supported: find(supported) };
  });
  return { rows, totals: targets.slice(0, 3), sectors: targets.slice(3), unmatched: rows.filter((row) => row.indicatorId === "C-001_mitigation_target" && !matched.has(row.recordId)) };
}
