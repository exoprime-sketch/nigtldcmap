# data(v156): 2026-09-22 입고분 — 값만 바뀐 5개 요소 적용 · 갱신 런북 · A-002 WGI

## 결론 먼저

2026-09-22 입고분은 값 갱신이 아니라 상당 부분 **구조 재설계**였다. 게이트로 요소별로 확인해 **5개만 적용**하고 **140개는 이전 입고분 값을 유지(보류)** 했다. 게이트·감사·테스트 기대값은 한 건도 바꾸지 않았고, 값 보정·0 채움·좌표 추정·출처 간 합산도 없다.

## 적용(5개)

| 요소 | 관측 | 엔티티 | 최신연도 | 결측률 |
|---|---|---|---|---|
| A-002 거버넌스(CPIA→**WGI**) | 312→348 | — | 2024 | 0→10.3% |
| B-015 탄소 가격 | 15→12 | — | 2026 | 13.3→16.7% |
| B-022 기후 피해 비용 | 11→8 | — | 2050 | 0→0% |
| E-001 CTCN NDE | — | 15→18 | — | — |
| E-010 R&D·혁신지수 | 30→31 | — | 2025 | 0→0% |

요소 152개 중 변화 5 / 변화 없음 147. 지표 추가·삭제 0, 스키마 영향 0, 관측 +394 / −363.

## 왜 140개를 보류했는가

라운드마다 게이트가 낸 실패가 근거다. 상세는 `reports/v156/REVIEW_V156.md` §4, 코드별 사유는 `reports/v156/hold-list-v156.json`.

- ETL 자격증명 가드(E-008 메타시트의 `api_key`) → 스테이징 사본에서 값만 제거
- `build_spatial_v124` `duplicate spatial values`(B-033: 관측행 0 + 개체 4,765건, 임계 8종·원인 8종 혼재 → 4중키 중복 1,189건)
- ETL `MATERIAL_COVERAGE_DROP` 8건(C-009 182→19 등)
- `build_semantic_v125`가 해독 못 하는 E-012 지표 ID(`_nat` 접미, 90→229개)
- GitHub 파일당 100 MB 한도 초과(B-004 153 MB·B-006 142·B-007 142)
- 지도 선언 변수 소실 5개(C-012·C-013·C-019·C-022·C-024, `mapPresentationV148` 실패)
- `audit:project-scope:v130` C-025 공개명칭 1,118건 노출·분류 465/1,267
- `audit:glossary:v134` 93개 토큰 — 대부분 `VNM-C003-MEI-I-1.1`·`VNM-BAR-2005-214` 같은 **내부 레코드 키 노출**
- 검토 내용을 고정한 단위 테스트와 불일치 7개(A-026·B-023·B-028·B-046·B-047·C-011·E-018)
- `audit:temporal-depth:v135` B-045(생성된 비교가능 연도 1 vs 화면 time-series)
- 새 문구 `WWF BRF`의 BRF가 용어집·허용목록에 없음(B-009)

9라운드 동안 실패마다 보류를 늘리다가, 남은 실패가 데이터의 공개 명칭 부재에서 오는 것이 확인돼 **"가져올 것만 적는"** `--adopt` 방식으로 전환했다.

## 제공자 회신이 필요한 항목

- **A-023 발전소**: 개체 1,963→236이고 속성 열이 `속성1(A-013:SDG세부목표코…)`·`속성3(A-024:선로상태…)` 등 다른 요소 템플릿 헤더로 채워져 발전원·설비용량·소유·운영·가동연도·소재지를 담지 못한다
- **B-031~B-034 산림**: 임계·원인·행정단위가 한 시트에 섞여 유일키가 없다
- **C-003·C-005·C-006·C-007·C-015·C-017·E-002·E-007·A-025·A-029·E-009·C-025**: 공개 명칭 자리에 내부 레코드 키
- **E-008**: 메타시트에 API 키(값은 어디에도 기록하지 않음, 폐기·재발급 권고)

## 새로 만든 것

- **런북 1명령**: `npm run refresh:data -- --source 베트남데이터/<YYYYMMDD> [--apply]` (`docs/DATA_REFRESH_RUNBOOK_V156.md`). stage → redact → structure → build → diff, `--apply` 시 apply → dataset-directory → card-summaries → asset-integrity. 폴더명만 바꾸면 차기 입고분·다른 국가에 재사용된다
- `scripts/v156/`: 스테이징(`--adopt`/`--hold`, 잠금·`._DAV` 제외, `_수정안` 채택), 구조 스캔, 값 diff, 반영(체인 밖 자산 19개 보존 — 기존 promote는 mirror라 `geometry/**`·`spatial/**`를 지운다)
- `tools/vietnam_etl/redact_source_credentials_v156.py`: 탐지 패턴을 `normalization`과 공유, 값 대신 해시·길이만 기록
- 반영 스크립트 수정: `geometry/geometry-manifest.json`은 ETL(3개 자산)과 V151/V155 빌더(13개)가 함께 쓰는 파일이라 **kind 기준 병합**한다. 통째로 덮으면 .geojson은 남아도 등록이 사라져 `boundary-34:v151`이 깨진다(실제로 발생 → 수정)
- `audit:entity-cards:v131`에 "표시 레코드 수 = 카탈로그 entityCount" 대조 추가(E-006 15 = 15)
- A-002 제목 전파(V1 카탈로그·데이터셋 제목·추적표). 상세 렌더러는 V137에서 이미 WGI 12지표를 읽으므로 화면 변경 없음

## 검증

| 명령 | 결과 |
|---|---|
| ETL 스테이징 | `promotionBlocked: false` · blocker 0 · `rowBalance.matches: true` |
| `build-final-data-v137` 체인 | 7단계 전부 ok |
| `audit:generated-data:v133` | 15/15 PASS |
| `audit:glossary:v134` | 16/16 PASS |
| `audit:project-scope:v130` | 15/15 PASS |
| `audit:entity-cards:v131` | 17/17 PASS |
| `npx tsc --noEmit` | 0건 |
| `npm run test:unit` | 299/299 PASS |
| `find public -type f -size +100M` | 0건 |
| `npm run finalize:v151` | **통과** — release 79/79 · role-split 52/52 · analysis QA(필수 39·신규 0·해소 2) · boundary-34 21 · boundary-policy 24/24 |

## 남은 일

- 제외 6건(C-020·C-023·E-011·E-013·E-016·E-017) 화면 반영은 후속 PR(`publicStatus: "excluded"` 도입 + `release:v136`의 152 기준 기대값 일괄 변경)
- 보류 140개는 제공자 회신·계약 확장·용량 정책·기준선 재검토가 선행돼야 한다
- BRF(WWF) 용어 등록 후 B-009 채택, B-045는 시간 계약 규칙 정합 후 채택, 제목 후보 6건은 시트 근거 검토 후 반영

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01EynHh9yW3opy5z8q6HMtuY
