## V164 — 지도 배치·방글라데시 지도 동등화·그래프 표기 전수 점검

- 사용자 지시(10-04)
  - 지도 레이아웃 검토, '지형'·'배경지도' 삭제
  - 버튼·필터·기능·시각화 전수 검토(데이터 구조 수정 최소)
  - 베트남 기준 방글라데시 지도 완성
- 데이터 파일·구조 변경 0, 화면 표기만 변경
- 상세: `reports/v164/REVIEW_V164.md`

### ① Preview
- Vercel Preview: 이 PR의 Vercel 댓글 링크(브랜치 `fix/v164-bgd-map-parity`)

### ② 화면이 바뀌는 곳과 확인 경로
| 화면 | 확인 경로 |
|---|---|
| 데이터 지도 배치 | `?country=VNM#map` → 왼쪽 위에 배경지도 카드 없음, 행정경계 선택 아래 안내 카드 |
| BGD 지점 아이콘 | `?country=BGD#map` → 발전소·재해 이력·대학·연구기관·NGO 등 체크 → 아이콘과 범례 |
| BGD 송전망 | `?country=BGD#map` → 송전망 체크 → 전압 5구간 범례 + 중간점 안내 |
| 국가 비교 그래프 | `?view=data&element=A-001&country=BGD#element-detail` 맨 아래 비교 블록 |
| 큰 수 축·판단 포인트 | `…element=A-003&country=BGD…` → 축 억 단위, '4,563.19억 USD' |
| 발전 설비용량 누적 | `…element=A-018&country=VNM…` → 약 8.7만 MW, 제외 계열 안내 |
| 계열 많은 시계열 | `…element=D-011&country=BGD…` → 8개 먼저, '다른 계열 98개 보기' |
| 홈 작은 지도 | `?country=BGD#home` → 송전망 전압 범례, 배경지도 버튼 없음 |

### ③ 전후 캡처(1440px) — `reports/v164/screens/`
- `map-layout-VNM-{before,after}` · `map-BGD-A-023-{before,after}` · `map-BGD-A-024-{before,after}`
- `detail-BGD-A-003-…` · `detail-VNM-A-018-…` · `detail-BGD-D-011-…` · `detail-BGD-A001-compare-…`
- before = 운영(main d825ee4), after = 이 브랜치 production 빌드

### 검증
- tsc 0 · 단위 테스트 903 통과 · CI=true 빌드 경고 0
- 그래프 207개 단위·눈금 확인, 12자리 눈금 9 → 0
- 반응형 9화면 × 6폭 가로 넘침 0
- 공개 문구 재스캔: 내부 코드 0
- 게이트 기대값 변경 2건(배경지도 선택 단계 조건화): 사유는 REVIEW 4절

### 후속(용역사 회신 대기)
- BGD 송전망 선형 좌표(STADT) → 받으면 베트남과 같은 선 지도로 전환
- BGD A-016 1965~1970 0값 · A-018 합계 행 기술 분류 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01S2RXaZNPtnFSDFcQZeGuVf
