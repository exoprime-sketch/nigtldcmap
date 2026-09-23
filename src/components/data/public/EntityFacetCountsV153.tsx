import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import PublicCountDistributionV143 from "./PublicCountDistributionV143";

/**
 * V153-D1: a registry or directory opens on how many entries fall in each
 * class - institutions by type, mines by mineral, contacts by role - counted
 * from the delivered rows as they are. The facet is the first delivered
 * attribute that classifies the rows (2-12 classes, not one per row); a
 * delivery with no such attribute gets no bars, never an invented split.
 */
const FACETS_V153: Array<{ key: string; label: string; noun: string }> = [
  { key: "orgType", label: "기관 유형", noun: "곳" },
  { key: "orgCategory", label: "기관 분류", noun: "곳" },
  { key: "광종", label: "광종", noun: "곳" },
  { key: "role", label: "역할", noun: "명" },
  { key: "city", label: "도시", noun: "곳" },
  { key: "parentOrg", label: "소속 부처", noun: "곳" },
  { key: "orgName", label: "기관", noun: "명" },
  { key: "contactType", label: "연락 유형", noun: "건" },
];

export interface EntityFacetV153 {
  key: string;
  label: string;
  noun: string;
  rows: Array<{ label: string; value: number }>;
}

export function entityFacetCountsV153(entities: VietnamEntityV124[]): EntityFacetV153 | null {
  if (entities.length < 3) return null;
  for (const facet of FACETS_V153) {
    const counts = new Map<string, number>();
    entities.forEach((entity) => {
      const raw = (entity.normalizedAttributes || {})[facet.key];
      if (raw === null || raw === undefined || raw === "" || typeof raw === "object") return;
      const value = publicTextV126(String(raw));
      if (!value) return;
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    if (counts.size >= 2 && counts.size <= 12 && counts.size < entities.length) {
      return {
        ...facet,
        rows: [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "ko")),
      };
    }
  }
  return null;
}

export default function EntityFacetCountsV153({ entities, recordLabel = "항목" }: { entities: VietnamEntityV124[]; recordLabel?: string }) {
  const facet = entityFacetCountsV153(entities);
  if (!facet) return null;
  return (
    <section className="d153-block" data-analysis-block="category-bar" data-testid="entity-facet-counts-v153" data-facet={facet.key}>
      <PublicCountDistributionV143 title={`${facet.label}별 ${recordLabel} 수`} rows={facet.rows} unit={facet.noun} xAxis={`${recordLabel} 수`} yAxis={facet.label} testId="entity-facet-distribution-v153" />
    </section>
  );
}
