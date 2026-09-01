# Project Spatial Scope Policy V130

## 프로젝트 위치 판정

프로젝트 점은 `coordinateMeaning`이 `verified-physical-site` 또는 `verified-activity-site`일 때만 허용한다. 국가·권역 대표좌표, 첫 좌표, centroid, 의미 미확인 좌표는 사업 위치로 표시하지 않는다.

| 원천 의미 | 지도 처리 |
|---|---|
| 검증된 단일 시설·활동지점 | point |
| 검증된 복수 활동지점 | multi-point |
| 명시된 행정범위 | admin1 또는 regional-scope |
| 다국가 지역 협력사업 | 참여국 범위 + 검증 활동지점(있는 경우) |
| 국가사업이나 세부 지점 없음 | country-scope 또는 panel-only |
| 의미 미확인 좌표 | panel-only |

## D-018 Adaptation Fund

원본 워크북 4건의 `latlon` 전체를 보존해 검토했다. 첫 좌표만 사업 위치로 사용하는 방식은 폐기했다.

| 사업 | 원천 좌표 | 의미 | V130 처리 |
|---|---:|---|---|
| Innovative Financial Incentives for Adaptation in Wetland Livelihoods | 0 | 지점 없음 | panel-only |
| Mekong EbA South | 2 | 공식 제안서에서 확인된 세부 활동지역 | 태국·베트남 범위 + 활동지점 2곳 |
| Mekong Delta eco-human settlement | 1 | 메콩델타 광역 대표좌표 | panel-only |
| Greater Mekong groundwater | 4 | 국가 대표좌표이며 물리적 사업지점 아님 | 4개 참여국 regional-scope, 점 0개 |

### Greater Mekong groundwater

공식 Adaptation Fund 현재 페이지와 제안서에 따라 다음을 적용한다.

- 범위: Regional / Asia-Pacific
- 참여국: Cambodia, Lao PDR, Thailand, Viet Nam
- 분야: Transboundary Water Management
- 승인액: USD 4,898,775
- 표시: 참여국 경계의 옅은 면과 점선 외곽선
- 베트남 참여: 포함
- 원천 대표좌표 4개: 지도 점으로 미표시
- 공식 제안서의 파일럿 권역: Vientiane Plains, northwest Cambodia–Thailand border area, upper Mekong Delta. 명칭은 상세에 모두 표시하되 정밀 경계·좌표가 없으므로 점을 만들지 않는다.

공식 출처:

- https://www.adaptation-fund.org/project/groundwater-resources-greater-mekong-subregion-collaborative-management-increase-resilience-cambodia-lao-peoples-democratic-republic-myanmar-thailand-vietnam-2/
- https://fifspubprd.azureedge.net/afdocuments/project/3069/3069_UNESCO%20GMS%20Groundwater%20Funding%20Proposal_2022%20Review%20Update%20clean_LOEs.pdf

## D-023 중복 정책

D-023은 GCF·GEF·Adaptation Fund 등을 통합한 포트폴리오 데이터로 데이터 찾기에서 유지한다. D-018과 논리적으로 동일한 Adaptation Fund 사업 4건이 확인됐고, V129 지도에서 3건이 동시에 보였다. V130에서는 D-023을 panel-only로 전환해 가시 중복을 0으로 만들었다.

교차 레이어 키는 공식 프로젝트 ID(있는 경우), 공식 URL, 정규화 제목, 기금, 승인일, 승인액을 사용한다.

## 계약 필드

지도 레이어와 프로젝트 엔터티는 다음 필드를 가진다.

- `spatialScopeType`
- `coordinateMeaning`
- `scopeCountries`
- `sourceCoordinateCount`
- `displayedCoordinateCount`
- `regionalProject`
- `aggregationLevel`
- `publicSpatialNotice`

지역 범위는 “사업 위치”가 아니라 “사업 참여지역” 또는 “지역 협력범위”로 표현한다.
