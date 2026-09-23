## 목적
- 병렬 세션 ③ 후속 / PR-F2 — V155-2 데이터 확보(P6c). 승인 항목 2·6: B-008 해수면 상승 '침수 가능 저지대' 레이어(DEM 기반, 개략), D-022 개발금융·PPP 사업 소재 성·시.
- 이 PR은 **정적 자산·값 초안·계약 제안·문서만** 추가한다. map-index 등록·화면 연결은 P6b. 화면 변화 없음.

## 변경
- 신규 자산 `public/data/vietnam/v2/geometry/`: `vnm-slr-lowland-le0p5m.geojson`(20 성·시, 691 km², gzip 0.20 MB) · `-le1m`(20, 1,429 km², 0.39 MB) · `-le2m`(23, 9,465 km², 1.96 MB). 높이는 Copernicus DEM GLO-30(DSM, **EGM2008 지오이드 기준**), 해안 30 km 안에서 바다와 8방향 연결된 셀만, 폴리곤·구멍 0.25 km² 미만 제거, 30 m 단순화. 원본 DEM 42타일(1.0 GB)은 `_source/`(미커밋), 해시·시각은 manifest에.
- 값 초안 `spatial/pending-v155/`: `b-008-slr-zones.json`(관측소×시나리오×연도 315행, 중앙값 상승량→3단계 대응만, 보간·예측 없음) · `b-008-lowland-by-adm1.json`(34 성·시 × 3단계 면적·%) · `d-022-locations.json`(15건, 성·시 7·전국 8·미확인 0, 좌표 없음).
- `geometry-manifest.json` 끝에 3항목, `pending-layers-v155.json` 끝에 B-008(`zone-polygon`, native-34)·D-022(`region-choropleth`, native-34, 다수 성 사업 전액 계상) 항목 추가. `asset-integrity.json` 재생성.
- 빌더 `tools/vietnam_spatial/build_slr_lowland_v155.py`, `build_d022_locations_v155.py`, `append_pending_layers_v155_2.py`, `verify_assets_v155.py --set v155-2`; 검수 `source/d-022-review-v155.json`; 문서 `docs/DATA_ASSETS_V155.md` §6·§7, `source/README.md`, 추적표 B-008·D-022 행, `reports/v155/REVIEW_V155-2.md`·`assets-v155-2.json`·`slr-lowland.png`.

## 검증
- B-008: 래스터 포함관계 ≤0.5⊂≤1⊂≤2 assert 통과, 무효 기하 0, gzip 예산 내, 재빌드 바이트 동일. 성별 상위(≤2 m) Cà Mau 2,548 · An Giang 2,540 · Ninh Bình 723 · Cần Thơ 419 · Quảng Trị 409 km² — 메콩·홍강델타 상위. 필수 주의문("30 m 공개 DEM 기반 개략 저지대. 방조제·제방·지반침하·조석·폭풍해일 미반영. 실제 침수 예측이 아니며 상세 계획에는 사용 불가.")이 자산 metadata·manifest·계약·문서에 동일 문장으로 동봉.
- D-022: 매핑률 15/15(100%, 목표 ≥80%), 출처 URL 60/60 응답 200, 성·시명 정규화 100%. IATI 단독 'Hanoi' location은 자리표시자로 미사용, 도시명·촌락명은 사업문서 명시로 대체, 추정 없음.
- 경량 감사: `audit:generated-data:v133` PASS 15/15. `audit:map:v124` 43/45(B-033 기존 실패 2건, 미변경).
- 미실행(지시): 전체 `finalize:v140`, 브라우저 감사, CI 대기.

## 금지 준수
- `map-index.json`·빌더, `RealMapExplorerPage.tsx`, `src/data/map/*`, `src/components/map/*`, 상세 컴포넌트, asset-integrity 수기 편집 없음. 침수 '예측' 표현 없음, 조석·해일 보정 없음, 사업 좌표 추정 없음, 원본 DEM 미커밋.

## 후속(P6b·P4)
- `zone-polygon` 렌더러·34 native 조인 지원 후 등록, `pending-v155/*` → `spatial/layers/` 이동, B-008 상세 성별 막대(by-adm1), D-022 00009 경유 성(PAD 공개 시).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
