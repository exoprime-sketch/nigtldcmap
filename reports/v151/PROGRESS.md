# PROGRESS — PR-P2 V151 행정경계 34 + 배경 (feat/v151-boundary-34-backdrop)

## PR 목표
- 지도의 행정경계 기본을 2025-07-01 시행 34개 성·시(결의 202/2025/QH15)로 바꾸고 개편 전 63개는 토글로 남긴다. 값은 원자료 기준(개편 전 63개)을 그대로 두고 34개로 합산·평균·분할하지 않는다.

## 수용기준
- `public/data/vietnam/v2/geometry/vnm-adm1-34.geojson` 34개, crosswalk34 구성원 63개 전수·무중복, 합성 좌표 0, 면적 보존 오차 ≤ 1ppm
- 지도 기본 선택이 34개이고 63개로 토글되며 선택이 새로고침 후에도 유지
- 경계 기준을 바꿔도 값·지표는 바뀌지 않으며, 그 사실이 화면에 상시 고지
- `crosswalk34` Hà Tĩnh 키 `"ha"` 정규화 버그 수정(정본 무손실)
- '63개 성·시' 단서 없는 문구 0, 반응형 6폭 가로 넘침 0, 동일출처 요청 실패 0
- `npx tsc --noEmit` 0 · `test:unit` 206+ · `finalize:v151`(= finalize:v140 + 경계34 정적 게이트) 통과

## 환경(클라우드 컨테이너)
- `_source/`·`베트남데이터/` 없음 → 원천 폴더가 필요한 작업은 범위 밖(§미완료)
- Chromium은 `/opt/pw-browsers/chromium`(141) 사전 설치본 사용. `npx playwright install`은 네트워크 차단으로 실패하므로 사용하지 않음
- 외부 타일 호스트 `tiles.openfreemap.org`는 프록시에서 차단 → 배경지도 타일만 비어 보임(V150 설계대로 데이터·경계 레이어 유지). 감사에서 INFO로 분리

## 단계
- [x] 1단계 정규화 버그 — `normalizeAdministrativeName`이 `tinh`을 위치 무관 제거해 'Hà Tĩnh'→'ha'. 접두(베트남어)·접미(영어)에서만 제거하도록 수정 후 재생성. 34그룹·63구성원 불변, 키 1건만 변경, 생성 자산 무변경 (커밋 ee29c1c)
- [x] 2단계 34개 경계 자산 — `tools/vietnam_spatial/build_adm1_34_v151.py`(shapely `unary_union`). 34개·병합단위 23개, 면적 오차 0.0ppm, 합성 좌표 0. VN-49/50/51 접점의 원천 틈 0.1215km²는 메우지 않고 기록. integrity 518건 갱신 (커밋 0de49b2)
- [x] 3단계 계약 모듈·라벨·테스트 — `src/data/map/adminBoundaryV151.ts`, `labelNameV151`, 테스트 9건. Huế는 '후에'(개편 전 VN-26은 '트어티엔후에' 유지) (커밋 11c9f16)
- [x] 4단계 화면 토글·문구 — 지도 '행정경계 기준' 라디오(기본 34), 참조 경계·라벨·대체 SVG·저작권·상태 문구 연동, 이용안내·지도 안내 등 문구에 '개편 전' 명시 (커밋 7b06eab)
- [x] 5단계 게이트 — `scripts/v151/audit-boundary-34-v151.mjs` 정적 21 + 브라우저 11. npm `audit:boundary-34:v151`·`finalize:v151`·`build:adm1-34:v151` (커밋 3518881)
- [x] 6단계 환경 보정 — root 실행 시 헤드리스 브라우저 기동 실패를 `--no-sandbox`로 해소, `V125_BROWSER_ARGS` 주입구 추가. 기대값 불변 (커밋 40632d5)
- [x] 7단계 문서·PR — REVIEW_V151·PR_BODY·GATE_ENVIRONMENT_V151·CHANGELOG 작성, 게이트 개별 실행(21 PASS·7 FAIL, 전부 타일 차단), origin/main 대조로 회귀 아님 확인, PR 생성. merge는 사용자 승인 + 타일 접근 가능한 환경의 finalize:v151 확인 대기
