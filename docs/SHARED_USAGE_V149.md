# 홈 조회순·인기 지도 연결 안내

## 구현과 운영의 구분

V149는 공용 집계 API와 화면 연결까지 구현했다. Redis 계정 생성, 저장소 연결, 환경변수 입력, 배포는 수행하지 않았다. 현재 로컬 4328은 미연결 상태의 안내를 보여준다. 4329는 개발 검사용 응답이며 실제 조회 통계가 아니다.

구조: 상세보기/주 분석 지도 열람 → 동일 출처 POST /api/usage → Vercel Node 함수 → 공용 Redis → GET /api/usage → 홈 정렬/인기 지도.

- 코드: api/usage.js, server/usage.cjs, src/data/publicUsageV149.ts.
- 프런트는 집계용 비밀값에 접근하지 않는다. REACT_APP_ 접두사로 비밀값을 설정하지 않는다.
- 별도 분석 대시보드나 새 탭은 추가하지 않았다. 이용자 안내는 기존 데이터 이용안내에 포함했다.
- 연동 규격은 Upstash Redis REST API다. 호환 REST URL과 토큰이 있어야 한다. Blob은 집계 저장소로 사용하지 않는다.

## 운영자가 연결할 항목

1. Vercel 프로젝트에 사용 승인을 받은 Upstash Redis 저장소를 연결한다. 요금제·계정·운영 권한 선택은 운영자가 진행한다.
2. 다음 값을 Vercel 프로젝트의 **Production 서버 환경변수**로 설정한다.

| 이름 | 값 |
| --- | --- |
| UPSTASH_REDIS_REST_URL | 저장소의 HTTPS REST URL |
| UPSTASH_REDIS_REST_TOKEN | 해당 저장소의 읽기·쓰기 토큰 |
| USAGE_HASH_SECRET | 무작위 32바이트 이상으로 만든 비밀 문자열(최소 32자) |
| USAGE_KEY_PREFIX | 선택 사항. 기본 nigtldcmap:usage:v1 |

Vercel 연동이 KV_REST_API_URL / KV_REST_API_TOKEN 이름을 생성한 경우도 지원한다. 두 종류를 혼용하지 말고 한 쌍만 설정한다. 토큰과 비밀 문자열은 채팅·Git·프런트 코드·공개 보고서에 붙여넣지 않는다.

3. npm run build를 사용하는 배포로 반영한다. 이 명령은 prebuild에서 데이터별 갱신일 목록을 갱신한다. API 및 서버 코드 변경도 Preview 빌드 생략 대상에서 제외했다.
4. GET /api/usage가 status: ready를 반환하는지 확인한다. 첫 연결 직후 detail/map 배열이 비어 있는 것은 정상이다. 연결 실패는 503이며 숫자 0이나 임의 순위로 위장하지 않는다.
5. 운영 브라우저로 상세보기와 지도 주 분석 자료를 각각 2초 이상 열람한다. 브라우저의 개발자 도구에서 POST 성공 및 counted를 확인한다. 즉시 반복하면 counted: false여야 한다.
6. 다른 브라우저 세션에서도 열람한 후 합산되는지 확인한다. 홈 조회 응답은 CDN 캐시 때문에 수분 내 반영될 수 있다.
7. Preview는 기본적으로 쓰지 않는다. QA용 Redis 또는 별도 접두사를 사용한 격리 환경에서만 USAGE_ENABLE_WRITES=true를 사용한다. 운영 Redis를 공유하는 Preview에 이 값을 켜지 않는다.

## 집계의 의미와 제한

- 최근 30일은 한국 시간 기준 오늘을 포함한 30개 달력 날짜다. 최초 연결 이전의 조회 이력을 소급 생성하지 않는다.
- 조회순: 유효한 상세화면을 2초 이상 열람한 횟수. 지도 인기순: 실제 자료가 준비된 데이터 지도에서 주 분석 자료를 2초 이상 열람한 횟수.
- 동일 브라우저 세션·자료·유형의 30분 이내 반복은 서버에서 원자적으로 중복 제거한다. 서로 다른 세션은 별도 집계다. 사람 수/고유 방문자 수를 뜻하지 않는다.
- 화면이 숨겨졌거나 자동검사, 알려진 봇, DNT/GPC 신호가 있으면 수집하지 않는다. 화면 미리보기 지도는 지도 열람 횟수에 포함하지 않는다.
- IP 원문은 집계 저장소에 저장하지 않는다. 하루 단위 HMAC으로 바뀐 속도제한 키는 60초, 중복 확인 키는 30분, 일일 자료별 합계는 31일 후 만료된다. 운영 플랫폼 접속 로그는 별도 정책 대상이다.
- 요청 출처/자료 ID/유형/크기 검증, IP별 분당 120요청 제한, 서버 비밀값 분리, 타임아웃이 있다. 인증 없는 공개 집계이므로 정교한 분산 봇 조작까지 방지하는 인증 방문자 통계는 아니다.
- 신규 자료/지도는 디렉터리를 재생성한 빌드로 허용 목록에 반영한다. 현 디렉터리는 152개 자료 / 42개 지도다.
- 저장소 미연결/집계 없음: 대표 자료를 표시하되 '가장 많이 본 자료'라고 하지 않는다.
- 최신순: Git에 기록된 자료 파일 변경 시각. 코드만 바꾼 배포나 2050·2100년 전망연도를 최신 날짜로 취급하지 않는다. 파일 이력이 없는 자료는 자료 발행 스냅샷 시각을 사용한다. 원 제공기관의 최신 게시 여부를 실시간 보장하는 의미는 아니다.
- 같은 갱신일이면 데이터명 순서다. 조회수가 같으면 갱신일, 데이터명 순서다.

## 테스트와 남은 운영 검증

- npm run test:usage:v149: API 10개 테스트. Redis 호출을 대체한 계약 테스트이며 실제 Redis Lua 실행 검증은 아니다.
- npm test -- --watch=false --runInBand: 206개 통과.
- CI=true, GENERATE_SOURCEMAP=false, BUILD_PATH=tmp/build-v149-review로 npm run build 통과.
- node scripts/v149/serve-review.mjs: 미연결 상태 점검(4328).
- node scripts/v149/serve-review.mjs --ranking-fixture: 결정적 테스트 응답(4329). 운영 배포에 이 서버를 사용하지 않는다.
- 저장소 연결 후 원자적 중복 제거, 30일 조회, 서로 다른 세션 합산을 실제 Redis/Vercel에서 재검증해야 한다.

참조: [Upstash REST API](https://upstash.com/docs/redis/features/restapi), [Redis Lua EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval), [Vercel Node.js 함수](https://vercel.com/docs/functions/runtimes/node-js).
