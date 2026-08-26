import { useMemo, useState } from "react";
import type { Dataset } from "../../types/dataset";
import DataTypeRenderer from "./DataTypeRenderer";
import { isDatasetDownloadable } from "../../utils/datasetAccess";
import "../../styles/actual-data-v54.css";
import "../../styles/country-context-v55.css";

interface Props {
  datasets: Dataset[];
  countryIso3: string;
  countryName: string;
  onOpenDataset: (datasetId: string) => void;
  onOpenDownload: (datasetId: string) => void;
}

export default function ActualDatasetPreviewV54({
  datasets,
  countryIso3,
  countryName,
  onOpenDataset,
  onOpenDownload,
}: Props) {
  const [selectedId, setSelectedId] = useState(datasets[0]?.id ?? "");

  const selected = useMemo(
    () =>
      datasets.find((dataset) => dataset.id === selectedId) ??
      datasets[0] ??
      null,
    [datasets, selectedId]
  );

  if (!selected) {
    return (
      <div className="v54-no-actual">
        <strong>현재 제공 가능한 세부 데이터 없음</strong>
        <span>자료가 제공되면 이 화면에서 바로 확인할 수 있습니다</span>
      </div>
    );
  }

  return (
    <section className="v54-actual-preview">
      <header className="v54-actual-head">
        <div>
          <span>대상국 · {countryName} · 제공 중</span>
          <h3>{selected.titleKo}</h3>
          <p>{selected.summary}</p>
        </div>

        {datasets.length > 1 && (
          <label>
            <span>데이터 선택</span>
            <select
              value={selected.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.titleKo}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div className="v54-rendered-actual">
        <DataTypeRenderer
          dataset={selected}
          countryIso3={countryIso3}
          countryName={countryName}
        />
      </div>

      <footer className="v54-actual-footer">
        <div>
          <span>기준</span>
          <b>{selected.referenceYear}</b>
        </div>
        <div>
          <span>출처</span>
          <b>{selected.sourceOrganization}</b>
        </div>
        <div className="v55-actual-actions">
          {isDatasetDownloadable(selected) && (
            <button
              type="button"
              className="primary"
              onClick={() => onOpenDownload(selected.id)}
            >
              데이터 다운로드
            </button>
          )}
          <button type="button" onClick={() => onOpenDataset(selected.id)}>
            전체 상세 보기 →
          </button>
        </div>
      </footer>
    </section>
  );
}
