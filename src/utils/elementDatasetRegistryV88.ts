import type { Dataset } from "../types/dataset";

/**
 * 최신 152개 authoritative element registry와 실제 Dataset의 단일 연결 규칙.
 *
 * 과거 prototype은 화면 구현 과정에서 Dataset.elementId가 임시 elementId를
 * 갖는 경우가 있었고, v46/v47에서 아래 정정관계를 확정했다.
 * SUPPORT-*는 152개 업무요소를 직접 대표하지 않는 보조자료다.
 *
 * 중요
 * - 데이터 찾기 / 전역검색 / 요소상세가 모두 이 함수를 사용해야 한다.
 * - Authoritative search metadata 안의 datasetIds는 과거 snapshot이므로
 *   화면 라우팅·기술필터의 source of truth로 사용하지 않는다.
 */
export const AUTHORITATIVE_ELEMENT_ID_BY_DATASET_V88: Record<string, string> = {
  "LDC-DS-A-001": "A-007",
  "LDC-DS-A-004-POVERTY-NATIONAL": "A-004",
  "LDC-DS-A-004-POVERTY-EXTREME": "A-004",
  "LDC-DS-A-005-AGRI-SHARE": "A-005",
  "LDC-DS-A-005-MANUF-SHARE": "A-005",
  "LDC-DS-A-005-SERVICES-SHARE": "A-005",
  "LDC-DS-A-006-UNEMPLOYMENT": "A-006",
  "LDC-DS-A-006-YOUTH-UNEMPLOYMENT": "A-006",
  "LDC-DS-A-008-GINI": "A-008",
  "LDC-DS-A-002": "SUPPORT-MAP-001",
  "LDC-DS-B-001": "B-006",
  "LDC-DS-B-002": "B-041",
  "LDC-DS-B-004": "B-041",
  "LDC-DS-B-003": "SUPPORT-FLOOD-VULNERABILITY",
  "LDC-DS-C-001": "C-001",
  "LDC-DS-C-002-BTR": "C-002",
  "LDC-DS-C-003-NAP": "C-003",
  "LDC-DS-C-004-LTLEDS": "C-004",
  "LDC-DS-C-005-TNA": "C-005",
  "LDC-EXAMPLE-C-014-PERMITTING": "SUPPORT-PERMITTING-EXAMPLE",
  "LDC-DS-D-001": "A-021",
  "LDC-DS-D-003": "SUPPORT-SDG7-CLEAN-COOKING",
  "LDC-DS-D-004": "A-020",
  "LDC-DS-D-005": "A-019",
  "LDC-DS-D-011-OECD-ODA": "D-011",
  "LDC-DS-D-002": "D-021",
  "LDC-DS-D-018-AF": "D-018",
  "LDC-DS-D-019-CTCN": "D-019",
  "LDC-EXAMPLE-E-012-PROJECT-LOCATIONS": "SUPPORT-PROJECT-LOCATION",
  "LDC-DS-E-002": "D-023",
  "LDC-PILOT-E-003-GCF-ORGS": "E-003",
  "LDC-PILOT-D-020-GCF-PROJECTS": "D-020",
  "LDC-EXAMPLE-E-013-OM-CAPABILITY": "SUPPORT-OM-CAPABILITY-EXAMPLE",
};

export function isSupportElementIdV88(elementId: string): boolean {
  return elementId.startsWith("SUPPORT-");
}

export function getAuthoritativeElementIdV88(dataset: Dataset): string {
  return (
    AUTHORITATIVE_ELEMENT_ID_BY_DATASET_V88[dataset.id] ?? dataset.elementId
  );
}

export function buildElementDatasetIndexV88(
  datasets: Dataset[]
): Map<string, Dataset[]> {
  const index = new Map<string, Dataset[]>();

  datasets.forEach((dataset) => {
    const elementId = getAuthoritativeElementIdV88(dataset);
    if (isSupportElementIdV88(elementId)) return;

    const current = index.get(elementId) ?? [];
    current.push(dataset);
    index.set(elementId, current);
  });

  return index;
}

export function getDatasetsForAuthoritativeElementV88(
  datasets: Dataset[],
  elementId: string
): Dataset[] {
  return datasets.filter(
    (dataset) => getAuthoritativeElementIdV88(dataset) === elementId
  );
}

export function getDatasetIdsForAuthoritativeElementV88(
  datasets: Dataset[],
  elementId: string
): string[] {
  return getDatasetsForAuthoritativeElementV88(datasets, elementId).map(
    (dataset) => dataset.id
  );
}
