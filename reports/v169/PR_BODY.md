## V169 — 상세 '활용 사례'를 '활용 예시'로 바꾸고 'AI 생성' 표시

요청(2026-10-06, 팀원 의견): 활용 사례는 AI로 작성한 내용이므로 '활용 예시'로 이름을 바꾸고 'AI 생성' 표시를 붙임.

- 상세 보고: `reports/v169/REVIEW_V169.md` · 용역사 통보: `reports/v169/VENDOR_NOTICE_V169.md`

### 변경
- '데이터 찾기' 상세 → '데이터 설명'의 접힘 제목: '활용 사례 N건' → '활용 예시 N건'
- 제목 오른쪽에 'AI 생성' 표시(접힌 상태에서도 보임)
- 적용: 공개 141개 요소 전부, 364건(베트남·방글라데시)
- 그대로: 카드 내용·건수·'검증 대기' 표시, E-020 '지원제도와 활용 사례'(실제 수행 기록)
- 데이터·생성 자산 변경 없음

### 검증
- tsc 0 · 단위 시험 1,669 통과(1건 추가) · `CI=true` 빌드 경고 0
- 실제 브라우저: 베트남 A-001·방글라데시 A-003 '활용 예시 3건 AI 생성', 6폭 가로 넘침 0, 콘솔 오류 0
- 필터 검사: source-notes(변경 전후 동일, D-025 기존 1건은 무관) · 문구 스캔(식별자·국명·'핵심') 통과
- 기대값 변경 없음

### Preview 확인
- Preview URL: PREVIEW_URL

| 화면 | 경로 | 볼 것 |
|---|---|---|
| 상세(베트남) | `/?view=data&country=VNM&element=A-001#element-detail` → '데이터 설명' 펼치기 | '활용 예시 3건' 옆 'AI 생성' 표시. 펼치면 예시 카드 3건 |
| 상세(방글라데시) | `/?view=data&country=BGD&element=A-003#element-detail` → '데이터 설명' 펼치기 | 같은 표시 |

### 전후 캡처(1440px)
- `reports/v169/screens/before-detail-vnm-a-001-1440.png` → `after-detail-vnm-a-001-1440.png`
- `reports/v169/screens/before-detail-bgd-a-003-1440.png` → `after-detail-bgd-a-003-1440.png`

PR_FOOTER
