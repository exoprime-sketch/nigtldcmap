## V173 — 데이터 지도 팝업 공통 규칙(핵심만 표시)

근거: 2026-11-02 데이터 지도 팝업·지도 분석 전수검토(120개 레이어). 사용자 지시로 전 레이어 공통 팝업 규칙부터 반영

- 상세: `reports/v173/REVIEW_V173.md`

### 변경
1. 색지도 팝업 둘째 줄: 해석 안내 문장 → 값의 위치
   - 기본: "성·시 34개 중 n위"
   - 관할·권역 공통값: "○○ 공통값"
   - 범주 지도: 범주명
2. 팝업의 단위 괄호 풀이 삭제
   - "GWh(기가와트시)/년" → "GWh/년"
   - "°C(섭씨도)" → "°C"
   - 약어 풀이는 유지(용어 감사 요건)
3. SSP 풀이를 배출 수준으로 변경
   - "SSP2-4.5(공통사회경제경로 2–4.5)" → "SSP2-4.5(중간 배출 경로)"
   - 용어가 펼쳐 보이는 모든 화면에 적용
4. 지점·선 팝업과 지도 분석 겹침 목록의 '주 분석' 표기 삭제. 함께 보기 레이어만 "함께 보기" 표시

- 데이터·자산 변경 없음. 기대값 변경 없음

### 검증
- tsc 0
- 단위 시험 165 suites / 1,706 통과(신규 8건)
- production 빌드 성공
- 필터 검사(로컬 production 빌드)
  - audit:map-popup:v133 11/12 PASS — 실패 1건(CLICK_FEATURE_WITHOUT_DETAIL, GVI 지도 분석의 순위 문구 형식)은 main CI(3121f216)와 같은 기존 실패
  - audit:map-tooltip:v132 5/8 PASS — 실패 3건(MAP_PLACEHOLDER_PRIMARY_TITLE·MAP_TOOLTIP_MISSING_KEY_FACTS·B033_MAP_REGION_TREND)은 main CI와 같은 기존 실패
  - audit:glossary:v134 16/17 PASS — VISIBLE_ACRONYM_WITHOUT_GLOSSARY 18건은 main CI와 같음(증감 0). 지도 상호작용 PASS
- 실제 브라우저(1440px): 8개 레이어 팝업을 운영과 V173 빌드에서 비교. 의도한 줄 외 변화 없음
- 6폭 데이터 지도 가로 넘침 0(320·390·768·1024·1440·1920px, 수력 이론 잠재량 표시 상태)

### Preview 확인
- Preview URL: https://nigtldcmap-git-v173-popup-core-exoprime-5142s-projects.vercel.app (Vercel 로그인 필요). Preview에서 베트남 수력 이론 잠재량 팝업 확인: "22,204 GWh/년 · 성·시 34개 중 1위"(`reports/v173/screens/preview-vnm-b039-popup.png`)

| 화면 | 확인 경로 | 볼 것 |
|---|---|---|
| 베트남 수력 이론 잠재량 | 상단 '데이터 지도' → 왼쪽 '에너지·인프라' → '수력 이론 잠재량' 체크 → 럼동 위에 마우스 | "22,204 GWh/년", "성·시 34개 중 1위" |
| 베트남 기후대 | '기후·위험' → '기후대' 체크 → 빈롱 위 | "Aw (열대사바나)" 줄, 안내 문장 없음 |
| 베트남 전력공급 신뢰도 | '에너지·인프라' → '전력공급 신뢰도' → 껀터 위 | "남부전력총공사(EVNSPC) 공통값" |
| 베트남 미래기후 전망 | '기후·위험' → '미래기후 전망(CMIP6)' → 떠이닌 위 | "SSP2-4.5(중간 배출 경로)", "°C" 뒤 괄호 없음 |
| 베트남 송전망 | '에너지·인프라' → '베트남 송전망' → 선이 겹친 곳 위 | 맨 위 '주 분석' 글자 없음 |
| 방글라데시 발전소 | 상단 국가 '방글라데시' → '데이터 지도' → '발전소' → 발전소 아이콘 위 | 첫 줄 "발전소"('주 분석 ·' 없음) |

### 전후 캡처(1440px, `reports/v173/screens/`)
- `popup-before-after-1440.png`: 8개 팝업 전후 비교(왼쪽 운영, 오른쪽 V173)
- `vnm-b039|vnm-b002|vnm-a022|bgd-a023-before|after-1440.png`: 전체 화면

### 범위 밖(다음 단계)
- 팝업에 핵심 값이 없는 지점 레이어(해수면·유량·유역면적)
- 광산 지점의 국가 전체 값
- 지점 팝업의 중복 행·미기재 행
- 지도 분석 요약 통계를 상위·하위 5개 막대로 교체

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01S2RXaZNPtnFSDFcQZeGuVf
