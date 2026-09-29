# V158 배포 단일화 — GitHub Pages 배포 중단, Vercel 하나로 (chore/deploy-vercel-only)

작성 2026-09-29 · 기준 origin/main `fcc04f7`(#38 병합 직후)

## 결정
- 사용자 결정(2026-09-29, #38 판정): **대안 2 채택** — GitHub Pages 배포를 중단하고 배포처를 Vercel 하나로 둔다.
- 바뀌는 이전 결정: V150-1 "production은 Vercel, Pages 사이트는 요청 시에만 배포(workflow_dispatch)".

## 변경 사유
- **용량**
  - #38(방글라데시 적재) 뒤 production build는 948.6 MB(904.7 MiB), 파일 867개다.
  - Pages는 `build/` 전체를 올리므로 배포 대상이 사용자 기준 900 MB를 넘는다. GitHub Pages 공개 사이트 한도는 1 GB다.
  - 국가가 늘면(10개국 목표) 한도를 계속 넘는다. 국가 데이터를 빼는 대안 1은 해당 국가를 `live`로 바꾸는 순간 효력이 없어진다.
- **실사용 없음**: 2026-09-29 확인
  - 저장소에 Pages 사이트가 설정돼 있지 않다(`GET /repos/…/pages` 404). github-pages 배포 기록은 0이다.
  - `pages.yml`은 최근 3회(09-17, 09-21 두 번) 모두 배포 전 단계에서 실패했다(V136 게이트 2, 배포·보안 계약 1).
  - 실제 공개 사이트는 처음부터 Vercel(`nigtldcmap.vercel.app`)뿐이었다. 화면 변화는 0이다.
- **Vercel 수용**: #38 Preview(948.6 MB build)가 Ready였다.
  - 배포당 한도(용량·파일 수·최대 파일 크기)는 B2의 배포 방식 결정안에서 Vercel 기준으로 확인한다(사용자 지시).

## 변경 내용
| 파일 | 변경 |
|---|---|
| `.github/workflows/pages.yml` | 삭제(비활성 아님) |
| `docs/DEPLOYMENT_V128.md` | Pages 절 정리 → 'GitHub Actions와 Vercel' |
| `README.md` | 배포 문단 |
| `docs/ROLLBACK_V128.md` | Pages 보존 항목 → Vercel |
| `docs/v134/visual-qa-contract-v134.md` | 릴리스 경로 문장 |
| `CLAUDE.md` | **바꾸지 않음** — 사용자 지시(2026-09-29 병합 규칙 변경): CLAUDE.md 수정은 세션4 되돌리기 PR만 한다. 3행 "Vercel + GitHub Pages" → "Vercel"은 그 PR 병합 뒤 반영할 후속 항목 |

- `DEPLOYMENT_V128.md`
  - 하위 경로 build 계약(`PUBLIC_URL`, resolver)은 유지했다. 예시 주소는 Vercel이다.
  - Vercel source map 정책을 적었다: 프로젝트 환경변수로 끄며, production `asset-manifest.json`의 `.map` 항목 0개를 확인했다.

### 감사 스크립트 — 기대값 변경과 사유
`pages.yml`을 읽는 감사가 4개다. 파일이 없어지면 앞의 3개는 읽기 오류로 멈추고, 마지막 1개는 소스맵 정책 근거를 잃는다.
- **`audit:workflow:v136`**(release gate static)
  - 없앤 검사: `PAGES_CURRENT_RELEASE_GATE`·`PAGES_SMOKE_REPORT_PATH`
  - 새 검사: `PAGES_WORKFLOW_RETIRED` — `pages.yml` 없음, `deploy-pages`·`upload-pages-artifact`·`configure-pages`를 쓰는 workflow 0
  - 9 → 8검사
- **`audit:ci-contract:v133`**(release gate static)
  - `PAGES_WORKFLOW_CURRENT_RELEASE_GATE` → `PAGES_WORKFLOW_RETIRED`
  - `SOURCE_ZIP_REQUIRED_IN_CI`의 Pages 조건 제거(ci.yml 조건은 유지)
- **`audit:visual-qa-contract:v134`**(release gate static)
  - `PAGES_BLOCKING_RELEASE_JOB` → `PAGES_WORKFLOW_RETIRED`
  - 계약의 release workflow 목록은 `ci.yml` 하나다.
- **`audit:release:v136`**(release gate 본체)
  - `PAGES_CURRENT_RELEASE_GATE`(workflow 감사 요약의 `pagesCurrentGate` 교차 확인) → `PAGES_WORKFLOW_RETIRED`(`pagesWorkflowRetired === true`). 총 80검사는 유지된다.
  - 처음 전수 검색은 `pages.yml` 문자열 기준이라 이 교차 검사를 놓쳤다. 게이트 1회차에서 이 1건만 실패(79/80)해 고친 뒤 2회차를 돌렸다.
- **`audit:performance:v128`**(권고, CI `continue-on-error`)
  - `DEPLOYMENT_SOURCE_MAP_POLICY`의 근거를 `pages.yml` → `ci.yml`(게이트 build의 `GENERATE_SOURCEMAP: "false"`)로 옮겼다. 검사는 PASS다.
  - 이 감사의 `INITIAL_BUNDLE_REGRESSION`(기준 대비 +124%) 실패는 기존 상태이고 이번 변경과 무관하다.

### main CI 빨강 fix-forward — `audit:deployment:v128`
- **증상**: main CI Static gate가 #33(`aa8e171`)부터 `ROOT_RELATIVE_RUNTIME_ASSET_LITERAL` 실패다(`src/data/countryContext.ts` 3줄, `countryContext.test.ts` 4줄).
  - CLAUDE.md 규칙("main 빨강이면 다음 PR 전에 fix-forward")에 따라 이 PR에서 함께 고쳤다.
- **판단**
  - `countryContext.ts`는 V158-A에서 국가 데이터 루트를 한곳에 모은 레지스트리 모듈이다. 화면 코드는 `countryAssetPathV158()` → `publicAssetUrlV128`만 쓴다.
    - 절대 경로 도우미 `dataUrl`·`vietnamDataUrlV158`의 모듈 밖 사용은 0이다.
    - 하위 경로 실행은 `SUBPATH_RUNTIME_RESOLUTION`이 브라우저로 확인하며 PASS다.
  - 테스트 파일은 배포되지 않는다.
- **변경**: 문자열 검사 예외에 resolver 외 `src/data/countryContext.ts`와 `*.test.*`를 추가했다.
  - 규칙 자체(화면 코드의 `"/data/…"` 문자열 금지)는 그대로다.
- **결과**: `audit:deployment:v128` 9/9

## Pages 참조 전수(삭제 뒤)
- 저장소 전체를 `pages.yml|github-pages|deploy-pages|upload-pages-artifact|github.io|GitHub Pages`로 검색했다(`reports/`, 생성·무시 경로 제외).
  - workflow·게이트·스크립트: 위 5개 감사 정리 뒤 **0**. 남은 `deploy-pages` 등은 퇴역 검사의 패턴뿐이다.
  - 테스트(`src/**/*.test.*`, `e2e/`): **0**
  - 문서: 이 PR에서 정리했다. 남은 것은 결정 기록 문구뿐이다.
  - 코드 주석 2곳은 그대로 두었다: `src/components/data/public/DetailLocationMapV148.tsx` 37행, `src/data/publicUsageV149.ts` 10행.
    - 하위 경로 build의 동작을 설명하는 영어 주석이고, 동작과 무관하다. `src/**` 편집을 피했다.
  - `scripts/v144/element-review-plan-v144.mjs`의 `github.io`는 Climate Watch 외부 API 문서 주소라 무관하다.
  - 과거 보고서 6개의 Pages 언급은 기록이라 그대로 둔다.

## 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` · `npm run test:unit` | 0 · 564/564(55 suites) |
| `audit:security:v128` | 13/13 |
| 바뀐 감사 단독 실행 | deployment:v128 9/9 · workflow:v136 8/8 · ci-contract:v133 7/7 · visual-qa-contract:v134 6/6 · performance:v128 source map 정책 PASS(번들 회귀는 기존) |
| `finalize:v151` 1회차 | release 79/80 — `PAGES_CURRENT_RELEASE_GATE`(위 release:v136 항목)만 실패, 감사 명령 39개 전부 PASS |
| `finalize:v151` 2회차 | 통과 — release:v136 80/80 → role-split 53/53 → 분석 QA 기준선 41 이내(필수 실패 34 · 새 실패 0) → boundary-34·boundary-policy PASS |

- `finalize:v151`을 생략하지 않은 이유: 워크플로·문서만이 아니라 release gate에 속한 감사 스크립트(workflow·ci-contract·visual-qa-contract·release·deployment)가 바뀌었다.
