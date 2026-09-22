import type { VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";

/**
 * V153: B-046 (reserves) and B-047 (mine production) read by mineral.
 *
 * The workbook names the mineral only in the indicator label ("확인 매장량 —
 * 희토류"), and the ETL now copies it onto each observation as `name`. The
 * world rank and share USGS states are quoted from the row's note as text;
 * nothing is computed from them beyond reading the number that is there.
 * Units differ per mineral (t REO, t (W 함량), 천 t …), so the only comparable
 * bar is the world share; values are printed beside it in their own unit.
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

export function mineralModelV153(
  observations: VietnamObservationV124[],
  indicators: VietnamIndicatorMetaV124[]
): MineralModelV153 {
  const byId = new Map(indicators.map((row) => [row.indicatorId, row]));
  const rows = new Map<string, MineralRowV153>();
  const notes: { label: string; text: string }[] = [];
  const years = new Set<number>();
  for (const record of observations) {
    const indicator = byId.get(record.indicatorId);
    const label = indicator?.labelKo || record.indicatorId;
    const { measure, mineral } = splitLabel(label);
    const named = (record as { name?: string | null }).name || mineral;
    if (!named) {
      // A text-only indicator (e.g. the REE production footnote) is a note.
      notes.push({ label, text: String(record.value ?? record.note ?? "") });
      continue;
    }
    const note = record.note || null;
    const numeric = typeof record.value === "number" ? record.value : null;
    const row = rows.get(record.indicatorId) || {
      indicatorId: record.indicatorId,
      mineral: named,
      measureLabel: (record as { measureLabel?: string }).measureLabel || measure,
      unit: record.unit || indicator?.unit || "",
      values: [],
      latest: null,
      worldRank: null,
      worldRankNote: null,
      worldSharePercent: null,
      worldShareText: null,
      remark: null,
      missingNote: null,
    };
    const entry: MineralYearValueV153 = { year: record.year ?? null, value: numeric, estimated: /추정/u.test(note || ""), note };
    row.values.push(entry);
    if (record.year !== null && record.year !== undefined) years.add(record.year);
    const rank = note?.match(RANK_PATTERN);
    if (rank && row.worldRank === null) {
      row.worldRank = Number(rank[1]);
      row.worldRankNote = rank[2].trim() || null;
    }
    const share = note?.match(SHARE_PATTERN);
    if (share && row.worldSharePercent === null) {
      row.worldSharePercent = Number(share[1]);
      row.worldShareText = `${share[1]}%${share[2] ? share[2] : ""}`;
    }
    if (note && row.remark === null) row.remark = remarkOf(note);
    if (numeric === null && record.missingReasonCode) row.missingNote = note;
    rows.set(record.indicatorId, row);
  }
  const all = [...rows.values()].map((row) => {
    row.values.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    row.latest = [...row.values].reverse().find((entry) => entry.value !== null) || null;
    return row;
  });
  const reported = all.filter((row) => row.latest !== null);
  const missing = all.filter((row) => row.latest === null);
  const measureLabel = reported[0]?.measureLabel || all[0]?.measureLabel || "";
  return { measureLabel, reported, missing, notes, years: [...years].sort() };
}

export function percentChangeV153(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}
