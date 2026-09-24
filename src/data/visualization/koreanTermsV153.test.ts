import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { climateZoneLabelV153, isUntranslatedV153, koreanTermV153 } from "./koreanTermsV153";
import { countryPublicDirV158 } from "../countryContext";

test("English terms print Korean first with the source wording in parentheses", () => {
  expect(koreanTermV153("BOT(Build-Operate-Transfer)")).toBe("건설·운영·이전(BOT(Build-Operate-Transfer))");
  expect(koreanTermV153("BLT")).toBe("건설·임대·이전(BLT)");
  expect(koreanTermV153("Energy(에너지)")).toBe("에너지(Energy)");
  expect(koreanTermV153("Competitive bidding(경쟁입찰)")).toBe("경쟁입찰(Competitive bidding)");
  expect(koreanTermV153("Energy 9건; Transport 8건")).toBe("에너지(Energy) 9건; 수송(Transport) 8건");
  expect(koreanTermV153("Active 23건 / 전체 24건")).toBe("운영·건설 중(Active) 23건 / 전체 24건");
  expect(koreanTermV153("Law No. 64/2020/QH14")).toBe("법률 제64/2020/QH14호(PPP 투자법)(Law No. 64/2020/QH14)");
  expect(koreanTermV153("명칭 현행 PPP 기본법")).toBe("명칭 현행 PPP 기본법");
  expect(koreanTermV153("")).toBe("");
});

test("climate zone labels are Korean(code)", () => {
  expect(climateZoneLabelV153("Cwa (온대·동계건조·고온하계)")).toBe("온대·동계건조·고온하계(Cwa)");
  expect(climateZoneLabelV153("Aw")).toBe("열대사바나(Aw)");
  expect(climateZoneLabelV153("시기·시나리오별")).toBe("시기·시나리오별");
});

test("every C-012 item name and value the source states is covered", () => {
  const bundle = JSON.parse(
    readFileSync(resolve(__dirname, `../../../${countryPublicDirV158("VNM")}/downloads/c-012.json`), "utf8")
  ) as { entities: { normalizedAttributes: Record<string, unknown> }[] };
  const untranslated = new Set<string>();
  for (const entity of bundle.entities) {
    for (const key of ["속성1_레코드명", "속성3_값", "속성6_분류", "속성7_상태"]) {
      const value = entity.normalizedAttributes[key];
      if (value && isUntranslatedV153(value)) untranslated.add(String(value));
    }
  }
  // Proper nouns and portal host names stay as written; nothing else may.
  // Portal host names are proper nouns and stay as written.
  const allowed = new Set(["PPP 대상 분야(제4조 제1항)", "PPP 사업 현황 발표(2023-07-11)", "정부 PPP 사업 통계 공표 페이지", "명칭 현행 PPP 기본법", "thuvienphapluat.vn(영문)"]);
  expect([...untranslated].filter((value) => !allowed.has(value)).sort()).toEqual([]);
});
