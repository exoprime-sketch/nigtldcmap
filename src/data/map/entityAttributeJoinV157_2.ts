/**
 * V157-2: attach a national figure to the map points that share its ore type.
 *
 * B-044/B-046/B-047 ("핵심광물 부존"/"니켈·리튬 확인 매장량"/"라오까이 구리 생산량")
 * carry a national total; they were the three of P8-2's twelve targets the plan
 * (reports/v157-2/REVIEW_V157-2.md §4) puts on the map without a layer of their own -
 * their value is attached to B-048's existing mine points where the ore type matches,
 * and shown as "국가 전체" (the national figure), never split across mines.
 *
 * Matching is exact equality against the mine's own `광종` attribute, never a
 * substring: B-048's Núi Pháo entry reads "텅스텐(+형석·비스무트·구리)" - it names
 * copper as a byproduct, and a substring match would wrongly attach B-047's Lào Cai
 * copper figure to a tungsten mine two provinces away. A target names the exact ore
 * labels it accepts; a mine matches only when its own label is one of them.
 *
 * Pure data transform: no DOM, no MapLibre, safe to unit test on plain fixtures.
 */

/** The shape B-048's published entities already carry (normalizedAttributes.광종). */
export interface MinePointV157_2 {
  recordId: string;
  name: string;
  normalizedAttributes: Record<string, unknown>;
}

/** One target's national figure and the ore labels it attaches to. */
export interface NationalMineAttributeV157_2 {
  elementId: string;
  label: string;
  value: number;
  unit: string;
  period: string;
  source: string;
  /** Exact 광종 values this figure applies to (B-047: ["구리"], B-046: ["니켈", "리튬"]). */
  oreTypes: readonly string[];
}

export interface AttachedAttributeV157_2 {
  elementId: string;
  label: string;
  value: number;
  unit: string;
  period: string;
  source: string;
  scope: "국가 전체";
}

export interface MineJoinRowV157_2 {
  recordId: string;
  name: string;
  oreType: string | null;
  attached: AttachedAttributeV157_2[];
}

/** The mine's own 광종 value, or null when the record does not state one. */
function oreTypeOfV157_2(mine: MinePointV157_2): string | null {
  const value = mine.normalizedAttributes?.["광종"];
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

/**
 * Joins every national attribute to every mine whose own 광종 exactly matches one of
 * the attribute's declared ore labels. A mine with no match carries an empty
 * `attached` list - it is never given a value because a nearby target exists.
 */
export function joinNationalMineAttributesV157_2(
  mines: readonly MinePointV157_2[],
  attributes: readonly NationalMineAttributeV157_2[]
): MineJoinRowV157_2[] {
  return mines.map((mine) => {
    const oreType = oreTypeOfV157_2(mine);
    const attached: AttachedAttributeV157_2[] = oreType
      ? attributes
          .filter((attribute) => attribute.oreTypes.includes(oreType))
          .map((attribute) => ({
            elementId: attribute.elementId,
            label: attribute.label,
            value: attribute.value,
            unit: attribute.unit,
            period: attribute.period,
            source: attribute.source,
            scope: "국가 전체",
          }))
      : [];
    return { recordId: mine.recordId, name: mine.name, oreType, attached };
  });
}

/** The public line for an attached attribute: value first, then that it is national. */
export function nationalMineAttributeLineV157_2(attribute: AttachedAttributeV157_2): string {
  return `${attribute.label} ${attribute.value.toLocaleString("ko-KR")} ${attribute.unit}(${attribute.period}) — ${attribute.scope} 값입니다.`;
}
