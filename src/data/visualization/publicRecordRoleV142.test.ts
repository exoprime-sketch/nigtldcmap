import { readFileSync } from "fs";
import { describe, expect, it } from "@jest/globals";
import { resolve } from "path";

import { publicRecordRoleV142, publicRecordRoleRuleV142 } from "./publicRecordRoleV142";
import { portfolioCategoryKeyLabelV142, unlabelledPortfolioCategoryKeysV142 } from "../../components/data/public/PublicPortfolioSummaryV132";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { countryPublicDirV158 } from "../countryContext";

const download = (elementId: string) =>
  JSON.parse(readFileSync(resolve(__dirname, `../../../${countryPublicDirV158("VNM")}/downloads/${elementId.toLowerCase()}.json`), "utf8")) as { entities: VietnamEntityV124[] };

describe("publicRecordRoleV142 — D-026 guarantees vs cover definitions", () => {
  const entities = download("D-026").entities;

  it("reads nine guarantees and five cover definitions out of fourteen 개별 rows", () => {
    const roles = entities.map((entity) => publicRecordRoleV142(entity));
    expect(roles.filter((role) => role.role === "individual")).toHaveLength(9);
    expect(roles.filter((role) => role.role === "definition")).toHaveLength(5);
    expect(roles.filter((role) => role.role === "aggregate")).toHaveLength(0);
    expect(publicRecordRoleRuleV142("D-026")?.expected).toEqual({ matches: 5, sourceRows: 14 });
  });

  it("names the definitions and keeps their description", () => {
    const definitions = entities.filter((entity) => publicRecordRoleV142(entity).role === "definition");
    expect(definitions.map((entity) => entity.name).sort()).toEqual([
      "Breach of Contract",
      "Expropriation",
      "Non-Honoring of Sovereign Financial Obligations (NHSFO)",
      "Transfer Restriction / Currency Inconvertibility",
      "War and Civil Disturbance",
    ]);
    expect(publicRecordRoleV142(definitions[0]).label).toBe("보증 유형 안내");
  });

  it("does not classify by the shape of the identifier alone", () => {
    const project = entities.find((entity) => entity.name === "Hoi Xuan Hydropower Project") as VietnamEntityV124;
    const withTextId = { ...project, normalizedAttributes: { ...project.normalizedAttributes, Project_ID: "HOI-XUAN" } };
    expect(publicRecordRoleV142(withTextId).role).toBe("individual");
    const withoutFacts = { ...project, normalizedAttributes: { ...project.normalizedAttributes, 국가: "4대 PRI", 보증_금액: null, 회계연도_FY: null, 보증_유형: null, 보증_보유자_Guarantee_Holder: null } };
    expect(publicRecordRoleV142(withoutFacts).role).toBe("definition");
  });

  it("sums the guarantee amounts over the nine guarantees only", () => {
    const individual = entities.filter((entity) => publicRecordRoleV142(entity).role === "individual");
    const total = individual.reduce((sum, entity) => sum + Number(entity.normalizedAttributes["대표금액"] || 0), 0);
    expect(total).toBe(4121600000);
  });
});

describe("portfolio category dictionary — no raw key reaches a heading", () => {
  it("names every key a portfolio groups by", () => {
    expect(unlabelledPortfolioCategoryKeysV142()).toEqual([]);
  });

  it("keeps the role of an implementing entity per element", () => {
    expect(portfolioCategoryKeyLabelV142("D-018", "implementingEntity")).toMatch(/IE/u);
    expect(portfolioCategoryKeyLabelV142("D-023", "implementingEntity")).toMatch(/AE\/Agency/u);
    expect(portfolioCategoryKeyLabelV142("D-021", "implementingEntity")).toBe("실행기관");
    expect(portfolioCategoryKeyLabelV142("D-020", "accreditedEntity")).toMatch(/인가기관/u);
    expect(portfolioCategoryKeyLabelV142("D-026", "guaranteeType")).toBe("보증 유형");
    expect(portfolioCategoryKeyLabelV142("D-024", "fundingRound")).toBe("투자 라운드");
    expect(portfolioCategoryKeyLabelV142("D-022", "financeType")).toMatch(/투자 유형/u);
    expect(portfolioCategoryKeyLabelV142("D-022", "rioMarker")).toMatch(/리우 마커/u);
    expect(portfolioCategoryKeyLabelV142("D-021", "donor")).toBe("공여기관");
  });

  it("returns null, never the key, for an unregistered key", () => {
    expect(portfolioCategoryKeyLabelV142("D-021", "someInternalKey")).toBeNull();
  });
});
