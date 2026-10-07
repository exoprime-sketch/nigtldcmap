/**
 * V170 search assets built by scripts/v170/build-search-v170.mjs:
 * records-<ISO3>.json (public record text per dataset, for matching and the
 * "검색 근거" line) and topics-<ISO3>.json (the 주요 현황 panel).
 */
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { prepareTextV170 } from "./searchMatchV170";
import type { RecordTextsV170 } from "./searchMatchV170";

export interface TopicRowV170 {
  role: string;
  elementId: string;
  value: string;
  sub: string;
  series?: Array<[number, number]>;
  basis: string;
}

export interface TopicV170 {
  id: string;
  label: string;
  groups: string[];
  rows: TopicRowV170[];
}

const recordCacheV170 = new Map<string, Promise<Map<string, RecordTextsV170>>>();
const topicCacheV170 = new Map<string, Promise<TopicV170[]>>();

async function fetchJsonV170<T>(path: string): Promise<T> {
  const response = await fetch(publicAssetUrlV128(path));
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return (await response.json()) as T;
}

/** Record text per dataset of one country, keyed by element id. */
export function loadSearchRecordsV170(iso3: string): Promise<Map<string, RecordTextsV170>> {
  const key = iso3.toUpperCase();
  if (!recordCacheV170.has(key)) {
    recordCacheV170.set(
      key,
      fetchJsonV170<{ elements: Record<string, RecordTextsV170> }>(`data/search/v170/records-${key}.json`)
        .then((file) => {
          // Normalize every record text once here, not on the first keystroke.
          const entries = Object.entries(file.elements || {});
          entries.forEach(([, entry]) => {
            entry.prepared = entry.texts.map(([text]) => prepareTextV170(text));
          });
          return new Map(entries);
        })
        .catch((error) => {
          recordCacheV170.delete(key);
          throw error;
        })
    );
  }
  return recordCacheV170.get(key)!;
}

export function loadSearchTopicsV170(iso3: string): Promise<TopicV170[]> {
  const key = iso3.toUpperCase();
  if (!topicCacheV170.has(key)) {
    topicCacheV170.set(
      key,
      fetchJsonV170<{ topics: TopicV170[] }>(`data/search/v170/topics-${key}.json`)
        .then((file) => file.topics || [])
        .catch(() => [])
    );
  }
  return topicCacheV170.get(key)!;
}

/** The first topic whose synonym groups include one of the query's groups. */
export function topicForQueryV170(topics: TopicV170[], groupIds: string[]): TopicV170 | null {
  if (groupIds.length === 0) return null;
  return topics.find((topic) => topic.groups.some((group) => groupIds.includes(group))) || null;
}
