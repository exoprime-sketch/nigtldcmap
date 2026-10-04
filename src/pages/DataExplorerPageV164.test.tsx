import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import DataExplorerPage from "./DataExplorerPage";
import { resetCountryRegistryCacheV158 } from "../data/countryContext";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROOT = path.resolve(__dirname, "../..");
const CARD_SELECTOR = '[data-testid="public-finder-card-v135"]';
const realFetch = (globalThis as unknown as { fetch: unknown }).fetch;

/** Serves the repository's published data files, and an empty (ready) usage report. */
function serveFiles(usage: "empty" | "none"): void {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string) => {
    const target = String(url).split("?")[0].replace(/^\/+/u, "");
    if (target === "api/usage") {
      if (usage === "none") return { ok: false, status: 404, headers: new Headers(), text: async () => "", json: async () => ({}) };
      const body = { status: "ready", windowDays: 30, from: "2026-09-01", through: "2026-09-30", detail: [], map: [] };
      return { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), json: async () => body, text: async () => JSON.stringify(body) };
    }
    const file = path.join(ROOT, "public", target);
    if (!target.startsWith("data/") || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return { ok: false, status: 404, headers: new Headers(), text: async () => "", json: async () => ({}) };
    }
    const body = fs.readFileSync(file, "utf8");
    return { ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), text: async () => body, json: async () => JSON.parse(body) };
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  resetCountryRegistryCacheV158();
  window.sessionStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetCountryRegistryCacheV158();
  (globalThis as unknown as { fetch: unknown }).fetch = realFetch;
});

function handlers() {
  return {
    onQueryChange: jest.fn(),
    onCountryChange: jest.fn(),
    onSourceOrganizationChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onTechnologyChange: jest.fn(),
    onGroupChange: jest.fn(),
    onOpenDownload: jest.fn(),
    onOpenElement: jest.fn(),
    onSortChange: jest.fn(),
  };
}

async function renderFinder(props: Partial<Parameters<typeof DataExplorerPage>[0]> = {}, h = handlers()) {
  await act(async () => {
    root.render(
      <DataExplorerPage
        query=""
        countryIso3="BGD"
        sourceOrganization="all"
        category="all"
        technologyId="all"
        selectedGroup={null}
        {...h}
        {...props}
      />
    );
  });
  // The catalogue, the card summaries and the usage report arrive asynchronously.
  for (let attempt = 0; attempt < 80 && container.querySelectorAll(CARD_SELECTOR).length === 0; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  }
  return h;
}

const optionTexts = (select: Element | null) => Array.from(select?.querySelectorAll("option") ?? []).map((option) => option.textContent || "");

describe("the finder on Bangladesh (V164-4)", () => {
  it("keeps the country when the search conditions are reset", async () => {
    serveFiles("none");
    // (No query: a typed query reads the search index, which needs SHA-256 verification that jsdom lacks.)
    const h = await renderFinder({ category: "B" });
    expect(container.querySelectorAll(CARD_SELECTOR).length).toBeGreaterThan(0);
    const reset = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "검색조건 초기화");
    expect(reset).toBeTruthy();
    await act(async () => {
      reset!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(h.onCountryChange).not.toHaveBeenCalled();
    expect(h.onQueryChange).toHaveBeenCalledWith("");
    expect(h.onCategoryChange).toHaveBeenCalledWith("all");
    expect(h.onSourceOrganizationChange).toHaveBeenCalledWith("all");
    expect(h.onGroupChange).toHaveBeenCalledWith(null);
  });

  it("names the 대분류 as the catalogue does", async () => {
    serveFiles("none");
    await renderFinder();
    const select = Array.from(container.querySelectorAll("select")).find((node) => node.closest("label")?.textContent?.startsWith("대분류")) ?? null;
    expect(optionTexts(select)).toEqual(["전체", "국가 기본 정보", "기후 환경", "정책·제도", "시장·산업 및 재원", "협력·실행 기반"]);
  });

  it("offers organisation names in the 제공기관 filter, not source strings", async () => {
    serveFiles("none");
    await renderFinder();
    const select = Array.from(container.querySelectorAll("select")).find((node) => node.closest("label")?.textContent?.startsWith("제공기관")) ?? null;
    const options = optionTexts(select);
    expect(options.length).toBeGreaterThan(20);
    for (const option of options) {
      expect(option).not.toMatch(/GADM|\||^좌표|^경계 /u);
      expect(option.length).toBeLessThanOrEqual(80);
    }
  });

  it("prints each card's 제공기관 as organisation names without separators or boundary clauses", async () => {
    serveFiles("none");
    await renderFinder();
    const rows = Array.from(container.querySelectorAll(`${CARD_SELECTOR} dl > div`)).filter((row) => row.querySelector("dt")?.textContent === "제공기관");
    expect(rows.length).toBeGreaterThan(5);
    for (const row of rows) {
      expect(row.querySelector("dd")?.textContent || "").not.toMatch(/ \| |GADM|좌표\(|경계 /u);
    }
  });

  it("says 조회순 lists in 가나다순 while no view is counted, and only then", async () => {
    serveFiles("empty");
    await renderFinder({ sort: "views" });
    const note = container.querySelector('[data-testid="finder-sort-note-v164"]');
    expect(note?.textContent).toContain("조회 집계가 준비되면 조회순으로 표시합니다.");
    expect(note?.textContent).toContain("가나다순");
  });

  it("prints no sort note for 가나다순", async () => {
    serveFiles("empty");
    await renderFinder({ sort: "name" });
    expect(container.querySelector('[data-testid="finder-sort-note-v164"]')).toBeNull();
  });
});
