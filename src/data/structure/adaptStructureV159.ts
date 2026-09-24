import type { VietnamEntityV124, VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import type { StructureV159 } from "../spec/specTypesV159";
import { adaptS1V159 } from "./S1CountryObservationV159";
import { adaptS2V159 } from "./S2RegionObservationV159";
import { adaptS3V159 } from "./S3LocatedEntityV159";
import { adaptS4V159 } from "./S4EntityV159";
import type { StructureRowsV159 } from "./structureTypesV159";

export interface AdaptStructureInputV159 {
  observations: readonly VietnamObservationV124[];
  entities: readonly VietnamEntityV124[];
  indicators: readonly VietnamIndicatorMetaV124[];
}

/** Dispatches a pack's raw records to the S1-S4 adapter its typology row names. */
export function adaptStructureV159(
  structure: StructureV159,
  { observations, entities, indicators }: AdaptStructureInputV159
): StructureRowsV159 {
  switch (structure) {
    case "S1":
      return { structure: "S1", rows: adaptS1V159(observations, indicators) };
    case "S2":
      return { structure: "S2", rows: adaptS2V159(observations, entities, indicators) };
    case "S3":
      return { structure: "S3", rows: adaptS3V159(entities) };
    case "S4":
      return { structure: "S4", rows: adaptS4V159(entities, observations) };
    default: {
      const exhaustive: never = structure;
      throw new Error(`Unknown V159 structure: ${String(exhaustive)}`);
    }
  }
}
