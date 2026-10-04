/**
 * V164-3: which rows and which columns of the evidence table say something.
 *
 * The table lists the delivered rows as they are. Two things made it read as
 * broken: a column nobody filled ("기준연도·대상·근거" on A-013 and E-015, whose
 * header wrapped one character per line), and rows that print the very same
 * words (A-013 lists a Viet Nam NDC action once per source document, and the
 * document is not a column of the table). Nothing here changes a value or invents
 * one: a column is dropped only when every cell of it is empty, and a row only
 * when every cell of it equals the cells of a row that is already shown.
 */

export interface EvidenceRowCellsV164 {
  group: string | null;
  area: string;
  result: string;
  unit: string | null;
  basis: string;
}

/** The marker the table prints for a cell the delivery left empty. */
const EMPTY_CELL_V164 = "—";

function cellV164(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function isFilledV164(value: string | null | undefined): boolean {
  const text = cellV164(value);
  return text !== "" && text !== EMPTY_CELL_V164;
}

/**
 * The rows with each repeat of an already shown row taken out, in the order the
 * rows were delivered. "Repeat" means every cell is the same text as the reader
 * sees it (`shown` turns a cell into its public text; the compiler's row serial at
 * the head of A-013's notes is gone there); rows that differ in a single cell (the
 * sector, the value, the year) are all kept.
 */
export function dedupeIdenticalRowsV164<T extends EvidenceRowCellsV164>(
  items: readonly T[],
  shown: (cell: string) => string = (cell) => cell
): { items: T[]; hiddenCount: number } {
  const seen = new Set<string>();
  const kept: T[] = [];
  const read = (value: string | null | undefined) => cellV164(shown(cellV164(value)));
  for (const item of items) {
    const signature = JSON.stringify([read(item.group), read(item.area), read(item.result), read(item.unit), read(item.basis)]);
    if (seen.has(signature)) continue;
    seen.add(signature);
    kept.push(item);
  }
  return { items: kept, hiddenCount: items.length - kept.length };
}

/**
 * The columns worth printing. The group column names a group once, on its first
 * row, so with a single group it is one word above an empty column; the unit and
 * the basis columns are printed only when at least one row fills them.
 */
export function evidenceColumnsV164(items: readonly EvidenceRowCellsV164[]): { hasGroups: boolean; hasUnits: boolean; hasBasis: boolean } {
  const groups = new Set(items.map((item) => cellV164(item.group)).filter(Boolean));
  return {
    hasGroups: groups.size > 1,
    hasUnits: items.some((item) => isFilledV164(item.unit)),
    hasBasis: items.some((item) => isFilledV164(item.basis)),
  };
}
