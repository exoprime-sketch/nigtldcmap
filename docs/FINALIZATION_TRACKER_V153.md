# 152개 데이터 최종화 추적표 (2026-09-21 기준, 작업 전)

- 정본: 이 파일(`docs/FINALIZATION_TRACKER_V153.md`). 2026-09-22부터 모든 세션은 이 파일의 해당 행만 갱신한다(원본: output/final-plan-20260921/V153_152_최종화_추적표.md 사본).

- 상태 값: 대기 → 진행 → 완료 / 보류(사유). Claude Code는 PR마다 이 표의 `상태`·`증빙` 열을 갱신한다.
- 집중검토 42건은 사용자 지적 항목. 나머지는 P4의 유형별 표준 계약으로 처리.

| ID | 데이터명 | 분류 | 자료상태 | 지도 | 사용자 지적 | 조치 | 담당 | 상태 | 증빙 | 1순위 계약(D1) |
|---|---|---|---|---|---|---|---|---|---|---|
| A-001 | CPI(Corruption Perceptions Index, 부패인식지수) | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-002 | CPIA(Country Policy and Institutional Assessment, 국가 신용도·거버넌 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`line`) · QA 152/152 |
| A-003 | GDP[현재가, PPP, 성장률, 1인당] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-004 | 빈곤율; 극빈곤율 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-005 | 산업구조[농업, 제조, 서비스] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-006 | 실업률; 청년실업률 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-007 | 인구[총인구, 도시화율] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-008 | 지니계수 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-009 | GHG 배출 강도[GDP 대비, 1인당] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-010 | GHG 배출량[CO₂, CH₄, N₂O, F-gas] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`stacked-area`) · QA 152/152 |
| A-011 | GHG 배출량[에너지, 산업공정, 농업, 폐기물] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`stacked-area`) · QA 152/152 |
| A-012 | 총 GHG 배출량(LULUCF 제외) | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-013 | Climate Watch NDC-SDG linkage | 국가 기본 정보 | actual-records | country-aggregate/0 | 시각화 미완 | 목표 간 연결 매트릭스(히트맵)+분야별 연결 수 막대 | P4 | 집중검토 |  | 예외(`comparison-table` · 목표 간 연결은 문장값 매트릭스(비교표)로 열림 · 히트맵은 후속(P4)) · QA 152/152 |
| A-014 | UNDESA SDG Index Score | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-015 | UNDESA SDG 세부목표별 달성도 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 목표별 단일 연도 정규화 점수만 있어 추이선 대신 세부지표별 막대) · QA 152/152 |
| A-016 | 1차 에너지 소비 구조 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`stacked-area`) · QA 152/152 |
| A-017 | LCOE(균등화 발전비용) | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`dumbbell` · 국가 시계열이 아닌 기술별 비용 범위(하한~상한)와 벤치마크의 비교이므로 추이선 대신 기술별 범위 덤벨) · QA 152/152 |
| A-018 | 기술별 발전 설비용량 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`stacked-area`) · QA 152/152 |
| A-019 | 송배전 손실률(T&D Loss) | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-020 | 재생에너지 비중 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-021 | 전력 접근률 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-022 | 정전빈도[SAIDI, SAIFI] | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-023 | 발전소[위치, 용량] | 국가 기본 정보 | actual-records | cluster/1889 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 진행(D0: 시설 카드·소유/연도/출처/소재지 보강 완료 · 유형별 표준 계약은 P4) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §6 · facility-card-fill-v153.json · screens/A-023-1440.png | 완료·보존(`category-bar`) · QA 152/152 |
| A-024 | 전력망[위치, 미공급 지역] | 국가 기본 정보 | actual-records | line/606 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`category-bar`) · QA 152/152 |
| A-025 | CCS 시설 | 국가 기본 정보 | actual-records | point/3 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`comparison-table` · 수록 시설 5건(실증·후보·연구)이라 분류별 막대보다 시설·상태 비교표가 먼저) · QA 152/152 |
| A-026 | 건물 풋프린트(Footprint) | 국가 기본 정보 | actual-records | panel-only/0 | 데이터 부재 | Open Buildings/MS 풋프린트 성·시 집계 수집(결정) | PE | 집중검토 |  | 예외(`note` · 건물 Footprint는 현재 파일 구성 정보만 제공되고 개별 건물·성시 집계 수치가 없어 registry 표준(분류별 막대+목록)을 적용할 수 없음; 안내문(note)으로 대체) · QA 152/152 |
| A-027 | 교통 인프라[railway, road] | 국가 기본 정보 | actual-records | panel-only/0 | 지도 | 지표 막대+도로·철도 지도(OSM 자산) | P4+PE | 진행 — 자산 확보(P6a) → 등록 대기(P6b) | V155-1: `geometry/vnm-roads-rail.geojson`(8,114 선형, gzip 1.75 MB)+overview, 계약 제안 `spatial/pending-layers-v155.json`, `docs/DATA_ASSETS_V155.md`, `reports/v155/roads-rail.png` | 완료(`category-bar`) · QA 152/152 |
| A-028 | 해안 인프라; 수자원 인프라 | 국가 기본 정보 | actual-records | panel-only/0 | 지도, label 단위 추가 | 지표 막대(단위 라벨)+OSM 항만·댐·저수지 지도 자산 | P4+PE | 진행 — 자산 확보(P6a) → 등록 대기(P6b) | V155-1: `geometry/vnm-water-coastal-infra.geojson`(항만 66·댐 1,255·저수지 237, gzip 1.22 MB), 계약 제안 `spatial/pending-layers-v155.json`, `reports/v155/water-coastal-infra.png` | 완료(`category-bar`) · QA 152/152 |
| A-029 | FTA 체결 현황 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`timeline`) · QA 152/152 |
| A-030 | 한-개도국 교역액 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-031 | 물류성과지수(LPI) | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-032 | 중간재 교역 규모 | 국가 기본 정보 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| A-033 | 해운 연결성(LSCI) | 국가 기본 정보 | actual-records | country-aggregate/0 | 시각화 미완 | LSCI 추이+항만 연결 비교 | P4 | 집중검토 |  | 완료(`line`) · QA 152/152 |
| B-001 | 건기/우기 | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 월별 평년값(1991–2020 고정 기간의 계절 프로파일)은 연도 간 시계열이 아니므로 선 대신 월별 막대로 표시) · QA 152/152 |
| B-002 | 기후대(Climate zone) | 기후 환경 | actual-records | panel-only/0 | 한글 먼저, 영문 괄호 | 라벨 순서 변경+기후대 구성 지도/표 | P4 | 완료(D0) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §5 · screens/B-002-1440.png | 예외(`category-bar` · 기후대 분류는 2020년 단일 시점의 면적 구성으로 연도별 시계열이 없어 선 대신 기후대별 면적 막대로 표시) · QA 152/152 |
| B-003 | 연평균 기온; 연평균 강수 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-004 | CMIP6 기반 과거/미래 기후[기온(tas), 최고기온(tasmax), 최저기온(tasmin), 강수(pr | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-005 | 가뭄[연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분] | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-006 | 폭염[폭염일수(TX35), 폭염일수(TX40), 열대야(TR20), 열대야(TR25), Heat Index( | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-007 | 홍수[최대 1일 강수(RX1day), 최대 5일 강수(RX5day), 호우일수(R20mm), 호우일수(R50 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-008 | NASA 해수면 상승 전망[SSP1, SSP2, SSP3, SSP4, SSP5] | 기후 환경 | actual-records | point/5 | 지도에서 얼마나 덮히는지 | 관측소 시나리오 추이 유지+DEM 기반 저지대 침수 범위 레이어(주의문 포함) | PE | 진행 — 자산 확보(P6c) → 등록 대기(P6b) | V155-2: `geometry/vnm-slr-lowland-le0p5m/le1m/le2m.geojson`(성·시별 저지대 691·1,429·9,465 km², gzip 0.20/0.39/1.96 MB, 주의문 동봉), 대응표 `spatial/pending-v155/b-008-slr-zones.json`(315행), 성별 요약 `b-008-lowland-by-adm1.json`, 계약 제안 `spatial/pending-layers-v155.json`, `docs/DATA_ASSETS_V155.md` §6, `reports/v155/slr-lowland.png` | 완료(`line`) · QA 152/152 |
| B-009 | WWF 생물다양성·기후 리스크 | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-010 | 기후 리스크 지수(CRI) | 기후 환경 | partial-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 관측연도가 2개(2023·2024)뿐이며 순위·피해액·인명피해가 서로 다른 척도로 별도 비교되어 단일 시계열 선 대신 항목별 막대로 표시) · QA 152/152 |
| B-011 | 기후 취약성 지수(ND-GAIN) | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-012 | 재해·재난 이력(EM-DAT) | 기후 환경 | partial-records | cluster/265 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| B-013 | World Bank CBAM 영향 지수 | 기후 환경 | actual-records | country-aggregate/0 | 비료만 있음 | 부문 커버리지 명시, EU 수출 노출 부문 확장(Comtrade 근거) | P4+PE | 집중검토 |  | 예외(`category-bar` · EU CBAM 노출지수가 2022년 단일 연도의 산업별 비교값만 제공되어 시계열 선 대신 산업별 막대로 표시) · QA 152/152 |
| B-014 | CCDR 탄소세 시뮬레이션 결과[배출감소율, GDP 영향, 세수 효과] | 기후 환경 | actual-records | country-aggregate/0 | 시각화 미완 | 시나리오별 배출·GDP 영향 라인 | P4 | 집중검토 |  | 예외(`category-bar` · 2030·2040년 두 시점의 시나리오별 비교값만 제공되어 시계열 선 대신 시나리오별 막대로 표시) · QA 152/152 |
| B-015 | 탄소 가격 수준[ETS, Carbon Tax] | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`timeline`) · QA 152/152 |
| B-016 | 화석연료 의존도(Fossil fuel energy consumption) | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-017 | WRI Aqueduct 물 스트레스 지수 | 기후 환경 | actual-records | country-aggregate/0 | 지도? | Aqueduct 4.0 유역 경계 확보→지도 | PE | 진행 — 자산 확보(P6a) → 등록 대기(P6b) | V155-1: `geometry/vnm-aqueduct40-basins.geojson`(442/443, string_id 조인 443/443)+`-l6`(58 유역), 값 초안 `spatial/pending-v155/b-017.json`, 계약 제안 `spatial/pending-layers-v155.json`, `reports/v155/aqueduct-basins.png` | 예외(`table` · Aqueduct 평가구역 경계 미확보(지도 보류) · 등급별 평가구역 수 표가 먼저) · QA 152/152 |
| B-018 | SSP GDP 전망[SSP1, SSP2, SSP3, SSP4, SSP5] | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-019 | SSP 인구 전망[SSP1, SSP2, SSP3, SSP4, SSP5] | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-020 | EU/UN INFORM Risk Index(복합 리스크 지수) | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-021 | Global Data Lab GVI(Vulnerability Index) | 기후 환경 | actual-records | region-choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-022 | CCDR 기후 피해 경제적 비용 | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 2040년 단일 시나리오 시점의 재원 구성 비교값만 제공되어 시계열 선 대신 재원별 막대로 표시) · QA 152/152 |
| B-023 | 건기/우기 유량 차이 | 기후 환경 | actual-records | point/3 | 지도 지역 선택 시 차이 표시 | 덤벨 마커+클릭 패널(건기·우기·차이) | P4 | 집중검토 |  | 완료(`dumbbell`) · QA 152/152 |
| B-024 | 농업 용수 비중 | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-025 | 유역 면적 | 기후 환경 | actual-records | point/8 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`dumbbell`) · QA 152/152 |
| B-026 | 유향(flow direction) | 기후 환경 | actual-records | panel-only/0 | 지도? | 성·시 choropleth(우세 유향)+방위 로즈 | P4 | 집중검토 |  | 예외(`category-bar` · 성·시별 값은 8방향 비율이라 한 값의 지역 막대가 없음. 선택 성·시의 방향별 비율 막대로 표시, 우세 유향 지도는 후속(P4)) · QA 152/152 |
| B-027 | 지하수 잠재량 | 기후 환경 | actual-records | panel-only/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-028 | 하천 유량 | 기후 환경 | actual-records | point/4 | 시각화 미완 | 관측소 지도(값 크기)+월별/연도 추이 | P4 | 집중검토 |  | 예외(`sorted-table` · 관측지점별 단위가 달라 한 축의 막대·덤벨을 만들 수 없어 지점별 정렬표로 표시, 전국 총량은 별도) · QA 152/152 |
| B-029 | 산림 유형별 면적[열대우림, 맹그로브, 이탄지 등] | 기후 환경 | partial-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-030 | 산림 이득 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-031 | 산림 총 면적 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-032 | 수관 피복률 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-033 | 연간 산림 손실 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-034 | 탄소 저장량 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-035 | LULUCF 관련 면적 변화 | 기후 환경 | actual-records | country-aggregate/0 | 시각화 미완 | 토지유형별 누적막대(연도)+순변화 라인 | P4 | 집중검토 |  | 완료(`line`) · QA 152/152 |
| B-036 | 토지이용 변화율 | 기후 환경 | actual-records | panel-only/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 2020·2024년 두 시점만 제공되어 시계열 선 대신 토지 유형별 변화율 막대로 표시) · QA 152/152 |
| B-037 | 토지피복 분류별 면적[경작지, 산림, 초지, 건물, 수체, 나지] | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`table` · ESA WorldCover 2021년 단일 시점이라 연도별 누적영역 불가 · 분류별 면적은 성·시 값이므로 지역 비교표가 먼저) · QA 152/152 |
| B-038 | 바이오매스 자원 가용량[농업잔재, 임업잔재, 도시폐기물, 축산폐기물] | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| B-039 | 수력 잠재량 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-040 | 지열 잠재량 | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-041 | 태양광 관련 지표[GHI, DNI] | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-042 | 풍력 자원[풍속, 에너지밀도] | 기후 환경 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| B-043 | 화석연료 자원량[석탄, 석유, LNG 등] | 기후 환경 | actual-records | country-aggregate/0 | 시각화 미완 | 자원별 매장량 막대, 단위 통일(원단위+toe 병기) | P4 | 집중검토 |  | 예외(`category-bar` · 2020년 단일 연도의 자원별 가채연수 비교값만 제공되어 시계열 선 대신 자원별 막대로 표시) · QA 152/152 |
| B-044 | 광물명[리튬, 코발트, 니켈, 망간, 흑연, 주석, 납, 아연, 마그네슘화합물, 텅스텐, 바나듐, 크롬, 나 | 기후 환경 | actual-records | country-aggregate/0 | 시각화 미완 | 광물×상태(매장/생산/탐사) 매트릭스, B-046/047 연계 | P4 | 집중검토 |  | 예외(`cards-list` · 광물별 자원·규정 조건은 문장값이라 정렬표 대신 근거 카드 목록으로 열림 · 매트릭스는 후속(P4)) · QA 152/152 |
| B-045 | 글로벌 순위 | 기후 환경 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 2026년 단일 연도 기준 광물별 세계 비중 비교값만 제공되어 시계열 선 대신 광물별 막대로 표시) · QA 152/152 |
| B-046 | 매장량[확인, 추정] | 기후 환경 | actual-records | country-aggregate/0 | 1-3-18-24?, 전면 재검토 | 광물명 누락 재투영→광물별 매장량 막대+세계 순위 | P4-D0 | 완료(D0: 광물명 재투영·광물별 화면) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §1 · screens/B-046-1440.png | 완료·보존(`category-bar`) · QA 152/152 |
| B-047 | 연간 생산량 | 기후 환경 | actual-records | country-aggregate/0 | 1-3-18-24?, 전면 재검토 | 광물명 누락 재투영(원천 워크북)→광물별 막대+추이 | P4-D0 | 완료(D0: 광물명 재투영·연도별 화면) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §1 · screens/B-047-1440.png | 완료·보존(`table`) · QA 152/152 |
| B-048 | 주요 광산 위치 | 기후 환경 | actual-records | point/2 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| C-001 | NDC[제출년도, 버전, BAU 배출 전망, 감축 목표(무조건부/조건부), 부문별 감축 전략·수단 목록, N | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-002 | BTR[제출년도, 문서 링크, GHG 총배출량(incl./excl. LULUCF), 부문별 NDC 감축 달성 | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · BUR3(2016) 단일 시점 부문별 인벤토리 수치라 추이선 대신 부문별 막대) · QA 152/152 |
| C-003 | NAP[제출년도, 문서 링크, 부문별 취약성 평가, 적응 우선 분야, 적응 우선 조치 목록(단기/중기/장기) | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-004 | LT-LEDS[장기 배출 경로(BAU/감축/넷제로 시나리오별), 넷제로 목표 연도, 넷제로 목표 범위, 부문 | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-005 | TNA[수행 여부, 수행 연도, 기술 이전 장벽(Barrier Analysis 결과), TAP(기술실행계획) | 정책·제도 | actual-records | country-aggregate/0 | 더 보기 쉽게 | 부문×우선순위 히트맵/정렬 표+장벽 태그 | P4 | 집중검토 |  | 예외(`comparison-table` · 부문×우선순위 매트릭스는 문장값 비교표로 열림 · 히트맵·정렬표는 후속(P4)) · QA 152/152 |
| C-006 | ITMO 양자 협정[체결국, 체결 일자, 대상 부문, 대상 기술, 승인 기관(Authorization Bod | 정책·제도 | actual-records | country-aggregate/0 | 시각화 미완 | 협정·기관·절차 타임라인+체계표 | P4 | 집중검토 |  | 완료(`comparison-table`) · QA 152/152 |
| C-007 | 파리협정 제6.8조 비시장 접근법[참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 | 정책·제도 | actual-records | country-aggregate/0 | 시각화 미완 | 현황표+항목 설명 | P4 | 집중검토 |  | 완료(`comparison-table`) · QA 152/152 |
| C-008 | Cooperative Climate Initiative[이니셔티브 명, 참여 상태(Active/Complet | 정책·제도 | actual-records | country-aggregate/0 | 정식명칭 대신 설명 추가 | 이니셔티브별 설명(공식 개요·출처)+참여 타임라인 | P4-D3 | 완료(D3) | reports/v153/D3_POLICY_DESCRIPTIONS.md · policyDescriptionsV153.json(57건 작성·미확인 0) · d3-policy-descriptions-qa.json · PR #22 — 이니셔티브 19·협약 4 카드, 설명 우선·명칭 괄호 | 완료(`comparison-table`) · QA 152/152 |
| C-009 | 기후 법제도[법령명, 유형(법률/시행령/규제/인센티브), 대상 분야(감축/적응/에너지/산업), 시행 연도,  | 정책·제도 | actual-records | choropleth/4 | 법/제도 설명 추가 | 법령별 설명(공식 개요·출처 링크) 작성·표시 | P4-D3 | 완료(D3) | reports/v153/D3_POLICY_DESCRIPTIONS.md · policyDescriptionsV153.json(57건 작성·미확인 0) · d3-policy-descriptions-qa.json · PR #22 — 문서 19건 카드(타임라인 20항목) · 320px 넘침 39px는 P4-D1 레이아웃에서 처리 | 완료(`timeline`) · QA 152/152 |
| C-010 | 기타 환경 법제도[법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처,  | 정책·제도 | actual-records | choropleth/4 | 레이아웃 좋음, 법/제도별 설명 추가 | 법령별 설명(공식 개요·출처 링크) 작성·표시 | P4-D3 | 완료(D3) | reports/v153/D3_POLICY_DESCRIPTIONS.md · policyDescriptionsV153.json(57건 작성·미확인 0) · d3-policy-descriptions-qa.json · PR #22 — 문서 20건 카드(타임라인 19항목) · 320px 넘침 39px는 P4-D1 레이아웃에서 처리 | 완료(`timeline`) · QA 152/152 |
| C-011 | 치안·안전 정보[경보 등급(여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계] | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-012 | PPP 법제도·조달 체계[PPP 법률 유무, PPP 법률 명칭, PPP 전담 기관, 조달 방식(경쟁입찰/협상 | 정책·제도 | actual-records | region-choropleth/56 | 한글화 | 한글화(원문 병기)+34개 지역 지도+지역 클릭 개조식 패널 | P4 | 진행(D0: 한글화·개조식 완료 · 34개 지역 지도는 P4) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §4 · screens/C-012-1440.png | 완료·보존(`comparison-table`) · QA 152/152 |
| C-013 | 외국인 투자 규정[외국인 지분 제한, 투자 인센티브(세제 혜택/경제특구), 투자 보호 협정(BIT), 수익  | 정책·제도 | actual-records | region-choropleth/14 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-014 | 인허가 프로세스[환경영향평가(EIA) 절차, 건축 허가 절차, 건축 허가 소요 기간, 건축 허가 비용, 전력 | 정책·제도 | actual-records | country-aggregate/0 | 시각화 미완 | 단계 흐름도+소요기간 표 | P4 | 집중검토 |  | 완료(`comparison-table`) · QA 152/152 |
| C-015 | 상기 문서들의 원본 링크 | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-016 | 재생에너지 발주 및 확대 계획[국가 RE 용량 목표, 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 | 정책·제도 | actual-records | choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| C-017 | 재생에너지 투자 인센티브[인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력 | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-018 | 중장기 에너지 전망[전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망, 기술별 발전 설 | 정책·제도 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`category-bar`) · QA 152/152 |
| C-019 | 탄소 시장 법률·예산[탄소세 도입 여부, 탄소세 세율, ETS 도입 여부, ETS 대상 부문, ETS 가격, | 정책·제도 | actual-records | region-choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| C-020 | GHG 감축 사업 타당성 기초 정보 | 정책·제도 | not-collected | not-applicable/0 | 데이터 없음 | 상태 안내 유지 또는 CDM/JCM 등록부 수집(결정) | PE | 집중검토 |  | 완료(`status-note`) · QA 152/152 |
| C-021 | VCM 프로젝트 파이프라인 | 정책·제도 | not-collected | not-applicable/0 | 시각화 미완(미수집) | C-025 연결 안내 또는 Verra/GS 등록부 수집(결정) | PE | 집중검토 |  | 완료(`status-note`) · QA 152/152 |
| C-022 | 탄소시장 준비도 | 정책·제도 | actual-records | region-choropleth/63 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`region-bar`) · QA 152/152 |
| C-023 | 한계저감비용(MAC) | 정책·제도 | not-collected | not-applicable/0 | 시각화 미완 | MAC 커브(누적 감축량 vs 비용) | P4 | 집중검토 |  | 완료(`status-note`) · QA 152/152 |
| C-024 | REDD+ 현황[REDD+ 전략 수립 여부, FREL 제출 여부, FREL 제출년, 결과기반지불(RBP) 수 | 정책·제도 | actual-records | choropleth/6 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| C-025 | 탄소크레딧 발행·소각 실적[프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량, 소각량, 빈티 | 정책·제도 | actual-records | point/262 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-001 | 단위 사업당 CAPEX | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 단일 시점(2024) 기술별 비교값만 있어 추이선 대신 기술별 막대) · QA 152/152 |
| D-002 | 시장 성장률 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 기준기간별 CAGR 비교값만 있어 추이선 대신 분야별 막대) · QA 152/152 |
| D-003 | 예상 감축량 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 단일 시점 기술별 감축량 비교값만 있어 추이선 대신 기술별 막대) · QA 152/152 |
| D-004 | 크레딧 가격 연동 수익성 | 시장·산업 및 재원 | actual-records | country-aggregate/0 | 시각화 미완 | 가격 시나리오×수익 라인 | P4 | 집중검토 |  | 예외(`category-bar` · 가격 시나리오별 회수율 비교값만 있어 추이선 대신 기술·시나리오별 막대) · QA 152/152 |
| D-005 | 감축/적응 구분별 예산 배분 비율 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`category-bar`) · QA 152/152 |
| D-006 | 기후 관련 조세 수입 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| D-007 | 기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`timeline`) · QA 152/152 |
| D-008 | 주관 부처별 기후 예산 규모 | 시장·산업 및 재원 | actual-records | choropleth/3 | 시각화 미완 | 부처별 막대+지역 지도(3개 지역 값) | P4 | 집중검토 |  | 예외(`category-bar` · 부처별 예산 비중이 주 분석, 지역값 3개는 지도에서 확인) · QA 152/152 |
| D-009 | 기후대응·기후기술 관련 정부 예산[총 지출 규모, 연도별 추이] | 시장·산업 및 재원 | actual-records | panel-only/0 | 데이터 부족 | 자료 범위 명시+추이, 추가 수집 결정 | P4+PE | 집중검토 |  | 예외(`category-bar` · 원자료에 2013년 단일 관측값만 존재해 연도축 line 대신 category-bar로 표시함) · QA 152/152 |
| D-010 | 화석연료 보조금 규모 | 시장·산업 및 재원 | actual-records | country-aggregate/0 | 시각화 미완 | 연료별 누적 추이+GDP 대비 % | P4 | 집중검토 |  | 완료(`line`) · QA 152/152 |
| D-011 | 개도국 내 각국별 ODA 규모 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`line`) · QA 152/152 |
| D-012 | 경쟁국 민간기업의 개도국 진출 현황[기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-013 | GGGI Green Growth Index(녹색성장지수) | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 2024년 단일 시점 부문 점수만 있어 추이선 대신 부문별 막대) · QA 152/152 |
| D-014 | EDCF 프로젝트[프로젝트명, 수원국, 섹터, 승인 금액, 금리, 상환 기간, 거치 기간, 사업 기간, 시행 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-015 | ODA Korea 프로젝트[사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-016 | 지자체·정부부처 프로젝트[사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-017 | 한국 ODA 기관 PCP/입찰 현황[사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-018 | Adaptation Fund 프로젝트[프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액 | 시장·산업 및 재원 | actual-records | regional-scope/4 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`table` · 베트남 단독·다국가 사업 4건의 승인액은 표로 먼저(다국가 총액 합산 금지)) · QA 152/152 |
| D-019 | CTCN 기술지원 요청[요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Sc | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-020 | GCF 프로젝트[프로젝트명(Ref No.), 국가, 인가기관(AE), GCF 승인 금액, 공동재원, 분야(m | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-021 | 주요 국제기구·MDB 프로젝트[프로젝트명, 수원국, 공여기관(WB/ADB/UNDP/FAO/UNCCD 등),  | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-022 | MDB/DFI/PPP 투자 프로젝트[프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5 | 시장·산업 및 재원 | actual-records | country-aggregate/0 | 사업 위치 추후 추가 | 목록·금액 구성+좌표 수집 후 지도 | P4+PE | 진행 — 자산 확보(P6c) → 등록 대기(P6b) | V155-2: `spatial/pending-v155/d-022-locations.json`(15건 매핑률 100% — 성·시 7·전국 8·미확인 0, 출처 URL 60/60), 검수 `tools/vietnam_spatial/source/d-022-review-v155.json`, 계약 제안 `spatial/pending-layers-v155.json`(region-choropleth native-34), `docs/DATA_ASSETS_V155.md` §7 | 완료(`category-bar`) · QA 152/152 |
| D-023 | ODA 및 기후기금(GCF, GEF, AF) 재원[프로젝트명, 수원국, 기금명(GCF/GEF/AF/CIF), | 시장·산업 및 재원 | actual-records | panel-only/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-024 | VC·임팩트 투자 현황[투자 라운드(Seed/Series A-C), 투자자명, 투자 금액, 대상 기업/기술, | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-025 | 민간 인프라 투자(PPI)[프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/ | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| D-026 | MIGA 정치적 리스크 보증[프로젝트명, 국가, 섹터, 보증 금액, 보증 유형(수용/이전제한/계약위반/전쟁내 | 시장·산업 및 재원 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-001 | CTCN NDE(국가지정기구)[국가, 기관명, 소속 부처, 담당자명(Focal Point), 직함, 이메일, | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-002 | DNA(국가지정기관)[국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전 | 협력·실행 기반 | actual-records | country-aggregate/0 | 지도? | 기관 카드+사무소 위치 지도(주소 지오코딩) | P4 | 집중검토 |  | 예외(`cards-list` · DNA 기관이 1곳만 존재해 category-bar 대신 카드형 정보로 표시함) · QA 152/152 |
| E-003 | GCF NDA(국가지정기관)[국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 전화번호] | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-004 | 국제기구 현지사무소 담당자[기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA | 협력·실행 기반 | actual-records | point/17 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-005 | 대학·연구기관·NGO[기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국, 도시, 전문 분야(기후/에 | 협력·실행 기반 | actual-records | point/20 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-006 | 현지 투자자 네트워크[기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너 | 협력·실행 기반 | actual-records | point/8 | 지도 추가, 현지가 아닌 기관 포함 | 베트남 소재 기관만 지도(도시), 해외 본부 6곳은 별도 목록 | P4 | 완료(D0: 소재 8/7 분리 · 지도 피처 8 유지) | PR-D0 reports/v153/D0_DATA_DEFECTS.md §2 · screens/E-006-1440.png | 예외(`region-bar` · 기관 유형별 수보다 소재 도시별 분포가 먼저(지도와 짝) — 도시 단위 지역 막대) · QA 152/152 |
| E-007 | 온실가스 산정 MRV 체계[GHG 인벤토리 작성 역량(Tier 1/2/3), 국가 레지스트리 유무, 제3자  | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`comparison-table`) · QA 152/152 |
| E-008 | 논문·특허[논문·특허명, 기후기술 분야, 특허 출원인 국적, 특허 출원 연구기관·대학명, 논문 국제 공저 비 | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-009 | STEM 졸업자 수; 연구자 수 | 협력·실행 기반 | partial-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 예외(`category-bar` · 원자료에 2016년 단일 관측값만 존재해 연도축 line 대신 category-bar로 표시함) · QA 152/152 |
| E-010 | UNESCO UIS R&D 지출(GERD); WIPO 혁신지수(GII) | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`line`) · QA 152/152 |
| E-011 | 기술준비수준(TRL) | 협력·실행 기반 | no-populated-record | country-aggregate/0 | 없음 | 공개 출처 부재 → 상태 안내 유지 | 유지 | 집중검토 |  | 완료(`status-note`) · QA 152/152 |
| E-012 | 직군별 종사자 수; 직군별 임금 | 협력·실행 기반 | partial-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료·보존(`category-bar`) · QA 152/152 |
| E-013 | 운영·유지보수 역량[숙련 기술인력 가용성, 부품 조달 가능성(국내생산/수입의존), 예방정비 체계 수준, A/ | 협력·실행 기반 | no-populated-record | country-aggregate/0 | 시각화 미완 | 자료 미제공 상태 안내 유지 | 유지 | 집중검토 |  | 완료(`status-note`) · QA 152/152 |
| E-014 | 양자협정[협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이 | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`timeline`) · QA 152/152 |
| E-015 | NDC Partnership[참여 여부(Y/N), Country Page 링크] | 협력·실행 기반 | actual-records | country-aggregate/0 | 시각화 미완 | 참여 형태·연도 타임라인+파트너 유형 구성 | P4 | 집중검토 |  | 완료(`comparison-table`) · QA 152/152 |
| E-016 | 한국 기후기술 TRL | 협력·실행 기반 | actual-records | country-aggregate/0 | 시각화 미완 | 기술별 성숙도 순위 막대 | P4 | 집중검토 |  | 완료(`comparison-table`) · QA 152/152 |
| E-017 | 한국-경쟁국 기후기술 비교우위 | 협력·실행 기반 | actual-records | country-aggregate/0 | 시각화 미완 | 국가별 순위 비교(대상국 라벨 복원) | P4 | 집중검토 |  | 예외(`comparison-table` · 국가별 순위 비교표로 열림 · 순위 막대(대상국 라벨 복원)는 후속(P4)) · QA 152/152 |
| E-018 | 국내 기업 개도국 진출[기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝 | 협력·실행 기반 | actual-records | point/14 | 시각화 미완 | 아이콘 지도+분야·진출형태 구성 | P3+P4 | 진행 — 아이콘 지도 완료(P3·V152), 분야·진출형태 구성은 P4 | V152: 기업 아이콘(building-skyscraper)+KR 표시가 큰 지도·미니맵·범례·팝업(라벨형 카드)에 공통 적용, `reports/v152/map-icons-runtime-v152.json`·`reports/v152/minimap-runtime-v152.json` | 완료(`category-bar`) · QA 152/152 |
| E-019 | 한국 기관 사무소[기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, | 협력·실행 기반 | actual-records | point/6 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |
| E-020 | 한국 공공·민간 지원체계[지원기관명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램명,  | 협력·실행 기반 | actual-records | country-aggregate/0 |  | 표준 계약(유형별 1순위) 적용·검증 | P4 | 대기 |  | 완료(`category-bar`) · QA 152/152 |

## 비고 — 데이터 외 후속(V151-2, 2026-09-22)
- 배경지도 '도로·지명'(OpenFreeMap Liberty) 첫 타일 1.04~1.34 s(목표 ≤1 s 미달, 콜드 3회). Liberty 스타일 JSON fetch + 110 레이어 삽입 + OFM 벡터 네트워크가 원인. 후속: 스타일 JSON 번들 내장 또는 핵심 레이어만 직접 정의. 지형(기본) 0.85 s·위성 0.34 s는 충족. 증빙 `reports/v151-2/backdrop-first-tile.json`.

