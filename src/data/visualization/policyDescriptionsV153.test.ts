import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  POLICY_DESCRIPTIONS_V153,
  documentCodeV153,
  initiativeDescriptionV153,
  policyDescriptionsForElementV153,
  policyDocumentDescriptionV153,
} from "./policyDescriptionsV153";

/**
 * V153-D3: the platform-edited descriptions are a contract with the delivery
 * they annotate. Every entry must match a name the delivery uses, every
 * sentence must have an https source beside it, and no attribute label from
 * 속성23_설명 may leak in as if it were a description.
 */
const ROOT = resolve(__dirname, "../../..");
const DATA = resolve(ROOT, "public/data/vietnam/v2/downloads");
const NAME_KEY = "속성1_레코드명";

type Entity = { recordId: string; name: string; elementId: string; normalizedAttributes?: Record<string, unknown> };
const entitiesOf = (elementId: string): Entity[] =>
  JSON.parse(readFileSync(resolve(DATA, `${elementId.toLowerCase()}.json`), "utf8")).entities;
const rowName = (entity: Entity) => String(entity.normalizedAttributes?.[NAME_KEY] ?? entity.name ?? "").trim();
const HTTPS = /^https:\/\/[^\s"'<>]+$/u;
const ATTRIBUTE_LABEL = /^(?:시행\(발효\)일|집행 주무기관|제정\(국회 통과\)·공포일|감축·적응 구분|NAZCA 표기 기후분야|공식 참여 여부|참여·서명 시점|이니셔티브 주제 분야|정식 명칭)/u;
const INTERNAL = /\.(?:pdf|xlsx?|csv|md)\b|raw:|검토의견|검증등급|보완항목|record_id|v124-/iu;

describe("policyDescriptionsV153 contract", () => {
  const entries = POLICY_DESCRIPTIONS_V153;

  test("covers the 34 documents and 23 initiatives/treaties the targets list", () => {
    expect(entries.filter((entry) => entry.kind === "document")).toHaveLength(34);
    expect(entries.filter((entry) => entry.kind === "initiative")).toHaveLength(19);
    expect(entries.filter((entry) => entry.kind === "treaty")).toHaveLength(4);
    expect(new Set(entries.map((entry) => entry.key)).size).toBe(entries.length);
  });

  test("every entry has the schema fields with well-formed values", () => {
    entries.forEach((entry) => {
      expect(entry.key).toMatch(/^[a-z0-9-]+$/u);
      expect(["document", "initiative", "treaty"]).toContain(entry.kind);
      expect(entry.elementIds.length).toBeGreaterThan(0);
      entry.elementIds.forEach((id) => expect(["C-008", "C-009", "C-010"]).toContain(id));
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.title.length).toBeLessThanOrEqual(40);
      expect(entry.formalName.trim().length).toBeGreaterThan(0);
      expect(entry.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(["verified", "pending"]).toContain(entry.status);
      entry.sourceUrl.forEach((url) => expect(url).toMatch(HTTPS));
      if (entry.effectiveDate) expect(entry.effectiveDate).toMatch(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/u);
    });
  });

  test("a verified entry has 2-3 sourced statements; a pending one has none", () => {
    entries.forEach((entry) => {
      if (entry.status === "verified") {
        expect(entry.description.length).toBeGreaterThanOrEqual(2);
        expect(entry.description.length).toBeLessThanOrEqual(3);
        expect(entry.sourceUrl.length).toBeGreaterThanOrEqual(1);
        entry.description.forEach((line) => {
          expect(line.length).toBeGreaterThan(8);
          expect(line.length).toBeLessThanOrEqual(90);
          expect(line).not.toMatch(ATTRIBUTE_LABEL);
          expect(line).not.toMatch(INTERNAL);
          expect(line).not.toMatch(/합니다|입니다|습니다/u);
        });
      } else {
        expect(entry.description).toEqual([]);
      }
      expect(entry.title).not.toMatch(INTERNAL);
      expect(entry.formalName).not.toMatch(INTERNAL);
    });
  });

  test("every name of every entry is a name the delivery uses, and documents match once per element", () => {
    const names = new Map<string, Set<string>>();
    ["C-008", "C-009", "C-010"].forEach((elementId) => {
      names.set(elementId, new Set(entitiesOf(elementId).map((entity) => rowName(entity).split(" — ")[0].trim())));
    });
    entries.forEach((entry) => {
      expect(entry.names.length).toBeGreaterThan(0);
      entry.names.forEach((name) => {
        const used = entry.elementIds.some((elementId) => names.get(elementId)!.has(name) || [...names.get(elementId)!].some((candidate) => candidate === name));
        expect(`${entry.key}:${name}:${used}`).toBe(`${entry.key}:${name}:true`);
      });
    });
  });

  test("timeline lookups resolve the delivery's document names and nothing else", () => {
    expect(policyDocumentDescriptionV153("C-009", "Decree 06/2022/NĐ-CP")?.key).toBe("06-2022-nd-cp");
    expect(policyDocumentDescriptionV153("C-009", "국가기후변화전략 2050")?.key).toBe("896-qd-ttg");
    expect(policyDocumentDescriptionV153("C-009", "Decision 896/QĐ-TTg")?.key).toBe("896-qd-ttg");
    expect(policyDocumentDescriptionV153("C-010", "QCVN 05:2023/BTNMT")?.key).toBe("qcvn-05-2023-btnmt");
    expect(policyDocumentDescriptionV153("C-010", "법률")?.key).toBe("20-2008-qh");
    expect(policyDocumentDescriptionV153("C-009", "법률")).toBeNull();
    expect(policyDocumentDescriptionV153("C-009", "현행 여부")).toBeNull();
    expect(policyDocumentDescriptionV153("C-009", "규율 대상 분야")).toBeNull();
    expect(policyDocumentDescriptionV153("C-010", "Luật 146/2025/QH15의 환경보호법 개정 범위")).toBeNull();
    expect(policyDocumentDescriptionV153("C-016", "Decree 06/2022/NĐ-CP")).toBeNull();
    expect(policyDocumentDescriptionV153("C-009", "JETP")).toBeNull();
  });

  test("C-010 shares the environmental protection law and the provincial plans with C-009", () => {
    const shared = entries.filter((entry) => entry.elementIds.length === 2).map((entry) => entry.key).sort();
    expect(shared).toEqual(["1318-qd-ubnd", "2609-qd-ubnd", "2810-kh-ubnd", "3560-qd-ubnd", "72-2020-qh"]);
    expect(policyDocumentDescriptionV153("C-010", "Gia Lai Kế hoạch 2810/KH-UBND")?.key).toBe("2810-kh-ubnd");
  });

  test("initiative lookups fold the truncated NAZCA labels into one entry", () => {
    expect(initiativeDescriptionV153("JETP")?.key).toBe("jetp");
    expect(initiativeDescriptionV153("4/1000 Initiative – Soils for Food Secur")?.key).toBe("4per1000");
    expect(initiativeDescriptionV153("4/1000 Initiative – Soils for Food Security and Climate")?.key).toBe("4per1000");
    expect(initiativeDescriptionV153("파리협정")?.kind).toBe("treaty");
    expect(initiativeDescriptionV153("Decree 06/2022/NĐ-CP")).toBeNull();
    expect(policyDescriptionsForElementV153("C-008")).toHaveLength(23);
    expect(policyDescriptionsForElementV153("C-016")).toHaveLength(0);
  });

  test("document codes normalise diacritics and numbering", () => {
    expect(documentCodeV153("Decision 942/QĐ-TTg")).toBe("942-qd-ttg");
    expect(documentCodeV153("Decision 942/QD-TTg")).toBe("942-qd-ttg");
    expect(documentCodeV153("Nghị định 06/2022/NĐ-CP")).toBe("06-2022-nd-cp");
    expect(documentCodeV153("QCVN 05:2023/BTNMT")).toBe("qcvn-05-2023-btnmt");
    expect(documentCodeV153("현행 여부")).toBe("");
  });
});
