import { describe, expect, it } from "@jest/globals";

import { publicRecordNoteV161, publicSourceOrganizationV136_1, publicTextV126, publicUnstatedWordingV161 } from "./publicFieldPolicyV126";

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


describe("publicSourceOrganizationV136_1 - the project's working notes (V161)", () => {
  // 2026-09-29: source lines, card providers and licence lines carried the
  // project team's working notes onto the finder cards, the detail's source
  // panel and the download page. Every public source display reads through
  // this one function; a line is judged part by part (" / ", " | ").
  it("drops a bare status placeholder or a pending decision", () => {
    expect(publicSourceOrganizationV136_1("확인필요")).toBeNull();
    expect(publicSourceOrganizationV136_1("연구진 설정(발주처 협의 예정)")).toBeNull();
    expect(publicSourceOrganizationV136_1("현지조사(예정)")).toBeNull();
  });

  it("drops a part that names the contractor or its compilation, keeping the real part", () => {
    expect(publicSourceOrganizationV136_1("각 기관 공식 웹사이트(용역사 취합)")).toBeNull();
    expect(publicSourceOrganizationV136_1("STADT(공개 1차 출처 정리)")).toBeNull();
    expect(
      publicSourceOrganizationV136_1("대한민국 외교부(MOFA) / 2050 탄소중립녹색성장위원회 등 공식 발표자료(용역사 취합)")
    ).toBe("대한민국 외교부(MOFA)");
  });

  it("drops the field-survey working file, keeping the cited organisation", () => {
    expect(
      publicSourceOrganizationV136_1("United Nations Framework Convention on Climate Change (UNFCCC) / 현지 컨설턴트 현지조사(Field Survey Items_vIDGcmt_260408_v2.0)")
    ).toBe("United Nations Framework Convention on Climate Change (UNFCCC)");
    expect(
      publicSourceOrganizationV136_1("공개 원천: Climate Technology Centre and Network (CTCN) | 현지조사: 현지 컨설턴트 현지조사(Field Survey Items_vIDGcmt_260408_v2.0)")
    ).toBe("Climate Technology Centre and Network (CTCN)");
    expect(publicSourceOrganizationV136_1("FAOSTAT 임산물 생산량 기반 산출 / 현지조사")).toBe("FAOSTAT 임산물 생산량 기반 산출");
  });

  it("drops a placeholder for a missing source and a working-file name", () => {
    expect(publicSourceOrganizationV136_1("원천 미기재")).toBeNull();
    expect(publicSourceOrganizationV136_1("Field Survey Items_v2.0.xlsx")).toBeNull();
  });

  it("keeps the licence terms and drops only the sentence that is a working note", () => {
    expect(
      publicSourceOrganizationV136_1(
        "CC BY 4.0 · 출처표시 조건. 다운로드 제공 대상은 원천 파일이 아니라 용역사가 재편집한 표준서식 자료임."
      )
    ).toBe("CC BY 4.0 · 출처표시 조건.");
  });

  it("keeps a line with no note untouched, separators included", () => {
    expect(publicSourceOrganizationV136_1("Global Forest Watch (분자) / FAOSTAT Land Use (분모)")).toBe(
      "Global Forest Watch (분자) / FAOSTAT Land Use (분모)"
    );
    expect(publicSourceOrganizationV136_1("U.S. EIA International Energy Statistics (Bulk File INTL.txt)")).toBe(
      "U.S. EIA International Energy Statistics (Bulk File INTL.txt)"
    );
  });

  it("keeps the sheet-note handling this function already had", () => {
    expect(publicSourceOrganizationV136_1("USPTO (Google Patents 경유) — 레코드별 상이, 1.2_entity attr_14 참조")).toBe(
      "USPTO (Google Patents 경유)"
    );
  });
});

describe("publicRecordNoteV161 - a record note's own source citation", () => {
  it("drops a citation that is only a working note, keeping the rest of the note", () => {
    expect(
      publicRecordNoteV161("Decree 06/2022/ND-CP 제18조 · 출처: 현지조사(Field Survey Items_vIDGcmt_260408_v2.0, 현지 컨설턴트)")
    ).toBe("Decree 06/2022/ND-CP 제18조");
    expect(publicRecordNoteV161("출처: 현지조사(Field Survey Items_vIDGcmt_260408_v2.0, 현지 컨설턴트)")).toBeNull();
  });

  it("keeps a real citation and any note that cites nothing", () => {
    expect(publicRecordNoteV161("출처: World Bank")).toBe("출처: World Bank");
    expect(publicRecordNoteV161("2026-08-14 기준 미제출")).toBe("2026-08-14 기준 미제출");
  });
});

describe("publicUnstatedWordingV161", () => {
  it("reads the delivery's 원천 미기재 as 미기재 and leaves other text alone", () => {
    expect(publicUnstatedWordingV161("원천 미기재")).toBe("미기재");
    expect(publicUnstatedWordingV161("시행기관: 원천미기재")).toBe("시행기관: 미기재");
    expect(publicUnstatedWordingV161("Biomass power")).toBe("Biomass power");
  });
});
