"""Normalization and safety helpers for Vietnam V124 workbook ingestion."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
import re
import unicodedata
from decimal import Decimal
from typing import Any, Iterable, Mapping


ELEMENT_ID_RE = re.compile(r"^[A-E]-\d{3}$")
ELEMENT_ID_SEARCH_RE = re.compile(r"(?<![A-Z0-9])([A-E]-\d{3})(?!\d)", re.IGNORECASE)

_PLACEHOLDER_EXACT = {
    "",
    "-",
    "--",
    "n/a",
    "na",
    "null",
    "none",
    "tbd",
    "해당없음",
    "해당 없음",
    "미수집",
    "미제공",
    "미확보",
    "자료없음",
    "자료 없음",
    "입력예정",
    "입력 예정",
    "추후입력",
    "추후 입력",
    "확인필요",
    "확인 필요",
    "not available",
    "not collected",
    "not provided",
}

_PLACEHOLDER_ROW_MARKERS = (
    "본 시트 해당없음",
    "본 시트는 해당없음",
    "해당없음",
    "해당 없음",
    "해당없음.",
    "해당 없음.",
    "입력 양식",
    "입력양식",
    "추후 입력",
    "입력 예정",
    "미수집",
    "미확보",
    "자료 없음",
    "자료없음",
    "not collected",
    "no populated record",
)

_CREDENTIAL_FIELD_RE = re.compile(
    r"(?:^|[^a-z0-9])(?:password|passwd|pwd|api[ _-]?key|access[ _-]?token|"
    r"auth(?:orization)?[ _-]?token|client[ _-]?secret|private[ _-]?key|"
    r"secret[ _-]?key|credential)(?:$|[^a-z0-9])|"
    r"비밀번호|인증키|인증[ _-]?토큰|접근[ _-]?토큰|보안키|개인키|인증정보",
    re.IGNORECASE,
)

_CREDENTIAL_VALUE_PATTERNS = (
    re.compile(
        r"(?:api[_ -]?key|access[_ -]?token|auth(?:orization)?[_ -]?token|"
        r"client[_ -]?secret|password|passwd|pwd)\s*[:=]\s*([^\s,;]+)",
        re.IGNORECASE,
    ),
    re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{12,}", re.IGNORECASE),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", re.IGNORECASE),
)


def nfc_text(value: str) -> str:
    """Return a stable, trimmed NFC string without changing internal semantics."""

    text = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    return text.strip()


def normalize_value(value: Any) -> Any:
    """Convert an Excel cell to a deterministic JSON-compatible value."""

    if value is None:
        return None
    if isinstance(value, str):
        result = nfc_text(value)
        return result if result else None
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        value = float(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            return None
        if value.is_integer() and abs(value) <= 9_007_199_254_740_991:
            return int(value)
        return value
    if isinstance(value, (bool, int)):
        return value
    return nfc_text(str(value)) or None


def normalize_row(values: Iterable[Any]) -> list[Any]:
    result = [normalize_value(value) for value in values]
    while result and result[-1] is None:
        result.pop()
    return result


def normalize_field_name(value: Any) -> str:
    text = nfc_text(str(value or "")).lower()
    text = text.replace("요소_명", "element_name").replace("요소_id", "element_id")
    text = re.sub(r"[\s./\\()\[\]{}·,:;\-]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_")


def decode_zip_filename(filename: str) -> str:
    """Normalize ZIP names and repair common reversible legacy mojibake."""

    candidate = nfc_text(filename.replace("\\", "/"))
    # Some legacy archives stored CP949 bytes after a Latin-1 decode. Only accept
    # a repair when it is lossless and removes obvious mojibake markers.
    if any(marker in candidate for marker in ("Ã", "Â", "¤", "¿", "¼")):
        for source_encoding in ("latin-1", "cp1252"):
            try:
                repaired = candidate.encode(source_encoding).decode("cp949")
            except (UnicodeEncodeError, UnicodeDecodeError):
                continue
            if repaired and repaired.count("�") < candidate.count("�"):
                candidate = repaired
                break
    return unicodedata.normalize("NFC", candidate)


def extract_element_id(value: Any) -> str | None:
    text = nfc_text(str(value or "")).upper()
    match = ELEMENT_ID_SEARCH_RE.search(text)
    return match.group(1).upper() if match else None


def is_placeholder(value: Any) -> bool:
    if value is None:
        return True
    text = nfc_text(str(value)).lower()
    return text in _PLACEHOLDER_EXACT


def is_explicit_placeholder_row(values: Iterable[Any]) -> bool:
    texts = [nfc_text(str(value)) for value in values if value is not None]
    if not texts:
        return False
    joined = " ".join(texts).lower()
    return any(marker.lower() in joined for marker in _PLACEHOLDER_ROW_MARKERS)


def semantic_attribute_name(label: Any, fallback: str) -> str:
    text = nfc_text(str(label or ""))
    if text:
        parenthetical = re.findall(r"\(([A-Za-z][A-Za-z0-9_\- ]{1,80})\)", text)
        if parenthetical:
            candidate = normalize_field_name(parenthetical[-1])
            if candidate:
                return candidate
        candidate = normalize_field_name(text)
        if candidate:
            return candidate
    return normalize_field_name(fallback) or fallback


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def duplicate_summary(records: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    seen: dict[str, int] = {}
    duplicate_hashes: list[str] = []
    total = 0
    for record in records:
        total += 1
        # Provenance coordinates must not make otherwise identical source rows
        # appear unique.
        comparable = {key: value for key, value in record.items() if key != "source_row"}
        digest = sha256_json(comparable)
        seen[digest] = seen.get(digest, 0) + 1
    for digest, count in sorted(seen.items()):
        if count > 1:
            duplicate_hashes.extend([digest] * (count - 1))
    return {
        "recordCount": total,
        "uniqueRecordCount": len(seen),
        "duplicateCount": len(duplicate_hashes),
        "duplicateHashes": duplicate_hashes,
    }


def credential_finding(field_name: str, value: Any) -> dict[str, Any] | None:
    """Detect actual credential material without flagging normal contact fields."""

    if value is None or is_placeholder(value):
        return None
    field_text = nfc_text(field_name)
    value_text = nfc_text(str(value))
    field_match = bool(_CREDENTIAL_FIELD_RE.search(field_text))
    value_match = any(pattern.search(value_text) for pattern in _CREDENTIAL_VALUE_PATTERNS)
    if not (field_match or value_match):
        return None
    # Mere definitions such as "API key is not provided" are not credentials.
    lowered = value_text.lower()
    if any(term in lowered for term in ("not provided", "not collected", "미제공", "미수집", "없음")):
        return None
    return {
        "field": field_text,
        "reason": "credential-field" if field_match else "credential-value-pattern",
        "valueSha256": hashlib.sha256(value_text.encode("utf-8")).hexdigest(),
        "valueLength": len(value_text),
    }


def sanitize_mapping_credentials(
    record: Mapping[str, Any],
    *,
    field_labels: Mapping[str, str] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Remove credential values while preserving official contact fields."""

    labels = field_labels or {}
    sanitized: dict[str, Any] = {}
    findings: list[dict[str, Any]] = []
    for key, value in record.items():
        if isinstance(value, Mapping):
            nested, nested_findings = sanitize_mapping_credentials(value)
            sanitized[key] = nested
            findings.extend({**item, "field": f"{key}.{item['field']}"} for item in nested_findings)
            continue
        label = labels.get(key, key)
        finding = credential_finding(label, value)
        if finding:
            findings.append(finding)
            sanitized[key] = None
        else:
            sanitized[key] = value
    return sanitized, findings


def stable_sort_key(value: Mapping[str, Any]) -> tuple[str, ...]:
    return (
        str(value.get("element_id") or ""),
        str(value.get("indicator_id") or ""),
        str(value.get("country_iso3") or ""),
        str(value.get("year") or ""),
        canonical_json(value),
    )
