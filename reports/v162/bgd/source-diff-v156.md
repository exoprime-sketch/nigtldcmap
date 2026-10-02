# V156 원자료 갱신 diff — 2026-09-30 입고분

- 대조: `public/data/bgd/v2` → `.staging/v162-bgd/public/data/bgd/v2`
- 요소 152개 중 변화 없음 44개, 변화 108개
- 제목 변경 0개 · 스키마 영향 60개 · 전용 렌더러 영향 10개
- 지표 추가 482 · 지표 삭제 85 · 관측 추가 9679 · 관측 삭제 8213

## 1. 변화 요소 일람

| 요소 | 관측 | 엔티티 | 지표 | 값 변경 | 최신연도 | 영향 |
|---|---|---|---|---|---|---|
| A-002 | 348→348 | 0→0 | 12→12 | 0 | 2024→2024 |  |
| A-003 | 272→272 | 0→0 | 7→7 | 0 | 2025→2025 |  |
| A-004 | 33→33 | 0→0 | 2→2 | 0 | 2022→2022 |  |
| A-005 | 160→160 | 0→0 | 4→4 | 0 | 2025→2025 |  |
| A-006 | 133→133 | 0→0 | 4→4 | 0 | 2025→2025 |  |
| A-007 | 263→263 | 0→0 | 4→4 | 0 | 2025→2025 |  |
| A-008 | 32→32 | 0→0 | 1→1 | 0 | 2022→2022 |  |
| A-009 | 90→90 | 0→0 | 2→2 | 0 | 2024→2024 |  |
| A-010 | 310→310 | 0→0 | 8→8 | 0 | 2024→2024 |  |
| A-011 | 495→495 | 0→0 | 9→9 | 0 | 2024→2024 |  |
| A-012 | 103→103 | 0→0 | 3→3 | 0 | 2024→2024 |  |
| A-013 | 0→0 | 220→220 | 1→1 | 0 | —→— |  |
| A-017 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| A-019 | 34→34 | 0→0 | 1→1 | 0 | 2023→2023 |  |
| A-021 | 95→95 | 0→0 | 3→3 | 0 | 2024→2024 |  |
| A-022 | 32→32 | 0→0 | 4→4 | 0 | 2022→2022 |  |
| A-023 | 0→0 | 57→57 | 1→1 | 0 | —→— |  |
| A-025 | 1→1 | 1→1 | 2→2 | 0 | 2026→2026 |  |
| A-026 | 1→1 | 0→0 | 8→8 | 0 | 2023→2023 |  |
| A-030 | 144→144 | 0→0 | 4→4 | 0 | 2023→2023 |  |
| A-031 | 42→42 | 0→0 | 7→7 | 0 | 2022→2022 |  |
| A-032 | 54→54 | 0→0 | 4→4 | 0 | 2015→2015 |  |
| B-001 | 38→38 | 0→0 | 38→38 | 0 | 1991→1991 |  |
| B-002 | 11→32 | 32→93 | 12→34 | 0 | 2099→2099 |  스키마 |
| B-003 | 0→0 | 1125→1125 | 2→2 | 0 | —→— |  스키마 |
| B-004 | 0→0 | 4455→8424 | 2→4 | 0 | —→— |  |
| B-005 | 30→35 | 4455→5022 | 3→5 | 0 | 2020→2025 |  |
| B-006 | 0→0 | 4455→7290 | 2→4 | 0 | —→— |  스키마 |
| B-007 | 0→0 | 4455→7290 | 2→4 | 0 | —→— |  |
| B-008 | 0→0 | 1260→1260 | 1→1 | 0 | —→— |  스키마 |
| B-010 | 8→40 | 0→0 | 6→10 | 0 | 2024→2024 |  |
| B-012 | 0→0 | 367→367 | 1→1 | 0 | —→— |  |
| B-013 | 35→35 | 0→0 | 35→35 | 0 | 2022→2022 |  |
| B-014 | 19→0 | 0→18 | 18→6 | 0 | 2040→— |  스키마 |
| B-015 | 10→7 | 0→0 | 11→8 | 0 | 2025→2025 |  스키마 |
| B-016 | 45→45 | 0→0 | 2→2 | 0 | 2025→2025 |  |
| B-017 | 0→0 | 632→632 | 3→3 | 0 | —→— |  스키마 |
| B-018 | 282→282 | 0→0 | 24→24 | 0 | 2100→2100 |  |
| B-019 | 110→110 | 0→0 | 11→11 | 0 | 2100→2100 |  |
| B-020 | 2718→2718 | 0→0 | 324→324 | 0 | 2026→2026 |  |
| B-022 | 10→10 | 0→0 | 10→10 | 0 | 2050→2050 |  스키마 |
| B-023 | 0→0 | 558→558 | 1→1 | 0 | —→— |  |
| B-024 | 32→32 | 0→0 | 4→4 | 0 | 2023→2023 |  |
| B-025 | 0→0 | 67→67 | 2→2 | 0 | —→— |  |
| B-026 | 0→0 | 17→49 | 2→3 | 0 | —→— |  |
| B-027 | 35→35 | 0→0 | 3→3 | 0 | 2023→2023 |  |
| B-028 | 0→0 | 8→73 | 3→3 | 0 | —→— |  |
| B-029 | 0→0 | 165→181 | 2→4 | 0 | —→— |  스키마 |
| B-030 | 0→0 | 10→10 | 2→2 | 0 | —→— |  |
| B-031 | 0→0 | 9→9 | 2→2 | 0 | —→— |  스키마 |
| B-032 | 0→0 | 9→18 | 2→2 | 0 | —→— |  스키마 |
| B-033 | 0→0 | 379→379 | 5→5 | 0 | —→— |  |
| B-034 | 0→0 | 13→9 | 2→3 | 0 | —→— |  스키마 |
| B-035 | 897→897 | 279→279 | 28→28 | 0 | 2025→2025 |  스키마 |
| B-036 | 47→47 | 36→36 | 36→36 | 0 | 2024→2024 |  스키마 |
| B-037 | 0→0 | 684→684 | 2→2 | 0 | —→— |  스키마 |
| B-038 | 328→328 | 0→0 | 12→12 | 0 | 2050→2050 |  스키마 |
| B-039 | 0→0 | 152→152 | 2→3 | 0 | —→— |  스키마 |
| B-041 | 0→0 | 43→43 | 2→2 | 0 | —→— |  |
| B-042 | 0→0 | 82→106 | 2→3 | 0 | —→— |  |
| B-043 | 88→88 | 0→0 | 18→18 | 0 | 2026→2026 |  |
| B-044 | 6→1 | 0→21 | 6→2 | 0 | 2026→2026 |  스키마 |
| B-045 | 24→24 | 0→0 | 24→24 | 0 | 2025→2025 |  스키마 |
| B-046 | 6→0 | 0→21 | 6→1 | 0 | 2026→— |  스키마 |
| B-047 | 6→0 | 0→21 | 6→1 | 0 | 2025→— |  스키마 |
| B-048 | 0→0 | 3→3 | 1→1 | 0 | —→— |  스키마 |
| C-001 | 0→0 | 69→86 | 10→9 | 0 | —→— |  스키마 |
| C-002 | 0→0 | 51→76 | 7→6 | 0 | —→— |  스키마 |
| C-003 | 0→0 | 13→27 | 3→5 | 0 | —→— |  스키마 |
| C-005 | 0→0 | 36→36 | 5→5 | 0 | —→— |  스키마 |
| C-006 | 0→0 | 16→16 | 3→3 | 0 | —→— |  스키마 |
| C-007 | 0→0 | 2→2 | 2→2 | 0 | —→— |  스키마 |
| C-008 | 0→0 | 96→96 | 3→3 | 0 | —→— |  스키마 |
| C-011 | 0→0 | 19→0 | 8→0 | 0 | —→— |  스키마 |
| C-012 | 0→0 | 37→74 | 5→2 | 0 | —→— |  스키마 |
| C-014 | 0→0 | 36→0 | 7→0 | 0 | —→— |  스키마 |
| C-019 | 0→0 | 1→0 | 10→0 | 0 | —→— |  스키마 |
| C-024 | 0→0 | 7→7 | 4→4 | 0 | —→— |  스키마 |
| C-025 | 0→0 | 177→185 | 2→2 | 0 | —→— |  스키마 |
| D-003 | 0→65 | 0→207 | 0→68 | 0 | —→2035 |  스키마 |
| D-005 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| D-006 | 0→330 | 0→0 | 0→31 | 0 | —→2021 |  스키마 |
| D-007 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| D-008 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| D-009 | 0→64 | 0→0 | 0→48 | 0 | —→2016 |  스키마 |
| D-010 | 0→138 | 0→0 | 0→28 | 0 | —→2030 |  스키마 |
| D-011 | 0→552 | 0→0 | 0→110 | 0 | —→2024 |  스키마 |
| D-012 | 0→0 | 0→116 | 0→8 | 0 | —→— |  스키마 |
| D-013 | 0→3 | 0→0 | 0→26 | 0 | —→2026 |  스키마 |
| D-014 | 0→5 | 0→94 | 0→6 | 0 | —→2024 |  스키마 |
| D-015 | 0→5 | 0→1427 | 0→6 | 0 | —→2024 |  스키마 |
| D-016 | 0→6 | 0→370 | 0→7 | 0 | —→2024 |  스키마 |
| D-017 | 0→0 | 0→300 | 0→1 | 0 | —→— |  스키마 |
| D-018 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| D-019 | 0→6 | 0→7 | 0→7 | 0 | —→2026 |  스키마 |
| D-020 | 0→0 | 0→0 | 0→0 | 0 | —→— |  스키마 |
| D-021 | 0→4 | 0→542 | 0→5 | 0 | —→2026 |  스키마 |
| D-022 | 0→4 | 0→336 | 0→8 | 0 | —→2026 |  스키마 |
| D-023 | 0→2 | 0→49 | 0→15 | 0 | —→2025 |  스키마 |
| D-024 | 0→1 | 0→16 | 0→10 | 0 | —→2026 |  스키마 |
| D-025 | 0→49 | 0→0 | 0→10 | 0 | —→2024 |  스키마 |
| D-026 | 0→9 | 0→17 | 0→10 | 0 | —→2022 |  스키마 |
| E-008 | 1→1 | 544→544 | 3→3 | 0 | 2026→2026 |  |
| E-009 | 2→2 | 0→0 | 6→6 | 0 | —→— |  |
| E-010 | 24→178 | 0→0 | 24→24 | 0 | 2025→2025 |  |
| E-011 | 0→50 | 0→0 | 0→10 | 0 | —→2025 |  스키마 |
| E-012 | 759→759 | 0→0 | 134→134 | 0 | 2024→2024 |  |
| E-018 | 0→0 | 2→2 | 2→2 | 0 | —→— |  |

## 2. 스키마 파괴 변경(전용 렌더러·계약 영향)

### A-017

- 상태 변경: dataPresenceStatus partial-records→not-provided

### B-002

- 지표 추가: B-002_koppen_area_am_tropical_monsoon_1901_1930, B-002_koppen_area_am_tropical_monsoon_2071_2099_ssp2_4_5, B-002_koppen_area_am_tropical_monsoon_2071_2099_ssp5_8_5, B-002_koppen_area_aw_tropical_savanna_1901_1930, B-002_koppen_area_aw_tropical_savanna_2071_2099_ssp2_4_5, B-002_koppen_area_aw_tropical_savanna_2071_2099_ssp5_8_5, B-002_koppen_area_cwa_1901_1930, B-002_koppen_area_cwa_2071_2099_ssp2_4_5, B-002_koppen_area_cwa_2071_2099_ssp5_8_5, B-002_koppen_class_1901_1930, B-002_koppen_class_2071_2099_ssp2_4_5, B-002_koppen_class_2071_2099_ssp5_8_5, B-002_koppen_class_adm1, B-002_koppen_share_am_tropical_monsoon_1901_1930, B-002_koppen_share_am_tropical_monsoon_2071_2099_ssp2_4_5, B-002_koppen_share_am_tropical_monsoon_2071_2099_ssp5_8_5, B-002_koppen_share_aw_tropical_savanna_1901_1930, B-002_koppen_share_aw_tropical_savanna_2071_2099_ssp2_4_5, B-002_koppen_share_aw_tropical_savanna_2071_2099_ssp5_8_5, B-002_koppen_share_cwa_1901_1930, B-002_koppen_share_cwa_2071_2099_ssp2_4_5, B-002_koppen_share_cwa_2071_2099_ssp5_8_5
- 지표 속성 변경: B-002_koppen_area_am_tropical_monsoon(labelKo·unit), B-002_koppen_area_aw_tropical_savanna(labelKo·unit), B-002_koppen_area_cwa(labelKo·unit), B-002_koppen_share_am_tropical_monsoon(labelKo), B-002_koppen_share_aw_tropical_savanna(labelKo), B-002_koppen_share_cwa(labelKo), B-002_koppen_tropical_share_1991_2020(labelKo), B-002_koppen_tropical_share_2071_2099_ssp2_4_5(labelKo), B-002_koppen_tropical_share_2071_2099_ssp5_8_5(labelKo)
- 엔티티 속성 삭제: tech_id, 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 기후대_명칭, 기후대_점유_면적_km, 기후대_점유_비율, 기후대_코드

### B-003

- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: CCKP_집계단위명, 개편_후_소속_단위, 경계_면적_km

### B-006

- 지표 추가: B-006_climate_monthly_clim_adm1, B-006_climate_monthly_clim_national
- 엔티티 속성 삭제: 열대야_TR_23_일, 열대야_TR_29_일
- 엔티티 속성 추가: 10월, 11월, 12월, 1월, 2월, 3월, 4월, 5월, 6월, 7월, 8월, 9월, CCKP_집계단위명, 개편_후_소속_단위, 기간_평년, 단위, 변수_코드_CCKP, 변수명, 앙상블_통계, 열대야_TR_20_일

### B-008 · 전용 렌더러

- 엔티티 속성 삭제: PSMSL_관측소_ID, 관측소명_PSMSL, 소재_관구
- 엔티티 속성 추가: PSMSL_관측소_ID_격자점은_grid, 개편_후_소속_단위, 관측소명_PSMSL_격자점, 소재_ADM1_판정, 소재_설명, 좌표_성격

### B-014

- 지표 삭제: B-014_carbon_price_path, B-014_emission_reduction_ct10, B-014_emission_reduction_ct25, B-014_energy_price_increase_coal_ct10, B-014_energy_price_increase_coal_ct25, B-014_energy_price_increase_electricity_ct10, B-014_energy_price_increase_electricity_ct25, B-014_energy_price_increase_gas_ct10, B-014_energy_price_increase_gas_ct25, B-014_energy_price_increase_gasoline_ct10, B-014_energy_price_increase_gasoline_ct25, B-014_gdp_impact_ct10, B-014_gdp_impact_ct25, B-014_gdp_net_benefit_ct10, B-014_gdp_net_benefit_ct25, B-014_revenue_cumulative, B-014_revenue_gdp_share_max, B-014_revenue_gdp_share_min
- 지표 추가: B-014_carbon_price, B-014_emission_change, B-014_energy_price_change, B-014_gdp_change, B-014_gdp_net_benefit, B-014_tax_revenue_gdp
- 엔티티 속성 추가: 값, 값_구분, 값_범위_상한, 기후기술_연계_근거, 단위, 단위_정의_비고, 레코드_키, 세부_구분, 시나리오_명칭_원천, 시나리오_유형_표준, 시나리오_코드, 연도, 원천_근거_위치
- 상태 변경: publicStatus partial→actual, dataPresenceStatus partial-records→actual-records

### B-015

- 지표 삭제: B-015_covered_facilities_01, B-015_covered_facilities_02, B-015_covered_facilities_03, B-015_covered_facilities_04, B-015_ets_status_01, B-015_ets_status_02, B-015_ets_status_03, B-015_ets_status_04
- 지표 추가: B-015_covered_facilities_cement, B-015_covered_facilities_power, B-015_covered_facilities_steel, B-015_covered_facilities_total, B-015_ets_status

### B-017

- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km

### B-022

- 지표 삭제: B-022_financing_source_g01, B-022_financing_source_g02, B-022_financing_source_g03
- 지표 추가: B-022_financing_external, B-022_financing_private, B-022_financing_public
- 지표 속성 변경: B-022_adaptation_investment(unit), B-022_gdp_loss_max(labelKo), B-022_gdp_loss_min(labelKo), B-022_total_investment(labelKo·unit)

### B-029

- 지표 추가: B-029_mangrove_adm1, B-029_primary_extent_adm1
- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 1차림_비율_2001, 개편_후_소속_단위, 경계_면적_km, 맹그로브_면적_1996_ha, 맹그로브_면적_2020_ha, 습윤열대_1차림_면적_2001_ha, 이탄지_비율

### B-031

- 지표 속성 변경: B-031_forest_extent_national(labelKo)
- 엔티티 속성 삭제: 경계_면적_km_GADM, 레코드_키_GADM_GID_1
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 레코드_키

### B-032

- 지표 속성 변경: B-032_canopy_cover_national(labelKo)
- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 기준연도, 분석대상_면적_ha, 수관_면적_ha

### B-034

- 지표 추가: B-034_cci_agb_adm1
- 지표 속성 변경: B-034_forest_carbon_national(labelKo·unit)
- 엔티티 속성 삭제: 산림탄소_순플럭스_Mg_CO2e_yr, 산림탄소_총배출_Mg_CO2e_yr, 산림탄소_총흡수_Mg_CO2_yr
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km, 산림탄소_순플럭스_Mg_CO2e, 산림탄소_총배출_Mg_CO2e, 산림탄소_총흡수_Mg_CO2, 수관_면적_2000_ha, 지상부_바이오매스_AGB_Mg_ESA_CCI, 지상부_바이오매스_밀도_Mg_ha_ESA_CCI

### B-035

- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km

### B-036

- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km

### B-037

- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km

### B-038

- 지표 삭제: B-038_aux_msw_collection
- 지표 추가: B-038_aux_msw_collection_pop

### B-039

- 지표 삭제: B-039_hydropower_national
- 지표 추가: B-039_hydropower_national_installed, B-039_hydropower_national_potential
- 엔티티 속성 삭제: 경계_면적_km_GADM
- 엔티티 속성 추가: 개편_후_소속_단위, 경계_면적_km

### B-044

- 지표 삭제: B-044_mineral_presence_cobalt, B-044_mineral_presence_copper, B-044_mineral_presence_lithium, B-044_mineral_presence_manganese, B-044_mineral_presence_nickel, B-044_mineral_presence_rare_earths
- 지표 추가: B-044_mineral_export_regime, B-044_mineral_record
- 엔티티 속성 추가: 20종_기준_광물_여부, MRDS_등재_지점_수, 값_성격, 광종_USGS_영문, 광종_표준, 기후기술_연계_근거, 데이터검토코드, 레코드_키, 매장량_기준연도, 매장량_단위, 매장량_최신, 범위_구분_매장_생산, 범위_단위, 부존_상태, 생산량_단위, 생산량_연도, 생산량_최신, 수량_범위_상한, 수량_범위_하한, 수출규제_근거_법령_범위, 수출규제_대상_여부, 수출규제_출처_URL_조사일_신뢰도, 원_지표_ID, 원천_기관_판

### B-045

- 지표 속성 변경: B-045_production_rank_cobalt(unit), B-045_production_rank_copper(unit), B-045_production_rank_lithium(unit), B-045_production_rank_manganese(unit), B-045_production_rank_nickel(unit), B-045_production_rank_rare_earths(unit), B-045_reserve_rank_cobalt(unit), B-045_reserve_rank_copper(unit), B-045_reserve_rank_lithium(unit), B-045_reserve_rank_manganese(unit), B-045_reserve_rank_nickel(unit), B-045_reserve_rank_rare_earths(unit)

### B-046 · 전용 렌더러

- 지표 삭제: B-046_reserves_cobalt, B-046_reserves_copper, B-046_reserves_lithium, B-046_reserves_manganese, B-046_reserves_nickel, B-046_reserves_rare_earths
- 지표 추가: B-046_reserves_record
- 엔티티 속성 추가: 20종_기준_광물_여부, 값, 값_성격, 광종_USGS_영문, 광종_세부_원천_표기, 광종_표준, 기후기술_연계_근거, 나열국_수, 단위, 데이터검토코드, 레코드_키, 세계_비중, 세계_순위_나열국_중, 연도, 원_지표_ID, 원천_기관_판, 원천_위치, 통일_단위_값_t, 환산_기준_함량_광석
- 상태 변경: publicStatus schema-only→actual, dataPresenceStatus no-populated-record→actual-records

### B-047 · 전용 렌더러

- 지표 삭제: B-047_production_cobalt, B-047_production_copper, B-047_production_lithium, B-047_production_manganese, B-047_production_nickel, B-047_production_rare_earths
- 지표 추가: B-047_production_record
- 엔티티 속성 추가: 20종_기준_광물_여부, 값, 값_성격, 광종_USGS_영문, 광종_세부_원천_표기, 광종_표준, 기후기술_연계_근거, 나열국_수, 단위, 데이터검토코드, 레코드_키, 세계_비중, 세계_순위_나열국_중, 연도, 원_지표_ID, 원천_기관_판, 원천_위치, 통일_단위_값_t, 환산_기준_함량_광석
- 상태 변경: publicStatus schema-only→actual, dataPresenceStatus no-populated-record→actual-records

### B-048

- 엔티티 속성 삭제: 소재_행정구역_관구
- 엔티티 속성 추가: 개편_후_소속_단위, 소재_행정구역_ADM1, 좌표_성격

### C-001

- 지표 삭제: C-001_adaptation_sector, C-001_adaptation_summary
- 지표 추가: C-001_adaptation
- 엔티티 속성 삭제: 링크_raw_파일명, 목표_NDC_판, 목표_기준_연도_년, 목표_목표_연도_년, 부문_무조건부_감축량_MtCO_eq, 부문_조건부_감축량_MtCO_eq, 재원_무조건부_소요_십억_USD, 재원_조건부_소요_십억_USD, 재원_총_소요_십억_USD, 정량목표_NDC_판, 제출_NDC_판, 제출_원문_URL, 지역_행정코드_P_code
- 엔티티 속성 추가: SDG_연계_개수_개, SDG_연계_목록, 목표_GHG_감축_목표_원문_표기, 목표_NDC_요약, 목표_감축_기여_유형, 목표_기준연도_목표, 목표기준_GWP_기준, 목표기준_기준_연도_년, 목표기준_대상_GHG_목록, 목표기준_대상_GHG_종수_종, 목표기준_대상_부문_목록, 목표기준_대상_부문_수_개, 목표기준_목표_연도_년, 목표기준_세계_배출량_대비_비중, 목표기준_이행기간_시작일_YYYY_MM_DD, 목표기준_이행기간_종료일_YYYY_MM_DD, 목표기준_적용_범위, 부문_BAU_대비_감축률, 부문_감축량_MtCO_eq, 부문_대상_연도_년, 부문_소요재원_백만_USD, 부문_조건_구분, 수단_조치_선정_기준, 식별_NDC_판, 식별_레코드_유형, 식별_현행_여부_Y_N, 재원_구분, 재원_금액, 재원_단위, 재원_대상_기간, 재원_원문_표기, 재원_재원조달_유형_목록, 재원_재원조달_유형_수_개, 재원_항목, 적응_세부계획_근거, 적응_적응_포함_여부, 적응_적응목표_유형, 제출_NDC_등록부_URL, 제출_제출_문서명_원문, 제출_제출본_유형, 제출_제출본명_국문, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_원문_URL, 출처_출처_구분

### C-002

- 지표 삭제: C-002_ndc_reduction_sector
- 엔티티 속성 삭제: 감축_계획_Planned_MtCO_eq, 감축_연도_년, 감축_이행완료_Implemented_MtCO_eq, 감축_채택_Adopted_MtCO_eq, 감축_합계_Grand_Total_MtCO_eq, 링크_raw_파일명, 부문감축_2022년_MtCO_eq, 부문감축_2024년_MtCO_eq, 부문감축_2030년_MtCO_eq, 부문감축_부문, 부문감축_이행_상태, 인벤토리_CH_ktCO_eq, 인벤토리_CO_ktCO_eq, 인벤토리_HFCs_ktCO_eq, 인벤토리_IPPU_ktCO_eq, 인벤토리_LULUCF_ktCO_eq, 인벤토리_N_O_ktCO_eq, 인벤토리_농업_ktCO_eq, 인벤토리_에너지_ktCO_eq, 인벤토리_총계_MtCO_eq, 인벤토리_총계_ktCO_eq, 인벤토리_폐기물_ktCO_eq, 재원_금액_백만_USD, 제출_원문_URL, 지역_행정코드_P_code
- 엔티티 속성 추가: 감축_값_MtCO_eq, 감축_대상_연도_년, 감축_부문, 감축_이행_상태, 식별_레코드_유형, 인벤토리_AFOLU_합계, 인벤토리_CH, 인벤토리_CO, 인벤토리_GWP_기준, 인벤토리_HFCs, 인벤토리_IPPU, 인벤토리_LULUCF, 인벤토리_LULUCF_처리, 인벤토리_N_O, 인벤토리_기타_부문, 인벤토리_농업, 인벤토리_단위, 인벤토리_산정_가이드라인, 인벤토리_에너지, 인벤토리_총계_MtCO_eq_표기, 인벤토리_총배출량_LULUCF_제외, 인벤토리_총배출량_LULUCF_포함, 인벤토리_폐기물, 재원_금액, 재원_단위, 재원_부가_정보, 적응_기후변화_대응_사업_건수_건, 적응_사업_집계_기간, 전망_단위, 제출_값_제출_정보, 제출_문서_구분, 제출_보고서_계열, 제출_보고서명_원문, 제출_작성_주관기관, 제출_제출차수_회, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_출처_구분

### C-003

- 지표 삭제: C-003_priority_sector
- 지표 추가: C-003_composition, C-003_finance, C-003_sector_vulnerability
- 엔티티 속성 삭제: M_E_계획_갱신_주기_년, M_E_보고_산출물, M_E_보고주기, M_E_체계_구조, 거버넌스_기구명_원문, 구성_고우선순위_과제_수_개, 구성_기후스트레스_지역_수_개, 구성_주제_부문_수_개, 구성_중우선순위_과제_수_개, 구성_총_개입_과제_수_개, 부문_개입코드_접두, 부문_부문명_국문, 부문_원문_근거_절, 재원_연평균_소요_십억_USD, 재원_총_소요_2023_2050_십억_BDT, 재원_총_소요_2023_2050_십억_USD, 재원_현행_지출_대비_배수_배, 제출_이행기간_년, 제출_작성_발간기관, 지역_행정코드_P_code, 참여_이해관계자_협의_횟수_회, 참여_참여자_수_명, 참여_포용_대상, 참여_핵심정보제공자_인터뷰_FGD_횟수_회, 참여_협의_기간
- 엔티티 속성 추가: M_E_내용, M_E_법적_근거, M_E_법적_근거_승인일_YYYY_MM_DD, M_E_보고_수단_산출물, M_E_보고_주기_시한, M_E_종합_평가_주기_년, M_E_지표_수_개, M_E_지표군_수_개, M_E_항목, 거버넌스_근거, 거버넌스_기구_기관명_국문, 거버넌스_기구_기관명_원문, 과제_과제_번호, 과제_과제군_번호, 과제_과제군명_국문, 과제_과제군명_원문, 과제_과제명_국문, 과제_과제명_원문, 과제_단계_구분_1기, 과제_단계_구분_2기, 과제_단계별_성과_1기, 과제_단계별_성과_2기, 과제_단계별_성과_기타, 과제_목표_번호, 과제_목표명_국문, 과제_세부과제_내용_원문, 과제_세부과제_순번, 과제_우선순위, 과제_이행_시작연도_년, 과제_이행_종료연도_년, 과제_이행시기_구분, 과제_주관기관_국문, 과제_주관기관_원문, 구성_값, 구성_근거, 구성_단위, 구성_항목, 식별_레코드_유형, 재원_금액, 재원_단위, 재원_대상_기간, 재원_부문, 재원_산출_기준, 재원_재원_구분, 재원_통화, 재원_항목, 제출_UNFCCC_NAP_Central_등재일_YYYY_MM_DD, 제출_국가_구분, 제출_등재_연도_년, 제출_문서명_원문, 제출_비전_목표연도_년, 제출_승인_결정번호, 제출_승인_연도_년, 제출_승인일_YYYY_MM_DD, 제출_작성_주관기관, 젠더_내용, 젠더_여성_명시_M_E_지표_수_개, 젠더_젠더_여성_명시_세부과제_수_개, 젠더_젠더_전담_과제군, 젠더_취약계층_포용_대상, 젠더_항목, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 지표_담당기관_국문, 지표_담당기관_원문, 지표_지표_내용_원문, 지표_지표_번호, 지표_지표군_번호, 지표_지표군명_국문, 지표_지표군명_원문, 지표_평가_대상_번호, 지표_평가_대상_원문, 출처_raw_파일명, 출처_문서페이지_URL, 출처_출처_구분, 취약성_부문_개입코드_접두, 취약성_부문_대상명_국문, 취약성_부문_대상명_원문, 취약성_우선_과제_구분, 취약성_우선_과제_내용, 취약성_원문_절, 취약성_원문_쪽_p, 취약성_정량_영향_원문_발췌, 취약성_주요_영향_국문_요약, 취약성_평가_대상_유형

### C-005

- 지표 삭제: C-005_priority_technology
- 지표 추가: C-005_priority_tech
- 엔티티 속성 삭제: 기술_가중점수_산정_기준, 기술_가중점수_점, 기술_구분_감축_적응, 기술_대상_부문, 기술코드_판단_근거, 기술코드_판단_유형, 링크_raw_파일명, 링크_게재처, 문서_문서_유형, 문서_발간_시점, 문서_원문_URL, 부문_구분_감축_적응, 사이클_TNA_사이클, 사이클_감축_TNA_완료_시점, 사이클_근거, 사이클_기술실행계획_TAP_보유, 사이클_수행_여부, 사이클_적응_TNA_완료_시점, 장벽_내용, 장벽_장벽_유형, 지역_행정코드_P_code
- 엔티티 속성 추가: 기술_기술명_영문, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 기술_선정_단계, 기술_평가_점수_산정_기준, 기술_평가_점수_점, 문서_게재처, 문서_문서명_국문, 문서_발간_연도_년, 문서_유형_공통_분류, 문서_유형_원문_표기, 부문_대상_부문, 수행_TNA_수행_여부, 수행_감축_TNA_완료_시점, 수행_근거, 수행_기술실행계획_TAP_보유, 수행_사이클_연도_년, 수행_사이클명_국문, 수행_사이클명_원문, 수행_우선_섹터_목록, 수행_우선_섹터_수_개, 수행_적응_TNA_완료_시점, 수행_제출본명, 수행_총괄기관, 식별_TNA_차수_사이클, 식별_감축_적응_구분, 식별_레코드_유형, 장벽_대상_기술, 장벽_장벽_내용, 장벽_장벽_분류, 장벽_장벽_수준, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_원문_URL, 출처_출처_구분

### C-006

- 지표 삭제: C-006_transition_activity
- 지표 추가: C-006_activity
- 엔티티 속성 삭제: 사업_CDM_등록일_YYYY_MM_DD, 사업_CDM_등록취소일_YYYY_MM_DD, 사업_연간_추정_감축량_tCO_e, 사업_협력_당사국_Other_Party, 사업_활동명_원문, 지역_행정코드_P_code, 체계_구성요소, 체계_상태_값, 협정_방글라데시_소관기관, 협정_상대_당사자, 협정_상대_소관기관, 협정_체결일_YYYY_MM_DD, 협정_협정_문서명
- 엔티티 속성 추가: 법령_공포일_YYYY_MM_DD, 법령_문서명_국문, 법령_문서명_원문, 법령_문서번호, 법령_발령기관, 법령_시행일_YYYY_MM_DD, 법령_제6조_관련_역할, 사업_등록_상태, 사업_등록일, 사업_등록취소일, 사업_메커니즘, 사업_사업명_원문, 사업_사업번호, 사업_상대국_참여기업, 사업_소재지, 사업_수량_단위, 사업_승인_발행량, 사업_시작일, 사업_이전_기간, 사업_협력_당사국, 사업_호스트_참여기업, 식별_레코드_유형, 실적_ITMO_이전_실적, 실적_발행_크레딧_총량, 실적_상대국_배분량, 실적_수량_단위, 실적_실적_기준일_YYYY_MM_DD, 실적_자국_배분량, 전환_값, 전환_기준_시점, 전환_내역, 전환_항목, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 체계_구축_상태, 체계_내용, 체계_제출_지정일_YYYY_MM_DD, 체계_항목, 출처_raw_파일명, 출처_문서페이지_URL, 출처_출처_구분, 협정_UNFCCC_CARP_협력접근법_ID, 협정_국내_승인, 협정_기준_시점, 협정_내용, 협정_상대_소관_승인기관, 협정_상대국_당사자, 협정_자국_소관_승인기관, 협정_초기보고서_제출_당사국_일자, 협정_최신_문서_개정일_YYYY_MM_DD, 협정_최초_체결일_YYYY_MM_DD, 협정_협정명_국문, 협정_협정명_원문

### C-007

- 엔티티 속성 삭제: 기술_기술코드_근거문구, 기술_기술코드_판단근거_유형, 방글라데시_국가연락창구_NFP_기관, 방글라데시_근거, 방글라데시_대상_분야_감축_적응_재정_기술_역량, 방글라데시_등록_일자_YYYY_MM_DD, 방글라데시_등재_활동_수_건, 방글라데시_참여_여부, 방글라데시_참여_지위
- 엔티티 속성 추가: 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 식별_행정_수준, 지역_지역명_개편_전, 지역_지역명_현행, 지역_행정코드_개편_전, 지역_행정코드_현행, 참여_국가연락창구_NFP_기관, 참여_근거, 참여_기준_시점, 참여_대상_분야_감축_적응_재정_기술_역량, 참여_등록_일자_YYYY_MM_DD, 참여_등재_활동_수_건, 참여_참여_기관, 참여_참여_실적, 참여_참여_여부, 참여_참여_지위, 참여_플랫폼_URL, 출처_문서페이지_URL, 출처_출처_구분, 플랫폼_기준_시점, 활동_기관_구분_원문, 활동_대상_분야_감축_적응_재정_기술_역량, 활동_등록일_YYYY_MM_DD, 활동_등록일_원문_표기, 활동_부문_원문, 활동_비당사국_참여기관, 활동_제출_당사국, 활동_참여_당사국_host_표시, 활동_초점_분야_원문, 활동_플랫폼_등록_ID, 활동_활동명_국문, 활동_활동명_원문

### C-008

- 엔티티 속성 삭제: 링크_raw_파일명, 링크_원문_URL, 속성_인구_명, 지역_행정코드_P_code, 행위자_GCAP_ID, 행위자_명칭_원문
- 엔티티 속성 추가: 식별_레코드_유형, 이니셔티브_기후_분야_감축_적응, 이니셔티브_등재_플랫폼_근거, 이니셔티브_설명_원문, 이니셔티브_시작_연도_년, 이니셔티브_운영_상태_NAZCA_status, 이니셔티브_이니셔티브_ID, 이니셔티브_이니셔티브명_국문, 이니셔티브_이니셔티브명_원문, 이니셔티브_종료_연도_년, 이니셔티브_주요_내용_한_줄_설명, 이니셔티브_주제, 이니셔티브_참여_국가_기관_목록, 이니셔티브_참여_상태, 이니셔티브_참여_서명일_YYYY_MM_DD, 이니셔티브_참여_연도_년, 이니셔티브_참여_형태, 이니셔티브_최신_갱신_연도_년, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 집계_구성_내역, 참여_공약_수_건, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_출처_구분, 행위자_GCAP_NAZCA_ID, 행위자_기관명_원문, 행위자_인구_명, 행위자_프로필_URL

### C-011

- 지표 삭제: C-011_alert_history, C-011_alert_scale, C-011_emergency_contact, C-011_homicide_rate, C-011_notice, C-011_security_assessment, C-011_statistics_availability, C-011_travel_alert
- 엔티티 속성 삭제: tech_id, 결측_framework_필수_속성_결측_코드_사유, 경보_경보_등급, 경보_기준_갱신일, 경보_대상_지역_국문, 경보_대상_지역_원문, 경보_등급_명칭, 경보_발령기관, 경보_지역별_차등_여부, 공지_게재일_YYYY_MM_DD, 공지_공지_제목, 공표_공표_상태, 공표_자료명, 공표_재확보_대상_출처, 공표_확인_결과, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 데이터검토코드, 등급체계_단계, 등급체계_명칭, 등급체계_발령_성격, 등급체계_색상_구분, 링크_raw_파일명, 링크_원문_URL, 식별_레코드ID, 식별_레코드명, 식별_행정_수준, 연락처_값, 연락처_구분, 연락처_기관_시설명, 이력_변경_내용, 이력_변경_유형, 이력_변경일_YYYY_MM_DD, 지역_지역명_현행, 지역_행정코드_P_code, 출처_원문_문서명, 출처_인용_위치, 치안_내용, 치안_정량값, 치안_정량값_기준_연도_년, 치안_정량값_단위, 치안_평가_항목, 통계_고의살인율_건_10만명, 통계_연도_년
- 상태 변경: downloadAllowed true→false

### C-012 · 전용 렌더러

- 지표 삭제: C-012_framework_provision, C-012_ppi_investment, C-012_ppp_agency, C-012_ppp_document, C-012_procurement_method
- 지표 추가: C-012_law, C-012_ppi_summary
- 엔티티 속성 삭제: 규정_실무_처리_방식, 규정_조항_항목, 규정_존부, 규정_확인_대상_문서, 기관_관리_운영_주체, 기관_권한_규범_제정, 기관_권한_사업_관리, 기관_권한_재정_참여, 기관_권한_조달_계약, 기관_기관명_원문, 기관_법적_지위, 기관_본부_소재지, 기관_설치_근거_조항, 기관_이사회_구성, 기관_이사회_구성원_수_명, 데이터검토코드, 링크_raw_파일명, 링크_원문_URL, 문서_관보_게재, 문서_문서명_국문, 문서_문서명_벵골어, 문서_문서명_원문, 문서_문서번호, 문서_발령기관, 문서_상태, 문서_유형, 문서_정본_언어, 문서_제정_공포_연도_년, 문서_주요_내용, 식별_행정_수준, 실적_ICT_GDP_비중, 실적_ICT_백만_USD, 실적_교통_GDP_비중, 실적_교통_백만_USD, 실적_상하수_GDP_비중, 실적_상하수_백만_USD, 실적_에너지_GDP_비중, 실적_에너지_백만_USD, 실적_총투자_백만_USD, 조달_근거_조항, 조달_숏리스트_상한_개사, 조달_입찰_절차_유형, 조달_절차_구성, 지역_행정코드_P_code
- 엔티티 속성 추가: 법령_개정_대상_관계, 법령_공포일_YYYY_MM_DD, 법령_문서번호, 법령_발행_기관, 법령_법령명_국문, 법령_법령명_원문, 법령_상태, 법령_시행_연도_년, 법령_시행일_YYYY_MM_DD, 법령_유형_공통_분류, 법령_유형_원문_표기, 법령_주요_내용, 식별_레코드_유형, 실적_GDP_비중, 실적_구분, 실적_대상_기간, 실적_부가_정보, 실적_부문_원문, 실적_사업_수_건, 실적_투자액_백만_USD, 요약_PPP_법률_유무, 요약_VfM_평가_의무, 요약_계약_유형, 요약_근거_법률명_문서번호, 요약_근거_조항, 요약_대상_분야, 요약_사업_건수_건, 요약_전담기관_PPP_Unit, 요약_조달_방식, 요약_주요_내용, 요약_총_투자액_백만_USD, 요약_최근_재무종결_연도_년, 요약_최신_개정, 요약_투자_우대_보장, 제도_PPP_대상_분야, 제도_VfM_의무_조항, 제도_계약_유형, 제도_권한기관, 제도_분쟁해결, 제도_전담기관_PPP_Unit, 제도_투자_우대_보장, 제도_투자자_선정_방식, 지역_지역명_개편_전, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_raw_파일명, 출처_문서페이지_URL, 출처_원문_URL, 출처_출처_구분

### C-014

- 지표 삭제: C-014_db_indicator, C-014_ec_category, C-014_ec_fee, C-014_land_acquisition_rule, C-014_legal_basis, C-014_permit_step, C-014_tariff_rule
- 엔티티 속성 삭제: tech_id, 결측_framework_필수_속성_결측_코드_사유, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 기준_전기요금_US_kWh, 기준_전력회사, 기준_조사_도시, 기준_조사_도시_비고, 기준_케이스_정의, 단계_단계_번, 단계_단계명_원문, 단계_담당_기관_원문, 단계_비용_원문_표기, 단계_비용_현지통화, 단계_소요기간_원문_표기, 단계_소요기간_일, 단계_통화, 데이터검토코드, 링크_raw_파일명, 링크_원문_URL, 법령_공포_관보일, 법령_규율_대상, 법령_대체_개정_관계, 법령_문서번호, 법령_법령명_국문, 법령_법령명_벵골어, 법령_법령명_원문, 법령_상태, 법령_유형, 법령_정본_언어, 분류_ECC_유효기간_년, 분류_EIA_승인_심사기간_근무일, 분류_LCC_심사기간_기산_방식, 분류_LCC_심사기간_일, 분류_갱신_신청_시한_일, 분류_근거_조항, 분류_입지허가_LCC_필요_여부, 분류_최종_ECC_심사기간_근무일, 분류_환경_분류_등급, 분류_환경허가_ECC_심사기간_근무일, 수수료_갱신_수수료_비율_배, 수수료_근거_조항, 수수료_신규_수수료_Tk, 수수료_적용_판본, 수수료_투자규모_구간_Tk, 식별_레코드ID, 식별_레코드명, 식별_행정_수준, 요금_규제기관, 요금_근거_조항, 요금_요금_개정_결정_공표_기한_일, 요금_요금_결정_청문_의무, 요금_회계연도당_개정_횟수_상한_회, 지역_지역명_현행, 지역_행정코드_P_code, 지표_보조_지수, 지표_보조_지수_기준, 지표_비용, 지표_비용_기준, 지표_소요기간_일, 지표_절차_수_개, 지표_지표_영역, 출처_원문_문서명, 출처_인용_위치, 토지_근거_조항, 토지_민간기관_목적_추가보상률, 토지_부수_손실_추가보상률, 토지_시장가_산정_기준기간_개월, 토지_정부_목적_추가보상률
- 상태 변경: downloadAllowed true→false

### C-019

- 지표 삭제: C-019_budget, C-019_carbon_pricing, C-019_eligible_mechanism, C-019_fee, C-019_fee_rule, C-019_framework_document, C-019_governance, C-019_re_support, C-019_re_target, C-019_registry_status
- 엔티티 속성 삭제: tech_id, 가격제_배출권거래제_도입_여부, 가격제_탄소세_도입_여부, 가격제_탄소세_세율_USD_tCO_e, 가격제_확인_방법, 결측_framework_필수_속성_결측_코드_사유, 규정_규정_항목, 규정_근거_조항, 규정_내용, 규정_적용_범위, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 데이터검토코드, 링크_raw_파일명, 링크_원문_URL, 메커니즘_메커니즘_표준명, 메커니즘_비고, 메커니즘_시장_구분, 메커니즘_적격_근거, 목표_근거_조항, 목표_기준, 목표_목표_연도_년, 목표_재생에너지_비중_목표, 문서_기준_연도_년, 문서_문서명_국문, 문서_문서명_원문, 문서_문서번호, 문서_발행기관, 문서_승인_상태, 문서_유형, 수수료_근거_조항, 수수료_내국_신청인, 수수료_단위, 수수료_수수료_항목, 수수료_시장_구분, 수수료_외국_신청인, 식별_레코드ID, 식별_레코드명, 식별_행정_수준, 예산_기금_항목명, 예산_연도별_배분액, 지역_지역명_현행, 지역_행정코드_P_code, 지원_근거_조항, 지원_도입_여부, 지원_제도_내용, 지원_제도_유형, 체계_고시_시행일, 체계_구성요소, 체계_근거_조항, 체계_상태_값, 체계_소관기관, 출처_원문_문서명, 출처_인용_위치
- 상태 변경: downloadAllowed true→false

### C-024

- 엔티티 속성 삭제: RBP_성과_제출량_tCO_e_년, RBP_성과기반지불_수령_실적, RBP_확인_경로, 기술_기술코드_근거문구, 기술_기술코드_판단근거_유형, 요소_기준_시점_년, 요소_바르샤바_프레임워크_요소, 지역_행정코드_P_code
- 엔티티 속성 추가: FREL_FREL_tCO_e_년, FREL_FRL_tCO_e_년, FREL_값_tCO_e_년, FREL_결과기간, FREL_기술분석_기술보고서_문서번호, FREL_제출_이력, FREL_항목, RBP_검증_감축량_MtCO_e, RBP_계약_승인_문서, RBP_계약_승인일_YYYY_MM_DD, RBP_계약_제안_물량_MtCO_e, RBP_기금_프로그램, RBP_단가_USD_tCO_e, RBP_대상_지역, RBP_수혜_대상, RBP_잉여_추가_물량_MtCO_e, RBP_지급_예정액_백만_USD, RBP_지급일_YYYY_MM_DD, RBP_참여_상태, 기술_기술코드_판단_근거, 기술_기술코드_판단_유형, 성과_값, 성과_결과기간_총량_tCO_e, 성과_배출감축_결과_tCO_e_년, 성과_성과_제출량_tCO_e_년, 성과_성과기반지불_수령_실적, 성과_연간_순결과_tCO_e_년, 성과_연도_년, 성과_항목, 성과_확인_경로, 성과_흡수증진_결과_tCO_e_년, 식별_제출_회차, 요소_REDD_요소, 요소_기준_연도_년, 요소_내용, 요소_문서_제출물, 요소_발행_제출_기관, 요소_제출_승인일_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_원문, 지역_행정코드_개편_전, 지역_행정코드_현행, 출처_문서페이지_URL, 출처_출처_구분

### C-025

- 엔티티 속성 삭제: 지역_행정코드_P_code, 집계_출처_구분
- 엔티티 속성 추가: 발행기록_기록_유형, 발행기록_모니터링_기간_시작_YYYY_MM_DD, 발행기록_모니터링_기간_종료_YYYY_MM_DD, 발행기록_발행_요청_상태, 발행기록_발행량_tCO_e, 발행기록_발행일_YYYY_MM_DD, 발행기록_소각량_tCO_e, 발행기록_연도_년, 사업_감축_제거_구분, 사업_방법론_버전, 사업_사업_규모, 사업_사업_범주_등록부_분류, 사업_연간_예상_감축량_tCO_e_년, 사업_적용_표준_버전, 식별_레코드_유형, 실적_등록일_YYYY_MM_DD, 실적_발행일_YYYY_MM_DD, 실적_배분량_tCO_e, 실적_크레딧_기간_시작_YYYY_MM_DD, 실적_크레딧_기간_종료_YYYY_MM_DD, 지역_지역명_개편_전, 지역_지역명_원문, 지역_행정코드_개편_전, 지역_행정코드_현행, 집계_구성_내역, 출처_출처_구분

### D-003

- 지표 추가: D-003_bau_emission, D-003_bau_emission_ndc2021, D-003_bau_emission_ndc2025, D-003_cdm_annual_er_total, D-003_cdm_project_registry, D-003_cdm_registered_project_count, D-003_conditional_reduction_ndc2021, D-003_conditional_reduction_ndc2025, D-003_grid_emission_factor_fy2020, D-003_grid_emission_factor_fy2021, D-003_grid_emission_factor_fy2022, D-003_gs_project_registry, D-003_ndc30_finance_conditional, D-003_ndc30_finance_total, D-003_ndc30_finance_unconditional, D-003_ndc30_subsector_agriculture_energy_conditional, D-003_ndc30_subsector_agriculture_energy_total, D-003_ndc30_subsector_agriculture_energy_unconditional, D-003_ndc30_subsector_brick_kiln_conditional, D-003_ndc30_subsector_brick_kiln_total, D-003_ndc30_subsector_brick_kiln_unconditional, D-003_ndc30_subsector_fugitive_conditional, D-003_ndc30_subsector_fugitive_total, D-003_ndc30_subsector_fugitive_unconditional, D-003_ndc30_subsector_household_conditional, D-003_ndc30_subsector_household_total, D-003_ndc30_subsector_household_unconditional, D-003_ndc30_subsector_manufacturing_conditional, D-003_ndc30_subsector_manufacturing_total, D-003_ndc30_subsector_manufacturing_unconditional, D-003_ndc30_subsector_power_conditional, D-003_ndc30_subsector_power_total, D-003_ndc30_subsector_power_unconditional, D-003_ndc30_subsector_transport_conditional, D-003_ndc30_subsector_transport_total, D-003_ndc30_subsector_transport_unconditional, D-003_reduction_afolu_ndc2025, D-003_reduction_brick_kiln_ndc2025, D-003_reduction_conditional_abs, D-003_reduction_conditional_pct, D-003_reduction_energy_ndc2025, D-003_reduction_industry_ndc2021, D-003_reduction_ippu_ndc2025, D-003_reduction_manufacturing_ndc2025, D-003_reduction_power_ndc2021, D-003_reduction_power_ndc2025, D-003_reduction_total_abs, D-003_reduction_total_pct, D-003_reduction_transport_ndc2021, D-003_reduction_transport_ndc2025, D-003_reduction_unconditional_abs, D-003_reduction_unconditional_pct, D-003_reduction_waste_ndc2025, D-003_sector_bau_afolu, D-003_sector_bau_energy, D-003_sector_bau_ippu, D-003_sector_bau_waste, D-003_sector_reduction_afolu_conditional, D-003_sector_reduction_afolu_unconditional, D-003_sector_reduction_energy_conditional, D-003_sector_reduction_energy_unconditional, D-003_sector_reduction_ippu_conditional, D-003_sector_reduction_waste_conditional, D-003_total_reduction_ndc2021, D-003_total_reduction_ndc2025, D-003_unconditional_reduction_ndc2021, D-003_unconditional_reduction_ndc2025, D-003_vcs_project_registry
- 엔티티 속성 추가: 2030_누적_예상감축량_tCO2, D_021_연계_프로젝트번호, 기술매핑_근거, 기술유형, 대표금액, 등록번호, 등록일, 레코드구분, 명칭, 발행_CER_tCO2, 방법론, 배출계수_EFCM_tCO2_MWh, 사업규모, 사업지_행정구역, 사업참여자, 상태, 세부유형, 연간_감축량_tCO2_y, 원천, 유효화기관, 좌표_성격, 크레딧기간_시작, 크레딧기간_종료, 행정구역, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-005 · 전용 렌더러

- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records

### D-006

- 지표 추가: D-006_carbon_tax_introduction_status, D-006_carbon_tax_revenue_projection_usd10_share_gdp, D-006_carbon_tax_revenue_projection_usd25_amount, D-006_carbon_tax_revenue_projection_usd25_share_gdp, D-006_ecgte_lcu, D-006_ecgte_pct_gdp, D-006_ecgten_lcu, D-006_ecgten_pct_gdp, D-006_ecgtep_lcu, D-006_ecgtep_pct_gdp, D-006_ecgter_lcu, D-006_ecgter_pct_gdp, D-006_ecgtet_lcu, D-006_ecgtet_pct_gdp, D-006_environmental_surcharge_collected_revenue, D-006_environmental_surcharge_effective_year, D-006_environmental_surcharge_rate_1501cc_to_2000cc, D-006_environmental_surcharge_rate_2001cc_to_2500cc, D-006_environmental_surcharge_rate_2501cc_to_3000cc, D-006_environmental_surcharge_rate_3001cc_to_3500cc, D-006_environmental_surcharge_rate_above_3500cc, D-006_environmental_surcharge_rate_upto_1500cc, D-006_environmental_tax_revenue_lcu, D-006_environmental_tax_revenue_pct_gdp, D-006_environmental_tax_transport_lcu, D-006_environmental_tax_transport_pct_gdp, D-006_fossil_fuel_subsidy_negative_carbon_price_share_gdp, D-006_fuel_specific_duty_crude_oil, D-006_fuel_specific_duty_furnace_oil, D-006_fuel_specific_duty_petroleum_products, D-006_petroleum_import_tax_revenue
- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records, downloadAllowed false→true

### D-007

- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records

### D-008

- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records

### D-009

- 지표 추가: D-009_adp_allocation_bdp2100_share_gdp, D-009_adp_allocation_bdp2100_usd, D-009_bcctf_approved_project_count, D-009_bcctf_cumulative_allocation, D-009_bdp2100_climate_finance, D-009_budget_fy2526_total, D-009_budget_fy2627_adp_amount, D-009_budget_fy2627_adp_projects, D-009_budget_fy2627_growth_rate, D-009_budget_fy2627_share_25ministries, D-009_budget_fy2627_share_development, D-009_budget_fy2627_total, D-009_budget_reprioritization_climate_financing_share_gdp, D-009_cip_efcc_financing_gap, D-009_climate_investment_requirement_range_share_gdp, D-009_climate_related_government_budgeted_expenditure_share, D-009_delta_related_expenditure_share_gdp, D-009_environmental_protection_expenditure_lcu, D-009_environmental_protection_expenditure_pct_gdp, D-009_gen_g14_lcu, D-009_gen_g14_pct_gdp, D-009_government_adaptation_spending_share_gdp, D-009_government_adaptation_spending_usd, D-009_highly_relevant_climate_government_budgeted_expenditure_share, D-009_ndc_adaptation_finance_need, D-009_ndc_mitigation_finance_need, D-009_public_capital_expenditure_share_gdp, D-009_share_of_gdp_fy2020, D-009_share_of_gdp_fy2021, D-009_share_of_gdp_fy2024, D-009_share_of_gdp_fy2025, D-009_share_of_gdp_fy2026, D-009_share_of_national_budget_fy2026, D-009_share_of_national_budget_fy2027, D-009_share_of_tagged_ministry_budget_fy2020, D-009_share_of_tagged_ministry_budget_fy2021, D-009_share_of_tagged_ministry_budget_fy2024, D-009_share_of_tagged_ministry_budget_fy2025, D-009_share_of_tagged_ministry_budget_fy2026, D-009_share_of_tagged_ministry_budget_fy2027, D-009_total_climate_budget_fy2020, D-009_total_climate_budget_fy2020_restated, D-009_total_climate_budget_fy2021, D-009_total_climate_budget_fy2024, D-009_total_climate_budget_fy2025, D-009_total_climate_budget_fy2026, D-009_total_climate_budget_fy2027, D-009_total_potential_climate_financing_share_gdp
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-010

- 지표 추가: D-010_budget_subsidy_fertilizer, D-010_budget_subsidy_power, D-010_explicit_by_fuel_coal, D-010_explicit_by_fuel_electricity, D-010_explicit_by_fuel_natural_gas, D-010_explicit_by_fuel_petroleum, D-010_explicit_total_gdp, D-010_explicit_total_usd, D-010_implicit_by_externality_accidents, D-010_implicit_by_externality_congestion, D-010_implicit_by_externality_foregone_vat, D-010_implicit_by_externality_global_warming, D-010_implicit_by_externality_local_air_pollution, D-010_implicit_by_externality_road_damage, D-010_implicit_by_fuel_coal, D-010_implicit_by_fuel_electricity, D-010_implicit_by_fuel_natural_gas, D-010_implicit_by_fuel_petroleum, D-010_implicit_total_gdp, D-010_implicit_total_usd, D-010_oil_fired_power_subsidy, D-010_power_fertiliser_subsidy_share_gdp_fy2024, D-010_power_fertiliser_subsidy_share_gdp_fy2025, D-010_power_sector_revenue_shortfall, D-010_power_subsidy_ceiling_fy2025, D-010_power_subsidy_total_fy2025, D-010_total_gdp, D-010_total_usd
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-011 · 전용 렌더러

- 지표 추가: D-011_oda_disbursement_adaptation_fund, D-011_oda_disbursement_asian_development_bank, D-011_oda_disbursement_asian_development_bank_subtotal, D-011_oda_disbursement_asian_infrastructure_investment_bank, D-011_oda_disbursement_australia, D-011_oda_disbursement_austria, D-011_oda_disbursement_belgium, D-011_oda_disbursement_bulgaria, D-011_oda_disbursement_canada, D-011_oda_disbursement_central_emergency_response_fund, D-011_oda_disbursement_climate_investment_funds, D-011_oda_disbursement_czechia, D-011_oda_disbursement_dac_countries, D-011_oda_disbursement_dac_countries_subtotal, D-011_oda_disbursement_dac_eu_countries, D-011_oda_disbursement_dac_eu_countries_and_eu_institutions, D-011_oda_disbursement_dac_eu_countries_and_eu_institutions_subtotal, D-011_oda_disbursement_dac_eu_countries_subtotal, D-011_oda_disbursement_dac_members, D-011_oda_disbursement_dac_members_subtotal, D-011_oda_disbursement_denmark, D-011_oda_disbursement_estonia, D-011_oda_disbursement_eu_institutions, D-011_oda_disbursement_european_union_evolving_composition, D-011_oda_disbursement_european_union_evolving_composition_subtotal, D-011_oda_disbursement_finland, D-011_oda_disbursement_food_and_agriculture_organisation, D-011_oda_disbursement_france, D-011_oda_disbursement_g7, D-011_oda_disbursement_g7_subtotal, D-011_oda_disbursement_germany, D-011_oda_disbursement_global_alliance_for_vaccines_and_immunization, D-011_oda_disbursement_global_environment_facility, D-011_oda_disbursement_global_fund, D-011_oda_disbursement_greece, D-011_oda_disbursement_green_climate_fund, D-011_oda_disbursement_hungary, D-011_oda_disbursement_iceland, D-011_oda_disbursement_ifad, D-011_oda_disbursement_imf_concessional_trust_funds, D-011_oda_disbursement_international_atomic_energy_agency, D-011_oda_disbursement_international_centre_for_genetic_engineering_and_biotechnolo, D-011_oda_disbursement_international_centre_for_genetic_engineering_and_biotechnology, D-011_oda_disbursement_international_development_association, D-011_oda_disbursement_international_labour_organisation, D-011_oda_disbursement_international_monetary_fund, D-011_oda_disbursement_international_monetary_fund_subtotal, D-011_oda_disbursement_ireland, D-011_oda_disbursement_islamic_development_bank, D-011_oda_disbursement_israel, D-011_oda_disbursement_italy, D-011_oda_disbursement_japan, D-011_oda_disbursement_joint_sustainable_development_goals_fund, D-011_oda_disbursement_kazakhstan, D-011_oda_disbursement_korea, D-011_oda_disbursement_kuwait, D-011_oda_disbursement_liechtenstein, D-011_oda_disbursement_lithuania, D-011_oda_disbursement_luxembourg, D-011_oda_disbursement_malta, D-011_oda_disbursement_multilaterals_organisations, D-011_oda_disbursement_multilaterals_organisations_subtotal, D-011_oda_disbursement_netherlands, D-011_oda_disbursement_new_zealand, D-011_oda_disbursement_non_dac_countries, D-011_oda_disbursement_non_dac_countries_subtotal, D-011_oda_disbursement_nordic_development_fund, D-011_oda_disbursement_norway, D-011_oda_disbursement_official_donors, D-011_oda_disbursement_official_donors_grand_total, D-011_oda_disbursement_opec_fund_for_international_development, D-011_oda_disbursement_other_multilateral_organisations, D-011_oda_disbursement_other_multilateral_organisations_subtotal, D-011_oda_disbursement_poland, D-011_oda_disbursement_portugal, D-011_oda_disbursement_private_infrastructure_development_group, D-011_oda_disbursement_qatar, D-011_oda_disbursement_regional_development_banks, D-011_oda_disbursement_regional_development_banks_subtotal, D-011_oda_disbursement_romania, D-011_oda_disbursement_saudi_arabia, D-011_oda_disbursement_slovenia, D-011_oda_disbursement_spain, D-011_oda_disbursement_sweden, D-011_oda_disbursement_switzerland, D-011_oda_disbursement_t_rkiye, D-011_oda_disbursement_thailand, D-011_oda_disbursement_un_capital_development_fund, D-011_oda_disbursement_un_development_coordination_office, D-011_oda_disbursement_un_women, D-011_oda_disbursement_unaids, D-011_oda_disbursement_undp, D-011_oda_disbursement_unfpa, D-011_oda_disbursement_unhcr, D-011_oda_disbursement_unicef, D-011_oda_disbursement_united_arab_emirates, D-011_oda_disbursement_united_kingdom, D-011_oda_disbursement_united_nations, D-011_oda_disbursement_united_nations_industrial_development_organization, D-011_oda_disbursement_united_nations_subtotal, D-011_oda_disbursement_united_states, D-011_oda_disbursement_wfp, D-011_oda_disbursement_who_strategic_preparedness_and_response_plan, D-011_oda_disbursement_world_bank, D-011_oda_disbursement_world_bank_group, D-011_oda_disbursement_world_bank_group_subtotal, D-011_oda_disbursement_world_bank_subtotal, D-011_oda_disbursement_world_health_organisation, D-011_oda_disbursement_world_trade_organisation, D-011_oda_disbursement_wto_international_trade_centre
- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records, downloadAllowed false→true

### D-012

- 지표 추가: D-012_company_entry_registry, D-012_developer_count_china, D-012_developer_count_india, D-012_developer_count_japan, D-012_developer_count_korea, D-012_entry_project_count, D-012_entry_project_count_china, D-012_gem_power_asset_registry
- 엔티티 속성 추가: 38대_기후기술, D_021_연계_프로젝트번호, tech_id, 국적, 기술매핑_근거, 기술분야, 대표금액, 레코드구분, 명칭, 사업지_행정구역, 상태, 세부유형, 소유자, 용량, 운영자, 인용위치, 좌표_성격, 진출형태, 출처, 행정구역, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 확인_연도
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-013

- 지표 추가: D-013_asia_rank, D-013_dimension_score_esru, D-013_dimension_score_geo, D-013_dimension_score_ncp, D-013_dimension_score_si, D-013_epi_eco, D-013_epi_epi, D-013_epi_hlt, D-013_green_growth_index, D-013_pillar_score_access_to_basic_services, D-013_pillar_score_biodiversity_ecosystem_protection, D-013_pillar_score_cultural_social_value, D-013_pillar_score_efficient_sustainable_energy, D-013_pillar_score_efficient_sustainable_water, D-013_pillar_score_environmental_quality, D-013_pillar_score_gender_balance, D-013_pillar_score_ghg_emission_reduction, D-013_pillar_score_green_employment, D-013_pillar_score_green_innovation, D-013_pillar_score_green_investment, D-013_pillar_score_green_trade, D-013_pillar_score_material_use_efficiency, D-013_pillar_score_social_equity, D-013_pillar_score_social_protection, D-013_pillar_score_sustainable_land_use, D-013_regional_rank
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-014

- 지표 추가: D-014_commitment_amount_climate_marked, D-014_commitment_amount_total, D-014_disbursement_amount_total, D-014_edcf_project_registry, D-014_project_count, D-014_project_count_climate_marked
- 엔티티 속성 추가: 38대_기후기술, CRS번호, DAC_5자리, D_021_연계_프로젝트번호, Rio_Marker, tech_id, 기술매핑_근거, 기술매핑_근거2, 기후변화_완화_마커, 기후변화_적응_마커, 대표금액, 레코드구분, 명칭, 보고기관, 보고연도, 분야_DAC, 사업기간, 사업명_영문, 사업번호, 사업설명, 사업실시기관, 사업지_행정구역, 상태, 순지출액_USD_mn, 시행기관, 약정액_USD_mn, 약정액_합계_USD, 원조유형, 자금형태, 좌표_성격, 지출액_USD_mn, 지출액_합계_USD, 출처, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-015

- 지표 추가: D-015_commitment_amount_climate_marked, D-015_commitment_amount_total, D-015_disbursement_amount_total, D-015_oda_korea_project_registry, D-015_project_count, D-015_project_count_climate_marked
- 엔티티 속성 추가: 38대_기후기술, CRS번호, DAC_5자리, D_021_연계_프로젝트번호, Rio_Marker, tech_id, 기술매핑_근거, 기술매핑_근거2, 기후변화_완화_마커, 기후변화_적응_마커, 대표금액, 레코드구분, 명칭, 보고기관, 보고연도, 분야_DAC, 사업기간, 사업명_영문, 사업번호, 사업설명, 사업실시기관, 사업지_행정구역, 상태, 순지출액_USD_mn, 시행기관, 약정액_USD_mn, 약정액_합계_USD, 원조유형, 자금형태, 좌표_성격, 지출액_USD_mn, 지출액_합계_USD, 출처, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-016

- 지표 추가: D-016_commitment_amount_climate_marked, D-016_commitment_amount_total, D-016_disbursement_amount_total, D-016_local_government_and_ministry_project_registry, D-016_project_count, D-016_project_count_climate_marked, D-016_project_count_local_government
- 엔티티 속성 추가: 38대_기후기술, CRS번호, DAC_5자리, D_021_연계_프로젝트번호, Rio_Marker, tech_id, 기술매핑_근거, 기술매핑_근거2, 기후변화_완화_마커, 기후변화_적응_마커, 대표금액, 레코드구분, 명칭, 보고기관, 보고연도, 분야_DAC, 사업기간, 사업명_영문, 사업번호, 사업설명, 사업실시기관, 사업지_행정구역, 상태, 순지출액_USD_mn, 시행기관, 약정액_USD_mn, 약정액_합계_USD, 원조유형, 자금형태, 좌표_성격, 지출액_USD_mn, 지출액_합계_USD, 출처, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-017

- 지표 추가: D-017_korea_oda_award_registry
- 엔티티 속성 추가: D_021_연계_프로젝트번호, 기술매핑_근거, 기후변화_완화_마커, 기후변화_적응_마커, 대표금액, 레코드구분, 명칭, 발주기관, 보고연도, 분야, 사업기간, 사업번호, 사업지_행정구역, 수행기관, 수행기관_유형, 예산, 예산유형, 좌표_성격, 출처, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-018

- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records

### D-019

- 지표 추가: D-019_budget_total, D-019_ctcn_ta_request_registry, D-019_request_count, D-019_request_count_adaptation, D-019_request_count_completed, D-019_request_count_korean_implementor, D-019_request_count_mitigation
- 엔티티 속성 추가: D_021_연계_프로젝트번호, NDE, 기간, 기술매핑_근거, 기술분야_Sectors, 대표금액, 레코드구분, 명칭, 목표, 사업지_행정구역, 예산, 요청국가, 요청기관, 접근방식, 제출일, 좌표_성격, 지리적_범위, 지원단계, 지원유형, 참조번호, 출처, 프로젝트_URL, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records, downloadAllowed false→true

### D-020

- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records

### D-021

- 지표 추가: D-021_activity_count, D-021_activity_count_active, D-021_commitment_amount_active, D-021_commitment_amount_total, D-021_international_organization_and_mdb_project_registry
- 엔티티 속성 추가: 38대_기후기술, D_021_연계_프로젝트번호, IDA_약정액_USD, tech_id, 공여기관, 기술매핑_근거, 기술매핑_근거2, 대출유형, 대표금액, 레코드구분, 명칭, 무상액_USD, 사업개요_PDO, 사업지_행정구역, 상태, 실행기관, 이사회_승인일, 종료_예정_일, 좌표_성격, 지역, 차주, 총_약정액_USD, 프로젝트번호, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 환경평가등급
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-022 · 전용 렌더러

- 지표 추가: D-022_aiib_project_registry, D-022_ifc_investment_services_registry, D-022_investment_amount_total, D-022_investment_count_active, D-022_investment_project_count, D-022_jica_oda_loan_registry, D-022_mdb_dfi_ppp_investment_registry, D-022_rio_marker_coverage
- 엔티티 속성 추가: 38대_기후기술, D_021_연계_프로젝트번호, IDA_약정액_USD, tech_id, 거치기간_년, 공여기관, 구속성, 기술매핑_근거, 기술매핑_근거2, 기후_관련성_자체_분류, 단위, 대출유형, 대표금액, 레코드구분, 리우_마커, 명칭, 무상액_USD, 사업개요_PDO, 사업지_행정구역, 상태, 상환기간_년, 세부섹터, 섹터_DAC_5자리, 승인일, 실행기관, 이사회_승인일, 이자율, 종료_예정_일, 좌표_성격, 주요_분야, 지역, 차주, 총_약정액_USD, 출처, 투자_유형, 투자_유형_원문, 투자액_commitment, 프로젝트번호, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 환경평가등급
- 상태 변경: publicStatus not-provided→partial, dataPresenceStatus not-provided→partial-records, downloadAllowed false→true

### D-023

- 지표 추가: D-023_adaptation_fund_approved_total, D-023_cif_approved_funding_total, D-023_cif_expected_cofinancing, D-023_cif_project_count, D-023_climate_fund_approved_grand_total, D-023_climate_fund_approved_usd_mn, D-023_climate_fund_count, D-023_climate_fund_project_registry, D-023_gcf_approved_funding_total, D-023_gcf_readiness_support_total, D-023_gef_cofinancing_sum_climate, D-023_gef_grant_sum_climate, D-023_gef_project_count_all, D-023_gef_project_count_climate, D-023_oda_and_climate_fund_finance_registry
- 엔티티 속성 추가: 38대_기후기술, DAC_5자리, D_021_연계_프로젝트번호, GEF_기수, GEF_승인액_USD, Ref_No, tech_id, 결과영역, 기금, 기금유형, 기술매핑_근거, 기술매핑_근거2, 대상국, 대표금액, 레코드구분, 명칭, 분야, 사업유형, 사업지_행정구역, 상태, 세부분야, 수원기관, 수행기관_Agencies, 승인_회계연도, 승인액_USD_mn, 승인연도, 실행기관, 자금유형, 재원_종류, 종료연도, 좌표_성격, 집행액_USD_mn, 초점분야_Focal_Areas, 출처, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-024

- 지표 추가: D-024_climate_sector_funding_2025, D-024_climate_sector_share_2025, D-024_company_count_identified, D-024_deal_amount_sum_identified, D-024_deal_count_identified, D-024_dfi_direct_investment_registry, D-024_dfi_investment_count, D-024_ecosystem_cumulative_funding, D-024_total_startup_funding_2025, D-024_vc_impact_investment_deal_registry
- 엔티티 속성 추가: D_021_연계_프로젝트번호, tech_id, 공시일, 기술매핑_근거, 기업명, 대표금액, 레코드구분, 명칭, 부서, 사업_내용, 사업번호, 사업지_행정구역, 상태, 상품영역, 섹터, 약정액_USD, 이사회_예정일, 좌표_성격, 출처, 투자기관, 투자유형, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 환경범주, 회계연도
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-025

- 지표 추가: D-025_ppi_investment_annual, D-025_ppi_investment_energy, D-025_ppi_investment_energy_renewable, D-025_ppi_investment_ict, D-025_ppi_investment_transport, D-025_ppi_investment_water, D-025_ppi_new_investment_2024, D-025_ppi_new_project_count_2024, D-025_ppi_project_count, D-025_ppi_project_registry_count
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### D-026

- 지표 추가: D-026_guarantee_amount_total_active, D-026_guarantee_amount_total_not_active, D-026_guarantee_amount_total_proposed, D-026_guarantee_count_active, D-026_guarantee_count_climate_finance, D-026_guarantee_count_not_active, D-026_guarantee_count_power_sector, D-026_guarantee_count_proposed, D-026_guarantee_count_total, D-026_miga_guarantee_registry
- 엔티티 속성 추가: D_021_연계_프로젝트번호, MIGA_공개문서_유형, 기술매핑_근거, 대표금액, 레코드구분, 명칭, 보증_총노출액_상한_USD, 보증보유자, 사업_내용, 사업지_행정구역, 상태, 섹터_원문, 수원국, 이사회_예정일, 전략우선분야, 좌표_성격, 출처, 투자국, 프로젝트ID, 행정구역_개편근거, 행정구역_개편전, 행정구역_개편후, 환경범주, 회계연도
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

### E-011

- 지표 추가: E-011_nri_governance_rank, E-011_nri_governance_score, E-011_nri_impact_rank, E-011_nri_impact_score, E-011_nri_overall_rank, E-011_nri_overall_score, E-011_nri_people_rank, E-011_nri_people_score, E-011_nri_technology_rank, E-011_nri_technology_score
- 상태 변경: publicStatus not-provided→actual, dataPresenceStatus not-provided→actual-records, downloadAllowed false→true

## 3. 제목 변경

없음.

## 4. 값 변경률 상위 20

| 요소 | 대조 관측 | 값 변경 | 변경률 | 표본(키: 현행→후보) |
|---|---|---|---|---|

