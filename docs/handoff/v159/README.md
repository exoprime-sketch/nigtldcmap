# V159 용역사 인계물

- `sheets/1-display-type.csv`~`5-case-stats.csv` — 표출유형 정의 / 구조 스키마 S1~S4 / 152 배정표 / 명칭 분리표 / 사례 통계 5개 표(CSV, UTF-8 BOM, `npm run build:handoff:v159` 생성 후 복사). 같은 표가 `docs/DATA_TYPOLOGY_V159.md`에 Markdown으로 있다
- 통합문서(`datasetTypologyV159.xlsx`)는 저장소에 두지 않는다 — 추적된 `.xlsx`는 보안 감사(`security:v128` `TRACKED_RAW_SOURCE`)가 원자료로 판정한다. 전달이 필요하면 `npm run build:handoff:v159`로 `output/v159/datasetTypologyV159.xlsx`를 만들어 보낸다(내용은 위 CSV 5개와 같음)
- `structure-examples/S1.csv`~`S4.csv` — 구조별 입력 예시. 실제 납품 행에서 옮겼고 마지막 `source_record` 열이 팩 레코드 ID(값 추정 없음, 원천이 비운 칸은 빈칸)
- `screens/` — 유형별 대표 상세 화면(① A-003 · ② B-003 · ③ A-018 · ④ A-023 · ⑤ D-022 · ⑥ C-009), 1440px 전체 페이지, 256색 PNG
- 스키마: `docs/DATA_TYPOLOGY_V159_SCHEMA.md`, 인계 문서: `docs/DATA_TYPOLOGY_V159.md`
- `SPEC_TEXT_CORRECTIONS.md` — 명세서 담당자에게 되돌려 주는 문구 정정 요청(공개 화면 점검에 걸린 원문 → 플랫폼 표시, `src/data/spec/specTextOverridesV159.json`)
