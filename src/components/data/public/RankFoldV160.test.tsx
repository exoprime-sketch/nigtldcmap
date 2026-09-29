import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useRankFoldV160 } from "./RankFoldV160";
import {
  isDetailLayerOpenV160,
  resetDetailLayerOverridesV160,
  setDetailLayerOpenV160,
} from "../layers/detailLayerStoreV160";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Ranked({ total }: { total: number }) {
  const fold = useRankFoldV160(total);
  return (
    <div>
      <ol>
        {Array.from({ length: total }, (_, index) => (
          <li key={index} {...fold.rowProps(index)}>{index + 1}</li>
        ))}
      </ol>
      {fold.toggle}
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  window.localStorage.clear();
  resetDetailLayerOverridesV160();
  window.history.replaceState(null, "", "/");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("a 34-row ranking shows its top and bottom 10; the middle stays in the list, hidden", () => {
  act(() => root.render(<Ranked total={34} />));
  const rows = [...container.querySelectorAll("li")];
  expect(rows).toHaveLength(34);
  expect(rows.filter((row) => !row.hidden).map((row) => row.textContent)).toEqual([
    ..."1 2 3 4 5 6 7 8 9 10".split(" "),
    ..."25 26 27 28 29 30 31 32 33 34".split(" "),
  ]);
  expect(rows[24].getAttribute("data-rank-gap")).toBe("가운데 14개 생략");
  const toggle = container.querySelector("button")!;
  expect(toggle.textContent).toBe("전체 34개 보기");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  act(() => toggle.click());
  expect([...container.querySelectorAll("li")].every((row) => !row.hidden)).toBe(true);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
});

test("20 rows or fewer are never folded and get no toggle", () => {
  act(() => root.render(<Ranked total={20} />));
  expect([...container.querySelectorAll("li")].every((row) => !row.hidden)).toBe(true);
  expect(container.querySelector("button")).toBeNull();
});

test("detail layers: closed by default, open with detailLayers=all, a toggle wins", () => {
  expect(isDetailLayerOpenV160("2")).toBe(false);
  window.history.replaceState(null, "", "/?detailLayers=all");
  expect(isDetailLayerOpenV160("2")).toBe(true);
  setDetailLayerOpenV160("2", false, false);
  expect(isDetailLayerOpenV160("2")).toBe(false);
});
