import rulesAsset from "./publicRecordRoleRulesV142.json";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { publicTextV126 } from "./publicFieldPolicyV126";

/**
 * What a delivered row is (V142).
 *
 * D-026 delivered fourteen rows marked 레코드구분=개별: nine MIGA guarantees
 * and five descriptions of the covers those guarantees combine (계약위반,
 * 비이행보증, 수용, 이전제한, 전쟁·내란). Counted alike, the screen said
 * "사업 14건". The role is read from the row's own columns under a rule
 * written per element in publicRecordRoleRulesV142.json, with the source
 * basis beside it; a numeric-looking identifier alone never decides. The
 * card builder and the analysis QA evaluate the same JSON.
 */
export type PublicRecordRoleV142 = "individual" | "aggregate" | "definition";

export interface PublicRecordRoleResultV142 {
  role: PublicRecordRoleV142;
  /** Reader-facing name of the role's rows ("보증 유형 안내"); null for individual rows. */
  label: string | null;
  reason: string;
}

interface RecordRoleRuleV142 {
  elementId: string;
  role: PublicRecordRoleV142;
  label: string;
  basis: string;
  when: {
    fieldIn?: { field: string; values: string[] };
    allEmpty?: string[];
  };
  expected?: { matches: number; sourceRows: number };
}

const RULES_V142: RecordRoleRuleV142[] = (rulesAsset as { rules: RecordRoleRuleV142[] }).rules;

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function publicRecordRoleRuleV142(elementId: string): RecordRoleRuleV142 | null {
  return RULES_V142.find((rule) => rule.elementId === elementId) || null;
}

export function publicRecordRoleV142(entity: VietnamEntityV124): PublicRecordRoleResultV142 {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  // The workbook's own marker comes first: a 집계 row is a total or an
  // explanation whatever else its columns say.
  if (publicTextV126(attributes["레코드구분"]) === "집계") {
    return { role: "aggregate", label: "집계·설명 행", reason: "레코드구분=집계" };
  }
  const rule = publicRecordRoleRuleV142(entity.elementId);
  if (rule) {
    const { fieldIn, allEmpty } = rule.when;
    const inSet = !fieldIn || fieldIn.values.includes(publicTextV126(attributes[fieldIn.field]) || "");
    const empty = !allEmpty || allEmpty.every((field) => isEmpty(attributes[field]));
    if (inSet && empty) return { role: rule.role, label: rule.label, reason: `${rule.elementId} rule: ${fieldIn ? `${fieldIn.field} ∈ {${fieldIn.values.join(", ")}}` : ""}${allEmpty ? ` · ${allEmpty.join("·")} 미기재` : ""}` };
  }
  return { role: "individual", label: null, reason: "individual record" };
}
