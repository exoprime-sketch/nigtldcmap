## 무엇을 바꿨나
**광물명·투자자 소재·기후기술 ID·PPP 한글·기후대 라벨·발전소 카드의 데이터 결함을 원천 재투영과 표시 계층으로 고쳤다(값 생성·추정 0, 지도 파일·map-index 미접촉).**
- B-046·B-047: 관측에 광물명(`name`)·측정 라벨 투영(CSV 열 채움) → 광물별 화면(값·단위·세계 순위·비중 병기, USGS 미수록 분리)
- E-006: 좌표 point-in-polygon(34 경계)로 `locationClass` — 베트남 소재 8곳(도시 단위) / 해외 소재(베트남 투자 실적) 7곳 목록 분리, 지도 피처 8 불변(원자료 기준 8/7, 프롬프트 9/6과 다름)
- 38대 기후기술: 카탈로그·팩 `technologyIds`를 `"07"`로 정규화(원자료 불변), 찾기 옵션 77→38, 두 표기 합집합 매칭·검색·`technology=07` URL 복원
- C-012: `koreanTermsV153.json`으로 한글(원문) 병기, 그룹별 개조식 항목 + 세계은행 PPI 성·시별 표
- B-002: "온대·동계건조·고온하계(Cwa)" 순서, 기후대 구성 표
- A-023: GPPD 추출본(CC BY 4.0) 조인으로 소유자·가동 연도·출처 URL, OSM operator/URL, 전 시설 소재지(34·63 경계) 속성화 → `facilityCardV153` 라벨형 카드(국가/명칭/발전원/소유·운영/설비용량/가동 연도/소재지/출처), A-023 목록 클릭 카드

## 주요 변경
- ETL: `tools/vietnam_etl/build_public_v2.py`(기술 ID 정규화·A-002 legacy 슬러그·관측 name CSV), `tools/vietnam_etl/enrich_v153.py`(광물명·소재 구분·GPPD 조인·PIP), `tools/vietnam_etl/source/`(GPPD VNM 236행 + README)
- 승격 도구: `scripts/v153/diff-staging-v153.mjs`, `scripts/v153/promote-elements-v153.mjs`(요소별 선별 승격, map-index·spatial·geometry·home 미복사)
- 데이터: `public/data/vietnam/v2/{catalog.json, downloads/*, packs/*, semantic/*, manifest.json(searchIndex), dataset-directory.json, asset-integrity.json}`
- 프런트: `src/utils/technologyIdV153.ts`, `src/data/visualization/{facilityCardV153,koreanTermsV153,mineralResourcesV153,pppProcurementV153}.ts`, 컴포넌트 `FacilityCardV153 · MineralResourceSummaryV153 · InvestorNetworkSummaryV153 · PppProcurementSummaryV153 · ClimateZoneSummaryV153`, `PowerPlantRegistrySummaryV138`(카드·소재지 열), 라우터 분기 4개, `DataExplorerPage/DownloadPage/App/publicPlatformV128/publicCopyRegistryV126`
- 검증 스크립트: `scripts/v153/d0-screens-v153.mjs`(6개 × 6폭), `scripts/v153/facility-card-fill-v153.mjs`, `screen-review-v138 --ids/--out`
- 보고: `reports/v153/D0_DATA_DEFECTS.md`, 추적표 `docs/FINALIZATION_TRACKER_V153.md` 6행

## 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:unit` | 233건 통과(신규 17건: 옵션 정확히 38·두 표기 합집합 일치·광물 8+5/9+2+1·카드 순서·C-012 미번역 0) |
| 파이프라인 기준선 diff | 후행 단계 산출 5파일만 상이 → 요소별 선별 승격, `git status`로 map-index·spatial·geometry·home 무변경 |
| `d0-screens-v153`(320/390/768/1024/1440/1920) | 36/36 · 넘침 0 · 콘솔/HTTP 오류 0 · 찾기 옵션 38 · URL 복원 |
| `screen-review-v138 --ids 6개` | ready 6/6 · 오류 0 |
| `analysis-qa-v140 --only 6개`(로컬 production 빌드) | 필수 실패 0(기준선의 A-023·C-012 `cardValueVerified` 해소) |
| A-023 카드 채움률 | 소유 20.5%(WRI 89.0%) · 연도 10.2%(WRI 70.8%) · 출처 URL 100% · 소재지 95.3%(경계 밖 93 미기재) |
| `finalize:v140` | 미실행(메인 PR 1회) |

미완료·보류: 지도 팝업 카드(P3), C-012 34개 지도(P4), 카드 자산 B-002 라벨 재생성(P4), 경계 밖 93곳·C-012 낙찰방식 5행·OSM 라오스 1건은 원천 문제로 PE 기록.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
