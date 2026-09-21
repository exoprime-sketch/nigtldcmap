## 무엇을 바꿨나

데이터 지도의 행정경계 기본을 **2025-07-01 시행 34개 성·시**(결의 202/2025/QH15)로 바꾸고, 개편 전 63개는 토글로 남겼습니다.

**값은 하나도 바꾸지 않았습니다.** 공개 지표는 모두 원자료가 개편 전 63개 기준으로 발표한 값이고, 34개로 다시 세려면 없는 값을 만들어야 합니다. 그래서 경계선(표시)과 값(원자료)을 분리했습니다.

- 경계선·한글 지명·대체 경계·저작권·상태 문구 → 선택한 기준을 따름
- 값 색상지도·요약·팝업 → 원자료 기준(개편 전 63개) 그대로
- 토글 아래 상시 고지: "경계선은 2025-07-01 시행 34개 성·시입니다. 값은 원자료가 발표한 개편 전 63개 성·시 기준이며 34개로 합산하지 않습니다."
- 구조로도 차단: 34개 지물은 `unitCode`만 갖고 `adm1Code`를 갖지 않아 63개 키 값이 결합될 수 없음

## 주요 변경

- **34개 경계 자산** `public/data/vietnam/v2/geometry/vnm-adm1-34.geojson` — 63개 경계를 대응표대로 위상 병합(shapely `unary_union`). 면적 보존 오차 **0.0ppm**, 원천에 없는 좌표 **0개**, 구성원 63개 전수·무중복. 원천이 빈롱·벤째·짜빈 접점에 남긴 **0.1215km² 틈은 메우지 않고** 매니페스트에 면적·사유 기록(임의 경계 생성 금지)
- **'행정경계 기준' 토글** — 34개 기본, 63개 선택 가능, 브라우저에 선택 저장
- **계약 모듈** `src/data/map/adminBoundaryV151.ts` — 34개 단위표·한글 라벨 34개·구성원 역참조. Huế는 개명 반영해 '후에'(개편 전 라벨 '트어티엔후에'는 유지)
- **`crosswalk34` Hà Tĩnh 키 버그 수정**(V150 인계) — 행정단위어 `tinh`을 위치 무관 제거해 'Hà Tĩnh'가 'ha'로 접히던 문제. 34개 그룹·63개 구성원 불변, 생성 자산 무변경
- **문구** — 이용안내·지도 안내·물 유향·기후 시나리오·한계 등록부·용어집의 '63개 성·시'에 '개편 전' 명시
- **게이트** `npm run audit:boundary-34:v151`(정적 21 + 브라우저 11), `npm run finalize:v151`(= `finalize:v140` + 경계34 정적 게이트). `finalize:v140` 자체는 변경하지 않음

## 검증

| 항목 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:unit` | 220건 통과 (V151 신규 9건 포함) |
| `audit:boundary-34:v151` (브라우저 포함) | **32 PASS · 1 INFO · 0 FAIL** |
| 반응형 320/390/768/1024/1440/1920 | 가로 넘침 0 |
| 동일출처 요청 실패 · 앱 콘솔 오류 | 0 · 0 |

실제 Chromium + production 빌드 정적 서버로 확인: 첫 진입 34개 선택 → `vnm-adm1-34.geojson` 요청, 63개 토글 → `vnm-adm1-63.geojson` 요청·고지 문구 전환, 새로고침 후 선택 유지, 확대 시 34개 기준 한글 지명 렌더. 스크린샷 3장은 `reports/v151/`.

### ⚠️ `finalize:v140`은 이 실행 환경에서 완주하지 못했습니다 (merge 선행조건)

원인은 코드가 아니라 **실행 환경의 네트워크 정책**입니다. 프록시가 배경지도 타일 호스트 `tiles.openfreemap.org:443`을 403으로 거부하고, 배경지도는 V150에서 이미 main에 들어간 기본 켜짐 기능이라 지도 화면을 여는 모든 브라우저 감사의 `CONSOLE_ERROR`가 실패합니다.

- `origin/main`(3357632)을 별도 워크트리에 빌드해 같은 감사를 돌린 결과도 **동일하게 FAIL**입니다(`map-tooltip:v132`·`map-compare:v135`·`finder-scroll:v136` 3종 확인). 기준선이 이미 실패하므로 V151 회귀가 아닙니다.
- 게이트를 개별 실행: **21 PASS · 7 FAIL**. 실패 7건은 전부 지도 화면 감사이고 `CONSOLE_ERROR` 1건만 실패하며, 그 내용은 100% `net::ERR_TUNNEL_CONNECTION_FAILED`, 앱 예외 0건입니다.
- `qa:analysis:v140:baseline`(41건 기준선): 새 실패 43건이 전부 `screenLoaded`이며, 41건은 타일 차단·2건은 컨테이너 부하로 인한 `selectOption` 타임아웃입니다. **기준선 41건은 늘지도 줄지도 않았고(resolved 0), 값·분석 검사는 모두 기존과 같습니다.** 같은 실행에서 `public-copy:v134`가 상세 152경로를 전부 로드해 통과한 것이 이를 뒷받침합니다.

**게이트 기대값은 하나도 바꾸지 않았습니다.** 근거와 재현 명령은 `reports/v151/GATE_ENVIRONMENT_V151.md`에 있습니다. merge 전에 타일 호스트가 열린 환경(로컬·CI·Vercel Preview)에서 `npm run finalize:v151`·`npx playwright test`·`npm run release:vietnam-pilot` 확인이 필요합니다.

## 범위 밖·남은 일

- **34개 단위로 발행된 원자료(C-012·C-019·C-022)를 34개 경계에 직접 칠하기** — 레이어 계약·팝업·범례까지 손대야 해 V152 이후. 현재는 기존대로 소속 63개 경계에 표시하고 그 사실을 명시
- **34개 단위 값 집계** — 하지 않습니다(데이터 조작 금지)
- **배경지도 타일 실제 표시** — 실행 환경 프록시가 `tiles.openfreemap.org`를 차단해 타일 그림 자체는 확인하지 못했습니다. 토글 동작과 데이터·경계 레이어 유지는 확인(감사에 INFO로 분리 기록). **Vercel Preview에서 확인 필요**
- **Vercel Preview · Linux 시각 baseline · 실기기 iOS/Safari** — PR 생성 후
- `scripts/audit-vietnam-map-layout-v129.mjs`의 `-v129` 저장 키(게이트 밖 레거시), B-017 지도 보류(변경 없음)

## 환경 보정 1건 (기대값 변경 아님)

실행 환경이 root라 `scripts/v125/browser-runtime.mjs`의 헤드리스 브라우저가 기동조차 못했습니다(`Running as root without --no-sandbox is not supported`). root·리눅스일 때만 `--no-sandbox`를 붙이고 러너별 추가 플래그는 `V125_BROWSER_ARGS`로 주입하게 했습니다. **감사 기대값은 하나도 바꾸지 않았고**, "실행 실패"가 "실제 검사 수행"으로 바뀐 것뿐입니다(map-copy:v136 8 FAIL → 11 PASS). 개발자 로컬과 비-root CI는 동작 불변.

문서: `reports/v151/REVIEW_V151.md`, `PROGRESS.md`, `CHANGELOG.md`(Unreleased — V151)

merge는 사용자 승인 대기입니다.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NobvCdFpt4qoUgAWePQzRb
