# REVIEW — V151 행정경계 34 + 배경 (PR-P2)

브랜치 `feat/v151-boundary-34-backdrop` · 기준 `origin/main` 3357632 · 작성 2026-09-21 · 실행 환경: 클라우드 컨테이너(Linux, root), Chromium 141(`/opt/pw-browsers/chromium`)

## 1. 한 줄 요약
- 지도의 행정경계 기본을 2025-07-01 시행 34개 성·시로 바꾸고 개편 전 63개를 토글로 남겼다. **값은 하나도 바꾸지 않았다**: 원자료가 발표한 개편 전 63개 기준을 그대로 두고, 34개로 합산·평균·분할하지 않는다.

## 2. 설계 결정: 경계와 값을 분리한다
- 공개 지표는 전부 개편 전 63개 코드(`adm1Code`)로 발행돼 있다. 34개로 다시 세려면 합계·평균을 만들어야 하는데, 이는 원자료에 없는 값을 만드는 일이고 저장소 기존 규칙(V138·V144: "34개 행정단위의 값을 63개 독립값으로 합산 금지")과도 반대다.
- 그래서 V151은 **경계 빈티지(표시)** 와 **값 빈티지(원자료)** 를 분리했다.
  - 경계선·한글 지명·대체 SVG 경계·저작권·상태 문구 → 선택한 기준(기본 34개)을 따른다.
  - 값 색상지도·요약·팝업 → 원자료 기준(개편 전 63개) 그대로다.
  - 이 사실을 토글 바로 아래에 상시 고지한다: "경계선은 2025-07-01 시행 34개 성·시입니다. 값은 원자료가 발표한 개편 전 63개 성·시 기준이며 34개로 합산하지 않습니다."
- 구조로도 막았다. 34개 지물은 `unitCode`(`VN34-…`)만 가지고 `adm1Code`를 **갖지 않는다**. 63개 키의 값이 34개 폴리곤에 실수로 결합될 수 없다. 게이트 `NO_ADM1CODE_ON_34_UNITS`가 이를 검사한다.

## 3. 변경 내용

### 3.1 `crosswalk34` Hà Tĩnh 키 붕괴 수정 (V150 인계 항목)
- 원인: `scripts/v138/build-map-layers-v138.mjs`의 `normalizeAdministrativeName`이 `\b(city|province|tinh|thanh pho|tp)\b`를 **위치와 무관하게** 제거. 'Hà Tĩnh' → 'ha tinh' → 'ha'.
- 수정: 베트남어는 접두("Tỉnh Nghệ An"·"TP Hồ Chí Minh"), 영어는 접미("Da Nang city")이므로 그 위치에서만 제거.
- 재생성 결과: crosswalk34 **34개 그룹·63개 구성원 불변**, 키 `"ha"` → `"ha tinh"` 1건만 변경, `map-index.json`·`asset-integrity.json` 등 생성 자산 **무변경**(diff 2줄: 키 1줄 + `generatedAt`).
- 양쪽 조인이 같은 정규화를 쓰고 있어 지금까지 실제 조인 실패는 없었다(잠복 버그). 다만 보고서에 공개되는 키가 틀렸고, 다른 34개 이름과 충돌할 여지가 있었다.

### 3.2 34개 경계 자산 생성
- 새 스크립트 `tools/vietnam_spatial/build_adm1_34_v151.py` (shapely `unary_union` + pyproj `Geod`).
- 산출 `public/data/vietnam/v2/geometry/vnm-adm1-34.geojson` (1.33MB, sha256 `055fab7e…`).
- 2025년 개편은 성 단위 통합이고 분할이 없으므로 34개 경계는 구성원 경계의 **정확한 위상 합집합**이다. 좌표를 만들지 않는다.

| 검증 | 결과 |
| --- | --- |
| 지물 수 | 34 (병합단위 23, 단독 11) |
| 구성원 배정 | 63개 전수, 중복 0, 미배정 0 |
| 면적 보존 오차(측지) | **최대 0.0 ppm** (허용 1 ppm) |
| 원천에 없는 좌표 | **0개** (전 정점 대조) |
| 기하 유효성 | pass (GEOS `is_valid`) |
| Polygon / MultiPolygon | 21 / 13 |
| 원천이 남긴 틈 | 1건 0.1215km² (VN-49·VN-50·VN-51 접점) |

- **틈을 메우지 않았다.** 원천 geoBoundaries가 빈롱·벤째·짜빈 접점에 남긴 0.12km² 간극이 병합 단위 안에서 구멍으로 남는다. 메우면 원천에 없는 경계선을 새로 그리는 것이므로 매니페스트에 면적·구성원·사유를 기록하고 그대로 뒀다. 5km²를 넘는 틈이 생기면 빌드가 중단된다(대응표 오류 신호).
- 매니페스트에 `boundarySystems`(`default: post-2025-34`, `valuesKeyedTo: pre-2025-63`)와 `valuesAreAggregated: false`를 명시. asset-integrity 517 → 518건.

### 3.3 계약 모듈·한글 라벨
- `src/data/map/adminBoundaryV151.ts`: 34개 단위표(코드·이름·한글·구성원), 기본값 34, 값 빈티지 상수, 경로·문구 헬퍼.
- `mapBackdropV150.labelNameV151`: 지물이 `unitCode`(34)를 실으면 34개 이름, `adm1Code`(63)를 실으면 기존 63개 이름을 쓴다.
- Huế는 같은 결의로 Thừa Thiên Huế에서 개명됐으므로 34개 라벨은 '후에', 개편 전 라벨은 '트어티엔후에'로 둘 다 유지한다.

### 3.4 화면
- 지도 좌상단 배경지도 토글 아래 '행정경계 기준' 라디오 2개(34개 기본 / 63개). 선택은 `localStorage`로 유지.
- 연동 항목: 참조 경계 레이어, 한글 지명, MapLibre 실패 시 대체 SVG 경계(`aria-label` 포함), 하단 저작권, "…경계가 준비되어 있습니다" 상태 문구.
- 대체 SVG 경계의 React key가 34개 모드에서 전부 빈 문자열이 되던 문제를 `unitCode` 우선 해석으로 수정.
- 문구 정리(모두 '개편 전' 명시): 이용안내 지도 항목, 지도 데이터 안내, 물 유향 분석, 기후 시나리오 계약, 한계 등록부, 용어집 GADM, D-008 결측 안내, 값 보유 지역 수 표기.

### 3.5 게이트
- `scripts/v151/audit-boundary-34-v151.mjs` — `npm run audit:boundary-34:v151`.
- `npm run finalize:v151` = `finalize:v140` + 경계34 정적 게이트(`--skip-browser`). **`finalize:v140` 자체는 손대지 않았다**(merge 조건 유지).
- `npm run build:adm1-34:v151` = 자산 재생성 + integrity 갱신.

## 4. 검증 결과

| 항목 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:unit` | **220건 통과** (기준 206+, V151 신규 9건 포함) |
| `audit:boundary-34:v151` (브라우저 포함) | **32 PASS · 1 INFO · 0 FAIL** |
| `audit:boundary-34:v151 --skip-browser` | 21 PASS · 1 SKIP · 0 FAIL |
| `audit:map-copy:v136` | 11/11 PASS |
| `npm run finalize:v151` | (§4.1) |
| 반응형 320/390/768/1024/1440/1920 | 문서 가로 넘침 0 |
| 동일출처 요청 실패 | 0 |
| 콘솔 오류(네트워크 제외) | 0 |

### 4.1 브라우저로 확인한 것(실제 Chromium, production 빌드 정적 서버)
- 첫 진입 시 34개가 선택돼 있고 `vnm-adm1-34.geojson`을 먼저 요청한다.
- 63개로 바꾸면 `vnm-adm1-63.geojson`을 요청하고 고지 문구가 "경계선과 값 모두 개편 전 63개 성·시 기준입니다."로 바뀐다.
- 새로고침 후에도 선택이 유지된다.
- 스크린샷: `map-boundary-34-v151.png`(34개, 내부 경계 적음) · `map-boundary-63-v151.png`(63개, 내부 경계 많음) · `map-labels-34-zoom-v151.png`(확대 시 한글 지명 '하띤' 렌더 — 이번에 키를 고친 바로 그 성).
- 구분: 위 항목은 **동작 확인**이다. 42개 데이터 레이어 각각의 내용 적합성은 이번 PR에서 다시 검토하지 않았다(값 로직 무변경).

### 4.2 환경 보정 1건(기대값 변경 아님)
- 컨테이너가 root로 돌아 `scripts/v125/browser-runtime.mjs`의 헤드리스 브라우저가 기동조차 못했다(`Running as root without --no-sandbox is not supported`). root·리눅스일 때만 `--no-sandbox --disable-dev-shm-usage`를 붙이고, 러너별 추가 플래그는 `V125_BROWSER_ARGS`로 주입하게 했다. 개발자 로컬과 비-root CI는 동작이 그대로다.
- 이 환경에서 WebGL은 소프트웨어 렌더가 필요해 `V125_BROWSER_ARGS="--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader"`로 실행했다. **감사 기대값은 하나도 바꾸지 않았다.** 바뀐 것은 "실행 실패"가 "실제 검사 수행"이 된 것뿐이다(map-copy:v136이 8 FAIL → 11 PASS).

## 5. 미완료와 사유

| 항목 | 사유 |
| --- | --- |
| 34개 단위로 발행된 원자료(C-012·C-019·C-022)를 34개 경계에 직접 칠하기 | 이번 PR은 참조 경계·라벨·문구까지만 바꿨다. 값 레이어의 결합 대상 전환은 레이어별 계약·팝업·범례까지 손대야 해 범위를 넘는다. 현재는 기존대로 소속 63개 경계에 표시하고 그 사실을 명시한다 |
| 34개 단위 값 집계 | **하지 않는다.** 원자료가 63개로 발표한 값을 34개로 합산·평균하면 없는 값을 만드는 것이다(CLAUDE.md 데이터 조작 금지) |
| `scripts/audit-vietnam-map-layout-v129.mjs`의 `-v129` 저장 키 | V150 인계 항목이나 게이트 밖 레거시라 이번 범위에서 제외 |
| 배경지도 타일 실제 표시 확인 | `tiles.openfreemap.org`가 이 컨테이너 프록시에서 차단. 배경지도 켜짐·꺼짐 동작과 데이터·경계 레이어 유지는 확인했으나 타일 그림 자체는 확인하지 못했다. 감사에서 INFO로 분리 기록 |
| `_source/`·`베트남데이터/`가 필요한 작업 | 클라우드 환경에 원천 폴더가 없다. 이번 PR은 `public/` 자산만으로 완결 |
| Vercel Preview·Linux 시각 baseline·실기기 iOS/Safari | PR 생성 후 Preview에서 확인 필요 |
| B-017(물 스트레스) | Aqueduct 평가구역 경계 미확보로 지도 보류 유지(변경 없음) |

## 6. V152 인계 메모
- 34개 단위 값(C-012·C-019·C-022)을 34개 경계에 직접 칠하려면 `layer.aggregationLevel === "post-2025-34-unit"`인 레이어의 `geometryUrl`을 `vnm-adm1-34.geojson`으로 돌리고, 결합 키를 `unitCode`로 바꾸면 된다. `ADM1_34_UNIT_BY_MEMBER_V151`이 역참조를 제공한다.
- `PROVINCE_KO_34_V151`의 라벨 표기는 성·시 한글 표기 기준이 확정되면 함께 재검토 대상(현재는 개편 전 표기를 승계하고 Huế만 개명 반영).
