"""Reviewed V130 spatial semantics for public Vietnam map entities.

This module is deliberately small and evidence-led.  It does not geocode,
centroid, or otherwise manufacture locations.  Its only job is to annotate
source records with the reviewed meaning of their existing spatial fields and
to prevent records whose coordinates overstate the source resolution from
being exposed as public map points.
"""

from __future__ import annotations

from typing import Any, Mapping


GREATER_MEKONG_TITLE_TOKEN = "groundwater resources in the greater mekong subregion"
MEKONG_EBA_TITLE_TOKEN = "mekong eba south"
MEKONG_DELTA_TITLE_TOKEN = "eco-human settlement"
IFIA_TITLE_TOKEN = "innovative financial incentives for adaptation"

# These Gold Standard coordinates describe an umbrella programme rather than
# a single physical implementation site.  The source coordinates remain in the
# downloadable source projection, but they are not rendered as project sites.
C025_PANEL_ONLY_PROJECT_IDS = {"gs_212", "gs_61"}


def _attributes(entity: Mapping[str, Any]) -> dict[str, Any]:
    return dict(entity.get("normalizedAttributes") or {})


def _text(entity: Mapping[str, Any]) -> str:
    attributes = _attributes(entity)
    return " ".join(
        str(value or "")
        for value in (
            entity.get("name"),
            attributes.get("projectName"),
            attributes.get("sourceUrl"),
        )
    ).lower()


def _candidate_count(entity: Mapping[str, Any]) -> int:
    candidates = _attributes(entity).get("sourceCoordinateCandidates")
    if isinstance(candidates, list):
        return len(candidates)
    return int(
        isinstance(entity.get("latitude"), (int, float))
        and isinstance(entity.get("longitude"), (int, float))
    )


def _set_semantics(
    entity: dict[str, Any],
    *,
    spatial_scope_type: str,
    coordinate_meaning: str,
    aggregation_level: str,
    source_spatial_unit: str,
    target_spatial_unit: str,
    scope_countries: list[str],
    source_coordinate_count: int,
    displayed_coordinate_count: int,
    regional_project: bool,
    map_eligible: bool,
    map_reason: str,
    public_notice: str,
) -> None:
    entity.update(
        {
            "spatialScopeType": spatial_scope_type,
            "coordinateMeaning": coordinate_meaning,
            "scopeCountries": scope_countries,
            "sourceCoordinateCount": source_coordinate_count,
            "displayedCoordinateCount": displayed_coordinate_count,
            "regionalProject": regional_project,
            "aggregationLevel": aggregation_level,
            "sourceSpatialUnit": source_spatial_unit,
            "targetSpatialUnit": target_spatial_unit,
            "spatialSemanticsVerified": True,
            "publicSpatialNotice": public_notice,
            "mapEligible": map_eligible,
            "mapEligibilityReason": map_reason,
        }
    )


def apply_entity_spatial_semantics_v130(
    element_id: str, entities: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Annotate entity records and enforce the reviewed V130 point policy."""

    for entity in entities:
        if element_id == "A-023":
            coordinate_count = _candidate_count(entity)
            eligible = bool(entity.get("mapEligible"))
            _set_semantics(
                entity,
                spatial_scope_type="facility-site",
                coordinate_meaning="verified-physical-site" if eligible else "unknown",
                aggregation_level="facility",
                source_spatial_unit="facility-site",
                target_spatial_unit="point",
                scope_countries=["VNM"],
                source_coordinate_count=coordinate_count,
                displayed_coordinate_count=1 if eligible else 0,
                regional_project=False,
                map_eligible=eligible,
                map_reason="verified-physical-site" if eligible else "no-valid-coordinate",
                public_notice="원천의 개별 발전소 좌표만 시설 위치로 표시합니다.",
            )
            continue

        if element_id == "B-048":
            coordinate_count = _candidate_count(entity)
            eligible = bool(entity.get("mapEligible"))
            _set_semantics(
                entity,
                spatial_scope_type="facility-site",
                coordinate_meaning="verified-physical-site" if eligible else "unknown",
                aggregation_level="facility",
                source_spatial_unit="mine-site",
                target_spatial_unit="point",
                scope_countries=["VNM"],
                source_coordinate_count=coordinate_count,
                displayed_coordinate_count=1 if eligible else 0,
                regional_project=False,
                map_eligible=eligible,
                map_reason="verified-physical-site" if eligible else "no-valid-coordinate",
                public_notice="원천에서 위치가 확인된 개별 광산만 표시합니다.",
            )
            continue

        if element_id == "C-025":
            attributes = _attributes(entity)
            project_id = str(attributes.get("projectId") or "").lower()
            was_eligible = bool(entity.get("mapEligible"))
            excluded_program = project_id in C025_PANEL_ONLY_PROJECT_IDS
            eligible = was_eligible and not excluded_program
            meaning = (
                "verified-physical-site"
                if eligible
                else "representative-coordinate"
                if excluded_program
                else "unknown"
            )
            _set_semantics(
                entity,
                spatial_scope_type="project-site" if eligible else "country" if excluded_program else "unknown",
                coordinate_meaning=meaning,
                aggregation_level="project-site" if eligible else "programme" if excluded_program else "project",
                source_spatial_unit="registry-coordinate",
                target_spatial_unit="point" if eligible else "panel-only",
                scope_countries=["VNM"],
                source_coordinate_count=_candidate_count(entity),
                displayed_coordinate_count=1 if eligible else 0,
                regional_project=False,
                map_eligible=eligible,
                map_reason=(
                    "verified-project-site"
                    if eligible
                    else "programme-coordinate-is-not-a-single-project-site"
                    if excluded_program
                    else "no-valid-coordinate"
                ),
                public_notice=(
                    "등록부 좌표가 개별 시설·사업 지점을 가리키는 레코드만 표시합니다."
                    if eligible
                    else "전국 단위 프로그램의 대표좌표는 실제 단일 사업지로 표시하지 않습니다."
                    if excluded_program
                    else "검증 가능한 사업지 좌표가 없어 지도에 표시하지 않습니다."
                ),
            )
            continue

        if element_id == "D-018":
            text = _text(entity)
            coordinate_count = _candidate_count(entity)
            # D-018 is rendered from a reviewed mixed-geometry asset.  Nulling
            # the top-level point prevents the former first/Vietnam-coordinate
            # shortcut from leaking into another generic point consumer.
            entity["latitude"] = None
            entity["longitude"] = None
            entity["geometryType"] = None
            if MEKONG_EBA_TITLE_TOKEN in text:
                _set_semantics(
                    entity,
                    spatial_scope_type="multi-country-regional",
                    coordinate_meaning="verified-activity-site",
                    aggregation_level="regional-project",
                    source_spatial_unit="named-activity-sites-and-country-scope",
                    target_spatial_unit="regional-scope-and-multi-point",
                    scope_countries=["THA", "VNM"],
                    source_coordinate_count=coordinate_count,
                    displayed_coordinate_count=2,
                    regional_project=True,
                    map_eligible=True,
                    map_reason="regional-scope-with-two-verified-activity-sites",
                    public_notice="태국·베트남의 지역 협력범위와 원문 제안서에서 확인된 세부 활동지역 2곳을 함께 표시합니다.",
                )
            elif GREATER_MEKONG_TITLE_TOKEN in text:
                _set_semantics(
                    entity,
                    spatial_scope_type="multi-country-regional",
                    coordinate_meaning="representative-coordinate",
                    aggregation_level="regional-project",
                    source_spatial_unit="participating-country-scope",
                    target_spatial_unit="regional-scope",
                    scope_countries=["KHM", "LAO", "THA", "VNM"],
                    source_coordinate_count=coordinate_count,
                    displayed_coordinate_count=0,
                    regional_project=True,
                    map_eligible=True,
                    map_reason="regional-scope-no-verified-project-site",
                    public_notice="4개 참여국의 지역 협력범위를 표시합니다. 공식 제안서의 3개 파일럿 권역은 상세에 명시하되 정밀 경계가 없어 점으로 만들지 않으며, 원천의 국가별 대표좌표도 사업 위치로 표시하지 않습니다.",
                )
            elif MEKONG_DELTA_TITLE_TOKEN in text:
                _set_semantics(
                    entity,
                    spatial_scope_type="region",
                    coordinate_meaning="representative-coordinate",
                    aggregation_level="subnational-project-region",
                    source_spatial_unit="mekong-delta-region",
                    target_spatial_unit="panel-only",
                    scope_countries=["VNM"],
                    source_coordinate_count=coordinate_count,
                    displayed_coordinate_count=0,
                    regional_project=False,
                    map_eligible=False,
                    map_reason="regional-label-without-verified-site-or-boundary",
                    public_notice="메콩델타라는 광역 범위의 대표좌표를 단일 사업지로 표시하지 않습니다.",
                )
            else:
                _set_semantics(
                    entity,
                    spatial_scope_type="country",
                    coordinate_meaning="unknown",
                    aggregation_level="national-project",
                    source_spatial_unit="country",
                    target_spatial_unit="panel-only",
                    scope_countries=["VNM"],
                    source_coordinate_count=coordinate_count,
                    displayed_coordinate_count=0,
                    regional_project=False,
                    map_eligible=False,
                    map_reason="no-verified-project-site",
                    public_notice="검증 가능한 세부 사업지 또는 경계가 없어 상세 패널에서만 제공합니다.",
                )
            continue

        if element_id == "D-023":
            text = _text(entity)
            regional = MEKONG_EBA_TITLE_TOKEN in text or GREATER_MEKONG_TITLE_TOKEN in text
            scope_countries = (
                ["THA", "VNM"]
                if MEKONG_EBA_TITLE_TOKEN in text
                else ["KHM", "LAO", "THA", "VNM"]
                if GREATER_MEKONG_TITLE_TOKEN in text
                else ["VNM"]
            )
            coordinate_count = _candidate_count(entity)
            entity["latitude"] = None
            entity["longitude"] = None
            entity["geometryType"] = None
            _set_semantics(
                entity,
                spatial_scope_type="multi-country-regional" if regional else "country" if coordinate_count else "unknown",
                coordinate_meaning="representative-coordinate" if coordinate_count else "unknown",
                aggregation_level="integrated-portfolio",
                source_spatial_unit="project-portfolio",
                target_spatial_unit="panel-only",
                scope_countries=scope_countries,
                source_coordinate_count=coordinate_count,
                displayed_coordinate_count=0,
                regional_project=regional,
                map_eligible=False,
                map_reason="integrated-portfolio-panel-only-cross-layer-dedup",
                public_notice="통합 포트폴리오는 데이터 찾기에서 제공하며 Adaptation Fund 공간표현은 D-018에서만 제공합니다.",
            )

    return entities
