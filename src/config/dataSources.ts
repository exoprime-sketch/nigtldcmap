export const CCKP_HI35_SOURCE = {
  datasetId: "CCKP-HI35-SSP370-2040-2059",
  indicatorId: "heat-index-hi35",
  variableCode: "hi35",
  apiUrl:
    "https://cckpapi.worldbank.org/api/v1/cmip6-x0.25_climatology_hi35_climatology_annual_2040-2059_median_ssp370_ensemble_all_mean/global_countries?_format=json",
  snapshotUrl: "/data/cckp/heat-index-hi35-country.json",
  sourcePageUrl: "https://climateknowledgeportal.worldbank.org/download-data",
  referencePeriod: "2040–2059",
  representativeYear: 2050,
  scenario: "SSP3-7.0",
  collection: "CMIP6 0.25-degree",
  ensembleStatistic: "다중모형 앙상블 중앙값",
  spatialStatistic: "국가 영역 평균",
  unit: "일",
} as const;
