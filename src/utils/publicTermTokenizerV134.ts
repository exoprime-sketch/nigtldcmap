import {
  getPublicGlossaryByAliasV134,
  listPublicGlossaryAliasesV134,
  normalizePublicTermAliasV134,
  PUBLIC_GLOSSARY_BY_ID_V134,
} from "../data/glossary/publicGlossaryV134";
import type { PublicGlossaryEntryV134 } from "../data/glossary/publicGlossaryV134";

export interface ResolvedPublicTermV134 extends PublicGlossaryEntryV134 {
  displayTerm: string;
  derivedFrom?: "SPEI" | "SSP" | "SDG" | "PPP" | "MPI" | "PMC" | "IP";
}

export type PublicTermTokenV134 =
  | { type: "text"; value: string }
  | { type: "term"; value: string; entry: ResolvedPublicTermV134 };

export interface TokenizePublicTermsOptionsV134 {
  /** Wrap only the first occurrence of each glossary id in a text block. */
  firstOccurrenceOnly?: boolean;
}

function escapeRegExpV134(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STATIC_ALIAS_PATTERN_V134 = listPublicGlossaryAliasesV134()
  .map(escapeRegExpV134)
  .join("|");

const PUBLIC_TERM_PATTERN_V134 = new RegExp(
  `SPEI(?:-?(?:3|6|12))|SSP[1-5](?:[-‐-―−][0-9](?:\\.[0-9])?)?|SDG(?:1[0-7]|[1-9])|${STATIC_ALIAS_PATTERN_V134}`,
  "g"
);

const EXCLUDED_VISIBLE_TEXT_PATTERN_V134 =
  /(?:https?:\/\/|www\.)[^\s<]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[A-Za-z]:[\\/][^\s<]+|(?<![\p{L}\p{N}])(?:\.\.\/|\.\/|\/)(?:[\w.-]+[\\/])+[\w.-]+/gu;

function isWordCharacterV134(character: string | undefined): boolean {
  return Boolean(character && /[\p{Script=Latin}\p{N}_]/u.test(character));
}

function hasSafeBoundariesV134(
  text: string,
  start: number,
  end: number
): boolean {
  return !isWordCharacterV134(text[start - 1]) && !isWordCharacterV134(text[end]);
}

function excludedRangesV134(text: string): Array<[number, number]> {
  EXCLUDED_VISIBLE_TEXT_PATTERN_V134.lastIndex = 0;
  const ranges: Array<[number, number]> = [];
  let match: RegExpExecArray | null;
  while ((match = EXCLUDED_VISIBLE_TEXT_PATTERN_V134.exec(text))) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isExcludedV134(
  start: number,
  end: number,
  ranges: Array<[number, number]>
): boolean {
  return ranges.some(
    ([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart
  );
}

function resolveSpeiV134(
  value: string
): ResolvedPublicTermV134 | null {
  const match = normalizePublicTermAliasV134(value).match(/^SPEI-?(3|6|12)$/);
  if (!match) return null;
  const base = PUBLIC_GLOSSARY_BY_ID_V134.get("spei");
  if (!base) return null;
  const months = Number(match[1]);
  return {
    ...base,
    id: `spei-${months}`,
    term: `SPEI${months}`,
    displayTerm: value,
    englishName: `${base.englishName} (${months}-month)`,
    koreanName: `${months}개월 ${base.koreanName}`,
    definition: `${base.definition.replace(/\.$/, "")} ${months}개월 누적기간을 반영합니다.`,
    derivedFrom: "SPEI",
  };
}

const SSP_PATH_DESCRIPTION_V134: Record<string, string> = {
  "SSP1-1.9": "지속가능성 중심 경로와 2100년 복사강제력 1.9 W/m²를 가정한 시나리오입니다.",
  "SSP1-2.6": "지속가능성 중심 경로와 2100년 복사강제력 2.6 W/m²를 가정한 시나리오입니다.",
  "SSP2-4.5": "사회경제적 중간 경로와 2100년 복사강제력 4.5 W/m²를 가정한 시나리오입니다.",
  "SSP3-7.0": "지역간 경쟁이 강한 경로와 2100년 복사강제력 7.0 W/m²를 가정한 시나리오입니다.",
  "SSP5-8.5": "화석연료 의존 개발 경로와 2100년 복사강제력 8.5 W/m²를 가정한 시나리오입니다.",
};

function resolveSspV134(value: string): ResolvedPublicTermV134 | null {
  const normalized = normalizePublicTermAliasV134(value);
  const match = normalized.match(/^SSP([1-5])(?:-([0-9](?:\.[0-9])?))?$/);
  if (!match) return null;
  const base = PUBLIC_GLOSSARY_BY_ID_V134.get("ssp");
  if (!base) return null;
  const path = match[1];
  const forcing = match[2];
  const code = forcing ? `SSP${path}-${forcing}` : `SSP${path}`;
  const definition = forcing
    ? SSP_PATH_DESCRIPTION_V134[code] ??
      `공통사회경제경로 ${path}와 2100년 복사강제력 ${forcing} W/m²를 가정한 시나리오입니다.`
    : `${base.definition.replace(/\.$/, "")} 경로 ${path}에 해당합니다.`;
  return {
    ...base,
    id: code.toLowerCase().replace(".", "-"),
    term: code,
    displayTerm: value,
    englishName: `Shared Socioeconomic Pathway ${path}${
      forcing ? `-${forcing}` : ""
    }`,
    koreanName: `공통사회경제경로 ${path}${
      forcing ? `–${forcing}` : ""
    }`,
    definition,
    derivedFrom: "SSP",
  };
}

const SDG_GOAL_LABELS_V134: Record<number, string> = {
  1: "빈곤 종식",
  2: "기아 종식",
  3: "건강과 웰빙",
  4: "양질의 교육",
  5: "성평등",
  6: "깨끗한 물과 위생",
  7: "깨끗하고 저렴한 에너지",
  8: "양질의 일자리와 경제성장",
  9: "산업·혁신·인프라",
  10: "불평등 감소",
  11: "지속가능한 도시와 공동체",
  12: "책임 있는 소비와 생산",
  13: "기후행동",
  14: "해양생태계 보전",
  15: "육상생태계 보전",
  16: "평화·정의·제도",
  17: "목표를 위한 파트너십",
};

function resolveSdgV134(value: string): ResolvedPublicTermV134 | null {
  const match = normalizePublicTermAliasV134(value).match(/^SDG(1[0-7]|[1-9])$/);
  if (!match) return null;
  const base = PUBLIC_GLOSSARY_BY_ID_V134.get("sdg");
  if (!base) return null;
  const goal = Number(match[1]);
  const label = SDG_GOAL_LABELS_V134[goal];
  return {
    ...base,
    id: `sdg-${goal}`,
    term: `SDG${goal}`,
    displayTerm: value,
    englishName: `Sustainable Development Goal ${goal}`,
    koreanName: `지속가능발전목표 ${goal} · ${label}`,
    definition: `유엔 지속가능발전목표의 ${goal}번 목표로, ${label}을 다룹니다.`,
    derivedFrom: "SDG",
  };
}

function resolvePppV134(
  value: string,
  context: string
): ResolvedPublicTermV134 | null {
  if (normalizePublicTermAliasV134(value) !== "PPP") return null;
  const economyContext =
    /(?:GDP|GNI|소득|빈곤|물가|구매력|per\s*cap|international\s+dollars?|PPP\s*(?:constant\s*)?(?:2017|2021))/i.test(
      context
    );
  const entry = PUBLIC_GLOSSARY_BY_ID_V134.get(
    economyContext ? "ppp-economy" : "ppp-project"
  );
  return entry ? { ...entry, displayTerm: value, derivedFrom: "PPP" } : null;
}

function resolveMpiV134(
  value: string,
  context: string
): ResolvedPublicTermV134 | null {
  if (normalizePublicTermAliasV134(value) !== "MPI") return null;
  const ministryContext =
    /(?:기획투자부|Ministry\s+of\s+Planning(?:\s+and|\s*&)?\s+Investment|CPEIR|공공조달청|재무부로\s*통합|정부부처)/iu.test(
      context
    );
  const indexContext =
    /(?:다차원\s*빈곤|Multidimensional\s+Poverty|poverty\s+index|빈곤\s*지수|INFORM)/iu.test(
      context
    );
  if (ministryContext === indexContext) return null;
  const entry = PUBLIC_GLOSSARY_BY_ID_V134.get(
    ministryContext ? "mpi-ministry" : "mpi-index"
  );
  return entry ? { ...entry, displayTerm: value, derivedFrom: "MPI" } : null;
}

function resolvePmcV134(
  value: string,
  context: string
): ResolvedPublicTermV134 | null {
  if (normalizePublicTermAliasV134(value) !== "PMC") return null;
  const literatureContext =
    /(?:PubMed|논문|학술|Microbiol|Biotechnol|저널|MDPI)/iu.test(context);
  const projectContext =
    /(?:용역|사업관리|프로젝트|공사|건립|지원사업)/iu.test(context);
  if (literatureContext === projectContext) return null;
  const entry = PUBLIC_GLOSSARY_BY_ID_V134.get(
    literatureContext ? "pmc-literature" : "pmc-project"
  );
  return entry ? { ...entry, displayTerm: value, derivedFrom: "PMC" } : null;
}

function resolveIpV134(
  value: string,
  context: string
): ResolvedPublicTermV134 | null {
  if (normalizePublicTermAliasV134(value) !== "IP") return null;
  const industryContext = /(?:산업공정|온실가스|배출|공정)/iu.test(context);
  const intellectualPropertyContext = /(?:지식재산|특허|상표|WIPO|Statistics|혁신)/iu.test(context);
  if (industryContext === intellectualPropertyContext) return null;
  const entry = PUBLIC_GLOSSARY_BY_ID_V134.get(
    industryContext ? "ip-industry" : "ip-intellectual-property"
  );
  return entry ? { ...entry, displayTerm: value, derivedFrom: "IP" } : null;
}

export function resolvePublicTermV134(
  value: string,
  context = value
): ResolvedPublicTermV134 | null {
  return (
    resolveSpeiV134(value) ??
    resolveSspV134(value) ??
    resolveSdgV134(value) ??
    resolvePppV134(value, context) ??
    resolveMpiV134(value, context) ??
    resolvePmcV134(value, context) ??
    resolveIpV134(value, context) ??
    (() => {
      const entry = getPublicGlossaryByAliasV134(value);
      return entry ? { ...entry, displayTerm: value } : null;
    })()
  );
}

/**
 * Tokenizes a rendered text value only. It never traverses the DOM, mutates HTML,
 * or sees React attributes/raw download values. URL, e-mail and file-path spans
 * are additionally excluded when they occur in a visible text block.
 */
export function tokenizePublicTermsV134(
  text: string,
  options: TokenizePublicTermsOptionsV134 = {}
): PublicTermTokenV134[] {
  if (!text || !STATIC_ALIAS_PATTERN_V134) {
    return text ? [{ type: "text", value: text }] : [];
  }

  const firstOccurrenceOnly = options.firstOccurrenceOnly !== false;
  const seen = new Set<string>();
  const excluded = excludedRangesV134(text);
  const tokens: PublicTermTokenV134[] = [];
  let cursor = 0;
  PUBLIC_TERM_PATTERN_V134.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PUBLIC_TERM_PATTERN_V134.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    // Ambiguous aliases such as MPI must be resolved from their own nearby
    // sentence, not from unrelated words elsewhere in a long card or table row.
    const localContext = text.slice(
      Math.max(0, start - 80),
      Math.min(text.length, end + 80)
    );
    const entry = resolvePublicTermV134(match[0], localContext);
    if (
      !entry ||
      !hasSafeBoundariesV134(text, start, end) ||
      isExcludedV134(start, end, excluded) ||
      (firstOccurrenceOnly && seen.has(entry.id))
    ) {
      continue;
    }

    if (start > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, start) });
    }
    tokens.push({ type: "term", value: match[0], entry });
    seen.add(entry.id);
    cursor = end;
  }

  if (cursor < text.length) {
    tokens.push({ type: "text", value: text.slice(cursor) });
  }
  return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}
