# 게이트 실행 환경 기록 — V151 (클라우드 컨테이너)

이 PR의 작업은 로컬 PC가 아니라 클라우드 컨테이너에서 수행했다. 여기서 `finalize:v140`을 끝까지 통과시킬 수 없었고, 그 이유는 **코드가 아니라 실행 환경의 네트워크 정책**이다. 이 문서는 그 사실을 기대값 변경 없이 기록한다.

## 1. 차단 내용

이 컨테이너의 아웃바운드 HTTPS는 에이전트 프록시를 거친다. 프록시가 배경지도 타일 호스트를 거부한다.

```
$ curl -sS "$HTTPS_PROXY/__agentproxy/status"
"recentRelayFailures": [
  { "kind": "connect_rejected",
    "detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)",
    "host": "tiles.openfreemap.org:443" }, …
]

$ curl -sS -o /dev/null -w "%{http_code}\n" https://tiles.openfreemap.org/planet
curl: (56) CONNECT tunnel failed, response 403
```

배경지도(OpenFreeMap 벡터 타일)는 V150에서 이미 `origin/main`에 들어간 기능이고 기본값이 '켬'이다. 따라서 지도 화면을 여는 모든 브라우저 감사에서 타일 요청이 실패하고, 실패가 브라우저 콘솔 error로 기록돼 `CONSOLE_ERROR` 검사가 실패한다.

## 2. 실패가 환경 때문임을 확인한 근거

### 2.1 실패한 콘솔 오류의 내용이 전부 네트워크 실패다

각 감사 보고서의 `CONSOLE_ERROR.actual`을 종류별로 접은 결과:

| 감사 | 오류 건수 | 서로 다른 종류 |
| --- | --- | --- |
| `map-focus:v133` | 126 | `Failed to load resource: net::<err>` 1종 |
| `map-popup:v133` | 30 | `Failed to load resource: net::<err>` 1종 |
| `map-layer-distinction:v133` | 59 | `Failed to load resource: net::<err>` 1종 |
| `map-tooltip:v132` | 35 | `Failed to load resource: net::<err>` 1종 |

모두 `net::ERR_TUNNEL_CONNECTION_FAILED`이며 애플리케이션 예외·스크립트 오류는 **0건**이다.

### 2.2 `origin/main`에서도 똑같이 실패한다

`origin/main`(3357632)을 별도 워크트리에 체크아웃해 production 빌드 후 같은 감사를 실행했다.

```
$ git worktree add /tmp/mainwt origin/main && cd /tmp/mainwt && npm run build
$ npm run audit:map-tooltip:v132
{"type":"summary","audit":"map-tooltip:v132","status":"FAIL","passed":7,"failed":1,
 "total":8,"failedChecks":["CONSOLE_ERROR"], …}
```

기준선이 이미 실패하므로 V151 변경으로 생긴 회귀가 아니다.

### 2.3 동일출처 요청은 전부 성공한다

V151 게이트가 요청 실패를 동일출처/외부로 나눠 측정한다.

- `SCREEN_SAME_ORIGIN_REQUEST_FAILURE`: `[]` (PASS)
- `SCREEN_CONSOLE_ERROR`(네트워크 실패 제외): `[]` (PASS)
- `SCREEN_EXTERNAL_TILE_HOSTS_BLOCKED`: `["tiles.openfreemap.org"]` (INFO)

즉 사이트 자신의 자산은 하나도 실패하지 않았고, 막힌 것은 외부 타일 호스트뿐이다.

## 3. 하지 않은 것

- **게이트 기대값을 바꾸지 않았다.** `CONSOLE_ERROR`의 기대값 `[]`를 유지했고, 네트워크 실패를 제외하도록 기존 감사 스크립트를 고치지도 않았다. 그렇게 하면 동일출처 자산이 깨졌을 때도 통과해 버린다.
- `finalize:v140`의 구성도 바꾸지 않았다. V151 게이트는 `finalize:v151`이라는 별도 스크립트로 더했다.

## 4. 한 것

- `scripts/v125/browser-runtime.mjs`: 컨테이너를 root로 실행할 때 헤드리스 브라우저가 **기동조차 못 하던** 문제를 고쳤다(`Running as root without --no-sandbox is not supported`). root·리눅스에서만 `--no-sandbox --disable-dev-shm-usage`를 붙이고, 러너별 추가 플래그는 `V125_BROWSER_ARGS`로 받는다. 기대값 변경이 아니라 "실행 실패"를 "실제 검사 수행"으로 바꾼 것이다(`map-copy:v136`: 8 FAIL → 11 PASS).
- 이 환경에서 WebGL은 소프트웨어 렌더가 필요해 다음으로 실행했다.

```
export V125_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium
export V125_TIMEOUT_SCALE=3
export V125_BROWSER_ARGS="--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader"
```

- 환경 때문에 FAIL로 덮어써진 감사 보고서 JSON은 커밋하지 않고 `origin/main` 기준 상태로 되돌렸다. 이 저장소에 남는 감사 기록이 실제보다 나쁘게 보이지 않게 하기 위해서다.

## 5. merge 전에 필요한 것

`tiles.openfreemap.org`에 접근 가능한 환경(로컬 PC·GitHub CI·Vercel Preview)에서 아래를 확인해야 한다.

```
npm run finalize:v151     # = finalize:v140 + 경계34 정적 게이트
node scripts/v137/build-candidate-v137.mjs --data public/data/vietnam/v2 && npx playwright test
npm run audit:boundary-34:v151     # 브라우저 검사 포함
npm run release:vietnam-pilot
```

그리고 Vercel Preview에서 배경지도 타일이 실제로 그려지는지, 34개 경계 위에 배경지도가 겹쳐 보이는지 눈으로 확인해야 한다. 이 컨테이너에서는 타일 그림 자체를 확인하지 못했다.
