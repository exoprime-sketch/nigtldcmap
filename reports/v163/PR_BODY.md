## 요약
V163-T 공개 문구·자료 정리 — 베트남·방글라데시 공통. 최신 main(338e102: #59 비교 보기·#60·#61 BGD 외곽선) merge 위에 문구 수정만 얹음(충돌 1곳 `features.ts`는 main 코드 유지 + `nameKo` 폴백 1개 추가).

- **merge 조건 변경(CLAUDE.md)**: Static gate 녹색 + 바뀐 항목 필터 검사 + 공개 문구 스캔 0 + Preview 캡처 + 사용자 "PR #N 병합". `PR gate finalize:v151`·Playwright(기준 이미지 4건)는 참고용

### 1·2. 내부 검토 메모·작업 파일명(ETL 단계, 생성 JSON 손편집 없음)
- `tools/etl/public_text_v163.py`를 두 빌더(`build_public_v2.py`·`countries/bgd/build_country_v2.py`)가 공개 파일을 쓰기 직전에 적용
- 대상 필드: 출처 표기·이용조건·출처 기관·caveat·note·결측 설명·출처 위치 → 화면·다운로드 ZIP·카탈로그·권리표·semantic 모두
- 규칙
  - 메모 구간 제거: [출처 문구]·[표출범위]·[라이선스 근거/판정/확인]·[처리규칙 …]·[열 구조] 등
  - [기준 원천]/[대조] 표식 제거
  - '처리규칙' 문장·'(yyyy-mm-dd 확인)' 제거
  - 작업 파일명·raw_data 경로 → 요소의 공개 출처명
  - BGD 여러 나라 공통 서식 문장(10개국…) 제거
  - BGD '지역명 (개편 전)' → '지역명'
- '[변경 고지]'는 이용조건(CC BY 4.0 §3(a)(1)(B))이 요구하는 변경 표시라 **문장은 유지**하고 표식·내부 열 참조만 제거
- 걷어낸 메모는 비공개 보고서 `reports/v163/internal-notes-{vnm,bgd}.json`으로 이동
- 재생성(2026-09-30 입고 그대로)
  - VNM `refresh:data`: 152요소 값 변화 0
  - BGD 빌더 + semantic·지도·카드·목록·integrity 체인
  - 직전 커밋과 공개 텍스트 비교: VNM 11,913건·BGD 90,730건 변경, 메모 제거로 설명되지 않는 변경 0
- 공개 문구 스캔 2종(`audit-source-notes-v161`·`public-wording-scan-v157`)에 내부 메모 표식·'처리규칙'·'yyyy-mm-dd 확인' 패턴 추가
- 정책 설명 카드 '출처 N건 · yyyy-mm-dd 확인' → '… 기준'

### 3. BGD 화면의 베트남 행정 표현
- (a) C 계열 표 '지역명 (개편 전)/(현행)' → BGD는 '지역명' 한 열
- (b) 지도 자료정보(i): 다른 나라는 자기 레이어 필드로(성·시·34/63·베트남 문구 0)
- (c) 지도 클릭 패널 끝 '… 성·시 색 표시' → 나라의 1단계 행정구역
- (d) BGD 범례 B-005 'SPEI12' → '연속 건조일수 CDD', B-017 '가뭄 리스크' → 자료의 물 스트레스. 베트남 전용 해설표를 기본 국가에만 적용
- (e) E-012 평균 월임금 'VND' → 레코드 통화(BDT)

### 4. 내부 키·원문 키
- (a) BGD 행정구역 키
  - 찾기·홈 카드 'BGD.4_1_2013' → '쿨나 · 2013년'(카드 빌더)
  - 지도 클릭 'BGD.8_1' → 'Mymensingh'
- (b) snake_case 분류값 → 공개 라벨: D-026 보증금액·건수, E-012 군인·설비·기계 조작원·서비스·판매 종사자, A-013 1차 NDC·INDC
- (c) '협궤 철도 (narrow_gauge)' → '협궤 철도'. 문구 스캔의 'ko (value)' 예외 삭제
- (d, 일부) 지도 운영 상태 existing/operating → '운영'

### 5. 홈
- (i) BGD A-023 카드 '510 · 560 · 100' → 'Khulna (KPCL-2) · 510 MW' 등
- (ii) BGD C-016 '자료 공표 상태 —' 줄 제외
- (iii) 헤더 '데이터 다운로드' 등 이동 시 현재 국가 유지
- (iv) BGD 홈 '다운로드 가능' 100 → 99: 다운로드 목록과 같은 규칙(B-045는 입력 행 0)

### 6. '데이터 준비 중'(정정 지시대로 확인만)
- 숨김·건수 변경 없음
- 가나다순·조회순 모두 맨 뒤, 카드 문구 '데이터 준비 중' 한 가지(BGD·VNM)

### 7. 빈 섹션
- 상세 설명·활용 방법 본문이 비면 제목도 렌더 안 함. 새 문구는 만들지 않음

### 8·9. 홈 BGD 카드(추가 지시)
- **8. A-010**: 'F-gas 1.82 Gg' → 'MtCO₂e · 2024년 네 가스 합계 221' + 가스별 구성비
  - CO2·CH4·N2O·F-gas, 모두 CO2 환산 계열·같은 연도. 질량(Gg) 합산 없음
  - 출처 줄은 기관명 한 번: 'European Commission, Joint Research Centre (JRC) — EDGAR · IEA-EDGAR CO2'
- **9. A-003**: 미니 차트 y축 '01.32억' 잘림 → '4,601억'
  - 축 라벨 정수 표기, 왼쪽 여백은 라벨 길이에 맞춰 넓힘(최소 40px 유지 — 베트남 짧은 라벨은 그대로)

## 화면이 바뀌는 페이지(확인 경로)
| 페이지 | 경로 | 변화 |
|---|---|---|
| 상세 출처 패널(양국) | `/?view=data&country=BGD&element=B-010#element-detail` → '자료 출처·상세 데이터' | 이용조건·출처 표기에서 [표출범위]·[출처 문구]·처리규칙 문장 제거 |
| 상세 출처 줄 | `/?view=data&country=BGD&element=A-029#element-detail` | '[기준 원천]/[대조]' 제거 |
| 상세 C 계열 표(BGD) | `/?view=data&country=BGD&element=C-017#element-detail` | '지역명' 한 열 |
| 상세 빈 섹션(BGD) | `/?view=data&country=BGD&element=B-003#element-detail` | 빈 '상세 설명'·'활용 방법' 제거 |
| 지도(BGD) | `/?view=map&country=BGD#map` → B-002 'i' · B-005 범례 · B-030 Mymensingh | 국가별 정보·범례·지역명 |
| 홈(BGD) | `/?country=BGD#home` | A-010 합계·구성비, A-003 축 라벨, A-023 발전소명, 다운로드 가능 99, C-016 줄 |
| 찾기(BGD) | `/?country=BGD#explorer` → 산림 카드 | 지역 키 → 주 이름·연도 |
| 다운로드 | 홈(국가 선택 상태) → 헤더 '데이터 다운로드' | 현재 국가 유지 |
| 다운로드 ZIP | 각 요소 ZIP의 JSON·CSV 설명 열 | 메모·작업 파일명 제거 |

캡처(1440px, 8·9는 390px 포함, 전 = 운영 main, 후 = 이 브랜치): `reports/v163/screens/text-*`, `detail-*`, `map-*`, `home-5ii-*`, `download-5iv-*`, `finder-6-*`

## 검증(로컬 필터 검사)
- `npx tsc --noEmit` 0 · `npm run test:unit` 879/879 · production 빌드 통과
- 공개 문구 스캔 0
  - 출처 메모 감사: VNM 146·BGD 141 상세 전부 + 찾기·홈·다운로드·지도
  - 식별자·메모 스캔: 826건
- `qa:acceptance:v162` 지도·문구·국가 영역 BGD 7/7·VNM 7/7(국명·고유 행정 표현·국가 선택기 포함)
- BGD 검증기 52/52(커밋 후) · BGD 지도 빌더 `--check` PASS · 데이터 목록 verify 통과

## 남은 것
- 지도 '이 위치의 데이터'(겹침 선택) 보조 팝업의 BGD 지역명은 영문(Mymensingh) 그대로 — 한글 지역명 사전 적용은 별도 경로
- 4(d) 일부: B-012 'Riverine flood'(EM-DAT 세부유형 사전 필요), A-028 'river', B-048 'Processing Plant'·A-023 geolocation_source(노출 위치 미확정) — 다음 라운드
- 레코드 속성 값 안의 확인 날짜(VNM C-002·C-004 등)는 원자료 셀 값이라 이번 정리 대상(설명 필드)에서 제외 — 화면 스캔에서는 미검출
- B-033 등 지역 카드의 '외 N건'은 '주 · 연도' 단위로 셈(같은 주·연도의 원인별 행은 하나로 묶임)
- 공개 파일 `quality-report.json`(화면 미사용)에는 원 메모가 남아 있음

🤖 Generated with [Claude Code](https://claude.com/claude-code)
