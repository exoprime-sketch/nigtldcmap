"""Build deterministic Vietnam V124 spatial assets from the V124 data payloads.

The checked-in files under ``tools/vietnam_spatial/source`` are immutable,
redistributable geometry capsules.  The public V2 directory is disposable build
output.  Indicator values are always projected from the V124 payloads passed by
the data builder; this module never invents coordinates, copies national values
to provinces, or converts missing values to zero.
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import re
import unicodedata
from collections import defaultdict
from copy import deepcopy
from typing import Any, Iterable, Mapping

from tools.vietnam_spatial.build_transmission_network import (
    DEFAULT_VENDORED_SOURCE,
    normalize as normalize_transmission,
    read_vendored_source,
    write_json as write_transmission_json,
)
from tools.vietnam_spatial.spatial_semantics_v130 import (
    GREATER_MEKONG_TITLE_TOKEN,
    MEKONG_EBA_TITLE_TOKEN,
)


SCHEMA_VERSION = "v124"
GENERATED_AT = "2026-09-01T00:00:00Z"
ADM1_GEOMETRY_URL = "/data/vietnam/v2/geometry/vnm-adm1-63.geojson"
ADM1_ALIASES_URL = "/data/vietnam/v2/geometry/vnm-adm1-aliases.json"
TRANSMISSION_URL = "/data/vietnam/v2/geometry/vnm-transmission-network.geojson"
REGIONAL_PROJECT_URL = "/data/vietnam/v2/spatial/projects/d-018-regional.geojson"

LAYER_ORDER = [
    "A-023",
    "A-024",
    "C-016",
    "B-031",
    "B-032",
    "B-033",
    "B-034",
    "B-021",
    "B-048",
    "C-025",
    "D-008",
    "D-018",
]

CATEGORY_BY_ELEMENT = {
    "A-023": "에너지·인프라",
    "A-024": "에너지·인프라",
    "C-016": "에너지·인프라",
    "B-031": "산림·토지",
    "B-032": "산림·토지",
    "B-033": "산림·토지",
    "B-034": "산림·토지",
    "B-021": "기후·위험",
    "B-048": "물·자원",
    "C-025": "국제사업·재원",
    "D-008": "국제사업·재원",
    "D-018": "국제사업·재원",
    "D-023": "국제사업·재원",
}

# Global Data Lab's six Vietnam regions, expanded through an explicit,
# reviewable membership table.  These are region observations, not national
# observations, and every pre-reform ADM1 belongs to exactly one region.
GDL_REGION_PROVINCES = {
    "Central Highlands": [
        "Kon Tum",
        "Gia Lai",
        "Đắk Lắk",
        "Đắk Nông",
        "Lâm Đồng",
    ],
    "Mekong River Delta": [
        "Long An",
        "Tiền Giang",
        "Bến Tre",
        "Trà Vinh",
        "Vĩnh Long",
        "Đồng Tháp",
        "An Giang",
        "Kiên Giang",
        "Cần Thơ",
        "Hậu Giang",
        "Sóc Trăng",
        "Bạc Liêu",
        "Cà Mau",
    ],
    "North Central Coast and South Central Coast": [
        "Thanh Hóa",
        "Nghệ An",
        "Hà Tĩnh",
        "Quảng Bình",
        "Quảng Trị",
        "Thừa Thiên Huế",
        "Đà Nẵng",
        "Quảng Nam",
        "Quảng Ngãi",
        "Bình Định",
        "Phú Yên",
        "Khánh Hòa",
        "Ninh Thuận",
        "Bình Thuận",
    ],
    "North East, North West": [
        "Hà Giang",
        "Cao Bằng",
        "Bắc Kạn",
        "Tuyên Quang",
        "Lào Cai",
        "Yên Bái",
        "Thái Nguyên",
        "Lạng Sơn",
        "Bắc Giang",
        "Phú Thọ",
        "Điện Biên",
        "Lai Châu",
        "Sơn La",
        "Hòa Bình",
    ],
    "Red River Delta": [
        "Hà Nội",
        "Hải Phòng",
        "Vĩnh Phúc",
        "Bắc Ninh",
        "Hải Dương",
        "Hưng Yên",
        "Thái Bình",
        "Hà Nam",
        "Nam Định",
        "Ninh Bình",
        "Quảng Ninh",
    ],
    "South East": [
        "Hồ Chí Minh",
        "Bình Phước",
        "Tây Ninh",
        "Bình Dương",
        "Đồng Nai",
        "Bà Rịa–Vũng Tàu",
    ],
}


def _write_json(path: pathlib.Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")


def _sha256_path(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _asset_url(path: pathlib.Path, public_dir: pathlib.Path) -> str:
    return "/" + path.relative_to(public_dir).as_posix()


def _normalized_name(value: str) -> str:
    text = unicodedata.normalize("NFD", value.replace("Đ", "D").replace("đ", "d"))
    text = "".join(character for character in text if not unicodedata.combining(character))
    text = text.casefold()
    text = re.sub(r"^(?:tp\.?|thanh pho|tinh|province)\s+", "", text)
    return " ".join(re.findall(r"[a-z0-9]+", text))


def _slug(value: str) -> str:
    key = _normalized_name(value).replace(" ", "-")
    if key:
        return key
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]


def _period_key(value: Any) -> str:
    if value is None or value == "":
        return "미표기"
    return str(value)


def _sort_periods(values: Iterable[str]) -> list[str]:
    def key(value: str) -> tuple[int, int, str]:
        match = re.match(r"^(\d{4})", value)
        return (0, int(match.group(1)), value) if match else (1, 0, value)

    return sorted(set(values), key=key)


def _indicator_index(payload: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row["indicatorId"]): row
        for row in payload.get("meta", {}).get("indicators", [])
    }


def _observations_by_indicator(
    payload: Mapping[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for observation in payload.get("observations", {}).get("records", []):
        rows[str(observation.get("indicatorId") or "")].append(observation)
    return rows


def _source_summary(payload: Mapping[str, Any]) -> dict[str, Any]:
    indicators = payload.get("meta", {}).get("indicators", [])
    return {
        "organizations": sorted(
            {str(row.get("sourceOrg")) for row in indicators if row.get("sourceOrg")}
        ),
        "urls": sorted(
            {str(row.get("sourceUrl")) for row in indicators if row.get("sourceUrl")}
        ),
        "licenses": sorted(
            {str(row.get("licenseCode")) for row in indicators if row.get("licenseCode")}
        ),
        "attribution": sorted(
            {
                str(row.get("attributionText"))
                for row in indicators
                if row.get("attributionText")
            }
        ),
    }


class Adm1Resolver:
    def __init__(self, aliases: Mapping[str, Any], geometry: Mapping[str, Any]) -> None:
        self.lookup = {str(key): str(value) for key, value in aliases["lookup"].items()}
        self.name_by_code = {
            str(feature["properties"]["adm1Code"]): str(feature["properties"]["name"])
            for feature in geometry["features"]
        }
        if len(self.name_by_code) != 63:
            raise ValueError("ADM1 resolver requires exactly 63 boundary features")

    def resolve(self, name: str) -> tuple[str, str]:
        normalized = _normalized_name(name)
        code = self.lookup.get(normalized)
        if not code or code not in self.name_by_code:
            raise ValueError(f"unmapped ADM1 name: {name!r} (normalized={normalized!r})")
        return code, self.name_by_code[code]


def _value_row(
    resolver: Adm1Resolver,
    *,
    province_name: str,
    variable: str,
    variable_label: str,
    period: Any,
    observation: Mapping[str, Any],
    source_spatial_unit: str = "admin1",
    source_region: str | None = None,
) -> dict[str, Any] | None:
    if observation.get("value") is None:
        return None
    code, canonical_name = resolver.resolve(province_name)
    row = {
        "adm1Code": code,
        "adm1Name": canonical_name,
        "variable": variable,
        "variableLabel": variable_label,
        "period": _period_key(period),
        "value": observation["value"],
        "unit": observation.get("unit"),
        "sourceIndicatorId": observation.get("indicatorId"),
        "sourceRecordId": observation.get("recordId"),
        "sourceSpatialUnit": source_spatial_unit,
        "imputed": False,
    }
    if source_region:
        row["sourceRegion"] = source_region
        row["mappingMethod"] = "explicit-gdl-six-region-membership"
    return row


def _build_b021(payload: Mapping[str, Any], resolver: Adm1Resolver) -> list[dict[str, Any]]:
    indicators = _indicator_index(payload)
    observations = _observations_by_indicator(payload)
    values: list[dict[str, Any]] = []
    for indicator_id, indicator in indicators.items():
        label = str(indicator.get("labelKo") or "")
        matched_region = next(
            (region for region in GDL_REGION_PROVINCES if label.endswith(f" — {region}")),
            None,
        )
        if not matched_region:
            continue
        variable_label = label.rsplit(" — ", 1)[0]
        variable = _slug(variable_label)
        for observation in observations.get(indicator_id, []):
            for province in GDL_REGION_PROVINCES[matched_region]:
                row = _value_row(
                    resolver,
                    province_name=province,
                    variable=variable,
                    variable_label=variable_label,
                    period=observation.get("year") or observation.get("period"),
                    observation=observation,
                    source_spatial_unit="region",
                    source_region=matched_region,
                )
                if row:
                    values.append(row)
    return values


def _build_by_indicator_prefixes(
    payload: Mapping[str, Any],
    resolver: Adm1Resolver,
    configs: list[tuple[str, str, str]],
) -> list[dict[str, Any]]:
    indicators = _indicator_index(payload)
    observations = _observations_by_indicator(payload)
    values: list[dict[str, Any]] = []
    for indicator_id, indicator in indicators.items():
        matched = next((item for item in configs if indicator_id.startswith(item[0])), None)
        if not matched:
            continue
        _, variable, variable_label = matched
        province_name = str(indicator.get("labelKo") or "").rsplit(" — ", 1)[-1]
        for observation in observations.get(indicator_id, []):
            row = _value_row(
                resolver,
                province_name=province_name,
                variable=variable,
                variable_label=variable_label,
                period=observation.get("period") or observation.get("year"),
                observation=observation,
            )
            if row:
                values.append(row)
    return values


def _build_b034(payload: Mapping[str, Any], resolver: Adm1Resolver) -> list[dict[str, Any]]:
    indicators = _indicator_index(payload)
    observations = _observations_by_indicator(payload)
    values: list[dict[str, Any]] = []
    for indicator_id, indicator in indicators.items():
        if "_prov_" not in indicator_id:
            continue
        label = str(indicator.get("labelKo") or "")
        if " — " not in label:
            continue
        variable_label, province_name = label.rsplit(" — ", 1)
        variable = _slug(variable_label)
        for observation in observations.get(indicator_id, []):
            row = _value_row(
                resolver,
                province_name=province_name,
                variable=variable,
                variable_label=variable_label,
                period=observation.get("period") or observation.get("year"),
                observation=observation,
            )
            if row:
                values.append(row)
    return values


def _build_c016(payload: Mapping[str, Any], resolver: Adm1Resolver) -> list[dict[str, Any]]:
    indicators = _indicator_index(payload)
    observations = _observations_by_indicator(payload)
    values: list[dict[str, Any]] = []
    for indicator_id, indicator in indicators.items():
        if indicator.get("spatialUnit") != "admin1":
            continue
        label = str(indicator.get("labelKo") or "")
        if " — " not in label:
            continue
        metric_and_period, province_name = label.rsplit(" — ", 1)
        metric_label = metric_and_period.rsplit(" — ", 1)[0]
        if "·" in metric_label:
            metric_label = metric_label.split("·", 1)[1].strip()
        variable = _slug(metric_label)
        for observation in observations.get(indicator_id, []):
            row = _value_row(
                resolver,
                province_name=province_name,
                variable=variable,
                variable_label=metric_label,
                period=observation.get("period") or observation.get("year"),
                observation=observation,
            )
            if row:
                values.append(row)
    return values


def _build_d008(payload: Mapping[str, Any], resolver: Adm1Resolver) -> list[dict[str, Any]]:
    indicators = _indicator_index(payload)
    observations = _observations_by_indicator(payload)
    values: list[dict[str, Any]] = []
    for indicator_id, indicator in indicators.items():
        if indicator.get("spatialUnit") != "admin1":
            continue
        label = str(indicator.get("labelKo") or "")
        match = re.search(r"\(([^()]+)\)", label)
        if not match:
            raise ValueError(f"D-008 province label lacks an explicit source name: {label}")
        for observation in observations.get(indicator_id, []):
            row = _value_row(
                resolver,
                province_name=match.group(1),
                variable="provincial-climate-budget",
                variable_label="성 단위 기후변화 지출 누계",
                period=observation.get("period") or "2010-2013",
                observation=observation,
            )
            if row:
                values.append(row)
    return values


def _spatial_document(
    element_id: str,
    payload: Mapping[str, Any],
    values: list[dict[str, Any]],
    *,
    coverage_kind: str,
    preferred_variable_text: str,
    preferred_period: str | None = None,
) -> dict[str, Any]:
    seen: set[tuple[str, str, str]] = set()
    duplicates: list[tuple[str, str, str]] = []
    for row in values:
        key = (str(row["variable"]), str(row["period"]), str(row["adm1Code"]))
        if key in seen:
            duplicates.append(key)
        seen.add(key)
    if duplicates:
        raise ValueError(f"duplicate spatial values for {element_id}: {duplicates[:5]}")

    values.sort(key=lambda row: (row["variable"], row["period"], row["adm1Code"]))
    labels = {str(row["variable"]): str(row["variableLabel"]) for row in values}
    units: dict[str, set[str]] = defaultdict(set)
    periods_by_variable: dict[str, set[str]] = defaultdict(set)
    series_codes: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row in values:
        if row.get("unit"):
            units[str(row["variable"])].add(str(row["unit"]))
        periods_by_variable[str(row["variable"])].add(str(row["period"]))
        series_codes[(str(row["variable"]), str(row["period"]))].add(str(row["adm1Code"]))

    variables = []
    for variable in sorted(labels, key=lambda item: labels[item]):
        periods = _sort_periods(periods_by_variable[variable])
        variables.append(
            {
                "key": variable,
                "label": labels[variable],
                "unit": " · ".join(sorted(units[variable])) or "미표기",
                "periods": periods,
                "maxFeatureCount": max(
                    len(series_codes[(variable, period)]) for period in periods
                ),
            }
        )
    if not variables:
        raise ValueError(f"no spatial values produced for {element_id}")
    default_variable = next(
        (
            row["key"]
            for row in variables
            if preferred_variable_text.casefold() in row["label"].casefold()
        ),
        variables[0]["key"],
    )
    default_periods = next(
        row["periods"] for row in variables if row["key"] == default_variable
    )
    default_period = (
        preferred_period if preferred_period in default_periods else default_periods[-1]
    )
    all_codes = sorted({str(row["adm1Code"]) for row in values})
    series_coverage = []
    for (variable, period), codes in sorted(series_codes.items()):
        series_coverage.append(
            {
                "variable": variable,
                "period": period,
                "expectedCount": 63,
                "matchedCount": len(codes),
                "missingCount": 63 - len(codes),
                "failureCount": 0,
            }
        )

    source = _source_summary(payload)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "assetSchemaVersion": "v124-spatial-layer-1",
        "generatedAt": GENERATED_AT,
        "countryIso3": "VNM",
        "elementId": element_id,
        "geometryUrl": ADM1_GEOMETRY_URL,
        "joinKey": "adm1Code",
        "boundarySystem": "pre-2025-63",
        "coverageKind": coverage_kind,
        "selectors": {
            "variables": variables,
            "periods": _sort_periods(row["period"] for row in values),
            "defaultVariable": default_variable,
            "defaultPeriod": default_period,
        },
        "values": values,
        "seriesCoverage": series_coverage,
        "source": source,
        "validation": {
            "sourceValueCount": len(values),
            "publishedValueCount": len(values),
            "suppressedValueCount": 0,
            "matchedAdm1Count": len(all_codes),
            "expectedAdm1Count": 63,
            "missingAdm1Count": 63 - len(all_codes),
            "unmatchedSourceNameCount": 0,
            "joinFailureCount": 0,
            "duplicateValueCount": 0,
            "providedZeroCount": sum(row["value"] == 0 for row in values),
            "zeroImputationCount": 0,
            "fakeGeometryCount": 0,
            "maxSeriesFeatureCount": max(len(codes) for codes in series_codes.values()),
        },
    }


def _build_spatial_documents(
    payloads: Mapping[str, Mapping[str, Any]], resolver: Adm1Resolver
) -> dict[str, dict[str, Any]]:
    documents = {
        "B-021": _spatial_document(
            "B-021",
            payloads["B-021"],
            _build_b021(payloads["B-021"], resolver),
            coverage_kind="full",
            preferred_variable_text="GVI 취약성",
        ),
        "B-031": _spatial_document(
            "B-031",
            payloads["B-031"],
            _build_by_indicator_prefixes(
                payloads["B-031"],
                resolver,
                [
                    ("B-031_prov_area_", "analysis-area", "성(省)별 분석대상 면적"),
                    ("B-031_prov_ext2000_", "tree-cover-area-2000", "성(省)별 수관 면적(2000)"),
                    ("B-031_prov_ext2010_", "tree-cover-area-2010", "성(省)별 수관 면적(2010)"),
                ],
            ),
            coverage_kind="full",
            preferred_variable_text="수관 면적(2010)",
            preferred_period="2010",
        ),
        "B-032": _spatial_document(
            "B-032",
            payloads["B-032"],
            _build_by_indicator_prefixes(
                payloads["B-032"],
                resolver,
                [("B-032_canopy_cover_prov_30_", "canopy-cover-30", "성(省)별 수관 피복률 — 임계 30%")],
            ),
            coverage_kind="full",
            preferred_variable_text="수관 피복률",
            preferred_period="2010",
        ),
        "B-033": _spatial_document(
            "B-033",
            payloads["B-033"],
            _build_by_indicator_prefixes(
                payloads["B-033"],
                resolver,
                [("B-033_tree_cover_loss_prov_", "annual-tree-cover-loss", "연간 수관 손실 — 성(省) 단위")],
            ),
            coverage_kind="full",
            preferred_variable_text="연간 수관 손실",
            preferred_period="2025",
        ),
        "B-034": _spatial_document(
            "B-034",
            payloads["B-034"],
            _build_b034(payloads["B-034"], resolver),
            coverage_kind="full",
            preferred_variable_text="산림탄소 순플럭스(연평균)",
        ),
        "C-016": _spatial_document(
            "C-016",
            payloads["C-016"],
            _build_c016(payloads["C-016"], resolver),
            coverage_kind="partial",
            preferred_variable_text="옥상태양광",
            preferred_period="2025-2030",
        ),
        "D-008": _spatial_document(
            "D-008",
            payloads["D-008"],
            _build_d008(payloads["D-008"], resolver),
            coverage_kind="partial",
            preferred_variable_text="기후변화 지출",
            preferred_period="2010-2013",
        ),
    }
    for element_id in ["B-021", "B-031", "B-032", "B-033", "B-034"]:
        if documents[element_id]["validation"]["maxSeriesFeatureCount"] != 63:
            raise ValueError(f"{element_id} must provide a 63-ADM1 series")
    documents["B-021"]["regionMappings"] = [
        {
            "region": region,
            "provinceCodes": [resolver.resolve(name)[0] for name in provinces],
            "provinceNames": [resolver.resolve(name)[1] for name in provinces],
            "mappingMethod": "explicit-gdl-six-region-membership",
        }
        for region, provinces in GDL_REGION_PROVINCES.items()
    ]
    return documents


def _point_layer(
    base: Mapping[str, Any],
    catalog_element: Mapping[str, Any],
    payload: Mapping[str, Any],
) -> dict[str, Any]:
    layer = deepcopy(base)
    element_id = str(layer["elementId"])
    entities = payload.get("entities", {}).get("records", [])
    feature_count = sum(1 for row in entities if row.get("mapEligible"))
    latest = layer.get("latestYear")
    layer.update(
        {
            "active": True,
            "enabled": True,
            "featureCount": feature_count,
            "renderer": "cluster" if layer.get("cluster") else "point",
            "category": CATEGORY_BY_ELEMENT[element_id],
            "unit": "source-provided location",
            "source": " · ".join(layer.get("sourceOrganizations", [])),
            "licenses": list(catalog_element.get("rights", {}).get("licenses", [])),
            "sourceYear": latest,
            "spatialCoverage": f"출처 좌표가 있는 {feature_count:,}개 피처",
            "missingRegions": [],
            "accuracyNotice": "원천이 제공한 좌표만 표시하며 좌표가 없는 레코드는 지도에 투영하지 않습니다.",
            "detailElementId": element_id,
            "detailUrl": f"/?element={element_id.lower()}&country=VNM#element-detail",
            "downloadStatus": (
                "available" if int(layer.get("downloadableRecordCount", 0)) > 0 else "source-restricted"
            ),
            "selectors": {
                "variables": [
                    {
                        "key": "locations",
                        "label": layer.get("publicShortTitle") or layer.get("label"),
                        "unit": "개",
                        "periods": [_period_key(latest)],
                    }
                ],
                "periods": [_period_key(latest)],
                "defaultVariable": "locations",
                "defaultPeriod": _period_key(latest),
            },
            "join": {
                "requiredCount": feature_count,
                "matchedCount": feature_count,
                "failures": [],
            },
            "fakeGeometryCount": 0,
            "zeroImputationCount": 0,
        }
    )
    return layer


def _multi_polygon_for_countries(
    world: Mapping[str, Any], country_codes: list[str]
) -> dict[str, Any]:
    polygons: list[Any] = []
    wanted = set(country_codes)
    matched: set[str] = set()
    for feature in world.get("features", []):
        properties = feature.get("properties") or {}
        iso3 = str(properties.get("iso3") or "")
        if iso3 not in wanted:
            continue
        geometry = feature.get("geometry") or {}
        if geometry.get("type") == "Polygon":
            polygons.append(geometry.get("coordinates") or [])
        elif geometry.get("type") == "MultiPolygon":
            polygons.extend(geometry.get("coordinates") or [])
        else:
            raise ValueError(f"unsupported country geometry for {iso3}")
        matched.add(iso3)
    missing = wanted - matched
    if missing:
        raise ValueError(f"world country geometry missing: {sorted(missing)}")
    return {"type": "MultiPolygon", "coordinates": polygons}


def _d018_properties(entity: Mapping[str, Any]) -> dict[str, Any]:
    attributes = entity.get("normalizedAttributes") or {}
    title = str(attributes.get("projectName") or entity.get("name") or "")
    country_names = {
        "KHM": "Cambodia",
        "LAO": "Lao PDR",
        "THA": "Thailand",
        "VNM": "Viet Nam",
    }
    scope_codes = list(entity.get("scopeCountries") or [])
    approved_amount = attributes.get("approvedAmount")
    if approved_amount in (None, ""):
        approved_amount = attributes.get("usd")
    return {
        "recordId": entity.get("recordId"),
        "elementId": "D-018",
        "projectTitle": title,
        "name": title,
        "fund": "Adaptation Fund",
        "projectCategory": attributes.get("field_20eaa6c8") or "Regional (Asia-Pacific)",
        "participatingCountries": " · ".join(country_names[code] for code in scope_codes),
        "scopeCountries": ",".join(scope_codes),
        "participantCount": len(scope_codes),
        "sector": attributes.get("sector") or "",
        "sectorKo": "초국경 수자원 관리",
        "status": attributes.get("status") or "",
        "approvedAmount": approved_amount if approved_amount not in (None, "") else None,
        "implementingEntity": attributes.get("implementingEntity") or "",
        "officialSource": attributes.get("sourceUrl") or "",
        "regionalProject": True,
        "spatialScopeType": entity.get("spatialScopeType"),
        "coordinateMeaning": entity.get("coordinateMeaning"),
        "sourceCoordinateCount": entity.get("sourceCoordinateCount"),
        "displayedCoordinateCount": entity.get("displayedCoordinateCount"),
        "vietnamParticipation": "포함" if "VNM" in scope_codes else "미포함",
        "publicSpatialNotice": entity.get("publicSpatialNotice") or "",
        "selectionKey": entity.get("recordId"),
    }


def _build_d018_regional_geojson(
    repo: pathlib.Path, payload: Mapping[str, Any]
) -> dict[str, Any]:
    world = json.loads(
        (repo / "public/data/world-countries.geojson").read_text(encoding="utf-8")
    )
    features: list[dict[str, Any]] = []
    records = payload.get("entities", {}).get("records", [])
    for entity in records:
        title = str(entity.get("name") or "")
        lower_title = title.lower()
        if MEKONG_EBA_TITLE_TOKEN not in lower_title and GREATER_MEKONG_TITLE_TOKEN not in lower_title:
            continue
        properties = _d018_properties(entity)
        scope_codes = list(entity.get("scopeCountries") or [])
        scope_explanation = (
            "태국·베트남의 지역 협력범위입니다. 두 점은 공식 제안서에 명시된 세부 활동지역입니다."
            if MEKONG_EBA_TITLE_TOKEN in lower_title
            else "4개 참여국의 지역 협력범위입니다. 공식 제안서의 3개 파일럿 권역은 상세에 명시하지만 정밀 경계가 없어 점으로 만들지 않습니다."
        )
        activity_areas = (
            "Young Basin (Thailand) · Tram Chim National Park 주변 (Viet Nam)"
            if MEKONG_EBA_TITLE_TOKEN in lower_title
            else "Vientiane Plains (Lao PDR–Thailand) · northwest Cambodia–Thailand border area · upper Mekong Delta (Cambodia–Viet Nam)"
        )
        features.append(
            {
                "type": "Feature",
                "id": f"{entity['recordId']}:scope",
                "geometry": _multi_polygon_for_countries(world, scope_codes),
                "properties": {
                    **properties,
                    "geometryRole": "regional-scope",
                    "coordinateMeaning": "project-country-scope",
                    "displayedCoordinateCount": 0,
                    "displayLabel": "지역 협력사업",
                    "scopeExplanation": scope_explanation,
                    "verifiedActivityAreas": activity_areas,
                    "sourceEvidence": properties["officialSource"],
                },
            }
        )
        if MEKONG_EBA_TITLE_TOKEN in lower_title:
            attributes = entity.get("normalizedAttributes") or {}
            candidates = attributes.get("sourceCoordinateCandidates") or []
            if len(candidates) != 2:
                raise ValueError("Mekong EbA must expose exactly two reviewed activity sites")
            for index, candidate in enumerate(candidates, start=1):
                features.append(
                    {
                        "type": "Feature",
                        "id": f"{entity['recordId']}:site:{index}",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                candidate["longitude"],
                                candidate["latitude"],
                            ],
                        },
                        "properties": {
                            **properties,
                            "geometryRole": "activity-site",
                            "displayedCoordinateCount": 1,
                            "displayLabel": "세부 활동지역",
                            "activitySiteLabel": candidate.get("label") or f"활동지역 {index}",
                            "scopeExplanation": scope_explanation,
                            "verifiedActivityAreas": activity_areas,
                            "coordinateMeaning": "verified-activity-site",
                            "sourceEvidence": "https://www.adaptation-fund.org/wp-content/uploads/2018/08/Mekong-EbA-South_Project-Proposal_6-August-2018_Clean.pdf",
                        },
                    }
                )
    if len(features) != 4:
        raise ValueError(f"D-018 regional asset must contain 4 features, got {len(features)}")
    return {
        "type": "FeatureCollection",
        "metadata": {
            "schemaVersion": "v130-regional-project-1",
            "elementId": "D-018",
            "featureCount": 4,
            "regionalScopeCount": 2,
            "verifiedActivitySiteCount": 2,
            "sourceProjectCount": 4,
            "spatialProjectCount": 2,
            "sourceCoordinateCount": 7,
            "displayedCoordinateCount": 2,
            "fakeGeometryCount": 0,
            "firstCoordinateAsProjectLocationCount": 0,
        },
        "features": features,
    }


def _regional_project_layer(
    base: Mapping[str, Any],
    catalog_element: Mapping[str, Any],
    regional_asset: Mapping[str, Any],
) -> dict[str, Any]:
    layer = deepcopy(base)
    layer.update(
        {
            "active": True,
            "enabled": True,
            "mapMode": "regional-scope",
            "renderer": "regional-scope",
            "category": CATEGORY_BY_ELEMENT["D-018"],
            "label": "적응기금 지역 협력사업",
            "publicShortTitle": "적응기금 지역 협력사업",
            "geometryTypes": ["MultiPolygon", "Point"],
            "geometryUrl": REGIONAL_PROJECT_URL,
            "featureCount": len(regional_asset["features"]),
            "totalEntityCount": int(catalog_element.get("entityCount", 0)),
            "unit": "사업 범위·세부 활동지역",
            "source": "Adaptation Fund Board Secretariat",
            "sourceOrganizations": ["Adaptation Fund Board Secretariat"],
            "licenses": list(catalog_element.get("rights", {}).get("licenses", [])),
            "sourceUrls": [
                "https://www.adaptation-fund.org/projects-programmes/"
            ],
            "sourceYear": "2026",
            "latestYear": "2026",
            "spatialCoverage": "지역 협력사업 2건의 참여국 범위 2개와 검증된 세부 활동지역 2곳",
            "missingRegions": [
                "단일국 사업 2건은 검증된 세부 지점 또는 정밀 경계가 없어 상세에서만 제공"
            ],
            "accuracyNotice": "참여국 경계는 사업의 협력범위이며 사업 위치가 아닙니다. 검증된 세부 활동지역만 점으로 표시합니다.",
            "publicSpatialNotice": "참여국 경계는 지역 협력범위를 뜻하며 실제 시설 위치를 뜻하지 않습니다.",
            "mapBenefit": "초국경 적응사업의 참여국과 베트남 참여 여부를 한눈에 확인할 수 있습니다.",
            "spatialLimitation": "국가 경계는 정밀 사업구역이 아니며 Greater Mekong의 원천 대표좌표 4개는 표시하지 않습니다.",
            "detailElementId": "D-018",
            "detailUrl": "/?element=d-018&country=VNM#element-detail",
            "downloadStatus": "available" if catalog_element.get("downloadAllowed") else "source-restricted",
            "selectors": {
                "variables": [
                    {
                        "key": "regional-scope",
                        "label": "지역 협력범위·세부 활동지역",
                        "unit": "사업",
                        "periods": ["2026"],
                    }
                ],
                "periods": ["2026"],
                "defaultVariable": "regional-scope",
                "defaultPeriod": "2026",
            },
            "join": {"requiredCount": 4, "matchedCount": 4, "failures": []},
            "spatialScopeType": "multi-country-regional",
            "coordinateMeaning": "project-country-scope",
            "coordinateMeanings": [
                "project-country-scope",
                "verified-activity-site",
            ],
            "scopeCountries": ["KHM", "LAO", "THA", "VNM"],
            "sourceCoordinateCount": 6,
            "displayedCoordinateCount": 2,
            "regionalProject": True,
            "aggregationLevel": "regional-project",
            "coordinateMeaningByGeometryRole": {
                "regional-scope": "project-country-scope",
                "activity-site": "verified-activity-site",
            },
            "sourceProjectCount": 4,
            "spatialProjectCount": 2,
            "regionalScopeFeatureCount": 2,
            "verifiedActivitySiteFeatureCount": 2,
            "fakeGeometryCount": 0,
            "zeroImputationCount": 0,
            "filters": [],
            "tooltipFields": [
                "projectTitle",
                "participatingCountries",
                "sector",
                "status",
                "approvedAmount",
                "implementingEntity",
                "officialSource",
                "publicSpatialNotice",
            ],
        }
    )
    layer["sourceCoordinateCount"] = 7
    layer["displayedCoordinateCount"] = 2
    layer["join"] = {
        "requiredCount": 2,
        "matchedCount": 2,
        "failures": [],
        "sourceEntityCount": 4,
        "panelOnlyEntityCount": 2,
    }
    return layer


def _transmission_layer(
    catalog_by_id: Mapping[str, Mapping[str, Any]], transmission: Mapping[str, Any]
) -> dict[str, Any]:
    element = catalog_by_id["A-024"]
    metadata = transmission["metadata"]
    feature_count = int(metadata["featureCount"])
    return {
        "layerId": "vnm-v124-a-024",
        "elementId": "A-024",
        "label": "송전망",
        "rawLabel": element.get("elementLabel"),
        "publicShortTitle": "송전망",
        "category": CATEGORY_BY_ELEMENT["A-024"],
        "mapMode": "line",
        "renderer": "line",
        "geometryTypes": ["MultiLineString"],
        "geometryUrl": TRANSMISSION_URL,
        "featureCount": feature_count,
        "totalEntityCount": int(element.get("entityCount", 0)),
        "downloadableRecordCount": int(element.get("downloadableRecordCount", 0)),
        "assetRef": {"provider": "vietnam-v124", "elementId": "A-024", "section": "geometry"},
        "sourceOrganizations": [metadata["source"]],
        "source": metadata["source"],
        "sourceUrls": [metadata["sourceDatasetUrl"]],
        "license": metadata["license"],
        "sourceYear": metadata["sourceYear"],
        "latestYear": metadata["sourceYear"],
        "tooltipFields": ["voltageKv", "status", "lengthKm", "sourceYear"],
        "defaultPrimary": False,
        "defaultOverlay": False,
        "cluster": False,
        "filters": [
            {"field": "voltageKv", "label": "전압", "values": ["110", "220", "500"]},
            {"field": "status", "label": "상태", "values": ["existing"]},
        ],
        "legend": {"title": "송전 전압", "note": "110·220·500 kV 기존 선로(2016)"},
        "unit": "kV · km",
        "spatialCoverage": f"베트남 기존 송전선 {feature_count:,}개, 총 {metadata['totalLengthKm']:,} km",
        "missingRegions": [],
        "accuracyNotice": metadata["accuracyNotice"],
        "detailElementId": "A-024",
        "detailUrl": "/?element=a-024&country=VNM#element-detail",
        "downloadStatus": "available" if element.get("downloadAllowed") else "source-restricted",
        "selectors": {
            "variables": [
                {"key": "all", "label": "전체 전압", "unit": "kV", "periods": ["2016"]},
                {"key": "110", "label": "110 kV", "unit": "kV", "periods": ["2016"]},
                {"key": "220", "label": "220 kV", "unit": "kV", "periods": ["2016"]},
                {"key": "500", "label": "500 kV", "unit": "kV", "periods": ["2016"]},
            ],
            "periods": ["2016"],
            "defaultVariable": "all",
            "defaultPeriod": "2016",
        },
        "join": {"requiredCount": feature_count, "matchedCount": feature_count, "failures": []},
        "sourceCoordinateCount": int(metadata["coordinateCount"]),
        "displayedCoordinateCount": int(metadata["coordinateCount"]),
        "active": True,
        "enabled": True,
        "fakeGeometryCount": 0,
        "zeroImputationCount": 0,
    }


def _choropleth_layer(
    element_id: str,
    document: Mapping[str, Any],
    catalog_by_id: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    element = catalog_by_id[element_id]
    selectors = document["selectors"]
    default_variable = selectors["defaultVariable"]
    variable = next(row for row in selectors["variables"] if row["key"] == default_variable)
    feature_count = int(document["validation"]["maxSeriesFeatureCount"])
    missing_count = 63 - feature_count
    renderer = "partial-choropleth" if document["coverageKind"] == "partial" else "admin1-choropleth"
    data_url = f"/data/vietnam/v2/spatial/layers/{element_id.lower()}.json"
    source = document["source"]
    return {
        "layerId": f"vnm-v124-{element_id.lower()}",
        "elementId": element_id,
        "label": element.get("elementLabel"),
        "rawLabel": element.get("elementLabel"),
        "publicShortTitle": element.get("elementLabel"),
        "category": CATEGORY_BY_ELEMENT[element_id],
        "mapMode": "region-choropleth" if element_id == "B-021" else "choropleth",
        "renderer": renderer,
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "geometryUrl": ADM1_GEOMETRY_URL,
        "dataUrl": data_url,
        "featureCount": feature_count,
        "totalEntityCount": len(document["values"]),
        "downloadableRecordCount": int(element.get("downloadableRecordCount", 0)),
        "assetRef": {"provider": "vietnam-v124", "elementId": element_id, "section": "spatial"},
        "sourceOrganizations": source["organizations"],
        "source": " · ".join(source["organizations"]),
        "licenses": source["licenses"],
        "sourceUrls": source["urls"],
        "sourceYear": selectors["defaultPeriod"],
        "latestYear": selectors["defaultPeriod"],
        "tooltipFields": ["adm1Name", "value", "unit", "period"],
        "defaultPrimary": False,
        "defaultOverlay": False,
        "cluster": False,
        "filters": [],
        "legend": {
            "title": variable["label"],
            "note": f"단위 {variable['unit']} · 결측 {missing_count}개 성·시",
        },
        "unit": variable["unit"],
        "spatialCoverage": (
            "GDL 6개 권역값을 명시적 대응표로 63개 성·시 경계에 표시"
            if element_id == "B-021"
            else f"개편 전 63개 성·시 중 선택 계열 최대 {feature_count}개"
        ),
        "missingRegions": [] if missing_count == 0 else [f"선택 변수에 따라 최대 {missing_count}개 성·시 결측"],
        "accuracyNotice": (
            "권역값은 명시된 GDL 권역 소속 성·시에 동일하게 표시하며 성·시별 독립 추정값이 아닙니다."
            if element_id == "B-021"
            else "누락값은 투명 처리하며 0으로 대체하지 않습니다. 개편 전 63개 행정구역 기준입니다."
        ),
        "detailElementId": element_id,
        "detailUrl": f"/?element={element_id.lower()}&country=VNM#element-detail",
        "downloadStatus": "available" if element.get("downloadAllowed") else "source-restricted",
        "selectors": selectors,
        "join": {
            "requiredCount": 63,
            "matchedCount": int(document["validation"]["matchedAdm1Count"]),
            "missingCount": 63 - feature_count,
            "failures": [],
        },
        "spatialStatus": "partial" if renderer == "partial-choropleth" else "ready",
        "active": True,
        "enabled": True,
        "fakeGeometryCount": 0,
        "zeroImputationCount": 0,
    }


LAYER_SEMANTICS_V130: dict[str, dict[str, Any]] = {
    "A-023": {
        "spatialScopeType": "facility-site",
        "coordinateMeaning": "verified-physical-site",
        "aggregationLevel": "facility",
        "mapBenefit": "발전소의 입지와 설비 분포를 비교할 수 있습니다.",
        "spatialLimitation": "원천 좌표가 있는 개별 발전소만 표시합니다.",
    },
    "A-024": {
        "spatialScopeType": "network",
        "coordinateMeaning": "verified-network-geometry",
        "aggregationLevel": "network-segment",
        "mapBenefit": "송전망의 연결 구조와 발전소 접근성을 함께 분석할 수 있습니다.",
        "spatialLimitation": "지오리퍼런싱 오차가 있어 정밀 설계용 위치가 아닙니다.",
    },
    "C-016": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "공개된 성·시별 재생에너지 계획의 공간 차이를 비교할 수 있습니다.",
        "spatialLimitation": "값이 공개된 성·시만 표시하며 미제공 지역은 0이 아닙니다.",
    },
    "B-031": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "성·시별 산림면적 차이를 비교할 수 있습니다.",
        "spatialLimitation": "개편 전 63개 성·시 통계 경계를 사용합니다.",
    },
    "B-032": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "성·시별 수관 피복 차이를 비교할 수 있습니다.",
        "spatialLimitation": "개편 전 63개 성·시 통계 경계를 사용합니다.",
    },
    "B-033": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "성·시별 산림손실의 공간 분포를 비교할 수 있습니다.",
        "spatialLimitation": "개편 전 63개 성·시 통계 경계를 사용합니다.",
    },
    "B-034": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "성·시별 산림 탄소의 공간 차이를 비교할 수 있습니다.",
        "spatialLimitation": "개편 전 63개 성·시 통계 경계를 사용합니다.",
    },
    "B-021": {
        "spatialScopeType": "region",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "six-region",
        "mapBenefit": "6개 권역의 취약성 차이를 행정경계 위에서 비교할 수 있습니다.",
        "spatialLimitation": "권역값을 소속 성·시에 동일 표시하며 성·시 독립 추정값이 아닙니다.",
    },
    "B-048": {
        "spatialScopeType": "facility-site",
        "coordinateMeaning": "verified-physical-site",
        "aggregationLevel": "facility",
        "mapBenefit": "주요 광산의 실제 입지를 다른 자원·인프라와 비교할 수 있습니다.",
        "spatialLimitation": "공개 좌표가 검증된 주요 광산 2곳만 표시합니다.",
    },
    "C-025": {
        "spatialScopeType": "project-site",
        "coordinateMeaning": "verified-physical-site",
        "aggregationLevel": "project-site",
        "mapBenefit": "검증된 탄소크레딧 사업지의 기술·입지 분포를 비교할 수 있습니다.",
        "spatialLimitation": "전국 프로그램 대표좌표 2건과 베트남 밖 잘못된 좌표 2건은 표시하지 않습니다.",
    },
    "D-008": {
        "spatialScopeType": "admin1",
        "coordinateMeaning": "source-region-value",
        "aggregationLevel": "admin1",
        "mapBenefit": "실제 공개된 성·시 기후지출의 지역 차이를 비교할 수 있습니다.",
        "spatialLimitation": "3개 성·시 자료만 있으며 나머지는 0이 아니라 미제공입니다.",
    },
}


def _apply_layer_semantics_v130(
    layer: dict[str, Any], payload: Mapping[str, Any] | None = None
) -> dict[str, Any]:
    element_id = str(layer["elementId"])
    semantics = LAYER_SEMANTICS_V130.get(element_id)
    if semantics:
        layer.update(semantics)
    layer.setdefault("scopeCountries", ["VNM"])
    layer.setdefault("regionalProject", False)
    entities = (payload or {}).get("entities", {}).get("records", [])
    source_coordinate_count = sum(
        1
        for entity in entities
        if isinstance(entity.get("latitude"), (int, float))
        and isinstance(entity.get("longitude"), (int, float))
    )
    renderer = layer.get("renderer")
    if renderer in {"point", "cluster"}:
        layer["sourceCoordinateCount"] = source_coordinate_count
        layer["displayedCoordinateCount"] = int(layer.get("featureCount", 0))
    else:
        layer.setdefault("sourceCoordinateCount", 0)
        layer.setdefault("displayedCoordinateCount", 0)
    layer["publicSpatialNotice"] = semantics.get("spatialLimitation", "") if semantics else layer.get("publicSpatialNotice", "")
    return layer


def build_spatial_assets(
    repo: pathlib.Path,
    out: pathlib.Path,
    payloads: Mapping[str, Mapping[str, Any]],
    catalog: list[Mapping[str, Any]],
    base_map_index: Mapping[str, Any],
) -> dict[str, Any]:
    public_dir = repo / "public"
    geometry_dir = out / "geometry"
    spatial_dir = out / "spatial/layers"
    project_spatial_dir = out / "spatial/projects"
    geometry_dir.mkdir(parents=True, exist_ok=True)
    spatial_dir.mkdir(parents=True, exist_ok=True)
    project_spatial_dir.mkdir(parents=True, exist_ok=True)

    canonical_dir = repo / "tools/vietnam_spatial/source"
    adm1_path = geometry_dir / "vnm-adm1-63.geojson"
    aliases_path = geometry_dir / "vnm-adm1-aliases.json"
    # Keep generated public assets byte-stable across Windows and CI.  The
    # canonical sources may use CRLF, while the generated tree is normalized
    # to LF so a rebuild does not rewrite the complete boundary files.
    adm1_path.write_text(
        (canonical_dir / "vnm-adm1-63-source.geojson").read_text(encoding="utf-8"),
        encoding="utf-8",
        newline="\n",
    )
    aliases_path.write_text(
        (canonical_dir / "vnm-adm1-aliases-source.json").read_text(encoding="utf-8"),
        encoding="utf-8",
        newline="\n",
    )
    adm1 = json.loads(adm1_path.read_text(encoding="utf-8"))
    aliases = json.loads(aliases_path.read_text(encoding="utf-8"))
    if len(adm1.get("features", [])) != 63:
        raise ValueError("ADM1 public geometry must contain exactly 63 features")
    resolver = Adm1Resolver(aliases, adm1)

    region_codes = []
    for provinces in GDL_REGION_PROVINCES.values():
        region_codes.extend(resolver.resolve(name)[0] for name in provinces)
    if len(region_codes) != 63 or len(set(region_codes)) != 63:
        raise ValueError("GDL explicit region mapping must cover every ADM1 exactly once")

    transmission_path = geometry_dir / "vnm-transmission-network.geojson"
    transmission = normalize_transmission(read_vendored_source(DEFAULT_VENDORED_SOURCE))
    write_transmission_json(transmission_path, transmission)
    if len(transmission.get("features", [])) != 606:
        raise ValueError("A-024 transmission output must contain 606 actual lines")

    documents = _build_spatial_documents(payloads, resolver)
    spatial_urls: dict[str, str] = {}
    for element_id, document in documents.items():
        path = spatial_dir / f"{element_id.lower()}.json"
        _write_json(path, document)
        spatial_urls[element_id] = _asset_url(path, public_dir)

    d018_regional = _build_d018_regional_geojson(repo, payloads["D-018"])
    d018_regional_path = project_spatial_dir / "d-018-regional.geojson"
    _write_json(d018_regional_path, d018_regional)

    catalog_by_id = {str(row["elementId"]): row for row in catalog}
    base_layers = {
        str(row["elementId"]): row for row in base_map_index.get("layers", [])
    }
    layers: dict[str, dict[str, Any]] = {
        element_id: _point_layer(
            base_layers[element_id], catalog_by_id[element_id], payloads[element_id]
        )
        for element_id in ["A-023", "B-048", "C-025"]
    }
    layers["A-024"] = _transmission_layer(catalog_by_id, transmission)
    for element_id, document in documents.items():
        layers[element_id] = _choropleth_layer(element_id, document, catalog_by_id)
    layers["D-018"] = _regional_project_layer(
        base_layers["D-018"], catalog_by_id["D-018"], d018_regional
    )

    for element_id, layer in layers.items():
        _apply_layer_semantics_v130(layer, payloads.get(element_id))
    layers["D-008"].update(
        {
            "label": "성·시 기후변화 지출",
            "publicShortTitle": "성·시 기후변화 지출",
            "legend": {
                **layers["D-008"]["legend"],
                "title": "성·시 기후변화 지출",
            },
        }
    )

    ordered_layers = [layers[element_id] for element_id in LAYER_ORDER]
    map_feature_count = sum(int(row["featureCount"]) for row in ordered_layers)
    map_index = {
        "schemaVersion": SCHEMA_VERSION,
        "dataSchemaVersion": SCHEMA_VERSION,
        "platformRelease": "v130",
        "generatedAt": GENERATED_AT,
        "countryIso3": "VNM",
        "activeMapLayerCount": len(ordered_layers),
        "mapFeatureCount": map_feature_count,
        "geometryManifest": "/data/vietnam/v2/geometry/geometry-manifest.json",
        "layers": ordered_layers,
    }
    _write_json(out / "map-index.json", map_index)

    geometry_manifest = {
        "schemaVersion": "v124-geometry-manifest-1",
        "generatedAt": GENERATED_AT,
        "countryIso3": "VNM",
        "boundarySystem": "pre-2025-63",
        "assets": [
            {
                "kind": "adm1-boundary",
                "url": ADM1_GEOMETRY_URL,
                "sha256": _sha256_path(adm1_path),
                "featureCount": 63,
                "geometryTypes": ["Polygon", "MultiPolygon"],
                "source": adm1["metadata"]["source"],
                "version": adm1["metadata"]["source"]["sourceBuildDate"],
                "license": adm1["metadata"]["license"],
                "attribution": adm1["metadata"]["attribution"],
                "validation": adm1["metadata"]["validation"],
            },
            {
                "kind": "adm1-aliases",
                "url": ADM1_ALIASES_URL,
                "sha256": _sha256_path(aliases_path),
                "featureCount": 63,
                "validation": aliases["validation"],
            },
            {
                "kind": "transmission-network",
                "url": TRANSMISSION_URL,
                "sha256": _sha256_path(transmission_path),
                "featureCount": 606,
                "geometryTypes": transmission["metadata"]["geometryTypes"],
                "source": transmission["metadata"]["source"],
                "version": transmission["metadata"]["sourceVersion"],
                "license": transmission["metadata"]["license"],
                "attribution": transmission["metadata"]["attribution"],
                "accuracyNotice": transmission["metadata"]["accuracyNotice"],
            },
            {
                "kind": "regional-project-scope",
                "elementId": "D-018",
                "url": REGIONAL_PROJECT_URL,
                "sha256": _sha256_path(d018_regional_path),
                "featureCount": 4,
                "geometryTypes": ["MultiPolygon", "Point"],
                "regionalScopeCount": 2,
                "verifiedActivitySiteCount": 2,
                "fakeGeometryCount": 0,
                "source": {
                    "projectEvidence": "Adaptation Fund official project pages and proposals",
                    "scopeBoundary": "Natural Earth-derived local country boundaries",
                    "scopeBoundaryUrl": "/data/world-countries.geojson",
                },
                "version": "Adaptation Fund snapshot 2026; local country boundary release V130",
                "license": {
                    "projectMetadata": "Adaptation Fund Legal Notice (World Bank terms apply)",
                    "scopeBoundary": "Natural Earth public domain",
                },
                "attribution": "Adaptation Fund Board Secretariat; Natural Earth",
                "publicSpatialNotice": "참여국 경계는 협력범위이며 정밀 사업구역이나 시설 위치가 아닙니다.",
            },
        ],
        "spatialValueAssets": [
            {
                "elementId": element_id,
                "url": spatial_urls[element_id],
                "sha256": _sha256_path(spatial_dir / f"{element_id.lower()}.json"),
                "publishedValueCount": document["validation"]["publishedValueCount"],
                "matchedAdm1Count": document["validation"]["matchedAdm1Count"],
                "joinFailureCount": 0,
                "zeroImputationCount": 0,
            }
            for element_id, document in sorted(documents.items())
        ],
        "regionMappings": {
            "B-021": {
                "sourceSpatialUnitCount": 6,
                "targetAdm1Count": 63,
                "mapping": GDL_REGION_PROVINCES,
                "joinFailureCount": 0,
            }
        },
        "validation": {
            "adm1FeatureCount": 63,
            "emptyGeometryCount": 0,
            "duplicateProvinceCount": 0,
            "invalidGeometryCount": 0,
            "transmissionFeatureCount": 606,
            "actualLineGeometry": True,
            "adm1JoinFailureCount": 0,
            "fakeGeometryCount": 0,
            "zeroImputationCount": 0,
            "activeMapLayerCount": len(ordered_layers),
            "mapFeatureCount": map_feature_count,
        },
    }
    _write_json(geometry_dir / "geometry-manifest.json", geometry_manifest)
    return {
        "mapIndex": map_index,
        "geometryManifest": geometry_manifest,
        "spatialDocuments": documents,
        "mapLayerCount": len(ordered_layers),
        "mapFeatureCount": map_feature_count,
        "spatialAssetUrls": spatial_urls,
    }
