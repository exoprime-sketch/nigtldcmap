import { describe, expect, it } from "@jest/globals";

import { publicSourceOrganizationV136_1, publicTextV126 } from "./publicFieldPolicyV126";

describe("publicTextV126 separator trimming", () => {
  // The trimming rule exists to remove separators left dangling by the
  // substitutions above it. It used to take the minus sign with them, so every
  // negative number rendered through the public text path lost its sign: a
  // province that is a net carbon sink (-822,213 Mg CO2e/yr) read as an equally
  // large source, and the map popup and the detail panel disagreed about the
  // same value.
  it("keeps the sign on a negative number", () => {
    expect(publicTextV126("-822,213")).toBe("-822,213");
    expect(publicTextV126("-0.5")).toBe("-0.5");
    expect(publicTextV126("− 4,361,423")).toBe("− 4,361,423");
  });

  it("still trims a leading or trailing separator", () => {
    expect(publicTextV126("· 앞머리 구분자")).toBe("앞머리 구분자");
    expect(publicTextV126("값 · ")).toBe("값");
    expect(publicTextV126("- 항목")).toBe("항목");
  });

  it("treats a bare dash as no value", () => {
    expect(publicTextV126("-")).toBeNull();
    expect(publicTextV126("--")).toBeNull();
  });

  // B-023 and B-028 basin rows record which element's boundary file the
  // compiler reused; the reader needs the basin, not the file note.
  it("drops the boundary-file reuse note and keeps the place", () => {
    expect(publicTextV126("8대 하천유역 — B-025 폴리곤 재사용")).toBe("8대 하천유역");
  });
});

describe("publicSourceOrganizationV136_1 - internal review/status notes", () => {
  // 2026-09-29: the finder's '출처(제공기관)' filter, the finder cards and the
  // download page's attribution list showed these verbatim - a project-status
  // placeholder with no organisation named, or a real-looking description
  // that was actually just naming which internal team compiled it.
  it("drops a bare status placeholder entirely", () => {
    expect(publicSourceOrganizationV136_1("확인필요")).toBeNull();
  });

  it("drops a pending-decision placeholder even with a methodology word in front", () => {
    expect(publicSourceOrganizationV136_1("연구진 설정(발주처 협의 예정)")).toBeNull();
    expect(publicSourceOrganizationV136_1("현지조사(예정)")).toBeNull();
  });

  it("drops a value that only names who compiled a public list, not a source", () => {
    expect(publicSourceOrganizationV136_1("각 기관 공식 웹사이트(용역사 취합)")).toBeNull();
    expect(
      publicSourceOrganizationV136_1("대한민국 외교부(MOFA) / 2050 탄소중립녹색성장위원회 등 공식 발표자료(용역사 취합)")
    ).toBeNull();
  });

  it("keeps a real source description that merely mentions a field survey, absent a pending marker", () => {
    expect(publicSourceOrganizationV136_1("FAOSTAT 임산물 생산량 기반 산출 / 현지조사")).toBe(
      "FAOSTAT 임산물 생산량 기반 산출 / 현지조사"
    );
  });

  it("keeps the sheet-note handling this function already had", () => {
    expect(publicSourceOrganizationV136_1("USPTO (Google Patents 경유) — 레코드별 상이, 1.2_entity attr_14 참조")).toBe(
      "USPTO (Google Patents 경유)"
    );
  });
});
