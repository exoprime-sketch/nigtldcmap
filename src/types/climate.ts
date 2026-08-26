import type { IndicatorDataResult, IndicatorObservation } from "./indicator";

export type ClimateDataSourceStatus = "live-api" | "snapshot" | "unavailable";

export interface CckpHi35SnapshotMetadata {
  datasetId: string;
  indicatorId: string;
  titleKo: string;
  titleEn: string;
  variableCode: string;
  sourceOrganization: string;
  sourceUrl: string;
  apiUrl: string;
  collection: string;
  product: string;
  aggregation: string;
  scenario: string;
  projectionPeriod: string;
  ensembleStatistic: string;
  spatialStatistic: string;
  unit: string;
  representativeYear: number;
  snapshotSourceFile: string;
  snapshotDate: string;
  rowCount: number;
  validValueCount: number;
  missingValueCount: number;
  minimum: number;
  maximum: number;
  limitations: string[];
}

export interface CckpHi35Snapshot {
  metadata: CckpHi35SnapshotMetadata;
  observations: Array<
    IndicatorObservation & {
      name?: string;
    }
  >;
}

export interface ClimateIndicatorDataResult extends IndicatorDataResult {
  sourceStatus: ClimateDataSourceStatus;
  referencePeriod: string;
  scenario: string;
  fetchedAt: string | null;
}
