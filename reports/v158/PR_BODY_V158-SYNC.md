## 요약
- 커밋된 베트남 파생 자산 4개 파일이 현재 생성기 출력보다 뒤처져 있었다. 생성기를 그대로 다시 돌려 맞추고 integrity를 갱신했다(생성기 코드 무수정).
- **화면 변화 0**: main 빌드와 이 PR 빌드의 화면 서명 151화면(홈·찾기·지도·다운로드·이용안내·상세 146) 차이 0.

## 바뀐 값(대조표 `reports/v158/derived-sync-vnm-v158.md`)
| 파일 | 요소 | 필드 |
|---|---|---|
| semantic 계약 JSON | 30 | `mapLinkage.enabled` false → true, `featureCount` 0 → 지도 색인 피처 수, `mapMode` → 지도 방식 |
| 생성 TS 모듈 | 30(같은 요소) | `spatiallyLinked` false → true |
| dataset-directory(공개·src) | 6(A-017·C-015·D-024·E-008·E-016·E-017) | `updatedAt`(git 이력 계산값, #43 병합 시각) |
| asset-integrity | — | 위 공개 파일 2개의 크기·해시 |

- 두 값 모두 공개 화면이 읽지 않는다. 지도 표시는 map-index 기준(`mapAvailabilityV140`)이다.

## 검증
- tsc 0 · 단위 587/587
- 화면 서명 차이 0(`reports/v158/derived-sync-signature-compare-v158.json`)
- `finalize:v151`: 통과(1회) — release 80/80 · role-split 53/53 · analysis QA 필수 실패 35(기준선 41 이내, 새 실패 0) · boundary-34 21/22(브라우저 1건 생략) · boundary-policy 24/24

## 함께 고친 것
- `scripts/v158/screen-signature-v158.mjs`: 찾기·지도·다운로드·이용안내를 `?view=`(경로 아님, 홈으로 열림) 대신 해시 경로로 찍는다. B2b 브랜치의 같은 파일과 내용이 같다.

## Preview·확인 경로
- Preview: https://nigtldcmap-3e7oq0ors-exoprime-5142s-projects.vercel.app (커밋 `f18e7c5`, Vercel 로그인 필요)
- **화면 변화 0**: 확인할 페이지가 없다.

자세한 내용: `reports/v158/REVIEW_V158-SYNC.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
