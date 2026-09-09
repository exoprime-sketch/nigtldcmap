export type PublicLimitationKindV127 =
  | "coverage-gap"
  | "source-inconsistency"
  | "methodology-change"
  | "geographic-coverage"
  | "accuracy"
  | "update-lag";

export type PublicLimitationV127 = {
  kind: PublicLimitationKindV127;
  message: string;
  chartSummary?: string;
};

/**
 * Only reviewed, user-facing caveats belong in this registry. Source notes and
 * caveats are intentionally not accepted as inputs so internal review text can
 * never flow into the public view by accident.
 */
/**
 * A-002 now carries the World Bank's Worldwide Governance Indicators, not CPIA.
 * The three CPIA caveats that used to sit here told a reader the values stopped
 * in 2015 while the screen drew a series to 2024, and named a cluster the data
 * no longer contains. What is true of the delivered series is stated instead.
 */
const A002_PUBLIC_LIMITATIONS_V127: readonly PublicLimitationV127[] =
  Object.freeze<PublicLimitationV127[]>([
    {
      kind: "coverage-gap",
      message:
        "1996~2002년은 격년(1996·1998·2000·2002)으로만 제공되며, 2003년부터 매년 제공됩니다",
      chartSummary: "1996~2002년은 격년 값만 제공됩니다",
    },
    {
      kind: "methodology-change",
      message:
        "백분위(0~100)는 해당 연도 조사대상국 중 상대적 위치이므로 연도 간 비교 시 대상국 구성 변화를 함께 고려해야 합니다",
    },
  ]);

const PUBLIC_LIMITATIONS_V127: Readonly<
  Record<string, readonly PublicLimitationV127[]>
> = Object.freeze({
  "A-002": A002_PUBLIC_LIMITATIONS_V127,
});

export function getPublicLimitationsV127(
  elementId: string
): readonly PublicLimitationV127[] {
  return PUBLIC_LIMITATIONS_V127[elementId] || [];
}

export function getPublicChartLimitationSummaryV127(
  elementId: string
): string | null {
  return (
    getPublicLimitationsV127(elementId).find((item) => item.chartSummary)
      ?.chartSummary || null
  );
}
