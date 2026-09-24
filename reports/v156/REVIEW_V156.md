# REVIEW — V156 베트남 데이터 2026-09-22 입고분 부분 갱신

## 1. 한 줄 요약

2026-09-22 입고분(워크북 146개·코드 145개 + B-012 geojson)은 값 갱신이 아니라 상당 부분 **구조 재설계**였다. 게이트로 하나씩 확인한 끝에 현행 화면·계약·용량 한도가 그대로 읽을 수 있는 **5개 요소만 적용**하고, 나머지 **140개는 이전 입고분 값을 유지(보류)** 했다. 값 조작·기대값 변경은 한 건도 하지 않았고, 갱신 절차는 1명령 런북으로 고정했다.

## 2. 사용자 결정(2026-09-23~24)

| 질문 | 결정 |
|---|---|
| E-008 워크북에 API 키 포함 | 스테이징 사본에서 키만 제거(입고 원문 불변) |
| 구조가 바뀐 요소 | 호환 요소만 부분 적용, 구조 변경분 보류 |
| ETL이 막은 coverage drop 8건 | 8건도 보류 |
| 보류를 계속 늘리는 방식 vs 범위 재정의 | **값만 바뀐 요소만 적용**(`--adopt` 허용목록으로 전환) |
| D(제외 6건 화면 반영) | 후속 PR |
| 제목 전파 | A-002만 이번에 반영 |

## 3. 적용 범위와 데이터 변화

적용 5개(`--adopt A-002,B-015,B-022,E-001,E-010`). 요소 152개 중 **변화 5 / 변화 없음 147**, 지표 추가·삭제 0, 스키마 영향 0, 관측 +394 / −363.

| 요소 | 관측 | 엔티티 | 최신연도 | 결측률 |
|---|---|---|---|---|
| A-002 거버넌스(WGI) | 312→348 | — | 2024 | 0→10.3% |
| B-015 탄소 가격 | 15→12 | — | 2026 | 13.3→16.7% |
| B-022 기후 피해 비용 | 11→8 | — | 2050 | 0→0% |
| E-001 CTCN NDE | — | 15→18 | — | — |
| E-010 R&D·혁신지수 | 30→31 | — | 2025 | 0→0% |

- A-002는 CPIA → **WGI**로 교체(§5).

## 4. 왜 6개인가 — 라운드별로 게이트가 잡은 것

보류 결정은 추정이 아니라 매 라운드 게이트·감사·테스트가 낸 실패에서 나왔다.

| 라운드 | 막힌 지점 | 조치 |
|---|---|---|
| 1 | ETL `credential material was detected` | E-008 메타시트의 `api_key` 제거(스테이징 사본) |
| 2 | `build_spatial_v124` `duplicate spatial values`(B-033) | 관측행 0 + 성×연도 개체 4,765건, 임계 8종·원인 8종·행정단위 혼재 → 구조 변경 15개 보류 |
| 3 | ETL `D-018: the two reviewed activity sites are no longer in the source` | 보류분 carry-over 기준을 V124 ZIP → **현행 트리를 만든 입고분**으로 변경 |
| 4 | ETL `promotionBlocked` `MATERIAL_COVERAGE_DROP` 8건 | B-043·C-002·C-004·C-008·C-009·C-010·C-014·C-018 보류 |
| 5 | `build_semantic_v125` `Unrecognized E-012 indicator id: …_craft_total_nat` | E-012 보류(지표 ID에 `_nat` 접미, 90→229개) |
| 6 | `dataset-directory-v150-1` EISDIR · `find public -size +100M` 3건 | B-004(153 MB)·B-006(142)·B-007(142) 보류. ETL이 `external-object-storage`로 바꿔 `url`이 없어진 것이 원인 |
| 7 | `mapPresentationV148.test.ts` 5건 · 기준선 테스트 7건 | 지도 선언 변수 소실 C-012·C-013·C-019·C-022·C-024, 검토 기준선 불일치 A-026·B-023·B-028·B-046·B-047·C-011·E-018 보류 |
| 8 | `audit:project-scope:v130` C-025 공개명칭 1,118건 노출·분류 465/1,267 | C-025 보류 |
| 9 | `audit:temporal-depth:v135` B-045 | 새 데이터로 생성된 `maxComparableYearCount`가 1인데 화면 판정은 `time-series`(2019–2024 6개 연도, 46지표 간 비교가능 연도 1) → B-045 보류 |
| 10 | `audit:boundary-34:v151` `MANIFEST_ENTRY` null | 반영 스크립트가 `geometry/geometry-manifest.json`을 통째로 덮어 자산 16→4로 줄었다(파일은 보존됐지만 등록이 사라짐). **kind 기준 병합**으로 수정 후 16개 복구 |
| 11 | `audit:glossary:v134` 93건 — 대부분 `VNM-C003-MEI-I-1.1`·`VNM-BAR-2005-214`·`VNM-C006-JCM-VN005` 같은 **내부 레코드 키 노출** | 방식 전환: 보류를 더 늘리는 대신 **값만 바뀐 요소만 적용**. B-009는 새 문구 `WWF BRF`의 BRF가 용어집·허용목록에 없어 함께 보류 |

### 제공자 회신이 필요한 항목

- **A-023 발전소**: 개체 1,963→236(WRI GPPD 베트남 행 수와 일치)이고 속성 열이 `속성1(A-013:SDG세부목표코…)`·`속성3(A-024:선로상태…)` 등 **다른 요소 템플릿 헤더**로 채워져 발전원·설비용량·소유·운영·가동연도·소재지를 담지 못한다.
- **B-031~B-034 산림**: 관측행이 사라지고 수관밀도 임계·손실원인·행정단위가 한 시트에 섞여 (지역,연도,임계,원인) 4중키로도 중복 1,189건. 임계·원인 선택 규칙이나 합산은 데이터 결정이라 만들지 않았다.
- **C-003·C-005·C-006·C-007·C-015·C-017·E-002·E-007·A-025·A-029·E-009**: 공개 명칭 자리에 내부 레코드 키가 들어온다(합계 93개 토큰).
- **C-025**: `standard·status·methodology·proponent·projectId` 속성과 프로젝트명 지표가 사라져 공개 명칭을 만들 수 없다.
- **B-008**: 전망이 개체 시트 속성(시나리오·신뢰수준·PSMSL 관측소, 2050/2100)으로 이동했다. 사라진 것은 아니다.
- **E-008**: 메타시트에 API 키가 있었다(`reports/v156/source-credential-findings-v156.md`). 폐기·재발급 필요.

보류 140개의 코드별 사유는 `reports/v156/hold-list-v156.json`, 구조 스캔은 `reports/v156/source-structure-v156.json`.

## 5. 새로 만든 도구(런북)

`npm run refresh:data -- --source 베트남데이터/<YYYYMMDD> [--apply]` — 폴더명만 바꾸면 재실행된다. 문서는 `docs/DATA_REFRESH_RUNBOOK_V156.md`.

| 단계 | 스크립트 | 무엇을 막는가 |
|---|---|---|
| stage | `scripts/v156/stage-source-v156.mjs` | `~$` 잠금·`._DAV`가 워크북으로 읽히는 것, 중복 코드 임의 채택(`_수정안`만 자동), 보류분이 오래된 ZIP으로 후퇴하는 것. `--adopt`/`--hold` 두 방향 지원 |
| redact | `tools/vietnam_etl/redact_source_credentials_v156.py` | 입고분에 적힌 자격증명이 트리로 흘러드는 것(값 대신 해시·길이만 기록) |
| structure | `scripts/v156/source-structure-v156.py` | 빌드가 실패해 "무엇이 바뀌었나"를 답하지 못하는 상황 |
| build | `scripts/v137/build-final-data-v137.mjs` | 체인 순서 어긋남 |
| diff | `scripts/v156/source-diff-v156.mjs` | 값·지표·단위·최신연도·결측률 변화를 모르고 반영하는 것 |
| apply | `scripts/v156/apply-staged-data-v156.mjs` | mirror 반영이 체인 밖 자산 19개(`geometry/**` 12·`spatial/**` 5·`dataset-directory.json`·`home/card-summaries-v140.json`)를 삭제하는 것, 그리고 `geometry/geometry-manifest.json`을 덮어 V151/V155 자산 등록 13건을 잃는 것(kind 기준 병합) |

- `VIETNAM_STAGING_ROOT`는 `.staging/` 하위만 허용된다(계획서의 `tmp/v156-staging`은 빌더가 거부).
- `VIETNAM_EXPECTED_WORKBOOKS=149`는 carry-over 병합 **후**의 수다. 채택 5 + 보류 140(이전 입고분) + ZIP carry-over 2(E-016·E-017) + 원천 없음 3(C-020·C-021·C-023) = 149.
- A-002 제목: 워크북 `2_meta_info`가 source_org=World Bank·지표 `A-002_wgi_*`(GOV_WGI_*)·1996–2024를 명시하므로 V1 카탈로그 라벨·`vietnamDatasetsV121` 제목·추적표를 WGI로 교체했다. 상세 렌더러는 V137에서 이미 WGI 12지표를 읽는다. URL 슬러그는 링크 안정성을 위해 유지.
- `audit:entity-cards:v131`에 "표시 레코드 수 = 카탈로그 entityCount" 대조를 추가했다(E-006 15 = 15).

### 알려진 한계

- 런북의 diff 단계는 `public/data/vietnam/v2` ↔ 스테이징을 비교한다. 같은 라운드에서 두 번째로 `--apply`를 돌리면 이미 반영된 트리와 비교하므로 차이가 거의 없게 나온다. 라운드 전체 변화를 보려면 `--current`에 직전 커밋 트리를 지정해야 한다(이 REVIEW의 수치는 그렇게 산출).

## 6. 검증 결과

| 명령 | 결과 |
|---|---|
| ETL 스테이징 | `promotionBlocked: false` · blocker 0 · `rowBalance.matches: true` |
| `build-final-data-v137` 체인 | 7단계 전부 ok |
| `apply-staged-data-v156 --apply` | 보존 19 · 낡은 샤드 정리 · 설명 없는 잔여 0 |
| `audit:generated-data:v133` | 15/15 PASS |
| `audit:glossary:v134` | 16/16 PASS |
| `audit:project-scope:v130` | 15/15 PASS |
| `audit:entity-cards:v131` | 17/17 PASS |
| `npx tsc --noEmit` | 0건 |
| `npm run test:unit` | 299/299 PASS |
| `find public -type f -size +100M` | 0건 |
| `npm run finalize:v151` | §7 |

## 7. finalize:v151 — 통과

| 단계 | 결과 |
|---|---|
| `release:v136` | **79/79 PASS** |
| `qa:role-split:v140` | 52/52 PASS |
| `qa:analysis:v140:baseline` | 필수 실패 39 = 기준선 이내 · 신규 0 · 해소 2(A-023·C-012) → pass |
| `audit:boundary-34:v151 --skip-browser` | 21 PASS (브라우저 1건 skip) |
| `audit:boundary-policy:v151-2` | 24/24 PASS |

## 8. 미완료와 사유

| 항목 | 사유 |
|---|---|
| 입고분 140개 요소 반영 | 위 사유별 분류대로 (1) 제공자 회신 (2) 계약·렌더러 확장(E-012 `_nat`, B-008 속성 전망, A-028·B-005·E-008 추가분) (3) 용량 정책(B-004·B-006·B-007) (4) 내용 재검토 후 기준선 갱신이 선행돼야 한다 |
| D. 제외 6건(C-020·C-023·E-011·E-013·E-016·E-017) 화면 반영 | 후속 PR. `publicStatus: "excluded"` 도입과 함께 `release:v136`의 152 기준 기대값(FRAMEWORK/ACCOUNTED/DETAIL_HUMAN_REVIEW/FINDER_AUTO_LOAD_SEQUENCE/PUBLIC_ROUTE_COUNT)을 한 번에 바꿔야 한다 |
| 제목 후보 6건(C-015·E-015·B-014·B-022·B-018·D-009) | 워크북 시트의 제목·출처 행 근거 검토 후 반영 |
| BRF(WWF) 용어 등록 | 원문 확인 후 등록하고 B-009를 채택한다 |
| B-045 | 새 데이터는 2019–2024 6개 연도로 더 풍부하지만 시간 계약 생성 규칙과 화면 판정이 어긋난다. 규칙을 맞춘 뒤 채택한다 |
| 전용 렌더러 스크린샷·A-023 카드 5표본 대조 | 대상 요소가 모두 보류라 비교 대상이 없다 |
