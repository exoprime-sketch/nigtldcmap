# V128 배포 가이드

## 목적

베트남 파일럿 production build를 재현 가능하게 검증하고 정적 호스팅에 배포하기 위한 계약이다. V158부터 배포처는 Vercel 하나다(production `nigtldcmap.vercel.app`, PR 브랜치는 Preview). GitHub Pages workflow는 2026-09-29 사용자 결정으로 삭제했다(사유 `reports/v158/DEPLOY_VERCEL_ONLY_V158.md`). custom domain, DNS, release tag는 별도 운영 승인과 실행 결과로 확인한다.

## 배포 전 필수 조건

- 승인된 release branch와 검토 가능한 commit SHA
- clean working tree
- `npm ci` 성공
- `npm run release:vietnam-pilot` 전체 PASS
- 필수 production browser screenshot 육안검토
- `_source/`, `node_modules/`, `build/`, 환경변수와 credential이 Git 추적 대상이 아님
- manifest, acceptance matrix, download reconciliation과 화면 수치 일치

```powershell
git branch --show-current
git status
git log --oneline --decorate -10
npm ci
npm run release:vietnam-pilot
git status --ignored
```

`build/`은 배포 artifact이지 source commit 대상이 아니다.

## Production build

```powershell
$env:GENERATE_SOURCEMAP = "false"
npm run build
```

artifact에 최소한 다음이 있어야 한다.

- `build/index.html`
- `build/static/js/`
- `build/static/css/`
- `build/data/vietnam/v2/`
- `build/assets/brand/`

배포 전에 JSON·GeoJSON 요청이 200과 올바른 content type을 반환하며 `index.html`로 대체되지 않는지 확인한다.

## 배포 경로 계약

### Origin root 또는 custom domain

공개 asset URL은 `src/utils/publicAssetUrlV128.ts`의 단일 resolver가 생성한다. `PUBLIC_URL`이 비어 있거나 `/`이면 다음 origin-root 계약을 사용한다.

```text
https://<custom-domain>/
https://<custom-domain>/data/vietnam/v2/manifest.json
https://<custom-domain>/assets/brand/...
```

custom domain의 document root에 `build/` 내용을 배포하고 정적 host가 `index.html`, `data/`, `assets/`, `static/`을 같은 origin root에서 제공해야 한다. 실제 domain과 DNS/CNAME 설정은 운영 승인 후 별도로 기록한다.

### 하위 경로 build (`PUBLIC_URL`)

배포처는 origin root(Vercel)지만, resolver는 하위 경로 배포도 계속 지원한다. 하위 경로 build는 `PUBLIC_URL=/nigtldcmap`처럼 생성한다. resolver는 source code와 manifest가 제공하는 root-relative data URL에 같은 prefix를 한 번만 적용한다. `audit:deployment:v128`은 임시 subpath build를 만들고 manifest, catalog, pack, semantic, download, map-index, ADM1, 송전망과 spatial asset의 HTTP 200·content type·HTML 오응답을 실제 browser에서 검사한다.

```powershell
$env:PUBLIC_URL = "/nigtldcmap"
$env:GENERATE_SOURCEMAP = "false"
npm run build
npm run audit:deployment:v128
```

## Hash routing과 404

현재 공개 화면은 hash route를 사용하므로 host는 기본적으로 `/index.html`을 제공하면 된다. 알 수 없는 hash는 앱의 공개 404 화면으로 처리한다. 현재 `public/404.html`이 없으므로 path-based route를 도입하거나 host가 임의 path를 앱으로 전달해야 할 경우 host 404 fallback을 별도로 구현·검증해야 한다.

## GitHub Actions와 Vercel

`.github/workflows/ci.yml`(검증만 하고 배포하지 않는다):

- main 대상 pull request, main push, 수동 실행
- Node 22, `npm ci`, Chrome runtime 확인
- release gate와 deployment/security audit, performance audit(권고)
- 성공 시 `build/`, 성공·실패 모두 reports artifact
- `_source/`, ZIP과 Excel은 reports artifact에서 제외

Vercel(배포):

- main → production(`nigtldcmap.vercel.app`), PR 브랜치 → Preview
- `vercel.json`의 `ignoreCommand`(`scripts/vercel-ignore-build.sh`)는 앱 경로가 바뀌지 않은 Preview build를 건너뛴다
- source map은 Vercel 프로젝트 환경변수로 끈다(저장소 밖 설정). 2026-09-29 production `asset-manifest.json`의 `.map` 항목 0개 확인
- GitHub Pages로 배포하는 workflow는 두지 않는다(`audit:workflow:v136`·`audit:ci-contract:v133`·`audit:visual-qa-contract:v134`의 `PAGES_WORKFLOW_RETIRED`가 확인)

권장 흐름:

```text
pull request → CI release gate + Vercel Preview Ready → 사용자 승인 → squash merge → Vercel production
```

## 배포 후 확인

- 홈 manifest 수치와 릴리스 일자
- 152개 데이터 찾기·상세 경로 smoke
- 지도 초기 배경, 13개 레이어 중 대표 전력·산림·재생에너지
- 다운로드 가능한 대표 CSV/JSON
- 이용안내와 404
- console application error 0
- JSON/GeoJSON/CSV 404 및 HTML 오응답 0
- `/data/vietnam/v2/manifest.json`의 `generatedAt`과 배포 승인 기록 일치

자동 smoke와 별개로 운영자가 공개 URL을 재검증할 수 있다.

```powershell
$env:PRODUCTION_URL = "https://nigtldcmap.vercel.app/"
npm run smoke:production:v128
```

배포 결과에는 실제 commit SHA와 environment만 기록한다. 확인되지 않은 live URL, PR 또는 tag를 문서에 미리 기재하지 않는다.
