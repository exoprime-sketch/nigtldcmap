import { useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import {
  AXIS_BLOCK_TYPES_V153,
  visualizationContractV153,
} from "../../../data/visualization/publicVisualizationContractV153";
import type {
  AnalysisBlockTypeV153,
  VisualizationContractRowV153,
} from "../../../data/visualization/publicVisualizationContractV153";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";
import { AnalysisContractContextV153 } from "./analysisContractContextV153";

/**
 * V153-D1: the frame around the analysis router.
 *
 * It provides the dataset's contract to the renderers, and after every commit
 * it reads the primary section back: the top-level `[data-analysis-block]`
 * elements get `data-analysis-rank` in DOM order, the wrappers between the
 * first block and the primary section get `data-dl153-flat` (so the layout
 * stylesheet can put the map beside the first block), and the frame records
 * whether the first block is the one the contract declares. The frame only
 * writes attributes React does not manage; it never moves a node.
 */
interface Props {
  elementId: string;
  children: ReactNode;
}

const PRIMARY_SELECTOR = '[data-testid="public-analysis-primary"]';
const BLOCK_SELECTOR = "[data-analysis-block]";
const MAP_SLOT_CLASS = "dl153-map-slot";

type Verdict = "match" | "mismatch" | "untagged" | "none";
type AxesVerdict = "match" | "mismatch" | "missing" | "not-applicable";

function normalizeAxisLabel(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\([^)]*\)/gu, "")
    .replace(/[\s·,]+/gu, "")
    .toLowerCase();
}

function axisLabelMatches(contractLabel: string | null, screenLabel: string | null): boolean {
  const expected = normalizeAxisLabel(contractLabel);
  const actual = normalizeAxisLabel(screenLabel);
  if (!expected || !actual) return expected === actual;
  return expected === actual || actual.includes(expected) || expected.includes(actual);
}

function unitMatches(contractUnit: string | null, screenUnit: string | null): boolean {
  const expected = displayUnitV150(contractUnit || "") || "";
  const actual = String(screenUnit || "");
  if (actual === "unreported") return expected === "" || expected === "원자료 미기재";
  return expected === actual;
}

/** The block's own axes, or the axes stated directly above it (the V150 convention). */
export function axesOfBlockV153(block: Element | null): HTMLElement | null {
  if (!block) return null;
  const inside = block.querySelector<HTMLElement>(".chart-axes-v150");
  if (inside) return inside;
  const previous = block.previousElementSibling;
  return previous instanceof HTMLElement && previous.classList.contains("chart-axes-v150") ? previous : null;
}

export function judgeFirstBlockV153(
  contract: VisualizationContractRowV153 | null,
  firstBlockType: string | null
): Verdict {
  if (!contract) return "none";
  if (!firstBlockType) return "untagged";
  return firstBlockType === contract.primary.type ? "match" : "mismatch";
}

export function judgeAxesV153(
  contract: VisualizationContractRowV153 | null,
  axes: { x: string | null; y: string | null; unit: string | null } | null
): AxesVerdict {
  if (!contract || !AXIS_BLOCK_TYPES_V153.includes(contract.primary.type)) return "not-applicable";
  if (!axes) return "missing";
  const ok =
    axisLabelMatches(contract.primary.xAxis, axes.x) &&
    axisLabelMatches(contract.primary.yAxis, axes.y) &&
    unitMatches(contract.primary.unit, axes.unit);
  return ok ? "match" : "mismatch";
}

export default function DetailAnalysisFrameV153({ elementId, children }: Props) {
  const contract = useMemo(() => visualizationContractV153(elementId), [elementId]);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const ranked = new Set<Element>();
    const flattened = new Set<Element>();
    let warned: string | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const primary = root.querySelector<HTMLElement>(PRIMARY_SELECTOR);
      if (!primary) return;
      const slot = Array.from(primary.children).find((child) => child.classList.contains(MAP_SLOT_CLASS)) || null;
      const blocks = Array.from(primary.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter(
        (block) =>
          !block.parentElement?.closest(BLOCK_SELECTOR) &&
          !(slot && slot.contains(block))
      );
      // Ranks: DOM order among top-level blocks; stale ranks are cleared.
      const nextRanked = new Set<Element>();
      blocks.forEach((block, index) => {
        const rank = String(index + 1);
        if (block.getAttribute("data-analysis-rank") !== rank) block.setAttribute("data-analysis-rank", rank);
        nextRanked.add(block);
      });
      ranked.forEach((block) => {
        if (!nextRanked.has(block)) block.removeAttribute("data-analysis-rank");
      });
      ranked.clear();
      nextRanked.forEach((block) => ranked.add(block));
      // Flatten the wrappers between the first block and the primary section
      // so the first block and the map slot share one grid.
      const first = blocks[0] || null;
      const nextFlat = new Set<Element>();
      if (first && slot) {
        let cursor = first.parentElement;
        while (cursor && cursor !== primary) {
          nextFlat.add(cursor);
          cursor = cursor.parentElement;
        }
        if (cursor !== primary) nextFlat.clear();
      }
      nextFlat.forEach((wrapper) => {
        if (!wrapper.hasAttribute("data-dl153-flat")) wrapper.setAttribute("data-dl153-flat", "");
      });
      flattened.forEach((wrapper) => {
        if (!nextFlat.has(wrapper)) wrapper.removeAttribute("data-dl153-flat");
      });
      flattened.clear();
      nextFlat.forEach((wrapper) => flattened.add(wrapper));
      const split = Boolean(first && slot);
      if (split) {
        if (!primary.hasAttribute("data-dl153-split")) primary.setAttribute("data-dl153-split", "");
      } else if (primary.hasAttribute("data-dl153-split")) {
        primary.removeAttribute("data-dl153-split");
      }
      // The verdicts the QA reads, and a console warning for a mismatch.
      const firstType = (first?.getAttribute("data-analysis-block") as AnalysisBlockTypeV153 | null) || null;
      const verdict = judgeFirstBlockV153(contract, firstType);
      const axesNode = axesOfBlockV153(first);
      const axes = axesNode
        ? {
            x: axesNode.getAttribute("data-x-axis"),
            y: axesNode.getAttribute("data-y-axis"),
            unit: axesNode.getAttribute("data-unit"),
          }
        : null;
      const axesVerdict = judgeAxesV153(contract, axes);
      root.setAttribute("data-contract-verdict", verdict);
      root.setAttribute("data-contract-axes", axesVerdict);
      root.setAttribute("data-contract-first-block", firstType || "none");
      root.setAttribute("data-contract-block-count", String(blocks.length));
      const message =
        verdict === "mismatch"
          ? `[v153-contract] ${elementId}: first block "${firstType}" ≠ contract "${contract?.primary.type}"`
          : verdict === "untagged"
          ? `[v153-contract] ${elementId}: no tagged analysis block (contract "${contract?.primary.type}")`
          : axesVerdict === "mismatch"
          ? `[v153-contract] ${elementId}: axes ${JSON.stringify(axes)} ≠ contract ${JSON.stringify({ x: contract?.primary.xAxis, y: contract?.primary.yAxis, unit: contract?.primary.unit })}`
          : null;
      if (message && warned !== message) {
        warned = message;
        console.warn(message);
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };
    apply();
    const observer = new MutationObserver((mutations) => {
      // Tooltip churn inside a block does not change the block list.
      const relevant = mutations.some((mutation) => {
        const target = mutation.target as Element;
        if (!(target instanceof Element)) return true;
        if (!target.closest(BLOCK_SELECTOR)) return true;
        return Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes)).some(
          (node) => node instanceof Element && (node.matches(BLOCK_SELECTOR) || node.querySelector(BLOCK_SELECTOR) !== null)
        );
      });
      if (relevant) schedule();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      ranked.forEach((block) => block.removeAttribute("data-analysis-rank"));
      flattened.forEach((wrapper) => wrapper.removeAttribute("data-dl153-flat"));
      root.querySelector(PRIMARY_SELECTOR)?.removeAttribute("data-dl153-split");
      root.removeAttribute("data-contract-verdict");
      root.removeAttribute("data-contract-axes");
    };
  }, [contract, elementId]);

  return (
    <AnalysisContractContextV153.Provider value={contract}>
      <div
        ref={rootRef}
        className="dl153-frame"
        data-testid="detail-analysis-frame-v153"
        data-contract-element={elementId}
        data-contract-archetype={contract?.archetype || "none"}
        data-contract-primary={contract?.primary.type || "none"}
        data-contract-status={contract?.status || "none"}
      >
        {children}
      </div>
    </AnalysisContractContextV153.Provider>
  );
}
