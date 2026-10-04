/**
 * V161-C: what the panel says about the thing a reader just clicked.
 *
 * The panel used to answer with the layer's metadata - `항목 / 값 / 단위 / 자료연도 /
 * 출처 / 지도 표시` - which never says what was clicked or what it is. The order
 * here is the reader's: **the name of the thing, then its own values, then where it
 * sits in the whole, then what to do next.** The layer's metadata is one line at the
 * bottom.
 *
 * Rules this model keeps, because they are data rules rather than layout:
 *   - a line with no value is dropped, never filled with 0 or "미상";
 *   - a rank is only computed inside the same layer, the same variable and the
 *     same period, and only when the compared values are the same unit;
 *   - a cluster's count is the cluster's own `point_count`, not a re-count;
 *   - a region name is formatted by `formatRegionName` (V161-A) and a list value
 *     ("Thanh Hóa · Nghệ An") is split and formatted one name at a time;
 *   - no raw key, internal code or personal contact detail reaches a line.
 */
import { severityLabelV157 } from "../../map/layers/unitFeaturesV157";
import { formatRegionName } from "../geo/regionNameV161";
import type { RegionLevelV161 } from "../geo/regionNameV161";

export type MapSelectionKindV161 =
  | "facility"
  | "cluster"
  | "region"
  | "unit"
  | "line"
  | "asset-feature"
  | "project-scope";

export interface MapSelectionLineV161 {
  label: string;
  value: string;
  /** A caveat that belongs to this line, such as a representative point. */
  note?: string;
}

export interface MapSelectionMemberV161 {
  name: string;
  kind?: string;
  size?: string;
  recordId?: string;
}

export interface MapSelectionActionV161 {
  key: "zoom" | "detail" | "expand" | "source";
  label: string;
  href?: string;
}

export interface MapSelectionCardV161 {
  kind: MapSelectionKindV161;
  /** The name of the thing that was clicked. */
  title: string;
  /** What kind of thing it is, when the name alone does not say. */
  subtitle?: string;
  lines: MapSelectionLineV161[];
  /** Where it sits in the whole: rank, share, distribution. */
  comparison: MapSelectionLineV161[];
  actions: MapSelectionActionV161[];
  /** One line: reference year · source · how it is drawn. */
  meta: string;
  /** A cluster's members, or an area's records. */
  members?: MapSelectionMemberV161[];
  /** The count a cluster reported, kept for the QA to compare. */
  memberCount?: number;
}

/** Values that mean "the source did not say", which must not become a line. */
function hasValueV161(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (!text) return false;
  return !/^(미상|미기재|미표기|알 수 없음|unknown|n\/?a|null|undefined|없음)$/iu.test(text);
}

/** A line, or nothing at all when the source has no value for it. */
export function selectionLineV161(
  label: string,
  value: unknown,
  note?: string
): MapSelectionLineV161[] {
  if (!hasValueV161(value)) return [];
  return [{ label, value: String(value).trim(), ...(note ? { note } : {}) }];
}

/**
 * Region names as the platform writes them: "한글명 (현지명)".
 *
 * A delivery may put several regions in one value ("Thanh Hóa · Nghệ An"), so the
 * value is split on the separators the deliveries use and each name is formatted on
 * its own - `formatRegionName` takes one name, and handing it a list would leave
 * the list unformatted.
 */
export function formatRegionListV161(
  value: unknown,
  options: { country?: string; level?: RegionLevelV161 } = {}
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parts = raw
    .split(/\s*[·,;/]\s*|\s+·\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const formatted = parts.map((part) =>
    formatRegionName({
      country: options.country ?? "VNM",
      raw: part,
      ...(options.level ? { level: options.level } : {}),
    })
  );
  return formatted.join(" · ");
}

export interface RankInputV161 {
  /** The clicked feature's value. */
  value: number | null | undefined;
  /** Every value drawn for the same layer, variable and period. */
  peers: number[];
  unit?: string | null;
  /** What the peers are ("34개 성·시", "전압 등급"). */
  peerLabel: string;
  /**
   * V164-4: false for a count of records per region (the D-group "지역이
   * 확인된 사업 수"): an average over only the regions that have a record,
   * "−0.75 건 (평균 2.75 건)", says nothing about a region. The rank stays.
   */
  withAverage?: boolean;
}

/**
 * Where a value sits among its peers: "34개 중 3위" plus the peer average.
 *
 * Returns nothing when the value is missing or there is nothing to compare with,
 * so the panel shows no rank rather than a rank of one.
 */
export function rankLinesV161({ value, peers, unit, peerLabel, withAverage = true }: RankInputV161): MapSelectionLineV161[] {
  if (typeof value !== "number" || !Number.isFinite(value)) return [];
  const usable = peers.filter((peer) => typeof peer === "number" && Number.isFinite(peer));
  if (usable.length < 2) return [];
  const sorted = [...usable].sort((left, right) => right - left);
  const rank = sorted.findIndex((peer) => peer <= value) + 1;
  const average = usable.reduce((sum, peer) => sum + peer, 0) / usable.length;
  const unitSuffix = unit ? ` ${unit}` : "";
  const lines: MapSelectionLineV161[] = [
    { label: `${peerLabel} 중 순위`, value: `${rank}위 / ${usable.length}개` },
  ];
  if (!withAverage) return lines;
  const difference = value - average;
  lines.push({
    label: `${peerLabel} 평균 대비`,
    value: `${difference >= 0 ? "+" : "−"}${Math.abs(difference).toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
    })}${unitSuffix} (평균 ${average.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${unitSuffix})`,
  });
  return lines;
}

/** How many of the peers share the clicked feature's category, as a share. */
export function categoryShareLinesV161(
  categoryLabel: string,
  categoryCounts: Record<string, number>,
  peerLabel: string
): MapSelectionLineV161[] {
  if (!categoryLabel) return [];
  const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const own = categoryCounts[categoryLabel] ?? 0;
  if (total === 0 || own === 0) return [];
  const share = Math.round((own / total) * 1000) / 10;
  // V164: the band reads as the legend and the 분류 row do ("높음 (3-4)", not
  // the source's "High (3-4)"); the counts are keyed by the source label.
  return [
    {
      label: `같은 분류 비중`,
      value: `${severityLabelV157(categoryLabel).text} ${own.toLocaleString()}개 / ${peerLabel} ${total.toLocaleString()}개 (${share}%)`,
    },
  ];
}

/** The one meta line: reference year, source, and how the layer is drawn. */
export function metaLineV161({
  period,
  source,
  drawing,
}: {
  period?: unknown;
  source?: unknown;
  drawing?: unknown;
}): string {
  return [
    hasValueV161(period) ? `자료연도 ${String(period).trim()}` : "",
    hasValueV161(source) ? String(source).trim() : "",
    hasValueV161(drawing) ? String(drawing).trim() : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** How a renderer draws, in the reader's words, for the meta line. */
export const DRAWING_LABEL_V161: Record<string, string> = {
  point: "지점 표시",
  cluster: "지점 묶음 표시",
  line: "선 표시",
  "admin1-choropleth": "성·시 색 표시",
  "partial-choropleth": "성·시 색 표시(일부 지역)",
  "regional-scope": "사업 범위 표시",
  "unit-choropleth": "평가구역 색 표시",
  "point-and-polygon": "시설 지점·구역 표시",
};

/**
 * `DRAWING_LABEL_V161` for the reader's own level-1 word: the default
 * country keeps "성·시 색 표시"; another country's choropleth says its own
 * word ("Division 색 표시") instead of the Vietnamese one.
 */
export function drawingLabelV161(
  renderer: string | undefined,
  regionWord = "성·시"
): string {
  if (renderer === "admin1-choropleth") return `${regionWord} 색 표시`;
  if (renderer === "partial-choropleth") return `${regionWord} 색 표시(일부 지역)`;
  return DRAWING_LABEL_V161[renderer || ""] || "";
}
