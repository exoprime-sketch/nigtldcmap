/**
 * V162: a delivery's own field name written into a label or a record
 * ("2026-08-18 기준 businessActivity 필드 보유 건수", C-008) reads as the thing
 * the field holds. Only the names listed here are rewritten; everything else
 * is left as delivered, and the download keeps the source wording.
 */
const FIELD_NAME_KO_V162: Readonly<Record<string, string>> = {
  businessActivity: "업종",
};

export function publicFieldWordingV162(text: string): string {
  let value = String(text ?? "");
  for (const [field, ko] of Object.entries(FIELD_NAME_KO_V162)) {
    value = value.replace(new RegExp(`\\b${field}\\s*필드`, "gu"), `${ko} 항목`).replace(new RegExp(`\\b${field}\\b`, "gu"), ko);
  }
  return value;
}
