# REVIEW V150-1 — 자료 갱신일 결정화(prebuild git 의존 제거) + CI 시간 단축

- 브랜치 `fix/v150-1-dataset-directory-determinism` ← `origin/main` 6a66308(#19).
- 수치는 실제 실행 결과이며, "실행 성공"과 "내용 완성"을 구분해 적는다.

## 1. 문제와 목표
- V149 `prebuild`가 빌드 시점에 `git log`로 자료 갱신일을 만들어 환경(squash merge·shallow clone·OS)에 따라 홈 '최신순' 카드 구성이 달라졌고, PR에서 통과한 `audit:glossary:v134`가 main에서 실패했다(kV, PR #19).
- 목표: 빌드 산출물을 소스 트리만으로 결정. 같은 PR에서 CI 실행 구조를 바꿔 시간을 줄이되 검사 항목·기대값은 유지.

## 2. 변경
| 영역 | 내용 |
|---|---|
| 자료 갱신일 | `scripts/v150-1/dataset-directory-v150-1.mjs build/verify`. 정본 `public/data/vietnam/v2/dataset-directory.json`(`sourceCommit`·`generatedAt`·`dateSource`·`items[].files[].sha256`) + 앱 번들 사본 `src/data/datasetDirectoryV149.json`. 규칙은 V149와 동일(다운로드 파일 마지막 변경 커밋의 author date → 이전 값 → manifest 스냅샷; 빌드 시각 사용 금지). `prebuild`=verify(git 미호출), `finalize:v140`·CI static에 포함. V149 `build-dataset-directory.cjs` 삭제, ignoreCommand 감시 경로 `scripts/v150-1`. 규칙 문서 `docs/DATASET_DIRECTORY_V150-1.md` |
| glossary 감사 | 찾기 경로에서 152개 카드를 모두 로드한 뒤 검사(`FINDER_ALL_CARDS_AUDITED`). 홈이 고르는 8개와 무관하게 카드 빌더가 만드는 전체 범례·단위·제공기관 문자열이 대상 |
| 드러난 공개 문구 결함 | 미등록 약어 4개 등록(BAFU 스위스 연방환경청, KETEP 한국에너지기술평가원, TCCRE 기후변화 대응 지출 유형분류(CPEIR 2015), TT:CLEAR UNFCCC 기술이전 정보센터). 카드 `provider`에 남아 있던 내부 메모 "(레코드별 상이 — 1.2_entity 참조)"를 카드 빌드에서 제거(E-018·E-020; 화면 규칙 `publicSourceOrganizationV136_1`과 동일) |
| CI 구조 | `ci.yml`: `concurrency`(같은 ref 이전 실행 취소) · `static`(tsc, verify, `release --group static`=빌드+단위테스트+정적 감사 14개, deployment/security, 홈 순서 해시) · `browser` 4 shard(`release --group browser --shard k/4`, 빌드 아티팩트 공유, 각 shard가 자기 결과·보고서만 업로드) · `summary`(`release --results-dir`로 40개 명령 결과 병합 후 **같은 79개 check**) · `analysis`(role-split + analysis QA 기준선). 문서·보고서만 바뀐 PR은 browser/summary/analysis 생략(static은 항상). `pages.yml` dispatch 전용 |
| 릴리스 감사 | `--group/--shard/--shard-out/--results-dir` 추가. shard는 자기 명령을 모두 실행(단일 실행은 첫 실패에서 멈춤 유지). 판정 절은 수정하지 않음 |
| 계약 감사 | `ci-contract:v133`·`visual-qa-contract:v134`·`workflow:v136`이 sharded 형식(`--group static` / `--group browser --shard ${{ matrix.shard }}/4` / `--results-dir`)을 현재 게이트로 인정(단일 형식도 계속 인정) |
| analysis QA | `--baseline reports/v150/analysis-qa-baseline-v150.json`(41건: 항목 ID + 실패 검사). 기준선에 없는 항목·검사만 exit 1, 해결된 항목은 `resolved`로 보고 |
| role-split QA | 스크린샷 5장 저장을 버퍼 캡처 후 5회 재시도, 실패해도 판정은 계속(Windows UNKNOWN 대응) |
| CLAUDE.md | merge 조건 문장 교체(로컬 finalize + Vercel Preview Ready + 승인; main CI 빨강이면 fix-forward), 리사이저·감사 재시도 원칙, 디렉터리 메모 |

## 3. 검증
- `npx tsc --noEmit` 0 · `test:unit` 21 suites / 214 passed · `verify:dataset-directory:v150` 152 items/294 files.
- 로컬 sharded 실행(Windows, 같은 빌드): static 14/14(62 s, 빌드 포함) · browser-1 5/5(259 s) · browser-2 6/6(253 s) · browser-3 5/5(264 s) · browser-4 10/10(239 s) · summary **79/79 PASS**(1차 실행에서는 static의 계약 감사 2개·glossary가 실패해 원인을 고친 뒤 재실행: 계약 감사의 sharded 인정, 용어 4개, 제공기관 메모). 이어서 `qa:role-split:v140` 52/52, `qa:analysis:v140:baseline` 41건 = 기준선 41, 신규 0, 해결 0 → PASS. `verify:dataset-directory:v150` PASS. 즉 `finalize:v140` 구성요소 전부 통과(v136 단일 실행 대신 같은 40개 명령의 sharded 실행)
- 단일 실행(main 6a66308 보고서) ↔ sharded 요약 대조 `reports/v150-1/ci-shard-parity-v150-1.json`: **parity true** — 79개 check 이름·판정 동일, 차이 0
- 결정성 `reports/v150-1/determinism-v150-1.json`: 로컬 Windows 2회(빌드 2회) 기본 순서 해시 `846caae1dae978ba`, 최신순 해시 `073215a4a32b3185` 동일. CI(Linux) `determinism-ci.json` 아티팩트·Vercel Preview 해시는 PR 실행 후 추가
- e2e 홈 spec: smoke·responsive·visual 40/40(후보 빌드)
- CI 실측(PR #20, 3차 push `a5ab3f3`, Linux): static **5분 04초**(tsc·검증·빌드·단위테스트·정적 감사 14·deployment/security·홈 해시), analysis 10분 20초(role-split 52/52 + analysis QA 41=기준선 PASS), browser shard 1 4분 47초 PASS · shard 2 6분 32초 PASS · shard 3 6분 24초 FAIL · shard 4 10분 02초 FAIL → summary FAIL.
  - shard 3·4 실패 원인: `entity-cards`(B-007)·`temporal-depth`(B-003~B-007)에서 CDP `Runtime.evaluate`/`Page.navigate` 시간 초과(19~30 s). B-003~B-007은 13.5 MB `vnm-v124-pack-005`(CCKP 63개 성·시 × 시나리오)를 base64 복호·SHA-256 2회·gunzip·JSON 파싱해야 준비되며 로컬 2.4~2.9 s, CPU ×4 스로틀 12.6~13.1 s(프로파일: parseContentJson 831 ms, sha256Hex 378 ms, normalizeTextV126 234 ms). 공유 러너에서는 20~25 s 예산을 넘긴다(단일 job 시절 PR #18에서는 통과 — 경계값).
  - 조치: `scripts/v125/browser-runtime.mjs`에 `V125_TIMEOUT_SCALE`(CDP 명령·폴링 예산 배수) 추가, CI browser shard·role-split에 3 적용. 검사 항목·기대값은 불변(느린 기계에 시간만 더 줌). 1차·2차 push는 static에서 각각 deployment 감사(작은 지도 절대 경로·서브패스 `/api/usage`)와 홈 해시 단계(러너 Chrome 미지정)로 실패 → 원인 수정.
  - 후속 과제(성능): pack-005 분할 또는 요소별 지연 로딩 — 사용자 기기에서도 B-003~B-007 초기 준비가 가장 느리다(PR-D 또는 별도 PR).

## 4. 기대값 변경(사유)
| 파일 | 변경 | 사유 |
|---|---|---|
| `audit-vietnam-ci-contract-v133`, `audit-vietnam-visual-qa-contract-v134`, `audit-vietnam-workflow-v136` | `npm run finalize:v136` 단일 줄 외에 sharded 3형식을 현재 게이트로 인정 | 실행 구조 변경, 검사 항목 동일(parity 파일) |
| `audit-vietnam-glossary-v134` | 찾기 152개 카드 로드 + `FINDER_ALL_CARDS_AUDITED` 추가 | 검사 대상 확대(완화 아님) |
| `qa:analysis:v140` | `--baseline` 옵션(기본 실행은 종전과 동일) | PR-D 이관 41건을 기준선으로, 신규 실패만 차단 |

## 5. 미완료·주의
- Linux 시각 baseline(Playwright visual spec)은 여전히 Windows에서 갱신 불가.
- CI 시간 목표(static ≤ 6분, shard ≤ 12분)는 PR 실측으로 판정.
