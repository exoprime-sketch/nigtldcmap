# 홈·데이터 찾기 역할 분리 — 구현·검증 보고 (V140)

작성일: 2026-09-16 · 브랜치: `feat/home-map-analysis-v139` (V139 후보 위에 추가) · 새 탭·새 화면 없음

## 1. 요구사항별 처리

| # | 요구 | 처리 | 근거(검사 ID, `reports/v140/role-split-qa-v140-local-build.json`) |
| --- | --- | --- | --- |
| 1 | 홈 '주요 데이터' 8개 유지 | A-002·A-003·A-010·A-023·A-024·B-033·C-016·D-023 그대로 | `HOME_FEATURED_EIGHT` |
| 2 | 홈 카드 = 제목·핵심 질문·핵심 수치 또는 미리보기·기간·제공기관·상세보기 | 카드 구조를 제목 → 핵심 질문(`question`) → 핵심 수치(`headline.value` + 산출 규칙 `headline.label`) → 미리보기(차트/정적 지도) → 기간·제공 → 상세보기로 재구성 | `HOME_CARD_QUESTION` `HOME_CARD_HEADLINE` `HOME_CARD_PREVIEW` `HOME_CARD_FACTS_PERIOD_PROVIDER_ONLY` `HOME_CARD_SINGLE_DETAIL_CONTROL` |
| 3 | 긴 유의사항·전체 측정항목·다운로드·지도 버튼·원자료 행 수 제거 또는 상세로 이동 | 단위 행, 유의사항 문단, A-023 원천 행 수 범례('WRI 236행 · OSM 1,727행')를 카드에서 제거. 유의사항은 상세 화면 '자료 이용 시 유의사항'(`publicLimitationsRegistryV127`)으로 이동: A-010 총계 행 없음, A-024 계획 선로 경로 없음·좌표 오차, B-033 전국 계열 없음, C-016 계획 용량(실적 아님), D-023 승인액 통화별 합산. 카드에 지도·다운로드 버튼 없음(hero의 '이 자료 지도에서 보기'는 카드가 아닌 지도 미리보기 링크로 유지) | `HOME_CARD_NO_CAVEAT_PARAGRAPH` `HOME_CARD_NO_ROW_COUNT` `HOME_CARD_NO_MAP_OR_DOWNLOAD_CONTROL` `DETAIL_CARRIES_MOVED_CAVEATS` |
| 4 | 데이터 찾기 = 152개 전체·필터·정렬·지도·다운로드 | 기존 목록(152)·정렬(관련도/최신/데이터명)·필터(대분류·그룹·연도·제공기관·기후기술)에 '제공 형태'(지도 제공 / 다운로드 가능) 필터 추가. 카드의 '지도에서 보기'·'다운로드' 버튼 유지 | `FINDER_TOTAL_152` `FINDER_HAS_SORT_AND_FILTERS` `FINDER_MAP_FILTER_CARDS_HAVE_MAP_BUTTON` `FINDER_DOWNLOAD_FILTER_EQUALS_HOME`(147) |
| 5 | 홈 제목 = 데이터 찾기 제목(public title) | 두 화면 모두 catalogue `publicTitle`을 `PublicTermTextV134`로 그림(홈은 이전에 `PublicTermExpandedTextV134`). 8개 모두 문자열 일치, A-002 상세 h1도 일치 | `FINDER_TITLES_EQUAL_HOME` `DETAIL_A002_TITLE_EQUALS_HOME` |
| 6 | 지도자료 수를 하나의 manifest/map-index 기준으로 통일 | `src/data/map/mapAvailabilityV140.ts`: 지도 자료 수 = `map-index.json` 활성 레이어(= `manifest.mapLayerCount`). 홈 상태띠 42 · 지도 목록 머리글 '42개 자료 · 선택 N개 · 준비 중 1개'(이전 '43개 자료') · 지도 데이터 안내 '지도 자료 42개 · 준비 중 1개' · 데이터 찾기 '지도 제공' 필터 42 | `MAP_COUNT_ONE_NUMBER_EVERYWHERE` `MAP_COUNT_MANIFEST_EQUALS_INDEX` `HOME_MAP_COUNT_EQUALS_INDEX` `MAP_LEDE_COUNT_EQUALS_INDEX` `MAP_GUIDE_COUNT_EQUALS_INDEX` `FINDER_MAP_FILTER_EQUALS_INDEX` |
| 7 | 43개 목록에서 연결/준비 중 구분 | 준비 중 행: '준비 중' 배지, 점선 테두리·연한 배경, 요약 '위치자료 없음 · 지도에 표시하지 않음', 체크박스 비활성. 분류 머리글 '5개 · 준비 중 1', 목록 머리글 '… · 준비 중 1개', ⓘ의 '준비 중 사유' | `MAP_PENDING_STATED` `MAP_PENDING_ROWS_MARKED` `MAP_GROUP_COUNTS_NAME_PENDING` |
| 8 | B-017처럼 공간자료가 없는 항목을 지도에 위치가 있는 것처럼 표시하지 않음 | B-017은 map-index에 없고(레이어 0), 목록에서 준비 중, 클릭해도 그려지지 않음. 데이터 찾기·상세 화면에 '지도에서 보기' 없음, 상세는 지도 미연결을 명시 | `B017_NOT_IN_MAP_INDEX` `MAP_B017_PENDING` `MAP_B017_NEVER_DRAWN` `FINDER_B017_NO_MAP_BUTTON` `B017_DETAIL_NO_LOCATION_CLAIM` |
| 9 | Preview·production 재검증 | §3 | — |
| 10 | 새 탭 없이 기존 구조 개선 | 주 메뉴 변경 없음. 홈·데이터 찾기·지도·다운로드·상세 안에서만 변경 | `audit:launch-polish:v136-1` HOME_STAT_TILES 등 PASS |

핵심 수치(요약자산에서 계산, 규칙은 카드에 표기): A-002 여섯 영역 추정치 범위(−1.10 ~ +0.01, 2024) · A-003 514.7(10억 달러, 2025 명목) · A-010 582.7 Mt CO₂eq(2024 네 가스 합계) · A-023 41,350 MW(WRI 수록 발전소 설비용량 합계, 상세 화면의 같은 KPI) · A-024 23,608 km(2016 송전선 606구간) · B-033 11,728 ha(Quảng Ninh, 2024 손실 최대) · C-016 27,385 MW(63개 성·시 집중형 태양광 2025–2030 계획) · D-023 71건(4개 기금 개별 사업).

추가로 발견·수정: A-002 다운로드 파일명과 공유 링크 slug가 이전 자료(CPIA)를 말하고 있었음(`vietnam_cpia-country-policy-…csv`). slug를 `wgi-worldwide-governance-indicators-gugga-geobeoneonseu-jipyo`로 바꾸고 이전 slug는 legacy alias로 유지.

## 2. 로컬 build 검증

- `npm run build` Compiled successfully · `npm run test:unit` 30/30
- `npm run qa:role-split:v140` → 52/52 PASS (홈·데이터 찾기·지도·A-002 상세·이동한 유의사항 5건·다운로드(A-002 CSV 생성 164,497 B, 정적 자산 200)·B-017 상세·콘솔 0·HTTP 실패 0). 스크린샷 `reports/v140/screenshots/local-build/`
- 기존 감사: §4 표

## 3. Preview·production 재검증 (§9)

| 대상 | 상태 | 결과 |
| --- | --- | --- |
| Preview (`feat/home-map-analysis-v139`, Vercel) | 최신 Preview 배포는 `203d2ec`(2026-09-15T07:44Z). 본 V140 커밋은 push 후 새 Preview가 생성됨. **익명 접근 시 Vercel SSO로 302(Deployment Protection)** | 이 세션에서는 자산·화면을 확인하지 못함. 로그인된 브라우저 또는 Protection Bypass 토큰으로 `npm run qa:role-split:v140 -- --base-url <preview-url> --label preview` 실행 필요 |
| production (`nigtldcmap.vercel.app`, sha `16b3ada`) | `manifest.json` mapLayerCount **12**, generatedAt 2026-08-27, frameworkElements 152 — V138/V139/V140 미반영 트리 | `--base-url https://nigtldcmap.vercel.app --label production-before` 결과는 `reports/v140/role-split-qa-v140-production-before.json`(현 production의 상태 기록, 본 변경 반영 전이므로 FAIL이 정상) |

운영 배포 전 절차(승인 필요): PR(`feat/home-map-analysis-v139` → `main`) 생성 → Preview에서 `qa:role-split:v140` PASS 확인 → 병합·production 배포 → 같은 명령을 `--base-url https://nigtldcmap.vercel.app --label production`으로 재실행해 홈·Finder·지도·A-002·다운로드 확인.

## 4. 기존 감사 결과

`reports/v140/audit-results-v140.md` 참조(이 보고서와 같은 커밋에서 실행).

## 5. 변경 파일

- 홈: `src/pages/HomePage.tsx`, `src/components/home/HomePreviewChartV139.tsx`, `src/data/homePreviewV139.ts`, `src/styles/home-final-v13.css`, `scripts/v139/build-home-preview-v139.mjs`, `public/data/vietnam/v2/home/home-preview-v139.json`(schema `v139-home-preview-2`), `public/data/vietnam/v2/asset-integrity.json`
- 상세 유의사항: `src/data/visualization/publicLimitationsRegistryV127.ts`
- 데이터 찾기: `src/pages/DataExplorerPage.tsx`, `src/styles/country-data-platform-v122.css`
- 지도: `src/data/map/mapAvailabilityV140.ts`, `src/pages/RealMapExplorerPage.tsx`, `src/components/map/MapDataGuideV130.tsx`, `src/styles/map-catalog-v138.css`
- slug: `src/data/vietnam/vietnamElementSlugsV121.ts`
- 검증: `scripts/v140/role-split-qa-v140.mjs`, `package.json`(`qa:role-split:v140`), `CHANGELOG.md`
