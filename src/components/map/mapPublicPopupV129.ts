/**
 * V152: the public hover popup for area, line and cluster features (V129),
 * shared by the big map and the mini map (moved from RealMapExplorerPage).
 * Glossary terms are expanded inline; no HTML from data.
 */
import { tokenizePublicTermsV134 } from "../../utils/publicTermTokenizerV134";
import { parseMemberSummaryV151 } from "../../data/map/boundaryPolicyV151";
import { formatPublicNumberV126 } from "../../data/visualization/publicNumberFormatV126";
import { publicTextV126 } from "../../data/visualization/publicFieldPolicyV126";

export function createPublicMapPopupContentV129(
  title: string,
  lines: string[],
  options?: {
    attributes?: Record<string, string>;
    legacyTestId?: string;
    testId?: string;
  }
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "cdp-map-public-popup";
  if (options?.testId) root.setAttribute("data-testid", options.testId);
  Object.entries(options?.attributes || {}).forEach(([name, value]) => {
    root.setAttribute(`data-${name}`, value);
  });
  const appendPublicText = (node: HTMLElement, value: string) => {
    tokenizePublicTermsV134(value, { firstOccurrenceOnly: false }).forEach(
      (token) => {
        if (token.type === "text") {
          node.appendChild(document.createTextNode(token.value));
          return;
        }
        const term = document.createElement("span");
        term.setAttribute("data-public-term-v134", token.entry.id);
        term.setAttribute("data-public-term-mode", "visible-expansion");
        term.appendChild(document.createTextNode(token.value));
        const expansion = document.createElement("span");
        expansion.className = "public-term-visible-expansion-v134";
        expansion.setAttribute("data-public-term-expansion-v134", "true");
        expansion.textContent = `(${token.entry.koreanName})`;
        term.appendChild(expansion);
        node.appendChild(term);
      }
    );
  };
  const heading = document.createElement("strong");
  appendPublicText(heading, title);
  root.appendChild(heading);
  lines.filter(Boolean).slice(0, 5).forEach((line) => {
    const row = document.createElement("span");
    appendPublicText(row, line);
    root.appendChild(row);
  });
  if (options?.legacyTestId) {
    const legacyContract = document.createElement("span");
    legacyContract.hidden = true;
    legacyContract.setAttribute("aria-hidden", "true");
    legacyContract.setAttribute("data-testid", options.legacyTestId);
    Object.entries(options.attributes || {}).forEach(([name, value]) => {
      legacyContract.setAttribute(`data-${name}`, value);
    });
    legacyContract.textContent = [title, ...lines.filter(Boolean)].join(" ");
    root.appendChild(legacyContract);
  }
  return root;
}

/**
 * V151-2: the popup line that explains a value under the 34-unit outline.
 * Aggregated feature: "구성 n개 중 m개 값 있음 · min~max[ · 부분 결측]".
 * Range-only province: its parent unit and the spread of the sibling values.
 */
export function boundaryPopupLineV151(properties: Record<string, unknown>, unit: string): string {
  const format = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? formatPublicNumberV126(value, unit) : "결측";
  const summary = parseMemberSummaryV151(properties.memberSummary);
  if (summary) {
    const single = summary.memberCount === 1;
    const range =
      summary.valueCount > 1 && summary.min !== null && summary.max !== null && summary.min !== summary.max
        ? ` · 구성 범위 ${format(summary.min)}~${format(summary.max)}${unit ? ` ${unit}` : ""}`
        : "";
    const coverage = single
      ? ""
      : summary.valueCount === summary.memberCount
        ? `구성 ${summary.memberCount}개 성·시`
        : `구성 ${summary.memberCount}개 성·시 중 ${summary.valueCount}개 값 있음`;
    const flags = summary.partial ? " · 부분 결측" : summary.conflict ? " · 구성 값 불일치" : "";
    switch (summary.kind) {
      case "native-34":
        return `개편 후 34개 기준 원자료 값${single ? "" : ` · ${coverage}`}${flags}`;
      case "sum":
        return single ? "개편에서 합쳐지지 않은 성·시" : `${coverage} 합계${range}${flags}`;
      case "count-sum":
        return single ? "" : `${coverage} 문서 수 합계${flags}`;
      case "membership-or":
        return single ? "" : `${coverage} 중 참여 ${summary.valueCount}개${flags}`;
      case "area-weighted-mean":
        return single ? "개편에서 합쳐지지 않은 성·시" : `${coverage} 면적가중평균${range}${flags}`;
      default:
        return single ? "" : `${coverage}${range}${flags}`;
    }
  }
  const parentName = publicTextV126(properties.parentUnitName);
  if (parentName && properties.policyKind === "range-only") {
    const count = Number(properties.parentValueCount || 0);
    const total = Number(properties.parentMemberCount || 0);
    if (!count) return `${parentName}(34개 기준) · 구성 성·시 값 없음`;
    return `${parentName}(34개 기준) 구성 범위 ${format(properties.parentMin)}~${format(properties.parentMax)}${
      unit ? ` ${unit}` : ""
    } · ${total}개 중 ${count}개 값`;
  }
  return "";
}
