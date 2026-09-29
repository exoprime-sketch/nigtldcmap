# CLAUDE.md — nigtldcmap (개도국 기후기술 협력 데이터 플랫폼)

React 18 / TypeScript 4.9 / CRA 5 / MapLibre GL 5 / 자체 SVG 차트. 공개 provider는 베트남 파일럿(152개 데이터 항목, 지도 대상 43개 중 42개 활성). 배포는 Vercel(nigtldcmap.vercel.app) + GitHub Pages. 사용자와의 대화·보고서·커밋 본문은 한국어(개조식), 코드 주석은 영어 유지.

## 절대 규칙
- main 직접 push 금지. 작업은 `origin/main`에서 분기한 브랜치 → PR(squash). merge 조건: 로컬 `finalize:v140` 통과(analysis QA는 41건 기준선 이내) + Vercel Preview Ready + 사용자 승인. GitHub CI는 merge를 막지 않되 **main에서 반드시 녹색**이어야 하며, 빨강이면 다음 PR을 시작하기 전에 fix-forward로 먼저 고친다.
- 게이트·감사 스크립트의 기대값을 현재값으로 바꿔 통과시키지 않는다. 기대값 변경은 사유를 `reports/v15x/`에 기록.
- 데이터 조작 금지: 결측 0 대체, 임의 경계·좌표 생성, 추정 분야 채움, 출처 간 중복 합산 금지. 원자료에 없는 값은 만들지 않는다.
- 새 탭·새 사이트 구조 금지. 홈 → 데이터 찾기 → 상세 → 데이터 지도/다운로드/이용안내 안에서 작업.
- 내부 코드·검토 메모·파일명·raw 키를 공개 화면에 노출하지 않는다.
- 비밀값(토큰·키)을 코드·보고서·채팅에 넣지 않는다.

## 파일 다루기
- `src/pages/RealMapExplorerPage.tsx`(8,000줄+)와 `SemanticContractRendererV125.tsx`(2,700줄+)는 **전체 Read 금지**. `grep -n`으로 함수·문자열 위치를 찾고 필요한 구간만 열어 부분 편집.
- 기존 파일 수정을 우선하고, 새 `V###` 접미사 파일은 정말 새 역할일 때만 만든다. 이번 라운드 버전: V150(가독성) → V151(경계34) → V152(아이콘) → V153(상세) → V154(QA).
- 생성 자산(`public/data/vietnam/v2/**`)을 바꾸면 `node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2`로 integrity 갱신.
- `.gitattributes`·`vercel.json ignoreCommand`는 변경하지 않는다. `output/`·`tmp/`·`.staging/`·`.verify/`는 git 무시 경로.

## 검증 명령(순서)
```
npx tsc --noEmit                 # 테스트 파일의 jest 타입 경고는 무시 가능
npm run test:unit                # 206개 이상 통과 유지
npm run finalize:v140            # 차단 게이트(finalize:v136 + role-split + analysis QA)
node scripts/v137/build-candidate-v137.mjs --data public/data/vietnam/v2 && npx playwright test
npm run qa:map:v138 / npm run review:screens:v138 / npm run qa:analysis:v140
npm run release:vietnam-pilot    # PR 전 최종
```
- 화면 검증은 production 형식 빌드(`GENERATE_SOURCEMAP=false`, `BUILD_PATH=tmp/build-v15x-review`)를 정적 서버로 띄워 실제 브라우저(Playwright Chromium)로 한다. 루트 ready 신호만으로 합격 처리하지 않는다.
- 반응형은 320/390/768/1024/1440/1920px 6폭에서 문서 가로 넘침 0을 확인한다.

## 속도 규칙(세션당 목표 ≤3시간)
- 개발 중 검증은 **바뀐 항목만**: `qa:detail-contract:v153 --ids …`, `review:screens:v138 --ids …`, `qa:map:v138 --layers …`처럼 필터 실행. 전체 `finalize:v140`은 PR 직전 **1회**.
- GitHub CI는 세션 안에서 기다리거나 반복 수정하지 않는다(merge 조건 아님). 실패는 다음 세션 시작 시 fix-forward. 환경성 실패(러너 속도·파일 쓰기)는 스크립트에 예산·재시도를 넣고 기록.
- 서로 다른 파일을 만지는 항목 묶음은 **worktree 서브에이전트로 병렬**(Sonnet), 메인(Opus)은 계약·라우터·병합·검수만. 같은 파일(`RealMapExplorerPage.tsx`, 라우터, 계약 JSON)은 메인만 편집.
- 한 게이트를 2회 넘게 반복하면 멈추고 원인·대안을 보고한다(재시도로 통과 금지).
- 모니터/폴링은 1개만, 90초 간격 이상. 대용량 로그는 grep으로 필요한 줄만.

## 보고 형식
- 매 PR: `reports/v15x/REVIEW_V15x.md`(변경·검증 결과·미완료와 사유) + `reports/v15x/PR_BODY.md`. 실행 성공과 내용 완성을 구분해 쓴다("브라우저 열림" ≠ "분석 완성").
- 컨텍스트 압축(`/compact`) 후에는 반드시 PR 목표·수용기준·현재 단계를 다시 확인하고 `reports/v15x/PROGRESS.md`를 갱신한다.

## 도메인 메모
- 행정경계: V151부터 기본은 2025-07-01 시행 34개 성·시(결의 202/2025/QH15), 63개는 토글. 63→34 대응표는 `reports/v138/map-targets-build-v138.json`의 `crosswalk34`가 정본(34개, 구성 `memberAdm1Codes`). 개편은 성 단위 통합이므로 분할 없음.
- 발전원 분류는 `src/data/map/powerPlantFactsV141.ts`의 12종 라벨이 정본. 아이콘·범례·팝업은 이 라벨 키로만 매핑.
- 기후기술 ID는 `"7"`과 `"CTIS-07"`이 같은 기술이다. 화면·필터는 정규화 키(`07`)로 비교한다.
- B-017(물 스트레스)은 Aqueduct 평가구역 경계 미확보로 지도 보류. 임의 경계 생성 금지, 사유 표기 유지.
