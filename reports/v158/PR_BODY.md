# refactor(v158-a): 다국가 골격 — 국가 레지스트리·경로 상수·--country·ETL 일반화·비교 계약(화면 변화 0)

베트남 단독 구조를 국가별 구조로 바꾼다. **화면은 바뀌지 않는다** — 152개 화면의 DOM 서명을 main과 대조해 차이 0을 확인했다.

## 무엇이 바뀌었나

| 영역 | 내용 |
|---|---|
| 국가 레지스트리 | `public/data/countries.json`(신규) — VNM `live` · BGD `preparing`(`categoriesAvailable`에서 D 제외). 데이터루트·ADM1 체계·bbox·`boundaryEpoch`를 국가마다 선언 |
| 경로 상수 | `src/data/countryContext.ts`(신규) — `dataUrl()` · `countryAssetPathV158()`(publicAssetUrl 규격) · `countryPublicDirV158()`(노드 측) · `dataCountryParamV158()` · `loadCountryRegistryV158()` |
| 리터럴 제거 | `src/`의 `data/vietnam/v2` 리터럴 53건(최초 45 + rebase로 유입된 8) → 34개 파일에서 헬퍼로 치환, **잔존 0**. 해석 결과는 동일 |
| `?country=` 규격 | `countryDataProviderRegistryV122`가 레지스트리를 읽어 **provider 존재 + status=live**를 함께 요구. BGD는 `preparing`이라 거부되고 기본 국가(VNM)로 폴백하며 `view=`·`element=`·딥링크는 보존 |
| 빌더·감사 | `--country <iso3>`(기본 vnm) — `scripts/v158/country-context-v158.mjs` 공통 헬퍼로 v138·v139·v150-1·asset-integrity에 적용. `--data`·`VIETNAM_DATA_ROOT`가 우선(스테이징 런북 보존) |
| ETL 일반화 | `tools/vietnam_etl` → `tools/etl`, 국가별 입력 선언 `tools/etl/countries/vnm/country.json`(기준 투영·원자료 패키지·공개 결정·프레임워크 수·ADM1 체계). 국가 선택은 `ETL_COUNTRY`(기본 VNM) |
| 비교 계약 | 계약 152행에 `countryCompare` 추가 — 비교 가능 57 / 불가 95, 불가 사유는 사람이 읽는 문장. `compareKey{indicatorId, unit, yearRule}`, 연도 규칙은 `latest-common` |
| 비교 컴포넌트 | `CountryCompareBlockV158`(신규) — 국가 칩·그룹 막대·다중 라인·단위 불일치 경고. **2개국 미만이거나 공통 연도가 없으면 아무것도 렌더하지 않는다** → 베트남 단독인 현재 어느 화면에도 나타나지 않음 |
| 문서 | `docs/MULTICOUNTRY_V158.md` — 새 국가 추가 체크리스트 7단계, `?country=` 규격, 경로 헬퍼 사용법 |

## 개념 구분(문서에 명시)

- **데이터 국가**: `countries.json`의 `status: live`. 데이터 찾기·상세·다운로드·지도·홈 지표와 `?country=`가 이 규칙을 쓴다.
- **우선국가**: `PRIORITY_COUNTRIES` 10개국. insights(기획 맥락) 화면 전용이며 이번에 **바꾸지 않았다**. live로 좁히면 지금 동작하는 9개국 선택이 사라져 화면이 변한다.

## 검증

| 항목 | 결과 |
|---|---|
| **화면 변화** | main과 브랜치에서 각각 152화면 리뷰를 실행해 요소별 DOM 서명을 대조 → **차이 0**. `ready 152 · failed 0 · overflow 0 · console 오류 0` 양쪽 동일 |
| **ETL 바이트 동일** | 이동 전/후/국가설정 적용 후 3회 모두 같은 소스로 빌드해 트리 해시 비교 — 344개 파일 `sha256 3f65fdcf44e18ef7…` 동일 |
| `npx tsc --noEmit` | 0건 |
| `npm run test:unit` | **550/550** (신규 18건: 레지스트리↔번들 일치, `?country=` 규격, 리터럴 0 grep assert, 비교 계약 3건, 비교 블록 6건) |
| production build | 성공 |
| `npm run finalize:v151` | rebase 전 트리에서 **전부 통과**(release 79/79 · role-split 52/52 · analysis QA 필수 39·신규 0 · boundary-34 21 · boundary-policy 24/24). rebase 후에는 아래 선반영 실패에서 멈춘다 |

## main 선반영 실패(이 PR과 무관)

`origin/main` 2690675(#32 V159 병합)에서 `audit:entity-cards:v131`이 **D-024·E-008**로 실패한다(`ENTITY_CARD_ROUTE_RENDERING` 2, `ENTITY_RECORDS_SHOWN_SOMEHOW`). 같은 커밋을 그대로 체크아웃해 확인했고, 직전 main(e50f55b)에서는 17/17 통과한다.

- 원인: #32가 도입한 `src/components/data/templates/U0~U6`가 두 요소를 렌더하면서 `public-entity-card-v131`을 내지 않는다.
- 이 PR에서는 고치지 않았다 — `src/components/data/templates/*`는 이번 세션 편집 금지(세션4 P11 작업 중) 대상이다. 해당 작업자의 fix-forward가 필요하다.

## 이번 범위에서 제외한 것(A2)

- 홈 상단 국가 선택(VNM 활성·BGD 준비 중) — `HomePage*` 편집 금지
- 상세 화면에 비교 블록 삽입 — `CountryDataElementPage.tsx` 편집 금지
- 경로 라우팅 `/:country/…`·301·sitemap — 사용자 결정으로 계획에서 제외(현행 해시+쿼리 URL 유지)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01EynHh9yW3opy5z8q6HMtuY
