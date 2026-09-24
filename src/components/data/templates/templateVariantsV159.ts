import type { DisplayTypeV159 } from "../../../data/spec/specTypesV159";

/**
 * V159: the closed list of body variants each display-type template owns.
 *
 * Before V159 the analysis router picked a component by element id in one
 * long chain. The components are unchanged; each is now a named variant of
 * the template for its display type, and an element may use only a variant
 * of its own type (the test enforces it). Elements without a variant get the
 * template's generic body, chosen by the data's shape.
 *
 * `phase` keeps the old chain's order: "early" variants were matched before
 * the generic shape checks (province series, stacked emissions, composition
 * trend, province distribution with a national series), "late" ones after -
 * so an element whose rows fit a generic shape still gets it, as before.
 */
export type TemplateVariantKeyV159 =
  // U1 국가 수준·추세
  | "monthly-climate"
  | "sdg-indicators"
  | "science-workforce"
  | "oda-provider"
  | "primary-energy-composition"
  | "climate-budget-allocation"
  | "cpia-policy-capacity"
  | "research-patent"
  | "occupation-wage"
  | "energy-outlook-plan"
  | "mineral-resources"
  // U2 지역·입지
  | "building-metadata"
  | "flow-direction"
  | "spei-drought"
  | "climate-zone"
  | "sea-level-stations"
  // U3 기술별 비교
  | "capital-cost"
  | "lcoe-range"
  | "technology-scenario-heatmap"
  // U4 시설·기관·인프라 위치
  | "ccs-status"
  | "basin-area"
  | "infrastructure-coverage"
  | "transmission-network"
  | "hydro-stations"
  | "power-plant-registry"
  | "investor-network"
  // U6 제도·규제·리스크
  | "reported-inventory"
  | "ndc-targets"
  | "carbon-market-regions"
  | "cooperation-checklist"
  | "security-safety"
  | "ppp-procurement"
  | "ndc-sdg-matrix";

export const TEMPLATE_VARIANTS_V159: Record<DisplayTypeV159, readonly TemplateVariantKeyV159[]> = {
  U0: [],
  U1: [
    "monthly-climate",
    "sdg-indicators",
    "science-workforce",
    "oda-provider",
    "primary-energy-composition",
    "climate-budget-allocation",
    "cpia-policy-capacity",
    "research-patent",
    "occupation-wage",
    "energy-outlook-plan",
    "mineral-resources",
  ],
  U2: ["building-metadata", "flow-direction", "spei-drought", "climate-zone", "sea-level-stations"],
  U3: ["capital-cost", "lcoe-range", "technology-scenario-heatmap"],
  U4: [
    "ccs-status",
    "basin-area",
    "infrastructure-coverage",
    "transmission-network",
    "hydro-stations",
    "power-plant-registry",
    "investor-network",
  ],
  U5: [],
  U6: [
    "reported-inventory",
    "ndc-targets",
    "carbon-market-regions",
    "cooperation-checklist",
    "security-safety",
    "ppp-procurement",
    "ndc-sdg-matrix",
  ],
};

export interface ElementVariantV159 {
  variant: TemplateVariantKeyV159;
  phase: "early" | "late";
}

// A-017 (lcoe-range) and E-008 (research-patent) left the variants when every
// excluded element became a ⓪ status screen (2026-09-24); the variants stay
// defined for a re-admitted element.
export const ELEMENT_VARIANTS_V159: Record<string, ElementVariantV159> = {
  "A-026": { variant: "building-metadata", phase: "early" },
  "B-001": { variant: "monthly-climate", phase: "early" },
  "A-015": { variant: "sdg-indicators", phase: "early" },
  "D-001": { variant: "capital-cost", phase: "early" },
  "A-025": { variant: "ccs-status", phase: "early" },
  "B-025": { variant: "basin-area", phase: "early" },
  "B-026": { variant: "flow-direction", phase: "early" },
  "E-009": { variant: "science-workforce", phase: "early" },
  "A-027": { variant: "infrastructure-coverage", phase: "early" },
  "A-028": { variant: "infrastructure-coverage", phase: "early" },
  "C-002": { variant: "reported-inventory", phase: "early" },
  "D-011": { variant: "oda-provider", phase: "early" },
  "B-005": { variant: "spei-drought", phase: "early" },
  "A-016": { variant: "primary-energy-composition", phase: "early" },
  "D-005": { variant: "climate-budget-allocation", phase: "early" },
  "A-002": { variant: "cpia-policy-capacity", phase: "early" },
  "E-012": { variant: "occupation-wage", phase: "early" },
  "A-024": { variant: "transmission-network", phase: "late" },
  "C-001": { variant: "ndc-targets", phase: "late" },
  "C-019": { variant: "carbon-market-regions", phase: "late" },
  "C-022": { variant: "carbon-market-regions", phase: "late" },
  "C-007": { variant: "cooperation-checklist", phase: "late" },
  "C-008": { variant: "cooperation-checklist", phase: "late" },
  "B-023": { variant: "hydro-stations", phase: "late" },
  "B-028": { variant: "hydro-stations", phase: "late" },
  "C-011": { variant: "security-safety", phase: "late" },
  "C-018": { variant: "energy-outlook-plan", phase: "late" },
  "A-023": { variant: "power-plant-registry", phase: "late" },
  "B-046": { variant: "mineral-resources", phase: "late" },
  "B-047": { variant: "mineral-resources", phase: "late" },
  "E-006": { variant: "investor-network", phase: "late" },
  "C-012": { variant: "ppp-procurement", phase: "late" },
  "B-002": { variant: "climate-zone", phase: "late" },
  // Dedicated elements still drawn by the generic body: the station series
  // (B-008) arrives through the province-distribution shape check, the
  // NDC-SDG matrix (A-013) and the technology x scenario matrix (D-004)
  // through the generic renderer. The key records that they are dedicated.
  "B-008": { variant: "sea-level-stations", phase: "late" },
  "A-013": { variant: "ndc-sdg-matrix", phase: "late" },
  "D-004": { variant: "technology-scenario-heatmap", phase: "late" },
};

/** Variants whose component the late phase does not render itself (see above). */
export const GENERIC_BODY_VARIANTS_V159: ReadonlySet<TemplateVariantKeyV159> = new Set([
  "sea-level-stations",
  "ndc-sdg-matrix",
  "technology-scenario-heatmap",
]);

export function elementVariantV159(elementId: string): ElementVariantV159 | null {
  return ELEMENT_VARIANTS_V159[elementId.toUpperCase()] || null;
}

/** The template that owns a variant. */
export function variantTemplateV159(variant: TemplateVariantKeyV159): DisplayTypeV159 | null {
  for (const [type, list] of Object.entries(TEMPLATE_VARIANTS_V159) as Array<[DisplayTypeV159, readonly TemplateVariantKeyV159[]]>) {
    if (list.includes(variant)) return type;
  }
  return null;
}
