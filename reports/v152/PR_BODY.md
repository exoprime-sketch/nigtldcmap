## 요약
- 홈 '주요 지역 데이터'와 상세 작은 지도를 **확대·이동 가능한 공용 미니맵**(`MiniMapV152`)으로: 첫 화면은 기존 정적 SVG, 마우스를 올리거나(300ms)·포커스·터치·클릭·버튼 조작 시 MapLibre 엔진(동적 청크)으로 전환. Ctrl+휠 확대(휠만은 페이지 스크롤), 드래그·두 손가락 이동, [+][−][전체 보기][배경지도], 키보드, 팝업, '큰 지도에서 비교' 위치·배율 인계
- **데이터별 지도 아이콘**: 점 계열 15개 레이어에 분류별 아이콘 35종(Tabler MIT · Material Apache-2.0 · 자체 제작 2). 큰 지도·미니맵·범례·팝업이 같은 모듈(`mapIconsV152`)을 씀
- 레이어 렌더러를 `src/map/layers/*`로 추출해 큰 지도와 미니맵이 같은 코드로 그림(추출 커밋은 화면 변화 0 — 스타일 스냅샷 94회 차이 0)

## 변경
- ① `refactor` 렌더러 추출: `src/map/layers/` 15개 모듈, `prepareMapLayerV152`/`mountPreparedMapLayerV152`/`renderMapLayerV152`(options: icons·labels·interactive·clusterMaxZoom), `RealMapExplorerPage.tsx` 9,296 → 7,829줄
- ② 아이콘 모듈·라이선스: `src/data/map/mapIconsV152.ts`·생성 path 파일·`MapIconSpriteV152`·`MapIconLegendV152`, 이용안내 `#guide-map` 출처 문단, `docs/MAP_ICON_CONTRACT_V152.md`
- ③④ 미니맵 + 아이콘 적용: `MiniMapV152`·`miniMapEngineV152`(동적)·`miniMapStateV152`, `DetailLocationMapV148` 통합(파일명·props·testid 유지), `App.tsx` 인계(`view`·`mapSelectors`). 큰 지도 점 = 흰 원 배지 + 아이콘·클러스터 대표 아이콘·hover 링·KR 표시, 범례 아이콘+분류명+개수(지도 피처로 계산), 팝업·우측 패널 라벨형 카드(`facilityCardV153`)
- ⑤ 첫 로드 경량화(아이콘 묶음 동적 청크, 배경지도 판단은 엔진으로), 활성 직후 빈 지도 수정, **시설 카드 숫자 결측이 '0'으로 보이던 기존 결함 → '미기재'**(C-025 262건), 팝업 소재지 중복 주석 제거, 범례 KR CSS 오류 수정
- 러너 `scripts/v152/`(스타일 스냅샷·미니맵 조작·아이콘·6폭·홈 LCP), 문서 `docs/MINIMAP_V152.md`, `reports/v152/REVIEW_V152.md`, `CHANGELOG.md`, 추적표 E-018

## 검증
- `tsc` 0 · `test:unit` 467/467 · production 빌드(CI=true) 경고 0
- 미니맵 러너: 홈 + 상세 8개(A-023·A-024·B-004·B-023·B-033·C-025·E-018·B-021) × 25검사 + 390px 터치 2 × 6검사 전부 통과, 콘솔 0 — Ctrl+휠·드래그·버튼·키보드 실측, 휠만은 페이지 스크롤·배율 불변, 화면 밖 해제(생성=해제), 큰 지도 인계 카메라 일치
- 아이콘 러너: 15개 레이어 아이콘 부여·등록 100%, `styleimagemissing` 0, 범례=지도, 390px 배지 지름 ≥ 18px / 실제 데이터 전수 테스트 대체 아이콘 0건
- 6폭 × 10화면 60/60 넘침 0 · 홈 LCP 중앙값 144 → 144 ms · 의도 전 maplibre·엔진 청크 요청 0 · 첫 로드 JS gzip +5.9 KB(홈·선/면), `main.js` +1.1 KB
- `qa:detail-contract:v153`·`review:screens:v138`(8개) 통과, 인식 목록형 구 감사 14/15(map-interaction v129는 main에서도 실패하는 V129 기대값)
- `finalize:v140` 1회: 통과 — `release:v136` 79/79 · `qa:role-split:v140` 52/52 · `qa:analysis:v140:baseline` 필수 실패 39(기준선 41 이내, 새 실패 0)
- e2e: 213/214 — 실패 1건 `visual › detail-a016`은 D1(#27) 이후 기준 이미지 미갱신(D1 PR의 advisory e2e에서도 동일 실패), 미니맵이 들어간 홈 기준선(win32)은 통과
- CI 정적 게이트의 `LARGE_SOURCE_TABLE` Chrome 기동 실패는 새 러너 이미지 문제 → #29로 main에 먼저 반영, 이 브랜치에 main 병합

## 지시서와 다른 점
- 엔진은 조작 의도 시에만 켬(시간 경과 자동 없음)·홈은 히어로 지도만 — 사용자 결정(2026-09-24)
- 비교 모드 아이콘은 V135 창 색 계약 때문에 후속, 정적 SVG는 63개 경계 그림 유지(활성 시 34개 기준), 점 계열은 15개 — 상세는 `reports/v152/REVIEW_V152.md`

## 병합 전
- P7(데이터 전면 갱신) 병합 후 origin/main을 합치고 아이콘 전수 테스트·아이콘 러너를 갱신 데이터로 재실행
- Vercel Preview 확인 · 사용자 승인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
