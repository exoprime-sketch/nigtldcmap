# V156 원자료 갱신 diff — 2026-09-30 입고분

- 대조: `public/data/vietnam/v2` → `.staging/v162/public/data/vietnam/v2`
- 요소 152개 중 변화 없음 47개, 변화 105개
- 제목 변경 0개 · 스키마 영향 70개 · 전용 렌더러 영향 9개
- 지표 추가 434 · 지표 삭제 441 · 관측 추가 4944 · 관측 삭제 3140

## 1. 변화 요소 일람

| 요소 | 관측 | 엔티티 | 지표 | 값 변경 | 최신연도 | 영향 |
|---|---|---|---|---|---|---|
| A-013 | 1→0 | 365→365 | 42→42 | 0 | 2016→— |  |
| A-023 | 1→0 | 1963→1963 | 3→2 | 0 | 2021→— |  스키마 |
| A-025 | 1→1 | 5→1 | 3→3 | 1 (100%) | 2026→2026 |  스키마 |
| A-026 | 7→14 | 0→0 | 12→19 | 0 | 2023→2026 |  스키마 |
| A-027 | 35→61 | 0→0 | 35→45 | 0 | 2026→2026 |  |
| A-028 | 19→23 | 0→7014 | 19→24 | 0 | 2026→2026 |  |
| A-029 | 1→1 | 19→30 | 5→5 | 1 (100%) | 2026→2026 |  스키마 |
| A-030 | 16→148 | 0→0 | 4→8 | 0 | 2024→2024 |  |
| B-001 | 38→38 | 0→0 | 38→38 | 0 (0%) | 1991→1991 |  |
| B-002 | 19→64 | 0→1427 | 19→68 | 0 (0%) | 2099→2099 |  |
| B-003 | 0→0 | 8371→12621 | 6→7 | 0 | —→— |  스키마 |
| B-004 | 0→0 | 33232→91596 | 29→33 | 0 | —→— |  스키마 |
| B-005 | 0→35 | 31688→54692 | 9→13 | 0 | —→2025 |  스키마 |
| B-006 | 0→0 | 32608→80071 | 21→25 | 0 | —→— |  스키마 |
| B-007 | 0→0 | 32370→80070 | 17→21 | 0 | —→— |  스키마 |
| B-008 | 0→0 | 1575→1575 | 201→201 | 0 | —→— |  스키마 |
| B-009 | 435→255 | 0→0 | 261→261 | 0 (0%) | 2026→2026 |  |
| B-010 | 12→44 | 0→0 | 10→14 | 0 (0%) | 2024→2024 |  |
| B-012 | 0→0 | 275→275 | 45→45 | 0 | —→— |  |
| B-014 | 13→0 | 0→12 | 8→13 | 0 | 2040→— |  |
| B-015 | 12→11 | 0→0 | 14→19 | 0 (0%) | 2026→2026 |  |
| B-017 | 0→0 | 2032→4867 | 1423→1424 | 0 | —→— |  스키마 |
| B-020 | 2696→2696 | 0→0 | 324→324 | 0 (0%) | 2026→2026 |  |
| B-022 | 8→8 | 0→0 | 11→14 | 0 (0%) | 2050→2050 |  스키마 |
| B-023 | 0→0 | 11→382 | 12→13 | 0 | —→— |  |
| B-024 | 205→68 | 0→194 | 7→10 | 0 (0%) | 2023→2023 |  스키마 |
| B-025 | 0→0 | 9→120 | 21→23 | 0 | —→— |  스키마 |
| B-026 | 0→0 | 74→165 | 13→15 | 0 | —→— |  스키마 |
| B-027 | 54→54 | 0→0 | 3→3 | 0 (0%) | 2026→2026 |  |
| B-028 | 0→0 | 16→25 | 16→18 | 0 | —→— |  스키마 |
| B-029 | 0→0 | 231→483 | 11→16 | 0 | —→— |  스키마 |
| B-030 | 0→0 | 100→134 | 5→6 | 0 | —→— |  스키마 |
| B-031 | 189→189 | 71→105 | 189→189 | 189 (100%) | 2010→2010 |  스키마 |
| B-032 | 63→126 | 68→166 | 63→63 | 63 (100%) | 2010→2010 |  스키마 |
| B-033 | 1489→1489 | 2056→4784 | 63→63 | 0 (0%) | 2024→2024 |  스키마 |
| B-034 | 362→173 | 246→1251 | 362→173 | 125 (72.3%) | 2024→2024 |  스키마 |
| B-035 | 1764→961 | 0→3038 | 41→44 | 0 (0%) | 2025→2025 |  스키마 |
| B-036 | 48→48 | 0→392 | 34→37 | 0 (0%) | 2024→2024 |  |
| B-037 | 0→0 | 747→781 | 58→59 | 0 | —→— |  스키마 |
| B-038 | 190→399 | 0→0 | 25→43 | 0 | 2050→2050 |  스키마 |
| B-039 | 0→0 | 228→263 | 20→23 | 0 | —→— |  스키마 |
| B-040 | 0→0 | 165→199 | 36→37 | 0 | —→— |  스키마 |
| B-041 | 0→0 | 113→147 | 52→53 | 0 | —→— |  스키마 |
| B-042 | 0→0 | 205→533 | 144→147 | 0 | —→— |  스키마 |
| B-043 | 274→128 | 0→0 | 38→38 | 0 | 2026→2026 |  |
| B-044 | 26→2 | 0→21 | 26→29 | 0 | 2026→2026 |  |
| B-045 | 46→224 | 0→0 | 46→46 | 0 | 2026→2025 |  스키마 |
| B-046 | 13→0 | 0→64 | 13→14 | 0 | 2026→— |  |
| B-047 | 21→0 | 0→81 | 12→13 | 0 | 2025→— |  |
| B-048 | 0→0 | 8→41 | 11→12 | 0 | —→— |  스키마 |
| C-001 | 0→0 | 49→110 | 60→54 | 0 | —→— |  스키마 |
| C-002 | 0→0 | 82→34 | 92→85 | 0 | —→— |  스키마 |
| C-003 | 0→0 | 96→272 | 105→102 | 0 | —→— |  스키마 |
| C-004 | 0→0 | 58→71 | 69→62 | 0 | —→— |  스키마 |
| C-005 | 0→0 | 135→408 | 140→137 | 0 | —→— |  스키마 |
| C-006 | 0→0 | 50→38 | 62→51 | 0 | —→— |  스키마 |
| C-007 | 0→0 | 32→7 | 38→33 | 0 | —→— |  스키마 |
| C-008 | 0→0 | 235→117 | 159→140 | 0 | —→— |  스키마 |
| C-009 | 0→0 | 182→19 | 208→183 | 0 | —→— |  스키마 |
| C-010 | 0→0 | 59→19 | 72→60 | 0 | —→— |  스키마 |
| C-011 | 0→0 | 44→38 | 53→49 | 0 | —→— |  스키마 |
| C-012 | 0→0 | 120→20 | 103→93 | 0 | —→— |  스키마 |
| C-013 | 0→0 | 64→129 | 61→56 | 0 | —→— |  스키마 |
| C-014 | 0→0 | 93→46 | 109→97 | 0 | —→— |  스키마 |
| C-015 | 0→0 | 21→24 | 26→23 | 0 | —→— |  스키마 |
| C-016 | 639→639 | 817→777 | 340→340 | 0 (0%) | —→— |  스키마 |
| C-017 | 0→0 | 52→56 | 62→53 | 0 | —→— |  스키마 |
| C-018 | 0→0 | 121→69 | 130→126 | 0 | —→— |  스키마 |
| C-019 | 0→0 | 128→56 | 113→98 | 0 | —→— |  스키마 |
| C-022 | 0→0 | 98→61 | 76→73 | 0 | —→— |  스키마 |
| C-024 | 0→0 | 20→13 | 23→17 | 0 | —→— |  스키마 |
| C-025 | 0→0 | 388→1190 | 21→18 | 0 | —→— |  스키마 |
| D-002 | 8→59 | 0→0 | 8→11 | 5 (62.5%) | 2030→2030 |  스키마 |
| D-003 | 12→14 | 0→454 | 12→17 | 0 | 2023→2025 |  |
| D-006 | 45→279 | 0→0 | 20→30 | 0 | 2026→2026 |  |
| D-009 | 7→9 | 0→0 | 5→7 | 0 (0%) | 2020→2020 |  |
| D-012 | 0→0 | 22→1168 | 15→16 | 0 | —→— |  |
| D-013 | 21→24 | 0→0 | 21→24 | 0 (0%) | 2024→2026 |  스키마 |
| D-014 | 0→0 | 164→168 | 7→7 | 0 | —→— |  |
| D-015 | 0→0 | 650→1050 | 10→10 | 0 | —→— |  |
| D-016 | 0→0 | 232→632 | 10→10 | 0 | —→— |  |
| D-017 | 0→0 | 10→305 | 3→4 | 0 | —→— |  |
| D-018 | 4→4 | 4→4 | 4→4 | 0 (0%) | —→— |  |
| D-019 | 0→0 | 10→10 | 6→7 | 0 | —→— |  스키마 |
| D-020 | 0→0 | 9→9 | 3→3 | 0 | —→— |  스키마 |
| D-021 | 0→0 | 640→640 | 9→9 | 0 | —→— |  스키마 |
| D-022 | 0→0 | 15→247 | 4→7 | 0 | —→— |  |
| D-023 | 0→2 | 73→112 | 9→12 | 0 | —→2025 |  스키마 |
| D-024 | 0→1 | 12→26 | 6→8 | 0 | —→2026 |  |
| D-025 | 0→0 | 132→173 | 18→18 | 0 | —→— |  스키마 |
| D-026 | 0→0 | 14→13 | 4→4 | 0 | —→— |  스키마 |
| E-002 | 0→0 | 1→46 | 1→2 | 0 | —→— |  스키마 |
| E-005 | 0→0 | 20→20 | 1→2 | 0 | —→— |  스키마 |
| E-006 | 0→0 | 15→15 | 4→6 | 0 | —→— |  스키마 |
| E-007 | 0→0 | 19→22 | 6→7 | 0 | —→— |  |
| E-008 | 0→1 | 144→6790 | 26→27 | 0 | —→2026 |  스키마 |
| E-009 | 6→39 | 0→0 | 6→6 | 0 | 2023→2023 |  스키마 |
| E-010 | 31→185 | 0→0 | 24→24 | 0 (0%) | 2025→2025 |  |
| E-011 | 0→50 | 0→0 | 0→11 | 0 | —→2025 |  스키마 |
| E-012 | 92→2161 | 0→0 | 90→229 | 0 | 2024→2024 |  스키마 |
| E-014 | 0→0 | 10→10 | 1→1 | 0 | —→— |  |
| E-015 | 0→0 | 4→4 | 2→2 | 0 | —→— |  |
| E-018 | 0→0 | 24→36 | 3→3 | 0 | —→— |  스키마 |
| E-019 | 0→0 | 9→9 | 1→1 | 0 | —→— |  |
| E-020 | 0→0 | 7→7 | 3→3 | 0 | —→— |  스키마 |

## 2. 스키마 파괴 변경(전용 렌더러·계약 영향)

### A-023 · 전용 렌더러

- 지표 삭제: A-023_power_plant_count

### A-025

- 지표 속성 변경: A-025_ccs_facility_count(spatialScope), A-025_ccs_facility_registry(labelKo)

### A-026

- 지표 삭제: A-026_building_footprint_confidence_min, A-026_building_footprint_count, A-026_building_footprint_count_conf_ge_080, A-026_building_footprint_crs, A-026_building_footprint_field_count, A-026_building_footprint_mean_area, A-026_building_footprint_total_area
- 지표 추가: A-026_aux_gob_confidence_min, A-026_aux_gob_count, A-026_aux_gob_count_conf_ge_080, A-026_aux_gob_crs, A-026_aux_gob_field_count, A-026_aux_gob_mean_area, A-026_aux_gob_total_area, A-026_osm_building_count, A-026_osm_building_crs, A-026_osm_building_field_count, A-026_osm_building_mean_area_m2, A-026_osm_building_null_rate_name, A-026_osm_building_null_rate_type, A-026_osm_building_total_area_m2

### A-029

- 엔티티 속성 삭제: 속성3_A_024_선로상태_기존_계획
- 엔티티 속성 추가: 속성3_A_024_선로상태_기존_계획_A_029_상태_통일코드

### B-003

- 지표 추가: B-003_climate_adm1_year_adm34
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: CCKP_집계단위명, 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 행정구역_비고

### B-004

- 지표 추가: B-004_climate_adm1_year_adm34, B-004_climate_monthly_clim_adm1, B-004_climate_monthly_clim_adm34, B-004_climate_monthly_clim_national
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 10월, 11월, 12월, 1월, 2월, 3월, 4월, 5월, 6월, 7월, 8월, 9월, CCKP_집계단위명, 개편_후_소속_단위, 기간_평년, 단위, 변수_코드_CCKP, 변수명, 앙상블_통계, 지역명_현지어, 지표면_일사량_W_m, 지표면_풍속_m_s, 풍속_일사량_앙상블_모델_수, 행정구역_비고

### B-005

- 지표 추가: B-005_climate_adm1_year_adm34, B-005_climate_monthly_clim_adm1, B-005_climate_monthly_clim_adm34, B-005_climate_monthly_clim_national
- 지표 속성 변경: B-005_soil_moisture(labelKo·spatialScope)
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 10월, 11월, 12월, 1월, 2월, 3월, 4월, 5월, 6월, 7월, 8월, 9월, CCKP_집계단위명, 개편_후_소속_단위, 기간_평년, 단위, 변수_코드_CCKP, 변수명, 앙상블_통계, 지역명_현지어, 행정구역_비고

### B-006

- 지표 추가: B-006_climate_adm1_year_adm34, B-006_climate_monthly_clim_adm1, B-006_climate_monthly_clim_adm34, B-006_climate_monthly_clim_national
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 열대야_TR_23_일, 열대야_TR_29_일, 지역명_베트남어
- 엔티티 속성 추가: 10월, 11월, 12월, 1월, 2월, 3월, 4월, 5월, 6월, 7월, 8월, 9월, CCKP_집계단위명, 개편_후_소속_단위, 기간_평년, 단위, 변수_코드_CCKP, 변수명, 앙상블_통계, 열대야_TR_20_일, 지역명_현지어, 행정구역_비고

### B-007

- 지표 추가: B-007_climate_adm1_year_adm34, B-007_climate_monthly_clim_adm1, B-007_climate_monthly_clim_adm34, B-007_climate_monthly_clim_national
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 10월, 11월, 12월, 1월, 2월, 3월, 4월, 5월, 6월, 7월, 8월, 9월, CCKP_집계단위명, 개편_후_소속_단위, 기간_평년, 단위, 변수_코드_CCKP, 변수명, 앙상블_통계, 지역명_현지어, 행정구역_비고

### B-008 · 전용 렌더러

- 엔티티 속성 삭제: PSMSL_관측소_ID, 관측소명_PSMSL, 관측소명_베트남어, 소재
- 엔티티 속성 추가: PSMSL_관측소_ID_격자점은_grid, 개편_후_소속_단위, 관측소명_PSMSL_격자점, 관측소명_로마자, 기후기술_연계_근거, 소재_ADM1_판정, 소재_설명, 좌표_성격

### B-017

- 지표 추가: B-017_adm1_ranking
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 전국_값, 전국_단위, 전국_지표명, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 소속_상위_행정구역_GADM_NAME_1, 순위표_값, 순위표_단위, 순위표_지표명, 지역명_현지어

### B-022

- 지표 추가: B-022_financing_external, B-022_financing_private, B-022_financing_public
- 지표 속성 변경: B-022_adaptation_investment(unit), B-022_gdp_loss_max(labelKo), B-022_gdp_loss_min(labelKo), B-022_total_investment(labelKo·unit)

### B-024

- 지표 추가: B-024_agri_water_share_subnat_adm34, B-024_irrigated_area_subnat, B-024_irrigated_area_subnat_adm34
- 지표 속성 변경: B-024_agri_water_share_subnat(labelKo·spatialScope)
- 엔티티 속성 추가: AQUASTAT_기준연도_품질기호, 값, 값의_성격, 개편_후_소속_단위, 경계_면적_km, 경계_좌표_산출근거, 경계_폴리곤_파일, 국가_농업용수_비중_AQUASTAT, 기준연도, 기후기술_연계_근거, 단위, 레코드_키, 배분_기준값_원값, 배분_기준자료_종류, 산식, 원값_단위, 원자료_출처, 전국_합계_원값, 지역_비율, 지역명, 지표명, 행정단위
- 단위 변경 관측 34건

### B-025

- 지표 추가: B-025_basin_area_national_aux, B-025_river_basin_national_aux
- 엔티티 속성 삭제: 국경_공유, 베트남_내_면적_km_GIS_산출, 베트남_내_면적_km_문헌, 베트남_내_비중, 수계_구분, 유역명_국문, 유역명_베트남어, 유역명_영문, 총_유역면적_km
- 엔티티 속성 추가: HydroSHEDS_권역, lev08_폴리곤_수_자국_내_유역_전체, 개체_구분_Basin_Country, 국경_공유_수계_구분, 레코드_키, 유역_ID_HydroBASINS_MAIN_BAS, 유역_구분_국내_완결_국제_공유, 유역명_원천_표기, 자국_내_면적_km_GIS_산출, 자국_내_면적_km_문헌, 자국_내_비중_GIS_기준, 총_유역면적_km_GIS_산출, 총_유역면적_km_문헌, 총_유역면적_km_원천_SUB_AREA_합

### B-026

- 지표 추가: B-026_flowdir_adm1_adm34, B-026_flowdir_basin_lvl6
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: PFAF_ID_lvl6, 개편_후_소속_단위, 경계_면적_km, 내륙_종착_격자_수, 유역_ID_MAIN_BAS_lev08_B_025_연계, 유역_코드_HydroBASINS_lvl6_HYBAS_ID, 자국_내_비중, 지역명_현지어, 행정구역_비고

### B-028

- 지표 추가: B-028_hydro_site_lit_aux, B-028_water_resources_aux
- 지표 속성 변경: B-028_discharge_gis(labelKo·unit·spatialScope), B-028_hydro_site(labelKo)
- 엔티티 속성 추가: PFAF_ID_lvl6, 값_성격_실측_모델, 개편_후_소속_단위, 소속_행정구역_ADM1_GADM_명칭, 유역_ID_MAIN_BAS_lev08_B_025_연계, 유역_코드_HydroBASINS_lvl6_HYBAS_ID, 좌표_성격

### B-029

- 지표 추가: B-029_mangrove_adm1, B-029_mangrove_adm1_adm34, B-029_peatland_adm1_adm34, B-029_primary_extent_adm1, B-029_primary_extent_adm1_adm34
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: 1차림_비율_2001, 개편_후_소속_단위, 경계_면적_km, 맹그로브_면적_1996_ha, 맹그로브_면적_2020_ha, 습윤열대_1차림_면적_2001_ha, 이탄지_비율, 지역명_현지어, 행정구역_비고

### B-030

- 지표 추가: B-030_forest_change_adm1_adm34
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 행정구역_비고

### B-031

- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 레코드_키_GADM_GID_1, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 레코드_키, 지역명_현지어, 행정구역_비고

### B-032

- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 기준연도, 분석대상_면적_ha, 수관_면적_ha, 지역명_현지어, 행정구역_비고

### B-033

- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 총배출_Mg_CO2e, 행정구역_비고, 화재_기인_손실_ha

### B-034

- 지표 삭제: B-034_prov_forest_carbon_gross_emissions_vn_44, B-034_prov_forest_carbon_gross_removals_vn_44, B-034_prov_forest_carbon_net_flux_vn_44, B-034_prov_forest_carbon_gross_emissions_vn_47, B-034_prov_forest_carbon_gross_removals_vn_47, B-034_prov_forest_carbon_net_flux_vn_47, B-034_prov_forest_carbon_gross_emissions_vn_54, B-034_prov_forest_carbon_gross_removals_vn_54, B-034_prov_forest_carbon_net_flux_vn_54, B-034_prov_forest_carbon_gross_emissions_vn_56, B-034_prov_forest_carbon_gross_removals_vn_56, B-034_prov_forest_carbon_net_flux_vn_56, B-034_prov_forest_carbon_gross_emissions_vn_04, B-034_prov_forest_carbon_gross_removals_vn_04, B-034_prov_forest_carbon_net_flux_vn_04, B-034_prov_forest_carbon_gross_emissions_vn_55, B-034_prov_forest_carbon_gross_removals_vn_55, B-034_prov_forest_carbon_net_flux_vn_55, B-034_prov_forest_carbon_gross_emissions_vn_59, B-034_prov_forest_carbon_gross_removals_vn_59, B-034_prov_forest_carbon_net_flux_vn_59, B-034_prov_forest_carbon_gross_emissions_vn_ct, B-034_prov_forest_carbon_gross_removals_vn_ct, B-034_prov_forest_carbon_net_flux_vn_ct, B-034_prov_forest_carbon_gross_emissions_vn_52, B-034_prov_forest_carbon_gross_removals_vn_52, B-034_prov_forest_carbon_net_flux_vn_52, B-034_prov_forest_carbon_gross_emissions_vn_73, B-034_prov_forest_carbon_gross_removals_vn_73, B-034_prov_forest_carbon_net_flux_vn_73, B-034_prov_forest_carbon_gross_emissions_vn_31, B-034_prov_forest_carbon_gross_removals_vn_31, B-034_prov_forest_carbon_net_flux_vn_31, B-034_prov_forest_carbon_gross_emissions_vn_30, B-034_prov_forest_carbon_gross_removals_vn_30, B-034_prov_forest_carbon_net_flux_vn_30, B-034_prov_forest_carbon_gross_emissions_vn_26, B-034_prov_forest_carbon_gross_removals_vn_26, B-034_prov_forest_carbon_net_flux_vn_26, B-034_prov_forest_carbon_gross_emissions_vn_hn, B-034_prov_forest_carbon_gross_removals_vn_hn, B-034_prov_forest_carbon_net_flux_vn_hn, B-034_prov_forest_carbon_gross_emissions_vn_23, B-034_prov_forest_carbon_gross_removals_vn_23, B-034_prov_forest_carbon_net_flux_vn_23, B-034_prov_forest_carbon_gross_emissions_vn_20, B-034_prov_forest_carbon_gross_removals_vn_20, B-034_prov_forest_carbon_net_flux_vn_20, B-034_prov_forest_carbon_gross_emissions_vn_66, B-034_prov_forest_carbon_gross_removals_vn_66, B-034_prov_forest_carbon_net_flux_vn_66, B-034_prov_forest_carbon_gross_emissions_vn_hp, B-034_prov_forest_carbon_gross_removals_vn_hp, B-034_prov_forest_carbon_net_flux_vn_hp, B-034_prov_forest_carbon_gross_emissions_vn_61, B-034_prov_forest_carbon_gross_removals_vn_61, B-034_prov_forest_carbon_net_flux_vn_61, B-034_prov_forest_carbon_gross_emissions_vn_sg, B-034_prov_forest_carbon_gross_removals_vn_sg, B-034_prov_forest_carbon_net_flux_vn_sg, B-034_prov_forest_carbon_gross_emissions_vn_43, B-034_prov_forest_carbon_gross_removals_vn_43, B-034_prov_forest_carbon_net_flux_vn_43, B-034_prov_forest_carbon_gross_emissions_vn_57, B-034_prov_forest_carbon_gross_removals_vn_57, B-034_prov_forest_carbon_net_flux_vn_57, B-034_prov_forest_carbon_gross_emissions_vn_36, B-034_prov_forest_carbon_gross_removals_vn_36, B-034_prov_forest_carbon_net_flux_vn_36, B-034_prov_forest_carbon_gross_emissions_vn_34, B-034_prov_forest_carbon_gross_removals_vn_34, B-034_prov_forest_carbon_net_flux_vn_34, B-034_prov_forest_carbon_gross_emissions_vn_01, B-034_prov_forest_carbon_gross_removals_vn_01, B-034_prov_forest_carbon_net_flux_vn_01, B-034_prov_forest_carbon_gross_emissions_vn_02, B-034_prov_forest_carbon_gross_removals_vn_02, B-034_prov_forest_carbon_net_flux_vn_02, B-034_prov_forest_carbon_gross_emissions_vn_06, B-034_prov_forest_carbon_gross_removals_vn_06, B-034_prov_forest_carbon_net_flux_vn_06, B-034_prov_forest_carbon_gross_emissions_vn_40, B-034_prov_forest_carbon_gross_removals_vn_40, B-034_prov_forest_carbon_net_flux_vn_40, B-034_prov_forest_carbon_gross_emissions_vn_72, B-034_prov_forest_carbon_gross_removals_vn_72, B-034_prov_forest_carbon_net_flux_vn_72, B-034_prov_forest_carbon_gross_emissions_vn_35, B-034_prov_forest_carbon_gross_removals_vn_35, B-034_prov_forest_carbon_net_flux_vn_35, B-034_prov_forest_carbon_gross_emissions_vn_09, B-034_prov_forest_carbon_gross_removals_vn_09, B-034_prov_forest_carbon_net_flux_vn_09, B-034_prov_forest_carbon_gross_emissions_vn_22, B-034_prov_forest_carbon_gross_removals_vn_22, B-034_prov_forest_carbon_net_flux_vn_22, B-034_prov_forest_carbon_gross_emissions_vn_67, B-034_prov_forest_carbon_gross_removals_vn_67, B-034_prov_forest_carbon_net_flux_vn_67, B-034_prov_forest_carbon_gross_emissions_vn_18, B-034_prov_forest_carbon_gross_removals_vn_18, B-034_prov_forest_carbon_net_flux_vn_18, B-034_prov_forest_carbon_gross_emissions_vn_63, B-034_prov_forest_carbon_gross_removals_vn_63, B-034_prov_forest_carbon_net_flux_vn_63, B-034_prov_forest_carbon_gross_emissions_vn_68, B-034_prov_forest_carbon_gross_removals_vn_68, B-034_prov_forest_carbon_net_flux_vn_68, B-034_prov_forest_carbon_gross_emissions_vn_70, B-034_prov_forest_carbon_gross_removals_vn_70, B-034_prov_forest_carbon_net_flux_vn_70, B-034_prov_forest_carbon_gross_emissions_vn_14, B-034_prov_forest_carbon_gross_removals_vn_14, B-034_prov_forest_carbon_net_flux_vn_14, B-034_prov_forest_carbon_gross_emissions_vn_29, B-034_prov_forest_carbon_gross_removals_vn_29, B-034_prov_forest_carbon_net_flux_vn_29, B-034_prov_forest_carbon_gross_emissions_vn_28, B-034_prov_forest_carbon_gross_removals_vn_28, B-034_prov_forest_carbon_net_flux_vn_28, B-034_prov_forest_carbon_gross_emissions_vn_13, B-034_prov_forest_carbon_gross_removals_vn_13, B-034_prov_forest_carbon_net_flux_vn_13, B-034_prov_forest_carbon_gross_emissions_vn_25, B-034_prov_forest_carbon_gross_removals_vn_25, B-034_prov_forest_carbon_net_flux_vn_25, B-034_prov_forest_carbon_gross_emissions_vn_24, B-034_prov_forest_carbon_gross_removals_vn_24, B-034_prov_forest_carbon_net_flux_vn_24, B-034_prov_forest_carbon_gross_emissions_vn_05, B-034_prov_forest_carbon_gross_removals_vn_05, B-034_prov_forest_carbon_net_flux_vn_05, B-034_prov_forest_carbon_gross_emissions_vn_21, B-034_prov_forest_carbon_gross_removals_vn_21, B-034_prov_forest_carbon_net_flux_vn_21, B-034_prov_forest_carbon_gross_emissions_vn_69, B-034_prov_forest_carbon_gross_removals_vn_69, B-034_prov_forest_carbon_net_flux_vn_69, B-034_prov_forest_carbon_gross_emissions_vn_53, B-034_prov_forest_carbon_gross_removals_vn_53, B-034_prov_forest_carbon_net_flux_vn_53, B-034_prov_forest_carbon_gross_emissions_vn_07, B-034_prov_forest_carbon_gross_removals_vn_07, B-034_prov_forest_carbon_net_flux_vn_07, B-034_prov_forest_carbon_gross_emissions_vn_03, B-034_prov_forest_carbon_gross_removals_vn_03, B-034_prov_forest_carbon_net_flux_vn_03, B-034_prov_forest_carbon_gross_emissions_vn_41, B-034_prov_forest_carbon_gross_removals_vn_41, B-034_prov_forest_carbon_net_flux_vn_41, B-034_prov_forest_carbon_gross_emissions_vn_37, B-034_prov_forest_carbon_gross_removals_vn_37, B-034_prov_forest_carbon_net_flux_vn_37, B-034_prov_forest_carbon_gross_emissions_vn_50, B-034_prov_forest_carbon_gross_removals_vn_50, B-034_prov_forest_carbon_net_flux_vn_50, B-034_prov_forest_carbon_gross_emissions_vn_51, B-034_prov_forest_carbon_gross_removals_vn_51, B-034_prov_forest_carbon_net_flux_vn_51, B-034_prov_forest_carbon_gross_emissions_vn_49, B-034_prov_forest_carbon_gross_removals_vn_49, B-034_prov_forest_carbon_net_flux_vn_49, B-034_prov_forest_carbon_gross_emissions_vn_71, B-034_prov_forest_carbon_gross_removals_vn_71, B-034_prov_forest_carbon_net_flux_vn_71, B-034_prov_forest_carbon_gross_emissions_vn_dn, B-034_prov_forest_carbon_gross_removals_vn_dn, B-034_prov_forest_carbon_net_flux_vn_dn, B-034_prov_forest_carbon_gross_emissions_vn_27, B-034_prov_forest_carbon_gross_removals_vn_27, B-034_prov_forest_carbon_net_flux_vn_27, B-034_prov_forest_carbon_gross_emissions_vn_32, B-034_prov_forest_carbon_gross_removals_vn_32, B-034_prov_forest_carbon_net_flux_vn_32, B-034_prov_forest_carbon_gross_emissions_vn_33, B-034_prov_forest_carbon_gross_removals_vn_33, B-034_prov_forest_carbon_net_flux_vn_33, B-034_prov_forest_carbon_gross_emissions_vn_39, B-034_prov_forest_carbon_gross_removals_vn_39, B-034_prov_forest_carbon_net_flux_vn_39, B-034_prov_forest_carbon_gross_emissions_vn_58, B-034_prov_forest_carbon_gross_removals_vn_58, B-034_prov_forest_carbon_net_flux_vn_58, B-034_prov_forest_carbon_gross_emissions_vn_46, B-034_prov_forest_carbon_gross_removals_vn_46, B-034_prov_forest_carbon_net_flux_vn_46, B-034_prov_forest_carbon_gross_emissions_vn_45, B-034_prov_forest_carbon_gross_removals_vn_45, B-034_prov_forest_carbon_net_flux_vn_45
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 산림탄소_순플럭스_Mg_CO2e_yr, 산림탄소_총배출_Mg_CO2e_yr, 산림탄소_총흡수_Mg_CO2_yr, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 산림탄소_순플럭스_Mg_CO2e, 산림탄소_총배출_Mg_CO2e, 산림탄소_총흡수_Mg_CO2, 수관_면적_2000_ha, 지상부_바이오매스_AGB_Mg_ESA_CCI, 지상부_바이오매스_밀도_Mg_ha_ESA_CCI, 지역명_현지어, 행정구역_비고

### B-035

- 지표 추가: B-035_lc_adm1_year, B-035_lc_adm1_year_adm34, B-035_lc_national_year
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 경계_좌표_산출근거, 경계_폴리곤_파일, 기후기술_연계_근거, 나지_면적_km, 나지_비율_육지_대비, 농경지_면적_km, 농경지_비율_육지_대비, 도시_면적_km, 도시_비율_육지_대비, 레코드_키, 빙설_면적_km, 산림_면적_km, 산림_비율_육지_대비, 수체_면적_km, 습지_면적_km, 습지_비율_육지_대비, 연도, 육지_면적_합계_km_수체_제외, 지역명, 초지_관목_면적_km, 초지_관목_비율_육지_대비, 행정단위
- 단위 변경 관측 64건

### B-037

- 지표 추가: B-037_landcover_adm1_adm34
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 행정구역_비고

### B-038

- 지표 추가: B-038_agri_residue_aux, B-038_agri_residue_bagasse, B-038_agri_residue_other, B-038_agri_residue_rice_husk, B-038_agri_residue_rice_straw, B-038_aux_capacity_target_biomass_2030, B-038_aux_capacity_target_wte_2030, B-038_aux_msw_collection_pop, B-038_aux_msw_organic_share, B-038_aux_msw_percap, B-038_aux_stock_buffalo, B-038_aux_stock_cattle, B-038_aux_stock_pig, B-038_aux_stock_poultry, B-038_biomass_bankable, B-038_biomass_energy_potential, B-038_biomass_theoretical, B-038_msw_field
- 지표 속성 변경: B-038_livestock_manure(unit)

### B-039

- 지표 삭제: B-039_hydropower_national
- 지표 추가: B-039_gross_potential_adm1_adm34, B-039_hydropower_national_aux, B-039_hydropower_national_installed, B-039_hydropower_national_potential
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 행정구역_비고

### B-040

- 지표 추가: B-040_geotemp_adm1_adm34
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 경계_면적_km_GADM, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 지역명_현지어, 행정구역_비고

### B-041

- 지표 추가: B-041_solar_adm1_adm34
- 지표 속성 변경: B-041_solar_adm1(labelKo), B-041_solar_national(labelKo)
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 지역명_현지어, 행정구역_비고

### B-042

- 지표 추가: B-042_capacity_factor_adm1, B-042_capacity_factor_adm1_adm34, B-042_wind_adm1_adm34
- 지표 속성 변경: B-042_wind_adm1(labelKo), B-042_wind_national(labelKo)
- 엔티티 속성 삭제: 2025_개편_후_소속_34개_체계, 지역명_베트남어
- 엔티티 속성 추가: 개편_후_소속_단위, 설비이용률_상위10, 설비이용률_평균, 지역명_현지어, 행정구역_비고

### B-045

- 지표 속성 변경: B-045_production_rank_graphite(labelKo), B-045_production_share_graphite(labelKo), B-045_reserve_rank_graphite(labelKo), B-045_reserve_share_graphite(labelKo), B-045_source_page_alumina(labelKo·unit), B-045_source_page_antimony(labelKo·unit), B-045_source_page_bauxite(labelKo·unit), B-045_source_page_cement(labelKo·unit), B-045_source_page_fluorspar(labelKo·unit), B-045_source_page_graphite(labelKo·unit), B-045_source_page_phosphate(labelKo·unit), B-045_source_page_rare_earths(labelKo·unit), B-045_source_page_tin(labelKo·unit), B-045_source_page_tungsten(labelKo·unit)

### B-048

- 지표 추가: B-048_mine_site_aux
- 엔티티 속성 삭제: 소재_행정구역_성
- 엔티티 속성 추가: 개편_후_소속_단위, 소재_행정구역_ADM1, 원천_레코드_ID_MRDS_dep_id, 좌표_성격

### C-001

- 지표 삭제: C-001_adaptation_target, C-001_base_year, C-001_bau_projection, C-001_implementation_finance, C-001_mitigation_target, C-001_ndc_sdg_linkage, C-001_sector_mitigation_measures, C-001_source_link, C-001_submission_history, C-001_target_ghg, C-001_target_sector
- 지표 추가: C-001_adaptation, C-001_finance, C-001_sector_measure, C-001_sector_target, C-001_submission
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: SDG_명칭, SDG_번호, SDG_연계_개수_개, SDG_연계_목록, SDG_연계_여부, 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 목표_BAU_총배출량_MtCO_eq, 목표_GHG_감축_목표_원문_표기, 목표_NDC_요약, 목표_감축_기여_유형, 목표_기준연도_목표, 목표_대상_가스, 목표_대상_부문, 목표_목표_유형, 목표_무조건부_감축량_MtCO_eq, 목표_무조건부_감축률, 목표_조건부_감축량_MtCO_eq, 목표_조건부_감축률, 목표_합계_감축량_MtCO_eq, 목표_합계_감축률, 목표기준_GWP_기준, 목표기준_기준_연도_년, 목표기준_대상_GHG_목록, 목표기준_대상_GHG_종수_종, 목표기준_대상_부문_목록, 목표기준_대상_부문_수_개, 목표기준_목표_연도_년, 목표기준_세계_배출량_대비_비중, 목표기준_이행기간_시작일_YYYY_MM_DD, 목표기준_이행기간_종료일_YYYY_MM_DD, 목표기준_적용_범위, 부문_BAU_대비_감축률, 부문_BAU_배출_전망_MtCO_eq, 부문_감축량_MtCO_eq, 부문_계층, 부문_대상_연도_년, 부문_부문명, 부문_소요재원_백만_USD, 부문_조건_구분, 수단_부문, 수단_조치_선정_기준, 수단_주요_감축_수단, 식별_NDC_판, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 식별_현행_여부_Y_N, 재원_구분, 재원_금액, 재원_단위, 재원_대상_기간, 재원_원문_표기, 재원_재원조달_유형_목록, 재원_재원조달_유형_수_개, 재원_조건부_이행_전제조건, 재원_항목, 적응_값, 적응_기준, 적응_단위, 적응_부문, 적응_세부계획_근거, 적응_적응_포함_여부, 적응_적응목표_유형, 적응_주요_조치, 적응_항목, 정량목표_값, 정량목표_단위, 정량목표_목표_연도_년, 정량목표_원문_표기, 정량목표_항목, 제출_NDC_등록부_URL, 제출_목표_연도_년, 제출_상태, 제출_제출_문서명_원문, 제출_제출_연도_년, 제출_제출본_유형, 제출_제출본명_국문, 제출_제출일_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 협약_이정표, 협약_일자_YYYY_MM_DD

### C-002

- 지표 삭제: C-002_adaptation_program_count, C-002_climate_projection_ssp, C-002_extreme_climate_index, C-002_gdp_loss_estimate, C-002_ghg_sector_emission, C-002_ndc_achievement, C-002_source_link_thegef, C-002_source_link_unfccc, C-002_submission_history_thegef, C-002_submission_history_unfccc
- 지표 추가: C-002_climate_outlook, C-002_ghg_inventory, C-002_submission
- 지표 속성 변경: C-002_climate_finance(labelKo·unit), C-002_ghg_total_emission(labelKo)
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 감축_값_MtCO_eq, 감축_값_성격, 감축_대상_연도_년, 감축_부문, 감축_이행_상태, 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 미확보_사유, 미확보_재확보_대상_출처, 미확보_항목, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 인벤토리_AFOLU_합계, 인벤토리_CH, 인벤토리_CO, 인벤토리_GWP_기준, 인벤토리_HFCs, 인벤토리_IPPU, 인벤토리_LULUCF, 인벤토리_LULUCF_처리, 인벤토리_N_O, 인벤토리_계열, 인벤토리_근거_표, 인벤토리_기타_부문, 인벤토리_농업, 인벤토리_단위, 인벤토리_산정_가이드라인, 인벤토리_에너지, 인벤토리_연도_년, 인벤토리_총계_MtCO_eq_표기, 인벤토리_총배출량_LULUCF_제외, 인벤토리_총배출량_LULUCF_포함, 인벤토리_폐기물, 재원_구분, 재원_금액, 재원_단위, 재원_대상_기간, 재원_부가_정보, 재원_프로그램_수_건, 재원_항목, 적응_기후변화_대응_사업_건수_건, 적응_사업_집계_기간, 전망_값, 전망_단위, 전망_대상_시점, 전망_시나리오_기준, 전망_항목, 제출_UNFCCC_문서레코드, 제출_값_제출_정보, 제출_게재일_YYYY_MM_DD, 제출_문서_구분, 제출_문서_분량_쪽, 제출_보고서_계열, 제출_보고서_판, 제출_보고서명_원문, 제출_작성_주관기관, 제출_제출_상태, 제출_제출_연도_년, 제출_제출일_YYYY_MM_DD, 제출_제출차수_회, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분

### C-003

- 지표 삭제: C-003_adaptation_finance_need, C-003_adaptation_governance, C-003_adaptation_priority_sector, C-003_me_framework, C-003_source_link, C-003_stakeholder_gender, C-003_submission_history_en_mae, C-003_submission_history_vanban_chinhphu
- 지표 추가: C-003_finance, C-003_governance_body, C-003_me_indicator, C-003_nap_submission, C-003_priority_action
- 지표 속성 변경: C-003_adaptation_measure_list(labelKo), C-003_sector_vulnerability(labelKo·unit)
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: M_E_내용, M_E_법적_근거, M_E_법적_근거_승인일_YYYY_MM_DD, M_E_보고_수단_산출물, M_E_보고_주기_시한, M_E_연계_체계, M_E_종합_평가_주기_년, M_E_지표_수_개, M_E_지표군_수_개, M_E_항목, 거버넌스_근거, 거버넌스_기구_기관명_국문, 거버넌스_기구_기관명_원문, 거버넌스_설치_상태, 거버넌스_역할, 거버넌스_층위, 결측_framework_필수_속성_결측_코드_사유, 과제_과제_번호, 과제_과제군_번호, 과제_과제군명_국문, 과제_과제군명_원문, 과제_과제명_국문, 과제_과제명_원문, 과제_단계_구분_1기, 과제_단계_구분_2기, 과제_단계별_성과_1기, 과제_단계별_성과_2기, 과제_단계별_성과_기타, 과제_목표_번호, 과제_목표명_국문, 과제_세부과제_내용_원문, 과제_세부과제_순번, 과제_우선순위, 과제_이행_시작연도_년, 과제_이행_종료연도_년, 과제_이행시기_구분, 과제_주관기관_국문, 과제_주관기관_원문, 구성_값, 구성_근거, 구성_단위, 구성_항목, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 재원_금액, 재원_단위, 재원_대상_기간, 재원_부문, 재원_산출_기준, 재원_재원_구분, 재원_통화, 재원_항목, 제출_NAP_판, 제출_UNFCCC_NAP_Central_등재일_YYYY_MM_DD, 제출_계획기간, 제출_국가_구분, 제출_등재_연도_년, 제출_문서_분량_쪽, 제출_문서명_원문, 제출_비전_목표연도_년, 제출_승인_결정번호, 제출_승인_연도_년, 제출_승인일_YYYY_MM_DD, 제출_작성_주관기관, 제출_제출_상태, 제출_제출_연도_년, 제출_제출일_YYYY_MM_DD, 젠더_내용, 젠더_여성_명시_M_E_지표_수_개, 젠더_젠더_여성_명시_세부과제_수_개, 젠더_젠더_전담_과제군, 젠더_취약계층_포용_대상, 젠더_항목, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 지표_담당기관_국문, 지표_담당기관_원문, 지표_지표_내용_원문, 지표_지표_번호, 지표_지표군_번호, 지표_지표군명_국문, 지표_지표군명_원문, 지표_평가_대상_번호, 지표_평가_대상_원문, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 취약성_부문_개입코드_접두, 취약성_부문_대상명_국문, 취약성_부문_대상명_원문, 취약성_우선_과제_구분, 취약성_우선_과제_내용, 취약성_원문_절, 취약성_원문_쪽_p, 취약성_정량_영향_원문_발췌, 취약성_주요_영향_국문_요약, 취약성_평가_대상_유형

### C-004

- 지표 삭제: C-004_carbon_removal_target, C-004_energy_mix_projection, C-004_just_transition, C-004_key_mitigation_tech, C-004_long_term_investment, C-004_long_term_pathway, C-004_net_zero_target, C-004_sector_decarbonization, C-004_source_link_faolex_fao, C-004_source_link_openknowledge_worldban, C-004_source_link_vanban_chinhphu
- 지표 추가: C-004_finance, C-004_longterm_target, C-004_scenario, C-004_submission
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 목표_값, 목표_기준_연도_년, 목표_단위, 목표_대상_범위, 목표_목표_구분, 목표_목표_서술_원문, 목표_목표_연도_년, 목표_목표_유형, 목표_목표_항목, 목표_조건_구분, 문서_UNFCCC_제출일_YYYY_MM_DD, 문서_계획기간, 문서_문서명_국문, 문서_문서명_원문, 문서_문서번호, 문서_발행_주체, 문서_분량_쪽, 문서_승인_발행_연도_년, 문서_승인_발행일_YYYY_MM_DD, 문서_유형_공통_분류, 문서_제출_상태, 문서_제출_연도_년, 문서_추가_제출_문서, 시나리오_값, 시나리오_근거_위치, 시나리오_내용, 시나리오_단위, 시나리오_부문, 시나리오_시나리오명_국문, 시나리오_시나리오명_원문, 시나리오_연도_년, 시나리오_전제, 시나리오_지표_구분, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 재원_금액, 재원_단위, 재원_대상_기간, 재원_부가_정보, 재원_부문, 재원_산출_기준, 재원_원문_표기, 재원_재원_구분, 재원_통화, 재원_항목, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_확인_시점

### C-005

- 지표 삭제: C-005_barrier_analysis, C-005_priority_sector, C-005_priority_tech_list, C-005_source_link, C-005_tap_status, C-005_tna_status
- 지표 추가: C-005_barrier, C-005_priority_tech, C-005_tna_cycle
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_근거_표, 기술_기술명_국문, 기술_기술명_영문, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 기술_서브섹터_원문, 기술_선정_단계, 기술_우선순위_위, 기술_평가_점수_산정_기준, 기술_평가_점수_점, 문서_게재처, 문서_문서명_국문, 문서_문서명_원문, 문서_발간_연도_년, 문서_유형_공통_분류, 문서_유형_원문_표기, 부문_대상_부문, 부문_우선_분야_국문, 부문_우선_분야_원문, 수행_TNA_수행_여부, 수행_감축_TNA_완료_시점, 수행_근거, 수행_기술실행계획_TAP_보유, 수행_사이클_연도_년, 수행_사이클명_국문, 수행_사이클명_원문, 수행_우선_섹터_목록, 수행_우선_섹터_수_개, 수행_적응_TNA_완료_시점, 수행_제출본명, 수행_총괄기관, 식별_TNA_차수_사이클, 식별_감축_적응_구분, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 장벽_대상_기술, 장벽_장벽_내용, 장벽_장벽_분류, 장벽_장벽_수준, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분

### C-006

- 지표 삭제: C-006_authorization_body_a6partnership, C-006_authorization_body_baochinhphu, C-006_authorization_body_vanban_chinhphu, C-006_authorization_body_vanban_chinhphu_2, C-006_bilateral_date, C-006_bilateral_party, C-006_bilateral_scope, C-006_corresponding_adjustment_baochinhphu, C-006_corresponding_adjustment_vanban_chinhphu, C-006_corresponding_adjustment_vanban_chinhphu_2, C-006_itmo_transfer_jcm_jp, C-006_itmo_transfer_unfccc, C-006_national_registry_a6partnership, C-006_national_registry_unfccc, C-006_national_registry_vanban_chinhphu
- 지표 추가: C-006_activity, C-006_bilateral_agreement, C-006_domestic_framework, C-006_system
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 법령_공포일_YYYY_MM_DD, 법령_문서명_국문, 법령_문서명_원문, 법령_문서번호, 법령_발령기관, 법령_시행일_YYYY_MM_DD, 법령_제6조_관련_역할, 사업_CDM_참조번호, 사업_대상_부문, 사업_등록_상태, 사업_등록일, 사업_등록취소일, 사업_메커니즘, 사업_방법론, 사업_사업명_원문, 사업_사업번호, 사업_상대국_참여기업, 사업_소재지, 사업_수량_단위, 사업_승인_발행량, 사업_시작일, 사업_이전_기간, 사업_협력_당사국, 사업_호스트_참여기업, 사업_활동_유형, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 실적_ITMO_이전_실적, 실적_발행_크레딧_총량, 실적_상대국_배분량, 실적_수량_단위, 실적_실적_기준일_YYYY_MM_DD, 실적_자국_배분량, 전환_값, 전환_기준_시점, 전환_내역, 전환_항목, 제출_DNA_대표자, 제출_DNA_소재지, 제출_NDC_준비_통보_유지_여부, 제출_UNFCCC_문서레코드, 제출_게재일_YYYY_MM_DD, 제출_국가지정기구_DNA, 제출_서식번호, 제출_제6_4조_DNA_지정_여부, 제출_파리협정_당사국_여부, 제출_호스트국_전환_승인_건수_건, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 체계_구축_상태, 체계_근거_문서_조항, 체계_기준_시점_년, 체계_내용, 체계_소관기관, 체계_제출_지정일_YYYY_MM_DD, 체계_항목, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 협정_UNFCCC_CARP_협력접근법_ID, 협정_국내_승인, 협정_기준_시점, 협정_내용, 협정_대상_부문_기술, 협정_발효_상태, 협정_상대_소관_승인기관, 협정_상대_유형, 협정_상대국_당사자, 협정_자국_소관_승인기관, 협정_초기보고서_제출_당사국_일자, 협정_최신_문서_개정일_YYYY_MM_DD, 협정_최초_체결일_YYYY_MM_DD, 협정_협정_유형, 협정_협정명_국문, 협정_협정명_원문

### C-007

- 지표 삭제: C-007_activity_scope, C-007_participating_body, C-007_participation_status, C-007_registered_activity, C-007_registration_date, C-007_source_link
- 지표 추가: C-007_activity
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 참여_국가연락창구_NFP_기관, 참여_근거, 참여_기준_시점, 참여_대상_분야_감축_적응_재정_기술_역량, 참여_등록_일자_YYYY_MM_DD, 참여_등재_활동_수_건, 참여_참여_기관, 참여_참여_실적, 참여_참여_여부, 참여_참여_지위, 참여_플랫폼_URL, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 플랫폼_NFP_지정_당사국_수_개국, 플랫폼_기준_문서, 플랫폼_기준_시점, 플랫폼_기준일_YYYY_MM_DD, 플랫폼_등록_지원제공자_수_개, 플랫폼_전체_등재_활동_수_건, 플랫폼_직전_회차_NFP_지정_당사국_수_개국, 플랫폼_직전_회차_등재_활동_수_건, 플랫폼_직전_회차_지원제공자_수_개, 활동_기관_구분_원문, 활동_대상_분야_감축_적응_재정_기술_역량, 활동_등록일_YYYY_MM_DD, 활동_등록일_원문_표기, 활동_부문_원문, 활동_비당사국_참여기관, 활동_제출_당사국, 활동_참여_당사국_host_표시, 활동_초점_분야_원문, 활동_플랫폼_등록_ID, 활동_활동명_국문, 활동_활동명_원문

### C-008

- 지표 삭제: C-008_climate_field, C-008_initiative_name_ccacoalition, C-008_initiative_name_climateaction_unfccc, C-008_initiative_name_climatelaws, C-008_initiative_name_ec_europa, C-008_initiative_name_en_baochinhphu, C-008_initiative_name_govuk, C-008_participant_list_ccacoalition, C-008_participant_list_climateaction_unfccc, C-008_participant_list_climateaction_unfccc_2, C-008_participant_list_govuk, C-008_participation_status, C-008_participation_year_baochinhphu, C-008_participation_year_climateaction_unfccc, C-008_participation_year_govuk, C-008_theme_caselaw, C-008_theme_climateaction_unfccc, C-008_theme_climatelaws, C-008_theme_ec_europa, C-008_theme_en_baochinhphu, C-008_theme_govuk
- 지표 추가: C-008_actor, C-008_initiative
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 미확보_사유, 미확보_재확보_대상_출처, 미확보_항목, 속성_공시_출처, 속성_리스크_평가_보유, 속성_배출량_인벤토리_보유, 속성_회계연도_년, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 이니셔티브_기후_분야_감축_적응, 이니셔티브_등재_플랫폼_근거, 이니셔티브_설명_원문, 이니셔티브_시작_연도_년, 이니셔티브_운영_상태_NAZCA_status, 이니셔티브_이니셔티브_ID, 이니셔티브_이니셔티브명_국문, 이니셔티브_이니셔티브명_원문, 이니셔티브_종료_연도_년, 이니셔티브_주요_내용_한_줄_설명, 이니셔티브_주제, 이니셔티브_참여_국가_기관_목록, 이니셔티브_참여_상태, 이니셔티브_참여_서명일_YYYY_MM_DD, 이니셔티브_참여_연도_년, 이니셔티브_참여_형태, 이니셔티브_최신_갱신_연도_년, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 집계_값, 집계_구성_내역, 집계_단위, 집계_산출_근거, 집계_집계_항목, 참여_감축조치_건수_건, 참여_공약_수_건, 참여_기후공약_건수_건, 참여_기후행동계획_건수_건, 참여_이니셔티브_참여_건수_건, 참여_이행조치_건수_건, 참여_재정조치_건수_건, 참여_적응조치_건수_건, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 행위자_GCAP_NAZCA_ID, 행위자_기관명_원문, 행위자_소재_국가, 행위자_업종_원문, 행위자_유형, 행위자_인구_명, 행위자_지역, 행위자_프로필_URL

### C-009

- 지표 삭제: C-009_effective_year_climatelaws, C-009_effective_year_faolex_fao, C-009_effective_year_vanban_chinhphu, C-009_law_name_climatelaws, C-009_law_name_danang, C-009_law_name_datafiles_chinhphu, C-009_law_name_faolex_fao, C-009_law_name_faolex_fao_2, C-009_law_name_vanban_chinhphu, C-009_law_status_climatelaws, C-009_law_status_faolex_fao, C-009_law_status_vanban_chinhphu, C-009_law_type_climatelaws, C-009_law_type_faolex_fao, C-009_law_type_vanban_chinhphu, C-009_lead_ministry_climatelaws, C-009_lead_ministry_faolex_fao, C-009_lead_ministry_vanban_chinhphu, C-009_source_link_climatelaws, C-009_source_link_climatepolicydatabase, C-009_source_link_datafiles_chinhphu, C-009_source_link_vanban_chinhphu, C-009_target_sector_climatelaws, C-009_target_sector_datafiles_chinhphu, C-009_target_sector_faolex_fao, C-009_target_sector_vanban_chinhphu
- 지표 추가: C-009_law
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 법령_감축_적응_구분, 법령_공포일_YYYY_MM_DD, 법령_관보_재가일, 법령_기후_목적, 법령_대상_분야, 법령_대상_분야_원문_표기, 법령_대체_개정_관계, 법령_문서번호, 법령_법령명_국문, 법령_법령명_원문, 법령_법령명_현지어, 법령_상태, 법령_시행_연도_년, 법령_시행_연도_원문_표기, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_정책수단, 법령_주관_부처, 법령_주요_내용_상세, 법령_주요_내용_한_줄_설명, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_문서_ID_CCLW_slug, 식별_행정_수준, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_보유_여부, 출처_raw_파일명, 출처_게재처, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치

### C-010

- 지표 삭제: C-010_law_name_datafiles_chinhphu, C-010_law_name_informea, C-010_law_name_vanban_chinhphu, C-010_law_name_vanban_chinhphu_2, C-010_law_name_vea_mae, C-010_law_status_datafiles_chinhphu, C-010_law_status_vbpl, C-010_law_type_vanban_chinhphu, C-010_law_type_vbpl, C-010_lead_ministry, C-010_source_link_vanban_chinhphu, C-010_source_link_vanban_chinhphu_2, C-010_source_link_vea_mae
- 지표 추가: C-010_law
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 대조_대조_결과, 대조_대체_출처, 대조_지정_DB, 대조_판정, 법령_감축_적응_구분, 법령_개정_이력, 법령_공포일_YYYY_MM_DD, 법령_관보_재가일, 법령_대상_분야, 법령_대상_분야_원문_표기, 법령_대체_개정_관계, 법령_문서번호, 법령_법령명_국문, 법령_법령명_원문, 법령_상위법_근거_조항, 법령_상태, 법령_시행_연도_년, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_유형_주제_분류, 법령_유형_주제_분류_원문_표기, 법령_정본_언어, 법령_정책수단, 법령_주관_부처, 법령_주요_내용_상세, 법령_주요_내용_한_줄_설명, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_문서_ID_CCLW_slug, 식별_행정_수준, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_보유_여부, 출처_raw_파일명, 출처_게재처, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치

### C-011

- 지표 삭제: C-011_crime_statistics_api_worldbank, C-011_crime_statistics_dataunodc_un, C-011_crime_statistics_gso, C-011_local_security_status_0404, C-011_local_security_status_bocongan, C-011_local_security_status_osac, C-011_travel_alert_level_0404, C-011_travel_alert_level_0404_2, C-011_travel_alert_level_travel_state
- 지표 추가: C-011_crime_stat, C-011_field_survey, C-011_safety_notice, C-011_security_assessment, C-011_travel_alert
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 경보_경보_체계, 경보_등급_명칭, 경보_발령_갱신일_YYYY_MM_DD, 경보_발령_기관, 경보_발령_성격, 경보_색상_구분, 경보_적용_지역_국문, 경보_적용_지역_원문, 경보_지역별_차등_여부, 경보_최근_조정_공지_YYYY_MM, 경보_현재_등급_단계, 공지_게시일_YYYY_MM_DD, 공지_공지_유형, 공지_공지_제목, 공표_공표_상태, 공표_자료명, 공표_재확보_대상_출처, 공표_확인_결과, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 연락처_값, 연락처_구분, 연락처_기관_시설명, 이력_변경_내용, 이력_변경_유형, 이력_변경일_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 치안_납치_위험, 치안_내용, 치안_다발_범죄_유형, 치안_범죄_위협도, 치안_보고서_발행일_YYYY_MM_DD, 치안_사건_사고_유형_현황, 치안_유의_지역, 치안_자연재해, 치안_정량값, 치안_정량값_기준_연도_년, 치안_정량값_단위, 치안_정치폭력_위협도, 치안_테러_위협도, 치안_특이_동향, 치안_평가_기관, 치안_평가_항목, 치안_폭력범죄_빈도, 통계_값_건_10만_명, 통계_값_지수_0_100, 통계_수준, 통계_연도_년, 통계_자료_성격, 통계_지표명_국문, 통계_지표명_원문, 통계_표본_기준, 현지조사_근거_규정_소관기관, 현지조사_사업_운영_영향, 현지조사_정량_정성_기준, 현지조사_참고_문헌, 현지조사_표, 현지조사_항목

### C-012 · 전용 렌더러

- 지표 삭제: C-012_contract_type, C-012_ppp_agency, C-012_ppp_law_datafiles_chinhphu, C-012_ppp_law_vanban_chinhphu, C-012_ppp_project_history_mof, C-012_ppp_project_history_ppi_worldbank, C-012_ppp_project_history_vanban_chinhphu, C-012_procurement_method_datafiles_chinhphu, C-012_procurement_method_ppi_worldbank, C-012_vfm_requirement_datafiles_chinhphu, C-012_vfm_requirement_vanban_chinhphu
- 지표 추가: C-012_law
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 법령_개정_대상_관계, 법령_공포일_YYYY_MM_DD, 법령_문서번호, 법령_발행_기관, 법령_법령명_국문, 법령_법령명_원문, 법령_상태, 법령_시행_연도_년, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_주요_내용, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 실적_GDP_비중, 실적_구분, 실적_대상_기간, 실적_부가_정보, 실적_부문_원문, 실적_사업_수_건, 실적_연도_년, 실적_투자액_백만_USD, 요약_PPP_법률_유무, 요약_VfM_평가_의무, 요약_계약_유형, 요약_근거_법률명_문서번호, 요약_근거_조항, 요약_대상_분야, 요약_사업_건수_건, 요약_전담기관_PPP_Unit, 요약_조달_방식, 요약_주요_내용, 요약_총_투자액_백만_USD, 요약_최근_재무종결_연도_년, 요약_최신_개정, 요약_투자_우대_보장, 제도_PPP_대상_분야, 제도_VfM_의무_조항, 제도_계약_유형, 제도_권한기관, 제도_분쟁해결, 제도_전담기관_PPP_Unit, 제도_투자_우대_보장, 제도_투자자_선정_방식, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분

### C-013

- 지표 삭제: C-013_foreign_equity_cap_state, C-013_foreign_equity_cap_vanban_chinhphu, C-013_investment_incentive_archive_doingbusiness, C-013_investment_incentive_hotropldn_thainguyen, C-013_investment_incentive_vanban_chinhphu, C-013_investment_incentive_vanban_chinhphu_2, C-013_investment_incentive_xaydungchinhsach_chinh, C-013_investment_treaty_archive_doingbusiness, C-013_investment_treaty_investmentpolicy_uncta, C-013_investment_treaty_state, C-013_profit_remittance
- 지표 추가: C-013_equity_cap, C-013_field_survey, C-013_incentive, C-013_law, C-013_remittance, C-013_treaty
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_근거문구, 기술_기술코드_판단근거_유형, 법령_공포_의결일_YYYY_MM_DD, 법령_대체_개정_관계, 법령_문서번호, 법령_발행_기관, 법령_법령명_국문, 법령_법령명_원문, 법령_상태, 법령_시행_연도_년, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_주요_내용, 송금_근거, 송금_내용, 송금_전제_조건, 송금_절차_통지, 송금_통화_경로, 송금_항목, 시장접근_금지_업종_개, 시장접근_외국인_시장접근_원칙, 시장접근_접근_조건_유형, 시장접근_제한_목록_구분, 시장접근_조건부_업종_개, 시장접근_조건부_업종_시행일_YYYY_MM_DD, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 인센티브_근거_법령, 인센티브_기간_년, 인센티브_내용, 인센티브_수치, 인센티브_우대_분야, 인센티브_우대_지역, 인센티브_우대_형태, 인센티브_인센티브_유형, 인센티브_지원_형태, 인센티브_특별_우대_대상, 지분_근거, 지분_상한_구분, 지분_업종, 지분_지분_상한, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 현지조사_근거_규정_소관기관, 현지조사_기타_참고_문헌, 현지조사_법정_조건_실무_기준, 현지조사_사업_운영_영향, 현지조사_표, 현지조사_항목, 협정_내용, 협정_발효일_YYYY_MM_DD, 협정_번호_번, 협정_상대국_당사자, 협정_상태, 협정_서명일_YYYY_MM_DD, 협정_약칭, 협정_원문_언어, 협정_유형, 협정_종료일_YYYY_MM_DD, 협정_협정명_원문

### C-014

- 지표 삭제: C-014_construction_permit, C-014_construction_permit_cost, C-014_construction_permit_duration_archive_doingbusiness, C-014_construction_permit_duration_congbao_chinhphu, C-014_construction_permit_duration_thuvienphapluat, C-014_eia_procedure_archive_doingbusiness, C-014_eia_procedure_congbao_chinhphu, C-014_eia_procedure_thuvienphapluat, C-014_land_acquisition, C-014_land_acquisition_cost, C-014_land_acquisition_duration, C-014_power_permit_archive_doingbusiness, C-014_power_permit_congbao_chinhphu, C-014_power_permit_cost, C-014_power_permit_duration_archive_doingbusiness, C-014_power_permit_duration_congbao_chinhphu
- 지표 추가: C-014_db_indicator, C-014_field_survey, C-014_permit_step, C-014_statutory_deadline
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 근거_공포_관보일, 근거_규율_대상, 근거_대체_개정_관계, 근거_법령_문서_번호, 근거_법령명_국문, 근거_법령명_원문, 근거_법령명_현지어, 근거_상태, 근거_유형_공통_분류, 근거_유형_원문_표기, 근거_정본_언어, 근거_조항, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 기준_전기요금_US_kWh, 기준_전력회사, 기준_조사_기준_시점, 기준_조사_도시, 기준_조사_도시_비고, 기준_케이스_정의, 기한_기산_기준, 기한_법정_처리기한_일, 기한_수수료_단위, 기한_수수료_상한, 기한_수수료_하한, 기한_승인_주체, 기한_처리기한_구분, 기한_허가_유효기간_년, 단계_단계_번, 단계_단계명_국문, 단계_단계명_원문, 단계_담당_기관_국문, 단계_담당_기관_원문, 단계_동시_진행, 단계_비용_산정_근거, 단계_비용_원문_표기, 단계_비용_현지통화, 단계_소요기간_원문_표기, 단계_소요기간_일, 단계_통화, 분류_ECC_유효기간_년, 분류_EIA_승인_심사기간_근무일, 분류_LCC_심사기간_기산_방식, 분류_LCC_심사기간_일, 분류_갱신_신청_시한_일, 분류_입지허가_LCC_필요_여부, 분류_최종_ECC_심사기간_근무일, 분류_환경_분류_등급, 분류_환경허가_ECC_심사기간_근무일, 수수료_갱신_수수료_비율_배, 수수료_신규_수수료, 수수료_적용_판본, 수수료_통화, 수수료_투자규모_구간, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_인허가_영역, 식별_행정_수준, 요금_규제기관, 요금_요금_개정_결정_공표_기한_일, 요금_요금_결정_청문_의무, 요금_회계연도당_개정_횟수_상한_회, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 지표_보조_지수, 지표_보조_지수_기준, 지표_비용, 지표_비용_기준, 지표_소요기간_일, 지표_실비용_통화, 지표_실비용_합계_현지통화, 지표_절차_수_개, 지표_지표_영역, 지표_지표_판본_기준_시점, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 토지_민간기관_목적_추가보상률, 토지_부수_손실_추가보상률, 토지_시장가_산정_기준기간_개월, 토지_정부_목적_추가보상률, 현지조사_산출물_증빙, 현지조사_소관기관, 현지조사_예상_일정, 현지조사_절차_마일스톤, 현지조사_참고_문헌, 현지조사_표, 현지조사_항목, 현지조사_핵심_요건

### C-015

- 지표 삭제: C-015_policy_document_link_datafiles_chinhphu, C-015_policy_document_link_datafiles_chinhphu_2, C-015_policy_document_link_erea, C-015_policy_document_link_moit, C-015_policy_document_link_vanban_chinhphu
- 지표 추가: C-015_field_survey, C-015_policy_document
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 관련_관련_데이터요소, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 링크_raw_보유_여부, 링크_raw_파일명, 링크_게재처, 링크_링크_유형, 링크_문서포털_URL, 링크_원문_PDF_URL, 링크_원문_URL, 문서_공포일_YYYY_MM_DD, 문서_대상_부문_원문, 문서_대체_개정_관계, 문서_문서_ID_CCLW_slug, 문서_문서명_국문, 문서_문서명_원문, 문서_문서번호, 문서_발행_기관, 문서_상태, 문서_시행_연도_년, 문서_시행일_YYYY_MM_DD, 문서_유형_공통_분류, 문서_유형_원문_표기, 문서_제정_연도_년, 문서_주요_내용, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_문서_구분, 식별_행정_수준, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 현지조사_RE_사업모델_영향, 현지조사_시행일_제정기관, 현지조사_참고_문헌, 현지조사_표, 현지조사_항목, 현지조사_핵심_조항

### C-016

- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: RPO_근거_조항, RPO_도입_상태, RPO_의무비율, 결측_framework_필수_속성_결측_코드_사유, 공표_공표_상태, 공표_자료명, 공표_재확보_대상_출처, 공표_확인_결과, 기관_기관_간_협조_사항, 기관_기관명_국문, 기관_기관명_원문, 기관_법정_역할_권한_범위, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 목표_구분, 목표_근거_조항, 목표_목표_단위_기준, 목표_목표값, 목표_목표연도_년, 목표_비중, 목표_비중_기준, 목표_비중_상한, 목표_비중_하한, 목표_용량_MW, 목표_용량_상한_MW, 목표_용량_하한_MW, 목표_전원_국문, 목표_전원_원문, 목표_조건_단서, 배분_근거, 배분_대상_기간, 배분_용량_MW, 배분_전원_국문, 배분_전원_원문, 설비_계통_구분, 설비_비중, 설비_연도_년, 설비_용량_MW, 설비_전원_국문, 설비_전원_원문, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 입찰_가격_단위, 입찰_가격_상한, 입찰_공고_문서번호, 입찰_공고_용량_MW, 입찰_공고일_YYYY_MM_DD, 입찰_낙찰_발표일_YYYY_MM_DD, 입찰_낙찰_사업자_수_건, 입찰_낙찰_용량_MW, 입찰_낙찰가_상한, 입찰_낙찰가_하한, 입찰_대상_기술, 입찰_라운드명_국문, 입찰_라운드명_원문, 입찰_사업명_소재지_원문, 입찰_입찰_단계, 입찰_입찰_마감일_YYYY_MM_DD, 입찰_입찰_조건, 입찰_저장_용량_MWh, 입찰_진행_상태, 입찰_패키지_번호, 입찰_회차, 제도_근거_조항, 제도_내용, 제도_제도_항목, 조달_근거_법령, 조달_내용, 조달_선정_방식, 조달_시점_YYYY_MM_DD, 조달_시행연도_년, 조달_조항, 조달_항목, 지역_권역, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 현지조사_내용, 현지조사_단계명, 현지조사_예상_소요기간, 현지조사_참고_문헌, 현지조사_평가_기준_관문_요건, 현지조사_표, 현지조사_표준_절차_요건, 현지조사_항목

### C-017

- 지표 삭제: C-017_implementing_agency_vanban_chinhphu, C-017_implementing_agency_vanban_chinhphu_2, C-017_implementing_agency_xaydungchinhsach_chinh, C-017_incentive_condition, C-017_incentive_status_datafiles_chinhphu, C-017_incentive_status_vanban_chinhphu, C-017_incentive_type_erea, C-017_incentive_type_vanban_chinhphu, C-017_target_technology_moit, C-017_target_technology_thuvienphapluat
- 지표 추가: C-017_incentive
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기간_시행일_YYYY_MM_DD, 기간_적용_기한_YYYY_MM_DD, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 세제_감면_기간_년, 세제_감면율, 세제_기타_비율, 세제_면제_기간_년, 세제_세율, 세제_적용_기간_년, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 요율_가격_단위, 요율_가격_상한, 요율_가격_하한, 제도_근거_법령_번호_국문_명칭, 제도_상태, 제도_시행_기관, 제도_유형, 제도_적용_조건_용량_기한_등_사업_요건, 제도_제도명_적용_대상, 지역_권역, 지역_지역_요건_판정, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치

### C-018 · 전용 렌더러

- 지표 삭제: C-018_energy_demand_projection_baochinhphu, C-018_energy_demand_projection_datafiles_chinhphu, C-018_energy_demand_projection_datafiles_chinhphu_2, C-018_energy_demand_projection_vanban_chinhphu, C-018_generation_capacity_plan, C-018_power_demand_growth, C-018_projection_agency, C-018_projection_scenario, C-018_re_share_target
- 지표 추가: C-018_capacity_plan, C-018_demand_projection, C-018_field_survey, C-018_outlook_source, C-018_re_target
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 계획_GDP_가정_케이스, 계획_계획_기간, 계획_계획_문서명, 계획_계획_문서명_원문, 계획_발행일, 계획_수립_기관, 계획_시나리오_케이스, 계획_중심_시나리오, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 목표_근거, 목표_근거_문구_원문, 목표_대상_연도_년, 목표_목표_대상, 목표_목표_유형, 목표_목표_주체, 목표_목표값, 목표_목표값_상한, 목표_목표값_하한, 목표_분모_정의, 목표_표기_한정어, 설비_대상_연도_년, 설비_비중, 설비_비중_상한, 설비_비중_하한, 설비_설비용량_MW, 설비_설비용량_상한_MW, 설비_설비용량_하한_MW, 설비_전원_국문, 설비_전원_원문, 설비_조건_비고, 성장률_CAGR_상한_년, 성장률_CAGR_하한_년, 성장률_산출_기준, 수요_대상_연도_년, 수요_발전량_GWh, 수요_비고, 수요_시나리오_구분, 수요_전력수요, 수요_전력수요_단위, 수요_전력수요_상한, 수요_전력수요_하한, 수출_달성_MW, 수출_상대국_국문, 수출_상대국_원문, 수출_수출_목표_MW, 수출_진행_계획, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 원단위_1인당_전력소비_kWh, 전망_값_내용, 전망_단위, 전망_문서_항목명, 전망_연도_년, 전망_유형_원천_분류, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분, 출처_확인_시점, 피크_최대전력_MW, 피크_최대전력_상한_MW, 피크_최대전력_하한_MW, 현지조사_2030_용량_목표, 현지조사_2050_비전_목표, 현지조사_이행_현황_병목, 현지조사_참고_문헌, 현지조사_표, 현지조사_항목

### C-019

- 지표 삭제: C-019_carbon_market_budget, C-019_carbon_price, C-019_carbon_tax_congbao_chinhphu, C-019_carbon_tax_datafiles_chinhphu, C-019_carbon_tax_documents1_worldbank, C-019_carbon_tax_mae, C-019_carbon_tax_vanban_chinhphu, C-019_ets_scope_mae, C-019_ets_scope_vanban_chinhphu, C-019_ets_status_carbonpricingdashboard, C-019_ets_status_hnx, C-019_ets_status_hnx_2, C-019_ets_status_mae, C-019_ets_status_vanban_chinhphu, C-019_ets_status_vanban_chinhphu_2, C-019_ets_status_vanban_chinhphu_3, C-019_re_support_scheme_carbonpricingdashboard, C-019_re_support_scheme_erea, C-019_re_support_scheme_vanban_chinhphu, C-019_re_support_scheme_vanban_chinhphu_2
- 지표 추가: C-019_budget, C-019_carbon_tax, C-019_ets_design, C-019_law, C-019_re_support
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: ETS_가격, ETS_가격_단위, ETS_거래대금, ETS_거래대금_단위, ETS_거래량, ETS_거래량_단위, ETS_근거, ETS_기준_연도_년, ETS_기한_시행일_YYYY_MM_DD, ETS_내용, ETS_배출예산_MtCO_e, ETS_비율, ETS_설계_항목, ETS_소관기관, ETS_시설_수_개, ETS_시작_년, ETS_종료_년, RE지원_근거_법령_문서, RE지원_내용, RE지원_도입_여부, RE지원_도입_연도_년, RE지원_목표_기준, RE지원_목표_연도_년, RE지원_재생에너지_비중_목표, RE지원_제도_유형, RE지원_종료_전환_연도_년, RE지원_현행_상태, 가격제_기준_시점, 가격제_도입_상태, 가격제_세율_USD_tCO_e, 가격제_원문_상태_표기, 가격제_원천_분류, 가격제_제도_구분, 가격제_확인_방법, 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 메커니즘_메커니즘_표준명, 메커니즘_비고, 메커니즘_시장_구분, 메커니즘_적격_근거, 법령_공포일_YYYY_MM_DD, 법령_기준_연도_년, 법령_문서번호, 법령_발행_기관, 법령_법령명_국문, 법령_법령명_원문, 법령_상태, 법령_시행_연도_년, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_적용_범위, 법령_주요_내용, 수수료_근거_조항, 수수료_내국_신청인, 수수료_단위, 수수료_수수료_항목, 수수료_시장_구분, 수수료_외국_신청인, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 예산_근거, 예산_금액, 예산_내용, 예산_통화, 예산_항목, 예산_회계연도_년, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 탄소세_과세_품목_국문, 탄소세_과세_품목_원문, 탄소세_근거, 탄소세_세율, 탄소세_세율_단위, 탄소세_실효_탄소가격_USD_tCO_e, 탄소세_적용_연도_년, 탄소세_조정_세율_1차, 탄소세_조정_세율_2차, 탄소세_조정_세율_적용_기간_1차, 탄소세_조정_세율_적용_기간_2차, 탄소세_품목_분류

### C-022

- 지표 삭제: C-022_carbon_market_readiness_carbonpricingdashboard, C-022_carbon_market_readiness_gspp_berkeley, C-022_carbon_market_readiness_mae, C-022_carbon_market_readiness_pmiclimate, C-022_carbon_market_readiness_vanban_chinhphu, C-022_carbon_market_readiness_vanban_chinhphu_2, C-022_carbon_market_readiness_vanban_chinhphu_3, C-022_carbon_market_readiness_worldbank
- 지표 추가: C-022_field_survey, C-022_inventory_facility, C-022_mrv_penalty, C-022_readiness_item, C-022_readiness_score
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 등록부_등록부, 등록부_등재_사업_수_건, 등록부_집계_기준, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_행정_수준, 인벤토리_근거, 인벤토리_부속서_III_A_건설부_소관_교통_개, 인벤토리_부속서_III_B_건설부_소관_건설_개, 인벤토리_부속서_II_산업무역부_소관_개, 인벤토리_부속서_IV_농업환경부_소관_개, 인벤토리_의무_인벤토리_시설_수_개, 인벤토리_지역명_원문, 제도_가격, 제도_가격_기준일, 제도_근거_문서, 제도_기준일, 제도_내용, 제도_배출_커버리지, 제도_상태, 제도_시행_연도_년, 제도_유형, 제도_적용_범위, 제도_제도_요소, 제도_제도명, 제재_과태료_단위, 제재_과태료_상한, 제재_과태료_하한, 제재_근거_조항, 제재_위반_유형, 제재_처분, 종합_미충족_개, 종합_부분_충족_개, 종합_산출식, 종합_종합_점수, 종합_충족_개, 종합_항목_수_개, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 체크리스트_raw_보유_여부, 체크리스트_구분, 체크리스트_근거_법령_자료, 체크리스트_기준_시점_년, 체크리스트_만점_점, 체크리스트_점수_점, 체크리스트_판정, 체크리스트_판정_근거, 체크리스트_항목_국문, 체크리스트_항목_번호_번, 체크리스트_항목_원문, 출처_기준_시점, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 현지조사_가격_재무_영향, 현지조사_개발자_투자자_시사점, 현지조사_구조적_격차_필요_역량, 현지조사_정량_정성_평가_기준, 현지조사_제도_범위_법적_근거, 현지조사_준비도_수준_Low_Med_High, 현지조사_준비도_차원, 현지조사_참고_문헌, 현지조사_표, 현지조사_항목, 현지조사_현황_운영_규칙

### C-024

- 지표 삭제: C-024_frel_submission, C-024_participating_fund_biocarbonfundisfl, C-024_participating_fund_en_baochinhphu, C-024_participating_fund_worldbank, C-024_rbp_result_en_baochinhphu, C-024_rbp_result_vanban_chinhphu, C-024_rbp_result_worldbank, C-024_redd_strategy, C-024_safeguard_system
- 지표 추가: C-024_erpa_province, C-024_rbp_program, C-024_readiness_element
- 엔티티 속성 삭제: 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성2_레코드ID, 속성3_값, 속성4_시점, 속성5_등록표준_출처, 속성6_분류, 속성7_상태, 속성8_사업자_기관, 속성9_방법론
- 엔티티 속성 추가: FREL_FREL_tCO_e_년, FREL_FRL_tCO_e_년, FREL_값_tCO_e_년, FREL_결과기간, FREL_기술분석_기술보고서_문서번호, FREL_기술평가_기간, FREL_기술평가_장소_방식, FREL_기술평가_후_기준선_tCO_e_년, FREL_기술평가보고서_문서번호, FREL_기준기간, FREL_대상_온실가스, FREL_대상_탄소풀, FREL_대상_활동, FREL_산정_자료, FREL_원_제출_기준선_tCO_e_년, FREL_제출_연도_년, FREL_제출_이력, FREL_항목, RBP_검증_감축량_MtCO_e, RBP_계약_승인_문서, RBP_계약_승인일_YYYY_MM_DD, RBP_계약_제안_물량_MtCO_e, RBP_기금_프로그램, RBP_단가_USD_tCO_e, RBP_대상_지역, RBP_수혜_대상, RBP_잉여_추가_물량_MtCO_e, RBP_지급_예정액_백만_USD, RBP_지급일_YYYY_MM_DD, RBP_참여_상태, 결측_framework_필수_속성_결측_코드_사유, 기금_기금명, 기금_참여_여부, 기금_확인_경로, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 성과_값, 성과_결과기간_총량_tCO_e, 성과_배출감축_결과_tCO_e_년, 성과_성과_제출량_tCO_e_년, 성과_성과기반지불_수령_실적, 성과_연간_순결과_tCO_e_년, 성과_연도_년, 성과_항목, 성과_확인_경로, 성과_흡수증진_결과_tCO_e_년, 식별_레코드ID, 식별_레코드_유형, 식별_레코드명, 식별_제출_회차, 식별_행정_수준, 요소_REDD_요소, 요소_근거, 요소_기준_연도_년, 요소_내용, 요소_문서_제출물, 요소_발행_제출_기관, 요소_상태_국문, 요소_상태_원문, 요소_제출_승인일_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_문서페이지_URL, 출처_원문_URL, 출처_원문_문서명, 출처_인용_위치, 출처_출처_구분

### C-025

- 지표 삭제: C-025_project_name_cdm_unfccc, C-025_project_name_cdm_unfccc_2, C-025_project_name_gspp_berkeley, C-025_project_name_jcm_jp, C-025_project_name_projects_globalcarbonc
- 지표 추가: C-025_credit_issuance, C-025_credit_project
- 엔티티 속성 삭제: methodology, projectId, proponent, standard, status, 기술코드_근거문구, 기술코드_판단근거_유형, 속성10_건수, 속성11_발행량_tCO2e, 속성12_소각량_tCO2e, 속성13_배분량_tCO2e, 속성14_연간예상감축_tCO2e, 속성15_빈티지_연도, 속성16_발행일, 속성17_크레딧기간, 속성18_업종, 속성19_원문URL, 속성1_레코드명, 속성20_지역_원문, 속성21_지역_현행, 속성22_행정코드P_code, 속성23_설명, 속성3_값, 속성4_시점, 속성6_분류
- 엔티티 속성 추가: 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 발행기록_기록_유형, 발행기록_모니터링_기간_시작_YYYY_MM_DD, 발행기록_모니터링_기간_종료_YYYY_MM_DD, 발행기록_발행_요청_상태, 발행기록_발행량_tCO_e, 발행기록_발행일_YYYY_MM_DD, 발행기록_소각량_tCO_e, 발행기록_연도_년, 사업_감축_제거_구분, 사업_기술_분야_등록부_분류, 사업_방법론, 사업_방법론_버전, 사업_사업_규모, 사업_사업_범주_등록부_분류, 사업_사업자_기관, 사업_연간_예상_감축량_tCO_e_년, 사업_적용_표준_버전, 식별_등록_표준, 식별_등록부_프로젝트ID, 식별_등재_상태, 식별_레코드ID, 식별_레코드_유형, 식별_프로젝트명, 실적_등록일_YYYY_MM_DD, 실적_발행량_tCO_e, 실적_발행일_YYYY_MM_DD, 실적_배분량_tCO_e, 실적_소각량_tCO_e, 실적_최초_빈티지_년, 실적_크레딧_기간_시작_YYYY_MM_DD, 실적_크레딧_기간_종료_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_원문, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 집계_값, 집계_구성_내역, 집계_기준_시점, 집계_단위, 집계_산출_근거, 집계_집계_항목, 출처_수집_경로_비고, 출처_원문_URL, 출처_원문_문서명, 출처_출처_구분

### D-002

- 지표 추가: D-002_re_share_electricity_capacity_pct, D-002_re_share_electricity_generation_pct, D-002_re_share_generation_cagr_2015_2025_pct
- 단위 변경 관측 8건

### D-013

- 지표 추가: D-013_epi_eco, D-013_epi_epi, D-013_epi_hlt
- 단위 변경 관측 4건

### D-019

- 지표 추가: D-019_ctcn_ta_request_registry
- 엔티티 속성 삭제: TA_수행내용_결과_요약, 기술_유형_상세페이지, 기술유형, 목적_구분_Objective, 상세, 실행기관
- 엔티티 속성 추가: CTF_배분액, D_021_연계_프로젝트번호, GEF_ID, GEF_승인액, GEF_주기, MDB_공동재원, 기타_공동재원, 목표, 베트남_귀속금액, 사업유형, 사업지_행정구역, 설비용량_MW, 수혜자_수, 승인_회계연도, 신탁기금, 요청기관, 인가기관_Agency, 인가기관_MDB, 전체사업_승인액_다국가_합산제외, 접근방식, 정부_부담, 좌표_성격, 지리적_범위, 지원유형, 지점, 초점분야_Focal_Areas, 총_사업비, 출처, 투자액_USD, 프로젝트_URL, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후

### D-020

- 엔티티 속성 삭제: 예상_수혜자_전망치_회복력_증진
- 엔티티 속성 추가: 38대_기후기술2, CTF_배분액, D_021_연계_프로젝트번호, GEF_ID, GEF_승인액, GEF_주기, MDB_공동재원, 구분태그2, 기술매핑_근거2, 기준연도2, 기타_공동재원, 베트남_귀속금액, 사업유형, 사업지_행정구역, 설비용량_MW, 수혜자_수, 승인_회계연도, 신탁기금, 예상_수혜자_전망치, 원지표ID2, 인가기관_Agency, 인가기관_MDB, 전체사업_승인액_다국가_합산제외, 정부_부담, 좌표_성격, 지점, 참고2, 초점분야_Focal_Areas, 총_사업비, 투자액_USD, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후

### D-021

- 엔티티 속성 삭제: DAC_섹터코드_사업기간_실행기관_Rio_Marker, DAC_섹터코드_참고_프로젝트번호_대응, WB_기후_주요_테마, 사업기간_실행기관_Rio_Marker
- 엔티티 속성 추가: 38대_기후기술2, CTF_배분액, DAC_섹터코드2, DAC_섹터코드_참고, D_021_연계_프로젝트번호, GEF_ID, GEF_승인액, GEF_주기, MDB_공동재원, WB_기후, 기술매핑_근거2, 기타_공동재원, 베트남_귀속금액, 사업기간2, 사업유형, 사업지_행정구역, 설비용량_MW, 수혜자_수, 승인_회계연도, 신탁기금, 인가기관_Agency, 인가기관_MDB, 전체사업_승인액_다국가_합산제외, 정부_부담, 좌표_성격, 지점, 초점분야_Focal_Areas, 총_사업비, 투자액_USD, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후

### D-023

- 지표 추가: D-023_climate_fund_approved_usd_mn, D-023_climate_fund_count, D-023_climate_fund_project_registry
- 엔티티 속성 삭제: 예상_수혜자_전망치_회복력_증진
- 엔티티 속성 추가: DAC_5자리, D_021_연계_프로젝트번호, 기금유형, 사업지_행정구역, 설비용량_MW, 세부분야, 수원기관, 승인액_USD_mn, 승인연도, 실행기관, 예상_수혜자_전망치, 자금유형, 전체사업_승인액_다국가_합산제외, 종료연도, 좌표_성격, 집행액_USD_mn, 출처, 투자액_USD, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후

### D-025

- 엔티티 속성 삭제: 민간_투자액_자체_산출
- 엔티티 속성 추가: 38대_기후기술2, CTF_배분액, D_021_연계_프로젝트번호, GEF_ID, GEF_승인액, GEF_주기, MDB_공동재원, 기술매핑_근거2, 기타_공동재원, 베트남_귀속금액, 사업유형, 사업지_행정구역, 설비용량_MW, 수혜자_수, 승인_회계연도, 신탁기금, 인가기관_Agency, 인가기관_MDB, 전체사업_승인액_다국가_합산제외, 정부_부담, 좌표_성격, 지점, 참고지표_민간_투자액_총투자액_민간지분율, 초점분야_Focal_Areas, 총_사업비, 투자액_USD, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후

### D-026

- 지표 속성 변경: D-026_miga_guarantee_registry(labelKo)
- 엔티티 속성 삭제: Project_ID, 국가, 단위, 링크, 보증_금액, 보증_기간, 보증_보유자_Guarantee_Holder, 보증_유형, 보증_유형_상세_4대_PRI_기준, 비고, 섹터, 이사회일, 전략_우선분야, 투자자_투자국, 환경등급, 회계연도_FY
- 엔티티 속성 추가: CTF_배분액, D_021_연계_프로젝트번호, GEF_ID, GEF_승인액, GEF_주기, MDB_공동재원, MIGA_공개문서_유형, 기타_공동재원, 베트남_귀속금액, 보증_총노출액_상한_USD, 보증보유자, 사업_내용, 사업유형, 사업지_행정구역, 설비용량_MW, 수원국, 수혜자_수, 승인_회계연도, 신탁기금, 이사회_예정일, 인가기관_Agency, 인가기관_MDB, 전략우선분야, 전체사업_승인액_다국가_합산제외, 정부_부담, 좌표_성격, 지점, 초점분야_Focal_Areas, 총_사업비, 투자국, 투자액_USD, 프로젝트ID, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 환경범주, 회계연도

### E-002

- 지표 추가: E-002_cdm_transition
- 지표 속성 변경: E-002_dna(spatialScope)
- 엔티티 속성 추가: CDM_전환_요청_건수, 대상_분야, 승인절차_기재_구분, 유치국_전환_승인_건수, 유형, 제6_4조_DNA_지정_현황, 제6_4조_등록_건수, 좌표_정밀도_출처

### E-005

- 지표 추가: E-005_research_institution
- 지표 속성 변경: E-005_partner_org(spatialScope)
- 엔티티 속성 추가: 국제협력_실적_구분_intl_coop_status, 기술코드_근거_대조_tech_evidence_check

### E-006

- 지표 삭제: E-006_private_investor_intl, E-006_private_investor_media
- 지표 추가: E-006_investor, E-006_investor_dfi, E-006_investor_intl, E-006_investor_media
- 지표 속성 변경: E-006_dfi(spatialScope), E-006_private_investor(labelKo·spatialScope)
- 엔티티 속성 추가: 좌표_소재_구분_coord_location_type

### E-008

- 지표 추가: E-008_paper_intl_coauth_rate
- 지표 속성 변경: E-008_paper(labelKo), E-008_patent(labelKo)
- 엔티티 속성 삭제: field_d7e5fb05
- 엔티티 속성 추가: 기준연도_논문_발행연도_특허_최초_출원연도

### E-009

- 지표 속성 변경: E-009_researcher_count(unit), E-009_researchers_per_million(unit)

### E-011

- 지표 추가: E-011_nri_governance_rank, E-011_nri_governance_score, E-011_nri_impact_rank, E-011_nri_impact_score, E-011_nri_overall_rank, E-011_nri_overall_score, E-011_nri_people_rank, E-011_nri_people_score, E-011_nri_technology_rank, E-011_nri_technology_score, E-011_trl
- 상태 변경: publicStatus data-entry-planned→public-authorized, dataPresenceStatus no-populated-record→actual-records, downloadAllowed false→true

### E-012 · 전용 렌더러

- 지표 추가: E-012_avg_monthly_wage_lcu_nat, E-012_avg_monthly_wage_usd_nat, E-012_occupation_employment_agri_total_nat, E-012_occupation_employment_all_total_nat, E-012_occupation_employment_armed_total, E-012_occupation_employment_clerk_total_nat, E-012_occupation_employment_craft_total_nat, E-012_occupation_employment_elem_total_nat, E-012_occupation_employment_mgr_total_nat, E-012_occupation_employment_operator_total_nat, E-012_occupation_employment_other_total_nat, E-012_occupation_employment_prof_total_nat, E-012_occupation_employment_service_total_nat, E-012_occupation_employment_share_agri_female_nat, E-012_occupation_employment_share_agri_male_nat, E-012_occupation_employment_share_agri_total_nat, E-012_occupation_employment_share_armed_female, E-012_occupation_employment_share_armed_male, E-012_occupation_employment_share_armed_total, E-012_occupation_employment_share_clerk_female_nat, E-012_occupation_employment_share_clerk_male_nat, E-012_occupation_employment_share_clerk_total_nat, E-012_occupation_employment_share_craft_female_nat, E-012_occupation_employment_share_craft_male_nat, E-012_occupation_employment_share_craft_total_nat, E-012_occupation_employment_share_elem_female_nat, E-012_occupation_employment_share_elem_male_nat, E-012_occupation_employment_share_elem_total_nat, E-012_occupation_employment_share_mgr_female_nat, E-012_occupation_employment_share_mgr_male_nat, E-012_occupation_employment_share_mgr_total_nat, E-012_occupation_employment_share_operator_female_nat, E-012_occupation_employment_share_operator_male_nat, E-012_occupation_employment_share_operator_total_nat, E-012_occupation_employment_share_other_female_nat, E-012_occupation_employment_share_other_male_nat, E-012_occupation_employment_share_other_total_nat, E-012_occupation_employment_share_prof_female_nat, E-012_occupation_employment_share_prof_male_nat, E-012_occupation_employment_share_prof_total_nat, E-012_occupation_employment_share_service_female_nat, E-012_occupation_employment_share_service_male_nat, E-012_occupation_employment_share_service_total_nat, E-012_occupation_employment_share_tech_female_nat, E-012_occupation_employment_share_tech_male_nat, E-012_occupation_employment_share_tech_total_nat, E-012_occupation_employment_share_unclass_female, E-012_occupation_employment_share_unclass_male, E-012_occupation_employment_share_unclass_total, E-012_occupation_employment_tech_total_nat, E-012_occupation_employment_unclass_total, E-012_occupation_female_share_agri_nat, E-012_occupation_female_share_all_nat, E-012_occupation_female_share_armed, E-012_occupation_female_share_clerk_nat, E-012_occupation_female_share_craft_nat, E-012_occupation_female_share_elem_nat, E-012_occupation_female_share_mgr_nat, E-012_occupation_female_share_operator_nat, E-012_occupation_female_share_other_nat, E-012_occupation_female_share_prof_nat, E-012_occupation_female_share_service_nat, E-012_occupation_female_share_tech_nat, E-012_occupation_female_share_unclass, E-012_occupation_wage_agri_female_nat, E-012_occupation_wage_agri_female_usd, E-012_occupation_wage_agri_male_nat, E-012_occupation_wage_agri_male_usd, E-012_occupation_wage_agri_total_nat, E-012_occupation_wage_agri_total_usd, E-012_occupation_wage_all_female_nat, E-012_occupation_wage_all_female_usd, E-012_occupation_wage_all_male_nat, E-012_occupation_wage_all_male_usd, E-012_occupation_wage_all_total_nat, E-012_occupation_wage_all_total_usd, E-012_occupation_wage_armed_female, E-012_occupation_wage_armed_female_usd, E-012_occupation_wage_armed_male, E-012_occupation_wage_armed_male_usd, E-012_occupation_wage_armed_total, E-012_occupation_wage_armed_total_usd, E-012_occupation_wage_clerk_female_nat, E-012_occupation_wage_clerk_female_usd, E-012_occupation_wage_clerk_male_nat, E-012_occupation_wage_clerk_male_usd, E-012_occupation_wage_clerk_total_nat, E-012_occupation_wage_clerk_total_usd, E-012_occupation_wage_craft_female_nat, E-012_occupation_wage_craft_female_usd, E-012_occupation_wage_craft_male_nat, E-012_occupation_wage_craft_male_usd, E-012_occupation_wage_craft_total_nat, E-012_occupation_wage_craft_total_usd, E-012_occupation_wage_elem_female_nat, E-012_occupation_wage_elem_female_usd, E-012_occupation_wage_elem_male_nat, E-012_occupation_wage_elem_male_usd, E-012_occupation_wage_elem_total_nat, E-012_occupation_wage_elem_total_usd, E-012_occupation_wage_mgr_female_nat, E-012_occupation_wage_mgr_female_usd, E-012_occupation_wage_mgr_male_nat, E-012_occupation_wage_mgr_male_usd, E-012_occupation_wage_mgr_total_nat, E-012_occupation_wage_mgr_total_usd, E-012_occupation_wage_operator_female_nat, E-012_occupation_wage_operator_female_usd, E-012_occupation_wage_operator_male_nat, E-012_occupation_wage_operator_male_usd, E-012_occupation_wage_operator_total_nat, E-012_occupation_wage_operator_total_usd, E-012_occupation_wage_other_female_nat, E-012_occupation_wage_other_male_nat, E-012_occupation_wage_other_total_nat, E-012_occupation_wage_prof_female_nat, E-012_occupation_wage_prof_female_usd, E-012_occupation_wage_prof_male_nat, E-012_occupation_wage_prof_male_usd, E-012_occupation_wage_prof_total_nat, E-012_occupation_wage_prof_total_usd, E-012_occupation_wage_service_female_nat, E-012_occupation_wage_service_female_usd, E-012_occupation_wage_service_male_nat, E-012_occupation_wage_service_male_usd, E-012_occupation_wage_service_total_nat, E-012_occupation_wage_service_total_usd, E-012_occupation_wage_tech_female_nat, E-012_occupation_wage_tech_female_usd, E-012_occupation_wage_tech_male_nat, E-012_occupation_wage_tech_male_usd, E-012_occupation_wage_tech_total_nat, E-012_occupation_wage_tech_total_usd, E-012_occupation_wage_unclass_female, E-012_occupation_wage_unclass_female_usd, E-012_occupation_wage_unclass_male, E-012_occupation_wage_unclass_male_usd, E-012_occupation_wage_unclass_total, E-012_occupation_wage_unclass_total_usd
- 지표 속성 변경: E-012_employed_persons(unit), E-012_occupation_wage_agri_female(unit), E-012_occupation_wage_agri_male(unit), E-012_occupation_wage_agri_total(unit), E-012_occupation_wage_all_female(unit), E-012_occupation_wage_all_male(unit), E-012_occupation_wage_all_total(unit), E-012_occupation_wage_clerk_female(unit), E-012_occupation_wage_clerk_male(unit), E-012_occupation_wage_clerk_total(unit), E-012_occupation_wage_craft_female(unit), E-012_occupation_wage_craft_male(unit), E-012_occupation_wage_craft_total(unit), E-012_occupation_wage_elem_female(unit), E-012_occupation_wage_elem_male(unit), E-012_occupation_wage_elem_total(unit), E-012_occupation_wage_mgr_female(unit), E-012_occupation_wage_mgr_male(unit), E-012_occupation_wage_mgr_total(unit), E-012_occupation_wage_operator_female(unit), E-012_occupation_wage_operator_male(unit), E-012_occupation_wage_operator_total(unit), E-012_occupation_wage_prof_female(unit), E-012_occupation_wage_prof_male(unit), E-012_occupation_wage_prof_total(unit), E-012_occupation_wage_service_female(unit), E-012_occupation_wage_service_male(unit), E-012_occupation_wage_service_total(unit), E-012_occupation_wage_tech_female(unit), E-012_occupation_wage_tech_male(unit), E-012_occupation_wage_tech_total(unit)

### E-018

- 지표 삭제: E-018_kr_company_entry_public
- 지표 추가: E-018_kr_company_entry_kotra
- 엔티티 속성 추가: KOTRA_업종_대분류, KOTRA_업종_중분류, KOTRA_진출형태, 기후기술_대분류, 기후기술_분류명, 좌표_구분_coord_type, 좌표_미확보_사유, 진출형태_구분, 현지_주소

### E-020

- 지표 속성 변경: E-020_kr_support(unit)
- 엔티티 속성 추가: 공통_프로그램명_program_name_std, 금액_종류_amount_type, 레코드_구분_record_kind, 신청시기_구분_period_type, 지원_유형_표준_support_type_std, 지원대상_구분_applicant_type, 프로그램_연결키_program_key

## 3. 제목 변경

없음.

## 4. 값 변경률 상위 20

| 요소 | 대조 관측 | 값 변경 | 변경률 | 표본(키: 현행→후보) |
|---|---|---|---|---|
| A-025 | 1 | 1 | 100% | A-025_ccs_facility_count|2026||v124-a-025-obs-00001: 5→1 |
| A-029 | 1 | 1 | 100% | A-029_fta_count|2026||v124-a-029-obs-00001: 19→30 |
| B-031 | 189 | 189 | 100% | B-031_prov_area_vn_27|2000|2000|v137-b-031-b-031_prov_area_vn_27-2000: 1057078→1057075.33 / B-031_prov_ext2000_vn_27|2000|2000|v137-b-031-b-031_prov_ext2000_vn_27-2000: 810949→810947.15 |
| B-032 | 63 | 63 | 100% | B-032_canopy_cover_prov_30_vn_22|2010|2010|v137-b-032-b-032_canopy_cover_prov_30_vn_22-2010: 65.94→64.77 / B-032_canopy_cover_prov_30_vn_61|2010|2010|v137-b-032-b-032_canopy_cover_prov_30_vn_61-2010: 3.71→6.42 |
| B-034 | 173 | 125 | 72.3% | B-034_prov_agb_carbon_stock_vn_22|2000|2000|v137-b-034-b-034_prov_agb_carbon_stock_vn_22: 114153020→114152801.86 / B-034_prov_agb_carbon_density_vn_22|2000|2000|v137-b-034-b-034_prov_agb_carbon_density_vn_22: 105→105.09 |
| D-002 | 8 | 5 | 62.5% | D-002_market_cagr_biomass|2030||v124-d-002-obs-00002: 22.8→27.1 / D-002_market_cagr_hydro|2030||v124-d-002-obs-00003: 6.1→5.8 |

