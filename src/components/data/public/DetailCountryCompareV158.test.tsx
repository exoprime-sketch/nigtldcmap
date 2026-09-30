import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import DetailCountryCompareV158, {
  resetCountryCompareDocumentCacheV158,
} from "./DetailCountryCompareV158";
import { loadCountryRegistryV158, resetCountryRegistryCacheV158 } from "../../../data/countryContext";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/**
 * `DetailCountryCompareV158` fetches two static assets by relative path
 * (`data/countries.json` through the registry loader, `data/compare/
 * country-compare-v158.json` through its own loader). Both go through the
 * same `fetch`, so the mock below dispatches on the URL rather than being a
 * one-shot stub.
 */
function mockFetchJson(responses: Record<string, unknown>) {
  return jest.fn(async (input: unknown) => {
    const url = String(input);
    const match = Object.keys(responses).find((key) => url.includes(key));
    if (!match) return { ok: false, json: async () => null };
    return { ok: true, json: async () => responses[match] };
  });
}

const COMPARE_URL = "data/compare/country-compare-v158.json";

function compareDoc(elements: Record<string, unknown>) {
  return { schemaVersion: "country-compare-v158-1", elements };
}

function entry(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    countryIso3: "VNM",
    countryNameKo: "베트남",
    present: true,
    unit: "USD",
    labelKo: "GDP 총액",
    sourceOrg: "World Bank",
    points: [{ year: 2023, value: 429 }],
    ...overrides,
  };
}

const compareKey = { indicatorId: "A-003_gdp_current_usd", unit: "USD", yearRule: "latest-common" };

/** Populates the registry cache so `isLiveCountryV158` treats both countries as live. */
async function makeBothCountriesLive() {
  const fetchImpl = mockFetchJson({
    "data/countries.json": {
      schemaVersion: "countries-v158",
      countries: [
        { iso3: "VNM", nameKo: "베트남", status: "live" },
        { iso3: "BGD", nameKo: "방글라데시", status: "live" },
      ],
    },
  });
  (globalThis as { fetch?: typeof fetch }).fetch = fetchImpl as unknown as typeof fetch;
  await loadCountryRegistryV158((path) => path);
}

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  resetCountryCompareDocumentCacheV158();
  resetCountryRegistryCacheV158();
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  resetCountryCompareDocumentCacheV158();
  resetCountryRegistryCacheV158();
});

async function draw(elementId: string, countryIso3: string) {
  await act(async () => {
    root.render(<DetailCountryCompareV158 elementId={elementId} countryIso3={countryIso3} />);
    await flush();
  });
  return container;
}

describe("DetailCountryCompareV158", () => {
  test("renders nothing before the compare document has loaded and none has been published", async () => {
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({}) as unknown as typeof fetch;
    const view = await draw("A-003", "VNM");
    expect(view.innerHTML).toBe("");
  });

  test("renders nothing when the element has no comparable entry", async () => {
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({
      [COMPARE_URL]: compareDoc({}),
    }) as unknown as typeof fetch;
    const view = await draw("A-003", "VNM");
    expect(view.innerHTML).toBe("");
  });

  test("renders nothing when only one country is live, even if two are present in the data", async () => {
    // Bangladesh's series is real (the builder extracted it) but Bangladesh is
    // still `preparing`, so only Vietnam counts as live under the default
    // bundled registry - one live country is not a comparison.
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({
      [COMPARE_URL]: compareDoc({
        "A-003": {
          elementId: "A-003",
          compareKey,
          countries: {
            VNM: entry(),
            BGD: entry({ countryIso3: "BGD", countryNameKo: "방글라데시" }),
          },
        },
      }),
    }) as unknown as typeof fetch;
    const view = await draw("A-003", "VNM");
    expect(view.innerHTML).toBe("");
  });

  test("renders the comparison once both countries are live, with the displayed country first", async () => {
    await makeBothCountriesLive();
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({
      [COMPARE_URL]: compareDoc({
        "A-003": {
          elementId: "A-003",
          compareKey,
          countries: {
            // Deliberately inserted Bangladesh-first to prove the component
            // reorders rather than trusting the document's own key order.
            BGD: entry({
              countryIso3: "BGD",
              countryNameKo: "방글라데시",
              sourceOrg: "World Bank WITS",
              points: [{ year: 2023, value: 451 }],
            }),
            VNM: entry(),
          },
        },
      }),
    }) as unknown as typeof fetch;

    const view = await draw("A-003", "BGD");
    const block = view.querySelector('[data-testid="country-compare-v158"]');
    expect(block).not.toBeNull();
    const chips = view.querySelectorAll('[data-testid="country-compare-chip-v158"]');
    expect(chips).toHaveLength(2);
    expect(chips[0].textContent).toContain("방글라데시");
    expect(chips[1].textContent).toContain("베트남");
    // Differing sourceOrg values carry through to the footnote.
    expect(view.querySelector('[data-testid="country-compare-source-note-v158"]')?.textContent).toContain(
      "World Bank WITS"
    );
  });

  test("a country absent from the country's own data (present: false) is excluded", async () => {
    await makeBothCountriesLive();
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({
      [COMPARE_URL]: compareDoc({
        "A-003": {
          elementId: "A-003",
          compareKey,
          countries: {
            VNM: entry(),
            BGD: entry({ countryIso3: "BGD", countryNameKo: "방글라데시", present: false, points: [] }),
          },
        },
      }),
    }) as unknown as typeof fetch;
    const view = await draw("A-003", "VNM");
    expect(view.innerHTML).toBe("");
  });

  test("a live country the compare file has no series for gets no block, not the others' pair", async () => {
    const fetchImpl = mockFetchJson({
      "data/countries.json": {
        schemaVersion: "countries-v158",
        countries: [
          { iso3: "VNM", nameKo: "베트남", status: "live" },
          { iso3: "BGD", nameKo: "방글라데시", status: "live" },
          { iso3: "XTS", nameKo: "시험국", status: "live" },
        ],
      },
    });
    (globalThis as { fetch?: typeof fetch }).fetch = fetchImpl as unknown as typeof fetch;
    await loadCountryRegistryV158((path) => path);
    (globalThis as { fetch?: typeof fetch }).fetch = mockFetchJson({
      [COMPARE_URL]: compareDoc({
        "A-003": {
          elementId: "A-003",
          compareKey,
          countries: {
            VNM: entry(),
            BGD: entry({ countryIso3: "BGD", countryNameKo: "방글라데시", points: [{ year: 2023, value: 451 }] }),
          },
        },
      }),
    }) as unknown as typeof fetch;

    const third = await draw("A-003", "XTS");
    expect(third.innerHTML).toBe("");
    const own = await draw("A-003", "VNM");
    expect(own.querySelectorAll('[data-testid="country-compare-chip-v158"]')).toHaveLength(2);
  });
});
