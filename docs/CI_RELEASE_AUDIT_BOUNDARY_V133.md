# V133 CI 릴리스 감사 경계

## 목적

Git에 추적하지 않는 원자료 ZIP 검증과 GitHub Actions에서 실행할 수 있는 공개 산출물 검증을 분리한다. CI나 Pages 배포를 통과시키기 위해 `_source` 또는 원본 ZIP을 Git에 추가하지 않는다.

## 로컬 원자료 감사

`npm run audit:source-local:v133`은 원자료를 보유한 개발자 환경에서만 실행한다.

- ZIP 내 Excel 149개
- ZIP SHA-256과 커밋된 manifest·quality report의 해시 일치
- ETL 원본 행·처리 행 balance
- `_source` ignore 규칙
- source ZIP Git 미추적

이 감사는 CI release gate의 의존성이 아니다.

## CI 생성 데이터 감사

`npm run audit:generated-data:v133`은 원자료 ZIP을 읽지 않고 커밋된 공개 자산만 검증한다.

- framework·accounted 152, unexplained 0
- manifest·catalog·quality report 행 balance
- V2 공개 자산 전체와 `world-countries.geojson`의 SHA-256
- 다운로드 파일 존재·비어 있지 않음·record count
- 지도 12개 레이어·2,900개 feature/scope·가짜 geometry 0
- semantic contract·element asset 152
- Git에 추적된 `_source` 0

`npm run generate:asset-integrity:v133`은 `public/data/vietnam/v2` 전체와 canonical 배경지를 실제 바이트에서 읽어 `asset-integrity.json`을 결정적으로 재생성한다. 해시 문자열을 수동 편집하지 않는다.

## Workflow 계약

CI와 Pages는 다음 순서를 release blocker로 사용한다.

1. `npm ci`
2. `npm run finalize:v133`
3. `npm run build`

Pages build는 repository 변수 `PUBLIC_URL`이 있으면 그 값을, 없으면 repository subpath를 사용한다. 배포 후 production smoke 결과는 `reports/v133` artifact로 보관한다.

## 운영 원칙

- 원자료를 바꾸었을 때는 로컬 source audit과 ETL을 먼저 실행한다.
- 생성 자산을 바꾸었을 때는 asset-integrity generator를 실행한 뒤 generated-data audit을 실행한다.
- CI에서 source audit을 호출하지 않는다.
- raw ZIP, `_source`, `node_modules`, `build`를 artifact 또는 Git 추적 대상에 포함하지 않는다.
