## 요약
- 152개 데이터를 **표출 유형 6개(+⓪ 상태 안내) × 데이터 구조 4형태**로 유형화했습니다. 구조 4형태는 S1 국가×연도, S2 지역×연도, S3 위치 개체, S4 비공간 개체입니다.
- 상세 분석 라우팅을 유형 템플릿 + 변형 방식으로 바꿨습니다. 전용 컴포넌트는 6묶음만 남겼습니다.
- 프레임워크 명세서 문구를 그대로 읽어 '데이터 설명' 영역과 카드 명칭 규칙에 반영했습니다.
- 용역사 인계물: 스키마 문서, 인계 문서, xlsx, 구조별 CSV, 대표 화면 6장

## 변경
- 스키마 `docs/DATA_TYPOLOGY_V159_SCHEMA.md`, 인계 문서 `docs/DATA_TYPOLOGY_V159.md`(생성)
- 명세 적재 `import:spec:v159`
  - 명칭 분리 152/152
  - 카드 정의 규칙(문두 기관명 절 제거 78건, 원문 유지 6건)
  - 유의점 타국 문구 치환 64건
  - 사례 366건 + 검증 대기 6건
  - 쓰는 데이터 지표 매핑 94.4%
- 템플릿 U1~U6·⓪, 변형 레지스트리(흡수 28요소), 기후기술 공통 필터, 어댑터 S1~S4, 판단 포인트
- 상세 화면: 출처 윗줄·원데이터명·간략 정의 → 데이터 설명(활용 사례 접힘) → 참고문헌 → 판단 포인트 → 분석
- 데이터 찾기: 카드 제목 교체, 주 사용자·유형 필터
- 계약 152행에 displayType·structure를 넣고, E-016·E-017은 ⓪ 상태 안내로 전환
- 용어집 33건, 허용목록 4건

## 검증
- tsc 0, 단위 테스트 368/368
- `qa:typology:v159` 152/152
- 회귀: 1순위 섹션 DOM 동일 145/152. 의도 외 변경 0이고, 차이 7건은 ⓪ 상태 화면입니다.
- 넘침: 12화면 × 6폭 = 72건 모두 0
- 레거시 감사 선행: entity-cards·portfolio·generic-detail·map-list·glossary 모두 통과
- `finalize:v151` 통과
  - release:v136 79/79, role-split 53/53, boundary-34 21(+1 skip), boundary-policy 24/24
  - analysis QA: 필수 실패 38(기준선 41 이하), 신규 0
- `qa:typology:v159` 152/152, `qa:detail-contract:v153` 152/152, 대표 12화면 회귀 12/12
- 게이트 대응: 명세서 문구 override 1건(B-028), 명칭 규칙 V159 QA 갱신, analysis QA ⓪ 판정 규칙(REVIEW §4.1·§5)

## 결정 필요
- 계약 4건: B-014 '표 전환', C-002·C-019는 ⑥인데 숫자 1순위, E-008 제외 요소
- E-016·E-017의 찾기 노출·다운로드 비공개 범위
- S2 납품 형식: `1.1_observation` + 지역 열 방식 권장
- 검증 대기 사례 6건 확인

상세: `reports/v159/REVIEW_V159.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
