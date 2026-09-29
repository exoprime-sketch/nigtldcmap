# V158-ZIP 기대값 변경 기록 — 요소별 다운로드 사전 압축

CLAUDE.md 규칙: 게이트·감사·테스트의 기대값을 현재값에 맞춰 통과시키지 않는다. 바꿀 때는 사유를 이 파일에 적는다.

공통 사유: 사용자 결정(2026-09-30, `docs/DEPLOYMENT_CAPACITY_V158.md` 7절) — 요소별 다운로드를 `downloads/<id>.zip` 하나(안에 `<id>.json`·`<id>.csv`)로 배포하고, 기존 주소(`<id>.json·csv`)는 404를 허용한다. 아래 검사는 검사하는 내용(파일이 있다, 열린다, 레코드 수가 맞다)은 그대로 두고, 읽는 곳만 ZIP 안으로 옮겼다.

| 대상 | 이전 기대 | 새 기대 | 사유 |
|---|---|---|---|
| `role-split-qa-v140` `DOWNLOAD_A002_STATIC_ASSET` | `downloads/a-002.csv` HEAD 200 | `downloads/a-002.zip` HEAD 200 | 대표 정적 다운로드가 서빙되는지 보는 검사. 파일이 ZIP으로 바뀌었다. 보고 키 `staticCsv*` → `staticZip*` |
| `audit-vietnam-deployment-v128` 필수 자산 | `downloads/a-002.json`(JSON 해석) | `downloads/a-002.zip` | 배포물에 대표 다운로드가 있는지 보는 검사. ZIP은 JSON으로 해석하지 않는다(아래 탐색 감사가 ZIP 서명·형식으로 확인) |
| `audit-vietnam-navigation-v125` `BROKEN_DOWNLOAD_LINK` | JSON·CSV 자산마다 파일 존재·HTML 아님·레코드 수 | ZIP 자산마다 ZIP 서명, 안쪽 JSON·CSV 해석, 파일별 레코드 수 = 카탈로그 | 검사 대상 파일이 ZIP 안으로 옮겨졌다 |
| `audit-vietnam-navigation-v125` 브라우저 자산 | `downloads/c-016.json` 200·JSON·`application/json` | `downloads/c-016.zip` 200·ZIP 서명·`application/zip` | 같은 이유. 로컬 정적 서버에 `.zip` MIME(`application/zip`)을 추가했다(Vercel은 원래 같은 형식으로 서빙) |
| `audit-vietnam-finder-v125` 다운로드 레코드 수 | JSON·CSV 파일 각각 | ZIP 안 JSON·CSV가 서로 같고 카탈로그와 같다 | 같은 이유 |
| `analysis-qa-v140` 카드 수치 재계산 | `downloads/<id>.json` | `downloads/<id>.zip` 안 `<id>.json` | 같은 이유. 재계산 규칙은 그대로 |
| `audit-vietnam-map-tooltip-v132`·`verify-download-roundtrip-v137`·`source-diff-v156` | 다운로드 JSON·CSV 파일 | ZIP 안 같은 파일 | 같은 이유(`source-diff`는 기존 JSON이 있으면 그것을, 없으면 ZIP을 읽어 전환 전후 트리를 비교) |
| `tools/etl/countries/bgd/verify_country_v2.cjs` 스키마·레코드 검사 | 다운로드 JSON 키·CSV 머리행·받을 수 있는 레코드를 파일에서 | 같은 검사를 ZIP 안 파일에서. `DOWNLOAD_ASSET_HASHES`에 ZIP 안 파일 크기·해시 대조 추가 | 같은 이유 |
| 단위 테스트 14개 파일의 다운로드 고정 자료 | `downloads/<id>.json` | `src/data/testing/downloadZipV158.ts`로 ZIP 안 JSON | 같은 이유. 테스트 기대값은 바꾸지 않았다(레코드 동일) |
| `dataset-directory-v150-1` `updatedAt` 규칙 | 다운로드 파일(JSON·CSV)을 바꾼 마지막 커밋 | 같음. 다만 요소의 ZIP을 추가하면서 같은 커밋에서 그 요소의 JSON·CSV를 지운 커밋(포장만 바뀜)은 제외 | 포장 전환이 전 요소의 갱신일을 바꾸지 않게. 기존 이력에서는 새 규칙과 이전 규칙의 날짜가 149요소 모두 같다(검증) |

## 결정안 문서와 달라진 점
- `docs/DEPLOYMENT_CAPACITY_V158.md` 5절은 "팩은 바뀌지 않는다"고 적었다. 실제로는 팩이 요소 행의 복사본을 싣고 그 안에 `downloadAssets`가 있어 팩 해시가 바뀐다. 레코드는 바뀌지 않았다(`source-diff`: 152요소 변화 0, 값 변경 0).
