import { describe, expect, test } from "@jest/globals";
import { resolve } from "path";
import {
  POLICY_DESCRIPTIONS_V153,
  documentCodeV153,
  initiativeDescriptionV153,
  policyDescriptionsForElementV153,
  policyDocumentDescriptionV153,
} from "./policyDescriptionsV153";
import { readDownloadJsonV158 } from "../testing/downloadZipV158";

/**
 * V153-D3: the platform-edited descriptions are a contract with the delivery
 * they annotate. Every entry must match a name the delivery uses, every
 * sentence must have an https source beside it, and no attribute label from
 * 속성23_설명 may leak in as if it were a description.
 */
const ROOT = resolve(__dirname, "../../..");
// V162: the 2026-09-30 delivery moved C-008/C-009/C-010 to the wide template
// (식별_레코드명), which no longer carries the pre-refresh 속성1_레코드명
// column; both are read so this file works against either delivery shape.
const NAME_KEYS = ["식별_레코드명", "속성1_레코드명"];

type Entity = { recordId: string; name: string; elementId: string; normalizedAttributes?: Record<string, unknown> };
const entitiesOf = (elementId: string): Entity[] =>
  readDownloadJsonV158(elementId).entities;
const rowName = (entity: Entity) => {
  const attributes = entity.normalizedAttributes || {};
  const keyed = NAME_KEYS.map((key) => attributes[key]).find((value) => value != null && String(value).trim());
  return String(keyed ?? entity.name ?? "").trim();
};
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

  /**
   * V162: the 2026-09-30 delivery dropped two things this contract used to
   * point at - C-008's per-row treaty-ratification records (UNFCCC, Kyoto,
   * the Doha amendment, Paris; confirmed absent by diffing against the
   * pre-refresh ZIP, git show bbbab1f, element download
   * c-008.zip) and Circular 02/2022/TT-BTNMT's own C-010 row (it is named
   * only inside 08/2022/NĐ-CP's implementing instruments, in both the old
   * and the new delivery). Their descriptions are still real, sourced facts
   * (research-C.json / research-B.json), so the entries stay; they are just
   * not delivery-row-backed, and so cannot be verified against a live row.
   */
  const NOT_ROW_BACKED_V162 = new Set([
    "unfccc",
    "kyoto-protocol",
    "doha-amendment",
    "paris-agreement",
    "02-2022-tt-btnmt",
  ]);

  test("every name of every entry is a name the delivery uses, and documents match once per element", () => {
    // V162: the pre-refresh delivery separated a row's own name from a
    // trailing subject with " — "; the wide delivery instead writes several
    // long names as "CODE, subtitle" ("Decision 01/2022/QĐ-TTg, GHG 인벤토리
    // 대상 부문·시설 목록(최초)"). A C-009/C-010 row also carries its original-
    // language title in a second column, [법령] 법령명 (원문) - the delivery's
    // own name for the act, just not the normalised 식별_레코드명. A C-008 row's
    // own 식별_레코드명 is the NAZCA actor ("Can Tho City"), not the
    // initiative it names in [이니셔티브] 이니셔티브명 (원문/국문); a reader (and
    // the timeline lookup) most often uses the parenthesised abbreviation
    // inside that name ("… (JETP) with Viet Nam" → "JETP").
    const names = new Map<string, Set<string>>();
    const addAll = (set: Set<string>, full: string) => {
      if (!full) return;
      set.add(full);
      set.add(full.split(" — ")[0].trim());
      set.add(full.split(",")[0].trim());
      const abbreviation = full.match(/\(([A-Z][A-Za-z0-9./&-]{1,12})\)/u)?.[1];
      if (abbreviation) set.add(abbreviation);
    };
    ["C-008", "C-009", "C-010"].forEach((elementId) => {
      const set = new Set<string>();
      entitiesOf(elementId).forEach((entity) => {
        const attributes = (entity as { normalizedAttributes?: Record<string, unknown> }).normalizedAttributes || {};
        if (elementId === "C-008") {
          addAll(set, String(attributes["이니셔티브_이니셔티브명_원문"] ?? "").trim());
          addAll(set, String(attributes["이니셔티브_이니셔티브명_국문"] ?? "").trim());
        } else {
          addAll(set, rowName(entity));
          addAll(set, String(attributes["법령_법령명_원문"] ?? "").trim());
        }
      });
      names.set(elementId, set);
    });
    entries.forEach((entry) => {
      if (NOT_ROW_BACKED_V162.has(entry.key)) return;
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
    // V162: the pre-refresh delivery named this row by its bare QCVN code;
    // the 2026-09-30 wide delivery's own row name is the Korean title
    // (법령_문서번호 "QCVN 05:2023/BTNMT" is a column value, not a row name).
    expect(policyDocumentDescriptionV153("C-010", "주변대기 질 국가기술규정(2023)")?.key).toBe("qcvn-05-2023-btnmt");
    // V162: the pre-refresh delivery named this act only through a generic
    // "법률" attribute row (EXTRA_ENTRY_NAMES override); the 2026-09-30 wide
    // delivery gives it its own [법령] row, titled "생물다양성법(2008)".
    expect(policyDocumentDescriptionV153("C-010", "생물다양성법(2008)")?.key).toBe("20-2008-qh");
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
    // V162: the pre-refresh NAZCA export truncated this label at ~40 chars
    // (en dash, "… Secur"); the 2026-09-30 delivery carries the full name
    // only, with a plain hyphen. Both the Korean and the English full name
    // still fold to the one entry.
    expect(initiativeDescriptionV153("4/1000 Initiative - Soils for Food Security and Climate")?.key).toBe("4per1000");
    expect(initiativeDescriptionV153("4/1000 이니셔티브(토양 탄소)")?.key).toBe("4per1000");
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
