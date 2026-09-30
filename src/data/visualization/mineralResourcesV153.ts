import type { VietnamEntityV124, VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";

/**
 * V153: B-046 (reserves) and B-047 (mine production) read by mineral.
 *
 * The workbook names the mineral only in the indicator label ("확인 매장량 —
 * 희토류"). The world rank and share USGS states are quoted from the row's
 * note as text; nothing is computed from them beyond reading the number that
 * is there. Units differ per mineral (t REO, t (W 함량), 천 t …), so the only
 * comparable bar is the world share; values are printed beside it in their
 * own unit.
 *
 * The 2026-09-30 delivery replaced the per-mineral `observations` array with
 * an `entities` array (one "entity(레코드형)" row per country×mineral×year,
 * `normalizedAttributes["원_지표_ID"]` carrying the real per-mineral indicator
 * id — the entity's own top-level `indicatorId` is a generic container id
 * shared by every row of the element). It also stopped listing the minerals
 * USGS never reports for Vietnam as regular rows with a null value; those
 * are declared only on the `indicators` metadata (`missingReasonCode` +
 * `missingNote`), and some of them (코발트/리튬/니켈/망간 for VNM) now carry a
 * same-named estimate row from a different source (a local field survey or a
 * "gap-fill" note) that must not be read as if it were the reviewed USGS
 * figure. So "reported" vs "missing" is decided from the indicator list, not
 * from whether a same-named entity happens to exist: an indicator with
 * `missingReasonCode` is always missing, one without is always reported
 * (its value prints as 미기재 in the rare case no entity backs it either).
 *
 * Each mineral's entities also now span the full multi-year/multi-edition
 * history the source republishes every year (e.g. reserves 2020–2026,
 * production 2018–2025), not just the one or two years this comparison was
 * reviewed against; only the two most recent years present are kept, and
 * rank/share/remark are read from the most recent year whose note actually
 * states them (an estimate year can be a bare "USGS 추정(e)" tag with no
 * rank restated).
 */
export interface MineralYearValueV153 {
  year: number | null;
  value: number | null;
  estimated: boolean;
  note: string | null;
}

export interface MineralRowV153 {
  indicatorId: string;
  mineral: string;
  measureLabel: string;
  unit: string;
  values: MineralYearValueV153[];
  latest: MineralYearValueV153 | null;
  worldRank: number | null;
  worldRankNote: string | null;
  worldSharePercent: number | null;
  /** The share as the source wrote it, qualifiers included ("2.70% 이하"). */
  worldShareText: string | null;
  /** The note with the estimate tag, rank and share removed. */
  remark: string | null;
  missingNote: string | null;
}

export interface MineralModelV153 {
  measureLabel: string;
  reported: MineralRowV153[];
  missing: MineralRowV153[];
  notes: { label: string; text: string }[];
  years: number[];
}

const RANK_PATTERN = /세계\s*(\d+)\s*위([^·]*)/u;
const SHARE_PATTERN = /세계\s*비중\s*([\d.]+)\s*%(\s*(?:이하|이상|미만|초과))?/u;

function splitLabel(label: string): { measure: string; mineral: string | null } {
  const index = label.lastIndexOf(" — ");
  if (index < 0) return { measure: label.trim(), mineral: null };
  return { measure: label.slice(0, index).trim(), mineral: label.slice(index + 3).trim() };
}

/** What the note says beyond the estimate tag, the rank and the share. */
export function remarkOf(note: string): string | null {
  const out = note
    .replace(/^\[[^\]]*\]\s*/u, "")
    .replace(/(?:매장|생산)\s*세계\s*\d+\s*위[^·—(]*/u, "")
    .replace(/세계\s*비중\s*[\d.]+\s*%(?:\s*(?:이하|이상|미만|초과))?\.?/u, "")
    .replace(/USGS 추정\(e\)/u, "")
    .replace(/\s*[·—]\s*(?=[·—]|$)/gu, "")
    .replace(/\s*[·—]\s*\(/gu, " (")
    .replace(/^[\s·—.]+|[\s·—.]+$/gu, "")
    .trim();
  return out || null;
}

interface ParsedMineralRecordV153 {
  indicatorId: string;
  value: number | null;
  year: number | null;
  unit: string | null;
  note: string | null;
}

/**
 * Reads either shape: the legacy per-mineral observation (`indicatorId` at
 * the top level) or the delivered "entity(레코드형)" row, whose real
 * per-mineral indicator id sits in `normalizedAttributes["원_지표_ID"]` (the
 * entity's own top-level `indicatorId` is a generic container shared by the
 * whole element and is never the mineral's own id).
 */
function parseMineralRecordV153(record: VietnamObservationV124 | VietnamEntityV124): ParsedMineralRecordV153 | null {
  const attrs = (record as VietnamEntityV124).normalizedAttributes as Record<string, unknown> | undefined;
  if (attrs) {
    const rawId = attrs["원_지표_ID"];
    const indicatorId = typeof rawId === "string" ? rawId : (record as VietnamEntityV124).indicatorId || null;
    if (!indicatorId) return null;
    const rawValue = attrs["값"];
    const rawYear = attrs["연도"];
    const rawUnit = attrs["단위"];
    return {
      indicatorId,
      value: typeof rawValue === "number" ? rawValue : null,
      year: typeof rawYear === "number" ? rawYear : null,
      unit: typeof rawUnit === "string" ? rawUnit : null,
      note: record.note ?? null,
    };
  }
  const observation = record as VietnamObservationV124;
  if (!observation.indicatorId) return null;
  return {
    indicatorId: observation.indicatorId,
    value: typeof observation.value === "number" ? observation.value : null,
    year: observation.year ?? null,
    unit: observation.unit ?? null,
    note: observation.note ?? null,
  };
}

export function mineralModelV153(
  records: (VietnamObservationV124 | VietnamEntityV124)[],
  indicators: VietnamIndicatorMetaV124[]
): MineralModelV153 {
  const rows = new Map<string, MineralRowV153>();
  const missingIndicators = new Map<string, VietnamIndicatorMetaV124>();
  const notes: { label: string; text: string }[] = [];
  const years = new Set<number>();
  let measureLabel = "";

  for (const indicator of indicators) {
    const { measure, mineral } = splitLabel(indicator.labelKo);
    if (!mineral) {
      // A text-only indicator (e.g. the REE production footnote) is a note;
      // the generic per-element record container (no mineral, numeric type)
      // is neither a mineral row nor a note and is skipped.
      if (indicator.dataType === "text") notes.push({ label: indicator.labelKo, text: indicator.caveat || indicator.missingNote || "" });
      continue;
    }
    if (!measureLabel) measureLabel = measure;
    if (indicator.missingReasonCode) {
      // USGS states this mineral is not reported for Vietnam. Some of these
      // also carry a same-named entity from a different source (a local
      // field survey range, a "gap-fill" note) — that is a different measure
      // and is never read into this row, so it stays missing regardless.
      missingIndicators.set(indicator.indicatorId, indicator);
      continue;
    }
    rows.set(indicator.indicatorId, {
      indicatorId: indicator.indicatorId,
      mineral,
      measureLabel: measure,
      unit: indicator.unit || "",
      values: [],
      latest: null,
      worldRank: null,
      worldRankNote: null,
      worldSharePercent: null,
      worldShareText: null,
      remark: null,
      missingNote: null,
    });
  }

  for (const record of records) {
    const parsed = parseMineralRecordV153(record);
    if (!parsed) continue;
    const row = rows.get(parsed.indicatorId);
    if (!row) continue; // a missing mineral's other-source estimate, or a mineral outside this element's reviewed list
    row.values.push({ year: parsed.year, value: parsed.value, estimated: /추정/u.test(parsed.note || ""), note: parsed.note });
    if (parsed.year !== null) years.add(parsed.year);
  }

  const sortedYears = [...years].sort((a, b) => a - b);
  const recentYears = new Set(sortedYears.slice(-2));

  const reported = [...rows.values()].map((row) => {
    // The delivery carries a full multi-year/multi-edition history; this
    // comparison keeps only the most recent two years actually present.
    row.values = row.values.filter((entry) => entry.year === null || recentYears.has(entry.year));
    row.values.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    row.latest = [...row.values].reverse().find((entry) => entry.value !== null) || null;
    // Rank/share/remark: the most recent year whose note actually states
    // them (an estimate year can be a bare "USGS 추정(e)" tag with no rank).
    for (const entry of [...row.values].reverse()) {
      if (!entry.note) continue;
      if (row.remark === null) row.remark = remarkOf(entry.note);
      const rank = row.worldRank === null ? entry.note.match(RANK_PATTERN) : null;
      if (rank) {
        row.worldRank = Number(rank[1]);
        row.worldRankNote = rank[2].trim() || null;
      }
      const share = row.worldSharePercent === null ? entry.note.match(SHARE_PATTERN) : null;
      if (share) {
        row.worldSharePercent = Number(share[1]);
        row.worldShareText = `${share[1]}%${share[2] ? share[2] : ""}`;
      }
    }
    return row;
  });

  const missing = [...missingIndicators.values()].map((indicator) => {
    const { mineral } = splitLabel(indicator.labelKo);
    return {
      indicatorId: indicator.indicatorId,
      mineral: mineral || indicator.labelKo,
      measureLabel: measureLabel || indicator.unit || "",
      unit: indicator.unit || "",
      values: [],
      latest: null,
      worldRank: null,
      worldRankNote: null,
      worldSharePercent: null,
      worldShareText: null,
      remark: null,
      missingNote: indicator.missingNote || null,
    } as MineralRowV153;
  });

  return { measureLabel, reported, missing, notes, years: [...recentYears].sort((a, b) => a - b) };
}

export function percentChangeV153(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}
