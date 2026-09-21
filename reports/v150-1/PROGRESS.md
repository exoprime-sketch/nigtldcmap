# PROGRESS — PR-A2 V150-1 최신순·prebuild 결정화 + CI 시간 단축 (fix/v150-1-dataset-directory-determinism)

## PR 목표
- 빌드 산출물이 소스 트리만으로 결정되게 한다(자료 갱신일을 커밋 자산에서 읽고 prebuild는 검증만). 같은 PR에서 CI를 static/browser×4/summary/analysis job으로 나눠 시간을 줄인다(검사 항목·기대값 불변).

## 수용기준
- `verify:dataset-directory:v150`가 prebuild·finalize:v140·CI static에 포함, git 미호출
- 홈 카드 순서 해시가 로컬(Windows)·CI(Linux)·Vercel Preview에서 동일(`reports/v150-1/determinism-v150-1.json`)
- glossary 감사가 finder 152개 카드 전부를 검사(`FINDER_ALL_CARDS_AUDITED`)
- CI: static ≤ 6분·browser shard ≤ 12분 실측, 요약 판정이 단일 실행과 같은 check 이름·판정(`reports/v150-1/ci-shard-parity-v150-1.json`), analysis job은 41건 기준선 비교
- role-split 스크린샷 쓰기 재시도, CLAUDE.md 갱신(merge 조건·리사이저·디렉터리 메모)

## 단계
- [x] 디렉터리 생성·검증 스크립트, package.json(prebuild=verify, build/verify 스크립트, finalize:v140 포함), V149 prebuild 삭제, ignoreCommand 경로 scripts/v150-1
- [x] role-split 스크린샷 재시도, glossary finder 152 로드, CLAUDE.md, 릴리스 감사 --group/--shard/--results-dir, 워크플로 감사 sharded 인정, analysis QA --baseline(41건), ci.yml 재구성, pages.yml dispatch 전용
- [~] 검증: 로컬 sharded 실행(static + 4 shards + summary) → parity, 결정성 해시(로컬 1회 기록), finalize:v140, e2e 홈 spec
- [ ] 문서(REVIEW_V150-1, CHANGELOG, DATASET_DIRECTORY_V150-1) → PR → CI 실측 시간 → 보고
