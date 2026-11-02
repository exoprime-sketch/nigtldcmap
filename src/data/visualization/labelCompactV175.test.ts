import { describe, expect, it } from "@jest/globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { commonHeadV175, compactLabelV175, namedInV175, withoutHeadV175, withoutLeadingNameV175 } from "./labelCompactV175";

describe("a label says each thing once (V175)", () => {
  it("keeps the fuller part when another part repeats its words", () => {
    expect(compactLabelV175("1차 에너지 소비 · 석탄 — 석탄 1차에너지 소비량")).toBe("석탄 1차에너지 소비량");
    expect(compactLabelV175("석탄 · 석탄 1차에너지 소비량")).toBe("석탄 1차에너지 소비량");
    expect(compactLabelV175("1차에너지 공급 총계 — 1차에너지 공급 총계 1차에너지 소비량")).toBe("1차에너지 공급 총계 1차에너지 소비량");
    expect(compactLabelV175("통관 · 통관 부문 점수(1=낮음 ~ 5=높음)")).toBe("통관 부문 점수(1=낮음 ~ 5=높음)");
    expect(compactLabelV175("국가빈곤선 · 국가 빈곤선 이하 인구 비율")).toBe("국가 빈곤선 이하 인구 비율");
    expect(compactLabelV175("Q1 · 정기선 해운 연결성 지수(Q1 분기값)")).toBe("정기선 해운 연결성 지수(Q1 분기값)");
    expect(compactLabelV175("부문별 배출량 · 발전 — 발전 부문 온실가스 배출량(CO2+CH4+N2O, LULUCF 제외)")).toBe(
      "부문별 배출량 — 발전 부문 온실가스 배출량(CO2+CH4+N2O, LULUCF 제외)"
    );
  });

  it("drops the same part said twice, keeping the first", () => {
    expect(compactLabelV175("기타 — KOTRA: 기타")).toBe("KOTRA: 기타");
    expect(compactLabelV175("A · B · A")).toBe("A · B · A"); // one-letter parts are left alone
    expect(compactLabelV175("에너지 · 발전 · 에너지")).toBe("에너지 · 발전");
  });

  it("matches whole words only", () => {
    // "기후" is a sector here; "기후기술" is another word.
    const label = "임팩트 투자 현황 · 기후 · 에너지 섹터 조달액(2025) · 방글라데시 기후기술 집계값";
    expect(compactLabelV175(label)).toBe(label);
    expect(compactLabelV175("재원 — 재원소요 GDP 대비 상한")).toBe("재원 — 재원소요 GDP 대비 상한");
    expect(compactLabelV175("연평균 기온 · 중앙값")).toBe("연평균 기온 · 중앙값");
  });

  it("does not split inside brackets or take a word from the middle of a list", () => {
    const bracketed = "인센티브 유형 — 현행 가격제도 (전환기 · DPPA · 자가소비) · 옥상태양광 잉여전력 판매 상한 — 넷미터링(상계거래) 아님 — 자가소비 우선";
    expect(compactLabelV175(bracketed)).toBe(bracketed);
    // "모니터링 · 평가(M&E) 체계" is one name; its first word is not the later list's "모니터링·평가".
    const named = "모니터링 · 평가(M&E) 체계 법적 근거 — 국가 CCA 모니터링·평가 체계 총리 결정";
    expect(compactLabelV175(named)).toBe(named);
    expect(compactLabelV175("산업구조 · 농림어업 — GDP 대비 농림어업 부가가치 비중")).toBe("산업구조 — GDP 대비 농림어업 부가가치 비중");
  });

  it("never drops a part for being inside an earlier one", () => {
    // The measure names both series; "적응" / "감축" is what tells them apart.
    const label = "감축/적응 구분별 예산 배분 비율 · 적응 — FY2026-27 배분액";
    expect(compactLabelV175(label)).toBe(label);
  });

  it("leaves a sentence part alone", () => {
    const label = "메콩 본류 · 캄보디아 크라체 · MRC 상설 수문관측소. 메콩 본류 델타 진입 직전 기준지점";
    expect(compactLabelV175(label)).toBe(label);
  });

  it("leaves a one-part label as written", () => {
    expect(compactLabelV175("성·시 중앙값")).toBe("성·시 중앙값");
    expect(compactLabelV175("")).toBe("");
    expect(compactLabelV175(undefined)).toBe("");
  });
});

describe("a card headline does not repeat the card's name (V175)", () => {
  it("starts after the name", () => {
    expect(withoutLeadingNameV175("빈곤율 · 국가빈곤선 · 2022년", ["빈곤율"])).toBe("국가빈곤선 · 2022년");
    expect(withoutLeadingNameV175("송배전 손실률 · 2023년", ["송배전 손실률"])).toBe("2023년");
    expect(withoutLeadingNameV175("농업 용수 취수 비중 · 2023년", ["농업용수 취수 비중"])).toBe("2023년");
    expect(withoutLeadingNameV175("기술지원 요청 · 2015–2025년", ["기술지원 요청 현황"])).toBe("2015–2025년");
  });

  it("keeps a part that says more than the name", () => {
    expect(withoutLeadingNameV175("월 평년강수 최대 · 8월", ["월 평년강수"])).toBe("월 평년강수 최대 · 8월");
    expect(withoutLeadingNameV175("CPI 점수 · 2025년", ["부패인식지수(CPI)"])).toBe("CPI 점수 · 2025년");
    expect(withoutLeadingNameV175("빈곤율", ["빈곤율"])).toBe("빈곤율");
  });
});

describe("a list names its shared part once (V175)", () => {
  it("finds and drops the part every item starts with", () => {
    const labels = ["인구 전 구간 — SSP1", "인구 전 구간 — SSP2", "인구 전 구간 — SSP3"];
    const head = commonHeadV175(labels);
    expect(head).toBe("인구 전 구간");
    expect(labels.map((label) => withoutHeadV175(label, head))).toEqual(["SSP1", "SSP2", "SSP3"]);
    expect(namedInV175(head, "인구 전 구간 · 2020~2100년 추이")).toBe(true);
    expect(namedInV175(head, "인구 전망")).toBe(false);
  });

  it("finds nothing when an item differs or says only the head", () => {
    expect(commonHeadV175(["전력 접근률 · 농촌", "전력 접근률"])).toBeNull();
    expect(commonHeadV175(["전력 접근률 · 농촌", "전기 보급률 · 도시"])).toBeNull();
    expect(commonHeadV175(["전력 접근률 · 농촌"])).toBeNull();
  });
});

describe("compacting never merges two series (V175)", () => {
  // Every delivered series label of both countries: two labels that differ
  // must still differ after the rule, or a chart would draw them as one.
  // The live countries' published trees, as the country registry lists them.
  const registry = JSON.parse(readFileSync(join("public", "data", "countries.json"), "utf8")) as {
    countries: Array<{ iso3: string; status?: string; dataRoot?: string }>;
  };
  const roots = registry.countries
    .filter((country) => country.status === "live" && country.dataRoot)
    .map((country) => join("public", String(country.dataRoot), "semantic", "elements"));
  it("covers both live countries", () => expect(roots.length).toBeGreaterThanOrEqual(2));
  it.each(roots)("%s", (root) => {
    const collisions: string[] = [];
    let labels = 0;
    readdirSync(root)
      .filter((file) => file.endsWith(".json"))
      .forEach((file) => {
        const element = JSON.parse(readFileSync(join(root, file), "utf8")) as {
          indicators?: Array<{ displayLabel?: string }>;
          records?: Array<{ displayLabel?: string }>;
        };
        const originals = new Set(
          [...(element.indicators || []), ...(element.records || [])].map((entry) => entry.displayLabel || "").filter(Boolean)
        );
        labels += originals.size;
        const byCompact = new Map<string, string>();
        originals.forEach((label) => {
          const compact = compactLabelV175(label);
          const earlier = byCompact.get(compact);
          if (earlier && earlier !== label) collisions.push(`${file}: "${earlier}" / "${label}" → "${compact}"`);
          byCompact.set(compact, label);
        });
      });
    expect(labels).toBeGreaterThan(100);
    expect(collisions).toEqual([]);
  });
});
