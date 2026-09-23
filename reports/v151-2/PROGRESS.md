# PROGRESS — PR-B2 V151-2 (feat/v151-2-boundary-policy-backdrop)

## PR 목표
- 34개 경계에서 값을 규칙별로 보여주는 `boundaryPolicy`(빌드 생성), 63 dissolve 국가 외곽선, 배경지도 선택기(지형/위성/도로·지명/없음), CCKP 팩 분할, 문구 34 기준 갱신 + (추가) 라벨 계층·중복 제거, 뷰포트 유지·`view=` URL.

## 수용기준
- 42개 레이어 전부 `boundaryPolicy` 보유(면 레이어 누락 시 빌드 실패), 분위형 지표는 range-only만.
- 수치: B-031 34 합 == 63 합, B-032 새 Lâm Đồng 값이 구성 min~max 안, C-019 34 직접값 == 종전 복제값.
- 팩: 8 MB 초과 요소 단독 팩(19→26), 152 요소 payload sha 불변, 상세 준비시간 실측 전후.
- 배경: 첫 타일 시각 3회 실측(지도·홈), 실패 시 '없음' 자동 하강, 귀속 표기.
- 라벨: 성급시 6곳 문자열 1개, 대표점 폴리곤 내부 34/63 전수.
- 뷰포트: 레이어/주 분석/토글/배경 전환에 center Δ≤0.001°, zoom Δ0; 새로고침 후 view 복원.
- `finalize:v151` PR 직전 1회, analysis QA ⊆ 41건 기준선. 6폭 가로 넘침 0.

## 단계
- [x] 0 팩 분할 — `tools/vietnam_etl/repack_packs_v151_2.py`, `_plan_packs`(8 MB 규칙), 19→26(B-003~007 + B-017·B-033도 초과), payload sha 152 불변, card-summaries packUrl 재생성. 로더 원문 SHA 제거. 실측: 상세 준비(번들→파싱) 0.19~0.51 s(전 팩 통째 디코드), 화면 ready 0.50~1.23 s(전 2.8~3.0 s).
- [x] 1 boundaryPolicy — 계약 선언 42 → 빌드 생성, 점 13 레이어 소재지 사이드카(PIP), `boundaryPolicyV151.ts`(14 tests), RMEP 래퍼(34/63/region-6), 팝업·패널·고지·패널 통계. 스모크 PASS(콘솔 0).
- [x] 3 배경지도 — `mapBackdropV151.ts`(23 tests), RMEP 라디오·자동 하강·계측·preconnect·워밍업. 1차 실측(워밍업 전): 지형 1.37~1.68 s, 위성 0.30 s, 도로·지명 2.6~2.8 s → 워밍업 후 재측정 필요.
- [x] 5 라벨 — `mapLabelsV151.ts`+`labelAnchorV151.ts`(polylabel), RMEP 배선, `label-dedup-v151-2.mjs` 정적 PASS(34/63 내부 전수, 중심점은 2개 외부였음).
- [x] 6 뷰포트 — camera 상태·`view=` URL·자동 맞춤 2경우·러너 작성(브라우저 실행 대기).
- [x] 2 국가 외곽선 — MAP_STYLE(세계 파일 VNM 제외 + vnm-country-outline)·비교·SVG 대체·미니맵 배선.
- [x] 4 문구 — displaySpatialUnit 20곳, 이용안내, 작업공간, D-008, 대기 고지; NO_UNQUALIFIED_63_COPY 통과.
- [x] 러너: screens 54/54(42×{34,63}, 배경 4×6, 팝업 5, 6폭 0), viewport 16/16, labels 40/40, 배경 재측정(지형 0.85 s 중앙).
- [x] 문서: docs 2종, REVIEW_V151-2, PR_BODY, CHANGELOG, README.
- [x] finalize:v151 1차 — map-tooltip:v132 B033_MAP_REGION_TREND FAIL(34 단위 선택 시 추이 없음) → 집계 계열로 수정, 단독 재실행 8/8 PASS.
- [ ] finalize:v151 2차(최종, 12:22 시작) → 결과 REVIEW §4.1 → push → PR.

## 메모
- main CI(#21) 빨강 원인 = pack-005 디코드 타임아웃(B-004~007 상세, duplicate-copy·screen-usability) → 이 PR 0단계가 fix-forward.
- 워크트리(`.claude/worktrees/…`)에서는 jest testMatch가 `.`-디렉터리 때문에 0건 매칭 — 메인 체크아웃에서 `npm run test:unit` 실행.
- `git stash pop` 주의: 오래된 stash@{0}(PR #20 감사 보고서 churn)가 남아 있음 — 건드리지 말 것.
