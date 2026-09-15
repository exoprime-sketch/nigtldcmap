# Vercel Deployment Storage — V140

Vercel이 Git 연동으로 만드는 배포 하나가 무엇을 저장하고, 그 저장량을 기능 삭제 없이 어떻게 줄이는지 기록한다. 측정은 2026-09-16, `feat/home-map-analysis-v139` HEAD `203d2ec` 기준이다.

## 1. 배포 하나가 담는 것

이 프로젝트는 `react-scripts build`가 만든 `build/`만 서빙한다. `build/` = `public/` 원본 복사 + `static/`(번들)이며, 그 외 파일은 들어가지 않는다.

| 층 | 내용 | 측정값 |
| --- | --- | --- |
| 빌드 컨테이너 checkout | git이 추적하는 파일 전체(4,367개) | 1,008 MB — `public/` 704 MB, `reports/` 291 MB, 나머지 13 MB |
| **배포 산출물(Deployment Storage 과금 대상)** | `build/data`(= `public/data`) | 705 MB |
| | `build/static` 소스맵 포함 | 12.0 MB (`.map` 8.9 MB) |
| | `build/static` 소스맵 제외 | 3.1 MB |
| | 합계 | **717 MB → 709 MB** |

산출물에 들어가지 않는 것(2026-09-16 재확인, `public/` 588개 파일 ↔ `build/` 비-static 파일 diff 0, 추가 파일 0):

- `reports/`(스크린샷 PNG 263 MB 포함), `docs/`, `scripts/`, `e2e/`, `tools/` — git에는 있으나 build가 읽지 않음
- `output/`, `tmp/`, `_source/`, `.staging/`, `.verify/`, `베트남데이터/`, `NIGT_*.zip`, `tmp/*.zip` — `.gitignore`(V140에서 `/output/`, `/tmp/` 추가)

`public/data` 자산은 모두 산출물에 있고, 이 문서의 어떤 조치도 그것을 빼지 않는다. `public/data/vietnam/v2/downloads/`(630 MB, 295개)는 UI가 fetch하지 않지만 `catalog.json`이 URL을 공개하는 계약이므로 **외부 저장소 이전은 별도 설계·검증 전에는 하지 않는다**(§6).

## 2. Deployment Storage 계산 방식과 기준선

Vercel은 보존 중인 배포마다 그 산출물을 저장하고 GB-month로 계산한다(Pro 정가 $0.10/GB-month). 기본 보존은 Hobby 30일, Pro는 Canceled 30일·Errored 90일·Pre-Production 180일·Production 1년이며, 만료 뒤에도 최근 10개 배포, 환경별 최근 20개 Ready 배포, 열린 브랜치의 최신 Preview는 예외로 남는다.

기준선(`npm run storage:ledger:v140`, `reports/v140/deployment-storage-ledger-v140.json` 1행):

| 항목 | 값 |
| --- | --- |
| Vercel 배포 수(GitHub Deployments 기록) | 67 — Preview 55, Production 12, 2026-08-28 ~ 09-15 |
| 배포당 산출물 | V137 데이터 전(~09-09) 157 MB → V137 후(09-13~) **716 MB** |
| 보존 중 산출물 추정 | **17.3 GB**(67개 전부 30일 이내) |
| 최근 3일 | 13개 배포 = 9.3 GB 추가 |

현 cadence(약 3.5회/일 × 0.72 GB)가 30일 보존으로 이어지면 정상 상태 약 75 GB(≈ $7.5/월)가 된다. 대시보드 수치는 **Usage → Deployment Storage → Projects(최근 30일)**에서 읽어 `--dashboard-gb`로 같은 행에 기록한다.

## 3. 적용한 것 (코드)

### 3.1 `.gitignore` — `/output/`, `/tmp/`

232 MB의 검토 캡처·PDF·E2E 묶음이 우연히 untracked였다. 규칙을 넣어 `git add .`로 checkout에 들어갈 길을 막았다.

### 3.2 `vercel.json` — `ignoreCommand`

```
[ "$VERCEL_ENV" = "preview" ] || exit 1; [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] || exit 1; git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- public src package.json package-lock.json tsconfig.json .eslintrc.json .gitattributes vercel.json '.env*'
```

- exit 0이면 Vercel이 빌드를 취소하고, 그 외에는 빌드한다. `git diff --quiet`는 나열한 경로에 변경이 없을 때 0을 돌려준다.
- **production은 항상 빌드한다.** 생략은 Preview에만 적용된다. 환경을 알 수 없으면 빌드한다.
- 나열한 경로는 `react-scripts build`가 읽는 전부다: `public/`, `src/`, 의존성·TS·ESLint 설정, checkout 바이트를 정하는 `.gitattributes`, 이 규칙 자체(`vercel.json`), `.env*`. `reports/`, `docs/`, `scripts/`, `e2e/`, `.github/`만 바꾼 커밋은 산출물이 바이트 단위로 같으므로 Preview를 만들지 않는다.
- 마지막 커밋의 부모(`HEAD^`) 대신 **같은 브랜치의 마지막 성공 배포 SHA**와 비교한다. 코드 커밋 뒤 보고서 커밋을 묶어 push해도 미배포 코드 변경을 놓치지 않는다. `VERCEL_GIT_PREVIOUS_SHA`가 없거나 얕은 clone에 그 커밋이 없으면 빌드한다.
- 대시보드의 Ignored Build Step 설정이 따로 있어도 `vercel.json`이 우선한다.

검증: `npm run verify:ignore-command:v140 -- --count 40`이 실제 명령 문자열을 각 커밋을 HEAD로 둔 detached worktree에서 재생한다(Windows는 Git Bash). 직전 커밋이 성공 배포였다는 가정의 40개 사례 외에 2·5개 커밋을 묶은 push, 이전 SHA 누락·조회 불가, 알 수 없는 환경을 검사한다. 현재 결과는 `reports/v140/ignore-command-verification-v140.json`에 기록한다.

이전 규칙의 40개 단일 커밋 시뮬레이션에서는 8개가 생략 대상이었다. 실제 절감률은 push 묶음과 마지막 성공 배포에 따라 달라진다. 프로젝트 환경변수만 바꾼 경우에는 Vercel 재배포 창에서 `Use project's Ignore Build Step`을 해제해 새 설정으로 빌드한다.

## 4. 적용 완료 — Vercel 환경변수 `GENERATE_SOURCEMAP=false`

2026-09-16 대시보드에서 Production·Preview에 `GENERATE_SOURCEMAP=false`를 저장했다. HTTP 403만으로는 파일 존재를 판정할 수 없으므로, 배포 Resources에서 파일 목록으로 검증했다. 이전 Preview `FdtXc7NJSFmNbG2TQCfB5JTHFyTN`에는 JS·CSS 소스맵이 있었고, 동일 커밋(`0ef6d69`)을 새 환경설정으로 재배포한 `8jpuQbMppCBoJdZqHi4cwf3cwdD1`은 1분 31초에 Ready가 됐다. `.js.map`, `.css.map` 검색 결과 모두 0건, 전체 정적 파일 **619 → 605개**. `.map`만 검색하면 지도 JSON까지 유사검색되므로 그 결과 수를 소스맵 수로 해석하지 않는다. 로컬 측정 기준 배포당 약 8.9 MB가 줄어든다. Production은 다음 빌드부터 적용된다.

재설정이 필요한 경우의 절차:

1. 대시보드: 프로젝트 **Settings → Environment Variables → Add** — Key `GENERATE_SOURCEMAP`, Value `false`, Environments **Production, Preview** 체크, Save. 다음 배포부터 적용.
2. CLI(로그인 필요): `vercel env add GENERATE_SOURCEMAP production` / `vercel env add GENERATE_SOURCEMAP preview`에 `false` 입력.

대안으로 저장소에 `.env.production`(`GENERATE_SOURCEMAP=false`)을 두면 Vercel과 로컬 `npm run build`가 모두 소스맵을 만들지 않는다. 로컬 디버깅에서 소스맵을 쓰는 경우가 있어 환경변수 쪽을 우선한다. 적용 뒤 확인: 새 배포의 **Resources → Static Assets**에 `.map`이 없고, `<preview-url>/static/js/main.*.js.map`이 404.

## 5. 적용 상태 확인 — Deployment Retention

2026-09-16 실제 대시보드 **Settings → Build and Deployment → Deployment Retention Policy**에서 아래 저장값을 확인했다. 이번 작업에서는 이미 적용된 값을 변경하지 않았다. **Security → Recently Deleted Deployments**에는 과거 Preview가 복구 가능 기간 29일로 표시되어 정리가 시작된 상태다.

| 상태 | 확인값 | 근거 |
| --- | --- | --- |
| Canceled | 1일 | 기존 적용값 |
| Errored | 1일 | 기존 적용값 |
| Pre-Production(Preview) | **7일** | PR 검토·`qa:role-split:v140` 재실행 창. 열린 브랜치의 최신 Preview는 예외로 보존됨 |
| Production | 30일 | rollback·release audit 창(`docs/ROLLBACK_V128.md`) |

이전 시뮬레이션: Preview 7일이면 보존 67 → 32개, 17.3 → 11.7 GB로 추정했다. 이는 Vercel 청구·중복저장 내부 집계를 확인한 값이 아니다. 2026-09-16 실제 팀 대시보드는 여전히 **18.72 GB / 10 GB**를 표시한다. 따라서 한도 초과 해결은 아직 확인되지 않았다. 보존 예외가 있으며 정책 적용·삭제 반영이 즉시 끝나지 않으므로, 이 설정만으로 10 GB 미만이 된다고 보장하지 않는다.

공식 근거: [시스템 환경변수](https://vercel.com/docs/environment-variables/system-environment-variables), [배포 보존정책](https://vercel.com/docs/deployment-retention), [보존정책 처리 시점](https://vercel.com/academy/optimize-your-vercel-account/retention-policies).

## 6. 하지 않은 것 — `downloads/` 외부 이전

630 MB가 산출물의 88%이고 gzip으로 20 MB가 되지만, `catalog.json`의 `url`·`sha256`·`deliveryMode`와 QA 게이트(`audit-vietnam-deployment-v128.mjs:120`, `role-split-qa-v140.mjs:430`, `audit-vietnam-navigation-v125.mjs:483`)가 `/data/vietnam/v2/downloads/…` 절대 경로를 계약으로 삼는다. `tools/vietnam_etl/download_delivery_v137.py`의 `ObjectStorageAdapter`가 이전 경로를 이미 갖고 있으나, 저장소 선택·URL 계약·게이트 수정·무결성 재검증이 따르므로 별도 설계와 검증 없이는 실행하지 않는다.

## 7. 추이 기록 절차

정책 변경(§4, §5) 뒤 같은 명령으로 행을 추가한다. Vercel Usage는 하루 단위로 갱신되므로 변경 다음 날 이후에 읽는다.

```bash
git fetch --all
npm run storage:ledger:v140 -- --retention-preview-days 7 --static-mb 3.1 \
  --dashboard-gb <Usage 화면의 Deployment Storage GB> --note "after retention change"
```

행마다 배포 수, 배포당 산출물, 정책 아래 보존 추정 GB, 대시보드 GB가 남고, 항목 간 차이가 정책 효과다. 배포당 산출물이 줄었는지는 새 배포의 **Resources → Static Assets** 합계와 `outputMbPerDeployment.latest`를 비교한다.

## 8. 명령

```bash
npm run verify:ignore-command:v140   # ignoreCommand 재생 검증 (reports/v140/ignore-command-verification-v140.json)
npm run storage:ledger:v140          # 저장공간 추이 1행 기록 (reports/v140/deployment-storage-ledger-v140.json)
```
