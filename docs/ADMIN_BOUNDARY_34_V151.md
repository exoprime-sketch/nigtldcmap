# 행정경계 34개 기준과 값 집계정책 (V151 · V151-2)

작성 2026-09-22 · 대상 `public/data/vietnam/v2/geometry/vnm-adm1-34.geojson`, `map-index.json#layers[].boundaryPolicy`, `src/data/map/boundaryPolicyV151.ts`

## 1. 경계
- 결의 202/2025/QH15로 2025-07-01부터 베트남 성·시는 63개 → 34개(성 단위 통합, 분할 없음). 지도 기본 경계는 34개, 63개(개편 전)는 토글.
- 34개 경계는 `reports/v138/map-targets-build-v138.json#crosswalk34`(34 그룹·63 구성원)를 정본으로 63개 자산을 위상 병합(`tools/vietnam_spatial/build_adm1_34_v151.py`, shapely `unary_union`). 좌표를 새로 만들지 않으며(합성 정점 0), 면적 보존 오차 ≤ 1 ppm, 원천이 남긴 틈(VN-49/50/51 접점 0.1215 km²)은 메우지 않고 기록.
- 34개 지물은 `unitCode`(`VN34-…`)만 갖고 `adm1Code`를 갖지 않는다 → 63 기준 값이 실수로 결합될 수 없다(게이트 `NO_ADM1CODE_ON_34_UNITS`).
- V151-2: 34개 지물에 `areaKm2`·`memberAreaKm2`(구성 성·시별 측지 면적, km², 소수 3자리)를 기록 → 면적가중평균의 가중치. `memberAreaKm2Coverage: 63`.
- 파생 자산(모두 63개 자산 dissolve, 합성 정점 0): `vnm-region-6.geojson`(B-021 GDL 6권역, `regionKey`·`memberAdm1Codes`), `vnm-country-outline.geojson`(국가 외곽선, 4,839 정점·44 파트), `vnm-country-outline-z5.geojson`(표시 전용, `simplify(0.01°)`, 981 정점, 2 km² 미만 도서 22개 제외 — 분석·경계 용도 금지).

## 2. 값과 경계의 분리 → 집계정책
- 공개 지표 값은 원자료가 발표한 기준(대부분 개편 전 63개)으로 발행돼 있다. V151은 34개 경계 위에 63개 값을 그대로 두고 "값은 63 기준"을 상시 고지했다.
- V151-2는 **레이어별 집계정책 `boundaryPolicy`**를 도입해, 34개 경계일 때 값을 어떻게 보여줄지 레이어마다 한 가지 규칙으로 명시한다. 정책은 대상 계약 `src/data/visualization/publicMapTargetsV138.json`(`build.boundaryPolicy34`, ETL 레이어는 `build.patch.boundaryPolicy34`)에 선언하고, `scripts/v138/build-map-layers-v138.mjs`가 검증 후 `map-index.json`에 기록한다. map-index를 수기로 고치지 않는다.
- 63개 토글에서는 어떤 정책이든 **원자료 값 그대로**. B-021(6권역)은 토글과 무관하게 항상 6권역 경계.

```json
"boundaryPolicy": {
  "schema": "boundary-policy-v151-2",
  "kind": "area-weighted-mean",
  "byVariable": { "wind-speed-top10-100m": "range-only" },
  "note": "34개 성·시 값은 구성 성·시 값의 면적가중평균이며 팝업에 구성 범위를 함께 표시합니다.",
  "valueSystem": "pre-2025-63"
}
```

### 2.1 규칙 어휘
| kind | 34개 값 | 결측 처리 | 팝업 |
|---|---|---|---|
| `sum` | 구성 성·시 값의 합 | 값 있는 구성원만 합산, 일부 결측이면 **부분 결측** 표기, 전부 결측이면 값 없음(0 대체 금지) | 구성 n개 중 m개 값 있음 · 범위 |
| `area-weighted-mean` | Σ(v·면적)/Σ(면적), 값 있는 구성원만 | 위와 같음 | 구성 범위 min~max |
| `member-max` / `member-min` | 구성 값의 최대/최소 | 위와 같음 | — (현재 적용 지표 없음) |
| `range-only` | **34개 단일값을 만들지 않음** | 63개 채색 유지 + 34 윤곽선 | 소속 34 단위명 + 구성 범위 |
| `count-sum` | 구성 문서 수의 합 | 문서 없음은 결측이 아님(부분 결측 표기 없음) | 문서 목록에 "(구 ○○성)" |
| `membership-or` | 구성 중 1개 이상 참여 → 참여(1) | — | 구성 n개 중 m개 참여 |
| `native-34` | 원자료가 34 기준으로 발표 → 그 값(구성원 값 동일성 확인, 불일치 시 값 없음+기록) | — | — |
| `six-region-only` | GDL 6권역 값을 권역 경계에 | — | 권역명 |
| `none` | 점·선: 합산 없음 | — | 소재 성·시(34 기준) + "(구 ○○성)" |

### 2.2 레이어별 판정
| 레이어 | kind | 근거 |
|---|---|---|
| B-029 B-030 B-031 B-033 B-034 B-037 B-039 C-016 D-008 | `sum` | 면적·손실·탄소·MW·예산 등 크기량(extensive) — 병합 단위 값은 정확히 합 |
| B-032 B-040 B-041 | `area-weighted-mean` | 피복률·지온·일사량 등 밀도량(intensive) |
| B-042 | 지표별 | 풍속 평균·풍력밀도 평균·6 m/s 이상 면적비율 → `area-weighted-mean`; **풍속 상위 10%·풍력밀도 상위 10% → `range-only`**(분위형 통계는 평균화 금지) |
| B-003 B-004 B-005 B-006 B-007 | `area-weighted-mean`(전 지표) | §2.3 |
| C-009 C-010 | `count-sum` | 지방 법제도 문서 수 |
| C-024 | `membership-or` | FCPF ERPA 참여(6개 성) |
| C-012 C-013 C-019 C-022 | `native-34` | 원자료가 개편 후 34개 기준으로 발표(`regionSystem: post-2025-34`) → 34 경계에 직접, 63 토글 시 종전처럼 소속 성·시에 복제 표시 |
| B-021 | `six-region-only` | GDL 6권역 원자료 |
| A-023 A-025 B-008 B-012 B-023 B-025 B-028 B-048 C-025 E-004 E-005 E-006 E-018 E-019 · A-024 · D-018 | `none` | 점·선·권역 사업범위 |

### 2.3 CCKP(B-003~B-007) 지표별 판정표
CCKP가 발표하는 성·시 값은 **격자 지표를 ADM1 경계 안에서 공간 평균한 값**이다(`sourceSpatialUnit: GADM 4.1 ADM1 — 격자 집계`). 연평균 최고기온·RX1day·CDD처럼 이름에 '최고·최대·연속'이 들어간 지표도 성 값은 '격자별 통계의 공간 평균'이며 성 전체의 최대값이 아니다. 따라서 병합 단위에서 **같은 통계**를 얻는 방법은 지표 종류와 무관하게 면적가중평균이고, `member-max`를 쓰면 원자료와 다른 통계("구성 성 중 가장 큰 평균")가 된다. 사용자 결정(2026-09-22): 전 지표 `area-weighted-mean`, `member-max/min`은 어휘에만 두고 적용 지표 0.

| 요소 | 지표(measureKey) | 통계 성격 | 판정 |
|---|---|---|---|
| B-003 | annual-mean-temperature, annual-max-temperature, annual-min-temperature | 연평균(일 최고/최저의 연평균)의 공간평균 | area-weighted-mean |
| B-003 | annual-precipitation | 연강수량(깊이, mm)의 공간평균 | area-weighted-mean |
| B-004 | 위 4개 + relative-humidity (시나리오별) | 공간평균 | area-weighted-mean |
| B-005 | consecutive-dry-days | 격자별 최대 연속 건조일수의 공간평균 | area-weighted-mean |
| B-005 | spei-12 | 표준화 지수의 공간평균 | area-weighted-mean |
| B-006 | hot-days-tx35/tx40, tropical-nights-tr23/26/29, heat-index-35 | 임계 초과 일수의 공간평균 | area-weighted-mean |
| B-007 | rx1day, rx5day | 격자별 연 최대 1/5일 강수의 공간평균 | area-weighted-mean |
| B-007 | heavy-rain-days-20mm/50mm, consecutive-wet-days | 일수의 공간평균 | area-weighted-mean |

### 2.4 빌드 게이트
- 면 레이어에 정책 선언이 없으면 빌드 실패.
- 지표 라벨에 `분위|중앙값|상위 n%|하위 n%|백분위|순위`가 있는데 정책이 `range-only`가 아니면 빌드 실패.
- `byMeasureKey`가 레이어에 없는 지표를 가리키면 빌드 실패.
- 점 레이어: 원자료 좌표를 63개 경계에 point-in-polygon → `spatial/locations/<id>.json`(경계 밖은 `null`, 좌표 이동·보정 없음). C-025의 원자료 `속성21_지역_현행`은 대체하지 않는다.

## 3. 수치 검증(`src/data/map/boundaryPolicyV151.test.ts`)
- B-031: 전 계열(3개 변수×기간)에서 34 합계 == 63 합계(전국 합 보존).
- B-032: 새 Lâm Đồng(VN34-35 = VN-35·VN-40·VN-72) 값이 구성 3개 min~max 안(등가중 대비 시험, 실자산은 memberAreaKm2 가중).
- C-019: 34 직접 표시값 == 종전 복제값(34/34 단위, sourceRegion 34개).
- 정책 누락 레이어 0, 분위형 → range-only.

## 4. 화면
- 토글 아래 고지는 "값은 63 기준" 상시 문구 대신 **선택 레이어의 정책 1줄**(`data-boundary-policy`).
- 팝업: "구성 n개 성·시 중 m개 값 있음 · 구성 범위 a~b · 부분 결측", range-only는 "○○(34개 기준) 구성 범위 a~b".
- 우측 패널: 집계 방식, 구성 성·시별 값(결측 표기), 문서 목록 "(구 ○○성)".
- 지도 분석 패널 통계(최소·중앙·최대·결측 수)는 표시 경계 기준(34/63/6권역)으로 계산.
