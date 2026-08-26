import { useMemo, useState } from "react";
import {
  MAP_PRIMARY_INFORMATION_V120,
  getMapPrimaryInformationV120,
} from "../../data/map/mapPrimaryInformationV120";
import { getContractsByCategoryV120 } from "../../data/map/mapCategoryDataContractsV120";

export type MapPrimaryInformationV120Props = {
  initialId?: string;
  onSelect?: (id: string, presetId: string) => void;
};

export default function MapPrimaryInformationV120({
  initialId = "cooperation-overview",
  onSelect,
}: MapPrimaryInformationV120Props) {
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = getMapPrimaryInformationV120(selectedId);
  const contracts = useMemo(() => {
    if (selectedId === "cooperation-overview") {
      return selected.sourceDatasetIds
        .map((id) => getContractsByCategoryV120(id))
        .flat()
        .slice(0, 4);
    }
    return getContractsByCategoryV120(selectedId).slice(0, 4);
  }, [selected, selectedId]);

  const select = (id: string) => {
    const item = getMapPrimaryInformationV120(id);
    setSelectedId(id);
    onSelect?.(id, item.presetId);
  };

  return (
    <section className="map-primary-information-v120" aria-label="주요 정보">
      <h2>주요 정보</h2>
      <div className="map-primary-information-v120__grid" role="list">
        {MAP_PRIMARY_INFORMATION_V120.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === selectedId ? "is-active" : ""}
            aria-pressed={item.id === selectedId}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="map-primary-information-v120__summary">
        <strong>{selected.label}</strong>
        <p>{selected.description}</p>
        {contracts.length > 0 && (
          <div className="map-primary-information-v120__sources">
            {contracts.map((item) => (
              <span key={item.id}>{item.label}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
