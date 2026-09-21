## 요약
- 자료 갱신일을 커밋 자산(`public/data/vietnam/v2/dataset-directory.json` + 번들 사본)에서 읽고 `prebuild`는 검증만(git 미호출). 규칙: `docs/DATASET_DIRECTORY_V150-1.md`.
- glossary 감사가 찾기 152개 카드 전체를 검사 → 드러난 용어 4개(BAFU·KETEP·TCCRE·TT:CLEAR) 등록, 카드 제공기관의 내부 메모 제거(E-018·E-020).
- CI: `static` → `browser`×4 → `summary`(같은 79개 check) → `analysis`(41건 기준선). 이전 실행 자동 취소, 문서만 바뀐 PR은 browser 생략. `pages.yml` dispatch 전용.
- role-split 스크린샷 쓰기 재시도, CLAUDE.md merge 조건·리사이저·디렉터리 메모.

## 검증(로컬)
- tsc 0 · test:unit 214/214 · `verify:dataset-directory:v150` 152/294 files
- sharded 게이트: static 14/14(62 s) · shard 1~4 259/253/264/239 s 전부 통과 · summary **79/79** · parity(단일 실행 대비 check 이름·판정 동일) `reports/v150-1/ci-shard-parity-v150-1.json`
- role-split 52/52 · analysis QA 41 = 기준선 41, 신규 0
- 결정성: 로컬 2회 빌드 홈 순서 해시 동일(`reports/v150-1/determinism-v150-1.json`); CI·Vercel 해시는 실행 후 추가
- e2e smoke·responsive·visual 40/40

## 기대값 변경(REVIEW §4)
- 계약 감사 3종이 sharded 형식을 현재 게이트로 인정 · glossary 대상 확대 · analysis QA baseline 옵션

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Jw8sCVkTDR6WNviJEL7ksv
