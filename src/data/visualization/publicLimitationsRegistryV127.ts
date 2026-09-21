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

/**
 * V140: the caveats the home's featured cards used to print under their
 * previews. The home now leads with a question and one figure; the rule a
 * reader needs before reusing the numbers is stated here, on the detail
 * screen the card opens.
 */
const HOME_CARD_LIMITATIONS_V140: Readonly<
  Record<string, readonly PublicLimitationV127[]>
> = Object.freeze({
  "A-010": Object.freeze<PublicLimitationV127[]>([
    {
      kind: "methodology-change",
      message:
        "가스별 배출량은 같은 환산 단위(CO₂eq, GWP-100·AR5)로 제공되며, 원천은 별도의 총계 행을 제공하지 않습니다. 화면의 합계는 네 가스 값을 더한 것입니다",
    },
  ]),
  "A-024": Object.freeze<PublicLimitationV127[]>([
    {
      kind: "geographic-coverage",
      message:
        "지도에 그리는 경로는 2016년 송전선뿐입니다. 개정 PDP8 선로(계획 선로 포함)는 경로 좌표가 없어 목록에만 있으며 지도에는 없습니다",
    },
    {
      kind: "accuracy",
      message:
        "원천 PDF를 좌표화한 자료로 2~10 km 위치 오차가 있을 수 있으며, 선의 교차는 전기적 접속을 뜻하지 않습니다",
    },
  ]),
  "B-033": Object.freeze<PublicLimitationV127[]>([
    {
      kind: "coverage-gap",
      message:
        "원천은 개편 전 63개 성·시 계열만 제공하고 전국 계열은 제공하지 않습니다. 성·시 값을 더해 전국값으로 만들지 않습니다",
    },
  ]),
  "C-016": Object.freeze<PublicLimitationV127[]>([
    {
      kind: "methodology-change",
      message:
        "표시된 용량은 개정 PDP8(Quyết định 768/QĐ-TTg, 2025-04-15)의 계획 용량이며 설치 실적이 아닙니다",
    },
  ]),
  "D-023": Object.freeze<PublicLimitationV127[]>([
    {
      kind: "source-inconsistency",
      message:
        "사업 수는 네 기금의 개별 사업 행을 같은 기준으로 센 값입니다. 승인액은 통화·기간·집행 단계가 기금마다 달라 통화가 확인된 금액만 통화별로 합산합니다",
    },
  ]),
});

const PUBLIC_LIMITATIONS_V127: Readonly<
  Record<string, readonly PublicLimitationV127[]>
> = Object.freeze({
  "A-002": A002_PUBLIC_LIMITATIONS_V127,
  ...HOME_CARD_LIMITATIONS_V140,
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
