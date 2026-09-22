## 목적
- 병렬 세션 ③ / PR-F1 — V155-1 지도 자산 확보(P6a). 승인 항목 1·3·4: B-017 Aqueduct 4.0 유역, A-027 OSM 도로·철도, A-028 OSM 항만·댐·저수지.
- 이 PR은 **정적 자산·계약 제안·문서만** 추가한다. map-index 등록·화면 연결은 P2b merge 후 P6b(소규모 PR)에서 한다. 화면 변화 없음.

## 변경
- 신규 자산 `public/data/vietnam/v2/geometry/`: `vnm-aqueduct40-basins.geojson`(442, gzip 0.85 MB) · `vnm-aqueduct40-basins-l6.geojson`(58 유역, 0.49 MB) · `vnm-roads-rail.geojson`(8,114 선형, 1.75 MB) · `vnm-roads-rail-overview.geojson`(0.81 MB) · `vnm-water-coastal-infra.geojson`(항만 66·댐 1,255·저수지 237, 1.22 MB)
- `geometry-manifest.json` 배열 끝에 항목 5개 추가(기존 항목 불변; 세션 ① 항목과 충돌 시 양쪽 유지). `asset-integrity.json` 재생성.
- 값 초안 `spatial/pending-v155/b-017.json`(stringId 조인, 3,113개 값, pending) · 레이어 계약 제안 `spatial/pending-layers-v155.json`(B-017 unit-choropleth/boundaryPolicy none, A-027 line class별 스타일, A-028 point+polygon kind별 아이콘 키)
- 빌더 `tools/vietnam_spatial/build_aqueduct_basins_v155.py`, `build_osm_roads_rail_v155.py`, `build_osm_water_coastal_v155.py`, `osm_common_v155.py`, `verify_assets_v155.py`, `requirements-v155.txt` · 오프라인 재빌드용 캡슐 `source/vnm-aqueduct40-baseline-annual-source.geojson.gz`(659 KB) · `source/README.md` 출처·URL·해시·일시
- 문서 `docs/DATA_ASSETS_V155.md`, `reports/v155/REVIEW_V155-1.md`, `reports/v155/assets-v155.json`, PNG 4장, 추적표 B-017·A-027·A-028 행 "자산 확보(P6a) → 등록 대기(P6b)"

## 검증
- B-017 조인 **443/443**(string_id), 점수 CSV↔GDB 대조 불일치 0. 원천 GDB 도형이 빈 평가구역 1건(`436707-VNM.23_1-1892`)은 미표시·기록. 34 교차 5% 규칙 적용, CSV 대응 불일치 44건은 GADM↔geoBoundaries 경계 차이로 목록만 기록.
- 자산 공통: 중복 ID 0, 빈 기하 0, bbox 밖 0, EPSG:4326, gzip 예산(3/4/2 MB) 내. GEOS 무효 1건은 원천 링 자기접촉 보존.
- 경량 감사: `audit-vietnam-generated-data-v133` PASS 15/15. `audit-vietnam-map-v124` 43/45 — 실패 2건은 B-033 결측(미변경 파일)으로 기존 상태.
- 미실행(지시): 전체 `finalize:v140`, 브라우저 감사, CI 대기.

## 금지 준수
- `map-index.json`, `scripts/v138/build-map-layers-v138.mjs`, `src/pages/RealMapExplorerPage.tsx`, `src/data/map/*`, 상세 컴포넌트 미편집. 원본 대용량(PBF 329 MB, Aqueduct zip 261 MB) 미커밋(`_source/`). 좌표·값 생성 없음.

## 후속(P6b)
- map-index 등록, 렌더러 `unit-choropleth`/`point-and-polygon` 지원, V152 아이콘 키 확정, `pending-v155/b-017.json` → `spatial/layers/` 이동.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
