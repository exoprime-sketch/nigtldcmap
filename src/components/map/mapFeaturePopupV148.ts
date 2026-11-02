import type { MapFactV148 } from "../../data/map/mapPresentationV148";

/** V152: one label-form card row (facilityCardV153); a missing value prints "미기재". */
export interface MapPopupRowV152 {
  key: string;
  label: string;
  value: string;
  missing: boolean;
}

/** A hover is a short record summary. No HTML from data and no hidden duplicate
 * transcript: the visible record itself is the accessibility/test contract.
 * V152: sites with a facility card show every card row (label: value, 미기재
 * kept), and the title carries the site's map icon. */
export function createMapFeaturePopupV148(input: {
  elementId: string; selectionKey: string; title: string; dataset: string;
  primary: boolean; facts: MapFactV148[]; source: string; note?: string;
  rows?: MapPopupRowV152[];
  /** Trusted markup from mapIconsV152 (never data). */
  iconSvg?: string;
}): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "map148-popup";
  root.dataset.testid = "map-hover-popup-v133";
  root.dataset.elementId = input.elementId;
  root.dataset.selectionKey = input.selectionKey;
  root.dataset.layerRole = input.primary ? "primary" : "context";
  const label = document.createElement("small");
  // V173: the analysis layer's popup names its dataset only; a context layer
  // still says it is shown alongside ("함께 보기"). "주 분석" was an internal role word.
  label.textContent = input.primary ? input.dataset : `함께 보기 · ${input.dataset}`;
  const title = document.createElement("strong");
  if (input.iconSvg) {
    const icon = document.createElement("span");
    icon.className = "map148-popup__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = input.iconSvg;
    title.appendChild(icon);
  }
  title.appendChild(document.createTextNode(input.title));
  root.append(label, title);
  const facts = document.createElement("dl");
  if (input.elementId === "A-023") facts.dataset.testid = "a023-map-tooltip-v132";
  if (input.rows?.length) {
    facts.className = "map148-popup__card";
    facts.dataset.card = "facility-v153";
    // V174: a card without a source row still states its source, as a row.
    const cardRows = input.rows.some((row) => row.key === "source") || !input.source
      ? input.rows
      : [...input.rows, { key: "source", label: "출처", value: input.source, missing: false }];
    cardRows.forEach((row) => {
      const dt = document.createElement("dt"); dt.textContent = row.label;
      const dd = document.createElement("dd"); dd.textContent = row.value;
      if (row.missing) dd.dataset.missing = "true";
      facts.append(dt, dd);
    });
  } else {
    // V174: the same label·value card as a facility, with the source as a row.
    facts.className = "map148-popup__card";
    const factRows = [
      ...input.facts.slice(0, 4).map((fact) => ({ label: fact.label, value: fact.value })),
      ...(input.source ? [{ label: "출처", value: input.source }] : []),
    ];
    factRows.forEach((row) => {
      const dt = document.createElement("dt"); dt.textContent = row.label;
      const dd = document.createElement("dd"); dd.textContent = row.value;
      facts.append(dt, dd);
    });
  }
  root.append(facts);
  if (input.note) {
    const note = document.createElement("small"); note.textContent = input.note; root.append(note);
  }
  return root;
}
