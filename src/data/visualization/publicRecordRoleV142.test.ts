import { describe, expect, it } from "@jest/globals";

import { publicRecordRoleV142, publicRecordRoleRuleV142 } from "./publicRecordRoleV142";
import { portfolioCategoryKeyLabelV142, unlabelledPortfolioCategoryKeysV142 } from "../../components/data/public/PublicPortfolioSummaryV132";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { readDownloadJsonV158 } from "../testing/downloadZipV158";

const download = (elementId: string) =>
  readDownloadJsonV158(elementId) as { entities: VietnamEntityV124[] };

describe("publicRecordRoleV142 — D-026 guarantees vs cover definitions", () => {
  const entities = download("D-026").entities;

  // 2026-09-30 재적재: D-026이 13행 전부 레코드구분=MIGA 보증사업으로 전면 교체됨.
  // 과거 5건의 '보증 유형 설명' 행(계약위반·비이행보증·수용·이전제한·전쟁내란)은 이번
  // 납품에 없다(ETL 비고: 그 구분은 이제 개별 Guarantee Summary 문서에만 존재).
  it("reads all thirteen rows as guarantees now that the source ships no cover-type rows", () => {
    const roles = entities.map((entity) => publicRecordRoleV142(entity));
    expect(roles.filter((role) => role.role === "individual")).toHaveLength(13);
    expect(roles.filter((role) => role.role === "definition")).toHaveLength(0);
    expect(roles.filter((role) => role.role === "aggregate")).toHaveLength(0);
    expect(publicRecordRoleRuleV142("D-026")?.expected).toEqual({ matches: 0, sourceRows: 13 });
  });

  it("keeps the definition rule dormant (no cover-type rows in the current delivery)", () => {
    const definitions = entities.filter((entity) => publicRecordRoleV142(entity).role === "definition");
    expect(definitions).toHaveLength(0);
    // The rule still labels a matching row correctly if one ever reappears (see
    // "does not classify by the shape of the identifier alone" below).
  });

  it("does not classify by the shape of the identifier alone", () => {
    const project = entities.find((entity) => entity.name === "Hoi Xuan Hydropower Project") as VietnamEntityV124;
    const withTextId = { ...project, normalizedAttributes: { ...project.normalizedAttributes, Project_ID: "HOI-XUAN" } };
    expect(publicRecordRoleV142(withTextId).role).toBe("individual");
    const withoutFacts = { ...project, normalizedAttributes: { ...project.normalizedAttributes, 국가: "4대 PRI", 보증_금액: null, 회계연도_FY: null, 보증_유형: null, 보증_보유자_Guarantee_Holder: null } };
    expect(publicRecordRoleV142(withoutFacts).role).toBe("definition");
  });

  // 대표금액은 이번 납품부터 USD 백만 단위로 온다(원자료 문서 비고: "MIGA issued a
  // guarantee of $239.7 million" 등 개별 서술과 정확히 일치). 원천이 밝힌 단위를 그대로
  // 쓰며 임의로 곱해 원 단위로 바꾸지 않는다.
  it("sums the guarantee amounts over all thirteen guarantee rows, in the USD millions the source states", () => {
    const individual = entities.filter((entity) => publicRecordRoleV142(entity).role === "individual");
    const total = individual.reduce((sum, entity) => sum + Number(entity.normalizedAttributes["대표금액"] || 0), 0);
    expect(total).toBe(4716);
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
