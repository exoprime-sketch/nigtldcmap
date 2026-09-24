# data(v156): 베트남 데이터 2026-09-22 입고분 부분 갱신 · 갱신 런북 · A-002 WGI 전파

## 무엇을 했는가

- 2026-09-22 입고분(워크북 146 + B-012 geojson, 코드 145개)에서 **현행 화면·계약·용량 한도가 그대로 읽는 106개 요소만 갱신**했다. 나머지 **39개는 이전 입고분 값을 유지(보류)** 하고 코드별 사유를 남겼다.
- 갱신 절차를 1명령으로 고정했다: `npm run refresh:data -- --source 베트남데이터/<YYYYMMDD> [--apply]`. 폴더명만 바꾸면 차기 입고분·다른 국가에 재사용된다. 이 PR의 마지막 갱신을 이 명령으로 실행해 런북 자체를 검증했다.
- A-002를 CPIA → **WGI(Worldwide Governance Indicators)** 로 전파했다(워크북 `2_meta_info`의 source_org·지표 ID 근거).
- E-006 목록 렌더러 검사에 "표시 레코드 수 = 카탈로그 entityCount" 대조를 추가했다(컨테이너 존재만으로 통과 금지).

## 데이터 변화

- 요소 152개 중 변화 45 / 변화 없음 107. 지표 +66 / −68, 관측 +1,275 / −865
- 증가: B-003 엔티티 8,371→12,621 · B-017 2,032→4,867 · C-025 388→1,190 · C-005 135→408 · C-003 96→253 · B-045 관측 46→224 · B-038 190→399 · A-030 16→148
- 감소: B-009 관측 435→255(지표 변화 없음). C-003·C-005·C-025는 원천별 세분 지표 ID가 통합 ID로 재편
- 값 보정·0 채움·좌표 추정·출처 간 합산은 없다. 게이트·감사·테스트 기대값은 **한 건도 바꾸지 않았다**

## 보류 39개(사유별)

| 사유 | 개수 | 요소 |
|---|---|---|
| 구조·그레인 변경 | 15 | A-013·A-023·A-028·B-002·B-005·B-024·B-031~B-036·C-016·D-018·E-008 |
| 공개 행 절반 미만 감소(ETL `MATERIAL_COVERAGE_DROP`) | 8 | B-043·C-002·C-004·C-008·C-009·C-010·C-014·C-018 |
| 지표 ID 체계 변경(`_nat` 접미) | 1 | E-012 |
| 파일 100 MB 한도 초과 | 3 | B-004(153 MB)·B-006(142)·B-007(142) |
| 지도 선언 변수 소실 | 5 | C-012·C-013·C-019·C-022·C-024 |
| 검토 기준선 테스트 불일치 | 7 | A-026·B-023·B-028·B-046·B-047·C-011·E-018 |

대표 근거는 `reports/v156/REVIEW_V156.md` §4, 기계 판독용 정본은 `reports/v156/hold-list-v156.json`.

보류는 값을 만들지 않고 이전 입고분을 유지하는 선택이다. 보류 요소는 **현재 공개 트리를 만든 입고분 파일**로 스테이징한다 — ETL 자체 fallback은 더 오래된 V124 ZIP을 읽어 D-018의 검토 사이트 2건을 잃고 빌드가 실패했다.

## 제공자 회신이 필요한 항목

- **A-023 발전소**: 개체 1,963→236이고 속성 열이 `속성1(A-013:SDG세부목표코…)`·`속성3(A-024:선로상태…)` 등 다른 요소 템플릿 헤더로 채워져 발전원·설비용량·소유·운영·가동연도·소재지를 담지 못한다
- **B-031~B-034 산림**: 관측행이 사라지고 수관밀도 임계 8종·손실원인 8종·행정단위 혼재로 그레인이 늘어 (지역,연도,임계,원인) 4중키로도 중복 1,189건
- **E-008 논문·특허**: 메타시트에 API 키가 포함돼 있었다(값은 어디에도 기록하지 않음, 폐기·재발급 권고 — `reports/v156/source-credential-findings-v156.md`)

## 검증

| 명령 | 결과 |
|---|---|
| ETL 스테이징 | `promotionBlocked: false` · blocker 0 · `rowBalance.matches: true` |
| `build-final-data-v137` 체인 | etl·semantic·interpretation·temporal·map-targets·home-preview·asset-integrity 전 단계 ok |
| `apply-staged-data-v156 --apply` | 보존 19(geometry 12·spatial 5·dataset-directory·card-summaries) · 낡은 packs 샤드 정리 · 설명 없는 잔여 0 |
| `audit:generated-data:v133` | 15/15 PASS |
| `audit:entity-cards:v131` | 17/17 PASS (E-006 레코드 수 15 = entityCount 15) |
| `npx tsc --noEmit` | 0건 |
| `npm run test:unit` | 299/299 PASS |
| `find public -type f -size +100M` | 0건 |
| `npm run finalize:v151` | 아래 게이트 결과 참조 |

## 남은 일

- 제외 6건(C-020·C-023·E-011·E-013·E-016·E-017) 화면 반영은 후속 PR. `publicStatus: "excluded"` 도입과 함께 `release:v136`의 152 기준 기대값(FRAMEWORK/ACCOUNTED/DETAIL_HUMAN_REVIEW/FINDER_AUTO_LOAD_SEQUENCE/PUBLIC_ROUTE_COUNT)을 한 번에 바꿔야 한다
- 보류 39개는 (1) 제공자 회신 (2) 계약·렌더러 확장(E-012 `_nat`, B-008 속성 전망, A-028·B-005·E-008 추가분) (3) 용량 정책(B-004·B-006·B-007) (4) 내용 재검토 후 기준선 갱신으로 나뉜다
- 제목 후보 6건(C-015·E-015·B-014·B-022·B-018·D-009)은 워크북 시트 근거 검토 후 반영

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01EynHh9yW3opy5z8q6HMtuY
