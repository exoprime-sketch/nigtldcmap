import type { VietnamEntityV124, VietnamIndicatorMetaV124 } from "../vietnam/vietnamTypesV124";
import { koreanTermV153 } from "./koreanTermsV153";

/**
 * V153: C-012 (PPP law, agency, contract types, procurement, project history)
 * as label-form facts, Korean first.
 *
 * The 120 rows sit on twelve indicators; the meta sheet also defines ~100
 * descriptive indicators ("계약 유형 … · BLT(Build-Lease-Transfer) — 건설·
 * 서비스제공 후 국가에 이전") that carry no rows. A row's name is matched to
 * that description so the source's own gloss can be shown; nothing is
 * paraphrased. Province rows (World Bank PPI counts) become a table.
 */
export interface PppFactV153 {
  recordId: string;
  item: string;
  itemSource: string;
  value: string | null;
  valueSource: string | null;
  time: string | null;
  description: string | null;
  href: string | null;
  note: string | null;
}

export interface PppProvinceRowV153 {
  recordId: string;
  region: string;
  regionSource: string;
  count: number | null;
  period: string | null;
  sectors: string;
  status: string;
  href: string | null;
}

export interface PppGroupV153 {
  key: string;
  title: string;
  facts: PppFactV153[];
}

export interface PppModelV153 {
  groups: PppGroupV153[];
  provinces: PppProvinceRowV153[];
  provinceSource: string | null;
  total: number;
}

const GROUPS: { key: string; title: string; match: RegExp }[] = [
  { key: "law", title: "PPP 법률 · 시행령", match: /^C-012_ppp_law/u },
  { key: "agency", title: "PPP 전담 기관", match: /^C-012_ppp_(?:dedicated_)?agency/u },
  { key: "contract", title: "계약 유형", match: /^C-012_contract_type/u },
  { key: "procurement", title: "조달 방식(경쟁입찰 / 협상 / 지명)", match: /^C-012_procurement_method/u },
  { key: "history", title: "PPP 사업 이력(정부 통계 · 세계은행 PPI 집계)", match: /^C-012_ppp_project_history/u },
  { key: "vfm", title: "VfM(화폐가치) 평가 의무", match: /^C-012_vfm/u },
  { key: "other", title: "기타 항목", match: /./u },
];

const PROVINCE_INDICATOR = "C-012_ppp_project_history_ppi_worldbank";

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const out = String(value).trim();
  return out ? out : null;
}

/** "그룹 · 항목 — 설명" from the meta sheet, keyed by the item's own wording. */
function descriptionIndex(indicators: VietnamIndicatorMetaV124[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const indicator of indicators) {
    const label = indicator.labelKo || "";
    const dot = label.indexOf(" · ");
    const rest = dot >= 0 ? label.slice(dot + 3) : label;
    const dash = rest.indexOf(" — ");
    if (dash < 0) continue;
    const item = rest.slice(0, dash).trim();
    const description = rest.slice(dash + 3).replace(/\s*\(보완항목\)\s*$/u, "").trim();
    if (item && description) index.set(item, description);
  }
  return index;
}

/** Meta labels without " · " keep the group in front of the item; match on the tail. */
function descriptionBySuffix(index: Map<string, string>, item: string): string | null {
  for (const [key, description] of index) {
    if (key.endsWith(item) && key !== item) return description;
  }
  return null;
}

export function pppModelV153(entities: VietnamEntityV124[], indicators: VietnamIndicatorMetaV124[]): PppModelV153 {
  const descriptions = descriptionIndex(indicators);
  const groups = new Map<string, PppGroupV153>();
  const provinces: PppProvinceRowV153[] = [];
  let provinceSource: string | null = null;
  for (const entity of entities) {
    const a = entity.normalizedAttributes || {};
    const indicatorId = entity.indicatorId || "";
    const href = text(a["속성19_원문URL"]);
    const regionCode = text(a["속성22_행정코드P_code"]);
    if (indicatorId === PROVINCE_INDICATOR && regionCode && /^VN\d+$/u.test(regionCode)) {
      const regionSource = text(a["속성1_레코드명"]) || entity.name || "";
      const count = Number(a["속성3_값"]);
      provinces.push({
        recordId: entity.recordId,
        region: koreanTermV153(regionSource),
        regionSource,
        count: Number.isFinite(count) ? count : null,
        period: text(a["속성4_시점"]),
        sectors: koreanTermV153(text(a["속성6_분류"]) || ""),
        status: koreanTermV153(text(a["속성7_상태"]) || ""),
        href,
      });
      provinceSource = provinceSource || text(a["속성5_등록표준_출처"]);
      continue;
    }
    const group = GROUPS.find((candidate) => candidate.match.test(indicatorId)) || GROUPS[GROUPS.length - 1];
    const itemSource = text(a["속성1_레코드명"]) || entity.name || indicatorId;
    const valueSource = text(a["속성3_값"]);
    const description = descriptions.get(itemSource) || descriptionBySuffix(descriptions, itemSource);
    const note = text(entity.note);
    const entry = groups.get(group.key) || { key: group.key, title: group.title, facts: [] };
    entry.facts.push({
      recordId: entity.recordId,
      item: koreanTermV153(itemSource),
      itemSource,
      value: valueSource === null ? null : koreanTermV153(valueSource),
      valueSource,
      time: text(a["속성4_시점"]),
      description,
      href,
      // A source-missing note ("[M01·원자료 결측] …") is shown without its code tag.
      note: note && /^\[M0\d/u.test(note) ? note.replace(/^\[M0\d[^\]]*\]\s*/u, "") : null,
    });
    groups.set(group.key, entry);
  }
  provinces.sort((left, right) => (right.count || 0) - (left.count || 0) || left.region.localeCompare(right.region, "ko"));
  return {
    groups: GROUPS.map((group) => groups.get(group.key)).filter((group): group is PppGroupV153 => Boolean(group)),
    provinces,
    provinceSource,
    total: entities.length,
  };
}
