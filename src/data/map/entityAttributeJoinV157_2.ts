/**
 * V157-2: attach a national figure to the map points that share its ore type.
 *
 * B-044/B-046/B-047 ("핵심광물 부존"/"광물 매장량"/"광물 생산량") carry national
 * totals only. Their map layer is B-048's mine points (the host), narrowed to the
 * mines whose ore type matches, each carrying the national figure as "국가 전체" -
 * never split across mines.
 *
 * Matching is by the mine's own `광종` entries, never by substring. A mine lists its
 * commodities separated by " / " ("구리 / 니켈 / 코발트", USGS MRDS order); each entry
 * is compared whole. A byproduct written in parentheses inside one entry
 * ("텅스텐(+형석·비스무트·구리)") stays part of that entry, so it never matches
 * copper - a substring match would wrongly attach B-047's copper figure to a
 * tungsten mine. A target names the exact entries it accepts (oreTypes), taken from
 * the stated crosswalk tools/etl/countries/vnm/map12/mineral-crosswalk-v162.json.
 *
 * Pure data transform: no DOM, no MapLibre, safe to unit test on plain fixtures.
 * scripts/v157-2/map12-builders-v157-2.mjs applies the same rule at build time to
 * count the layer's features; the unit test keeps the two equal.
 */

/** The shape B-048's published entities already carry (normalizedAttributes.광종). */
export interface MinePointV157_2 {
  recordId: string;
  name?: string | null;
  normalizedAttributes: Record<string, unknown>;
}

/** One target's national figure for one mineral and the ore entries it attaches to. */
export interface NationalMineAttributeV157_2 {
  elementId: string;
  /** Public mineral name ("구리"). */
  mineral: string;
  /** What the figure is ("매장량", "광산 생산량", "부존 상태"). */
  label: string;
  /** The figure as printed, with its unit ("54,000 t (Sb 함량)"). */
  valueText: string;
  period: string;
  source: string;
  /** Exact 광종 entries this figure applies to (B-047 copper: ["구리"]). */
  oreTypes: readonly string[];
}

export interface AttachedAttributeV157_2 extends Omit<NationalMineAttributeV157_2, "oreTypes"> {
  scope: "국가 전체";
}

export interface MineJoinRowV157_2 {
  recordId: string;
  name: string;
  oreEntries: string[];
  attached: AttachedAttributeV157_2[];
}

/** The layer's join declaration (map-index layer field `entityJoinV157_2`). */
export interface MineJoinDeclarationV157_2 {
  hostElementId: string;
  /** The layer's own element; joined records are filed under it (detail link, panel). */
  elementId?: string;
  attributes: NationalMineAttributeV157_2[];
}

/** The attribute key the joined line is stored under on a host record. */
export const NATIONAL_VALUE_KEY_V157_2 = "국가_전체_값";

/** The mine's own 광종 entries; a " / " list is several, a parenthesis stays inside its entry. */
export function oreEntriesV157_2(value: unknown): string[] {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return [];
  return text
    .split(/\s+\/\s+/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Joins every national attribute to every mine one of whose own 광종 entries is
 * one of the attribute's declared ore labels. A mine with no match carries an empty
 * `attached` list - it is never given a value because a nearby target exists.
 */
export function joinNationalMineAttributesV157_2(
  mines: readonly MinePointV157_2[],
  attributes: readonly NationalMineAttributeV157_2[]
): MineJoinRowV157_2[] {
  return mines.map((mine) => {
    const oreEntries = oreEntriesV157_2(mine.normalizedAttributes?.["광종"]);
    const attached: AttachedAttributeV157_2[] = attributes
      .filter((attribute) => oreEntries.some((entry) => attribute.oreTypes.includes(entry)))
      .map(({ oreTypes: _oreTypes, ...attribute }) => ({ ...attribute, scope: "국가 전체" as const }));
    return { recordId: mine.recordId, name: mine.name ?? "", oreEntries, attached };
  });
}

/** The public line for an attached attribute: mineral, figure, period, then that it is national. */
export function nationalMineAttributeLineV157_2(attribute: AttachedAttributeV157_2): string {
  const period = attribute.period ? `(${attribute.period})` : "";
  return `${attribute.mineral} ${attribute.label} ${attribute.valueText}${period} — ${attribute.scope} 값`;
}

/**
 * The host's records narrowed to the joined mines, each carrying its national
 * lines under NATIONAL_VALUE_KEY_V157_2. Records are copied, never mutated: the
 * host's own layer reads the same cached array.
 */
export function applyNationalMineJoinV157_2<T extends MinePointV157_2>(
  records: readonly T[],
  join: MineJoinDeclarationV157_2
): T[] {
  const rows = joinNationalMineAttributesV157_2(records, join.attributes);
  const out: T[] = [];
  records.forEach((record, index) => {
    const attached = rows[index].attached;
    if (!attached.length) return;
    out.push({
      ...record,
      ...(join.elementId ? { elementId: join.elementId } : {}),
      normalizedAttributes: {
        ...record.normalizedAttributes,
        [NATIONAL_VALUE_KEY_V157_2]: attached.map(nationalMineAttributeLineV157_2).join(" · "),
      },
    });
  });
  return out;
}
