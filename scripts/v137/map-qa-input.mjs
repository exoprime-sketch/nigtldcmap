/**
 * Real-input and readiness helpers for the candidate map QA.
 *
 * Everything here drives the page the way a reader does - a pointer press on a
 * control's own rectangle, arrow keys on a focused <select> - and waits on an
 * observable result rather than on a clock. Nothing writes a React state, sets
 * an element's .value, or synthesises a change event: a run that reports a
 * period change has to have changed it through the control.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (value) => JSON.stringify(value);

export class MapQaError extends Error {}

/* ------------------------------------------------------------------ *
 * Bounded polling
 * ------------------------------------------------------------------ */

/**
 * Poll `read` until `accept` is satisfied. Returns what was read plus how long
 * it took, so a slow-but-correct result stays distinguishable from a wait that
 * merely happened to be long enough. A timeout is reported, never padded away.
 */
export async function pollUntil(read, accept, options = {}) {
  const { timeoutMs = 8000, intervalMs = 120, label = "" } = options;
  const started = Date.now();
  const deadline = started + timeoutMs;
  let last;
  for (;;) {
    last = await read();
    if (accept(last)) {
      return { ok: true, value: last, waitedMs: Date.now() - started, label };
    }
    if (Date.now() >= deadline) {
      return { ok: false, value: last, waitedMs: Date.now() - started, label };
    }
    await sleep(intervalMs);
  }
}

/* ------------------------------------------------------------------ *
 * Pointer and keyboard
 * ------------------------------------------------------------------ */

export async function mouse(cdp, type, x, y, extra = {}) {
  await cdp.send("Input.dispatchMouseEvent", {
    type,
    x: Math.round(x),
    y: Math.round(y),
    button: extra.button ?? "none",
    buttons: extra.buttons ?? 0,
    clickCount: extra.clickCount ?? 0,
    pointerType: "mouse",
  });
}

export async function pointerClick(cdp, x, y) {
  await mouse(cdp, "mouseMoved", x, y);
  await mouse(cdp, "mousePressed", x, y, { button: "left", buttons: 1, clickCount: 1 });
  await mouse(cdp, "mouseReleased", x, y, { button: "left", buttons: 0, clickCount: 1 });
}

/** Press and drag, which is how a reader pans the map. */
export async function pointerDrag(cdp, from, to, steps = 12) {
  await mouse(cdp, "mouseMoved", from.x, from.y);
  await mouse(cdp, "mousePressed", from.x, from.y, { button: "left", buttons: 1, clickCount: 1 });
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    await mouse(cdp, "mouseMoved", from.x + (to.x - from.x) * ratio, from.y + (to.y - from.y) * ratio, {
      button: "left",
      buttons: 1,
    });
    await sleep(16);
  }
  await mouse(cdp, "mouseReleased", to.x, to.y, { button: "left", buttons: 0, clickCount: 1 });
}

export async function wheelZoom(cdp, x, y, deltaY) {
  await mouse(cdp, "mouseMoved", x, y);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: Math.round(x),
    y: Math.round(y),
    deltaX: 0,
    deltaY,
    pointerType: "mouse",
  });
}

const KEYS = {
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", vk: 40 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", vk: 38 },
  Enter: { key: "Enter", code: "Enter", vk: 13 },
  Escape: { key: "Escape", code: "Escape", vk: 27 },
};

export async function pressKey(cdp, name) {
  const spec = KEYS[name];
  if (!spec) throw new MapQaError(`UNKNOWN_KEY ${name}`);
  const shared = {
    key: spec.key,
    code: spec.code,
    windowsVirtualKeyCode: spec.vk,
    nativeVirtualKeyCode: spec.vk,
  };
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...shared });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...shared });
}

/** Centre of an element's own rectangle, or null when it has none on screen. */
export async function elementPoint(cdp, evaluateValue, selector) {
  return evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector(${json(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`
  );
}

export async function clickSelector(cdp, evaluateValue, selector, timeoutMs = 6000) {
  // A control below the fold is reachable - a reader scrolls to it - but a
  // pointer aimed at page coordinates is not. A-002's year control sits 2,100px
  // down its page and every attempt to drive it reported the control as dead.
  await evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector(${json(selector)});
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) return true;
      el.scrollIntoView({ block: "center" });
      return true;
    })()`
  );
  // A control that is still being laid out is not the same as one that is not
  // there. Waiting for a rectangle is waiting for the thing itself, so the
  // timeout stays a real failure rather than a race the run loses at random.
  const found = await pollUntil(
    () => elementPoint(cdp, evaluateValue, selector),
    (point) => Boolean(point),
    { timeoutMs, label: `hittable ${selector}` }
  );
  if (!found.ok) throw new MapQaError(`CONTROL_NOT_HITTABLE ${selector}`);
  await pointerClick(cdp, found.value.x, found.value.y);
  return found.value;
}

/**
 * Open the dataset list if the layout has it collapsed.
 *
 * Below 769px the list starts closed, so a run that went straight for a layer
 * button reported the button as unhittable and stopped. A reader opens the list
 * first; so does this.
 */
export async function openLayerList(cdp, evaluateValue) {
  const open = await evaluateValue(
    cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-layer-panel"]');
      if (!panel) return "NO_PANEL";
      return panel.classList.contains("is-collapsed") ? "COLLAPSED" : "OPEN";
    })()`
  );
  if (open !== "COLLAPSED") return open;
  const toggle = '[data-testid="map-layer-panel"] .cdp-map-panel-toggle';
  const point = await elementPoint(cdp, evaluateValue, toggle);
  if (!point) return "TOGGLE_NOT_HITTABLE";
  await pointerClick(cdp, point.x, point.y);
  const opened = await pollUntil(
    () =>
      evaluateValue(
        cdp,
        `(() => {
          const panel = document.querySelector('[data-testid="map-layer-panel"]');
          return Boolean(panel && !panel.classList.contains("is-collapsed"));
        })()`
      ),
    (value) => value === true,
    { timeoutMs: 4000, label: "layer list opened" }
  );
  return opened.ok ? "OPENED_BY_TOGGLE" : "DID_NOT_OPEN";
}

/**
 * Make a control inside the dataset drawer reachable.
 *
 * Selecting a dataset closes the drawer on a narrow layout, and that close
 * happens a beat after the click. A run that read the drawer state in that beat
 * saw it open, skipped the toggle, and then found the control with no rectangle
 * for six seconds. Checking the control itself, and opening the drawer when it
 * has none, is what a reader does and does not depend on the timing.
 */
export async function ensureControlReachable(cdp, evaluateValue, selector, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const point = await elementPoint(cdp, evaluateValue, selector);
    if (point) return attempt === 0 ? "ALREADY_REACHABLE" : "REACHABLE_AFTER_OPENING_LIST";
    const state = await openLayerList(cdp, evaluateValue);
    if (state === "NO_PANEL" || state === "TOGGLE_NOT_HITTABLE") return state;
    await sleep(350);
  }
  return "NOT_REACHABLE";
}

/**
 * Put the dataset drawer away again.
 *
 * Below 769px the drawer covers the whole workspace, so anything that had to
 * open it - reading the variable control, changing the period - has to close it
 * before the map can be touched. That is the same two steps a reader takes.
 */
export async function collapseLayerList(cdp, evaluateValue) {
  const state = await evaluateValue(
    cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-layer-panel"]');
      if (!panel) return "NO_PANEL";
      return panel.classList.contains("is-collapsed") ? "COLLAPSED" : "OPEN";
    })()`
  );
  if (state !== "OPEN") return state;
  const point = await elementPoint(
    cdp,
    evaluateValue,
    '[data-testid="map-layer-panel"] .cdp-map-panel-toggle'
  );
  if (!point) return "TOGGLE_NOT_HITTABLE";
  await pointerClick(cdp, point.x, point.y);
  const closed = await pollUntil(
    () =>
      evaluateValue(
        cdp,
        `(() => {
          const panel = document.querySelector('[data-testid="map-layer-panel"]');
          return Boolean(panel && panel.classList.contains("is-collapsed"));
        })()`
      ),
    (value) => value === true,
    { timeoutMs: 4000, label: "layer list collapsed" }
  );
  return closed.ok ? "COLLAPSED_BY_TOGGLE" : "DID_NOT_COLLAPSE";
}

/* ------------------------------------------------------------------ *
 * Selecting an option through the control
 * ------------------------------------------------------------------ */

const readSelect = (selector) => `(() => {
  const el = document.querySelector(${json(selector)});
  if (!el) return null;
  return {
    value: el.value,
    index: el.selectedIndex,
    focused: document.activeElement === el,
    disabled: el.disabled,
    options: [...el.options].map((o) => ({
      value: o.value,
      label: (o.textContent || "").replace(/\\s+/g, " ").trim(),
      disabled: o.disabled,
    })),
  };
})()`;

export async function readSelectState(cdp, evaluateValue, selector) {
  return evaluateValue(cdp, readSelect(selector));
}

/**
 * Pick an option by keyboard. Chrome moves the selection and fires input and
 * change from the arrow key itself while the collapsed select holds focus, so
 * this is the event sequence a keyboard user produces - and a select that
 * refuses the change (disabled, re-rendered, option gone) fails here instead of
 * being forced past with a prototype setter.
 */
export async function selectOptionByRealInput(cdp, evaluateValue, selector, matchOption) {
  const before = await readSelectState(cdp, evaluateValue, selector);
  if (!before) return { result: "NO_CONTROL" };
  if (before.disabled) return { result: "CONTROL_DISABLED" };

  const wantedIndex = before.options.findIndex(matchOption);
  if (wantedIndex < 0) {
    return { result: "OPTION_ABSENT", options: before.options.map((o) => o.label) };
  }
  const wanted = before.options[wantedIndex];
  if (wanted.disabled) return { result: "OPTION_DISABLED", option: wanted.label };
  if (before.index === wantedIndex) {
    return { result: "ALREADY_SELECTED", option: wanted.label, value: wanted.value };
  }

  await clickSelector(cdp, evaluateValue, selector);
  // A native popup would swallow the arrow keys; closing it leaves the control
  // focused, which is the state a keyboard user walks the option list in.
  await pressKey(cdp, "Escape");
  const focused = await pollUntil(
    () =>
      evaluateValue(
        cdp,
        `document.activeElement === document.querySelector(${json(selector)})`
      ),
    (value) => value === true,
    { timeoutMs: 3000, label: "select focus" }
  );
  if (!focused.ok) return { result: "CONTROL_DID_NOT_TAKE_FOCUS", option: wanted.label };

  const direction = wantedIndex > before.index ? "ArrowDown" : "ArrowUp";
  const steps = Math.abs(wantedIndex - before.index);
  for (let step = 0; step <= steps + 1; step += 1) {
    const state = await readSelectState(cdp, evaluateValue, selector);
    if (!state) return { result: "CONTROL_GONE", option: wanted.label };
    if (state.value === wanted.value) {
      return {
        result: "SELECTED_BY_KEYBOARD",
        option: wanted.label,
        value: wanted.value,
        keyPresses: step,
      };
    }
    if (step > steps) break;
    await pressKey(cdp, direction);
    await sleep(60);
  }
  const after = await readSelectState(cdp, evaluateValue, selector);
  return {
    result: `CONTROL_DID_NOT_REACH_OPTION:${after ? after.value : "gone"}`,
    option: wanted.label,
  };
}

/* ------------------------------------------------------------------ *
 * Reading what is on screen
 * ------------------------------------------------------------------ */

/**
 * The popup and the panel as labelled fields, not as one run-together string.
 * A value is only ever compared against the field it is designed to appear in,
 * so "63" inside "631,219" can never read as a match.
 */
export const READ_SURFACES = `(() => {
  const clean = (value) => (value || "").replace(/\\s+/gu, " ").trim();
  const popupRoot = document.querySelector('[data-testid="map-hover-popup-v133"]')
    || document.querySelector(".maplibregl-popup-content .cdp-map-public-popup");
  const popup = popupRoot
    ? {
        elementId: popupRoot.getAttribute("data-element-id") || "",
        selectionKey: popupRoot.getAttribute("data-selection-key") || "",
        title: clean(popupRoot.querySelector("strong") && popupRoot.querySelector("strong").textContent),
        lines: [...popupRoot.querySelectorAll(":scope > span")]
          .map((node) => clean(node.textContent))
          .filter(Boolean),
        text: clean(popupRoot.textContent)
      }
    : null;

  const panelRoot = document.querySelector('[data-testid="map-selected-feature-panel"]');
  const fields = [];
  const scope = panelRoot || document;
  scope.querySelectorAll(".cdp-evidence-row").forEach((row) => {
    const label = clean(row.querySelector("span") && row.querySelector("span").textContent);
    const value = clean(row.querySelector("strong") && row.querySelector("strong").textContent);
    if (label) fields.push({ label: label, value: value });
  });
  scope.querySelectorAll("dl").forEach((list) => {
    const terms = [...list.querySelectorAll(":scope > dt")];
    const definitions = [...list.querySelectorAll(":scope > dd")];
    terms.forEach((term, index) => {
      const label = clean(term.textContent);
      if (label) {
        fields.push({
          label: label,
          value: clean(definitions[index] && definitions[index].textContent)
        });
      }
    });
  });

  return {
    popup: popup,
    panel: panelRoot
      ? {
          elementId: panelRoot.getAttribute("data-selected-element-id") || "",
          selectionKey: panelRoot.getAttribute("data-selected-key") || "",
          heading: clean(
            panelRoot.querySelector("h3, h4") && panelRoot.querySelector("h3, h4").textContent
          ),
          fields: fields,
          text: clean(panelRoot.textContent).slice(0, 2400)
        }
      : null,
    fallbackTooltip: clean(
      document.querySelector('[data-testid="map-feature-tooltip"]')
        && document.querySelector('[data-testid="map-feature-tooltip"]').textContent
    ),
    hasCanvas: Boolean(document.querySelector("canvas.maplibregl-canvas"))
  };
})()`;

/* ------------------------------------------------------------------ *
 * Comparing a value to the field it belongs in
 * ------------------------------------------------------------------ */

const NUMBER_TOKEN = /-?\d[\d, \s]*(?:\.\d+)?/gu;

/** Whole numeric tokens only: "631,219" is one token, and it is not "63". */
export function numericTokens(text) {
  const found = [];
  for (const match of String(text || "").matchAll(NUMBER_TOKEN)) {
    const cleaned = match[0].replace(/[, \s]/gu, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) found.push({ raw: cleaned, value: parsed });
  }
  return found;
}

const decimalsOf = (token) => {
  const dot = token.indexOf(".");
  return dot < 0 ? 0 : token.length - dot - 1;
};

/**
 * Does this displayed token carry the expected number? A screen legitimately
 * rounds for display, so a token matches when it equals the expectation rounded
 * to the precision the token itself shows - and nothing coarser.
 */
export function tokenCarriesValue(token, expected) {
  if (token.value === expected) return true;
  const rounded = Number(expected.toFixed(decimalsOf(token.raw)));
  return token.value === rounded;
}

const normalizeLabel = (value) =>
  String(value || "")
    .replace(/\(.*?\)/gu, "")
    .replace(/[\s·:]/gu, "")
    .toLocaleLowerCase("ko-KR");

/**
 * Locate the expected value in the field it is designed to appear in.
 *
 * `designedLabels` names those fields - the variable's own label, plus the
 * generic value row the panel renders for a selected feature. A number found
 * anywhere else is reported as OUTSIDE_DESIGNED_FIELD rather than as a match:
 * a number that is on screen only by coincidence is not the screen showing the
 * value.
 */
export function locateExpectedValue(surfaces, expectation) {
  const { value, unit, period, designedLabels } = expectation;
  if (value === null || value === undefined || value === "") {
    return { status: "NO_EXPECTED_VALUE" };
  }

  const wantedLabels = (designedLabels || []).filter(Boolean).map(normalizeLabel);
  const panelFields = (surfaces.panel && surfaces.panel.fields) || [];
  const popupLines = surfaces.popup
    ? [surfaces.popup.title, ...surfaces.popup.lines].filter(Boolean)
    : [];

  const numeric = typeof value === "number" ? value : Number(value);
  const isNumeric =
    typeof value === "number" || (String(value).trim() !== "" && Number.isFinite(numeric));
  const textValue = String(value).trim();

  const carries = (text) => {
    if (!text) return false;
    if (isNumeric) return numericTokens(text).some((token) => tokenCarriesValue(token, numeric));
    return text.includes(textValue);
  };

  const designed = panelFields.filter((field) =>
    wantedLabels.some((label) => label && normalizeLabel(field.label).includes(label))
  );
  for (const field of designed) {
    if (carries(field.value)) {
      return {
        status: "MATCH_IN_DESIGNED_FIELD",
        where: `panel:${field.label}`,
        shown: field.value,
        unitObserved: unitObserved(panelFields, field, unit),
        periodObserved: periodObserved(panelFields, popupLines, period),
      };
    }
  }
  // The popup states the same value as "<이름> · <변수> <값> <단위>", so a line
  // naming the variable is the popup's designed place for it.
  for (const line of popupLines) {
    const namesVariable = wantedLabels.some(
      (label) => label && normalizeLabel(line).includes(label)
    );
    if (namesVariable && carries(line)) {
      return {
        status: "MATCH_IN_POPUP_FIELD",
        where: "popup",
        shown: line,
        unitObserved: unit ? line.includes(unit) : null,
        periodObserved: periodObserved(panelFields, popupLines, period),
      };
    }
  }
  if (designed.length) {
    return {
      status: "VALUE_MISMATCH_IN_DESIGNED_FIELD",
      where: `panel:${designed[0].label}`,
      shown: designed[0].value,
    };
  }
  const anywhere =
    panelFields.some((field) => carries(field.value)) ||
    popupLines.some((line) => carries(line));
  return {
    status: anywhere ? "OUTSIDE_DESIGNED_FIELD" : "VALUE_ABSENT",
    labelsLookedFor: (designedLabels || []).filter(Boolean),
    panelLabels: panelFields.map((field) => field.label).slice(0, 24),
  };
}

function unitObserved(panelFields, field, unit) {
  if (!unit) return null;
  if (field.value && field.value.includes(unit)) return true;
  return panelFields.some(
    (row) => normalizeLabel(row.label).includes(normalizeLabel("단위")) && row.value.includes(unit)
  );
}

function periodObserved(panelFields, popupLines, period) {
  if (!period) return null;
  const wanted = String(period);
  return (
    panelFields.some(
      (row) =>
        (normalizeLabel(row.label).includes(normalizeLabel("기간")) ||
          normalizeLabel(row.label).includes(normalizeLabel("연도"))) &&
        row.value.includes(wanted)
    ) || popupLines.some((line) => line.includes(wanted))
  );
}

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

/**
 * Identity is the record key first. A name is accepted only when the surface
 * carries no key at all, and never on its own for a layer where two records can
 * share a name.
 */
export function identityOf(surface, target) {
  if (!surface) return { identifies: false, by: "ABSENT" };
  const key = String(target.expectedKey || "").trim();
  const surfaceKey = String(surface.selectionKey || "").trim();
  if (surfaceKey) {
    if (key && surfaceKey === key) {
      return { identifies: true, by: "STABLE_KEY", observed: surfaceKey };
    }
    return { identifies: false, by: "DIFFERENT_KEY", observed: surfaceKey };
  }
  const text = surface.text || "";
  if (key && text.includes(key)) return { identifies: true, by: "KEY_IN_TEXT", observed: key };
  const name = String(target.expectedName || "").trim();
  if (name && text.includes(name)) {
    return {
      identifies: !target.nameIsAmbiguous,
      by: target.nameIsAmbiguous ? "NAME_ONLY_AMBIGUOUS" : "NAME_IN_TEXT",
      observed: name,
    };
  }
  return { identifies: false, by: "NO_MATCH", observed: text.slice(0, 90) };
}

export { sleep, json };
