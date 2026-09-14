# Stage 4 closeout · 재개점 (2026-09-09)

후보 데이터: `.staging/final/public/data/vietnam/v2` · 493 파일 · treeSha256 `a3530c48…`
후보 빌드: `.verify/candidate/build` · 지문은 `CANDIDATE_FINGERPRINT_V137.json`
브랜치: `fix/existing-screen-usability-v136` · 커밋 `7bab3dc`, `2998193`

**public/data 는 아직 2026-08-27 구자료다.** 이번 세션은 코드·도구·증거만 커밋했고 데이터는
승격하지 않았다. 그 이유는 아래 "데이터 승격 차단"에 있다.

## 재생성 방법 (전부 재현 확인됨)

```
VIETNAM_SOURCE_DIR=베트남데이터/file VIETNAM_STAGING_ROOT=.staging/final \
  python -m tools.vietnam_etl.build_public_v2
VIETNAM_DATA_ROOT=<staging>/public/data/vietnam/v2 python tools/vietnam_semantic/build_semantic_v125.py
VIETNAM_DATA_ROOT=<staging>/public/data/vietnam/v2 node scripts/build-vietnam-interpretation-v129.mjs
VIETNAM_DATA_ROOT=<staging>/public/data/vietnam/v2 node scripts/build-public-temporal-contract-v135.mjs
node scripts/v137/build-candidate-v137.mjs --data <staging>/public/data/vietnam/v2
```

`VIETNAM_SOURCE_DIR` 은 **반드시 `베트남데이터/file`** 이다. 상위 폴더를 주면 `*.xlsx` 를 하나도
찾지 못하고, 이전 ZIP 의 149개 워크북이 전부 carry-over 로 들어와 조용히 다른 빌드가 나온다
(이번에 실제로 한 번 겪었다). 이전 manifest 의 `<source>` 표기는 그 점에서 모호했다.

이 파이프라인은 전체가 **byte 단위로 재현**된다(493 파일 동일 해시 확인). generated contract
`src/data/visualization/generatedVisualizationContractsV125.ts` 도 재실행 시 동일하다(`b9319329…`).

## 완료

- **§1 QA 도구 좁은 보완** — 변수·기간을 실제 포인터+화살표 키로 조작, 모든 대기를 bounded
  polling 으로 교체(실측 대기 3–13ms), 값 대조를 설계 필드 + 온전한 숫자 토큰으로, 식별을 안정 ID
  로, 이전 팝업 소멸 확인, 겹침 선택 목록 이용, 가림 시 실제 이용자 조작(범례 접기·패널 접기·이동·
  확대)으로 도달하고 그 조작을 기록.
- **§2 MAP-002 종료** — 원인은 우측 패널이 아니라 **범례**였다(대상 좌표 25/25를 가림). 범례에 접기
  컨트롤 추가, 높이 상한 축소, 769–1099px 우측 패널 52%, 768px 이하 데이터 선택 시 목록 서랍 자동
  닫힘(그 전에는 지도 도달면적 0%). 1440·1024·958·768·390 전부에서 실제 hover·click 확인.
- **§2 MAP-003 종료** — `map-index` 가 이전 납품의 열 이름을 복사하고 있었다. 요소별 공개 항목 계약
  (`tools/vietnam_spatial/map_facts_v137.py`)으로 교체. 광종·발전원·용량·크레딧 기간·자료연도가
  팝업과 우측 상세에 표시된다.
- **§3 데이터 네 종류 마무리** — `DATA_CLOSURE_V137.md` 참조. C-016 파생 신규(성·시 639건),
  D-018 활동지점 재연결(검증 2지점 좌표 동일 확인) + 합계 4종 재계산(이전과 정확히 일치),
  B-034 전국 잔여 56행을 47 발행 + 9 재수록으로 처분, A-023 고유시설 근거 제시(확인된 동일시설 31쌍).
  `promotionBlocked` 가 true → **false** 가 되었고 최종 원천 투영 요소가 143 → **145**.
- **§5 지도 12개 전수** — 12/12 가 전 구간 통과(1440). `map-qa/FINDINGS.md` 참조.
- **§5 사업재원 화면** — C-007·C-008·C-025·D-018 의 금액·기간·분야 별칭을 납품 열 이름으로 연결.
- 부수로 고친 실제 결함: 음수 부호 소실(순흡수원이 배출원으로 읽힘), A-023 WRI 236곳의 이름이
  설비용량, 겹친 피처가 서로 구분되지 않음, 숫자 전압이 통째로 버려짐, D-018 상세화면 TypeError,
  `을(를)` 자리표시자, "총 발전소"가 자료 건수를 발전소 수라고 진술.

## 데이터 승격 차단 (다음 세션의 첫 결정)

후보 `downloads/` 가 **869 MB** 다(현재 커밋본 85 MB). 네 파일이 GitHub 의 100 MB 파일 한도를 넘는다.

| 파일 | 크기 |
|---|---|
| `downloads/b-004.json` | 137 MB |
| `downloads/b-006.json` | 130 MB |
| `downloads/b-007.json` | 128 MB |
| `downloads/b-005.json` | 122 MB |

전체 공개 승인으로 B-004~B-007 이 각각 3만여 행을 발행하게 된 결과이고, 형식 문제가 아니라 분량
문제다. 들여쓰기를 없애면 b-004 는 105 MB → 81 MB 로 한도 아래로 내려가지만 저장소는 여전히
약 700 MB 늘어난다. 이 결정은 소유자의 것이므로 이번 세션에서 승격하지 않았다.

선택지: (a) 다운로드 JSON 을 압축 형식으로 발행, (b) 대용량 요소를 CSV 전용으로, (c) Git LFS,
(d) 다운로드를 배포 시 생성. 어느 쪽도 데이터 의미를 바꾸지 않는다.

## 미완료

1. **§5 152개 상세화면 의미 검토: 0/152.** 방문·구조 수집은 기존 기록이 있으나 화면별 의미 검토는
   시작하지 않았다. D 계열 금액·연도 부분검토만 재사용 가능하며 전체 화면 수용 여부와 구분해야 한다.
2. **§5 추천 분석 5개 · 비교 모드** — 기존 `audit:map-compare:v135` / `MAP_PRESET_COUNT` 는 통과하지만
   의미 검토는 하지 않았다.
3. **§5 지도 12개 전수는 1440 에서만.** 다른 폭의 나머지 9개는 PENDING.
4. **§6 한국 공공기관 문구·레이아웃 마감** — `을(를)`, "총 발전소" 등 발견한 것만 고쳤고 전면 점검은
   하지 않았다.
5. **§7 release gate** — `finalize:v136` 는 49개 중 46개 통과, `V132_PORTFOLIO` 만 실패.
   이 실패는 **이 세션 이전부터 있었다**(HEAD~1 의 src 로도 동일하게 실패). 원인은 감사 스크립트가
   `entityBearingIds` 를 저장소의 구 `public/data` 에서 읽고 화면은 새 데이터가 든 빌드에서 읽는
   것이다. 같은 감사를 후보 빌드로 돌리면 실패가 11 → 3 으로 줄고, 남는 셋 중 C-007 은 이 두 데이터
   판본 차이 그 자체이며 E-018·E-020 은 원천에 날짜 사건이 없다. **데이터 승격 시 재확인할 것.**
6. **clean checkout / CI / Preview 대조** — 데이터 승격이 막혀 있어 수행하지 않았다.

## 주의

- `reports/v125`, `v131`, `v132`, `v136` 의 감사 결과 파일은 커밋본 상태로 되돌려 두었다. 이들은
  실행할 때마다 덮어써지므로, 데이터 승격 전의 실행 결과를 커밋하면 브랜치가 스스로와 어긋난다.
- `build/` 에는 지금 후보 빌드가 들어 있다(gitignore 대상). 저장소 코드와 구 데이터로 다시 만들려면
  `npm run build`.
- rejected-2026-09-08-invalid-harness 의 216건은 결함 수에 합산하지 말 것.
