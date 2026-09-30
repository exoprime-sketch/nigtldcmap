# REVIEW V157-2 — 지도 12 표출 (P8-2)

목표: 2026-09-22 1-pager 선정 기준대로 72개 전부 지도 레이어, '준비 중' 카드 0. 세션5에서 이관(2026-09-30). 이 문서는 V162(세션5 데이터 갱신) 병합 전에 끝낼 수 있는 것 — 대응표 검증, 렌더러·계약·공개 문구 설계 — 의 기록이다.

## 0. 인계 정리

- `tools/etl/countries/vnm/map12/prepared/*.json`(b-002·b-024·b-035·b-036·b-044·b-046·b-047·c-006, 총 99,227줄)은 2026-09-22 입고분(`~/Downloads/processed_data`) 기준 임시 재료였다. **이 브랜치가 origin에 한 번도 push되지 않은 상태에서 삭제**했다(사용자 지시: 옛 판 값 커밋 금지). `scripts/v157-2/prepare-map12-v157-2.py`(값 추출)·`stage0-compare-v157-2.py`(중복 대조)는 남겨 두었고, V162 병합 후 `--source public/data/vietnam/v2`(또는 해당 스테이징 경로)로 다시 실행한다.
- `feat/v157-2-map12`는 이 세션만 push한다(사용자 지시).

## 1. 대응표 검증 — 완료(21/21)

세 표(EVN·6대 권역·C-017) 모두 **표 머리에 공식 문서 1건**을 달고, `scripts/v157-2/verify-tables-v157-2.mjs`로 표 전체를 그 문서와 대조한다(행별 개별 검증이 아니라 구조 대조 — 63개 성·시가 빠짐없이·중복 없이 배정되는지, 그룹이 문서가 정의한 집합인지, 34개 보기는 파생인지).

| 표 | 근거 문서 | 배정 | 34개 보기(복수 소속) |
| --- | --- | --- | --- |
| **EVN**(A-022) | 5개 총공사 공식 '소속 단위' 페이지 + EVN 개요(`www.evn.com.vn/vi-VN/tong-quan/Gioi-thieu-60-3002`) | 63/63, 중복 0 — NPC 27·CPC 13·SPC 19·HCMC 3·HANOI 1 | 0건 |
| **6대 권역**(A-013·C-003) | Nghị quyết 81/2023/QH15 Điều 3(국가 종합계획, 2023-01-09) | 63/63 — 14·11·14·5·6·13 | 7건: 박닌·닥락·잘라이·럼동·푸토·꽝응아이·떠이닌 |
| **C-017 북·중·남** | Thông tư 09/2025/TT-BCT(25/2025/TT-BCT 개정) Điều 3 khoản 7·8 | 63/63 — 북 28·중 13·남 22 | 0건 |

- **C-017 규칙 정정**(사용자 정정 2026-09-30 16:15): 먼저 결정한 "6대 권역을 둘씩 묶기"는 **철회**했다(가격 규정과 무관한 별도 문서에 기댄 근거였다). 두 단계로 재판정했다.
  1. **원문 문언 직접 적용**: Điều 3 khoản 7·8 전문을 표 머리에 인용하고 직접 읽었다. khoản 8은 미엔 경계를 정할 때 따를 **기준 3가지**(사회경제 권역 구분·전력개발계획·성·시 통합 결정)를 지정할 뿐, **성을 하나도 나열하지 않는다**(부록·대응표 없음, 원문 확인). 그래서 이 단계로 결정되는 성은 **0건** — 없는 것을 있다고 하지 않고 그대로 기록했다.
  2. **EVN 관할 묶음**(사용자 지시): 검증된 `evn-jurisdiction.json`(현재·2025-07-01 이후 관할)을 그대로 재사용해 북=NPC+HANOI, 중=CPC, 남=SPC+HCMC로 63개 성 전부를 결정. 6개 미정 성: 타인호아·응에안·하띤(NPC→북), 럼동·빈투언(SPC→남), 닌투언(CPC→중). 화면 문구는 **"이 성의 권역은 EVN 관할 기준으로 정해졌습니다"** 한 줄(원문이 직접 정한 성이 생기면 "가격 규정의 권역 기준"으로 바뀐다). '6대 권역' 문구는 삭제했다.
  - 재검증(`scripts/v157-2/verify-tables-v157-2.mjs`) 21/21 유지, 34개 보기에서 걸치는 단위 0건.
  - 부수 확인: 원래 "일치"로 분류돼 있던 닥농(Đắk Nông)도 현재 관할로 다시 계산하니 중부→남부로 바뀐다(2025-07-01 CPC→SPC 이관, 근거는 §1 EVN 표와 동일). 근거 있는 변경이라 그대로 반영했다.
- **V162 조정 반영**: 새 입고 데이터에 C-017 레코드 단위 '권역' 열이 직접 있음(북/중/남 + 닌투언·카인호아 특례 각 1). 등록 시 **레코드의 권역 값을 최우선**으로 쓰고, 권역 열이 없는 레코드만 이 대응표(EVN 관할 기준)로 보완한다(§4 계획 참조). 닌투언·카인호아는 지도·패널에서 강조 표시.
- 6대 권역의 **34개 단위 공식 정의**(NQ 252/2025/QH15·NQ 306/NQ-CP)가 별도로 있으나, 63 기준 정의 유지 + 34 보기에서 '복수 권역' 표기 방식을 그대로 쓴다(사용자 지시 2026-09-30, 재확인 없으면 변경 없음).

## 2. JCM(C-006) 대응표 — 완료, 세션5 집계와 일치

- **근거**: 등록 사업 20건(VN001–VN020) 전부의 공식 페이지(`https://www.jcm.go.jp/jc/projects/vnNNN/`)를 열어 위치 기재를 원문 그대로 인용 → `tools/etl/countries/vnm/map12/jcm-location-evidence-v157-2.json`.
- **검증**: `scripts/v157-2/verify-jcm-v157-2.mjs` — 인용문에서 성 이름을 다시 뽑아 표와 대조. 근거 없는 코드 0, 누락 0. 규칙: 페이지의 **성 칸**을 우선 읽고(구·동·공단·회사명은 성으로 환산 안 함), 성 칸이 비어 있을 때만 주소 칸을 읽는다.
- **본사 소재지 2건**(VN008·VN013)은 세션5의 기존 판정(`mapUse: "list-only"`, `reviewNote`)이 이미 있었고 내가 재확인한 결과도 같다 — 등록부 페이지가 "각 참여 전력회사 본사 소재지"만 적어 설치 지점이 아니므로 **지도 집계에서 제외, 지역 패널에 사유와 함께 표시**.
- **세션5 재집계 대조**(사용자 메시지: "18개 사업·27개 성"): 검증된 표에서 집계용(`mapUse === "count"`)만 세면 **18개 사업 · 27개 성**으로 **정확히 일치**한다. 사업 단위 개별 대조가 필요 없다.

```
counted projects: 18
distinct provinces63 among counted: 27
```

## 3. B-024 필터 규칙 — 기존 스크립트가 이미 정확히 반영

- `prepare-map12-v157-2.py`의 `prepare_b024()`는 `"값의 성격"` 열에서 `"배분"`과 `"추정"`을 동시에 포함하는 행을 제외하고, 나머지(통계청 NSO 성별 벼 재배면적)만 쓴다.
- 세션5 V162 diff: "새 데이터 성 194행 중 통계청 벼 재배면적 **97행**만 사용(대리지표 명시). 배분 추정 97행은 사용 금지" — 194 = 97(NSO) + 97(배분 추정), 기존 필터 로직과 정확히 같은 결과다. **코드 변경 불필요**, V162 병합 후 `--source`만 새 경로로 재실행하면 된다.

## 4. 렌더러·계약·공개 문구 표 — 설계 완료(`scripts/v157-2/map12-plan-v157-2.mjs`)

데이터가 없어도 결정할 수 있는 부분을 표로 확정했다. 실제 값 등록(빌드)은 V162 병합 후.

| 요소 | 빌드 종류 | 렌더러 | 경계 정책 | 근거 표 |
| --- | --- | --- | --- | --- |
| A-022 | group-constant-63(신규) | admin1-choropleth | **group-constant**(신규, 기본 63) | evn-jurisdiction.json |
| C-017 | group-constant-63(신규) | admin1-choropleth | **group-constant**(신규, 기본 63) | 레코드 '권역' 우선, 없으면 c017-price-regions.json |
| A-013 | group-constant-63(신규) | admin1-choropleth | **group-constant**(신규) | six-regions.json(원문 권역명 확인된 레코드만) |
| C-003 | group-constant-63(신규) | admin1-choropleth | **group-constant**(신규) | six-regions.json(six-region-only 추출) |
| C-006 | region-membership | admin1-choropleth | **membership-or**(기존) | jcm-projects.json |
| B-044·B-046·B-047 | **entity-attribute-join**(신규) | (B-048 지점에 결합, 별도 레이어 아님) | none | B-048 광종 조인, 값은 "전국 값" 명시 |
| B-002·B-035·B-036 | admin1-choropleth | admin1-choropleth | TBD(V162 데이터로 sum/area-weighted-mean 확정) | V162 |
| B-024 | admin1-choropleth | admin1-choropleth | TBD(면적 → sum 유력) | V162, NSO 97행 |

### 신규 boundaryPolicy 종류: `group-constant` — 구현·단위 테스트 완료

기존 10종(`sum`·`area-weighted-mean`·`member-max`·`member-min`·`range-only`·`count-sum`·`membership-or`·`native-34`·`six-region-only`·`none`) 중 이 모양(전력회사 관할·가격권역처럼 34개 병합 위계와 무관한 외부 그룹에 **같은 값을 그대로 부여**)에 맞는 것이 없어, `BoundaryPolicyKindV151` 유니언에 추가했다. 대기하지 않고 지금(사용자 지시 2026-09-30) 완성:

- `src/data/map/boundaryPolicyV151.ts`: `"group-constant"` 케이스 추가(`native-34`와 같은 산술 — 구성원이 모두 같은 값이면 채택, 갈리면 conflict+null·평균 내지 않음) + 34개 단위 안내 문구.
- `src/data/map/groupConstantV157_2.ts`(신규): `broadcastGroupValuesV157_2` — 그룹별 값 → 63개 성 행으로 전개(값 없는 그룹의 성은 행 자체가 없음, 0 채움 없음). `groupsWithoutValueV157_2`로 누락 그룹 확인.
- 4곳의 병렬 선언을 모두 갱신(하나라도 빠지면 게이트가 신규 종류를 "미지의 kind"로 거부한다): `src/data/vietnam/vietnamTypesV124.ts`(`VietnamBoundaryPolicyKindV151`), `scripts/v151-2/boundary-policy-build-v151-2.mjs`(`BOUNDARY_POLICY_KINDS`·`AGGREGATING_KINDS`·`NOTES`), `scripts/v151-2/audit-boundary-policy-v151-2.mjs`(`KINDS`).
- **단위 테스트**: `boundaryPolicyV151.test.ts`에 합의/충돌 케이스 추가. `groupConstantV157_2.test.ts`는 **검증된 실제 EVN 표**(63/63, 공식 URL)를 읽어 63개 성 배정을 확인하고, 실제 `crosswalk34`(34개 단위)로 `aggregateTo34V151`까지 통과시켜 **충돌 0건**을 재확인 — 현재 main 데이터만으로 실행·통과(V162 불필요). `finalize:v151`의 `audit:boundary-policy:v151-2` 25/25 변동 없음(재확인).

### 신규 빌드 종류: `entity-attribute-join`(B-044·B-046·B-047) — 구현·단위 테스트 완료

지도 레이어를 새로 그리지 않고 B-048(광산) 기존 지점에 광종이 일치하면 전국 값 1줄을 붙인다. P8-2 1단계 지시("B-048 광산 지점을 광종으로 조인, 값은 '국가 전체'로 명시")를 그대로 반영했다.

- `src/data/map/entityAttributeJoinV157_2.ts`(신규): `joinNationalMineAttributesV157_2` — 광산의 **자기 `광종` 값과 정확히 일치**할 때만 부착(부분 문자열 금지 — Núi Pháo의 `"텅스텐(+형석·비스무트·구리)"`에 구리가 괄호 속 부산물로 들어 있어, 부분 일치였다면 B-047의 라오까이 구리 값이 엉뚱하게 붙었을 것).
- **단위 테스트**: `entityAttributeJoinV157_2.test.ts`가 **실제 B-048 8개 광산**(`packs/`에서 화면과 같은 방식으로 로드)을 대상으로 실행 — 정상 조인, 불일치 시 빈 목록(추정 없음), 괄호 속 부산물 오조인 방지, 광산 1개에 대상 2개 동시 부착, 8건 전수 누락 없음, 공개 문구(`nationalMineAttributeLineV157_2`)까지 확인. 현재 main 데이터만으로 실행·통과.

`npm run test:unit` **747/747**, `npx tsc --noEmit` 오류 0, `node scripts/v151-2/audit-boundary-policy-v151-2.mjs` 25/25(main 데이터 기준 회귀 없음).

## 5. 남은 일

1. **V162 병합 대기**: B-002/B-024/B-035/B-036의 실제 성별 값, C-017 레코드의 '권역' 열 실제 스키마.
2. V162 병합 후에는 **플러밍만 남는다**(설계·빌드 종류·경계 정책·조인 로직은 이미 구현·테스트됨): `origin/main` merge(rebase 금지) → `prepare-map12-v157-2.py --source <새 경로>` 재실행 → C-017 빌더에 레코드 '권역' 우선 규칙 반영 → `map-layers-v138`에서 `broadcastGroupValuesV157_2`/`joinNationalMineAttributesV157_2` 호출해 12건 등록 → 연관 카드·준비 중 사유 표에서 12건 제거 → 공개 문구 표(§4) 적용.
3. 게이트 1회(최대 2회) → PR → Preview. 병합은 사용자가 "PR #N 병합"이라고 할 때만.

## 6. 검증 스크립트·모듈

- `node scripts/v157-2/verify-tables-v157-2.mjs` — EVN·6대 권역·C-017 21검사.
- `node scripts/v157-2/verify-jcm-v157-2.mjs [--write]` — JCM 20개 사업 위치 재검증.
- `node scripts/v157-2/build-c017-regions-v157-2.mjs [--check]` — C-017 권역 재판정(문언 우선 → EVN 관할 대체).
- `src/data/map/groupConstantV157_2.ts` + `.test.ts` — 그룹값 → 63개 성 전개, `aggregateTo34V151("group-constant", …)`.
- `src/data/map/entityAttributeJoinV157_2.ts` + `.test.ts` — B-048 광종 조인.
