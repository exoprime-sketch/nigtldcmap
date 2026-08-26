export interface PublicIndicator {
  id: string;
  titleKo: string;
  titleEn: string;
  unit: string;
  sourceOrganization: string;
  sourceUrl: string;
  license: string;
  availableYears: number[];
  description: string;
  limitations?: string;
}

export interface IndicatorObservation {
  indicatorId: string;
  iso3: string;
  year: number;
  value: number | null;
}

export type IndicatorSourceStatus = "live-api" | "snapshot" | "unavailable";

export interface IndicatorDataResult {
  observations: IndicatorObservation[];
  lastUpdated: string | null;
  isFallback: boolean;
  warning?: string;
  sourceStatus?: IndicatorSourceStatus;
  referencePeriod?: string;
  scenario?: string;
  fetchedAt?: string | null;
}
