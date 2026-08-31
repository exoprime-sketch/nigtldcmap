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
const A002_PUBLIC_LIMITATIONS_V127: readonly PublicLimitationV127[] =
  Object.freeze<PublicLimitationV127[]>([
    {
      kind: "coverage-gap",
      message: "공개된 CPIA 값은 2005~2015년까지 제공됩니다",
      chartSummary: "2016~2024년은 원천자료에서 값이 제공되지 않았습니다",
    },
    {
      kind: "coverage-gap",
      message: "2016~2024년은 원천자료에서 값이 제공되지 않았습니다",
    },
    {
      kind: "source-inconsistency",
      message:
        "2014년 공공부문 관리 클러스터 값은 원천 기재값과 하위항목 평균이 일치하지 않아 플랫폼에서는 원천 기재값을 표시합니다",
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
