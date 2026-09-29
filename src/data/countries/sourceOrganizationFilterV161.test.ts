import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { publicSourceOrganizationV136_1 } from "../visualization/publicFieldPolicyV126";
import { getCardSpecV159 } from "../spec/datasetSpecV159";
import { countryDataRootV158 } from "../countryContext";

/**
 * 2026-09-29: the finder's 제공기관(출처) filter listed internal review notes
 * as if they were institutions - a project-status placeholder ("확인필요",
 * "…(발주처 협의 예정)", "현지조사(예정)") or a note about which internal team
 * compiled a public list ("…(용역사 취합)"). This mirrors the mapping
 * vietnamCountryDataProviderV122.ts does on the published catalog, so a stale
 * data delivery that reintroduces the pattern fails here rather than on screen.
 */
const CATALOG = JSON.parse(readFileSync(resolve(__dirname, "../../../public", `.${countryDataRootV158("VNM")}`, "catalog.json"), "utf8")) as {
  elements: { elementId: string; sourceOrganizations: string[] }[];
};

function publicSourceOrganizations(elementId: string): string[] {
  const element = CATALOG.elements.find((row) => row.elementId === elementId);
  if (!element) throw new Error(`fixture element missing from the catalog: ${elementId}`);
  const named = element.sourceOrganizations
    .map((organization) => publicSourceOrganizationV136_1(organization))
    .filter((organization): organization is string => organization !== null);
  return named.length > 0 ? named : [getCardSpecV159(elementId)?.sourceLabel].filter((label): label is string => Boolean(label));
}

describe("the finder's source filter never lists an internal review note", () => {
  test("no public source name still carries a status placeholder or a compiler note", () => {
    const marker = /확인필요|발주처|용역사|현지조사\(예정\)/u;
    const offenders = CATALOG.elements.flatMap((element) => publicSourceOrganizations(element.elementId).filter((name) => marker.test(name)).map((name) => `${element.elementId}: ${name}`));
    expect(offenders).toEqual([]);
  });

  // An element whose only recorded organisations were notes falls back to the
  // one source name the framework spec (v5.38) already gives its card - never
  // to an empty, unstated source.
  test.each([
    ["E-005", "NIGT 취합"],
    ["E-014", "외교부 외"],
    ["E-018", "NIGT 취합"],
    ["E-019", "NIGT 취합"],
    ["E-020", "KEITI 외"],
  ])("%s: every recorded organisation was a note, so the card's own source name (%s) is used", (elementId, sourceLabel) => {
    expect(publicSourceOrganizations(elementId)).toEqual([sourceLabel]);
  });

  // An element with a real organisation alongside a note keeps only the real one.
  test.each([
    ["B-044", ["USGS Mineral Commodity Summaries 2026", "USGS Mineral Commodity Summaries 2026; USGS Minerals Yearbook Vietnam 2022"]],
    ["E-007", ["Global Environment Facility (GEF)", "United Nations Framework Convention on Climate Change (UNFCCC)", "베트남 농업환경부(Ministry of Agriculture and Environment, MAE)", "베트남 정부(Government of Viet Nam)"]],
    ["E-010", ["World Bank (UNESCO Institute for Statistics 원자료)", "World Intellectual Property Organization (WIPO)"]],
  ])("%s: the note is dropped, the real organisations stay", (elementId, expected) => {
    expect(publicSourceOrganizations(elementId)).toEqual(expected);
  });
});
