# V158-B2 기대값 변경 기록

CLAUDE.md 규칙: 게이트·감사·테스트의 기대값을 현재값에 맞춰 통과시키지 않는다. 바꿀 때는 사유를 이 파일에 적는다.

## PR-B (국가 일반화 계층)

| 대상 | 이전 기대 | 새 기대 | 사유 |
|---|---|---|---|
| `src/data/countryContext.test.ts` "the bundled view …" | 번들 레지스트리(src)가 `countries.json`의 모든 국가와 같다 | 번들은 기본 국가 하나이고, 그 값이 `countries.json`과 같다 | 10개국 확장 기준(사용자 2026-09-29): 국가는 `countries.json`만으로 추가돼야 한다. src에 비기본 국가 경로를 적지 않으려고 번들을 기본 국가로 줄였고, 비기본 국가 provider는 레지스트리를 읽은 뒤 등록된다. 번들 값과 레지스트리의 일치(기본 국가)는 계속 검사한다. |
| `tools/etl/countries/bgd/country.json` `countrySpecificElements` | 11개(용역사 기준서) | 12개(C-015 추가) | C-015도 명칭·출처가 나라마다 다르다(베트남 "정부 공보 외", 방글라데시 "재생에너지 법제도 원본 링크"·방글라데시 전력부 등). 사용자 위임 판단(2026-09-29). 화면 목록 `src/data/spec/countrySpecificElementsV158.json`과 같게 유지한다(단위 테스트). |
| `tools/etl/countries/bgd/verify_country_v2.cjs` `REFERENCE_TREE_UNCHANGED` | 참조국 트리·`countries.json`·`src` 모두 `git diff` 0 | 참조국 트리·`countries.json`만 `git diff` 0(+ 참조국 무결성 재해시) | B1은 `src` 편집 금지라 `src`까지 묶었다. B2(국가 일반화 계층)는 `src`를 의도적으로 바꾼다. 참조국(베트남) 화면이 그대로인지는 화면 서명 비교(`screen-signature-v158 --compare`)와 `finalize:v151`로 확인한다. |
| `src/data/spec/countrySpecV158.test.ts` 상태 안내 2건 | 비기본 국가의 미입고 = `U0`·"미입고", 기본 국가 ⓪은 명세 유형으로 복귀 | 미입고 = `statusNotice: data-pending`·유형 유지, 기본 국가의 안내(제외·준비 중)는 넘어오지 않음 | #43(기준서 v8)이 ⓪(U0) 유형을 폐지하고 `statusNotice`로 바꿨다. 판정 대상(그 나라 카탈로그 상태)은 그대로이고 판정 키만 바뀌었다. |
| `src/components/data/templates/variantCountryScopeV158.test.ts` 소스 검사 | 컴포넌트 소스 전체에서 타국 어휘 검색 | import 문·버전 접미사 식별자(`VietnamObservationV124` 등)를 뺀 뒤 검색 | #43의 한국 기준 변형 2종(`korea-tech-readiness`·`korea-tech-level`)이 공용 타입 이름 때문에만 걸렸다. 두 변형은 모든 국가 화면에 같은 한국 자료를 보여 주므로(유형 JSON `referenceCountryIso3: KOR`) 작성 국가 목록에 넣지 않는다. 화면 문구 검사 범위는 줄지 않는다. |
| `scripts/v158/screen-signature-v158.mjs` 화면 주소 | 찾기·지도·다운로드·이용안내 = `?view=…` | `#explorer`·`#map`·`#download`·`#guide` | 화면은 URL 해시로 정해진다(`src/app/navigation.ts`). `?view=`는 경로가 아니어서 네 화면이 모두 홈으로 찍혔다. V158-A의 "화면 변화 0" 증거는 홈·상세 147개에는 유효하고, 네 화면은 이번 PR-B 비교에서 처음 실제로 확인했다. |
| `tools/etl/countries/bgd/verify_country_v2.cjs` `NO_EXCLUDED` | BGD 카탈로그에 제외 요소 0 | `EXCLUSIONS_MATCH_COMMON_DECISION`: 제외 요소 = 공통 결정 6개, 공개 문구 동일, 다운로드 제공 없음 | 사용자 결정(2026-09-30): 2026년 제외 6개는 모든 국가 공통 결정 1곳(`config/data-publication/common-exclusions-v158.json`). BGD에도 같은 제외가 적용된다 |
| 같은 검증기 `COUNT_DELIVERED`·`NOT_PROVIDED_HAS_NOTHING` | 공개 상태(`publicStatus`)로 미입고 판정 | 측정 상태(`exclusion.measuredStatus`가 있으면 그것)로 판정 | 제외된 미입고 요소 4개(C-020·C-021·E-016·E-017)는 공개 상태가 '제외'가 되지만 납품이 없다는 사실은 그대로다. 베트남 카탈로그와 같은 방식(측정 상태를 결정 옆에 보존) |
| `src/data/spec/countrySpecV158.test.ts` 상태 안내 1건 | 기본 국가에서 안내가 붙은 요소 중 다른 나라가 공개하는 요소를 찾아 안내 없음 확인 | 두 건으로: 공통 제외는 다른 나라에서도 '제외' 안내 / 안내는 그 나라 카탈로그 상태를 따른다(합성 항목) | 공통 결정으로 '베트남 제외·방글라데시 공개' 요소가 없어져, 규칙을 데이터에 기대지 않고 검사하도록 바꿨다 |
| `src/data/visualization/countryCompareContractV158.test.ts` | 비교 가능 수를 단정하지 않음 | 비교 54개, 제외 4개(D-004·D-006·D-008·E-012), 비교 키 = 카드 헤드라인 지표, 위첨자 단위 동일 | 사용자 결정(2026-09-30) 국가 비교 fix-forward. 전후 표는 `reports/v158/country-compare-fixforward-v158.md` |
| `scripts/v161/audit-source-notes-v161.mjs` 허용 목록 E-019 | `해당없음 — 사무소 미설치`(붙여 씀)만 데이터 값으로 허용 | `해당 없음 — 사무소 미설치`(띄어 씀)도 허용, E-019 한정 | 같은 데이터 값을 방글라데시 납품은 띄어 쓴다(해외사무소가 없는 기관). 다른 요소·출처 줄의 '해당 없음'은 계속 실패한다 |
| 같은 감사 허용 목록 A-029 | (없음) | `발효일: 해당 없음(미발효)` 허용, A-029 한정 | 미발효 협정의 발효일 값(발효 전이라 날짜가 없음)으로, 출처 메모가 아니다. 베트남 A-029에는 미발효 행이 없어 이번에 처음 나타났다 |
| `scripts/v158/country-qa-v158.mjs` 타국 표현 어휘 | 레지스트리 국가명·확정 지명 | + 다른 국가의 1급 행정단위 이름(`adm.level1.label`, 한글일 때: 베트남 "성·시") | B2b 점검에서 방글라데시 B-032 화면이 "개편 전 63개 성·시"를 보여 준 것을 이 QA가 놓쳤다(출처 메모 감사에서 발견). QA만 넓혔고 화면의 숨김 규칙은 그대로다 |
