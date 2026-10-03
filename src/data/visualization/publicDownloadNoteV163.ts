/**
 * V163-DL: the note, caveat and citation text a download file carries, without
 * the delivery team's working notes.
 *
 * The delivery workbooks write two kinds of text into the same cells: notes
 * about the data (how a value was aggregated, what a gap means, which year a
 * coordinate stands for) and notes about the work (a client review comment and
 * its response, where the raw file sits in the delivery folder, a licence
 * check, the old sheet a row was moved from). The screens never show the
 * second kind; the download projection used to copy the cells as delivered.
 *
 * Text is read in segments - " ‖ ", " / [tag]" and every "[tag] …" start one -
 * and a segment is dropped when its tag names working-process content or its
 * text cites the delivery's own process (client review, raw folder, old sheet,
 * collection status). Inside a kept segment a sentence that does so is dropped.
 * Data content stays word for word; a check date in a kept tag goes. Values,
 * units, years and source columns are not touched.
 */

/** A segment whose tag names the delivery's working process is dropped whole. */
const WORK_TAG_V163 =
  /발주처|검토|검수|★|지적|공통의견|raw|라이선스|지정\s*출처|수집\s*현황|서식|구분자\s*통일|열\s*→\s*행|값\s*(?:국문화|정규화)|현지조사\s*구분|원자료\s*수록\s*범위|요소\s*변경|출처\s*표기\s*통일|출처표기\s*통일|미수집|수집\s*방법|구성지표\s*수집|원천\s*확인|처리\s*규칙|처리규칙|표출\s*범위|기준\s*원천|대조|출처\s*성격|출처\s*문구/u;

/** Text that cites the delivery's own process; the sentence (or segment) holding it is dropped. */
const WORK_TEXT_V163 =
  /발주처|검토\s*의견|검토의견|감독관|명세서|수집\s*현황|수집현황|v5\.\d+|협의\s*대상|확인\s*항목\s*:|raw\s*(?:폴더|data|원본|대조|에는|에\s|CSV|미보관|보유|의\s)|\[raw\]|raw_data|원\s*레코드|구서식|레코드\s*ID|지오코딩_대장|원자료구성_설명|\d{2}_공통|\\|플랫폼\s*표출|ND\s*위반|tech_ids?\b|억지\s*매핑|(?:^|[\s(「«`])[A-E]-\d{3}_[^\s]*\.(?:json|csv|xlsx?|geojson|zip|pdf|txt)/u;

/** The licence's own change notice stays (CC BY 4.0 §3(a)(1)(B)). */
const KEEP_TAG_V163 = /변경\s*고지/u;

/** A citation part naming a file the delivery team made (element-coded, Korean-named, versioned, country-suffixed). */
const WORK_FILE_PART_V163 =
  /[A-E]-\d{3}_|[가-힣][^\s;]*\.(?:json|csv|zip|xlsx?|geojson)\b|_0\d판|_(?:BGD|VNM)(?:_[^\s;.]*)?\.(?:json|csv)\b/u;

/** Wording of the 2025 Vietnamese province reform, which another country's file does not have. */
const REFORM_SENTENCE_V163 = /개편\s*전과|개편\s*후|34개\s*(?:성|체계)|63개\s*성/u;

const SEGMENT_SPLIT_V163 = /\s+‖\s+|\s+\/\s+(?=\[)|\s*(?=\[[^\][]{1,40}\]\s)/u;
const SENTENCE_SPLIT_V163 = /(?<=[.。])\s+/u;
const LEADING_TAG_V163 = /^\[([^\][]{1,40})\]\s*/u;

function cleanSegmentV163(segment: string, otherCountry: boolean): string | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;
  const tag = trimmed.match(LEADING_TAG_V163)?.[1] || "";
  if (tag && WORK_TAG_V163.test(tag) && !KEEP_TAG_V163.test(tag)) return null;
  const body = tag ? trimmed.replace(LEADING_TAG_V163, "") : trimmed;
  const kept = body
    .split(SENTENCE_SPLIT_V163)
    .filter((sentence) => sentence.trim() && !WORK_TEXT_V163.test(sentence))
    .filter((sentence) => !otherCountry || !REFORM_SENTENCE_V163.test(sentence))
    .map((sentence) =>
      // A citation lists its files with "; " - a file of our own goes, the publisher's stays.
      sentence.includes(";")
        ? sentence
            .split(/\s*;\s*/u)
            .filter((part) => part && !WORK_FILE_PART_V163.test(part))
            .join("; ")
        : WORK_FILE_PART_V163.test(sentence) && /\.(?:json|csv|zip|xlsx?|geojson)\b/u.test(sentence)
          ? ""
          : sentence
    )
    .map((sentence) => (otherCountry ? sentence.replace(/\s*\(개편\s*전\)/gu, "") : sentence))
    .filter((sentence) => sentence.trim())
    .join(" ")
    .trim();
  if (!kept) return null;
  // A kept tag keeps its name, not the date the delivery team wrote it on.
  const shownTag = tag.replace(/\s*\d{4}-\d{2}-\d{2}\s*/gu, " ").trim();
  return shownTag ? `[${shownTag}] ${kept}` : kept;
}

/**
 * Note, caveat or citation text for a download file; null when nothing public
 * is left. `countryIso3` other than Viet Nam also drops the 2025 province
 * reform wording a shared template carried into another country's notes.
 */
export function publicDownloadTextV163(value: unknown, countryIso3?: string | null): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/gu, " ").trim();
  if (!text) return null;
  const otherCountry = Boolean(countryIso3) && String(countryIso3).toUpperCase() !== "VNM";
  const parts = text
    .split(SEGMENT_SPLIT_V163)
    .map((segment) => cleanSegmentV163(segment, otherCountry))
    .filter((part): part is string => Boolean(part));
  const joined = parts.join(" ").replace(/\s{2,}/gu, " ").replace(/^[\s·,;|-]+|[\s·,;|-]+$/gu, "").trim();
  return joined || null;
}
