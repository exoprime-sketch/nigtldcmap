# 다국가 골격 V158 — 온보딩 체크리스트

베트남 단독 구조를 국가별 구조로 바꾼 뒤, 새 국가를 추가할 때 무엇을 만들고 무엇을 확인하는지 적는다. 이 라운드(A1)는 **화면 변화 0**이다.

## 1. 개념 구분 — 데이터 국가 vs 우선국가

섞어 쓰면 잘못된 화면이 나오므로 분명히 둔다.

| 개념 | 정본 | 쓰이는 곳 | 현재 값 |
|---|---|---|---|
| **데이터 국가** | `public/data/countries.json`의 `status: "live"` | 데이터 찾기·상세·다운로드·지도·홈 지표, `?country=` 파라미터 | VNM(live) · BGD(preparing, 아직 선택 불가) |
| **우선국가** | `src/data/priorityCountries.ts`의 `PRIORITY_COUNTRIES` 10개국 | insights(기획 맥락) 화면의 국가 선택 | VNM·BGD·PHL·KHM·IDN·LAO·LKA·IND·MYS·EGY |

- 우선국가는 "플랫폼이 관심 대상으로 삼은 나라"이고, 데이터 국가는 "지금 데이터를 제공하는 나라"다.
- 그래서 `isValidPriorityCountry`(insights)와 `hasCountryDataProviderV122`(데이터)는 **다른 규칙을 쓴다**. V158에서 live 규칙을 넣은 곳은 후자뿐이다. 전자에 넣으면 지금 동작하는 insights의 9개국 선택이 사라진다(화면 변화).

## 2. `?country=` 규격

- 허용: `countries.json`에서 `status: "live"`이고 데이터 provider가 있는 국가(대소문자 무시).
- 거부: `preparing` 국가(BGD), 미등록 국가, 빈 값 → **기본 국가(VNM)로 폴백**하고 `view=`·`element=`·딥링크 등 나머지 파라미터는 그대로 둔다.
- 판정 위치는 한 곳이다: `countryDataProviderRegistryV122`의 `getCountryDataProviderV122`가 live를 함께 요구하고, `hasCountryDataProviderV122`·`listCountryDataProvidersV122`·`availableDataCountryIso3V122`가 이를 따른다. 화면·페이지에 국가 목록을 다시 적지 않는다.
- 경로 라우팅(`/:country/…`)과 301은 이번 범위가 아니다. 현행 해시+쿼리 URL 모델을 유지한다.

## 3. 경로는 레지스트리에서 만든다

```ts
import { countryAssetPathV158, dataUrl, countryPublicDirV158 } from "../data/countryContext";

publicAssetUrlV128(countryAssetPathV158("VNM", "catalog.json")); // 화면
dataUrl("VNM", "geometry/vnm-adm1-34.geojson");                  // 절대 URL
countryPublicDirV158("VNM");                                      // 노드 측(public/data/vietnam/v2)
```

- `src/` 어디에도 `data/<country>/v2` 문자열을 직접 쓰지 않는다. `countryContext.test.ts`가 잔존 0을 **grep으로 검사**하므로 새 리터럴은 테스트에서 걸린다.
- 빌더·감사는 `--country <iso3>`(기본 vnm)를 받고 `scripts/v158/country-context-v158.mjs`로 데이터 루트를 얻는다. `--data`·`VIETNAM_DATA_ROOT`가 주어지면 그쪽이 우선이다(스테이징 런북 보존).

## 4. 새 국가 추가 체크리스트

1. **레지스트리**: `public/data/countries.json`에 항목 추가 — `iso3`·`nameKo`·`nameEn`·`dataRoot`·`adm.level1{count,label,asset,keyScheme}`·`bbox`·`defaultZoom`·`boundaryEpoch`·`categoriesAvailable`·`status: "preparing"`. 번들 폴백(`countryContext.ts`의 `BUNDLED_DATA_ROOTS_V158`)도 같이 갱신한다(테스트가 일치를 확인한다).
2. **ETL 입력 선언**: `tools/etl/countries/<iso3>/country.json` — 기준 투영(카탈로그·매니페스트), 원자료 패키지, 공개 결정 파일, 프레임워크 요소 수, ADM1 체계. 값은 그 국가의 것으로 적고 코드는 고치지 않는다.
3. **경계**: `adm.level1.asset`이 가리키는 GeoJSON과 이름 crosswalk·한글 지명표를 `tools/etl/countries/<iso3>/`에 둔다. 경계는 임의 생성하지 않고 출처·라이선스를 manifest에 적는다.
4. **적재**: `ETL_COUNTRY=<ISO3> python -m tools.etl.build_public_v2`(또는 런북 `npm run refresh:data -- --source … --apply`)로 `public/data/<iso3>/v2`를 만든다.
5. **후속 빌더**: `--country <iso3>`로 map-targets → home-preview → dataset-directory → card-summaries → asset-integrity를 돌린다.
6. **비교 계약**: `npm run build:country-compare:v158`로 `countryCompare`를 다시 생성한다. 비교는 **같은 단위**일 때만 이뤄지고, 연도는 `latest-common`(두 국가가 모두 가진 최신 연도)이다.
7. **공개 전환**: 데이터·게이트가 통과한 뒤에 `status`를 `live`로 바꾼다. 그때 비로소 `?country=<iso3>`가 허용된다.

## 5. 국가 비교 계약

- `src/data/visualization/publicVisualizationContractV153.json`의 각 행에 `countryCompare`가 붙는다.
  - `comparable: true` → `compareKey{indicatorId, unit, yearRule}`
  - `comparable: false` → `reason`(사람이 읽는 사유)
- 판정은 계약·데이터가 이미 말하는 것에서만 끌어온다: `national-series`·`composition`이고 1순위 단위가 선언돼 있으며 값·연도를 가진 지표가 있을 때 비교 가능. 현재 **비교 가능 59 / 불가 93**(레코드 목록 33·정책 문서 22·성·시 분포 20·상태 안내 5·단위 미선언 4·행렬 3·관측지점 3·값·연도 없음 3).
- 렌더러 `CountryCompareBlockV158`은 비교 대상이 2개국 미만이거나 공통 연도가 없으면 **아무것도 그리지 않는다**. 단위가 달라 제외된 국가가 있을 때만 사유를 한 줄로 적는다. 베트남 단독인 현재는 어느 화면에도 나타나지 않는다(단위테스트로만 검증).

## 6. 이번 라운드에서 하지 않은 것(A2 후속)

| 항목 | 이유 |
|---|---|
| 홈 상단 국가 선택(VNM 활성·BGD 준비 중) | `HomePage*`가 다른 작업(P11) 중이라 편집 금지 |
| 상세 화면에 비교 블록 삽입 | `CountryDataElementPage.tsx` 편집 금지 |
| 경로 라우팅·301·sitemap | 사용자 결정으로 계획에서 제외(현행 해시+쿼리 유지) |
