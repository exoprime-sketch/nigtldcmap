import { createContext, useContext } from "react";
import type { VisualizationContractRowV153 } from "../../../data/visualization/publicVisualizationContractV153";

/**
 * V153-D1: the dataset's visualization contract, provided by the detail frame
 * so the renderers can order their blocks from it and `ChartAxesV150` can
 * state the contract's axes beside the ones the data produced.
 */
export const AnalysisContractContextV153 = createContext<VisualizationContractRowV153 | null>(null);

export function useAnalysisContractV153(): VisualizationContractRowV153 | null {
  return useContext(AnalysisContractContextV153);
}
