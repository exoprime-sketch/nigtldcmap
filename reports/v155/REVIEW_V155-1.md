# REVIEW V155-1 — 지도 자산 확보(Aqueduct 유역 · OSM 도로/철도 · 항만/댐/저수지)

- 일자 2026-09-22 · 브랜치 `feat/v155-map-assets`(base `origin/main` 12cffab) · 병렬 세션 ③ · 단계 P6a(자산 확보, 등록은 P6b)
- 편집 금지 파일(`map-index.json`, `build-map-layers-v138.mjs`, `RealMapExplorerPage.tsx`, `src/data/map/*`, 상세 컴포넌트) **미변경**. `geometry-manifest.json`은 배열 끝 항목 추가만.
- 승인 조건 5건 반영: ① 34 교차 5% 규칙 + `adm1Code34Primary` + CSV 대응 불일치 목록 ② `vnm-aqueduct40-basins-l6.geojson`(기하 전용) ③ manifest 끝 추가·rebase 양쪽 유지 ④ 라벨 `유역 {pfafId} · {성}`·비공식 유역명 accuracyNotice ⑤ class+ref+name 동일 way만 병합, 저수지 <1 km² 제외 건수·landuse=reservoir 건수 기록.

## 변경 파일
- 신규 스크립트: `tools/vietnam_spatial/build_aqueduct_basins_v155.py`, `build_osm_roads_rail_v155.py`, `build_osm_water_coastal_v155.py`, `osm_common_v155.py`, `verify_assets_v155.py`, `requirements-v155.txt`
- 신규 원본 캡슐: `tools/vietnam_spatial/source/vnm-aqueduct40-baseline-annual-source.geojson.gz`(659 KB, 오프라인 재빌드용) · `source/README.md`에 출처·URL·해시·일시 추가
- 신규 자산(`public/data/vietnam/v2/geometry/`): `vnm-aqueduct40-basins.geojson`, `vnm-aqueduct40-basins-l6.geojson`, `vnm-roads-rail.geojson`, `vnm-roads-rail-overview.geojson`, `vnm-water-coastal-infra.geojson`
- 값 초안·계약 제안: `spatial/pending-v155/b-017.json`, `spatial/pending-layers-v155.json`
- `geometry-manifest.json` 항목 5개 추가(기존 항목 불변) · `asset-integrity.json` 재생성
- 문서: `docs/DATA_ASSETS_V155.md`, `docs/FINALIZATION_TRACKER_V153.md`(B-017·A-027·A-028 행), `reports/v155/*`

## 검증 결과(실행 성공 = 내용 완성 아님을 구분)
### 자산 구조 검증(`verify_assets_v155.py`, 발행 파일 독립 재검사)
| 자산 | 피처 | 원본 | gzip / 예산 | GEOS 무효 | sha256 |
|---|---|---|---|---|---|
| `vnm-aqueduct40-basins.geojson` | 442 | 5.55 MB | **0.81 MB** / 3 MB | 1 | `2f8b7b3a772a…` |
| `vnm-aqueduct40-basins-l6.geojson` | 58 | 2.76 MB | **0.47 MB** / 3 MB | 0 | `6d987994c1bd…` |
| `vnm-roads-rail.geojson` | 8,114 | 8.28 MB | **1.67 MB** / 4 MB | 0 | `04be584f971e…` |
| `vnm-roads-rail-overview.geojson` | 8,114 | 5.39 MB | **0.77 MB** / 1 MB | 0 | `f28a3bfbfab0…` |
| `vnm-water-coastal-infra.geojson` | 1,558 | 4.95 MB | **1.17 MB** / 2 MB | 0 | `3799bfaa4f79…` |

- 중복 ID 0, 빈 기하 0, 베트남 bbox 밖 0, CRS OGC:CRS84(EPSG:4326 동일 datum) 전부 충족. 무효 1건은 Aqueduct 원천의 링 자기접촉(`441059-VNM.7_1-None`) — 원본 보존, 사유 기록.
- B-017 조인: **443/443(100%)**, 점수 CSV↔GDB 대조 불일치 0. 발행 도형 442(원천 빈 도형 1: `436707-VNM.23_1-1892` Hải Phòng — 다운로드 전용으로 표기).
- 미니 렌더 육안 확인: `reports/v155/aqueduct-basins.png`, `aqueduct-basins-l6.png`, `roads-rail.png`, `water-coastal-infra.png` — 도로망·철도, 평가구역 전국 피복, 저수지(Hòa Bình·Sơn La·Trị An·Dầu Tiếng) 위치가 상식과 일치.
- 재현성: Aqueduct 빌더 2회 실행 바이트 동일(캡슐 기준). OSM 빌더는 PBF md5 고정.
- 경량 감사 2종만 실행: `audit-vietnam-generated-data-v133` **PASS 15/15**(integrity 재생성 후; 계약 제안의 `dataUrl`이 미래 경로를 가리켜 BROKEN_ASSET 1건이 났던 것을 pending 경로로 수정). `audit-vietnam-map-v124`는 43/45 — 실패 2건(`ADM1_JOIN_B033`, `ADM1_JOIN_FAILURES`)은 B-033 계열 결측(`spatial/layers/b-033.json` 미변경)으로 이 PR과 무관한 기존 상태.
- 실행하지 않은 것(지시): 전체 게이트(`finalize:v140`)·브라우저 감사·CI 대기.

### B-017 34 교차 판정 요약
- primary 방법: geometric 433 · geometric-below-threshold 2 · crosswalk-fallback 7. 슬리버 제외 235, 복수 소속 111.
- **CSV 병기 34 대응과 불일치 44건** — GADM 4.1(원천)과 geoBoundaries(플랫폼 경계)의 성 경계 차이(Hà Nội 2008 확장 반영 차이, Quảng Ninh–Hải Phòng 도서, Long An–HCMC 등). 값·단위는 원천 그대로이며 이 목록은 P6b의 성·시 필터 설계 참고용.

| stringId | GADM 성 | 면적 km² | CSV 34 대응 | 기하 주 소속(점유율) | 5% 이상 소속 |
|---|---|---|---|---|---|
| 436707-VNM.49_1-1882 | Quảng Ninh | 126.806 | Quảng Ninh | Hải Phòng (100%) | Hải Phòng 100% |
| 436708-VNM.22_1-1626 | Hải Dương | 11.2 | Hải Phòng | Bắc Ninh (99%) | Bắc Ninh 99% |
| 436708-VNM.31_1-1882 | Hưng Yên | 0.022 | Hưng Yên | Hà Nội (100%) | Hà Nội 100% |
| 436708-VNM.49_1-1626 | Quảng Ninh | 9.313 | Quảng Ninh | Hải Phòng (84%) | Hải Phòng 84%, Quảng Ninh 14% |
| 436708-VNM.56_1-1882 | Thái Nguyên | 103.277 | Thái Nguyên | Phú Thọ (49%) | Phú Thọ 49%, Hà Nội 34%, Thái Nguyên 16% |
| 436709-VNM.23_1-None | Hải Phòng | 4.812 | Hải Phòng | Hưng Yên (15%) | Hưng Yên 15% |
| 436709-VNM.55_1-None | Thái Bình | 42.999 | Hưng Yên | Ninh Bình (46%) | Ninh Bình 46%, Hưng Yên 36% |
| 436709-VNM.5_1-1882 | Bắc Ninh | 55.014 | Bắc Ninh | Hưng Yên (61%) | Hưng Yên 61%, Bắc Ninh 36% |
| 436810-VNM.31_1-1882 | Hưng Yên | 337.502 | Hưng Yên | Hà Nội (64%) | Hà Nội 64%, Hưng Yên 26%, Ninh Bình 10% |
| 436810-VNM.44_1-1882 | Phú Thọ | 2.772 | Phú Thọ | Hà Nội (100%) | Hà Nội 100% |
| 436810-VNM.56_1-1626 | Thái Nguyên | 5.47 | Thái Nguyên | Tuyên Quang (85%) | Tuyên Quang 85%, Phú Thọ 15% |
| 436822-VNM.60_1-1626 | Tuyên Quang | 98.802 | Tuyên Quang | Lào Cai (50%) | Lào Cai 50%, Tuyên Quang 31%, Phú Thọ 20% |
| 436830-VNM.27_1-1882 | Hà Nội | 33.259 | Hà Nội | Phú Thọ (76%) | Phú Thọ 76%, Hà Nội 24% |
| 436841-VNM.30_1-1862 | Hoà Bình | 0.551 | Phú Thọ | Sơn La (100%) | Sơn La 100% |
| 436850-VNM.27_1-1626 | Hà Nội | 0.771 | Hà Nội | Phú Thọ (100%) | Phú Thọ 100% |
| 436850-VNM.27_1-1882 | Hà Nội | 145.995 | Hà Nội | Phú Thọ (93%) | Phú Thọ 93%, Hà Nội 7% |
| 436850-VNM.30_1-1862 | Hoà Bình | 64.949 | Phú Thọ | Sơn La (88%) | Sơn La 88%, Phú Thọ 12% |
| 436850-VNM.38_1-1626 | Lào Cai | 8.11 | Lào Cai | Lai Châu (61%) | Lai Châu 61%, Lào Cai 39% |
| 436850-VNM.44_1-1862 | Phú Thọ | 6.896 | Phú Thọ | Sơn La (100%) | Sơn La 100% |
| 436860-VNM.20_1-1626 | Điện Biên | 0.046 | Điện Biên | Lai Châu (100%) | Lai Châu 100% |
| 436900-VNM.27_1-1626 | Hà Nội | 29.834 | Hà Nội | Phú Thọ (90%) | Phú Thọ 90%, Hà Nội 10% |
| 436900-VNM.55_1-1882 | Thái Bình | 0.108 | Hưng Yên | Ninh Bình (100%) | Ninh Bình 100% |
| 436900-VNM.55_1-None | Thái Bình | 0.121 | Hưng Yên | Ninh Bình (100%) | Ninh Bình 100% |
| 441020-VNM.30_1-1862 | Hoà Bình | 44.825 | Phú Thọ | Sơn La (64%) | Sơn La 64%, Phú Thọ 36% |
| 441030-VNM.29_1-1882 | Hà Tĩnh | 0.101 | Hà Tĩnh | Nghệ An (100%) | Nghệ An 100% |
| 441030-VNM.29_1-None | Hà Tĩnh | 0.01 | Hà Tĩnh | Nghệ An (100%) | Nghệ An 100% |
| 441051-VNM.46_1-1626 | Quảng Bình | 0.151 | Quảng Trị | Hà Tĩnh (63%) | Hà Tĩnh 63%, Quảng Trị 37% |
| 441054-VNM.48_1-1626 | Quảng Ngãi | 40.44 | Quảng Ngãi | Đà Nẵng (77%) | Đà Nẵng 77%, Quảng Ngãi 23% |
| 441056-VNM.21_1-1626 | Gia Lai | 2.41 | Gia Lai | Quảng Ngãi (52%) | Quảng Ngãi 52%, Gia Lai 48% |
| 441057-VNM.34_1-1626 | Kon Tum | 4.816 | Quảng Ngãi | Gia Lai (100%) | Gia Lai 100% |
| 441058-VNM.32_1-2039 | Khánh Hòa | 2.175 | Khánh Hòa | Đắk Lắk (100%) | Đắk Lắk 100% |
| 441060-VNM.25_1-None | Hồ Chí Minh | 51.277 | Hồ Chí Minh | Đồng Nai (60%) | Đồng Nai 60%, Hồ Chí Minh 39% |
| 441060-VNM.32_1-2039 | Khánh Hòa | 0.12 | Khánh Hòa | Lâm Đồng (100%) | Lâm Đồng 100% |
| 441060-VNM.39_1-2021 | Long An | 218.397 | Tây Ninh | Hồ Chí Minh (54%) | Hồ Chí Minh 54%, Tây Ninh 46% |
| 441060-VNM.39_1-None | Long An | 2.035 | Tây Ninh | Hồ Chí Minh (66%) | Hồ Chí Minh 66%, Tây Ninh 25%, Đồng Tháp 9% |
| 441060-VNM.43_1-2039 | Ninh Thuận | 1.159 | Khánh Hòa | Lâm Đồng (82%) | Lâm Đồng 82%, Khánh Hòa 18% |
| 441070-VNM.25_1-None | Hồ Chí Minh | 0.07 | Hồ Chí Minh | Đồng Tháp (100%) | Đồng Tháp 100% |
| 441080-VNM.58_1-None | Tiền Giang | 12.913 | Đồng Tháp | Tây Ninh (95%) | Tây Ninh 95% |
| 442100-VNM.59_1-None | Trà Vinh | 40.533 | Vĩnh Long | Cần Thơ (37%) | Cần Thơ 37%, Vĩnh Long 30% |
| 442404-VNM.47_1-1626 | Quảng Nam | 0.755 | Đà Nẵng | Quảng Ngãi (100%) | Quảng Ngãi 100% |
| 442409-VNM.32_1-2039 | Khánh Hòa | 0.488 | Khánh Hòa | Đắk Lắk (87%) | Đắk Lắk 87%, Lâm Đồng 12% |
| 443020-VNM.1_1-2021 | An Giang | 2.75 | An Giang | Cần Thơ (100%) | Cần Thơ 100% |
| None-VNM.49_1-1882 | Quảng Ninh | 0.034 | Quảng Ninh | Hải Phòng (100%) | Hải Phòng 100% |
| None-VNM.55_1-None | Thái Bình | 4.653 | Hưng Yên | Ninh Bình (41%) | Ninh Bình 41%, Hưng Yên 29% |

### A-027 대조(참고)
| class | OSM way | 발행 피처 | 연장 km | 기존 A-027 건수(shapefile) |
|---|---|---|---|---|
| 고속도로 | 6,915 | 868 | 6,275.8 | 6,508 |
| 간선도로 | 20,884 | 3,101 | 22,670.9 | 21,032 |
| 주요도로 | 20,792 | 3,928 | 17,384.9 | 20,559 |
| 철도 | 2,157 | 217 | 2,666.5 | 3,483(service 포함) |

### A-028 요약
- 항만 66(node 49·area 22) · 댐 1,255(node 45·way 351·area 867) · 저수지 237. **1 km² 미만 제외 3,023**, `landuse=reservoir` 구식 태그 78(신식 태그 없는 75 포함) 미수록. 해상 대표점 13건은 성·시 코드 null. 국경 밖 13건 제외.

## 미완료·사유
- 지도 등록·렌더러·아이콘·상세 연결: P6b(세션 ① P2b merge 후). 이 PR은 화면 변화 없음.
- B-017 `spatial/pending-v155/b-017.json`은 `spatial/layers/`로 이동 전 상태(감사 경로 회피). 지하수위 하강 변수는 원천 점수 5건뿐 — 등록 시 제외 검토.
- OSM 항만 66곳은 태그 기준 전수 아님(industrial=port 등 대체 태그는 지시 범위 밖).
- 44건 34 대응 불일치는 원천 경계 차이라 자산 수정 대상 아님(기록만).
