import { useEffect, useMemo, useState } from "react";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../../data/countries/countryDataTypesV122";
import { loadCountryElementEntitiesV122, loadCountryMapIndexV122 } from "../../../data/countries/countryDataFacadeV122";
import { loadVietnamSpatialGeoJsonV124, loadVietnamSpatialLayerV124, type VietnamMapGeoJsonV124 } from "../../../data/vietnam/vietnamDataLoaderV124";
import type { VietnamSpatialLayerAssetV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { prepareLayerRecordsV138 } from "../../../data/map/prepareLayerRecordsV148";
import { detailMapHandoffV148, detailMapSelectionV148, finiteMapValueV148, coordinatePairsV148, overviewProjectionV148, geometryPathV148, mapColorV148 } from "../../../data/map/detailMapModelV148";
import { mapFactsV148, mapIndicatorSourceV148 } from "../../../data/map/mapPresentationV148";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { publicSourceOrganizationV136_1 } from "../../../data/visualization/publicFieldPolicyV126";
import { MAP_PLACES_V150 } from "../../../data/map/mapBackdropV150";
import "./detail-location-map-v148.css";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

type Runtime = { layer: CountryMapLayerV122; base: VietnamMapGeoJsonV124; geometry?: VietnamMapGeoJsonV124; data?: VietnamSpatialLayerAssetV124; records: CountryEntityV122[] };
const BASE = "/data/vietnam/v2/geometry/vnm-adm1-63.geojson";
const EMPTY_RECORDS: CountryEntityV122[] = [];
interface Props {
  compact?: boolean;
  elementId: string; countryIso3: string; selection: DataFinderSelectorStateV125;
  onOpenMap: (elementId: string, countryIso3: string, selection: DataFinderSelectorStateV125) => void;
}

/** Lazy SVG overview: no second map engine, no independent data delivery.
 * It shares the full map's assets and point exclusion/grouping rules. */
export default function DetailLocationMapV148({ elementId, countryIso3, selection, onOpenMap, compact = false }: Props) {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [error, setError] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  const [picked, setPicked] = useState("");
  const [override, setOverride] = useState<{ variable: string; period: string } | null>(null);
  const selectionKey = JSON.stringify(selection);
  useEffect(() => { setOverride(null); setPicked(""); }, [selectionKey, elementId]);
  useEffect(() => {
    let cancelled = false;
    setRuntime(null); setError(false); setUnavailable(false);
    if (countryIso3 !== "VNM") { setUnavailable(true); return; }
    void loadCountryMapIndexV122(countryIso3).then(async (layers) => {
      const layer = layers.find((l) => l.elementId === elementId && l.enabled !== false);
      if (!layer) { if (!cancelled) setUnavailable(true); return; }
      const [base, geometry, data, records] = await Promise.all([
        loadVietnamSpatialGeoJsonV124(BASE),
        layer.geometryUrl ? loadVietnamSpatialGeoJsonV124(layer.geometryUrl) : Promise.resolve(undefined),
        layer.dataUrl ? loadVietnamSpatialLayerV124(layer.dataUrl) : Promise.resolve(undefined),
        layer.geometryUrl ? Promise.resolve(EMPTY_RECORDS) : loadCountryElementEntitiesV122(countryIso3, elementId).then((r) => r.records),
      ]);
      if (!cancelled) setRuntime({ layer, base, geometry, data, records });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [elementId, countryIso3, retry]);
  const resolved = useMemo(() => runtime ? detailMapSelectionV148(runtime.layer, selection) : null, [runtime, selection]);
  const slice = override || resolved;
  const model = useMemo(() => {
    if (!runtime || !slice) return null;
    const { layer, base, geometry, data } = runtime;
    const variable = layer.selectors.variables.find((v) => v.key === slice.variable);
    const values = data?.values.filter((v) => v.variable === slice.variable && v.period === slice.period) || [];
    const byCode = new Map(values.map((v) => [v.adm1Code, v]));
    const finite = values.flatMap((v) => finiteMapValueV148(v.value) === null ? [] : [v.value]);
    const min = finite.length ? Math.min(...finite) : 0, max = finite.length ? Math.max(...finite) : 0;
    const prepared = prepareLayerRecordsV138(runtime.records, layer);
    const points = prepared.records.filter((r) => r.mapEligible && typeof r.latitude === "number" && typeof r.longitude === "number")
      .filter((r) => layer.filters.every((f) => {
        const chosen = selection.dimensions[f.field] || f.defaultValue || "all";
        return chosen === "all" || String(r.normalizedAttributes?.[f.field] ?? "") === chosen;
      }));
    const features = (geometry || base).features.filter((f) => layer.renderer !== "line" || slice.variable === "all" || String(f.properties.voltageKv ?? f.properties.voltage) === slice.variable);
    const extent = [...base.features, ...(geometry?.features || [])].flatMap((f) => coordinatePairsV148(f.geometry.coordinates));
    points.forEach((r) => extent.push([r.longitude!, r.latitude!]));
    const project = overviewProjectionV148(extent, compact ? 360 : 460, 400);
    const options: Array<{ id: string; label: string; value: number | null; sourceRegion?: string }> = data ? values.map((v) => ({ id: v.adm1Code, label: v.adm1Name, value: v.value, sourceRegion: v.sourceRegion }))
      : geometry ? features.map((f, i) => ({ id: String(f.id ?? i), label: String(f.properties.projectTitle || f.properties.name || f.properties.displayLabel || `${f.properties.voltageKv || ""} kV 선로 ${i + 1}`), value: null, sourceRegion: undefined }))
      : points.map((r) => ({ id: r.recordId, label: resolvePublicEntityTitleV131(r, { elementTitle: layer.publicShortTitle }).title, value: null, sourceRegion: undefined }));
    return { variable, values, byCode, min, max, points, prepared, features, project, options };
  }, [runtime, slice, selection.dimensions, compact]);

  if (unavailable) return null;
  if (error) return <section className="detail-map148"><h3>위치·분포</h3><p>지도를 불러오지 못했습니다.</p><button type="button" onClick={() => setRetry((v) => v + 1)}>다시 시도</button></section>;
  if (!runtime || !model || !slice) return <section className="detail-map148" role="status">작은 지도를 불러오는 중입니다.</section>;
  const { layer, base, data, geometry } = runtime;
  const current = model.options.find((o) => o.id === picked);
  const point = model.points.find((r) => r.recordId === picked);
  const feature = geometry ? model.features.find((f, i) => String(f.id ?? i) === picked) : undefined;
  const selectedFacts = mapFactsV148(layer, point?.normalizedAttributes || feature?.properties || {}).filter((f) => f.key !== "sourceLabel").slice(0, 5);
  const periods = model.variable?.periods || layer.selectors.periods;
  const handoff = detailMapHandoffV148(layer, slice, selection);
  const approximate = model.prepared.approximateRecordIds.size > 0;
  const units = displayUnitV150(model.variable?.unit || layer.unit || "");
  const pointPeriod = elementId === "A-023" ? (selection.dimensions.sourceKey === "osm" ? "2026" : selection.dimensions.sourceKey === "all" ? "2021·2026" : "2021") : slice.period;
  const sliceSources = [...new Set(model.values.map((v) => mapIndicatorSourceV148(v.sourceIndicatorId || "")).filter(Boolean))];
  return <section className="detail-map148" data-testid="detail-location-map-v148" data-element-id={elementId} data-map-variable={slice.variable} data-map-period={pointPeriod} data-map-count={data ? model.values.length : geometry ? model.features.length : model.points.length}>
    <header><div><h3>{data ? "지역별 분포" : layer.renderer === "line" ? "송전선 경로" : "위치 살펴보기"}</h3><p><PublicTermTextV134 text={`${model.variable?.label || layer.publicShortTitle} · ${pointPeriod}${units && data ? ` · ${units}` : ""}`} /></p></div>
      <button className="cdp-button cdp-button--secondary" data-testid={compact ? "home-hero-map-link-v139" : undefined} type="button" onClick={() => onOpenMap(elementId, countryIso3, handoff)}>큰 지도에서 비교</button>
    </header>
    {!override && resolved?.note && <p className="detail-map148-note">{resolved.note}</p>}
    {data && !compact && <div className="detail-map148-controls">
      <label>지도 표시 항목<select aria-label="작은 지도 표시 항목" value={slice.variable} onChange={(e) => { const v = layer.selectors.variables.find((o) => o.key === e.target.value)!; setOverride({ variable: v.key, period: v.periods.includes(slice.period) ? slice.period : v.periods[v.periods.length - 1] }); setPicked(""); }}>
        {layer.selectors.variables.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
      </select></label>
      <label>지도 기준시점<select aria-label="작은 지도 기준시점" value={slice.period} onChange={(e) => { setOverride({ variable: slice.variable, period: e.target.value }); setPicked(""); }}>{periods.map((p) => <option key={p}>{p}</option>)}</select></label>
      {/* Native options cannot carry the glossary help, so the chosen labels are restated here with it. */}
      <p className="detail-map148-selection"><PublicTermTextV134 text={`선택: ${model.variable?.label || slice.variable} · ${slice.period}`} /></p>
    </div>}
    <div className="detail-map148-layout">
      <figure>
        <svg viewBox={`0 0 ${compact ? 360 : 460} 400`} role="img" aria-label={`${layer.publicShortTitle} ${pointPeriod} ${data ? "지역 분포" : "위치"}. 지역·대상 선택 목록에서도 정보를 확인할 수 있습니다.`}>
          <g fill="#f7f5e9" stroke="#778d89" strokeWidth="0.9">{base.features.map((f, i) => <path key={String(f.id || i)} d={geometryPathV148(f.geometry, model.project)} fillRule="evenodd" />)}</g>
          {geometry && model.features.map((f, i) => {
            const id = data ? String(f.properties.adm1Code || "") : String(f.id ?? i);
            const v = model.byCode.get(id);
            const color = data ? mapColorV148(v ? finiteMapValueV148(v.value) : null, model.min, model.max) : Number(f.properties.voltageKv || f.properties.voltage) >= 500 ? "#b94a22" : "#196fa0";
            if (f.geometry.type === "Point") { const xy = coordinatePairsV148(f.geometry.coordinates)[0]; if (!xy) return null; const [x, y] = model.project(xy); return <circle key={id} cx={x} cy={y} r={picked === id ? 5 : 3} fill="#a95025" onClick={compact ? undefined : () => setPicked(id)}><title>{model.options.find((o) => o.id === id)?.label}</title></circle>; }
            return <path key={id} d={geometryPathV148(f.geometry, model.project)} fillRule="evenodd" fill={layer.renderer === "line" ? "none" : color} stroke={picked === id ? "#142e27" : layer.renderer === "line" ? color : "#556f69"} strokeWidth={picked === id ? 2.5 : layer.renderer === "line" ? 1.4 : 0.65} fillOpacity={layer.renderer === "regional-scope" ? 0.35 : 1} onClick={compact ? undefined : () => setPicked(id)}><title>{v ? `${v.adm1Name}: ${formatPublicNumberV126(v.value, units)} ${units}` : model.options.find((o) => o.id === id)?.label || "자료 없음"}</title></path>;
          })}
          {!geometry && model.points.map((r) => { const [x, y] = model.project([r.longitude!, r.latitude!]); return <circle key={r.recordId} cx={x} cy={y} r={picked === r.recordId ? 5.5 : 2.8} fill={model.prepared.approximateRecordIds.has(r.recordId) ? "white" : "#087f74"} stroke={picked === r.recordId ? "#c04721" : "#087f74"} strokeWidth={picked === r.recordId ? 2 : 1} onClick={compact ? undefined : () => setPicked(r.recordId)}><title>{resolvePublicEntityTitleV131(r, { elementTitle: layer.publicShortTitle }).title}</title></circle>; })}
          <g className="detail-map148-place-labels" pointerEvents="none">{MAP_PLACES_V150.filter(p => p.kind === "city").map(p => { const [x,y] = model.project([p.lon,p.lat]); return <g key={p.name}><circle cx={x} cy={y} r="2.2" fill="#283b43" /><text x={x+9} y={y-7}>{p.name}</text></g>; })}</g>
          <g className="detail-map148-compass" transform="translate(24,30)"><path d="M0 0 L-5 14 L0 11 L5 14 Z" fill="#35504a" /><text x="0" y="-6" textAnchor="middle">북</text></g>
        </svg>
        {data && <figcaption className="detail-map148-legend"><span>{formatPublicNumberV126(model.min, units)}</span><i style={{ background: `linear-gradient(to right, ${mapColorV148(model.min, model.min, model.max)}, ${mapColorV148((model.min + model.max) / 2, model.min, model.max)}, ${mapColorV148(model.max, model.min, model.max)})` }} /><span>{formatPublicNumberV126(model.max, units)} {units}</span><small>회색: 자료 없음</small></figcaption>}
        {!data && <figcaption>{layer.renderer === "line" ? <><span className="detail-map148-line-key is-high" /><PublicTermTextV134 text="500 kV 이상" /> <span className="detail-map148-line-key" /><PublicTermTextV134 text={`500 kV 미만 · ${model.features.length}개 선로 구간`} /></> : `${geometry ? model.features.length : model.points.length}개 위치·범위`}{approximate ? " · 속 빈 점은 소재 지역의 대표 위치" : ""}</figcaption>}
      </figure>
      {!compact && <div className="detail-map148-selection">
        <label>지역·대상 선택<select aria-label="작은 지도 지역·대상 선택" value={picked} onChange={(e) => setPicked(e.target.value)}><option value="">지도 또는 목록에서 선택</option>{model.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        {current ? <><h4>{current.label}</h4>{current.value !== null && <p className="detail-map148-value">{formatPublicNumberV126(current.value, units)} {units}</p>}{current.sourceRegion && <p className="detail-map148-note">{current.sourceRegion} 단위로 제공된 값입니다.</p>}
          <dl>{selectedFacts.map((f) => <div key={f.key}><dt>{f.label}</dt><dd>{/^https?:\/\//.test(f.value) ? <a href={f.value} target="_blank" rel="noreferrer">공식 원문</a> : f.value}</dd></div>)}</dl>
          {point && <p className="detail-map148-note">{[mapIndicatorSourceV148(point.indicatorId, publicSourceOrganizationV136_1(point.provenance.sourceOrg) || ""), point.provenance.referenceYear].filter(Boolean).join(" · ")}</p>}
        </> : <p className="detail-map148-note">위치를 선택하면 지역 값이나 대상의 주요 정보를 확인할 수 있습니다.</p>}
        {["B-023", "B-025", "B-028"].includes(elementId) && <p className="detail-map148-note">관측지점 또는 대표 위치입니다. 유역 경계와 영향 범위를 나타내지 않습니다.</p>}
        {elementId === "B-021" && <p className="detail-map148-note">6개 권역의 값을 소속 성·시에 표시합니다. 성·시별 독립값이 아닙니다.</p>}
        {["C-019", "C-022"].includes(elementId) && <p className="detail-map148-note">개편 후 34개 지역의 값을 개편 전 경계에 대응해 표시합니다.</p>}
        {elementId === "D-018" && <p className="detail-map148-note">참여국 범위와 확인된 활동 위치를 구분해 표시합니다.</p>}
      </div>}
    </div>
    {compact && ["B-021", "C-019", "C-022"].includes(elementId) && <p className="detail-map148-note">{elementId === "B-021" ? "6개 권역의 값입니다. 성·시별 독립값이 아닙니다." : "개편 후 34개 지역의 값을 개편 전 경계에 대응한 지도입니다."}</p>}
    {compact && ["B-023", "B-025", "B-028"].includes(elementId) && <p className="detail-map148-note">관측지점 또는 대표 위치이며, 유역 경계가 아닙니다.</p>}
    <footer>지도자료: <PublicTermTextV134 text={publicSourceOrganizationV136_1(sliceSources.join(" · ") || layer.sourceOrganizations?.join(" · ") || layer.source) || "자료정보의 제공기관 참조"} /> · 경계: <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a> (개편 전 63개 성·시, CC BY 4.0)</footer>
  </section>;
}
