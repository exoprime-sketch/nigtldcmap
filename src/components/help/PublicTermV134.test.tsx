import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import PublicTermV134, { PublicTermTextV134 } from "./PublicTermV134";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("PublicTermV134 interactions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document
      .querySelectorAll("[data-public-term-tooltip-v134]")
      .forEach((node) => node.remove());
  });

  test("opens on keyboard focus with aria-describedby and closes on Escape", () => {
    act(() => root.render(<PublicTermV134 term="ODA">ODA</PublicTermV134>));
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-public-term-v134="oda"]'
    );
    expect(trigger).not.toBeNull();

    act(() => trigger?.focus());
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    const tooltip = document.querySelector<HTMLElement>(
      '[data-public-term-tooltip-v134="oda"]'
    );
    expect(tooltip?.textContent).toContain("Official Development Assistance");
    expect(trigger?.getAttribute("aria-describedby")).toBe(tooltip?.id);

    act(() =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
      )
    );
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(
      document.querySelector('[data-public-term-tooltip-v134="oda"]')
    ).toBeNull();
  });

  test("tap/click pins a scenario tooltip and an outside tap closes it", () => {
    act(() =>
      root.render(<PublicTermTextV134 text="SSP2-4.5 전망" />)
    );
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-public-term-v134="ssp2-4-5"]'
    );
    act(() => trigger?.click());
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(
      document.querySelector(
        '[data-public-term-tooltip-v134="ssp2-4-5"]'
      )?.textContent
    ).toContain("4.5 W/m²");

    act(() =>
      document.body.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true })
      )
    );
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });
});
