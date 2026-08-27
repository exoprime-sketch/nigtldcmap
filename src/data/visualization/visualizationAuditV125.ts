import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  SemanticObservationV125,
} from "./semanticTypesV125";

export type VisualizationAuditFindingV125 = {
  code: string;
  elementId: string;
  message: string;
};

export function auditSemanticObservationsV125(
  elementId: string,
  sourceRecordCount: number,
  observations: SemanticObservationV125[]
): VisualizationAuditFindingV125[] {
  const findings: VisualizationAuditFindingV125[] = [];
  if (observations.length !== sourceRecordCount) {
    findings.push({
      code: "RECORD_RECONCILIATION",
      elementId,
      message: `source=${sourceRecordCount}, semantic=${observations.length}`,
    });
  }
  observations.forEach((observation) => {
    if (!observation.displayLabel || !observation.seriesKey) {
      findings.push({
        code: "MISSING_VISIBLE_SEMANTICS",
        elementId,
        message: observation.recordId,
      });
    }
    if (observation.value === 0 && observation.missingReasonCode) {
      findings.push({
        code: "ZERO_IMPUTATION",
        elementId,
        message: observation.recordId,
      });
    }
  });
  return findings;
}

export function auditVisualizationContractV125(
  contract: ElementVisualizationContractV125,
  semantics: ElementIndicatorSemanticsV125
): VisualizationAuditFindingV125[] {
  const findings: VisualizationAuditFindingV125[] = [];
  if (contract.elementId !== semantics.elementId) {
    findings.push({
      code: "ELEMENT_ID_MISMATCH",
      elementId: contract.elementId,
      message: semantics.elementId,
    });
  }
  if (contract.primaryRenderer === "status-only" && semantics.observationCount > 0) {
    findings.push({
      code: "FAKE_STATUS_ONLY",
      elementId: contract.elementId,
      message: `${semantics.observationCount} observation records exist`,
    });
  }
  const duplicateLabels = new Map<string, number>();
  semantics.indicators.forEach((indicator) => {
    const key = `${indicator.displayLabel}|${indicator.measure.unit}`;
    duplicateLabels.set(key, (duplicateLabels.get(key) || 0) + 1);
  });
  duplicateLabels.forEach((count, label) => {
    if (count > 1) {
      findings.push({
        code: "DUPLICATE_VISIBLE_LABEL",
        elementId: contract.elementId,
        message: `${label} (${count})`,
      });
    }
  });
  return findings;
}
