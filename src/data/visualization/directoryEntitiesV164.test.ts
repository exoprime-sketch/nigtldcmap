import { describe, expect, it } from "@jest/globals";

import { directoryCountsV142 } from "../../components/data/semantic/SemanticContractRendererV125";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { cdmActivityRowV164, isCdmActivityRowV164, splitCdmActivitiesV164, withDirectoryKeysV164 } from "./directoryEntitiesV164";
import { resolvePublicEntityTitleV131 } from "./publicEntityTitleV131";

/** V164-3: a directory row from a delivery with Korean-named columns is a named institution. */
function entityOf(elementId: string, name: string, normalizedAttributes: Record<string, unknown>, indicatorId = `${elementId}_x`): VietnamEntityV124 {
  return {
    elementId,
    indicatorId,
    recordId: `${elementId}-${name}-${Object.values(normalizedAttributes).join("").length}`,
    entityType: "entity",
    countryIso3: "BGD",
    name,
    normalizedAttributes,
    rawAttributes: {},
    note: null,
    provenance: {},
  } as unknown as VietnamEntityV124;
}

describe("withDirectoryKeysV164", () => {
  it("reads the Korean-named organisation column, so a card is titled with the institution and not its role", () => {
    const row = entityOf("E-001", "네트워크 회원", { 기관명_org_name_공식_영문명: "Bangladesh Bank", 기관_유형_org_category: "중앙은행" });
    const title = resolvePublicEntityTitleV131(withDirectoryKeysV164(row), { template: "partner", elementTitle: "NDE 기관" }).title;
    expect(title).toBe("Bangladesh Bank");
    expect(withDirectoryKeysV164(row).normalizedAttributes.orgCategory).toBe("중앙은행");
  });

  it("titles the E-004, E-006 and E-003 rows with their institution", () => {
    const office = entityOf("E-004", "다자개발은행", { 기관명_org_name: "World Bank Dhaka Office", 기관_유형_org_type: "다자개발은행" });
    const investor = entityOf("E-006", "AC(액셀러레이터)", { 기관명_org_name: "Grameen Capital", 기관_유형_framework_분류: "AC(액셀러레이터)" });
    const contact = entityOf("E-003", "직접접근 인증기관(DAE) 담당", { 소속기관_org_name: "IDCOL", 담당자명_person_name_원본_표기_경칭_제거: "Md. Karim", 직함_title: "Manager" });
    expect(resolvePublicEntityTitleV131(withDirectoryKeysV164(office), { template: "partner" }).title).toBe("World Bank Dhaka Office");
    expect(resolvePublicEntityTitleV131(withDirectoryKeysV164(investor), { template: "partner" }).title).toBe("Grameen Capital");
    const keyed = withDirectoryKeysV164(contact).normalizedAttributes;
    expect(keyed.orgName).toBe("IDCOL");
    expect(keyed.focalPointName).toBe("Md. Karim");
    expect(keyed.focalPointTitle).toBe("Manager");
  });

  it("never overwrites a key the row already has, and returns a row with nothing to add as it is", () => {
    const own = entityOf("E-005", "x", { orgName: "Own Name", organizationName: "Own Name", 기관명: "Other Name" });
    expect(withDirectoryKeysV164(own)).toBe(own);
    expect(withDirectoryKeysV164(own).normalizedAttributes.orgName).toBe("Own Name");
    const english = entityOf("E-005", "x", { orgName: "Own Name", city: "Dhaka" });
    expect(withDirectoryKeysV164(english)).toBe(english);
    const empty = entityOf("E-005", "x", { 기관명_org_name: "  ", 도시_city: null });
    expect(withDirectoryKeysV164(empty)).toBe(empty);
  });
});

describe("directoryCountsV142 on a Korean-named delivery", () => {
  it("counts institutions by their own names, as many as there are rows", () => {
    const rows = ["A Bank", "B Bank", "C Fund"].map((name) => entityOf("E-006", "DFI", { 기관명_org_name: name }));
    const counts = directoryCountsV142(rows);
    expect(counts.organisations).toEqual(["A Bank", "B Bank", "C Fund"]);
    expect(counts.contacts).toBe(0);
  });

  it("counts the contact persons of an institution apart from the institutions", () => {
    const rows = [
      entityOf("E-003", "담당", { 소속기관_org_name: "MOF", 담당자명_person_name: "Person 1" }),
      entityOf("E-003", "담당", { 소속기관_org_name: "MOF", 담당자명_person_name: "Person 2" }),
      entityOf("E-003", "담당", { 소속기관_org_name: "BIDV", 담당자명_person_name: "Person 3" }),
    ];
    const counts = directoryCountsV142(rows);
    expect(counts.organisations).toEqual(["MOF", "BIDV"]);
    expect(counts.contacts).toBe(3);
  });
});

describe("CDM activities in the register of designated authorities", () => {
  const authority = entityOf("E-002", "Department of Environment", { 기관명: "Department of Environment", 대상_분야: "국가지정기관(DNA)", 현행여부: "현행" }, "E-002_dna");
  const project = entityOf(
    "E-002",
    "Improved Cook Stove Program",
    { 기관명: "Improved Cook Stove Program", 대상_분야: "CDM 전환 활동 — 프로그램(PoA)", 현행여부: "제6.4조 등록 완료", 승인_절차_개요: "Reference Number 10538 · PoA · Host Party: Bangladesh (단독)" },
    "E-002_cdm_transition"
  );

  it("tells an activity from the authority by its indicator or its field", () => {
    expect(isCdmActivityRowV164(project)).toBe(true);
    expect(isCdmActivityRowV164(authority)).toBe(false);
    expect(isCdmActivityRowV164(entityOf("E-002", "x", { 대상_분야: "CDM 전환 활동 — 사업(Project)" }, "E-002"))).toBe(true);
  });

  it("separates the activities from the institutions, and loses no row", () => {
    const { institutions, activities } = splitCdmActivitiesV164([authority, project, project]);
    expect(institutions).toEqual([authority]);
    expect(activities).toHaveLength(2);
  });

  it("leaves a sheet that is only activities, or has none, in one list", () => {
    expect(splitCdmActivitiesV164([project, project])).toEqual({ institutions: [project, project], activities: [] });
    expect(splitCdmActivitiesV164([authority])).toEqual({ institutions: [authority], activities: [] });
  });

  it("lists an activity by its name, kind, status and the source's procedure line", () => {
    expect(cdmActivityRowV164(project)).toMatchObject({
      name: "Improved Cook Stove Program",
      kind: "프로그램(PoA)",
      status: "제6.4조 등록 완료",
      procedure: "Reference Number 10538 · PoA · Host Party: Bangladesh (단독)",
    });
  });
});
