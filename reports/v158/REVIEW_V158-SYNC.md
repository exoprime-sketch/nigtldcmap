# REVIEW V158-SYNC — 베트남 파생 자산을 생성기 출력과 맞춤 (fix/v158-vnm-derived-sync)

작성 2026-09-30 · 기준 origin/main `054b74f` · 사용자 결정(2026-09-30): B2b에 섞지 않고 main에서 별도 작은 PR, 생성기 재실행 결과와 대조표, 화면 변화 0 증명

## 요약
- 커밋된 베트남 파생 자산 4개 파일이 현재 생성기 출력보다 뒤처져 있었다(B2b 검증 중 발견). 생성기를 그대로 다시 돌려 맞추고 integrity를 갱신했다. 생성기 코드는 바꾸지 않았다.
- 바뀐 값은 두 종류뿐이다(대조표 `reports/v158/derived-sync-vnm-v158.md`).
  - semantic 계약 30요소의 `mapLinkage`(지도 연결 여부·피처 수·지도 방식)와 TS 모듈의 같은 30요소 `spatiallyLinked`: 커밋본은 지도 연결이 꺼져 있고, 재생성은 현재 지도 색인(활성 42)대로 켜진다.
  - dataset-directory 6요소(A-017·C-015·D-024·E-008·E-016·E-017)의 `updatedAt`: git 이력에서 계산하는 값이라 #43 병합 시각이 반영됐다.
- **화면 변화 0**: 두 값 모두 공개 화면이 읽지 않는다(`mapLinkage`·`spatiallyLinked`는 타입과 미리보기의 대체 계약에만 쓰인다. 지도 표시는 map-index 기준 `mapAvailabilityV140`이 정한다). 화면 서명으로 확인했다.

## 변경 파일
| 파일 | 변경 |
|---|---|
| `public/data/vietnam/v2/semantic/element-visualization-contracts-v125.json` | 30요소 `mapLinkage` 3필드 |
| `src/data/visualization/generatedVisualizationContractsV125.ts` | 30요소 `spatiallyLinked` false → true |
| `public/data/vietnam/v2/dataset-directory.json` | 6요소 `updatedAt`, 최상위 `generatedAt`·`sourceCommit` |
| `src/data/datasetDirectoryV149.json` | 6요소 `updatedAt` |
| `public/data/vietnam/v2/asset-integrity.json` | 위 2개 공개 파일의 크기·해시 |
| `scripts/v158/derived-sync-table-v158.py` | 대조표 생성(읽기 전용, 커밋본 ↔ 작업 트리) |
| `scripts/v158/screen-signature-v158.mjs` | 찾기·지도·다운로드·이용안내를 해시 경로로 찍도록 수정(아래) |

재생성 명령(생성기 무수정):
```
python tools/vietnam_semantic/build_semantic_v125.py
node scripts/v150-1/dataset-directory-v150-1.mjs build
node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2
python scripts/v158/derived-sync-table-v158.py --out reports/v158/derived-sync-vnm-v158
```

## 검증
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run test:unit` | 587/587 |
| 화면 서명(main `054b74f` 빌드 vs 이 PR 빌드, production 형식) | 151화면(홈·찾기·지도·다운로드·이용안내·상세 146) 차이 0 — `reports/v158/derived-sync-signature-compare-v158.json` |
| `finalize:v151` | 통과(1회) — release 80/80 · role-split 53/53 · analysis QA 필수 실패 35(기준선 41 이내, 새 실패 0) · boundary-34 21/22(브라우저 1건 생략) · boundary-policy 24/24 |

## 화면 서명 스크립트 수정
- main의 `screen-signature-v158`은 찾기·지도·다운로드·이용안내를 `?view=` 주소로 열었다. 화면은 URL 해시로 정해지므로(`src/app/navigation.ts`) 네 화면이 모두 홈으로 찍혔다.
- 해시 경로(`#explorer`·`#map`·`#download`·`#guide`)로 고치고 `--screens` 필터를 더했다. B2b 브랜치(`feat/v158-b2b-country-layer`)의 같은 파일과 내용이 같다.
- V158-A의 "화면 변화 0" 증거는 홈·상세에 대해 유효하고, 네 화면은 B2b와 이 PR에서 처음 실제로 비교했다.

## 미완료와 사유
- 없음. 생성기가 커밋 때마다 뒤처지지 않게 하는 장치(게이트 검사)는 이 PR 범위 밖이다. 필요하면 별도로 제안한다.
