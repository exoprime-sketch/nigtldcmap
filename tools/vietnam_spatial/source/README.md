# Viet Nam ADM1 63-unit canonical source

`vnm-adm1-63-source.geojson` is the tracked, normalized canonical boundary used
to reconstruct the public V124 geometry asset. `vnm-adm1-aliases-source.json`
is its deterministic join dictionary.

The pinned input is geoBoundaries VNM ADM1 boundary ID
`VNM-ADM1-63759600`, commit `9469f09`, boundary year 2008, and build date
2023-12-12. Its source SHA-256 is
`25dbc2fec9862016710118fc98042d3e803830c72361c91c4e864ae668fa9541`.
The source contains 64 shapes but 63 unique ADM1 codes: Côn Đảo and
Bà Rịa–Vũng Tàu both use `VN-43`. The builder preserves both real polygon
coordinate sets in one MultiPolygon for that ADM1 code. No coordinates are
generated, interpolated, or connected.

The source boundary metadata identifies the individual boundary as Public
Domain. geoBoundaries computer code and derivative works are distributed under
CC BY 4.0 and require attribution. Attribution used by this project:

> geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, build
> 2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866.

References:

- https://www.geoboundaries.org/api/current/gbOpen/VNM/ADM1/
- https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/VNM/ADM1/geoBoundaries-VNM-ADM1-metaData.json
- https://www.geoboundaries.org/
- https://doi.org/10.1371/journal.pone.0231866
- https://creativecommons.org/licenses/by/4.0/

Rebuild and validate with:

```text
python -m pip install -r tools/vietnam_spatial/requirements-adm1.txt
python tools/vietnam_spatial/build_adm1.py
```

# B-017 Aqueduct 4.0 Viet Nam unit capsule (V155-1)

`vnm-aqueduct40-baseline-annual-source.geojson.gz` is the deterministic
Viet Nam subset (`gid_0 = 'VNM'`, 443 units) of the WRI Aqueduct 4.0
`baseline_annual` feature class, with the identifier, area and score fields
used by `build_aqueduct_basins_v155.py`. Every coordinate is the source
coordinate; nothing is simplified, clipped or generated.

- Dataset: WRI Aqueduct 4.0 Water Risk Framework, release `Y2023M07D05`
- Dataset page: <https://www.wri.org/data/aqueduct-global-maps-40-data>
- Download: <https://files.wri.org/aqueduct/aqueduct-4-0-water-risk-data.zip>
  (261,527,511 bytes, SHA-256
  `bd3ed2bce88d6ff1b89191632ad134a2436e1e1d49599382f23a04d513624fc3`;
  the identical archive is kept in the read-only project source folder)
- Source layer: `Aqueduct40_waterrisk_download_Y2023M07D05/GDB/Aq40_Y2023D07M05.gdb`,
  `baseline_annual` (68,506 global polygons, EPSG:4326)
- Extracted: 2026-09-22 with pyogrio 0.13 / GDAL 3.12 (`OpenFileGDB` driver)
- Capsule SHA-256: `4137f04c86a22f230480e4fae49d119b0270316924d8f64f7707008e8bc6a2e5`
- License: CC BY 4.0. Attribution used by this project:

> WRI Aqueduct 4.0 Water Risk Framework (Kuzma et al. 2023), baseline annual,
> release 2023-07-05, CC BY 4.0. Unit polygons derive from HydroBASINS
> (Lehner & Grill 2013) and GADM 4.1.

Known source defects preserved as-is: unit `436707-VNM.23_1-1892` (Hải Phòng)
has an empty shape in the GDB (`Shape_Area = 0`) and is therefore absent from
the published geometry; unit `441059-VNM.7_1-None` has a ring self-intersection
that GEOS flags but MapLibre renders.

Rebuild (offline, from the capsule):

```text
python -m pip install -r tools/vietnam_spatial/requirements-v155.txt
python tools/vietnam_spatial/build_aqueduct_basins_v155.py
```

Pass `--gdb PATH --refresh` only to re-extract from the GDB and rewrite the capsule.

# A-027 / A-028 OpenStreetMap extract (V155-1, not vendored)

The road, rail, port, dam and reservoir assets are extracted from the Geofabrik
Viet Nam PBF with pyosmium. The 329 MB extract is too large to vendor; the
builders refuse any file other than the pinned one.

- Extract: `vietnam-260921.osm.pbf` (what `vietnam-latest.osm.pbf` resolved
  to on 2026-09-22), <https://download.geofabrik.de/asia/vietnam-260921.osm.pbf>
- Size 329,083,173 bytes, MD5 `8e8faf2eff113b67f28059c3b4a5c677`
  (Geofabrik-published), SHA-256
  `24611cc9e678432b3ec2e1928159a5305b985583272120e09a1814dd9266d2dc`
- OSM replication timestamp in the file header: 2026-09-21T20:21:51Z
- Downloaded 2026-09-22T03:17–03:27Z into `_source/vietnam/v155/osm/` (ignored)
- License: ODbL 1.0, attribution "© OpenStreetMap contributors"

Geofabrik keeps dated files for a limited time; if the dated URL is gone, the
pinned MD5 will not match a newer `latest` file and the builders stop instead
of silently producing a different asset.
