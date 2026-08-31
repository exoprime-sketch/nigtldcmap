import type {
  IndicatorDataResult,
  IndicatorObservation,
} from "../../types/indicator";
import type {
  SolarIndicatorId,
  SolarPotentialCountryRecord,
  SolarPotentialDataset,
} from "../../types/solar";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

const SOLAR_POTENTIAL_URL = publicAssetUrlV128(
  "data/solar/country-solar-potential.json"
);
const SOLAR_REPRESENTATIVE_YEAR = 2020;

let cachedDataset: SolarPotentialDataset | null = null;

export async function loadSolarPotentialDataset(
  force = false
): Promise<SolarPotentialDataset> {
  if (cachedDataset && !force) {
    return cachedDataset;
  }

  const response = await fetch(SOLAR_POTENTIAL_URL, {
    cache: force ? "reload" : "default",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`태양광 잠재력 저장본 로딩 실패 · HTTP ${response.status}`);
  }

  const result = (await response.json()) as SolarPotentialDataset;

  if (!Array.isArray(result.data)) {
    throw new Error("태양광 잠재력 저장본 형식 오류");
  }

  cachedDataset = result;
  return result;
}

function getRecordValue(
  record: SolarPotentialCountryRecord,
  indicatorId: SolarIndicatorId
): number | null {
  return indicatorId === "solar-pvout"
    ? record.pvoutLevel1DailyKwhKwp
    : record.ghiDailyKwhM2;
}

export async function loadSolarIndicatorData(
  indicatorId: SolarIndicatorId,
  force = false
): Promise<IndicatorDataResult> {
  const dataset = await loadSolarPotentialDataset(force);

  const observations: IndicatorObservation[] = dataset.data.map((record) => ({
    indicatorId,
    iso3: record.iso3,
    year: SOLAR_REPRESENTATIVE_YEAR,
    value: getRecordValue(record, indicatorId),
  }));

  return {
    observations,
    lastUpdated: dataset.metadata.publicationDate,
    isFallback: false,
    sourceStatus: "snapshot",
    referencePeriod: "장기 평균 · 연구 공개 2020",
    fetchedAt: dataset.metadata.publicationDate,
  };
}

export function createSolarPotentialIndex(
  dataset: SolarPotentialDataset
): Map<string, SolarPotentialCountryRecord> {
  return new Map(dataset.data.map((record) => [record.iso3, record]));
}

export function getSolarPotentialRecord(
  dataset: SolarPotentialDataset | null | undefined,
  iso3: string | null | undefined
): SolarPotentialCountryRecord | null {
  if (!dataset || !iso3) {
    return null;
  }

  return dataset.data.find((record) => record.iso3 === iso3) ?? null;
}
