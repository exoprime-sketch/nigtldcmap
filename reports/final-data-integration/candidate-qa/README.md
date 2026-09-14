# 이 폴더의 detail-coverage-* 는 채택된 결과가 아니다

`detail-coverage-summary-v137.json` 과 `detail-coverage-v137.csv` 는
`rejected-2026-09-08-invalid-harness/` 안의 파일과 **바이트 단위로 동일하다**
(sha256 `7a12af39…`). 즉 이 폴더의 최상위 사본도 그 폴더가 무효라고 판정한 바로 그 수집 결과다.

따라서 다음 수치를 검토 결과나 결함 수로 인용하지 않는다.

| 인용 금지 | 실제 의미 |
|---|---|
| `findingCount: 216` | 수집기 결함으로 생성된 값. 제품 결함 216건이 아니다. |
| `interactionReviewed.NO_EFFECT: 98` | 비교 대상이 양쪽 모두 `undefined` 였다. 선택 변경이 무시된 증거가 아니다. |
| `semanticReviewed.YES: 29` | 위 두 가지의 파생 결과. 의미 검토를 수행한 화면 수가 아니다. |
| `visited.YES: 144` | 방문 자체는 일어났으나 같은 실행의 산출물이므로 단독 인용하지 않는다. |

사유는 `rejected-2026-09-08-invalid-harness/REJECTED.md` 에 있다. 파일은 지우지 않고 보존한다.

**현재 상태: 152개 상세화면의 상호작용 검토와 의미 검토는 각각 0/152 다.**
`portfolio-alias-remap-v137.md` 는 별개의 검토이며 유효하다.
