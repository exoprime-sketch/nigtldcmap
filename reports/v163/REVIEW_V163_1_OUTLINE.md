# V163-1 방글라데시 국가 외곽선 (2026-10-03)

## 변경
- 자산: `public/data/bgd/v2/geometry/bgd-country-outline-z5.geojson` (88.7 KB, 표시 전용)
  - 원본: 이미 공개 중인 `bgd-country-outline.geojson`(8개 Division 병합, 1.09 MB)
  - 방법: Douglas-Peucker 단순화(0.005°, preserve_topology), 2 km² 미만 섬 조각 156개 제외(115개 유지), 면적 변화 −0.22%
  - 새 좌표 생성 0. 생성기 `tools/etl/countries/bgd/build_country_outline_z5_v163.py`, 매니페스트 `kind: country-outline-z5`·`displayOnly: true`, 무결성 338건 갱신
- 코드: `applyCountryOutlineV163(map, iso3)` (`src/map/layers/baseStyle.ts`)
  - 베트남이 아닌 국가는 Natural Earth 다각형(방글라데시 36개 꼭짓점) 대신 자체 외곽선으로 채움·선을 그림
  - 베트남은 기존 그대로
  - 적용 위치: 큰 지도, 비교 패널, 작은 지도(확대), 상세 정적 지도(해안선)
  - 배경지도 전환 시 채움 투명도는 베트남 채움과 같은 규칙(`mapBackdropV151`)

## 검증
- tsc 0
- 관련 단위 테스트 77/77 (mapBackdrop·miniMap·compareModel·countryContext·detailMap)
- production 빌드 + Chromium 1440px 전후
  - 큰 지도: 자체 외곽선 레이어 있음, Natural Earth 필터에서 BGD 제외
  - 비교 패널 2개: 위와 동일
  - 상세 B-039: 해안선 path 0 → 1
  - 콘솔 오류 0
- 캡처: `reports/v163/screens/outline-bgd-{map,compare,detail}-{before,after}.png`

## 남은 것
- 인접국(인도·미얀마) 선은 Natural Earth 그대로라 국경 부근에 두 번째 선이 보일 수 있음(베트남과 같은 처리)
