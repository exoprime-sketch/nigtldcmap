# 베트남 데이터 갱신 실행서 V128

## 1. 사전 조건

- Node.js와 npm, 프로젝트가 요구하는 Python runtime을 준비한다.
- 작업은 새 feature/release branch에서 시작한다.
- `node_modules/`, `build/`, `_source/`, 원본 ZIP·Excel은 Git에 포함하지 않는다.
- 기존 `public/data/vietnam/v1/`과 `public/data/vietnam/v2/` 릴리스는 검증 없이 삭제하거나 덮어쓰지 않는다.
- 작업 전 `git status`가 예상한 상태인지 확인하고 기준 commit을 기록한다.

```powershell
git branch --show-current
git status
git log --oneline --decorate -10
npm ci
```

## 2. 새 source ZIP 위치와 등록

원본은 공개 디렉터리가 아니라 다음 staging 영역에 둔다.

```text
_source/vietnam/v128/<공식-수집패키지>.zip
```

현재 v124 재현 입력을 그대로 재실행할 때는 generator가 참조하는 불변 경로를 유지한다.

```text
_source/vietnam/v124/vietnam-data(4).zip
```

새 ZIP에는 별도 source registry entry를 만들고 다음을 기록한다.

- 원본 파일명과 SHA-256
- 제공기관과 공식 URL
- 조회일
- license·이용조건·attribution
- 수집 방식과 supplemental 여부
- 기존 원본을 대체하는지 추가하는지

원본 ZIP과 Excel은 Git 및 `public/`에 넣지 않는다. 비밀번호, API key, credential이 발견되면 데이터와 분리하고 공개 projection에서 제외한다.

## 3. ETL 실행

현재 재현 가능한 데이터 생성 명령은 다음과 같다.

```powershell
npm run build:data:v124
```

생성기는 filename decoding, Unicode NFC, observation/entity/metadata normalization, 공개 투영, deterministic sorting, 중복·행 균형, SHA-256, 압축 pack, catalog, 검색 index와 다운로드를 수행해야 한다.

실행 후 원본 행 수, observation/entity/metadata/placeholder, public populated 행 수와 source workbook 149개를 이전 릴리스와 비교한다. 예상하지 않은 감소나 상태 변화가 있으면 다음 단계로 진행하지 않는다.

## 4. 데이터 감사

```powershell
npm run audit:data:v124
npm run audit:data-acceptance:v128
npm run audit:download-reconciliation:v128
```

필수 확인:

- framework/accounted 152, unexplained 0
- source workbook, row balance, duplicate, malformed JSON, asset hash
- 152개 final disposition
- `blocked-by-error` 0
- 공개 표시 행과 안전 다운로드 행 reconciliation
- 다운로드 생성 오류·설명 없는 비활성 0

`reports/v128/vietnam-data-release-acceptance-v128.*`와 다운로드 reconciliation 보고서의 변경을 검토한다.

## 5. 의미 모델 생성과 감사

```powershell
npm run build:semantic:v125
npm run audit:semantic:v125
npm run audit:limitations:v127
npm run audit:data-summary:v127
npm run audit:chart-interaction:v127
```

새 indicator·dimension은 명시적 mapping 또는 검증된 override를 추가한다. note 문자열을 runtime에서 임의 파싱하지 않는다. 단위가 다른 series를 동일 Y축에 섞지 않고 값이 없는 observation을 populated count에 포함하지 않는다.

## 6. 지도 생성과 감사

새 공간원천을 추가한 경우 source/version/license/attribution, feature count, 빈·중복·유효 geometry와 조인 결과를 먼저 기록한다. 실제 공간원천이 없으면 레이어를 만들지 않는다.

```powershell
npm run audit:map:v124
npm run audit:runtime:v124
npm run audit:map-ux:v126
npm run audit:map-public-content:v126
npm run audit:cross-navigation:v126
```

검증된 기준은 레이어 13개, feature 2,904개, ADM1 63개, join failure 0이다. 의도한 공간 갱신이 아니라면 이 수치 변화는 중단 사유다.

## 7. 공개 화면과 검색 감사

```powershell
npm run build
npm run audit:home:v128
npm run audit:routes:v128
npm run audit:public-screens:v128
```

홈 수치가 manifest와 일치하는지, catalog 152개가 검색·상세에서 열리는지, 사용자용 제목·상태·출처·기간·다운로드가 일치하는지 확인한다. 구형 경로가 공개 stale 화면을 렌더링하지 않는지 확인한다.

## 8. Screenshot QA

production build를 로컬 정적 서버에서 열고 390px, 768px, 1024px, 1440px로 확인한다. V128 필수 screenshot 목록을 `reports/v128/screenshots/`에 생성한다.

- 홈 desktop/mobile
- 데이터 찾기 기본/필터
- A-002, A-005, E-012, E-019 상세와 미수집 상태
- 빈 지도, 전력, 산림, 재생에너지
- 다운로드 기본/선택
- 이용안내와 404

Screenshot마다 console application error 0, JSON/GeoJSON 200, HTML 오응답 0, 가로 overflow 0을 함께 기록한다. 이미지를 육안으로 검토하여 빈 패널, 잘린 문구, 가짜 차트가 없는지 확인한다.

## 9. 최종 release audit

```powershell
npm run audit:release:v128
# 또는 동일 release gate 별칭
npm run finalize:v128
```

release audit는 V127 전체 회귀, 데이터 수용, 홈, 경로, 다운로드 reconciliation, 공개 화면과 production build를 순차 실행한다. 모든 summary가 `PASS`, 실패 건수가 0이어야 한다.

## 10. Branch, PR, tag 절차

1. 변경을 데이터 수용, 공개화면, release gate 단위로 검토한다.
2. 생성 자산·보고서·문서만 staging하고 `_source`, `node_modules`, `build`가 없는지 확인한다.
3. 승인된 commit 메시지로 local commit을 만든다.
4. release branch를 origin에 push한다.
5. 데이터·UX·license 검토자가 acceptance 보고서와 screenshot을 승인한 뒤에만 PR을 생성한다.
6. main 직접 push 또는 직접 merge는 하지 않는다.
7. CI release gate 통과 후 보호된 merge 절차를 사용한다.
8. merge commit을 기준으로 annotated release tag를 생성하고 manifest의 릴리스 일자와 맞춘다.

```powershell
git status
git diff --check
git push origin <release-branch>
```

실패한 audit를 삭제하거나 조건을 고정값으로 바꾸지 않는다. 원인을 데이터, 코드, 공개문구, 자산 또는 환경 문제로 분류하고 수정한 뒤 전체 release audit를 다시 실행한다.
