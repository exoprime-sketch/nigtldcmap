/**
 * V151-2: how a 63-unit indicator value becomes a 34-unit map value.
 *
 * Resolution 202/2025/QH15 merged provinces; it never split or averaged a
 * source's numbers. So a single "34 = sum of 63" rule is wrong for most
 * indicators (a facility count sums; a percentage needs area weights; a
 * percentile rank cannot be combined at all). This module is the one place
 * that decides, per variable, which combination (if any) is legitimate, and
 * computes it without ever inventing a value for a member that has no row.
 *
 * Pure data transform: no DOM, no MapLibre, safe to unit test on raw JSON.
 */
import type { VietnamSpatialValueV124 } from "../vietnam/vietnamTypesV124";
import { ADM1_34_UNITS_V151, ADM1_34_UNIT_BY_MEMBER_V151, boundaryValueNoticeV151 } from "./adminBoundaryV151";
import type { Adm1Unit34V151, BoundarySystemV151 } from "./adminBoundaryV151";
// Import is type-erased at compile time (mapBackdropV150 only takes a `import
// type` on the maplibre-gl side), so this pulls no MapLibre/DOM into Jest.
import { PROVINCE_KO_V150 } from "./mapBackdropV150";

export type BoundaryPolicyKindV151 =
  | "sum" | "area-weighted-mean" | "member-max" | "member-min" | "range-only"
  | "count-sum" | "membership-or" | "native-34" | "six-region-only" | "none";

export const BOUNDARY_POLICY_KINDS_V151: readonly BoundaryPolicyKindV151[] = [
  "sum", "area-weighted-mean", "member-max", "member-min", "range-only",
  "count-sum", "membership-or", "native-34", "six-region-only", "none",
];

export function isBoundaryPolicyKindV151(v: unknown): v is BoundaryPolicyKindV151 {
  return typeof v === "string" && (BOUNDARY_POLICY_KINDS_V151 as readonly string[]).includes(v);
}

export interface BoundaryPolicyV151 {
  schema: "boundary-policy-v151-2"; kind: BoundaryPolicyKindV151; byVariable?: Record<string, BoundaryPolicyKindV151>;
  note: string; valueSystem: "pre-2025-63" | "post-2025-34" | "gdl-six-region";
}

// Kinds that produce one combined 34-unit value; the rest keep 63 rendering.
const AGGREGATING_KINDS_V151: ReadonlySet<BoundaryPolicyKindV151> = new Set([
  "sum", "area-weighted-mean", "member-max", "member-min", "count-sum", "membership-or", "native-34",
]);
export function isAggregatingKindV151(kind: BoundaryPolicyKindV151): boolean {
  return AGGREGATING_KINDS_V151.has(kind);
}

// Scenario layers key their selector as `${measureKey}--${scenario}`; a
// byVariable policy is written against the bare measure key.
function stripScenarioSuffixV151(measureKey: string): string {
  const idx = measureKey.lastIndexOf("--");
  return idx === -1 ? measureKey : measureKey.slice(0, idx);
}

export function policyKindForVariableV151(
  policy: BoundaryPolicyV151 | null | undefined,
  measureKey: string | null | undefined
): BoundaryPolicyKindV151 {
  if (!policy) return "none";
  const key = measureKey ? stripScenarioSuffixV151(measureKey) : "";
  return policy.byVariable?.[key] ?? policy.kind ?? "none";
}

export interface AggregatedMemberV151 { adm1Code: string; adm1Name: string; value: number | null }

export interface AggregatedUnitRowV151 {
  unitCode: string; unitName: string; unitNameKo: string; kind: BoundaryPolicyKindV151;
  value: number | null; unit: string | null; memberCount: number; valueCount: number;
  min: number | null; max: number | null; partial: boolean; conflict: boolean;
  members: AggregatedMemberV151[]; sourceIndicatorId: string | null;
}

type PresentMemberV151 = AggregatedMemberV151 & { value: number };

/**
 * Combines one variable+period's 63-unit rows into 34-unit rows. `rows63`
 * must already be filtered to a single variable and period by the caller.
 * A member with no matching row is absent, never coerced to 0.
 */
export function aggregateTo34V151(
  rows63: VietnamSpatialValueV124[],
  kind: BoundaryPolicyKindV151,
  options?: { units?: readonly Adm1Unit34V151[]; areaKm2ByAdm1Code?: Record<string, number>; adm1NameByCode?: Record<string, string> }
): AggregatedUnitRowV151[] {
  if (kind === "range-only" || kind === "six-region-only" || kind === "none") return [];

  const units = options?.units ?? ADM1_34_UNITS_V151;
  const rowByAdm1Code = new Map(rows63.map((row) => [row.adm1Code, row]));
  const areaByCode = options?.areaKm2ByAdm1Code;
  const nameByCode = options?.adm1NameByCode;

  return units.map((unit) => {
    const members: AggregatedMemberV151[] = unit.memberAdm1Codes.map((code) => {
      const row = rowByAdm1Code.get(code);
      return { adm1Code: code, adm1Name: row?.adm1Name ?? nameByCode?.[code] ?? code, value: row ? row.value : null };
    });
    const present = members.filter((m): m is PresentMemberV151 => m.value !== null);
    const memberCount = unit.memberAdm1Codes.length;
    const valueCount = present.length;
    const sumPresent = () => present.reduce((s, m) => s + m.value, 0);
    const firstPresentRow =
      unit.memberAdm1Codes.map((code) => rowByAdm1Code.get(code)).find((r): r is VietnamSpatialValueV124 => !!r) ?? null;

    let value: number | null = null;
    let min: number | null = null, max: number | null = null;
    let conflict = false;
    // Default: incomplete membership is "partial". A few kinds below say
    // absence means something else (no documents / no participation / a
    // fixed post-2025 figure) rather than a gap, and clear it back to false.
    let partial = valueCount > 0 && valueCount < memberCount;
    if (valueCount > 0) {
      min = Math.min(...present.map((m) => m.value));
      max = Math.max(...present.map((m) => m.value));
    }

    switch (kind) {
      case "sum":
        value = valueCount > 0 ? sumPresent() : null;
        break;
      case "area-weighted-mean": {
        if (valueCount > 0) {
          let weightedSum = 0, weightTotal = 0;
          for (const m of present) {
            // Areas are a hard requirement here, unlike a plain sum: a
            // silently-skipped area would silently mis-weight the mean.
            const area = areaByCode?.[m.adm1Code];
            if (area === undefined || area === null) {
              throw new Error(`area-weighted-mean requires areaKm2ByAdm1Code[${m.adm1Code}] (unit ${unit.unitCode})`);
            }
            weightedSum += m.value * area;
            weightTotal += area;
          }
          value = weightTotal > 0 ? weightedSum / weightTotal : null;
        }
        break;
      }
      case "member-max": value = valueCount > 0 ? max : null; break;
      case "member-min": value = valueCount > 0 ? min : null; break;
      case "count-sum": // a missing member is "no documents", not a gap
        value = valueCount > 0 ? sumPresent() : null;
        partial = false;
        break;
      case "membership-or":
        value = valueCount === 0 ? null : present.some((m) => m.value > 0) ? 1 : 0;
        partial = false;
        break;
      case "native-34": {
        partial = false; // this kind never reads as "incomplete"; it either agrees or conflicts
        if (valueCount > 0) {
          const first = present[0].value;
          const allSame = present.every((m) => Math.abs(m.value - first) <= 1e-9);
          value = allSame ? first : null;
          conflict = !allSame;
        }
        break;
      }
      default:
        break;
    }

    return {
      unitCode: unit.unitCode, unitName: unit.name, unitNameKo: unit.nameKo, kind, value,
      unit: firstPresentRow?.unit ?? null, memberCount, valueCount, min, max, partial, conflict,
      members, sourceIndicatorId: firstPresentRow?.sourceIndicatorId ?? null,
    };
  });
}

// Compact shape for MapLibre feature properties: short keys keep tiles small.
interface CompactMemberSummaryV151 {
  u: string; n: string; k: BoundaryPolicyKindV151; v: number | null;
  c: number; m: number; mn: number | null; mx: number | null;
  p: boolean; cf: boolean; ms: Array<[string, string, number | null]>;
}

export function memberSummaryV151(row: AggregatedUnitRowV151): string {
  const compact: CompactMemberSummaryV151 = {
    u: row.unitCode, n: row.unitNameKo, k: row.kind, v: row.value,
    c: row.valueCount, m: row.memberCount, mn: row.min, mx: row.max,
    p: row.partial, cf: row.conflict,
    ms: row.members.map((mem) => [mem.adm1Code, mem.adm1Name, mem.value]),
  };
  return JSON.stringify(compact);
}

export function parseMemberSummaryV151(raw: unknown): AggregatedUnitRowV151 | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { return null; }
  }
  if (!obj || typeof obj !== "object") return null;
  const c = obj as Partial<CompactMemberSummaryV151>;
  if (typeof c.u !== "string" || !isBoundaryPolicyKindV151(c.k) || !Array.isArray(c.ms)) return null;
  const members: AggregatedMemberV151[] = c.ms.map((tuple) =>
    Array.isArray(tuple) && tuple.length >= 3
      ? { adm1Code: String(tuple[0]), adm1Name: String(tuple[1]), value: typeof tuple[2] === "number" ? tuple[2] : null }
      : { adm1Code: "", adm1Name: "", value: null }
  );
  return {
    unitCode: c.u, unitName: typeof c.n === "string" ? c.n : c.u, unitNameKo: typeof c.n === "string" ? c.n : c.u,
    kind: c.k, value: typeof c.v === "number" ? c.v : null, unit: null,
    memberCount: typeof c.m === "number" ? c.m : members.length,
    valueCount: typeof c.c === "number" ? c.c : members.filter((m) => m.value !== null).length,
    min: typeof c.mn === "number" ? c.mn : null, max: typeof c.mx === "number" ? c.mx : null,
    partial: !!c.p, conflict: !!c.cf, members, sourceIndicatorId: null,
  };
}

export function parentUnitForV151(adm1Code: string): Adm1Unit34V151 | null {
  const unitCode = ADM1_34_UNIT_BY_MEMBER_V151[adm1Code];
  return unitCode ? ADM1_34_UNITS_V151.find((u) => u.unitCode === unitCode) ?? null : null;
}

// Centrally-run cities take "시" ("-city"), provinces take "성" ("-province").
const CENTRAL_CITY_ADM1_CODES_V151: ReadonlySet<string> = new Set(["VN-HN", "VN-HP", "VN-DN", "VN-CT", "VN-SG"]);

/** "(구 ○○성)" for a folded-away pre-2025 province; "" for the successor or a single-member unit. */
export function formerProvinceLabelV151(adm1Code: string, adm1NameKo?: string): string {
  const unit = parentUnitForV151(adm1Code);
  if (!unit || unit.memberAdm1Codes.length <= 1) return "";
  if (adm1Code === unit.successorAdm1Code) return "";
  const ko = adm1NameKo ?? PROVINCE_KO_V150[adm1Code] ?? adm1Code;
  const suffix = CENTRAL_CITY_ADM1_CODES_V151.has(adm1Code) ? "시" : "성";
  return `(구 ${ko}${suffix})`;
}

/** For `range-only` popups: the 63-unit spread under each 34-unit outline. */
export function memberRangeByUnitV151(rows63: VietnamSpatialValueV124[], units: readonly Adm1Unit34V151[] = ADM1_34_UNITS_V151):
  Map<string, { min: number | null; max: number | null; valueCount: number; memberCount: number }> {
  const rowByAdm1Code = new Map(rows63.map((row) => [row.adm1Code, row]));
  const result = new Map<string, { min: number | null; max: number | null; valueCount: number; memberCount: number }>();
  for (const unit of units) {
    const values = unit.memberAdm1Codes.map((c) => rowByAdm1Code.get(c)?.value).filter((v): v is number => typeof v === "number");
    result.set(unit.unitCode, {
      min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
      valueCount: values.length, memberCount: unit.memberAdm1Codes.length,
    });
  }
  return result;
}

/** One line explaining what the on-screen 34-unit number means (or doesn't). */
export function boundaryPolicyNoticeV151(
  system: BoundarySystemV151, policy: BoundaryPolicyV151 | null | undefined, kind?: BoundaryPolicyKindV151
): string {
  if (system === "pre-2025-63") return "63개 성·시(개편 전) 기준이며 원자료 값을 그대로 표시합니다.";
  switch (kind ?? policy?.kind) {
    case "sum": return "34개 성·시 값은 구성 성·시 값의 합계입니다. 일부 성·시가 결측이면 '부분 결측'으로 표시합니다.";
    case "area-weighted-mean": return "34개 성·시 값은 구성 성·시 값의 면적가중평균이며 팝업에 구성 범위(최소~최대)를 함께 표시합니다.";
    case "member-max": return "34개 성·시 값은 구성 성·시 중 최대값입니다.";
    case "member-min": return "34개 성·시 값은 구성 성·시 중 최소값입니다.";
    case "range-only": return "분위·순위형 지표는 34개 단일값을 만들지 않습니다. 값은 개편 전 63개 기준이며 34개 단위에는 구성 범위만 표시합니다.";
    case "count-sum": return "34개 성·시 값은 구성 성·시 문서 수의 합계입니다.";
    case "membership-or": return "구성 성·시 중 하나라도 참여하면 34개 단위를 참여로 표시합니다.";
    case "native-34": return "원자료가 개편 후 34개 성·시 기준으로 발표한 값을 34개 경계에 직접 표시합니다.";
    case "six-region-only": return "GDL 6개 권역 값을 권역 경계에 표시합니다(행정경계 기준과 무관).";
    default: return boundaryValueNoticeV151(system);
  }
}
