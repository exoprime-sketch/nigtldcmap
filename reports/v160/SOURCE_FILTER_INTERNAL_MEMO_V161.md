# 데이터 찾기 '출처' 필터 — 내부 메모 노출 제거

브랜치 `fix/source-filter-internal-memo` (main 2f05bc5 = #41 이후에서 분기).

## 현상

데이터 찾기의 '제공기관'(출처) 필터 목록에 실제 기관명이 아닌 내부 작업 메모가 선택지로 그대로 노출됨: `확인필요`, `연구진 설정(발주처 협의 예정)`, `현지조사(예정)`, `…(용역사 취합)`. 같은 문구는 카드의 제공기관 표시(요약 카드가 없을 때의 대체 표기)와 데이터 다운로드 페이지의 출처 표시 목록에도 나타남.

## 원인

`src/data/countries/vietnamCountryDataProviderV122.ts`가 카탈로그를 만들 때 `item.sourceOrganizations`를 `publicSourceOrganizationV136_1`(내부 메모 제거 함수, `src/data/visualization/publicFieldPolicyV126.ts`)에 통과시키지만, 이 함수는 기존에 "시트 열 참조" 계열 메모(`레코드별`, `attr_`, `시트`, `열 참조`)만 걸렀다. `확인필요`·`발주처`·`용역사`·`현지조사(예정)` 같은 프로젝트 진행 상태 메모는 걸러지지 않고 실제 기관명처럼 통과했다.

## 조치

1. **`publicSourceOrganizationV136_1`(`src/data/visualization/publicFieldPolicyV126.ts`)의 메모 판정 정규식을 확장.** 값 전체가 이 메모 중 하나라도 있으면(진짜 기관명이 앞에 붙어 있어도) 값 전체를 버린다 — 이 값들은 "메모 + 실제 기관명" 구조가 아니라 값 자체가 메모이기 때문이다(예: "각 기관 공식 웹사이트(용역사 취합)"는 "각 기관 공식 웹사이트"가 실제 기관명이 아니라 메모의 일부).
2. **`sourceOrganizationsForCatalogV122`(신규, `vietnamCountryDataProviderV122.ts`)**: 필터링 후 배열이 비면(요소에 기록된 출처가 전부 메모였던 경우) 명세서(`db_status_framework_v5.38`) 기반 카드의 대표 출처명(`getCardSpecV159(id).sourceLabel` — 이미 카드·상세에 쓰이는 검증된 필드)으로 대체한다. 추정·신규 값 생성이 아니라 이미 화면에 쓰이는 값을 재사용.
3. 이 함수 하나를 고쳐서 출처 필터·검색 결과 카드의 대체 표기·데이터 다운로드 페이지 출처 목록이 한 번에 고쳐진다(모두 `item.sourceOrganizations` 또는 같은 함수를 직접 호출).
4. 원자료(`catalog.json`)와 다운로드 파일 내용은 그대로 둔다 — 표시 단계에서만 걸러낸다.

## 대상 요소(8건)와 전후 표기

| 요소 | 이전(catalog.json 원본) | 이후(화면 노출) |
|---|---|---|
| B-044 | USGS Mineral Commodity Summaries 2026 · USGS Mineral Commodity Summaries 2026; USGS Minerals Yearbook Vietnam 2022 · **연구진 설정(발주처 협의 예정)** · **현지조사(예정)** | USGS Mineral Commodity Summaries 2026 · USGS Mineral Commodity Summaries 2026; USGS Minerals Yearbook Vietnam 2022 |
| E-005 | **각 기관 공식 웹사이트 및 CTCN 네트워크 회원 정보(용역사 취합)** | NIGT 취합 *(명세서 v5.38 대표 출처명으로 대체 — 기록 전부가 메모였음)* |
| E-007 | GEF · UNFCCC · 베트남 농업환경부(MAE) · **베트남 정부 법령(…) 및 UNFCCC 문서(용역사 취합)** · 베트남 정부(Government of Viet Nam) | GEF · UNFCCC · 베트남 농업환경부(MAE) · 베트남 정부(Government of Viet Nam) |
| E-010 | World Bank (UNESCO Institute for Statistics 원자료) · WIPO · **확인필요** | World Bank (UNESCO Institute for Statistics 원자료) · WIPO |
| E-014 | **대한민국 외교부(MOFA) / 2050 탄소중립녹색성장위원회 등 공식 발표자료(용역사 취합)** | 외교부 외 *(명세서 v5.38 대표 출처명으로 대체)* |
| E-018 | **각 기업 공식 웹사이트 및 언론 보도(용역사 취합)** | NIGT 취합 *(명세서 v5.38 대표 출처명으로 대체)* |
| E-019 | **각 기관 공식 웹사이트(용역사 취합)** | NIGT 취합 *(명세서 v5.38 대표 출처명으로 대체)* |
| E-020 | **NIGT·과기정통부·…(용역사 취합)** · **한국에너지공단·…(용역사 취합)** | KEITI 외 *(명세서 v5.38 대표 출처명으로 대체 — 기록 전부가 메모였음)* |

굵게 표시한 값이 이번에 제거되는 내부 메모. `E-008`·`E-011`도 같은 계열 메모(`용역사 자체 산출`, `해당없음 — … 생성 예정`)를 가지고 있었으나 둘 다 비공개(제외/미수집) 상태라 애초에 찾기·카드·다운로드에 나타나지 않음 — 대상에서 제외.

## 확인 경로

1. `/#explorer` → '제공기관' 선택지 확인 (또는 `/?country=VNM#download` → 다운로드 페이지 '출처' 목록)
2. `확인필요`, `발주처`, `용역사`, `현지조사(예정)` 어느 것도 선택지에 없음
3. B-044를 검색 → 제공기관에 USGS만 남음. E-005/E-018/E-019를 검색 → 제공기관 'NIGT 취합'. E-014 → '외교부 외'. E-020 → 'KEITI 외'

## 검증

| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 593/593(신규 13: `publicFieldPolicyV126.test.ts` 5건, `sourceOrganizationFilterV161.test.ts` 8건) |
| 제공기관 선택지 개수(실측) | main 273개(메모 10개 포함) → 이 PR 267개(메모 0개) |
| `reports/v160/screens/source-filter-before-finder-1440.png` / `-after-finder-1440.png` | 데이터 찾기 화면 1440px(선택 닫힘 상태 — 네이티브 select 팝업은 브라우저 자동화로 캡처 불가해 목록 값은 위 실측 JSON과 대조표로 대신함) |

전체 게이트(finalize:v151)는 이번 변경 범위(순수 표기 함수 1개 + 헬퍼 1개, 화면·데이터 구조 변경 없음)를 고려해 별도로 요청 시 실행.
