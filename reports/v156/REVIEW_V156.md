# REVIEW — V156 베트남 데이터 2026-09-22 입고분 부분 갱신

## 1. 한 줄 요약

2026-09-22 입고분(워크북 146개·코드 145개 + B-012 geojson) 가운데 **현행 화면·계약·용량 한도가 그대로 읽을 수 있는 106개 요소만 갱신**하고, 구조·범위·한도·계약이 어긋나는 **39개는 이전 입고분 값을 유지(보류)** 했다. 값 조작·기대값 변경은 한 건도 하지 않았다.

## 2. 사용자 결정(2026-09-23)

| 질문 | 결정 |
|---|---|
| E-008 워크북에 API 키 포함 | 스테이징 사본에서 키만 제거(입고 원문 불변) — `reports/v156/source-credential-findings-v156.md` |
| 구조가 바뀐 요소 처리 | 호환 요소만 부분 적용, 구조 변경분은 보류 |
| ETL이 막은 coverage drop 8건 | 8건도 보류, 나머지만 적용 |

보류 기준을 그대로 적용하는 과정에서 같은 성격의 사유가 추가로 드러나 보류 범위가 15 → 39개로 넓어졌다(§4).

## 3. 변경 내용

### 3.1 원자료 정리(A) — `scripts/v156/stage-source-v156.mjs`(신규)

- 입고 폴더 엔트리 150개 중 **clean xlsx 146 + geojson 1**을 식별하고 `~$` 잠금 2개·`._DAV` 1개는 제외했다. 계획서의 "148 xlsx"는 잠금 파일을 포함한 수치다.
- 중복 코드는 **C-017 한 건**(원본 + `_수정안`) → 수정안 채택, 원본은 `superseded`로 기록. 판단이 필요한 중복은 0건.
- `--hold`로 보류한 코드는 **이전 입고분(`베트남데이터/file`)** 파일을 그대로 스테이징한다. ETL 자체 fallback은 더 오래된 V124 ZIP을 읽어 D-018의 검토 사이트 2건이 사라지며 빌드가 실패했다.
- manifest(`_source/vietnam/v156/manifest-v156.json`, git 무시 경로)에 파일명·코드·제목·sha256·크기·mtime·채택 판정·보류 사유를 기록했다. 공개용 사본은 `reports/v156/hold-list-v156.json`.

### 3.2 자격증명 제거 — `tools/vietnam_etl/redact_source_credentials_v156.py`(신규)

- 탐지 패턴은 `tools/vietnam_etl/normalization.py`의 `_CREDENTIAL_VALUE_PATTERNS`를 그대로 가져와 탐지기와 제거기가 어긋날 수 없게 했다. 발견·조치 내용은 `reports/v156/source-credential-findings-v156.md`.

### 3.3 스테이징 빌드·diff(B)

- `VIETNAM_STAGING_ROOT`는 `.staging/` 하위여야 한다(`build()`가 그 밖의 경로를 거부). 계획서의 `tmp/v156-staging`은 쓸 수 없어 `.staging/v156`을 썼다.
- `VIETNAM_EXPECTED_WORKBOOKS=149` — 이 값은 carry-over 병합 **후**의 워크북 수를 검사한다. 채택 106 + 보류 39(이전 입고분) + ZIP carry-over 2(E-016·E-017) + 원천 없음 3(C-020·C-021·C-023 — 두 소스 모두 미보유) = 149.
- `scripts/v156/source-structure-v156.py`(신규): 빌드 없이 워크북 구조만 현행 카탈로그와 대조한다(ETL이 완주하지 못할 때 필요). `reports/v156/source-structure-v156.json`.
- `scripts/v156/source-diff-v156.mjs`(신규): 카탈로그 행 + `downloads/*.json`을 요소별로 비교해 제목·상태·지표·값 변경률·최신연도·결측률·엔티티 속성을 적는다. `reports/v156/source-diff-v156.{json,md}`.

### 3.4 적용(C) — `scripts/v156/apply-staged-data-v156.mjs`(신규)

- 기존 `promote-public-data-v137.mjs`는 mirror(원본에 없는 파일 삭제) 방식이라 ETL 체인이 만들지 않는 자산을 지운다. 실제로 공개 트리에는 체인이 쓰지 않는 파일 19개가 있다: `geometry/**` 12(V151 34개 경계·국가 외곽선·6권역·도로철도, V155 SLR 3·연안수자원), `spatial/**` 5(pending-v155), `dataset-directory.json`, `home/card-summaries-v140.json`.
- 그래서 이 스크립트는 **스테이징 파일 전체를 덮어쓰고, 내용 해시로 이름 붙는 낡은 `packs/*` 샤드만 삭제**하며, 설명되지 않는 잔여 파일이 있으면 삭제하지 않고 실패한다.
- 적용 후 `build:dataset-directory:v150`·`build:card-summaries:v140`(각각 asset-integrity 재생성 포함)을 돌렸다. 자산 555개 PASS.

### 3.5 최종 데이터 변화(HEAD → 적용 후)

- 요소 152개 중 **변화 45 / 변화 없음 107**. 지표 +66 / −68, 관측 +1,275 / −865.
- 증가: B-003 엔티티 8,371→12,621 · B-017 2,032→4,867 · C-025 388→1,190 · C-005 135→408 · C-003 96→253 · B-045 관측 46→224 · B-038 190→399 · A-030 16→148.
- 감소: B-009 관측 435→255(지표 변화 없음) · C-025·C-005·C-003은 지표 ID가 원천별 세분에서 통합 ID로 재편(속성 일부 삭제).
- **제목 변경 0** — `elementLabel`은 `public/data/vietnam/v1/catalog.json`이 정본이고 입고분이 이를 바꾸지 않는다. 즉 A-002(CPIA→WGI) 등 제목 전파는 ETL이 아니라 별도 결정이며 이번 PR에서는 하지 않았다(§5).

## 4. 보류 39개와 사유

정본: `reports/v156/hold-list-v156.json`.

| 사유 | 개수 | 요소 |
|---|---|---|
| 구조·그레인 변경 | 15 | A-013·A-023·A-028·B-002·B-005·B-024·B-031·B-032·B-033·B-034·B-035·B-036·C-016·D-018·E-008 |
| 공개 행 절반 미만 감소(ETL `MATERIAL_COVERAGE_DROP`) | 8 | B-043·C-002·C-004·C-008·C-009·C-010·C-014·C-018 |
| 지표 ID 체계 변경 | 1 | E-012 |
| 파일 100 MB 한도 초과 | 3 | B-004·B-006·B-007 |
| 지도 선언 변수 소실 | 5 | C-012·C-013·C-019·C-022·C-024 |
| 검토 기준선 테스트 불일치 | 7 | A-026·B-023·B-028·B-046·B-047·C-011·E-018 |

근거 수치(대표):

- **A-023**: 개체 1,963→236(WRI GPPD 베트남 행 수와 일치)이고 속성 열이 `속성1(A-013:SDG세부목표코…)`·`속성3(A-024:선로상태…)` 등 **다른 요소 템플릿 헤더**로 채워져 발전원·설비용량·소유·운영·가동연도·소재지를 담지 못한다 → 제공자 산출 결함으로 판단, 회신 필요.
- **B-033**: 관측행 0 + 성×연도 개체 4,765건, 수관밀도 임계 8종·손실원인 8종·행정단위 혼재(지역명 71종). (지역,연도,임계,원인) 4중키로도 중복 1,189건이라 `build_spatial_v124.py`가 `duplicate spatial values`로 중단한다. 임계·원인 선택 규칙이나 합산은 데이터 결정이므로 만들지 않았다.
- **B-008**: 전망이 사라진 것이 아니라 개체 시트 속성(시나리오·신뢰수준·PSMSL 관측소, 2050/2100)으로 이동했다. 구조 스캔의 "최신연도 2100→2026"은 관측행 기준 파싱 산물이다.
- **E-012**: 지표 ID에 `_nat` 접미가 붙어 90→229개. `build_semantic_v125.py`의 `e012_decode_id`가 해독하지 못해 체인이 중단된다.
- **B-004·B-006·B-007**: `downloads/*.json`이 81→153 MB, 82→142 MB, 80→142 MB. GitHub 파일당 100 MB 한도를 넘고, ETL도 `external-object-storage` 모드로 바꿔 `url`이 없어 `dataset-directory-v150-1.mjs`가 EISDIR로 죽는다(빌더의 잠재 결함도 함께 기록).
- **C-012·C-013·C-019·C-022·C-024**: 지표 ID 재편(`C-012_contract_type`·`C-012_ppp_agency` 등 삭제 → `C-012_law`·`C-012_ppi_record`)으로 지도 레이어의 선언 변수가 사라져 `detailMapSelectionV148`이 미선언 변수를 고른다(`mapPresentationV148.test.ts` 5건 실패).
- **A-026·B-023·B-028·B-046·B-047·C-011·E-018**: 검토 내용을 고정한 단위 테스트와 어긋난다(예: B-028은 GloFAS v4 관측 2건 추가로 15행·4지점 → 17행·5지점). 기대값을 새 값으로 바꾸지 않고 보류했다.

## 5. 검증 결과

| 명령 | 결과 |
|---|---|
| `python -m tools.vietnam_etl.build_public_v2`(스테이징) | ok · `promotionBlocked: false` · blocker 0 · `rowBalance.matches: true` |
| `node scripts/v137/build-final-data-v137.mjs` | etl·semantic·interpretation·temporal·map-targets·home-preview·asset-integrity 전 단계 ok |
| `scripts/v156/apply-staged-data-v156.mjs --apply` | 적용 · 보존 19 · 낡은 샤드 정리 · 설명 없는 잔여 0 |
| `npm run build:dataset-directory:v150` / `build:card-summaries:v140` | PASS · asset-integrity 555 |
| `npm run audit:generated-data:v133` | 15/15 PASS |
| `npx tsc --noEmit` | 0건 |
| `npm run test:unit` | **299/299 PASS** |
| 100 MB 초과 파일 | 0건 |

## 6. 미완료와 사유

| 항목 | 사유 |
|---|---|
| 제목 전파(A-002 CPIA→WGI 등) | 파일명이 정본이 아니고 `elementLabel`은 V1 카탈로그가 정본이다. 신규 파일명과 V1 라벨이 다른 87건 중 대부분은 대괄호 컬럼 목록 생략·`/;:`의 파일시스템 회피 표기이며, 실질 출처 변경은 A-002가 확실하고 C-015·E-015·B-014·B-022·B-018·D-009가 후보다. 각 워크북 시트의 제목·출처 행을 근거로 확정해야 하므로 별도 결정으로 남겼다 |
| D. 제외 6건(C-020·C-023·E-011·E-013·E-016·E-017) 화면 반영 | 미착수. 카탈로그 `publicStatus: excluded`는 현재 스키마에 없는 값이라 찾기 목록·검색·카테고리 건수·홈 지표·사이트맵·상세 카드까지 함께 손봐야 한다 |
| E. 갱신 런북(`docs/DATA_REFRESH_RUNBOOK_V156.md`, `npm run refresh:data`) | 미착수. 이번 세션에서 만든 4개 스크립트가 런북의 단계와 1:1로 대응하므로 감싸기만 남았다(단계: stage → redact → chain → diff → apply → dataset-directory → card-summaries) |
| 전용 렌더러 스크린샷·A-023 카드 5표본 대조 | A-023이 보류 대상이라 이번 라운드에서는 비교 대상이 없다 |
| 보류 39개 후속 | 사유별로 (1) 제공자 회신(A-023 템플릿 결함·B-031~B-034 그레인), (2) 계약·렌더러 확장(E-012 `_nat`, B-008 속성 전망, A-028·B-005·E-008 추가분), (3) 용량 정책(B-004·B-006·B-007), (4) 내용 재검토 후 기준선 갱신(A-026·B-023·B-028·B-046·B-047·C-011·E-018)로 나뉜다 |
