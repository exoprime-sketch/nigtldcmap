# V128 운영 가이드

## 운영 범위

현재 공개 provider는 베트남 파일럿 하나다. 운영의 목표는 데이터 수치, 화면, 지도, 다운로드와 출처가 같은 릴리스 기준을 유지하도록 하는 것이다.

## 단일 기준 자산

- `manifest.json`: 항목·다운로드·지도·행 수와 릴리스 일자
- `catalog.json`: 152개 요소 상태·출처·기간·권리·자산 연결
- `framework-coverage.json`: 요소 계상
- `quality-report.json`: 행 균형·경고
- `rights-matrix.json`: 원천 이용조건
- `asset-integrity.json`: hash와 파일 무결성
- `map-index.json`: 지도 레이어·feature
- V128 acceptance와 download reconciliation 보고서

운영자가 화면 숫자만 직접 수정해서 자산과 불일치를 만들지 않는다.

## 정기 점검

### 매 배포

```powershell
npm ci
npm run release:vietnam-pilot
```

확인 항목:

- framework/accounted 152, unexplained 0
- final disposition 152/152, blocked 0
- 다운로드 생성 오류·설명 없는 비활성 0
- 지도 레이어 13, feature 2,904, ADM1 63, join failure 0
- 공개 DOM technical token 0
- production browser runtime error와 JSON/GeoJSON HTML 오응답 0

### 배포 후 smoke

Pages workflow는 배포가 성공하면 출력된 공개 URL을 사용해 smoke를 자동 실행한다. 운영자가 다시 실행할 때:

```powershell
$env:PRODUCTION_URL = "https://<public-host>/<optional-project-path>/"
npm run smoke:production:v128
```

- 홈 live count와 데이터 찾기 검색
- A-002·E-012 상세와 interactive tooltip
- 전력 infrastructure preset, 범례와 blank map 여부
- 단일 요소 CSV/JSON 다운로드 파일 생성
- 데이터 이용안내와 404
- JSON·GeoJSON 요청의 HTTP 200, JSON 대신 HTML 0, console error 0

152개 route, 산림·재생에너지 지도와 390px/768px/1024px/1440px 반응형 검증은 `finalize:v128`의 공개화면·지도 회귀 감사 및 보존된 screenshot에서 별도로 확인한다.

### 배포·보안·성능 개별 점검

```powershell
npm run audit:deployment:v128
npm run audit:security:v128
npm run audit:performance:v128
```

성능 gate는 V128 baseline 대비 entry JS/CSS gzip 회귀가 10%를 넘지 않는지 확인한다. 절대 용량만으로 기능을 삭제하지 않고 지도 code splitting, 선택 element shard, 검색 index lazy load와 source map 비공개 계약을 함께 확인한다.

### 주기 점검

- 공식 source URL의 유효성 및 license/attribution 변화
- 릴리스 일자와 기준연도 표시
- 외부 tile 실패 시 로컬 basemap/fallback
- 다운로드 파일의 content type, UTF-8과 row reconciliation
- accepted gap의 공식 source acquisition 가능성
- npm dependency 취약점은 기능 변경과 분리해 위험 평가

## 상태 운영

내부 상태와 사용자용 상태를 분리한다.

| 내부 | 사용자 |
|---|---|
| actual, public-authorized | 데이터 제공 |
| partial | 일부 데이터 제공 |
| schema-only | 입력 양식 |
| data-entry-planned | 입력 예정 |
| not-collected | 원자료 미수집 |

다운로드 badge는 “다운로드 가능”, “화면에서만 제공”, “다운로드 자료 없음”만 사용한다. 화면 전용에는 source license 또는 공개정책에 따른 사용자용 이유가 있어야 한다.

## 장애 분류와 대응

### 화면 전체 또는 JavaScript 실패

1. 현재 배포 SHA와 직전 정상 SHA를 기록한다.
2. browser console과 실패 asset URL을 보존한다.
3. `build/index.html`의 JS/CSS 파일이 실제 배포됐는지 확인한다.
4. 즉시 복구가 필요하면 `ROLLBACK_V128.md`를 따른다.

### JSON 대신 HTML 또는 404

1. 요청 URL, status, content type을 기록한다.
2. origin-root와 `/nigtldcmap` base-path 혼용 여부를 확인한다.
3. manifest URL과 실제 artifact 경로를 대조한다.
4. fallback rewrite가 `/data/` 요청까지 `index.html`로 바꾸지 않는지 확인한다.

### 빈 지도

1. map-index, ADM1 geometry, 선택 layer asset 응답을 확인한다.
2. container width/height, fallback visibility, console error를 확인한다.
3. 국가 평균 복제나 0 대체로 임시 복구하지 않는다.
4. 검증된 공간자산 자체를 수정하기 전에 runtime·base path 문제를 분리한다.

### 다운로드 불일치

1. catalog의 다운로드 상태·record count와 파일을 대조한다.
2. 공개 화면 행과 safe projection 행을 reconciliation한다.
3. technical provenance 노출 여부를 확인한다.
4. 오류 파일은 배포하지 말고 직전 정상 artifact를 유지한다.

## 로그와 증거

운영 기록에는 다음만 저장한다.

- 실행 시각과 operator role
- branch, commit SHA, audit summary
- artifact digest와 environment
- 실패 URL/status/content type
- screenshot과 재현 단계
- rollback 또는 수정 commit

비밀번호, API key, token, raw credential, 개인정보가 포함된 원본 파일은 issue·로그·screenshot에 첨부하지 않는다.

## 원본과 공개 자산 보호

- `_source/`는 로컬 제한 영역이며 Git, Pages artifact, 일반 공유 파일에 포함하지 않는다.
- 원본 ZIP·Excel을 `public/`로 복사하지 않는다.
- 공개 asset은 deterministic ETL과 whitelist projection으로만 생성한다.
- 원천 license와 publication decision을 별도 보존한다.
- 기술 provenance는 local audit 또는 제한된 관리 경로에만 둔다.

## 변경 승인

데이터, 공개문구, 지도, download와 배포 설정 변경은 독립된 검토가 가능하도록 commit을 나눈다. release audit 실패를 삭제·완화해서 배포하지 않는다. main 직접 push, force push와 배포환경 수동 덮어쓰기를 피하고 보호된 PR·deployment 절차를 사용한다.
