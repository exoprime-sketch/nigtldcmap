import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import DownloadPage from "./DownloadPage";
import { resetCountryRegistryCacheV158 } from "../data/countryContext";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ROOT = path.resolve(__dirname, "../..");
const realFetch = (globalThis as unknown as { fetch: unknown }).fetch;
const ITEM_SELECTOR = ".cdp-download-item[data-element-id]";

/** Serves the repository's published data files. */
function serveFiles(): void {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string) => {
    const target = String(url).split("?")[0].replace(/^\/+/u, "");
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
  serveFiles();
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

async function renderDownload(countryIso3: string) {
  await act(async () => {
    root.render(<DownloadPage initialDatasetId={null} initialCountryIso3={countryIso3} />);
  });
  for (let attempt = 0; attempt < 80 && container.querySelectorAll(ITEM_SELECTOR).length === 0; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
  }
}

const optionTexts = (label: string) => {
  const select = Array.from(container.querySelectorAll("select")).find((node) => node.closest("label")?.textContent?.startsWith(label));
  return Array.from(select?.querySelectorAll("option") ?? []).map((option) => option.textContent || "");
};

describe("the download list (V164-4)", () => {
  for (const iso3 of ["BGD", "VNM"]) {
    it(`${iso3}: names a dataset as the finder card does`, async () => {
      await renderDownload(iso3);
      const row = container.querySelector('.cdp-download-item[data-element-id="A-002"]');
      expect(row).toBeTruthy();
      expect(row?.querySelector("strong")?.textContent).toBe("세계 거버넌스 지표(WGI)");
      expect(row?.textContent).not.toContain("국가 거버넌스 지표");
    });
  }

  it("names the 대분류 as the finder and the card path do", async () => {
    await renderDownload("BGD");
    expect(optionTexts("대분류")).toEqual(["전체", "국가 기본 정보", "기후 환경", "정책·제도", "시장·산업 및 재원", "협력·실행 기반"]);
  });

  it("offers organisation names in the 제공기관 filter", async () => {
    await renderDownload("BGD");
    const options = optionTexts("제공기관");
    expect(options.length).toBeGreaterThan(20);
    for (const option of options) {
      expect(option).not.toMatch(/GADM|\||^좌표|^경계 /u);
      expect(option.length).toBeLessThanOrEqual(80);
    }
  });
});
