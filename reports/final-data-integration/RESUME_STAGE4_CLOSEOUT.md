# Stage 4 closeout · 재개점 (2026-09-08)

후보: codeCommit `e584799` + dirtyPatchHash `bb429a0b` (generatedVisualizationContracts)
dataFingerprint `290c6887e06b` · outputRoot `.verify/candidate/build`
상세는 `CANDIDATE_MANIFEST_V137.json`.

## 완료

- §1 후보 고정. generatedVisualizationContracts 재생성 재현 확인(byte-identical), 미커밋 사유 기록.
- §2 D-023 1970 근거 재확인 → "null placeholder 확정" 철회, 승인 미완료(Concept Approved 4 / Cancelled 2)와
  1:1 대응만 사실로 기록. 값 대체 없음.
- §2 집계행 결함 발견·수정(D-020 포트폴리오 2배, D-023 건수 149를 USD로, D-024 4배 과다).
- §2 D-023 이벤트 종류 분리(승인연도만), 승인액 동질성 71/73 확인.
- §2 D-020/D-021 별칭 신규(대표금액=GCF_승인액 / 약정액_commitment 확인). 별칭 live 95 / dead 0.
- §3 지도 QA 전면 재작성 + localhost 전용 읽기전용 observer. point/line/polygon 3건 검증.
  B-034 전 구간 통과(631,219 Mg CO2e/yr).
- §6 MAP-001 수정(1024 49.8%→80.9%, 958 44.8%→80.4%).

## 미완료 (다음 세션 재개점)

1. **MAP-003**: B-048 지도 feature 에 `광종` 없음 → 팝업·상세 연결 필요.
   같은 점검을 A-023(발전원·용량), A-024(전압), C-025(사업기간)로 확장.
2. **MAP-002**: A-024-WB2016-0001 이 1440 에서 `dt` 에 가림. MAP-001 수정 후 재측정 필요.
3. **지도 나머지**: 12개 중 9개 레이어, 추천 분석 5개, 비교 모드 미검수.
4. **§4 원자료 계약**: C-016(기술·지역·계획용량·목표연도 구분), D-018(2지점 stable ID 연결),
   B-034 잔여 전국계열 56행, A-023 고유시설 수 구분. 모두 미착수.
5. **§5 152개 의미 검토**: 0/152. D 계열 금액·연도만 pack→화면 대조 완료(원천→pack 은 B-034/D-023 일부만).
6. **§7 문구 벤치마킹**, §8 responsive 전수, §9 clean checkout + Draft PR + CI/Preview 대조.

## 주의

- 원격 4598b9c 이후 public/data 는 여전히 2026-08-27 구자료다. 후보 데이터는 아직 커밋되지 않았다.
- 16/15/3 같은 수집 수치를 152 의미 검토 완료로 표기하지 말 것.
- rejected-2026-09-08-invalid-harness 의 216건은 결함 수에 합산하지 말 것.
