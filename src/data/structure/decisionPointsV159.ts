import { CLIMATE_TECHNOLOGIES } from "../climateTechnologyCatalog";
import type { DisplayTypeV159 } from "../spec/specTypesV159";
import type {
  S1CountryObservationV159,
  S2RegionObservationV159,
  S3LocatedEntityV159,
  S4EntityV159,
  StructureRowsV159,
} from "./structureTypesV159";

export interface DecisionPointV159 {
  key: string;
  label: string;
  value: string;
  detail?: string;
}

export interface DecisionPointsOptsV159 {
  /** Contract-listed indicator ids for the element's headline series, in priority order. */
  headlineIndicatorIds?: string[];
  countryIso3: string;
}

/**
 * Fixed points per display type (docs/plan/V159_데이터유형화_명세.md §1 "판단
 * 포인트" column). Every rule reads only what the rows already carry: no
 * point estimates a missing input, and a point whose inputs are absent is
 * left out of the returned list rather than shown empty or zero-filled.
 *
 * | type | points | hidden when |
 * |---|---|---|
 * | U1 | 최신값·연도 · 최근 5년 방향 · 10개국 중 순위 | rank: fewer than 2 countries have the headline indicator at its latest year |
 * | U2 | 상위/하위 3개 지역 · 전국 대비 | no S2 rows / no regional rows / no national row (전국 대비 only) |
 * | U3 | 값이 큰 기술 상위 3 · 기술별 값·출처연도 | no rows carry a techId or category |
 * | U4 | 개체 수 · 규모 합계 · 분류 구성 | 합계: populated sizes use more than one unit |
 * | U5 | 건수 · 총액 · 기관 상위 3 · 최근 승인 | 총액: populated amounts use more than one currency |
 * | U6 | 최신 개정 · 상태 · 적용지역 · 인센티브 유무 | 적용지역: no row carries a region tag; 인센티브: no row text names one |
 * | U0 | (none) | always |
 */
export function decisionPointsV159(
  displayType: DisplayTypeV159,
  rows: StructureRowsV159,
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  switch (displayType) {
    case "U1":
      return rows.structure === "S1" ? decisionPointsU1(rows.rows, opts) : [];
    case "U2":
      return rows.structure === "S2" ? decisionPointsU2(rows.rows, opts) : [];
    case "U3":
      return rows.structure === "S1" ? decisionPointsU3(rows.rows, opts) : [];
    case "U4":
      return rows.structure === "S3" ? decisionPointsU4(rows.rows) : [];
    case "U5":
      return rows.structure === "S4" ? decisionPointsU5(rows.rows) : [];
    case "U6":
      return rows.structure === "S4" ? decisionPointsU6(rows.rows) : [];
    case "U0":
    default:
      return [];
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function isNumeric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function unitSuffix(unit: string | null | undefined): string {
  return unit ? ` ${unit}` : "";
}

/** The contract's headline id if its data is present, else the indicator with the most numeric readings. */
function pickHeadlineIndicatorId(
  rows: readonly S1CountryObservationV159[],
  headlineIndicatorIds?: string[]
): string | null {
  for (const id of headlineIndicatorIds || []) {
    if (rows.some((row) => row.indicatorId === id && isNumeric(row.value))) return id;
  }
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const row of rows) {
    if (!isNumeric(row.value)) continue;
    if (!counts.has(row.indicatorId)) order.push(row.indicatorId);
    counts.set(row.indicatorId, (counts.get(row.indicatorId) || 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const id of order) {
    const count = counts.get(id) || 0;
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

function decisionPointsU1(
  rows: readonly S1CountryObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const headlineId = pickHeadlineIndicatorId(rows, opts.headlineIndicatorIds);
  if (!headlineId) return [];
  const points: DecisionPointV159[] = [];

  const subjectRows = rows
    .filter((row) => row.indicatorId === headlineId && row.countryIso3 === opts.countryIso3 && row.year !== null)
    .filter((row) => row.value !== null && row.value !== undefined && row.value !== "")
    .sort((a, b) => (b.year as number) - (a.year as number));
  const latest = subjectRows[0];

  if (latest) {
    const displayValue = isNumeric(latest.value) ? formatNumber(latest.value) : String(latest.value);
    points.push({
      key: "latest-value",
      label: "최신값·연도",
      value: `${displayValue}${unitSuffix(latest.unit)} (${latest.year}년)`,
    });
  }

  if (latest && isNumeric(latest.value) && latest.year !== null) {
    const targetYear = (latest.year as number) - 5;
    let earlier = subjectRows.find((row) => row.year === targetYear && isNumeric(row.value));
    let earlierYear = targetYear;
    if (!earlier) {
      for (let y = targetYear - 1; y >= targetYear - 2; y -= 1) {
        earlier = subjectRows.find((row) => row.year === y && isNumeric(row.value));
        if (earlier) {
          earlierYear = y;
          break;
        }
      }
    }
    if (earlier && isNumeric(earlier.value)) {
      const delta = (latest.value as number) - (earlier.value as number);
      const direction = delta > 0 ? "증가" : delta < 0 ? "감소" : "변화 없음";
      points.push({
        key: "five-year-direction",
        label: "최근 5년 방향",
        value: direction,
        detail: `${earlierYear}년 ${formatNumber(earlier.value as number)}${unitSuffix(latest.unit)} → ${latest.year}년 ${formatNumber(latest.value as number)}${unitSuffix(latest.unit)}`,
      });
    }
  }

  if (latest && latest.year !== null) {
    const sameYear = rows.filter(
      (row) => row.indicatorId === headlineId && row.year === latest.year && isNumeric(row.value)
    );
    const distinctCountries = new Set(sameYear.map((row) => row.countryIso3));
    if (distinctCountries.size >= 2) {
      const ranked = [...sameYear].sort((a, b) => (b.value as number) - (a.value as number));
      const rank = ranked.findIndex((row) => row.countryIso3 === opts.countryIso3) + 1;
      if (rank > 0) {
        points.push({
          key: "country-rank",
          label: "10개국 중 순위",
          value: `${rank}위`,
          detail: `자료 보유 ${distinctCountries.size}개국 중 (프레임워크 10개국 대상)`,
        });
      }
    }
  }

  return points;
}

function decisionPointsU2(
  rows: readonly S2RegionObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const headlineId = pickHeadlineIndicatorId(rows, opts.headlineIndicatorIds);
  if (!headlineId) return [];
  const indicatorRows = rows.filter((row) => row.indicatorId === headlineId && isNumeric(row.value));
  const regionalRows = indicatorRows.filter((row) => row.regionKey !== null);
  if (regionalRows.length === 0) return [];
  const latestYear = Math.max(...regionalRows.map((row) => row.year ?? -Infinity));
  if (!Number.isFinite(latestYear)) return [];
  const atLatestYear = regionalRows.filter((row) => row.year === latestYear);
  if (atLatestYear.length === 0) return [];
  const sorted = [...atLatestYear].sort((a, b) => (b.value as number) - (a.value as number));
  const unit = sorted[0].unit;
  const formatRegion = (row: S2RegionObservationV159) =>
    `${row.regionName || row.regionKey}: ${formatNumber(row.value as number)}${unitSuffix(unit)}`;

  const points: DecisionPointV159[] = [];
  const top = sorted.slice(0, 3);
  if (top.length > 0) {
    points.push({ key: "top-regions", label: "상위 3개 지역", value: top.map(formatRegion).join(" · ") });
  }
  const bottom = sorted.slice(-3).reverse();
  if (bottom.length > 0) {
    points.push({ key: "bottom-regions", label: "하위 3개 지역", value: bottom.map(formatRegion).join(" · ") });
  }

  const national = indicatorRows.find((row) => row.regionKey === null && row.year === latestYear);
  if (national && isNumeric(national.value)) {
    points.push({
      key: "national-comparison",
      label: "전국 대비",
      value: `전국 ${formatNumber(national.value as number)}${unitSuffix(unit)} (${latestYear}년)`,
      detail: `최고 ${formatRegion(sorted[0])} · 최저 ${formatRegion(sorted[sorted.length - 1])}`,
    });
  }
  return points;
}

const TECH_LABEL_BY_CODE = new Map(
  CLIMATE_TECHNOLOGIES.map((item, index) => [String(index + 1).padStart(2, "0"), item.nameKo])
);

function techLabel(row: S1CountryObservationV159): string {
  if (row.techIds.length > 0) {
    return row.techIds.map((code) => TECH_LABEL_BY_CODE.get(code) || code).join(", ");
  }
  return row.category || row.indicatorId;
}

function decisionPointsU3(
  rows: readonly S1CountryObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const scoped = opts.headlineIndicatorIds && opts.headlineIndicatorIds.length > 0
    ? rows.filter((row) => (opts.headlineIndicatorIds as string[]).includes(row.indicatorId))
    : rows;
  const candidates = scoped.filter(
    (row) => row.countryIso3 === opts.countryIso3 && isNumeric(row.value) && (row.techIds.length > 0 || row.category)
  );
  if (candidates.length === 0) return [];
  const latestYear = Math.max(...candidates.map((row) => row.year ?? -Infinity));
  if (!Number.isFinite(latestYear)) return [];
  const atLatestYear = candidates.filter((row) => row.year === latestYear);
  if (atLatestYear.length === 0) return [];

  // One reading per tech/category: keep the first seen when a group repeats.
  const seen = new Set<string>();
  const deduped: S1CountryObservationV159[] = [];
  for (const row of atLatestYear) {
    const key = techLabel(row);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  const sorted = deduped.sort((a, b) => (b.value as number) - (a.value as number));
  const unit = sorted[0].unit;
  const top = sorted.slice(0, 3);

  return [
    {
      key: "top-technologies",
      label: "값이 큰 기술 상위 3",
      value: top
        .map((row) => `${techLabel(row)}: ${formatNumber(row.value as number)}${unitSuffix(unit)}`)
        .join(" · "),
    },
    {
      key: "technology-count",
      label: "기술별 값·출처연도",
      value: `${sorted.length}개 기술 · ${latestYear}년 기준`,
    },
  ];
}

function decisionPointsU4(rows: readonly S3LocatedEntityV159[]): DecisionPointV159[] {
  if (rows.length === 0) return [];
  const points: DecisionPointV159[] = [
    { key: "entity-count", label: "개체 수", value: `${rows.length.toLocaleString("ko-KR")}개` },
  ];

  const sized = rows.filter((row) => row.size !== null);
  if (sized.length > 0) {
    const units = new Set(sized.map((row) => row.size?.unit ?? null));
    if (units.size === 1) {
      const total = sized.reduce((sum, row) => sum + (row.size?.value || 0), 0);
      points.push({ key: "size-total", label: "규모 합계", value: `${formatNumber(total)}${unitSuffix(sized[0].size?.unit)}` });
    }
  }

  const classCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.classLabel) continue;
    classCounts.set(row.classLabel, (classCounts.get(row.classLabel) || 0) + 1);
  }
  if (classCounts.size > 0) {
    const top3 = [...classCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    points.push({
      key: "class-composition",
      label: "분류 구성",
      value: top3.map(([label, count]) => `${label} ${count}건`).join(" · "),
    });
  }

  return points;
}

function decisionPointsU5(rows: readonly S4EntityV159[]): DecisionPointV159[] {
  if (rows.length === 0) return [];
  const points: DecisionPointV159[] = [
    { key: "record-count", label: "건수", value: `${rows.length.toLocaleString("ko-KR")}건` },
  ];

  const amounted = rows.filter((row) => row.amount !== null);
  if (amounted.length > 0) {
    const currencies = new Set(amounted.map((row) => row.amount?.currency ?? null));
    if (currencies.size === 1) {
      const total = amounted.reduce((sum, row) => sum + (row.amount?.value || 0), 0);
      points.push({ key: "amount-total", label: "총액", value: `${formatNumber(total)} ${amounted[0].amount?.currency}` });
    }
  }

  const orgCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.org) continue;
    orgCounts.set(row.org, (orgCounts.get(row.org) || 0) + 1);
  }
  if (orgCounts.size > 0) {
    const top3 = [...orgCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    points.push({ key: "top-orgs", label: "기관 상위 3", value: top3.map(([org, count]) => `${org} ${count}건`).join(" · ") });
  }

  const latest = latestDatedRow(rows);
  if (latest) {
    points.push({ key: "latest-approval", label: "최근 승인", value: latest.display, detail: latest.name || undefined });
  }

  return points;
}

function decisionPointsU6(rows: readonly S4EntityV159[]): DecisionPointV159[] {
  if (rows.length === 0) return [];
  const points: DecisionPointV159[] = [];

  const latest = latestDatedRow(rows);
  if (latest) {
    points.push({ key: "latest-revision", label: "최신 개정", value: `${latest.name || latest.display} (${latest.display})` });
  }

  const statusCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.status) continue;
    statusCounts.set(row.status, (statusCounts.get(row.status) || 0) + 1);
  }
  if (statusCounts.size > 0) {
    points.push({
      key: "status-breakdown",
      label: "상태",
      value: [...statusCounts.entries()].map(([status, count]) => `${status} ${count}건`).join(" · "),
    });
  }

  const taggedCount = rows.filter((row) => row.regionTags.length > 0).length;
  if (taggedCount > 0) {
    points.push({ key: "applicable-regions", label: "적용지역", value: `${taggedCount}건` });
  }

  const incentiveRows = rows.filter(
    (row) => (row.recordType && row.recordType.includes("인센티브")) || (row.description && row.description.includes("인센티브"))
  );
  if (incentiveRows.length > 0) {
    points.push({ key: "incentive-presence", label: "인센티브 유무", value: `있음 (${incentiveRows.length}건)` });
  }

  return points;
}

function latestDatedRow(
  rows: readonly S4EntityV159[]
): { display: string; name: string | null } | null {
  let best: { time: number; display: string; name: string | null } | null = null;
  for (const row of rows) {
    if (row.date) {
      const time = Date.parse(row.date);
      if (Number.isFinite(time) && (!best || time > best.time)) {
        best = { time, display: row.date, name: row.name };
      }
    } else if (row.year !== null) {
      const time = Date.UTC(row.year, 0, 1);
      if (!best || time > best.time) {
        best = { time, display: `${row.year}년`, name: row.name };
      }
    }
  }
  return best;
}
