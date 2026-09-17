/** Quality-control fields stay in source assets, not in map fact lists. */
export function isPublicMapFactV143(label: string): boolean {
  return !/위치\s*정밀도|공간\s*정확도|지도\s*표시\s*범위|값\s*제공\s*여부|정확도\s*한계|좌표\s*정밀도/u.test(label);
}

/** Keep the reviewed E-018 meaning used by publicFieldPolicyV126 on the map too. */
export function publicMapFactSourcesV143<T extends { key: string; sources: string[] }>(elementId: string, fact: T): T {
  if (elementId !== "E-018") return fact;
  const reviewed: Record<string, string> = {
    sector: "field_a2123512", // businessSector in the detail field policy
    entryForm: "field_aea118f0", // entryMode
    establishedYear: "field_8440b85d", // entryTiming, kept as text
  };
  return reviewed[fact.key] ? { ...fact, sources: [reviewed[fact.key]] } : fact;
}

/** Suppress empty boilerplate, never a real zero or a stated non-installation. */
export function hasPublicMapFactValueV143(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== "string") return true;
  const text = value.trim();
  return Boolean(text) && !/^(?:[-–—]|n\/?a|null|undefined|무\s*\(공개된 정보 없음\)|공개된 정보 없음)$/iu.test(text);
}
