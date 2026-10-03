## 요약
'데이터 지도' > '비교해서 보기' 재구축 — 두 지도가 각자 국가·데이터·지표·기준 시점을 고르고, 큰 지도와 같은 렌더러로 그리며, 자료정보·요약·범례·클릭 카드를 따로 보여 줍니다. VNM(72 레이어)·BGD(38 레이어)와 국가 교차 비교(A=베트남, B=방글라데시) 지원.

- **패널 머리**: 데이터(가나다순) · 국가(베트남/방글라데시) · 지표 · 기준 시점
  - 국가를 바꿔도 같은 데이터가 있으면 유지, 없으면 첫 데이터로 바꾸고 한 줄 안내
- **지도**: 큰 지도 파이프라인(`prepareMapLayerV152`·`mountPreparedMapLayerV152`) 그대로
  - 성·시 색 지도·일부 지역 색 지도·평가구역/그룹값·시설 지점+구역·지역 협력사업·송전망·클러스터·아이콘 지점 모두 표시
  - 국가 1급 행정구역 선(베트남 34/63, 방글라데시 주(Division) 8) + 한국어 지명
  - 불러오는 중 / 오류 + '다시 시도' / 그 국가에 지도 없음 문구 — 빈 화면 없음
- **패널 정보**: 자료정보(데이터명·항목·기준 시점·단위·출처 기관·공간 단위) · 요약(값 있는 지역 n/N, 최댓값·최솟값과 지역, 중앙값 / 표시 대상 수·분류별 개수) · 범례(최소·최대·단위·'색 없음: 자료 없음', 아이콘·범주·전압) · 클릭 카드('N개 지역 중 k위')
- **패널 사이**: 위치 함께 이동(같은 국가 기본 ON, 국가가 다르면 자동 OFF) · 지역 연동(같은 국가 지역 지도 hover/클릭) · 같은 색 구간(같은 데이터·지표, 기본 ON) · 좌우 바꾸기 · 비교 닫기
- **URL**: `mapMode=compare&compareLayers=A,B` 유지 + `compareCountries=VNM,BGD` · `compareSelectors=[…]`(선택한 지표·시점)
- **버그 수정**: 비교 닫기 직후 URL이 아직 비교 모드라 작업공간이 다시 열리던 문제
- 삭제: `MapComparisonWorkspaceV135.tsx`와 페이지의 V135 데이터셋 구성 코드

상세: `reports/v163/REVIEW_V163_COMPARE.md`

## Preview
(PR 생성 후 Vercel Preview URL 기입)

## 화면이 바뀌는 페이지와 확인 경로
| 페이지 | 확인 경로(URL · 클릭 순서) | 바뀌는 점 |
|---|---|---|
| 데이터 지도 > 비교해서 보기 | `/?view=map&country=VNM#map` → 왼쪽 목록 하단 **비교해서 보기** | 새 작업공간(국가 선택, 패널 정보·범례·카드, 동기화 토글, 좌우 바꾸기) |
| 같은 국가 색 지도 2개 | `/?view=map&country=VNM&mapMode=compare&compareLayers=B-039,B-041&compareCountries=VNM,VNM#map` → 왼쪽 지도에서 성·시 클릭 | 두 패널 카드(값·순위), 오른쪽 패널에 같은 지역 연동 |
| 국가 교차 | `/?view=map&country=VNM&mapMode=compare&compareLayers=B-039,B-039&compareCountries=VNM,BGD#map` | 오른쪽 방글라데시 주(Division) 8 색 지도, 위치 함께 이동 자동 OFF |
| 방글라데시 2개 | `/?view=map&country=BGD&mapMode=compare&compareLayers=B-039,A-023&compareCountries=BGD,BGD#map` | 색 지도 / 발전소 지점, Division 한국어 이름 |
| 같은 색 구간 | `/?view=map&country=VNM&mapMode=compare&compareLayers=B-033,B-033&compareCountries=VNM,VNM&compareSelectors=[{"variable":"annual-tree-cover-loss","period":"2005"},{"variable":"annual-tree-cover-loss","period":"2024"}]#map` | 머리의 **같은 색 구간** 체크, 두 범례 같은 최소·최대 |
| 국가 전환 | 위 첫 경로 → 오른쪽 패널 **방글라데시** → 왼쪽 패널 **방글라데시** | C-025 유지 / D-018 없음 → '가뭄' + 안내 |
| 일반 지도 복귀 | 작업공간 오른쪽 위 **비교 닫기 · 일반 지도로 돌아가기** | 왼쪽 패널 데이터로 일반 지도 |
| 휴대폰(390px) | 위 경로를 390px로 | 두 패널 세로 쌓기, 가로 넘침 0 |

그 밖의 페이지: 화면 변화 0

## 캡처 (1440×900, `reports/v163/screens/`)
- 전(V135, f19b490 빌드): `compare-before-v135.png`(베트남 진입) · `compare-before-v135-bgd.png`(방글라데시 진입 — 패널 비어 있음, '지도 데이터 준비 중', 국가 선택 없음)
- 후:
  - `compare-vnm-choropleths.png` · `compare-vnm-choropleths-selected.png`
  - `compare-vnm-point-line.png` · `compare-vnm-point-line-zoomed.png` · `compare-vnm-point-line-selected.png`
  - `compare-vnm-unit-group.png` · `compare-vnm-unit-group-selected.png`
  - `compare-vnm-bgd-cross.png` · `compare-vnm-bgd-cross-selected.png`
  - `compare-bgd-choropleth-point.png` · `compare-bgd-choropleth-point-selected.png`
  - `compare-vnm-same-colors.png` · `compare-vnm-same-colors-selected.png`
  - `compare-vnm-scope-point.png` · `compare-vnm-scope-point-selected.png`
  - `compare-bgd-after-switch.png`
  - `compare-mobile-390.png`(390px)

## 검증
- `npx tsc --noEmit` 오류 0
- 단위: `compareModelV163` 15/15, 전체 `test:unit` 83 suites · 847 tests 통과
- 빌드(production 형식, gate-lock) 성공
- e2e `e2e/compare.spec.ts` 2/2(국가 전환 테스트 추가)
- `audit:map-compare:v135` 10/10(로컬은 SwiftShader 허용 인자 필요 — 사유는 REVIEW 4절)
- 실제 브라우저 QA 7개 조합: 두 패널 데이터 레이어 렌더 > 0, 클릭 카드 값·순위, 범례 최소·최대, 콘솔 오류 0, 404 0, 320~1920px 가로 넘침 0 → `reports/v163/qa-compare-v163.json`
- 전체 게이트는 이 PR의 CI `gate` 작업에서

## 남은 것
- 배경지도(지형·위성)는 패널에 미적용, 큰 지도 세부 필터 미제공, 34↔63 혼합 지역 연동 미지원, 닫을 때 A가 다른 국가면 일반 지도 국가는 그대로 — REVIEW 4절

---
## 함께 포함: 작은 지도 방글라데시 확장 (상세 '위치·분포' 38개 · 홈 상단)
- 전: BGD 지도 대상 38개 상세와 홈 상단에 지도 없이 "이 자료는 데이터 지도에서 볼 수 있습니다." + 스타일 없는 회색 버튼
- 후: 국가별 1급 행정구역 자산으로 정적 지도 + 확대 지도(큰 지도 렌더러). 베트남 전용 표시(도시 라벨·'개편 후 34개' 캡션·외곽선)는 베트남만
- 행정구역 키(`BGD.8_1` 등) 대신 Division 이름 표시(경계 자산 이름 사용, 큰 지도에도 적용)
- 확인 경로: `/?view=data&element=B-039&country=BGD&from=explorer#element-detail` → '지역별 분포' / `/?country=BGD#home` 상단
- 검증: BGD 상세 38/38 지도 표시(1440·390, 콘솔 오류 0, 가로 넘침 0, 다른 국가 문구 0) · 확대 지도 7개 레이어 피처 확인 · VNM 상세 10쪽 지도 영역 HTML 바이트 동일(회귀 0) · 단위 테스트 22건 추가
- 캡처: `reports/v163/screens/minimap-BGD-{A-023,B-039,B-017,A-024,home}-{before,after}.png`, `minimap-BGD-*-live-after.png`
- 남은 것: BGD 국가 외곽선(단순화 자산 필요), B-002·B-009·B-035·B-036 상세 항목↔지도 변수 대응표 없음(대체 항목 안내 유지) — `reports/v163/REVIEW_V163_MINIMAP.md`


🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01S2RXaZNPtnFSDFcQZeGuVf
