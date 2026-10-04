import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import {
  agreementDateTextV164,
  agreementDetailV164,
  eventDateV164,
  koreanAricEventsV164,
  partiesTextV164,
  withAgreementNameV164,
} from "./agreementTimelineV164";

/** V164-3: what the agreement timelines state as a date, a name and a detail line. */
function agreement(elementId: string, name: string, normalizedAttributes: Record<string, unknown>, note: string | null = null): VietnamEntityV124 {
  return { elementId, recordId: `${elementId}-${name}`, entityType: "entity", name, normalizedAttributes, rawAttributes: {}, note, provenance: {} } as unknown as VietnamEntityV124;
}

describe("agreementDateTextV164", () => {
  it("reads Viet Nam's signing and entry-into-force columns", () => {
    expect(agreementDateTextV164(agreement("A-029", "ASEAN-중국 FTA", { yyyyMmDd: "2004-11-29", yyyyMmDd2: "2005-07-01" }))).toBe("서명 2004-11-29 · 발효 2005-07-01");
    expect(agreementDateTextV164(agreement("A-029", "TPP", { yyyyMmDd: "2016-02-04" }))).toBe("서명 2016-02-04");
    expect(agreementDateTextV164(agreement("A-029", "Laos", { yyyyMmDd2: "2024-04-08" }))).toBe("발효 2024-04-08");
  });

  it("reads Bangladesh's own column names, which the timeline did not read", () => {
    const row = agreement("A-029", "아시아·태평양 무역협정", {
      속성1_A_013_SDG세부목표코드_A_023_설비용량_MW_A_024_전압_kV_A_025_시설유형_A_029_서명일: "1975-07-31",
      속성2_A_013_정보유형_A_023_주연료_A_024_구간연장_km_A_025_추진상태_A_029_발효일: "1976-06-17",
    });
    expect(agreementDateTextV164(row)).toBe("서명 1975-07-31 · 발효 1976-06-17");
  });

  it("dates a row with no date column by the last event of its note, never by the WTO notification", () => {
    const note = "[협정약칭: BD-LKA FTA] 상태: 협상 개시 · 사건일 — 검토 개시: 2016; 협상 개시: 2021-06-16; WTO 통보: 미통보 · 협정 최초 발효일: 해당 없음(미발효)";
    expect(eventDateV164(note)).toBe("협상 개시 2021-06-16");
    expect(agreementDateTextV164(agreement("A-029", "방글라데시-스리랑카 자유무역협정", {}, note))).toBe("협상 개시 2021-06-16");
    expect(eventDateV164("사건일 — 서명: 2004-01-06; 발효(협정 최초): 2006-01-01; WTO 통보: 2008-04")).toBe("발효(협정 최초) 2006-01-01");
  });

  it("states no date when the delivery states none, and does not touch another element", () => {
    expect(agreementDateTextV164(agreement("A-029", "x", {}, "사건일 — WTO 통보: 2008-04"))).toBe("");
    expect(agreementDateTextV164(agreement("A-029", "x", {}, null))).toBe("");
    expect(agreementDateTextV164(agreement("E-014", "x", { signedDate: "2013-03-19 서명" }))).toBe("");
  });
});

describe("withAgreementNameV164", () => {
  it("names a row filed under its signing date or its status by the note's agreement name", () => {
    const dated = agreement("A-029", "2016-02-04", {}, "[협정명: Trans-Pacific Partnership (TPP)] ▣ 상태(통일): 중단");
    const pending = agreement("A-029", "검토 중", {}, "[협정명: ASEAN-Pakistan Free Trade Agreement]");
    expect(withAgreementNameV164(dated).name).toBe("Trans-Pacific Partnership (TPP)");
    expect(withAgreementNameV164(pending).name).toBe("ASEAN-Pakistan Free Trade Agreement");
  });

  it("keeps a real name, a row with no agreement name in its note, and another element", () => {
    const named = agreement("A-029", "ASEAN-한국 FTA", {}, "[협정명: Other]");
    expect(withAgreementNameV164(named)).toBe(named);
    const nameless = agreement("A-029", "2016-02-04", {}, "상태: 중단");
    expect(withAgreementNameV164(nameless)).toBe(nameless);
    const other = agreement("E-014", "2016-02-04", {}, "[협정명: X]");
    expect(withAgreementNameV164(other)).toBe(other);
  });
});

describe("partiesTextV164", () => {
  it("drops the ISO code after a country and keeps the names", () => {
    expect(partiesTextV164("일본(JPN)–방글라데시(BGD)")).toBe("일본–방글라데시");
    expect(partiesTextV164(null)).toBe("");
  });
});

describe("agreementDetailV164", () => {
  const note =
    "[협정약칭: AKFTA] · 구분: 다자/ASEAN · 상대국/지역(원문 표기): 한국 · 상태: 발효 · 한국 관련: 직접 · 비고: 한·아세안 FTA · 상태(통일): 발효 · 원천 상태표기: Signed and In Effect (2007) · 회원국(2): Republic of Korea, Viet Nam · 한국 관련: 직접 · 사건일 — 서명: 2006-08-24; 발효(협정 최초): 2007-06-01 · 협정 최초 발효일: 2007-06-01 · 해당국 발효일: 원천 미제공 · 수집 기준일: 2026-09-18 · 원천: ADB ARIC FTA Database (https://aric.adb.org/fta.php?id=1)";

  it("states a label once, drops the English status label and the address, and reads the members in Korean", () => {
    const detail = agreementDetailV164(note);
    expect(detail.match(/한국 관련/gu)).toHaveLength(1);
    expect(detail).not.toMatch(/상태\(통일\)|원천 상태표기|https?:/u);
    expect(detail).toContain("회원국(2): 대한민국·베트남");
    expect(detail).toContain("상대국/지역: 한국");
  });

  it("keeps every date and the figures of the note", () => {
    const detail = agreementDetailV164(note);
    for (const fact of ["2006-08-24", "2007-06-01", "2026-09-18", "구분: 다자/ASEAN", "ADB ARIC FTA Database", "해당국 발효일: 원천 미제공"]) expect(detail).toContain(fact);
  });

  it("tells the two statuses apart when they differ, and keeps both", () => {
    const detail = agreementDetailV164("상태: 발효 · 상태(통일): 서명(미발효)");
    expect(detail).toBe("상태: 발효 · 원천 기준 상태: 서명(미발효)");
    expect(agreementDetailV164("상태(통일): 발효")).toBe("상태: 발효");
  });

  it("does not repeat the agreement name the heading already carries, and keeps the other parts", () => {
    expect(agreementDetailV164("[협정명: Trans-Pacific Partnership (TPP)] · 상태: 중단 · 회원국(2): Japan, Mongolia")).toBe("상태: 중단 · 회원국(2): 일본·몽골");
  });

  it("leaves an unknown member in the delivered language", () => {
    expect(agreementDetailV164("회원국(3): Japan, Taipei,China, Viet Nam")).toBe("회원국(3): 일본·Taipei,China·베트남");
  });
});

describe("koreanAricEventsV164", () => {
  it("reads the registry's fixed phrases and keeps the years", () => {
    expect(koreanAricEventsV164("Upgrade Signed and in effect: 2016; Expansion Signed but not yet In effect: 2019; Review Launched: 2017")).toBe(
      "업그레이드 발효: 2016; 확대 서명(미발효): 2019; 검토 개시: 2017"
    );
  });

  it("leaves a phrase it does not know", () => {
    expect(koreanAricEventsV164("Something new: 2020")).toBe("Something new: 2020");
  });
});
