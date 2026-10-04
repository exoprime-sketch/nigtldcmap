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


# ---------------------------------------------------------------------------
# V163-DL: the download files (ZIP JSON and CSV) and quality-report.json.
#
# A download carries every field of a record, not only the public text keys:
# the delivery workbook's own provenance (file, sheet, row, package), notes in
# attribute cells, local folder paths and the names of our working files. In a
# download the workbook provenance is dropped, every other text is cleaned with
# the rules above plus the ones below, and the fields that state a value
# (value, unit, year, period, region, record keys, coordinates) are never
# touched. A file a publisher distributes ("global_power_plant_database.csv",
# "ndgain_countryindex_2026.zip") is a citation and stays; a workbook (.xlsx)
# and any file we named are not.
# ---------------------------------------------------------------------------
DOWNLOAD_DROP_KEYS_V163 = frozenset(
    {"sourceFileOriginal", "sourceFileDecoded", "sourceSheet", "sourceRow", "sourcePackage", "sourceFile", "sourceWorkbook", "archiveName", "sheetNames"}
)
DOWNLOAD_PROTECTED_KEY_V163 = re.compile(
    r"^(?:value|rawValue|unit|year|years|period|periodStart|periodEnd|period_start|period_end|recordId|indicatorId|elementId|elementIdsFound|"
    r"countryIso3|regionId|regionLabel|sourceRegionKey|reorganised2025Parent|latitude|longitude|lat|lon|sha256|"
    # Korean record columns that state a region, a key, a year, a unit or a
    # coordinate. A column that merely mentions one in a longer name
    # ("수집_기준_절차_DB_검색어_연도") is a description and is cleaned.
    r"지역.*|행정구역.*|.*소속_단위|.*레코드_키|연도|기준연도|단위|위도|경도)$"
)
# A working note in brackets inside a sentence ("상위 500건 상한(수집 규모 관리
# 목적, 발주처 확인 예정)") goes on its own; the sentence stays.
MEMO_ASIDE_V163 = re.compile(r"\s*\([^()]*(?:★|검토의견|공통의견|발주처|별첨\s*\d)[^()]*\)")
MEMO_SENTENCE_V163 = re.compile(r"★|검토의견|공통의견|발주처|별첨\s*\d|raw\s*폴더|raw\s*미보관|raw_data|지오코딩_대장|_원자료구성_설명|_중간집계_")
# A bracketed aside about our raw folder inside a methods sentence ("내려받아(raw_data 의
# GloFAS CSV) 월별 평년값…") goes on its own; the sentence stays.
RAW_ASIDE_V163 = re.compile(r"\s*\(raw_data[^()]*\)")
# A unit description that points into the workbook ("속성별 — 1.2_entity 3행 머리글
# 괄호 표기 참조") keeps its unit word only.
SHEET_POINTER_V163 = re.compile(r"\s*[—–,-]\s*1\.\d_(?:entity|observation)[^—\"]*?참조")
# Our shared-boundary folder named in a sentence ("…34개 체계; 00_공통 경계 파일 v1.3)").
SHARED_FOLDER_V163 = re.compile(r"\s*[;,]?\s*00_공통[^;)\]」\n]*")
# A downloaded copy's name with its " (2)" ("database_2026 (2).xlsx").
FILE_COPY_V163 = re.compile(r"[«「]?([^\s«»「」;,()\[\]]+ \(\d+\)\.(?:xlsx?|csv|json|zip|pdf|txt|geojson))(?![A-Za-z0-9_.])[»」]?", re.IGNORECASE)
LOCAL_PATH_V163 = re.compile(r"(?:00_공통|raw_data)[\\/][^\s;,」»\]]*")
# Our raw folder in front of a file the publisher distributes ("raw/768-ttg.signed.pdf"):
# the folder goes, the publisher's file name stays.
RAW_FOLDER_V163 = re.compile(r"(?<![\w/.])raw/")
SHEET_REF_V163 = re.compile(r"(?<![\w.])1\.\d_(?:entity|observation)(?:\([^)]*\))?")
FILE_TOKEN_V163 = re.compile(r"[«「]?([^\s«»「」;,()\[\]]+\.(?:xlsx?|csv|json|zip|pdf|txt|geojson|tif|shp))(?![A-Za-z0-9_.])[»」]?", re.IGNORECASE)
HANGUL_V163 = re.compile(r"[가-힣]")
DOWNLOAD_SENTENCE_SPLIT_V163 = re.compile(r"(?<=[.。])\s+|\s+/\s+|\s*·\s+(?=\[)")


def _our_file(name: str) -> bool:
    """A name we gave a file, or a workbook - never a publisher's distribution."""
    return bool(
        HANGUL_V163.search(name)
        or re.match(r"(?:[A-E]-\d{3}_|_|\d_)", name)
        or re.search(r"_0\d판", name)
        # a response we saved per country ("cckp_historical_BGD.json"), a layer we
        # cut for one country and stamped ("BGD_hybas_lev06_v1c_260924_v1.0.geojson")
        or re.search(r"_(?:BGD|VNM)(?:[_.]|$)", name)
        or re.match(r"(?:BGD|VNM)_", name)
        or re.search(r"_\d{6}_v\d", name)
        # an extract named after our element code ("GFW_B033_loss_by_driver_adm1.json")
        or re.search(r"(?<![A-Za-z])[A-E]-?\d{3}(?!\d)", name)
        or re.search(r"\.(?:xlsx?|txt)$", name, re.IGNORECASE)
        # our own notation and naming: a back-quoted file ("`VNM_QD263…signed.pdf"),
        # a country-coded name ("vnm33857grid.geojson"), a per-country save
        # ("GS_projects_Vietnam.json") and any saved JSON response - a publisher
        # serves those through the URL the record keeps
        or name.startswith("`")
        or re.match(r"(?:vnm|bgd)", name, re.IGNORECASE)
        or re.search(r"_(?:Vietnam|Bangladesh)(?:[_.]|$)", name)
        or re.search(r"\.json$", name, re.IGNORECASE)
    )


# V164: the delivery's own licence review written after a licence name or in a
# caveat - "[사실/표현 분리] …", "[라이선스 X] … 표출 '불가'로 판정한다.",
# "라이선스 판정: … '가능'.", "(라이선스 판정서 참조)", the checking aside
# "(사이트맵·푸터 전수 확인)" and the note on what the download is. The licence
# names and the quoted original terms stay (the quote under a plain label). The
# screen applies the same rule (publicLicenseTextV164).
LICENCE_REVIEW_V164 = re.compile(
    r"\s*\[(?:사실\s*/\s*표현\s*분리|라이선스\s*[XO×○]|라이선스\s*(?:근거|판정|확인)[^\]]*|처리규칙[^\]]*)\][\s\S]*?(?=\s·\s|$)"
)
LICENCE_JUDGEMENT_V164 = re.compile(r"\s*라이선스\s*판정\s*:[^.]*\.?")
LICENCE_POINTER_V164 = re.compile(r"\s*\(\s*라이선스\s*판정서\s*참조\s*\)")
LICENCE_CHECK_ASIDE_V164 = re.compile(r"\s*\([^()]*(?:전수\s*확인|확인\s*결과)[^()]*\)")
LICENCE_QUOTE_LABEL_V164 = re.compile(r"\[[^\[\]]{1,20}이용조건\s*원문\]\s*")
LICENCE_VERDICT_V164 = re.compile(r"\s*출처표시\s*외\s*추가\s*제약이\s*없어\s*표출\s*·\s*다운로드\s*모두\s*(?:허용|가능)\s*\.?")
KOGL_TEMPLATE_V164 = re.compile(r"본\s*저작물은\s*(\S+?)에서\s*O{2,4}년\s*작성하여\s*공공누리\s*제O유형으로\s*개방한\s*저작물명\s*\(\s*작성자\s*:\s*O+\s*\)을\s*이용하였으며,\s*해당\s*저작물은\s*\S+\s*홈페이지에서\s*무료로\s*다운받을\s*수\s*있습니다\.?")
DOWNLOAD_SCOPE_NOTE_V164 = re.compile(r"\s*다운로드\s*제공\s*대상은[^.]*용역사[^.]*\.?")
LICENCE_TEXT_KEYS_V164 = frozenset({"licenseCode", "licenses", "license", "attributionText", "attributionTexts", "rightsNote", "caveat"})


def clean_licence_review_v164(value: str) -> str:
    """A licence, attribution or caveat text without the delivery's licence review."""
    text = LICENCE_REVIEW_V164.sub("", value)
    text = LICENCE_JUDGEMENT_V164.sub("", text)
    text = LICENCE_POINTER_V164.sub("", text)
    text = LICENCE_CHECK_ASIDE_V164.sub("", text)
    text = LICENCE_VERDICT_V164.sub("", text)
    text = KOGL_TEMPLATE_V164.sub(r"출처: \1(공공누리 개방 저작물)", text)
    text = LICENCE_QUOTE_LABEL_V164.sub("이용조건 원문: ", text)
    text = DOWNLOAD_SCOPE_NOTE_V164.sub("", text)
    if text == value:
        return value
    text = re.sub(r"(?:\s·\s){2,}", " · ", text)
    text = re.sub(r"^\s*·\s*|\s*·\s*$", "", text)
    return re.sub(r"\s{2,}", " ", text).strip()


def clean_download_text(value: str, *, country: str, source_name: str | None, meta: bool) -> tuple[str, list[tuple[str, str]]]:
    """A download text field: the public rules, then paths, sheets, memo sentences and our files."""
    text, removed = clean_public_text(value, country=country, source_name=source_name, meta=meta)
    parts: list[tuple[str, str]] = [(_category(item), item) for item in removed]
    reviewed = clean_licence_review_v164(text)
    if reviewed != text:
        parts.append(("licence-review", text))
        text = reviewed
    for match in LOCAL_PATH_V163.findall(text):
        parts.append(("local-path", match))
    text = LOCAL_PATH_V163.sub("", text)
    for match in RAW_FOLDER_V163.findall(text):
        parts.append(("local-path", match))
    text = RAW_FOLDER_V163.sub("", text)
    for match in RAW_ASIDE_V163.findall(text):
        parts.append(("local-path", match.strip()))
    text = RAW_ASIDE_V163.sub("", text)
    for match in MEMO_ASIDE_V163.findall(text):
        parts.append(("memo-sentence", match.strip()))
    text = MEMO_ASIDE_V163.sub("", text)
    for match in SHEET_POINTER_V163.findall(text):
        parts.append(("workbook-sheet", match.strip()))
    text = SHEET_POINTER_V163.sub("", text)
    for match in SHARED_FOLDER_V163.findall(text):
        parts.append(("local-path", match.strip(" ;,")))
    text = SHARED_FOLDER_V163.sub("", text)
    for match in SHEET_REF_V163.findall(text):
        parts.append(("workbook-sheet", match))
    text = SHEET_REF_V163.sub("", text)
    sentences = [part for part in DOWNLOAD_SENTENCE_SPLIT_V163.split(text) if part]
    kept = []
    for sentence in sentences:
        if MEMO_SENTENCE_V163.search(sentence):
            parts.append(("memo-sentence", sentence.strip()))
            continue
        kept.append(sentence)
    if len(kept) != len(sentences):
        text = " ".join(kept)

    def _file(match: re.Match[str]) -> str:
        name = match.group(1)
        if not _our_file(name):
            return match.group(0)
        parts.append(("work-file", match.group(0)))
        return f"「{source_name}」" if source_name else ""

    text = FILE_COPY_V163.sub(_file, text)
    text = FILE_TOKEN_V163.sub(_file, text)
    if source_name:
        quoted = re.escape(f"「{source_name}」")
        text = re.sub(rf"{quoted}(?:\s*[;,·]\s*{quoted})+", f"「{source_name}」", text)
    return (_tidy(text, value) if parts else text), parts


def _category(removed: str) -> str:
    if RULE_SENTENCE_V163.search(removed):
        return "memo-sentence"
    if CHECK_DATE_V163.fullmatch(removed.strip()) or re.fullmatch(r"\d{4}-\d{2}-\d{2}\s*확인", removed.strip()):
        return "check-date"
    if removed.startswith("["):
        return "memo-tag"
    if removed.startswith("raw_data"):
        return "local-path"
    if WORK_FILE_V163.search(removed):
        return "work-file"
    if WORKBOOK_POINTER_V163.fullmatch(removed):
        return "workbook-pointer"
    return "memo-sentence"


def sanitize_download_v163(node: Any, *, country: str, source_name: str | None, element_id: str, log: list[dict[str, Any]], path: str = "", key: str = "") -> Any:
    """A cleaned deep copy of a download document, record list or quality report."""
    if isinstance(node, dict):
        out: dict[str, Any] = {}
        for child_key, value in node.items():
            here = f"{path}.{child_key}"
            if child_key in DOWNLOAD_DROP_KEYS_V163:
                log.append({"elementId": element_id, "field": here, "removed": child_key, "category": "workbook-provenance"})
                continue
            out[child_key] = sanitize_download_v163(value, country=country, source_name=source_name, element_id=element_id, log=log, path=here, key=str(child_key))
        return out
    if isinstance(node, list):
        cleaned = [sanitize_download_v163(item, country=country, source_name=source_name, element_id=element_id, log=log, path=f"{path}[]", key=key) for item in node]
        if all(isinstance(item, str) for item in node):
            deduped: list[Any] = []
            for item in cleaned:
                if item and item not in deduped:
                    deduped.append(item)
            return deduped
        return cleaned
    # An indicator's `unit` is its description in the metadata ("속성별 — …"); a
    # record's unit is a value and stays protected.
    indicator_unit = key == "unit" and path.startswith(".indicators")
    if isinstance(node, str) and node and (indicator_unit or not DOWNLOAD_PROTECTED_KEY_V163.match(key)):
        cleaned, parts = clean_download_text(node, country=country, source_name=source_name, meta=key in META_TEXT_KEYS)
        for category, text in parts:
            log.append({"elementId": element_id, "field": re.sub(r"\[\]", "", path), "removed": text, "category": category})
        return cleaned if cleaned else (None if node else node)
    return node


def download_document_v163(document: dict[str, Any], *, element_id: str, country: str, log: list[dict[str, Any]]) -> dict[str, Any]:
    """The element's download JSON, cleaned (a copy; the pack is untouched)."""
    source = _source_name(document, country)
    if source:
        # the name that replaces a working file is itself cleaned first
        # ("… — 레코드별 상이, 1.2_entity attr_14 참조" names a sheet column)
        source = clean_download_text(source, country=country, source_name=None, meta=False)[0] or None
    return sanitize_download_v163(document, country=country, source_name=source, element_id=element_id, log=log)


def download_rows_v163(rows: list[Any], *, element_id: str, country: str, source_name: str | None, log: list[dict[str, Any]]) -> list[Any]:
    """Records for the download CSV, cleaned the same way (log is shared, so counts stay once)."""
    scratch: list[dict[str, Any]] = []
    return sanitize_download_v163(rows, country=country, source_name=source_name, element_id=element_id, log=scratch)


def write_internal_report(log: list[dict[str, Any]], country: str) -> pathlib.Path:
    """The removed notes, summarised per element and field (not published)."""
    summary: dict[str, dict[str, dict[str, int]]] = {}
    categories: dict[str, int] = {}
    for row in log:
        by_field = summary.setdefault(row["elementId"], {}).setdefault(row["field"], {})
        by_field[row["removed"]] = by_field.get(row["removed"], 0) + 1
        category = row.get("category") or "public-text"
        categories[category] = categories.get(category, 0) + 1
    out = ROOT / "reports" / "v163" / f"internal-notes-{country.lower()}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    body = {
        "schemaVersion": "v163-internal-notes-2",
        "country": country.upper(),
        "note": "Working notes taken out of public text fields (packs, catalog, rights) and of the download files and quality report by tools/etl/public_text_v163.py. Internal - never published.",
        "removedCount": len(log),
        "byCategory": dict(sorted(categories.items())),
        "elements": {element_id: {field: [{"text": text, "count": count} for text, count in sorted(parts.items())] for field, parts in sorted(fields.items())} for element_id, fields in sorted(summary.items())},
    }
    out.write_text(json.dumps(body, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out
