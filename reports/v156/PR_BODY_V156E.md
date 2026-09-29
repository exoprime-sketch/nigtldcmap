## 요약
- 본부장 결정(2026-09-29): **2026년 제외 6건**(A-017·C-020·C-021·E-008·E-016·E-017, 용역사 기준서 v1.1과 동일) → 공개 **146**. C-015·D-024는 공개 유지
- 제외 안내 = **제목 + 공개 문구 1줄** "2026년 제공 대상이 아닌 데이터입니다."(기준서 v1.1 표 13). 결정 구분·사유·결정일은 화면 비표시(결정 파일·카탈로그에만 보존)
- 기준서 v8/v11 유형 정합: ⓪ 폐지, 152개 U1~U6. 제외 6건의 유형·구조·계약·판단 포인트·전용 화면 코드는 공개 전환 때 쓰도록 유지
- 미입고 3개(C-023·E-011·E-013): 카드·상세 '데이터 준비 중', 임시 문구('미기재'·'제공기관 확인') 없음, 데이터 찾기 **맨 뒤**
- 데이터 찾기는 #41 코드 그대로 — '준비 중' 판정 1줄만 확장(입력 예정·양식만 포함)

## Preview
https://nigtldcmap-qrr5r611b-exoprime-5142s-projects.vercel.app
- 784fb3e 빌드(앱 코드 마지막 변경 91628d8 이후 커밋은 reports만). 이후 문서 커밋은 Vercel Ignored Build Step으로 건너뛸 수 있음 — 위 Preview가 현재 앱과 같음

## 화면이 바뀌는 페이지와 확인 경로(현재 main 대비)
| 페이지 | 확인 경로 | 바뀌는 점 |
|---|---|---|
| 홈 | `/` → '데이터 현황' | 전체 데이터 항목 142 → 146, 다운로드 가능 141 → 143 |
| 데이터 찾기 | 상단 '데이터 찾기' (`/#explorer`) | 142 → 146개. 새로 보임 C-015·D-024·C-023·E-011·E-013, 빠짐 C-021 |
| 데이터 찾기 끝 | `/#explorer` 끝까지 스크롤 | 맨 뒤 C-021 → E-011·C-023·E-013 '데이터 준비 중'(제공기관만) |
| 제외 6개 직접 진입 | `/?view=data&country=VNM&element=A-017#element-detail` (C-020·C-021·E-008·E-016·E-017 동일) | 결정·사유·결정일 카드 → 제목 + 공개 문구 1줄 |
| C-015·D-024 상세 | `/?view=data&country=VNM&element=C-015#element-detail` · `…=D-024…` | 제외 카드 → 분석 화면 + 다운로드 |
| 미입고 상세 | `/?view=data&country=VNM&element=C-023#element-detail` (E-011·E-013 동일) | 제외 카드 → '데이터 준비 중' + 출처(명세 출처 값) |
| 지도 | — | 화면 변화 0 |

## 1440px 전후(전 = main 2f05bc5 빌드, 후 = PR 빌드)
- 데이터 찾기 끝: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/finder-end-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/finder-end-after-1440.png)
- 데이터 찾기 첫 화면: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/finder-top-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/finder-top-after-1440.png)
- 홈 현황: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/home-status-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/home-status-after-1440.png)
- 제외 직접 진입 A-017: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-A-017-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-A-017-after-1440.png) · C-021: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-021-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-021-after-1440.png)
- 해제 유지 C-015: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-015-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-015-after-1440.png)
- 미입고 C-023: [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-023-before-1440.png) → [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/detail-C-023-after-1440.png) · [카드(후)](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v156-e-exclusions-lift/reports/v156/screens/pr/finder-card-C-023-after-1440.png)
- Preview는 Vercel 로그인 보호라 자동 캡처 불가 — 같은 커밋을 production 형식으로 빌드해 로컬 Chromium으로 촬영

## 검증
| 단계 | 결과 |
|---|---|
| finalize:v151 1회차 | release:v136 FAIL — public-text `CONSOLE_ERROR` 1건(B-003·D-024 `net::ERR_NO_BUFFER_SPACE`, 환경성) + 이 때문에 갱신되지 않은 보고서를 읽은 연쇄 5건 |
| 실패 단계 1회 재실행(finalize:v136부터) | release:v136 **80/80** · role-split **53/53** · analysis QA 필수 **35·신규 0**(해소 6) · boundary-34 21(+1 skip) · boundary-policy **24/24** |
| exclusions:v156 | 13/13(공개 146 · 제외 6 · 다운로드 143) |
| tsc · unit | 오류 0 · 587/587 |

- 게이트 로그: `reports/v156/gate/` · 상세: `reports/v156/REVIEW_V156E.md`
- 기대값 사유: `reports/v156/EXPECTATION_CHANGES_V156D.md` · `reports/v159/EXPECTATION_CHANGES_V159.md` · `reports/v160/EXPECTATION_CHANGES_V160.md`

## 이 PR 밖(확인 필요)
- main CI 빨강: `deployment:v128` `ROOT_RELATIVE_RUNTIME_ASSET_LITERAL`(#33부터, `countryContext.ts` 경로 상수)
- `check:core-first:v160`(등급 폐기로 미사용 스크립트)이 U0 기준이라 이 브랜치에서 실패 — 게이트·CI 밖

병합은 Preview 검토 후 "PR #N 병합" 지시가 있을 때만.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01MaXayESVY9FC2SF3JH12pW
