import { useEffect, useState } from "react";
import type { Dataset } from "../../types/dataset";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { getVietnamDemoElementForDataset } from "../../utils/vietnamDemoV47";
import VietnamDataSpecificPreviewV48 from "./VietnamDataSpecificPreviewV48";

export default function DatasetExamplePreviewV47({
  dataset,
}: {
  dataset: Dataset;
}) {
  const [element, setElement] = useState<VietnamDemoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void getVietnamDemoElementForDataset(dataset)
      .then((result) => {
        if (cancelled) return;
        setElement(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setElement(null);
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataset]);

  if (loading)
    return (
      <div className="v48-preview-loading" role="status">
        베트남 이용자 화면 불러오는 중
      </div>
    );
  if (!element || failed) return null;
  return <VietnamDataSpecificPreviewV48 element={element} dataset={dataset} />;
}
