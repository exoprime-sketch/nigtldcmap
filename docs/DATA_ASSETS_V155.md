# 지도 자산 확보 V155-1 — Aqueduct 유역 · OSM 도로/철도 · 항만/댐/저수지

- 작성일: 2026-09-22 · 브랜치 `feat/v155-map-assets` · 단계 P6a(자산 확보). 지도 등록·화면 연결은 P6b.
- 원칙: 좌표·값 생성 없음, 원본 대용량 파일 미커밋(`_source/`), 라이선스·귀속 문구를 자산 metadata·manifest에 동봉.
- 빌더: `tools/vietnam_spatial/build_aqueduct_basins_v155.py`, `build_osm_roads_rail_v155.py`, `build_osm_water_coastal_v155.py`, 공통 `osm_common_v155.py`, 독립 검증 `verify_assets_v155.py`. 의존성 `requirements-v155.txt`(pyosmium 4.3.1, pyogrio 0.13/GDAL 3.12, shapely 2.1.2, pyproj 3.8, matplotlib).

## 1. B-017 물 스트레스 평가구역 — `vnm-aqueduct40-basins.geojson`

| 항목 | 내용 |
|---|---|
| 출처 | WRI Aqueduct 4.0 Water Risk Framework, `baseline_annual`, 배포 `Y2023M07D05` · CC BY 4.0 |
| 다운로드 | `aqueduct-4-0-water-risk-data.zip` 261,527,511 B, SHA-256 `bd3ed2bc…6a2e5`(전체 값은 `source/README.md`) — 프로젝트 원자료 폴더의 동일 파일 사용, 재다운로드 없음 |
| 공간 단위 | HydroBASINS lvl6 유역 × GADM 4.1 ADM1 × 대수층 교차 폴리곤. 키 `string_id`(`{pfaf_id}-{gid_1}-{aqid}`) — b-017.csv 평가구역 443행의 레코드 키와 동일 |
| 추출 | pyogrio(OpenFileGDB) `gid_0='VNM'` → 443개. 베트남 단위는 GADM 국경으로 이미 잘려 있어 bbox 클립 불필요(모두 102–110E/8–24N 안) |
| 단순화 | **없음**(허용오차 0). 원 정점 47,531개, gzip 0.85 MB(예산 3 MB) |
| 조인 | `string_id` 443/443(100%), 미매칭 0. 점수 9종 CSV↔GDB 대조 불일치 0(GDB `-9999` = CSV null) |
| 발행 | **442개**. `436707-VNM.23_1-1892`(Hải Phòng, 속성 면적 161 km²)는 원천 GDB 도형이 빈 값(`Shape_Area=0`) → 지도 미표시, 값은 다운로드 전용으로 기록 |
| 무효 기하 | `441059-VNM.7_1-None` 링 자기접촉 1건 — 원본 그대로 발행(`sourceGeometryValid:false`), 교차 계산에만 `make_valid` 사용 |
| 속성 | `stringId, pfafId, gid1, aqId, adm1Code(63), adm1Name, gadmName1, label, areaKm2Source, areaKm2Geodesic, adm1Codes34[], adm1Code34Primary, adm1Name34Primary, adm1Code34PrimaryShare, adm1Code34PrimaryMethod, adm1Codes34Shares` |
| 라벨 | `유역 {pfafId} · {성 이름}`(pfaf 없음 51건은 `유역 미지정 · {성 이름}`). **공식 유역명 아님** — 계약 제안 accuracyNotice에 명시 |

### 34개 체계 교차 판정(승인 조건 1)
- 규칙: 34 경계(`vnm-adm1-34.geojson`)와 측지 교차 면적이 폴리곤 면적의 **5% 이상**인 단위만 `adm1Codes34[]`에 수록, 최대 점유 단위를 `adm1Code34Primary`. 5% 미만 슬리버 235건 제외, 복수 소속 111건.
- 5% 이상 소속이 없는 9건: 2건은 최대 점유(<5%) 단위를 primary로(`geometric-below-threshold`), 7건(해상·간석지 GADM 영역, 모두 <23 km²)은 교차가 전혀 없어 GADM 소속 성의 crosswalk 단위를 primary로(`crosswalk-fallback`). 방법은 속성에 기록.
- **CSV 병기 34 대응과 불일치 44건**(`reports/v155/aqueduct-basins-v155.json#validation.adm34MismatchRows`, 표는 `REVIEW_V155-1.md`). 원인은 GADM 4.1 ↔ geoBoundaries 성 경계 불일치(예: Hà Nội 2008 확장 구역을 geoBoundaries가 Vĩnh Phúc/Hòa Bình에 둠, Quảng Ninh–Hải Phòng 도서, Long An–HCMC 경계). 값은 원천 단위 그대로이므로 영향 없음. P6b에서 성·시 필터는 `adm1Code34Primary`(기하)를, 값 의미는 CSV 대응을 각각 사용하도록 제안.

### 유역 단위 보기 — `vnm-aqueduct40-basins-l6.geojson`(승인 조건 2)
- 442개 단위를 `pfaf_id`로 dissolve(`-9999` 51건 제외) → **58개 유역**(베트남 GADM 안쪽 부분만). `unary_union` 결과 정점이 모두 원 단위 정점에 포함(합성 정점 0), 면적 변화 0 ppm, 무효 0.
- 기하 전용. 값 집계 없음(`valuesAreAggregated:false`). gzip 0.49 MB.

### 값 초안 — `spatial/pending-v155/b-017.json`
- `v124-spatial-layer-1` 형식, `joinKey: stringId`, `pending: true`. 변수 9종(종합 물리스크·기준 물스트레스·물고갈·연간/계절 변동성·지하수위 하강·하천/연안 홍수·가뭄) — 값 = Aqueduct 0–5 점수, `categoryLabel`(등급)·`rawValue` 동봉. 점수 null은 미발행(결측), 0 대체 없음.
- 발행 값 3,113개. 변수별 커버리지: 387~391개(지하수위 하강은 5개 — 원천 점수가 거의 없음, 등록 시 제외 검토).
- `spatial/layers/`에 두지 않은 이유: map-index 미등록 파일이 감사 경로에 들어가지 않도록. P6b가 이동·등록.

## 2. A-027 육상교통 — `vnm-roads-rail.geojson`, `-overview.geojson`

| 항목 | 내용 |
|---|---|
| 출처 | OpenStreetMap contributors, Geofabrik `vietnam-260921.osm.pbf`(329,083,173 B, MD5 `8e8faf2e…c677`, 복제 시각 2026-09-21T20:21:51Z) · ODbL 1.0 |
| 선택 | `highway ∈ {motorway, trunk, primary}`(link 제외), `railway=rail` & `service` 없음 → way 50,949개 |
| 클립 | 63 경계 합집합 + 2 km 완충 안에 정점이 하나도 없는 way 201개 제외(자르지 않음) → 50,748개 |
| 병합 | class+ref+name 모두 같은 way만 `linemerge`(승인 조건 5). ref·name 모두 없는 2,238개는 개별 유지 → **8,114개 피처**(병합군 5,876, 실제 병합 3,818) |
| 단순화 | 본 자산 0.0002°(≈20 m) 위상보존 DP → 정점 1,043,504 → 150,168, gzip **1.75 MB**(예산 4 MB). overview 0.002°(≈200 m, z<8용) 67,950 정점, gzip 0.81 MB |
| 속성 | `class(고속도로/간선도로/주요도로/철도), sourceTag, name, ref, lengthKm(WGS84 측지, 단순화 전 계산), osmWayCount, osmWayIds[]`(overview는 ids 생략) |

class별 연장(km)·기존 A-027 지표 대조(참고 — 기존 지표는 Geofabrik shapefile 세그먼트 **건수**이며 km 없음):

| class | OSM way 수 | 발행 피처 | 연장 km | 기존 A-027 건수 |
|---|---|---|---|---|
| 고속도로 | 6,915 | 868 | 6,275.8 | 6,508 |
| 간선도로 | 20,884 | 3,101 | 22,670.9 | 21,032 |
| 주요도로 | 20,792 | 3,928 | 17,384.9 | 20,559 |
| 철도 | 2,157 | 217 | 2,666.5 | 3,483(service 선로 포함) |

- 한계: 분리 차로는 방향별 way라 연장이 두 번 계산됨(고속도로 실연장 ≈ 절반). 자원봉사 지도 품질 편차. 이름 결측 30%, ref 결측 42%.

## 3. A-028 해안·수자원 인프라 — `vnm-water-coastal-infra.geojson`

| 항목 | 내용 |
|---|---|
| 출처 | 위 PBF와 동일 · ODbL 1.0 |
| 항만 | `landuse=port` / `harbour=yes` / `seamark:type=harbour`(node 49 · area 22) → 대표점 **66** |
| 댐 | `waterway=dam`(node 45 · 열린 way 351 · area 867) → 대표점 **1,255**, 열린 way는 마루 길이 km |
| 저수지 | `natural=water`+`water=reservoir` 면적 ≥1 km²(측지) → 폴리곤 **237**(단순화 0.0002°). 후보 3,260 중 **3,023개가 1 km² 미만으로 제외**. 구식 `landuse=reservoir` 태그 **78건**(그중 75건은 신식 태그 없음) — 미수록, 건수만 기록(승인 조건 5) |
| 대표점 | node = 노드 좌표, 열린 way = 중간 정점, area = `representative_point`(내부 보장). 모두 OSM 노드 좌표 유래 |
| 성·시 부여 | 대표점 point-in-polygon → `adm1Code34/adm1Name34`(2025) + `adm1Code/adm1Name`(63). 해상 13건(항만 4·댐 9)은 null. 국경 밖 13건 제외 |
| 크기 | gzip **1.22 MB**(예산 2 MB). 이름 결측: 항만 50%, 댐 77%, 저수지 5% |
| 한계 | OSM 항만 태그가 드물어 66곳은 전수가 아님(industrial=port 등 대체 태그 미탐색 — 지시 범위 밖). 댐은 시설 규모 정보 없음 |

## 4. 공통 검증 · 산출
- `reports/v155/assets-v155.json`: 자산별 피처 수·bbox·유효기하·중복 ID·EPSG:4326·속성 결측률·gzip·SHA-256 + 빌더 보고(`aqueduct-basins-v155.json`, `roads-rail-v155.json`, `water-coastal-infra-v155.json`) 병합. 조인률·라이선스·다운로드 일시·소스 해시 포함.
- 미니 렌더(34 경계 위): `reports/v155/aqueduct-basins.png`, `aqueduct-basins-l6.png`, `roads-rail.png`, `water-coastal-infra.png`.
- `geometry-manifest.json`: 배열 **끝에 5개 항목 추가**(aqueduct40-units, aqueduct40-basins-l6, osm-roads-rail, osm-roads-rail-overview, osm-water-coastal-infra). 기존 항목 불변. 세션 ①(P2b) 항목과 rebase 충돌 시 양쪽 모두 유지(승인 조건 3).
- 레이어 계약 제안: `public/data/vietnam/v2/spatial/pending-layers-v155.json`(B-017 unit-choropleth/boundaryPolicy none, A-027 line class별 스타일·overview, A-028 point+polygon kind별 아이콘 키 `infra-port/infra-dam/infra-reservoir`). map-index 필드명 동일, P6b에서 등록.
- 재현성: Aqueduct 자산은 vendored 캡슐에서 오프라인 재빌드 시 바이트 동일(generatedAt = 캡슐 추출 시각). OSM 자산은 고정 PBF(md5 검증)에서 재빌드.

## 5. 미완료·후속(P6b)
- map-index 등록, 렌더러(`unit-choropleth`, `point-and-polygon`, `zone-polygon`) 지원 여부 확인, V152 아이콘 키 확정, 상세 화면 연결.
- B-017 `spatial/pending-v155/b-017.json` → `spatial/layers/b-017.json` 이동 및 build-map-layers 통합. 지하수위 하강 변수 제외 여부 결정.
- OSM 항만 보강(industrial=port, 항만청 목록 등)은 별도 출처 검토 후.
- V155-2(§6·§7): B-008 저지대 3자산·대응표·성별 요약, D-022 `pending-v155/d-022-locations.json` → `spatial/layers/d-022.json` 이동, 34 경계 native 조인 지원.

---

# 지도 자산 확보 V155-2 — 해수면 상승 개략 저지대(B-008) · 개발금융 사업 위치(D-022)

- 작성일: 2026-09-22 · 브랜치 `feat/v155-2-slr-projects` · 단계 P6c(자산 확보, 승인 항목 2·6). 지도 등록·화면 연결은 P6b.
- 빌더: `tools/vietnam_spatial/build_slr_lowland_v155.py`(항목 2), `build_d022_locations_v155.py`(항목 6), 계약 제안 `append_pending_layers_v155_2.py`, 검증 `verify_assets_v155.py --set v155-2`. 추가 의존성 `rasterio 1.5.1`, `requests`.
- **필수 주의문(자산 metadata·manifest·계약 제안·이 문서 공통)**: "30 m 공개 DEM 기반 개략 저지대. 방조제·제방·지반침하·조석·폭풍해일 미반영. 실제 침수 예측이 아니며 상세 계획에는 사용 불가." + "높이는 Copernicus DEM GLO-30(DSM, EGM2008 지오이드 기준) 값이며 조위 기준면 보정 없음. 수목·건물 높이가 포함돼 맹그로브·시가지에서 저지대가 과소 산정될 수 있음."

## 6. B-008 해안 저지대(개략) — `vnm-slr-lowland-le0p5m/le1m/le2m.geojson`

| 항목 | 내용 |
|---|---|
| 출처 | Copernicus DEM GLO-30(ESA/Airbus·DLR, 30 m DSM, **EGM2008 지오이드 기준 높이**), AWS Open Data `copernicus-dem-30m` COG 타일 · 무료·귀속 필요(문구는 `source/README.md`) |
| 타일 | 해안선 0.28° 완충과 교차하는 1° 타일 47개 중 버킷에 존재하는 **42개**(전부 바다인 5개 없음), 1.0 GB, `_source/vietnam/v155/dem/`(미커밋). 타일별 URL·bytes·SHA-256·ETag·다운로드 시각은 `dem-manifest.json`(SHA-256 `9dd5d124…bc9e`)에 기록, 자산 metadata `sourceManifestSha256`로 참조 |
| 셀 분류 | 유효 셀 중 ≤2 m / ≤1 m / ≤0.5 m(경계 포함). 바다 시드 = 높이 ≤0 m ∧ 모든 육지 폴리곤(63 합집합 + 인접국) 1 km 밖 → 국경 슬리버가 시드가 되지 않음 |
| 해안 30 km | 시드 마스크를 20× 축소(≈0.6 km)한 전역 모자이크에 거리 변환 → 30 km 이내 셀만 후보(정확도 ±0.6 km) |
| 연결성 | 임계값별로 타일 안 8방향 라벨링 → 타일 경계(모서리 포함) 공유 행·열로 union-find 병합 → **바다 시드를 포함한 성분만 유지**(내륙 고립 저지대 제외: ≤0.5 m 110만 셀 · ≤1 m 221만 셀 · ≤2 m 432만 셀 제거) |
| 수면 제외 | 높이가 **정확히 0.0 m**인 셀(Copernicus가 편집한 해수·만·하구·하천 수면)은 연결 경로로만 쓰고 저지대에서 제외(≤0.5 m 기준 4,786 km²). 석호처럼 0이 아닌 상수로 평탄화된 수면은 제외되지 않음(Huế·Quảng Trị 값에 Tam Giang–Cầu Hai 석호 포함) |
| 육지·성 분할 | 63 합집합(육지)과 34 단위를 30 m 격자에 rasterize → 격자에서 분할(벡터 교차 없음, 성 조각이 정확히 맞물림). 성 코드 없는 육지 셀 0 |
| 폴리곤화 | `rasterio.features.shapes`(8-connectivity) → 타일 가장자리 조각만 `unary_union` → 폴리곤·구멍 **0.25 km² 미만 제거**(측지) → 위상 보존 단순화 **0.00027°(≈30 m)** → 1e-6° 격자 스냅(유효성 유지) |
| 면적 | `areaKm2`는 **래스터 셀 수 × 측지 셀 면적**(폴리곤 필터·단순화 전), `sharePct`는 34 폴리곤 측지 면적 대비(공식 통계 면적 아님) |
| 포함관계 | 래스터 셀 단위 ≤0.5 ⊂ ≤1 ⊂ ≤2 **assert 통과**. 벡터는 필터·단순화 차이로 하위 구역의 0.9%(5.6 km² · 11.4 km²)가 상위 구역 밖 |
| 크기 | gzip ≤0.5 m **0.20 MB** · ≤1 m **0.39 MB** · ≤2 m **1.96 MB**(예산 각 2 MiB=2,097,152 B, 여유 6.6%). 무효 기하 0, 중복 ID 0 |
| 속성 | `zoneKey, zoneLabel, thresholdM, adm1Code34, adm1Name34, memberAdm1Codes, areaKm2, adm1AreaKm2, sharePct, polygonCount, verticalDatum, demSource, geometryProvenance, isSynthetic:false, accuracyNotice` — 피처 1개/성·시 |

### 단계별 면적·성별 상위 5(`reports/v155/slr-lowland-v155.json`)

| 구간 | 총 면적 km² | 성·시 수 | 상위 5(면적 km²) |
|---|---|---|---|
| ≤0.5 m | 691 | 20 | Cà Mau 116 · Huế 112 · Hải Phòng 104 · Ninh Bình 75 · Quảng Trị 67 |
| ≤1 m | 1,429 | 20 | Cà Mau 273 · Huế 210 · Quảng Trị 175 · Hải Phòng 121 · An Giang 119 |
| ≤2 m | 9,465 | 23 | Cà Mau 2,548 · An Giang 2,540 · Ninh Bình 723 · Cần Thơ 419 · Quảng Trị 409 |

- 성 면적 대비(≤2 m): Cà Mau 32.3% · An Giang 26.4% · Ninh Bình 17.7% · Hưng Yên 16.4% · Hải Phòng 9.4%. 메콩델타(Cà Mau·An Giang·Cần Thơ·Vĩnh Long)와 홍강델타(Ninh Bình·Hưng Yên·Hải Phòng)가 상위 — 상식과 일치.
- 해석 한계: DSM이라 과수·주거 밀집 동부 메콩델타(Vĩnh Long 343 km²·5.6%)와 시가지가 과소, 새우 양식장·석호 등 상수 높이 수면은 포함. 저지대 없는 성 11개(내륙·산지)는 피처 없음.
- 미니 렌더: `reports/v155/slr-lowland.png`(34 경계 위 3단계 순차색).

### 대응표 — `spatial/pending-v155/b-008-slr-zones.json`
- b-008.csv 관측소 5곳 × 시나리오·신뢰수준 7조합 × 연도 9개 = **315행**, 분위수 50(중앙값) 상승량 `riseM`(2005년 기준 상대해수면, IPCC AR6)을 들어가는 최소 구간에 대응(≤0.5→`le0p5m` 221행, ≤1→`le1m` 37행, ≤2→`le2m` 0행, 하강(≤0) 57행은 `zoneKey: null`). q5·q95 상승량 병기. 값 보간·예측·기준면 변환 없음 — 상승량과 구역 높이(EGM2008)는 기준면이 달라 **대응표일 뿐 등가가 아님**을 `lookupRule`에 명시.

### 성·시 요약 — `spatial/pending-v155/b-008-lowland-by-adm1.json`
- 34 단위 전부(저지대 0인 성 포함) × 3단계 `areaKm2`·`sharePct` + `adm1AreaKm2`·`memberAdm1Codes`. P4 상세 화면 지역 막대용.

## 7. D-022 개발금융 사업 소재 성·시 — `spatial/pending-v155/d-022-locations.json`

| 항목 | 내용 |
|---|---|
| 대상 | d-022.csv 15건(**전부 World Bank**, ADB·IFC 없음) |
| 1차 출처 | IATI d-portal JSON API(`/q?aid=44000-P######&from=act,location`) — World Bank가 보고한 activity `location`(precision 2 = 성 단위). 좌표는 기록만, **발행·추정 없음** |
| 2차 출처 | World Bank 사업 페이지·Projects API abstract·PAD/PID/ISDS/Program Document 본문(documents.worldbank.org 텍스트판)에서 성·시 명시 문구 인용 — 서브에이전트 2개 조사 후 메인이 URL·성명 전수 검수(`tools/vietnam_spatial/source/d-022-review-v155.json`) |
| 판정 규칙 | IATI location이 단독 'Hanoi'/'Socialist Republic of Vietnam'이면 자리표시자로 **미사용**(00004·00009·00010·00011~00015). 촌락·지점명(00008)·도시명(00003 Vinh)은 성 별칭에 없어 문서 명시로 대체. 전국 = DPF/DPO·전국 융자 프로그램(문서 인용) |
| 정규화 | 63 별칭 `lookup`(Tỉnh/Thành Phố 접두 제거) → `adm1Code` → `crosswalk34` → `adm1Code34`. 사용 성명 30개 **100% 해석**(미사용 IATI 이름 12개는 레코드별 `iatiUnresolvedNames`에 기록) |
| 결과 | 매핑률 **15/15(100%)** — 성·시 확인 7건(official-location 2 · official-document 5), 전국 8건, 미확인 0건. 출처 URL 60/60 응답 200(사업 페이지·API·IATI·인용 문서) |
| 34 대응 | Bình Dương→Hồ Chí Minh, Quảng Bình→Quảng Trị(6성→5·8성→7), Thừa Thiên Huế→Huế, Quảng Nam→Đà Nẵng, Bình Định→Gia Lai(00010 컨셉 PID의 Quảng Nam·Bình Định — CSV 실행기관 'Da Nang City'와 개편 결과가 정합) |
| 집계 | `values[]`(`project-count` 건·`commitment-sum` USD, joinKey `adm1Code34`) — **다수 성 사업은 각 성에 1건·전액 계상(성 간 합산 불가)**, 전국 사업은 `nationalRecordIds`로 별도. 성·시 12개: Nghệ An 3 · Thanh Hóa/Hà Tĩnh/Quảng Trị/Huế/HCMC 2 · Quảng Ninh/Hải Phòng/Gia Lai/Đà Nẵng/Vĩnh Long/Cần Thơ 1 |
| 부분 매핑 | 00009 남부 수로 회랑은 abstract에 명시된 양단(Cần Thơ항·HCMC항)만 대응, 경유 성 미표시(추정 금지). PAD 공개 시 보강 |

- 계약 제안: `pending-layers-v155.json`에 D-022 `region-choropleth`/`admin1-choropleth`, `boundaryPolicy native-34`, `geometryUrl vnm-adm1-34.geojson`, `joinKey adm1Code34` 항목과 B-008 `zone-polygon`(단계별 geometryUrl, 대응표·성별 요약 URL) 항목 추가.
