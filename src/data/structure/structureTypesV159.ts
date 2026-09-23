/**
 * Template input for the four delivery structures (V159).
 *
 * Field names match docs/DATA_TYPOLOGY_V159_SCHEMA.md §2 one to one: the
 * delivery column on the left of that document's tables becomes the field
 * here. Adapters only move source values; a dimension the delivery does not
 * state stays null rather than being guessed.
 */

export type ValueKindV159 = "actual" | "estimate" | "projection" | null;

/** S1: one country, one period, one indicator. */
export interface S1CountryObservationV159 {
  elementId: string;
  indicatorId: string;
  countryIso3: string;
  year: number | null;
  period: string | null;
  value: number | string | boolean | null;
  missingReasonCode: string | null;
  note: string | null;
  category: string | null;
  scenario: string | null;
  /** Two-digit climate-technology keys ("07"). */
  techIds: string[];
  bound: "min" | "max" | "central" | string | null;
  valueKind: ValueKindV159;
  unit: string | null;
  unitDetail: string | null;
  /** Korean label of the indicator as delivered. */
  label: string;
}

/** Region systems a S2 key belongs to (schema §2.2). */
export type RegionSystemV159 =
  | "adm1-63"
  | "adm1-34"
  | "region-6"
  | "basin-aqueduct40"
  | "basin-hydrosheds"
  | "ministry";

/** S2: one region, one period, one indicator. National rows have no region. */
export interface S2RegionObservationV159 extends S1CountryObservationV159 {
  regionSystem: RegionSystemV159 | null;
  regionKey: string | null;
  regionName: string | null;
}

export type GeometryTypeV159 = "point" | "line" | "polygon" | null;

/** S3: one located facility, office, station or asset. */
export interface S3LocatedEntityV159 {
  elementId: string;
  indicatorId: string | null;
  recordKey: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  geometryType: GeometryTypeV159;
  crs: string | null;
  geometryRef: string | null;
  classKey: string | null;
  classLabel: string | null;
  size: { value: number; unit: string | null } | null;
  year: number | null;
  owner: string | null;
  /** Province as the source states it; the platform's own point-in-polygon result is not copied here. */
  adm1Source: string | null;
  techIds: string[];
  sourceUrl: string | null;
  coordinateQuality: "exact" | "city-centroid" | "admin-centroid" | string | null;
}

/** S4: one non-spatial record - document, project, organisation, law, technology. */
export interface S4EntityV159 {
  elementId: string;
  indicatorId: string | null;
  recordKey: string;
  name: string | null;
  recordType: string | null;
  year: number | null;
  date: string | null;
  status: string | null;
  description: string | null;
  amount: { value: number; currency: string | null } | null;
  org: string | null;
  /** "system:key" region tags the source states, e.g. "adm1-34:VN-HN". */
  regionTags: string[];
  techIds: string[];
  links: string[];
  score: number | null;
}

export type StructureRowsV159 =
  | { structure: "S1"; rows: S1CountryObservationV159[] }
  | { structure: "S2"; rows: S2RegionObservationV159[] }
  | { structure: "S3"; rows: S3LocatedEntityV159[] }
  | { structure: "S4"; rows: S4EntityV159[] };
