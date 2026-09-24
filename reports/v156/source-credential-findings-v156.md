# V156 입고분 자격증명 탐지 기록 — 2026-09-22

## 발견

| 항목 | 내용 |
|---|---|
| 파일 | `E-008_논문,특허.xlsx` (2026-09-22 입고분) |
| 위치 | 시트 `2_meta_info` · 6행·8행 · 14열(`api_params`) |
| 유형 | OpenAlex API 질의 문자열에 `api_key=<값>` 포함(같은 값 2회) |
| 값 | 기록하지 않음. 길이 22자, sha256 앞 12자 `0efbef67cb54` |
| 탐지 | `tools/vietnam_etl/normalization.py`의 `_CREDENTIAL_VALUE_PATTERNS` → ETL이 `credentialValueRemovedCount=2`로 빌드 중단(`build_public_v2.py:1762` "credential material was detected; review the hashed findings") |

## 확인 사항

- 현재 공개 트리(`public/data/vietnam/v2/downloads/e-008.json`)에는 자격증명 파라미터가 없습니다. 이 입고분 이전에 유출된 값은 없습니다.
- 해당 셀은 데이터 행이 아니라 수집 방법을 적은 메타정보 행입니다.

## 조치(사용자 승인 2026-09-23)

- `tools/vietnam_etl/redact_source_credentials_v156.py`로 **스테이징 사본**(`_source/vietnam/v156/workbooks`)의 두 셀에서 값만 제거하고 `api_key(자격증명 제거)`로 남겼습니다. 질의 방법(엔드포인트·필터·페이징) 기록은 그대로 보존합니다.
- 입고 원문(`베트남데이터/20260922/`)은 쓰지 않았습니다. 그 폴더에는 값이 남아 있으므로 공유·업로드하지 않아야 합니다.
- 치환 문구는 탐지 정규식에 다시 걸리지 않는 형태(`name(…)`, 구분자 없음)로 정했습니다. `name=<제거>` 형태는 같은 패턴에 재탐지됩니다.
- 이번 라운드에서 E-008은 보류 대상이라 스테이징에 새 워크북이 들어가지 않았고, 따라서 `reports/v156/source-credential-redaction-v156.json`의 최신 실행 기록은 0건입니다. 위 발견 사실은 이 문서가 정본입니다.

## 후속 권고

- 해당 API 키는 워크북으로 배포된 이력이 있으므로 **폐기·재발급**이 필요합니다(계정 보유자 조치).
- 차기 입고분부터 메타정보 시트에 키를 적지 않도록 제공자에게 요청해야 합니다. 갱신 런북은 스테이징 직후 이 스크립트를 실행하도록 고정합니다.
