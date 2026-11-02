# REVIEW V173 — 데이터 지도 팝업 공통 규칙(핵심만 표시)

## 배경
- 2026-11-02 데이터 지도 팝업·'지도 분석' 전수검토(120개 레이어: 베트남 70·방글라데시 50, 색칠된 지역 3곳씩 마우스오버·클릭)
  - 산출물: `지도팝업_지도분석_전수검토_VNM_BGD_20261102.xlsx`(작업 폴더)
  - 판정: 재설계 28 · 보완 64 · 유지 28
- 판정 기준: 팝업 = 핵심(무엇·어디·얼마·언제), 지도 분석 = 상세
- 사용자 지시(2026-11-02): 전 레이어 공통 팝업 규칙부터 반영. 대상은 '주 분석'·안내 문장·괄호 풀이 삭제, SSP 표기 변경, 색지도 팝업 순위 줄 추가

## 변경
- `src/pages/RealMapExplorerPage.tsx`(색지도 마우스오버 팝업): 둘째 줄을 해석 안내 문장(`directionLabel`)에서 값의 위치로 교체
  - 기본: "성·시 34개 중 n위" — 지도에 그려진 같은 레이어·변수·기간 값 기준, 동률은 같은 순위
  - 관할·권역 공통값(`group-constant`) 레이어: "○○ 공통값"(예: 남부전력총공사(EVNSPC) 공통값)
  - 범주 색지도: 범주명(예: Aw (열대사바나))
  - 값이 3개 미만이거나 모두 같으면 줄 없음
  - 지점·선 레이어는 해당 줄 없음
  - GVI(B-021) 팝업은 기존 그대로(권역 순위 포함)
- `src/data/map/mapSelectionModelV161.ts`: `popupContextLineV173` 추가(위 규칙의 순수 함수)
- `src/components/map/mapPublicPopupV129.ts`: 팝업에서 단위(용어집 분류 `unit`) 괄호 풀이 삭제
  - 예: "GWh(기가와트시)/년" → "GWh/년", "°C(섭씨도)" → "°C"
  - 약어 풀이(NDC·WWF 등)는 유지: 용어 설명 감사(V134_GLOSSARY)가 화면의 약어마다 풀이·도움말을 요구하므로, 줄이는 방식(도움말형)은 다음 단계에서 검토
- `src/utils/publicTermTokenizerV134.ts`: SSP 풀이를 배출 수준으로 표기(IPCC AR6 구분)
  - SSP1-1.9 매우 낮은 · SSP1-2.6 낮은 · SSP2-4.5 중간 · SSP3-7.0 높은 · SSP5-8.5 매우 높은 배출 경로
  - 기존 "공통사회경제경로 2–4.5"는 2~4.5 범위로 읽혔음
  - 용어 설명(definition)과 용어 찾기 항목은 변경 없음
- `src/components/map/mapFeaturePopupV148.ts`·`mapOverlapPopupV145.ts`·`RealMapExplorerPage.tsx`(지도 분석의 겹침 선택 목록): '주 분석' 표기 삭제. 함께 보기 레이어만 "함께 보기" 표시
- 단위 시험 추가
  - `mapSelectionModelV161.test.ts` 4건
  - `publicTermTokenizerV134.test.ts` 1건
  - `mapOverlapPopupV145.test.ts` 1건
  - `mapPublicPopupV129.test.ts`(신규) 2건

## 화면 변화(변경 전 운영 → 변경 후 V173 빌드, 1440px)

| 레이어 | 변경 전 | 변경 후 |
|---|---|---|
| 베트남 B-039 수력 잠재량 | 22,204 GWh(기가와트시)/년 · 기준 2017 | 22,204 GWh/년 · **성·시 34개 중 1위** · 기준 2017 |
| 베트남 B-002 기후대 | 같은 기간·시나리오 안에서 국토 비율을 해석 | **Aw (열대사바나)** |
| 베트남 A-022 전력공급 신뢰도 | (둘째 줄 없음) | **남부전력총공사(EVNSPC) 공통값** |
| 베트남 A-013 NDC-SDG 지역조치 | 건수의 많고 적음만으로 정책 성과를 판정하지 않음 | **홍강 삼각주 권역 공통값** |
| 베트남 B-004 미래기후 | SSP2-4.5(공통사회경제경로 2–4.5) 29.42 °C(섭씨도) | SSP2-4.5(**중간 배출 경로**) 29.42 °C · 성·시 34개 중 1위 |
| 베트남 A-024 송전망(겹친 구간) | 주 분석 / 베트남 송전망 … | 베트남 송전망 … |
| 방글라데시 A-023 발전소 | 주 분석 · 발전소 | 발전소 |
| 방글라데시 B-039 수력 잠재량 | 21,226 GWh(기가와트시)/yr | 21,226 GWh/yr · **주(Division) 8개 중 1위** |

- 캡처: `reports/v173/screens/popup-before-after-1440.png`(8개 팝업 전후 비교), `vnm-b039|vnm-b002|vnm-a022|bgd-a023-before|after-1440.png`
- 팝업 밖(지도 분석·목록·상세 화면) 변화: 지도 분석의 겹침 선택 목록에서 '주 분석' 글자 삭제. SSP 풀이는 용어가 펼쳐 보이는 모든 화면(지도 레이어 목록·그래프 범례 등)에서 "○○ 배출 경로"로 바뀜

## 검증(실행 결과)
- tsc 0 · 단위 시험 165 suites / 1,706 통과(신규 8건) · production 빌드(`GENERATE_SOURCEMAP=false`, `BUILD_PATH=tmp/build-v173-review`) 성공
- 필터 검사(바뀐 항목, 로컬 production 빌드)
  - audit:map-popup:v133 — 결과: 11/12 PASS — 실패 1건(CLICK_FEATURE_WITHOUT_DETAIL, GVI 지도 분석의 순위 문구 형식)은 main CI(3121f216)와 같은 기존 실패
  - audit:map-tooltip:v132 — 결과: 5/8 PASS — 실패 3건(MAP_PLACEHOLDER_PRIMARY_TITLE·MAP_TOOLTIP_MISSING_KEY_FACTS·B033_MAP_REGION_TREND)은 main CI와 같은 기존 실패
  - audit:glossary:v134 — 결과: 16/17 PASS — VISIBLE_ACRONYM_WITHOUT_GLOSSARY 18건은 main CI와 같음(증감 0). 지도 상호작용 PASS
- 실제 브라우저(Playwright Chromium, 1440×900): 위 8개 레이어 팝업 전후 문구 확인(운영 vs V173 빌드). 의도한 줄 외 변화 없음
- 6폭(320·390·768·1024·1440·1920px) 데이터 지도 문서 가로 넘침: 0(320·390·768·1024·1440·1920px, 수력 이론 잠재량 표시 상태)
- 기대값 변경 없음
- 로컬 브라우저 감사 실행 환경: 컨테이너가 root라 Chromium을 `--no-sandbox`로 감싸 실행(`V125_BROWSER_EXECUTABLE`), `NODE_OPTIONS=--max-old-space-size=6144`. 감사 스크립트는 수정하지 않았고, 실행 중 갱신된 기존 보고서 JSON(v132·v133·v134)은 커밋하지 않음
- Preview: https://nigtldcmap-git-v173-popup-core-exoprime-5142s-projects.vercel.app (Vercel 로그인 필요). Preview에서 베트남 수력 이론 잠재량 팝업 확인: "22,204 GWh/년 · 성·시 34개 중 1위"(`reports/v173/screens/preview-vnm-b039-popup.png`)

## 미완료(다음 단계, 전수검토 결과 중 이번 범위 밖)
- 팝업에 핵심 값이 없는 지점 레이어: B-008 해수면, B-023 유량 차이, B-028 하천유량, B-025 유역면적
- 국가 전체 값을 광산 지점에 표시하는 문제: B-044·B-046·B-047
- 지점 팝업의 국가·명칭 중복 행과 '미기재' 행
- '[개편 후 성·시 값]' 대괄호 표기와 63개 보기에서 다른 성·시 값이 보이는 문제
- 지도 분석의 최솟·중앙(파생)·최댓값 요약을 상위·하위 5개 막대로 교체
- 선·겹친 지점 클릭 시 지도 분석 갱신
