/**
 * V164-3 (R1): the units a source line and the 자료정보 panel state.
 *
 * Several deliveries filed a working note in the unit column instead of a unit -
 * "속성별 —3행 머리글 괄호 표기 참조" (read the unit from the 3rd header row),
 * "광종별 상이 - 「단위」 열 참조 (t / t REO)" (read the unit column) - and a few
 * filed the column's own name ("구분", "연도"). The line printed all of them as
 * "단위 …". A unit a reader can use is kept; a note is dropped, and a note that
 * carries the units in a parenthesis ("… 열 참조 (t / t REO)") gives them up.
 */

/** A note about where the unit is written, not a unit. */
const UNIT_NOTE_V164 = /머리글|괄호\s*표기/u;
/** "광종별 상이 - 「단위」 열 참조 (t / t REO)": the units are the parenthesis. */
const UNIT_COLUMN_NOTE_V164 = /^[^()]*「단위」\s*열\s*참조\s*(?:\((.*)\))?\s*$/u;
/** A column's name filed as its unit: the value says what kind of row it is, not what it is counted in. */
const COLUMN_NAME_V164 = /^(?:구분|연도)$/u;

/** Splits "t / t (W 함량) / 천 t" on the slashes that are not inside a parenthesis. */
function splitTopLevelV164(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "/" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** The units to print for one unit string, as zero or more unit strings. */
function usableUnitsV164(unit: string): string[] {
  const text = unit.trim();
  if (!text) return [];
  const column = UNIT_COLUMN_NOTE_V164.exec(text);
  if (column) {
    // A parenthesis cut short by the source ("… / t …") leaves an unfinished last unit: left out.
    return splitTopLevelV164(column[1] || "").filter((part) => !/…|\.\.\.$/u.test(part));
  }
  if (UNIT_NOTE_V164.test(text)) return [];
  if (COLUMN_NAME_V164.test(text)) return [];
  return [text];
}

/** The units of an already-public list, without the working notes. Order is kept; repeats go. */
export function publicUnitsV164(units: readonly string[]): string[] {
  return [...new Set(units.flatMap(usableUnitsV164))];
}
