## 요약
- 34개 경계에서 값을 레이어별 규칙(`boundaryPolicy`, 빌드 생성)으로 표시: sum·area-weighted-mean·range-only·count-sum·membership-or·native-34·six-region-only·none. 63개 토글은 원자료 값 그대로. CCKP B-003~B-007은 전 지표 면적가중평균(격자 공간평균 원자료), B-042 상위 10%는 구성 범위만.
- 국가 외곽선을 63개 성·시 병합(`vnm-country-outline`)으로 교체(큰 지도·비교·SVG 대체·미니맵).
- 배경지도 선택기(지형·위성·도로·지명·없음, 기본 지형): preconnect·워밍업·첫 타일 계측·자동 하강·귀속.
- CCKP 팩 단독 분할(8 MB 규칙, 19→26) + 로더 원문 SHA 재해시 제거 — **main CI(#21) 실패(pack-005 타임아웃)의 fix-forward**.
- (추가 요구) 라벨 계층·성급시 중복 제거(polylabel 대표점), 뷰포트 유지 + `view=` URL 저장·복원.

## 수치
- 상세 준비(번들 요청→파싱) B-003~B-007: 0.19~0.51 s(전: 팩 447 MB 통째 디코드), 화면 ready 0.50~1.23 s(전 2.8~3.0 s).
- 첫 배경 타일(콜드 3회 중앙): 지형 0.85 s(0.59~1.16) · 위성 0.34 s · 도로·지명 1.07 s(≤1 s 미달, 사유 REVIEW §5).
- 수치 검증: B-031 34 합 == 63 합(3 계열) · B-032 Lâm Đồng 58.05 ∈ [35.57, 73.35] · C-019 34/34 종전 복제값 동일 · 152 요소 payload sha 불변.
- 러너: 42 레이어 × {34, 63} 렌더·콘솔 오류 0 · 배경 4 × 6 레이어 · 팝업 5 · 6폭 넘침 0 · 뷰포트 16/16 · 라벨 40/40.

## 검증
- `npx tsc --noEmit` 0 · `npm run test:unit` 262/262 · `audit:boundary-policy:v151-2` 24/24 · `audit:boundary-34:v151 --skip-browser` 21 PASS.
- `npm run finalize:v151`: 2회 실행 — 1차 map-tooltip(34 단위 추이), 2차 map-popup(6권역 겹침·place) 각 1건 실패 → 수정 후 단독 재실행 8/8·12/12 PASS; role-split 52/52, analysis QA 41 = 기준선 41(신규 0). 3차 전체 실행은 승인 후 1회(REVIEW §4.1).

## 문서
- `docs/ADMIN_BOUNDARY_34_V151.md`(집계정책·지표별 판정표), `docs/MAP_BACKDROP_V151.md`, `reports/v151-2/REVIEW_V151-2.md`, CHANGELOG, README.

## 기대값 변경
- `audit-boundary-34-v151` SCREEN_VALUE_NOTICE/63: 상시 "합산하지 않습니다" 고지 → 레이어별 정책 1줄(사유 REVIEW §4.2).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
