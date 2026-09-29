import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
  VietnamSpatialLayerAssetV124,
} from "../vietnam/vietnamTypesV124";
import { adaptS1V159 } from "./S1CountryObservationV159";
import type { RegionSystemV159, S2RegionObservationV159 } from "./structureTypesV159";
import { countryPublicDirV158 } from "../countryContext";

/**
 * S2 adapter (docs/DATA_TYPOLOGY_V159_SCHEMA.md §2.2).
 *
 * S2 rows carry every S1 field plus a region. Real deliveries state the
 * region three different ways (verified against ${countryPublicDirV158("VNM")}
 * downloads for B-021, D-008, C-016):
 *
 * | region_system | source marker | example |
 * |---|---|---|
 * | `adm1-63`  | observation's own `regionId` starting `VN-` (with `regionLabel`) | C-016 |
 * | `adm1-34`  | observation's own `regionId` starting `VN34-`                    | (none observed yet; A-023 entities carry `adm1Code34` but that is a platform-computed join, not a source-stated region - see S3 notes) |
 * | `ministry` | `note` starts with `[<CODE>(<설명>)]` where CODE is 2-6 upper-case ASCII letters | D-008 |
 * | `region-6` | `note` contains `GDLCODE=<key>`; region name taken from the indicator `labelKo`'s trailing " — " segment | B-021 |
 *
 * A row with none of these markers is a national row (region fields null),
 * which is correct - S2 sheets mix regional and national rows in the same
 * indicator (schema §2.2 "국가 전체 값은 ... 비워 두면 S1 행으로 읽는다").
 *
 * Known gap: several S2 elements (B-002, B-003, B-026) currently deliver as
 * *wide* entity rows - one row per region×year with several measures as
 * separate attribute columns (e.g. B-003's 연평균_기온/연평균_최고기온/
 * 연평균_최저기온/연강수량_mm on one row) mixed with non-measure numeric
 * columns (e.g. 경계_면적_km_GADM, 연도). There is no reliable, generic way to
 * tell a measure column from a metadata column without hard-coding element-
 * specific field names, and the schema doc itself flags this shape as
 * unresolved pending the vendor's re-delivery in observation form (§2.2.1).
 * This adapter does not guess: those entities produce no S2 rows here. The
 * `entities` parameter is used only for the safe, additive purpose of
 * filling a missing `regionName` from an entity's own adm1 code/name pair
 * when the observation already named a region key some entity also states.
 */

const MID_DOT = "·"; // ·
const EM_DASH = "—"; // —

function ministryFromNote(note: string | null | undefined): { key: string; name: string } | null {
  const text = note || "";
  const match = text.match(/^\[([A-Z]{2,6})\(([^)]*)\)\]/u);
  if (!match) return null;
  return { key: match[1], name: match[2] };
}

function gdlCodeFromNote(note: string | null | undefined): string | null {
  const text = note || "";
  const match = text.match(/GDLCODE=([A-Za-z0-9]+)/u);
  return match ? match[1] : null;
}

function trailingLabelSegment(labelKo: string | null | undefined): string | null {
  const label = labelKo || "";
  const dashIndex = label.lastIndexOf(` ${EM_DASH} `);
  if (dashIndex < 0) return null;
  return label.slice(dashIndex + 3).trim() || null;
}

/** adm1 code/name pairs an entity states for itself (used only to back-fill a region name). */
function buildAdm1NameLookupV159(entities: readonly VietnamEntityV124[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const entity of entities) {
    const attrs = entity.normalizedAttributes || {};
    const pairs: Array<[unknown, unknown]> = [
      [attrs.adm1Code63, attrs.adm1Name63],
      [attrs.adm1Code34, attrs.adm1Name34],
    ];
    for (const [code, name] of pairs) {
      if (typeof code === "string" && code && typeof name === "string" && name && !lookup.has(code)) {
        lookup.set(code, name);
      }
    }
  }
  return lookup;
}

export function regionFromObservationV159(
  obs: VietnamObservationV124,
  labelKo: string | null | undefined
): { regionSystem: RegionSystemV159 | null; regionKey: string | null; regionName: string | null } {
  const raw = obs as unknown as { regionId?: string | null; regionLabel?: string | null };
  if (raw.regionId) {
    if (raw.regionId.startsWith("VN34-")) {
      return { regionSystem: "adm1-34", regionKey: raw.regionId, regionName: raw.regionLabel || null };
    }
    if (raw.regionId.startsWith("VN-")) {
      return { regionSystem: "adm1-63", regionKey: raw.regionId, regionName: raw.regionLabel || null };
    }
  }
  const ministry = ministryFromNote(obs.note);
  if (ministry) {
    return { regionSystem: "ministry", regionKey: ministry.key, regionName: ministry.name || null };
  }
  const gdlCode = gdlCodeFromNote(obs.note);
  if (gdlCode) {
    return { regionSystem: "region-6", regionKey: gdlCode, regionName: trailingLabelSegment(labelKo) };
  }
  return { regionSystem: null, regionKey: null, regionName: null };
}

export function adaptS2V159(
  observations: readonly VietnamObservationV124[],
  entities: readonly VietnamEntityV124[],
  indicators: readonly VietnamIndicatorMetaV124[]
): S2RegionObservationV159[] {
  const metaByIndicatorId = new Map(indicators.map((meta) => [meta.indicatorId, meta]));
  const adm1NameLookup = buildAdm1NameLookupV159(entities);
  const s1Rows = adaptS1V159(observations, indicators);
  return observations.map((obs, index) => {
    const meta = metaByIndicatorId.get(obs.indicatorId) || null;
    const region = regionFromObservationV159(obs, meta?.labelKo);
    const regionName = region.regionName || (region.regionKey ? adm1NameLookup.get(region.regionKey) || null : null);
    return {
      ...s1Rows[index],
      regionSystem: region.regionSystem,
      regionKey: region.regionKey,
      regionName,
    };
  });
}

/**
 * S2 rows from the province layer the map draws (${countryPublicDirV158("VNM")}/
 * spatial/layers/<id>.json), for elements whose province values arrive as a
 * map layer rather than as pack observations.
 *
 * Only the layer's own default variable and period are taken - the same view
 * the map opens on - so the rows describe one measure at one time. Values the
 * layer marks `imputed` are left out. `indicatorId` names the layer variable
 * (the per-province source ids differ row by row), `label` carries the
 * variable label and `period` the period as the layer states it; `year` is
 * set only when the period is a single year.
 */
export function adaptSpatialLayerS2V159(layer: VietnamSpatialLayerAssetV124): S2RegionObservationV159[] {
  const variable = layer.selectors?.defaultVariable;
  const period = layer.selectors?.defaultPeriod;
  if (!variable || !period) return [];
  const regionSystem: RegionSystemV159 = layer.boundarySystem === "pre-2025-63" ? "adm1-63" : "adm1-34";
  return layer.values
    .filter((row) => row.variable === variable && String(row.period) === String(period) && !row.imputed)
    .filter((row) => typeof row.value === "number" && Number.isFinite(row.value))
    .map((row) => ({
      elementId: layer.elementId,
      indicatorId: `${layer.elementId}:${row.variable}`,
      countryIso3: layer.countryIso3,
      year: /^\d{4}$/u.test(String(row.period)) ? Number(row.period) : null,
      period: String(row.period),
      value: row.value,
      missingReasonCode: null,
      note: null,
      category: null,
      scenario: null,
      techIds: [],
      bound: null,
      valueKind: null,
      unit: row.unit ?? null,
      unitDetail: null,
      label: row.variableLabel || row.variable,
      regionSystem,
      regionKey: row.adm1Code,
      regionName: row.adm1Name || null,
    }));
}
