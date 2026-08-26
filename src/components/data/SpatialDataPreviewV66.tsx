import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBounds, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  loadWorldCountryBoundaries,
} from "../../data/map/worldCountryBoundaries";
import type {
  WorldCountryBoundaryCollection,
} from "../../data/map/worldCountryBoundaries";
import {
  getSpatialPresentationV66,
} from "../../utils/spatialPresentationV66";
import type {
  SpatialPresentationDefinition,
} from "../../utils/spatialPresentationV66";
import "../../styles/spatial-preview-v66.css";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const COUNTRY_SOURCE_ID = "v66-country-boundary";
const COUNTRY_FILL_ID = "v66-country-fill";
const COUNTRY_LINE_ID = "v66-country-line";

interface Props {
  element: VietnamDemoElement;
  countryIso3: string;
  countryName: string;
}

export function SpatialDataOverviewV66({
  element,
  countryIso3,
  countryName,
}: Props) {
  const definition = getSpatialPresentationV66(element.elementId);
  const [metric, setMetric] = useState(definition?.metricOptions?.[0] ?? "");

  if (!definition) return null;

  return (
    <section className="v66-spatial-overview">
      <div className="v66-spatial-toolbar">
        <div>
          <span>대상국</span>
          <strong>{countryName}</strong>
        </div>

        {definition.metricOptions && definition.metricOptions.length > 1 && (
          <label>
            <span>표시 지표</span>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value)}
            >
              {definition.metricOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="v66-spatial-grid">
        <section className="v66-map-card">
          <header>
            <div>
              <span>지도</span>
              <h4>{definition.mapLabel}</h4>
            </div>
            <small>실제 위치·경계 데이터만 지도에 표시</small>
          </header>

          <CountryBasemapV66
            countryIso3={countryIso3}
            countryName={countryName}
            definition={definition}
          />
        </section>

        <aside className="v66-layer-card">
          <header>
            <span>레이어</span>
            <h4>표시 항목</h4>
          </header>

          <div className="v66-layer-list">
            {definition.layers.map((layer) => (
              <div key={layer}>
                <span>{layer}</span>
                <b>준비 중</b>
              </div>
            ))}
          </div>

          <div className="v66-spatial-empty-copy">
            <strong>{definition.emptyTitle}</strong>
            <p>{definition.emptyDescription}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function SpatialDataDetailV66({
  element,
  countryName,
}: Omit<Props, "countryIso3">) {
  const definition = getSpatialPresentationV66(element.elementId);
  if (!definition) return null;

  return (
    <section className="v66-spatial-detail">
      <header>
        <div>
          <span>{countryName}</span>
          <h4>{definition.detailLabel}</h4>
        </div>
        <small>공간 데이터 준비 중 · 제공 항목 미리보기</small>
      </header>

      <div className="v66-detail-table">
        <div
          className="v66-detail-head"
          style={{
            gridTemplateColumns: `repeat(${definition.columns.length}, minmax(130px, 1fr))`,
          }}
        >
          {definition.columns.map((column) => (
            <b key={column}>{column}</b>
          ))}
        </div>

        <div className="v66-detail-empty">
          <strong>현재 제공 가능한 공간 데이터가 없습니다</strong>
          <span>위치가 확인된 자료만 시설 목록과 지도에 표시됩니다</span>
        </div>
      </div>
    </section>
  );
}

function CountryBasemapV66({
  countryIso3,
  countryName,
  definition,
}: {
  countryIso3: string;
  countryName: string;
  definition: SpatialPresentationDefinition;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [boundaries, setBoundaries] =
    useState<WorldCountryBoundaryCollection | null>(null);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let cancelled = false;

    void loadWorldCountryBoundaries()
      .then((result) => {
        if (!cancelled) setBoundaries(result);
      })
      .catch(() => {
        if (!cancelled) {
          setWarning("국가 경계 지도를 불러오지 못했습니다");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [106, 16],
      zoom: 4.2,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundaries) return;

    const feature = boundaries.features.find(
      (item) => item.properties.iso3 === countryIso3
    );
    if (!feature) return;

    const render = () => {
      const collection = {
        type: "FeatureCollection" as const,
        features: [feature],
      };

      if (map.getSource(COUNTRY_SOURCE_ID)) {
        const source = map.getSource(
          COUNTRY_SOURCE_ID
        ) as maplibregl.GeoJSONSource;
        source.setData(collection as any);
      } else {
        map.addSource(COUNTRY_SOURCE_ID, {
          type: "geojson",
          data: collection as any,
        });

        map.addLayer({
          id: COUNTRY_FILL_ID,
          type: "fill",
          source: COUNTRY_SOURCE_ID,
          paint: {
            "fill-color": "#0b7f70",
            "fill-opacity": 0.08,
          },
        });

        map.addLayer({
          id: COUNTRY_LINE_ID,
          type: "line",
          source: COUNTRY_SOURCE_ID,
          paint: {
            "line-color": "#0b7f70",
            "line-width": 2,
            "line-opacity": 0.75,
          },
        });
      }

      const bounds = new maplibregl.LngLatBounds();
      extendBounds(bounds, feature.geometry.coordinates);

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 52,
          maxZoom: 6.2,
          duration: 0,
        });
      }
    };

    if (map.loaded()) render();
    else map.once("load", render);
  }, [boundaries, countryIso3]);

  return (
    <div className="v66-map-wrap">
      <div ref={containerRef} className="v66-map-canvas" />

      <div className="v66-map-empty-state">
        <span>{countryName}</span>
        <strong>{definition.emptyTitle}</strong>
        <p>확인되지 않은 위치·경계는 임의로 표시하지 않습니다</p>
      </div>

      {warning && <div className="v66-map-warning">{warning}</div>}
    </div>
  );
}

function extendBounds(bounds: LngLatBounds, coordinates: unknown): void {
  if (!Array.isArray(coordinates)) return;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    bounds.extend([coordinates[0], coordinates[1]]);
    return;
  }

  coordinates.forEach((item) => extendBounds(bounds, item));
}
