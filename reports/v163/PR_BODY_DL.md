## 요약
- 다운로드 ZIP(CSV·JSON)과 `quality-report.json`에 남아 있던 내부 작업 흔적을 ETL 단계에서 제거(베트남·방글라데시)
- 화면용 팩·카탈로그는 #63 규칙 그대로 → **화면 변화 0**(바뀌는 것은 내려받는 파일 내용뿐)
- 값·단위·연도·기간·지역·레코드 키·좌표는 변경 없음(값 열 해시 대조 전부 일치)

## 변경
- `tools/etl/public_text_v163.py`: 다운로드용 정리 함수 추가(`clean_download_text`·`sanitize_download_v163`·`download_document_v163`·`download_rows_v163`)
  - 납품 워크북 출처 필드 제거: `sourceFileOriginal/Decoded`·`sourceSheet`·`sourceRow`·`sourcePackage` 등, quality-report `archiveName`·`sheetNames`
  - CSV에서 `source_file`·`source_sheet`·`source_row` 열 제거(출처 기관·URL·라이선스·인용·기준연도는 유지)
  - 모든 텍스트 필드에서 다음 제거
    - 내부 메모 문장·괄호: ★·검토의견·공통의견·발주처·별첨·raw 폴더/미보관·raw_data·지오코딩 대장
    - 로컬 경로: `00_공통\…`·`raw_data\…`·`raw/`
    - 시트 참조: `1.x_entity/observation`
    - 작업 파일명: 납품 워크북 `.xlsx`, 한글·요소 코드·국가 코드·`_0N판`이 들어간 파일, 저장한 JSON 응답 → 요소의 공개 출처명으로 대체
  - 발행처가 배포한 파일명(인용)은 유지
  - 제거분은 `reports/v163/internal-notes-{vnm,bgd}.json`(유형별 `byCategory`)에 기록
- `tools/etl/build_public_v2.py`(VNM)·`tools/etl/countries/bgd/build_country_v2.py`(BGD): ZIP 쓰기 직전과 quality-report 저장 직전에 적용
- 재생성
  - VNM: `refresh:data`(2026-09-30 입고분, 152개 값 변화 0)
  - BGD: 빌더 체인
  - 양국 integrity 갱신
- 기대값 변경 사유: `reports/v163/EXPECTATION_CHANGES.md` V163-DL 절

## 결과
| 항목 | 베트남 | 방글라데시 |
|---|---|---|
| 바뀐 ZIP | 148/148 | 101/101 |
| CSV 값 열 해시 불일치 | 0 | 0 |
| JSON 값 해시 불일치 | 0 | 0 |
| 남은 워크북 출처 열 | 0 | 0 |
| ZIP 전수 스캔 적중 | 0 | 0 |
| quality-report 스캔 적중 | 0 | 0 |
| 남긴 발행처 파일명 | 87 | 18 |

- 스캔 패턴: `raw 폴더|raw_data|00_공통|★|검토의견|공통의견|발주처|별첨\d|지오코딩_대장|_원자료구성_설명|\.xlsx|1\.\d_(entity|observation)|_0\d판`
- 대조 보고: `reports/v163/download-clean-verify-v163.json`(main c9b96fd ZIP과 비교)

### 제거 항목 유형별 건수(ZIP 안 행·필드 단위 출현 수)
| 유형 | 베트남 | 방글라데시 |
|---|---:|---:|
| 워크북 출처 필드(workbook-provenance) | 1,962,743 | 248,892 |
| 작업 파일명(work-file) | 668,584 | 100,410 |
| 내부 메모 문장(memo-sentence) | 663,902 | 68,490 |
| 로컬 경로(local-path) | 455,049 | 1,077 |
| 내부 태그(memo-tag) | 29,278 | 7,287 |
| 공개 문구 규칙(#63, public-text) | 18,162 | 137,732 |
| 시트 참조(workbook-sheet) | 6,980 | 156 |
| 확인일 메모(check-date) | 634 | 3 |
| 워크북 위치 안내(workbook-pointer) | 14 | 12 |

## 검증
- `npx tsc --noEmit` 0
- `npm run test:unit` 879/879
- production build Compiled successfully
- `verify_country_v2.cjs --country bgd` 52/52 PASS
- BGD 지도 레이어 `--check` PASS(43)
- dataset-directory verify(152)
- `src/data/datasetDirectoryV149.json`은 체인 재생성분(fingerprint·updatedAt만 변경, 같은 날짜)

## 화면
- **화면 변화 0**: 팩·카탈로그·src 화면 코드·`src/data/spec/**` 미변경
- 확인 경로(파일 내용): 데이터 찾기 → 상세 → 다운로드 → ZIP 내려받기 → CSV에 `source_file/sheet/row` 열이 없고 비고·출처 문구에 워크북·로컬 경로가 없는지 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
