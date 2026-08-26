import { useEffect, useState } from "react";
import type { Dataset } from "../../types/dataset";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { getVietnamDemoElementForDataset } from "../../utils/vietnamDemoV47";
import CountryDataFinalPreviewV53 from "./CountryDataFinalPreviewV53";

interface Props {
  dataset: Dataset;
  countryIso3?: string | null;
  countryName?: string | null;
}

export default function DatasetExamplePreviewV102({
  dataset,
  countryIso3,
  countryName,
}: Props) {
  const [element, setElement] = useState<VietnamDemoElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setElement(null);

    void getVietnamDemoElementForDataset(dataset)
      .then((result) => {
        if (cancelled) return;
        setElement(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setElement(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataset]);

  if (loading) {
    return (
      <div className="v33-empty-state" role="status">
        <strong>예시 화면 불러오는 중</strong>
      </div>
    );
  }

  if (!element) return null;

  return (
    <section
      className="v102-dataset-example-preview"
      aria-label="데이터 예시 화면"
    >
      <CountryDataFinalPreviewV53
        element={element}
        countryIso3={countryIso3 ?? "VNM"}
        countryName={countryName ?? "베트남"}
        exampleMode
      />
    </section>
  );
}
