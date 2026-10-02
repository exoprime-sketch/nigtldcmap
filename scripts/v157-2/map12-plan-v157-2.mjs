/**
 * P8-2 (지도 12): the renderer / contract / public-wording plan for the twelve
 * targets, decided before V162's data lands so registration is plumbing, not
 * design, once it does.
 *
 * Pure data — no I/O, no V162 dependency. The eventual build step imports this
 * and fills in values; nothing here is a value itself.
 *
 * Ten of the twelve fall into two shapes the platform already has a boundary-policy
 * kind for (see src/data/map/boundaryPolicyV151.ts): C-006 is an ordinary
 * "membership-or" project count, and B-044/046/047 are not choropleths at all - they
 * attach a national figure to B-048's existing mine points, joined by ore type
 * (companion form C, carried over from V157's placement, now shown on the map
 * instead of a card).
 *
 * The other five (A-022, C-017, A-013, C-003, and C-017's Ninh Thuận/Khánh Hòa
 * exception) share a shape none of the ten existing kinds name: one value applies to
 * a whole named group of provinces (an EVN corporation's territory, a price bracket,
 * a socio-economic region) that is not the 34-unit merger hierarchy. `native-34`
 * checks whether 63-era neighbours already agree by coincidence; this is a value that
 * is a group fact by definition. It needs a new boundaryPolicy kind -
 * GROUP_CONSTANT_KIND_V157_2 below - added to BoundaryPolicyKindV151 when this
 * branch implements it. Proposed notice text is included so the reader is told
 * plainly: this is the group's value, not the province's own.
 */

/** The new boundaryPolicy kind this round needs; not yet in boundaryPolicyV151.ts. */
export const GROUP_CONSTANT_KIND_V157_2 = "group-constant";
export const GROUP_CONSTANT_NOTICE_V157_2 =
  "이 값은 {group} 전체에 적용되는 값이며, 성·시마다 다른 값이 아닙니다.";

/**
 * Per element: how it registers.
 *  - buildKind: the map-layers-v138 build dispatch key.
 *  - renderer: the MapLibre renderer.
 *  - boundaryPolicy: the 63→34 rule ("group-constant" pending the type addition).
 *  - groupSource: which of the four verified tables supplies the grouping.
 *  - defaultBoundary: "63" or "34" — A-022 and C-017 default to 63 per user decision
 *    (2026-09-30); a 34-unit view shows "복수 관할/권역" for a unit whose members
 *    span two groups, and the value is never split or averaged across the split.
 *  - publicWording: the template key into PUBLIC_WORDING_V157_2 below.
 */
export const MAP12_PLAN_V157_2 = [
  {
    elementId: "A-022",
    title: "전력공급 신뢰도(MAIFI·SAIDI 등)",
    buildKind: "group-constant-63",
    renderer: "admin1-choropleth",
    boundaryPolicy: GROUP_CONSTANT_KIND_V157_2,
    groupSource: "evn-jurisdiction.json",
    groupField: "corporation",
    defaultBoundary: "63",
    mixedUnit34Label: "복수 관할(전력회사 2개 이상)",
    publicWording: "corporationConstant",
    notes: "5개 총공사 관할 경계는 evn-jurisdiction.json(63개 성·시 전수, 사유 확인). 34개 보기에서 관할이 갈리는 단위는 '복수 관할'로 표시하고 값을 나누지 않는다.",
  },
  {
    elementId: "C-017",
    title: "전기요금 상한가(발전원별 가격 상한)",
    buildKind: "group-constant-63",
    renderer: "admin1-choropleth",
    boundaryPolicy: GROUP_CONSTANT_KIND_V157_2,
    groupSource: "map12/c017-price-regions.json",
    groupField: "region",
    defaultBoundary: "63",
    mixedUnit34Label: "복수 권역(북·중·남)",
    publicWording: "priceRegionConstant",
    specialCases: ["Ninh Thuận", "Khánh Hòa"],
    notes:
      "V162 새 데이터의 '권역' 열을 최우선으로 쓴다(레코드가 직접 밝힌 값). 권역 열이 없는 레코드만 c017-price-regions.json(6대 권역 둘씩 묶기)로 보완한다. 닌투언·카인호아는 원자료가 특례로 밝힌 두 성이므로 지도·패널에서 강조 표시.",
  },
  {
    elementId: "A-013",
    title: "NDC-SDG 연계(6대 권역)",
    buildKind: "group-constant-63",
    renderer: "admin1-choropleth",
    boundaryPolicy: GROUP_CONSTANT_KIND_V157_2,
    groupSource: "map12/six-regions.json",
    groupField: "key",
    defaultBoundary: "63",
    mixedUnit34Label: "복수 권역(6대 권역)",
    publicWording: "sixRegionConstant",
    notes: "원문에 명시된 6대 권역명만 연결한다(원문이 대며 이 대응표는 확인만 한다). 권역명이 원문에 없는 레코드는 지도에 올리지 않는다.",
  },
  {
    elementId: "C-003",
    title: "국가적응계획 지역과제",
    buildKind: "group-constant-63",
    renderer: "admin1-choropleth",
    boundaryPolicy: GROUP_CONSTANT_KIND_V157_2,
    groupSource: "map12/six-regions.json",
    groupField: "key",
    defaultBoundary: "63",
    mixedUnit34Label: "복수 권역(6대 권역)",
    publicWording: "sixRegionConstant",
    notes: "six-region-only 추출 규칙(원문 권역·성명만, 일반 지역어 제외)으로 확인된 레코드만 등록한다.",
  },
  {
    elementId: "C-006",
    title: "JCM(공동크레딧제도) 등록 사업",
    buildKind: "region-membership",
    renderer: "admin1-choropleth",
    boundaryPolicy: "membership-or",
    groupSource: "map12/jcm-projects.json",
    groupField: "provinces63",
    defaultBoundary: "63",
    publicWording: "jcmCount",
    notes:
      "18개 사업(등록 20개 중 본사 소재지만 밝힌 2개 제외) · 27개 성. 여러 성에 걸친 사업은 각 성에 1건, 합산하지 않음. 패널에 사업명·기업·등록부 URL 목록.",
  },
  {
    elementId: "B-044",
    title: "핵심광물 부존",
    buildKind: "entity-attribute-join",
    renderer: "point (B-048에 결합, 별도 레이어 아님)",
    boundaryPolicy: "none",
    hostElement: "B-048",
    joinField: "광종",
    defaultBoundary: "n/a",
    publicWording: "nationalMineAttribute",
    notes: "광종이 일치하는 B-048 광산 지점 팝업에 전국 값 1줄. 개별 광산 값으로 배분하지 않는다.",
  },
  {
    elementId: "B-046",
    title: "니켈·리튬 확인 매장량",
    buildKind: "entity-attribute-join",
    renderer: "point (B-048에 결합, 별도 레이어 아님)",
    boundaryPolicy: "none",
    hostElement: "B-048",
    joinField: "광종",
    defaultBoundary: "n/a",
    publicWording: "nationalMineAttribute",
    notes: "B-044와 동일 방식.",
  },
  {
    elementId: "B-047",
    title: "라오까이 구리 생산량",
    buildKind: "entity-attribute-join",
    renderer: "point (B-048에 결합, 별도 레이어 아님)",
    boundaryPolicy: "none",
    hostElement: "B-048",
    joinField: "광종",
    defaultBoundary: "n/a",
    publicWording: "nationalMineAttribute",
    notes: "B-044와 동일 방식.",
  },
  {
    elementId: "B-002",
    title: "성별 기후대·유형별 면적비율",
    buildKind: "admin1-choropleth",
    renderer: "admin1-choropleth",
    boundaryPolicy: "TBD-await-v162",
    defaultBoundary: "34",
    publicWording: "standardProvinceValue",
    notes: "V162 새 데이터의 성별 값 확인 후 sum/area-weighted-mean 중 결정(면적비율이므로 area-weighted-mean 유력).",
  },
  {
    elementId: "B-024",
    title: "농업용수 대리지표(벼 재배면적)",
    buildKind: "admin1-choropleth",
    renderer: "admin1-choropleth",
    boundaryPolicy: "TBD-await-v162",
    defaultBoundary: "34",
    publicWording: "proxyProvinceValue",
    notes: "통계청(NSO) 성별 벼 재배면적 97행만 사용(전체 194행 중 배분·추정 97행 제외 — prepare-map12-v157-2.py에 이미 반영됨). 대리지표임을 화면에 명시.",
  },
  {
    elementId: "B-035",
    title: "성별 토지이용 면적 시계열",
    buildKind: "admin1-choropleth",
    renderer: "admin1-choropleth",
    boundaryPolicy: "TBD-await-v162",
    defaultBoundary: "34",
    publicWording: "standardProvinceValue",
    notes: "면적 값 → sum 유력(V162 데이터로 확정).",
  },
  {
    elementId: "B-036",
    title: "성별 토지이용 면적 변화율",
    buildKind: "admin1-choropleth",
    renderer: "admin1-choropleth",
    boundaryPolicy: "TBD-await-v162",
    defaultBoundary: "34",
    publicWording: "standardProvinceValue",
    notes: "변화율(%/yr) → area-weighted-mean 유력(V162 데이터로 확정).",
  },
];

/** Public-facing sentence templates. `{group}`/`{region}` are filled per row. */
export const PUBLIC_WORDING_V157_2 = {
  corporationConstant: "이 값은 {group}(전력공급회사) 관할 전체에 적용되는 값이며, 성·시별로 다르지 않습니다.",
  priceRegionConstant: "이 값은 {region} 권역 전체에 적용되는 발전가격 상한입니다.",
  priceRegionSpecialCase: "{province}은(는) 원문이 별도로 정한 특례 가격이 있어 강조 표시합니다.",
  sixRegionConstant: "이 값은 {region} 권역 전체에 해당하며, 성·시별로 다르지 않습니다.",
  jcmCount: "성·시별 JCM(공동크레딧제도) 등록 사업 건수입니다. 여러 성에 걸친 사업은 각 성에 1건으로 셉니다(감축량·금액을 합산하지 않음).",
  nationalMineAttribute: "이 값은 {ore} 전국 합계이며, 개별 광산의 값이 아닙니다.",
  standardProvinceValue: "성·시가 직접 보고한 값입니다.",
  proxyProvinceValue: "원자료에 농업용수 비중의 성별 값이 없어 벼 재배면적(대리지표)으로 대신 표시합니다.",
};
