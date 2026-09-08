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
  /**
   * Source values that stand for "no value" and must not be read as data. Listed
   * per alias rather than filtered globally, so each exclusion names the column
   * it applies to and can be checked against that source.
   */
  rejectValues?: readonly string[];
};

/**
 * Element-specific aliases reviewed against the public Vietnam workbooks.
 *
 * Only the source columns named here can enter a V132 public analysis view.
 * This keeps normalizedAttributes as an internal store rather than treating every
 * populated column as public presentation data.
 */
const REVIEWED_ENTITY_ALIASES_V132: Record<string, ReviewedAliasV132[]> = {
  // The final delivery renames every A~D source column, so the hashed V1 keys
  // (field_c7e4ae73, commitment, dac, fy) no longer resolve against a single
  // record. Each alias below is the column the current workbook actually ships,
  // named for what that column says it is rather than for the slot it used to
  // occupy: 기간_시작 stays a period start, 공고일 a notice date, 제출일 a
  // submission date, and none of them is promoted to an approval date.
  "D-012": [
    { publicKey: "entryYear", sourceKey: "확인_연도" },
    { publicKey: "entryCountry", sourceKey: "국적" },
    { publicKey: "entryMode", sourceKey: "진출형태" },
    { publicKey: "technologyField", sourceKey: "기술분야" },
    { publicKey: "capacity", sourceKey: "용량" },
    // No amount alias on purpose: this element's 대표금액 carries the capacity
    // figure (420 for "420 MW / 391.0백만 USD"), not the investment, so binding
    // it to financeAmountUsd would publish megawatts as dollars.
  ],
  "D-014": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "약정액_합계" },
    { publicKey: "approvalDate", sourceKey: "약정일" },
    { publicKey: "projectPeriod", sourceKey: "사업기간" },
    { publicKey: "portfolioCategory", sourceKey: "분야_DAC" },
    { publicKey: "aidType", sourceKey: "원조유형" },
    { publicKey: "status", sourceKey: "상태" },
  ],
  "D-015": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "약정액_합계" },
    { publicKey: "periodSummary", sourceKey: "보고연도" },
    { publicKey: "projectPeriod", sourceKey: "사업기간" },
    { publicKey: "portfolioCategory", sourceKey: "분야_DAC" },
    { publicKey: "aidType", sourceKey: "원조유형" },
    { publicKey: "status", sourceKey: "상태" },
  ],
  "D-016": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "약정액_합계" },
    { publicKey: "periodSummary", sourceKey: "보고연도" },
    { publicKey: "projectPeriod", sourceKey: "사업기간" },
    { publicKey: "portfolioCategory", sourceKey: "분야_DAC" },
    { publicKey: "aidType", sourceKey: "원조유형" },
    { publicKey: "status", sourceKey: "상태" },
  ],
  "D-017": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "예산" },
    { publicKey: "noticeDate", sourceKey: "공고일" },
    { publicKey: "projectPeriod", sourceKey: "사업기간" },
    { publicKey: "sector", sourceKey: "분야" },
    { publicKey: "status", sourceKey: "상태" },
    { publicKey: "supportType", sourceKey: "입찰유형" },
    { publicKey: "supportingOrganization", sourceKey: "발주기관" },
  ],
  "D-019": [
    { publicKey: "submissionDate", sourceKey: "제출일" },
    { publicKey: "technologyField", sourceKey: "기술유형" },
    { publicKey: "sector", sourceKey: "기술분야_Sectors" },
    { publicKey: "status", sourceKey: "지원단계" },
    { publicKey: "sourceUrl", sourceKey: "상세", kind: "url" },
    // 예산 here is a band ("$200-250k"), which would be read as 200. Omitted.
  ],
  "D-022": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "투자액_commitment" },
    { publicKey: "periodStart", sourceKey: "기간_시작" },
    { publicKey: "periodEnd", sourceKey: "기간_종료" },
    { publicKey: "portfolioCategory", sourceKey: "섹터_DAC_5자리" },
    { publicKey: "financeType", sourceKey: "투자_유형" },
    { publicKey: "donor", sourceKey: "공여기관" },
    { publicKey: "rioMarker", sourceKey: "Rio_Marker" },
  ],
  "D-023": [
    // This element merges GCF, GEF, AF and CTF records, and each fund dates its
    // own rows differently. The four date columns stay separate rather than
    // collapsing into one "approval", because a GEF 승인 회계연도 and an AF
    // 착수일 are not the same event.
    { publicKey: "primaryFinanceAmount", sourceKey: "대표금액" },
    { publicKey: "boardApprovalDate", sourceKey: "이사회_승인일" },
    { publicKey: "approvalDate", sourceKey: "승인일" },
    // Six GEF rows carry 승인_회계연도 "1970" in the delivered workbook. The GEF
    // was established in 1991, so this is the upstream export's null-date
    // placeholder, not an approval year, and it would otherwise open the
    // portfolio's period at 1970. The record and its download keep the source
    // value; only this derived year drops it.
    { publicKey: "approvalFiscalYear", sourceKey: "승인_회계연도", rejectValues: ["1970"] },
    { publicKey: "startDate", sourceKey: "착수일" },
    { publicKey: "fund", sourceKey: "기금" },
    { publicKey: "sector", sourceKey: "분야" },
    { publicKey: "status", sourceKey: "상태" },
    { publicKey: "implementingEntity", sourceKey: "인가기관_Agency" },
  ],
  "D-024": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "투자_금액" },
    { publicKey: "referenceYear", sourceKey: "투자_연도" },
    { publicKey: "portfolioCategory", sourceKey: "기후_분야" },
    { publicKey: "fundingRound", sourceKey: "투자_라운드" },
  ],
  "D-025": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financialCloseDate", sourceKey: "Financial_Close" },
    { publicKey: "portfolioCategory", sourceKey: "섹터" },
    { publicKey: "technologyField", sourceKey: "기술" },
    { publicKey: "entryMode", sourceKey: "투자유형" },
    { publicKey: "capacity", sourceKey: "용량" },
    { publicKey: "status", sourceKey: "상태" },
    // 총_투자액 is written in 백만 USD ("50.8 백만 USD") and 계약기간 is a term in
    // years ("20"). Neither can be read as a plain amount or a year.
  ],
  "D-026": [
    { publicKey: "financeAmountUsd", sourceKey: "대표금액" },
    { publicKey: "financeAmountText", sourceKey: "보증_금액" },
    { publicKey: "fiscalYear", sourceKey: "회계연도_FY" },
    { publicKey: "portfolioCategory", sourceKey: "섹터" },
    { publicKey: "guaranteeType", sourceKey: "보증_유형" },
    { publicKey: "status", sourceKey: "상태" },
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
  aliases.forEach(({ publicKey, sourceKey, kind, rejectValues }) => {
    const raw = entity.normalizedAttributes?.[sourceKey];
    if (rejectValues?.some((item) => item === String(raw).trim())) return;
    const value = reviewedValueV132(raw, kind);
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
