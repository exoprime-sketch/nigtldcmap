# V153-D3 · 기후·환경 법제도 및 국제 이니셔티브 편집 설명(출처 포함)

- 작성일: 2026-09-22 · 브랜치 `feat/v153-d3-policy-descriptions` · 대상 C-008·C-009·C-010
- 목적: 원자료 `속성23_설명`이 속성 라벨("시행(발효)일" 등)이라 설명으로 쓸 수 없던 문제를, 플랫폼이 공식 출처를 읽고 작성한 편집 설명으로 보완. 원자료 열은 덮어쓰지 않고 화면에서 "플랫폼 편집 설명 · 출처 n건 · 확인일" 라벨로 구분.

## 1. 대상 추출 (`reports/v153/d3-targets.json`)
| 구분 | 건수 | 기준 |
|---|---|---|
| C-009 기후 법제도 문서 | 19 | 법령 번호 코드(`06-2022-nd-cp` 등) 기준 중복 제거. `Decision 896/QĐ-TTg`와 `국가기후변화전략 2050`은 같은 문서로 1건 |
| C-010 환경 법제도 문서 | 20 | 위와 동일. 속성행(`법률`, `총리 결정(전략), 비전 2050` 등)이 `속성6_분류`·`속성3_값`으로만 지목하는 4건(20/2008/QH12·28/2023/QH15·149/QĐ-TTg·Circular 02/2022) 포함 |
| 문서 합집합 | **34** | C-009·C-010 공통 5건(환경보호법 72/2020/QH14, 지방계획 4건) |
| C-008 이니셔티브 | 19 | `" — "` 앞 subject 기준. NAZCA 절단 명칭("…Soils for Food Secur")은 완전 명칭과 같은 키로 접음 |
| C-008 협약 | 4 | 비준일 행으로만 존재(UNFCCC·교토·도하개정·파리협정) |
| 합계 | **57** | |

- 제외: 문서 유형 라벨(`Kế hoạch (KH-UBND)`, `Quy hoạch tỉnh` 등), 속성행(`현행 여부`, `법령 위계`, `규율 대상 분야`, `대상 시설 수` …), 출처행(`— FAOLEX 원문 PDF` 등), NAZCA 행위자 98곳.
- 추출 스크립트: `scripts/v153/extract-policy-targets-v153.mjs`.

## 2. 조사·작성 결과 (`src/data/visualization/policyDescriptionsV153.json`)
| 구분 | 대상 | 작성(verified) | 미확인(pending) |
|---|---|---|---|
| 문서 | 34 | 34 | 0 |
| 이니셔티브 | 19 | 19 | 0 |
| 협약 | 4 | 4 | 0 |
| 합계 | 57 | **57** | **0** |

- 서브에이전트 3개(Sonnet) 병렬 조사 → 메인이 문장·출처 전수 검수. 검수에서 바꾼 것:
  - 서명 공무원 이름 삭제(`(서명: …)`, `(부총리 … 서명)`) — 법령 설명의 내용이 아님(빌드 스크립트에서 제거).
  - 위키백과 URL 2건 제외(ccac·isa) — 공식 출처만 유지.
  - "베트남 참여 여부 미확인" 류 문장 3건 삭제(ppca·4per1000·ccich): 설명이 아니라 조사 메모. PPCA는 원자료도 `공식 참여 여부=미가입`으로 기재.
  - SUBARU 3번째 문장(호이안 전문가회의 참여) 삭제 — 이니셔티브 참여와 직접 관련 없음. 2문장 유지.
- 문장 규칙: 개조식 2~3문장(목적·적용 대상 및 핵심 의무/혜택/목표·시행일과 발령 주체), 각 ≤90자, 출처에 없는 주장 금지. 단위테스트로 라벨 문자열(`시행(발효)일`, `보완항목` 등)·내부 표기(`.pdf`, `raw:`, `검토의견`)·경어체 유입을 차단.
- 스키마: `{ key, kind, elementIds[], names[], title, formalName, shortName, issuer, effectiveDate, description[], sourceUrl[], sourceType, checkedAt, status, note }`. 지시된 `elementId` 대신 `elementIds[]`를 씀(문서 5건이 C-009·C-010에 공통).

### 출처 유형 분포(entry 기준, 57건)
| sourceType | 건수 |
|---|---|
| vn-gov-portal (vanban/datafiles/congbao/xaydungchinhsach.chinhphu.vn) | 26 |
| un-agency (UNEP·FAO·IFAD·UN-Habitat 등) | 8 |
| initiative-official (공식 사이트) | 6 |
| unfccc (unfccc.int·treaties.un.org) | 5 |
| climate-laws (LSE Grantham) | 3 |
| thuvienphapluat | 3 |
| luatvietnam · vn-ministry(vea.mae.gov.vn) · vn-province(danang.gov.vn) · informea · gov-other(gov.uk) · other-official(forestdeclaration.org) | 각 1 |

### 확인 강도가 낮은 항목(작성은 했으나 보고 필요)
| key | 상황 |
|---|---|
| 1318-qd-ubnd · 2810-kh-ubnd · 3560-qd-ubnd (지방 3건) | 출처 thuvienphapluat.vn이 봇 차단(Cloudflare 403, Playwright Chromium도 동일). 문서 번호·일자·제목은 검색 결과와 2차 출처(hethongphapluat, 지방 언론)로 확인. 원문 페이지는 브라우저에서 사람이 열면 정상. |
| qcvn-03/08/09/10 | 개별 QCVN 본문은 이미지 PDF. 고시 통첩 01/2023/TT-BTNMT 원문(vanban.chinhphu.vn)과 2차 출처로 범위·시행일 확인 |
| 768-qd-ttg · 896-qd-ttg · 243-2026-nd-cp · 05-2025-nd-cp | 제공된 PDF가 스캔본 → chinhphu.vn 계열 페이지(관보·정책포털)로 교차확인 |
| ccac | 공식 사이트 403 → UNEP 페이지로 확인, 베트남 가입 2017년은 원자료(`참여·서명 시점=2017`)와 일치 |
| ccich · subaru-nma · blue-growth-initiative | NAZCA/NMA 플랫폼 SPA가 헤드리스에서 본문 미렌더 → 소속 기관(UN-Habitat 후쿠오카·FAO) 공식 페이지로 대체 확인 |

## 3. 화면
- C-008: 이니셔티브 비교표 아래 "이니셔티브·협약 설명 · 23건 (플랫폼 편집)" 카드 목록(`data-testid="initiative-descriptions-v153"`). 카드는 **설명 제목 먼저**, 정식 명칭·약칭은 괄호. 협약 4건은 별도 소제목.
- C-009/C-010: 문서 타임라인의 각 문서 항목 안, "원문 보기" 링크 뒤에 카드 1개(`data-testid="policy-description-v153"`). C-009 20개(2050 전략이 번호·제목 두 항목으로 있어 카드 2개), C-010 19개(환경보호법은 C-010에 자체 항목이 없음). 속성행에는 카드 없음.
- 공용 렌더러 편집: `SemanticContractRendererV125.tsx` import 1줄 + `DocumentTimelineV140` 항목 내부 렌더 1줄. 로직·props 변경 없음.
- 컴포넌트: `src/components/data/public/PolicyDescriptionV153.tsx` + `policy-description-v153.css`(타임라인·포트폴리오 목록의 `li`/`span` 상속 규칙을 카드 안에서 되돌림).

## 4. 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 오류 |
| `npm run test:unit` | 25 suites · 234 tests 통과(신규 3 파일 17 tests 포함) |
| 바이트 동일성 고정 | `documentTimelineBaselineV153.test.tsx`: 편집 전 렌더러로 캡처한 sha256(`documentTimelineBaselineV153.json`: C-016 타임라인 전체 + C-009 54항목·C-010 41항목 각각). C-016 전체 해시 동일, C-009/C-010은 각 항목에서 카드 노드를 떼면 해시 동일 |
| JSON 계약 테스트 | 스키마·URL(https)·names↔원자료 100% 매칭·라벨/내부표기/경어체 금지·건수(34/19/4)·코드 정규화 |
| 컴포넌트 테스트 | C-008 카드 23개, 설명 우선·괄호 명칭·라벨 형식·`rel=noreferrer`; C-007 미표시; 미매칭 이름 null |
| `review:screens:v138 --only C-008,C-009,C-010` | ready 3/3 · console error 0 · http failure 0 · 1440px overflow 0 (`d3-screen-review.json`, `d3-screen-*.png`) |
| `scripts/v153/qa-policy-descriptions-v153.mjs` (production 빌드 + Chromium) | 카드 23/20/19, pending 0, 내부 표기 0, 6폭(320/390/768/1024/1440/1920) 가로 넘침: C-008 전부 0; C-009·C-010은 **320px에서 39px — 카드를 숨겨도 동일(기존 타임라인 이슈), 390px 이상 0** (`d3-policy-descriptions-qa.json`) |
| 출처 링크 응답 (`scripts/v153/check-policy-sources-v153.mjs`) | 77 URL: 200 66 · 307 1(fukuoka.unhabitat.org 리다이렉트) · 403 10(thuvienphapluat 6, ccacoalition/iges/iea/ifad 각 1 — 봇 차단, 브라우저 열람 가능) (`d3-source-links.json`) |

## 5. 미완료·사유
- C-009/C-010 320px 가로 넘침 39px: 편집 전부터 있던 타임라인 컨테이너 문제(카드 숨김 상태에서도 동일). 공용 렌더러 CSS 범위라 이 PR에서 손대지 않음 → 후속(V153-D4 이후) 항목으로 기록.
- Circular 02/2022/TT-BTNMT는 자체 타임라인 항목이 없어 EPR 3단 체계 항목("LEP 제54 55조 + Decree 08/2022 + Circular 02/2022")에 부착.
- 실제 Chrome 확장으로 thuvienphapluat 원문을 직접 열어 재확인하는 단계는 브라우저 선택 프롬프트가 필요해 생략(Playwright Chromium은 403).
