**전체 판정: 부분 완료(건너뜀 있음)**

# P5 최종 검증 결과

생성: 2026-09-30T11:54:02.451Z · 모드: dry-run(계획만) · country=VNM,BGD

**"실행 성공"과 "내용 완성"은 다르다.** 아래 표의 '결과'는 명령이 0으로 끝났는지만 말한다 — 게이트를 통과했다는 뜻이지, 화면 내용이 다 채워졌다는 뜻이 아니다. 각 단계의 판정은 그 게이트 자신의 산출물(마지막 요약 줄)을 읽는다.

| 단계 | 결과 | 소요 | 비고 |
| --- | --- | --- | --- |
| (1) build | **미실행(dry-run)** | – | 실행하지 않음(--dry-run) |
| (2) qa:acceptance | **건너뜀** | – | 미병합 — package.json에 qa:acceptance 스크립트가 없음(세션4 PR 병합 대기) |
| (3) e2e 기준 이미지 갱신(4개) | **미실행(dry-run)** | – | 실행하지 않음(--dry-run) |
| (4) e2e 전체 | **미실행(dry-run)** | – | 실행하지 않음(--dry-run) |
| (5) finalize:v151 | **미실행(dry-run)** | – | 실행하지 않음(--dry-run) |
| (6) smoke:production:v128 | **건너뜀** | – | PRODUCTION_URL 미설정 — 배포 전이거나 이 실행에서 배포를 확인하지 않음 |

## 단계별 명령·마지막 출력

### (1) build

- 명령: `npm.cmd run build`
- 결과: 미실행(dry-run)
- 비고: 실행하지 않음(--dry-run)

### (2) qa:acceptance

- 명령: `npm run qa:acceptance -- --country VNM,BGD`
- 결과: 건너뜀
- 비고: 미병합 — package.json에 qa:acceptance 스크립트가 없음(세션4 PR 병합 대기)

### (3) e2e 기준 이미지 갱신(4개)

- 명령: `npx.cmd playwright test e2e/visual.spec.ts --grep ^(home|finder|detail-a016|detail-d011) matches its baseline$ --update-snapshots`
- 결과: 미실행(dry-run)
- 비고: 실행하지 않음(--dry-run)

### (4) e2e 전체

- 명령: `npx.cmd playwright test`
- 결과: 미실행(dry-run)
- 비고: 실행하지 않음(--dry-run)

### (5) finalize:v151

- 명령: `npm.cmd run finalize:v151`
- 결과: 미실행(dry-run)
- 비고: 실행하지 않음(--dry-run)

### (6) smoke:production:v128

- 명령: `npm run smoke:production:v128`
- 결과: 건너뜀
- 비고: PRODUCTION_URL 미설정 — 배포 전이거나 이 실행에서 배포를 확인하지 않음

