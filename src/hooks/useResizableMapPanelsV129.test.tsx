import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useResizableMapPanelsV129 } from "./useResizableMapPanelsV129";

/**
 * The drag path must not depend on React having committed anything after
 * pointerdown: on the Linux CI runner the synthetic pointer move arrived
 * before the effect that used to attach the move listener, and the width was
 * clamped against a layout width that was still 0 (both panels fell to
 * 120px and that was persisted). jsdom reports every rect as 0 wide, so it
 * reproduces the unmeasured layout exactly.
 */
function Harness() {
  const panels = useResizableMapPanelsV129({ leftPanelOpen: true, rightPanelOpen: true });
  const left = panels.leftSeparator;
  return (
    <div ref={panels.layoutRef} style={panels.layoutStyle}>
      <div
        data-testid="left"
        data-value={left.value}
        data-max={left.maximum}
        onPointerDown={left.onPointerDown}
        onDoubleClick={left.onDoubleClick}
        onKeyDown={left.onKeyDown}
      />
      <span data-testid="right" data-value={panels.rightSeparator.value} />
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1920 });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const value = (id: string) => Number(container.querySelector(`[data-testid="${id}"]`)?.getAttribute("data-value"));

describe("useResizableMapPanelsV129 drag (V150)", () => {
  test("a move dispatched in the same task as pointerdown, before any commit, widens the panel by the pointer delta", () => {
    const separator = container.querySelector('[data-testid="left"]') as HTMLDivElement;
    expect(value("left")).toBe(320);
    act(() => {
      // pointerdown through React, then the window-level move and up
      // synchronously - no effect has a chance to run in between.
      separator.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 326 }));
      window.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 326 + 145 }));
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 326 + 145 }));
    });
    expect(value("left")).toBe(465);
    // The other panel keeps its width; nothing collapsed to the minimum.
    expect(value("right")).toBe(360);
    expect(localStorage.getItem("cdp-map-left-panel-width-v150")).toBe("465");
    expect(localStorage.getItem("cdp-map-right-panel-width-v150")).toBe("360");
  });

  test("an unmeasured layout (rect width 0) clamps against the viewport, never against 0", () => {
    const separator = container.querySelector('[data-testid="left"]') as HTMLDivElement;
    act(() => {
      separator.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 326 }));
      window.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 326 + 1000 }));
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 326 + 1000 }));
    });
    // 1920 - 200 (map) - 120 (other panel) - 24 (separators) = 1576 available for the left panel.
    expect(value("left")).toBe(1320);
    expect(value("left")).toBeGreaterThan(120);
  });

  test("a move after pointerup changes nothing, and double-click restores the default", () => {
    const separator = container.querySelector('[data-testid="left"]') as HTMLDivElement;
    act(() => {
      separator.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 326 }));
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 326 }));
      window.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 900 }));
    });
    expect(value("left")).toBe(320);
    act(() => {
      separator.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 326 }));
      window.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 426 }));
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 426 }));
    });
    expect(value("left")).toBe(420);
    act(() => {
      separator.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(value("left")).toBe(320);
  });
});
