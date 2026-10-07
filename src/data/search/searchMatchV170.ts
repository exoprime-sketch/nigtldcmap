/**
 * V170 데이터 찾기 검색: 동의어 확장, 관련도 묶음('…'에 관한 데이터 / '…' 내용이
 * 포함된 데이터 / '…' 기술로 분류된 데이터), 일치 근거.
 *
 * The term matcher mirrors scripts/v170/build-search-v170.mjs, which counts the
 * same records for the topic panel; both must agree (searchMatchV170.test.ts).
 */
import synonymsJson from "./searchSynonymsV170.json";

export interface SynonymGroupV170 {
  id: string;
  label: string;
  techId?: string;
  terms: string[];
}

export const SYNONYM_GROUPS_V170: SynonymGroupV170[] = (synonymsJson as { groups: SynonymGroupV170[] }).groups;

export function normalizeV170(text: unknown): string {
  return String(text ?? "").normalize("NFC").toLowerCase();
}

const ASCII_V170 = /^[\x20-\x7e]+$/;

function escapeRegExpV170(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TermHitV170 {
  index: number;
  length: number;
}

/** A text normalized once for every term that looks at it. */
export interface PreparedTextV170 {
  text: string;
  norm: string;
  squeezed: string;
}

export function prepareTextV170(text: string): PreparedTextV170 {
  const norm = normalizeV170(text);
  return { text, norm, squeezed: norm.replace(/\s+/g, "") };
}

/** One search term: Hangul by substring (spaces ignored), Latin by whole word. */
export class TermV170 {
  readonly term: string;
  private readonly ascii: boolean;
  private readonly pattern: RegExp | null;
  private readonly squeezed: string;

  constructor(term: string) {
    this.term = normalizeV170(term).trim();
    this.ascii = ASCII_V170.test(this.term);
    this.pattern = this.ascii ? new RegExp(`(^|[^a-z0-9])(${escapeRegExpV170(this.term)})(?=$|[^a-z0-9])`, "u") : null;
    this.squeezed = this.term.replace(/\s+/g, "");
  }

  /** Position of the term in already-normalized text, or null. */
  find(normalized: string, squeezed?: string): TermHitV170 | null {
    if (!this.term) return null;
    if (this.pattern) {
      const match = this.pattern.exec(normalized);
      return match ? { index: match.index + match[1].length, length: match[2].length } : null;
    }
    const index = normalized.indexOf(this.term);
    if (index >= 0) return { index, length: this.term.length };
    const flat = squeezed ?? normalized.replace(/\s+/g, "");
    if (this.squeezed && flat.includes(this.squeezed)) return { index: -1, length: 0 };
    return null;
  }
}

export interface QueryTokenV170 {
  /** What the reader typed for this token. */
  raw: string;
  terms: TermV170[];
  groupIds: string[];
}

export interface ExpandedQueryV170 {
  tokens: QueryTokenV170[];
  /** Terms added by the synonym dictionary, for "함께 찾은 말". */
  addedTerms: string[];
  groupIds: string[];
}

function groupsForTokenV170(token: string): SynonymGroupV170[] {
  const normalized = normalizeV170(token).replace(/\s+/g, "");
  return SYNONYM_GROUPS_V170.filter((group) =>
    group.terms.some((term) => normalizeV170(term).replace(/\s+/g, "") === normalized)
  );
}

/**
 * Splits the query on spaces (every token must match: AND) and widens each
 * token to its synonym group. A whole query that is itself a dictionary term
 * with a space ("solar PV", "해수면 상승") stays one token.
 */
export function expandQueryV170(query: string): ExpandedQueryV170 {
  const trimmed = normalizeV170(query).trim().replace(/\s+/g, " ");
  if (!trimmed) return { tokens: [], addedTerms: [], groupIds: [] };
  const whole = groupsForTokenV170(trimmed);
  const parts = whole.length > 0 ? [trimmed] : trimmed.split(" ");
  const tokens: QueryTokenV170[] = parts.map((raw) => {
    const groups = groupsForTokenV170(raw);
    const words = new Set<string>([raw]);
    groups.forEach((group) => group.terms.forEach((term) => words.add(normalizeV170(term))));
    return { raw, terms: Array.from(words).map((word) => new TermV170(word)), groupIds: groups.map((group) => group.id) };
  });
  const typed = new Set(tokens.map((token) => token.raw.replace(/\s+/g, "")));
  const added: string[] = [];
  tokens.forEach((token) =>
    token.groupIds.forEach((id) =>
      SYNONYM_GROUPS_V170.find((group) => group.id === id)?.terms.forEach((term) => {
        const key = normalizeV170(term).replace(/\s+/g, "");
        if (!typed.has(key) && !added.some((existing) => normalizeV170(existing).replace(/\s+/g, "") === key)) added.push(term);
      })
    )
  );
  return { tokens, addedTerms: added, groupIds: Array.from(new Set(tokens.flatMap((token) => token.groupIds))) };
}

// ---------------------------------------------------------------- per dataset

export type MatchTierV170 = 1 | 2 | 3;

export interface MatchFieldV170 {
  /** Shown as "<label>에서 일치". */
  label: string;
  text: string;
  weight: number;
  /**
   * Proper names (provider, country): only the words the reader typed, not
   * their synonyms - "태양광" must not find "Global Solar Atlas" as a provider.
   */
  exact?: boolean;
}

export interface RecordTextsV170 {
  total: number;
  texts: Array<[string, number]>;
  /** Filled on first use and kept with the cached records. */
  prepared?: PreparedTextV170[];
}

export interface MatchSnippetV170 {
  pre: string;
  hit: string;
  post: string;
}

export interface DatasetMatchV170 {
  tier: MatchTierV170;
  score: number;
  /** Where the strongest token matched: "설명", "원자료", "기후기술 분류" … */
  where: string;
  snippet: MatchSnippetV170 | null;
  records: { matched: number; total: number } | null;
}

const SNIPPET_SIDE_V170 = 28;

export function snippetV170(text: string, hit: TermHitV170): MatchSnippetV170 {
  if (hit.index < 0) {
    const head = text.slice(0, SNIPPET_SIDE_V170 * 2);
    return { pre: "", hit: "", post: head + (text.length > head.length ? "…" : "") };
  }
  const start = Math.max(0, hit.index - SNIPPET_SIDE_V170);
  const end = Math.min(text.length, hit.index + hit.length + SNIPPET_SIDE_V170);
  return {
    pre: (start > 0 ? "…" : "") + text.slice(start, hit.index),
    hit: text.slice(hit.index, hit.index + hit.length),
    post: text.slice(hit.index + hit.length, end) + (end < text.length ? "…" : ""),
  };
}

/** The earliest hit of any of the token's words (the longest at a tie). */
function findInV170(token: QueryTokenV170, text: string | PreparedTextV170): TermHitV170 | null {
  const prepared = typeof text === "string" ? prepareTextV170(text) : text;
  let best: TermHitV170 | null = null;
  let fallback: TermHitV170 | null = null;
  for (const term of token.terms) {
    const hit = term.find(prepared.norm, prepared.squeezed);
    if (!hit) continue;
    if (hit.index < 0) {
      if (!fallback) fallback = hit;
      continue;
    }
    if (!best || hit.index < best.index || (hit.index === best.index && hit.length > best.length)) best = hit;
  }
  return best || fallback;
}

/** Records whose public text holds the token, and the first such text. */
export function countRecordsV170(token: QueryTokenV170, records: RecordTextsV170 | null | undefined) {
  if (!records) return { matched: 0, total: 0, first: null as { text: string; hit: TermHitV170 } | null };
  let matched = 0;
  let total = 0;
  let first: { text: string; hit: TermHitV170 } | null = null;
  if (!records.prepared) records.prepared = records.texts.map(([text]) => prepareTextV170(text));
  const prepared = records.prepared;
  for (let index = 0; index < records.texts.length; index += 1) {
    const [text, count] = records.texts[index];
    total += count;
    const hit = findInV170(token, prepared[index]);
    if (hit) {
      matched += count;
      if (!first) first = { text, hit };
    }
  }
  return { matched, total: Math.max(total, records.total || 0), first };
}

/**
 * Tier 1 when a token is in the dataset's own text (name, definition,
 * description, usage, category, provider); tier 2 when only in its records;
 * tier 3 when only in its climate-technology label. Every token must match
 * somewhere (null otherwise); the weakest token sets the tier.
 */
export function matchDatasetV170(
  query: ExpandedQueryV170,
  fields: MatchFieldV170[],
  records: RecordTextsV170 | null | undefined,
  technologyLabels: string[]
): DatasetMatchV170 | null {
  if (query.tokens.length === 0) return null;
  let tier: MatchTierV170 = 1;
  let score = 0;
  let lead: DatasetMatchV170 | null = null;
  for (const token of query.tokens) {
    const typedOnly: QueryTokenV170 = { ...token, terms: [new TermV170(token.raw)] };
    let best: DatasetMatchV170 | null = null;
    const counted = countRecordsV170(token, records);
    const ratio = counted.total > 0 ? counted.matched / counted.total : 0;
    const recordInfo = counted.matched > 0 ? { matched: counted.matched, total: counted.total } : null;
    for (const field of fields) {
      if (!field.text) continue;
      const hit = findInV170(field.exact ? typedOnly : token, field.text);
      if (!hit) continue;
      const candidate: DatasetMatchV170 = {
        tier: 1,
        score: 1000 + field.weight + Math.round(ratio * 100),
        where: field.label,
        snippet: snippetV170(field.text, hit),
        records: recordInfo,
      };
      if (!best || candidate.score > best.score) best = candidate;
    }
    if (!best && counted.first) {
      best = {
        tier: 2,
        score: 500 + Math.round(ratio * 400) + Math.min(50, Math.round(Math.log10(counted.matched + 1) * 20)),
        where: "원자료",
        snippet: snippetV170(counted.first.text, counted.first.hit),
        records: recordInfo,
      };
    }
    if (!best) {
      const label = technologyLabels.find((text) => findInV170(token, text));
      if (label) best = { tier: 3, score: 100, where: "기후기술 분류", snippet: null, records: null };
    }
    if (!best) return null;
    if (best.tier > tier) tier = best.tier;
    score += best.score;
    if (!lead || best.tier > lead.tier || (best.tier === lead.tier && best.score < lead.score)) lead = best;
  }
  return lead ? { ...lead, tier, score } : null;
}

/**
 * V170-1: each group says how the data relates to the query, with the query
 * in it ("'태양광'에 관한 데이터"). The words after the quoted query are fixed,
 * so no particle depends on the query's last syllable.
 */
export function tierLabelV170(tier: MatchTierV170, query: string): string {
  const q = `‘${query.trim()}’`;
  if (tier === 1) return `${q}에 관한 데이터`;
  if (tier === 2) return `${q} 내용이 포함된 데이터`;
  return `${q} 기술로 분류된 데이터`;
}

export const TIER_NOTES_V170: Record<MatchTierV170, string> = {
  1: "데이터 이름이나 설명이 이 주제를 다룹니다",
  2: "데이터 안의 일부 내용에 검색어가 있습니다(포함 비율이 높은 순)",
  3: "기후기술 분류만 해당하고, 데이터 내용에는 검색어가 없습니다",
};
