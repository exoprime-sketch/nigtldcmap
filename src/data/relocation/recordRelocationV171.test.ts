import { describe, expect, it } from "@jest/globals";

import {
  isMapWithdrawnV171,
  movedRecordsV171,
  recordsKeptV171,
  relocationFromV171,
  relocationIntoV171,
  sameInstitutionV171,
} from "./recordRelocationV171";

const row = (recordId: string, indicatorId: string, orgName: string) => ({
  recordId,
  indicatorId,
  name: orgName,
  normalizedAttributes: { orgName },
});

describe("V171 record relocation (E-001 → E-005, E-002 → C-025)", () => {
  it("keeps only the designated body on E-001 and E-002", () => {
    const e001 = [
      row("1", "E-001_ctcn_nde", "Ministry of Natural Resources and Environment (MONRE)"),
      row("2", "E-001_ctcn_network_member", "Institute of Energy"),
      row("3", "E-001_ctcn_ta_proponent", "Electric Power University (EPU)"),
    ];
    expect(recordsKeptV171("E-001", e001).map((r) => r.recordId)).toEqual(["1"]);
    const e002 = [row("a", "E-002_dna", "Department of Climate Change"), row("b", "E-002_cdm_transition", "Nam Pia Hydropower Project")];
    expect(recordsKeptV171("E-002", e002).map((r) => r.recordId)).toEqual(["a"]);
    // Other elements are untouched.
    expect(recordsKeptV171("E-005", e001)).toBe(e001);
  });

  it("names the source and target of each move, and withdraws the two map layers", () => {
    expect(relocationFromV171("E-001")?.targetElementId).toBe("E-005");
    expect(relocationIntoV171("C-025")?.sourceElementId).toBe("E-002");
    expect(relocationFromV171("C-025")).toBeNull();
    expect(isMapWithdrawnV171("E-001")).toBe(true);
    expect(isMapWithdrawnV171("E-002")).toBe(true);
    expect(isMapWithdrawnV171("E-005")).toBe(false);
  });

  it("lists an institution once when the target already has it", () => {
    const rule = relocationIntoV171("E-005")!;
    const source = [
      row("1", "E-001_ctcn_nde", "MONRE"),
      row("2", "E-001_ctcn_network_member", "Institute of Energy"),
      row("3", "E-001_ctcn_network_member", "Vietnam Institute of Meteorology, Hydrology and Climate Change (IMHEN)"),
      row("4", "E-001_ctcn_ta_proponent", "Electric Power University (EPU)"),
    ];
    const target = [
      row("t1", "E-005_research_institution", "Institute of Energy (IE/IEVN, MOIT 산하)"),
      row("t2", "E-005_research_institution", "Viet Nam Institute of Meteorology, Hydrology & Climate Change (IMHEN)"),
    ];
    expect(movedRecordsV171(rule, source, target).map((r) => r.recordId)).toEqual(["4"]);
  });

  it("moves every CDM activity a target does not already list", () => {
    const rule = relocationIntoV171("C-025")!;
    const source = [row("d", "E-002_dna", "DCC"), row("c1", "E-002_cdm_transition", "Project A"), row("c2", "E-002_cdm_transition", "Project B")];
    expect(movedRecordsV171(rule, source, []).map((r) => r.recordId)).toEqual(["c1", "c2"]);
    const already = [row("x", "C-0252_cdm_transition", "Project A")];
    expect(movedRecordsV171(rule, source, already).map((r) => r.recordId)).toEqual(["c2"]);
  });

  it("does not treat short or unrelated names as the same institution", () => {
    expect(sameInstitutionV171("BRAC", "BRAC University")).toBe(false);
    expect(sameInstitutionV171("Bangladesh Centre for Advanced Studies (BCAS)", "BCAS head office (BCAS)")).toBe(true);
    expect(sameInstitutionV171("Institute of Energy", "Institute for Agriculture Environment (IAE)")).toBe(false);
  });
});
