# V163-2 방글라데시 큰 지도 — 8개 Division 경계·한국어 지명 (2026-10-03)

## 문제
- BGD 데이터 지도 첫 화면 안내는 "배경지도와 방글라데시 주(Division) 8개 경계가 준비되어 있습니다"인데 실제로는 국가 외곽선만 보이고 Division 경계·이름이 없었음
- 원인: 큰 지도가 참조 경계(성·시 선)와 한국어 지명을 베트남만 불러옴

## 변경
- `RealMapExplorerPage.tsx`: 베트남이 아닌 국가는 레지스트리 1급 행정구역 자산(`countries.json` adm.level1.asset, BGD 8개)을 참조 경계로 불러와 그림(출처 문구: geoBoundaries · 방글라데시 주(Division) 8개 · CC BY 4.0)
- 한국어 지명: 경계 자산의 `nameKo`(바리살·치타공·다카·쿨나·마이멘싱·라지샤히·랑푸르·실렛). 베트남 34개는 기존처럼 줌 6.3부터, BGD 8개는 첫 화면부터
- `mapBackdropV150.labelNameV151`: 베트남 사전에 없으면 자산의 `nameKo` 사용(베트남 결과 불변)
- 지도 대체 SVG의 지역 이름도 `nameKo`·국가 1급 단위 단어 사용

## 검증
- tsc 0 · 관련 단위 49/49
- production 빌드 1440px 전후
  - BGD 첫 화면: 참조 경계 0 → 15개 피처, 지명 0 → 8개
  - VNM 첫 화면: 참조 경계 42 = 42, 지명 0 = 0(줌 4.99, 변화 없음)
  - 콘솔 오류 0
- 캡처: `reports/v163/screens/basemap-{bgd,vnm}-default-{before,after}.png`
