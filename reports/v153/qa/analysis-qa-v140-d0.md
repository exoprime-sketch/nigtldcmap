# 카드 → 상세 분석 QA (V140) · d0

실행 2026-09-22T00:13:06.448Z · http://127.0.0.1:4341 · 6개(값 보유 6 · 상태 안내 0) · 배포 버전 일치 예

| 항목 | 통과 | 실패 | 해당 없음 |
| --- | ---: | ---: | ---: |
| cardClicked | 6 | 0 | 0 |
| homeCardClicked | 1 | 0 | 5 |
| selectionUrlPreserved | 3 | 0 | 3 |
| screenLoaded | 6 | 0 | 0 |
| cardValueVerified | 6 | 0 | 0 |
| detailAnalysisFit | 3 | 0 | 3 |
| analysisFit | 6 | 0 | 0 |
| controlsVerified | 1 | 0 | 5 |
| tableValuesVerified | 6 | 0 | 0 |
| mapHandoffVerified | 3 | 0 | 3 |
| mapSymbolVerified | 3 | 0 | 3 |

detailAnalysisFit = 넘긴 선택(측정항목·연도·차원)이 선택기·제목·KPI에 있는지 · analysisFit = 자료 유형에 맞는 주 분석(추세/비교/구성/분포/등록부 목록과 표·단위·시점)이 있는지(152개 전부) · mapSymbolVerified = 지도 대표 기호 선택 후 값·단위·시점·출처·공간 의미가 패널에 있는지(42개)

독립 재계산(다운로드 파일): {"match":6} · 컨트롤 시도 3회 · 표 분류(키: 지표+지역+연도/기간+단위) {"match":6} · 필수 실패 0건

| 요소 | 종류 | click | url | loaded | value | recomp | fit | afit | controls | table | map | symbol | 잔여 문제 / 해당 없음 사유 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-023 | grouped-bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| B-002 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | – | – | controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| B-046 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | – | – | controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| B-047 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | – | – | controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-012 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| E-006 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
