import { describe, expect, test } from "@jest/globals";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { AUTHORED_COUNTRY_VARIANTS_V158, variantForCountryV158 } from "./variantCountryScopeV158";
import { ELEMENT_VARIANTS_V159, type TemplateVariantKeyV159 } from "./templateVariantsV159";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../../../data/countryContext";
import { findCountryTermsV158, otherCountryTermsV158 } from "../../../data/countries/countryTermsV158";

const ROOT = resolve(__dirname, "../../../..");
const SRC = resolve(ROOT, "src");
const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8"));
const defaultEntry = registry.countries.find((row: { iso3: string }) => row.iso3 === DEFAULT_COUNTRY_ISO3_V158);
const otherIso3: string = registry.countries.find((row: { iso3: string }) => row.iso3 !== DEFAULT_COUNTRY_ISO3_V158).iso3;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.tsx?$/u.test(name) ? [path] : [];
  });
}
const sources = walk(SRC).filter((path) => !/\.test\.tsx?$/u.test(path));
const componentFile = (name: string) =>
  sources.find((path) => new RegExp(`function ${name}\\b`, "u").test(readFileSync(path, "utf8")));

/** Variant → the components its router case renders. */
function variantComponents(): Map<string, string[]> {
  const router = readFileSync(resolve(SRC, "components/data/public/PublicDataAnalysisRouterV126.tsx"), "utf8");
  const start = router.indexOf("const renderVariantV159");
  const body = router.slice(start, router.indexOf("const isStatusV159", start));
  const map = new Map<string, string[]>();
  for (const chunk of body.split(/case "/u).slice(1)) {
    const variant = chunk.slice(0, chunk.indexOf('"'));
    const components = Array.from(new Set(Array.from(chunk.matchAll(/<([A-Z][A-Za-z0-9]*V\d[\d_]*)\b/gu)).map((m) => m[1])));
    map.set(variant, components);
  }
  return map;
}

// What a non-default screen must not show: the other countries' names and
// places (the same terms the spec filter hides) and the default country's own
// administrative wording from the registry ("성·시", "34개").
const terms = otherCountryTermsV158(otherIso3);
const adminWords = [defaultEntry.adm.level1.label, `${defaultEntry.adm.level1.count}개`].filter(Boolean);

describe("authored-country variants V158", () => {
  test("every variant whose component carries the authoring country's wording is listed", () => {
    const unlisted: string[] = [];
    for (const [variant, components] of variantComponents()) {
      const text = components
        .map((name) => componentFile(name))
        .filter((path): path is string => Boolean(path))
        .map((path) => readFileSync(path, "utf8"))
        .join("\n");
      const authored = findCountryTermsV158(text, terms).length > 0 || adminWords.some((word) => text.includes(word));
      if (authored && !AUTHORED_COUNTRY_VARIANTS_V158.has(variant as TemplateVariantKeyV159)) unlisted.push(variant);
    }
    expect(unlisted).toEqual([]);
  });

  test("the default country keeps every variant; another country skips the authored ones", () => {
    for (const [elementId, entry] of Object.entries(ELEMENT_VARIANTS_V159)) {
      expect(variantForCountryV158(elementId, DEFAULT_COUNTRY_ISO3_V158)).toEqual(entry);
      const expected = AUTHORED_COUNTRY_VARIANTS_V158.has(entry.variant) ? null : entry;
      expect(variantForCountryV158(elementId, otherIso3)).toEqual(expected);
    }
  });
});
