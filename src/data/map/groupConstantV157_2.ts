/**
 * V157-2: turn a per-group figure into per-province rows, for `boundaryPolicy
 * "group-constant"` (boundaryPolicyV151.ts).
 *
 * A-022 (전력공급 신뢰도) and C-017 (전기요금 상한가) state their value per group -
 * an EVN corporation's territory, a price bracket - not per province. Before
 * `aggregateTo34V151` can run its usual 63→34 combination, that group value has to
 * become one row per member province, unchanged, so the existing renderer pipeline
 * (which reads VietnamSpatialValueV124 rows) needs no new code path. This is that one
 * step: given a province→group table (evn-jurisdiction.json, c017-price-regions.json)
 * and a value per group, it produces the rows - and nothing else. A province whose
 * group has no stated value gets no row; it is never filled with a neighbour's number.
 *
 * Pure data transform: no DOM, no MapLibre, safe to unit test on raw JSON.
 */
import type { VietnamSpatialValueV124 } from "../vietnam/vietnamTypesV124";

export interface ProvinceGroupMembershipV157_2 {
  adm1Code: string;
  adm1Name: string;
  group: string;
}

export interface GroupValueV157_2 {
  group: string;
  value: number;
  unit: string;
  sourceIndicatorId: string;
}

/**
 * One VietnamSpatialValueV124 row per province whose group has a stated value.
 * `variable`/`variableLabel`/`period` are shared across the whole broadcast, matching
 * how a single indicator@period slice is built elsewhere in the map pipeline.
 */
export function broadcastGroupValuesV157_2(
  membership: readonly ProvinceGroupMembershipV157_2[],
  valuesByGroup: ReadonlyMap<string, GroupValueV157_2>,
  meta: { variable: string; variableLabel: string; period: string }
): VietnamSpatialValueV124[] {
  const rows: VietnamSpatialValueV124[] = [];
  for (const province of membership) {
    const groupValue = valuesByGroup.get(province.group);
    if (!groupValue) continue; // no value for this group: no row, not a zero
    rows.push({
      adm1Code: province.adm1Code,
      adm1Name: province.adm1Name,
      variable: meta.variable,
      variableLabel: meta.variableLabel,
      period: meta.period,
      value: groupValue.value,
      unit: groupValue.unit,
      sourceIndicatorId: groupValue.sourceIndicatorId,
      sourceRecordId: null,
      sourceSpatialUnit: "admin1",
      imputed: false,
    });
  }
  return rows;
}

/** Every group a value is missing for, given the memberships it would otherwise cover. */
export function groupsWithoutValueV157_2(
  membership: readonly ProvinceGroupMembershipV157_2[],
  valuesByGroup: ReadonlyMap<string, GroupValueV157_2>
): string[] {
  const groups = new Set(membership.map((row) => row.group));
  return [...groups].filter((group) => !valuesByGroup.has(group)).sort();
}
