# tools/vietnam_etl/source

Small, reproducible extracts of public source files the ETL joins against.
Nothing here is edited by hand; each file states how it was cut from its
original.

## A-023_global_power_plant_database.vnm.csv

- Origin: WRI Global Power Plant Database v1.3.0 (release 2021-06-02),
  `global_power_plant_database.csv`, as delivered under
  `베트남데이터/A. 국가 기본 정보/A.2. 에너지·전력 기초 정보/A.2.b. 에너지·전력 GIS 공간정보/raw/A-023_global_power_plant_database.csv`
  (URI: http://datasets.wri.org/dataset/globalpowerplantdatabase).
- License: Creative Commons Attribution 4.0 International (CC BY 4.0).
  Citation: Global Energy Observatory, Google, KTH Royal Institute of
  Technology in Stockholm, Enipedia, World Resources Institute. 2019. Global
  Power Plant Database. Published on Resource Watch and Google Earth Engine.
- Extract: the 236 rows with `country == "VNM"`, sorted by `gppd_idnr`, with the
  identity/attribute columns only (`country … year_of_capacity_data`; the
  `generation_gwh_*` and `estimated_generation_*` columns are dropped). Values
  are unchanged.
- Use: `build_public_v2.py` joins the A-023 WRI registry rows (which carry
  `[발전소ID: WRI…]` in their note) on `gppd_idnr` to publish `owner`,
  `commissioning_year`, `source` and `url` as facility attributes. Rows whose
  GPPD cell is empty stay empty ("미기재"); no value is inferred.
