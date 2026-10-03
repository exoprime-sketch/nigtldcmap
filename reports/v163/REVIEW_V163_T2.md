# V163-T2 — 공개 문구 정리 2차 (지도·상세, 양국)

브랜치 `feat/v163-text2` (origin/main c9b96fd에서 분기). 데이터·다운로드 ZIP 정리(15·19)는 세션5 `feat/v163-dl-clean`에서 별도 진행.

## 변경

| # | 항목 | 화면 | 변경 |
|---|---|---|---|
| 10 | 지역명 한글 | 지도 자료정보 요약(값이 가장 작은/큰 지역), 겹친 위치 선택 목록 | `Huế` → `후에 (Huế)`, BGD `Mymensingh` → `마이멘싱 (Mymensingh)` (선택 패널 제목과 같은 `formatRegionListV161`, VNM은 34/63 경계 기준) |
| 12 | 경계 출처 이중 표기 | 데이터 지도 하단 출처 | 대체(SVG) 지도용 출처 줄은 배경지도가 준비되지 않았을 때만 표시 — 지도 출처 줄 1개만 남음 |
| 13 | 원문 값 라벨 | 지도 클릭 패널(BGD 점 레이어) | B-012 세부유형 `Riverine flood`→`하천 범람` 등(EM-DAT 분류), A-028 `river`→`하천`(OSM 사전), D-012 상태 `shelved - inferred 2 y`→`보류(2년간 진행 소식 없음)`(GEM 정의)·중복 '상태' 줄 제거·국적 `China(20%)`→`중국(20%)`, A-023 `원천 geolocation_source: WRI`→`원천 제공 좌표(WRI)`, B-048 `Processing Plant`→`가공 설비`, 소재 주 `Chittagong`→`치타공 (Chittagong)` |
| 14 | BGD 상세의 베트남 설명 | BGD A-024·C-015·C-016(및 A-022) | 레지스트리 `adm.publicTerms`(VNM)에 `PDP8`·`EVN`·`QĐ-TTg` 추가 + 라틴 문자 공개 용어도 다른 나라 용어로 인식 → BGD 화면에서 해당 문장 비표시(유의사항·설명) |
| 16 | A-026 문장 | 양국 A-026 활용 방법 | '현재는 값을 준비 중이어서 채워지는 나라부터 보여 준다.' 삭제(양국 모두 값 있음) — `specTextOverridesV159.json`·`SPEC_TEXT_CORRECTIONS.md`에 기록 |
| 17 | B-048 `MRDS dep_id` | 지도 클릭 패널 | 원천 레코드 ID 절 비표시, `(occurrence)` 같은 원문 괄호 제거 |
| 18 | A-010 가스명 | 양국 A-010 상세 | 판단 포인트 최신값에 `메탄(CH₄ 환산) 기준` 표기(여러 계열 요소 공통), 국가 비교 제목 `CH4(CO2 환산)`→`메탄(CH₄ 환산)`, '가스이(가)'→'가스가' |

데이터 값·좌표·경계는 바꾸지 않음(표시 라벨만). 알 수 없는 값은 원문 그대로.

## 검증(로컬 production 빌드 `tmp/build-v163-t2`)

- `tsc` 0 · 단위 테스트 88 suites / 885+ 통과(신규 `seriesLabelV163`·`mapFactValueLabelsV163`·`countryTermsV158` 추가) · 빌드 통과
- 상세(바뀐 13개 × 양국): BGD A-024·C-015·C-016·A-022 `PDP8`/`EVN` 0, A-026 '준비 중이어서' 0, 콘솔 오류 0. 남은 플래그는 geoBoundaries(camelCase 오탐)와 C-018 국가 비교 블록의 베트남 쪽 값(정상)
- 지도 BGD A-023·A-028·B-012·B-048·D-012·B-028·B-005, VNM B-005·B-007·A-023: 그려짐·클릭 정상, 클릭 패널 원문 키 플래그 0
- 캡처: `reports/v163/screens/t2-BGD-A-010-{before,after}.png`, `t2-VNM-A-010-*`, `t2-BGD-C-016-before.png`(after는 유의사항 패널 자체가 없어짐)

## 미완료·사유

- 명세서 import(`scripts/v159/import-dataset-spec-v159.mjs`)는 현 카탈로그와 사례 매핑이 맞지 않아(492→478) 중단됨 — 기존 상태. A-026 정정은 override 등록 + 산출 JSON 동일 결과로 직접 반영, 다음 import에서 같은 결과
- 정정표 「2_국가별 문구」의 BGD 열은 import 산출물이라 이번 PDP8 규칙 확장(화면)과 차이가 있을 수 있음 — 다음 import 때 재생성
- VNM B-012 출처 문구 'Archive v2026-04-30 확인'(확인 날짜 메모)·다운로드 ZIP 내부 작업 파일명·quality-report 메모 → 세션5 V163-DL(ETL)
- BGD C-025 기술 분야(Verra 분류 영문), D-012 국적 일부 국가는 원문 유지(사전 미등재)
