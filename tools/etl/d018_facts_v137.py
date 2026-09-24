"""Read D-018's activity sites and portfolio totals out of the final delivery.

D-018 is the Adaptation Fund registry: four Vietnam-related approved projects,
two of them multi-country. The final delivery ships each project's coordinates
as one text column, ``지점``:

    "16.543095,104.720449 Young Basin ; 10.7177,105.5091 surrounding Tram Chim
     National Park,Vietnam"

The previous projection had already parsed that column into
``sourceCoordinateCandidates``, and the reviewed spatial policy in
``spatial_semantics_v130`` reads it. The final delivery ships the same
coordinates in the same column, so the two verified activity sites survive the
change - they are re-linked here through the new field rather than re-derived
from scratch, and the pair is checked against the coordinates the previous
review signed off.

The distinction that matters, and that the source itself supports:

*   A candidate whose label names a **place** - Young Basin, Tram Chim National
    Park, Mekong Delta - is an activity site the proposal names.
*   A candidate whose label is just a **participating country** - Cambodia, Lao,
    Thailand, Viet Nam - is a country representative point for a multi-country
    project. Those four are not facilities and are not drawn as such; the
    project's participation range is drawn as country polygons instead.

The four portfolio totals are recomputed here from the delivered rows with the
definitions the previous projection used, so 건수, 승인액 합계, 집행액 합계 and
베트남 단독 승인액 합계 keep meaning the same thing.
"""

from __future__ import annotations

import re
from typing import Any, Iterable, Mapping

ELEMENT_ID = "D-018"

# "lat,lon label" pairs separated by ";". The label runs to the next separator.
_SITE = re.compile(
    r"(?P<lat>-?\d+(?:\.\d+)?)\s*,\s*(?P<lon>-?\d+(?:\.\d+)?)\s*(?P<label>[^;]*)"
)

# Country names the delivery uses as a whole-country marker in a 지점 label.
_COUNTRY_LABELS = {
    "cambodia",
    "lao",
    "lao pdr",
    "laos",
    "myanmar",
    "thailand",
    "viet nam",
    "vietnam",
}

# The two sites the previous review verified against the official proposal.
# Re-stated here so a delivery that quietly moves them fails loudly instead of
# publishing a different pair under the same description.
VERIFIED_ACTIVITY_SITES = (
    (16.543095, 104.720449),
    (10.7177, 105.5091),
)


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _money(value: Any) -> float | None:
    text = _text(value)
    if not text:
        return None
    match = re.search(r"-?[\d,]+(?:\.\d+)?", text)
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def parse_site_candidates(value: Any) -> list[dict[str, Any]]:
    """Coordinates and labels the delivery states in one 지점 cell."""

    text = _text(value)
    if not text:
        return []
    candidates: list[dict[str, Any]] = []
    for match in _SITE.finditer(text):
        label = match.group("label").strip(" ,;")
        candidates.append(
            {
                "latitude": float(match.group("lat")),
                "longitude": float(match.group("lon")),
                "label": label,
            }
        )
    return candidates


def is_country_point(candidate: Mapping[str, Any]) -> bool:
    """Is this label just a participating country rather than a named site?"""

    label = _text(candidate.get("label")).lower().strip(" .,")
    return label in _COUNTRY_LABELS


def classify_candidates(candidates: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    activity: list[dict[str, Any]] = []
    country: list[dict[str, Any]] = []
    for candidate in candidates:
        (country if is_country_point(candidate) else activity).append(dict(candidate))
    return {"activitySites": activity, "countryPoints": country}


def site_candidates_for_entity(attributes: Mapping[str, Any]) -> list[dict[str, Any]]:
    return parse_site_candidates(attributes.get("지점"))


def verified_sites_present(candidates: Iterable[Mapping[str, Any]]) -> bool:
    seen = {
        (round(float(item["latitude"]), 6), round(float(item["longitude"]), 6))
        for item in candidates
    }
    return all(
        (round(lat, 6), round(lon, 6)) in seen for lat, lon in VERIFIED_ACTIVITY_SITES
    )


# The four totals the element publishes, with the meaning the previous
# projection gave them. A multi-country project's approved amount is the whole
# project, because the Adaptation Fund does not publish a Vietnam share - so the
# simple sum and the single-country sum are deliberately different numbers and
# are published as two, never reconciled into one.
AGGREGATES = (
    {
        "indicatorId": "D-018_project_count",
        "labelKo": "Adaptation Fund 프로젝트 · 사업 건수 — 베트남 관련 승인사업 총 건수",
        "unit": "건",
        "kind": "count",
    },
    {
        "indicatorId": "D-018_approved_amount_sum",
        "labelKo": "Adaptation Fund 프로젝트 · 승인액 합계 — 전 사업 승인액 단순합",
        "unit": "USD",
        "kind": "approved",
    },
    {
        "indicatorId": "D-018_disbursed_amount_sum",
        "labelKo": "Adaptation Fund 프로젝트 · 집행액 합계 — 전 사업 집행액 단순합",
        "unit": "USD",
        "kind": "disbursed",
    },
    {
        "indicatorId": "D-018_approved_amount_sum_single_country",
        "labelKo": "Adaptation Fund 프로젝트 · 베트남 단독사업 승인액 합계",
        "unit": "USD",
        "kind": "approved-single-country",
    },
)


def _is_single_country(attributes: Mapping[str, Any]) -> bool:
    target = _text(attributes.get("대상")).lower()
    allocation = _text(attributes.get("베트남_귀속"))
    return "regional" not in target or allocation.startswith("전액")


def derive_d018_facts(workbook: Mapping[str, Any]) -> dict[str, Any]:
    rows = list(workbook.get("entities") or [])
    projects: list[dict[str, Any]] = []
    for entity in rows:
        attributes = entity.get("attributes") or {}
        candidates = site_candidates_for_entity(attributes)
        classified = classify_candidates(candidates)
        projects.append(
            {
                "sourceRow": int(entity.get("source_row") or 0),
                "projectName": _text(attributes.get("명칭")),
                "projectUrl": _text(attributes.get("프로젝트_url")),
                "implementingEntity": _text(attributes.get("ie")),
                "approvedAmount": _money(attributes.get("승인금액")),
                "disbursedAmount": _money(attributes.get("집행액")),
                "target": _text(attributes.get("대상")),
                "singleCountry": _is_single_country(attributes),
                "candidates": candidates,
                "activitySites": classified["activitySites"],
                "countryPoints": classified["countryPoints"],
                "vietnamAllocationNote": _text(attributes.get("베트남_귀속금액"))
                or _text(attributes.get("베트남_귀속")),
            }
        )

    approved = [p["approvedAmount"] for p in projects if p["approvedAmount"] is not None]
    disbursed = [p["disbursedAmount"] for p in projects if p["disbursedAmount"] is not None]
    single = [
        p["approvedAmount"]
        for p in projects
        if p["singleCountry"] and p["approvedAmount"] is not None
    ]
    totals = {
        "count": float(len(projects)),
        "approved": sum(approved),
        "disbursed": sum(disbursed),
        "approved-single-country": sum(single),
    }

    every_candidate = [c for p in projects for c in p["candidates"]]
    activity_sites = [c for p in projects for c in p["activitySites"]]
    return {
        "projects": projects,
        "totals": totals,
        "sourceCoordinateCount": len(every_candidate),
        "activitySiteCount": len(activity_sites),
        "countryPointCount": len(every_candidate) - len(activity_sites),
        "verifiedActivitySitesPresent": verified_sites_present(every_candidate),
    }
