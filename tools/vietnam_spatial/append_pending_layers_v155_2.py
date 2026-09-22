"""Append the V155-2 layer-contract proposals (B-008 low-lying zones, D-022
project locations) to ``spatial/pending-layers-v155.json``.

The entries follow the map-index layer schema like the P6a proposals; counts
are read from the built assets so the file never carries stale numbers.
Entries already present (by elementId) are left untouched; new ones are spliced
at the end as text so the P6a entries keep their formatting.

Run:

    python tools/vietnam_spatial/append_pending_layers_v155_2.py
"""

from __future__ import annotations

import json
from typing import Any

from build_slr_lowland_v155 import ATTRIBUTION, DATUM_NOTICE, LICENSE, LOWLAND_NOTICE, SOURCE_NAME, SOURCE_URL, THRESHOLDS, ZONE_LABELS
from osm_common_v155 import GEOMETRY_DIR, V2_ROOT, read_json


PENDING_LAYERS = V2_ROOT / "spatial" / "pending-layers-v155.json"
PENDING_DIR = V2_ROOT / "spatial" / "pending-v155"


def b008_entry() -> dict[str, Any]:
    zones = {key: read_json(GEOMETRY_DIR / f"vnm-slr-lowland-{key}.geojson") for key, _ in THRESHOLDS}
    by_adm1 = read_json(PENDING_DIR / "b-008-lowland-by-adm1.json")
    table = read_json(PENDING_DIR / "b-008-slr-zones.json")
    generated_at = zones["le2m"]["metadata"]["generatedAt"]
    return {
        "elementId": "B-008",
        "layerId": "vnm-v155-b-008-lowland",
        "label": "해수면 상승 개략 저지대(DEM)",
        "publicShortTitle": "해안 저지대(개략)",
        "rawLabel": "NASA 해수면 상승 전망[SSP1, SSP2, SSP3, SSP4, SSP5]",
        "category": "기후·위험",
        "detailElementId": "B-008",
        "detailUrl": "/?element=b-008&country=VNM#element-detail",
        "active": True,
        "enabled": True,
        "defaultOverlay": False,
        "defaultPrimary": False,
        "cluster": False,
        "regionalProject": False,
        "scopeCountries": ["VNM"],
        "mapMode": "polygon",
        "renderer": "zone-polygon",
        "rendererNote": "값→색이 아니라 3단계 구역 폴리곤 fill. 기존 관측소 5곳 point 레이어(B-008 시나리오 추이)는 유지하고 이 레이어를 겹쳐 쓰는 것을 제안. 단계 선택은 selectors.variables(각각 다른 geometryUrl)로.",
        "boundaryPolicy": "native-34",
        "aggregationLevel": "post-2025-34-unit",
        "spatialScopeType": "zone",
        "coordinateMeaning": "derived-raster-zone",
        "assetRef": {"elementId": "B-008", "provider": "vietnam-v124", "section": "geometry"},
        "geometryUrl": "/data/vietnam/v2/geometry/vnm-slr-lowland-le2m.geojson",
        "geometryUrlByVariable": {key: f"/data/vietnam/v2/geometry/vnm-slr-lowland-{key}.geojson" for key, _ in THRESHOLDS},
        "geometryTypes": ["MultiPolygon"],
        "featureCount": zones["le2m"]["metadata"]["featureCount"],
        "featureCountByVariable": {key: zones[key]["metadata"]["featureCount"] for key, _ in THRESHOLDS},
        "joinKey": "adm1Code34",
        "unit": "km²",
        "selectors": {
            "defaultPeriod": "2026",
            "defaultVariable": "le1m",
            "periods": ["2026"],
            "periodLabels": {"2026": "Copernicus DEM GLO-30 타일 2026-09-22 취득(DEM 자체는 2011–2015 촬영 기반)"},
            "variables": [
                {
                    "key": key,
                    "label": f"해발 {ZONE_LABELS[key]}(EGM2008) 저지대",
                    "periods": ["2026"],
                    "unit": "km²",
                    "geometryUrl": f"/data/vietnam/v2/geometry/vnm-slr-lowland-{key}.geojson",
                    "totalAreaKm2": zones[key]["metadata"]["totalAreaKm2"],
                    "maxFeatureCount": zones[key]["metadata"]["featureCount"],
                }
                for key, _ in THRESHOLDS
            ],
        },
        "scenarioLookupUrl": "/data/vietnam/v2/spatial/pending-v155/b-008-slr-zones.json",
        "scenarioLookupNote": f"b-008.csv 관측소×시나리오×연도 중앙값 상승량을 3단계 구간에 대응만 함({table['entryCount']}행, 보간·예측 없음, 기준면 상이).",
        "adm1SummaryUrl": "/data/vietnam/v2/spatial/pending-v155/b-008-lowland-by-adm1.json",
        "adm1SummaryNote": "성·시(34)별 단계별 저지대 면적·성 면적 대비 % — P4 상세 지역 막대용",
        "filters": [{"field": "adm1Name34", "label": "성·시(2025)", "values": []}],
        "factFields": [
            {"key": "zoneLabel", "label": "구간", "sources": ["zoneLabel"]},
            {"key": "adm1Name34", "label": "성·시(2025)", "sources": ["adm1Name34"], "filterable": True},
            {"key": "areaKm2", "label": "저지대 면적", "sources": ["areaKm2"], "unit": "km²"},
            {"key": "sharePct", "label": "성 면적 대비", "sources": ["sharePct"], "unit": "%"},
        ],
        "fieldLabels": {"zoneLabel": "구간", "adm1Name34": "성·시(2025)", "areaKm2": "저지대 면적", "sharePct": "성 면적 대비"},
        "tooltipFields": ["adm1Name34", "zoneLabel", "areaKm2", "sharePct"],
        "polygonStyle": {
            "le2m": {"fillColor": "#a9cbe8", "fillOpacity": 0.55, "outlineColor": "#a9cbe8", "outlineWidth": 0},
            "le1m": {"fillColor": "#4f8fc6", "fillOpacity": 0.6, "outlineColor": "#4f8fc6", "outlineWidth": 0},
            "le0p5m": {"fillColor": "#17416b", "fillOpacity": 0.65, "outlineColor": "#17416b", "outlineWidth": 0},
            "note": "순차색(진할수록 낮음). 한 단계만 표시하거나 ≤2→≤1→≤0.5 순으로 겹쳐 그리기. 색은 제안값, V150 팔레트에 맞춰 P6b에서 확정.",
        },
        "legend": {
            "title": "해안 저지대(개략, EGM2008 기준 높이)",
            "note": "≤0.5 m · ≤1 m · ≤2 m 3단계 · 30 m DEM · 바다와 연결된 셀만 · 침수 예측 아님",
        },
        "source": SOURCE_NAME,
        "sourceOrganizations": ["European Space Agency (Copernicus DEM GLO-30)", "NASA Sea Level Projection Tool (IPCC AR6) · PSMSL"],
        "sourceUrls": [SOURCE_URL, "https://sealevel.nasa.gov/ipcc-ar6-sea-level-projection-tool"],
        "sourceYear": "2026",
        "latestYear": "2026",
        "license": LICENSE,
        "licenses": [LICENSE],
        "attribution": ATTRIBUTION,
        "accuracyNotice": f"{LOWLAND_NOTICE} {DATUM_NOTICE}",
        "publicSpatialNotice": LOWLAND_NOTICE,
        "spatialLimitation": "30 m DSM(수목·건물 포함) 기반이며 해안 30 km 안에서 바다와 연결된 셀만 표시. 지반침하·제방·조석·해일 미반영. 상승량(2005년 기준 상대해수면)과 구역 높이(EGM2008)는 기준면이 달라 대응표로만 연결.",
        "spatialCoverage": f"성·시 34개 중 ≤2 m {zones['le2m']['metadata']['featureCount']}개 · ≤1 m {zones['le1m']['metadata']['featureCount']}개 · ≤0.5 m {zones['le0p5m']['metadata']['featureCount']}개",
        "spatialStatus": "ready-pending-registration",
        "missingValuePolicy": "저지대가 없는 성·시는 피처 없음(0 대체 없음)",
        "mapBenefit": "해수면 상승 시나리오 추이(관측소)와 함께 성·시별 개략 저지대 분포를 볼 수 있습니다.",
        "mapTargetV138": {
            "sourceSpatialUnit": "Copernicus DEM GLO-30 30 m 셀",
            "displaySpatialUnit": "성·시(2025)별 저지대 폴리곤 3단계",
            "limitation": LOWLAND_NOTICE,
            "evidence": f"DEM 타일 {zones['le2m']['metadata']['sourceTileCount']}개 해시 기록, 래스터 포함관계 assert, 성별 면적 by-adm1 JSON",
            "representativeItem": f"≤1 m 저지대 총 {by_adm1['totals']['le1m']['areaKm2']:,} km²",
        },
        "generatedAt": generated_at,
    }


def d022_entry() -> dict[str, Any]:
    draft = read_json(PENDING_DIR / "d-022-locations.json")
    validation = draft["validation"]
    aggregation = draft["aggregation"]
    return {
        "elementId": "D-022",
        "layerId": "vnm-v155-d-022",
        "label": "개발금융 사업 소재 성·시",
        "publicShortTitle": "개발금융 사업 위치",
        "rawLabel": "MDB/DFI/PPP 투자 프로젝트",
        "category": "시장·산업 및 재원",
        "detailElementId": "D-022",
        "detailUrl": "/?element=d-022&country=VNM#element-detail",
        "active": True,
        "enabled": True,
        "defaultOverlay": False,
        "defaultPrimary": False,
        "cluster": False,
        "regionalProject": False,
        "scopeCountries": ["VNM"],
        "mapMode": "region-choropleth",
        "renderer": "admin1-choropleth",
        "rendererNote": "조인 키가 adm1Code(63)가 아니라 adm1Code34(2025 34 단위)이고 경계 자산이 vnm-adm1-34 입니다. 63 토글 시에는 memberAdm1Codes 로 같은 값을 펼쳐 칠하는 것을 제안(값 분할 없음).",
        "boundaryPolicy": "native-34",
        "aggregationLevel": "post-2025-34-unit",
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "assetRef": {"elementId": "D-022", "provider": "vietnam-v124", "section": "spatial"},
        "geometryUrl": "/data/vietnam/v2/geometry/vnm-adm1-34.geojson",
        "dataUrl": "/data/vietnam/v2/spatial/pending-v155/d-022-locations.json",
        "dataUrlRegistrationTarget": "spatial/layers/d-022.json (P6b 에서 이동 후 dataUrl 교체)",
        "joinKey": "adm1Code34",
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "featureCount": len(aggregation["byAdm1Code34"]),
        "totalEntityCount": validation["recordCount"],
        "unit": "건",
        "selectors": draft["selectors"],
        "valueScale": {"kind": "sequential", "note": "사업 수는 정수 등급, 승인액은 USD 합계(다수 성 사업 전액 계상)"},
        "filters": [],
        "tooltipFields": ["adm1Name34", "value", "unit", "recordIds"],
        "fieldLabels": {"adm1Name34": "성·시(2025)", "recordIds": "해당 사업"},
        "legend": {
            "title": "개발금융 사업 수(소재 성·시)",
            "note": f"World Bank {validation['recordCount']}건 중 성·시 확인 {validation['provinceMappedCount']}건 · 전국 사업 {validation['nationalCount']}건은 성별 값 없음 · {aggregation['rule']}",
        },
        "nationalRecordIds": aggregation["nationalRecordIds"],
        "pendingRecordIds": aggregation["pendingRecordIds"],
        "source": "IATI Registry — d-portal(World Bank 보고) · World Bank Projects & Operations",
        "sourceOrganizations": ["IATI Registry — d-portal 집계(World Bank·ADB·IFC 등 MDB·DFI 보고분)", "World Bank Projects & Operations"],
        "sourceUrls": ["https://d-portal.iatistandard.org/ctrack.html?country=VN", "https://projects.worldbank.org/en/projects-operations/projects-list?countrycode_exact=VN"],
        "sourceYear": "2025",
        "latestYear": "2025",
        "license": "d-portal / IATI 이용약관",
        "licenses": ["d-portal / IATI 이용약관", "World Bank Open Data 이용약관"],
        "attribution": "Project locations: World Bank activity <location> elements reported to IATI (d-portal) and World Bank project documents (PAD/PID/ISDS/Program Document). Province names lifted to the 2025 34-unit boundaries (Nghị quyết 202/2025/QH15).",
        "accuracyNotice": "소재는 World Bank가 IATI로 보고한 성 단위 location과 사업문서에 명시된 성·시만 사용했으며 좌표 추정·지오코딩은 하지 않았습니다. 다수 성 사업은 각 성에 사업 수 1건·승인액 전액을 계상하므로 성 간 합산은 중복됩니다. 전국 사업(개발정책차관·전국 융자 프로그램)은 성별 값이 없습니다. 하위사업이 실행 중 결정되는 프로그램은 전국으로 분류했습니다.",
        "publicSpatialNotice": "성·시 단위 소재(World Bank 보고)이며 사업 현장 좌표가 아닙니다.",
        "spatialLimitation": "회랑형 사업(남부 수로)은 문서에 명시된 양단 시만 대응하고 경유 성은 미표시. 컨셉 단계 사업은 범위가 바뀔 수 있음.",
        "spatialCoverage": f"성·시 34개 중 {len(aggregation['byAdm1Code34'])}개 · 사업 {validation['recordCount']}건(성 확인 {validation['provinceMappedCount']}·전국 {validation['nationalCount']}·미확인 {validation['pendingCount']})",
        "spatialStatus": "ready-pending-registration",
        "missingValuePolicy": "사업이 없는 성·시는 투명 처리, 0 대체 없음",
        "mapBenefit": "개발금융 사업이 어느 성·시에 집중되는지 물 스트레스·저지대·인프라 레이어와 함께 볼 수 있습니다.",
        "mapTargetV138": {
            "sourceSpatialUnit": "World Bank 보고 성·시(IATI location precision 2 · 사업문서 명시)",
            "displaySpatialUnit": "성·시(2025 34 단위) choropleth",
            "limitation": "다수 성 사업 전액 계상(성 간 합산 불가), 전국 사업 미표시, 좌표 없음",
            "evidence": f"매핑률 {validation['mappedRate']:.0%}, 출처 URL {validation['urlOkCount']}/{validation['urlCheckCount']} 응답 200, 성명 정규화 {validation['nameNormalizationRate']:.0%}",
            "representativeItem": "성·시별 개발금융 사업 수",
        },
        "generatedAt": draft["generatedAt"],
    }


def compact_dumps(value: Any, indent: int = 2, level: int = 0, width: int = 140) -> str:
    """json.dumps with short lists/objects kept on one line (matches the hand-written P6a entries)."""

    flat = json.dumps(value, ensure_ascii=False)
    if not isinstance(value, (dict, list)) or len(flat) + indent * level <= width:
        return flat
    pad = " " * (indent * (level + 1))
    end = " " * (indent * level)
    if isinstance(value, dict):
        items = [f"{pad}{json.dumps(key, ensure_ascii=False)}: {compact_dumps(item, indent, level + 1, width)}" for key, item in value.items()]
        return "{\n" + ",\n".join(items) + "\n" + end + "}"
    items = [f"{pad}{compact_dumps(item, indent, level + 1, width)}" for item in value]
    return "[\n" + ",\n".join(items) + "\n" + end + "]"


def main() -> None:
    """Splice the two entries into the file as text so the existing entries keep their formatting."""

    text = PENDING_LAYERS.read_text(encoding="utf-8")
    document = json.loads(text)
    existing = {layer["elementId"] for layer in document["layers"]}
    entries = [entry for entry in (b008_entry(), d022_entry()) if entry["elementId"] not in existing]
    if not entries:
        print("entries already present")
        return
    marker = "\n  ]\n}\n"
    if not text.endswith(marker):
        raise SystemExit("unexpected file ending; refusing to splice")
    body = ",\n".join("    " + compact_dumps(entry, level=2) for entry in entries)
    text = text[: -len(marker)] + ",\n" + body + marker
    text = text.replace('"schemaVersion": "pending-layers-v155-1"', '"schemaVersion": "pending-layers-v155-2"', 1)
    json.loads(text)  # must still parse
    PENDING_LAYERS.write_text(text, encoding="utf-8", newline="\n")
    print("layers:", [layer["elementId"] for layer in json.loads(text)["layers"]])


if __name__ == "__main__":
    main()
