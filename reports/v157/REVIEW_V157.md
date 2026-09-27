# REVIEW_V157 — 지도 대상 72개 · 연관 표출

- 브랜치: `feat/v157-map71-companions` (베이스: `feat/v158-a-multicountry-skeleton`, #33 merge 후 `origin/main`으로 rebase 예정)
- 범위: P8_V157 (지도 대상 71 + A-027 = 72행 계약 → 등록 → 렌더러 → 동반 표출 → 연관 데이터 → QA)
- 편집 금지 준수: `HomePage*`·`DataExplorerPage.tsx`·`CountryDataElementPage.tsx`·`src/components/data/templates/*`·`public/data/bgd/**` 무수정

## 1단계 — 지도 표출 내용 계약 (완료)

### 1.1 산출물

| 파일 | 내용 |
| --- | --- |
| `public/data/vietnam/v2/map-content-contract-v157.json` | 72행 계약(요소별 기준·기하·경계정책·원자료 열·팝업/지역패널 필드·유의사항·상태) |
| `scripts/v157/build-map-content-contract-v157.mjs` | 계약 생성기(`npm run build:map-contract:v157`, `--check`로 최신 여부 검증) |
| `scripts/v157/province-dictionary-v157.mjs` | 성·시 표기 사전 387개(베트남어·로마자·한글·코드) → 2025-07-01 34개 단위 코드 |
| `reports/v157/map-content-contract-build-v157.json` | 집계·PDF 잠정코드 불일치·라벨 미정 목록 |

- 72행 구성: 2026-09-22 전수검토표 71행(`docs/plan/map-selection-20260922.json`) + A-027(사용자 결정 2026-09-23). 중복 없음(고유 ID 72개).
- `pdfContent`(전수검토표 「지도 표출 내용」)는 **원문 그대로 전사**해 각 행에 보존. 기준①②③은 PDF의 잠정값을 `criteriaProvisional`에 남기고, 계약의 `criteria`는 **원자료에서 확인된 열·값으로 재산정**.

### 1.2 기준 확정 방법 — 열 이름이 아니라 값으로

- 문제: 72개 중 33개는 지역을 가리키는 **열 이름이 없다**. 지역이 `명칭`("꽝빈성 태양광 발전사업") 안에, 해시 키(`field_7b638c0f`) 뒤에, 또는 관측치의 `indicatorId` 안에 들어 있다.
- 해결: `province-dictionary-v157.mjs`로 **값**을 조회. 근거는 모두 기존 자산 — `ADM1_34_UNITS_V151`(34개 단위·구성 성), `geometry/vnm-adm1-63.geojson`(개편 전 63개 표기), `mapBackdropV150`(63개 한글명), `crosswalk34`.
  - 34개 단위 코드와 63→34 구성이 crosswalk와 **일치함을 생성 시 검증**(경고 0건, 리포트 `provinceDictionary.warnings`).
  - 매칭은 경계 인식·긴 표기 우선·매칭 구간 소비 방식 — "Vĩnh Long · An Giang"에서 "Long An"이 잘못 잡히지 않는다.
  - 한글은 행정 접미사를 붙여 쓰므로("꽝빈성", "하노이시") 접미사 1자를 허용. 영문 1어 표기("Hanoi")도 별도 표기로 등록.
- 기준별 판정 규칙(모두 계약 `criteriaEvidence`에 수치로 기록):
  - ① 같은 지표를 **2개 이상 지역·유역**에서 비교 가능 — 레이어 조인키 값 수, 성·시 표기가 붙은 관측치 수, 지역 단위를 대표하는 지점 수 중 최대값 ≥ 2
  - ② **위치 + 설명** — 좌표(국가 bbox 내부) 또는 성·시 표기가 있는 레코드 + 설명 속성 2개 이상
  - ③ **지역 + 계획·규정·지원 내용** — 같은 행에 지역과 계획/규정/지원 성격의 서술 열(위치 서술 열은 제외)

### 1.3 72행 집계

| 상태 | 건수 | 요소 |
| --- | --- | --- |
| registered(이미 지도 등록) | 39 | map-index 42개 중 39개가 이 72행에 포함(C-009·C-010·C-019는 전수검토표 밖) |
| pending-registration(P6b 이관 대상) | 4 | A-027 A-028 B-017 D-022 |
| candidate(V157 신규 등록 대상) | 17 | B-009 B-026 C-008 D-012 D-014~D-017 D-019~D-021 D-023 D-025 D-026 E-001 E-002 E-020 |
| national-only(국가 단위 값만) | 7 | B-002 B-024 B-035 B-036 B-044 B-046 B-047 |
| region-fields-empty(지역 열 값 전무) | 2 | C-003 C-017 |
| region-text-generic(일반 지역어만) | 1 | A-013 |
| reference-mapping-pending(참조표 필요) | 1 | A-022 |
| data-pending(사업지역 세분화 전) | 1 | C-006 |
| **합계** | **72** | 표출 가능 60 / 표출 불가 12 |

- 기준 분포(중복 포함): ① 54 · ② 57 · ③ 12 · 없음 12. 대표 기준(`criteriaPrimary`, PDF 코드를 데이터가 지지하면 그 코드): ① 26 · ② 29 · ③ 5 · 없음 12.

### 1.4 표출 불가 12건 — 사유와 필요한 조치

| 요소 | PDF 기준 | 사유(계약 `statusReason`) | 필요한 조치 |
| --- | --- | --- | --- |
| B-002 기후대 | ① | 국토 전체 면적값만(기후대별 경계 없음) | 제공자 재납품 또는 기후대 경계 자산 |
| B-024 농업용수 대리지표 | ① | FAO 국가 단위 값만 | 성별 분해 재납품 |
| B-035·B-036 토지이용 | ① | FAOSTAT 국가 단위 값만 | 성별 분해 재납품 |
| B-044·B-046·B-047 광물 | ② | USGS 국가 단위 값만(광산 좌표 없음) | 광산 위치 원자료 |
| C-003 국가적응계획 지역과제 | ③ | `속성20_지역_원문`·`속성21_지역_현행`·`속성22_행정코드P_code` 3열이 모두 공란 | 제공자 재납품(지역 열 채움) |
| C-017 지역 발전가격·지원 | ③ | 동일(지역 3열 공란) | 제공자 재납품 |
| A-013 NDC-SDG 지역조치 | ③ | 지역이 성·시 이름이 아니라 원문 일반 지역어("coastal", "delta")로만 등장 | 임의 경계 생성 금지 — 원문 인용 표기로만 |
| A-022 전력공급 신뢰도 | ① | EVN 그룹 전체 값만 | `tools/etl/countries/vnm/evn-jurisdiction.json` 참조표(성별 출처 URL 필수, 미확인 성 미기재, 관할 분할 성은 mixed) |
| C-006 JCM 사업 | ② | 사업지역 세분화 전 | 성 단위 확인 시 등록 |

- 위 7건(국가 단위)·2건(지역 열 공란)은 **제공자 회신 대상**으로, 기존 `docs/handoff/v156/DATA_PROVIDER_REQUEST_20260924.md`에 이어 후속 요청 문서에 합산할 항목이다(이번 단계에서는 계약에만 기록).

### 1.5 PDF 잠정코드와의 차이 12건

- 12건 모두 위 표의 표출 불가 요소다. 즉 **표출 가능한 60건에서는 PDF 잠정 기준과 데이터 판정이 일치**한다.
- 초기 판정에서 발견·수정한 오류(모두 근거 있는 수정):
  - `Number(null) === 0` 때문에 위도·경도가 전부 공란인 요소가 좌표 817건으로 계산됨 → 국가 bbox(`public/data/countries.json`) 내부의 유한 좌표만 인정.
  - 유역 단위 지점 레이어(B-023)의 값은 `adm1Code`가 아니라 레이어 자신의 조인키에 있음 → 레이어 선언 조인키로 집계(①로 정정, PDF와 일치).
  - `설명`을 계획 서술로 본 탓에 위치 설명(`위치_설명`)이 ③로 오판 → 위치 서술 열 제외.

### 1.6 팝업·지역패널 필드

- 등록 42개 레이어와 보류 5개 레이어는 이미 `tooltipFields`·`fieldLabels`를 선언하고 있어 **그 선언을 그대로 계약에 전재**한다(라이브 팝업을 V157이 바꾸지 않는다).
- 선언이 없는 행(신규 후보)은 원자료 열에서 도출: 명칭 → 지역 → 분야 → 규모·금액 → 시점 → 상태·기관 → 원문 → 출처. 채움률 50% 미만 열은 약속하지 않는다.
- 공개 화면 규칙 준수:
  - 라벨이 raw 키인 필드는 라벨을 비우고(`labelSource: "pending-publicFieldPolicyV126"`) 리포트 `labelsPending`에 모아 4단계(UI)에서 `publicFieldPolicyV126`에 추가한다. 현재 5건: `a64Status` `approvalProcedure` `typeOfInformation` `field_7b638c0f` `field_890a80ed`.
  - 한글 열 이름은 납품 원문 그대로 쓰되 납품사 내부 순번 접두사만 제거(`속성23_설명` → `설명`).
  - 개인 연락처(이메일·전화·담당자·직함)는 지도 팝업 필드에서 제외.
- 전수검토표 표시 규칙을 행별 `caveats`로 기록: 전국 공통 행 제외 건수, 부분 표출, 지역 대표점과 실제 시설 구분, 원자료 지역코드(GSO `VNxx`)는 경계 자산의 ISO 코드와 직접 대조하지 않고 지명 별칭표로 조인.

### 1.7 검증

| 항목 | 결과 |
| --- | --- |
| `node --check scripts/v157/*.mjs` | 통과 |
| `npm run build:map-contract:v157` | 72행 생성, 사전 경고 0 |
| `node scripts/v157/build-map-content-contract-v157.mjs --check` | `changed:false` (타임스탬프만 바뀐 재실행은 변경으로 보지 않음) |
| `node scripts/v157/province-dictionary-v157.mjs` | 387개 표기 / 34개 단위 / 경고 0, 7개 표본 판정 정상 |
| `node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2` | PASS, 556 자산(신규 계약 파일 포함) |

- 아직 하지 않은 것(다음 단계): 레이어 등록(2단계), 렌더러(3단계), 동반 표출·패널 UI(4단계), 연관 데이터 142행(5단계), QA 스크립트·게이트(6단계). 상세 화면의 '연관 데이터' 칩 삽입은 사용자 결정에 따라 **후속 PR**로 분리한다.
