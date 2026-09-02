import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  resolvePublicTermV134,
  tokenizePublicTermsV134,
} from "../../utils/publicTermTokenizerV134";
import type {
  PublicTermTokenV134,
  ResolvedPublicTermV134,
} from "../../utils/publicTermTokenizerV134";
import { publicTextV126 } from "../../data/visualization/publicFieldPolicyV126";
import PublicTermTooltipV134 from "./PublicTermTooltipV134";
import "./public-term-v134.css";

type PublicTermOpenModeV134 = "hover" | "focus" | "pinned" | null;

export interface PublicTermV134Props {
  entry?: ResolvedPublicTermV134;
  term?: string;
  children?: ReactNode;
  className?: string;
}

interface TooltipPositionV134 {
  left: number;
  top: number;
  width: number;
  placement: "above" | "below";
}

export default function PublicTermV134({
  entry: entryProp,
  term,
  children,
  className = "",
}: PublicTermV134Props) {
  const visibleValue = term ?? (typeof children === "string" ? children : "");
  const entry = entryProp ?? resolvePublicTermV134(visibleValue);
  const [openMode, setOpenMode] = useState<PublicTermOpenModeV134>(null);
  const [position, setPosition] = useState<TooltipPositionV134 | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const suppressNextFocusRef = useRef(false);
  const tooltipId = `public-term-${useId().replace(/:/g, "")}`;
  const open = Boolean(openMode && entry);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeIfTransient = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMode((current) => (current === "pinned" ? current : null));
    }, 80);
  }, [clearCloseTimer]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 9;
    const width = Math.min(340, Math.max(240, window.innerWidth - 24));
    const measuredHeight = tooltipRef.current?.getBoundingClientRect().height || 210;
    const roomBelow = window.innerHeight - triggerRect.bottom;
    const placement =
      roomBelow >= measuredHeight + gap + viewportPadding ? "below" : "above";
    const idealLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const left = Math.min(
      window.innerWidth - width - viewportPadding,
      Math.max(viewportPadding, idealLeft)
    );
    const top =
      placement === "below"
        ? Math.min(
            window.innerHeight - measuredHeight - viewportPadding,
            triggerRect.bottom + gap
          )
        : Math.max(viewportPadding, triggerRect.top - measuredHeight - gap);
    setPosition({ left, top, width, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleViewportChange = () => updatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenMode(null);
      if (document.activeElement !== triggerRef.current) {
        suppressNextFocusRef.current = true;
        triggerRef.current?.focus();
        window.queueMicrotask(() => {
          suppressNextFocusRef.current = false;
        });
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }
      setOpenMode(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer]
  );

  if (!entry) return <>{children ?? term}</>;

  const tooltipStyle: CSSProperties = position
    ? {
        left: position.left,
        top: position.top,
        width: position.width,
        visibility: "visible",
      }
    : { left: 0, top: 0, visibility: "hidden" };

  return (
    <>
      <button
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        aria-label={`${visibleValue || entry.term}: ${entry.koreanName}. 용어 설명`}
        className={`public-term-v134 ${className}`.trim()}
        data-public-term-v134={entry.id}
        data-public-term-mode="tooltip"
        onBlur={(event) => {
          closeIfTransient();
        }}
        onClick={() => {
          clearCloseTimer();
          setOpenMode((current) => (current === "pinned" ? null : "pinned"));
        }}
        onFocus={() => {
          if (suppressNextFocusRef.current) {
            suppressNextFocusRef.current = false;
            return;
          }
          clearCloseTimer();
          setOpenMode((current) =>
            current === "pinned" ? current : "focus"
          );
        }}
        onMouseEnter={() => {
          clearCloseTimer();
          setOpenMode((current) =>
            current === "pinned" ? current : "hover"
          );
        }}
        onMouseLeave={closeIfTransient}
        onPointerEnter={(event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          clearCloseTimer();
          setOpenMode((current) =>
            current === "pinned" ? current : "hover"
          );
        }}
        onPointerLeave={(event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          closeIfTransient();
        }}
        ref={triggerRef}
        type="button"
      >
        {children ?? term ?? entry.displayTerm ?? entry.term}
      </button>
      {open &&
        createPortal(
          <PublicTermTooltipV134
            entry={entry}
            id={tooltipId}
            onPointerEnter={clearCloseTimer}
            onPointerLeave={closeIfTransient}
            ref={tooltipRef}
            style={tooltipStyle}
          />,
          document.body
        )}
    </>
  );
}

export interface PublicTermTextV134Props {
  text: string;
  className?: string;
  firstOccurrenceOnly?: boolean;
}

/** Safe opt-in wrapper for a text node; never use it for attributes or raw files. */
export function PublicTermTextV134({
  text,
  className,
  firstOccurrenceOnly = false,
}: PublicTermTextV134Props) {
  const tokens = tokenizePublicTermsV134(publicTextV126(text) || "", {
    firstOccurrenceOnly,
  });
  return (
    <>
      {tokens.map((token, index) =>
        token.type === "text" ? (
          <span key={`text-${index}`}>{token.value}</span>
        ) : (
          <PublicTermV134
            className={className}
            entry={token.entry}
            key={`term-${token.entry.id}-${index}`}
          >
            {token.value}
          </PublicTermV134>
        )
      )}
    </>
  );
}

/**
 * Visible expansion for content that cannot contain another interactive
 * control (for example a button label or an already-open chart tooltip).
 * The Korean meaning is rendered in the public text itself; native `title`
 * is deliberately not used as the only explanation.
 */
export function PublicTermExpandedTextV134({
  text,
  className,
  firstOccurrenceOnly = false,
}: PublicTermTextV134Props) {
  const tokens = tokenizePublicTermsV134(publicTextV126(text) || "", {
    firstOccurrenceOnly,
  });
  return (
    <>
      {tokens.map((token, index) =>
        token.type === "text" ? (
          <span key={`text-${index}`}>{token.value}</span>
        ) : (
          <span
            className={className}
            data-public-term-v134={token.entry.id}
            data-public-term-mode="visible-expansion"
            key={`term-${token.entry.id}-${index}`}
          >
            {token.value}
            <span
              className="public-term-visible-expansion-v134"
              data-public-term-expansion-v134="true"
            >
              ({token.entry.koreanName})
            </span>
          </span>
        )
      )}
    </>
  );
}

/** Adjacent help triggers for native selects and other controls that cannot nest buttons. */
export function PublicTermHelpV134({ text }: { text: string }) {
  const terms = tokenizePublicTermsV134(publicTextV126(text) || "", {
    firstOccurrenceOnly: true,
  })
    .filter((token): token is Extract<PublicTermTokenV134, { type: "term" }> => token.type === "term");
  if (terms.length === 0) return null;
  return (
    <span className="public-term-help-v134" aria-label="현재 선택값 용어 도움말">
      <span>용어 도움말</span>
      {terms.map((token) => (
        <PublicTermV134 entry={token.entry} key={token.entry.id} term={token.value}>
          <span aria-hidden="true">?</span>
          <span className="sr-only">{token.value} 설명</span>
        </PublicTermV134>
      ))}
    </span>
  );
}
