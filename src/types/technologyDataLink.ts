export type TechnologyDataRelation = "direct" | "supporting" | "cross_cutting";

export interface DatasetTechnologyLink {
  datasetId: string;
  technologyId: string | "all";
  relation: TechnologyDataRelation;
  countryIso3?: string;
  basisKo: string;
  discoverable: boolean;
}
