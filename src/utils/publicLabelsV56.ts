export function stripInternalTaxonomyCode(value: string): string {
  return value
    .replace(/^[A-E](?:\.\d+)*(?:\.[a-z])?\.?/i, "")
    .replace(/^[\s·\-–—:]+/, "")
    .trim();
}

export function getPublicDataGroupLabel(value: string): string {
  const clean = stripInternalTaxonomyCode(value);
  return clean || "관련 데이터";
}
