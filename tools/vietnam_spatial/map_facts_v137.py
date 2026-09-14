"""Which source attribute holds each fact a facility layer puts on the map.

The V2 map index used to copy ``tooltipFields`` and ``filters`` straight out of
the V1 index, whose field names were written for the previous delivery. The
final delivery names its columns differently for every element - B-048 keeps
Korean headers, A-023 carries World Resources Institute and OpenStreetMap column
names side by side, C-025 arrived with positional ``속성N_`` headers - so those
names resolved to nothing. ``normalizedAttributes["mineral"]`` is undefined while
the mineral sits in ``normalizedAttributes["광종"]``, which is why Ban Phuc's
popup carried no 광종 and the panel reported "원천 미제공: 광종 · 지역" for
values the source plainly ships. That is MAP-003.

Each fact below names a public key, its Korean label, and the source attribute
keys that can hold it, in preference order. Only facts that actually resolve
against the delivered records are published, so a layer never advertises a field
the delivery does not have, and nothing here invents a value: every candidate key
is a column the delivery ships.
"""

from __future__ import annotations

from typing import Any, Iterable, Mapping

from ..vietnam_etl.normalization import is_placeholder

Fact = dict[str, Any]


# The two A-023 deliveries use the same fuel vocabulary in different case: the
# OpenStreetMap rows arrived with both the raw token and its Korean label
# already paired (hydro/수력, gas;oil/가스·석유, …), and the World Resources
# Institute rows carry the same tokens capitalised with no label. Reusing the
# pairing the delivery itself established is a translation of a shared
# vocabulary, not a new classification - without it 236 plants stay unlabelled
# and uncoloured on a map that colours by fuel.
FUEL_LABELS_V137: dict[str, str] = {
    "biomass": "바이오매스",
    "coal": "석탄",
    "gas": "가스",
    "gas;oil": "가스·석유",
    "hydro": "수력",
    "oil": "석유",
    "solar": "태양광",
    "waste": "폐기물",
    "wind": "풍력",
}


def _fact(
    key: str,
    label: str,
    sources: tuple[str, ...],
    *,
    unit: str | None = None,
    filterable: bool = False,
    value_map: Mapping[str, str] | None = None,
    note: str | None = None,
) -> Fact:
    fact: Fact = {"key": key, "label": label, "sources": list(sources)}
    if unit:
        fact["unit"] = unit
    if filterable:
        fact["filterable"] = True
    if value_map:
        fact["valueMap"] = dict(value_map)
    if note:
        fact["note"] = note
    return fact


# A-023's four unlabelled OpenStreetMap columns state their own meaning in every
# record's note ("[OSM ID: …]", "운영자: …", "연료: …", "용량 원문: …"). That
# correspondence was checked on all 1,727 rows before these names were bound, so
# the object id is carried through under a readable name instead of a hash.
FACILITY_FACTS_V137: dict[str, tuple[Fact, ...]] = {
    "A-023": (
        _fact(
            "fuelType",
            "발전원",
            ("fuelType", "primaryFuel"),
            filterable=True,
            value_map=FUEL_LABELS_V137,
        ),
        _fact("capacityMw", "설비용량", ("capacityMw", "mw"), unit="MW"),
        _fact("capacityBand", "용량구간", ("capacityBand",), filterable=True),
        _fact("operator", "운영자", ("field_4cf75655",)),
        _fact("commissionedOn", "가동 시작", ("startDate",)),
        _fact(
            "osmObjectId",
            "OSM 객체 ID",
            ("field_33702ec7",),
            note="OpenStreetMap object type and id, preserved verbatim.",
        ),
    ),
    "B-048": (
        _fact("mineral", "광종", ("광종",), filterable=True),
        _fact("regionName", "소재 성·시", ("소재_행정구역_성",), filterable=True),
        _fact("climateTechBasis", "기후기술 연계 근거", ("기후기술_연계_근거",)),
        _fact("siteNote", "특이사항", ("특이사항",)),
        _fact("coordinateBasis", "좌표 산출근거", ("좌표_산출근거",)),
    ),
    "C-025": (
        _fact("standard", "등록표준", ("속성5_등록표준_출처",), filterable=True),
        _fact("technologyField", "기술분야", ("속성6_분류",), filterable=True),
        _fact("status", "상태", ("속성7_상태",), filterable=True),
        # The source dates the crediting period, not a separate project period.
        # Labelling it 사업기간 would state something the delivery does not.
        _fact("creditingPeriod", "크레딧 기간", ("속성17_크레딧기간",)),
        _fact("regionName", "소재 지역", ("속성21_지역_현행", "속성20_지역_원문"), filterable=True),
        _fact("proponent", "사업자·기관", ("속성8_사업자_기관",)),
        _fact("methodology", "방법론", ("속성9_방법론",)),
        _fact(
            "annualReduction",
            "연간 예상감축량",
            ("속성14_연간예상감축_tCO2e",),
            unit="tCO2e",
        ),
        _fact("recordCode", "원천 식별번호", ("속성2_레코드ID",)),
        _fact("officialSource", "공식 원문", ("속성19_원문URL",)),
    ),
}

# The line layer draws the World Bank transmission asset, whose properties are
# already named. Listing its facts here means the popup, the panel and the QA
# harness read one contract rather than three hand-written lists.
LINE_FACTS_V137: dict[str, tuple[Fact, ...]] = {
    "A-024": (
        _fact("voltageKv", "전압", ("voltageKv", "voltage"), unit="kV", filterable=True),
        _fact("lengthKm", "확인된 길이", ("lengthKm", "length"), unit="km"),
        _fact(
            "status",
            "선로 상태",
            ("status",),
            filterable=True,
            value_map={"existing": "운영", "planned": "계획", "under construction": "건설 중"},
        ),
    ),
}


# The archive writes "(미표기)" where a row's source states nothing. It is a
# real statement about the row, but as a map fact it is noise: A-023 would print
# "운영자 (미표기)" on 1,484 plants and "가동 시작 (미표기)" on 1,626 of them.
# Only the map contract treats it as absent - the record keeps it, the download
# keeps it, and the panel's "원천 미제공" line then names fields the source
# genuinely left empty.
_UNSTATED_MARKERS = {"(미표기)", "미표기", "(미기재)", "미기재"}


def _has_value(value: Any) -> bool:
    """A delivered value: not blank, not a placeholder, not an unstated marker."""

    if value is None:
        return False
    if isinstance(value, str):
        text = value.strip()
        if text == "" or text in _UNSTATED_MARKERS:
            return False
    return not is_placeholder(value)


def _published(records: Iterable[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    rows = list(records)
    eligible = [row for row in rows if row.get("mapEligible")]
    return eligible or rows


def resolve_facts(
    facts: Iterable[Fact],
    records: Iterable[Mapping[str, Any]],
    *,
    attribute_key: str = "normalizedAttributes",
) -> list[Fact]:
    """Bind each fact to the source keys that actually carry it.

    A fact resolves when at least one candidate key holds a delivered value on at
    least one published record. Anything that resolves to nothing is dropped, so
    the layer never advertises a field the delivery lacks and the panel's
    "원천 미제공" line only names fields the source really left empty.
    """

    rows = _published(records)
    resolved: list[Fact] = []
    for fact in facts:
        carrying = [
            key
            for key in fact["sources"]
            if any(
                _has_value((record.get(attribute_key) or {}).get(key))
                for record in rows
            )
        ]
        if not carrying:
            continue
        bound = dict(fact)
        bound["sources"] = carrying
        # How many records the fact resolves on, counted once per record: a fact
        # with two source columns must not report more filled records than the
        # layer has.
        bound["filledRecordCount"] = sum(
            1
            for record in rows
            if fact_value(bound, record.get(attribute_key) or {}) is not None
        )
        bound["recordCount"] = len(rows)
        resolved.append(bound)
    return resolved


def fact_value(fact: Mapping[str, Any], attributes: Mapping[str, Any]) -> Any:
    """The first delivered value among this fact's source keys, mapped."""

    for key in fact["sources"]:
        value = attributes.get(key)
        if not _has_value(value):
            continue
        mapping = fact.get("valueMap") or {}
        return mapping.get(str(value).strip().lower(), value)
    return None


def fact_values(
    fact: Mapping[str, Any],
    records: Iterable[Mapping[str, Any]],
    *,
    attribute_key: str = "normalizedAttributes",
) -> list[str]:
    """Distinct values a resolved fact takes across the published records."""

    seen: set[str] = set()
    for record in _published(records):
        value = fact_value(fact, record.get(attribute_key) or {})
        if _has_value(value):
            seen.add(str(value))
    return sorted(seen)


def resolve_line_facts(
    facts: Iterable[Fact], features: Iterable[Mapping[str, Any]]
) -> list[Fact]:
    rows = [{"normalizedAttributes": feature.get("properties") or {}, "mapEligible": True} for feature in features]
    return resolve_facts(facts, rows)


def line_fact_values(
    fact: Mapping[str, Any], features: Iterable[Mapping[str, Any]]
) -> list[str]:
    seen: set[str] = set()
    for feature in features:
        value = fact_value(fact, feature.get("properties") or {})
        if _has_value(value):
            seen.add(str(value))
    return sorted(seen)
