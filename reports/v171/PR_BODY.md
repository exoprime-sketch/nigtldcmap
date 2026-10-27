## V171 — 지역 단위 표출 기준 반영(법제도·치안 카드, E-001·E-002 기관 화면)

결정: 2026-10-23 공간해상도·플랫폼 설계 확인(연구소 검토, 2026-10-27 확정). 연구소 플랫폼에는 11/10 이후 버전(E-001·E-002)까지 지금 반영(2026-10-27 사용자 지시)

- 상세: `reports/v171/REVIEW_V171.md`

### 변경
1. 법제도·치안 카드(C-009·C-010·C-019·C-011): 지역명이 빈칸이거나 '전국'이면 [지역] 블록 미표시. 특정 지역 법령(예: 꽝닌)은 유지
2. E-001 각국 기후기술 창구기관(NDE): NDE 기관 카드 1장만 표시. '기관 분류별 기관 수' 그래프·지역별 분포 지도 삭제. '대학·연구기관·비영리단체(NGO) 바로가기' 추가
3. E-002 감축사업 승인기관(DNA): DNA 기관 카드 1장만 표시. 'CDM 전환 활동' 목록·지역별 분포 지도 삭제. '탄소크레딧 발행·소각 실적 바로가기' 추가
4. E-005: 'CTCN 네트워크 회원·기술지원 제안기관' 구획 추가(E-005와 겹치는 기관 제외). C-025: 'CDM 전환 활동' 구획 추가
5. 데이터 지도에서 E-001·E-002 제외(베트남 72 → 70개, 방글라데시 51 → 50개)

- 납품 행을 만들거나 바꾸지 않음. 데이터 수집 용역사 재구조화 자료(10/13~16)와 9/30 행의 값 일치를 대조한 뒤, 9/30 행을 결정된 화면에 표시. 다운로드는 납품 원본 유지

### 검증
- tsc 0 · 단위 시험 165 suites / 1,698 통과 · production 빌드 성공
- 정적 감사(로컬) 7종 PASS · dataset-directory verify PASS
- 실제 브라우저: C-009 지역 블록 19 → 4 등(1차), E-001·E-002 카드 1장·그래프/목록/지도 0, E-005 CTCN 14곳(베트남)·5곳(방글라데시), C-025 CDM 전환 활동 45건·11건, 바로가기 4건 이동 확인
- 6폭 × 10화면 가로 넘침 0

### 기대값 변경(사유는 REVIEW에 기록)
- 시각화 계약 E-001 1순위 블록·E-001/E-002 지도 역할(결정에 따른 설계 변경)
- 방글라데시 E-002 카드 출처 기대값(CDM 행 이동으로 출처 줄 변경)

### Preview 확인
- Preview URL: https://nigtldcmap-git-v171-national-sco-f1209b-exoprime-5142s-projects.vercel.app (Vercel 로그인 필요)

| 화면 | 경로 | 볼 것 |
|---|---|---|
| 베트남 기후 법제도 | `/?country=VNM&element=C-009#element-detail` | '전국' 카드에 지역 항목 없음, '꽝닌' 카드에는 있음 |
| 베트남 치안·안전 | `/?country=VNM&element=C-011#element-detail` | 카드 20건 모두 지역 항목 없음 |
| 베트남 NDE | `/?country=VNM&element=E-001#element-detail` | 카드 1장, 그래프·지도 없음, 바로가기 → 대학·연구기관·NGO |
| 베트남 DNA | `/?country=VNM&element=E-002#element-detail` | 카드 1장, CDM 목록·지도 없음, 바로가기 → 탄소크레딧 |
| 베트남 대학·연구기관·NGO | `/?country=VNM&element=E-005#element-detail` → 아래로 | 'CTCN 네트워크 회원·기술지원 제안기관 · 14곳' |
| 베트남 탄소크레딧 | `/?country=VNM&element=C-025#element-detail` → 아래로 | 'CDM 전환 활동 · 45건' |
| 데이터 지도 | 상단 '데이터 지도' → 왼쪽 '협력기관·기업' | 9개 → 7개(CTCN 참여기관·DNA 협력창구 없음) |

### 전후 캡처(1440px, `reports/v171/screens/`)
- `c009-region-compare-1440.png`, `e001-before|after-1440.png`, `e002-before|after-1440.png`, `c025-after-cdm-1440.png`, `e005-after-ctcn-1440.png`, `maplist-vnm-before|after-1440.png`

### 주의
- 병합 시 베트남 지도 데이터가 72 → 70개가 되어 최종발표 자료의 '72개 지도 표출' 문구와 달라짐
- 지역 코드·대응표가 필요한 요소(A-013 등 7개)는 STADT 10개국 납품 후

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01S2RXaZNPtnFSDFcQZeGuVf
