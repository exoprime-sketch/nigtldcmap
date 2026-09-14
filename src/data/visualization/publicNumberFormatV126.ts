export function formatPublicNumberV126(
  value: number | string | boolean | null | undefined,
  unit = ""
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value);

  const scoreLike = /점|score|index/i.test(unit);
  const percentLike = /%|percent/i.test(unit);
  const magnitude = Math.abs(value);
  const maximumFractionDigits = scoreLike
    ? 2
    : percentLike
    ? 1
    : magnitude >= 1000
    ? 0
    : magnitude >= 100
    ? 1
    : 2;

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPublicDeltaV126(
  value: number | null,
  // The unit of the thing being compared. It used to be hard-coded to 점, so a
  // percentile change read "전년 대비 +0.12점" on a screen measured 0-100.
  unit = "점"
): string {
  if (value === null || !Number.isFinite(value)) return "비교 불가";
  if (Math.abs(value) < 0.005) return "전년과 동일";
  return `전년 대비 ${value > 0 ? "+" : ""}${formatPublicNumberV126(value, unit)}${unit}`;
}
