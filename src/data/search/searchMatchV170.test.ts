import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  countRecordsV170,
  expandQueryV170,
  matchDatasetV170,
  SYNONYM_GROUPS_V170,
  TermV170,
  tierLabelV170,
  normalizeV170,
} from "./searchMatchV170";
import type { MatchFieldV170, RecordTextsV170 } from "./searchMatchV170";
import { topicForQueryV170 } from "./searchAssetsV170";
import type { TopicV170 } from "./searchAssetsV170";

const field = (label: string, text: string, weight = 300): MatchFieldV170 => ({ label, text, weight });
const records = (pairs: Array<[string, number]>): RecordTextsV170 => ({
  total: pairs.reduce((sum, [, count]) => sum + count, 0),
  texts: pairs,
});

describe("V170 synonym dictionary", () => {
  it("has unique group ids and no term in two groups", () => {
    const ids = SYNONYM_GROUPS_V170.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
    const owner = new Map<string, string>();
    SYNONYM_GROUPS_V170.forEach((group) =>
      group.terms.forEach((term) => {
        const key = normalizeV170(term).replace(/\s+/g, "");
        expect(owner.get(key) ?? group.id).toBe(group.id);
        owner.set(key, group.id);
      })
    );
  });

  it("widens a typed term to its group and lists the added words", () => {
    const query = expandQueryV170("태양광");
    expect(query.groupIds).toEqual(["solar-pv"]);
    expect(query.addedTerms).toEqual(expect.arrayContaining(["태양전지", "PV", "photovoltaic"]));
    expect(query.addedTerms).not.toContain("태양광");
  });

  it("works the same from the English side", () => {
    expect(expandQueryV170("Photovoltaic").groupIds).toEqual(["solar-pv"]);
    expect(expandQueryV170("flood").groupIds).toEqual(["flood"]);
  });

  it("keeps a dictionary phrase with a space as one token", () => {
    const query = expandQueryV170("solar PV");
    expect(query.tokens).toHaveLength(1);
    expect(query.groupIds).toEqual(["solar-pv"]);
  });

  it("adds nothing for a word outside the dictionary", () => {
    const query = expandQueryV170("인구");
    expect(query.groupIds).toEqual([]);
    expect(query.addedTerms).toEqual([]);
    expect(query.tokens[0].terms.map((term) => term.term)).toEqual(["인구"]);
  });
});

describe("V170 term matching", () => {
  it("matches Latin terms on whole words only", () => {
    const pv = new TermV170("PV");
    expect(pv.find(normalizeV170("Solar PV capacity"))).toEqual({ index: 6, length: 2 });
    expect(pv.find(normalizeV170("PVC pipe"))).toBeNull();
    expect(pv.find(normalizeV170("SPV company"))).toBeNull();
    expect(new TermV170("solar").find(normalizeV170("Solaris Ltd"))).toBeNull();
  });

  it("matches Hangul inside words and across spacing", () => {
    expect(new TermV170("태양광").find("수상태양광발전소")).toEqual({ index: 2, length: 3 });
    expect(new TermV170("태양광발전").find("태양광 발전 사업")).toEqual({ index: -1, length: 0 });
  });
});

describe("V170 relevance tiers", () => {
  const solar = expandQueryV170("태양광");

  it("puts a dataset whose own text names the topic in tier 1", () => {
    const match = matchDatasetV170(solar, [field("이름", "전원별 발전설비용량"), field("설명", "태양광, 풍력 등 전원별 설비")], null, []);
    expect(match).toMatchObject({ tier: 1, where: "설명" });
    expect(match?.snippet?.hit).toBe("태양광");
  });

  it("puts a dataset that holds the topic only in its records in tier 2, with the record count", () => {
    const match = matchDatasetV170(
      solar,
      [field("이름", "민간 인프라 사업")],
      records([
        ["Ninh Thuan solar PV plant · 50 MW", 3],
        ["Toll road BOT", 7],
      ]),
      []
    );
    expect(match).toMatchObject({ tier: 2, where: "수록 내용", records: { matched: 3, total: 10 } });
    expect(match?.snippet?.hit.toLowerCase()).toBe("solar pv");
  });

  it("puts a dataset tagged with the technology but silent about it in tier 3", () => {
    const match = matchDatasetV170(solar, [field("이름", "1인당 GDP")], records([["Hà Nội", 1]]), ["태양광 발전"]);
    expect(match).toMatchObject({ tier: 3, where: "기후기술 분류", records: null });
  });

  it("drops a dataset that does not hold every word of the query", () => {
    const query = expandQueryV170("태양광 하노이");
    expect(query.tokens).toHaveLength(2);
    expect(matchDatasetV170(query, [field("설명", "태양광 설비")], null, [])).toBeNull();
    expect(matchDatasetV170(query, [field("설명", "태양광 설비"), field("국가", "하노이", 50)], null, [])?.tier).toBe(1);
  });

  it("reads a provider name only for the words the reader typed", () => {
    const provider: MatchFieldV170 = { label: "제공기관", text: "Global Solar Atlas 2.0", weight: 120, exact: true };
    expect(matchDatasetV170(solar, [field("이름", "기후 변수"), provider], null, [])).toBeNull();
    expect(matchDatasetV170(expandQueryV170("solar"), [provider], null, [])).toMatchObject({ tier: 1, where: "제공기관" });
  });

  it("drops record codes and keeps a numbered technology name as its name", () => {
    const elements = JSON.parse(
      readFileSync(resolve(process.cwd(), "public/data/search/v170/records-VNM.json"), "utf8")
    ) as { elements: Record<string, RecordTextsV170> };
    const parts = Object.values(elements.elements).flatMap((entry) => entry.texts.flatMap(([text]) => text.split(" · ")));
    expect(parts.filter((part) => /^\S*_\S*$|^[A-Z]{2,5}-[A-Z]{2,4}-|%[A-Z]{3,}|@/.test(part))).toEqual([]);
    expect(parts.filter((part) => /^\d{1,2}\s+\S.*기술$/.test(part))).toEqual([]);
    // Working notes and empty markers stay out of the "일치 근거" line.
    expect(parts.filter((part) => /현지조사|확인필요|해당\s*없음|용역사|미특정|^\(?미확인\)?$|^not available$/iu.test(part))).toEqual([]);
    expect(parts).toContain("태양광 기술");
  });

  it("ranks a dataset by its weakest word", () => {
    const query = expandQueryV170("태양광 하노이");
    const match = matchDatasetV170(query, [field("설명", "태양광 설비")], records([["하노이", 2]]), []);
    expect(match?.tier).toBe(2);
  });

  it("ranks a higher record share above a lower one in tier 2", () => {
    const many = matchDatasetV170(solar, [], records([["solar farm", 8], ["wind farm", 2]]), []);
    const few = matchDatasetV170(solar, [], records([["solar farm", 1], ["wind farm", 9]]), []);
    expect(many!.score).toBeGreaterThan(few!.score);
  });
});

describe("V170-2 group names say where the query was found", () => {
  it("names each group by the place of the match", () => {
    expect(tierLabelV170(1)).toBe("데이터명·설명 일치");
    expect(tierLabelV170(2)).toBe("수록 내용 일치");
    expect(tierLabelV170(3)).toBe("기후기술 분류 일치");
  });
});

describe("V170 search assets agree with the matcher", () => {
  const root = resolve(process.cwd(), "public/data/search/v170");
  const read = <T,>(name: string): T => JSON.parse(readFileSync(resolve(root, name), "utf8")) as T;

  it.each(["VNM", "BGD"])("%s: each '관련 N건' row is the count the finder shows", (country) => {
    const topics = read<{ topics: TopicV170[] }>(`topics-${country}.json`).topics;
    const elements = read<{ elements: Record<string, RecordTextsV170> }>(`records-${country}.json`).elements;
    let checked = 0;
    topics.forEach((topic) => {
      const query = expandQueryV170(topic.label);
      expect(topicForQueryV170(topics, query.groupIds)?.id).toBe(topic.id);
      topic.rows
        .filter((row) => row.basis === "recordMatch")
        .forEach((row) => {
          const numbers = `${row.value} ${row.sub}`.match(/[\d,]+(?=\s*(건|곳))/g)!.map((n) => Number(n.replace(/,/g, "")));
          const counted = countRecordsV170(query.tokens[0], elements[row.elementId]);
          expect([row.elementId, counted.matched, counted.total]).toEqual([row.elementId, numbers[0], numbers[1]]);
          checked += 1;
        });
    });
    expect(checked).toBeGreaterThan(0);
  });

  it.each(["VNM", "BGD"])("%s: record text carries no file names, links or long ids", (country) => {
    const elements = read<{ elements: Record<string, RecordTextsV170> }>(`records-${country}.json`).elements;
    Object.values(elements).forEach((entry) =>
      entry.texts.forEach(([text]) => {
        expect(text).not.toMatch(/https?:\/\/|\.(csv|xlsx|json|pdf|shp|tif)\b/i);
      })
    );
  });
});
