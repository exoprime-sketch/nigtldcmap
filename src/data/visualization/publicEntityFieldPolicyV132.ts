import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import {
  approvedEntityAttributesV126,
  publicSourceUrlV126,
  publicTextV126,
} from "./publicFieldPolicyV126";
import type { PublicAttributeValueV126 } from "./publicFieldPolicyV126";

type ReviewedAliasV132 = {
  publicKey: string;
  sourceKey: string;
  kind?: "text" | "url";
};

/**
 * Element-specific aliases reviewed against the public Vietnam workbooks.
 *
 * Only the source columns named here can enter a V132 public analysis view.
 * This keeps normalizedAttributes as an internal store rather than treating every
 * populated column as public presentation data.
 */
const REVIEWED_ENTITY_ALIASES_V132: Record<string, ReviewedAliasV132[]> = {
  "D-012": [
    { publicKey: "entryYear", sourceKey: "field_6e227ae6" },
    { publicKey: "entryCountry", sourceKey: "field_8084d610" },
    { publicKey: "entryMode", sourceKey: "field_aea118f0" },
    { publicKey: "capacity", sourceKey: "capacity" },
  ],
  "D-014": [
    { publicKey: "financeAmountUsd", sourceKey: "field_c7e4ae73" },
    { publicKey: "approvalDate", sourceKey: "field_b4064d1d" },
    { publicKey: "portfolioCategory", sourceKey: "dac" },
    { publicKey: "aidType", sourceKey: "field_caeb77bb" },
  ],
  "D-015": [
    { publicKey: "financeAmountUsd", sourceKey: "field_c7e4ae73" },
    { publicKey: "periodSummary", sourceKey: "field_792a23d5" },
    { publicKey: "portfolioCategory", sourceKey: "dac" },
    { publicKey: "aidType", sourceKey: "field_caeb77bb" },
  ],
  "D-016": [
    { publicKey: "financeAmountUsd", sourceKey: "field_c7e4ae73" },
    { publicKey: "periodSummary", sourceKey: "field_792a23d5" },
    { publicKey: "portfolioCategory", sourceKey: "dac" },
    { publicKey: "aidType", sourceKey: "field_caeb77bb" },
  ],
  "D-017": [
    { publicKey: "financeAmountUsd", sourceKey: "field_9449c6dc" },
    { publicKey: "approvalDate", sourceKey: "field_f8bedce9" },
    { publicKey: "supportType", sourceKey: "field_e27673b6" },
    { publicKey: "supportingOrganization", sourceKey: "field_1aac5642" },
  ],
  "D-019": [
    { publicKey: "approvalDate", sourceKey: "field_a5eea66f" },
    { publicKey: "technologyField", sourceKey: "field_32941fb4" },
    { publicKey: "sourceUrl", sourceKey: "field_fe9ca3ad", kind: "url" },
  ],
  "D-022": [
    { publicKey: "financeAmountUsd", sourceKey: "commitment" },
    { publicKey: "approvalDate", sourceKey: "field_92700393" },
    { publicKey: "portfolioCategory", sourceKey: "field_a9a17396" },
    { publicKey: "financeType", sourceKey: "field_2f6ae114" },
  ],
  "D-024": [
    { publicKey: "financeAmountUsd", sourceKey: "field_6241dd1d" },
    { publicKey: "referenceYear", sourceKey: "field_f3473bb5" },
    { publicKey: "portfolioCategory", sourceKey: "field_5f6174ae" },
    { publicKey: "fundingRound", sourceKey: "field_36fd2ff1" },
  ],
  "D-025": [
    { publicKey: "financeAmountUsd", sourceKey: "field_aedd5083" },
    { publicKey: "approvalDate", sourceKey: "field_fbab3068" },
    { publicKey: "portfolioCategory", sourceKey: "field_1bb732a9" },
    { publicKey: "technologyField", sourceKey: "field_d57dbfc8" },
    { publicKey: "entryMode", sourceKey: "field_f473ce34" },
    { publicKey: "capacity", sourceKey: "capacity" },
  ],
  "D-026": [
    { publicKey: "financeAmountUsd", sourceKey: "field_ae820b36" },
    { publicKey: "approvalDate", sourceKey: "field_35d27eba" },
    { publicKey: "fiscalYear", sourceKey: "fy" },
    { publicKey: "portfolioCategory", sourceKey: "field_1bb732a9" },
    { publicKey: "guaranteeType", sourceKey: "field_feb29980" },
  ],
  "E-008": [
    { publicKey: "documentType", sourceKey: "field_3b639c78" },
    { publicKey: "documentTitle", sourceKey: "field_98c97d76" },
    { publicKey: "technologyField", sourceKey: "field_7b4b6a82" },
    { publicKey: "institution", sourceKey: "field_9ccdc9f9" },
    { publicKey: "collaboration", sourceKey: "field_34f87908" },
    { publicKey: "publicationYear", sourceKey: "field_d7e5fb05" },
    { publicKey: "documentUrl", sourceKey: "field_efec870d", kind: "url" },
    { publicKey: "doi", sourceKey: "field_f108b738" },
  ],
};

export function reviewedEntityAttributesV132(
  entity: VietnamEntityV124,
  templates: string[] = []
): Record<string, PublicAttributeValueV126> {
  const approved = templates.reduce<Record<string, PublicAttributeValueV126>>(
    (result, template) => ({
      ...result,
      ...approvedEntityAttributesV126(entity, template),
    }),
    {}
  );
  const aliases = REVIEWED_ENTITY_ALIASES_V132[entity.elementId] || [];
  aliases.forEach(({ publicKey, sourceKey, kind }) => {
    const value = reviewedValueV132(entity.normalizedAttributes?.[sourceKey], kind);
    if (value !== undefined) approved[publicKey] = value;
  });
  return approved;
}
function reviewedValueV132(
  value: unknown,
  kind: ReviewedAliasV132["kind"]
): PublicAttributeValueV126 | undefined {
  if (kind === "url") return publicSourceUrlV126(value) || undefined;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const values = value
      .map((item) => publicTextV126(item))
      .filter((item): item is string => Boolean(item));
    return values.length > 0 ? values : undefined;
  }
  return publicTextV126(value) || undefined;
}
