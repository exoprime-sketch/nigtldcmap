import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCountryRegistryV165 } from "../../data/countries/useCountryRegistryV165";
import type { RegistryViewV165 } from "../../data/countries/useCountryRegistryV165";
import { loadCatalogForCountrySelectionV122 } from "../../data/countries/countryDataFacadeV122";
import {
  countryPickerModelV165,
  filterCountryGroupsV165,
  nextCountryByTypeAheadV165,
} from "../../data/countries/countryPickerModelV165";
import type {
  CountryPickerEntryV165,
  CountryPickerVariantV165,
} from "../../data/countries/countryPickerModelV165";
import "../../styles/country-picker-v165.css";

const EMPTY_REGISTRY_V165: RegistryViewV165 = { countries: [] };

const itemCountCacheV165 = new Map<string, Promise<number>>();

/**
 * The country whose segmented button was just used. The home and the guide
 * are mounted again for the new country, so the button that had the focus is
 * a new element; the new picker takes the focus back once.
 */
let focusSegmentAfterChangeV165: string | null = null;

/**
 * The public item count of each country, the number its home shows ("전체
 * 데이터 항목"): the length of the same filtered catalog. Read when first
 * needed and kept; nothing is written into the registry by hand.
 */
function useItemCountsV165(iso3s: string[], enabled: boolean): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = iso3s.join(",");
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    key.split(",").filter(Boolean).forEach((iso3) => {
      let request = itemCountCacheV165.get(iso3);
      if (!request) {
        request = loadCatalogForCountrySelectionV122(iso3).then((catalog) => catalog.length);
        itemCountCacheV165.set(iso3, request);
        request.catch(() => itemCountCacheV165.delete(iso3));
      }
      void request
        .then((count) => {
          if (alive) setCounts((current) => (current[iso3] === count ? current : { ...current, [iso3]: count }));
        })
        .catch(() => undefined);
    });
    return () => {
      alive = false;
    };
  }, [key, enabled]);
  return counts;
}

export interface CountryPickerV165Props {
  /** The country now shown; null before one is known. */
  value: string | null;
  onChange: (iso3: string) => void;
  /** "header": a button and a list at every count; "inline": one button per country up to four. */
  variant: CountryPickerVariantV165;
  className?: string;
  /** The words before the control ("국가"); the header shows none. */
  label?: string;
}

/**
 * V165: the one country picker (header, home, guide). Its shape follows the
 * number of public countries in the registry (see countryPickerModelV165). The
 * whole control - its list included, even while closed - carries
 * `data-country-picker`: it names every country by design, so the
 * other-country wording audits leave it out. It also carries the selector mark
 * (`data-country-selector="v162"`) the acceptance gate reads: every public
 * country is named inside it.
 */
export default function CountryPickerV165({ value, onChange, variant, className, label }: CountryPickerV165Props) {
  const loadedRegistry = useCountryRegistryV165();
  const registry = loadedRegistry || EMPTY_REGISTRY_V165;
  const model = useMemo(() => countryPickerModelV165(registry, variant), [registry, variant]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIso3, setActiveIso3] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typedRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  const baseId = useId().replace(/:/gu, "");
  const listId = `country-picker-${baseId}-list`;
  const optionId = (iso3: string) => `country-picker-${baseId}-${iso3}`;

  const liveIso3s = model.live.map((entry) => entry.iso3);
  const counts = useItemCountsV165(liveIso3s, model.mode === "segmented" || open);
  const current = model.live.find((entry) => entry.iso3 === value) || null;

  const groups = useMemo(() => filterCountryGroupsV165(model.groups, query), [model.groups, query]);
  const flat = useMemo(() => groups.flatMap((group) => group.countries), [groups]);
  const selectable = useMemo(() => flat.filter((entry) => entry.live), [flat]);

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    setQuery("");
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    setActiveIso3((currentActive) => currentActive || current?.iso3 || selectable[0]?.iso3 || null);
    const frame = window.requestAnimationFrame(() => {
      (model.searchable ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
    // Focus moves once, when the list opens.
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!open || !activeIso3) return;
    document.getElementById(optionId(activeIso3))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from a stable id.
    // eslint-disable-next-line
  }, [open, activeIso3]);

  useEffect(() => {
    if (model.mode !== "segmented" || !value || focusSegmentAfterChangeV165 !== value) return;
    focusSegmentAfterChangeV165 = null;
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-iso3="${value}"]`)?.focus({ preventScroll: true });
  }, [model.mode, value]);

  const choose = (iso3: string) => {
    const entry = flat.find((row) => row.iso3 === iso3);
    if (!entry || !entry.live) return;
    close(true);
    // Always reported: where the screen offers "전체", the header shows the
    // last country, and picking that one applies it.
    onChange(iso3);
  };

  const moveActive = (step: 1 | -1 | "first" | "last") => {
    if (selectable.length === 0) return;
    const index = selectable.findIndex((entry) => entry.iso3 === activeIso3);
    const next =
      step === "first"
        ? 0
        : step === "last"
          ? selectable.length - 1
          : Math.min(selectable.length - 1, Math.max(0, (index < 0 ? -1 : index) + step));
    setActiveIso3(selectable[next]?.iso3 || null);
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveActive("first");
    } else if (event.key === "End") {
      event.preventDefault();
      moveActive("last");
    } else if (event.key === "Enter" || (event.key === " " && event.currentTarget === listRef.current)) {
      event.preventDefault();
      if (activeIso3) choose(activeIso3);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    } else if (event.currentTarget === listRef.current && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      const now = Date.now();
      const text = now - typedRef.current.at < 600 ? typedRef.current.text + event.key : event.key;
      typedRef.current = { text, at: now };
      const hit = nextCountryByTypeAheadV165(flat, text, text.length > 1 ? null : activeIso3);
      if (hit) setActiveIso3(hit);
    }
  };

  const rootClass = ["country-picker-v165", `country-picker-v165--${variant}`, `country-picker-v165--${model.mode}`, className]
    .filter(Boolean)
    .join(" ");

  if (!loadedRegistry) {
    // Until the registry is read: the place is kept, nothing is named.
    return <div className={`${rootClass} country-picker-v165--loading`} data-testid="country-picker-v165" data-mode="loading" aria-hidden="true" />;
  }

  if (model.mode === "single") {
    return (
      <div className={rootClass} data-country-picker="true" data-country-selector="v162" data-testid="country-picker-v165" data-mode="single">
        {label ? <span className="country-picker-v165__label">{label}</span> : null}
        <strong className="country-picker-v165__single">{current?.nameKo || model.live[0]?.nameKo || ""}</strong>
      </div>
    );
  }

  if (model.mode === "segmented") {
    const index = model.live.findIndex((entry) => entry.iso3 === value);
    const onRadioKey = (event: ReactKeyboardEvent<HTMLButtonElement>, at: number) => {
      const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const next = model.live[(at + step + model.live.length) % model.live.length];
      if (!next) return;
      focusSegmentAfterChangeV165 = next.iso3;
      onChange(next.iso3);
      window.requestAnimationFrame(() =>
        rootRef.current?.querySelector<HTMLButtonElement>(`[data-iso3="${next.iso3}"]`)?.focus()
      );
    };
    return (
      <div ref={rootRef} className={rootClass} data-country-picker="true" data-country-selector="v162" data-testid="country-picker-v165" data-mode="segmented">
        {label ? (
          <span className="country-picker-v165__label" id={`country-picker-${baseId}-label`}>
            {label}
          </span>
        ) : null}
        <div
          className="country-picker-v165__segments"
          role="radiogroup"
          aria-label={label ? undefined : "국가 선택"}
          aria-labelledby={label ? `country-picker-${baseId}-label` : undefined}
        >
          {model.live.map((entry, at) => {
            const checked = entry.iso3 === value;
            return (
              <button
                key={entry.iso3}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked || (index < 0 && at === 0) ? 0 : -1}
                data-iso3={entry.iso3}
                aria-label={typeof counts[entry.iso3] === "number" ? `${entry.nameKo}, 데이터 ${counts[entry.iso3]}개` : undefined}
                className={checked ? "country-picker-v165__segment is-selected" : "country-picker-v165__segment"}
                onClick={() => {
                  if (checked) return;
                  focusSegmentAfterChangeV165 = entry.iso3;
                  onChange(entry.iso3);
                }}
                onKeyDown={(event) => onRadioKey(event, at)}
              >
                <span>{entry.nameKo}</span>
                {typeof counts[entry.iso3] === "number" ? <small aria-hidden="true">{counts[entry.iso3]}</small> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeDescendant = open && activeIso3 ? optionId(activeIso3) : undefined;
  return (
    <div ref={rootRef} className={rootClass} data-country-picker="true" data-country-selector="v162" data-testid="country-picker-v165" data-mode="list" data-open={open ? "true" : "false"}>
      {label ? <span className="country-picker-v165__label">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className="country-picker-v165__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`국가 선택, 현재 ${current?.nameKo || "선택 안 됨"}`}
        data-testid="country-picker-trigger-v165"
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{current?.nameKo || "국가 선택"}</span>
        <i aria-hidden="true">▾</i>
      </button>
      <div className="country-picker-v165__popover" hidden={!open}>
        {model.searchable ? (
          <input
            ref={searchRef}
            className="country-picker-v165__search"
            type="search"
            value={query}
            placeholder="국가 이름 검색"
            aria-label="국가 이름 검색"
            aria-controls={listId}
            aria-activedescendant={activeDescendant}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIso3(null);
            }}
            onKeyDown={onListKeyDown}
          />
        ) : null}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="국가 선택"
          tabIndex={-1}
          aria-activedescendant={activeDescendant}
          className="country-picker-v165__list"
          onKeyDown={onListKeyDown}
        >
          {groups.map((group) => (
            <li key={group.key || "all"} role="presentation" className="country-picker-v165__group">
              {group.nameKo ? (
                <span className="country-picker-v165__group-name" id={`country-picker-${baseId}-group-${group.key}`}>
                  {group.nameKo}
                </span>
              ) : null}
              <ul role="group" aria-labelledby={group.nameKo ? `country-picker-${baseId}-group-${group.key}` : undefined}>
                {group.countries.map((entry: CountryPickerEntryV165) => {
                  const selected = entry.iso3 === value;
                  return (
                    <li
                      key={entry.iso3}
                      id={optionId(entry.iso3)}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={entry.live ? undefined : true}
                      data-iso3={entry.iso3}
                      className={[
                        "country-picker-v165__option",
                        selected ? "is-selected" : "",
                        entry.iso3 === activeIso3 ? "is-active" : "",
                        entry.live ? "" : "is-disabled",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onPointerMove={() => {
                        if (entry.live && entry.iso3 !== activeIso3) setActiveIso3(entry.iso3);
                      }}
                      onClick={() => choose(entry.iso3)}
                    >
                      <span className="country-picker-v165__name">
                        <strong>{entry.nameKo}</strong>
                        <small>{entry.nameEn}</small>
                      </span>
                      <span className="country-picker-v165__meta">
                        {entry.live
                          ? typeof counts[entry.iso3] === "number"
                            ? `${counts[entry.iso3]}개 항목`
                            : ""
                          : "공개 예정"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          {groups.length === 0 ? <li role="presentation" className="country-picker-v165__empty">찾는 국가가 없습니다</li> : null}
        </ul>
      </div>
    </div>
  );
}
