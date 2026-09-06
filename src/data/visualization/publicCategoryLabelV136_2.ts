/**
 * Telling a classification code apart from a name a reader can use.
 *
 * This lives on its own, and imports nothing, because two very different
 * places need it: the copy registry that builds KPI support lines, and the
 * entity title policy, which the V131 naming gate compiles and executes by
 * itself over all 152 elements. Keeping the rule in one dependency-free module
 * means neither copy can drift from the other.
 */

/**
 * True when the value is a number, or a separator-joined run of numbers.
 *
 * Category codes reach the renderer either one per dimension or already joined
 * into a single value, and both forms read the same to a person: a sequence of
 * bare integers standing where a name should be.
 */
export function isNumericCodeListV136_2(value: string): boolean {
  const parts = String(value ?? "")
    .split(/[·,/|;、]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => /^-?\d+(?:\.\d+)?$/u.test(part));
}

/**
 * A category label with the classification code in front of it removed.
 *
 * The investment portfolio's composition chart read "23110 — 에너지 기타",
 * "15110 — 공공행정 기타": the DAC sector code carried in front of the name it
 * already maps to. The name is the part a reader uses, and the code ahead of it
 * is the same internal value the KPI support line was cut for. Where the code
 * is all there is, there is nothing to fall back to, so the value is left as it
 * stands rather than reduced to nothing.
 */
export function publicCategoryLabelV136_2(value: string): string {
  const text = String(value ?? "").trim();
  const match = text.match(/^\d{2,}\s*[—–-]\s*(.+)$/u);
  if (!match) return text;
  const label = match[1].trim();
  if (!label || isNumericCodeListV136_2(label)) return text;
  return label;
}
