/**
 * V153-D3: platform-edited descriptions of the laws (C-009, C-010) and the
 * international initiatives (C-008) the deliveries name.
 *
 * The C template's 속성23_설명 holds attribute labels ("시행(발효)일"), not a
 * description, so a reader saw a document's number and its dates and never
 * what it does. Each entry here was written from an official source that is
 * linked beside it, and the screen labels it as the platform's own text so
 * it is never mistaken for the delivery. Keys are stable codes: a law by its
 * number ("06-2022-nd-cp"), an initiative by its short name ("jetp").
 */
import descriptionsJson from "./policyDescriptionsV153.json";

export type PolicyDescriptionKindV153 = "document" | "initiative" | "treaty";

export interface PolicyDescriptionV153 {
  key: string;
  kind: PolicyDescriptionKindV153;
  elementIds: string[];
  /** Names the deliveries use for it, matched exactly. */
  names: string[];
  /** A short descriptive title in Korean: what the document or initiative is. */
  title: string;
  formalName: string;
  shortName: string | null;
  issuer: string | null;
  effectiveDate: string | null;
  /** 개조식 statements, each from the linked sources. Empty while pending. */
  description: string[];
  sourceUrl: string[];
  sourceType: string;
  checkedAt: string;
  status: "verified" | "pending";
}

export const POLICY_DESCRIPTIONS_V153: readonly PolicyDescriptionV153[] = (descriptionsJson as { entries: PolicyDescriptionV153[] }).entries;

/** "Decision 942/QĐ-TTg", "942/QD-TTg", "QCVN 05:2023/BTNMT" → a stable code. */
export function documentCodeV153(value: string): string {
  const ascii = String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/Đ/gu, "D")
    .replace(/đ/gu, "d")
    .toLowerCase();
  const qcvn = ascii.match(/qcvn\s*(\d+)\s*:\s*(\d{4})\s*\/\s*([a-z]+)/u);
  if (qcvn) return `qcvn-${qcvn[1].padStart(2, "0")}-${qcvn[2]}-${qcvn[3]}`;
  const code = ascii.match(/(\d+)\/(?:(\d{4})\/)?([a-z]+(?:-[a-z]+)*)/u);
  if (!code) return "";
  return [code[1].padStart(2, "0"), code[2], code[3]].filter(Boolean).join("-");
}

const byName = new Map<string, PolicyDescriptionV153>();
const byKey = new Map<string, PolicyDescriptionV153>();
POLICY_DESCRIPTIONS_V153.forEach((entry) => {
  byKey.set(entry.key, entry);
  entry.names.forEach((name) => byName.set(name.trim(), entry));
});

/**
 * The description for a timeline entry of C-009/C-010, by the exact name the
 * delivery gives the document. Rows that restate a document inside a longer
 * label ("Luật 146/2025/QH15의 환경보호법 개정 범위") are attribute rows and
 * get nothing, so a description is shown once.
 */
export function policyDocumentDescriptionV153(elementId: string, name: string): PolicyDescriptionV153 | null {
  const entry = byName.get(String(name || "").trim());
  if (!entry || entry.kind !== "document" || !entry.elementIds.includes(elementId)) return null;
  return entry;
}

/** The description for a C-008 initiative subject (the part before " — "). */
export function initiativeDescriptionV153(subject: string): PolicyDescriptionV153 | null {
  const entry = byName.get(String(subject || "").trim());
  if (!entry || entry.kind === "document") return null;
  return entry;
}

export function policyDescriptionByKeyV153(key: string): PolicyDescriptionV153 | null {
  return byKey.get(key) || null;
}

export function policyDescriptionsForElementV153(elementId: string): PolicyDescriptionV153[] {
  return POLICY_DESCRIPTIONS_V153.filter((entry) => entry.elementIds.includes(elementId));
}
