import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { nationalPublicationTrendV132, researchRecordV132, researchCollaborationLabelV144 } from "./ResearchPatentAnalysisV132";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { countryPublicDirV158 } from "../../../data/countryContext";
import { readDownloadJsonV158 } from "../../../data/testing/downloadZipV158";

const source = readDownloadJsonV158("e-008");
const records = (source.entities as VietnamEntityV124[]).map((entity) => researchRecordV132(entity)!).filter(Boolean);

describe("E-008 delivered list analysis", () => {
  // V162 (2026-09-30 delivery): E-008 grew from 144 to 6790 entity rows and
  // gained one real observation (the international co-authorship rate,
  // E-008_paper_intl_coauth_rate) - not a code path change, the delivery is
  // simply bigger now. E-008 stays excluded from the public site in 2026
  // (본부장 결정 2026-09-29), so none of this reaches a reader; these counts
  // exist to keep the analysis code honest against the delivery it will read
  // if E-008 is re-included.
  it("carries one real observation now, not an empty series", () => {
    expect(source.observations).toHaveLength(1);
    expect(nationalPublicationTrendV132([])).toEqual([]);
  });
  it("reconciles publication-year counts to the actual 6790 records", () => {
    expect(records).toHaveLength(6790);
    expect(records.filter((record) => record.type === "논문")).toHaveLength(6761);
    expect(records.filter((record) => record.type === "특허")).toHaveLength(29);
    // The stated collection window is 2021-2026 (수집_기준_절차_DB_검색어_연도),
    // but a patent's own year is its first filing year, which can predate
    // when the delivery collected it; 13 patents predate the window, the
    // earliest at 2016. Every record still has a year (never null/NaN).
    expect(records.every((record) => typeof record.year === "number")).toBe(true);
    expect(Math.min(...records.map((record) => record.year as number))).toBe(2016);
    expect(Math.max(...records.map((record) => record.year as number))).toBe(2026);
    expect(records.filter((record) => (record.year as number) < 2021 || (record.year as number) > 2026)).toHaveLength(13);
    expect(
      records.filter((record) => (record.year as number) < 2021 || (record.year as number) > 2026).every((record) => record.type === "특허")
    ).toBe(true);
  });
  it("uses actual document years and types in the generated card, not stale catalogue metadata", () => {
    const cards = JSON.parse(readFileSync(resolve(__dirname, `../../../../${countryPublicDirV158("VNM")}/home/card-summaries-v140.json`), "utf8"));
    const card = cards.cards.find((entry: { elementId: string }) => entry.elementId === "E-008");
    // V156: while E-008 is excluded it is offered nowhere - no card is
    // generated. The card assertions return when it is offered. The catalogue
    // carries the decision file's date (data specification 2026-09-18; since
    // 2026-09-29 the 본부장 decision for 2026), not a date fixed here.
    const catalog = JSON.parse(readFileSync(resolve(__dirname, `../../../../${countryPublicDirV158("VNM")}/catalog.json`), "utf8"));
    const element = catalog.elements.find((entry: { elementId: string }) => entry.elementId === "E-008");
    if (element.publicStatus === "excluded") {
      expect(card).toBeUndefined();
      expect(element.exclusion?.reason).toBeTruthy();
      const decision = JSON.parse(readFileSync(resolve(__dirname, "../../../../config/data-publication/common-exclusions-v158.json"), "utf8"));
      const decided = decision.exclusions.find((entry: { elementId: string }) => entry.elementId === "E-008");
      expect(decided).toBeDefined();
      expect(element.exclusion?.decidedAt).toBe(decided.decidedAt);
      return;
    }
    expect(card.period).toBe("2021–2026년");
    expect(card.headline.value).toBe("144건");
    expect(card.preview.parts).toEqual([{ label: "논문", value: 114 }, { label: "특허", value: 30 }]);
    expect(card.provider).not.toMatch(/Scimago|WIPO/);
  });
  it("does not classify Netherlands or a Vietnam-first country list as domestic", () => {
    expect(researchCollaborationLabelV144("네덜란드; 베트남")).toBe("해외 협력국 포함");
    expect(researchCollaborationLabelV144("베트남; 일본")).toBe("해외 협력국 포함");
    expect(researchCollaborationLabelV144("단독출원(국내)")).toBe("국내만 표기");
    expect(researchCollaborationLabelV144("Y")).toBe("협력국 미제공");
    // V162: the 2026-09-30 delivery states this field as ISO alpha-2 codes
    // ("VN", "VN;KR;SG") rather than the Korean country names the pre-refresh
    // delivery used - "VN" alone is the domestic case, same as "베트남".
    expect(researchCollaborationLabelV144("VN")).toBe("국내만 표기");
    expect(researchCollaborationLabelV144("VN;KR")).toBe("해외 협력국 포함");
    const domestic = records.filter((record) => researchCollaborationLabelV144(record.collaboration) === "국내만 표기");
    expect(domestic).toHaveLength(2678);
    expect(records.filter((record) => researchCollaborationLabelV144(record.collaboration) === "해외 협력국 포함")).toHaveLength(4112);
  });
  it("preserves the delivered field names instead of joining codes to another taxonomy", () => {
    // V162: the 2026-09-30 delivery is an entirely new 6790-row export (the
    // pre-refresh recordIds 00009/00018 now name different documents), so
    // this is pinned to the current delivery's own first two records and one
    // clean single-class example per category instead of the old ids.
    expect(records[0].technologyClasses).toEqual(["건강"]);
    expect(records[1].technologyClasses).toEqual(["바이오에너지"]);
    const agriculture = records.find((record) => record.entity.recordId === "v124-e-008-entity-00128")!;
    const forest = records.find((record) => record.entity.recordId === "v124-e-008-entity-00115")!;
    expect(agriculture.technologyClasses).toEqual(["농축수산"]);
    expect(forest.technologyClasses).toEqual(["산림·생태계"]);
    expect(records.flatMap((record) => record.technologyClasses)).toHaveLength(7840);
  });
});
