import type { MapOverlapSummaryV145 } from "../../data/map/publicMapOverlapV145";
import { tokenizePublicTermsV134 } from "../../utils/publicTermTokenizerV134";

/** DOM text only: feature names are data, never popup markup. */
export function createMapOverlapPopupV145(summaries: MapOverlapSummaryV145[]): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "cdp-map-overlap-summary-v145";
  root.dataset.testid = "map-hover-popup-v133";
  root.setAttribute("role", "status");
  const append = (parent: HTMLElement, tag: string, text: string, className?: string) => {
    if (!text) return;
    const node = document.createElement(tag);
    tokenizePublicTermsV134(text, { firstOccurrenceOnly: false }).forEach((token) => {
      if (token.type === "text") {
        node.appendChild(document.createTextNode(token.value));
      } else {
        const term = document.createElement("span");
        term.dataset.publicTermV134 = token.entry.id;
        term.dataset.publicTermMode = "visible-expansion";
        term.appendChild(document.createTextNode(token.value));
        const expansion = document.createElement("span");
        expansion.dataset.publicTermExpansionV134 = "true";
        expansion.className = "public-term-visible-expansion-v134";
        expansion.textContent = `(${token.entry.koreanName})`;
        term.appendChild(expansion);
        node.appendChild(term);
      }
    });
    if (className) node.className = className;
    parent.appendChild(node);
  };
  summaries.slice(0, 3).forEach((summary, index) => {
    const section = document.createElement("section");
    section.dataset.layerRole = summary.role;
    section.dataset.elementId = summary.elementId;
    section.dataset.selectionKey = summary.selectionKey;
    if (index === 0 || summary.role !== summaries[index - 1].role) {
      append(section, "small", summary.role === "primary" ? "주 분석" : "함께 보기", "cdp-map-overlap-role-v145");
    }
    append(section, "strong", summary.title);
    append(section, "b", summary.value, "cdp-map-overlap-value-v145");
    if (index === 0) {
      append(section, "span", summary.place);
      append(section, "small", summary.context);
    } else {
      append(section, "small", [summary.place, summary.context].filter(Boolean).join(" · "));
    }
    summary.facts.slice(0, index === 0 ? 2 : 1).forEach((fact) => append(section, "small", fact));
    root.appendChild(section);
  });
  if (summaries.length > 3) append(root, "small", `다른 항목 ${summaries.length - 3}개 · 클릭하여 전체 보기`);
  return root;
}
