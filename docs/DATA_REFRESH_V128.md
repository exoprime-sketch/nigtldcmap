# V128 데이터 갱신 가이드

이 문서는 베트남 공개 데이터 갱신의 실행 순서다. 상세 상태 정책과 acceptance 기준은 `VIETNAM_DATA_STATUS_POLICY_V128.md`, `VIETNAM_RELEASE_ACCEPTANCE_V128.md`를 함께 적용한다.

## 1. Branch와 기준선

새 data refresh branch를 만들기 전에 main의 승인된 기준 commit과 기존 manifest SHA를 기록한다. 작업 중인 사용자 변경을 삭제하거나 reset하지 않는다.

```powershell
git branch --show-current
git status
git log --oneline --decorate -10
npm ci
npm run finalize:v128
```

기준 release gate가 실패하면 새 원본을 처리하기 전에 회귀를 복구한다.

## 2. Source ZIP 위치

새 원본은 다음 제한 영역에 보관한다.

```text
_source/vietnam/v128/<공식-수집패키지>.zip
```

현재 v124 generator의 원본을 그대로 재현할 때 사용하는 경로:

```text
_source/vietnam/v124/vietnam-data(4).zip
```

새 source registry에 원본 파일명, SHA-256, 공식 기관·URL, 조회일, license·이용조건·attribution, 수집 방식과 supplemental 여부를 기록한다. `_source/` 전체, ZIP과 Excel은 Git 및 Pages artifact에 포함하지 않는다.

## 3. ETL

현재 공개 v2 생성 명령:

```powershell
npm run build:data:v124
```

새 ZIP 이름이나 위치가 generator 계약과 다르면 입력 경로를 명시적으로 갱신하고 그 변경을 검토한다. 임의로 기존 ZIP을 다른 내용으로 바꾼 채 같은 hash·버전으로 취급하지 않는다.

ETL 필수 동작:

- filename decoding과 Unicode NFC
- observation/entity/metadata 정규화
- template·placeholder·missing과 populated 행 구분
- 공개 승인 projection
- deterministic sorting과 duplicate 검사
- row balance와 SHA-256
- pack, catalog, search index, download 생성

## 4. Data gate

```powershell
npm run audit:data:v124
npm run audit:data-acceptance:v128
npm run audit:download-reconciliation:v128
```

검토:

- source workbook 수와 원본 행 변화
- framework/accounted 152와 unexplained 0
- 각 요소의 public populated 행과 최종 처분
- status-only 요소의 설명된 처분
- download generation error, empty download, unexplained disabled 0
- 화면 행과 safe download 행 reconciliation
- asset integrity와 malformed JSON

수치 변화는 무조건 오류도, 자동 승인도 아니다. 공식 원천 변화로 설명되는지 acceptance matrix에 기록한다.

## 5. Semantic build

```powershell
npm run build:semantic:v125
npm run audit:semantic:v125
npm run audit:limitations:v127
npm run audit:data-summary:v127
npm run audit:chart-interaction:v127
```

새 indicator·measure·dimension은 명시적 mapping으로 검증한다. note를 runtime에서 매번 임의 파싱하지 않는다. 사용자 label, 단위, 기간, selector, tooltip과 원자료 표 행을 reconciliation한다.

## 6. Map gate

공간자료가 변한 경우 공식 source, version, license, attribution, geometry 유효성, feature 수와 ADM1 join을 기록한다.

```powershell
npm run audit:map:v124
npm run audit:runtime:v124
npm run audit:map-ux:v126
npm run audit:map-public-content:v126
npm run audit:cross-navigation:v126
```

기존 공간자산을 의도적으로 갱신하지 않는 refresh에서는 레이어 13, feature 2,904, ADM1 63, join failure 0을 유지한다. 원천 없는 geometry, 국가값 지역 복제와 결측 0 대체를 금지한다.

## 7. Build와 screenshot QA

```powershell
npm run build
npm run audit:home:v128
npm run audit:routes:v128
npm run audit:public-screens:v128
```

production build를 실제 브라우저에서 390px, 768px, 1024px, 1440px로 확인한다. 홈, finder, 대표 상세, status-only, 지도, download, guide와 404 screenshot을 `reports/v128/screenshots/`에 갱신한다.

필수 확인:

- console application error 0
- JSON/GeoJSON 404와 HTML 오응답 0
- 공개 title/status/source/period/download 일치
- horizontal overflow 0
- keyboard와 mobile interaction
- 내부 technical token 0

## 8. 최종 release gate

```powershell
npm run release:vietnam-pilot
```

전체 데이터·화면 gate에 이어 root/project-path 배포, 공개파일 보안, bundle 성능 회귀와 production build를 검증한다. 보고서와 screenshot을 검토하고 `git diff --check`를 실행한다. audit 조건을 삭제하거나 결과를 고정해서 PASS시키지 않는다.

실제 공개 URL이 발급된 뒤에는 별도로 실행한다.

```powershell
$env:PRODUCTION_URL = "https://<public-host>/<optional-project-path>/"
npm run smoke:production:v128
```

## 9. Commit, PR, tag

1. 데이터/asset, 공개화면, release gate 변경을 논리적으로 분리한다.
2. `_source`, `node_modules`, `build`, credential이 staging되지 않았는지 확인한다.
3. branch를 origin에 push한다.
4. 데이터 책임자와 공개/권리 책임자의 acceptance 후 PR을 만든다.
5. 보호된 main에 merge하고 동일 merge SHA의 CI를 확인한다.
6. 배포 확인 후 승인된 naming policy에 따라 annotated tag를 만든다.

이 문서는 현재 PR, merge 또는 tag가 이미 생성됐음을 의미하지 않는다.
