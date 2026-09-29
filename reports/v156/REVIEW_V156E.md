# REVIEW V156-E — 2026년 제외 6건 · 기준서 v8/v11 유형 정합 · 미입고 '데이터 준비 중'

브랜치 `feat/v156-e-exclusions-lift` (origin/main 2f05bc5 = #41 병합 후). 2026-09-29.

## 1. 결정 흐름(같은 날)

1. 사용자 결정 — 제외 10건 전체 해제(공개 152) · 기준서 v8/v11 유형 정합.
2. 본부장 결정 — **2026년 제외 6건**(A-017·C-020·C-021·E-008·E-016·E-017), 용역사 기준서 v1.1과 동일. C-015·D-024는 공개 유지. 등급(V160) 작업 취소.
3. 제외 안내 카드 = 제목 + 공개 문구 1줄(기준서 v1.1 표 13).
4. 미입고 3개 카드·상세의 임시 문구 금지, 데이터 찾기에서 맨 뒤.

## 2. 변경 요약

| 영역 | 내용 |
|---|---|
| 결정 파일 | `exclusions` 6건(사유 "2026년 미적용 — 본부장 결정 2026-09-29", `publicNotice` "2026년 제공 대상이 아닌 데이터입니다."). 앞선 10건 해제 기록(`lifted[]`) 보존 |
| 데이터 | `refresh:data --adopt 5 --apply`(해제 때와 같은 인자)로 재생성 — 공개 146 · 다운로드 가능 143 · 카드 요약 146. 바뀐 것은 결정 필드·다운로드 허용·팩 해시뿐, 레코드 변화 0 |
| 유형(V159) | ⓪ 폐지 — 152개 U1~U6(U1 50·U2 28·U3 11·U4 17·U5 21·U6 25 / S1 61·S2 27·S3 17·S4 47 / 기술 옵션 84). 제외는 `statusNotice: excluded`, 미입고는 `data-pending`. 제외 6건의 유형·구조·계약·판단 포인트·전용 화면(E-016 핵심 수치, E-017 5개국 막대, E-008 건수 포인트, A-017 LCOE 범위) 코드는 공개 전환 때 쓰도록 유지 |
| 제외 안내 | 상세 직접 진입 = 제목 + 공개 문구 1줄. 결정 구분·사유·결정일 비표시(결정 파일·카탈로그에만 보존) |
| 미입고 3개 | 카드·상세 안내 '데이터 준비 중'. 제공기관 = 명세 v5.38 출처 값(없으면 줄 숨김), 자료기간·이용조건 줄 숨김, '미기재'·'제공기관 확인' 없음 |
| 데이터 찾기 | #41 코드 유지. '준비 중' 판정만 1줄 확장(`not-collected` + `data-entry-planned` + `schema-only`) → 미입고 3개 맨 뒤(144~146번째) |
| main 병합 | #39·#41 병합, 충돌 3건(차트 강조·상세 3층 출처 패널·찾기 카드 배지 문구) |

## 3. 화면이 바뀌는 페이지(현재 main 대비)와 확인 경로

| 페이지 | 확인 경로 | 전(main) → 후(PR) |
|---|---|---|
| 홈 | `/` → '데이터 현황' | 전체 데이터 항목 142 → **146**, 다운로드 가능 141 → **143** |
| 데이터 찾기 | 상단 '데이터 찾기'(`/#explorer`) | 142 → **146**개. 새로 보임 C-015·D-024·C-023·E-011·E-013, 빠짐 C-021 |
| 데이터 찾기 끝 | `/#explorer` 끝까지 스크롤 | 맨 뒤 C-021 1개 → **E-011·C-023·E-013** '데이터 준비 중'(제공기관만, 자료기간 줄 없음) |
| 제외 6개 상세 | `/?view=data&country=VNM&element=A-017#element-detail` (C-020·C-021·E-008·E-016·E-017 같은 형식) | 결정·사유·결정일 3줄 카드(C-021은 '미입고' 상태 안내) → **제목 + "2026년 제공 대상이 아닌 데이터입니다."** |
| C-015·D-024 상세 | `…element=C-015#element-detail`, `…element=D-024#element-detail` | 제외 카드 → 분석 화면(원문 링크 목록·라운드별 막대) + 다운로드 |
| 미입고 상세 | `…element=C-023#element-detail` (E-011·E-013 같음) | 제외 카드 → '데이터 준비 중' 안내 + 출처 줄(명세 출처 값) |
| 데이터 다운로드 | 상단 '데이터 다운로드' | 다운로드 가능 141 → 143(C-015·D-024 다운로드 허용 — 카탈로그·홈 현황 수치로 확인, 다운로드 화면 캡처는 없음) |
| 지도 | — | 화면 변화 0 |

## 4. 1440px 전후 캡처(`reports/v156/screens/pr/`)

- 홈 현황: `home-status-before-1440.png` → `home-status-after-1440.png`
- 데이터 찾기 첫 화면: `finder-top-before-1440.png` → `finder-top-after-1440.png`
- 데이터 찾기 끝: `finder-end-before-1440.png`(C-021 맨 뒤) → `finder-end-after-1440.png`(E-011·C-023·E-013)
- 제외 직접 진입: `detail-A-017-before-1440.png` → `detail-A-017-after-1440.png`, `detail-C-021-before-1440.png` → `detail-C-021-after-1440.png`
- 해제 유지: `detail-C-015-before-1440.png` → `detail-C-015-after-1440.png`
- 미입고: `detail-C-023-before-1440.png` → `detail-C-023-after-1440.png`, 카드 `finder-card-C-023-after-1440.png`
- 전 = origin/main(2f05bc5) production 빌드, 후 = PR 코드 production 빌드(Preview와 같은 커밋). Vercel Preview는 로그인 보호라 자동 캡처 불가 — 로컬 정적 서버 + Chromium으로 촬영.

## 5. 검증

| 단계 | 결과 |
|---|---|
| finalize:v151 1회차 | verify:dataset-directory 통과 → release:v136 FAIL — public-text:v136 `CONSOLE_ERROR` 1건(B-003·D-024 리소스 로드 `net::ERR_NO_BUFFER_SPACE`, 소켓 버퍼 고갈). release가 여기서 명령을 멈춰 finder-scroll·human-review 보고서가 갱신되지 않은 연쇄 5건 — `reports/v156/gate/finalize-v151-r1.log` |
| 실패 단계 1회 재실행(finalize:v136부터) | release:v136 **80/80** · role-split **53/53** · analysis QA 필수 **35·신규 0**(해소 6: A-017·A-023·C-002·C-012·C-019·E-016) · boundary-34 21(+1 skip) · boundary-policy **24/24** — `reports/v156/gate/finalize-v151-r2-from-release.log` |
| exclusions:v156 | 13/13(공개 146·제외 6·다운로드 143) |
| tsc · unit | 오류 0 · 587/587 |
| 생성물 검사 | spec·contract-typology(불일치 0, 공개 제외 6)·handoff·contract-docs·country-compare(58) 최신 |

## 6. 기대값·검사 변경(사유 기록 위치)

- `reports/v156/EXPECTATION_CHANGES_V156D.md` — 재제외 6건(공개 146), 제외 카드 형식과 공용 판정 교체(결정 3줄 표시 → 공개 문구 표시 + 결정 기록 비표시), analysis QA 제외 검사 5 → 6.
- `reports/v159/EXPECTATION_CHANGES_V159.md` — U0 폐지, statusNotice 판정 분리(미입고만 상태 안내), 계약 정합 규칙, E-017 계약, 국가 비교 기준국 제외, 미입고 출처 줄, E-008 결정일 대조.
- `reports/v160/EXPECTATION_CHANGES_V160.md` — 찾기 '준비 중' 판정 확장.

## 7. 미완료·확인 필요

- **main CI 빨강(이 PR 이전부터)**: `deployment:v128` `ROOT_RELATIVE_RUNTIME_ASSET_LITERAL`이 #33부터 `src/data/countryContext.ts`의 국가 경로 상수를 잡음. 이 PR 범위 밖.
- `check:spec:v159`는 이 브랜치에서 최신이지만, main 쪽에서 #38(BGD 레지스트리) 반영으로 유의점 치환 결과가 바뀔 수 있음 — 게이트 밖, 공개 문구 결정 필요.
- `scripts/v160/build-core-first-v160.mjs`(등급 폐기로 미사용)가 U0 기준으로 검사해 `check:core-first:v160`은 이 브랜치에서 실패. 게이트·CI 밖.
- 로컬 게이트의 `ERR_NO_BUFFER_SPACE`는 환경성 — 재발 시 public-text 감사에 요청 예산·재시도를 넣는 안(CLAUDE.md 속도 규칙)을 검토.
