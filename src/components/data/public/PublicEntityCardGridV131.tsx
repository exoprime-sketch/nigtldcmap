import { regionSystemOfV162 } from "../../../data/geo/regionSystemV162";
import { useRegionTextV162 } from "../../../data/geo/regionDisplayV162";
import {
  approvedEntityAttributesV126,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import type { PublicAttributeValueV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { classifyStatedValueV142 } from "../../../data/visualization/statedValueRoleV142";
import type { StatedValueRoleV142 } from "../../../data/visualization/statedValueRoleV142";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

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
      keys: ["budgetScale", "approvedAmount", "primaryFinanceAmount"],
    },
    // V164 R2: D-014~D-016 state each project once per reporting period with the
    // commitment made in that period (a later year of a loan committed in 2011
    // states 0) - not the project's size. Labelled "규모" it read as a 0 USD
    // project that had 3.8 million disbursed.
    { label: "약정액(보고기간)", keys: ["commitmentAmount"] },
    { label: "집행액", keys: ["disbursedAmount"] },
    { label: "지원 한도", keys: ["supportLimit"] },
    { label: "지원 대상", keys: ["eligibleRecipients", "targetGroup"] },
    {
      label: "기간",
      keys: ["applicationPeriod", "projectPeriod", "approvalDate", "entryTiming"],
    },
    { label: "투자 라운드", keys: ["investmentRound"] },
    { label: "투자 연도", keys: ["investmentYear"] },
    { label: "투자 금액", keys: ["investmentAmount"] },
    { label: "투자자", keys: ["investorName"] },
    { label: "보고연도", keys: ["reportingPeriod"] },
    { label: "사업번호", keys: ["projectNumber"] },
    { label: "원조·자금 형태", keys: ["aidType", "financeType"] },
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
    { label: "유형", keys: ["organizationType", "orgType", "orgCategory", "recordCategory", "sector", "businessSector"] },
    { label: "값", keys: ["statedValue", "nationalMeasureValue"] },
    { label: "단위", keys: ["nationalMeasureUnit", "statedUnit"] },
    { label: "지점·유역", keys: ["siteName"] },
    { label: "위치", keys: ["siteDescription"], maxLength: 120 },
    { label: "시점", keys: ["statedPeriod", "creditingPeriod"] },
    { label: "상태", keys: ["status"] },
    { label: "기관·사업자", keys: ["supportingOrganization", "implementingEntity"] },
    { label: "등록표준·출처", keys: ["registryStandard", "methodology"] },
    { label: "발행량(tCO2e)", keys: ["issuedVolume"] },
    { label: "지역", keys: ["city", "regionName"] },
    { label: "기준연도", keys: ["referenceYear", "vintageYear", "year"] },
    // V164 R2: B-035 / B-036 rows state areas and rates, never a name.
    { label: "토지피복 면적(km²)", keys: ["landCoverArea"], maxLength: 160 },
    { label: "연평균 변화율(%/yr)", keys: ["landCoverTrend"], maxLength: 160 },
    { label: "설명", keys: ["recordDescription"], maxLength: 120 },
  ],
};

/** B-035 / B-036: the land-cover classes a row states, in the source's own column names. */
const LAND_COVER_CLASSES_V164: ReadonlyArray<readonly [string, string]> = [
  ["산림", "산림"],
  ["농경지", "농경지"],
  ["초지_관목", "초지·관목"],
  ["습지", "습지"],
  ["도시", "도시"],
  ["나지", "나지"],
  ["수체", "수체"],
  ["빙설", "빙설"],
];

function landCoverNumberV164(value: unknown, signed: boolean): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const text = value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  return signed && value > 0 ? `+${text}` : text;
}

/**
 * V164 R2: B-035 (land cover by province and year) and B-036 (its 1992-2022
 * change) deliver one row per province and year with the areas and rates in
 * columns of their own, and the card showed only "An Giang · 2022년". The row's
 * own figures are its facts: each class with the area (km²) or the yearly rate
 * (%/yr) the row states. A class the row leaves empty (a rate the source could
 * not compute) is not listed, and nothing is computed here.
 */
export function landCoverFactsV164(entity: VietnamEntityV124): Record<string, string> {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  if (entity.elementId === "B-035") {
    const parts = LAND_COVER_CLASSES_V164.flatMap(([key, label]) => {
      const text = landCoverNumberV164(attributes[`${key}_면적_km`], false);
      return text ? [`${label} ${text}`] : [];
    });
    return parts.length ? { landCoverArea: parts.join(" · ") } : {};
  }
  if (entity.elementId === "B-036") {
    const parts = LAND_COVER_CLASSES_V164.flatMap(([key, label]) => {
      const text = landCoverNumberV164(attributes[`${key}_CAGR_yr`], true);
      return text ? [`${label} ${text}`] : [];
    });
    return parts.length ? { landCoverTrend: parts.join(" · ") } : {};
  }
  return {};
}

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
  // B-025's nine basins showed a name and nothing else; the area inside
  // Viet Nam (GIS) and the river system are what the row states (V140). A
  // "literal:" source is a constant the delivery does not carry as a column.
  "B-025": {
    statedValue: "베트남_내_면적_km_GIS_산출",
    statedUnit: "literal:km² (베트남 내 면적, GIS 산출)",
    siteDescription: "수계_구분",
    siteName: "유역명_영문",
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
  // A note that applies to every card is a statement about the dataset, not
  // about each row. Printed per card it appeared twelve times in a row - the
  // same sentence, filling the screen between the items a reader came to read.
  const notes = titleResults.map((result) => result.secondaryNote || "");
  const sharedNote =
    notes.length > 1 && notes.every((note) => note && note === notes[0]) ? notes[0] : null;
  const approvedByCard = shown.map((entity) =>
    approvedCardAttributesV131(entity, template, detailTemplate)
  );
  const titleSuffixes = titleDisambiguationSuffixesV137(
    shown,
    titleResults.map((result) => result.title),
    approvedByCard
  );

  return (
    <>
      <div
        className={`pec131-grid pec131-grid--${template}`}
        data-analysis-block="cards-list"
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
            titleResult={
              sharedNote
                ? { ...titleResults[index], secondaryNote: null }
                : titleResults[index]
            }
            titleSuffix={titleSuffixes[index]}
            regionTitled={regionTitledV164(titleResults[index].secondaryNote)}
          />
        ))}
      </div>
      {sharedNote && (
        <p className="pec131-shared-note" data-testid="public-entity-card-shared-note">
          <PublicTermTextV134 text={sharedNote} />
        </p>
      )}
      {entities.length > shown.length && (
        <p className="pec131-overflow-note">
          대표 {shown.length.toLocaleString("ko-KR")}건을 표시합니다. 전체{" "}
          {entities.length.toLocaleString("ko-KR")}건은 아래 상세 데이터에서 확인할 수
          있습니다.
        </p>
      )}
    </>
  );
}

/** True for a card the source names by its region ("원천이 개별 명칭 대신 지역·연도로 행을 구분합니다."). */
export function regionTitledV164(secondaryNote: string | null | undefined): boolean {
  return /^원천이 개별 명칭 대신 지역/u.test(String(secondaryNote || ""));
}

function PublicEntityCardV131({
  entity,
  template,
  detailTemplate,
  elementTitle,
  titleResult,
  titleSuffix,
  regionTitled,
}: {
  entity: VietnamEntityV124;
  template: PublicEntityCardTemplateV131;
  detailTemplate?: string;
  elementTitle?: string;
  titleResult: ReturnType<typeof resolvePublicEntityTitleV131>;
  titleSuffix: string | null;
  regionTitled: boolean;
}) {
  const regionText = useRegionTextV162(entity.elementId);
  const approved = approvedCardAttributesV131(entity, template, detailTemplate);
  const composedTitle =
    compactTextV131(
      titleSuffix ? `${titleResult.title} · ${titleSuffix}` : titleResult.title,
      220
    ) || "공개 데이터 항목";
  // V164: a basin's title is its id; the kind and the area inside the country are
  // a badge and a fact instead of the tail of a title the card clipped.
  const basin = basinCardV164(entity, composedTitle);
  // V164 R2: a card titled by its region ("Mymensingh · 1901-1930") names the
  // place as the platform does everywhere else, "한글명 (현지명)".
  const title = basin ? basin.title : regionTitled ? regionText(composedTitle) : composedTitle;
  const secondaryNote = compactTextV131(titleResult.secondaryNote, 112);
  const badges = basin?.badge
    ? [basin.badge, ...badgeValuesV131(entity, approved, template, title)].slice(0, 3)
    : badgeValuesV131(entity, approved, template, title);
  // The official name and the numbers identify the record; they follow the
  // reviewed facts rather than standing in for the project's name.
  // The area fact above is the row's stated value and unit, so those two are not repeated.
  const facts = [
    ...(basin?.fact ? [basin.fact] : []),
    ...factValuesV131(approved, template, title).filter(
      (fact) => !(basin?.fact && (fact.label === "값" || fact.label === "단위"))
    ),
    ...(titleResult.identifierFacts || []),
  ];
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
              <li key={badge}><PublicTermTextV134 text={badge} /></li>
            ))}
          </ul>
        )}
        <h5
          className="pec131-card__title"
          data-testid="public-entity-card-title"
          aria-label={title}
        >
          <PublicTermTextV134 text={title} />
        </h5>
        {secondaryNote && secondaryNote !== title && (
          <p className="pec131-card__secondary">
            <PublicTermTextV134 text={secondaryNote} />
          </p>
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

/**
 * What separates two cards that arrived with the same title.
 *
 * Repeated titles are not a fault in themselves - three "Stride" cards are
 * three funding rounds, three "꽝빈성 태양광 발전사업" cards are three years of the
 * same project - but a reader cannot tell which is which. The reviewed fields
 * for an element are used first; where an element has none, the first approved
 * attribute whose value actually differs across the group is appended. Only
 * fields already cleared for public display are read, so this never surfaces
 * anything the card could not already show.
 */
function titleDisambiguationSuffixesV137(
  entities: VietnamEntityV124[],
  titles: string[],
  approved: Array<Record<string, PublicAttributeValueV126>>
): Array<string | null> {
  const suffixes: Array<string | null> = entities.map(() => null);
  const groups = new Map<string, number[]>();
  titles.forEach((title, index) => {
    const key = normalizedCardValueV131(title);
    const bucket = groups.get(key);
    if (bucket) bucket.push(index);
    else groups.set(key, [index]);
  });

  groups.forEach((indexes) => {
    if (indexes.length < 2) return;
    const configured = indexes.map((index) =>
      compactTextV131(
        disambiguatedCardTitleV131(entities[index], titles[index]),
        220
      )
    );
    if (new Set(configured).size > 1) {
      indexes.forEach((index, position) => {
        const value = configured[position];
        if (value && value !== titles[index]) {
          suffixes[index] = value.startsWith(`${titles[index]} · `)
            ? value.slice(titles[index].length + 3)
            : value;
        }
      });
      return;
    }
    // A year or a period separates repeated records the way a reader expects;
    // B-040's eleven "지열 발전량 — 실적(EIA)" cards are eleven years.
    const preferred = [
      "referenceYear",
      "statedPeriod",
      "reportingPeriod",
      "projectPeriod",
      "investmentYear",
      "vintageYear",
      "investmentRound",
    ];
    const allKeys = Array.from(
      new Set(indexes.flatMap((index) => Object.keys(approved[index])))
    );
    const keys = [
      ...preferred.filter((key) => allKeys.includes(key)),
      ...allKeys.filter((key) => !preferred.includes(key)),
    ];
    let best: { key: string; values: string[]; distinct: number } | null = null;
    for (const key of keys) {
      const values = indexes.map((index) =>
        titleSuffixCandidateV164(approved[index], key, titles[index])
      );
      if (values.some((value) => !value)) continue;
      const distinct = new Set(values).size;
      if (distinct < 2) continue;
      // A value that simply restates the title separates nothing.
      if (
        values.some(
          (value, position) =>
            normalizedCardValueV131(value as string) ===
            normalizedCardValueV131(titles[indexes[position]])
        )
      ) {
        continue;
      }
      if (!best || distinct > best.distinct) {
        best = { key, values: values as string[], distinct };
      }
      // A preferred key that already tells every card apart is the answer.
      if (distinct === indexes.length) break;
    }
    if (!best) {
      // V162: rows the 2026-09-30 delivery repeats under one name - the same
      // province in both administrative systems (B-036), a project and its
      // issuance records (C-025), a grant reported in two years (D-017,
      // D-024, D-026). They are told apart by what the source states.
      const systems = indexes.map((index) => regionSystemOfV162(entities[index]));
      const bySystem = new Set(systems).size > 1 && systems.every((system) => system === "adm1" || system === "adm1-prev");
      let stated: { values: string[]; distinct: number } | null = null;
      for (const [key, label, unit] of STATED_DISAMBIGUATION_KEYS_V162) {
        const values = indexes.map((index) => statedTitleValueV164(entities[index].normalizedAttributes?.[key], unit));
        if (values.some((value) => !value)) continue;
        const distinct = new Set(values).size;
        if (distinct < 2) continue;
        const labelled = (values as string[]).map((value) => (label ? `${label} ${value}` : value));
        if (!stated || distinct > stated.distinct) stated = { values: labelled, distinct };
        if (distinct === indexes.length) break;
      }
      if (!bySystem && !stated) return;
      indexes.forEach((index, position) => {
        const parts = [
          stated ? (stated as { values: string[] }).values[position] : null,
          bySystem ? (systems[position] === "adm1" ? "2025년 개편 후" : "개편 전") : null,
        ].filter(Boolean);
        suffixes[index] = parts.join(" · ");
      });
      return;
    }
    indexes.forEach((index, position) => {
      suffixes[index] = (best as { values: string[] }).values[position];
    });
  });

  return suffixes;
}

/** Columns that hold a basin's area inside the country (the first delivery named it after Viet Nam). */
const BASIN_AREA_KEYS_V164 = ["자국_내_면적_km_GIS_산출", "베트남_내_면적_km_GIS_산출"];

/**
 * B-025's basin card (V164).
 *
 * The title resolver composes "HydroBASINS 유역 4080024890 · 국제 공유 · 자국 내
 * 7.1 km²" for a basin the source gives no name. In a four-column grid that is
 * four lines under a two-line clamp, so the card read "HydroBASINS 유역 4080024890
 * · …" with the area cut off. The id stays the title; the kind (국제 공유 / 국내 완결)
 * becomes a badge and the area a fact. The figures are the row's own - nothing is
 * computed, and a basin with no area column simply has no area fact.
 */
export function basinCardV164(
  entity: VietnamEntityV124,
  title: string
): { title: string; badge: string | null; fact: PublicCardFactV131 | null } | null {
  if (entity.elementId !== "B-025") return null;
  const match = /^(HydroBASINS 유역 \S+) · /u.exec(title);
  if (!match) return null;
  const attributes = entity.normalizedAttributes || {};
  const area = BASIN_AREA_KEYS_V164.map((key) => attributes[key]).find(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );
  return {
    title: match[1],
    badge: compactTextV131(attributes["유역_구분_국내_완결_국제_공유"], 24),
    fact:
      area === undefined
        ? null
        : { label: "자국 내 면적(GIS 산출)", value: `${area.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} km²` },
  };
}

/**
 * What an approved attribute adds to a repeated title (V164).
 *
 * - The measure's name ("브라마푸트라(자무나)강(Bahadurabad) 건기·우기 유량비 - 2001년",
 *   B-023) is 50+ characters: cut at 42 it was the same on every row, so BGD's
 *   gauging cards fell through to the bare stated value ("Bahadurabad · 12883.454").
 *   It is read up to 90 characters, without the site name the title already says.
 * - A stated value that does separate the cards is written as it is in the facts:
 *   digits grouped and the unit after it (m3/s and 비(倍) are different things).
 */
function titleSuffixCandidateV164(
  attributes: Record<string, PublicAttributeValueV126>,
  key: string,
  title: string
): string | null {
  const text = compactTextV131(attributes[key], key === "measureName" ? 90 : 42);
  if (!text) return null;
  if (key === "statedValue" || key === "nationalMeasureValue") {
    const unit = compactTextV131(attributes.statedUnit ?? attributes.nationalMeasureUnit, 24);
    const grouped = groupedNumberV140(text);
    return unit ? `${grouped} ${unit}` : grouped;
  }
  if (key === "measureName" && title) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const without = text.replace(new RegExp(`\\s*[(（]\\s*${escaped}\\s*[)）]`, "iu"), "").replace(/\s{2,}/gu, " ").trim();
    return without || text;
  }
  return text;
}

/**
 * Columns the 2026-09-30 delivery states that separate same-named rows, with
 * their label and, for a bare number, the unit its column is stated in.
 *
 * V164 R2: a card title never carries a bare number ("약정액(USD) 89540.384",
 * "금액 35710000"): a number is read grouped with its unit, and a column whose
 * unit differs per element (대표금액: D-026 states it in USD millions) is not
 * used - the records stay under one name and their own facts tell them apart.
 * 총 투자액 and 용량 are written with their unit by the source ("18.5 백만 USD",
 * "66 MW").
 */
const STATED_DISAMBIGUATION_KEYS_V162: ReadonlyArray<readonly [string, string, string?]> = [
  ["회계연도", "회계연도"],
  ["보고연도", "보고연도"],
  ["기준연도", "기준연도"],
  ["연도", ""],
  ["식별_레코드_유형", ""],
  ["발행기록_모니터링_기간_종료_YYYY_MM_DD", "모니터링 종료"],
  ["발행기록_연도_년", "발행"],
  ["기간", ""],
  ["기간_시작_종료", ""],
  ["약정액_USD", "약정액", "USD"],
  ["총_투자액", "총 투자액"],
  ["용량", "용량"],
];

/** A stated value for a title: a bare number is grouped and followed by its unit, or left out. */
export function statedTitleValueV164(value: unknown, unit?: string): string | null {
  const text = compactTextV131(value, 42);
  if (!text) return null;
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) return text;
  // A year is a number a reader reads without a unit.
  if (/^(?:19|20)\d{2}$/u.test(text)) return text;
  if (!unit) return null;
  const number = Number(text);
  const readable = Number.isFinite(number)
    ? number.toLocaleString("ko-KR", { maximumFractionDigits: Math.abs(number) >= 100 ? 0 : 2 })
    : text;
  return `${readable} ${unit}`;
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

/** Facts that name a place (a city, a region, a gauging site) - V162 P12-B. */
const PLACE_FACT_LABELS_V162 = new Set(["위치", "지역", "지점·유역"]);

function FactV131({ fact }: { fact: PublicCardFactV131 }) {
  // A place reads "한글명 (현지명)" (reviewed names only); an address or a
  // sentence is not a dictionary name and stays as written.
  const regionText = useRegionTextV162();
  const value = PLACE_FACT_LABELS_V162.has(fact.label) ? regionText(fact.value) : fact.value;
  return (
    <div>
      <dt><PublicTermTextV134 text={fact.label} /></dt>
      <dd><PublicTermTextV134 text={value} /></dd>
    </div>
  );
}

export interface PublicEntityStatedValueV142 {
  recordId: string;
  title: string;
  /** The stated value as delivered (a number, a phone number, a date, a link …). */
  raw: PublicAttributeValueV126 | undefined;
  /** The numeric value when the row is a measurement; null for every other role. */
  value: number | null;
  unit: string;
  measureKey: string | null;
  period: string | null;
  role: StatedValueRoleV142;
  reason: string;
}

/**
 * The stated value of each entity with the role it plays (V142).
 *
 * A register whose rows each state one figure (B-025's basin areas) can be
 * compared; a register whose 값 column holds phone numbers, notice dates and
 * one rate (C-011) cannot, and used to be. Each row is classified from its own
 * unit, its indicator's unit and the shape of the value; only rows whose role
 * is `measure` carry a numeric `value`. The indicator units come from the
 * element's semantics when the caller has them.
 */
export function publicEntityStatedValuesV141(
  entities: VietnamEntityV124[],
  template: PublicEntityCardTemplateV131,
  detailTemplate?: string,
  elementTitle?: string,
  indicatorUnits: Record<string, { unit: string | null; unitFamily: string | null }> = {}
): PublicEntityStatedValueV142[] {
  return entities.flatMap((entity) => {
    const attributes = approvedCardAttributesV131(entity, template, detailTemplate);
    const raw = attributes.statedValue ?? attributes.nationalMeasureValue;
    if (raw === null || raw === undefined || raw === "") return [];
    const indicator = indicatorUnits[entity.indicatorId || ""] || { unit: null, unitFamily: null };
    const title = resolvePublicEntityTitleV131(entity, { template: detailTemplate, elementTitle }).title;
    const classified = classifyStatedValueV142({
      raw,
      unit: publicTextV126(attributes.statedUnit ?? attributes.nationalMeasureUnit) || "",
      measureName: publicTextV126(attributes.measureName ?? attributes.nationalMeasureName) ||
        (entity.elementId === "B-025" ? "베트남 내 유역 면적(GIS 산출)" : null),
      indicatorUnit: indicator.unit,
      indicatorUnitFamily: indicator.unitFamily,
      period: attributes.statedPeriod ?? attributes.referenceYear ?? null,
      title: `${entity.name || ""} ${title}`,
      elementId: entity.elementId,
    });
    return [{ recordId: entity.recordId, title, raw, ...classified }];
  });
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
  if (entity.elementId === "B-035" || entity.elementId === "B-036") return landCoverFactsV164(entity);
  const aliases = PUBLIC_CARD_ELEMENT_ATTRIBUTE_ALIASES_V131[entity.elementId];
  if (!aliases) return {};
  const entries: Array<[string, PublicAttributeValueV126]> = [];
  const literalKeys = new Set<string>();
  Object.entries(aliases).forEach(([publicKey, sourceKey]) => {
    if (sourceKey.startsWith("literal:")) {
      literalKeys.add(publicKey);
      entries.push([publicKey, sourceKey.slice("literal:".length)]);
      return;
    }
    const value = entity.normalizedAttributes[sourceKey];
    if (typeof value === "number" || typeof value === "boolean") {
      entries.push([publicKey, value]);
      return;
    }
    const safeValue = publicTextV126(value);
    if (safeValue) entries.push([publicKey, safeValue]);
  });
  // V158: a constant describes the columns this rule was reviewed on (B-025's
  // unit for the in-country area). A row carrying none of them - another
  // country's delivery of the element - gets no constant either.
  const fromColumns = entries.some(([key]) => !literalKeys.has(key));
  return Object.fromEntries(fromColumns ? entries : []);
}

function badgeValuesV131(
  entity: VietnamEntityV124,
  attributes: Record<string, PublicAttributeValueV126>,
  template: PublicEntityCardTemplateV131,
  title: string
): string[] {
  const candidates = CARD_BADGE_KEYS_V131[template].map((key) =>
    key === "entityType"
      ? compactTextV131(publicEntityTypeBadgeV137(entity.entityType), 34)
      : compactAttributeV131(attributes[key], 34)
  );
  return uniquePublicValuesV131(candidates, title).slice(0, 3);
}

/**
 * entityType is how the pipeline files a row, not something a reader wants.
 *
 * Every card on the province-year screens carried a badge reading "entity" -
 * the record type, printed before the title, twelve times a screen. A value
 * that only names the storage shape is dropped; anything the source says about
 * what kind of thing the row is still shows.
 */
const STRUCTURAL_ENTITY_TYPES_V137 = new Set([
  "entity",
  "observation",
  "record",
  "row",
  "metadata",
]);

function publicEntityTypeBadgeV137(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || STRUCTURAL_ENTITY_TYPES_V137.has(text.toLowerCase())) return null;
  return text;
}

function groupedNumberV140(value: string): string {
  const trimmed = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/u.test(trimmed)) return value;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || Math.abs(number) < 1000) return value;
  const decimals = (trimmed.split(".")[1] || "").length;
  return number.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
    // A stated number reads with digit grouping ("86,253", not "86253"),
    // the same way the summary card prints it.
    facts.push({ label, value: label === "값" ? groupedNumberV140(value) : value });
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
