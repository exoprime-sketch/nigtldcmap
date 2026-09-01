# 베트남 데이터 상태 정책 V128

## 정책 목적

데이터 존재 여부, 공개 승인, 원천 이용조건과 다운로드 제공 여부를 서로 다른 판단으로 관리한다. 공개가 승인됐다는 이유로 빈 양식을 실제 데이터로 바꾸지 않으며, 다운로드가 제한된 데이터도 화면 표시 가능 여부와 제한 사유를 정확히 설명한다.

## 내부 상태

| 내부 상태 | 의미 | 사용자용 상태 |
|---|---|---|
| `actual` | 공개 가능한 실제 행이 존재 | 데이터 제공 |
| `public-authorized` | 별도 공개결정이 적용됐고 실제 행이 존재 | 데이터 제공 |
| `partial` | 실제 행이 있으나 기간·지역·변수 일부만 제공 | 일부 데이터 제공 |
| `schema-only` | 입력 구조만 있고 실제 입력값이 없음 | 입력 양식 |
| `data-entry-planned` | 양식 또는 계획이 있고 후속 입력 예정 | 입력 예정 |
| `not-collected` | 확인된 원자료가 아직 없음 | 원자료 미수집 |

`public-authorized`는 내부 거버넌스 정보이며 일반 이용자 상태명으로 표시하지 않는다.

## 데이터 존재 판정

1. 숫자·텍스트·boolean observation의 실제 populated 값을 센다.
2. entity는 공개 whitelist 필드 중 식별 가능한 실제 레코드가 있는지 확인한다.
3. 빈 문자열, null, 양식 설명, 예시행, explicit placeholder는 populated 행으로 세지 않는다.
4. 누락값을 0으로 대체하지 않는다.
5. 공개 승인과 데이터 존재 여부를 독립적으로 판정한다.

비 populated 요소의 승인 처분은 다음과 같다.

- `schema-only-accepted`: 양식만 존재함을 설명하고 수용
- `data-entry-planned-accepted`: 입력 예정임을 설명하고 수용
- `not-collected-accepted`: 공식 자료 미확보와 후보 출처를 기록하고 수용
- `acquisition-required`: 공개 가능한 공식 자료가 확인되어 후속 수집 필요
- `blocked-by-error`: 자산·계상·변환 오류로 공개 불가

설명된 미수집은 플랫폼 오류가 아니다. `blocked-by-error`만 release blocker로 처리한다.

## 다운로드 상태

| 다운로드 분류 | 사용자용 badge | 사용자 설명 |
|---|---|---|
| `downloadable` | 다운로드 가능 | 공개 CSV/JSON을 내려받을 수 있음 |
| `display-only-by-source-license` | 화면에서만 제공 | 원자료 이용조건에 따라 화면 열람만 제공 |
| `display-only-by-publication-policy` | 화면에서만 제공 | 재배포가 허용된 데이터만 다운로드 가능 |
| `no-populated-download-record` | 다운로드 자료 없음 | 실제 입력값이 없어 다운로드 파일을 제공하지 않음 |
| `download-generation-error` | 내부 오류 | 공개 전 반드시 0건이어야 함 |

버튼을 숨기는 것만으로 제한을 표현하지 않는다. 표시 전용·자료 없음은 badge와 사용자용 이유를 함께 제공한다. `redistributionAllowed=false`, `rights gate`, `publicationDecision` 같은 내부 표현은 노출하지 않는다.

## 공개 제목과 상태의 단일성

각 요소는 acceptance matrix의 `publicTitle`과 `userFacingStatus`를 공개 기준으로 사용한다. 홈, 전역 검색, 데이터 찾기 카드, 상세, 지도, 다운로드에서 같은 값을 사용한다. element ID나 내부 기술 코드를 주 제목으로 사용하지 않는다.

## 출처와 이용조건

- 원천 license, 이용약관, attribution을 그대로 보존한다.
- 프로젝트의 publication decision을 원천 license로 대체하지 않는다.
- 공개 데이터에는 source organization과 공식 URL 또는 공식 원문 locator가 있어야 한다.
- 원문 caveat를 자동 노출하지 않고 검토된 사용자용 limitation 문장만 표시한다.
- 내부 검토기록과 기술 추적정보는 공개 DOM과 기본 다운로드에 포함하지 않는다.

## 유의사항 정책

유의사항은 데이터별 whitelist로 관리한다. 다음 경우에만 표시한다.

- 기간 공백
- 원천 수치 불일치
- 방법론 변경
- 지역 커버리지 제한
- 공간 정확도 제한
- 갱신 지연

항목이 없으면 유의사항 section을 생성하지 않는다. “원천에 없는 값을 0으로 만들지 않는다” 같은 공통 원칙은 데이터 이용안내에만 둔다.

## 지도 상태 원칙

- 지역값이 없으면 결측으로 표시하고 0으로 표시하지 않는다.
- 국가 평균을 63개 성·시 값으로 복제하지 않는다.
- 개편 전 63개 성·시와 다른 행정구역 체계를 섞지 않는다.
- 실제 공간원천이 없는 데이터는 활성 레이어로 만들지 않는다.
- 위치 정확도 제한은 사용자용 문장으로 제공한다.

## 변경 통제

상태 변경은 ETL 결과, source evidence와 publication decision을 함께 검토한 뒤 수행한다. catalog만 수동 수정하지 않는다. 변경 시 acceptance matrix, download reconciliation, 데이터 찾기·상세·지도·다운로드 화면과 audit를 함께 갱신한다.
