# Final Spatial Acceptance V130

## 최종 수치

- Framework elements: 152
- Accounted elements: 152
- Map-selected elements: 12
- Map feature or scope count: 2,900
- Map selection explained: 152/152
- D-018 project count: 4
- D-018 regional project count: 2
- Greater Mekong source coordinate count: 4
- Greater Mekong display: participating-country regional scope, project-site point 0
- D-018/D-023 logical duplicates before: 4
- Visible cross-layer duplicates after: 0

## 의미 게이트

| 게이트 | 결과 |
|---|---:|
| Point with unknown meaning | 0 |
| Regional project as single point | 0 |
| Country project as fake site | 0 |
| First coordinate as project location | 0 |
| Visible feature without spatial scope | 0 |
| Cross-layer duplicate visible count | 0 |
| Zero imputation | 0 |
| Fake geometry | 0 |

## 실행 명령

```text
npm run audit:map-selection:v130
npm run audit:project-scope:v130
npm run audit:map-dedup:v130
npm run audit:map-semantic-geography:v130
npm run finalize:v130
```

## 산출 근거

- `reports/v130/map-selection-152-v130.csv`
- `reports/v130/map-selection-152-v130.json`
- `reports/v130/d018-project-spatial-audit-v130.json`
- `reports/v130/project-point-layers-audit-v130.json`
- `reports/v130/map-cross-layer-duplicate-audit-v130.json`
- `reports/v130/*-audit-result-v130.json`

## 브라우저 및 회귀

- Production build: PASS
- Local production runtime (`127.0.0.1:4175`): PASS
- Browser console errors: 0
- Broken or failed static/data assets: 0
- Greater Mekong: 참여국 범위, 베트남 참여, 사업분야, 상태, 승인액, 수행기관, 공식 출처, 좌표 처리 설명 확인
- D-018/D-023 simultaneous visible duplicate: 0
- Public guide: 전체 152개와 지도 검증 데이터 12개의 차이 및 데이터 찾기 링크 확인
- V126 map UX / public-content 및 V127 release 전체 감사: PASS
- V128 data acceptance / routes / public screens / downloads / deployment / security / performance 감사: PASS
- V129 interpretation / map layout / map interaction (12/12 hover·click) / feature join 감사: PASS

지정 캡처:

- `reports/v130/screenshots/map-data-guide.png`
- `reports/v130/screenshots/map-layer-groups.png`
- `reports/v130/screenshots/map-adaptation-fund.png`
- `reports/v130/screenshots/map-greater-mekong-regional.png`
- `reports/v130/screenshots/map-climate-finance-preset.png`
- `reports/v130/screenshots/map-regional-project-selected.png`

세부 결과는 `reports/v130/browser-qa-v130.json`에 기록했다.
