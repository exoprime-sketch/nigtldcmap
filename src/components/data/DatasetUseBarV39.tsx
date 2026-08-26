import { useState } from "react";
import type { Dataset } from "../../types/dataset";
import { copyText, openExternalUrl } from "../../utils/browser";
import { openDatasetFeedbackV43 } from "../../utils/datasetFeedbackV43";
import {
  isDatasetDownloadable,
  isDatasetSourceLinkAvailable,
} from "../../utils/datasetAccess";
import "../../styles/final-reuse-v43.css";

interface DatasetUseBarV39Props {
  dataset: Dataset;
  onOpenDownload: () => void;
}

export default function DatasetUseBarV39({
  dataset,
  onOpenDownload,
}: DatasetUseBarV39Props) {
  const [copied, setCopied] = useState(false);
  const canDownload = isDatasetDownloadable(dataset);
  const canOpenSource = isDatasetSourceLinkAvailable(dataset);
  const caution =
    dataset.limitations[0] || "자료 정의·기준시점·단위를 함께 확인하여 활용";

  async function copyCitation() {
    if (!dataset.citation) return;
    const success = await copyText(dataset.citation);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="dataset-usebar-v39" aria-label="자료 이용 핵심정보">
      <div className="dataset-usebar-v39-copy">
        <span>이 자료를 사용할 때</span>
        <strong>{dataset.sourceOrganization}</strong>
        <p>{caution}</p>
      </div>

      <div className="dataset-usebar-v39-actions dataset-usebar-v43-actions">
        {dataset.citation && (
          <button type="button" onClick={() => void copyCitation()}>
            {copied ? "출처 표기 복사 완료" : "출처 표기 복사"}
          </button>
        )}
        {canOpenSource && dataset.sourceUrl && (
          <button
            type="button"
            onClick={() => openExternalUrl(dataset.sourceUrl!)}
          >
            원 데이터 확인 ↗
          </button>
        )}
        <button type="button" onClick={() => openDatasetFeedbackV43(dataset)}>
          자료 의견 보내기
        </button>
        {canDownload && (
          <button type="button" className="primary" onClick={onOpenDownload}>
            데이터 다운로드
          </button>
        )}
      </div>
    </section>
  );
}
