# 변경 기록

이 문서는 공개 플랫폼의 주요 변경을 기록합니다. 아직 merge·배포·tag가 확인되지 않은 작업은 `Unreleased`에 둡니다.

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
