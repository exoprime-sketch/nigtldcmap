"""Map the D-022 development-finance projects to provinces (V155-2).

No coordinate is estimated or geocoded. For each record of ``d-022.csv`` the
IATI activity identifier in the source link is resolved through the d-portal
JSON API (``/q?aid=…&from=act,location``), which returns the ``<location>``
elements the World Bank itself reports (precision 2 = first-level
administrative unit). The location names are normalized with the 63-unit
alias dictionary and lifted to the 2025 34-unit codes with ``crosswalk34``.

Stage ``collect`` writes the raw evidence to
``reports/v155/d-022-iati-locations-v155.json``. Stage ``finalize`` merges the
manual review file ``tools/vietnam_spatial/source/d-022-review-v155.json``
(World Bank project-page checks: quoted province lists, national-scope
rationale, HTTP status) and writes
``public/data/vietnam/v2/spatial/pending-v155/d-022-locations.json`` plus
``reports/v155/d-022-locations-v155.json``.

Run:

    python tools/vietnam_spatial/build_d022_locations_v155.py --stage collect
    python tools/vietnam_spatial/build_d022_locations_v155.py --stage finalize
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
from collections import defaultdict
from typing import Any

import requests

from osm_common_v155 import GEOMETRY_DIR, REPORT_DIR, REPOSITORY_ROOT, V2_ROOT, normalize_text, read_json, write_json


ELEMENT_ID = "D-022"
CSV_PATH = V2_ROOT / "downloads" / "d-022.csv"
CROSSWALK_PATH = REPOSITORY_ROOT / "reports" / "v138" / "map-targets-build-v138.json"
REVIEW_PATH = REPOSITORY_ROOT / "tools" / "vietnam_spatial" / "source" / "d-022-review-v155.json"
COLLECT_PATH = REPORT_DIR / "d-022-iati-locations-v155.json"
OUTPUT_PATH = V2_ROOT / "spatial" / "pending-v155" / "d-022-locations.json"
REPORT_PATH = REPORT_DIR / "d-022-locations-v155.json"
DPORTAL_Q = "https://d-portal.iatistandard.org/q?aid={aid}&from=act,location&select=*&form=json&limit=100"
WB_PAGE = "https://projects.worldbank.org/en/projects-operations/project-detail/{pid}"
WB_API = "https://search.worldbank.org/api/v2/projects?format=json&id={pid}"
PREFIXES = ("tinh", "thanh pho", "tp", "province", "city")
AGGREGATION_RULE = "다수 성 사업은 각 성에 사업 수 1건·승인액 전액 계상 — 성 간 합산 불가(중복). 전국 사업은 성별 값 없이 별도 목록."


def load_records() -> list[dict[str, Any]]:
    records = []
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            attributes = json.loads(row["attributes_json"])
            link = attributes.get("링크") or ""
            aid = re.search(r"aid=([^&#\s]+)", link)
            pid = re.search(r"(P\d{6})", link)
            records.append(
                {
                    "recordId": row["record_id"],
                    "projectName": row["name"],
                    "agency": attributes.get("공여기관"),
                    "agencyType": attributes.get("투자기관_유형"),
                    "iatiId": aid.group(1) if aid else None,
                    "wbProjectId": pid.group(1) if pid else None,
                    "periodStart": attributes.get("기간_시작"),
                    "periodEnd": attributes.get("기간_종료"),
                    "status": attributes.get("프로젝트_상태"),
                    "implementingAgency": attributes.get("실행기관"),
                    "commitmentUsd": attributes.get("대표금액"),
                    "investmentType": attributes.get("투자_유형"),
                    "csvSourceUrl": row["source_url"],
                    "csvLink": link,
                }
            )
    return records


class ProvinceNames:
    """63 alias lookup + 63->34 lift."""

    def __init__(self) -> None:
        aliases = read_json(GEOMETRY_DIR / "vnm-adm1-aliases.json")
        self.lookup63: dict[str, str] = dict(aliases["lookup"])
        self.name63 = {item["adm1Code"]: item["canonicalName"] for item in aliases["aliases"]}
        crosswalk = read_json(CROSSWALK_PATH)["crosswalk34"]
        units34 = read_json(GEOMETRY_DIR / "vnm-adm1-34.geojson")["features"]
        code34_by_key = {feature["properties"]["normalizedName"]: feature["properties"]["unitCode"] for feature in units34}
        self.name34 = {feature["properties"]["unitCode"]: feature["properties"]["name"] for feature in units34}
        self.to34: dict[str, str] = {}
        for unit in crosswalk:
            code34 = code34_by_key[unit["key"]]
            for member in unit["memberAdm1Codes"]:
                self.to34[member] = code34
        if len(self.to34) != 63:
            raise ValueError(f"crosswalk covers {len(self.to34)} of 63 provinces")

    def resolve(self, raw: str) -> dict[str, Any]:
        key = normalize_text(raw)
        stripped = key
        for prefix in PREFIXES:
            if stripped.startswith(prefix + " "):
                stripped = stripped[len(prefix) + 1 :]
        for suffix in (" city", " province"):
            if stripped.endswith(suffix):
                stripped = stripped[: -len(suffix)]
        code63 = self.lookup63.get(stripped) or self.lookup63.get(key)
        return {
            "raw": raw,
            "normalized": stripped,
            "adm1Code": code63,
            "adm1Name": self.name63.get(code63) if code63 else None,
            "adm1Code34": self.to34.get(code63) if code63 else None,
            "adm1Name34": self.name34.get(self.to34[code63]) if code63 else None,
        }


def fetch_json(url: str) -> tuple[int, Any]:
    response = requests.get(url, timeout=60, headers={"User-Agent": "nigtldcmap-v155 (data verification)"})
    try:
        return response.status_code, response.json()
    except ValueError:
        return response.status_code, None


def collect() -> None:
    names = ProvinceNames()
    records = load_records()
    checked_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    collected = []
    for record in records:
        entry = {**record, "checkedAt": checked_at, "iati": None, "worldBankApi": None}
        if record["iatiId"]:
            url = DPORTAL_Q.format(aid=record["iatiId"])
            status, payload = fetch_json(url)
            rows = payload.get("rows", []) if isinstance(payload, dict) else []
            locations = []
            for row in rows:
                if row.get("location_name") is None and row.get("location_code") is None:
                    continue
                resolved = names.resolve(row["location_name"] or "")
                locations.append(
                    {
                        **resolved,
                        "precision": row.get("location_precision"),
                        "reportedLongitude": row.get("location_longitude"),
                        "reportedLatitude": row.get("location_latitude"),
                    }
                )
            entry["iati"] = {
                "url": url,
                "httpStatus": status,
                "title": rows[0].get("title") if rows else None,
                "reporting": rows[0].get("reporting") if rows else None,
                "locationCount": len(locations),
                "locations": locations,
                "unresolvedNames": [item["raw"] for item in locations if item["adm1Code"] is None],
            }
        if record["wbProjectId"]:
            url = WB_API.format(pid=record["wbProjectId"])
            status, payload = fetch_json(url)
            project = (payload or {}).get("projects", {}).get(record["wbProjectId"], {}) if isinstance(payload, dict) else {}
            page = WB_PAGE.format(pid=record["wbProjectId"])
            page_status = requests.get(page, timeout=60, headers={"User-Agent": "nigtldcmap-v155 (data verification)"}).status_code
            entry["worldBankApi"] = {
                "url": url,
                "httpStatus": status,
                "pageUrl": page,
                "pageHttpStatus": page_status,
                "projectName": project.get("project_name"),
                "status": project.get("status"),
                "lendingInstrument": project.get("lendinginstr"),
                "borrower": project.get("borrower"),
                "implementingAgency": project.get("impagency"),
                "totalCommitmentUsd": project.get("totalcommamt"),
                "boardApprovalDate": project.get("boardapprovaldate"),
                "regionName": project.get("regionname"),
            }
        collected.append(entry)
        print(record["recordId"], record["wbProjectId"], (entry["iati"] or {}).get("locationCount"), (entry["worldBankApi"] or {}).get("lendingInstrument"), flush=True)
    write_json(COLLECT_PATH, {"schema": "v155-d022-iati-collect-1", "collectedAt": checked_at, "records": collected})


def finalize() -> None:
    names = ProvinceNames()
    collected = read_json(COLLECT_PATH)
    review = read_json(REVIEW_PATH)
    review_by_id = {item["recordId"]: item for item in review["records"]}
    commitments: dict[str, float] = {}
    records_out = []
    by_unit: dict[str, dict[str, Any]] = defaultdict(lambda: {"projectCount": 0, "commitmentUsdSum": 0.0, "recordIds": []})
    national_ids: list[str] = []
    pending_ids: list[str] = []
    url_checks: list[dict[str, Any]] = []
    total_names = 0
    unresolved_names = 0
    for entry in collected["records"]:
        rid = entry["recordId"]
        item = review_by_id[rid]
        iati_locations = (entry.get("iati") or {}).get("locations", [])
        use_iati = item.get("useIatiLocations", True)
        # Normalization is measured over the names actually used for mapping;
        # rejected placeholder/site names are listed separately per record.
        if use_iati:
            used = [loc for loc in iati_locations if normalize_text(loc["raw"]) != "socialist republic of vietnam"]
            total_names += len(used)
            unresolved_names += sum(1 for loc in used if loc["adm1Code"] is None)
        codes63 = sorted({loc["adm1Code"] for loc in iati_locations if loc["adm1Code"]}) if use_iati else []
        quoted = [names.resolve(name) for name in item.get("provincesQuoted", [])]
        total_names += len(quoted)
        unresolved_names += sum(1 for loc in quoted if loc["adm1Code"] is None)
        codes63_doc = sorted({loc["adm1Code"] for loc in quoted if loc["adm1Code"]})
        national = bool(item.get("national"))
        if national:
            confidence = "official-document"
            evidence = f"전국 사업 — {item.get('rationale')}"
            codes = []
        elif codes63:
            confidence = "official-location"
            evidence = f"IATI location({len(codes63)}개 성, precision 2) — World Bank 보고"
            if codes63_doc and set(codes63_doc) != set(codes63):
                extra = sorted(set(codes63_doc) - set(codes63))
                missing = sorted(set(codes63) - set(codes63_doc))
                evidence += f"; 사업문서 명시와 차이(문서에만 {extra}, IATI에만 {missing})"
            codes = codes63
            national = False
        elif codes63_doc:
            confidence = "official-document"
            evidence = f"World Bank 사업문서 명시({item.get('quoteSource')}): {item.get('quote')}"
            codes = codes63_doc
            national = False
        else:
            confidence = "pending"
            evidence = item.get("rationale") or "소재 성 미확인"
            codes = []
        pending = confidence == "pending"
        codes34 = sorted({names.to34[code] for code in codes})
        commitment = float(entry["commitmentUsd"]) if entry.get("commitmentUsd") not in (None, "") else None
        quote_status = None
        if item.get("quoteSource"):
            try:
                quote_status = requests.get(item["quoteSource"], timeout=60, headers={"User-Agent": "nigtldcmap-v155 (data verification)"}, stream=True).status_code
            except requests.RequestException:
                quote_status = 0
        checks = {
            "quoteSource": {"url": item.get("quoteSource"), "httpStatus": quote_status} if item.get("quoteSource") else None,
            "worldBankPage": {"url": entry["worldBankApi"]["pageUrl"], "httpStatus": item.get("pageHttpStatus", entry["worldBankApi"]["pageHttpStatus"])} if entry.get("worldBankApi") else None,
            "worldBankApi": {"url": entry["worldBankApi"]["url"], "httpStatus": entry["worldBankApi"]["httpStatus"]} if entry.get("worldBankApi") else None,
            "iati": {"url": entry["iati"]["url"], "httpStatus": entry["iati"]["httpStatus"]} if entry.get("iati") else None,
        }
        for check in checks.values():
            if check:
                url_checks.append(check)
        record = {
            "recordId": rid,
            "projectName": entry["projectName"],
            "agency": entry["agency"],
            "agencyType": entry["agencyType"],
            "wbProjectId": entry["wbProjectId"],
            "iatiId": entry["iatiId"],
            "lendingInstrument": (entry.get("worldBankApi") or {}).get("lendingInstrument"),
            "implementingAgency": entry["implementingAgency"],
            "periodStart": entry["periodStart"],
            "periodEnd": entry["periodEnd"],
            "commitmentUsd": commitment,
            "adm1Codes34": codes34,
            "adm1Names34": [names.name34[code] for code in codes34],
            "adm1Codes63": codes,
            "adm1Names63": [names.name63[code] for code in codes],
            "national": national,
            "pending": pending,
            "confidence": confidence,
            "evidence": evidence,
            "iatiLocationNames": [loc["raw"] for loc in iati_locations],
            "iatiLocationsUsed": use_iati and bool(codes63),
            "iatiUnresolvedNames": [loc["raw"] for loc in iati_locations if loc["adm1Code"] is None],
            "iatiLocationNote": item.get("iatiNote"),
            "documentProvinces": item.get("provincesQuoted", []),
            "documentQuote": item.get("quote"),
            "documentQuoteSource": item.get("quoteSource"),
            "reviewNote": item.get("note"),
            "sourceUrl": (entry.get("worldBankApi") or {}).get("pageUrl") or entry["csvLink"],
            "locationSourceUrl": (entry.get("iati") or {}).get("url"),
            "checkedAt": entry["checkedAt"],
            "reviewedAt": item.get("checkedAt", review.get("reviewedAt")),
            "urlChecks": checks,
        }
        records_out.append(record)
        if national:
            national_ids.append(rid)
        if pending:
            pending_ids.append(rid)
        for code34 in codes34:
            unit = by_unit[code34]
            unit["projectCount"] += 1
            unit["recordIds"].append(rid)
            if commitment is not None:
                unit["commitmentUsdSum"] += commitment
    mapped = sum(1 for record in records_out if record["adm1Codes34"] or record["national"])
    url_ok = sum(1 for check in url_checks if check["httpStatus"] == 200)
    aggregation = [
        {
            "adm1Code34": code,
            "adm1Name34": names.name34[code],
            "projectCount": unit["projectCount"],
            "commitmentUsdSum": round(unit["commitmentUsdSum"], 2),
            "recordIds": unit["recordIds"],
        }
        for code, unit in sorted(by_unit.items(), key=lambda item: (-item[1]["projectCount"], item[0]))
    ]
    values = []
    for unit in aggregation:
        values.append({"adm1Code34": unit["adm1Code34"], "adm1Name34": unit["adm1Name34"], "variable": "project-count", "period": "1997–2025", "value": unit["projectCount"], "unit": "건", "recordIds": unit["recordIds"], "mappingMethod": "reported-location-province", "imputed": False})
        values.append({"adm1Code34": unit["adm1Code34"], "adm1Name34": unit["adm1Name34"], "variable": "commitment-sum", "period": "1997–2025", "value": unit["commitmentUsdSum"], "unit": "USD", "recordIds": unit["recordIds"], "mappingMethod": "reported-location-province", "imputed": False})
    generated_at = collected["collectedAt"]
    output = {
        "schemaVersion": "v155-project-locations-1",
        "assetSchemaVersion": "v124-spatial-layer-1",
        "pending": True,
        "pendingNotice": "P6b가 map-index에 등록하기 전까지 spatial/layers 밖에 둡니다. 소재는 World Bank가 IATI로 보고한 location(성 단위)과 사업문서 명시 성·시만 사용했으며 좌표 추정·지오코딩은 하지 않았습니다.",
        "elementId": ELEMENT_ID,
        "countryIso3": "VNM",
        "boundarySystem": "post-2025-34",
        "boundaryPolicy": "native-34",
        "geometryUrl": "/data/vietnam/v2/geometry/vnm-adm1-34.geojson",
        "joinKey": "adm1Code34",
        "coverageKind": "partial",
        "aggregationRule": AGGREGATION_RULE,
        "selectors": {
            "defaultPeriod": "1997–2025",
            "defaultVariable": "project-count",
            "periods": ["1997–2025"],
            "variables": [
                {"key": "project-count", "label": "사업 수(소재 성 기준)", "unit": "건", "periods": ["1997–2025"], "maxFeatureCount": len(aggregation)},
                {"key": "commitment-sum", "label": "승인액 합계(USD, 다수 성 사업 전액 계상)", "unit": "USD", "periods": ["1997–2025"], "maxFeatureCount": len(aggregation)},
            ],
        },
        "values": values,
        "records": records_out,
        "aggregation": {"byAdm1Code34": aggregation, "nationalRecordIds": national_ids, "pendingRecordIds": pending_ids, "rule": AGGREGATION_RULE},
        "validation": {
            "recordCount": len(records_out),
            "mappedCount": mapped,
            "mappedRate": round(mapped / len(records_out), 4),
            "provinceMappedCount": sum(1 for record in records_out if record["adm1Codes34"]),
            "nationalCount": len(national_ids),
            "pendingCount": len(pending_ids),
            "nameCount": total_names,
            "unresolvedNameCount": unresolved_names,
            "nameNormalizationRate": round((total_names - unresolved_names) / total_names, 4) if total_names else None,
            "urlCheckCount": len(url_checks),
            "urlOkCount": url_ok,
            "urlOkRate": round(url_ok / len(url_checks), 4) if url_checks else None,
            "coordinatesPublished": False,
        },
        "source": {
            "csv": "/data/vietnam/v2/downloads/d-022.csv",
            "locationSource": "IATI Registry — d-portal (World Bank 보고 activity location, precision 2)",
            "locationApi": DPORTAL_Q.replace("{aid}", "<iati-identifier>"),
            "projectPages": WB_PAGE.replace("{pid}", "<P-number>"),
            "reviewFile": "tools/vietnam_spatial/source/d-022-review-v155.json",
        },
        "generatedAt": generated_at,
    }
    write_json(OUTPUT_PATH, output)
    report = {
        "schema": "v155-asset-report-1",
        "asset": "spatial/pending-v155/d-022-locations.json",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "validation": output["validation"],
        "aggregation": output["aggregation"],
        "records": [
            {k: record[k] for k in ("recordId", "wbProjectId", "projectName", "adm1Names34", "adm1Names63", "national", "pending", "confidence", "evidence", "iatiLocationNames", "documentProvinces")}
            for record in records_out
        ],
        "urlChecks": url_checks,
    }
    write_json(REPORT_PATH, report)
    print(json.dumps(output["validation"], ensure_ascii=False))
    for record in records_out:
        print(record["recordId"], record["wbProjectId"], record["confidence"], "national" if record["national"] else ", ".join(record["adm1Names34"]) or "-")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", choices=["collect", "finalize"], required=True)
    args = parser.parse_args()
    if args.stage == "collect":
        collect()
    else:
        finalize()


if __name__ == "__main__":
    main()
