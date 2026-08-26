import * as React from "react";
import * as LegacyModule from "./DataElementComparisonLegacyV120";
import ComparisonWorkspaceV120 from "./ComparisonWorkspaceV120";

const LegacyComparison = ((LegacyModule as any).default ||
  (LegacyModule as any).DataElementComparisonV114) as React.ComponentType<any>;

export function DataElementComparisonV114(props: any) {
  const elementId =
    props.elementId ?? props.element?.id ?? props.dataElement?.id;
  const elementLabel =
    props.elementLabel ??
    props.element?.label ??
    props.dataElement?.label ??
    props.title;
  const datasetId = props.datasetId ?? props.dataset?.id;
  const selectedCountry =
    props.selectedCountry ?? props.countryCode ?? props.country?.iso3;
  const status = props.dataStatus ?? props.status ?? props.element?.status;
  const actualDataAvailable =
    !props.isSynthetic &&
    !props.isExample &&
    status !== "planned" &&
    status !== "demo_only";
  return (
    <ComparisonWorkspaceV120
      elementId={elementId}
      elementLabel={elementLabel}
      datasetId={datasetId}
      selectedCountry={selectedCountry}
      actualDataAvailable={actualDataAvailable}
      legacyContent={LegacyComparison ? <LegacyComparison {...props} /> : null}
    />
  );
}

export default DataElementComparisonV114;
