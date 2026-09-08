# FINAL VIETNAM DATA INTEGRATION — 진행 상태 (v137)

갱신: 2026-09-08 · 브랜치 `fix/existing-screen-usability-v136` · HEAD `6f14b5b` (미커밋 작업 중)

이 파일은 재개용 상태 기록이다. 사용자 화면에 노출하지 않는다.

---

## 1. 기준선과 원본 보호 — 완료

| 항목 | 값 |
|---|---|
| branch | `fix/existing-screen-usability-v136` (유지, 전환 없음) |
| HEAD | `6f14b5b8a0f5d72292c0007966e6a4aefdc504d4` |
| origin/main | `5ca33de4d17a8589fc5cfea02224f605696e4491` |
| 미병합 커밋 | 2개 (`574ef2a`, `6f14b5b`) — **보존됨** |

**원본 보호 조치**
- `.gitignore`에 정확한 경로 `/베트남데이터/` 추가.
- `git check-ignore -v`로 폴더와 개별 파일 모두 무시 확인.
- 추적 중이던 파일 **0건**, staged **0건** — 이력 재작성 불필요.
- `.vercelignore`/`vercel.json` 없음 → Vercel은 git 기준으로 배포하므로
  ignore 처리로 업로드 경로도 차단됨.
- 원본은 읽기 전용으로만 접근. 수정·이동·삭제·복사 없음.

**보존 대상(삭제·재번호 금지)**: `reports/live-qa-20260907-153743/`
(findings 58행, 증거 46개, coverage/resume/environment)

---

## 2. 원본 전수 목록 — 완료

`scripts/source-inventory-v137.mjs` (스트리밍 SHA-256, 6.25 GiB 전량)

| 지표 | 값 |
|---|---|
| 전체 파일 | 3,752 |
| **실제 내용 파일** | **2,035** |
| 고유 비어있지 않은 내용 | 2,248 |
| 중복 사본 | 472 |
| 0바이트 파일 | 1,032 |
| WebDAV 동기화 상태 파일 | 1,693 |
| 총 용량 | 6.25 GiB (6,706,108,199 B) |
| 읽기 실패 | **0** |
| 보안 스캔 지적 | **0** (매크로·스크립트 미실행) |

### 최초 분류에서 정정한 2건

1. **0바이트 파일 동일 해시 문제** — 빈 파일 1,032개가 모두 같은 SHA-256을 가져
   서로의 "내용 중복"으로 잘못 묶였다. 중복 판정에서 0바이트를 제외하도록 수정.
2. **`._DAV/.state_for_dir.{dir,pag}` 1,693개** — WebDAV 동기화 클라이언트 상태 파일.
   데이터가 아니며 파일 수를 크게 부풀리고 있었다. `임시`로 재분류.

### 이름이 비슷한 D/E 폴더 — 판정

`D. 시장□산업 및 재원`(11), `E. 협력□실행 기반`(10) = **21개 전부 0바이트**.

→ 정상 이름 폴더(`D. 시장·산업 및 재원`, `E. 협력·실행 기반`)의 **다른 판본이 아니라
실패한 복사본**이다. 내용 비교 대상이 아니고, 건너뛴 것도 아니며, 원본은 삭제하지 않는다.
(`·` → `□` 치환 실패로 생성된 것으로 보이나 원인은 단정하지 않음)

---

## 3. 152개 항목 대응 — 완료

`scripts/source-element-map-v137.mjs` → `element-source-map-v137.csv`

- `베트남데이터/file/` 에 **145개 정본 워크북**(`A-001.xlsx` … `E-020.xlsx`).
  기존 파이프라인이 읽던 `_source/vietnam/v124/vietnam-data(4).zip`(149개)과 같은 형태.
- 카탈로그 152개 중 **CANONICAL_WORKBOOK 145 / NO_SOURCE_FOUND 7**.

| 상태 | 항목 |
|---|---|
| 구 원천에만 존재 (OLD_ONLY) | E-011, E-013, E-016, E-017 |
| 양쪽 모두 없음 (NEITHER) | C-020, C-021, C-023 (카탈로그상 `not-collected`) |

→ OLD_ONLY 4건은 **이번 폴더에 없다는 이유만으로 삭제하지 않는다**(지시 §3).
E-016/E-017은 현재 `actual-records` 보유 → `RETAINED_WITH_REASON` 예정.

---

## 4. 최종 원자료 대조 — 완료 (가장 중요한 결과)

### 바이트 해시만으로 판단하면 틀린다

`source-baseline-comparison-v137.csv`: 145개 **전부** SHA-256 상이.
그러나 Excel은 저장할 때마다 내부 메타데이터를 다시 쓴다.

`scripts/compare-source-content-v137.py`로 **셀 내용 단위** 재비교:

| 상태 | 개수 |
|---|---|
| **CONTENT_IDENTICAL** (바이트만 다름) | **59** |
| **CONTENT_CHANGED** (실제 값·구조 변경) | **86** |
| OLD_ONLY | 4 |

→ 실제 반영 대상은 **86개**. 145개를 모두 바뀐 것으로 처리하면 안 된다.

기준화면 3개: **A-016 / D-011 CONTENT_IDENTICAL**, B-005 CONTENT_CHANGED.
A-017도 CONTENT_IDENTICAL (관측 72행 동일).

### 구조 변경의 실체 — 관측형 → 개체(entity)형

`missing-sheet:db_framework` 112건은 정상이다. 새 워크북은 데이터 시트 3개만 두고
참조 시트 4개(`3_결측사유코드`, `meta_def`, `meta_code_def`, `db_framework`)를 뺐다.

문제는 그것이 아니라 **시트 간 데이터 이동**이다. 예: B-034

| | 구 원천 | 최종 원자료 |
|---|---|---|
| `1.1_observation` | 501행 (관측 498) | **3행 (헤더뿐, 데이터 0)** |
| `1.2_entity` | 3행 (개체 없음 안내) | **249행 (개체 246)** |

새 entity 시트는 attr_1~attr_17에 다음을 담고 있다:

```
레코드 키(VNM.1_1) · 지역명(베트남어) · 지역명(로마자) · 행정단위 ·
2025 개편 후 소속(34개 체계) · 구분(수관밀도 임계 30%) · 기준연도 ·
지상부 탄소저장량(Mg C) · 지상부 탄소밀도(Mg C/ha) ·
산림탄소 총배출(Mg CO2e/yr) · 산림탄소 총흡수(Mg CO2/yr) ·
산림탄소 순플럭스(Mg CO2e/yr) · 값(전국 계열) · 단위(전국 계열) ·
경계 폴리곤 파일 · 경계·좌표 산출근거 · 기후기술 연계 근거
+ lat/lon · geometry_type=polygon · crs=EPSG:4326
```

**값 대조 결과**: An Giang 순플럭스 `-327,911`, Bạc Liêu `-95,795` —
구 원천 관측값 및 현재 라이브 차트 값과 **정확히 일치**한다.
즉 값이 사라진 것이 아니라 **관측 시트에서 개체 시트로 옮겨졌다**.

### 이것이 기존 QA 결함을 직접 해결한다

- **LQA-018 / LQA-032 (성(省) 단위 라벨)** — 최종 원자료가 지역명·로마자명·
  GADM 레코드 키(`VNM.1_1`)를 직접 제공한다. 지역명을 추측할 필요가 없어졌다.
- **LQA-031 (기간 귀속)** — `기준연도` 열이 개체별로 분리되어 있다.
- 경계 폴리곤 파일명과 산출근거가 명시되어 지도 조인 근거가 생겼다.

### 2025년 행정구역 개편 (주의)

`2025 개편 후 소속(34개 체계)` 열 존재. 예: Bạc Liêu → Cà Mau.
→ **63개 기준 값을 34개 경계로 재분배하지 않는다**(지시 §7).
63을 데이터 단위로 유지하고 34 체계는 속성으로만 보존한다.

---

## 5. 코드 수정 — 진행 중

### 완료: 부호 있는 비교 차트 (LQA-017 / LQA-013, 원인 D)

`src/components/data/semantic/SemanticContractRendererV125.tsx`
- `barScaleV137()` 추가. 그룹에 음수가 있을 때만 0 기준선을 만들고
  음수는 왼쪽, 양수는 오른쪽으로 배치. 길이는 크기, 방향·위치는 부호.
- 전부 0 이상인 그룹은 기존 좌측 정렬 렌더링을 그대로 유지(회귀 방지).
- 색만이 아니라 방향과 숫자로 구분. 안내문 1줄 추가.
- `semantic-contract-renderer-v125.css`에 `.sv125-contract-track--signed`
  0 기준선과 음수 채움색, `prefers-contrast: more` 대응 추가.

### 다음 (미착수)
- A. 필터 적용 범위 (D-022/D-025) — LQA-021/026
- B. 코드·지역 식별 — LQA-001/022/028 표시명, LQA-032 지역 crosswalk
- C. 기간·통계 의미 — LQA-031 연평균, LQA-004/016 전망/관측
- ETL 어댑터: 새 entity 중심 구조 + `SOURCE_ROOT` 입력 + staging 출력

---

## 5b. ETL 어댑터 — 완료 (staging 빌드 성공)

기존 생성기에 최소 입력 어댑터를 추가했다. 병렬 ETL을 새로 만들지 않았다.

**`tools/vietnam_etl/source_zip.py`**
- `analyze_source_dir()` 추가. ZIP과 동일한 분석 경로(`_analyze_entries`)를 공유하므로
  두 입력이 서로 어긋날 수 없다. 디렉터리는 읽기만 하며,
  컨테이너가 없으므로 파일별 digest를 누적해 식별 해시를 만든다.
- 반환값에 `sourceKind` 추가.

**`tools/vietnam_etl/build_public_v2.py`** — 환경변수 3개. 미설정 시 기존 동작과 동일.
| 변수 | 용도 |
|---|---|
| `VIETNAM_SOURCE_DIR` | 최종 원자료 디렉터리 입력 |
| `VIETNAM_V2_OUTPUT` | staging 출력 경로 |
| `VIETNAM_EXPECTED_WORKBOOKS` | 워크북 수 기대값 |

- 출력 경로 가드: `public/data/vietnam/v2` 또는 `v2-staging*` 형제만 허용.
  (spatial 빌더가 asset URL을 `public/` 기준으로 만들기 때문에 staging도 그 아래에 둔다.
  `/public/data/vietnam/v2-staging*/`는 gitignore 처리)
- V1 manifest 대조 assert는 **원본 ZIP 빌드에서만** 강제, 교체 원천에서는 delta로 기록.
- `sourceWorkbookCount` 하드코딩 149 → 실제 분석값.
- 누락 요소 carry-forward: 최종 폴더에 없는 요소는 구 ZIP 워크북을 승계하고
  `carriedOverElementIds`로 명시. (E-011/E-013/E-016/E-017)

**`tools/vietnam_etl/workbook_parser.py`**
- `db_framework`를 필수 시트에서 제외(`DATA_SHEETS` 신설).
  이 시트는 요소 프레임워크 정의를 반복한 참조 시트일 뿐이고 카탈로그가 이미 갖고 있다.
  필수로 두면 **데이터가 온전한 112개 요소가 통째로 quarantine** 되었다.
  누락 시 `missing-optional-sheet:` 경고로만 기록.

### 회귀 검증 (구 원천 재빌드 vs 현재 public/v2)

`v2-staging-oldsrc` 재빌드 결과 **266/270 파일 바이트 동일**.
차이 4개는 manifest·asset-integrity 계열이며, 현재 `public/data/vietnam/v2`가
후속 단계(semantic v125, interpretation v129 등) 산출물 157개를 추가로 담고 있어서 생긴 것.
→ 파서 변경으로 인한 구 원천 회귀 없음.

### 최종 원자료 staging 빌드 결과

| 항목 | 구 원천 | 최종 원자료 |
|---|---|---|
| statusCounts | actual 126 / public-authorized 18 / not-collected 3 / partial 3 / data-entry-planned 1 / schema-only 1 / quarantined 0 | **전부 동일** |
| assetCount | 270 | 270 |
| mapFeatureCount | 2,900 | 2,900 |
| sourceWorkbookCount | 149 | 149 (145 + carry-forward 4) |
| rowBalance.matches | True | True |
| processedRows | 45,582 | 171,846 |
| **authorizedRowsPublished** | **360** | **443** (+83) |
| authorizedWithoutPopulatedRows | E-011, E-013 | E-011, E-013 (동일) |

구조 회귀 없이 공개 행이 늘었다. 아직 **public/에 반영하지 않았다**(staging 전용).

## 6. 아직 하지 않은 것

- 후속 파이프라인 단계(semantic v125 / interpretation v129 / 지도 계약) 미실행
- staging → public 반영 미실시
- `source_to_output_reconciliation` — 미착수
- 152개 분석 계약 — 미착수
- 지도 나머지 6개 + 추천 분석 5개 + 비교지도 — 미착수
- 벤치마킹 5개 사이트 — 미착수
- 로컬 build / `finalize:v136` — 미착수
- Draft PR — **NOT_CREATED** (아래 참조)

## 6b. commit / push — 완료

브랜치 `fix/existing-screen-usability-v136` 에 5개 커밋 추가 후 일반 push 완료.
기존 미병합 2커밋(`574ef2a`, `6f14b5b`)은 그대로 유지. force push·amend 없음.

```
65e5536 chore(reports): preserve the read-only live QA evidence
3867796 chore(reports): inventory the final source and record what actually changed
c076b8c fix(charts): place signed comparison bars around a real zero
20b3737 feat(etl): build the public projection from the final source directory
f59c2e8 chore(data): keep the final Vietnam source archive out of git and deploys
6f14b5b test(release): ...        <- 기존
574ef2a fix(screens): ...         <- 기존
```

staging 전 확인: `git status`에 원본·staging 미등장, staged 0건,
보고서 내 절대경로 유출 0건, `npm run build` 성공.
`git add -A`를 쓰지 않고 경로를 명시해 staging 했다.

### Draft PR — NOT_CREATED

`gh` CLI가 이 환경에 설치되어 있지 않다(PATH·기본 설치 경로 모두 없음).
따라서 Draft PR 생성과 GitHub CI 실행은 **수행하지 못했다**.

- `GITHUB_CI` = **NOT_TRIGGERED / NOT_OBSERVED**
- `PREVIEW_QA` = **NOT_AVAILABLE** (PR 미생성이므로 Preview 배포 없음)

브랜치는 push되어 있으므로 다음 주소에서 Draft PR을 열 수 있다:
`https://github.com/exoprime-sketch/nigtldcmap/compare/main...fix/existing-screen-usability-v136`

제안 제목: `feat(data): integrate final Vietnam sources and resolve public analysis defects`

## 7. 산출물

```
reports/final-data-integration/
  source-inventory-v137.csv              3,752행 (재분류 반영)
  source-inventory-summary-v137.json
  element-source-map-v137.csv            152행
  source-baseline-comparison-v137.csv    바이트 대조
  source-baseline-comparison-v137.json
  source-content-comparison-v137.csv     내용 대조 (핵심)
  source-content-comparison-v137.json
  INTEGRATION_STATE_V137.md              이 파일
scripts/
  source-inventory-v137.mjs
  source-element-map-v137.mjs
  compare-source-baseline-v137.py
  compare-source-content-v137.py
```
