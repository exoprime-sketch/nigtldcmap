import {
  MAP_LAYER_REGISTRY_V115,
} from "./mapLayerRegistryV115";
import type {
  MapLayerRegistryRowV115,
} from "./mapLayerRegistryV115";
import {
  MAP_ELEMENT_DECISION_INDEX_V116,
} from "./mapElementDecisionV116";
import type {
  EncodingRoleV116,
  MapElementDecisionV116,
  VisualPriorityV116,
} from "./mapElementDecisionV116";
import { MAP_ELEMENT_AUDIT_INDEX_V115 } from "./mapElementAuditV115";
import {
  MAP_VISUAL_ENCODING_INDEX_V116,
} from "./mapVisualEncodingV116";
import type {
  MapVisualEncodingV116,
} from "./mapVisualEncodingV116";
import type { SpatialResolutionV116 } from "../../types/spatialDataV116";

export interface MapLayerRegistryRowV116 extends MapLayerRegistryRowV115 {
  cooperationDecisionRoles: MapElementDecisionV116["cooperationDecisionRoles"];
  actualResolution: SpatialResolutionV116;
  preferredResolution: SpatialResolutionV116;
  visualPriority: VisualPriorityV116;
  defaultIntegratedView: boolean;
  encodingRole: EncodingRoleV116;
  encoding: MapVisualEncodingV116;
}

export const MAP_LAYER_REGISTRY_V116: MapLayerRegistryRowV116[] =
  MAP_LAYER_REGISTRY_V115.map((row) => {
    const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(row.elementId);
    const encoding = MAP_VISUAL_ENCODING_INDEX_V116.get(row.elementId);
    if (!decision || !encoding) {
      throw new Error(`v116 지도 레지스트리 정의 누락: ${row.elementId}`);
    }
    return {
      ...row,
      cooperationDecisionRoles: decision.cooperationDecisionRoles,
      actualResolution: decision.actualResolution,
      preferredResolution: decision.preferredResolution,
      visualPriority: decision.visualPriority,
      defaultIntegratedView: decision.defaultIntegratedView,
      encodingRole: decision.encodingRole,
      encoding,
    };
  });

export const MAP_LAYER_REGISTRY_INDEX_V116 = new Map(
  MAP_LAYER_REGISTRY_V116.map((row) => [row.elementId, row] as const)
);

export const MAP_PRESETS_V116 = [
  "핵심 협력기획 보기",
  "기술수요 보기",
  "정책·제도 보기",
  "사업·재원 보기",
  "ODA·공여환경 보기",
  "기후위험·적응 보기",
  "에너지·인프라 보기",
  "시장·산업 보기",
  "기술·혁신 보기",
  "파트너·실행기반 보기",
] as const;

export type MapPresetLabelV116 = (typeof MAP_PRESETS_V116)[number];

export const MAP_PRESET_DEFAULTS_V116: Record<
  MapPresetLabelV116,
  { baseElementId: string | null; elementIds: string[] }
> = {
  "핵심 협력기획 보기": {
    baseElementId: "B-006",
    elementIds: ["C-005", "D-019", "D-020", "D-018", "D-023", "D-021", "D-011"],
  },
  "기술수요 보기": {
    baseElementId: "A-021",
    elementIds: ["C-005", "D-019", "C-001", "C-002", "C-003", "C-004"],
  },
  "정책·제도 보기": {
    baseElementId: "C-019",
    elementIds: ["C-001", "C-002", "C-003", "C-004", "C-009", "C-012", "C-017"],
  },
  "사업·재원 보기": {
    baseElementId: "A-003",
    elementIds: [
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-022",
      "D-023",
      "D-025",
      "D-026",
    ],
  },
  "ODA·공여환경 보기": {
    baseElementId: "A-031",
    elementIds: ["D-011", "A-029", "A-030", "A-032", "D-014", "D-015", "D-017"],
  },
  "기후위험·적응 보기": {
    baseElementId: "B-006",
    elementIds: ["B-005", "B-007", "B-008", "B-009", "B-010", "B-011", "B-017"],
  },
  "에너지·인프라 보기": {
    baseElementId: "A-019",
    elementIds: ["A-020", "A-021", "A-023", "A-024", "B-039", "B-041", "B-042"],
  },
  "시장·산업 보기": {
    baseElementId: "A-003",
    elementIds: ["A-005", "A-007", "A-031", "D-001", "D-002", "D-013"],
  },
  "기술·혁신 보기": {
    baseElementId: "E-010",
    elementIds: ["E-007", "E-008", "E-009", "E-011", "E-013"],
  },
  "파트너·실행기반 보기": {
    baseElementId: null,
    elementIds: [
      "E-001",
      "E-002",
      "E-003",
      "E-004",
      "E-005",
      "E-006",
      "E-018",
      "E-019",
    ],
  },
};

export const MAP_CATALOG_CATEGORIES_V116 = Array.from(
  new Set(
    MAP_LAYER_REGISTRY_V116.map(
      (row) =>
        MAP_ELEMENT_AUDIT_INDEX_V115.get(row.elementId)?.mapCategory ??
        row.category
    )
  )
);

export function getMapCatalogRowsV116(): MapLayerRegistryRowV116[] {
  return MAP_LAYER_REGISTRY_V116.filter((row) => row.role !== "none");
}
