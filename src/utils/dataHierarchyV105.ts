import type { VietnamExplorerItem } from "./vietnamExplorerV49";
import { stripInternalTaxonomyCode } from "./publicLabelsV56";

export interface HierarchyCoverageCounts {
  full: number;
  partial: number;
  pending: number;
}

export interface DataHierarchyGroupV105 {
  id: string;
  code: string;
  label: string;
  sectionId: string;
  category: string;
  items: VietnamExplorerItem[];
  coverage: HierarchyCoverageCounts;
  gisCount: number;
}

export interface DataHierarchySectionV105 {
  id: string;
  code: string;
  label: string;
  category: string;
  groups: DataHierarchyGroupV105[];
  items: VietnamExplorerItem[];
  coverage: HierarchyCoverageCounts;
  gisCount: number;
}

function getHierarchyCode(value: string): string {
  return (value.match(/^[A-E](?:\.\d+)+(?:\.[a-z])?/i)?.[0] ?? "").replace(
    /\.$/,
    ""
  );
}

function getHierarchyLabel(value: string): string {
  return stripInternalTaxonomyCode(value) || value;
}

function getCoverage(items: VietnamExplorerItem[]): HierarchyCoverageCounts {
  return items.reduce<HierarchyCoverageCounts>(
    (counts, item) => {
      counts[item.coverageStatus] += 1;
      return counts;
    },
    { full: 0, partial: 0, pending: 0 }
  );
}

function countGis(items: VietnamExplorerItem[]): number {
  return items.filter((item) => item.element.gis).length;
}

/**
 * v105 hierarchy contract
 *
 * Explorer에서 사용하는 공개 계층은 다음 3단계입니다.
 * 세부 항목(section) → 데이터 그룹(dataGroup) → 데이터 요소(element)
 *
 * authoritative element registry의 순서를 그대로 사용하므로 엑셀 관리대장의
 * A~E / 세부 항목 / 데이터 그룹 순서가 사용자 화면에서도 유지됩니다.
 */
export function buildDataHierarchyV105(
  items: VietnamExplorerItem[]
): DataHierarchySectionV105[] {
  const sectionMap = new Map<
    string,
    {
      category: string;
      items: VietnamExplorerItem[];
      groupMap: Map<string, VietnamExplorerItem[]>;
    }
  >();

  for (const item of items) {
    const sectionId = item.element.section;
    const groupId = item.element.dataGroup;

    let section = sectionMap.get(sectionId);
    if (!section) {
      section = {
        category: item.element.category,
        items: [],
        groupMap: new Map<string, VietnamExplorerItem[]>(),
      };
      sectionMap.set(sectionId, section);
    }

    section.items.push(item);
    const groupItems = section.groupMap.get(groupId) ?? [];
    groupItems.push(item);
    section.groupMap.set(groupId, groupItems);
  }

  return Array.from(sectionMap.entries()).map(([sectionId, section]) => {
    const groups = Array.from(section.groupMap.entries()).map(
      ([groupId, groupItems]): DataHierarchyGroupV105 => ({
        id: groupId,
        code: getHierarchyCode(groupId),
        label: getHierarchyLabel(groupId),
        sectionId,
        category: section.category,
        items: groupItems,
        coverage: getCoverage(groupItems),
        gisCount: countGis(groupItems),
      })
    );

    return {
      id: sectionId,
      code: getHierarchyCode(sectionId),
      label: getHierarchyLabel(sectionId),
      category: section.category,
      groups,
      items: section.items,
      coverage: getCoverage(section.items),
      gisCount: countGis(section.items),
    };
  });
}

export function findHierarchySectionV105(
  sections: DataHierarchySectionV105[],
  sectionId: string | null
): DataHierarchySectionV105 | null {
  if (!sectionId) return null;
  return sections.find((section) => section.id === sectionId) ?? null;
}

export function findHierarchyGroupV105(
  section: DataHierarchySectionV105 | null,
  groupId: string | null
): DataHierarchyGroupV105 | null {
  if (!section || !groupId) return null;
  return section.groups.find((group) => group.id === groupId) ?? null;
}
