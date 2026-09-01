# 최종 공개 수용 기준 V129

## 수용 대상

최종 공개 수용은 다음 범위를 하나의 릴리스 단위로 검증한다.

- 원자료 workbook 149개
- framework 및 accounted 요소 152개
- 검증 지도 레이어 13개와 feature 2,904개
- 베트남 행정경계 63개
- 공개 다운로드 요소 114개 이상
- 홈, 데이터 찾기, 152개 상세, 지도, 다운로드, 이용안내, 404
- 지표 해석, 시각화 의미 적합성, 지도 기호·tooltip·click, 공개 문구

보조 benchmark나 해석 자료는 기존 framework 요소를 설명하는 자료이며 새 요소로 집계하지 않는다. 수용검사 때문에 원자료 행이나 공간 feature를 추가·삭제하지 않는다.

## 기존 실제 증거

이 문서 작성 시점에 repository의 기존 보고서에서 확인한 기준선은 다음과 같다. 표의 상태는 해당 보고서가 생성된 커밋의 결과이며, 이후 변경의 통과를 대신하지 않는다.

| 보고서 | 실제 기록 |
|---|---|
| `reports/v129/interpretation-audit-v129.json` | 21/21 PASS, 해석 필요 53, coverage 100%, 누락 방향·척도·임의 구간 0 |
| `reports/v129/map-layout-audit-v129.json` | 17/17 PASS |
| `reports/v129/map-interaction-audit-v129.json` | 24/24 PASS, 13개 레이어, 2,904 feature, orphan 0, tooltip·click 13/13 |
| `reports/v129/chart-polish-audit-v129.json` | 13/13 PASS |
| `reports/v129/specialized-audit-v129.json` | 16/16 PASS |
| `reports/v129/release-audit-v129.json` | 10/10 PASS, 기존 공개 릴리스 회귀와 production build PASS |

## 최종 판정 항목

### 데이터 계상

- framework/accounted 152/152
- unexplained 0
- 행 균형과 자산 무결성 통과
- 설명 자료를 framework element로 중복 집계하지 않음

### 시각화와 해석

- 152개 요소의 의미 적합성 판정 존재
- 실제 데이터는 적합한 주 분석 또는 명시된 specialized 분석 보유
- 상태-only 요소에 가짜 차트 없음
- 비직관 지표의 방향·척도·비교단위 설명 coverage 100%
- 부적절한 연속 추세, 혼합 분모 축, 결측 0 대체 없음

### 지도

- 레이어 13, feature 2,904, ADM1 63 유지
- 모든 보이는 기호의 데이터명·주/보조 역할·변수·단위 식별
- orphan, 알 수 없는 기호, tooltip 없는 feature, click 상세 없는 feature 0
- 지역 취약성은 원천 권역과 6개 권역 순위를 명시
- 지도 변수와 tooltip 단위·라벨 일치

### 공개 문구

- 서비스명: `개도국 기후기술 협력 플랫폼`
- 범위: `현재 제공 국가 · 베트남`
- 공개 H1에 `베트남 파일럿` 없음
- 구현 세대명, 내부 시각화·추적·지도 엔진 용어가 공개 문구·접근 가능한 이름에 없음
- 제목, 상태와 다운로드 문구가 홈·찾기·상세·지도·다운로드에서 일관됨

### production browser

- 390, 768, 1024, 1280, 1440, 1920px에서 주요 화면 확인
- horizontal overflow 0
- console application error 0
- JSON의 HTML 오응답과 깨진 asset 0
- 빈 지도 0

## 감사 산출물

최종 판정은 다음 산출물을 사용한다.

- `reports/v129/visualization-semantic-fit-v129.csv`
- `reports/v129/visualization-semantic-fit-v129.json`
- `reports/v129/semantic-fit-audit-v129.json`
- `reports/v129/map-feature-join-audit-v129.json`
- `reports/v129/public-copy-audit-v129.json`
- `reports/v129/final-screens-audit-v129.json`

각 감사 보고서는 실제 입력, 세부 실패 목록과 생성시각을 포함해야 한다. 보고서 파일의 존재만으로 통과하지 않으며, production build에서 동적 경로를 열지 않은 정적 문자열 검사는 browser 수용검사를 대체하지 않는다.

## 최종 실행

```powershell
npm run finalize:public-v129
```

최종 공개 상태는 위 명령이 다음을 모두 만족할 때만 PASS다.

- 모든 하위 감사 exit code 0
- production build 성공
- visualization fit 152/152
- 공개 기술 용어 0
- 지도 orphan·unknown·unclickable 0
- console error·blank map·broken asset 0
- remaining blocker 0

## 허용 gap과 blocker

허용 gap은 공식 자료 미수집 상태가 사용자에게 설명되고 backlog가 기록된 경우, 원천 이용조건 때문에 화면에서만 제공하며 이유가 있는 경우, 동일 버전 세계 benchmark를 검증하지 못해 과장된 비교를 제공하지 않는 경우다.

다음은 blocker다.

- 계상되지 않거나 설명되지 않은 데이터
- 실제 값이 화면에서 숨겨지거나 상태-only에 가짜 값 표시
- 의미가 다른 값을 같은 추세·축으로 연결
- 방향·척도·분모·공간단위 설명 누락
- 지도 orphan, 알 수 없는 기호, tooltip 또는 click 상세 누락
- 공개 화면의 내부 추적·구현 용어
- production runtime, asset, build 또는 회귀 감사 실패

최종 승인 결과와 blocker 수는 `finalize:public-v129`가 생성한 보고서를 기준으로 기록한다. 이 문서는 실패를 무조건 PASS로 바꾸는 예외를 정의하지 않는다.
