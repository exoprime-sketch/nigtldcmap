# 자료 갱신일 디렉터리(dataset directory) — 생성·검증 규칙 (V150-1)

## 왜 바꿨나
- V149의 `prebuild`는 빌드 시점에 `git log`로 자료별 갱신일을 만들었다. squash merge·shallow clone·환경에 따라 커밋 시각·이력이 달라져 홈 '최신순' 카드 구성이 바뀌었고, PR에서는 통과한 `audit:glossary:v134`가 main에서 실패했다(kV 도움말 트리거 누락, PR #19).
- 이제 빌드 산출물은 **소스 트리만으로** 결정된다. 갱신일은 데이터와 함께 커밋된 파일에서 읽고, 빌드는 git을 호출하지 않는다.

## 파일
| 파일 | 역할 |
|---|---|
| `public/data/vietnam/v2/dataset-directory.json` | 정본. `schema`, `generatedAt`, `sourceCommit`, `dateSource`, `items[152]`(`elementId`, `updatedAt`, `map`, `fingerprint`, `files[{path, sha256}]`). asset-integrity 대상 |
| `src/data/datasetDirectoryV149.json` | 앱이 번들에 포함하는 사본(`elementId`, `updatedAt`, `map`, `fingerprint`). CRA는 `public/`을 import할 수 없어 사본을 둔다. 홈 정렬(`sortHomeItemsV149`)과 `/api/usage`(`server/usage.cjs`)가 읽는다 |

## 생성 — `npm run build:dataset-directory:v150`
- `scripts/v150-1/dataset-directory-v150-1.mjs build` + asset-integrity 갱신.
- `updatedAt` 규칙(V149 의미 유지): 자료의 다운로드 파일이 마지막으로 바뀐 커밋의 **author date**(git 이력이 있을 때) → 없으면 이전 디렉터리 값 → 없으면 `manifest.generatedAt`(자료 발행 스냅샷). **빌드 시각으로 대체하지 않는다.**
- `fingerprint`는 카탈로그의 다운로드 자산 SHA-256 목록 해시(V149와 동일). `files[].sha256`은 실제 파일의 SHA-256.
- 실행 후 두 JSON과 `asset-integrity.json`을 함께 커밋한다.

## 검증 — `npm run verify:dataset-directory:v150`
- `prebuild`(`npm run build`)와 `finalize:v140`, CI static job에서 실행. git을 호출하지 않는다.
- 실패 조건: 카탈로그 자료가 디렉터리에 없음 / 디렉터리에만 있음, `fingerprint`·`map` 불일치, `updatedAt` 없음, 기록된 파일 SHA-256이 `downloads/**` 실제 파일과 다름, `src` 사본이 정본과 다름.
- 실패 메시지: `npm run build:dataset-directory:v150 실행 후 커밋`.

## 언제 재생성하나
- `public/data/vietnam/v2/downloads/**` 또는 `catalog.json`의 다운로드 자산이 바뀔 때. 코드만 바뀐 커밋에서는 재생성하지 않는다(갱신일이 움직이지 않는다).

## 결정성 증거
- `scripts/v150-1/home-order-v150-1.mjs --label <env>`가 홈 기본 순서·최신순 순서·디렉터리 최신순의 해시를 `reports/v150-1/determinism-v150-1.json`에 기록한다. 로컬(Windows)·CI(Linux, `determinism-ci.json` 아티팩트)·Vercel Preview의 해시가 같아야 한다.
