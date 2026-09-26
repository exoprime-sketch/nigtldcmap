# 데이터 구조 4형태 스키마 (V159 초안 · 2026-09-24)

용역사 구조화 작업용 초안이다. 152개 요소를 개별 설계하지 않고 아래 4개 구조(S1~S4) 중 하나로 납품하면, 플랫폼의 구조 어댑터(`src/data/structure/S*V159.ts`)가 정규화해 표출 템플릿 6개(①~⑥, ⓪ 상태 안내)에 넣는다. 배정표(요소 → 표출 유형·구조)는 `docs/plan/V159_데이터유형화_명세.md` §4가 정본이며, 확정본은 `src/data/spec/datasetTypologyV159.json`으로 생성된다.

- 근거: 현행 납품 서식(별첨1 표준서식 v2: `1.1_observation(측정값)` · `1.2_entity(레코드형)` · `2_meta_info` · `3_결측사유코드`)과 5차 납품 149개 워크북 실측(2026-09-24).
- 원칙: 기존 열은 **이름·의미를 바꾸지 않는다**. 이번 초안은 현재 `indicator_id` 접미사나 `note` 문자열에 섞여 있는 차원(범주·시나리오·지역·기술)을 **명시 열로 분리**하는 것만 추가한다. 추가 열은 모두 선택(해당 없으면 비움)이다.
- 결측: 기존 규칙 그대로. 결측은 `value`를 비우고 `missing_reason_code`(M01~M10)를 기입한다. 0으로 채우지 않는다. 원자료에 없는 값(좌표·경계·분야·지역 태그)은 만들지 않는다.

## 0. 한눈에

| 구조 | 한 행의 뜻 | 납품 시트 | 필수 키 | 선택 차원 열 | 요소 수 | 주 표출 유형 |
|---|---|---|---|---|---|---|
| **S1 국가×연도 관측값** | 한 나라·한 시점·한 지표의 값 1개 | `1.1_observation` | `요소_id` · `indicator_id` · `country_iso3` · `year` | `period` · `category` · `scenario` · `tech_id` · `bound` | 58 | ① ③ ⑥(지수형) |
| **S2 지역×연도 관측값** | 한 행정구역·권역·유역·시점·지표의 값 1개 | `1.1_observation` + 지역 열(권장, §2.2.1) | S1 키 + `region_system` · `region_key` | S1과 동일 | 27 | ② ⑤(D-008) |
| **S3 위치 개체** | 좌표나 기하가 있는 시설·기관·관측소 1개 | `1.2_entity` | `요소_id` · `indicator_id` · `record_key` · `geometry_type` · (`lat`·`lon` 또는 기하 파일) | 분류 · 규모 · 연도 · 소유 · 출처 URL · `adm1` | 17 | ④ ②(B-008·B-012) ⑤(C-025) |
| **S4 비공간 개체** | 문서·사업·기관·법령·기술 항목 1개 | `1.2_entity`(좌표 열 비움) | `요소_id` · `indicator_id` · `record_key` | 유형 · 연도 · 상태 · 설명 · 링크 · 지역 태그 · 금액 · 기관 · 기술 | 50 | ⑤ ⑥ ④(기관 도시) ③(C-005) ⓪ |

교차 점유(표출 유형 × 구조, 13칸): ①S1 48 · ①S4 1 · ②S2 26 · ②S3 2 · ③S1 6 · ③S4 1 · ④S3 14 · ④S4 3 · ⑤S2 1 · ⑤S3 1 · ⑤S4 17 · ⑥S1 4 · ⑥S4 21 · ⓪S4 7. 명세 v2 배정표를 다시 집계해 확인했다.

플래그(템플릿 옵션일 뿐 새 구조가 아니다): `region`(64) · `tech`(배정표 집계 80, 명세 본문 표기 82와 다름 → 적재 시 확정) · `geometry` · `categorical` · `scenario`.

## 1. 공통 규칙

| 항목 | 규칙 |
|---|---|
| `요소_id` | framework ID(`A-001` 형식). 임의 생성 금지 |
| `indicator_id` | `<요소_id>_<지표 슬러그>`. 요소 안의 지표 구분자다. **차원(범주·시나리오·지역·기술)은 이 슬러그에 넣지 말고** §1의 선택 열에 넣는다. 이미 납품된 ID는 그대로 두고 선택 열만 채워도 된다(어댑터가 둘 다 읽음) |
| `country_iso3` | ISO 3166-1 alpha-3(`VNM`, `BGD` …) |
| `year` / `period` | 연 단위는 `year`(정수). 분기·월·기간은 `period`에 `2024Q3` · `2024-07` · `2010-2013` 형식으로 쓰고 `year`에는 대표 연도(기간 끝 연도)를 쓴다 |
| `value` | 숫자는 숫자로, 코드·명칭 값(예: 법령 번호)은 문자열로 둔다. 단위 환산 금지(원문 단위는 `2_meta_info.unit`) |
| `missing_reason_code` / `note` | 기존 규칙 그대로. `note`의 `[실적치]` · `[추정치]` · `[전망치]` · `[하한(min)]` · `[상한(max)]` 머리표는 §1의 `value_kind` · `bound` 열로 옮기는 것을 권장한다(옮긴 뒤에도 note 유지 가능) |
| `tech_id` | 38대 기후기술 번호. 한 값은 `07`처럼 두 자리로 쓰고, 여러 개는 `;`로 잇는다(`30;32`). `"7"`과 `"CTIS-07"`은 같은 기술이며 플랫폼은 두 자리 키로 비교한다. 현행 `2_meta_info.tech_ids`(지표 단위)는 유지한다. 행마다 기술이 다를 때만 관측·개체 행의 `tech_id`를 쓴다 |
| 출처·라이선스 | 지표 단위 메타는 `2_meta_info` 그대로. 개체 단위 출처는 S3·S4의 `record_source_url` |

선택 차원 열(S1·S2 공통, 모두 선택):

| 열 | 뜻 | 예 | 현재 위치(이관 대상) |
|---|---|---|---|
| `category` | 구성 항목(가스 종류·부문·연료·광종·직군 등) | `CO2` · `Energy` · `Hydro` | `indicator_id` 접미사 (A-010·A-011·A-018·B-043·B-046) |
| `scenario` | 시나리오·경로 | `SSP2-4.5` · `low`/`mid`/`high` | `indicator_id` 접미사 (B-004·B-008·B-018·D-004) |
| `tech_id` | 기후기술 | `07` | `note`(D-004 `[태양광 기술 …]`) |
| `bound` | 범위값의 위치 | `min` · `max` · `central` · `q17` · `q83` | `indicator_id`·`note` (C-016 `_min/_max`, B-008 `_q17`) |
| `value_kind` | 값의 성격 | `actual` · `estimate` · `projection` | `note` 머리표 |

## 2. 구조별 스키마

### 2.1 S1 국가×연도 관측값 (58)

- 납품: `1.1_observation(측정값)`. 기존 8열 + 선택 차원 열.
- 대표: A-001 CPI(단일 지표), A-010 가스별 배출(`category`), A-018 기술별 설비용량(`category`·`tech_id`), B-018 SSP GDP 전망(`scenario`), D-004 크레딧 회수율(`tech_id`×`scenario` 히트맵), C-022 체크리스트 점수(⑥ 지수형).

| 납품 열 | 어댑터 필드(`S1CountryObservationV159`) | 템플릿 입력 |
|---|---|---|
| `요소_id` | `elementId` | 라우팅 키 |
| `indicator_id` | `indicatorId` | 계열 ID, 계약 `headlineIndicatorIds` 조인 |
| `country_iso3` | `countryIso3` | 국가 비교·순위(①·③) |
| `year` / `period` | `year` · `period` | x축(시간) |
| `value` | `value`(number \| string \| null) | y값·KPI·표 |
| `missing_reason_code` | `missingReasonCode` | 결측 표시(0 대체 없음) |
| `note` | `note` | 행 주석 툴팁 |
| `category` | `category` | 구성 막대·누적영역·도넛 계열 |
| `scenario` | `scenario` | 시나리오 토글 |
| `tech_id` | `techIds: string[]`(두 자리 정규화) | 38대 기술 필터·③ 기술 순위 |
| `bound` | `bound` | 범위 밴드(min–max) |
| `value_kind` | `valueKind` | 실적/추정/전망 표기 |
| `2_meta_info.unit` · `unit_detail` | `unit` · `unitDetail` | 축 단위(계약값 우선 → `ChartAxesV150`) |

### 2.2 S2 지역×연도 관측값 (27)

- 대상: A-026, B-002~B-007, B-009, B-017, B-021, B-024, B-026, B-029~B-037, B-039~B-042, C-016, D-008.
- 한 행 = (지역, 시점, 지표)의 값 1개. S1의 모든 열 + 아래 지역 열.

| 납품 열(추가) | 뜻 | 허용값 | 어댑터 필드(`S2RegionObservationV159`) |
|---|---|---|---|
| `region_system` | 지역 체계 | `adm1-63`(개편 전 63개) · `adm1-34`(2025-07-01 시행 34개) · `region-6`(6개 권역, GDL 등) · `basin-aqueduct40` · `basin-hydrosheds` · `ministry`(부처, D-008) | `regionSystem` |
| `region_key` | 체계 안의 키 | `adm1-63`: GADM `VNM.1_1` 형식 · `adm1-34`: 34개 코드 · `region-6`: 원천 코드(`VNMr104`) · 유역: 원천 ID(Aqueduct `string_id`) | `regionKey` |
| `region_name` | 원문 지역명(검수용) | 원천 표기 그대로 | `regionName` |

- 63 → 34 변환은 플랫폼이 한다. 대응표 정본은 `reports/v138/map-targets-build-v138.json`의 `crosswalk34`이고, 레이어별 집계 규칙은 `boundaryPolicy`(합계·면적가중평균·범위만 등)를 따른다. 용역사는 **원천이 제공하는 체계 그대로** 납품하고 합산·평균을 미리 계산하지 않는다.
- 국가 전체 값은 같은 시트에 `region_system`·`region_key`를 비워 두면 S1 행으로 읽는다(전국 기준값).
- 범주형 지역값(B-002 최다 기후대, B-026 우세 유향)은 `value`에 코드 문자열, 구성비는 `category`별 행으로 따로 둔다.

#### 2.2.1 명세 v2와 다른 점(확인 필요)
- 명세 v2 §2는 S2 납품 시트를 `1.2_entity(polygon 키)`로 적었다. 그런데 현행 납품을 실측해 보니 지역값은 관측(값·연도) 형태다. 예를 들어 B-021은 권역이 `indicator_id` 접미사와 `note`의 `GDLCODE=VNMr104`에 들어 있다. 그리고 성·시 값은 워크북 밖의 공간 레이어 표(`spatial/layers/*.json`, `adm1Code` 조인)로 들어와 있다.
- 그래서 이 초안은 **`1.1_observation`에 지역 열 3개를 추가**하는 방식을 권장한다. 개체 시트에 넣으면 연도·지표 축이 `attr_n`으로 흩어져 S1과 어댑터를 공유할 수 없다. 두 방식 모두 어댑터 입력은 같다(§2.2 필드). 용역사 확정 전까지 두 형식을 모두 읽는다.

### 2.3 S3 위치 개체 (17)

- 대상: A-023~A-025, A-027, A-028, B-008, B-012, B-023, B-025, B-028, B-048, C-025, E-004~E-006, E-018, E-019.
- 납품: `1.2_entity(레코드형)`. 기존 열 `요소_id · 요소_명 · indicator_id · country_iso3 · lat · lon · geometry_type · crs · attr_1…attr_n · missing_reason_code · note`에 아래 명시 열을 추가한다. `attr_n`은 계속 쓸 수 있다. 다만 **라벨 행**(현행 E-001처럼 헤더 다음 행에 `기관명(org_name, 공식 영문명)` 식 설명)을 반드시 둔다. 어댑터는 라벨 행의 괄호 속 영문 키로 필드를 찾는다.

| 납품 열 | 뜻 | 어댑터 필드(`S3LocatedEntityV159`) | 템플릿 입력(④) |
|---|---|---|---|
| `record_key` (추가, 필수) | 원천 개체 ID(예: `WRI1030864`, 관측소 번호) | `recordKey` | 카드·팝업·지도 선택 동기화 |
| `name` (추가) | 원문 명칭 | `name` | 카드 제목(라벨형) |
| `lat` · `lon` | WGS84 십진수 | `latitude` · `longitude` | 점 |
| `geometry_type` | `point` · `line` · `polygon` | `geometryType` | 렌더러 선택 |
| `crs` | `EPSG:4326` | `crs` | 검증만 |
| `geometry_ref` (추가, 선·면만) | 기하 파일 안의 피처 ID(GeoJSON 별도 납품) | `geometryRef` | 선·면 |
| `class` (추가) | 분류(발전원·전압·광종·기관 유형 등) | `classKey` · `classLabel` | 아이콘·범례·분류별 수 |
| `size_value` · `size_unit` (추가) | 규모(MW·kV·km·건수) | `size` | 규모 막대·합계 |
| `year` (추가) | 준공·승인·관측 연도 | `year` | 필터 |
| `owner` (추가) | 소유·운영 기관 | `owner` | 카드 사실 |
| `adm1_name` (추가, 원천에 있을 때만) | 원천이 적은 소재 성·시 | `adm1Source` | 소재 표기(없으면 플랫폼이 좌표 point-in-polygon으로 산출, 경계 밖은 null) |
| `tech_id` | 기후기술 | `techIds` | 38대 기술 필터 |
| `record_source_url` (추가) | 레코드별 출처 | `sourceUrl` | 카드 링크 |

- 발전소(A-023)의 `class`는 `src/data/map/powerPlantFactsV141.ts`의 12종 라벨 키를 따른다.
- 좌표가 도시 대표점인 기관(E-004·E-005·E-006·E-018·E-019)은 `note`나 `coordinate_quality`(추가, `city-centroid` · `exact` · `admin-centroid`)에 그 사실을 적는다. 도시 대표점을 정밀 좌표처럼 쓰지 않는다.

### 2.4 S4 비공간 개체 (50)

- 대상: ⑤ 사업·재원 17, ⑥ 제도·규제·리스크 21, ④ 기관 3(E-001~E-003), ③ C-005, ① B-044, ⓪ 상태 안내 7.
- 납품: `1.2_entity(레코드형)`에서 `lat·lon·geometry_type·crs`를 비운다(현행 서식 안내문 "GIS 정보가 아닐 경우 삭제"와 같다). 현재 ⑥ 일부(C-009 법령 등)는 `1.1_observation`에 법령 번호를 `value`로 넣어 납품되어 있다. 새 납품은 개체 시트를 권장하고, 어댑터는 두 형식을 모두 읽는다.

| 납품 열 | 뜻 | 어댑터 필드(`S4EntityV159`) | 템플릿 입력 |
|---|---|---|---|
| `record_key` (필수) | 원천 ID(사업번호 `FP013`, 법령 번호 `72/2020/QH14`) | `recordKey` | 행 키 |
| `name` | 원문 명칭(사업명·법령명·기관명) | `name` | 목록 제목 |
| `record_type` | 유형(법률·시행령·결정 / 사업 유형 / 기관 유형) | `recordType` | ⑥ 유형별 그룹 · ⑤ 분류 파이 |
| `year` · `date` | 승인·공포·시행 연도, 날짜(`YYYY-MM-DD`) | `year` · `date` | 타임라인 · "최신 개정" |
| `status` | 상태(시행·개정·폐지·승인·종료 등 원문) | `status` | 상태 배지 |
| `description` | 원문 요지(요약 금지, 원문 인용) | `description` | 접이식 설명 |
| `amount_value` · `amount_currency` | 금액(원화 환산 금지) | `amount` | ⑤ 총액·정렬 |
| `org` | 공여·인가·주관 기관 | `org` | ⑤ 공여기관 상위 3 |
| `region_tags` | 적용 지역(원천이 밝힌 것만, `;` 구분, S2의 `region_system:key` 형식) | `regionTags` | ⑤ 지역 건수 지도 · ⑥ 적용지역 강조 |
| `tech_id` | 기후기술 | `techIds` | 38대 기술 필터 · ③ C-005 기술 목록 |
| `link` · `record_source_url` | 원문·레코드 출처 | `links` | 원문 링크 |
| `score` (C-022 등 체크리스트) | 원천 점수 | `score` | ⑥ 체크리스트 점수 |

- 연락처(E-001~E-003 담당자·이메일·전화)는 현행 `attr_n` 라벨을 유지하고, 공개 여부는 플랫폼 `publicationDecision`이 정한다.
- ⓪ 상태 안내 요소(C-020·C-021·C-023·E-011·E-013·E-016·E-017)는 데이터 행 없이 `2_meta_info.missing_reason_code`와 `missing_note`만 있으면 된다. 화면은 결정·사유·결정일 안내 1개만 보인다.

## 3. 어댑터 → 템플릿 연결

```
납품 워크북 ─ ETL(build_public_v2) ─ 팩 JSON(관측·개체·메타)
                                      │
                    datasetTypologyV159.json (displayType · structure · flags)
                                      │
          structure → 어댑터 S1/S2/S3/S4V159.ts  (위 표의 필드로 정규화)
                                      │
          displayType → 템플릿 U1~U6 · U0 V159.tsx (+ 계약 행: 1순위 타입·축·단위)
                                      │
                           판단 포인트 DecisionPointsV159 (값 없으면 숨김)
```

- 어댑터는 원자료 값만 옮긴다. 차원 열이 비어 있으면 현행 `indicator_id` 접미사와 `note` 머리표를 규칙표로 읽고, 규칙에 없는 것은 비워 둔다(추정 채움 금지).
- 전용 처리 6건(A-023·B-046/B-047·D-004·A-013·B-008·E-006)은 같은 어댑터 입력을 쓰되 템플릿 대신 전용 컴포넌트로 그린다.

## 4. 요소별 현행 인코딩 → 명시 열 이관 예(실측)

| 요소 | 현행 | 권장 |
|---|---|---|
| B-021 | `indicator_id=B-021_comp_sgdi_central_highlands`, `note=… GDLCODE=VNMr104` | `indicator_id=B-021_comp_sgdi` · `region_system=region-6` · `region_key=VNMr104` · `region_name=Central Highlands` |
| D-004 | `D-004_capex_recovery_solar_pv_low`, `note=[태양광 기술 · 저 시나리오] …` | `indicator_id=D-004_capex_recovery` · `tech_id=<태양광 번호>` · `scenario=low` |
| B-008 | `B-008_rsl_841_ssp119_q17` | S3 관측소 개체(`record_key=841`, 좌표) + 관측값 `indicator_id=B-008_rsl` · `scenario=SSP1-1.9` · `bound=q17` · `region_key`=관측소 키 |
| C-016 | `C-016_national_re_capacity_target_min` / `_max` | `indicator_id=C-016_re_capacity_target` · `bound=min`/`max` |
| D-008 | `D-008_climate_budget_mard`, `note=[MARD(농업농촌개발부)] 2010~2013 …` | `region_system=ministry` · `region_key=MARD` · `period=2010-2013` |
| A-023 | `attr_1=170.0`(용량) · `attr_2=Hydro` · `note=[발전소ID: WRI1030864] 명칭: A Luoi` | `record_key=WRI1030864` · `name=A Luoi` · `class=Hydro` · `size_value=170` · `size_unit=MW` |
| D-020 | 개체 시트의 `lat`/`lon` 자리에 사업명·금액이 들어감 | S4: `record_key=FP013` · `name=…` · `amount_value=29523000` · `amount_currency=USD` · `org=…`(좌표 열 비움) |

(주의: D-020 행은 좌표 열에 좌표가 아닌 값이 들어 있는 현행 결함 사례다. S4로 옮길 때 바로잡는다.)

## 5. 이후 산출(같은 PR)
- 구조별 입력 예시 CSV 4개(`output/v159/structure-examples/S1~S4.csv`). 현행 납품에서 실제 행을 옮긴 것이며 값은 만들지 않는다.
- `output/v159/datasetTypologyV159.xlsx`의 "구조 스키마 S1~S4" 시트 = 이 문서 §2 표.
- 어댑터 필드명은 코드 구현 후 이 문서와 1:1로 대조해 확정한다(이 초안의 필드명이 바뀌면 여기부터 고친다).
