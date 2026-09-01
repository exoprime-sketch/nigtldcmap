import {
  approvedEntityAttributesV126,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import type { PublicAttributeValueV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";

import "./public-entity-cards-v131.css";

export type PublicEntityCardTemplateV131 =
  | "portfolio"
  | "directory"
  | "document"
  | "generic";

interface Props {
  entities: VietnamEntityV124[];
  template: PublicEntityCardTemplateV131;
  detailTemplate?: string;
  elementTitle?: string;
  limit?: number;
}

type PublicCardFactV131 = {
  label: string;
  value: string;
};

const EMPTY_VALUE_LABELS_V131 = new Set([
  "-",
  "—",
  "해당없음",
  "미상",
  "미기재",
  "원천 미기재",
  "원천 미게재",
]);

const CARD_FACT_KEYS_V131: Record<
  PublicEntityCardTemplateV131,
  Array<{ label: string; keys: string[]; maxLength?: number }>
> = {
  portfolio: [
    {
      label: "기관·재원",
      keys: ["supportingOrganization", "implementingEntity", "accreditedEntity", "fund"],
    },
    {
      label: "분야·유형",
      keys: ["businessSector", "sector", "technologyField", "technologyRelevance", "supportType"],
    },
    {
      label: "규모",
      keys: ["budgetScale", "approvedAmount", "primaryFinanceAmount", "commitmentAmount"],
    },
    { label: "지원 한도", keys: ["supportLimit"] },
    { label: "지원 대상", keys: ["eligibleRecipients", "targetGroup"] },
    {
      label: "기간",
      keys: ["applicationPeriod", "projectPeriod", "approvalDate", "entryTiming"],
    },
  ],
  directory: [
    {
      label: "소속·기관",
      keys: ["organizationName", "orgName", "supportingOrganization"],
    },
    {
      label: "주요 업무",
      keys: ["primaryResponsibilities", "officeProgram", "technologyField", "sector"],
    },
    { label: "위치", keys: ["city", "officeAddress", "address", "regionName"] },
    {
      label: "담당자",
      keys: ["focalPointName", "personName", "contactName", "focalPointTitle"],
    },
    {
      label: "연락처",
      keys: ["email", "emailAlt", "phone", "telephone", "contact", "additionalContact"],
      maxLength: 86,
    },
  ],
  document: [
    { label: "공개일·연도", keys: ["publicationDate", "publicationYear", "year"] },
    { label: "기술·분야", keys: ["technologyField", "technology", "sector"] },
    { label: "발행처", keys: ["journal", "publisher", "publication"] },
    { label: "저자·기관", keys: ["authors", "institutions", "institution", "organizationName"] },
    { label: "DOI", keys: ["doi"] },
  ],
  generic: [
    { label: "유형", keys: ["organizationType", "orgType", "orgCategory", "sector"] },
    { label: "상태", keys: ["status"] },
    { label: "지역", keys: ["city", "regionName"] },
    { label: "기준연도", keys: ["referenceYear", "year"] },
  ],
};

const CARD_BADGE_KEYS_V131: Record<PublicEntityCardTemplateV131, string[]> = {
  portfolio: ["status", "entryMode", "supportType", "fund"],
  directory: ["orgCategory", "orgType", "organizationType", "role", "city"],
  document: ["documentType", "technologyField", "publicationYear", "year"],
  generic: ["status", "entityType", "orgType", "sector"],
};

const CARD_TITLE_DISAMBIGUATION_FIELDS_V131: Record<string, string[]> = {
  "A-025": ["facilityType", "leadOrganization", "location"],
  "D-024": ["field_f3473bb5", "field_36fd2ff1", "field_6241dd1d"],
  "D-025": ["field_aca383c3", "field_bd1ab93d", "capacity"],
  "E-002": ["recordStatus", "validFrom", "validTo", "focalPointName"],
  "E-003": ["role", "field_8497efd8", "title"],
};

/**
 * Presentation-only aliases reviewed against the corresponding public workbook.
 * Keys are explicit per element; arbitrary hashed attributes are never scanned.
 */
const PUBLIC_CARD_ELEMENT_ATTRIBUTE_ALIASES_V131: Record<
  string,
  Record<string, string>
> = {
  "E-008": {
    documentType: "field_3b639c78",
    technologyField: "field_7b4b6a82",
    publication: "field_929cb2fe",
    institution: "field_9ccdc9f9",
    publicationYear: "field_d7e5fb05",
    documentUrl: "field_efec870d",
    doi: "field_f108b738",
  },
};

export default function PublicEntityCardGridV131({
  entities,
  template,
  detailTemplate,
  elementTitle,
  limit = template === "document" ? 16 : 12,
}: Props) {
  const shown = entities.slice(0, limit);
  const titleResults = shown.map((entity) =>
    resolvePublicEntityTitleV131(entity, {
      template: detailTemplate,
      elementTitle,
    })
  );
  const titleCounts = new Map<string, number>();
  titleResults.forEach(({ title }) => {
    const normalized = normalizedCardValueV131(title);
    titleCounts.set(normalized, (titleCounts.get(normalized) || 0) + 1);
  });

  return (
    <>
      <div
        className={`pec131-grid pec131-grid--${template}`}
        data-testid="public-entity-card-grid-v131"
        role="list"
      >
        {shown.map((entity, index) => (
          <PublicEntityCardV131
            key={entity.recordId}
            entity={entity}
            template={template}
            detailTemplate={detailTemplate}
            elementTitle={elementTitle}
            titleResult={titleResults[index]}
            disambiguateTitle={
              (titleCounts.get(normalizedCardValueV131(titleResults[index].title)) || 0) > 1
            }
          />
        ))}
      </div>
      {entities.length > shown.length && (
        <p className="pec131-overflow-note">
          대표 {shown.length.toLocaleString("ko-KR")}건을 표시합니다. 전체{" "}
          {entities.length.toLocaleString("ko-KR")}건은 아래 원자료 보기에서 확인할 수
          있습니다.
        </p>
      )}
    </>
  );
}

function PublicEntityCardV131({
  entity,
  template,
  detailTemplate,
  elementTitle,
  titleResult,
  disambiguateTitle,
}: {
  entity: VietnamEntityV124;
  template: PublicEntityCardTemplateV131;
  detailTemplate?: string;
  elementTitle?: string;
  titleResult: ReturnType<typeof resolvePublicEntityTitleV131>;
  disambiguateTitle: boolean;
}) {
  const approved = approvedCardAttributesV131(entity, template, detailTemplate);
  const title =
    compactTextV131(
      disambiguateTitle
        ? disambiguatedCardTitleV131(entity, titleResult.title)
        : titleResult.title,
      220
    ) || "공개 데이터 항목";
  const secondaryNote = compactTextV131(titleResult.secondaryNote, 112);
  const badges = badgeValuesV131(entity, approved, template, title);
  const facts = factValuesV131(approved, template, title);
  const sourceUrl = publicEntityUrlV131(entity, approved);

  return (
    <article
      className="pec131-card"
      data-testid="public-entity-card-v131"
      data-template={detailTemplate || template}
      role="listitem"
    >
      <div className="pec131-card__heading">
        {badges.length > 0 && (
          <ul className="pec131-card__badges" aria-label="항목 분류">
            {badges.map((badge) => (
              <li key={badge}>{badge}</li>
            ))}
          </ul>
        )}
        <h5
          className="pec131-card__title"
          data-testid="public-entity-card-title"
          aria-label={title}
        >
          {title}
        </h5>
        {secondaryNote && secondaryNote !== title && (
          <p className="pec131-card__secondary">{secondaryNote}</p>
        )}
      </div>

      <dl
        className="pec131-card__facts"
        data-testid="public-entity-card-facts"
        data-fact-count={facts.length}
        aria-label="핵심 정보"
      >
        {facts.map((fact) => (
          <FactV131 key={`${fact.label}-${fact.value}`} fact={fact} />
        ))}
      </dl>

      {sourceUrl && (
        <a
          className="pec131-card__link"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {template === "document" ? "문서 원문" : "공식 원문"}
        </a>
      )}
    </article>
  );
}

function disambiguatedCardTitleV131(
  entity: VietnamEntityV124,
  baseTitle: string
): string {
  const fields = CARD_TITLE_DISAMBIGUATION_FIELDS_V131[entity.elementId] || [];
  const details = fields
    .map((key) => compactTextV131(entity.normalizedAttributes?.[key], 58))
    .filter((value): value is string => Boolean(value))
    .filter(
      (value) =>
        normalizedCardValueV131(value) !== normalizedCardValueV131(baseTitle)
    )
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);
  return details.length > 0 ? `${baseTitle} · ${details.join(" · ")}` : baseTitle;
}

function FactV131({ fact }: { fact: PublicCardFactV131 }) {
  return (
    <div>
      <dt>{fact.label}</dt>
      <dd>{fact.value}</dd>
    </div>
  );
}

function approvedCardAttributesV131(
  entity: VietnamEntityV124,
  template: PublicEntityCardTemplateV131,
  detailTemplate?: string
): Record<string, PublicAttributeValueV126> {
  const cardTemplate =
    template === "portfolio"
      ? "project"
      : template === "directory"
      ? "partner"
      : template === "document"
      ? "entity"
      : detailTemplate || "entity";
  return {
    ...approvedEntityAttributesV126(entity, detailTemplate || cardTemplate),
    ...approvedEntityAttributesV126(entity, cardTemplate),
    ...reviewedElementCardAttributesV131(entity),
  };
}

function reviewedElementCardAttributesV131(
  entity: VietnamEntityV124
): Record<string, PublicAttributeValueV126> {
  const aliases = PUBLIC_CARD_ELEMENT_ATTRIBUTE_ALIASES_V131[entity.elementId];
  if (!aliases) return {};
  const entries: Array<[string, PublicAttributeValueV126]> = [];
  Object.entries(aliases).forEach(([publicKey, sourceKey]) => {
    const value = entity.normalizedAttributes[sourceKey];
    if (typeof value === "number" || typeof value === "boolean") {
      entries.push([publicKey, value]);
      return;
    }
    const safeValue = publicTextV126(value);
    if (safeValue) entries.push([publicKey, safeValue]);
  });
  return Object.fromEntries(entries);
}

function badgeValuesV131(
  entity: VietnamEntityV124,
  attributes: Record<string, PublicAttributeValueV126>,
  template: PublicEntityCardTemplateV131,
  title: string
): string[] {
  const candidates = CARD_BADGE_KEYS_V131[template].map((key) =>
    key === "entityType"
      ? compactTextV131(entity.entityType, 34)
      : compactAttributeV131(attributes[key], 34)
  );
  return uniquePublicValuesV131(candidates, title).slice(0, 3);
}

function factValuesV131(
  attributes: Record<string, PublicAttributeValueV126>,
  template: PublicEntityCardTemplateV131,
  title: string
): PublicCardFactV131[] {
  const seenValues = new Set<string>();
  const facts: PublicCardFactV131[] = [];
  CARD_FACT_KEYS_V131[template].forEach(({ label, keys, maxLength }) => {
    const value = keys
      .map((key) => compactAttributeV131(attributes[key], maxLength || 112))
      .find((candidate): candidate is string => Boolean(candidate));
    if (!value || normalizedCardValueV131(value) === normalizedCardValueV131(title)) {
      return;
    }
    const normalized = normalizedCardValueV131(value);
    if (seenValues.has(normalized)) return;
    seenValues.add(normalized);
    facts.push({ label, value });
  });
  return facts.slice(0, 6);
}

function uniquePublicValuesV131(
  values: Array<string | null>,
  title: string
): string[] {
  const seen = new Set<string>([normalizedCardValueV131(title)]);
  return values.flatMap((value) => {
    if (!value) return [];
    const normalized = normalizedCardValueV131(value);
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [value];
  });
}

function compactAttributeV131(
  value: PublicAttributeValueV126 | undefined,
  maxLength: number
): string | null {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactTextV131(item, Math.max(32, Math.floor(maxLength / 2))))
      .filter((item): item is string => Boolean(item));
    return compactTextV131(Array.from(new Set(items)).join(" · "), maxLength);
  }
  return compactTextV131(value, maxLength);
}

function compactTextV131(value: unknown, maxLength: number): string | null {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  const publicValue = publicTextV126(value);
  if (!publicValue) return null;
  const normalized = publicValue
    .replace(/\s*\|\s*/gu, " · ")
    .replace(/\s+/gu, " ")
    .trim();
  if (!normalized || EMPTY_VALUE_LABELS_V131.has(normalized)) return null;
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  const readable = lastSpace > maxLength * 0.62 ? clipped.slice(0, lastSpace) : clipped;
  return `${readable}…`;
}

function normalizedCardValueV131(value: string): string {
  return value.replace(/\s+/gu, " ").trim().toLocaleLowerCase("ko-KR");
}

function publicEntityUrlV131(
  entity: VietnamEntityV124,
  attributes: Record<string, PublicAttributeValueV126>
): string | null {
  const candidates: unknown[] = [
    attributes.websiteUrl,
    attributes.website,
    attributes.documentUrl,
    entity.normalizedAttributes.sourceUrl,
    entity.normalizedAttributes.recordSourceUrl,
    entity.normalizedAttributes.websiteUrl,
    entity.normalizedAttributes.website,
    entity.normalizedAttributes.documentUrl,
    entity.normalizedAttributes.publicationUrl,
    entity.provenance.sourceUrl,
  ];
  return (
    candidates
      .map((candidate) => publicSourceUrlV126(candidate))
      .find((candidate): candidate is string => Boolean(candidate)) || null
  );
}

export function publicEntityCardFactCountV131(
  entity: VietnamEntityV124,
  template: PublicEntityCardTemplateV131,
  detailTemplate?: string,
  title = ""
): number {
  return factValuesV131(
    approvedCardAttributesV131(entity, template, detailTemplate),
    template,
    title
  ).length;
}
