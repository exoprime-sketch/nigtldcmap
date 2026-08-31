# 개도국 기후기술 협력 데이터 플랫폼

정책연구자, 국제협력 기획자, 기업과 연구기관이 개도국의 기후·에너지·정책·사업·기관·지역 데이터를 찾고 해석할 수 있도록 만든 React/TypeScript 플랫폼입니다. 현재 공개 provider는 베트남 파일럿입니다.

## 현재 제공 범위

- 공개 데이터 프레임워크 152개 항목
- 데이터 찾기와 요소별 분석 상세화면
- 검증된 공간자료 13개 레이어와 베트남 63개 성·시 경계
- 공개 CSV/JSON 선택 다운로드
- 공통 의미 모델에 따른 측정항목·분류·단위·기간 표시
- 접근 가능한 interactive 시계열 chart와 데이터별 유의사항
- 데이터 이용안내, 공개 상태와 다운로드 상태의 일관된 표현

릴리스 수치는 코드 상수로 복제하지 않고 `public/data/vietnam/v2/manifest.json`, `catalog.json`, `map-index.json`에서 파생합니다. 상세 수용 결과는 `reports/v128/` 산출물을 기준으로 확인합니다.

## 공개 화면

- 홈
- 데이터 찾기
- 데이터 상세
- 데이터 지도
- 데이터 다운로드
- 데이터 이용안내
- 404

구형 dataset detail, 국가 비교와 insights 화면은 베트남 v2 공개 흐름의 별도 진입점으로 사용하지 않습니다. 대응 가능한 요청은 데이터 찾기·상세·다운로드로 안전하게 전환합니다.

## 기술 구성

- React 18, TypeScript 4.9
- Create React App / `react-scripts` 5.0.1
- MapLibre GL 기반 지도와 로컬 SVG fallback
- 정적 JSON·GeoJSON·CSV 및 gzip-base64 JSON envelope
- Node.js audit와 Python semantic builder

주요 데이터 구조:

```text
public/data/vietnam/v2/
  manifest.json
  catalog.json
  framework-coverage.json
  quality-report.json
  rights-matrix.json
  asset-integrity.json
  map-index.json
  packs/
  downloads/
  geometry/
  spatial/
  semantic/
```

원본 ZIP과 Excel은 `_source/`에만 두며 Git 또는 `public/`에 포함하지 않습니다. 공개 자산은 ETL이 생성한 whitelist projection만 사용합니다.

## 로컬 시작

Node.js와 npm이 설치된 환경에서 실행합니다.

```powershell
npm ci
npm start
```

production build:

```powershell
npm run build
```

`build/`와 `node_modules/`는 commit하지 않습니다.

## 검증

현재 릴리스 전체 gate:

```powershell
npm run release:vietnam-pilot
```

이 명령은 V128 수용검사, root와 project subpath 배포경로, 공개파일 보안, bundle 성능 회귀와 production build를 모두 차단형 gate로 실행합니다. 화면·데이터 자체의 전체 회귀만 다시 확인할 때는 `npm run finalize:v128`을 사용합니다.

V128 개별 감사:

```powershell
npm run audit:data-acceptance:v128
npm run audit:home:v128
npm run audit:routes:v128
npm run audit:download-reconciliation:v128
npm run audit:public-screens:v128
npm run audit:release:v128
```

Release audit는 V127 회귀, 152개 데이터 수용, 홈 수치, 공개 경로, 다운로드 reconciliation, production browser 화면과 build를 순차 검증합니다. 감사 조건을 삭제하거나 고정값으로 바꾸어 통과시키지 않습니다.

## 배포

공개 asset은 `publicAssetUrlV128` 단일 resolver를 통과합니다. root domain, custom root domain과 GitHub Pages project path `/nigtldcmap/`에서 같은 source code로 manifest, catalog, pack, semantic, download, 지도 JSON·GeoJSON을 요청합니다. `PUBLIC_URL`은 build 환경에서만 지정하며 resolver가 중복 prefix를 방지합니다.

`.github/workflows/ci.yml`은 main 대상 PR, main push와 수동 실행에서 전체 release gate를 수행하고 build 및 V128 reports artifact를 보존합니다. `.github/workflows/pages.yml`은 main 또는 수동 실행에서 같은 source SHA의 gate를 다시 통과한 뒤 배포용 build를 별도로 생성해 GitHub Pages에 배포하고 공개 URL smoke를 수행합니다. 실제 repository Pages 설정과 custom domain/DNS 승인은 [배포 문서](docs/DEPLOYMENT_V128.md)의 사전조건을 따릅니다.

배포된 URL을 별도로 점검할 때:

```powershell
$env:PRODUCTION_URL = "https://<public-host>/<optional-project-path>/"
npm run smoke:production:v128
```

## 운영 문서

- [배포](docs/DEPLOYMENT_V128.md)
- [운영 점검](docs/OPERATIONS_V128.md)
- [데이터 갱신](docs/DATA_REFRESH_V128.md)
- [롤백](docs/ROLLBACK_V128.md)
- [공개 정보구조](docs/VIETNAM_PILOT_PUBLIC_INFORMATION_ARCHITECTURE_V128.md)
- [데이터 상태 정책](docs/VIETNAM_DATA_STATUS_POLICY_V128.md)
- [릴리스 수용 기준](docs/VIETNAM_RELEASE_ACCEPTANCE_V128.md)

## 릴리스 원칙

- feature/release branch에서 작업하고 main에 직접 push하지 않습니다.
- 전체 감사와 browser screenshot 검토 후 PR을 생성합니다.
- PR, merge, Pages 배포와 tag는 각각 실제 완료 여부를 확인해 기록합니다.
- 원천 license·attribution과 프로젝트 publication decision을 구분합니다.
- 비밀번호, API key, credential은 데이터가 아니며 공개하지 않습니다.
