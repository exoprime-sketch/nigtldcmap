## 요약
- 결정(2026-09-30)대로 요소별 다운로드를 `downloads/<id>.zip` 하나로 배포한다(안에 `<id>.json`·`<id>.csv`, 결정적 ZIP). 기존 주소 `<id>.json·csv`는 404(리다이렉트 없음).
- **배포 1회 948.7 MB → 164.4 MB(5.77배), 파일 867 → 635개, 가장 큰 파일 86.5 → 12.3 MB**
- **레코드 변화 0**, **화면 변화 0**

## 배포 용량(production 빌드 실측, `reports/v158/download-zip-size-v158.md`)
| 항목 | 전 | 후 |
|---|---|---|
| 배포 전체 | 948.7 MB · 867개 | 164.4 MB · 635개 |
| 베트남 다운로드 | 662.3 MB · 294개 | 19.0 MB · 147개 |
| 방글라데시 다운로드 | 145.3 MB · 170개 | 4.4 MB · 85개 |

## 바뀐 것
- ETL(베트남·방글라데시)이 결정적 ZIP을 쓰고, 카탈로그 `downloadAssets`에 ZIP 1개와 안쪽 파일 목록·크기·해시를 싣는다.
- 베트남은 지난 갱신과 같은 인자로 `refresh:data`를 다시 돌렸다: 원자료 값 비교 152요소 변화 0, ZIP 안 CSV 147개 바이트 동일, JSON은 요소 행의 `downloadAssets`만 다름. 팩은 요소 행 복사본에 다운로드 목록을 싣기 때문에 해시가 바뀐다(레코드 동일).
- 감사·QA·테스트·도구가 ZIP 안 파일을 읽도록 옮겼다. 기대값 변경 12건은 `reports/v158/EXPECTATION_CHANGES_V158-ZIP.md`에 사유 기록.
- 함께 고친 파이프라인 결함: `refresh:data` 반영 단계에 semantic 재생성 추가(#46 불일치의 원인 — 반영 때 지도 연결 30요소가 꺼지던 문제).
- 데이터 디렉터리 갱신일은 포장 전환 커밋을 세지 않는다(갱신일 변화 0).

## 검증
- tsc 0 · 단위 589/589
- 화면 서명 151화면 차이 0 · CI 감사(로컬) 보안 13/13 · 배포 9/9
- 배달 목록 검사·왕복 검증(베트남·방글라데시) PASS · 방글라데시 검증기 52/52
- `finalize:v151`: 통과(2회째) — release 80/80 · role-split 53/53 · analysis QA 필수 실패 35(기준선 41 이내, 새 실패 0) · boundary-34 21/22(브라우저 1건 생략) · boundary-policy 24/24. 1회째는 생성 데이터 감사의 `DOWNLOAD_ROW_RECONCILIATION`이 ZIP을 세지 않아(0건) 실패 → 감사 수정 후 재실행

## 성능 감사 초기 번들 — main 비교
| 빌드 | JS gzip | CSS gzip | 합계 | 기준(226,643) 대비 |
|---|---|---|---|---|
| main `5b82ea6` | 472,931 | 41,735 | 514,666 | +127.08% |
| 이 PR `f23d0e6` | 472,904 | 41,735 | 514,639 | +127.07% |

- +127%는 main에도 있는 기존 상태다(이 PR − main = −27 바이트, 데이터 디렉터리 지문 값 변경). CI에서도 참고용(`continue-on-error`). 자세한 내용: `reports/v158/performance-bundle-main-vs-pr-v158.md`

## Preview·확인 경로
- Preview: https://nigtldcmap-clmsib3fn-exoprime-5142s-projects.vercel.app (커밋 `ae2e85c`, Vercel 로그인 필요)
- **화면 변화 0**: 공개 화면은 정적 다운로드 파일을 쓰지 않는다(다운로드 화면은 팩에서 파일을 만든다).
- 확인할 수 있는 것: Preview에서 `/data/vietnam/v2/downloads/a-002.zip`(200)을 받으면 `a-002.csv`·`a-002.json`이 들어 있다. 옛 주소 `…/a-002.csv`·`…/a-002.json`은 404(`vercel.json` `routes`로 없는 `/data/**`만 SPA 폴백에서 제외, 검토 수정).
- 홈·찾기·지도·상세·다운로드는 그대로다(로컬에서 같은 라우팅으로 `/data` 요청 전부 실제 파일·콘솔 오류 0 확인, `reports/v158/data-404-routing-v158.json`).

## 남은 것
- Hobby 비상업 조건: 사용자 판단 대기(보류)

자세한 내용: `reports/v158/REVIEW_V158-ZIP.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
