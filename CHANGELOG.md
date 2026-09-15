# 변경 기록

이 문서는 공개 플랫폼의 주요 변경을 기록합니다. 아직 merge·배포·tag가 확인되지 않은 작업은 `Unreleased`에 둡니다.

## Unreleased — V138 지도 43개 대상·분석 완성 (후보, production 미반영)

### Added

- 사용자 선정 지도 대상 43개 계약(`src/data/visualization/publicMapTargetsV138.json`)과 pack 기반 레이어 생성 단계(`scripts/v138/build-map-layers-v138.mjs`). 42개 연결(완전 28·부분 14), B-017은 평가구역 경계 미확보로 미연결 사유 기록
- 데이터 지도: 국가 선택 아래 단일 접이식 7분류 체크박스 목록, 다중선택, '현재 색상 표시' 선택기, 표시 끄기(선택 유지), 분류별 선택 개수, URL 복원(`hiddenLayers`), 추천 분석이 카드 조합을 그대로 표시
- 기후 성·시 계열(B-003~B-007)의 시나리오·지표 선택과 지역 클릭 추이, B-008 관측소 시나리오 전망 차트(지도·상세), 문서·사업 지역의 원천 행 목록, 근사 위치 기호
- 상세: 지역·시나리오 계열의 전체 연도 추이 차트와 처음·마지막 변화, 단일 기간 자료의 지역 순위표, B-017 평가구역·등급 분포, A-023 원천별 수록 행 요약, E-008 원천 CTIS 분류 집계, 정책표 구분·단위 열, E-018 진출 상태 분리, E-020 지원제도·활용 사례 분리, E-019 미설치 기관 분리
- 브라우저 QA 스크립트(`npm run qa:map:v138`, `npm run review:screens:v138`)와 43행·152행 보고서, 다운로드 표본 대조(`npm run compare:downloads:v138`)
- 용어 풀이: ADM1·ESA·USAID·CIT·VWEM·LTA·PSMSL·CTIS·FCPF·PPI·OPTA·GADM·HydroBASINS·HydroSHEDS·RX1day·RX5day·CWD·ETS·OSM 추가. 지도 목록 행·자료 정보, 지역·시나리오 화면의 단위·제약 문장, B-008 출처 문장, A-023 원천별 행, 기관 목록의 미설치 문구에 용어 도움말 연결

### Changed

- 지도 관련 감사는 고정 레이어 수(12) 대신 map-index와 43개 계약에서 기대값을 읽음
- 지표 수 집계에서 성·시별 지표 ID를 지표군으로 묶음, 카테고리 비교의 기본 기간을 최신연도로, 정책 설명에서 내부 검토 문구 제거
- B-017 평가구역 순위표의 행 이름을 원천 키(`pfaf-GID_1-aqid`) 대신 '성·시 · 유역 번호 · 대수층 번호'로 표시. B-023·B-028 위치 설명의 경계 파일 재사용 메모, 지도 출처 행의 시트 열 참조 메모를 공개 문장에서 제거
- 지도 전국 요약에서 좌표가 없는 행을 '위치자료 없음(지도 미표시)'으로 따로 세고, '필터로 가려진 수'는 사용자가 고른 필터로 빠진 수만 표시
- 용어 감사(glossary v134)는 V138 추천 분석이 카드 조합을 모두 그리므로 지역 클릭 시 겹침 선택기에서 GVI 항목을 골라 선택 화면까지 검사

## Unreleased — Vietnam pilot V128

### Added

- 152개 요소별 데이터 릴리스 수용 matrix와 미수집·미입력 gap disposition
- 데이터 보유 요소와 다운로드 자산의 reconciliation 보고서
- manifest·catalog·map-index에서 현황을 파생하는 베트남 파일럿 홈
- 공개 데이터명·측정항목·분류·기술·기관·사업·지역을 사용하는 검색 흐름
- 통합 데이터 이용안내와 공개 404 복구 화면
- 데이터 수용, 홈, 공개 경로, 다운로드, 공개화면 V128 audit와 전체 release gate
- root domain과 `/nigtldcmap/` project path를 함께 지원하는 단일 공개 asset URL resolver
- main PR/push release gate, Pages production 배포와 배포 후 public URL smoke workflow
- deployment, security, performance와 production smoke audit
- V127 baseline 대비 entry bundle 회귀 및 지도·검색·element shard lazy-load 보고서
- 배포·운영·데이터 갱신·롤백 문서

### Changed

- 공개 상태를 “데이터 제공”, “일부 데이터 제공”, “입력 양식”, “입력 예정”, “원자료 미수집”으로 통일
- 다운로드 상태를 “다운로드 가능”, “화면에서만 제공”, “다운로드 자료 없음”으로 분리
- 구형 dataset detail, country, compare, insights 경로를 검증된 v2 공개 흐름으로 정규화
- 홈·검색·상세·지도·다운로드의 제목과 상태를 공통 베트남 v2 provider 기준으로 정리

### Security and privacy

- 표준 화면·tooltip·CSV·JSON에서 원본 파일·시트·행, 내부 ID, API 매개변수, pack/shard, hash와 publication decision을 제외
- `_source/` 원본 ZIP·Excel과 credential의 공개 및 Git 추적을 금지

### Release status

- 이 항목은 branch 작업 기록입니다.
- PR 생성, main merge, GitHub Pages 배포와 release tag 완료를 의미하지 않습니다.

## V127 — Public chart interaction and caveats

- 조건부 사용자 유의사항과 정확한 populated/missing 요약 도입
- 공통 interactive 시계열 chart의 축·단위·custom tooltip·keyboard/mobile interaction·X축 zoom/pan/reset 추가
- CPIA 1~6 고정척도와 실제 2005~2015 관측범위 반영
- 기존 데이터·지도·공개화면 회귀 gate 유지

## V126 — Public analysis and map workspace

- 내부 provenance를 제외한 공개 분석 view model과 안전 다운로드 projection 도입
- 데이터 유형별 분석 renderer와 CPIA·직군/임금 전용 분석화면 연결
- 지도 주 분석 레이어 1개, 보조 레이어 최대 2개와 5개 분석 preset 도입
- 사용자용 지도 범례·전국 요약·feature detail·양방향 이동 정리

## V125 — Semantic visualization

- 152개 요소의 의미·분류 차원 및 시각화 계약 생성
- E-012 직군·성별·종사자 수·임금 전용 시각화 구현
- 데이터 찾기와 지도의 selector·URL 상태 계약 연결

## V124 — Vietnam data and spatial assets

- 149개 source workbook에서 재현 가능한 베트남 v2 공개 자산 생성
- 프레임워크 152개 요소 계상과 공개 승인 projection 구축
- 검증된 지도 13개 레이어, feature 2,904개, ADM1 63개 경계 구성
- 실제 송전망 geometry와 지역별 산림·취약성·재생에너지·기후예산 자료 연결
