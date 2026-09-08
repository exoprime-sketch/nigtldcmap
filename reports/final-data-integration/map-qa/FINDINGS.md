# 지도 QA 재작성 결과 (Stage 4 closeout §3)

후보 `.verify/candidate/build` · 번들 `main.00741e03.js` · 1440x1000

## 1. 하네스가 무엇을 근거로 삼는가

이전 스크립트가 성공으로 처리하던 것들을 모두 제거했다.

| 이전 | 현재 |
|---|---|
| `<canvas>` 존재 → rendered=YES | observer.renderedFeatures(elementId).length > 0 |
| 빈 label의 `includes("")` 로 아무 버튼 선택 | `[data-element-id="X"]` 실제 포인터 클릭 후 `aria-pressed="true"` 확인 |
| 지도 중앙 임의 4지점 hover | `hitPointFor()` 가 queryRenderedFeatures 로 **그 객체에 실제로 닿는** 좌표를 탐색 |
| hover 성공 위치와 무관하게 중앙 click | hover 와 **같은 좌표**에 click |
| click 발송 → 성공 | 팝업 identity 와 우측 패널 identity 를 **대상 ID/이름으로 대조** |
| 첫 select 조작 → "기간 변경" | `map-layer-variable-select` / `map-layer-period-select` 를 testid 로 지정 |
| sleep 으로 준비 판정 | observer.ready() (`isStyleLoaded && areTilesLoaded`) 폴링 |

기대값은 화면 계산이 아니라 후보 데이터 파일에서 가져온다.
polygon=`spatial/layers/b-034.json`, point=`packs` 엔티티, line=`geometry/vnm-transmission-network.geojson`.

관측 수단은 `window.__nigtMapObserverV137` 로 **localhost 에서만** 부착된다(배포본에서는 활성화 불가).
queryRenderedFeatures/project 읽기만 제공하며 setter 가 없어 React 상태를 바꾸거나 성공 상태를 만들 수 없다.
새 사용자 메뉴가 아니다.

`hitPointFor` 는 centroid 를 쓰지 않는다. centroid 는 구멍·오목한 성 외부·선 바깥에 떨어질 수 있으므로
렌더러에 직접 물어 그 객체에 닿는 좌표를 찾고, 가려지지 않은 좌표를 우선한다.
**모든** 후보 좌표가 가려졌을 때만 가림으로 보고한다.

## 2. 대표 3건 결과

| 대상 | 기하 | 선택 | 렌더 | 대상존재 | 좌표 | hover=대상 | click=대상 | 기대값 |
|---|---|---|---|---|---|---|---|---|
| B-034 Lai Châu (VN-01) | polygon | YES | 63 | YES | YES | YES | YES | **YES** |
| B-048 Ban Phuc | point | YES | 2 | YES | YES | YES | YES | NO |
| A-024 WB2016-0001 | line | YES | 585 | YES | 가림 | NO | NO | NO |

B-034 은 원천 기대값까지 완결: 변수 `산림탄소 총배출(연평균)` 선택 후
팝업·패널이 모두 Lai Châu 를 지목하고 **631,219 Mg CO2e/yr** 를 표시한다.
(기대값 출처: spatial/layers/b-034.json, 2001–2024)

주의: 기대 변수를 먼저 선택하지 않으면 기본 표시 변수(탄소 저장량)와 기대 행(총배출)이
서로 다른 값이 되어 비교 자체가 성립하지 않는다. 변수·기간 선택을 대조보다 앞에 둔다.

## 3. 확인된 실제 결함

### MAP-001 (P1) 중간 폭에서 패널이 지도를 절반 이상 덮음
canvas 영역 중 실제로 포인터가 닿는 비율:

| 폭 | canvas | 도달 가능 |
|---|---|---|
| 1920 | 1201x934 | 96.2% |
| 1440 | 721x934 | 93.6% |
| **1024** | 749x834 | **49.8%** |
| **958** | 683x852 | **44.8%** |
| 768 | 753x558 | 89.7% (세로 배치로 전환) |

§6 이 명시한 958/1024 에서 의미 있는 지도 면적이 확보되지 않는다.

**원인**: 769–1099px 구간에서 우측 `.cdp-map-evidence` 가 `position:absolute` 로 지도를 덮으며
`top:12 / bottom:12` 로 전체 높이를, `width:min(340px, 100%-300px)` 로 폭을 차지한다.
좌측 목록 260px 과 합쳐 기본 상태에서 지도 절반이 패널 뒤에 있었다.

**수정**: 같은 구간에서 좌측 목록 260→220px, 우측 패널 폭 340→300px,
전체 높이 대신 `max-height:65%` + `overflow-y:auto`. 패널·토글·resize 는 그대로 둔다.

| 폭 | 수정 전 | 수정 후 |
|---|---|---|
| 1024 | 49.8% | **80.9%** (canvas 749→789) |
| 958 | 44.8% | **80.4%** (canvas 683→723) |
| 1440 | 93.6% | 93.6% (해당 구간 아님, 무변화) |

선택 상태에서 패널 높이 530px, `scrollHeight 1645 > clientHeight 528` 로 스크롤되며
viewport 안에 있고 내용이 잘리지 않는다(접기 토글 유지).

### MAP-002 (P2) A-024 선로가 패널에 완전히 가려 hover 불가
1440 에서 `A-024-WB2016-0001` 에 닿는 모든 좌표의 최상단 요소가 `dt`(패널 정의목록)이다.
클릭 발송은 되지만 팝업이 뜨지 않는다. MAP-001 과 같은 원인으로 본다.

### MAP-003 (P2) B-048 팝업·패널에 광종이 없음
지도 feature properties 는 recordId/elementId/countryIso3/name/entityType/referenceYear/selectionKey 뿐이다.
원천에는 `광종`(Ban Phuc = 니켈), `소재_행정구역_성`, `특이사항` 이 있으나 지도로 연결되지 않았다.
§6 "원천에 있는 발전원·용량·전압·광종·사업기간을 팝업·상세로 연결" 미충족.

## 4. 아직 하지 않은 것

12개 레이어 중 3개만 검수했다(대표 기하 검증 목적).
추천 분석 5개, 비교 모드, 나머지 9개 레이어는 미검수.
자동 수집 결과를 의미 검토 완료로 간주하지 않는다.
