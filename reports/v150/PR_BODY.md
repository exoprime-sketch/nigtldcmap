## 요약
- Codex의 V148~V150 미커밋 작업을 `origin/main`(V147) 기반 브랜치로 옮겨 브라우저 검증·보완·게이트 회복 후 제출.
- 데이터 지도: '추천 분석' 삭제, 배경지도(OpenFreeMap) 토글·저작권 연동, 한글 지명, 좌우 패널 자유 조절(더블클릭 초기화·키보드·새로고침 유지), 클러스터 라벨 글꼴.
- 차트: `ChartAxesV150` 축·단위 라벨 — 152개 상세의 차트 블록 175/175.
- 152개 개조식 설명(찾기 카드=상세 히어로=분석 제목), 단위 152행 검토표 + 표시 단위 통일(`unitDisplayV150`, 값 불변).
- V148 상세 작은 지도·팝업 정리, V149 목록 복귀·공용 집계 API(연결은 범위 밖)·반응형.
- 게이트 회복: main CI를 붉게 만들던 portfolio 감사 파서·E-008 기대(V144 결정 반영), V148 화면 인식(entity-cards·generic-detail), 용어 도움말 누락 60여 곳·용어집 4개.

## 검증
- `npx tsc --noEmit` 0 오류 · `npm run test:unit` 20 suites / 211 passed · `npm run test:usage:v149` 10/10
- 런타임(Playwright, production 빌드): 지도 42/42 레이어 콘솔 오류 0 · 배경지도/한글 지명/패널 리사이즈 통과 · 찾기 뒤로가기 1280/390 통과 · 홈 주제별/집계 전 0 · 반응형 7화면×6폭 넘침 0 · 상세 152 축·단위 175/175 · 설명 152/152 일치 — `reports/v150/review-runtime-v150.json`
- `npm run finalize:v140`: `finalize:v136` **79/79 PASS** · `qa:role-split:v140` **52/52** · `qa:analysis:v140` 필수 실패 **41/152**(V146~V148 상세 재설계 ↔ V140 카드 계약 불일치, PR-D로 이관 — REVIEW §5.1; main도 V144 이후 같은 단계에서 실패). **따라서 CI는 이 단계에서 붉게 끝남**
- e2e(`build-candidate-v137` + `npx playwright test`): **214/214**
- `npm run release:vietnam-pilot`: 미실행(analysis QA 미해결 상태에서 릴리스 판정 보류, PR-D 이후)

## 기대값 변경(사유는 `reports/v150/REVIEW_V150.md` §3)
- 추천 분석 버튼 5 → 0, 공유 URL 조합으로 같은 레이어 조합 검증(`scripts/v150/map-combinations.mjs`) — 사용자 승인
- `vercel.json ignoreCommand`에 `api server scripts/v149`(V149) 유지 — 사용자 승인
- portfolio/entity-cards/generic-detail 감사의 파서·인식 수정, 용어 허용 목록 3건(XML·주소 지번 2)

## 범위 밖·남은 일
- **analysis QA 41건(PR-D 이관, 사용자 결정)**: 등록부 카드 'N건' 미표기 18 · 카드 선택·지표명 미표기 16 · 카드 값 미표기(A-010·A-023·D-011·E-012 등) · URL 차원 유실 4 · 다운로드 건수 불일치 2(B-023·B-028) · 기타 4 — 항목별 표는 REVIEW §5.1
- Vercel 환경변수·Redis 연결(공용 집계 운영), Linux 시각 baseline, 실기기 iOS/Safari.
- V151 인계: 63개 성·시 라벨·문구 20여 곳, `crosswalk34` Hà Tĩnh 키 버그 — REVIEW §6.

문서: `reports/v150/REVIEW_V150.md`, `UNIT_REVIEW_V150.md`, `DESCRIPTION_REVIEW_V150.md`, `PROGRESS.md`, `CHANGELOG.md`(Unreleased — V150)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
