import { loadCckpHeatIndexData } from "../../services/cckpApi";
import type { ClimateIndicatorDataResult } from "../../types/climate";

export async function loadHeatIndexRisk(
  force = false
): Promise<ClimateIndicatorDataResult> {
  return loadCckpHeatIndexData(force);
}
