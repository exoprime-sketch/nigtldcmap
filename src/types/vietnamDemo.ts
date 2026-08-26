export type VietnamDemoStatus = "actual_connected" | "demo_only";

export type VietnamDemoDisplayType =
  | "numeric"
  | "time_series"
  | "categorical"
  | "verification"
  | "text"
  | "document"
  | "organization"
  | "project_finance"
  | "geospatial"
  | "permitting";

export interface VietnamPresentationProfile {
  userQuestion: string;
  primaryView: string;
  primaryViewLabel: string;
  headlineFields: string[];
  secondaryViews: string[];
  planningUse: string;
  caution: string;
  comparison: string;
}

export interface VietnamDemoPreview {
  kind: string;
  headline: string;
  subheadline: string;
  facts: string[];
}

export interface VietnamDemoElement {
  index: number;
  elementId: string;
  category: "A" | "B" | "C" | "D" | "E";
  categoryLabel: string;
  section: string;
  dataGroup: string;
  title: string;
  titleShort: string;
  displayType: VietnamDemoDisplayType;
  status: VietnamDemoStatus;
  statusLabel: string;
  spatialLevel: string;
  gis: boolean;
  sourceDatabase: string;
  effectiveSource: string;
  sourceUrl: string | null;
  collectionMethod: string;
  preview: VietnamDemoPreview;
  presentation: VietnamPresentationProfile;
}

export interface VietnamDemoCategory {
  code: "A" | "B" | "C" | "D" | "E";
  label: string;
  description: string;
  count: number;
  actualCount: number;
}

export interface VietnamFullLoadDemo {
  meta: {
    title: string;
    country: string;
    iso3: "VNM";
    registryElementCount: number;
    actualConnectedCount: number;
    demoOnlyCount: number;
    generatedFor: string;
    disclaimer: string;
    categoryCounts: Record<string, number>;
    actualCategoryCounts: Record<string, number>;
  };
  categories: VietnamDemoCategory[];
  elements: VietnamDemoElement[];
}
