# 랜딩페이지 개선 및 후보 공개화면 수용검토 — 구현 보고 (V139)

작성일: 2026-09-15 · 통합 브랜치: `feat/home-map-analysis-v139` (origin/main `16b3ada` 위에 미반영 커밋 9개) · 기존 브랜치 `feat/public-analysis-completion-v138`는 그대로 보존

## 1. 상태

| 구분 | 상태 |
| --- | --- |
| 홈 개선 구현(로컬 production build) | 완료 — 아래 수용기준표 참조 |
| 지도·상세 잔여 수용조건(§6) | C-019/C-022·B-025·A-025·D-018·E-008·C-022 표 반영. **B-017 평가구역 경계와 B-023/B-025/B-028 유역 경계는 미해결 목록으로 유지**(대표점 표시는 경계 제공이 아님) |
| 브랜치 정리 | 완료 — `origin/main`(`16b3ada`) 트리는 이전 브랜치의 `1f09450`과 동일(`git diff 16b3ada 1f09450` 없음). 그 뒤 커밋 `181a305`·`12e56f7`(main 미포함, 14파일 +417/−47)와 V138·V139 커밋 7개를 개수 기준이 아니라 diff 기준으로 확인해 origin/main 위로 rebase. 결과 트리는 이전 브랜치 HEAD와 동일(`git diff` 없음) |
| 전체 gate | `finalize:v136` 최종 실행 결과는 `reports/v136/release-audit-v136.json`(이 보고서의 커밋과 같은 트리) |
| Preview URL | push 전 — 아래 '다음 단계' |
| production | 미반영 — `nigtldcmap.vercel.app`은 12개 레이어 데이터(main `16b3ada`)를 제공 중이며 후보 42개와 섞어 적지 않음 |

## 2. 홈 수용기준 확인 (`reports/v139/home-runtime-qa-v139.json`, 로컬 build, 390/768/1024/1440/1920)

| 기준 | 결과 |
| --- | --- |
| 상단 3메뉴 복제 카드 0 | 0 (홈 안 '데이터 찾기/지도/다운로드' 컨트롤 없음, 진입점은 주 메뉴) |
| 주요 데이터 8개 유지 · 각 링크 유효 | 8개 카드 모두 미리보기 있음 · '상세보기' 8건 모두 해당 element 상세로 이동(`interactions.cardLinks`) |
| source/year/unit 일치 | 카드 기간·단위·제공은 빌드 단계 요약자산이 pack에서 계산한 값과 같은 파일에서 나옴(`public/data/vietnam/v2/home/home-preview-v139.json`, `reports/v139/home-preview-build-v139.json`) |
| 모바일 주요데이터 접근 | 390px: 주요 데이터 상단 y=875(이전 1,019), 768px: 808 |
| 큰 불필요한 빈공간 0 | 1440px hero 490px(설계 출발점 440–520 안), 데이터 현황 y=561, 주요 데이터 y=609. 카드는 내용 높이만큼(행 늘림 없음) |
| 초기 홈 지도엔진 eager load 0 | MapLibre DOM·chunk 요청 없음(`mapEngineOnHome: false`) |
| 새 탭 0 | 주 메뉴 변경 없음 |
| 검색 예시 4개 → 실제 검색 결과 | '송전망' 클릭 → `#explorer?q=송전망` 결과 1건 |
| 지도 미리보기 deep link | '이 자료 지도에서 보기' → `#map` primary A-024 |
| 주제별 데이터 | '기후·환경' → 찾기 분류 B 필터 24건 |
| 가로 넘침·잘린 텍스트·콘솔·HTTP 오류 | 0 / 0 / 0 / 0 |
| 내부 문구('자체 검산' 등) | 0 |

카드별 미리보기 규칙(요약자산 `note`에 그대로 적힘): A-002 최신연도 6개 추정치(백분위 순위 제외) · A-003 명목 GDP 한 계열 · A-010 4개 가스 CO₂eq 구성(총계 행 없음) · A-023 원천별(WRI/OSM) 발전원 행 수, 합산 안 함 · A-024 2016 선로 정적 SVG + 전압 범례, 계획 선로 116행은 경로 없음 명시 · B-033 최신연도 손실 최대 성·시 1곳 계열(전국값 미제공) · C-016 집중형 태양광 2025–2030 계획용량 상위 6곳(실적 아님) · D-023 기금별 개별 사업 수(금액 합산 안 함).

정적 지도: `public/data/vietnam/v2/home/transmission-preview-v139.svg`(107 KB) — geoBoundaries VNM ADM1 63개(단순화) + World Bank ENERGYDATA.INFO 2016 송전선 606구간 실제 경로. attribution은 자산 JSON과 화면 캡션에 있음. 선 교차를 접속으로 표현하지 않음.

## 3. 잔여 수용조건(§6) 처리

| 항목 | 처리 |
| --- | --- |
| C-019/C-022 34개 단위 | 분석·요약·범례는 '개편 후 성·시' 34개 기준(전국 요약 34/34). 표시 범위 문구를 '개편 후 성·시 단위 값 · 소속 63개 성·시 경계 중 63개에 대응 표시'로 바꿔 '63/63 값 있음'을 쓰지 않음. 같은 이름의 성·시는 '개편 후에도 유지'로 설명. 두 레이어 동시 표시 시 수치 합산 안 함(공유 등록부 안내 유지). 신규 경계 생성 없음 |
| B-025 | 패널 제목 '선택 유역'. 공간 정확도: 유역 대표점만 표시, HydroSHEDS 8대 유역 경계 폴리곤 미전달, 대표점 ≠ 유역 범위 (B-023/B-028도 관측지점·유역 대표점 구분 안내) |
| A-025 | 제목을 원천 비고의 `[시설명: …]`(예: Rang Dong 유전 CO2-EOR 파일럿, Ca Voi Xanh 가스전)으로, 구분·단계는 핵심정보로 유지 |
| D-018 | 승인액을 원천 표기(`7,000,000 USD`)대로 표시. '좌표 처리'를 '원천 좌표 2개 · 검증된 세부 활동지역 점 2개 표시'로 집계(범위 폴리곤의 0을 쓰지 않음). 사업분야는 각 행의 AF Sector(초국경 수자원 관리/도시개발/다부문)를 그대로 사용 |
| E-008 | 목록 '분야' 필터를 상단 집계와 같은 CTIS 분류(원천 부여 코드, 37개 옵션)로 연결. 공개 문구 정책이 코드를 지우기 전에 코드 목록을 별도 투영(`technologyCodes`) |
| C-022 상세 | '수집현황 v5.29 분류' 방법 메모 행 제외, 구분 'carbon market readiness'→'탄소시장 준비도', 근거문이 확인 결과와 같으면 반복 제거, '시범단계 2028' 연도 표기, '부문별 시설수 25/34/51'에 "원천 행에 부문명이 없어 값만 제공 · 같은 자료의 적용대상 근거문: 발전 34·철강 25·시멘트 51" 명시(숫자를 부문에 임의 배정하지 않음), 'MAE — MAE' 약어 재진술은 결과 칸 비움 |

미해결(그대로 남김): B-017 Aqueduct 평가구역 폴리곤(GDB, GDAL 없음), B-023/B-025/B-028 HydroSHEDS 유역 폴리곤 미전달. 43개 완료로 선언하지 않음.

## 4. 수행 명령

- `node scripts/v139/build-home-preview-v139.mjs` → `npm run build:home-preview:v139`(asset-integrity 515개 재생성)
- `npm run build` (Compiled successfully)
- `npm run qa:home:v139` → `reports/v139/home-runtime-qa-v139.json`, `reports/v139/screenshots/home/*.png`
- 홈 수정 중 실행한 최소 회귀: `audit:home:v128` PASS · `audit:routes:v128` PASS(A-002 CPIA→WGI 기대문구 갱신) · `audit:generated-data:v133` PASS · `audit:duplicate-copy:v136` PASS · `audit:public-copy:v134` PASS · `audit:public-screen:v135` PASS · `audit:screen-usability:v136-4` PASS · `audit:workflow:v136` PASS · `audit:glossary:v134` PASS(홈 약어 도움말 연결 후) · `audit:public-text:v136` PASS · `audit:human-review:v136` PASS
- 잔여 수용조건 후: `qa:map:v138`(42/42, 오류 0), `review:screens:v138`(152 ready, 내부 문구 0), `compare:downloads:v138`(20/20), `report:map-targets:v138`
- 최종 후보에서 전체 gate 1회: `npm run finalize:v136`(detached 실행, 제한시간·PID 확인 대기)

## 5. 미수행·유의

- `audit:public-screens:v128`(V128 레거시, v136 gate 밖)은 A-002 CPIA 제목 등 V128 기대값으로 FAIL — 상세 화면 구조가 V135/V136 감사로 대체된 뒤의 기존 상태이며 홈 변경과 무관. 갱신은 별도 범위.
- Linux Playwright E2E는 Preview에서 실행(로컬 Windows 기준선 불일치).
- 배포·보안·성능 v128 gate 미실행(범위 밖).

## 6. 다음 단계(승인 필요 항목 표시)

1. `feat/home-map-analysis-v139` push(비강제) → Vercel Preview 생성. **PR 생성·main 병합은 별도 승인 전 하지 않음.**
2. Preview에서 구현 SHA(`git rev-parse HEAD`)·`data/vietnam/v2/manifest.json`(`mapLayerCount` 42)·`home/home-preview-v139.json` 응답·Linux E2E 확인.
