import type { MapFactV148 } from "../../data/map/mapPresentationV148";

/** A hover is a short record summary. No HTML from data and no hidden duplicate
 * transcript: the visible record itself is the accessibility/test contract. */
export function createMapFeaturePopupV148(input: {
  elementId: string; selectionKey: string; title: string; dataset: string;
  primary: boolean; facts: MapFactV148[]; source: string; note?: string;
}): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "map148-popup";
  root.dataset.testid = "map-hover-popup-v133";
  root.dataset.elementId = input.elementId;
  root.dataset.selectionKey = input.selectionKey;
  root.dataset.layerRole = input.primary ? "primary" : "context";
  const label = document.createElement("small");
  label.textContent = `${input.primary ? "주 분석" : "함께 보기"} · ${input.dataset}`;
  const title = document.createElement("strong");
  title.textContent = input.title;
  root.append(label, title);
  const facts = document.createElement("dl");
  if (input.elementId === "A-023") facts.dataset.testid = "a023-map-tooltip-v132";
  input.facts.slice(0, 3).forEach((fact) => {
    const dt = document.createElement("dt"); dt.textContent = fact.label;
    const dd = document.createElement("dd"); dd.textContent = fact.value;
    facts.append(dt, dd);
  });
  root.append(facts);
  for (const text of [input.note, input.source]) {
    if (!text) continue;
    const note = document.createElement("small"); note.textContent = text; root.append(note);
  }
  return root;
}
