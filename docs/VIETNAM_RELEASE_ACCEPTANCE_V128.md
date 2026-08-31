# 베트남 파일럿 릴리스 수용 기준 V128

## 릴리스 기준선

V128 수용검사는 다음 기준을 출발점으로 한다.

| 항목 | 기준 |
|---|---:|
| source workbook | 149 |
| framework/accounted element | 152 / 152 |
| unexplained element | 0 |
| actual | 126 |
| public-authorized | 18 |
| partial | 3 |
| schema-only | 1 |
| data-entry-planned | 1 |
| not-collected | 3 |
| data-bearing element | 147 |
| public populated row | 37,375 |
| downloadable element | 114 이상 |
| map layer / feature | 13 / 2,904 |
| ADM1 feature / join failure | 63 / 0 |

최종 수치는 릴리스 시점의 manifest, catalog와 생성 보고서에서 다시 계산한다. 이 표는 검사를 통과시키기 위한 hard-code가 아니라 예상치와 실제값의 차이를 검토하기 위한 기준이다.

## 수용 산출물

- `reports/v128/vietnam-data-release-acceptance-v128.csv`
- `reports/v128/vietnam-data-release-acceptance-v128.json`
- `reports/v128/vietnam-download-availability-v128.csv`
- `reports/v128/vietnam-download-reconciliation-v128.json`
- `reports/v128/vietnam-source-acquisition-backlog-v128.json`
- `config/data-publication/vietnam-v128-gap-disposition.json`
- `reports/v128/screenshots/`의 17개 production QA 이미지

Acceptance matrix는 152개 요소 각각의 workbook, package/data/public 상태, observation/entity/public 행, 표시·다운로드, renderer, 지도, 출처·기간, limitation, 사용자 상태, 최종 처분과 결과를 포함한다.

## 데이터 수용 기준

다음을 모두 만족해야 한다.

- framework, catalog, pack, acceptance matrix가 같은 152개 element ID를 가진다.
- 요소 미계상, 설명 없는 빈 데이터, 화면에만 존재하는 미계상 데이터가 없다.
- populated 행은 공개 화면 또는 설명된 display-only 상태로 계상된다.
- 실제 데이터에는 분석 renderer와 출처가 있다.
- final disposition은 허용된 값 중 하나이며 152/152가 지정된다.
- `blocked-by-error`, provided-but-unexplained-empty가 0이다.
- row balance와 asset integrity가 통과한다.

## 비 populated 요소의 수용

| 요소 | 판정 원칙 |
|---|---|
| C-020, C-021, C-023 | 공식 구조화 데이터 미확보 시 `not-collected-accepted`; 후보 출처와 후속 수집만 기록 |
| E-011 | populated 행이 없고 입력 예정이면 `data-entry-planned-accepted` |
| E-013 | 실제 값 없이 양식만 있으면 `schema-only-accepted` |

공식 자료를 확보하지 못한 상태는 설명된 gap이며 전체 릴리스를 차단하지 않는다. 다른 요소 값을 복제하거나 추정값으로 채우지 않는다.

## 다운로드 수용 기준

- data-bearing와 downloadable 요소 차이를 전수 분류한다.
- display-only 요소의 사용자용 제한 사유 coverage가 100%다.
- 다운로드 생성 오류, 빈 다운로드, 설명 없는 비활성은 0이다.
- 공개 화면 행과 safe CSV/JSON 행이 reconciliation된다.
- 표준 다운로드에 technical provenance 필드가 없다.
- 모든 다운로드 URL이 실제 200 응답과 올바른 content type을 반환한다.

## 공개 화면 수용 기준

### 홈과 검색

- 홈 수치와 manifest/catalog/map-index가 일치한다.
- 현재 베트남 파일럿 범위를 명시한다.
- 주요 데이터가 실제 catalog 요소이고 `element-detail`로 이동한다.
- 전역 검색과 데이터 찾기에서 152개 요소가 검색된다.

### 상세

- production browser에서 152개 상세 경로가 열린다.
- 데이터가 있는 요소는 목적, 핵심현황, 분석, 단위, 기간, 출처, 유의사항, 접힌 원자료, 다운로드 상태를 제공한다.
- status-only 요소는 가짜 chart나 0값을 표시하지 않는다.
- 제목·상태·다운로드 badge가 acceptance matrix와 일치한다.

### 지도

- 13개 검증 레이어를 순차 활성화할 수 있다.
- 주 분석 1개, 보조 2개 제한과 프리셋 5개를 유지한다.
- blank map, 0 대체, 국가값 지역 복제, selector/단위 불일치가 없다.
- 지도에서 상세·다운로드로 이동할 수 있다.

### 이용안내·404

- guide는 데이터 범위, 상태, 기간, 결측, 다운로드, 이용조건, 지도 정확도, 63개 성·시, 릴리스 일자와 문의를 포함한다.
- 알 수 없는 경로는 404와 복구 동작을 제공한다.
- 구형 경로는 stale 화면이 아니라 승인된 공개 경로로 전환한다.

## 보안·공개 콘텐츠 기준

공개 DOM, tooltip, aria-label, HTML comment와 기본 다운로드에서 원본 파일·시트·행, 내부 record/indicator ID, API 매개변수, pack/shard, 해시, publication decision과 내부 버전명을 노출하지 않는다. 내부 상태명도 사용자 문구로 변환한다.

## 품질·접근성 기준

- 390px, 768px, 1024px, 1440px에서 horizontal overflow 0
- keyboard navigation, visible focus, form label, heading, aria status 확인
- 차트 tooltip과 지도 control keyboard 접근
- 색상만으로 정보 구분 0
- loading, empty, error, 404 상태 제공
- console application error 0
- JSON/GeoJSON 404·HTML 오응답, 깨진 source/download/internal link 0

## 실행 명령과 승인

```powershell
npm ci
npm run finalize:v127
npm run audit:data-acceptance:v128
npm run audit:home:v128
npm run audit:routes:v128
npm run audit:download-reconciliation:v128
npm run audit:public-screens:v128
npm run audit:release:v128
npm run build
```

모든 audit summary가 `PASS`이고 production screenshot을 육안 검토한 뒤 다음 역할이 승인한다.

- 데이터 책임자: 계상·출처·상태·gap disposition
- 공개/권리 책임자: license, attribution, display/download 사유
- 제품 책임자: 정보구조, 문구, 접근성, 반응형
- release 책임자: commit, branch, CI, tag

## 허용 gap과 blocker

허용 gap:

- 공식 자료를 아직 확보하지 못했지만 출처 후보와 수집방향이 기록된 `not-collected-accepted`
- 실제 값이 없는 승인된 `schema-only-accepted`, `data-entry-planned-accepted`
- 원천 이용조건 또는 공개정책에 따른 설명된 display-only

Blocker:

- `blocked-by-error`
- 계상 누락·설명 없는 empty 또는 download disabled
- 행 균형·자산 hash 실패
- 실제 데이터 renderer·출처 누락
- 공개 technical provenance
- 깨진 route, JSON/GeoJSON 오응답, runtime error
- production build 또는 V127 회귀 실패
