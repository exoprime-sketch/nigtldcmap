## V164-2 — 최종 전수 점검(#71 반영본)과 이용조건 메모 정리

- 사용자 지시(10-04 08:53): "병합하고, 플랫폼 전수검토 및 최종화 작업 완료해주세요"
- 데이터 값·구조 변경 0. 공개 텍스트에서 용역사 라이선스 검토 메모만 제거
- 상세: `reports/v164/REVIEW_V164_2.md`

### 최종 전수 점검(#71 병합 후)
- 운영 번들 = 검증 빌드(`main.500aa88f.js`)
- 운영 상세 304쪽: 열림 304 · 오류 0 · 긴 눈금 0 · **이용조건 검토 메모 9쪽** → 이 PR에서 수정
- 데이터 지도 전 레이어: BGD 38/38 · VNM 72/72 렌더·클릭·문구 정상

### ① Preview
- Vercel Preview: 이 PR의 Vercel 댓글 링크(브랜치 `fix/v164-2-final-sweep`)

### ② 화면이 바뀌는 곳과 확인 경로
| 화면 | 확인 경로 |
|---|---|
| 상세 이용조건(BGD E-001·E-004·E-005·E-006, VNM E-001·E-004·E-005·E-006·E-018) | `?view=data&element=E-004&country=BGD#element-detail` → '자료정보·이용조건' 펼침 → 이용조건 |
| 다운로드 화면 이용조건 | `?country=BGD#download` → E-004 선택 → 이용조건 |
| 다운로드 ZIP 18개 | 위 요소 다운로드 → license·caveat 열(값·단위·연도·좌표는 그대로) |

### ③ 전후 캡처(1440px)
- `reports/v164/screens/licence-BGD-E-004-{before,after}.png` · `licence-VNM-E-018-{before,after}.png`

### 검증
- tsc 0 · 단위 906 통과 · CI=true 빌드 경고 0 · dataset-directory 양국 verify 통과
- 이 브랜치 빌드로 상세 304쪽 재스캔: 메모 0 · 오류 0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01S2RXaZNPtnFSDFcQZeGuVf
