# REVIEW V163 — 작은 지도(상세 "위치·분포" · 홈 히어로) 방글라데시 확장

- 브랜치: `feat/v163-minimap-bgd` (f19b490 분기, worktree `wt-minimap`)
- 범위: `DetailLocationMapV148` + `MiniMapV152` + `miniMapEngineV152`를 `public/data/countries.json`의 공개 국가 전체에서 동작하게 일반화. 베트남(VNM) 화면은 그대로.
- 제외(건드리지 않음): `RealMapExplorerPage.tsx`, `MapComparisonWorkspace*`, `mapSelectionModelV161.ts`, HomePage 데이터 카드. `HomePage.tsx`·`MiniMapV152.tsx`는 이미 국가를 넘기고 있어 수정 없음.

## 1. 원인
- 상세 "위치·분포"와 홈 히어로 지도가 베트남 전용 로더(`loadVietnam*V124`)·베트남 63개 성 정적 베이스·베트남 전용 검토표(`publicMapTargetsV138.json`)에 묶여 있어, BGD는 베이스 로드 실패 → "이 자료는 데이터 지도에서 볼 수 있습니다." + 스타일 없는 회색 버튼만 표시.
- 라이브 엔진도 베트남 경계·`VIETNAM_CORE_BBOX_V151`·34/63 전환에 고정.

## 2. 변경
| 파일 | 내용 |
|---|---|
| `src/data/map/miniMapCountryV163.ts` (신규, 순수 함수) | 국가 판별, 경계 키(`BGD.8_1`) 식별(`isRawRegionKeyV163`), 정적 지도 조인 키, 1단계 경계 파일의 지역 이름 색인, 지역 라벨(사전 → 명시 라벨 → 경계 파일 이름, 없으면 빈 값 — 키는 절대 노출 안 함), "8개 주(Division) 기준"·경계 출처 문구(레지스트리 1단계 용어), 국가 bbox, 투영 중심 위도 |
| `src/data/map/miniMapCountryV163.test.ts` (신규) | 위 함수와 `detailMapSelectionForCountryV163`, 공용 코드 변경점 22건 |
| `src/components/data/public/DetailLocationMapV148.tsx` | 데이터 로드를 `countryDataLoaderV158(iso3)`로(VNM은 동일 인스턴스 위임이라 결과 동일). 정적 베이스 = 국가 `adm.level1.asset`(VNM은 vnm-adm1-63 유지). BGD 점 자산(`point-and-polygon`)은 발전원·종류 범주 색으로 점 표시 + 범주 범례. 지역 라벨·옵션·범례 문구는 국가별. 지명 라벨(도시)·"개편 후 34개 성·시 기준" 캡션은 VNM만. 그릴 것이 없을 때의 대체 문구는 유지하되 버튼을 `cdp-button cdp-button--secondary`로 |
| `src/data/map/detailMapModelV148.ts` | `overviewProjectionV148`에 중심 위도 인자 추가(기본 17° = VNM 그대로, 다른 국가는 자기 범위 중심) / `detailMapSelectionForCountryV163`: 다른 국가는 베트남 검토표를 거치지 않고 자기 레이어 selector로 항목·시점 선택(불일치 시 안내문 유지) |
| `src/components/map/miniMapEngineV152.ts` | 로더·경계 참조·위치 목록을 국가별로. VNM만 34/63·6권역 로드. 다른 국가는 1단계 자산을 경계 참조로 쓰고(큰 지도와 같은 얇은 외곽선), bbox는 레지스트리 값 → 레이어 범위 → (VNM만) 기존 값. 지역·시설 팝업에서 키 대신 사전 이름/국가 1단계 용어 사용 |
| `src/map/layers/boundaryLayer.ts` | `applyBoundaryReferenceV152(…, options)` — 다른 국가는 `countryCredit`을 줄 때만 외곽선을 그림(큰 지도는 기존대로 제거). VNM 출처 문구 불변 |
| `src/map/layers/features.ts` | 값 행이 없는 단위(B-017의 Mymensingh)의 `adm1Name`을 경계 파일의 `nameEn`으로 대체(키가 마지막 수단). 큰 지도에도 적용되는 공용 변경(키 → 이름) |
| `src/data/visualization/publicMapWorkspaceV126.ts` | `publicMapLayerTitleV126`에 선택 인자 `country` 추가(기본값 = 기존 모듈 상태, 호출부 무변경). 작은 지도 팝업이 "베트남 송전망"을 BGD에 쓰던 문제 해결 |
| `detail-location-map-v148.css` | 범주 범례 스타일 5줄 |

## 3. 검증 결과 (production 형식 빌드 `tmp/build-v163-minimap`, 포트 5062 / 기준 빌드 5055, Chromium·외부 타일 차단)
실행 성공과 내용 완성을 구분해 적는다.

### 코드
- `npx tsc --noEmit`: 오류 0
- `npm run test:unit`: 83 스위트 / 854 테스트 전부 통과(신규 22건 포함). 새 파일 테스트가 "데이터 경로 손글씨 금지" 규칙(`countryContext.test.ts`)에 걸려 픽스처 경로를 바꿔 통과시킴(기대값 변경 아님).
- 빌드 `Compiled successfully`, main 번들 +13 B.

### BGD 상세 38개 정적 지도 (1440px)
- 38/38에서 `[data-testid=detail-location-map-v148]` 존재, `data-map-count` > 0(합계 3,531), 베이스 위에 그려진 path/circle 합계 3,536(8개 단위 선택형은 count 7·drawn 8 = 값 없는 단위 1개를 회색으로 표시), 콘솔 오류 0, 문서 가로 넘침 0.
- 대체 문구 페이지 0. 화면 문자열의 raw 키(`BGD.n_m`)·베트남/VNM/34·63개/하노이 등 다른 국가 문구 0건(38쪽 전수 검사).
- 390px: 38/38 지도 표시, 가로 넘침 0, 콘솔 오류 0.
- 홈 히어로(`/?country=BGD#home`): 지도 표시(A-024, 946점), 대체 문구 없음, 390px 넘침 0.

### 라이브 미니맵(엔진) — BGD 7개 레이어에서 활성화 후 `queryRenderedFeatures`
| 레이어 | 유형 | 그려진 피처 | 참조 외곽선 | 콘솔 오류 |
|---|---|---|---|---|
| B-039 | choropleth | 30 | 있음 | 0 |
| B-017 | choropleth(값 없는 단위 1) | 30 | 있음 | 0 |
| B-003 | choropleth | 30 | 있음 | 0 |
| A-023 | point(발전소) | 112 | 있음 | 0 |
| A-024 | point(송전 구간) | 1,892 | 있음 | 0 |
| B-012 | point(재해 이력) | 28 | 있음 | 0 |
| B-028 | point(유량 지점) | 122 | 있음 | 0 |
- 대상은 지도 유형이 point·choropleth 둘뿐이라 line·unit/group 레이어는 없음(BGD 38개 중 해당 없음).
- 클릭 팝업/카드에 raw 키 없음("마이멘싱 (Mymensingh)"). 점검 중 발견: A-024 팝업 제목이 "베트남 송전망" → 수정 후 "송전망"(재빌드 후 재확인).

### 베트남 회귀 (5055 기준 ↔ 5062)
- 상세 10쪽(A-023, A-024, A-028, B-002, B-017, B-021, D-018, D-022, B-044, C-022): 지도 영역 `outerHTML` 10/10 바이트 동일(1440px·390px 각각), `data-map-count`·variable·period 동일.
- 라이브 엔진(A-023, B-017, A-024): 그려진 피처 수·소스 피처 수·중심·줌·참조 외곽선·팝업 문구 동일, 콘솔 오류 0.
- 홈 히어로 VNM 스크린샷 두 빌드 바이트 동일.

### 화면 전후 캡처 (1440px, `reports/v163/screens/`)
- BGD A-023 / B-039 / B-017 / A-024 상세: `minimap-BGD-<ID>-before.png` ↔ `-after.png`
- BGD 홈 히어로: `minimap-BGD-home-before.png` ↔ `-after.png`
- 라이브 엔진 활성 상태: `minimap-BGD-A-023-live-after.png`, `…B-039-live-after.png`, `…A-024-live-after.png`
- 기각 근거: `minimap-BGD-B-039-ne-outline-rejected.png`(아래 4항)

### 화면이 바뀌는 페이지와 확인 경로
- 변경: BGD 상세 38개 전부(`/?view=data&element=<ID>&country=BGD&from=explorer#element-detail` → "위치·분포" 영역), BGD 홈(`/?country=BGD#home` 히어로 오른쪽 지도).
- 확인 순서: 데이터 찾기 → 국가 방글라데시 → 항목 → 상세 → 오른쪽 지도 위에 마우스(라이브 지도 전환) → 지도 클릭(카드).
- 변경 없음(화면 변화 0): VNM 전 페이지.

## 4. 작업 지시와 달라진 점
- **국가 외곽선**: 지시는 "world-countries 피처가 있으면 사용"이었으나 BGD에는 그리지 않음. Natural Earth 피처가 36개 꼭짓점으로 8개 Division 경계와 해안·삼각주에서 눈에 띄게 어긋나(`…ne-outline-rejected.png`) 틀린 윤곽을 그리느니 "없음"을 택함(임의 경계 생성 금지·정확성 우선). 후속: VNM z5처럼 BGD 전용 단순화 외곽선 자산이 필요. 현재 `bgd-country-outline.geojson`은 1.09 MB(gzip 367 KB)라 작은 지도에 쓰기엔 큼.

## 5. 남은 것과 사유
1. **B-002·B-009·B-035·B-036 상세의 작은 지도 안내문**: 상세의 항목 id(`measure-<hash>`)와 지도 변수 id(`m-<hash>`) 사이 대응표가 BGD 데이터에 없어 "선택 항목의 지도자료가 없어 아래에 명시한 항목을 표시합니다" 같은 정직 표기가 남음. 대응표(데이터 쪽) 필요. 값을 추정해 잇지 않음.
2. **BGD 라이브 지도에 Division 이름 라벨 없음**: 한글 지명 라벨(`addKoreanMapLabelsV151`)은 VNM 성·시용. BGD 8개 단위 이름 라벨은 별도 작업.
3. **라이브 지도 배경 스타일**: 기본 스타일의 국가 폴리곤이 BGD에서 거침(배경일 뿐 데이터·경계는 자산 사용).
4. **BGD A-024 이름**: 자산에서 144개 구간 이름이 "kV 전력선 구간"(전압 미기재). 자산 생성 쪽 문제로, 데이터를 고치지 않음.
5. **출처 문구 중복**: 일부 레이어의 지도자료 출처에 "경계 GADM 4.1 ADM1"이 이미 들어 있어 하단 "경계: geoBoundaries" 문구와 겹침(레이어 출처 데이터 쪽 정리 필요; 8개 Division 자산은 geoBoundaries ADM2 병합본이라 하단 문구는 사실과 맞음).
6. **VNM A-028 정적 지도의 필터 무반응·2,055개 옵션 select**: 기존 동작이며 이번 범위 밖(변경 없음).
7. 전체 게이트(`finalize:*`·`qa:acceptance:v162`)는 지침에 따라 PR의 CI `gate`에서 실행(로컬 미실행). 위 검증은 필터 범위 수동 확인.
