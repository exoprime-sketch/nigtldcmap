import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { nationalPublicationTrendV132, researchRecordV132, researchCollaborationLabelV144 } from "./ResearchPatentAnalysisV132";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";

const source = JSON.parse(readFileSync(resolve(__dirname, "../../../../public/data/vietnam/v2/downloads/e-008.json"), "utf8"));
const records = (source.entities as VietnamEntityV124[]).map((entity) => researchRecordV132(entity)!).filter(Boolean);

describe("E-008 delivered list analysis", () => {
  it("never renders two empty national series as an existing trend", () => {
    expect(source.observations).toHaveLength(0);
    expect(nationalPublicationTrendV132([])).toEqual([]);
  });
  it("reconciles publication-year counts to the actual 144 records", () => {
    expect(records).toHaveLength(144);
    expect(records.filter((record) => record.type === "논문")).toHaveLength(114);
    expect(records.filter((record) => record.type === "특허")).toHaveLength(30);
    expect(records.every((record) => record.year && record.year >= 2021 && record.year <= 2026)).toBe(true);
  });
  it("uses actual document years and types in the generated card, not stale catalogue metadata", () => {
    const cards = JSON.parse(readFileSync(resolve(__dirname, "../../../../public/data/vietnam/v2/home/card-summaries-v140.json"), "utf8"));
    const card = cards.cards.find((entry: { elementId: string }) => entry.elementId === "E-008");
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
    const domestic = records.filter((record) => researchCollaborationLabelV144(record.collaboration) === "국내만 표기");
    expect(domestic).toHaveLength(63);
    expect(records.filter((record) => researchCollaborationLabelV144(record.collaboration) === "해외 협력국 포함")).toHaveLength(81);
  });
  it("preserves the delivered field names instead of joining codes to another taxonomy", () => {
    expect(records[0].technologyClasses).toEqual(["기후변화 취약성·위험성 평가"]);
    expect(records[1].technologyClasses).toEqual(["기후변화 감시·진단"]);
    const agriculture = records.find((record) => record.entity.recordId === "v124-e-008-entity-00009")!;
    const forest = records.find((record) => record.entity.recordId === "v124-e-008-entity-00018")!;
    expect(agriculture.technologyClasses).toEqual(["농축수산"]);
    expect(forest.technologyClasses).toEqual(["산림·생태계"]);
    expect(records.flatMap((record) => record.technologyClasses)).toHaveLength(144);
  });
});
