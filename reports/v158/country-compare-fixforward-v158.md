# 국가 비교 fix-forward — 전후 대조 (V158-B2b)

사용자 결정(2026-09-30): 요소별 대표 지표 1개로 비교, D-004·D-006·D-008·E-012는 국가 비교에서 제외, 대상 54개(용역사 기준서 v1.1과 일치).

## 요약
- 비교 대상: 58 → **54**(제외 4: D-004·D-006·D-008·E-012, `config/data-publication/country-compare-exclusions-v158.json`)
- 대표 지표: 기본 국가 카드 요약의 헤드라인 지표(`provenance.headlineIndicatorIds[0]`, analysis QA로 검수된 값)를 쓴다. 54개 중 52개가 카드 헤드라인이고, 카드에 헤드라인이 없는 2개(A-002 여러 지표 수준 카드, A-017 2026년 제외로 카드 없음)는 이전 규칙(값이 있는 첫 지표)을 유지했다 → 검토 필요.
- 전과 대표 지표가 달라진 요소: 31개(아래 표 '대표 지표 변경')
- 단위: 위첨자 표기 차이(`km2`·`km²`)는 같은 단위로 본다 → B-002 단위 불일치 해소
- 쌍 상태(BGD·VNM): {"common-year": 35, "latest-each": 1, "unit-mismatch": 0, "missing-in-country": 18}
- 화면: 비교 블록은 공개 국가가 2개 이상일 때만 나타난다. 지금은 베트남만 공개라 **화면 변화 0**.

## 전후 표
| 요소 | 대표 지표(전) | 포함(전) | 대표 지표(후) | 포함(후) | 비고 |
|---|---|---|---|---|---|
| A-001 | `A-001_cpi_ci_lower` | 포함 | `A-001_cpi_score` | 포함 | 대표 지표 변경 |
| A-002 | `A-002_wgi_cc_est` | 포함 | `A-002_wgi_cc_est` | 포함 |  |
| A-003 | `A-003_gdp_current_usd` | 포함 | `A-003_gdp_current_usd` | 포함 |  |
| A-004 | `A-004_poverty_rate_extreme_intl` | 포함 | `A-004_poverty_rate_national` | 포함 | 대표 지표 변경 |
| A-005 | `A-005_va_share_agriculture` | 포함 | `A-005_va_share_services` | 포함 | 대표 지표 변경 |
| A-006 | `A-006_unemp_total_ilo` | 포함 | `A-006_unemp_total_ilo` | 포함 |  |
| A-007 | `A-007_population_total` | 포함 | `A-007_population_total` | 포함 |  |
| A-008 | `A-008_gini_index` | 포함 | `A-008_gini_index` | 포함 |  |
| A-009 | `A-009_ghg_intensity_gdp_ppp` | 포함 | `A-009_ghg_intensity_gdp_ppp` | 포함 |  |
| A-010 | `A-010_emissions_ch4_co2eq` | 포함 | `A-010_emissions_ch4_co2eq` | 포함 |  |
| A-011 | `A-011_emissions_sector_agriculture` | 포함 | `A-011_emissions_sector_power_industry` | 포함 | 대표 지표 변경 |
| A-012 | `A-012_ghg_net_incl_lulucf` | 포함 | `A-012_ghg_total_excl_lulucf` | 포함 | 대표 지표 변경 |
| A-014 | `A-014_sdg_goal_score_sdg01` | 포함 | `A-014_sdg_index_score` | 포함 | 대표 지표 변경 |
| A-015 | `A-015_sdg10_gini` | 포함 | `A-015_sdg1_lmicpov` | 포함 | 대표 지표 변경 |
| A-016 | `A-016_primary_energy_coal` | 포함 | `A-016_primary_energy_coal` | 포함 |  |
| A-017 | `A-017_lcoe_ccgt_benchmark` | 포함 | `A-017_lcoe_ccgt_benchmark` | 포함 |  |
| A-018 | `A-018_capacity_bioenergy_offgrid` | 포함 | `A-018_capacity_coal_ongrid` | 포함 | 대표 지표 변경 |
| A-019 | `A-019_td_loss_rate` | 포함 | `A-019_td_loss_rate` | 포함 |  |
| A-020 | `A-020_renewable_share_capacity` | 포함 | `A-020_renewable_share_capacity` | 포함 |  |
| A-021 | `A-021_electricity_access_rural` | 포함 | `A-021_electricity_access_total` | 포함 | 대표 지표 변경 |
| A-022 | `A-022_maifi_evn_group` | 포함 | `A-022_maifi_evn_group` | 포함 |  |
| A-030 | `A-030_trade_balance` | 포함 | `A-030_trade_total` | 포함 | 대표 지표 변경 |
| A-031 | `A-031_lpi_customs` | 포함 | `A-031_lpi_customs` | 포함 |  |
| A-032 | `A-032_intermediate_dva_share_in_exports` | 포함 | `A-032_intermediate_dva_share_in_exports` | 포함 |  |
| A-033 | `A-033_lsci_q1` | 포함 | `A-033_lsci_q1` | 포함 |  |
| B-001 | `B-001_pr_annual_norm` | 포함 | `B-001_pr_month_norm_aug` | 포함 | 대표 지표 변경 |
| B-002 | `B-002_koppen_area_af` | 포함 | `B-002_koppen_area_cwa` | 포함 | 대표 지표 변경 |
| B-009 | `B-009_brf_prov_sph_an_giang` | 포함 | `B-009_ndgain_ecosystems` | 포함 | 대표 지표 변경 |
| B-010 | `B-010_cri_rank` | 포함 | `B-010_cri_rank` | 포함 |  |
| B-011 | `B-011_comp_capacity` | 포함 | `B-011_ndgain_score` | 포함 | 대표 지표 변경 |
| B-013 | `B-013_carbon_payment_aluminium` | 포함 | `B-013_eu_avg_carbon_payment_fertilizers` | 포함 | 대표 지표 변경 |
| B-016 | `B-016_fossil_share` | 포함 | `B-016_fossil_share` | 포함 |  |
| B-018 | `B-018_gdp_pc_full_ssp1` | 포함 | `B-018_gdp_ppp_full_ssp2` | 포함 | 대표 지표 변경 |
| B-019 | `B-019_pop_full_ssp1` | 포함 | `B-019_pop_full_ssp2` | 포함 | 대표 지표 변경 |
| B-020 | `B-020_coastal_flood` | 포함 | `B-020_risk_trend_inform` | 포함 | 대표 지표 변경 |
| B-022 | `B-022_adaptation_investment` | 포함 | `B-022_financing_source_g02` | 포함 | 대표 지표 변경 |
| B-024 | `B-024_agri_water_share` | 포함 | `B-024_agri_water_share` | 포함 |  |
| B-027 | `B-027_exploitable_gw` | 포함 | `B-027_exploitable_gw` | 포함 |  |
| B-035 | `B-035_lu_agricultural_land` | 포함 | `B-035_lu_cropland_area_per_capita` | 포함 | 대표 지표 변경 |
| B-036 | `B-036_cagr_lc_artificial_surface` | 포함 | `B-036_cagr_lu_planted_forest` | 포함 | 대표 지표 변경 |
| B-038 | `B-038_bioenergy_capacity_eia` | 포함 | `B-038_msw_percap` | 포함 | 대표 지표 변경 |
| B-043 | `B-043_coal_production_eia` | 포함 | `B-043_rp_ratio_g03` | 포함 | 대표 지표 변경 |
| B-045 | `B-045_production_rank_alumina` | 포함 | `B-045_reserve_share_bauxite` | 포함 | 대표 지표 변경 |
| B-046 | `B-046_reserves_0` | 포함 | `B-046_reserves_4` | 포함 | 대표 지표 변경 |
| D-001 | `D-001_capex_biomass` | 포함 | `D-001_capex_biomass` | 포함 |  |
| D-002 | `D-002_market_cagr_biomass` | 포함 | `D-002_market_cagr_biomass` | 포함 |  |
| D-003 | `D-003_expected_reduction_20yr_biomass` | 포함 | `D-003_expected_reduction_20yr_biomass` | 포함 |  |
| D-004 | `D-004_capex_recovery_biomass_high` | 포함 | `—` | 제외 | 국가 비교 대상에서 제외(용역사 기준서 v1.1) |
| D-005 | `D-005_adaptation_share_capital_expenditure` | 포함 | `D-005_adaptation_share_total_cc` | 포함 | 대표 지표 변경 |
| D-006 | `D-006_ept_applied_rate_diesel` | 포함 | `—` | 제외 | 국가 비교 대상에서 제외(용역사 기준서 v1.1) |
| D-008 | `D-008_climate_budget_mard` | 포함 | `—` | 제외 | 국가 비교 대상에서 제외(용역사 기준서 v1.1) |
| D-009 | `D-009_climate_expenditure_gdp_share` | 포함 | `D-009_climate_expenditure_gdp_share` | 포함 |  |
| D-010 | `D-010_efficient_price_gasoline` | 포함 | `D-010_fossil_fuel_subsidy_total` | 포함 | 대표 지표 변경 |
| D-011 | `D-011_oda_disbursement_adaptation_fund` | 포함 | `D-011_oda_disbursement_official_donors` | 포함 | 대표 지표 변경 |
| D-013 | `D-013_dimension_score_esru` | 포함 | `D-013_dimension_score_si` | 포함 | 대표 지표 변경 |
| E-009 | `E-009_researcher_count` | 포함 | `E-009_stem_grad_share_male` | 포함 | 대표 지표 변경 |
| E-010 | `E-010_gerd_absolute` | 포함 | `E-010_gerd_pct_gdp` | 포함 | 대표 지표 변경 |
| E-012 | `E-012_avg_monthly_wage_lcu` | 포함 | `—` | 제외 | 국가 비교 대상에서 제외(용역사 기준서 v1.1) |

## 자동 검토 표시(대표성 확인 필요 — 카드 헤드라인이지만 하위분류 지표)
- A-010 (`A-010_emissions_ch4_co2eq`): 부문·가스·시나리오 등 세부 하위분류로 보임
- A-011 (`A-011_emissions_sector_power_industry`): 부문·가스·시나리오 등 세부 하위분류로 보임
- A-015 (`A-015_sdg1_lmicpov`): 부문·가스·시나리오 등 세부 하위분류로 보임
- A-018 (`A-018_capacity_coal_ongrid`): 부문·가스·시나리오 등 세부 하위분류로 보임
- B-018 (`B-018_gdp_ppp_full_ssp2`): 부문·가스·시나리오 등 세부 하위분류로 보임
- B-019 (`B-019_pop_full_ssp2`): 부문·가스·시나리오 등 세부 하위분류로 보임
