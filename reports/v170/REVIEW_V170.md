# V170 — '데이터 찾기' 검색: 핵심 데이터 패널·관련도 묶음·일치 근거·동의어

- 브랜치: `feat/v170-search-relevance` (origin/main e8493de4, #80 병합본에서 분기)
- 요청
  - 2026-10-07 07:24: 시연에서 "검색하면 데이터만 sorting되는 느낌이라 하나씩 눌러 봐야 함, 데이터는 많지만 활용하기 너무 어렵다"는 의견 → 개선 방안 제안 요청
  - 07:32: 용역사가 현재 체계에서 큰 변화 없이 10/30까지 구현할 수 있어야 함
  - 07:44: "이대로 현재 플랫폼에 구현해주세요" (시안 캔버스의 ①~④)

## 1. 원인(현행 main)

- 검색이 데이터별 전문 색인(`search-index-v124`)의 부분 문자열 일치만 봄
  - 색인에 원자료 전체 문구와 작업 메모가 함께 들어 있어, 이름·설명과 무관한 데이터도 결과에 섞임
  - 예: 베트남 '태양광' 50개 결과. 이름에 '태양광'이 있는 데이터는 2개
- 결과는 가나다순 고정. 왜 결과에 들어왔는지 카드에 표시가 없음
- 기후기술 분류(예: 01 태양광)만 붙은 데이터도 같은 비중으로 나열됨

## 2. 변경

| 번호 | 기능 | 내용 |
|---|---|---|
| ① | 핵심 데이터 패널 | 주제어 검색(국가 1개, 다른 필터 없음) 시 결과 위에 주제별 수치 표. 행마다 역할·데이터명·제공기관·값·추이·상세보기·지도에서 보기 |
| ② | 관련도순 + 3개 묶음 | 검색 시 정렬 기본 '관련도순'. 직접 관련 / 원자료에 포함 / 기후기술 분류만 일치(접힘) |
| ③ | 일치 근거 | 카드마다 '{위치}에서 일치 · 원자료 N건 중 M건' + 일치 문구(검색어 강조) |
| ④ | 함께 찾은 말 | 동의어 사전 46개 그룹으로 같은 뜻의 말을 함께 검색, 검색창 아래 표시 |

- 화면 구조·탭·URL은 그대로. 검색어가 없을 때 목록·정렬은 현행과 같음
- 세부 규칙(점수·묶음 판정·문구)은 `VENDOR_NOTICE_V170.md` 2장

### 파일

| 구분 | 파일 |
|---|---|
| 화면 | `src/pages/DataExplorerPage.tsx`(부분 편집), `src/components/search/TopicPanelV170.tsx`, `src/components/search/MatchEvidenceV170.tsx`, `src/styles/search-v170.css` |
| 규칙 | `src/data/search/searchMatchV170.ts`(동의어 확장·일치·묶음·점수), `src/data/search/searchAssetsV170.ts`(자산 읽기) |
| 사전 | `src/data/search/searchSynonymsV170.json`(46개 그룹), `scripts/v170/topic-rules-v170.json`(10개 주제) |
| 생성 | `scripts/v170/build-search-v170.mjs` → `public/data/search/v170/records-{VNM,BGD}.json`, `topics-{VNM,BGD}.json` |
| 엑셀 | `scripts/v170/search-dictionary-xlsx-v170.py`(사전 ↔ 엑셀 내보내기·반영, 반영 시 중복어·빈 그룹 거부) |
| 시험 | `src/data/search/searchMatchV170.test.ts`(19건) |
| 검수 | `scripts/v170/review-search-v170.mjs`(전후 캡처·6폭·일치 근거 내부 문구 검사) |
| 기타 | `src/data/spec/datasetSpecV159.ts`: 명세서 전체 행 읽기 함수 1개 추가 |

## 3. 데이터 원칙 준수

- 패널 값은 모두 빌드 단계에서 원자료로 계산. 화면에서 추정·보정하지 않음
  - 지표 최신값은 지표 1개만 사용(여러 지표 합산 없음)
  - 값을 못 찾은 행은 제외(0이나 '미상'으로 채우지 않음). 3행 미만 주제는 패널 없음(방글라데시 '산림')
- 원자료 기록 문구(일치 근거·검색 대상)에서 제외하는 것
  - 숫자만 있는 값, 파일명, 링크, 이메일, 내부 키·코드(`vcs_2040`, `PPI-VNM-…`, `VNM_lc_…`, `%YEARREF`)
  - 작업 메모: `audit:source-notes:v161` 패턴 군(현지조사·확인필요·해당 없음·용역사·미특정 등)
  - 빈값 표기('미확인', 'Not Available' 등)
  - 기록명 앞의 수집 방법 표기('현지조사, Offshore Wind Power')는 표기만 떼고 기록명은 남김
- 원자료 번호가 붙은 기술명('1 태양광 기술')은 번호를 떼고 이름만 사용(플랫폼 38개 기술 번호와 충돌 방지)
- 패널의 '{주제} 관련 N건'과 카드의 '원자료 N건 중 M건'은 같은 계산(단위 시험으로 확인)

## 4. 검증

- `npx tsc --noEmit` 0
- 단위 시험 `npm run test:unit`: 164 suites / 1,688 통과(신규 19건 포함, main 1,669건)
- ESLint(변경 파일, 경고 0 기준) 통과
- `CI=true` production 빌드(`GENERATE_SOURCEMAP=false`) 성공
- Static gate 중 브라우저 없는 감사(로컬): CI_PROCESS_GUARDS · V133_GENERATED_DATA · LARGE_SOURCE_TABLE · V133_CI_CONTRACT · V130_PROJECT_SCOPE · V130_MAP_DEDUP · V130_SEMANTIC_GEOGRAPHY · V131_PUBLIC_NAMING · V132_COMPOSITION · V132_BENCHMARK_FIT · V134_VISUAL_QA_CONTRACT · V136_WORKFLOW 모두 통과
- 실제 브라우저(production 형식 빌드, Chromium, `scripts/v170/review-search-v170.mjs`)

| 검색어(베트남) | 변경 전 | 변경 후 | 묶음(직접 / 원자료 / 분류만) | 패널 |
|---|---|---|---|---|
| 태양광 | 50개 | 47개 | 5 / 23 / 19 | 9행 |
| 풍력 | 49개 | 47개 | 5 / 17 / 25 | 8행 |
| 홍수 | 8개 | 13개('침수'·'flood' 포함) | 2 / 11 / 0 | 5행 |

  - 10개 주제 × 2개국 패널 행 19/19 주제 전부 `topics-<ISO3>.json`과 일치
  - '전체' 국가 '태양광': 77개, 패널 없음, 묶음 정상
  - '펼치기'로 '기후기술 분류만 일치' 묶음 열림, '가나다순' 선택 시 묶음 제목 없이 정렬
  - 일치 근거 줄의 내부 문구(요소 ID·raw 키·파일명·링크) 0건
  - 6폭(320·390·768·1024·1440·1920px) × (베트남·전체) 가로 넘침 0
- 필터 검사: 아래 5절
- 성능: 첫 검색 때 국가별 검색 자산을 1회 내려받음(베트남 6.8MB, 전송 압축 약 0.56MB / 방글라데시 1.7MB, 약 0.2MB). 문구 정규화는 내려받을 때 1회. 이후 검색어 1회 계산 20~70ms
- 기대값 변경 없음

## 5. 필터 검사

- `audit:source-notes:v161`(베트남, 상세 141·카드 141·홈·다운로드·지도): 실패 1건 = D-025 상세 '해당 없음'(원자료 분류값 37건). main에서도 같은 1건(V169 보고 4절) → 이번 변경과 무관
- 공개 문구 스캔(`public-wording-scan-v157`, 이 브랜치 빌드): 824곳 검사, 발견 0건 · 예외 0건 · 지도 대상 72개 활성

## 6. 제한·미완료

- 일치 근거의 원자료 문구는 원문 그대로(베트남어 지명 포함). 패널의 지역명은 '한글(현지명)'로 변환
- 헤더의 빠른 검색(Ctrl K)은 기존 색인을 그대로 씀. 이번 범위('데이터 찾기' 결과 화면) 밖
- '관련도순'은 URL에 저장하지 않음(검색어가 있으면 항상 기본값이라 새로고침해도 같음). 가나다순·조회순은 현행대로 URL에 저장
- 주제 사전은 10개(태양광·풍력·수력·바이오에너지·홍수·가뭄·폭염·산림·탄소시장·전력망). 주제 추가는 `topic-rules-v170.json`에 행 추가 후 재생성
- 전체 게이트(`finalize:v151`, `qa:acceptance:v162` 전체)는 PR의 CI `gate` 작업에서 실행

## 7. 전후 캡처(`reports/v170/screens/`, 1440px)

| 화면 | 전 | 후 |
|---|---|---|
| 태양광 검색 상단 | `solar-before-1440.png` | `solar-after-1440.png`(함께 찾은 말·패널) |
| 태양광 결과 카드 | `solar-before-1440-cards.png` | `solar-after-1440-cards.png`(묶음·일치 근거) |
| 태양광 패널 | - | `solar-after-1440-panel.png` |
| 태양광 접힌 묶음 | - | `solar-after-1440-folded.png` |
| 풍력 / 홍수 | `wind-before-1440*.png` / `flood-before-1440*.png` | `wind-after-1440*.png` / `flood-after-1440*.png` |
| 태양광 390px | - | `solar-after-390.png` |

## 8. 용역사 통보

- `reports/v170/VENDOR_NOTICE_V170.md`
