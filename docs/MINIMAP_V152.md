# 홈·상세 공용 미니맵 (V152)

작성 2026-09-24 · 컴포넌트 `src/components/map/MiniMapV152.tsx` · 엔진 `src/components/map/miniMapEngineV152.ts`(동적 import) · 순수 로직 `src/components/map/miniMapStateV152.ts` · 렌더러 `src/map/layers/*`(큰 지도와 공유)

## 1. 무엇이 바뀌었나
- 홈 '주요 지역 데이터'(히어로)와 상세 작은 지도(`DetailLocationMapV148`)가 확대·이동 가능한 지도가 됐다. 두 화면 모두 같은 `MiniMapV152`를 쓰고, 지도는 큰 지도와 **같은 렌더러**(`src/map/layers`)·기본 스타일·34/63 경계 외곽선·배경지도·한글 지명·팝업으로 그린다.
- 홈 '주요 데이터' 그리드의 A-024 카드 썸네일(`HomePreviewChartV139` `<img>`)은 카드 미리보기로 그대로 둔다(사용자 결정 2026-09-24).

## 2. 상태기계
| 상태 | 화면 | 들어오는 조건 |
|---|---|---|
| `static` | 기존 정적 SVG(첫 화면·인쇄·JS/WebGL 실패 대비) | 처음, 화면 밖 500ms, 다른 미니맵 활성화 |
| `loading` | 정적 SVG 유지, 엔진 청크 로드·지도 생성 | 조작 의도: 마우스 300ms 머묾 · 키보드 포커스 · 터치 · 클릭 · 확대/축소/전체 보기/배경지도 버튼 · Ctrl+휠 |
| `active` | MapLibre 지도(정적 SVG는 자리만 유지, 화면·보조기기에서 숨김) | 지도 `load` + 레이어 데이터 소스 로드 완료(최대 2.5초 대기 — 빈 지도가 잠깐 보이지 않게, 느린 배경 타일은 기다리지 않음) |
| `error` | 정적 SVG + "확대 지도를 사용할 수 없어 정적 지도를 표시합니다" | 생성 실패(다음 의도 때 1회 재시도) |

- **시간 경과만으로는 켜지지 않는다**(사용자 결정: 방문자 대부분은 엔진·타일을 받지 않음, 홈 감사 `HOME_MAP_ENGINE_NOT_LOADED` 기대값 불변). 지시서 초안의 "보이고 1초 후 자동"과 다른 점.
- 페이지당 엔진 1개(`claimMiniMapSlotV152`): 새 미니맵이 켜지면 이전 것은 `map.remove()`.
- 화면 밖으로 나가면 마지막 카메라를 기억한 채 해제하고, 다시 켜면 그 카메라로 연다.

## 3. 조작
- `cooperativeGestures: true` — 휠만 돌리면 페이지가 스크롤되고 지도는 그대로(안내 "Ctrl+스크롤로 지도를 확대·축소합니다"), 터치는 한 손가락 = 페이지 스크롤, 두 손가락 = 지도 이동·핀치 확대.
- 드래그 이동, 더블클릭 확대, 우상단 [+] [−] [전체 보기] [배경지도], 키보드(캔버스 포커스 시 화살표 이동 · +/− 확대/축소 · Home 초기화 · Esc 팝업 닫기). 회전·기울기는 끔.
- 엔진 영역 `role="application"`, 안내 문구 "Ctrl+스크롤로 확대, 드래그로 이동"(터치 기기: "두 손가락으로 이동, 벌려서 확대")를 `aria-describedby`로 연결.
- 범위: 첫 화면은 레이어가 그리는 피처의 범위를 베트남 본토 핵심 bbox로 자른 범위에 맞춤(padding 24 — 큰 지도 첫 맞춤과 같은 규칙, 먼 섬이 첫 화면을 줄이지 않음), 이동 한계 `maxBounds` = (핵심 bbox ∪ 레이어 bbox) + 2°, 확대 4~12. 첫 화면에서 나라 전체가 보이면 좌우 이동은 한계에 걸리는 것이 정상.
- 배경지도: 기본 켬. 종류는 큰 지도에서 저장한 종류(없으면 지형), 미니맵 토글은 켬/끔만(`cdp-minimap-backdrop-v152`). 타일 오류 3회·5초 내 첫 타일 없음 → 없음으로 자동 하강. 켜져 있으면 지도 좌상단에 짧은 출처 줄(클릭은 지도로 통과). 종류 판단·출처 문구는 엔진 청크 안에 있다(정적 화면은 배경지도 모듈을 받지 않음).
- 한글 지명(국가·도시·성)은 zoom 6 이상에서만.
- 경계: 큰 지도에 저장된 경계 기준(기본 34개, B-021은 6권역)으로 같은 렌더러를 호출한다. 정적 SVG는 지시서대로 기존 63개 경계 그림을 유지하므로, 활성화 시 경계선이 34개 기준으로 바뀔 수 있다(P4 값 인코딩 때 정적 그림 정비 예정).

## 4. 팝업·선택·인계
- 점: 큰 지도와 같은 `createMapPointPopupV152`(→ `createMapFeaturePopupV148`), 면·선: `createPublicMapPopupContentV129` + 경계 정책 문구. 클릭은 팝업 고정 + 선택 강조 + `onSelectFeature(id)`(상세 우측 패널 갱신, V153 차트 연동용 prop).
- '큰 지도에서 비교': 엔진이 켜져 있으면 현재 카메라와 변수·기간을 넘긴다 → `openElementOnMap(…, view)`가 `camera`·`layerSelectors`를 설정 → URL `view=`·`mapSelectors`에 기록(새로고침·공유 유지). 정적 상태면 카메라 없이 레이어 범위에 맞춘다(기존과 같음).

## 5. 성능 예산
| 항목 | 기준 | 방법 |
|---|---|---|
| 홈 LCP | 변화 ±5% 이내 | 엔진은 의도 전 로드하지 않음 — LCP 요소·요청 목록 불변 |
| 상세 초기 JS | 엔진 코드 미포함 | 엔진은 `import(/* minimap-engine-v152 */)` 별도 청크, maplibre 청크도 의도 후 요청 |
| 메모리 | 인스턴스 해제 | 화면 밖 → `map.remove()`, 러너가 생성/해제 수 비교(`__cdpMiniMapStatsV152`) |

## 6. DOM·QA 계약
- 루트 `[data-testid=minimap-v152][data-minimap-state=static|loading|active|error][data-element-id][data-selected-id]`
- 엔진 `[data-testid=minimap-engine-v152][role=application][data-center="lng,lat"][data-zoom][data-minimap-error]`(안쪽 `.minimap152__canvas`가 MapLibre 컨테이너)
- 버튼 `minimap-zoom-in-v152` · `minimap-zoom-out-v152` · `minimap-reset-v152` · `minimap-backdrop-v152`(aria-pressed), 안내 `minimap-help-v152`, 출처 `minimap-credit-v152`
- 인계 버튼: 상세 `detail-map-open-v152`, 홈 `home-hero-map-link-v139`(기존)
- localhost 전용 핸들: `window.__cdpMiniMapV152`(현재 인스턴스), `window.__cdpMiniMapStatsV152 {created, removed}` — 큰 지도의 `__cdpMapV151`와 같은 규칙(배포 사이트에는 없음)

## 7. 검증
- 단위: `src/components/map/miniMapStateV152.test.ts`(상태기계·시간 경과로 켜지지 않음·단일 인스턴스·옵션·인계)
- 러너: `node scripts/v152/minimap-runtime-v152.mjs --build <dir> [--ids …]` → `reports/v152/minimap-runtime-v152.json` + `reports/v152/shots/minimap/`
