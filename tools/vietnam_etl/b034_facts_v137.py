"""Turn the B-034 entity sheet into analysis facts.

The final delivery restructured B-034 from 474 flat observations into 246
entities: 63 province rows that carry five measures side by side in attribute
columns, and 183 rows under the national indicator that hold one value each in
``attr_13`` with its unit in ``attr_14``.

Nothing here infers meaning from column position. Every measure is bound by the
label the workbook prints above it, and the period for each measure comes from
the sheet's own note rather than from the element-level ``reference_year``:

    저장량·밀도는 2000년 기준, 배출·흡수·순플럭스는 2001–2024 연평균.

That distinction matters. ``reference_year`` is 2000 for the whole element, but
applying it to the flux measures would date a 24-year mean to a single year.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Iterable, Mapping

ELEMENT_ID = "B-034"

# The note above is the authority for period; the label above each column is the
# authority for unit. quantityType/statisticType follow from what the measure is,
# not from how it happens to be stored.
PROVINCE_MEASURE_CONTRACT: tuple[dict[str, Any], ...] = (
    {
        "sourceLabel": "지상부 탄소저장량(Mg C)",
        "measureId": "b034-agb-carbon-stock",
        "publicLabel": "지상부 탄소저장량",
        "quantityType": "stock",
        "statisticType": "point-in-time",
        "referenceYear": 2000,
        "periodStart": 2000,
        "periodEnd": 2000,
    },
    {
        "sourceLabel": "지상부 탄소밀도(Mg C/ha)",
        "measureId": "b034-agb-carbon-density",
        "publicLabel": "지상부 탄소밀도",
        "quantityType": "density",
        "statisticType": "point-in-time",
        "referenceYear": 2000,
        "periodStart": 2000,
        "periodEnd": 2000,
    },
    {
        "sourceLabel": "산림탄소 총배출(Mg CO2e/yr)",
        "measureId": "b034-forest-carbon-gross-emissions",
        "publicLabel": "산림탄소 총배출",
        "quantityType": "flux",
        "statisticType": "annual-mean",
        "referenceYear": None,
        "periodStart": 2001,
        "periodEnd": 2024,
    },
    {
        "sourceLabel": "산림탄소 총흡수(Mg CO2/yr)",
        "measureId": "b034-forest-carbon-gross-removals",
        "publicLabel": "산림탄소 총흡수",
        "quantityType": "flux",
        "statisticType": "annual-mean",
        "referenceYear": None,
        "periodStart": 2001,
        "periodEnd": 2024,
    },
    {
        "sourceLabel": "산림탄소 순플럭스(Mg CO2e/yr)",
        "measureId": "b034-forest-carbon-net-flux",
        "publicLabel": "산림탄소 순플럭스",
        "quantityType": "flux",
        "statisticType": "annual-mean",
        "referenceYear": None,
        "periodStart": 2001,
        "periodEnd": 2024,
        # The source states the sign convention explicitly; it is not inferred
        # from the values being negative.
        "signConvention": "음수 = 순흡수원(sink)",
    },
)

# Threshold is a real dimension of these values, printed in the 구분 column.
THRESHOLD_RE = re.compile(r"(\d{2})\s*%")


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def normalize_place(name: str) -> str:
    """Fold a place name the way the repository's alias table already folds it.

    The delivery writes province names without spaces (``AnGiang``,
    ``BacLieu``), so word boundaries are restored from the capitalisation before
    folding; otherwise nothing matches the alias table's ``an giang`` form.
    """

    text = _text(name)
    decomposed = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    stripped = stripped.replace("Đ", "D").replace("đ", "d")
    spaced = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", stripped)
    spaced = re.sub(r"[^0-9A-Za-z]+", " ", spaced)
    return " ".join(spaced.lower().split())


def build_region_crosswalk(
    alias_payload: Mapping[str, Any]
) -> dict[str, dict[str, str]]:
    """Index the repository's verified ADM1 alias table by normalized name.

    The delivery identifies provinces by GADM ``GID_1`` (``VNM.1_1``) while the
    published boundaries are keyed by ``adm1Code`` (``VN-01``). Those are
    different systems, and no crosswalk between them ships in the repo, so the
    join runs through this table - the same authority the boundaries already
    use - and only on an exact normalized match.
    """

    lookup: dict[str, dict[str, str]] = {}
    for row in alias_payload.get("aliases", []):
        code = _text(row.get("adm1Code"))
        canonical = _text(row.get("canonicalName"))
        if not code:
            continue
        names = {canonical, _text(row.get("normalizedKey"))}
        names.update(_text(item) for item in row.get("variants", []))
        for name in names:
            key = normalize_place(name)
            if key:
                lookup[key] = {"adm1Code": code, "canonicalName": canonical}
    return lookup


def _resolve_region(
    attributes: Mapping[str, Any], crosswalk: Mapping[str, Mapping[str, str]]
) -> tuple[dict[str, Any], str | None]:
    gadm = _text(attributes.get("레코드_키"))
    roman = _text(attributes.get("지역명_로마자"))
    vietnamese = _text(attributes.get("지역명_베트남어"))
    reorganised = _text(attributes.get("2025_개편_후_소속_34개_체계"))

    # Only the province's own names may resolve it. The 2025 column names the
    # 34-unit successor a province was folded into, so matching on it would map
    # several 63-unit provinces onto one code and silently redistribute their
    # values onto the newer boundary.
    match = None
    for candidate in (vietnamese, roman):
        match = crosswalk.get(normalize_place(candidate))
        if match:
            break

    region = {
        "sourceRegionKey": gadm,
        "sourceRegionKeySystem": "GADM 4.1 GID_1",
        "regionNameVietnamese": vietnamese,
        "regionNameRoman": roman,
        "administrativeUnit": _text(attributes.get("행정단위")),
        # Kept as a recorded relationship only. Values stay on the 63-unit
        # boundary they were measured on and are never redistributed onto it.
        "reorganised2025Parent": reorganised,
        "geographyVersion": "pre-2025-63",
    }
    if not match:
        return region, None
    region["adm1Code"] = match["adm1Code"]
    region["regionLabel"] = match["canonicalName"]
    return region, match["adm1Code"]


def _unit_from_label(label: str) -> str:
    inner = re.findall(r"\(([^()]*)\)", label)
    return inner[-1].strip() if inner else ""


def derive_b034_facts(
    workbook: Mapping[str, Any],
    alias_payload: Mapping[str, Any],
) -> dict[str, Any]:
    """Expand the entity sheet into one fact per measured cell."""

    crosswalk = build_region_crosswalk(alias_payload)
    labels = {
        _text(value): key for key, value in (workbook.get("entityAttributeLabels") or {}).items()
    }
    facts: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    aliases: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    unmatched_regions: list[str] = []

    entities = workbook.get("entities") or []
    source_package = _text(workbook.get("sourcePackage"))
    archive = _text(workbook.get("archiveName"))

    def provenance(entity: Mapping[str, Any], source_field: str) -> dict[str, Any]:
        return {
            "sourcePackage": source_package,
            "sourceFile": archive,
            "sourceSheet": "1.2_entity(레코드형)",
            "sourceRow": int(entity.get("source_row") or 0),
            "sourceField": source_field,
        }

    for entity in entities:
        attributes = entity.get("attributes") or {}
        indicator = _text(entity.get("indicator_id"))
        note = _text(entity.get("note"))
        classification = _text(attributes.get("구분"))

        if indicator.endswith("_adm1"):
            region, adm1 = _resolve_region(attributes, crosswalk)
            if not adm1:
                unmatched_regions.append(region["regionNameRoman"] or region["sourceRegionKey"])
            threshold_match = THRESHOLD_RE.search(classification)
            threshold = f"{threshold_match.group(1)}%" if threshold_match else None
            for contract in PROVINCE_MEASURE_CONTRACT:
                attr_key = labels.get(contract["sourceLabel"])
                # Bind by printed label; a column that is absent is absent, not
                # the next column along.
                normalized_key = None
                for key in attributes:
                    if _matches_label(key, contract["sourceLabel"]):
                        normalized_key = key
                        break
                if normalized_key is None:
                    skipped.append(
                        {
                            "elementId": ELEMENT_ID,
                            "reason": "SOURCE_FIELD_ABSENT",
                            "sourceLabel": contract["sourceLabel"],
                            "sourceRow": int(entity.get("source_row") or 0),
                        }
                    )
                    continue
                raw = attributes.get(normalized_key)
                if raw is None or _text(raw) == "":
                    skipped.append(
                        {
                            "elementId": ELEMENT_ID,
                            "reason": "MISSING_VALUE",
                            "sourceLabel": contract["sourceLabel"],
                            "sourceRow": int(entity.get("source_row") or 0),
                            "regionKey": region["sourceRegionKey"],
                        }
                    )
                    continue
                facts.append(
                    {
                        "elementId": ELEMENT_ID,
                        "measureId": contract["measureId"],
                        "publicLabel": contract["publicLabel"],
                        "sourceField": attr_key or normalized_key,
                        "sourceLabel": contract["sourceLabel"],
                        "value": _number(raw),
                        "unit": _unit_from_label(contract["sourceLabel"]),
                        "quantityType": contract["quantityType"],
                        "statisticType": contract["statisticType"],
                        "referenceYear": contract["referenceYear"],
                        "periodStart": contract["periodStart"],
                        "periodEnd": contract["periodEnd"],
                        "threshold": threshold,
                        "spatialUnit": "admin1",
                        "signConvention": contract.get("signConvention"),
                        "sourceNote": note,
                        **region,
                        "provenance": provenance(entity, attr_key or normalized_key),
                    }
                )
            continue

        # National indicator: one value per row, unit printed beside it.
        value_raw = attributes.get("값_전국_계열")
        unit = _text(attributes.get("단위_전국_계열"))
        year_raw = attributes.get("기준연도")
        record = {
            "elementId": ELEMENT_ID,
            "classification": classification,
            "value": _number(value_raw),
            "unit": unit,
            "sourceYearLabel": _number(year_raw),
            "sourceField": "attr_13",
            "spatialUnit": "nation",
            "provenance": provenance(entity, "attr_13"),
        }
        if value_raw is None or _text(value_raw) == "":
            skipped.append({**record, "reason": "MISSING_VALUE"})
            continue
        # The national rows print their own year and unit, so each is a fact in
        # its own right - including the 2001-2024 annual gross-emissions series,
        # which is a real time series and not a repeat of the 24-year mean.
        record["measure"] = _national_measure(classification)
        record["threshold"] = (
            f"{THRESHOLD_RE.search(classification).group(1)}%"
            if THRESHOLD_RE.search(classification)
            else None
        )
        if "성(省) 단위" in classification:
            # The same province values are repeated here under the national
            # indicator. They are recorded as aliases of the admin1 facts so
            # nothing counts them twice.
            aliases.append({**record, "aliasOf": "admin1-measure"})
            continue
        unresolved.append(record)

    return {
        "facts": facts,
        "nationalRows": unresolved,
        "provinceAliasRows": aliases,
        "skipped": skipped,
        "unmatchedRegions": sorted(set(unmatched_regions)),
        "entityCount": len(entities),
    }


def _matches_label(normalized_key: str, label: str) -> bool:
    """True when a parser-normalized attribute key came from ``label``.

    The parser folds the printed label into its key, but not reversibly - long
    labels lose their leading words. Comparing the folded forms of both sides,
    and accepting a suffix match, keeps the binding tied to the label rather
    than to a column index.
    """

    folded_label = re.sub(r"[^0-9a-z가-힣]+", "_", label.lower()).strip("_")
    folded_key = normalized_key.lower().strip("_")
    return folded_key == folded_label or folded_label.endswith(folded_key)


def _number(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    text = _text(value).replace(",", "")
    try:
        return int(text)
    except ValueError:
        try:
            return float(text)
        except ValueError:
            return value


_NATIONAL_MEASURES = (
    ("산림탄소 순플럭스", "b034-forest-carbon-net-flux", "flux"),
    ("산림탄소 총배출", "b034-forest-carbon-gross-emissions", "flux"),
    ("산림탄소 총흡수", "b034-forest-carbon-gross-removals", "flux"),
    ("지상부 탄소밀도", "b034-agb-carbon-density", "density"),
    ("지상부 탄소 밀도", "b034-agb-carbon-density", "density"),
    ("지상부 바이오매스 탄소저장량", "b034-agb-carbon-stock", "stock"),
    ("지상부 탄소저장량", "b034-agb-carbon-stock", "stock"),
    ("지하부·토양 탄소저장량", "b034-bgb-soil-carbon-stock", "stock"),
    ("수관 면적", "b034-tree-cover-area", "area"),
)


def _national_measure(classification: str) -> dict[str, Any] | None:
    """Identify a national row's measure from its printed 구분 text."""
    for label, measure_id, quantity in _NATIONAL_MEASURES:
        if label in classification:
            return {"measureId": measure_id, "publicLabel": label, "quantityType": quantity}
    return None
