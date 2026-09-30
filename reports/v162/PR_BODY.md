## 요약
상세 마무리(PR 2) — 사용자 지시 2026-09-30의 a–d를 한 PR로.
- **a. 1층 컨트롤 결함**: 1층 선택 상자가 접힌 2층만 바꾸던 29건(28개 요소)을 전수 점검·수정 → 0건
  - A-002: '기준연도'를 보조 분석 옆으로
  - 일반 '연도 선택'(A-019 등 24개): 추이 차트에 선택 연도 점선 표시
  - D-008: 선택 연도 막대 표시
  - B-021: 권역 비교를 선택기 위로
  - B-025: 면적 기준을 막대 옆으로
- **b. 지역명(P12-B, 카드·상세)**
  - 검토 대기 지명은 현지명만, 확정분만 '한글명 (현지명)'
  - ' · '·';' 목록은 나눠서 표기, 카드 6곳·상세 23곳 적용
  - 선택 값·키·다운로드는 원문 그대로
  - C-012 PPP 이중 괄호 수정
  - 지도 14곳은 별도(세션 2 P8과 같은 파일)
- **c. 미입고 3개**(C-023·E-011·E-013): 상태 칩·'자료 수집 상태' 제목·'자료가 아직 수집되지 않았습니다'·'다운로드 자료 없음' 제거 → '데이터 준비 중' 1줄 + 출처·간략 정의·데이터 설명
- **d. 자료기간 규칙(41개 전수)**: 원천 필드 판정으로 '자료기간'·'기준 시점'(수집 시점, 헤드라인 연도 제거)·'계획기간'
  - D-018: '기준 시점 2026-07 수집'
  - 판정 불가 3개(B-025·C-006·C-011)는 현행 유지

- **추가(#47 병합 후)**: 지도 목록 연도 꼬리표·정보 패널에 자료기간 규칙(수집 시점은 목록에 연도 없음, 패널 '기준 시점 2026-07 수집'), A-027 OSM 분류값 '협궤 철도 (narrow_gauge)'·B-026 붙은 지명 띄어쓰기, #47 스캔 예외 2건 삭제(findings 0·exceptions 0). main #47·#50 병합, 자료기간 계약은 베트남 한정, #50 벵골 문자 지명에도 검토 대기 규칙
상세: `reports/v162/REVIEW_V162.md`(전수 목록·분류표·검증), 기대값 변경 사유: `reports/v162/EXPECTATION_CHANGES_V162.md`

## Preview
PREVIEW_URL

## 화면이 바뀌는 페이지와 확인 경로
| 페이지 | 확인 경로 | 바뀌는 점 |
|---|---|---|
| 상세 A-002 | `/?view=data&country=VNM&element=A-002#element-detail` | 1층 위 선택기는 '표시 값'만. '기준연도'는 '차트 N개 더 보기' → 보조 분석 옆 |
| 상세 A-019(및 연도 선택 24개) | `…element=A-019…` → 1층 '연도' 선택 변경 | 추이 차트에 '선택 ○○○○년' 점선 |
| 상세 D-008 | `…element=D-008…` → '연도' 선택 | 해당 연도 막대에 '선택 ○○○○년' 표시 |
| 상세 B-021·B-025 | `…element=B-021…`, `…element=B-025…` | 첫 차트가 먼저, 선택기는 바꾸는 차트 옆 |
| 찾기·홈 카드 | `/#explorer` → B-031·E-005·C-022·C-016 카드 | 지역명 '한글명 (현지명)' |
| 상세 지역명 | `…element=B-031…`, `B-003`, `C-019`, `B-026`, `C-012` | 성·시·도시 이름 '한글명 (현지명)', C-012 이중 괄호 해소 |
| 상세 미입고 | `…element=C-023…`, `E-011`, `E-013` | 제목 아래 '데이터 준비 중' 1줄만 |
| 찾기 카드·상세 출처 줄 | `/#explorer` → E-001·D-018·D-014·C-003 카드, 각 상세 '자료 출처·상세 데이터' | '기준 시점 2026-08-14 수집'·'2026-07 수집', D-014 '자료기간 2010–2023년', C-003 '계획기간' |
| 지도 목록·정보 패널 | `/?country=VNM#map` → '모두 펼치기' → 적응기금 사업(D-018)·E-001 행의 i | 목록에 연도 없음, 패널 '기준 시점 2026-07 수집'·'집계 기준 승인일 기준' |
| 상세 A-027·B-026 | `…element=A-027…` → '차트 더 보기' 분류별 막대, `…element=B-026…` | '협궤 철도 (narrow_gauge)' 등, '끼엔장 (Kiên Giang)' |

## 1440px 캡처(전: 운영 main / 후: 이 브랜치 production 빌드)
| 대상 | 전 | 후 |
|---|---|---|
| A-002 1층(표시 값만 추이 위, 기준연도는 보조 분석 옆) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-A-002-layer1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-A-002-layer1.png) |
| A-019 1층 추이 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-A-019-layer1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-A-019-layer1.png) |
| A-019 연도 선택 변경 → 추이에 선택 연도 표시 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-A-019-year-changed.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-A-019-year-changed.png) |
| B-021 1층(권역 비교가 먼저) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-B-021-layer1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-B-021-layer1.png) |
| B-025 1층(쌍 막대, 면적 기준은 아래 막대 옆) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-B-025-layer1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-B-025-layer1.png) |
| D-008 1층(선택 연도 막대 표시) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-a-D-008-layer1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-a-D-008-layer1.png) |
| B-031 상세(성·시 비교) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-b-B-031-detail.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-b-B-031-detail.png) |
| C-012 상세(PPP 표 이중 괄호) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-b-C-012-detail.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-b-C-012-detail.png) |
| C-023 상세 상단(데이터 준비 중 1줄) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-c-C-023-top.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-c-C-023-top.png) |
| E-011 상세 상단 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-c-E-011-top.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-c-E-011-top.png) |
| 찾기 카드 B-031(성 이름) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-B-031.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-B-031.png) |
| 찾기 카드 C-003(계획기간) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-C-003.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-C-003.png) |
| 찾기 카드 C-022(34 단위) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-C-022.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-C-022.png) |
| 찾기 카드 D-014(자료기간 정정) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-D-014.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-D-014.png) |
| 찾기 카드 D-018(기준 시점) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-D-018.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-D-018.png) |
| 찾기 카드 E-001(기준 시점) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-E-001.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-E-001.png) |
| 찾기 카드 E-005(도시) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-card-E-005.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-card-E-005.png) |
| C-003 출처 줄 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-d-C-003-source.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-d-C-003-source.png) |
| D-014 출처 줄 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-d-D-014-source.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-d-D-014-source.png) |
| D-018 출처 줄 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-d-D-018-source.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-d-D-018-source.png) |
| E-001 출처 줄 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-d-E-001-source.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-d-E-001-source.png) |
| 지도 목록 D-018 행·정보 패널 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-map-D-018-row-info.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-map-D-018-row-info.png) |
| 지도 목록 E-001 행·정보 패널 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-map-E-001-row-info.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-map-E-001-row-info.png) |
| A-027 상세(OSM 분류 한글 라벨) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-e-A-027.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-e-A-027.png) |
| B-026 상세(지역명) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/before-e-B-026.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/fix/v162-detail-finish/reports/v162/screens/after-e-B-026.png) |

## 검증
| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 614/614 |
| 1층 컨트롤 전수 점검(146) | 수정 전 29건(28개 요소) → 수정 후 0건, 실행 오류 0 (`reports/v162/layer-controls-audit-v162*.md`) |
| e2e detail-all(146 + 제외 6) | 152/152 (A-002·A-019 포함). 수정 전 main은 A-002·A-019 실패 |
| production 빌드(CI=true, 경고=오류) | 성공 |
| finalize:v151(1차) | 실패 — public-copy:v134가 미입고 3개의 '자료 수집 상태' 제목을 기대(c로 제거). 릴리스 감사는 첫 실패에서 멈춰 이후 단계 미실행 |
| 이후 단계 개별 실행 | 20개 중 19 PASS, detail-hierarchy:v135만 같은 원인 → 기대값 변경(사유 `EXPECTATION_CHANGES_V162.md`) |
| finalize:v151(2차, 마지막) | **PASS** — release:v136 80/80, role-split 53/53, analysis QA 필수 35(기준선 41 이내)·신규 0, boundary-34 21 통과·1 건너뜀, boundary-policy 24/24 |
| 게이트 반복 | 2회(규칙 한도 이내) |
| **추가 범위 후(main #47·#50 병합)** | |
| test:unit | 739/739(main의 새 테스트 포함) |
| 공개 문구 스캔(#47, 예외 0) | findings 0 · exceptions 0 · 검사 797 · 목록 72행 · 활성 60 |
| e2e 전체(214) | 213 통과 · 1 실패 = visual `detail-a016`: main에서도 같은 차이(48,873픽셀) — 기준 이미지 노후, 이 PR 무관 |
| production 빌드(CI=true) | 성공 |
| finalize:v151(병합 후 1회) | **PASS** — release:v136 80/80, role-split 53/53, analysis QA 필수 34(기준선 41 이내)·신규 0, boundary-34 21 통과·1 건너뜀, boundary-policy 25/25 |

병합은 Preview 검토 후 "PR #N 병합" 지시가 있을 때만.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
