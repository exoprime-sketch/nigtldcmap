# V163-T 검사 기대값·판정 변경 사유(2026-10-03)

| 파일 | 전 | 후 | 사유 |
|---|---|---|---|
| `CLAUDE.md` 절대 규칙 merge 조건 | CI `gate`(finalize:v151) 통과 + Preview + 승인 | `Static gate` 녹색 + 바뀐 항목 필터 검사 + 공개 문구 스캔 0 + Preview 캡처 + "PR #N 병합". `PR gate finalize:v151`·Playwright(기준 이미지 4건)는 참고용 | 사용자 지시 2026-10-03 '비필수 검증 제외' |
| `tools/etl/countries/bgd/verify_country_v2.cjs` `COUNTRY_SPECIFIC_NAMES_AS_DELIVERED` | 공개 `sourceOrg` = 입고 `source_org` 그대로 | 입고 값에서 '[기준 원천]'·'[대조]' 표식만 뺀 값과 비교(나머지는 글자 단위 일치 유지) | 공개 문구 정리(내부 순위 표식 비노출, 사용자 지시) — A-029 |
| `scripts/v161/audit-source-notes-v161.mjs` | 출처 메모 계열 12종 | + `internal memo marker`: 내부 메모 대괄호 표식 · '처리규칙' · 'yyyy-mm-dd 확인' | 사용자 지시(공개 문구 스캔 패턴 추가). 기준 강화 |
| `scripts/v157/public-wording-scan-v157.mjs` | 식별자·작업 어휘 | + `memo-marker`(위와 같은 패턴, 제공기관 문장 포함 모든 화면) | 같은 지시. 기준 강화 |

- 기준을 낮춘 변경은 없음
- `REFERENCE_TREE_UNCHANGED`(BGD 검증기)는 베트남 공개 트리에 커밋 전 변경이 있으면 실패 — 이번 베트남 재생성은 의도된 변경이며 커밋 후 통과

## 상세·홈 담당분(feat/v163-detail)

### scripts/v162/acceptance-v162.mjs — `home-download` 체크 (2026-10-03)

- 변경 전: `홈 다운로드 가능 항목` 기대값을 `manifest.downloadableElementCount`로 계산(`downloadAllowed` 플래그만 확인).
- 변경 후: 다운로드 허브가 실제로 쓰는 규칙(`hasDownloadableData` — `dataPresenceStatus`가 `actual-records`/`partial-records`이고 `observationCount`/`entityCount` > 0이며 `downloadAllowed`이고 `downloadableRecordCount` > 0)으로 재계산.
- 사유: BGD B-045는 `downloadAllowed: true`이지만 `dataPresenceStatus: "no-populated-record"`(입력 행 없음)이어서 manifest 집계(100)에는 포함되지만 다운로드 목록이 실제로 내려주는 건수(99)에는 빠진다. 홈 화면(`src/data/publicPlatformV128.ts`)의 `downloadableElementCount`를 매니페스트 값이 아니라 다운로드 허브와 동일한 `hasDownloadableData` 규칙으로 바꾸었으므로(항목 5iv), 감사 스크립트의 기대값도 같은 규칙으로 맞췄다. 매니페스트는 생성 자산(건드리지 않음) — 화면 두 곳이 "같은 규칙"을 읽도록 만든 것이며, 기대값을 현재(버그가 있던) 결과에 맞춰 낮춘 것이 아니다.
- 확인: BGD에서 `node scripts/v162/acceptance-v162.mjs --country BGD --build build --skip map,wording,widths,smoke` 실행 시 `home-download` PASS(이전에는 FAIL, 홈이 100을 보여주고 기대값도 100이었던 수정 전 코드와 달리, 수정 후 홈·허브·기대값이 모두 99).

### 항목 6 — '데이터 준비 중' 처리 (되돌림)

- 최초 작업 지시에는 BGD B-045·VNM C-023·E-013을 찾기/홈/다운로드 목록에서 숨기라는 내용이 있었으나, 작업 중 사용자가 "숨기지 않는다 — 기존 2026-09-29 결정(끝에 위치, '데이터 준비 중' 카드 유지)을 유지하고, 정렬·문구만 검증하라"로 정정했다.
- 그에 따라 `isExcludedCatalogItemV156`/`loadCatalogForCountrySelectionV122`/`scripts/v162/acceptance-v162.mjs`의 `preparing-finder`·`preparing-detail` 체크는 **손대지 않았다**(원래 계획했던 숨김 변경은 코드에 반영되기 전에 정정 지시를 받아 실제 수정이 없었음). 검증 결과 두 체크 모두 기존 그대로 PASS.

## 본 세션 추가분
- `scripts/v153/qa-policy-descriptions-v153.mjs`·`PolicyDescriptionV153.test.tsx`: 정책 설명 카드 라벨 '… yyyy-mm-dd 확인' → '… yyyy-mm-dd 기준'(공개 문구 스캔의 'yyyy-mm-dd 확인' 금지 패턴, 사용자 지시)
- `scripts/v157/public-wording-scan-v157.mjs`: OSM 'ko (value)' 예외 삭제(화면이 더는 원문 키를 붙이지 않음) — 기준 강화
- 날짜 확인 패턴은 데이터 버전 표기(v2026-04-30) 뒤의 '확인'은 제외 — 버전명은 확인 날짜가 아님

## V163-DL(다운로드·quality-report, 2026-10-03)
- 공개 다운로드 CSV 열에서 `source_file`·`source_sheet`·`source_row` 제거(납품 워크북 출처 = 내부 작업 정보, 사용자 지시). BGD 검증기 `SCHEMA_CSV_HEADER`는 VNM CSV 머리글과 비교하므로 양국 같은 열로 통과
- 다운로드 JSON에서 `provenance.sourceFileOriginal/sourceFileDecoded/sourceSheet/sourceRow/sourcePackage`, 요소 `sourceWorkbook` 제거. quality-report에서 `archiveName`·`sheetNames` 제거(읽는 감사 스크립트는 summary·행 수·sourceZip.sha256만 사용)
- 지표 메타 `unit`의 시트 참조 꼬리('…, 1.2_entity 3행 머리글 괄호 표기 참조') 제거 — 레코드 값 단위는 보호(바뀌지 않음, 값 열 대조로 확인)
- 화면용 팩·카탈로그는 다운로드 규칙을 적용하지 않음(화면 변화 0) — #63 공개 텍스트 규칙만 그대로

## V163-T3 (2026-10-03) — `src/data/countries/countryCopyV158.test.ts`
- 변경: 'a reviewed series phrase naming the default country…' 테스트가 실제 문구표(publicIndicatorCopyV144.json)에서 베트남 국명이 든 문구를 찾지 못하면 실패하던 것을, 없을 때는 A-006 '국가추정'이 다른 나라에서도 '국가 통계'로 읽히는지 확인하도록 변경. 국명이 든 문구가 다시 생기면 기존 규칙(다른 나라에서는 원값) 그대로 검사.
- 사유: 그 문구가 유일했던 A-006 '국가추정' → '베트남 통계'를 국가 중립 '국가 통계'로 바꿈. 방글라데시 A-006 차트 필터에 '베트남 통계'가 표시되던 결함(운영 전수 점검 21:25 발견) 수정.
