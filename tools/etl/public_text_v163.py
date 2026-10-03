"""V163: the public text of a published element, without our working notes.

The delivery workbooks write the research team's notes into the same cells the
platform publishes: a source's attribution line carries "[출처 문구] 원천 지정
표기 그대로 기재(처리규칙 8, 2026-09-21 확인)", a licence "근거 없음 — 이용약관
미공개(2026-08-26 확인)", a caveat the template note "[열 구조] 10개국 공통 열
구조 …", a citation the working file "raw 의 A-022_전체국가원본_….csv". Those are
notes to each other, not facts about the data (user decision 2026-10-03, V163-T).

`clean_public_text` returns the public text and the parts it took out; the
builders call `sanitize_payload` on every element payload, catalog row and
rights row just before writing `public/`, and write the removed parts to an
internal report (reports/v163/internal-notes-<country>.json), never to
`public/`. The raw parse, the quality report and the source diff are untouched.

Rules (each one is what a reviewer flagged on a screen or in a download):
1. A segment that opens with an internal tag ("[표출범위] …", "[라이선스 근거]
   …", "[처리규칙 적용 2026-09-19] …") is removed up to the next tag or " / ".
2. The ranking marks "[기준 원천]" / "[대조]" are dropped; the names stay.
3. A sentence that cites a processing rule ("처리규칙 N") is removed.
4. A check date in brackets ("(…, 2026-09-21 확인)") is removed.
5. A working file name ("A-022_전체국가원본_IC.ELC.DURS_WorldBank.csv") is
   replaced by the element's public source name.
6. On one country's data, a sentence about the multi-country template or
   another registry country ("10개국 공통 열 구조", "(베트남·필리핀·…)") is removed.
7. A country without the 2025 province reform writes "지역명", not
   "지역명 (개편 전)".
8. "[변경 고지]" keeps its sentence - it is the licence's required change
   notice (CC BY 4.0 §3(a)(1)(B)) - without the tag and the pointer to our
   workbook column.
Nothing is reworded beyond these; a field left empty becomes None.
"""
from __future__ import annotations

import json
import pathlib
import re
from typing import Any, Iterable

ROOT = pathlib.Path(__file__).resolve().parents[2]

# Keys whose string values (or string lists) are public text.
PUBLIC_TEXT_KEYS = frozenset(
    {
        "attributionText",
        "attributionTexts",
        "rightsNote",
        "licenses",
        "licenseCode",
        "originalLicenses",
        "sourceOrg",
        "sourceOrganizations",
        "caveat",
        "note",
        "missingNote",
        "citationLocator",
        "sourceCaveat",
        "sourceNote",
    }
)

# 6. applies to the descriptive metadata only: a record's own note can be a
# fact about another country (a treaty with it) and is left whole.
META_TEXT_KEYS = frozenset({"attributionText", "attributionTexts", "rightsNote", "caveat", "missingNote", "citationLocator", "sourceCaveat", "sourceNote"})

# 1. Tags that open a working note (a date or a number may follow inside).
INTERNAL_TAG_V163 = re.compile(
    r"\[(?:"
    r"출처 문구|표출범위|DoD[^\]]*|"
    r"라이선스 (?:근거|판정|확인)[^\]]*|"
    r"처리규칙[^\]]*|규칙 \d[^\]]*|"
    r"10개국 비교가능성|원천 갱신일 근거|tech_ids|기술코드|열 구조|"
    r"추가수집[^\]]*|좌표[^\]]*(?:미확보|정정)[^\]]*|지역값[^\]]*|"
    r"수집 방법|원문 정제|원본 버전|근거자료"
    r")\]"
)
ANY_TAG_V163 = re.compile(r"\[[^\[\]\n]{1,60}\]")
RANK_TAG_V163 = re.compile(r"\s*\[(?:기준 원천|대조)\]")
# "[변경 고지]" is the licence's change notice (CC BY 4.0 §3(a)(1)(B) requires
# saying the values were modified): its sentence is public, only the tag and the
# pointer into our workbook ("(가공 내역은 2_meta_info 의 산출방식 열 참조)") go.
CHANGE_NOTICE_TAG_V163 = re.compile(r"\[변경 고지\]\s*")
WORKBOOK_POINTER_V163 = re.compile(r"\s*\((?:가공 내역은\s*)?(?:2_meta_info\s*의\s*)?산출방식\s*열\s*참조\)")
CHECK_DATE_V163 = re.compile(r",?\s*\d{4}-\d{2}-\d{2}\s*확인")
RULE_SENTENCE_V163 = re.compile(r"처리규칙")
# 5. A working file: an element-coded or a raw-tree file name, with its 「」.
# Only our own working files: they start with the element code ("A-022_…",
# "B-001_건기／우기_…"). A source's own published file ("CPI2025_Results.xlsx")
# is the source's name for its data and stays.
WORK_FILE_V163 = re.compile(
    r"(?:raw\s*의\s*)?「?(?<![\w.\-])[A-E]-\d{3}_[^「」\n,;]*?\.(?:csv|xlsx?|pdf|geojson|json|zip|shp)」?"
)
# A working folder path in front of the file ("raw_data\B-003_연평균 기온(tas)\ …").
RAW_PATH_V163 = re.compile(r"raw_data[\\/](?:[^\\\n]*?\\)*\s*")
TEMPLATE_SENTENCE_V163 = re.compile(r"\d+개국")
NO_REFORM_LABEL_V163 = re.compile(r"지역명\s*\(개편 전\)")
SENTENCE_SPLIT_V163 = re.compile(r"(?<=[.。])\s+|\s+/\s+")


def _registry_names() -> dict[str, str]:
    path = ROOT / "public" / "data" / "countries.json"
    try:
        rows = json.loads(path.read_text(encoding="utf-8")).get("countries") or []
    except FileNotFoundError:
        return {}
    return {str(row["iso3"]).upper(): str(row.get("nameKo") or "") for row in rows if row.get("nameKo")}


REGISTRY_NAMES_V163 = _registry_names()
REFORM_COUNTRIES_V163 = frozenset({"VNM"})


def _segments(text: str) -> list[str]:
    """Split before every tag, keeping the text before the first one."""
    cuts = [0] + [match.start() for match in ANY_TAG_V163.finditer(text)] + [len(text)]
    return [text[a:b] for a, b in zip(cuts, cuts[1:]) if text[a:b]]


def _tidy(text: str, original: str) -> str:
    """Only the seams a removal left: empty brackets, doubled separators, a
    separator at either end. A string nothing was taken from is returned as is
    (a URL's "//" or a trailing "/" is never a seam)."""
    if text == original:
        return text
    text = re.sub(r"\(\s*\)", "", text)
    text = re.sub(r"(?:\s*·\s*){2,}", " · ", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"^(?:\s*[·|]\s*|\s*/\s+)+|(?:\s*[·|]\s*|\s+/\s*)+$", "", text)
    return text.strip(" ;,\n\t")


def clean_public_text(value: str, *, country: str, source_name: str | None = None, meta: bool = True) -> tuple[str, list[str]]:
    """The public part of one string and the working notes taken out of it."""
    removed: list[str] = []
    text = RANK_TAG_V163.sub("", value)
    for match in WORKBOOK_POINTER_V163.findall(text):
        removed.append(match.strip())
    text = WORKBOOK_POINTER_V163.sub("", CHANGE_NOTICE_TAG_V163.sub("", text))

    kept: list[str] = []
    for segment in _segments(text):
        if INTERNAL_TAG_V163.match(segment):
            # A segment runs to the next " / " (the workbook's own separator).
            head, sep, tail = segment.partition(" / ")
            removed.append(head.strip())
            if sep:
                kept.append(tail)
            continue
        kept.append(segment)
    text = "".join(kept)

    sentences = [part for part in SENTENCE_SPLIT_V163.split(text) if part]
    others = [name for iso3, name in REGISTRY_NAMES_V163.items() if iso3 != country.upper()]
    survivors: list[str] = []
    for sentence in sentences:
        other_country = meta and (TEMPLATE_SENTENCE_V163.search(sentence) or any(name in sentence for name in others))
        if RULE_SENTENCE_V163.search(sentence) or other_country:
            removed.append(sentence.strip())
            continue
        survivors.append(sentence)
    if len(survivors) != len(sentences):
        text = " ".join(survivors)

    for match in CHECK_DATE_V163.findall(text):
        removed.append(match.strip(", "))
    text = CHECK_DATE_V163.sub("", text)

    def _file(match: re.Match[str]) -> str:
        removed.append(match.group(0))
        return f"「{source_name}」" if source_name else ""

    for match in RAW_PATH_V163.findall(text):
        removed.append(match.strip())
    text = RAW_PATH_V163.sub("", text)
    text = WORK_FILE_V163.sub(_file, text)
    if source_name:
        # Several working files of one source collapse to that source once.
        quoted = re.escape(f"「{source_name}」")
        text = re.sub(rf"{quoted}(?:\s*[;,·]\s*{quoted})+", f"「{source_name}」", text)

    if country.upper() not in REFORM_COUNTRIES_V163:
        text = NO_REFORM_LABEL_V163.sub("지역명", text)

    return _tidy(text, value), [part for part in removed if part]


def _source_name(payload: dict[str, Any], country: str) -> str | None:
    element = payload.get("element") or payload.get("meta", {}).get("element") or payload
    names = element.get("sourceOrganizations") or []
    if isinstance(names, list) and names:
        name, _ = clean_public_text(str(names[0]), country=country, source_name=None, meta=False)
        return name or None
    return None


def sanitize_tree(node: Any, *, country: str, source_name: str | None, element_id: str, log: list[dict[str, Any]], path: str = "") -> Any:
    """Clean every public text key in a nested payload, in place; returns the node."""
    if isinstance(node, dict):
        for key, value in list(node.items()):
            here = f"{path}.{key}"
            if key in PUBLIC_TEXT_KEYS:
                node[key] = _clean_value(value, country=country, source_name=source_name, element_id=element_id, log=log, path=here, meta=key in META_TEXT_KEYS)
            else:
                sanitize_tree(value, country=country, source_name=source_name, element_id=element_id, log=log, path=here)
    elif isinstance(node, list):
        for item in node:
            sanitize_tree(item, country=country, source_name=source_name, element_id=element_id, log=log, path=f"{path}[]")
    return node


def _clean_value(value: Any, *, country: str, source_name: str | None, element_id: str, log: list[dict[str, Any]], path: str, meta: bool) -> Any:
    if isinstance(value, str):
        cleaned, removed = clean_public_text(value, country=country, source_name=source_name, meta=meta)
        if removed:
            _record(log, element_id, path, removed)
        return cleaned or None
    if isinstance(value, list):
        out: list[Any] = []
        for item in value:
            if isinstance(item, str):
                cleaned, removed = clean_public_text(item, country=country, source_name=source_name, meta=meta)
                if removed:
                    _record(log, element_id, path, removed)
                if cleaned and cleaned not in out:
                    out.append(cleaned)
            else:
                out.append(sanitize_tree(item, country=country, source_name=source_name, element_id=element_id, log=log, path=path))
        return out
    return sanitize_tree(value, country=country, source_name=source_name, element_id=element_id, log=log, path=path)


def _record(log: list[dict[str, Any]], element_id: str, path: str, removed: Iterable[str]) -> None:
    for part in removed:
        log.append({"elementId": element_id, "field": re.sub(r"\[\]", "", path), "removed": part})


def sanitize_payload(payload: dict[str, Any], *, element_id: str, country: str, log: list[dict[str, Any]]) -> dict[str, Any]:
    """One element payload (pack/ZIP), cleaned in place."""
    return sanitize_tree(payload, country=country, source_name=_source_name(payload, country), element_id=element_id, log=log)


def write_internal_report(log: list[dict[str, Any]], country: str) -> pathlib.Path:
    """The removed notes, summarised per element and field (not published)."""
    summary: dict[str, dict[str, dict[str, int]]] = {}
    for row in log:
        by_field = summary.setdefault(row["elementId"], {}).setdefault(row["field"], {})
        by_field[row["removed"]] = by_field.get(row["removed"], 0) + 1
    out = ROOT / "reports" / "v163" / f"internal-notes-{country.lower()}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    body = {
        "schemaVersion": "v163-internal-notes-1",
        "country": country.upper(),
        "note": "Working notes taken out of public text fields by tools/etl/public_text_v163.py. Internal - never published.",
        "removedCount": len(log),
        "elements": {element_id: {field: [{"text": text, "count": count} for text, count in sorted(parts.items())] for field, parts in sorted(fields.items())} for element_id, fields in sorted(summary.items())},
    }
    out.write_text(json.dumps(body, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out
