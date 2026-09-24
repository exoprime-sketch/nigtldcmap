import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import DetailLayerV160 from "./DetailLayerV160";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STORAGE_KEY = "detail-layers-v160";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("collapsed by default, with aria-expanded=false on the summary", () => {
  act(() =>
    root.render(
      <DetailLayerV160 layer={2} title="데이터 설명">
        <p>내용</p>
      </DetailLayerV160>
    )
  );
  const details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
  expect(details.open).toBe(false);
  expect(details.getAttribute("data-layer")).toBe("2");
  const summary = details.querySelector("summary")!;
  expect(summary.getAttribute("aria-expanded")).toBe("false");
  expect(summary.textContent).toBe("데이터 설명");
  // Content stays in the DOM even while collapsed, so testids inside it are
  // still found by audits that look for them.
  expect(details.querySelector("p")!.textContent).toBe("내용");
});

test("toggling writes the open state to localStorage and updates aria-expanded", () => {
  act(() =>
    root.render(
      <DetailLayerV160 layer={3} title="다운로드·참고문헌">
        <p>내용</p>
      </DetailLayerV160>
    )
  );
  const details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
  const summary = details.querySelector("summary")!;
  act(() => {
    details.open = true;
    details.dispatchEvent(new Event("toggle", { bubbles: false }));
  });
  expect(summary.getAttribute("aria-expanded")).toBe("true");
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}")).toEqual({ "3": true });

  act(() => {
    details.open = false;
    details.dispatchEvent(new Event("toggle", { bubbles: false }));
  });
  expect(summary.getAttribute("aria-expanded")).toBe("false");
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}")).toEqual({ "3": false });
});

test("open state is remembered globally by layer number, not per element", () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ "2": true }));
  act(() =>
    root.render(
      <DetailLayerV160 layer={2} title="데이터 설명">
        <p>A-003</p>
      </DetailLayerV160>
    )
  );
  let details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
  expect(details.open).toBe(true);

  // A different element's layer-2 instance (no elementId prop exists at all -
  // the component has no notion of which dataset it belongs to) reads the
  // same stored key and also starts open.
  act(() =>
    root.render(
      <DetailLayerV160 layer={2} title="데이터 설명">
        <p>B-003</p>
      </DetailLayerV160>
    )
  );
  details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
  expect(details.open).toBe(true);

  // layer 3 was never stored, so it still starts collapsed.
  act(() =>
    root.render(
      <DetailLayerV160 layer={3} title="다운로드·참고문헌">
        <p>B-003</p>
      </DetailLayerV160>
    )
  );
  details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
  expect(details.open).toBe(false);
});

test("a storage read that throws renders collapsed instead of crashing", () => {
  const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("storage disabled");
  });
  try {
    expect(() =>
      act(() =>
        root.render(
          <DetailLayerV160 layer={2} title="데이터 설명">
            <p>내용</p>
          </DetailLayerV160>
        )
      )
    ).not.toThrow();
    const details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")!.getAttribute("aria-expanded")).toBe("false");
  } finally {
    spy.mockRestore();
  }
});

test("a storage write that throws does not stop the toggle from updating aria-expanded", () => {
  act(() =>
    root.render(
      <DetailLayerV160 layer={2} title="데이터 설명">
        <p>내용</p>
      </DetailLayerV160>
    )
  );
  const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("storage disabled");
  });
  try {
    const details = container.querySelector('[data-testid="detail-layer-v160"]') as HTMLDetailsElement;
    const summary = details.querySelector("summary")!;
    expect(() =>
      act(() => {
        details.open = true;
        details.dispatchEvent(new Event("toggle", { bubbles: false }));
      })
    ).not.toThrow();
    expect(summary.getAttribute("aria-expanded")).toBe("true");
  } finally {
    spy.mockRestore();
  }
});
