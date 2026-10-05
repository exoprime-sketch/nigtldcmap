/**
 * V162: country views of the spec text.
 *
 * The spec text (description, usage, use cases, cautions) is common to every
 * country's screens, so no field may name a particular country for all of
 * them. The workbook was written for all target countries at once and names
 * them freely. This module turns one source text into the text a given
 * country's screens show, sentence by sentence and by rule:
 *
 *   1 count     a list of target countries that only says how many have the
 *               data ('베트남·방글라데시 2개국에만 있다') becomes a neutral phrase
 *               built from the count ('대상 국가 중 2개국에만 있다')
 *               - an open list ('방글라데시·인도네시아 등과') -> '대상 국가 중 여러 나라와'
 *               - examples before a count ('방글라데시 등 6개 창립국') -> '6개 창립국'
 *   2 aside     a parenthesis naming another platform country is dropped
 *               ('달러 환산 전이고(방글라데시는 타카)' -> '달러 환산 전이고')
 *   3 own       a sentence that still names another platform country is that
 *               country's own sentence: the country-keyed table
 *               (src/data/spec/countryTextSplitV162.json) gives the viewer's
 *               own wording of it, and without one it is not shown
 *   4 common    anything else is shown as it is
 *
 * Platform countries are the country registry (public/data/countries.json),
 * live or not, so a country added there is handled on the next import. A
 * country list is counted over the target countries (priorityCountries.ts),
 * which the workbook's lists draw from.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENGLISH_ALIAS_V162 = { VNM: ["Vietnam", "Viet Nam"], BGD: ["Bangladesh"] };

export function loadCountryNamesV162(root) {
  const registry = JSON.parse(readFileSync(resolve(root, "public/data/countries.json"), "utf8")).countries || [];
  const source = readFileSync(resolve(root, "src/data/priorityCountries.ts"), "utf8");
  const targets = [...source.matchAll(/iso3: "([A-Z]{3})", nameKo: "([^"]+)"/g)].map((match) => ({ iso3: match[1], nameKo: match[2] }));
  const platform = registry.map((row) => ({
    iso3: row.iso3,
    names: [...new Set([row.nameKo, row.nameEn, ...(ENGLISH_ALIAS_V162[row.iso3] || [])].filter(Boolean))],
  }));
  return { platform, targets };
}

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * V166: a regex source for one country name - '인도' (India) never inside
 * '인도네시아', '인도양', '인도주의' ...; any other name as written. Shared with
 * qa:acceptance:v162, so the import and the acceptance read a name the same way.
 */
export function countryNameSourceV166(name) {
  return name === "인도" ? "인도(?!네시아|양|주의|적|지원|차이나|교|되|하|받)" : escape(name);
}

/** A regex source for country names, longest first. */
function nameSource(names) {
  return [...names]
    .sort((a, b) => b.length - a.length)
    .map(countryNameSourceV166)
    .join("|");
}

/**
 * Sentences with their trailing whitespace, so joining them rebuilds the text
 * exactly. A sentence ends at '.', '?' or '!' followed by whitespace or the end.
 */
export function sentencesV162(text) {
  const value = String(text ?? "");
  if (!value) return [];
  return value.match(/[^]*?(?:[.?!](?=\s|$)|$)(?:\s+|$)/gu).filter((part) => part.length > 0);
}

export function makeCountryViewsV162({ platform, targets }) {
  const platformByName = new Map();
  for (const row of platform) for (const name of row.names) platformByName.set(name, row.iso3);
  const anyPlatform = new RegExp(`(${nameSource([...platformByName.keys()])})`, "gu");
  const target = nameSource([...new Set([...targets.map((row) => row.nameKo), ...platformByName.keys()])]);
  const paren = "(?:\\([^()]*\\))?";
  const joiner = "(?:\\s*[·ㆍ]\\s*|(?:과|와)\\s+)";
  const listSource = `(?:${target})${paren}(?:${joiner}(?:${target})${paren})+`;
  // The count the sentence already states after the list, dropped as the phrase carries it.
  const countTail = "(?:\\s*(?:\\d+\\s*개국|두\\s*(?:나라|곳)|세\\s*나라|둘|셋))?";
  const someTail = "\\s*등\\s*일부\\s*나라";
  const someList = new RegExp(`(${listSource})${someTail}`, "gu");
  // '방글라데시·인도네시아 등과 함께' - an open list ('등') has no count to give.
  const etcList = new RegExp(`(${listSource})\\s*등(과|와|이|가|을|를|은|는|에서|의)?`, "gu");
  // '방글라데시 등 6개 창립국' - examples before a stated count: the count stays.
  const examplesBeforeCount = new RegExp(`(?:${listSource}|(?:${target})${paren})\\s*등\\s*(?=\\d+\\s*개)`, "gu");
  const particleAfterRa = { 과: "와", 와: "와", 이: "가", 가: "가", 을: "를", 를: "를", 은: "는", 는: "는", 에서: "에서", 의: "의" };
  const list = new RegExp(`(${listSource})(${countTail})(은|는|이|가|을|를|과|와)?`, "gu");
  const particleAfterGuk = { 은: "은", 는: "은", 이: "이", 가: "이", 을: "을", 를: "을", 과: "과", 와: "과" };
  const countNames = (listText) => new Set([...listText.matchAll(new RegExp(`(${target})`, "gu"))].map((match) => match[1])).size;

  const platformIn = (text) => [...new Set([...String(text).matchAll(anyPlatform)].map((match) => platformByName.get(match[1])))];

  /** Rule 1: '베트남·방글라데시 2개국에만' -> '대상 국가 중 2개국에만'. */
  function neutralizeLists(sentence) {
    return sentence
      .replace(examplesBeforeCount, "")
      .replace(someList, "대상 국가 중 일부 나라")
      .replace(etcList, (whole, listText, particle) => `대상 국가 중 여러 나라${particle ? particleAfterRa[particle] : ""}`)
      .replace(list, (whole, listText, tail, particle) => `대상 국가 중 ${countNames(listText)}개국${particle ? particleAfterGuk[particle] : ""}`);
  }

  /**
   * Rule 2: the part of a parenthesis naming a platform country other than the
   * viewer. '(계획서에 적힌 통화·단위 그대로, 방글라데시는 십억 타카)' keeps its
   * first part; a parenthesis with nothing else left goes entirely.
   */
  function dropAsides(sentence, viewer) {
    const foreign = (text) => platformIn(text).some((iso3) => iso3 !== viewer);
    return sentence.replace(/(\s*)\(([^()]*)\)/gu, (aside, space, inner) => {
      if (!foreign(inner)) return aside;
      const kept = inner.split(/,\s*/u).filter((part) => !foreign(part));
      return kept.length ? `${space}(${kept.join(", ")})` : "";
    });
  }

  /**
   * One sentence as the viewer's screens show it: { text: string|null, rule }.
   * `own(sentence)` looks the sentence up in the country-keyed table and
   * returns { [iso3]: text } or null.
   */
  function viewSentence(sentence, viewer, own) {
    if (platformIn(sentence).length === 0) return { text: sentence, rule: "common" };
    const counted = neutralizeLists(sentence);
    const trimmed = dropAsides(counted, viewer);
    const others = platformIn(trimmed).filter((iso3) => iso3 !== viewer);
    if (others.length === 0) {
      const rule = trimmed === sentence ? "common" : trimmed !== counted ? (counted !== sentence ? "count+aside" : "aside") : "count";
      return { text: trimmed, rule };
    }
    const keyed = own(sentence);
    if (keyed) {
      const text = keyed[viewer];
      return { text: text ? `${text}${sentence.match(/\s*$/u)[0]}` : null, rule: "own-table" };
    }
    return { text: null, rule: "own" };
  }

  /** A whole field as the viewer's screens show it, with the rule applied to each changed sentence. */
  function viewText(text, viewer, own = () => null) {
    const changes = [];
    const kept = [];
    for (const sentence of sentencesV162(text)) {
      const result = viewSentence(sentence, viewer, own);
      if (result.text !== sentence) changes.push({ from: sentence.trim(), to: result.text === null ? null : result.text.trim(), rule: result.rule });
      if (result.text !== null) kept.push(result.text);
    }
    return { text: kept.join("").replace(/\s+$/u, ""), changes };
  }

  return { platformIn, neutralizeLists, viewSentence, viewText };
}
