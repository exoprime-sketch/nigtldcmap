# REVIEW V156-D — 제외 10건 공개 반영 · 감사 조정 (feat/v156-d-exclusions)

작성 2026-09-27 · 기준 origin/main `2690675`(#32 V159 포함) · 인계: 세션2 WIP `7efcd7e` → 세션5 · 결정: 사용자 0923 제외 6 + 명세서 0918 제외 4

## 요약
- 제외 10건(C-020·C-023·E-011·E-013·E-016·E-017 / A-017·C-015·D-024·E-008)을 데이터 찾기 목록·검색·카테고리 건수·홈 카드·홈 수치·다운로드에서 내리고, 직접 URL은 안내 카드 1개(결정·사유·결정일)만 표시. C-021은 미입고 안내 유지. **공개 152 → 142**, 프레임워크 152 유지
- 감사·QA는 152를 코드에 적지 않고 카탈로그에서 파생(전체 = 카탈로그, 공개 = `publicStatus ∉ {excluded, not-provided}`)
- 배포 감사에 제외 10건 전수 검사 `exclusions:v156` 추가
- **main의 entity-cards 실패(D-024·E-008, #32 U0~U6 템플릿이 엔티티 카드를 내지 않음) 해소 확인** — 두 요소가 제외되어 카드 검사 대상에서 빠지고 안내 카드 검사로 대체

## 변경
### 결정·데이터
- `config/data-publication/vietnam-exclusions-v156.json`: 사용자 검토 6건 사유 "사용자 검토(2026-09-23) 제외 결정 — 배경"(결정일 2026-09-23), 명세서 4건 결정일 2026-09-18·건별 사유(V159 명세서)
- ETL(`tools/vietnam_etl/build_public_v2.py`): 제외 요소 `downloadAllowed: false`, manifest `downloadableElementCount`는 공개 요소 기준(147 → 141). 팩·다운로드 파일은 유지(결정 파일에서 줄을 지우고 재생성하면 복귀)
- 카드 빌더(`build-card-summaries-v140.mjs`): 제외 요소 카드 미생성(152 → 142장)
- 재생성: `refresh:data --source <입고 20260922> --carry-from <이전 입고분> --adopt A-002,B-015,B-022,E-001,E-010 --apply`(원자료는 메인 폴더에서 읽기만)
- **재생성 diff 확인: 결정 필드(제외 10건 `exclusion`·`downloadAllowed`)와 그 파생(제외 요소 다운로드 파일·팩 6개의 해시·크기, 카드 `packUrl` 38건, 번들 인덱스 크기·해시, `downloadAvailable` 6건, manifest 다운로드 가능 수 147→141, 카드 요약 152→142장)만 바뀌었고 값·레코드 변화는 0건**(`tmp` 비교 스크립트로 HEAD 대비 팩 해제 후 요소별 전수 비교)

### 화면
- 상세 제외 안내 카드: 결정(공개 표기 "사용자 검토" / "데이터 명세서 검토")·사유·결정일을 따로 표시, 결정일 임의 대체값(2026-09-23) 제거, 용어 도움말 적용. #32의 V159 훅 뒤에서 반환(훅 규칙)
- 홈 '전체 데이터 항목' = 공개 요소 수(142), '다운로드 가능 항목' = 141
- 파사드 비공개 상태에 `not-provided` 포함, 검색 결과·다운로드 항목에 `data-element-id`(감사 식별용)
- 용어 도움말: E-011 사유의 `NRI`는 #32가 등록한 용어집 항목 사용(이 PR의 중복 항목은 병합 후 제거)

### 감사·QA
- 공통 헬퍼 `scripts/v156/exclusions-audit-v156.mjs`(공개·제외 집합 파생, 안내 카드 스냅숏·판정)
- 기대값 변경 21건 — 검사별 이전/이후·사유: `reports/v156/EXPECTATION_CHANGES_V156D.md`
- 안내 카드 검사 추가: entity-cards(`EXCLUDED_ENTITY_ROUTE_NOTICE_V156`), portfolio-analysis(`EXCLUDED_PORTFOLIO_ROUTE_NOTICE_V156`, E-008 검사 3개는 제외 동안 안내 카드 판정), glossary(`EXCLUDED_DETAIL_NOTICE_V156`, 안내 페이지 문구도 용어 인벤토리)
- 새 감사 `exclusions:v156`(13검사) — 배포 감사 browser 샤드 1
- 단위 테스트 E-008 카드 검증을 제외 상태 분기로(삭제 없음)

## 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run test:unit`(main 병합 후) | 536/536 (51 suites) |
| production 빌드(CI=true) | 성공 |
| `exclusions:v156` | 13/13 — 찾기 142장(제외 0)·카테고리 A32·B48·C22·D25·E15(합 142)·검색(대조 검색 성공, 제외 10건 미검출)·홈 두 정렬 제외 0·홈 수치 142/141·다운로드 142(제외 0)·안내 카드 10/10 |
| `entity-cards:v131`(main 병합 후) | **18/18** — `ENTITY_CARD_ROUTE_RENDERING` 0(main 2)·`ENTITY_RECORDS_SHOWN_SOMEHOW` 통과·D-024·E-008 안내 카드 통과 |
| `portfolio-analysis:v132` / `glossary:v134` | 13/13 / 17/17 |
| `qa:detail-contract:v153` | 142/142(제외 10건 `excludedIds`) |
| `finalize:v151` | GATE_RESULT |

## 미완료·사유
- **main CI 빨강(#32 기인, 이 PR 범위 밖)**: `security:v128` `TRACKED_RAW_SOURCE` — `docs/handoff/v159/datasetTypologyV159.xlsx`가 원자료 형식으로 추적됨. 정적 게이트에서 실패해 브라우저 샤드가 돌지 않음. 처리 방식(저장소 밖 보관·CSV 전환·인계 문서 예외 목록)은 결정 필요
- D-024 사유는 명세서 문구("원자료 없음") 그대로이나 제외 전 측정은 개체 12건 — 문구 조정 여부 확인 필요
- 게이트 밖 옛 감사(v124–v135 release·finder-ux·limitations 등)의 152 기준값은 바꾸지 않음
