# PROGRESS — PR-A V150 마감 (feat/v150-map-readability-final)

## PR 목표
- Codex V148~V150 미커밋 WIP를 origin/main(7220e24, V147) 기반 브랜치로 옮겨 브라우저 검증·e2e 갱신·잔존 문구 삭제 후 PR → CI 녹색 → (사용자 승인 후) squash merge.

## 수용기준
- `npx tsc --noEmit` · `npm run test:unit`(209+) · `npm run finalize:v140` · `npm run release:vietnam-pilot` · `npx playwright test` 통과
- 데이터 지도: 추천 분석 DOM 0 · 배경지도 토글/저작권 · 한글 지명 · 패널 리사이즈(드래그/더블클릭/키보드/새로고침 유지) · 42 레이어 콘솔 오류 0
- 데이터 찾기: 상세 진입 후 뒤로가기 시 scrollY·필터·펼침 유지(1280/390)
- 홈: 주제별 데이터 0 · 집계 전 문구 0 · 주요 지역 지도 스크린샷
- 반응형: 홈·찾기·상세(E-005,B-023,A-023)·지도·다운로드 × 320/390/768/1024/1440/1920 넘침 0
- 상세 152: 분석 블록 `[data-chart-axes]` 또는 단위 라벨 100%
- 설명 152 개조식 점검표, 단위 152행 표

## 승인된 결정(2026-09-21)
1. WIP 이전은 `stash push -u → stash apply`(백업) + `checkout -b` + `reset --mixed origin/main`(트리 무변경). 사유: 미추적 49개가 main에 이미 존재해 `stash pop`이 실패.
2. V149의 `vercel.json ignoreCommand`(api/server/scripts/v149 추가) 유지.
3. '추천 분석' 버튼 5개를 기대하는 게이트·e2e 기대값을 0개 + 공유 URL 조합 검증으로 변경(사유 REVIEW_V150에 기록).

## 단계 기록
- [x] 1단계 WIP 이전 — 2026-09-21
  - 이전 전 `git status --short` 167줄(수정 77 + 미추적 90). backup 브랜치 `backup/v150-wip-20260921`(920d330), stash@{0} "v148-v150 wip 20260921" 생성·보존.
  - 새 브랜치 HEAD = 7220e24(origin/main). `git diff --stat origin/main`: 46 files changed, +568/−1373. 미추적 34항목(파일 122개; 그중 reports/v142 77개·reports/v143 2개·scripts/v142 5개·reports/v144/DEPLOYMENT_PREVIEW_V144.md·루트 .docx는 V142~V144 잔여로 이번 PR 범위 밖 → 커밋하지 않음).
- [x] 2단계 마무리 수정 — DataGuide 문구 삭제 · readability 테스트(+jest import) · 설명 20개 재작성(위반 0) · 단위 표 152행 + unitDisplayV150 · ChartAxesV150 8개 지점 추가(175/175) · 추천 분석 기대값 갱신(감사 3 + qa:map + e2e 2) · 클러스터 글꼴 Noto Sans · 게이트 회복: entity-cards/portfolio/generic-detail 감사 인식 수정, 용어 도움말 감싸기·용어집 4개
- [~] 3단계 검증 — tsc 0 · test:unit 211 · 런타임 검토(지도 42/42, 반응형 42/42, 축 175/175, 설명 152/152, 찾기 2/2, 홈 2/2) 완료 · finalize:v140 3차 실행 중(1차 entity-cards 실패, 2차 로그 인코딩·portfolio 실패) · e2e·release 미실행
- [ ] 3단계 검증
- [ ] 4단계 커밋·PR
