# REVIEW V155-2 — 해수면 상승 개략 저지대(B-008) · 개발금융 사업 위치(D-022)

- 일자 2026-09-22 · 브랜치 `feat/v155-2-slr-projects`(base `origin/main` 73e1e0f = PR #24 포함) · 병렬 세션 ③ 후속 · 단계 P6c(자산 확보, 등록은 P6b)
- 편집 금지 파일(`map-index.json`, `build-map-layers-v138.mjs`, `RealMapExplorerPage.tsx`, `src/data/map/*`, `src/components/map/*`, 상세 컴포넌트, asset-integrity 수기) **미변경**. `geometry-manifest.json`은 배열 끝 3항목 추가, `pending-layers-v155.json`은 끝에 2항목 텍스트 splice(기존 항목 바이트 불변).
- 사용자 결정 반영: D-022 다수 성 사업 승인액 **각 성 전액 계상**(성 간 합산 불가 명시) · B-008 대응표 **관측소×시나리오×연도 전체, 중앙값 기준**(q5·q95 병기, 하강은 null).

## 변경 파일
- 신규 스크립트: `tools/vietnam_spatial/build_slr_lowland_v155.py`(DEM 다운로드·분류·연결성·폴리곤·34 분할·대응표·성별 요약), `build_d022_locations_v155.py`(IATI location 수집·정규화·URL 검사·집계), `append_pending_layers_v155_2.py`(계약 제안 splice). `verify_assets_v155.py`에 `--set v155-2` 추가(기본 동작 불변). `requirements-v155.txt`에 rasterio·requests.
- 신규 자산 `public/data/vietnam/v2/geometry/`: `vnm-slr-lowland-le0p5m.geojson`, `-le1m`, `-le2m`.
- 값·대응표·검수: `spatial/pending-v155/b-008-slr-zones.json`, `b-008-lowland-by-adm1.json`, `d-022-locations.json`; `tools/vietnam_spatial/source/d-022-review-v155.json`(사업별 인용·판정).
- `geometry-manifest.json` 3항목 추가 · `pending-layers-v155.json` B-008·D-022 항목 추가(`schemaVersion` v155-2) · `asset-integrity.json` 재생성(531).
- 문서: `docs/DATA_ASSETS_V155.md` §6·§7, `tools/vietnam_spatial/source/README.md` DEM 절, `docs/FINALIZATION_TRACKER_V153.md` B-008·D-022 행, `reports/v155/{assets-v155-2.json, slr-lowland-v155.json, d-022-locations-v155.json, d-022-iati-locations-v155.json, slr-lowland.png, REVIEW_V155-2.md, PR_BODY.md, PROGRESS.md}`.
- 미커밋 원본: `_source/vietnam/v155/dem/`(Copernicus DEM 타일 42개, 1.0 GB, `dem-manifest.json`에 URL·bytes·SHA-256·ETag·시각).

## 검증 결과(실행 성공 ≠ 내용 완성을 구분)

### 항목 2 — B-008 저지대(`verify_assets_v155.py --set v155-2`, 발행 파일 독립 재검사)
| 자산 | 피처(성·시) | 면적 km² | 원본 | gzip / 예산 | 무효 | sha256 |
|---|---|---|---|---|---|---|
| `vnm-slr-lowland-le0p5m.geojson` | 20 | 691 | 1.14 MB | **0.20 MB** / 2 MiB | 0 | `da1a2e4180f6…` |
| `vnm-slr-lowland-le1m.geojson` | 20 | 1,429 | 2.34 MB | **0.39 MB** / 2 MiB | 0 | `da749ac42b15…` |
| `vnm-slr-lowland-le2m.geojson` | 23 | 9,465 | 12.26 MB | **1.96 MB** / 2 MiB(여유 6.6%) | 0 | `27263d8c456e…` |

- 방법 실행 확인: DEM 타일 47개 선정 → 버킷 존재 42개 다운로드(전부 바다인 5개는 버킷에 없음) → 셀 분류 → 30 km 거리 마스크 → 8방향 라벨 + 타일 간 union-find → 시드 연결 성분만 유지(내륙 고립 제외 셀: ≤0.5 m 1.10M · ≤1 m 2.21M · ≤2 m 4.32M) → 정확히 0.0 m 수면 셀 제외(≤0.5 m 기준 4,786 km²) → 34 단위 격자 분할 → 폴리곤·구멍 0.25 km² 미만 제거(≤2 m: 폴리곤 79,412 · 구멍 245,780) → 30 m 단순화 → 1e-6° 스냅.
- **포함관계**: 래스터 셀 단위 ≤0.5 ⊂ ≤1 ⊂ ≤2 assert **통과**. 벡터는 필터·단순화 차이로 하위 구역의 0.92%/0.90%(5.6·11.4 km²)가 상위 밖(기록만).
- 중복 ID 0, 빈 기하 0, 베트남 bbox 밖 0, 성 코드 없는 육지 셀 0, CRS OGC:CRS84. 재현성: 캐시 재빌드 2회 **바이트 동일**(자산 3개·대응표·성별 요약, generatedAt = 타일 다운로드 완료 시각 고정).
- 성별 상위 5(면적 km²): ≤0.5 m Cà Mau 116 · Huế 112 · Hải Phòng 104 · Ninh Bình 75 · Quảng Trị 67 / ≤1 m Cà Mau 273 · Huế 210 · Quảng Trị 175 · Hải Phòng 121 · An Giang 119 / ≤2 m **Cà Mau 2,548 · An Giang 2,540 · Ninh Bình 723 · Cần Thơ 419 · Quảng Trị 409**. 성 면적 대비(≤2 m) Cà Mau 32.3% · An Giang 26.4% · Ninh Bình 17.7% · Hưng Yên 16.4% · Hải Phòng 9.4% — 메콩델타·홍강델타 상위로 정상.
- PNG 육안(`reports/v155/slr-lowland.png`): 서부 메콩(Cà Mau·Kiên Giang)·홍강 하구·중부 석호(Huế·Quảng Trị)에 집중, 내륙 성 11개 피처 없음.
- 내용 한계(문서·metadata 명시): DSM이라 과수·주거 밀집 동부 메콩델타(Vĩnh Long 343 km², 5.6%)·시가지 과소. 석호·양식장처럼 0이 아닌 상수로 평탄화된 수면은 포함(Huế·Quảng Trị 값의 상당 부분이 Tam Giang–Cầu Hai 석호). 30 km 마스크 정확도 ±0.6 km. **침수 예측이 아니며 조석·해일·제방·지반침하 미반영** — 주의문이 자산 metadata·manifest·계약 제안·문서에 동일 문장으로 들어감.
- 대응표 315행: `le0p5m` 221 · `le1m` 37 · `le2m` 0 · 하강(null) 57(주로 Hòn Ngư). 기준면 상이(상대해수면 vs EGM2008) 명시, 보간·예측 없음.

### 항목 6 — D-022 사업 위치(`build_d022_locations_v155.py`, 서브에이전트 2 조사 + 메인 전수 검수)
| 지표 | 결과 | 목표 |
|---|---|---|
| 매핑률(성·시 확인 ∨ 전국 확인) | **15/15 = 100%** (성·시 7 · 전국 8 · 미확인 0) | ≥80% |
| 출처 URL 응답 200 | **60/60**(WB 사업 페이지 15 · Projects API 15 · IATI q API 15 · 인용 문서 15) | 전수 |
| 성·시명 정규화(사용 이름) | **30/30 = 100%**(34 aliases: 63 lookup + crosswalk34) | 100% |
| 좌표 발행 | 없음(IATI 보고 좌표는 수집 파일에 기록만) | 금지 |

- 레코드별 판정(성·시 = 2025 34 단위):
  - 00003 P174157 Nghệ An(사업명 'Nghe An Province's Vinh City' 명시) · 00004 P173716 Bình Dương→**Hồ Chí Minh** · 00005 P171700 Vĩnh Long(IATI 일치) · 00006 P157127 8성(IATI=PAD 일치)→34에서 7(Quảng Ninh·Thanh Hóa·Nghệ An·Hà Tĩnh·Quảng Trị·Huế·Hải Phòng) · 00007 P162605 북중부 6성(PAD)→5 · 00009 P169954 Cần Thơ·Hồ Chí Minh(abstract 명시 양단만, 경유 성 미표시) · 00010 P509666 Quảng Nam·Bình Định(컨셉 PID)→**Đà Nẵng·Gia Lai**(CSV 실행기관 'Da Nang City'와 개편 결과 정합).
  - 전국 8건: 00001 VEEIE(ISDS '전국'), 00002 배전효율(PAD '전 성'; IATI 62성), 00008 REDP(전국 재융자 창구; IATI 촌락명 8건은 예시 지점), 00011~00015 DPF/DPO 5건(Program Document·API lendinginstr).
  - IATI 단독 'Hanoi'/'Socialist Republic of Vietnam' location 10건은 자리표시자로 미사용(레코드별 `iatiLocationNote`).
- 집계(`values[]`, joinKey `adm1Code34`): 성·시 12개 — Nghệ An 3건 · Thanh Hóa/Hà Tĩnh/Quảng Trị/Huế/Hồ Chí Minh 2건 · Quảng Ninh/Hải Phòng/Gia Lai/Đà Nẵng/Vĩnh Long/Cần Thơ 1건. 승인액은 각 성 전액 계상(규칙 문구 `aggregation.rule`·계약 legend에 명시).
- 미확인 목록: **없음**. 부분 매핑 1건(00009 경유 성) · 컨셉 단계 1건(00010)은 `reviewNote`에 기록.

### 경량 감사
- integrity 재생성(531 자산) 후 `audit:generated-data:v133` **PASS 15/15**.
- `audit:map:v124` 43/45 — 실패 2건(`ADM1_JOIN_B033`, `ADM1_JOIN_FAILURES`)은 B-033 결측(미변경 파일)으로 P6a와 동일한 기존 상태.
- 실행하지 않은 것(지시): 전체 게이트(`finalize:v140`)·브라우저 감사·CI 대기. 화면 변화 없음(정적 자산·계약 제안·문서만).

## 미완료·사유
- 지도 등록·렌더러(`zone-polygon`, 34 native 조인)·상세 연결: P6b. B-008 성별 막대(by-adm1 JSON)는 P4.
- D-022 00009 남부 수로 경유 성은 PAD 공개 후 보강(추정 금지). 00010은 컨셉 단계라 평가 시 범위 변경 가능.
- 저지대 값은 DSM 한계(수목·건물)로 동부 메콩델타 과소 — DTM(예: FABDEM, 비상업 라이선스) 대체는 라이선스 검토 후 별도 결정.
- 3단계 자산의 벡터 포함관계 0.9% 불일치는 필터·단순화 산물로 수정 대상 아님(래스터 기준은 정확).
