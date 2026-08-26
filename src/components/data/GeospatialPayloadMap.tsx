import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface GeospatialPayloadMapProps {
  features: Array<Record<string, unknown>>;
  sourceUrl?: string;
  onOpenSource?: () => void;
}

interface MapPoint {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  note: string;
  technology: string;
}

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export default function GeospatialPayloadMap({
  features,
  sourceUrl,
  onOpenSource,
}: GeospatialPayloadMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const markerIndexRef = useRef(new Map<string, Marker>());
  const [selectedId, setSelectedId] = useState<string>("");

  const points = useMemo<MapPoint[]>(() => {
    return features
      .map((feature, index) => {
        const latitude = readNumber(feature, ["latitude", "lat"]);
        const longitude = readNumber(feature, ["longitude", "lon", "lng"]);
        if (latitude === null || longitude === null) return null;

        const properties = asRecord(feature.properties);
        return {
          id: readString(feature, ["id"]) || `feature-${index + 1}`,
          name:
            readString(feature, ["name", "title", "facilityName"]) ||
            `공간객체 ${index + 1}`,
          region: readString(feature, ["regionName", "region"]) || "미확인",
          latitude,
          longitude,
          note:
            readString(feature, ["note", "summary", "description"]) ||
            readString(properties, ["note", "summary", "description"]) ||
            "속성정보 없음",
          technology:
            readString(feature, ["technologyId", "technologyName"]) ||
            readString(properties, ["technologyId", "technologyName"]) ||
            "미확인",
        };
      })
      .filter((item): item is MapPoint => item !== null);
  }, [features]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [106, 16],
      zoom: 4.2,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left"
    );
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerIndexRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentMap = map;

    function renderMarkers() {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerIndexRef.current.clear();

      const bounds = new maplibregl.LngLatBounds();

      points.forEach((point) => {
        const popup = new maplibregl.Popup({
          offset: 18,
          maxWidth: "320px",
        }).setHTML(
          `<div class="data-renderer-map-popup">
            <strong>${escapeHtml(point.name)}</strong>
            <span>${escapeHtml(point.region)}</span>
            <p>${escapeHtml(point.note)}</p>
            <small>${point.latitude.toFixed(4)}, ${point.longitude.toFixed(
            4
          )}</small>
          </div>`
        );

        const marker = new maplibregl.Marker({ color: "#0b7f70" })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(currentMap);

        marker
          .getElement()
          .setAttribute("aria-label", `${point.name} 지도 위치`);
        marker
          .getElement()
          .addEventListener("click", () => setSelectedId(point.id));
        markersRef.current.push(marker);
        markerIndexRef.current.set(point.id, marker);
        bounds.extend([point.longitude, point.latitude]);
      });

      if (points.length === 1) {
        currentMap.easeTo({
          center: [points[0].longitude, points[0].latitude],
          zoom: 10,
        });
      } else if (points.length > 1 && !bounds.isEmpty()) {
        currentMap.fitBounds(bounds, { padding: 64, maxZoom: 9, duration: 0 });
      }
    }

    if (currentMap.loaded()) {
      renderMarkers();
    } else {
      currentMap.once("load", renderMarkers);
    }
  }, [points]);

  function focusPoint(point: MapPoint) {
    setSelectedId(point.id);
    const map = mapRef.current;
    const marker = markerIndexRef.current.get(point.id);
    if (!map || !marker) return;

    map.easeTo({
      center: [point.longitude, point.latitude],
      zoom: Math.max(map.getZoom(), 9),
      duration: 500,
    });
    marker.getPopup()?.setLngLat([point.longitude, point.latitude]).addTo(map);
  }

  if (points.length === 0) {
    return (
      <div className="data-renderer-state">
        <strong>지도에 표시할 유효한 좌표가 없습니다</strong>
        <span>위치가 확인된 자료만 지도에 표시됩니다</span>
      </div>
    );
  }

  return (
    <div className="data-renderer-map-layout">
      <div className="data-renderer-map-panel">
        <div ref={mapContainerRef} className="data-renderer-map-canvas" />
        <div className="data-renderer-map-caption">
          <span>실제 배경지도 위에 좌표가 있는 공간객체만 표시</span>
          <strong>{points.length.toLocaleString("ko-KR")}건</strong>
        </div>
      </div>

      <div className="data-renderer-location-list" aria-label="지도 위치 목록">
        {points.map((point, index) => (
          <button
            key={point.id}
            type="button"
            className={selectedId === point.id ? "active" : ""}
            onClick={() => focusPoint(point)}
          >
            <span className="data-renderer-location-index">{index + 1}</span>
            <span className="data-renderer-location-copy">
              <strong>{point.name}</strong>
              <small>{point.region}</small>
              <em>{point.note}</em>
            </span>
            <span className="data-renderer-location-coordinate">
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
            </span>
          </button>
        ))}

        {sourceUrl && onOpenSource && (
          <button
            type="button"
            className="secondary-button data-renderer-location-source"
            onClick={onOpenSource}
          >
            원 공간자료 확인 ↗
          </button>
        )}
      </div>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
