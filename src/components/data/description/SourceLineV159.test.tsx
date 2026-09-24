import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import SourceLineV159 from "./SourceLineV159";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
});

test("renders sourceOrg, a 원문 link and the checked date in one line, the APA reference in a closed disclosure", () => {
  act(() =>
    root.render(
      <SourceLineV159
        spec={{
          sourceOrg: "Test Org",
          refApa: "Test Org. (2026). Test dataset.",
          refLink: "https://example.com/data",
          checkedAt: "2026-09-01",
        }}
      />
    )
  );
  const line = container.querySelector('[data-testid="source-line-v159"]')!;
  expect(line.textContent).toBe("Test Org · 원문 · 확인 2026-09-01");
  const apa = container.querySelector('[data-testid="source-apa-v159"]') as HTMLDetailsElement;
  expect(apa.open).toBe(false);
  expect(apa.textContent).toContain("Test Org. (2026). Test dataset.");
  const link = line.querySelector("a")!;
  expect(link.getAttribute("href")).toBe("https://example.com/data");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener");
});

test("omits a missing refLink instead of printing an empty 원문 link", () => {
  act(() =>
    root.render(
      <SourceLineV159
        spec={{ sourceOrg: "Test Org", refApa: "", refLink: "", checkedAt: "2026-09-01" }}
      />
    )
  );
  const line = container.querySelector('[data-testid="source-line-v159"]')!;
  expect(line.querySelector("a")).toBeNull();
  expect(line.textContent).toBe("Test Org · 확인 2026-09-01");
});

test("renders nothing for a null spec", () => {
  act(() => root.render(<SourceLineV159 spec={null} />));
  expect(container.innerHTML).toBe("");
});
