import { CLIMATE_TECHNOLOGIES } from "../climateTechnologyCatalog";
import { normalizeTechnologyIdsV153 } from "../../utils/technologyIdV153";
import type { VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import type { S1CountryObservationV159, ValueKindV159 } from "./structureTypesV159";

/**
 * S1 adapter (docs/DATA_TYPOLOGY_V159_SCHEMA.md §2.1).
 *
 * Real deliveries mix two encodings: (a) explicit columns already on the
 * observation/indicator (unit, technologyIds), and (b) dimensions folded into
 * `note` head-tags or `indicator_id` suffixes (A-001, A-010, D-004, C-016,
 * B-008 samples in public/data/vietnam/v2/downloads). This module reads only
 * documented, verifiable markers; anything it cannot recognize stays null
 * rather than being guessed. Rule table:
 *
 * | field       | source                                                                 | example element |
 * |-------------|-------------------------------------------------------------------------|------------------|
 * | valueKind   | `note` contains `[실적치]` / `[추정치]` / `[전망치]`                        | B-021 |
 * | bound       | `note` contains `[하한(min)]` / `[상한(max)]`, else `indicator_id` ends in `_min`/`_max`/`_q<digits>` | C-016, B-008 |
 * | scenario    | `indicator_id` ends in `_low`/`_mid`/`_high` (word boundary), or contains `ssp\d{3}` / `rcp\d{2}` (converted to `SSPn-n.n` / `RCPn.n`) | D-004, B-008 |
 * | techIds     | indicator meta's own `technologyIds` (normalized, two-digit codes)     | A-018, D-011 |
 * | category    | indicator `labelKo`'s " · " segment before "(" / " — ", **only** when that segment differs across the element's own indicators (a constant segment, e.g. a country name repeated on every row, is not a category — see A-001) | A-010, A-018 |
 * | unit/unitDetail | observation's own `unit`, else indicator meta's `unit`/`unitDetail` | all |
 * | label       | indicator meta's `labelKo`, else the indicator id itself               | all |
 *
 * Known gap: `category` needs at least two indicators on the element to tell
 * a real category apart from an incidental constant token in the label; a
 * single-indicator element's label is never read as a category.
 */

const CTIS_NAME_LOOKUP = CLIMATE_TECHNOLOGIES.map((item, index) => ({
  nameKo: item.nameKo,
  code: String(index + 1).padStart(2, "0"),
}));

export function parseValueKindV159(note: string | null | undefined): ValueKindV159 {
  const text = note || "";
  if (text.includes("[실적치]")) return "actual";
  if (text.includes("[추정치]")) return "estimate";
  if (text.includes("[전망치]")) return "projection";
  return null;
}

export function parseBoundV159(note: string | null | undefined, indicatorId: string): string | null {
  const text = note || "";
  if (text.includes("[하한(min)]")) return "min";
  if (text.includes("[상한(max)]")) return "max";
  const suffix = indicatorId.match(/_(min|max)$/u);
  if (suffix) return suffix[1];
  const quantile = indicatorId.match(/_q(\d{1,3})(?:_|$)/u);
  if (quantile) return `q${quantile[1]}`;
  return null;
}

export function parseScenarioV159(indicatorId: string): string | null {
  const lowMidHigh = indicatorId.match(/(?:^|_)(low|mid|high)(?:_|$)/u);
  if (lowMidHigh) return lowMidHigh[1];
  const ssp = indicatorId.match(/ssp(\d)(\d)(\d)/iu);
  if (ssp) {
    const decimal = (Number(`${ssp[2]}${ssp[3]}`) / 10).toFixed(1);
    return `SSP${ssp[1]}-${decimal}`;
  }
  const rcp = indicatorId.match(/rcp(\d)(\d)/iu);
  if (rcp) return `RCP${rcp[1]}.${rcp[2]}`;
  return null;
}

/** Note-prefix technology match for row-level markers (A-023 style "[수력 기술 (Hydropower)]"). */
export function parseNoteTechIdV159(note: string | null | undefined): string | null {
  const text = note || "";
  for (const tech of CTIS_NAME_LOOKUP) {
    if (text.startsWith(`[${tech.nameKo}`)) return tech.code;
  }
  return null;
}

const MID_DOT = "·"; // ·
const EM_DASH = "—"; // —

function extractCandidateCategory(labelKo: string | null | undefined): string | null {
  const label = labelKo || "";
  const dotIndex = label.indexOf(` ${MID_DOT} `);
  if (dotIndex < 0) return null;
  let rest = label.slice(dotIndex + 3).trim();
  const dashIndex = rest.indexOf(` ${EM_DASH} `);
  if (dashIndex >= 0) rest = rest.slice(0, dashIndex).trim();
  return rest || null;
}

/** Per element, the candidate category is only real when it varies across the element's indicators. */
export function buildCategoryMapV159(
  indicators: readonly Pick<VietnamIndicatorMetaV124, "elementId" | "indicatorId" | "labelKo">[]
): Map<string, string | null> {
  const byElement = new Map<string, Array<{ indicatorId: string; candidate: string | null }>>();
  for (const meta of indicators) {
    const candidate = extractCandidateCategory(meta.labelKo);
    const list = byElement.get(meta.elementId) || [];
    list.push({ indicatorId: meta.indicatorId, candidate });
    byElement.set(meta.elementId, list);
  }
  const result = new Map<string, string | null>();
  for (const list of byElement.values()) {
    const distinct = new Set(list.map((row) => row.candidate).filter((value): value is string => Boolean(value)));
    const varies = distinct.size >= 2;
    for (const row of list) {
      result.set(row.indicatorId, varies ? row.candidate : null);
    }
  }
  return result;
}

function buildMetaMapV159(
  indicators: readonly VietnamIndicatorMetaV124[]
): Map<string, VietnamIndicatorMetaV124> {
  const map = new Map<string, VietnamIndicatorMetaV124>();
  for (const meta of indicators) map.set(meta.indicatorId, meta);
  return map;
}

export function adaptS1V159(
  observations: readonly VietnamObservationV124[],
  indicators: readonly VietnamIndicatorMetaV124[]
): S1CountryObservationV159[] {
  const metaByIndicatorId = buildMetaMapV159(indicators);
  const categoryByIndicatorId = buildCategoryMapV159(indicators);
  return observations.map((obs) => {
    const meta = metaByIndicatorId.get(obs.indicatorId) || null;
    return {
      elementId: obs.elementId,
      indicatorId: obs.indicatorId,
      countryIso3: obs.countryIso3,
      year: obs.year ?? null,
      period: obs.period ?? null,
      value: obs.value ?? null,
      missingReasonCode: obs.missingReasonCode ?? null,
      note: obs.note ?? null,
      category: categoryByIndicatorId.get(obs.indicatorId) ?? null,
      scenario: parseScenarioV159(obs.indicatorId),
      techIds: normalizeTechnologyIdsV153(meta?.technologyIds || []),
      bound: parseBoundV159(obs.note, obs.indicatorId),
      valueKind: parseValueKindV159(obs.note),
      unit: obs.unit ?? meta?.unit ?? null,
      unitDetail: meta?.unitDetail ?? null,
      label: meta?.labelKo || obs.indicatorId,
    };
  });
}
