/**
 * 기존 import 호환용 모듈입니다.
 * 신규 코드는 registry.ts의 generic API를 사용합니다.
 */
import type { IndicatorObservation } from "../../types/indicator";
import {
  createObservationIndex,
  getIndicatorConfig,
  getIndicatorYears,
  getLatestObservationForCountry,
  loadIndicatorData,
  toMapValue,
} from "./registry";

export const ELECTRICITY_ACCESS_WORLD_BANK_CODE = "EG.ELC.ACCS.ZS";
export const ELECTRICITY_ACCESS_INDICATOR =
  getIndicatorConfig("electricity-access").definition;

export const ELECTRICITY_ACCESS_FALLBACK: IndicatorObservation[] = [
  { indicatorId: "electricity-access", iso3: "VNM", year: 2024, value: 100 },
  { indicatorId: "electricity-access", iso3: "IDN", year: 2024, value: 99.9 },
  { indicatorId: "electricity-access", iso3: "PHL", year: 2024, value: 94.8 },
  { indicatorId: "electricity-access", iso3: "KHM", year: 2024, value: 99.2 },
  { indicatorId: "electricity-access", iso3: "LAO", year: 2024, value: 96.5 },
  { indicatorId: "electricity-access", iso3: "BGD", year: 2024, value: 99.5 },
  { indicatorId: "electricity-access", iso3: "MNG", year: 2024, value: 99.1 },
];

export function calculateElectricityAccessGap(
  value: number | null
): number | null {
  return toMapValue(getIndicatorConfig("electricity-access"), value);
}

export {
  createObservationIndex,
  getIndicatorYears,
  getLatestObservationForCountry,
};

export function getLatestIndicatorYear(
  observations: IndicatorObservation[]
): number | null {
  return getIndicatorYears(observations)[0] ?? null;
}

export function getObservationForYear(
  observations: IndicatorObservation[],
  iso3: string,
  year: number | null
): IndicatorObservation | null {
  if (year === null) return null;
  return (
    observations.find(
      (item) =>
        item.iso3 === iso3 &&
        item.year === year &&
        typeof item.value === "number"
    ) ?? null
  );
}

export async function loadElectricityAccessData(force = false) {
  return loadIndicatorData("electricity-access", force);
}
