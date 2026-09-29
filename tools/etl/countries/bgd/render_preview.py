"""V158-B1: preview PNG of a country's ADM1 boundaries and candidate map points.

    python tools/etl/countries/bgd/render_preview.py --country bgd \
        --elements A-023,A-024 [--representative A-024] --out reports/v158/bgd-preview-v158.png

Reads only what the country tree already holds: the ADM1 GeoJSON named by the
registry (public/data/countries.json -> adm.level1.asset), the geometry manifest's
outline, and entity coordinates from the element packs. Region names come from
the platform's formatRegionName (src/data/geo/regionNameV161.ts, run through
node + sucrase), so the picture shows exactly what the screens will write.
Nothing is registered on the map; the picture is for the candidate review.
"""

from __future__ import annotations

import argparse
import base64
import gzip
import json
import pathlib
import subprocess
import sys
from collections import Counter
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Polygon as PolygonPatch  # noqa: E402
from shapely.geometry import Point, shape  # noqa: E402
from shapely.ops import unary_union  # noqa: E402

REPO = pathlib.Path(__file__).resolve().parents[4]
# Points this far outside the country outline count as outside (about 5 km at
# these latitudes); it absorbs the outline's simplification along the coast.
OUTSIDE_BUFFER_DEG = 0.05
FONT_CANDIDATES = ("Malgun Gothic", "Noto Sans KR", "Hancom Gothic")


def _read_json(path: pathlib.Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _decode(envelope: dict[str, Any]) -> dict[str, Any]:
    return json.loads(gzip.decompress(base64.b64decode("".join(envelope["payloadChunks"]))).decode("utf-8"))


def _region_names(iso3: str, raws: list[str]) -> dict[str, str]:
    """formatRegionName(full) for each raw name, from the TypeScript module itself."""
    script = (
        "require('sucrase/register/ts');"
        "const { formatRegionName } = require('./src/data/geo/regionNameV161.ts');"
        "const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));"
        "process.stdout.write(JSON.stringify(Object.fromEntries(input.raws.map((raw) =>"
        " [raw, formatRegionName({ country: input.iso3, raw, level: input.level })]))));"
    )
    result = subprocess.run(
        ["node", "-e", script],
        input=json.dumps({"iso3": iso3, "raws": raws, "level": "division"}),
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=REPO,
        check=True,
    )
    return json.loads(result.stdout)


def _polygons(geometry: Any) -> list[Any]:
    geom = shape(geometry)
    return list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]


def _draw(ax: Any, geometry: Any, **style: Any) -> None:
    for polygon in _polygons(geometry):
        ax.add_patch(PolygonPatch(list(polygon.exterior.coords), closed=True, **style))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--country", required=True)
    parser.add_argument("--elements", default="", help="comma-separated element ids whose points are drawn")
    parser.add_argument("--representative", default="", help="elements whose points stand for a line or area")
    parser.add_argument("--name-property", default="nameEn", help="feature property holding the source name")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    config = _read_json(REPO / "tools/etl/countries" / args.country.lower() / "country.json")
    registry = _read_json(REPO / "public/data/countries.json")
    entry = next(row for row in registry["countries"] if row["iso3"] == config["iso3"])
    public = REPO / "public"
    adm1 = _read_json(public / entry["adm"]["level1"]["asset"].lstrip("/"))
    geometry_dir = public / entry["dataRoot"].lstrip("/") / "geometry"
    manifest_path = geometry_dir / "geometry-manifest.json"
    outline = None
    adm1_entry: dict[str, Any] = {}
    if manifest_path.exists():
        manifest = _read_json(manifest_path)
        for item in manifest.get("files") or manifest.get("assets") or []:
            name = str(item.get("file") or item.get("url") or item.get("path") or "")
            if "outline" in name:
                outline = _read_json(geometry_dir / pathlib.Path(name).name)
            if name == entry["adm"]["level1"]["asset"]:
                adm1_entry = item

    for font in FONT_CANDIDATES:
        try:
            matplotlib.font_manager.findfont(font, fallback_to_default=False)
            plt.rcParams["font.family"] = font
            break
        except ValueError:
            continue
    plt.rcParams["axes.unicode_minus"] = False

    raws = [str(feature["properties"].get(args.name_property) or "") for feature in adm1["features"]]
    names = _region_names(entry["iso3"], raws)

    # Entity coordinates of the requested elements, straight from the packs.
    wanted = [item.strip().upper() for item in args.elements.split(",") if item.strip()]
    representative = {item.strip().upper() for item in args.representative.split(",") if item.strip()}
    data_root = public / entry["dataRoot"].lstrip("/")
    bundle = _read_json(data_root / "packs/bundle-index-v124.json")
    catalog = {row["elementId"]: row for row in _read_json(data_root / "catalog.json")["elements"]}
    points: dict[str, list[tuple[float, float]]] = {element_id: [] for element_id in wanted}
    for pack in bundle["packs"]:
        if not set(pack["elementIds"]) & set(wanted):
            continue
        content = _decode(_read_json(public / pack["packUrl"].lstrip("/")))
        for element_id in set(pack["elementIds"]) & set(wanted):
            for record in content["elements"][element_id]["entities"]["records"]:
                lat, lon = record.get("latitude"), record.get("longitude")
                if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
                    points[element_id].append((float(lon), float(lat)))

    fig, ax = plt.subplots(figsize=(11, 13), dpi=150)
    palette = plt.get_cmap("Pastel1")
    for index, feature in enumerate(adm1["features"]):
        _draw(ax, feature["geometry"], facecolor=palette(index % 9), edgecolor="#4b5563", linewidth=0.8, alpha=0.9)
    if outline:
        for feature in outline["features"]:
            _draw(ax, feature["geometry"], facecolor="none", edgecolor="#111827", linewidth=1.4)
    for feature, raw in zip(adm1["features"], raws):
        anchor = shape(feature["geometry"]).representative_point()
        ax.text(anchor.x, anchor.y, names.get(raw, raw), ha="center", va="center", fontsize=11, weight="bold", zorder=5,
                color="#111827", bbox={"boxstyle": "round,pad=0.25", "facecolor": "white", "alpha": 0.85, "linewidth": 0})

    # tab20 holds dark/light pairs; take every dark shade before any light one.
    tab20 = plt.get_cmap("tab20")
    colours = lambda index: tab20((index * 2) % 20 + (index * 2 // 20) % 2)
    counts = Counter()
    bbox = entry.get("bbox") or [None, None, None, None]
    outside = Counter()
    land = unary_union([shape(feature["geometry"]) for feature in (outline or adm1)["features"]]).buffer(OUTSIDE_BUFFER_DEG)
    for index, element_id in enumerate(wanted):
        coords = points[element_id]
        if not coords:
            continue
        counts[element_id] = len(coords)
        for lon, lat in coords:
            if not land.contains(Point(lon, lat)):
                outside[element_id] += 1
        xs, ys = zip(*coords)
        hollow = element_id in representative
        label = str(catalog.get(element_id, {}).get("elementLabel", "")).split("[")[0].strip()
        ax.scatter(xs, ys, s=10 if len(coords) > 300 else 18, marker="o",
                   facecolors="none" if hollow else colours(index), edgecolors=colours(index),
                   linewidths=0.9, alpha=0.9, zorder=3,
                   label=f"{element_id} {label[:24]} ({len(coords):,}건 · 지점 {len(set(coords)):,}{' · 대표점' if hollow else ''})")

    if bbox[0] is not None:
        pad = 0.25
        ax.set_xlim(bbox[0] - pad, bbox[2] + pad)
        ax.set_ylim(bbox[1] - pad, bbox[3] + pad)
    ax.set_aspect("equal")
    ax.set_xlabel("경도")
    ax.set_ylabel("위도")
    title = f"{entry['nameKo']} {len(adm1['features'])}개 {entry['adm']['level1'].get('label', '')} 경계"
    if counts:
        title += f" · 지도 후보 좌표 기록 {sum(counts.values()):,}건(등록 전 미리보기)"
    ax.set_title(title, fontsize=14, weight="bold")
    if counts:
        ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1.0), fontsize=8, frameon=True, framealpha=0.95, markerscale=1.6)
    members = sum(len(feature["properties"].get("memberDistricts") or []) for feature in adm1["features"])
    level_label = entry["adm"]["level1"].get("label", "")
    notes = [
        f"경계: {adm1_entry.get('attribution', '')} · 구 {members}개를 소속 {level_label}별로 합성"
        + (f", 단순화 {adm1_entry['simplificationToleranceDeg']}°" if adm1_entry.get("simplificationToleranceDeg") else "")
        + " · 지명: formatRegionName(한글명 (현지명))"
    ]
    if representative & set(counts):
        notes.append("속 빈 점 = 선·면을 대신하는 대표점(실제 경로·경계 아님)")
    if outside:
        notes.append(f"국가 윤곽에서 {OUTSIDE_BUFFER_DEG}° 밖 좌표(그림 범위 밖은 보이지 않음): " + ", ".join(f"{k} {v}" for k, v in sorted(outside.items())))
    fig.text(0.01, 0.005, "\n".join(notes), fontsize=7.5, color="#374151", ha="left", va="bottom")
    out = REPO / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, bbox_inches="tight")
    print(json.dumps({"out": str(out.relative_to(REPO)), "divisions": len(adm1["features"]), "names": names,
                      "points": dict(counts), "outsideBbox": dict(outside)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
