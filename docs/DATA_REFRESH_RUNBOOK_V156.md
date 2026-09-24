# 데이터 갱신 런북 V156

새 입고분으로 `public/data/vietnam/v2`를 다시 만드는 절차. 폴더명만 바꾸면 같은 순서로 재실행된다(차기 법제도 재입고·다른 국가 입고 포함).

## 1명령

```bash
# 1) 검토용: 스테이징까지만 만들고 diff 보고서를 낸다(공개 트리 불변)
npm run refresh:data -- --source 베트남데이터/<YYYYMMDD>

# 2) 승인 후: 같은 명령에 --apply
npm run refresh:data -- --source 베트남데이터/<YYYYMMDD> --apply

# 보류할 요소가 있으면(사유는 그 라운드 REVIEW에 적는다)
npm run refresh:data -- --source 베트남데이터/<YYYYMMDD> --hold A-023,B-033,E-012 --apply
```

주요 옵션

| 옵션 | 기본값 | 뜻 |
|---|---|---|
| `--source` | `베트남데이터/20260922` | 워크북이 **바로 들어 있는** 디렉터리(하위 탐색 없음) |
| `--version` | `v156` | 스테이징·보고서 접두(`_source/vietnam/<version>`, `reports/<version>`) |
| `--hold` | 없음 | 채택하지 않을 요소 코드. 해당 코드는 `--carry-from` 입고분 파일로 스테이징된다 |
| `--carry-from` | `베트남데이터/file` | **현재 공개 트리를 만든 입고분**. ETL 자체 fallback(V124 ZIP)은 더 오래된 자료다 |
| `--expected-workbooks` | `149` | carry-over 병합 **후** 워크북 수(= 프레임워크 총계). 이 값이 틀리면 ETL이 중단한다 |
| `--staging` | `.staging/<version>` | `.staging/` 하위여야 한다. 그 밖의 경로는 `build()`가 거부한다 |

## 단계와 각 단계가 잡는 것

| 단계 | 스크립트 | 무엇을 막는가 |
|---|---|---|
| stage | `scripts/v156/stage-source-v156.mjs` | `~$…xlsx` 잠금 파일·`._DAV`가 워크북으로 읽히는 것, 같은 코드 중복 파일의 임의 채택(`_수정안`만 자동 채택, 그 외는 실패), 보류 요소가 오래된 ZIP으로 후퇴하는 것 |
| redact | `tools/vietnam_etl/redact_source_credentials_v156.py` | 입고분 메타시트에 적힌 API 키 등이 트리로 흘러드는 것(값은 스테이징 사본에서만 제거, 해시·행만 기록) |
| structure | `scripts/v156/source-structure-v156.py` | 빌드가 실패해도 "구조가 어떻게 바뀌었는지"를 답하지 못하는 상황 |
| build | `scripts/v137/build-final-data-v137.mjs` | etl→semantic→interpretation→temporal→map-targets→home-preview→asset-integrity 순서가 어긋나는 것 |
| diff | `scripts/v156/source-diff-v156.mjs` | 값·지표·단위·최신연도·결측률 변화를 모르고 반영하는 것 |
| apply | `scripts/v156/apply-staged-data-v156.mjs` | mirror 방식 반영이 체인 밖 자산(`geometry/**`·`spatial/**`·`dataset-directory.json`·`home/card-summaries-v140.json`)을 삭제하는 것 |
| dataset-directory · card-summaries | `scripts/v150-1/…`, `scripts/v140/…` | 데이터는 새것인데 디렉터리·카드 요약이 낡아 analysis QA가 낡은 기준과 비교하는 것 |

## 반영 후 게이트

```bash
npx tsc --noEmit
npm run test:unit                      # 데이터 고정 기준선 테스트가 먼저 깨진다
npm run audit:generated-data:v133
npm run qa:detail-contract:v153 -- --ids <diff에서 스키마 변경된 ID>
npm run qa:analysis:v140:baseline
npm run finalize:v151                  # PR 직전 1회
```

확인 포인트

- `find public -type f -size +100M` 가 비어 있어야 한다. GitHub는 파일당 100 MB를 거부하고, 커진 payload는 ETL이 `external-object-storage`(url 없음)로 바꿔 `dataset-directory` 빌더를 EISDIR로 죽인다.
- ETL 요약의 `promotionBlocked`가 `false`여야 한다. `MATERIAL_COVERAGE_DROP`은 "공개 행이 절반 미만"이라는 뜻이고, 반영 여부는 사람이 결정한다.
- `npm run test:unit` 실패는 두 가지로 나뉜다: **실제 파손**(예: 지도 선언 변수 소실 → `mapPresentationV148`)과 **검토 기준선 불일치**(원자료가 실제로 늘어난 경우). 후자는 내용 재검토 후에만 기대값을 고치고, 사유를 그 라운드 REVIEW에 적는다.

## 보류(hold)를 쓰는 기준

현행 화면·계약·용량 한도가 새 입고분을 그대로 읽지 못할 때만 쓴다. 보류는 값을 만들지 않고 이전 입고분을 유지하는 선택이며, 코드별 사유를 그 라운드 `reports/<version>/hold-list-<version>.json`과 REVIEW에 남긴다. 2026-09-22 라운드의 실제 사유 분류는 `reports/v156/REVIEW_V156.md` §4 참조.

## 원자료 취급

- 입고 폴더는 **읽기 전용 아카이브**다. 어떤 스크립트도 쓰지 않는다.
- 스테이징 사본(`_source/vietnam/<version>/workbooks`)과 manifest는 `.gitignore` 대상이다. 공개용 기록은 `reports/<version>/`에 둔다.
- 자격증명이 발견되면 값을 옮겨 적지 않고 해시·길이·행 번호만 기록한 뒤, 키 폐기·재발급을 계정 보유자에게 요청한다.
