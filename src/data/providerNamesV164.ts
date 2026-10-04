/**
 * V164-4: provider (제공기관) names as a reader picks and reads them.
 *
 * A catalogue item's source line is the delivery's own citation, not a list of
 * organisations. One string can hold several organisations joined by " | ",
 * " / " or " · ", an organisation followed by the dataset or document it
 * published ("World Bank — Projects & Operations database", "베트남 정부 —
 * Nghị định 29/2026/NĐ-CP"), the file's boundary or coordinate source ("· 경계
 * GADM 4.1 ADM1", "| 좌표(발전소): …") and the indicator codes of the citation.
 * Used as a filter option as it stands, the same organisation came up as 25
 * different "World Bank …" entries and a line of 259 characters was one choice.
 *
 * Here a source string is cut at those separators, the boundary / coordinate
 * clauses and the document or dataset after a dash are dropped, notes in
 * brackets that are only a year, version, address or remark go, and the
 * spellings of the best-known organisations are brought to one name. Only the
 * display text is derived; no data file is read or changed, and an item still
 * matches a provider when ANY of its organisations does.
 */

/** Same organisation, one name. The first matching rule wins (case-insensitive). */
const ORGANISATION_FAMILIES_V164: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(?:World Bank|세계은행)(?![A-Za-z])/iu, "World Bank"],
  [/^(?:UNFCCC|United Nations Framework Convention on Climate Change)(?![A-Za-z])/iu, "UNFCCC"],
  [/^(?:FAO|FAOSTAT|FAOLEX|Food and Agriculture Organization)(?![A-Za-z])/iu, "FAO"],
  [/^(?:Global Forest Watch|GFW|Hansen|UMD)(?![A-Za-z])/iu, "Global Forest Watch"],
  [/^IIASA(?![A-Za-z])/iu, "IIASA"],
  [/^(?:European Commission,? (?:Joint Research Centre|JRC)|EU JRC|JRC)(?![A-Za-z])/iu, "European Commission JRC"],
  [/^Copernicus(?![A-Za-z])/iu, "Copernicus"],
  [/^(?:IMF|International Monetary Fund)(?![A-Za-z])/iu, "International Monetary Fund (IMF)"],
  [/^USGS(?![A-Za-z])/iu, "USGS"],
  [/^Global Data Lab(?![A-Za-z])/iu, "Global Data Lab"],
  [/^(?:WRI|World Resources Institute)(?![A-Za-z])/iu, "World Resources Institute (WRI)"],
  [/^(?:OECD|Organisation for Economic Co-operation and Development)(?![A-Za-z])/iu, "OECD"],
  [/^(?:ESA|European Space Agency)(?![A-Za-z])/iu, "European Space Agency (ESA)"],
  [/^(?:IRENA|International Renewable Energy Agency)(?![A-Za-z])/iu, "IRENA"],
  [/^(?:IEA|International Energy Agency)(?![A-Za-z])/iu, "International Energy Agency (IEA)"],
  [/^(?:U\.?S\.? EIA|U\.?S\.? Energy Information Administration)(?![A-Za-z])/iu, "U.S. Energy Information Administration (EIA)"],
  [/^(?:Energy Institute|EI Statistical Review)(?![A-Za-z])/iu, "Energy Institute"],
  [/^(?:GEF|Global Environment Facility)(?![A-Za-z])/iu, "Global Environment Facility (GEF)"],
  [/^(?:GCF|Green Climate Fund)(?![A-Za-z])/iu, "Green Climate Fund (GCF)"],
  [/^(?:GGGI|Global Green Growth Institute)(?![A-Za-z])/iu, "Global Green Growth Institute (GGGI)"],
  [/^(?:UNDP|United Nations Development Programme)(?![A-Za-z])/iu, "United Nations Development Programme (UNDP)"],
  [/^(?:UNEP[ -]CCC|UNEP Copenhagen Climate Centre)(?![A-Za-z])/iu, "UNEP Copenhagen Climate Centre"],
  [/^(?:UNESCO Institute for Statistics|UIS)(?![A-Za-z])/iu, "UNESCO Institute for Statistics (UIS)"],
  [/^Germanwatch(?![A-Za-z])/iu, "Germanwatch"],
  [/^WWF(?![A-Za-z])/iu, "WWF"],
  [/^OpenStreetMap(?![A-Za-z])/iu, "OpenStreetMap contributors"],
  [/^(?:University of Notre Dame|ND-GAIN)(?![A-Za-z])/iu, "University of Notre Dame (ND-GAIN)"],
  [/^(?:IFC|International Finance Corporation)(?![A-Za-z])/iu, "International Finance Corporation (IFC)"],
  [/^(?:IHA|International Hydropower Association)(?![A-Za-z])/iu, "International Hydropower Association (IHA)"],
  [/^(?:Mekong River Commission|MRC)(?![A-Za-z])/iu, "Mekong River Commission (MRC)"],
  [/^(?:MONRE|베트남 천연자원환경부)/u, "베트남 천연자원환경부(MONRE)"],
  [/^(?:베트남 )?산업무역부/u, "베트남 산업무역부(MOIT)"],
  [/^베트남 정부(?![ 가-힣]*(?:공보|포털))/u, "베트남 정부"],
  [/^베트남 총리(?:실)?(?![가-힣])/u, "베트남 총리실"],
  [/^베트남 국회상임위원회/u, "베트남 국회상임위원회"],
  [/^베트남 국회/u, "베트남 국회"],
  [/^방글라데시 국가세입청/u, "방글라데시 국가세입청(NBR)"],
  [/^방글라데시 (?:재무부 )?재정국/u, "방글라데시 재무부 재정국"],
  [/^방글라데시 법무부 법령DB/u, "방글라데시 법무부 법령DB"],
  [/^대한민국 ODA 통합보고/u, "대한민국 ODA 통합보고(OECD CRS)"],
  [/^(?:대한민국 )?외교부/u, "대한민국 외교부"],
  [/^(?:National Board of Revenue|NBR)(?![A-Za-z])/u, "방글라데시 국가세입청(NBR)"],
  [/^(?:WTO|World Trade Organization)(?![A-Za-z])/iu, "World Trade Organization (WTO)"],
  [/^IPCC(?![A-Za-z])/iu, "IPCC"],
  [/^(?:UNESCO|United Nations Educational)(?![A-Za-z])/iu, "UNESCO"],
];

/** Parts of one source line the data joins with. Brackets are never split. */
const LIST_SEPARATORS_V164 = [" | ", " / ", " · "] as const;
/** What sits between an organisation and the dataset or document it published. */
const DESCRIPTOR_DASH_V164 = /^(?:\s+[—–]\s+|\s-\s+)/u;
/** The file's boundary or coordinate source, never a provider of the data. */
const MAP_SUPPORT_CLAUSE_V164 = /^(?:경계|좌표)|\bGADM\b|\bgeoBoundaries\b/iu;
/** Authors and year: a source, but not an organisation. */
const CITATION_V164 = /\bet al\b\.?/iu;
/** The words of a body, in either language: what makes a part read as an organisation. */
const ORGANISATION_WORD_V164 =
  /\b(?:Institute|Agency|Bank|Ministry|Division|Authority|Centre|Center|Programme|Program|Organization|Organisation|Commission|Fund|Funds|Facility|Association|Council|Partnership|University|Foundation|Network|Corporation|Department|Bureau|Secretariat|Administration|Survey|Union|Group|Office|Board|Government|Forum|Alliance|Laboratory|Service|Committee|Ltd|Inc|Initiative)\b|(?:정부|기관|기구|협회|위원회|사무국|연구원|연구소|대학|재단|센터|공사|공단|은행|협의회)(?![가-힣])|[가-힣]{2,}(?:부|청|국|실)(?![가-힣])/u;
/** An acronym in brackets at the end: "Global Environment Facility (GEF)". */
const TRAILING_ACRONYM_V164 = /\([A-Z][A-Za-z&-]{1,9}\)\s*$/u;
/** Words of a document or a dataset rather than of a body. */
const DOCUMENT_WORD_V164 =
  /\b(?:Report|Reports|Act|Policy|Framework|Dataset|Database|Map|Atlas|Index|Statistics|Statistical|Review|Tool|Datamask|Export|Stocks|Summaries|Yearbook|Plan|Law|Study)\b|법령|원문|보고서|통계|자료|지도/iu;
/** A bracket that is only a year, a version, an address or a remark on how it was quoted. */
const TRAILING_NOTE_V164 =
  /\s*[([]\s*(?:[^()[\]]*\b(?:19|20)\d{2}\b[^()[\]]*|v?\d[\d.x]*|[^()[\]]*(?:원자료|인용|보도|경유|병용|재게시)[^()[\]]*|[^()[\]]*\.(?:gov|org|com|net|go|or|int|edu)\b[^()[\]]*|[^()[\]]*(?:Quyết|Nghị|Thông tư|Decree|Decision)[^()[\]]*)\s*[)\]]\s*$/iu;
/** A legal document named after the issuing body ("베트남 총리 Decision 768/QĐ-TTg"). */
const DOCUMENT_TAIL_V164 = /\s+(?:Decree|Decision|Quyết định|Nghị định|Nghị quyết|Thông tư)\b.*$/iu;
/** A version / edition word at the end ("… Database v2026-06"). */
const VERSION_TAIL_V164 = /\s+v\d[\w.-]*$/iu;
/** A quoted title after the body ('재무부 "Climate Financing …"'). */
const QUOTED_TITLE_V164 = /\s*["“”][^"“”]*["“”]/gu;

function normaliseSpaceV164(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/** Split at the separators outside any (...) or [...]. */
export function splitTopLevelV164(text: string, separators: readonly string[]): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const separator = separators.find((candidate) => text.startsWith(candidate, index));
      if (separator) {
        parts.push(text.slice(start, index));
        start = index + separator.length;
        index += separator.length - 1;
      }
    }
  }
  parts.push(text.slice(start));
  return parts.map(normaliseSpaceV164).filter(Boolean);
}

/** Where the first dash outside brackets starts, with its width, or null. */
function descriptorDashV164(text: string): { index: number; width: number } | null {
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const match = text.slice(index).match(DESCRIPTOR_DASH_V164);
      if (match) return { index, width: match[0].length };
    }
  }
  return null;
}

function canonicalFamilyV164(name: string): string | null {
  for (const [pattern, canonical] of ORGANISATION_FAMILIES_V164) {
    if (pattern.test(name)) return canonical;
  }
  return null;
}

function withoutBracketsV164(name: string): string {
  return name.replace(/\([^()]*\)|\[[^[\]]*\]/gu, " ");
}

function isOrganisationLikeV164(name: string): boolean {
  return (
    canonicalFamilyV164(name) !== null ||
    ORGANISATION_WORD_V164.test(withoutBracketsV164(name)) ||
    TRAILING_ACRONYM_V164.test(name)
  );
}

/** A key that makes spelling variants of one name equal. */
function sameNameKeyV164(name: string): string {
  return name
    .toLocaleLowerCase("ko")
    .replace(/\([^)]*\)/gu, "")
    .replace(/[^0-9a-z가-힣]+/gu, "");
}

/** The name without the notes that only describe how it was cited. */
function cleanedNameV164(value: string): string {
  return normaliseSpaceV164(value)
    .replace(QUOTED_TITLE_V164, "")
    .replace(DOCUMENT_TAIL_V164, "")
    .replace(TRAILING_NOTE_V164, "")
    .replace(TRAILING_NOTE_V164, "")
    .replace(VERSION_TAIL_V164, "")
    .replace(/\s+및$/u, "")
    .replace(/[\s,;:]+$/u, "")
    .trim();
}

interface ClauseV164 {
  /** The clause as written, boundary / coordinate clauses already gone. */
  text: string;
  /** The organisation named by it. */
  organisation: string;
  /** A citation or a document, kept only when no organisation is named. */
  weak: boolean;
}

/** Authors and year at the start ("Beck et al.(2023)"): a source, not a body. */
const AUTHOR_CITATION_V164 = /^[A-Z][\w'-]+(?: [A-Z]\.?)* et al\b|^[A-Z][a-z][\w'-]*(?: [A-Z][a-z][\w'-]*)? \((?:19|20)\d{2}\)$/u;
/** A country written after the body ("…, Bangladesh"). */
const COUNTRY_SUFFIX_V164 = /,\s*(?:Bangladesh|Viet ?Nam|Vietnam)$/iu;

/**
 * A head that lists bodies ("NDC Partnership, GGGI, Global Methane Pledge,
 * IRENA", "방글라데시 통계국(BBS) × FAO AQUASTAT") is several providers. Split
 * only when at least two of the pieces read as bodies, so a body with a unit
 * ("Power Division, MPEMR") or a long full name with commas stays whole.
 */
function expandedHeadV164(head: string): string[] {
  // A full name that has commas of its own ("National Board of Revenue (NBR),
  // Internal Resources Division, Ministry of Finance") is one body.
  if (canonicalFamilyV164(head) !== null && !head.includes(" × ")) return [head];
  const withoutCountry = head.replace(COUNTRY_SUFFIX_V164, "");
  const separators = [" × ", ...(withoutCountry.length > 40 ? [", "] : [])];
  const pieces = splitTopLevelV164(withoutCountry, separators);
  if (pieces.length < 2) return [withoutCountry];
  const bodies = pieces.filter((piece) => isOrganisationLikeV164(cleanedNameV164(piece)));
  return bodies.length >= 2 ? pieces : [withoutCountry];
}

function clausesV164(raw: string): ClauseV164[] {
  const text = normaliseSpaceV164(raw);
  if (!text) return [];
  const clauses: ClauseV164[] = [];
  // After a "body — dataset" part the parts that follow are most often more of
  // that dataset's description ("— CCI-LC · MODIS · CGLS"); only a part that
  // reads as a body is then taken as another provider.
  let afterDescriptor = false;
  for (const segment of splitTopLevelV164(text, LIST_SEPARATORS_V164)) {
    if (MAP_SUPPORT_CLAUSE_V164.test(segment)) continue;
    // A semicolon separates two sources, except inside a described part.
    const pieces = descriptorDashV164(segment) !== null ? [segment] : splitTopLevelV164(segment, ["; "]);
    for (const piece of pieces) {
      if (MAP_SUPPORT_CLAUSE_V164.test(piece)) continue;
      const dash = descriptorDashV164(piece);
      const head = normaliseSpaceV164(dash ? piece.slice(0, dash.index) : piece);
      const description = dash ? normaliseSpaceV164(piece.slice(dash.index + dash.width)) : "";
      const parts = expandedHeadV164(head);
      for (const part of parts) {
        let name = cleanedNameV164(part);
        let family = canonicalFamilyV164(name);
        let like = isOrganisationLikeV164(name);
        // "Climate Change Trust Act, 2010 — FAOLEX …": the head is a document
        // and the body is named after the dash.
        if (!like && description && parts.length === 1) {
          const named = cleanedNameV164(description.split(/\s+[—–]\s+/u)[0]);
          const namedBody = canonicalFamilyV164(named) !== null || ORGANISATION_WORD_V164.test(withoutBracketsV164(named));
          if (named && namedBody && !DOCUMENT_WORD_V164.test(named)) {
            name = named;
            family = canonicalFamilyV164(name);
            like = true;
          }
        }
        // "Renewable Energy Policy of Bangladesh 2025 (Power Division, MPEMR)":
        // the body is the bracket.
        // (A bracket that cleaning removed was a remark on the citation.)
        if (!like && cleanedNameV164(part).endsWith(")")) {
          const bracket = part.match(/\(([^()]+)\)\s*$/u);
          if (bracket && !CITATION_V164.test(bracket[1]) && (canonicalFamilyV164(bracket[1]) !== null || ORGANISATION_WORD_V164.test(bracket[1]))) {
            name = cleanedNameV164(bracket[1]);
            family = canonicalFamilyV164(name);
            like = true;
          }
        }
        // A list of examples in brackets after a long name is not part of it.
        if (name.length > 48) name = name.replace(/\s*\((?!\s*[A-Z][A-Za-z&-]{1,9}\s*\))[^()]*\)\s*$/u, "").trim();
        if (!name) continue;
        if (afterDescriptor && !like) continue;
        const author = AUTHOR_CITATION_V164.test(part);
        const weak = !like && (author || CITATION_V164.test(part) || DOCUMENT_WORD_V164.test(name));
        const organisation = family ?? (author ? part.replace(/al\.\(/u, "al. (") : name);
        const written = parts.length > 1 ? part : normaliseSpaceV164(piece.replace(/[\s,;:]+$/u, ""));
        clauses.push({ text: written, organisation, weak });
      }
      if (dash) afterDescriptor = true;
    }
  }
  const strong = clauses.filter((clause) => !clause.weak);
  return strong.length > 0 ? strong : clauses;
}

const organisationsCacheV164 = new Map<string, string[]>();

/**
 * The organisations a source string names, one display name each, in order of
 * appearance and without duplicates. Empty when the string is only a boundary
 * or coordinate clause.
 */
export function providerOrganisationsV164(raw: string | null | undefined): string[] {
  const key = String(raw ?? "");
  const cached = organisationsCacheV164.get(key);
  if (cached) return cached;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const clause of clausesV164(key)) {
    const id = sameNameKeyV164(clause.organisation);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    names.push(clause.organisation);
  }
  organisationsCacheV164.set(key, names);
  return names;
}

/** The organisations of every source string of one item, de-duplicated. */
export function itemProviderNamesV164(sourceOrganizations: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of sourceOrganizations || []) {
    for (const name of providerOrganisationsV164(raw)) {
      const id = sameNameKeyV164(name);
      if (seen.has(id)) continue;
      seen.add(id);
      names.push(name);
    }
  }
  return names;
}

/** The filter's options: every organisation named by any item, sorted in Korean order. */
export function providerFilterOptionsV164(items: ReadonlyArray<{ sourceOrganizations: readonly string[] }>): string[] {
  const byKey = new Map<string, string>();
  for (const item of items) {
    for (const name of itemProviderNamesV164(item.sourceOrganizations)) {
      const id = sameNameKeyV164(name);
      if (!byKey.has(id)) byKey.set(id, name);
    }
  }
  return [...byKey.values()].sort((left, right) => left.localeCompare(right, "ko"));
}

/**
 * Does the item have the chosen provider? A match on any of its organisations;
 * a value that is one of the item's source strings as written (an address
 * saved before the options were reduced to organisation names) matches too.
 */
export function itemHasProviderV164(item: { sourceOrganizations: readonly string[] }, chosen: string): boolean {
  if (!chosen || chosen === "all") return true;
  if (item.sourceOrganizations.includes(chosen)) return true;
  const id = sameNameKeyV164(chosen);
  return itemProviderNamesV164(item.sourceOrganizations).some((name) => name === chosen || sameNameKeyV164(name) === id);
}

/** A clause longer than this is shortened to the organisation it names. */
const CLAUSE_TEXT_LIMIT_V164 = 70;

/**
 * The source line's clauses as a card writes them: boundary / coordinate
 * clauses and repeated organisations removed, each "organisation — dataset"
 * kept as written while it is short enough to read, else just the
 * organisation.
 */
export function providerClauseTextsV164(raw: string | readonly string[] | null | undefined): string[] {
  const rawList = Array.isArray(raw) ? (raw as readonly string[]) : [String(raw ?? "")];
  const seen = new Set<string>();
  const texts: string[] = [];
  for (const one of rawList) {
    for (const clause of clausesV164(String(one ?? ""))) {
      const id = sameNameKeyV164(clause.organisation);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      texts.push(clause.text.length <= CLAUSE_TEXT_LIMIT_V164 ? clause.text : clause.organisation);
    }
  }
  return texts;
}

/**
 * A card's source line: at most `limit` clauses written and the rest counted
 * ("외 N"). Takes one source string or an item's list of them.
 */
export function providerLineV164(raw: string | readonly string[] | null | undefined, limit = 2): string {
  const texts = providerClauseTextsV164(raw);
  if (texts.length <= limit) return texts.join(" · ");
  return `${texts.slice(0, limit).join(" · ")} 외 ${texts.length - limit}`;
}
