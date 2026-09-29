# REVIEW V158-ZIP — 요소별 다운로드 사전 압축 (feat/v158-download-zip)

작성 2026-09-30 · 기준 origin/main `5b82ea6`(#44·#46 병합 뒤) · 사용자 결정(2026-09-30): ② 사전 압축 채택, 기존 다운로드 주소 404 허용, 구현은 별도 PR(결정적 ZIP, 카탈로그·integrity·감사 조정, 기대값 변경 사유 기록, 배포 크기 전후)

## 요약
- 요소별 다운로드를 `downloads/<id>.zip` 하나로 배포한다(안에 `<id>.json`·`<id>.csv`). 베트남 147개, 방글라데시 85개.
- **배포 1회 948.7 MB → 164.4 MB(5.77배), 파일 867 → 635개, 가장 큰 파일 86.5 → 12.3 MB.**
- **레코드 변화 0**: 베트남은 지난 갱신과 같은 인자로 `refresh:data`를 다시 돌렸고, 값 비교에서 152요소 모두 변화가 없다(값 변경·관측 증감 0). ZIP 안 CSV는 전환 전 파일과 바이트 단위로 같고, JSON은 요소 행의 `downloadAssets`만 다르다.
- **화면 변화 0**: 화면은 정적 다운로드 파일을 쓰지 않는다(다운로드 화면은 팩에서 파일을 만든다). 화면 서명으로 확인했다(아래).
- 기존 주소 `downloads/<id>.json·csv`는 404다(결정). `vercel.json`은 바꾸지 않았다.

## 변경
### 데이터 생성
- `tools/etl/download_zip_v158.py`(신규): 결정적 ZIP(이름순, 1980-01-01, 고정 파일 모드·생성 시스템, 레벨 9). 같은 입력이면 운영체제와 관계없이 같은 바이트.
- 베트남 ETL·방글라데시 빌더: 다운로드를 ZIP으로 쓰고, 카탈로그 `downloadAssets`에 ZIP 1개와 `entries`(안쪽 파일명·형식·레코드 수·크기·해시)를 싣는다. 배달 목록(`delivery-manifest.json`)은 ZIP 단위.
- 재생성
  - 베트남: `refresh:data --source 베트남데이터/20260922 --adopt A-002,B-015,B-022,E-001,E-010`(지난 갱신과 같은 인자, 스테이징 `v158zip`) → 반영 단계(반영 → semantic → 디렉터리 → integrity → 카드 요약 → integrity).
  - 방글라데시: `build_country_v2.py --country bgd`.
  - 반영은 스테이징에 없는 파일을 지우지 않으므로, ZIP으로 대체된 옛 JSON·CSV 294개는 손으로 지웠다(모두 ZIP 짝 확인).
- 카드 요약: 팩 파일명·원본 해시·생성 시각만 바뀌고 카드 내용은 같다(검증).
- 데이터 디렉터리: `updatedAt` 규칙을 고쳐 포장 전환 커밋(ZIP 추가 + 같은 요소 JSON·CSV 삭제)을 갱신일로 보지 않는다. 갱신일은 147요소 모두 그대로이고, 기존 이력에서 새 규칙과 이전 규칙의 날짜가 149요소 모두 같다.
- 대기 지도 자산 2개(`spatial/pending-v155/b-008-slr-zones.json`·`d-022-locations.json`)의 출처 항목: CSV 주소 → `"csv": "<안쪽 파일명>"`·`"download": "<ZIP 주소>"`. 만드는 도구(`tools/vietnam_spatial/…v155.py`)도 ZIP 안 CSV를 읽고 같은 값을 쓴다.

### 함께 고친 파이프라인 결함(#46 불일치의 원인)
- 스테이징 체인은 체인 밖 지도 레이어 없이 semantic을 만들어, 반영하면 지도 연결 30요소가 꺼지고 `src` TS 모듈도 되돌아갔다. `refresh-data-v156`의 반영 단계에 semantic 재생성을 넣었다. 이번 반영 뒤 semantic 계약·TS 모듈은 main과 같다.

### 읽는 쪽
- `scripts/v158/download-zip-v158.mjs`(스크립트), `src/data/testing/downloadZipV158.ts`(테스트), BGD 검증기 내장 읽기 함수: Node 내장 zlib만 쓴다.
- 게이트 감사: 탐색(v125)·찾기(v125)·배포(v128)·지도 툴팁(v132)·analysis QA·role-split QA. 수동 도구: 배달 목록 검사(ZIP 안 파일 대조 추가)·왕복 검증·원자료 값 비교·v138/v144/v148/v153 도구.
- 로컬 정적 서버(`scripts/v125/browser-runtime.mjs`)에 `.zip` → `application/zip`.
- 카탈로그 타입 `VietnamDownloadAssetV124`에 `entries`(선택) 추가. 화면 코드는 바뀌지 않았다.
- 기대값 변경 10건: `reports/v158/EXPECTATION_CHANGES_V158-ZIP.md`

## 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run test:unit` | 589/589(ZIP 목록 대조 테스트 2건 추가) |
| 원자료 값 비교(`source-diff`, 현재 ↔ 스테이징) | 152요소 변화 0 · 값 변경 0 · 관측 증감 0 |
| ZIP 안 파일 대조(147개) | CSV 147 바이트 동일, JSON 147 `downloadAssets` 외 동일 |
| 배달 목록 검사(베트남·방글라데시) | PASS(ZIP 안 파일 크기·해시 = 카탈로그) |
| 왕복 검증(다운로드 = 팩 레코드) | PASS |
| 방글라데시 검증기 | SIGNATURE_BGD |
| 화면 서명(#46 빌드 vs 이 PR 빌드) | SIGNATURE_RESULT |
| `finalize:v151` | FINALIZE_RESULT |
| 배포 용량 | 948.7 → 164.4 MB(`reports/v158/download-zip-size-v158.md`). 기준 빌드는 #46 head 빌드(main `5b82ea6`과 앱·데이터 동일, #44는 문서만) |

## 미완료와 사유
- Hobby 비상업 조건: 사용자 판단 대기(결정안 7절 3, 보류).
- 반영 스크립트가 대체된 파일을 자동으로 지우게 하는 것은 이번 한 번뿐이라 넣지 않았다(런북에 절차 기록).
