import { useEffect, useState } from "react";
import {
  GLOSSARY_ALIASES_V74,
} from "../../utils/climateGlossaryV74";
import type {
  GlossaryEntryV74,
} from "../../utils/climateGlossaryV74";
import "../../styles/glossary-v74.css";

interface Props {
  scopeSelector: string;
}

interface TooltipState {
  entry: GlossaryEntryV74;
  x: number;
  y: number;
}

type LegacyCaretDocument = {
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
  caretPositionFromPoint?: (
    x: number,
    y: number
  ) => { offsetNode: Node; offset: number } | null;
};

const EXCLUDED = new Set([
  "SCRIPT",
  "STYLE",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "CODE",
  "PRE",
]);

export default function GlossaryHoverLayerV74({ scopeSelector }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let frame = 0;

    function hide() {
      setTooltip(null);
    }

    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scope = document.querySelector(scopeSelector);
        if (!scope) {
          hide();
          return;
        }

        const target = event.target;
        if (!(target instanceof Node) || !scope.contains(target)) {
          hide();
          return;
        }

        const hit = findGlossaryHit(event.clientX, event.clientY, scope);

        if (!hit) {
          hide();
          return;
        }

        const maxWidth = 380;
        const estimatedHeight = 235;
        const x = Math.max(
          12,
          Math.min(event.clientX + 16, window.innerWidth - maxWidth - 12)
        );
        const y = Math.max(
          12,
          Math.min(
            event.clientY + 18,
            window.innerHeight - estimatedHeight - 12
          )
        );

        setTooltip({ entry: hit, x, y });
      });
    }

    document.addEventListener("pointermove", onMove, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, [scopeSelector]);

  if (!tooltip) return null;

  return (
    <aside
      className="v74-glossary-tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="v74-glossary-heading">
        <strong>{tooltip.entry.term}</strong>
        <span>{tooltip.entry.korean}</span>
      </div>
      <small>{tooltip.entry.english}</small>
      <ul>
        {tooltip.entry.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <footer>전문용어 · 마우스 오버 설명</footer>
    </aside>
  );
}

function findGlossaryHit(
  x: number,
  y: number,
  scope: Element
): GlossaryEntryV74 | null {
  const doc = document as unknown as LegacyCaretDocument;
  let node: Node | null = null;
  let offset = 0;

  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    node = range?.startContainer ?? null;
    offset = range?.startOffset ?? 0;
  } else if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    node = position?.offsetNode ?? null;
    offset = position?.offset ?? 0;
  }

  if (!node || node.nodeType !== Node.TEXT_NODE) return null;

  const parent = node.parentElement;
  if (!parent || !scope.contains(parent)) return null;
  if (EXCLUDED.has(parent.tagName)) return null;
  if (parent.closest("[data-v74-no-glossary='true']")) return null;

  const text = node.textContent ?? "";
  if (!text.trim()) return null;

  for (const { alias, entry } of GLOSSARY_ALIASES_V74) {
    const ranges = findAliasRanges(text, alias);
    for (const [start, end] of ranges) {
      if (offset >= start && offset <= end) {
        return entry;
      }
    }
  }

  return null;
}

function findAliasRanges(text: string, alias: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const lowerText = text.toLocaleLowerCase();
  const lowerAlias = alias.toLocaleLowerCase();
  let cursor = 0;

  while (cursor <= lowerText.length - lowerAlias.length) {
    const index = lowerText.indexOf(lowerAlias, cursor);
    if (index < 0) break;

    const end = index + alias.length;
    if (hasValidBoundary(text, alias, index, end)) {
      ranges.push([index, end]);
    }
    cursor = index + Math.max(alias.length, 1);
  }

  return ranges;
}

function hasValidBoundary(
  text: string,
  alias: string,
  start: number,
  end: number
): boolean {
  const startsAlphaNum = /^[A-Za-z0-9]/.test(alias);
  const endsAlphaNum = /[A-Za-z0-9]$/.test(alias);
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";

  if (startsAlphaNum && /[A-Za-z0-9]/.test(before)) return false;
  if (endsAlphaNum && /[A-Za-z0-9]/.test(after)) return false;
  return true;
}
