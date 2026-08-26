export type SolarIndicatorId = "solar-pvout" | "solar-ghi";

export interface SolarPotentialStatistics {
  min: number | null;
  p10: number | null;
  p25: number | null;
  average: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
  max: number | null;
}

export interface SolarMonthlyPvout {
  jan: number | null;
  feb: number | null;
  mar: number | null;
  apr: number | null;
  may: number | null;
  jun: number | null;
  jul: number | null;
  aug: number | null;
  sep: number | null;
  oct: number | null;
  nov: number | null;
  dec: number | null;
}

export interface SolarPotentialCountryRecord {
  iso3: string;
  countryName: string;
  note: string | null;
  regionCode: string | null;
  ghiDailyKwhM2: number | null;
  pvoutLevel1DailyKwhKwp: number | null;
  lcoe2018UsdKwh: number | null;
  seasonalityIndex: number | null;
  level1AreaPercent: number | null;
  pvEquivalentAreaPercent: number | null;
  monthlyPvoutDailyKwhKwp: SolarMonthlyPvout;
  ghiDistributionDailyKwhM2: SolarPotentialStatistics;
  pvoutDistributionDailyKwhKwp: SolarPotentialStatistics;
}

export interface SolarPotentialDataset {
  metadata: {
    datasetId: string;
    titleKo: string;
    titleEn: string;
    sourceOrganization: string;
    sourceUrl: string;
    dataCatalogUrl: string;
    publicationDate: string;
    sourceFile: string;
    recordCount: number;
    license: string;
    citation: string;
    units: Record<string, string>;
    definitions: Record<string, string>;
    limitations: string[];
  };
  data: SolarPotentialCountryRecord[];
}
